---
type: spec
status: draft
area: engine/content
canonical: true
last-reviewed: 2026-08-16
---

# P5 – what is behind the door: four college years, and the one week that is not ours (16.08.2026)

**The phase that was scoped to put national-team competitions on the college calendar and found that
the recommended ones are eight years too young for it.**

`docs/plans/college-and-the-junior-ladder.md` §P5 set the brief:

> *"College today is a four-year silent skip that returns her with no ranking and one line of text.
> The door works; there is nothing behind it. … tasks #102 (college as a second act) and #108
> (national teams) are one mechanic, not two."*

---

## ⚠⚠ 0. THE FINDING THAT MOVED THE SCOPE, BEFORE A LINE WAS WRITTEN

**The two national-team competitions the research recommends building CANNOT happen during college,
and it is an age fact, not a judgement.**

| competition | real age band (`national-team-competitions.md`) | our college years |
| --- | --- | --- |
| World Junior Tennis (14U) | **11–14** (§2.1, born 2012–2015 for the 2026 edition) | 19 → 23 |
| BJK Cup Juniors (16U) | **13–16** (§3.1, born 2010–2013) | 19 → 23 |
| **the senior BJK Cup** | **14 and over** (§5.7, Reg 13.1.1) | 19 → 23 ✅ |
| the Olympics | 15 and over (§6.7) | 19 → 23 ✅ |

`national-team-competitions.md` §11.3 recommends **exactly the two rows that do not overlap** – *"Build
ITF World Junior Tennis (14U), or its 16U twin … Do not build the Billie Jean King Cup"* – and its
reason is sound on its own terms (§11.1.1: the junior bands *"are the only ones a new player would
ever meet"*, because they are live from the first season). **But the plan asked for the calendar of
the COLLEGE years, and the junior bands are behind her by then.** The fork is at nineteen
(`ENDINGS.forkAgeYears`); the 16U band closed three years earlier.

So "#102 and #108 are one mechanic" is **true, and the mechanic is the senior one** – the only
national-team competition whose real age band covers a college player, and the one the research puts
last. What makes that affordable is that §11's objection to the senior competition is an objection to
its **shape**, not to its existence: *"Four levels, promotion and relegation, a Nations Ranking, three
different tie formats"*. **None of that is built here.** §11.3's own recommended shape – *"the
letter"*, one week a year, arriving rather than chosen – is what ships, pointed at the age band that
college actually occupies.

⚠ **The junior bands are NOT built, and that is a deliberate cut with a measurement behind it** – see
§6.

---

## 1. PREDICTIONS – WRITTEN BEFORE ANYTHING WAS RUN

CLAUDE.md invariant 4. These are recorded before the bench, and §7 marks each one right or wrong.

| # | prediction |
| --- | --- |
| **P1** | **Every P0 column moves by exactly zero.** `tools/ladder-baseline.ts` never answers the fork (its own §46 note: *"THE FORK AT NINETEEN IS NEVER ANSWERED"*), so no career in the battery ever enters college, so nothing this phase adds is reachable from it. Any non-zero delta is a bug in the change, not a balance finding. |
| **P2** | **The frozen MAIN capture (41550 draws / `e6b0c709`) is unchanged.** The call-up draws on `seed:callup:<week>`, a purpose-scoped sub-stream, and every other new step is pure state. No pin update. |
| **P3** | **The four-year freeze already costs her development, and by a lot.** `coachWorksThisWeek` returns `false` for the whole freeze and it is the same predicate `growWeek` reads – so college is NOT free improvement, it is 208 weeks at the un-coached rate. I predict the measured rating delta over four college years is **positive but under half** of what four coached years produce. |
| **P4** | **She comes out of the freeze with a rank the engine can state, not with nothing.** I predict the "no ranking at all" line is prose rather than a state read, and that `world.kidRank` after 208 empty weeks is a real number at the dense floor of the zero-point group. |
| **P5** | **The early return is the whole feature.** I predict that once the freeze is one year at a time, three of the four years are a real question and the fourth is not – and that this is the correct shape, because the sport's own case (Shnaider, ~1 year) is the first boundary. |

---

## 2. TO BE FILLED

(measurements go here)
