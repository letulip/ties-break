# Round 5 – owner playtest to W53 (37 items)

Source: `docs/decisions.md` § "Round 5 (owner playtest to W53, 37 items)", 2026-07-23/24, plus the
branch specs it points at (`docs/specs/round5-bugs.md`, `round5-brand.md`, `round5-season.md`) and
the two follow-up commits that shipped alongside them. The "37 items" count in the digest's own
heading is reconstructed here as: 12 bug-list items + 10 season/UX items + 5 brand items + 2
life-arc/logo items + 7 backlog additions + 1 fairness principle = 37. Titles are Claude's English
summaries of the shipped/deferred scope – round 5, like round 4, doesn't have a verbatim
owner-numbered transcript in the repo (only round 3's Q&A got that treatment).

**Foundational note**: the foreground tournament-reveal architecture (schema v8,
`world.pendingTournament`, "reveal, don't re-run") landed just before this round
(`docs/specs/tournament-experience.md`) and is what several season/UX items below (splash, full
draw, finale) are built on top of. It isn't counted as one of the 37 – it wasn't a numbered playtest
item, it's the infrastructure the playtest items assume.

## Bug list (12 items) – `fix/round5-bugs`, `docs/specs/round5-bugs.md`

- [x] **Ranking transparency** ("points bug" was best-6 opacity, not math): summary events show the
      effective ranking delta; Kid screen gets a "Counting results (best 6)" list
      → `world.ts` `finalizeTournament`, `KidScreen.vue`. Table extracted to
      `CountingResultsTable.vue` in round 6 for reuse (see round-6.md).
- [x] **W1 "Entries closed" on a fresh career** – first-season events floored at week 3
      → `buildSeason`, `MIN_FIRST_EVENT_WEEK`.
- [x] **Condition bar → 10 segments, red→yellow→green** gradient
      → `HomeScreen.vue`; value itself is still a static 8/10 placeholder pending Phase 4.
- [x] **Remove Restart from MatchViewer live mode** (replay keeps "Watch again")
      → `MatchViewer.vue`.
- [x] **Sound toggle → explicit two-state switch** (not a bare button)
      → `.sound-switch` in `style.css`, reused for the round-6 Music switch.
- [x] **Sound root cause + app-wide init**: `initSfx()` was wired only to viewer Play/Restart, but
      matches autoplay – a delegated document click listener now unlocks audio on the first gesture
      anywhere
      → `src/audio/sfx.ts` `installGlobalSfx()`.
- [x] **Standings ellipsis row** between the top-10 block and the around-kid block
      → `computeStandings`, `.standings-gap`.
- [x] **News match rows** – two-line "V. Martin vs S. Everts" / kid-perspective score, right-aligned
      "Watch"
      → `HomeScreen.vue`.
- [x] **Post-match stats: short names + ranks** under each player's name
      → `MatchViewer.vue` `rankA`/`rankB` props, `TournamentFlow.vue`.
- [x] **Class-flavored expenses** (working ×0.8 / wealthy ×1.25, flavor list swaps) – applied after
      the draw so RNG discipline holds
      → `resolveBaseCosts`. Full economy rework (sponsors, grants, insurance) explicitly stays
      deferred → **Phase 5** (decisions.md: "full economy rework stays Phase 5").
- [x] **README softened** – neutral reference-game hint, no named title / "anti-version" wording
      → `README.md`.
- [x] **jpeg-source preference in `optimize-art.mjs`** (future-proofing; no jpegs existed yet to
      rename) **+ Kid portrait width/height + `decoding="async"`** (kills late-decode layout shift;
      root cause fixed properly in round 6's polish pass – see round-6.md)
      → `scripts/optimize-art.mjs`, `KidScreen.vue`.

## Season/UX (10 items) – `feat/round5-season-ux`, `docs/specs/round5-season.md`

- [x] **Real calendar dates** (`weekRange`/`weekYear`, fixed epoch Mon Jan 6 2031)
      → `src/shared/dates.ts`, threaded through header/calendar/tournament flow.
- [x] **Off-season shaping** – last 3 weeks of every season year carry no events
      → `src/engine/season/calendar.ts` `isOffSeasonWeek`.
- [x] **Visible training/off-season rows** in the Season calendar (not just eventful weeks)
      → `SeasonScreen.vue` `calendarRows`.
- [x] **Calendar/Standings sub-tabs** (segmented control)
      → shipped this round, **removed again in round 6** – standings moved to a dedicated Stats
      tab instead. See round-6.md; this entry stays checked because it *was* built and shipped as
      asked, it just didn't survive as the final shape.
- [x] **Full-draw view** of every revealed round (winner-first scores, AI-vs-AI shown without a
      scoreline)
      → `PendingView.fullBracket`, `TournamentFlow.vue`.
- [x] **Pre-tournament splash** (serious portrait, tier/surface/draw-size/dates, "Begin →")
      → `TournamentFlow.vue` `'splash'` phase. Not to be confused with round 6's app-launch splash
      screen (`SplashScreen.vue`) – different screen, same word.
- [x] **Tour guide overlay** – "?" button opens the full `TIERS` table
      → `TierGuide.vue`.
- [x] **New-tournament marker** – accent dot on the Season tab + "New events on the calendar" event
      → `App.vue` `seasonHasNew`.
- [x] **Week recap card** (light) – shown after a non-tournament week resolves
      → `WeekRecapCard.vue`.
- [x] **Onboarding coach-mark tour** (light) – 4-step tooltip walkthrough after a career's first
      snapshot ever
      → `OnboardingTour.vue`; still targets Home/Season/Kid/Next-week, all still valid tab ids after
      round 6's tab-bar reorg (checked again in round-6.md).

## Brand identity (5 items) – `feat/round5-brand`, `docs/specs/round5-brand.md`

- [x] **Typography** – Sora (headings) + Manrope (body), self-hosted woff2, latin subset
      → `style.css` `@font-face`.
- [x] **PWA identity = the girl, not the ball** – install icons/favicon generated from the jun
      avatar face crop
      → `scripts/gen-icons.mjs`. Unaffected by round 6's bottom-tab SVG icon swap (different asset
      set, different purpose – see round-6.md).
- [x] **Onboarding finale portrait** (jun-norm, 140×140, above the summary table)
      → `OnboardingWizard.vue` step 7.
- [x] **Header avatar emotions** – reflects the kid's most recent tournament result
      (happy/sad/norm)
      → `App.vue` `lastKidMatchWon`.
- [x] **Silver finalist art** – attempted programmatic gold→silver desaturation, came out patchy,
      shipped a fallback instead (serious portrait + metallic-gradient card frame + 🥈)
      → `TournamentFlow.vue`; a dedicated hand-drawn silver-finalist art asset is an open
      recommendation for the owner, not scheduled to a phase.

## Life-arc art + owner logo (2 items) – commit `9817bab`

- [x] **Full life-arc art set** – 35 owner jpgs (jun/teen/young/adult/milf × emotions +
      bride/funeral/graduated/retired/farewell) converted to clean-named webp
      → `scripts/optimize-art.mjs` life-arc phase, `public/images/fem-euro-brunnet/`.
- [x] **Owner logo as app identity** – `gen-icons.mjs` re-sourced from `art-src/logo-lucia-app.png`
      instead of the avatar face crop
      → PWA install icons only. Round 6 introduces a *separate* logo asset set
      (`art-src/logo-tb-*.png`, wordmark, not the circular face mark) for the new app-launch splash
      screen – same owner, different files, see round-6.md.

## Backlog additions (7 items) – from the W53 balance-snapshot discussion

**Re-audited 09.08 (backlog #88): three of these seven shipped and were never ticked.** Phase 5
arrived and took them; the boxes stayed as the discussion left them in July.

- [ ] **Player-uuid friendly exchange** (offline PvP via a shareable player id)
      → deferred, **Phase 6 backlog**. Verified 09.08: no trace in `src/`. Still open.
- [x] **Vacations as a class differentiator** affecting recovery
      → **SHIPPED** as the season planner's vacation ladder – `ECONOMY.vacation.packages` in
      `src/engine/economy.ts`, six rungs from a free staycation to a $4,000–7,000 elite recovery
      programme, quoted through `vacationPriceCents` × the wealth corridor
      (`docs/specs/econ-wealth-corridor.md`). Only the top two rungs carry a `buffFactor` (resort
      0.9, elite 0.85), and that buff is a post-draw multiply on the injury threshold in
      `src/engine/world/injury.ts` – so **what a family can afford decides how much recovery a
      holiday buys**, which is the item.
      ⚠ ONE HALF IS DELIBERATELY NOT CLASS-SCALED: the condition GAIN is flat for every family
      («the same package restores the same condition for every family»), pinned in
      `tests/planner.test.ts` P3. The corridor prices the holiday; it never scales the benefit.
- [ ] **Relationship/trust UI**
      → deferred, **Phase 6**. Verified 09.08: no trace in `src/`. Still open. (The family diary,
      `docs/specs/family-diary.md`, is the nearest shipped thing and is not this – it reports, it
      does not model a relationship.)
- [ ] **Attend-vs-watch-on-TV parenting mechanic** – shouts only work in person
      ("кричите в телевизор сколько хотите – её там не слышно")
      → deferred, **Phase 6**. Verified 09.08: no trace in `src/`. Still open.
- [x] **Equipment wear line-items**
      → **SHIPPED** – `src/engine/equipment.ts`: each of the three lines (strings, frame, shoes)
      carries a CONDITION that decays with the weeks since its purchase and is restored by buying,
      `kitWearAt` derives it from `kit.sinceWeek` with nothing persisted, and the wear reaches the
      injury threshold through `kitInjuryFactor` (`src/engine/world/injury.ts`). The bills are
      per-line. ⚠ AND ITS OWN LIMIT IS RECORDED: round 14's item 13 answers that fresh kit is
      exactly neutral – wear only ever subtracts, so gear stops her getting worse rather than making
      her better. Whether that wants an upside is the owner's call, not a defect.
- [ ] **Academy invitation** (~$55k/yr) as the wealthy-track money sink
      → **STILL OPEN, and the academy that DID ship goes the other way.**
      `src/engine/academy.ts` / `docs/specs/academy-support.md` is a need-weighted SCHOLARSHIP –
      «не проигрывающего, а малоимущего, но талантливого» – whose need input is working 1, middle
      0.6, **wealthy 0**. So the wealthy family's $55k/yr money sink does not exist; a poor family's
      subsidy does. Deliberately not ticked: the sibling box below is the half that shipped.
- [x] **Scholarship-chance event** for working/middle after a strong season, with a hard family
      choice
      → **SHIPPED** as **the academy scholarship**, schema **v21** – `src/engine/academy.ts`,
      `docs/specs/academy-support.md`, reviewed once a year at the season boundary on the rank she
      carries in, weighted by need (working/middle only) and by the scout's read of her ceiling,
      and requiring that she actually competed. It pays a share of every trip and one kit grant a
      year, and it announces itself ("An academy has taken her on…", `reviewAcademy` in
      `src/engine/world.ts`). Measured: the 8k working preset survives 18/120 → **44/120** careers.
      ⚠ THE "HARD FAMILY CHOICE" HALF DID NOT SHIP. It arrives as a reviewed RATE, not a decision –
      the owner's own stated preference («регулировать размер помощи – вот это мне кажется лучше»),
      recorded here so the difference between what was asked and what was built stays visible.

## Fairness principle (1 item)

- [x] **Never rig outcomes against the player** (brand-level principle – the reference game's most
      damaging reviews are about pay-to-win rubber-banding)
      → accepted as a standing principle (`docs/decisions.md`), enforced by design: deterministic
      seeded sim, no hidden difficulty adjustment. Not a feature with a completion date – it's a
      constraint every subsequent round is expected to keep honoring.
