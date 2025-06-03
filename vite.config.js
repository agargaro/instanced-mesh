import { resolve } from 'path';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { externalizeDeps } from 'vite-plugin-externalize-deps';
import glsl from 'vite-plugin-glsl';

export default defineConfig(({ command }) => ({
  publicDir: command === 'build' ? false : 'public',
  resolve: {
    alias: {
      '@three.ez/instanced-mesh': resolve(__dirname, 'src/index.ts')
    }
  },
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: 'build/index',
      formats: ['es', 'cjs']
    }
  },
  plugins: [
    glsl(),
    externalizeDeps(),
    viteStaticCopy({
      targets: [{
        src: ['LICENSE', 'package.json', 'README.md'],
        dest: './'
      }]
    })
  ]
}));
