# Round 13 — owner's first Diary-1 playtest, quick pass (8 items, 28.07.2026)

One branch (`fix/r13-quick`), one commit, TDD throughout: `tests/round13.test.ts` carries the new
pins, and every older pin a fix re-aimed names this round at the spot it moved. Player copy stays
English, short dash "–", no Cyrillic; the diary honesty discipline (a line may assert nothing the
facts do not carry) governs every copy change. The frozen MAIN capture (41550 / `e6b0c709`) did not
move — nothing here touches the weekly draw sequence.

The numbering has holes on purpose: R13-6/R13-9 were answered in conversation, and the economy half
of R13-7 (the deeper "how does an 8k family survive at all" question — donations, valves) is
deliberately NOT this branch; it goes to the economy wave.

---

- [x] **R13-1 middle income 300 → 425.** The owner's SECOND ask at "400-450" (wealthy moved to 750
  in round 12, middle never did, and his playtest burned the whole 25k inside one season). 425 is
  the middle of his range — `ECONOMY.parentIncomeCents.middle` in `src/engine/economy.ts`, comment
  alongside the wealthy re-base it mirrors. The round-7 burn-band calibration
  (`tests/economy.test.ts`) measures season 0 and broke as predicted; RE-PINNED DELIBERATELY with
  the mechanism in the comment: income is not burn, but the band is income-shaped — +$125/wk is
  exactly +$6,500 over the 52 measured weeks while the spend side stayed put, so the whole
  distribution translated down by the delta (measured batch mean $11.2k → $4,701, every-seed spread
  $3,142–$5,953; `BANDS.middle` [9k, 14k] → [3k, 6.5k]). The working-vs-middle ordering test still
  holds by measurement (gap narrowed to ~$1k — noted in the test for the next raise).
  `npm run bench:econ`, 30 seeds/preset, before → after:
  - 25k · middle · self-coached, 14→16: survived **25/30 → 30/30** (median week-to-red 89 → none
    goes red at all); 14→18: survived **8/30 → 22/30** (median week-to-red 114.5 → 153.5, earliest
    77 → 130).
  - 25k · middle · hired coach, 14→16: survived **0/30 → 8/30** (median week-to-red 57.5 → 63.5);
    14→18: survived **0/30 → 0/30**, but mean end funds −$36.7k → −$12.8k. The hired-coach hole is
    smaller, not closed — that is the economy wave's problem (prize money / valves), not this
    knob's.
  - Working and wealthy presets: byte-identical to the baseline run (the knob is per-background).
- [x] **R13-2 the good-loss line fired on a first-round exit.** Mechanism VERIFIED and reproduced
  (`tests/round13.test.ts`, "THE MECHANISM"): rank is RELATIVE — she climbs on a zero-point week
  when a rival's row decays out of the 52-week ranking window (week 53 → 54, kid rank 2 → 1 with
  zero new kid rows). The softener and the diary climb lines are now licensed by
  (lost AND rankClimbed AND **runPointsThisWeek > 0**): since wave B's first-round zero,
  `finalizeTournament` writes a kid result row only when points > 0, so "> 0" is exactly "she WON
  matches this week". New fact `runPointsThisWeek` on `DiaryFacts`/`DiaryWorldView` (derived in
  `toSnapshot` off the results ledger — no schema bump, zero draws); `avatarEmotion` gains the
  matching optional input, and an absent field means NO softening (a climb that cannot be shown to
  be earned never soothes). R1 exit + passive climb → `sad`, no climb line; the rank arrow on the
  player card still shows the movement — only her face and the diary stopped crediting her for it.
  Re-aimed pins: the `rankClimbed` softener suite + honesty sweep in `tests/diary.test.ts` (sweep
  gained the earned/passive dimension; `claimViolation` reads the climb claim as "EARNED climb").
- [x] **R13-3 the Fit chip left Home's condition row.** HOME ONLY — the chip idiom survives where
  it still earns its place (the Season screen's red layoff plaques, pinned by round12-view). The
  squares + the D1 note carry the state: injured / exams / off-season already speak through the
  engine-licensed note ("Out with the ankle soreness – 2 weeks to go." names the kind and the
  clock). The ONE thing only the chip knew — the practice-strain warning — folded into the note
  area as its own amber line (`.condition-note.warn`), read off the same `practiceCaution`
  predicate the planner sheet asks, so the warning and the booking sheet still cannot disagree.
  Dead CSS retired: `.avail-chip` green/grey/amber tones (red is the one surviving consumer).
  Re-aimed pins: `tests/injuries.test.ts` ("HomeScreen binds the injured chip…" → the D1-note
  guarantee), `tests/planner.test.ts` (chip wording → note wording; assertion unchanged).
- [x] **R13-4 the runner-up gets her own words.** The lostFinal photo pool grew 2 → 5 lines
  ("Runner-up. She pushed the final all the way." and quiet-proud variants, `src/engine/diary.ts`),
  and while that pool is non-empty a lost final selects ONLY from it: the climb lines now carry
  `!f.lostFinal` (they stay for the QF/SF exits that still climbed), and the plain softened-loss
  line already excluded finals. Honesty pin in `tests/round13.test.ts`: a lost final that ALSO
  climbed with real points still licenses nothing but runner-up lines.
- [x] **R13-5 the practice week no longer skips on one click.** The sticky bar's primary button on
  a booked-practice week used to bare-tick the week (the friendly resolved silently inside — felt
  like a skip). Both bar buttons now route through one `playWeek` handler in `App.vue`; on a
  practice week it advances and then opens the EXISTING PracticeFlow overlay (R10-12's live watch
  path, exactly what Season's "Watch it live" does) on the resolved friendly — VS card, watch or
  skip to result. No new flow was built. If the advance stops short (injury cancels + refunds the
  booking), nothing opens and the stop's own dialog explains, same as the Season path. The
  weekAhead label ("🎾 Practice match ▶") already said what the week holds and is unchanged.
- [x] **R13-7a the FREE home-rest package books at negative funds.** The bare `funds >= price`
  refused the $0 staycation the moment funds went red (−$1 < $0) — exactly when it is the one thing
  a broke family can still book. Predicate fixed in both mirrors: `bookVacation` in
  `src/engine/world.ts` (`priceCents > 0 && funds < price`) and the planner sheet's `affordable`
  (`priceCents === 0 || …`). Tests at negative funds: staycation books (nothing charged), a paid
  package still throws. NOT touched, deliberately: `recommendVacationPackage`'s prudence-budget
  null at a negative cap is pinned as designed behavior (`tests/planner.test.ts`) — the
  recommendation pill may stay dark in the red; the Book button no longer does. The deeper 8k
  economy question (donations/valves) is NOT this branch — it goes to the economy wave.
- [x] **R13-8 leaving a tournament overlay no longer strands the resume in a banner.** The paused
  state owns the primary button now: `useWeekAhead` answers `snapshot.pending` FIRST (label stays
  "🏆 Play {tier} ▶" until the run resolves — the owner's ask), and `playWeek` re-opens the overlay
  in that state instead of ticking (the engine refuses to tick past a pending reveal anyway, which
  used to make that click a silent no-op — including the ▶▶4 button, which routes through the same
  guard now). The resume banner is DROPPED on Home (it duplicated the button — the complaint) and
  kept on every other tab, where it remains the only resume affordance; the R9-9a "no tab can
  strand the career" pin still holds as written.
- [x] **R13-10 quiet weeks say more.** «Там же тоже жизнь продолжается»: the ordinary-week photo
  pool grew 3 → 12 spoken lines (school, kitchen, bus, phone, homework, weather — domestic
  one-liners licensed by the quiet-week facts alone, asserting nothing about her tennis or body),
  and the silences went from 3-in-6 to 4-in-16: an ordinary week now speaks roughly three times in
  four and stays quiet the fourth. Silence stays possible and meaningful — the pin asserts both the
  exact 1-in-4 pool ratio and, over a 400-week deterministic run, that silence still happens. Every
  new line passes the existing honesty sweep and copy discipline (short dash, no Cyrillic).

## Found while fixing, not fixed here

- The hired-coach 25k profile still cannot survive a FULL playing career this side of prize money
  (bench at 425/wk: 8/30 to age 16, 0/30 to age 18). Known shape — economy wave.
- `skipEvent`'s recovery under-pay note (world.ts, pre-existing) still stands — tuning call, not a
  merge call.
