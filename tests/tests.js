/// <reference path="suite.js" />

(function() {
  'use strict';

  /**
   * Default options to override the default options
   * @type {ProjectMeta}
   */
  const defaultMetadata = {
    timeout: 5000,
    ignoredFailures: [],
    repeatCount: 1,
  };

  /**
   * @param {string} path
   * @param {ProjectMeta} metadata 
   * @returns {ProjectMeta}
   */
  function createProjectMeta(path, metadata = {}) {
    metadata.path = path;
    const clonedDefaults = Object.assign({}, defaultMetadata);
    const merged = Object.assign(clonedDefaults, metadata);
    return merged;
  }

  /**
   * Creates the Scratch 3 project list
   */
  const sb3 = () => [
    createProjectMeta('sb3/sb3-template.sb3'),
    createProjectMeta('sb3/quicksort.sb3'),
    createProjectMeta('sb3/befunge-eratosthenes.sb3'),
    createProjectMeta('sb3/string-functions.sb3'),
    createProjectMeta('sb3/operators.sb3'),
  ];

  /**
   * Creates the Scratch 2 project list
   */
  const sb2 = () => [
    createProjectMeta('sb2/sb2-template.sb2'),
  ];

  P.suite.sb2 = sb2;
  P.suite.sb3 = sb3;
  P.suite.defaults = defaultMetadata;
}());
