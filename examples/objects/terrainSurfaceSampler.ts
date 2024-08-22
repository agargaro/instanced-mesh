import { BufferAttribute, InterleavedBufferAttribute, Mesh, PlaneGeometry, Triangle, Vector3, Vector4 } from 'three';

export class TerrainSurfaceSampler {
    public indexAttribute: BufferAttribute;
    public positionAttribute: BufferAttribute | InterleavedBufferAttribute;
    protected _widthSegments: number;
    protected _totalFaces: number;
    protected _tileSize: number;

    constructor(terrain: Mesh) {
        const geometry = terrain.geometry as PlaneGeometry;
        this.indexAttribute = geometry.index;
        this.positionAttribute = geometry.getAttribute('position');

        const params = geometry.parameters;
        this._widthSegments = params.widthSegments;
        const heightSegments = params.heightSegments;

        this._totalFaces = this._widthSegments * heightSegments * 2;
        this._tileSize = 1 / (this._totalFaces);
    }

    public sample(targetPosition: Vector3): void {
        // we can also get normal
        const faceIndex = Math.floor(Math.random() * this._totalFaces);
        return this.sampleFace(faceIndex, targetPosition);
    }

    public sampleTile(area: Vector4, targetPosition: Vector3): void {
        const widthSegments = this._widthSegments;
        const rowStart = area.x;
        const rowCount = area.z;
        const colStart = area.y;
        const colCount = area.w;
        const row = rowStart + Math.floor(Math.random() * rowCount);
        const col = colStart + Math.floor(Math.random() * colCount);
        const faceIndex = ((widthSegments * row * 2 + col * 2) + Math.round(Math.random()));
        return this.sampleFace(faceIndex, targetPosition);
    }

    protected sampleFace(faceIndex: number, targetPosition: Vector3): void {
        let u = Math.random();
        let v = Math.random();

        if (u + v > 1) {
            u = 1 - u;
            v = 1 - v;
        }

        const indexAttr = this.indexAttribute;
        const positionAttr = this.positionAttribute;
        
        let i0 = faceIndex * 3;
        let i1 = faceIndex * 3 + 1;
        let i2 = faceIndex * 3 + 2;

        if (indexAttr) {
            i0 = indexAttr.getX(i0);
            i1 = indexAttr.getX(i1);
            i2 = indexAttr.getX(i2);
        }

        _face.a.fromBufferAttribute(positionAttr, i0);
        _face.b.fromBufferAttribute(positionAttr, i1);
        _face.c.fromBufferAttribute(positionAttr, i2);

        targetPosition.set(0, 0, 0)
            .addScaledVector(_face.a, u)
            .addScaledVector(_face.b, v)
            .addScaledVector(_face.c, 1 - (u + v));
    }
}

const _face = new Triangle();
