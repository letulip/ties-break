# Spec — DRAW view: round-tabbed bracket (owner-approved mockup, round-7 era)

**Branch:** `feat/draw-tabs` · **Worktree:** `/Users/letulip/Projects/Claude/tb-draw` (off main `06adfdc`)
**Scope:** `src/components/TournamentFlow.vue` + its styles (`src/style.css`) ONLY. The engine, the
snapshot, and every other screen stay untouched. Player copy uses the short dash "–".

## Why
The current full-draw is an inline bracket that grows unboundedly and buries her match. The owner
approved a round-tabbed mockup instead (`draw_bracket_round_tabs_mockup`): compact, one round at a
time, always centered on her.

## Layout (the approved mockup)
1. **Tab row** across the top: `R32 | R16 | QF | SF | F` — only rounds that EXIST for this draw
   size, labeled by the standard stage names already produced by `stageLabel`. **Default-selected
   tab = the kid's CURRENT round** (the deepest round she has reached / is playing). Reuse the
   existing segmented-control pattern (`.tab-row`/`.tab-pill` in style.css, kept from round 6) so
   it matches the rest of the app. **The active segment is solid accent with DARK text**
   (`#101d0a`-style), including its `:hover:not(:disabled)` state — the round-8 lesson: the global
   `button:hover` rule otherwise repaints the label accent-on-accent and it vanishes.
2. **Pairs as a vertical list** for the selected round: each match one row with both players.
   - Winner: accent name + a ✓; loser: muted (`#7d8db0`).
   - The KID's match: accent frame around the row (she must be findable at a glance).
   - AI-vs-AI matches with no scoreline stay score-less (existing behavior).
3. **SVG connector elbows** on the RIGHT of the list: two adjacent pairs converge toward the next
   round, so the bracket structure still reads even though only one round is shown. Pure inline
   SVG, colors from the palette, no libraries.
4. **Bounded height + auto-scroll**: the list has a max height and scrolls internally;
   on tab change / mount, `scrollIntoView({ block: 'center' })` on the kid's row.
5. **Scrollbar hidden** (`scrollbar-width: none` + `::-webkit-scrollbar { display: none }`) — wheel
   and touch scrolling still work; the owner's call ("сами догадаются").
6. Palette (exact game colors): bg `#0f172a`, panel `#16213c`, line `#263457`, accent `#d9f24f`,
   muted `#7d8db0` — prefer the existing CSS variables where they already hold these values.

## Behavior / integration
- Shown between rounds and at the finale — **never** on top of the pre-match card and never during
  a replay (the round-7 rule stays).
- Spoiler safety is unchanged: only REVEALED rounds are visible; a round she hasn't reached yet
  must not leak future results. If a tab would expose an unrevealed round, it is disabled (or
  absent) — verify against the existing reveal/spoiler tests in `tests/tournamentReveal.test.ts`.
- Replaces the collapsible full-draw block; drop the dead markup/CSS it leaves behind.
- Keyboard/aria: tabs are real buttons with `aria-pressed`/`aria-label`; the kid's row gets an
  `aria-label` noting it is hers.

## Gate
`npx vue-tsc -b --force` 0 · `npx vitest run` all green (esp. the tournament-reveal suite; if a test
asserts the OLD full-draw markup, update it deliberately and say so) · `npm run build` clean ·
`npm run check` clean. Browser-verify at 375 px: tabs readable at rest AND under hover, default tab
= her round, her row centered, elbows aligned, no horizontal page scroll. Do NOT `git push`. Do NOT
edit `docs/decisions.md`.
