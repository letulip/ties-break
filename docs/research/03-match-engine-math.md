# Match engine math (2026-07-22)

The scientific base for the point engine. Raw agent output: [raw/2026-07-22-market-research.json](raw/2026-07-22-market-research.json)

## Core model: iid Markov on serve points

Whole match reduces to two numbers per matchup: **p_A, p_B = probability each player wins a point on own serve**. Game/set/match = scoring state machine on top. Serve order provably doesn't affect win probability (Newton & Keller 2005) – coin toss is cosmetic.

Closed form for holding serve (q = 1−p):

```
P(hold) = p^4 (1 + 4q + 10q²) + 20 (pq)³ · p² / (1 − 2pq)
```

Values: p=.55→.623, .60→.736, .65→.830, .70→.901, .75→.949.
Set/tiebreak/match via recursion or O'Malley (2008) explicit formulas (validated on Wimbledon 2007). Best-of-3: M(s)=s²(1+2(1−s)), s = set probability.

**Use closed forms for**: instant results, live win-probability display, fast-simming all AI-vs-AI matches. **Use point-by-point only for the player's matches.**

## Parameter bands (realism calibration)

- ATP serve-point p: **0.58–0.72** (tour avg ~0.61–0.64); WTA: **0.52–0.62**.
- First-serve-in 55–70%; first-serve points won ~72–75% (top-10) vs ~67% (bottom of top 100); second-serve won ~50–55% (only 222 men since 1991 averaged >50%).
- Hold rates emerge naturally at 75–90%.
- **Tiny edges amplify**: p .63 vs .62 → 55% Bo3; **.65 vs .62 → ~65% Bo3**; .67 vs .62 → 73%; .70 vs .60 → 89%. Career progression should move p by fractions of a percent per tier.

## Matchup adjustment (Barnett–Clarke 2005)

```
f_ij = f_tour + (serve_skill_i − avg) − (return_skill_j − avg)
```

Or invert target Elo probability: P(win) = 1/(1+10^(−ΔElo/400)); ΔElo 100→64%, 200→76%, 400→91%. FiveThirtyEight K-factor: K = 250/((matches+5)^0.4); surface-specific Elo blended with overall (Tennis Abstract).

## Momentum & pressure (Klaassen & Magnus, JASA 2001; ~90k Wimbledon points)

- Points are NOT exactly iid, but deviations are **small**: winning previous point helps slightly; servers underperform on break points; both effects stronger for weaker players.
- Gamify as: momentum bonus **±1–3 points of p** after streaks; clutch/choke modifier on break/set points scaled by composure rating. Small in math, **visible in UI** (SlamTracker-style momentum line) – exactly what the data supports.

## Rally generation (decoupled from outcome!)

Decide the point winner first (Markov), then generate a plausible rally for rendering:

- Rally length is front-loaded: **0–4 shots ≈ 66–70%** of points (2024 US Open: 69% M / 68% W), 5–8 ≈ 20–27%, 9+ ≈ 10% (as low as 3.8% on fast courts). Geometric-family tail; clay longer, grass shorter. True at every level incl. U12.
- Shot directions (Match Charting Project): crosscourt ~55–65%, middle ~20%, down-the-line ~15–20% (the "winner attempt"; righty DTL backhand only 16.9%, Nadal 24.4%). Serves coded wide/body/T per court side.

## Data sources (free)

> ### ⚠ TWO OF THE THREE ARE GONE (verified 11.08.2026)
>
> `JeffSackmann/tennis_atp`, `/tennis_wta` and `/tennis_slam_pointbypoint` all return **404**.
> Measured by the live-text research: `tennis_atp` last returned 200 on **14 March 2026** and first
> 404'd on **24 June 2026**. The links below are kept rather than deleted because the parameters this
> project already derived from them were taken while they were live, and a reader needs to know where
> a shipped number came from – but nothing new can be fitted from them.
>
> **The surviving mirror** is a HuggingFace archive (`Aneeshers/tennis-sackmann-archive`, 473 files);
> a thinner 2011-2015 mirror of the Slam point-by-point data exists at `halepmania/tennis_slam_pointbypoint`,
> unlicensed. Both are in `docs/research/live-text-adult-tour.md` with URLs.
>
> ⚠ **AND THE ONE THAT SURVIVED IS NON-COMMERCIAL.** Match Charting Project is CC BY-NC-SA 4.0, and
> this project is commercial (see CLAUDE.md). The line below reads "fine for deriving aggregate
> parameters, attribute it" – that was a judgement made when it was one free source among three, and
> it is now the ONLY one. Whether an NC-SA corpus may be used to fit constants that ship in a
> commercial product is a real question and it is the owner's to answer, not this document's to
> assume. Nothing currently depends on it that was not already derived.

- [tennis_atp](https://github.com/JeffSackmann/tennis_atp) / tennis_wta – **DEAD (404)**. Was: every match since 1968 with serve stats (aces, df, svpt, 1stIn, 1stWon, 2ndWon, bpSaved) → fit rating→p mapping by surface.
- [Match Charting Project](https://github.com/JeffSackmann/tennis_MatchChartingProject) – **live**, 17,808 matches, 2.77M points, **10.5M coded shots** with directions. License CC BY-NC-SA 4.0 – see the warning above.
- tennis_slam_pointbypoint – **DEAD (404)**. Was: Slam point-by-point.

## Visualization references

- **IBM SlamTracker**: momentum line + live win probability + "Keys to the Match" progress bars – proves data-driven charts alone carry match drama with zero ball animation.
- Proven 2D pattern: top-down Canvas/SVG court, ball dot along **quadratic Bezier arcs** between placement cells (serve boxes split wide/body/T; court as 3×3 grid matching MCP direction codes); shot-placement heatmaps between points. Etter Studio's PointStream rendered live Wimbledon points generatively from data.
