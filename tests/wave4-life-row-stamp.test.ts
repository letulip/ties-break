// =================================================================================================
// WAVE 4, T5 – `lifeKind` ON EVERY LIFE ROW, AND THE ENDING'S OWN KEPT ROW
// =================================================================================================
//
// `docs/plans/life-wave-4-builder-2026-09.md` §2 T5. T1 added `WorldEvent.lifeKind?` and wrote it
// nowhere; this is the step that writes it, and the step that gives the told-now ending the kept feed
// row nine comments in the tree had been reserving for it.
//
// ⚠⚠ ONE DEPARTURE FROM THE T5 BRIEF, AND IT IS THE WHOLE REASON THIS FILE IS BIGGER THAN A STAMP.
// The brief says «stamp `lifeKind: 'ended'` on the ending rows (T4's two: told-now and told-late)».
// T4 shipped ONE – `ENDED_LATE_EVENT`, the told-late row – and left `rollEnds` carrying «⚠ NO FEED
// ROW ON THIS PATH (T5's, per the commit order)». So the told-now ending, which is the COMMON scene,
// wrote no kept row at all: a card, and then an `'info'` reply row saying what the parent did. A
// glyph column bought for navigation («met someone · it ended») that cannot mark «it ended» for the
// common case is a column that half exists, so §C builds the row and §A proves nothing leaves this
// layer unstamped. Reported rather than worked around – the wave's standing rule.
//
// ⚠ THE ROW'S SENTENCE IS A DRAFT AND T6 OWNS THE MATRIX (invariant 4). Nothing below asserts its
// wording; §C asserts that it is ONE row, kept, priceless, stamped, and not one of wave 3's.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – every net below was RUN, watched fail, and re-edited back BY HAND. Red counts
// are MEASURED over the discriminating set (this file, wave4-ended-beat, wave4-ends, wave3-delivery,
// wave3-arrival, tests/component/wave3-feed-glyph, tests/component/wave4-feed-glyph-kind).
// =================================================================================================
//
//   ⚠ NINE BEHAVIOURAL MUTATIONS PLUS THREE COMPILE ONES, RUN 12.09.2026, CONTROL GREEN FIRST
//   (138 unit / 10 component over the set above) AND EVERY ONE RE-EDITED BACK BY HAND – never
//   `git checkout`. The control was re-run after the restores and came back 138/10.
//
//   ARM 1   the TOLD-LATE row's stamp dropped (`lifeKind: 'ended'` deleted).
//           **3 RED** · §A's three-path case, §A's SOURCE sweep, and §C's told-late half. Both
//           instruments fired, which is the argument for carrying both.
//
//   ARM 2   the ARRIVAL row's stamp dropped (`lifeKind: 'met'` deleted).
//           **3 RED** · §A's two cases and tests/wave4-ended-beat.test.ts §A – the cross-file catch,
//           through the guard T5 re-aimed rather than re-pointed.
//
//   ARM 3   the TOLD-NOW row's stamp dropped.
//           **4 RED** · the three above plus §C's «one kept row of its own».
//
//   ARM 4   ⚠⚠ THE WHOLE TOLD-NOW ROW DELETED – the tree exactly as T4 left it, which is the state
//           the T5 brief believed it was inheriting.
//           **6 RED** · §A x2, §B, §C x2, wave4-ended-beat §A. ⚠ THE SOURCE SWEEP GOES RED HERE ON
//           ITS **FLOOR** rather than on an unstamped site (two write sites, not three), which is
//           the positive control doing its job: a sweep that found nothing would otherwise pass.
//
//   ARM 5   the told-now row HOISTED ABOVE the `'met'` receipt – written unconditionally.
//           **4 RED** · §C's receipt case, wave4-ended-beat §B x2 (the collision raises a row it
//           should not) and tests/wave4-ends.test.ts §D. ⚠ THAT LAST ONE IS THE RECEIPT FOR T5's
//           RE-AIM of that guard: it was re-aimed in its NOTE and left assertion-identical, and it
//           still bites on exactly the defect it was aimed at.
//
//   ARM 9   ⚠⚠ A FOURTH `type: 'life'` WRITE SITE, ADDED UNSTAMPED – the mistake no walk can see,
//           because the walk only knows the paths that exist today.
//           **6 RED**, and the SOURCE sweep names it: «⚠⚠ a `'life'` feed row is written with no
//           `lifeKind` – the glyph column would lie about it: expected [ Array(1) ] to deeply equal
//           []». That is the whole reason this file carries a source pin beside three walks.
//
//   ARM 10  ⚠ THE FIRST ATTEMPT AT IT WAS **0 RED, AND THE ARM WAS THE THING THAT WAS WRONG** – it
//           is recorded rather than quietly replaced. The extractor's `[^{}]*` was narrowed to
//           `[^{}]{0,120}` on the theory that a shorter reach would drop a site; every site has ~31
//           characters before `type:`, so 120 dropped nothing and 7 passed. A green arm is a claim
//           about the MUTATION until you have read what it actually changed.
//   ARM 10b THE SAME PROPERTY ARMED PROPERLY, in the shape the assertion's own note describes: a
//           FOURTH life row carrying a NESTED object (`entryRef: {…}`), stamped and correct, which
//           `[^{}]*` cannot span. **5 RED**, and the count line says exactly what went wrong: «the
//           sweep captured 3 of 4 `type: 'life'` occurrences – one is shaped so the pattern cannot
//           see it: expected 3 to be 4». ⚠ THE FLOOR ALONE WOULD NOT HAVE CAUGHT IT – three captured
//           sites still clears `>= 3`, so an unstamped nested site would have passed silently. That
//           is the whole reason the count-equality line exists beside the floor.
//
//   ARMS 6, 7, 8 and the three COMPILE arms are the column's own and live in the ledger of
//   tests/component/wave4-feed-glyph-kind.test.ts.
//
import { describe, expect, it } from 'vitest'

import {
  answerLifeBeat,
  createWorld,
  deliverKnownPartner,
  endsHazardFor,
  lifeLogOf,
  rollEnds,
  TEMPERAMENTS,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, type LoveEpisode, type WorldEvent } from '../src/shared/protocol'
import { LIFE_BEAT_ROW_KINDS } from '../src/components/screens/lifeRowGlyphs'
import { worldSource } from './worldSource'
import { codeOf } from './helpers/source'

// -------------------------------------------------------------------------------------------------
// FIXTURES – wave 4 T4's own, transcribed rather than imported, because that file's helpers are
// module-private and copying four lines is cheaper than exporting test apparatus across files.
// -------------------------------------------------------------------------------------------------

/** A career parked at `week` with an empty life. ⚠ A REAL `createWorld`, so the profile, the seed and
 *  the temperament are the engine's own (wave 3's and wave 4's shared fixture doctrine). */
function careerAt(seed: string, week: number): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.season = []
  world.week = week
  return world
}

/** An attachment, hand-built. ⚠ POKED RATHER THAN ROLLED where the roll is not what is under test. */
function episode(sinceWeek: number, knownWeek: number | null, over: Partial<LoveEpisode> = {}): LoveEpisode {
  return { id: `p:${sinceWeek}`, sinceWeek, endedWeek: null, knownWeek, wants: 'open', partnerId: `p:${sinceWeek}`, ...over }
}

/** ⭐⭐ A SEED WHOSE ENDS HAZARD REALLY FIRES ON `week` – asked of the engine's own stream and its own
 *  hazard, never stubbed, so the seed it returns is one the REAL `rollEnds` fires on. A fixture that
 *  poked `endedWeek` by hand would have deleted the very code §C is about. */
function seedEndingOn(prefix: string, week: number, temperament: (typeof TEMPERAMENTS)[number]): string {
  const hazard = endsHazardFor(temperament)
  for (let i = 0; i < 20000; i++) {
    const seed = `${prefix}-${i}`
    if (rngFromSeed(`${seed}:life:ends:${week}`)() < hazard) return seed
  }
  throw new Error(`no seed in 20000 ends on week ${week} for a ${temperament} girl`)
}

const lifeRows = (world: WorldState): WorldEvent[] => world.events.filter((e) => e.type === 'life')

/** ⭐ WHAT WAVE 3's DELIVERY ROW SAYS – transcribed from its pool so that «the sentence did not move»
 *  is a CLAIM here rather than a hope. ⚠ INVARIANT 4: this sentence is not T5's to touch and the
 *  assertion exists to prove it was not touched. */
const MET_TOLD_OPEN = 'She told us there is someone in her life.'

// =================================================================================================
// A. ⚠⚠ THE LAW: NO `'life'` ROW LEAVES THIS LAYER WITHOUT A KIND
// =================================================================================================
//
// ⚠⚠ TWO INSTRUMENTS, AND THEY CATCH DIFFERENT MISTAKES. The behavioural case below walks the three
// shipped paths and reads what landed in `events`; the SOURCE case sweeps every `type: 'life'`
// literal in the world module set, which is the only one of the two that can see a FOURTH write site
// somebody adds later and forgets to stamp. A net that only walked today's paths would go on passing
// over the row it was written to catch.
describe('wave 4 T5 A – every life row carries its kind', () => {
  it('⭐⭐⭐ the three shipped paths each write ONE stamped row – arrival, told-now ending, told-late ending', () => {
    // 1. THE ARRIVAL DELIVERY (wave 3 T6), which is the row every career with a romance has.
    const arrival = careerAt('t5-stamp-arrival', 960)
    arrival.loveEpisodes = [episode(880, 940)]
    deliverKnownPartner(arrival)
    expect(lifeRows(arrival), 'the arrival really delivered').toHaveLength(1)
    expect(lifeRows(arrival)[0].lifeKind, '⭐ the arrival row is a `met` row').toBe('met')
    // ⚠ INVARIANT 4, ASSERTED AGAINST A TRANSCRIBED LITERAL: the stamp is a field BESIDE the
    // sentence, and the sentence is wave 3's and did not move.
    expect(lifeRows(arrival)[0].text, '⚠ and wave 3\'s own sentence is byte unchanged').toBe(MET_TOLD_OPEN)

    // 2. THE TOLD-NOW ENDING (T5's new row), behind the `'met'` receipt the engine itself wrote.
    const temperament = TEMPERAMENTS[1]
    const now = careerAt(seedEndingOn('t5-stamp-now', 900, temperament), 900)
    now.temperament = temperament
    now.loveEpisodes = [episode(880, 890)]
    deliverKnownPartner(now)
    expect(lifeLogOf(now).map((r) => r.kind), 'the fixture really delivered the arrival first').toEqual(['met'])
    answerLifeBeat(now, 'wary')
    rollEnds(now)
    expect(now.loveEpisodes[0].endedWeek, 'the hazard really fired – this is not a vacuous pass').toBe(900)
    expect(lifeRows(now).map((e) => e.lifeKind), '⭐⭐ the arrival row, then the ending row, each with its kind')
      .toEqual(['met', 'ended'])

    // 3. THE TOLD-LATE ENDING (T4's row, ruling B's scene).
    const late = careerAt('t5-stamp-late', 960)
    late.loveEpisodes = [episode(880, 940, { endedWeek: 900 })]
    deliverKnownPartner(late)
    expect(lifeRows(late), 'the told-late scene really wrote its one row').toHaveLength(1)
    expect(lifeRows(late)[0].lifeKind, '⭐ and the told-late row is an `ended` row too').toBe('ended')
    // ⚠⚠ THE REGISTER IS NOT ON THE ROW, AND THAT IS A DECISION. Told-now and told-late are two
    // wordings of one piece of news; a column that marked them apart would be telling the player
    // which scene the LAG gave him, which is not a fact about her life.
    expect(lifeRows(late)[0].lifeKind, 'the same kind as the told-now row, not a third one')
      .toBe(lifeRows(now)[1].lifeKind)
  })

  it('⭐⭐⭐ SOURCE: every `type: \'life\'` write site in the engine stamps a `lifeKind` beside it', () => {
    // ⚠ COMMENTS STRIPPED FIRST. This repo quotes its own code in prose – the `lifeKind` notes above
    // each write site say `type: 'life'` in as many words – and a sweep that counted them would be
    // measuring the documentation.
    const code = codeOf(worldSource())
    // ⚠⚠ THE POSITIVE CONTROL COMES FIRST, because a sweep that found NO write sites passes forever,
    // which is how the last several dead pins in this layer died. The floor is the three shipped
    // rows; a fourth is welcome and must bring its own stamp.
    const sites = [...code.matchAll(/\{[^{}]*type:\s*'life'[^{}]*\}/g)].map((m) => m[0])
    expect(sites.length, 'the sweep really found the life-row write sites').toBeGreaterThanOrEqual(3)
    // ⚠⚠ AND THE EXTRACTOR MUST ACCOUNT FOR EVERY OCCURRENCE, WHICH IS THE LINE THAT STOPS THIS PIN
    // JOINING THE «UNABLE TO FAIL» FAMILY. `[^{}]*` cannot cross a brace, so a future write site that
    // happened to carry a NESTED object (`entryRef: {…}`, say) would not match the pattern at all –
    // and an unstamped site the sweep never sees is a silent pass, which is the same failure shape as
    // the `indexOf` slice that returns −1. Counting the raw occurrences and demanding the same number
    // of captured sites turns that miss into a red line here instead.
    const occurrences = [...code.matchAll(/type:\s*'life'/g)].length
    expect(sites.length, `the sweep captured ${sites.length} of ${occurrences} \`type: 'life'\` occurrences – one is shaped so the pattern cannot see it`)
      .toBe(occurrences)
    const unstamped = sites.filter((site) => !/lifeKind:\s*'/.test(site))
    expect(unstamped, '⚠⚠ a `\'life\'` feed row is written with no `lifeKind` – the glyph column would lie about it')
      .toEqual([])
    // ...and every kind it stamps is one the glyph column can actually mark. A write site stamping a
    // kind outside the roster would draw NOTHING once a per-kind glyph lands (the `?? 'met'` default
    // only covers ABSENT, never a kind nobody registered).
    const stamped = sites.map((site) => /lifeKind:\s*'([a-z-]+)'/.exec(site)?.[1])
    for (const kind of stamped) {
      expect(LIFE_BEAT_ROW_KINDS as readonly string[], `«${kind}» is a kind the feed's column knows`).toContain(kind)
    }
  })

  it('⚠ the ANSWER row is deliberately NOT a life row, and is therefore deliberately unstamped', () => {
    // The boundary of the law above, asserted so a later reader does not «fix» it. `answerLifeBeat`
    // writes `type: 'info'` on every kind – wave-2 machinery whose re-typing would change what the
    // shipped fork-opinion answer looks like in the feed, which is not T5's to do and is flagged in
    // that function's own comment as a question for the owner.
    const world = careerAt('t5-answer-row', 960)
    world.loveEpisodes = [episode(880, 940)]
    deliverKnownPartner(world)
    const before = world.events.length
    answerLifeBeat(world, 'warm')
    expect(world.events.length, 'answering really wrote a row').toBe(before + 1)
    const answerRow = world.events[world.events.length - 1]
    expect(answerRow.type, 'and it is an `info` row, as wave 2 left it').toBe('info')
    expect(answerRow.lifeKind, 'so it carries no life kind – the column is about the news, not the reply')
      .toBeUndefined()
  })
})

// =================================================================================================
// B. ⚠ THE ROWS STAY PRICELESS – rule 4, re-asserted at the two sites that grew a field
// =================================================================================================
describe('wave 4 T5 B – a life beat is still never a purchase', () => {
  it('⚠⚠ no life row carries an `amountCents`, on any of the three paths', () => {
    const worlds: WorldState[] = []

    const arrival = careerAt('t5-cents-arrival', 960)
    arrival.loveEpisodes = [episode(880, 940)]
    deliverKnownPartner(arrival)
    worlds.push(arrival)

    const temperament = TEMPERAMENTS[2]
    const now = careerAt(seedEndingOn('t5-cents-now', 900, temperament), 900)
    now.temperament = temperament
    now.loveEpisodes = [episode(880, 890)]
    deliverKnownPartner(now)
    answerLifeBeat(now, 'wary')
    rollEnds(now)
    expect(now.loveEpisodes[0].endedWeek, 'the hazard really fired').toBe(900)
    worlds.push(now)

    const late = careerAt('t5-cents-late', 960)
    late.loveEpisodes = [episode(880, 940, { endedWeek: 900 })]
    deliverKnownPartner(late)
    worlds.push(late)

    // ⚠ THE CONTROL: there ARE rows to look at. «No row has an amount» is satisfied by no rows.
    const all = worlds.flatMap(lifeRows)
    expect(all.length, 'the three walks really produced life rows').toBe(4)
    for (const row of all) {
      expect(row.amountCents, `«${row.text}» is not a purchase`).toBeUndefined()
      expect(row.keep, `«${row.text}» is kept – the album still has it seasons later`).toBe(true)
    }
    // ...and none of them reached the finance ledger, which is what `amountCents` would have done.
    for (const world of worlds) {
      expect(world.financeWeeks.some((w) => w.week === 900 || w.week === 960), 'no life row opened a ledger week')
        .toBe(false)
    }
  })
})

// =================================================================================================
// C. ⭐⭐⭐ THE TOLD-NOW ENDING'S OWN KEPT ROW – the row the brief thought T4 had shipped
// =================================================================================================
describe('wave 4 T5 C – the ending he already knew about lands in the album', () => {
  it('⭐⭐⭐ the told-now ending writes ONE kept row of its own, beside the arrival row it ends', () => {
    const temperament = TEMPERAMENTS[0]
    const world = careerAt(seedEndingOn('t5-now-row', 900, temperament), 900)
    world.temperament = temperament
    world.loveEpisodes = [episode(880, 890)]
    deliverKnownPartner(world)
    answerLifeBeat(world, 'warm')
    const beforeEnding = lifeRows(world).map((e) => e.text)
    expect(beforeEnding, 'the fixture starts with wave 3\'s delivery row and nothing else').toEqual([MET_TOLD_OPEN])

    rollEnds(world)
    expect(world.loveEpisodes[0].endedWeek, 'the hazard really fired').toBe(900)
    const rows = lifeRows(world)
    expect(rows, '⭐⭐ two rows now: there was someone, and this week there is not').toHaveLength(2)
    // ⚠ THE WORDING IS A DRAFT AND T6 OWNS IT – what is asserted is that the row is NEW, is not one of
    // wave 3's, and is the ending's.
    expect(rows[1].text, 'the ending wrote a sentence of its own').not.toBe(MET_TOLD_OPEN)
    expect(rows[1].text.length, 'and it is really a sentence').toBeGreaterThan(0)
    expect(rows[1].week, 'dated the week it ended').toBe(900)
    expect(rows[1].lifeKind, 'and stamped as the ending').toBe('ended')
    expect(rows[1].keep, 'kept, so a career can read its own life back seasons later').toBe(true)
  })

  it('⚠⚠ and the row obeys the SAME receipt as the card – an ending he never heard of writes nothing', () => {
    // The negative half of ruling B's split, aimed at the ROW rather than the beat. A row written
    // unconditionally here would tell a parent about a romance he has never heard of, in the week it
    // ends – which is exactly the news `deliverKnownPartner` exists to deliver honestly, later.
    const temperament = TEMPERAMENTS[0]
    const world = careerAt(seedEndingOn('t5-now-untold', 900, temperament), 900)
    world.temperament = temperament
    world.loveEpisodes = [episode(880, 940)] // the lag is still running: no receipt
    expect(lifeLogOf(world).some((r) => r.kind === 'met'), 'the fixture really holds NO receipt').toBe(false)
    rollEnds(world)
    expect(world.loveEpisodes[0].endedWeek, 'the hazard really fired – this is not a vacuous null').toBe(900)
    expect(lifeRows(world), '⚠⚠ nothing in the album about a romance he was never told about').toEqual([])

    // ...and it is DEFERRED rather than lost: one told-late row on `knownWeek`, stamped.
    world.week = 940
    deliverKnownPartner(world)
    const late = lifeRows(world)
    expect(late, 'one honest late row, on the week he hears of it').toHaveLength(1)
    expect(late[0].lifeKind, 'and it is stamped too').toBe('ended')
  })

  it('⚠ the ending row is written ONCE – a second tick after the ending adds nothing', () => {
    const temperament = TEMPERAMENTS[1]
    const world = careerAt(seedEndingOn('t5-now-once', 900, temperament), 900)
    world.temperament = temperament
    world.loveEpisodes = [episode(880, 890)]
    deliverKnownPartner(world)
    answerLifeBeat(world, 'wary')
    rollEnds(world)
    expect(lifeRows(world), 'the ending really landed').toHaveLength(2)
    answerLifeBeat(world, 'fix-it')
    // ⚠ `rollEnds` GATES ON `endsEligible`, which is `activeEpisode !== null` – the episode is over,
    // so the ten ticks below take ZERO draws and write nothing. That is the property, not luck.
    for (let w = 901; w <= 910; w++) {
      world.week = w
      rollEnds(world)
      deliverKnownPartner(world)
    }
    expect(lifeRows(world), 'still two rows, ten weeks later').toHaveLength(2)
  })
})
