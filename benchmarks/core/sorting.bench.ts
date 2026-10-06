import { Bench } from 'tinybench';
import { Material } from 'three';
import { InstancedRenderList, createRadixSort } from '../../src/index.js';
import { COUNT, createMesh } from '../shared.js';
import { verifySortedDepths } from '../verify.js';

function createDepths(distribution: string): Float32Array {
  const depths = new Float32Array(COUNT);
  let seed = 123456789;
  for (let i = 0; i < COUNT; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    switch (distribution) {
      case 'random':
        depths[i] = seed / 0x100000000 * 1000;
        break;
      case 'equal':
        depths[i] = 1;
        break;
      case 'duplicates':
        depths[i] = i % 8;
        break;
      case 'reverse':
        depths[i] = COUNT - i;
        break;
      default:
        depths[i] = i;
    }
  }
  return depths;
}

export function registerSortingBenchmarks(bench: Bench): void {
  for (const transparent of [false, true]) {
    for (const distribution of ['random', 'sorted', 'reverse', 'duplicates', 'equal']) {
      let mesh: ReturnType<typeof createMesh>;
      const list = new InstancedRenderList();
      const depths = createDepths(distribution);
      let sort: ReturnType<typeof createRadixSort>;
      bench.add(`sorting/radix/${distribution}/transparent=${transparent}`, () => sort(list.array), {
        beforeAll: () => {
          mesh = createMesh();
          mesh.material = (mesh.material as Material).clone();
          (mesh.material as Material).transparent = transparent;
          sort = createRadixSort(mesh);
        },
        beforeEach: () => {
          list.reset();
          for (let i = 0; i < COUNT; i++) list.push(depths[i], i);
        },
        afterAll: () => {
          verifySortedDepths(list.array, depths, transparent);
          (mesh.material as Material).dispose();
          mesh.dispose();
        }
      });
    }
  }
}
