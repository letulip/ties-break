/// <reference types="vite/client" />

/** The build-time switches this app reads. `vite/client` already types `import.meta.env` with an
 *  index signature, so these compile without the declaration - they are spelled out because a
 *  variable that changes what a build DOES should be findable by name, not only by grep. */
interface ImportMetaEnv {
  /** `'off'` in the e2e build: `src/pwa.ts` then never registers the service worker.
   *  Unset everywhere else, which is what a player's build gets. See e2e/README.md. */
  readonly VITE_TB_SW?: string
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}
