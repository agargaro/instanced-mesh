---
name: run-benchmark
description: Measure CPU performance in this repository, extend benchmark coverage, or check a throughput regression before and after a runtime change. Use for benchmarks, performance investigations, refactoring and micro-optimizations. GPU/frame-time investigations need separate browser measurements.
---

# Run and extend CPU benchmarks

Read [benchmarks/README.md](../../../benchmarks/README.md) for the coverage matrix, controls, batch definitions, known unsupported paths and CI comparison contract. Follow `AGENTS.md`: performance claims require actual measurements; never commit, push or publish.

## Choose and validate the measurement

1. Identify the API and the work it actually performs. Only create a BVH variant if that call traverses or updates the BVH. Separate first-call initialization, repeatable calls, stationary writes, movement within a margin and relocation where relevant.
2. Use deterministic, representative inputs. Include rotation, nonuniform scale, visibility/removal and workload sizes relevant to the change. Preserve identical fixtures and dependencies for baseline and candidate. Compare neither different task names nor different batch sizes.
3. Keep the actual operation in the timed function. Use direct loops for batches of short calls; avoid an extra callback dispatch per instance. Very short single calls need batching to keep clock and harness overhead from dominating. Document what one batch means.
4. Check observable results outside timing. Use independent references for culling, bounds, ray hits, sorting and LOD membership. A successful execution alone is insufficient; detect missing/duplicate IDs and incorrect ordering. Document known runtime defects and unsupported paths instead of bypassing them inside a benchmark.

## Fixture lifecycle

Register tasks in `benchmarks/core/<topic>.bench.ts` and wire them into `benchmarks/index.ts`. The runner uses `FixtureBench`, with synchronous tasks and no async-detection invocation.

- Reads and bounded repeatable writes: create a fresh fixture in `beforeAll` for each warmup/run phase, dispose in `afterAll`.
- Destructive operations: rebuild in `beforeEach`, validate and dispose in `afterEach`.
- Reset accumulators, changing inputs and dirty flags outside timing. Avoid state or mutable target values leaking between tasks or phases.
- Setup/reset and cleanup are excluded from reported latency. The iteration budget includes `beforeEach` setup plus timed work; cleanup is excluded. Minimum sample counts still apply. Allocation and GC can affect destructive tasks despite setup being untimed.
- Use `createMesh`, `seedInstances`, `attachIndex` and reference checks where appropriate. The CPU index array is not a renderer; do not claim GPU timings from it.

Example of a repeatable task with cleanup and validation:

```ts
import { Bench } from 'tinybench';
import { InstancedMesh2 } from '../../src/index.js';
import { createMesh, seedInstances } from '../shared.js';
import { verifyBounds } from '../verify.js';

export function registerExampleBenchmarks(bench: Bench): void {
  let mesh: InstancedMesh2;
  bench.add('example/computeBoundingBox', () => mesh.computeBoundingBox(), {
    beforeAll: () => {
      mesh = createMesh();
      seedInstances(mesh);
      mesh.computeBoundingBox();
    },
    afterAll: () => {
      verifyBounds(mesh, 'box');
      mesh.dispose();
    }
  });
}
```

## Run and compare

Use PowerShell in this workspace:

```powershell
$env:BENCH_COUNT = '1000'
$env:BENCH_TIME = '500'
$env:BENCH_ITERATIONS = '64'
$env:BENCH_OUTPUT = 'benchmarks/before.json'
npm run bench
```

After the runtime change, keep the same suite, machine, dependencies and settings, set `BENCH_OUTPUT` to `benchmarks/results.json`, and run again. Run `node node_modules/vite-node/dist/cli.mjs --script benchmarks/compare-cli.ts` for an advisory single-pair comparison. When changing fixtures, use the new fixtures against both source revisions; old measurements are not comparable. CI archives the base source and overlays the PR benchmark suite.

For the failing gate, collect at least three independent pairs named `before-0.json`/`after-0.json` through `before-2.json`/`after-2.json`, alternating baseline/candidate, candidate/baseline, baseline/candidate. Set `BENCH_ROUNDS=3` and run the same comparator. Remove that environment variable for a single-pair comparison. Freeze benchmark files before collecting pairs: results record their hash, runtime versions, population, settings, uncertainty and sample counts. Mismatches or invalid results fail independently of performance.

CI uses four disjoint `BENCH_SHARD` groups per population on separate runners. Preserve sequential base/candidate measurements within each job and complete suite coverage across groups. Cache installed dependencies and browser binaries with version/platform keys; timing results from other runs are unsuitable for the paired gate. Use `BENCH_SHARD=all` locally for the full suite.

The default threshold is **1.10 times latency** (+10% time, approximately -9.09% throughput). A failing gate requires every paired conservative ratio to exceed it after accounting for both latency error margins. Uncertain slowdowns are warnings; a single pair cannot fail the performance gate. This screens noise but does not eliminate systematic runner effects.

If results are noisy, check fixture isolation and batch duration, increase `BENCH_TIME`, then repeat independent processes and an unchanged-source control. Do not raise thresholds or remove cases merely to make the gate pass. Keep coverage, builds and other CPU-intensive work separate from performance runs. Report machine, settings, batch definition, latency/throughput, error margins and limitations; claim no improvement when evidence is inconclusive.

## Verify changes

Run correctness smoke checks with populations 1 and 10000 (`BENCH_TIME=0`, `BENCH_ITERATIONS=2`, `BENCH_WARMUP_TIME=0`, `BENCH_WARMUP_ITERATIONS=1`). These are not performance measurements. Clear smoke overrides before measuring.

Run `npm run lint`, `npx tsc -p tsconfig.benchmarks.json`, `npm run build`, `npm test`, `npm run test:types` and `npm run test:coverage`. Add meaningful regression checks for harness/comparator fixes. Finally run the actual benchmarks separately. Summarize outcomes and existing limitations without changing coverage exclusions or thresholds.
