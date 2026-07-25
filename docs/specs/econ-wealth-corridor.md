# Spec-let — the app-level wealth corridor (owner directive 25.07)

**Principle (canonical, app-level):** every family-background price scaling in the game uses ONE
corridor set — `working [0.70, 0.80] · middle [0.95, 1.05] · wealthy [1.20, 1.30]` — drawn as one
uniform roll per bill/trip mapped into the background's band, always as a POST-draw multiply on a
purpose-scoped sub-stream (never the main RNG stream). Framing: simpler cars/economy flights/public
clinics ↔ standard ↔ premium everything.

**Owner note:** the corridor values are to be REVISITED when real incomes (prize money) land — the
constant is the single place to retune.

## Landed
- **Travel** — `ECONOMY.travelBgFactor`, corridors live since the ranking-gate slice (roll from
  `seed:travelbg:week:tier`).
- **Medical** (slice C) — `ECONOMY.physio.medicalBgFactor` on rehab/onset/retainer (roll from
  `seed:physio:week`). Slice C also introduces the canonical constant `ECONOMY.wealthCorridor`
  and points `medicalBgFactor` at it.

## Follow-up slice: "wealth-corridor unification" (small, AFTER slice C merges — collides with C in economy.ts/world.ts, do NOT run in parallel; the CI incident of 25.07 is the lesson)
1. `travelBgFactor` → reference `ECONOMY.wealthCorridor` (values identical; pure refactor).
2. **Coaching/review ("разбор") weekly expense** — replace the FIXED `bgExpenseFactor`
   (working 0.8 / middle 1.0 / wealthy 1.4) with the corridor: draw the weekly base expense
   pickInt on the main stream EXACTLY as today (draw count unchanged), then multiply by a roll
   from `rngFromSeed(seed + ':coachbg:' + week)` mapped into `wealthCorridor[background]`.
3. **Deliberate identity break (handle consciously):** economy.ts documents that middle ×1.0 was
   byte-identical to the pre-round-7 baseline (the 520-week identity run). The corridor ends that
   pin (middle now ±5% weekly). Regenerate the affected fixture(s) with a commit note; the
   golden-save corpus (LOAD identity) is unaffected — only forward-simulation fixtures that pin
   funds trajectories.
4. **Balance note for the bench re-run:** wealthy coaching effectively drops ~1.4 → [1.2, 1.3]
   (−7..−14%) and working 0.8 → [0.7, 0.8] (cheaper) — accepted by the owner pending the
   coach-slice income re-tune (wealthy income back toward ~$700+/wk). Re-run `bench:econ` both
   horizons and record deltas.
5. The later **coach-as-choice slice** prices per-tier review sessions (club/academy/elite) ×
   the SAME `wealthCorridor` — one principle everywhere.

Acceptance: corridor ordering test per domain (working < middle < wealthy off the same roll);
main-stream draw-count invariance test stays green; regenerated fixtures documented.
