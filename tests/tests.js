/// <reference path="suite.js" />

(function() {
  'use strict';

  const tests = [
    'sb2/sb2-template.sb2',

    'sb3/sb3-template.sb3',
    'sb3/quicksort.sb3',
    'sb3/befunge-eratosthenes.sb3',
    'sb3/string-functions.sb3',
    'sb3/operators.sb3',
    'sb3/54-pen-colors.sb3',
    'sb3/56-NaN.sb3',
    'sb3/58-list-reference.sb3',
    'sb3/63-random.sb3',
    'sb3/66-insert.sb3',
    'sb3/70.sb3',
    'sb3/105-contains.sb3',
    'sb3/112.sb3',
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
