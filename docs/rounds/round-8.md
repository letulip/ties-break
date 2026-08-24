# Round 8 — owner playtest observations on merged main (25.07.2026)

Source: owner's live run on main @ `9b47b7c` (post ranking-gate + condition/gate merge).
Status legend: [ ] open · [x] done · (triage) = size/route.

> **STATUS, re-audited 09.08 (backlog #88).** Five boxes were open; three of them had shipped under
> other names and are now ticked – **R8-9** as the cohort **pre-history** (Package L), **R8-7b** as
> the **ladder floor** (08.08), **R8-10** as the **coach-as-choice** slice plus the **split bill**
> (06.08). **R8-1 is genuinely untouched since 25.07.** **R8-3 is under check in code this wave**
> (`wave/round15`) and is deliberately NOT ticked here. The README row that said "all shipped" was
> wrong in both directions and is corrected.

## Bugs / fixes

- [x] **R8-5. DRAW window: selected round tab is fully yellow — label invisible.** Contrast bug:
  selected segment needs dark text on the accent (as elsewhere: dark-on-lime). (small CSS)
  → `src/style.css` (`.bt-tab.active` dark-on-lime + hover pin against the global accent-hover)
- [x] **R8-9. Standings inclusion check.** Owner: a girl won a National (~120 pts) yet is absent
  from the top-10 while #10 sits at 135. LIKELY NOT A BUG: standings are the rolling-52-week
  BEST-6 SUM, so one 120-pt win < 135 accumulated across events — the winner should sit just
  outside the top-10. VERIFY: she appears at her correct rank (#11+) and is not dropped from the
  table entirely; audit how the standings list is built (cohort filter / windowing) on ALL tiers.
  (investigation + test)
  → **INVESTIGATED AND FIXED, under a different name: the cohort PRE-HISTORY (Package L).** The
  investigation found a real defect underneath the best-6 explanation – in year 1 every AI started at
  zero points, so the whole table was degenerate and a National champion could be missing from a
  top-10 that was really a 199-way tie. `src/engine/season/prehistory.ts` names this item as one of
  its two symptoms (with R9-2) and writes one synthetic season of AI results at weeks [-51, -1], so a
  fresh career opens on a real ranking table. `tests/season/prehistory.test.ts`;
  `docs/specs/ladder-up-impl.md` §Part A.
- [x] **R8-7a. Entered, then outgrown → money stuck.** An entry paid before outgrowing a tier is
  neither played nor refunded. Real-world: entries close at a deadline; ineligible-at-close
  players are removed and refunded. FIX: on the tick where the kid's points cross OUT of a tier's
  band, auto-withdraw+refund her still-pending entries for that tier (mirror slice-C's
  injury auto-withdraw; pure state, no draws). (small engine fix + test)
  → `src/engine/world.ts` + `tests/outgrownWithdraw.test.ts` (round8-ui pt1)
  → ⚠ **SUPERSEDED 05.08 – see `docs/specs/honouring-the-entry-2026-08.md`.** The real-world rule is
  right and was applied to the wrong moment: a list closes with the entrants it accepted, and
  acceptance is not revoked because her ranking improved after she entered. The owner played into it
  at twenty-two and the game cancelled a W50 she had already committed to. An entry already taken is
  now honoured on BOTH sides of the deadline; the rung closing governs only what she may enter next.
- [x] **R8-2. Music: pause when the phone screen locks / tab hidden, resume on return.** Page
  Visibility API (`visibilitychange` → pause/resume both menu + match music). (small)
  → `src/audio/music.ts` (resume only if audible when hidden; mute + duck keep winning)
- [x] **R8-6a. Avatar stuck sad after a runner-up finish.** 2nd place is a GOOD result — should
  not map to sad at all (or only for a lost final momentarily). Review result→emotion mapping.
  (small)
  → `src/shared/avatarEmotion.ts` (lost final → serious) + `src/App.vue` wiring

## UI / UX polish

- [x] **R8-4. "This week's tournament" card: show the score on the bottom line.** (small)
  → `src/components/screens/HomeScreen.vue` (latest match score off this week's match events)
- [x] **R8-8. Home: highlight a newly-UNLOCKED tier (National etc.) in accent yellow as soon as
  it becomes eligible** (currently grey until first entry); after participation, append the
  result to the same row. Makes the ladder progress feel earned. (small)
  → `src/components/screens/HomeScreen.vue` + `src/style.css` (incl. the owner-25.07 outgrown
  outline state and the soft-amber lock-pill labels on the Season calendar)
- [x] **R8-6b. Avatar emotion decay:** sad after a loss lasts only until the next week's tick,
  then norm/serious depending on current condition. (small, pairs with R8-3)
  → `src/shared/avatarEmotion.ts` (+ `tests/avatarEmotion.test.ts`; injury/tired/serious/norm idle)
- [x] **R8-3. Avatar wiring:** the round icon only ever shows the `norm` variant when age
  changes; the square avatar on Home could be slightly bigger and reflect CURRENT state
  (emotion by last result + condition). Ties into the portrait-by-age TODO
  (stage(ageYears) × emotion). (medium, one clean slice with R8-6)
  → ~~**UNDER CHECK IN CODE, wave `round15`.**~~ Named as out of scope by
  `docs/specs/round8-ui-fixes.md` when the round shipped, and no trace since. Another agent is
  reading the header/round-icon path against the current build this wave; this box stays open until
  that check reports, because "no tag in the source" is not the same as "not built" – see R12-17b.
  → ⚠ **THE CHECK REPORTED, AND THIS BOX WAS NEVER CLOSED OFF** (found by the 13.08 audit,
  round-18 item 6). The verdict is in `docs/specs/round15-triage.md:221`, written the same day:
  "**R8-1 (in-tournament player card) and R8-3 (avatar `norm` variant) are genuinely untouched since
  25.07**". So the answer has existed for four days in a different file while this one still says
  "under check". **R8-3 is OPEN, not pending** – and it is the second-oldest open item in the ledger
  after R8-1.
  → ✅ **CLOSED BY THE 24.08 RE-VERIFICATION, and the 13.08 verdict above was reading only half of
  the item.** Both halves are answered, one by a ruling and one by a build.
  **(a) The header's `norm`-only icon is the owner's own ruling of 27.07**, two days after this item
  was filed: «верхняя круглая аватарка в хедере вообще не должна меняться эмоционально, там всегда
  norm для возраста стоит». It is not a defect, and it now has a path an emotion cannot travel –
  `src/composables/headerAvatar.ts` takes an age and nothing else, pinned by
  `tests/round11-followups.test.ts` (F45-1). Anyone re-opening this is asking to overturn the ruling.
  **(b) Home's portrait DOES read her current state** – `src/composables/kidEmotion.ts` renders the
  emotion the ENGINE decides in `snapshot.diary.facts` (R9-13/15, then Diary-1's D2 full-bleed
  painting), and all five portrait bands × seven emotions are cut under `public/avatars/`.
  What is genuinely left is neither half of R8-3 but the portrait ART ORDER for the older ages, which
  is the owner's to place: `docs/backlog/college-the-remainder.md` #4.

- [x] **W-L in the Stats header (R6 debt).** `seasonWins`/`seasonLosses` surfaced on the
  Snapshot; "W–L" tile beside rank/points.
  → `src/shared/protocol.ts` + `src/engine/world.ts` + `src/components/screens/StatsScreen.vue`
  (round8-ui pt1)

## Design / systems (route to slices)

- [ ] **R8-1. In-tournament player card.** Between matches of one tournament, show her card —
  params, condition, fatigue — so the player can manage load mid-event (reference game does
  this). Route: tournament-experience UX slice. (medium)
  → **GENUINELY OPEN, untouched since 25.07.** The only two mentions in the repo are the two that
  put it OUT of scope: `docs/specs/round8-ui-fixes.md` §"OUT of scope here", and
  `docs/specs/coach-retainer-2026-08.md`'s note that a coach who "adjusts between matches" is the
  obvious next thought and is not built. Nothing in `src/` reads on it. This is the oldest open item
  in the ledger.
- [x] **R8-7b. Ladder pacing after outgrowing local.** Owner outgrew local by week ~20; calendar
  offers Local 26 / Regional 13 / National 4 per year → post-local only ~17 eligible events/yr →
  long "next week" stretches. Ideas: friendly/practice matches on empty weeks (beyond training),
  possibly more regional density or invitationals. Needs a design pass on the whole tier
  calendar in this light ("как в море тенниса это выглядит"). (design → future slice)
  → **SHIPPED 08.08, under a different name: the LADDER FLOOR** (`docs/specs/ladder-floor-2026-08.md`,
  status SHIPPED). The design pass he asked for happened as round 14's group A, and it found the
  same defect from the other end: the calendar was never thin, the window was. The lower bound stops
  refusing and becomes a sorting key – on his own save the weeks with nothing enterable go 27 of 46
  → 6. Same fix as R12-2/13/17. ⚠ It has a measured cost to the climb (that spec's §3), accepted by
  the owner; the answer to the cost is the coach-as-scheduler pillar
  (`docs/specs/what-a-coach-is-for.md`).
- [x] **R8-10. Coach spend must become visible and controllable** (the "video session $400–700"
  line still reads absurd). Owner data point: 25k · hired coach ended week 48 with $9,629 despite
  28 weeks with no local access; season income exactly 300×48 = $14,400 (no gift valves fired).
  PROPOSAL (owner): a post-match REVIEW POPUP — what was reviewed, what it cost, what it gives —
  plus profile knobs "after which events to review + how thoroughly", each with a visible effect
  on her (e.g. a % improvement). Route: this IS the coach-as-choice slice (tiers + periodic
  sessions + review lever); the popup + knobs are its UX spec. (major → next economy slice)
  → **THE ROUTE THIS ITEM NAMED SHIPPED.** The coach-as-choice slice is real: rungs, a roster and a
  hire/fire door (`docs/specs/coach-tiers.md`, `src/components/screens/CoachMarketScreen.vue`,
  `src/engine/world/coachMarket.ts`). The VISIBLE half then shipped twice over –
  `docs/specs/split-the-bill-2026-08.md` (06.08) splits the weekly charge into a coach line and a
  court line, after the owner's «списывается какая-то рандомная сумма и как будто не за тренера»;
  `docs/specs/coach-retainer-2026-08.md` (08.08) makes the retainer unconditional and separates
  travel from it; `docs/specs/money-decomposition-2026-08.md` carries the breakdown.
  ⚠ **WHAT DID NOT SHIP, and a reader must see it:** the post-match REVIEW POPUP and the "after
  which events, how thoroughly" knobs. `split-the-bill`'s §7 measures the facility-as-a-choice option
  and says plainly it is **not built**. That design has since been **superseded by the owner's
  rulings of 09.08** (rulings 3 and 4, `docs/specs/round15-triage.md`): the per-day training controls
  come first and the coach becomes the person who works them. Tracked from there, not here.

## Answers recorded

- **R8-9 explanation:** best-6 windowed sum, one National win (120) legitimately trails an
  accumulated 135 — but the inclusion audit stays open above.
- **R8-7 real-world:** entry lists close at the deadline; players out of band at close are
  removed with a refund — hence the R8-7a fix.
