/// <reference path="suite.js" />

(function() {
  'use strict';

  const tests = [
    'sb/scratch1.sb',

    'sb2/sb2-template.sb2',
    'sb2/non-standard-json.sb2',
    'sb2/color-formats.sb2',

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
    'sb3/for-each-in.sb3',
    'sb3/264-setCostume.sb3',
    'sb3/263-NaN.sb3',
    'sb3/285-variable-id-name-desync.sb3',
    'sb3/when-greater-than.sb3',
    'sb3/detector.sb3',
    'sb3/procedure-definition-order.sb3',
    'sb3/color-formats.sb3',
    // 'sb3/pen-color-shift.sb3',
    'sb3/384-touching.sb3',
    'sb3/empty-sound-does-not-play-last.sb3',
    'sb3/negative-zero.sb3',

    'scratch-vm/broadcast-wait-arg-change.sb2',
    'scratch-vm/control-if-false-then-else.sb2',
    'scratch-vm/control-if-false-then.sb2',
    'scratch-vm/control-if-true-then-else.sb2',
    'scratch-vm/control-if-true-then.sb2',
    // 'scratch-vm/control-stop-all-leaks.sb2',
    'scratch-vm/data-operators-global.sb2',
    'scratch-vm/data-operators-local.sb2',
    'scratch-vm/data-reporter-contents-global.sb2',
    'scratch-vm/data-reporter-contents-local.sb2',
    'scratch-vm/event-broadcast-and-wait-can-continue-same-tick.sb2',
    'scratch-vm/event-when-green-flag.sb2',
    // 'scratch-vm/events-broadcast-and-wait-yields-a-tick.sb2',
    // 'scratch-vm/hat-thread-execution.sb2',
    'scratch-vm/monitors-stage-name.sb2',
    'scratch-vm/operators-not-blank.sb2',
    'scratch-vm/order-changes-back-2-broadcast-wait.sb2',
    // 'scratch-vm/order-changes-backwards-2-broadcast-and-wait-repeat-message.sb2',
    'scratch-vm/order-changes-backwards-2-broadcast-and-wait.sb2',
    'scratch-vm/order-changes-backwards-2-broadcast-no-wait.sb2',
    'scratch-vm/order-changes-backwards-2-broadcast-wait.sb2',
    // 'scratch-vm/order-changes-backwards-2-continuous.sb2',
    // 'scratch-vm/order-changes-backwards-2-threads-broadcast-wait.sb2',
    'scratch-vm/order-changes-forewards-2-broadcast-wait.sb2',
    'scratch-vm/order-changes-front-2-broadcast-wait.sb2',
    'scratch-vm/order-clones-backwards-2-broadcast-wait.sb2',
    'scratch-vm/order-clones-backwards-broadcast-wait.sb2',
    'scratch-vm/order-clones-static-2.sb2',
    // 'scratch-vm/order-immobile-stage.sb2',
    'scratch-vm/order-library-reverse.sb2',
    'scratch-vm/order-library-reverse.sb3',
    'scratch-vm/order-library.sb2',
    'scratch-vm/order-library.sb3',
    'scratch-vm/procedures-boolean-reporter-bug.sb2',
    'scratch-vm/procedures-nested-missing-boolean-param.sb2',
    'scratch-vm/procedures-nested-missing-no-param.sb2',
    'scratch-vm/procedures-nested-missing-number-param.sb2',
    'scratch-vm/procedures-nested-missing-string-param.sb2',
    'scratch-vm/procedures-number-number-boolean.sb2',
    'scratch-vm/procedures-param-outside-boolean.sb2',
    'scratch-vm/procedures-param-outside-number.sb2',
    'scratch-vm/procedures-param-outside-string.sb2',
    'scratch-vm/procedures-recursive-default-boolean.sb2',
    'scratch-vm/procedures-recursive-default-number.sb2',
    'scratch-vm/procedures-recursive-default-string.sb2',
    'scratch-vm/sensing-get-attribute-of-stage-alt-name.sb2',
    // 'scratch-vm/sprite-number-name.sb2',
    // 'scratch-vm/tw-NaN.sb3',
    'scratch-vm/tw-all-at-once.sb3',
    // 'scratch-vm/tw-broadcast-id-and-name-desync.sb3',
    // 'scratch-vm/tw-change-size-does-not-use-rounded-size.sb3',
    'scratch-vm/tw-one-divide-negative-zero.sb3',
    // 'scratch-vm/tw-preciseProjectTimer-drift-453118719.sb3',
    'scratch-vm/tw-prefers-first-occurence-of-procedure-387608267.sb3',
    'scratch-vm/tw-procedure-arguments-with-same-name.sb3',
    'scratch-vm/tw-procedure-call-resets-variable-input-types-430811055.sb3',
    'scratch-vm/tw-promise-loop-double-yield-kouzeru.sb3',
    'scratch-vm/tw-restart-broadcast-threads.sb3',
    'scratch-vm/tw-safe-procedure-argument-casting.sb3',
    'scratch-vm/tw-sensing-of.sb3',
    // 'scratch-vm/tw-subtract-can-return-nan.sb3',
    'scratch-vm/tw-unsafe-equals.sb3',
    'scratch-vm/tw-when-backdrop-switches-to-next-backdrop.sb3',
    'scratch-vm/tw-when-backdrop-switches-to-switch-backdrop-to.sb3',
    'scratch-vm/tw-zombie-cube-escape-284516654.sb3',
  ];

  /**
   * Default options to override the default options
   * @type {Partial<ProjectMeta>}
   */
  const defaultMetadata = {
    timeout: 5000,
    ignoredFailures: [],
    repeatCount: 1,
  };

  /**
   * @param {string} path
   * @param {Partial<ProjectMeta>} metadata 
   * @returns {ProjectMeta}
   */
  function createProjectMeta(path, metadata = {}) {
    metadata.path = path;
    const clonedDefaults = Object.assign({}, defaultMetadata);
    const merged = Object.assign(clonedDefaults, metadata);
    return /** @type {ProjectMeta} */ (merged);
  }

  P.suite.tests = () => tests.map((i) => {
    if (typeof i === 'string') return createProjectMeta(i);
    return i;
  });
  P.suite.defaults = defaultMetadata;
}());
