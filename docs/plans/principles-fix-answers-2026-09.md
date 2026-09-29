---
type: plan
status: current
area: project-review
last-reviewed: 2026-09-29
---

# The principles fix – answers to the six waves' questions (29.09)

The questions doc (`principles-fix-questions-2026-09.md`, w6 head) asked well: every question came
with its number. Verdicts below, one per section, same order. **W7 is GO** – the owner, 29.09:
«если блокеров не будет – можешь приступать к W7». No blockers found.

## §1 · The copy queue

- **PF1–PF5: approved as DRAFTs.** Law scan clean (no long dash in rendered strings, no Cyrillic
  templates from this fix). They go into the PR body under DRAFT for his wording pass – PF4/PF5
  flagged as the only two a player meets in ordinary play.
- **ES1–ES5: the PLACE is approved** – it is ruling 6a's own design; nothing further.
- **AS1–AS19: approved.** The `title=` keeps on all nineteen, as shipped. AS19 read aloud is fine –
  the range is exactly the half a screen reader never had.
- **§1b, the shorter cap sentences: stands**, as the authorised consequence of 6a (the engine's
  sentence replaced the screen-composed one). It is NAMED in the PR body under its own line – a
  shipped sentence got shorter – with the note that «Not locked:» coming back is one edit in two
  engine homes. His call at the pass, not ours.

## §2 · The two one-word decisions

- **2a: A – the Reload control, labelled `Reload` (DRAFT).** The sentence already uses the word.
  And the reason it is A rather than B: he playtests the INSTALLED build – standalone PWA, no
  browser chrome – so a blocking card that says «reload» without a control is a dead end on his own
  device. Ships as **T7.0, the first commit of the W7 branch**: the button lives inside
  `StoreError`, rendered only for the `SAVE_CONFLICT` class, does `window.location.reload()`;
  mounted test on the busiest host card proves the control sits inside 375×667, with the mutation
  (the dialog law).
- **2b: A – 'Nine Bells' was a slip and is gone.** Same verdict as the intake's Q4: it was a local
  test constant; nothing in `src/` ever knew the name. Nothing to do.

## §3 · The wording declines

Both stand as the builder recommended: the college press label does not change, and the two
unnamed preset groups stay unnamed – naming them is two new words, and invariant 4 puts those with
him. One line goes in the PR body offering them as an optional row for the strings table, nothing
more.

## §4 · The product calls

- **4a: A – the wedding spec keeps walking the player's route.** (b) is declined: the sweep is
  product code, and masking it with reduced motion on eight presses could hide exactly the
  day-cross regression class the spec exists to walk through. ~24s of CI is a fair price; (a)
  already collected the local win (72s → 45.6s, on the finding's own prediction).
- **4b: A – the row stays, the trigger stands** (the install ceiling at the first art round, 172
  KiB of headroom today). When it fires, start where the report already points: the five rows that
  are 58% of it, `engine/economy.ts` first, and of those the 20 modules wholly present in both
  chunks. No task opens now.
- **4c: agreed, recorded.** The null result named its arms and its bytes – that is the provenance
  discipline holding. Nothing re-opens.

## §5 · W7 – GO, in this order

T7.0 (the Reload control, above) → T7.1 the pointer check → T7.2 the `state.ts` pilot → T7.3
`economy.ts` → T7.4 the life-beat kinds → T7.5 the measurement → T7.6 `shop.ts`. Nothing lands
before T7.1 except T7.0, for the reason the plan states: a pointer no gate reads is prose.

**And W7 runs under the token law** (docs/context/token-discipline.md, on this branch – merge
before starting): agents strictly SEQUENTIALLY, one task each, killed on report; §2's block in
every brief; the heavy gates run OUTSIDE the step agents – at the wave boundary, in the architect's
session, one branch at a time on a quiet machine. W7 closes by writing
`docs/handoff/principles-w7.md` (the template is docs/handoff/README.md) – the first physical
handoff under the law.

## The merges

The six branches stay stacked and waiting; nothing here re-opens them. PR assembly per wave via
the `pull-request` skill when the owner calls for it – the gates run then, in the architect's
session, in stack order.
