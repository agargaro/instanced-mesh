export default /* glsl */`
#ifdef USE_INSTANCING_INDIRECT
	uniform highp usampler2D indicesTexture;
	uniform highp sampler2D matricesTexture;

	#ifdef USE_INSTANCING_COLOR_INDIRECT
		uniform highp sampler2D colorsTexture;
	#endif
#endif
`;