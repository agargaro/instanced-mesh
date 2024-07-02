export default /* glsl */`
#ifdef USE_INSTANCING_INDIRECT
	mat4 instanceMatrix = getInstanceMatrix( instanceIndex );
#endif
`;