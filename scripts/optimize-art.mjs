// Raster-art pipeline: convert the character portraits (public/images/**) and the
// header/kid avatars (public/avatars/*) from PNG to webp (longest side <= 512 px,
// quality 82), then MOVE each source PNG into art-src/ (mirrored path — kept in git
// for re-encoding, never served). App icons (public/pwa-*.png, ball.svg) are generated
// separately by scripts/gen-icons.mjs and stay as-is.
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

function walkPngs(dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walkPngs(p))
    else if (extname(name).toLowerCase() === '.png') out.push(p)
  }
  return out
}

const pngs = ART_DIRS.flatMap(walkPngs)
if (!pngs.length) {
  console.log('optimize-art: no PNG sources under public/images or public/avatars — nothing to do.')
  process.exit(0)
}

let converted = 0
for (const png of pngs) {
  const webp = png.replace(/\.png$/i, '.webp')
  await sharp(png)
    .resize(MAX_SIDE, MAX_SIDE, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(webp)

  // Move the source PNG into art-src/, mirroring its path relative to public/.
  const rel = relative(publicDir, png)
  const dest = join(artSrcDir, rel)
  mkdirSync(dirname(dest), { recursive: true })
  renameSync(png, dest)
  converted++
  console.log(`webp  ${rel}  (source -> art-src/${rel})`)
}

console.log(`optimize-art: ${converted} file(s) -> webp (<= ${MAX_SIDE}px, q${QUALITY}); PNG sources moved to art-src/.`)
