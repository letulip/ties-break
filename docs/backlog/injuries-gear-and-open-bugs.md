---
type: plan
status: draft
area: engine
canonical: false
last-reviewed: 2026-08-22
---

# The body, the gear, and the two bugs nobody has reproduced

Engine-side opens: two tuning proposals that carry their numbers, one thrice-asked mechanic, and
two defects that need a repro before a fix.

| # | what | where it is specified | blocked by | size | state |
| --- | --- | --- | --- | --- | --- |
| 1 | **Kit wear on holiday** (round 16 #8) – asked THREE times (round 15 #14, ruling 5 of 09.08, round 16), never built. Re-verified for this file: `kitWearAt` still walks pure elapsed weeks; no vacation term anywhere in [equipment.ts](../../src/engine/equipment.ts), while `injuryTau` has had its vacation factor since round 12. ⚠ The injury half of ruling 5 is deliberately unruled – build only the gear half. | [round-16.md](../rounds/round-16.md) #8 | nothing – the pattern to copy is named | S | Next |
| 2 | **The recklessness→injury channel, with the proposal's numbers** – the owner asked whether a wrecked body should pay harder and the ledger measured: totals already right, the INJURY channel alone thin (+12% onsets, 150 vs 134 per 40 careers). §6's lever: steepen the sub-knee tau curve so a low-condition match pays ~2.5–3x instead of ~1.4x (3.9 vs 2.8 onsets per 100 matches today) → the grinder lands at ~260–320 onsets per 40 careers, careful careers barely move (~1.6% of managed weeks under the floor vs the grinder's ~5%). Magnitude is a tuning decision with its own bench run. | [fatigue-doctor-ledger-2026-08.md](../specs/fatigue-doctor-ledger-2026-08.md) §6 | owner's word on the magnitude; then invariant-4 bench | S–M | Next |
| 3 | **Post-return fragility** (round 11 R11-1b) – +~30% recurrence for a window after an injury; the research file already sizes it and calls it «derivable from injuryHistory later, cheap follow-up». Genuinely open since 27.07. | [round-11.md](../rounds/round-11.md) R11-1b; [season-life-future.md](season-life-future.md) §2 (recurrence risk) | nothing | S | Next |
| 4 | **«Training week» printed over a tournament week** (round 15 #13) – condition 100 → 34 with no tournament screen. Unfixed AND unexplained: the ledger's 13.08 re-check corrected the original diagnosis (the entry-filter mechanism does not obviously reproduce it) and no repro was ever taken. A repro is the whole first step. | [round-15.md](../rounds/round-15.md) #13 | a reproduction | S (once reproduced) | Next |
| 5 | **The intermittently empty W-card chance field** (round 16 #6) – not reproduced on the owner's own save (118 future W events all render). Parked as no-repro; stays here so the next sighting has a file to land in. | [round-16.md](../rounds/round-16.md) #6; [AUDIT-2026-08.md](../rounds/AUDIT-2026-08.md) | a second sighting | S | Parked |
| 6 | **Injury suspends sponsor perks** – from the 25.07 research: a heavy injury pausing contract perks needs contract-shaped sponsorship, which the brand ladder now IS. The old blocker has quietly expired; needs a re-read, then a ruling («мы ни за что не наказываем» cuts close here). | [season-life-future.md](season-life-future.md) §2 (injury → sponsor loss) | owner's word – it borders on a punishment | M | Next |
