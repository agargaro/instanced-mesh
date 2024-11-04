import { BufferGeometry, Material } from "three";
import { InstancedMesh2 } from "../InstancedMesh2.js";

declare module '../InstancedMesh2.js' {
	interface InstancedMesh2 {
		getObjectLODIndexForDistance(levels: LODLevel[], distance: number): number;
		setFirstLODDistance(distance?: number, hysteresis?: number): this;
		addLOD(geometry: BufferGeometry, material: Material, distance?: number, hysteresis?: number): this;
		addShadowLOD(geometry: BufferGeometry, material: Material, distance?: number, hysteresis?: number): this;
		/** @internal */ addLevel(renderList: LODRenderList, geometry: BufferGeometry, material: Material, distance: number, hysteresis: number): void;
	}
}

export interface LODInfo<TCustomData = {}> {
	render: LODRenderList<TCustomData>;
	shadowRender: LODRenderList<TCustomData>;
	objects: InstancedMesh2<TCustomData>[];
}

export interface LODRenderList<TCustomData = {}> {
	levels: LODLevel<TCustomData>[];
	indexes: (Uint16Array | Uint32Array)[];
	count: number[];
}

export interface LODLevel<TCustomData = {}> {
	distance: number;
	hysteresis: number;
	object: InstancedMesh2<TCustomData>;
}

InstancedMesh2.prototype.getObjectLODIndexForDistance = function (levels: LODLevel[], distance: number): number {
	for (let i = levels.length - 1; i > 0; i--) {
		const level = levels[i];
		const levelDistance = level.distance - (level.distance * level.hysteresis);
		if (distance >= levelDistance) return i;
	}

	return 0;
}

InstancedMesh2.prototype.setFirstLODDistance = function (distance = 0, hysteresis = 0): InstancedMesh2 {
	if (this._LOD) {
		console.error("Cannot create LOD for this InstancedMesh2.");
		return;
	}

	if (!this.levels) {
		this.levels = { render: null, shadowRender: null, objects: [this] };
	}

	if (!this.levels.render) {
		this.levels.render = {
			levels: [{ distance, hysteresis, object: this }],
			indexes: [this._indexArray],
			count: [0]
		};
	}

	return this;
}

InstancedMesh2.prototype.addLOD = function (geometry: BufferGeometry, material: Material, distance = 0, hysteresis = 0): InstancedMesh2 {
	if (this._LOD) {
		console.error("Cannot create LOD for this InstancedMesh2.");
		return;
	}

	if (!this.levels?.render && distance === 0) {
		console.error("Cannot set distance to 0 for the first LOD. Use 'setFirstLODDistance' before use 'addLOD'.");
		return;
	} else {
		this.setFirstLODDistance(0, hysteresis);
	}

	this.addLevel(this.levels.render, geometry, material, distance, hysteresis);
	return this;
}

InstancedMesh2.prototype.addShadowLOD = function (geometry: BufferGeometry, material: Material, distance = 0, hysteresis = 0): InstancedMesh2 {
	if (this._LOD) {
		console.error("Cannot create LOD for this InstancedMesh2.");
		return;
	}

	if (!this.levels) {
		this.levels = { render: null, shadowRender: null, objects: [] };
	}

	if (!this.levels.shadowRender) {
		this.levels.shadowRender = { levels: [], indexes: [], count: [] };
	}

	this.addLevel(this.levels.shadowRender, geometry, material, distance, hysteresis);
	return this;
}

InstancedMesh2.prototype.addLevel = function (renderList: LODRenderList, geometry: BufferGeometry, material: Material, distance: number, hysteresis: number): void {
	const objectsList = this.levels.objects;
	const levels = renderList.levels;
	const object = new InstancedMesh2(undefined, this._maxCount, geometry, material, this); // TODO fix renderer param
	let index;
	distance = distance ** 2; // to avoid to use Math.sqrt every time

	for (index = 0; index < levels.length; index++) {
		if (distance < levels[index].distance) break;
	}

	levels.splice(index, 0, { distance, hysteresis, object });
	renderList.count.push(0);
	renderList.indexes.splice(index, 0, object._indexArray);

	if (objectsList.indexOf(object) === -1) objectsList.push(object);

	this.add(object); // TODO handle render order?
}