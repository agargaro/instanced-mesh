export class PRNG {
    constructor(seed) {
        this._seed = seed;
    }
    next() {
        let t = (this._seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    range(min, max) {
        return min + (max - min) * this.next();
    }
}
