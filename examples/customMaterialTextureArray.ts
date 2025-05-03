import { InstancedMesh2 } from '../src/index.js';

import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { DataArrayTexture, LinearFilter, LinearMipMapLinearFilter, Scene, ShaderMaterial, SphereGeometry, Texture, TextureLoader } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

export class TextureArrayMaterial extends ShaderMaterial {
  public dataTextureArray: DataArrayTexture;

  public override vertexShader = /*glsl*/`
    #include <instanced_pars_vertex>
    #include <instanced_color_pars_vertex>
    varying vec2 vUv;
    
    void main() {
        #include <instanced_vertex>
        #include <instanced_color_vertex>
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    }`;

  public override fragmentShader = /*glsl*/`
    uniform float textureIndex;
    uniform sampler2DArray textureArray;
    varying vec2 vUv;

    void main() {
        vec4 texelColor = texture(textureArray, vec3(vUv, textureIndex));
        gl_FragColor = texelColor;
    }`;

  constructor(textureArray: Texture[]) {
    super();
    const maxWidth = Math.max(...textureArray.map((v) => v.image.width));
    const maxHeight = Math.max(...textureArray.map((v) => v.image.height));
    this.dataTextureArray = this.createDataArrayTexture(textureArray, maxWidth, maxHeight);
    this.uniforms.textureArray = { value: this.dataTextureArray };
  }

  protected createDataArrayTexture(textures: Texture[], width: number, height: number): DataArrayTexture {
    const textureCount = textures.length;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const pixels = new Uint8Array(width * height * 4 * textureCount);

    for (let i = 0; i < textureCount; i++) {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(textures[i].image, 0, 0, width, height);
      const imgData = ctx.getImageData(0, 0, width, height);
      pixels.set(imgData.data, i * width * height * 4);
    }

    const dataArrayTex = new DataArrayTexture(pixels, width, height, textureCount);
    dataArrayTex.minFilter = LinearMipMapLinearFilter;
    dataArrayTex.magFilter = LinearFilter;
    dataArrayTex.generateMipmaps = true;
    dataArrayTex.needsUpdate = true;

    return dataArrayTex;
  }
}

const textures = [
  await Asset.load<Texture>(TextureLoader, 'planks.jpg'),
  await Asset.load<Texture>(TextureLoader, 'wall.jpg'),
  await Asset.load<Texture>(TextureLoader, 'pattern.jpg'),
];

const instancedMesh = new InstancedMesh2(new SphereGeometry(0.25, 16, 16), new TextureArrayMaterial(textures));
instancedMesh.initUniformsPerInstance({ fragment: { textureIndex: 'float' } });

instancedMesh.addInstances(1000, (obj, index) => {
  obj.position.copy(obj.position.random().subScalar(0.5).multiplyScalar(20));
  obj.setUniform('textureIndex', Math.round(Math.random() * (textures.length - 1)));
})

const scene = new Scene().add(instancedMesh);
const main = new Main();
const camera = new PerspectiveCameraAuto(70).translateZ(10);
const controls = new OrbitControls(camera, main.renderer.domElement);
controls.update()
main.createView({ scene, camera });
