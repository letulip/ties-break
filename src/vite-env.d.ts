/// <reference types="vite/client" />

/** The build-time switches this app reads. `vite/client` already types `import.meta.env` with an
 *  index signature, so these compile without the declaration - they are spelled out because a
 *  variable that changes what a build DOES should be findable by name, not only by grep. */
interface ImportMetaEnv {
  /** `'off'` in the e2e build: `src/pwa.ts` then never registers the service worker.
   *  Unset everywhere else, which is what a player's build gets. See e2e/README.md. */
  readonly VITE_TB_SW?: string

  /** THE BUILD STAMP (round 29 #19) – the commit this bundle was built from, 7 hex characters, or
   *  `unknown`. Set by vite.config.ts at config load from scripts/build-stamp.mjs; `vite build`
   *  rewrites every read into a string literal, so it is a fact about these bytes rather than a
   *  lookup. Optional because a bundle produced by anything that does not run our config has no
   *  business pretending it knows – `src/buildStamp.ts` is the one reader and it falls back. */
  readonly VITE_BUILD_SHA?: string

  /** The day this bundle was built, `YYYY-MM-DD` UTC, or absent. Same provenance as
   *  `VITE_BUILD_SHA`. */
  readonly VITE_BUILD_DATE?: string
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}
