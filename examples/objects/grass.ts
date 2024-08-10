import { BufferAttribute, BufferGeometry, Color, DoubleSide, MeshPhongMaterial, PlaneGeometry, Vector3, Vector4, WebGLProgramParametersWithUniforms, WebGLRenderer } from 'three';
import { InstancedMesh2 } from '../../src/index.js';
import { Terrain } from '../terrain.js';
import { TerrainSurfaceSampler } from './terrainSurfaceSampler.js';

function createGeometry(segments: number, width = 0.1, height = 1.5): BufferGeometry {
    const geometry = new BufferGeometry();
    const triangleCount = (segments * 2) - 1;
    const verticesCount = (segments * 2) + 1;
    const indexCount = triangleCount * 3;

    const vertices = new Float32Array(verticesCount * 3);
    const indices = new Uint8Array(indexCount);
    const normals = new Float32Array(verticesCount * 3);

    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const stepWidth = halfWidth / segments;
    const stepHeight = height / segments;

    vertices[0] = 0;
    vertices[1] = halfHeight;
    vertices[2] = 0;
    normals[0] = 0;
    normals[1] = 0;
    normals[2] = 1;

    const yAxis = new Vector3(0, 1, 0);
    const normal = new Vector3(0, 0, 1).applyAxisAngle(yAxis, Math.PI / 3);

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

    geometry.setIndex(new BufferAttribute(indices, 1));
    geometry.setAttribute('position', new BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new BufferAttribute(normals, 3));

    return geometry;
}

export class Grass extends InstancedMesh2<{}, BufferGeometry, MeshPhongMaterial> {
    public time = { value: 0 };
    public topColor = { value: new Color(0x98c064) };
    public bottomColor = { value: new Color(0x6aa120) };
    public occlusionColor = { value: new Color(0x004400) };

    constructor(renderer: WebGLRenderer, count: number, segments: number, terrain: Terrain, rect: Vector4) {
        const material = new MeshPhongMaterial({ side: DoubleSide });

        material.onBeforeCompile = (parameters: WebGLProgramParametersWithUniforms) => {
            parameters.uniforms.time = this.time; // if (segments > 1)  Finire
            parameters.uniforms.bottomColor = this.bottomColor;
            parameters.uniforms.topColor = this.topColor;
            parameters.uniforms.occlusionColor = this.occlusionColor;

            parameters.vertexShader = parameters.vertexShader.replace("#include <common>", `#include <common>
                #define M_PI 3.1415926535897932384626433832795 // vedere
                uniform float time;
                varying float vHeightPercent;

                mat3 rotateX(float theta) {
                    float c = cos(theta);
                    float s = sin(theta);
                    return mat3(
                        vec3(1, 0, 0),
                        vec3(0, c, -s),
                        vec3(0, s, c)
                    );
                }

                float easeInOutSine(float x) {
                    return -(cos(M_PI * x) - 1.0) / 2.0;
                }
            `);

            parameters.vertexShader = parameters.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
                vHeightPercent = (position.y + 0.75) / 1.5;
                vec3 pos = vec3(instanceMatrix[3][0], 0.0, instanceMatrix[3][2]);
                float curveAmount = (sin(pos.x * pos.z) + easeInOutSine(time + pos.x * pos.z) * 0.15) * vHeightPercent * 0.7;
                transformed *= rotateX(curveAmount);
                // transformedNormal *= rotateX(curveAmount);
            `);

            parameters.fragmentShader = parameters.fragmentShader.replace("#include <common>", `#include <common>
                uniform vec3 bottomColor;
                uniform vec3 topColor;
                uniform vec3 occlusionColor;
                varying float vHeightPercent;
            `);

            parameters.fragmentShader = parameters.fragmentShader.replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
                // normal *= faceDirection;
                vec3 mixedColor = mix(bottomColor, topColor, vHeightPercent);
                float occlusionPercent = min(1.0, vHeightPercent / 0.25);
                diffuseColor = vec4(mix(occlusionColor, mixedColor, occlusionPercent), 1.0);
            `);
        }

        const sampler = new TerrainSurfaceSampler(terrain).build();

        let i = 0;
        const widthSegments = ((terrain.geometry as PlaneGeometry).parameters).widthSegments;
        const heightSegments = ((terrain.geometry as PlaneGeometry).parameters).heightSegments;
        const rowStart = rect.x;
        const rowCount = rect.z;
        const colStart = rect.y;
        const colCount = rect.w;
        const tileSize = 1 / (widthSegments * heightSegments * 2);

        sampler.randomFunction = () => {
            if (i++ % 3 === 0) {
                const row = rowStart + Math.floor(Math.random() * rowCount);
                const col = colStart + Math.floor(Math.random() * colCount);
                return tileSize * ((widthSegments * row * 2 + col * 2) + Math.round(Math.random())) + 10e-7;
            }
            else return Math.random();
        }

        super(renderer, count, createGeometry(segments), material);

        this.createInstances((obj, index) => {
            sampler.sample(obj.position);
            obj.rotateY(Math.random() * Math.PI - Math.PI / 2);
        });

        this.perObjectFrustumCulled = false;

        this.interceptByRaycaster = false;

        this.receiveShadow = true;

        this.frustumCulled = true;

        this.on('animate', (e) => {
            this.time.value = Math.sin(e.total * 0.5);
        })
    }
}
