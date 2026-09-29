---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The availability block

The comment essays that stood above the `availability` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `availability.minConditionToEnter`

```ts
    // The soft fatigue floor per tier, one step per rung (the J levels extrapolate above national,
    // matching tierMatchFatigue). Racing below the floor is still ALLOWED – it raises a caution,
    // never a block (the owner's "the parent may push, the game warns").
    //
    // ⚠ THE W FLOORS MOVED WITH THE SURCHARGES (R15-6, same ruling, same date - see
    // tierMatchFatigue). The old 60/65/70 continued the J family's +5 extrapolation and priced the
    // W15 as the most gatekept week in the game while its measured field is the softest
    // international draw there is (median entrant ~#53 of 200 against J300's ~#20). The family now
    // steps +5 over the J ENTRY rungs (j30 45 -> w15 50), keeps +5 inside itself, and the seam
    // j300 (55) -> w15 (50) DROPS on purpose - the same dated decision as the surcharge: when the
    // living-field population makes the W fields real, w35/w100 are re-priced upward, measured.
    // W100's old 70 meant nearly every entry raised a caution; at 60 it still cautions any career
    // that arrives worn, and the one HARD floor in the game is still `medicalFloor` (15) below.
    // The W2-LADDER middle rungs keep the floor<->surcharge pairing R15-6 set (floor = 30 + 5 x
    // surcharge: 4->50, 5->55, 6->60), so the floors interpolate exactly as the surcharges do -
    // w50 with the dense pair at 55, w75/wta125 with the prestige pair at 60 - and one retune
    // note (tierMatchFatigue above) governs both tables.
    //
    // ⚠⚠ THAT PAIRING IS RETIRED AS OF W2-FATIGUE, AND THIS TABLE IS DELIBERATELY UNCHANGED. The
    // fatigue re-price (docs/specs/fatigue-reprice-2026-08.md §2-3) took the W surcharges into the
    // 2-3 band; carried through `30 + 5 x surcharge` that would have put W100's entry floor at 45 -
    // BELOW J300's 55 - so the biggest event in the game would caution later than a junior one. The
    // pairing was a derivation rule for interpolating new rungs, and it quietly fused two different
    // questions: what a week COSTS her body (travel and adaptation, which the spec repriced) and how
    // fresh she must BE to start one (arrival safety, which nobody asked to move - it is not in the
    // spec's §2-5 and §7 leaves the owner's own numbers alone). The floors stay where R15-6 put them;
    // tests/ladder.test.ts L9 is re-aimed to pin this table on its own terms, and it still refuses a
    // decrease inside the family, a broken seam, or a missing rung.
```

## `availability.medicalFloor` (2)

```ts
    // THE DOCTOR'S VETO (owner idea R9-19b, cashed in by the Wave-2 fatigue bench 26.07): the one
    // place where "the parent may push, the game warns" yields to medicine. Below this condition
    // entering a tournament is a HARD block (availabilityStatus level 'blocked', reason 'medical');
    // at or above it, fatigue stays the SOFT caution it has always been. The bench found the only
    // degenerate cell of the whole sweep – a self-coached grinder competing at condition 0 for
    // ~4.4% of her weeks – and this is the floor under it. Deliberately far below every tier
    // caution floor (20-45), so normal play never meets it; knob-driven (0 disables it) so the
    // owner can lower or retire it after seeing the numbers.
    //
    // THE DOCTOR NOW CHECKS HER ON ARRIVAL TOO (owner 26.07): "врач точно не пустит ниже 15 на
    // турнир, если она приезжает". The floor used to gate ENTRY only, and entries commit weeks
    // ahead of the play week – so a run entered healthy could still be PLAYED at condition 0 with
    // nothing intervening (the fatigue bench recorded 14 straight weeks of it). It is now re-read on
    // the play week itself: under the floor she is withdrawn on medical grounds (world.ts tickWeek
    // step 2). Same knob, two surfaces, one rule.
```

## `availability.injuryBaseChance`

```ts
    // Season-Life slice C: fatigue-driven injury risk. ALL of these move only the post-draw
    // threshold tau (or pull from the private per-week `seed:injury:week` sub-stream) – the MAIN
    // weekly draw sequence stays byte-identical (the C1 invariance test guards it).
    // ⚠⚠ ALL THREE RE-CALIBRATED 03.08 (W2-FATIGUE, docs/specs/fatigue-reprice-2026-08.md §5), and
    // the spec's own §5 is the reason they had to be: «у нас же там еще риск травм растет, как бы мы
    // себе в ногу не стрельнули усталостью». MEASURED BEFORE THE WAVE, on a career playing the
    // owner's own season (twenty events, every second week): a 96-100% chance of at least one injury
    // per season against the researched anchor of 46-54% (docs/research/injury-stats-by-age.md).
    // The foot was already shot; the re-price is the bandage, not the bullet.
    //
    // ⚠ ORDER OF WORK, honoured: the fatigue re-price landed and was MEASURED FIRST, in its own
    // commit, and this calibration was taken on top of it - never simultaneously, or the result is
    // unattributable (the mistake act2-pro-tour.md's A3 note warns about for best-16). All numbers
    // below come from tools/pro-season-probe.ts, 32 careers x 3 professional seasons, the spec's own
    // reference player (60/40, no retainer), the professional pair schedule.
    //
    // WHY ALL THREE MOVED, in the spec's own order of preference, with what each was worth:
    //   1. THE SLOPE FIRST, and the spec's suggestion of halving it was tried first and measured:
    //      0.00045 -> 96%, 0.0003 -> 79%, 0.0002 -> 67%, 0.0001 -> 60%. Halving is not close. The
    //      slope ALONE can reach the band, at about 0.00004 - but that is a 22x cut that leaves a
    //      wrecked week only 1.7x as dangerous as a fresh one, i.e. it buys the number by deleting
    //      the mechanic this whole slice is named after. Rejected on those grounds, and the
    //      measurement is here so the owner can overrule it with one line.
    //   2. THE COMPETING MULTIPLIER SECOND - and it is the injury axis of the same argument the
    //      surcharge reprice makes: 1.8 was a junior's match week, and a professional on her own
    //      tour is conditioned for hers. Worth ~4 points of prevalence on its own (a weak lever
    //      here: only 20 of 52 weeks carry it).
    //   3. THE BASE LAST, and it had to move because it is what was actually eating the band: at
    //      twenty competing weeks, 0.006 x 1.8 x the age and overuse factors contributes ~45%
    //      season prevalence BEFORE ANY FATIGUE AT ALL. It is halved, not abandoned - and the
    //      research anchor it is tied to is a PREVALENCE, not a per-week rate. 0.006 was derived so
    //      that a JUNIOR season produced 46-54%; the professional season has twice the competing
    //      weeks, so the same anchor demands a smaller base. This is a re-derivation against the
    //      same research, at the schedule the game now actually offers.
    //
    // WHAT THE SHIPPED TRIO MEASURES: 51% season prevalence at the professional pair schedule
    // (target 46-54), and the fatigue coupling SURVIVES - a week at condition 50 is 3.5x as
    // dangerous as a fresh one and a wrecked week is 6.0x, against the shipped 8.5x and 16x. The
    // cliff is flattened, tiredness still plainly hurts, which is exactly what §5 asked for.
    //
    // ⚠ AND EVERY ONE OF THESE IS STILL A POST-DRAW THRESHOLD MULTIPLY inside `injuryTau` - that
    // property is load-bearing and is untouched: zero new draws on any stream, the frozen MAIN
    // capture byte-identical, the private `seed:injury:week` sequence in the same order it always
    // was. Only the number a roll is compared against moved.
```

## `availability.injuryVacationFactor`

```ts
    // R12-4/11 (owner playtest 27.07: "injured ON a family vacation", TWICE in one career). A
    // resort week used to roll the SAME dice as a training week – `rollInjury` reads fatigue, age,
    // trailing load and whether she is competing, and a booked vacation touched none of them, so
    // the week she is furthest from a tennis court was as dangerous as the week she is grinding.
    //
    // THE VALUE, and why 0.25. The model's load axis already runs from 1.8 (a competing week) up to
    // 1.8 again for four straight played weeks; a vacation is the far end of that same axis and
    // must be a bigger move than any protection money can buy – `physio.riskReduction` is 0.76 (a
    // retainer, 24% off) and the elite package's carry-over buff is 0.85. A quarter of a training
    // week's risk puts a fresh kid's holiday at ~0.15%/wk, i.e. one holiday injury per several
    // hundred vacation weeks, and it stays NONZERO on the owner's own instruction ("holidays do
    // sprain ankles") – she still climbs, swims and falls over. It rises with a deep condition
    // deficit, which is honest: the week she most needs the rest is the week her body is most
    // fragile, and that is exactly when a vacation gets booked.
    //
    // POST-DRAW MULTIPLY ON THE THRESHOLD – the same invariance pattern as `physio.riskReduction`
    // and the recovery buff (see injuryTau). ZERO draws, on any stream: the frozen MAIN capture
    // cannot move, and neither can the private `seed:injury:week` sequence, so a career that never
    // books a vacation is byte-identical to before.
```

## `availability.ageInjuryFactor`

```ts
    // Owner research 25.07 (docs/research/injury-stats-by-age.md): girl injury-age curve peaks at 16.
    // Mild by design – the base is already anchored to real junior prevalence (46-54%/season).
    // ⚠ 13 IS EXPLICIT NOW, AND IT DELIBERATELY CHANGES NOTHING. A December-born girl is genuinely 13 for
    // her first season (world.ts `kidAgeYears`), and before this the row did not exist - she fell through
    // to `default`, which is the 19+ mature-body value, and 0.85 happened to be a plausible answer. An
    // accident that produces the right number is still an accident: naming it at the same value makes it a
    // decision, and stops a later re-tune of `default` (a rule about adults) from silently moving
    // thirteen-year-olds. The shape peaks at 16, which is the growth spurt; 13 sits below 14 because she
    // is pre-spurt and carrying smaller loads.
    // ⚠⚠ THE ADULT LIMB LANDED 30.08 (round 30 #26/#27), AND THE NUMBERS BELOW ARE THE FITTED ONES –
    // measured, not chosen. `docs/specs/age-injury-curve-2026-08.md` §4b is the fit and §4c its
    // predicted-vs-measured table; do not re-derive them, re-run that bench.
    //
    // WHAT WAS WRONG. `default: 0.85` was the table's LOWEST value and it carried every year from 19
    // to retirement, so nineteen, twenty-five and thirty-four were one body and all three were 29%
    // safer than a sixteen-year-old. The note above is still true – the table was never wrong, it was
    // UNFINISHED – and the fallback quietly became the adult model when careers grew to forty.
    //
    // WHAT THE SHAPE IS, ROW FAMILY BY ROW FAMILY:
    //   13-18  the shipped junior shape x0.7. The SHAPE is the owner's own research (§3.1) and is not
    //          re-argued – the peak is still at 16, the ladder is the same – only its HEIGHT moves.
    //          16-18 measured 64.5% against its own researched anchor of 46-54%, the single most
    //          over-band row in the table; x0.7 takes it to 59.0% and 13-15 to 49.7%, still in band.
    //   19-27  the prime, FLAT at 0.25. Both WTA studies that tested age for INCIDENCE returned null
    //          (research §5b), so a rising limb through the prime is not licensed by anything.
    //   28-33  the rise, LINEAR, and 34+ is 2x the prime. That 2x is the bottom of the only quantified
    //          proxy band (2.3-4.9x in football, research §5d) and deliberately nowhere near its top,
    //          because tennis's own two attempts at the question came back null.
    //
    // ⚠ THE LEVEL MOVED WITH THE SHAPE ON PURPOSE, and that is what makes it shippable: season
    // prevalence measured 58.5% against the professional research band of 30-54%, and the fitted
    // curve lands 51.4% – IN BAND, from outside it. A level-neutral variant of the same shape is
    // measured beside it (§4d) and lands 58.4%, i.e. out of band; it was not taken.
```

## `availability.retirementSeverityBands`

```ts
    // --- THE RETIREMENT DOOR'S OWN SEVERITY TABLE (round 16 #13) --------------------------------
    //
    // THE OWNER, 11.08: «RETIRE_K оставляем как есть, дверь схода надо показывать, а 3 мощные травмы
    // 6-4-4 недели подряд одна за одной – это слишком… это значит, что у нас с механикой что-то не
    // то. Это надо чинить.» So the RATE does not move – `RETIRE_K = 0.07` is on its own measured
    // calibration (docs/specs/match-retirement.md §4) and is untouched – and the door stays visible.
    // What is wrong is the CONSEQUENCE, and this table is the whole of the fix.
    //
    // WHAT IT WAS. `retirementInjury` called `onsetInjury`, which read `severityBands` above – the
    // SAME table a weekly roll uses. So a girl who stopped mid-match had a 30% chance of losing 3-6
    // weeks and a 10% chance of losing 8+. Measured over 400 season-years at careful policy
    // (docs/specs/round16-injuries.md §9): 36.3% of retirements cost 3+ weeks, 16.8% cost 6+, and
    // 61% of ALL her injuries – 68% at high condition – arrive through this door. So the acute-injury
    // table was most of what the player actually experienced.
    //
    // THE ARGUMENT, AND IT IS ABOUT THE MECHANISM RATHER THAN THE FEEL. A girl who stops because her
    // legs are gone is not the same event as a girl who tears something, and this engine knows which
    // one it is rolling:
    //
    //   1. THE TRIGGER IS EXHAUSTION, BY CONSTRUCTION. `retireHazard = RETIRE_K * spentness(n,
    //      stamina) x retireDurability(condition)` – the third factor since 27.08, and STRICTLY
    //      POSITIVE, so it cannot manufacture a stoppage where exhaustion is zero – is zero for the
    //      first 120 points and rises with IN-MATCH fatigue –
    //      match-retirement.md §3 says it in as many words: "A retirement in this engine is
    //      exhaustion, not accident", and names the rolled ankle at 2-2 in the first set as the thing
    //      it deliberately does NOT model. A hazard indexed on how spent she is should hand out the
    //      consequences of being spent.
    //   2. AND THE RULEBOOKS PUT THAT CATEGORY OUTSIDE INJURY ALTOGETHER. The tour's medical rules
    //      (docs/research/retirement-and-withdrawal.md §6) refuse a medical time-out for cramping and
    //      list "general player fatigue" as non-treatable – not because they are cruel but because
    //      there is nothing to treat. Cramp, heat and a spent body are what this hazard fires on, and
    //      they are back on court in days.
    //   3. THE 2.73% ANCHOR IS A STOPPAGE RATE, NOT AN INJURY RATE. `RETIRE_K` is calibrated against
    //      PLOS ONE 2024, and that study's own caveat (research §7 flag (b)) is that it counts matches
    //      "that started but did not finish FOR ANY REASON – illness, injury and anything else are
    //      pooled". A rate borrowed from a pooled population must carry that population's severity
    //      mix, and that mix is dominated by things that are not a torn anything.
    //   4. THE RULES ARE WRITTEN AROUND HER PLAYING THE FOLLOWING WEEK. WTA §IV.C.1 is an entire
    //      clause about the player who retires and is entered next week – examined here, form
    //      submitted there, examined again on arrival – and the ITF junior certificate
    //      (CoC §III.B.2.b) is scoped by DEFAULT to "the following week's" tournament, with §III.B.2.c
    //      as the extension for anything longer. Rulebooks do not spend paragraphs on the exception.
    //
    // THE TABLE, BAND BY BAND, AND WHY EACH IS WHERE IT IS:
    //
    //   minor 60% -> 80%, still 1-2 weeks. The modal mid-match stoppage is cramp, heat or a tweak
    //     that settles, and a 1-week layoff in this engine is exactly "she plays the following week"
    //     (`rollInjury` clears at step 1c of the next tick, before she is asked to enter anything).
    //     Four in five, because that is what "the normal case, but not the only one" looks like.
    //   moderate 30% -> 15%, and 3-6 -> 3-5 weeks. A spent body moves badly and does pull things, so
    //     this must survive – but as the minority, not as a third of them. The CEILING comes down one
    //     week because six is the owner's own number: a six-week layoff is an acute event, and acute
    //     events belong to the band below.
    //   major 7.5% -> 4%, LENGTH UNCHANGED at 8-14. And that is the line this table draws: minor and
    //     moderate are the EXHAUSTION outcomes and their lengths follow the mechanism, but major and
    //     severe are the ACCIDENT outcomes – the body genuinely broke – and a stress reaction does
    //     not heal faster because it happened at 5-5 in the third. What changes above moderate is how
    //     OFTEN you get there, never what it costs when you do.
    //   severe 2.5% -> 1%, LENGTH UNCHANGED at 16-22. KEPT DELIBERATELY, and it is what stops this
    //     fix going too far in the other direction. The retirement copy has a sentence only this band
    //     reaches – "She stopped, and this time it is serious: … The dream takes a hit." – and a
    //     retirement must be able to be the moment a career changes. At ~0.73 retirements a season
    //     that is roughly one career in fourteen over ten seasons: rare enough to be a story, on the
    //     same standard `ENDINGS.injuryPriorWeeksOut` was measured to (4.4% of full-life careers).
    //
    // ⚠ ZERO DRAWS ADDED OR REMOVED, WHICH IS WHY NO CAREER RE-BASES. `onsetInjury` spends exactly
    // three pulls in exactly one order – severity, weeks-out, region – and this changes only the
    // NUMBERS the second and third are compared against. `pickInt` takes one pull for any range
    // (a collapsed range still draws) and `drawBodyRegionFrom` takes one for any table. So the
    // `seed:retire:<week>` and `seed:injury:<week>` sequences are byte-identical to before, and the
    // frozen MAIN capture (41550 / e6b0c709) never saw either.
    //
    // ⚠ AND THE FOUR SEVERITY LABELS ARE THE SAME FOUR. `InjurySeverity` is untouched, so
    // `SEVERITY_DESCRIPTOR`, `onsetCostCents`, the snapshot, the dialog and every persisted
    // `injuryHistory` row keep their vocabulary. NO SCHEMA CHANGE.
```

## `availability.severityAgeFactor`

```ts
    // --- SEVERITY BY AGE (round 30 #27 limb 1, the owner 30.08: «тяжесть надо взять точно, но
    // разумно») ---------------------------------------------------------------------------------
    //
    // ⭐⭐ THIS IS THE BEST-SOURCED OF THE THREE LIMBS, and it is a different instrument from
    // `ageInjuryFactor` above. Research §5c: tennis shows BURDEN rising with age, not incidence –
    // the SEVERE share (>28 days lost) runs 43% in adolescents against 54-66% in
    // collegiate/professional players, a ratio of 1.26-1.53x, where every incidence number in the
    // sport shows no gradient at all (§5b, two WTA nulls). So the events stay where the fitted curve
    // put them and the CONSEQUENCES move.
    //
    // ⚠ «РАЗУМНО» IS HIS WORD AND IT IS APPLIED AS A CEILING, NOT AS A TARGET. The whole
    // adolescent-to-veteran climb below is 1.26x – the BOTTOM of the sourced 1.26-1.53 band, not its
    // middle and not its top. A model that took 1.53 would be quoting the most generous reading of a
    // single systematic review as if it were a measurement of this sport at this age.
    //
    // THE SPLIT INSIDE THAT CEILING, and only the first half of it is sourced:
    //   13-18 -> 1.00   the anchor. This IS the 43% the source measures; it must not move, or the
    //                   ratio the whole table expresses stops being the ratio that was published.
    //   19-27 -> 1.13   `[I]` the adolescent->professional step, taken at ABOUT HALF the ceiling.
    //                   The source's contrast is adolescent-vs-professional and a nineteen-year-old
    //                   IS a professional, so the literal reading would spend the whole 1.26 here –
    //                   but that leaves no gradient inside adulthood, which is the half he asked
    //                   for, and it would put a cliff at the birthday.
    //   28-33 -> linear, 34+ -> 1.26   `[I]` from Williams S et al., J Sci Med Sport 2023 (elite
    //                   rugby union): a heavy season raises the following season's BURDEN and not
    //                   its incidence, and the effect is «driven by an increased risk for older
    //                   (>26y) Forwards». That is the only sourced within-adult burden gradient in
    //                   a comparably-loaded sport, and 28 is where the frequency curve above starts
    //                   rising too – ONE age story, told twice, rather than two that can drift.
    //
    // ⚠ IT SCALES THE BANDS' CUMULATIVE THRESHOLDS AND NEVER THE LAYOFF LENGTHS. `escalatedBands`
    // multiplies each band's TAIL probability and leaves `weeksLo`/`weeksHi` exactly as they are,
    // which is round 16 #13's own ruling restated: «What changes above moderate is how OFTEN you get
    // there, never what it costs when you do.» A stress reaction does not take longer to heal
    // because the body it happened to is thirty-four.
    //
    // ⚠ AND IT CANNOT MOVE A DRAW. It is read AFTER the severity uniform has been pulled and only
    // decides what that already-drawn number MEANS – the same post-draw discipline
    // `severityBandsFor` and every multiply in `injuryTau` are built on.
```

## `availability.recurrence`

```ts
    // --- RECURRENCE (round 30 #27 limb 2) ---------------------------------------------------------
    //
    // THE OWNER, 30.08: «раз мы храним историю травм у себя, то вполне можно делать алгоритм,
    // который будет увеличивать немного вероятность новой такой же травмы или ее прогрессии (более
    // тяжелой). Мне кажется это похоже на правду.» It is the strongest of his three, because
    // PREVIOUS INJURY IS THE BEST-ESTABLISHED RISK FACTOR IN SPORTS-INJURY EPIDEMIOLOGY – ahead of
    // age and ahead of load.
    //
    // ⭐⭐ AND THE POINT IS CLUSTERING, NOT LEVEL, which is what makes it the answer to his OTHER
    // complaint («ни одной травмы я не видел уже несколько сезонов»). Measured onsets are 0.68-0.78 a
    // season and his own lifetime rate is 0.64: the number was never the problem. INDEPENDENT WEEKLY
    // DRAWS PRODUCE EXACTLY THE FORGETTABLE PATTERN HE DESCRIBES – nothing, nothing, a niggle,
    // nothing. «Three quiet years, then the ankle went twice in one season» is the SAME TOTAL told
    // properly, and only a mechanic with memory can tell it.
    //
    // ⚠⚠ THE CEILING AND THE DECAY ARE THE DESIGN, NOT A SAFETY RAIL BOLTED ON AFTERWARDS – «мы ни
    // за что не наказываем». A first injury may not doom a career. Without a decay this is a death
    // spiral wearing realism's clothes, so:
    //
    //   halfLifeWeeks 52   ONE SEASON. An ankle sound for three seasons has 0.5^3 = 12.5% of its
    //                      weight left, which is the owner's own test («an ankle that has been sound
    //                      for three seasons stops being the weak ankle») answered in arithmetic
    //                      rather than in prose. Counted from the RECOVERY week, which is what
    //                      `injuryHistory` rows carry – so a long layoff starts decaying when she is
    //                      back on court, not when she went down.
    //   loadCap 1          THE CEILING. The decayed sum saturates at one unit – "at most one fresh
    //                      major injury's worth of memory" – so a career cannot stack six niggles
    //                      into a body that breaks every fortnight. Every factor below is
    //                      `1 + bump x load`, so the cap is a cap on all three at once.
    //
    // ⚠ NO SCHEMA MOVE. `injuryHistory` already holds `kind`, `severity`, `week` and `weeksOut`, and
    // `bodyPartOf` already turns a `kind` back into one of the twelve regions. Nothing new is
    // persisted, so `SAVE_SCHEMA_VERSION` does not move and no migration is owed.
```
