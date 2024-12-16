export default /* glsl */`
#ifdef USE_INSTANCING_INDIRECT
  mat4 instanceMatrix = getInstancedMatrix();

  #ifdef USE_INSTANCING_COLOR_INDIRECT
    vColor *= getColorTexture();
  #endif
#endif
`;
