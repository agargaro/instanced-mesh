# Contributing to Documentation

This guide explains how to add and maintain documentation for this project, following the [Diátaxis](https://diataxis.fr/) framework principles.

## Documentation Types

We organize documentation into:

- **Tutorials**: Step-by-step lessons for beginners
- **How-to Guides**: Practical guides in `src/content/docs/guides/`
- **Reference**: Technical details in `src/content/docs/reference/`
- **Explanation**: Concept discussions and background

## Adding Documentation Pages

1. Choose appropriate directory based on content type:

   ```
   src/content/docs/guides/     # For how-to guides
   src/content/docs/reference/  # For technical reference
   src/content/docs/tutorials/  # For tutorials
   src/content/docs/concepts/   # For explanations
   ```

2. Add required frontmatter:
   ```md
   ---
   title: Your Page Title
   description: Brief description
   ---
   ```

## Adding Code Examples

1. Create your example:

   ```bash
   code src/examples/myExample/index.ts
   ```

   > **Note**: Maximum 2 levels of nesting allowed. Deeper nesting is not supported.

2. Write your Three.js code in `index.ts`:

   ```typescript
   import { Scene, PerspectiveCamera } from 'three';

   // Your Three.js example code here
   ```

   > **Note**: you can also import from local files, like `import { MyComponent } from './MyComponent'`.

3. Reference in docs with:

   ```md
   <Example path="myExample" />
   ```

   | Prop             | Type    | Default  | Description                             |
   | ---------------- | ------- | -------- | --------------------------------------- |
   | `path`           | string  | required | Directory path relative to src/examples |
   | `hideCode`       | boolean | `false`  | Hides the source code section           |
   | `hidePreview`    | boolean | `false`  | Hides the example preview               |
   | `hideStackblitz` | boolean | `false`  | Hides "Open in Stackblitz" button       |

   > **Note**: You can see the example in full screen in path `http://localhost:4321/instanced-mesh/examples/<ExampleName>`

## Example Guidelines

### Keep It Simple

- Focus on one concept per example
- Add clear code comments
- Avoid mixing multiple complex features

### Use Clear Names

- Use descriptive directory names (e.g. `frustum-culling`)
- Follow kebab-case for directory names
- Avoid generic names

### Development

1. Available scripts:

   ```bash
   npm run dev     # Dev mode with hot reload
   npm run start   # Production preview
   npm run build   # Production build
   ```

   > **Note**: all of those scripts build the examples, in the public folder.

### Dependencies

- Examples use import maps in `[...slug].astro`
### Dependencies

- Examples use import maps in `[...slug].astro`
- Pre-configured libraries:
    - `three`
    - `@three.ez/main`
    - `@three.ez/instanced-mesh`
    - `three/examples/jsm/`
    - `bvh.js`
- Add new dependencies to `importmap` if needed.
