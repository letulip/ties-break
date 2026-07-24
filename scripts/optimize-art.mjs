// Raster-art pipeline: convert the character portraits (public/images/**) and the
// header/kid avatars (public/avatars/*) from PNG/JPEG to webp (longest side <= 512 px,
// quality 82), then MOVE each source into art-src/ (mirrored path — kept in git for
// re-encoding, never served). App icons (public/pwa-*.png, ball.svg) are generated
// separately by scripts/gen-icons.mjs and stay as-is.
//
// When BOTH a jpeg and a png map to the same webp target (e.g. the owner drops a jpeg
// copy of an existing png portrait), the jpeg wins — the owner's jpeg exports are smaller
// than the fs8 pngs — and every source for that target is still moved to art-src/.
//
// Idempotent: once sources are moved, a re-run finds nothing to do. Run: npm run art
import sharp from 'sharp'
import { readdirSync, statSync, mkdirSync, renameSync, existsSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative, extname } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')
const artSrcDir = join(root, 'art-src')

const ART_DIRS = [join(publicDir, 'images'), join(publicDir, 'avatars')]
const MAX_SIDE = 512
const QUALITY = 82
const RASTER_RE = /\.(png|jpe?g)$/i

function walkRaster(dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walkRaster(p))
    else if (RASTER_RE.test(name)) out.push(p)
  }
  return out
}

const sources = ART_DIRS.flatMap(walkRaster)
if (!sources.length) {
  console.log('optimize-art: no PNG/JPEG sources under public/images or public/avatars — nothing to do.')
} else {
  // Group sources by the webp target they produce, so a jpeg+png pair collapses to one target.
  const byTarget = new Map()
  for (const src of sources) {
    const target = src.replace(RASTER_RE, '.webp')
    const list = byTarget.get(target) ?? []
    list.push(src)
    byTarget.set(target, list)
  }

  // jpeg beats png for the same target (smaller); ties within a format keep first-seen order.
  const isJpeg = (p) => /\.jpe?g$/i.test(extname(p))
  function preferred(list) {
    return list.find(isJpeg) ?? list[0]
  }

  let converted = 0
  for (const [webp, list] of byTarget) {
    const chosen = preferred(list)
    await sharp(chosen)
      .resize(MAX_SIDE, MAX_SIDE, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(webp)
    converted++
    const chosenRel = relative(publicDir, chosen)
    const dropped = list.filter((s) => s !== chosen).map((s) => relative(publicDir, s))
    console.log(`webp  ${relative(publicDir, webp)}  <- ${chosenRel}${dropped.length ? `  (preferred over ${dropped.join(', ')})` : ''}`)

    // Move every source for this target into art-src/, mirroring its path relative to public/.
    for (const src of list) {
      const rel = relative(publicDir, src)
      const dest = join(artSrcDir, rel)
      mkdirSync(dirname(dest), { recursive: true })
      renameSync(src, dest)
    }
  }

  console.log(`optimize-art: ${converted} webp target(s) (<= ${MAX_SIDE}px, q${QUALITY}); sources moved to art-src/.`)
}

// Full life-arc set: the owner drops finished jpgs straight into art-src (they're kept there
// for re-encoding anyway, so there's no public/ round-trip to move them out of). Every jpg
// under art-src/images/fem-euro-brunnet-jpeg/ gets a matching clean-named webp in
// public/images/fem-euro-brunnet/ — no "-fs8" suffix. The older PNG-era webps for this
// character (the small jun/teen/young/adult/milf subset) keep their "-fs8" suffix and are
// left untouched here; code still points at them. Idempotent: sources never move, so re-runs
// just re-encode.
const LIFE_ARC_SRC = join(artSrcDir, 'images/fem-euro-brunnet-jpeg')
const LIFE_ARC_OUT = join(publicDir, 'images/fem-euro-brunnet')
const MAX_WEBP_BYTES = 120 * 1024
const QUALITY_STEPS = [82, 79, 76, 75] // task calls for q75-82; first step that fits <=120KB wins

if (existsSync(LIFE_ARC_SRC)) {
  mkdirSync(LIFE_ARC_OUT, { recursive: true })
  let lifeArcConverted = 0
  for (const name of readdirSync(LIFE_ARC_SRC)) {
    if (!RASTER_RE.test(name)) continue
    const src = join(LIFE_ARC_SRC, name)
    const base = name.replace(RASTER_RE, '')
    const target = join(LIFE_ARC_OUT, `${base}.webp`)

    let buf, q
    for (q of QUALITY_STEPS) {
      buf = await sharp(src)
        .resize(MAX_SIDE, MAX_SIDE, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: q })
        .toBuffer()
      if (buf.length <= MAX_WEBP_BYTES) break
    }
    if (buf.length > MAX_WEBP_BYTES) {
      console.warn(`optimize-art: WARNING ${base}.webp still ${(buf.length / 1024).toFixed(1)}KB at quality floor ${QUALITY_STEPS.at(-1)}`)
    }
    writeFileSync(target, buf)
    lifeArcConverted++
    console.log(`webp  images/fem-euro-brunnet/${base}.webp  <- art-src/images/fem-euro-brunnet-jpeg/${name}  (q${q}, ${(buf.length / 1024).toFixed(1)}KB)`)
  }
  console.log(`optimize-art: life-arc set — ${lifeArcConverted} webp(s) written to images/fem-euro-brunnet/ (clean names, <=${MAX_WEBP_BYTES / 1024}KB, q75-82).`)
} else {
  console.log('optimize-art: no art-src/images/fem-euro-brunnet-jpeg/ — life-arc set skipped.')
}

// Round-6: wordmark logos. Like the life-arc set, the owner drops these PNGs straight into
// art-src/ (no public/ round-trip to move them out of) — every art-src/logo-tb-*.png gets a
// same-named webp in public/logos/. Natural size is kept (these are small UI wordmarks, not
// portraits needing the 512px cap — the splash screen renders logo-tb-line/-line-2 at their
// exact source pixel size, so upscaling here would just blur them later) and alpha is
// preserved (composited over the app's dark background, not flattened onto white).
// Idempotent: sources never move, so re-runs just re-encode.
const LOGO_SRC_RE = /^logo-tb-.*\.png$/i
const LOGO_OUT = join(publicDir, 'logos')
const LOGO_QUALITY = 90

const logoSources = existsSync(artSrcDir) ? readdirSync(artSrcDir).filter((n) => LOGO_SRC_RE.test(n)) : []
if (logoSources.length) {
  mkdirSync(LOGO_OUT, { recursive: true })
  for (const name of logoSources) {
    const base = name.replace(/\.png$/i, '')
    const target = join(LOGO_OUT, `${base}.webp`)
    await sharp(join(artSrcDir, name)).webp({ quality: LOGO_QUALITY }).toFile(target)
    console.log(`webp  logos/${base}.webp  <- art-src/${name}  (q${LOGO_QUALITY}, natural size, alpha kept)`)
  }
  console.log(`optimize-art: wordmark logos — ${logoSources.length} webp(s) written to logos/ (natural size, q${LOGO_QUALITY}, alpha kept).`)
} else {
  console.log('optimize-art: no art-src/logo-tb-*.png — wordmark logos skipped.')
}
