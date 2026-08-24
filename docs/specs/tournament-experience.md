# Tournament experience spec (branch `feat/tournament-experience`)

Owner's top priority: a tournament must be a **foreground, match-by-match experience**, not a
result resolved in the background of a week tick. When the kid's entered event lands, advancing
pauses, and the player walks the bracket round by round – watch or skip each match, see the stats,
reach the finale – before the week finishes.

Ground rules from `docs/specs/phase3-world.md` still hold. The kid's tournament runs on the
event-scoped RNG `seed:kidtour:eventId`, never the main weekly stream; the canonical AI brackets for
ALL events run in `tickWeek` on the main stream. Short dashes only in copy and comments (owner rule).

## Core model – reveal, don't re-run

When `tickWeek` reaches a week where the kid has an entered event, run EVERYTHING as before EXCEPT
the kid's tournament resolution:

1. parent income, base costs (main stream, unchanged draw count)
2. charge travel for the entered event (`expense` event, same position/id as before)
3. compute the kid's **full shadow `TournamentResult`** right there, on the same event-scoped RNG
   `seed:kidtour:eventId` – byte-identical outcomes to the old inline `runKidTournament`. The
   entrants' and kid's skill snapshots are taken here (pre-drift) and stored, so the revealed match
   events are identical no matter how the cohort drifts afterwards.
4. store `world.pendingTournament = { eventId, result, revealedRounds: 0, finished: false, players }`
5. `driftCohort` + canonical AI tournaments for every scheduled event (main stream) – unchanged
6. **PAUSE**: the kid's ranking points, match/summary/milestone events, and the week's rank
   recompute are all deferred to finalize. A normal (non-entered) week still does the rank recompute
   and housekeeping inline as before.

`advanceWeeks` stops with `stopReason: 'tournament'` the moment a tick sets `pendingTournament`.
`advance(1)` enters this state too. The week is NOT fully closed until the tournament resolves.

Save schema bumps to **v8** (migration default `pendingTournament = null`). The golden corpus guard
forces a `v8.json` fixture.

### Why the deferred split stays byte-identical

The old inline order inside `tickWeek` was: income, expense, [sponsor], travel, `match×R`, summary,
[first-title], [first-national], (drift), (AI results), then rank recompute + rank milestones, then
prune/ensureSeason. Drift and AI emit **no** events. So splitting off the kid tail to a finalize
step preserves the exact `nextEventId` sequence: the tick emits income…travel, the reveals emit
`match×R`, and finalize emits summary + milestones + rank milestones. The only difference from the
old world is the internal ORDER of the `results` array within the resolved week (kid result now
pushed after the AI results instead of before) – which is unobservable (ranking aggregates a week
order-independently) – plus the new `pendingTournament` field.

## Worker messages

- `tournamentReveal` – reveal ONE more round: emit that round's kid `match` event (reusing the old
  event text/shape and the stored pre-drift skills), bump `revealedRounds`. When the just-revealed
  match is the kid's last (elimination or the final), **finalize**: award ranking points, emit the
  `tournament` summary + any milestones, recompute rank with `prevKidRank`, set `finished: true`
  (pending is kept so the finale is snapshot-driven), autosave.
- `tournamentSkip` – reveal all remaining rounds, then finalize. The flow jumps straight to the finale.
- `tournamentClose` – clear `world.pendingTournament`, autosave. Sent by the finale's "Continue".
  (Refinement of the spec: finalize keeps `pendingTournament` alive with `finished: true` so the
  finale view – `finished` / `kidChampion` / points / path – is a real snapshot, reload-safe; a
  distinct close message clears it. Only two "reveal" messages, plus this pure clear.)

While `pendingTournament` is set, `tickWeek` / `advanceWeeks` refuse to advance (the flow overlay
also blocks the UI). `restoreRng` stays valid across a mid-tournament save because the per-week
main-stream draw count is entry-independent; its entry-less probe reproduces the same stream
position.

## Snapshot `pending`

```ts
Snapshot.pending?: {
  eventId, tier, surface,
  roundLabel,                       // current round to present
  opponent: { name, rank },         // kid's opponent this round (short name, standings rank)
  kidMatch?: WorldMatch,            // current round's record: replay + post-match stats
  bracket: { roundLabel, oppName, kidWon, score? }[],  // revealed rounds, kid's path
  finished, kidChampion,
  tierLabel, points, finishLabel,   // finale card copy
}
```

Lean: enough for the pre-match card, the post-match card, the between-rounds bracket strip, and the
finale. Scorelines in `kidMatch` / `bracket` are the record's own – the UI never shows a score before
the match has been watched or skipped.

## Match stats (owner item 14)

`src/viz/match/matchStats.ts` – pure (moved out of `src/engine/match/` at R2-06: a box score is
presentation, and only screens read it). `computeMatchStats(annotated, playerA, playerB)` (the two
players are needed for serve skill, which `AnnotatedMatch` does not carry – documented deviation from
the one-arg signature in the item). Per side:

- **winners** – rally shots with result `winner`
- **unforced errors** – rally `net`/`out` shots by the loser of each point (serve faults excluded)
- **aces / double faults** – from the rally flags, attributed to the server
- **serve speeds** – per serve shot, deterministic
  `speed = 128 + serveSkill * 0.45 + jitter(±8)`, second serves `-14`, drawn from
  `rngFromSeed(result.seed + ':spd:' + pointNumber)`; report `avg` + `max` per side

Match level: **mean rally length** (mean shots per point) and a **duration estimate**
`totalPoints * 42 s` formatted `h:mm`.

Identity guaranteed by the rally model (every point ends in exactly one of ace / DF / winner /
error): `Σ winners + Σ UE + Σ aces + Σ DF === totalPoints`.

TDD: determinism (same inputs → same stats), the winners+UE+ace+DF = point-count identity, serve
speed bands for serve skill 40 vs 90.

## UI – `TournamentFlow.vue`

Full-screen overlay (like onboarding), auto-shown whenever `snapshot.pending` exists.

1. **Pre-match card** (VS-screen reference): round label, kid vs opponent (short names, flags if
   available, standings ranks, surface chip). Actions: "Watch match" (inline `MatchReplay` from the
   record's seed + snapshots; on finish → post-match) and "Skip" (`tournamentReveal`, straight to
   post-match).
2. **Post-match card**: scoreline from the kid's perspective, W/L badge, `computeMatchStats` table
   (aces, DFs, winners, UE, avg rally, max serve speed per side), "Watch again", then "Next" → next
   pre-match (or finale).
3. **Between rounds**: compact bracket strip of revealed rounds, kid's path highlighted.
4. **Finale**: champion → celebration card (trophy emoji + `images/fem-euro-brunnet/
   fem-euro-brunnet-jun-happy-fs8.webp`, tier label, "+N pts", path summary); eliminated → sober card
   (jun-sad art, round reached, "+N pts"). "Continue" → `tournamentClose`, closes the flow (week
   completes visually; Home shows the news).
5. **"Skip tournament"** link (top-right) → `tournamentSkip` → straight to the finale.

The old "Stopped: this week's tournament…" toast is removed – the flow replaces it. Deadline/funds
stops keep their toast. `«таблички»` aesthetic, 4/8/12/16/24 spacing, short dashes in copy.

## Gates

`npx vue-tsc -b` 0; full `npx vitest run` green (221 baseline + new, incl. the v8 golden fixture and
the reveal-vs-skip determinism test); `npm run build` 0; live-verify at 375 px.
