import { Asset } from "@three.ez/main";
import { BufferGeometry, Group, Mesh, MeshLambertMaterial, PointLight, Vector2, Vector3 } from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/Addons.js";

const GLB_PATH = "./instanced-mesh/low_poly_space_ship.glb";
Asset.preload(GLTFLoader, GLB_PATH);

export class SpaceShip extends Group {
  constructor() {
    super();
    this.loadModel();

    const pointLight = new PointLight('white', 20).translateY(5);
    this.add(pointLight);

    this.rotation.y = Math.PI;
    this.translateY(5);
    this.scale.setScalar(0.4);

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
    const newPosition = new Vector3();

    window.addEventListener("mousemove", (e) => {
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = -e.clientY / window.innerHeight + 0.5;

      newPosition.x = pointer.x * 10;
      newPosition.z = pointer.y * 10;
    });


    this.on("animate", (e) => {
      this.position.x += (newPosition.x - this.position.x) * e.delta * 10;
      // this.position.z += (pointer.y - this.position.y) * e.delta;
      this.rotation.z = (newPosition.x - this.position.x) * e.delta * 10;
    });
  }
}
