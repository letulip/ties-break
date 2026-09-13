// WAVE 5 T12 – THE COACH PROFILE IS A LENS ON AXES THAT ALREADY EXIST, AND NEVER A LEVER.
//
// The owner, 13.09: «профили тренеров давай в эту волну после психолога». Ruling H's T12 block names
// four axes the card is said never to say out loud – style x fit, the edge placement, physio
// inclusion and the season uplift – and MEASURED AGAINST THE FILE, three of the four are already on
// the card (the fit pill, `coachLoadNote`'s prose, `upliftPct`'s figures). The fourth,
// `coachEdgePlacement`, is the one docs/specs/coach-match-edge.md §4 and §9c forbid putting there:
// «still a third of a corridor and never a number» is what a SEASON of employing a coach buys, and a
// profile that printed the third on an unhired card would make the whole market readable by looking.
//
// ⚠⚠ SO WHAT SHIPS IS THE JOIN NOBODY CAN MAKE FROM THE CARD. `coachFactor` is
// `developmentFactor[tier] x fitFactor[fit]` – two shipped tables the card shows SEPARATELY and never
// multiplies – and round 38 #17's widening (1.25 / 1.00 / 0.75 against a hireable rung ladder of
// 0.95 -> 1.15) means the product REORDERS the market. Measured here, all twelve cells:
//
//     budget great 1.1875 above | budget good 0.9500 level | budget off 0.7125 UNDER-SELF
//     middle great 1.3000 above | middle good 1.0400 level | middle off 0.7800 UNDER-SELF
//     high   great 1.3875 above | high   good 1.1100 level | high   off 0.8325 under
//     elite  great 1.4375 above | elite  good 1.1500 level | elite  off 0.8625 under
//     ...against the parent's own 0.8200.
//
// Two facts fall out that the card has never been able to state: a great fit at the BUDGET rung
// (1.1875) out-teaches a good fit at the ELITE one (1.15), and an off fit at the bottom two rungs is
// BELOW the parent – the family paying for teaching slower than its own court time. The uplift that
// would have shown the second is CLAMPED at zero («a rung never subtracts»), so those cards print
// «+0.0-0.0% a season» today with nothing on them to explain the zero.
//
// ⚠ THE CENTRAL CLAIM IS THAT NONE OF THIS MOVES ANYTHING – §E. The lens is a pure lookup the SCREEN
// calls, no engine module imports it, and a walked career that computes it every week is identical to
// one that never does, key by key, week by week.
//
// ⚠ MUTATION LEDGER – every arm run against this file as it stands, its red MEASURED and recorded in
// the T12 report. The arms and what each one reddens:
//   * `coachProfileBand` returning 'level' unconditionally -> §A (all 8 non-level cells), §B's band
//     reachability, §D's agreement with the uplift, §G's distribution. NOT §E, correctly: a wrong
//     word is still no lever.
//   * the parent comparison dropped (`under-self` folded into `under`) -> §A's two budget/middle off
//     cells and §B – and NOTHING else, which is what makes that corner its own claim rather than a
//     flourish.
//   * the neutral fit spelled `'good'` as a literal instead of `ECONOMY.coach.selfFit` -> §A's
//     independence case, which re-derives the neutral read off ECONOMY itself.
//   * `PROFILE_NOTE.under` set to the `under-self` string -> §F's distinctness case and §H's
//     verbatim table. It does NOT redden §A: the BAND is right and only the words are wrong, which
//     is the separation between the derivation and the copy.
//   * the lens made to tap MAIN (`rngFromSeed(...)()` on `world.rngMain`'s stream inside
//     `coachProfileNote`) -> §E's walked identity. This is the arm that proves §E can fail at all.
//   * `growWeek` reading the band -> §E's import sweep. ⚠ And it is BLIND to §E's walked identity,
//     because a lever inside the engine moves BOTH arms equally – ruling L's amendment in its purest
//     form, and the reason the import sweep is a separate instrument and not a nicety.
import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative } from 'node:path'
import { ECONOMY } from '../src/engine/economy'
import {
  buildCoachRoster,
  coachEdgePlacement,
  coachFactor,
  coachFitFor,
  coachSeasonUplift,
  coachTierById,
  styleFitBetween,
  HIREABLE_TIERS,
  type StyleFit,
} from '../src/engine/coach'
import {
  coachMarket,
  coachProfileBand,
  coachProfileNote,
  coachRoomBand,
  ROOM_NOTE_SEP,
  type CoachProfileBand,
} from '../src/engine/world/coachMarket'
import { ageFactor, trainFactor, SKILL_KEYS } from '../src/engine/development'
import { createWorld, tickWeek } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, type CoachTier, type PlayStyle } from '../src/shared/protocol'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../tools/econ-bench'
import { region } from './helpers/source'
import { engineModuleSource } from './worldSource'
import type { WorldState } from '../src/engine/world'

const FITS: readonly StyleFit[] = ['great', 'good', 'off']
const STYLES: readonly PlayStyle[] = ['aggressive', 'counterpuncher', 'serve-first', 'all-court']
const BANDS: readonly CoachProfileBand[] = ['above', 'level', 'under', 'under-self']

/** Every card the market can ever draw, as (coach slot x the game she plays). 16 x 4 = 64 – the WHOLE
 *  sweep and not a sample, which is what the fit obligation asks for. */
const SWEEP = ECONOMY.coach.roster.flatMap((slot) =>
  STYLES.map((kid) => ({
    id: slot.portrait,
    tier: slot.tier,
    coachStyle: slot.style,
    kid,
    fit: styleFitBetween(slot.style, kid),
  })),
)

// =================================================================================================
// A. THE DERIVATION – twelve cells, and the expectation is re-derived rather than quoted
// =================================================================================================
//
// ⚠ RULING L'S AMENDMENT, APPLIED DELIBERATELY: the expectation must not call the function under
// test. Every case below builds its answer out of `coachFactor` and `ECONOMY.coach.selfFit`
// directly, so an arm that moves the band's rule moves one side of the comparison only.
describe('wave 5 T12 A - the band is three comparisons of coachFactor against itself', () => {
  const parent = coachFactor('self', ECONOMY.coach.selfFit)

  it('every one of the twelve cells reads the way the two shipped factor tables say it must', () => {
    let checked = 0
    for (const tier of HIREABLE_TIERS) {
      for (const fit of FITS) {
        const his = coachFactor(tier, fit)
        const rung = coachFactor(tier, ECONOMY.coach.selfFit)
        const expected: CoachProfileBand =
          his > rung ? 'above' : his === rung ? 'level' : his < parent ? 'under-self' : 'under'
        expect(coachProfileBand(tier, fit), `${tier} x ${fit} (factor ${his.toFixed(4)})`).toBe(expected)
        checked++
      }
    }
    expect(checked, 'the whole table was walked, not a corner of it').toBe(12)
  })

  it('the two cells that fall UNDER THE PARENT are the budget and middle off-style ones, measured', () => {
    // ⚠ THE CORNER IS THE POINT OF THE FOURTH BAND, and it is a real state of the shipped market:
    // 0.95 x 0.75 = 0.7125 and 1.04 x 0.75 = 0.78 are both below `self`'s 0.82. Named as a fixture
    // because if a retune ever removes it, the fourth string stops having a reader and this case is
    // where that conversation happens.
    const under = HIREABLE_TIERS.flatMap((tier) => FITS.map((fit) => ({ tier, fit }))).filter(
      ({ tier, fit }) => coachProfileBand(tier, fit) === 'under-self',
    )
    expect(under, 'exactly the bottom two rungs, off her style').toEqual([
      { tier: 'budget', fit: 'off' },
      { tier: 'middle', fit: 'off' },
    ])
    for (const { tier, fit } of under) {
      expect(coachFactor(tier, fit), `${tier} x ${fit} really is below the parent`).toBeLessThan(parent)
    }
  })

  it('a great fit at the BUDGET rung really does out-teach a good fit at the ELITE one', () => {
    // The whole reason the join is worth a line: the card shows the two multiplicands on different
    // parts of itself and multiplies them nowhere, so this reordering is invisible on it.
    expect(coachFactor('budget', 'great')).toBeGreaterThan(coachFactor('elite', 'good'))
    expect(coachProfileBand('budget', 'great')).toBe('above')
    expect(coachProfileBand('elite', 'good')).toBe('level')
  })

  it('and the neutral read is the engine\'s own, not the literal `good`', () => {
    // An arm that spells the neutral fit `'good'` is correct today and silently wrong the day
    // `selfFit` moves – which is exactly the drift this repo keeps paying for. The claim is
    // structural: at the neutral fit the rung reads `level` at every rung, whatever that fit IS.
    for (const tier of HIREABLE_TIERS) {
      expect(coachProfileBand(tier, ECONOMY.coach.selfFit), `${tier} at the neutral fit`).toBe('level')
    }
  })
})

// =================================================================================================
// B. THE SWEEP REACHES THE CASES – before anything is read off it
// =================================================================================================
//
// ⚠⚠ «A FIXTURE THAT CANNOT REACH THE CASE IS A GREEN THAT MEANS NOTHING» (ruling O's second blind
// spot, wave 4's last debt before it). Every claim below this point is read off `SWEEP`, so the sweep
// has to be shown to contain the things first.
describe('wave 5 T12 B - the sweep contains every fit, every band, and every edge third', () => {
  it('all three StyleFit values appear, and the WHOLE roster is in the sweep', () => {
    expect(SWEEP.length, '16 coaches x 4 games she could play').toBe(64)
    expect(new Set(SWEEP.map((c) => c.id)).size, 'every roster slot').toBe(ECONOMY.coach.roster.length)
    const fits = new Set(SWEEP.map((c) => c.fit))
    expect([...fits].sort(), 'great, good and off are all reachable').toEqual(['good', 'great', 'off'])
  })

  it('all four bands appear – and an ALL-COURT girl reaches only two of them, which T10 must know', () => {
    const bands = new Set(SWEEP.map((c) => coachProfileBand(c.tier, c.fit)))
    expect([...bands].sort(), 'the sweep exercises every string').toEqual([...BANDS].sort())
    // ⚠ THE MEASURED HOLE, NAMED SO A LATER BENCH DOES NOT WALK INTO IT. `styleAffinity['all-court']`
    // lists the other three, so NOBODY is `off` for an all-court girl: her whole market reads
    // great-or-good, and a sweep run on her alone cannot exercise `under` or `under-self` at all.
    const allCourt = new Set(SWEEP.filter((c) => c.kid === 'all-court').map((c) => coachProfileBand(c.tier, c.fit)))
    expect([...allCourt].sort(), 'an all-court career sees two of the four').toEqual(['above', 'level'])
  })

  it('and all three EDGE THIRDS are reachable – which is why the profile may not carry one', () => {
    // ⚠ THE AXIS RULING H ASKS FOR AND §4 FORBIDS. It is measured here rather than used: over 40
    // seeds x 16 coaches every third comes up, so a profile that named the third would hand the
    // player the whole board at a glance – «hire, read, fire, repeat» without even the hiring.
    const seen: Record<string, number> = { lower: 0, middle: 0, upper: 0 }
    for (let s = 0; s < 40; s++) {
      for (const slot of ECONOMY.coach.roster) {
        const place = coachEdgePlacement(`t12-sweep-${s}`, slot.portrait)
        if (place) seen[place]++
      }
    }
    for (const third of ['lower', 'middle', 'upper']) {
      expect(seen[third], `${third} is reachable, so it is worth protecting`).toBeGreaterThan(100)
    }
  })
})

// =================================================================================================
// C. DETERMINISM – the profile reads nothing mutable, so it cannot change under the player
// =================================================================================================
//
// Ruling E exists one seat over for exactly this defect: a surface re-derived from a MUTABLE world
// fact flips its wording under the player's eyes. `buildLifeBeatPrompt` is rebuilt on every snapshot;
// so is `coachMarket`. A profile that read the tenure, the week, the plan or her skills would be
// re-read after every command.
describe('wave 5 T12 C - the same coach reads the same way, across worlds and across calls', () => {
  it('takes the rung and the fit and NOTHING else – arity and the absence of a world', () => {
    // ⚠ THE SIGNATURE ITSELF, ruling J's re-aim discipline: the claim is «no world, no seed, no
    // stream», and asserting it of the signature is the strongest form available to a test. An arm
    // that threads a `WorldState` through reds here before it reds anywhere else.
    expect(coachProfileNote.length, 'tier and fit').toBe(2)
    expect(coachProfileBand.length, 'tier and fit').toBe(2)
    // ⚠ CUT WITH THE MARKER HELPER AND NEVER A RAW `indexOf` (CLAUDE.md, `npm run pins:check`): a
    // rotted marker would widen this region to most of a 2,500-line file and the negative claim
    // below would then be about text it was never talking about. `region` throws on either marker.
    const body = region(
      engineModuleSource('world/coachMarket'),
      'export function coachProfileBand',
      'const PROFILE_NOTE',
    )
    expect(body.length, 'the region was really cut').toBeGreaterThan(100)
    for (const forbidden of ['world', 'rng', 'seed', 'week']) {
      expect(body.toLowerCase(), `the derivation names no ${forbidden}`).not.toContain(forbidden)
    }
  })

  it('is identical across SEEDS for the same coach – the market re-prices, the profile does not', () => {
    // The roster's own note: «what the seed draws is their names and their individual rates». The
    // rung and the style come off the ECONOMY literal, so the profile is the same in every career -
    // which is a STRONGER determinism than «the same (seed, coachId) gives the same profile», and it
    // is worth stating as the stronger claim rather than the one that was asked for.
    for (const kid of STYLES) {
      for (const slot of ECONOMY.coach.roster) {
        const notes = new Set<string>()
        for (const seed of ['t12-a', 't12-b', 't12-zzz', 'another-family']) {
          const coach = buildCoachRoster(seed, 14).find((c) => c.id === slot.portrait)!
          notes.add(coachProfileNote(coach.tier, coachFitFor(coach, kid)))
        }
        expect(notes.size, `${slot.portrait} reads one way for a ${kid} girl in every career`).toBe(1)
      }
    }
  })

  it('and it does not move under a career that is ticking – same coach, week 1 and week 120', () => {
    // The engine's answer, not a re-derivation: `coachMarket` is rebuilt on every snapshot, so this
    // walks the real row the screen would read.
    const world = createWorld('t12-drift', { ...DEFAULT_PROFILE, coachTier: 'middle' })
    const rng = rngFromSeed(world.seed)
    tickWeek(world, rng)
    const early = new Map(coachMarket(world).map((r) => [r.id, coachProfileNote(r.tier, r.fit)]))
    for (let i = 0; i < 119; i++) tickWeek(world, rng)
    const late = coachMarket(world)
    expect(late.length, 'the market still has a board').toBeGreaterThan(8)
    expect(world.week, 'and 120 weeks really passed').toBeGreaterThan(100)
    for (const row of late) {
      expect(coachProfileNote(row.tier, row.fit), `${row.id} reads the same two years on`).toBe(early.get(row.id))
    }
  })
})

// =================================================================================================
// D. THE FIT SENTENCE AGREES WITH `coachFitFor`, AND THE LABEL WITH THE FIGURE IT CAPTIONS
// =================================================================================================
//
// «A profile that says something the axes do not hold is decoration» – the masseur §4 law read for
// words. Two claims: the profile follows `coachFitFor` over the whole sweep, and it agrees with the
// season band the card prints two lines above it.
describe('wave 5 T12 D - the words say what the numbers hold', () => {
  it('the band follows `coachFitFor` on every coach of the sweep, never a sample', () => {
    let checked = 0
    for (const cell of SWEEP) {
      // The engine's own answer for this pairing, asked through the function the market row uses.
      const coach = buildCoachRoster('t12-agree', 14).find((c) => c.id === cell.id)!
      const fit = coachFitFor(coach, cell.kid)
      expect(fit, `${cell.id} against a ${cell.kid} girl`).toBe(cell.fit)
      const band = coachProfileBand(coach.tier, fit)
      // The direction, stated independently of the band's own rule: the fit multiplier decides it.
      const f = ECONOMY.coach.fitFactor[fit]
      if (f > 1) expect(band, `${cell.id}: a fit worth more than 1 reads above`).toBe('above')
      else if (f === 1) expect(band, `${cell.id}: the neutral fit reads level`).toBe('level')
      else expect(['under', 'under-self'], `${cell.id}: a fit worth less than 1 reads under`).toContain(band)
      checked++
    }
    expect(checked, 'all 64 cards').toBe(64)
  })

  it('and the label never contradicts the season figure beside it – measured on a real market', () => {
    // ⚠⚠ NOT `DEFAULT_PROFILE`'s OWN STYLE, AND THAT IS THE §B HOLE OBEYED RATHER THAN QUOTED. The
    // default is `all-court`, and `styleAffinity['all-court']` lists the other three - so on a default
    // career NOBODY is off-style, the `under-self` rows this case is about do not exist, and the whole
    // assertion would pass against a board it could not see. An aggressive girl has both.
    const world = createWorld('t12-uplift', { ...DEFAULT_PROFILE, coachTier: 'budget', playStyle: 'aggressive' })
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 8; i++) tickWeek(world, rng)
    const rows = coachMarket(world)
    expect(rows.length, 'a full board').toBeGreaterThan(8)

    // MONOTONE IN `coachFactor`: `coachSeasonUplift`'s coached arm rises with the rate, so sorting
    // the board by the number the label is cut from must sort it by the figure the card prints.
    const sorted = [...rows].sort((a, b) => coachFactor(a.tier, a.fit) - coachFactor(b.tier, b.fit))
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].upliftPct[0], `${sorted[i].id} is not quoted below ${sorted[i - 1].id}`).toBeGreaterThanOrEqual(
        sorted[i - 1].upliftPct[0] - 1e-9,
      )
    }
    // ...and the corner the line exists for: a coach the card quotes at ZERO is exactly a coach the
    // profile calls `under-self`. This is the assertion that would catch the label explaining a zero
    // that was not there, or failing to explain one that was.
    const zero = rows.filter((r) => r.upliftPct[1] === 0)
    const underSelf = rows.filter((r) => coachProfileBand(r.tier, r.fit) === 'under-self')
    expect(zero.map((r) => r.id).sort(), 'the clamped rows are the under-the-parent rows').toEqual(
      underSelf.map((r) => r.id).sort(),
    )
    expect(zero.length, 'and this career really has some, so the case was reached').toBeGreaterThan(0)
  })

  it('the profile is derived from the SAME uplift inputs it captions - a check that the factor is the only join', () => {
    // A second reading of the same claim, through `coachSeasonUplift` directly: two rungs whose
    // factors are ordered give season bands in that order at identical everything-else.
    const world = createWorld('t12-inputs', { ...DEFAULT_PROFILE, coachTier: 'middle' })
    const at = (tier: CoachTier, fit: StyleFit): number =>
      coachSeasonUplift({
        skills: SKILL_KEYS.map((k) => world.skills[k]),
        potential: SKILL_KEYS.map((k) => world.potential[k]),
        plan: world.plan,
        tier,
        fit,
        ageFactor: ageFactor(14),
        trainFactor: trainFactor(world.plan),
      })[1]
    expect(at('budget', 'great'), 'a great budget coach is quoted above a good elite one').toBeGreaterThan(
      at('elite', 'good'),
    )
    expect(at('budget', 'off'), 'and an off-style budget coach is quoted at nothing').toBe(0)
  })
})

// =================================================================================================
// E. ⚠⚠ THE PIN THE TASK LIVES OR DIES ON – THE LENS CHANGES NO OUTCOME
// =================================================================================================
//
// Two instruments, because one of them is blind to half of what can go wrong and saying so is the
// whole of ruling L's amendment.
describe('wave 5 T12 E - a lens, not a lever', () => {
  /** Every top-level key of a world, hashed - `tools/frozen-key-diff.ts`'s own instrument. */
  function keyHashes(world: WorldState): Record<string, string> {
    const record = world as unknown as Record<string, unknown>
    const out: Record<string, string> = {}
    for (const key of Object.keys(record).sort()) {
      out[key] = createHash('sha256').update(JSON.stringify(record[key] ?? null)).digest('hex').slice(0, 12)
    }
    return out
  }

  it('⭐⭐⭐ a walked career that COMPUTES the profile every week is identical to one that never does', () => {
    // ⚠ THE TRAJECTORY AND NOT THE END STATE (ruling K): the corpus is diffed the blind way, so a
    // convergent difference would hide from a terminal hash. Every key, every week.
    const walk = (lens: boolean): Record<string, string>[] => {
      const { world, rng } = openCareer(PRESETS[0], 0, POLICIES[1])
      const weekly: Record<string, string>[] = []
      for (let w = 0; w < 40; w++) {
        stepCareerWeek(world, rng, POLICIES[1])
        if (lens) {
          // Exactly what the screen does, on every row of the board, on every week of the walk.
          for (const row of coachMarket(world)) coachProfileNote(row.tier, row.fit)
        }
        weekly.push(keyHashes(world))
      }
      return weekly
    }
    const without = walk(false)
    const withLens = walk(true)
    const moved = new Set<string>()
    for (let w = 0; w < without.length; w++) {
      // ⚠⚠ THE UNION OF BOTH KEY SETS, AND THAT IS A DEFECT THIS PIN SHIPPED WITH FOR ONE ARM. The
      // first draft walked `Object.keys(without[w])` alone – the CONTROL's keys – so a lens that
      // ADDED a key to the world was invisible to it, and M5 (the lens writing `t12Lever` onto the
      // world inside `coachMarket`) came back GREEN against the pin written to catch exactly that.
      // A comparison that can only see what the control already has is the «unable to fail» family
      // wearing a set operation.
      for (const key of new Set([...Object.keys(without[w]), ...Object.keys(withLens[w])])) {
        if (without[w][key] !== withLens[w][key]) moved.add(key)
      }
    }
    expect([...moved].sort(), '⚠⚠ reading the profile moves no key on any week').toEqual([])
    expect(Object.keys(without[0]).length, 'and the sweep really saw a populated world').toBeGreaterThan(50)
    expect('rngMain' in without[0], 'including the MAIN position, which is where a stray draw would land').toBe(true)
  }, 60_000)

  it('⭐⭐⭐ and NO MODULE UNDER src/engine IMPORTS IT – the instrument the walk above is blind to', () => {
    // ⚠⚠ A LEVER INSIDE THE ENGINE MOVES BOTH ARMS OF THE WALK EQUALLY, so the equality above cannot
    // see it (ruling L, amended by T6: «an equality comparing two arms is invisible to a mutation
    // that moves both»). This is the instrument that can: the lens has exactly ONE importer and it is
    // a Vue component. A `growWeek` that read the band would redden here and nowhere else.
    const SRC = fileURLToPath(new URL('../src', import.meta.url))
    const files: string[] = []
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir).sort()) {
        const full = join(dir, entry)
        if (statSync(full).isDirectory()) walk(full)
        else if (full.endsWith('.ts') || full.endsWith('.vue')) files.push(full)
      }
    }
    walk(SRC)
    // The other half of every corpus test here: a guard that reads nothing passes everything.
    expect(files.length, 'the sweep covers the real tree').toBeGreaterThan(60)
    const HOME = join('engine', 'world', 'coachMarket.ts')
    const readers = files
      .filter((f) => !f.endsWith(HOME))
      .filter((f) => /coachProfile(Note|Band)/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(SRC, f))
      .sort()
    expect(readers, 'one reader, and it is the screen').toEqual([
      join('components', 'screens', 'CoachMarketScreen.vue'),
    ])
    // ...and the scanner really finds the name when it is there, which is what stops a broken regex
    // from reporting an empty list as a clean one.
    expect(/coachProfile(Note|Band)/.test(readFileSync(join(SRC, HOME), 'utf8')), 'the home file is found').toBe(true)
  })
})

// =================================================================================================
// F. THE STRINGS – drafts, and the house rules they are held to
// =================================================================================================
describe('wave 5 T12 F - four drafts, one shape', () => {
  /** ⚠ COMPUTED INSIDE EACH CASE AND NAMED WHEN IT CANNOT BE, rather than at collection time with a
   *  `!`. The first draft built this table in the `describe` body: an arm that made a band
   *  unreachable then threw during COLLECTION, the file reported «no tests», and a crash where an
   *  assertion should be is a red that tells you nothing about which claim caught it. */
  const notesNow = (): { band: CoachProfileBand; note: string }[] =>
    BANDS.map((band) => {
      const cell = HIREABLE_TIERS.flatMap((t) => FITS.map((f) => ({ tier: t, fit: f }))).find(
        ({ tier, fit }) => coachProfileBand(tier, fit) === band,
      )
      if (!cell) throw new Error(`no rung x fit on the shipped ladder reads '${band}' – the string has no reader`)
      return { band, note: coachProfileNote(cell.tier, cell.fit) }
    })

  it('four bands, four different sentences', () => {
    const notes = notesNow()
    expect(new Set(notes.map((n) => n.note)).size, 'no two bands say the same thing').toBe(4)
  })

  it('every one splits the room note\'s way, and `band + tail === note` exactly', () => {
    for (const { band, note } of notesNow()) {
      const label = coachRoomBand(note)
      expect(label.length, `${band} has a label`).toBeGreaterThan(0)
      expect(label + note.slice(label.length), `${band} reassembles to the engine's own string`).toBe(note)
      expect(note.indexOf(ROOM_NOTE_SEP), `${band} carries the separator`).toBeGreaterThan(0)
    }
  })

  it('no figure, no em dash, and no pronoun for the coach (R15-7)', () => {
    for (const { band, note } of notesNow()) {
      expect(note, `${band} quotes no number`).not.toMatch(/\d/)
      expect(note, `${band} uses the short dash`).not.toContain('—')
      expect(note, `${band} names no coach by pronoun`).not.toMatch(/\b(he|his|him|himself)\b/i)
      // The card's own measured two-line ceiling for this column is 60 characters of BODY; the label
      // is bold and sits on the same line, so the pair is held to the load note's own budget instead
      // - `coachLoadNote`'s longest is 84 and wraps to the same block.
      expect(note.length, `${band} is inside the load note's own budget`).toBeLessThanOrEqual(84)
    }
  })
})

// =================================================================================================
// G. T10's BENCH LINE – what «distinguishable» actually measures, stated as a prediction
// =================================================================================================
describe('wave 5 T12 G - the distribution T10 should predict', () => {
  it('no two CARDS are identical on the axes the screen shows', () => {
    // ⚠ AND THE CLAIM HAD TO BE STATED CAREFULLY. The LABEL takes four values over sixteen coaches,
    // so two coaches on one rung CAN share it - `budget-2` and `middle-4` both read `level` for an
    // aggressive girl. What is unique is the CARD: (rung, the game he plays) is a key over the whole
    // roster, and the style is printed beside the pill. A bench line that asked the label alone to
    // partition sixteen people would be asking a four-valued reading to do a sixteen-valued job.
    const keys = ECONOMY.coach.roster.map((s) => `${s.tier}/${s.style}`)
    expect(new Set(keys).size, 'rung x his own game is unique over the roster').toBe(keys.length)
    for (const tier of HIREABLE_TIERS) {
      const inTier = ECONOMY.coach.roster.filter((s) => s.tier === tier)
      expect(new Set(inTier.map((s) => s.style)).size, `the ${tier} rung has four different games`).toBe(inTier.length)
    }
  })

  it('the measured band distribution over the whole sweep', () => {
    const counts: Record<string, number> = { above: 0, level: 0, under: 0, 'under-self': 0 }
    for (const cell of SWEEP) counts[coachProfileBand(cell.tier, cell.fit)]++
    // 64 cards: one great and one off per rung per non-all-court girl, and the all-court girl sees
    // no `off` at all. T10 predicts these four numbers, not a hope.
    expect(counts, 'above 16 / level 32 / under 8 / under-self 8').toEqual({
      above: 16,
      level: 32,
      under: 8,
      'under-self': 8,
    })
  })

  it('and `middle-4` is a BUDGET slot, so the profile follows the rung and never the stem', () => {
    // The roster's own trap (R3 moved him down a rung and the stem still names the master art file).
    expect(coachTierById('middle-4'), 'the id prefix is not the tier').toBe('budget')
    const slot = ECONOMY.coach.roster.find((s) => s.portrait === 'middle-4')!
    expect(coachProfileNote(slot.tier, 'good'), 'and his profile is the budget rung\'s').toBe(
      coachProfileNote('budget', 'good'),
    )
  })
})
