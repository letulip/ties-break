# Spec — Season Life slice C: injuries + physio (Wave 2)

**Branch:** `feat/injuries-physio` (stacked on `feat/condition-gate` = slice B) · **Worktree:** `/Users/letulip/Projects/Claude/tb-injury`
**Depends on:** slice B (condition/fatigue + the wired-but-dead injury field + availability gate).
**No schema bump:** B already added `injury`/`injuryHistory`/`physioActive` at **v12** and set `SAVE_SCHEMA_VERSION = 12`. C only *populates* them + adds knobs/events. (One display stat — see SeasonSummary — is added as OPTIONAL to avoid a bump; only bump to v13 if strict typing genuinely forces it, with a trivial migration + v13 fixture.)

Read first (anchor on symbols, line hints may drift): `src/engine/world.ts` (esp. `tickWeek` step 1c that B added, the entered-branch guard ~785-789, `addEvent`, `withdrawEvent`, `accrueCondition`), `src/engine/economy.ts` (`ECONOMY.condition`/`ECONOMY.availability`), `src/shared/protocol.ts` (WorldEventType/Category, Snapshot.injury, SeasonSummary), `src/engine/migrations.ts`, and the Money-breakdown UI + `tools/econ-bench.ts` (both have exhaustive `WorldEventCategory` switches to extend).

## Goal
Fatigue (from B) drives an **injury risk** each healthy week; injuries cost **weeks out** + rehab money; an optional **physio** retainer lowers risk and shortens recovery. This gives real teeth to "pushing through fatigue" (B's soft gate): race exhausted and you gamble on an injury.

## THE INVARIANT (blocks merge — reuse B's proof)
Per-week MAIN-stream draw count/order must stay byte-identical (B1 already frozen: seed `bench-working-0`, count 45239, hash `9f783705`). C adds randomness ONLY on the private per-week sub-streams `rngFromSeed(seed + ':injury:' + week)` and `rngFromSeed(seed + ':physio:' + week)`. Because each is re-derived per week and keyed on immutable `(seed, week)` only, conditional pulls inside it (severity/weeks-out/region only when injured) are invariance-safe — they cannot perturb the main stream or any other week. Ship a **C1 invariance test**: main-stream sequence byte-identical B-only vs B+C.

## Weekly tick — extend step 1c (world.ts)
B's step 1c currently: compute `playedThisWeek`, then `accrueCondition`. C wraps it to the full canonical order (each fn takes only `world`, zero main draws):
```
rollInjury(world)                 // C — runs FIRST so playedThisWeek + accrueCondition see a walkover
const playedThisWeek = world.season.some(e => e.week === world.week && world.entries.includes(e.id)) && world.injury === null
accrueCondition(world, playedThisWeek)   // B (unchanged)
resolvePhysio(world)              // C
```

### `rollInjury(world)` (C)
1. Capture `wasHealthy = world.injury === null` at entry.
2. If injured: decrement `world.injury.weeksRemaining`; at 0 → set `world.injury = null`, push `{kind, severity, week, weeksOut}` to `world.injuryHistory` (prune to last 20), emit a `'recovery'` event (no cost, short-dash copy e.g. "Back on court – cleared to play.").
3. Else if `wasHealthy` (a just-cleared kid gets this week's grace via step 2 clearing before the roll only fires next tick): draw the occurrence roll `r = rngFromSeed(`${world.seed}:injury:${world.week}`)()`.
   - `fatigue = 100 - world.condition`
   - `tau = clamp(injuryBaseChance + fatigue * injuryFatigueSlope, 0, injuryChanceCap)`
   - `tau *= ageInjuryFactor(ageYears)` where `ageYears = 14 + Math.floor(world.week / 52)` — the
     girl injury-age curve (peak at 16; see `docs/research/injury-stats-by-age.md` §3.1).
   - `tau *= consecutivePlayFactor(playedWeeksInTrailing4)` — competed weeks in the trailing 4
     (incl. this one), counted from the KID's results ledger (pure state): 0-1 → ×1.0, 2 → ×1.2,
     3 → ×1.5, 4 → ×1.8. Back-to-back scheduling is the overuse driver (research §3.2).
   - if `playedThisWeek` (entered+scheduled this week): `tau *= injuryPlayingMultiplier`
   - if `world.physioActive`: `tau *= physio.riskReduction`
   - re-clamp: `tau = min(tau, injuryChanceCap)`
   - **injured iff `r < tau`.** The draw is UNCONDITIONAL every healthy week; only `tau` moves (fatigue/age/load are post-draw comparison operands).
4. On injury, pulling from the SAME `${seed}:injury:${week}` generator (invariance-safe): pick severity band, weeks-out, and body region (see below); set `world.injury = { kind, severity, weeksRemaining: weeksOut, totalWeeks: weeksOut, sinceWeek: world.week }`; if `physioActive`, `weeksOut = max(1, round(weeksOut * (1 - physio.recoverySpeedup)))`; bill the ONE-TIME treatment cost `onsetCostCents[severity]` (amount drawn from the `${seed}:physio:${week}` generator; minor = $0, skip the event) via `addEvent({type:'expense', category:'physio', text:'Medical – scans and treatment', amountCents:-cost})`; auto-withdraw any still-refundable (pre-deadline) entries via `withdrawEvent`; emit an `'injury'` event (short-dash copy, e.g. "Rolled her ankle – out ~5 wks.").

### Realistic injury flavor (owner 25.07 research: 48% lower-limb, 28% upper)
`kind` is composed region + descriptor, not a single generic word. After severity, draw a body region from the SAME injury generator with weights ~**lower 0.48 / upper 0.28 / core 0.24**:
- lower (WTA skew — girls' pattern is ankle+knee sprains, so those two take the majority of the
  lower share): ankle 0.30, knee 0.25, hamstring 0.15, calf 0.12, foot 0.10, hip 0.08 (weights
  within `lower`)
- upper: wrist, shoulder, elbow, forearm (uniform is fine)
- core (teen back trouble — bias lumbar): lower back 0.75, abdominal 0.25
Compose `kind` = `${part}` + severity descriptor (minor→"niggle"/"soreness", moderate→"strain", major→"stress reaction", severe→"tear"), e.g. "ankle strain", "wrist stress reaction", "hamstring tear". This adds ONE pull from the private injury generator (invariance-safe).

### `resolvePhysio(world)` (C)
- If injured: bill `rehabPerWeekCents` (draw amount from `rngFromSeed(`${seed}:physio:${week}`)`).
- Else if `physioActive` (healthy): bill `retainerPerWeekCents[background]`.
- Both via `addEvent({ type:'expense', category:'physio', text:'Physio / recovery session', amountCents: -cost })` so it auto-folds into `accrueFinance` and the season-wrap funds delta.

### Entered-then-injured walkover (world.ts ~785-789)
B already guards `if (enteredThisWeek && world.injury === null) { chargeTravel; computeShadowTournament }`. Add the else path: when `enteredThisWeek && world.injury !== null`, emit a walkover `'injury'` event with **0 points**, and skip travel + the shadow run (already skipped by the guard). Document: a post-deadline entry forfeits its fee (can't refund past deadline); pre-deadline entries were auto-withdrawn+refunded at onset.

## Economy knobs (economy.ts) — add C's
FIRST add the canonical app-level corridor constant (owner 25.07: ONE wealth-price principle for
the whole app; revisit when real incomes/prize money land):
```
// The app-level wealth-price corridor: every background price scaling (travel, medical, and – in
// the follow-up slice – coaching/review) maps one uniform roll into these bands, as a POST-draw
// multiply on a purpose-scoped sub-stream. Owner 25.07; retune here when real incomes land.
wealthCorridor: { working: [0.7, 0.8], middle: [0.95, 1.05], wealthy: [1.2, 1.3] } as Record<FamilyBackground, [number, number]>,
```
(In this slice ONLY medical consumes it via `physio.medicalBgFactor` — do NOT touch
`travelBgFactor`/`bgExpenseFactor` here; that migration is the separate spec-let
`docs/specs/econ-wealth-corridor.md`, git-add it with your commit.)

Extend `ECONOMY.availability` with the injury knobs, and add `ECONOMY.physio`:
```
// into ECONOMY.availability:
injuryBaseChance: 0.006,        // per healthy week at condition 100
injuryFatigueSlope: 0.0009,     // + per fatigue point (100 - condition)
injuryPlayingMultiplier: 1.8,   // tau *= this the week she competes
injuryChanceCap: 0.12,
// Owner research 25.07 (docs/research/injury-stats-by-age.md): girl injury-age curve peaks at 16.
// Mild by design – the base is already anchored to real junior prevalence (46-54%/season).
ageInjuryFactor: { 14: 0.9, 15: 1.05, 16: 1.2, 17: 1.05, 18: 0.95, default: 0.85 },
// Competed weeks in the trailing 4 (incl. this one) -> overuse multiplier. Index = count.
consecutivePlayFactor: [1.0, 1.0, 1.2, 1.5, 1.8],
severityBands: [                // cumulative over the severity draw (owner split 60/30/10;
                                // the 10% "heavy" splits 7.5 major / 2.5 severe)
  { cum: 0.60,  severity: 'minor',    weeksLo: 1,  weeksHi: 2  },
  { cum: 0.90,  severity: 'moderate', weeksLo: 3,  weeksHi: 6  },
  { cum: 0.975, severity: 'major',    weeksLo: 8,  weeksHi: 14 },
  { cum: 1.00,  severity: 'severe',   weeksLo: 16, weeksHi: 22 },
],
// new ECONOMY.physio:
physio: {
  // ALL medical prices below are MIDDLE-anchored bands. Every medical bill (weekly rehab, onset
  // treatment, physio retainer) draws its base amount from its band, then multiplies by one
  // uniform roll mapped into medicalBgFactor[background] – the SAME wealth-corridor principle as
  // travelBgFactor (owner 25.07: working = public clinics/school resources, middle = standard
  // care, wealthy = private clinics). Roll comes from the SAME seed:physio:week generator
  // (post-draw multiply on a private sub-stream – invariance-safe).
  medicalBgFactor: ECONOMY.wealthCorridor,   // see below – the canonical app-level corridor
  rehabPerWeekCents: [60_00, 120_00],
  // One-time scans/treatment at onset (owner table, deliberately compressed so the severe tail
  // stays brutal-but-survivable for 8k; OWNER-TUNABLE – real surgery $20k+ needs an insurance
  // valve first). minor = no onset bill (rehab-only).
  onsetCostCents: { minor: [0, 0], moderate: [200_00, 500_00], major: [1000_00, 2500_00], severe: [4000_00, 8000_00] },
  retainerPerWeekCents: [45_00, 70_00],   // middle-anchored; corridor produces the tiering
  riskReduction: 0.76,          // tau *= this when physioActive (24% cut)
  recoverySpeedup: 0.12,        // weeksOut *= (1 - this), min 1, when physioActive
}
```
Sanity: balanced ~condition 82, age 15, spaced schedule → tau ~0.023/wk (0.042 on a play week) ≈ ~1 injury / 30-45 wks, 60% minor — matches real junior prevalence (46-54%/season) with minors dominating. Grinder ~condition 45, age 16, 4 straight play weeks → tau capped at 0.12 ≈ 1 / 8-12 wks (the naive enter-everything punisher). physioActive ×0.76. Costs: a 5-wk strain ≈ $200-500 onset + $300-600 rehab; a rare severe ≈ $4-8k onset + $960-2640 rehab (the catastrophic-but-survivable tail).

## Protocol (protocol.ts)
- `WorldEventType`: add `'injury' | 'recovery'`.
- `WorldEventCategory`: add `'physio'`. **Update every exhaustive `WorldEventCategory` switch** — the Money-breakdown UI and `tools/econ-bench.ts` `zeroCats()`/`EXPENSE_CATS` must gain the `'physio'` bucket.
- `SeasonSummary`: add `weeksInjured?: number` (OPTIONAL, default 0 in reads — accumulated across the season's recovery weeks; shown in the wrap-up "N weeks lost to injury"). Optional avoids a schema bump.
- (B already added `Snapshot.injury`, `physioActive`, and `ineligibleReason: 'injured'`.) `StopReason`: optionally add `'injury'` so a fresh injury can halt an in-flight `advanceWeeks` and surface the medical event.

## UI
- HomeScreen: the "Injured …" chip and the injured lock states (wired-but-dead in B) come alive — bind to `snapshot.injury` (kind + weeksRemaining, e.g. "Injured: ankle strain – back wk 27"). The Season screen's `lockLabel` already renders `'injured'` → "Injured – rest up"; make the injured detail show the return week.
- Season-wrap dialog: surface `SeasonSummary.weeksInjured` ("3 weeks lost to injury").
- The physio toggle (B shipped it) now actually bills/benefits — its weekly retainer cost should be visible near the toggle.
- Copy: short dash "–" only.

## Bench (tools/econ-bench.ts) — minimal C wiring
- Add the `'physio'` bucket to `zeroCats()`/`EXPENSE_CATS` so physio spend is categorized.
- (The full gate-aware / injuries-on-off / naive-policy bench work is the SEPARATE post-B/C follow-up per the bench spec — NOT this slice. Here just don't break the bench: its policy already skips hard-blocked events; inj­uries now actually fire, so ensure the policy tolerates an injured week — skip entries while `world.injury` is set.)

## Acceptance tests (TDD, write first)
- **C1 invariance:** main-stream sequence byte-identical B-only vs B+C (reuse B1's capture; assert count 45239 / hash `9f783705` unchanged).
- **C2 sub-stream determinism:** for fixed `(seed, week)` the occurrence/severity/weeksOut/region are identical regardless of funds/entries/plan; save mid-career, reload, re-tick → identical injury timeline.
- **C3 fatigue drives injury:** Monte-Carlo ≥200 seeds; a grinder profile (steady condition ~45) suffers ≥3× the injuries/season of a rested profile (~85).
- **C4 injured gate + recovery:** while `world.injury` set, `enterEvent` throws "Injured – …" on every tier and `upcomingEvents` reports `ineligibleReason: 'injured'`; `weeksRemaining` decrements each tick; at 0 → `injury=null`, entry pushed to `injuryHistory`, `'recovery'` event emitted.
- **C5 entered-then-injured walkover:** kid enters pre-deadline, injury lands the play week → no `chargeTravel`, no `computeShadowTournament`, walkover event, 0 points; pre-deadline entries auto-withdrawn+refunded at onset.
- **C6 physio ledger + benefit:** each injured week emits a non-zero `'expense'`/`'physio'` event that appears in the Money breakdown `'physio'` bucket and the season-wrap funds delta; `physioActive` bills the retainer each healthy week, lowers `tau`, and shortens `weeksOut`.
- **C7 injury flavor:** injured `kind` is region-composed and skews lower-limb (~48%) over a large sample, with ankle+knee the top two regions (WTA skew); label reads like "ankle strain".
- **C8 age curve:** with all else fixed, effective tau at age 16 (weeks 104-155) > tau at age 14 (weeks 0-51) by the ageInjuryFactor ratio (1.2 / 0.9); assert via the factor function directly + a Monte-Carlo direction check.
- **C9 consecutive load:** a kid who competed 4 of the trailing 4 weeks carries factor 1.8 vs 1.0 for a spaced schedule (assert the counter derivation from the results ledger + the factor lookup; pure state, no draws).
- **C10 onset cost ledger:** a moderate+ injury emits a one-time non-zero 'physio' expense at onset (drawn in-range for its severity, then corridor-scaled) IN ADDITION to weekly rehab; a minor injury emits no onset bill; both fold into the Money breakdown 'physio' bucket.
- **C11 medical corridors:** for the same (seed, week, severity), the billed rehab/onset/retainer amounts order working < middle < wealthy (disjoint corridors 0.7-0.8 / 0.95-1.05 / 1.2-1.3 off the same roll — mirror the travelBgFactor corridor test); amounts land inside band×corridor bounds.
- **Golden corpus / schema:** every v12 golden save still loads unchanged; if `SeasonSummary.weeksInjured` forces a bump, a trivial v13 migration + v13 fixture, else none.

## Gate (Definition of Done)
`npx vue-tsc -b` 0 · `npx vitest run` all green (incl. C1 invariance + golden corpus) · `npm run build` clean · `npm run bench:econ` still runs (physio bucket present). Do NOT `git push`. Do NOT edit `docs/decisions.md`. Commit spec + code + tests on `feat/injuries-physio`. In the final report: confirm C1 passes (count+hash), list files changed, and give the injuries/season + weeks-lost figures from a quick bench so the architect can gate.
