---
type: index
status: current
area: backlog
canonical: false
last-reviewed: 2026-08-26
---

# What is left – the whole answer, on one page

The owner, 24.08: «что там еще по ревью не закрыто? Что из наших предыдущих раундов правок еще
актуально? Актуализируй всё»

**This page is a MIRROR, not a plan.** Every line is one sentence, a state and a link; nothing here
is new analysis and nothing here proposes anything. Every state below was re-verified against the
code on 24.08 – not against a document's own claim about itself, because three of them turned out to
be wrong about themselves and are marked ⚠ where that happened.

---

## 1. The R2 review's remainder – 2 of 18 items are left, and one of those is his own pause

Verdicts: [13-full-project-review-response](../review-codex/13-full-project-review-response-2026-08-23.md).
Catalogue: [07-proposals-and-roadmap](../review-principles-2026-08-23/07-proposals-and-roadmap.md).
Programme rows: [the-r2-programme.md](the-r2-programme.md).

| item | state | where it stands |
| --- | --- | --- |
| **R2-14 reasonable-player arms** | **open, no executor** | DI2's his-cadence policy standardised into the bench suite, at the next bench run – the only R2 item still unbuilt |
| **R2-16 one adult decision hers** | **Parked – his pause** | accepted as E1's design; waits on private-life steps 1–2 by his own 22.08 word |
| Wave-5 hygiene list | Later | rolling, folded into [the-quality-rig.md](the-quality-rig.md) |

⚠⚠ **THIS SECTION WAS WRONG ABOUT ITSELF UNTIL 26.08, AND IN THE DIRECTION THAT MATTERS – it listed
work as unbuilt that had already shipped.** Its header said «8 of 18 left, 4 of those moving now»,
its table carried four rows as «⚙ in flight» and two as «open, no executor». Re-verified against the
CODE on 26.08, after waves C and D landed and round 26 merged: **six of those six are in `main`.** A
sweep dated 24.08 was simply overtaken by the merges of 25–26.08 and nothing re-read it – the exact
rot [doc-facts.mjs](../../scripts/doc-facts.mjs) owns for the two facts a machine can source, and
cannot own for a table a person has to re-derive. Verified by file and by commit, not by document:

| was listed as | actually | proof in `main` |
| --- | --- | --- |
| R2-06 «open, no executor» | **shipped** | the match types live in `src/shared/matchViz.ts`; **zero** import statements from `viz` remain anywhere in `src/engine` (`2bfcfc3`, `f784351`, `e57cb44`) |
| R2-09 «⚙ in flight» | **shipped** | `src/shared/protocol.ts` is a 228-line barrel over 10 modules in `src/shared/protocol/` (`33d273c`) |
| R2-10 «open, no executor» | **shipped** | the five weekly phases are `src/engine/world/phase{Obligations,Finance,HerWeek,Growth,AiWeek}.ts`; state is `src/engine/world/state.ts` (`6fce9e2`, `3fa188e`, `fe6fc98`, `e272c83`) |
| R2-11 «⚙ in flight» | **shipped** | `MatchViewer.vue`: one clock, one audio owner, a prop-driven transport (`2b3878c` and two more) |
| R2-12 «⚙ in flight» | **shipped** | `scripts/pin-ratchet.mjs` + `tools/generated/source-pin-baseline.json` + `tests/helpers/source.ts`, and `pins:check` is inside `npm run check` |
| R2-13 «⚙ in flight» | **shipped** | `src/engine/world/multiWeek.ts`, incl. the offer stop (`01a240d`); round 26 #1 then re-gated its button to his condition (`spanWorthOffering`) |

**What closed the other sixteen** – eight shipped in waves A and B, six more in waves C and D (the
table directly above), and two were superseded before they were built:

| item | closed by |
| --- | --- |
| R2-01 tuition typing | typed `expense` in `world/college.ts`; the blast radius was the week recap's blank scrap, not the money |
| R2-02 injury DTO | `Snapshot.injuryReport`; `InjuryStopDialog.vue` parses no prose |
| R2-03 two false guards | `JSON.stringify([from, to])` keying in `tests/import-cycles.test.ts`; the sim guard now reads the vitest argv (`tests/sim-serialisation.test.ts`) |
| R2-04 doc truth + ownership | `scripts/doc-facts.mjs` owns the volatile facts; CLAUDE.md is inside `context:audit`'s budget |
| R2-05 typed worker replies | `REPLY_BY_COMMAND` + `ReplyFor<K>` in `src/shared/protocol.ts`, read by `src/worker/client.ts` |
| R2-07 accessible dialog shell | `src/composables/dialogFocus.ts` on Confirm, Fork, Retirement and Injury, four different Escape policies |
| R2-08 watermark consolidation | `App.vue` holds no `localStorage` call – the eleven remaining mentions are comments |
| R2-18 adult copy by stage | one shared stage predicate over a `lifeStage` axis in `engine/diary/` |
| R2-15 college compact-vs-second-act | SUPERSEDED – the owner chose the second act by building it (round 24) |
| R2-17 minimum relationship | SUPERSEDED – the private-life build is this proposal grown up |

---

## 2. The rounds' remainder – 34 items across 13 ledgers

Re-verified box by box against the tree on 24.08; **nine boxes were closed by that verification**
and are gone from this list. Rounds 4, 6, 9, 12, 13, 18, 19, 20, 21 and 23 have nothing open.

**Round 3** ([round-3-qa.md](../rounds/round-3-qa.md)) – five, and they are the oldest things here.

- The Team card – coach and body staff on one surface; still no `TeamCard` in `src/`. **Next** · [screens-and-cards.md](screens-and-cards.md) #2
- The five portrait ages and the accelerated childhood prologue; `START_AGE_YEARS` is still 14. **Next** · [modes-and-the-prologue.md](modes-and-the-prologue.md) #1
- The Moments gallery – posts for significant events; no gallery screen exists. **Next** · [screens-and-cards.md](screens-and-cards.md) #3
- ⚠ Weather – rain, wind and an indoor/outdoor flag; a COSMETIC temperature layer has been live since 29.07 (`eventTemperature`, `WeatherPlate.vue`) and the ledger's «no weather concept anywhere» was false. **Next** · [the-living-world.md](the-living-world.md) #10
- Mom or dad at onboarding – no parent-gender concept in `src/`. **Next** · [modes-and-the-prologue.md](modes-and-the-prologue.md) #4

**Round 5** ([round-5.md](../rounds/round-5.md)) – four.

- Player-uuid friendly exchange; no trace in `src/`. **Later** · [modes-and-the-prologue.md](modes-and-the-prologue.md) #6
- Relationship/trust UI – absorbed into the private-life layer, which is unbuilt. **Next** · [the-private-life-layer.md](the-private-life-layer.md) #6
- Attend-vs-watch-on-TV parenting; unpriced. **Later** · [modes-and-the-prologue.md](modes-and-the-prologue.md) #7
- The wealthy-track academy invitation – the academy that shipped is the need-based scholarship, the other side of the ladder. **open, unindexed**

**Round 7** ([round-7.md](../rounds/round-7.md)) – one.

- Per-day calendar detail screens; the stated blocker (per-day training controls) expired on 10.08, so this needs a re-ask, not a build. **Next – his word** · [screens-and-cards.md](screens-and-cards.md) #5

**Round 8** ([round-8.md](../rounds/round-8.md)) – one, and it is the oldest open item in the folder.

- R8-1, the in-tournament player card; untouched since 25.07, nothing in `TournamentFlow.vue`. **Next** · [screens-and-cards.md](screens-and-cards.md) #1

**Round 10** ([round-10.md](../rounds/round-10.md)) – two, and both are still true.

- R10-2 / R10-8, the Stats header tiles: the widest label is `Professional rank` (17 chars) against the 11 the fix was measured at, on a `white-space: nowrap` rule, and no test pins the tile labels. **`[!]` reopened, unindexed**

**Round 11** ([round-11.md](../rounds/round-11.md)) – one.

- R11-1b, post-return fragility; `injuryTau` reads age, load, physio, vacation, kit and the knock, and no memory of a previous injury. **Next** · [injuries-gear-and-open-bugs.md](injuries-gear-and-open-bugs.md) #3

**Round 14** ([round-14.md](../rounds/round-14.md)) – one.

- #17, the difficulty wrapper as win rate against reality; its own triage says «needs a ruling, not a build». **Next – his word** · [modes-and-the-prologue.md](modes-and-the-prologue.md) #5

**Round 15** ([round-15.md](../rounds/round-15.md)) – six, of which two are answered rather than open.

- #2, the coach still has no job on the per-day dials – training-dials §7 and §8 are designed and unbuilt. **Next** · [the-team-around-her.md](the-team-around-her.md) #1, #2
- #4, the title count – ANSWERED by his ruling 3 («Нет, как в жизни»); it reads `[ ]` only because this ledger's legend has no marker for "answered". **answered**
- #3, the remaining-events counter on the W cards; only the Season header's supply line exists. **Next** · [screens-and-cards.md](screens-and-cards.md) #4
- #6, the 13-week cadence above W75; `everyNWeeks` still reads 2/3/4/6/13/13. **Next** · [the-living-world.md](the-living-world.md) #6
- #13, «Training week» printed over a tournament week; `weekAhead` still falls through to `TRAINING` and no repro was ever taken. **Next – needs a repro** · [injuries-gear-and-open-bugs.md](injuries-gear-and-open-bugs.md) #4
- #9, W wins then J trouble; the bands are unchanged and the probe never happened. **Next – needs a measurement** · [the-living-world.md](the-living-world.md) #8

**Round 16** ([round-16.md](../rounds/round-16.md)) – four.

- #6, the intermittently empty W-card chance field; the latent path is live in `season/preview.ts` and it has never been reproduced. **Parked – needs a second sighting** · [injuries-gear-and-open-bugs.md](injuries-gear-and-open-bugs.md) #5
- ~~#8, kit wear on holiday~~ – ⚙ **SHIPPED 29.08, round 29 #20, after a FOURTH asking.** His 09.08 ruling («A VACATION PAUSES WEAR») is implemented: `gearRestWeeks` is written at `housekeep` before `prunePlannerBookings` discards the holiday, because `world.vacations` keeps only four trailing weeks and could never have answered «how many rest weeks fell in this span» – which is why three earlier passes called it a one-liner and none landed it. ⚠ The INJURY half of that ruling stays unruled by his own choice, 29.08: «давай пока не будем здесь ничего менять».
- #10, `key`/`full` driving the match rather than the text; explicitly left alone by his own instruction. **his standing word** · [awaiting-his-word.md](awaiting-his-word.md) #4
- #20, the wake lock during a match; zero `wakeLock` references in `src/`. **Next** · [the-quality-rig.md](the-quality-rig.md) #10

**Round 17** ([round-17.md](../rounds/round-17.md)) – three.

- #15, why pay a coach; measured three times, and the edge and travel waves moved the numbers underneath it. **`[>]` his word, on fresh numbers** · [the-team-around-her.md](the-team-around-her.md) #3
- #22, rivals in commentary; priced at ~20 lines with no schema change, never approved. **`[>]` his word** · [screens-and-cards.md](screens-and-cards.md) #6
- H, domestic rungs in an adult's season list; the filter reaches it in two lines when he asks. **Later – his ask** · [the-living-world.md](the-living-world.md) #7

**Round 22** ([round-22.md](../rounds/round-22.md)) – four distinct (the tier label is filed twice).

- No spec in `docs/specs/` for the wave's two balance changes – the tenure ramp and the live professional table; invariant 4's paper trail is owed. **Next** · [the-quality-rig.md](the-quality-rig.md) #9
- The dormant `HandoffView` fields – keep, wire, or delete. **his word** · [awaiting-his-word.md](awaiting-his-word.md) #2
- ⚠ One tier label is still the sport's own term – `label: 'Grand Slam'`; the `WTA …` rungs this row was written about became `World Tour …` on his own 18.08 instruction and the row never said so. **his word** · [awaiting-his-word.md](awaiting-his-word.md) #1
- The balance methodology as a standing rule; written up, explicitly not adopted. **his word** · [awaiting-his-word.md](awaiting-his-word.md) #3

**Round 24** ([round-24.md](../rounds/round-24.md)) – one.

- #6, «где-то её мнение увидеть»; PAUSED by his own ruling until private-life steps 1–2 exist. **Parked – his pause** · [college-the-remainder.md](college-the-remainder.md) #7

**Round 25** ([round-25.md](../rounds/round-25.md)) – one.

- ⚠ #9, the injury rebalance for reckless play; the measurement it was blocked on LANDED as [the-injury-landscape-2026-08.md](../specs/the-injury-landscape-2026-08.md), so only the dose ruling is left. **his word** · [injuries-gear-and-open-bugs.md](injuries-gear-and-open-bugs.md) #2

---

## 3. Everything else open

### The five plans he commissioned in detail – all five are written, none is built

- [the-private-life-build.md](../plans/the-private-life-build.md) – steps 1–4 with numbers, seams, schema moves and benches; steps 5–8 sized as sketches. Nothing built; `spirit` does not exist. **Next, L** · five owner questions still open in its §8 (two of the seven were ruled on 23.08) · [the-private-life-layer.md](the-private-life-layer.md)
- [the-living-world-build.md](../plans/the-living-world-build.md) – the professional contour: results that move, aging, retirement, arrivals, in five steps. **Next, L** · five owner questions open in its §9 · [the-living-world.md](the-living-world.md) #1
- [the-prologue-and-the-tour.md](../plans/the-prologue-and-the-tour.md) – the childhood 6→14 with the onboarding tour woven in. **Next, L** · six owner questions open in its §9 (one ruled 23.08) · [modes-and-the-prologue.md](modes-and-the-prologue.md) #1
- [the-wedding-and-the-children.md](../plans/the-wedding-and-the-children.md) – the branch behind private-life step 6, sized in dependency order. **Parked behind steps 1–5** · four owner questions open in its §6
- [the-injury-landscape-2026-08.md](../specs/the-injury-landscape-2026-08.md) – «MEASUREMENT ONLY. Not one engine line ships from this spec»; the dose-response curve behind the §6 lever is complete. **his word on the dose** · [injuries-gear-and-open-bugs.md](injuries-gear-and-open-bugs.md) #2

### The pure rulings – [awaiting-his-word.md](awaiting-his-word.md)

- The Slam's literal label – rename or accept, one word either way. **since 18.08**
- The dormant `HandoffView` fields – keep, wire, or delete. **since 19.08**
- The balance methodology as a standing rule. **since 19.08**
- Round 16 #10, `key`/`full` driving the match – recorded so the standing ruling is findable. **since 11.08**
- Slam wild cards – measure condition-at-arrival, then rule. **measurement, then his word**
- The grant's presentation – one merit award plus a means top-up, or the award itself varying. **his word**

### The rulings that live inside a theme, listed once so nothing is lost

The college freeze's four refused controls ([college-the-remainder.md](college-the-remainder.md) #2)
· the politer entry refusal ([college-the-remainder.md](college-the-remainder.md) #6) · the ad
deal at the fork, pause or lapse ([advertising-and-fame.md](advertising-and-fame.md) #5) · «why pay
a coach» and the share tunes ([the-team-around-her.md](the-team-around-her.md) #3, #6) · the
travelling team's two questions – does the masseur unlock before the pro career, does the
psychologist travel ([the-team-around-her.md](the-team-around-her.md) #7) · the champion-news
contradiction and the top-of-ladder cadence ([the-living-world.md](the-living-world.md) #5, #6) ·
the 14U national-team event ([the-living-world.md](the-living-world.md) #9) · the difficulty
wrapper ([modes-and-the-prologue.md](modes-and-the-prologue.md) #5) · the recklessness-injury
magnitude ([injuries-gear-and-open-bugs.md](injuries-gear-and-open-bugs.md) #2) · injury suspending
sponsor perks ([injuries-gear-and-open-bugs.md](injuries-gear-and-open-bugs.md) #6) ·
`CollegeYearCard`'s «Banked» over a negative delta ([screens-and-cards.md](screens-and-cards.md),
last row) · the git reviewer's API-key billing and advisory-vs-blocking
([the-git-reviewer.md](the-git-reviewer.md) §3) · the shop's six §6 questions
([the-shop-and-the-broker.md](the-shop-and-the-broker.md) §6, §7).

### The rest of the reservoir

Everything not named above is a theme file in this folder, and its states did not move this week:
[advertising-and-fame.md](advertising-and-fame.md) (steps 3–6, gated on the private life) ·
[the-shop-and-the-broker.md](the-shop-and-the-broker.md) (five steps, all Later, independent) ·
[the-quality-rig.md](the-quality-rig.md) (the a11y remainder, the e2e layers, P8's back gesture,
P9's lint/coverage/release discipline) · [the-git-reviewer.md](the-git-reviewer.md) (the skill
shipped; only the Action wrapper remains) ·
[season-life-future.md](season-life-future.md) (the 25.07 capture, §1 shipped as the coach tiers).
The states themselves live in those files – this page routes, it does not duplicate.

## ⚙ Added after the sweep – found by wave D as it landed (24.08)

- **A real `offer` stop for the four-week advance** – R2-13's own item text lists offers among the
  things the span must stop before, and phase 1 does NOT stop for one: it surfaces them through the
  span digest and the existing inbox cue. A true stop needs a new `StopReason`, which is a
  `protocol.ts` change – blocked during the wave because that file was being split, and free now.
  State **Next**, size S. `docs/backlog/the-r2-programme.md` carries the row.

