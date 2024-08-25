import { BufferAttribute, BufferGeometry, Vector3 } from 'three';

export interface GrassGeometryParameters {
    segments: number;
    width: number;
    height: number
}

export class GrassGeometry extends BufferGeometry {
    public override readonly type = 'GrassGeometry';
    public parameters: GrassGeometryParameters;

    constructor(segments = 5, width = 0.1, height = 1.5) {
        super();

        this.parameters = { segments, width, height, };

        const triangleCount = (segments * 2) - 1;
        const verticesCount = (segments * 2) + 1;
        const indexCount = triangleCount * 3;

        const vertices = new Float32Array(verticesCount * 3);
        const indices = new Uint8Array(indexCount);
        const normals = new Float32Array(verticesCount * 3);

        const halfWidth = width / 2;
        const stepWidth = halfWidth / segments;
        const stepHeight = height / segments;

        vertices[0] = 0;
        vertices[1] = height;
        vertices[2] = 0;
        normals[0] = 0;
        normals[1] = 0;
        normals[2] = 1;

        const yAxis = new Vector3(0, 1, 0);
        const normal = new Vector3(0, 0, 1).applyAxisAngle(yAxis, Math.PI / 4); // TODO servirà

        for (let i = 0, l = (verticesCount - 1) * 0.5; i < l; i++) {
            const index = i * 6 + 3;
            const i2 = i + 1;

            vertices[index + 0] = -stepWidth * i2;
            vertices[index + 1] = height - stepHeight * i2;
            vertices[index + 2] = 0;
            normals[index + 0] = -normal.x;
            normals[index + 1] = normal.y;
            normals[index + 2] = normal.z;

            vertices[index + 3] = stepWidth * i2;
            vertices[index + 4] = height - stepHeight * i2;
            vertices[index + 5] = 0;
            normals[index + 3] = normal.x;
            normals[index + 4] = normal.y;
            normals[index + 5] = normal.z;
        }

        for (let i = 0; i < triangleCount; i++) {
            const i3 = i * 3;

            if (i % 2 === 0) {
                indices[i3 + 0] = i + 0;
                indices[i3 + 1] = i + 1;
                indices[i3 + 2] = i + 2;
            } else {
                indices[i3 + 0] = i + 0;
                indices[i3 + 1] = i + 2;
                indices[i3 + 2] = i + 1;
            }
        }

        this.setIndex(new BufferAttribute(indices, 1));
        this.setAttribute('position', new BufferAttribute(vertices, 3));
        this.setAttribute('normal', new BufferAttribute(normals, 3));
    }

    public override copy(source): this {
        super.copy(source);
        this.parameters = { ...source.parameters };
        return this;
    }

    public static fromJSON(data: GrassGeometryParameters) {
        return new GrassGeometry(data.segments, data.width, data.height);
    }
}
