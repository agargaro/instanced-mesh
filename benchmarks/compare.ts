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
