# CPU performance benchmarks

Run `npm run bench`. Results go to `benchmarks/results.json` (ignored by Git).
Type-check fixtures with `npx tsc -p tsconfig.benchmarks.json`.

The suite measures library CPU work. It does not measure WebGL uploads, shader compilation, GPU skinning, draw calls, or browser frame time. The culling and raycasting fixtures provide a CPU index array; they do not emulate a renderer. Those GPU costs require a separate browser benchmark on fixed hardware.

## Coverage

| Area | Operations and scenarios |
| --- | --- |
| Instances | Add with callback and identity initialization, entities, capacity growth, removal, reuse, clear, full updates and position updates, dense and sparse populations |
| Matrices | Set/get with explicit and default targets, position, maximum scale, position plus scale, transformed sphere, copy/decompose, world matrix updates, capacity resizing |
| Attributes | Active/visible flags and combined flags, Color and hexadecimal writes, opacity reads/writes |
| Entity | Transform writes, copy/decompose, rotation and translation helpers, matrix/world-matrix reads, active/visible/color/opacity properties, uniform forwarding, morph writes and bone forwarding; BVH variants for the two matrix updates that actually move nodes; removal |
| Uniforms | Reads and writes for float, vec2, vec3, vec4, mat3, mat4, schema/texture initialization |
| Morph and skeleton | Four-target morph reads/writes, initialization and 16-bone writes with/without matrix updates; buffer growth with all instance textures |
| Bounds | Bounding box and sphere, first call with uncached geometry bounds and repeat calls with dense and removed IDs |
| BVH | Construction from boxes/spheres, zero/nonzero margin, sparse population, direct create/insert/insertRange/delete/clear, incremental add/remove, stationary writes, movement within margin and relocation |
| Queries | Mesh raycasting with/without BVH, hits and misses, direct BVH ray and box queries, direct BVH frustum queries with/without accurate margin handling |
| Culling | Linear/BVH, full/partial/zero visibility, hidden and removed IDs, opaque/transparent/radix ordering, transformed mesh/non-centered geometry/callback, moving camera, empty mesh, dirty/cached index rebuild and frame cache |
| LOD | Linear/BVH, distance/screen metrics, perspective normal/shadow cameras, three distinct render objects and two shadow levels, verified level membership |
| Sorting | Radix factory and actual sorting, seeded random/sorted/reverse/duplicate/all-equal depths, opaque/transparent order and complete ID/depth permutation |
| Conversion | Conversion from ordinary THREE.InstancedMesh, with/without colors |

`clone()` and `copy()` are currently not measurable: the existing `SquareDataTexture.clone()` path throws `arrayType is not a constructor`. The entity `morph` getter also forwards to a default temporary Mesh without initialized morph influences. Sorted screen-space LOD is marked unsupported by the current implementation. Sorted distance LOD fails the independent level-membership reference when the first visible instance skips multiple thresholds; existing browser tests also report boundary defects. Both sorted LOD paths are excluded. Shadow passes disable sorting, so duplicate "sorted shadow" cases are not registered. Orthographic shadow rendering currently uses the render camera's projection type for LOD metrics even when a perspective LOD camera is supplied; shadow benchmarks therefore cover perspective cameras only. These limitations need separate runtime fixes and regression tests before their scenarios can join the gate. Explicit-target `getMorphAt` is covered. No library runtime source is changed by the suite.

## Measurement contract

One operation is one whole batch, not one instance. For per-instance accessors, world-matrix updates, empty culling, cached index checks and frame-cache checks a batch contains `BENCH_COUNT` calls; for populated culling, dirty index rebuilding, bounds, sorting, construction and queries a batch contains one operation on that population. `unit: ops/sec` remains compatible with github-action-benchmark; read it as batches/sec. Do not compare throughput between different tasks or population sizes.

The reported value is `1000 / mean latency in milliseconds`, rather than the arithmetic mean of reciprocal sample times. The latter disproportionately rewards exceptionally short samples. JSON also contains raw mean latency, its relative margin of error, sample count, instance count and runtime metadata. Samples are not retained in memory during the run.

Inputs are deterministic and include rotation and nonuniform scale. Initial positions are generated from instance IDs without a mutable random seed; they do not repeat every 128 IDs as the old fixture did. Sorting resets the unsorted input before every iteration. Read-only and repeatable operations reuse fixtures per phase (`beforeAll`). Destructive operations rebuild before every iteration (`beforeEach`) and dispose afterward. Setup, reset, disposal, reference calculations and assertions are outside the timed function. Destructive tests can still experience allocation/GC effects; inspect their error margins.

Culling results are checked against independent three.js Frustum and transformed Box3/Sphere queries, including visible IDs, native sort order and LOD membership. Mesh ray hits are checked against ordinary three.js meshes, including instance IDs and distances. Direct BVH query candidate counts and IDs are checked against transformed Box3 queries. Radix output is checked against native numeric sorting, including complete ID/depth preservation. Bounds and direct BVH relocation are checked against transformed geometry; the sphere reference rejects incorrect centers/radii, nonfinite values and incorrect empty bounds. Fixture errors, nonfinite statistics or insufficient samples fail the run. Assertions execute outside timed work. `insertRange` currently logs a dependency warning on every call; its benchmark temporarily suppresses console.warn for that task so terminal I/O is not measured.

## Controls

| Environment variable | Default | Meaning |
| --- | ---: | --- |
| BENCH_COUNT | 1000 | Positive integer population size |
| BENCH_TIME | 500 | Per-task iteration budget, milliseconds; includes beforeEach setup when present |
| BENCH_ITERATIONS | 32 | Minimum timed sample count |
| BENCH_FILTER | unset | Substring of task name; unmatched filter fails |
| BENCH_OUTPUT | results.json | Output path; `--output` also supported |
| BENCH_WARMUP_TIME | 100 | Warmup budget per task, milliseconds |
| BENCH_WARMUP_ITERATIONS | 8 | Minimum warmup sample count |

For a quick fixture check, use time=0, iterations=2, warmup time=0, warmup iterations=1. This is a correctness smoke check, never a performance measurement. Verify small populations and 10,000 instances when changing fixtures. For noisy performance results, increase the time and run several independent processes. Keep coverage and other CPU-intensive tasks separate from measurements.

PowerShell example:

```powershell
$env:BENCH_COUNT = '10000'
$env:BENCH_FILTER = 'bvh/'
$env:BENCH_TIME = '1000'
$env:BENCH_OUTPUT = 'benchmarks/large-bvh.json'
npm run bench
```

## PR comparison

CI measures 1,000 and 10,000 instances. Each population compares three independent process pairs on the same runner, using PR fixtures and dependencies for both the PR and its base source. Pair order alternates base/PR, PR/base, base/PR. Each process performs its own warmup. Matrix jobs and master workflow runs are serialized to keep benchmark-history pushes from racing. A newer run supersedes an obsolete PR run.

The threshold is **1.10 times latency**, i.e. +10% time or approximately -9.09% throughput. It is not a 10% throughput-loss threshold. The summary reports the median of paired latency ratios and median batch throughputs.

A confirmed regression requires every pair's conservative latency ratio to exceed 1.10:

`(current mean latency * (1 - current RME/100)) / (base mean latency * (1 + base RME/100)) > 1.10`

This uses tinybench's reported sample confidence margins and repeated runs as a conservative noise screen; it is not a guarantee against systematic runner noise or a multiple-comparison hypothesis test. Uncertain slowdowns are warnings. Confirmed regressions fail PR checks. Missing/duplicate/mismatched names, invalid values, mismatched population sizes or broken fixtures fail independently of the gate. There must be at least three paired runs for a failing performance gate; a single local comparison is diagnostic only.

Results record a context fingerprint containing benchmark-source hashes, Node/platform/architecture, three.js/tinybench versions and sampling settings. Paired gates require identical context and population in every round; the runtime library source is deliberately excluded from the hash so its performance can be compared. This does not prove equal hardware or dependency trees: use the same machine and installed dependencies as CI does. Artifacts preserve all base/current JSON files. History on master is stored separately under `bench/1000` and `bench/10000`; master history alerts remain advisory because they compare different runners. The rewritten fixtures and latency aggregation establish a new history; old values are not directly comparable.

To compare locally, place one base/current pair in before.json/results.json and run `node node_modules/vite-node/dist/cli.mjs --script benchmarks/compare-cli.ts`. For the repeated gate, provide before-0.json through before-2.json and after-0.json through after-2.json, set `BENCH_ROUNDS=3`, and run the same command. `BENCH_THRESHOLD` defaults to 1.1. Use identical source-independent fixtures, dependencies, settings and hardware in both runs.

FixtureBench uses tinybench's overriddenIterationCost to budget setup plus work, and overriddenDuration to report only work. Cleanup remains outside both the measured latency and that budget. It preserves the minimum sample count and uses explicit synchronous tasks to avoid a hidden async-detection invocation. Deterministic-clock regression tests check both timing isolation and minimum iterations.
