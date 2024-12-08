import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { BoxGeometry, NearestFilter, Scene, ShaderMaterial, ShaderMaterialParameters, Texture, TextureLoader, Vector4 } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { createTexture_vec4, InstancedMesh2 } from '../src/index.js';

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

    uniform highp sampler2D dataTexture;
    uniform sampler2D map;
    varying vec2 vUv;
    flat varying uint vInstanceIndex;
    flat varying uint vFaceIndex;

    void main() {
      vec4 data = getVec4FromTexture(dataTexture, vInstanceIndex * 6u + vFaceIndex);
      vec2 offset = data.xy;
      vec2 size = data.zw;
      vec2 tileSize = vec2(1. / 16., 1. / 16.);
      gl_FragColor = texture2D(map, vUv * size + offset * tileSize);
    }`;

  constructor(count: number, textureAtlas: Texture, parameters?: ShaderMaterialParameters) {
    super(parameters);
    this.uniforms.dataTexture = { value: createTexture_vec4(count * 6) };
    this.uniforms.map = { value: textureAtlas };
  }
}

const main = new Main(); // init renderer and other stuff
const camera = new PerspectiveCameraAuto().translateZ(10);
const scene = new Scene();

const texture = await Asset.load<Texture>(TextureLoader, 'texture.png');
texture.magFilter = NearestFilter;

const grass = new Vector4(0, 15, 1 / 16, 1 / 16),
  flower1 = new Vector4(12, 15, 1 / 16, 1 / 16),
  flower2 = new Vector4(13, 15, 1 / 16, 1 / 16),
  stone = new Vector4(1, 15, 2 / 16, 1 / 16),
  snow = new Vector4(2, 11, 1 / 16, 1 / 16),
  plant = new Vector4(14, 10, 1 / 16, 1 / 16);

const faces = 6;
const count = 6;
const boxes = new InstancedMesh2(main.renderer, count, new BoxGeometry(2, 1, 1).toNonIndexed(), new TileMaterial(count, texture));

boxes.createInstances((obj, index) => {
  obj.position.x = (index % 3 * 3) - 3;
  obj.position.y = (Math.floor(index / 3) * 3) - 1.5;

  const offset = index * faces;
  boxes.setUniformAt(offset + 0, 'dataTexture', flower1);
  boxes.setUniformAt(offset + 1, 'dataTexture', flower2);
  boxes.setUniformAt(offset + 2, 'dataTexture', plant);
  boxes.setUniformAt(offset + 3, 'dataTexture', grass);
  boxes.setUniformAt(offset + 4, 'dataTexture', stone);
  boxes.setUniformAt(offset + 5, 'dataTexture', snow);
});

// boxes.computeBVH();

scene.add(boxes);

main.createView({ scene, camera, enabled: false });

const controls = new OrbitControls(camera, main.renderer.domElement);
controls.update();
