namespace P.m3 {
  // Most of this is from:
  // https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html
  // Eventually I want to move this to the shader itself.

  export type Matrix3 = [
    number, number, number,
    number, number, number,
    number, number, number
  ];

  export function identity(): Matrix3 {
    return [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1,
    ];
  }

  export function multiply(a: Matrix3, b: Matrix3): Matrix3 {
    const a0 = a[0];
    const a1 = a[1];
    const a2 = a[2];
    const a3 = a[3];
    const a4 = a[4];
    const a5 = a[5];
    const a6 = a[6];
    const a7 = a[7];
    const a8 = a[8];
    const b0 = b[0];
    const b1 = b[1];
    const b2 = b[2];
    const b3 = b[3];
    const b4 = b[4];
    const b5 = b[5];
    const b6 = b[6];
    const b7 = b[7];
    const b8 = b[8];
    return [
      b0 * a0 + b1 * a3 + b2 * a6,
      b0 * a1 + b1 * a4 + b2 * a7,
      b0 * a2 + b1 * a5 + b2 * a8,
      b3 * a0 + b4 * a3 + b5 * a6,
      b3 * a1 + b4 * a4 + b5 * a7,
      b3 * a2 + b4 * a5 + b5 * a8,
      b6 * a0 + b7 * a3 + b8 * a6,
      b6 * a1 + b7 * a4 + b8 * a7,
      b6 * a2 + b7 * a5 + b8 * a8,
    ];
  }

  export function translation(x: number, y: number): Matrix3 {
    return [
      1, 0, 0,
      0, 1, 0,
      x, y, 1,
    ];
  }

  export function rotation(degrees: number): Matrix3 {
    const radians = degrees * Math.PI / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return [
      cos, -sin, 0,
      sin, cos, 0,
      0, 0, 1,
    ];
  }

  export function scaling(x: number, y: number): Matrix3 {
    return [
      x, 0, 0,
      0, y, 0,
      0, 0, 1,
    ];
  }

  export function projection(width: number, height: number): Matrix3 {
    return [
      2 / width, 0, 0,
      0, -2 / height, 0,
      -1, 1, 1,
    ];
  }
}
