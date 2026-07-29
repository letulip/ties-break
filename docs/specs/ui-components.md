# U0 — the shared components, and what they absorb

The handoff lists 31 reusable components and says to build the first seven before anything else.
This is the plan for that, written before the edit so the extraction is a translation and not a
redesign.

## Why this goes first, with a number

We have built these patterns ad hoc **twice already**, inside Home and inside Season, and they did
not converge. The clearest case is the eyebrow — uppercase 10px/800/0.1em in lime, the design's
"section heading inside a card". Ten class names in `src/style.css` implement it today:

`.news-week-label` · `.ledger-week-label` · `.tf-round` · `.tf-badge` · `.tf-bracket-title` ·
`.tf-champ-label` · `.donut-center-cap` · `.season-summary-kicker` · `.note-kicker` · `.diary-strip h2`

Card is the same story at smaller scale: `.event-card`, `.week-card`, `.friendly-card` and
`.onboarding-portrait` each re-declare a 14–18px radius panel. Six more screens are about to be
built. Without this step they become copies eleven through sixteen.

## The eight, and their contracts

Each one lists **what it absorbs** — the existing class names it replaces — because that is how we
will know the extraction is finished, and how the next reader knows where the old name went.

### 1. `ScreenShell`
Slots `header` / default / `footer`; the vertical stack the whole system assumes — header
`flex:none`, content `flex:1; min-height:0`, footer `flex:none`. Prop `gutter` (`14` default,
`22` for onboarding — the handoff's one exception). Owns the side padding so no screen sets it again.
**Absorbs:** the per-screen wrappers in HomeScreen / SeasonScreen / KidScreen / MoneyScreen.
**Not** the tab bar — the bar stays exactly as it is (owner's ruling, `ui-inventory.md` §4 Q1).

### 2. `Card`
`--surface-card` (#141d26), `--r-card` (17px), subtle border, padding 14. Variants `gradient`
(`--surface-card-gradient`) and `raised` (`--surface-card-raised`). Prop `pad` to override.
**Absorbs:** `.event-card`, `.week-card`, `.friendly-card`, `.note-card`, the panel blocks in Stats
and Money.

### 3. `Eyebrow`
10px / 800 / 0.1em, uppercase, `--accent-lime`. One element, no props beyond the slot.
**Absorbs:** all ten class names listed above.

### 4. `PaperNote`
Props `tilt` (deg, −4…+6), `ruled`, `torn`, `tape`, `marginRule`. Background `--paper-lined` /
`--paper-card`, radius `--r-paper` (2px — paper is not rounded), shadow `--sh-paper`, ruling from
`--paper-ruling`, Caveat inside.
**Absorbs:** the diary note on Home and the hand-written blocks on Season.

### 5. `Polaroid`
White frame + photo + optional tape, prop `tilt`. `--paper-polaroid`.
**Absorbs:** the memory card on Home; the trip photo on Money will use it directly.

### 6. `ProgressRing`
Sizes 46 / 56, track + progress arc, label in the middle. Props `value` (0..1), `size`, `label`,
`color`. **Our condition ring's continuous hue** (`hsl(pct*120, 72%, 48%)`) is kept as a `color`
option — it is ours, it works, and the design does not contradict it.
**Absorbs:** the condition ring on Home, the chance ring on Season, `.donut-center-cap`.

### 7. `PrimaryPill`
Lime pill + shadow, `ghost` variant for segments, `disabled` state. Radius 999.
**Absorbs:** `.primary`, the CTA buttons across Home / Season / the flows.

### 8. `SegmentedRow`
The period / phase switcher. Options in, active index out.
**Absorbs:** `.tab-row` / `.tab-pill` (already shared once, in wave 1's draw tabs — this makes it
official), the Money screen's 12w/season toggle, Season's phase strip.

`StatRow` (#8 in the handoff's own numbering) comes with the Money screen in U1, where it has a real
caller; extracting it now would be guessing at its shape.

## How the extraction is proved

**By porting Home and Season onto it in the same slice.** Two callers that were written
independently are the only honest test that the abstraction is not just one screen with a wrapper
around it. If a component needs a special case to fit the second caller, it is the wrong component
and gets reshaped before six more screens depend on it.

The visual result must be **unchanged** — this is a refactor, not a redesign. Home and Season were
signed off by the owner in wave 2; if a screenshot moves, the extraction is wrong.

## Guards

The existing source-reading guard tests pin facts about these screens by class name (for example the
Season card's travel figure and its academy caption). Those names are about to move into components.
Each guard gets **re-aimed at its new home with a ⚠ note explaining what moved and why the protected
fact is unchanged** — never deleted. That rule has already caught two real regressions in this
project.
