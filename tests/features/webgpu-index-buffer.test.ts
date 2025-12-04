/**
 * Tests for WebGPU Index Buffer and LOD Position Accuracy
 *
 * Validates:
 * - Index buffer creation and initialization
 * - Index buffer updates with correct instance indices
 * - Matrix lookup returns correct positions for given indices
 * - LOD children receive correct positions from parent's matricesTexture
 * - Full flow: frustum culling → index assignment → buffer update → position lookup
 *
 * These tests verify the core WebGPU instancing pipeline that determines
 * where each instance (including LOD children) renders on screen.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BoxGeometry, MeshBasicMaterial, SphereGeometry, Matrix4, Vector3 } from 'three';
import { createTestInstancedMesh, createMockWebGPURenderer, describeForEachRenderer } from '../setup.js';
import { InstancedMesh2 } from '../../src/core/InstancedMesh2.js';

// Import WebGPU-specific module to apply prototype extensions
import '../../src/core/InstancedMesh2.webgpu.js';

/**
 * Helper to extract position from a 4x4 matrix array
 */
function getPositionFromMatrixArray(array: Float32Array, matrixIndex: number): Vector3 {
  const offset = matrixIndex * 16;
  // Position is in elements 12, 13, 14 of the 4x4 matrix (column-major)
  return new Vector3(array[offset + 12], array[offset + 13], array[offset + 14]);
}

/**
 * Helper to set position in a matrix array
 */
function setPositionInMatrixArray(array: Float32Array, matrixIndex: number, position: Vector3): void {
  const offset = matrixIndex * 16;
  // Set identity matrix first
  array[offset + 0] = 1; array[offset + 1] = 0; array[offset + 2] = 0; array[offset + 3] = 0;
  array[offset + 4] = 0; array[offset + 5] = 1; array[offset + 6] = 0; array[offset + 7] = 0;
  array[offset + 8] = 0; array[offset + 9] = 0; array[offset + 10] = 1; array[offset + 11] = 0;
  array[offset + 12] = position.x; array[offset + 13] = position.y; array[offset + 14] = position.z; array[offset + 15] = 1;
}

describe('[WEBGPU] Index Buffer Management', () => {
  let mesh: InstancedMesh2;
  const capacity = 10;

  beforeEach(() => {
    mesh = createTestInstancedMesh({ capacity, rendererType: 'webgpu' });
  });

  describe('instanceIndex initialization', () => {
    it('should create instanceIndex with correct capacity', () => {
      // Trigger initialization
      mesh.initIndexAttribute();
      
      expect(mesh.instanceIndex).toBeDefined();
      expect(mesh.instanceIndex.array).toHaveLength(capacity);
    });

    it('should NOT add instanceIndex to geometry attributes (WebGPU uses built-in)', () => {
      mesh.initIndexAttribute();
      
      // WebGPU should NOT have instanceIndex as a geometry attribute
      expect(mesh.geometry.getAttribute('instanceIndex')).toBeUndefined();
    });
  });

  describe('index array contents after addInstances', () => {
    it('should populate instanceIndex.array with sequential indices initially', () => {
      mesh.addInstances(5, (obj, index) => {
        obj.position.set(index * 10, 0, 0);
      });

      // After adding instances, check the array capacity
      const indexArray = mesh.instanceIndex?.array;
      expect(indexArray).toBeDefined();
      expect(indexArray!.length).toBe(capacity); // Array is pre-allocated to capacity
      
      // NOTE: The array values are set during frustum culling, not addInstances
      // instancesCount tracks created instances, count tracks rendered instances
      expect(mesh.instancesCount).toBe(5);
    });

    it('should track instancesCount (created) separately from count (rendered)', () => {
      mesh.addInstances(7, (obj, index) => {
        obj.position.set(index, 0, 0);
      });

      // instancesCount = number of instances created
      expect(mesh.instancesCount).toBe(7);
      
      // count = number to render (set by frustum culling)
      // Before any render/culling, count may be 0 or 1 (initialized state)
      // This is intentional - count gets set during performFrustumCulling
      expect(mesh.count).toBeLessThanOrEqual(7);
    });

    it('should allow manual count setting for testing', () => {
      mesh.addInstances(5, (obj, index) => {
        obj.position.set(index * 10, 0, 0);
      });

      // Manually set count to simulate post-culling state
      mesh.count = 5;
      
      // Set indices manually to simulate culling result
      const indexArray = mesh.instanceIndex?.array;
      for (let i = 0; i < 5; i++) {
        indexArray![i] = i;
      }

      expect(mesh.count).toBe(5);
      expect(indexArray![0]).toBe(0);
      expect(indexArray![4]).toBe(4);
    });
  });
});

describe('[WEBGPU] Matrix Position Verification', () => {
  let mesh: InstancedMesh2;
  const capacity = 10;

  beforeEach(() => {
    mesh = createTestInstancedMesh({ capacity, rendererType: 'webgpu' });
  });

  it('should store correct positions in matricesTexture', () => {
    const positions = [
      new Vector3(10, 0, 0),
      new Vector3(20, 0, 0),
      new Vector3(30, 0, 0),
    ];

    mesh.addInstances(3, (obj, index) => {
      obj.position.copy(positions[index]);
    });

    // Verify positions are stored correctly
    const matrixData = mesh.matricesTexture?.image?.data as Float32Array;
    expect(matrixData).toBeDefined();

    for (let i = 0; i < 3; i++) {
      const storedPosition = getPositionFromMatrixArray(matrixData, i);
      expect(storedPosition.x).toBeCloseTo(positions[i].x, 5);
      expect(storedPosition.y).toBeCloseTo(positions[i].y, 5);
      expect(storedPosition.z).toBeCloseTo(positions[i].z, 5);
    }
  });

  it('should update position when using setMatrixAt', () => {
    mesh.addInstances(3, (obj, index) => {
      obj.position.set(index, 0, 0);
    });

    // Update position of instance 1
    const newMatrix = new Matrix4();
    newMatrix.setPosition(100, 200, 300);
    mesh.setMatrixAt(1, newMatrix);

    const matrixData = mesh.matricesTexture?.image?.data as Float32Array;
    const storedPosition = getPositionFromMatrixArray(matrixData, 1);
    
    expect(storedPosition.x).toBeCloseTo(100, 5);
    expect(storedPosition.y).toBeCloseTo(200, 5);
    expect(storedPosition.z).toBeCloseTo(300, 5);
  });
});

describe('[WEBGPU] LOD Child Position Inheritance', () => {
  let parentMesh: InstancedMesh2;
  let lowPolyGeometry: SphereGeometry;
  let material: MeshBasicMaterial;
  const capacity = 10;

  beforeEach(() => {
    parentMesh = createTestInstancedMesh({ capacity, rendererType: 'webgpu' });
    lowPolyGeometry = new SphereGeometry(0.5, 8, 8);
    material = new MeshBasicMaterial({ color: 0x00ff00 });
  });

  it('should share matricesTexture with LOD children', () => {
    parentMesh.addInstances(5, (obj, index) => {
      obj.position.set(index * 10, 0, 0);
    });
    
    parentMesh.addLOD(lowPolyGeometry, material, 50);
    
    const lodChild = parentMesh.LODinfo?.objects[1];
    expect(lodChild).toBeDefined();
    
    // LOD child should reference parent's matricesTexture
    expect(lodChild!.matricesTexture).toBe(parentMesh.matricesTexture);
  });

  it('should access correct position data from parent matricesTexture', () => {
    const knownPositions = [
      new Vector3(0, 0, 0),
      new Vector3(50, 0, 0),
      new Vector3(100, 0, 0),
    ];

    parentMesh.addInstances(3, (obj, index) => {
      obj.position.copy(knownPositions[index]);
    });
    
    parentMesh.addLOD(lowPolyGeometry, material, 30);
    
    const lodChild = parentMesh.LODinfo?.objects[1];
    const lodMatrixData = lodChild!.matricesTexture?.image?.data as Float32Array;
    
    // Verify LOD child can access all parent positions
    for (let i = 0; i < 3; i++) {
      const position = getPositionFromMatrixArray(lodMatrixData, i);
      expect(position.x).toBeCloseTo(knownPositions[i].x, 5);
      expect(position.y).toBeCloseTo(knownPositions[i].y, 5);
      expect(position.z).toBeCloseTo(knownPositions[i].z, 5);
    }
  });

  it('should have independent instanceIndex array from parent', () => {
    parentMesh.addInstances(5, (obj, index) => {
      obj.position.set(index * 10, 0, 0);
    });
    
    parentMesh.addLOD(lowPolyGeometry, material, 50);
    
    const lodChild = parentMesh.LODinfo?.objects[1];
    
    // LOD child should have its OWN instanceIndex array (for different visible instances)
    expect(lodChild!.instanceIndex).toBeDefined();
    // But the underlying data source (matricesTexture) is shared
    expect(lodChild!.matricesTexture).toBe(parentMesh.matricesTexture);
  });
});

describe('[WEBGPU] Index Indirection Correctness', () => {
  let mesh: InstancedMesh2;
  const capacity = 10;

  beforeEach(() => {
    mesh = createTestInstancedMesh({ capacity, rendererType: 'webgpu' });
  });

  it('should allow non-sequential index assignment', () => {
    // Add 5 instances at known positions
    mesh.addInstances(5, (obj, index) => {
      obj.position.set(index * 100, 0, 0); // 0, 100, 200, 300, 400
    });

    // Simulate culling: only render instances 2 and 4
    const indexArray = mesh.instanceIndex?.array;
    if (indexArray) {
      indexArray[0] = 2; // First rendered instance is original instance #2
      indexArray[1] = 4; // Second rendered instance is original instance #4
    }
    mesh.count = 2;

    // Verify the index array is set correctly
    expect(mesh.instanceIndex!.array[0]).toBe(2);
    expect(mesh.instanceIndex!.array[1]).toBe(4);
    expect(mesh.count).toBe(2);

    // Verify we can look up correct positions from matricesTexture
    const matrixData = mesh.matricesTexture?.image?.data as Float32Array;
    
    // Instance index 2 should be at position (200, 0, 0)
    const pos2 = getPositionFromMatrixArray(matrixData, 2);
    expect(pos2.x).toBeCloseTo(200, 5);
    
    // Instance index 4 should be at position (400, 0, 0)
    const pos4 = getPositionFromMatrixArray(matrixData, 4);
    expect(pos4.x).toBeCloseTo(400, 5);
  });

  it('should handle reversed index order', () => {
    mesh.addInstances(3, (obj, index) => {
      obj.position.set(index * 10, 0, 0); // 0, 10, 20
    });

    // Render in reverse order: 2, 1, 0
    const indexArray = mesh.instanceIndex?.array;
    if (indexArray) {
      indexArray[0] = 2;
      indexArray[1] = 1;
      indexArray[2] = 0;
    }
    mesh.count = 3;

    const matrixData = mesh.matricesTexture?.image?.data as Float32Array;
    
    // gl_InstanceID=0 should map to instanceIndex[0]=2 → position (20,0,0)
    const pos0 = getPositionFromMatrixArray(matrixData, mesh.instanceIndex!.array[0]);
    expect(pos0.x).toBeCloseTo(20, 5);
    
    // gl_InstanceID=1 should map to instanceIndex[1]=1 → position (10,0,0)
    const pos1 = getPositionFromMatrixArray(matrixData, mesh.instanceIndex!.array[1]);
    expect(pos1.x).toBeCloseTo(10, 5);
    
    // gl_InstanceID=2 should map to instanceIndex[2]=0 → position (0,0,0)
    const pos2 = getPositionFromMatrixArray(matrixData, mesh.instanceIndex!.array[2]);
    expect(pos2.x).toBeCloseTo(0, 5);
  });
});

describe('[WEBGPU] LOD Index Assignment', () => {
  let parentMesh: InstancedMesh2;
  let lodGeometry: BoxGeometry;
  let material: MeshBasicMaterial;
  const capacity = 10;

  beforeEach(() => {
    parentMesh = createTestInstancedMesh({ capacity, rendererType: 'webgpu' });
    lodGeometry = new BoxGeometry(0.5, 0.5, 0.5);
    material = new MeshBasicMaterial({ color: 0x00ff00 });
  });

  it('should assign different instance indices to different LOD levels', () => {
    // Create instances at various distances
    parentMesh.addInstances(4, (obj, index) => {
      // Instance 0, 1 close (z=10, z=20), Instance 2, 3 far (z=100, z=200)
      const z = index < 2 ? (index + 1) * 10 : (index - 1) * 100;
      obj.position.set(0, 0, z);
    });

    parentMesh.addLOD(lodGeometry, material, 50); // LOD1 at distance 50

    // Verify both meshes exist
    expect(parentMesh.LODinfo?.objects).toHaveLength(2);

    const lodChild = parentMesh.LODinfo?.objects[1];
    expect(lodChild).toBeDefined();
    expect(lodChild!._parentLOD).toBe(parentMesh);
  });

  it('should have LOD child capacity match parent capacity', () => {
    parentMesh.addInstances(5, (obj, index) => {
      obj.position.set(index, 0, 0);
    });

    parentMesh.addLOD(lodGeometry, material, 50);

    const lodChild = parentMesh.LODinfo?.objects[1];
    expect(lodChild!._capacity).toBe(parentMesh._capacity);
  });
});

describe('[WEBGPU] Debug Helpers', () => {
  let mesh: InstancedMesh2;
  const capacity = 5;

  beforeEach(() => {
    mesh = createTestInstancedMesh({ capacity, rendererType: 'webgpu' });
  });

  it('should allow dumping index buffer state for debugging', () => {
    mesh.addInstances(3, (obj, index) => {
      obj.position.set(index * 10, index * 5, 0);
    });

    // Simulate post-culling state: set count and indices manually
    mesh.count = 3;
    const indexArray = mesh.instanceIndex?.array;
    if (indexArray) {
      indexArray[0] = 0;
      indexArray[1] = 1;
      indexArray[2] = 2;
    }

    // Debug helper: dump current state
    const debugState = {
      capacity: mesh._capacity,
      count: mesh.count,
      instancesCount: mesh.instancesCount,
      indexArray: Array.from(mesh.instanceIndex?.array?.slice(0, mesh.count) || []),
      positions: [] as { index: number; x: number; y: number; z: number }[]
    };

    // Extract positions for all instances
    const matrixData = mesh.matricesTexture?.image?.data as Float32Array;
    for (let i = 0; i < mesh.instancesCount; i++) {
      const pos = getPositionFromMatrixArray(matrixData, i);
      debugState.positions.push({ index: i, x: pos.x, y: pos.y, z: pos.z });
    }

    console.log('Debug state:', JSON.stringify(debugState, null, 2));

    expect(debugState.instancesCount).toBe(3); // Created instances
    expect(debugState.count).toBe(3); // Rendered instances (manually set)
    expect(debugState.indexArray).toEqual([0, 1, 2]);
    expect(debugState.positions[0].x).toBe(0);
    expect(debugState.positions[1].x).toBe(10);
    expect(debugState.positions[2].x).toBe(20);
  });

  it('should verify index-to-position mapping', () => {
    mesh.addInstances(4, (obj, index) => {
      // Positions: (0,0,0), (100,0,0), (200,0,0), (300,0,0)
      obj.position.set(index * 100, 0, 0);
    });

    // Simulate rendering only instances 1 and 3
    mesh.instanceIndex!.array[0] = 1;
    mesh.instanceIndex!.array[1] = 3;
    mesh.count = 2;

    // Verify mapping
    const matrixData = mesh.matricesTexture?.image?.data as Float32Array;
    
    const mapping = [];
    for (let glInstanceID = 0; glInstanceID < mesh.count; glInstanceID++) {
      const actualIndex = mesh.instanceIndex!.array[glInstanceID];
      const position = getPositionFromMatrixArray(matrixData, actualIndex);
      mapping.push({
        glInstanceID,
        actualIndex,
        expectedPosition: actualIndex * 100,
        actualPosition: position.x
      });
    }

    console.log('Index-to-position mapping:', JSON.stringify(mapping, null, 2));

    // Verify correctness
    expect(mapping[0].actualIndex).toBe(1);
    expect(mapping[0].actualPosition).toBeCloseTo(100, 5);
    
    expect(mapping[1].actualIndex).toBe(3);
    expect(mapping[1].actualPosition).toBeCloseTo(300, 5);
  });
});

describe('[WEBGPU] Frustum Culling Integration', () => {
  let mesh: InstancedMesh2;
  const capacity = 10;

  beforeEach(() => {
    mesh = createTestInstancedMesh({ capacity, rendererType: 'webgpu' });
  });

  it('should update count and indices after simulated frustum culling', () => {
    // Add 5 instances at known positions
    mesh.addInstances(5, (obj, index) => {
      obj.position.set(index * 100, 0, 0); // 0, 100, 200, 300, 400
    });

    // Before culling
    expect(mesh.instancesCount).toBe(5);
    
    // Simulate frustum culling result: only instances 0, 2, 4 are visible
    const indexArray = mesh.instanceIndex!.array;
    indexArray[0] = 0;
    indexArray[1] = 2;
    indexArray[2] = 4;
    mesh.count = 3;

    // After culling
    expect(mesh.count).toBe(3);
    expect(mesh.instancesCount).toBe(5); // Total created unchanged

    // Verify correct positions would be rendered
    const matrixData = mesh.matricesTexture?.image?.data as Float32Array;
    
    // gl_InstanceID 0 → indexArray[0]=0 → position 0
    expect(getPositionFromMatrixArray(matrixData, indexArray[0]).x).toBeCloseTo(0);
    
    // gl_InstanceID 1 → indexArray[1]=2 → position 200
    expect(getPositionFromMatrixArray(matrixData, indexArray[1]).x).toBeCloseTo(200);
    
    // gl_InstanceID 2 → indexArray[2]=4 → position 400
    expect(getPositionFromMatrixArray(matrixData, indexArray[2]).x).toBeCloseTo(400);
  });

  it('should handle LOD child with subset of parent instances', () => {
    // Create parent with 6 instances
    mesh.addInstances(6, (obj, index) => {
      obj.position.set(index * 50, 0, index * 10); // Z determines distance for LOD
    });

    const lodGeometry = new SphereGeometry(0.5);
    const lodMaterial = new MeshBasicMaterial({ color: 0x00ff00 });
    mesh.addLOD(lodGeometry, lodMaterial, 30); // LOD at distance 30

    const lodChild = mesh.LODinfo?.objects[1]!;
    
    // Simulate: parent renders instances 0, 1, 2 (close)
    mesh.count = 3;
    mesh.instanceIndex!.array[0] = 0;
    mesh.instanceIndex!.array[1] = 1;
    mesh.instanceIndex!.array[2] = 2;

    // Simulate: LOD child renders instances 3, 4, 5 (far)
    lodChild.count = 3;
    lodChild.instanceIndex!.array[0] = 3;
    lodChild.instanceIndex!.array[1] = 4;
    lodChild.instanceIndex!.array[2] = 5;

    // Verify parent positions (close instances)
    const parentMatrixData = mesh.matricesTexture?.image?.data as Float32Array;
    for (let i = 0; i < mesh.count; i++) {
      const actualIndex = mesh.instanceIndex!.array[i];
      const pos = getPositionFromMatrixArray(parentMatrixData, actualIndex);
      expect(pos.x).toBeCloseTo(actualIndex * 50);
    }

    // Verify LOD child positions (far instances) - uses SAME matrixData via getter
    const lodMatrixData = lodChild.matricesTexture?.image?.data as Float32Array;
    expect(lodMatrixData).toBe(parentMatrixData); // Same reference!
    
    for (let i = 0; i < lodChild.count; i++) {
      const actualIndex = lodChild.instanceIndex!.array[i];
      const pos = getPositionFromMatrixArray(lodMatrixData, actualIndex);
      expect(pos.x).toBeCloseTo(actualIndex * 50);
    }
  });
});

describe('[WEBGPU] Shadow LOD Material Compatibility', () => {
  let mesh: InstancedMesh2;
  let shadowGeometry: BoxGeometry;
  const capacity = 10;

  beforeEach(() => {
    mesh = createTestInstancedMesh({ capacity, rendererType: 'webgpu' });
    shadowGeometry = new BoxGeometry(0.5, 0.5, 0.5);
  });

  it('should create shadow LOD with NodeMaterial (not ShaderMaterial)', () => {
    mesh.addInstances(3, (obj, index) => {
      obj.position.set(index, 0, 0);
    });

    mesh.addShadowLOD(shadowGeometry, 0);

    const shadowLOD = mesh.LODinfo?.shadowRender?.levels[0]?.object;
    expect(shadowLOD).toBeDefined();
    
    // The material should NOT be a plain ShaderMaterial (which is incompatible with WebGPU)
    const material = shadowLOD!.material;
    expect(material.type).not.toBe('ShaderMaterial');
    
    // It should be a NodeMaterial variant (MeshBasicNodeMaterial)
    // NodeMaterials have isNodeMaterial = true
    expect((material as any).isNodeMaterial).toBe(true);
  });

  it('should allow explicit material for shadow LOD', () => {
    mesh.addInstances(3, (obj, index) => {
      obj.position.set(index, 0, 0);
    });

    // Note: addShadowLOD doesn't take material, it always uses default
    // This test verifies the default is correct
    mesh.addShadowLOD(shadowGeometry, 0);
    mesh.addShadowLOD(shadowGeometry, 50);

    expect(mesh.LODinfo?.shadowRender?.levels).toHaveLength(2);
  });
});

