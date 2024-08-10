export class PRNG {
    protected _seed: number;

    constructor(seed: number) {
        this._seed = seed;
    }

    public next(): number {
        let t = (this._seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    public range(min: number, max: number): number {
        return min + (max - min) * this.next();
    }
}
