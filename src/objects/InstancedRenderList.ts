export type InstancedRenderItem = { index: number, depth: number, depthSort: number };

export class InstancedRenderList {
    public list: InstancedRenderItem[] = [];
    protected pool: InstancedRenderItem[] = [];

    public push(depth: number, index: number): void {
        const pool = this.pool;
        const list = this.list;
        const count = list.length;

        if (count >= pool.length) {
            pool.push({ depth: null, index: null, depthSort: null });
        }

        const item = pool[count];
        item.depth = depth;
        item.index = index;

        list.push(item);
    }

    public reset(): void {
        this.list.length = 0;
    }
}
