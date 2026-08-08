---
type: specification
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-08
---

# The ladder floor – the lower bound stops being a wall

**Status: §0 (the ship rule) written before any engine line was touched, against baselines measured
on this branch's head (`34e75a9`, i.e. `main` + the round-14 triage). Everything below §0 is
measured.**

Backlog #84, round-14 items 7 / 15 / 18, and the owner's ruling of 06.08:

> «Точно надо выровнять наши окна, а лучше как ты говорил, не делать нижний порог вообще, пусть
> играет, просто по приоритету более актуальный турнир показывать, если есть.»

**The lower bound stops being a wall and becomes a sorting key.** A rung she has outgrown is
enterable; it simply loses the card to anything better that week. **The upper bound stays** – an
acceptance cut is the tour's own rule and is not ours to waive.

---

## 0. THE SHIP RULE, WRITTEN BEFORE ANY CODE WAS TOUCHED

### 0a. The baselines, re-measured on this head rather than quoted

**SAVE ARM** – the owner's own career at week 255 (age 18, domestic #106 / ITF #65 / WTA #260),
every future event on the persisted season blocks through the real `entryStatus`
(`npx vite-node tools/ladder-floor.ts -- --save <path>`). ⚠ Read locally, never committed, never a
fixture.

| | baseline |
| --- | --- |
| future events, blocked · enterable | **165 · 24** (12.7% enterable) |
| weeks that carry an event | 46 of 52 remaining |
| **weeks where NOTHING is enterable** | **27 of 46 (58.7%)** |
| why the blocked ones refuse | **outgrown 112** · locked 53 |
| of the 27 dead weeks, how many carry an outgrown event | **25** (2 are locked-only) |
| the card the feed shows | 19 of 46 weeks actionable · **0** dead-with-an-alternative |
| the engine opens | W50, W75, W100 – three rungs, and nothing else in the game |

**CAREER ARM** – the econ bench's own presets and policies, ticked for real, 9 presets x 6 seeds x
2 policies x 520 weeks (`npm run bench:floor -- --seeds 6 --weeks 520`).

| | baseline, grinder | baseline, player |
| --- | --- | --- |
| playable weeks / season (>=1 enterable event) | **27.2** of 47.8 that carry one | *(filled in §2)* |
| ...as a share of the weeks that carry an event | **57.0%** | *(§2)* |
| entries / season | 26.7 | *(§2)* |
| her peak W rank – best / p10 / median / worst | **#120 / #176 / #257 / #612** | *(§2)* |
| careers that ever held a professional ranking | 40/54 | *(§2)* |
| her W book at career end (median) | 114 pts | *(§2)* |
| the card pick's DISPLAY column | **0** of 2,011 dead cards | *(§2)* |

**HEAD ARM** – 180 careers to the ending horizon, both policy arms
(`npm run bench:money -- --no-verify --policy <arm>`), which is where the project's published
peak-rank figures come from (`docs/specs/population-1600-2026-08.md` §4). Re-measured here, not
quoted: *(filled in §2)*.

### 0b. The six criteria

**The wave ships only if all six hold.** Any one fails and the finding is reported rather than
argued around. Each bar names the direction that would make the change a balance change instead of
a defect fix.

1. **THE GAIN – the headline, and it is a supply number.** On the owner's own save, weeks where
   NOTHING is enterable falls from **27 of 46 to at most 6**; and on the career arm, playable weeks
   as a share of the weeks that carry an event reaches **>= 85% on both policy arms** (baseline
   grinder 57.0%). ⚠ 100% is not reachable and must not be aimed at: a week carrying only a Slam is
   legitimately dead, and the save has 2 such weeks.

2. **THE TWO CEILINGS AGREE, MECHANICALLY.** `outgrewTier` (the domestic point band) and
   `tierOutgrown` (the sliding window) must have **the same consequence** – the rule a previous wave
   established and wrote into `world.ts`: *"they are the same event for the player and must have the
   same consequence"*. Pinned by a test that drives a career past each ceiling and asserts the same
   `EntryStatus` shape from both, not by a comment. Binary.

3. **THE GIFT GUARD – a change that makes her rank climb because the world got easier is the
   failure mode, not the goal.** Her **median** peak W rank may improve by at most **25%** on each
   arm, and careers of 180 reaching the **top 100** must stay **under 30** on each arm (the
   conveyor bar `population-1600-2026-08.md` §0 set and this wave inherits). ⚠ The rung she is
   outgrowing pays little by construction, but "little x many" is exactly how a ladder gets gamed,
   so the bar is on the MEDIAN career and not on the best one.

4. **THE CLIMB SURVIVES – she must not stall on easy rungs.** W-track entries per season must
   **not fall** on either arm, and the share of careers that ever hold a professional ranking must
   not fall by more than **5 percentage points**. ⚠ The mechanism to fear is fatigue, not taste: the
   entry policy already takes the strongest rung on a week, so she only takes a Local when nothing
   better is there – but every extra event costs condition, and a body spent on W15s is a body that
   arrives at the W75 worn out. `tools/boredom-guard.ts` must still exit 0.

5. **THE DISPLAY DOES NOT REGRESS.** "Enterable" is about to mean something much wider and the card
   pick (`preferredWeekEvent`: entered -> enterable -> tallest) was measured to a **zero** display
   column on 05.08. It must stay zero on the owner's save and must not rise on the career arm. ⚠ And
   the ORDERING is judged as well as the column: the card must not put a Local in front of a W75 she
   can also enter that week.

6. **COST AND THE LEDGER.** Tick cost within **10%** of baseline (`npm run bench:load`); **no
   persisted field changes**, so no `SAVE_SCHEMA_VERSION` bump and no golden fixture; `npm run
   test:quiet` green with every re-aimed guard carrying a `⚠` and its reason.

### 0c. What I expect to happen, written down so it can be wrong

* **Criterion 1 passes with room.** 25 of the 27 dead weeks on his save carry an outgrown event, so
  the dead-week count should land at **2**, not 6.
* **Criterion 3 is the one at risk.** Her best-18 professional window is not full in the middle
  game, so cheap points do not displace – they ADD. I expect the median peak W rank to improve, and
  the question is by how much.
* **Criterion 4 is the second risk, through fatigue rather than through taste.**
* **Criterion 5 I expect to hold by construction and I do not trust that**, which is why it is
  measured: an outgrown rung is by definition BELOW her working rung on `TIER_LADDER`, so the
  existing "tallest" tiebreak should already express «по приоритету более актуальный». The case that
  changes is a week whose tall card is LOCKED and whose short card is now enterable – there the
  middle tiebreak will now show the short one, which is the 05.08 rule doing its job and is a
  visible change to his feed.

---

## 1. The defect, and what the domestic gap turned out to be

*(filled in below)*

## 2. Measured

*(filled in below)*

## 3. The ship rule, judged

*(filled in below)*
