// ⭐⭐ THE ENGINE/UI PARITY CLASS, SITE 2 – THE PLAQUE'S NATIONAL LINE.
//
// Round 29 #12, the second of the three instances the class was named for
// (docs/backlog/the-quality-rig.md row 13; the defect's own record is
// docs/specs/the-calendar-she-can-reach-2026-08.md, «AND FAULT 2 NEARLY SURVIVED THE ENGINE FIX BY
// BEING RE-DERIVED»).
//
// WHAT WAS WRONG. `tierState`'s locked arm prices every lock as a DISTANCE, because until the Play
// Down family existed every lock was one. Part 0 then taught the ENGINE to shut the club draws under
// a professional – a refusal that carries no threshold at all, because she is too GOOD for the rung –
// and the arm went on doing its arithmetic over the top of it. The world #110 was shown
// «Regional Championship – locked: 65 more national pts», and Local the same arithmetic's own
// reductio, «0 more national pts (she has 0 of 0)». The engine was right and the screen re-derived
// its way back to the bug.
//
// THE FIX, in `composables/tierState.ts`: a refusal carrying neither `pointsToEnter` nor
// `rankToEnter` is «a lock with no distance», and the sentence printed is the ENGINE's own.
//
// ⚠⚠ WHAT THIS FILE ADDS. The composable-level half is ALREADY BUILT and mutation-verified –
// `tests/dead-rungs.test.ts` («...AND SO DOES THE PLAQUE») calls `tierState` directly on the owner's
// own posed world, and `tests/round34-ladder-plaques.test.ts` guards the same arm from the zero-
// threshold side. Neither renders anything, and the plaque is a thing the owner READ off a screen.
// So this file is the SURFACE and nothing else: the strip he was looking at, mounted, with the old
// arithmetic rebuilt from the app's own catalogue and asserted absent – and asserted PRESENT on the
// career that really does owe those points, so the absence is a measurement rather than a typo.
//
// ⚠ NO ENGINE CHANGE AND NO STRING IS THIS FILE'S. Every sentence it looks for is assembled out of
// `TIERS[...].enterPointBand`, `LADDER_POINTS_LABEL` and `pointsLockNote` – the app's own pieces, in
// the shape the DELETED arm assembled them – so a re-worded plaque moves this test with it.
//
// ⚠ MUTATION-VERIFIED, both arms run RED before this was believed – see the table above §2.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { DESKTOP, setViewport } from './fits'
import {
  KID_ID,
  activeLadderOf,
  createWorld,
  kidAgeYears,
  recomputeKidRank,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { resumeMain } from '../../src/engine/rng'
import { TIERS, TIER_LADDER } from '../../src/engine/season/calendar'
import { pointsLockNote } from '../../src/composables/tierState'
import { TIER_SHORT } from '../../src/composables/weekAhead'
import { LADDER_POINTS_LABEL, type Snapshot } from '../../src/shared/protocol'
import type { TierId } from '../../src/engine/season/types'

/** `tests/dead-rungs.test.ts`' `careerAt`, and the same reasoning about sixteen that
 *  `parity-feed-ladder.test.ts` writes out: the professional TABLE is what the domestic closure
 *  turns on, and one counting W result settles it at any age. */
function careerAt(seed: string, age: number, book: [TierId, number][], wtaRank?: number): WorldState {
  const world = createWorld(seed)
  const rng = resumeMain(world.rngMain)
  while (kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay) < age) tickWeek(world, rng)
  world.condition = 100
  world.fundsCents = 500_000_00
  for (const [tier, points] of book) world.results.push({ playerId: KID_ID, week: world.week, points, tier })
  world.onRampCleared = { itf: true, wta: true }
  recomputeKidRank(world)
  if (wtaRank !== undefined) world.kidRankWta = wtaRank
  return world
}

// THE OWNER'S CASE: a professional with an EMPTY national book, so the distance the old arm derived
// is the whole of the rung's floor – which is how «65 more national pts» came to be said to a world
// top-150 player.
const PRO = careerAt('parity-plaque-pro', 16, [['w100', 900]], 110)
const PRO_SNAP = toSnapshot(PRO)
// ⭐ THE POSITIVE CONTROL, and it is the reason this file can claim an ABSENCE at all: a girl on the
// domestic table who genuinely owes those points. The same sentence, on the same chip, is asserted
// PRESENT here and ABSENT above.
const CLIMBER = careerAt('parity-plaque-climber', 15, [['local', 30]])
const CLIMBER_SNAP = toSnapshot(CLIMBER)

const DOMESTIC: readonly TierId[] = TIER_LADDER.filter((t) => TIERS[t].track === 'domestic')

/** ⚠⚠ THE DELETED ARM, REBUILT FROM THE APP'S OWN PIECES – the long form `tierState`'s locked arm
 *  prints, which is the exact shape the owner was shown. Nothing here is a literal: the threshold is
 *  the tier's own `enterPointBand[0]`, her book is the snapshot's, and the currency word is
 *  `LADDER_POINTS_LABEL`. */
function derivedDistance(tier: TierId, snapshot: Snapshot): string {
  const floor = TIERS[tier].enterPointBand[0]
  const points = snapshot.ladders.domestic.points
  return `${floor - points} more ${LADDER_POINTS_LABEL.domestic}`
}

/** ...and its chip half, the fraction `pointsLockNote` writes – built with the ENGINE's own number
 *  when it has one, because «the plaque prints the engine's number» is the whole claim. */
function engineFraction(tier: TierId, snapshot: Snapshot): string {
  const need = snapshot.tierRefusal[tier]?.pointsToEnter
  expect(need, `${tier}: the engine really is quoting a threshold here`).toBeDefined()
  return pointsLockNote(tier, need!, snapshot.ladders.domestic.points)
}

/** ...and the DISTANCE off the engine's own `pointsToEnter`, which is what the plaque's long form
 *  reads since 25.09 (docs/specs/engine-ui-parity-2026-09.md §5's second instance, closed). Equal to
 *  `derivedDistance` on every shipped fixture – `medical.ts` writes `tier.enterPointBand[0]` into
 *  `pointsToEnter` at both of its call sites – which is precisely why the assertion had to be
 *  re-pointed rather than left: a row that is green whichever source it reads is not measuring one. */
function engineDistance(tier: TierId, snapshot: Snapshot): string {
  const need = snapshot.tierRefusal[tier]?.pointsToEnter
  expect(need, `${tier}: the engine really is quoting a threshold here`).toBeDefined()
  return `${need! - snapshot.ladders.domestic.points} more ${LADDER_POINTS_LABEL.domestic}`
}

/** The strip's chips, by rung. ⚠ AT DESKTOP, where the row draws itself already open (the owner's
 *  ruling of 04.09, quoted on `stripExpanded`): the collapse is `home-strip-and-mail.test.ts`' claim
 *  and not this file's, and a phone would hide the very rungs the plaque is about. */
function stripChips(snapshot: Snapshot) {
  setViewport(DESKTOP)
  setActivePinia(createPinia())
  useGameStore().snapshot = snapshot
  const wrapper = mount(HomeScreen, { props: { recapFresh: false }, global: { stubs: { teleport: true } } })
  // ⚠ `name` IS THE ACCESSIBLE NAME AND IT IS NOT THE TOOLTIP (§3). The chip is a `role="img"` with
  // an `aria-label`, so `aria-label` REPLACES the content for a screen reader and `title` is not
  // announced beside it – which makes them two different surfaces that can carry two different
  // sentences. §3 asserts about both, because a repair that only reaches the sighted tooltip would
  // leave the other one holding whatever it held.
  const byTier = new Map<TierId, { text: string; title: string; name: string; classes: string[] }>()
  for (const chip of wrapper.findAll('.season-strip .tier-chip')) {
    if (chip.classes().includes('strip-more')) continue
    const short = chip.text().split('·')[0].trim()
    const id = TIER_LADDER.find((t) => TIER_SHORT[t] === short)
    if (id) {
      byTier.set(id, {
        text: chip.text(),
        title: chip.attributes('title') ?? '',
        name: chip.attributes('aria-label') ?? '',
        classes: chip.classes(),
      })
    }
  }
  const whole = wrapper.find('.season-strip').text()
  wrapper.unmount()
  return { byTier, whole }
}

beforeEach(() => setActivePinia(createPinia()))

// =================================================================================================
// §0 – THE TWO REFUSALS ARE DIFFERENT SHAPES, WHICH IS THE ONLY REASON THE PAIR BELOW MEANS ANYTHING
// =================================================================================================
describe('site 2 – the fixture', () => {
  it('⚠⚠ the professional is refused with NO distance – no threshold, no cut, just a sentence', () => {
    expect(activeLadderOf(PRO), 'she is on the professional table').toBe('wta')
    expect(PRO_SNAP.ladders.domestic.points, 'and her national book is empty').toBe(0)
    for (const t of DOMESTIC) {
      const refusal = PRO_SNAP.tierRefusal[t]
      expect(refusal?.reason, `${t} is shut`).toBe('locked')
      expect(refusal?.detail, `${t} says why`).toBeTruthy()
      expect(refusal?.pointsToEnter, `${t} quotes no threshold`).toBeUndefined()
      expect(refusal?.rankToEnter, `${t} quotes no cut`).toBeUndefined()
    }
  })

  it('...and the climber IS refused on a distance, which is what makes the absence a measurement', () => {
    expect(activeLadderOf(CLIMBER)).toBe('domestic')
    expect(CLIMBER_SNAP.tierRefusal.regional?.pointsToEnter, 'the engine quotes a threshold').toBe(
      TIERS.regional.enterPointBand[0],
    )
    // The two worlds owe the SAME rung a different kind of answer – the disagreement the pair needs.
    expect(derivedDistance('regional', PRO_SNAP), 'the owner\'s own sentence').not.toBe(
      derivedDistance('regional', CLIMBER_SNAP),
    )
  })
})

// =================================================================================================
// §1 – ⭐ THE POSITIVE CONTROL: WHERE THERE IS A DISTANCE, THE PLAQUE PRINTS THE ENGINE'S
// =================================================================================================
describe('site 2 – a rung she really is walking towards', () => {
  it('⭐⭐ the climber\'s Regional chip prints the ENGINE\'s threshold, in the engine\'s own currency', () => {
    const { byTier } = stripChips(CLIMBER_SNAP)
    const chip = byTier.get('regional')
    expect(chip, 'the Regional rung is on the strip').toBeDefined()
    expect(chip!.classes, 'and it is drawn as a lock').toContain('locked')
    // The FRACTION is built with `tierRefusal.regional.pointsToEnter`, never with the tier's band, so
    // a plaque that started quoting its own threshold instead would redden here.
    expect(chip!.text).toContain(engineFraction('regional', CLIMBER_SNAP))
    // ⚠ RE-AIMED 25.09 AT THE ENGINE'S NUMBER, and the re-aim is the point rather than a tidy-up.
    // Until this wave the tooltip really WAS derived from the tier's own band, so this row was green
    // whichever of the two sources it happened to read and could not tell them apart – §5's second
    // instance, invisible by construction. `derivedDistance` stays in use in §2, where the BAND
    // arithmetic is the lie being forbidden rather than the value being asserted.
    expect(chip!.title, 'and the long form states the distance the ENGINE quoted').toContain(
      engineDistance('regional', CLIMBER_SNAP),
    )
  })
})

// =================================================================================================
// §2 – ⭐⭐ THE PARITY: THE SAME SENTENCE, ON THE SAME ROW, ABSENT WHERE THE ENGINE HAS NO NUMBER
// =================================================================================================
//
// ⚠⚠ THE MUTATION TABLE, EACH ARM APPLIED ALONE AND REVERTED, AND WHAT EACH ONE ACTUALLY REDDENED –
// measured on 24.09 rather than predicted:
//
//   A. THE SOURCE MOVED – `PLAY_DOWN.domesticFromProTable` set to false (engine/world/ladder.ts), so
//      the ladder stops shutting the club draws on the TABLE and falls back to refusing her on the
//      points floor -> 4 red here, and the rendered tooltip comes back as
//      «Regional Championship – locked: 65 more national pts», WHICH IS THE OWNER'S OWN REPORT. §0's
//      «no distance» row reddens beside it: the engine hands a threshold over again and the plaque
//      prints it. Two surfaces, one edit. (`dead-rungs.test.ts`: 9 red.)
//   B. ⭐⭐ ONLY THE UI MOVED – the «lock that is not a gap» arm deleted from `tierState`
//      (composables/tierState.ts), i.e. the re-derivation this file exists to forbid, put back
//      exactly as it shipped -> 3 red here, on the rendered strip, with §0 GREEN beside them (the
//      engine's verdict never moved) and `parity-feed-ladder.test.ts` ENTIRELY green. The sentence
//      that comes back on Local is the arithmetic's own reductio, «0 more national pts». Also red:
//      `dead-rungs.test.ts` (2) and `round34-ladder-plaques.test.ts` (1), the composable-level half
//      of this site; `ladder-floor.test.ts` green.
//
// ⚠ SO THIS FILE'S OWN CONTRIBUTION IS THE SURFACE, AND IT IS SAID OUT LOUD RATHER THAN IMPLIED: arm
// B reddens the composable net too. What only this file can witness is a re-derivation that reaches
// the STRIP – the chip's rendered class and its rendered tooltip, which is where the owner read the
// defect and the one place `tierState`'s return value is not the last word. Finding 1 below is what
// that difference turned out to be.
//
// ⚠⚠ TWO FINDINGS RECORDED HERE AND NOT FIXED (24.09) – both are the owner's to rule on, and neither
// is in scope for a guard. They are written down because this file is the first thing that renders
// the plaque, so they are what rendering it FOUND.
//
//   1. ⭐ FIXED 25.09, AND §3 BELOW IS THE GUARD – the finding is kept because it is the record of
//      what rendering the plaque FOUND. It read: «THE ENGINE'S SENTENCE DOES NOT REACH THIS TOOLTIP.
//      `tierState` puts `refusal.detail` on the plaque's `title` – the whole discipline the `refusal`
//      projection was added for – and then `HomeScreen.vue`'s `seasonChips` OVERWRITES it for the
//      `outgrown` state with a sentence of its own, about a best result. So the assertion
//      `tests/dead-rungs.test.ts` makes about `state.title` is true of the composable and NOT of this
//      surface, and on a career with no domestic finish at all the row promises a result that does
//      not exist.» Both halves were measured on `PRO_SNAP` before the repair: all three club rungs
//      said «her best … result stays on the books» and `bestFinishByTier` held nothing for any of
//      them. The repair keeps the fragment WHERE IT IS TRUE and lets the engine's sentence through,
//      on the shape the `reached` arm one line up already had – so this file can now assert what it
//      could not on 24.09, that the tooltip carries the engine's words.
//   2. ⭐ FIXED 25.09 – the record, kept: «THE PLAQUE'S LOCKED ARM STILL RE-DERIVES ITS LONG FORM.
//      `tierState`'s `locked` arm takes the engine's number for the chip
//      (`input.refusal?.pointsToEnter ?? minPoints`) and the tier band's own `minPoints` for the
//      tooltip beside it, so the two halves of one plaque read different sources. They agree today –
//      the engine writes `tier.enterPointBand[0]` into `pointsToEnter` at both of `medical.ts`' call
//      sites – so nothing is visible and nothing here can redden.» Measured before the repair: 351
//      hits of that arm over 181 built snapshots, ZERO divergences, so the agreement is real and the
//      invisibility was total. The re-derivation is deleted; the whole sentence reads one binding. The
//      guard is `tests/round34-ladder-plaques.test.ts`' «BOTH HALVES … read the ENGINE's number»,
//      which poses the divergence no fixture can produce, plus §1's row above, re-pointed at
//      `engineDistance` so this surface stops being green whichever source it reads.
describe('site 2 – the professional\'s plaque carries no arithmetic the engine did not do', () => {
  it('⭐⭐ the shipped lie is nowhere on the row – not on the chip, not in its tooltip', () => {
    const { byTier, whole } = stripChips(PRO_SNAP)
    for (const t of DOMESTIC) {
      const chip = byTier.get(t)
      expect(chip, `${t} is on the strip at all`).toBeDefined()
      const lie = derivedDistance(t, PRO_SNAP)
      expect(chip!.text, `${t}: the chip re-derived a distance`).not.toContain(lie)
      expect(chip!.title, `${t}: the tooltip re-derived a distance`).not.toContain(lie)
      // ...and nowhere else on the row either, since the same arm feeds every chip on it.
      expect(whole, `${t}: the row carries the distance somewhere`).not.toContain(lie)
    }
  })

  it('⭐⭐ ...and the chip follows the engine\'s SHAPE: a refusal with no distance is not a padlock', () => {
    // The positive half. Without it the case above would pass against a strip that drew no chips at
    // all – and 'outgrown' rather than 'locked' is the whole of the fix's own reasoning: a padlock
    // promises something to unlock, and there is nothing.
    const { byTier } = stripChips(PRO_SNAP)
    for (const t of DOMESTIC) {
      expect(byTier.get(t)!.classes, `${t} is not offered as a lock`).not.toContain('locked')
      expect(byTier.get(t)!.classes, `${t} reads as a rung she is past`).toContain('outgrown')
    }
  })

  it('⚠ the two rows are not the same row twice – the SAME rung, drawn both ways', () => {
    // A sweep that read one way on both worlds would pass against a strip that never drew a lock, or
    // never drew anything else. Regional is the rung the owner was shown, and it is a padlock for one
    // career and not for the other, on one snapshot each.
    expect(stripChips(CLIMBER_SNAP).byTier.get('regional')!.classes).toContain('locked')
    expect(stripChips(PRO_SNAP).byTier.get('regional')!.classes).not.toContain('locked')
  })
})

// =================================================================================================
// §3 – ⭐⭐ THE OUTGROWN CHIP CARRIES THE ENGINE'S SENTENCE (finding 1, repaired 25.09)
// =================================================================================================
//
// §3's second bullet in docs/specs/engine-ui-parity-2026-09.md, applied: «The screen prints a
// sentence the engine composed → it prints the engine's string or it does not print one.» The
// `outgrown` arm printed neither – it printed a third sentence of its own – so this is the class
// wearing a different hat, and the spec's §5 recorded it as live and unfixed.
//
// ⚠ AND THE SECOND HALF IS WHY IT IS A DEFECT RATHER THAN A PREFERENCE: «her best result stays on
// the books» was UNCONDITIONAL. A professional's domestic book is empty, so the strip promised her a
// finish on three rungs she has never played.
//
// ⚠⚠ THE MUTATION TABLE, EACH ARM APPLIED ALONE AND REVERTED, MEASURED 25.09 – see the wave report
// for the pasted output:
//
//   A. THE SOURCE MOVED – `playDownRefusalDetail`'s domestic sentence edited in
//      `engine/world/ladder.ts`, i.e. the ENGINE's own words changed -> red HERE and red in
//      `tests/dead-rungs.test.ts` («...AND SO DOES THE PLAQUE»). Both surfaces move with the source,
//      which is what one source looks like from outside.
//   B. ⭐⭐ ONLY THE UI MOVED – the discard put back exactly as it shipped (`seasonChips`' `outgrown`
//      arm in `HomeScreen.vue`), a re-authored sentence living where no composable can see it ->
//      red HERE and `dead-rungs.test.ts` ENTIRELY GREEN. That asymmetry is this section's whole
//      reason to exist and it is the §5 finding reproduced: the composable net asserts
//      `state.title`, and `state.title` is exactly what the template was overwriting.
describe('site 2 – the outgrown chip prints the sentence the ENGINE composed', () => {
  it('⭐⭐ a rung with NO best finish: the tooltip IS the engine\'s sentence, and promises no result', () => {
    const { byTier } = stripChips(PRO_SNAP)
    for (const t of DOMESTIC) {
      const said = PRO_SNAP.tierRefusal[t]?.detail
      expect(said, `${t}: the engine really did compose a sentence`).toBeTruthy()
      expect(PRO_SNAP.bestFinishByTier[t], `${t}: and she has no finish on this rung`).toBeUndefined()
      const chip = byTier.get(t)
      expect(chip, `${t} is on the strip`).toBeDefined()
      // BYTE-IDENTICAL, not merely containing: with no finish to state there is nothing to put in
      // front of the engine's words, so the tooltip is the engine's words and nothing else.
      expect(chip!.title, `${t}: the tooltip is the engine's own sentence`).toBe(said)
      // ...and the promise that had no referent is gone from BOTH surfaces of the chip.
      expect(chip!.title, `${t}: the tooltip promises a result she has not got`).not.toContain('stays on the books')
      expect(chip!.name, `${t}: and neither does the accessible name`).not.toContain('stays on the books')
    }
  })

  it('⭐⭐ ...and the SAME rung WITH one keeps both halves, on the `reached` arm\'s own shape', () => {
    // ⚠ THE ACHIEVEMENT IS POSED AT THE SNAPSHOT, and deliberately so: `bestFinishByTier` is written
    // by `finalizeTournament`, and playing a Local Open to a title with a professional world ranking
    // is a career this engine will not produce – the rung is shut to her. What the pair needs is the
    // SAME rung and the SAME engine sentence with the achievement half flipped, which is exactly what
    // this is: one field of the message the screen is handed.
    const posed: Snapshot = { ...PRO_SNAP, bestFinishByTier: { ...PRO_SNAP.bestFinishByTier, local: 0 } }
    const said = posed.tierRefusal.local!.detail!
    const chip = stripChips(posed).byTier.get('local')
    expect(chip, 'the Local rung is on the strip').toBeDefined()
    expect(chip!.classes, 'and it is still drawn as a rung she is past').toContain('outgrown')
    expect(chip!.title, 'the engine\'s sentence survives the screen\'s fact').toContain(said)
    expect(chip!.title, 'and the screen\'s own fact is stated, because now it is true').toContain('stays on the books')
    // The shape is the `reached` arm's: the screen's fact, the `·`, then the engine's sentence LAST.
    expect(chip!.title.endsWith(said), 'the engine\'s sentence is the tail, as `reached` writes it').toBe(true)
    expect(chip!.title, 'joined by the separator that arm already uses').toContain(' · ')
  })

  it('⭐⭐⭐ his Q2-A (25.09): the accessible NAME carries the engine\'s sentence, letter first', () => {
    // The chip is `role=\"img\"` with an `aria-label`, which SUPPRESSES `title` - so until this
    // ruling a screen reader heard neither sentence on an outgrown chip, and the actionable half
    // lived on hover alone. The fold is the `locked` arm's own idiom, composed at the build site.
    // MUTATION 25.09: drop the `outgrown` spread from the chip literal -> the two asserts on
    // `chip.name` below go red together; the tooltip pair above stays green, which is the split.
    const { byTier } = stripChips(PRO_SNAP)
    for (const t of DOMESTIC) {
      const said = PRO_SNAP.tierRefusal[t]?.detail
      const best = PRO_SNAP.bestFinishByTier[t]
      const chip = byTier.get(t)!
      expect(chip.name, `${t}: the reader hears the engine's sentence`).toContain(said!)
      if (best !== undefined) {
        expect(
          chip.name.indexOf(said!),
          `${t}: the finish letter comes FIRST - the ruling's own sub-question, answered`,
        ).toBeGreaterThan(chip.name.indexOf('outgrown'))
      }
    }
  })

  it('⭐ TOTAL over the strip: every outgrown rung the engine refused prints its sentence', () => {
    // ⚠ A SWEEP, NOT THE THREE RUNGS THE DEFECT HAPPENED TO TOUCH: a rung that starts arriving
    // `outgrown` with a refusal tomorrow inherits the guard instead of needing its own case.
    const { byTier } = stripChips(PRO_SNAP)
    let checked = 0
    for (const [t, chip] of byTier) {
      if (!chip.classes.includes('outgrown')) continue
      const said = PRO_SNAP.tierRefusal[t]?.detail
      if (!said) continue
      checked++
      expect(chip.title, `${t}: the rendered tooltip dropped the engine's sentence`).toContain(said)
    }
    // Anti-vacuity: without this the sweep passes against a strip that draws no outgrown chip at all.
    expect(checked, 'the sweep really looked at the rungs §0 posed').toBeGreaterThanOrEqual(DOMESTIC.length)
  })
})
