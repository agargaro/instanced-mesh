/**
 * WebGPU-specific prototype extensions for InstancedMesh2.
 * This file adds WebGPU-specific rendering methods using TSL (Three.js Shading Language)
 * and standard buffer attributes instead of WebGL-specific classes.
 */

import { BufferAttribute, BufferGeometry, Camera, DynamicDrawUsage, InstancedBufferAttribute, Material, Scene } from 'three';
import { positionLocal, vec4 } from 'three/tsl';
import { InstancedMesh2, InstanceIndexAttribute } from './InstancedMesh2.js';
import { getMatrixFromBuffer, getColorFromBuffer } from '../shaders/tsl/nodes.js';

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

// Track if materials have been patched to avoid re-patching
const _patchedMaterials = new WeakSet<Material>();

// Track if instanceMatrix has been fixed for WebGPU
const _fixedInstanceMatrix = new WeakSet<InstancedMesh2>();

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
    minimalData.set([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); // identity matrix
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
  patchMaterialWebGPU(this, depthMaterial);

  const frame = renderer.info.render.frame;
  if (this.instanceIndex && this.autoUpdate && !this.frustumCullingAlreadyPerformed(frame, camera, shadowCamera)) {
    this.performFrustumCulling(shadowCamera, camera);
  }

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
  
  patchMaterialWebGPU(this, material);

  if (!this.instanceIndex) {
    this._renderer = renderer;
    return;
  }

  const frame = renderer.info.render.frame;
  if (this.autoUpdate && !this.frustumCullingAlreadyPerformed(frame, camera, null)) {
    this.performFrustumCulling(camera);
  }

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
 * Patches the material with TSL nodes for instanced rendering.
 * Uses positionNode and colorNode instead of onBeforeCompile.
 */
function patchMaterialWebGPU(mesh: InstancedMesh2, material: Material): void {
  // Skip if already patched
  if (_patchedMaterials.has(material)) {
    return;
  }

  const nodeMaterial = material as NodeMaterial;

  // Store original nodes if not already stored
  if (!_materialNodes.has(material)) {
    _materialNodes.set(material, {
      positionNode: nodeMaterial.positionNode,
      colorNode: nodeMaterial.colorNode
    });
  }


  // Apply instanced matrix transformation via TSL
  // Use buffer-based approach (same as Three.js InstanceNode) for WebGPU compatibility
  try {
    const matricesTexture = mesh.matricesTexture;
    if (matricesTexture) {
      // Validate texture is properly initialized
      if (!matricesTexture.image || !matricesTexture.image.data) {
        return;
      }

      // IMPORTANT: Only use the actual needed portion of the array, not the full padded texture
      // The texture is padded to a square (e.g., 64x64), but we only need count*16 floats
      // For LOD children, use the parent's instance count since they share the same matricesTexture
      const parentMesh = mesh._parentLOD || mesh;
      const instanceCount = parentMesh.instancesCount;
      
      // Skip patching if no instances yet - this prevents zero-size buffer errors
      if (instanceCount === 0) {
        return;
      }
      
      const neededFloats = instanceCount * 16;
      const fullArray = matricesTexture.image.data as Float32Array;
      const matricesArray = fullArray.subarray(0, neededFloats);

      // Use buffer-based approach (matches Three.js InstanceNode)
      const instancedMatrixNode = getMatrixFromBuffer(matricesArray, instanceCount);

      if (instancedMatrixNode) {
        // Transform position by instance matrix
        // positionLocal is vec3, we need to convert to vec4, multiply by mat4, then back to vec3
        const basePosition = nodeMaterial.positionNode || positionLocal;
        const position4 = vec4(basePosition, 1.0);
        const transformedPosition = instancedMatrixNode.mul(position4);
        nodeMaterial.positionNode = transformedPosition.xyz;

        // Mark material as needing recompilation
        nodeMaterial.needsUpdate = true;

        // Store reference for the material
        (nodeMaterial as any)._instancedMatricesArray = matricesArray;
      }
    }

    // Apply instanced colors if available
    if (mesh.colorsTexture && mesh.colorsTexture.image?.data) {
      // Only use the actual needed portion, not the padded texture
      // For LOD children, use the parent's instance count since they share the same colorsTexture
      const parentMesh = mesh._parentLOD || mesh;
      const instanceCount = parentMesh.instancesCount;
      const neededFloats = instanceCount * 4; // RGBA per instance
      const fullArray = mesh.colorsTexture.image.data as Float32Array;
      const colorsArray = fullArray.subarray(0, neededFloats);
      
      const colorNode = getColorFromBuffer(colorsArray, instanceCount);
      if (colorNode) {
        // Apply color from buffer to material
        const originalColor = nodeMaterial.colorNode;
        if (originalColor) {
          nodeMaterial.colorNode = originalColor.mul(colorNode);
        } else {
          nodeMaterial.colorNode = colorNode;
        }
        nodeMaterial.needsUpdate = true;
        (nodeMaterial as any)._instancedColorsArray = colorsArray;
      }
    }

    // Mark as patched
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
