import { appendFileSync, readFileSync } from 'node:fs';
import { BenchmarkResult, compareResults, compareRounds } from './compare.js';

const threshold = Number(process.env.BENCH_THRESHOLD ?? 1.1);
const rounds = Number(process.env.BENCH_ROUNDS ?? 1);
if (!Number.isSafeInteger(rounds) || rounds < 1) throw new Error('Invalid BENCH_ROUNDS');
const read = (name: string): BenchmarkResult[] => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const results = rounds === 1
  ? compareResults(read('./before.json'), read('./results.json'), threshold)
  : compareRounds(Array.from({ length: rounds }, (_, i) => read(`./before-${i}.json`)), Array.from({ length: rounds }, (_, i) => read(`./after-${i}.json`)), threshold);
const rows = results.map((result) => `| ${result.name} | ${result.before.toFixed(0)} | ${result.after.toFixed(0)} | ${result.ratio.toFixed(3)}x | ${result.confirmed && rounds >= 3 ? 'Regression' : result.alert ? 'Warning / uncertain' : 'OK'} |`);
const summary = ['## CPU benchmark comparison', '', `Base and PR use the same runner, dependencies and suite. ${rounds} paired rounds; higher batches/sec is better. Threshold: ${threshold}x latency (+${((threshold - 1) * 100).toFixed(0)}%). Throughputs and paired ratios are summarized independently using medians. The job fails only when every round exceeds the threshold even after accounting for both latency margins of error. These are CPU measurements, not GPU/frame timings.`, '', '| Benchmark | Base batches/sec | PR batches/sec | Paired latency ratio | Result |', '|---|---:|---:|---:|---|', ...rows, ''].join('\n');
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
for (const result of results.filter((result) => result.alert)) {
  const name = result.name.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
  console.log(`::warning::${name}: ${result.ratio.toFixed(2)}x latency (${result.before.toFixed(0)} -> ${result.after.toFixed(0)} batches/sec)`);
}
if (rounds >= 3 && results.some((result) => result.confirmed)) process.exitCode = 1;
