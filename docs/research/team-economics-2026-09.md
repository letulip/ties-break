---
type: research
status: reference
area: economy
canonical: false
last-reviewed: 2026-09-13
---

# What a real tour team costs – the owner's 13.09 research, against our own registers

The owner brought the numbers mid-wave-5 with the commission «и вот это может нам пригодиться,
заодно ревью наших реалий можно сделать». This file holds both halves: his research condensed
with its sources, and the audit of our engine against it. ⚠ Nothing here is a ruling – every
divergence ends in a recommendation and waits for his word; anything that moves money moves it
bench-first (invariant 5).

## 1. The research, condensed (his sources)

**The head coach earns in two parts.** A fixed retainer paid weekly/monthly regardless of
results, sized by the PLAYER'S RANK – top-100 player ≈ €7k/mo (≈$90k/yr); top-10 ≈ €12–20k/mo
($150–250k/yr); a star name (Lendl, Becker class) $300–500k+/yr – plus **a share of prize money,
7–15%, most commonly 10%, of EVERY cheque** (Rublev pays Vicente fixed + 10% per tournament;
Kasatkina «10% от любого заработка на корте»). A Slam title ≈ $3M gross hands the coach ≈ $300k
in one envelope; a top coach's good season totals $1–1.5M. **The family pays ALL of the coach's
travel** – flights (often business), hotels, meals.

**The rest of the team is salaried**, rarely on a share (small title bonuses happen):

| seat | top-20 player's team, per year |
| --- | --- |
| fitness coach | $100–150k |
| physio | $120–180k |
| sparring partner | **$50–80k + full travel coverage** |

A full elite team runs **$600k–1M a year**.

Sources he cited: wod.guru/blog/tennis-coach-salary · reddit r/tennis njql0n · xsport.ua
(Svitolina) · sportsboom.com · tennis-i.com · mytennishq.com · forbes.ru 497161 · vedomosti.ru
905858.

## 2. Our registers, audited line by line

| reality | our engine today | verdict |
| --- | --- | --- |
| family pays all coach travel | `coachTravelFareFor` / `chargeCoachTravel`, one fare rule asked once per seat (round-22 ruling) | ✅ matches, by construction |
| weekly retainer regardless of results | `coachWeeklyCents` – hours × hourly band, billed weekly | ✅ matches |
| coach takes a prize share | `ECONOMY.staffShare.coach = { titleBps: 1000, finalBps: 500 }` – **10% of a TITLE cheque, 5% of a final, 0 otherwise** (`staffResultShareBps`) | ⚠ half-matches: our 10% exists but only at finishIdx 0/1; reality cuts 10% of EVERY cheque |
| coach base follows the PLAYER'S rank | our base follows the TIER the parent chose and her AGE band (`hourlyRateCents[tier][ageBand]`, elite peak $200–300/h) – her rank never reprices a signed coach | ⚠ diverges – see #3.1 |
| masseur/physio salaried, no share | masseur salaried with small title bonuses (`staffShare.masseur` 3%/1.5%); physio is a CLINIC SERVICE bundled with the coach rung, no salary of its own | ✅ ours is a designed line (insurance vs receipts, the decorative-staff ban) – keep |
| fitness coach as a seat | no seat – condition/development/planner own the numbers | ✅ deliberate: no free number for him to own (13.09 discussion, «два рычага на одно число» ban) |
| sparring partner $50–80k + travel | no seat yet | → the anchor for [the-form-and-the-sparring-2026-09](../specs/the-form-and-the-sparring-2026-09.md) §4 |
| elite team totals $600k–1M/yr | our full staff at the top ≈ $1.5–2.5k/wk + fares ≈ $80–130k/yr | ⚠ an order under reality at the very top – see #3.2 |

## 3. The two real findings, both his to rule, both bench-first

**3.1 The pro-era coach contract is the junior contract stretched.** Our hourly ladder is the
owner's own 29.07 research – per-hour INDIVIDUAL LESSONS, big-city, for the ages we simulate –
and it was the right conversion for 12–16 (coach-tiers spec: «the conversion is the whole job»).
But a top-100 pro's coach is not paid by the lesson: reality re-prices the SAME coach as the
player climbs (rank-banded retainer) and cuts him into every cheque. Ours never re-prices a
signed coach and pays him only at titles/finals. Candidate shape, if he wants it: the retainer
gains a rank band read off HER live ranking (renegotiation as a scene, not a slider), and
`staffResultShareBps` grows the every-cheque arm. ⚠ It would join `finalizeTournament`'s split
ORDER beside the kid's share (round 41 A1) – the pieces-re-add-to-the-cent discipline is already
built there, and the kid-share-never-shrinks-staff-cuts order is pinned. Cost: M, engine +
benches; nothing player-visible changes without his words.

**3.2 The top of our staff economy is soft against the top of our prize economy.** Ines banks
$2.57M in her best year – real top-tour scale – while her whole team costs ~5% of that; reality
pays 25–40%. Mid-careers (Alice: $113k banked at 18 against $64k of costs) are priced right; it
is only the ELITE tail where staff is a rounding error, which is exactly the tail where the
owner's «premium must hurt» law (round 7, re-affirmed round 41) wants pressure. 3.1's two arms
are the honest fix; a blanket staff-price raise would bankrupt the mid game the tiers ladder was
built to save (its own §1: 120/120 bankrupt before the ladder).

**Named and deliberately NOT taken:** a fitness-coach seat (no free number – decoration risk); a
separate physio salary (would erase the insurance-vs-receipts line that makes both hires
legible); an agent/manager seat (the parent IS the agent – round 29 P3 pays the parent the
manager's commission on sponsor cheques, which is this game's whole point of view).

## 4. Where the sparring number went

$50–80k/yr + full travel converts to ≈ **$960–1,540/wk + fares** at our weekly grain – carried
into the form spec's §4 as the rung anchor (below its middle rung, reality sits between our
rungs 2 and 3, which is the right neighbourhood for «a journeyman pro who travels with her»).
