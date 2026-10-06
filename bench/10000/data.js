window.BENCHMARK_DATA = {
  "lastUpdate": 1791281153637,
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
          "id": "56786de4651bf5d45d218d720bb09e95d765db93",
          "message": "Rewrite CPU benchmarks and strengthen PR performance regression checks (#169)\n\n* Rewrite CPU benchmarks and add conservative paired PR regression gate\n\n* Resolve PR static analysis findings in benchmark tooling\n\n* Parallelize benchmark shards and cache CI dependencies and Chromium\n\n* Scope benchmark CI permissions and clarify shard test ordering\n\n* Run CI benchmarks only with 10000 instances",
          "timestamp": "2026-10-06T12:03:12+02:00",
          "tree_id": "df3a3620755288ef4ea30d4e30810d8969552f6f",
          "url": "https://github.com/agargaro/instanced-mesh/commit/56786de4651bf5d45d218d720bb09e95d765db93"
        },
        "date": 1791281152434,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "instances/addInstances/identity/entities=false",
            "value": 5352.570483228279,
            "range": "±1.45%",
            "unit": "ops/sec",
            "extra": "1541 samples, 0.186826 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "instances/updateInstancesPosition/entities=false/sparse=false",
            "value": 3270.6549366159406,
            "range": "±0.36%",
            "unit": "ops/sec",
            "extra": "1636 samples, 0.305749 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "instances/updateInstancesPosition/entities=false/sparse=true",
            "value": 6388.213599948764,
            "range": "±0.29%",
            "unit": "ops/sec",
            "extra": "3195 samples, 0.156538 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "instances/addInstances/identity/entities=true",
            "value": 418.76903034620665,
            "range": "±38.21%",
            "unit": "ops/sec",
            "extra": "206 samples, 2.387951 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "instances/updateInstancesPosition/entities=true/sparse=false",
            "value": 3759.8271532258136,
            "range": "±0.14%",
            "unit": "ops/sec",
            "extra": "1880 samples, 0.265970 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "instances/updateInstancesPosition/entities=true/sparse=true",
            "value": 6894.0822731335,
            "range": "±0.14%",
            "unit": "ops/sec",
            "extra": "3448 samples, 0.145052 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "instances/addInstances",
            "value": 2338.3059292116295,
            "range": "±3.59%",
            "unit": "ops/sec",
            "extra": "894 samples, 0.427660 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "instances/addInstances (growth)",
            "value": 1679.6028604857938,
            "range": "±5.17%",
            "unit": "ops/sec",
            "extra": "761 samples, 0.595379 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "instances/addInstances (entities)",
            "value": 394.310436663704,
            "range": "±37.37%",
            "unit": "ops/sec",
            "extra": "197 samples, 2.536073 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "instances/removeInstances",
            "value": 7289.600171365579,
            "range": "±24.99%",
            "unit": "ops/sec",
            "extra": "774 samples, 0.137182 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "instances/updateInstances",
            "value": 5509.452999469855,
            "range": "±0.18%",
            "unit": "ops/sec",
            "extra": "2755 samples, 0.181506 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "instances/updateInstancesPosition",
            "value": 7011.586933388854,
            "range": "±0.09%",
            "unit": "ops/sec",
            "extra": "3506 samples, 0.142621 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "instances/updateInstances (entities)",
            "value": 5902.770039807031,
            "range": "±0.10%",
            "unit": "ops/sec",
            "extra": "2952 samples, 0.169412 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "matrices/setMatrixAt",
            "value": 7366.978538959495,
            "range": "±0.46%",
            "unit": "ops/sec",
            "extra": "3684 samples, 0.135741 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "matrices/getMatrixAt",
            "value": 7564.928639676785,
            "range": "±0.97%",
            "unit": "ops/sec",
            "extra": "3783 samples, 0.132189 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "matrices/getPositionAt",
            "value": 14671.752839648794,
            "range": "±0.10%",
            "unit": "ops/sec",
            "extra": "7336 samples, 0.068158 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "matrices/resizeBuffers (+50%)",
            "value": 5005.535753351978,
            "range": "±14.54%",
            "unit": "ops/sec",
            "extra": "583 samples, 0.199779 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bvh/computeBVH/sphere=false/margin=0",
            "value": 179.7401433838092,
            "range": "±20.81%",
            "unit": "ops/sec",
            "extra": "84 samples, 5.563587 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bvh/computeBVH/sphere=false/margin=1",
            "value": 149.09884979312957,
            "range": "±25.03%",
            "unit": "ops/sec",
            "extra": "69 samples, 6.706960 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bvh/computeBVH/sphere=true/margin=0",
            "value": 179.00543780777846,
            "range": "±22.70%",
            "unit": "ops/sec",
            "extra": "83 samples, 5.586422 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bvh/computeBVH/sphere=true/margin=1",
            "value": 129.36822121436467,
            "range": "±32.26%",
            "unit": "ops/sec",
            "extra": "60 samples, 7.729874 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bvh/addInstances/insert",
            "value": 32.15613420610588,
            "range": "±9.51%",
            "unit": "ops/sec",
            "extra": "32 samples, 31.098266 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bvh/removeInstances/delete",
            "value": 672.8682110036211,
            "range": "±35.69%",
            "unit": "ops/sec",
            "extra": "70 samples, 1.486175 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bvh/updateInstancesPosition/move/margin=0",
            "value": 53.854455432785194,
            "range": "±8.83%",
            "unit": "ops/sec",
            "extra": "32 samples, 18.568566 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bvh/setMatrixAt/stationary/margin=0",
            "value": 956.5272207481432,
            "range": "±10.96%",
            "unit": "ops/sec",
            "extra": "83 samples, 1.045449 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bvh/setMatrixAt/relocation/margin=0",
            "value": 60.23540716178785,
            "range": "±12.83%",
            "unit": "ops/sec",
            "extra": "32 samples, 16.601531 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bvh/updateInstancesPosition/move/margin=1",
            "value": 1181.9690849160095,
            "range": "±13.67%",
            "unit": "ops/sec",
            "extra": "71 samples, 0.846046 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bvh/setMatrixAt/stationary/margin=1",
            "value": 1078.2499977168225,
            "range": "±15.82%",
            "unit": "ops/sec",
            "extra": "85 samples, 0.927429 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bvh/setMatrixAt/relocation/margin=1",
            "value": 65.58122323339548,
            "range": "±10.12%",
            "unit": "ops/sec",
            "extra": "32 samples, 15.248267 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/linear/all/none",
            "value": 6972.917747383721,
            "range": "±0.17%",
            "unit": "ops/sec",
            "extra": "3487 samples, 0.143412 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/linear/all/opaque",
            "value": 633.8836481208416,
            "range": "±1.65%",
            "unit": "ops/sec",
            "extra": "317 samples, 1.577577 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/linear/all/transparent",
            "value": 639.1541957477806,
            "range": "±1.63%",
            "unit": "ops/sec",
            "extra": "320 samples, 1.564568 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/linear/all/radix",
            "value": 1527.9709554172236,
            "range": "±1.11%",
            "unit": "ops/sec",
            "extra": "765 samples, 0.654463 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/linear/partial/none",
            "value": 10602.134639220207,
            "range": "±0.13%",
            "unit": "ops/sec",
            "extra": "5302 samples, 0.094321 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/linear/partial/opaque",
            "value": 2620.8437152027973,
            "range": "±0.88%",
            "unit": "ops/sec",
            "extra": "1311 samples, 0.381557 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/linear/partial/transparent",
            "value": 2429.849446528559,
            "range": "±1.91%",
            "unit": "ops/sec",
            "extra": "1215 samples, 0.411548 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/linear/partial/radix",
            "value": 4774.900435926345,
            "range": "±0.60%",
            "unit": "ops/sec",
            "extra": "2388 samples, 0.209428 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/linear/none/none",
            "value": 13023.57511888643,
            "range": "±0.59%",
            "unit": "ops/sec",
            "extra": "6512 samples, 0.076784 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/linear/none/opaque",
            "value": 13592.044050496466,
            "range": "±0.09%",
            "unit": "ops/sec",
            "extra": "6797 samples, 0.073572 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/linear/none/transparent",
            "value": 13617.591662904382,
            "range": "±0.09%",
            "unit": "ops/sec",
            "extra": "6809 samples, 0.073434 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/linear/none/radix",
            "value": 13285.360044209008,
            "range": "±0.20%",
            "unit": "ops/sec",
            "extra": "6643 samples, 0.075271 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/linear/sparse/none",
            "value": 12446.985993842247,
            "range": "±0.36%",
            "unit": "ops/sec",
            "extra": "6224 samples, 0.080341 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/linear/sparse/opaque",
            "value": 1205.7606589208508,
            "range": "±1.54%",
            "unit": "ops/sec",
            "extra": "603 samples, 0.829352 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/linear/sparse/transparent",
            "value": 1241.6988408465684,
            "range": "±0.68%",
            "unit": "ops/sec",
            "extra": "621 samples, 0.805348 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/linear/sparse/radix",
            "value": 2045.4553729610875,
            "range": "±0.64%",
            "unit": "ops/sec",
            "extra": "1023 samples, 0.488889 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/bvh/all/none",
            "value": 5579.8260545041,
            "range": "±0.25%",
            "unit": "ops/sec",
            "extra": "2790 samples, 0.179217 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/bvh/all/opaque",
            "value": 524.1212715783854,
            "range": "±1.64%",
            "unit": "ops/sec",
            "extra": "263 samples, 1.907955 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/bvh/all/transparent",
            "value": 544.6987658501354,
            "range": "±1.02%",
            "unit": "ops/sec",
            "extra": "273 samples, 1.835877 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/bvh/all/radix",
            "value": 1131.3214832564584,
            "range": "±1.92%",
            "unit": "ops/sec",
            "extra": "567 samples, 0.883922 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/bvh/partial/none",
            "value": 20416.17867271236,
            "range": "±0.32%",
            "unit": "ops/sec",
            "extra": "10209 samples, 0.048981 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/bvh/partial/opaque",
            "value": 2981.669070512594,
            "range": "±1.29%",
            "unit": "ops/sec",
            "extra": "1491 samples, 0.335383 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/bvh/partial/transparent",
            "value": 3208.8887361590696,
            "range": "±0.83%",
            "unit": "ops/sec",
            "extra": "1605 samples, 0.311634 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/bvh/partial/radix",
            "value": 5351.937981740218,
            "range": "±0.96%",
            "unit": "ops/sec",
            "extra": "2676 samples, 0.186848 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/bvh/none/none",
            "value": 8159509.314575577,
            "range": "±0.54%",
            "unit": "ops/sec",
            "extra": "4079755 samples, 0.000123 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/bvh/none/opaque",
            "value": 4350115.643258914,
            "range": "±0.72%",
            "unit": "ops/sec",
            "extra": "2175058 samples, 0.000230 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/bvh/none/transparent",
            "value": 4190440.9690933055,
            "range": "±4.54%",
            "unit": "ops/sec",
            "extra": "2095221 samples, 0.000239 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/bvh/none/radix",
            "value": 1098503.8593915342,
            "range": "±0.89%",
            "unit": "ops/sec",
            "extra": "549252 samples, 0.000910 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/bvh/sparse/none",
            "value": 7035.598309548645,
            "range": "±0.19%",
            "unit": "ops/sec",
            "extra": "3518 samples, 0.142134 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/bvh/sparse/opaque",
            "value": 1010.1157139849279,
            "range": "±1.06%",
            "unit": "ops/sec",
            "extra": "506 samples, 0.989986 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/bvh/sparse/transparent",
            "value": 1034.3962265769778,
            "range": "±1.03%",
            "unit": "ops/sec",
            "extra": "518 samples, 0.966748 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/bvh/sparse/radix",
            "value": 1557.5403604944797,
            "range": "±0.97%",
            "unit": "ops/sec",
            "extra": "779 samples, 0.642038 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/transformed/nonCentered/callback",
            "value": 5674.383992181756,
            "range": "±0.74%",
            "unit": "ops/sec",
            "extra": "2838 samples, 0.176231 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "lod/linear/screen/sort=false/shadow=false",
            "value": 4451.021478537448,
            "range": "±0.91%",
            "unit": "ops/sec",
            "extra": "2226 samples, 0.224668 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "lod/linear/screen/sort=false/shadow=true",
            "value": 4735.332999933529,
            "range": "±0.27%",
            "unit": "ops/sec",
            "extra": "2368 samples, 0.211178 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "lod/linear/distance/sort=false/shadow=false",
            "value": 2102.6474678110467,
            "range": "±0.63%",
            "unit": "ops/sec",
            "extra": "1052 samples, 0.475591 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "lod/linear/distance/sort=false/shadow=true",
            "value": 2514.3152177164798,
            "range": "±0.74%",
            "unit": "ops/sec",
            "extra": "1258 samples, 0.397723 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "lod/bvh/screen/sort=false/shadow=false",
            "value": 2991.847278162989,
            "range": "±0.32%",
            "unit": "ops/sec",
            "extra": "1496 samples, 0.334242 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "lod/bvh/screen/sort=false/shadow=true",
            "value": 3212.3589407362215,
            "range": "±0.10%",
            "unit": "ops/sec",
            "extra": "1607 samples, 0.311298 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "lod/bvh/distance/sort=false/shadow=false",
            "value": 5493.636200420208,
            "range": "±2.12%",
            "unit": "ops/sec",
            "extra": "2747 samples, 0.182029 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "lod/bvh/distance/sort=false/shadow=true",
            "value": 6602.866670758499,
            "range": "±0.63%",
            "unit": "ops/sec",
            "extra": "3302 samples, 0.151449 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/updateIndexArray/dirty=false",
            "value": 13107.895478353093,
            "range": "±0.13%",
            "unit": "ops/sec",
            "extra": "6544 samples, 0.076290 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/updateIndexArray/dirty=true",
            "value": 78508.0701499345,
            "range": "±0.12%",
            "unit": "ops/sec",
            "extra": "38715 samples, 0.012738 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/sortWithoutCulling",
            "value": 644.7318472719726,
            "range": "±0.97%",
            "unit": "ops/sec",
            "extra": "323 samples, 1.551032 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/empty",
            "value": 14505.530020833987,
            "range": "±0.08%",
            "unit": "ops/sec",
            "extra": "7253 samples, 0.068939 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "lod/getObjectLODIndex",
            "value": 4118.456328437517,
            "range": "±0.75%",
            "unit": "ops/sec",
            "extra": "2060 samples, 0.242809 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "sorting/radix/random/transparent=false",
            "value": 2515.7184565153943,
            "range": "±0.37%",
            "unit": "ops/sec",
            "extra": "823 samples, 0.397501 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "sorting/radix/sorted/transparent=false",
            "value": 2928.5196999728832,
            "range": "±1.56%",
            "unit": "ops/sec",
            "extra": "910 samples, 0.341469 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "sorting/radix/reverse/transparent=false",
            "value": 3191.2495686543516,
            "range": "±0.18%",
            "unit": "ops/sec",
            "extra": "1020 samples, 0.313357 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "sorting/radix/duplicates/transparent=false",
            "value": 4290.497552664968,
            "range": "±0.32%",
            "unit": "ops/sec",
            "extra": "1182 samples, 0.233073 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "sorting/radix/equal/transparent=false",
            "value": 3563.486632823969,
            "range": "±0.22%",
            "unit": "ops/sec",
            "extra": "1093 samples, 0.280624 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "sorting/radix/random/transparent=true",
            "value": 2568.3987553579773,
            "range": "±1.95%",
            "unit": "ops/sec",
            "extra": "836 samples, 0.389348 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "sorting/radix/sorted/transparent=true",
            "value": 3287.429864875193,
            "range": "±0.10%",
            "unit": "ops/sec",
            "extra": "1038 samples, 0.304189 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "sorting/radix/reverse/transparent=true",
            "value": 3226.6252270895566,
            "range": "±1.12%",
            "unit": "ops/sec",
            "extra": "1010 samples, 0.309921 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "sorting/radix/duplicates/transparent=true",
            "value": 4328.146714657416,
            "range": "±0.35%",
            "unit": "ops/sec",
            "extra": "1181 samples, 0.231046 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "sorting/radix/equal/transparent=true",
            "value": 3551.6677886854254,
            "range": "±0.19%",
            "unit": "ops/sec",
            "extra": "1082 samples, 0.281558 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "access/getPositionAndMaxScaleOnAxisAt",
            "value": 6307.764019412561,
            "range": "±0.44%",
            "unit": "ops/sec",
            "extra": "3152 samples, 0.158535 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "access/getMaxScaleOnAxisAt",
            "value": 6353.780524827213,
            "range": "±0.38%",
            "unit": "ops/sec",
            "extra": "3175 samples, 0.157387 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "access/applyMatrixAtToSphere",
            "value": 6024.219737006878,
            "range": "±0.07%",
            "unit": "ops/sec",
            "extra": "3010 samples, 0.165997 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "access/copyTo",
            "value": 1378.9820299495716,
            "range": "±0.27%",
            "unit": "ops/sec",
            "extra": "690 samples, 0.725173 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "access/setVisibilityAt",
            "value": 15188.324370524775,
            "range": "±0.08%",
            "unit": "ops/sec",
            "extra": "7579 samples, 0.065840 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "access/getVisibilityAt",
            "value": 12583.725575702301,
            "range": "±0.07%",
            "unit": "ops/sec",
            "extra": "6281 samples, 0.079468 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "access/setActiveAt",
            "value": 15318.86174653941,
            "range": "±0.07%",
            "unit": "ops/sec",
            "extra": "7644 samples, 0.065279 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "access/getActiveAt",
            "value": 12483.8460694446,
            "range": "±0.11%",
            "unit": "ops/sec",
            "extra": "6232 samples, 0.080104 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "access/setActiveAndVisibilityAt",
            "value": 15006.387935558454,
            "range": "±0.07%",
            "unit": "ops/sec",
            "extra": "7488 samples, 0.066638 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "access/getActiveAndVisibilityAt",
            "value": 11519.65336192768,
            "range": "±0.60%",
            "unit": "ops/sec",
            "extra": "5751 samples, 0.086808 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "access/setColorAt",
            "value": 11082.756662588226,
            "range": "±0.45%",
            "unit": "ops/sec",
            "extra": "5533 samples, 0.090230 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "access/setColorAt/hex",
            "value": 1803.722969796433,
            "range": "±0.25%",
            "unit": "ops/sec",
            "extra": "902 samples, 0.554409 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "access/getColorAt",
            "value": 13882.612900885619,
            "range": "±0.06%",
            "unit": "ops/sec",
            "extra": "6929 samples, 0.072033 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "access/setOpacityAt",
            "value": 11111.783377119287,
            "range": "±0.64%",
            "unit": "ops/sec",
            "extra": "5548 samples, 0.089995 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "access/getOpacityAt",
            "value": 9546.150612864263,
            "range": "±0.74%",
            "unit": "ops/sec",
            "extra": "4768 samples, 0.104754 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "access/getMatrixAt/defaultTarget",
            "value": 8150.494069998187,
            "range": "±0.44%",
            "unit": "ops/sec",
            "extra": "4071 samples, 0.122692 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "access/getPositionAt/defaultTarget",
            "value": 14006.793733716151,
            "range": "±0.08%",
            "unit": "ops/sec",
            "extra": "6991 samples, 0.071394 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "uniforms/getUniformAt/float",
            "value": 7287.688436747493,
            "range": "±0.21%",
            "unit": "ops/sec",
            "extra": "3644 samples, 0.137218 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "uniforms/setUniformAt/float",
            "value": 6088.110749647845,
            "range": "±0.13%",
            "unit": "ops/sec",
            "extra": "3045 samples, 0.164255 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "uniforms/getUniformAt/vec2",
            "value": 4471.692186595908,
            "range": "±0.76%",
            "unit": "ops/sec",
            "extra": "2236 samples, 0.223629 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "uniforms/setUniformAt/vec2",
            "value": 4343.50823668477,
            "range": "±0.48%",
            "unit": "ops/sec",
            "extra": "2172 samples, 0.230229 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "uniforms/getUniformAt/vec3",
            "value": 4561.995292019797,
            "range": "±0.23%",
            "unit": "ops/sec",
            "extra": "2281 samples, 0.219202 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "uniforms/setUniformAt/vec3",
            "value": 4396.0300070686935,
            "range": "±0.06%",
            "unit": "ops/sec",
            "extra": "2199 samples, 0.227478 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "uniforms/getUniformAt/vec4",
            "value": 4503.121233901138,
            "range": "±0.60%",
            "unit": "ops/sec",
            "extra": "2252 samples, 0.222068 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "uniforms/setUniformAt/vec4",
            "value": 4330.834226043153,
            "range": "±0.10%",
            "unit": "ops/sec",
            "extra": "2166 samples, 0.230902 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "uniforms/getUniformAt/mat3",
            "value": 4006.886277945141,
            "range": "±0.11%",
            "unit": "ops/sec",
            "extra": "2004 samples, 0.249570 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "uniforms/setUniformAt/mat3",
            "value": 3673.5731454969696,
            "range": "±0.09%",
            "unit": "ops/sec",
            "extra": "1837 samples, 0.272215 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "uniforms/getUniformAt/mat4",
            "value": 3469.1443841045807,
            "range": "±0.14%",
            "unit": "ops/sec",
            "extra": "1735 samples, 0.288256 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "uniforms/setUniformAt/mat4",
            "value": 3379.6173664815465,
            "range": "±0.11%",
            "unit": "ops/sec",
            "extra": "1690 samples, 0.295891 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "morph/getMorphAt/4-targets",
            "value": 9753.881743936887,
            "range": "±0.26%",
            "unit": "ops/sec",
            "extra": "4877 samples, 0.102523 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "morph/setMorphAt/4-targets",
            "value": 3298.162995770146,
            "range": "±0.67%",
            "unit": "ops/sec",
            "extra": "1650 samples, 0.303199 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "skeleton/setBonesAt/16-bones/update=false",
            "value": 360.9125855380788,
            "range": "±0.62%",
            "unit": "ops/sec",
            "extra": "181 samples, 2.770754 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "skeleton/setBonesAt/16-bones/update=true",
            "value": 154.51680646320477,
            "range": "±0.11%",
            "unit": "ops/sec",
            "extra": "78 samples, 6.471788 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bounds/computeBoundingBox/first-call",
            "value": 1008.7978148483612,
            "range": "±2.05%",
            "unit": "ops/sec",
            "extra": "317 samples, 0.991279 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bounds/computeBoundingSphere/first-call",
            "value": 2568.6909403519003,
            "range": "±1.09%",
            "unit": "ops/sec",
            "extra": "533 samples, 0.389303 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bounds/computeBoundingBox/dense",
            "value": 1072.7768413011297,
            "range": "±0.65%",
            "unit": "ops/sec",
            "extra": "537 samples, 0.932160 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bounds/computeBoundingSphere/dense",
            "value": 2702.1412294742927,
            "range": "±0.14%",
            "unit": "ops/sec",
            "extra": "1352 samples, 0.370077 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bounds/computeBoundingBox/sparse",
            "value": 2097.7997734013184,
            "range": "±0.54%",
            "unit": "ops/sec",
            "extra": "1049 samples, 0.476690 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bounds/computeBoundingSphere/sparse",
            "value": 5282.845666520002,
            "range": "±0.09%",
            "unit": "ops/sec",
            "extra": "2642 samples, 0.189292 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "raycast/linear/miss",
            "value": 8034690.193615564,
            "range": "±0.11%",
            "unit": "ops/sec",
            "extra": "1868531 samples, 0.000124 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "raycast/linear/hit",
            "value": 1736.0970929664811,
            "range": "±0.30%",
            "unit": "ops/sec",
            "extra": "868 samples, 0.576005 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "raycast/bvh/miss",
            "value": 7106903.640031885,
            "range": "±0.27%",
            "unit": "ops/sec",
            "extra": "1768262 samples, 0.000141 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "raycast/bvh/hit",
            "value": 254399.56035640376,
            "range": "±7.86%",
            "unit": "ops/sec",
            "extra": "121386 samples, 0.003931 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bvh/query/raycast",
            "value": 1040174.3959264385,
            "range": "±0.75%",
            "unit": "ops/sec",
            "extra": "453559 samples, 0.000961 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bvh/query/intersectBox",
            "value": 76441.52901963159,
            "range": "±0.15%",
            "unit": "ops/sec",
            "extra": "37830 samples, 0.013082 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/setMatrixIdentity/bvh=false",
            "value": 7251.318059716494,
            "range": "±0.19%",
            "unit": "ops/sec",
            "extra": "3621 samples, 0.137906 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/updateMatrix/bvh=false",
            "value": 5861.817361343193,
            "range": "±0.10%",
            "unit": "ops/sec",
            "extra": "2928 samples, 0.170596 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/updateMatrixPosition/bvh=false",
            "value": 7949.264043556167,
            "range": "±0.51%",
            "unit": "ops/sec",
            "extra": "3969 samples, 0.125798 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/copyTo/bvh=false",
            "value": 3341.99146597713,
            "range": "±0.44%",
            "unit": "ops/sec",
            "extra": "1670 samples, 0.299223 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/applyMatrix4/bvh=false",
            "value": 1662.986878714439,
            "range": "±0.22%",
            "unit": "ops/sec",
            "extra": "797 samples, 0.601328 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/applyQuaternion/bvh=false",
            "value": 10669.716918413294,
            "range": "±0.20%",
            "unit": "ops/sec",
            "extra": "3868 samples, 0.093723 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/rotateOnAxis/bvh=false",
            "value": 10122.588557464605,
            "range": "±0.12%",
            "unit": "ops/sec",
            "extra": "3736 samples, 0.098789 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/rotateOnWorldAxis/bvh=false",
            "value": 9719.80441554903,
            "range": "±0.50%",
            "unit": "ops/sec",
            "extra": "3556 samples, 0.102883 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/rotateX/bvh=false",
            "value": 10093.851958976235,
            "range": "±0.11%",
            "unit": "ops/sec",
            "extra": "3730 samples, 0.099070 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/rotateY/bvh=false",
            "value": 10191.54606532538,
            "range": "±0.12%",
            "unit": "ops/sec",
            "extra": "3756 samples, 0.098121 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/rotateZ/bvh=false",
            "value": 9327.029431287487,
            "range": "±1.02%",
            "unit": "ops/sec",
            "extra": "3423 samples, 0.107215 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/translateOnAxis/bvh=false",
            "value": 8334.423138174487,
            "range": "±0.21%",
            "unit": "ops/sec",
            "extra": "3419 samples, 0.119984 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/translateX/bvh=false",
            "value": 8381.191842654225,
            "range": "±0.09%",
            "unit": "ops/sec",
            "extra": "3441 samples, 0.119315 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/translateY/bvh=false",
            "value": 8370.27370086226,
            "range": "±0.13%",
            "unit": "ops/sec",
            "extra": "3421 samples, 0.119470 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/translateZ/bvh=false",
            "value": 8444.996071575199,
            "range": "±0.12%",
            "unit": "ops/sec",
            "extra": "3466 samples, 0.118413 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/matrix/bvh=false",
            "value": 3960.6395840921987,
            "range": "±0.14%",
            "unit": "ops/sec",
            "extra": "1979 samples, 0.252484 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/matrixWorld/bvh=false",
            "value": 2511.3068036985246,
            "range": "±1.04%",
            "unit": "ops/sec",
            "extra": "1255 samples, 0.398199 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/visible/get/bvh=false",
            "value": 10709.176533912614,
            "range": "±0.11%",
            "unit": "ops/sec",
            "extra": "5346 samples, 0.093378 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/visible/set/bvh=false",
            "value": 13328.099593684074,
            "range": "±0.10%",
            "unit": "ops/sec",
            "extra": "6649 samples, 0.075029 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/active/get/bvh=false",
            "value": 9149.0733602619,
            "range": "±0.20%",
            "unit": "ops/sec",
            "extra": "4566 samples, 0.109301 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/active/set/bvh=false",
            "value": 12981.57066057903,
            "range": "±0.11%",
            "unit": "ops/sec",
            "extra": "6475 samples, 0.077032 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/color/get/bvh=false",
            "value": 6382.052516469727,
            "range": "±2.74%",
            "unit": "ops/sec",
            "extra": "3187 samples, 0.156689 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/color/set/bvh=false",
            "value": 6280.879760461445,
            "range": "±1.23%",
            "unit": "ops/sec",
            "extra": "3134 samples, 0.159213 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/opacity/get/bvh=false",
            "value": 6912.308844068483,
            "range": "±2.90%",
            "unit": "ops/sec",
            "extra": "3452 samples, 0.144669 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/opacity/set/bvh=false",
            "value": 8491.822121886351,
            "range": "±0.25%",
            "unit": "ops/sec",
            "extra": "4239 samples, 0.117760 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/getUniform/bvh=false",
            "value": 5754.030672960124,
            "range": "±0.15%",
            "unit": "ops/sec",
            "extra": "2874 samples, 0.173791 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/setUniform/bvh=false",
            "value": 6484.2136312180455,
            "range": "±0.29%",
            "unit": "ops/sec",
            "extra": "3238 samples, 0.154221 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/morph/set/bvh=false",
            "value": 3132.8846765065528,
            "range": "±2.39%",
            "unit": "ops/sec",
            "extra": "1566 samples, 0.319195 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/updateBones/bvh=false",
            "value": 329.6352197324707,
            "range": "±1.98%",
            "unit": "ops/sec",
            "extra": "165 samples, 3.033656 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/updateMatrix/bvh=true",
            "value": 1982.369021958483,
            "range": "±1.58%",
            "unit": "ops/sec",
            "extra": "991 samples, 0.504447 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/updateMatrixPosition/bvh=true",
            "value": 2175.627110567699,
            "range": "±0.24%",
            "unit": "ops/sec",
            "extra": "1088 samples, 0.459638 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "entity/remove",
            "value": 6243.793695372365,
            "range": "±3.83%",
            "unit": "ops/sec",
            "extra": "178 samples, 0.160159 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "lifecycle/constructor",
            "value": 8171.389239969204,
            "range": "±20.68%",
            "unit": "ops/sec",
            "extra": "648 samples, 0.122378 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "lifecycle/clearInstances",
            "value": 2729168.0203174646,
            "range": "±32.84%",
            "unit": "ops/sec",
            "extra": "881 samples, 0.000366 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "lifecycle/addInstances/reuse",
            "value": 4823.241388344863,
            "range": "±1.95%",
            "unit": "ops/sec",
            "extra": "567 samples, 0.207329 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "lifecycle/initUniformsPerInstance",
            "value": 19611.738264459385,
            "range": "±50.70%",
            "unit": "ops/sec",
            "extra": "712 samples, 0.050990 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "lifecycle/initSkeleton",
            "value": 2385.911623837395,
            "range": "±12.61%",
            "unit": "ops/sec",
            "extra": "380 samples, 0.419127 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "lifecycle/resizeBuffers/allTextures",
            "value": 485.4820017313039,
            "range": "±12.82%",
            "unit": "ops/sec",
            "extra": "42 samples, 2.059809 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "lifecycle/bvh/insertRange",
            "value": 35.823161176929545,
            "range": "±6.51%",
            "unit": "ops/sec",
            "extra": "32 samples, 27.914901 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "lifecycle/bvh/insert",
            "value": 34.90203789258399,
            "range": "±7.10%",
            "unit": "ops/sec",
            "extra": "32 samples, 28.651622 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "lifecycle/bvh/delete",
            "value": 799.6573515282826,
            "range": "±7.23%",
            "unit": "ops/sec",
            "extra": "68 samples, 1.250536 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "lifecycle/bvh/clear",
            "value": 97437.07644269265,
            "range": "±15.64%",
            "unit": "ops/sec",
            "extra": "89 samples, 0.010263 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "lifecycle/bvh/create",
            "value": 196.1332962534514,
            "range": "±31.89%",
            "unit": "ops/sec",
            "extra": "44 samples, 5.098573 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bvh/move/relocation",
            "value": 64.44343540792941,
            "range": "±10.08%",
            "unit": "ops/sec",
            "extra": "32 samples, 15.517484 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bvh/computeBVH/sphere=false/sparse",
            "value": 295.7411741312672,
            "range": "±20.09%",
            "unit": "ops/sec",
            "extra": "122 samples, 3.381335 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bvh/computeBVH/sphere=true/sparse",
            "value": 264.71281295416946,
            "range": "±22.58%",
            "unit": "ops/sec",
            "extra": "115 samples, 3.777679 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bvh/frustumCulling/margin/accurate=false",
            "value": 8822.071626635001,
            "range": "±0.23%",
            "unit": "ops/sec",
            "extra": "4403 samples, 0.113352 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "bvh/frustumCulling/margin/accurate=true",
            "value": 6382.43946141084,
            "range": "±0.24%",
            "unit": "ops/sec",
            "extra": "3187 samples, 0.156680 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "texture/enqueueUpdate/partial=false",
            "value": 12345.243568170763,
            "range": "±0.35%",
            "unit": "ops/sec",
            "extra": "6149 samples, 0.081003 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "texture/enqueueUpdate/partial=true",
            "value": 9463.420185056457,
            "range": "±0.06%",
            "unit": "ops/sec",
            "extra": "4719 samples, 0.105670 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/frustumCullingAlreadyPerformed/cached=false",
            "value": 9667.092666022929,
            "range": "±0.73%",
            "unit": "ops/sec",
            "extra": "4834 samples, 0.103444 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/frustumCullingAlreadyPerformed/cached=true",
            "value": 11951.15378661086,
            "range": "±0.09%",
            "unit": "ops/sec",
            "extra": "5976 samples, 0.083674 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "matrices/updateMatrixWorld",
            "value": 4506.3240530195335,
            "range": "±0.31%",
            "unit": "ops/sec",
            "extra": "2254 samples, 0.221910 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "sorting/createRadixSort/factory",
            "value": 268067.4477799504,
            "range": "±4.16%",
            "unit": "ops/sec",
            "extra": "134034 samples, 0.003730 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "lifecycle/createInstancedMesh2From/colors=false",
            "value": 3171.114016112913,
            "range": "±7.94%",
            "unit": "ops/sec",
            "extra": "1586 samples, 0.315347 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "lifecycle/createInstancedMesh2From/colors=true",
            "value": 2685.885017261205,
            "range": "±8.17%",
            "unit": "ops/sec",
            "extra": "1343 samples, 0.372317 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          },
          {
            "name": "frustum/movingCamera",
            "value": 6590.359063718867,
            "range": "±2.56%",
            "unit": "ops/sec",
            "extra": "3282 samples, 0.151737 ms/batch; count=10000; Node=v24.21.0; linux/x64"
          }
        ]
      }
    ]
  }
}