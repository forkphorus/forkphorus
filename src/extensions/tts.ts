/// <reference path="../phosphorus.ts" />
/// <reference path="extension.ts" />

/**
 * Text-to-speech
 */
namespace P.ext.tts {
  const enum Gender {
    Male,
    Female,
    Other,
  }

  // TODO: need a larger list of languages here

  const femaleVoices = [
    /Zira/, // Microsoft Zira Desktop - English (United States)
    /female/i,
  ];

  const maleVoices = [
    /David/, // Microsoft David Desktop - English (United States)
    /\bmale/i,
  ];

  type Voice = { gender: Gender; pitch: number; rate: number; };

  const scratchVoices: ObjectMap<Voice> = {
    ALTO: { gender: Gender.Female, pitch: 1, rate: 1 },
    TENOR: { gender: Gender.Male, pitch: 1.5, rate: 1 },
    GIANT: { gender: Gender.Male, pitch: 0.5, rate: 0.75 },
    SQUEAK: { gender: Gender.Female, pitch: 2, rate: 1.5 },
    KITTEN: { gender: Gender.Female, pitch: 2, rate: 1 },
  };

  export class TextToSpeechExtension extends P.ext.Extension {
    private language: string = 'en';
    private voice: string = 'ALTO'; // unused
    private supported: boolean;

    constructor(stage: P.core.Stage) {
      super(stage);
      this.supported = 'speechSynthesis' in window;
      if (!this.supported) {
        console.warn('TTS extension is not supported in this browser: it requires the speechSynthesis API https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis');
      } else {
        // browsers load the voices list async, so we attempt to fetch them once so that they will have them ready before the first TTS
        speechSynthesis.getVoices();
      }
    }

    private chooseVoice(voice: Voice): SpeechSynthesisVoice | null {
      const matchesGender = (voice: SpeechSynthesisVoice) => {
        if (femaleVoices.some((i) => i.test(voice.name))) return voiceGender === Gender.Female;
        if (maleVoices.some((i) => i.test(voice.name))) return voiceGender === Gender.Male;
        return voiceGender === Gender.Other;
      };

      const voiceGender = scratchVoices[this.voice].gender;

      const matchesLanguageCountry = speechSynthesis.getVoices().filter((i) => i.lang.substr(0, 2) === this.language.substr(0, 2));
      const matchesLanguageExact = speechSynthesis.getVoices().filter((i) => i.lang === this.language);

      // try to find a voice that matches the language and gender exactly
      let candidates = matchesLanguageExact.filter(matchesGender);
      // ... relax the language requirement
      if (candidates.length === 0) candidates = matchesLanguageCountry.filter(matchesGender);
      // ... remove the gender requirement
      if (candidates.length === 0) candidates = matchesLanguageExact;
      if (candidates.length === 0) candidates = matchesLanguageCountry;
      // ... just use any voice
      if (candidates.length === 0) candidates = speechSynthesis.getVoices();

      // return the default, if it is found
      const defaultVoice = candidates.find((i) => i.default);
      if (defaultVoice) return defaultVoice;

      // just use the first voice, should be good enough
      return candidates[0];
    }

    setVoice(voice: string) {
      if (!scratchVoices.hasOwnProperty(voice)) {
        return;
      }
      this.voice = voice;
    }

    setLanguage(language: string) {
      this.language = language;
    }

    speak(text: string): Promise<void> {
      if (!this.supported) {
        return Promise.resolve();
      }

      if (this.voice === 'KITTEN') text = text.replace(/\w+?\b/g, 'meow');

      return new Promise((resolve, reject) => {
        const end = () => resolve();
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = scratchVoices[this.voice];
        utterance.lang = this.language;
        utterance.voice = this.chooseVoice(voice);
        utterance.rate = voice.rate;
        utterance.pitch = voice.pitch;
        utterance.onerror = end;
        utterance.onend = end;
        speechSynthesis.speak(utterance);
        speechSynthesis.resume();
      });
    }

    onstart() {
      if (this.supported) {
        speechSynthesis.resume();
      }
    }

    onpause() {
      if (this.supported) {
        speechSynthesis.pause();
      }
    }

    destroy() {
      if (this.supported) {
        speechSynthesis.cancel();
      }
    }
  }
}
