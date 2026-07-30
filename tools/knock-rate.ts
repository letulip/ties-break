// THE KNOCK BENCH (W4) - `npm run bench:knock`. Same shape as the econ / fatigue / radar benches: a
// measurement harness, run by hand, never part of a gate.
//
// TWO QUESTIONS, and they are the two the design has to answer with numbers rather than prose:
//
//   HOW OFTEN IS HE ASKED, per plan? The knock exists so an ordinary week is worth playing; asked too
//   rarely it is a curiosity, asked too often it is a treadmill and the cooldown is doing all the work.
//   Measured 30.07 at 8 careers x 3 seasons:
//       light    ~0.5 knocks/season   (1 per ~110 weeks)
//       balanced ~3                   (1 per ~17)
//       grind    ~4                   (1 per ~13)
//   That is the whole point of the signed `KNOCK_TRAIN_SLOPE` term: the planner decides how hard a
//   question the game asks.
//
//   WHAT DOES PUSHING COST? The anti-farming claim is that the push branch is negative-expectation, and
//   this is where it is checked rather than asserted. Same run:
//       always REST -> 0.33 injuries/season at every plan
//       always PUSH -> 0.63 at balanced and grind (0.38 at light, which sees almost no knocks)
//   i.e. sending her back out every time roughly DOUBLES her injury rate, and 7 of those 24
//   career-seasons had a knock break down on the exact part he had ignored.
import { createWorld, tickWeek, decideKnock, pendingKnock } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { WEEK_PLAN_PRESETS } from '../src/shared/protocol'

const SEASONS = 3
const CAREERS = 8

for (const planName of ['light', 'balanced', 'grind'] as const) {
  for (const choice of ['rest', 'push'] as const) {
    let knocks = 0, weeks = 0, injuries = 0, brokeDown = 0
    for (let s = 0; s < CAREERS; s++) {
      const w = createWorld(`rate-${s}`)
      const rng = rngFromSeed(w.seed)
      for (let i = 0; i < 52 * SEASONS; i++) {
        w.plan = { ...WEEK_PLAN_PRESETS[planName] }
        tickWeek(w, rng)
        weeks++
        if (pendingKnock(w)) { knocks++; decideKnock(w, choice) }
        if (w.injury && w.injury.sinceWeek === w.week) injuries++
      }
      brokeDown += w.knockHistory.filter((k) => k.brokeDown).length
    }
    console.log(
      `${planName.padEnd(9)} ${choice.padEnd(5)}`,
      `knocks/season ${(knocks / CAREERS / SEASONS).toFixed(1)}`.padEnd(20),
      `1 per ${(weeks / knocks).toFixed(1)} wks`.padEnd(16),
      `injuries/season ${(injuries / CAREERS / SEASONS).toFixed(2)}`.padEnd(24),
      `broke down ${brokeDown}`,
    )
  }
}
