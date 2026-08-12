# Round 17 – owner playtest, twenty-eight items plus a live day of follow-ups (12.08.2026)

The triage and the arguments live in **`docs/specs/round17-triage.md`**, measured against
`tennis-sim_olivia-o1p7_w361.tsave` and the Naomi series (w412 → w466 → w569). His own careers:
read locally, never committed, never a fixture.

**This file is the checklist, not a second copy of the argument.** Status: `[x]` shipped on the
branch · `[~]` answered or explained, nothing to build · `[>]` in flight, agent named · `[ ]` open.

⚠ This ledger exists because the owner asked for it twice, and the second time he had caught the
cost of not keeping it: #14 was reported shipped and was not fixed on his screen.

## The twenty-eight

- [x] **1. Last season's tournament letters auto-delete.** Was never the wrong kinds – the wrong
  CLOCK: a rolling 52 weeks never crosses a season boundary. Prunes by `seasonIndexOf` now, with two
  deliberate survivors (unplayed entry, live suspension).
- [x] **2. `pro entries 16/16` carried into the new season.** Nothing failed to reset – the chip
  asked about the wrong WEEK; a shipped v46 fixture had frozen it.
- [x] **3. Birthday popup unreadable.** `--card`/`--hairline` declared nowhere, fallbacks painted
  white-on-white at 1.09:1. Now KnockDialog's tokens, contrast asserted through the real cascade.
  ⚠ Its panel then vanished AGAIN in the day's dialog-class regression – see F below.
- [~] **4. What drives skill growth.** Answered with numbers: an aimed season moves one wing ×5
  (`aimWeights`), matches add up to 3 × 0.18. Owner: «может и не надо нигде писать» – no UI built.
- [x] **5. Plan-week popup full screen.** `TakeoverShell`, same as the Inbox.
- [x] **6. The fork quoted a junior rank and offered the academy to a W75 earner.**
  `activeLadderOfSnapshot` now; the third button gained its precondition and honest words – see B.
- [~] **7. Birthday a week early.** Not reproduced: career week 9 IS label `W10 '31` – one week,
  two numberings. 0 of 361 weeks disagree on his save.
- [x] **8. Match screen margins** → `--app-pad-x`; painted court 274.9 → 288.3px.
- [x] **9. One-line header** `Regional  W36 '35  Quarterfinal`, generic suffix dropped in the
  match-screen header only. 25.75px bought; net 15.87 after the wider canvas grew the court.
- [x] **10. In-match injury popup without eject; no auto-eject; `Watch again | Proceed`.** Owner
  refinement of 12.08 shipped the two-button row; the leftover stats "beard" is J below.
- [x] **11. Vacation ban while injured lifted.** It was incidental – written beside someone else's
  veto with no reason of its own. The friendly keeps its gate.
- [~] **12. Physio checkbox.** It works (retainer on healthy weeks; rehab bills regardless when
  injured) and the Bills screen now says so – round-16 #15's fix finished the legibility.
- [x] **13. Season money table.** Redesigned per the owner's correction – the running balance left
  both surfaces; and the naive identity provably does not close (off-season moves the balance).
- [x] **14. Coach-card text off the picture.** ⚠ REOPENED 12.08: the first fix (54→66px) aimed at
  the mask's opaque stop; the fade runs to 96% and the man was still under the words. Now 80px –
  the target is the image, not the opaque band.
- [>] **15. Why pay a coach.** Measured (`what-money-buys-2026-08.md`): money is a ZERO on the
  ladder; above `budget` no rung beats self-coaching; the design answer is
  `docs/specs/coach-as-the-eye.md` and its aim-value measurement is running now.
- [x] **16. "Season 2035 closed at #79" names no table.** It does now.
- [x] **17. "Used racket off the classifieds" on a $323k career.** Pre-sponsor precondition; the
  need-half is noted as unbuilt (`sponsorNeedMet` wants a figure `resolveGear` cannot reach).
- [x] **18. Gift memory.** The ask now reads the record – only to REMOVE what she already has; same
  stream, same draw count.
- [x] **19. J30 at age 20 with "exams this week".** `feedContext` took `ageYears` and never read
  it; and `lockLabel` printed one excuse for five refusals. Both fixed.
- [x] **20. W250 trophy on white.** He HAD shipped the fix; `dedupe()` ranked jpeg over png and
  threw it away. Pipeline fixed (ambiguity now stops the build), stale jpg deleted, webp rebuilt
  and verified `VP8X` before committing.
- [~] **21. Inflation.** Answered with the ledger: income already grows 5-10%/yr against fixed
  costs, and costs stop mattering long before that – the real question is task #103.
- [>] **22. Rivals in commentary.** Priced: `world.events` already keeps ~265 of her matches with
  opponent and score – tier 1 is ~20 lines with NO schema change; awaiting the owner's word.
- [~] **23. Is her win rate normal.** 72.9% career, 66-19 season – she is fine; the W125/W250
  ceiling is the field, not her racket (`ladder-vs-targets-2026-08.md`).
- [x] **24. Elapsed match time.** Derived from playback position (×1/×2/×4 free), calibrated:
  median two-setter 1:19, three-setter 1:58. Monospace digits; centred in live AND replay.
- [x] **25. Weather note opens the commentary.** In `viz/preview.ts` – the determinism pins on
  `commentary.ts` untouched.
- [x] **26. Recap crops right-shifted** – one token, every drawing surface checked.
- [x] **27. Duplicate Baseline letters** – a letter's identity is its slot; deduped on the tier.
- [x] **28. Grand Slam $0.** Correct (majors levy no fee; R1 pays $190k) – the card now says
  "no entry fee", never "free".

## The day's follow-ups (12.08)

- [x] **A. The birthday speaks before the fork** – and on «college»/«stop» her nineteenth used to
  never happen at all. One ordered overlay queue now.
- [x] **B. "Take the college place."** The fork's academy and `reviewAcademy`'s grant were two
  things wearing one word; a W75 result costs the COLLEGE door only.
- [x] **C. Monospace clock** (`tabular-nums`).
- [x] **E. "Change sides" off the clock** – 9.29 units of overlap → 15.30 clear; the band is a grid.
- [x] **F. The whole dialog class lost its panel** – a dangling comma after `.plan-sheet`'s deletion
  swallowed the shared rule; ALL ten modals were bare text. Restored, and
  `tests/stylesheet-integrity.test.ts` now fails on exactly that shape of edit.
- [>] **G. The coach's "will not move anything" is FALSE** – 78.1% of the events it dismissed would
  have moved a table. Fix in flight (the sentence becomes conditional on `bookClosedTo`, and says
  "wrong currency" when that is the truth).
- [ ] **H. Domestic rungs in a 22-year-old's season list** – task #84, unchanged this round; the
  same filter that gates the J tiers reaches it in two lines when the owner asks.
- [x] **I. Replay clock centred.**
- [>] **J. The stats "beard" under the match buttons goes** – deletion in flight; the retirement
  line survives in the commentary, which is what un-blocks it.
- [x] **Vacation re-step** («шифт-8»): gains 18/22 → 10/18, third rung up untouched; planner pins
  re-aimed, tightest sim anchor re-run green.
- [x] **Retirement copy** – «her words, not the game's» broke the fourth wall; same meaning, said
  in-fiction now.
- [>] **Coach-as-the-eye measurement** – running; decides what is built first, at the owner's word.
