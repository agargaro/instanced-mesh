import { Asset } from "@three.ez/main";
import { Group, PointLight } from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/Addons.js";
import { Pane } from "tweakpane";

const GLB_PATH = "./instanced-mesh/low_poly_space_ship.glb";
Asset.preload(GLTFLoader, GLB_PATH);

export class SpaceShip extends Group {
  public pointLight = new PointLight('cyan', 10);

  enableFollow = true;

  constructor() {
    super();
    // Pointer movement
    const pointer = { y: 0, x: 0 };

    window.addEventListener("mousemove", (e) => {
      pointer.y = -(e.clientY / window.innerHeight - 0.5) * 10;
      pointer.x = (e.clientX / window.innerWidth - 0.5) * 10;
    });


    const debug = document.createElement('pre');

    // document.body.appendChild(debug);
    debug.innerHTML = `no event yet`;

    window.addEventListener("devicemotion", (e: DeviceMotionEvent) => {
      console.log(e)
      // normalize the alpha and gamma values

      // pointer.y = -e.gamma / 90;

      const isLandscape = window.innerWidth > window.innerHeight;

      // pointer.x = (isLandscape ? e.accelerationIncludingGravity.x : e.accelerationIncludingGravity.z) * 2;
      // pointer.y = (isLandscape ? e.accelerationIncludingGravity.z : -e.accelerationIncludingGravity.x) - 9.8;
      if (isLandscape) {
        pointer.x = e.accelerationIncludingGravity.z * 0.5
        pointer.y = e.accelerationIncludingGravity.y * 0.2
      } else {
        pointer.x = e.accelerationIncludingGravity.x * 0.5
        pointer.y = e.accelerationIncludingGravity.y * 0.2
      }
      // add debugger infor in dom for all the values of e 

      debug.innerHTML = `
        Angle Alpha : ${JSON.stringify(e.rotationRate)}
        Accélération en X : ${e.accelerationIncludingGravity.x}
        Accélération en Y : ${e.accelerationIncludingGravity.y}
        Accélération en Z : ${e.accelerationIncludingGravity.z}
    `
      debug.style.whiteSpace = "pre";
      debug.style.position = "fixed";
      debug.style.top = 0 + "px";
      debug.style.right = 0 + "px";
      debug.style.zIndex = '1000';
      debug.style.backgroundColor = 'white';
      debug.style.padding = '10px';
      debug.style.border = '1px solid black';

    });


    const gltf = Asset.get<GLTF>(GLB_PATH);
    this.add(gltf.scene.children[0]);

    this.add(this.pointLight);


    this.rotation.set(Math.PI / 2, Math.PI, 0);
    this.position.set(-1.5, 0, 2);

    this.scale.setScalar(0.35);

    this.on("animate", (e) => {
      this.pointLight.intensity = 3 + Math.abs(Math.sin(e.total)) * 7;

      if (this.enableFollow) {

        this.position.y += (pointer.y - this.position.y) * 0.1;
        this.position.x += (pointer.x - this.position.x) * 0.1;

        this.rotation.z = (pointer.x - this.position.x) * 0.2;
        // this.rotation.y = (pointer.y - this.position.y) * 0.2;
      }
      else {
        this.position.y = 0
        this.position.x = 0
      }

    });

    // this.devMode()

  }


  // devMode() {
  //   const pane = new Pane();
  //   pane.element.style.transform = "translateY(60px)";
  //   const spaceshipFolder = pane.addFolder({
  //     title: "Space Ship Rotation",
  //     expanded: true,
  //   });
  //   spaceshipFolder.addBinding(this, "position", {
  //     label: "Position",
  //     x: { min: -10, max: 10, step: 0.1 },
  //     y: { min: -10, max: 10, step: 0.1 },
  //     z: { min: -10, max: 10, step: 0.1 },
  //   });
  //   spaceshipFolder.addBinding(this, "rotation", {
  //     label: "Rotation",
  //     x: { min: -Math.PI, max: Math.PI, step: 0.01 },
  //     y: { min: -Math.PI, max: Math.PI, step: 0.01 },
  //     z: { min: -Math.PI, max: Math.PI, step: 0.01 },
  //   });
  //   spaceshipFolder.addBinding(this, "scale", {
  //     label: "Scale",
  //     x: { min: 0.1, max: 10, step: 0.1 },
  //     y: { min: 0.1, max: 10, step: 0.1 },
  //     z: { min: 0.1, max: 10, step: 0.1 },
  //   });
  //   spaceshipFolder.addBinding(this, "enableFollow", { label: "Enable Follow" });
  // }
}
