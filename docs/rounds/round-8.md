# Round 8 — owner playtest observations on merged main (25.07.2026)

Source: owner's live run on main @ `9b47b7c` (post ranking-gate + condition/gate merge).
Status legend: [ ] open · [x] done · (triage) = size/route.

## Bugs / fixes

- [x] **R8-5. DRAW window: selected round tab is fully yellow — label invisible.** Contrast bug:
  selected segment needs dark text on the accent (as elsewhere: dark-on-lime). (small CSS)
  → `src/style.css` (`.bt-tab.active` dark-on-lime + hover pin against the global accent-hover)
- [ ] **R8-9. Standings inclusion check.** Owner: a girl won a National (~120 pts) yet is absent
  from the top-10 while #10 sits at 135. LIKELY NOT A BUG: standings are the rolling-52-week
  BEST-6 SUM, so one 120-pt win < 135 accumulated across events — the winner should sit just
  outside the top-10. VERIFY: she appears at her correct rank (#11+) and is not dropped from the
  table entirely; audit how the standings list is built (cohort filter / windowing) on ALL tiers.
  (investigation + test)
- [x] **R8-7a. Entered, then outgrown → money stuck.** An entry paid before outgrowing a tier is
  neither played nor refunded. Real-world: entries close at a deadline; ineligible-at-close
  players are removed and refunded. FIX: on the tick where the kid's points cross OUT of a tier's
  band, auto-withdraw+refund her still-pending entries for that tier (mirror slice-C's
  injury auto-withdraw; pure state, no draws). (small engine fix + test)
  → `src/engine/world.ts` + `tests/outgrownWithdraw.test.ts` (round8-ui pt1)
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
- [ ] **R8-3. Avatar wiring:** the round icon only ever shows the `norm` variant when age
  changes; the square avatar on Home could be slightly bigger and reflect CURRENT state
  (emotion by last result + condition). Ties into the portrait-by-age TODO
  (stage(ageYears) × emotion). (medium, one clean slice with R8-6)

- [x] **W-L in the Stats header (R6 debt).** `seasonWins`/`seasonLosses` surfaced on the
  Snapshot; "W–L" tile beside rank/points.
  → `src/shared/protocol.ts` + `src/engine/world.ts` + `src/components/screens/StatsScreen.vue`
  (round8-ui pt1)

## Design / systems (route to slices)

- [ ] **R8-1. In-tournament player card.** Between matches of one tournament, show her card —
  params, condition, fatigue — so the player can manage load mid-event (reference game does
  this). Route: tournament-experience UX slice. (medium)
- [ ] **R8-7b. Ladder pacing after outgrowing local.** Owner outgrew local by week ~20; calendar
  offers Local 26 / Regional 13 / National 4 per year → post-local only ~17 eligible events/yr →
  long "next week" stretches. Ideas: friendly/practice matches on empty weeks (beyond training),
  possibly more regional density or invitationals. Needs a design pass on the whole tier
  calendar in this light ("как в море тенниса это выглядит"). (design → future slice)
- [ ] **R8-10. Coach spend must become visible and controllable** (the "video session $400–700"
  line still reads absurd). Owner data point: 25k · hired coach ended week 48 with $9,629 despite
  28 weeks with no local access; season income exactly 300×48 = $14,400 (no gift valves fired).
  PROPOSAL (owner): a post-match REVIEW POPUP — what was reviewed, what it cost, what it gives —
  plus profile knobs "after which events to review + how thoroughly", each with a visible effect
  on her (e.g. a % improvement). Route: this IS the coach-as-choice slice (tiers + periodic
  sessions + review lever); the popup + knobs are its UX spec. (major → next economy slice)

## Answers recorded

- **R8-9 explanation:** best-6 windowed sum, one National win (120) legitimately trails an
  accumulated 135 — but the inclusion audit stays open above.
- **R8-7 real-world:** entry lists close at the deadline; players out of band at close are
  removed with a refund — hence the R8-7a fix.
