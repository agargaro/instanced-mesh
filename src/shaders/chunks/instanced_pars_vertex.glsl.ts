export default /* glsl */`
#ifdef USE_INSTANCING_INDIRECT
	attribute uint instanceIndex;
	uniform highp sampler2D instanceTexture;
#endif
`;