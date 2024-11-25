import { TypedArray } from 'three';
import { TextureImageData } from 'three/src/textures/types.js';
import { ChannelSize, getTextureSquareSize } from './CreateTexture.js';

export function resizeSquareTextureArray_number(array: TypedArray, count: number): TextureImageData {
  return resizeSquareTextureArray(array, 1, 1, count);
}

export function resizeSquareTextureArray_vec2(array: TypedArray, count: number): TextureImageData {
  return resizeSquareTextureArray(array, 2, 1, count);
}

export function resizeSquareTextureArray_vec4(array: TypedArray, count: number): TextureImageData {
  return resizeSquareTextureArray(array, 4, 1, count);
}

export function resizeSquareTextureArray_mat3(array: TypedArray, count: number): TextureImageData {
  return resizeSquareTextureArray(array, 4, 3, count);
}

export function resizeSquareTextureArray_mat4(array: TypedArray, count: number): TextureImageData {
  return resizeSquareTextureArray(array, 4, 4, count);
}

export function resizeSquareTextureArray(array: TypedArray, channels: ChannelSize, stride: number, count: number): TextureImageData {
  const size = getTextureSquareSize(count, stride);
  const newArray = new (array as any).constructor(size * size * channels);
  newArray.set(array);
  return { data: newArray, height: size, width: size };
}
