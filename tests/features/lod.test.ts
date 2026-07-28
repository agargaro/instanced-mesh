/**
 * Tests for Level of Detail (LOD) feature
 *
 * Validates:
 * - addLOD() registers levels correctly
 * - setFirstLODDistance() configuration
 * - addShadowLOD() for shadow-specific LODs
 * - getObjectLODIndexForDistance() returns correct level
 * - LOD level sorting and distance thresholds
 *
 * Note: Actual distance-based rendering tests are in e2e/lod-switching.spec.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BoxGeometry, MeshBasicMaterial, SphereGeometry } from 'three';
import { createTestInstancedMesh } from '../setup';
import { InstancedMesh2 } from '../../src/core/InstancedMesh2';

describe('Level of Detail (LOD)', () => {
  let mesh: InstancedMesh2;
  let lowPolyGeometry: BoxGeometry;
  let midPolyGeometry: SphereGeometry;
  let material: MeshBasicMaterial;

  beforeEach(() => {
    mesh = createTestInstancedMesh({ capacity: 100 });
    lowPolyGeometry = new BoxGeometry(1, 1, 1, 1, 1, 1);
    midPolyGeometry = new SphereGeometry(0.5, 8, 8);
    material = new MeshBasicMaterial({ color: 0x00ff00 });
  });

  describe('setFirstLODDistance', () => {
    it('should initialize LODinfo structure', () => {
      mesh.setFirstLODDistance(0, 0);

      expect(mesh.LODinfo).not.toBeNull();
      expect(mesh.LODinfo.render).not.toBeNull();
      expect(mesh.LODinfo.render.levels).toHaveLength(1);
    });

    it('should set first LOD with default values', () => {
      mesh.setFirstLODDistance(0);

      const firstLevel = mesh.LODinfo.render.levels[0];
      expect(firstLevel.distance).toBe(0);
      expect(firstLevel.hysteresis).toBe(0);
      expect(firstLevel.object).toBe(mesh);
    });

    it('should set first LOD with custom distance', () => {
      mesh.setFirstLODDistance(100);

      const firstLevel = mesh.LODinfo.render.levels[0];
      expect(firstLevel.distance).toBe(100);
      // Note: hysteresis is always 0 at first level, as per implementation
      expect(firstLevel.hysteresis).toBe(0);
    });

    it('should be chainable', () => {
      const result = mesh.setFirstLODDistance();
      expect(result).toBe(mesh);
    });

    it('should include mesh in objects list', () => {
      mesh.setFirstLODDistance();

      expect(mesh.LODinfo.objects).toContain(mesh);
    });
  });

  describe('addLOD', () => {
    it('should add LOD level with specified distance', () => {
      mesh.addLOD(lowPolyGeometry, material, 50);

      expect(mesh.LODinfo.render.levels).toHaveLength(2);
    });

    it('should throw when adding LOD at distance 0 without setFirstLODDistance', () => {
      expect(() => mesh.addLOD(lowPolyGeometry, material, 0)).toThrow();
    });

    it('should store squared distance internally', () => {
      mesh.addLOD(lowPolyGeometry, material, 10);

      // Distance is squared: 10^2 = 100
      const lodLevel = mesh.LODinfo.render.levels[1];
      expect(lodLevel.distance).toBe(100);
    });

    it('should add multiple LOD levels in correct order', () => {
      mesh.addLOD(midPolyGeometry, material, 50);
      mesh.addLOD(lowPolyGeometry, material, 100);

      const levels = mesh.LODinfo.render.levels;
      expect(levels).toHaveLength(3);

      // Levels should be sorted by distance (ascending, squared)
      expect(levels[0].distance).toBe(0);
      expect(levels[1].distance).toBe(2500); // 50^2
      expect(levels[2].distance).toBe(10000); // 100^2
    });

    it('should create new InstancedMesh2 for each LOD geometry', () => {
      mesh.addLOD(lowPolyGeometry, material, 50);
      mesh.addLOD(midPolyGeometry, material, 100);

      expect(mesh.LODinfo.objects).toHaveLength(3);
    });

    it('should reuse existing InstancedMesh2 for same geometry', () => {
      mesh.addLOD(lowPolyGeometry, material, 50);
      mesh.addLOD(lowPolyGeometry, material, 100);

      // Should only create one additional object for lowPolyGeometry
      expect(mesh.LODinfo.objects).toHaveLength(2);
    });

    it('should set hysteresis value', () => {
      mesh.addLOD(lowPolyGeometry, material, 50, 0.2);

      const lodLevel = mesh.LODinfo.render.levels[1];
      expect(lodLevel.hysteresis).toBe(0.2);
    });

    it('should be chainable', () => {
      const result = mesh.addLOD(lowPolyGeometry, material, 50);
      expect(result).toBe(mesh);
    });

    it('should add LOD objects as children', () => {
      mesh.addLOD(lowPolyGeometry, material, 50);

      expect(mesh.children.length).toBeGreaterThan(0);
    });
  });

  describe('addShadowLOD', () => {
    it('should create shadow render list', () => {
      mesh.addShadowLOD(lowPolyGeometry, 0);

      expect(mesh.LODinfo.shadowRender).not.toBeNull();
      expect(mesh.LODinfo.shadowRender.levels).toHaveLength(1);
    });

    it('should enable castShadow on mesh', () => {
      mesh.addShadowLOD(lowPolyGeometry, 0);

      expect(mesh.castShadow).toBe(true);
    });

    it('should add multiple shadow LOD levels', () => {
      mesh.addShadowLOD(midPolyGeometry, 0);
      mesh.addShadowLOD(lowPolyGeometry, 100);

      expect(mesh.LODinfo.shadowRender.levels).toHaveLength(2);
    });

    it('should be chainable', () => {
      const result = mesh.addShadowLOD(lowPolyGeometry, 50);
      expect(result).toBe(mesh);
    });
  });

  describe('getObjectLODIndexForDistance', () => {
    beforeEach(() => {
      mesh.setFirstLODDistance(0);
      mesh.addLOD(midPolyGeometry, material, 50);
      mesh.addLOD(lowPolyGeometry, material, 100);
    });

    it('should return 0 for distance below first threshold', () => {
      const levels = mesh.LODinfo.render.levels;
      const index = mesh.getObjectLODIndexForDistance(levels, 100); // sqrt(100) = 10

      expect(index).toBe(0);
    });

    it('should return correct index for mid-range distance', () => {
      const levels = mesh.LODinfo.render.levels;
      // 50^2 = 2500, need distance >= 2500 for index 1
      const index = mesh.getObjectLODIndexForDistance(levels, 3000);

      expect(index).toBe(1);
    });

    it('should return last index for distance beyond all thresholds', () => {
      const levels = mesh.LODinfo.render.levels;
      // 100^2 = 10000, need distance >= 10000 for index 2
      const index = mesh.getObjectLODIndexForDistance(levels, 15000);

      expect(index).toBe(2);
    });

    it('should handle exact threshold distance', () => {
      const levels = mesh.LODinfo.render.levels;
      // Exactly at threshold (2500 = 50^2)
      const index = mesh.getObjectLODIndexForDistance(levels, 2500);

      expect(index).toBe(1);
    });

    it('should account for hysteresis in distance calculation', () => {
      // Create new mesh with hysteresis
      const meshWithHysteresis = createTestInstancedMesh({ capacity: 100 });
      meshWithHysteresis.setFirstLODDistance(0);
      meshWithHysteresis.addLOD(lowPolyGeometry, material, 100, 0.1); // 10% hysteresis

      const levels = meshWithHysteresis.LODinfo.render.levels;
      // Distance threshold is 100^2 = 10000
      // With 10% hysteresis: 10000 - (10000 * 0.1) = 9000

      // At 9000, should still be level 1 (hysteresis reduces threshold)
      const indexAtHysteresis = meshWithHysteresis.getObjectLODIndexForDistance(levels, 9000);
      expect(indexAtHysteresis).toBe(1);

      // Below hysteresis threshold, should be level 0
      const indexBelowHysteresis = meshWithHysteresis.getObjectLODIndexForDistance(levels, 8000);
      expect(indexBelowHysteresis).toBe(0);
    });
  });

  describe('LOD count tracking', () => {
    beforeEach(() => {
      mesh.setFirstLODDistance(0);
      mesh.addLOD(lowPolyGeometry, material, 50);
    });

    it('should initialize count array', () => {
      expect(mesh.LODinfo.render.count).toHaveLength(2);
    });

    it('should have count array match levels array length', () => {
      mesh.addLOD(midPolyGeometry, material, 100);

      expect(mesh.LODinfo.render.count.length).toBe(
        mesh.LODinfo.render.levels.length
      );
    });
  });

  describe('LOD texture sharing', () => {
    beforeEach(() => {
      mesh.addInstances(5, (obj, index) => {
        obj.position.set(index, 0, 0);
      });
      mesh.addLOD(lowPolyGeometry, material, 50);
    });

    it('should share matricesTexture with child LOD objects', () => {
      const lodObject = mesh.LODinfo.objects[1];

      expect(lodObject.matricesTexture).toBe(mesh.matricesTexture);
    });

    it('should share colorsTexture with child LOD objects', () => {
      // Initialize colors texture
      mesh.setColorAt(0, 0xff0000);

      const lodObject = mesh.LODinfo.objects[1];
      expect(lodObject.colorsTexture).toBe(mesh.colorsTexture);
    });
  });

  describe('error handling', () => {
    it('should throw when creating LOD on child LOD object', () => {
      mesh.addLOD(lowPolyGeometry, material, 50);
      const lodChild = mesh.LODinfo.objects[1];

      expect(() => lodChild.addLOD(midPolyGeometry, material, 100)).toThrow();
    });

    it('should throw when setting first LOD distance on child', () => {
      mesh.addLOD(lowPolyGeometry, material, 50);
      const lodChild = mesh.LODinfo.objects[1];

      expect(() => lodChild.setFirstLODDistance(0)).toThrow();
    });

    it('should throw when adding shadow LOD on child', () => {
      mesh.addLOD(lowPolyGeometry, material, 50);
      const lodChild = mesh.LODinfo.objects[1];

      expect(() => lodChild.addShadowLOD(midPolyGeometry)).toThrow();
    });
  });
});
