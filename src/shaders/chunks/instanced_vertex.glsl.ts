export default /* glsl */`
#ifdef USE_INSTANCING_INDIRECT
	mat4 instanceMatrix = getMat4FromTexture( matricesTexture, instanceIndex );

	#ifdef USE_INSTANCING_COLOR_INDIRECT
		vec3 instanceColor = getVec3FromTexture( colorsTexture, instanceIndex );
		vColor.xyz *= instanceColor.xyz;
	#endif
#endif
`;