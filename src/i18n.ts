/// <reference path="phosphorus.ts" />

/**
 * Translation API and translations for the Player
 */
namespace P.i18n {
  'use strict';

  type Translations = ObjectMap<string>;

  const SUPPORTED_LANGUAGES = ['en', 'es'];
  const DEFAULT_LANGUAGE = 'en';

  function getLanguage(): string {
    let language = navigator.language;
    if (language.indexOf('-') > -1) {
      // remove a country code, if it has one.
      language = language.substring(0, language.indexOf('-'));
    }
    if (SUPPORTED_LANGUAGES.indexOf(language) === -1) {
      language = DEFAULT_LANGUAGE;
    }
    return language;
  }

  const translations: Translations = {};
  const defaultTranslations: Translations = {};
  const language = getLanguage();

  /**
   * Translate a message ID to the user's language.
   */
  export function translate(messageId: string) {
    if (translations[messageId]) {
      return translations[messageId];
    }
    if (defaultTranslations[messageId]) {
      return defaultTranslations[messageId];
    }
    console.warn('Missing translation:', messageId);
    return '## ' + messageId + ' ##';
  }

  /**
   * Translate the children of an element.
   * Any children with `data-i18n` set to a message ID will have its textContent replaced.
   */
  export function translateElement(element: HTMLElement) {
    const translatable = element.querySelectorAll('[data-i18n]');
    for (var i = 0; i < translatable.length; i++) {
      const el = translatable[i];
      const messageId = el.getAttribute('data-i18n');
      if (messageId === null) continue;
      const result = translate(messageId);
      el.textContent = result;
    }
  }

  function merge(into: Translations, source: Translations) {
    for (const key of Object.keys(source)) {
      into[key] = source[key];
    }
  }

  export function addTranslations(importedLanguage: string, importedTranslations: Translations) {
    if (importedLanguage === language) {
      merge(translations, importedTranslations);
    } else if (importedLanguage === DEFAULT_LANGUAGE) {
      merge(defaultTranslations, importedTranslations);
    }
  }

  // Default Translations

  addTranslations('en', {
    'player.controls.turboIndicator': 'Turbo Mode',
    'player.controls.fullscreen.title': 'Click to fullscreen player, Shift+click to just maximize.',
    'player.controls.flag.title': 'Shift+click to enable turbo mode.',
    'player.controls.flag.title.enabled': 'Turbo mode is enabled. Shift+click to disable turbo mode.',
    'player.controls.flag.title.disabled': 'Turbo mode is disabled. Shift+click to enable turbo mode.',
    'player.errorhandler.error': 'An internal error occurred. <a $attrs>Click here</a> to file a bug report.',
    'player.errorhandler.error.doesnotexist': 'There is no project with ID $id. It was probably deleted, never existed, or you made a typo.',
    'player.errorhandler.error.doesnotexistlegacy': 'The project with ID $id can not be used with legacy mode enabled. Turn off legacy mode to use this project.',
  });
}
