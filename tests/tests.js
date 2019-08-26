/// <reference path="suite.js" />

(function() {
  'use strict';

  const tests = [
    'sb2/sb2-template.sb2',
    // 'sb2/pen-colors.sb2',
    // 'sb2/operators.sb2',
    'sb3/sb3-template.sb3',
    'sb3/quicksort.sb3',
    'sb3/befunge-eratosthenes.sb3',
    'sb3/string-functions.sb3',
    // 'sb3/operators.sb3',
    'regressions/54.sb3',
    'regressions/56.sb3',
    'regressions/58.sb3',
    'regressions/63.sb3',
    'regressions/66.sb3',
  ];

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

  P.suite.tests = () => tests.map((i) => {
    if (typeof i === 'string') return createProjectMeta(i);
    return i;
  });
  P.suite.defaults = defaultMetadata;
}());
