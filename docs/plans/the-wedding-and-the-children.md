---
type: plan
status: draft
area: life
canonical: false
last-reviewed: 2026-08-23
---

# The wedding and the children – first sketch of the branch behind step 6

The owner, 23.08, asking for exactly this file:

> «со свадьбами надо будет отдельно потом расписать ветку, там тоже много всего может происходить,
> включая беременность и рождения детей (но это всё отдельный слой, отдельная задача, можно пока
> что на нее тоже первые прикидки детальный стек написать)»

⚠ **FIRST SKETCHES, NOTHING BUILT, AND NOTHING RULED THAT HE HAS NOT RULED.** What he HAS ruled
and this file inherits as law: weddings from 22+ and both romance trajectories (several, or one
long) first-class ([the-private-life-build.md](the-private-life-build.md) §6b, 23.08); she
decides, he reacts, the reaction moves `bond` ([the-private-life.md](the-private-life.md) §4a,
20.08); pregnancy does not ship before 3a–3c (design §3d). Everything else below is a proposal
with a question mark that belongs to him.

**Dependencies, named so nobody starts early:** the whole branch stands on the private-life build
plan's **waves 1–4** (`spirit`/`bond`, the reaction surface, the attachment slot, the break-up
curve) **plus step 6's marriage latch**. The wedding is the door to this file; nothing in it is
reachable while the slot cannot latch.

---

## 1. What a wedding changes – the spouse is a second adult with a claim

Design §3c's sentence is the whole thesis: ⭐ **marriage is where the game changes shape, because
a spouse is a second adult with an opinion** – and this sketch turns that into mechanics that
reuse what steps 1–4 built rather than inventing beside them.

* **The latch** – `attachment.latched` (step 6's schema move), entered through a beat, not a
  menu: SHE decides to marry; the parent's dialog is his reaction (bless / distance / oppose –
  the research digest's own triple, [life-events-motherhood.md](../research/life-events-motherhood.md)
  §2), landing on `bond` through step 2's machinery. The 22+ gate is his ruling and sits in the
  hazard, not the UI.
* **The name** – a latched partner finally needs one, so the fictional-name pass (no real
  surnames constructible – house law) lands here, as the build plan's step-6 row already says.
* **The opinion surface** – a small disagreement stream over schedule and travel: a planned
  distant swing, a season with no home weeks, a vacation skipped – the spouse's view arrives as a
  life beat (step 2's `lifeLog` machinery, a new `kind`), the parent answers, `bond` moves. ⚠ The
  spouse gets no meter of his own at this step – his standing IS the marriage's texture in the
  feed and the diary; a second tracked number is a later question (§6.1), not a free addition.
* **The claim on money** – the first outside claim on the career's economics. It READS the seam
  round 23 #18 already built (her prize share flows to her own account from eighteen); it does
  not invent a new one. Proposal: the claim is dramatic, not accounting – beats about money, not
  a second wallet with arithmetic. A household ledger split is exactly the kind of subsystem the
  design plan's §2 warns against building five of.
* **The wedding itself** – one beat, one feed row with `keep`, an album entry (the ending album
  already summarises a life – design §1's table), and a cost. A wedding is the first
  family-scale expense that is hers, not the career's; its price and who pays are open (§6.2).

## 2. The pregnancy fork – months out, and a return that is not guaranteed

Design §3d's law stands: ⚠⚠ the only beat in the layer that stops the career, built on the
college fork's machinery (ask – answer – a long absence – a return that must be earned), and not
before 3a–3c. The research is already in the repo and is the model's source:
[life-events-motherhood.md](../research/life-events-motherhood.md) – the ranking freeze for three
years post-birth, return ~6 months post-birth with full form at 12–18, the staged comeback
penalties (≈ −40% → −20% → −10% → full over 12+ months), sponsors partially lost during the
pause, and the documented failure mode of ramping straight onto big events instead of the
small-events ramp.

The sketch, in the fork's own shape:

* **The announcement is a beat, the decision is hers** – §4a's law holds at the layer's biggest
  moment: no menu of her choices, a reaction from him, and then the fork's mechanical questions
  (when to pause, how to plan the return) which ARE parent decisions, like the college fork's.
* **The absence** – months at the year-grain of the college freeze, not played week by week;
  `spiritShock` gains a kind for the postpartum window (the build plan's step-7 row already
  reserves it).
* **The protected ranking** – modelled from the freeze rule: her entry standing is preserved for
  a bounded window, but form is not – the staged penalties are the comeback's honest price, and
  the ranking decay OUTSIDE the protection window is the hard half the build plan names.
* **The ramp** – the research's wrong-ramp failure mode becomes the strategy content of the
  return: small events first is the honest path, wildcards straight to big draws the documented
  trap. The game already prices entry ladders; the return reads them, it does not fork them.

## 3. Children as ongoing state, not a system

A birth is a beat; a child is STATE – present every week after, forever. The cheap-and-true shape,
mirroring the attachment slot's own discipline:

* `world.children: { bornWeek: number }[]` (names, if ever, through the same fictional-name
  pass) – append-only, its own schema move;
* what it changes weekly is SMALL and named: the travel calculus (a seat, a reason to decline the
  long swings – reading the travelling-team seams, not duplicating them), a standing cost line,
  and a diary/feed texture that never goes away;
* ⭐ the research digest's one permanent effect is worth keeping as the candidate: a possible
  **permanent mental-resilience bonus after the return** («priorities shift») – the single place
  this branch is allowed to touch a skill-adjacent number, and only with a bench;
* a second child is the same machinery re-entered (the research: documented multi-return careers,
  est. 20–30% success) – no new system, a lower hazard;
* ⚠ no child-raising loop. The player is already raising a daughter; the game does not recurse.
  The child is texture, claim and consequence – never a second career sim.

## 4. The owner's standing open question – both outcomes, as fork answers

From the old plan's §5.2, still his to rule, restated so this file carries it: **does the career
survive motherhood in OUR model?** The standing recommendation (the build plan's open question 2)
is BOTH, as fork answers – a protected-ranking return that is real but not guaranteed (~40%
return successfully, per the research), and «she does not come back» as an ending in its own
right, with the album treating it as a life completed rather than a career failed. The research
supports both happening in life; a game that picks one is thinner than the truth. Decide at the
fork's build, not before.

## 5. Steps, sized, in dependency order

One branch per wave, house law; every step reads the ones above it, and the whole stack reads
private-life waves 1–4.

| # | step | size | needs | stop point |
| --- | --- | --- | --- | --- |
| W1 | courtship states + the latch + the wedding beat (the 22+ gate, the name pass, the album row, the cost question ruled) | **M** | private-life waves 1–4 | a career can reach a wedding; the feed and album carry it |
| W2 | the spouse's opinion surface (schedule/travel beats through `lifeLog`) + the money claim as beats | **M** | W1 | reverting a reaction changes `bond`, measured – step 2's own gate re-used |
| W3 | the pregnancy fork: announcement beat, the pause, the absence at year grain | **L** | W1 (not W2), design §3d's 3a–3c rule | a career can pause; `spiritShock`'s new kind fires; input-independence holds |
| W4 | the return: protected ranking, staged form penalties, the small-events ramp | **M–L** | W3 | a bench career returns through the window; the wrong ramp measurably fails more often |
| W5 | the child as state: weekly texture, travel calculus, the resilience-bonus question benched | **M** | W3 (W4 for the bonus) | the child persists across saves; the bonus ships only with predicted-vs-measured |

⚠ Stop after any step – the private-life plan's own law extends here. W1–W2 alone are a complete
marriage; W3–W5 are the children's own layer, separately shippable, exactly as his ask frames it
(«отдельный слой, отдельная задача»).

## 6. Open questions for the owner – each with a recommendation

1. **Does the spouse get his own tracked standing, or does `bond` stay the only memory?**
   Recommendation: no second number at W1–W2 – the marriage's health lives in the beats and the
   diary's bands; a `spouseBond` is a real candidate for the day the disagreement surface proves
   too thin, and adding it later is an append-only schema move.
2. **What does the wedding cost, and who pays?** Recommendation: a real, visible sum in the
   family ledger (the game's numbers are honest everywhere else), sized on the bench against the
   wealth corridors – but priced as one event, never a recurring drain; the recurring texture
   belongs to the child, not the party.
3. **Can the marriage end?** The design plan never says divorce and this file will not invent it
   unprompted – but the slot's own physics (step 4's hazard) make «the latch can break» a
   question that will come. Recommendation: not in W1–W5 at all; raise it only after the layer
   has lived in playtests.
4. **Does pregnancy have an age window of its own?** The research puts first children at 24–35.
   Recommendation: hazard shaped by that window rather than a hard gate – the 22+ wedding gate
   plus the fork's own «not before 3a–3c» already keep it out of the junior years.

---

Sources: [the-private-life.md](the-private-life.md) ·
[the-private-life-build.md](the-private-life-build.md) ·
[life-events-motherhood.md](../research/life-events-motherhood.md) ·
[the-travelling-team-2026-08.md](the-travelling-team-2026-08.md) ·
[endings-and-the-album.md](../specs/endings-and-the-album.md)
