export default /* glsl */`
#ifdef USE_INSTANCING_INDIRECT
	uint instanceIndex = getUIntFromTexture( indicesTexture, gl_InstanceID ); // TODO spaziature
	mat4 instanceMatrix = getMat4FromTexture( matricesTexture, instanceIndex );

	#ifdef USE_INSTANCING_COLOR_INDIRECT
		vec3 instanceColor = getVec3FromTexture( colorsTexture, instanceIndex );
		vColor.xyz *= instanceColor.xyz;
	#endif
#endif
`;