
namespace P.audio {
  export const context = new AudioContext();

  const ADPCM_STEPS = [
    7, 8, 9, 10, 11, 12, 13, 14, 16, 17,
    19, 21, 23, 25, 28, 31, 34, 37, 41, 45,
    50, 55, 60, 66, 73, 80, 88, 97, 107, 118,
    130, 143, 157, 173, 190, 209, 230, 253, 279, 307,
    337, 371, 408, 449, 494, 544, 598, 658, 724, 796,
    876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066,
    2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358,
    5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899,
    15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767,
  ];
  const ADPCM_INDEX = [-1, -1, -1, -1, 2, 4, 6, 8, -1, -1, -1, -1, 2, 4, 6, 8];

  function decodeADPCMAudio(ab, cb) {
    var dv = new DataView(ab);
    if (dv.getUint32(0) !== 0x52494646 || dv.getUint32(8) !== 0x57415645) {
      return cb(new Error('Unrecognized audio format'));
    }

    var blocks: ObjectMap<number> = {};
    var i = 12, l = dv.byteLength - 8;
    while (i < l) {
      blocks[String.fromCharCode(
        dv.getUint8(i),
        dv.getUint8(i + 1),
        dv.getUint8(i + 2),
        dv.getUint8(i + 3))] = i;
      i += 8 + dv.getUint32(i + 4, true);
    }

    var format        = dv.getUint16(20, true);
    var channels      = dv.getUint16(22, true);
    var sampleRate    = dv.getUint32(24, true);
    var byteRate      = dv.getUint32(28, true);
    var blockAlign    = dv.getUint16(32, true);
    var bitsPerSample = dv.getUint16(34, true);

    if (format === 17) {
      var samplesPerBlock = dv.getUint16(38, true);
      var blockSize = ((samplesPerBlock - 1) / 2) + 4;

      var frameCount = dv.getUint32(blocks.fact + 8, true);

      var buffer = P.audio.context.createBuffer(1, frameCount, sampleRate);
      var channel = buffer.getChannelData(0);

      var sample, index = 0;
      var step, code, delta;
      var lastByte = -1;

      var offset = blocks.data + 8;
      i = offset;
      var j = 0;
      while (true) {
        if ((((i - offset) % blockSize) == 0) && (lastByte < 0)) {
          if (i >= dv.byteLength) break;
          sample = dv.getInt16(i, true); i += 2;
          index = dv.getUint8(i); i += 1;
          i++;
          if (index > 88) index = 88;
          channel[j++] = sample / 32767;
        } else {
          if (lastByte < 0) {
            if (i >= dv.byteLength) break;
            lastByte = dv.getUint8(i); i += 1;
            code = lastByte & 0xf;
          } else {
            code = (lastByte >> 4) & 0xf;
            lastByte = -1;
          }
          step = ADPCM_STEPS[index];
          delta = 0;
          if (code & 4) delta += step;
          if (code & 2) delta += step >> 1;
          if (code & 1) delta += step >> 2;
          delta += step >> 3;
          index += ADPCM_INDEX[code];
          if (index > 88) index = 88;
          if (index < 0) index = 0;
          sample += (code & 8) ? -delta : delta;
          if (sample > 32767) sample = 32767;
          if (sample < -32768) sample = -32768;
          channel[j++] = sample / 32768;
        }
      }
      return cb(null, buffer);
    }
    cb(new Error('Unrecognized WAV format ' + format));
  };

  export function decodeAudio(ab): Promise<AudioBuffer | null> {
    if (!context) {
      return Promise.resolve(null);
    }

    return new Promise((resolve, reject) => {
      // Attempt to decode it as ADPCM audio
      decodeADPCMAudio(ab, function(err, buffer) {
        if (buffer) {
          resolve(buffer);
          return;
        }
        // Hope that the audio context will know what to do
        return audio.context.decodeAudioData(ab)
          .then((buffer) => resolve(buffer));
      });
    });
  };
};
