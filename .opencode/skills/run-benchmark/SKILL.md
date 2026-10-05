---
name: run-benchmark
description: Use when measuring performance, checking for a throughput/frame-time regression, or validating a refactoring or micro-optimization in this repository. Triggers include "benchmark", "bench", "performance", "regressione", "rallenta", "è più veloce", "misura le performance".
---

# Run and extend benchmarks

Performance is the primary goal of this library (see the "Performance first" section of `AGENTS.md`). Never claim faster/slower without measured before/after numbers.

## Scope: CPU micro-benchmarks only

The suite runs in Node via `vite-node` (so the library source, including `.glsl` chunks, loads without bundling) and only covers **CPU hot paths**:

- `instances/addInstances`, `removeInstances`, `updateInstances`, `updateInstancesPosition` (with/without entities, with capacity growth);
- `matrices/setMatrixAt`, `getMatrixAt`, `getPositionAt`, `resizeBuffers`;
- `bvh/computeBVH`, BVH insert/delete/move;
- `sorting/createRadixSort`;
- CPU-only linear frustum culling and render-index updates using an index-array fixture.

**Not benchmarked here:** GPU rendering, texture uploads, draw/skinning/LOD and browser frame rates. CPU frustum benchmarks use an index-array fixture and do not represent rendering performance. Validate GPU behavior manually in `examples/` on fixed hardware.

## Run

```bash
npm run bench                      # all benchmarks, writes benchmarks/results.json
BENCH_TIME=1000 BENCH_ITERATIONS=64 BENCH_COUNT=10000 npm run bench
```

- `BENCH_TIME` — time budget per task in ms (default 500).
- `BENCH_ITERATIONS` — minimum iterations per task (default 32).
- `BENCH_COUNT` — instance count per benchmark (default 1000).
- `--output <path>` — where the JSON is written (default `benchmarks/results.json`, gitignored).

Results are ops/sec (bigger is better). `range` is the relative margin of error; ignore differences smaller than a few percent. A run with a large `rme` is noisy — increase `BENCH_TIME`.

## Add a benchmark

Create `benchmarks/core/<topic>.bench.ts` exporting `register<topic>Benchmarks(bench: Bench): void`, then call it from `benchmarks/index.ts`.

```ts
import { Bench } from 'tinybench';
import { InstancedMesh2 } from '../../src/index.js';
import { COUNT, createMesh, seedInstances } from '../shared.js';

export function registerExampleBenchmarks(bench: Bench): void {
  let mesh: InstancedMesh2;

  bench.add('topic/operation', () => {
    mesh.operation();
  }, {
    beforeEach: () => { mesh = createMesh(COUNT, false); seedInstances(mesh); }
  });
}
```

Rules:

- State mutation must be isolated: rebuild the fixture in `beforeEach` (it runs before each iteration and is **not** timed). Never let a task accumulate state across iterations.
- Use deterministic inputs so runs compare cleanly (see the seeded PRNG in `sorting.bench.ts` instead of `Math.random`). Note: `benchmarks/index.ts` writes JSON in the exact shape `github-action-benchmark` expects (`{ name, unit, value, range, extra }`) — keep it.
- Keep the original call in the timed function. Do not move the measured work into `beforeEach`.
- `benchmarks/**` is linted by `npm run lint` and excluded from the library build (only `src/**` is included in `tsconfig.build.json`).

## Before/after procedure

1. Benchmark the baseline on the current code and save it: `npm run bench -- --output benchmarks/before.json`.
2. Apply the change.
3. Benchmark again: `npm run bench -- --output benchmarks/after.json`.
4. Compare the same task names; report real numbers. If a change cannot be measured, prefer the simpler already-measured implementation.

## CI

`.github/workflows/benchmark.yml` runs `npm run bench` on every PR and on `master`, then `benchmark-action/github-action-benchmark`:

- PRs compare their base revision and current code on the same runner with the same dependencies and benchmark suite;
- baseline history is stored on the `gh-pages` branch under `bench/` (updated on push to `master`);
- a baseline/current throughput ratio above 1.15 emits a warning in the PR check summary;
- performance alerts warn without failing; benchmark errors or missing results fail the job.

If a benchmark is inherently flaky, fix the fixture or raise the threshold rather than disabling the gate.
