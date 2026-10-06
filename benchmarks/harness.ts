import { Bench, BenchOptions, Fn, FnOptions } from 'tinybench';

export class FixtureBench extends Bench {
  private clock: () => number;

  constructor(options: BenchOptions, clock: () => number = (): number => performance.now()) {
    super(options);
    this.clock = clock;
  }

  public override add(name: string, fn: Fn, options: FnOptions = {}): this {
    if (!options.beforeEach) return super.add(name, fn, { ...options, async: false });
    const clock = this.clock;
    const beforeEach = options.beforeEach;
    let fixtureStart = 0;
    return super.add(name, () => {
      const start = clock();
      const value = fn();
      const end = clock();
      if (value instanceof Promise) throw new Error('CPU fixtures must be synchronous');
      return { overriddenDuration: end - start, overriddenIterationCost: end - fixtureStart };
    }, {
      ...options,
      async: false,
      beforeEach: function (mode): void {
        fixtureStart = clock();
        const value = beforeEach.call(this, mode);
        if (value instanceof Promise) throw new Error('CPU fixture hooks must be synchronous');
      }
    });
  }
}
