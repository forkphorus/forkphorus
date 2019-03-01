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

  export function fetch(url, opts?) {
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
  };

  export function fileAsArrayBuffer(file) {
    const fileReader = new FileReader();

    return new Promise((resolve, reject) => {
      fileReader.onloadend = function() {
        resolve(fileReader.result);
      };

      fileReader.onerror = function(err) {
        reject('Failed to load file');
      };

      fileReader.onprogress = function(progress) {
        progressHooks.set(progress);
      };

      fileReader.readAsArrayBuffer(file);
    });
  };
};
