// ⭐⭐ T5.14 – THE FAMILIES THIS WAVE MERGED MAY NOT BE RE-SPELLED LOCALLY.
//
// The owner, 26.09: «копипаста растёт – это тоже чиним?». W5 merged six families – the component
// storage shim into `tests/component/setup.ts`, `clashWorld` / `atCollege` / `married` /
// `walkWeeks` / `weekAtAge` into `tests/helpers/`, and the benches' `argOf` into `tools/_args.ts`.
// A merge with no ratchet behind it is a rate that comes back: 05.09 merged five families and the
// 26.09 review found all five pasted again (F-09), which is the measurement this file exists for.
//
// ⚠⚠ WHAT THIS GUARD IS KEYED ON, AND WHY IT IS NOT THE NAME. A guard that simply forbade the names
// would redden honest code, measured here on 27.09:
//
//   · `weekAtAge` has SIX local definitions left in `tests/` and a seventh in `tools/`, and they ask
//     different questions – `kidAgeAt(world, w) === age` versus `kidAgeExact(…) >= years`, a bounded
//     `for` versus an unbounded `while`, one that throws and one that cannot, and
//     `round41-ad-junior.test.ts:111`'s `(seed, wanted, searchFrom)`, which is a different function
//     under the same name. Each difference is recorded at its site.
//   · `married` has five, of which `wave9-repeat-pregnancy.test.ts:34` carries FEWER KEYS than the
//     shared one on purpose.
//   · `atCollege` and `married` are also ordinary local names: `const atCollege = band ===
//     BIRTHDAY_COLLEGE_BAND` appears nine times in two files and is a BOOLEAN, not a fixture builder.
//     Nine false positives from one regex.
//
// So the two rules below are keyed on what actually must not come back:
//
//   RULE A  – an UNAMBIGUOUS home. A `localStorage` shim, or a numeric arm reader in a LIVE tool
//             outside `tools/_args.ts`, has no honest local form at all.
//   RULE A′ – ...AND THE ARM READER IS MATCHED BY ITS BODY, NOT ITS NAME, because on 27.09 four live
//             copies called `flag` / `numOf` and one called `usd` turned out to be invisible to
//             F-04's own census, which greps for the name at column 0. A census keyed on a helper's
//             name is a FLOOR on the copies and never the count.
//   RULE B  – a SECOND COPY of one body. Two callable definitions of a merged family name may not
//             share a normalised body. A survivor that differs for a stated reason passes by
//             construction; a paste does not.
//
// ⚠ TWO OF THE THREE ARE SHRINK-ONLY RATCHETS RATHER THAN FLAT BANS, and that is a measurement and
// not a softening: 68 files still spell the shim (only four import the helper T5.10 added), and three
// groups are already byte-identical under RULE B. Both lists are below WITH their files and their
// reason, and both assertions are subset checks – merging one is green, adding one is red. That is
// `pins:check`'s shape, and a guard that would be red on arrival is a guard that never ships.
//
// ⚠⚠ AND WHAT IT IS BLIND TO, SAID PLAINLY RATHER THAN IMPLIED. This guard reads DEFINITIONS. It
// cannot see the failure the helpers builder hit and fixed on 27.09: a `pushEvent` that spread a
// partial over defaults, was behaviour-identical, kept every test green, and moved ALL 32 world
// hashes because it changed an event's KEY ORDER. `toEqual` is blind to key order and so is this
// file; row 37 of `docs/backlog/the-quality-rig.md` is that class, and `tests/helpers/hash.ts`'s
// world hash is what sees it. A copy that calls the shared helper and then re-serialises its result
// passes every assertion here. Two other holes, for the same reason: a paste with one identifier
// renamed is not byte-identical after normalisation, and a paste INTO a file this walk does not
// reach (`e2e/`, `scripts/`) is not seen at all.
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { after, region } from './helpers/source'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const SELF = 'principles-t514-merged-families.test.ts'

// =================================================================================================
// THE CORPUS
// =================================================================================================

/** ⚠ THIS FILE IS EXCLUDED, one file wide, and for `tests/pin-hygiene.test.ts`'s own reason: the
 *  mutation arms below spell out offending code as fixture STRINGS, and the walk reads raw text. */
function corpusFiles(dir: string): string[] {
  return readdirSync(`${ROOT}${dir}`, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.ts') && !f.endsWith(SELF))
    .map((f) => `${dir}/${f}`)
}

function corpus(): { file: string; text: string }[] {
  return [...corpusFiles('tests'), ...corpusFiles('tools')].map((file) => ({
    file,
    text: readFileSync(`${ROOT}${file}`, 'utf8'),
  }))
}

/** The LIVE tools, read off `tools/README.md`'s own `## Live` table – the page
 *  `npm run tools:registry` writes, so this list cannot drift from the registry's verdict. An
 *  archival probe is evidence and may keep its copies (F-04's own terms). */
function liveTools(): Set<string> {
  // ⚠ `region`, not a raw `slice(indexOf(…))`: it THROWS on an absent marker, where the raw form
  // returns −1 and silently widens to the whole page – which here would parse the archival lists as
  // live and make RULE A (b) assert nothing. `tests/pin-hygiene.test.ts` / `pins:check` enforce this.
  const live = region(readFileSync(`${ROOT}tools/README.md`, 'utf8'), '\n## Live', '\n## Archival')
  return new Set([...live.matchAll(/^\| `([^`]+)`/gm)].map((m) => `tools/${m[1]}`))
}

// =================================================================================================
// RULE A – THE TWO FAMILIES WITH NO HONEST LOCAL FORM
// =================================================================================================

/** A fake `localStorage` installed on the global. The 53 copies the review counted were all one of
 *  these two shapes, and `tests/component/setup.ts` now exports the one that survives. */
const SHIM = /(Object\.)?defineProperty\(\s*(globalThis|global|window)\s*,\s*['"]localStorage['"]|(globalThis|global|window)\.localStorage\s*=/

export function shimOffenders(files: { file: string; text: string }[]): string[] {
  return files.filter((f) => f.file !== 'tests/component/setup.ts' && SHIM.test(f.text)).map((f) => f.file)
}

/** ⚠⚠ THE 68 FILES THAT STILL SPELL THE SHIM THEMSELVES, MEASURED 27.09 – A RATCHET, NOT A PARDON.
 *
 *  T5.10 put `installMemoryStorage()` in `tests/component/setup.ts` and left it OPT-IN, deliberately:
 *  171 of the 238 component files run without any `localStorage` at all and at least
 *  `r47-raise-another-route.test.ts:193-198` reasons from that absence. What the merge has NOT yet
 *  done is convert the callers – FOUR files import the helper today and these 68 still install their
 *  own copy of the block. So a bare «no shim outside setup.ts» would be red on arrival and could not
 *  ship, and a guard that cannot ship is not a guard.
 *
 *  The rule is therefore: this list may SHRINK and may not GROW. A file that starts importing the
 *  helper simply drops out and the assertion stays green; a NEW copy in a file that is not here is
 *  red. Re-measure with the one-liner in the failure message. */
const SHIM_COPIES_27_09 = new Set([
  'tests/component/a11y-sweep.test.ts',
  'tests/component/ad-offer-letter.test.ts',
  'tests/component/album-home-door.test.ts',
  'tests/component/career-watermarks.test.ts',
  'tests/component/college-second-act.test.ts',
  'tests/component/home-strip-and-mail.test.ts',
  'tests/component/principles-d01-restore-previous.test.ts',
  'tests/component/principles-w2-blocking-card-refusal.test.ts',
  'tests/component/principles-w2-boot-door-exit.test.ts',
  'tests/component/principles-w2-more-door-exit.test.ts',
  'tests/component/principles-w4-dialog-focus.test.ts',
  'tests/component/principles-w4-offer-live.test.ts',
  'tests/component/principles-w4-practice-rule.test.ts',
  'tests/component/principles-w4-rank-chip.test.ts',
  'tests/component/principles-w4-refusal-surfaces.test.ts',
  'tests/component/principles-w4-tier-cap-chip.test.ts',
  'tests/component/r2-13-span-report.test.ts',
  'tests/component/r38-decline-voice.test.ts',
  'tests/component/r38-tab-seen.test.ts',
  'tests/component/r39-apparel-bond-warning.test.ts',
  'tests/component/r39-decline-surfaces.test.ts',
  'tests/component/r40-last-winter-surfaces.test.ts',
  'tests/component/round14-group-c.test.ts',
  'tests/component/round18-coach.test.ts',
  'tests/component/round19-wrapup.test.ts',
  'tests/component/round20-ui.test.ts',
  'tests/component/round21-coach-photo.test.ts',
  'tests/component/round21-dialogs.test.ts',
  'tests/component/round21-popup-order.test.ts',
  'tests/component/round24-academy-letter.test.ts',
  'tests/component/round24-coach-card.test.ts',
  'tests/component/round24-college-shell.test.ts',
  'tests/component/round26-college-card.test.ts',
  'tests/component/round26-college-flow.test.ts',
  'tests/component/round26-span-gate-ui.test.ts',
  'tests/component/round26-world-alive.test.ts',
  'tests/component/round27-call-up-flow.test.ts',
  'tests/component/round28-top-notices.test.ts',
  'tests/component/round29-inbox-subjects.test.ts',
  'tests/component/round29-shoot-clash-ui.test.ts',
  'tests/component/round29-span-repair.test.ts',
  'tests/component/round31-week-entry.test.ts',
  'tests/component/round33-tournament-arrival.test.ts',
  'tests/component/round34-home-type.test.ts',
  'tests/component/round35-ui.test.ts',
  'tests/component/round36-blocked-storage.test.ts',
  'tests/component/round36-boot-refusal.test.ts',
  'tests/component/round36-desktop-shell.test.ts',
  'tests/component/round36-error-surfaces.test.ts',
  'tests/component/round36-funds-short.test.ts',
  'tests/component/round36-more-timers.test.ts',
  'tests/component/round36-pack-tokens.test.ts',
  'tests/component/round36-pass2-home.test.ts',
  'tests/component/round36-rail-dashboard.test.ts',
  'tests/component/round36-review-home.test.ts',
  'tests/component/round37-frame.test.ts',
  'tests/component/round37-home-cards.test.ts',
  'tests/component/round42-coach-portrait.test.ts',
  'tests/component/round42-inbox-contract.test.ts',
  'tests/component/round42-soft-guard.test.ts',
  'tests/component/round43-staff-portrait.test.ts',
  'tests/component/tour-briefing.test.ts',
  'tests/component/wave10-line-through-skip.test.ts',
  'tests/component/wave3-feed-glyph.test.ts',
  'tests/component/wave3-life-beat-freeze.test.ts',
  'tests/component/wave4-feed-glyph-kind.test.ts',
  'tests/component/wave7-bride-portrait.test.ts',
  'tests/principles-e07-offer-live.test.ts',
])

export function newShimCopies(files: { file: string; text: string }[], known: Set<string>): string[] {
  return shimOffenders(files).filter((f) => !known.has(f))
}

/** A top-level `argOf` / `finiteArgOf` definition. ⚠ Only in a LIVE tool: the 211 archival probes are
 *  reproductions and their copies are what they measured with. */
const ARG_DEF = /^(export )?(function (argOf|finiteArgOf)\b|const (argOf|finiteArgOf) *=)/m

/** ⚠⚠ AND THE SAME BODY UNDER ANY OTHER NAME, because a census keyed on the name is a FLOOR on the
 *  copies and never the count – measured 27.09, when five live copies called `flag` / `numOf` and one
 *  called `usd` turned out to be invisible to F-04's own grep. It matches the numeric reader's two
 *  load-bearing lines and nothing else, and the two clauses are both load-bearing: the string readers
 *  (`strOf`, `text`, `arg`) return the token rather than `Number(` it, and `form-bench.ts:55`'s `num`
 *  guards on `[i + 1] !== undefined` where this body guards on `[i + 1] ?`, which is a FIFTH
 *  behaviour (`--sims ''` yields 0 there and the fallback here) rather than a copy.
 *
 *  ⚠ The parameter's own name is `\w+` and not `name`, deliberately: an earlier draft of this regex
 *  said `--${name}`, which let `form-bench`'s copy through for the accidental reason that it calls its
 *  parameter `flag`. A guard that passes by accident is the class this whole file is about. */
const ARG_BODY = /indexOf\(`--\$\{\w+\}`\)[\s\S]{0,140}?\[i \+ 1\]\s*\?\s*Number\(/

/** ⚠⚠ THIS SET IS EMPTY, AND IT USED TO HOLD `tools/snapshot-bench.ts` – THE ENTRY IS GONE BECAUSE THE
 *  PROOF CHANGED, NOT BECAUSE THE RULE SOFTENED (28.09). Every numeric cell that bench prints is a
 *  `performance.now()` millisecond, so the before/after output diff that certifies the other thirty
 *  T5.12 migrations cannot certify it, and I exempted it on that ground. The architect's answer: an
 *  argument reader's correctness is «the same argv produces the same parsed values», which is a UNIT
 *  assertion over a handful of argv shapes – a STRONGER proof than an output diff, because it tests the
 *  function rather than a run that happens to contain it.
 *  `tests/principles-t512-arg-readers.test.ts` is that proof, and the bench is routed.
 *
 *  The set stays, empty, as the shape for the next case of «this copy cannot be diffed» – so that
 *  exempting one is a visible edit with a reason beside it rather than a quietly-widened regex. */
const ARG_BODY_EXEMPT = new Set<string>()

export function argOfOffenders(files: { file: string; text: string }[], live: Set<string>): string[] {
  return files
    .filter((f) => f.file !== 'tools/_args.ts' && live.has(f.file) && ARG_DEF.test(f.text))
    .map((f) => f.file)
}

export function argBodyOffenders(files: { file: string; text: string }[], live: Set<string>): string[] {
  return files
    .filter(
      (f) =>
        f.file !== 'tools/_args.ts' && live.has(f.file) && !ARG_BODY_EXEMPT.has(f.file) && ARG_BODY.test(f.text),
    )
    .map((f) => f.file)
}

// =================================================================================================
// RULE B – NO TWO SITES MAY SHARE A BODY
// =================================================================================================

const FAMILIES = ['clashWorld', 'atCollege', 'married', 'walkWeeks', 'weekAtAge'] as const

/** ⚠ THE GROUPS THAT ARE ALREADY IDENTICAL, MEASURED 27.09, EACH ONE A LIVE FINDING RATHER THAN AN
 *  EXEMPTION. The subset rule means these may shrink and may not grow; a group that leaves this list
 *  entirely is a merge, and a merge is the direction this file wants. */
const KNOWN_IDENTICAL: { name: string; files: string[]; note: string }[] = [
  {
    name: 'married',
    files: ['tests/wave11-loss.test.ts', 'tests/wave11-window.test.ts', 'tools/weight-bench.ts'],
    note:
      'the eleven-key `partnerName: \'Anton\'` row, byte-identical in three places. The two tests can ' +
      'take `tests/helpers/scenarios/love.ts`; the BENCH cannot – a tool importing `tests/` inverts ' +
      'the dependency (`tests/helpers/career.ts` re-exports FROM `tools/`), so its copy needs a home ' +
      'on the tools side and that is a separate item.',
  },
  {
    name: 'weekAtAge',
    files: ['tests/wave9-away-from-child.test.ts', 'tests/wave9-repeat-pregnancy.test.ts'],
    note: 'the unbounded `while` over `kidAgeExact(…) < years`, byte-identical in two files.',
  },
  {
    name: 'weekAtAge',
    files: ['tests/helpers/career.ts', 'tools/weight-bench.ts'],
    note:
      '⚠ the BENCH carries a byte-identical copy of the HOME itself – the bounded `for` over ' +
      '`kidAgeExact(…) >= years` that throws. Found only once this normaliser stopped counting the ' +
      "home's `export ` keyword as a difference, which is the whole reason that keyword is stripped. " +
      'Same wall as the `married` row: a tool cannot import `tests/helpers/`, so it needs a ' +
      'tools-side home and that is its own item.',
  },
  {
    name: 'weekAtAge',
    files: ['tests/albumBook.test.ts', 'tests/college-scene-album.test.ts'],
    note: 'the bounded `for` over `kidAgeAt(world, w) === age` that throws, byte-identical in two files.',
  },
]

/** Comments out, whitespace flattened, and a leading `export ` dropped.
 *
 *  ⚠ THE `export` IS STRIPPED BECAUSE A REAL ARM FOUND THE HOLE. Pasting `weight-bench.ts:76`'s
 *  `married` into another file as `export function married(…)` – the same body, one keyword added –
 *  went GREEN on the first run, because the keyword is part of the declaration this hashes. A guard
 *  that a copy escapes by being exported is not this guard. The narrower sensitivities are still real
 *  and are listed in the header: a renamed identifier or a changed return type still slips past. */
const normalise = (s: string): string =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^export\s+/, '')
    .trim()

/** The whole declaration, from its first line to the brace-balanced end or the arrow's last line. */
function declarationAt(lines: string[], i: number): string {
  let depth = 0
  let sawBrace = false
  for (let j = i; j < lines.length && j < i + 80; j++) {
    for (const ch of lines[j]) {
      if (ch === '{') {
        depth++
        sawBrace = true
      } else if (ch === '}') depth--
    }
    if (sawBrace && depth <= 0) return lines.slice(i, j + 1).join('\n')
    if (!sawBrace && /=>\s*\S/.test(lines[j])) return lines.slice(i, j + 1).join('\n')
  }
  return lines[i]
}

export interface Site {
  file: string
  line: number
  name: string
  body: string
}

/** Every CALLABLE local declaration of a family name. A `const atCollege = band === X` has no
 *  parameter list and no arrow, so it is not a site – which is the nine false positives removed. */
export function sites(files: { file: string; text: string }[]): Site[] {
  const out: Site[] = []
  for (const { file, text } of files) {
    const lines = text.split('\n')
    for (const name of FAMILIES) {
      const declares = new RegExp(`^\\s*(export\\s+)?(function|const|let)\\s+${name}\\b`)
      for (let i = 0; i < lines.length; i++) {
        if (!declares.test(lines[i])) continue
        const decl = declarationAt(lines, i)
        const isFunction = /^\s*(export\s+)?function/.test(lines[i])
        // ⚠ `after`, not `slice(indexOf(…))`: the marker is the family name, which the matched line is
        // guaranteed to contain, but the raw form would silently read the WHOLE declaration if that
        // ever stopped being true – and "does this declaration contain an arrow" over the whole text
        // rather than after the name is a different question. `after` throws instead.
        const isArrow = /=>/.test(after(decl, name))
        if (!isFunction && !isArrow) continue
        out.push({ file, line: i + 1, name, body: normalise(decl) })
      }
    }
  }
  return out
}

/** Groups of two or more sites of the same name sharing one normalised body, minus the ones
 *  `KNOWN_IDENTICAL` already records (a group whose files are a SUBSET of a known group's). */
export function newIdenticalGroups(all: Site[]): { name: string; files: string[] }[] {
  const byBody = new Map<string, Site[]>()
  for (const s of all) {
    const key = `${s.name}\u0000${s.body}`
    if (!byBody.has(key)) byBody.set(key, [])
    byBody.get(key)!.push(s)
  }
  const groups: { name: string; files: string[] }[] = []
  for (const group of byBody.values()) {
    const files = [...new Set(group.map((s) => s.file))].sort()
    if (files.length < 2) continue
    const known = KNOWN_IDENTICAL.some(
      (k) => k.name === group[0].name && files.every((f) => k.files.includes(f)),
    )
    if (!known) groups.push({ name: group[0].name, files })
  }
  return groups
}

// =================================================================================================
// THE CORPUS THE RULES RUN ON
// =================================================================================================

describe('T5.14 – the merged families have one home, and a second copy is red', () => {
  it('⭐⭐ RULE A (a) – no NEW file spells the component storage shim itself', () => {
    expect(
      newShimCopies(corpus(), SHIM_COPIES_27_09),
      'a `localStorage` shim was installed in a file that did not have one on 27.09.\n' +
        '`tests/component/setup.ts` exports `installMemoryStorage()` – import and call that instead.\n' +
        'The review counted 53 byte-identical copies of this block (F-03) and 68 remain, which is why\n' +
        'this arm is a shrink-only ratchet rather than a flat ban. To re-measure the list:\n' +
        '  grep -rlE "defineProperty\\(\\s*globalThis\\s*,\\s*.localStorage." tests --include="*.ts" | sort',
    ).toEqual([])
  })

  it('...and the ratchet is not silently satisfied by the list having gone stale', () => {
    // ⚠ A RATCHET ROTS IN ONE DIRECTION TOO. If a listed file is renamed or deleted, the entry stops
    // describing anything and the guard quietly loosens by one file. This arm prints the dead entries
    // instead – it does not FAIL on them, because a file leaving the list is the merge working, but a
    // reader of a green run can see how much of the list is still load-bearing.
    const live = new Set(shimOffenders(corpus()))
    const merged = [...SHIM_COPIES_27_09].filter((f) => !live.has(f))
    expect(SHIM_COPIES_27_09.size, 'the measured list is empty – RULE A (a) would assert nothing').toBe(68)
    expect(live.size, 'more files spell the shim than the ratchet allows').toBeLessThanOrEqual(68)
    if (merged.length) console.log(`T5.14: ${merged.length} of the 68 shim copies are gone – ${merged.join(', ')}`)
  })

  it('⭐⭐ RULE A (b) – a LIVE tool reads its arms through `tools/_args.ts`', () => {
    expect(
      argOfOffenders(corpus(), liveTools()),
      'a live tool defines its own `argOf`. `tools/_args.ts` exports two, and which one matters:\n' +
        '`argOf` returns NaN for `--seeds abc` and `finiteArgOf` falls back. Thirteen live copies in\n' +
        'eleven bodies were merged into those two on 27.09 (F-04). Archival probes keep theirs.',
    ).toEqual([])
  })

  it('⭐⭐ RULE A (b′) – ...and not under another name either, which is how four copies hid', () => {
    expect(
      argBodyOffenders(corpus(), liveTools()),
      'a live tool defines the numeric arm reader under another name. F-04 counted 13 by grepping for\n' +
        '`argOf`; `flag` in three benches and `numOf` in a fourth were the same body and were invisible\n' +
        'to it, which is why this arm reads the BODY. Import `argOf` or `finiteArgOf` from\n' +
        '`tools/_args.ts` and rename the call sites, or – if the behaviour really differs – say how at\n' +
        'the site, because a `Number()` that yields NaN instead of a fallback is an arm, not a style.',
    ).toEqual([])
  })

  it('⭐⭐ RULE B – no two local definitions of a merged family share one body', () => {
    expect(
      newIdenticalGroups(sites(corpus())),
      'two local definitions of a merged family name have the same body. Import the shared one from\n' +
        '`tests/helpers/` – or, if this copy differs for a reason, say the reason AT THE SITE and the\n' +
        'difference will carry it past this guard. `KNOWN_IDENTICAL` in this file lists the groups that\n' +
        'were already identical on 27.09; it may shrink and may not grow.',
    ).toEqual([])
  })

  it('the walk actually reaches the corpus, so an empty result is a verdict and not a miss', () => {
    // ⚠ EVERY ASSERTION ABOVE IS `toEqual([])`, which an empty walk satisfies for free. This is the
    // anti-vacuity arm: the corpus is read, the families ARE found in it, and the live list is real.
    const files = corpus()
    expect(files.length, 'the corpus walk found no files').toBeGreaterThan(300)
    expect(files.some((f) => f.file === 'tests/component/setup.ts'), 'setup.ts was not walked').toBe(true)
    expect(files.some((f) => f.file === 'tools/_args.ts'), '_args.ts was not walked').toBe(true)
    const found = sites(files)
    expect(found.length, 'no family site was found at all – the declaration regex is broken').toBeGreaterThan(8)
    for (const name of ['married', 'weekAtAge', 'clashWorld']) {
      expect(found.some((s) => s.name === name), `${name} was not found anywhere`).toBe(true)
    }
    const live = liveTools()
    expect(live.size, 'the Live table in tools/README.md did not parse').toBeGreaterThan(40)
    expect(live.has('tools/econ-bench.ts'), 'econ-bench is live and the parse missed it').toBe(true)
    expect(live.has('tools/his-careers-brackets.ts'), 'a frozen archival probe parsed as live').toBe(false)
  })
})

// =================================================================================================
// THE MUTATION ARMS – one per rule, each pasting a real copy back
// =================================================================================================
//
// ⚠ THESE ARE FIXTURE CORPORA, NOT THE TREE, and that is a deliberate trade with a stated cost. A
// mutation arm that edited a real file could not live in the committed suite, so each rule is proved
// on a corpus spelled out here – which proves the DETECTOR, not that the detector is aimed at the
// tree. The arm above («the walk actually reaches the corpus») is the other half of that pair: it
// proves the aim. Both were also run by hand against real edited files while this file was written,
// and those outputs are in the wave report.
describe('T5.14 – the mutation arms: each rule reddens on a real pasted copy', () => {
  it('RULE A (a) fires on the shim block, in either of its two historical shapes', () => {
    const defineProp = [
      { file: 'tests/component/setup.ts', text: 'Object.defineProperty(globalThis, \'localStorage\', { value: x })' },
      { file: 'tests/component/some-screen.test.ts', text: 'Object.defineProperty(globalThis, \'localStorage\', { value: x })' },
    ]
    expect(shimOffenders(defineProp)).toEqual(['tests/component/some-screen.test.ts'])
    const assignment = [{ file: 'tests/component/other.test.ts', text: '  globalThis.localStorage = fake\n' }]
    expect(shimOffenders(assignment)).toEqual(['tests/component/other.test.ts'])
    // ...and it does NOT fire on a file that merely names the thing or imports the helper.
    const innocent = [
      { file: 'tests/component/a.test.ts', text: "import { installMemoryStorage } from './setup'\nlocalStorage.getItem('x')\n" },
    ]
    expect(shimOffenders(innocent)).toEqual([])
    // THE RATCHET: a listed file is allowed, a new one is not.
    const shim = 'Object.defineProperty(globalThis, \'localStorage\', { value: x })'
    const known = new Set(['tests/component/round20-ui.test.ts'])
    expect(newShimCopies([{ file: 'tests/component/round20-ui.test.ts', text: shim }], known)).toEqual([])
    expect(newShimCopies([{ file: 'tests/component/brand-new.test.ts', text: shim }], known)).toEqual([
      'tests/component/brand-new.test.ts',
    ])
  })

  it('RULE A (b) fires on a live tool and stays quiet on an archival one', () => {
    const body = 'const argOf = (name: string, fallback: number): number => {\n  return fallback\n}\n'
    const live = new Set(['tools/econ-bench.ts', 'tools/_args.ts'])
    expect(argOfOffenders([{ file: 'tools/econ-bench.ts', text: body }], live)).toEqual(['tools/econ-bench.ts'])
    expect(argOfOffenders([{ file: 'tools/r31-her-arc.ts', text: body }], live)).toEqual([])
    expect(argOfOffenders([{ file: 'tools/_args.ts', text: body }], live)).toEqual([])
    // The finite twin counts too, and an `argOfSomething` does not.
    const finite = body.replace('argOf', 'finiteArgOf')
    expect(argOfOffenders([{ file: 'tools/econ-bench.ts', text: finite }], live)).toEqual(['tools/econ-bench.ts'])
    const other = body.replace('argOf =', 'argOfRung =')
    expect(argOfOffenders([{ file: 'tools/econ-bench.ts', text: other }], live)).toEqual([])
  })

  it("RULE A (b′) fires on the numeric body under another name and not on a string reader", () => {
    const numeric =
      'function flag(name: string, fallback: number): number {\n' +
      '  const i = args.indexOf(`--${name}`)\n' +
      '  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback\n}\n'
    const live = new Set(['tools/econ-bench.ts', 'tools/snapshot-bench.ts', 'tools/_args.ts'])
    expect(argBodyOffenders([{ file: 'tools/econ-bench.ts', text: numeric }], live)).toEqual(['tools/econ-bench.ts'])
    // The string twin – `strOf` / `text` / `arg` – returns the token and is NOT this helper.
    const stringy = numeric.replace('Number(args[i + 1])', 'args[i + 1]').replace(': number {', ': string {')
    expect(argBodyOffenders([{ file: 'tools/econ-bench.ts', text: stringy }], live)).toEqual([])
    // `form-bench`'s `num` guards on `!== undefined`, which is a fifth behaviour rather than a copy.
    const undef = numeric.replace('args[i + 1] ?', 'args[i + 1] !== undefined ?')
    expect(argBodyOffenders([{ file: 'tools/econ-bench.ts', text: undef }], live)).toEqual([])
    // An ARCHIVAL probe keeps its copy – it is a reproduction, and its copy is what it measured with.
    expect(argBodyOffenders([{ file: 'tools/r31-her-arc.ts', text: numeric }], live)).toEqual([])
    // ⚠ AND `snapshot-bench` IS NO LONGER EXEMPT (28.09). It was, on the ground that a bench whose every
    // printed cell is wall-clock cannot be certified by an output diff; it is routed now, certified by
    // `tests/principles-t512-arg-readers.test.ts` instead. This is the arm that would go red if the
    // exemption came back without a reason beside it.
    expect(argBodyOffenders([{ file: 'tools/snapshot-bench.ts', text: numeric }], live)).toEqual([
      'tools/snapshot-bench.ts',
    ])
  })

  it('RULE B fires on a pasted `weekAtAge` and not on a survivor that differs', () => {
    const paste = 'function weekAtAge(world: WorldState, age: number): number {\n' +
      '  for (let w = 0; w < 2000; w++) if (kidAgeAt(world, w) === age) return w\n' +
      '  throw new Error(`no week reaches age ${age}`)\n}\n'
    const pasted = newIdenticalGroups(sites([
      { file: 'tests/a.test.ts', text: paste },
      { file: 'tests/b.test.ts', text: paste },
    ]))
    expect(pasted).toEqual([{ name: 'weekAtAge', files: ['tests/a.test.ts', 'tests/b.test.ts'] }])
    // The same paste with the question changed – `>=` rather than `===` – is a survivor and is green.
    const differs = paste.replace('=== age', '>= age')
    expect(newIdenticalGroups(sites([
      { file: 'tests/a.test.ts', text: paste },
      { file: 'tests/b.test.ts', text: differs },
    ]))).toEqual([])
    // ⚠ A comment is not a difference: the normaliser strips it, so the pair stays red.
    const commented = `// this one is ours, and it is different, honestly\n${paste}`
    expect(newIdenticalGroups(sites([
      { file: 'tests/a.test.ts', text: paste },
      { file: 'tests/b.test.ts', text: commented },
    ])).length).toBe(1)
  })

  it('RULE B fires on a pasted `clashWorld` body and not on a one-line binding', () => {
    const posed = 'function clashWorld(seed: string): WorldState {\n' +
      '  const world = createWorld(seed)\n  world.fundsCents = 1\n  return world\n}\n'
    expect(newIdenticalGroups(sites([
      { file: 'tests/component/x.test.ts', text: posed },
      { file: 'tests/component/y.test.ts', text: posed },
    ])).length).toBe(1)
    // The three surviving sites are one-line bindings onto the shared builder. Two of them spelling
    // the SAME binding is not a pasted fixture – but it IS a second copy of one line, and this guard
    // says so rather than carving an exception it cannot justify.
    const binding = 'const clashWorld = (seed: string): WorldState => sharedClash(seed, { bodyPose: false })\n'
    expect(newIdenticalGroups(sites([
      { file: 'tests/component/x.test.ts', text: binding },
      { file: 'tests/component/y.test.ts', text: binding },
    ])).length).toBe(1)
  })

  it('RULE B does not see a boolean local of the same name – the nine false positives', () => {
    const boolean = '      const atCollege = band === BIRTHDAY_COLLEGE_BAND\n'
    expect(sites([
      { file: 'tests/birthday-ask.test.ts', text: boolean },
      { file: 'tests/round42-birthday-durables.test.ts', text: boolean },
    ])).toEqual([])
  })
})
