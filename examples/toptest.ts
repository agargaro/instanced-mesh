import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { Matrix4, Mesh, MeshBasicMaterial, Scene, Vector3, WebGLProgramParametersWithUniforms } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { GrassGeometry } from './objects/grassGeometry.js';

const main = new Main();
const grass = new Mesh(new GrassGeometry(5, 0.1, 1.5), new MeshBasicMaterial({ wireframe: true }));
grass.translateY(1.5 / -2);

// const wind = new Vector3(0, 0, 1);
// const matrix = new Matrix4().makeRotationAxis(wind, -0.5);
// grass.applyMatrix4(matrix);

const time = { value: 0 };

grass.material.onBeforeCompile = (parameters: WebGLProgramParametersWithUniforms) => {
  parameters.uniforms.time = time;

  parameters.vertexShader = parameters.vertexShader.replace("#include <common>", `#include <common>
      mat3 rotateX(float theta) {
        float s = sin(theta);
        float c = cos(theta);
        return mat3(
            vec3(1, 0, 0),
            vec3(0, c, -s),
            vec3(0, s, c)
        );
      }

      mat3 rotateY(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat3(
          c, 0.0, -s,
          0.0, 1.0, 0.0,
          s, 0.0, c
        );
      }

      mat3 rotateZ(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat3(
          c, s, 0.0,
          -s, c, 0.0,
          0.0, 0.0, 1.0
        );
      }

      mat4 rotateAxis(vec3 axis, float angle) {
        axis = normalize(axis);
        float s = sin(angle);
        float c = cos(angle);
        float oc = 1.0 - c;

        return mat4(
          oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
          oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
          oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
          0.0,                                0.0,                                0.0,                                1.0
        );
      }

      float easeInSine(float x) {
        return 1. - cos((x * PI) / 2.);
      }

      uniform float time;
  `);

  parameters.vertexShader = parameters.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
      float vHeightPercent = (position.y + 0.75) / 1.5;
      float curveAmount = vHeightPercent * 0.2;
      transformed *= rotateX(curveAmount); // meglio Z
      // transformed *= rotateY(curveAmount); // meglio Z

      vec3 windDir = vec3(1.0, 0.0, 0.0);
      float windForce = 0.5;
      float freq = 1.0;

      vec3 windAxis = cross(windDir, vec3(0.0, -1.0, 0.0));

      vec4 test = vec4(transformed, 1.0) * rotateAxis(windAxis, vHeightPercent * windForce * easeInSine(abs(sin(time * freq))));
      transformed = test.xyz;
  `);
}

const camera = new PerspectiveCameraAuto(70).translateZ(2);
const scene = new Scene().add(grass);

scene.on('animate', (e) => time.value = e.total);

main.createView({ scene, camera, enabled: false });

const controls = new OrbitControls(camera, main.renderer.domElement);
scene.on(['pointerdown', 'pointerup', 'dragend'], (e) => (controls.enabled = e.type === 'pointerdown' ? e.target === scene : true));
