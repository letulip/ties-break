// CAN ONE RIVAL PLAY TWO TOURNAMENTS IN THE SAME WEEK? The owner, 31.07: «они физически не могут
// сразу везде играть, ведь так?» `selectEntrants` is called once per event with the SAME condition
// map (derived once before the week's brackets run) and no cross-event exclusion, so nothing in the
// code prevents it. This counts how often it actually happens.
//
// ⚠ IT IS NOT AN ADULT-TOUR REGRESSION – IT IS AN OLD DEFECT THE ADULT TOUR MADE VISIBLE, and this
// tool measures BOTH ARMS for exactly that reason. Run junior-only (the 92-event calendar every
// historical bench in this repo was taken on) and the defect is BIGGER, not smaller: the junior
// entrant windows overlap almost completely – j300 [0, 0.25], j60 [0.05, 0.4], j30 [0.12, 0.6],
// national [0.2, 0.7] – so two junior events on the same week draw twice out of the same slice of
// the table. The adult tour DILUTED it, because the age gate it brought splits the pool by age and
// fewer rivals are eligible for two of a week's draws at once.
//
// THE JUNIOR ARM IS SIMULATED BY CADENCE, NOT BY A CHECKOUT: `buildSeason` skips a tier whose
// `everyNWeeks` is 0, so zeroing the three W rungs rebuilds the 92-event junior calendar (26 j30 +
// 17 j60 + 4 j300 + 26 local + 13 regional + 6 national) on this branch's engine. It is not
// byte-identical to the pre-adult-tour repo – `tierPhase` still divides by a nine-rung ladder, so
// the weeks land a little differently – but it is the same calendar SHAPE against the same cohort,
// which is what the comparison is about.
//
// TWO MEASUREMENTS PER ARM, and the difference between them IS the fix (fix/no-double-booking):
//
//   THE DRAWS   – what the per-event calls propose, on each event's own real `seed:aitour:<id>`
//                 stream. This is what the pre-fix engine booked, and it is EXPECTED NOT TO MOVE:
//                 the whole design constraint is that the draws keep happening exactly as they did
//                 (same calls, same order, same count off the same streams), because
//                 `selectEntrants`' draw count is what every pinned stream in the game rests on. A
//                 collision here is the input to the rule, not a bug that survived it.
//   THE LEDGER  – who actually PLAYED. `runAiTournament` writes one result row per entrant of every
//                 draw it runs, so a week's rows ARE the week's appearances; two rows for one player
//                 in one week is a rival who was in two draws. This is the truth, it is what
//                 `rivalConditions` reconstructs a rival's fatigue from, and it is the number that
//                 has to be zero.
//
// It also separates the ONE residual cause from the fixed one. A week is OVER-SUBSCRIBED when the
// calendar schedules more draw slots than the world has rivals; then somebody must play twice and
// no selection rule can help. That is not hypothetical on the nine-rung calendar: season offset 48 –
// the last playable week before the off-season – collects all nine rungs in every season of every
// seed (`claimWeek` pushes each tier's overshooting last event down against the off-season wall),
// which is 248 slots for 199 rivals. Reported separately so the calendar bug is never mistaken for
// the selection bug. The junior arm never over-subscribes: its heaviest week wants 136 of 199.
import { createWorld, tickWeek, KID_ID } from '../src/engine/world'
import { selectEntrants } from '../src/engine/season/tournament'
import { computeRanking } from '../src/engine/season/ranking'
import { rivalConditions } from '../src/engine/season/rival'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { rngFromSeed } from '../src/engine/rng'
import type { TierId } from '../src/engine/season/types'

const SEEDS = 6
const WEEKS = 156
const ADULT: readonly TierId[] = ['w15', 'w35', 'w100']

function measure(label: string): void {
  let weeksWithTwo = 0, collisions = 0, playerWeeks = 0, doubled = 0
  let ledgerWeeks = 0, ledgerCollisions = 0, ledgerDoubled = 0
  let overWeeks = 0, overShortfall = 0, overDoubled = 0
  let events = 0
  for (let s = 0; s < SEEDS; s++) {
    const seed = `dbl-${s}`
    const world = createWorld(seed, { ...DEFAULT_PROFILE })
    const rng = rngFromSeed(`${seed}:b`)
    for (let w = 0; w < WEEKS; w++) {
      tickWeek(world, rng)
      const scheduled = world.season.filter((e) => e.week === world.week)
      events += scheduled.length
      if (scheduled.length < 2) continue
      weeksWithTwo++
      const ids = world.cohort.map((p) => p.id)
      // ⚠ THE LEDGER AS IT WAS BEFORE THIS WEEK RESOLVED. `world.results` already carries this week's
      // own rows by the time we look, and those rows are exactly what the brackets did NOT see when
      // they picked their fields (tickWeek derives `aiRanking` and `rivalFatigue` above step 4). Read
      // without the filter, this replica reconstructs a DIFFERENT, wronger field – the same class of
      // bug tests/rivals.test.ts C3 and tests/rival-fatigue.test.ts' helper were each caught by.
      const prior = world.results.filter((r) => r.week < world.week && r.playerId !== KID_ID)
      const ranking = computeRanking(prior, world.week, ids)
      const cond = rivalConditions(prior, world.week)
      const seen = new Map<string, number>()
      for (const e of scheduled) {
        // the event's OWN stream, so this is exactly what the pre-fix engine would have booked
        const r = rngFromSeed(`${world.seed}:aitour:${e.id}`)
        for (const p of selectEntrants(e, world.cohort, ranking, r, cond)) {
          seen.set(p.id, (seen.get(p.id) ?? 0) + 1)
        }
      }
      for (const [, n] of seen) { playerWeeks++; if (n > 1) { doubled++; collisions += n - 1 } }

      // ...and what the engine actually played, off its own ledger.
      const played = new Map<string, number>()
      for (const r of world.results) {
        if (r.week !== world.week || r.playerId === KID_ID) continue
        played.set(r.playerId, (played.get(r.playerId) ?? 0) + 1)
      }
      let weekDoubled = 0
      for (const [, n] of played) { ledgerWeeks++; if (n > 1) { ledgerDoubled++; ledgerCollisions += n - 1; weekDoubled++ } }
      const slots = scheduled.reduce((a, e) => a + TIERS[e.tier].drawSize, 0)
      if (slots > world.cohort.length) {
        overWeeks++
        overShortfall += slots - world.cohort.length
        overDoubled += weekDoubled
      }
    }
  }
  const pct = (a: number, b: number) => (b === 0 ? '—' : `${((a / b) * 100).toFixed(1)}%`)
  console.log('')
  console.log(`══ ${label} ══  ${(events / (SEEDS * (WEEKS / 52))).toFixed(0)} events a season · weeks with 2+ events: ${weeksWithTwo}`)
  console.log(`  THE DRAWS   ${playerWeeks} player-weeks · DOUBLE-BOOKED ${doubled} (${pct(doubled, playerWeeks)}) · ${collisions} phantom`)
  console.log(`  THE LEDGER  ${ledgerWeeks} player-weeks · DOUBLE-BOOKED ${ledgerDoubled} (${pct(ledgerDoubled, ledgerWeeks)}) · ${ledgerCollisions} phantom`)
  console.log(`  over-subscribed weeks: ${overWeeks} · slots with nobody to fill them: ${overShortfall} · doubled on them: ${overDoubled}`)
  console.log(`  ⇒ DOUBLE-BOOKED ON FILLABLE WEEKS: ${ledgerDoubled - overDoubled} (${pct(ledgerDoubled - overDoubled, ledgerWeeks)})`)
}

measure('NINE RUNGS (the shipped calendar, junior + adult)')

// The junior-only arm. `buildSeason` skips a tier with cadence 0, so this rebuilds the 92-event
// calendar every historical bench in this repo was measured on.
const cadences = ADULT.map((t) => TIERS[t].everyNWeeks)
for (const t of ADULT) TIERS[t].everyNWeeks = 0
try {
  measure('SIX RUNGS (junior-only – the calendar every old bench was taken on)')
} finally {
  ADULT.forEach((t, i) => (TIERS[t].everyNWeeks = cadences[i]))
}
void TIER_LADDER
