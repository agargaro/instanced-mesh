import indexHtml from './stackblitz-files/index.html?raw'
import packageJson from './stackblitz-files/stackblitz-package.json?raw'
import tsconfigJson from './stackblitz-files/stackblitz-tsconfig.json?raw'

export const files = {
  'package.json': packageJson,
  'index.html': indexHtml,
  'tsconfig.json': tsconfigJson,
}
