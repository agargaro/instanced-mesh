import { Color, Matrix3, Matrix4, Vector2, Vector3, Vector4 } from 'three';
import { ChannelSize, SquareDataTexture } from '../utils/SquareDataTexture.js';
import { InstancedMesh2 } from '../InstancedMesh2.js';

export type UniformType = 'float' | 'vec2' | 'vec3' | 'vec4' | 'mat3' | 'mat4';
export type UniformValueObj = Vector2 | Vector3 | Vector4 | Matrix3 | Matrix4 | Color;
export type UniformValue = number | UniformValueObj;
type UniformMapType = { offset: number; size: number; type: UniformType };
/** @internal */ export type UniformMap = Map<string, UniformMapType>;

/** @internal */
export type UniformSchema<T = any> = {
  [K in keyof T as T[K] extends (...args: any[]) => any ? never : K]?: UniformType;
};

/** @internal */
export interface UniformSchemaResult {
  channels: ChannelSize;
  pixelsPerInstance: number;
  uniformMap: UniformMap;
}

declare module '../InstancedMesh2.js' {
  interface InstancedMesh2 {
    getUniformAt(id: number, name: string, target?: UniformValueObj): UniformValue;
    setUniformAt(id: number, name: string, value: UniformValue): void;
    initUniformsPerInstance<T = any>(schema: UniformSchema<T>): void;
    /** @internal */ getUniforSchemaResult(schema: UniformSchema): UniformSchemaResult;
    /** @internal */ getUniformOffset(size: number, tempOffset: number[]): number;
    /** @internal */ getUniformSize(type: UniformType): number;
  }
}

InstancedMesh2.prototype.getUniformAt = function (id: number, name: string, target?: UniformValueObj): UniformValue { // TODO improve d.ts?
  if (!this.uniformsTexture) {
    throw new Error('Before get/set uniform, it\'s necessary to use "initUniformPerInstance".');
  }
  return this.uniformsTexture.getUniformAt(id, name, target);
};

InstancedMesh2.prototype.setUniformAt = function (id: number, name: string, value: UniformValue): void {
  if (!this.uniformsTexture) {
    throw new Error('Before get/set uniform, it\'s necessary to use "initUniformPerInstance".');
  }
  this.uniformsTexture.setUniformAt(id, name, value);
  this.uniformsTexture.enqueueUpdate(id);
};

InstancedMesh2.prototype.initUniformsPerInstance = function<T> (schema: UniformSchema<T>): void {
  const { channels, pixelsPerInstance, uniformMap } = this.getUniforSchemaResult(schema);
  this.uniformsTexture = new SquareDataTexture(Float32Array, channels, pixelsPerInstance, this._capacity, uniformMap);
};

InstancedMesh2.prototype.getUniforSchemaResult = function (schema: UniformSchema): UniformSchemaResult {
  let totalSize = 0;
  const uniformMap = new Map<string, UniformMapType>();
  let uniforms: { type: UniformType; name: string; size: number }[] = [];

  for (const name in schema) {
    const type = schema[name];
    const size = this.getUniformSize(type);
    totalSize += size;
    uniforms.push({ name, type, size });
  }

  uniforms = uniforms.sort((a, b) => b.size - a.size);

  const tempOffset = [];
  for (const { name, size, type } of uniforms) {
    const offset = this.getUniformOffset(size, tempOffset);
    uniformMap.set(name, { offset, size, type });
  }

  const pixelsPerInstance = Math.ceil(totalSize / 4);
  const channels = Math.min(totalSize, 4) as ChannelSize;

  return { channels, pixelsPerInstance, uniformMap };
};

InstancedMesh2.prototype.getUniformOffset = function (size: number, tempOffset: number[]): number {
  if (size < 4) {
    for (let i = 0; i < tempOffset.length; i++) {
      if (tempOffset[i] + size <= 4) {
        const offset = tempOffset[i];
        tempOffset[i] += size;
        return i * 4 + offset;
      }
    }
  }

  const offset = tempOffset.length;
  for (; size > 0; size -= 4) {
    tempOffset.push(size);
  }

  return offset * 4;
};

InstancedMesh2.prototype.getUniformSize = function (type: UniformType): number {
  switch (type) {
    case 'float': return 1;
    case 'vec2': return 2;
    case 'vec3': return 3;
    case 'vec4': return 4;
    case 'mat3': return 9;
    case 'mat4': return 16;
    default:
      throw new Error(`Invalid uniform type: ${type}`);
  }
};
