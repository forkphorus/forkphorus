/// <reference path="phosphorus.ts" />

/**
 * Text-to-speech
 */
namespace P.tts {
  const enum Mode {
    Disabled = 0,
    WebAudio = 1,
    Scratch = 2,
  }

  export var mode: Mode = Mode.WebAudio;

  export function speak(message: string, voice: string, language: string): Promise<void> {
    if (mode === Mode.Disabled) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      if (mode === Mode.WebAudio) {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = language;
        utterance.onerror = function() {
          resolve();
        };
        utterance.onend = function() {
          resolve();
        };
        speechSynthesis.speak(utterance);
      } else {
        // TODO: use the scratch API
      }
    });
  }
}
