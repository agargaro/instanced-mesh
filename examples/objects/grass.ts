import { BufferGeometry, Color, Vector4, WebGLRenderer } from 'three';
import { InstancedMesh2 } from '../../src/index.js';
import { GrassGeometry } from './grassGeometry.js';
import { GrassMaterial } from './grassMaterial.js';
import { TerrainSurfaceSampler } from './terrainSurfaceSampler.js';

export class Grass extends InstancedMesh2<{}, BufferGeometry, GrassMaterial> {
    public topColor = { value: new Color(0x98c064) };
    public bottomColor = { value: new Color(0x6aa120) };
    public occlusionColor = { value: new Color(0x004400) };

    constructor(renderer: WebGLRenderer, count: number, segments: number, sampler: TerrainSurfaceSampler, area: Vector4) {
        super(renderer, count, new GrassGeometry(segments), new GrassMaterial());

        this.updateInstances((obj) => {
            sampler.sampleTile(area, obj.position);
            obj.rotateY(Math.random() * Math.PI * 2);
        });

        this.computeBoundingBox();

        this.perObjectFrustumCulled = false;
        this.interceptByRaycaster = false;
        this.receiveShadow = true;

        this.on('animate', (e) => {
            this.material.time.value = e.total;
        });
    }
}
