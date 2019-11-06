/// <reference path="extension.ts" />

/*!
Parts of this file (microphone.ts) are derived from https://github.com/LLK/scratch-audio/blob/develop/src/Loudness.js
*/

namespace P.ext.microphone {
  const enum MicrophoneState {
    Disconnected = 0,
    Connected = 1,
    Connecting = 2,
    Error = 3,
  }

  interface MicrophoneData {
    source: MediaStreamAudioSourceNode;
    stream: MediaStream;
    analyzer: AnalyserNode;
    dataArray: Float32Array;
    lastValue: number;
    lastCheck: number;
  }

  let microphone: MicrophoneData | null = null;
  let state: MicrophoneState = MicrophoneState.Disconnected;

  // The loudness will be cached for this long, in milliseconds.
  // getLoudness() has side effects (such as affecting smoothing) so a cache is needed.
  const CACHE_TIME = 1000 / 30;

  /**
   * Begin the process of connecting to the microphone.
   */
  function connect() {
    if (state !== MicrophoneState.Disconnected) {
      return;
    }
    if (!P.audio.context) {
      console.warn('Cannot connect to microphone without audio context.');
      state = MicrophoneState.Error;
      return;
    }

    state = MicrophoneState.Connecting;
    navigator.mediaDevices.getUserMedia({audio: true})
      .then((mediaStream) => {
        const source = P.audio.context!.createMediaStreamSource(mediaStream);
        const analyzer = P.audio.context!.createAnalyser();
        source.connect(analyzer);
        microphone = {
          source: source,
          stream: mediaStream,
          analyzer,
          dataArray: new Float32Array(analyzer.fftSize),
          lastValue: -1,
          lastCheck: 0,
        };
        state = MicrophoneState.Connected;
      })
    .catch((err) => {
      console.warn('Cannot connect to microphone: ' + err);
      state = MicrophoneState.Error;
    });
  }

  /**
   * Re-initializes the analyser node.
   * This is necessary due to (what seems to be) a bug in Chrome.
   */
  function reinitAnalyser() {
    if (!microphone) {
      throw new Error('Microphone not connected; cannot re-init something that does not exist!')
    }

    // For some reason all analyser nodes stop working in Chrome after doing suspend() on the AudioContext
    // getFloatTimeDomainData() will always return the same data, which isn't any good.
    // This will fix that by creating a new analyser instead of re-using one.
    const analyzer = P.audio.context!.createAnalyser();
    microphone.source.disconnect();
    microphone.source.connect(analyzer);
    microphone.analyzer = analyzer;

    // It's possible fftSize might change with this new analyser
    if (microphone.dataArray.length !== analyzer.fftSize) {
      microphone.dataArray = new Float32Array(analyzer.fftSize);
    }
  }

  /**
   * @returns The volume level from 0-100 or -1 if the microphone is not active.
   */
  function getLoudness(): number {
    if (microphone === null) {
      connect();
      return -1;
    }
    if (!microphone.stream.active) {
      return -1;
    }

    if (Date.now() - microphone.lastCheck < CACHE_TIME) {
      return microphone.lastValue;
    }

    microphone.analyzer.getFloatTimeDomainData(microphone.dataArray);
    let sum = 0;
    for (let i = 0; i < microphone.dataArray.length; i++){
      sum += Math.pow(microphone.dataArray[i], 2);
    }
    let rms = Math.sqrt(sum / microphone.dataArray.length);
    if (microphone.lastValue !== -1) {
      rms = Math.max(rms, microphone.lastValue * 0.6);
    }
    microphone.lastValue = rms;

    rms *= 1.63;
    rms = Math.sqrt(rms);
    rms = Math.round(rms * 100);
    rms = Math.min(rms, 100);

    return rms;
  }

  export class MicrophoneExtension extends P.ext.Extension {
    getLoudness() {
      return getLoudness();
    }

    onstart() {
      if (microphone) {
        reinitAnalyser();
      }
    }
  }
}
