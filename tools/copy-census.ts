// ⭐⭐ THE COPY CENSUS – HOW BIG IS THE PLAYER-FACING COPY CORPUS, IN NUMBERS. Alpha-readiness §C,
// ordered 30.09. It is the denominator for the RU / ES localization decision (RU first, the owner
// authors; ES only through a trusted human translator; both AFTER a key-extraction wave), and it
// also runs §A3's round-44 check: the LIVE small-talk pool counted against the documents.
//
//   npx vite-node tools/copy-census.ts [--misses] [--dump <path-substring>]
//     --misses  lists EVERY registered string the scan did not find; --dump prints what one file contributed
//
// ⚠ DETERMINISTIC AND DRAW-FREE. No engine draws, no network, no clock, no Math.random. It reads the
// TRACKED tree (`git ls-files`, the same H-03 rule the tools registry follows – an untracked scratch
// file in someone's checkout cannot move a number), sorts every list, and picks its 20 LIKELY
// samples by sha1 order rather than by chance. Two runs on one tree print byte-identical text; the
// last lines carry the sha1 of the body so that can be checked across runs and across commits.
//
// The READER of the tree lives in tools/copy-census-walk.ts (extracted 08.10 for the i18n extractor); the
// classification below in that file is the methodology, and this file prints the report over its arrays.
//

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { SMALL_TALK_FRAMES, SMALL_TALK_SITUATIONS } from '../src/engine/world/lifeBeat'
import {
  AREAS,
  HOLE,
  bareOf,
  certain,
  econ,
  excluded,
  excludedWords,
  filesBySeg,
  hasHole,
  letterCount,
  likely,
  normKey,
  otherAttr,
  outsideFiles,
  outsideStr,
  outsideWords,
  scanned,
  scannedVue,
  seen,
  srcOutside,
  tracked,
  vueErrors,
  wordsOf,
} from './copy-census-walk'
import type { Item } from './copy-census-walk'

const SAMPLE = 20 // how many LIKELY strings the report prints

// ── tallies ──────────────────────────────────────────────────────────────────────────────────────
interface Tally {
  n: number
  words: number
  interp: number
  unique: number
}
function tally(items: readonly Item[]): Tally {
  const u = new Set<string>()
  let words = 0
  let interp = 0
  for (const it of items) {
    words += wordsOf(it.text)
    if (hasHole(it.text)) interp++
    u.add(it.text)
  }
  return { n: items.length, words, interp, unique: u.size }
}
const num = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
const lp = (v: string | number, w: number): string => String(v).padStart(w)
const rp = (v: string, w: number): string => v.padEnd(w)
const pct = (a: number, b: number): string => (b === 0 ? '0.0%' : `${((a / b) * 100).toFixed(1)}%`)
const clip = (s: string, n: number): string => {
  const one = s.replace(/\s+/g, ' ')
  return one.length > n ? `${one.slice(0, n - 1)}…` : one
}

const out: string[] = []
const P = (s = ''): void => {
  out.push(s)
}

const both = [...certain, ...likely]
const tC = tally(certain)
const tL = tally(likely)
const tAll = tally(both)

P('copy-census – the player-facing copy corpus of the tracked tree (deterministic, no draws, no clock)')
P(`  scanned ${num(scanned)} source files (${num(scannedVue)} .vue) plus the live ECONOMY and small-talk objects`)
P()
P('1. HEADLINE')
P(`   ${rp('', 28)}${lp('strings', 10)}${lp('unique', 10)}${lp('words', 11)}`)
P(`   ${rp('CERTAIN player-facing', 28)}${lp(num(tC.n), 10)}${lp(num(tC.unique), 10)}${lp(num(tC.words), 11)}`)
P(`   ${rp('LIKELY (sampled, below)', 28)}${lp(num(tL.n), 10)}${lp(num(tL.unique), 10)}${lp(num(tL.words), 11)}`)
P(`   ${rp('GRAND TOTAL', 28)}${lp(num(tAll.n), 10)}${lp(num(tAll.unique), 10)}${lp(num(tAll.words), 11)}`)
P('   words = whitespace tokens after every ${…} is stripped; unique = distinct texts (what a translator bills once)')
const outStrings = Object.values(outsideStr).reduce((a, b) => a + b, 0)
const outWords = Object.values(outsideWords).reduce((a, b) => a + b, 0)
const outLead = Object.keys(outsideStr)
  .sort((a, b) => (outsideWords[b] ?? 0) - (outsideWords[a] ?? 0) || (a < b ? -1 : 1))
  .slice(0, 2)
  .map((d) => `src/${d} ${num(outsideStr[d] ?? 0)} strings / ${num(outsideWords[d] ?? 0)} words`)
  .join(', ')
P(`   NOT in these totals (outside the brief's scope, measured under EXCLUDED): ${num(outStrings)} strings / ${num(outWords)} words – ${outLead}`)
P()
P('2. PER AREA (by home path first, then context)')
P(`   ${rp('area', 32)}${lp('CERT str', 10)}${lp('CERT words', 12)}${lp('LIKELY str', 12)}${lp('LIKELY words', 14)}${lp('CERT w/ ${…}', 14)}`)
for (const [area, label] of AREAS) {
  const c = tally(certain.filter((i) => i.area === area))
  const l = tally(likely.filter((i) => i.area === area))
  P(`   ${rp(label, 32)}${lp(num(c.n), 10)}${lp(num(c.words), 12)}${lp(num(l.n), 12)}${lp(num(l.words), 14)}${lp(num(c.interp), 14)}`)
}
P(`   ${rp('TOTAL', 32)}${lp(num(tC.n), 10)}${lp(num(tC.words), 12)}${lp(num(tL.n), 12)}${lp(num(tL.words), 14)}${lp(num(tC.interp), 14)}`)
P()
const reasons = [...new Set(certain.map((i) => i.reason))].sort()
P('   CERTAIN by rule:')
for (const r of reasons) {
  const t = tally(certain.filter((i) => i.reason === r))
  P(`     ${rp(r, 22)}${lp(num(t.n), 9)} strings${lp(num(t.words), 11)} words`)
}
const econKeys = ['label', 'blurb', 'name'].map((k) => `${k} ${econ.filter((e) => e.key === k).length}`).join(', ')
P(`   ECONOMY walk found ${econ.length} label/blurb/name strings (${econKeys}); ${num(excluded['economy source literal (counted once, by the live walk)'] ?? 0)} source literals deduped against it`)
const byFile = new Map<string, { n: number; words: number }>()
for (const it of certain) {
  const cur = byFile.get(it.file) ?? { n: 0, words: 0 }
  cur.n++
  cur.words += wordsOf(it.text)
  byFile.set(it.file, cur)
}
const top = [...byFile.entries()].sort((a, b) => b[1].words - a[1].words || (a[0] < b[0] ? -1 : 1)).slice(0, 12)
P('   largest CERTAIN homes by words:')
for (const [f, t] of top) P(`     ${lp(num(t.words), 8)} words ${lp(num(t.n), 7)} strings  ${f}`)
P()
P('3. INTERPOLATION LOAD (CERTAIN strings carrying at least one ${…} – the plural / case work RU will need)')
P(`   ${num(tC.interp)} of ${num(tC.n)} CERTAIN strings (${pct(tC.interp, tC.n)}) carry >= 1 \${…}`)
P(`   ${rp('', 22)}${lp('with ${…}', 10)}${lp('of', 9)}${lp('share', 8)}`)
for (const r of reasons) {
  const t = tally(certain.filter((i) => i.reason === r))
  P(`   ${rp(r, 22)}${lp(num(t.interp), 10)}${lp(num(t.n), 9)}${lp(pct(t.interp, t.n), 8)}`)
}
const OTHER_PH = /\{[A-Za-z_][\w.]*\}|%[sd]|\{\{/
const otherPh = certain.filter((i) => OTHER_PH.test(bareOf(i.text)))
P(`   caveat: ${num(otherPh.length)} more CERTAIN strings carry a different placeholder syntax ({name}, %s, {{ }}) that the \${…} count cannot see`)
P()

// 4. the round-44 check ---------------------------------------------------------------------------
let situations = 0
let openers = 0
let replies = 0
let stanceLabels = 0
const labelSets = new Map<string, Set<string>>()
let sharedBeats = 0
let underFour = 0
const ids = new Set<string>()
for (const s of SMALL_TALK_SITUATIONS) {
  situations++
  ids.add(s.id)
  const voices = Object.values(s.voices).filter((v): v is NonNullable<typeof v> => v !== undefined)
  if (voices.length < 4) underFour++
  for (const v of voices) {
    if (v.opener) openers++
    if (v.shared) sharedBeats++
    for (const [stance, b] of Object.entries(v.branches)) {
      if (b.label) stanceLabels++
      if (b.said) replies++
      const k = `${s.id}|${stance}`
      let set = labelSets.get(k)
      if (!set) {
        set = new Set<string>()
        labelSets.set(k, set)
      }
      set.add(b.label)
    }
  }
}
const frames = Object.entries(SMALL_TALK_FRAMES).map(([k, v]) => `${k} ${v.length}`)
const corpusHead = readFileSync('src/engine/world/smallTalkCorpus.ts', 'utf8').slice(0, 1500)
const hm = corpusHead.match(/(\d+) situations × (\d+) voices: (\d+) openers, (\d+) stance labels, (\d+) replies, (\d+) shared/)
const hdr = { s: Number(hm?.[1] ?? NaN), o: Number(hm?.[3] ?? NaN), l: Number(hm?.[4] ?? NaN), r: Number(hm?.[5] ?? NaN) }
let distinctLabels = 0
for (const set of labelSets.values()) distinctLabels += set.size
const DOC = { s: 43, o: 172, r: 516 }
const CLAIM = { s: 51, o: 51 * 4, r: 51 * 4 * 3 }
const verdict = (live: number, claim: number): string => (live === claim ? 'MATCH' : live < claim ? `SHORT by ${claim - live}` : `OVER by ${live - claim}`)
P('4. ROUND-44 CHECK (alpha-readiness §A3) – the LIVE small-talk pool, counted from SMALL_TALK_SITUATIONS')
P(`   ${rp('figure', 12)}${lp('documented', 12)}${lp('wave claim', 12)}${lp('corpus header', 15)}${lp('LIVE', 8)}   vs claim / vs documented`)
const row = (name: string, d: number | null, c: number, h: number, live: number): void =>
  P(
    `   ${rp(name, 12)}${lp(d ?? 'n/a', 12)}${lp(c, 12)}${lp(Number.isNaN(h) ? 'n/a' : h, 15)}${lp(live, 8)}   ${verdict(live, c)}${d === null ? '' : ` / ${live - d >= 0 ? '+' : ''}${live - d}`}`,
  )
row('situations', DOC.s, CLAIM.s, hdr.s, situations)
row('openers', DOC.o, CLAIM.o, hdr.o, openers)
row('replies', DOC.r, CLAIM.r, hdr.r, replies)
row('labels', null, 51 * 3, hdr.l, distinctLabels)
P(`   wave claim = §A3's 51 situations x 4 voices x 3 stances (the corpus header's own structure); documented = the 43/172/516 document`)
P(`   labels = distinct stance labels per situation x stance (the header's «153»); ${num(stanceLabels)} label strings across the four voice columns`)
P(`   also live: ${sharedBeats} shared second beats, ${ids.size} distinct situation ids (${situations - ids.size} duplicate), ${underFour} situations with fewer than 4 voices`)
P(`   also live: ${frames.join(', ')} scene frames (SMALL_TALK_FRAMES, one pool that wraps every situation)`)
const allMatch = situations === CLAIM.s && openers === CLAIM.o && replies === CLAIM.r && underFour === 0 && ids.size === situations && (Number.isNaN(hdr.l) || distinctLabels === hdr.l)
P(
  allMatch
    ? `   ROUND-44 VERDICT: MATCH – live ${situations} / ${openers} / ${replies} equals the wave claim; the 43 / 172 / 516 document is stale by +${situations - DOC.s} / +${openers - DOC.o} / +${replies - DOC.r}.`
    : `   ROUND-44 VERDICT: FINDING – live ${situations} / ${openers} / ${replies} against the claim ${CLAIM.s} / ${CLAIM.o} / ${CLAIM.r} (${underFour} situations under four voices, ${situations - ids.size} duplicate ids).`,
)
P()

// EXCLUDED ----------------------------------------------------------------------------------------
P('EXCLUDED (counted, not read)')
const order = [
  'ident',
  'seed',
  'path',
  'hex',
  'css',
  'nowords',
  'short phrase (< 15, has a space) – recall risk',
  'single capitalised word – recall risk',
  'oneword',
  'economy source literal (counted once, by the live walk)',
]
for (const k of order) {
  const label = k === 'ident' ? 'identifier / id / key shapes' : k === 'nowords' ? 'fewer than 2 letters or digits' : k === 'oneword' ? 'other single tokens' : k
  const w = excludedWords[k]
  P(`   ${rp(label, 58)}${lp(num(excluded[k] ?? 0), 9)}${w === undefined ? '' : `${lp(num(w), 9)} words`}`)
}
const attrTop = Object.entries(otherAttr)
  .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
  .slice(0, 8)
const attrTotal = Object.values(otherAttr).reduce((a, b) => a + b, 0)
P(`   ${rp('.vue static attributes outside the four, text-shaped – recall risk', 58)}${lp(num(attrTotal), 9)}   top: ${attrTop.map(([k, n]) => `${k} ${n}`).join(', ') || 'none'}`)
const fileBits = Object.entries(filesBySeg)
  .sort((a, b) => (a[0] < b[0] ? -1 : 1))
  .map(([k, n]) => `${k} ${num(n)}`)
  .join(', ')
const srcBits = Object.entries(srcOutside)
  .sort((a, b) => (a[0] < b[0] ? -1 : 1))
  .map(([k, n]) => `${k} ${n}`)
  .join(', ')
P(`   files not read: ${fileBits}`)
P(`   src files that are not source (not read): ${srcBits || 'none'}`)
const outDirs = Object.keys(outsideFiles).sort()
P(`   src OUTSIDE the brief's scope (read only to measure it; text-shaped >= 15-char literals, NOT in any total above):`)
for (const d of outDirs) P(`     ${rp(d, 12)}${lp(outsideFiles[d] ?? 0, 4)} files${lp(num(outsideStr[d] ?? 0), 8)} strings${lp(num(outsideWords[d] ?? 0), 9)} words`)
P(`   .vue files that raised a parse error: ${vueErrors}`)
const devN = likely.filter((i) => i.dev).length
P(`   LIKELY purity hint: ${num(devN)} of ${num(likely.length)} LIKELY strings (${pct(devN, likely.length)}) sit inside throw / new Error / console.*`)
P()

// STRINGS-TABLE CROSS-CHECK -----------------------------------------------------------------------
const tableFiles = tracked.filter((f) => /^docs\/plans\/.*strings.*\.md$/.test(f))
const registered = new Map<string, string>()
let tables = 0
let rows = 0
let struck = 0
let superseded = 0
for (const f of tableFiles) {
  const lines = readFileSync(f, 'utf8').split('\n')
  for (let i = 0; i + 1 < lines.length; i++) {
    const head = lines[i] ?? ''
    const sep = lines[i + 1] ?? ''
    if (!head.startsWith('|') || !/^\|?\s*:?-{2,}/.test(sep)) continue
    const cells = (l: string): string[] => l.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim())
    const col = cells(head).findIndex((h) => /^(?:text|the string, verbatim|the string|string|the draft|draft)$/i.test(h.replace(/`/g, '').trim()))
    if (col < 0) continue
    tables++
    for (let j = i + 2; j < lines.length && (lines[j] ?? '').startsWith('|'); j++) {
      if (/SUPERSEDED/.test(lines[j] ?? '')) {
        superseded++ // the row's own status cell says a later wave replaced this wording
        continue
      }
      let cell = cells(lines[j] ?? '')[col] ?? ''
      if (cell.length > 2 && cell.startsWith('`') && cell.endsWith('`')) cell = cell.slice(1, -1)
      cell = cell.replace(/\\\|/g, '|').replace(/\s+/g, ' ').trim()
      if (cell.startsWith('~~')) {
        // a row the table itself marks superseded: `~~old~~` is dead, `~~old~~ → **new**` carries its successor
        const next = cell.match(/^~~.*?~~\s*→\s*(.+)$/)
        if (!next) {
          struck++
          continue
        }
        cell = (next[1] ?? '').replace(/^\*\*|\*\*$/g, '').trim()
      }
      if (letterCount(cell) < 2) continue
      rows++
      const key = normKey(cell)
      if (!registered.has(key)) registered.set(key, `${f.slice('docs/plans/'.length)}`)
    }
    i = i + 1
  }
}
const certainKeys = new Set(certain.map((i) => normKey(i.text)))
const likelyKeys = new Set(likely.map((i) => normKey(i.text)))
let inCertain = 0
let inLikely = 0
let inOther = 0
const missing: string[] = []
const missDocs: Record<string, number> = {}
for (const [key, doc] of registered) {
  if (certainKeys.has(key)) inCertain++
  else if (likelyKeys.has(key)) inLikely++
  else if (seen.has(key)) inOther++
  else {
    missing.push(`${doc}: ${clip(key.split(HOLE).join('${…}'), 70)}`)
    missDocs[doc] = (missDocs[doc] ?? 0) + 1
  }
}
P(`STRINGS-TABLE CROSS-CHECK (recall) – ${tableFiles.length} docs/plans/*strings*.md files, ${tables} tables, ${num(rows)} rows, ${num(registered.size)} distinct registered strings`)
P(`   found in CERTAIN ${num(inCertain)} (${pct(inCertain, registered.size)}) · only in LIKELY ${num(inLikely)} · seen but classified EXCLUDED ${num(inOther)} · not found in any scanned literal ${num(missing.length)} (${pct(missing.length, registered.size)})`)
const missBits = Object.entries(missDocs)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([d, n]) => `${d.replace(/-strings-2026-09\.md$/, '')} ${n}`)
  .join(', ')
P(`   misses by doc: ${missBits || 'none'} · skipped as superseded: ${superseded} rows flagged SUPERSEDED, ${struck} struck-through`)
for (const m of missing.slice(0, process.argv.includes('--misses') ? missing.length : 6)) P(`     miss  ${m}`)
P()

// LIKELY sample -----------------------------------------------------------------------------------
const sample = likely
  .map((i) => ({ i, h: createHash('sha1').update(`census-sample:${i.file}:${i.line}:${i.text}`).digest('hex') }))
  .sort((a, b) => (a.h < b.h ? -1 : 1))
  .slice(0, SAMPLE)
P(`LIKELY SAMPLE – ${SAMPLE} of ${num(likely.length)}, picked by sha1 order (deterministic, not chance)`)
sample.forEach(({ i }, k) => P(`   ${lp(k + 1, 2)}. ${i.file}:${i.line}${i.dev ? ' [dev-ctx]' : ''}  «${clip(i.text, 100)}»`))
P()

// --dump ------------------------------------------------------------------------------------------
const dumpAt = process.argv.indexOf('--dump')
if (dumpAt >= 0) {
  const needle = process.argv[dumpAt + 1] ?? ''
  const needles = needle.split(',').filter(Boolean)
  P(`DUMP of everything CERTAIN or LIKELY whose file contains «${needle}»`)
  for (const it of [...certain, ...likely]) {
    if (needles.some((n) => it.file.includes(n))) P(`   ${rp(it.reason, 15)}${rp(it.area, 10)}${it.file}:${it.line}  «${clip(it.text, 110)}»`)
  }
  P()
}

// DETERMINISM -------------------------------------------------------------------------------------
const body = out.join('\n')
P('5. DETERMINISM')
P('   sorted inputs (git ls-files), sha1-ordered sample, no clock, no draws, no absolute paths – the same tree prints the same bytes')
P(`   body sha1 ${createHash('sha1').update(body).digest('hex').slice(0, 12)} (over every line above this one)`)
P('CENSUS_DONE')
console.log(out.join('\n'))

