// L3-1 (10.10) – THE LEDGER / RECEIPT WRITERS EMIT `c` BESIDE `text`. docs/specs/i18n-2026-10.md §5, §8 rows L3-0 / L3-1.
//
// WHAT THE WAVE DID: every writer of a money row (a row with `amountCents`: the Money ledger) and of the staff / booking / entry / tournament-settlement
// feed rows (RU-11E / G / H / I / K-money / L, RU-06 §17–19 + §26–27) now writes the same sentence TWICE – `text` as before, byte for byte, and `c`, the
// CopyRef `{ k, p }` – so a screen can show it under the current locale (`eventText`, L3-0) while every reader that COMPARES `text` keeps working.
//
// ⚠⚠ THE RE-KEY LAW (L3-0's warning, binding on every wave after it): a writer's `cp` key MUST be byte-equal to the frozen v92 table's key for that
// sentence (`migrations/legacyTemplates.v92.ts`), because a row migrated out of an old save is keyed by the table and a row written today by the
// writer – and the Russian catalog translates ONE key. A writer that spells its sentence differently makes a career's old rows and new rows
// diverge under RU. This file is the net: §1 refuses a `cp` template in the engine whose key is not in the table (or in the two lists below),
// §2 refuses a pair `text` / `c` whose structure differs unannounced, §3 is the ratchet that counts the writers still on `text` alone, §4 plays
// careers and checks the rendered `c` against `text` row by row, §5 drives the composed rows – the ones no static scan can see – through their
// real writers.
//
// ⚠ THE TWO LISTS. NEW_KEYS = sentences a wave wrote AFTER v93 that no old save can hold (none in L3-1: every key this wave emits is the table's).
// FRAGMENTS = keys that are not whole sentences but pieces `joinCopy` assembles into one (§5 proves each assembled sentence IS in the table).
import { describe, expect, it } from 'vitest'
import ts from 'typescript'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { allTemplateKeys } from '../src/engine/migrations/reverseMatch'
import { LEGACY_JOINED_V92 } from '../src/engine/migrations/legacyTemplates.v92'
import { cp, joinCopy, renderCopyRef, splitContext, SOURCE_LOCALE, type CopyRef } from '../src/shared/i18n'
import { LADDER_LABEL } from '../src/shared/protocol'
import { rankingDeltaSuffix, tournamentSummaryRef } from '../src/engine/world/tournamentClose'
import { ACADEMY_NOTICE } from '../src/engine/world/phaseObligations'
import { EXPOSURE_ROW, PUBLIC_LIFE_RECEIPT, RECOVERY_RECEIPT } from '../src/engine/spirit'
import { chargeMandatoryPenalty } from '../src/engine/world/mandatory'
import { bankSponsorCheque } from '../src/engine/world/sponsors'
import { createWorld } from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { COOLHEAD_RECEIPT } from '../src/engine/development'
import { SPARRING_RECEIPT } from '../src/engine/world/sparring'
import { enterEvent, releaseEntry, RELEASE_LINE_PREFIX } from '../src/engine/world/entries'
import { buyAsset, deliverAssets, reportMarketSeason, sellAsset } from '../src/engine/world/shop'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../tools/econ-bench'
// ⭐ L3-4 (10.10): the diary's class-(b) keys, a list of its own (its net proves it is exactly what the class-(b) files spell)
import { DIARY_CLASS_B_KEYS } from './helpers/l3-4-diary-keys'

const ROOT = resolve(__dirname, '..')
const EN = { locale: SOURCE_LOCALE }
const TABLE = new Set(allTemplateKeys())

/** Post-v93 sentences (no old save can hold them), listed so a new one is a decision. L3-1 wrote none.
 *
 *  ⭐ L3-3 (10.10) LISTS FOURTEEN, ALL OF ONE KIND: THE TOUR BRIEFING'S (`briefingRequirements` / `briefingCosts` / `buildTourBriefing` in world/mandatory.ts). The briefing is
 *  CLASS (b) – assembled from `ECONOMY.mandatory` and the calendar at SNAPSHOT time, never stored in an event or an offer – so no old save can hold one of these sentences and the
 *  frozen v92 table, which is a table of STORED rows, has no entry for them. They ride the snapshot as `TourBriefing.leadC` / `costsC` / `closingC` and `TourBriefingRow.askC` /
 *  `detailC` (beside the English, the `LifeMoment.lineC` shape); `tests/i18n-l3-3-news-feeds.test.ts` proves every one renders to its English string under mutated economies. The three
 *  requirement keys are the SAME spellings `composables/letterCopy.ts` gives the season notice's stored phrases (`All {0} {1}` / `All {0} {1}s` / `{0} of the {1} {2}s`), so the popup
 *  and the letter are one translation. */
const NEW_KEYS: readonly string[] = [
  'All {0} {1}',
  'All {0} {1}s',
  '{0} of the {1} {2}s',
  'Required one at a time – each is its own entry, and its own decision.',
  'Her pick of them, counted once when the season closes.',
  "She is ranked {0} in the world. Inside the top {1} the tour's commitment rules apply, and from here on part of her calendar is written by them rather than by us.",
  'A required event she does not enter takes one of her {0} counting results and puts a zero in it. That is the real price, and it is not a fine: it is a result she can no longer replace with a better one.',
  'The tour also books {0} penalty point for not entering, {1} for withdrawing after the list has closed and {2} for not appearing on the day.',
  'The tour also books {0} penalty points for not entering, {1} for withdrawing after the list has closed and {2} for not appearing on the day.',
  '{0} penalty points inside {1} weeks suspends her entries for {2} weeks. Points leave that window on their own as the year moves – nothing is carried forward.',
  'The {0}s are settled once, at the end of the season: {1} penalty point for each one she finished short of {2}.',
  'The {0}s are settled once, at the end of the season: {1} penalty points for each one she finished short of {2}.',
  'Nothing at all is owed for a week she could not play – injured, suspended, too young for the rung, refused by the entry list, or already committed to another tournament that week.',
  'Every line above is a price, and none of it is an instruction. Which of them she pays is still a decision, and it stays yours.',
  // ⭐ L3-4 (10.10): THE DIARY, CLASS (b) AS WELL – the photo / condition pool's function cells, the memory cards, the greeting, the birthday prompt's heading lines and (part 2) the
  // week-note and travel-note function cells. Assembled at SNAPSHOT time from state that already exists, never stored, so the frozen table (a table of STORED rows) has no entry for
  // them. The list lives in tests/helpers/l3-4-diary-keys.ts, generated from the scan and held to it by tests/i18n-l3-4-diary-corpora.test.ts §1.
  ...DIARY_CLASS_B_KEYS,
]

/** Pieces a writer joins with `joinCopy` – never a sentence on their own, never emitted alone. §5 renders every assembled sentence against the table. */
const FRAGMENTS: readonly string[] = [
  ' (+{0} banked – a ranking needs {1} events with points, or {2})', // tournamentClose.ts – the summary's clause when she is not yet ranked
  ' (does not improve best {0})', // … when the result does not enter her best N
  ' (ranking total +{0})', // … when it displaces an older result
  ' – she retired hurt', // … the injury clause
  ", the manager's {0}% of {1}", // sponsors.ts – bankSponsorCheque's commission clause
]

// ---------------------------------------------------------------------------------------------------------------------------------------------
// the scan: the engine's own source, parsed (no type checker – syntax only)
// ---------------------------------------------------------------------------------------------------------------------------------------------
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (p.endsWith('.ts')) out.push(p)
  }
  return out
}
const ENGINE = walk(join(ROOT, 'src/engine'))
  .filter((f) => !f.includes('/migrations/'))
  .map((f) => ({ rel: f.slice(ROOT.length + 1), sf: ts.createSourceFile(f, readFileSync(f, 'utf8'), ts.ScriptTarget.Latest, true) }))

/** whitespace folded, and a non-null assertion (`names[0]!`) dropped – the cp side needs it for the type, the text side prints `undefined` where the assertion would be wrong */
const norm = (s: string): string => s.replace(/\s+/g, ' ').replace(/(?<=[\w\])])!(?!=)/g, '').trim()

/** a hole as the source spells it: a `String(x)` wrapper (how a cp hole of an optional number prints `undefined` exactly like the template does) is the same hole as `x` */
const holeSrc = (e: ts.Expression): string => norm(e.getText()).replace(/^String\((.*)\)$/, '$1')

/** constants the frozen table INLINES (the sweep resolved them to their literal value); a cp key spells the literal, the text spells the name */
const KNOWN_CONSTANTS: Record<string, string> = {
  'LADDER_LABEL.domestic': LADDER_LABEL.domestic,
  'LADDER_LABEL.itf': LADDER_LABEL.itf,
  // ⭐ L3-3 (10.10): the academy notices open with named constants the engine's reader tests with `startsWith`; the sweep inlined them, so the model does too
  'ACADEMY_NOTICE.arrived': ACADEMY_NOTICE.arrived,
  'ACADEMY_NOTICE.reviewed': ACADEMY_NOTICE.reviewed,
  'ACADEMY_NOTICE.ended': ACADEMY_NOTICE.ended,
}

function eachNode(sf: ts.SourceFile, visit: (n: ts.Node) => void): void {
  const go = (n: ts.Node): void => {
    visit(n)
    ts.forEachChild(n, go)
  }
  go(sf)
}

/** `cp\`a ${x} b\`` -> `a {0} b` (the cooked strings, exactly what `cp` joins) */
function cpKey(t: ts.TaggedTemplateExpression): string {
  const tpl = t.template
  if (ts.isNoSubstitutionTemplateLiteral(tpl)) return tpl.text
  let k = tpl.head.text
  tpl.templateSpans.forEach((s, i) => {
    k += `{${i}}${s.literal.text}`
  })
  return k
}

const isCp = (n: ts.Node): n is ts.TaggedTemplateExpression => ts.isTaggedTemplateExpression(n) && n.tag.getText() === 'cp'

// ---- the sentences an expression can produce: every branch of every conditional, every `+` join, every ternary inlined in a hole of the TEXT side
// (the sweep that built the frozen table did exactly this – `${n === 1 ? 'match' : 'matches'}` is two sentences, not one with a hole) ----
interface Alt { path: string[]; parts: Array<string | { h: string }> }
const cross = (a: Alt[], b: Alt[]): Alt[] => a.flatMap((x) => b.map((y) => ({ path: [...x.path, ...y.path], parts: [...x.parts, ...y.parts] })))

/** The sweep's rule was «every branch of a conditional is its own sentence, a runtime value in a branch is a hole». Applied everywhere it would also split `label`
 *  in `Tour penalty: … – ${label}` (a name that is sometimes undefined), which the table does NOT split – so the STRICT reading is the default (a conditional is a
 *  sentence only when every branch is) and the winter kit-letter check, whose `brands` the table does split, reads RELAXED. */
let relaxed = false

/** can this hole be read as SENTENCE (a literal, a template, a conditional of sentences – or, relaxed, of anything – or `+` of those) rather than as a value? */
function inlinable(e: ts.Expression): boolean {
  if (ts.isParenthesizedExpression(e)) return inlinable(e.expression)
  if (ts.isConditionalExpression(e)) return relaxed || (inlinable(e.whenTrue) && inlinable(e.whenFalse))
  if (ts.isBinaryExpression(e) && e.operatorToken.kind === ts.SyntaxKind.PlusToken) return inlinable(e.left) && inlinable(e.right)
  return ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e) || ts.isTemplateExpression(e)
}

/** the initializer of the `const` an identifier names (a local in an enclosing block, or a module-level one), if any – how `payer` in a sentence becomes the sentence it stands for */
function constValue(id: ts.Identifier): ts.Expression | undefined {
  for (let scope: ts.Node | undefined = id.parent; scope; scope = scope.parent) {
    if (!ts.isBlock(scope) && !ts.isSourceFile(scope)) continue
    for (const st of scope.statements) {
      if (!ts.isVariableStatement(st) || !(st.declarationList.flags & ts.NodeFlags.Const)) continue
      for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name) && d.name.text === id.text && d.initializer) return d.initializer
    }
  }
  return undefined
}

/** `inline` = the TEXT side (a hole that is itself a sentence is expanded); the `c` side never inlines (a cp hole is a value, by the law of the key) */
function alts(e: ts.Expression, inline: boolean): Alt[] | null {
  if (ts.isParenthesizedExpression(e)) return alts(e.expression, inline)
  if (ts.isConditionalExpression(e)) {
    const c = norm(e.condition.getText())
    // a branch that is a VALUE (a name, a call) is a hole of its own on the text side – the sweep's rule: «a runtime value is a hole»
    const branch = (b: ts.Expression): Alt[] | null => alts(b, inline) ?? (inline && relaxed ? [{ path: [], parts: [{ h: holeSrc(b) }] }] : null)
    const t = branch(e.whenTrue)
    const f = branch(e.whenFalse)
    if (!t || !f) return null
    return [...t.map((x) => ({ ...x, path: [`+${c}`, ...x.path] })), ...f.map((x) => ({ ...x, path: [`-${c}`, ...x.path] }))]
  }
  if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return [{ path: [], parts: [e.text] }]
  if (ts.isBinaryExpression(e) && e.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const l = alts(e.left, inline)
    const r = alts(e.right, inline)
    return l && r ? cross(l, r) : null
  }
  if (ts.isTemplateExpression(e)) {
    let acc: Alt[] = [{ path: [], parts: [e.head.text] }]
    for (const span of e.templateSpans) {
      const known = inline ? KNOWN_CONSTANTS[norm(span.expression.getText())] : undefined
      if (known !== undefined) {
        acc = cross(cross(acc, [{ path: [], parts: [known] }]), [{ path: [], parts: [span.literal.text] }])
        continue
      }
      const named = inline && ts.isIdentifier(span.expression) ? constValue(span.expression) : undefined
      const sentence = named && inlinable(named) ? named : inline && inlinable(span.expression) ? span.expression : undefined
      const mid = sentence ? alts(sentence, true) : [{ path: [], parts: [{ h: holeSrc(span.expression) }] }]
      if (!mid) return null
      acc = cross(cross(acc, mid), [{ path: [], parts: [span.literal.text] }])
    }
    return acc
  }
  if (isCp(e)) return alts(e.template, false)
  // ⭐ L3-3 (10.10): a bare name on the TEXT side (`notable ? \`${base} …\` : base`) is the sentence its `const` holds – the same resolution a template hole gets above
  if (inline && ts.isIdentifier(e)) {
    const named = constValue(e)
    return named && inlinable(named) ? alts(named, true) : null
  }
  return null
}

/** a sentence that is a bare value (a pool's pick, a named constant) is ONE hole; `{ k: value }` is that same hole on the c side */
function sentenceAlts(e: ts.Expression, inline: boolean): Alt[] | null {
  if (ts.isIdentifier(e) || ts.isPropertyAccessExpression(e)) return [{ path: [], parts: [{ h: norm(e.getText()) }] }]
  if (ts.isObjectLiteralExpression(e) && e.properties.length === 1) {
    const k = e.properties[0]!
    if (ts.isPropertyAssignment(k) && k.name.getText() === 'k') return [{ path: [], parts: [{ h: norm(k.initializer.getText()) }] }]
  }
  return alts(e, inline)
}

function canon(list: Alt[] | null): string[] | null {
  if (list === null) return null
  return list
    .map((a) => {
      let pat = ''
      const holes: string[] = []
      for (const p of a.parts) {
        if (typeof p === 'string') pat += p
        else {
          pat += `{${holes.length}}`
          holes.push(p.h)
        }
      }
      return JSON.stringify([[...a.path].sort(), pat, holes])
    })
    .sort()
}

interface Pair { file: string; anchor: string; text: ts.Expression; c: ts.Expression }
/** every place the engine writes a sentence AND its ref in one expression: an object literal with `text` + `c` (addEvent rows, bankSponsorCheque rows)
 *  and a `fireMilestone(world, key, text, c)` call */
function pairs(): Pair[] {
  const out: Pair[] = []
  for (const { rel, sf } of ENGINE) {
    eachNode(sf, (n) => {
      if (ts.isObjectLiteralExpression(n)) {
        const props = n.properties.filter(ts.isPropertyAssignment)
        const t = props.find((p) => p.name.getText() === 'text')
        const c = props.find((p) => p.name.getText() === 'c')
        if (t && c) out.push({ file: rel, anchor: norm(t.initializer.getText()).slice(0, 48), text: t.initializer, c: c.initializer })
      } else if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'fireMilestone' && n.arguments.length >= 4) {
        out.push({ file: rel, anchor: norm(n.arguments[2]!.getText()).slice(0, 48), text: n.arguments[2]!, c: n.arguments[3]! })
      }
    })
  }
  return out
}

/** an object literal carries `name` as a property, or through a spread whose source spells `name:` (bankSponsorCheque adds `c` only when its caller passed one) */
function carries(o: ts.ObjectLiteralExpression, name: string): boolean {
  // ⭐ L3-3 (10.10): a spread that forwards the field by SHORTHAND (`...(c ? { c } : {})`, how `fireMilestone` hands its optional ref on) carries it as much as `{ c: x }` does
  return o.properties.some(
    (p) =>
      (ts.isPropertyAssignment(p) && p.name.getText() === name) ||
      (ts.isSpreadAssignment(p) && new RegExp(`(?:\\b${name}:|[{,]\\s*${name}\\s*[,}])`).test(p.expression.getText())),
  )
}

/** the engine's sinks: `addEvent(world, { … })` and `fireMilestone(world, key, text, c?)` calls. `bare` = the ones that still write `text` alone, per file; `converted` = the ones that
 *  write `c` beside it. (The definitions are declarations, not calls; the engine writes no event any other way – the L3-0 sweep found 141 and this counts the same 141.) */
function sinks(): { bare: Record<string, number>; converted: number } {
  const bare: Record<string, number> = {}
  let converted = 0
  for (const { rel, sf } of ENGINE) {
    eachNode(sf, (n) => {
      if (!ts.isCallExpression(n) || !ts.isIdentifier(n.expression)) return
      const name = n.expression.text
      let isSink = false
      let hasC = false
      if (name === 'addEvent') {
        const o = n.arguments[1]
        isSink = !!o && ts.isObjectLiteralExpression(o)
        hasC = isSink && carries(o as ts.ObjectLiteralExpression, 'c')
      } else if (name === 'fireMilestone') {
        isSink = true
        hasC = n.arguments.length >= 4
      }
      if (!isSink) return
      if (hasC) converted++
      else bare[rel] = (bare[rel] ?? 0) + 1
    })
  }
  return { bare, converted }
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §1 – the key law, statically: every cp template the engine can emit
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§1 the re-key law – every `cp` key in the engine is the frozen table\'s (or listed)', () => {
  const found = new Map<string, string[]>()
  for (const { rel, sf } of ENGINE) {
    eachNode(sf, (n) => {
      if (isCp(n)) {
        const k = cpKey(n)
        found.set(k, [...(found.get(k) ?? []), rel])
      }
    })
  }

  it('finds the wave\'s call sites (the scan is not blind)', () => {
    expect(found.size, 'distinct cp keys in src/engine').toBeGreaterThan(100)
  })

  it('every cp key is in the v92 table, or in NEW_KEYS / FRAGMENTS', () => {
    const foreign = [...found.keys()].filter((k) => !TABLE.has(k) && !NEW_KEYS.includes(k) && !FRAGMENTS.includes(k))
    expect(foreign, 'a writer\'s key that no old save can hold and no list names – re-key it to the table\'s spelling, or list it in NEW_KEYS with the reason').toEqual([])
  })

  it('⭐ L3-3: every NEW_KEYS entry has a call site, and is not secretly a sentence of the table (a listed key that the table holds belongs nowhere near this list)', () => {
    for (const k of NEW_KEYS) {
      expect(found.has(k), `NEW_KEYS entry ${JSON.stringify(k)} has no cp call site – delete it from the list`).toBe(true)
      expect(TABLE.has(k), `NEW_KEYS entry ${JSON.stringify(k)} IS in the table – the writer may use it as it is`).toBe(false)
    }
  })

  it('every FRAGMENT is used, and is not secretly a whole sentence of the table', () => {
    for (const f of FRAGMENTS) {
      expect(found.has(f), `fragment ${JSON.stringify(f)} has no call site – delete it from the list`).toBe(true)
      expect(TABLE.has(f), `fragment ${JSON.stringify(f)} is in the table – it belongs nowhere near this list`).toBe(false)
    }
  })

  it('a cp key renders to itself under English once its holes are filled (no brace, backslash or hash escaped wrongly)', () => {
    for (const k of found.keys()) {
      const holes = (k.match(/\{\d+\}/g) ?? []).length
      const ref: CopyRef = holes > 0 ? { k, p: Array.from({ length: holes }, (_, i) => `⟦${i}⟧`) } : { k }
      const shown = renderCopyRef(ref, EN)
      // ⭐ L3-4: a context tag (`greeting|Good night` – the same English, two Russian phrases) is the key's handle and never part of the English it renders
      expect(shown, k).toBe(splitContext(k).text.replace(/\{(\d+)\}/g, (_m, n: string) => `⟦${n}⟧`))
    }
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §1b – the dynamic seats: `c: { k: x }`, where x is a whole sentence the program picked (a pool's line, a named constant)
// ---------------------------------------------------------------------------------------------------------------------------------------------
/** A `cp` template cannot spell a sentence the program PICKS at run time, so the ref is `{ k: pick }` – legitimate exactly when every sentence the pick can be is a key of
 *  the frozen table (the sweep that built it holds each pool line as its own entry). That is a claim about DATA, not about a call site, so the static key law above cannot
 *  see it: this section is the law for the seats it cannot see. A NEW seat (a `{ k: x }` object anywhere in the engine) is a decision – list it with the sentences it can hold. */
const DYNAMIC_SEATS: Record<string, number> = {
  'src/engine/world/form.ts': 2, // the coach's eye (coachFormNote's two lines) and the sparring receipt
  'src/engine/world/phaseFinance.ts': 2, // the weekly training / rest flavour line, and the apparel flavour line when no brand paid
  'src/engine/world/phaseGrowth.ts': 1, // the composure receipt
  'src/engine/spirit.ts': 3, // ⭐ L3-3: the public-life receipt, the exposure row and the recovery receipt – each a NAMED CONSTANT, its own key
  // ⭐ L3-4 (10.10) – the DIARY'S seats: class (b), the string a corpus cell holds IS its key. Their can-hold proof is tests/i18n-l3-4-diary-corpora.test.ts §2 (it imports the
  // corpora and walks every cell), not the frozen table's – no old save holds a diary line.
  'src/engine/diary/pool.ts': 1, // diaryLinePair – a static photo / condition cell
  'src/engine/diary.ts': 1, // debutLine – the four opening-week memory lines
  'src/engine/world/birthday.ts': 4, // the gift row's label and note, the ask, and the label nested in the gift event row
}

function literalsIn(node: ts.Node, out: string[] = []): string[] {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) out.push(node.text)
  // (a callback that returns something truthy STOPS `forEachChild` – the block, not an expression, is what keeps the walk going)
  ts.forEachChild(node, (child) => {
    literalsIn(child, out)
  })
  return out
}

describe('§1b the dynamic seats', () => {
  const seats: Record<string, number> = {}
  for (const { rel, sf } of ENGINE) {
    eachNode(sf, (n) => {
      if (ts.isObjectLiteralExpression(n) && n.properties.length === 1) {
        const only = n.properties[0]!
        if (ts.isPropertyAssignment(only) && only.name.getText() === 'k') seats[rel] = (seats[rel] ?? 0) + 1
      }
    })
  }

  it('are exactly the known ones (a new `{ k: x }` in the engine is a decision)', () => {
    expect(seats).toEqual(DYNAMIC_SEATS)
  })

  it('every sentence a seat can hold is a key of the frozen table', () => {
    const file = (rel: string): ts.SourceFile => ENGINE.find((f) => f.rel === rel)!.sf
    const sentences: string[] = []
    // phaseFinance.ts: the training / rest pools and the two swaps built from them (module-private, so read from the source)
    const pools = new Set(['TRAIN_EVENTS', 'REST_EVENTS', 'WEALTHY_REST_EVENTS', 'WORKING_TRAIN_EVENTS', 'AFTER_SCHOOL'])
    eachNode(file('src/engine/world/phaseFinance.ts'), (n) => {
      if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && pools.has(n.name.text) && n.initializer) sentences.push(...literalsIn(n.initializer))
    })
    expect(sentences.length, 'the pools were found').toBeGreaterThan(8)
    // the gear flavour lines, per category and per family voice
    for (const category of Object.values(ECONOMY.gear)) sentences.push(...Object.values(category.flavor))
    // form.ts: what coachFormNote returns
    eachNode(file('src/engine/world/form.ts'), (fn) => {
      if (!ts.isFunctionDeclaration(fn) || fn.name?.text !== 'coachFormNote') return
      const walkIn = (n: ts.Node): void => {
        if (ts.isReturnStatement(n) && n.expression && ts.isStringLiteral(n.expression)) sentences.push(n.expression.text)
        ts.forEachChild(n, walkIn)
      }
      walkIn(fn)
    })
    sentences.push(SPARRING_RECEIPT, COOLHEAD_RECEIPT)
    // spirit.ts (L3-3): the three constants the feed rows are written from
    sentences.push(EXPOSURE_ROW, PUBLIC_LIFE_RECEIPT, RECOVERY_RECEIPT)
    const missing = [...new Set(sentences)].filter((x) => !TABLE.has(x) && !NEW_KEYS.includes(x))
    expect(missing, 'a sentence a dynamic seat can hold that no old save can hold – a reworded pool line is a NEW sentence: list it in NEW_KEYS with the reason').toEqual([])
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §2 – a pair `text` / `c` has ONE structure, or its difference is announced
// ---------------------------------------------------------------------------------------------------------------------------------------------
/** Sites where `c` is not the same set of sentences as `text` by SYNTAX – the reason, and the check that stands in. Keyed `file::the first 48 characters of the text expression`. */
const NOT_ISOMORPHIC: Record<string, string> = {
  'src/engine/world/entries.ts::line': 'the release line is a `let` assigned in an exhaustive switch (three reasons) – §5 releases an entry for each reason and renders the new rows.',
  'src/engine/world/phaseFinance.ts::facility.text':
    '`facilityFlavor` now returns the sentence and its ref from ONE call (the pick is made once) – §4 plays careers, where the facility row is written every week, and renders it.',
  'src/engine/world/phaseFinance.ts::(() => { // ⚠ THE PAYER IS NAMED ON THE LINE, WH':
    'two immediately-invoked functions that pick the same pool line and payer – §4 plays careers (the apparel rows appear in them) and renders every row.',
  'src/engine/world/shop.ts::`Sold ${formatCents(proceedsCents)} of: ${label}':
    "`saleTail(delta)` is a helper call with three branches; c spells the three sentences out – §5 sells a part-lot at a loss, at par and at a gain and renders the rows.",
  'src/engine/world/shop.ts::`Sold: ${label} – ${saleTail(priceCents - costSo':
    "`saleTail(delta)` again, for a whole-lot sale – §5 sells whole lots at a loss, at par and at a gain.",
  "src/engine/world/sponsors.ts::parts.join(' ')":
    "the winter kit-letter row is a `join` of whichever parts fired; c is `joinCopy` over the same parts – §5 joins every selection of the table's family and compares the keys.",
  'src/engine/world/tournamentClose.ts::`${tier.label} (${event.surface}, ${weekLabel(ev':
    '`+` concatenation, a helper-built ranking clause and an injury clause; c is `tournamentSummaryRef` – §5 renders all ten combinations against `rankingDeltaSuffix`.',
  // ⭐ L3-3 (10.10) – four pairs whose TEXT is built by a helper call or a `plural()` the syntax cannot expand; each has the check that stands in, in tests/i18n-l3-3-news-feeds.test.ts
  'src/engine/world/mandatory.ts::`The tour also books ${m.skipPoints} penalty ${p':
    'the text counts its noun with the `plural(n, one, many)` helper, c spells the two forms as two whole sentences (the house rule) – l3-3 §6 renders the briefing under singular and plural economies and compares every string.',
  'src/engine/world/mandatory.ts::`The ${quotaLabel}s are settled once, at the end':
    'the same `plural()` helper, the quota shortfall\'s noun – l3-3 §6 (singular and plural economies).',
  'src/engine/world/milestones.ts::`Season ${displayYear} wrap-up: ${rankText} · ` ':
    'the text is a `+` of two templates over helper-built pieces (`rankText`, `bestText`); c is `seasonWrapRef`, twelve WHOLE sentences – l3-3 §3 drives all twelve ingredient combinations through it and through the real writer, and compares with the text.',
  // ⭐ L3-4 (10.10) – the gift event row: the text's hole is the gift's label (a string), c's hole is the label as a NESTED ref `{ k: given.label }` so a Russian row names the gift in
  // Russian; both render the same English. tests/i18n-l3-4-diary-corpora.test.ts §5 renders the row for every gift in the catalogue and compares.
  'src/engine/world/birthday.ts::given.id === DAY_TOGETHER.id ? \'Her birthday. No':
    'the label hole is a nested ref `{ k: given.label }` on the c side (the catalogue string is a key of its own) – l3-4 §5 chooses every gift of every band and compares the row with its text, and checks the key is the table\'s.',
  'src/engine/world/phaseAiWeek.ts::`🏆 ${playerShortName(world, championId)} won th':
    'the text appends `championNote(...)`, a helper that returns one of four clauses; c is `championRef` over the SAME `championClause` facts – l3-3 §4 renders all four against the text, and the twin plays them.',
}

/** Pairs where `c` is a PROPER SUBSET of what `text` can say: the text's syntax admits combinations the program cannot reach (the frozen table, built by the same
 *  syntactic sweep, holds them all; the writer need not emit them). Keyed like NOT_ISOMORPHIC. */
const SUBSET_OF_TEXT: Record<string, string> = {
  'src/engine/world/shop.ts::crashed ? `${MARKET_SEASON_OPENING} – a crash ye':
    'the season line reads `crashed` and the move\'s sign separately; a crash year is always a fall, so c spells the four reachable sentences (level, up, fall, crash-year fall) and omits the two unreachable crash-year ones – §5 runs thirty seasons.',
}

describe('§2 text / c pairs', () => {
  const all = pairs()
  const keyOf = (p: Pair): string => `${p.file}::${p.anchor}`

  it('finds the wave\'s pairs (the scan is not blind)', () => {
    // 84 = the 78 converted sinks, minus the cheque sink (its `c` rides a spread, not a property), plus `facilityFlavor`'s own pair, plus the 6 rows handed to `bankSponsorCheque`
    // + 27 (L3-3): fieldNews 3, the champion lines 2 (tournamentClose, phaseAiWeek), milestones 4, the academy 5, the shoot notes 2, the first kept row, the calendar row, the birthday row,
    //   the spirit feed 3, the briefing's five cost lines 5 – the rows that carry `c` by a SPREAD (the campus digest, the kid-match and retirement rows) are not pairs, they are §4/§5 here
    //   and l3-3 §2's.
    // + 20 (L3-4): the eighteen birthday heading lines, the gift event row, and `diaryLinePair`'s static pick (`{ text: pick.text, c: { k: pick.text } }`)
    expect(all.length, 'pairs of text + c in src/engine').toBe(131)
  })

  it('every pair expands to the SAME sentences – each branch, each inlined ternary, the same holes in the same order – or is announced', () => {
    const unannounced: string[] = []
    const differ = new Set<string>()
    const subset = new Set<string>()
    for (const p of all) {
      const a = canon(sentenceAlts(p.text, true))
      const b = canon(sentenceAlts(p.c, false))
      const same = a !== null && b !== null && JSON.stringify(a) === JSON.stringify(b)
      if (same) continue
      const k = keyOf(p)
      const proj = (list: string[]): string[] => list.map((x) => JSON.stringify((JSON.parse(x) as unknown[]).slice(1)))
      if (a !== null && b !== null && proj(b).every((x) => proj(a).includes(x))) {
        subset.add(k)
        if (SUBSET_OF_TEXT[k] === undefined) unannounced.push(`${k} (c is a subset of text, unannounced)`)
        continue
      }
      differ.add(k)
      if (NOT_ISOMORPHIC[k] === undefined) unannounced.push(`${k}\n      text ${JSON.stringify(a)}\n      c    ${JSON.stringify(b)}`)
    }
    expect(unannounced.join('\n'), 'a pair whose sentences differ and is not in NOT_ISOMORPHIC').toBe('')
    expect([...differ].sort(), 'NOT_ISOMORPHIC lists exactly the pairs that differ (a stale entry is a pair that now matches)').toEqual(Object.keys(NOT_ISOMORPHIC).sort())
    expect([...subset].sort(), 'SUBSET_OF_TEXT lists exactly the pairs whose c is a proper subset').toEqual(Object.keys(SUBSET_OF_TEXT).sort())
  })

  it('the winter kit-letter row: every `parts.push(sentence)` has its `refs.push(cp\`sentence\`)` twin, in the same order, saying the same thing', () => {
    // the row is `parts.join(' ')` beside `joinCopy(' ', refs)` – two arrays pushed in pairs (sponsors.ts, reviewSponsors); §5 proves the join, this proves the parts
    const file = ENGINE.find((f) => f.rel === 'src/engine/world/sponsors.ts')!
    const texts: ts.Expression[] = []
    const refs: ts.Expression[] = []
    eachNode(file.sf, (n) => {
      if (!ts.isCallExpression(n) || !ts.isPropertyAccessExpression(n.expression) || n.expression.name.text !== 'push' || n.arguments.length !== 1) return
      const target = n.expression.expression.getText()
      if (target === 'parts') texts.push(n.arguments[0]!)
      else if (target === 'refs') refs.push(n.arguments[0]!)
    })
    expect(texts.length, 'the row has parts').toBeGreaterThanOrEqual(5)
    expect(refs.length, 'one ref per part').toBe(texts.length)
    relaxed = true
    try {
      texts.forEach((t, i) => {
        const a = canon(sentenceAlts(t, true))
        const b = canon(sentenceAlts(refs[i]!, false))
        expect(a, `part ${i}`).not.toBeNull()
        expect(b, `ref ${i}`).not.toBeNull()
        const proj = (list: string[]): string[] => list.map((x) => JSON.stringify((JSON.parse(x) as unknown[]).slice(1)))
        // the text's syntax admits combinations the program cannot reach (one letter, three brands); the ref must say every one it CAN reach, and nothing else
        expect(proj(b!).every((x) => proj(a!).includes(x)), `ref ${i} says a sentence part ${i} cannot`).toBe(true)
        // and the reachable ones are ALL there: (ended: events / standing / term), (signed), (one letter or several × National or International), (bond), (renewal)
        expect(new Set(proj(b!)).size, `ref ${i}`).toBe([3, 1, 4, 1, 1][i])
      })
    } finally {
      relaxed = false
    }
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §3 – the ratchet: writers still on `text` alone (a later wave lowers a number; a NEW text-only writer raises one and must be decided)
// ---------------------------------------------------------------------------------------------------------------------------------------------
/** file -> sinks that write `text` and no `c`, with the wave that owns them. Counted by the scan above (addEvent object literals, fireMilestone calls). */
const TEXT_ONLY: Record<string, number> = {
  // ⭐ L3-3 (10.10) CONVERTED 26 OF THE 63: spirit 3, age 1, bookkeeping 1, create 1, fieldNews 4, milestones 5 (the four callers, and `fireMilestone`'s own inner sink – it forwards `c`
  // by shorthand, which `carries` reads since this wave), phaseAiWeek 1, phaseObligations 5, shootClash 2, tournamentClose 3. What is left below is L3-4..7's and nobody else's.
  // ⭐ L3-4 (10.10) CONVERTED 1 MORE: birthday.ts, the gift row (it was the only sink the brief gave this wave). 36 are left.
  'src/engine/world/college.ts': 4, // L3-7 (RU-12F, the college engine feed) – the tuition row (money) is L3-1's and converted
  'src/engine/world/endings.ts': 8, // L3-6
  'src/engine/world/injury.ts': 3, // L3-7 (RU-11J, the medical feed) – the two money rows (physio, medical) are L3-1's and converted
  'src/engine/world/knock.ts': 4, // L3-7
  'src/engine/world/lifeBeat.ts': 3, // L3-5
  'src/engine/world/lifeBeat/ended.ts': 3, // L3-5
  'src/engine/world/lifeBeat/leak.ts': 1, // L3-5
  'src/engine/world/lifeBeat/ownKey.ts': 1, // L3-5
  'src/engine/world/lifeBeat/pregnancy.ts': 2, // L3-5
  'src/engine/world/lifeBeat/weight.ts': 1, // L3-5
  'src/engine/world/lifeBeat/wedding.ts': 1, // L3-5
  'src/engine/world/phaseHerWeek.ts': 3, // L3-7 (RU-11J)
  'src/engine/world/tick.ts': 2, // L3-7 (the college epilogue, twice)
}

describe('§3 the writers still on `text` alone', () => {
  it('are exactly the ones the later waves own', () => {
    expect(sinks().bare, 'a count moved: a wave converted a sink (lower the number) or a NEW text-only writer appeared (decide it: convert it, or list it with the wave that owns it)').toEqual(TEXT_ONLY)
  })

  it('the books close: 141 sinks (the L3-0 sweep\'s count), 105 of them converted (L3-1: 78, L3-3: 26, L3-4: 1), 36 left to L3-5..7', () => {
    const { bare, converted } = sinks()
    const left = Object.values(bare).reduce((a, b) => a + b, 0)
    expect(left, 'sinks still on `text` alone').toBe(36)
    expect(converted, 'sinks that write `c`').toBe(105)
    expect(converted + left, 'every sink there is').toBe(141)
  })

  it('no money row is left on `text` alone: every sink that writes `amountCents` writes `c`', () => {
    const bare: string[] = []
    for (const { rel, sf } of ENGINE) {
      eachNode(sf, (n) => {
        if (!ts.isCallExpression(n) || !ts.isIdentifier(n.expression) || n.expression.text !== 'addEvent') return
        const o = n.arguments[1]
        if (!o || !ts.isObjectLiteralExpression(o)) return
        if (carries(o, 'amountCents') && !carries(o, 'c')) bare.push(`${rel}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}`)
      })
    }
    expect(bare, 'a ledger row (amountCents) that writes only `text`').toEqual([])
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §4 – played careers: the c / text identity and the key law, row by row
// ---------------------------------------------------------------------------------------------------------------------------------------------
interface Row { text: string; c?: CopyRef; amountCents?: number }
describe('§4 a played career', () => {
  for (const [label, preset, policy] of [['25k middle · middle coach · grinder', 5, 0], ['8k self-coached · player', 0, 1]] as const) {
    it(`${label}: every row that carries c renders to its text, every key is the table's, every money row carries c`, () => {
      const { world, rng } = openCareer(PRESETS[preset]!, 0, POLICIES[policy]!)
      for (let w = 0; w < 150; w++) stepCareerWeek(world, rng, POLICIES[policy]!)
      const rows = world.events as unknown as Row[]
      expect(rows.length).toBeGreaterThan(100)
      let withC = 0
      const bad: string[] = []
      const foreign = new Set<string>()
      for (const e of rows) {
        if (e.amountCents !== undefined && e.amountCents !== 0 && !e.c) bad.push(`money row without c: ${e.text}`)
        if (!e.c) continue
        withC++
        if (renderCopyRef(e.c, EN) !== e.text) bad.push(`render ${JSON.stringify(renderCopyRef(e.c, EN))} !== text ${JSON.stringify(e.text)}`)
        if (!TABLE.has(e.c.k)) foreign.add(e.c.k)
        // JSON-safe by construction: nothing a save would lose
        expect(JSON.parse(JSON.stringify(e.c)), e.text).toEqual(e.c)
      }
      expect(bad).toEqual([])
      expect([...foreign], 'emitted keys outside the frozen table').toEqual([])
      expect(withC / rows.length, 'a floor, not a figure: the money rows and the feed rows of a career are most of its ledger').toBeGreaterThan(0.3)
    })
  }
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §5 – the composed rows, through their real code
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§5 the tournament summary row – tournamentSummaryRef against rankingDeltaSuffix, every combination', () => {
  const base = { tier: 'World Tour 35', surface: 'grass', week: "W26 '35", kid: 'Alice', finish: 'Semifinalist' }
  const cases: Array<[string, number, number, boolean]> = [
    ['no points – no clause', 0, 0, false],
    ['not ranked yet', 30, 30, true],
    ['does not improve the best N', 10, 0, false],
    ['displaces an older result', 48, 33, false],
    ['the whole of it counts – no clause', 48, 48, false],
  ]
  for (const [label, points, delta, notRanked] of cases) {
    for (const retired of [false, true]) {
      it(`${label}${retired ? ' – and she retired hurt' : ''}`, () => {
        const ref = tournamentSummaryRef({ ...base, points, delta, bestN: 6, notRanked, retired })
        const text =
          `${base.tier} (${base.surface}, ${base.week}): ${base.kid} – ${base.finish} (+${points} pts)` +
          `${rankingDeltaSuffix(points, delta, 6, notRanked)}${retired ? ' – she retired hurt' : ''}`
        expect(renderCopyRef(ref, EN)).toBe(text)
        expect(TABLE.has(ref.k), ref.k).toBe(true)
      })
    }
  }
})

describe('§5 the tour penalty row – the four whole sentences', () => {
  for (const [points, withEvent] of [[1, true], [1, false], [2, true], [2, false]] as const) {
    it(`${points} point${points === 1 ? '' : 's'}, ${withEvent ? 'a named event' : 'a season commitment'}`, () => {
      const world = createWorld('l31-penalty')
      const before = world.events.length
      chargeMandatoryPenalty(world, 40, points, withEvent ? 'skip' : 'quota', withEvent ? { id: 'ev-1', tier: 'national' } : undefined)
      const rows = (world.events as unknown as Row[]).slice(before).filter((e) => e.text.startsWith('Tour penalty'))
      expect(rows).toHaveLength(1)
      const e = rows[0]!
      expect(e.c, 'the penalty row carries its ref').toBeDefined()
      expect(renderCopyRef(e.c!, EN)).toBe(e.text)
      expect(TABLE.has(e.c!.k), e.c!.k).toBe(true)
    })
  }
})

describe('§5 joinCopy – the assembled sentences are the table\'s spellings', () => {
  it('every ordered selection of the winter kit-letter family joins to a key the table holds (all 287)', () => {
    const family = LEGACY_JOINED_V92[0]!
    const holesOf = (k: string): number => (k.match(/\{\d+\}/g) ?? []).length
    let count = 0
    const walk = (from: number, picked: string[]): void => {
      if (picked.length > 0) {
        count++
        const ref = joinCopy(family.sep, picked.map((k) => ({ k, p: Array.from({ length: holesOf(k) }, (_, i) => `⟦${i}⟧`) })))
        expect(TABLE.has(ref.k), ref.k).toBe(true)
        expect(ref.p?.length ?? 0, ref.k).toBe(holesOf(ref.k))
        // and it RENDERS: a joined key the formatter cannot read would show the player a raw template (the `#{n}` of «National #{1}» is the seam worth watching)
        expect(renderCopyRef({ k: ref.k, p: Array.from({ length: holesOf(ref.k) }, (_, i) => `<${i}>`) }, EN), ref.k).toBe(ref.k.replace(/\{(\d+)\}/g, '<$1>'))
      }
      for (let part = from; part < family.parts.length; part++) {
        for (const alt of family.parts[part]!) {
          const k = typeof alt === 'string' ? alt : alt[0]
          walk(part + 1, [...picked, k])
        }
      }
    }
    walk(0, [])
    expect(count, 'the family\'s closed set').toBe(287)
  })

  it('renumbers holes past the earlier parts, and is the identity for one part', () => {
    expect(joinCopy('', [{ k: 'a {0}', p: ['x'] }])).toEqual({ k: 'a {0}', p: ['x'] })
    expect(joinCopy(' ', [{ k: 'a {0} {1}', p: ['x', 'y'] }, { k: 'b {0}', p: ['z'] }, { k: 'c' }])).toEqual({ k: 'a {0} {1} b {2} c', p: ['x', 'y', 'z'] })
    expect(joinCopy('', [])).toEqual({ k: '' })
  })
})

describe('§5 bankSponsorCheque – the manager\'s clause joined onto each caller\'s sentence', () => {
  const callers: Array<[string, CopyRef]> = [
    ['Appearance fee', cp`Appearance fee – ${'World Tour 35'}`],
    ['Sponsor bonus', cp`Sponsor bonus – ${'Champion'} at the ${'World Tour 35'}`],
    ['signing fee', cp`${'Aurelia'} endorsement – the campaign fee, on signing`],
    ['retainer', cp`${'Aurelia'} retainer – quarterly`],
    ['anniversary, for life', cp`${'Aurelia'} endorsement – year ${3}, for life`],
    ['anniversary, fixed term', cp`${'Aurelia'} endorsement – year ${3} of ${5}`],
  ]
  for (const [label, row] of callers) {
    it(`${label}: text and c agree with the manager's cut on, and both keys are the table's`, () => {
      const world = createWorld('l31-cheque')
      const text = renderCopyRef(row, EN)
      const before = world.events.length
      bankSponsorCheque(world, 12_000_00, { category: 'income', text, c: row })
      const e = (world.events as unknown as Row[]).slice(before).find((r) => r.amountCents !== undefined)!
      expect(e.text.startsWith(text)).toBe(true)
      expect(e.text).toContain("the manager's")
      expect(renderCopyRef(e.c!, EN)).toBe(e.text)
      expect(TABLE.has(e.c!.k), e.c!.k).toBe(true)
      expect(TABLE.has(row.k), row.k).toBe(true)
    })
  }

  it('a caller that passes no ref (a test double, an older door) writes no c – the row is a text-only row, exactly as before', () => {
    const world = createWorld('l31-cheque-bare')
    const before = world.events.length
    bankSponsorCheque(world, 5_000_00, { category: 'income', text: 'a fee' })
    const e = (world.events as unknown as Row[]).slice(before).find((r) => r.amountCents !== undefined)!
    expect('c' in e).toBe(false)
  })
})

/** the rows a writer added, each checked: carries c, renders to its text under English, key in the table */
function checkNewRows(world: { events: unknown }, before: number): Row[] {
  const rows = (world.events as Row[]).slice(before)
  for (const e of rows) {
    expect(e.c, `a row without c: ${e.text}`).toBeDefined()
    expect(renderCopyRef(e.c!, EN), e.text).toBe(e.text)
    expect(TABLE.has(e.c!.k), e.c!.k).toBe(true)
  }
  return rows
}

describe('§5 entry releases – the three reasons, each sentence and its ref', () => {
  for (const reason of ['parent', 'injury', 'college'] as const) {
    it(reason, () => {
      const world = createWorld(`l31-release-${reason}`)
      let entered: string | undefined
      for (const e of world.season) {
        if (e.week <= world.week) continue
        try {
          enterEvent(world, e.id)
          entered = e.id
          break
        } catch {
          /* gated on points / funds / availability – the next one */
        }
      }
      expect(entered, 'an event she could enter').toBeDefined()
      const before = world.events.length
      releaseEntry(world, entered!, reason)
      const rows = checkNewRows(world, before)
      expect(rows.some((r) => r.text.startsWith(RELEASE_LINE_PREFIX[reason])), 'the feed line of this reason').toBe(true)
      expect(rows.some((r) => r.text.startsWith('Entry refunded: ')), 'and the refund').toBe(true)
    })
  }
})

describe('§5 the shop – purchases, the order and its delivery, the three sale tails, the market season', () => {
  const rich = (seed: string) => {
    const world = createWorld(seed)
    world.fundsCents = 900_000_000_00
    return world
  }

  it('buy, add to, and order: Bought / Added to / Ordered / on order / Delivered', () => {
    const world = rich('l31-shop-buy')
    const before = world.events.length
    buyAsset(world, 'index-fund', 20_000_00)
    buyAsset(world, 'index-fund', 10_000_00)
    buyAsset(world, 'boat-launch')
    world.week += 60
    deliverAssets(world)
    const rows = checkNewRows(world, before)
    const texts = rows.map((r) => r.text)
    for (const lead of ['Bought: ', 'Added to: ', 'Ordered: ', 'Delivered: ']) expect(texts.some((t) => t.startsWith(lead)), lead).toBe(true)
    expect(texts.some((t) => t.includes(' is on order – due ')), 'on order').toBe(true)
  })

  for (const [label, value] of [['at a loss', 0.5], ['at par', 1], ['at a gain', 2]] as const) {
    it(`a part-lot and a whole lot, sold ${label}`, () => {
      const world = rich(`l31-shop-sell-${label}`)
      buyAsset(world, 'index-fund', 40_000_00)
      const owned = () => world.assets!.find((a) => a.id === 'index-fund')!
      owned().valueCents = Math.round(owned().paidCents * value)
      const before = world.events.length
      sellAsset(world, 'index-fund', Math.round(owned().valueCents / 4))
      sellAsset(world, 'index-fund')
      const rows = checkNewRows(world, before)
      const sold = rows.filter((r) => r.text.startsWith('Sold'))
      expect(sold, 'a part-lot row and a whole-lot row').toHaveLength(2)
      const tail = value < 1 ? 'less than it cost' : value > 1 ? 'more than it cost' : 'exactly what it cost'
      for (const r of sold) expect(r.text.endsWith(tail), `${r.text} should end "${tail}"`).toBe(true)
    })
  }

  it('thirty seasons of the market, six careers: every report that is written carries its ref', () => {
    let reports = 0
    for (let n = 0; n < 6; n++) {
      const world = rich(`l31-market-${n}`)
      buyAsset(world, 'index-fund', 50_000_00)
      deliverAssets(world)
      for (let year = 1; year <= 30; year++) {
        world.week = year * 52
        const before = world.events.length
        reportMarketSeason(world)
        reports += checkNewRows(world, before).length
      }
    }
    expect(reports, 'the season line was written').toBeGreaterThan(50)
  })
})
