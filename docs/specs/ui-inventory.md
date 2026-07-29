# Every interface we have — and where the redesign stands

Written 29.07.2026, against the 20-screen handoff in `docs/design/`. The point of this page is to be
able to answer three questions at a glance: **what is already redone**, **what has a design and is
waiting**, and **what has no design at all**. Update it when a slice lands.

Legend: ✅ redone to the design · 🎨 design exists, not built · ⏸ design exists, deliberately parked ·
🚧 design exists but the engine does not · ⬜ no design

---

## 1. The handoff's 20 screens, mapped onto our code

| # | Design screen | Our surface | Status |
|---|---|---|---|
| A | Home | `screens/HomeScreen.vue` | ✅ wave 2 (26–28.07) |
| B | Season Planner | `screens/SeasonScreen.vue` | ✅ wave 2 (28.07) |
| C | Kid Profile | `screens/KidScreen.vue` | 🎨 |
| D | Weekly Story | `WeekRecapCard.vue` (+ parts of `screens/ThisWeekScreen.vue`) | 🎨 |
| E | Tournament (Preview) | `TournamentFlow.vue`, pre-match section | 🎨 |
| F | Match Day (Live) — cinematic | *(nothing; we only have the court view)* | 🎨 |
| G | Family Budget | `screens/MoneyScreen.vue` | 🎨 |
| H | Calendar (Week View) | `screens/ThisWeekScreen.vue` + the inert `calendar` tab | ⏸ owner: concept first |
| I | Live Match (Court) — dispatcher | `MatchViewer.vue` (canvas court) | 🎨 partial: the view exists, the layout is ours |
| J | Championship Draw (R16) | `BracketTabs.vue` + the bracket in `TournamentFlow.vue` | 🎨 partial: round tabs shipped wave 1 |
| K | Championship Draw (Final) | same | 🎨 partial |
| L | Champion | finale section of `TournamentFlow.vue` | 🎨 |
| M | Runner-up | same | 🎨 |
| N | Onboarding · Welcome | `OnboardingWizard.vue` step 1 | 🎨 |
| O | Onboarding · Identity | step 2 | 🎨 |
| P | Onboarding · Country | step 3 | 🎨 |
| Q | Onboarding · Family & Coaching | step 4 | 🎨 |
| R | Onboarding · Play Style | step 5 | 🎨 |
| S | Onboarding · Summary | step 6 | 🎨 |
| T | Coach Market | *(nothing)* | 🚧 needs coach tiers in the engine |

## 2. Ours with no design at all

These exist, the player uses them, and the handoff does not cover them. Each needs a decision:
restyle by analogy with the system, or leave until it gets its own design.

| Surface | What it is | Note |
|---|---|---|
| `SplashScreen.vue` | brand splash, "Tap to start" | already on-brand (logo, Sora/Manrope) |
| `OnboardingTour.vue` | the 5-step coach-mark tour after onboarding | distinct from N–S; sits over the game |
| `screens/StatsScreen.vue` | ranking table, counting best-6, season-by-season history | **the design's tab bar has no Stats** — see §4 Q1 |
| `screens/MoreScreen.vue` | careers, saves, import/export, sound, about, danger zone | a settings screen; low design value, high utility |
| `PlanWeekSheet.vue` | the week planner: vacation packages, practice matches | the closest thing we have to H's planning |
| `SeasonSummaryDialog.vue` | end-of-season recap | the natural sibling of D and L/M |
| `InjuryStopDialog.vue` | the injury interruption | a real emotional beat with no design |
| `TierGuide.vue` | the ladder explainer | reachable from Season |
| `RankHelpDialog.vue` | how the best-6 ranking works | |
| `ConfirmDialog.vue` | generic confirm | pure utility |
| `MatchReplay.vue` | replay of a stored match | feeds off F/I once those land |
| `PracticeFlow.vue` | the friendly-match flow | shares the match surfaces |
| `CountingResultsTable.vue`, `SeasonHistoryTable.vue` | tables inside Stats | |
| `BracketTabs.vue` | round switcher | shipped wave 1, J/K will absorb it |

## 3. What the handoff asks for that we do not have at all

- **Reusable components 1–31** (`README.md` §"Переиспользуемые компоненты"). We have built several of
  them ad hoc, twice, inside Home and Season. Extracting the first eight before building six more
  screens is the single highest-leverage step in this wave.
- **~24 new art slots** (`README.md` §Assets): trophy, silver medal, five coach portraits, the
  onboarding hero, four play-style poses, the summary portrait, the champion/runner-up moment photos,
  the trip photo. Several screens are art-led and will look unfinished without them.
- **A coach market** — the engine has `coachSetup: 'parent' | 'hired'`, a boolean. T needs tiers,
  prices, style fit and a weekly budget. That is an engine slice, and it is the same one the owner
  named as the fix for "middle family + hired coach goes bankrupt in 120 careers of 120".
- **A cinematic match view (F)** distinct from the court view (I).

## 4. The owner's rulings (29.07) — these are settled

**Q1 — the tab bar: KEEP OURS, unchanged for now.** `Season · Calendar · Home · Stats · More` stays;
the design's `Home · Season · Calendar · Bianca · More` is a later job. The owner also noted that
**More is becoming redundant** — the gear on Home already reaches it — so the bar gets re-cut in that
pass rather than now. Every screen in this wave therefore keeps the navigation it has.

**Q2 — F is NOT a second live match.** The owner's reading, and it is better than the handoff's:
- **F = the preview / result treatment** — the big portrait scene. Used *before* a match, and reused
  *after* it on the result screens.
- **I = our live match**, the one we already have, tidied up to the design — plus **a canonical
  running text commentary of the key moments**, which we do not have at all today.
So there is one live view, not two, and no switcher to design.

**Q3 — the Coach Market waits.** It goes into the next cycle together with the calendar, behind the
coach-tier engine slice.

**Q4 — art. Almost nothing needs making:**

| slot | ruling |
|---|---|
| trophy, silver medal | use what we already ship |
| the five coach portraits | **already in `public/images/coaches/` — 16 of them**, wired since wave 2 |
| champion / runner-up moment photos | we have them; use those |
| onboarding hero (N) | the owner is finishing it — square, like the rest of ours. Until then default to `jun-norm` |
| four play-style poses (R) | the owner will supply; ship a placeholder |
| trip photo (G) | maybe remade later for every age; not blocking |
| summary portrait (S) | **the owner asked which screen this is: it is S, the last onboarding step — the full-bleed 346×306 portrait "her at the club entrance" behind the summary card.** He will look and decide whether to reuse an existing one |

**Q5 — density vs scroll: fidelity to the composition, real content may scroll.** Confirmed as a
general rule, generalising the Season screen decision of 28.07.

## 5. Settled, no action needed

- **Names in the mockups** (Bianca Tran in A–M, Naomi Steiner in N–T) are the same role; ours comes
  from onboarding. The handoff says so itself.
- **Surface icons** — reuse the Season screen's, no new set (owner, 29.07).
- **Confetti on L** — we have a comparable effect already; reuse rather than rebuild (owner, 29.07).
- **The calendar (H)** is parked until the concept conversation (owner, 29.07).
- **Tokens** — the refreshed `tokens.css` is a strict superset of the one we shipped: it adds
  celebration backgrounds, fit pills, gold, the onboarding gutter, the four play-style colours and
  the four coach-tier colours. Nothing we already use changed value, so no migration.

## 6. The 14 undesigned surfaces — captured for the designer

`docs/design/undesigned/` holds reference screenshots of every surface in §2, at 375×812, so the
owner can feed them into the design system. Its README says which state each shot is in and which
surfaces could not be reached without changing app code.

Some of these may not need a designer at all: Stats, More, the week planner and the small dialogs
are all assemblies of components the new system already defines (Card, Eyebrow, SegmentedRow,
StatRow, PrimaryPill). Worth a review pass before commissioning designs for them.
