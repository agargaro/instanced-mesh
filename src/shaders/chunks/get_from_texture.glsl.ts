export default /* glsl */`
  float getFloatFromTexture( sampler2D texture, const in uint i ) {
    int size = textureSize( texture, 0 ).x;
    int j = int( i );
    int x = j % size;
    int y = j / size;
    return float( texelFetch( texture, ivec2( x, y ), 0 ).r );
  }

  vec2 getVec2FromTexture( sampler2D texture, const in uint i ) {
    int size = textureSize( texture, 0 ).x;
    int j = int( i );
    int x = j % size;
    int y = j / size;
    return texelFetch( texture, ivec2( x, y ), 0 ).rg;
  }

    vec3 getVec3FromTexture( sampler2D texture, const in uint i ) {
    int size = textureSize( texture, 0 ).x;
    int j = int( i );
    int x = j % size;
    int y = j / size;
    return texelFetch( texture, ivec2( x, y ), 0 ).rgb;
  }

    vec4 getVec4FromTexture( sampler2D texture, const in uint i ) {
    int size = textureSize( texture, 0 ).x;
    int j = int( i );
    int x = j % size;
    int y = j / size;
    return texelFetch( texture, ivec2( x, y ), 0 );
  }

  mat3 getMat3FromTexture( sampler2D texture, const in uint i ) {
    int size = textureSize( texture, 0 ).x;
    int j = int( i ) * 3;
    int x = j % size;
    int y = j / size;
    vec4 v1 = texelFetch( texture, ivec2( x, y ), 0 );
    vec4 v2 = texelFetch( texture, ivec2( x + 1, y ), 0 );
    vec4 v3 = texelFetch( texture, ivec2( x + 2, y ), 0 );
    return mat3( v1, v2, v3);
  }

  mat4 getMat4FromTexture( sampler2D texture, const in uint i ) {
    int size = textureSize( texture, 0 ).x;
    int j = int( i ) * 4;
    int x = j % size;
    int y = j / size;
    vec4 v1 = texelFetch( texture, ivec2( x, y ), 0 );
    vec4 v2 = texelFetch( texture, ivec2( x + 1, y ), 0 );
    vec4 v3 = texelFetch( texture, ivec2( x + 2, y ), 0 );
    vec4 v4 = texelFetch( texture, ivec2( x + 3, y ), 0 );
    return mat4( v1, v2, v3, v4 );
  }
`;

// TODO remove