export default /* glsl */`
#ifdef USE_INSTANCING_COLOR_ALPHA_INDIRECT
  flat varying vec4 vColor;
#elif defined( USE_INSTANCING_COLOR_INDIRECT )
  flat varying vec3 vColor;
#endif
`;
