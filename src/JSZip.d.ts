// Minimal type definition file for JSZip
// Only types what we use

declare namespace JSZip {
  export interface Zip {
    file(path: string): File;
  }

  export interface File {
    async(type: 'arrayBuffer'): Promise<ArrayBuffer>;
    async(type: 'text'): Promise<string>;
    async(type: 'binarystring'): Promise<string>;
    async(type: 'base64'): Promise<string>;
    name: string;
  }

  export interface Base {
    loadAsync(buffer: ArrayBuffer): Promise<Zip>;
  }
}

declare var JSZip: JSZip.Base;
