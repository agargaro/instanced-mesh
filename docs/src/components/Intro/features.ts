/* Library capabilities as discoverable waypoints. Every entry maps to a real
   docs page, so the compass doubles as the tutorial's table of contents. */

export type LibraryFeature = {
  id: string;
  label: string;
  blurb: string;
  href: string;
};

export const LIBRARY_FEATURES: LibraryFeature[] = [
  {
    id: "add-remove",
    label: "Add / Remove",
    blurb: "Buffers grow on demand; instances are added and removed at runtime.",
    href: "/instanced-mesh/basics/00-add-remove/",
  },
  {
    id: "entity",
    label: "InstancedEntity",
    blurb: "One entity per instance: position, scale, rotation, and helpers.",
    href: "/instanced-mesh/basics/01-Instancedentity/",
  },
  {
    id: "animation",
    label: "Animation",
    blurb: "updateInstances rewrites only what changed, once per frame.",
    href: "/instanced-mesh/basics/02-animation/",
  },
  {
    id: "euler",
    label: "Euler Rotation",
    blurb: "Opt-in Euler rotation on entities (allowsEuler) instead of quaternions.",
    href: "/instanced-mesh/basics/03-euler/",
  },
  {
    id: "tween",
    label: "Tween",
    blurb: "Tween any instance property with the bundled tween manager.",
    href: "/instanced-mesh/basics/04-tween/",
  },
  {
    id: "custom-data",
    label: "Custom Data",
    blurb: "Attach your own per-instance data to every entity.",
    href: "/instanced-mesh/basics/05-custom-data/",
  },
  {
    id: "frustum-culling",
    label: "Frustum Culling",
    blurb: "Instances outside the camera frustum are never submitted.",
    href: "/instanced-mesh/basics/06-frustum-culling/",
  },
  {
    id: "sorting",
    label: "Sorting",
    blurb: "Radix sort for overdraw and transparent ordering.",
    href: "/instanced-mesh/basics/07-sorting/",
  },
  {
    id: "raycasting",
    label: "Raycasting",
    blurb: "Pick instances with linear or BVH-accelerated raycasts.",
    href: "/instanced-mesh/basics/08-raycasting/",
  },
];
