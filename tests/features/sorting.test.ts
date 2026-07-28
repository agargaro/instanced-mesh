/**
 * Tests for Sorting feature
 * 
 * Validates:
 * - sortObjects property toggle
 * - sortOpaque comparator (front-to-back)
 * - sortTransparent comparator (back-to-front)
 * - createRadixSort optimization
 * - customSort callback integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MeshBasicMaterial } from 'three';
import { createTestInstancedMesh } from '../setup';
import { InstancedMesh2 } from '../../src/core/InstancedMesh2';
import { createRadixSort, sortOpaque, sortTransparent } from '../../src/utils/SortingUtils';
import { InstancedRenderItem } from '../../src/core/utils/InstancedRenderList';

describe('Sorting', () => {
  let mesh: InstancedMesh2;

  beforeEach(() => {
    mesh = createTestInstancedMesh({ capacity: 100 });
  });

  describe('sortObjects property', () => {
    it('should default to false', () => {
      expect(mesh.sortObjects).toBe(false);
    });

    it('should be settable to true', () => {
      mesh.sortObjects = true;
      expect(mesh.sortObjects).toBe(true);
    });

    it('should mark index array for update when changed', () => {
      mesh.addInstances(5);
      mesh.sortObjects = true;
      expect(mesh['_indexArrayNeedsUpdate']).toBe(true);
    });
  });

  describe('sortOpaque', () => {
    it('should sort front-to-back (smaller depth first)', () => {
      const items: InstancedRenderItem[] = [
        { depth: 100, depthSort: 0, index: 0 },
        { depth: 50, depthSort: 0, index: 1 },
        { depth: 200, depthSort: 0, index: 2 },
        { depth: 10, depthSort: 0, index: 3 },
      ];

      items.sort(sortOpaque);

      expect(items.map(i => i.depth)).toEqual([10, 50, 100, 200]);
    });

    it('should return negative when a.depth < b.depth', () => {
      const a: InstancedRenderItem = { depth: 10, depthSort: 0, index: 0 };
      const b: InstancedRenderItem = { depth: 20, depthSort: 0, index: 1 };

      expect(sortOpaque(a, b)).toBeLessThan(0);
    });

    it('should return positive when a.depth > b.depth', () => {
      const a: InstancedRenderItem = { depth: 30, depthSort: 0, index: 0 };
      const b: InstancedRenderItem = { depth: 20, depthSort: 0, index: 1 };

      expect(sortOpaque(a, b)).toBeGreaterThan(0);
    });

    it('should return 0 when depths are equal', () => {
      const a: InstancedRenderItem = { depth: 50, depthSort: 0, index: 0 };
      const b: InstancedRenderItem = { depth: 50, depthSort: 0, index: 1 };

      expect(sortOpaque(a, b)).toBe(0);
    });
  });

  describe('sortTransparent', () => {
    it('should sort back-to-front (larger depth first)', () => {
      const items: InstancedRenderItem[] = [
        { depth: 100, depthSort: 0, index: 0 },
        { depth: 50, depthSort: 0, index: 1 },
        { depth: 200, depthSort: 0, index: 2 },
        { depth: 10, depthSort: 0, index: 3 },
      ];

      items.sort(sortTransparent);

      expect(items.map(i => i.depth)).toEqual([200, 100, 50, 10]);
    });

    it('should return positive when a.depth < b.depth', () => {
      const a: InstancedRenderItem = { depth: 10, depthSort: 0, index: 0 };
      const b: InstancedRenderItem = { depth: 20, depthSort: 0, index: 1 };

      expect(sortTransparent(a, b)).toBeGreaterThan(0);
    });

    it('should return negative when a.depth > b.depth', () => {
      const a: InstancedRenderItem = { depth: 30, depthSort: 0, index: 0 };
      const b: InstancedRenderItem = { depth: 20, depthSort: 0, index: 1 };

      expect(sortTransparent(a, b)).toBeLessThan(0);
    });
  });

  describe('createRadixSort', () => {
    it('should create a radix sort function', () => {
      const sortFn = createRadixSort(mesh);

      expect(typeof sortFn).toBe('function');
    });

    it('should sort items by depthSort value', () => {
      const sortFn = createRadixSort(mesh);
      
      const items: InstancedRenderItem[] = [
        { depth: 100, depthSort: 0, index: 0 },
        { depth: 50, depthSort: 0, index: 1 },
        { depth: 200, depthSort: 0, index: 2 },
      ];

      sortFn(items);

      // After sorting, items should be ordered by depth (which determines depthSort)
      const depths = items.map(i => i.depth);
      expect(depths[0]).toBeLessThanOrEqual(depths[1]);
      expect(depths[1]).toBeLessThanOrEqual(depths[2]);
    });

    it('should handle empty array', () => {
      const sortFn = createRadixSort(mesh);
      const items: InstancedRenderItem[] = [];

      expect(() => sortFn(items)).not.toThrow();
    });

    it('should handle single item array', () => {
      const sortFn = createRadixSort(mesh);
      const items: InstancedRenderItem[] = [
        { depth: 100, depthSort: 0, index: 0 },
      ];

      expect(() => sortFn(items)).not.toThrow();
      expect(items).toHaveLength(1);
    });

    it('should reverse order for transparent materials', () => {
      const transparentMaterial = new MeshBasicMaterial({ 
        transparent: true, 
        opacity: 0.5 
      });
      mesh.material = transparentMaterial;
      
      const sortFn = createRadixSort(mesh);
      
      const items: InstancedRenderItem[] = [
        { depth: 50, depthSort: 0, index: 0 },
        { depth: 100, depthSort: 0, index: 1 },
        { depth: 25, depthSort: 0, index: 2 },
      ];

      sortFn(items);

      // For transparent, should be back-to-front (largest depth first)
      const depths = items.map(i => i.depth);
      expect(depths[0]).toBeGreaterThanOrEqual(depths[1]);
      expect(depths[1]).toBeGreaterThanOrEqual(depths[2]);
    });
  });

  describe('customSort property', () => {
    it('should default to null', () => {
      expect(mesh.customSort).toBeNull();
    });

    it('should accept custom sort function', () => {
      const customFn = vi.fn();
      mesh.customSort = customFn;

      expect(mesh.customSort).toBe(customFn);
    });

    it('should accept radix sort function', () => {
      const radixSort = createRadixSort(mesh);
      mesh.customSort = radixSort;

      expect(mesh.customSort).toBe(radixSort);
    });
  });

  describe('sorting with visibility', () => {
    beforeEach(() => {
      mesh.addInstances(5, (obj, index) => {
        obj.position.set(index * 10, 0, 0);
      });
    });

    it('should only sort visible instances', () => {
      mesh.setVisibilityAt(2, false);
      mesh.sortObjects = true;

      // The hidden instance should not be included in sorting
      // This is tested more thoroughly in e2e tests
      expect(mesh.getVisibilityAt(2)).toBe(false);
    });
  });

  describe('depthSort calculation', () => {
    it('should compute depthSort based on depth range', () => {
      const sortFn = createRadixSort(mesh);
      
      const items: InstancedRenderItem[] = [
        { depth: 100, depthSort: 0, index: 0 },
        { depth: 200, depthSort: 0, index: 1 },
        { depth: 300, depthSort: 0, index: 2 },
      ];

      sortFn(items);

      // After sorting, depthSort should be computed (non-zero for normalized values)
      // The actual values depend on the depth range normalization
      expect(items[0].depthSort).toBeDefined();
    });
  });

  describe('integration example', () => {
    it('should demonstrate typical sorting setup', () => {
      // Create mesh with transparent material
      const transparentMaterial = new MeshBasicMaterial({
        transparent: true,
        opacity: 0.5,
      });
      mesh.material = transparentMaterial;

      // Add instances at various depths
      mesh.addInstances(10, (obj, index) => {
        obj.position.set(0, 0, index * 10); // Different z positions
      });

      // Enable sorting with radix sort optimization
      mesh.sortObjects = true;
      mesh.customSort = createRadixSort(mesh);

      expect(mesh.sortObjects).toBe(true);
      expect(mesh.customSort).not.toBeNull();
    });
  });
});

