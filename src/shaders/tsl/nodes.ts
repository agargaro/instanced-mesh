import { Fn, instanceIndex, int, ivec2, mat4, textureSize, uniform, vec4 } from 'three/tsl';


export const getColorTexture = (colorsTexture) => {
    const size = int(textureSize(colorsTexture, int(0)).x).toVar();
    const j = int(instanceIndex).toVar();
    const x = int(j.mod(size)).toVar();
    const y = int( j.div( size ) ).toVar();
    return colorsTexture.sample( ivec2( x, y ) ).setSampler( false );
};


export const getInstancedMatrix = (matricesTexture) => {
	const size = int( textureSize( matricesTexture, int( 0 ) ).x ).toVar();
	const j = int( int( instanceIndex ).mul( int( 4 ) ) ).toVar();
	const x = int( j.mod( size ) ).toVar();
	const y = int( j.div( size ) ).toVar();
	const v1 = vec4( matricesTexture.sample( ivec2( x, y ) ).setSampler( false ) ).toVar();
	const v2 = vec4( matricesTexture.sample( ivec2( x.add( int( 1 ) ), y ) ).setSampler( false ) ).toVar();
	const v3 = vec4( matricesTexture.sample( ivec2( x.add( int( 2 ) ), y ) ).setSampler( false ) ).toVar();
	const v4 = vec4( matricesTexture.sample( ivec2( x.add( int( 3 ) ), y ) ).setSampler( false ) ).toVar();
	return mat4( v1, v2, v3, v4 );
};


export const getBoneMatrix = (boneTexture) => Fn((i) => {
	const bonesPerInstance = uniform( 'int' );

	const size = int( textureSize( boneTexture, int( 0 ) ).x ).toVar();
	const j = int( bonesPerInstance.mul( int( instanceIndex ) ).add( int( i ) ).mul( int( 4 ) ) ).toVar();
	const x = int( j.mod( size ) ).toVar();
	const y = int( j.div( size ) ).toVar();
	const v1 = vec4( boneTexture.sample( ivec2( x, y ) ).setSampler( false ) ).toVar();
	const v2 = vec4( boneTexture.sample( ivec2( x.add( int( 1 ) ), y ) ).setSampler( false ) ).toVar();
	const v3 = vec4( boneTexture.sample( ivec2( x.add( int( 2 ) ), y ) ).setSampler( false ) ).toVar();
	const v4 = vec4( boneTexture.sample( ivec2( x.add( int( 3 ) ), y ) ).setSampler( false ) ).toVar();

	return mat4( v1, v2, v3, v4 );
});
