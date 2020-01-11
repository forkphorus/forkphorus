/// <reference path="phosphorus.ts" />

namespace P.config {
  const features = location.search.replace('?', '').split('&');
  export const debug = features.indexOf('debug') > -1;
  export const useWebGL = features.indexOf('webgl') > -1;
  export const supportVideoSensing = features.indexOf('video') > -1;
  export const experimentalOptimizations = features.indexOf('opt') > -1;
  export const accurateFilters = features.indexOf('filters') > -1;

  export const scale = window.devicePixelRatio || 1;
  export const PROJECT_API: string = 'https://projects.scratch.mit.edu/$id';
}
