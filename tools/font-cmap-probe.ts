// THE CMAP PROBE – L4-1 / P3 T1 (10.10). WHICH CODE POINTS DOES EACH SHIPPED woff2 ACTUALLY CARRY?
//
//   npm run fonts:probe                                   # the three shipped faces + any *-cyr*.woff2 on disk
//   npm run fonts:probe -- --require-cyrillic <files…>    # exit 1 unless every file carries the full Russian alphabet
//
// ⚠ THE QUESTION (docs/specs/ru-typography-2026-09.md, T1). public/fonts/README.md calls the trio "latin subset only", but a
// README is prose, and the FAMILIES Manrope and Caveat do have Cyrillic upstream. Whether OUR files do is a fact about their
// `cmap` table, so it is READ here, not recalled. The verdict decides whether the RU locale needs new subset files (T3) or only
// wiring.
//
// ⚠ ZERO DEPENDENCIES, ON PURPOSE. A woff2 is a 48-byte header, a table directory and ONE Brotli stream, and Node ships Brotli
// (`zlib.brotliDecompressSync`). `cmap` is never one of the transformed tables (only `glyf`, `loca` and, optionally, `hmtx` are),
// so the decompressed stream holds it verbatim: no font library, no devDependency, no network, no Python.
//
// ⚠ NO CYRILLIC LETTER IS SPELT IN THIS FILE. The Russian alphabet is built from its code points (U+0410..U+044F plus the two IO
// letters), so the committed diff of the typography wave stays Latin and the check cannot be fooled by an encoding accident.
//
// WHAT IT PRINTS, per file: size, family, variable axes, the cmap's code point ranges, the Unicode blocks it covers, then the
// SPECIFIC VERDICT – is U+0400..U+04FF there, are both IO letters (U+0451, U+0401) there, how many of the 66 Russian letters.
// Then, once, every `@font-face` file `src/style.css` declares and whether it exists on disk: a declared face whose file is
// absent is the GRACEFUL state T3 ships until the subsets are generated (text falls through the family stack), and this is where
// that state is visible at build time.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { brotliDecompressSync } from 'node:zlib'

const ROOT = process.cwd()
const FONT_DIR = resolve(ROOT, 'public/fonts')
const SHIPPED = ['sora-var.woff2', 'manrope-var.woff2', 'caveat-600.woff2']

// WOFF2 known-table tags, by directory index (W3C WOFF2 §5.1). Index 63 means the four tag bytes follow instead.
const KNOWN_TAGS = [
  'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT',
  'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH',
  'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar',
  'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill',
]

interface Woff2Table { tag: string; transformLength: number; offset: number }
interface Woff2 { flavor: string; tables: Map<string, Woff2Table>; sfnt: Buffer }

function readBase128(buf: Buffer, at: number): { value: number; size: number } {
  let value = 0
  for (let i = 0; i < 5; i++) {
    const byte = buf[at + i]
    if (byte === undefined) throw new Error('woff2: a UIntBase128 runs off the end of the file')
    if (i === 0 && byte === 0x80) throw new Error('woff2: a UIntBase128 with a leading zero')
    if (value > 0x01ffffff) throw new Error('woff2: a UIntBase128 overflows 32 bits')
    value = value * 128 + (byte & 0x7f)
    if ((byte & 0x80) === 0) return { value, size: i + 1 }
  }
  throw new Error('woff2: a UIntBase128 longer than five bytes')
}

function parseWoff2(file: Buffer): Woff2 {
  if (file.length < 48 || file.toString('latin1', 0, 4) !== 'wOF2') throw new Error('not a WOFF2 file (bad signature)')
  const flavor = '0x' + file.readUInt32BE(4).toString(16).padStart(8, '0')
  const numTables = file.readUInt16BE(12)
  const compressedLength = file.readUInt32BE(20)
  let pos = 48
  const dir: { tag: string; transformLength: number }[] = []
  for (let i = 0; i < numTables; i++) {
    const flags = file[pos++] ?? 0
    const index = flags & 0x3f
    const version = flags >> 6
    let tag = KNOWN_TAGS[index] ?? ''
    if (index === 63) {
      tag = file.toString('latin1', pos, pos + 4)
      pos += 4
    }
    const orig = readBase128(file, pos)
    pos += orig.size
    // glyf and loca are transformed unless the version is 3 (the null transform); every other table is transformed only if the
    // version is NOT 0. A transformed table carries a second length – the one its bytes occupy in the decompressed stream.
    const transformed = tag === 'glyf' || tag === 'loca' ? version === 0 : version !== 0
    let transformLength = orig.value
    if (transformed) {
      const t = readBase128(file, pos)
      pos += t.size
      transformLength = t.value
    }
    dir.push({ tag, transformLength })
  }
  const sfnt = brotliDecompressSync(file.subarray(pos, pos + compressedLength))
  const tables = new Map<string, Woff2Table>()
  let offset = 0
  for (const entry of dir) {
    tables.set(entry.tag, { ...entry, offset })
    offset += entry.transformLength
  }
  if (offset !== sfnt.length) throw new Error(`woff2: the directory accounts for ${offset} bytes but the stream holds ${sfnt.length}`)
  return { flavor, tables, sfnt }
}

function table(font: Woff2, tag: string): Buffer | null {
  const t = font.tables.get(tag)
  return t ? font.sfnt.subarray(t.offset, t.offset + t.transformLength) : null
}

function readFormat4(buf: Buffer, at: number, into: Set<number>): void {
  const segX2 = buf.readUInt16BE(at + 6)
  const endAt = at + 14
  const startAt = endAt + segX2 + 2
  const deltaAt = startAt + segX2
  const rangeAt = deltaAt + segX2
  for (let s = 0; s < segX2 / 2; s++) {
    const end = buf.readUInt16BE(endAt + 2 * s)
    const start = buf.readUInt16BE(startAt + 2 * s)
    const delta = buf.readUInt16BE(deltaAt + 2 * s)
    const rangeOffset = buf.readUInt16BE(rangeAt + 2 * s)
    for (let c = start; c <= end; c++) {
      let gid: number
      if (rangeOffset === 0) gid = (c + delta) & 0xffff
      else {
        const glyphAt = rangeAt + 2 * s + rangeOffset + 2 * (c - start)
        if (glyphAt + 2 > buf.length) continue
        gid = buf.readUInt16BE(glyphAt)
        if (gid !== 0) gid = (gid + delta) & 0xffff
      }
      if (gid !== 0) into.add(c)
    }
  }
}

function readFormat12(buf: Buffer, at: number, into: Set<number>): void {
  const groups = buf.readUInt32BE(at + 12)
  for (let g = 0; g < groups; g++) {
    const base = at + 16 + 12 * g
    const start = buf.readUInt32BE(base)
    const end = buf.readUInt32BE(base + 4)
    const gid0 = buf.readUInt32BE(base + 8)
    for (let c = start; c <= end; c++) if (gid0 + (c - start) !== 0) into.add(c)
  }
}

/** The UNION of every Unicode subtable the file carries, with a glyph id that is not .notdef (0). */
function readCmap(cmap: Buffer): { codepoints: Set<number>; subtables: string[] } {
  const codepoints = new Set<number>()
  const subtables: string[] = []
  const count = cmap.readUInt16BE(2)
  for (let i = 0; i < count; i++) {
    const platform = cmap.readUInt16BE(4 + 8 * i)
    const encoding = cmap.readUInt16BE(6 + 8 * i)
    const offset = cmap.readUInt32BE(8 + 8 * i)
    if (!(platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10)))) continue
    const format = cmap.readUInt16BE(offset)
    subtables.push(`(${platform},${encoding}) format ${format}`)
    if (format === 4) readFormat4(cmap, offset, codepoints)
    else if (format === 12) readFormat12(cmap, offset, codepoints)
  }
  return { codepoints, subtables }
}

function readAxes(fvar: Buffer): string[] {
  const axesAt = fvar.readUInt16BE(4)
  const count = fvar.readUInt16BE(8)
  const size = fvar.readUInt16BE(10)
  const axes: string[] = []
  for (let i = 0; i < count; i++) {
    const base = axesAt + size * i
    const fixed = (o: number): number => fvar.readInt32BE(base + o) / 65536
    axes.push(`${fvar.toString('latin1', base, base + 4)} ${fixed(4)}..${fixed(12)}`)
  }
  return axes
}

function readName(name: Buffer, wanted: number): string {
  const strAt = name.readUInt16BE(4)
  for (let i = 0; i < name.readUInt16BE(2); i++) {
    const rec = 6 + 12 * i
    if (name.readUInt16BE(rec + 6) !== wanted) continue
    const platform = name.readUInt16BE(rec)
    const from = strAt + name.readUInt16BE(rec + 10)
    const raw = name.subarray(from, from + name.readUInt16BE(rec + 8))
    return platform === 1 ? raw.toString('latin1') : Buffer.from(raw).swap16().toString('utf16le')
  }
  return '?'
}

const hex = (cp: number): string => cp.toString(16).toUpperCase().padStart(4, '0')

function toRanges(sorted: number[]): string {
  const out: string[] = []
  for (let i = 0; i < sorted.length; ) {
    let j = i
    while (j + 1 < sorted.length && sorted[j + 1] === (sorted[j] ?? 0) + 1) j++
    const a = sorted[i] ?? 0
    const b = sorted[j] ?? 0
    out.push(a === b ? `U+${hex(a)}` : `U+${hex(a)}-${hex(b)}`)
    i = j + 1
  }
  return out.join(', ')
}

const BLOCKS: [string, number, number][] = [
  ['Basic Latin', 0x20, 0x7e], ['Latin-1 Supplement', 0xa0, 0xff], ['Latin Extended-A', 0x100, 0x17f],
  ['Latin Extended-B', 0x180, 0x24f], ['Combining Diacriticals', 0x300, 0x36f], ['Greek and Coptic', 0x370, 0x3ff],
  ['Cyrillic', 0x400, 0x4ff], ['Cyrillic Supplement', 0x500, 0x52f], ['General Punctuation', 0x2000, 0x206f],
  ['Currency Symbols', 0x20a0, 0x20cf], ['Letterlike Symbols', 0x2100, 0x214f], ['Arrows', 0x2190, 0x21ff],
]

// The 66 Russian letters, built from code points: A..YA = U+0410..U+042F, a..ya = U+0430..U+044F, plus the two IO letters.
const IO_UPPER = 0x401
const IO_LOWER = 0x451
const RU_LETTERS: number[] = [IO_UPPER, IO_LOWER]
for (let cp = 0x410; cp <= 0x44f; cp++) RU_LETTERS.push(cp)
// What Russian typography leans on beyond the letters: the face either carries these or the family stack must (the latin face of
// the same family does for all but the numero sign, which sits inside the Cyrillic subset's own range).
const RU_EXTRAS: [string, number][] = [
  ['no-break space', 0xa0], ['left guillemet', 0xab], ['right guillemet', 0xbb], ['en dash', 0x2013], ['em dash', 0x2014],
  ['ellipsis', 0x2026], ['numero sign', 0x2116], ['minus sign', 0x2212],
]

interface Probe { file: string; bytes: number; text: string; verdict: 'FULL' | 'PARTIAL' | 'NONE'; ru: number }

function probe(path: string): Probe {
  const buf = readFileSync(path)
  const font = parseWoff2(buf)
  const cmap = table(font, 'cmap')
  if (!cmap) throw new Error('no cmap table')
  const { codepoints, subtables } = readCmap(cmap)
  const sorted = [...codepoints].sort((a, b) => a - b)
  const name = table(font, 'name')
  const fvar = table(font, 'fvar')
  const maxp = table(font, 'maxp')
  const os2 = table(font, 'OS/2')
  const family = name ? `${readName(name, 1)} / ${readName(name, 2)}` : '?'
  const axes = fvar ? readAxes(fvar) : []
  const inBlock = (a: number, b: number): number => sorted.filter((cp) => cp >= a && cp <= b).length
  const ru = RU_LETTERS.filter((cp) => codepoints.has(cp)).length
  const verdict = ru === RU_LETTERS.length ? 'FULL' : ru === 0 ? 'NONE' : 'PARTIAL'
  const cyr = inBlock(0x400, 0x4ff)
  const yes = (cp: number): string => (codepoints.has(cp) ? 'yes' : 'NO')
  const lines = [
    `${path.replace(ROOT + '/', '')}  ${buf.length.toLocaleString('en-US')} B  ${family}  flavor ${font.flavor}  ${font.tables.size} tables`,
    `  glyphs ${maxp ? maxp.readUInt16BE(4) : '?'} · variable axes: ${axes.length ? axes.join(', ') : 'none (static)'} · cmap ${subtables.join(' + ')}`,
    `  code points ${sorted.length} in: ${toRanges(sorted)}`,
    `  blocks  ${BLOCKS.filter(([, a, b]) => inBlock(a, b) > 0).map(([n, a, b]) => `${n} ${inBlock(a, b)}/${b - a + 1}`).join(' · ')}`,
    `  CYRILLIC U+0400-04FF: ${cyr} of 256 · Russian letters ${ru} of ${RU_LETTERS.length} · IO small U+0451 ${yes(IO_LOWER)} / IO capital U+0401 ${yes(IO_UPPER)}`,
    `  extras  ${RU_EXTRAS.map(([n, cp]) => `${n} U+${hex(cp)} ${yes(cp)}`).join(' · ')}`,
    `  OS/2 declares the Cyrillic range: ${os2 && os2.length >= 46 ? ((os2.readUInt32BE(42) & (1 << 9)) !== 0 ? 'yes' : 'no') : '?'} (the cmap above is the verdict, this is only the foundry's claim)`,
    `  VERDICT ${verdict === 'FULL' ? 'FULL – this file renders Russian, both IO letters included' : verdict === 'NONE' ? 'NO CYRILLIC – every Russian letter falls through to the next family in the stack' : `PARTIAL – ${ru} of ${RU_LETTERS.length}`}`,
  ]
  return { file: path, bytes: buf.length, text: lines.join('\n'), verdict, ru }
}

/** Every file `src/style.css` points an @font-face at, with the unicode-range it declares (null = the whole range). */
function declaredFaces(): { family: string; url: string; range: string | null }[] {
  const css = readFileSync(resolve(ROOT, 'src/style.css'), 'utf8')
  const faces: { family: string; url: string; range: string | null }[] = []
  for (const m of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    const block = m[1] ?? ''
    const family = /font-family:\s*['"]?([^'";}]+)['"]?/.exec(block)?.[1]?.trim() ?? '?'
    const url = /url\(\s*['"]?([^'")]+)['"]?\s*\)/.exec(block)?.[1] ?? '?'
    const range = /unicode-range:\s*([^;]+);/.exec(block)?.[1]?.trim() ?? null
    faces.push({ family, url, range })
  }
  return faces
}

function main(): void {
  const args = process.argv.slice(2)
  const demandCyrillic = args.includes('--require-cyrillic')
  const named = args.filter((a) => !a.startsWith('--'))
  const onDisk = existsSync(FONT_DIR) ? readdirSync(FONT_DIR) : []
  const targets = named.length
    ? named.map((f) => resolve(ROOT, f))
    : [...SHIPPED, ...onDisk.filter((n) => /-cyr.*\.woff2$/.test(n)).sort()].map((n) => resolve(FONT_DIR, n))
  console.log('font-cmap-probe – zero-dependency woff2 reader (header -> table directory -> brotli -> cmap)\n')
  const results: Probe[] = []
  for (const path of targets) {
    try {
      const result = probe(path)
      results.push(result)
      console.log(result.text + '\n')
    } catch (error) {
      console.log(`${path}: UNREADABLE – ${(error as Error).message}\n`)
      process.exitCode = 1
    }
  }
  console.log('declared faces in src/style.css:')
  const absent: string[] = []
  for (const face of declaredFaces()) {
    const present = existsSync(resolve(ROOT, 'public' + face.url))
    if (!present) absent.push(face.url)
    console.log(`  ${present ? 'present' : 'ABSENT '}  ${face.url}  family ${face.family}  unicode-range ${face.range ?? '(whole range)'}`)
  }
  const count = (v: Probe['verdict']): number => results.filter((r) => r.verdict === v).length
  console.log(
    `\nSUMMARY ${results.length} file(s) read · Cyrillic FULL ${count('FULL')} / PARTIAL ${count('PARTIAL')} / NONE ${count('NONE')} · ` +
      `declared but absent on disk: ${absent.length ? absent.join(', ') : 'none'}` +
      (absent.length ? ' (graceful: the text falls through the family stack until the file lands)' : ''),
  )
  if (demandCyrillic && results.some((r) => r.verdict !== 'FULL')) {
    console.log('--require-cyrillic: FAILED – at least one file lacks part of the Russian alphabet')
    process.exitCode = 1
  }
}

main()
