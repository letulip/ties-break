// THE CATALOGS – lazy, per locale, and tolerant of a file that does not exist yet (L1a).
//
// A catalog is a flat `key → message` object (`Catalog`). English has none – its key renders itself.
// Russian's will be `src/i18n/ru.json`, compiled from the owner's approved tables by the L1b importer;
// until that file exists `import.meta.glob` below simply finds nothing and the locale is `absent`:
// every key renders English and is counted as a miss (spec §6, ruling 4 as a number). Nothing here
// breaks the build for the lack of a file, which is why it is a glob and not `import('./ru.json')`.
//
// ⚠ THE GLOB NAMES THE LOCALES, IT DOES NOT SWEEP `./*.json`. L1b generates `catalog.en.json` (the key
// inventory with homes and placeholder lists) next to these, and a sweep would ship that file as a
// chunk to every player. Adding Spanish later is one more name in the braces.
//
// ⚠ A LOAD NEVER BLOCKS THE APP FOR LONG. `loadCatalog` resolves when the chunk arrives OR after
// `CATALOG_TIMEOUT_MS`, whichever is first, so an offline player whose chunk is not cached still
// reaches the game (in English, counted). A chunk that lands after the deadline is still installed –
// the state is reactive, so the screen re-renders in the language the player chose.
import { shallowRef } from 'vue'

export type Catalog = Readonly<Record<string, string>>
export type CatalogLoader = () => Promise<Catalog>
/** `absent` – no catalog exists for the locale; `failed` – one exists and did not load (retried on the next ask). */
export type CatalogStatus = 'idle' | 'loading' | 'ready' | 'absent' | 'failed'

export const CATALOG_TIMEOUT_MS = 4000

const CHUNKS = import.meta.glob<{ default: Catalog }>('./{ru,es}.json')

function defaultLoaders(): Map<string, CatalogLoader> {
  const loaders = new Map<string, CatalogLoader>()
  for (const [path, load] of Object.entries(CHUNKS)) {
    const m = /\/([a-z]+)\.json$/.exec(path)
    if (m?.[1]) loaders.set(m[1], () => load().then((mod) => mod.default))
  }
  return loaders
}

let loaders = defaultLoaders()
const inflight = new Map<string, Promise<void>>()
// Replaced, never mutated, so a read inside a render is a tracked dependency.
const catalogs = shallowRef<Readonly<Record<string, Catalog>>>({})
const statuses = shallowRef<Readonly<Record<string, CatalogStatus>>>({})

function setStatus(locale: string, status: CatalogStatus): void {
  statuses.value = { ...statuses.value, [locale]: status }
}

export function catalogFor(locale: string): Catalog | undefined {
  return catalogs.value[locale]
}

export function catalogStatus(locale: string): CatalogStatus {
  return statuses.value[locale] ?? 'idle'
}

/** Put a catalog in place directly – what a loader does on arrival, and what tests and the L1b pseudo-locale use. */
export function installCatalog(locale: string, entries: Catalog): void {
  catalogs.value = { ...catalogs.value, [locale]: entries }
  setStatus(locale, 'ready')
}

/** Teach the loader where a locale's catalog comes from (tests, the L1b pseudo-locale). */
export function registerCatalogLoader(locale: string, loader: CatalogLoader): void {
  loaders.set(locale, loader)
}

/** Resolve when `p` settles or `ms` pass – the arrival itself is never cancelled. */
function withDeadline(p: Promise<void>, ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms)
    void p.finally(() => {
      clearTimeout(timer)
      resolve()
    })
  })
}

export function loadCatalog(locale: string): Promise<void> {
  if (locale === 'en') return Promise.resolve()
  const status = catalogStatus(locale)
  if (status === 'ready' || status === 'absent') return Promise.resolve()
  const running = inflight.get(locale)
  if (running) return withDeadline(running, CATALOG_TIMEOUT_MS)
  const loader = loaders.get(locale)
  if (!loader) {
    setStatus(locale, 'absent')
    return Promise.resolve()
  }
  setStatus(locale, 'loading')
  const arrival = Promise.resolve()
    .then(() => loader())
    .then(
      (entries) => installCatalog(locale, entries),
      () => setStatus(locale, 'failed'),
    )
    .finally(() => {
      inflight.delete(locale)
    })
  inflight.set(locale, arrival)
  return withDeadline(arrival, CATALOG_TIMEOUT_MS)
}

export function resetCatalogsForTests(): void {
  catalogs.value = {}
  statuses.value = {}
  inflight.clear()
  loaders = defaultLoaders()
}
