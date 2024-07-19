import { DataTexture, FloatType, RedFormat, RGBAFormat, RGFormat } from "three";

export function createTexture_float(count: number): DataTexture {
    const size = Math.ceil(Math.sqrt(count));
    const array = new Float32Array(size * size);
    const texture = new DataTexture(array, size, size, RedFormat, FloatType);
    texture.needsUpdate = true;
    return texture;
}

export function createTexture_vec2(count: number): DataTexture {
    const size = Math.ceil(Math.sqrt(count));
    const array = new Float32Array(size * size * 2);
    const texture = new DataTexture(array, size, size, RGFormat, FloatType);
    texture.needsUpdate = true;
    return texture;
}

export function createTexture_vec3(count: number): DataTexture {
    const size = Math.ceil(Math.sqrt(count));
    const array = new Float32Array(size * size * 4);
    // RGBFormat has been removed https://github.com/mrdoob/three.js/pull/23228
    const texture = new DataTexture(array, size, size, RGBAFormat, FloatType);
    texture.needsUpdate = true;
    return texture;
}

export function createTexture_vec4(count: number): DataTexture {
    const size = Math.ceil(Math.sqrt(count));
    const array = new Float32Array(size * size * 4);
    const texture = new DataTexture(array, size, size, RGBAFormat, FloatType);
    texture.needsUpdate = true;
    return texture;
}

export function createTexture_mat3(count: number): DataTexture {
    let size = Math.sqrt(count * 3); // 3 pixels needed for 1 matrix
    size = Math.ceil(size / 3) * 3;
    size = Math.max(size, 3);
    const array = new Float32Array(size * size * 4);
    const texture = new DataTexture(array, size, size, RGBAFormat, FloatType);
    texture.needsUpdate = true;
    return texture;
}

export function createTexture_mat4(count: number): DataTexture {
    let size = Math.sqrt(count * 4); // 4 pixels needed for 1 matrix
    size = Math.ceil(size / 4) * 4;
    size = Math.max(size, 4);
    const array = new Float32Array(size * size * 4);
    const texture = new DataTexture(array, size, size, RGBAFormat, FloatType);
    texture.needsUpdate = true;
    return texture;
}
