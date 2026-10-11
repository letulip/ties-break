// THE COMPILED-ERA SMOKE LAW – shared by the L2 Russian smokes (11.10, the blanket).
//
// Until 11.10 `src/i18n/ru.json` held the handful of rows the owner had APPROVED, and each L2 smoke read it two ways:
// «every APPROVED row wired on these surfaces renders his Russian» and «every unapproved one renders English and is
// counted». The blanket ruling («всё должно быть переведено, кроме имён и названий») compiled his DRAFT rows as
// written – 56 -> 3 310 – so the second half has almost nothing left to bite and the first half meets values it was
// never built for: a NAMED hole (`№{rank}`), an ICU plural (`{0, plural, one{# неделя} …}`).
//
// ⚠ THE CLAIM IS KEPT, NOT RELAXED. It is the same two claims with the word «compiled» where «approved» stood:
//   · COMPILED ARM – his Russian reaches the screen. Measured on the keys the mounts actually ASKED the catalog for
//     (`recordingCatalog` – the runtime reads `catalog[key]`, so a Proxy sees every lookup): every key ru.json carries
//     that a mounted screen asked for puts every hole-free piece of its value on the screen it drew (`compiledArm`).
//     An asked-and-compiled key that is NOT drawn is named, with its reason, and the record is held both ways: an
//     unnamed one is red, and a named one that renders is a stale exemption and red too – an exemption list may not rot.
//   · MISS ARM – the counter and ru.json agree, in both directions, against the recorder as the oracle
//     (`expectCounterIsExact`): nothing ru.json carries is ever counted, and everything a screen asked for that it does
//     not carry IS; and each label the file always named falls the way the catalog says – counted and English on screen
//     when there is no row, not counted and Russian on screen when there is one (`expectLabelsFollowTheCatalog`).
//     A surface with nothing left to count says so as a number; it does not pretend.
// ⚠ WHY THE UNIVERSE IS «ASKED», NOT «WIRED HERE». The approved-era smokes walked every wired key of a surface and named
// the few a pose could not show. Against 3 310 compiled rows that list is a hundred names per file – 117 for Home alone:
// a mood word the career is not in, a coach read for another style, a greeting band, a travel mode – real alternatives of
// ONE screen, not defects – and every string added on a surface would have to be added to a test file by hand. A list
// that long is a snapshot of a pose, not a law, and it makes the net the thing everybody edits. What the old walk really
// proved is «the screen is not silently English where a row exists»; that is exactly «every asked key renders», with no
// list. What the walk added on top – COVERAGE, how much of the surface's vocabulary the poses even reach – is not dropped
// either: it is a number with a floor (`coverageFloor` in each call, measured 11.10: the measured share less 0.03, rounded
// down to 0.05) and the run prints `reached X of Y`, so the share can only rot loudly.
// No Cyrillic is typed in any test: every expectation is READ from ru.json (invariant 4).
import { readFileSync } from 'node:fs'
import { expect } from 'vitest'
import { nextTick } from 'vue'
import { splitContext } from '../../src/shared/i18n'

let catalogKeys: Record<string, unknown> | null = null
/** The committed catalog's keys – the only strings the oracle below treats as keys (the Proxy also sees property reads that are not lookups). */
function catalogOf(): Record<string, unknown> {
  catalogKeys ??= (JSON.parse(readFileSync('src/i18n/catalog.en.json', 'utf8')) as { keys: Record<string, unknown> }).keys
  return catalogKeys
}

/** One thing a message says: text, a hole, or a choice (plural / select) whose branches are alternatives. */
type Piece = { k: 'text'; text: string } | { k: 'hole' } | { k: 'choice'; branches: Piece[][] }

/** Parse a message the way `src/shared/i18n.ts` reads it (escapes `\{ \} \\ \#`, `#` is a hole inside a plural), without validating it. */
function parse(src: string, from: number, nested: boolean, inPlural: boolean): { pieces: Piece[]; next: number } {
  const pieces: Piece[] = []
  let text = ''
  let i = from
  const flush = (): void => {
    if (text !== '') pieces.push({ k: 'text', text })
    text = ''
  }
  while (i < src.length) {
    const c = src[i]!
    if (c === '\\' && i + 1 < src.length && '{}\\#'.includes(src[i + 1]!)) {
      text += src[i + 1]
      i += 2
    } else if (c === '{') {
      flush()
      const group = parseGroup(src, i + 1, inPlural)
      pieces.push(group.piece)
      i = group.next
    } else if (c === '}') {
      if (nested) break
      i++ // a stray closing brace: the product parser calls it an error, a smoke just steps over it
    } else if (c === '#' && inPlural) {
      flush()
      pieces.push({ k: 'hole' })
      i++
    } else {
      text += c
      i++
    }
  }
  flush()
  return { pieces, next: i }
}

/** After an opening brace: `name}` is a hole; `name, plural|select, sel{…} sel{…}}` is a choice. Returns past the closing brace. */
function parseGroup(src: string, from: number, inPlural: boolean): { piece: Piece; next: number } {
  let i = from
  while (i < src.length && src[i] !== '}' && src[i] !== ',') i++
  if (src[i] !== ',') return { piece: { k: 'hole' }, next: Math.min(src.length, i + 1) }
  i++ // the comma after the name
  const typeStart = i
  while (i < src.length && src[i] !== ',' && src[i] !== '}') i++
  const type = src.slice(typeStart, i).trim()
  if (src[i] !== ',') return { piece: { k: 'hole' }, next: Math.min(src.length, i + 1) }
  i++
  const branches: Piece[][] = []
  for (;;) {
    while (i < src.length && /\s/.test(src[i]!)) i++
    if (i >= src.length) break
    if (src[i] === '}') {
      i++
      break
    }
    while (i < src.length && src[i] !== '{' && src[i] !== '}') i++ // the selector word
    if (src[i] !== '{') break
    const body = parse(src, i + 1, true, type === 'plural' ? true : inPlural)
    branches.push(body.pieces)
    i = body.next + 1 // past the branch's closing brace
  }
  return { piece: { k: 'choice', branches }, next: i }
}

/** The hole-free text of a run of pieces, split where a hole or a choice sat, trimmed, empties dropped. */
function segmentsOf(pieces: readonly Piece[]): string[] {
  const out: string[] = []
  let cur = ''
  for (const p of pieces) {
    if (p.k === 'text') cur += p.text
    else {
      out.push(cur)
      cur = ''
    }
  }
  out.push(cur)
  return out.map((s) => s.trim()).filter((s) => s !== '')
}

/** What a message obliges a screen to show. Each CLAIM is a list of ALTERNATIVES (one for the text outside every choice; for a plural or select, one per branch – the count decides which renders),
 *  and each alternative is a list of segments that must ALL be on screen. A claim holds when any alternative holds. */
export function claimsOf(message: string): string[][][] {
  const { pieces } = parse(message, 0, false, false)
  const claims: string[][][] = []
  const outside = segmentsOf(pieces)
  if (outside.length > 0) claims.push([outside])
  for (const p of pieces) {
    if (p.k !== 'choice') continue
    const alternatives = p.branches.map((b) => segmentsOf(b)).filter((a) => a.length > 0)
    // a branch with no text of its own (`other{#}`) can render with nothing to see: the group then claims nothing, and says so by not being a claim
    if (alternatives.length === p.branches.length && alternatives.length > 0) claims.push(alternatives)
  }
  return claims
}

/** The unmet claims of a message against what a screen shows: `[]` when it all renders. Each entry names the segments of the alternative that came closest. */
export function unmetClaims(message: string, screen: string): string[][] {
  const unmet: string[][] = []
  for (const claim of claimsOf(message)) {
    if (claim.some((alt) => alt.every((s) => screen.includes(s)))) continue
    const closest = [...claim].sort((a, b) => a.filter((s) => !screen.includes(s)).length - b.filter((s) => !screen.includes(s)).length)[0] ?? []
    unmet.push(closest.filter((s) => !screen.includes(s)))
  }
  return unmet
}

/** key -> the segments missing from the screen, for every listed key whose value is not fully on it. */
export function renderGaps(keys: readonly string[], ru: Readonly<Record<string, string>>, screen: string): Map<string, string[]> {
  const gaps = new Map<string, string[]>()
  for (const key of keys) {
    const value = ru[key]
    if (value === undefined) continue
    const unmet = unmetClaims(value, screen)
    if (unmet.length > 0) gaps.set(key, unmet.flat())
  }
  return gaps
}

/** The COMPILED ARM's verdict: the gaps are EXACTLY the file's named exceptions – no unnamed one (an asked, compiled key that did not render), and no stale name (an exemption for a key that renders, or is not asked / not compiled). */
export function expectGapsAreNamed(gaps: ReadonlyMap<string, string[]>, namedPoseGaps: Readonly<Record<string, string>>, what: string): void {
  const unnamed = [...gaps.entries()].filter(([key]) => namedPoseGaps[key] === undefined).map(([key, missing]) => `${key}  [missing: ${missing.map((s) => `«${s}»`).join(' ')}]`)
  expect(unnamed, `${what}: asked and compiled, but not on screen and not a named exception – his Russian must render, or the exception needs a name and a reason`).toEqual([])
  const stale = Object.keys(namedPoseGaps).filter((key) => !gaps.has(key))
  expect(stale, `${what}: named exceptions that are no gap any more (the key renders, is not asked, or ru.json no longer carries it) – delete the exemption`).toEqual([])
  for (const [key, reason] of Object.entries(namedPoseGaps)) expect(reason.length, `${key}: an exception is named WITH its reason`).toBeGreaterThan(10)
}

/** ru.json as the runtime reads it – `catalog[key]` – recording every key a mounted screen ASKS for (hits and misses alike). Install `catalog`, flip the locale, `await begin()`, then mount and read `asked`.
 *  ⚠ `begin()` is not decoration: a component an EARLIER test of the same file left mounted (`document.body.innerHTML = ''` removes its nodes, not the instance) re-renders the moment the real catalog
 *  arrives and asks for its words with nothing on screen to show them – the first version of this arm, run as a whole file, reported four such "gaps" that the same test run alone did not have.
 *  `begin()` lets those re-renders happen and discards what they asked, then starts recording; the test calls `resetMisses()` AFTER it for the same reason. */
export function recordingCatalog(ru: Readonly<Record<string, string>>): { catalog: Record<string, string>; asked: Set<string>; begin: () => Promise<void> } {
  const asked = new Set<string>()
  let on = false
  const catalog = new Proxy(ru as Record<string, string>, {
    get(target, prop, receiver) {
      if (on && typeof prop === 'string' && !prop.startsWith('__v_')) asked.add(prop)
      return Reflect.get(target, prop, receiver)
    },
  })
  const begin = async (): Promise<void> => {
    await nextTick()
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    asked.clear()
    on = true
  }
  return { catalog, asked, begin }
}

/** THE COMPILED ARM, whole: every compiled key the mounts asked for is on the screen (bar the NAMED ones that are asked but not drawn), and the poses still reach a real share of what is wired here.
 *  Returns what was observed and what was not, so the caller can print it. */
export function compiledArm(o: {
  what: string
  ru: Readonly<Record<string, string>>
  asked: ReadonlySet<string>
  screen: string
  /** The compiled, wired keys the catalog homes on the surfaces these mounts draw – the vocabulary the coverage share is taken of. */
  wiredHere: readonly string[]
  /** Asked, compiled, and not drawn – each with its reason (an attribute the harness's `seen` does not read, a label read for logic and never shown…). */
  notDrawn?: Readonly<Record<string, string>>
  /** The least share of `wiredHere` the poses must reach: measured 11.10, rounded down – a floor that moves only on purpose. */
  coverageFloor: number
  /** Narrow the claim to these keys when the HOST screen builds other tabs' labels eagerly (a Money screen computes its Spend and Staff labels while the smoke is about the Shop tab) – the keys the smoke is ABOUT. */
  only?: readonly string[]
}): { observed: string[]; unreached: string[]; askedCompiled: string[] } {
  const scope = o.only ? new Set(o.only) : null
  const askedCompiled = [...o.asked].filter((key) => o.ru[key] !== undefined && (scope === null || scope.has(key)))
  expectGapsAreNamed(renderGaps(askedCompiled, o.ru, o.screen), o.notDrawn ?? {}, o.what)
  const wired = o.wiredHere.filter((key) => o.ru[key] !== undefined)
  const observed = wired.filter((key) => o.asked.has(key))
  const unreached = wired.filter((key) => !o.asked.has(key))
  expect(observed.length / Math.max(1, wired.length), `${o.what}: the poses reach ${observed.length} of the ${wired.length} compiled, wired keys of these surfaces – coverage fell below its floor (extend the pose, or move the floor on purpose). Not reached: ${unreached.slice(0, 80).map((k) => JSON.stringify(k.slice(0, 60))).join(' | ')}`).toBeGreaterThanOrEqual(o.coverageFloor)
  return { observed, unreached, askedCompiled }
}

/** THE MISS ARM, generic half – the counter is EXACT, in both directions, against an oracle that does not depend on the counter: the recorder knows which keys the mounts asked for.
 *  · nothing ru.json carries is ever counted (a compiled key that IS counted is a value that failed to format, or a lookup the catalog and the runtime disagree about – the defects a 3 310-row file can hide);
 *  · every catalog key a screen asked for that ru.json does NOT carry IS counted (a counter that counts nothing – or misses a path – leaves English on screen with nobody told: ruling 4).
 *  The second direction is what keeps the arm alive on a surface whose every word is compiled: the label lists below can only bite on words still waiting for a row. */
export function expectCounterIsExact(asked: ReadonlySet<string>, missed: readonly string[], ru: Readonly<Record<string, string>>): void {
  expect(
    missed.filter((key) => ru[key] !== undefined),
    'a key ru.json carries is counted as a miss – the value did not format, or the counter and the catalog disagree',
  ).toEqual([])
  const catalog = catalogOf()
  const uncounted = [...asked].filter((key) => catalog[key] !== undefined && ru[key] === undefined && !missed.includes(key))
  expect(uncounted, 'asked for, no row in ru.json, and NOT counted as a miss – English on screen that nobody was told about').toEqual([])
}

/** The old name for the first direction alone – for a test that has no recorder. */
export function expectNoCompiledKeyIsCounted(missed: readonly string[], ru: Readonly<Record<string, string>>): void {
  expect(
    missed.filter((key) => ru[key] !== undefined),
    'a key ru.json carries is counted as a miss – the value did not format, or the counter and the catalog disagree',
  ).toEqual([])
}

/** THE MISS ARM, label half – the pre-blanket lines `expect(everything).toContain('<English>')` + `expect(missedKeys()).toContain(label)`, read from the catalog instead of from a belief: a label with no row is
 *  counted and shows its ENGLISH; a label with a row is not counted and shows his RUSSIAN. Either way it is on the screen the mounts drew. */
export function expectLabelsFollowTheCatalog(labels: readonly string[], missed: readonly string[], ru: Readonly<Record<string, string>>, screen: string): void {
  for (const key of labels) {
    const row = ru[key]
    const shown = unmetClaims(row ?? splitContext(key).text, screen)
    expect(missed.includes(key), `«${key}»: ${row === undefined ? 'no row compiled, so it is a counted miss' : 'his row compiled, so it is not one'}`).toBe(row === undefined)
    expect(shown, `«${key}»: ${row === undefined ? 'English, as written' : 'his Russian'} must be on the screen`).toEqual([])
  }
}
