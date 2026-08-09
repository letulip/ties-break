# Round 14 – owner playtest, eighteen items on the week-255 save (06.08.2026)

The triage, the measurements and the whole argument live in **`docs/specs/round14-triage.md`** –
everything below that claims a number was measured on the owner's own save
(`tennis-sim_zoe-royv_w255.tsave`, schema v43, week 255) before any work was dispatched. That save is
his career: read locally, never committed, never a fixture.

**This file is the checklist, not a second copy of the argument.** Where an item needs its reasoning,
the spec has it and this file links there instead of restating it. Written 09.08, three days after
the round, because rounds 14 and 15 went straight to specs and never got a ledger file – which is
half of why the ledger stopped being true (backlog #88).

Status legend: `[x]` shipped · `[ ]` open · groups are the triage's own.

---

## The headline: items 7, 15 and 18 are one defect

He reported three separate calendar complaints. The calendar was never empty – it was full of
tournaments she was not allowed to enter: **165 of 189 future events blocked, 27 of her 46 remaining
weeks with nothing enterable at all.** Below her, everything said `outgrown`; above her, everything
said `locked`.

## Group A – the ladder window *(7, 15, 18)*

- [x] **7 / 15 / 18. Four empty weeks, tournaments that appear and vanish, a fresh profile going
  empty around week 19.** One defect: the window's lower bound was a wall.
  → **SHIPPED AND MEASURED 08.08 – `docs/specs/ladder-floor-2026-08.md`** (status: SHIPPED), on the
  owner's ruling: «не делать нижний порог вообще, пусть играет, просто по приоритету более актуальный
  турнир показывать, если есть». The lower bound is a sorting key now – an outgrown rung is enterable
  and simply loses the card to anything better that week. The upper bound stays: an acceptance cut is
  the tour's rule and not ours to waive. On his save the dead weeks go **27 of 46 → 6**, with
  `locked` unchanged to the event. The `regional`/`national` locks at domestic #106 turned out to be
  the SAME defect – her domestic book had decayed to zero and the only rung that could pay it back
  was the Local the ceiling had shut.
  ⚠ **It carries a measured COST as well as the fix** – careers that ever hold a professional ranking
  fell 134 → 94 of 180 on the grinder arm. The owner ruled that the cost is not a cost: having
  somewhere to play is the correct state of the world. Read that spec's §3 before quoting this as a
  free win. The answer to the cost is the coach as scheduler
  (`docs/specs/what-a-coach-is-for.md`) – he now has an opinion about WHICH event.
  ⚠ **One half of this shipped without its counter**, and round 15 item 3 caught it: the W cards
  still carry no remaining-events number, so the events stop appearing after week 28 with no sentence
  explaining why. Backlog #91.
  → This is also the fix for **R8-7b** (round 8, 25.07) and **R12-2/13/17** (round 12, 27.07). Three
  rounds, one defect, and the two older boxes sat open until this audit.

## Group B – the match viewer *(11, 12, 14)*

- [x] **11. `full` / `key` does nothing, and the running commentary never appeared in a WTA 250.**
- [x] **12. `skip` must leave that switch** – it skips the whole match, which is not what a
  full/key/skip triplet implies.
- [x] **14. `key moments` must actually differ from `full` in the commentary**, the control block
  must pin to the bottom with the commentary unrolling above it, and her dot must go yellow like
  every other place the accent marks her.
  → **SHIPPED on `fix/match-viewer-controls`**, commit `00afc5a` "Round 14 Group B: the view switch
  reaches the commentary, and the block pins", merged at `d9efb4e`.

## Group C – mail, vacation, onboarding *(1, 2, 9)*

**Not started.** All three still open at 09.08.

- [ ] **1. A booked vacation cannot be cancelled.**
  → **OPEN, with a sharper root cause than the triage had.** The triage read `cancelVacation` as an
  engine capability with no way in; the truth is narrower and worse. The door exists and is wired
  end to end (`src/engine/world/planner.ts` → `src/worker/sim.worker.ts` → `src/stores/game.ts`), and
  `src/components/screens/SeasonScreen.vue` has a `Cancel` button for a booked family week – but only
  on the **un-painted fallback row** ("A package with no painting yet keeps the old row, Cancel
  included"). The painted vacation Card above it carries no button by an explicit 29.07 decision:
  "a booked week is a statement, not a control, and cancelling lives where booking does – tap the
  card and the planner opens". **The planner sheet never grew the cancel.** So every package that has
  art – which is all of them – is uncancellable, and the one that would work is unreachable.
- [ ] **2. The inbox must become a mail client** – a list, unread bold, click to open, a bin per row
  once read, yes/no on delete.
  → **OPEN.** `src/components/InboxSheet.vue` is still the letters-newest-first overlay. There is no
  unread state to bold: `src/shared/protocol.ts` states the engine cannot know what the player has
  looked at ("the bell's dot asserts one FACT and not the 'unread' it cannot know"), so unread is a
  client-side concept this item has to introduce. No delete path exists.
- [ ] **9. Onboarding is not width-capped on desktop**, unlike every other screen.
  → **OPEN.** `src/components/OnboardingWizard.vue` renders through `ScreenShell`, which owns the
  vertical stack and an opt-in gutter (22 px, the documented onboarding exception) and deliberately
  owns no width cap.

## Group D – money and the coach *(4, 6, 10)*

- [x] **4. His coach's percentage keeps falling.** The FALL is honest – headroom plus the age curve,
  and the model reproduces his three sightings off his own save – but the projection assumed 52
  *coached* weeks while the R4 rule stood the coach down for 43% of the season, so it **over-quoted
  by 1.76x**. Both halves fixed: `coachSeasonUplift` takes `coachedWeeks`, and a room note explains
  the fall.
- [x] **6. `coachOnEventWeeks`.** The predicate is `coachWorksThisWeek`, not `coachActive`. There WAS
  a record and it did not contradict him. The owner separated travel from the retainer on 08.08;
  **the retainer is unconditional now** and the flag means travel only.
- [x] **10. The sponsor.** Coverage was genuinely never consulted on the purchase path – wired. And
  the allowance was per-TERM against a letter promising per-SEASON; fixed too.
  → All three **SHIPPED on `fix/coach-and-cover`** (merged `4177d4e`), measured in
  `docs/specs/coach-retainer-2026-08.md`. The bill's other half shipped the same week as
  `docs/specs/split-the-bill-2026-08.md` – which is what finally closed **R8-10**'s visible half.

## Group E – stats and ages *(3, 8)*

**Never started.** Both re-raised by the owner three days later as round 15 items 12 and 11.

- [ ] **3. Opponent ages** in matches and in the stats tables.
  → **OPEN.** Verified 09.08: no opponent-age concept in `src/`. Re-raised as round 15 item 12.
- [ ] **8. Season-by-season shows the wrong currency** – per level it must show that level's own rank
  and that level's own points; today every row shows the international number and a combined total.
  → **OPEN, and it needs a SCHEMA change rather than a UI fix.** `SeasonHistoryEntry` carries **one**
  rank and **one** points figure – the ITF fold – so the tabs cannot differ because the record has
  nothing else in it. Re-raised as round 15 item 11, where that diagnosis is written down.

## Group F – art *(5, 16)*

- [x] **5 / 16. `w75-hard`, the `wta250` trophy, `wta250-clay`.** The owner's own to make; the
  registry and the guards were already in place.
  → **ALL THREE SHIP.** `public/images/fields/w75-hard-1.webp` and
  `public/images/fields/wta250-clay-1.webp` (commits `6dfa78e` / `9923a49`, 04.08),
  `public/images/trophies/wta250-gold.webp` (commit `c7d6fa8`, 05.08). `docs/art-placeholders.md`
  records the matching rows as cleared, and `tests/art-placeholders.test.ts` keeps that list honest
  in both directions.
  ⚠ **A DISCREPANCY, left visible rather than smoothed over.** The triage of 06.08 lists these three
  as still to make, and the masters had in fact landed on 04–05.08. Either the triage was stale the
  day it was written, or items 5/16 asked for art beyond these three names – and the owner's raw
  words for those two items are not in the repo. If there is a further art ask, it needs his own
  sentence, not an inference from this file.
  → The 05.08 lesson stands and is why the rows lingered: **a master dropped into `public/images/`
  is invisible until `npm run art` runs.** Raw formats are gitignored and the guard hashes the
  shipped `.webp`.

## Answered here, no work needed *(13)*

- [x] **13. Equipment does work – it just has no upside.** `src/engine/equipment.ts`: each of the
  three lines carries a condition that decays with the weeks since purchase and is restored by
  buying. **Fresh kit is exactly neutral** – every factor is 1 – and wear only ever subtracts. So
  buying gear does not make her better; it stops her getting worse. Whether that is the design or
  wants an upside is the owner's call, not a defect. (This is also the answer to round 5's
  "equipment wear line-items", ticked in this audit.)

## Needs a ruling before any work *(17)*

- [ ] **17. A difficulty wrapper expressed as win rate against reality**, sitting over the existing
  8k / 25k / 120k backgrounds.
  → **UNRULED at 09.08.** Genuinely attractive and the research already exists
  (`docs/research/real-ladder-pace.md`). It is a second difficulty axis crossing one that already
  exists, and it is proposed as its own wave once the ladder window has landed, so it is calibrated
  against a game that no longer wastes three fifths of a season. The owner's five rulings of 09.08
  went to other questions; this one was not among them.
