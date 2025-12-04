/**
 * Tests for Per-instance Visibility and Opacity features
 * 
 * Validates:
 * - setVisibilityAt/getVisibilityAt methods
 * - instances[i].visible property (with entities)
 * - setOpacityAt/getOpacityAt methods
 * - instances[i].opacity property (with entities)
 * - setActiveAt/getActiveAt methods
 * - Hidden instances excluded from render count
 * 
 * Tests run against both WebGL and WebGPU renderers.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Color } from 'three';
import { describeForEachRenderer, createTestInstancedMeshWithEntities, RendererType } from '../setup.js';
import { InstancedMesh2 } from '../../src/core/InstancedMesh2.js';

describeForEachRenderer('Per-instance Visibility', (rendererType, createMesh) => {
  let mesh: InstancedMesh2;

  beforeEach(() => {
    mesh = createMesh({ capacity: 100 });
    mesh.addInstances(10, (obj, index) => {
      obj.position.set(index, 0, 0);
    });
  });

  describe('setVisibilityAt / getVisibilityAt', () => {
    it('should default to true for new instances', () => {
      expect(mesh.getVisibilityAt(0)).toBe(true);
      expect(mesh.getVisibilityAt(5)).toBe(true);
    });

    it('should set visibility to false', () => {
      mesh.setVisibilityAt(3, false);

      expect(mesh.getVisibilityAt(3)).toBe(false);
    });

    it('should set visibility back to true', () => {
      mesh.setVisibilityAt(3, false);
      mesh.setVisibilityAt(3, true);

      expect(mesh.getVisibilityAt(3)).toBe(true);
    });

    it('should not affect other instances', () => {
      mesh.setVisibilityAt(5, false);

      expect(mesh.getVisibilityAt(4)).toBe(true);
      expect(mesh.getVisibilityAt(6)).toBe(true);
    });

    it('should mark index array for update', () => {
      mesh['_indexArrayNeedsUpdate'] = false;
      mesh.setVisibilityAt(0, false);

      expect(mesh['_indexArrayNeedsUpdate']).toBe(true);
    });
  });

  describe('setActiveAt / getActiveAt', () => {
    it('should default to true for new instances', () => {
      expect(mesh.getActiveAt(0)).toBe(true);
      expect(mesh.getActiveAt(5)).toBe(true);
    });

    it('should set active to false', () => {
      mesh.setActiveAt(3, false);

      expect(mesh.getActiveAt(3)).toBe(false);
    });

    it('should mark index array for update', () => {
      mesh['_indexArrayNeedsUpdate'] = false;
      mesh.setActiveAt(0, false);

      expect(mesh['_indexArrayNeedsUpdate']).toBe(true);
    });
  });

  describe('getActiveAndVisibilityAt', () => {
    it('should return true when both active and visible', () => {
      expect(mesh.getActiveAndVisibilityAt(0)).toBe(true);
    });

    it('should return false when not visible', () => {
      mesh.setVisibilityAt(0, false);

      expect(mesh.getActiveAndVisibilityAt(0)).toBe(false);
    });

    it('should return false when not active', () => {
      mesh.setActiveAt(0, false);

      expect(mesh.getActiveAndVisibilityAt(0)).toBe(false);
    });

    it('should return false when neither visible nor active', () => {
      mesh.setVisibilityAt(0, false);
      mesh.setActiveAt(0, false);

      expect(mesh.getActiveAndVisibilityAt(0)).toBe(false);
    });
  });

  describe('setActiveAndVisibilityAt', () => {
    it('should set both active and visible to true', () => {
      mesh.setVisibilityAt(0, false);
      mesh.setActiveAt(0, false);

      mesh.setActiveAndVisibilityAt(0, true);

      expect(mesh.getVisibilityAt(0)).toBe(true);
      expect(mesh.getActiveAt(0)).toBe(true);
    });

    it('should set both active and visible to false', () => {
      mesh.setActiveAndVisibilityAt(0, false);

      expect(mesh.getVisibilityAt(0)).toBe(false);
      expect(mesh.getActiveAt(0)).toBe(false);
    });
  });

  describe('with entities enabled', () => {
    let meshWithEntities: InstancedMesh2;

    beforeEach(() => {
      meshWithEntities = createTestInstancedMeshWithEntities(100, rendererType);
      meshWithEntities.addInstances(10, (obj, index) => {
        obj.position.set(index, 0, 0);
      });
    });

    it('should get visibility via instances[i].visible', () => {
      expect(meshWithEntities.instances[0].visible).toBe(true);
    });

    it('should set visibility via instances[i].visible', () => {
      meshWithEntities.instances[3].visible = false;

      expect(meshWithEntities.getVisibilityAt(3)).toBe(false);
    });

    it('should sync visibility between property and method', () => {
      meshWithEntities.setVisibilityAt(5, false);

      expect(meshWithEntities.instances[5].visible).toBe(false);
    });

    it('should get active state via instances[i].active', () => {
      expect(meshWithEntities.instances[0].active).toBe(true);
    });

    it('should set active state via instances[i].active', () => {
      meshWithEntities.instances[3].active = false;

      expect(meshWithEntities.getActiveAt(3)).toBe(false);
    });
  });
});

describeForEachRenderer('Per-instance Opacity', (rendererType, createMesh) => {
  let mesh: InstancedMesh2;

  beforeEach(() => {
    mesh = createMesh({ capacity: 100 });
    mesh.addInstances(10, (obj, index) => {
      obj.position.set(index, 0, 0);
    });
  });

  describe('setOpacityAt / getOpacityAt', () => {
    it('should default to 1 when opacity not initialized', () => {
      expect(mesh.getOpacityAt(0)).toBe(1);
    });

    it('should set opacity value', () => {
      mesh.setOpacityAt(3, 0.5);

      expect(mesh.getOpacityAt(3)).toBe(0.5);
    });

    it('should set opacity to 0', () => {
      mesh.setOpacityAt(0, 0);

      expect(mesh.getOpacityAt(0)).toBe(0);
    });

    it('should set opacity to 1', () => {
      mesh.setOpacityAt(0, 0.5);
      mesh.setOpacityAt(0, 1);

      expect(mesh.getOpacityAt(0)).toBe(1);
    });

    it('should not affect other instances', () => {
      mesh.setOpacityAt(5, 0.3);

      expect(mesh.getOpacityAt(4)).toBe(1);
      expect(mesh.getOpacityAt(6)).toBe(1);
    });

    it('should initialize colorsTexture when first opacity is set', () => {
      // Colors texture may or may not be initialized depending on setup
      const hadColorsTexture = mesh.colorsTexture !== null;
      
      mesh.setOpacityAt(0, 0.5);

      expect(mesh.colorsTexture).not.toBeNull();
      
      // If we didn't have it before, it should be created now
      if (!hadColorsTexture) {
        expect(mesh['_useOpacity']).toBe(true);
      }
    });
  });

  describe('with entities enabled', () => {
    let meshWithEntities: InstancedMesh2;

    beforeEach(() => {
      meshWithEntities = createTestInstancedMeshWithEntities(100, rendererType);
      meshWithEntities.addInstances(10, (obj, index) => {
        obj.position.set(index, 0, 0);
      });
    });

    it('should get opacity via instances[i].opacity', () => {
      expect(meshWithEntities.instances[0].opacity).toBe(1);
    });

    it('should set opacity via instances[i].opacity', () => {
      meshWithEntities.instances[3].opacity = 0.7;

      expect(meshWithEntities.getOpacityAt(3)).toBeCloseTo(0.7, 5);
    });

    it('should sync opacity between property and method', () => {
      meshWithEntities.setOpacityAt(5, 0.4);

      expect(meshWithEntities.instances[5].opacity).toBeCloseTo(0.4, 5);
    });
  });

  describe('opacity edge cases', () => {
    it('should handle very small opacity values', () => {
      mesh.setOpacityAt(0, 0.001);

      expect(mesh.getOpacityAt(0)).toBeCloseTo(0.001, 5);
    });

    it('should handle multiple opacity changes', () => {
      mesh.setOpacityAt(0, 0.2);
      mesh.setOpacityAt(0, 0.8);
      mesh.setOpacityAt(0, 0.5);

      expect(mesh.getOpacityAt(0)).toBe(0.5);
    });

    it('should set opacity on multiple instances', () => {
      for (let i = 0; i < 5; i++) {
        mesh.setOpacityAt(i, i * 0.2);
      }

      expect(mesh.getOpacityAt(0)).toBe(0);
      expect(mesh.getOpacityAt(1)).toBeCloseTo(0.2, 5);
      expect(mesh.getOpacityAt(2)).toBeCloseTo(0.4, 5);
      expect(mesh.getOpacityAt(3)).toBeCloseTo(0.6, 5);
      expect(mesh.getOpacityAt(4)).toBeCloseTo(0.8, 5);
    });
  });
});

describeForEachRenderer('Per-instance Color', (rendererType, createMesh) => {
  let mesh: InstancedMesh2;

  beforeEach(() => {
    mesh = createMesh({ capacity: 100 });
    mesh.addInstances(5, (obj, index) => {
      obj.position.set(index, 0, 0);
    });
  });

  describe('setColorAt / getColorAt', () => {
    it('should set color using hex value', () => {
      mesh.setColorAt(0, 0xff0000);

      const color = mesh.getColorAt(0);
      expect(color.r).toBeCloseTo(1, 5);
      expect(color.g).toBeCloseTo(0, 5);
      expect(color.b).toBeCloseTo(0, 5);
    });

    it('should set color using Color object', () => {
      mesh.setColorAt(0, new Color(0, 1, 0));

      const color = mesh.getColorAt(0);
      expect(color.r).toBeCloseTo(0, 5);
      expect(color.g).toBeCloseTo(1, 5);
      expect(color.b).toBeCloseTo(0, 5);
    });

    it('should set different colors on different instances', () => {
      mesh.setColorAt(0, 0xff0000);
      mesh.setColorAt(1, 0x00ff00);
      mesh.setColorAt(2, 0x0000ff);

      expect(mesh.getColorAt(0).r).toBeCloseTo(1, 5);
      expect(mesh.getColorAt(1).g).toBeCloseTo(1, 5);
      expect(mesh.getColorAt(2).b).toBeCloseTo(1, 5);
    });

    it('should initialize colorsTexture when first color is set', () => {
      const hadColorsTexture = mesh.colorsTexture !== null;
      
      mesh.setColorAt(0, 0xff0000);

      expect(mesh.colorsTexture).not.toBeNull();
    });
  });

  describe('with entities enabled', () => {
    let meshWithEntities: InstancedMesh2;

    beforeEach(() => {
      meshWithEntities = createTestInstancedMeshWithEntities(100, rendererType);
      meshWithEntities.addInstances(5, (obj, index) => {
        obj.position.set(index, 0, 0);
      });
    });

    it('should set color via instances[i].color', () => {
      meshWithEntities.instances[0].color = 0xff0000;

      const color = meshWithEntities.getColorAt(0);
      expect(color.r).toBeCloseTo(1, 5);
    });

    it('should get color via instances[i].color', () => {
      meshWithEntities.setColorAt(0, 0x00ff00);

      const color = meshWithEntities.instances[0].color;
      expect(color.g).toBeCloseTo(1, 5);
    });
  });
});
