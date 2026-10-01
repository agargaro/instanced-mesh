window.BENCHMARK_DATA = {
  "lastUpdate": 1790855629637,
  "repoUrl": "https://github.com/agargaro/instanced-mesh",
  "entries": {
    "Benchmark": [
      {
        "commit": {
          "author": {
            "email": "devgargaro@gmail.com",
            "name": "Andrea Gargaro",
            "username": "agargaro"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "1909c146e3ea044345b2b1b2bb2b721c8cf073d5",
          "message": "Workflows and small refactoring (#166)\n\n* fix: optimize matrix handling and update logic in InstancedEntity; add elementsPerRow to SquareDataTexture\n\n* fix: update copyTo method in InstancedEntity to conditionally copy rotation or quaternion\n\n* fix: remove unnecessary type assertion for quaternion in InstancedEntity; add Quaternion interface definition\n\n* fix: clarify performance trade-off for enabling rotation with Euler angles in documentation\n\n* feat: add skills for documentation and examples management\n\n- Introduced `add-docs-page` skill for adding/editing documentation pages in the Astro Starlight site.\n- Added `add-example` skill for creating runnable examples in the repository for both the root Vite app and documentation site.\n- Created `add-feature-mixin` skill for adding new features to InstancedMesh2 with proper TypeScript module augmentation.\n- Implemented `add-shader-chunk` skill for adding and wiring GLSL shader chunks into three.js materials.\n- Added `run-benchmark` skill for measuring performance and validating optimizations through CPU micro-benchmarks.\n\nchore: update AGENTS.md to include new skills and performance guidelines\n\n- Updated peer dependency for `three` to version 0.186.0.\n- Added performance-first guidelines emphasizing the importance of benchmarks for any changes.\n- Documented new workflows for using skills in the repository.\n\ntest: add benchmarks for core functionalities\n\n- Implemented benchmarks for BVH operations, instance management, matrix manipulations, and sorting.\n- Created shared utilities for setting up benchmarks and seeding instances.\n\nfix: update package dependencies\n\n- Added `tinybench` for benchmarking and `vite-node` for running benchmarks in Node.\n\n* fix: update .gitignore to exclude all JSON results; improve documentation clarity in AGENTS.md and CONTRIBUTING.md\n\n* Enhance benchmark workflow with PR comments\n\nAdded a new step to comment benchmark results on pull requests and modified the auto-push condition for the benchmark action.\n\n* fix",
          "timestamp": "2026-10-01T13:52:57+02:00",
          "tree_id": "5f0a84b4022891b17fe85cbc00b8704c0834308d",
          "url": "https://github.com/agargaro/instanced-mesh/commit/1909c146e3ea044345b2b1b2bb2b721c8cf073d5"
        },
        "date": 1790855629525,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "instances/addInstances",
            "value": 19108.4402,
            "range": "±0.18%",
            "unit": "ops/sec",
            "extra": "9445 samples, 0.0529 ms/op"
          },
          {
            "name": "instances/addInstances (growth)",
            "value": 16612.0514,
            "range": "±0.39%",
            "unit": "ops/sec",
            "extra": "7333 samples, 0.0682 ms/op"
          },
          {
            "name": "instances/addInstances (entities)",
            "value": 10130.049,
            "range": "±0.48%",
            "unit": "ops/sec",
            "extra": "4407 samples, 0.1135 ms/op"
          },
          {
            "name": "instances/removeInstances",
            "value": 73224.5389,
            "range": "±0.17%",
            "unit": "ops/sec",
            "extra": "29364 samples, 0.0170 ms/op"
          },
          {
            "name": "instances/updateInstances",
            "value": 35777.1782,
            "range": "±0.14%",
            "unit": "ops/sec",
            "extra": "17651 samples, 0.0283 ms/op"
          },
          {
            "name": "instances/updateInstancesPosition",
            "value": 67221.5827,
            "range": "±0.10%",
            "unit": "ops/sec",
            "extra": "33080 samples, 0.0151 ms/op"
          },
          {
            "name": "instances/updateInstances (entities)",
            "value": 38481.6009,
            "range": "±0.12%",
            "unit": "ops/sec",
            "extra": "19017 samples, 0.0263 ms/op"
          },
          {
            "name": "matrices/setMatrixAt",
            "value": 37529.5304,
            "range": "±0.14%",
            "unit": "ops/sec",
            "extra": "18483 samples, 0.0271 ms/op"
          },
          {
            "name": "matrices/getMatrixAt",
            "value": 24119.5316,
            "range": "±0.17%",
            "unit": "ops/sec",
            "extra": "11888 samples, 0.0421 ms/op"
          },
          {
            "name": "matrices/getPositionAt",
            "value": 65485.8991,
            "range": "±0.12%",
            "unit": "ops/sec",
            "extra": "32070 samples, 0.0156 ms/op"
          },
          {
            "name": "matrices/resizeBuffers (+50%)",
            "value": 117658.0246,
            "range": "±0.31%",
            "unit": "ops/sec",
            "extra": "25083 samples, 0.0199 ms/op"
          },
          {
            "name": "bvh/computeBVH",
            "value": 1318.6122,
            "range": "±2.64%",
            "unit": "ops/sec",
            "extra": "463 samples, 1.0804 ms/op"
          },
          {
            "name": "bvh/addInstances (insert)",
            "value": 477.3802,
            "range": "±3.53%",
            "unit": "ops/sec",
            "extra": "211 samples, 2.3702 ms/op"
          },
          {
            "name": "bvh/removeInstances (delete)",
            "value": 5915.2293,
            "range": "±0.61%",
            "unit": "ops/sec",
            "extra": "2522 samples, 0.1987 ms/op"
          },
          {
            "name": "bvh/setMatrixAt (move)",
            "value": 2862.2879,
            "range": "±0.93%",
            "unit": "ops/sec",
            "extra": "1214 samples, 0.4121 ms/op"
          },
          {
            "name": "sorting/createRadixSort",
            "value": 23856.3538,
            "range": "±0.09%",
            "unit": "ops/sec",
            "extra": "11887 samples, 0.0421 ms/op"
          }
        ]
      }
    ]
  }
}