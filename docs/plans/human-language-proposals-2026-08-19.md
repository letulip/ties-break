---
type: execution-plan
status: draft
area: narrative
canonical: false
last-reviewed: 2026-08-19
baseline: 13d8f95
---

# Human-language proposals

This is the follow-on list from the [human-language review](../review/human-language-2026-08-19.md).
The first wave is implemented on `codex/human-language-review-2026-08-19`; the rest should be judged
against playtest repetition, not added merely to make the catalogue larger.

## P0 – implemented in this branch

1. One derived narrative life stage, with 22+ independent distance and no save migration.
2. Age-banded, deterministic birthday headings and less transactional gift outcomes.
3. Varied birthday clue syntax without changing options, answer identity or RNG draws.
4. Birthday-aware journey notes, including injury variants.
5. Adult weekly, injury, loss, win, off-season and quiet-life notes.
6. Adult calendar notes and adult tournament messages.
7. Warmer school-ending and college-return copy.
8. Tests that reject school/home authority in 22+ weekly copy.

## P1 – college-year postcards and birthdays

Current college time advances a year at once. Blocking birthday choices inside that loop would strand
the command, so `pendingBirthday` correctly stays silent. The cost is four years with no birthday
texture.

Add one non-blocking “postcard from the year” to `CollegeYear`'s derived view, not its saved shape:

- a birthday/call line when that year crossed her birthday;
- one campus-life detail chosen from college tier and national-call facts;
- one sentence about returning home or choosing to stay near campus;
- no invented grade, roommate, major or relationship unless those become state.

Acceptance: every completed college year has one stable line; early return reports only lived years;
no MAIN draws; no gift decision is fabricated. Estimated effort: 2–4 development days.

## P1 – first independent-life beat

The stage change is currently invisible except through wording. Add a one-time, non-blocking story
beat near the first 22+ normal week: a spare key, a box left behind, or Sunday dinner being scheduled.
Keep it a derived milestone only if it has no gameplay consequence.

If the player must choose where she lives, stop: that becomes a save-schema feature. It would need
at least `family`, `college`, `own`, and `tour-base` states; move week; financial consequences; and a
migration default. Estimated effort: 1–2 days for narrative only, 1–2 weeks for a real mechanic.

## P2 – expand the stage matrix from playtest evidence

Record repeated lines during ten full careers, grouped by stage and state. Expand only pools whose
median repeat interval is irritating. Likely first targets:

- independent first-round losses and ordinary wins;
- adult off-season and long rehab;
- after-school ages 18–21, which currently share more family-home copy than any other band;
- birthday gift repeats after the third occurrence;
- college return and early-return endings.

Target 12 eligible lines for weekly ordinary states and 6 for rare states. Estimated effort: 3–5
editorial/development days after telemetry or annotated playtests exist.

## P2 – human editorial pass with cultural variation

A native English fiction/game editor should read the pools in context at ages 14, 18, 22, 27 and 31.
Ask specifically about UK/US wording, class assumptions, adulthood, and whether “move out at 22” feels
universal. The goal is not polished literary prose; it is removing phrases a real parent would never
write. Estimated effort: 2–3 editor days plus one implementation day.

## P2 – phrase provenance and preview tool

Build a development-only page or script that prints every eligible line for a selected facts object:
age, life stage, result, condition, injury, birthday, travel and funds. It should show the licence and
character length and flag duplicate openings. This is more valuable than a generic AI-writing tool
because it exposes contradictions and repetition in the actual selection context.

Acceptance: no save mutation, no production bundle, one command, stable output. Estimated effort:
1–2 days.

## P3 – residence mechanics, only if they create choices

Do not add rent and moving boxes as decorative simulation. A residence system earns its schema cost
only if it changes at least two of: weekly costs, travel, training access, family time, injury support,
or a player decision. Before implementation, write and test the choice loop and its effect on the
parent premise. Otherwise keep the derived narrative distance shipped here.

## Explicit non-proposals

- No runtime LLM-generated copy: it breaks determinism, offline play, tone control, testability and
  cost discipline.
- No synonym spinner: variation without different observations sounds less human, not more.
- No universal `humanize(text)` abstraction: each speaker knows different facts and needs different
  licences.
- No rewriting of historical migrations, saved event text or precise financial/eligibility UI for
  warmth alone.
