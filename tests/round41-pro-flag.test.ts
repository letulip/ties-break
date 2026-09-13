import { describe, it, expect } from 'vitest'
import { createWorld, toSnapshot, KID_ID, type WorldState } from '../src/engine/world'
import { fieldProsOf } from '../src/engine/world/ladder'
import { playerNation } from '../src/engine/world/snapshot'
import { flagEmoji } from '../src/composables/countries'
import { TIERS } from '../src/engine/season/calendar'
import type { MatchPlayer } from '../src/engine/match/types'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

// =================================================================================================
// ROUND 41 #17 – A PROFESSIONAL OPPONENT HAS A FLAG
// =================================================================================================
//
// The owner, 12.09: «у некоторых соперниц в про лиге нет флага, проверь там логику пожалуйста».
//
// The VS card's `pending.opponent.nation` was a COHORT-ONLY lookup, and `world.cohort` is the ~200
// juniors. Every W-track draw is filled from `fieldProsOf` (`fp-…` ids), so a professional opponent
// resolved to `''`, and `flagEmoji('')` returns `''` – no flag, on the majority of every W draw she
// ever plays. The pros have always had nations; nothing but the lookup was missing.
//
// ⚠ WHY THE FIXTURE IS HAND-BUILT RATHER THAN WALKED. Reaching a real W draw means walking a career
// past the age gates and the acceptance cuts – hundreds of weeks – to assert one derivation over a
// field that is already deterministic. The opponent here is a REAL row out of `fieldProsOf(world)`
// (same id, same nation the merged W table ranks her by), the event is a real `w15` `SeasonEvent`,
// and the assertion goes through the real `toSnapshot`, so the seam under test is the shipped one.
// The second arm walks the cohort path with a real cohort row so the fix cannot have traded one
// population for the other.

/** A pending run over `tier` whose first-round opponent is `oppId` – the exact state the VS card
 *  mounts over: nothing revealed yet, so `pendingView` reads her FIRST match. */
function pendingAgainst(world: WorldState, tier: TierId, oppId: string, oppName: string): void {
  const event: SeasonEvent = {
    id: `fixture-w${world.week}-${tier}`,
    week: world.week,
    tier,
    surface: 'hard',
    travelCostCents: 0,
    deadlineWeek: world.week - 2,
  }
  world.season.push(event)
  const player = (id: string, name: string): MatchPlayer => ({
    id,
    name,
    serve: 60,
    ret: 60,
    composure: 60,
    stamina: 60,
    groundstrokes: 60,
  })
  world.pendingTournament = {
    eventId: event.id,
    result: {
      eventId: event.id,
      matches: [{ round: 0, aId: KID_ID, bId: oppId, winnerId: oppId }],
      finishes: { [KID_ID]: Math.log2(TIERS[tier].drawSize) },
    },
    revealedRounds: 0,
    finished: false,
    players: {
      [KID_ID]: player(KID_ID, world.profile.kidName),
      [oppId]: player(oppId, oppName),
    },
  }
}

describe('round 41 #17 — the pro opponent renders a flag', () => {
  it('a W-tier opponent drawn from the field carries her own two-letter nation', () => {
    // ⚠ THE MUTATION THAT MUST FAIL THIS: put `world.cohort.find((c) => c.id === oppId)?.nation ?? ''`
    // back at the `oppNation` call site in world/snapshot.ts (i.e. drop the `isFieldProId` arm of
    // `playerNation`) and this arm goes red – nation `''`, flag `''`.
    const world = createWorld('r41-pro-flag')
    const pro = fieldProsOf(world)[0]
    expect(pro, 'the world has a professional field to draw from').toBeTruthy()
    expect(pro.id.startsWith('fp-'), 'and she is a field pro, not a cohort junior').toBe(true)
    expect(world.cohort.some((c) => c.id === pro.id), 'and she is NOT in the cohort').toBe(false)

    pendingAgainst(world, 'w15', pro.id, pro.name)
    const pending = toSnapshot(world).pending!

    expect(pending.opponent.nation).toBe(pro.nation)
    expect(pending.opponent.nation).toMatch(/^[A-Z]{2}$/)
    // What the screen actually draws (TournamentFlow.vue's two VS plates).
    expect(flagEmoji(pending.opponent.nation)).not.toBe('')
  })

  it('and a cohort opponent still carries hers – one population was not traded for the other', () => {
    const world = createWorld('r41-pro-flag')
    const junior = world.cohort[0]
    expect(junior.nation).toMatch(/^[A-Z]{2}$/)

    pendingAgainst(world, 'j300', junior.id, junior.name)
    const pending = toSnapshot(world).pending!

    expect(pending.opponent.nation).toBe(junior.nation)
    expect(flagEmoji(pending.opponent.nation)).not.toBe('')
  })

  it('the domestic re-flag rule is untouched – at home everyone wears hers (round 23 #10)', () => {
    // `entrantNationAt` still sits over the lookup; the fix only changed what it is HANDED. Guarded
    // because a lookup change at that call site is exactly the edit that could swallow the rule.
    const world = createWorld('r41-pro-flag')
    const foreign = world.cohort.find((c) => c.nation !== world.profile.country)!
    expect(foreign, 'the cohort is mixed, so the arm is not a tautology').toBeTruthy()

    pendingAgainst(world, 'national', foreign.id, foreign.name)
    expect(toSnapshot(world).pending!.opponent.nation).toBe(world.profile.country)
  })

  it('`playerNation` answers over both populations and empties only for a stranger', () => {
    const world = createWorld('r41-pro-flag')
    expect(playerNation(world, fieldProsOf(world)[3].id)).toBe(fieldProsOf(world)[3].nation)
    expect(playerNation(world, world.cohort[3].id)).toBe(world.cohort[3].nation)
    expect(playerNation(world, 'nobody-at-all')).toBe('')
  })
})
