# Round 10 — owner playtest on the wave-3 build (17 items, 26.07.2026)

> **STATUS: shipped.** All 17 items landed on `r10/fix` + `r10/ui` + `r10/view` (folded into
> `r10/view`, awaiting the owner's merge). Two follow-ups arrived from the round-11 playtest:
> **R10-11's surface hint is reverted** by R11-15 (the ringed dot was worse than the pill it
> replaced), and **R10-16's fix exposed R11-1** — removing `'injury'` from the toast's copy map means
> a swallowed injury stop now shows nothing at all. See `round-11.md`.

Split across three parallel branches by file ownership so they cannot collide:
`r10/fix` (engine + eligibility + dialogs) · `r10/ui` (pure presentation) · `r10/view` (match viewing + history).
Player copy: short dash "–", no Cyrillic in player-facing strings.

## 🔴 Correctness — `r10/fix`

- [x] **R10-3 DEAD END (worst item).** She entered a Local, then outgrew it by rating AND got tired, so
  the rescue prompt offered a vacation for that week — but the vacation could not be booked (the week
  holds an entry), the tournament could not be played (outgrown), and the entry could not be
  cancelled. Nothing was possible. Needs a real escape: see R10-13, which is the same knot from the
  other side.
- [x] **R10-5 vs R10-3 CONTRADICTION — engine/UI desync.** In another run she WAS allowed into a Local
  at 122 points (local band is [0, 85] = outgrown), and the UI never showed the lock. So one path
  enforces the band and another does not. `availabilityStatus` exists precisely so all surfaces agree
  — find which caller bypasses it (suspect: the play-week path vs `upcomingEvents`, or an entry made
  while eligible that survived the crossing — R8-7a only auto-releases STILL-REFUNDABLE entries).
  Whatever the cause, entry, display and play-week resolution must read ONE rule.
- [x] **R10-17 injury lock never lifts.** After an injury the news said she is out until week 21, but at
  week 22 and every week after, no tournament could be entered. Suspect the injury is not cleared, or
  `weeksRemaining` never reaches 0, or the gate reads a stale field. Regression test: enter, injure,
  tick past the stated return week, assert entry works again.
- [x] **R10-16 empty popup + wrong corner radius.** After an injury an EMPTY popup appeared on Home —
  no text at all, just a Dismiss button (find out which dialog renders empty and why). Separately the
  injury/condition dialog uses a ~50% border-radius; it must match the square-ish radius of the top
  popups.
- [x] **R10-13 cancel on the event week (with no refund).** Replaces the silent dead end: on the week
  of the event the player may CANCEL (not "withdraw"), with an explicit warning that the fee is NOT
  refunded. After cancelling, the week becomes plannable again (practice or vacation), which is what
  unties R10-3.
- [x] **R10-14 cumulative fatigue — verified correct, no change.** Owner measured −6 for three Local
  matches (two straight-sets, one 3-setter). Arithmetic: per-match 1 + 1 + 2 = 4 (local tier surcharge
  is 0), ladder variant C `[0,1,1,2,2]` over match indices 0,1,2 = 0 + 1 + 1 = 2 → **−6 exactly**. The
  ladder IS applied; it is just modest at Local. The same three matches at National would cost −12.

## 🟡 Presentation — `r10/ui`

- [x] **R10-2 Stats header tiles**: trim padding on all three so the label fits one line; rename
  "Season points" → "Season pts".
- [x] **R10-8 narrow screens**: "Junior rank" and "Season points" each on ONE line — widen the label
  column (there is unused space) and shorten "points" → "pts".
- [x] **R10-4 vacation card**: week + date on the first line, the vacation itself on the second.
- [x] **R10-11 surface hint placement**: move the surface pill text ("Hard/Clay/Grass" + "suits her
  game") UNDER the surface chip; when the court suits her build, ring the chip in an accent circle and
  keep the wording beneath it — the ring carries the meaning at a glance, the words confirm it.
- [x] **R10-15 replay list colours**: in the Season this-week list, highlight WON matches green and LOST
  matches red (today both read the same).
- [x] **R10-7 dynamic "Next week" button**: instead of a flat "Next week", label it with what the week
  actually holds — entering a tournament, leaving on a vacation, a practice match, or a training week.
  Keep it one button; the label (and ideally a small icon) changes with the plan.

## 🟢 Viewing + history — `r10/view`

- [x] **R10-6 finale applause is late.** After the final (win or loss) the applause fires on a delay;
  it should land WITH the result screen. (The reaction cues moved to the point-end instant in round 9;
  the finale's own `applauseFinal` still lags.)
- [x] **R10-12 practice match is only watchable as a replay.** A booked friendly should be enterable
  live, like a tournament — a "watch it" path on the week, not just "advance the week and find it in
  the feed".
- [x] **R10-9 season history.** Nothing survives a season: no way to compare against last year. Keep a
  per-season record (final rank/place, points, W-L, funds delta) and surface it — a short history table
  is enough. Owner data point to sanity-check against: an all-court 25k career finished year 1 with
  ~15 wins / 23 losses and ~$7,300 left.

## 📊 Answered / routed

- **R10-9's W-L question (15-23, is that normal?)** — largely YES, and it is new: cohort pre-history
  means she now starts genuinely LAST of 199 with 0 points instead of tie-ranked #1, so a losing first
  season is the corrected behaviour, not a regression. Whether 39% is the right first-season win rate
  is a balance question for the economy wave's bench pass (target bands in
  `docs/specs/career-outcome-targets.md`). His related note — condition only dipped to 67 once all
  season despite constant friendlies — is consistent with the bench (balanced/careful ride high) and is
  on the tuning list.
- **R10-10 income** — owner is right that 25k middle is still $300/wk; the wealthy re-tune was deferred
  to the coach slice. Handled by the architect as a single knob, with the bench caveat that coaching is
  still the dominant cost ($23.6k of his $32.8k season spend).
- **R10-1 world news and events** — the Phase-4 opener (two feeds: her events + the world; champions,
  rival storylines, tour news, inflation) plus the weekly random-event roll on `seed:life:week`. Too
  large for this round; its own slice, designed against the existing research docs.
