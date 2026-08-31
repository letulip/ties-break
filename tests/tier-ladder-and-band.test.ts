// ROUND 31 #3 – THE TIER LADDER AND THE FIELD-STRENGTH BAND, AT A DEPTH WHERE THEY CAN BE WRONG.
//
// ⚠⚠ THE HORIZON IS THE TEST. `tests/preview.test.ts` has asserted since wave 2 that "a stronger
// tier is a harder field: J30 reads worse than Local for the same girl" and that "the field reads
// STRONGER at the top of the ladder than at the bottom" – both true, both green, and both blind to
// the defect the owner reported on his w896 save, because both run at WEEK ZERO. At week zero the
// cohort is the 13-19 it was generated as and the junior standings still sort it.
//
// The defect needs the world the CONVEYOR is designed to reach. `season/conveyor.ts` replaces every
// departure with a fresh thirteen-year-old and keeps a professional alive for "~9 seasons of mean
// career, which is what makes half the field adults in the steady state" – so by week 450 a third of
// the cohort is over nineteen, none of them has an ITF junior point (the J rungs are U18), and the
// bottom of the junior table is therefore where the STRONGEST players in the world sit. Measured on
// the shipped engine at weeks 400-500, three careers, 1,122 cards:
//
//     Local Open 66%   Regional 68%   National 80%     – the ladder, upside down
//     every single card reads `strong`, and 91% of them show a ring ABOVE 50% while saying so
//
// Both numbers are reproduced by this file's own world, which is why it exists rather than a note in
// the spec. It costs ~2.5 s: two careers ticked 450 weeks with no player actions, then eight sampled
// snapshots each. Nothing here is a source pin – every claim is read off the SCREEN's own call,
// `upcomingEvents`, so a refactor that keeps the behaviour keeps the test.
//
// THE TWO CLAIMS, and each has a way of going quietly wrong:
//
//   1. A CHEAPER RUNG IS AN EASIER FIRST ROUND. Fails silently, because the card is honest about a
//      field the tournament was never going to field – the preview positioned candidates on a table
//      whose Spearman against actual strength is 0.11.
//   2. THE BAND AND THE RING CANNOT POINT OPPOSITE WAYS. Fails silently too, and it is the one the
//      owner would report: a card that says most of this field is above her, beside a ring that says
//      she wins. `strong` means at least three quarters of the entrants outrate her, so the girl she
//      draws out of that field must USUALLY beat her - a share far below half, not 91%.
import { describe, it, expect } from 'vitest'
import { createWorld, tickWeek } from '../src/engine/world'
import { upcomingEvents } from '../src/engine/world/snapshot'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import type { LadderTrack, TierId } from '../src/engine/season/types'
import type { FieldStrength } from '../src/engine/season/preview'

/** ⚠ DEEP ENOUGH FOR THE CONVEYOR TO HAVE TURNED THE FIELD OVER, and no deeper. 450 weeks is
 *  ~8.6 seasons; the defect is fully present from about week 400 (measured, see the header) and the
 *  cost is linear in this number. */
const WEEKS = 450
/** Sampled, not every week: a snapshot is 39 ms and a tick is 3.5 ms, so observing every week would
 *  cost fifteen times what the ticking does and add nothing – consecutive weeks show nearly the same
 *  cards. */
const SAMPLE_EVERY = 8
const SAMPLES = 12
const SEEDS = ['ladder-depth-a', 'ladder-depth-b'] as const

interface Card {
  tier: TierId
  band: FieldStrength
  chance: number
  eligible: boolean
}

/** ⚠⚠ AND THE GIRL IS READ TWICE, AT TWO STRENGTHS, WHICH IS A FIXTURE DECISION AND NOT A FUDGE.
 *  A career ticked with NO PLAYER ACTIONS still trains her every week, so by week 450 she is rated
 *  ~1910 against fields of 1350-1850 – genuinely the favourite everywhere, on every rung. A band
 *  that correctly says `favourite` 100% of the time cannot demonstrate that it discriminates, and
 *  neither can it be shown NOT to contradict a ring it always agrees with. So each sampled week is
 *  read twice: once with the girl this career actually grew, and once with the same five skills
 *  scaled to `WEAKENED` – a player the field is genuinely better than. One world, one set of
 *  fields, two vantage points, and the band has to be right from both.
 *
 *  It is a pure re-read: `upcomingEvents` draws nothing and mutates nothing (pinned in
 *  tests/preview.test.ts), so restoring the skills leaves the career byte-identical and the ticking
 *  below is unaffected. */
const WEAKENED = 0.72

/** Two careers, ticked with no player actions, sampled near the end. Built ONCE for the whole file –
 *  the ticking is the cost and every test below asks a different question of the same cards. */
const cards: Card[] = (() => {
  const out: Card[] = []
  for (const seed of SEEDS) {
    const world = createWorld(seed)
    const rng = rngFromSeed(`${seed}:bench`)
    const firstSample = WEEKS - SAMPLE_EVERY * SAMPLES
    for (let w = 0; w < WEEKS; w++) {
      if (w >= firstSample && (w - firstSample) % SAMPLE_EVERY === 0) {
        const grew = { ...world.skills }
        for (const scale of [1, WEAKENED]) {
          world.skills = {
            serve: grew.serve * scale,
            ret: grew.ret * scale,
            composure: grew.composure * scale,
            stamina: grew.stamina * scale,
            groundstrokes: grew.groundstrokes * scale,
          }
          for (const e of upcomingEvents(world)) {
            // ⚠ A CARD WITH NO RING IS NOT A READING OF ONE. `firstMatchChance` is typed `number`
            // here and `number | null` on the draw-reveal branch, where a card further out than the
            // draw shows no percentage at all; skipping a null keeps this file true on both.
            const chance = e.preview.firstMatchChance as number | null
            if (chance === null) continue
            out.push({ tier: e.tier, band: e.preview.fieldStrength, chance, eligible: !!e.eligible })
          }
        }
        world.skills = grew
      }
      tickWeek(world, rng)
    }
  }
  return out
})()

const mean = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length
const forTier = (t: TierId) => cards.filter((c) => c.tier === t)
const forBand = (b: FieldStrength) => cards.filter((c) => c.band === b)

describe('round 31 #3 – a cheaper rung is an easier first round', () => {
  it('the world under test is actually the deep one, or every claim below is vacuous', () => {
    // ⚠ THE PROVENANCE CHECK CLAUDE.md DEMANDS OF A NULL RESULT, run in advance: if the sampling
    // ever stops producing cards, or stops producing them at the DOMESTIC rungs, the two tests
    // below pass by having nothing to measure. That is the failure mode this whole file exists to
    // avoid, so it is asserted rather than assumed.
    expect(cards.length).toBeGreaterThan(400)
    for (const tier of ['local', 'regional', 'national'] as const) {
      expect(forTier(tier).length, `${tier} cards observed`).toBeGreaterThan(10)
    }
  })

  it.each<[LadderTrack]>([['domestic']])(
    'the %s ladder does not get easier as it gets dearer',
    (track) => {
      // ⚠ PER FAMILY, and the cross-family step is deliberately NOT a claim. `TIER_LADDER` runs the
      // domestic rungs into the ITF ones into the professional ones, but a World Tour 15 is the
      // first rung of a DIFFERENT tour and reads easier than a junior Slam feeder on purpose – the
      // same disagreement between prestige and production scale that `CROWD_BANDS` is banded on.
      // Within one family the claim is unambiguous: the dearer rung is the harder week.
      //
      // ⚠⚠ AND THE LIST IS `domestic` ALONE BECAUSE THE ITF FAMILY STILL INVERTS AT ITS TOP, FOR A
      // DIFFERENT AND UNFIXED REASON. Measured on this very fixture at n=40, a J300 reads 62%
      // against a J60's 57% – persistent, not noise – and the cause is the AVAILABILITY FLOOR, not
      // the table this wave repaired: `ECONOMY.availability.minConditionToEnter.j300` is the highest
      // in the game and the top quarter of the field is the most exhausted, so only 36-82% of a
      // J300's own entrant window is fit in any given week and `selectEntrants`' backfill fills the
      // rest from BELOW (measured 66% of a J300 draw on the owner's w896 save). That is the
      // "a wrecked elite hands its slots to the tier below" path working exactly as its own comment
      // describes, and unwinding it is a balance change with its own bench and its own spec. It is
      // recorded in docs/specs/tier-ladder-and-band.md §5 rather than asserted here, because a test
      // that fails for a defect nobody has agreed to fix is a broken gate, not a finding.
      const rungs = TIER_LADDER.filter((t) => TIERS[t].track === track && forTier(t).length > 10)
      expect(rungs.length, `${track} rungs with enough cards`).toBeGreaterThan(1)
      const inversions: string[] = []
      for (let i = 1; i < rungs.length; i++) {
        const cheaper = mean(forTier(rungs[i - 1]).map((c) => c.chance))
        const dearer = mean(forTier(rungs[i]).map((c) => c.chance))
        // A tolerance, because two adjacent rungs of one family can legitimately sit within noise of
        // each other – what may not happen is a rung reading materially EASIER than the one below
        // it. Measured on the shipped engine the domestic ladder inverts by 2 and 12 points; after
        // the fix it runs 80 / 76 / 72 downwards.
        if (dearer > cheaper + 0.02) {
          inversions.push(
            `${rungs[i]} ${(dearer * 100).toFixed(0)}% is easier than ${rungs[i - 1]} ${(cheaper * 100).toFixed(0)}%`,
          )
        }
      }
      expect(inversions, `${track}: ${inversions.join(' | ')}`).toHaveLength(0)
    },
  )
})

describe('round 31 #3 – the band and the ring cannot point opposite ways', () => {
  it('a `strong` card is one she USUALLY loses, which is what the word means', () => {
    // ⭐ THE CLAIM IS DERIVABLE, NOT A TUNING TARGET. `strong` is assigned when at least 75% of the
    // entrants outrate her, and her round-one opponent is drawn from that field – so the share of
    // `strong` cards on which she is the FAVOURITE (ring above 50%) has to be small. Seeding makes
    // it not exactly 25%, which is why the bound is loose; what it catches is the shipped engine's
    // **91%**, where the card said `strong` and the ring said she wins on nine cards in ten.
    const strong = forBand('strong')
    expect(strong.length, 'no `strong` card was observed at all – the band is degenerate the other way').toBeGreaterThan(10)
    const favouredAnyway = strong.filter((c) => c.chance > 0.5).length / strong.length
    expect(favouredAnyway).toBeLessThan(0.35)
  })

  it('a `favourite` card is one she USUALLY wins', () => {
    const fav = forBand('favourite')
    expect(fav.length, 'no `favourite` card was observed at all').toBeGreaterThan(10)
    expect(fav.filter((c) => c.chance > 0.5).length / fav.length).toBeGreaterThan(0.65)
  })

  it('the three bands are ordered by the ring they sit beside', () => {
    // The weakest form of the same property and the one a player actually reads: whatever the exact
    // shares, a card that leans her way must on average show a better number than one that does not.
    const rings = (['favourite', 'even', 'strong'] as const).map((b) => {
      const g = forBand(b)
      return g.length ? mean(g.map((c) => c.chance)) : null
    })
    const seen = rings.filter((r): r is number => r !== null)
    expect(seen.length, 'fewer than two bands ever occur – nothing to order').toBeGreaterThan(1)
    for (let i = 1; i < seen.length; i++) expect(seen[i]).toBeLessThanOrEqual(seen[i - 1])
  })

  it('the band is not one word: it discriminates across the cards she can enter', () => {
    // ⚠ THE DEFECT THIS REPLACES, stated as its own test. Before round 31 #3 every junior and every
    // domestic card read `strong` – on the shipped engine at this depth, 1,122 of 1,122 – so the
    // band carried no information at exactly the rungs it is the ONLY information on (round 31 #4
    // made it the whole of a pre-draw card). A band that takes one value cannot be planned against,
    // which is what the owner asked it for.
    const enterable = cards.filter((c) => c.eligible)
    expect(enterable.length, 'no enterable card observed').toBeGreaterThan(50)
    const distinct = new Set(enterable.map((c) => c.band))
    expect(distinct.size, `only ${[...distinct].join('/')} ever occurs on an enterable card`).toBeGreaterThan(1)
  })
})
