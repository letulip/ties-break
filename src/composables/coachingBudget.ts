// ⭐⭐⭐ THE COACHING BUDGET'S THREE FIGURES, DEFINED ONCE – round 36 phase 6.
//
// The meter at the top of the Coach Market has said the same three things since round-21 #12: what
// she pays now, what a week brings in, and the gap between them. This file is that arithmetic, and
// it moved here for one reason only – the owner's rail dashboard now quotes the gap:
//
//     «карточки сквозные, одинаковые, как мини-дашборд живут всегда в вертикальной полоске, т.е. на
//      всех страницах»
//
// ⚠⚠ AND A SECOND COPY OF THIS ARITHMETIC IS A DEFECT THIS APP HAS ALREADY SHIPPED ONCE. The note at
// the top of `HouseholdStrip.vue` records it: «the coaching meter beside it read the current ROSTER
// ROW's price instead of `coachBilling.weeklyCents` and therefore told a self-coached family it was
// committing $0.00 a week while it paid court rent.» Two surfaces quoting one figure that can drift
// apart is worse than not showing the figure at all – so the rail card does not re-derive it, it
// reads the same computed the market's own meter reads. Mutate the body below and BOTH surfaces move.
//
// ⚠ NOTHING IS INVENTED HERE. Every line is the one that stood in `CoachMarketScreen.vue`, carried
// verbatim with its comments, and the screen now reads this instead. The two fields it touches are
// the engine's own:
//   * `coachMarket[i].current` / `.weeklyCents` – the roster row she is actually on;
//   * `coachBilling.weeklyIncomeCents` – «WHAT ARRIVES EVERY WEEK, ALL OF IT» (snapshot.ts), carried
//     by the engine rather than reverse-engineered on a screen, which is round-21 #12's own fix.
import { computed, type ComputedRef } from 'vue'
import { useGameStore } from '../stores/game'

// =================================================================================================
// ⭐⭐⭐ ROUND 42 #23 – «TEAM BUDGET», AND THE TILE LISTS THE WHOLE TEAM
// =================================================================================================
//
// THE OWNER, 15.09: «в coaching budget я просил отражать всех активных специалистов… переименовать в
// Week budget или team budget.»
//
// ⚠ THE FIRST HALF WAS NEVER BUILT, and the audit says so rather than the memory: round 36 review
// #9 («Coaching budget несёт больше информации») was answered with THE METER'S OWN FOUR FIGURES –
// free, the bar, committed, cap – all four of them about the COACH. `useCoachingBudget` below reads
// exactly one row, `coachMarket.find(r => r.current)`, and the masseur and the psychologist have
// always lived somewhere else entirely (`HouseholdStrip`, and the Money screen's `staff` category).
// So a tile about what the family pays its people was showing one of its three people.
//
// ⚠⚠ AND THE ARITHMETIC DOES NOT MOVE – `seats` IS A LISTING, NOT A NEW COMMITTED FIGURE. Round 28
// #8 settled this exact question in the opposite direction and its guard is still standing
// (`tests/component/round28-household-block.test.ts` §4: «the committed figure is still the COACH's
// line and does not silently absorb the masseur»), because the meter answers «can this family afford
// THIS COACH» – round 21 #12's own claim – and the cap it draws against is the very denominator the
// ENGINE cuts every `overBudgetCents` from. A free figure that subtracted the support staff would
// disagree with the engine's own over-budget flags on the cards below it, which is this repo's
// most-repeated defect wearing a feature's clothes. The household's whole week is a DIFFERENT
// question and already has its answer one strip down.
// =================================================================================================

/** ⭐ THE TILE'S NAME, AND IT IS A CONSTANT SO THAT TWO SURFACES CANNOT DRIFT ON IT. The market's
 *  meter and the rail's shortcut both print it; a literal in each template is two spellings waiting
 *  to disagree, and the owner reads this word every week.
 *
 *  ⚠ HIS OWN PROPOSED WORDING («переименовать в Week budget или team budget»), taken as a DRAFT at
 *  his gate – the round's handoff reports it verbatim. It replaces «Coaching budget», which is the
 *  only word on the tile that changes: invariant 4 binds the rest of it, so `/week free`,
 *  `committed` and `weekly cap` are untouched to the character. */
export const TEAM_BUDGET_LABEL = 'Team budget'

/** ⭐ ONE FILLED SEAT ON THE PAYROLL, with what it costs a week. */
export interface TeamSeat {
  /** `coach` · `masseur` · `psychologist` – the seat's own id, for keys and for tests. */
  key: string
  /** What the app already calls this person. ⚠ TAKEN, NOT INVENTED: `Masseur` and `Psychologist` are
   *  `SupportStaffTab`'s own two names for the two seats, verbatim, and `Coach` is the word the
   *  coaches page and every ledger row about him already use. */
  label: string
  /** The weekly bill for that seat, in cents – the engine's own figure in every case. */
  weeklyCents: number
}

export interface CoachingBudget {
  /** What the roster row she is on costs, weekly. 0 for a self-coached family. */
  committedCents: ComputedRef<number>
  /** ⭐ ROUND-21 #12 – the cap is the week's INCOME, «because that is the money the decision is
   *  actually made against - a reserve pays for one week of anything, a weekly bill has to fit the
   *  week». It comes off the snapshot rather than being RECOVERED from whichever row happens to be
   *  over budget: that was exact only while some row was over, and returned 0 when none was. */
  capCents: ComputedRef<number>
  /** The gap – and it is the figure the market prints beside the tile's name, which is why it is the
   *  one the rail card shows under that same label. */
  freeCents: ComputedRef<number>
  /** How full the bar is, 0-100. Guarded against a zero cap so an empty career draws an empty bar
   *  rather than dividing by nothing. */
  meterPct: ComputedRef<number>
  /** ⭐⭐ ROUND 42 #23 – EVERY FILLED SEAT, in payroll order, with what it costs a week. Empty for a
   *  family that has hired nobody, which is every career's first years – and a tile that listed an
   *  empty payroll would be saying «nothing» at length.
   *
   *  ⚠ THE FUTURE SEATS COME FREE, which is the shape of the list rather than a promise: a fourth
   *  salaried seat added to the snapshot joins THIS array and both surfaces grow the row, because
   *  neither of them names a person.
   *
   *  ⚠ EVERY FIGURE IS THE ENGINE'S. The coach's is the roster row's own `weeklyCents` – the same
   *  one `committedCents` above reads, so the tile cannot print two coaches – and the other two are
   *  `masseurSalaryCents` / `psychologistSalaryCents`, which the snapshot's own docs call FLAT
   *  contracts at the chosen rung, so «the card's quote IS the ledger's row». Nothing is summed
   *  here: see the header for why the committed figure and the bar do not move. */
  seats: ComputedRef<TeamSeat[]>
}

export function useCoachingBudget(): CoachingBudget {
  const game = useGameStore()
  const committedCents = computed(
    () => (game.snapshot?.coachMarket ?? []).find((r) => r.current)?.weeklyCents ?? 0,
  )
  const capCents = computed(() => game.snapshot?.coachBilling.weeklyIncomeCents ?? 0)
  const freeCents = computed(() => Math.max(0, capCents.value - committedCents.value))
  const meterPct = computed(() =>
    capCents.value > 0 ? Math.min(100, Math.round((committedCents.value / capCents.value) * 100)) : 0,
  )
  // ⭐⭐ ROUND 42 #23 – «отражать всех активных специалистов». A seat is listed when it is FILLED,
  // asked of the same flags the engine bills through: `current` on the roster row for the coach
  // (`coachId === null` is a self-coached family and owes no coach line), and `masseurHired` /
  // `psychologistHired` for the two salaried seats – the very predicates `householdWeekly` gates
  // their salaries on, so the tile and the household's OUT figure cannot disagree about who is on
  // the payroll. A stood-down seat (college, a booked family week) stays listed for the reason that
  // note gives: it is a standing QUOTE, not a per-week reading, and the coach's own line behaves
  // identically.
  const seats = computed<TeamSeat[]>(() => {
    const snap = game.snapshot
    if (!snap) return []
    const out: TeamSeat[] = []
    if (snap.coachId !== null) out.push({ key: 'coach', label: 'Coach', weeklyCents: committedCents.value })
    if (snap.masseurHired) out.push({ key: 'masseur', label: 'Masseur', weeklyCents: snap.masseurSalaryCents })
    if (snap.psychologistHired) {
      out.push({ key: 'psychologist', label: 'Psychologist', weeklyCents: snap.psychologistSalaryCents })
    }
    return out
  })
  return { committedCents, capCents, freeCents, meterPct, seats }
}
