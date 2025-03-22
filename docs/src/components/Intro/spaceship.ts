import { Asset } from "@three.ez/main";
import { BoxGeometry, Group, Mesh, MeshLambertMaterial, Vector3 } from "three";
import { type GLTF, GLTFLoader } from "three/examples/jsm/Addons.js";

const GLB_PATH = "./instanced-mesh/low_poly_space_ship.glb";

Asset.preload(GLTFLoader, GLB_PATH);

export class SpaceShip extends Group {
  constructor() {
    super();

    const gltf = Asset.get<GLTF>(GLB_PATH);

    console.assert(gltf, "GLTF not loaded");

    const group = gltf.scene.children[0];

    console.assert(group, "Group not found");

    this.add(group);

    const mesh = this.querySelector("Mesh");
    mesh.material = new MeshLambertMaterial({
      map: mesh.material.map,
    });

    this.rotateY(Math.PI);

    this.updateMatrix();

    const invertedMatrix = this.matrix.invert();
    const rightSpawn = new Vector3(0.6, 0.3, -5).applyMatrix4(invertedMatrix);
    const leftSpawn = new Vector3(-0.6, 0, 0).applyMatrix4(invertedMatrix);

    // pane.addBinding(rightSpawn, "rightSpawn", { x: {}, y: {}, z: {} });
    // pane.addBinding(rightSpawn, "leftSpawn", { x: {}, y: {}, z: {} });

    const box = new BoxGeometry(0.1, 0.1, 0.1);

    const rightBox = new Mesh(
      box,
      new MeshLambertMaterial({ color: 0xff0000 }),
    );
    rightBox.position.add(rightSpawn);

    const leftBox = new Mesh(box, new MeshLambertMaterial({ color: 0x00ff00 }));
    leftBox.position.add(leftSpawn);
    this.add(rightBox, leftBox);
  }
}
