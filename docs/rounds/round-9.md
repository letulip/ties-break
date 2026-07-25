# Round 9 — owner playtest (22 items, 25.07.2026) — lands on fix/round8-ui

Owner played main (WITHOUT the unmerged fix/round8-ui): items 6/17 and parts of 13/15/21 were
already fixed there — verified and noted below. Player copy: short dash "–".

## Already fixed in fix/round8-ui pt1/pt2 (owner played without them)
- [x] **R9-6 DRAW hover yellow-on-yellow** = R8-5 root cause (global `button:hover` + iOS sticky
  hover) → fixed in pt2, `.bt-tab.active:hover` pinned dark-on-lime.
- [x] **R9-17 no healing news line** — `'recovery'` events exist since slice C; pt2 added the 💪
  emoji mapping. VERIFY in this pass that News actually renders the line (item 17 check below).

## Engine pack (pt3 — checkpoint commit)
- [x] **R9-1 interest on savings**: weekly deterministic interest on a POSITIVE balance,
  `ECONOMY.savings = { apyWeekly: 0.0006 }` (~3.1%/yr, realistic for a family savings account),
  `round(fundsCents × apyWeekly)`, emitted only when ≥ 1 cent as an `income` event, NEW category
  `'interest'` ("Savings interest") — update every exhaustive WorldEventCategory switch (Money UI,
  bench zeroCats/EXPENSE_CATS... it's an INCOME category — wire into the income side). Zero RNG.
  → `src/engine/economy.ts` (savings) + `src/engine/world.ts` (resolveInterest, tick step 0a0) +
  `src/shared/protocol.ts` ('interest') + `tools/econ-bench.ts` (INCOME_CATS/zeroCats) +
  `src/components/screens/MoneyScreen.vue` (income-side Exclude) + `tests/round9.test.ts` (R9-1)
- [x] **R9-7 match-based fatigue (OWNER REDESIGN 25.07 — replaces the original base+perMatch
  draft; everything INTEGER)**: fatigue comes from MATCHES. Per kid match played: straight sets
  with NO tiebreak = 1; a 3-setter OR a tiebreak in a 2-setter = 2; +1 extra when the match had
  MORE than 2 tiebreak sets (a three-TB epic) — max 3 per match; plus a tier surcharge PER
  MATCH: local +0 / regional +1 / national +2 / itf +3 (itf EXTRAPOLATED — the tier is locked,
  flag in a comment). A set scored 7-6/6-7 is a tiebreak set. Hardest national match = 5; a
  five-match National run maxes at 25 (owner's own check). The drain applies when the run
  COMMITS (finalizeTournament), derived from the kid's THIS-WEEK match records (pure state,
  zero RNG) — so a walkover or an R9-9 skip costs nothing by construction. Update B3-family
  test pins deliberately.
  → `src/engine/world.ts` (matchDrain/tournamentRunStrain, applied in finalizeTournament) +
  `src/engine/economy.ts` (matchFatigue/tierMatchFatigue) + `tests/round9.test.ts` (R9-7) +
  `tests/condition.test.ts` (B3/B4 re-pins)
- [x] **R9-10 recovery redesign (OWNER 25.07 — replaces the restBase/restSlope/trainSlope plan
  formula ENTIRELY; the slider no longer drains condition)**: recovery comes from TIME, integer:
  +2 every week, always; on a week with NO kid match the train/rest slider adds a THRESHOLD
  bonus (rest ≥ 40 → +2, rest ≥ 25 → +1, below → +0 — the 60/40 / 75/25 / 85/15 presets; never
  interpolated); +1 extra on blackout weeks (off-season 49-51 / exams — replaces offSeasonGain);
  `condition = clamp(condition + recovery − matchDrain, 0, 100)`. The slider stays meaningful:
  money (planFactor), future skill development, and recovery pacing. Update B2-family pins
  deliberately.
  → `src/engine/world.ts` (accrueCondition/restRecoveryBonus) + `src/engine/economy.ts`
  (recoveryBase/restRecoveryBonus/blackoutBonus) + `tests/condition.test.ts` (B2 re-pins) +
  `tests/round9.test.ts` (R9-10)
- [x] **R9-14 physio conditions bonus**: `ECONOMY.physio.conditionBonusPerWeek = 2` (integer;
  owner said "1 or 2", 2 picked for visible value) added inside `accrueCondition` when
  `physioActive` (pure arithmetic; billed value finally visible).
  → `src/engine/economy.ts` (physio.conditionBonusPerWeek = 2) + `src/engine/world.ts`
  (accrueCondition) + `tests/round9.test.ts` (R9-14)
- [x] **R9-19 match-strength coupling ON (OWNER CURVE 25.07 — the flat 0.85 floor was absurd:
  "85% strength at zero")**: no penalty while condition ≥ 70 (`matchStrengthKnee`); below the
  knee, linear from 1.0 down to 0.55 (`matchStrengthFloor`) at condition 0:
  `factor = 0.55 + 0.45 × min(condition, 70) / 70`. Kid match players scale by it on the
  EVENT-scoped `seed:kidtour` stream only (main-stream invariance untouched — B1/C1 freezes must
  stay green). Regenerate affected match/tournament/wrap-up fixtures DELIBERATELY with a
  comment; golden-save LOAD corpus must stay untouched.
  → `src/engine/economy.ts` (matchStrengthKnee/Floor) + `src/engine/world.ts`
  (conditionMatchFactor, computeShadowTournament kid scaling) + `tests/round9.test.ts` (R9-19).
  NOTE: zero fixture re-pins were needed — the knee (no penalty ≥ 70) keeps every existing
  forward-sim test's kid at factor 1.0; B1/C1 + golden saves stayed green untouched.
- [x] **R9-9 skip/back at tournament week**: entering the begin flow must not be a one-way door.
  (a) TournamentFlow splash gets "← Back" (returns to the shell, nothing resolved). (b) New engine
  command `skipTournament(eventId)`: kid withdraws POST-deadline at the event week — fee stays
  committed (real-world), NO travel charge, NO shadow run, an info event "Skipped {label} – entry
  fee forfeited."; week then resolves as a normal non-playing week. Confirm dialog wired.
  → `src/engine/world.ts` (skipEvent — named skipEvent, not skipTournament: that name was taken
  by the reveal-all path; travel comes back as an explicit 'Travel refunded' income event so the
  ledger stays honest; + the withheld match-free slider recovery bonus) + `src/shared/protocol.ts`
  + `src/worker/sim.worker.ts` + `src/stores/game.ts` + `src/components/TournamentFlow.vue`
  (splash ← Back + confirmed skip) + `src/App.vue` (hidden-flow Resume banner) +
  `tests/round9.test.ts` (R9-9 incl. the 45239/9f783705 main-stream re-proof)
- [x] **R9-21a injury stop is LOUD**: `stopReason 'injury'` (slice C) currently lands as a quiet
  toast the owner missed while week-skipping (saw the withdrawal 3 weeks later). Make it a
  blocking popup (SeasonSummaryDialog pattern): injury kind, weeks out, what was auto-withdrawn +
  refund; plus an alert sfx (existing sfx framework, e.g. reuse `ooh` or a soft cue — pick what
  fits, no new assets required).
  → `src/components/InjuryStopDialog.vue` (new; 'ooh' alert on mount, kind/severity/layoff +
  auto-withdrawn entries with refund total) + `src/App.vue` (blocking dialog owns the 'injury'
  stop; toast map dropped it) + `tests/round9.test.ts` (UI wiring)

## UI pack (pt4 — checkpoint commit)
- [x] **R9-4 Sora font**: kid's name in the header + on Home, tournament names in the Season
  calendar (the white text), and the white "Season" heading → `font-family: Sora`.
  → `src/style.css` (.kid-name / .player-name / .event-tier / .season-topbar h2)
- [x] **R9-5 physio toggle OUT of Home → Money "Budget" section**: the Home condition block loses
  the physio row (its layout is broken there anyway); MoneyScreen gains a "Budget" section with
  the physio toggle + weekly cost label. (First brick of the round-7 "кошелёк-ручки" plan.)
  → `src/components/screens/MoneyScreen.vue` (Budget section) + `src/components/screens/HomeScreen.vue`
  (row removed) + `tests/injuries.test.ts` (UI-wiring re-pin)
- [x] **R9-8 this-week plan as plain text**: the train/rest pill on Home becomes unbordered plain
  text on ONE line with the current week's tournament name.
  → `src/components/screens/HomeScreen.vue` (.this-week-plan) + `src/style.css`
- [x] **R9-11 emotion win-immunity**: a Regional WIN shields the sad emotion for 1 week, a
  National win for 2 weeks (winImmunityWeeks per tier in the avatarEmotion helper); local-tier
  losses map to `serious`, never `sad`. Extend `tests/avatarEmotion.test.ts`.
  → `src/shared/avatarEmotion.ts` (WIN_IMMUNITY_WEEKS, lastTitle shield, local→serious) +
  `tests/avatarEmotion.test.ts` (R9-11 describe)
- [x] **R9-13/15 the BIG portrait reflects state**: the Home/Kid large portrait (not just the
  header crop) uses the same emotion resolver — tired below 40, injury while injured, etc. The
  full-size art exists for every stage×emotion.
  → `src/composables/kidEmotion.ts` (new, shared decision incl. tier/title resolution) wired into
  `src/App.vue` + `HomeScreen.vue` (emotion crop) + `KidScreen.vue` (full-size emotion art)
- [x] **R9-18 week-recap consistency**: WeekRecapCard appears "sometimes" (owner). Find the
  actual display condition, make it consistent: after EVERY resolved non-tournament week (incl.
  multi-week advances — show the latest), never after a tournament week (the flow covers it).
  Document the rule in a comment.
  → `src/components/screens/HomeScreen.vue`: ROOT CAUSE was the per-MOUNT dismissal ref (tab
  switches remount HomeScreen and re-showed a dismissed recap); dismissal now lives in a plain
  module-scope script block keyed career:week, and THE RULE is documented at showRecap.
- [x] **R9-21b news cue**: a soft "тилинь" (existing sfx framework — `clickSoft` family or
  similar, no new assets) + the Season-tab-style accent dot on Home when NEW news arrived since
  the player last looked at the feed.
  → `src/App.vue` (per-career lastSeenNewsId watermark, Home tab-dot, clickSoft on arrival)
- [x] **R9-17 verify**: force an injury+recovery in a test/dev run and confirm the News feed
  renders "Back on court – cleared to play." with 💪. Fix rendering if it doesn't.
  → VERIFIED: rendering was already correct – `tests/round9.test.ts` (R9-17) now forces an
  injury+recovery and pins the snapshot event + the feed's 💪 mapping/filter.
- [x] **R9-23 applause lag after the decisive point** (owner: "пауза между очком и аплодисментами,
  особенно на ×2"): game/set/match applause fires at the START of the separate
  'game-end'/'set-end'/'match-end' timeline events, but those are scheduled AFTER the point-end
  event's duration + the 0.15 trailing gap. FIX (sound-only, no timeline restructure): fire the
  cue in startEvent's 'point-end' branch off the point data (biggest cue only: match > set >
  game; keep the tiebreak-set oohApplause split + suppressEndApplause/final logic), and silence
  the later *-end STARTS.
  → `src/components/MatchViewer.vue` (startEvent rework – point-end START fires the biggest cue;
  timeline untouched, zero fixture churn). NOTE: the converted-break 'ooh' now yields to the
  game applause landing at the same instant (they used to be ~1s apart by scheduling accident).
- [x] **R9-24 long cues ignore playback speed** (owner: "на ×2 удары звучат ×2, а аплодисменты и
  take-your-seats нет — диссонанс"): playSfx gains {rate}; LONG cues only (applauseShort,
  oohApplause, applauseFinal, takeYourSeats) play at min(speed, 2) with preservesPitch where
  supported (feature-detect); seats pre-roll holds 3600/min(speed,2) ms. Short percussive cues
  stay rate 1.
  → `src/audio/sfx.ts` (playSfx {rate}, cap 2, preservesPitch feature-detect incl. webkit prefix) +
  `src/components/MatchViewer.vue` (playLong for the four long cues; seats hold 3600/min(speed,2)).
- [x] **R9-25 verify: Season this-week list shows LOST matches too?** Architect's code read says
  no wins-only filter exists (kidMatchEvent emits every revealed match unconditionally). Verify
  in the browser pass: a mid-draw LOSS must appear with the Watch icon; note the verdict here.
  → VERIFIED LIVE (dev build, career zoe-j24k, W4 Local Open, QF exit): "Quarterfinal: Z. Sanches
  lost to D. Lindqvist 3-6 6-7" rendered in "This week's tournament" WITH the Watch icon –
  losses ARE included, no wins-only filter exists. Likely perception: the list is strictly
  current-week – after advancing, last week's matches leave the card (they stay in Home News).

## Stage/art pack (pt5 — checkpoint commit)
- [x] **R9-16 portrait stages by age**: stage resolver — `jun` < 12, `young` 12-16, `teen` 17-22
  (owner: young already from 11-12, teen from 17; adult/milf later). START_AGE 14 ⇒ the game now
  OPENS on `young-*` art (the jun-* placeholder era ends). Wire the resolver into the header crop
  picker AND the big portraits. Cut the missing 256px header crops for `young-*` (and `teen-*`
  while at it) — norm/happy/sad/serious/tired/injury — from the full-size art, same
  sips→256→cwebp q82 convention as pt2 (framing consistent with the jun set). Onboarding's jun
  "first time on court" frame stays jun BY DESIGN (narrative flashback).
  ALSO (owner icon pair, 25.07): the bottom-bar KID tab glyph grows up with her – kid-girl.svg
  while ageYears < 18, woman.svg from 18 (man.svg reserved for the future boys' tour); same
  CSS-mask tinting path, verified rendering live at W212/age 18.
  → `src/shared/avatarEmotion.ts` (portraitStage: jun <12 / young 12-16 / teen 17-22 / adult
  beyond) + `src/composables/kidEmotion.ts` (stage + cropUrl/portraitUrl; adult CROPS not cut
  yet – crop surfaces clamp to teen until that content lands, full-size adult art already
  resolves) + `src/App.vue` (header crop + kid-tab icon swap) + `HomeScreen.vue` +
  `KidScreen.vue` + `TournamentFlow.vue` (splash/finale art per stage) +
  `public/avatars/{young,teen}-{norm,happy,sad,serious,tired,injury}.webp` (12 new 256px crops,
  sips crop → 256 → cwebp q82, face-framing matched to the jun set by eye; teen source art
  names its injury painting "injured" – the CROP ships as teen-injury.webp so the URL scheme
  stays uniform) + `tests/round9.test.ts` (pt5 describe).

## Answered / routed elsewhere (not in this branch)
- **R9-2 zero-points fields in week-1 Regionals/Nationals** → real issue (AI entrant selection has
  no points gate; year-1 everyone is 0; real tours run early season on LAST year's ranking) →
  "cohort pre-history" investigation slice: seed AI with prior-season results at createWorld.
  Multi-age fields per se are realistic (U14 plays U16/U18) — the zero-point paradox is the bug.
- **R9-3 injury-horizon bench** → small bench follow-up slice: injuries/season + weeks-lost per
  profile per horizon (pairs with the deferred gate-aware policy work).
- **R9-12 morale second bar** → deferred until the morale STAT exists (Phase 6); the interim is
  R9-11's win-immunity. Backlog.
- **R9-19b pre-match medical check at ultra-low condition** (owner idea, good): doctor's veto =
  HARD block below ~condition 15 — the parent can push through tiredness, but medicine can say
  no. Design note → next availability follow-up (fits the soft/hard gate philosophy).
- **R9-20 nothing to do at 300 pts (wk 34)** → Season Planner is NEXT (practices + vacations fill
  the calendar); plus a tier-calendar density design pass (National 4/yr is too sparse for a
  post-Regional kid; candidates: more Nationals in H2, invitationals, earlier ITF unlock).
- **R9-22 vacations** → not built yet; Season Planner slice starts after this branch merges
  (spec final: docs/specs/season-planner.md).
