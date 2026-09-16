// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightTypeDoc, { typeDocSidebarGroup } from 'starlight-typedoc';
import starlightLlmsTxt from 'starlight-llms-txt';
import AutoImport from 'astro-auto-import';
import { resolve } from 'path';
import mdx from '@astrojs/mdx';
// https://astro.build/config
export default defineConfig({
  site: 'https://agargaro.github.io/instanced-mesh',
  base: 'instanced-mesh',
  output: 'static',
  vite: {
    resolve: {
      alias: { $components: resolve('./src/components') },
    },
  },
  integrations: [
    AutoImport({
      imports: ['./src/components/Example/Example.astro'],
    }),
    starlight({
      plugins: [
        // Generate llms.txt / llms-full.txt / llms-small.txt for LLMs.
        starlightLlmsTxt({
          projectName: 'InstancedMesh2',
          description:
            'InstancedMesh2 (@three.ez/instanced-mesh) is a three.js library that enhances InstancedMesh with dynamic capacity, per-instance frustum culling, BVH-accelerated raycasting, sorting, per-instance visibility/opacity/uniforms, level of detail (LOD), shadow LOD and skinning.',
          promote: ['getting-started/**', 'basics/**'],
          optionalLinks: [
            { label: 'npm package', url: 'https://www.npmjs.com/package/@three.ez/instanced-mesh' },
            { label: 'GitHub repository', url: 'https://github.com/three-ez/instanced-mesh' },
            { label: 'Discord', url: 'https://discord.gg/MVTwrdX3JM' },
          ],
        }),
        // Generate the documentation.
        starlightTypeDoc({
          entryPoints: ['../src/index.ts'],
          typeDoc: {
            exclude: ['./examples/**/*'],
            skipErrorChecking: true,
            excludeExternals: true,
          },
          tsconfig: '../tsconfig.json',
        }),
      ],
      title: 'InstancedMesh2',
      logo: {
        src: './src/assets/samoyed-mascot.png',
        alt: 'logo-samoyed-mascot',
      },
      favicon: './favicon.ico',
      social: {
        github: 'https://github.com/agargaro/instanced-mesh',
        discord: 'https://discord.gg/MVTwrdX3JM',
      },
      sidebar: [
        {
          label: 'Getting Started',
          autogenerate: { directory: 'getting-started' },
        },
        {
          label: 'Basics',
          autogenerate: { directory: 'basics' },
        },
        {
          label: 'Advanced',
          autogenerate: { directory: 'advanced' },
        },
        {
          label: 'More',
          autogenerate: { directory: 'more' },
        },
        // {
        //   label: 'Reference',
        //   autogenerate: { directory: 'reference' },
        // },
        // Add the generated sidebar group to the sidebar.
        typeDocSidebarGroup,
      ],
    }),
    // Make sure the MDX integration is included AFTER astro-auto-import
    mdx(),
  ],
});
