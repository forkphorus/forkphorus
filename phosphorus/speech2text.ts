/// <reference path="phosphorus.ts" />

namespace P.speech2text {
  // Currently only Chrome supports SpeechRecognition with the webkit prefix.
  var SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition || (window as any).mozSpeechRecognition || (window as any).msSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('Speech to text is not supported in this browser.');
  }

  interface ForkphorusSpeechRecognition extends SpeechRecognition {
    forkphorusDone: boolean;
  }

  export class SpeechToTextExtension {
    public speech: string = '';

    listen(): ForkphorusSpeechRecognition | null {
      if (!SpeechRecognition) {
        return null;
      }
      const recognition = new SpeechRecognition() as ForkphorusSpeechRecognition;
      recognition.forkphorusDone = false;
      // TODO: language settings?
      recognition.lang = 'en-US';
      recognition.start();
      recognition.onresult = (event) => {
        const message = event.results[0][0].transcript;
        this.speech = message;
        recognition.forkphorusDone = true;
      };
      return recognition;
    }

    when(message: string, callback: P.runtime.Fn) {
      // TODO
    }
  }
}