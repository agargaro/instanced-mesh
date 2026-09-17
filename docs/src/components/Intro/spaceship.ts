import { get, preload } from "@three.ez/main";
import { BufferGeometry, Color, Group, Mesh, MeshLambertMaterial } from "three";
import { prepareOutlineGeometry, bootProgress, outlineMaterial, patchCelMaterial } from "./shader";
import { GLTFLoader, type GLTF } from "three/examples/jsm/Addons.js";

const GLB_PATH = "/instanced-mesh/low_poly_space_ship.glb";
preload(GLTFLoader, GLB_PATH);

export class SpaceShip extends Group {
  constructor() {
    super();
    this.loadModel();

    /* Spawn inside the innermost orbit, clear of every seeded world. */
    this.position.set(0, 3, 60);
    this.rotation.y = Math.PI;
    this.scale.setScalar(1);
  }

  private loadModel(): void {
    const gltf = get<GLTF>(GLB_PATH);
    const mesh = gltf.scene.querySelector("Mesh") as Mesh<BufferGeometry, MeshLambertMaterial>;
    prepareOutlineGeometry(mesh.geometry);
    mesh.material = new MeshLambertMaterial({ map: mesh.material.map });
    patchCelMaterial(mesh.material, { boot: bootProgress, phosphor: new Color("#ffffff"), rim: 0.08 });

    /* Thin hull drawn after the surface: a contour, never a white slab. */
    const ink = new Mesh(mesh.geometry, outlineMaterial(0.03, 0xffffff));
    ink.renderOrder = 1;
    ink.position.copy(mesh.position);
    ink.quaternion.copy(mesh.quaternion);
    ink.scale.copy(mesh.scale);
    mesh.parent?.add(ink);
    this.add(gltf.scene.children[0]);
  }
}
