// ⭐⭐ DID THE SLAM GET HARDER, OR DID THE ENTRANT POOL GET WEAKER? – the owner, 17.08, on the
// wild-card measurement: «независимо от уровня скилла??»
//
// THE CLAIM UNDER TEST. `tools/big-rung-finishes.ts` reported the Slam's first-match loss rate moving
// 41.8% → 44.3% when the wild cards shipped, and more careers reaching one. Two readings fit that:
//
//   (a) THE DRAW GOT HARDER – a real difficulty change, which would be a mechanism to find.
//   (b) THE MIX MOVED – wild cards put WEAKER players (#113-#333, refused by the list) into draws,
//       and the careers that newly reach a Slam are the recipients, who lose first rounds. Then the
//       per-entry worsening is a DENOMINATOR effect and the draw itself is unchanged or easier.
//
// ⚠ (a) AND (b) ARE DISTINGUISHED BY TWO NUMBERS AND NOTHING ELSE, which is what this file prints:
//   1. THE FIELD SHE MEETS – the engine's own reading of it (`EventPreview.fieldStrength`), per arm.
//      If it fell, the field got easier; if it rose, (a) is live and there is a mechanism to find.
//   2. THE LOSS RATE AT A FIXED ENTRANT RANK – bucketed by her rank the week she committed. If every
//      bucket is flat and only the MIX of buckets moved, that is (b), in one table.
//
// ⚠⚠ THE ARMS ARE A CONSTANT SWEEP, NOT TWO TREES, AND THAT IS STRONGER HERE. `WILD_CARD` is a plain
// object for exactly this reason (`ON_RAMP`'s own note argues the idiom), so both arms are the SAME
// BYTES with one number changed – no second commit, no worktree, and no possibility of another
// agent's work leaking into one side, which is precisely what went wrong on this wave's first
// measurement. `slots 0` is the pre-mechanic world on BOTH sides since the master-switch fix: the
// AI pass returns early AND `wildCardWindow` refuses, so her door is shut too.
//
//     npx vite-node tools/slam-difficulty.ts [--seeds 6] [--weeks 676]
//
// ⚠ MEASUREMENT ONLY. It sweeps `WILD_CARD.slots` and restores it; it patches nothing else and
// touches nothing under src/.

import { PRESETS, POLICIES, openCareer, stepCareerWeek } from './econ-bench'
import { TIERS } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'
import { KID_ID } from '../src/engine/world/constants'
import { WILD_CARD } from '../src/engine/season/tournament'
import { homeWildCardPlace, toSnapshot } from '../src/engine/world'

const argOf = (name: string, fallback: number): number => {
  const next = process.argv[process.argv.indexOf(`--${name}`) + 1]
  const n = Number(next)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const SEEDS = argOf('seeds', 6)
const WEEKS = argOf('weeks', 676)
const RUNG: TierId = 'slam'
const POLICY = POLICIES[1]

/** Her rank at entry, in the buckets the question is asked in. */
const BUCKETS: Array<[string, number, number]> = [
  ['#1-50', 1, 50],
  ['#51-104', 51, 104],
  ['#105-150', 105, 150],
  ['#151+', 151, Number.MAX_SAFE_INTEGER],
]
const bucketOf = (rank: number): number => BUCKETS.findIndex(([, lo, hi]) => rank >= lo && rank <= hi)

interface Entry {
  /** which career this entry belongs to – carried EXPLICITLY. The first cut reconstructed it by
   *  watching the week counter go backwards, which is the kind of clever join that is wrong the first
   *  time a career ends early or a season wraps. */
  career: number
  week: number
  rank: number
  /** ⚠ THE ENGINE'S OWN READINGS OF THE FIELD SHE IS ABOUT TO MEET, and they are taken rather than
   *  re-derived. `EventPreview.fieldStrength` is CATEGORICAL ('favourite' | 'even' | 'strong'), so the
   *  numeric half of "how hard was this draw" is `firstMatchChance` and `opponentRank` – both computed
   *  by `previewEvent` against the real field `computeShadowTournament` will build. Rebuilding that
   *  field here would be a second implementation of the thing under test. */
  firstMatchChance: number
  opponentRank: number | null
  strongField: boolean
  /** did she hold a wild card for this event when she committed */
  wildCard: boolean
}

interface Arm {
  slots: number
  entries: Entry[]
  /** finish index per (week) for the rung, recovered from the ledger exactly as big-rung-finishes does */
  finishes: Map<string, number>
  careersEntering: Set<number>
  careersPastR1: Set<number>
}

function runArm(slots: number): Arm {
  const before = WILD_CARD.slots
  WILD_CARD.slots = slots
  const arm: Arm = { slots, entries: [], finishes: new Map(), careersEntering: new Set(), careersPastR1: new Set() }
  try {
    let careerIndex = 0
    for (const preset of PRESETS) {
      for (let s = 0; s < SEEDS; s++) {
        const id = careerIndex++
        const { world, rng } = openCareer(preset, s, POLICY)
        const seenEntry = new Set<string>()
        for (let w = 0; w < WEEKS && world.ending === null; w++) {
          // ⚠ READ BEFORE THE TICK ADVANCES HER, and only when something at the rung is on her entry
          // list – the snapshot is the expensive call and a career has ~50 of these weeks in 676.
          const pending = world.entries.filter((eid) => {
            if (seenEntry.has(eid)) return false
            const ev = world.season.find((x) => x.id === eid)
            return ev !== undefined && ev.tier === RUNG
          })
          if (pending.length) {
            const snap = toSnapshot(world)
            for (const eid of pending) {
              seenEntry.add(eid)
              const ev = world.season.find((x) => x.id === eid)!
              const card = snap.upcoming.find((u) => u.id === eid)
              arm.entries.push({
                career: id,
                week: ev.week,
                rank: world.kidRankWta ?? Number.MAX_SAFE_INTEGER,
                firstMatchChance: card?.preview.firstMatchChance ?? NaN,
                opponentRank: card?.preview.opponentRank ?? null,
                strongField: card?.preview.fieldStrength === 'strong',
                // ⚠ ASKED OF THE ENGINE, not inferred from the rank: `homeWildCardPlace` IS the rule,
                // and asking anything else here would be a second implementation of it.
                wildCard: homeWildCardPlace(world, ev.tier, ev.id),
              })
            }
          }
          stepCareerWeek(world, rng, POLICY)
        }
        const points = TIERS[RUNG].points ?? []
        for (const row of world.results) {
          if (row.playerId !== KID_ID || row.tier !== RUNG) continue
          const finish = points.indexOf(row.points)
          if (finish < 0) continue
          arm.finishes.set(`${id}:${row.week}`, finish)
          arm.careersEntering.add(id)
          if (finish < points.length - 1) arm.careersPastR1.add(id)
        }
      }
    }
  } finally {
    WILD_CARD.slots = before
  }
  return arm
}

// ⚠ THE ENTRY→FINISH JOIN IS BY (career, week) AND IT HAS TO BE. A career plays at most one
// tournament a week (`enterEvent` enforces it), so the pair is unique; keying on the event id would
// not work because the ledger row carries a week and a tier, never an id.
//
// ⚠ AN ENTRY WITH NO ROW IS DROPPED, and that is correct rather than lossy: a Slam entry that never
// produced a ledger row is one the career never played – withdrawn, injured, or the horizon ended
// first. Counting it as a loss would invent a result.
function joined(arm: Arm): Array<Entry & { finish: number }> {
  const out: Array<Entry & { finish: number }> = []
  for (const e of arm.entries) {
    const finish = arm.finishes.get(`${e.career}:${e.week}`)
    if (finish !== undefined) out.push({ ...e, finish })
  }
  return out
}

const armOff = runArm(0)
const armOn = runArm(8)

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN)
const pct = (a: number, b: number) => (b === 0 ? '    –' : `${((100 * a) / b).toFixed(1).padStart(5)}%`)
const last = (TIERS[RUNG].points ?? []).length - 1

console.log('')
console.log(`SLAM DIFFICULTY · ${PRESETS.length} presets x ${SEEDS} seeds = n ${PRESETS.length * SEEDS} careers · ${WEEKS} weeks · policy "${POLICY.id}"`)
console.log(`  arms are WILD_CARD.slots 0 (pre-mechanic, both sides shut) vs 8 (shipped) – same bytes, one number`)
console.log('')

console.log("1. THE FIELD SHE MEETS – the engine's own readings, per entry COMMITMENT")
console.log('')
console.log('  ⚠ "commitments" IS NOT "matches played", and the gap is large and deliberate: this counts')
console.log('    every Slam that appeared on `world.entries`, while sections 2 and 5 count only the ones')
console.log('    that produced a SCORED ledger row. An entry released, withdrawn, cut short by injury or')
console.log('    still pending at the horizon has no result, and counting it as a loss would invent one.')
console.log('')
console.log('  arm          commitments   mean 1st-match chance   mean opponent rank   "strong field"')
for (const [label, arm] of [['slots 0', armOff], ['slots 8', armOn]] as const) {
  const fc = arm.entries.map((e) => e.firstMatchChance).filter((x) => Number.isFinite(x))
  const orr = arm.entries.map((e) => e.opponentRank).filter((x): x is number => x !== null)
  const strong = arm.entries.filter((e) => e.strongField).length
  console.log(
    `  ${label.padEnd(14)} ${String(arm.entries.length).padStart(7)}   ${(100 * mean(fc)).toFixed(1).padStart(20)}%   ${mean(orr).toFixed(1).padStart(18)}   ${pct(strong, arm.entries.length)}`,
  )
}
console.log('')
console.log('  ⚠ IF THIS ROW IS FLAT, THE DRAW DID NOT CHANGE and the per-entry move is composition.')
console.log('    Her shadow draw is built by `computeShadowTournament` off `seed:kidtour:`, which never')
console.log('    calls the wild-card pass at all – so a flat row here is the PREDICTED result, not a null.')
console.log('')

console.log('2. FIRST-MATCH LOSS RATE AT A FIXED ENTRANT RANK')
console.log('')
console.log('  bucket        slots 0: n   lost R1        slots 8: n   lost R1        delta')
for (let b = 0; b < BUCKETS.length; b++) {
  const cells: Array<{ n: number; lost: number }> = []
  for (const arm of [armOff, armOn]) {
    const rows = joined(arm).filter((e) => bucketOf(e.rank) === b)
    cells.push({ n: rows.length, lost: rows.filter((e) => e.finish === last).length })
  }
  const [a, c] = cells
  const ra = a.n ? (100 * a.lost) / a.n : NaN
  const rc = c.n ? (100 * c.lost) / c.n : NaN
  const delta = Number.isFinite(ra) && Number.isFinite(rc) ? `${(rc - ra >= 0 ? '+' : '')}${(rc - ra).toFixed(1)}pp` : '   –'
  console.log(
    `  ${BUCKETS[b][0].padEnd(12)} ${String(a.n).padStart(10)}   ${pct(a.lost, a.n)}    ${String(c.n).padStart(10)}   ${pct(c.lost, c.n)}    ${delta.padStart(8)}`,
  )
}
console.log('')

console.log('2b. ⭐ THE DRAW SHE FACES **AT A GIVEN RANK** – the confound-free version of section 1')
console.log('')
console.log('   Section 1 averages over DIFFERENT SETS of entries, so it cannot separate "the draw got')
console.log('   harder" from "she now enters Slams she used to be refused, where she is far down the table".')
console.log('   Split by entrant rank, that confound is gone: a flat row is a draw that did not change.')
console.log('')
console.log('  bucket        slots 0: 1st-match   opp rank      slots 8: 1st-match   opp rank')
for (let b = 0; b < BUCKETS.length; b++) {
  const cells = [armOff, armOn].map((arm) => {
    const rows = arm.entries.filter((e) => bucketOf(e.rank) === b)
    return {
      fc: mean(rows.map((e) => e.firstMatchChance).filter((x) => Number.isFinite(x))),
      or: mean(rows.map((e) => e.opponentRank).filter((x): x is number => x !== null)),
    }
  })
  const fmt = (x: number) => (Number.isFinite(x) ? x.toFixed(1) : '   –')
  console.log(
    `  ${BUCKETS[b][0].padEnd(12)} ${fmt(100 * cells[0].fc).padStart(17)}%   ${fmt(cells[0].or).padStart(8)}   ${fmt(100 * cells[1].fc).padStart(17)}%   ${fmt(cells[1].or).padStart(8)}`,
  )
}
console.log('')

console.log('3. THE MIX – how many entries came from each bucket, which is the denominator')
console.log('')
console.log('  bucket         slots 0    slots 8')
for (let b = 0; b < BUCKETS.length; b++) {
  const a = joined(armOff).filter((e) => bucketOf(e.rank) === b).length
  const c = joined(armOn).filter((e) => bucketOf(e.rank) === b).length
  console.log(`  ${BUCKETS[b][0].padEnd(12)} ${String(a).padStart(9)}  ${String(c).padStart(9)}`)
}
console.log('')

const wcOn = armOn.entries.filter((e) => e.wildCard).length
const wcOff = armOff.entries.filter((e) => e.wildCard).length
console.log('4. HOW MANY OF THOSE ENTRIES WERE WILD CARDS AT ALL')
console.log(`  slots 0   ${wcOff} of ${armOn.entries.length ? armOff.entries.length : 0}   (must be zero – the master switch)`)
console.log(`  slots 8   ${wcOn} of ${armOn.entries.length}`)
console.log('')
{
  // ⭐ THE HEADLINE THE OTHER SECTIONS DECOMPOSE, and it supersedes the 41.8% → 44.3% this wave first
  // reported: that pair was measured through a bench that could not enter a wild card at all.
  const overall = [armOff, armOn].map((arm) => {
    const rows = joined(arm)
    return { n: rows.length, lost: rows.filter((e) => e.finish === last).length }
  })
  console.log('5. THE HEADLINE – first-match loss rate over ALL Slam entries')
  console.log(`  slots 0   ${overall[0].lost}/${overall[0].n} = ${pct(overall[0].lost, overall[0].n)}`)
  console.log(`  slots 8   ${overall[1].lost}/${overall[1].n} = ${pct(overall[1].lost, overall[1].n)}`)
  // Direct standardisation: arm A's per-bucket rates applied to arm B's mix. The gap between this and
  // arm A's own headline is the part the MIX explains; the rest is a real change in difficulty.
  let num = 0
  let den = 0
  for (let b = 0; b < BUCKETS.length; b++) {
    const a = joined(armOff).filter((e) => bucketOf(e.rank) === b)
    const c = joined(armOn).filter((e) => bucketOf(e.rank) === b)
    if (!a.length || !c.length) continue
    num += c.length * (a.filter((e) => e.finish === last).length / a.length)
    den += c.length
  }
  console.log(`  standardised (A's rates, B's mix, shared buckets only)   ${den ? ((100 * num) / den).toFixed(1) : '–'}%   over ${den} entries`)
  console.log('')
}
console.log(`  careers entering a Slam:   slots 0 ${armOff.careersEntering.size}   slots 8 ${armOn.careersEntering.size}`)
console.log(`  ...ever past R1 there:     slots 0 ${armOff.careersPastR1.size}   slots 8 ${armOn.careersPastR1.size}`)
console.log('')
