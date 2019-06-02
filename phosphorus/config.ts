/// <reference path="phosphorus.ts" />

namespace P.config {
  const features = location.search.replace('?', '').split('&');
  export const debug = features.indexOf('debug') > -1;
  export const useWebGL = features.indexOf('webgl') > -1;
  export const preciseTimers = features.indexOf('preciseTimers') > -1;
  export const useCrashMonitor = features.indexOf('crashmonitor') > -1;

  export const scale = window.devicePixelRatio || 1;
  export const hasTouchEvents = 'ontouchstart' in document;
  export const PROJECT_API: string = 'https://projects.scratch.mit.edu/$id';
}
