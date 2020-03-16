/// <reference path="../phosphorus.ts" />

namespace P.m3 {
  export type Matrix3 = [
    number, number, number,
    number, number, number,
    number, number, number
  ];

  /**
   * Multiplies two 3x3 matrices together
   * @param out The first matrix. The result will be stored here.
   * @param other The second matrix.
   */
  export function multiply(out: Matrix3, other: Matrix3) {
    const a0 = out[0];
    const a1 = out[1];
    const a2 = out[2];
    const a3 = out[3];
    const a4 = out[4];
    const a5 = out[5];
    const a6 = out[6];
    const a7 = out[7];
    const a8 = out[8];
    const b0 = other[0];
    const b1 = other[1];
    const b2 = other[2];
    const b3 = other[3];
    const b4 = other[4];
    const b5 = other[5];
    const b6 = other[6];
    const b7 = other[7];
    const b8 = other[8];
    out[0] = b0 * a0 + b1 * a3 + b2 * a6;
    out[1] = b0 * a1 + b1 * a4 + b2 * a7;
    out[2] = b0 * a2 + b1 * a5 + b2 * a8;
    out[3] = b3 * a0 + b4 * a3 + b5 * a6;
    out[4] = b3 * a1 + b4 * a4 + b5 * a7;
    out[5] = b3 * a2 + b4 * a5 + b5 * a8;
    out[6] = b6 * a0 + b7 * a3 + b8 * a6;
    out[7] = b6 * a1 + b7 * a4 + b8 * a7;
    out[8] = b6 * a2 + b7 * a5 + b8 * a8;
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
