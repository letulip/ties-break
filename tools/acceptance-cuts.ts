// ACCEPTANCE CUTS – what a rung's DOOR is worth, measured on careers rather than argued from a table.
//
//   npx vite-node tools/acceptance-cuts.ts [--seeds N] [--weeks N] [--only 1,2]
//                                          [--arm "w75=250"] [--arm "w75=250,w100=200"]
//
// THE QUESTION (owner, 15.08): «У нас W75 пускает всех из топ-450 профессиональной таблицы, с 17
// лет, без порога по очкам. Реальный W75 отбирает заметно у́же. А заодно и с другими ступенями тоже
// актуализировать.» An acceptance cut is not a cosmetic constant – it decides WHO SHE MEETS and WHEN
// SHE MAY ENTER – so "ours is looser than reality" has to be priced before it is fixed.
//
// ⚠ AND IT IS NOT ONE DECISION. `ENDINGS.collegeClosedFromTier` is `w75`, and `collegeStillOpen`
// shuts the college ending the moment a career records a counting finish at W75 or above. So
// `TIERS.w75.acceptsRank` silently sets THE AGE AT WHICH THE COLLEGE ENDING STOPS EXISTING. Two
// unrelated decisions ride one constant, and section 2 measures the second one explicitly – the
// college column is not a footnote here, it is half of what this tool is for.
//
// WHAT IT PRINTS
//
//   1. THE DOORS, as the engine resolves them this week. Every rung carrying `acceptsRank` (an
//      absolute rank on the merged W table) or `enterPct` (a share of the ITF table), what the cut
//      resolves to in ROWS, what BOOK stands on that row, and what share of the table it admits.
//      This is the audit table's "ours" column, read out of the engine rather than off a comment.
//
//   2. THE CONSEQUENCE, on careers. Two or more arms over IDENTICAL SEEDS, on `POLICIES[1]` (the
//      rebuilt bench's model-of-a-reasonable-parent). Per arm: entries by rung, the AGE she first
//      enters each rung, her end rank and book on both live tables, the family's money – and the
//      week the college door shuts, which rung shut it, and whether it is still open at the fork.
//
// ⚠ IT PATCHES `TIERS[t].acceptsRank` / `.enterPct` IN MEMORY to ask the counterfactual, restoring
// the shipped value between arms – `tools/big-draw-cost.ts`'s own `drawSize` idiom, which is the
// fatigue bench's `withScenario`. Nothing is written back to any file. MEASUREMENT ONLY: this tool
// changes no shipped constant, and the decision about the cuts is the owner's to make with the
// table in hand.
//
// ⚠ INPUT-INDEPENDENCE MAKES THE ARMS COMPARABLE (CLAUDE.md invariant 2). Both arms open the same
// `bench-<background>-<index>` seed and tap the same MAIN stream, so the world's dice are identical
// across arms and every difference printed below is the DOOR's, not the weather's.

import { openCareer, stepCareerWeek, POLICIES, PRESETS, zeroByTier, mean, median, type Preset } from './econ-bench'
import {
  collegeStillOpen,
  kidAgeExact,
  kidPoints,
  acceptanceRank,
  tableSize,
  tierFloorOpen,
} from '../src/engine/world'
// `rankingFor` is not on world.ts's re-export list – the same import `tools/draw-vs-band.ts` makes.
import { rankingFor } from '../src/engine/world/ladder'
import { ENDINGS } from '../src/engine/ending'
import { createWorld } from '../src/engine/world'
import { TIERS, TIER_LADDER, TIER_SHORT, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'

// --- args -----------------------------------------------------------------------------------------

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
/** seeds PER PRESET. n = SEEDS x PRESETS.length careers per arm. */
const SEEDS = argOf('seeds', 6)
/** 312 = fourteen to twenty, the econ bench's third horizon – the only one in which the adult tour
 *  is reachable at all (W75 opens at 17 = week 156) and which passes the fork at 19. */
const WEEKS = argOf('weeks', 312)
const ONLY = (() => {
  const i = args.indexOf('--only')
  return i >= 0 && args[i + 1] ? new Set(args[i + 1].split(',')) : null
})()
const wants = (s: string) => !ONLY || ONLY.has(s)

/** Every `--arm "w75=250,w100=200"` on the command line, in order. The SHIPPED arm is always first
 *  and is never patched, so a run with no `--arm` is a pure baseline. */
const ARM_SPECS: string[] = []
for (let i = 0; i < args.length; i++) if (args[i] === '--arm') ARM_SPECS.push(args[++i])

/** A rung's door, in whichever of the two units that rung carries. */
interface Cut {
  acceptsRank?: number
  enterPct?: number
}
type Patch = Partial<Record<TierId, Cut>>

/** `"w75=250,j60=0.35"` – an integer is an `acceptsRank`, a fraction below 1 is an `enterPct`. The
 *  unit is inferred from the rung's OWN shipped field rather than from the number, so a typo lands
 *  as a crash instead of as a silent unit swap. */
function parsePatch(spec: string): Patch {
  const out: Patch = {}
  for (const part of spec.split(',')) {
    const [rung, raw] = part.split('=')
    const tier = rung.trim() as TierId
    if (!TIERS[tier]) throw new Error(`unknown rung "${rung}" in --arm "${spec}"`)
    const value = Number(raw)
    if (!Number.isFinite(value)) throw new Error(`bad value "${raw}" in --arm "${spec}"`)
    if (TIERS[tier].acceptsRank !== undefined) out[tier] = { acceptsRank: value }
    else if (TIERS[tier].enterPct !== undefined) out[tier] = { enterPct: value }
    else throw new Error(`rung "${rung}" carries no acceptance cut to patch`)
  }
  return out
}

interface Arm {
  label: string
  patch: Patch
}
const ARMS: Arm[] = [{ label: 'shipped', patch: {} }, ...ARM_SPECS.map((s) => ({ label: s, patch: parsePatch(s) }))]

// --- the patch-and-restore idiom (tools/big-draw-cost.ts) ------------------------------------------

type Mutable = { acceptsRank?: number; enterPct?: number }

/** The shipped table, captured once at load, so every restore goes back to the FILE's values rather
 *  than to whatever the previous arm left behind. */
const SHIPPED: Map<TierId, Cut> = new Map(
  TIER_LADDER.map((t) => [t, { acceptsRank: TIERS[t].acceptsRank, enterPct: TIERS[t].enterPct }]),
)

function applyPatch(patch: Patch): void {
  for (const t of TIER_LADDER) {
    const base = SHIPPED.get(t)!
    const over = patch[t]
    const target = TIERS[t] as unknown as Mutable
    target.acceptsRank = over?.acceptsRank ?? base.acceptsRank
    target.enterPct = over?.enterPct ?? base.enterPct
  }
}
const restore = () => applyPatch({})

// --- helpers ---------------------------------------------------------------------------------------

const pad = (s: string | number, w: number) => String(s).padStart(w)
const padE = (s: string | number, w: number) => String(s).padEnd(w)
const rule = (n = 118) => '-'.repeat(n)
function section(title: string): void {
  console.log(`\n${rule()}\n${title}\n${rule()}`)
}
function fmtUsd(cents: number): string {
  const d = Math.round(cents / 100)
  return `${d < 0 ? '-' : ''}$${Math.abs(d).toLocaleString('en-US')}`
}
/** mean of the entries that exist – "the age she reached this rung, over the careers that reached
 *  it at all". A rung nobody reaches prints its REACH COUNT of 0 and no age, which is the honest
 *  reading: an age averaged over an empty set is not a small number, it is no number. */
function meanOf(xs: number[]): string {
  return xs.length ? mean(xs).toFixed(1) : '  –'
}

/** The rungs that carry a door at all. `hasAcceptanceList`'s two fields, in ladder order. */
const GATED: readonly TierId[] = TIER_LADDER.filter(
  (t) => TIERS[t].acceptsRank !== undefined || TIERS[t].enterPct !== undefined,
)
/** The rungs at or above the one that shuts the college ending. */
const COLLEGE_CLOSERS: readonly TierId[] = TIER_LADDER.slice(TIER_LADDER.indexOf(ENDINGS.collegeClosedFromTier))

// =================================================================================================
// 1. THE DOORS, as the engine resolves them
// =================================================================================================

if (wants('1')) {
  restore()
  const world = createWorld('acceptance-cuts-doors')
  const wta = rankingFor(world, 'wta')
  const itf = rankingFor(world, 'itf')
  const pointedWta = wta.filter((r) => r.points > 0).length

  section('1. THE DOORS – every rung that has one, in the unit it carries')
  console.log(
    `  the merged W table is ${wta.length} rows (${pointedWta} of them hold any points); ` +
      `the ITF junior table is ${itf.length} rows`,
  )
  console.log(
    `\n  ${padE('rung', 9)}${pad('minAge', 7)}${pad('unit', 13)}${pad('cut', 7)}${pad('= row', 8)}` +
      `${pad('book there', 12)}${pad('share of table', 16)}   refuses anybody?`,
  )
  for (const t of GATED) {
    const def = TIERS[t]
    const table = def.track === 'wta' ? wta : itf
    const row = acceptanceRank(world, t)!
    const book = table[Math.min(table.length - 1, row - 1)]?.points ?? 0
    const unit = def.acceptsRank !== undefined ? 'acceptsRank' : 'enterPct'
    const raw = def.acceptsRank !== undefined ? String(def.acceptsRank) : def.enterPct!.toFixed(2)
    const pointed = def.track === 'wta' ? pointedWta : table.filter((r) => r.points > 0).length
    const verdict =
      row >= table.length ? 'INERT (past the table)' : row > pointed ? 'INERT (past the pointed rows)' : 'gates'
    console.log(
      `  ${padE(t, 9)}${pad(def.minAgeYears ?? '–', 7)}${pad(unit, 13)}${pad(raw, 7)}${pad(`#${row}`, 8)}` +
        `${pad(book, 12)}${pad(`${((100 * row) / table.length).toFixed(1)}%`, 16)}   ${verdict}`,
    )
  }
  console.log(
    `\n  ⚠ THE "book there" COLUMN IS THE DOOR'S REAL PRICE. A cut is a rank, but what the kid has to` +
      `\n    BUILD to clear it is the book standing on that row – and that is the number the audit compares.`,
  )
  // What a book is worth in her own currency, so the "book there" column can be read as tennis.
  // --- 1a. THE CUT'S OTHER ENCODING ----------------------------------------------------------------
  //
  // ⚠ A RUNG'S ACCEPTANCE RANGE IS ENCODED TWICE AND THE TWO MUST AGREE. `population-1600-2026-08.md`
  // §2 states the rule: every W rung carries the real acceptance range beside its `acceptsRank`,
  // `acceptsRank` IS that range's FLOOR (the deepest rank admitted), and `entrantPctBand` is the same
  // range read as a share of the table (who the draw is MADE of). A band that does not resolve back
  // onto its own cut is a defect on the ladder's own terms, not a tuning preference – so the audit
  // has to print both halves or it is auditing half a decision.
  console.log(`\n  1a. THE SAME RANGE, THE OTHER ENCODING – \`entrantPctBand\` resolved on this table`)
  console.log(
    `  ${padE('rung', 9)}${pad('cut (range floor)', 19)}${pad('band', 18)}${pad('band = rows', 14)}` +
      `   does the band's FLOOR reach the cut?`,
  )
  for (const t of GATED) {
    const def = TIERS[t]
    const table = def.track === 'wta' ? wta : itf
    const [lo, hi] = def.entrantPctBand
    const loRow = Math.round(lo * table.length)
    const hiRow = Math.round(hi * table.length)
    const cut = acceptanceRank(world, t)!
    console.log(
      `  ${padE(t, 9)}${pad(`#${cut}`, 19)}${pad(`[${lo}, ${hi}]`, 18)}${pad(`#${loRow}–#${hiRow}`, 14)}` +
        `   ${hiRow >= cut ? `yes – the band reaches #${hiRow}, past the cut` : `NO – the band stops at #${hiRow}, above the cut`}`,
    )
  }

  console.log(
    `\n  for scale, W titles: ` +
      (['w15', 'w35', 'w50', 'w75', 'w100', 'wta125'] as TierId[])
        .map((t) => `${TIER_SHORT[t]} ${TIERS[t].points[0]}`)
        .join(' · ') +
      ` (best-18 window)`,
  )
}

// =================================================================================================
// 2. THE CONSEQUENCE – careers, identical seeds, one arm per candidate cut
// =================================================================================================

interface Row {
  seed: string
  entries: Record<TierId, number>
  /** her age the first week she committed to an event of this rung */
  firstAge: Partial<Record<TierId, number>>
  /** ⭐ WHICH GATE ACTUALLY BINDS. Her age the first week `tierFloorOpen` says yes – i.e. the week
   *  the ACCEPTANCE CUT alone stopped refusing her, with the age gate not consulted. Compare it to
   *  the rung's `minAgeYears`: if she clears the cut younger than the doorway, the cut is doing
   *  nothing and the AGE is the whole gate. That is a different claim from "she entered late" and
   *  it is the one a cut has to answer. */
  cutClearedAge: Partial<Record<TierId, number>>
  endRankWta: number
  endPointsWta: number
  endRankItf: number
  endFundsCents: number
  prizeCents: number
  /** the week `collegeStillOpen` first went false, and her age that week */
  collegeShutWeek: number | null
  collegeShutAge: number | null
  /** which rung's finish shut it */
  collegeShutTier: TierId | null
  /** was it still open the week she turned `ENDINGS.forkAgeYears`? */
  collegeOpenAtFork: boolean
}

/** ONE career, run exactly as `econ-bench`'s own `runCareer` runs it – same `openCareer`, same
 *  `stepCareerWeek`, same policy – with the four extra readings this question needs. */
function runOne(preset: Preset, index: number, policy = POLICIES[1]): Row {
  const { world, rng, seed } = openCareer(preset, index, policy)
  const entries = zeroByTier()
  const firstAge: Partial<Record<TierId, number>> = {}
  const cutClearedAge: Partial<Record<TierId, number>> = {}
  let collegeShutWeek: number | null = null
  let collegeShutAge: number | null = null
  let collegeShutTier: TierId | null = null
  let collegeOpenAtFork = true
  let forkSeen = false
  // The prize line, read off the SAME per-week ledger the Money screen reads, week by week, because
  // `financeWeeks` is pruned to a 60-week trailing window – `runCareer`'s own `seenWeeks` idiom.
  const seenWeeks = new Set<number>()
  let prizeCents = 0

  for (let i = 0; i < WEEKS; i++) {
    const weekOfEntry = world.week
    const e = stepCareerWeek(world, rng, policy)
    for (const t of TIER_LADDER) {
      if (e[t] <= 0) continue
      entries[t] += e[t]
      if (firstAge[t] === undefined) firstAge[t] = kidAgeExact(weekOfEntry, world.profile.birthMonth)
    }
    for (const fw of world.financeWeeks) {
      if (seenWeeks.has(fw.week)) continue
      seenWeeks.add(fw.week)
      prizeCents += Math.max(0, fw.byCategory.prize ?? 0)
    }
    // The cut, asked WITHOUT the age gate – `tierFloorOpen` is the rank half alone (world/ladder.ts).
    for (const t of GATED) {
      if (cutClearedAge[t] !== undefined) continue
      if (tierFloorOpen(world, t)) cutClearedAge[t] = kidAgeExact(world.week, world.profile.birthMonth)
    }
    if (collegeShutWeek === null && !collegeStillOpen(world)) {
      collegeShutWeek = world.week
      collegeShutAge = kidAgeExact(world.week, world.profile.birthMonth)
      // WHICH RUNG SHUT IT – the same read `collegeStillOpen` makes, reported rather than folded.
      for (const t of COLLEGE_CLOSERS) {
        const finish = world.bestFinishByTier[t]
        if (finish === undefined) continue
        if (finish >= TIERS[t].points.length - 1) continue
        if (TIERS[t].points[finish] > 0) {
          collegeShutTier = t
          break
        }
      }
    }
    if (!forkSeen && kidAgeExact(world.week, world.profile.birthMonth) >= ENDINGS.forkAgeYears) {
      forkSeen = true
      collegeOpenAtFork = collegeStillOpen(world)
    }
  }

  return {
    seed,
    entries,
    firstAge,
    cutClearedAge,
    endRankWta: world.kidRankWta ?? tableSize(world, 'wta'),
    endPointsWta: kidPoints(world, 'wta'),
    endRankItf: world.kidRank,
    endFundsCents: world.fundsCents,
    prizeCents,
    collegeShutWeek,
    collegeShutAge,
    collegeShutTier,
    collegeOpenAtFork,
  }
}

if (wants('2')) {
  section(
    `2. THE CONSEQUENCE – ${PRESETS.length} presets x ${SEEDS} seeds = ${PRESETS.length * SEEDS} careers ` +
      `per arm, ${WEEKS} weeks (14→${14 + Math.round(WEEKS / WEEKS_PER_YEAR)}), policy "${POLICIES[1].label}"`,
  )
  console.log(`  arms: ${ARMS.map((a) => a.label).join('  ·  ')}`)
  console.log(`  identical seeds per arm; the MAIN stream is input-independent, so only the doors differ.`)

  const byArm = new Map<string, Row[]>()
  for (const arm of ARMS) {
    applyPatch(arm.patch)
    const rows: Row[] = []
    const t0 = Date.now()
    for (const preset of PRESETS) for (let i = 0; i < SEEDS; i++) rows.push(runOne(preset, i))
    byArm.set(arm.label, rows)
    console.error(`  [${arm.label}] ${rows.length} careers in ${((Date.now() - t0) / 1000).toFixed(0)}s`)
  }
  restore()

  // --- 2a. entries per career, by rung -------------------------------------------------------------
  console.log(`\n  2a. ENTRIES PER CAREER, by rung (mean over n=${PRESETS.length * SEEDS})`)
  const shown = TIER_LADDER.filter((t) => TIERS[t].track !== 'domestic')
  console.log(`  ${padE('arm', 24)}${shown.map((t) => pad(TIER_SHORT[t], 9)).join('')}${pad('W75+', 9)}`)
  for (const arm of ARMS) {
    const rows = byArm.get(arm.label)!
    const cell = (t: TierId) => mean(rows.map((r) => r.entries[t])).toFixed(1)
    const w75plus = mean(rows.map((r) => COLLEGE_CLOSERS.reduce((s, t) => s + r.entries[t], 0))).toFixed(1)
    console.log(`  ${padE(arm.label, 24)}${shown.map((t) => pad(cell(t), 9)).join('')}${pad(w75plus, 9)}`)
  }

  // --- 2b. the age she reaches each rung -----------------------------------------------------------
  console.log(`\n  2b. THE AGE SHE FIRST ENTERS EACH RUNG (mean over the careers that reach it; "n" is that count)`)
  console.log(`  ${padE('arm', 24)}${shown.map((t) => pad(TIER_SHORT[t], 12)).join('')}`)
  for (const arm of ARMS) {
    const rows = byArm.get(arm.label)!
    const cell = (t: TierId) => {
      const ages = rows.map((r) => r.firstAge[t]).filter((a): a is number => a !== undefined)
      return `${meanOf(ages)}/${ages.length}`
    }
    console.log(`  ${padE(arm.label, 24)}${shown.map((t) => pad(cell(t), 12)).join('')}`)
  }

  // --- 2b2. ⭐ WHICH GATE ACTUALLY BINDS ------------------------------------------------------------
  //
  // A rung has TWO doors – `minAgeYears` and the acceptance cut – and only one of them can be the
  // binding one. This is the table that says which, and it is the measurement the whole audit turns
  // on: a cut she clears BEFORE the doorway opens is not selecting anybody, whatever number is
  // written on it.
  console.log(
    `\n  2b2. WHICH GATE BINDS – her age the week the CUT ALONE stops refusing her (\`tierFloorOpen\`,` +
      ` age not consulted)\n       vs the rung's own \`minAgeYears\`. "cut binds" = she cleared the cut` +
      ` LATER than the doorway opened.`,
  )
  const wRungs = GATED.filter((t) => TIERS[t].track === 'wta')
  console.log(
    `  ${padE('arm', 24)}${padE('rung', 10)}${pad('minAge', 8)}${pad('cut cleared at', 16)}` +
      `${pad('n cleared', 11)}${pad('cut binds', 11)}   verdict`,
  )
  for (const arm of ARMS) {
    const rows = byArm.get(arm.label)!
    for (const t of wRungs) {
      const ages = rows.map((r) => r.cutClearedAge[t]).filter((a): a is number => a !== undefined)
      const minAge = TIERS[t].minAgeYears ?? 0
      const binds = ages.filter((a) => a > minAge).length
      const verdict = ages.length === 0
        ? 'never cleared – the CUT is the whole gate'
        : binds === 0
          ? 'the AGE GATE is the whole gate – the cut refuses nobody who waits'
          : `the cut delays ${binds}/${ages.length}`
      console.log(
        `  ${padE(arm.label, 24)}${padE(t, 10)}${pad(minAge, 8)}${pad(meanOf(ages), 16)}` +
          `${pad(`${ages.length}/${rows.length}`, 11)}${pad(`${binds}/${Math.max(1, ages.length)}`, 11)}   ${verdict}`,
      )
    }
  }

  // --- 2c. rank, book, money -----------------------------------------------------------------------
  console.log(`\n  2c. WHERE SHE ENDS, AND WHAT IT COST`)
  console.log(
    `  ${padE('arm', 24)}${pad('WTA rank', 11)}${pad('median', 9)}${pad('WTA book', 10)}${pad('ITF rank', 10)}` +
      `${pad('prize', 12)}${pad('end funds', 13)}${pad('survived', 10)}`,
  )
  for (const arm of ARMS) {
    const rows = byArm.get(arm.label)!
    console.log(
      `  ${padE(arm.label, 24)}${pad(mean(rows.map((r) => r.endRankWta)).toFixed(0), 11)}` +
        `${pad(median(rows.map((r) => r.endRankWta)).toFixed(0), 9)}` +
        `${pad(mean(rows.map((r) => r.endPointsWta)).toFixed(0), 10)}` +
        `${pad(mean(rows.map((r) => r.endRankItf)).toFixed(0), 10)}` +
        `${pad(fmtUsd(mean(rows.map((r) => r.prizeCents))), 12)}` +
        `${pad(fmtUsd(mean(rows.map((r) => r.endFundsCents))), 13)}` +
        `${pad(`${((100 * rows.filter((r) => r.endFundsCents >= 0).length) / rows.length).toFixed(0)}%`, 10)}`,
    )
  }

  // --- 2d. THE COLLEGE COUPLING --------------------------------------------------------------------
  console.log(
    `\n  2d. THE COLLEGE COUPLING – \`ENDINGS.collegeClosedFromTier\` is "${ENDINGS.collegeClosedFromTier}",` +
      ` so ${COLLEGE_CLOSERS.join('/')} shut the ending`,
  )
  console.log(
    `  ${padE('arm', 24)}${pad('ever shut', 11)}${pad('mean age', 10)}${pad('median age', 12)}` +
      `${pad('open at fork', 14)}   which rung shut it`,
  )
  for (const arm of ARMS) {
    const rows = byArm.get(arm.label)!
    const shut = rows.filter((r) => r.collegeShutAge !== null)
    const ages = shut.map((r) => r.collegeShutAge!)
    const byTier = new Map<TierId, number>()
    for (const r of shut) if (r.collegeShutTier) byTier.set(r.collegeShutTier, (byTier.get(r.collegeShutTier) ?? 0) + 1)
    const who = [...byTier.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([t, n]) => `${TIER_SHORT[t]} ${((100 * n) / Math.max(1, shut.length)).toFixed(0)}%`)
      .join(' · ')
    console.log(
      `  ${padE(arm.label, 24)}${pad(`${shut.length}/${rows.length}`, 11)}${pad(meanOf(ages), 10)}` +
        `${pad(ages.length ? median(ages).toFixed(1) : '  –', 12)}` +
        `${pad(`${((100 * rows.filter((r) => r.collegeOpenAtFork).length) / rows.length).toFixed(0)}%`, 14)}   ${who || '–'}`,
    )
  }
  console.log(
    `\n  ⚠ READ 2d AGAINST 2b's W75 COLUMN. They are the same constant. Moving \`w75.acceptsRank\`` +
      `\n    moves the age the scholarship stops existing, and nothing in \`ending.ts\` says so.`,
  )
}

restore()
