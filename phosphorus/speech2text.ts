/// <reference path="phosphorus.ts" />

namespace P.speech2text {
  // Currently only Chrome supports SpeechRecognition with the webkit prefix.
  var SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition || (window as any).mozSpeechRecognition || (window as any).msSpeechRecognition;
  export const supported = typeof SpeechRecognition !== 'undefined';

  if (!supported) {
    console.warn('Speech to text is not supported in this browser. (https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)');
  }

  export class SpeechToTextExtension {
    public speech: string = '';
    private recognition: SpeechRecognition;
    private lastResultIndex: number;

    constructor() {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'en-US';
      this.recognition.continuous = true;
      this.recognition.onresult = (event) => this.onresult(event);
      this.recognition.start();
    }

    private onresult(event: SpeechRecognitionEvent) {
      this.lastResultIndex = event.resultIndex;
      const lastResult = event.results[event.resultIndex];
      const message = lastResult[0];
      const transcript = message.transcript.trim();
      this.speech = transcript;
    }

    /**
     * Delete this extension.
     */
    destroy() {
      this.recognition.abort();
    }

    /**
     * Get the ID of the current message.
     */
    id() {
      return this.lastResultIndex;
    }
  }
}