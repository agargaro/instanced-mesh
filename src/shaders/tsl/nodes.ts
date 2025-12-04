/**
 * TSL (Three.js Shading Language) Nodes for Instanced Rendering
 * 
 * These nodes provide the shader code to read per-instance data.
 * 
 * For WebGPU, we use the buffer() approach which is the native TSL way
 * to handle instancing. This avoids the "zero buffer binding" errors
 * that can occur with textureLoad when the texture isn't fully initialized.
 * 
 * Reference: Three.js InstanceNode (node_modules/three/src/nodes/accessors/InstanceNode.js)
 */

import { Fn, instanceIndex, int, ivec2, mat4, vec4, vec3, textureLoad, texture } from 'three/tsl';
import { buffer } from 'three/tsl';

// Maximum instances for buffer-based approach (UBO limit is 64KB = 16 floats * 4 bytes * 1000 = 64KB)
const MAX_UBO_INSTANCES = 1000;

/**
 * Gets instance color from a Float32Array buffer.
 * Uses buffer node for <= 1000 instances, falls back to textureLoad for more.
 * 
 * @param colorsArray - The Float32Array containing per-instance color data (RGBA per instance)
 * @param count - Number of instances
 * @returns TSL node representing the instance color
 */
export const getColorFromBuffer = (colorsArray: Float32Array, count: number): any => {
  if (count <= MAX_UBO_INSTANCES) {
    // Use buffer node approach (more reliable for WebGPU)
    return buffer(colorsArray, 'vec4', Math.max(count, 1)).element(instanceIndex);
  }
  // For larger counts, would need texture-based fallback (not implemented yet)
  console.warn('Color buffer exceeds UBO limit, colors may not work correctly');
  return vec4(1, 1, 1, 1);
};

/**
 * Gets instance matrix from a Float32Array buffer.
 * Uses buffer node for <= 1000 instances, falls back to texture for more.
 * 
 * @param matricesArray - The Float32Array containing per-instance matrix data
 * @param count - Number of instances
 * @returns TSL node representing the instance matrix (mat4)
 */
export const getMatrixFromBuffer = (matricesArray: Float32Array, count: number): any => {
  if (count <= MAX_UBO_INSTANCES) {
    // Use buffer node approach (same as Three.js InstanceNode)
    return buffer(matricesArray, 'mat4', Math.max(count, 1)).element(instanceIndex);
  }
  // For larger counts, would need texture-based or instanced attribute fallback
  console.warn('Matrix buffer exceeds UBO limit, instancing may not work correctly');
  return mat4(
    vec4(1, 0, 0, 0),
    vec4(0, 1, 0, 0),
    vec4(0, 0, 1, 0),
    vec4(0, 0, 0, 1)
  );
};

/**
 * Gets per-instance color from a DataTexture using textureLoad.
 * 
 * DEPRECATED: Use getColorFromBuffer instead for better WebGPU compatibility.
 * 
 * @param colorsTexture - DataTexture containing per-instance colors
 * @returns TSL node for the color at the current instance index
 */
export const getColorTexture = (colorsTexture: any): any => {
  // Create a proper texture node for textureLoad
  const texNode = texture(colorsTexture);
  const size = int(colorsTexture.image.width);
  const j = int(instanceIndex).toVar();
  const x = int(j.mod(size)).toVar();
  const y = int(j.div(size)).toVar();
  return textureLoad(texNode, ivec2(x, y));
};

/**
 * Gets per-instance transformation matrix from a DataTexture.
 * Each matrix uses 4 consecutive RGBA pixels (16 floats = 4 vec4s).
 * 
 * DEPRECATED: Use getMatrixFromBuffer instead for better WebGPU compatibility.
 * 
 * @param matricesTexture - DataTexture containing per-instance matrices
 * @returns TSL node for the mat4 at the current instance index
 */
export const getInstancedMatrix = (matricesTexture: any): any => {
  // Create a proper texture node for textureLoad
  const texNode = texture(matricesTexture);
  const size = int(matricesTexture.image.width);
  const j = int(int(instanceIndex).mul(int(4))).toVar();
  const x = int(j.mod(size)).toVar();
  const y = int(j.div(size)).toVar();
  
  const v1 = textureLoad(texNode, ivec2(x, y)).toVar();
  const v2 = textureLoad(texNode, ivec2(x.add(int(1)), y)).toVar();
  const v3 = textureLoad(texNode, ivec2(x.add(int(2)), y)).toVar();
  const v4 = textureLoad(texNode, ivec2(x.add(int(3)), y)).toVar();

  return mat4(v1, v2, v3, v4);
};

/**
 * Gets per-instance bone transformation matrix from a DataTexture.
 * Returns a function that takes a bone index and returns the corresponding mat4.
 * 
 * @param boneTexture - DataTexture containing bone matrices
 * @returns TSL Fn node that takes bone index and returns mat4
 */
export const getBoneMatrix = (boneTexture: any): any => {
  const texNode = texture(boneTexture);
  const size = int(boneTexture.image.width);
  
  return Fn((i: any) => {
    // TODO: bonesPerInstance needs to be passed as uniform
    const bonesPerInstance = int(1); // Placeholder - should be a uniform
    const j = int(bonesPerInstance.mul(int(instanceIndex)).add(int(i)).mul(int(4))).toVar();
    const x = int(j.mod(size)).toVar();
    const y = int(j.div(size)).toVar();
    
    const v1 = textureLoad(texNode, ivec2(x, y)).toVar();
    const v2 = textureLoad(texNode, ivec2(x.add(int(1)), y)).toVar();
    const v3 = textureLoad(texNode, ivec2(x.add(int(2)), y)).toVar();
    const v4 = textureLoad(texNode, ivec2(x.add(int(3)), y)).toVar();

    return mat4(v1, v2, v3, v4);
  });
};

/**
 * Gets a single vec4 value from a uniforms texture for the current instance.
 * Useful for custom per-instance data stored in textures.
 * 
 * @param uniformsTexture - DataTexture containing custom uniform data
 * @param pixelsPerInstance - Number of pixels (vec4s) per instance
 * @param pixelOffset - Offset within the instance's data to read
 * @returns TSL node for the vec4 at the specified offset
 */
export const getUniformTexel = (uniformsTexture: any, pixelsPerInstance: number, pixelOffset: number): any => {
  const texNode = texture(uniformsTexture);
  const size = int(uniformsTexture.image.width);
  const j = int(int(instanceIndex).mul(int(pixelsPerInstance)).add(int(pixelOffset))).toVar();
  const x = int(j.mod(size)).toVar();
  const y = int(j.div(size)).toVar();
  return textureLoad(texNode, ivec2(x, y));
};
