/// <reference path="phosphorus.ts" />

namespace P.config {
  export const debug = true; // DEBUG: Always enable debug mode
  export const useWebGL = false;
  export const supportVideoSensing = false;
  export const experimentalOptimizations = false;
  export const scale = window.devicePixelRatio || 1;
  export const PROJECT_API: string = 'https://projects.scratch.mit.edu/$id';
}
