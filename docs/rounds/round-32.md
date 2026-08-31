---
type: round
status: current
area: rounds
canonical: false
last-reviewed: 2026-08-31
---

# Round 32 – from his play on the merged round-31 build (31.08.2026)

Reported after he merged PR #117 and played it. Both items diagnosed before filing; neither was
guessed at.

- [ ] **1. «в игре заметил, что у нас в межсезонье на shooting week самих shooting в календаре и
  нет»** – a booked shoot lands in an off-season week and the calendar draws that week empty.
  **build**.

  ⭐ THE ENGINE IS RIGHT AND THE CALENDAR IS BLIND – this is a surfacing gap, not a missing feature.
  `WINTER_SHOOT_WEEKS = OFF_SEASON_WEEKS + 3` (`engine/offers.ts:1743`), so the shoot season is the
  last `OFF_SEASON_WEEKS + 3` weeks of the year and **contains the whole off-season by
  construction**. That is deliberate and true to life: an athlete shoots her sponsors' campaigns in
  the winter, which is exactly when she is not playing.

  ⚠ THE DEFECT IS IN `src/composables/weekDays.ts`, AND IT IS AN ORDER-OF-BRANCHES BUG. The week
  builder has five branches; branch **4, "THE CALENDAR'S OWN BLACKOUTS"** (line 717), returns for an
  off-season week with `days: uniform('off', null, 'Off')` and the `shoot: null` it inherited from
  `base`. The shoot is only ever filled in on branch **5, the ordinary training week** (line 750),
  where `shootDays` is computed at line 770 – and an off-season week has already returned by then.
  `base`'s own comment says it out loud: «Null here and filled in on the ordinary-week branch alone».

  ⚠ `weekGrid.ts` is NOT the defect and needs no new shape: `WEEK_SHAPES.shoot` and `SHOOT_DAY`
  (line 960) already exist and already draw a call time and a shoot block. Nothing reaches them
  because no off-season day is ever handed the `shoot` kind.

  ⚠ NOT CONFIRMED ON A SAVE. His w933 export carries **0 booked shoot deals**, so the report could
  not be reproduced from it; the evidence above is the code path, and he read the defect off a live
  career the save predates. A fix must therefore build its own fixture rather than lean on his.

- [ ] **2. «на result of the week внизу под самими результатами висит кусок THIS WEEK где предстоящий
  турнир описан, как на экране самого турнира – надо турнир с result of the week всё-таки убрать»** –
  the week's results and the upcoming tournament are on screen together. **build**.

  ⚠⚠ FOURTH PASS OVER THIS PAIR OF BLOCKS, and the previous three were all mine: round 29 part two
  grew the recap, round 30 #1 cut it back, round 31 #1 moved the ORDER on one arrival. What none of
  them did is ask whether both belong on screen at once, which is what he is now saying they do not.

  `ThisWeekScreen.vue` renders `<NextTournamentPanel v-if="nearestEntered">` at line 253
  **unconditionally on both arrivals**, while `WeekRecapCard` renders above it (line 228) on a story
  arrival and below it (line 261) on a tournament arrival. So a week advanced normally shows the
  results and then the whole tournament plate underneath.

  ⭐ THE SHAPE HE IS ASKING FOR, and it keeps round 31 #1 intact: the tournament panel appears when
  the screen is NOT showing the week's story – `nearestEntered && (!showRecap || tournamentFirst)`.
  Results view shows results; the × that already dismisses the story then reveals what is next; and
  an arrival through Home's Next-tournament plate still opens on the tournament with the story
  below it, exactly as he asked in round 31.
