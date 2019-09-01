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
    // Messages that start with "player" affect the project player used in the homepage, embed, packages, etc.
    // Messages that start with "index" affect the homepage
    en: {
      'player.controls.turboIndicator': 'Turbo Mode',
      'player.controls.fullscreen.title': 'Click to fullscreen player, Shift+click to just maximize.',
      'player.controls.flag.title': 'Shift+click to enable turbo mode.',
      'player.controls.flag.title.enabled': 'Turbo mode is enabled. Shift+click to disable turbo mode.',
      'player.controls.flag.title.disabled': 'Turbo mode is disabled. Shift+click to enable turbo mode.',
      'player.controls.muted': 'Muted',
      'player.controls.muted.title': 'Your browser isn\'t allowing us to play audio. You may need to interact with the page before audio can be played.',
      'studioview.authorAttribution': 'by $author',
      'studioview.projectHoverText': '$title by $author',
      'report.crash.html': 'An internal error occurred. <a $attrs>Click here</a> to file a bug report.',
      'report.crash.instructions': 'Describe what you were doing to cause this error:',
      'report.bug.instructions': 'Describe the issue:',
      'index.document.title': 'forkphorus - phosphorus for Scratch 3',
      'index.report': 'Report a problem',
      'index.embed': 'Embed this project',
      'index.package': 'Package this project',
      'index.settings': 'Settings',
      'index.credits': 'Credits',
      'index.code': 'Code',
      'index.studio.view': 'View studio on Scratch.',
      'index.package.button': 'Package',
      'index.package.turbo': 'Turbo mode',
      'index.package.fullscreen': 'Full screen',
      'index.package.480': '480\u00D7360',
      'index.package.custom': 'Other:',
      'index.package.divider': '\u00D7',
      'index.embed.description': 'Include the forkphorus player in your web site.',
      'index.embed.autostart': 'Start automatically',
      'index.embed.lightControls': 'Light controls',
      'index.embed.hideUI': 'Hide UI',
    },
    es: {
      'player.controls.turboIndicator': 'Modo Turbo',
      'player.controls.muted': 'Silenciado',
      'studioview.authorAttribution': 'por $author',
      'studioview.projectHoverText': '$title por $author',
      'index.report': 'Reportar un problema',
      'index.settings': 'Configuraciones',
      'index.credits': 'Créditos',
      'index.code': 'Código',
    },
  };

  i18n.language = navigator.language;
  if (i18n.language.indexOf('-') > -1) {
    // remove a country code, if it has one.
    i18n.language = i18n.language.substring(0, i18n.language.indexOf('-'));
  }
  if (!i18n.translations[i18n.language]) {
    // if this language isn't supported then just default back to english
    i18n.language = 'en';
  }

  /**
   * Translate a message ID to the user's language.
   * @param {string} messageId The ID of the message. See `i18n.translations`
   */
  i18n.translate = function translate(messageId) {
    var translations = i18n.translations[i18n.language];
    if (translations[messageId]) {
      return translations[messageId];
    }
    // if the user's language does not have a translation, we default to english
    if (i18n.translations.en[messageId]) {
      return i18n.translations.en[messageId];
    }
    console.warn('Missing translation:', messageId);
    return '## ' + messageId + ' ##';
  };

  /**
   * Translate the children of an element.
   * Any children with `data-i18n` set to a message ID will have its textContent replaced.
   * @param {HTMLElement} element The element to translate
   */
  i18n.translateElement = function translateElement(element) {
    var translatable = element.querySelectorAll('[data-i18n]');
    for (var i = 0; i < translatable.length; i++) {
      var el = translatable[i];
      var messageId = el.getAttribute('data-i18n');
      var result = i18n.translate(messageId);
      // TODO: for some of these innerHTML would actually make sense and make things simpler, but has some obvious issues.
      el.textContent = result;
    }
  };

  return i18n;
}());
