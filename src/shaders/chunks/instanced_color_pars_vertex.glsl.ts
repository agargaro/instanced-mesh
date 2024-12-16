export default /* glsl */`
#ifdef USE_INSTANCING_COLOR_INDIRECT
  uniform highp sampler2D colorsTexture;

  #ifdef USE_COLOR_ALPHA
    vec4 getColorTexture() {
      int size = textureSize( colorsTexture, 0 ).x;
      int j = int( instanceIndex );
      int x = j % size;
      int y = j / size;
      return texelFetch( colorsTexture, ivec2( x, y ), 0 );
    }
  #else
    vec3 getColorTexture() {
      int size = textureSize( colorsTexture, 0 ).x;
      int j = int( instanceIndex );
      int x = j % size;
      int y = j / size;
      return texelFetch( colorsTexture, ivec2( x, y ), 0 ).rgb;
    }
  #endif
#endif
`;
