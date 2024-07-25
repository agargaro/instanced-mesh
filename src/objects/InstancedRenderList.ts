export type InstancedRenderItem = { index: number, depth: number };

export class InstancedRenderList {
    public list: InstancedRenderItem[] = [];
    protected pool: InstancedRenderItem[] = [];

    public push(depth: number, index: number) {
        const pool = this.pool;
        const count = this.list.length;

        if (count >= pool.length) {
            pool.push({ depth: null, index: null });
        }

        const item = pool[count];
        item.depth = depth;
        item.index = index;

        this.list.push(item);
    }

    public reset(): void {
        this.list.length = 0;
    }
}
