import { Asset } from "@three.ez/main";
import { BufferGeometry, Group, Mesh, MeshLambertMaterial, PointLight, Vector2, Vector3 } from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/Addons.js";

const GLB_PATH = "/instanced-mesh/low_poly_space_ship.glb";
Asset.preload(GLTFLoader, GLB_PATH);

export class SpaceShip extends Group {

  constructor() {
    super();
    this.loadModel();

    const pointLight = new PointLight('white', 6, 12, 1).translateY(10);
    this.add(pointLight);

    this.position.set(0, 5, 20);
    this.rotation.y = Math.PI;
    this.scale.setScalar(0.15);

    this.bindInteraction();
  }

  private loadModel(): void {
    const gltf = Asset.get<GLTF>(GLB_PATH);
    const mesh = gltf.scene.querySelector("Mesh") as Mesh<BufferGeometry, MeshLambertMaterial>;
    mesh.material = new MeshLambertMaterial({ map: mesh.material.map });
    this.add(gltf.scene.children[0]);
  }

  private bindInteraction(): void {
    const pointer = new Vector2();
    const newPosition = new Vector3(0, 0, -2.5);
    const minPosition = new Vector3(-1, 0, -5);
    const maxPosition = new Vector3(1, 0, -1.5); 

    window.addEventListener("pointermove", (e) => {
      pointer.x = e.clientX / window.innerWidth;
      pointer.y = e.clientY / window.innerHeight;

      newPosition.x = (pointer.x * (maxPosition.x - minPosition.x)) + minPosition.x;
      newPosition.z = (pointer.y * (maxPosition.z - minPosition.z)) + minPosition.z;
    });


    this.on("animate", (e) => {
      if (!newPosition) return;

      this.position.x += (newPosition.x - this.position.x) * e.delta * 5;
      this.position.z += (newPosition.z - this.position.z) * e.delta * 5;

      this.rotation.z = (newPosition.x - this.position.x) * e.delta * 20;
      this.rotation.x = (newPosition.z - this.position.z) * e.delta * 20;
    });
  }
}
