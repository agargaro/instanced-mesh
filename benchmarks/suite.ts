import { Bench } from 'tinybench';
import { registerBVHBenchmarks } from './core/bvh.bench.js';
import { registerFrustumBenchmarks } from './core/frustum.bench.js';
import { registerInstancesBenchmarks } from './core/instances.bench.js';
import { registerMatricesBenchmarks } from './core/matrices.bench.js';
import { registerSortingBenchmarks } from './core/sorting.bench.js';
import { registerAccessBenchmarks, registerBoundsAndRayBenchmarks } from './core/access.bench.js';
import { registerEntityBenchmarks } from './core/entity.bench.js';
import { registerLifecycleBenchmarks } from './core/lifecycle.bench.js';
import { registerSupplementalBenchmarks } from './core/supplemental.bench.js';

export function registerBenchmarks(bench: Bench): void {
  registerInstancesBenchmarks(bench);
  registerMatricesBenchmarks(bench);
  registerBVHBenchmarks(bench);
  registerFrustumBenchmarks(bench);
  registerSortingBenchmarks(bench);
  registerAccessBenchmarks(bench);
  registerBoundsAndRayBenchmarks(bench);
  registerEntityBenchmarks(bench);
  registerLifecycleBenchmarks(bench);
  registerSupplementalBenchmarks(bench);
}
