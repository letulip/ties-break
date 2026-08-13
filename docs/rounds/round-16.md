# Round 16 – owner playtest, twenty findings plus the pre-match preview (11.08.2026)

The triage and the arguments live in **`docs/specs/round16-triage.md`**, with two build specs beside
it: **`docs/specs/round16-injuries.md`** (the injury cluster and its measurement) and
**`docs/specs/round16-commentary.md`** (the commentary cluster and the preview). Measured against
his own third Olivia season, `olivia-o1p7_w195` – read locally, never committed, never a fixture.

> ⚠ **THIS FILE WAS REBUILT AFTER THE FACT, on 13.08.2026, by the round-18 item 6 audit (task #88).**
> Round 16 shipped without a ledger: the round went straight to `docs/specs/round16-triage.md` and
> the boxes were never written, exactly the failure `README.md` § "Keeping this true" step 6 exists
> to prevent. Nothing below is a contemporaneous record. It was reconstructed from three sources, in
> this order of trust: **(1)** the three round-16 specs named above; **(2)** the commit messages and
> diffs of `7dd25d8`, `f71072d`, `d914f46`, `19e7770`, `5016605`, `a435d08`, `5450926`, `1a7363b`;
> **(3)** the current source on `wave/flags-grant`, grepped item by item. Where a spec and the code
> disagreed the code won and the entry says so. The owner's raw words for each item are NOT in the
> repo – only the triage's paraphrase – so every quotation below is the triage's, not his.

**This file is the checklist, not a second copy of the argument.** Status: `[x]` shipped ·
`[~]` answered or explained, nothing to build · `[ ]` open · `[!]` was reported done, was not.

## The twenty

- [x] **1. The Inbox should be full-screen.** `TakeoverShell`, the app's one answer to a screen that
  covers the tabs – `src/components/InboxSheet.vue:331`, pinned by
  `tests/component/round16-surfaces.test.ts:301`. Round 17 #5 later gave the plan-week popup the same
  shell and named this item as its precedent.
- [~] **2. A surface offers a tier the engine then refuses.** The triage's own instruction was «find
  the surface, not the gate» – and there is no such surface. `isTierAgeOpen` is never imported
  outside the engine and `Snapshot.ageYears` is `kidAgeAt`, her real age, so the gate and its
  surfaces already agree. The band/girl gap itself is real (w104: band 16, girl 15) and was closed
  separately by round 15's one-clock work. Nothing built, deliberately.
- [~] **3. The professional table reads 0 points while the result row under it reads 6.** Not a
  cache: `rankableTotal` withholds a total until three tournaments / ten points
  (`src/shared/protocol.ts:1199`). The BEHAVIOUR is correct and untouched; the LEGIBILITY half
  shipped – `LadderView.banked` now carries what is being withheld and
  `src/components/screens/StatsScreen.vue:234` says "THE ZERO THAT IS NOT A BUG" on the surface
  itself.
- [x] **4. Season-by-season stops showing other tracks' rows under a track's tab.** The asterisk and
  the footnote are deleted, not hidden – `src/components/SeasonHistoryTable.vue:106`, pins re-aimed
  in `tests/component/season-by-table.test.ts`. His reasoning, kept: there is one player, so there is
  nobody to disclaim to.
- [~] **5. Does the training split affect recovery?** It does, and always has
  (`world/medical.ts`: a free week recovers `recoveryBase + restRecoveryBonus(plan.rest)`); it simply
  never fires on his weeks, because it does not apply on a tournament or practice week. **The owner
  closed the item himself on 11.08** – «не надо показывать, важно просто, что мы это учитываем» – so
  no surface was built and `world/medical.ts` was not touched.
- [ ] **6. A W35 card shows an empty chance field, intermittently.** **NOT REPRODUCED, and reported
  rather than patched blind**: all 118 future W events on his save previewed with full 32-strong
  fields. The latent path it names is still live today –
  `src/engine/season/preview.ts:251` returns `firstMatchChance: 0, opponentName: ''` when
  `firstRoundOpponent` is null. Needs a repro, and the repro is the work.
- [x] **7. Pro entries on every W card, bottom right.** `src/components/screens/SeasonScreen.vue:399`
  (the count), `:1358` (last in `.controls`), CSS at `:1715`; silent above 18 entries, wrapping to a
  second line accepted as he said. Pinned by `tests/component/round16-surfaces.test.ts:193`.
- [ ] **8. Shoes wear on holiday.** **GENUINELY OPEN, and it is the same item as round 15 #14 and the
  owner's ruling 5 of 09.08 – three askings, no build.** Verified 13.08: `kitWearAt`
  (`src/engine/equipment.ts:175`) is still `week - kit.sinceWeek[line]`, pure elapsed calendar weeks,
  with no vacation term anywhere in the file. `injuryTau` has had its `injuryVacationFactor` since
  round 12; the equipment model still has no equivalent. No round-16 commit touched
  `equipment.ts`. ⚠ The injury half of ruling 5 is deliberately unruled and stays that way.
- [x] **9. The birthday passes unnoticed.** Popup (`src/components/BirthdayDialog.vue`), confetti on
  Home (`src/components/screens/HomeScreen.vue:853`) and gifts banded by age
  (`src/engine/world/birthday.ts:74`, `BANDS`/`bandFor`) – schema **v48**, commit `a435d08`, spec
  `docs/specs/birthday-and-gifts.md`. The engine half (`birthdayTurning`, `markBirthday`) was already
  in place, as the triage predicted.
- [ ] **9b. #100 – the announced birthday age was a year low.** Not an owner-reported item: found by
  the agents while re-anchoring the season, numbered 100 for that reason, and it had to ship BEFORE
  the popup could tell the truth. `birthdayTurning` announced a year low for every girl born on the
  1st–6th of a month, because `kidAgeExact` is month-granular off the week's Monday while
  `birthdayWeek` is day-exact – his own save read «15» twice and never «19». Fixed in `5016605`
  (`src/engine/world/age.ts`, `tests/birthday-announce.test.ts`): swept over 365 birth dates × 14
  seasons, **466 wrong announcements over 66 dates → 0**, with `kidAgeExact` deliberately untouched
  so no tier rung and no injury age-factor moved. ⚠ Listed with an OPEN box only because its
  sibling – the birthday firing a whole WEEK early – is round 17 #7 and was answered there as not
  reproduced. The #100 fix itself is shipped.
- [ ] **10. `key` / `full` should drive the MATCH, not just the text.** **EXPLICITLY LEFT ALONE, and
  it is the one item of this round nobody has picked up since.** `round16-commentary.md:11`: «Item
  #10 (key/full driving the playback) is **not** in this slice and was left alone.» ⚠ For whoever
  takes it: the played match already IS shorter in `key` – `src/viz/timeline.ts:149` skips
  non-key points, 580 s vs 184 s (`MatchViewer.vue:869`) – and the text has been mode-filtered since
  round 14. So the ask is a FURTHER highlights reel, not the first one, and the item is smaller than
  it reads. No follow-up in rounds 17 or 18.
- [x] **11. `full` shows almost nothing.** The headline of the cluster. A rotor over the authored
  strings, the industry one-line template mapped onto `(pointWinner, endingShot)`, Morris importance,
  and a `games` beat – `src/viz/commentary.ts:211, 643, 1107`. Measured: repeats 2.4% → 1.4%,
  adjacent identical rows to zero (`round16-commentary.md` §1.1). ⚠ **A recorded shortfall:** the
  register ladder shipped with two steps, not the three the ruling in §3 describes.
- [x] **12. The `out` shout at ×2, at half the ×1 rate.** `src/components/MatchViewer.vue:384`, and
  the halving is applied at the COMPARISON, not the draw (`outThreshold = pickInt(outRng, 3, 5)`,
  `:408`/`:419`) – so a mid-match speed change takes effect on the next miss and changes nothing
  about what was drawn. Pinned by a mounted, clicked test in
  `tests/component/match-viewer-sound.test.ts`.
- [x] **13. Nothing surfaces an injury.** The first of the cluster's two causes: he got no popup for
  any of three injuries and found out from `injury` plaques afterwards. Popup and snapshot path in
  `f71072d`; the retirement door got its own severity table in `19e7770`
  (`src/engine/world/injury.ts:216`).
- [x] **14. Align the commentary bullets with the rail.** One number owns both now –
  `--mv-rail-x: 33.75px` (`src/components/MatchViewer.vue:2251`), consumed at `:2267` and `:2301`.
- [x] **15. Physio bills the rehab rate while injured and Bills never quotes it.** Behaviour was
  correct, the surface was wrong. The line exists now –
  `src/components/screens/MoneyScreen.vue:108` and `:910`. Round 17 #12 confirms it landed and
  finished the legibility from the other side.
- [x] **16. School shown in August.** The PREDICATE was the liar, not the surface: `isSummerWeek`
  (`src/engine/season/calendar.ts:1137`) now takes its floor from the season and its ceiling from the
  calendar. `docs/specs/summer-window-2026-08.md`, measured 72 → 81 school-free weeks over eight
  seasons with 0 weeks taken away.
- [x] **17. Three injuries in one season at high condition – is the RATE wrong?** **MEASURED FIRST,
  and the measurement moved the fix rather than the knob.** At condition ≥ 70, P(≥3 injuries) is
  **11.4% as shipped against 0.8% on the weekly roll alone**: 61% of injuries – 68% at high condition
  – arrive through the in-match RETIREMENT door, which lands on the player who plays long matches,
  and Olivia plays long matches. That is the same mechanism `tools/injury-ratio-probe.ts` had already
  caught (careful-policy injuries 24 → 68 when retirement shipped). **Owner's ruling, §9.0 of
  `round16-injuries.md`: the rate does not move** – `RETIRE_K = 0.07` is untouched – and the fix went
  to the CONSEQUENCE instead: the retirement door has its own severity table (`severityBandsFor`,
  `src/engine/world/injury.ts:389`).
- [x] **18. An in-match retirement showed "4-5 cannot continue" and nothing else.** The retirement
  slice had shipped its engine half and no surfacing path at all – the "captured is not surfaced"
  pattern. The beat now says she retires hurt, WHY ("A long match on tired legs.", licensed by
  `spentness`), and that the opponent advances (`MatchViewer.vue:1227, 1264`). ⚠ Recorded omission:
  there is no EARLIER beat – no "she is labouring" line – because the engine has no such signal.
- [x] **19. The popup is owed however she was hurt** – live, in a skipped match, or in a week he
  never watched. This was the rule the whole cluster had to satisfy, and it is why the gate moved off
  the stop-reason and onto snapshot STATE: `src/App.vue:875` fires on
  `injury.sinceWeek === snapshot.week && !pending`, with `SnapshotInjury.sinceWeek` added at
  `src/shared/protocol.ts:735` and acknowledgement keyed `sinceWeek:kind`.
- [ ] **20. Keep the screen awake during a match.** **GENUINELY OPEN – nothing exists.** Verified
  13.08: `wakeLock` / `WakeLock` / `wake-lock` return **zero hits** across `src/`; the only occurrence
  in the repo is the ask itself at `round16-triage.md:147`. The triage's own plan still stands –
  `navigator.wakeLock`, a permissions check, an HTTPS context, a visibility-change re-acquire, a
  graceful no-op where unsupported, released when the match ends or the tab hides.

## ⭐ The pre-match preview – the item he added at the end of his message

- [x] **The commentators say something before the ball is struck.** «комментаторы дают какую-то
  короткую информацию об участниках, их шансе на победу». The triage called it the cheapest good
  thing on the list and it was: new module `src/viz/preview.ts`, wired at
  `src/components/MatchViewer.vue:1079` and rendered at the BOTTOM of the log (the log reads
  newest-first and the intro is older than the first ball), context from `TournamentFlow.vue:200`,
  17 tests in `tests/viz/preview.test.ts`. Zero engine change, zero new state, zero RNG.
  → It is also where §3's LADDER OF VOICES became content: four monotone storeys, measured at
  **3 → 4 → 5 → 7** lines at a fixed round, with facts that are only true low down REPLACED rather
  than dropped (self-officiating), so a storey can never carry less than the one below it.
  → ⚠ **Two things left out on purpose, flagged rather than faked.** The **head-to-head**:
  `world.results` is a points ledger (`{playerId, week, points, tier}`) with no opponent field, match
  rows live in `TournamentResult.matches` which the world does not retain, so a head-to-head is a
  SAVE-SCHEMA question and not a read (`round16-commentary.md` §3.1). And the opponent's **nation** –
  the flag on the pre-match card already carries it. ⚠ The head-to-head came back as round 17 #22,
  where it was re-priced much cheaper than round 16 assumed and is **still awaiting the owner's
  word**.

## What this round left behind

Four items and one half: **#6** (no repro), **#8** (kit wear on holiday – asked three times now,
never built), **#10** (`key` as a highlights reel, explicitly left alone and never picked up),
**#20** (the wake lock, no code at all), and **#11's** register ladder, which shipped with two
storeys where the ruling describes three.
