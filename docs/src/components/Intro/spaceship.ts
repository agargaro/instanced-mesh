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
    const baseMap = (mesh.material as MeshLambertMaterial).map ?? null;
    // Atlas §7: hull must read as a clearly red ship against the black void.
    // Preserve the GLB's texture (panel detail) but tint it with the Atlas scafo rosso #9c2620.
    const atlasRed = new Color(0x9c2620);
    mesh.material = new MeshLambertMaterial({ color: atlasRed, map: baseMap });
    if (baseMap) mesh.material.color.multiplyScalar(1.15);
    patchCelMaterial(mesh.material, { boot: bootProgress, phosphor: new Color("#f2f6ff"), rim: 0.14 });

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
