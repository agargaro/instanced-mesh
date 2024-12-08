export default /* glsl */`
#ifdef USE_INSTANCING_INDIRECT
  attribute uint instanceIndex;
  uniform highp sampler2D matricesTexture;  

  mat4 getInstancedMatrix() {
    int size = textureSize( matricesTexture, 0 ).x;
    int j = int( instanceIndex ) * 4;
    int x = j % size;
    int y = j / size;
    vec4 v1 = texelFetch( matricesTexture, ivec2( x, y ), 0 );
    vec4 v2 = texelFetch( matricesTexture, ivec2( x + 1, y ), 0 );
    vec4 v3 = texelFetch( matricesTexture, ivec2( x + 2, y ), 0 );
    vec4 v4 = texelFetch( matricesTexture, ivec2( x + 3, y ), 0 );
    return mat4( v1, v2, v3, v4 );
  }

  #if defined( USE_INSTANCING_COLOR_INDIRECT ) || defined( USE_INSTANCING_COLOR_ALPHA_INDIRECT )
    uniform highp sampler2D colorsTexture;

    #ifdef USE_INSTANCING_COLOR_ALPHA_INDIRECT
      flat varying vec4 vColor;
    
      vec4 getColorTexture() {
        int size = textureSize( colorsTexture, 0 ).x;
        int j = int( instanceIndex );
        int x = j % size;
        int y = j / size;
        return texelFetch( colorsTexture, ivec2( x, y ), 0 );
      }
    #else
      flat varying vec3 vColor;

      vec3 getColorTexture() {
        int size = textureSize( colorsTexture, 0 ).x;
        int j = int( instanceIndex );
        int x = j % size;
        int y = j / size;
        return texelFetch( colorsTexture, ivec2( x, y ), 0 ).rgb;
      }
    #endif
  #endif
#endif
`;
