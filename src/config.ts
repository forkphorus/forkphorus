/// <reference path="phosphorus.ts" />

namespace P.config {
  export const debug = false;
  export const useWebGL = false;
  export const supportVideoSensing = false;
  export const experimentalOptimizations = false;
  export const scale = window.devicePixelRatio || 1;
  export const PROJECT_API: string = 'https://projects.scratch.mit.edu/$id';
}
