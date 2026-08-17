---
type: spec
status: current
area: engine/calendar
canonical: false
last-reviewed: 2026-08-17
---

# The calendar gap is the feed, not the calendar (17.08.2026)

**Round-21 #2, and it is one item with two halves that turned out to have one cause.**

> **The owner, 17.08, verbatim:**
> «Снова какая-то чехарда в календаре бывает по 3-5 недель пустота. Собери мне пожалуйста такую
> сетку, чтобы хотя бы 1 раз в 2 недели был какой-то турнир. Я вижу, что их много есть на странице
> сезона сверху, но в ленте почему-то их не вижу»
>
> With a screenshot line:
> `2039 · W42 · 9 left to enter over 10 weeks · WTA 500 2 · WTA 250 1 · WTA 125 1 · W75 1 · +4 lower`

⚠ **The age grid is not restated here.** It is written out once, in
[`college-is-its-own-branch-2026-08.md` §0a](college-is-its-own-branch-2026-08.md).

---

## 0. THE ANSWER IN ONE BOX

> ### 1. ⭐⭐ THE CALENDAR ALREADY MEETS HIS RULE. THE SCREEN DOES NOT.
> His rule – **a tournament at least every second week** – is a rule about **run lengths**, and the
> census only reported a rate. Measured now: **93.2% of empty runs are a single week, the longest
> run in 18 careers is 3 weeks, and a run longer than one week happens 0.29 times per season.**
> The calendar he is describing does not exist. **What he is looking at does**: on the axis of
> "weeks the feed ever drew a card for", the same careers give **0.54 multi-week runs per season and
> a worst case of 4** – the feed roughly **doubles** the drought rate and lengthens the worst case.
>
> ### 2. ⭐⭐ NEITHER NUMBER ON HIS SCREENSHOT IS WRONG, AND THE HEADER IS THE ONE OVERCOUNTING BY THE PRODUCT'S OWN RULES.
> All nine events pass the same `entryStatus` gate that governs entering, so the header is honest
> about supply. But **`+4 lower` is the tail the feed has been told to hide**: of the 27,858 counted
> events that sit inside the feed's own horizon and never reach it, **27,163 (97.5%) are `local`**,
> stripped by `paysIntoHerTables` – round-21 #5, the owner's own ruling from days ago. The header
> advertises tennis the game has decided not to offer her. §3.
>
> ### 3. ⚠⚠ THE GAME ALREADY EXPLAINED THIS, IN A TOOLTIP A PHONE CANNOT REACH.
> The `title` on that header has read *"including the rare ones the eight-week feed cannot show"*
> since it shipped. A `title` is a **hover** tooltip; this is a phone game. Same failure family as
> round-20 #3 – a surface measured by what it SAYS rather than by what the device can deliver. §4.
>
> ### 4. ⚠ AND THE FIX I WAS ABOUT TO BUILD FIXES NOTHING – MEASURED, NOT ARGUED.
> A booked week renders as its booking and the tournament on it is not drawn (`calendarRows`'
> `kind` fall-through). Real in the code, and it looked like the cause. Over 18 careers x 676 weeks
> the row collapse threw away **0 cards**. The bench's planner never books a practice onto a
> tournament week. §5, and it is the reason this phase ships a copy change and not a calendar one.

---

## 1. WHAT CHANGED IN THE INSTRUMENT, AND WHY IT HAD TO

`tools/empty-week-census.ts` reported **12.6% of non-blackout weeks empty, ~5 a season**. That is a
**rate**, and the owner is describing **clustering**. Five empty weeks spread through a season is a
calendar nobody notices; the same five in a row is the complaint, and no rate can tell those apart.

The census now prints **run lengths on three axes**:

| axis | what closes a run | what it answers |
| --- | --- | --- |
| **EMPTY** | a playable week, **and any blackout** | weeks the calendar could have filled and did not, back to back. **His rule is stated against this one.** |
| **FELT** | a playable week or the **off-season** only – exams, family weeks and injury layoffs count **inside** the run | the honest upper bound on "3-5 weeks of nothing" as a parent lives it |
| **UNSEEN** | same denominator and closing rule as EMPTY, but membership is *"did the feed ever draw a card for this week"* | **the axis he is actually looking at.** Its difference from EMPTY is the feed's own contribution |

Both surfaces' predicates are **re-derived from the same engine calls the screen makes** –
`seasonSupply`'s loop for the header, `feedContext`/`feedShows` plus the `calendarRows` row collapse
for the feed – never re-implemented, so a divergence found here is a divergence his screen has.

⚠ **And `tools/feed-audit.ts` was stale in the one direction an audit of a hiding rule must never be
stale.** It called `feedContext` without `activeLadder` or `tierOutgrown`, and that function treats
an absent input as *do not judge* – the right default for a pre-#5 fixture, the wrong one for a tool
whose whole job is to reproduce the live screen. It reported cards as SHOWN that the owner's screen
hides, **understating exactly the gap it exists to measure.** Fixed in the same commit.

---

## 2. RUN LENGTHS – BEFORE

`npx vite-node tools/empty-week-census.ts --seeds 2`, **18 careers x 676 weeks (ages 14-26),
`POLICIES[1]`**, 8,964 non-blackout weeks.

### 2a. EMPTY RUNS – the calendar's own answer

| run length | runs | share | per career |
| --- | --- | --- | --- |
| 1 week | 934 | **93.2%** | 51.89 |
| 2 weeks | 50 | 5.0% | 2.78 |
| 3 weeks | 18 | 1.8% | 1.00 |
| **longest in 18 careers** | | | **3** |

**68 runs longer than one week: 6.8% of runs, 0.29 per season.** ⭐ **There is no 5-week empty run
in this population, and no 4-week one either.**

### 2b. FELT RUNS – with exams, family weeks and injury inside the run

Longest **19** (an injury layoff). 463 runs longer than a week – **1.98 per season**, with 5-week
runs at 1.0 per career. **This is where "3-5 weeks" actually lives, and every week in it is a
blackout the 16.08 ruling already called the calendar working.**

### 2c. UNSEEN RUNS – the screen's answer, and the one that matters

| run length | runs | share |
| --- | --- | --- |
| 1 week | 1125 | 89.9% |
| 2 weeks | 95 | 7.6% |
| 3 weeks | 27 | 2.2% |
| 4 weeks | 4 | 0.3% |

**126 runs longer than one week: 10.1% of runs, 0.54 per season, worst case 4.**

> ⭐⭐ **The comparison is the finding.** Same careers, same weeks, same closing rule:
> **EMPTY 0.29/season and never worse than 3. UNSEEN 0.54/season and up to 4.**
> The feed **adds 86% more multi-week droughts than the calendar contains**, and
> **470 weeks (5.2% of her non-blackout weeks) carried tennis she could have entered and were
> never drawn at all.**

---

## 3. THE HEADER AGAINST THE FEED – WHICH ONE IS LYING

**448,619 counted (week x event) reads. The feed drew 21.7% of them.**

| why a counted event never reached the feed | n | share |
| --- | --- | --- |
| beyond the 8-week feed horizon | 244,892 | 69.7% |
| beyond the horizon **and** on a rung the feed hides | 78,467 | 22.3% |
| **inside the horizon, on a rung the feed hides** | **27,858** | **7.9%** |

...and that last row, by rung: **`local` 27,163 · `regional` 568 · `national` 127.**

**The mirror runs the other way too: 24.3% of the cards the feed DOES draw are events the header
refuses to count, because she cannot enter them.** The two surfaces are wrong about each other in
opposite directions, which is exactly why the two numbers feel unrelated to him.

### The verdict

**Neither number is false, and the header is the one making a promise the product will not keep.**

* The **header** is honest about *supply*: every event it counts passes `entryStatus`. Its window
  (rest of season, 10 weeks) is stated on the line itself.
* The **feed** is honest about *offer*: it draws what round-21 #5 decided she should be offered.
* **The contradiction is `+4 lower`.** 97.5% of the in-horizon gap is `local` events – domestic
  tennis that pays nothing into her table, which the owner himself ruled days ago should not be put
  in front of a professional. The header counts them anyway.

⚠ **The 8-vs-10-week window is not a lie by either surface** – the header prints its own window
(`over 10 weeks`) and the feed prints eight rows – but it is 69.7% of the raw gap and nothing on
screen connected the two.

---

## 4. WHAT SHIPPED, AND WHY IT IS A COPY CHANGE

**One line on the season header, under the count, naming the second number:**

`9 left to enter over 10 weeks · WTA 500 2 · … · +4 lower`
**`4 of them on the cards below`**

Read off `calendarRows` – the surface the parent can actually see – and **not** off
`visibleUpcoming`, because a stacked week collapses to one row and a booked week draws its booking.
Drawn only when the two numbers differ; on an agreeing week it would be noise.

⚠ **`tools/ladder-baseline.ts` was NOT run, and here is the reason rather than the omission.** This
phase touches `SeasonScreen.vue` and `src/style.css` and nothing else: **no engine module, no RNG
draw, no save schema, no calendar constant.** Every column in
[`what-the-college-place-costs-2026-08.md` §3d](what-the-college-place-costs-2026-08.md) is a
function of world state that this change cannot reach. A battery run would be 90 careers of compute
to reproduce a table by construction. **If any of §6 is taken up, it runs before that lands.**

---

## 5. THE CANDIDATE THAT MEASURED TO ZERO

`calendarRows` decides a row's kind as
`vacation ? … : practice ? … : e ? 'event' : …`, and the template draws a tournament card only on
`kind === 'event'`. **A booked week therefore deletes the tournament on it from the feed** – the
event is still on the row object, nothing on screen shows it. It is a fall-through, not a rule
anybody wrote about tournaments, and it was the obvious cause.

The census measures it directly (`admitted` before the collapse, `drawn` after). Over 18 careers:

| cards the rung/horizon rules admitted and the row collapse threw away | **0** |
| --- | --- |
| PLAYABLE weeks never shown, with the candidate applied | 470 – **unchanged** |
| UNSEEN runs > 1 week, with the candidate applied | 126 – **unchanged** |

**`POLICIES[1]` never books a practice or a family week onto a week that has a tournament on it.**
The mechanism is real; on this population it never fires.

⚠ **AND THAT IS A STATEMENT ABOUT THE BENCH, NOT ABOUT THE OWNER.** He books practice by hand and
may well put one on a tournament week – the bench planner is not him. **His own save would answer
it in one command**, and `tools/feed-audit.ts` is now honest enough to ask:
`npx vite-node tools/feed-audit.ts --save <his .tsave>`.

---

## 6. ⚠ WHAT NEEDS THE OWNER

Three questions this phase deliberately did not answer alone, because each one spends a ruling he
already made:

1. **Should the header stop counting `local`?** It would make the two surfaces agree exactly and it
   is the smallest engine change available – one filter in `seasonSupply`. **It also makes his
   number smaller**, and he is asking to see *more* tennis, not less.
2. **Or should the feed show domestic events again?** That reverses round-21 #5, which is days old
   and was his own call.
3. **Densifying the calendar is not recommended, and §2a is the reason.** It moves every field in
   every world – a bench run, a full battery and a fresh `--seeds 10` baseline – to close a gap the
   measurement says is 0.29 multi-week runs per season and never longer than three. **The drought he
   is describing is on the screen, not in the world.**
