/// <reference path="phosphorus.ts" />

namespace P.config {
  export var debug = false;
  export var useWebGL = false;
  export var supportVideoSensing = false;
  export var experimentalOptimizations = false;
  export var scale = window.devicePixelRatio || 1;
  export var PROJECT_API: string = 'https://projects.scratch.mit.edu/$id';

  // Firefox's drawImage() performance with SVGs is too slow to be viable, but in other
  // browsers, skipping rasterization usually is faster, looks better, and uses less memory.
  export var allowRasterizeVectors = navigator.userAgent.includes('Firefox');
}
