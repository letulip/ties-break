// FINISH AND STAGE LABELS: how far she got, said the way a draw sheet says it.
//
// ⚠ DEPENDENCY DIRECTION. Pure functions of (finish, tier, round, drawSize) — no world, no RNG, no
// import from world.ts at all. This module is a leaf: it cannot create a cycle by construction.
import { TIERS } from '../season/calendar'
import type { TierId } from '../season/types'

// --- finish / stage labels ---------------------------------------------------
// finish index = rounds - round (0 = champion). Higher = earlier exit.
// Exported for R10-9's history table, which renders a season's stored `bestFinish` index with the
// SAME wording the tournament finale and the wrap-up milestone use.
export function finishLabel(finish: number): string {
  switch (finish) {
    case 0:
      return 'Champion'
    case 1:
      return 'Runner-up'
    case 2:
      return 'Semifinalist'
    case 3:
      return 'Quarterfinalist'
    default:
      return `Round of ${2 ** finish}`
  }
}

/** WHAT A FINISH AT `tier` PAYS, in whole cents. 0 on every rung with no `prizeCents` table, which
 *  is every domestic and junior rung and always will be – juniors pay to play.
 *
 *  ⚠ THE SIGNATURE IS THE SPEC. It takes a tier and a finish and NOTHING ELSE: no world, no profile,
 *  no `FamilyBackground`. That is deliberate and it is the enforcement mechanism for
 *  docs/specs/adult-tour-and-endings.md §3's third rule – prize money must not scale with the wealth
 *  corridor – because a function that cannot see the family cannot price by it. Compare
 *  `travelCostFor`, which takes the world precisely so it CAN. Exported so the bench and the tests
 *  can ask directly, the way `localSponsorCents` is.
 *
 *  Pure arithmetic on a table: zero draws on any stream, so the frozen MAIN capture cannot see it. */
export function prizeCentsFor(tier: TierId, finish: number): number {
  return TIERS[tier].prizeCents?.[finish] ?? 0
}

/** ⭐⭐ IS THIS ROUND THE FINAL – the one arithmetic, named (T4.4 · E-05, 27.09).
 *
 *  ⚠⚠ IT EXISTS SO THAT NOTHING COMPARES THE WORD. `TournamentFlow` asked
 *  `pending.roundLabel === 'Final'` and hung the celebration cue and the viewer's `final-match` prop
 *  on it – a behaviour keyed off `stageLabel`'s display vocabulary, which CLAUDE.md invariant 4 makes
 *  the owner's to rename at any time, and its corollary says a rename is the one diff no test catches.
 *  The snapshot projects the answer now (`PendingView.isFinal`), and the screen reads it.
 *
 *  ⚠ AND `stageLabel` CALLS IT rather than keeping its own `remaining === 2`, which is the whole point:
 *  a predicate beside the namer that re-spelled the same division would be the parity class one layer
 *  further down – two spellings of one arithmetic with a display string between them. One spelling, two
 *  readers, and `tests/principles-e05-finish-numbers.test.ts` §2 walks every shipped draw size to say
 *  the word and the flag cannot disagree. */
export function isFinalStage(round: number, drawSize: number): boolean {
  return drawSize / 2 ** round === 2
}

// Stage name of a match played in the given round of a draw of `drawSize`.
export function stageLabel(round: number, drawSize: number): string {
  const remaining = drawSize / 2 ** round
  if (isFinalStage(round, drawSize)) return 'Final'
  if (remaining === 4) return 'Semifinal'
  if (remaining === 8) return 'Quarterfinal'
  return `Round of ${remaining}`
}
