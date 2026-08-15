---
type: spec
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-15
---

# P0 – the frozen baseline: the whole career, measured before anything moves

**The owner, 15.08, predicting the consequence of his own plan:**

> «после этой правки у нас нужны будут отдельные перемеры карьер, потому что текущие прогрессы
> потеряют актуальность – скорость и продвижение точно упадут.»

He is right, and `docs/plans/college-and-the-junior-ladder.md` is built around it: **five changes all
push the same way and they compound.** Shipped together, "it got slower" is unattributable. This page
is the thing that makes it attributable – **if P1 costs her four years, somebody has to be able to say
*four*.**

**NO ENGINE FILE IS TOUCHED.** `tools/ladder-baseline.ts` imports the engine and reads it. It patches
no constant, not even in memory. Every threshold it prints is read *out* of the engine – `ENDINGS`,
`TIERS`, `TIER_LADDER`, `BEST_N_BY_TRACK` – rather than restated, which is the property that lets P1–P6
point the same tool at a **changed** engine and get a comparable table without editing a line of it.

---

## 0. THE ONE BOX

> ### THE BASELINE CAREER, ON THE TREE AS IT STANDS (n = 90, ages 13.6 → 26.6)
>
> She enters her **first W75 at 17.0** ranked **#272**, wins a match there at **17.2**, and the college
> door shuts on **86 of 90** careers at median age **17.1**. By nineteen she is **WTA #177** with
> **$125,855** banked and **15 of her 18** counting slots filled. She plays **~16 events a season** from
> eighteen onward, peaks at **#111** at **23.4**, and **88 of 90 careers are still running at 26.6**.
>
> ### ⭐ AND IT CORRECTS THE PLAN BEFORE P2 STARTS.
> The plan says of the WTA age-eligibility rule *«We model none of this»*. **We model all of it** – the
> rulebook's own rows, its own ledger, and a refusal that names the rule – and measured per year of her
> life it binds everywhere except **one year**: at sixteen she plays **18.8** professional events
> against a rulebook **12**, because the allowance's *window* is the season block while its *limit* is
> her age, so her sixteenth year straddles two allowances. **P2's job is the window, not the table**
> (§3c-bis).
>
> ### ⚠ AND THE OTHER THING IT ESTABLISHED IS THAT A PUBLISHED FIGURE HAD ALREADY GONE STALE.
> `docs/specs/college-fork-2026-08.md` (15.08) reports 84/90 reaching a W75 and 86/90 closures at mean
> 17.3. On **this** tree the same tool, re-run on the same seeds, gives **83/90** and **83/90 at 17.2**
> – and this baseline reproduces the re-run **cell for cell**. Neither run is wrong: three engine
> commits landed after that spec's own commit. **§4 is the audit.** It is also the argument for this
> page existing at all – a number measured against a moving tree has a shelf life of days.

---

## 1. HOW TO READ THE EVIDENCE

* **n = 90.** `tools/ladder-baseline.ts`, **9 presets × 10 seeds**, `POLICIES[1]` – the bench's rebuilt
  *model of a reasonable parent* (`docs/specs/the-wall-2026-08.md` §7). ⚠ **`POLICIES[0]` is not an
  alternative reading of the same world**: the grinder enters a W75 in 7 careers of 90 against this
  arm's 83, so every absolute verdict taken off the old policy is a verdict about a parent who never
  bought the entries. The arm is still selectable (`--policy 0`), because *"the ladder is slow"* and
  *"the parent did not pay"* are two claims and only a second arm tells them apart.
* **Seeds, exactly.** `openCareer(preset, index, policy)` builds the string `bench-<background>-<index>`
  and calls `createWorld(seed, profile)`; `rngFromSeed(world.seed)` is the MAIN stream. Those are the
  **only two** entropy sources – no wall clock, no `Math.random`. So the seed set is
  `bench-working-0..9`, `bench-middle-0..9`, `bench-wealthy-0..9`, each crossed with the coach rungs its
  background carries (3 + 4 + 2 = 9 presets).
  ⚠ **A row's identity is `<presetIndex>:<seedIndex>`, never the seed string** – three presets share a
  background, so `bench-working-0` names three different careers. `college-fork-2026-08.md` §6 records
  what keying on the string cost there.
* **Determinism is proved, not asserted.** Two full replays of the same invocation were diffed and are
  **byte-identical**. A later phase's diff therefore measures the change and not the noise.
* **The horizon is 676 weeks = 13 season blocks.** ⚠ **Week 0 is not age 14.** `START_AGE_YEARS` is the
  *band*; her age is `kidAgeExact`, and on `DEFAULT_PROFILE`'s 15 June birthday she is **13.58 at week
  0** and **26.58 at the end** (the 09.08 ruling, `src/engine/world/age.ts`). Thirteen blocks contain
  every complete age band from 14 to 25; the 13 and 26 bands are part-years and are marked as such.
* **⚠ Every career here is a 15-June girl.** `openCareer` overrides only `background` and `coachTier`,
  so the relative-age effect is real in this engine but is **not a variable in this baseline**. A phase
  that varies the birth date must say so.
* **⚠ "unranked" is a real state and is never averaged in.** `kidRankWta` always holds a number, and a
  girl with no professional points reads the table's no-points floor – **#1601+** on today's 1,800-row
  merged table. Every rank figure below is reported over the careers **holding points**, with the rest
  counted in their own column. Folding the floor into a mean invents a ranking for a girl who has none.
* **⚠ TWO ENGINE QUESTIONS ARE LEFT UNANSWERED, AND THE BASELINE IS DEFINED BY THAT.** The **fork at
  nineteen** is never answered – `tickWeek` has no ended-world early return, so the career simply runs
  on, which is the *continue* branch in all but the recorded answer. The **retirement offer** is never
  answered either, so §3g reports *when the question was put*, not a retirement. Both are stable
  properties of the tool, so P6 inherits them and the diff stays honest.
* **⚠ RIGHT-CENSORING.** 88 of 90 careers are still running when the horizon stops. Career high, career
  prize and career length are therefore *"by 26.6, or by the week the story stopped"* – never lifetime.

---

## 2. THE FROZEN COLUMNS – and what each one is FOR

**A later phase reports against these columns and no others.** That is the whole contract: the tool
re-runs unchanged against a changed engine, and the diff is column by column.

| column | what it is FOR | the phase that moves it |
| --- | --- | --- |
| **age at first entry, per rung** | the ladder's *pace* – how old she is when each door first opens to her | **P1** (the Accelerator closes the doors above W15) |
| **rank at first entry, per rung** | whether a rung admits her on *merit* or on a *birthday*; the gap between the cut and the rank she actually holds | P1, P3 |
| **age at first counting result, per rung** | the line between "tried the tour" and "is on it" – and the exact read `collegeStillOpen` makes | P1, P4 |
| **reach (careers that ever entered)** | whether the ladder *sorts* anybody, or whether the whole cohort walks up it | P1, P3 |
| **rank at 17 / 19 / 21 / 25** | the progression curve at four fixed points, so a slowdown has a size at each | **P1 + P2 compounded**, P6 |
| **career high, and the age it fell** | the ceiling, and *when* – a change that only delays her looks identical to one that lowers her until you have both | P6 |
| **entries per age × rung** | ⚠ the column **P2** moves most, and it must be per-**age**: the WTA rule caps by how old she is while the engine's allowance *window* is the season block | **P2** (the AER), P1 |
| **entries per season block** | the window an allowance actually resets on, so a cap can be checked against its own denominator | P2 |
| **prize banked by 19** | the fork's own money column, and the input every college proposal was scored against | P4, P6 |
| **prize career** | whether the tennis ever pays for itself once she is past the junior sink | P6 |
| **counting book: points and filled slots at 19 / 21** | ⚠ the *thinning* test. Fewer entries mean fewer counting results before they mean a worse rank, so this moves **before** rank does and is the early-warning column | **P2**, P6 |
| **college closure rate + age distribution** | whether the door is a decay or a switch thrown on a birthday | P1, P4 |
| **open at the fork / open a season later** | ⚠ two different numbers. The first is inflated by careers that hold the door on the fork week and lose it a fortnight later | P4 |
| **endings by type, and the age** | survival – and *which* of the ways a career can stop is the one that actually fires | P2, P6 |
| **ever in debt** | the warning phase bankruptcy is the twelfth week of; it fires far more often than bankruptcy does | P2 |
| **career length** | the owner's own question, made a number | P6 |

**Anything continuous is reported p25 / median / p75 at minimum.** A median cannot show shape, and the
later phases need shape: a change that moves p75 and leaves p25 alone is a different finding from one
that moves the whole distribution.

---

## 3. THE FROZEN TABLES

Reproduce with `npx vite-node tools/ladder-baseline.ts` (defaults are the frozen run).

### 3a. The ladder, as it admits her

*first entry* and *first count* are her exact age, p25 / median / p75. *rank then* is her WTA rank the
week of that first entry, over the careers holding a professional ranking; *unrk* counts those that
entered with none.

| rung | minAge | cut | reach | first entry | rank then | unrk | first count |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Local | – | – | 90/90 | 13.6 · **13.6** · 13.6 | unranked | 90 | 13.6 · **13.6** · 13.6 |
| Regional | – | – | 90/90 | 13.8 · **13.8** · 14.0 | unranked | 90 | 13.9 · **14.1** · 14.1 |
| National | – | – | 88/90 | 14.2 · **14.3** · 14.4 | unranked | 88 | 14.3 · **14.3** · 14.7 |
| J30 | 13 | – | 90/90 | 14.3 · **14.7** · 14.9 | unranked | 90 | 14.4 · **14.8** · 15.0 |
| J60 | 13 | 0.50 | 90/90 | 14.5 · **14.8** · 15.0 | unranked | 90 | 14.6 · **14.8** · 15.2 |
| J300 | 13 | 0.40 | 89/90 | 14.6 · **15.0** · 15.6 | #199 · #217 · #238 | 85 | 14.9 · **15.4** · 15.9 |
| W15 | 16 | – | 87/90 | 15.9 · **15.9** · 16.1 | unranked | 87 | 16.0 · **16.1** · 16.2 |
| W35 | 16 | #700 | 86/90 | 16.2 · **16.3** · 16.6 | #547 · **#604** · #639 | 0 | 16.3 · **16.4** · 16.7 |
| W50 | 16 | #550 | 86/90 | 16.3 · **16.5** · 16.8 | #421 · **#476** · #515 | 0 | 16.6 · **16.7** · 17.0 |
| **W75** | **17** | **#450** | **84/90** | 16.9 · **17.0** · 17.1 | #231 · **#272** · #326 | 0 | 17.1 · **17.2** · 17.6 |
| W100 | 17 | #350 | 86/90 | 17.0 · **17.5** · 17.7 | #232 · **#260** · #289 | 0 | 17.2 · **17.7** · 17.9 |
| WTA 125 | 17 | #250 | 86/90 | 17.4 · **17.8** · 18.2 | #201 · **#217** · #231 | 0 | 17.8 · **18.2** · 18.9 |
| WTA 250 | 17 | #200 | 86/90 | 17.8 · **18.2** · 18.6 | #177 · **#188** · #196 | 0 | 18.1 · **18.4** · 19.0 |
| WTA 500 | 17 | #120 | 51/90 | 20.2 · **21.5** · 22.9 | #112 · **#115** · #118 | 0 | 20.5 · **22.5** · 23.3 |
| WTA 1000 | 17 | #65 | 13/90 | 21.1 · **22.3** · 23.6 | #38 · **#56** · #62 | 0 | 21.5 · **22.3** · 23.9 |
| Slam | 17 | #104 | 35/90 | 21.0 · **22.0** · 24.0 | #95 · **#101** · #104 | 0 | 21.3 · **22.5** · 24.1 |

⚠ **THE LADDER STOPS SORTING AT WTA 250 AND ONLY THERE.** 82–90 careers of 90 walk through every rung
up to WTA 250; the first door that refuses anybody is **WTA 500 (51/90)**, and it does so on *rank*,
four years later. Between W15 and WTA 250 the ladder is a corridor, not a ladder – which is the finding
`college-fork-2026-08.md` §5.2 reached from the other end and the one **P1 exists to change**.

⚠ **AND THE JUNIOR RUNGS ADMIT AN UNRANKED GIRL BY CONSTRUCTION** – 87 of 87 enter a W15 with no
professional point at all, which is exactly the "W15 as our own invention" `plan §P1.1` is about.

### 3b. Rank at the four frozen ages, and the career high

Over the careers **holding professional points** at that age; the rest are counted.

| at age | ranked | best | p25 | **median** | p75 | p90 | worst |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 17 | 78/90 | #162 | #206 | **#246** | #294 | #441 | #984 |
| 19 | 84/90 | #54 | #151 | **#177** | #201 | #256 | #1027 |
| 21 | 86/90 | #16 | #160 | **#185** | #249 | #299 | #361 |
| 25 | 86/90 | #10 | #132 | **#172** | #205 | #239 | #314 |

**Career high: 87/90 ever ranked · best #7 · p25 #89 · median #111 · p75 #142 · worst #870.**
**The age it fell: min 16.3 · p25 21.4 · median 23.4 · p75 24.9 · max 26.6.**

⚠ **HER RANK BARELY MOVES BETWEEN 19 AND 25** – #177 → #185 → #172 at the median, while the *career
high* sits at #111. So the median career peaks somewhere in its early twenties and gives most of it
back, and the interquartile band never leaves #130–#250 after nineteen. **That flatness is the
baseline's shape**, and P6's question is whether P1–P3 lower it, delay it, or both.

⚠ The ITF (junior) column empties by design: no junior point can be earned from 18, so a 21-year-old's
ITF rank is the floor of a table she left. It is reported at 17 (84/90 ranked, median #49) and is
honestly *unranked* at 21 and 25.

### 3c. Entries by age and by rung – the column P2 moves

Mean entries in that **year of her life**, over all 90 careers. *live* is the same mean over the careers
not yet ended; the gap between them is the survival cost.

| age | live | all | live | W15 | W35 | W50 | W75 | W100 | W125 | W250 | W500 | W1000 | Slam |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 13 ⚠part | 90 | 11.0 | 11.0 | – | – | – | – | – | – | – | – | – | – |
| 14 | 90 | **20.1** | 20.1 | – | – | – | – | – | – | – | – | – | – |
| 15 | 90 | **19.4** | 19.4 | 0.8 | – | – | – | – | – | – | – | – | – |
| 16 | 89 | **25.7** | 26.0 | 10.1 | 4.8 | 3.4 | 0.4 | – | – | – | – | – | – |
| 17 | 88 | **23.6** | 24.1 | 0.7 | 1.0 | 3.2 | 3.1 | 1.8 | 0.9 | 0.6 | – | – | – |
| 18 | 88 | 16.1 | 16.5 | 0.3 | 0.3 | 1.6 | 2.8 | 2.7 | 2.8 | 4.4 | 0.2 | – | – |
| 19 | 88 | 15.3 | 15.6 | 0.4 | 0.2 | 1.6 | 2.6 | 2.4 | 2.8 | 4.4 | 0.6 | 0.1 | 0.1 |
| 20 | 88 | 15.6 | 16.0 | 0.1 | 0.3 | 1.2 | 2.4 | 2.4 | 2.6 | 4.9 | 1.0 | 0.1 | 0.2 |
| 21 | 88 | 16.4 | 16.8 | – | 0.1 | 1.4 | 2.6 | 2.5 | 3.0 | 4.5 | 1.3 | 0.3 | 0.4 |
| 22 | 88 | 16.3 | 16.7 | – | 0.1 | 1.2 | 2.2 | 2.6 | 2.5 | 4.7 | 1.8 | 0.5 | 0.4 |
| 23 | 88 | 15.8 | 16.1 | – | 0.1 | 0.9 | 2.0 | 2.2 | 2.6 | 4.8 | 1.9 | 0.6 | 0.4 |
| 24 | 88 | 16.2 | 16.6 | – | 0.1 | 1.1 | 2.1 | 2.5 | 2.8 | 5.0 | 1.6 | 0.5 | 0.4 |
| 25 | 88 | 16.5 | 16.9 | – | 0.1 | 1.3 | 2.1 | 2.3 | 2.6 | 4.7 | 2.0 | 0.6 | 0.5 |
| 26 ⚠part | 88 | 9.9 | 10.1 | – | – | 0.8 | 1.1 | 1.4 | 1.4 | 3.0 | 1.1 | 0.3 | 0.5 |

The junior columns, for the ages they exist at: **J30** 6.1 (14) · 8.8 (15) · 2.9 (16) · 5.2 (17);
**J60** 3.0 · 6.4 · 2.6 · 4.2; **J300** 0.7 · 1.6 · 0.6 · 0.9; **Local/Regional/National** 9.6/1.4/0.0
at 13 and 0.4/7.3/2.6 at 14.

**Per season block:** S0 21.9 · S1 19.2 · S2 24.2 · S3 **27.0** · S4 17.1 · S5 15.6 · S6 15.0 · S7 15.8
· S8 16.5 · S9 16.0 · S10 16.5 · S11 16.4 · S12 16.6.
**Whole horizon:** p25 231 · **median 239** · p75 246 entries per career (min 34 / max 314).

⚠ **AND THE ⚠part BANDS ARE PART-YEARS**, not annual rates – week 0 is age 13.6 and the horizon ends at
26.6, so the first and last bands are fractions of a year.

#### ⭐ 3c-bis. THE ENTRY CAPS ARE ALREADY IN THE ENGINE – AND THE ONE PLACE THEY LEAK IS MEASURABLE

This is the correction P2 needs before it starts, and it is the reason this table is split by rule
family. `docs/plans/college-and-the-junior-ladder.md` §0(b) says of the WTA age rule *«We model none of
this»*. **That is not what the engine says.** `ECONOMY.entryCap` carries **two** parallel caps, and both
**refuse an entry** through `availabilityStatus` (`src/engine/world/medical.ts`): the ITF junior cap over
`['j30','j60','j300']`, and the **pro AER** over the whole W family, with the rulebook's own rows
`{14: 8, 15: 10, 16: 12, 17: 16, 18+: unlimited}`, its own persisted ledger (`proEntryWeeks`, schema
v36) and a refusal that names the rule.

Measured against them, per **year of her life**:

| age | **pro-family entries** | AER row | | **junior-family entries** | ITF row |
| --- | --- | --- | --- | --- | --- |
| 14 | 0.0 | 8 | | 9.7 | 14 |
| 15 | 0.8 | 10 | | 16.8 | 18 |
| **16** | **18.8** | **12** ⚠ | | 6.0 | 25 |
| 17 | 11.4 | 16 | | 10.3 | – |
| 18+ | 15.1 – 16.3 | unlimited | | ~0 | – |

> **EXACTLY ONE YEAR OVERSHOOTS, AND THE CAUSE IS A WINDOW, NOT A MISSING RULE.** The allowance's
> **window** is the 52-week season block (`seasonStartWeek`); its **limit** is the row for the age she
> actually is in the event's week (`kidAgeAt`) – deliberately parted by the one-clock ruling of 09.08,
> and documented as such in `entryCaps.ts`. A June girl's *sixteenth year* therefore straddles **two
> season blocks and two separate allowances** (the tail of one at 12, the head of the next at 16), so a
> birth-year count of up to 28 is reachable and we measure **18.8 against a rulebook 12**.
>
> **So P2's real work is not the table – the table is already right. It is the WINDOW** (the WTA rule
> is by birth year), **plus the Merited Increases, plus the cohort.** And the size of the prize is one
> year of her career, not four.

⚠ **AND THE CAP DEMONSTRABLY FIRES** – the evidence is in the table above, at age 17. J30 goes 2.9 → 5.2
and J60 2.6 → 4.2 while Local comes back from 0.4 to 1.6. That is `ladder.ts`'s own clause for the
owner's ruling 2 (*«игрок должен иметь возможность играть, если не w-серии то где-то еще»*): a spent pro
allowance lifts the ceiling on the non-professional rungs. **She is playing junior tennis at seventeen
because the tour has told her she may not play any more of its own.**

### 3d. Prize money banked

| by | min | p25 | **median** | p75 | p90 | max |
| --- | --- | --- | --- | --- | --- | --- |
| **age 19** | $0 | $103,840 | **$125,855** | $152,288 | $178,233 | $799,340 |
| age 21 | $0 | $203,868 | **$251,215** | $314,728 | $427,802 | $4,035,740 |
| career | $0 | $513,530 | **$654,430** | $1,151,755 | $2,433,985 | $12,480,940 |

⚠ **$125,855 BY NINETEEN IS THE NUMBER `college-fork-2026-08.md` §5 ASKED TO HAVE CHECKED AGAINST
REALITY** (it read $129,190 there) – whether a real WTA #177 nineteen-year-old has banked anything like
it is an external question and is not answered here.

### 3e. The counting book – of 18 slots

The window's width is read from `BEST_N_BY_TRACK.wta`; a phase that re-sizes it gets a table about the
new width.

| at age | points p25 / **median** / p75 (max) | slots p25 / **median** / p75 (max) | book full |
| --- | --- | --- | --- |
| 19 | 323 / **391** / 516 (1321) | 14 / **15** / 17 (18) | 20/90 |
| 21 | 262 / **381** / 478 (2541) | 13 / **15** / 17 (18) | 17/90 |

⚠ **THE BOOK IS ALREADY THREE-QUARTERS FULL AT NINETEEN, AND THAT IS WHY IT IS THE EARLY-WARNING
COLUMN.** Fewer entries thin the book before they move the rank, because an unfilled slot is worth zero
in the fold. A phase that cuts entries and leaves rank alone has not been measured yet – it has been
measured too early.

### 3f. The college door

| | n = 90 |
| --- | --- |
| door **shut** | **86 / 90 · 96%** – mean age 17.3, **median 17.1** |
| reached the fork (19) inside the horizon | 90 / 90 |
| still **open at the fork** | **7 / 90 · 8%** |
| ⭐ still open a **full season later** | **4 / 90 · 4%** |

**Which rung shut it:** W75 **62 (72%)** at mean 17.4 · W100 12 (14%) at 17.2 · WTA 125 6 (7%) at 17.3
· WTA 250 6 (7%) at 17.0.

**The age it shuts** (86 closures): under 17 **0%** · 17–17.9 **78 (91%)** · 18–18.9 5 (6%) · 19+ 3 (3%).
min 17.0 · p25 17.1 · **median 17.1** · p75 17.3 · p90 17.8 · max 19.8.

> ⚠⚠ **THE CLOSURE IS AN EVENT, NOT A DISTRIBUTION**, and this baseline confirms it on the current
> tree: **not one career loses the door before 17.0**, and 91% lose it inside the eleven months after
> her seventeenth birthday. That is `w75.minAgeYears` and nothing else – the cut is cleared long
> before the birthday is.
>
> ⭐ **AND THE "OPEN AT THE FORK" NUMBER IS INFLATED BY A RACE.** Of the seven that hold the door on the
> fork week, **three lose it inside the following season** (weeks 315 / 321 / 326, ages 19.58 / 19.75 /
> 19.83). `college-fork-2026-08.md` §3a found this by hand and could not see past its own 312-week
> horizon; the **season-later column measures it**, and the answer is **4**.

### 3g. Survival

| ending | careers | age min / median / max |
| --- | --- | --- |
| **still running at 26.6** | **88 · 98%** | ⚠ right-censored |
| bankruptcy | 1 · 1% | 15.3 |
| injury (career-ending) | 1 · 1% | 16.2 |

* **ever in debt at all: 39 / 90 · 43%**, median first red week 121 – the warning phase fires **39
  times** for every bankruptcy that lands, which is the grace window doing its job.
* **retirement question raised: 12 / 90 · 13%**, all of them the **plateau** reading, at mean age 25.6.
  ⚠ Never answered by this tool, so it is a *question put*, not a retirement.
* **career length:** min 15.3 · p25 26.6 · median 26.6 · p75 26.6 (censored).

⚠ **SURVIVAL IS NOT A CONSTRAINT ON THIS BUILD TODAY, AND THAT IS ITSELF THE BASELINE.** 98% of careers
run the full thirteen seasons. If P1 and P2 push entries down and money with them, this is the row that
tells us whether the slowdown became a *cull* – and it has nowhere to go but down.

---

## 4. THE REPLICATION CHECK – and the one disagreement, named

The brief for this phase supplied four figures from `college-fork-2026-08.md` to check against. **They
do not reproduce on this tree, and the tool is not the reason.**

`tools/ladder-baseline.ts` §8 restricts its reads to the **first 312 weeks** – that spec's own horizon –
so the two are comparable rather than merely similar. Then `tools/college-fork.ts` itself was **re-run
unchanged**, same seeds, same policy, n = 90, on the same pinned tree.

| | spec, as published | **college-fork re-run, this tree** | **this baseline, §8 window** |
| --- | --- | --- | --- |
| W75 first entry | 17.2 / #279 | **17.2 / #283** | **17.2 / #283** |
| W100 first entry | 17.5 / #259 | **17.4 / #258** | **17.4 / #258** |
| WTA 125 first entry | 17.8 / #218 | **17.8 / #214** | **17.8 / #214** |
| WTA 250 first entry | 18.0 / #188 | **18.0 / #185** | **18.0 / #185** |
| ever entered a W75 | 84 / 90 | **83 / 90** | **83 / 90** |
| ever won a match at W75 | 84 / 90 | **81 / 90** | 81 / 90 |
| college door shut | 86 / 90, mean 17.3 | **83 / 90, mean 17.2** | **83 / 90, mean 17.2** |
| W75's share of closures | 76% | **71%** | 71% |
| still open at the fork | 7 / 90 | **7 / 90** | **7 / 90** |
| genuinely open | 4 | – (not measurable there) | **4 / 90** |

> ### ⭐ THE BASELINE AND THE RE-RUN AGREE IN **EVERY CELL OF ALL SIXTEEN RUNGS**, INCLUDING THE
> ### UNRANKED FLOORS (#1601 / #1604 / #1609 / #1611 / #1550 / #1615).
> That is not "close". It is a byte-level replication, and it is what licenses this page as a baseline.

**So which run is wrong? Neither.** The spec's figures are correct for **the tree they were measured
on** and stale on this one. `docs/specs/college-fork-2026-08.md` landed in commit `913008b`; three
commits have touched `src/engine/` since, all of them round-21 #2:

| commit | what it moved |
| --- | --- |
| `3e8f3e1` | the helping follows the fare – W series only, never a friendly |
| `f9104eb` | the support does not buy the coach a plane ticket |
| `925439e` | his seat is not covered, and the juniors are his to buy – schema **v49** |

They rewrote `src/engine/world/sponsors.ts` (+69 lines) and with it **what a trip costs the family**.
The entry policy commits only when `fundsCents − (entryFee + travel) ≥ reserve`, so a changed fare
moves marginal careers off the top rungs – which is precisely the shape of the difference: one fewer
W75 entrant, three fewer W75 *winners*, three fewer closures, and the closure age falling 17.3 → 17.2.
Nothing else moved: the seven that reach the fork with the door open are **the same seven**.

⚠ **AND THE LESSON IS THE ONE THIS PHASE EXISTS TO TEACH.** Two specs measured the same quantity four
days apart and disagree by three careers because the tree moved underneath them. **The baseline was
therefore measured in a git worktree pinned at `ea8b97f`**, so the P1 agent's concurrent engine edits
could not move it mid-run. Any later phase re-running this tool should pin the same way.

⚠ **ONE MORE READING DIFFERENCE, DELIBERATE AND NOT A DISAGREEMENT.** `college-fork.ts` folds the
no-points floor into its *rank then* mean; §3a above reports the ranked careers only and counts the
rest. §8 reproduces the raw reading so the comparison stays honest. The two differ **only** at rungs
that admit an unranked girl – which is every rung below W35.

---

## 5. WHAT THIS WAVE EDITS

| file | change | risk |
| --- | --- | --- |
| `tools/ladder-baseline.ts` | **new.** Measurement only; patches nothing, in memory or otherwise. | none |
| `docs/specs/ladder-baseline-2026-08.md` | this file | none |

**No engine constant moves. No test moves. Nothing under `src/` is touched.**

**How to re-run it, unchanged, for a later phase:**

```bash
npx vite-node tools/ladder-baseline.ts                     # the frozen defaults – n 90, 676 weeks
npx vite-node tools/ladder-baseline.ts --json after.json   # machine-readable summary, for the diff
npx vite-node tools/ladder-baseline.ts --csv after.csv     # one row per career
npx vite-node tools/ladder-baseline.ts --policy 0          # the contrast arm, not a second baseline
```

The `--json` summary is keyed by **rung / age / ending**, so a phase that adds a rung or moves a
constant shows up as a **new key** rather than as a silently shifted column. **P6's job is `diff` on two
of those files.** ⚠ Do not edit `RANK_AGES`, `BOOK_AGES` or `MONEY_AGES`: 17 / 19 / 21 / 25 are the
frozen column headers, and moving one stops P6's table being comparable with this one, which is the one
thing this page exists to guarantee.
