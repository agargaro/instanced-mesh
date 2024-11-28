import { DataTexture, WebGLRenderer, WebGLUtils } from 'three';

export class DataTexture2 extends DataTexture {
  public maxRowUpdate = 5;
  protected _rowToUpdate: number[] = []; // sortedList
  protected _updateAll = false;
  protected _renderer: WebGLRenderer = null;
  protected _gl: WebGL2RenderingContext = null;
  protected _utils: WebGLUtils = null;

  // public enqueueUpdate(index: number): void {
  //   this._rowToUpdate[0] = index;
  // }

  // public update(renderer: WebGLRenderer): void {
  //   if (this._updateAll) {
  //     this._updateAll = false;
  //     this.needsUpdate = true;
  //   } else {
  //     if (this._rowToUpdate.length === 0) return;
  //     if (!this._renderer) this._renderer = renderer;
  //     if (!this._gl) this._gl = renderer.getContext() as WebGL2RenderingContext;
  //     if (!this._utils) this._utils = new WebGLUtils(this._gl, renderer.extensions);

  //     // TODO
  //     this.updateRows([0], [2]);
  //   }

  //   this._rowToUpdate.length = 0;
  // }

  // protected updateRows(indexes: number[], counts: number[]): void {
  //   const textureProperties = this._renderer.properties.get(this);
  //   if (!(textureProperties as any).__webglTexture) return;

  //   const gl = this._gl;
  //   const format = this._utils.convert(this.format);
  //   const type = this._utils.convert(this.type);
  //   const width = this.image.width;
  //   const data = this.image.data;

  //   const activeTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);

  //   gl.bindTexture(gl.TEXTURE_2D, (textureProperties as any).__webglTexture);

  //   for (let i = 0; i < indexes.length; i++) {
  //     const index = indexes[i];
  //     const count = counts[i];
  //     gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, index, width, count, format, type, data, index * width * 4); // 4 should be channels
  //   }

  //   gl.bindTexture(gl.TEXTURE_2D, activeTexture);
  // }
}
