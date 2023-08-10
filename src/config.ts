/// <reference path="phosphorus.ts" />

namespace P.config {
  export var debug = false;
  export var useWebGL = false;
  export var supportVideoSensing = false;
  export var experimentalOptimizations = false;
  export var scale = window.devicePixelRatio || 1;
  export var PROJECT_API: string = 'https://scratch-projects.scratch.org/$id';
}
