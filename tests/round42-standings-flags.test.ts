import { describe, it, expect } from 'vitest'
import { createWorld, tickWeek, KID_ID, type WorldState } from '../src/engine/world'
import { computeStandings } from '../src/engine/world/snapshot'
import { fieldProsOf, rankingFor } from '../src/engine/world/ladder'
import { isFieldProId } from '../src/engine/season/fieldPros'
import { flagEmoji } from '../src/composables/countries'
import { rngFromSeed } from '../src/engine/rng'
import type { LadderTrack } from '../src/engine/season/types'

// =================================================================================================
// ROUND 42 #14 – NO ROW IN ANY STANDINGS TABLE IS FLAGLESS
// =================================================================================================
//
// The owner, 14.09, third time of asking: «всё ещё некоторые игроки в общем рейтинге без флагов, я
// уже просил». Round 23 #10 re-flagged the domestic draws; round 41 #17 gave the professional
// opponent on the VS card her own nation (`playerNation`). This is the net under the tables.
//
// ⚠⚠ WHAT THE MEASUREMENT SAID, BECAUSE IT DECIDES WHAT THESE ARMS CAN AND CANNOT CLAIM. The
// producer this round names – `computeStandings`' field-pro pre-pass guarded by `if (track ===
// 'wta')` – is a LATENT trap rather than a live one at head: `rankingFor` filters the domestic and
// ITF rosters to `cohortIds(world) + KID_ID` (world/ladder.ts), so no `fp-…` id can reach either
// table today. Measured before the change and again after it: 4 seeded careers x 420 weeks and the
// owner's own week-517 save print ZERO blank rows on all three tables either way. So arm 1 below is
// a REGRESSION NET that passes on the shipped code and says so; arm 2 is the one with teeth, and it
// is mutation-proven against the class the owner actually reported.
//
// ⚠ THE COLLEGE LEAGUE IS EXCEPTED AND STAYS EXCEPTED. `collegeLeagueOpponent`'s blank is a fact
// about a student field, stated in its own words («a tie is her country against another country and
// the shirt is the point of it; a student draw is not that»), and it is not a standings row at all.

const TRACKS: LadderTrack[] = ['domestic', 'itf', 'wta']

/** Every row the Stats table would draw, on every table, with the id that produced it. */
function blankRows(world: WorldState): string[] {
  const out: string[] = []
  for (const track of TRACKS) {
    for (const r of computeStandings(world, track)) {
      if (!r.nation) out.push(`${track} #${r.rank} ${r.playerId} (${r.name})`)
      // ...and the raw-id tell that goes with it: `enrich`'s last-resort fallback names a row after
      // its own id, which is how "ai-153, 1715 pts" reached the screen before the roster filter
      // (season/ranking.ts). A row named after its id has no nation either, so the two travel
      // together and are worth catching together.
      else if (r.name === r.playerId) out.push(`${track} #${r.rank} ${r.playerId} – named after its id`)
    }
  }
  return out
}

describe('round 42 #14 — every standings row carries a nation', () => {
  it('a walked career prints no blank nation on any of the three tables', () => {
    // A REAL world, ticked – not a hand-built one. The two junior tables need her to have played for
    // their rows to mean anything, and the W table is populated from week 0 by construction (1,600
    // derived chairs), so this covers all three with one walk.
    const world = createWorld('r42-standings-flags')
    const rng = rngFromSeed('r42-standings-flags:walk')
    expect(blankRows(world), 'week 0').toEqual([])
    for (let w = 0; w < 60; w++) {
      tickWeek(world, rng)
      expect(blankRows(world), `week ${world.week}`).toEqual([])
    }
  })

  it('the professional table names its derived rows – nation, flag and all', () => {
    // ⚠ THE MUTATION THAT MUST FAIL THIS: drop the field-pro resolution from `computeStandings`
    // (delete the `?? proMeta(r.playerId)` arm of `enrich`, world/snapshot.ts) and this arm goes red –
    // every fp row falls to `{ name: r.playerId, nation: '' }`, i.e. "fp-141" with no flag, which is
    // exactly what the owner is reporting one surface along.
    const world = createWorld('r42-pro-rows')
    const top = computeStandings(world, 'wta')
    const derived = top.filter((r) => isFieldProId(r.playerId))
    // The discriminator: without derived rows in the window the assertions below are vacuous.
    expect(derived.length, 'the W window is made of field pros before she has a book').toBeGreaterThan(5)

    const byId = new Map(fieldProsOf(world).map((p) => [p.id, p]))
    for (const r of derived) {
      const pro = byId.get(r.playerId)
      expect(pro, `${r.playerId} is a row of this season's field`).toBeDefined()
      expect(r.nation, `${r.playerId}'s nation`).toBe(pro!.nation)
      expect(r.nation).toMatch(/^[A-Z]{2}$/)
      expect(r.name, `${r.playerId} is named after a person, not after her id`).toBe(pro!.name)
      // What a screen would actually draw if the table ever grew the column.
      expect(flagEmoji(r.nation)).not.toBe('')
    }
  })

  it('and the lookup is asked by POPULATION, never by track – the junior tables admit no derived row', () => {
    // The other half of the same claim, and the reason arm 1 cannot be mutation-proven: the ITF and
    // domestic tables are rostered to the live cohort plus the kid, so the field-pro arm is
    // unreachable there. Pinning THAT is what keeps arm 1 honest – the day this expectation breaks,
    // a derived row has reached a junior table and arm 1 becomes the live net it is written to be.
    const world = createWorld('r42-junior-roster')
    for (const track of ['domestic', 'itf'] as LadderTrack[]) {
      const ids = rankingFor(world, track).map((r) => r.playerId)
      expect(ids.some(isFieldProId), `${track} is rostered to the cohort and the kid`).toBe(false)
      expect(ids).toContain(KID_ID)
    }
    // ...while the W table is the merged one, which is what makes the resolution necessary at all.
    expect(rankingFor(world, 'wta').some((r) => isFieldProId(r.playerId))).toBe(true)
  })
})
