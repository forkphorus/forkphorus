// Minimal type definition file for scratch-sb1-converter
// Assumes that it is exported on window.ScratchSB1Converter

declare namespace ScratchSB1Converter {
  type ProjectJSON = any;

  interface ZipFile {
    bytes: Uint8Array;
  }

  class SB1File {
    constructor(buffer: ArrayBuffer);
    json: ProjectJSON;
    zip: {
      files: { [s: string]: ZipFile; };
    };
  }
}
