import { Asset } from "@three.ez/main";
import { BoxGeometry, Group, Mesh, MeshLambertMaterial, Vector3 } from "three";
import { type GLTF, GLTFLoader } from "three/examples/jsm/Addons.js";
import type { Pane } from "tweakpane";
import { Smoke } from "./smoke";

const GLB_PATH = "./instanced-mesh/low_poly_space_ship.glb";

Asset.preload(GLTFLoader, GLB_PATH);

export class SpaceShip extends Group {
  constructor() {
    super();

    this.loadGltfAsset();

    this.rotateY(Math.PI);
    this.updateMatrix();

    this.setupPane();
  }

  private loadGltfAsset() {
    const gltf = Asset.get<GLTF>(GLB_PATH);
    console.assert(gltf, "[spaceship]: GLTF not loaded");

    const group = gltf.scene.children[0];
    console.assert(group, "[spaceship]: Group not found");

    this.add(group);

    const mesh = this.querySelector("Mesh");
    mesh.material = new MeshLambertMaterial({
      map: mesh.material.map,
    });
  }

  setupPane() {
    const pane: Pane = window.pane;
    if (pane) {
      const spaceshipFolder = window.pane.addFolder({
        title: this.constructor.name,
        expanded: true,
      });

      spaceshipFolder.addBinding(this, "position", {
        label: this.constructor.name + " pos",
      });
      spaceshipFolder.addBinding(this, "rotation", {
        label: this.constructor.name + " rotation",
      });
    }
  }
}
