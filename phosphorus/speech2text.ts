/// <reference path="phosphorus.ts" />

namespace P.speech2text {
  var SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
  interface ForkphorusSpeechRecognition extends SpeechRecognition {
    forkphorusDone: boolean;
  }

  export var lastMessage: string = '';

  export function listen(): ForkphorusSpeechRecognition | null {
    if (!SpeechRecognition) {
      return null;
    }
    const recognition = new SpeechRecognition() as ForkphorusSpeechRecognition;
    recognition.forkphorusDone = false;
    recognition.lang = 'en-US';
    recognition.start();
    recognition.onresult = function(event) {
      const message = event.results[0][0].transcript;
      debugger;
      lastMessage = message;
      recognition.forkphorusDone = true;
    };
    return recognition;
  }
}