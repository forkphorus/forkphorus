/// <reference path="phosphorus.ts" />

// IO helpers and hooks

namespace P.IO {
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
        if (url.indexOf('data:') !== 0) {
          url = config.localPath + url;
        }
      }
      this.url = url;
    }

    /**
     * Attempts to load this request.
     */
    load(): Promise<T> {
      return new Promise((resolve, reject) => {
        const attempt = (errorCallback: (err: any) => void) => {
          this._load()
            .then((response) => {
              resolve(response);
            })
            .catch((err) => {
              errorCallback(err);
            });
        };
        attempt((err) => {
          // try once more after a short delay
          console.warn(`First attempt to download ${this.url} failed, trying again (${err})`);
          setTimeout(function() {
            attempt((err) => {
              reject(err);
            });
          }, 250);
        });
      });
    }

    protected abstract _load(): Promise<T>;
  }

  export abstract class XHRRequest<T> extends Request<T> {
    public xhr: XMLHttpRequest = new XMLHttpRequest();
    public static acceptableResponseCodes = [0, 200];

    protected _load(): Promise<T> {
      return new Promise((resolve, reject) => {
        const xhr = this.xhr;
        xhr.addEventListener('load', () => {
          if (XHRRequest.acceptableResponseCodes.indexOf(xhr.status) !== -1) {
            resolve(xhr.response);
          } else {
            reject(new Error(`HTTP Error ${xhr.status} while downloading ${this.url}`));
          }
        });
        xhr.addEventListener('error', () => {
          reject(`Error while downloading ${this.url} (onerror) (${xhr.status} ${xhr.statusText})`);
        });
        xhr.addEventListener('abort', () => {
          reject(`Error while downloading ${this.url} (onabort) (${xhr.status} ${xhr.statusText})`);
        });
        xhr.open('GET', this.url);
        xhr.responseType = this.type as XMLHttpRequestResponseType;
        setTimeout(xhr.send.bind(xhr));
      });
    }

    protected abstract get type(): string;
  }

  export class ArrayBufferRequest extends XHRRequest<ArrayBuffer> {
    protected get type() { return 'arraybuffer'; }
  }
  export class BlobRequest extends XHRRequest<Blob> {
    protected get type() { return 'blob'; }
  }
  export class TextRequest extends XHRRequest<string> {
    protected get type() { return 'text'; }
  }
  export class JSONRequest extends XHRRequest<any> {
    protected get type() { return 'json'; }
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
}
