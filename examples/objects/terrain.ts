import { Mesh, MeshStandardMaterial, PlaneGeometry, Texture } from 'three';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise';

export class Terrain extends Mesh {
  private terrainSize: number;
  private terrainSegments: number;
  private data: Uint8Array;
  constructor(terrainSize: number, terrainSegments: number, terrainTexture?: Texture, normalTexture?: Texture) {
    super(new PlaneGeometry(terrainSize, terrainSize, terrainSegments - 1, terrainSegments - 1), new MeshStandardMaterial({ map: terrainTexture, normalMap: normalTexture }));
    this.terrainSize = terrainSize;
    this.terrainSegments = terrainSegments;

    this.geometry.rotateX(-Math.PI / 2);

    this.generateTerrainGeometry();
  }

  private generateTerrainGeometry() {
    const vertices = this.geometry.attributes.position.array;

    this.data = this.generateHeight();

    for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
      vertices[j + 1] = this.data[i] * (this.terrainSize * 0.0025) - (this.terrainSize / 100);
    }

    this.geometry.computeVertexNormals();
  }

  private generateHeight(): Uint8Array {
    const size = this.terrainSegments * this.terrainSegments;
    const data = new Uint8Array(size);
    const perlin = new ImprovedNoise();
    const z = Math.random() * 100;

    let quality = 1;

    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < size; i++) {
        const x = i % this.terrainSegments;
        const y = ~~(i / this.terrainSegments);
        data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75);
      }

      quality *= 5;
    }

    return data;
  }
}
