import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Bench } from 'tinybench';
import { registerBVHBenchmarks } from './core/bvh.bench.js';
import { registerInstancesBenchmarks } from './core/instances.bench.js';
import { registerMatricesBenchmarks } from './core/matrices.bench.js';
import { registerSortingBenchmarks } from './core/sorting.bench.js';

const time = Number(process.env.BENCH_TIME ?? 500);
const iterations = Number(process.env.BENCH_ITERATIONS ?? 32);

const bench = new Bench({
  name: 'instanced-mesh',
  time,
  iterations,
  warmup: true,
  warmupIterations: 8,
  warmupTime: 100,
  retainSamples: true
});

registerInstancesBenchmarks(bench);
registerMatricesBenchmarks(bench);
registerBVHBenchmarks(bench);
registerSortingBenchmarks(bench);

await bench.run();

console.table(bench.table());

const results = bench.tasks
  .map((task) => ({ task, result: task.result as any }))
  .filter(({ result }) => result && result.throughput && typeof result.throughput.mean === 'number')
  .map(({ task, result }) => {
    return {
      name: task.name,
      unit: 'ops/sec',
      value: Number(result.throughput.mean.toFixed(4)),
      range: `±${result.throughput.rme.toFixed(2)}%`,
      extra: `${result.throughput.samplesCount} samples, ${result.latency.mean.toFixed(4)} ms/op`
    };
  });

const outputIndex = process.argv.indexOf('--output');
const outputPath = outputIndex !== -1
  ? process.argv[outputIndex + 1]
  : process.env.BENCH_OUTPUT ?? fileURLToPath(new URL('./results.json', import.meta.url));

writeFileSync(outputPath, `${JSON.stringify(results, null, 2)}\n`);
console.log(`\nWrote ${results.length} results to ${outputPath}`);
