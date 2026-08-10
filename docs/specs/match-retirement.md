---
type: spec
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-10
---

# Spec – the retirement: she can be hurt during a tournament, and inside a match

**Branch:** `feat/match-injury` · **Worktree:** `/Users/letulip/Projects/Claude/tb-match-injury`
**Reads:** `docs/research/retirement-and-withdrawal.md` (the rulebooks, primary), `docs/specs/season-life-03-injuries.md` (the injury model this extends), `docs/specs/fatigue-injury-audit-2026-08.md`.
**Schema:** **NOT BUMPED.** `SAVE_SCHEMA_VERSION` stays at **47** – see §8.

## 0. The ruling this implements

The owner, 10.08:

> «если травма до матча – ничего не защитываем, если во время – защитываем поражение в текущей
> ступени, обе со снятием и последующим лечением и восстановлением как есть у нас… травма может быть
> не только между турнирами и по приезду на них, а еще и в процессе или вообще внутри матча… В
> юниорской то же самое, ничем не отличается – травма и травма, нет разницы сколько ей лет и в каком
> уровне турнира участвует.»

And, clarified the same day, **"before the match" means before her FIRST match of the tournament**:
«да, конечно, всё предыдущее уже у нее. Просто проигрыш и сход.» A girl who has won two rounds and is
hurt before the semi-final keeps the round she reached.

⚠ **The ruling matches the rulebooks**, which is worth recording because it means the research is a
CHECK on this spec rather than a constraint it argues with. Points and prize are paid for the round
reached, at every level, with no partial credit and no haircut (2026 ITF WTT Regs, Women's §XII.C.5.b;
WTA §VIII.B.3.a.i(b) + §IX.C.1.a.ii); the opponent gets a full undiscounted win (§XII.C.1.b – it is
the *walkover* the rules discount, never the retirement); juniors pay no prize money at all
(Juniors Reg 58), so "the same rules in the junior draw" is automatic.

## 1. What the game had, and the one state it was missing

| Situation | Rules' word | Before this slice | Now |
|---|---|---|---|
| Entered, layoff covers the week, never took the court | **withdrawal** (medical) | `arrivalStatus` → walkover branch: 0 pts, fee forfeited, never reaches finalize | unchanged |
| Not cleared by the doctor on arrival | **withdrawal** | medical branch: 0 pts, fee forfeited | unchanged |
| Took the court and stopped | **retirement** | **did not exist** | §2–§6 |
| Her opponent failed to appear | **walkover** (she receives one) | not modelled | not modelled (research §10.3) |
| Thrown out for conduct | **default** | not modelled | not modelled, correctly |

So the before/during split the owner ruled on is: **before her first match → the shipped walkover /
medical branches, untouched, nothing counts. During → a retirement, and the round she reached is hers
in full.**

⚠ **The between-matches case is not separately modelled, and the outcome is identical.** The engine
resolves a whole tournament in one pass, with no tick between rounds, so there is no moment at which
"she cannot come out for the semi-final" could be evaluated. What the ruling actually settles is the
ACCOUNTING – round reached, loss there, layoff after – and a retirement at the first point of the
semi-final produces exactly that. Naming the two apart would need an inter-match tick, which is a
structural change to `runTournament` bought for one word of copy.

## 2. Where the retirement is decided: inside `simulateMatch`

`src/engine/match/engine.ts`. Two uniforms – one per side – drawn unconditionally off
`rngFromSeed(\`${opts.seed}:ret\`)` **before the first point**. Per point, per side, a hazard is
accumulated; the first side whose running sum passes its uniform stops, after that point is scored.

⚠ **THE ONE THING THAT MATTERS: NO DRAW IS ADDED TO `rngFromSeed(opts.seed)`.** The obvious
implementation – a uniform per point inside the loop – would have re-based the point sequence of
every match in the game. Not the MAIN weekly stream (a match runs on `seed:<eventId>:r<round>`, an
event-scoped sub-stream, so the frozen capture would have survived) but every scoreline in every
save, every calibration band, every pinned box score and every re-run the visualiser performs. Three
consequences follow from the sub-stream shape, all load-bearing:

* a match nobody retires from is **byte-identical** to the same match before this slice;
* the retirement is a pure function of `(a, b, opts)` exactly as the rest of the match is, so
  `MatchReplay` / `TournamentFlow` / `PracticeFlow` re-run the stored `WorldMatch` and reproduce the
  truncation **for free**, with no new field to pass and no component edit;
* conditional pulls are impossible – both uniforms are taken before anything is compared.

**Truncation is not an approximation.** The hazard reads only state up to point *n*, so cutting the
trajectory at *n* gives precisely the match that was played up to the moment she stopped. This is
verified by reproduction in `tests/match-retirement.test.ts`: the retired match's log is replayed
against the raw point stream and every point still matches.

**Both sides carry it, and neither is "the kid".** `simulateMatch` has never known which side the
player is and must not learn. The world decides what a retirement MEANS for the side it lands on.

## 3. The rate, and how it is derived – a design instruction, not a knob

**The probability is NOT scaled by tier.** It is taken from the match itself. `match/point.ts` already
carries in-match fatigue – `FATIGUE_START = 120`, `FATIGUE_RATE = 0.0003` per point past it, scaled by
`(1 - stamina/100)`, capped at `FATIGUE_CAP` – and the retirement reads the same quantity:

```
spentness(n, stamina)     = n <= FATIGUE_START ? 0 : max(0, fatigueTerm(n, stamina))
retireHazard(n, stamina)  = RETIRE_K * spentness(n, stamina)
```

Two things follow, and both are the point:

* **tier-dependence arrives for free.** A harder draw plays longer matches and more of them, so it
  integrates more hazard. Nothing reads the sign on the door – pinned as a source test.
* **the fiction is honest.** She stops because *this match* was long and she was spent. A girl with
  stamina 100 can never retire, and nobody can retire inside the first 120 points.

⚠ **What that deliberately does not model**: the rolled ankle at 2-2 in the first set. A retirement in
this engine is exhaustion, not accident. Adding an accident term would need a second rate with no
research behind it and would break the "reads the same quantity" property that makes this cheap.

`RETIRE_K = 0.07`, **calibrated, not chosen** – see §4.

## 4. The measurement (CLAUDE.md invariant 4)

`npm run bench:retire` (`tools/retirement-rate.ts`). It measures the matches **the game actually
plays** – careers driven on `best16-bench`'s policy (enter the strongest rung that will take her, one
entry a week, money never the reason), which is the heaviest schedule the gates allow.

**Target: 2.73% of matches end in a retirement by either player** – women's ITF World Tennis Tour,
7,291 of ~266,900 matches, PLOS ONE June 2024 (research §7).

Measured **16 careers × 312 weeks = 5,311 of her matches**:

| `RETIRE_K` | share of matches retired | hers | opponent's |
|---|---|---|---|
| 0.145 | 4.94% | 2.00% | 2.94% |
| 0.080 | 3.12% | 1.51% | 1.62% |
| **0.070** | **2.81%** | **1.39%** | **1.41%** |

2.81% against a 2.73% target is **0.4 standard errors** high at this sample size (1 s.e. ≈ 0.22%), i.e.
indistinguishable from the anchor. Mean 23.0 games per match – reported alongside, because a rate that
drifted because her matches got shorter is a different finding from a mis-set `K`.

**By tier, at K = 0.070** – nothing in the hazard reads the tier, so this spread is match length alone:

```
Local Open      686   3.06%      World Tour 15    728   2.20%
Regional        359   4.18%      World Tour 35    627   3.19%
National        162   2.47%      World Tour 50    692   2.75%
Junior Tour 30  582   3.09%      World Tour 75    370   2.70%
Junior Tour 60  538   2.97%      World Tour 100   193   2.07%
Junior Tour 300 151   1.32%      WTA 125          113   0.88%
                                 WTA 250          109   2.75%
```

⚠ **Read this honestly.** The spread is mostly noise at these counts (a 151-match cell has a ±1.3%
standard error). What it does NOT show is a strong ladder gradient, and that is the correct outcome
rather than a disappointment: the design claim was that tier-dependence would arrive *for free*, not
that it would be large. The one directional hint worth noting is that the top four rungs measured
(W75 2.70 → W100 2.07 → WTA 125 0.88) trend **downwards**, which is the direction the real data goes
(research §7: ~2.7% ITF, ~1.7% WTA main tour, ~1.0% at a Slam) – and it arrives with no rule for it,
because she loses earlier and plays shorter matches up there. **Do not tune on those three cells until
the bench is run at a corpus that makes them significant.**

**Her own rate is 1.39%, and the 2.73% is the MATCH rate.** Both are reported because they answer
different questions and it would be easy to quote the wrong one. The research's figure counts a match
as retired if either player stopped, which is what 2.81% is; a career of ~20 matches a season sees her
own retirement about once every three or four seasons, and one of her opponents' about as often.

## 5. Where the injury lands – the same uniform, a different table

`src/engine/body.ts`, `tiltedBodyRegions(loaded, pushed)`. The twelve `BODY_REGIONS` weights are
re-weighted by two things and then renormalised:

* **the week** – what she has been drilling, off `loadedPartShares(planWeek(plan))` (knock.ts's fold
  over the session grid). `BODY_AIM_TILT = 2.0`, matching `KNOCK_AIM_TILT`: it is the same claim about
  the same week, and two numbers for one idea would drift apart.
* **the record** – the parts he has already sent her back out on, `pushedParts(knockHistory)`.
  `BODY_PUSHED_TILT = 2.6`, above the aim tilt because it is a stronger statement: the week is what
  she did, the record is what has already given way once.

⚠ **NO NEW DRAW, AND THE CLAIM IS VERIFIED BY REPRODUCTION.** `drawBodyRegionFrom` takes exactly one
pull whatever table it is handed; weighting the table changes what that uniform MAPS TO, never what
the uniform IS. The test taps a generator, walks the shipped table and the tilted one from the same
position, and asserts both consumed one pull and left the stream in the same place.

⚠ **The identity return is load-bearing.** `tiltedBodyRegions` returns the SHIPPED array itself when
nothing tilts it. The twelve weights are written as the owner's research left them (`0.48 * 0.3`) and
sum to 1.0 in decimal but not necessarily in binary, so a renormalising pass over an all-ones tilt
could divide by 0.9999999999999999 and flip a boundary uniform into the neighbouring part.

⚠ **Applied to the RETIREMENT ONSET ONLY, not to `rollInjury`.** Tilting the weekly roll's table too
would change which body part every existing career's injuries land on – no draw would move, but the
outcome would – and that is a shipped-behaviour change with its own tuning question. Flagged as a
candidate, not taken.

⚠ **The live knock's push override still wins**, exactly as in `rollInjury`: if she is mid-push on a
knock, the injury lands on THAT part. The tilt is the weaker, statistical version of the same idea and
the override is the strong one.

## 6. What the world does with it

`MatchRecord.retiredId` carries the id of the player who stopped. `runTournament` needs **no branch**:
`playMatch` returns `winnerId` = the other side, the bracket advances them, and
`finishes[KID_ID] = rounds - round` is the round she reached, by arithmetic that was already there.

`finalizeTournament` then:

1. **changes nothing about the awards.** Points, prize money, appearance fee and sponsor bonus all pay
   the round reached, off the same finish index. This is the ruling and it is what four rulebooks say.
   The retirement is read *once*, to write copy and open the layoff.
2. **opens the layoff** – `retirementInjury(world)`, which is the ordinary injury model through a
   different door (research §10.2: "the cheapest coherent model is that a retirement IS an injury
   onset that happened to land during a played week"). Same severity bands, same weeks-out, same scans
   bill, same entry sweep, same recovery.
3. **charges the run's strain as usual.** `matchDrain` reads the SCORELINE and a retirement's
   scoreline is the partial one, so a match she walked off after five games is priced as the shorter
   thing it was. Her body then takes the layoff on top.

**`onsetInjury` is now the ONE injury-onset writer**, extracted verbatim from `rollInjury` – same
generator, same three pulls (severity, weeks-out, region), same order – so every shipped career's
injury timeline is byte-identical.

⚠ **The retirement onset draws from `seed:retire:<week>`, and the alternative was a bug.**
`seed:injury:<week>` has already been opened this week by `rollInjury`, which found her healthy and
returned after one pull, so re-deriving it at finalize would hand back that same uniform as the
severity roll: the severity of every retirement would be a function of the number that had just
decided she was fit.

**A PRACTICE FRIENDLY IS A MATCH TOO**, and `resolvePractice` handles it the same way. `simulateMatch`
does not know it is a hit-out at the home club – same fatigue curve, same hazard – so a friendly can
end with her walking off, and when it does she gets the ordinary layoff off the same
`seed:retire:<week>` stream and the news verb says which side stopped. Left unwired it would have been
the "no consequence" version of the feature: a short scoreline, a loss, and no explanation anywhere.
No refund, unlike the medical branch above it: that one gives the court fee back because she never
took the court, and she took this one.

**Surfacing.** A retirement week already stops the advance for `'tournament'`, and the tournament flow
IS the surface: the match line carries `ret.`, the summary line carries ` – she retired hurt`, the
injury event and the scans expense follow it, and Home shows the injured chip. The `'injury'` stop
reason (and its blocking dialog) fires on `injury.sinceWeek === world.week` inside `advanceWeeks`,
which has already returned by the time the reveal closes – **deliberately not re-wired**: a second
dialog over the finale would be two popups for one beat.

## 7. The invariants, and the four comments that had to be restated

**RNG input-independence (CLAUDE.md invariant 2).** Untouched. The frozen MAIN capture is
**41550 / `e6b0c709`** and **it did not move** – nothing in this slice draws on the MAIN weekly stream.
The two new sub-streams are `${opts.seed}:ret` (per match) and `${world.seed}:retire:${world.week}`
(per retirement onset), both re-derived at the call site, both persisting nothing. Neither is reachable
from a player choice: a retirement is decided by the match seed, which is `(worldSeed, eventId, round)`.

**A retirement reaches `finalizeTournament`, and four load-bearing comments said it could not.** All
four are **restated in place** rather than quietly broken, and the restatements are source-pinned in
`tests/match-retirement.test.ts`:

1. `world.ts`, above `prizeCentsFor` – "a skipped event or a walkover pays nothing because it never
   reaches finalize". Restated at length: the trio that never reaches finalize (skipped event, injury
   walkover, medical withdrawal) still pays nothing and is still correct; a retirement reaches it and
   is paid in full. **The distinguishing question was never "did she get hurt" – it is "did she strike
   a ball"**, and the real tours price exactly that difference deliberately.
2. `world.ts`, above the appearance fee – "conditional on APPEARING". Still exactly right, and the
   retirement is the case that shows what the word was always doing: she DID appear.
3. `world.ts`, above `tournamentRunStrain` – "a walkover never reaches finalize, so neither costs
   strain". A retirement does, and costs the honest amount without a rule of its own.
4. `shared/protocol.ts`, `SeasonSummary.seasonRecord` – "a walkover or a medical withdrawal never
   reaches it either, because she never took the court". Still the correct test; she can now take the
   court and not finish, and that is counted, as a loss, in the event's own track.

...and a fifth, in `diary/travelNotes.ts`, which the research did not anticipate: the injury band of
the journey-home notes carried a paragraph explaining that **"none of these claims she was hurt at the
tournament – they are about a girl who got home and then got the news"**, and gave the engine's own
timing as the proof. That reasoning was correct and is exactly what this slice removed. See §9.

**...AND A SIXTH THING THE RESEARCH DID NOT ANTICIPATE, which is a COUPLING rather than a comment.**
The obvious way to mark a stopped match is the sport's own: append `ret.` to the scoreline, "lost to
J. Novak 6-4 2-1 ret." That sentence has a **reader**. `SeasonScreen`'s `plaqueLines` splits the
bracket plaque into a title line and a score line by testing `e.text.endsWith(score)`, and
`tests/round12-view.test.ts` pins the dependency in as many words – *"if that sentence is ever
reworded so the score stops being the trailing token, the plaque silently degrades to one line"*.
Appending would have degraded every retirement row in the bracket, silently, in a file this wave must
not touch. **The marker went into the VERB instead** – "retired against" / "beat a retiring" – which
says the same thing, keeps the score as the trailing token, and left the pin passing unchanged. The
alternative considered and rejected was putting `ret.` inside `MatchRecord.score` itself: it is
arguably the more correct scoreline, and `readScoreline` already tolerates it, but it would have
reached three component renderers and `matchDrain`'s set count, none of which this wave can verify.

## 8. Save schema: NOT bumped

`SAVE_SCHEMA_VERSION` stays at **47**, and this is the answer the merge sequencing needs.

Two fields were added and both are **optional**: `MatchResult.retired?` (not persisted – a live
simulation result) and `MatchRecord.retiredId?` (persisted, on `pendingTournament.result.matches` and
on `WorldEvent.match`). An absent key reads as "she played it out", which is exactly what every
historical save means, so there is nothing for a migration to do. This is the precedent
`docs/specs/season-life-03-injuries.md` set for `SeasonSummary.weeksInjured?` – optional to avoid a
bump – and the three-part move (bump + append-only migration + golden fixture) is owed only when a
migration would have work to do.

## 9. The copy – three weeks that must read differently

The owner: «не забудь про соответствующие записочки по итогам недели если была травма с учетом
момента, когда она была».

| The week | Where its words come from | New? |
|---|---|---|
| **Withdrawal before her first match** | the walkover news line + the `athome && injured` layoff band of `WEEK_NOTES` | **reused** – it is honest: nothing in that band claims she travelled or played |
| **An ordinary defeat** | the journey-home pool's `plainLoss` band | unchanged |
| **A retirement** | the journey-home pool's new `retired` band | **six new lines** |

`TravelHomeFacts` gains `retired` – **strictly stronger than `injured`**, read off the persisted match
row so it survives a reload (unlike the derived `walkoverWeek` marker on the world). The old injury
band splits:

* four of the five existing lines are kept **verbatim** and license on `t.injured` unchanged – they
  are about a house with an ice pack in it and do not care how the ice pack got there;
* "She is worried about the wrong thing. She asked if the entry fee comes back." is **fenced off the
  retirement**: she played, so the fee bought her a tournament and the round she reached is paid;
* "She is on the sofa with the ice on, working out who she would have played next" survives the split
  unfenced, and is the best evidence the split is real – it is a better sentence on a retirement than
  it ever was on the other week.

Also new: three `'injury'` event lines that say she stopped ON COURT (`onsetInjury` branches on the
cause); `' ret.'` on the match news line, which is the sport's own marker and needs no sentence; and
` – she retired hurt` **after** the finish label and the points on the tournament summary, so the
player reads "Semifinalist (+30 pts) – she retired hurt" and learns the rule without being told it.

⚠ **A retirement in a final no longer draws the podium painting.** `reachedFinal` is read off
`finishIdx` and a girl who stopped in the final is correctly a Runner-up – but the happy painting is of
a girl on a podium and she was being helped off a court. Post-draw, zero new draws.

## 10. Guards

`tests/match-retirement.test.ts` – 21 tests in six blocks: the match stream does not move (by
reproduction against the raw point stream), the hazard reads the match and nothing else (including a
source pin refusing a tier/age/rank/surface term), the bracket needs no branch, the part is re-weighted
and not re-drawn (by tapping the generator), the four restated comments, and the voice.

`tests/travel-home.test.ts` – `sweepTravel` widened over `retired` (which implies `injured`, so the
impossible corner is not swept), `HOLDS` gains the claim, and a new two-directional test: a retirement
week must be offered a line only it can have, and an ordinary layoff week must never be offered one.

**Four guards were RE-AIMED, none weakened**, each keeping every original assertion in an explicit
branch plus a ⚠ note naming what changed and why:

| Guard | What it assumed | What it asserts now |
|---|---|---|
| `match/engine.test.ts` set integrity | a match ends by somebody winning two sets | the completed arm verbatim; the retirement arm is **stricter** – it must be undecided |
| `match/engine.test.ts` `scoreAfter` | the last point's score IS the final scoreline | equality on a completed match; the sets are a **prefix** of the live score on a retirement |
| `viz/commentary.test.ts` set/match beats | "the match ended" == "a set ended" | both shapes, in full, plus a test that BUILDS a retirement rather than hoping a 60-match corpus contains one |
| `round10.test.ts` R10-17 | `injury === null` after the layoff | the layoff's **own identity** is gone and recorded – which `injury === null` would have passed even if it had been silently replaced |

**MUTATION-VERIFIED, ten mutations, ten killed.** Retirement uniforms taken from the match stream
instead of the private one (kills 3 tests); the decided-match guard dropped; `tiltedBodyRegions`
losing its identity return; the retirement's points **discounted to zero**; the layoff not opened; the
part table ignoring the pushed record; the news verb no longer saying who stopped; the commentary
calling a retirement "straight sets" again; a tier multiplier in the hazard; and the walkover marker
moved (the other half of the ruling).

## 11. Not built, deliberately

* **The medical time-out** – the intermediate "treated and continues" state (research §6). Real, and a
  match-engine feature rather than a season one.
* **The after-effects** – the WTA's next-week examination gate (§IV.C.1) and the third-first-round-
  retirement fine (§IV.C.5.a). The second only means anything with a suspension ladder behind it, which
  is three features rather than one.
* **The junior medical certificate** (Juniors Reg 31 b) – research §10.1 Q5.3 recommends against it,
  and the owner's ruling settles the question anyway: «в юниорской то же самое, ничем не отличается».
* **Rival retirements as an injury** – her opponent stopping gives her a full, undiscounted win and a
  line that says so, which is the rulebooks' answer, but the cohort carries no injury state so nothing
  follows for that girl. Same missing half as the walkover (research §10.3).
* **A separate between-matches withdrawal** – see §1. The outcome the ruling settles is identical and
  the engine has no inter-match tick to hang it on.
* **A blocking dialog for the retirement** – the tournament flow is already the surface. See §6.
* **Tilting `rollInjury`'s own body-region table** – see §5. It would move which part every existing
  career's ordinary injuries land on, with no draw moving: a shipped-behaviour change with its own
  tuning question, and not this slice's to make.
* **Renaming our "walkover" to "withdrawal"** – research §10.1 Q4's own recommendation is to fix the
  player-facing copy and leave the identifier; the copy lives in three surfaces two of which another
  agent owns this wave, so a partial rename would be worse than none. A comment at the `'walkover'`
  union member in `protocol.ts` documents the misnomer, which is the cheap half of that recommendation.
