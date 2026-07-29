# src/style.css — the DRY audit

`src/style.css` is the whole app's stylesheet: 4173 lines, 511 top-level rules, and not one `<style>`
block anywhere else in `src/` (checked — there are none, scoped or otherwise). It grew by accretion
across the rounds, so the same visual idea has been written down more than once under whatever name
the round happened to need. This is the inventory of that, and the record of what was done about it.

## How the groups were found

Two mechanical passes, not eyeballing:

1. **Byte-identical declaration blocks.** Parse the sheet, normalise each rule's body (strip inner
   comments, collapse whitespace, sort declarations), group rules by the normalised body. Anything
   with two or more members is a literal duplicate.
2. **Near-duplicates.** For every pair of rules with four or more declarations in common, print the
   shared set and each side's remainder. This is what finds "the same object with one property
   different" — the ring, the icon, the photo card.

A third script answers the only question that actually matters for a pure refactor: **can grouping
these rules change which declaration wins?** Merging N rules into one at line T moves each member's
declarations across every rule between its old line and T. Order decides a winner only between
declarations of EQUAL specificity landing on the SAME element, so the checker lists exactly those:
every rule inside the crossed range that declares one of the merged properties, at the same
specificity, whose key compound can land on an element that a member's key compound also lands on.
"Can land on the same element" is not guessed — it is checked against the real class-sets harvested
from every `class="…"` and `:class="…"` in the `.vue` templates (1244 elements). A group is only
consolidated when that checker prints zero.

That check covers screens no screenshot reaches (dialogs, the tournament flow, the onboarding
wizard), which screenshots of Home and Season cannot.

## What was consolidated

Ordered as committed. "Lines" is the net change in `src/style.css`.

| # | The idiom | Rules folded together | Identical? |
|---|-----------|----------------------|------------|
| 1 | The top popup — a strip pinned above the content column in an accent frame | `.recovered-banner`, `.stop-toast` (11 declarations) and their `button` children (2) | byte-identical |
| 2 | The compact button — a control that has to fit inside a strip or a row | `.recovered-banner button`, `.stop-toast button`, `.pkg-actions button`, `.breakdown-toggle .option-pill` | byte-identical |
| 3 | The panel shell — a `--panel` box with a hairline, 12px corners and 16px of padding | `.dialog-card`, `.replay-card`, `.tf-card`, `.guide-card`, `.plan-sheet` | 4 declarations identical, each keeps its own width/height/position |
| 4 | The masked SVG icon at 20px | `.tab-icon`, `.watch-play-icon` | 9 identical, differ only in `background-color` |
| 5 | The percentage ring — "a percentage means one thing across the app" | `.chance-ring`/`.condition-ring`, their `-value` boxes, `b`, `i`, and the two reduced-motion blocks | 4 + 9 + 3 + 3 identical |
| 6 | The photograph card — art bleeding under the words | `.event-card`, `.week-card` | 7 identical |
| 7 | The notecard surface — gradient, translucent hairline, 17px corners | `.friendly-card`, `.diary-strip`, `.note-card` | 3 identical (see note on `17px`) |
| 8 | The lime eyebrow — 10px/800/0.1em uppercase, the page's one "read this" colour | `.note-kicker`, `.diary-strip h2` | 6 identical after the two implicit values are written down |
| 9 | The full-screen takeover | `.splash`, `.onboarding`, `.tournament-flow` | 5 identical, z-index differs |
| 10 | The scrolling body of a full-screen flow | `.onboarding-body`, `.tf-body` | 6 identical |
| 11 | A card's head row | `.replay-header`, `.tf-card-head`, `.breakdown-head` | 5 identical |
| 12 | A photograph filling its frame | `.event-art img`, `.venue-art img`, `.diary-hero-img`, `.week-art img` | 4 identical (the fourth adds `object-position`) |
| 13 | The 32px round icon button | `.replay-close`, `.tier-guide-btn` | 7 identical |
| 14 | A wrapping row of chips, 8px apart | `.controls`, `.condition-cell`, `.season-strip` | byte-identical |
| 15 | The centred cards of the tournament flow | `.tf-vs`, `.tf-finale`, `.tf-splash`, `.tf-spectate` | byte-identical |
| 16 | The onboarding "picked" state | `.country-tile.selected`, `.choice-card.selected` | byte-identical |
| 17 | A hidden scrollbar on the draw's two scrollers | `.bt-tabs::-webkit-scrollbar`, `.bt-scroll::-webkit-scrollbar` | byte-identical |
| 18 | The draw's two vertical stacks | `.bt`, `.bt-list` | byte-identical |
| 19 | `.calendar-row-muted` declared itself twice, 10 lines apart | the two blocks | additive, no overlap |

### On group 7 and the bare `17px`

`.friendly-card` wrote `border-radius: 17px` where `.note-card` and `.diary-strip` wrote
`var(--radius-card)`. `--radius-card` **is** `17px` — the same value, one of them spelled out. Folding
the literal into the token is not a value change and the computed radius is byte-for-byte what it
was; it is recorded here because rule 6 says near-identical values get reported rather than merged,
and someone reading the diff should not have to re-derive that these two were already equal.

### On group 8 and the two implicit values

`.note-kicker` never declared `font-family` — it inherits `var(--font-body)` from `.note-card`, which
is the only place it is ever used. `.diary-strip h2` never declared `text-transform` — `.diary-strip`
is a `<section>`, so `section h2` was supplying the uppercase. Both were confirmed in the browser
against the running app before the merge: computed `font-family`, `font-size`, `font-weight`,
`letter-spacing`, `text-transform` and `color` are identical on the two elements, and only
`margin-bottom` (0 vs 12px) and `position` (relative vs static) differ. Writing the two implicit
values down in the shared rule changes no computed value and makes the rule readable on its own.

## What was NOT consolidated, and why

### The premise that did not survive contact

The brief describes the eyebrow as ten rules all at "10px / weight 800 / letter-spacing 0.1em". It is
not. Only two of the ten are that: `.note-kicker` and `.diary-strip h2`. The other eight are a
different object — a **muted** label, at three sizes and four trackings:

| Rule | size | tracking | colour | margin |
|------|------|----------|--------|--------|
| `.note-kicker` | 10px | 0.1em | accent | 0 |
| `.diary-strip h2` | 10px | 0.1em | accent | 0 0 12px |
| `.news-week-label`, `.ledger-week-label` | 11px | 0.05em | muted | 0 0 4px |
| `.season-summary-kicker` | 11px | 0.08em | muted | 0 0 4px |
| `.tf-bracket-title` | 11px | 0.06em | muted | 0 0 10px |
| `.tf-round` | 12px | 0.08em | muted | 0 0 16px |
| `.tf-champ-label` | 12px | 0.08em | muted | 0 |
| `.tf-badge` | 12px | 0.05em | (a filled pill) | — |
| `.donut-center-cap` | 3px | 0.08em | muted `fill` | — (SVG text) |

**Open question for the owner:** 11px at 0.05em, 0.06em and 0.08em are three tracking values for what
looks like one label, and 11px vs 12px is two sizes for it. If these are meant to be one object,
say which values win and it becomes one rule; until then they stay apart, because collapsing them is
a pixel change and this pass is not allowed to make one. The two 12px/0.08em rules (`.tf-round`,
`.tf-champ-label`) differ only in `margin` and could be merged on the owner's word alone.

### The card radii

The brief groups `.event-card`, `.week-card`, `.friendly-card` and `.onboarding-portrait` as one
"14–18px-radius panel". They are four different radii and were left as four:

- `.event-card`, `.week-card` — **18px** (merged with each other, group 6)
- `.friendly-card`, `.note-card`, `.diary-strip` — **17px** = `--radius-card` (merged, group 7)
- `.onboarding-portrait`, `.venue-art`'s bottom corners — **14px**
- `.dialog-card` and the panel shells — **12px**
- `section`, `.stats-tile`, `.pkg-row`, `.rescue-card`, `.calendar-row-muted`, the top popups — **10px**

**Open question:** 18 and 17 are one pixel apart and both mean "a card". If they are meant to be the
same object, `--radius-card` should take both; if the tournament card is deliberately a shade
rounder, that deserves a sentence in the sheet, because nothing there says so today.

### The accent tints

`rgba(217, 242, 79, α)` appears with five alphas — 0.04, 0.05, 0.06, 0.08, 0.1 — across
`.week-card.exam`, `.pkg-row.recommended`, `.calendar-row-muted.planned`, `.bracket-row`,
`.tf-strip-row.won`, `.bt-cell.is-kid`, `.news-match-btn:hover`, `.country-tile.selected`,
`.choice-card.selected`, `.tier-chip.unlocked`, `.bracket-row.won`.

That RGB is **`#d9f24f`, the pre-redesign lime** — not `--accent`, which the export moved to
`#cfe152`. So every accent-tinted background in the app is a shade off the accent it is tinting.
**Open question:** is that deliberate (a warmer tint under a cooler line) or a leftover? Either way it
is a colour decision, not a refactor, so nothing here was touched. Five alphas of one colour would
collapse to one token plus one alpha if the owner picks a value.

### The caution amber

`#f2b34f` is hard-coded in six places (`.pill.caution`, `button.primary.risky`, `.caution-note`,
`.rescue-card`, `.rescue-title`, `.pill.muted.lock` uses a seventh, `#d9b26a`). There is an `--amber`
token, but it is `#f5b942` — a **different** colour. So the caution family cannot simply be pointed
at `--amber`. **Open question:** should `#f2b34f` become its own token (`--caution`), or should the
caution family move onto `--amber`? The second is a pixel change and was not made.

### Two ring tracks that are nearly the same

`.chance-ring-track` strokes `rgba(255, 255, 255, 0.12)`; `.condition-ring-track` strokes
`rgba(255, 255, 255, 0.18)`. Everything else about the two rings is now shared (group 5). **Open
question:** is the six-hundredths difference intentional (the condition ring sits on a photograph,
the chance ring on a card, so it may genuinely need more) or drift? Left alone.

The two arcs also differ for a stated reason — the condition arc animates its `stroke` as well,
because the colour is the number — so those stay apart on purpose.

### Coincidences that are not idioms

The byte-identical scan finds a long tail of one-declaration matches: thirteen rules that are only
`color: var(--accent)`, eight that are only `color: var(--muted)`, five that are
`color: var(--accent); font-weight: 600`, four that are only `text-align: center` outside the
tournament flow, and so on. `.score-line.final` and `.tab-btn.active` say the same thing in CSS and
nothing at all in common in the app. Folding them into a shared selector list would make the sheet
shorter and strictly worse to read — the next person to change the active tab's colour would move
thirteen unrelated things. Left alone deliberately; this is where DRY stops being a virtue.

The same goes for `.save-row` (a row in More) and `.recap-head` (a card's head) being byte-identical,
and for `.pkg-list` matching `.bt`/`.bt-list`: same four declarations, unrelated objects.

### Dead rules found on the way

`.condition-cell` and `.surface-note` (plus `.surface-note.suits`) have **no consumer in any template**
— grepped across all of `src/`. `.surface-note`'s own comment claims it is "still used by the
season-blocks strip", and it is not. They were left in place: deleting dead rules is a different
slice from de-duplicating live ones, and this pass was told to change nothing. Worth its own ticket.

## Guard tests

Two tests pin a fact inside a rule that this pass merged. Neither assertion was weakened and neither
test was deleted; both now read the merged rule, and both carry a `⚠ RE-AIMED` note saying what moved.

- `tests/round10.test.ts` — "the injury dialog uses the squarer radius of the top popups" reads the
  body of `.stop-toast {`. `.stop-toast` is now the last selector of the shared top-popup rule, so
  the string it looks for still names the rule that declares the radius, and the radius it reads is
  still `.stop-toast`'s own.
- `tests/redesign-home.test.ts` — "the notecard and the 'pick it up' affordance are one shared rule"
  reads the body of `.note-card {` for the gradient and the `--card-edge` hairline. Both moved into
  the shared notecard-surface rule, whose selector list ends with `.note-card`, so the test reads the
  rule that now owns them.

In both cases the merged selector list deliberately ends with the pinned selector. That is not a
trick to keep a test quiet: the rule genuinely is that selector's rule, and it genuinely declares the
property the test is checking. The comment in each test says so, so nobody has to rediscover it.
