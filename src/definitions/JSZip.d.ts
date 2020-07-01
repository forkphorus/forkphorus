// Minimal type definition file for JSZip
// Only types what we use

declare namespace JSZip {
  export interface File {
    async(type: 'arrayBuffer'): Promise<ArrayBuffer>;
    async(type: 'text'): Promise<string>;
    async(type: 'binarystring'): Promise<string>;
    async(type: 'base64'): Promise<string>;
    name: string;
  }
}

declare class JSZip {
  constructor();
  file(path: string): JSZip.File;
  file(path: string, data: string | ArrayBuffer | Uint8Array | Blob): JSZip.File;
  generateAsync(options: { type: 'arraybuffer' }): Promise<ArrayBuffer>;
  static loadAsync(buffer: ArrayBuffer): Promise<JSZip>;
}
