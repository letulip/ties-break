---
type: spec
status: draft
area: economy/academy
canonical: false
last-reviewed: 2026-08-10
---

# The academy invites her, and bills her family

**Design proposal, nothing built.** It resolves a contradiction that has been sitting in the repo since
round 5 without anybody noticing it was one.

## The contradiction

Round 5's list carries an unchecked item: **«Academy invitation (~$55k/yr) as the wealthy-track money
sink»**. The round-ledger audit of 10.08 could not tick it and could not honestly call it open either,
because the code says something that looks like its opposite:

```ts
needFactor: { working: 1, middle: 0.6, wealthy: 0 }   // ECONOMY.academy
```

A wealthy family gets **zero**. Read as "who gets invited", that is the academy refusing the richest
girl in the game – which is neither the round-5 item nor anything that happens in tennis. The owner,
10.08:

> «Всех же могут в реальности пригласить, ведь так? Просто уровни разные, как мне кажется.»

He is right, and the fix is not a number. **The two entries are not in conflict; they are two halves
of one mechanic that only one half of was built.**

## The rule this turns on

> **The invitation is about HER. The terms are about THEM.**

An academy scouts a girl because of her results and her ceiling. What it then *offers* depends on
what her family can pay – and in both directions. A family that cannot pay is offered a scholarship;
a family that can is offered a place, at full price. Same letter, same trigger, different second
paragraph.

So `needFactor` is not "who gets in". **It is what share of the bill the academy carries**, and zero
is a true and useful number: a wealthy family is invited and pays for itself.

## What is already right, and must not be touched

`reviewLevel` (`src/engine/academy.ts`) is the invitation and it is already about her alone:

* `resultScore(rank)` – her ranking against `rankFull: 40` / `rankNone: 130`;
* `scoutScore(ceiling)` – her potential against the measured population band `[56, 70]`;
* `scoutWeight: 0.5` – half her results, half the scout's eye;
* `ageBand: [13, 18]` and `minEventsPerYear: 3` – she has to be the right age and actually be playing.

**Not one of those reads the family's money**, and that is the design working. The defect is
downstream: `needFactor` multiplies the LEVEL rather than the TERMS, so a zero erases the
relationship instead of pricing it.

## The change, in three parts

### 1. Separate the invitation from its terms

`reviewLevel` keeps deciding **whether** an academy is interested and **how much** it wants her.
`needFactor` moves off that verdict and onto the offer's money. Two fields where there is one:

* **`level`** – how much the academy wants her. Hers, background-blind.
* **`coverShare`** – how much of the bill it carries. `needFactor(background)`, unchanged numbers.

A wealthy family then reads `level 0.8, coverShare 0` – *wanted, and paying* – which is a sentence
the current shape cannot say at all.

⚠ **This is a schema change** and it is the three-part move (CLAUDE.md invariant 3): bump, an
append-only migration, a golden fixture. A career saved before it has one number; the migration
gives it `coverShare = needFactor(background)`, which reproduces today's behaviour exactly, and
that byte-identity is the thing a test has to prove rather than assert.

### 2. The place, which is what a wealthy family is buying

Today the academy pays: `travelCoverShare` against `ECONOMY.academy.travelCover`, and
`kitGrantCents(level)`. Both are **discounts**. A family paying full price is not buying a discount,
so the offer needs something to be.

**It buys the training environment, and the game already prices one.** `coachFactor(tier, fit)` and
`facilityRateCents(age, tier)` are a ladder from `self` to `elite`, and the wealth corridor already
says the same rung costs different money in different markets. **An academy place is a rung she could
not otherwise reach, bought as a season rather than as a weekly hire.**

That gives the round-5 item its shape: **~$55k a year, and what it buys is a rung.** It is a real
decision because the same money would buy roughly a season of a `high` coach hired weekly – so the
question is whether a squad, a court and a fixed environment beat a person you chose.

⚠ **What it must NOT be is a fourth number multiplied into growth.** `coach-as-load-manager.md`'s
standing rule holds: what moves is who decides and what they have an opinion about, never a new
system bolted beside the old one. The place sets her coach rung and her court; it does not add a
multiplier of its own.

### 3. The letter says which one it is

One offer kind, two second paragraphs. The scholarship letter is the one that ships today. The place
letter names the fee, names the rung, and is refusable like every other offer – it arrives through
`world.offers` and answers to `acceptOffer` / `declineOffer`, so nothing new is invented to carry it.

⚠ **And it can be REFUSED, which is the point.** A wealthy family that says no keeps its money and
its chosen coach. Today the academy is a thing that happens to you; this makes it a thing you answer.

## What this is not

* **Not a difficulty lever.** The trigger stays background-blind, so it cannot become "the rich get
  scouted". If a measurement shows wealthy careers reaching the academy more often, that is a
  finding about `resultScore` and it belongs to a different wave.
* **Not a second subsidy.** `need-not-background-2026-08.md` has just moved the local-sponsor cameo
  off backgrounds and onto need; this does the same thing one layer up, in the other direction. The
  two must be measured together or the 2x2 will move for a reason nobody attributes.
* **Not a fix for #90.** Making academy support LEGIBLE is a separate open item, and the bench still
  reads only **$948 of `academy` income across four seasons** while 50 of 50 careers hold a
  scholarship – because it pays as a discount on travel and never as a line. That stays true after
  this change and gets worse: a place is a bill, so the family will see the money leave and still not
  see what arrived.

## The ship rule, authored before anything is built

`tools/two-cells.ts` is the instrument – background x coach, 50 careers, four seasons – and it now
has to grow a fifth cell: **a wealthy family offered a place.**

1. **The invitation rate must not move by background.** Measured share of careers ever offered an
   academy, per background, before and after: the three numbers must be within noise of each other
   and of today's `working` figure. If they diverge, `needFactor` is still leaking into the verdict.
2. **A refused place must cost nothing.** A career that declines ends within noise of one never
   offered.
3. **An accepted place must be a real trade, not a tax.** Against the same seed with a weekly `high`
   coach at comparable spend: end funds within one season's fees, and a ranking difference that is
   nameable in one direction or the other. **If it is strictly worse it does not ship**, and if it is
   strictly better it is not a decision.
4. **The scholarship arm does not move.** `working` and `middle` end funds, cameo share and ITF rank
   all within noise of today. This wave is additive at the bottom of the ladder or it is wrong.

## Open, and the owner's to answer

1. **What rung does a place buy, and is it the same rung for everyone?** A fixed `high`, or one that
   follows `level` – the girl the academy wants most gets the best environment.
2. **Does a place end?** A kit deal has a term and a review; the scholarship is re-decided every
   season by `reviewAcademy`. A place probably should be too, and a family dropped after a season is
   a real story – but it is also a second review to write.
3. **$55k is round-5's figure and is not yet checked against this game's money.** A `middle` family's
   whole parent income is ~$22k a season. So either the figure is wrong for our scale, or a place is
   a wealthy-only offer by arithmetic rather than by design – which would be a fine answer, stated
   rather than stumbled into.
