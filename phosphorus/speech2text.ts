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
    private listeners: number = 0;
    private overlayElement: HTMLElement;

    constructor(public stage: P.core.Stage) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'en-US';
      this.recognition.continuous = true;
      this.recognition.onresult = (event) => this.onresult(event);
      this.recognition.start();
      this.initOverlay();
    }

    private initOverlay() {
      const container = document.createElement('div');
      container.className = 'speech2text-container';

      const indicator = document.createElement('div');
      indicator.className = 'speech2text-indicator';

      const animation = document.createElement('div');
      animation.className = 'speech2text-animation';

      const image = document.createElement('div');
      image.className = 'speech2text-image';

      container.appendChild(animation);
      container.appendChild(indicator);
      container.appendChild(image);

      this.stage.ui.appendChild(container);
      this.overlayElement = container;
    }

    private onresult(event: SpeechRecognitionEvent) {
      this.lastResultIndex = event.resultIndex;
      const lastResult = event.results[event.resultIndex];
      const message = lastResult[0];
      const transcript = message.transcript.trim();
      if (this.listeners !== 0) {
        this.speech = transcript;
      }
    }

    startListen() {
      this.listeners++;
      this.overlayElement.setAttribute('listening', '');
    }
    endListen() {
      this.listeners--;
      if (this.listeners === 0) {
        this.overlayElement.removeAttribute('listening');
      }
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