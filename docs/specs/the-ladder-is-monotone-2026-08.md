---
type: specification
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-16
---

# Three things a constant should not decide for another one – the empty-week census, the sponsor gates, and two inversions (16.08.2026)

**On `wave/round21`, after P3 (`acceptance-cuts-corrected-2026-08.md`) and the two rulings of
`college-is-its-own-branch-2026-08.md`.** Three slices, one theme: a number that was answering a
question nobody asked it.

⚠ **The age grid is not restated here.** It is written out once, in
[`college-is-its-own-branch-2026-08.md` §0a](college-is-its-own-branch-2026-08.md).

---

## 0. THE EMPTY-WEEK CENSUS – the owner's own question, and it retires an acceptance test

> **The owner, 16.08, verbatim:** «вообще не страшно, если иногда в сетке есть пустые недели, не вижу
> ничего плохого. Так что просто надо понять сколько пустых недель у нас есть вообще и оттуда
> отталкиваясь делать логику. До этого я играл – всё было нормально с календарем, меня более чем
> устраивало. Если сейчас так же – то это ок.»

**This overrules the standing "she must always have tennis" acceptance test as a hard gate.** Empty
weeks are acceptable. What he asked for is a NUMBER, and a comparison against the build he actually
played. So the deliverable is a census and a diff, not a pass/fail – `tools/empty-week-census.ts`
exits 0 always.

### 0a. ⚠ Why `tools/boredom-guard.ts` could not answer it

The boredom guard starts from a REFUSAL: it collects weeks where a W entry was refused by the AER cap
(`entryStatus(...).reason === 'capped'` on the pro arm) and asks what else that week offered.
Measured, 12 careers x 260 weeks = 3,120 lived: **674 such weeks and 88 with no alternative** before
§2's fix, **354 and 29** after (§2c). **A week that is simply blank – nothing refused because nothing
was scheduled, or everything on it locked on rank – never lands on its list at either figure.** It
answers *"does the cap strand her?"*; the census answers *"how much of the calendar is empty?"*, and
those turn out to be different questions with different answers – 29 weeks over 12 careers against
~5 a season over 18.

### 0b. The three classes, and the third is what makes the number mean anything

| class | definition |
| --- | --- |
| **playable** | at least one scheduled event she could have entered, read off the engine's own gate (`entryStatus` level `ok` or `caution` – a fatigue caution is a playable week by the owner's own rule) at the event's LAST DECISION MOMENT, its deadline week. An entry she already holds counts whatever the gate says today |
| **empty** | a non-blackout week with no enterable event at all |
| **blackout** | off-season, school exams, a booked family week, an injury layoff |

⚠⚠ **A blackout is not an empty week – it is the calendar working.** The tour is shut, or she is at
her desk, or away with her family, or hurt. Folding those in would put ~7 deliberate weeks a season
into a figure the owner is reading as a defect, and the number would be meaningless. They are counted
separately and are out of the denominator.

⚠ **The policy is not the calendar.** The career is DRIVEN by `POLICIES[1]` so the world evolves the
way a played one does, but the CLASSIFICATION never asks the policy anything: a week the player arm
declined to enter (too dear, too tired, a rung she has outgrown) is **playable**, because tennis was
there and she chose otherwise.

### 0c. MEASURED – the two censuses, side by side

`npx vite-node tools/empty-week-census.ts --seeds 2`, n = **18 careers** (9 presets x 2 seeds) x 676
weeks, ages **14-26**, `POLICIES[1]`, identical seeds on both trees. **base** is `6c7507b`, the
merge-base of this wave and the build he played; **now** is `wave/round21`, run in a worktree with
`node_modules` symlinked.

| | base `6c7507b` | **now** | diff |
| --- | --- | --- | --- |
| weeks lived | 12,168 | 12,168 | – |
| blackout (by design) | 2,517 | 2,763 | +246 |
| after an ending (excluded) | 0 | 547 | +547 |
| **non-blackout weeks** | **9,651** | **8,858** | the denominator |
| playable | 8,498 (88.1%) | 7,745 (87.4%) | |
| **EMPTY** | **1,153 (11.9%)** | **1,113 (12.6%)** | **+0.7pp** |
| **empty weeks per season** | **4.9** | **5.0** | **+0.1** |
| upper bound (family weeks folded back in) | 13.6% · 6.4/season | 15.6% · 7.3/season | +2.0pp |
| careers that latched an ending | 0 of 18 | 1 of 18 | +1 |

**BY AGE** – empty as a share of that age's non-blackout weeks, and empty weeks per season lived:

| age | base share | **now share** | base /season | **now /season** |
| --- | --- | --- | --- | --- |
| 14 | 26.3% | **26.2%** | 11.0 | **10.7** |
| 15 | 15.8% | **12.7%** | 5.9 | **4.7** |
| 16 | 6.4% | **7.2%** | 2.2 | **2.5** |
| 17 | 6.8% | **6.1%** | 2.4 | **2.0** |
| 18 | 7.7% | **4.6%** | 3.1 | **1.7** |
| 19 | 9.1% | **9.7%** | 3.9 | **4.0** |
| 20 | 8.1% | **11.8%** | 3.5 | **5.0** |
| 21 | 7.6% | **10.4%** | 3.2 | **4.4** |
| 22 | 10.6% | **11.5%** | 4.6 | **4.6** |
| 23 | 7.7% | **10.0%** | 3.4 | **4.2** |
| 24 | 9.8% | **8.5%** | 4.2 | **3.4** |
| 25 | 10.8% | **11.7%** | 4.6 | **4.9** |
| 26 | 8.3% | **8.8%** | 3.4 | **3.5** |

**WHY THE EMPTY WEEKS ARE EMPTY** (the events that WERE on the week, by refusal reason):

| reason | base | **now** |
| --- | --- | --- |
| `locked` – events were there, her rank was not enough | 55.4% | **55.9%** |
| **no event scheduled at all** | 24.6% | **21.4%** |
| `locked` + `unavailable` | 12.9% | **13.8%** |
| anything involving the AER `capped` | 5.2% | **6.0%** |

### 0d. ⭐ THE VERDICT: it is the same calendar he played

**11.9% → 12.6% of her non-blackout weeks, 4.9 → 5.0 empty weeks a season.** On any reading that is
the same game. Three things are worth him seeing anyway:

1. **The sore spot is fourteen, and it is identical on both builds** – 26.2% against 26.3%, ~11 empty
   weeks in that season alone. A fourteen-year-old with no ranking is locked out of most of the
   calendar by the acceptance cuts, and always was. **This is not something this wave did.**
2. **The middle of the career got BETTER and the twenties got slightly worse.** 15 (15.8 → 12.7%), 17
   and especially 18 (7.7 → 4.6%) improved – the age-floor ruling opening W35/W50/W75/W100 at 14
   doing exactly what it was for. Ages 20, 21 and 23 each gave back 2-3 points. Both moves are inside
   one or two weeks a season.
3. **The dominant cause is not the cap.** 56% of empty weeks had events on them she was not ranked
   high enough to enter, 21% had nothing scheduled at all, and everything involving the AER
   allowance is 6%. ⚠ So if the owner ever wants that number lower, the lever is the acceptance
   cuts or the calendar's density – **not** the entry caps, which is where the previous three waves
   have been looking.

⚠ **One real difference, reported rather than absorbed:** one career of 18 latched an ending inside
the horizon on `wave/round21` and none did on the base (547 weeks excluded, ~4.5% of weeks lived).
Injury-layoff blackouts also rose 280 → 390. That is a fatigue/injury story, not a calendar one, and
it is n=1.

---

## 1. THE SPONSOR GATES GET THEIR OWN CONSTANTS

**The defect: one constant doing two unrelated jobs.** `ECONOMY.sponsorship.national.maxWtaRank` was
*defined as* `TIERS.w100.acceptsRank` and `global`'s was a quarter of it, with the equality pinned in
`tests/offers.test.ts`. So P3's acceptance-cut work, which is about who the TOUR lets into a W100,
silently moved what a SPONSOR costs:

| | before P3 | after P3 | **now** |
| --- | --- | --- | --- |
| `national.maxWtaRank` | 350 | 240 | **350** |
| `global.maxWtaRank` | 87 | 60 | **87** |
| global's professional band | #51-87 (37 wide) | #51-60 (**ten**) | #51-87 |

**Nobody decided that.** It was a side effect, and the three escalation paragraphs already sitting on
those constants are the sound of the repo noticing and shipping it anyway. ⚠ **A pin on a coupling
does not remove the coupling; it guarantees it.**

**This is the same defect P4 fixed for the college door, and the fix is the same shape.** An
acceptance cut is a rule of the tour – who may enter, decided by the ITF and the WTA. A sponsor's
interest is a fact about visibility – how famous a rank makes you, decided by a marketing department.
They coincided once, in 02.08's derivation, and **a coincidence is not a dependency.**

**What ships:** both rungs carry their own constants, restored to the values they held before the
coupling dragged them, with the full record kept above the line that reverses it. `TIERS.w100.acceptsRank`
stays at **240**, where the ladder argument put it. Restoring what a side effect took is a revert, not
a new balance decision, and it is deliberately not dressed as one.

**The guard** (`tests/offers.test.ts`, replacing the equality pin) is P4's own pattern:

* case 1 moves `TIERS.w100.acceptsRank` over `[350, 240, 1, 5000]` and asserts both sponsor gates and
  the rung a #300 professional is offered are unchanged at every value;
* case 2 moves the sponsor rungs' OWN knobs and asserts the answers DO change – so case 1 cannot pass
  vacuously (a `standingClears` that ignored the gates would satisfy it);
* case 3 pins the chain monotone: national 350 > tour 200 > global 87 > premium 50 > icon 10.

**MUTATION-VERIFIED.** Re-pointing `standingClears`' national arm back at `TIERS.w100.acceptsRank`
turns **both** decoupling cases red. The junior pair keeps its derivation from `TIERS.j300.drawSize`
deliberately: a draw size is a structural fact about the event, not a cut somebody retunes.

### 1a. ⚠ IS 87 STILL THE RIGHT NUMBER? – reported, not moved

**Asked because a band ten ranks wide is not a band, and 87 only just stops being one.** `premium`
sits at 50, so global's whole professional territory is **#51-#87 – 37 places** in a table of ~1,800.
Three things the owner should weigh:

* **Its argument is gone.** 87 was *a quarter of national's 350*, and that arithmetic is exactly the
  derivation this decoupling retires. The number now stands on nothing but its own history.
* **The population moved under it.** The baseline's median career high is **#104** – i.e. the median
  career never reaches this rung at all, and the ones that do cross #87 to #51 quickly.
* **Its neighbours are far apart.** The gap it sits in runs from `premium` 50 to `tour` 200; 87 is
  barely a fifth of the way up it.

**Not moved here.** Restoring what the coupling took is a revert; choosing a new figure is a balance
decision and it is his.

---

## 2. TWO INVERSIONS, AND A GUARD SO THEY CANNOT COME BACK

**The ladder must be monotone: a bigger event must be no easier to enter than a smaller one.** That is
structural rather than a balance preference. `TIER_LADDER` is documented as *"the single source of
truth for 'is tier A above tier B'"*, and `hasOutgrown`, `tierOutgrown`, the strongest-first entry
policy, the season strip and the tier guide all reason about that order. A chain that inverts makes
every one of them wrong about something, silently. Reality agrees – a WTA 125 draws below a WTA 250 –
but the argument does not need it to.

⚠⚠ **AND THE CRITERION HAS TO BE STRUCTURAL, BECAUSE THE NUMBERS ARE NOT SOURCED.** `wta125`'s 180,
its replacement 210, `wta250`'s 200 and `w100`'s 240 each say **NOT SOURCED** in their own comments in
`season/calendar.ts` – no published acceptance depth exists for any of them. **210 is not more real
than 180**, and this spec will not pretend it is. What is asserted instead is a relationship that
holds whatever the numbers become.

| # | inversion | fix |
| --- | --- | --- |
| 1 | `wta125.acceptsRank` **180** is TIGHTER than `wta250.acceptsRank` **200** – the smaller event refusing a girl the bigger one would take. P3 measured the behaviour: **2.1 WTA 250s a career against 0.5 WTA 125s** | **210** – strictly looser than the 250 above, strictly tighter than w100's 240 |
| 2 | `j300.enterPct` **0.20** is tighter than its own `entrantPctBand` ceiling **0.25** – the rung refusing entry to the population its own draw is made of. She could be DRAWN into a J300 she could not ENTER | **0.25**, restoring `enterPct === entrantPctBand[1]` |

⚠ Fix 2 does not withdraw P3's sourcing argument – 0.25 is inside it. P3's own measured table has
**0.25 at 3.0 J300 entries a career, 25 of 27 careers reaching it, end rank #204** – the row directly
above the one that shipped. And `tests/ladder.test.ts` had already pre-registered this exact move:
*"If he re-picks j300 at or above 0.25 this goes red, and the reader should restore the strict
`toBeGreaterThan` above."* This is that instruction carried out.

### 2a. The guard – `tests/ladder.test.ts` L6b, and it is the durable half

Four assertions, walking the whole ladder in `TIER_LADDER` order:

1. **the absolute-rank family never inverts** (`acceptsRank`, the W rungs);
2. **the share family never inverts** (`enterPct`, the ITF rungs) – ⚠ the two units are never compared
   with each other, which is the bug `TierDef.acceptsRank`'s own note exists to prevent;
3. **no rung refuses the population its own draw is made of** – the general form of inversion 2,
   asserted over the family rather than by hand on one rung;
4. **the exemption list is exactly one pair, and that pair really does invert.**

**MUTATION-VERIFIED, three ways.** Putting `wta125` back to 180 turns the monotonicity case red with
the pair named (*"wta250 (#200) must be no easier to enter than wta125 (#180)"*). Putting `j300` back
to 0.20 turns the field-band case red. Making the Slam exemption stale (`slam.acceptsRank` 104 → 60)
turns the exemption case red.

### 2b. ⚠⚠ A THIRD INVERSION THE GUARD FOUND, AND IT IS THE OWNER'S

**`slam.acceptsRank` is 104 and `wta1000.acceptsRank` is 65 – so a Grand Slam is easier to enter than
the rung below it.** It was not fixed and it is not silently excused: it is the guard's one declared
exemption, held as DATA so it is visible and countable.

**Why it is not simply corrected.** 104 is the ONE fully sourced number in the whole family – the
Grand Slam Rule Book's own published direct-acceptance count – and **in the real sport it is not an
inversion at all**, because a real major draws 128 and a real 1000 draws 56. Acceptance depth scales
with draw size. Our Slam draws **32** (the deviation is stated at length on the constant,
`tools/big-draw-cost.ts` is its receipt), which is what turns a sourced number into an inverted one
here. Closing it means moving either a sourced figure or an unsourced one at the very top of the
ladder. ⚠ **And it is not academic**: measured on the post arm, **34 of 90 careers reach a Slam and
16 of 90 reach a WTA 1000** – so the window where the inversion actually bites, a girl ranked between
**#66 and #104**, is one real careers pass through. That is his call, not an agent's.

The exemption cannot rot: its count is pinned at one, and the inversion itself is asserted, so the day
the Slam draw or either cut moves it goes red rather than quietly excusing a new inversion.
### 2c. ⭐ AND THE FIX PAYS SOMEWHERE NOBODY WAS LOOKING – THE BOREDOM GUARD FELL BY TWO THIRDS

`npx vite-node tools/boredom-guard.ts`, 12 careers x 260 weeks, the maximal-grinder driver it ships
with, before and after §2:

| | before | **after** |
| --- | --- | --- |
| W entries refused by the AER cap | 1,145 | **448** |
| distinct non-blackout weeks those refusals covered | 674 | **354** |
| **weeks with NO playable J/domestic alternative** | **88** | **29** |

**Nobody predicted this and it was not aimed at.** The mechanism is the j300 half: the guard's whole
question is *"when the cap refuses a W, is there junior or domestic tennis on that week?"*, and a
prestige junior rung that accepts to 0.25 of the table instead of 0.20 is one more answer to it on
one more week. ⚠ The guard still exits 1 (29 > 0), and it is **no longer a hard gate** – the owner's
16.08 ruling in §0 is about exactly this claim. Its exit code is deliberately unchanged; softening it
is his call and is not taken here.


---

## 3. PREDICTED vs MEASURED

⚠ **THE PREDICTIONS WERE WRITTEN AND COMMITTED BEFORE THE RUN** (CLAUDE.md invariant 4). They are in
the table below.

`npx vite-node tools/ladder-baseline.ts --seeds 10`, n = 90 (9 presets x 10 seeds), 676 weeks,
`POLICIES[1]`, identical seeds. **spec** is the *now* column of
`college-is-its-own-branch-2026-08.md` §3. **pre** is this wave's tree with §1 (the sponsor
decoupling) landed and §2 not – so the two arms attribute the sponsor move and the ladder move
separately instead of blaming one for the other. **post** is both.

<!-- PREDICTIONS-BEFORE-MEASUREMENT -->

| | spec (§3 *now*) | **my prediction for post** | reasoning |
| --- | --- | --- | --- |
| first W35, median age | 16.1 | **16.0** | a looser J300 builds the junior book faster, and W15's door is that book |
| first W50 | 17.2 | **17.0** | |
| first W75 | 17.9 | **17.8** | |
| first W100 | 18.3 | **18.2** | |
| first WTA 125 | 18.8 | **18.4** | its door widens by 30 ranks, in the band careers are actually in at 18-19 |
| first Slam | 21.9 | **21.9** | nothing here touches it |
| rank at 17 | #375 | **#340** | |
| rank at 19 | #160 | **#150** | |
| rank at 21 | #160 | **#150** | |
| rank at 25 | #156 | **#150** | |
| career high | #104 | **#100** | |
| entries per career | 267 | **275** | two rungs open wider |
| prize by 19 | $115,205 | **$125,000** | |
| prize by 21 | $259,570 | **$275,000** | |
| career prize | $685,960 | **$720,000** | |
| counting book full at 19 | 59/90 | **62/90** | |
| bankruptcies | 2 at 15.8 | **0-1** | §1 makes a sponsor materially easier to earn again |
| J300 entries per career | – | **up ~60-75%** | P3's own table: 1.7 → 3.0 at n=27 |
| WTA 125 entries per career | – | **roughly double** | 0.5 → ~1.0-1.5 |

<!-- MEASURED-BELOW -->

### 3a. ⚠ FIRST, THE PRE ARM: §1 MOVED NOTHING THIS BATTERY CAN SEE

**`pre` reproduces the spec's *now* column on every figure it reports** – first entry ages, all four
rank milestones, career high #104, 267 entries, $115,205 / $259,570 / $685,960, 59/90, 2 bankruptcies
at 15.8. So the sponsor decoupling of §1 is **measurement-neutral on this battery**, which is the
right result for a correctness fix and is also a limitation worth naming: **these columns price PRIZE
money and not sponsor money.** What §1 moved was who gets a letter and how big the cheque is, and the
battery does not have a column for it. The one place it could have shown through – affordability, and
so bankruptcies – is unchanged at 2 of 90.

### 3b. AND THE POST ARM – predicted vs measured

| | pre / spec | **post (measured)** | predicted | verdict |
| --- | --- | --- | --- | --- |
| first W35, median | 16.1 | **16.3** | 16.0 | ⚠ **wrong direction** |
| first W50 | 17.2 | **17.1** | 17.0 | ✅ |
| first W75 | 17.9 | **17.5** | 17.8 | ✅ (better than predicted) |
| first W100 | 18.3 | **18.6** | 18.2 | ⚠ wrong direction |
| first WTA 125 | 18.8 | **18.8** | 18.4 | ⚠ **wrong – it did not move at all** |
| first Slam | 21.9 | **22.3** | 21.9 | ⚠ slightly later |
| rank at 17 | #375 | **#374** | #340 | ⚠ flat |
| rank at 19 | #160 | **#178** | #150 | ⚠⚠ **badly wrong – it got WORSE** |
| rank at 21 | #160 | **#178** | #150 | ⚠⚠ worse |
| rank at 25 | #156 | **#174** | #150 | ⚠⚠ worse |
| career high, median | #104 | **#112** | #100 | ⚠⚠ worse |
| entries per career | 267 | **262** | 275 | ⚠ wrong direction |
| prize by 19 | $115,205 | **$112,290** | $125,000 | ⚠ |
| prize by 21 | $259,570 | **$246,240** | $275,000 | ⚠ |
| career prize | $685,960 | **$623,820** | $720,000 | ⚠⚠ **badly wrong – −$62k** |
| counting book full at 19 | 59/90 | **55/90** | 62/90 | ⚠ |
| bankruptcies | 2 at 15.8 | **2 at 15.8** | 0-1 | ⚠ unchanged |
| J300 entries per career | 2.2 | **3.1** | +60-75% | ⚠ close – **+41%** |
| WTA 125 entries per career | 15.3 | **19.0** | ~double | ⚠ **+24%** |

**Fifteen of eighteen predictions are wrong, and eight of them in the opposite direction.** I predicted
a broad improvement because two rungs opened wider. Every median got worse.

### 3c. ⭐⭐ THE ERROR IS THE FINDING, AND IT IS A COMPOSITION EFFECT – THE POPULATION CHANGED

**The column I did not predict is the one that explains all the others:**

| careers that ever reach the rung | pre | **post** |
| --- | --- | --- |
| **J300** | 72/90 | **87/90** (+15) |
| W15 · W35 · W50 · W75 · W100 · WTA 125 · WTA 250 | 81/90 | **87/90** (+6, every rung) |
| ever held a professional ranking | 81/90 | **87/90** |
| ranked at 19 | 80/90 | **86/90** |

**Fifteen more careers of ninety reach the prestige junior rung, and six more get onto the
professional ladder at all.** That is the j300 fix doing precisely what the structural argument said
it would: a rung that refused the population its own draw was made of was refusing the girls at the
bottom of that population, and they are exactly the careers that were never getting a professional
ranking.

**And those six careers join the median at the bottom of it.** The distribution says so directly –
the career-high **p25 is #75 in both arms** and unchanged, while **p75 moves #131 → #142 and the worst
#160 → #180**. Nothing at the top of the population got worse. The median moved because six careers
that used to be *unranked* – and therefore not in the median at all – are now ranked, and ranked
poorly. ⚠ **A median over a population that grew by 7% is not a comparison**, and reading −$62k of
career prize as "the fix cost money" would be the same error `college-is-its-own-branch` §3c names.

⚠ **What is genuinely paid for, and is not composition:** entries per career 267 → 262 and WTA 250
entries 44.7 → 41.3. See §3d.

### 3d. ⚠ THE THIRD COUPLING, FOUND BY THE MEASUREMENT – `acceptsRank` ALSO MOVES THE OUTGROWN LINE

The WTA 125 change has a blast radius the fix did not intend, and the mechanism is in the ladder's own
design rather than in a mistake: **`tierOutgrown(tier)` is `tierFloorOpen(TIER_LADDER[i + 3])`** – a
rung closes when the rung THREE above it opens. `wta125` is three above `w50`. So loosening the 125's
door from #180 to #210 **also moves the rank at which a W50 stops counting as worth entering**, and
the player policy's `skipOutgrown` acts on it:

| entries per career | pre | **post** |
| --- | --- | --- |
| W50 | 30.3 | **22.1** |
| W35 | 15.5 | **22.2** |
| W75 | 11.9 | **17.9** |
| WTA 125 | 15.3 | **19.0** |
| WTA 250 | 44.7 | **41.3** |

⚠ **This is reported, not resolved.** It is a real property of the sliding window – deliberate, and
documented on `TIER_LADDER` – but it means *"an acceptance cut is one decision"* is not quite true:
it is also a decision about a rung three storeys down. ⚠ **And the two fixes landed together, so this
pair of arms cannot attribute any single rung's shift to one of them.** Splitting them would need two
more 207-second runs and is worth doing before anyone tunes on these numbers.

⚠ **The WTA 125's own first-entry age did not move at all** (18.8 both arms), which is the flattest
possible refutation of my prediction: at 18.8 the median career is around #190-#210, so the 30 extra
ranks of door are being reached at almost exactly the same week she was reaching #180 anyway.

---

## 4. FOR THE OWNER

1. **The calendar is the same as it was** – 4.9 → 5.0 empty weeks a season, 11.9% → 12.6% of her
   non-blackout weeks. §0d. The one age that is genuinely thin is **fourteen** (~11 empty weeks), and
   it is thin on the build he played too.
2. **Is 87 still right for the global sponsor?** §1a. Its argument was retired with the coupling; the
   band is 37 ranks wide in a table of 1,800 and the median career high is #104.
3. **The Slam accepts deeper than the WTA 1000** (104 against 65), so a major is easier to enter than
   the rung below it. §2b. Left alone because 104 is the family's one sourced number and it only
   inverts because our Slam draws 32 – but **34 of 90 careers reach a Slam and 16 reach a 1000**, so
   the window it bites in (#66-#104) is one real careers pass through.
4. **Whether a J300 should be reachable at all** is unchanged and still open – §2's fix moves the cut
   from #40 of 200 to #50 of 200 against a sport that cuts at ~2%. P3's escalation stands. ⚠ What is
   new is the price of the other direction: at 0.20 it was **72 of 90 careers** that ever reached the
   rung, at 0.25 it is **87 of 90**, and six of those careers get a professional ranking they were not
   getting at all. §3c.
5. **An acceptance cut is also a decision about a rung three storeys down** (§3d), because
   `tierOutgrown` reads the rung three above. Nothing is broken and nothing was changed for it – but
   it is the third instance this wave of one number answering two questions, and unlike the other two
   this one is deliberate.

---

## 5. THE FROZEN CAREERS

`tests/coach-travel-edge.test.ts` re-frozen for the **sixth** time, per-key diff first as that file
demands (`tools/frozen-key-diff.ts` against a worktree at `3198a11`, all 62 keys on all three
careers).

**Two of the three careers did not move one byte.** Only the player arm did, 17 keys of 62, and the
mechanism is measured rather than inferred: `entries`, `season`, `internationalEntryWeeks` and
`proEntryWeeks` are all unmoved – she played the same WEEKS – and a per-tier count says **one J60
became one J300**, j60 12 → 11 and j300 0 → 1, total entries 59 both sides. Her ITF rank at week 156
went **#46 → #21** on that single event and the family is $425 lighter for the bigger fee and trip.

⚠ `rngMain` is unmoved for the sixth wave running – an acceptance cut is a gate on an entry, not a
draw – so **the frozen MAIN capture in `tests/condition.test.ts` is untouched** (count 41550, hash
`e6b0c709`) and needed no re-pin.

⚠ The WTA 125 half cannot reach those hashes at all: she is 16.6 at week 156 and the median rank at 17
is #374, so a door at 210 refuses her exactly as one at 180 did.
