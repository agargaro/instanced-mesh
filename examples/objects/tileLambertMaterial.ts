import { MeshLambertMaterial, MeshLambertMaterialParameters, Vector2, WebGLProgramParametersWithUniforms, WebGLRenderer } from 'three';

export class TileLambertMaterial extends MeshLambertMaterial {
  constructor(protected tileSizeX: number, protected tileSizeY: number, parameters?: MeshLambertMaterialParameters) {
    super(parameters);
  }

  public override onBeforeCompile(p: WebGLProgramParametersWithUniforms, r: WebGLRenderer): void {
    p.uniforms.tileSize = { value: new Vector2(this.tileSizeX / this.map.image.width, this.tileSizeY / this.map.image.height) };

    p.fragmentShader = p.fragmentShader.replace('void main() {', `
      uniform vec2 offset;
      uniform vec2 tileSize;

      void main() {
    `);

    p.fragmentShader = p.fragmentShader.replace('#include <map_fragment>', `
      diffuseColor *= texture2D(map, vMapUv * tileSize + offset * tileSize);
    `);
  }
}
