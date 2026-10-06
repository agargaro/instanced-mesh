import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { FixtureBench } from './harness.js';
import { registerBenchmarks } from './suite.js';
import { selectBenchmarks } from './shards.js';
import { benchmarkContext, measurement } from './results.js';

const time = Number(process.env.BENCH_TIME ?? 500);
const iterations = Number(process.env.BENCH_ITERATIONS ?? 32);
const warmupTime = Number(process.env.BENCH_WARMUP_TIME ?? 100);
const warmupIterations = Number(process.env.BENCH_WARMUP_ITERATIONS ?? 8);
if (!Number.isFinite(time) || time < 0 || !Number.isSafeInteger(iterations) || iterations < 1 || !Number.isFinite(warmupTime) || warmupTime < 0 || !Number.isSafeInteger(warmupIterations) || warmupIterations < 1) throw new Error('Invalid benchmark time or iterations');
const outputIndex = process.argv.indexOf('--output');
const outputPath = outputIndex !== -1
  ? process.argv[outputIndex + 1]
  : process.env.BENCH_OUTPUT ?? fileURLToPath(new URL('./results.json', import.meta.url));
if (!outputPath || outputPath.startsWith('--')) throw new Error('--output requires a path');

const bench = new FixtureBench({
  name: 'instanced-mesh',
  time,
  iterations,
  warmup: true,
  warmupIterations,
  warmupTime,
  retainSamples: false
});

registerBenchmarks(bench);
selectBenchmarks(bench, process.env.BENCH_SHARD ?? 'all', process.env.BENCH_FILTER ?? '');
const context = benchmarkContext(time, iterations, warmupTime, warmupIterations);

await bench.run();

const failures = bench.tasks.filter((task) => {
  const result = task.result as any;
  return result.state !== 'completed' || !Number.isFinite(result.latency?.mean) || result.latency.mean <= 0;
});
if (failures.length) throw new AggregateError(failures.map((task) => new Error('Benchmark failed: ' + task.name, { cause: (task.result as any).error })), 'Invalid benchmark measurements');

const results = bench.tasks
  .map((task) => ({ task, result: task.result as any }))
  .map(({ task, result }) => {
    return {
      ...measurement(task.name, result.latency, Number(process.env.BENCH_COUNT ?? 1000), iterations),
      context,
      extra: `${result.latency.samplesCount} samples, ${result.latency.mean.toFixed(6)} ms/batch; count=${process.env.BENCH_COUNT ?? 1000}; Node=${process.version}; ${process.platform}/${process.arch}`
    };
  });

console.table(results.map(({ name, value, latency, rme, samples }) => ({ name, 'batches/sec': Math.round(value), 'ms/batch': Number(latency.toFixed(6)), 'RME %': Number(rme.toFixed(2)), samples })));

writeFileSync(outputPath, `${JSON.stringify(results, null, 2)}\n`);
console.log(`\nWrote ${results.length} results to ${outputPath}`);
