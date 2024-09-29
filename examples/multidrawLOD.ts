import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { BufferGeometry, Camera, DataTexture, Group, Material, Matrix4, Mesh, Scene, ShaderMaterial, SphereGeometry, Vector3, WebGLProgramParametersWithUniforms, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BVHParams, createTexture_mat4, createTexture_uint, InstancedMeshBVH } from '../src/index.js';
import { BVHNode } from 'bvh.js';

class TestMaterial extends ShaderMaterial {
    public override vertexShader = `
        uniform highp sampler2D batchingTexture;
        uniform highp usampler2D batchingIdTexture;
        uniform int count;

        int getIndirectIndex( const in int i ) {
            int size = textureSize( batchingIdTexture, 0 ).x;
            int x = i % size;
            int y = i / size;
            return int( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
        }

        mat4 getBatchingMatrix( const in int i ) {
            int size = textureSize( batchingTexture, 0 ).x;
            int j = i * 4;
            int x = j % size;
            int y = j / size;
            vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
            vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
            vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
            vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
            return mat4( v1, v2, v3, v4 );
        }

        void main() {
            int offset = gl_DrawID * count;
            int index = getIndirectIndex( offset + gl_InstanceID );
            mat4 instanceMatrix = getBatchingMatrix( index );
            gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4( position, 1.0 );
        }
    `;

    public override fragmentShader = `
        void main() {
            gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 );
        }
    `;
}

export class BatchedMesh extends Mesh {
    public instancesCount: number; // rename count
    public bvh: InstancedMeshBVH;
    protected _geometryRange: Uint32Array = null;

    protected _matrixArray: Float32Array = null;
    protected _indirectArray: Uint32Array = null;

    protected _matricesTexture: DataTexture;
    protected _indirectTexture: DataTexture;

    // internal properties to use multidraw
    protected _multiDrawStarts: number[] = null;
    protected _multiDrawCounts: number[] = null;
    protected _multiDrawInstances: number[] = null;
    protected _multiDrawCount: number = null;

    // hack
    protected isBatchedMesh = true;
    protected _colorsTexture: DataTexture = null;

    constructor(count: number, levels: number) {
        super(new BufferGeometry(), new TestMaterial());

        this.instancesCount = count;

        (this.material as Material).onBeforeCompile = (parameters: WebGLProgramParametersWithUniforms, renderer: WebGLRenderer) => {
            parameters.uniforms.count = { value: this.instancesCount };
        }

        this._matricesTexture = createTexture_mat4(count);
        this._indirectTexture = createTexture_uint(count * levels);

        this._matrixArray = this._matricesTexture.image.data as unknown as Float32Array;
        this._indirectArray = this._indirectTexture.image.data as unknown as Uint32Array;

        this.createGeometry();

        this.updateMatrices(); // remove
    }

    override onBeforeRender(renderer: WebGLRenderer, scene: Scene, camera: Camera, geometry: BufferGeometry, material: Material, group: Group): void {
        _projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(this.matrixWorld);
        _invMatrixWorld.copy(this.matrixWorld).invert();
        _cameraPos.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(_invMatrixWorld);

        const indirect = this._indirectArray;

        const counts: number[] = [0, this.instancesCount]; // this.count * 2, this.count * 3, ecc

        this.bvh.frustumCulling(_projScreenMatrix, (node: BVHNode<{}, number>) => {
            const index = node.object;

            const distance = this.getPositionAt(index).distanceToSquared(_cameraPos); // distance can be get by BVH
            const level = distance > 10 ? 1 : 0;

            indirect[counts[level]++] = index;
        });

        this._indirectTexture.needsUpdate = true;

        const range = this._geometryRange;

        const multiDrawStarts = [];
        const multiDrawCounts = [];
        const multiDrawInstances = [];

        for (let i = 0; i < 2; i++) { // levels
            const count = counts[i] - (this.instancesCount * i);
            multiDrawStarts.push(range[i] * 2); // byte size = 2 (geometry index)
            multiDrawCounts.push(range[i + 1]);
            multiDrawInstances.push(count);
        }

        this._multiDrawStarts = multiDrawStarts;
        this._multiDrawCounts = multiDrawCounts;
        this._multiDrawInstances = multiDrawInstances;
        this._multiDrawCount = range.length - 1;
    }

    protected getPositionAt(index: number): Vector3 {
        const array = this._matrixArray;
        const offset = index * 16;
        _position.x = array[offset + 12];
        _position.y = array[offset + 13];
        _position.z = array[offset + 14];
        return _position;
    }

    protected createGeometry(): void {
        const sphereGeoLow = new SphereGeometry(0.5, 8, 4);
        const sphereGeoHigh = new SphereGeometry(0.5, 32, 16);

        this.geometry = mergeGeometries([sphereGeoHigh, sphereGeoLow])

        const range = new Uint32Array(2 + 1);
        range[0] = 0;
        range[1] = sphereGeoHigh.index.count;
        range[2] = sphereGeoLow.index.count;
        this._geometryRange = range;
    }

    protected updateMatrices(): void {
        const tempMatrix = new Matrix4().setPosition(new Vector3(-1.5, 0, 0));
        tempMatrix.toArray(this._matricesTexture.image.data, 0);
        tempMatrix.setPosition(new Vector3(-0.75, 0, 0));
        tempMatrix.toArray(this._matricesTexture.image.data, 16);
        tempMatrix.setPosition(new Vector3(0.75, 0, 0));
        tempMatrix.toArray(this._matricesTexture.image.data, 32);
        tempMatrix.setPosition(new Vector3(1.5, 0, 0));
        tempMatrix.toArray(this._matricesTexture.image.data, 48);

        this.computeBVH();
    }

    public computeBVH(config: BVHParams = {}): void {
        if (!this.bvh) this.bvh = new InstancedMeshBVH(this as any, config.margin, config.highPrecision);
        this.bvh.clear();
        this.bvh.create();
    }

    public setMatrixAt(id: number, matrix: Matrix4): void {
        matrix.toArray(this._matrixArray, id * 16);
        this._matricesTexture.needsUpdate = true; // TODO 
        this.bvh?.move(id);
    }

    public getMatrixAt(id: number, matrix = _tempMat4): Matrix4 {
        return matrix.fromArray(this._matrixArray, id * 16);
    }

}

const _projScreenMatrix = new Matrix4();
const _tempMat4 = new Matrix4();
const _cameraPos = new Vector3();
const _invMatrixWorld = new Matrix4();
const _position = new Vector3();

const mesh = new BatchedMesh(4, 2);
const scene = new Scene().add(mesh);
const camera = new PerspectiveCameraAuto(70).translateZ(2);
const main = new Main();
main.createView({ scene, camera, enabled: false });
const controls = new OrbitControls(camera, main.renderer.domElement);
