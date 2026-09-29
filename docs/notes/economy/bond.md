---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The bond block

The comment essays that stood above the `bond` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `bond.regressionPerWeek`

```ts
    /** THE MEMORY PROPERTY. Deltas land immediately and then regress toward `start` at this rate and
     *  nothing else moves it: a −25 season heals in ~50 weeks, which is recoverability («one bad click
     *  at fifteen» must not ruin a ten-season career) without making a decision weightless inside the
     *  season it was taken in.
     *
     *  ⚠⚠ IT IS NOT A CONTINUOUS DIAL, AND IT LOOKS LIKE ONE. Every bond write goes through
     *  `roundToStep` onto the `step` grid above, so a week's regression is quantised before it lands:
     *  measured through the engine's own weekly rule, 0.5 / 0.4 / 0.3 / 0.25 ALL move exactly 0.5,
     *  and 0.24 / 0.2 / 0.1 ALL move exactly 0.00 – a −25 season then never heals at all, at any
     *  horizon, rather than healing slowly. The cliff sits at half a step. So this constant has two
     *  reachable behaviours and no gradient between them, and the wave-1 sweep that found this was
     *  reading a dial that had already stopped turning three rows earlier.
     *
     *  The rule that follows, pinned in `tests/spirit.test.ts`: **a positive multiple of `step`.**
     *  Anything else is a value whose measured behaviour is not the value written here. If a later
     *  wave wants slower healing than half a point a week, the honest move is a finer `step` or a
     *  regression that carries its remainder – not a smaller number here.
     *  ⚠ AND THE FIRST OF THOSE TWO IS A WORKING MOVE SINCE 26.09 (C-05): `roundToStep` reads `step`,
     *  so a finer grid changes every bond write. It was not before – `roundHalf` spelled the 0.5 –
     *  which made this paragraph an instruction to turn a dial that was not wired to anything. */
```

## `bond.delta.beatBacked`

```ts
      /** ⭐⭐ v73 – THE LIFE BEAT'S OWN THREE (the private life, wave 2; build plan §3, «his reaction
       *  options – responses, never her choices»). What he SAYS when she has told him what she
       *  wants: back it, press the other way, or listen and say nothing.
       *
       *  ⚠⚠ THE PRICE LIST IS UNIVERSAL – who-she-is §3's fence, verbatim: «The `bond` delta table
       *  does not vary by temperament ... The situations differ; the arithmetic of care does not.»
       *  So there is one row per ANSWER here and never a row per girl, and that is also what keeps
       *  the table benchable.
       *
       *  ⚠ AND SAYING NOTHING IS EXACTLY ZERO, not a small negative. Listening is a real answer –
       *  the beat's dialog has no X precisely so that it can be one – and pricing silence as a small
       *  failure would make it the option a player learns to avoid, which is the opposite of what a
       *  parent who does not know what to say is doing. */
```

## `bond.delta.metWarm`

```ts
      /** ⭐⭐ v74 (the private life, wave 3 – T6/T7) – WHAT HE SAYS THE WEEK HE IS TOLD THERE IS
       *  SOMEONE. Four answers, and not one of them is hers: the wave-3 brief §4's «'met' bond
       *  deltas» row, verbatim – warm +2 · wary 0 · intrusive −3 · silent −1.
       *
       *  ⚠⚠ THE PRICE LIST IS UNIVERSAL – who-she-is §3's fence, and the same sentence the three
       *  rows above carry: «The `bond` delta table does not vary by temperament ... The situations
       *  differ; the arithmetic of care does not.» One row per ANSWER, never a row per girl.
       *
       *  ⚠ SILENCE IS PRICED HERE AND IS EXACTLY ZERO AT THE FORK, and the difference is the beat
       *  and not an inconsistency. At the fork she asked him a question and listening IS an answer
       *  to it (`beatListened`'s own note). Here she handed him a piece of her life and said nothing
       *  was being asked of him – saying nothing back is the one reply that leaves her holding it
       *  alone, so it costs a little.
       *
       *  ⚠ THE FOUR ROWS BELOW ARE THE TABLE AN **`open`** GIRL IS READ BY, and the two after them
       *  are the whole of the difference a `private` one makes (T7, 11.09). T6's own note here said
       *  the flip «is not wired here»; it is now, and the note is CORRECTED rather than left
       *  standing, because a comment that still says «not yet» beside the wiring is the one kind of
       *  stale a constants file cannot carry. */
```

## `bond.delta.metWarmPrivate`

```ts
      /** ⭐⭐⭐ v74 T7 – THE WANTS FLIP, AND IT IS TWO ROWS RATHER THAN A SECOND TABLE. A girl whose
       *  drawn `wants` is `'private'` reads silence as the kindness and warmth as the thing that
       *  puts it in the room: silent **+2**, warm **−1** (brief §4's «flip» column, verbatim).
       *
       *  ⚠⚠ `wary` AND `meet` ARE ABSENT ON PURPOSE AND THE ABSENCE IS LOAD-BEARING. The flip is an
       *  OVERLAY on the four above (`world/lifeBeat.ts`'s `MET_BOND_PRIVATE`), so the two rows it
       *  does not name keep the SAME number in both readings – which is what guarantees `'met'`
       *  still has a bond-NEUTRAL answer (`wary`, 0) whatever she wants. Forty tools, the e2e
       *  fixture generator and `tests/helpers/career.ts` drain beats through that zero
       *  (`tools/_lifeBeats.ts`), and a flip that copied the table instead of overlaying it could
       *  drift `wary` off zero and move every bond number those benches measure.
       *
       *  ⚠⚠ AND IT IS STILL NOT A ROW PER GIRL – the fence above holds. What varies is not WHO she
       *  is (temperament never reaches this table) but what she ASKED FOR, which is a fact she put
       *  on the record herself. The arithmetic of care is the same; the request is hers.
       *
       *  ⚠ NOTHING PRINTS EITHER NUMBER. The read reaches the player through the feed line's and
       *  the card's WORDING alone – no meter, no badge, no label (the birthday-ask scene
       *  generalised, brief §2 T7). */
```

## `bond.delta.endedMatched`

```ts
      /** ⭐⭐⭐ v75 (the private life, wave 4 – T4) – WHAT HE SAYS THE WEEK HE LEARNS IT IS OVER.
       *  Four answers – give her space · keep her company · try to fix it · blame – priced from the
       *  build plan §5's own row, verbatim: «match +3, mismatch −3, fix-it −1, blame −4 always (some
       *  things are wrong regardless of what she wanted)».
       *
       *  ⚠⚠ THE FIRST TWO ARE ONE PAIR READ TWO WAYS AND THAT IS WHY THEY ARE TWO ROWS RATHER THAN
       *  FOUR. Which of «space» and «company» is the match is HER read, drawn on
       *  `seed:life:ends:<endedWeek>:react`; the answer that matches costs `endedMatched` and the
       *  other `endedMismatched`, whichever way round the draw came out. So there is one price for
       *  «you gave her what she wanted» and one for «you did not», and the flip is an overlay on the
       *  base list (`world/lifeBeat.ts`'s `ENDED_BOND_COMPANY`) exactly as `'met'`'s is – never a
       *  second table, so the two rows the flip does not name keep the SAME number in both readings.
       *
       *  ⚠⚠ AND `endedBlame` IS THE ONE ROW WITH NO READING AT ALL. «Some things are wrong
       *  regardless of what she wanted» is the ruling's own sentence: blaming her, or the person who
       *  is gone, costs −4 whichever way her read came out. `endedFixIt` is read-independent too, and
       *  that is load-bearing beyond the design – it is the answer `tools/_lifeBeats.ts` drains this
       *  kind with, and a drain answer whose price moved with a fact the harness is not tracking is
       *  refused by `drainCostOf` rather than averaged.
       *
       *  ⚠ THE FENCE HOLDS HERE TOO (who-she-is §3): one row per ANSWER, never a row per girl.
       *  Temperament does not reach this table – what varies is what she asked for, which is a fact
       *  she put on the record herself.
       *
       *  ⚠ NOTHING PRINTS ANY OF THE FOUR. The read reaches the player through the card's heading
       *  and the told-late feed line's WORDING and through nothing else – no meter, no badge, no
       *  label, no marked option (the `'met'` flip's own law, generalised). */
```
