# Round 7 – tournament spectate + round-tabbed bracket

Two owner requests on the tournament flow (`src/components/TournamentFlow.vue`) and its
bracket display. The kid's whole shadow tournament is already simulated to the Final at
pending-creation (`world.pendingTournament.result.matches` – every match of every round,
deterministic); this round is presentation only, never a re-decision.

## Request 1 – spectate the tournament past the kid's exit

Today "Continue" exits the moment the kid is eliminated. The owner wants: after the kid's
last match, further clicks reveal the SUBSEQUENT rounds (she isn't in them, but the
tournament goes on), culminating in the Final; only after the Final does "Continue" go home.

### Engine (`src/engine/world.ts` – `pendingView`)

`fullBracket` was capped at `maxRevealedRound = revealed - 1` (only rounds the kid played,
to avoid spoilers). Change: once `p.finished` is true there are no spoilers left – expose
the FULL bracket (every round of `p.result.matches`, through the Final). While `!finished`,
keep the revealed-only cap unchanged.

```
const lastRound = p.finished
  ? Math.max(...p.result.matches.map((m) => m.round))   // whole draw, through the Final
  : revealed - 1                                         // spoiler-safe cap during her run
```

No new `PendingView` fields are needed. The UI derives everything else it needs:
- Final round index = `log2(drawSize) - 1`.
- Kid exit round index = `bracket.length - 1` (single-elim: she plays contiguous rounds
  `0 .. bracket.length-1`; when finished, `bracket` holds all her matches).
- Champion = the Final match's winner (`fullBracket` round === finalRound, `winnerId` →
  `aName`/`bName`).

Test (`tests/tournamentReveal.test.ts`): after `skipTournament` on a seed where the kid
loses early (`probe-2`, a draw of 8 – she loses her opening match), `pendingView(world)
.fullBracket` reaches every round through the Final (`max round === log2(drawSize)-1`) and
includes non-kid matches from the rounds AFTER her exit (all `aId`/`bId !== KID_ID`).

### UI (`TournamentFlow.vue`)

New `'spectate'` phase between `post` and `finale`. On the kid's post-match "Next →":
- she is champion → `finale` (unchanged).
- she reached the Final and lost (runner-up, exit round === final round) → `finale` (silver,
  unchanged).
- she exited earlier → `spectate`, starting at the round AFTER her exit
  (`spectateRound = kidExitRound + 1`).

Each spectate step shows that round's matches via the round-tabbed bracket (Request 2), the
active tab defaulting to `spectateRound`, with a "Next round →" button that advances
`spectateRound`. When `spectateRound === finalRound` the button becomes "Continue" → `finale`.
Her own result stays visible as a small "{Kid} — {finishLabel}" header during spectate.

Skipping is untouched: "Skip tournament →" (`game.tournamentSkip`) jumps straight to the
finale – spectating is the opt-in "Next" path only.

### Finale for a non-champion early exit

There is no art for an AI champion, so a clean Champion card (not the sad-art card):
`🏆`, "Champion: {winner short name}", the kid's own finish line
"{Kid} — {finishLabel} (+{points} pts)", and the tier · surface. → Continue → home.

The kid-champion finale (happy art + gold) and the runner-up finale (serious art + silver)
are unchanged – both are cases where she reached the Final.

## Request 2 – round-tabbed bracket ("DRAW")

Replace the old all-rounds column layout with a round-tabbed bracket, reused for BOTH the
between-rounds view (`post`) and the spectate walk. New component
`src/components/BracketTabs.vue` (props: `matches: FullBracketMatch[]`, `drawSize`,
`activeRound`).

- **Tabs**: a row of short round labels for the rounds present in `matches` – `R32 · R16 ·
  QF · SF · F` (remaining = `drawSize / 2**round`; 2→F, 4→SF, 8→QF, else `R{n}`). Active tab
  defaults to `activeRound` (the kid's latest played round during her run; the spectate round
  while spectating). Tapping a tab selects that round.
- **Cells**: the selected round's matches as a vertical list. Each cell is two rows
  (player A / player B, short names, winner-perspective score), the winner row accent-colored
  with a `✓`, the kid's match outlined in accent. Fixed cell height so the connectors line up.
- **Connectors**: a small SVG elbow to the RIGHT of each adjacent pair (cells `2k`, `2k+1`),
  joining them toward the next round – the classic bracket elbow. The Final's single cell has
  none.
- **Scroll**: bounded height with internal vertical scroll; scrollbar hidden
  (`scrollbar-width: none` + `::-webkit-scrollbar { display: none }`). On mount / round change,
  the kid's cell in the selected round (if present) is scrolled into view
  (`scrollIntoView({ block: 'center' })`).
- **Aesthetic**: «таблички», exact game palette (`--bg #0f172a`, `--panel #16213c`,
  `--line #263457`, `--accent #d9f24f`, `--muted #7d8db0`, `--text #dbe4f5`), readable at
  375 px, short dashes only.

The finale no longer shows the large draw (every path – champion, runner-up, early exit –
now sees the full bracket via post/spectate before the finale); the kid's compact text path
strip stays on the finale.

## Extra (owner, mid-round) – SeasonScreen this-week "Watch"

On `SeasonScreen.vue`'s "This week's tournament" match rows, drop the word "Watch": keep only
the `play.svg` icon, tinted accent-yellow (`var(--accent)` via the CSS mask background-color)
and sized like the bottom-tab icons (~20 px, matching `.tab-icon`). Keep it a real button with
`aria-label="Watch match"` (icon-only). The News "Watch" is unchanged – this is the this-week
list only.

## Gates

`npx vue-tsc -b` clean; `npx vitest run` green (314 + the new engine test); `npm run build`
clean; live-verify at 375 px (`npm run preview -- --port 4495`): lose early → "Next" walks
QF/SF/F round by round via the tabs, champion revealed at the Final, Continue → home; win it
all → champion finale unchanged; tabs switch rounds, kid cell highlighted + scrolled into
view, scrollbar hidden, connectors visible; console clean.
