---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The masseur block

The comment essays that stood above the `masseur` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `masseur.perSessionCents`

```ts
    // ⭐ STEP 2 RE-CUT THE CONTRACT INTO A DIAL (owner, round 24: «а не слишком ли дешево это для
    // специалиста?… может быть добавлять настройки сколько раз в неделю он дает свои услуги»). The
    // step-1 flat $150/wk was half the middle coach's weekly bill and the owner read it right: at
    // his own real-world friendly rate ($50/h) it buys THREE hours, and a professional's body work
    // is not three hours. The honest recalibration is RELATIVE, inside the game's own scale:
    //
    //   * a SESSION is priced at the top of the middle coach's 17-22 hourly band ($48-72/h,
    //     `coach.hourlyRateCents`) – a specialist's hour, not a friendly visit;
    //   * the rungs below make the WEEK read against the staff the game already sells: 2×$75 =
    //     $150/wk (step 1's own number, surviving as the entry rung), 4×$75 = $300/wk (the middle
    //     coach's whole weekly bill – «a professional on retainer»), 7×$75 = $525/wk (between the
    //     high coach's $500 and the elite's $800 – the full-time body man; ≈$27k/yr, beside the
    //     owner's own «+2 специалиста это ещё +46к» sketch).
    //
    // STILL A FLAT CONTRACT PER RUNG: no corridor, no jitter, no draw – the rung is chosen, the
    // bill is flat per rung, and the ledger row is the number on the card (step 1's legibility
    // argument, moved one level up).
```

## `masseur.raisePerYear`

```ts
    // ⭐⭐⭐ ROUND 43 #4 – AND IT IS THE OPENING PRICE NOW, NOT THE PRICE. His 16.09 ruling: «мы
    // начинаем работать с массажистом по нашим текущим ценам, а дальше он приходит и просит
    // прибавку, либо (так как альтернативы нет) добавить денег, но убавить количество процедур…
    // может просить надбавок за свои часы ежегодно, может быть не так интенсивно как тренер». So
    // the rate above is where every career starts and this is the drift away from it, compounded
    // once per completed year on the payroll (`masseurSessionCents`, world/masseur.ts).
    //
    // ⚠⚠ THE YARDSTICK IS THE COACH AND NOT A MARKET, and that is a ruling rather than a shortcut.
    // Round 43 #6 asked the research for a real-world masseur figure and was WITHDRAWN when he
    // closed the design: an outside benchmark would only be needed to re-price him from scratch,
    // which is not what was asked. «Не так интенсивно как тренер» is the whole constraint, the
    // coach's own annual ask is a 5–15% corridor (round 42 #51, specified and not yet built), and
    // 4% sits clearly under its floor.
    //
    // ⚠ MEASURED, NOT GUESSED (invariant 5) – `npm run bench:masseurraise`, the tables in
    // docs/specs/the-masseurs-ask-2026-09.md. What 4%/yr buys over a career:
    //
    //     years served      1      4      8     12     16     20
    //     the session     $78    $88   $103   $120   $140   $164
    //     the entry rung $156   $176   $206   $240   $280   $328  a week
    //
    // The pressure he asked for is real and slow: at a constant spend the top rung (7 × the rate)
    // buys one rung less after fifteen years (M4, measured), which is «это может нам скомпенсировать все
    // ранги» over a career rather than over a season. ⚠ AND THE ONE THING THE BENCH HAD TO PROVE:
    // the ENTRY rung must never drift out of a modest family's reach, or the poor lose the seat to
    // arithmetic instead of to a decision. See the spec's §4 for the measured wallet.
    //
    // ⚠ DETERMINISTIC – no corridor, no jitter, NO DRAW ON ANY STREAM. The file's own legibility
    // rule («a salary is a negotiated number the player can read») is the reason: a rate that
    // wobbled would make the card's quote and the ledger's row two different numbers.
```

## `masseur.rungs`

```ts
    // THE DIAL – how many times a week the table is hers, the owner's own idea. Three rungs, and
    // each must MEASURABLY beat the one below or the dial is decoration (the plan's §4 law); the
    // bench table in docs/specs/the-masseur-2026-08.md carries every cell.
    //
    //   * rehabExtraEveryNWeeks: every Nth week of an ACTIVE layoff the hands take one extra week
    //     off it (deterministic, off week − sinceWeek; see rollInjury). N=3 was measured in step 1
    //     at the EDGE of season noise (-1.7 ± sd 8) – acceptable as the CHEAP rung of a dial, a
    //     named failure as the only effect of a flat contract. N=2 is step 1's shipped-and-measured
    //     arm (-2.3..-2.5 weeks/career). N=1 halves a long layoff, which is what daily hands are
    //     for. A 1-2 week niggle gains nothing at ANY rung (the totalWeeks > 2 guard in
    //     rollInjury) – honest: nobody massages a one-week soreness away.
    //   * conditionBonusPerWeek: the at-home table, on top of the physio's own +1, on the weeks she
    //     is NOT away at a tournament (the away weeks are the travel stance's business below).
    //     ⭐ +1/+2/+3 SINCE THE OWNER'S 22.08 RULING – the shipped +1/+1/+2 had a measured flaw the
    //     dial's own §4 law forbids: rungs 1 and 2 were INDISTINGUISHABLE on any week without an
    //     injury (same bonus, and the cadence only separates them inside a layoff), i.e. the $150
    //     step from «twice a week» to «every other day» bought nothing a healthy player could
    //     read. The ladder now steps by exactly one point per rung. The physio note's hair trigger
    //     («at 2 the retainer alone erased every policy difference») was about the UNPRICED
    //     retainer bonus on every profile; these rungs are priced $150/$300/$525 a week and land
    //     in the pro phase, whose base dropped to 5 in the same wave – the combined grid in
    //     docs/specs/the-masseur-2026-08.md §11 measures the whole stack together.
```

## `masseur.tourRecoveryPerRound`

```ts
    // ⭐ WHAT THE FARE BUYS (step 2, the owner's «влияет ли он на восстановление на глубоких
    // играх»): when the masseur TRAVELS to a tournament (fare paid, `pendingTournament.masseurThere`),
    // the run's strain at finalize is relieved by this much PER NIGHT BETWEEN ROUNDS – i.e. ×
    // (matches − 1), capped at the strain itself. Scales with DEPTH by construction: a first-round
    // exit has no nights between rounds and buys nothing, a title week has the most – which is
    // literally the owner's question answered. Zero draws; the knob is read post-strain.
    //
    // ⚠ 1-vs-2 WAS MEASURED ON THE OWNER'S OWN QUESTION («+2 за каждый круг не многовато?») and 2
    // STAYS – the combined grid's relief arms (docs/specs/the-masseur-2026-08.md §11): at 1/round
    // the tour condition channel survives at half size but the deep-run WINS channel drops under
    // 2 SEM everywhere (8k +8.2±2.3 -> +4.7±2.6) and the 8k prize delta goes to noise – the fare
    // would buy a number the player cannot feel, the decorative-staff failure again.
    //
    // ⭐⭐ RAISED 2 -> 3 ON 19.09, AND IT ANSWERS THAT QUESTION FROM THE OTHER SIDE. The note above is
    // KEPT because it is the record: he once asked whether +2 a round was already too much, and the
    // measurement kept 2 rather than dropping to 1. On 19.09 he named this dial himself as one of
    // four to RAISE – «слив на глубине хода и ТУРНИРНАЯ РАБОТА МАССАЖИСТА, а также обычная работа
    // массажиста и естественное восстановление» – so the direction is his, and the later ruling
    // governs the earlier worry.
    //
    // WHY IT IS THE RECOVERY WITH THE MOST ROOM, in one line: the season equation's §3 found that
    // the CEILING, not the dial, is what a rest week runs into – she banks 4.7 of a 10.1 week,
    // because a holiday has just put her at 100 – and this is the only recovery in the game that
    // lands on a week she PLAYS, where the ceiling cannot eat it.
    //
    // ⚠⚠ AND +1 IS THE WHOLE STEP, FOR A MEASURED REASON, not for timidity. The relief is subtracted
    // from the run's strain AFTER the fact and scales with (matches − 1), so raising it flattens
    // what DEPTH is worth: at +2 a straight-sets W15 title nets EIGHT against a first-round exit's
    // four, and the title week has stopped being twice the exit – the depth curve flattened rather
    // than softened. At +1 it nets twelve against four, so a title is still three times an exit at
    // the cheapest rung and five times at a Slam. `tools/season-equation.ts`'s `netDepthWitness`
    // measures exactly that ratio per cell, because the relief is subtracted AFTER
    // `tournamentRunStrain` has returned and no witness that reads the ladder can see it.
    //
    // MEASURED (20 careers x the wealthy·elite and middle·high presets walked to 28,
    // `npm run bench:season-eq -- --levers --seeds 10 --toAge 28`): holidays a season 8.0 -> 7.2,
    // the mean professional event 15.3 -> 13.7, weeks under 50 2.7 -> 2.0, injury prevalence and the
    // ranking ceiling unmoved (49% and #12 -> #11). +2 was measured too – 6.3 holidays – and is in
    // the spec's §10e if he wants the bigger step.
    //
    // ⚠ IT REACHES NO FROZEN CAREER AND NO RIVAL, PROVED RATHER THAN ARGUED. `masseurTourRelief` is
    // applied in ONE place, `world.ts finalizeTournament`, for the kid alone, and the gate is a
    // counting W-series result no 156-week career reaches. `tools/frozen-key-diff.ts` on 5/0, 8/0
    // and 0/1 with this change alone: 0 of 95 / 95 / 96 keys moved, `rngMain` byte-identical.
```
