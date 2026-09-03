import { describe, it, expect } from 'vitest'
import {
  createWorld,
  tickWeek,
  enterEvent,
  entryStatus,
  skipTournament,
  closeTournament,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { TIERS, TIER_LADDER } from '../../src/engine/season/calendar'
import { entrantNationAt, selectEntrants } from '../../src/engine/season/tournament'
import { computeRanking, BEST_N_BY_TRACK } from '../../src/engine/season/ranking'
import { cohortIds } from '../../src/engine/world/ladder'
import { rivalConditions } from '../../src/engine/season/rival'
import { KID_ID } from '../../src/engine/world'
import type { TierId } from '../../src/engine/season/types'

// =================================================================================================
// THE DOMESTIC LADDER IS HER COUNTRY'S – round 23 #10
// =================================================================================================
//
// The owner, 20.08: «Я просил уже как-то раз, чтобы local, Regional, national были все игроки с её
// домашним флагом, можешь сделать пожалуйста».
//
// ⚠ WHY THIS IS A LABEL TEST AND NOT A FIELD TEST, stated here because the obvious assertion – "the
// draw contains only her compatriots" – is the one that CANNOT hold and the next reader will
// otherwise try to write it. `NATION_POOL` is 118 weighted slots over 36 nations against a 199-strong
// cohort, so the deepest tennis nation we ship (US, weight 10) expects ~17 compatriots and one
// PLAYABLE country (BY) expects none at all – against draws of 8 / 16 / 32. Measured in
// tools/domestic-ladder-probe.ts §A, and the whole argument is on `entrantNationAt`. A filter would
// fall through `selectEntrants`' fillability ladder to "everybody eligible plays" and still not
// produce a home field.
//
// So what is guarded is the rule the game actually ships: at a DOMESTIC event every entrant wears
// her flag, at every other rung she wears her own – and each half is checked against a real draw
// with a real discriminator, so neither arm can pass by coincidence.

const DOMESTIC: TierId[] = ['local', 'regional', 'national']

/** The very table `drawAiEntrants` positions candidates by: all tracks in one pot, best-6, kid
 *  folded out (world.ts's `aiRanking`). Rebuilt here rather than imported because it is a local of
 *  `resolveWeek`; if it ever moves, this reads the same fold from the same ledger. */
function aiRankingOf(world: WorldState) {
  return computeRanking(
    world.results.filter((r) => r.playerId !== KID_ID),
    world.week,
    BEST_N_BY_TRACK.itf,
    cohortIds(world),
  )
}

describe('round 23 #10 — every entrant of a domestic draw carries her flag', () => {
  it('over a sweep of seeds, all three rungs: the raw draw is mixed, the flag at the event is hers', () => {
    // The discriminator for the whole sweep: if the cohort happened to be all-home the assertion
    // below would be a tautology. It is not, and this counter proves it on every run.
    let foreignInDomesticDraw = 0
    let drawsChecked = 0

    for (let s = 0; s < 8; s++) {
      const world = createWorld(`dom-flag-${s}`)
      const rng = rngFromSeed(world.seed)
      // A few weeks so the selection table is a real one and not the opening tie-floor.
      for (let i = 0; i < 6; i++) tickWeek(world, rng)
      const home = world.profile.country
      expect(home).toBeTruthy()

      const ranking = aiRankingOf(world)
      const conditions = rivalConditions(world.results, world.week)

      for (const tier of DOMESTIC) {
        const event = world.season.find((e) => e.tier === tier)
        expect(event, `seed ${s} has no ${tier} event`).toBeTruthy()
        const entrants = selectEntrants(
          event!,
          world.cohort,
          ranking,
          rngFromSeed(`${world.seed}:aitour:${event!.id}`),
          conditions,
        )
        expect(entrants.length).toBe(TIERS[tier].drawSize)
        drawsChecked++

        for (const p of entrants) {
          if (p.nation !== home) foreignInDomesticDraw++
          // THE RULE: at a domestic event she is one of hers.
          expect(entrantNationAt(tier, p.nation, home)).toBe(home)
        }
      }
    }

    expect(drawsChecked).toBe(24)
    // A domestic draw really is filled from a world field – that is what makes the rule above a
    // change and not a restatement. (Measured: ~3 of 32 entrants share her flag at the National.)
    expect(foreignInDomesticDraw).toBeGreaterThan(100)
  })

  it('and NOT at the international rungs — there she wears her own', () => {
    const world = createWorld('dom-flag-neg')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 6; i++) tickWeek(world, rng)
    const home = world.profile.country
    const ranking = aiRankingOf(world)
    const conditions = rivalConditions(world.results, world.week)

    let foreign = 0
    for (const tier of ['j30', 'j60', 'j300'] as TierId[]) {
      const event = world.season.find((e) => e.tier === tier)
      if (!event) continue
      const entrants = selectEntrants(
        event,
        world.cohort,
        ranking,
        rngFromSeed(`${world.seed}:aitour:${event.id}`),
        conditions,
      )
      for (const p of entrants) {
        expect(entrantNationAt(tier, p.nation, home)).toBe(p.nation)
        if (p.nation !== home) foreign++
      }
    }
    // The J tour is the international one, and this is the fact that makes it so.
    expect(foreign).toBeGreaterThan(0)
  })

  it('the rule spends no randomness and reads no world', () => {
    // Pure by construction – three arguments in, a string out. Stated as a test because the
    // alternative shapes considered (a `seed:host:` roll like `hostNationOf`, a filtered candidate
    // list) both move something, and this one must not.
    expect(entrantNationAt('national', 'JP', 'ES')).toBe('ES')
    expect(entrantNationAt('national', 'JP', 'ES')).toBe('ES')
    expect(entrantNationAt('j300', 'JP', 'ES')).toBe('JP')
    // No profile ⇒ her own flag rather than a blank one (a caller without a world degrades).
    expect(entrantNationAt('local', 'JP', '')).toBe('JP')
  })
})

describe('round 23 #10 — and the VS card is where he actually reads it', () => {
  it('a domestic reveal flies her flag; an international reveal flies the rival own', () => {
    // ⚠ THE MUTATION THAT MUST FAIL THIS: revert `oppNation` in world/snapshot.ts to
    // `world.cohort.find(...)?.nation` and the domestic arm below goes red on the first reveal whose
    // opponent is not a compatriot – which the discriminator guarantees there is one of.
    // ⚠⚠ RE-AIMED FROM ONE SEED TO A SWEEP (03.09, round 35 #14), AND IT IS STRICTLY STRONGER RATHER
    // THAN A SEED SWAP. This walked `dom-flag-vs` alone, and round 35 #14 – which makes the published
    // draw binding on the bracket – changed WHO she plays and therefore what her results open: that
    // one career now spends all 160 weeks on the domestic rungs and never reaches the J tour, so
    // `internationalSeen` fell to 0 and the international arm became unreachable. ⚠ MEASURED BEFORE
    // IT WAS RE-AIMED, because one seed moving is exactly what a systematic balance shift looks like
    // from inside one test: over 8 careers x 160 weeks the change is a WASH and if anything runs the
    // other way – round-one win rate 48.1% -> 49.6%, international events 75 -> 98, mean rank 62.6 ->
    // 66.1. So this is one career's luck, and a test whose claim depends on one career's luck is the
    // thing to fix.
    //
    // The sweep walks seeds until all three counters are satisfied and then stops. Every per-reveal
    // assertion below still runs on every reveal of every career it walks, so nothing is weakened –
    // what changes is that the arm can no longer be made vacuous by a career that never climbs.
    const SEEDS = ['dom-flag-vs', 'dom-flag-vs-2', 'dom-flag-vs-3', 'dom-flag-vs-4']
    const home = createWorld(SEEDS[0]).profile.country

    let domesticSeen = 0
    let internationalSeen = 0
    // The discriminator: a domestic reveal whose opponent's OWN nation is not hers. Without one the
    // domestic arm could pass on a coincidence.
    let domesticReflagged = 0

    const enterWhatSheCan = (w: WorldState): void => {
      const busy = new Set(w.season.filter((e) => w.entries.includes(e.id)).map((e) => e.week))
      const byRung = [...w.season].sort((a, b) => TIER_LADDER.indexOf(b.tier) - TIER_LADDER.indexOf(a.tier))
      for (const e of byRung) {
        if (e.week <= w.week || w.week > e.deadlineWeek) continue
        if (w.entries.includes(e.id) || busy.has(e.week)) continue
        if (entryStatus(w, e).level === 'blocked') continue
        enterEvent(w, e.id)
        return
      }
    }

    for (const seed of SEEDS) {
      if (domesticSeen > 3 && domesticReflagged > 0 && internationalSeen > 0) break
      const world = createWorld(seed)
      world.fundsCents = 9_999_999_00 // affordability is not what this test is about
      const rng = rngFromSeed(world.seed)
      const nationOf = new Map(world.cohort.map((p) => [p.id, p.nation]))
      expect(world.profile.country, 'every career in the sweep shares her home flag').toBe(home)
      enterWhatSheCan(world)
      for (let i = 0; i < 160; i++) {
        world.fundsCents = Math.max(world.fundsCents, 9_999_999_00)
        tickWeek(world, rng)
        if (world.pendingTournament) {
          const pending = toSnapshot(world).pending!
          // The opponent the card is showing: nothing is revealed yet, so it is her FIRST match –
          // the same row `pendingView` reads at `revealedRounds === 0`.
          const first = world.pendingTournament.result.matches
            .filter((m) => m.aId === KID_ID || m.bId === KID_ID)
            .sort((a, b) => a.round - b.round)[0]
          const oppId = first ? (first.aId === KID_ID ? first.bId : first.aId) : undefined
          const ownNation = oppId ? nationOf.get(oppId) : undefined

          // ⚠ ROUND 26 #6 RE-AIM: `PendingView.tier` is nullable now (the College League walks the
          // same view with no rung). This arm is `world.pendingTournament`, a TOUR reveal by
          // construction, so the rung is asserted present rather than defaulted – see the note in
          // tests/ladder-separation.test.ts for why a null here would be a real regression.
          expect(pending.tier, 'a tour reveal always names its rung').not.toBeNull()
          if (TIERS[pending.tier!].track === 'domestic') {
            domesticSeen++
            expect(pending.opponent.nation).toBe(home)
            if (ownNation !== undefined && ownNation !== home) domesticReflagged++
          } else if (ownNation !== undefined) {
            internationalSeen++
            // Untouched: the international rungs are the international ones.
            expect(pending.opponent.nation).toBe(ownNation)
          }

          skipTournament(world)
          closeTournament(world)
        }
        enterWhatSheCan(world)
      }
    }

    expect(domesticSeen, 'the sweep never reached a domestic tournament').toBeGreaterThan(3)
    expect(domesticReflagged, 'every domestic opponent happened to be a compatriot – no discriminator').toBeGreaterThan(0)
    expect(internationalSeen, 'the sweep never reached an international tournament').toBeGreaterThan(0)
  })
})
