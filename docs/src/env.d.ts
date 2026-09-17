/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

/* WICG html-in-canvas attributes; not in Astro's JSX types yet. */
declare namespace astroHTML.JSX {
  interface HTMLAttributes {
    drawable?: boolean | string | undefined | null;
  }

  interface CanvasHTMLAttributes {
    content?: 'fallback' | 'drawable' | string | undefined | null;
    layoutsubtree?: boolean | string | undefined | null;
  }
}
