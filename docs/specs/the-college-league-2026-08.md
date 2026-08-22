---
type: spec
status: current
area: engine/balance
canonical: false
last-reviewed: 2026-08-22
---

# The College League – one guaranteed tournament a year, and a call-up that is earned (22.08.2026)

**Round 24, wave 3 / G1, on `wave/round24`.** The owner, 21.08:

> «я бы хотел, чтобы как минимум 1 турнир в год колледжа был. А вызов в сборную мы можем и подкрутить
> для этого, не вижу проблем с этим. Или еще что-то добавить отдельное, какой-то студенческий турнир,
> например. Тогда вызов в сборную можно будет опереть на результаты студенческого и тогда у нас будет
> минимум 1, максимум 2 турнира на учебный год – по-моему хорошо выглядит»

⚠ **This spec does not restate the tier model** ([`the-college-choice-2026-08.md`](the-college-choice-2026-08.md))
or what a call-up is ([`college-as-a-second-act-2026-08.md`](college-as-a-second-act-2026-08.md) §3).
It records one addition and its measurement.

---

## 0. ⚠⚠ THE MEASUREMENT THE ITEM CAME OUT OF

Agent D1's Home-shell wave exposed what a college year actually contains. Measured over
**12 careers × 4 years = 48 college years**:

| | before |
| --- | ---: |
| marked weeks in a year of 52 | **3** |
| ...of which write rows and can be watched | **1** |
| tournaments per college year (min / max) | **0 / 1** |
| **watchable matches per college year** | **0.71** |
| call-up landed | 19 / 48 = **40%** |
| ...and she took the court | 17 / 48 = **35%** |

The two squad trips (`COLLEGE_TRIP_WEEKS` = 8, 20) feed `growWeek`'s `matchesThisWeek` and write
nothing – there is no row to open. The call-up was a bare 40% roll that read her age and her skill
mean, neither of which the player spends a week on. **On roughly two thirds of college years the
calendar held one openable row and it was empty.** The epilogue used to hide that behind a photo
album; the Home shell shows it.

---

## 1. WHAT WAS BUILT

**`src/engine/collegeLeague.ts`** – a leaf, exactly like `nationalTeam.ts`: no `WorldState`, no
calendar, an `Rng` handed to it. `src/engine/world/college.ts` is the seam that puts her on court and
is the only file that knows both competitions.

| | value | why |
| --- | --- | --- |
| `label` | `the College League` | fictional (CLAUDE.md Style); matches the art occasion key `'college-league'` |
| `seasonWeek` | **12** | two weeks before `NATIONAL_TEAM.seasonWeek` (14) – see §2 |
| `drawSize` | **8** → 3 rounds | 1–3 watchable matches; `stageLabel` reads it as QF / SF / F with no special case |
| `field` | standard **56**, spread **12** | OURS. Six under the senior international standard of 62 – these are the other girls on the other scholarships, not selected seniors – and wider, because a student field is not selected at all |
| `opponentAgeBand` | 18–23 | undergraduates; `MatchPlayer.age` is the age half of the serve-speed curve |
| `surface` | hard | a per-year surface draw would be one more invented number and changes only a decorative mark |

**It is a knockout and the loop breaks on a loss**, which is the one structural difference from a
tie: a rubber set is a fixed three matches, a draw is over when she loses. That is what makes «at
least one watchable match a year» true by construction.

⚠ **The field does not scale with her tier, and that is a ruling.** A dearer programme playing a
stronger championship field would mean paying more for a *worse* chance of the letter. The tier
reaches this fixture the honest way round – it buys `collegeCoachFactor` and `matchesPerWeek`, those
raise her skill, and her skill is what wins matches here. Tier → development → result → the letter,
with no second knob on the path.

---

## 2. ⭐⭐⭐ WHY WEEK 12, AND WHY ITS OWN WEEK

**The floor is arithmetic, not probability.** A college year is exactly fifty-two consecutive ticked
weeks, so every season week occurs in it **exactly once** – for every career, at every tier, with no
draw anywhere near the question. The same arithmetic gives the ceiling: two season weeks carry a
tournament (12 and 14), each occurs once, so a year holds **at most two and never three**.

**It comes before the call-up because that is the mechanism.** A championship played after the
selectors have picked could not be leaned on, and the owner's «опереть на результаты студенческого»
would be a sentence with nothing behind it.

**It is its own week rather than one of `COLLEGE_TRIP_WEEKS`.** Two reasons: a trip at week 20 is
after the call-up and one at week 8 would be a month before the season it crowns; and the trips are
the dual-match season, a count that feeds development and writes no rows – folding the championship
into one would make a single week mean two different things *and* delete development the tier was
paid for, which is a balance change invariant 4 owns. The year now holds **four marked weeks and two
tournaments**.

### 2a. ⚠ The two enrolment weeks where the order flips

A college year runs fifty-two weeks from whatever week she enrolled on, so for **season weeks 12 and
13** (2 of 52) the first year's call-up arrives *before* its first championship. `lastLeagueRun`
falls back to the most recent banked year – which is what a selection panel with a year-old form line
would do – and in year one there is no previous result, so `NATIONAL_TEAM.callChanceNoLeague = 0`
and **no letter comes**. A fallback to the old bare `callChance` here would have kept the roll alive
in the one case the ladder cannot see, which is how a mechanism becomes decorative.

---

## 3. ⭐⭐⭐ THE LETTER IS EARNED – `NATIONAL_TEAM.callChanceByLeague`

| rounds won | 0 (out in the QF) | 1 | 2 (lost the final) | 3 (champion) | no championship |
| --- | ---: | ---: | ---: | ---: | ---: |
| chance of the call-up | 0.15 | **0.40** | 0.65 | 0.85 | **0** |

⚠ **The middle rung is `callChance` itself**, so there are three invented numbers here and not four:
the mechanic is re-shaped around its own historical mean rather than re-tuned to a new one.

⚠ **The draw count did not move.** `rollCallUp` still takes exactly four pulls in the same order –
what changed is the number the first uniform is compared against, so every later value on
`seed:callup:<week>` sits at the offset it always did.

---

## 4. ⭐⭐ MEASURED – `npx vite-node tools/college-year-content.ts`

⚠ **The instrument imports no symbol this round added.** Every figure comes from
`world.college.years` and from `match` rows in `world.events`, both of which exist unchanged on the
commit before the change – so the same file runs on the reverted arm and prints the same table.

⚠ **One seed per career, and the first draft of the walk did not have it.** `openCareer` builds its
seed as `bench-${background}-${index}` and `PRESETS` holds nine presets over three backgrounds, so a
nested loop hands three careers the same seed and therefore the same `seed:callup:<week>` sub-stream.
It looked like 400 samples and behaved like 140: the call-up rate came out 3.7 standard deviations
under its own ladder purely from the duplication. A global index fixed it.

### 4a. In D1's own units – 12 careers × 4 years = 48 college years

| | before | after |
| --- | ---: | ---: |
| tournaments per college year, min / max | 0 / 1 | **1 / 2** |
| watchable matches per college year | 0.71 | **2.27** |
| college years with nothing to open | ~2 in 3 | **0** |
| call-up landed | 40% | 27% |

### 4b. At n = 400 (100 careers), where the ladder is readable

| championship the selectors read | years | called | rate | ladder says |
| --- | ---: | ---: | ---: | ---: |
| none on record | 1 | 0 | 0% | 0.00 |
| out in the first round | 135 | 22 | **16%** | 0.15 |
| 1 win | 93 | 31 | **33%** | 0.40 |
| 2 wins (lost the final) | 50 | 34 | **68%** | 0.65 |
| 3 wins (champion) | 120 | 101 | **84%** | 0.85 |

**The lean is not decorative:** 16% → 84% across the ladder, and the realised rates track the
constants inside sampling error. Aggregate over the same 400 years: tournaments per college year
**1.47 mean, min 1 max 2**, **2.72 watchable matches per year**, call-up **47%** (up from 40%,
because the median student result sits above the middle rung), on court **38%**.

⚠ **The one exception to the floor, and it is honest.** One year in 399 held no tournament: a year
**cut short by a career-ending event** before week 12 came round. `resumeFromCollege` breaks on a
fresh ending and `bankCollegeYear` banks the stub as it stood, so that year really did hold none.
The floor is a claim about a year that was *lived*, and `tests/college-league.test.ts` scopes to full
years and then asserts the walked careers are all full, so the scoping cannot swallow a regression.

---

## 5. ⚠⚠ WHAT IT AWARDS: NOTHING, AND THAT IS THE CONSTRAINT

She is an amateur while she is there. That is why the sponsors, the academy and the gear shop are all
shut inside the freeze (W2-ENDINGS, «nobody writes to an amateur»). **A student fixture that paid
WTA/ITF ranking points would quietly turn four years of college into a ranking route and the fork
would stop being a real choice**, so:

* `world.results` is never touched and no rank is recomputed – there is no result;
* the match rows carry `friendly: true`, which is the one predicate the radar (R11-2), the avatar's
  emotion, the knock history and the Weekly Story read to decide whether a match is *evidence*;
* they carry `keep: true`, so `pruneResults` / `pruneEvents` cannot take the week away – the card is
  drawn years later and a week she may still watch has to still be in the feed to open;
* **zero condition cost and zero development**, deliberately. A drain, a layoff on a retirement, or
  feeding `growWeek` are each a balance change invariant 4 owns; adding the fixture was the ask,
  re-pricing the year was not, and doing both at once would make §4 unreadable.

---

## 6. RNG

Two new sub-streams, both re-derived at the call site and persisting nothing:
`seed:collegeleague:<week>` (the draw) and `seed:collegematch:<week>:<r>` (one per round, which is
what makes the stored record replayable). `seed:callup:<week>` is **byte-identical** to what it was.
The frozen MAIN capture is unmoved: **41550 draws / `e6b0c709`**.

---

## 7. SCHEMA – v55 → v56

`college.pendingLeague` and `college.years[*].league`, both nullable. **Null is the true value, not a
placeholder** (v30's case): a career already inside the freeze lived its banked years before this
fixture existed, and a run is three seeded matches against a drawn field – reconstructing one would
write a scoreline into a week that did not have one.

**What it costs a save already three years into a freeze: at most one call-up.** The letter reads
`lastLeagueRun`, and a migrated career has no championship on record until its next week 12 – so a
remaining year whose week 14 arrives first gets no letter. Every year after it has a championship
behind it. Nothing else changes meaning, and a career that has already left college is unaffected in
every respect.
