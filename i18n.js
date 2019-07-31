// @ts-check
// @ts-ignore
var P = P || {};

/**
 * Translations for forkphorus (the player, the website, everything)
 */
P.i18n = (function() {
  'use strict';

  var i18n = {};

  i18n.translations = {
    en: {
      'document.title': 'forkphorus - phosphorus for Scratch 3',
      'player.controls.turboIndicator': 'Turbo Mode',
      'player.controls.flag.title': 'Shift+click to enable turbo mode.',
      'player.controls.flag.title.enabled': 'Turbo is enabled. Shift+click to disable turbo mode.',
      'player.controls.flag.title.disabled': 'Turbo is disabled. Shift+click to enable turbo mode.',
      'player.controls.muted': 'Muted',
      'player.controls.muted.title': 'Your browser isn\'t allowing us to play audio. You may need to interact with the page before audio can be played.',
      'report.crash.html': 'An internal error occurred. <a $attrs>Click here</a> to file a bug report.',
      'report.crash.instructions': 'Describe what you were doing to cause this error:',
      'report.bug.instructions': 'Describe the issue:',
      'studio.view': 'View studio on Scratch.',
    },
    es: {
      'player.controls.turboIndicator': 'Modo Turbo',
      'player.controls.muted': 'Silenciado',
      'index.report': 'Reportar un problema',
      'index.embed': 'Empotrar este proyecto',
      'index.package': 'Empaquete este proyecto',
      'index.settings': 'Configuraciones',
      'index.credits': 'Créditos',
      'index.code': 'Código',
    },
  };

  i18n.languages = (function() {
    var languages = navigator.languages || [navigator.language];
    var langs = [];
    for (var i = 0; i < languages.length; i++) {
      var value = languages[i].toLowerCase();
      // We don't care about country codes.
      if (value.indexOf('-') !== -1) {
        value = value.substring(0, value.indexOf('-'));
      }
      langs.push(value);
    }
    langs.push('en');
    langs = langs.filter(function(value, index) {
      // removing duplicates
      if (langs.indexOf(value) !== index) return false;
      return true;
    });
    return langs;
  }());

  function translateMessageId(messageId) {
    for (var i = 0; i < i18n.languages.length; i++) {
      var lang = i18n.languages[i];
      var messages = i18n.translations[lang];
      if (messageId in messages) {
        return { found: true, message: messages[messageId] };
      }
    }
    return { found: false, message: '## ' + messageId + ' ##' };
  }

  i18n.translate = function translate(messageId) {
    var result = translateMessageId(messageId);
    if (!result.found) {
      console.warn('Missing message ID:', messageId);
    }
    return result.message;
  };

  i18n.translateElement = function translateElement(element) {
    var translatable = element.querySelectorAll('[data-i18n]');
    for (var i = 0; i < translatable.length; i++) {
      var el = translatable[i];
      var messageId = el.dataset.i18n;
      var result = translateMessageId(messageId);
      if (result.found) {
        el.textContent = i18n.translate(messageId);
      }
    }
  };

  return i18n;
}());
