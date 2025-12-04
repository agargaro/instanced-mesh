/**
 * Tests for Per-instance Frustum Culling feature
 * 
 * Validates:
 * - perObjectFrustumCulled property toggle
 * - Index array updates based on visibility
 * - onFrustumEnter callback behavior
 * - Integration with visibility state
 * 
 * Note: Full frustum intersection tests are in e2e/frustum-culling.spec.ts
 * since they require a real camera and WebGL context.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerspectiveCamera } from 'three';
import { createTestInstancedMesh } from '../setup';
import { InstancedMesh2 } from '../../src/core/InstancedMesh2.common';

describe('Frustum Culling', () => {
  let mesh: InstancedMesh2;
  let camera: PerspectiveCamera;

  beforeEach(() => {
    mesh = createTestInstancedMesh({ capacity: 100 });
    camera = new PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
  });

  describe('perObjectFrustumCulled property', () => {
    it('should default to true', () => {
      expect(mesh.perObjectFrustumCulled).toBe(true);
    });

    it('should be settable to false', () => {
      mesh.perObjectFrustumCulled = false;
      expect(mesh.perObjectFrustumCulled).toBe(false);
    });

    it('should mark index array for update when changed', () => {
      mesh.addInstances(5);
      mesh.perObjectFrustumCulled = false;
      expect(mesh['_indexArrayNeedsUpdate']).toBe(true);
    });
  });

  describe('updateIndexArray', () => {
    beforeEach(() => {
      mesh.addInstances(5, (obj, index) => {
        obj.position.set(index, 0, 0);
      });
    });

    it('should include all visible and active instances', () => {
      mesh['_indexArrayNeedsUpdate'] = true;
      mesh.updateIndexArray();

      expect(mesh.count).toBe(5);
    });

    it('should exclude hidden instances', () => {
      mesh.setVisibilityAt(2, false);
      mesh['_indexArrayNeedsUpdate'] = true;
      mesh.updateIndexArray();

      expect(mesh.count).toBe(4);
    });

    it('should exclude removed instances', () => {
      mesh.removeInstances(1, 3);
      mesh['_indexArrayNeedsUpdate'] = true;
      mesh.updateIndexArray();

      expect(mesh.count).toBe(3);
    });

    it('should not update if flag is false', () => {
      mesh['_indexArrayNeedsUpdate'] = false;
      const originalCount = mesh.count;
      mesh.setVisibilityAt(0, false);
      mesh['_indexArrayNeedsUpdate'] = false; // Reset flag
      mesh.updateIndexArray();

      // Count should not change since flag was false
      expect(mesh.count).toBe(originalCount);
    });
  });

  describe('performFrustumCulling', () => {
    it('should set count to 0 when no instances exist', () => {
      mesh.performFrustumCulling(camera);
      expect(mesh.count).toBe(0);
    });

    it('should process instances when they exist', () => {
      mesh.addInstances(5, (obj, index) => {
        obj.position.set(0, 0, 0); // All at origin, in front of camera
      });

      mesh.perObjectFrustumCulled = false;
      mesh.performFrustumCulling(camera);

      expect(mesh.count).toBe(5);
    });

    it('should respect visibility when culling is disabled', () => {
      mesh.addInstances(5, (obj, index) => {
        obj.position.set(0, 0, 0);
      });
      mesh.setVisibilityAt(2, false);

      mesh.perObjectFrustumCulled = false;
      mesh.performFrustumCulling(camera);

      expect(mesh.count).toBe(4);
    });
  });

  describe('onFrustumEnter callback', () => {
    beforeEach(() => {
      mesh.addInstances(5, (obj, index) => {
        obj.position.set(0, 0, 0);
      });
    });

    it('should allow setting onFrustumEnter callback', () => {
      const callback = vi.fn(() => true);
      mesh.onFrustumEnter = callback;

      expect(mesh.onFrustumEnter).toBe(callback);
    });

    it('should be called during linear culling when set', () => {
      const callback = vi.fn(() => true);
      mesh.onFrustumEnter = callback;

      // Trigger linear culling (no BVH)
      mesh.linearCulling(camera);

      // Callback should be invoked for each visible instance in frustum
      expect(callback).toHaveBeenCalled();
    });

    it('should filter instances when callback returns false', () => {
      // Only allow even indices
      mesh.onFrustumEnter = (index) => index % 2 === 0;

      mesh.linearCulling(camera);

      // Only indices 0, 2, 4 should pass (3 instances)
      expect(mesh.count).toBe(3);
    });

    it('should receive correct parameters', () => {
      const callback = vi.fn(() => true);
      mesh.onFrustumEnter = callback;

      mesh.linearCulling(camera);

      // First call should have index and camera
      expect(callback).toHaveBeenCalledWith(
        expect.any(Number),
        camera
      );
    });
  });

  describe('autoUpdate property', () => {
    it('should default to true', () => {
      expect(mesh.autoUpdate).toBe(true);
    });

    it('should be settable', () => {
      mesh.autoUpdate = false;
      expect(mesh.autoUpdate).toBe(false);
    });
  });

  describe('raycastOnlyFrustum property', () => {
    it('should default to false', () => {
      expect(mesh.raycastOnlyFrustum).toBe(false);
    });

    it('should be settable', () => {
      mesh.raycastOnlyFrustum = true;
      expect(mesh.raycastOnlyFrustum).toBe(true);
    });
  });

  describe('integration with visibility', () => {
    beforeEach(() => {
      mesh.addInstances(10, (obj, index) => {
        obj.position.set(0, 0, 0);
      });
    });

    it('should skip culling for hidden instances', () => {
      // Hide half the instances
      for (let i = 0; i < 5; i++) {
        mesh.setVisibilityAt(i, false);
      }

      mesh.perObjectFrustumCulled = false;
      mesh.performFrustumCulling(camera);

      expect(mesh.count).toBe(5);
    });

    it('should skip culling for removed instances', () => {
      mesh.removeInstances(0, 1, 2);

      mesh.perObjectFrustumCulled = false;
      mesh.performFrustumCulling(camera);

      expect(mesh.count).toBe(7);
    });

    it('should handle mixed visibility and removal', () => {
      mesh.removeInstances(0, 1);
      mesh.setVisibilityAt(5, false);
      mesh.setVisibilityAt(6, false);

      mesh.perObjectFrustumCulled = false;
      mesh.performFrustumCulling(camera);

      expect(mesh.count).toBe(6);
    });
  });
});

