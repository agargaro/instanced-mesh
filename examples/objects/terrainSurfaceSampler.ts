import { BufferAttribute, InterleavedBufferAttribute, Mesh, PlaneGeometry, Triangle, Vector3 } from 'three';

const _face = new Triangle();

export class TerrainSurfaceSampler {
    public distribution: Float32Array = null;
    public geometry: PlaneGeometry;
    public indexAttribute: BufferAttribute;
    public positionAttribute: BufferAttribute | InterleavedBufferAttribute;
    public randomFunction: () => number;

    constructor(mesh: Mesh) {
        this.geometry = mesh.geometry as PlaneGeometry;
        this.indexAttribute = this.geometry.index;
        this.positionAttribute = this.geometry.getAttribute('position');
        this.randomFunction = Math.random;

    }

    public build(): this {
        const indexAttribute = this.indexAttribute;
        const positionAttribute = this.positionAttribute;

        const totalFaces = indexAttribute ? (indexAttribute.count / 3) : (positionAttribute.count / 3);

        const params = this.geometry.parameters;
        const widthSegments = params.widthSegments;
        const heightSegments = params.widthSegments;
        const tileSize = 1 / (widthSegments * heightSegments * 2);

        const distribution = new Float32Array(totalFaces);
        let cumulativeTotal = 0;

        for (let i = 0; i < totalFaces; i++) {
            cumulativeTotal += tileSize;
            distribution[i] = cumulativeTotal;
        }

        this.distribution = distribution;
        return this;
    }

    public sample(targetPosition: Vector3): void {
        const faceIndex = this.sampleFaceIndex();
        return this.sampleFace(faceIndex, targetPosition);
    }

    protected sampleFaceIndex(): number {
        const cumulativeTotal = this.distribution[this.distribution.length - 1];
        return this.binarySearch(this.randomFunction() * cumulativeTotal);
    }

    protected binarySearch(x: number): number {
        const dist = this.distribution;
        let start = 0;
        let end = dist.length - 1;

        let index = - 1;

        while (start <= end) {
            const mid = Math.ceil((start + end) / 2);
            if (mid === 0 || dist[mid - 1] <= x && dist[mid] > x) {
                index = mid;
                break;
            } else if (x < dist[mid]) {
                end = mid - 1;
            } else {
                start = mid + 1;
            }
        }

        return index;
    }

    sampleFace(faceIndex: number, targetPosition: Vector3): void {
        let u = this.randomFunction();
        let v = this.randomFunction();

        if (u + v > 1) {
            u = 1 - u;
            v = 1 - v;
        }

        // get the vertex attribute indices
        const indexAttribute = this.indexAttribute;
        let i0 = faceIndex * 3;
        let i1 = faceIndex * 3 + 1;
        let i2 = faceIndex * 3 + 2;
        if (indexAttribute) {

            i0 = indexAttribute.getX(i0);
            i1 = indexAttribute.getX(i1);
            i2 = indexAttribute.getX(i2);

        }

        _face.a.fromBufferAttribute(this.positionAttribute, i0);
        _face.b.fromBufferAttribute(this.positionAttribute, i1);
        _face.c.fromBufferAttribute(this.positionAttribute, i2);

        targetPosition
            .set(0, 0, 0)
            .addScaledVector(_face.a, u)
            .addScaledVector(_face.b, v)
            .addScaledVector(_face.c, 1 - (u + v));
    }
}
