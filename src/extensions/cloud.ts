/// <reference path="../phosphorus.ts" />
/// <reference path="extension.ts" />

namespace P.ext.cloud {
  export interface CloudHandler extends P.ext.Extension {
    variableChanged(name: string): void;
  }

  // We aim for about 15 updates per second.
  // This is more than what Scratch does, I believe.
  const UPDATE_INTERVAL = 1000 / 15;

  export function getAllCloudVariables(stage: P.core.Stage) {
    const result = {};
    for (const variable of stage.cloudVariables) {
      result[variable] = stage.vars[variable];
    }
    return result;
  }

  interface CloudDataMessage {
    method: string;
  }

  interface CloudSetMessage {
    method: 'set';
    name: string;
    value: string;
  }

  function isCloudDataMessage(data: unknown): data is CloudDataMessage {
    if (typeof data !== 'object' || !data) {
      return false;
    }
    return typeof (data as CloudDataMessage).method === 'string';
  }

  function isCloudSetMessage(data: unknown): data is CloudSetMessage {
    return isCloudDataMessage(data) &&
      typeof (data as CloudSetMessage).name === 'string' &&
      typeof (data as CloudSetMessage).value !== 'undefined';
  }

  /**
   * Implements cloud variables over WebSocket.
   * Intended Server Code: https://github.com/forkphorus/cloud-server
   * Protocol docs: https://github.com/forkphorus/cloud-server/blob/master/doc/protocol.md
   */
  export class WebSocketCloudHandler extends P.ext.Extension implements CloudHandler {
    private readonly logPrefix: string;
    private hosts: string[];
    private ws: WebSocket | null = null;
    private queuedVariableChanges: string[] = [];
    private updateInterval: number | null = null;
    private reconnectTimeout: number | null = null;
    private shouldReconnect: boolean = true;
    private failures: number = 0;
    private username: string;
    private interfaceStatusIndicator: HTMLElement;
    private hideStatusTimeout: number;

    constructor(stage: P.core.Stage, hosts: string[] | string, private id: string) {
      super(stage);
      this.hosts = Array.isArray(hosts) ? hosts : [hosts];
      this.logPrefix = '[cloud-ws ' + this.hosts[0] + ']';
      this.username = this.stage.username;

      this.interfaceStatusIndicator = document.createElement('div');
      this.interfaceStatusIndicator.className = 'phosphorus-cloud-status-indicator';
      stage.ui.appendChild(this.interfaceStatusIndicator);

      this.handleUpdateInterval = this.handleUpdateInterval.bind(this);
      this.connect();
    }

    variableChanged(name: string): void {
      if (this.queuedVariableChanges.indexOf(name) > -1) {
        // already queued, do not add again
        return;
      }
      this.queuedVariableChanges.push(name);
      if (this.updateInterval === null) {
        // handle first change immediately, reduces latency on the first set
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
      if (this.ws === null || this.ws.readyState !== this.ws.OPEN || this.ws.bufferedAmount > 16384) {
        // do not try to send data if there is no connection or if we are significantly backlogged on data sending
        // this condition is likely to be temporary so don't stop the interval
        return;
      }
      const variableName = this.queuedVariableChanges.shift()!;
      const value = this.getVariable(variableName);
      this.send({
        method: 'set',
        name: variableName,
        value: value,
      });
    }

    private send(data: any) {
      if (!this.ws) return;
      this.ws.send(JSON.stringify(data));
    }

    private getVariable(name: string): string {
      return this.stage.vars[name];
    }

    private setVariable(name: string, value: string): void {
      this.stage.vars[name] = value;
    }

    private terminateConnection(code: number = 1000) {
      // 1000 is Normal Closure
      if (this.ws !== null) {
        this.ws.close(code);
        this.ws = null;
      }
    }

    private connect() {
      if (this.ws !== null) {
        throw new Error('already connected');
      }

      this.setStatusText('Connecting...');
      console.log(this.logPrefix, 'connecting');
      this.ws = new WebSocket(this.hosts[this.failures % this.hosts.length]);
      this.shouldReconnect = true;

      this.ws.onopen = () => {
        console.log(this.logPrefix, 'connected');

        this.setStatusText('Connected');
        this.setStatusVisible(false);

        this.failures = 0;

        this.send({
          method: 'handshake',
          project_id: this.id,
          user: this.username
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
          // Update variable watchers
          if (!this.stage.runtime.isRunning) {
            this.stage.draw();
          }
        } catch (err) {
          console.warn('error parsing cloud server message', e.data, err);
        }
      };

      this.ws.onclose = (e) => {
        const code = e.code;
        this.ws = null;
        console.warn(this.logPrefix, 'closed', code);
        // https://github.com/TurboWarp/cloud-server/blob/master/doc/protocol.md
        if (code === 4002) {
          this.setStatusText('Username is invalid. Change your username to connect.');
          this.hideStatusAfterDelay();
          console.error(this.logPrefix, 'error: Username');
        } else if (code === 4004) {
          this.setStatusText('Cloud variables are disabled for this project.');
          this.hideStatusAfterDelay();
          console.error(this.logPrefix, 'error: Project is disabled.');
        } else {
          this.reconnect();
        }
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
      this.terminateConnection();
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      } else {
        // only increase failures in the case of an actual failure
        // rescheduling a reconnect is not a failure
        this.failures++;
      }
      this.setStatusText('Connection lost, reconnecting...');
      const delayTime = 2 ** this.failures * 1000 * Math.random();
      console.log(this.logPrefix, 'reconnecting in', delayTime);
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectTimeout = null;
        this.connect();
      }, delayTime);
    }

    private disconnect() {
      console.log(this.logPrefix, 'disconnecting');
      this.shouldReconnect = false;
      this.terminateConnection();
    }

    private handleMessage(data: unknown) {
      if (!isCloudSetMessage(data)) {
        return;
      }
      const { name: variableName, value } = data;
      if (this.stage.cloudVariables.indexOf(variableName) === -1) {
        throw new Error('invalid variable name');
      }
      this.setVariable(variableName, value);
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

    private setStatusText(text: string) {
      this.interfaceStatusIndicator.textContent = `☁ ${text}`;
      this.setStatusVisible(true);
    }

    private setStatusVisible(visible: boolean) {
      clearTimeout(this.hideStatusTimeout);
      this.interfaceStatusIndicator.classList.toggle('phosphorus-cloud-status-indicator-hidden', !visible);
    }

    hideStatusAfterDelay() {
      this.hideStatusTimeout = setTimeout(() => {
        this.setStatusVisible(false);
      }, 4000);
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

    update() {
      if (this.stage.username !== this.username) {
        console.log(this.logPrefix, 'username changed to', this.stage.username);
        this.username = this.stage.username;
        this.terminateConnection(4100); // Username Change
        this.reconnect();
      }
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
