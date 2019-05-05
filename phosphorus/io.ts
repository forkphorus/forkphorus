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

  const useLocalFetch: boolean = ['http:', 'https:'].indexOf(location.protocol) > -1;
  const localCORSFallback: string = 'https://forkphorus.github.io';

  /**
   * Fetch a remote URL
   */
  export function fetchRemote(url: string, opts?: any) {
    progressHooks.new();
    return window.fetch(url, opts)
      .then((r) => {
        progressHooks.end();
        return r;
      })
      .catch((err) => {
        progressHooks.error(err);
        throw err;
      });
  }

  /**
   * Fetch a local file path, relative to phosphorus.
   */
  export function fetchLocal(path: string, opts?: any) {
    // If for some reason fetching cannot be done locally, route the requests to forkphorus.github.io
    // (where is more likely to be allowed)
    if (!useLocalFetch) {
      path = localCORSFallback + path;
    }
    return fetchRemote(path, opts);
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
