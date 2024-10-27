import { BoxGeometry, NearestFilter, Scene, ShaderMaterial, ShaderMaterialParameters, Texture, TextureLoader, Vector2 } from 'three';
import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { createTexture_vec2, InstancedMesh2 } from '../src/index.js';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

export class TileMaterial extends ShaderMaterial {
  public override vertexShader = `
    #include <get_from_texture>
    #include <instanced_pars_vertex>

    varying vec2 vUv;
    flat varying uint vInstanceIndex;
    flat varying uint vFaceIndex;

    void main() {
      #include <instanced_vertex>

      vUv = uv;
      vInstanceIndex = instanceIndex;
      vFaceIndex = uint(gl_VertexID / 6);
      gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    }`;

  public override fragmentShader = `
    #include <get_from_texture>

	  uniform highp sampler2D offsetTexture;
    uniform sampler2D map;
    uniform vec2 tileSize;
    varying vec2 vUv;
    flat varying uint vInstanceIndex;
    flat varying uint vFaceIndex;

    void main() {
      vec2 offset = getVec2FromTexture(offsetTexture, vInstanceIndex * 6u + vFaceIndex);
      gl_FragColor = texture2D(map, vUv * tileSize + offset * tileSize);
    }`;

  constructor(count: number, tilemap: Texture, tileSizeX: number, tileSizeY: number, parameters?: ShaderMaterialParameters) {
    super(parameters);
    this.uniforms.offsetTexture = { value: createTexture_vec2(count * 6) };
    this.uniforms.map = { value: tilemap };
    this.uniforms.tileSize = { value: new Vector2(tileSizeX / tilemap.image.width, tileSizeY / tilemap.image.height) };
  }
}


const main = new Main(); // init renderer and other stuff
const camera = new PerspectiveCameraAuto().translateZ(5);
const scene = new Scene();

const texture = await Asset.load<Texture>(TextureLoader, 'texture.png');
texture.magFilter = NearestFilter;

const grass = new Vector2(0, 15),
  flower1 = new Vector2(12, 15),
  flower2 = new Vector2(13, 15),
  stone = new Vector2(1, 15),
  snow = new Vector2(2, 11),
  plant = new Vector2(14, 10);

const faces = 6;
const count = 6;
const boxes = new InstancedMesh2(main.renderer, count, new BoxGeometry().toNonIndexed(), new TileMaterial(count, texture, 32, 32));

boxes.createInstances((obj, index) => {
  obj.position.x = (index % 3 * 1.5) - 1.5;
  obj.position.y = (Math.floor(index / 3) * 1.5) - 1;

  const offset = index * faces;
  boxes.setUniformAt(offset + 0, 'offsetTexture', grass);
  boxes.setUniformAt(offset + 1, 'offsetTexture', stone);
  boxes.setUniformAt(offset + 2, 'offsetTexture', snow);
  boxes.setUniformAt(offset + 3, 'offsetTexture', flower1);
  boxes.setUniformAt(offset + 4, 'offsetTexture', flower2);
  boxes.setUniformAt(offset + 5, 'offsetTexture', plant);
});

// boxes.computeBVH();

scene.add(boxes);

main.createView({ scene, camera, enabled: false });

const controls = new OrbitControls(camera, main.renderer.domElement); 
