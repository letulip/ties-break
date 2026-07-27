// Types for scripts/optimize-art.mjs. The script stays plain ESM JS so `npm run art` works on
// any Node without a TS loader; vite.config.ts imports it, so it needs a declaration.

export interface OptimizeArtOptions {
  /**
   * Project root. The Vite plugin MUST pass `config.root`: the config is bundled by esbuild
   * before it runs, so `import.meta.url` inside the script would point at the bundle.
   */
  root?: string
  /** Where progress lines go. Defaults to console.log. */
  log?: (message: string) => void
}

export interface OptimizeArtResult {
  /** webp files written this run */
  encoded: number
  /** targets whose source bytes were unchanged (cache hit) */
  skipped: number
  /** raw masters moved out of public/ into art-src/ */
  evacuated: number
}

export declare function optimizeArt(options?: OptimizeArtOptions): Promise<OptimizeArtResult>
