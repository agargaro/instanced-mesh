export default /* glsl */`
#ifdef USE_INSTANCING_INDIRECT
	attribute uint instanceIndex;
	uniform highp sampler2D instanceTexture;
	mat4 getInstanceMatrix( const in uint i ) {
		int size = textureSize( instanceTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( instanceTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( instanceTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( instanceTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( instanceTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif
`;