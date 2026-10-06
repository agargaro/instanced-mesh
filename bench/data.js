window.BENCHMARK_DATA = {
  "lastUpdate": 1791272110357,
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
      },
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
          "id": "65654c78f02b694a239ae5a33c2ca71ef23bdabd",
          "message": "Add real WebGL browser tests and PR coverage checks (#168)\n\n* Add real WebGL browser tests and PR coverage checks\n\n* Address PR analysis warnings and cover historical rendering bugs",
          "timestamp": "2026-10-06T09:33:59+02:00",
          "tree_id": "9af41ec72b8ecfe7eabcbe0b74d24f3fe9da4fdc",
          "url": "https://github.com/agargaro/instanced-mesh/commit/65654c78f02b694a239ae5a33c2ca71ef23bdabd"
        },
        "date": 1791272109884,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "instances/addInstances",
            "value": 26010.8676,
            "range": "±0.21%",
            "unit": "ops/sec",
            "extra": "12695 samples, 0.0394 ms/op"
          },
          {
            "name": "instances/addInstances (growth)",
            "value": 22162.9199,
            "range": "±0.39%",
            "unit": "ops/sec",
            "extra": "9668 samples, 0.0517 ms/op"
          },
          {
            "name": "instances/addInstances (entities)",
            "value": 12581.0757,
            "range": "±0.21%",
            "unit": "ops/sec",
            "extra": "6236 samples, 0.0802 ms/op"
          },
          {
            "name": "instances/removeInstances",
            "value": 105150.345,
            "range": "±0.11%",
            "unit": "ops/sec",
            "extra": "50840 samples, 0.0098 ms/op"
          },
          {
            "name": "instances/updateInstances",
            "value": 47597.1016,
            "range": "±0.22%",
            "unit": "ops/sec",
            "extra": "22820 samples, 0.0219 ms/op"
          },
          {
            "name": "instances/updateInstancesPosition",
            "value": 109383.5092,
            "range": "±0.19%",
            "unit": "ops/sec",
            "extra": "50070 samples, 0.0100 ms/op"
          },
          {
            "name": "instances/updateInstances (entities)",
            "value": 51725.6153,
            "range": "±0.14%",
            "unit": "ops/sec",
            "extra": "25438 samples, 0.0197 ms/op"
          },
          {
            "name": "matrices/setMatrixAt",
            "value": 54278.0761,
            "range": "±0.15%",
            "unit": "ops/sec",
            "extra": "26369 samples, 0.0190 ms/op"
          },
          {
            "name": "matrices/getMatrixAt",
            "value": 51789.6051,
            "range": "±0.15%",
            "unit": "ops/sec",
            "extra": "25253 samples, 0.0198 ms/op"
          },
          {
            "name": "matrices/getPositionAt",
            "value": 106239.2625,
            "range": "±0.11%",
            "unit": "ops/sec",
            "extra": "51511 samples, 0.0097 ms/op"
          },
          {
            "name": "matrices/resizeBuffers (+50%)",
            "value": 136983.7695,
            "range": "±0.22%",
            "unit": "ops/sec",
            "extra": "43961 samples, 0.0114 ms/op"
          },
          {
            "name": "bvh/computeBVH",
            "value": 3928.3164,
            "range": "±1.24%",
            "unit": "ops/sec",
            "extra": "1248 samples, 0.4008 ms/op"
          },
          {
            "name": "bvh/addInstances (insert)",
            "value": 772.0069,
            "range": "±2.06%",
            "unit": "ops/sec",
            "extra": "337 samples, 1.4859 ms/op"
          },
          {
            "name": "bvh/removeInstances (delete)",
            "value": 14316.6821,
            "range": "±0.31%",
            "unit": "ops/sec",
            "extra": "6101 samples, 0.0820 ms/op"
          },
          {
            "name": "bvh/updateInstancesPosition (move)",
            "value": 965.5248,
            "range": "±1.40%",
            "unit": "ops/sec",
            "extra": "443 samples, 1.1349 ms/op"
          },
          {
            "name": "bvh/setMatrixAt (move)",
            "value": 22138.4588,
            "range": "±0.25%",
            "unit": "ops/sec",
            "extra": "10649 samples, 0.0470 ms/op"
          },
          {
            "name": "frustum/linearCulling",
            "value": 40328.3719,
            "range": "±0.14%",
            "unit": "ops/sec",
            "extra": "19865 samples, 0.0252 ms/op"
          },
          {
            "name": "frustum/updateIndexArray",
            "value": 420191.1696,
            "range": "±0.05%",
            "unit": "ops/sec",
            "extra": "205174 samples, 0.0024 ms/op"
          },
          {
            "name": "sorting/createRadixSort",
            "value": 40827.3521,
            "range": "±0.07%",
            "unit": "ops/sec",
            "extra": "20311 samples, 0.0246 ms/op"
          }
        ]
      }
    ]
  }
}