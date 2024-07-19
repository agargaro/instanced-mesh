export default /* glsl */`
#ifdef USE_INSTANCING_INDIRECT
	mat4 instanceMatrix = getMat4FromTexture( instanceTexture, instanceIndex );
#endif
`;