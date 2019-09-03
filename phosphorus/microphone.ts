/// <reference path="phosphorus.ts" />

namespace P.microphone {
  const enum MicrophoneState {
    Disconnected,
    Connected,
    Connecting,
    Error,
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
  const CACHE_TIME = 1000 / 30;

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
    navigator.mediaDevices.getUserMedia({audio: true}).then((mediaStream) => {
      const source = P.audio.context!.createMediaStreamSource(mediaStream);
      const analyzer = P.audio.context!.createAnalyser();
      source.connect(analyzer);
      microphone = {
        stream: mediaStream,
        source,
        analyzer,
        dataArray: new Float32Array(analyzer.fftSize),
        lastValue: -1,
        lastCheck: 0,
      };
      state = MicrophoneState.Connected;
      console.log('Connected to microphone');
    });
  }

  /**
   * @returns The volume level from 0-100 or -1 if the microphone is not active.
   */
  export function getLoudness(): number {
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

    `
    The following lines of source code are from the GitHub project LLK/scratch-audio
    You can find the license for this code here: https://raw.githubusercontent.com/LLK/scratch-audio/develop/LICENSE
    (our build tool removes comments so a multiline string is used instead)
    Copyright (c) 2016, Massachusetts Institute of Technology
    Modifications copyright (c) 2019 Thomas Weber
    `

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

    `
    End of code from LLK/scratch-audio
    `

    return rms;
  }
}
