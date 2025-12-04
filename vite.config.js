import { resolve } from 'path';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { externalizeDeps } from 'vite-plugin-externalize-deps';
import glsl from 'vite-plugin-glsl';

export default defineConfig(({ command }) => ({
  publicDir: command === 'build' ? false : 'public',
  server: {
    watch: {
      ignored: ['**/playwright-report/**', '**/test-results/**']
    }
  },
  resolve: {
    alias: {
      '@three.ez/instanced-mesh': resolve(__dirname, 'src/index.ts'),
      '@three.ez/instanced-mesh/webgl': resolve(__dirname, 'src/index.webgl.ts'),
      '@three.ez/instanced-mesh/webgpu': resolve(__dirname, 'src/index.webgpu.ts'),
      '@three.ez/instanced-mesh/common': resolve(__dirname, 'src/index.common.ts')
    }
  },
  build: {
    sourcemap: true,
    lib: {
      entry: {
        'build/index': resolve(__dirname, 'src/index.ts'),
        'build/webgl': resolve(__dirname, 'src/index.webgl.ts'),
        'build/webgpu': resolve(__dirname, 'src/index.webgpu.ts'),
        'build/common': resolve(__dirname, 'src/index.common.ts')
      },
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      output: {
        // Ensure proper file naming for multiple entry points
        entryFileNames: '[name].[format].js',
        chunkFileNames: 'build/chunks/[name]-[hash].[format].js'
      }
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
