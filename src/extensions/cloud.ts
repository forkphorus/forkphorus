/// <reference path="../phosphorus.ts" />
/// <reference path="extension.ts" />

namespace P.ext.cloud {
  const enum State {
    Disconnected,
    Connecting,
    Connected,
    Error,
  }

  export interface CloudHandler extends P.ext.Extension {
    variableChanged(name: string): void;
  }

  // We aim for about 15 updates per second.
  // This is more than what Scratch does, I believe.
  const UPDATE_INTERVAL = 1000 / 15;

  export function getAllCloudVariables(stage: P.core.Stage) {
    const result = {};
    for (const variable of stage.cloudVariables) {
      result[variable] = stage.vars[variable] + '';
    }
    return result;
  }

  interface CloudDataMessage {
    kind: string;
  }

  interface CloudSetMessage {
    kind: 'set';
    var: string;
    value: string;
  }

  function isCloudDataMessage(data: unknown): data is CloudDataMessage {
    if (typeof data !== 'object' || !data) {
      return false;
    }
    return typeof (data as CloudDataMessage).kind === 'string';
  }

  function isCloudSetMessage(data: unknown): data is CloudSetMessage {
    return isCloudDataMessage(data) && typeof (data as CloudSetMessage).var === 'string' && typeof (data as CloudSetMessage).value === 'string';
  }

  export class WebSocketCloudHandler extends P.ext.Extension implements CloudHandler {
    private updateInterval: number | null = null;
    private queuedVariableChanges: string[] = [];
    private ws: WebSocket | null = null;
    private readonly logPrefix: string;
    private shouldReconnect: boolean = true;
    private failures: number = 0;

    constructor(stage: P.core.Stage, private host: string, private id: string) {
      super(stage);
      this.logPrefix = '[cloud-ws ' + host + ']';
      this.handleUpdateInterval = this.handleUpdateInterval.bind(this);
      this.connect = this.connect.bind(this);
      this.connect();
    }

    variableChanged(name: string): void {
      if (this.queuedVariableChanges.indexOf(name) > -1) {
        // already queued, do not add again
        return;
      }
      this.queuedVariableChanges.push(name);
      if (this.updateInterval === null) {
        // handle first change immediately, reduces latency on one-off sets
        this.handleUpdateInterval();
        this.startUpdateInterval();
      }
    }

    private handleUpdateInterval() {
      if (this.queuedVariableChanges.length === 0) {
        // no further changes, interval can stop
        this.stopUpdateInterval();
        return;
      }
      if (this.ws === null || this.ws.readyState !== this.ws.OPEN) {
        // no connection
        // we will hope that the connection will become available in the near future and keep checking
        return;
      }
      const variableName = this.queuedVariableChanges.shift()!;
      const value = this.getVariable(variableName);
      this.send({
        kind: 'set',
        var: variableName,
        value: value,
      });
    }

    private send(data: any) {
      if (!this.ws) throw new Error('not connected');
      this.ws.send(JSON.stringify(data));
    }

    private getVariable(name: string): string {
      return this.stage.vars[name] + '';
    }

    private setVariable(name: string, value: string): void {
      this.stage.vars[name] = value;
    }

    private connect() {
      if (this.ws !== null) {
        throw new Error('already connected');
      }

      console.log(this.logPrefix, 'connecting');
      this.ws = new WebSocket(this.host);

      this.ws.onopen = () => {
        console.log(this.logPrefix, 'connected');
        
        // after a successful connection we can reset the failures counter
        this.failures = 0;

        // send the handshake
        this.send({
          kind: 'handshake',
          id: this.id,
          username: this.stage.username,
          variables: getAllCloudVariables(this.stage),
        });
      };

      this.ws.onmessage = (e) => {
        try {
          // Each line of the message is treated as a separate JSON-encoded message.
          // This is not a JSON list.
          const lines = e.data.split('\n');
          for (const line of lines) {
            const data = JSON.parse(line);
            this.handleMessage(data);
          }
        } catch (e) {
          console.warn('error parsing cloud server message', e.data, e);
          return;
        }
      };

      this.ws.onclose = (e) => {
        console.warn(this.logPrefix, 'closed', e.code, e.reason);
        // TODO: do not reconnect after certain errors
        this.reconnect();
      };

      this.ws.onerror = (e) => {
        console.warn(this.logPrefix, 'error', e);
        // onclose is called after onerror
      };
    }

    private reconnect() {
      if (!this.shouldReconnect) {
        return;
      }
      if (this.ws !== null) {
        this.ws.close();
        this.ws = null;
      }
      this.failures++;
      const delayTime = this.getBackoffTime();
      console.log(this.logPrefix, 'reconnecting in', delayTime);
      setTimeout(this.connect, delayTime);
    }

    private disconnect() {
      console.log(this.logPrefix, 'disconnecting');
      this.shouldReconnect = false;
      if (this.ws !== null) {
        this.ws.close();
        this.ws = null;
      }
    }

    private handleMessage(data: unknown) {
      if (!isCloudSetMessage(data)) {
        return;
      }
      const { var: variableName, value } = data;
      if (this.stage.cloudVariables.indexOf(variableName) === -1) {
        throw new Error('invalid variable name');
      }
      this.setVariable(variableName, value);
    }

    private getBackoffTime(): number {
      // TODO: add randomness
      return 2 ** this.failures * 1000;
    }

    private startUpdateInterval() {
      if (this.updateInterval !== null) {
        return;
      }
      this.updateInterval = setInterval(this.handleUpdateInterval, UPDATE_INTERVAL);
    }

    private stopUpdateInterval() {
      if (this.updateInterval === null) {
        return;
      }
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    onstart() {
      // project may have been paused & resumed with queued changes
      if (this.queuedVariableChanges.length > 0) {
        this.startUpdateInterval();
      }
    }

    onpause() {
      this.stopUpdateInterval();
    }

    destroy() {
      this.stopUpdateInterval();
      this.disconnect();
    }
  }

  export class LocalStorageCloudHandler extends P.ext.Extension implements CloudHandler {
    private storageKey: string;

    // In some browser configurations, localStorage does not exist or accessing it results in an error.
    // To accommodate these scenarios, all localStorage operations MUST be wrapped in a try/catch

    constructor(stage: P.core.Stage, id: string) {
      super(stage);
      this.storageKey = 'cloud-data:' + id;
      this.load();
      this.save = this.save.bind(this);
    }

    variableChanged(name: string): void {
      // TODO: see whether delaying these save operations is good for performance
      // if a variable is changed 10 times in 1 frame, it would not make sense to save it 10 times
      this.save();
    }

    private load() {
      try {
        const savedData = localStorage.getItem(this.storageKey);
        if (savedData === null) {
          // no saved data, that's fine, ignore
          return;
        }
        const parsedData = JSON.parse(savedData);
        for (const key of Object.keys(parsedData)) {
          if (this.stage.cloudVariables.indexOf(key) > -1) {
            this.stage.vars[key] = parsedData[key];
          }
        }
      } catch (e) {
        console.warn('cannot read from localStorage', e);
      }
    }

    private save() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(getAllCloudVariables(this.stage)));
      } catch (e) {
        console.warn('cannot save to localStorage', e);
      }
    }
  }
}
