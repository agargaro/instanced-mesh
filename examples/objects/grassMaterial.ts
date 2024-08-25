import { Color, ColorRepresentation, MeshPhongMaterial, Texture } from "three";

export interface GrassMaterialParameters {
    curve?: number;
    height?: number;
    width?: number;
    topColor?: ColorRepresentation;
    bottomColor?: ColorRepresentation;
    occlusionColor?: ColorRepresentation;
    windNoiseMap?: Texture;
    windForce?: number;
    windFreq?: number;
}

export class GrassMaterial extends MeshPhongMaterial {
    public isGrassMaterialMaterial = true;
    public time = { value: 0 };

    public vertexShader = `
        #define PHONG
        varying vec3 vViewPosition;
        #include <common>
        #include <batching_pars_vertex>
        #include <uv_pars_vertex>
        #include <displacementmap_pars_vertex>
        #include <envmap_pars_vertex>
        #include <color_pars_vertex>
        #include <fog_pars_vertex>
        #include <normal_pars_vertex>
        #include <morphtarget_pars_vertex>
        #include <skinning_pars_vertex>
        #include <shadowmap_pars_vertex>
        #include <logdepthbuf_pars_vertex>
        #include <clipping_planes_pars_vertex>

        mat3 rotateX(float angle) {
            float s = sin(angle);
            float c = cos(angle);
            return mat3(
                vec3(1, 0, 0),
                vec3(0, c, -s),
                vec3(0, s, c)
            );
        }

        mat3 rotateZ(float angle) {
            float s = sin(angle);
            float c = cos(angle);
            return mat3(
            c, s, 0.0,
            -s, c, 0.0,
            0.0, 0.0, 1.0
            );
        }

        float easeInSine(float x) {
            return 1. - cos((x * PI) / 2.);
        }

        varying float vHeightPercent;
        uniform float height;
        uniform float width;
        uniform float curve;
        uniform float time;
        uniform sampler2D windNoiseMap;
        uniform float windForce;
        uniform float windFreq;

        void main() {
            #include <uv_vertex>
            #include <color_vertex>
            #include <morphcolor_vertex>
            #include <batching_vertex>
            #include <beginnormal_vertex>
            #include <morphinstance_vertex>
            #include <morphnormal_vertex>
            #include <skinbase_vertex>
            #include <skinnormal_vertex>
            #include <defaultnormal_vertex>

            vHeightPercent = position.y / height;
            vec2 pos = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
            float curveAmount = vHeightPercent * curve; // aggiungere rumore
            float wind = vHeightPercent * windForce * easeInSine(abs(sin(time * windFreq * rand(vec2(pos.x, pos.y)))));
            
            mat3 rotation = rotateX(curveAmount) * rotateZ(wind);
            // transformedNormal *= rotation;

            #include <normal_vertex>
            #include <begin_vertex>

            transformed *= rotation;

            #include <morphtarget_vertex>
            #include <skinning_vertex>
            #include <displacementmap_vertex>
            #include <project_vertex>
            #include <logdepthbuf_vertex>
            #include <clipping_planes_vertex>
            vViewPosition = - mvPosition.xyz;
            #include <worldpos_vertex>
            #include <envmap_vertex>
            #include <shadowmap_vertex>
            #include <fog_vertex>

        }`;

    public fragmentShader = `
       #define PHONG
        uniform vec3 emissive;
        uniform vec3 specular;
        uniform float shininess;
        uniform float opacity;
        #include <common>
        #include <packing>
        #include <dithering_pars_fragment>
        #include <color_pars_fragment>
        #include <uv_pars_fragment>
        #include <map_pars_fragment>
        #include <alphamap_pars_fragment>
        #include <alphatest_pars_fragment>
        #include <alphahash_pars_fragment>
        #include <aomap_pars_fragment>
        #include <lightmap_pars_fragment>
        #include <emissivemap_pars_fragment>
        #include <envmap_common_pars_fragment>
        #include <envmap_pars_fragment>
        #include <fog_pars_fragment>
        #include <bsdfs>
        #include <lights_pars_begin>
        #include <normal_pars_fragment>
        #include <lights_phong_pars_fragment>
        #include <shadowmap_pars_fragment>
        #include <bumpmap_pars_fragment>
        #include <normalmap_pars_fragment>
        #include <specularmap_pars_fragment>
        #include <logdepthbuf_pars_fragment>
        #include <clipping_planes_pars_fragment>

        uniform vec3 bottomColor;
        uniform vec3 topColor;
        uniform vec3 occlusionColor;
        varying float vHeightPercent;

        void main() {

            vec3 mixedColor = mix(bottomColor, topColor, vHeightPercent);
            float occlusionPercent = vHeightPercent * 5.; // start from 20%
            vec4 diffuseColor = vec4( mix(occlusionColor, mixedColor, occlusionPercent), opacity );

            #include <clipping_planes_fragment>
            ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
            vec3 totalEmissiveRadiance = emissive;
            #include <logdepthbuf_fragment>
            #include <map_fragment>
            #include <color_fragment>
            #include <alphamap_fragment>
            #include <alphatest_fragment>
            #include <alphahash_fragment>
            #include <specularmap_fragment>
            #include <normal_fragment_begin>
            #include <normal_fragment_maps>
            #include <emissivemap_fragment>
            #include <lights_phong_fragment>
            #include <lights_fragment_begin>
            #include <lights_fragment_maps>
            #include <lights_fragment_end>
            #include <aomap_fragment>
            vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
            #include <envmap_fragment>
            #include <opaque_fragment>
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
            #include <fog_fragment>
            #include <premultiplied_alpha_fragment>
            #include <dithering_fragment>
        }`;

    constructor(parameters: GrassMaterialParameters = {}) {
        super();

        this.onBeforeCompile = (p) => {
            p.vertexShader = this.vertexShader;
            p.fragmentShader = this.fragmentShader;

            p.uniforms.time = this.time;
            p.uniforms.curve = { value: parameters.curve ?? 0.5 };
            p.uniforms.height = { value: parameters.height ?? 1.5 };
            p.uniforms.width = { value: parameters.width ?? 0.1 };
            p.uniforms.topColor = { value: parameters.topColor ?? new Color(0x017a31) };
            p.uniforms.bottomColor = { value: parameters.bottomColor ?? new Color(0x015e26) };
            p.uniforms.occlusionColor = { value: parameters.occlusionColor ?? new Color(0x003b17) };
            p.uniforms.windNoiseMap = { value: parameters.windNoiseMap ?? undefined }; // TODO generate
            p.uniforms.windForce = { value: parameters.windForce ?? 0.05 }; 
            p.uniforms.windFreq = { value: parameters.windFreq ?? 2 };
        };
    }

    // fix... public override copy(source: GrassMaterial): this {
}
