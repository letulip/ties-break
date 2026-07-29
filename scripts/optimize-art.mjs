// RASTER-ART PIPELINE — raw art never enters git; the webp it produces does.
//
// THE AUTHORING FLOW
//   1. Drop the masters (jpg / jpeg / png) into  public/images/<set>-jpeg/.
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

/** Portraits: the 512 px cap the Kid screen and the finale splash render at. */
const MAX_SIDE = 512
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
  // A file in `public/images/<set>-jpeg/` belongs to `<set>`; anything else encodes in place.
  // Either way the raw bytes leave public/ for art-src/, mirroring their path.
  for (const dir of [join(publicDir, 'images'), join(publicDir, 'avatars')]) {
    for (const src of listFiles(dir)) {
      if (!RASTER_RE.test(src)) continue
      const moveTo = join(artSrcDir, relative(publicDir, src))
      const stem = basename(src).replace(RASTER_RE, '')
      // `-fs8` residue and NOT_SHIPPED masters still get out of public/ — they must not ship as raw
      // bytes either — they just never become a webp.
      if (FS8_RE.test(stem) || notShipped(stem)) {
        evacuate.push({ src, moveTo })
        continue
      }
      const srcDir = dirname(src)
      const target = INBOX_RE.test(basename(srcDir))
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

async function encodePortrait(src) {
  let buf
  let quality = QUALITY_FLOOR
  for (const q of QUALITY_LADDER) {
    buf = await sharp(src)
      .resize(MAX_SIDE, MAX_SIDE, { fit: 'inside', withoutEnlargement: true })
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
      if (prev && prev.hash === hash && prev.profile === job.profile && existsSync(job.target)) {
        result.skipped++
      } else {
        const { buf, quality } =
          job.profile === 'logo' ? await encodeLogo(job.src) : await encodePortrait(job.src)
        if (job.profile === 'portrait' && buf.length > MAX_BYTES) {
          log(`optimize-art: WARNING ${key} is ${(buf.length / 1024).toFixed(1)} KB at the quality floor q${QUALITY_FLOOR}`)
        }
        mkdirSync(dirname(job.target), { recursive: true })
        writeFileSync(job.target, buf)
        cache[key] = { hash, profile: job.profile, src: relative(root, job.src) }
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
