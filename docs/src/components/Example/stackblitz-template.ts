import packageJson from './stackblitz-files/stackblitz-package.json?raw'
import indexHtml from './stackblitz-files/index.html?raw'
import mainTs from './stackblitz-files/src/main.ts?raw'
import viteEnvDTs from './stackblitz-files/src/vite-env.d.ts?raw'
import tsconfigJson from './stackblitz-files/stackblitz-tsconfig.json?raw'
import tsconfigNodeJson from './stackblitz-files/stackblitz-tsconfigNode.json?raw'
import viteConfigTs from './stackblitz-files/stackblitz-vite.config.ts?raw'

export const files = {
  'package.json': packageJson,
  'index.html': indexHtml,
  'tsconfig.json': tsconfigJson,
  'tsconfig.node.json': tsconfigNodeJson,
  'vite.config.ts': viteConfigTs,
  //src
  'src/main.ts': mainTs,
  'src/vite-env.d.ts': viteEnvDTs,
  //$lib
}
