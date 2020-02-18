/// <reference path="phosphorus.ts" />

// IO helpers and hooks

namespace P.io {
  /**
   * Configuration of IO behavior
   */
  export var config = {
    /**
     * A relative or absolute path to a full installation of forkphorus, from which "local" files can be fetched.
     * Do not including a trailing slash.
     */
    localPath: '',
  };

  // non-http/https protocols cannot xhr request local files, so utilize forkphorus.github.io instead
  if (['http:', 'https:'].indexOf(location.protocol) === -1) {
    config.localPath = 'https://forkphorus.github.io';
  }

  /**
   * Utilities for asynchronously reading Blobs or Files
   */
  export namespace readers {
    type Readable = Blob | File;

    export function toArrayBuffer(object: Readable): Promise<ArrayBuffer> {
      return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onloadend = function() {
          resolve(fileReader.result as ArrayBuffer);
        };
        fileReader.onerror = function(err) {
          reject('Could not read object');
        };
        fileReader.onprogress = function(progress) {

        };
        fileReader.readAsArrayBuffer(object);
      });
    }

    export function toDataURL(object: Readable): Promise<string> {
      return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onloadend = function() {
          resolve(fileReader.result as string);
        };
        fileReader.onerror = function(err) {
          reject('Could not read object');
        };
        fileReader.onprogress = function(progress) {

        };
        fileReader.readAsDataURL(object);
      });
    }

    export function toText(object: Readable): Promise<string> {
      return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onloadend = function() {
          resolve(fileReader.result as string);
        };
        fileReader.onerror = function(err) {
          reject('Could not read object');
        };
        fileReader.onprogress = function(progress) {

        };
        fileReader.readAsText(object);
      });
    }
  }

  interface IOManager {
    loadArrayBuffer(src: string): Promise<ArrayBuffer>;
    loadBlob(src: string): Promise<Blob>;
  }

  class FetchingIOManager implements IOManager {
    loadArrayBuffer(src: string) {
      return new Request(config.localPath + src).load('arraybuffer');
    }

    loadBlob(src: string) {
      return new Request(config.localPath + src).load('blob');
    }
  }

  // This is the intended way to get the IO manager.
  var globalIOManager = new FetchingIOManager();
  export function getIOManager() {
    return globalIOManager;
  }
  export function setIOManager(newManager: IOManager) {
    globalIOManager = newManager;
  }

  interface Task {
    /**
     * Return whether this task is known to be complete.
     */
    isComplete(): boolean;
    /**
     * Return the "work" of this task.
     * This value could represent anything but usually represents something akin to bytes of a download.
     */
    isWorkComputable(): boolean;
    /**
     * Return the total amount of work to complete this task.
     * Should return 0 if isLengthKnown() === false
     * Should be same as getFinishedWork() when isComplete() === true.
     */
    getTotalWork(): number;
    /**
     * Amount of work already performed.
     * Should return 0 if isLengthKnown() === false.
     * Should be same as getTotalWork() when isComplete() === true.
     */
    getCompletedWork(): number;
    /**
     * Cancel this task.
     */
    abort(): void;
    /**
     * Used by the loader to claim ownership and allow 2-way communication.
     */
    setLoader(loader: Loader): void;
  }

  export abstract class AbstractTask implements Task {
    protected loader: Loader | undefined;

    setLoader(loader: Loader) {
      this.loader = loader;
    }

    protected updateLoaderProgress() {
      if (this.loader) {
        this.loader.updateProgress();
      }
    }

    abstract isComplete(): boolean;
    abstract isWorkComputable(): boolean;
    abstract getTotalWork(): number;
    abstract getCompletedWork(): number;
    abstract abort(): void;
  }

  export class Request extends AbstractTask {
    private static readonly acceptableResponseCodes = [0, 200];

    private shouldIgnoreErrors: boolean = false;
    private workComputable: boolean = false;
    private totalWork: number = 0;
    private completedWork: number = 0;
    private complete: boolean = false;
    private status: number = 0;

    constructor(private readonly url: string) {
      super();
    }

    isComplete() {
      return this.complete;
    }
    isWorkComputable() {
      return this.workComputable;
    }
    getTotalWork() {
      return this.totalWork;
    }
    getCompletedWork() {
      return this.completedWork;
    }
    abort() {

    }

    ignoreErrors(): this {
      this.shouldIgnoreErrors = true;
      return this;
    }

    getStatus(): number {
      return this.status;
    }

    private updateProgress(event: ProgressEvent) {
      this.workComputable = event.lengthComputable;
      this.totalWork = event.total;
      this.completedWork = event.loaded;
      this.updateLoaderProgress();
    }

    load(type: 'arraybuffer'): Promise<ArrayBuffer>;
    load(type: 'json'): Promise<any>;
    load(type: 'text'): Promise<string>;
    load(type: 'blob'): Promise<Blob>;
    load(type: XMLHttpRequestResponseType): Promise<any> {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.addEventListener('load', () => {
          this.status = xhr.status;
          if (Request.acceptableResponseCodes.indexOf(xhr.status) !== -1 || this.shouldIgnoreErrors) {
            resolve(xhr.response);
          } else {
            reject(new Error(`HTTP Error ${xhr.status} while downloading ${this.url}`));
          }
        });

        xhr.addEventListener('progress', (e) => {
          this.updateProgress(e);
        });

        xhr.addEventListener('loadstart', (e) => {
          this.updateProgress(e);
        });

        xhr.addEventListener('loadend', (e) => {
          this.complete = true;
          this.updateProgress(e);
        });

        xhr.addEventListener('error', (err) => {
          reject(`Error while downloading ${this.url} (error) (${xhr.status})`);
        });

        xhr.addEventListener('abort', (err) => {
          reject(`Error while downloading ${this.url} (abort) (${xhr.status})`);
        });

        xhr.open('GET', this.url);
        xhr.responseType = type;
        setTimeout(xhr.send.bind(xhr));
      });
    }
  }

  export class Manual extends AbstractTask {
    private complete: boolean = false;
    private aborted: boolean = false;

    markComplete(): void {
      this.complete = true;
      this.updateLoaderProgress();
    }

    isComplete(): boolean {
      return this.complete;
    }

    isWorkComputable(): boolean {
      return false;
    }

    getTotalWork(): number {
      return 0;
    }

    getCompletedWork(): number {
      return 0;
    }

    abort(): void {
      this.aborted = true;
    }
  }

  export class PromiseTask extends Manual {
    constructor(promise: Promise<unknown>) {
      super();
      promise.then(() => this.markComplete());
    }
  }

  export class Loader {
    private _tasks: Task[] = [];
    public aborted: boolean = false;
    public error: boolean = false;

    constructor() {

    }

    private calculateProgress(): number {
      if (this.aborted) {
        return 1;
      }

      const totalTasks = this._tasks.length;
      if (totalTasks === 0) {
        return 0;
      }

      // Analyze the tasks and record known information.
      // This will impact how progress is determined later.
      let totalWork = 0;
      let completedWork = 0;
      let finishedTasks = 0;
      let uncomputable = 0;

      for (const task of this._tasks) {
        if (task.isComplete()) {
          finishedTasks++;
        }
        if (task.isWorkComputable()) {
          completedWork += task.getCompletedWork();
          totalWork += task.getTotalWork();
        } else {
          uncomputable++;
        }
      }

      // If there is no known total work (all uncomputable), then use a simple done/not done division.
      if (totalWork === 0) {
        return finishedTasks / totalTasks;
      }

      // If there are some unknown tasks, we will attempt to extrapolate their value.
      if (uncomputable > 0) {
        const averageWork = totalWork / (totalTasks - uncomputable) * uncomputable;
        totalWork = 0;
        completedWork = 0;

        for (const task of this._tasks) {
          if (task.isWorkComputable()) {
            completedWork += task.getCompletedWork();
            totalWork += task.getTotalWork();
          } else {
            totalWork += averageWork;
            if (task.isComplete()) completedWork += averageWork;
          }
        }
      }

      return completedWork / totalWork;
    }

    updateProgress() {
      if (this.error) {
        return;
      }
      const progress = this.calculateProgress();
      this.onprogress(progress);
    }

    onprogress(progress: number) {

    }

    resetTasks() {
      this._tasks = [];
      this.updateProgress();
    }

    addTask<T extends Task>(task: T): T {
      this._tasks.push(task);
      task.setLoader(this);
      return task;
    }

    abort() {
      this.aborted = true;
      for (const task of this._tasks) {
        task.abort();
      }
    }
  }
}
