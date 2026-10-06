import { Bench } from 'tinybench';

export const BENCHMARK_SHARDS = ['instances', 'spatial', 'access', 'lifecycle'] as const;
type BenchmarkShard = typeof BENCHMARK_SHARDS[number];

export function benchmarkShard(name: string): BenchmarkShard {
  switch (name.split('/')[0]) {
    case 'instances':
    case 'matrices':
    case 'entity':
      return 'instances';
    case 'frustum':
    case 'lod':
    case 'sorting':
      return 'spatial';
    case 'access':
    case 'uniforms':
    case 'morph':
    case 'skeleton':
    case 'bounds':
    case 'raycast':
      return 'access';
    case 'lifecycle':
    case 'texture':
      return 'lifecycle';
    case 'bvh':
      if (name.startsWith('bvh/frustum')) return 'spatial';
      if (name.startsWith('bvh/query/')) return 'access';
      return 'lifecycle';
    default:
      throw new Error('Unassigned benchmark: ' + name);
  }
}

export function selectBenchmarks(bench: Bench, shard = 'all', filter = ''): void {
  if (shard !== 'all' && !BENCHMARK_SHARDS.includes(shard as BenchmarkShard)) throw new Error('Invalid BENCH_SHARD: ' + shard);
  for (const task of bench.tasks) {
    const group = benchmarkShard(task.name);
    if ((shard !== 'all' && group !== shard) || !task.name.includes(filter)) bench.remove(task.name);
  }
  if (bench.tasks.length === 0) throw new Error('No benchmarks selected');
}
