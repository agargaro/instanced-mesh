/**
 * WebGPU-specific prototype extensions for InstancedMesh2.
 * This file adds WebGPU-specific rendering methods using TSL (Three.js Shading Language)
 * and standard buffer attributes instead of WebGL-specific classes.
 */

import { BufferAttribute, BufferGeometry, Camera, DynamicDrawUsage, InstancedBufferAttribute, Material, Scene } from 'three';
import { MeshBasicNodeMaterial, StorageBufferAttribute } from 'three/webgpu';
import { positionLocal, vec4 } from 'three/tsl';
import { InstancedMesh2, InstanceIndexAttribute } from './InstancedMesh2.js';
import { getMatrixFromBufferIndexed, getColorFromBufferIndexed } from '../shaders/tsl/nodes.js';
import type { LODRenderList } from './feature/LOD.js';

// Type definitions for WebGPU renderer and TSL
interface WebGPURenderer {
  info: { render: { frame: number } };
  backend?: { device?: GPUDevice };
  render: (scene: Scene, camera: Camera) => void;
}

interface NodeMaterial extends Material {
  positionNode?: any;
  colorNode?: any;
}

// Store TSL node references for materials
const _materialNodes = new WeakMap<Material, { positionNode?: any; colorNode?: any }>();

// Track if materials have been patched to avoid re-patching TSL nodes
const _patchedMaterials = new WeakSet<Material>();

// Track if instanceMatrix has been fixed for WebGPU
const _fixedInstanceMatrix = new WeakSet<InstancedMesh2>();

// Store persistent StorageBufferAttribute for index indirection per mesh
// This buffer is updated each frame with new instance indices for LOD/culling
const _meshIndexBuffers = new WeakMap<InstancedMesh2, StorageBufferAttribute>();

// Store persistent StorageBufferAttribute for matrix data per mesh
// This buffer is updated each frame with matrix data from matricesTexture
// Using storage() instead of buffer() ensures dynamic updates work correctly
const _meshMatrixBuffers = new WeakMap<InstancedMesh2, StorageBufferAttribute>();

// Store persistent StorageBufferAttribute for color data per mesh
const _meshColorBuffers = new WeakMap<InstancedMesh2, StorageBufferAttribute>();

/**
 * Fixes the instanceMatrix buffer size for WebGPU.
 * The base class sets instanceMatrix to an empty Float32Array(0) which
 * causes "Binding size is zero" errors in WebGPU (stricter about buffer sizes).
 */
function fixInstanceMatrixForWebGPU(mesh: InstancedMesh2): void {
  if (_fixedInstanceMatrix.has(mesh)) return;

  const instanceMatrix = (mesh as any).instanceMatrix;
  const matricesTexture = mesh.matricesTexture;

  // Check if we need to fix the buffer
  if (!instanceMatrix || !matricesTexture?.image?.data) return;

  const currentSize = instanceMatrix.array?.length || 0;
  const matricesData = matricesTexture.image.data as Float32Array;
  const requiredSize = matricesData.length;

  if (currentSize < requiredSize) {
    (mesh as any).instanceMatrix = new InstancedBufferAttribute(matricesData, 16);
    (mesh as any).instanceMatrix.setUsage(DynamicDrawUsage);
    _fixedInstanceMatrix.add(mesh);
  }
}

/**
 * WebGPU-specific implementation of initIndexAttribute
 *
 * NOTE: For WebGPU with TSL/NodeMaterials, we need to properly initialize
 * the instanceMatrix buffer. The base class sets it to an empty array which
 * causes "Binding size is zero" errors in WebGPU (which is stricter about buffer sizes).
 */
InstancedMesh2.prototype.initIndexAttribute = function (this: InstancedMesh2): void {
  if (!this._renderer) {
    this.count = 0;
    return;
  }

  const capacity = this._capacity;

  // CRITICAL FIX: The base class sets instanceMatrix to an empty Float32Array(0)
  // which causes "Binding size is zero" errors in WebGPU.
  // We need to provide a properly sized buffer.
  // Use the matricesTexture data if available, otherwise create identity matrices.
  if ((this as any).instanceMatrix?.array?.length === 0 && this.matricesTexture?.image?.data) {
    // Point instanceMatrix to the actual matrices data
    const matricesData = this.matricesTexture.image.data as Float32Array;
    (this as any).instanceMatrix = new InstancedBufferAttribute(matricesData, 16);
    (this as any).instanceMatrix.setUsage(DynamicDrawUsage);
  } else if ((this as any).instanceMatrix?.array?.length === 0) {
    // No matricesTexture yet - create a minimal non-empty buffer
    // This will be replaced when matricesTexture is ready in fixInstanceMatrixForWebGPU
    const minimalData = new Float32Array(16); // 1 identity matrix
    minimalData.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); // identity matrix
    (this as any).instanceMatrix = new InstancedBufferAttribute(minimalData, 16);
    (this as any).instanceMatrix.setUsage(DynamicDrawUsage);
  }

  // For WebGPU, we create a dummy instanceIndex object that tracks count
  // but we do NOT add it to the geometry as an attribute.
  // WebGPU uses the built-in instanceIndex from TSL.
  const instanceIndex = {
    array: new Uint32Array(capacity),
    count: capacity,
    _needsUpdate: false,
    needsUpdate: false,
    update: function (_renderer: any, count: number): void {
      // No-op for WebGPU - the built-in instanceIndex handles this
    }
  } as unknown as InstanceIndexAttribute;

  this.instanceIndex = instanceIndex;
  // DO NOT add to geometry: this._geometry.setAttribute('instanceIndex', ...);
};

/**
 * WebGPU-specific onBeforeShadow implementation
 */
InstancedMesh2.prototype.onBeforeShadow = function (
  this: InstancedMesh2,
  renderer: WebGPURenderer,
  scene: Scene,
  camera: Camera,
  shadowCamera: Camera,
  geometry: BufferGeometry,
  depthMaterial: Material,
  group: any
): void {
  // CRITICAL: LOD children should NOT call performFrustumCulling!
  // The parent mesh handles culling for all LOD levels via frustumCullingLOD.
  const isLODChild = !!this._parentLOD;
  if (!isLODChild) {
    const frame = renderer.info.render.frame;
    if (this.instanceIndex && this.autoUpdate && !this.frustumCullingAlreadyPerformed(frame, camera, shadowCamera)) {
      this.performFrustumCulling(shadowCamera, camera);
    }
  }

  // CRITICAL: Patch material AFTER frustum culling so the index buffer
  // gets the current frame's instance indices, not stale data from previous frame
  patchMaterialWebGPU(this, depthMaterial);

  if (this.count === 0) return;

  // Mark instance index for update
  if (this.instanceIndex?._needsUpdate !== undefined) {
    this.instanceIndex._needsUpdate = true;
  }
  if (this.instanceIndex) {
    this.instanceIndex.needsUpdate = true;
  }

  // Update textures
  updateTexturesWebGPU(this);
};

/**
 * WebGPU-specific onBeforeRender implementation
 */
InstancedMesh2.prototype.onBeforeRender = function (
  this: InstancedMesh2,
  renderer: WebGPURenderer,
  scene: Scene,
  camera: Camera,
  geometry: BufferGeometry,
  material: Material,
  group: any
): void {
  // CRITICAL: Fix instanceMatrix buffer size if needed
  // This must happen before material patching since the shader expects proper buffer sizes
  fixInstanceMatrixForWebGPU(this);

  if (!this.instanceIndex) {
    this._renderer = renderer;
    // Still patch material even if no instanceIndex yet
    patchMaterialWebGPU(this, material);
    return;
  }

  // CRITICAL: LOD children should NOT call performFrustumCulling!
  // The parent mesh handles culling for all LOD levels via frustumCullingLOD.
  // If we call performFrustumCulling on a child, it runs the non-LOD version
  // which overwrites the correct indices set by the parent.
  const isLODChild = !!this._parentLOD;
  if (!isLODChild) {
    const frame = renderer.info.render.frame;
    if (this.autoUpdate && !this.frustumCullingAlreadyPerformed(frame, camera, null)) {
      console.log(`[Parent] performFrustumCulling called, LODinfo.render=${!!this.LODinfo?.render}`);
      this.performFrustumCulling(camera);
    }
  } else {
    console.log(`[LOD Child] skipping performFrustumCulling, count=${this.count}, instanceIndex.array[0]=${this.instanceIndex?.array?.[0]}`);
  }

  // CRITICAL: Patch material AFTER frustum culling so the index buffer
  // gets the current frame's instance indices, not stale data from previous frame
  patchMaterialWebGPU(this, material);

  if (this.count === 0) return;

  // Mark instance index for update
  if (this.instanceIndex._needsUpdate !== undefined) {
    this.instanceIndex._needsUpdate = true;
  }
  this.instanceIndex.needsUpdate = true;

  // Update textures
  updateTexturesWebGPU(this);
};

/**
 * WebGPU-specific onAfterShadow implementation
 */
InstancedMesh2.prototype.onAfterShadow = function (
  this: InstancedMesh2,
  renderer: WebGPURenderer,
  scene: Scene,
  camera: Camera,
  shadowCamera: Camera,
  geometry: BufferGeometry,
  depthMaterial: Material,
  group: any
): void {
  unpatchMaterialWebGPU(depthMaterial);
};

/**
 * WebGPU-specific onAfterRender implementation
 */
InstancedMesh2.prototype.onAfterRender = function (
  this: InstancedMesh2,
  renderer: WebGPURenderer,
  scene: Scene,
  camera: Camera,
  geometry: BufferGeometry,
  material: Material,
  group: any
): void {
  unpatchMaterialWebGPU(material);
  if (this.instanceIndex || (group && !this.isLastGroup(group.materialIndex))) return;
  this.initIndexAttribute();
};

/**
 * Store the original addLevel method to call from our override.
 */
const originalAddLevel = InstancedMesh2.prototype.addLevel;

/**
 * WebGPU-specific override for addLevel.
 * Uses MeshBasicNodeMaterial as the default instead of ShaderMaterial,
 * since ShaderMaterial is not compatible with WebGPU renderer.
 */
InstancedMesh2.prototype.addLevel = function (
  this: InstancedMesh2,
  renderList: LODRenderList,
  geometry: BufferGeometry,
  material: Material | null | undefined,
  distance: number,
  hysteresis: number
): InstancedMesh2 {
  // Use MeshBasicNodeMaterial as default for WebGPU compatibility
  // ShaderMaterial is not compatible with WebGPU renderer
  const webgpuMaterial = material ?? new MeshBasicNodeMaterial();
  return originalAddLevel.call(this, renderList, geometry, webgpuMaterial, distance, hysteresis);
};

/**
 * Gets or creates a persistent StorageBufferAttribute for index indirection.
 * The buffer is created at full capacity and reused across frames.
 * Its contents are updated each frame with the current instance indices.
 */
function getOrCreateIndexBuffer(mesh: InstancedMesh2): StorageBufferAttribute | null {
  // Check if we already have a buffer for this mesh
  let indexBuffer = _meshIndexBuffers.get(mesh);

  if (!indexBuffer) {
    // Create a new buffer at full capacity
    const capacity = mesh._capacity;
    if (capacity === 0) return null;

    const bufferArray = new Uint32Array(capacity);
    // Initialize with sequential indices (will be updated each frame)
    for (let i = 0; i < capacity; i++) {
      bufferArray[i] = i;
    }

    indexBuffer = new StorageBufferAttribute(bufferArray, 1);
    _meshIndexBuffers.set(mesh, indexBuffer);
  }

  return indexBuffer;
}

/**
 * Updates the index buffer with current instance indices for this frame.
 * This must be called every frame before rendering to ensure correct LOD/culling.
 */
function updateIndexBuffer(mesh: InstancedMesh2): void {
  const indexBuffer = _meshIndexBuffers.get(mesh);
  if (!indexBuffer) return;

  const instanceIndexArray = mesh.instanceIndex?.array;
  if (!instanceIndexArray) return;

  const renderCount = mesh.count || 0;
  const bufferArray = indexBuffer.array as Uint32Array;

  // DEBUG: Log what we're copying
  const isLODChild = !!mesh._parentLOD;
  if (isLODChild && renderCount > 0) {
    console.log(`[LOD Child] updateIndexBuffer: count=${renderCount}, indices=[${Array.from(instanceIndexArray).slice(0, Math.min(renderCount, 10)).join(',')}]`);
  }

  // Copy current instance indices into the buffer
  // Only copy up to renderCount - the rest doesn't matter since we control draw count
  for (let i = 0; i < renderCount && i < bufferArray.length; i++) {
    bufferArray[i] = instanceIndexArray[i];
  }

  // Mark buffer as needing GPU upload
  indexBuffer.needsUpdate = true;
}

/**
 * Gets or creates a persistent StorageBufferAttribute for matrix data.
 * The buffer is created based on the parent mesh's matricesTexture size.
 * Its contents are updated each frame with the current matrix data.
 */
function getOrCreateMatrixBuffer(mesh: InstancedMesh2): StorageBufferAttribute | null {
  // For LOD children, use the parent mesh for matrix data
  const parentMesh = mesh._parentLOD || mesh;

  // Check if we already have a buffer for this parent mesh
  let matrixBuffer = _meshMatrixBuffers.get(parentMesh);

  if (!matrixBuffer) {
    const matricesTexture = parentMesh.matricesTexture;
    if (!matricesTexture?.image?.data) return null;

    const totalInstanceCount = parentMesh.instancesCount;
    if (totalInstanceCount === 0) return null;

    // Create a buffer sized for all instances (16 floats per matrix)
    const neededFloats = totalInstanceCount * 16;
    const bufferArray = new Float32Array(neededFloats);

    // Copy initial data from matricesTexture
    const sourceData = matricesTexture.image.data as Float32Array;
    bufferArray.set(sourceData.subarray(0, neededFloats));

    // itemSize=16 for mat4 (4x4 matrix = 16 floats)
    matrixBuffer = new StorageBufferAttribute(bufferArray, 16);
    _meshMatrixBuffers.set(parentMesh, matrixBuffer);
  }

  return matrixBuffer;
}

/**
 * Updates the matrix buffer with current matrix data from matricesTexture.
 * This must be called every frame to ensure matrix updates are reflected.
 */
function updateMatrixBuffer(mesh: InstancedMesh2): void {
  const parentMesh = mesh._parentLOD || mesh;
  const matrixBuffer = _meshMatrixBuffers.get(parentMesh);
  if (!matrixBuffer) return;

  const matricesTexture = parentMesh.matricesTexture;
  if (!matricesTexture?.image?.data) return;

  const totalInstanceCount = parentMesh.instancesCount;
  const neededFloats = totalInstanceCount * 16;
  const bufferArray = matrixBuffer.array as Float32Array;
  const sourceData = matricesTexture.image.data as Float32Array;

  // Copy matrix data from texture to buffer
  // Only copy what we need (might be less than buffer capacity)
  const copyLength = Math.min(neededFloats, bufferArray.length);
  for (let i = 0; i < copyLength; i++) {
    bufferArray[i] = sourceData[i];
  }

  // Mark buffer as needing GPU upload
  matrixBuffer.needsUpdate = true;
}

/**
 * Gets or creates a persistent StorageBufferAttribute for color data.
 * Similar to matrix buffer but for per-instance colors (4 floats per instance).
 */
function getOrCreateColorBuffer(mesh: InstancedMesh2): StorageBufferAttribute | null {
  const parentMesh = mesh._parentLOD || mesh;

  let colorBuffer = _meshColorBuffers.get(parentMesh);

  if (!colorBuffer) {
    const colorsTexture = parentMesh.colorsTexture;
    if (!colorsTexture?.image?.data) return null;

    const totalInstanceCount = parentMesh.instancesCount;
    if (totalInstanceCount === 0) return null;

    // Create a buffer sized for all instances (4 floats per color: RGBA)
    const neededFloats = totalInstanceCount * 4;
    const bufferArray = new Float32Array(neededFloats);

    // Copy initial data from colorsTexture
    const sourceData = colorsTexture.image.data as Float32Array;
    bufferArray.set(sourceData.subarray(0, neededFloats));

    // itemSize=4 for vec4 (RGBA)
    colorBuffer = new StorageBufferAttribute(bufferArray, 4);
    _meshColorBuffers.set(parentMesh, colorBuffer);
  }

  return colorBuffer;
}

/**
 * Updates the color buffer with current color data from colorsTexture.
 */
function updateColorBuffer(mesh: InstancedMesh2): void {
  const parentMesh = mesh._parentLOD || mesh;
  const colorBuffer = _meshColorBuffers.get(parentMesh);
  if (!colorBuffer) return;

  const colorsTexture = parentMesh.colorsTexture;
  if (!colorsTexture?.image?.data) return;

  const totalInstanceCount = parentMesh.instancesCount;
  const neededFloats = totalInstanceCount * 4;
  const bufferArray = colorBuffer.array as Float32Array;
  const sourceData = colorsTexture.image.data as Float32Array;

  const copyLength = Math.min(neededFloats, bufferArray.length);
  for (let i = 0; i < copyLength; i++) {
    bufferArray[i] = sourceData[i];
  }

  colorBuffer.needsUpdate = true;
}

/**
 * Patches the material with TSL nodes for instanced rendering.
 * Uses positionNode and colorNode instead of onBeforeCompile.
 *
 * IMPORTANT: For LOD and frustum culling, we use indexed buffer access.
 * The instanceIndex.array contains the actual instance IDs to render,
 * not sequential 0,1,2... values. The shader must use this indirection
 * to look up the correct matrix/color data.
 *
 * The index buffer is created once and UPDATED each frame with new indices.
 * TSL nodes are only created on first patch, but buffer data changes each frame.
 */
function patchMaterialWebGPU(mesh: InstancedMesh2, material: Material): void {
  const nodeMaterial = material as NodeMaterial;
  const isFirstPatch = !_patchedMaterials.has(material);

  // CRITICAL: Ensure all buffers exist BEFORE updating them
  // On first patch, this creates the buffers; on subsequent patches, returns existing buffers
  getOrCreateIndexBuffer(mesh);
  getOrCreateMatrixBuffer(mesh);

  // Always update buffers with current frame's data
  // This must happen AFTER getOrCreate* so the buffers exist
  updateIndexBuffer(mesh);
  updateMatrixBuffer(mesh);

  // Skip TSL node creation if already patched (nodes are reused, only buffer data changes)
  if (!isFirstPatch) {
    // Still need to update color buffer if it exists
    if (_meshColorBuffers.has(mesh._parentLOD || mesh)) {
      updateColorBuffer(mesh);
    }
    return;
  }

  // Store original nodes if not already stored
  if (!_materialNodes.has(material)) {
    _materialNodes.set(material, {
      positionNode: nodeMaterial.positionNode,
      colorNode: nodeMaterial.colorNode
    });
  }

  // Apply instanced matrix transformation via TSL
  // Use StorageBufferAttribute-based approach with index indirection for LOD/culling support
  try {
    // CRITICAL: For LOD children, use the PARENT's matricesTexture, not the child's
    // LOD children may have their own matricesTexture reference, but we must use the
    // parent's data to ensure consistent positions across all LOD levels.
    const parentMesh = mesh._parentLOD || mesh;
    const matricesTexture = parentMesh.matricesTexture;
    if (matricesTexture) {
      // Validate texture is properly initialized
      if (!matricesTexture.image || !matricesTexture.image.data) {
        return;
      }

      const totalInstanceCount = parentMesh.instancesCount;

      // Skip patching if no instances yet - this prevents zero-size buffer errors
      if (totalInstanceCount === 0) {
        return;
      }

      // Get persistent index buffer for this mesh
      const indexBuffer = getOrCreateIndexBuffer(mesh);
      if (!indexBuffer) {
        return;
      }

      // Get persistent matrix buffer (uses StorageBufferAttribute for dynamic updates)
      const matrixBuffer = getOrCreateMatrixBuffer(mesh);
      if (!matrixBuffer) {
        return;
      }

      // Number of instances this LOD level will render (use capacity for buffer size)
      const capacity = mesh._capacity;

      // Use INDEXED storage buffer approach for LOD/culling support
      // Both buffers use StorageBufferAttribute with needsUpdate for dynamic GPU uploads
      const instancedMatrixNode = getMatrixFromBufferIndexed(
        matrixBuffer,
        indexBuffer,
        totalInstanceCount,
        capacity // Use capacity, not renderCount - we update buffer data each frame
      );

      if (instancedMatrixNode) {
        // Transform position by instance matrix
        // positionLocal is vec3, we need to convert to vec4, multiply by mat4, then back to vec3
        const basePosition = nodeMaterial.positionNode || positionLocal;
        const position4 = vec4(basePosition, 1.0);
        const transformedPosition = instancedMatrixNode.mul(position4);
        nodeMaterial.positionNode = transformedPosition.xyz;

        // Mark material as needing recompilation
        nodeMaterial.needsUpdate = true;
      }
    }

    // Apply instanced colors if available
    // CRITICAL: Use parent's colorsTexture for LOD children, same as matricesTexture
    const colorsTexture = parentMesh.colorsTexture;
    if (colorsTexture && colorsTexture.image?.data) {
      const totalColorInstances = parentMesh.instancesCount;
      const capacity = mesh._capacity;

      // Get persistent index buffer
      const indexBuffer = _meshIndexBuffers.get(mesh);
      if (!indexBuffer) {
        return;
      }

      // Get or create persistent color buffer (uses StorageBufferAttribute for dynamic updates)
      getOrCreateColorBuffer(mesh);
      updateColorBuffer(mesh);
      const colorBuffer = _meshColorBuffers.get(parentMesh);
      if (!colorBuffer) {
        return;
      }

      // Use INDEXED storage buffer access for colors too
      const colorNode = getColorFromBufferIndexed(
        colorBuffer,
        indexBuffer,
        totalColorInstances,
        capacity // Use capacity for consistent buffer size
      );

      if (colorNode) {
        // Apply color from buffer to material
        const originalColor = nodeMaterial.colorNode;
        if (originalColor) {
          nodeMaterial.colorNode = originalColor.mul(colorNode);
        } else {
          nodeMaterial.colorNode = colorNode;
        }
        nodeMaterial.needsUpdate = true;
      }
    }

    // Mark as patched (TSL nodes created, will be reused)
    _patchedMaterials.add(material);
  } catch (e) {
    // TSL nodes may not be available - fall back to standard rendering
    console.error('WebGPU TSL nodes not available:', e);
  }
}

/**
 * Restores the original material nodes after rendering.
 * Note: For WebGPU, we keep materials patched since recompilation is expensive.
 * The patched materials will work correctly for instanced rendering.
 */
function unpatchMaterialWebGPU(material: Material): void {
  // For WebGPU, we don't unpatch materials since:
  // 1. The TSL nodes are compiled into the shader
  // 2. Recompiling every frame would be very expensive
  // 3. The material can stay patched and work correctly
  // This is different from WebGL where we patch/unpatch per frame

  // Only unpatch if explicitly needed (e.g., mesh is being disposed)
  // For now, we just mark that the material was used
}

/**
 * Updates textures for WebGPU rendering.
 * WebGPU uses standard DataTexture updates rather than WebGL-specific binding.
 */
function updateTexturesWebGPU(mesh: InstancedMesh2): void {
  // Mark textures as needing update
  if (mesh.matricesTexture) {
    mesh.matricesTexture.needsUpdate = true;
  }
  if (mesh.colorsTexture) {
    mesh.colorsTexture.needsUpdate = true;
  }
  if (mesh.uniformsTexture) {
    mesh.uniformsTexture.needsUpdate = true;
  }
  if (mesh.boneTexture) {
    mesh.boneTexture.needsUpdate = true;
  }
}
