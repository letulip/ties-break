# src/style.css — the DRY audit

`src/style.css` is the whole app's stylesheet: ~4200 lines, ~500 top-level rules, and not one
`<style>` block anywhere else in `src/` (checked — there are none, scoped or otherwise). It grew by
accretion across the rounds, so the same visual idea has been written down more than once under
whatever name the round happened to need. This is the inventory of that, and the record of what was
done about it.

**Read in two parts.** The first pass (`css DRY 1–7`) was a PURE refactor: it folded duplicate rules
together and was not allowed to move a single pixel. It ended by listing five things it had found
and deliberately not touched, because fixing them would have been a visual change. The owner then
ruled on all five — every answer was *clean it up* — and the second pass (`css cleanup 1–6`) made
those changes on purpose. So: everything above "THE CONSISTENCY PRINCIPLE" describes a
zero-pixel-change refactor, and everything from there down describes deliberate, measured,
owner-sanctioned changes to how the app looks.

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

## How "not one pixel" was proved (first pass), and "only these pixels" (second)

Three layers, because each one alone has a hole in it.

1. **The static check above.** Sound for every element in the app, but it reasons about the sheet
   rather than measuring it.
2. **Seven live screens.** Home, Season, Stats, More, Money, This week and Kid, driven from a demo
   save (`--seed acad-offer --week 120`), compared element by element: the full computed style over
   ~180 properties including `::before`/`::after`, plus each element's bounding rect. Zero
   differences at every step.
3. **A probe over 731 element chains.** Most of the sheet dresses screens a click cannot reach on a
   loaded save — the tournament flow, the practice flow, the injury dialog, the season summary, the
   onboarding wizard. So every element chain in every `.vue` template is harvested (tag, classes,
   real ancestors), rebuilt in the page, measured, and thrown away. Anything the stylesheet has to
   say about an element, it says to the probe.

The probe was proved to BITE before it was trusted: a deliberate `padding: 16px → 17px` on
`.tf-card` surfaced as 138 style differences and 31 changed boxes across the flow. It was reverted,
and every consolidation since has been checked against a baseline captured on the pre-pass sheet.

**For the second pass the question inverts.** Those changes are MEANT to move pixels, so "zero
differences" would mean the work had not landed. The same three layers run, but the comparison
buckets every difference by its `before -> after` value pair, which collapses a whole screen into
the handful of distinct transitions that caused it — and makes an unintended one impossible to hide
in the noise. A single `color` change shows up as nine property differences (border colours, outline,
caret and text-decoration all follow `color`), so counting raw differences would have told nobody
anything; counting *distinct transitions* tells you exactly what changed. Each cleanup commit
records its own list, and every one of them was checked against the intent before it was committed.

The other half of that check is geometry, reported separately and never bucketed: **no box moved
anywhere in either pass.** That is the strong claim for the second pass in particular — a corner
radius or a colour must not be able to reflow a layout, and the numbers confirm none did.

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
| 19 | A row of actions pushed right | `.dialog-actions`, `.planned-actions` | byte-identical |
| 20 | A wrapping strip of chips (no cross-axis centring) | `.this-week-status`, `.entries-strip` | byte-identical |
| 21 | `.calendar-row-muted` declared itself twice, 10 lines apart | the two blocks | additive, no overlap |

### What that came to

|  | before | after | delta |
|---|---|---|---|
| declarations | 2033 | 1886 | **−147** |
| rules | 519 | 505 | −14 |
| lines of actual CSS (no comments, no blanks) | 3128 | 2988 | **−140** |
| lines in the file | 4174 | 4172 | −2 |

The last row is the honest one and it is worth reading twice: **the file did not get shorter.**
147 duplicated declarations came out and roughly the same number of lines of comment went in,
because in this codebase a rule that serves five surfaces has to say which five and why. The win
is not size, it is that there is now one place to change the panel shell, the notecard surface, the
percentage ring and the rest — and that the sheet's existing claims ("built exactly like the
tournament card", "so a percentage means one thing across the app") are enforced by the cascade
instead of being promises in a comment.

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

## What the first pass left open (all now RULED ON — see the next section)

### The premise that did not survive contact

> **PARTLY RULED (owner, 29.07):** the two lime eyebrows were folded in the first pass; the eight
> muted labels were re-examined in `css cleanup 6/6` and only the genuinely identical pair was
> folded. The tracking question below is the ONE thing in this document still open.


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

> **RULED (owner, 29.07):** drift — normalise. Done in `css cleanup 5/6`: seven even rungs, every
> move exactly +1px, `--radius-card` 17→18 so every card in the app is one radius.


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

> **RULED (owner, 29.07):** "причёсываем к новому цвету, надеюсь он один." Done in `css cleanup
> 4/6`: every tint is built from `--accent-rgb` now. The ALPHA ladder is still open — see below.


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

> **RULED (owner, 29.07):** "всё в переменные, если смыслово цвет ту же функцию выполняет —
> меняй." Done in `css cleanup 3/6`: one `--warning`, on the design system's own `#f5b942`.


`#f2b34f` is hard-coded in six places (`.pill.caution`, `button.primary.risky`, `.caution-note`,
`.rescue-card`, `.rescue-title`, `.pill.muted.lock` uses a seventh, `#d9b26a`). There is an `--amber`
token, but it is `#f5b942` — a **different** colour. So the caution family cannot simply be pointed
at `--amber`. **Open question:** should `#f2b34f` become its own token (`--caution`), or should the
caution family move onto `--amber`? The second is a pixel change and was not made.

### Two ring tracks that are nearly the same

> **RULED (owner, 29.07):** "всё в единый стиль." Done in `css cleanup 2/6`: one `--ring-track`
> at 0.18, the value that keeps signed-off Home unchanged.


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

The same goes for the pairs still left in the scan after this pass:

- `.save-row` (a row of controls in More) and `.recap-head` (the head of the week-recap card) —
  byte-identical four declarations, nothing in common in the app.
- `.pkg-head` (a vacation package's head row) and `.coach-tooltip-actions` (the tour's Next/Skip) —
  likewise.
- `.pkg-list` matching the draw's `.bt`/`.bt-list` — a 10px column in two unrelated places.
- `.bracket-score`/`.rank-value`, `.button.danger`/`.avail-chip.red`, `.choice-blurb`/`.nm-score`/
  `.planned-when` — two declarations each, three of them just "muted, 12.5px".

Every one of these would shorten the file and lengthen the next person's afternoon.

### Dead rules found on the way

> **RULED (owner, 29.07):** "мёртвые нам не нужны." Done in `css cleanup 1/6`, plus the three
> `.condition-block*` rules that came up with them.


`.condition-cell` and `.surface-note` (plus `.surface-note.suits`) have **no consumer in any template**
— grepped across all of `src/`. `.surface-note`'s own comment claims it is "still used by the
season-blocks strip", and it is not. They were left in place: deleting dead rules is a different
slice from de-duplicating live ones, and this pass was told to change nothing. Worth its own ticket.

## THE CONSISTENCY PRINCIPLE (owner, 29.07: "мы за консистентность всего")

Recorded here at the owner's instruction so it does not get re-litigated one rule at a time. The
five questions this document raised were all answered the same way — *clean it up* — and the
answers add up to a rule the next person can apply without asking:

**If two things do the same job, they get the same value, and that value has a name.**

Four corollaries, each of which was an actual decision in this pass:

1. **A token beats a literal, always.** Not for brevity — for repair. When the brand lime moved
   from `#d9f24f` to `#cfe152`, `--accent` moved and the eleven `rgba()` tints built from it did
   not, so every highlighted row in the app spent two waves washed in the previous brand colour.
   Nobody saw it; a 4% wash of an almost-identical lime is invisible on its own. A literal cannot
   be changed in one place, so it will eventually be wrong in most of them.
2. **When two values do one job, prefer the one that is already right somewhere else.** The
   warning colour resolved to `#f5b942` not because it is prettier than `#f2b34f` but because
   `docs/design/tokens.css` already declares `--warning: #f5b942`. The ring track resolved to 0.18
   because that is Home's, and Home is signed off. Neither was a taste call, and neither should
   have to be re-argued.
3. **Prefer a mechanical rule to a tasteful one.** The radius ladder rounds every odd value UP to
   the next even. That is arbitrary, and being arbitrary is the point: it decides 7 and 11 and 13
   without a discussion, it guarantees no corner moves by more than 1px, and anyone can check it.
   A ladder built by eye would have needed the same conversation again at the next value.
4. **Name by job, not by value — but a rung is allowed to be a size.** `--warning` is a job.
   `--radius-panel` is a size named for its most common tenant, and the polaroid's tack sitting on
   `--radius-control` is the ladder working, not a mistake. Both are recorded in the sheet.

And the limit, which matters as much as the principle: **consistency is not permission to guess.**
Where the right value could not be read off the export, an owner ruling, or an existing token, the
values were left alone and written down — see the one remaining question below. A silent
unification is indistinguishable from a bug that nobody noticed.

## The one question still open: uppercase label tracking

Every muted uppercase label in the sheet, measured:

| Rule | size | tracking | weight | margin |
|------|------|----------|--------|--------|
| `section h2` (Sora) | 12px | **0.08em** | — | `0 0 12px` |
| `.tf-round`, `.tf-champ-label` | 12px | **0.08em** | — | `0 0 16px` / `0` |
| `.donut-center-cap` (SVG) | 3px | **0.08em** | — | — |
| `.season-summary-kicker` | 11px | **0.08em** | — | `0 0 4px` |
| `.tf-bracket-title` | 11px | **0.06em** | — | `0 0 10px` |
| `.news-week-label`, `.ledger-week-label` | 11px | **0.05em** | — | `0 0 4px` |
| `th` | 12px | **0.05em** | 500 | — |
| `.tf-badge` (filled pill) | 12px | **0.05em** | 700 | — |

Two sizes (11 and 12) and three trackings (0.05, 0.06, 0.08) for what looks like one object. Only
the pair that was already byte-identical — `.tf-round` and `.tf-champ-label` — was folded; nothing
was normalised, because unlike the radii there is no evidence to round toward:

- The design export does not answer it. `docs/design/tokens.css` has a full type scale and exactly
  one tracking token, `--ls-label: -0.01em`, which is NEGATIVE and belongs to a tight display
  label, not to an uppercase eyebrow.
- Unlike a 1px corner, tracking at 11px is legible: 0.05em vs 0.08em is a visible difference in
  the width of a word, so this is not a change that can be waved through as invisible.

**The question for the owner:** should every muted uppercase label be 12px/0.08em — the value
`section h2` already sets, which would make it the app's one section-label idiom and put five of
the eight rules on it unchanged? If yes it is one rule and three margins. If the 11px ones are
deliberately a size smaller, then which tracking do they take?

(For reference, the LIME eyebrow — `.note-kicker` / `.diary-strip h2`, 10px/800/0.1em/accent — is
a different object and is already one rule. It is not part of this question.)

## Guard tests

Three tests pin a fact inside a rule that this pass merged. No assertion was weakened and no test
was deleted; all three now read the merged rule, and all three carry a `⚠ RE-AIMED` note saying what
moved and why the protected fact is unchanged.

- `tests/round10.test.ts` — "the injury dialog uses the squarer radius of the top popups" reads the
  body of `.stop-toast {`. `.stop-toast` is now the last selector of the shared top-popup rule, so
  the string it looks for still names the rule that declares the radius, and the radius it reads is
  still `.stop-toast`'s own.
- `tests/redesign-home.test.ts` — "the notecard and the 'pick it up' affordance are one shared rule"
  reads the body of `.note-card {` for the gradient and the `--card-edge` hairline. Both moved into
  the shared notecard-surface rule, whose selector list ends with `.note-card`, so the test reads the
  rule that now owns them.
- `tests/round11-view.test.ts` — "the planned row stacks instead of competing for width" reads the
  body of `.planned-actions {` for the `flex-end`. It merged with `.dialog-actions`; same
  selector-order rule, same `⚠ RE-AIMED` note.

In all three cases the merged selector list deliberately ends with the pinned selector. That is not a
trick to keep a test quiet: the rule genuinely is that selector's rule, and it genuinely declares the
property the test is checking. The comment in each test says so, so nobody has to rediscover it.

## Housekeeping notes

`public/ref.tsave` — a 44 KB demo save built by `tools/demo-save.ts` for visual checking — was
committed to the repo in `baadffa` ("ui wave U0"). The first pass found it, left it alone (undoing
another wave's commit is not a CSS refactor's call) and flagged it. It is **no longer tracked** as
of the rebase onto the wave branch, which is the right outcome. Both passes rebuilt it as a
temporary file and deleted it afterwards.

One drift this cleanup did NOT chase, recorded so it is not lost: the ink used on top of the lime
accent is `#101d0a` in five places and `#111a10` in two, and `docs/design/tokens.css` names a third
value for the same job (`--on-lime: #111a10`, `--on-lime-chip: #161f0c`). Same story as the accent
tints — three near-identical darks for one job — but it is outside the five questions the owner
answered, so it stays a finding rather than a change. It wants the same treatment: one token, the
design system's value.


---

# The three open questions, answered by the owner (29.07)

## 1. The alpha ladder: five values became two

There were five alphas doing one apparent job - 0.04, 0.05, 0.06, 0.08, 0.1 - and the owner asked
whether the ladder was needed at all. Read against what each one actually marks, it is two jobs:

| token | alpha | means | where |
| --- | --- | --- | --- |
| `--accent-wash` | 0.06 | **the app marked this for you** | an exam week, a planned week, the recommended package, a hovered result row, the row that is hers |
| `--accent-fill` | 0.12 | **you marked it, or she won it** | a chosen country or play style, a won bracket row, an unlocked tier |

Five steps could not be told apart on a dark panel anyway. Two can, and the difference now carries a
meaning instead of a history. `--accent-glow` (0.18, a shadow) and `--accent-soft` (0.45, a border)
are not fills and keep their own values.

## 2. Uppercase labels: one size, one tracking

The measured spread, six rules:

| rule | was | job |
| --- | --- | --- |
| `.news-week-label`, `.ledger-week-label` | 11px / 0.05em | a week divider in a feed |
| `.tf-bracket-title` | 11px / 0.06em | a title inside the bracket |
| `.season-summary-kicker` | 11px / 0.08em | the recap's kicker |
| `.tf-round`, `.tf-champ-label` | 12px / 0.08em | the round name, the champion's label |
| `.tf-badge` | 12px / 0.05em | a badge |

**One token: `--label-size` 11px, `--label-track` 0.08em.** 11px because four of the six already
were; 0.08em because it is the widest in use *and* it is the typographically right direction -
smaller caps need MORE tracking, and the old spread had it backwards (11px at 0.05em while 12px sat
at 0.08em).

**The eyebrow is not part of this family** and keeps its own values: it is the lime section heading
the design system specifies at 10px / 800 / 0.1em, and 10px carrying 0.1em is exactly the curve
11px / 0.08em continues.

## 3. Ink on lime: one value

Three values for one job - `#101d0a` five times, `#111a10` twice, and `tokens.css` naming a third.
Same drift as the accent tints: one decision, copied by hand, drifting on each copy. **`--on-lime`
is `#111a10`**, the design system's own, for the same reason `--warning` took its export value: the
app was behind its own handoff.

## The principle these three share

Every one of them was a decision made once and then re-typed. The rule going forward is the one the
owner stated: **if two values do the same job, they are one token** - and the token's name says the
job, not the value. When a genuine second job appears, it gets its own name and the difference
becomes visible in the stylesheet instead of hiding in a decimal.
