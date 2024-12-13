export default /* glsl */`
#ifdef USE_INSTANCING_INDIRECT
  mat4 instanceMatrix = getInstancedMatrix();

  #if defined( USE_INSTANCING_COLOR_INDIRECT ) || defined( USE_INSTANCING_COLOR_ALPHA_INDIRECT )
    vColor = getColorTexture();
  #endif
#endif
`;
