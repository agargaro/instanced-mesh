import { appendFileSync, readFileSync } from 'node:fs';

type BenchmarkResult = { name: string; unit: string; value: number };
type ComparisonResult = { name: string; before: number; after: number; change: number; ratio: number; alert: boolean };

export function compareResults(before: BenchmarkResult[], after: BenchmarkResult[], threshold = 1.15): ComparisonResult[] {
  const validate = (results: BenchmarkResult[]): Map<string, BenchmarkResult> => {
    if (!Array.isArray(results) || results.length === 0) throw new Error('Missing benchmark results');
    const names = new Set();
    for (const result of results) {
      if (typeof result.name !== 'string' || names.has(result.name) || result.unit !== 'ops/sec' || !Number.isFinite(result.value) || result.value <= 0) {
        throw new Error('Invalid benchmark result: ' + result.name);
      }
      names.add(result.name);
    }
    return new Map(results.map((result) => [result.name, result]));
  };
  const baseline = validate(before);
  const current = validate(after);
  if (baseline.size !== current.size || [...baseline.keys()].some((name) => !current.has(name))) {
    throw new Error('Baseline and current benchmark names must match');
  }
  return after.map((result) => {
    const previous = baseline.get(result.name);
    const ratio = previous.value / result.value;
    return { name: result.name, before: previous.value, after: result.value, change: (result.value / previous.value - 1) * 100, ratio, alert: ratio > threshold };
  });
}

const scriptIndex = process.argv.findIndex((argument) => argument.replaceAll('\\', '/').endsWith('benchmarks/compare.ts'));
if (scriptIndex !== -1) {
  const before = JSON.parse(readFileSync(process.argv[scriptIndex + 1], 'utf8'));
  const after = JSON.parse(readFileSync(process.argv[scriptIndex + 2], 'utf8'));
  const results = compareResults(before, after);
  const rows = results.map((result) => `| ${result.name} | ${result.before.toFixed(0)} | ${result.after.toFixed(0)} | ${result.change.toFixed(1)}% | ${result.alert ? 'Warning' : 'OK'} |`);
  const summary = ['## CPU benchmark comparison', '', 'Base and PR use the same runner, dependencies and benchmark suite. Higher ops/sec is better; warnings use a baseline/current ratio above 1.15.', '', '| Benchmark | Base ops/sec | PR ops/sec | Change | Result |', '|---|---:|---:|---:|---|', ...rows, ''].join('\n');
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  for (const result of results.filter((result) => result.alert)) {
    const name = result.name.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
    console.log(`::warning::${name}: ${result.ratio.toFixed(2)}x slower (${result.before.toFixed(0)} -> ${result.after.toFixed(0)} ops/sec)`);
  }
}
