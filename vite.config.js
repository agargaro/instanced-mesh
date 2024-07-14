import { resolve } from 'path';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import dts from 'vite-plugin-dts';
import { externalizeDeps } from 'vite-plugin-externalize-deps'

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'InstancedMesh',
      fileName: 'index',
      formats: ['es', 'umd'],
    },
  },
  rollupOptions: {
    external: ['three', 'bvh.js'],
    output: {
      globals: {
        three: 'three',
        'bvh.js': 'bvh.js'
      }
    }
  },
  plugins: [
    externalizeDeps(),
    dts({ tsconfigPath: 'tsconfig.build.json' }),
    viteStaticCopy({
      targets: [{
        src: ['LICENSE', 'package.json', 'README.md'],
        dest: './'
      }]
    })
  ]
})
