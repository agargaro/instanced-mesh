import { Bench } from 'tinybench';
import { InstancedRenderList, createRadixSort } from '../../src/index.js';
import { COUNT, createMesh } from '../shared.js';

let _seed = 123456789;

function random(): number {
  _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
  return _seed / 0x7fffffff;
}

export function registerSortingBenchmarks(bench: Bench): void {
  const mesh = createMesh(COUNT, false);
  const list = new InstancedRenderList();
  const depths = new Float32Array(COUNT);
  const sort = createRadixSort(mesh);

  for (let i = 0; i < COUNT; i++) {
    depths[i] = random() * 1000;
  }

  bench.add('sorting/createRadixSort', () => {
    sort(list.array);
  }, {
    beforeEach: () => {
      list.reset();
      for (let i = 0; i < COUNT; i++) {
        list.push(depths[i], i);
      }
    }
  });
}
