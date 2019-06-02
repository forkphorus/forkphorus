/// <reference path="phosphorus.ts" />

// IO helpers and hooks

namespace P.IO {
  // Hooks that can be replaced by other scripts to hook into progress reports.
  export const progressHooks = {
    // Indicates that a new task has started
    new() {},
    // Indicates that a task has finished successfully
    end() {},
    // Sets the current progress, should override new() and end()
    set(p) {},
    // Indicates an error has occurred and the project will likely fail to load
    error(error) {},
  };

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

  interface RequestOptions {
    local?: boolean;
  }

  export abstract class Request<T> {
    public url: string;

    constructor(url: string, options: RequestOptions = {}) {
      if (options.local) {
        url = config.localPath + url;
      }
      this.url = url;
    }

    /**
     * Attempts to load this request.
     */
    load(): Promise<T> {
      // We attempt to load twice, which I hope will fix random loading errors from failed fetches.
      return new Promise((resolve, reject) => {
        const attempt = (callback: (err: any) => void) => {
          this._load()
            .then((response) => {
              resolve(response);
              progressHooks.end();
            })
            .catch((err) => callback(err));
        };
        progressHooks.new();
        attempt(function() {
          // try once more
          attempt(function(err) {
            reject(err);
          });
        });
      });
    }

    protected abstract _load(): Promise<T>;
  }

  abstract class XHRRequest<T> extends Request<T> {
    protected _load(): Promise<T> {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('load', () => {
          resolve(xhr.response);
        });
        xhr.addEventListener('error', (err) => {
          reject(err);
        });
        xhr.responseType = this.type as XMLHttpRequestResponseType;
        xhr.open('GET', this.url);
        xhr.send();
      });
    }

    protected abstract get type(): string;
  }

  export class ArrayBufferRequest extends XHRRequest<ArrayBuffer> {
    protected get type() { return 'arraybuffer'; }
  }
  export class TextRequest extends XHRRequest<string> {
    protected get type() { return 'text'; }
  }
  export class JSONRequest extends XHRRequest<any> {
    protected get type() { return 'json'; }
  }

  /**
   * Read a file as an ArrayBuffer
   */
  export function fileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    const fileReader = new FileReader();

    return new Promise((resolve, reject) => {
      fileReader.onloadend = function() {
        resolve(fileReader.result as ArrayBuffer);
      };

      fileReader.onerror = function(err) {
        reject('Failed to load file');
      };

      fileReader.onprogress = function(progress) {
        progressHooks.set(progress);
      };

      fileReader.readAsArrayBuffer(file);
    });
  }
}
