// =================================================================================================
// ⭐⭐ ROUND 42 #20 (RULED B) – THE LEAVE-ANYWAY GUARD ON THE WEEK PRESS
// =================================================================================================
//
// The owner: «Когда ребенок "хочет поговорить" надо ещё кнопку proceed дизаблить, пока не
// поговорили» – and the ruling split the two beat kinds. BLOCKING beats grey the button outright
// (composables/weekAction.ts, beside the knock's own branch). The SOFT chip («she came by with
// something small») is missable BY DESIGN – a 3-week TTL, and the missed visit is the price of not
// being home – so hard-blocking it would delete that meaning. Ruled B, 15.09: a SOFT GUARD – the
// FIRST Proceed press while the chip is live asks one line and does not tick; the second press
// leaves. «She can be missed» stays true, at the cost of one honest tap.
//
// ⚠ ONE GUARD FOR EVERY PROJECTION OF THE PRESS. The advance button renders on Home (App.vue's bar)
// and on the Calendar (its own CTA, which runs the day-cross sweep BEFORE handing the press back to
// the shell) – and the calendar's ordering is why this cannot live inside `playWeek` alone: a press
// refused AFTER the sweep would leave a fully crossed-out grid over a week that never moved. So the
// guard is module state with two askers – `playWeek` asks it before the detour and before any tick,
// and the calendar's `runWeek` asks it before the sweep even starts – the same one-shot module-state
// shape `holdPostAdvanceNav` (composables/weekRecap.ts) already uses for the same cross-surface
// problem.
//
// ⚠ THE ASK IS PER WEEK, NOT PER CHIP. The key is career:week, so a press chain that spans the
// detour (Home press -> calendar mounts -> sweep -> hand-back) consumes ONE ask, and the next week
// of a still-live chip asks again – three honest asks over the chip's whole window, each one tap.
//
// ⚠ NOTHING HERE TOUCHES THE ENGINE. The engine refuses nothing for a soft row (that is what «soft»
// means – see `SoftBeatInvite` in shared/protocol/narrative.ts); this is purely the surface asking
// «did you mean to leave her?» before it spends the press.
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'

/** ⭐ DRAFT (round 42 #20, ruled B – the ledger carries this line verbatim as the register). The one
 *  sentence the first press shows. Declared ONCE and read by both surfaces (App.vue's bar note and
 *  CalendarScreen's `.cal-go-note` slot), because a string declared twice is a string that can
 *  drift in one copy (invariant 4). Short dash, per the house copy rule. */
export const SOFT_LEAVE_LINE = 'She wanted a minute – leave anyway?'

/** The career:week the ask was already spent on, or null. Module state, like
 *  `postAdvanceNavHeld` – one press, however many surfaces project the button. */
const askedOn = ref<string | null>(null)

function keyOf(snapshot: { careerId: string; week: number } | null): string | null {
  return snapshot ? `${snapshot.careerId}:${snapshot.week}` : null
}

/** The guard, as the two press paths and the two note slots read it. */
export function useSoftLeaveGuard() {
  const game = useGameStore()
  /** Is the chip live this week? The engine's own selector, off the snapshot – never re-derived. */
  const live = computed(() => Boolean(game.snapshot?.softBeat))
  /** Is the one-line ask on screen right now? True from the consumed first press until the press
   *  that leaves (the key changes with the week) or the chip is answered (live goes false). */
  const asking = computed(() => live.value && askedOn.value !== null && askedOn.value === keyOf(game.snapshot))
  /** TAKE THE PRESS: true = it may spend the week, false = it was consumed to ask the line.
   *  Idempotent within a week – the second press (and the detour's hand-back re-entry, which is the
   *  same logical press) passes. */
  function pass(): boolean {
    if (!live.value) return true
    const key = keyOf(game.snapshot)
    if (key === null || askedOn.value === key) return true
    askedOn.value = key
    return false
  }
  return { live, asking, pass }
}

/** Test hygiene only: module state survives between mounts by design, so suites put it back. */
export function resetSoftLeaveGuard(): void {
  askedOn.value = null
}
