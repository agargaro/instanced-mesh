import { DataTexture, FloatType, IntType, PixelFormat, RedFormat, RedIntegerFormat, RGBAFormat, RGBAIntegerFormat, RGFormat, RGIntegerFormat, TextureDataType, TypedArray, UnsignedIntType, WebGLRenderer, WebGLUtils } from 'three';
import { UniformMap, UniformValue, UniformValueObj } from '../feature/Uniforms.js';

export type ChannelSize = 1 | 2 | 3 | 4;
export type TypedArrayConstructor = new (count: number) => TypedArray;
export type TextureInfo = { array: TypedArray; size: number; format: PixelFormat; type: TextureDataType };
export type UpdateRowInfo = { index: number; count: number };

export function getSquareTextureSize(capacity: number, stride: number): number {
  return Math.max(stride, Math.ceil(Math.sqrt(capacity / stride)) * stride);
}

export function getSquareTextureInfo(arrayType: TypedArrayConstructor, channels: ChannelSize, stride: number, capacity: number): TextureInfo {
  if (channels === 3) {
    console.warn('"channels" cannot be 3. Set to 4. More info: https://github.com/mrdoob/three.js/pull/23228');
    channels = 4;
  }

  const size = getSquareTextureSize(capacity, stride);
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

  return { array, size, type, format };
}

export class SquareDataTexture extends DataTexture {
  public partialUpdate = true;
  // public maxUpdateCalls = 5; // TODO implement
  /** @internal */ _data: TypedArray;
  protected _channels: ChannelSize;
  protected _stride: number;
  protected _rowToUpdate: boolean[];
  protected _uniformMap: UniformMap;
  protected _renderer: WebGLRenderer = null;
  protected _gl: WebGL2RenderingContext = null;
  protected _utils: WebGLUtils = null;

  constructor(arrayType: TypedArrayConstructor, channels: ChannelSize, stride: number, capacity: number, uniformMap?: UniformMap) {
    const { array, format, size, type } = getSquareTextureInfo(arrayType, channels, stride, capacity);
    super(array, size, size, format, type);
    this._data = array;
    this._channels = channels;
    this._stride = stride;
    this._rowToUpdate = new Array(size);
    this._uniformMap = uniformMap;
    this.needsUpdate = true;
  }

  public resize(count: number): void {
    const size = getSquareTextureSize(count, this._stride);
    if (size === this.image.width) return;

    const currentData = this._data;
    const channels = this._channels;
    this._rowToUpdate.length = size;
    const arrayType = (currentData as any).constructor;

    const data = new arrayType(size * size * channels);
    const minLength = Math.min(currentData.length, data.length);
    data.set(new arrayType(currentData.buffer, 0, minLength));

    this.dispose();
    this.image = { data, height: size, width: size };
    this._data = data;
  }

  public enqueueUpdate(index: number): void {
    if (!this.partialUpdate) {
      this.needsUpdate = true;
      return;
    }

    const elementsPerRow = this.image.width / this._stride;
    const rowIndex = Math.floor(index / elementsPerRow);
    this._rowToUpdate[rowIndex] = true;
  }

  public update(renderer: WebGLRenderer): void {
    if (!this.partialUpdate) return;
    const info = this.getUpdateRowsInfo();
    if (info.length === 0) return;

    this.initRendererInfo(renderer);
    this.updateRows(info);
    this._rowToUpdate.fill(false); // TODO improve
  }

  protected getUpdateRowsInfo(): UpdateRowInfo[] {
    const rowsToUpdate = this._rowToUpdate;
    const result: UpdateRowInfo[] = [];

    for (let i = 0, l = rowsToUpdate.length; i < l; i++) {
      if (rowsToUpdate[i]) {
        const index = i;
        for (; i < l; i++) {
          if (!rowsToUpdate[i]) break;
        }
        result.push({ index, count: i - index });
      }
    }

    return result;
  }

  protected initRendererInfo(renderer: WebGLRenderer): void {
    if (!this._renderer) this._renderer = renderer;
    if (!this._gl) this._gl = renderer.getContext() as WebGL2RenderingContext;
    if (!this._utils) this._utils = new WebGLUtils(this._gl, renderer.extensions);
  }

  protected updateRows(info: UpdateRowInfo[]): void {
    const textureProperties = this._renderer.properties.get(this);
    if (!(textureProperties as any).__webglTexture) return; // TODO to understand better

    const gl = this._gl;
    const format = this._utils.convert(this.format);
    const type = this._utils.convert(this.type);
    const { width, data } = this.image;

    const activeTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);
    gl.bindTexture(gl.TEXTURE_2D, (textureProperties as any).__webglTexture);

    for (const rowInfo of info) {
      const { count, index } = rowInfo;
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, index, width, count, format, type, data, index * width * this._channels);
    }

    gl.bindTexture(gl.TEXTURE_2D, activeTexture);
  }

  public setUniformAt(id: number, name: string, value: UniformValue): void {
    const { offset, size } = this._uniformMap.get(name);
    const stride = this._stride * this._channels; // this should be improved maybe

    if (size === 1) {
      this._data[id * stride + offset] = value as number;
    } else {
      (value as UniformValueObj).toArray(this._data, id * stride + offset);
    }
  }

  public getUniformAt(id: number, name: string, target?: UniformValueObj): UniformValue {
    const { offset, size } = this._uniformMap.get(name);
    const stride = this._stride * this._channels;

    if (size === 1) {
      return this._data[id * stride + offset];
    }

    return target.fromArray(this._data, id * stride + offset);
  }

  public getUniformGLSL(): void {
    return undefined; // TODO
  }
}
