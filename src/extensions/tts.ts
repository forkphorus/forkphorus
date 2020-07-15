/// <reference path="../phosphorus.ts" />
/// <reference path="extension.ts" />

/**
 * Text-to-speech
 */
namespace P.ext.tts {
  const supported = 'speechSynthesis' in window;

  export class TextToSpeechExtension extends P.ext.Extension {
    public voice: string = 'alto'; // unused
    public language: string = 'en';

    constructor(stage: P.core.Stage) {
      super(stage);
      if (!supported) {
        console.warn('TTS extension is not supported in this browser: it requires the SpeechSynthesis API https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis');
      }
    }

    speak(text: string): Promise<void> {
      if (!supported) {
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        const end = () => resolve();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.language;
        utterance.onerror = end;
        utterance.onend = end;
        speechSynthesis.speak(utterance);
      });
    }

    destroy() {
      speechSynthesis.cancel();
    }
  }
}
