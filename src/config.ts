/// <reference path="phosphorus.ts" />

namespace P.config {
  export const debug = true; // DEBUG: Always enable debug mode
  export var useWebGL = false;
  export var supportVideoSensing = false;
  export var experimentalOptimizations = false;
  export var scale = window.devicePixelRatio || 1;
  export var PROJECT_API: string = 'https://projects.scratch.mit.edu/$id';
}
