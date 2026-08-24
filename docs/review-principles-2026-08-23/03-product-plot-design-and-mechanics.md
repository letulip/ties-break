---
type: review
status: audit
area: product-design
canonical: false
last-reviewed: 2026-08-23
baseline: 52a5f13f7080550af80460ae3306f047ca7079e6
---

# Product, plot, design and mechanics

## Product verdict

The product is stronger than at the previous review. Six endings, a live college branch, academy
letters, a moving professional table, staff travel/costs, sponsor/ad obligations and the daughter's
own prize account give the career genuine shape. The family-economics premise remains distinctive
and mechanically legible.

The biggest contradiction is now agency, not missing content. The writing increasingly treats the
daughter as an adult subject, but the parent/player still decides whether she goes to college,
turns professional, stops, or continues after she has said she wants to stop. The third pillar is
qualified honestly in README status, but its inner-life mechanic remains absent while surrounding
systems multiply.

## What is working

- The parent point of view, uncertain outcome and brutal but visible economics form a coherent
  proposition.
- School end now asks early, holds a place, lets the final junior season happen and departs in
  September.
- College years have birthdays, a watchable championship and result-driven national selection.
- The daughter's prize share leaving the family account is a small but real adult-agency mechanic.
- Academy and staff mechanics are surfaced through letters/cards rather than hidden modifiers.
- Match outcomes remain honest and separate from presentation.
- Adult calls/parcels/visits and deterministic phrase variation substantially improved the earlier
  “permanent childhood voice” problem.

## Findings

### PROD-01 – P1 – Adult agency contradicts the “person, not asset” pillar

`RetirementDialog.vue:69-72` says she would rather stop, then promises that she will keep playing if
the parent wants. The buttons at `:83-97` give the player the final answer, and
`world/endings.ts:522-546` resolves that boolean directly. `ForkDialog.vue:403-442` likewise makes
the parent choose pro, college or stop without first exposing her preference.

The better rule already exists in `docs/plans/the-private-life.md:149-168`: **she decides; the parent
responds**.

**Proposal:** deterministically generate and show her preference from visible career facts. The
parent chooses support, objection, funding boundary or conversation tone; that response can affect
trust/disclosure and later scenes, but it does not overwrite an adult decision. Start with the
school fork because the ask/hold/depart sequence already exists.

### PROD-02 – P1 – The career asks for too many low-information presses

The normal Home control always calls `playWeek(1)` (`src/App.vue:1395-1409`). The handler already
supports four weeks (`:727-753`), but no normal player-facing control uses it. The only large skip is
the owner/dev 52-week control in `MoreScreen.vue:623-635`.

**Consequence:** a long professional career requires hundreds of identical presses between real
decisions. Warm prose cannot fully hide an interaction that is mechanically automatic.

**Proposal:** first expose a safe four-week action only when the engine can stop before all blocking
events. Then consider “advance to next decision/event,” bounded by birthday, injury, tournament
reveal, offer, payment crisis, fork/retirement or any required response. Weekly simulation remains;
weekly input does not.

### PROD-03 – P1 decision – College is live, but its intended product role is unclear

College is no longer an empty ending: it has a reserved start, annual championship, call-ups,
birthday pauses and a return. Interaction is still one annual continue/leave decision
(`HomeScreen.vue:1496-1508`); training, recovery, schedule and campus life are compressed.

Choose one honest position:

1. **Compact interlude/alternative ending:** keep annual compression and market it that way; or
2. **Second act:** add one pre-year stance (tennis / academics / recovery) with visible, measured
   trade-offs.

KISS favours option 1 unless the stance materially changes a visible outcome. Do not build a second
calendar/economy/training game inside college.

### PROD-04 – P1 – Release balance evidence does not yet model a reasonable player well enough

`tests/econ-reach.test.ts:323-334` pins the headline reach corridor through the historical grinder
policy. `tools/econ-bench.ts:380-388,536-581` and
`docs/specs/real-vs-bench-2026-08.md:54-59,553-564` explicitly distinguish that bot from a
reasonable player.

The integrated economy grid also signs no sponsors, so sponsor discounts are absent from the very
staff/travel combinations being judged (`docs/specs/the-masseur-2026-08.md:363-374`).

**Proposal:** keep grinder corridors as deterministic regression tests, but add one reasonable-player
release arm and one sponsor-aware integrated scenario. Report median plus tails and keep correction
work separate from tuning. Do not quote grinder survival/reach as a player outcome target.

### PROD-05 – P1 – Irreversible choices lack the modal accessibility already used elsewhere

Fork (`ForkDialog.vue:296-299`), retirement (`RetirementDialog.vue:49-53`), injury
(`InjuryStopDialog.vue:142-145`) and confirm (`ConfirmDialog.vue:18-26`) use roleless overlays without
the focus treatment already present in Knock, Birthday, Tour Briefing, College Done and Season
Summary.

**Proposal:** use the existing `useDialogFocus` through one small shared shell: `role="dialog"`,
`aria-modal`, labelled heading, initial focus, focus trap/restoration, Escape policy and inert
background. Add the standing 375×667 dismiss-control viewport assertion for every blocking dialog.

### PROD-06 – P1 correctness – College tuition is classified as income

`src/engine/world/college.ts:124-140` subtracts the weekly tuition amount and records it as a
negative amount, but sets `type: 'income'`. The event contract at
`src/shared/protocol.ts:118-126` says expenses are negative and income/refunds positive.

The signed ledger may still total correctly, but type-based feeds, filters and future reporting can
misclassify the event.

**Fix:** emit `expense`; add a focused test for event type, negative sign and `tuition` category.

### PROD-07 – P2 – College competition has selection causality but no physical cost

The college championship influences national selection, but the design records its rows as
friendlies and gives them zero condition/development cost
(`docs/specs/the-college-league-2026-08.md:161-175`). Selectors treat it as competitive evidence;
the body and development systems do not.

**Proposal:** introduce an `unrankedCompetition` semantic distinct from `friendly`, then measure the
effect of existing match strain/development rules. Reuse the normal model; do not invent
college-only progression.

### PROD-08 – P2 – Onboarding over-promises causality and renders a false choice

- “Your kid has real talent” and “anything is possible” (`OnboardingWizard.vue:318-332`) weaken the
  uncertain-talent premise.
- “Play Style … shapes strengths and training focus” (`:175-181`) overstates current behaviour:
  starting skills ignore it, while coach fit uses it.
- Girl/Boy is presented as a chooser although Boy is disabled (`:377-395`).
- `aria-labelledby="ob-hero-title"` at `:328` points to a heading without that id at `:319`.
- A nearby comment still calls birth month cosmetic although relative age is implemented.

**Proposal:** promise possibility, not talent certainty; describe play style as coach compatibility
until it shapes the build; state that v1 follows an authored daughter instead of presenting Boy as a
disabled future feature; repair the label target and false comment.

### PROD-09 – P2 / YAGNI – The private-life plan starts with invisible state

`docs/plans/the-private-life.md:195-209` proposes persisting two numbers before any reaction uses
them. That is speculative schema and produces no player value.

Build one complete authored beat first and persist only the state it demonstrates. Add `spirit` only
when it has a visible surface/effect. Avoid an inevitable someone → breakup → marriage → pregnancy
arc, culturally specific assumptions about shared money, or a hidden match penalty for private loss.
Use optional “someone important” beats and visible availability/recovery consequences before any
performance modifier.

### PROD-10 – P2 – Adult voice still observes facts the model does not know

The canonical rule says 22+ ordinary life reaches the parent through calls, messages and visits.
Generic week-note pools still license close household observations at
`src/engine/diary/weekNotes.ts:302-309,589-601,649-680`. Birthday gifts invent residence facts such
as “Her own keys” (`world/birthday.ts:669`); age 19–21 gifts assume a touring flat/car/kitchen even
when she is in college. The age-18 bank-account gift also conflicts with the automatic own-account
mechanic.

**Proposal:** require a narrative-stage/knowledge licence for domestic lines; add college-specific
birthday pools; keep gifts neutral across college/tour; do not assert residence until residence is
state. Share the repeated adult/family voice predicates described in the architecture chapter.

### PROD-11 – P2 – College feedback repeats rules and mislabels signed results

`CollegeYearCard.vue:73-80,100-105,118-130,169-177` can say “No ranking points” four times on one
card. `:301-305` labels a signed `fundsDeltaCents` value “Banked,” even when it is negative
(`world/college.ts:540-550`).

State the ranking rule once, then describe result/call-up facts. Rename the money row “Balance
change.”

### PROD-12 – P2 – The exhibition sandbox still has no honest product role

Season ships a raw-seed “Friendly match” sandbox (`SeasonScreen.vue:1131-1158,1660-1743`) that uses
`Date.now`, bypasses career cost/body/time and is styled inside the normal season surface. Its own
CSS calls the seed a developer affordance.

Choose one role: move it to a labelled lab/dev surface, hide it from release, or turn it into a real
booked practice mechanic. The first is the smallest honest option. Do not let a no-stakes simulator
look like a career action.

### PROD-13 – P3 – Internal age vocabulary is unprofessional and leak-prone

`src/shared/avatarEmotion.ts:102-117` uses `milf` for the 31+ portrait stage, propagated into assets
and tests. It is not currently player-facing, but it can leak into diagnostics, modding or generated
tools.

Migrate the type to `veteran` or `lateCareer`, retaining an asset alias during an atomic rename if
filenames cannot move immediately.

## Product sequencing recommendation

Do not add more systems merely to make the feature list longer. The highest product leverage is:

1. correct the tuition/dialog/reporting defects;
2. reduce quiet-week input cost;
3. make one adult decision genuinely hers;
4. add one visible relationship consequence;
5. then decide whether college and private life deserve deeper mechanics.

That sequence strengthens the existing promise before adding another subsystem.
