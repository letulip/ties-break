// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.

import type { InjurySeverity } from '../../shared/protocol'
import { WEALTH_CORRIDOR } from './wealthCorridor'

// Season-Life slice C: physio + medical costs. ALL prices are MIDDLE-anchored bands. Every
// medical bill (weekly rehab, one-time onset treatment, physio retainer) draws its base amount
// from its band, then multiplies by one uniform roll mapped into medicalBgFactor[background] –
// the SAME wealth-corridor principle as travelBgFactor (owner 25.07: working = public clinics /
// school resources, middle = standard care, wealthy = private clinics). The roll comes from the
// SAME `seed:physio:week` generator (post-draw multiply on a private sub-stream – invariance-safe).
export const physio = {
  medicalBgFactor: WEALTH_CORRIDOR, // the canonical app-level corridor, not a private copy
  rehabPerWeekCents: [60_00, 120_00] as [number, number],
  // One-time scans/treatment at onset (owner table, deliberately compressed so the severe tail
  // stays brutal-but-survivable for 8k; OWNER-TUNABLE – real surgery $20k+ needs an insurance
  // valve first). minor = no onset bill (rehab-only).
  onsetCostCents: {
    minor: [0, 0],
    moderate: [200_00, 500_00],
    major: [1000_00, 2500_00],
    severe: [4000_00, 8000_00],
  } as Record<InjurySeverity, [number, number]>,
  retainerPerWeekCents: [45_00, 70_00] as [number, number], // middle-anchored; the corridor produces the tiering
  riskReduction: 0.76, // tau *= this when physioActive (24% cut)
  recoverySpeedup: 0.12, // weeksOut *= (1 - this), min 1, when physioActive
  // R9-14: the billed retainer finally shows on the bar – accrueCondition adds this flat
  // weekly recovery while physioActive. Integer (owner said "1 or 2"; was 2, tuned to 1 with
  // the V2 flip 25.07 – at 2 the retainer alone erased every policy difference on hired-coach
  // profiles, see the fatigue bench).
  conditionBonusPerWeek: 1,
} as const
