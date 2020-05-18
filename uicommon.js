'use strict';

// Common helpers for the index.html, app.html, embed.html etc.
// This should be loaded after phosphorus.

// @ts-ignore
window.uiCommon = (function() {
  // @ts-ignore
  var DEFAULT_OPTIONS = P.player.Player.DEFAULT_OPTIONS;
  // "truthy" values
  var TRUE = ['true', 'yes', 'on', '1'];
  // "falsey" values
  var FALSE = ['false', 'no', 'off', '0'];

  function parseSearch(handler) {
    location.search.substr(1).split('&').forEach(function(p) {
      var parts = p.split('=');
      if (parts.length < 1) {
        return;
      }
      handler(parts[0], parts[1] || '');
    });
  }

  function parseOptions() {
    var options = {};
    parseSearch(function(key, value) {
      function setOption(name, value) {
        // Check that this option exists
        if (!DEFAULT_OPTIONS.hasOwnProperty(name)) {
          throw new Error('Unknown option: ' + name);
        }
  
        // Get the default value and type
        var defaultValue = DEFAULT_OPTIONS[name];
        var expectedType = typeof defaultValue;
  
        // Convert the input value to the correct type
        if (expectedType === 'number') {
          value = +value;
          if (Number.isNaN(value)) {
            console.warn('Value for ' + name + ' is an invalid number, skipping.');
            return;
          }
        }
  
        if (expectedType === 'boolean') {
          value = value.toLowerCase();
          if (TRUE.indexOf(value) > -1) {
            value = true;
          } else if (FALSE.indexOf(value) > -1) {
            value = false;
          } else {
            console.warn('Value for ' + name + ' is an invalid boolean(-like), skipping.');
            return;
          }
        }
  
        options[name] = value;
      }
  
      function setFlagOption(name, value) {
        setOption(name, value || 'true');
      }
  
      switch (key) {
        case 'fps':
          setOption('fps', value);
          break;
        case 'username':
          setOption('username', value);
          break;
        case 'turbo':
          setFlagOption('turbo', value);
          break;
        case 'imageSmoothing':
          setFlagOption('imageSmoothing', value);
          break;
      }
    });
    return options;
  }

  return {
    parseSearch: parseSearch,
    parseOptions: parseOptions,
  };
}());
