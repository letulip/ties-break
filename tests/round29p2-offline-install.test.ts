// ⭐⭐ ROUND 29 PART TWO #7 – FULL OFFLINE: WHAT IS IN THE INSTALL, AND WHAT LEAVES THE PHONE.
//
// The owner, 29.08, overruling round 29 #2's conservative choice: «Запихнуть туда корты стоило бы
// +5108 КБ – это не очень большая цена, надо сделать, чтобы можно было полностью оффлайн играть без
// помех... Возможно все надо в установку PWA добавлять. А с обновлением догружать то, чего нет или
// обновлять то, что обновилось, а не весь сет.»
//
// ⚠ WHAT THIS FILE CANNOT DO, SAID FIRST. It cannot prove a file is on a device with the network
// gone – only `e2e/offline.spec.ts` can, and it does, from a real build with a real worker. Nor can
// it prove the SECOND install fetches one file rather than 205: that is a running browser answering
// a running server, and `tools/precache-delta.mjs` measures it (3 requests, 1 image, 120.8 KiB
// against a 12.3 MB precache; the `--arm=all` control reports 305 / 205 / 11.3 MB, so the counter
// can see the failure it is claiming did not happen).
//
// WHAT IT DOES HOLD is the pair of decisions underneath both of those, which are cheap to lose:
// what the install glob sweeps in, and the housekeeping that stops a phone paying twice.
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dropLegacyArtCaches, LEGACY_ART_CACHES } from '../src/pwa'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8')

/**
 * The extensions vite.config's `globPatterns` sweeps into the precache – READ OUT OF THE CONFIG.
 *
 * ⚠⚠ THE FIRST DRAFT WROTE THIS SET OUT BY HAND AND THE WHOLE FILE WAS A DEAD GUARD. Deleting
 * `webp` from `globPatterns` – the exact regression this file exists to catch, the one that would
 * take all 205 paintings back out of the install – left every test GREEN, because the fixture and
 * the claim were two copies of the same constant and the config was never consulted. Found by
 * mutation, which is the only way this class is ever found.
 */
const PRECACHED_EXT = (() => {
  const m = read('vite.config.ts').match(/globPatterns: \['\*\*\/\*\.\{([^}]+)\}'\]/)
  if (!m) throw new Error('globPatterns is no longer a single brace list – re-aim this reader')
  return new Set(m[1].split(',').map((e) => `.${e.trim()}`))
})()

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  )
}

const PUBLIC = walk(join(ROOT, 'public')).map((f) => ({
  rel: f.slice(join(ROOT, 'public').length + 1),
  bytes: statSync(f).size,
  precached: PRECACHED_EXT.has(extname(f)),
}))

const kib = (files: { bytes: number }[]) => files.reduce((a, f) => a + f.bytes, 0) / 1024

describe('round 29 part two #7 – the art is in the PWA install', () => {
  it('every painting under public/images is swept in – that IS the ruling', () => {
    const art = PUBLIC.filter((f) => f.rel.startsWith('images/'))
    const missed = art.filter((f) => !f.precached).map((f) => f.rel)
    // ⚠ The one allowed miss is the provenance manifest, and it is named rather than excused by an
    // extension rule: `images/README.md` answers the rights question for the whole directory
    // (P7 legal wave) and is not art. Anything else non-webp landing here is a master that escaped
    // `scripts/optimize-art.mjs`, and it would now ship to every player rather than merely sit in
    // dist/ – which is exactly what changed on 29.08.
    expect(missed).toEqual(['images/README.md'])
    expect(art.filter((f) => f.precached).length).toBeGreaterThanOrEqual(205)
  })

  it('the install budget has a ceiling, so an art wave cannot double it silently', () => {
    const inInstall = PUBLIC.filter((f) => f.precached)
    // Measured 29.08: 301 files / 11221 KiB from public/, which the build turns into 313 precache
    // entries / 12255 KiB once the hashed bundles and index.html join them.
    //
    // ⚠ A CEILING, NOT AN EQUALITY, AND THE DIFFERENCE IS THE WHOLE DESIGN. An exact pin goes red
    // every time the owner repaints a court, which trains everybody to re-aim it without reading –
    // and a pin nobody reads guards nothing. 16 MB is ~35% of headroom over today: a new age band
    // or a second venue set fits, and a set that doubles the install has to come and say so.
    expect(kib(inInstall)).toBeLessThan(16 * 1024)
    expect(inInstall.length).toBeGreaterThan(290)
  })

  it('audio stays OUT until he rules on it – not swept in by a widened glob', () => {
    // ⚠ HIS CALL, NOT A BUILDER'S, and the sizes are why it was put to him: music/theme.mp3 is
    // 2525 KiB for a loop that can be muted on the first screen, and the 24 match clips are 462 KiB
    // that make the difference between a silent match and a loud one offline. Reported in
    // docs/rounds/round-29.md part two #7 with both figures. If he says yes, add `mp3` to
    // `globPatterns` and re-aim this test with his ruling quoted – do not delete it.
    const audio = PUBLIC.filter((f) => f.rel.startsWith('music/') || f.rel.startsWith('sounds/'))
    expect(audio.some((f) => f.rel.endsWith('.mp3'))).toBe(true) // the fixture has something to say
    expect(audio.filter((f) => f.precached)).toEqual([])
    expect(read('vite.config.ts')).not.toMatch(/globPatterns:.*mp3/)
  })

  it('fonts are already in, and always were – nothing to decide there', () => {
    const fonts = PUBLIC.filter((f) => f.rel.startsWith('fonts/') && f.rel.endsWith('.woff2'))
    expect(fonts.length).toBe(4)
    expect(fonts.every((f) => f.precached)).toBe(true)
  })

  it('the two runtime art routes are gone from the config, not merely unused', () => {
    // ⚠ THE ASSERTION IS OVER `cacheName:`, NOT THE BARE NAME. Both strings still appear in
    // vite.config.ts and src/pwa.ts as prose explaining why they were removed and in
    // LEGACY_ART_CACHES, which is the list that deletes them. A word-level negative would fire on
    // its own documentation.
    const vite = read('vite.config.ts')
    for (const name of LEGACY_ART_CACHES) expect(vite).not.toContain(`cacheName: '${name}'`)
    expect(vite).not.toMatch(/^\s*runtimeCaching:/m)
  })
})

// =================================================================================================
// THE HOUSEKEEPING – a phone must not pay for the art twice.
// =================================================================================================
//
// `cleanupOutdatedCaches` prunes old PRECACHES and nothing else, so `tb-art-v1` (up to 80 paintings)
// and `tb-art-small-v1` (up to 48) survive every future update on a phone that installed before
// 29.08 – unreferenced, beside a 12 MB install.

/** A CacheStorage stand-in: `caches` does not exist in the node project, and mocking it is the test. */
function fakeCaches(shape: Record<string, string[]>): CacheStorage & { deleted: string[] } {
  const deleted: string[] = []
  return {
    deleted,
    keys: async () => Object.keys(shape),
    open: async (name: string) => ({
      keys: async () => (shape[name] ?? []).map((url) => new Request(`https://x.test${url}`)),
    }),
    delete: async (name: string) => {
      if (!(name in shape)) return false
      delete shape[name]
      deleted.push(name)
      return true
    },
  } as unknown as CacheStorage & { deleted: string[] }
}

const WITH_ART = {
  'workbox-precache-v2-https://x.test/': ['/index.html', '/images/fields/local-clay-1.webp'],
  'tb-art-v1': ['/images/fields/local-clay-1.webp'],
  'tb-art-small-v1': ['/images/trophies/wta250-gold.webp'],
}
const WITHOUT_ART = {
  'workbox-precache-v2-https://x.test/': ['/index.html', '/avatars/teen-norm.webp'],
  'tb-art-v1': ['/images/fields/local-clay-1.webp'],
  'tb-art-small-v1': ['/images/trophies/wta250-gold.webp'],
}

describe('dropLegacyArtCaches', () => {
  it('deletes both once the precache is answering for /images/', async () => {
    const store = fakeCaches({ ...WITH_ART })
    await expect(dropLegacyArtCaches(store)).resolves.toEqual(['tb-art-v1', 'tb-art-small-v1'])
  })

  it('deletes NOTHING while the old worker is still in charge – the safety property', async () => {
    // ⚠⚠ THIS IS THE ARM THAT MATTERS AND IT IS NOT A CORNER CASE. `registerType: 'prompt'` means a
    // player sits on the old worker until he taps Update – days, on a phone. On that worker the
    // runtime routes are still live and `tb-art-v1` holds the ONLY copy of a painting he has;
    // deleting it there blanks his feed offline. The two fixtures differ by one URL in the
    // precache, which is the fact the guard reads, and by nothing else.
    const store = fakeCaches({ ...WITHOUT_ART })
    await expect(dropLegacyArtCaches(store)).resolves.toEqual([])
    expect(store.deleted).toEqual([])
  })

  it('does nothing when there is no precache at all', async () => {
    const store = fakeCaches({ 'tb-art-v1': ['/images/x.webp'] })
    await expect(dropLegacyArtCaches(store)).resolves.toEqual([])
    expect(store.deleted).toEqual([])
  })

  it('an absent or hostile CacheStorage comes back empty, never thrown', async () => {
    // ⚠ THIS ARM IS DELIBERATELY ONE ARM AND IT WAS TWO. Split, the `undefined` half was a dead
    // assertion: deleting `if (!store) return []` left it green, because `store.keys()` on
    // `undefined` throws a TypeError that the same `catch` swallows, so the two halves were
    // measuring one mechanism through two doors. Merged, the claim is the one that matters on a
    // phone – housekeeping nobody asked for must never surface as an error – and it dies the moment
    // BOTH mechanisms go, which is honest about what it covers. Removing the `try/catch` alone
    // reddens it here (the hostile half); removing the early return alone does not, and the comment
    // in src/pwa.ts says so rather than leaving the next reader to re-discover it.
    const angry = {
      keys: async () => {
        throw new Error('storage blocked')
      },
    } as unknown as CacheStorage
    await expect(dropLegacyArtCaches(angry)).resolves.toEqual([])
    await expect(dropLegacyArtCaches(undefined)).resolves.toEqual([])
  })

  it('it is wired into initPwa, and not behind the e2e service-worker switch', () => {
    // A source pin for the same reason tests/pwa-update.test.ts uses one: the call sits next to
    // `registerSW`, which only exists as a virtual module inside a Vite build. What can go wrong is
    // somebody tidying the call away as housekeeping nobody asked for.
    const pwa = read('src/pwa.ts')
    expect(pwa).toMatch(/void dropLegacyArtCaches\(\)/)
    // ...and AFTER the VITE_TB_SW early return, so the e2e build that registers no worker also does
    // no cache surgery behind a spec's back.
    expect(pwa.indexOf('void dropLegacyArtCaches()')).toBeGreaterThan(
      pwa.indexOf("if (import.meta.env.VITE_TB_SW === 'off') return"),
    )
  })
})
