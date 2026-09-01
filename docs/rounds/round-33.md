---
type: round
status: current
area: rounds
canonical: false
last-reviewed: 2026-09-01
---

# Round 33 – the tidy-up wave, and the screen that was never two screens

- [x] **Three August measurements landed.** `measure/first-round-exit`, `measure/fortnight-bisect`
  and `measure/potential-band` each carried a spec and a tool and never reached main – exactly the
  class the round-29 audit exists to catch. ⚠ Their BRANCHES were not mergeable: they predate round
  30's split of `coach-travel-edge` into three files and would have dragged the old test back, so
  only the six files that exist nowhere else were taken.

- [ ] **1. «опять экран next tournament содержит next week – объясни мне пожалуйста, почему вообще
  получилось так, что эти два на одном экране постоянно оказываются? это разные экраны, нужны для
  разных вещей, мне кажется у них ничего общего нет. На экране family budget ведь нет ничего такого.
  На экране конца недели теперь нет информации о next tournament и это правильно.»** **build**.

  ⭐⭐ THE ANSWER TO HIS QUESTION IS STRUCTURAL, AND IT IS WHY FOUR ROUNDS FAILED TO FIX IT: **there
  is no tournament screen.** `src/components/screens/` holds ten screens and none of them is one.
  Home's plate emits `navigate → 'week:tournament'`; `App.vue:214` turns that into
  `openWeek('tournament')`, which sets `tab = 'week'` and hands `ThisWeekScreen` an `entry` prop.
  **The "Next tournament screen" IS the This Week screen in a different mode.**

  ⚠ So rounds 29, 30, 31 and 32 were all rearranging blocks INSIDE one screen while he described
  two. Round 31 #1 moved the order on that arrival; round 32 #2 took the tournament off the results
  view. Neither could give him what he is asking for, because the thing he is asking for does not
  exist as a screen.

  ⭐ AND HIS OWN COMPARISON IS THE PROOF: the family budget has `MoneyScreen.vue` and its own tab.
  The tournament never got either.

  FIX: on the `entry: 'tournament'` arrival the screen shows the TOURNAMENT and none of the week's
  own furniture. ⚠ The other arrival is untouched – round 32 #2's «results view shows results» must
  stay exactly as he approved it, and the mutation that proves it is a re-run of that round's guard.
