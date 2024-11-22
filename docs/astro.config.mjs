// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightTypeDoc, { typeDocSidebarGroup } from 'starlight-typedoc';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			plugins: [
				// Generate the documentation.
				starlightTypeDoc({
					entryPoints: ['../src/index.ts'],
					typeDoc: {
						skipErrorChecking: true,
					},
					tsconfig: '../tsconfig.doc.json',
				}),
			],
			title: 'Instanced Mesh Docs',
			social: {
				github: 'https://github.com/agargaro/instanced-mesh',
				discord: 'https://discord.gg/MVTwrdX3JM',
			},
			sidebar: [
				{
					label: 'Guides',
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: 'Example Guide', slug: 'guides/example' },
					],
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
				// Add the generated sidebar group to the sidebar.
				typeDocSidebarGroup,
			],
		}),
	],
});
