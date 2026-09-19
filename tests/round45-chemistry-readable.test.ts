// ⭐⭐⭐ ROUND 45 #4 – THE READABLE THRESHOLD IS THE PAIR'S OWN, AND IT IS DRAWN (spec §8d, 18.09).
//
// The owner, having played the shipped single bar of 5: «мне кажется медленно, какие-то цифры, пусть
// и небольшие 1-2% мы всяко может раньше видеть. Но здесь тоже можно включить вариативность.»
//
// Two instructions in one sentence, and the second is this wave's standing design law – «вариативность
// и неожиданность… но при этом математика и стабильность – мы можем воспроизвести все вариации и
// подтвердить, что они возможны». So the bar was not lowered, it was DRAWN, and this file is the
// «математика и стабильность» half: every claim below is about reproducibility, purity and range. The
// «вариативность» half is a frequency and belongs to the bench (B12 in tools/chemistry-bench.ts),
// whose table is written into the spec's 18.09 addendum.
//
// WHAT THIS FILE PINS, in the order the law asks for it:
//   1. THE CORRIDOR      every draw lands inside `readableFloor .. readableCeiling`, and the corridor
//                        is the owner's own `ceilingAtNone` read at 1/5 and 1/2.
//   2. REPRODUCIBILITY   same career, same coach, same number – for ever, in any call order, with any
//                        other derivation interleaved.
//   3. VARIABILITY       it really does differ between coaches and between careers, and it fills the
//                        corridor rather than clustering in it.
//   4. PURITY            it is a function of (seed, coachId) and of nothing else the player can move,
//                        and it persists nothing.
//   5. RNG DISCIPLINE    a purpose-scoped sub-stream, distinct from the affinity's, and ZERO draws on
//                        MAIN (CLAUDE.md invariant 2).
//   6. THE GATE          `chemistryReading` is null under this pair's bar and the level at or past it.
//
// ⚠⚠ MUTATION ARMS – each APPLIED to the real engine and RUN against this file, each red MEASURED:
//   ARM 1  the corridor collapsed (`readableCeiling: 1`)              -> RED [5] – it reaches further
//          than the two variability cases, and honestly so: a corridor of one point is also not
//          `ceilingAtNone / 2`, also does not split a roster at its own midpoint, and also makes the
//          two ends of the gate the same number
//   ARM 2  the stream keyed on `${seed}:chemistry:${coachId}` – i.e.
//          the AFFINITY's key reused instead of a purpose-scoped one  -> RED [1] (the stream case)
//   ARM 3  the key given the week (`...:${coachId}:${0}`)             -> RED [1] (the stream case)
//   ARM 4  `chemistryReading` gated on the floor instead of the draw  -> RED [2] (the gate, and the
//          «two cards read the same level differently» case, which is the whole item)
import { describe, it, expect } from 'vitest'
import { createWorld, toSnapshot } from '../src/engine/world'
// ⚠ THE LEAF DIRECTLY, not the barrel: `chemistryReading` is `coachMarket`'s own reader and is not
// part of the engine's public surface, which is exactly how round 44's own file reaches it.
import { affinityFor, chemistryReadableAt, chemistryReading, freshCoachPair } from '../src/engine/chemistry'
import { buildCoachRoster } from '../src/engine/coach'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

const FLOOR = ECONOMY.chemistry.readableFloor
const CEILING = ECONOMY.chemistry.readableCeiling

/** Every (career, coach) pair a sweep needs, built off the real roster rather than off made-up ids –
 *  the ids are what the stream is keyed on, so inventing them would measure a different key. */
function sweep(careers = 60, perCareer = 14): { seed: string; coachId: string }[] {
  const out: { seed: string; coachId: string }[] = []
  for (let i = 0; i < careers; i++) {
    const seed = `r45-read-${i}`
    for (const coach of buildCoachRoster(seed, perCareer)) out.push({ seed, coachId: coach.id })
  }
  return out
}

describe('round 45 #4 §1 – the corridor is his own anchor, read at two more points', () => {
  it('⭐ the two ends are `ceilingAtNone` at a fifth and at a half, and nothing else was invented', () => {
    // The single bar WAS `ceilingAtNone` by derivation («five points is the whole of what an ordinary
    // pair's year can gain»); the corridor is the same anchor read twice more, so no agent picked a
    // number here. A pin rather than a comment: an agent tuning the corridor to taste has to delete
    // this line, and deleting it is a visible act.
    expect(FLOOR, 'the floor is a fifth of an ordinary pair\'s year').toBeCloseTo(ECONOMY.chemistry.ceilingAtNone / 5, 10)
    expect(CEILING, 'and the ceiling is a half of it').toBeCloseTo(ECONOMY.chemistry.ceilingAtNone / 2, 10)
    // ⚠ AND THE FLOOR MAY NOT GO BELOW 1, which is a constraint of the SCREEN and not of the model:
    // the card rounds the level to a whole number, so a threshold under 0.5 would first be drawn as
    // «0%» – and «0%» is the neutral's own sentence, «nothing has happened yet» (§8a). The owner asked
    // to see «1-2%», and 1 is the lowest bar at which that is what the card can say.
    expect(FLOOR, 'the lowest bar whose first reading is not drawn as zero').toBeGreaterThanOrEqual(1)
  })

  it('⭐ every draw lands inside the corridor, on a whole sweep of real rosters', () => {
    const pairs = sweep()
    expect(pairs.length, 'not vacuous – there are pairs to measure').toBeGreaterThan(500)
    for (const { seed, coachId } of pairs) {
      const bar = chemistryReadableAt(seed, coachId)
      expect(bar, `${seed}/${coachId}`).toBeGreaterThanOrEqual(FLOOR)
      expect(bar, `${seed}/${coachId}`).toBeLessThanOrEqual(CEILING)
    }
  })
})

describe('round 45 #4 §2 – reproducible, which is the other half of his law', () => {
  it('⭐⭐ the same career and the same coach give the same number, in any call order', () => {
    const { seed, coachId } = sweep(1)[0]
    const first = chemistryReadableAt(seed, coachId)
    // ...called again immediately, and again after every other derivation in this module has run in
    // between. A generator that persisted a position would drift here; this one is re-derived.
    expect(chemistryReadableAt(seed, coachId)).toBe(first)
    for (const other of sweep(3)) chemistryReadableAt(other.seed, other.coachId)
    affinityFor(seed, coachId, 'fiery', 'warm')
    expect(chemistryReadableAt(seed, coachId), 'nothing between the two calls could move it').toBe(first)
  })

  it('⭐⭐ ...and it does not depend on the WORLD, so no choice of the player\'s can move it', () => {
    // Input-independence read literally, `affinityFor`'s own rule: a player who hires in week one and
    // a player who shops the market for a decade meet the same schedule. The function takes a seed and
    // an id and nothing else, and these two worlds differ in everything the profile can differ in.
    const seed = 'r45-read-world'
    const a = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'budget', background: 'working' })
    const b = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'high', background: 'wealthy' })
    expect(a.seed).toBe(b.seed)
    for (const coach of buildCoachRoster(seed, 14)) {
      expect(chemistryReadableAt(a.seed, coach.id)).toBe(chemistryReadableAt(b.seed, coach.id))
    }
  })
})

describe('round 45 #4 §3 – and it really does vary, which is what he asked for', () => {
  it('⭐⭐ the thresholds differ between coaches and between careers, and they FILL the corridor (ARM 1)', () => {
    const bars = sweep().map(({ seed, coachId }) => chemistryReadableAt(seed, coachId))
    const unique = new Set(bars.map((b) => b.toFixed(6)))
    expect(unique.size, 'a corridor that produced one number would be the old bar in a new coat').toBeGreaterThan(
      bars.length * 0.9,
    )
    // ⚠ FILLED RATHER THAN MERELY SPREAD. A draw that clustered in the middle would give every career
    // nearly the same schedule while passing a bare min/max check, so the corridor is measured in
    // QUARTERS: a flat draw puts about a quarter of the pairs in each, and nothing may be empty.
    const quarter = (i: number) =>
      bars.filter((b) => b >= FLOOR + ((CEILING - FLOOR) * i) / 4 && b < FLOOR + ((CEILING - FLOOR) * (i + 1)) / 4)
        .length / bars.length
    for (let i = 0; i < 4; i++) {
      expect(quarter(i), `quarter ${i + 1} of the corridor holds ${(quarter(i) * 100).toFixed(1)}% of the pairs`)
        .toBeGreaterThan(0.18)
      expect(quarter(i), `quarter ${i + 1} of the corridor holds ${(quarter(i) * 100).toFixed(1)}% of the pairs`)
        .toBeLessThan(0.32)
    }
  })

  it('⭐ ...and one career\'s own roster is not one schedule either', () => {
    // The variability the player actually meets is WITHIN his career – sixteen coaches whose cards
    // light at sixteen different times. A per-CAREER draw would pass the sweep above and fail this.
    const seed = 'r45-read-one'
    const bars = buildCoachRoster(seed, 14).map((c) => chemistryReadableAt(seed, c.id))
    expect(new Set(bars.map((b) => b.toFixed(6))).size, 'one roster, many schedules').toBe(bars.length)
    expect(Math.max(...bars) - Math.min(...bars), 'and they are spread across most of the corridor').toBeGreaterThan(
      (CEILING - FLOOR) * 0.5,
    )
  })
})

describe('round 45 #4 §4 – RNG discipline (CLAUDE.md invariant 2)', () => {
  it('⭐⭐ a PURPOSE-SCOPED sub-stream, and not the affinity\'s (ARM 2, ARM 3)', () => {
    // The key is `${seed}:chemistry:readable:${coachId}`. Two things have to be true of it and they
    // fail differently: it must be its OWN stream – reusing the affinity's key would make a pair's
    // disposition and its visibility the same draw, so every click would also be an early reading –
    // and it must not carry the week, or the threshold would move under the player every tick.
    const seed = 'r45-read-rng'
    for (const coach of buildCoachRoster(seed, 8)) {
      const mine = rngFromSeed(`${seed}:chemistry:readable:${coach.id}`)()
      expect(chemistryReadableAt(seed, coach.id), 'the documented key, and this is the one it uses').toBeCloseTo(
        FLOOR + (CEILING - FLOOR) * mine,
        12,
      )
      // ...and that stream is not the affinity's, nor a weekly one.
      const affinityStream = rngFromSeed(`${seed}:chemistry:${coach.id}`)()
      const weeklyStream = rngFromSeed(`${seed}:chemistry:${coach.id}:1`)()
      expect(mine, 'its own stream, not the disposition\'s').not.toBeCloseTo(affinityStream, 9)
      expect(mine, 'and not a weekly one').not.toBeCloseTo(weeklyStream, 9)
    }
  })

  it('⭐⭐ ZERO DRAWS ON MAIN – a stream walked with and without this derivation is the same stream', () => {
    // The fairness property, in its own terms. The threshold cannot reach MAIN because it builds its
    // own generator from a string, and this is that stated as a measurement rather than as a promise:
    // two identical MAIN walks, one of them with a threshold read on every step.
    const seed = 'r45-read-main'
    const roster = buildCoachRoster(seed, 8)
    const quiet = rngFromSeed(seed)
    const busy = rngFromSeed(seed)
    const a: number[] = []
    const b: number[] = []
    for (let i = 0; i < 200; i++) {
      a.push(quiet())
      chemistryReadableAt(seed, roster[i % roster.length].id)
      chemistryReading({ chem: 3, phase: 0, standing: 0 }, seed, roster[i % roster.length].id)
      b.push(busy())
    }
    expect(b, 'the player\'s screen reading a card may not re-roll the world\'s dice').toEqual(a)
  })
})

describe('round 45 #4 §5 – the gate itself, and the card is told the answer and never the bar', () => {
  it('⭐⭐ null under this pair\'s own bar, the level at it and past it (ARM 4)', () => {
    const seed = 'r45-read-gate'
    for (const coach of buildCoachRoster(seed, 8)) {
      const bar = chemistryReadableAt(seed, coach.id)
      const at = (chem: number) => chemistryReading({ chem, phase: 0, standing: 0 }, seed, coach.id)
      expect(at(bar - 1e-9), `just under ${coach.id}'s bar`).toBeNull()
      expect(at(-(bar - 1e-9)), 'and just under it downward').toBeNull()
      expect(at(bar), 'at the bar the reading is the level itself').toBe(bar)
      expect(at(-bar), 'and downward it keeps its sign').toBe(-bar)
      expect(at(100)).toBe(100)
      // A pair that does not exist is the other silence, and it is the same glyph on the card.
      expect(chemistryReading(undefined, seed, coach.id), 'never worked with him').toBeNull()
      // A fresh pair has nothing to read, whatever its bar is – zero is under every bar in the corridor.
      expect(chemistryReading(freshCoachPair(), seed, coach.id), 'they started this week').toBeNull()
    }
  })

  it('⭐⭐ THE BARS REALLY DIFFER AT THE GATE, so the same level reads differently on two cards', () => {
    // The whole item, as one observable fact. Take a level inside the corridor: some coaches' cards
    // show it and others do not, in the SAME career, because their thresholds were drawn apart. This
    // is the case a per-career (or a constant) threshold cannot pass.
    const seed = 'r45-read-split'
    const roster = buildCoachRoster(seed, 14)
    const level = (FLOOR + CEILING) / 2
    const shown = roster.filter((c) => chemistryReading({ chem: level, phase: 0, standing: 0 }, seed, c.id) !== null)
    expect(shown.length, 'somebody on this roster already reads at the corridor\'s midpoint').toBeGreaterThan(0)
    expect(shown.length, '...and somebody does not').toBeLessThan(roster.length)
  })

  it('⭐ and the SNAPSHOT carries the answer and never the threshold', () => {
    // §8b's own fence, re-checked because this item gave the gate a new degree of freedom: a bar on
    // the wire would let a player read how long his own card has left to wait, which is the forecast
    // the whole anti-shopping argument is about.
    const world = createWorld('r45-read-wire', { ...DEFAULT_PROFILE, coachTier: 'middle' })
    const coachId = world.coachId!
    world.coachPairs[coachId] = { chem: 42, phase: 0.3, standing: 0 }
    const row = toSnapshot(world).coachMarket.find((r) => r.current)!
    expect(row.chemistry, 'the answer crosses').toBe(42)
    expect(Object.keys(row), 'and nothing else about the relationship does').not.toContain('readableAt')
    expect(JSON.stringify(row), 'no threshold, no phase, no standing on the wire').not.toContain(
      String(chemistryReadableAt(world.seed, coachId)),
    )
  })
})
