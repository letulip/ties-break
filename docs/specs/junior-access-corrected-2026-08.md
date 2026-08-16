---
type: spec
status: current
area: engine/balance
canonical: false
last-reviewed: 2026-08-16
---

# The Accelerator is a reserved place, not a turnstile – the owner's correction and its re-measure (16.08.2026)

**A seventh phase nobody planned, opened by a question after P6 had already reported.**

> **The owner, 16.08, verbatim:** «скажи пожалуйста, а почему мы не пускаем на w35, w50, w75 до 18
> лет, если правила пускают уже с 15, только с ограничением количества таких турниров в год на каждом
> возрасте? и у нас в ресерче это было точно. Или я не так понял?»

He understood it exactly right, and the research says so in a primary-source quote.

---

## 0. THE THREE ANSWERS, IN ONE BOX

> ### 1. THE RULE WE SHIPPED DOES NOT EXIST.
> `docs/research/ranking-points-by-tier.md` §4-C2, on the 2026 ITF WTT Regulations: *"W75 HAS NO AGE
> FLOOR OF ITS OWN. The only age thresholds anywhere ... are **14** ... and **18**, the AER cut-off. A
> 15-, 16- or 17-year-old is limited only by her per-year COUNT."* §4-A is equally blunt about the
> door itself: W35, W50, W75 and W100 share ONE "System of Merit" section and **there is no threshold
> anywhere in it** – an unranked player is not refused a W75, she is placed at the bottom of the list.
> The Junior Accelerator sets main-draw places ASIDE for juniors near the top of the junior list. It
> is an extra way in. **P1 made it the only way in.**
>
> ### 2. ⚠ THE ERROR IS THE ARCHITECT'S, NOT THE AGENT'S.
> *"Above W15, a junior's access is the Accelerator table"* is my sentence, written into
> `docs/plans/college-and-the-junior-ladder.md` §P1 and handed to that agent verbatim. Its own spec
> flagged the shape honestly – *"⚠⚠ IT IS A CEILING, NOT AN EXTRA DOOR – and that is the finding"* –
> and the premise under the flag was false: *"a junior cannot reach a W75 unless she is world top 5"*
> is about the RESERVED ROUTE, never about entry.
>
> ### 3. AND THE LADDER GOT ITS GRADIENT BACK, WHICH IS THE WHOLE MEASUREMENT.
> Before: W35, W50 and W75 all opened at **19.0** – three doors on one birthday. After: **16.3 /
> 17.3 / 18.0**. Rank at nineteen goes **#270 → #154**, better than P0's own #177; prize by nineteen
> **$69,780 → $119,860** against P0's $125,855. **⚠ And the college door shuts again: 96% → 18% open
> at the fork.** §4 is that trade, and it is the owner's.

---

## 1. WHAT CHANGED, IN THREE LINES OF ENGINE

```
before:  a junior passes only if the Accelerator admits her
after:   a junior passes if she clears the rung's own acceptance cut
         OR if the Accelerator holds a reserved place for her
```

`juniorAccessOpen` offers `meetsAcceptanceCut` first; `juniorReservedPlace` is the Accelerator's own
answer, narrowed to what it grants. **An adult is untouched** – she enters on her professional ranking
exactly as before – and **W15 is untouched**, because it has its own junior-reserved method.

⚠ **THE BRAKE IS NOT REMOVED WITH THE CEILING, and that is why this is a correction rather than a
loosening.** The per-year count the owner names is the AER; it ships, and P2 put it on a
birthday-to-birthday window: **14 → 8 events of which at most 3 at W75+, 15 → 10, 16 → 12, 17 → 16.**
A fifteen-year-old who has earned the rank may now enter the rung she has earned, ten times a year.

### 1a. ⚠⚠ AND FIXING IT EXPOSED ITS MIRROR, IN `medical.ts`

Once the Accelerator became an extra door, a junior it holds a place for is admitted by
`tierFloorOpen` **without clearing the list** – and the acceptance-cut branch of `availabilityStatus`,
sitting ABOVE the programme's own, refused her anyway. **The calendar open, the turnstile shut, on the
one girl the reserved place exists for**: the R10-5 disagreement arriving from the far side.

`tests/rankingGate.test.ts`'s sweep could not see it, and the reason is worth keeping: its implication
runs **one way** – *a rung the calendar SHUTS must never be enterable* – so the opposite leak is
outside its claim by construction. The cut now checks the reserved place first, and a junior who
misses BOTH doors is told about both; an adult is not, because she has only the list and naming a
programme she cannot use invites her to solve the wrong problem.

### 1b. ONE COMPOSITION TRAP, AND THE GUARD CAUGHT IT

`juniorAccessOpen` answers TRUE for everything it has no opinion about – an adult, a WTA 125 – so a
naive `cut || juniorAccessOpen` admits a twenty-five-year-old who misses by four hundred places. Six
worlds went red on `rankingGate` with exactly its own message. `juniorReservedPlace` is the same
question narrowed to what it actually grants.

---

## 2. THE GUARDS – three files, and two of them were hiding the same workaround

**`tests/junior-access.test.ts`** – three cases asserted the ceiling and passed on a fixture with a
300-point professional book, i.e. rank ~#229, which **clears every cut on the ladder**, so the
Accelerator was the only thing that could refuse her. They now use `OFF_THE_LIST` (one point, #1613 of
1800, outside even W35's #700) – the girl the programme actually exists for. **A new case pins the
correction itself, in both directions**: a junior inside the cut enters with no banked standing at
all, and her one-point twin does not.

⚠⚠ **`tests/ladder-floor.test.ts` AND `tests/unranked-sentinel.test.ts` BOTH BANKED A YEAR-END JUNIOR
#1 ON THEIR FIXTURES, AND EACH LEFT A NOTE SAYING WHY.** Without it, P1's ceiling shut every W rung and
neither file had its own subject left to measure – the sliding window in one, the acceptance cuts in
the other. Under the correction a banked #1 buys **three genuine W100 places**, so *"an acceptance cut
she is outside still refuses"* went red **because she was inside a different door**. The workaround
had become the confound. Both now bank **21** – the Accelerator's own row that holds nothing above W15
– so the standing is neutralised rather than the row deleted, and P1's reasoning is kept verbatim
above the line that reverses it.

### 2a. THE FROZEN CAREERS – one of three moved, and the per-key diff says why

`tools/frozen-key-diff.ts` is now a committed tool, because `tests/coach-travel-edge.test.ts` demands
that diff before any hash may be re-frozen and re-deriving it by hand each wave is how the protocol
rots. Against `3fc17ab`:

* **UNMOVED**: `entries`, `seasonEntries`, `internationalEntryWeeks`, `proEntryWeeks`, `season`,
  `skills`, `potential`, `plan` – **and `rngMain`, for the fifth wave running.**
* **MOVED**: `results`, `kidRankWta`, `bestFinishByTier`, `events`, `fundsCents`, `careerTotals`,
  `trophiesByTier`, `academy`, `milestones`, `offers`.

**She did not enter one different event.** `proDoors` is *"the kid's rule, line for line"* by design,
so the AI on-ramp read the corrected door, the fields she met are different fields, and her results
moved with them. Both GRINDER careers are byte-identical; only the player arm moved.

⚠ `rngMain` unmoved is the load-bearing half: an access rule is a **post-draw gate**, so the frozen
MAIN capture in `tests/condition.test.ts` is untouched (count 41550, hash `e6b0c709`).

---

## 3. MEASURED – P0's frozen battery, three columns

`npx vite-node tools/ladder-baseline.ts --seeds 10`, n = 90, 676 weeks, `POLICIES[1]`, identical
seeds. **P0** is the frozen baseline; **P6** is the chain as it stood this evening
(`docs/specs/the-remeasure-2026-08.md`); **now** is the same battery on the correction.

### 3a. THE GRADIENT, WHICH IS WHAT THE CORRECTION IS FOR

| first entry, median age | P0 | P6 | **now** |
| --- | --- | --- | --- |
| W35 | 16.3 | **19.0** | **16.3** |
| W50 | 16.5 | **19.0** | **17.3** |
| W75 | 17.0 | **19.0** | **18.0** |
| W100 | – | 19.0 | 18.6 |

**Three doors stopped opening on one birthday.** P6 named this as the chain's largest single
distortion and proposed exactly this fix, sized between #246 and #423 and left unmeasured; measured, it
lands at #388 at seventeen and better than P0 at nineteen.

### 3b. THE LADDER AND THE MONEY

| | P0 | P6 | **now** |
| --- | --- | --- | --- |
| rank at 17 (median) | #246 | #423 | **#388** |
| **rank at 19** | #177 | #270 | **#154** |
| rank at 21 | #185 | #174 | **#174** |
| rank at 25 | #172 | #158 | **#160** |
| career high (median) | – | – | **#107** |
| entries per career | 239 | 265 | **265** |
| **prize by 19** | $125,855 | $69,780 | **$119,860** |
| prize by 21 | $251,215 | $211,715 | **$251,245** |
| career prize | $654,430 | $646,795 | **$709,030** |
| counting book full at 19 | 20/90 | 74/90 | **67/90** |
| counting book full at 21 | 17/90 | 42/90 | **35/90** |
| bankruptcies | 1 at 15.3 | 0 | **0** |
| careers ended early | – | 1 at 24.9 | **1 at 24.9** |

**The chain's gains survive and its costs mostly do not.** P3's fuller counting book is kept (67 and
35 against P0's 20 and 17); P2's closed AER leak is kept; the money hole at nineteen closes to within
5% of P0; the career total is the best of the three columns.

### 3c. ⚠⚠ AND THE COLLEGE DOOR SHUTS AGAIN – THE ONE COLUMN THAT GOES BACKWARDS

| | P0 | P6 | **now** |
| --- | --- | --- | --- |
| door shut | 86/90 at 17.3 | 83/90 at 19.2 | **83/90 at 18.1** |
| still OPEN at the fork | 8% | **96%** | **18%** |
| still open a full season later | – | 8% | **8%** |
| which rung shuts it | W75 | W75 | **W75, 95% of closures** |

**This is P4's own prediction arriving.** That spec measured the gate as *"LATE rather than correct"* –
firing at median 19.1 against a fork at 19.0 – and said in as many words: *"the six weeks it survives
by are an accident. Nothing arranges that ordering, so any future tuning that speeds her up by a month
closes it again in most careers, silently."* It sped her up by a year, and it did.

⚠ **IT IS NOT SILENT HERE, WHICH IS THE ONLY REASON THIS SECTION EXISTS.** P4 broke the coupling
(`collegeDoorOpen` reads its own rule and no calendar constant), so the door moved for a reason that
can be named rather than because `w75.acceptsRank` was edited.

---

## 4. ⚠⚠ FOR THE OWNER – ONE TRADE, AND IT IS HIS

**The correction and the college door pull against each other, and no third option removes the
tension.** She reaches W75 at eighteen because the rules admit her at eighteen; `collegeClosedFromTier`
is `w75`; the fork is at nineteen. Any ladder honest about the sport puts her past W75 before her
nineteenth birthday in most careers.

Three coherent answers, none taken here:

**(A) Leave it.** The sport's own shape, and his round-21 complaint returns in weaker form – the third
answer is on the card in 18% of careers at the fork rather than 96%. What ships.

**(B) Move `ENDINGS.collegeClosedFromTier` up a rung** (`w75` → `w100`, or `wta125`). Now that P4
decoupled it, this is a one-constant change that no longer disturbs who may enter a W75. On this
battery W100 shuts the door in 3 careers and WTA 250 in 1, against W75's 79 – so moving the rung to
W100 would leave the door open in the great majority. ⚠ It is OUR constant either way: §1's research
is clear that reality closes the college door on nothing at all since April 2026.

**(C) Move the fork earlier.** ⚠ Our invention, and it re-creates the complaint from the other side.

**My recommendation is (B), and it is the honest one for a reason worth stating:** the rung was never
chosen for what it says about college. It was `w75` because W75 was where a professional career began
when the constant was written – and P3 has since moved every cut on the ladder while P1, P2 and this
correction moved when she arrives. The number is a fossil of a ladder that no longer exists.

---

## 5. WHAT THE NEXT PHASE MUST NOT READ OFF THIS

* **`docs/specs/the-remeasure-2026-08.md` is superseded on every ladder column.** Its findings about
  the chain stand; its numbers are the pre-correction arm and are quoted as such above.
* **`docs/specs/junior-access-2026-08.md` §2c is now wrong in its conclusion.** *"The only honest model
  of 'a junior cannot reach a W75 unless she is top 5' is a ceiling on the junior"* rests on a premise
  the research does not support. The spec is left standing with this one as its correction, because
  deleting the reasoning would delete the record of how the error survived a whole phase.
* **P6's other retune proposal is untouched.** It named this clause and this clause only; the college
  question in §4 is new and is not a retune, it is a constant that was never chosen for its job.
* **The e2e corpus was regenerated after this landed** – world generation moved again, so the fixtures
  are the fourth part of the save-schema move once more.
