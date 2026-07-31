// RASTER-ART PIPELINE — raw art never enters git; the webp it produces does.
//
// THE AUTHORING FLOW
//   1. Drop the masters (jpg / jpeg / png) into  public/images/<set>-jpeg/.
//      (The `-jpeg` in the inbox name is the INBOX marker, not a format claim — png masters have
//      always been welcome there, and the trophy set is eighteen of them.)
//   2. Build (or `npm run art`). Each master is encoded to  public/images/<set>/<name>.webp
//      — longest side <= 512 px, quality ladder 82 -> 75, first step that fits 120 KB wins —
//      and the master is then MOVED out of public/ into  art-src/images/<set>-jpeg/.
//   3. Commit the webp. Nothing else.
//
// WHY THE MOVE. Vite copies EVERYTHING under public/ into dist/ verbatim, whether git tracks it
// or not. Masters left next to their webp are shipped to every player: measured, 74 stray raw
// files turned dist/images into 61 MB against 4.2 MB of actual art. Untracking them in git does
// not help — only getting them out of public/ does.
//
// WHY art-src/ IS GITIGNORED. It is the author's local master library, kept so the webp can be
// re-encoded later. A fresh clone has no art-src/ at all: the committed webp under public/images/
// ARE the shipping art, and this script finds nothing to do. That is the intended CI behaviour.
//   => the masters exist ONLY on the author's machine. git is not their backup any more.
//
// IDEMPOTENCE. Every encoded target records its source's content hash in art-src/.art-cache.json.
// A target is re-encoded only when the source's bytes changed or the target went missing, so a
// second build in a row does no encoding at all. With no art-src/ and no raw files under public/
// the whole script is a handful of stat() calls.
//
// NO "-fs8". That suffix is pngquant-era (Floyd-Steinberg dithering) and means nothing for webp.
// Leftover `-fs8` masters are evacuated out of public/ but never encoded — otherwise the -fs8
// webp twins deleted in build/webp-only would grow straight back on the next build.
//
// ⚠ AND THAT RULE IS A TRAP FOR ART THAT ARRIVES ALREADY OPTIMISED, which is what the trophy set
// did (31.07). The owner: «они не сырые, а оптимизированные и их надо перегнать в webp и зашипить
// в этом виде» — eighteen pngquant outputs, every one of them named `<tier>-<metal>-fs8.png`, and
// every one of them art we WANT to ship. Routed through as they were, `FS8_RE` would have read
// them as residue, moved all 1.6 MB into art-src/ and shipped NOTHING, silently and with a log
// line that says "moved".
//
// THE FIX WAS A RENAME AT INTAKE, NOT A NARROWER RULE, and the reason is that the suffix is a lie
// about the file either way. `-fs8` names a dithering mode of an encoder that is not in this
// pipeline; carried through, it would bake itself into `images/trophies/j30-gold-fs8.webp` and
// from there into the URL every trophy cell builds, for ever. So the eighteen masters were filed
// as `<tier>-<metal>.png` and the rule below is untouched — it still means exactly what it says,
// and it still catches the residue it was written for. Narrowing it (per-set opt-outs, an
// allow-list) would have kept a dead word in eighteen shipping filenames to avoid touching a
// regex, which is the wrong side of that trade.
//
// Run standalone: `npm run art`. Runs automatically inside every `vite build` (see vite.config.ts).
import sharp from 'sharp'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmdirSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { fileURLToPath } from 'node:url'
import { basename, dirname, join, relative, resolve } from 'node:path'

const RASTER_RE = /\.(png|jpe?g)$/i
const JPEG_RE = /\.jpe?g$/i
const INBOX_RE = /-jpeg$/i
const FS8_RE = /-fs8$/i

/** The DEFAULT cap: the 512 px the Kid screen and the finale splash render a portrait at. */
const MAX_SIDE = 512

/** ⚠ PER-SET CAPS, because 512 WAS A PORTRAIT NUMBER APPLIED TO EVERY SET BY ACCIDENT (31.07).
 *
 *  The owner: the weekly paintings «мылятся» on the recap screens. They do, and the cause was this
 *  constant reaching further than its own comment claimed. Measured before changing anything:
 *
 *    - The week card is `aspect-ratio: 390/286` with `object-fit: cover`, so at 375pt on a 3x phone
 *      it needs about **825 device pixels of HEIGHT**. Height, not width - a painting wider than the
 *      card is scaled to fill the height and cropped at the sides, so the height is what binds.
 *    - `fit: 'inside'` caps the LONGEST side. A 941x377 master therefore ships as 512x205 - and 205
 *      is then blown up to 825 on screen. **Four times.** The wide vacation frames are the worst
 *      exactly because they are the widest.
 *
 *  So the weeks get their masters' own resolution back. 960 is above every master the set has
 *  (941 px), and `withoutEnlargement: true` means nothing is invented - each file simply stops being
 *  thrown away. Measured cost per file at q82: vac-resort 29.8 -> 67.1 KB, study-teen 31.7 -> 80.0
 *  KB, both comfortably inside MAX_BYTES.
 *
 *  ⚠ AND IT COSTS NOTHING AT INSTALL, which is why this is safe to do at all. vite.config's workbox
 *  block sets `globIgnores: ['**\/images\/**']`, so nothing under public/images is precached - these
 *  bytes are fetched by the week that shows them. `public/avatars` IS precached and is deliberately
 *  NOT in this table: its 256px crops are what keep the header working offline.
 *
 *  ⚠ TROPHIES: 384, AND IT IS THE OPPOSITE CASE TO `weeks` ABOVE — the same constant reaching too
 *  FAR rather than not far enough. The masters are 650x650 squares; the Trophy Cabinet draws each
 *  one in a `max-width: 128px` square plate (two per tier row, at 375pt and at every width above
 *  it — the plate is capped, so this is the ceiling on every device). 128 x 3 = 384 device pixels
 *  on a 3x phone, so 384 is exactly what the screen can show and 512 would have shipped a third
 *  more pixels than any display can resolve, eighteen times over. Measured cost of the difference,
 *  at q82 across the set: 384 lands the eighteen at ~424 KB against ~684 KB at 512.
 *
 *  ⚠ AND THIS SET SHIPS OUT OF `public/images/` FOR THE PRECACHE, NOT FOR TIDINESS. The masters
 *  arrived in `public/trophies/`, which this pipeline does not scan at all — so they shipped RAW,
 *  and `globPatterns: ['**\/*.{js,css,html,svg,png,webp,woff2}']` in vite.config put all 1.6 MB of
 *  them in the SERVICE WORKER PRECACHE: every install, on every device, paying for eighteen
 *  pictures most careers never unlock. `globIgnores: ['**\/images\/**']` is what holds them out,
 *  and it is keyed on the directory - so the set's home decides whether it is an install cost or a
 *  fetch, and `images/trophies/` is the answer. The CacheFirst runtime route (`/images/*.webp`)
 *  then makes each trophy offline-durable from the first time the cabinet is opened.
 *
 *  Keyed by the SET directory name (`public/images/<set>/`). Absent = MAX_SIDE. */
const SET_MAX_SIDE = { weeks: 960, trophies: 384 }

/** The cap for a job, from the set its OUTPUT lands in. Reading the target rather than the source
 *  is deliberate: a master can arrive from `<set>-jpeg/` or be re-encoded in place, and only the
 *  target says which set it ends up in. */
function maxSideFor(target) {
  return SET_MAX_SIDE[basename(dirname(target))] ?? MAX_SIDE
}
/** Per-file ceiling for a portrait; the ladder stops at the first quality that fits. */
const MAX_BYTES = 120 * 1024
const QUALITY_LADDER = [82, 79, 76, 75]
const QUALITY_FLOOR = QUALITY_LADDER[QUALITY_LADDER.length - 1]
/** Wordmarks keep their natural size (the splash renders them 1:1) and their alpha. */
const LOGO_QUALITY = 90
const LOGO_RE = /^logo-tb-.*\.png$/i

/**
 * Masters the pipeline deliberately does NOT ship, with the reason each is here.
 *
 * The rule is "a master becomes a webp", and that is right — but a master whose output no code
 * path can request is dead weight in every user's download. Deleting the webp alone does not
 * work: the next build regenerates it from the master, which is exactly what happened when 13
 * such files were removed by hand and came back on the following `vite build`. The rule has to
 * be changed where the rule lives.
 *
 * Each entry is reversible in one line — put the emotion in `AvatarEmotion`, or point the splash
 * at the webp wordmarks, and delete the pattern here.
 */
const NOT_SHIPPED = [
  // `-angry` came off this list on 27.07: `angry` is a member of AvatarEmotion now, so the URLs
  // ARE constructible and the five masters encode like any other. (Nothing SELECTS angry yet —
  // avatarEmotion() explains why it has no trigger — but "unreachable" was the reason it was
  // skipped, and that reason is gone.)
  // SplashScreen.vue loads public/logo-tb-*.svg. The webp copies of the same wordmarks, generated
  // from the PNG masters, are referenced by nothing at all — 8 files, ~32 KB.
  { re: /^logo-tb-/i, why: 'the splash uses the SVG wordmarks; these webp copies are unreferenced' },
]

/** True when a master's output is deliberately not shipped (see NOT_SHIPPED). */
function notShipped(stem) {
  return NOT_SHIPPED.some((rule) => rule.re.test(stem))
}

/**
 * DELIVERY DIRECTORIES: a folder directly under `public/` that art was HANDED OVER in, mapped to
 * the `public/images/<set>/` it actually belongs to. Everything in it is treated as that set's
 * inbox — encoded to the set's webp, master filed into `art-src/images/<set>-jpeg/`, folder tidied
 * away once empty.
 *
 * ⚠ THIS EXISTS BECAUSE "THE PIPELINE CANNOT SEE IT" IS A SHIPPING BUG, NOT A NO-OP. The trophy
 * art was delivered into `public/trophies/` (31.07) and this script scanned only `public/images`
 * and `public/avatars` — so eighteen PNGs sat in public/ where NOTHING would touch them, and Vite
 * copies public/ into dist/ verbatim. They shipped raw, at 1.6 MB, and workbox's
 * `globPatterns` includes `png`, so they also went into the SERVICE WORKER PRECACHE: every
 * install on every device paying for eighteen pictures a career may never unlock. The `-fs8` rule
 * would not have saved them either; it would have deleted them from the build instead.
 *
 * A gitignore entry does not fix this (Vite copies untracked files too) and neither does a note in
 * a doc. The only thing that fixes it is the pipeline being able to SEE the directory, so the next
 * `vite build` on any machine that still has one empties it into the set's real home.
 *
 * A row here is meant to be permanent, not a migration step: it says "art for <set> may be handed
 * over here", and re-dropping a master into `public/trophies/` next year does the right thing
 * again rather than quietly regressing.
 */
const DELIVERY_SET = { trophies: 'trophies' }
const DELIVERY_DIRS = Object.keys(DELIVERY_SET)

const CACHE_NAME = '.art-cache.json'
const CACHE_VERSION = 3

function defaultRoot() {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..')
}

/** Every file under `dir`, recursively. Dotfiles are skipped (.DS_Store, .art-cache.json). */
function listFiles(dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...listFiles(p))
    else out.push(p)
  }
  return out
}

function sha1(file) {
  return createHash('sha1').update(readFileSync(file)).digest('hex')
}

/**
 * Every unit of work this run could do.
 *   encode[]   { src, target, profile, moveTo }  – produce a webp (and evacuate src when moveTo)
 *   evacuate[] { src, moveTo }                   – get raw bytes out of public/, no webp
 */
function discover(root) {
  const publicDir = join(root, 'public')
  const artSrcDir = join(root, 'art-src')
  const encode = []
  const evacuate = []

  // --- A. raw art sitting under public/ — the authoring inbox, plus any stray ---------------
  // A file in `public/images/<set>-jpeg/` belongs to `<set>`; a file in a DELIVERY DIRECTORY (see
  // DELIVERY_DIRS) belongs to the set that directory names; anything else encodes in place.
  // Either way the raw bytes leave public/ for art-src/.
  for (const dir of [join(publicDir, 'images'), join(publicDir, 'avatars'), ...DELIVERY_DIRS.map((d) => join(publicDir, d))]) {
    for (const src of listFiles(dir)) {
      if (!RASTER_RE.test(src)) continue
      const set = DELIVERY_SET[relative(publicDir, dirname(src))]
      // A delivery directory is NOT the set's home, so its masters are filed into the set's real
      // inbox rather than mirrored where they happened to land — otherwise they would sit in
      // `art-src/<dir>/`, which part B does not scan, and the set could never be re-encoded.
      const moveTo = set
        ? join(artSrcDir, 'images', `${set}-jpeg`, basename(src))
        : join(artSrcDir, relative(publicDir, src))
      const rawStem = basename(src).replace(RASTER_RE, '')
      // ⚠ A DELIVERY DIRECTORY STRIPS `-fs8` INSTEAD OF EVACUATING ON IT (31.07, second pass).
      //
      // The first pass renamed the eighteen trophies by hand and left this rule alone, reasoning
      // that a dead pngquant word should not be baked into eighteen shipping URLs. Correct - and
      // incomplete, because it made the rename a MANUAL STEP THAT NOBODY IS TOLD ABOUT. The owner
      // dropped two updated trophies in the next day, still `-fs8` named because that is what his
      // exporter writes, and this rule silently filed both into art-src WITHOUT ENCODING: the
      // pipeline reported "0 encoded, 2 raw file(s) moved" and the shipped webp stayed stale. No
      // error, no warning, nothing on screen. That is the same class of silent no-op as the cache
      // that ignored a cap change, one directory over.
      //
      // A delivery directory exists precisely because a human hands art over there, so it must
      // accept the names a human's tools produce. `-fs8` names a dithering mode of an encoder this
      // pipeline does not run; here it is noise on the label, not a verdict on the file. Elsewhere
      // the rule is UNCHANGED - a stray `-fs8` under `public/images/` is still residue and is still
      // evacuated unencoded, because there it means "somebody's old output leaked in".
      const delivered = set !== undefined
      const stem = delivered ? rawStem.replace(FS8_RE, '') : rawStem
      if ((FS8_RE.test(stem) && !delivered) || notShipped(stem)) {
        evacuate.push({ src, moveTo })
        continue
      }
      const srcDir = dirname(src)
      const target = set
        ? join(publicDir, 'images', set, `${stem}.webp`)
        : INBOX_RE.test(basename(srcDir))
          ? join(dirname(srcDir), basename(srcDir).replace(INBOX_RE, ''), `${stem}.webp`)
          : join(srcDir, `${stem}.webp`)
      encode.push({ src, target, profile: 'portrait', moveTo, incoming: true })
    }
  }

  // --- B. masters already living in art-src/ — re-encode targets, never moved ---------------
  // Only `<set>-jpeg/` inboxes are treated as sources. A plain `art-src/images/<set>/` is
  // pre-pipeline residue (the old pngquant `-fs8` pngs live there) and is deliberately inert:
  // encoding it would recreate exactly the duplicate webp this branch removed.
  const artImages = join(artSrcDir, 'images')
  if (existsSync(artImages)) {
    for (const name of readdirSync(artImages)) {
      if (name.startsWith('.') || !INBOX_RE.test(name)) continue
      const inbox = join(artImages, name)
      if (!statSync(inbox).isDirectory()) continue
      const outDir = join(publicDir, 'images', name.replace(INBOX_RE, ''))
      for (const src of listFiles(inbox)) {
        if (!RASTER_RE.test(src)) continue
        const stem = basename(src).replace(RASTER_RE, '')
        if (FS8_RE.test(stem) || notShipped(stem)) continue
        encode.push({ src, target: join(outDir, `${stem}.webp`), profile: 'portrait', moveTo: null })
      }
    }
  }

  // art-src/avatars/*.png -> public/avatars/*.webp (the 256 px header/card crops).
  const artAvatars = join(artSrcDir, 'avatars')
  for (const src of listFiles(artAvatars)) {
    if (!RASTER_RE.test(src)) continue
    const stem = basename(src).replace(RASTER_RE, '')
    if (FS8_RE.test(stem) || notShipped(stem)) continue
    const target = join(publicDir, 'avatars', dirname(relative(artAvatars, src)), `${stem}.webp`)
    encode.push({ src, target, profile: 'portrait', moveTo: null })
  }

  // art-src/logo-tb-*.png -> public/logos/*.webp (natural size, alpha kept).
  if (existsSync(artSrcDir)) {
    for (const name of readdirSync(artSrcDir)) {
      if (!LOGO_RE.test(name) || notShipped(name.replace(/\.png$/i, ''))) continue
      const src = join(artSrcDir, name)
      if (!statSync(src).isFile()) continue
      const target = join(publicDir, 'logos', `${name.replace(/\.png$/i, '')}.webp`)
      encode.push({ src, target, profile: 'logo', moveTo: null })
    }
  }

  return { encode: dedupe(encode), evacuate }
}

/**
 * Two masters can aim at the same webp (a jpeg re-export of an existing png). One wins; the
 * loser is still evacuated, so no raw file is left behind in public/.
 * Priority: a file just dropped into public/ beats one already filed in art-src/ (it is the
 * newer export), then jpeg beats png (the author's jpeg exports are the smaller source).
 */
function dedupe(jobs) {
  const rank = (j) => (j.incoming ? 2 : 0) + (JPEG_RE.test(j.src) ? 1 : 0)
  const best = new Map()
  const losers = []
  for (const job of jobs) {
    const prev = best.get(job.target)
    if (!prev) best.set(job.target, job)
    else if (rank(job) > rank(prev)) {
      best.set(job.target, job)
      losers.push(prev)
    } else losers.push(job)
  }
  const winners = [...best.values()]
  // A loser still has to leave public/ if that is where it sits.
  for (const l of losers) if (l.moveTo) winners.push({ ...l, target: null })
  return winners
}

async function encodePortrait(src, maxSide = MAX_SIDE) {
  let buf
  let quality = QUALITY_FLOOR
  for (const q of QUALITY_LADDER) {
    buf = await sharp(src)
      .resize(maxSide, maxSide, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: q })
      .toBuffer()
    quality = q
    if (buf.length <= MAX_BYTES) break
  }
  return { buf, quality }
}

async function encodeLogo(src) {
  return { buf: await sharp(src).webp({ quality: LOGO_QUALITY }).toBuffer(), quality: LOGO_QUALITY }
}

/** Move a raw master out of public/ into art-src/, and tidy the inbox dir once it is empty. */
function evacuateFile(src, moveTo) {
  mkdirSync(dirname(moveTo), { recursive: true })
  renameSync(src, moveTo)
  const dir = dirname(src)
  try {
    if (!readdirSync(dir).length) rmdirSync(dir)
  } catch {
    /* directory not empty, or already gone – nothing to tidy */
  }
}

/**
 * @param {{ root?: string, log?: (msg: string) => void }} [options]
 *   `root` MUST be passed by the Vite plugin: the config is bundled before it runs, so
 *   import.meta.url would point at the bundle, not at this file.
 */
export async function optimizeArt(options = {}) {
  const root = options.root ?? defaultRoot()
  const log = options.log ?? ((m) => console.log(m))
  const artSrcDir = join(root, 'art-src')

  const { encode, evacuate } = discover(root)
  const result = { encoded: 0, skipped: 0, evacuated: 0 }

  if (!encode.length && !evacuate.length) {
    log('optimize-art: no raw masters under public/ or art-src/ – nothing to do.')
    return result
  }

  const cachePath = join(artSrcDir, CACHE_NAME)
  let cache = {}
  try {
    const parsed = JSON.parse(readFileSync(cachePath, 'utf8'))
    if (parsed.version === CACHE_VERSION) cache = parsed.targets ?? {}
  } catch {
    /* no cache yet, or a stale version – everything re-encodes once */
  }

  for (const job of encode) {
    if (job.target) {
      const key = relative(root, job.target)
      const hash = sha1(job.src)
      const prev = cache[key]
      // ⚠ THE CAP IS PART OF THE KEY, and leaving it out made a cap change a SILENT NO-OP (31.07).
      // The cache matched on the source hash and the profile alone, so raising `SET_MAX_SIDE.weeks`
      // from 512 to 960 re-ran the pipeline to "0 encoded, 106 unchanged" - the masters had not
      // moved, so every target was declared fresh at the OLD size. Nothing warned, because from the
      // cache's point of view nothing had happened. Any future retune of a cap, a quality ladder or
      // a byte ceiling would have gone the same way. An encoding cache has to key on what it
      // encoded WITH, not only on what it encoded FROM.
      const maxSide = job.profile === 'logo' ? null : maxSideFor(job.target)
      if (
        prev &&
        prev.hash === hash &&
        prev.profile === job.profile &&
        (prev.maxSide ?? null) === maxSide &&
        existsSync(job.target)
      ) {
        result.skipped++
      } else {
        const { buf, quality } =
          job.profile === 'logo' ? await encodeLogo(job.src) : await encodePortrait(job.src, maxSide)
        if (job.profile === 'portrait' && buf.length > MAX_BYTES) {
          log(`optimize-art: WARNING ${key} is ${(buf.length / 1024).toFixed(1)} KB at the quality floor q${QUALITY_FLOOR}`)
        }
        mkdirSync(dirname(job.target), { recursive: true })
        writeFileSync(job.target, buf)
        cache[key] = { hash, profile: job.profile, maxSide, src: relative(root, job.src) }
        result.encoded++
        log(`optimize-art: webp ${key} <- ${relative(root, job.src)} (q${quality}, ${(buf.length / 1024).toFixed(1)} KB)`)
      }
    }
    if (job.moveTo) {
      const from = relative(root, job.src)
      evacuateFile(job.src, job.moveTo)
      result.evacuated++
      log(`optimize-art: moved ${from} -> ${relative(root, job.moveTo)}`)
    }
  }

  for (const { src, moveTo } of evacuate) {
    const from = relative(root, src)
    evacuateFile(src, moveTo)
    result.evacuated++
    log(`optimize-art: moved ${from} -> ${relative(root, moveTo)} WITHOUT encoding – "-fs8" is a dead pngquant-era name.`)
  }

  if (result.encoded || Object.keys(cache).length) {
    mkdirSync(artSrcDir, { recursive: true })
    writeFileSync(cachePath, `${JSON.stringify({ version: CACHE_VERSION, targets: cache }, null, 2)}\n`)
  }

  log(`optimize-art: ${result.encoded} encoded, ${result.skipped} unchanged, ${result.evacuated} raw file(s) moved out of public/.`)
  return result
}

// Standalone (`npm run art`). Never fires when this module is imported by vite.config.ts.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await optimizeArt()
}
