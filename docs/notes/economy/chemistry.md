---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The chemistry block

The comment essays that stood above the `chemistry` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `chemistry` (2)

```ts
  // =============================================================================================
  // CHEMISTRY – how these two WORK, as against what he can DO (docs/specs/the-chemistry-2026-09.md)
  // =============================================================================================
  //
  // The owner, 16.09: «химия между ребёнком и тренером, а не просто стиль-метч» … «эта самая химия
  // может как-то нарабатываться с разной динамикой – это может стать показателем, насколько ей
  // комфортно с тренером» … «самый дешёвый тренер может стать идеальным метчем и дать конкуренцию
  // элитному, но это такое же редкое событие, как и prodigy девочка».
  //
  // ⚠ EVERY NUMBER BELOW IS A KNOB AND NOTHING READS A LITERAL. The spec's C1 ruling is explicit
  // that the 4x4 is «built as a DATA OBJECT so a retune is one edit, not a refactor», and the same
  // rule is taken for the corridor and the walk – engine/chemistry.ts holds the arithmetic and not
  // one of these values.
```

## `chemistry.affinityCentre`

```ts
    // ⭐⭐ THE 4x4 CENTRES – the pair's disposition before the draw, C1's table (spec §3a).
    //
    // THE PRINCIPLE, and it is a DESIGN CLAIM rather than a measurement – the spec flags it as such
    // twice and the owner ruled it «сама идея мне нравится… концептуально корректно звучит»: a pair
    // MATCHES on one axis and COMPLEMENTS on the other. Two intense people burn; two steady people
    // drift; the pair that shares a language and differs in temperature is the one that lasts.
    //
    // ⚠ WHICH OF HER AXES MEETS WHICH OF HIS, written down once and here, because the table is
    // otherwise sixteen unexplained numbers:
    //   · LANGUAGE – her openness (open/private) against what he TALKS TO (the person/the
    //     technique). They MATCH: an open girl is reached through the person, a private one through
    //     the third ball.
    //   · TEMPERATURE – her intensity (steady/intense) against how hard he PUSHES (hot/cool). They
    //     COMPLEMENT: the intense girl needs the cool head beside her, the steady one needs heat.
    //
    // So each row has exactly ONE best manner and ONE worst, and each manner is best for exactly one
    // temperament – the Latin-square shape B11 checks structurally rather than statistically.
    // `+1` is the good corner, `-1` the anti-match corner, 0 the two that split the difference (one
    // axis right, one wrong).
    //
    // ⚠⚠ AND THE CENTRE IS DELIBERATELY SMALL AGAINST `spread` BELOW, WHICH IS B10's WHOLE POINT.
    // A table a player can look up is «a strategy-guide entry», and the owner refused exactly that
    // when he asked for the cheap coach who clicks to be «такое же редкое событие, как и prodigy
    // девочка». The bench measures the variance of realised affinity BETWEEN cells against WITHIN a
    // cell and requires the draw to dominate at 2:1 or better – see tools/chemistry-bench.ts, B10.
```

## `chemistry.driftAtPerfect`

```ts
    /** ⭐ the pair's EXPECTED annual rate at a perfect affinity – the corridor's centre, where the
     *  weather sits when nothing is happening. Well below `ceilingAtPerfect` on purpose: a click that
     *  ran at the ceiling would make «за 3 года 100%» the rule instead of the lucky run it is.
     *
     *  ⚠ FITTED BY B7 AND IT MOVED, WHICH IS THE ONE NUMBER IN THIS BLOCK THE BENCH CHANGED. The
     *  first build set it at 22 and the run came back with «DOWN years at a perfect pair: NEVER»:
     *  with the median year at +19 and the floor at -7, a down year needed the weather to sit below
     *  -0.76 for a whole season, which is four standard deviations of the yearly mean. At 12 the
     *  median year is +11, the zero crossing is 1.9 sigma away, and a bad SEASON puts it within one -
     *  which is §3.4's own claim («losses are the channel that makes a good pair's bad year
     *  possible»), measured instead of assumed. It also puts a perfect pair's climb to 100 at «roughly
     *  a decade», which is §5's own sentence. */
```

## `chemistry.phasePerWin`

```ts
    /** a match won last week, before the damp – and its LOSS COUNTERPART IS EXACTLY ITS MIRROR, which
     *  was measured into this block rather than chosen.
     *
     *  ⚠⚠ THE FIRST BUILD WEIGHTED A LOSS HALF AGAIN AS HEAVY AS A WIN AND CHARGED A FIRST-ROUND EXIT
     *  ON TOP, AND THE BENCH CAUGHT IT AS A FLAT TAX ON EVERY CAREER IN THE GAME. Measured over 12
     *  careers x 208 weeks: 806 wins, 784 losses, 14 titles and 454 first-round exits – so the median
     *  career, at a 50% match record, was pushed to a standing phase of -0.36 and its relationship
     *  wore down for no reason but arithmetic. ⚠ IN A KNOCKOUT SPORT EVERY EVENT BUT ONE ENDS IN A
     *  LOSS, so any asymmetry here is a tax rather than a signal.
     *
     *  ⭐ AND THE SYMMETRIC PAIR ALREADY ENCODES DEPTH, which is why the exit term went rather than
     *  being re-sized: `wins - losses` IS the run. A title is +5 net, a semifinal +2, a first-round
     *  exit -1. So a deep run pays and an early exit costs, with no second term to keep in step - and
     *  a 50% season is exactly neutral, which is what the median career should be. ⚠ «A bad loss as
     *  FAVOURITE» (§3.4's third clause) is an EXPECTATION-relative read, and the spec defers that read
     *  to F1's residual itself (C5); it is not built here and is not faked here. */
```

## `chemistry.readableFloor` (2)

```ts
    // ⭐⭐ C7, RULED 16.09 – «once clear», and a single bar was what «clear» meant for one round. The
    // question C7 asks is whether chemistry surfaces «from season one, or once a band is clear», and
    // his reason for the second was quoted rather than paraphrased: «a sentence in week 3 about a
    // relationship is noise». The bar was `readableAt: 5`, and it was `ceilingAtNone` by derivation:
    // five points is, by his own anchor in this same block, the WHOLE of what an ordinary pair's year
    // can gain, so a reading under five sat inside one ordinary year's own noise.
    //
    // MEASURED AT THAT BAR (spec §8b, kept here because it is the record the new corridor is measured
    // against): 240 pairs x 416 weeks on the bench's own record – median first sighting week 62, p90
    // week 201, 5 of 240 never inside eight years, the marker turning back off 0.25 times a career,
    // and NO pair of the 240 crossing inside three weeks (median |chem| 1.05 at week 13, largest of
    // the 240 3.93).
    //
    // ⭐⭐⭐ AND THAT IS WHAT HE THEN PLAYED AND RULED ON, 18.09: «мне кажется медленно, какие-то цифры,
    // пусть и небольшие 1-2% мы всяко может раньше видеть. Но здесь тоже можно включить
    // вариативность.» Two instructions in one sentence, and the second is the standing design law of
    // this wave («вариативность… но при этом математика и стабильность – мы можем воспроизвести все
    // вариации»). So the bar is not lowered – it is DRAWN, per pair, from the corridor below.
    //
    // ⚠⚠ THE CORRIDOR IS STILL HIS `ceilingAtNone` AND NOT AN AGENT'S TASTE, which is the same
    // argument the single bar was built on, read at two more points. The floor is a FIFTH of what an
    // ordinary pair's year can gain and the ceiling is a HALF of it; the old bar was the whole of it.
    // So the three numbers are one anchor read at 1/5, 1/2 and 1/1, and «1-2%» – which is what he
    // asked to be able to see – is exactly the band the floor opens.
    //
    // ⚠ NO SCHEMA KEY IS OWED AND NONE IS TAKEN. The threshold is RE-DERIVED at read from
    // `${seed}:chemistry:readable:${coachId}` – a purpose-scoped sub-stream, one draw, persisting
    // nothing and never touching MAIN – exactly as the pair's affinity is (`affinityFor`). Same seed,
    // same career, same coach, same threshold, to the bit, for ever. `chemistryReadableAt` in
    // engine/chemistry.ts is the ONE place it is spelled.
    //
    // ⚠⚠ AND C7'S WEEK-3 GUARANTEE IS DELIBERATELY SUPERSEDED AT THE LOW END, said out loud rather
    // than discovered. At a threshold near the floor the fastest pairs on the roster can show a small
    // figure inside the first weeks – which is not a regression against «a sentence in week 3 is
    // noise», it is the owner overruling his own earlier ruling with a later one, and the figure he
    // named («1-2%») is precisely the size that appears there. What the corridor protects is that
    // this is a MINORITY of pairs rather than all of them; the measured share is in the spec's
    // 18.09 addendum.
```
