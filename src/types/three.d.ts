import 'three';

declare module 'three' {
  interface Quaternion {
    _x: number;
    _y: number;
    _z: number;
    _w: number;
  }
}
