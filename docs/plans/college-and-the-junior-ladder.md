---
type: plan
status: draft
area: engine/balance
canonical: false
last-reviewed: 2026-08-15
---

# The junior ladder, the age rules and the college fork – a staged plan (15.08.2026)

The owner, after the research landed: «давай внедрять всё, поэтапно, распиши пожалуйста план работ
для агентов… Кажется, что после этой правки у нас нужны будут отдельные перемеры карьер, потому что
текущие прогрессы потеряют актуальность – скорость и продвижение точно упадут.»

He is right about the slowdown, and that is the organising problem of this plan rather than a
footnote. **Five changes here all push the same way and they compound.** Ship them together and
"it got slower" is unattributable; ship them one at a time against a frozen baseline and each one
has a number.

## 0. What the research actually established

Everything below is sourced in `docs/research/college-and-the-junior-exit.md`,
`docs/research/national-team-competitions.md`, `docs/specs/acceptance-cuts-2026-08.md` and
`docs/specs/college-fork-2026-08.md`. Two facts do the most work:

**(a) In reality a junior cannot reach W75 at all unless she is world top 5.** The ITF's Junior
Accelerator Programme (2026 WTT Regulations, Appendix D) is the only reserved route above W15:

| year-end ITF junior rank | reserved access |
| --- | --- |
| 1 | 3 tournaments up to W100, 2 up to W75 |
| 2 | 2 up to W100, 3 up to W75 |
| 3 / junior GS winner | 1 up to W100, 2 up to W75, 2 up to W50 |
| 4–5 / junior GS runner-up | 2 up to W75, 3 up to W50 |
| 6–10 | 2 up to W50, 3 up to W35 |
| 11–20 | 1 up to W50, 4 up to W35 |
| 21+ | nothing above W15 |

W15 is the designated junior rung – three reserved main-draw places for combined junior ranking
1-100, minimum age 14 – and **there are no junior-reserved places at W35 and above at all.**

**Ours: 93% of careers enter a W75, first admission at age 17.2.** That single gap is what makes the
college door shut in 96% of careers (mean age 17.3), because `collegeClosedFromTier` is `w75`.

**(b) The WTA caps how much a teenager may play, by birth year** (2026 WTA Rulebook, Section X):

| age | tournaments that year |
| --- | --- |
| under 14 | 0 |
| 14 | **8**, of which at most 3 at W75+ |
| 15 | 10 |
| 16 | 12 |
| 17 | 16 |
| 18+ | unlimited |

Plus up to 4 "Merited Increases" a year, earned by Grand Slam / WTA 1000 direct acceptance **or** by
year-end ITF junior top 5 – the same top-5 gate the Accelerator uses.

⚠⚠ **"WE MODEL NONE OF THIS" WAS WRONG – P0 CHECKED BEFORE BUILDING AND FOUND THE RULE ALREADY
THERE.** `ECONOMY.entryCap` carries the AER with the rulebook's own rows (14→8, 15→10, 16→12, 17→16),
its own ledger (`proEntryWeeks`, schema v36) and a refusal in `medical.ts` that names the rule. I
wrote the plan without looking, which is the exact failure this repo keeps recording.

**What is actually broken is the WINDOW, and it is measured.** The allowance window is the SEASON
BLOCK while the limit is her AGE, so her sixteenth year straddles two allowances – and at sixteen she
plays **18.8 professional events against a limit of 12**. The cap demonstrably fires (J30 goes 2.9 →
5.2 at seventeen as the spent allowance reopens the junior rungs); it is the straddle that leaks.

**So P2's scope is the WINDOW, the Merited Increases and the COHORT – not the table.** That is a
smaller and much better-defined phase than the one this plan first described, and the leak it closes
is one of the biggest single contributors to «слишком быстро» anywhere in the research.

**(c) The college rule we encode does not exist.** "Amateurism" appears zero times in the current
NCAA Division I Manual. Pre-enrolment prize money was capped at $10,000/year plus expenses, and
since 15 April 2026 it is uncapped (the Brantmeier/Joint settlement, $2.02M). **Reality has never
closed the door on a RESULT, which is the only thing our rule reads.**

## 1. The order, and why it is this order

Each phase is a separate branch, a separate measurement and a separate merge. **No phase starts
before the previous one's numbers are in front of the owner.**

```
  P0  freeze the baseline            ← nothing changes; without this nothing later is falsifiable
   ↓
  P1  junior access (the Accelerator)  ← the biggest structural change; college's problem is downstream of it
   ↓
  P2  the Age Eligibility Rule         ← answers «слишком быстро» directly; compounds with P1
   ↓
  P3  the acceptance cuts, sourced     ← already measured Pareto-positive ALONE; must be re-measured after P1+P2
   ↓
  P4  the college fork (the combo)     ← its inputs have all moved by now; may need less than we think
   ↓
  P5  what is behind the door          ← college as a second act + national teams as its calendar
   ↓
  P6  the re-measure and the retune    ← the owner's own prediction, made checkable
```

⚠ **P1 before P4 is the load-bearing ordering.** Today the college door shuts because a normal
17-year-old walks into a W75. Once she cannot, the fork's problem may be mostly gone – so building
the combo first would tune a symptom and then have its ground moved underneath it.

⚠ **P3 after P1+P2, not before.** The audit measured the sourced chain (w35 700 · w50 330 · w75 300 ·
w100 240 · wta125 180) as Pareto-positive **in isolation**: end rank 280→204, counting book 365→441,
prize +$28k, survival 100% both arms. That measurement is against today's ladder. After P1 and P2 the
population reaching those rungs is different and the verdict may not survive.

---

## P0 – Freeze the baseline · ONE AGENT · no engine change

**Deliverable:** `tools/ladder-baseline.ts` + `docs/specs/ladder-baseline-2026-08.md`.

Capture, on the rebuilt policy (`POLICIES[1]`), n ≥ 90, 14 → 26:
* age and rank at first admission to every rung, and at first counting result there;
* rank at 17 / 19 / 21 / 25, and career-high;
* entries per season by rung and by age;
* prize money banked by 19 and career;
* the college door: closure rate, age distribution, fork-open rate;
* survival: bankruptcies, retirements, career length.

Every later phase reports against these columns and no others, so the diffs are comparable.

**Why an agent and not a note:** this is the only artefact that makes «скорость и продвижение точно
упадут» a measurement rather than an impression. If P1 slows her by four years, we need to be able
to say four rather than "a lot".

---

## P1 – Junior access: the Accelerator ladder · ONE AGENT · engine

**Files:** `src/engine/season/calendar.ts` (the rungs' junior access), `src/engine/world/ladder.ts`
(`tierOpenFor` / `acceptanceRank`), `src/engine/world/entryCaps.ts`, and a new junior-rank read.

**Build:**
1. **W15 becomes the junior rung it is in the sport** – open to a junior on her JUNIOR ranking, not
   on domestic points. Today `w15.enterPointBand` is `[120, MAX]` domestic points, which is our own
   invention; reality reserves three W15 places for combined junior ranking 1-100 and imposes no
   rank floor at all.
2. **Above W15, a junior's access is the Accelerator table** – keyed to her ITF junior standing, with
   the per-rung ALLOWANCES as counts, not as a permanent door. This is the change that stops a
   normal 17-year-old entering a W75.
3. **An adult entrant is unaffected** – once she holds a professional ranking she enters on it, as
   now. The Accelerator is a junior's route, not a ceiling on a professional.

⚠ **THE JUNIOR RANK HAS TO BE REAL FOR THIS TO MEAN ANYTHING.** We have an ITF track and a year-end
list; the Accelerator keys on YEAR-END junior rank, so the read is "her standing at the end of last
season", which is persisted history rather than a live fold. Check what exists before inventing it.

⚠ **AND THE STRONG-OUT RULES COME WITH IT, AS A SECOND MEASURED STEP – owner, 15.08: «да, делаем
тоже».** Reality bars WTA top-50 from every W event and top-150 from W15/W35. They live in the same
files as the junior access (`ladder.ts`'s `tierOpenFor` / `tierOutgrown`), so they cannot be a
parallel branch without a collision – **same agent, but a separate commit and a separate measurement
against P0.** Bundling the numbers would destroy the attribution this whole plan exists for.

⚠⚠ **AND THE OWNER NAMED THE PROPERTY THAT MAKES THEM SAFE:** «когда она вывалится из топ-50 и
топ-150 оно само откроется обратно». Exactly – this is a rank read, not a latch, so it self-reverses
the week she drops back. That is what distinguishes it from `tierOutgrown`, which is a one-way door,
and it is the assertion the guard should carry: **cross the line, lose the rung; fall back, get it
back**, both directions in one test. Nothing persists.

⚠ It is also the ONLY change in this plan that pushes her UP rather than down – it closes the rungs
she has outgrown and forces her onto the ones that pay. Measured separately, it may offset part of
P1's slowdown, which is another reason not to fold the two numbers together.

**Measure against P0:** age and rank at first W75 (today 17.2 / #279), share of careers ever entering
one (today 93%), and what she plays instead at 15-17. **Expected: a real slowdown. That is the point,
and the size of it is the finding.**

---

## P2 – The WTA Age Eligibility Rule · ONE AGENT · engine

**Files:** `src/engine/world/entryCaps.ts` (there is already an ITF annual cap there – read it first,
this may be the same shape), `src/engine/economy.ts` for the table, the entry gate, and the UI line
that has to explain a refusal.

**Build – REVISED after P0, and the table is NOT part of it (see §0(b)):** `ECONOMY.entryCap` already
holds the rows and the ledger. What is missing is
1. **the WINDOW** – the allowance runs on the season block, the limit runs on her age, and her
   sixteenth year straddles two allowances, so she plays 18.8 events against a limit of 12;
2. **the Merited Increases** – max 4/year, earned by Slam/WTA 1000 direct acceptance or year-end
   junior top 5;
3. **the "at most 3 at W75+" clause at 14**;
4. **the COHORT** – see below; this is probably the larger half.

⚠ **IT MUST REFUSE VISIBLY, AND EARLY.** A cap that silently drops events off the feed is the "why
can't I press this" the app has a standing rule against. She should see how many entries she has left
this year, the way a real player's team tracks it.

⚠ **THE COHORT NEEDS IT TOO, or the field she meets is playing a different sport.** `rival.ts` and
the conveyor build AI seasons; if only the kid is capped she is uniquely handicapped. Check what the
cohort does today before deciding – this may be the larger half of the work.

**Measure against P0:** entries per season by age (the cap bites hardest at 14-16), and the knock-on
to rank pace. **This is the phase that most directly answers «слишком быстро».**

---

## P3 – The acceptance cuts, corrected · ONE AGENT · engine + re-measure

**Files:** `src/engine/season/calendar.ts` only, plus its guards.

**Build, from `docs/specs/acceptance-cuts-2026-08.md`:**
* the sourced chain w50 330 · w75 300 · w100 240 · wta125 180 (w35 700 verified correct, slam 104
  verified exact – do not touch either);
* `j300` 0.40 → ~0.02: it is **20× out**, and the audit measured 0.02 as deleting the rung entirely
  (3.8 → 0.0 entries), so this one needs a size that is neither today's nor a deletion;
* ⚠ **the strong-out rules** – WTA top-50 barred from W events, top-150 from W15/W35 – if the owner
  wants them. They are real and sourced, and they are the mirror image of everything else here:
  every other change makes her climb slower, this one pushes her UP by closing the rungs she has
  outgrown. **Owner's call, separately.**

⚠ **EVERY CONSTANT HERE CARRIES AN OWNER RULING IN ITS OWN COMMENT.** Read the comment before
proposing to move the number. Where a comment records a decision, the verdict is "needs the owner"
however clear the source is – the agent's job is to put the source and the ruling side by side.

**Measure against P0 AND against P1+P2:** the audit's isolated verdict was Pareto-positive; the
question this phase answers is whether it still is once she reaches those rungs later and plays less.

---

## P4 – The college fork: the combo · ONE AGENT · engine + UI

Only now, and it may need less than it does today. **First re-measure the closure rate on the P1-P3
build**: if a normal junior can no longer reach W75, `collegeClosedFromTier` may already be doing
approximately the right thing for the wrong reason – and the honest fix is then to say so in the
comment rather than to add machinery.

**The combo, as the owner approved it (14.08 «комбо хорошо»):**

**(a) ⚠⚠ THE MONEY ARM IS CANCELLED – OWNER'S RULING, 15.08: «как стало, по идее нам вообще ничего не
надо делать здесь».** He chose to model the rule as it stands rather than as it was, and as it stands
there is no cap at all: the NCAA's $10,000-a-year limit was struck out by the Brantmeier/Joint
settlement on 15 April 2026, and "amateurism" appears zero times in the current Division I Manual.

**So money does not close the door. Nothing does.** That is not a simplification, it is what the
sport now says, and it collapses most of this phase: `collegeClosedFromTier` and `collegeStillOpen`
stop having a job. The measured shapes are recorded for the record – the real annual, net-of-costs
rule would have fired in 65 of 90 careers at median 19.0 against our rung's 86 of 90 at 17.1 – but
neither ships.

⚠ **WHICH TURNS THE FORK FROM A GATE INTO A CHOICE, and that is a design question the owner should
see stated:** if college can never be closed, the third door is always open, and what varies is
whether it is a good idea. The result arm below stops being an exception that reopens a shut door and
becomes the game's own advice.

**(b) A RESULT arm – now the only arm.** The owner's original intent, «развилка для показывающих не
очень хорошие результаты». **Measured: #200 separates the populations by 47 points**, and it is
already in the engine as `TIERS.wta250.acceptsRank`. With (a) cancelled this is no longer an
exception that reopens a shut door – it is what the card SAYS about her chances, and the door itself
stays open regardless.
⚠ For the record, money never was the discriminator even when it was going to ship: the weak third
banks $114,260 by 19 against the top third's $155,865, and the weak band's p75 sits above the top
band's p25. The populations interleave.

**(c) A WARNING BEFORE the entry that costs it**, not an explanation at the fork afterwards. Today
`ending.ts` states the silence as intent – "it is a PRECONDITION and not a WARNING" – and that is
what has to change: the tournament card says this entry costs the scholarship *before* she loses it.

⚠ **AND THE COUPLING MUST BE BROKEN WHATEVER ELSE HAPPENS.** `w75.acceptsRank` currently decides both
who may enter a W75 and the age at which the college ending stops existing. Two unrelated decisions
on one constant. After this phase the college gate reads its own rule and nothing else.

---

## P5 – What is behind the door · ONE OR TWO AGENTS · engine + content

College today is a **four-year silent skip** that returns her with no ranking and one line of text.
The door works; there is nothing behind it.

* **`docs/research/national-team-competitions.md` is the calendar for it**, and its headline is
  exactly why: ITF World Junior Tennis, BJK Cup Juniors, Tennis Europe Cups, the BJK Cup, the
  Olympics and the United Cup pay **no prize money at all** (ITF Juniors Reg 58 prohibits it
  outright). That is precisely the tennis an amateur can play without touching the money rule – so
  tasks #102 (college as a second act) and #108 (national teams) are **one mechanic, not two**.
* **Reality says the return is normal and often early**: Diana Shnaider left NC State after about a
  year and is inside the WTA top 15. Our four-year block is the wrong shape as well as empty.
* Calibration for how many come back at all: ~5-9 of the WTA top 100 have college ties (ITA's own
  count, 2 → 6 → 5 across 2022-24), and only ~4-5% of incoming D-I women hold any WTA ranking, with
  the typical ranked freshman around **#900**.

---

## P6 – The re-measure and the retune · ONE AGENT · measurement, then a decision

The owner predicted this and he is right: after P1-P3 the current progression numbers are stale.

**Re-run P0's whole battery** and put it beside the frozen baseline. Then the decision he will
actually face: **the ladder's own points may now be mis-sized**, because the same points table is
being climbed by a girl who plays fewer events, later, at lower rungs. Expect to find that:
* rank at 19 and 21 falls, possibly a lot;
* the counting book thins, because entries thin;
* the fork's population changes shape – more careers arrive at 19 with less banked.

⚠ **DO NOT pre-emptively compensate.** A slowdown is the intended result of modelling real rules; the
retune question is whether it overshoots, and that cannot be answered before it is measured. If a
compensation is needed, the honest lever is the points table or the calendar's density, not quietly
loosening the rules we just added.

---

## What no agent may do, in any phase

* Ship a balance change without a bench run and a spec recording predicted vs measured
  (`CLAUDE.md` invariant 4).
* Move a constant whose comment records an owner ruling without putting the ruling and the source in
  front of him.
* Restate a number from this repo's own docs as external evidence. `acceptance-cuts-2026-08.md`
  records what that cost: a whole table of "real" ranges entered on 02.08 printed as fact, was never
  sourced, and propagated through three specs each citing the previous one.
* Weaken or delete a guard. Re-aim it with a ⚠ note saying what moved and why.
* Combine two phases to save a measurement. The compounding is the reason this plan is staged.
