// Minimal type definition file for JSZip
// Only types what we use

declare namespace JSZip {
  export interface Zip {
    file(path: string): File;
  }

  export interface File {
    async(type: string): Promise<string | ArrayBuffer>;
    name: string;
  }

  export interface Base {
    loadAsync(buffer: ArrayBuffer): Promise<Zip>;
  }
}

declare var JSZip: JSZip.Base;
