import { ShaderChunk } from 'three';

let _morphInstanceVertexChunk: string = null;

/**
 * Returns the three.js `morphinstance_vertex` chunk patched to use the indirect `instanceIndex` attribute.
 * @returns The patched `morphinstance_vertex` chunk.
 */
export function getMorphInstanceVertexChunk(): string {
  if (_morphInstanceVertexChunk === null) {
    _morphInstanceVertexChunk = ShaderChunk['morphinstance_vertex']?.replaceAll('gl_InstanceID', 'instanceIndex') ?? '';
  }

  return _morphInstanceVertexChunk;
}
