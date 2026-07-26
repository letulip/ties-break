# Spec — Wave 2 tuning: the calendar-independent half

**Branch:** `tune/season-balance` · **Worktree:** `/Users/letulip/Projects/Claude/tb-tune` (off `ca686ff`)
Player copy: short dash "–", no Cyrillic in player-facing strings.

## Sequencing judgment (READ THIS FIRST — it defines the scope)
The fatigue bench produced five tuning arguments. **Two of them are calendar-sensitive** and must NOT
be tuned now, because the Ladder-up slice (running in parallel) adds J-level tournaments and will
change both:
- ❌ *balanced self-coached runs hot on injuries* — the lever is `tau × matches-per-season`, and
  matches/season is exactly what Ladder-up changes. Tuning now = tuning twice.
- ❌ *careful/balanced ride the condition ceiling (wk49 93-100 vs the owner's 60-85 target)* — a
  denser calendar lowers them on its own. Re-measure after Ladder-up, then tune once.

**This slice therefore ships only the calendar-INDEPENDENT fixes.** State that boundary in the report.

## In scope

### 1. Streak caution is over-eager (bench: careful pushes through 8-11 cautions/season at condition 92)
The 3-consecutive-practice-weeks rule fires on a perfectly fresh kid, so the warning becomes noise —
and a warning nobody believes is worse than none (it trains the player to click through the real
ones). Gate the streak arm on actual strain: fire only when condition is below a threshold
(~75) OR the streak is longer (4+). Keep the low-condition arm as-is. Knobs in `ECONOMY`, pure
predicate (`practiceCaution`) stays the single source for the sheet and the Home chip. Unit-test both
arms and the quiet case.

### 2. The vacation ladder is lopsided (seaside 88% of all bookings; grandma 0.2%, camping 0.4%)
Root cause from the bench: the rescue offer triggers in a narrow band (~65) and the pre-highlight
picks "cheapest that returns her above ~85", so seaside (+20) always wins and the cheap tier
(+12/+14/+16) can never be the answer. Fix the *logic*, not the prices:
- Widen the offer band so mildly-tired weeks (say ≤80) also get an offer, where a cheap package IS
  sufficient — a $0 staycation that lifts 74 → 86 should be the obvious pick.
- Make the pre-highlight "cheapest sufficient for HER current condition", so the recommendation
  slides down the ladder as the deficit shrinks.
- Do not re-space the gain ladder (+12…+30) — that is calendar-sensitive; re-check after Ladder-up.
- Bench must then show every package selling with a less degenerate share (seaside well under ~70%).

### 3. Doctor's veto at ultra-low condition (the owner's own R9-19b idea, now justified by data)
The bench found the only degenerate cell in the whole sweep: a self-coached grinder sits at condition
**0** for 4.3-4.5% of weeks and still competes. The owner proposed a pre-match medical check for
exactly this. Implement it as the one place where the "parent may push through" philosophy yields to
medicine:
- HARD block on entering a tournament while condition is below `ECONOMY.availability.medicalFloor`
  (default **15**), surfaced through the existing `availabilityStatus` as `level: 'blocked'` with a
  new reason `'medical'`: "Not cleared to play – she needs rest." Fatigue above the floor stays a
  SOFT caution exactly as today.
- The floor is deliberately far below every tier's caution floor (20-45), so it only ever fires in
  the pathological zone — normal play must not notice it. Prove that on the bench (caution counts and
  entries for balanced/careful should be unchanged).
- Knob-driven so the owner can lower/disable it after seeing the numbers. Flag in the report that this
  is his idea being cashed in, and that it is the first hard body-gate in the game.

## Out of scope (explicitly)
tau/injury retuning, the +12…+30 gain ladder, the wk49 ceiling target, hired-coach physio flatness,
25k-hired negative funds (that is the Wave-3 coach slice).

## Gates
`npx vue-tsc -b --force` 0 · `npx vitest run` all green (B1/C1 freezes byte-identical, golden corpus
untouched, no schema bump) · `npm run build` clean · `npm run check`. Re-run `npm run bench:fatigue`
and report: caution counts before/after, the package-sales table before/after, medical-veto firing
rate per policy, and confirmation that balanced/careful behavior is otherwise unchanged.
