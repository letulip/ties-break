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

export interface CoachingBudget {
  /** What the roster row she is on costs, weekly. 0 for a self-coached family. */
  committedCents: ComputedRef<number>
  /** ⭐ ROUND-21 #12 – the cap is the week's INCOME, «because that is the money the decision is
   *  actually made against - a reserve pays for one week of anything, a weekly bill has to fit the
   *  week». It comes off the snapshot rather than being RECOVERED from whichever row happens to be
   *  over budget: that was exact only while some row was over, and returned 0 when none was. */
  capCents: ComputedRef<number>
  /** The gap – and it is the figure the market prints beside the words «Coaching budget», which is
   *  why it is the one the rail card shows under that same label. */
  freeCents: ComputedRef<number>
  /** How full the bar is, 0-100. Guarded against a zero cap so an empty career draws an empty bar
   *  rather than dividing by nothing. */
  meterPct: ComputedRef<number>
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
  return { committedCents, capCents, freeCents, meterPct }
}
