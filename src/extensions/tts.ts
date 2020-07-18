/// <reference path="../phosphorus.ts" />
/// <reference path="extension.ts" />

/**
 * Text-to-speech
 */
namespace P.ext.tts {
  export enum Gender {
    Male,
    Female,
    Unknown,
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
    private voice: string = 'ALTO';
    private supported: boolean = 'speechSynthesis' in window;

    constructor(stage: P.core.Stage) {
      super(stage);
      if (!this.supported) {
        console.warn('TTS extension is not supported in this browser: it requires the speechSynthesis API https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis');
      } else {
        // browsers load the voices list async, so we attempt to fetch them once so that they will have them ready before the first TTS
        speechSynthesis.getVoices();
      }
    }

    private getVoiceGender(voice: SpeechSynthesisVoice): Gender {
      if (femaleVoices.some((i) => i.test(voice.name))) return Gender.Female;
      if (maleVoices.some((i) => i.test(voice.name))) return Gender.Male;
      return Gender.Unknown;
    }

    private getVoiceData(voiceName: string): { voice: SpeechSynthesisVoice | null, rate: number, pitch: number; } {
      const matchesGender = (voice: SpeechSynthesisVoice) => this.getVoiceGender(voice) === voiceGender;

      const voice = scratchVoices[voiceName];
      const rate = voice.rate;
      const pitch = voice.pitch;

      const voiceGender = scratchVoices[this.voice].gender;
      // we have to refetch and filter the voices list every time because it can (and does) change at runtime.
      const voices = speechSynthesis.getVoices();
      const matchesLanguage = voices.filter((i) => i.lang.substr(0, 2) === this.language.substr(0, 2));

      // try to find a voice that matches the language and gender
      let candidates = matchesLanguage.filter(matchesGender);
      // ... remove the gender requirement
      if (candidates.length === 0) candidates = matchesLanguage;
      // ... just use any voice
      if (candidates.length === 0) candidates = voices;

      const defaultVoice = candidates.find((i) => i.default);

      return {
        voice: defaultVoice || candidates[0] || null,
        pitch,
        rate,
      }
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
        utterance.lang = this.language;
        const { voice, rate, pitch } = this.getVoiceData(this.voice);
        utterance.voice = voice;
        utterance.rate = rate;
        utterance.pitch = pitch;
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
