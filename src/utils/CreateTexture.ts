import { FloatType, IntType, PixelFormat, RedFormat, RedIntegerFormat, RGBAFormat, RGBAIntegerFormat, RGFormat, RGIntegerFormat, TextureDataType, TypedArray, UnsignedIntType } from 'three';
import { DataTexture2 } from '../core/utils/DataTexture2.js';

export type ChannelSize = 1 | 2 | 3 | 4;
export type TypedArrayConstructor = new (count: number) => TypedArray;

export function getTextureSquareSize(count: number, stride: number): number {
  return Math.max(stride, Math.ceil(Math.sqrt(count / stride)) * stride);
}

export function createSquareTexture_float(count: number): DataTexture2 {
  return createSquareTexture(Float32Array, 1, 1, count);
}

export function createSquareTexture_uint(count: number): DataTexture2 {
  return createSquareTexture(Uint32Array, 1, 1, count);
}

export function createSquareTexture_vec2(count: number): DataTexture2 {
  return createSquareTexture(Float32Array, 2, 1, count);
}

export function createSquareTexture_vec4(count: number): DataTexture2 {
  return createSquareTexture(Float32Array, 4, 1, count);
}

export function createSquareTexture_mat3(count: number): DataTexture2 {
  return createSquareTexture(Float32Array, 4, 3, count);
}

export function createSquareTexture_mat4(count: number): DataTexture2 {
  return createSquareTexture(Float32Array, 4, 4, count);
}

export function createSquareTexture(arrayType: TypedArrayConstructor, channels: ChannelSize, stride: number, count: number): DataTexture2 {
  if (channels === 3) {
    console.warn('"channels" cannot be 3. Set to 4. More info: https://github.com/mrdoob/three.js/pull/23228');
    channels = 4;
  }

  const size = getTextureSquareSize(count, stride);
  const array = new arrayType(size * size * channels);
  const isFloat = arrayType.name.includes('Float');
  const isUnsignedInt = arrayType.name.includes('Uint');
  const type: TextureDataType = isFloat ? FloatType : (isUnsignedInt ? UnsignedIntType : IntType);
  let format: PixelFormat;

  switch (channels) {
    case 1:
      format = isFloat ? RedFormat : RedIntegerFormat;
      break;
    case 2:
      format = isFloat ? RGFormat : RGIntegerFormat;
      break;
    case 4:
      format = isFloat ? RGBAFormat : RGBAIntegerFormat;
      break;
  }

  const texture = new DataTexture2(array, size, size, format, type);
  texture.needsUpdate = true;
  return texture;
}
