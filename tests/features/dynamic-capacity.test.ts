/**
 * Tests for Dynamic Capacity feature
 * 
 * Validates:
 * - Adding instances up to and beyond capacity
 * - Auto-expanding buffers when capacity exceeded
 * - Removing instances by ID
 * - Clearing all instances
 * - Reusing freed instance slots
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createTestInstancedMesh, createTestInstancedMeshWithEntities } from '../setup';
import { InstancedMesh2 } from '../../src/core/InstancedMesh2.common';

describe('Dynamic Capacity', () => {
  let mesh: InstancedMesh2;

  beforeEach(() => {
    mesh = createTestInstancedMesh({ capacity: 10 });
  });

  describe('addInstances', () => {
    it('should add instances within capacity', () => {
      mesh.addInstances(5, (obj, index) => {
        obj.position.set(index, 0, 0);
      });

      expect(mesh.instancesCount).toBe(5);
      expect(mesh.capacity).toBe(10);
    });

    it('should add instances up to exact capacity', () => {
      mesh.addInstances(10, (obj, index) => {
        obj.position.set(index, 0, 0);
      });

      expect(mesh.instancesCount).toBe(10);
      expect(mesh.capacity).toBe(10);
    });

    it('should auto-expand buffer when exceeding capacity', () => {
      mesh.addInstances(15, (obj, index) => {
        obj.position.set(index, 0, 0);
      });

      expect(mesh.instancesCount).toBe(15);
      expect(mesh.capacity).toBeGreaterThan(10);
    });

    it('should set identity matrix when no callback provided', () => {
      mesh.addInstances(3);

      expect(mesh.instancesCount).toBe(3);
      
      // Check that matrices are identity
      const matrix = mesh.getMatrixAt(0);
      expect(matrix.elements[0]).toBe(1);
      expect(matrix.elements[5]).toBe(1);
      expect(matrix.elements[10]).toBe(1);
      expect(matrix.elements[15]).toBe(1);
    });

    it('should call onCreation callback with correct index', () => {
      const indices: number[] = [];
      
      mesh.addInstances(5, (obj, index) => {
        indices.push(index);
      });

      expect(indices).toEqual([0, 1, 2, 3, 4]);
    });

    it('should allow setting position in callback', () => {
      mesh.addInstances(3, (obj, index) => {
        obj.position.set(index * 10, index * 20, index * 30);
      });

      const pos0 = mesh.getPositionAt(0);
      expect(pos0.x).toBe(0);
      expect(pos0.y).toBe(0);
      expect(pos0.z).toBe(0);

      const pos2 = mesh.getPositionAt(2);
      expect(pos2.x).toBe(20);
      expect(pos2.y).toBe(40);
      expect(pos2.z).toBe(60);
    });
  });

  describe('removeInstances', () => {
    beforeEach(() => {
      mesh.addInstances(5, (obj, index) => {
        obj.position.set(index, 0, 0);
      });
    });

    it('should remove a single instance by ID', () => {
      mesh.removeInstances(2);

      expect(mesh.instancesCount).toBe(4);
      expect(mesh.getActiveAt(2)).toBe(false);
    });

    it('should remove multiple instances', () => {
      mesh.removeInstances(1, 3);

      expect(mesh.instancesCount).toBe(3);
      expect(mesh.getActiveAt(1)).toBe(false);
      expect(mesh.getActiveAt(3)).toBe(false);
    });

    it('should not throw when removing non-existent instance', () => {
      expect(() => mesh.removeInstances(99)).not.toThrow();
      expect(mesh.instancesCount).toBe(5);
    });

    it('should not remove already removed instance', () => {
      mesh.removeInstances(2);
      mesh.removeInstances(2);

      expect(mesh.instancesCount).toBe(4);
    });

    it('should keep other instances active after removal', () => {
      mesh.removeInstances(2);

      expect(mesh.getActiveAt(0)).toBe(true);
      expect(mesh.getActiveAt(1)).toBe(true);
      expect(mesh.getActiveAt(3)).toBe(true);
      expect(mesh.getActiveAt(4)).toBe(true);
    });
  });

  describe('clearInstances', () => {
    beforeEach(() => {
      mesh.addInstances(5, (obj, index) => {
        obj.position.set(index, 0, 0);
      });
    });

    it('should remove all instances', () => {
      mesh.clearInstances();

      expect(mesh.instancesCount).toBe(0);
    });

    it('should allow adding new instances after clearing', () => {
      mesh.clearInstances();
      mesh.addInstances(3, (obj, index) => {
        obj.position.set(index, 0, 0);
      });

      expect(mesh.instancesCount).toBe(3);
    });
  });

  describe('slot reuse', () => {
    it('should reuse freed slots when adding new instances', () => {
      mesh.addInstances(5, (obj, index) => {
        obj.position.set(index * 100, 0, 0);
      });
      
      // Remove instance at index 2
      mesh.removeInstances(2);
      expect(mesh.instancesCount).toBe(4);

      // Add a new instance - should reuse slot 2
      mesh.addInstances(1, (obj, index) => {
        obj.position.set(999, 0, 0);
      });

      expect(mesh.instancesCount).toBe(5);
      
      // The new instance should be at the freed slot
      const pos = mesh.getPositionAt(2);
      expect(pos.x).toBe(999);
    });

    it('should reuse multiple freed slots', () => {
      mesh.addInstances(5);
      mesh.removeInstances(1, 3);
      expect(mesh.instancesCount).toBe(3);

      mesh.addInstances(2);
      expect(mesh.instancesCount).toBe(5);
    });
  });

  describe('resizeBuffers', () => {
    it('should increase capacity', () => {
      mesh.resizeBuffers(50);

      expect(mesh.capacity).toBe(50);
    });

    it('should preserve existing instances when expanding', () => {
      mesh.addInstances(5, (obj, index) => {
        obj.position.set(index * 10, 0, 0);
      });
      
      mesh.resizeBuffers(50);

      expect(mesh.instancesCount).toBe(5);
      
      const pos2 = mesh.getPositionAt(2);
      expect(pos2.x).toBe(20);
    });

    it('should allow reducing capacity', () => {
      mesh.addInstances(3);
      mesh.resizeBuffers(5);

      expect(mesh.capacity).toBe(5);
      expect(mesh.instancesCount).toBe(3);
    });
  });

  describe('with entities enabled', () => {
    let meshWithEntities: InstancedMesh2;

    beforeEach(() => {
      meshWithEntities = createTestInstancedMeshWithEntities(10);
    });

    it('should create entity objects when adding instances', () => {
      meshWithEntities.addInstances(5, (obj, index) => {
        obj.position.set(index, 0, 0);
      });

      expect(meshWithEntities.instances).not.toBeNull();
      expect(meshWithEntities.instances.length).toBeGreaterThanOrEqual(5);
    });

    it('should allow accessing instances array', () => {
      meshWithEntities.addInstances(3, (obj, index) => {
        obj.position.set(index * 10, 0, 0);
      });

      const instance = meshWithEntities.instances[1];
      expect(instance.position.x).toBe(10);
    });

    it('should update entity when using instances array', () => {
      meshWithEntities.addInstances(3, (obj, index) => {
        obj.position.set(0, 0, 0);
      });

      const instance = meshWithEntities.instances[0];
      instance.position.set(100, 200, 300);
      instance.updateMatrix();

      const pos = meshWithEntities.getPositionAt(0);
      expect(pos.x).toBe(100);
      expect(pos.y).toBe(200);
      expect(pos.z).toBe(300);
    });
  });
});

