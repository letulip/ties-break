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
import { readdirSync, statSync, mkdirSync, renameSync, existsSync } from 'node:fs'
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
  process.exit(0)
}

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
