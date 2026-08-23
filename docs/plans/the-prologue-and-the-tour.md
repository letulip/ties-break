---
type: plan
status: draft
area: prologue
canonical: false
last-reviewed: 2026-08-23
---

# The prologue and the tour – 6→14 as the game's own onboarding

The owner picked the childhood prologue as the first backlog L-item to detail
([modes-and-the-prologue.md](../backlog/modes-and-the-prologue.md) #1), and added a new design ask,
verbatim:

> «Мне кажется нам надо будет в этот пролог еще добавить чуть больше онбординга и провести
> пользователя аккуратно и ненавязчиво по всем разделам и страницам, показать где что находится во
> время этого пролога.»

This plan is the design note ([childhood-prologue.md](../specs/childhood-prologue.md), 30.07,
pre-code) carried to review-ready detail, with the onboarding ask woven in as a structural principle
rather than bolted on. Nothing here is built; everything below that claims a fact about the code
names where the fact lives.

---

## 1. Where the feature stands in the code today

**The start.** `src/engine/world/age.ts`: `START_AGE_YEARS = 14`, with the comment "Detailed weekly
simulation starts here; childhood becomes a prologue (Phase 6)". A career opens in January 2031 with
her 14 (or still 13, by real birth date – the one-clock ruling of 09.08). Everything before that is
six wizard screens (`src/components/OnboardingWizard.vue`, 6 steps: splash, name + birth date,
country, family setup, play style, summary).

**The original gate has passed.** The owner's sequencing was «финалы, а пролог после них» (30.07,
quoted in the spec). The endings SHIPPED: `EndingScreen.vue` replaces the app shell in `App.vue`,
`ForkDialog` / `RetirementDialog` are live, [endings-and-the-album.md](../specs/endings-and-the-album.md)
and [adult-tour-and-endings.md](../specs/adult-tour-and-endings.md) are shipped specs. Nothing
technical blocks the prologue; the backlog row says the same.

**The engine was built to receive it.** Four receivers already exist, each placed deliberately:

- `serveSpeedBase(ageYears)` is a function of age, not a table – `serveSpeedBase(6)` already answers
  (`src/engine/match/serveSpeed.ts`, and its own comment says why:
  [equipment-and-serve-speed.md](../specs/equipment-and-serve-speed.md)).
- `src/composables/tierState.ts` carries an `'age-locked'` state "kept wired for the childhood
  prologue" – a Season screen shown to a 9-year-old already knows what to say about J30.
- The `jun` portrait band (<11) is reserved in `src/art/weeks.ts` – "the prologue's own" is its
  comment's phrase.
- The domestic ladder is the pre-14 content **today**: `minAgeYears: 13` sits on exactly three tiers
  (J30, J60, J300 – `src/engine/season/calendar.ts`), and Local / Regional / National carry no age
  minimum at all.

**The trap that shapes the architecture.** The development model does not exist below 13:
`ECONOMY.development.ageCurve` has `growthStart: 13`, `growthEnd: 18`, `peakRate: 0.0062`, and the
`ageFactor` clamp returns **peak rate** for any younger age. A prologue that reuses `growWeek` gives
a seven-year-old six extra years at the maximum junior rate. The spec's rule stands: **the prologue
may not reuse `growWeek` below 13** – and this plan's answer is stronger: the prologue has no weekly
growth at all (§4).

**Scale.** 8 years × 52 weeks = 416 weeks – twice the whole main game (208). The year is the grain;
`docs/plan.md` Phase 6 ("quarter/year ticks") and the spec agree.

---

## 2. The full inventory a player must eventually know

Walked from `App.vue`'s tab shell and `src/components/screens/`. The bar has **5 tabs**; **5 more
content states are tabless**, reached by doors; and the rest of the interface is overlays that raise
themselves.

**Bar tabs** (in the owner's order): Season (`tab-play`, `SeasonScreen`), Calendar
(`CalendarScreen`), Home (`HomeScreen`), Stats (`StatsScreen`), Trophies (`TrophiesScreen`).

**Tabless content states** (the `TabId` union in `App.vue`): This week (`week`, via Home's
next-tournament card), Kid (`kid`, via the header avatar), Coach market (`market`, via the Kid
screen's coach tile), Money (`money`, via Home's Family-budget card), More (`more`, via Home's gear).

**Self-raising surfaces**: `TournamentFlow` (the reveal), `MatchViewer` / `MatchScene`,
`PracticeFlow`, `PlanWeekSheet` (Season's «+ Plan week»), `InboxSheet` (Home's envelope),
`KnockDialog`, `BirthdayDialog`, `ForkDialog`, `RetirementDialog`, `InjuryStopDialog`,
`TourBriefingDialog`, `SeasonSummaryDialog`, `CollegeDoneDialog`, `EndingScreen`.

**What onboards a player today**: the 6-step wizard, then the 11-mark coach tour
(`OnboardingTour.vue`, gate `tourReopened || (!tourSeen && week === 0)`, durable key
`tb:onboardingTourSeen`, re-openable from More – [onboarding-tour.md](../specs/onboarding-tour.md)).
The owner's 16.08 ruling behind that tour is the same concern as this ask: his playtester met the
app cold and could not say what any of it was for.

---

## 3. The design principle – the tour IS the childhood

«аккуратно и ненавязчиво» rules out tooltip carpets and forced click-here arrows. The honest shape
of "провести пользователя по всем разделам и страницам" is this:

**Each prologue year's own events naturally visit one surface.** The first club bill opens the Money
screen. The first coach question opens the market. The first entered tournament opens the Season
screen. By 14 the player has been everywhere – because the story took him there, not because a
tooltip pointed.

Three rules follow, and they are the whole "ненавязчиво":

1. **Zero coach-marks inside the prologue.** The year card's own buttons are the doors («Посмотреть,
   куда ушли деньги» opens Money). A door the story opens needs no arrow. The 11-mark tour stays in
   the product for players who skip the prologue (§7).
2. **Every screen visited is the real screen, fed by real state** – not a mock-up in a tutorial
   frame. This is why the prologue must run on a real world (§4): a Money screen with fake rows
   teaches a fake game.
3. **A screen with no honest childhood beat is not toured.** It onboards later, at its own first
   use, with the machinery it already has. Forcing a 10-year-old's Sunday to visit the Trophies tab
   "for coverage" is exactly the carpet the owner ruled out.

### 3.1 The screen → beat map

| surface | door | age / beat | why it is honestly first needed there |
| --- | --- | --- | --- |
| **Home** | always up | **6–7** | the year cards live ON Home – her diary is the prologue's stage from the first scene |
| **Kid** | her photo | **7** | "look at her" after the first group class – a page with three skills and a lot of fog |
| **Money** | the budget card | **8** | the club across town is ~3× the municipal court – the first real ledger rows are hers |
| **Coach market** | the Kid screen's coach tile | **9** | group or one-to-one – the roster IS the decision, and the screen already renders a rung and a price |
| **Season** | the tab | **10** | a Local Open in six weeks – where entering happens, what it costs; the junior rows show `'age-locked'` ("Opens at 13"), which is a promise, not a wall |
| **TournamentFlow** (reveal) | raises itself | **10** | the entered week resolving – IF the Open is real (open question 2) |
| **Calendar** | the tab | **11** | sports school or ordinary school – the year as weeks: school, exams, what childhood is spent on (`kidLife.ts` already owns the school calendar) |
| **Inbox** | the envelope | **11** | the sports school's admission arrives as a LETTER – offers come by post in this game, and this is the first one |
| **Stats** | the tab | **12** | the fork's evidence – the radar of what six years built, fog and all; the time-series stays short, and that is honest |
| **ForkDialog** (the contract) | raises itself | **12** | she is tired / she wants more – the game's blocking-question contract (answering IS the exit), met on its truest case |
| **This week + PlanWeekSheet** | Home's tournament card | **13** | the first J30 trip is played as ONE real week at week grain – the microscope zooms in exactly once before it becomes the whole game |
| **The next-week button** | Home | **13→14** | that same guided week ends on the button the main game runs on – the handover is pressing it |

**No honest childhood beat – onboard at own first use** (named, so nobody invents one): Trophies
(the flying trophy + tab dot already self-onboard at the first title; a keepsake for a loss would be
a lie), More/settings (meta – the gear and tour step 10 cover it), `KnockDialog` (first knock;
self-explaining by design), `TourBriefingDialog` (fires when her ranking first binds her – round-18
#8 machinery), `SeasonSummaryDialog` (first W49), `MatchViewer` as a full screen (first watched
match; the age-10 result may offer a watch, not require one), `InjuryStopDialog`, the college and
retirement surfaces, `EndingScreen`.

`BirthdayDialog` is the deliberate exception in neither list: it is REUSED as the prologue's year
boundary (§5), so it self-onboards eight times before week 0 ever fires it.

---

## 4. Architecture – the prologue runs on a real world

The choice that everything else hangs on: the prologue is **not** a pre-world wizard flow. It is a
real career whose world is created at age 6, with the weekly machinery off and a **year tick** in
its place. Reasons:

- §3's rule 2 requires real screens on real state – Money, Kid, Season and the market all read
  `Snapshot` from the worker, and a snapshot needs a world.
- The engine's receivers (age-locked tiers, `serveSpeedBase(6)`, the `jun` art band, `kidLife`'s
  school derivations) all key off age and work today with no mock layer.
- `START_AGE_YEARS`'s own comment describes exactly this: the weekly simulation starts at 14;
  childhood is a prologue phase of the same world.

**The year tick** is a new worker command beside `advanceWeeks`, legal only while
`world.prologue` is active. It advances the age cursor, applies the card's decision, writes ledger
rows and diary lines, and draws **only from purpose-scoped sub-streams** (`seed:prologue:age:N`).
The MAIN stream is untouched until week 0, so:

- the frozen capture (41550 draws / `e6b0c709`) cannot move by construction;
- input-independence holds trivially – prologue choices never re-roll the world's dice;
- a career that skips the prologue and one that plays it sit at the SAME MAIN position at week 0.
  That equivalence gets a test, not an assumption.

**No `growWeek` below 13, and no weekly growth at all.** Each year card writes bounded, declared
deltas into `startingSkills` at the handover, using the `relativeAgeHeadStart` pattern (post-draw
arithmetic at `createWorld`, shipped 30.07, proven). "Development" at seven is coordination, habit
and whether she likes it – it is card outcomes, not a curve.

**The market at 9.** `ageAtWeek` is the coach market's restocking clock and must not learn about
the prologue (see the one-clock notes in `age.ts`). The age-9 visit renders the real
`CoachMarketScreen` over a small prologue roster derived from `seed:prologue:coaches` – club rungs
only. The real market starts at week 0 exactly as today.

**The one real week at 13** runs the actual weekly machinery for a single week inside the prologue
phase (plan → enter → play → recap), then returns to the year grain for the handover card. This is
the only place the two grains touch, and it is the point of it.

### What the prologue may move (the spec's list, unchanged)

`fundsCents` at week 0 (the strongest – the $8k/$25k/$120k of `STARTING_FUNDS_CENTS` becomes a
number with a history), `startingSkills` (bounded deltas), `playStyle` (earned from what she
practised, deleting an arbitrary wizard choice), the coach rung she arrives with, possibly an
academy door already ajar ([academy-invitation.md](../specs/academy-invitation.md) machinery).

### What it must not move

**`potential`.** The spec's rule, held by three systems already (coach §6, relative age, the
radar's fog): a timing or effort effect must never become a talent effect.

---

## 5. Content arc 6→14

The spec's eight cards, each now carrying its surface visit and its state writes. Decisions are
few and real; not every year has one.

| age | the scene | the decision | surface it opens | writes |
| --- | --- | --- | --- | --- |
| 6–7 | she likes it; a racquet and a group class | does she start at all – the hook, and it is cheap | Home (the stage), Kid at 7 | small funds debit; motivation seed |
| 8 | the club across town, or the municipal court | the first real money: a club is ~3× and it is where the coaches are | Money | funds path diverges; a skills nudge if club |
| 9 | the group is full of eight-year-olds | group or one-to-one – the first "what share of our income is this" | Coach market | coach habit; funds; motivation |
| 10 | a Local Open in six weeks | enter her? the tier exists and has no age gate | Season (+ the reveal, per ruling) | first result; a trophy if won; motivation either way |
| 11 | the sports school takes children at eleven | sports school or ordinary school – how much childhood we spend | Calendar, Inbox (the letter) | school track (`kidLife` reads it); skills/motivation trade |
| 12 | she is tired of it / she wants more | the fork the real world is full of – a consequence of the eight cards before it, not a menu | Stats (the radar), the ForkDialog contract | motivation resolves; possibly the career ends (open question 3) |
| 13 | the junior tour opens (already true in code) | do you go? the first passport, the first flight, the first real bill | This week + the plan sheet + the next-week button – one real week | the J30 bill; the travel habit; the handover profile firms up |
| 14 | – | – | the existing week-0 start, unchanged | funds, skills, playStyle, coach rung – all written through `createWorld`'s existing seams |

**The year boundary is her birthday.** `BirthdayDialog` fires always by the owner's ruling
(11.08, [birthday-and-gifts.md](../specs/birthday-and-gifts.md)) and charges nothing – it is the
natural year-turn card frame, already built, already tested. The prologue reuses it rather than
inventing an eight-card carousel component.

**The growth spurt is the flagship beat**, not an extra system:
[season-life-future.md](../backlog/season-life-future.md) §"age-stats research" specifies it
(12–14: +8–15 cm over 3–6 months, technique −30%, injury risk ×2, then post-spurt serve/power;
girl growth peak ~11.5) and marks it "THE strategic beat of the childhood prologue". It lands on
the 11 or 12 card as an event, its mechanical effects deferred to the main game's existing systems.

**Motivation** stays exactly as the spec sized it: ONE durable number the prologue produces, read
by the main game in ONE cheap place first (recommendation: the knock's rest/push copy), then
measured before it earns more. It is what makes the 12 card a consequence instead of a menu.

---

## 6. What exists to reuse – so nobody rebuilds it

| need | already built | where |
| --- | --- | --- |
| school years, cohorts, grades, exams | the School tile machinery – September cut-off, cohort arithmetic, grade names | `src/engine/kidLife.ts` (SCHOOL_CUTOFF_MONTH, SCHOOL_YEAR_TURNS_AT) |
| the year-turn card with no way out but an answer | the birthday popup, fires always, four answers, no price | `src/components/BirthdayDialog.vue`, `engine/world/birthday.ts` |
| the blocking choice contract (engine refuses to tick) | fork / knock / retirement machinery, overlay ordering | `ForkDialog.vue`, `KnockDialog.vue`, `composables/blockingOverlay.ts` |
| stop-and-report on events | the `StopReason[]` channel and the stop toast | `shared/protocol.ts`, `App.vue` |
| a scholarship shaped like an offer | the academy review (results + scout's eye + need, size not switch) | `src/engine/academy.ts`, [academy-invitation.md](../specs/academy-invitation.md) |
| age-gated tier copy for children | `'age-locked'` with the "Opens at 13" countdown sentence | `src/composables/tierState.ts` |
| child portraits | the reserved `jun` band | `src/art/weeks.ts` |
| serve physics at any age | `serveSpeedBase(ageYears)` | `src/engine/match/serveSpeed.ts` |
| post-draw profile shifts with no schema and no draw | the `relativeAgeHeadStart` pattern | `createWorld`, [relative-age.md](../specs/relative-age.md) |
| coach-marks for the skip path | the 11-step tour + its clamp geometry | `OnboardingTour.vue`, `composables/coachTour.ts` |
| letters that wait in the envelope | the inbox and its dot | `InboxSheet.vue`, offers machinery |

---

## 7. The two onboardings, reconciled

The prologue and the 11-mark tour answer the same question for two different players.

- **A player who plays the prologue** has been to every surface with an honest beat by 14, and the
  four surfaces without one self-onboard. Completing the prologue writes `tb:onboardingTourSeen`,
  so the marks do not fire over a player the story already guided.
- **A player who skips** (see open question 1) gets today's wizard and today's tour at week 0,
  unchanged. More's "Show the tour" keeps working for both.

The wizard does not disappear – it donates. Name, birth date and country stay as the prologue's
opening card (they are the girl, not the difficulty). Family setup remains the prologue's starting
condition (question 4). Play style leaves the wizard entirely: it is derived from the eight years.
This is the spec §7 claim made concrete: the prologue REPLACES the first ten minutes of menus
rather than adding a system beside them – and it is also backlog item 3's "truthful onboarding"
satisfied for free, because a claim the player lived through cannot be flavour text.

---

## 8. Steps, sizes, stop points

One branch per wave, per house rules. Each stop point is a state the owner can play or a
measurement he can read.

| # | step | size | stop point |
| --- | --- | --- | --- |
| 0 | this plan reviewed, open questions ruled | – | owner's word |
| 1 | engine: `world.prologue` phase block, world creation at 6 behind it, the year-tick worker command, schema v59→v60 + append-only migration + golden fixture | M | no UI; frozen capture unmoved, input-independence suite extended, week-0 equivalence test green |
| 2 | UI: year cards on Home via the birthday frame, ages 6–9 with their decisions and the Kid / Money / Market visits | M | playable 6→9 on a device; every card passes the 375x667 mounted dismiss-in-viewport assertion |
| 3 | ages 10–11: the Local Open per ruling 2, Season + Calendar visits, the sports-school letter | M | playable 6→11; the age-10 result lands in the ledger and (if won) the cabinet |
| 4 | ages 12–13 + handover: the fork card, the motivation number and its one reader, the one real week, playStyle derivation, wizard splice | M | full 6→14 into the existing week-0; A/B: prologue-neutral vs direct-14 careers produce identical MAIN sequences |
| 5 | tour reconciliation + e2e: the seen-key write, the skip path, `e2e/` coverage beside `onboarding-tour.spec.ts` | S | e2e green both paths; skippers still get all 11 marks |
| 6 | bench + measured spec: the spread of handover profiles (funds range per background, skills deltas, playStyle distribution), predicted vs measured | S | a `docs/specs/` file in the rank-plateau mould; invariant 4 satisfied |

Total: four M steps and two S – consistent with the backlog's **L**.

### Schema implications (step 1, the three-part move)

`SAVE_SCHEMA_VERSION` 59→60. The world gains a `prologue` block (phase flag, age cursor, decisions
taken, motivation) that is `null`/absent for careers created at 14 – the migration marks every
existing save as prologue-absent and touches nothing else. Append-only migration in
`engine/migrations.ts`, golden fixture in `tests/fixtures/saves/`, one fixture per version as
`goldenSaves.test.ts` enforces. The careers list and save envelope are unaffected.

---

## 9. Open questions for the owner – each with a recommendation

1. **Does the prologue replace the wizard for every new career, or is "start at 14" kept?**
   Recommendation: both doors. The first career on a device defaults into the prologue; every new
   career offers «Начать с 6» / «Начать с 14», and the 14 door is today's wizard + tour, untouched.
   A veteran on his fifth career will not forgive eight mandatory cards, and the skip path is what
   keeps the 11-mark tour earning its keep.
2. **Is the age-10 Local Open real** (an engine draw and a result) or a card that narrates one?
   Recommendation: real result, optional spectacle – the tier is open, `serveSpeedBase(10)`
   answers, and a small draw from a `seed:prologue:open` sub-stream costs little; the card reports
   the result and offers "watch the final point", it does not force the full match screen. The
   spec's own caution stands: a full TournamentFlow may be more game than a ten-year-old's Sunday
   deserves.
3. **Can the prologue end the career at 12?** Recommendation: yes – «"stop" CAN be the right
   answer... a real ending without shame» is the fork's own standing ruling, and dropout IS the
   story of junior sport. Behind a confirm, writing a real (short) ending card. If the owner finds
   it too strange for the opening ten minutes, the fallback is honest too: the 12 card can only
   bend the path (a quieter year, a cheaper track), never end it.
4. **Does the prologue vary the family background, or is background still picked?**
   Recommendation: still picked, at the age-6 card – it is the starting condition of the childhood
   itself, and the prologue's job is to turn the flat $8k/$25k/$120k into a number with a history,
   not to hide the difficulty choice.
5. **6 or 5?** `docs/plan.md` says 5→14, the owner said 6–14. Recommendation: 6 – his own number,
   and the later start makes the first scene "she can hold a racquet".
6. **Motivation's first reader.** Recommendation: the knock's rest/push copy – one line, engine-side,
   testable, and it makes the number visible without giving it mechanical teeth before it is
   measured.
7. **Does completing the prologue write the tour's seen-key?** Recommendation: yes (§7) – marks
   over a player the story already guided are exactly the interruption the week-0 bound exists to
   prevent.

---

## Sources

[childhood-prologue.md](../specs/childhood-prologue.md) ·
[modes-and-the-prologue.md](../backlog/modes-and-the-prologue.md) ·
[onboarding-tour.md](../specs/onboarding-tour.md) ·
[season-life-future.md](../backlog/season-life-future.md) ·
[round-3-qa.md](../rounds/round-3-qa.md) (the stages box) ·
[plan.md](../plan.md) Phase 6 ·
[birthday-and-gifts.md](../specs/birthday-and-gifts.md) ·
[relative-age.md](../specs/relative-age.md) ·
[academy-invitation.md](../specs/academy-invitation.md) ·
[coach-tiers.md](../specs/coach-tiers.md) ·
[endings-and-the-album.md](../specs/endings-and-the-album.md) ·
[adult-tour-and-endings.md](../specs/adult-tour-and-endings.md) ·
[equipment-and-serve-speed.md](../specs/equipment-and-serve-speed.md)
