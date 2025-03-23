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

    this.position.set(0, 5, -2.5);
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
    let newPosition: Vector3;

    window.addEventListener("mousemove", (e) => {
      if (!newPosition) {
        newPosition = new Vector3();
      }

      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = -e.clientY / window.innerHeight + 0.5;

      newPosition.x = pointer.x * 2.5;
      newPosition.z = -1 - (pointer.y + 0.5) * 6;
    });


    this.on("animate", (e) => {
      if (!newPosition) return;

      this.position.x += (newPosition.x - this.position.x) * e.delta * 5;
      this.position.z += (newPosition.z - this.position.z) * e.delta * 5;

      this.rotation.z = (newPosition.x - this.position.x) * e.delta * 15;
      this.rotation.x = (newPosition.z - this.position.z) * e.delta * 15;
    });
  }
}
