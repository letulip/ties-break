---
type: spec
status: current
area: engine/balance
canonical: false
last-reviewed: 2026-08-22
---

# The shoot weeks: what an endorsement costs in recovery (22.08.2026)

Ad step 2 of `docs/plans/the-face-and-the-court.md` §6, built to the owner's ruling of 22.08:

> «съемки должны быть иногда и это надо как-то прописывать и отражать потом в свободных неделях,
> соответственно и восстановления на тех неделях должно быть чуть меньше»

and the sized version he approved («утверждаю, для начала точно ок»): **Quiet Hour's $20,000 /
12-month term carries exactly 2 shoot weeks** – in-season, named in the letter at the signature,
each recovering **like a travel week rather than a rest week** (his own §4a design: no second
calendar, no blocking – the week stays hers, what changes is how much of it she gets back).

The mechanism, in the engine's own figures (`ECONOMY.condition`):

| week kind | recovery banked |
| --- | ---: |
| rest / free week | `recoveryBase` 8 + slider 0-2 (grind +8 / balanced +9 / light +10) |
| practice week | 8 (slider forfeited) |
| travel / tournament week | `matchWeekRecoveryBase` **0** |
| **shoot week (new)** | **0 – the travel figure** (physio +1 and blackout +1 still ride on top, as on a real trip) |

A tournament on a shoot week does **not** stack a second malus: the week already recovers at the
travel figure and the match drain (at `finalizeTournament`) is what makes it the worse week – «she
simply recovers worse», the ruling's own words. A shoot week the college freeze swallows **lapses
silently** – no penalty, no makeup week («мы ни за что не наказываем», plan §4c).

---

## 1. Predicted

- One shoot week on a free week with a real deficit costs the whole rest week it would have been:
  **−9** at the balanced default plan (8+1), −10 light, −8 grind.
- At the condition ceiling the cost clamps to **0.0** – the summer block's own precedent
  (`docs/specs/`… fatigue-reprice §3): foregone recovery is invisible on a fresh body.
- On a tournament-collision week: **0** extra (no stacking by design; the drain is the cost).
- Per term: 2 shoots ≈ **up to −18/−20 condition points** of foregone recovery when both bite ≈
  2 rest weeks ≈ 1.5 average professional events of drain (~12.5/event, fatigue-reprice §1) –
  felt, not season-breaking. **Weeks lost: 0 by construction** – nothing blocks, refuses or
  displaces an entry.
- An off-season landing: impossible by construction (the choice filters `isOffSeasonWeek`;
  plan §5.2 – an off-season cost is free money wearing a cost's clothes).

## 2. Measured (`npm run bench:adshoot`, 12 careers, signed-vs-refused twins, byte-identical MAIN)

**§1a training-only careers** (never compete): every shoot reads **0.0 at the ceiling** – exactly
the summer block's clamp row. A girl who never races never feels the deal, which is §3's own claim
about who this cheque is for, working as designed.

**§1b racing careers** (enter everything the gate allows, ~26-33 events/term):

| reading | predicted | measured |
| --- | ---: | ---: |
| shoot on a free deficit week | −9 (balanced) | **−9, every such case (6 of 12 careers at shoot 1)** |
| shoot on a tournament/travel week | 0 (no stacking) | **0, every such case** |
| shoot at the ceiling | 0 (clamped) | **0** |
| entered events, signed vs refused | equal | **equal wherever injury paths did not diverge (27/27 … 33/33)** |

End-of-term deltas drift (−6…+14) once a −9 dent moves the injury threshold and the twins live
different seasons – the condition system propagating the cost, not harness noise. Late-term
`played` differences (27/29) are that same divergence, never a blocked week.

**§2 the construction, 20,000 signature points**: off-season **0**, adjacent **0**, before the
4-week lead **0**, outside the term **0**, short draws **0**; spacing min 2 / median 24 / max 47.

## 3. The bug the bench caught (and why the first run measured nothing)

The first bench run returned a clean zero on every arm – and the null-result law (CLAUDE.md) held:
the arm did not contain the reader. Two findings, both fixed:

1. **The harness**: a pending tournament only commits its matches – and their drain – once every
   round is *revealed*; the draft closed reveals unfinished, so no kid match ever landed and both
   arms rode the ceiling. Fixed in the bench (`revealTournamentRound` before `closeTournament`).
2. **The engine leak, live**: with the reader present, a medically-withdrawn entry on a shoot week
   was refunded the full rest week (+9) – three sites (the medical withdrawal and `skipEvent` in
   `world.ts`, the practice cancellation in `world/planner.ts`) re-derived "what a match-free week
   pays" without asking about the shoot. All three now read **one oracle**,
   `withheldFreeWeekRecovery` (`world/medical.ts`), which pays 0 on a shoot week – the travel
   figure was banked and the travel figure is what that week's rest is worth. Non-shoot arithmetic
   is unchanged expression-for-expression, so shipped condition traces do not move
   (`tests/condition.test.ts` 41550 / e6b0c709 green; `tests/coach-travel-edge.test.ts`
   byte-identical and green).

Pinned in `tests/ad-offer.test.ts` (step 2.2b) with mutation-verified arms.

## 4. What is deliberately NOT built

The bigger asks the owner approved as a ladder – campaigns 3-4 shoot weeks, global houses 5-6, a
cap of 6 a year – are **recorded in the plan doc only** (`the-face-and-the-court.md` §4a-1). This
catalogue has one house and its 2. Fame, refusal reasons, her own account, obligations that
outlive form: steps 3+, paused upstream with the private life.
