---
type: spec
status: current
area: engine/balance
canonical: true
last-reviewed: 2026-08-16
---

# Two rulings on one evening: the real age grid, and college as its own branch (16.08.2026)

**An eighth phase, opened by the owner reading the code an hour after the seventh reported.** Both
rulings delete something we invented; neither adds a mechanism.

> **Ruling 1, verbatim:** «у W35 стоит minAgeYears: 16, у W50 – 16, у W75 и W100 – 17. По той же
> цитате из регламента, которой вы были правы, настоящих порогов только два – 14 и 18. – вот как есть
> в регламенте, так и у нас. Возрастное есть только по количеству сыгранных в год, так и делаем.»
>
> **Ruling 2, verbatim:** «collegeClosedFromTier – так ведь нет же там никакой связи с w75, мы же всё
> узнали. Колледж – это независимая ветка карьеры с отдельным функционалом и турнирами,
> альтернативная.»

---

## 0. THE THREE ANSWERS, IN ONE BOX

> ### 1. ⭐⭐ THE AGE FLOORS WERE DOING ALMOST NOTHING, AND THAT IS THE MEASUREMENT.
> Five rungs' floors came off at once (W35/W50 16 → 14, W75/W100/Slam 17 → 14, the four WTA rungs
> 17 → 15) and the ladder moved by **0.1 to 0.3 years** at every rung. W35's median first entry:
> **16.3 → 16.1**. W75: **18.0 → 17.9**. W100: 18.6 → **18.3**. My predictions were 15.0 / 17.5 /
> 18.3 – wrong on two of three, and wrong in the same direction each time. **The acceptance cut was
> already the gate; the age floor was sitting behind it.** §3 and §5.
>
> ### 2. AND THE FROZEN CAREERS SAY IT MORE SHARPLY THAN THE BATTERY DOES.
> The per-key diff moved **27 keys on all three careers – and `entries` is not one of them.** She did
> not enter one different event. What moved is `results`, because `selectEntrants` filters a draw's
> CANDIDATES on the same age gate: opening W35+ to fourteen-year-olds changes which cohort players
> fill the fields she meets. Different opponents, same calendar. §6a.
>
> ### 3. THE COLLEGE ANSWER IS NOW ON THE CARD IN 100% OF CAREERS, AND NOT BY A MEASUREMENT.
> The three previous columns read 8% / 96% / 18%, and every one of them was a number that could move
> with a balance change. It is 100% by construction now: there is no rule that can remove the third
> answer. ⚠ **Round-21 #8 is retired by the owner's own later ruling** – he asked for the card to say
> why the college answer was missing, and it is never missing. §4.

---

## 1. RULING 1 – WHAT EACH `minAgeYears` BECAME, AND WHAT ITS OLD COMMENT RECORDED

Every one of these constants carried a comment and several carried measurements or rulings. **None
was deleted.** Each old reason is kept above the line that reverses it, which is this repo's standing
practice and is why the table below can be written at all.

| rung | was | **is** | source for the new number | what the old comment recorded |
| --- | --- | --- | --- | --- |
| W15 | 14 | **14** | – | untouched (P2's own ruling of 16.08 had already moved it 16 → 14) |
| W35 | 16 | **14** | ITF WTT Women's III.A.1 | nothing of its own – a bare `minAgeYears: 16`. It now carries the FAMILY note: the ruling, the quote, and why the grid is not "no floor anywhere" |
| W50 | 16 | **14** | same | *"Same doorway age as W15/W35: the AER's 16-year-old allowance (12 pro entries) is what actually meters her first season here, not the doorway itself."* It named the right mechanism and then shut the door anyway |
| W75 | 17 | **14** | same | **two paragraphs, both of which argued for this change a day early.** *"AND IT IS OURS, NOT THE SPORT'S (audited 15.08). A real W75 has no age floor of its own"*, and *"ON THIS RUNG THE AGE GATE IS DOING THE ACCEPTANCE LIST'S JOB … in 40 of 52 careers `minAgeYears` is the ONLY thing refusing her. Left as it is – opening it to fourteen-year-olds is a far larger change than correcting the cut, and it is the owner's."* He took it |
| W100 | 17 | **14** | same | bare. It was 17 because W75 was |
| WTA 125 | 17 | **15** | **WTA Rulebook II.D** – under-15s have no direct acceptance to a WTA event at all | bare. Now carries the WTA-family note: why these four are 15 and not 14 |
| WTA 250 | 17 | **15** | same | *"The family's top half opens at 17, as W75/W100/125 do. The doorway is not the gate here – the acceptance list is (#200)."* True of the mechanism, invented as a number |
| WTA 500 | 17 | **15** | same | bare |
| WTA 1000 | 17 | **15** | same | bare |
| **Slam** | 17 | **14** | 2026 Grand Slam Rule Book – research §4-C2: *"the Grand Slam floor is also 14"* | bare. ⚠ **Not 15**: a major is not a WTA tournament, so the WTA's direct-acceptance floor does not reach it |
| J30 / J60 / J300 | 13, U18 | **unchanged** | – | a different regulation, and outside this ruling |

⚠ **THE GRID IS NOT "NO FLOOR ANYWHERE", and the family note on W35 exists to stop that reading.**
Three numbers survive and each is sourced: **14** on the ITF W rungs and the Slam, **15** on the four
WTA rungs, **13/18** on the junior tour.

### 1a. WHAT REPLACES THE FLOORS IS ALREADY SHIPPED

The owner's «возрастное есть только по количеству сыгранных в год» is the AER, and it is untouched:
`ECONOMY.entryCap.proPerYearByAge` on a birthday-to-birthday window since P2 – **14 → 8** professional
events of which at most 3 at W75+, **15 → 10**, **16 → 12**, **17 → 16**, 18+ unrestricted.

### 1b. ⚠ AND THE W75+ SUB-CAP STOPPED BEING HYPOTHETICAL – THEN MEASURED ZERO ANYWAY

`ECONOMY.entryCap.proSubCapByAge` grants a fourteen-year-old three W75-or-above entries inside her
eight, and `world/entryCaps.ts` recorded in as many words that it **could not bind at the shipped
constants at all**, because W75 opened at 17. That is now false: the rung is reachable at fourteen.

⚠ **It still measures 0.0 entries** (§3, the by-age table). The gate simply moved from the DOORWAY to
the ACCEPTANCE LIST – `w75.acceptsRank` is #300 and a fourteen-year-old holds no professional ranking
at all. The comment now says both halves, because "it cannot bind" and "it does not bind" are
different claims and only the second one is true today.

---

## 2. RULING 2 – WHAT THE COLLEGE REMOVAL TOUCHED, AND WHAT IT LEFT STANDING

**GONE** – the rule that could remove the third answer, and everything downstream of it:

| symbol | where | note |
| --- | --- | --- |
| `ENDINGS.collegeClosedFromTier` | `engine/ending.ts` | the constant. Its whole record – round-17 #6, the repealed NCAA rule, P4's correction, P4's §6.1 measurement – is kept verbatim in its place |
| `CollegeResultView`, `collegeDoorOpen` | `engine/ending.ts` | P4's decoupled leaf |
| `collegeStillOpen`, `collegeResultViewOf`, `entryCostsCollege` | `engine/world/endings.ts` | |
| the `answerFork` college guard | `engine/world/endings.ts` | there is no state left to re-validate |
| `Snapshot.fork.collegeOpen`, `UpcomingEvent.costsCollege` | `shared/protocol.ts` | ⚠ both **derived at snapshot time, never persisted** – so no schema bump, no migration, no fixture |
| `ForkDialog`'s `.fork-shut` note and its `v-if` | `ForkDialog.vue` | the third answer is unconditional |
| `COLLEGE_COST_NOTE` | `SeasonScreen.vue` | **P4's warning, removed because it became FALSE** |
| the marker card's `.college-note` | `CalendarScreen.vue` | same |

**STANDING, UNTOUCHED** – everything behind the door: the fork's third answer, `endingForForkAnswer`'s
college branch, `world.college`, P5's four years lived one at a time, `leaveCollege`,
`resumeFromCollege`, the national-team call-up, `tests/college-second-act.test.ts` and
`tests/component/college-second-act.test.ts`. **What went is only the rule that could REMOVE the
choice.**

### 2a. ⚠ THE TWO WARNINGS WENT BECAUSE THEY BECAME FALSE, WHICH IS A STRONGER REASON THAN "UNUSED"

P4 put *"A result here can cost the college place at nineteen – a win at this level makes her a
professional"* on both entry paths, and it was an honest sentence about the rule as it then stood. With
the rule gone it warns about a consequence that cannot happen, on the card where the player is deciding
whether to spend an entry fee. **A false warning on an entry card is worse than no warning** – it
prices a cost into a decision that does not carry it.

### 2b. ⚠⚠ THE ONE THING P4 BOUGHT THAT SURVIVES ITS OWN DELETION

P4's decoupling is why this removal is small. Because `collegeDoorOpen` had already become a leaf that
imports no calendar constant, taking it out touches **no acceptance cut, no points table and no field
size**. Had the removal landed on the pre-P4 code – where `collegeStillOpen` read `TIERS[tier].points`
and the rung was `w75.acceptsRank`'s twin – it would have been a balance change wearing a deletion's
clothes.

---

## 3. MEASURED – P0's FROZEN BATTERY, AND MINE IS THE FOURTH COLUMN

`npx vite-node tools/ladder-baseline.ts --seeds 10`, n = 90 (9 presets x 10 seeds), 676 weeks,
`POLICIES[1]`, identical seeds. 90 careers in 207s. **P0** is the frozen baseline; **P6** is the
pre-correction arm; **corr.** is `junior-access-corrected-2026-08.md`; **now** is this phase.

⚠ **THE PREDICTIONS WERE WRITTEN BEFORE THE RUN** (CLAUDE.md invariant 4) and they are in the table.

### 3a. THE GRADIENT

| first entry, median age | P0 | P6 | corr. | **now** | I predicted | verdict |
| --- | --- | --- | --- | --- | --- | --- |
| W35 | 16.3 | 19.0 | 16.3 | **16.1** | 15.0 | ⚠ **badly wrong** |
| W50 | 16.5 | 19.0 | 17.3 | **17.2** | 17.0 | ✅ |
| W75 | 17.0 | 19.0 | 18.0 | **17.9** | 17.5 | ⚠ close, wrong direction of size |
| W100 | – | 19.0 | 18.6 | **18.3** | 18.3 | ✅ exact |
| WTA 125 | – | – | – | **18.8** | – | – |
| Slam | – | – | – | **21.9** | – | – |

### 3b. THE LADDER AND THE MONEY

| | P0 | P6 | corr. | **now** | I predicted |
| --- | --- | --- | --- | --- | --- |
| rank at 17 (median) | #246 | #423 | #388 | **#375** | #300 ⚠ |
| rank at 19 | #177 | #270 | #154 | **#160** | #140 ⚠ |
| rank at 21 | #185 | #174 | #174 | **#160** | #165 ✅ |
| rank at 25 | #172 | #158 | #160 | **#156** | #158 ✅ |
| career high (median) | – | – | #107 | **#104** | – |
| entries per career | 239 | 265 | 265 | **267** | 275 ✅ |
| **prize by 19** | $125,855 | $69,780 | $119,860 | **$115,205** | $140,000 ⚠ |
| prize by 21 | $251,215 | $211,715 | $251,245 | **$259,570** | $275,000 ✅ |
| career prize | $654,430 | $646,795 | $709,030 | **$685,960** | $760,000 ⚠ |
| counting book full at 19 | 20/90 | 74/90 | 67/90 | **59/90** | 70/90 ⚠ |
| counting book full at 21 | 17/90 | 42/90 | 35/90 | **34/90** | – |
| **bankruptcies** | 1 at 15.3 | 0 | 0 | **2 at 15.8** | 0–1 ⚠ |
| careers ended early | – | 1 at 24.9 | 1 at 24.9 | **2, both bankruptcies** | – |

### 3c. ⭐ THE ERROR IS THE FINDING, AND IT IS THE SAME ERROR P4 MADE

I predicted a large move because five age floors came off at once. **The floors were behind the
acceptance cuts, so removing them freed almost nothing.** The chain is: W15 admits her on her JUNIOR
points (the on-ramp, no professional rank required, median first entry 15.8) → those results give her
a WTA ranking → W35's #700 admits her at 16.1. A fourteen-year-old cannot enter a W35 at any floor,
because unranked is #1601 of that table and #700 refuses her. §1 of the battery makes it explicit:
**every W35 entry in all 90 careers is by a RANKED girl – the "unrk" column is 0.**

⚠ So the ruling's real effect is not the median, it is the **shape at the bottom**: W35's p25 moved
16.0 → 15.6 and its entries at age 15 are now 1.0 a year where they were ~0. The girls who benefit are
the early developers, which is exactly who the rule is about.

### 3d. ⚠ THE ONE COLUMN THAT WENT BACKWARDS, AND IT IS SMALL BUT REAL

**Bankruptcies 0 → 2, both at median age 15.8.** The mechanism is the same one that produced the
gradient: a fifteen-year-old now plays 1.0 W35 a year (fee $400, travel $1,300–2,800) and 3.9 W15s,
and on the weakest-background presets that is a trip too many two years earlier than the family can
carry it. 37 of 90 careers were ever in debt (median first red week 160).

⚠ It is 2 of 90 against P0's 1 of 90, so it is **within the noise of one career** and is reported
rather than acted on. It is on the owner's list in §6.

### 3e. THE COLLEGE DOOR – THE COLUMN THAT STOPS BEING A MEASUREMENT

| | P0 | P6 | corr. | **now** |
| --- | --- | --- | --- | --- |
| still OPEN at the fork | 8% | 96% | 18% | **100%, and not measured** |
| door shut | 86/90 at 17.3 | 83/90 at 19.2 | 83/90 at 18.1 | **there is no rule to shut it** |

⚠⚠ **THE BATTERY STILL PRINTS §6, AND IT IS NOW A COUNTERFACTUAL.** Six measurement tools carried a
college column, and P0's battery is a four-column comparison whose value is that every column measures
the same thing. Deleting the column would make the arms incomparable on the dimension these phases
moved most. So the rule survives **in `tools/retired-college-rule.ts` and nowhere else**, named for
what it is, and every tool that reads it carries a banner saying so. What §6 prints reads *"had the
pre-16.08 rule still been in force it would have fired here"* – **81 of 90 careers, at median 18.1,
W75 in 94% of them** – and in the shipped game the answer is on the card every time.

---

## 4. ⚠⚠ WHAT THIS DOES TO ROUND-21 #8 – SAID OUT LOUD, NOT DROPPED

The owner's round-21 item 8 was: «В 19 не было варианта выбрать колледж, только про или завязать». He
was answered with a sentence on the fork card explaining WHICH RUNG had taken the third answer away,
and that sentence shipped and worked.

**His ruling of 16.08 retires it.** There is no state in which the college answer is missing, so the
explanation has nothing left to explain and it is gone with the flag it read. ⚠ **The complaint that
opened #8 is fixed more completely than #8 fixed it**: he asked why the answer was missing, and it is
not missing. The measurement that justified #8 – 26 of 26 careers reaching the fork with the door
already spent – is kept in the test file and in `ForkDialog`'s own header, because it is the evidence
that the complaint was about the engine and never about the dialog.

Three cases went with it (two in `tests/component/round21-dialogs.test.ts`, one in
`tests/component/endings-ui.test.ts`). Each was replaced by its inverse rather than deleted, and the
replacements are mutation-shaped: they hand the card the RETIRED flag, in both positions, and assert
it changes nothing. A `v-if` restored on `fork.collegeOpen` goes red.

---

## 5. THE GUARDS THAT MOVED – every one, and why

| file | what moved | why |
| --- | --- | --- |
| `tests/age-caps.test.ts` §A3c | **inverted.** *"⚠ AND IT MEASURES ZERO AT THE SHIPPED CONSTANTS"* → *"⭐⭐ AND IT IS LIVE MACHINERY NOW"* | ⭐ **this test was a tripwire and it fired correctly.** Its own note said: *"the day a phase opens one of these rungs lower, this goes red and the sub-cap becomes live machinery."* That day was the ruling. It now asserts the quota's floor IS reachable at 14 and that the WTA rungs are still shut there |
| `tests/age-caps.test.ts` P1 | **re-aimed a third time**, by the same owner, later the same day | it asserted every rung above W15 was shut at 14 and 15. It now sweeps rung by rung against each rung's own SOURCED floor (14 or 15), which is stricter about the WTA four than a blanket shut was |
| `tests/ladder.test.ts` L7 | four pins re-aimed 16/17/17/17 → 14/14/15/14 | the old note described W2-LADDER's and W3-ACT2's invented chain; the pins now name the regulation, and they are the four rungs that MOVED so a silent drift back is caught |
| `tests/ending.test.ts` | **eleven cases retired, three added** | round-17 #6's gate, P4's four decoupling proofs and P4's four warning cases all tested a rule that no longer exists. ⚠ P4's proofs are retired rather than found redundant: with no college rule there is nothing for a calendar constant to couple TO, so the property is structural instead of tested |
| `tests/component/college-warning.test.ts` | **every positive case became a negative one** | same surfaces, opposite claim. The two entry-path cases force the retired `costsCollege` flag on by hand – the strongest available proof that no `v-if` and no string concatenation is still listening |
| `tests/component/round21-dialogs.test.ts` | three cases → one | §4 |
| `tests/component/endings-ui.test.ts` | the two-answer case → a mutation case | hands the card the old flag in both positions and asserts three answers either way |
| `tests/component/home-strip-and-mail.test.ts` | three re-aimed, **three added** | the strip cap, §7 |
| `tests/coach-travel-edge.test.ts` | **six hashes re-frozen**, per-key diff first | §6a |

**Not one guard was deleted or weakened without its replacement being stated in the file.**

---

## 6. THE FROZEN CAREERS AND THE RNG

### 6a. ⭐ THE PER-KEY DIFF – 27 KEYS, AND `entries` IS NOT ONE OF THEM

`tools/frozen-key-diff.ts` from a worktree at `d595f5d` (the commit the wave starts from) against this
branch, all 64 top-level keys hashed on their own, on all three frozen careers. **The same 27 keys
moved on all three.**

* **MOVED**: `results`, `bestFinishByTier`, `kidRank`, `kidRankWta`, the three `prev*` rank caches,
  `seasonStartRank`, `seasonWins`, `seasonLosses`, `seasonRecord`, `seasonHistory`,
  `lastSeasonSummary`, `fundsCents`, `financeWeeks`, `careerTotals`, `skills`, `condition`, `events`,
  `milestones`, `offers`, `academy`, `trophiesByTier`, `knockHistory`, `injuryHistory`,
  `internationalEntryWeeks`, `proEntryWeeks`, `nextEventId`.
* **UNMOVED**: **`entries`, `seasonEntries`**, `coachId`, `coachOnEventWeeks`, `coachOnJuniorEvents`,
  `profile`, `seed`, **`rngMain`**, `cohort`, `schemaVersion`, `season`, `college`, `fork`, `ending`,
  `debtSinceWeek`, `knock`, `injury`, `kit`, `potential`, `plan`, `vacations`, `practices`,
  `penalties`, `birthdays`.

⭐ **`entries` UNMOVED IS THE FINDING.** Every previous re-freeze of that file moved it – a rung that
opens earlier is a rung she enters earlier. Not here: the freeze is 156 weeks (she is 16.6 at the end),
the two grinder arms play nothing paid at all, and the acceptance cuts refuse her at the rungs whose
floors moved. What moved is `results`, and the mechanism is worth naming: **`selectEntrants` filters a
draw's CANDIDATES on the same age gate**, so opening W35+ to fourteen-year-olds changes which cohort
players fill the fields she meets. Different opponents, same calendar, different results.

⚠ `ending`, `college` and `fork` unmoved is ruling 2's half: none of these careers reaches the fork
(week 156 is 32 weeks short of it), so the college removal cannot reach a hash here by construction.

### 6b. THE MAIN STREAM – UNTOUCHED, FOR THE EIGHTH TIME

`rngMain` is among the unmoved on all three careers, so **`tests/condition.test.ts`'s frozen capture is
not re-pinned: count 41550, hash `e6b0c709`.** An age gate is a POST-DRAW filter and the college rule
was a read of `bestFinishByTier`; neither taps a stream. The companion `kidRank: 93` also holds.

### 6c. NO SCHEMA MOVE

Both removed protocol fields (`fork.collegeOpen`, `UpcomingEvent.costsCollege`) were **derived at
snapshot time and persisted nowhere**, which is the property that let them ship without a migration and
is the property that lets them go without one. `SAVE_SCHEMA_VERSION` is unchanged, no migration is
added, no golden fixture is needed. ⚠ The e2e corpus is unaffected: it stores worlds, not snapshots.

---

## 7. THE 375px STRIP – RE-MEASURED, AND THE HYPOTHESIS WAS WRONG

`e2e/responsive.spec.ts` was RED at 375px: the Home season strip measured **178.28 against a 170
ceiling**, with `STRIP_MAX_RUNGS = 5` already in place. The stated hypothesis was that ruling 1 would
fix it, because two of the five chips read `🔒 Opens at 16`.

**It does not.** Measured on the e2e `junior` fixture (age 15, week 120 – the exact career the spec
loads), the two chips change like this:

| chip | before | after |
| --- | --- | --- |
| W35 | `🔒 Opens at 16` (14 chars) | `Used 10 of 10` (13) |
| W50 | `🔒 Opens at 16` (14) | `🔒 Opens in the top 330` (23) |

**Net +8 characters.** The lock did not disappear – it moved from the age gate to the acceptance list,
and the acceptance list's sentence is longer. Swept 240–375px in a real Chromium
(`tools/strip-wrap-probe.mjs`, new): the new labels give the **same row count at 114 of 136 widths**,
one fewer at 301–307px, one MORE at 240–254px, and **at the 315px this card actually has, identical.**

### 7a. SO THE CAP IS THE LEVER, AS THE BRIEF SAID – AND IT IS NOW MEASURED RATHER THAN CHOSEN

`tools/strip-wrap-probe.mjs` serves the worktree, renders the strip's own markup against the app's real
stylesheet and real self-hosted faces, and reads the boxes off Chromium. The container is **315px** at
a 375px viewport (375 − 2×16 `--app-pad-x` − 2×14 the Card's padding; `.app-content` adds none).

```
  cap 5   4 rows at 315px      J60 · J300 · W15 · W35 · W50
  cap 4   3 rows at 315px            J300 · W15 · W35 · W50      <- shipped
  cap 3   3 rows                            W15 · W35 · W50
```

One chip row is **29.4px** (= 178.28 − 148.9, the spec's own two numbers) and the overshoot is
**8.28px**, so exactly one row has to go. **`STRIP_MAX_RUNGS` 5 → 4** removes exactly one at every
width the card can be, and cap 3 removes no more. The ceiling is untouched.

⚠ **I have not run `e2e/responsive.spec.ts`** – the browser suite is the owner's. The prediction is
that it comes back at **~148.9px against 170**, and §7's arithmetic is the whole of the reasoning.

### 7b. TWO THINGS FOUND WHILE MEASURING

1. **A leftover comment described a filter that had already been withdrawn.** `stripVisible` carried a
   paragraph beginning *"AND A RUNG SHE IS TOO YOUNG FOR IS NOT PART OF HER WINDOW"* above code that no
   longer filtered on age. Ruling 1 makes the idea moot as well (the two verdicts no longer disagree on
   this row), so the paragraph is replaced by the record of why the filter was tried and withdrawn.
2. ⚠ **The cap's escape hatch is keyed on the wrong thing.** It is documented as being for the
   no-verdict fallback, and it is implemented as *"every rung is open"* – so a career that genuinely
   opened all sixteen rungs would skip the cap too. `tierOutgrown` closes the rungs beneath her, so
   that state is not reachable today. **Flagged, not fixed** – the new mounted guard names the boundary
   so nobody has to rediscover it from a wrapped row.

---

## 8. ⚠ FOR THE OWNER

### 8.1 THE HARD ACCEPTANCE CUTS ARE NOW A DATED RULING, NOT A STATUS QUO

Asked on 16.08 whether the regulation's soft tail (research §4-A: one shared System of Merit, an
ORDERING, an unranked player placed at the bottom of the list rather than refused) should replace our
hard cuts, he answered: **«пусть остануться жесткие отсечки, доделывайте всё остальное».**

**No `acceptsRank` or `enterPct` moved in this phase.** w35 700 · w50 330 · w75 300 · w100 240 ·
wta125 180 · wta250 200 · wta500 120 · wta1000 65 · slam 104 are exactly as P3 left them. ⚠ This is
recorded here because §3c makes the cuts MORE load-bearing than they were – they are now the only gate
below eighteen – so the next agent who reads §4-A and reaches for a soft tail should find the decision
rather than re-derive the question.

### 8.2 TWO BANKRUPTCIES AT 15.8 (was 0)

§3d. Small, within one career of noise, and the mechanism is the one the ruling is for: a fifteen-year-
old can now afford one W35 trip a year that she previously could not enter at all. **Reported, not
acted on.** If it should be damped, the lever is the AER row for 15 (10 events) rather than a floor.

### 8.3 THE SUB-CAP IS REACHABLE AND STILL DOES NOTHING

§1b. The WTA's three-W75s-inside-eight rule is now a rule about a rung a fourteen-year-old can reach –
and she reaches it 0.0 times a year, because #300 refuses her. Nothing to do; it is stated so the next
reader does not take the comment's "it can bind now" as "it does bind".

### 8.4 THE 375px MEASUREMENT NEEDS YOUR BROWSER SUITE

§7a. The arithmetic says the strip lands at ~148.9 against 170. It is the one claim in this spec that I
could not close myself.

---

## 9. WHAT THE NEXT PHASE MUST NOT READ OFF THIS

* **`docs/specs/college-gate-decoupled-2026-08.md` (P4) is superseded on its subject, and its §6.1 is
  CLOSED.** That spec stated three options and refused to choose; the owner chose **(B), delete the
  gate outright**, and its own note that (B) *"deletes round-21 #8's shut-door sentence"* is exactly
  what happened – see §4. Everything P4 says about the decoupling and about the repealed NCAA rule
  stands, and §2b is why the decoupling still earned its cost.
* **`docs/specs/junior-access-corrected-2026-08.md` §4's trade is dissolved rather than resolved.** It
  put a real tension to the owner – the correction and the college door pulling against each other –
  and recommended option (B), moving `collegeClosedFromTier` up a rung. He went further and removed
  the constant, so there is no trade left. Its §3a/§3b columns are the third arm of §3 here.
* **The age floors are not a balance lever any more.** §3c is the reason: they were never the binding
  constraint above W15 and they are gone. A phase that wants a girl to arrive earlier or later has the
  acceptance cuts, the AER counts, and nothing else on this axis.
* ⚠ **`tools/retired-college-rule.ts` is a bench definition and must never be imported by `src/`.** It
  exists so four columns of a frozen battery stay comparable. Any figure quoted from it carries the
  sentence in its own header: in the shipped game the college answer is always on the card.

---

## 10. FILES

| file | what changed |
| --- | --- |
| `src/engine/season/calendar.ts` | nine `minAgeYears`; every old comment kept above the line that reverses it |
| `src/engine/economy.ts` | the `cappedProTiers` note's *"every act-3 rung opens at 17"* corrected |
| `src/engine/world/entryCaps.ts` | the sub-cap's "cannot bind" item, in both directions (§1b) |
| `src/engine/world/birthday.ts` | the sixteenth-birthday row's stated reason, spent by two rulings |
| `src/engine/ending.ts` | `collegeClosedFromTier`, `CollegeResultView`, `collegeDoorOpen` retired with their record |
| `src/engine/world/endings.ts` | `collegeStillOpen`, `collegeResultViewOf`, `entryCostsCollege`, the `answerFork` guard |
| `src/engine/world/snapshot.ts`, `src/engine/world.ts`, `src/shared/protocol.ts` | the two derived fields and the re-exports |
| `src/components/ForkDialog.vue` | the third answer is unconditional; the shut-door note and its rung lookup gone |
| `src/components/screens/SeasonScreen.vue`, `CalendarScreen.vue` | P4's warning, on both entry paths |
| `src/components/screens/HomeScreen.vue` | `STRIP_MAX_RUNGS` 5 → 4, measured; the withdrawn filter's record |
| `tools/retired-college-rule.ts` | **new.** One definition of the retired rule, for the benches only |
| `tools/strip-wrap-probe.mjs` + `.html` | **new.** The strip's wrap, in a real Chromium |
| `tools/ladder-baseline.ts` + 5 others | re-pointed at the retired rule, each with a counterfactual banner |
| nine test files | §5 |

**Reproduce:**

```bash
npx vite-node tools/ladder-baseline.ts --seeds 10   # §3 – n 90, 676 weeks, 207s
node tools/strip-wrap-probe.mjs                     # §7 – the strip's wrap at 315px
npx vite-node tools/frozen-key-diff.ts --preset 0 --policy 1   # §6a, against a worktree
npm run test:quiet && npm run test:component
```
