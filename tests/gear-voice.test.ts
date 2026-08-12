// ⭐ WHERE THE RACKET CAME FROM – round-17 #17, 12.08.
//
// The owner read «New racket – used, off the classifieds» on a career with a sponsor, a full kit
// deal and $323,491 in the bank. His ruling: *the line is right for the years it was written for; it
// needs a precondition – need, or pre-sponsor – not deletion.* So the sentence still ships, and this
// file is about when it is allowed to be said.
//
// ⚠ THE TWO HALVES ARE TESTED SEPARATELY ON PURPOSE. `gearVoice` is the rule and is pure; the second
// block drives a REAL career with a signed deal through `tickWeek` until a racket actually lands,
// because "the rule is right" and "the ledger line changed" are different claims and the second one
// is what he read.
import { describe, it, expect } from 'vitest'
import { ECONOMY, gearVoice } from '../src/engine/economy'
import { createWorld, tickWeek } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, type KitLine } from '../src/shared/protocol'

describe('gearVoice – the precondition itself', () => {
  it('a covered line stops a working family shopping the classifieds', () => {
    expect(gearVoice('working', true)).toBe('middle')
  })

  it('an UNCOVERED line leaves it exactly as it was – this is the half that must not regress', () => {
    // The line is good writing and the owner said so. A local deal covers strings only, so the
    // frame is still the family's problem and still comes off the classifieds.
    expect(gearVoice('working', false)).toBe('working')
  })

  it('it steps up one rung and never down', () => {
    // A brand does not make a rich family's frames plainer, and nothing here may make a line poorer
    // than the family is. ⚠ Mutating the rule to `lineCoveredByBrand ? 'wealthy' : background`
    // fails on the first of these; to `background === 'working' ? 'middle' : background` (dropping
    // the coverage test) fails the uncovered case above.
    expect(gearVoice('middle', true)).toBe('middle')
    expect(gearVoice('wealthy', true)).toBe('wealthy')
    expect(gearVoice('middle', false)).toBe('middle')
    expect(gearVoice('wealthy', false)).toBe('wealthy')
  })
})

/** A working-class career holding a signed deal over `covers` with a real allowance. */
function workingCareerWithDeal(covers: KitLine[], seed = 'gear-voice') {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'working', coachTier: 'self' })
  world.offers.push({
    id: 'kit-test',
    kind: 'kit',
    week: 0,
    deadlineWeek: 4,
    state: 'signed',
    decidedWeek: 1,
    fromWeek: 0,
    untilWeek: 10_000,
    coveredCents: 0,
    terms: {
      tier: 'national',
      brand: 'Netrally Distribution',
      kitAllowanceCents: 50_000_00,
      freshCap: 0.3,
      // ⚠ ZERO, AND IT IS LOAD-BEARING. The season review at week 47 terminates a deal whose events
      // obligation was not met, and a career ticked from week 0 with no entries meets nothing – so
      // at 10 the deal died mid-fixture and the last rackets went back to the classifieds honestly.
      // The obligation is not what this file is about; a live deal is.
      minEventsPerSeason: 0,
      covers,
      travelShare: 0,
      seasons: 2,
    },
  } as (typeof world.offers)[number])
  return world
}

/** Every racket line the ledger recorded over `weeks`. */
function racketLines(world: ReturnType<typeof createWorld>, weeks = 60): string[] {
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return world.events.filter((e) => e.text.startsWith('New racket')).map((e) => e.text)
}

describe('the ledger line the owner actually read', () => {
  it('with the frame covered, no racket is ever bought off the classifieds again', () => {
    const lines = racketLines(workingCareerWithDeal(['frame', 'strings', 'shoes']))
    expect(lines.length, 'the fixture has to actually buy a racket or this asserts nothing').toBeGreaterThan(0)
    for (const line of lines) expect(line).not.toContain('off the classifieds')
    // ...and it says the true thing instead, with the brand where the brand paid.
    expect(lines.some((l) => l.includes('current retail model'))).toBe(true)
    expect(lines.some((l) => l.includes('on Netrally Distribution'))).toBe(true)
  })

  it('with only STRINGS covered, the frame is still hers to find – the line is not deleted', () => {
    const lines = racketLines(workingCareerWithDeal(['strings']))
    expect(lines.length).toBeGreaterThan(0)
    for (const line of lines) expect(line).toContain('off the classifieds')
  })

  it('with no deal at all, nothing about the early years changed', () => {
    const world = createWorld('gear-voice', { ...DEFAULT_PROFILE, background: 'working', coachTier: 'self' })
    const lines = racketLines(world)
    expect(lines.length).toBeGreaterThan(0)
    for (const line of lines) expect(line).toContain('off the classifieds')
  })

  it('⚠ THE DRAW IS UNTOUCHED – same weeks, same cents, deal or no deal', () => {
    // CLAUDE.md invariant 2. `gearHitForWeek` still takes `background` and nothing else, so the
    // `seed:gear:<category>` sub-stream cannot have moved. This is the assertion that says the copy
    // change stayed a copy change: if the voice had been wired into the draw, the two careers would
    // buy rackets in different weeks and this would go red.
    const plain = createWorld('gear-voice', { ...DEFAULT_PROFILE, background: 'working', coachTier: 'self' })
    const sponsored = workingCareerWithDeal(['frame', 'strings', 'shoes'])
    const weeksOf = (w: ReturnType<typeof createWorld>) => {
      const rng = rngFromSeed(w.seed)
      for (let i = 0; i < 60; i++) tickWeek(w, rng)
      return w.events.filter((e) => e.text.startsWith('New racket')).map((e) => e.week)
    }
    expect(weeksOf(sponsored)).toEqual(weeksOf(plain))
  })

  it('the three flavours are still all there – nothing was deleted from the table', () => {
    expect(ECONOMY.gear.rackets.flavor.working).toBe('New racket – used, off the classifieds')
    expect(ECONOMY.gear.rackets.flavor.middle).toBe('New racket – current retail model')
    expect(ECONOMY.gear.rackets.flavor.wealthy).toBe('New racket – custom pro stock')
  })
})
