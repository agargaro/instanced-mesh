import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function benchmarkContext(time: number, iterations: number, warmupTime: number, warmupIterations: number): string {
  const directory = new URL('./', import.meta.url);
  const hash = createHash('sha256');
  const sources = readdirSync(directory, { recursive: true, encoding: 'utf8' }).filter((file) => file.endsWith('.ts')).sort();
  for (const file of sources) {
    hash.update(file.replaceAll('\\', '/'));
    hash.update(readFileSync(fileURLToPath(new URL(file.replaceAll('\\', '/'), directory))));
  }
  const version = (name: string): string => JSON.parse(readFileSync(new URL(`../node_modules/${name}/package.json`, import.meta.url), 'utf8')).version;
  return JSON.stringify({ fixtureHash: hash.digest('hex'), node: process.version, platform: process.platform, arch: process.arch, three: version('three'), tinybench: version('tinybench'), time, iterations, warmupTime, warmupIterations });
}

export function measurement(name: string, latency: { mean: number; rme: number; samplesCount: number }, count: number, minimumSamples: number): { name: string; unit: string; value: number; latency: number; rme: number; samples: number; count: number; range: string } {
  const value = 1000 / latency.mean;
  if (!name || !Number.isFinite(value) || value <= 0 || !Number.isFinite(latency.rme) || latency.rme < 0 || !Number.isSafeInteger(minimumSamples) || minimumSamples < 1 || !Number.isSafeInteger(latency.samplesCount) || latency.samplesCount < minimumSamples || !Number.isSafeInteger(count) || count < 1) {
    throw new Error('Invalid benchmark statistics: ' + name);
  }
  return { name, unit: 'ops/sec', value, latency: latency.mean, rme: latency.rme, samples: latency.samplesCount, count, range: `±${latency.rme.toFixed(2)}%` };
}
