/// <reference path="extension.ts" />

namespace P.ext.speech2text {
  // Currently only Chrome supports SpeechRecognition with the webkit prefix.
  var SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition || (window as any).mozSpeechRecognition || (window as any).msSpeechRecognition;

  let supported: null | boolean = null;
  export function isSupported(): boolean {
    if (supported === null) {
      supported = typeof SpeechRecognition !== 'undefined';
      if (!supported) {
        console.warn('Speech to text is not supported in this browser. (https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)');
      }
    }
    return supported;
  }

  interface SpeechToTextHat {
    target: P.core.Base;
    startingFunction: P.runtime.Fn;
    phraseFunction: () => any;
  }

  export class SpeechToTextExtension extends P.ext.Extension {
    public speech: string = '';

    private recognition: SpeechRecognition;
    private lastResultIndex: number;
    private listeners: number = 0;
    private overlayElement: HTMLElement;
    private hats: SpeechToTextHat[] = [];

    constructor(stage: P.core.Stage) {
      super(stage);
      this.initRecognition();
      this.initOverlay();
    }

    private initRecognition() {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'en-US';
      this.recognition.continuous = true;
      this.recognition.onresult = (event) => this.onresult(event);
      this.recognition.onerror = (event) => {
        // Abort is expected when this extension is destroyed.
        if (event.error !== 'aborted') {
          console.error('speech2text error', event);
        }
      };
      this.recognition.onend = () => {
        console.warn('speech2text disconnected, reconnecting');
        this.initRecognition();
      };
      this.recognition.start();
    }

    private initOverlay() {
      if (this.overlayElement) {
        throw new Error('initializing overlay twice');
      }

      const container = document.createElement('div');
      container.className = 'speech2text-container';

      const indicator = document.createElement('div');
      indicator.className = 'speech2text-indicator';

      const animation = document.createElement('div');
      animation.className = 'speech2text-animation';

      container.appendChild(animation);
      container.appendChild(indicator);

      this.stage.ui.appendChild(container);
      this.overlayElement = container;
    }

    private onresult(event: SpeechRecognitionEvent) {
      this.lastResultIndex = event.resultIndex;
      const lastResult = event.results[event.resultIndex];
      const message = lastResult[0];
      const transcript = message.transcript.trim();
      // Only update the speech value when someone is actually listening
      if (this.listeners !== 0) {
        this.speech = transcript;
      }
      // Trigger our hat blocks, if any.
      for (const hat of this.hats) {
        const target = hat.target;
        const phraseFunction = hat.phraseFunction;
        const startingFunction = hat.startingFunction;
        const value = this.stage.runtime.evaluateExpression(target, phraseFunction);
        if (value === transcript) {
          this.stage.runtime.startThread(target, startingFunction);
        }
      }
    }

    /**
     * Add a new hat block listener
     */
    addHat(hat: SpeechToTextHat) {
      this.hats.push(hat);
    }

    /**
     * Should be called at the start of "listen and wait"
     */
    startListen() {
      this.listeners++;
      this.overlayElement.setAttribute('listening', '');
    }

    /**
     * Should be called at the end of "listen and wait"
     */
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