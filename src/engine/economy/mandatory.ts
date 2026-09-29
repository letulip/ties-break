// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/mandatory.md#the-mandatory-block

import type { TierId } from '../season/types'

// THE MANDATORY REGIME (W3-ACT2, act2-pro-tour.md §6 — the owner's spec as canon) – «10
// штрафных очков за 52 недели -> отстранение на 4 недели. Источники: пропуск обязательного
// турнира, поздний отказ, неявка. Обязательные турниры только для топ-50: 4 Шлема, 1000-ки,
// шесть 500-к.» Verbatim, and every number below is either that sentence or the one adaptation
// the sentence itself authorises ("counts adapted to our calendar grid in act 3").
//
// ⚠⚠ mandatory: THE TOUR PUNISHES; THE GAME NEVER DOES.
// owner (mandatory): «мы ни за что не наказываем»
// → docs/notes/economy/mandatory.md#mandatory
export const mandatory = {
  /** WHO IS BOUND. The spec's own number: top-50 only, and it is the real regime's own gate.
   *  Read against the MERGED W table, which is the table these rungs' acceptance lists are in. */
  maxRank: 50,
  /** THE PER-EVENT OBLIGATIONS: every Slam and every 1000, exactly as the spec names them. Both
   *  families are ANCHORED (`TierDef.anchorWeeks`), which is what makes an obligation announceable
   *  a year ahead — a player can see in January which weeks she owes the tour. */
  perEventTiers: ['slam', 'wta1000'] as readonly TierId[],
  /** ...AND THE 500s ARE A QUOTA, WHICH IS THE REAL RULE'S OWN SHAPE. The tour does not name six
   *  particular 500s; it asks a top-50 player to COMMIT to six of them and lets her pick. So this
   *  is checked once, at the season boundary, against how many she actually played — which is
   *  also the only reading that leaves her a decision (six of our ten) rather than a timetable. */
  quotaTier: 'wta500' as TierId,
  /** SIX, THE SPEC'S OWN NUMBER, against a pool of ten. The real regime is six of ~sixteen; our
   *  grid holds ten 500s (`TIERS.wta500.anchorWeeks`), so keeping six preserves the NUMBER the
   *  owner wrote while the ratio tightens — the adaptation his own parenthesis authorises, stated
   *  rather than smuggled. If the measured season cannot carry it, that is a finding for him and
   *  not a knob to turn quietly: the derivation-faithful alternative is 4 (six of sixteen scaled
   *  to ten), and it is written down here so the choice is visible. */
  quota: 6,
  /** WHAT EACH SOURCE COSTS, and they are ordered by how much the tournament lost by it — which is
   *  the only ordering that is about the TOUR rather than about her. Skipping an event nobody was
   *  promised she would play costs least; withdrawing after the list closed leaves a hole in a
   *  published draw; not turning up at all leaves the hole AND an empty court. */
  skipPoints: 2,
  lateWithdrawalPoints: 3,
  noShowPoints: 4,
  /** ...and one point per event of the 500 quota she fell short by, settled once a season. It is
   *  the gentlest source on purpose: it is the one obligation she was allowed to plan around. */
  quotaShortfallPoints: 1,
  /** THE SPEC'S OWN PAIR: ten points inside a rolling 52 weeks, and a four-week suspension. */
  suspensionAt: 10,
  suspensionWeeks: 4,
  /** The rolling window the ten are counted in — the same 52 every other rolling record in this
   *  game keeps (the ranking window, the entry-letter prune, the results ledger). */
  windowWeeks: 52,
} as const
