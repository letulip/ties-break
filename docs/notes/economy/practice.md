---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The practice block

The comment essays that stood above the `practice` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `practice`

```ts
  // --- Season planner: practice matches (spec §4) -----------------------------------------
  // A friendly on an empty week: court rental $30-80 × corridor off `seed:practice:week`, plus
  // an OPTIONAL coach. Effect: condition drain
  // max(1, local SCORELINE drain − 1) - the tier surcharge is subtracted out by name, see
  // resolvePractice - ZERO ranking points, and the week keeps the base
  // recovery but FORFEITS the rest-slider bonus (she played, even if friendly).
  // GUARDRAIL (fatigue-bench finding 25.07: practising every week is self-destructive – mean
  // condition 47, 41-44% of weeks under 40): booking below `cautionCondition`, or a long enough
  // run of consecutive practice weeks, raises a CAUTION. It never blocks – the owner's philosophy
  // is "the parent may push, the game warns".
  //
  // WAVE-2 RETUNE (fatigue bench 26.07): the streak arm used to fire on the 3rd week no matter
  // how fresh she was – careful pushed through 8-11 cautions/season at condition 92, and a warning
  // nobody believes is worse than none (it trains the player to click through the real ones). The
  // arm is now gated on ACTUAL strain: 3 in a row only warns below `cautionStreakCondition`, while
  // `cautionStreakAlways` in a row warns at any condition (a run that long IS strain). The
  // low-condition arm (`cautionCondition`) is untouched.
```

## `practice.coachHours`

```ts
    // ⚠ `coachSessionCents: [120_00, 250_00]` IS GONE (Round 3), and it is the owner's ruling that
    // retired it: «справедливо будет завязать на стоимость выбранного тренера или best-fit если не
    // выбран». The friendly's optional coach is HER coach, so it costs a share of HIS OWN rate -
    // there is no second, unrelated price for a coaching hour any more. The flat band had drifted
    // badly enough to be worth saying out loud: at $120-250 a session it sat ABOVE the Elite tier's
    // own $96-144/h, so a practice friendly was charging more for an hour of coaching than the most
    // expensive coach in the game charges for one.
    //
    // A FRIENDLY IS A MATCH, NOT A LESSON, so it books more of him than a training hour does. Two
    // hours is a warm-up and a match; `coachShare` then halves it, because the other half is paid by
    // the opponent's family (the original framing, unchanged).
```
