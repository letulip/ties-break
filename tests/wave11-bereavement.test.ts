// =================================================================================================
// WAVE 11, T5 – A DEATH IN THE FAMILY: THE WORLD'S DICE, THE UNNAMED KIN, AND THE FUNERAL FRAME
// =================================================================================================
//
// `docs/specs/the-weight-2026-09.md` §4 and §5, his 23.08 «вплести похороны» and the numbers he
// drafted on 11.09, RULED as drafted constants on 22.09 (question 3).
//
// ⚠⚠ TWO DESIGN LAWS WITH PINS, AND THEY ARE WHY THIS FILE EXISTS:
//   §B  THE HAZARD IS TEMPERAMENT-FREE. «A death is the world's dice, never her personality's» –
//       so `bereavementChanceAt` takes no arguments at all, and §B sweeps all four voices on shared
//       seeds and asserts the weeks it lands on are identical.
//   §D  THE PSYCHOLOGIST NEEDED NOTHING. Step 5 built him to read «is a shock live» rather than
//       which kind, so his help on a bereavement week must be exactly the help he gives on a
//       break-up week. A wave that had to touch him would have got the seam wrong.
//
// ⚠⚠ EVERY ARM IS RECORDED AND EVERY COUNT IS MEASURED. Control GREEN first; each arm applied by a
// scripted string edit and UNDONE by the inverse edit, never `git checkout`.
//
//   ARM 1  the hazard scaled by her temperament (×4 for `deep`)        1 RED  §B's four-voice sweep,
//          – the defect §4's design law refuses by name                        ALONE, which is why the
//                                                                             law asked for a pin
//   ARM 2  the adult rung dropped from `bereavementEligible`            1 RED  §C's rung case
//   ARM 3  the cap raised to 99                                         1 RED  §C's cap case
//   ARM 4  a SECOND RECOVERY RATE for the bereavement, planted in       1 RED  §D's psychologist case.
//          `accrueSpirit` (×2 on the slope when the kind is his)               ⚠ This is the arm that
//                                                                             matters most: the
//                                                                             refusal it breaks is
//                                                                             older than the kind,
//                                                                             and only §D can see it
//   ARM 5  a RELATION named in one voice cell («My grandmother has      1 RED  §E's nobody-is-named
//          died»)                                                             sweep
// =================================================================================================

import { describe, it, expect } from 'vitest'
import {
  accrueSpirit,
  bereavementChanceAt,
  bereavementEligible,
  buildLifeBeatPrompt,
  createWorld,
  kidAgeExact,
  LIFE_BEAT_OPTIONS,
  lifeBeatSaid,
  lifeLogOf,
  pendingLifeBeat,
  rollBereavement,
  setWeightEnabled,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { TEMPERAMENTS, type Temperament } from '../src/engine/spirit'
import { FACE_BANDS, paintedStemFor } from '../src/shared/avatarEmotion'

// ⚠⚠ HIS 11.09 FIGURES, TRANSCRIBED AND NEVER READ OFF `ECONOMY.weight.bereavement` (wave 3's ARM 2
// law): the whole of §A is «the shipped constants are the ones he drafted», and an expectation read
// out of the constant would be the constant agreeing with itself.
const HIS = { perWeek: 0.0008, spacingWeeks: 156, capPerCareer: 2, fromAgeYears: 23 } as const
const B = ECONOMY.weight.bereavement

function weekAtAge(world: WorldState, years: number): number {
  for (let w = 0; w < 40 * 52; w++) {
    if (kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) >= years) return w
  }
  throw new Error(`no week reaches age ${years}`)
}

/** An adult career with the weight ON and nothing else arranged. */
function adult(seed: string, atAge = 26): WorldState {
  const world = createWorld(seed, undefined, `c-${seed}`, undefined, undefined, true)
  world.season = []
  world.week = weekAtAge(world, atAge)
  return world
}

/** Walk `weeks` weeks of the bereavement hazard alone and answer the weeks it landed on. ⚠ It calls
 *  the ENGINE's own roll rather than re-deriving the hazard, which is what makes §B a measurement of
 *  the shipped code instead of of this file's arithmetic. */
function deathWeeks(world: WorldState, weeks: number): number[] {
  const from = world.week
  for (let w = from; w < from + weeks; w++) {
    world.week = w
    rollBereavement(world)
    // the card blocks; a walk that left it up would stop nothing here, so it is simply cleared
    const pending = pendingLifeBeat(world)
    if (pending !== null) world.lifeLog[world.lifeLog.length - 1].answer = 'come'
  }
  return [...world.bereavementWeeks]
}

// =================================================================================================
// A. THE NUMBERS – his, as drafted, and the arithmetic they predict
// =================================================================================================

describe('wave 11 T5 A – his 11.09 figures, shipped as drafted', () => {
  it('⭐⭐⭐ the four constants are the ones he named', () => {
    expect(B.perWeek, '0.08% a week from the adult rung').toBe(HIS.perWeek)
    expect(B.spacingWeeks, 'spacing ≥ 156').toBe(HIS.spacingWeeks)
    expect(B.capPerCareer, 'hard cap 2 per career').toBe(HIS.capPerCareer)
    expect(B.fromAgeYears, 'nothing below the adult rung').toBe(HIS.fromAgeYears)
    expect(bereavementChanceAt(), 'and the hazard reads the constant, not a copy of it').toBe(HIS.perWeek)
  })

  it('⭐⭐ the corridor his own words predict – ~4%/season, E ≈ 0.5 over the 23→35 tail', () => {
    // ⚠ THE ARITHMETIC IS DONE HERE FROM HIS RATE rather than quoted from the constant's comment, so
    // a retune that moved the rate without moving the sentence goes red instead of leaving prose
    // that used to be true. The bench (§8 row 1) measures the REALISED share; this is the closed
    // form it measures against.
    const season = 1 - Math.pow(1 - HIS.perWeek, 52)
    expect(season, '≈4% a season').toBeCloseTo(0.041, 3)
    const tail = 52 * (35 - 23)
    expect(tail * HIS.perWeek, 'E ≈ 0.5 over the 23→35 tail').toBeCloseTo(0.5, 2)
    expect(1 - Math.pow(1 - HIS.perWeek, tail), '~39% meet one before the cap and the spacing bite')
      .toBeCloseTo(0.39, 2)
  })

  it('⭐⭐ the two shock bands sit deeper than the break-up and astride the postpartum pair', () => {
    // §5's own sentence, as arithmetic: «both sit deliberately deeper than the break-up and astride
    // the postpartum pair, because that is the order the lived days have».
    const s = ECONOMY.spirit.shock
    expect(s.loss.steady, 'a loss is heavier than a break-up').toBeLessThan(s.breakup.steady)
    expect(s.bereavement.steady, 'and a death is the heaviest of them').toBeLessThan(s.loss.steady)
    expect(s.loss.steady, '...and the loss is lighter than a birth at the steady end')
      .toBeGreaterThan(s.postpartum.steady)
    expect(s.bereavement.intense, 'the death is deeper than the birth at the intense end too')
      .toBeLessThan(s.postpartum.intense)
  })
})

// =================================================================================================
// B. ⭐⭐⭐ TEMPERAMENT-FREE – the design law, as a property
// =================================================================================================

describe('wave 11 T5 B – the world’s dice, never her personality’s', () => {
  it('⭐⭐⭐ all four voices meet it on exactly the same weeks, on twelve shared seeds', () => {
    // ⚠⚠ `bereavementChanceAt` TAKES NO ARGUMENTS, so the claim is true by construction today – and
    // this case is what keeps it true after somebody re-plumbs the call. It measures the WEEKS THE
    // DEATH LANDED through the shipped roll rather than the number the function returns.
    let met = 0
    for (let i = 0; i < 12; i++) {
      const base = adult(`w11-voice-${i}`)
      const weeks = TEMPERAMENTS.map((t: Temperament) => {
        const world = structuredClone(base)
        // ⚠ THE VOICE IS FORCED ON THE WORLD rather than hunted for by seed: the point is that the
        // hazard cannot see it, so the cleanest arm is the same dice with a different girl.
        world.temperament = t
        return deathWeeks(world, 52 * 12).join(',')
      })
      if (weeks[0].length > 0) met++
      for (let a = 1; a < weeks.length; a++) {
        expect(weeks[a], `seed ${i}: ${TEMPERAMENTS[a]} met it on different weeks`).toBe(weeks[0])
      }
    }
    // ⚠⚠ AND THE SWEEP IS NOT VACUOUS: twelve careers that met nobody's death would make «identical»
    // true and meaningless. At E ≈ 0.5 over the tail a corpus of twelve is expected to hold several.
    expect(met, 'the corpus really did meet at least one – otherwise this pin proves nothing')
      .toBeGreaterThan(0)
  })

  it('⚠ and her spirit, her bond and her marriage cannot reach it either', () => {
    const base = adult('w11-notemper')
    const control = deathWeeks(structuredClone(base), 52 * 12).join(',')
    for (const apply of [
      (w: WorldState) => { w.spirit = 5 },
      (w: WorldState) => { w.spirit = 100 },
      (w: WorldState) => { w.bond = 5 },
      (w: WorldState) => { w.bond = 100 },
    ]) {
      const world = structuredClone(base)
      apply(world)
      expect(deathWeeks(world, 52 * 12).join(','), 'the dice moved').toBe(control)
    }
  })
})

// =================================================================================================
// C. THE GATE – four clauses, each one alone refuses, and a refusal is zero draws
// =================================================================================================

describe('wave 11 T5 C – what refuses, and what a refusal costs', () => {
  it('⭐⭐⭐ the switch OFF refuses on every week of a whole adult career', () => {
    const world = adult('w11-b-switch')
    setWeightEnabled(world, false)
    expect(deathWeeks(world, 52 * 12), 'nobody dies with the weight off').toEqual([])
  })

  it('⭐⭐ nothing fires below the ADULT rung – and the asset is why', () => {
    // ⚠ THE ASSET ENFORCES WHAT THE GATE PROMISES (the 11.09 log, in as many words): the funeral
    // painting exists at the `adult` band and nowhere else, so this case asserts the gate AND the
    // band table that makes it honest.
    const world = adult('w11-b-rung', 16)
    expect(bereavementEligible(world), 'a sixteen-year-old meets none').toBe(false)
    expect(deathWeeks(world, 52 * 6), 'and nothing lands in six years of walking').toEqual([])
    expect(FACE_BANDS.funeral, 'because there is no picture for any other band').toEqual(['adult'])
  })

  it('⭐⭐ the CAP is hard – never a third, however long the career runs', () => {
    const world = adult('w11-b-cap')
    world.bereavementWeeks.push(world.week - 400, world.week - 200)
    expect(bereavementEligible(world), 'two is the cap').toBe(false)
    expect(deathWeeks(world, 52 * 12).length, 'and a twelve-year walk adds none').toBe(2)
  })

  it('⭐⭐ the SPACING holds – nothing inside 156 weeks of the last one', () => {
    const world = adult('w11-b-spacing')
    const first = world.week
    world.bereavementWeeks.push(first)
    for (const offset of [1, 52, HIS.spacingWeeks - 1]) {
      world.week = first + offset
      expect(bereavementEligible(world), `${offset} weeks on`).toBe(false)
    }
    world.week = first + HIS.spacingWeeks
    expect(bereavementEligible(world), 'and open on the week the spacing names').toBe(true)
  })
})

// =================================================================================================
// D. ⭐⭐⭐ THE PSYCHOLOGIST NEEDED NOTHING – step 5's seam, unchanged
// =================================================================================================

describe('wave 11 T5 D – he reads «is a shock live», not which kind', () => {
  /** What one week of `accrueSpirit` does to her, with the seat working or not. */
  function weekDelta(kind: 'breakup' | 'bereavement', psychologistWorks: boolean): number {
    const world = adult('w11-psy')
    world.spirit = 50
    world.spiritShock = { week: world.week - 4, kind }
    world.psychologistHired = psychologistWorks
    world.psychologistFocus = 'recovery'
    const before = world.spirit
    accrueSpirit(world, psychologistWorks, [])
    return (world.spirit ?? 0) - before
  }

  it('⭐⭐⭐ his help is IDENTICAL on a bereavement week and on a break-up week', () => {
    // ⚠⚠ THE DELTA AND NOT THE ABSOLUTE, because the two kinds land at different DEPTHS by design
    // (§5) – so what has to match is the help, which is `recoverySlopeFor` and nothing else. If a
    // later wave gave the bereavement a second return rate, this line is where it would be caught,
    // and the refusal it protects is older than both kinds: «a second return rate, a «recovering»
    // flag or a taper read off `spiritShock` would all be the same mistake».
    const helpOnBreakup = weekDelta('breakup', true) - weekDelta('breakup', false)
    const helpOnDeath = weekDelta('bereavement', true) - weekDelta('bereavement', false)
    expect(helpOnDeath, 'the seat needed nothing from this wave').toBeCloseTo(helpOnBreakup, 10)
    expect(helpOnBreakup, '...and it really is doing something, or this proves nothing')
      .toBeGreaterThan(0)
  })
})

// =================================================================================================
// E. THE BEAT – blocking, in her voice, nobody named, and the painting it wears
// =================================================================================================

describe('wave 11 T5 E – the card', () => {
  function bereaved(base: string): WorldState {
    for (let i = 0; i < 200; i++) {
      const world = adult(`${base}-${i}`)
      const from = world.week
      for (let w = from; w < from + 52 * 12; w++) {
        world.week = w
        rollBereavement(world)
        if (world.bereavementWeeks.length > 0) return world
      }
    }
    throw new Error(`no seed from ${base} met a death`)
  }

  it('⭐⭐⭐ it BLOCKS, and the row names the week rather than a person', () => {
    const world = bereaved('w11-card')
    const at = world.bereavementWeeks[0]
    expect(pendingLifeBeat(world)?.kind, 'the week stops until it is answered').toBe('bereavement')
    const rows = lifeLogOf(world).filter((r) => r.kind === 'bereavement')
    expect(rows, 'one row').toHaveLength(1)
    expect(rows[0].detail, 'the detail is the week – machine-readable, never a rendered sentence')
      .toBe(String(at))
    expect(world.spiritShock, 'and the mark is on her').toEqual({ week: at, kind: 'bereavement' })
  })

  it('⭐⭐ the card offers exactly ONE answer, priced at nothing', () => {
    const world = bereaved('w11-answer')
    const prompt = buildLifeBeatPrompt(world)!
    expect(prompt.options, 'one answer, and it is an undertaking rather than a word to her').toHaveLength(1)
    // ⚠ THE PRICE IS ASKED OF THE ENGINE'S OWN TABLE AND NOT OF THE WIRE: `LifeBeatOption` carries
    // no `bond` – deliberately, since the card may not print a price (rule 4's fence) – so the claim
    // «this answer costs nothing» is made where the number lives.
    expect(LIFE_BEAT_OPTIONS.bereavement, 'one answer in the table too').toHaveLength(1)
    expect(LIFE_BEAT_OPTIONS.bereavement[0].bond, 'going to a funeral is not a thing this game scores').toBe(0)
    expect(LIFE_BEAT_OPTIONS.bereavement[0].id, 'and the id is the one the drain registry names').toBe(prompt.options[0].id)
  })

  it('⭐⭐⭐ NOBODY IS NAMED – not the deceased, not a relation, in any voice or any presence', () => {
    // ⚠⚠ RULED 22.09 (question 4). The fridge pool already names a grandmother in lines nothing
    // licenses, so a NAMED death here would be the contradiction the honesty law exists to prevent.
    // The sweep is over the whole pool rather than over one career, because the claim is about the
    // POOL.
    const BANNED = ['grandmother', 'grandma', 'granny', 'grandad', 'grandfather', 'aunt', 'uncle',
      'cousin', 'mother', 'father', 'brother', 'sister', 'nan']
    for (const voice of TEMPERAMENTS) {
      for (const stage of ['school', 'college', 'independent'] as const) {
        for (const bond of ['close', 'steady', 'strained', 'cold'] as const) {
          const said = lifeBeatSaid('bereavement', '900', voice, 'level', bond, 'open', stage)
          expect(said.length, `${voice}/${stage}/${bond} has a line at all`).toBeGreaterThan(20)
          for (const word of BANNED) {
            expect(said.toLowerCase(), `${voice}/${stage}/${bond} names «${word}»`).not.toContain(word)
          }
          // ⚠ AND NO DATE AND NO NUMBER (rule 4) – a digit anywhere in the pool is the tell.
          expect(said, `${voice}/${stage}/${bond} carries a figure`).not.toMatch(/\d/)
        }
      }
    }
  })

  it('⭐⭐ the funeral painting is on disk and the card can name it', () => {
    // ⚠ THE STEM AND NOT THE URL: `portraitUrl` prefixes a base path the runner does not have, and
    // what this claims is that the band resolution names the file that shipped on 11.09.
    expect(paintedStemFor('adult', 'funeral'), 'the adult band draws the funeral painting')
      .toBe('adult-funeral')
    // ...and a career that meets one past thirty falls back honestly rather than 404ing.
    expect(paintedStemFor('lateCareer', 'funeral'), 'a later band draws its own norm')
      .toBe('lateCareer-norm')
  })
})
