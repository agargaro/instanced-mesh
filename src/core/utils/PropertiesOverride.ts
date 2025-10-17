import { MeshDistanceMaterial, WebGLRenderer } from 'three';

/**
 * TODO Explain
 */

// TODO Fix multiple renderer

let propertiesGetBase: (obj: unknown) => unknown = null; // this can become const
const propertiesGetMap = new WeakMap<any, () => unknown>();

export function propertiesGet(object: unknown): unknown {
  return propertiesGetMap.get(object)?.() ?? propertiesGetBase(object);
}

export function addProperties(material: unknown): void {
  if (propertiesGetMap.has(material)) return;

  const materialProperties: { [x: string]: any } = {};

  propertiesGetMap.set(material, () => {
    // Fix pointLight bug. Related: https://github.com/mrdoob/three.js/blob/dev/src/renderers/webgl/WebGLShadowMap.js#L333
    if ((material as MeshDistanceMaterial).isMeshDistanceMaterial) {
      const materialPropertiesBase = propertiesGetBase(material) as { [x: string]: any };
      materialProperties.light = materialPropertiesBase.light;
    }

    return materialProperties;
  });
}

export function patchProperties(renderer: WebGLRenderer): void {
  const properties = renderer.properties;
  propertiesGetBase = properties.get;
  properties.get = propertiesGet as (obj: unknown) => unknown;
}

export function unpatchProperties(renderer: WebGLRenderer): void {
  renderer.properties.get = propertiesGetBase;
}
