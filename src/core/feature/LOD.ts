import { BufferGeometry, Material } from "three";
import { InstancedMesh2 } from "../InstancedMesh2.js";

declare module '../InstancedMesh2.js' {
	interface InstancedMesh2 {
		addLevel(geometry: BufferGeometry, material: Material, distance?: number, hysteresis?: number): this
		getObjectLODIndexForDistance(distance: number): number
	}
}


InstancedMesh2.prototype.addLevel = function(geometry: BufferGeometry, material: Material, distance = 0, hysteresis = 0): InstancedMesh2 {
	if (this._LOD) {
		console.error("Cannot create LOD for this InstancedMesh2.");
		return;
	}

	if (!this.levels) {
		this.levels = [{ distance: 0, hysteresis, object: this }];
		this._countIndexes = [0];
		this._indexes = [this._indexArray];
	}

	const levels = this.levels;
	// TODO fix renderer param
	const object = new InstancedMesh2(undefined, this._maxCount, geometry, material, this);
	distance = Math.abs(distance ** 2); // to avoid to use Math.sqrt every time
	let index;

	for (index = 0; index < levels.length; index++) {
		if (distance < levels[index].distance) break;
	}

	levels.splice(index, 0, { distance, hysteresis, object });

	this._countIndexes.push(0);
	this._indexes.splice(index, 0, object._indexArray);

	this.add(object); // TODO handle render order
	return this;
}

InstancedMesh2.prototype.getObjectLODIndexForDistance = function(distance: number): number {
	const levels = this.levels;

	for (let i = levels.length - 1; i > 0; i--) {
		const level = levels[i];
		const levelDistance = level.distance - (level.distance * level.hysteresis);
		if (distance >= levelDistance) return i;
	}

	return 0;
}