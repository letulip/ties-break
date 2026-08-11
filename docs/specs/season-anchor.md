# The calendar re-anchors every season – the root under three paid-for symptoms, 11.08.2026

Owner approved 11.08. This is the cause; the game had already paid for the symptoms three times.

## 1. The defect

`src/shared/dates.ts` mapped a career week to a real date with one line:

```ts
function weekStart(week) { return dateAtDay(week * 7) }   // epoch = Monday 6 Jan 2031
```

One **continuous** cycle from a fixed epoch. A season is 52 × 7 = **364 days**; a Gregorian year is
**365.2425**. So every date the game printed slid **~1.24 days earlier every season** – a full week
every ~5.6 seasons, and a long career meets the consequences three or four times.

What that had already cost, each fixed separately and none of them at the cause:

| symptom | where it landed | what was done |
|---|---|---|
| **Season 5 vanished** from the Stats table | `weekYear(208) === weekYear(260) === 2035`, so the wrap-up's dedup guard read season 5 as already banked | re-keyed on the season index (v16 migration + `seasonYear`), and a scan to invert the legacy year |
| **School drawn in August** | offset 34 – the first week after the holidays – walks 1 Sep '31 → 30 Aug '32 → 29 Aug '33 → 28 Aug '34 | `isSummerWeek` given a calendar ceiling (`7dd25d8`, round-16 #16) |
| Surface blocks and the exam fortnight name real months in their comments | those names were going quietly stale | nothing |

## 2. The fix

Each season is anchored to the **first Monday of its own year**, instead of to the season before it:

```ts
seasonIndex  = floor(week / WEEKS_IN_SEASON)
weekStart(w) = firstMonday(EPOCH_YEAR + seasonIndex) + (w mod WEEKS_IN_SEASON) * 7 days
```

No drift, ever. Week 0 is still Monday 6 Jan 2031 – the epoch did not move, only what follows it.

**The ~1.24 days a season are absorbed at New Year, where nobody can look.** In a year the calendar
needs 53 weeks to cover, the gap between one season's last Monday and the next season's first is 14
days instead of 7, and one real calendar week belongs to no career week. Inside a 12-season horizon
that happens exactly twice, at the 4 → 5 and 9 → 10 boundaries, and both fall in the off-season:

| boundary | season s week 51 | season s+1 week 0 | skipped |
|---|---|---|---|
| 3 → 4 | Dec 25–31, 2034 | Jan 1–7, 2035 | none |
| **4 → 5** | Dec 24–30, 2035 | Jan 7–13, 2036 | **31 Dec – 6 Jan** |
| 8 → 9 | Dec 26, 2039 – Jan 1, 2040 | Jan 2–8, 2040 | none |
| **9 → 10** | Dec 24–30, 2040 | Jan 7–13, 2041 | **31 Dec – 6 Jan** |

`weekOfDate` reports a date in that gap as `null` rather than guessing. That path already existed and
already had a caller that means it: `birthdayTurning` treats "no birthday week this year" as a real
answer, because a girl born 1–5 January 2031 had her birthday before the career opened.

**`weekYear` stopped being able to collide.** Season N opens in `EPOCH_YEAR + N` by construction, so
`weekYear(week) === seasonYear(floor(week / WEEKS_IN_SEASON))` identically, for every week of every
career. The season-5 collision is not scanned around any more – it cannot be expressed.

## 3. The blast radius, measured before shipping

`src/engine/world/age.ts` is the **one** engine node that branches on a real date – `kidAgeExact`,
`kidAgeYears` and `birthdayWeek` all go through `weekMonth` / `weekYear` / `weekOfDate` – and
`isTierAgeOpen` reads `kidAgeAt`. So the change can move which week a rung opens and which week her
birthday falls in, and `docs/specs/birthday-and-gifts.md` is about to hang a popup and a gift on the
second one.

Measured on the owner's own saves through the engine's own import door – `tools/season-anchor-read.ts`,
which re-implements the OLD arithmetic in six lines and imports the NEW one from the shipped module.
**The saves are personal, are never committed, and nothing is derived from one beyond the aggregates
below.** Seven careers, weeks 104 to 412, birth months February / March / June / December.

### 3a. When each rung opens – nothing moved, on any save

All sixteen tiers, all seven saves: **shift 0**. Not one age gate changes the week it opens.

| save | w15/w35/w50 (min 16) | w75 … slam (min 17) |
|---|---|---|
| olivia w104, w195 (born 15/3) | 113 → 113 | 165 → 165 |
| ines w208 (born 21/12) | 152 → 152 | 204 → 204 |
| zoe w255 (born 14/6) | 126 → 126 | 178 → 178 |
| naomi w193, w230, w412 (born 2/2) | 109 → 109 | 161 → 161 |

The reason is structural rather than lucky: a gate flips on a **whole-year** boundary of
`kidAgeYears`, and `kidAgeExact` is month-granular. Moving a week's Monday by a few days only moves a
gate when it moves that Monday across a month boundary **in the month she was born**, and the search
that finds the opening week lands on the first week of that month either way.

### 3b. Her birthday, per season – no season gains one, no season loses one (these saves)

Totals are identical on every save. Three saves show a **–1 week** move, and only in seasons at or
past 5, which is where the accumulated slide reaches a full week:

| save | seasons whose birthday week moved | announced age |
|---|---|---|
| olivia w104, w195 | none | unchanged |
| ines w208 | s5: 310 → 309 (unplayed) | 19 → 19 |
| zoe w255 | s5: 283 → 282 (unplayed) | 19 → 19 |
| naomi w193 | none | unchanged |
| naomi w230 | s5: 264 → 263 (unplayed) | 18 → 18 |
| naomi w412 | s5 264→263, s6 317→316, s7 369→368, s8 421→420 | 18/20/21/21, all unchanged |

The number in "She is ___ this week" is **identical on every birthday of every save**, before and
after. And the question that decides whether a career mid-flight can skip or repeat one:

> birthdays already PASSED at the saved week – **before N, after N, on all seven saves.**

Including naomi w412, the deepest career on file: 8 birthdays behind her before, 8 after. Her season
5/6/7 birthdays each moved back one week, but all three moved **within** weeks she had already
played, so no birthday crosses the save's current week in either direction. A load re-derives the
same count of birthdays already had, and the next one is still ahead of her.

### 3c. What a player WILL see move

The naomi w412 save's current week reads `Nov 29 – Dec 5, 2038` before and `Dec 6 – 12, 2038` after:
**seven days**, which is seven seasons of accumulated slide being handed back. That is the fix doing
its job – the old date was the wrong one – and it is a date on a header, not a fact about her career.

### 3d. School leaving – one whole-year change, and it is a correction

`SCHOOL_YEAR_TURNS_AT = 34` is the season-week offset whose Monday is meant to be 1 September:

| birth month | leaving week | month before | month after | age before | age after |
|---|---|---|---|---|---|
| 1–8 | 242 | 8 | 8 | 18.00–18.58 | unchanged |
| **9** | 294 | 8 | **9** | 18.92 | **19.00** |
| 10–12 | 294 | 8 | **9** | 18.67–18.83 | +1 month |

A September-born girl is the youngest in her school cohort (`SCHOOL_CUTOFF_MONTH = 9`) and leaves a
full school year after an August-born one – which `tests/school-ends.test.ts` asserts in its own
right. Her leaving September **is** the September she turns nineteen, and `schoolIsOver` is
`week >= schoolEndWeek`, so on that week she is already out. The old `< 19` bound was passing because
the drift had walked her leaving Monday into August; the bound is now `<= 19` with the measurement
recorded beside it.

**⚠ The August belt in `isSummerWeek` stays, and it is still load-bearing.** Re-anchoring bounds
offset 34 to Aug 27 – Sep 2 instead of letting it walk indefinitely, but it does not pin it to
September: rows 1–8 above are still August. `7dd25d8`'s calendar ceiling is what keeps school out of
August, and reverting it would put it back.

### 3e. Every birth date, not only the four on file – **nine gain a birthday, one loses one**

The owner's careers are born in February, March, June and December. The date most exposed to a
re-anchor is one at the turn of the year, because that is where the slack now lands – so all **365**
birth dates the onboarding wizard can produce were swept, twelve seasons each, both calendars. Only
ten differ:

| birth date | birthdays in 12 seasons, before | after | what changed |
|---|---|---|---|
| 22–30 December (9 dates) | 11 | **12** | the old calendar was losing one; they get it back |
| **31 December** (1 date) | 11 | **10** | 31 Dec 2040 is the first day of the week season 9 → 10 skips |
| the other 355 | – | – | identical |

So this is a **net improvement of eight birthdays across the space of birth dates**, not a cost. The
single regression is exact and bounded: one date in 365, one season in twelve, and only for a career
that reaches season 9.

**It is not swallowed silently.** `birthdayTurning` compares against the current week and already
treats "no birthday week this year" as a real answer – that path exists because a girl born 1–5
January 2031 had her birthday before the career opened. **Whether a 31-December girl should be given
her birthday early rather than not at all is a policy question and the owner's**, and it is not
decided here. If it is ever wanted, the change belongs in `birthdayWeek` (snap to the last week that
exists) and not in `weekOfDate`, whose contract is "the week that CONTAINS this date".

### 3f. ⚠ The one place the engine's BEHAVIOUR changes, not only what it prints

`isSummerWeek` takes its floor from the season and its **ceiling from the real calendar** –
`offset <= 33 || weekMonth(week) === 8` (round-16 #16). `weekMonth` moved, so the set of summer weeks
moves with it, and a summer week develops and fatigues differently (`world/summer.ts`). Only **offset
34** can be affected: 33 is inside the floor, and offset 35's Monday is never August.

| season | offset-34 Monday before | after | summer before | summer after |
|---|---|---|---|---|
| 0 | 1 Sep 2031 | Sep 1–7, 2031 | no | no |
| 1–4 | 30 Aug '32 … 27 Aug '35 | still August | yes | yes |
| **5** | 25 Aug 2036 | **Sep 1–7, 2036** | yes | **no** |
| 6–9 | 24 Aug '37 … 20 Aug '40 | still August | yes | yes |
| **10** | 19 Aug 2041 | **Sep 2–8, 2041** | yes | **no** |
| **11** | 18 Aug 2042 | **Sep 1–7, 2042** | yes | **no** |

**Three seasons in twelve lose one summer week, and losing it is the rule being obeyed.** The owner's
rule is «после экзаменов каникулы и удвоенные тренировки до сентября» – the holidays run to September
and stop. In seasons 5, 10 and 11 that week genuinely IS September on the re-anchored calendar, so
the August extension correctly does not fire. The old calendar had walked its Monday to 25, 19 and 18
August, which is the drift `7dd25d8` was written to survive rather than to bless.

The round-16 measurement (72 → 81 school-free weeks over eight seasons) is unchanged over its own
window: seasons 0–7 contain none of the three.

## 4. The frozen MAIN capture: 41550 draws / hash `e6b0c709` – **did not move**

Verified rather than assumed (`tests/condition.test.ts`, 44 tests, green). Two independent reasons:

* **Nothing in this file draws.** `shared/dates.ts` imports nothing at all and taps no RNG stream.
* **`ageInjuryFactor` is a post-draw multiply.** Her age scales a risk that has already been rolled;
  it cannot consume, skip or reorder a draw. The capture is a function of the cohort size and the
  career length, which is what its own note in `tests/condition.test.ts` says.

## 5. Migration: **NOT NEEDED. This ships as a pure re-derivation.**

Nothing about the mapping is persisted. A save stores absolute week indices; every date is computed
from one on load. So the question is only whether re-deriving gives a live career a different
history, and §3 measures that it does not: no gate moves, no birthday is skipped or repeated, and the
count of birthdays already had is identical on all seven saves.

`seasonHistory` is keyed on the **season index** since v16, so no banked row is re-labelled. On the
deepest save the derived years even stop lying: `[2031, 2032, 2033, 2034, 2035, 2035, 2036]` before –
the duplicate is the season-5 collision, visible in a real career – and `[2031 … 2037]` after.

**One thing did have to be frozen.** `migrations.ts` v16 inverts a `year` the OLD writer stamped with
the OLD calendar. Had its helper followed `weekYear` into the re-anchor, a legacy save would migrate
one way in a shipped build and a different way in the next – seasons 6+ landing an index off. The
historical arithmetic is now carried explicitly as `legacyWeekYear`, so v16's output is unchanged.
Append-only means the **output** is append-only, not just the source text.

## 6. What can now be simplified – and what was deliberately left alone

Both workarounds still compile, still pass, and are now belt beside braces. **Neither is removed in
this slice**; that is a separate decision and the owner's.

* **`migrations.ts` `seasonIndexOfLegacyYear`** – the scan could collapse to `year - 2031`, since
  `legacyWeekYear(k * 52) === 2031 + k` for every k except the 2035 pair. It **must not**: the scan's
  answer for a legacy 2036 row is 6, and `year - 2031` would say 5. That asymmetry is the bug being
  inverted, and it is why the scan was written. **Leave it.**
* **`world/milestones.ts` `maybeFireSeasonWrapUp`** – already reads `seasonIndexOf` / `seasonYear`
  and never touches a date. Nothing to simplify; the comment block explaining the collision is now
  history rather than a live hazard, and says so.
* **The three collision pins** (`world-trio`, `week-numbering`, `trophy-cabinet`) are re-aimed, not
  deleted: each states the historical defect against `legacyWeekYear` and then asserts the property
  the re-anchor bought. `tests/dates.test.ts` gains the root-cause pins, so a future return to a
  continuous epoch fails there first, with one obvious reason.

## 7. Found in passing, NOT fixed here

`birthdayTurning` announces the wrong age when her birthday falls in the tail of a week whose Monday
is in the previous month. On naomi's save (born 2 February) it announces **15 twice** (seasons 1 and
2) and **never 19** (season 5 says 18, season 6 says 20). `kidAgeExact` is month-granular and reads
the week's **Monday** month, while `birthdayWeek` is day-exact – so the two disagree by up to six
days a year.

**It is not caused by this change and is not fixed by it**: the announced ages are byte-identical
before and after on all seven saves. It matters now because `docs/specs/birthday-and-gifts.md` is
about to put that number in a popup and attach a gift to it.
