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

### 4a. ⚠⚠ THE ARMS, AND THE FIRST PAIR WAS WRONG – the lesson of 17.08 repeating within a day

CLAUDE.md's newest gotcha says a null result needs the same provenance check as a positive one: name
the commit each arm was built at, and confirm the reader is present. **The first pair here failed a
check that box does not yet name, and it produced a false POSITIVE rather than a false null.**

The obvious construction – A = the branch head before I started (`1bc270b`), B = my commit – is
wrong when **another agent is committing into the same branch while you work**. Between those two
commits sat two college commits, +183 lines of `collegeOffer.ts` and a new probe tool, so "A vs B"
would have credited the wild cards with somebody else's change. The shared checkout was also **dirty
with nine more of their files** while the first B arm was running.

**The construction that is right:**

| arm | built as | reader present? |
| --- | --- | --- |
| **A** | **`5737c40` with the engine commit `fd66d52` reverted** – wild card removed, everything else including their college work held identical | `git grep WILD_CARD -- src/` → **empty**, checked and logged |
| **B** | **`5737c40`**, clean | the constant **and every reader**: both gates, the AI fill, the snapshot, the badge |

Both arms ran **sequentially in one dedicated worktree**, so neither could see the other agent's
working tree. ⚠ And one more trap inside that: `git checkout -- src` restores from the **index**, and
`git revert --no-commit` had staged the revert – so a "restore B" that used it ran the A tree twice
and produced the byte-identical output that is exactly what comparing a thing with itself produces.
`git reset --hard <sha>` is the one that actually moves the tree.

### 4b. Instrument 1 – `tools/ladder-baseline.ts --seeds 10` (n 90)

| column | predicted | measured | verdict |
| --- | --- | --- | --- |
| `reach.slam` | +0 to +2 of 90 | **44 → 51 of 90** | ⚠ **bigger than predicted** |
| `entriesMean.slam` (per age band) | < +0.5 | **flat** – 0.7/1.0/0.9 → 0.8/0.9/1.1 at 21/22/25 | ✅ |
| `careerHigh.rank` median | within 2 places | **#94 → #95** | ✅ |
| every rung below the Slam | small non-monotone drift | **W500 reach 50 → 57**, W1000 26 → 26, J300 86 → 85, everything else flat | ⚠ see below |
| prize, career median | not predicted | $774,855 → **$919,715** | ⚠ noise-shaped, n 90, heavy tail |
| `survival.byEnding`, `college.*` | unchanged in shape | **unchanged in shape** | ✅ |

⭐ **THE ONE THAT LOOKS LIKE A FINDING AND IS NOT WHAT IT LOOKS LIKE.** `reach.slam` +7 and
`reach.wta500` +7 sound like the wild card letting seven careers in. It is not: the two cuts are #112
and #120, **eight places apart**, so "reached the Slam" and "reached the WTA 500" are nearly the same
event, and the Slam's *rank at first entry* barely moved – **#96/#105/#109 → #97/#106/#111, all
inside the 112 cut.** Nobody in this table entered a Slam on a wild card. What moved is the
population: a different Slam draw makes a different champion, which moves the merged table, which
moves who crosses a cut. **The entry RATE is flat, which is the number that would have risen if the
mechanic were letting her in.**

### 4c. Instrument 2 – `tools/big-rung-finishes.ts --seeds 6` (n 54)

**PER ENTRY** (the Slam row):

| | predicted | A | B |
| --- | --- | --- | --- |
| entries | up | 55 | **61** |
| lost her first match (R128) | **share rises** | 41.8% | **44.3%** ✅ |
| past R1 | – | 58.2% | 55.7% |
| QF+ | flat | 1.8% | 4.9% |
| title | flat | 0.0% | **0.0%** ✅ |

**PER CAREER**:

| rung | A entered | B entered |
| --- | --- | --- |
| WTA 125 | 41/54 | 45/54 |
| WTA 250 | 50/54 | 50/54 |
| WTA 500 | 19/54 | 23/54 |
| WTA 1000 | 10/54 | 12/54 |
| **Grand Slam** | **16/54** | **20/54** |

⭐ **THE PREDICTION THAT HELD, and it is the one the brief asked for in both directions: more entries,
each of them worse.** Per entry the Slam got harder (R128 41.8% → 44.3%); per career more careers got
there. Those are the two statistics moving in opposite directions, exactly as the last change did.

⚠ **No Slam title, no Slam final, in either arm.** The wild card buys a draw, not a run.

### 4d. ⚠⚠ AND THE HALF NEITHER INSTRUMENT CAN SEE – the finding that matters most

**Both tools walk careers through `tools/econ-bench.ts`, whose entry loop pre-filters the week with**

```
if (!tierOpenFor(world, e.tier)) continue      // econ-bench.ts, the ranking gate
```

**– the PER-RUNG gate, with no event id.** Every other rung answers identically either way. A Slam
opened by a home wild card does not: the bench skips the card before `enterEvent`, which would have
accepted it, is ever asked. **So everything in §4b and §4c measures the AI half only, and her own
card is not in either table.** A null there would have been a null *arm*, not a null result – the same
shape as the lesson in §4a, one layer further out.

⭐ **The fix is one argument, `tierOpenFor(world, e.tier, e.id)`, and it is deliberately NOT made in
this wave.** `econ-bench.ts` is shared measurement infrastructure and another agent was mid-run
against it; changing it under a running arm is the contamination this wave was already bitten by. It
is a follow-up with its own re-measure. **`tools/wild-card-reach.ts` reports the offer instead**,
without touching the shared tool or the entry policy.

⚠ **The game itself is not affected by this** – `snapshot.ts` gates every card on `entryStatus`, which
is per-event and does see the wild card, and `enterEvent` re-validates the same way. It is the
BENCH's pre-filter that is too strict, not the engine's.

### 4e. ⭐ How often a wild card is actually offered – `tools/wild-card-reach.ts --seeds 6`

n 54 careers × 676 weeks (13 seasons), policy `player`, measured at **`5737c40`**.

| | |
| --- | --- |
| careers offered at least one | **49 / 54 – 91%** |
| wild cards offered, total | **132** |
| ...per career that got any | **median 2**, max 6 |
| ...per career per season | **0.188** – one about every five seasons |
| home Slams on the calendar | 259 of 2,808 = **9.2%** (the weighted pool puts a US player's home Slam at ~7.9% per event) |
| weeks spent inside the window | median 429 of 676 |
| ⭐ **the ranks an offer came at** | **min #113 · median #174 · max #323** |

⭐⭐ **THE RANK COLUMN IS THE WHOLE DESIGN, MEASURED.** Every offer landed between #113 and #323 –
inside the window by construction, and exactly where a real home wild card goes. Not one went to a
player the list would have taken anyway (the first clause forbids it), and not one went to a #900.

⭐ **And the rate is a story rather than a remedy: about one every five seasons.** Nearly every career
sees one eventually, almost none sees several, and each one is a single draw at a rung where the
measured outcome is a first-round exit 44% of the time.

### 4f. The frozen careers

**ONE OF THREE MOVED** – `selfTravelling` (preset 0, policy player). The two grinder careers are
byte-identical. Per-key diff taken first; the A arm reproduces all three shipped constants at all
three schema versions, so none of the movement is the other agent's. ⚠ `rngMain` unmoved and the
frozen MAIN capture (41550 / `e6b0c709`) still verifies – the wild cards draw only on
`seed:wildcard:` and `seed:host:`. Full reasoning at `FROZEN.selfTravelling` in
`tests/coach-travel-edge.test.ts`.

⭐ **Why one and not three**, and it is the shape of the mechanic: a Slam draw is almost entirely
derived professionals, and `runAiTournament` writes no ledger row for a field pro – so a changed Slam
usually changes nothing any table can read. It bites only when a LIVE cohort player is in the draw.
**That is also the honest explanation of why the population effect above is as small as it is.**

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
| the badge's `v-if` is dropped (it renders unconditionally) | *says nothing at all when the engine did not flag it* |
| the tooltip's count stops reading `WILD_CARD.slots` | *explains itself in the engine own count, never a literal eight* |

The last two are **mounted** (`tests/component/season-screen.test.ts`), on the CLAUDE.md rule that a
source pin proves nothing about behaviour. The negative half is what makes the positive half mean
anything: a badge that rendered unconditionally would pass "it says wild card" and be a lie on every
card in the game.

⚠ **And the badge test's own first draft was wrong in a way worth recording.** It flagged
`snapshot.upcoming[0]` and rendered nothing – `calendarRows` is a WEEK-keyed list and does not
necessarily lead with the first row of `upcoming`, so "the first card" is a fact about the array and
not about the screen. Flagging the set and asserting *at least one* is the claim that is actually
about rendering.

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

---

## 6. THE GATE

Serialised, as CLAUDE.md's pool note requires, at `f732d26`:

| project | result |
| --- | --- |
| `unit --no-file-parallelism` | **147 files / 3,099 tests passed**, exit 0 |
| `component --no-file-parallelism` | **42 files / 489 tests passed**, exit 0 |
| `scripts/context-audit.mjs --check` | **ok** |

⚠ **`vue-tsc -b --force` is clean on every file this item touched.** The only type errors in the tree
during the wave were in `tests/college-offer.test.ts`, another agent's live edit, and they cleared on
their own. **Not run, deliberately and on instruction: `npm run e2e:fixtures` and `npm run test:e2e`.**
`test:sim` was not run either – nothing here touches the sim project.

---

## 7. ⚠⚠ THE INSTRUMENT WAS FIXED, AND §4c's HEADLINE IS SUPERSEDED

§4d recorded that `tools/econ-bench.ts` pre-filtered the week with `tierOpenFor(world, e.tier)` – the
per-rung gate, no event id – so **every bench built on that loop skipped the Slams a wild card opens**.
That is now fixed (`tierOpenFor(world, e.tier, e.id)`), and with it the numbers in §4c are wrong: they
were measured through an instrument that could not enter a wild card at all.

⚠ **`WILD_CARD.slots` is a master switch on both sides now, and it was not before.** `fillWildCards`
already returned early at `slots <= 0`, but *her* door read only the tier and the window – so at
`slots 0` a tournament holding no wild cards would still have admitted her on one. `wildCardWindow`
now refuses at `slots <= 0`, which is both the right semantics and what makes the arm below honest.

### 7a. The arms – a constant sweep, which is stronger than two trees

`npx vite-node tools/slam-difficulty.ts -- --seeds 12` · **n 108 careers × 676 weeks**, run in a
**dedicated worktree at `d21cabc`** because the shared checkout was transiently broken by another
agent's half-saved `collegeOffer.ts` (the run crashed inside it – a measurement against a
mid-edit tree is not a measurement).

Both arms are the **same bytes with one number changed** – `WILD_CARD.slots` 0 vs 8 – so no second
commit and no other agent's work can leak into one side, which is exactly what went wrong at §4a.
`slots 0` is verified to produce **0 wild cards of 685 commitments**.

### 7b. ⭐⭐ THE HEADLINE, RESTATED

| | slots 0 | slots 8 |
| --- | --- | --- |
| Slam entries that produced a scored result | 107 | 160 |
| **first-match loss rate** | **40.2%** | **51.9%** |
| careers ever entering a Slam | 34 / 108 | **66 / 108** |
| ...ever past R1 there | 29 | 50 |
| of all commitments, how many were wild cards | 0 of 685 | **230 of 934** |

**So the move is +11.7pp, not the +2.5pp §4c reported** – the blind bench was hiding almost all of it.
And the mechanic is far bigger than §4b suggested: **it nearly doubles the number of careers that ever
play a major** (34 → 66 of 108).

### 7c. THE OWNER'S QUESTION – «независимо от уровня скилла??» – and the answer is NOT the tidy one

**Was it the draw, or the mix?** Both were measured; **neither explains it.**

**THE MIX EXPLAINS ALMOST NONE OF IT.** Direct standardisation – arm A's own per-bucket loss rates
applied to arm B's mix of buckets – gives **42.1%** against arm A's own 40.2%. So of the +11.7pp,
**the composition shift accounts for about +1.9pp and the other ~+9.8pp is within-bucket.**

| her rank at entry | slots 0 lost R1 | slots 8 lost R1 | delta |
| --- | --- | --- | --- |
| #1-50 | 26.8% (n 41) | 43.9% (n 41) | **+17.1pp** |
| #51-104 | 49.0% (n 49) | 62.3% (n 61) | **+13.3pp** |
| #105-150 | 47.1% (n 17) | 53.7% (n 41) | +6.6pp |
| #151+ | – (n 0) | 29.4% (n 17) | – |

**THE DRAW DID NOT GET HARDER EITHER**, by the engine's own reading of the very same draws:

| her rank at entry | slots 0: 1st-match chance | slots 8 | opp rank 0 → 8 |
| --- | --- | --- | --- |
| #1-50 | 66.1% | **67.8%** (easier) | 77.0 → 83.8 (weaker) |
| #51-104 | 50.5% | **52.0%** (easier) | 63.9 → 64.7 |
| #105-150 | 51.2% | 44.0% (harder) | 67.9 → 58.3 |

⭐ **That is a genuine contradiction and it is reported as one.** In the two biggest buckets the
engine says her opening opponent got *weaker*, and she lost *more often*. Both numbers come from the
same runs.

⚠ **The leading candidate, stated as a hypothesis and NOT verified:** the preview is computed when she
**commits**, and the match is played weeks later. With wild cards she plays a fuller calendar – 934
commitments against 685 – so she arrives at more of them tired. Condition is not in the preview and is
in the match. **A fatigue-at-arrival column would settle it and is not built.** Until it is, "the Slam
got harder" is unsupported and so is "it is only the denominator".

⚠ **And her own draw provably never sees a wild card**: `computeShadowTournament` builds her field off
`seed:kidtour:` from professionals alone and never calls the wild-card pass. So whatever the residual
is, it is **not** wild-card entrants appearing in her bracket.

### 7d. What this does to §0's frame

§0 said a wild card buys a story and not progress, and that a material change in who reaches what
would be a finding rather than a success. **It is now a finding.** 34 → 66 careers of 108 ever
playing a major is not a story beat; it is a different game at the top. The rate is unchanged in
kind – `tools/wild-card-reach.ts` still says one offer about every five seasons – but the bench can
now *take* them, and the population effect is large.

**⚠ This wants an owner ruling before it is called finished**, and the two knobs are named: the window
(`entrantPctBand[1]`, ~#333 today) and `WILD_CARD.slots` (8). Neither is touched here.

### 7e. ⚠ THE FROZEN CAREERS DID NOT MOVE, AND THE SHARED CHECKOUT SAID THEY DID

`tests/coach-travel-edge.test.ts` went red in the shared checkout after the instrument fix – two of
three careers, with fresh hashes. **It was not the instrument, and it was not the wild cards.** At the
same commit (`9b3dc29`) in a **clean worktree** the file is **28/28 green** and the per-key diff for
preset 5 is byte-identical.

The main checkout was mid **save-schema bump to v52** by another agent – `migrations.ts`,
`protocol.ts`, `world.ts`, `endings.ts`, `sim.worker.ts` and a new `tests/fixtures/saves/v52.json`, all
uncommitted – and `resolveEndings` runs every tick, so their work reaches every career walked.

⭐ **No re-freeze was taken.** Re-freezing there would have baked another agent's in-flight state into
this branch's fixture under a message about wild cards – the same class of error as §4a, and the
third time in one session that a shared checkout produced a false reading. **The instrument fix moves
none of the three careers**, which is what it should do: they stop at 156 weeks (age 16.6), and a wild
card needs a professional ranking inside ~#333.
