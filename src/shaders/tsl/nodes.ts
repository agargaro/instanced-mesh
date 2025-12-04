/**
 * TSL (Three.js Shading Language) Nodes for Instanced Rendering
 *
 * These nodes provide the shader code to read per-instance data.
 *
 * For WebGPU, we use the buffer() approach which is the native TSL way
 * to handle instancing. This avoids the "zero buffer binding" errors
 * that can occur with textureLoad when the texture isn't fully initialized.
 *
 * IMPORTANT: For LOD and frustum culling, we need indirection via instanceIndex.array.
 * The built-in gl_InstanceID (0, 1, 2...) doesn't correspond to actual instance IDs
 * after culling. The instanceIndex.array contains the real instance IDs to render.
 *
 * Reference: Three.js InstanceNode (node_modules/three/src/nodes/accessors/InstanceNode.js)
 */

import { Fn, instanceIndex, int, ivec2, mat4, vec4, vec3, textureLoad, texture } from 'three/tsl';
import { buffer, storage } from 'three/tsl';
import { StorageBufferAttribute } from 'three/webgpu';

// Maximum instances for buffer-based approach (UBO limit is 64KB = 16 floats * 4 bytes * 1000 = 64KB)
const MAX_UBO_INSTANCES = 1000;

/**
 * Gets instance color from a Float32Array buffer using direct gl_InstanceID indexing.
 *
 * WARNING: This uses gl_InstanceID directly which only works when all instances are rendered
 * in order (0, 1, 2, ...). For LOD/culling, use getColorFromBufferIndexed instead.
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
 * Gets instance matrix from a Float32Array buffer using direct gl_InstanceID indexing.
 *
 * WARNING: This uses gl_InstanceID directly which only works when all instances are rendered
 * in order (0, 1, 2, ...). For LOD/culling, use getMatrixFromBufferIndexed instead.
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
 * Gets instance color from a StorageBufferAttribute using an index buffer for indirection.
 *
 * This is the correct approach for LOD/culling where instanceIndex.array contains the
 * actual instance IDs to render (e.g., [5, 12, 3] instead of [0, 1, 2]).
 *
 * IMPORTANT: Uses storage() instead of buffer() for the color data to ensure
 * dynamic updates work correctly. The StorageBufferAttribute.needsUpdate flag
 * triggers proper GPU buffer uploads each frame.
 *
 * @param colorAttribute - Pre-created StorageBufferAttribute for color data (reusable, updated each frame)
 * @param indexAttribute - Pre-created StorageBufferAttribute for index indirection (reusable across frames)
 * @param dataCount - Total number of instances in the color data buffer
 * @param indexCount - Number of indices in the index buffer (instances to render)
 * @returns TSL node representing the instance color
 */
export const getColorFromBufferIndexed = (
  colorAttribute: StorageBufferAttribute,
  indexAttribute: StorageBufferAttribute,
  dataCount: number,
  indexCount: number
): any => {
  if (dataCount <= MAX_UBO_INSTANCES && indexCount <= MAX_UBO_INSTANCES) {
    // Use storage buffer for index array (passed in, reusable across frames)
    // Storage buffers don't have the 16-byte alignment restriction that uniform arrays do
    const indexBuffer = storage(indexAttribute, 'uint', Math.max(indexCount, 1)).toReadOnly();
    // Look up the actual instance ID from the index buffer using gl_InstanceID
    const actualIndex = indexBuffer.element(instanceIndex);
    // Use storage() for color data to support dynamic updates via needsUpdate flag
    // This is crucial for LOD children that need to read updated color values each frame
    const colorBuffer = storage(colorAttribute, 'vec4', Math.max(dataCount, 1)).toReadOnly();
    return colorBuffer.element(actualIndex);
  }
  console.warn('Buffer exceeds UBO limit for indexed access');
  return vec4(1, 1, 1, 1);
};

/**
 * Gets instance matrix from a StorageBufferAttribute using an index buffer for indirection.
 *
 * This is the correct approach for LOD/culling where instanceIndex.array contains the
 * actual instance IDs to render (e.g., [5, 12, 3] instead of [0, 1, 2]).
 *
 * IMPORTANT: Uses storage() instead of buffer() for the matrix data to ensure
 * dynamic updates work correctly. The StorageBufferAttribute.needsUpdate flag
 * triggers proper GPU buffer uploads each frame. This is crucial for LOD children
 * that need to read updated matrix values from the parent's data each frame.
 *
 * @param matrixAttribute - Pre-created StorageBufferAttribute for matrix data (reusable, updated each frame)
 * @param indexAttribute - Pre-created StorageBufferAttribute for index indirection (reusable across frames)
 * @param dataCount - Total number of instances in the matrix data buffer
 * @param indexCount - Number of indices in the index buffer (instances to render)
 * @returns TSL node representing the instance matrix (mat4)
 */
export const getMatrixFromBufferIndexed = (
  matrixAttribute: StorageBufferAttribute,
  indexAttribute: StorageBufferAttribute,
  dataCount: number,
  indexCount: number
): any => {
  if (dataCount <= MAX_UBO_INSTANCES && indexCount <= MAX_UBO_INSTANCES) {
    // Use storage buffer for index array (passed in, reusable across frames)
    // Storage buffers don't have the 16-byte alignment restriction that uniform arrays do
    const indexBuffer = storage(indexAttribute, 'uint', Math.max(indexCount, 1)).toReadOnly();
    // Look up the actual instance ID from the index buffer using gl_InstanceID
    const actualIndex = indexBuffer.element(instanceIndex);
    // Use storage() for matrix data to support dynamic updates via needsUpdate flag
    // This is crucial for LOD children that need to read updated matrix values each frame
    const matrixBuffer = storage(matrixAttribute, 'mat4', Math.max(dataCount, 1)).toReadOnly();
    return matrixBuffer.element(actualIndex);
  }
  console.warn('Buffer exceeds UBO limit for indexed access');
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
