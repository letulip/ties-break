#!/usr/bin/env node
// THE INSTALL CEILING, MEASURED ON THE BYTES A PHONE ACTUALLY DOWNLOADS.
//
// ⚠ THE GUARD BEFORE THIS ONE COULD NOT SEE 1,161 KiB OF THE INSTALL (P-04, 05.09 review).
// `tests/round29p2-offline-install.test.ts` summed `public/` – the files a build COPIES – against
// the owner's 16,384 KiB ceiling. What the service worker precaches is `public/` PLUS the hashed
// bundles, the stylesheet and index.html, and none of those exist until `vite build` has run.
// Measured at 919105e7, both readings taken minutes apart from one `vite build`:
//
//     public/, precached extensions only      14,596 KiB / 350 files    <- what the old guard read
//     dist/sw.js precache manifest            15,755 KiB / 356 entries  <- what the phone downloads
//                                             ---------
//     invisible to the old guard               1,159 KiB
//
// The old guard read 93 % of the number it was guarding, and the missing 7 % is the half that grows
// when the UI grows – which is the half a ceiling exists to catch. (356 entries against the 362
// the build prints: six files are named by both `includeAssets` and `globPatterns`, and workbox
// writes one cache key per distinct url+revision pair. See precacheEntries below.)
//
// ⚠⚠ THE CEILING IS RESTATED, NOT RAISED. 16,384 KiB is the owner's ruling of 29.08, taken with
// both sizes in front of him («Запихнуть туда корты стоило бы +5108 КБ – это не очень большая
// цена»). Measured honestly the install has 629 KiB of headroom rather than the 1,788 KiB the old
// reading appeared to show – 3.8 % rather than 10.9 %. It still fits, so the line does not move.
// If it ever stops fitting, the answer is to come and say so, not to edit this constant.
//
// WHY A SCRIPT AND NOT A TEST. The unit project runs BEFORE `vite build` in `npm run check`, and
// in CI it runs in two jobs that never build at all. A test asserting on `dist/` would therefore
// be green on an absent artefact, on a stale one, or skipped – three ways to hold a ceiling that
// is not being measured. So the measurement lives where the artefact does: one step after the
// build. `tests/round29p2-offline-install.test.ts` keeps the claims it can prove offline (which
// extensions the glob sweeps in, that the art and the audio are in it) and pins THIS script into
// the gate, so it cannot be quietly unwired.
//
// ⚠ A MISSING dist/ IS A FAILURE, NEVER A SKIP. The one thing a gate must never do is pass
// because it could not look.
//
//     node scripts/install-size.mjs        # run it after `vite build`

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const DIST = join(ROOT, 'dist')

/** The owner's ruling of 29.08, in KiB. A CEILING, NOT AN EQUALITY, and that is the whole design:
 *  an exact pin goes red every time he repaints a court, which trains everybody to re-aim it
 *  without reading, and a pin nobody reads guards nothing.
 *
 *  ⭐ RAISED 16→18 MiB ON 09.10 BY THE RULING'S OWN ESCAPE CLAUSE. His standing word (29.08, and
 *  restated in docs/specs/ru-typography-2026-09.md §T4): «это наше ограничение, мы его будем
 *  неизбежно поднимать» – the ceiling moves when a real need meets it, «and a language is one».
 *  The need met it: L3-0's frozen legacy-template table costs ~37 KiB and left 21 KiB for seven
 *  more L3 waves plus the RU catalog and the P3 Cyrillic subsets (20–60 KB per face). Two MiB
 *  covers the language with the same honest headroom the old ceiling gave the game. */
const CEILING_KIB = 18 * 1024

/**
 * Every distinct cache key the built worker will write, read out of its own manifest.
 *
 * ⚠ url+revision PAIRS, NOT ENTRIES, and the difference is real: `includeAssets` and `globPatterns`
 * both name ball.svg, favicon.png and the four pwa icons, so the manifest lists those SIX twice.
 * Workbox writes one cache key per distinct pair, so a phone downloads 356 files where the build
 * prints 362 entries. `tools/precache-delta.mjs:108` found that the hard way and reads it the same
 * way; the regex is deliberately the same shape so the two cannot disagree about what an entry is.
 */
function precacheEntries(swSource) {
  const pairs = [...swSource.matchAll(/\{url:"(.*?)",revision:(null|"[0-9a-f]+")\}/g)]
  const unique = new Map()
  for (const [, url, revision] of pairs) unique.set(`${url}|${revision}`, url)
  return [...unique.values()]
}

/**
 * A manifest URL resolved to the file in `dist/` it names.
 *
 * ⚠ THE BASE PATH IS PART OF THE URL WHEN THERE IS ONE. `deploy.yml` builds with
 * `BASE_PATH=/ties-break/`, so the manifest says `/ties-break/images/x.webp` for a file that sits
 * at `dist/images/x.webp`. Try the plain path first, then peel one leading segment; anything still
 * unresolved THROWS rather than scoring zero – an entry silently counted as 0 bytes is exactly how
 * a size gate goes quietly green.
 */
function bytesOf(url) {
  const clean = decodeURIComponent(url).replace(/^\//, '')
  for (const candidate of [clean, clean.split('/').slice(1).join('/')]) {
    if (!candidate) continue
    try {
      return statSync(join(DIST, candidate)).size
    } catch {
      /* try the next spelling */
    }
  }
  throw new Error(`precache entry "${url}" resolves to no file under dist/ – re-aim this reader`)
}

// =================================================================================================
// ⚠⚠ WHICH ICONS THE PRECACHE HOLDS – READ OFF THE BUILT WORKER, BECAUSE A CONFIG ASSERTION CANNOT
// SEE THIS (T3.12, 26.09).
// =================================================================================================
//
// THE FAILURE THIS EXISTS FOR, AND IT HAPPENED. T3.12 took the manifest-only maskable icon out of
// the install by adding `globIgnores: ['**/pwa-maskable-512.png']` to `vite.config.ts` – and that
// alone freed NOTHING, while reading exactly like a 105 KiB win. vite-plugin-pwa ALSO pushes every
// `manifest.icons[].src` into the precache by hand (`includeIcons` → `additionalManifestEntries`),
// and that path does not consult `globIgnores`. Measured on that arm: 368 listed entries → 367,
// **362 unique → 362**, install 16,320 → 16,320 KiB, the icon still in `dist/sw.js`. The second door
// is `includeManifestIcons: false`, and only the BUILT worker can say whether both are shut.
//
// So `tests/round29p2-offline-install.test.ts` keeps the config-level guard – it is offline, it costs
// nothing and it fails four seconds into `check` – and this one asserts the artefact. **They fail for
// different reasons and that is the point**: a config regression trips the test, a plugin default or
// a second injection path trips this.
//
// ⚠ NOTHING IS COPIED HERE. The three icon names are read out of `dist/manifest.webmanifest`, and
// which of them is manifest-only is read off its own `purpose`, so the rule is derived from the same
// artefact it judges. A list of names in this file would be the «two copies of one constant» hazard
// that the offline test's own docblock was written about.
//
// ⚠⚠ AND IT FAILS LOUDLY ON A SHAPE IT DOES NOT UNDERSTAND. An absent or unparseable manifest, an
// empty `icons` array, or a build with no maskable icon or no ordinary one all exit 1 with a re-aim
// message – never green. ⭐ The positive half is also the anti-vacuity guard for the negative half: if
// the name matching below ever stopped matching anything, «the maskable icon is absent» would pass
// for the wrong reason, and «pwa-192 and pwa-512 are present» goes red in the same breath.
//
// WHY THE TWO ORDINARY ICONS MUST STAY IN, recorded here because it is the half a later size pass
// will be tempted by: `src/audio/music.ts` hands `pwa-192.png` and `pwa-512.png` to the Media Session
// as the lock-screen artwork, on a phone that may never be online again. The difference between the
// three icons is WHO READS THEM, never how big they are.
function iconVerdict(precachedUrls) {
  let manifest
  try {
    manifest = JSON.parse(readFileSync(join(DIST, 'manifest.webmanifest'), 'utf8'))
  } catch (e) {
    return { ok: false, line: `  error: dist/manifest.webmanifest could not be read or parsed (${e.message}) – re-aim this reader` }
  }
  const icons = manifest.icons
  if (!Array.isArray(icons) || icons.length === 0) {
    return { ok: false, line: '  error: the built manifest declares no `icons` array – re-aim this reader' }
  }
  // ⚠ COMPARED BY BASENAME, for `bytesOf`'s reason one function up: `deploy.yml` builds with
  // `BASE_PATH=/ties-break/`, so the same file is spelled two ways across the manifest and the
  // worker. Every icon sits at the root of `dist/`, so the basename is the whole identity.
  const nameOf = (u) => decodeURIComponent(String(u)).split('?')[0].split('/').pop()
  const inPrecache = new Set(precachedUrls.map(nameOf))
  const purposes = (i) => String(i.purpose ?? 'any').trim().split(/\s+/)
  const manifestOnly = icons.filter((i) => purposes(i).includes('maskable'))
  const readAtRuntime = icons.filter((i) => !manifestOnly.includes(i))
  if (manifestOnly.length === 0 || readAtRuntime.length === 0) {
    return {
      ok: false,
      line:
        `  error: the manifest holds ${manifestOnly.length} maskable and ${readAtRuntime.length} ordinary icons; ` +
        'this reader expects at least one of each (T3.12) and will not judge a shape it does not know – re-aim it',
    }
  }
  const kibOf = (name) => {
    try {
      return `${(statSync(join(DIST, name)).size / 1024).toFixed(0)} KiB`
    } catch {
      return 'missing'
    }
  }
  const problems = []
  for (const i of icons) {
    const name = nameOf(i.src)
    try {
      statSync(join(DIST, name))
    } catch {
      problems.push(`${name} is in the manifest but absent from dist/ – the installed icon would 404`)
    }
  }
  for (const i of manifestOnly) {
    const name = nameOf(i.src)
    if (inPrecache.has(name)) {
      problems.push(
        `${name} is manifest-only (${kibOf(name)}) and is back in the precache – the platform fetches it once, ` +
          'online, at install. T3.12 needs BOTH doors shut: `globIgnores` in workbox AND `includeManifestIcons: false`',
      )
    }
  }
  for (const i of readAtRuntime) {
    const name = nameOf(i.src)
    if (!inPrecache.has(name)) {
      problems.push(
        `${name} has LEFT the precache – src/audio/music.ts hands it to the Media Session as the ` +
          'lock-screen artwork, which must work offline (an owner-facing behaviour, not a spare copy)',
      )
    }
  }
  if (problems.length > 0) return { ok: false, line: problems.map((p) => `  error: ${p}`).join('\n') }
  return {
    ok: true,
    line:
      `  icons: ${manifestOnly.map((i) => nameOf(i.src)).join(', ')} out of the precache (manifest-only), ` +
      `${readAtRuntime.map((i) => nameOf(i.src)).join(', ')} in it (read offline)`,
  }
}

let sw
try {
  sw = readFileSync(join(DIST, 'sw.js'), 'utf8')
} catch {
  console.log('install size')
  console.log('  error: dist/sw.js is missing – this gate measures a BUILT artefact. Run `vite build` first.')
  process.exit(1)
}

const urls = precacheEntries(sw)
if (urls.length < 290) {
  // Anti-vacuity, and it is the same floor the offline test uses on the `public/` side: a manifest
  // this reader failed to parse would otherwise weigh nothing at all and pass by a mile.
  console.log('install size')
  console.log(`  error: only ${urls.length} precache entries parsed out of dist/sw.js – re-aim the reader`)
  process.exit(1)
}

let kib
try {
  kib = urls.reduce((n, url) => n + bytesOf(url), 0) / 1024
} catch (e) {
  console.log('install size')
  console.log(`  error: ${e.message}`)
  process.exit(1)
}
// The worker scripts are not IN the manifest and a phone downloads them anyway, so they are NAMED
// rather than folded in: the assertion stays on the number the build itself prints and the review
// measured, which is what the 29.08 ruling has been about throughout. They are ~52 KiB.
const workerKib =
  readdirSync(DIST)
    .filter((f) => f === 'sw.js' || f === 'registerSW.js' || /^workbox-[0-9a-f]+\.js$/.test(f))
    .reduce((n, f) => n + statSync(join(DIST, f)).size, 0) / 1024

// ⚠ LOCAL TIME, NOT ISO/UTC. This line exists so a reader can see WHICH dist was measured; a
// timestamp eight hours off the clock on the wall answers that question wrongly and confidently.
const built = statSync(join(DIST, 'sw.js')).mtime.toLocaleString('sv-SE')
const headroom = CEILING_KIB - kib

if (kib >= CEILING_KIB) {
  console.log('install size')
  console.log(
    `  error: the install is ${kib.toFixed(0)} KiB across ${urls.length} precache entries, ` +
      `at or over the ${CEILING_KIB} KiB ceiling (owner, 29.08). A set that doubles the install ` +
      `has to come and say so – do not raise this line to make a wave fit.`,
  )
  process.exitCode = 1
} else {
  console.log(
    `install size: ok – ${kib.toFixed(0)} KiB in ${urls.length} precache entries, ` +
      `${headroom.toFixed(0)} KiB under the ${CEILING_KIB} KiB ceiling ` +
      `(+${workerKib.toFixed(0)} KiB of worker scripts outside the manifest; dist built ${built})`,
  )
}

// ⚠ AFTER THE SIZE LINE, AND IT SETS `exitCode` RATHER THAN EXITING – so a run that trips this still
// prints the number it measured. Both failures are real failures; seeing both at once is cheaper than
// two runs. See the block above `iconVerdict` for what it is guarding and why a config test cannot.
const icons = iconVerdict(urls)
console.log(icons.line)
if (!icons.ok) process.exitCode = 1
