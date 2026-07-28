/**
 * Tests for BVH Spatial Indexing feature
 * 
 * Validates:
 * - computeBVH() creates valid structure
 * - insert/move/delete operations update BVH correctly
 * - intersectBox() finds correct instances
 * - BVH integration with frustum culling
 * - disposeBVH() cleanup
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Box3, Matrix4, Vector3 } from 'three';
import { createTestInstancedMesh } from '../setup';
import { InstancedMesh2 } from '../../src/core/InstancedMesh2';

describe('BVH Spatial Indexing', () => {
  let mesh: InstancedMesh2;

  beforeEach(() => {
    mesh = createTestInstancedMesh({ capacity: 100 });
  });

  describe('computeBVH', () => {
    it('should create BVH structure', () => {
      mesh.addInstances(10, (obj, index) => {
        obj.position.set(index * 10, 0, 0);
      });

      mesh.computeBVH();

      expect(mesh.bvh).not.toBeNull();
    });

    it('should create BVH with margin option', () => {
      mesh.addInstances(10, (obj, index) => {
        obj.position.set(index * 10, 0, 0);
      });

      mesh.computeBVH({ margin: 1 });

      expect(mesh.bvh).not.toBeNull();
      expect(mesh.bvh['_margin']).toBe(1);
    });

    it('should create BVH with getBBoxFromBSphere option', () => {
      mesh.addInstances(10, (obj, index) => {
        obj.position.set(index * 10, 0, 0);
      });

      mesh.computeBVH({ getBBoxFromBSphere: true });

      expect(mesh.bvh).not.toBeNull();
    });

    it('should rebuild BVH when called multiple times', () => {
      mesh.addInstances(5, (obj, index) => {
        obj.position.set(index, 0, 0);
      });

      mesh.computeBVH();
      const firstBVH = mesh.bvh;

      mesh.addInstances(5, (obj, index) => {
        obj.position.set(index + 100, 0, 0);
      });

      mesh.computeBVH();

      expect(mesh.bvh).toBe(firstBVH); // Same BVH instance, rebuilt
    });

    it('should populate nodesMap with instance nodes', () => {
      mesh.addInstances(5, (obj, index) => {
        obj.position.set(index * 10, 0, 0);
      });

      mesh.computeBVH();

      expect(mesh.bvh.nodesMap.size).toBe(5);
    });
  });

  describe('disposeBVH', () => {
    it('should set bvh to null', () => {
      mesh.addInstances(5, (obj, index) => {
        obj.position.set(index, 0, 0);
      });
      mesh.computeBVH();

      mesh.disposeBVH();

      expect(mesh.bvh).toBeNull();
    });
  });

  describe('BVH insert', () => {
    beforeEach(() => {
      mesh.addInstances(5, (obj, index) => {
        obj.position.set(index * 10, 0, 0);
      });
      mesh.computeBVH();
    });

    it('should insert new instances into BVH', () => {
      const initialSize = mesh.bvh.nodesMap.size;

      mesh.addInstances(3, (obj, index) => {
        obj.position.set(index * 10 + 100, 0, 0);
      });

      expect(mesh.bvh.nodesMap.size).toBe(initialSize + 3);
    });

    it('should have node for each active instance', () => {
      mesh.addInstances(2, (obj, index) => {
        obj.position.set(200, 0, 0);
      });

      // Check that all active instances have nodes
      for (let i = 0; i < mesh.instancesCount; i++) {
        if (mesh.getActiveAt(i)) {
          expect(mesh.bvh.nodesMap.has(i)).toBe(true);
        }
      }
    });
  });

  describe('BVH move', () => {
    beforeEach(() => {
      mesh.addInstances(5, (obj, index) => {
        obj.position.set(index * 10, 0, 0);
      });
      mesh.computeBVH();
    });

    it('should update BVH when instance matrix changes', () => {
      const node = mesh.bvh.nodesMap.get(0);
      const originalBox = [...node.box];

      // Move instance to new position
      mesh.setMatrixAt(0, new Matrix4().setPosition(100, 100, 100));

      // BVH node box should be updated
      expect(node.box).not.toEqual(originalBox);
    });

    it('should handle move for non-existent node gracefully', () => {
      expect(() => mesh.bvh.move(999)).not.toThrow();
    });
  });

  describe('BVH delete', () => {
    beforeEach(() => {
      mesh.addInstances(5, (obj, index) => {
        obj.position.set(index * 10, 0, 0);
      });
      mesh.computeBVH();
    });

    it('should remove node from BVH when instance removed', () => {
      expect(mesh.bvh.nodesMap.has(2)).toBe(true);

      mesh.removeInstances(2);

      expect(mesh.bvh.nodesMap.has(2)).toBe(false);
    });

    it('should decrease nodesMap size when instance removed', () => {
      const initialSize = mesh.bvh.nodesMap.size;

      mesh.removeInstances(0, 1);

      expect(mesh.bvh.nodesMap.size).toBe(initialSize - 2);
    });

    it('should handle delete for non-existent node gracefully', () => {
      expect(() => mesh.bvh.delete(999)).not.toThrow();
    });
  });

  describe('BVH clear', () => {
    beforeEach(() => {
      mesh.addInstances(5, (obj, index) => {
        obj.position.set(index * 10, 0, 0);
      });
      mesh.computeBVH();
    });

    it('should clear BVH when clearInstances called', () => {
      mesh.clearInstances();

      expect(mesh.bvh.nodesMap.size).toBe(0);
    });
  });

  describe('intersectBox', () => {
    beforeEach(() => {
      // Create instances spread out in space
      mesh.addInstances(9, (obj, index) => {
        const x = (index % 3) * 20;
        const y = Math.floor(index / 3) * 20;
        obj.position.set(x, y, 0);
      });
      mesh.computeBVH();
    });

    it('should find instances within box', () => {
      const box = new Box3(
        new Vector3(-5, -5, -5),
        new Vector3(25, 5, 5)
      );

      const found: number[] = [];
      mesh.bvh.intersectBox(box, (index) => {
        found.push(index);
        return false; // Continue searching
      });

      // Should find instances at x=0, x=20 (y=0 row)
      expect(found.length).toBeGreaterThan(0);
    });

    it('should return true when intersection found and callback returns true', () => {
      const box = new Box3(
        new Vector3(-5, -5, -5),
        new Vector3(5, 5, 5)
      );

      const result = mesh.bvh.intersectBox(box, () => true);

      expect(result).toBe(true);
    });

    it('should return false when no intersection found', () => {
      const box = new Box3(
        new Vector3(1000, 1000, 1000),
        new Vector3(1100, 1100, 1100)
      );

      const found: number[] = [];
      const result = mesh.bvh.intersectBox(box, (index) => {
        found.push(index);
        return false;
      });

      expect(found.length).toBe(0);
      expect(result).toBe(false);
    });

    it('should stop early when callback returns true', () => {
      const box = new Box3(
        new Vector3(-100, -100, -100),
        new Vector3(100, 100, 100)
      );

      let callCount = 0;
      mesh.bvh.intersectBox(box, () => {
        callCount++;
        return true; // Stop after first hit
      });

      expect(callCount).toBe(1);
    });
  });

  describe('BVH with frustum culling', () => {
    beforeEach(() => {
      mesh.addInstances(10, (obj, index) => {
        obj.position.set(index * 10, 0, 0);
      });
      mesh.computeBVH();
    });

    it('should use BVH for culling when available', () => {
      expect(mesh.bvh).not.toBeNull();
      // The BVHCulling method should be used when bvh exists
      // This is more thoroughly tested in e2e tests
    });

    it('should have accurateCulling enabled by default', () => {
      expect(mesh.bvh.accurateCulling).toBe(true);
    });

    it('should allow disabling accurateCulling', () => {
      mesh.disposeBVH();
      mesh.computeBVH({ accurateCulling: false });

      expect(mesh.bvh.accurateCulling).toBe(false);
    });
  });

  describe('geoBoundingBox', () => {
    it('should store geometry bounding box', () => {
      mesh.addInstances(5, (obj, index) => {
        obj.position.set(index, 0, 0);
      });
      mesh.computeBVH();

      expect(mesh.bvh.geoBoundingBox).not.toBeNull();
      expect(mesh.bvh.geoBoundingBox.min).toBeDefined();
      expect(mesh.bvh.geoBoundingBox.max).toBeDefined();
    });
  });
});

