# Spec — surface × play-style interaction

**Branch:** `feat/surface-style` · **Worktree:** `/Users/letulip/Projects/Claude/tb-surface` (based on `feat/ladder-up`)
Player copy: short dash "–", no Cyrillic in player-facing strings.

## Why
Surface already reaches the match engine as PHYSICS — serve bonus (grass +0.015 / hard 0 / clay
−0.015), ace rate (grass ×1.5, clay ×0.6) and rally length (clay longer, grass shorter). What it
does NOT do is interact with the kid's **play style**, the one build choice the onboarding gives
the player ("the only build choice is the play style" — the standing design principle: talent is
discovered, not allocated). So today the surface column in the calendar is flavour: an
`aggressive` kid and a `counterpuncher` play a clay event identically.

Making style × surface matter turns the calendar into a strategic axis — pick the events that suit
her — without adding any new stat or UI.

## Design
A single named modifier table, style × surface, applied to the KID's `MatchPlayer` attributes
before a match (post-draw, pure arithmetic — NO RNG, exactly like the existing condition factor in
`world.ts`). Shape it so every style has a home and an away surface, and `all-court` is flat:

| style | clay | hard | grass |
|---|---|---|---|
| `serve-first` | − | 0 | + |
| `counterpuncher` | + | 0 | − |
| `aggressive` | − | + | 0 or + |
| `all-court` | 0 | 0 | 0 |

- Express the modifier per ATTRIBUTE, not as one blunt scalar — e.g. grass boosts `serve` for a
  serve-first kid; clay boosts `ret`/`stamina` for a counterpuncher. That reads truer and composes
  with the physics already in `point.ts`/`rally.ts` instead of double-counting it.
- **Magnitude: start conservative** and justify it against the existing surface physics (the
  engine's own surface serve bonus is ±0.015 on p). Something in the ±3-6% range on the affected
  attributes is the target; the exact numbers are a knob, not a constant buried in a formula.
- `all-court` must be genuinely neutral, never strictly worse: its payoff is the absence of a bad
  surface. Verify on the bench that it is not dominated.
- The AI cohort has NO play style today (`AiPlayer` = serve/ret/composure/stamina/nation/growth).
  Do NOT give them styles in this slice — note it as a future extension. This asymmetry is fair:
  the style is the player's build choice, and it carries penalties as well as bonuses.

## Where it applies
Everywhere the kid plays a real match: her tournament runs (the shadow tournament path), the
practice friendly, and the exhibition/friendly viewer — all of which build her `MatchPlayer`. Apply
it in the SAME place her condition factor is applied so there is one composition point and no
double application. Do not touch AI-vs-AI matches.

## Tests
- Table symmetry: every style has at least one favoured and one unfavoured surface except
  `all-court`, which is flat everywhere.
- The modifier composes multiplicatively with the condition factor and is applied exactly once per
  match (a run of 5 matches applies it 5 times, not 25).
- A serve-first kid beats an identical counterpuncher on grass more often than on clay over a
  Monte-Carlo sample, and vice versa — the direction test that proves the feature is real.
- Zero RNG: the frozen main-stream pins in `tests/condition.test.ts` / `tests/injuries.test.ts`
  (read the CURRENT values from the files) stay byte-identical.
- No schema bump — `playStyle` already lives on `PlayerProfile`.

## Nice-to-have (only if cheap)
Surface is already shown on the calendar card and the pre-match splash. A one-line hint on the
tournament card when the surface suits/opposes her style ("Clay – suits her game") would make the
mechanic legible instead of hidden. If it costs more than a small computed label, skip it and say so.

## Gates
`npx vue-tsc -b --force` 0 · `npx vitest run` all green · `npm run build` clean · `npm run check`.
Then run `npm run bench:econ` (and `bench:fatigue` if it is not prohibitively slow — sim cost per
week is no longer flat) and report whether any style/surface combination distorts results or leaves
`all-court` dominated. Do NOT `git push`; do NOT edit `docs/decisions.md`.
