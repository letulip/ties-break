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
// ⚠ AND IT CANNOT MEASURE THE INSTALL EITHER, WHICH IS THE ONE THING IT LOOKED LIKE IT MEASURED
// (P-04, 05.09 review). `public/` is what a build COPIES; what a phone downloads is the service
// worker's precache, which is `public/` PLUS the hashed bundles, the stylesheet and index.html –
// 14,596 KiB against 15,755 KiB on this tree, so 1,159 KiB was invisible to the ceiling below.
// The unit project runs BEFORE `vite build` in `npm run check`, and in two CI jobs that never build
// at all, so no test in it can read that number: an assertion over `dist/` here would be green on
// an absent artefact, green on a stale one, or skipped. `scripts/install-size.mjs` reads it, one
// step after the build. What stays here is the wiring, so the ceiling cannot be quietly unwired.
//
// WHAT IT DOES HOLD is the pair of decisions underneath all of those, which are cheap to lose:
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

const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> }

/**
 * The ceiling itself, READ OUT OF THE GATE THAT ENFORCES IT – the owner's 16,384 KiB ruling of
 * 29.08, held in exactly one place.
 *
 * ⚠ Same reasoning as PRECACHED_EXT above, and the same failure it was found by: a number written
 * out by hand here and enforced in a script over there is two constants that agree right up until
 * they do not, and the one that goes stale is always the one in the test.
 */
const CEILING_KIB = (() => {
  const m = read('scripts/install-size.mjs').match(/const CEILING_KIB = (\d+) \* 1024\b/)
  if (!m) throw new Error('install-size.mjs no longer declares CEILING_KIB as N * 1024 – re-aim this reader')
  return Number(m[1]) * 1024
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

  it('the source half of the install cannot double silently – the cheap, offline half of the ceiling', () => {
    const inInstall = PUBLIC.filter((f) => f.precached)
    // ⚠⚠ THIS `it` USED TO BE THE CEILING, AND IT WAS READING 93 % OF THE NUMBER (P-04, 05.09).
    // Measured 29.08 it said «301 files / 11,221 KiB from public/, which the build turns into 313
    // precache entries / 12,255 KiB» – and then only ever checked the first of those two. On this
    // tree it is 350 files / 14,596 KiB from public/ against 356 entries / 15,755 KiB in the built
    // manifest, so 1,159 KiB of hashed bundles, stylesheet and index.html sat outside the guard.
    //
    // The ceiling now lives in `scripts/install-size.mjs`, one step after `vite build`, and the
    // test below pins it into the gate. THIS claim is deliberately the weaker one: it asserts
    // strictly less than the script does, it costs nothing, it is offline, and it fails four
    // seconds into `npm run check` rather than seven minutes in at the build.
    //
    // ⚠ A CEILING, NOT AN EQUALITY, AND THE DIFFERENCE IS THE WHOLE DESIGN. An exact pin goes red
    // every time the owner repaints a court, which trains everybody to re-aim it without reading –
    // and a pin nobody reads guards nothing.
    expect(kib(inInstall)).toBeLessThan(CEILING_KIB)
    expect(inInstall.length).toBeGreaterThan(290)
  })

  it('...and the ceiling itself is measured on the BUILT precache, from inside the gate', () => {
    // The house pattern from tests/sim-serialisation.test.ts: the rule lives in the runner, and the
    // suite's job is to prove the runner is actually wired in. A ceiling that runs nowhere is the
    // `check:tools` story a second time – «it used to run on demand, which meant it ran never».
    const gate = 'node scripts/install-size.mjs'
    expect(pkg.scripts.check, 'the install ceiling is not in the pre-push gate').toContain(gate)
    expect(
      pkg.scripts.check.indexOf(gate),
      'the ceiling runs BEFORE the build, so it would be measuring whatever dist was left behind',
    ).toBeGreaterThan(pkg.scripts.check.indexOf('vite build'))
    expect(read('.github/workflows/ci.yml'), 'the install ceiling never runs on CI').toContain(gate)
    // ...and it reads the BUILT manifest rather than public/, which is the whole of the fix. A
    // rewritten script that went back to summing public/ would satisfy every line above.
    const script = read('scripts/install-size.mjs')
    expect(script, 'install-size.mjs no longer reads the built service worker').toContain("join(DIST, 'sw.js')")
    expect(script, 'a missing dist/ must fail the gate, never skip it').toMatch(/dist\/sw\.js is missing/)
  })

  it('audio is IN, by his ruling – and cannot silently fall back out', () => {
    // ⚠ RE-AIMED, NEVER DELETED. This test held audio OUT while the call was his to make; he made
    // it on 29.08 – «надо добрать, не вижу проблем» – with both sizes in front of him (2525 KiB of
    // music, 462 KiB of match clips). So the same guard now holds it IN: a narrowed glob that
    // dropped `mp3` would silence every offline match and this is where that regression goes red.
    const audio = PUBLIC.filter((f) => f.rel.startsWith('music/') || f.rel.startsWith('sounds/'))
    expect(audio.some((f) => f.rel.endsWith('.mp3'))).toBe(true) // the fixture has something to say
    expect(audio.filter((f) => f.rel.endsWith('.mp3') && !f.precached)).toEqual([])
    expect(read('vite.config.ts')).toMatch(/globPatterns:.*mp3/)
  })

  it('fonts are already in, and always were – nothing to decide there', () => {
    const fonts = PUBLIC.filter((f) => f.rel.startsWith('fonts/') && f.rel.endsWith('.woff2'))
    // ⚠ RE-AIMED 4 -> 3 BY ROUND 35 #8. Sora and Manrope went VARIABLE – one file each, carrying
    // wght 400-800 and 200-800 – so two files replaced three. ⭐ The count was never this test's
    // claim: the line below is, and it did not move. Every font file, however many there are, must
    // be in the install.
    expect(fonts.length).toBe(3)
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
