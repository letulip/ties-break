// THE ART PIPELINE'S OWN GATE – it RUNS the pipeline against a throwaway root rather than reading
// its source. A source pin here would have been useless for the bug this file was written for: the
// guard that should have caught it was present, quotable and grep-able in `optimize-art.mjs` the
// whole time, and it could not fire. Only executing the thing shows that.
//
// ⚠ WHAT WENT WRONG (12.08, round-17 #20). The owner reported that the W250 first-place trophy still
// rendered on a white rectangle, and said he had already shipped a corrected asset. He had:
// `art-src/images/trophies-jpeg/wta250-gold.png` (08.08), 650x650 RGBA, alpha intact. It never
// reached `public/`, because the four-day-old `wta250-gold.jpg` was sitting beside it in the same
// inbox and `dedupe()` ranked "jpeg" above "png". A jpeg cannot carry alpha, so the encode produced
// the only one of thirty-two trophy webps with no transparency channel – hence the white – and every
// run of the pipeline logged success. Nothing in the repo could have told him otherwise.
//
// So the three cases below are the three links of that chain, in order: the tie must STOP the build,
// alpha must SURVIVE an encode, and the one tiebreak that is still allowed (position) must still work.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import sharp from 'sharp'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// Plain ESM JS with a `.d.mts` beside it – vite.config.ts imports it the same way.
import { optimizeArt } from '../../scripts/optimize-art.mjs'

/**
 * Does a webp carry an alpha channel? Alpha needs the EXTENDED container (`VP8X`) with bit 4 of the
 * flags byte set; a bare `VP8 ` chunk is lossy-only and CANNOT hold transparency whatever the source
 * was. This is the exact test that separates wta250-gold.webp from the other thirty-one trophies.
 */
function webpHasAlpha(file: string): boolean {
  const b = readFileSync(file)
  const fourcc = b.toString('ascii', 12, 16)
  if (fourcc === 'VP8X') return (b[20] & 0x10) !== 0
  if (fourcc === 'VP8L') return true // lossless always carries the channel
  return false // 'VP8 ' – lossy, no alpha possible
}

/** A 32x32 RGBA square with a transparent half. Not art – a shape with a known alpha channel. */
async function pngWithAlpha(): Promise<Buffer> {
  return sharp({
    create: { width: 32, height: 32, channels: 4, background: { r: 200, g: 160, b: 40, alpha: 0.5 } },
  })
    .png()
    .toBuffer()
}

/** The same square as a jpeg – the format that silently drops the channel. */
async function jpegFlat(): Promise<Buffer> {
  return sharp({ create: { width: 32, height: 32, channels: 3, background: { r: 200, g: 160, b: 40 } } })
    .jpeg()
    .toBuffer()
}

let root: string
const logs: string[] = []
const run = () => optimizeArt({ root, log: (m: string) => logs.push(m) })

/** `art-src/images/trophies-jpeg/<name>` – the owner's filed master library. */
const filed = (name: string) => join(root, 'art-src', 'images', 'trophies-jpeg', name)
/** `public/images/trophies/<name>` – where he drops a replacement, next to the file it replaces. */
const dropped = (name: string) => join(root, 'public', 'images', 'trophies', name)

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'tb-art-'))
  mkdirSync(join(root, 'art-src', 'images', 'trophies-jpeg'), { recursive: true })
  mkdirSync(join(root, 'public', 'images', 'trophies'), { recursive: true })
})

afterAll(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('the art pipeline stops when it cannot name the master', () => {
  it('two masters for one target in the SAME inbox is a build failure, not a coin flip', async () => {
    writeFileSync(filed('wta250-gold.png'), await pngWithAlpha())
    writeFileSync(filed('wta250-gold.jpg'), await jpegFlat())

    // ⚠ MUTATION-VERIFIED. Restore the old `rank` (`(j.incoming ? 2 : 0) + (JPEG_RE.test(j.src) ?
    // 1 : 0)`) and this resolves silently to the jpeg instead of throwing – which is precisely the
    // four days the trophy shipped wrong. Confirmed by doing it before believing the green.
    await expect(run()).rejects.toThrow(/more than one master/)

    // The message is load-bearing: he has to pick, so it must name BOTH files, and it must say
    // which one cannot carry transparency. That sentence is the answer to his question.
    const err = await run().catch((e: Error) => e)
    expect(err).toBeInstanceOf(Error)
    const msg = (err as Error).message
    expect(msg).toContain('wta250-gold.png')
    expect(msg).toContain('wta250-gold.jpg')
    expect(msg).toMatch(/CANNOT carry transparency/)
    expect(msg).toContain('public/images/trophies/wta250-gold.webp')

    // ...and nothing was written while it was confused. A half-run pipeline that ships one guess
    // and then complains is worse than one that refuses.
    expect(existsSync(dropped('wta250-gold.webp'))).toBe(false)

    rmSync(filed('wta250-gold.jpg'))
  })

  it('a png master keeps its alpha through the encode – the white background, at its source', async () => {
    // wta250-gold.png alone in the inbox now: exactly the state the owner believed he was in.
    const res = await run()
    expect(res.encoded).toBe(1)

    const out = dropped('wta250-gold.webp')
    expect(existsSync(out)).toBe(true)
    expect(webpHasAlpha(out), 'the shipped trophy must carry a transparency channel').toBe(true)
  })

  it('a jpeg master cannot, and that is why the tie could not be broken on format', async () => {
    // The other half of the same fact, stated as a test so nobody re-adds "jpeg beats png" as a
    // harmless-looking size optimisation. It is not harmless: it is a silent alpha strip.
    writeFileSync(filed('w15-gold.jpg'), await jpegFlat())
    await run()
    expect(webpHasAlpha(dropped('w15-gold.webp'))).toBe(false)
    rmSync(filed('w15-gold.jpg'))
    rmSync(dropped('w15-gold.webp'))
  })
})

describe('the tiebreak that survives is POSITION', () => {
  it('a master dropped into public/ beats one already filed, and the filed one is left alone', async () => {
    // The owner's actual habit, and the reason `incoming` exists: he replaces a trophy where he can
    // see it, next to the webp. That is an unambiguous statement of intent - the file is newer
    // because of where it is - so it still resolves without asking.
    writeFileSync(filed('w75-gold.jpg'), await jpegFlat())
    writeFileSync(dropped('w75-gold.png'), await pngWithAlpha())

    const res = await run()
    expect(res.encoded).toBeGreaterThanOrEqual(1)
    // The dropped png won: the output has alpha, which only the png could have given it.
    expect(webpHasAlpha(dropped('w75-gold.webp'))).toBe(true)
    // The raw master left public/ (Vite would otherwise ship it verbatim) and was filed.
    expect(existsSync(dropped('w75-gold.png'))).toBe(false)
    expect(existsSync(filed('w75-gold.png'))).toBe(true)
  })
})
