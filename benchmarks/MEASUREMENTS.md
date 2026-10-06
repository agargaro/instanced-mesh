# Local benchmark validation

2026-10-06. Windows x64, Node 22.18.0, AMD Ryzen 9 5950X. CPU measurements only.

The reviewed suite completed all 187 distinct scenarios with 1,000 instances, a 500 ms iteration budget, 64 minimum timed samples, 100 ms warmup and eight minimum warmup samples. Correctness smoke checks completed with one and 10,000 instances. Browser tests, coverage and builds ran separately from performance measurements.

Accessor and world-matrix batches contain 1,000 calls; populated culling, bounds and ray queries are one invocation. These values replace the earlier 212-case report: redundant BVH entity variants were removed, bounds initialization and all-equal sorting were added, and incorrect sorted LOD paths were excluded after independent membership checks. The original and intermediate fixtures are not valid performance baselines for the reviewed suite. No library runtime source was modified and no runtime improvement is claimed.

| Benchmark | Mean ms/batch | Latency RME | Samples |
| --- | ---: | ---: | ---: |
| matrices/getMatrixAt | 0.019004 | 0.27% | 26311 |
| bvh/computeBVH/sphere=false/margin=0 | 0.507037 | 11.40% | 860 |
| frustum/linear/all/none | 0.021009 | 0.49% | 23800 |
| frustum/bvh/all/none | 0.020492 | 0.23% | 24401 |
| bounds/computeBoundingBox/first-call | 0.161742 | 1.12% | 2027 |
| bounds/computeBoundingBox/dense | 0.155085 | 0.49% | 3225 |
| bounds/computeBoundingSphere/dense | 0.097640 | 0.10% | 5121 |
| raycast/linear/hit | 0.116345 | 5.31% | 4285 |
| raycast/bvh/hit | 0.003344 | 2.22% | 138859 |
| matrices/updateMatrixWorld | 0.027575 | 0.27% | 18133 |

12 cases reported latency RME above 10% in this run. BVH construction and other allocation-heavy operations need longer/repeated measurements before interpreting small differences. The gate accounts for both error margins and treats uncertain slowdowns as warnings; this run does not prove uniform sensitivity to a 10% regression in every task.

## Correctness and tooling

- Chromium: 14 files, 197 passed and 18 existing expected failures.
- Node: 16 regression checks passed, including deterministic harness timing, repeated comparison metadata, invalid statistics and deliberately corrupted bounds/sorting/LOD output, empty results, nonfinite spheres and reordered results.
- Library build, lint, browser test types and benchmark types passed.
- Runtime coverage: statements 97.96%, branches 96.10%, functions 99.55%, lines 98.19%. Existing uncovered runtime branches remain; no thresholds or exclusions changed.
- Skill frontmatter, local reference and commands were checked. The system Python skill validator could not run because its PyYAML dependency is unavailable; no dependency was installed for this check.

Known limitations and excluded runtime defects are listed in README.md. Orthographic shadow LOD, sorted LOD, clone/copy and the default entity morph getter need separate runtime work. GPU rendering and complex production geometry need a separate browser performance suite on fixed hardware. The GitHub Actions workflow was inspected locally; its hosted execution remains to be verified on a PR.

## Unchanged-source control

Three independently warmed pairs used the same final source, fixtures, dependencies, settings and machine, alternating A/B, B/A, A/B. All five matrix scenarios passed the 1.10 gate with no warning or confirmed regression. This tests a representative subset, not every scenario or hosted CI noise. The table summarizes paired ratios and median batch throughputs independently; A and B are identical library source.

| Benchmark | Base batches/sec | PR batches/sec | Paired latency ratio | Result |
|---|---:|---:|---:|---|
| matrices/setMatrixAt | 54632 | 56248 | 0.971x | OK |
| matrices/getMatrixAt | 52217 | 53607 | 0.975x | OK |
| matrices/getPositionAt | 107588 | 108202 | 0.996x | OK |
| matrices/resizeBuffers (+50%) | 19986 | 19827 | 1.008x | OK |
| matrices/updateMatrixWorld | 42103 | 41705 | 1.010x | OK |
