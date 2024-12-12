import { DataTexture, FloatType, IntType, PixelFormat, RedFormat, RedIntegerFormat, RGBAFormat, RGBAIntegerFormat, RGFormat, RGIntegerFormat, TextureDataType, TypedArray, UnsignedIntType, WebGLRenderer, WebGLUtils } from 'three';
import { UniformMap, UniformValue, UniformValueObj } from '../feature/Uniforms.js';

/**
 * Represents the number of elements per pixel.
 */
export type ChannelSize = 1 | 2 | 3 | 4;
/**
 * A constructor signature for creating TypedArray.
 */
export type TypedArrayConstructor = new (count: number) => TypedArray;
/**
 * Represents the texture information including its data, size, format, and data type.
 */
export type TextureInfo = { array: TypedArray; size: number; format: PixelFormat; type: TextureDataType };
/**
 * Represents information for updating rows in the texture, including the row index and number of rows.
 */
export type UpdateRowInfo = { row: number; count: number };

/**
 * Calculates the square texture size based on the capacity and pixels per instance.
 * This ensures the texture is large enough to store all instances in a square layout.
 * @param capacity The maximum number of instances allowed in the texture.
 * @param pixelsPerInstance The number of pixels required for each instance.
 * @returns The size of the square texture needed to store all the instances.
 */
export function getSquareTextureSize(capacity: number, pixelsPerInstance: number): number {
  return Math.max(pixelsPerInstance, Math.ceil(Math.sqrt(capacity / pixelsPerInstance)) * pixelsPerInstance);
}

/**
 * Generates texture information (size, format, type) for a square texture based on the provided parameters.
 * @param arrayType The constructor for the TypedArray.
 * @param channels The number of channels in the texture.
 * @param pixelsPerInstance The number of pixels required for each instance.
 * @param capacity The maximum number of instances allowed in the texture.
 * @returns An object containing the texture's array, size, format, and data type.
 */
export function getSquareTextureInfo(arrayType: TypedArrayConstructor, channels: ChannelSize, pixelsPerInstance: number, capacity: number): TextureInfo {
  if (channels === 3) {
    console.warn('"channels" cannot be 3. Set to 4. More info: https://github.com/mrdoob/three.js/pull/23228');
    channels = 4;
  }

  const size = getSquareTextureSize(capacity, pixelsPerInstance);
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

/**
 * A class that extends `DataTexture` to manage a square texture optimized for instances rendering.
 * It supports dynamic resizing, partial update based on rows, and allows setting/getting uniforms per instance.
 */
export class SquareDataTexture extends DataTexture {
  /**
   * Whether to enable partial texture updates by row. If `false`, the entire texture will be updated.
   * @default true.
   */
  public partialUpdate = true;
  /**
   * The maximum number of update calls per frame.
   * @default 100
   */
  public maxUpdateCalls = 100;
  /** @internal */ _data: TypedArray;
  protected _channels: ChannelSize;
  protected _pixelsPerInstance: number;
  protected _stride: number;
  protected _rowToUpdate: boolean[];
  protected _uniformMap: UniformMap;
  protected _renderer: WebGLRenderer = null;
  protected _gl: WebGL2RenderingContext = null;
  protected _utils: WebGLUtils = null;

  /**
   * @param arrayType The constructor for the TypedArray.
   * @param channels The number of channels in the texture.
   * @param pixelsPerInstance The number of pixels required for each instance.
   * @param capacity The total number of instances.
   * @param uniformMap Optional map for handling uniform values.
   */
  constructor(arrayType: TypedArrayConstructor, channels: ChannelSize, pixelsPerInstance: number, capacity: number, uniformMap?: UniformMap) {
    const { array, format, size, type } = getSquareTextureInfo(arrayType, channels, pixelsPerInstance, capacity);
    super(array, size, size, format, type);
    this._data = array;
    this._channels = channels;
    this._pixelsPerInstance = pixelsPerInstance;
    this._stride = pixelsPerInstance * channels;
    this._rowToUpdate = new Array(size);
    this._uniformMap = uniformMap;
    this.needsUpdate = true;
  }

  /**
   * Resizes the texture to accommodate a new number of instances.
   * @param count The new total number of instances.
   */
  public resize(count: number): void {
    const size = getSquareTextureSize(count, this._pixelsPerInstance);
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

  /**
   * Marks a row of the texture for update during the next render cycle.
   * This helps in optimizing texture updates by only modifying the rows that have changed.
   * @param index The index of the instance to update.
   */
  public enqueueUpdate(index: number): void {
    if (!this.partialUpdate) {
      this.needsUpdate = true;
      return;
    }

    const elementsPerRow = this.image.width / this._pixelsPerInstance;
    const rowIndex = Math.floor(index / elementsPerRow);
    this._rowToUpdate[rowIndex] = true;
  }

  /**
   * Updates the texture data based on the rows that need updating.
   * This method is optimized to only update the rows that have changed, improving performance.
   * @param renderer The WebGLRenderer used for rendering.
   */
  public update(renderer: WebGLRenderer): void {
    if (!this.partialUpdate) return;
    const rowsInfo = this.getUpdateRowsInfo();
    if (rowsInfo.length === 0) return;

    if (rowsInfo.length > this.maxUpdateCalls) {
      this.needsUpdate = true;
    } else {
      this.initRendererInfo(renderer);
      this.updateRows(rowsInfo);
    }

    this._rowToUpdate.fill(false);
  }

  protected getUpdateRowsInfo(): UpdateRowInfo[] {
    const rowsToUpdate = this._rowToUpdate;
    const result: UpdateRowInfo[] = [];

    for (let i = 0, l = rowsToUpdate.length; i < l; i++) {
      if (rowsToUpdate[i]) {
        const row = i;
        for (; i < l; i++) {
          if (!rowsToUpdate[i]) break;
        }
        result.push({ row, count: i - row });
      }
    }

    return result;
  }

  protected initRendererInfo(renderer: WebGLRenderer): void {
    if (!this._renderer) this._renderer = renderer;
    if (!this._gl) this._gl = renderer.getContext() as WebGL2RenderingContext;
    if (!this._utils) this._utils = new WebGLUtils(this._gl, renderer.extensions);
  }

  // Reference: https://github.com/mrdoob/three.js/blob/master/src/renderers/WebGLRenderer.js#L2569
  protected updateRows(info: UpdateRowInfo[]): void {
    const state = this._renderer.state;
    const gl = this._gl;
    const glFormat = this._utils.convert(this.format);
    const glType = this._utils.convert(this.type);
    const { data, height, width } = this.image;

    const textureProperties: any = this._renderer.properties.get(this);
    if (!textureProperties.__webglTexture) return;

    state.bindTexture(gl.TEXTURE_2D, textureProperties.__webglTexture);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.flipY);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premultiplyAlpha);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, this.unpackAlignment);

    const currentUnpackRowLen = gl.getParameter(gl.UNPACK_ROW_LENGTH);
    const currentUnpackImageHeight = gl.getParameter(gl.UNPACK_IMAGE_HEIGHT);
    const currentUnpackSkipPixels = gl.getParameter(gl.UNPACK_SKIP_PIXELS);
    const currentUnpackSkipRows = gl.getParameter(gl.UNPACK_SKIP_ROWS);
    const currentUnpackSkipImages = gl.getParameter(gl.UNPACK_SKIP_IMAGES);

    gl.pixelStorei(gl.UNPACK_ROW_LENGTH, width);
    gl.pixelStorei(gl.UNPACK_IMAGE_HEIGHT, height);
    gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, 0); // start x axis
    gl.pixelStorei(gl.UNPACK_SKIP_IMAGES, 0); // start z axis

    for (const { count, row } of info) {
      gl.pixelStorei(gl.UNPACK_SKIP_ROWS, row); // start y axis
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, row, width, count, glFormat, glType, data);
    }

    gl.pixelStorei(gl.UNPACK_ROW_LENGTH, currentUnpackRowLen);
    gl.pixelStorei(gl.UNPACK_IMAGE_HEIGHT, currentUnpackImageHeight);
    gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, currentUnpackSkipPixels);
    gl.pixelStorei(gl.UNPACK_SKIP_ROWS, currentUnpackSkipRows);
    gl.pixelStorei(gl.UNPACK_SKIP_IMAGES, currentUnpackSkipImages);

    state.unbindTexture();
  }

  /**
   * Sets a uniform value at the specified instance ID in the texture.
   * @param id The instance ID to set the uniform for.
   * @param name The name of the uniform.
   * @param value The value to set for the uniform.
   */
  public setUniformAt(id: number, name: string, value: UniformValue): void {
    const { offset, size } = this._uniformMap.get(name);
    const stride = this._stride;

    if (size === 1) {
      this._data[id * stride + offset] = value as number;
    } else {
      (value as UniformValueObj).toArray(this._data, id * stride + offset);
    }
  }

  /**
   * Retrieves a uniform value at the specified instance ID from the texture.
   * @param id The instance ID to retrieve the uniform from.
   * @param name The name of the uniform.
   * @param target Optional target object to store the uniform value.
   * @returns The uniform value for the specified instance.
   */
  public getUniformAt(id: number, name: string, target?: UniformValueObj): UniformValue {
    const { offset, size } = this._uniformMap.get(name);
    const stride = this._stride;

    if (size === 1) {
      return this._data[id * stride + offset];
    }

    return target.fromArray(this._data, id * stride + offset);
  }

  /**
   * Generates the GLSL code for accessing the uniform data stored in the texture.
   * @param textureName The name of the texture in the GLSL shader.
   * @param indexName The name of the index in the GLSL shader.
   * @returns The GLSL code to access the uniform data.
   */
  public getUniformsFragmentGLSL(textureName: string, indexName: string): string {
    // TODO override uniform also in vertex shader
    const pixelsPerInstance = this._pixelsPerInstance;
    const uniforms = this._uniformMap;

    let texelsFetch = `
      int size = textureSize(${textureName}, 0).x;
      int j = int(${indexName}) * ${pixelsPerInstance};
      int x = j % size;
      int y = j / size;
    `;
    for (let i = 0; i < this._pixelsPerInstance; i++) {
      texelsFetch += `vec4 _texel${i} = texelFetch(${textureName}, ivec2(x + ${i}, y), 0);\n`;
    }

    let getData = '';
    for (const [name, { type, offset, size }] of uniforms) {
      const tId = Math.floor(offset / this._channels);

      if (type === 'mat3') {
        getData += `mat3 ${name} = mat3(texel${tId}.rgb, vec3(texel${tId}.a, texel${tId + 1}.rg), vec3(texel${tId + 1}.ba, texel${tId + 2}.r));\n`;
      } else if (type === 'mat4') {
        getData += `mat4 ${name} = mat4(texel${tId}, texel${tId + 1}, texel${tId + 2}, texel${tId + 3});\n`;
      } else {
        const components = this.getUniformComponents(offset, size);
        getData += `${type} ${name} = _texel${tId}.${components};\n`;
      }
    }

    return `
      uniform highp sampler2D ${textureName};  

      void main() {
        ${texelsFetch}
        ${getData}`;
  }

  protected getUniformComponents(offset: number, size: number): string {
    const startIndex = offset % this._channels;
    let components = '';

    for (let i = 0; i < size; i++) {
      components += componentsArray[startIndex + i];
    }

    return components;
  }
}

const componentsArray = ['r', 'g', 'b', 'a'];
