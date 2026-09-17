import { BackSide, BufferAttribute, type BufferGeometry, Color, MeshBasicMaterial, type Material, type WebGLProgramParametersWithUniforms } from "three";

/** Shared boot progress for the whole scene: 0 = phosphor schematic, 1 = surface. */
export const bootProgress = { value: 1 };

export type CelOptions = {
  /** Atlas grid the instance's `atlasOffset` uniform indexes into. */
  atlas?: { cols: number; rows: number; tileSize?: number };
  /** Shared boot progress: 0 = phosphor schematic, 1 = finished surface. */
  boot: { value: number };
  phosphor: Color;
  /** Rim intensity of the phosphor edge term. */
  rim?: number;
  /** Final cel multiplier: <1 makes the body absorb light (matte rock). */
  gain?: number;
  /** Albedo lift: raises dark bodies (planets, rocks) so their hue reads. */
  lift?: number;
};

/* Cel shading + atlas sampling, patched into the material's shader. The
   InstancedMesh2 library chains `onBeforeCompile`, so the per-instance
   `atlasOffset` varying it injects stays available here. */
export function patchCelMaterial(material: Material, options: CelOptions): void {
  const base = material.onBeforeCompile;
  const rim = (options.rim ?? 0.32).toFixed(2);
  const lift = (options.lift ?? 0).toFixed(3);

  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms, renderer) => {
    base?.call(material, shader, renderer);

    shader.uniforms.uBoot = options.boot;
    shader.uniforms.uPhosphor = { value: options.phosphor };

    if (options.atlas && shader.fragmentShader.includes("atlasOffset")) {
      const tileSize = options.atlas.tileSize ?? 256;
      const pad = (2 / tileSize).toFixed(5);
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        `#ifdef USE_MAP
          /* Inset by two texels so filtering never bleeds the neighbouring tile. */
          vec2 ezTileUv = vMapUv * vec2(${(1 / options.atlas.cols).toFixed(4)}, ${(1 / options.atlas.rows).toFixed(4)});
          ezTileUv = ezTileUv * ${(1 - 4 / tileSize).toFixed(5)} + vec2(${pad}, ${pad});
          vec4 sampledDiffuseColor = texture2D(map, ezTileUv + atlasOffset);
          diffuseColor *= sampledDiffuseColor;
        #endif`
      );
    }

    if (!shader.fragmentShader.includes("#include <opaque_fragment>")) return;

    /* MeshBasicMaterial (smoke, rocks) never includes the normal chunk. It gets
       no band and no rim — only the atlas sampling above, the boot mix and its
       flat albedo. Lambert materials (planets, crystals, ship) take the cel path. */
    const lit = shader.fragmentShader.includes("#include <normal_fragment_begin>");

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
         uniform float uBoot;
         uniform vec3 uPhosphor;`
      )
      .replace(
        "#include <opaque_fragment>",
        lit
          ? `/* Toon: four hard bands, no specular — the void lights, nothing reflects.
           The band comes from the light factor (lit / albedo); the fill is the
           albedo hue at a quantised level, so a lit surface steps in four flats.
           The rim is a hard step added after the quantisation, never a gradient. */
         float ezRim = step(0.4, pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 3.0));
         float ezLum = dot(outgoingLight, vec3(0.299, 0.587, 0.114));
         float ezAlb = max(dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114)), 0.0001);
         float ezShade = ezLum / ezAlb;
         float ezTone = ezShade / (ezShade + 0.45);
         float ezBand = step(0.25, ezTone) * 0.30 + step(0.5, ezTone) * 0.32 + step(0.72, ezTone) * 0.38;
         float ezLevel = (ezAlb + ${lift}) * (0.55 + ezBand * 0.9);
         vec3 ezCel = (diffuseColor.rgb / ezAlb) * ezLevel;
         ezCel += uPhosphor * ezRim * ${rim};
         vec3 ezSchematic = uPhosphor * (0.25 + ezBand * 0.6) * ${(options.gain ?? 1).toFixed(2)};
         gl_FragColor = vec4(mix(ezSchematic, ezCel, uBoot), diffuseColor.a);`
          : `/* Unlit: no normals, no bands, no rim — the albedo is the colour. */
         gl_FragColor = vec4(mix(uPhosphor * 0.6, diffuseColor.rgb, uBoot), diffuseColor.a);`
      );
  };

  const key = `cel|${options.atlas ? `${options.atlas.cols}x${options.atlas.rows}` : "flat"}|${rim}|${lift}`;
  const baseKey = material.customProgramCacheKey;
  material.customProgramCacheKey = () => `${key}|${baseKey ? baseKey.call(material) : ""}`;
  material.needsUpdate = true;
}

/* Flat-shaded low-poly geometries duplicate their vertices, so pushing along
   the face normal splits the hull at every edge and leaves gaps at the
   vertices. Average the normals per position once and push along that. */
export function prepareOutlineGeometry(geometry: BufferGeometry): void {
  if (geometry.getAttribute("aOutlineNormal")) return;
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  if (!position || !normal) return;

  const keyOf = (i: number) =>
    `${position.getX(i).toFixed(4)},${position.getY(i).toFixed(4)},${position.getZ(i).toFixed(4)}`;
  const sums = new Map<string, { x: number; y: number; z: number }>();
  for (let i = 0; i < position.count; i++) {
    const key = keyOf(i);
    const sum = sums.get(key) ?? { x: 0, y: 0, z: 0 };
    sum.x += normal.getX(i);
    sum.y += normal.getY(i);
    sum.z += normal.getZ(i);
    sums.set(key, sum);
  }

  const averaged = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const sum = sums.get(keyOf(i)) as { x: number; y: number; z: number };
    const length = Math.hypot(sum.x, sum.y, sum.z) || 1;
    averaged[i * 3] = sum.x / length;
    averaged[i * 3 + 1] = sum.y / length;
    averaged[i * 3 + 2] = sum.z / length;
  }
  geometry.setAttribute("aOutlineNormal", new BufferAttribute(averaged, 3));
}

/* Anime ink outline: a black back-face hull pushed along the averaged normals
   in the vertex shader. Same geometry, one extra draw call, zero CPU per frame. */
export function outlineMaterial(width = 0.07, color = 0x05090b): MeshBasicMaterial {
  const material = new MeshBasicMaterial({ color, side: BackSide, toneMapped: false });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float uInk;\nattribute vec3 aOutlineNormal;"
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         vec3 ezOutline = length(aOutlineNormal) > 0.001 ? normalize(aOutlineNormal) : normalize(normal);
         transformed += ezOutline * uInk;`
      );
    shader.uniforms.uInk = { value: width };
  };
  material.customProgramCacheKey = () => `ink-${width}-${color}`;
  return material;
}
