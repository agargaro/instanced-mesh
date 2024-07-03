import { Matrix4, Mesh, Quaternion, Vector3 } from 'three';
import { InstancedMesh2 } from './InstancedMesh2';

export class InstancedEntity {
  public isInstanceEntity = true;
  public readonly id: number;
  public readonly owner: InstancedMesh2;
  public position: Vector3;
  public scale: Vector3;
  public quaternion: Quaternion;
  /** @internal */ public _visible = true;
  /** @internal */ public _matrixNeedsUpdate = false;

//   public get visible(): boolean { return this._visible }
//   public set visible(value: boolean) {
//     if (value !== this._visible) {
//       this.parent.setInstanceVisibility(this, value);
//       this._visible = value;
//     }
//   }

  public get matrix(): Matrix4 {
    if (this._matrixNeedsUpdate) this.forceUpdateMatrix();
    this.owner.getMatrixAt(this.id, _m);
    return _m;
  }

  public get matrixWorld(): Matrix4 {
    return this.matrix.premultiply(this.owner.matrixWorld);
  }

  constructor(owner: InstancedMesh2, index: number) {
    this.id = index;
    this.owner = owner;
    this.position = new Vector3();
    this.scale = new Vector3(1, 1, 1);
    this.quaternion = new Quaternion();
  }

  public updateMatrix(): void { //TODO this can be improved checking also visibility === false
    // if (this.owner._streaMode === true) {
    //   this._matrixNeedsUpdate = true;
    // } else {
      this.forceUpdateMatrix(); // TODO
    // }
  }

  public forceUpdateMatrix(): void {
    const parent = this.owner;
    parent.composeToArray(this.position, this.scale, this.quaternion, this.id);
    // parent._matricesUpdated = true;
    // this._matrixNeedsUpdate = false;
  }

  public applyMatrix4(m: Matrix4): this {
    this.matrix.premultiply(m).decompose(this.position, this.quaternion, this.scale);
    return this;
  }

  public applyQuaternion(q: Quaternion): this {
    this.quaternion.premultiply(q);
    return this;
  }

  public rotateOnAxis(axis: Vector3, angle: number): this {
    _q.setFromAxisAngle(axis, angle);
    this.quaternion.multiply(_q);
    return this;
  }

  public rotateOnWorldAxis(axis: Vector3, angle: number): this {
    _q.setFromAxisAngle(axis, angle);
    this.quaternion.premultiply(_q);
    return this;
  }

  public rotateX(angle: number): this {
    return this.rotateOnAxis(_xAxis, angle);
  }

  public rotateY(angle: number): this {
    return this.rotateOnAxis(_yAxis, angle);
  }

  public rotateZ(angle: number): this {
    return this.rotateOnAxis(_zAxis, angle);
  }

  public translateOnAxis(axis: Vector3, distance: number): this {
    _v1.copy(axis).applyQuaternion(this.quaternion);
    this.position.add(_v1.multiplyScalar(distance));
    return this;
  }

  public translateX(distance: number): this {
    return this.translateOnAxis(_xAxis, distance);
  }

  public translateY(distance: number): this {
    return this.translateOnAxis(_yAxis, distance);
  }

  public translateZ(distance: number): this {
    return this.translateOnAxis(_zAxis, distance);
  }

  public copyTo(target: Mesh): void {
    target.position.copy(this.position);
    target.scale.copy(this.scale);
    target.quaternion.copy(this.quaternion);
    // check other props
  }

}

const _q = new Quaternion();
const _m = new Matrix4();
const _v1 = new Vector3();
const _xAxis = new Vector3(1, 0, 0);
const _yAxis = new Vector3(0, 1, 0);
const _zAxis = new Vector3(0, 0, 1);
