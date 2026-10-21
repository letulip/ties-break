// ROUND 53 STEP 2 – letting the masseur go in the middle of a layoff (docs/specs/injury-honest-week-2026-10.md §3).
// The owner, 21.10: «при увольнении написать в попапе последствия этого действия … я бы снял
// автоматически "доктор не пустил"».
//
// ⚠ MUTATION-VERIFIED (each arm run, then reverted – results in the round-53 ledger entry):
//   * drop the gap's lower bound in `masseurReleaseConsequences` (the `!layoffCoversWeek(…honest…)` half)
//     -> the week+2 entry is listed -> 'lists exactly the gap' goes red;
//   * skip the withdrawal loop in `releaseMasseur` -> 'releasing withdraws exactly the gap' goes red.
import { describe, expect, it } from 'vitest'
import { toSnapshot } from '../src/engine/world'
import { masseurReleaseConsequences, releaseMasseur } from '../src/engine/world/masseurRelease'
import { masseurRehabWeeksAhead } from '../src/engine/world/masseur'
import { TIERS } from '../src/engine/season/calendar'
import { IN_GAP, LOST_EITHER_WAY, NOW, SAFE, layoffWithAMasseur } from './helpers/r53MasseurRelease'

describe('round 53 step 2 – what letting the masseur go costs a running layoff', () => {
  it('the fixture is the gap, or nothing below means anything', () => {
    const world = layoffWithAMasseur('r53-fixture')
    expect(world.injury?.weeksRemaining).toBe(6)
    expect(masseurRehabWeeksAhead(world), 'his cadence saves two of the six').toBe(2)
  })

  it('lists exactly the entry that falls between the honest week and the clinic`s', () => {
    const view = masseurReleaseConsequences(layoffWithAMasseur('r53-list'))
    expect(view).not.toBeNull()
    expect(view!.backWithWeek).toBe(NOW + 4)
    expect(view!.backWithoutWeek).toBe(NOW + 6)
    expect(view!.atRisk.map((r) => r.id)).toEqual([IN_GAP])
    expect(view!.atRisk[0]).toEqual({ id: IN_GAP, label: TIERS.national.label, week: NOW + 4 })
  })

  it('releasing withdraws exactly the gap, refunds it, and writes «Doctor said no» in the feed', () => {
    const world = layoffWithAMasseur('r53-release')
    const funds = world.fundsCents
    releaseMasseur(world)
    expect(world.masseurHired).toBe(false)
    expect(world.entries).toContain(LOST_EITHER_WAY)
    expect(world.entries).toContain(SAFE)
    expect(world.entries).not.toContain(IN_GAP)
    expect(world.fundsCents - funds, 'the fee comes back').toBe(TIERS.national.entryFeeCents)
    const rows = world.events.filter((e) => e.text.startsWith('Doctor said no: '))
    expect(rows.map((r) => r.text)).toEqual([expect.stringContaining(TIERS.national.label)])
    expect(rows[0].entryRef?.id).toBe(IN_GAP)
    // the injury release is not announced twice
    expect(world.events.filter((e) => e.text.startsWith('Taken out of '))).toHaveLength(0)
  })

  it('says nothing when there is nothing to say: not injured, no masseur, or a layoff too short', () => {
    expect(masseurReleaseConsequences(layoffWithAMasseur('r53-healthy', { injured: false }))).toBeNull()
    expect(masseurReleaseConsequences(layoffWithAMasseur('r53-nomasseur', { hired: false }))).toBeNull()
    expect(masseurReleaseConsequences(layoffWithAMasseur('r53-short', { weeks: 2 }))).toBeNull()
    const healthy = layoffWithAMasseur('r53-healthy-release', { injured: false })
    releaseMasseur(healthy)
    expect(healthy.entries.length, 'a healthy release withdraws nothing').toBe(3)
  })

  it('the wire carries the view only while it is true (absent, not null)', () => {
    expect(toSnapshot(layoffWithAMasseur('r53-wire')).masseurRelease?.atRisk.map((r) => r.id)).toEqual([IN_GAP])
    expect('masseurRelease' in toSnapshot(layoffWithAMasseur('r53-wire-none', { injured: false }))).toBe(false)
  })
})
