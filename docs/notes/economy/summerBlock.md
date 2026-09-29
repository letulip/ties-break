---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The summerBlock block

The comment essays that stood above the `summerBlock` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `summerBlock`

```ts
  // =================================================================================================
  // THE SUMMER TRAINING BLOCK (W3-SUMMER) - nine weeks with no school in them
  // =================================================================================================
  //
  // THE OWNER'S RULING, and it is a correction of an objection rather than a fresh idea: «я играл и
  // брал отпуска между турнирами пропуская и коучинговые сессии в том числе, если мы летом сделаем
  // реальную нагрузку с 2 тренировками в день я не вижу ничего плохого, это как раз частично
  // компенсирует недостаток тренерских недель в другие периоды, т.е. сделает прокачку эффективнее и
  // более полной.»
  //
  // ⚠ SO IT IS VOLUME, NOT A BETTER MULTIPLIER, and that distinction is the whole design. She is not
  // learning FASTER in the holidays - she is on court twice a day instead of once, because there is
  // no school, and a fuller week develops more and costs more. That is why it lands on `growWeek`'s
  // `loadFactor` (the knob whose own note says it is "HOW MUCH OF THE WEEK SHE ACTUALLY TRAINED") and
  // on the condition accumulator, and not on `trainFactor`, the coach or the luck draw.
  //
  // ⚠ AND IT MUST NOT BE MANDATORY. A family that books its holiday in the summer LOSES the block -
  // `summerBlockWeek` refuses on a vacation week, on a tournament week, on a layoff and on a rested
  // knock - and that is a TRADE, not a punishment: the vacation's own condition package is paid
  // instead, and the weeks she spends racing earn the match bonus instead. The choice is the feature.
  //
  // SIZING, AND IT IS MEASURED (tools/summer-bench.ts, 24 careers x 4 seasons, 14->18):
  //
  //   TRAINING-ONLY career   9.0 block weeks a season   +0.35 skill points over the career
  //   RACING career          3.9 block weeks a season   +0.18 skill points over the career
  //
  // The racing row is the design working rather than the design failing: most of her summer is a
  // tournament, and `summerBlockWeek` stands down on those weeks because a competition week already
  // has its own bonus and its own bill. So the block is worth most to the girl who is NOT travelling,
  // which is exactly «частично компенсирует недостаток тренерских недель» read literally. Against the
  // yardstick it is a help and never the lever: one year of junior development is 2.4 skill points
  // and the whole coach ladder is 2.26, so a full career of summers is a seventh of a coach.
  //
  // AND THE FATIGUE, which is the half that surprised the bench (§1c):
  //   at the condition CEILING       0.0 - `recoveryBase` is 8 a week, so the -3 is clamped away and
  //                                  a girl who is not already tired does not notice a fuller summer;
  //   from a real deficit (start 20) -7.0 condition points by September (93.0 against 100.0).
  // Both are true and the second is the one the design is defended on: the block bites exactly on the
  // body that is already carrying a season, which is whose summer this is.
```

## `summerBlock.conditionCost`

```ts
    /** ...and what the fuller week COSTS her, in condition points, against a free training week's
     *  `recoveryBase` of 8 plus 0-2 from the rest slider. Three: she still comes out of a summer week
     *  ahead, which is right (there is no travel and no competition in it), but a nine-week block run
     *  back to back leaves her measurably more tired than nine ordinary weeks would - and the injury
     *  model reads condition, so the block carries its own risk without a rule of its own.
     *
     *  ⚠ INTEGER, like every other term in the condition accumulator ("no fractions", the owner's own
     *  round-9 redesign), and subtracted BESIDE `accrueCondition` rather than inside it - the same
     *  shape the knock's rest credit and the vacation's package gain use, and the reason
     *  `accrueCondition` keeps the arity-2 zero-RNG contract tests/condition.test.ts pins. */
```
