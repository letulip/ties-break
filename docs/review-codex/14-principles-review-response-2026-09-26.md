---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-09-26
---

# Response to the principles review of 26.09 (14-) – verification, verdicts, waves

The review (`docs/review-principles-2026-09-26/`, commit `03406599` on
`review/principles-2026-09-26`, baseline `03d92221`) answers the owner's ask of 26.09 in full:
eight lanes, a shared serial baseline, every P0–P2 finding re-checked by an agent that did not
write it, and a synthesis that ends in six buildable waves. This file is the house's intake:
what was verified here, a verdict per finding, the owner's decisions with the architect's
recommendation, and the plan. **Nothing launches before the owner's approve.**

## 0. What was received, and whether it has aged

- **Baseline is current.** `03d92221` is `origin/main` today; nothing merged since. The inventory
  has not aged, so no finding is stale by construction.
- **Read-only as briefed.** The review commit touches only its own folder
  (`git diff --stat ae194139 03406599 -- . ':!docs/review-principles-2026-09-26'` is empty).
- **The probes cannot reach a gate.** The three `probes/*.test.ts` sit outside vitest's
  `tests/**/*.test.ts`, and no tsconfig includes `docs/` (checked in `vite.config.ts` and all four
  tsconfigs). Merging the folder cannot redden `npm run check`.
- **Scale.** 65 written findings – 2 P0, 8 P1 (two of them merged pairs), 49 P2, four re-rated to
  P3 in verification, one refuted (G-06) – plus a P3 table per lane, and a status for each of
  05.09's 66 numbered findings and August's proposals.

## 1. Verification here (the intake's step 3)

Every P0 and P1 was re-verified against the code by the architect before any verdict; the P2s
that claim a **live** disagreement were read at their cited lines; the rest carry the review's own
independent verification and are marked so.

| ID | claim | how it was checked here | result |
| --- | --- | --- | --- |
| **D-01** (P0) | «Restore previous» overwrites the true previous generation | the store's 41 revision-carrying mutations tallied (exactly the named 15 skip `refreshSlots`); `MoreScreen.vue` refreshes careers on mount, never slots, and reads `autoSlots[1]`; `db/saves.ts:293-305` always writes the OLDER generation; `sim.worker.ts:685-708` restores the named key into the older generation | **CONFIRMED in code** |
| **C-06** (P0) | a knock on the departure week soft-locks the career | the probe re-run here: `forced60 3/60 · age19 2/30`, same seeds, `PROBE_EXIT=0`; `phaseGrowth.ts:399` rolls before the latch, `knock.ts:361` refuses under it, `blockingOverlay.ts:91-95` puts the knock above a laid-over beat | **CONFIRMED, reproduced** |
| A-01 = D-03 (P1) | the dev tick hand-copies `advanceRefusal`; its pin is blind | the worker's eight clauses against `advanceRefusal`'s eight; `dev-fast-forward.test.ts:78-84` pins seven spellings and not `shootClashOpen(w)` | **CONFIRMED in code** (mutation not re-run) |
| B-01 (P1) | a college year ticks past blocking life beats | `resumeFromCollege`'s loop pauses for a reveal, the call-up and the birthday, never for `pendingLifeBeat` | **CONFIRMED mechanism**; the intent is the owner's |
| B-02 (P1) | `mutate` commits before it renders | `sim.worker.ts:233-250`: `commitAutosave` precedes `snapshotMsg` | **CONFIRMED in code** |
| D-02 (P1) | a newer build's save is rolled back on boot | `readLatestAutosave` falls back on ANY throw; `migrations.ts:3304` throws «newer than supported» inside the decode | **CONFIRMED in code** |
| C-01 (P1) | the rivals' memo is keyed on 2 of 5 knobs | `season/rival.ts:110` compares two ladder refs; `tests/rivals.test.ts:758` records the hand workaround | **CONFIRMED in code** |
| B-03 (P1) | the ad shelf promises a clothing letter the engine cannot write | `sponsors.ts:827-829` needs a live kit deal; `snapshot.ts:1830-1832` opens on a priced fee alone | **CONFIRMED in code** |
| E-01 (P1) | the Season header states the pre-16.08 window | `SeasonScreen.vue:782-786` «this season» and its title at `:1386`, against `entryCaps.ts:285-296`'s birthday window | **CONFIRMED in code** |
| G-02 = H-01 (P1) | the coach-travel-edge family re-walks three careers ~123 times | a cost claim; the review's proof arm (8/8 rungs on 3 walks) was not re-run here | accepted on the record |
| B-04, B-05, H-19 (P2) | live disagreements | `world.ts` mid-loop stops, `closeTournament` at `:1353` with no finished check, `calendar.ts:466` (the W15 age constant moved on 16.08) under a fixture whose own message still names the pre-16.08 age | **CONFIRMED in code** |
| E-06, E-07, F-05, C-05 (P2) | parallel spellings | the named functions and constants exist where cited | **CONFIRMED by grep** |
| the other P2s | – | not re-verified here | **on the review's independent verification** |

⭐ **Question 1 of the review, answered for the fixtures:** a scan of all 13 e2e `.tsave`
fixtures through `decodeExportFile` finds **0** in the C-06 state (no college ending among them).
The golden JSON corpus holds one college ending (`v50`, knock null). Only the owner's own saves are
unchecked. One harmless neighbour noted: `ending.tsave` carries an unanswered knock under a
TERMINAL ending – there the ending outranks the knock in `blockingOverlay`, so nothing is stuck.

## 2. Verdicts, item by item

**TAKE** = adopted as proposed, lands in the named wave · **MODIFY** = adopted with the change
stated · **REFUSE** = against a house rule or a measurement · **SUPERSEDED** = covered elsewhere ·
**owner** = the item waits on a ruling in section 3.

| ID | sev | verdict | lands | note |
| --- | --- | --- | --- | --- |
| D-01 | P0 | TAKE | W1 | both halves: More refreshes slots on mount and on every revision; `restoreSlot` carries the revision it believed and the worker refuses with the existing `STALE_REVISION` – invariant 1's own promise, «a stale screen cannot corrupt a career» |
| C-06 | P0 | TAKE · owner #1 | W1 | recommend (a): no knock roll on the departure week – prevention, and nothing silently dropped |
| A-01 = D-03 | P1 | TAKE | W2 | through B-04's `openQuestions`; the worker calls `advanceRefusal(w) !== null`, its thrown string byte-identical |
| B-01 | P1 | TAKE · owner #2 | W2 | recommend (a): pause, as the birthday does |
| B-02 | P1 | TAKE | W1 | the E-02 ordering on the fourth path |
| D-02 | P1 | TAKE | W1 | keep today's text – no wording moves |
| C-01 | P1 | TAKE | W3 | key on all five inputs, or drop the memo if the builder measures its cost as nil – both arms measured |
| B-03 | P1 | TAKE · owner #5 | W3 | recommend (a): the existing «Not open yet» |
| E-01 | P1 | TAKE · owner #4 | W4 | the words are his |
| G-02 = H-01 | P1 | MODIFY | W5 | the memo, yes – but the rung ratchet (added 23.09) stays until one runner run confirms the timings, then retires; it costs nothing and is the only guard against a sixth cut until then |
| A-02 | P2 · PLAUSIBLE | MODIFY | W3 / W6 | G-01 owns the bytes; the UI repoint and a reverse-purity gate stay PLAUSIBLE in W6, after the build arm the lane left open |
| A-03 | P2 · PLAUSIBLE | TAKE · owner #15 | W6 | recommend: freeze the barrel (new modules imported directly) and drop the 93 dead names |
| A-04 | P2 | owner #13 | W6 | recommend (a): finish P4's three zero-call-back span-moves, then A-03's freeze |
| A-05 | P2 | TAKE · owner #8 | W2 | recommend (a) |
| A-06 | P2 · PLAUSIBLE | MODIFY | now / W6 | a forward rule now («a new beat kind is a new module»); splitting what exists only after B-07's key pin, and only when a wave touches it |
| B-04 | P2 | TAKE | W2 | the one owner of the stop-question class |
| B-05 | P2 | TAKE | W2 | the builder re-aims `tools/summer-bench.ts:78`, which relies on the drop |
| B-06 | P2 · PLAUSIBLE | MODIFY | W1 / W6 | the door normaliser rides D-04 in W1; the `??` ratchet waits |
| B-07 | P2 | TAKE | W3 | and lead 2's shared roll primitive is rightly refused on price |
| B-08 | P3 | owner #19 | – | recommend: collapse the unreachable roof cells, as the divorce pool was – it removes only strings no player can see |
| B-09 | P3 · PLAUSIBLE | Later | backlog | `toSnapshot` as one 915-line function |
| C-02 | P2 | TAKE | W3 | |
| C-03 | P2 | owner #16 | W6 | recommend: defer until H-04 is ruled – H-04's reading tool answers the reading cost without moving a byte |
| C-04 | P2 | TAKE | W4 | F-08 folds in |
| C-05 | P2 | TAKE | W3 | |
| C-07 | P2 | TAKE · owner #3 | W2 | recommend (a) |
| D-04 | P2 | TAKE | W1 | |
| D-05 | P2 | TAKE | W6 | after W1's D-01 |
| D-07 | P2 | TAKE, option A | W6 | render-identical |
| D-08 | P3 | TAKE | W5 | |
| E-02 | P2 | TAKE · owner #7 | W4 | |
| E-03 | P2 | TAKE | W4 | |
| E-04 | P2 | TAKE · owner #6 | W4 | recommend (a): the engine's `refusal.detail` – the parity convention (25.09) and his outgrown-chip rulings point the same way |
| E-05 … E-10 | P2 | TAKE | W4 | |
| E-11 | P2 | TAKE | W6 | the Money shop, proposed twice since 02.09 |
| F-01, F-02 | P2 | TAKE | W5 | |
| F-03 | P2 | TAKE, scoped | W5 | |
| F-04 | P2 · PLAUSIBLE | TAKE, live carriers only | W5 | archival tools untouched (H-17) |
| F-05, F-06 | P2 | TAKE | W3 | |
| F-07 | P2 | TAKE | W4 | |
| F-08 | P2 · PLAUSIBLE | SUPERSEDED | – | by C-04 |
| F-09 | P2 | TAKE | W6 | every value byte-identical |
| F-11 | P3 | TAKE | W3 | |
| G-01 | P2 | TAKE | W3 | first in the wave: 49 KB freed, no ruling |
| G-03 | P2 | TAKE | W3 | the lazy `excluded`, per the site's own ruling |
| G-04 | P2 | TAKE (a) | W5 | (b) is owner #18 |
| G-06 | – | REFUSE (the refutation stands) | – | the owner's ruling A on sim stalls covers it; the stale solo table rides as P3 |
| H-02 | P2 | TAKE (a) + (b) | W5 | (c) is owner #17 |
| H-03 | P2 | TAKE | W5 | the cure for a foreign session's files turning the owner's own `check` red |
| H-04 | P2 | owner #11 | – | recommend O1 plus the FORWARD half of O2; no sweep |
| H-05, H-06, H-07 | P2 | TAKE | W5 | |
| H-08 | P2 · PLAUSIBLE | MODIFY | now | a forward naming rule for new test files; no mass rename |
| H-09 | P2 · PLAUSIBLE | TAKE (b) | W5 | the architect's own call under the owner's 21.09 delegation of `CLAUDE.md` |
| H-19 | P2 | TAKE | W5 | the builder first checks whether any other file catches the mutation – if none does, it is P1 |
| every lane's P3 table | P3 | TAKE as polish | the wave that touches the file | none scheduled on its own |

**Refuted leads, kept as evidence (Rejected):** lead 2, a shared roll primitive (refused on price;
B-07's key pin instead) · lead 7, dead `ECONOMY` keys (0 of 884 unread) · lead 8, save growth over
a career (flat after week ~200; the snapshot's growth is D-07) · lead 10, `check:tools` as time
(2.9 s of 458 s) · G-06, the sim econ stall (ruling A).

## 3. Owner decisions, with the architect's recommendation

| # | item | recommendation | why |
| ---: | --- | --- | --- |
| 1 | C-06 | **(a)** no knock roll on the departure week | prevention leaves nothing to explain; (b) retires a knock she really took |
| 2 | B-01 | **(a)** pause for a blocking beat | the beat is her speaking; the dev tick's own comment says a loop that outruns her «answers her by walking away» |
| 3 | C-07 | **(a)** gate R8 / R20 off at college | R20 is unambiguous; R8's reading is question 2 |
| 4 | E-01 | his words | (a) reuses the pills' phrase and adds no new sentence |
| 5 | B-03 | **(a)** «Not open yet» | no new words |
| 6 | E-04 | **(a)** the engine's sentence | the parity convention |
| 7 | E-02 | his rule | (a) follows the one surface with a written note |
| 8 | A-05 | **(a)** | reachable only by a malformed payload |
| 9 | B-05 / B-P3-01 / B-P3-02 | refuse unknown enums (fail-fast), keep idempotent reveals, refuse the switch on an ended career – reusing existing sentences where they exist | fail-fast |
| 10 | D-02 · D-07 | keep today's text · option (a) | no wording; render-identical |
| 11 | H-04 | **O1** (a reading tool that collapses comment blocks, no source change) **+ the forward half of O2** (new code: a short why at the site, dated chronicles in `decisions.md`) | the agents' context cost falls now, nothing he wrote moves, and the sweep is never needed |
| 12 | H-09 | **(b)**, the architect's own call | `CLAUDE.md` is delegated (21.09); one-line rules, incident narratives verbatim to `docs/context/`, ~8–10 KB freed under the same 22k budget |
| 13 | A-04 | **(a)** finish P4 | `world.ts` grew 27 % since 05.09 while P4 stalled |
| 14 | A-06 | the forward rule | |
| 15 | A-03 | freeze + drop the 93 dead names | |
| 16 | C-03 | defer to H-04 | |
| 17 | H-02 (c) · H-17 | both, if the map check regenerates in CI | 65 commits of churn; dormant tools out of the typecheck |
| 18 | G-01 (a)–(b) · G-04 (b) | `theme.mp3`'s bitrate is the one large lever (2.5 MB, 15.4 % of the install) – his ear decides; keep the wedding spec's route | |
| 19 | carried | unchanged | |

## 4. The review's questions

1. **C-06 in existing saves** – the e2e fixtures are clear (0 of 13) and the golden corpus holds
   none; only his own saves are unchecked. If he exports them, the same scan answers in seconds.
   With none, prevention alone is enough and no schema move is needed.
2. **R8 at college** – his.
3. **The install ceiling, raw or gzip** – his.
4. **«Nine Bells»** – answered: a test-local constant; the component suite asserts the flow, never
   the ladder. The shared `clashWorld` takes a `brand` option defaulting to the watches' first house,
   as its two siblings read.
5. **The diary's $8,000** – answered: its own comment defines it as «a working-class season of base
   costs», a different fact from the starting reserve that happens to share the value. It stays
   independent; a named constant beside it can say so.
6. **The planner preview and booked rest** – his.
7. **The sub-phone media queries** – answered: `CollegeYearCard.vue`'s 340 is his Q4 ruling of 24.09,
   and `MoneyScreen.vue`'s 359 carries its own reason («the artefacts step aside on a narrow phone»);
   `NextTournamentPanel.vue`'s 359 needs one comment. All three are recorded as deliberate sub-375
   degradations beneath the phone law.

## 5. The plan – waves, executors, sizes

The review's six waves, adopted with the amendments above. Each is one builder, one branch, the
house's usual gates (check, sim, e2e from files in a clean worktree) and the review's own stop/go
rules: every item ships with a test that fails on the unfixed tree (mutation-proven), the frozen
MAIN capture (41550 / `e6b0c709`) holds, byte-identity claims are proven by the stated diff, and
pins are counted with `CLAUDE.md`'s query before a move.

| wave | executor | size | gated on | order |
| --- | --- | --- | --- | --- |
| **W1** save safety + the soft-lock (D-01, C-06, D-02, B-02, D-04) | builder | M (5 × S) | ruling #1 | first |
| **W2** one owner for stop-questions (B-04, A-01 = D-03, B-01, C-07, B-05, A-05) | builder | M | rulings #2, #3, #8 | after W1 (both edit `sim.worker.ts`) |
| **W3** engine: one spelling per fact, dead bytes (C-01, B-03, C-05, F-05, F-06, F-11, C-02, B-07, G-01, G-03) | builder | M | ruling #5 for B-03's row | after W1, parallel with W4 / W5 |
| **W4** UI parity + accessibility (E-01 … E-10, C-04, F-07) | builder | M | rulings #4, #6, #7 | after W3's `snapshot.ts` edits |
| **W5** tests + tooling (G-02 = H-01, H-05, H-06, H-19, D-08, H-03, H-02, G-04, F-03, H-07, F-01, F-02, F-04) + H-09 | builder; H-09 by the architect | M–L | none | after W1, parallel with W3 / W4 |
| **W6** structure (D-05, D-07, E-11, F-09, C-03, A-04, A-03 …) | builder per item | L | rulings #11, #13, #15, #16 | last |

**The forward rules adopted now** (no wave needed, the architect writes them down): a new life-beat
kind is a new module (A-06); new test files are named by module, not by round (H-08); new code keeps
a short why at the site and puts dated chronicles in `decisions.md` (H-04's forward half, pending
his word on #11).

## 6. What this intake changed in the house

- `docs/backlog/the-quality-rig.md` – rows 16–21 for the six waves (state **Later → Now on his
  approve**; the sweep never assigns Now) and rows 22–26 **Rejected** for the refuted leads, plus the
  lens this review adds.
- `docs/decisions.md` – the dated entry for this intake.
- The review branch carries the brief, the review and this response; once it merges, it is
  content-contained and is deleted (`git cherry origin/main <branch>` first).
