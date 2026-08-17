# The wild cards – eight places a Slam gives away

**Round 21 item 2b, 17.08.2026.** The owner, verbatim, at item 2: «112 и надо подумать про wild card
8», and earlier, in the sentence that shaped the marker: «а 8 wild card как раз можно как-то отмечать
тоже и на карточку турнира тогда пометку ставить "wild card"».

**On `wave/round21`, after item 2's `acceptsRank` 104 → 112** (`the-250-is-not-a-1000-2026-08.md` §6).
The design was costed the day before and deliberately not built – `round21-measured-2026-08.md` §5e
and `docs/decisions.md` "THE WILD CARDS – SHAPED AND COSTED, DELIBERATELY NOT BUILT". This builds the
shape recorded there, unchanged.

⚠ **The age grid is not restated here.** It is written out once, in
[`college-is-its-own-branch-2026-08.md` §0a](college-is-its-own-branch-2026-08.md).

---

## 0. THE FRAME, BEFORE ANY NUMBER: IT IS NOT A FIX FOR A STALL

⚠⚠ **There is no stall to fix, and it was measured before this was built.**
`round21-measured-2026-08.md` §5b, 14 careers × 12 seasons on the professional-calendar arm:
**0 of 14 careers had a career best inside the refused band.** The band costs a median of fourteen
weeks at the shipped 112 and nobody is stuck behind it.

**So a wild card buys a story, not progress**: one home crowd, one draw she had not earned. The
measurement below is therefore aimed at the opposite question from the usual one – not "did it help"
but **"did it move anything it should not have"**. A material improvement in who reaches what would
be a finding to report, not a success.

---

## 1. WHAT A WILD CARD IS

A Grand Slam's 128 is **112 direct acceptances + 8 qualifiers + 8 wild cards** (2026 Grand Slam Rule
Book – the same line `TIERS.slam.acceptsRank = 112` is read off; the book publishes three permitted
compositions and 112/8/8 is the one that shipped). We model the direct-acceptance line exactly. These
are the eight the tournament **gives away**.

**Qualifying is still not modelled and is not modelled here.** A qualifier earns her place in a draw
we do not run; the eight remain the only one of the two routes that is expressible.

### 1a. Who gets one – the home nation, and why that ground

Reality uses three grounds. Two are expressible and one is not.

| ground | verdict | why |
| --- | --- | --- |
| **a home player** | ⭐ **BUILT** | no venue machinery exists anywhere in `src/`, but a host nation is derivable from `(seed, event.id)` at **zero persisted bytes**, and every player already carries `nation` |
| a young prospect | **not built, deliberately** | `juniorReservedPlace` is that idea one ladder down and `ON_RAMP` already holds two places in every W draw for that population. A third route with the same purpose is drift, not coverage. |
| a returning name | ⚠ **NOT EXPRESSIBLE – dropped explicitly** | "she used to be #12 and has been away" needs a memory of a rank a player no longer holds. **Field pros persist zero bytes** – they are re-derived per season from `seed:field:<n>` – so there is nowhere for a former ranking to live. It is unrepresentable in this population model, not a missing feature. Said once in `WILD_CARD`'s own comment so the next reader does not try. |

⭐ **The home-nation ground is the one with a cap inside its own definition**: at most one Slam a
season can be anybody's home Slam. It needs no second tuning number to stop it running away, and it
reads as a reward rather than a gift.

### 1b. The rule, in two clauses and no new tuning number

`wildCardWindow(tier, rank, total, accepts)` – **written once, read by both sides.**

1. **Outside the rung's acceptance cut.** A direct acceptance does not need one, and counting her as
   having used one is the single way the marker could become a lie.
2. **Inside the rung's own entrant band ceiling** (`entrantPctBand[1]`) – the exact expression
   `fillOnRamp` already keys its candidates on. It is what stops the eight places going to a #900.

At the shipped numbers that window is roughly **#113 to #333** of a ~1,799-row merged table.

⚠ **It does not close the refused band and is not trying to.** Only #128 would, and #128 is
"everybody in the draw size gets in", which is not a door at all.

### 1c. She can receive one, on the same rule as everybody else

Not a promise in a comment – **the absence of a second implementation.** `homeWildCardPlace`
(world/ladder.ts) and the AI draw's eight held places call **one function**. Her clauses are the same
two, read against her own rank in the same table, plus the `kidPoints > 0` guard the acceptance cut
already carries for the same reason (unranked is not rank one).

---

## 2. HOW IT IS BUILT – one mechanism, two configurations

⚠⚠ **THE EIGHT HELD PLACES ARE `fillOnRamp`'S EXACT EXISTING SHAPE, and it is called a second time
rather than reimplemented.** Hold N of the draw, key one draw per candidate off the band, drop the
**last direct acceptances** to make room. Two ways to hold a place in one draw is how the next
inconsistency gets written – and the sport itself does it this way: qualifiers and wild cards are two
reserved routes filled by one entry-list process.

The call site (`fillWildCards`, world.ts) decides four things and `fillOnRamp` obeys them unchanged:

| decision | why |
| --- | --- |
| **the pool is the host nation's players** | `fillOnRamp` has no idea what a nation is and is not being taught one – the home-nation ground is a filter on the pool it is handed, the same seam `universeForTier` uses |
| **the pool is the event's whole universe** (cohort ∪ derived pros) | at #113–#333 of a 1,799-row table almost everybody is a professional; drawn from live juniors alone this would be `ON_RAMP` under a new name |
| **the door is inverted** | `OnRamp.admits` normally means "the rung accepts her"; here it is `wildCardWindow` – "the rung refused her and she is still of the level" |
| **its own sub-stream** | `seed:wildcard:<eventId>`, so the field the week already selected off `seed:aitour:<eventId>` is bit-for-bit the field it selected |

**Order: after the on-ramp pass.** Both passes drop the last direct acceptances, so whichever runs
second can displace what the first put in. The entry list's own order is places-close-then-wild-cards,
and it is very nearly moot: the on-ramp's candidates must clear `doors.at('slam')`, i.e. sit inside
#112 of a table holding 1,600 professionals, which a live junior essentially never does.

⚠ **Her own draw is not touched.** The shadow bracket she plays in (`seed:kidtour:`) fills from
professionals alone – the seam `fillOnRamp`'s own ⚠ SCOPE box already names. Widening it moves her
measured difficulty at every W rung and is a second change wanting its own measurement.

### 2a. The host nation – derived, and the one gap it had

`hostNationOf(seed, eventId)` is one draw on `seed:host:<eventId>`, **never MAIN**, re-derived at the
call site and persisting nothing. The event id is `${year}-w${week}-${tier}`, so a given Slam of a
given season is played in the same country however many times anybody asks, across a save/load.

⚠ **`HOST_NATIONS` is `NATION_POOL` plus the playable codes that pool lacks, and the second half is
the whole reason it is not just `NATION_POOL`.** `NATION_WEIGHTS` is the distribution the *world's*
players are drawn from; the onboarding wizard offers a partly different list of twenty-four countries
to the *player*. **`BY` is in the wizard's list and not in the population's** – so a player from there
would have had a mechanic that silently never fires, the quiet dead branch rather than a refusal he
could read. `tests/season/wildCard.test.ts` pins the two lists against each other **by source**,
because the engine may not import a component (invariant 1) and a list that can drift needs a guard
that cannot.

⚠ **`NATION_WEIGHTS` itself is untouched and must stay so**: `makeJunior` spends one `pickInt` against
`NATION_POOL`, so appending to it would re-map every existing seed's entire field.

⚠ **A stated deviation: the real four majors do not rotate and ours do.** We name no city and no
country anywhere in the UI, so a fixed four would buy nothing a player could see while denying the
beat to twenty of the twenty-four countries he may pick. The weighting still puts most home Slams in
the deep tennis nations.

### 2b. The marker

`UpcomingEvent.wildCard` – a pill on the Season event row reading **wild card**, with a tooltip that
quotes `WILD_CARD.slots` rather than a literal eight.

⚠ **No schema bump, no migration, no golden fixture.** The host nation is a pure function of
`(seed, event.id)` and her rank is folded from the ledger, so the flag is derived at snapshot time
exactly like `eligible` and `outgrown` beside it.

⚠ **No dialog was added or lengthened, so no new 375×667 fit assertion is owed.** The owner asked for
a marker on the tournament card and that is where it is; `TourBriefingDialog` is the once-per-career
*mandatory-regime* briefing and a wild-card line does not belong in it.

---

## 3. THE GUARD THIS COULD HAVE BROKEN, AND WHY IT WAS RE-AIMED RATHER THAN DELETED

`tests/rankingGate.test.ts` holds the R10-5 contract: **the calendar and the turnstile never
disagree.** Every other clause on this ladder is a fact about a **rung**; the wild card is the first
that is a fact about **one tournament** – this Slam is played in her country, the other three are not.

So `tierFloorOpen` / `tierOpenFor` gained an **optional `eventId`**:

* **absent** (`Snapshot.tierOpen`, the coach market's week scan, `tierOutgrown`) → exactly the
  acceptance cut those callers read before. The per-rung summary stays honest: *the Slam takes the
  top 112*.
* **named** (the turnstile) → the third door is offered, in the same order `entryVerdict` offers it.

**Both guards now name the event, which makes them compare like with like – strictly stronger than
what they asserted before.** Comparing a per-rung `tierOpenFor` against a per-event `eligible` would
be comparing two different questions and calling the difference a bug.

⚠ The clause is **Slam-only**, so every other rung's verdict is byte-identical by construction.

---

## 4. MEASURED

*(filled in below – predictions were written before either arm ran, and each arm's commit is named.)*

---

## 5. THE MUTATIONS

Every claim in `tests/season/wildCard.test.ts` was mutation-proved. The four that were run, and the
tests each one reddened:

| mutation | tests reddened |
| --- | --- |
| `wildCardWindow` drops clause 1 (a direct acceptance may hold one) | *refuses a direct acceptance – she does not need one* |
| `hostNationOf` returns a constant | *differs by event and by seed – a career is not one long home tie* |
| `HOST_NATIONS` drops the playable-gap half | *contains every code in OnboardingWizard COUNTRIES* · *never widens itself by reading her country* |
| `homeWildCardPlace` drops the nation clause | *opens the door when the Slam is at home and she is inside the window* |

⚠ **And one assertion was found vacuous by its own failure before it was fixed** – the injury case
asserted "blocked for a reason other than the list" against a career the **list** was refusing anyway,
because `seatHer(world, 30)` happened to land outside the window on that seed. `seatInWindow` now
searches the point total that seats her between the cut and the band ceiling and **throws if none
does**, so a positive case cannot quietly become a vacuous one.

⚠ **A second thing the tests found, and it is about the mechanism rather than the mechanic.**
`fillOnRamp` de-duplicates **only** through `booked`: a pool that overlaps the field it is raiding
will hand a place to somebody already in the draw. The first cut of the held-places test came back
*"8 dropped, 7 added"* – one player twice. **The engine cannot do this** (`fillWeekOnRamps` seeds
`booked` from every field the week has resolved, this event's included – `resolveDoubleBookings`
writes a row per drawn event on both its branches), but the property was load-bearing and undocumented.
It is now pinned.
