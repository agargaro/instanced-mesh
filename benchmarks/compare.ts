export type BenchmarkResult = { name: string; unit: string; value: number; rme?: number; count?: number; context?: string };
type ComparisonResult = { name: string; before: number; after: number; change: number; ratio: number; alert: boolean; confirmed: boolean };

export function compareResults(before: BenchmarkResult[], after: BenchmarkResult[], threshold = 1.1): ComparisonResult[] {
  if (!Number.isFinite(threshold) || threshold <= 1) throw new Error('Threshold must be finite and greater than one');
  const validate = (results: BenchmarkResult[]): Map<string, BenchmarkResult> => {
    if (!Array.isArray(results) || results.length === 0) throw new Error('Missing benchmark results');
    const names = new Set();
    for (const result of results) {
      if (!result || typeof result.name !== 'string' || !result.name || names.has(result.name) || result.unit !== 'ops/sec' || !Number.isFinite(result.value) || result.value <= 0 || (result.rme !== undefined && (!Number.isFinite(result.rme) || result.rme < 0)) || (result.count !== undefined && (!Number.isSafeInteger(result.count) || result.count < 1))) {
        throw new Error('Invalid benchmark result: ' + result?.name);
      }
      names.add(result.name);
      if (result.context !== undefined && (typeof result.context !== 'string' || !result.context)) throw new Error('Invalid benchmark context');
    }
    return new Map(results.map((result) => [result.name, result]));
  };
  const baseline = validate(before);
  const current = validate(after);
  if (baseline.size !== current.size || [...baseline.keys()].some((name) => !current.has(name))) {
    throw new Error('Baseline and current benchmark names must match');
  }
  return after.map((result) => {
    const previous = baseline.get(result.name)!;
    if (previous.count !== result.count) throw new Error('Benchmark counts must match: ' + result.name);
    if (previous.context !== result.context) throw new Error('Benchmark fixtures, settings and runtime must match: ' + result.name);
    const ratio = previous.value / result.value;
    const lowerRatio = previous.rme === undefined || result.rme === undefined ? 0 : ratio * Math.max(0, 1 - result.rme / 100) / (1 + previous.rme / 100);
    return { name: result.name, before: previous.value, after: result.value, change: (result.value / previous.value - 1) * 100, ratio, alert: ratio > threshold, confirmed: lowerRatio > threshold };
  });
}

export function compareRounds(before: BenchmarkResult[][], after: BenchmarkResult[][], threshold = 1.1): ComparisonResult[] {
  if (before.length !== after.length || before.length < 3) throw new Error('At least three paired rounds are required');
  const rounds = before.map((results, i) => compareResults(results, after[i], threshold));
  if ([...before, ...after].some((round) => round.some((result) => result.rme === undefined || result.count === undefined || result.context === undefined))) {
    throw new Error('Paired benchmark gate requires uncertainty, population and context metadata');
  }
  const names = rounds[0].map((result) => result.name);
  for (let i = 1; i < rounds.length; i++) {
    compareResults(before[0], before[i], threshold);
    compareResults(after[0], after[i], threshold);
  }
  const median = (values: number[]): number => {
    values.sort((a, b) => a - b);
    const middle = Math.floor(values.length / 2);
    return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
  };
  return names.map((name) => {
    const results = rounds.map((round) => round.find((result) => result.name === name)!);
    const base = median(results.map((result) => result.before));
    const current = median(results.map((result) => result.after));
    const ratio = median(results.map((result) => result.ratio));
    return { name, before: base, after: current, ratio, change: (1 / ratio - 1) * 100, alert: ratio > threshold, confirmed: results.every((result) => result.confirmed) };
  });
}
