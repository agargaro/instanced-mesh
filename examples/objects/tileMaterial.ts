import { ShaderMaterial, ShaderMaterialParameters, Texture, Vector2 } from 'three';

export class TileMaterial extends ShaderMaterial {
  public override vertexShader = /* glsl */`
    #include <instanced_pars_vertex>
    varying vec2 vUv;

    void main() {
      #include <instanced_vertex>
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    }`;

  public override fragmentShader = /* glsl */`
    uniform vec2 offset;
    uniform sampler2D map;
    uniform vec2 tileSize;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(map, vUv * tileSize + offset * tileSize);
      if (color.a < .9) discard;
      gl_FragColor = color;
    }`;

  constructor(tilemap: Texture, tileSizeX: number, tileSizeY: number, parameters?: ShaderMaterialParameters) {
    super(parameters);
    this.uniforms.map = { value: tilemap };
    this.uniforms.tileSize = { value: new Vector2(tileSizeX / tilemap.image.width, tileSizeY / tilemap.image.height) };
  }
}
