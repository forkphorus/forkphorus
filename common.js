'use strict';

// Common code shared between index.html, app.html, embed.html etc.
// This should be loaded after phosphorus.dist.js

/** @type {any} */
var P;

// @ts-ignore
var Common = (function() {
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

  var playerOptions = {};
  var projectId = null;

  parseSearch(function(key, value) {
    function setPlayerOption(name, value) {
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

      playerOptions[name] = value;
    }

    function setPlayerFlag(name, value) {
      setPlayerOption(name, value || 'true');
    }

    function setPlayerEnum(name, value, values) {
      if (values.indexOf(value) > -1) {
        setPlayerOption(name, value);
      } else {
        console.warn(value, 'is not one of', values.join(', '));
      }
    }

    switch (key) {
      // Player options
      case 'fps':
        setPlayerOption('fps', value);
        break;
      case 'username':
        setPlayerOption('username', value);
        break;
      case 'turbo':
        setPlayerFlag('turbo', value);
        break;
      case 'imageSmoothing':
        setPlayerFlag('imageSmoothing', value);
        break;
      case 'fencing':
        setPlayerFlag('spriteFencing', value);
        break;
      case 'limits':
        setPlayerFlag('removeLimits', value);
        break;
      case 'cloud':
        setPlayerEnum('cloudVariables', value, ['off', 'ws', 'localStorage']);
        break;
      case 'chost':
        setPlayerFlag('cloudHost', value);
        break;
      case 'phost':
        // Legacy mode was removed by Scratch. We will just ignore it.
        if (value !== 'legacy') {
          setPlayerFlag('projectHost', value);
        }
        break;
      case 'chhost':
        setPlayerFlag('cloudHistoryHost', value);
        break;
      // Project ID
      case 'id':
        // projectId is also read from location.hash if not found here.
        projectId = value;
        break;
      // Feature flags
      case 'webgl':
        P.config.useWebGL = true;
        break;
      case 'debug':
        P.config.debug = true;
        break;
      case 'video':
        P.config.supportVideoSensing = true;
        break;
      case 'opt':
        P.config.experimentalOptimizations = true;
        break;
      case 'svgr':
        P.config.allowRasterizeVectors = false;
        break;
    }
  });

  // Check hash for project ID if not specified in search string
  if (projectId === null) {
    var hash = location.hash.substr(1);
    if (/^\d+$/.test(hash)) {
      projectId = hash;
    }
  }

  return {
    parseSearch: parseSearch,
    playerOptions: playerOptions,
    projectId: projectId,
  };
}());
