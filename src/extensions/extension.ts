/// <reference path="../phosphorus.ts" />

namespace P.ext {
  export abstract class Extension {
    public stage: P.core.Stage;

    constructor(stage: P.core.Stage) {
      this.stage = stage;
    }

    /**
     * Delete this extension.
     */
    destroy() {

    }

    /**
     * Called when the project is started or resumed
     */
    onstart() {

    }

    /**
     * Called when the project is paused
     */
    onpause() {

    }

    /**
     * Called at the end of every frame
     */
    update() {

    }
  }
}
