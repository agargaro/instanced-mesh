// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightTypeDoc, { typeDocSidebarGroup } from 'starlight-typedoc';
import AutoImport from 'astro-auto-import';
import { resolve } from 'path';
import mdx from '@astrojs/mdx';
import { celRetinoDark, celRetinoLight } from './src/styles/code-theme.mjs';
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
      // Cel & Retino code register: the world's own syntax theme (see
      // src/styles/code-theme.mjs). The palette is hand-audited, so the
      // automatic contrast fixer must not re-value the token colors.
      expressiveCode: {
        themes: [celRetinoDark, celRetinoLight],
        minSyntaxHighlightingColorContrast: 0,
        // The world draws depth with lines, not cast shadows; the stock
        // frame lift would also read as a nested card on the sheet.
        styleOverrides: {
          frames: { frameBoxShadowCssValue: 'none' },
        },
      },
      components: {
        Head: './src/components/Head.astro',
        Hero: './src/components/Hero.astro',
        Header: './src/components/shell/Header.astro',
        Footer: './src/components/shell/Footer.astro',
        MobileMenuFooter: './src/components/shell/MobileMenuFooter.astro',
        PageTitle: './src/components/shell/PageTitle.astro',
      },
      logo: {
        src: './src/assets/samoyed-mascot.png',
        alt: 'logo-samoyed-mascot',
      },
      favicon: './favicon.ico',
      customCss: [
        // Self-hosted typefaces: Anton (display), Inter (body), JetBrains Mono (notation).
        '@fontsource/anton',
        '@fontsource-variable/inter',
        '@fontsource-variable/jetbrains-mono',
        // Cel & Retino: the incumbent sheet theme, then the world layer.
        './src/styles/theme.css',
        './src/styles/world.css',
      ],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/agargaro/instanced-mesh' },
        { icon: 'discord', label: 'Discord', href: 'https://discord.gg/MVTwrdX3JM' },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [{ autogenerate: { directory: 'getting-started' } }],
        },
        {
          label: 'Basics',
          items: [{ autogenerate: { directory: 'basics' } }],
        },
        {
          label: 'Advanced',
          items: [{ autogenerate: { directory: 'advanced' } }],
        },
        {
          label: 'More',
          items: [{ autogenerate: { directory: 'more' } }],
        },
        // {
        //   label: 'Reference',
        //   items: [{ autogenerate: { directory: 'reference' } }],
        // },
        // Add the generated sidebar group to the sidebar.
        typeDocSidebarGroup,
      ],
    }),
    // Make sure the MDX integration is included AFTER astro-auto-import
    mdx(),
  ],
});
