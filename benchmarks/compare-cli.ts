import { appendFileSync, readFileSync } from 'node:fs';
import { compareResults } from './compare.js';

const before = JSON.parse(readFileSync(new URL('./before.json', import.meta.url), 'utf8'));
const after = JSON.parse(readFileSync(new URL('./results.json', import.meta.url), 'utf8'));
const results = compareResults(before, after);
const rows = results.map((result) => `| ${result.name} | ${result.before.toFixed(0)} | ${result.after.toFixed(0)} | ${result.change.toFixed(1)}% | ${result.alert ? 'Warning' : 'OK'} |`);
const summary = ['## CPU benchmark comparison', '', 'Base and PR use the same runner, dependencies and benchmark suite. Higher ops/sec is better; warnings use a baseline/current ratio above 1.15.', '', '| Benchmark | Base ops/sec | PR ops/sec | Change | Result |', '|---|---:|---:|---:|---|', ...rows, ''].join('\n');
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
for (const result of results.filter((result) => result.alert)) {
  const name = result.name.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
  console.log(`::warning::${name}: ${result.ratio.toFixed(2)}x slower (${result.before.toFixed(0)} -> ${result.after.toFixed(0)} ops/sec)`);
}
