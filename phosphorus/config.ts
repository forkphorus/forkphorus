/// <reference path="phosphorus.ts" />

namespace P.config {
  export const scale = window.devicePixelRatio || 1;
  export const hasTouchEvents = 'ontouchstart' in document;
  export const framerate: number = 30;
  export const debug = window.location.search.includes("debug");
  export const PROJECT_API: string = 'https://projects.scratch.mit.edu/$id';
  export const canUseCORS: boolean = ['http:', 'https:'].indexOf(location.protocol) > -1;
}
