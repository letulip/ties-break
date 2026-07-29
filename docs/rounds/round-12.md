# Round 12 — owner playtest, three careers on the week-numbering + age-caps build (17 items + 2 screenshot finds, 27.07.2026)

Build note: the owner played WITHOUT `fix/world-trio` (it landed after his session), so item 5's
week-label half and the vanished-season bug were already fixed when this round was triaged. Player
copy: short dash "–", no Cyrillic in player-facing strings.

---

## 🔴 Correctness — wave A

- [ ] **R12-15 dead Play button after an injury (worst item).** Injury before a tournament, "no
  refunds" shown, the regional's card still offered the next step; pressing it did NOTHING — no
  refund, no tournament, no error. The practice-court refund DID arrive, so the two paths diverge.
  Find the state that makes the click a no-op; every control must either act or be disabled with a
  reason (the R10-16 doctrine).
- [ ] **R12-3 playable while injured AND outgrown.** A 1-week injury; next week a regional she has
  OUTGROWN still shows Play and enters play even injured. The arrival gate must re-read both the
  band and the injury on the play week — this is the R10-5 "one rule, many surfaces" family again.
- [ ] **R12-16 anger fires on every loss once the streak crossed.** Design intent was a mood, not a
  permanent face. Fix: `angry` shows on the CROSSING loss only; further losses in the same streak
  read `sad` again until a NEW streak crosses its own threshold. (Threshold stability per streak is
  already pinned — keep it.)
- [ ] **R12-S1 (screenshot) season 2 wrap-up says "from #1".** Both careers show a season-start rank
  of #1 in their second season (e.g. "#89 ↓88 from #1") — she did not start season 2 ranked #1; the
  window reset makes everyone tied at 0 and she is briefly first-by-id. `startRank` must be captured
  after the tie-break puts a point-less kid LAST (the cohort pre-history rule), or captured on the
  first counting week instead of week 1.
- [ ] **R12-S2 (screenshot) "Best result: best Champion".** The row label already says "Best result";
  the value duplicates "best". Value should read "Champion" / "Runner-up" / "Semifinalist".
- [ ] **R12-6 two Nationals on adjacent weeks (twice in one season, incl. the last two weeks).** The
  R9-20 extra nationals can land adjacent to the base-cadence ones. Add a min-gap constraint for
  same-tier events in the calendar generator (national+ only; the dense entry tiers are dense by
  design). NOTE: moves the calendar → the frozen MAIN capture (41550/`e6b0c709`) WILL re-base; that
  is the known cost of any calendar change and must be done deliberately, in its own commit.
- [ ] **R12-4/11 injured ON a family vacation, twice.** `rollInjury` runs every healthy week with the
  full base tau — a resort week rolls the same dice as a training week. She is not training; a
  vacation week should multiply tau down hard (post-draw multiply, invariance-safe, same pattern as
  the physio/recovery buffs). Keep it nonzero — holidays do sprain ankles — but rare.
- [ ] **R12-5b practice/sparring offered during a 5-week layoff.** The planner sheet still renders
  the practice tab as bookable; booking would throw. Disable-with-reason (the injury), same words as
  the tournament lock. (The "back W70" absolute-week half of this item was fixed in `fix/world-trio`.)

## 🟡 Design decisions — need the owner, prepared in wave A as knobs

- [ ] **R12-2/13/17 the outgrown-band trap.** At 112–118 pts only regional is open (local closes at
  85, national opens at 150). The 8k career then hit the inverse: a long losing streak at regional,
  points DECAYED below 85 (52-week window), and local re-opened only at W25 of season 3 — "это было
  очень грустно". Reality has no hard "outgrown" ban: you may enter down-tier; acceptance and zero
  reward is what stops you. Options, to be decided with the points retable (the field redesign):
  (a) widen the overlaps (local ceiling 85 → ~120); (b) replace the hard closure with soft entry —
  enterable but reduced/zero points and a "beneath her level" warning; (c) keep closure, add a
  performance-based re-open (N straight early exits at the higher tier re-opens the tier below
  immediately, no waiting for decay). Owner's instinct = a sliding overlap window; (b) is closest
  to reality; (c) is the smallest patch for the trap he actually hit.
- [ ] **R12-17b why the long regional losing streak at 8k?** Partly the coach gap (self-coached =
  no hired-coach gear/level edge), partly the field: regional entrants are the 40–88% band of the
  standings, and after HER points decay she faces the same mid-field with a weaker setup. Not a bug;
  the honest fix is the living-field redesign (rivals develop, she meets a moving field, and a slump
  reads as a slump rather than a trap).

## 🟢 Presentation — wave B

- [ ] **R12-1/14 exam weeks must SAY exams.** Tournament cards on exam weeks lose "+ Plan week" with
  no explanation; the owner suggests treating the two exam weeks like the off-season weeks — green,
  labelled "Exams", nothing plannable, and the tournament card carries "Exams this week" instead of
  a silent missing button. (Tournaments still exist those weeks — the world does not stop for her
  school — but the card must say why SHE cannot go.)
- [ ] **R12-8b injury chip on week plaques.** A small red "injury" marker on calendar/planner week
  cards while the layoff covers them, so "why can't I book anything" is visible at a glance. Plus:
  when a vacation booking is refused because of the layoff, the refusal reason must surface (today
  the off-season card just silently offers nothing).
- [ ] **R12-12 score on its own line.** On the Season screen's this-week tournament plaque the score
  goes to a SECOND line (asked before — round-11's one-line fix was for the practice row; this is
  the tournament plaque).

## 📊 Answered

- **R12-7 "pressed Play at ~60 condition and the injury popup appeared — when is it rolled?"**
  The injury roll happens at the top of the weekly tick, BEFORE the tournament resolves — `rollInjury`
  is step 1c and reads `seed:injury:week`. At condition 60 the fatigue term is 40 × 0.0009 on top of
  the 0.006 base ≈ 4.2%, ×1.8 for a competing week ≈ 7.6% that week. So the popup on pressing Play
  is the week starting, not the match itself hurting her — she got hurt "in warm-up", the run is
  called off, and the doctor-on-arrival rules take over.
- **R12-10 winners / unforced errors.** Both are counted from the real point-by-point rally sim, not
  invented: a WINNER is a clean stroke the opponent never touches; an UNFORCED ERROR is the point
  loser putting a makeable ball into the net or out. And yes — condition reaches them indirectly:
  fatigue lowers effective skill, which shifts rally outcomes toward errors, so a tired player's
  line shows more UEs (the 37-21 in his screenshot against a fresher #62 is the model saying
  exactly that).
- **R12-9 income 120k → $750/wk** — shipped this round (`tune/wealthy-income`), third ask honoured:
  430 → 750, the middle of his 700–800. Both his 120k careers died at ~W120–125 with travel
  overtaking the coach; the round-7 burn band gave way to the owner's number, and the calibration
  test moves with it, deliberately.

## Waves

| wave | items | shape |
|---|---|---|
| **income** | R12-9 | one knob + burn-band test retune, own branch, done by the architect |
| **A · correctness** | R12-15, R12-3, R12-16, R12-S1, R12-S2, R12-4/11, R12-5b; R12-6 in its OWN commit (re-bases the MAIN capture) | engine, TDD |
| **B · presentation** | R12-1/14, R12-8b, R12-12 | components only, parallel with A |
| **field redesign** | R12-2/13/17 resolution, rivals that develop/age, the window ±100, points retable, ITF merit bonuses | design doc first — the owner's standing next big thing |
