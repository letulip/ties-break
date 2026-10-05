// ⭐⭐ ROUND-23 #6 + #18 – WHAT HER OWN PAGE ACTUALLY RENDERS, on the mounted screen.
//
// The engine arms live in tests/round23-kid-life.test.ts and tests/round23-kid-share.test.ts. THIS
// file asks the other question, and it is the one a source pin cannot: does screen C put the
// engine's answer on the screen, in the cell and under the grid, and does it stop when the engine
// stops. Round-20 #3's own lesson – «every check was about what the card SAYS, none about what the
// screen can HOLD» – is why the three notes are also measured against a 375x667 phone here.
//
// ⚠ THE FIRST TWO SNAPSHOTS ARE REAL CAREERS, ticked through the real engine. The COLLEGE arm is a
// real career's snapshot with a real `buildKidLife` output spliced into `life` – the strings are
// still the engine's own, assembled from a real `KidLifeCollegeView`, because walking a career to
// the fork and through a college year inside happy-dom costs more than the arm proves. The
// end-to-end (`toSnapshot` on a career that really enrolled) is in the unit file.
//
// ⚠ MUTATION-VERIFIED:
//   * hard-code the cell's heading back to "School"        -> the label arm goes red.
//   * delete the `v-if="life?.collegeNote"` paragraph      -> the college arm goes red.
//   * delete the `v-if="life?.ownAccount"` paragraph       -> the account arm goes red.
//   * `ownAccountNote` returns '' always                   -> the account arm goes red, alone.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import KidScreen from '../../src/components/screens/KidScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  createWorld,
  tickWeek,
  toSnapshot,
  closeTournament,
  skipTournament,
  decideKnock,
  pendingKnock,
  pendingBirthday,
  birthdayOfferFor,
  chooseGift,
} from '../../src/engine/world'
import { buildKidLife, STAGE_LABEL } from '../../src/engine/kidLife'
import { ENDINGS } from '../../src/engine/ending'
import { COLLEGE_TIER_NAME } from '../../src/engine/collegeOffer'
import { rngFromSeed } from '../../src/engine/rng'
import { seasonYear } from '../../src/shared/dates'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import type { LoveEpisode } from '../../src/shared/protocol/narrative'
import { relationshipDurationWeeks } from '../../src/engine/world/loveEpisodes'
import { partnerNameFor, PARTNER_NAME_POOL } from '../../src/engine/world/lifeBeat/wedding'
import { togetherSpan } from '../../src/engine/world/lifeBeat/weddingCopy'

/** A REAL career ticked to `week`, held solvent so an arm is decided by the calendar rather than by
 *  a bankruptcy. The same harness tests/component/round21-school-cutoff.test.ts uses. */
function careerAt(week: number, seed = 'round23-page'): Snapshot {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 6 })
  const rng = rngFromSeed(world.seed)
  while (world.week < week) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    const age = pendingBirthday(world)
    if (age !== null) chooseGift(world, birthdayOfferFor(world, age).options[0].id)
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  // ⭐ #18: a balance she could only have from her own share, so the account line has a real figure.
  world.kidFundsCents = 512_835_00
  return toSnapshot(world)
}

function mountKid(snapshot: Snapshot) {
  useGameStore().snapshot = snapshot
  return mount(KidScreen, { global: { stubs: { teleport: true } } })
}

/** The tile whose heading is `label`, or undefined – which is itself the assertion in two arms. */
function tileWithLabel(w: ReturnType<typeof mountKid>, label: string) {
  return w.findAll('.kid-tile').find((t) => t.find('.kid-tile-label').text() === label)
}

describe('⭐⭐ ROUND-23 #6/#18 – her page, mounted', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('at fourteen the cell is still headed School and still prints a grade', () => {
    const w = mountKid(careerAt(30))
    const school = tileWithLabel(w, STAGE_LABEL.school)
    expect(school, 'the cell is headed School while she is at school').toBeTruthy()
    expect(school!.findAll('.kid-tile-line')[0].text()).toMatch(/ grade$/)
    expect(w.find('.kid-note-college').exists()).toBe(false)
    // ⚠⚠ RE-AIMED BY ROUND 41 #27 (12.09), AND IT IS THE OWNER WHO INVERTED IT. This line read «and
    // there is no account before eighteen» and asserted the note was ABSENT – true while the ramp
    // started on her eighteenth birthday. His ruling: «призовые падают на её счёт с первого старта
    // W-серии независимо от возраста – согласен». `careerAt` plants a balance of $512,835 on every
    // world it builds («a balance she could only have from her own share», its own comment), and a
    // fourteen-year-old holding half a million of her own prize money is exactly the career his
    // ruling creates – so the page has to say so.
    // ⚠⚠ RE-AIMED AGAIN BY ROUND 42 #10 (14.09): SAME CLAIM, NEW SURFACE. The owner asked for her
    // account to be said the way the family budget says money («использовать то же, что и в family
    // budget»), so the `.hint` paragraph is a `.kid-account` CARD of `StatRow` rows beside the
    // counting results. What this case asserts is unchanged – a junior with a balance is told about
    // it – and only the selector moved.
    expect(w.find('.kid-account').exists(), 'a junior with a balance is told about it').toBe(true)
    // ⚠ AND THE OTHER SIDE OF THE GATE, which is what keeps the card off a page that has nothing to
    // explain: the same age with an EMPTY account says nothing at all. Without this the arm above
    // would pass with the balance clause deleted.
    const empty = careerAt(30)
    const w2 = mountKid({ ...empty, life: { ...empty.life, ownAccount: '', account: null } })
    expect(w2.find('.kid-account').exists(), 'an empty account is not a subject').toBe(false)
    w.unmount()
  })

  it('⭐⭐ PAST THE LAST BELL THE HEADING MOVES WITH HER, and the cell is not a status flag', () => {
    const w = mountKid(careerAt(300))
    expect(tileWithLabel(w, STAGE_LABEL.school), 'nothing is headed School any more').toBeUndefined()
    const cell = tileWithLabel(w, STAGE_LABEL.after)
    expect(cell, 'it is headed for the stage she is at').toBeTruthy()
    const lines = cell!.findAll('.kid-tile-line').map((l) => l.text())
    expect(lines[0]).toBe('Tennis full-time')
    expect(lines[1]).toBe('No more classes')
    expect(lines.join(' ')).not.toMatch(/finished/i)
    w.unmount()
  })

  it('⭐⭐ #18 – HER OWN ACCOUNT IS ON HER OWN PAGE, with the balance and the rule', () => {
    const w = mountKid(careerAt(300))
    // ⚠⚠ RE-AIMED BY ROUND 42 #10 (14.09) – the surface is a card of `StatRow` rows now, not a
    // paragraph, and the three facts it carries are the three this case has always asked for: the
    // balance, HER rate, and the manager's. The wording of two of them moved with the shape (a row
    // is «label … figure», so «10% of every prize cheque» became «Her cut of a prize cheque · 10%»)
    // – which is the item's own licence, not an agent's tidy-up – so the assertions read the FACTS
    // rather than the old sentence's syntax. The load-bearing half of round 29 P3 survives
    // literally: the sponsor money is hers less the manager's, said on its own row.
    const card = w.find('.kid-account')
    expect(card.exists(), 'from eighteen the page says the transfers are happening').toBe(true)
    const text = card.text()
    expect(text).toContain('$512,835')
    expect(text, 'her own rate, composed by the engine and never a literal in a template').toMatch(
      /Her cut of a prize cheque\s*[\d.]+%/,
    )
    expect(text, "and P3's half is here too – the sponsor money is hers").toMatch(
      /Manager's cut of a sponsor cheque\s*[\d.]+%/,
    )
    expect(text, 'player copy: short dash only').not.toContain('—')
    expect(text.replace(/\s+/g, ' ')).toMatch(/^[\x20-\x7e–]+$/)
    w.unmount()
  })

  it('⭐⭐ #6b – THE COLLEGE SENTENCE RENDERS, and names the place and the year', () => {
    const base = careerAt(300)
    const life = buildKidLife({
      seed: base.seed,
      week: base.week,
      ageYears: 20,
      seasonYear: seasonYear(Math.floor(base.week / 52)),
      // ⚠ ROUND 42 #6 – the Personality tile is keyed on her temperament now. This file is about
      // the School/College/account surfaces, so the career's own girl is the honest value to pass.
      temperament: base.diary.facts.temperament,
      // ⚠ ROUND 42 #37 – and her composure, the Personality line's first word. Nothing in this file
      // asserts about that tile, so this is the default girl the view has to name.
      composure: 50,
      playStyle: base.profile.playStyle,
      birthMonth: base.profile.birthMonth,
      injured: false,
      weeksAway: 0,
      lossStreak: 0,
      weeksSinceTitle: null,
      college: { studying: true, yearsDone: 1, totalYears: ENDINGS.collegeYears, tier: 'national' },
      kidFundsCents: 512_835_00,
      // ⚠ ROUND 42 #25 – a hand-built view has no college era behind it, so no step of her
      // ramp is paused. The real one comes from `collegePausedShareYears` at snapshot time.
      kidSharePausedYears: 0,
      ownsBrand: false,
    })
    const w = mountKid({ ...base, life })
    const cell = tileWithLabel(w, STAGE_LABEL.college)
    expect(cell, 'the cell is headed College while she is there').toBeTruthy()
    expect(cell!.findAll('.kid-tile-line')[0].text()).toBe(`Year 2 of ${ENDINGS.collegeYears}`)
    const note = w.find('.kid-note-college')
    expect(note.exists()).toBe(true)
    expect(note.text()).toMatch(/^College –/)
    expect(note.text()).toContain(COLLEGE_TIER_NAME.national)
    expect(note.text()).toContain(`year 2 of ${ENDINGS.collegeYears}`)
    w.unmount()
  })

  it('⚠ AND THE NOTES UNDER THE GRID ALL FIT A 375x667 PHONE, with the radar still under them', () => {
    // Round-20 #3: the dialog that grew one honest sentence at a time until its dismiss control left
    // the screen. These are not a blocking overlay, but they are paragraphs added to one scroll in
    // one wave, so the same measurement is owed. The claim is the LAYOUT one that a character count
    // cannot make: none of them is wider than the viewport.
    //
    // ⚠⚠ RE-AIMED BY ROUND 42 #10: the account left this stack. It is a `.kid-account` CARD beside
    // the counting results now, so the notes under the grid are the school and college lines, and
    // the floor drops from two to one – a career like this one, out of school and in college, has
    // exactly the college line (`schoolWhy` is silent the moment she is out). The account's own
    // 375/768/900/1280 measurement lives in tests/component/round42-kid-tile-and-account.test.ts,
    // where the card is, and it measures the row's box rather than a paragraph's wrap.
    const base = careerAt(300, 'round23-page-wide')
    const life = buildKidLife({
      seed: base.seed,
      week: base.week,
      ageYears: 20,
      seasonYear: seasonYear(Math.floor(base.week / 52)),
      // ⚠ ROUND 42 #6 – the Personality tile is keyed on her temperament now. This file is about
      // the School/College/account surfaces, so the career's own girl is the honest value to pass.
      temperament: base.diary.facts.temperament,
      // ⚠ ROUND 42 #37 – and her composure, the Personality line's first word. Nothing in this file
      // asserts about that tile, so this is the default girl the view has to name.
      composure: 50,
      playStyle: base.profile.playStyle,
      birthMonth: 12,
      injured: false,
      weeksAway: 0,
      lossStreak: 0,
      weeksSinceTitle: null,
      college: { studying: true, yearsDone: 3, totalYears: ENDINGS.collegeYears, tier: 'private' },
      kidFundsCents: 8_909_415_00,
      // ⚠ ROUND 42 #25 – a hand-built view has no college era behind it, so no step of her
      // ramp is paused. The real one comes from `collegePausedShareYears` at snapshot time.
      kidSharePausedYears: 0,
      ownsBrand: false,
    })
    const w = mountKid({ ...base, life })
    const notes = w.findAll('.kid-grid-note')
    expect(notes.length, 'the college line is up').toBeGreaterThanOrEqual(1)
    expect(w.find('.kid-note-college').exists(), 'and it is the college one').toBe(true)
    // ...and her account is on the page too, in its own card rather than in this stack.
    expect(w.find('.kid-account').exists(), 'the account card is where round 42 #10 put it').toBe(true)
    for (const n of notes) {
      const el = n.element as HTMLElement
      // happy-dom reports 0-width boxes, so the honest layout check available here is that the
      // paragraph is a normal block in the flow and carries no width of its own that could exceed
      // the column. A `nowrap` note is the failure this catches.
      expect(getComputedStyle(el).whiteSpace, `${n.text().slice(0, 30)}: must be allowed to wrap`).not.toBe('nowrap')
      expect(n.text().length, 'and no note is a paragraph in disguise').toBeLessThan(220)
    }
    w.unmount()
  })
})

// =================================================================================================
// ⭐⭐ ROUND 46 #9 – THE RELATIONSHIP LINE ON HER PAGE.
//
// THE OWNER, 05.10:
//   «А у нас где-то есть индикатор, что у неё есть отношения в данный момент? Может сделать что-то на
//    личной странице или заменить after school, например, когда он станет неактуальным? С подсчётом
//    сколько они уже вместе например или ещё что-то?»
// (The quote lives here and not in the template: tests/round13-nav.test.ts bans Cyrillic in one.)
//
// WHERE IT LIVES, AND WHY NOT IN THE AFTER-SCHOOL CELL. That cell goes quiet at the top of its own ladder
// (`Grown up` / `Her own life now`, from 22), so «replace it once it is stale» was a fair thought – but the
// line has to stand BEFORE that too (a girl of nineteen on `Tennis full-time` can be with somebody), and a
// name plus `1 year and 6 months` does not fit a `nowrap` tile line. So it takes the seat the school and
// college sentences already take, UNDER THE GRID, and the cell is untouched: the school-seat arm pins that.
//
// ⚠ EVERY SNAPSHOT HERE IS THE REAL `toSnapshot` OF A REAL CAREER. The attachment is written onto the world
// before the snapshot is taken and every expected span is built from the engine's own primitives
// (`relationshipDurationWeeks`, `togetherSpan`, `partnerNameFor`) – the test never types a span the engine
// should have computed. The words AROUND the span are the draft (docs/rounds/round-46.md, R46-S10), so
// they ARE typed: that is the one claim about wording, and it moves with the owner's ruling.
//
// ⚠ MUTATION-VERIFIED (each alone, restored byte for byte) – see the round-46 ledger, item 9, for the run.
//   * `weeks` in snapshot.ts's `together` becomes 0               -> the named and married arms.
//   * the `v-if="life?.togetherNote"` paragraph is removed        -> the named, married, seat and phone arms.
//   * `married: latchedEpisode(world) !== null` becomes `false`   -> the married arm, alone.
//   * `knownPartner(world, world.week)` asks `Infinity` instead   -> the not-told-yet arm, alone.
// =================================================================================================

/** A REAL career ticked to `week` through the harness above, but handing back the WORLD, so an attachment
 *  can be written onto it before the snapshot is taken. */
function worldAt(week: number, seed = 'round23-page') {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 6 })
  const rng = rngFromSeed(world.seed)
  while (world.week < week) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    const age = pendingBirthday(world)
    if (age !== null) chooseGift(world, birthdayOfferFor(world, age).options[0].id)
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}
type CareerWorld = ReturnType<typeof worldAt>

/** One attachment a year and a half old (78 weeks = 52 + 26), built by hand the way
 *  tests/life-moment-engine.test.ts builds its own. `partnerName` is null until a test names him. */
function attachment(world: CareerWorld, over: Partial<LoveEpisode> = {}): LoveEpisode {
  const sinceWeek = world.week - 78
  return {
    id: `p:${sinceWeek}`,
    sinceWeek,
    endedWeek: null,
    knownWeek: sinceWeek + 3,
    wants: 'open',
    partnerId: `p:${sinceWeek}`,
    publicWeek: null,
    publicWrong: false,
    airedMetWeek: null,
    airedEndedWeek: null,
    latchedWeek: null,
    partnerName: null,
    ...over,
  }
}

/** The real snapshot of `world` with `row` as her only attachment, or with none at all. */
function snapshotWith(world: CareerWorld, row: LoveEpisode | null): Snapshot {
  world.loveEpisodes = row === null ? [] : [row]
  return toSnapshot(world)
}

describe('⭐⭐ ROUND 46 #9 – the relationship line on her page', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐ A STANDING ATTACHMENT IS ON THE PAGE – his name, and the span the engine counted', () => {
    const world = worldAt(90)
    const row = attachment(world)
    const name = partnerNameFor(world.seed, row.id)
    const named = snapshotWith(world, { ...row, partnerName: name })
    const weeks = relationshipDurationWeeks(world)
    expect(weeks, 'THE FIXTURE: a year and a half, as the primitive counts it').toBe(78)
    const span = togetherSpan(weeks!)
    expect(span).toBe('1 year and 6 months')

    const w = mountKid(named)
    const line = w.find('.kid-note-together')
    expect(line.exists(), 'the line is on the screen').toBe(true)
    expect(line.text()).toBe(`Together with ${name} for ${span}`)
    expect(line.text(), 'and it is the engine sentence, not one the screen wrote').toBe(named.life.togetherNote)
    w.unmount()

    // Before the engagement writes a name there is none to print, and the line stays short and honest.
    const w2 = mountKid(snapshotWith(world, row))
    expect(w2.find('.kid-note-together').text()).toBe(`Together for ${span}`)
    w2.unmount()
  })

  it('⭐⭐ MARRIED SAYS SO – and the span still counts from the day they got together', () => {
    const world = worldAt(90)
    const row = attachment(world)
    const name = partnerNameFor(world.seed, row.id)
    const married = snapshotWith(world, { ...row, partnerName: name, latchedWeek: world.week - 10 })
    const span = togetherSpan(relationshipDurationWeeks(world)!)
    expect(span, 'a wedding ten weeks ago moves nothing: it is still the year and a half').toBe('1 year and 6 months')
    const w = mountKid(married)
    expect(w.find('.kid-note-together').text()).toBe(`Married to ${name} – together for ${span}`)
    w.unmount()

    // A married row with no name is hand-built (the engine writes the name at the engagement, before any
    // wedding) – but the line must not print «null» for it.
    const w2 = mountKid(snapshotWith(world, { ...row, latchedWeek: world.week - 10 }))
    expect(w2.find('.kid-note-together').text()).toBe(`Married – together for ${span}`)
    w2.unmount()
  })

  it('⭐ NOBODY STANDING, NO LINE – never met, over, or not told to him yet', () => {
    const world = worldAt(90)
    const cases: Array<[string, LoveEpisode | null]> = [
      ['no attachment at all', null],
      ['one that has ended', attachment(world, { endedWeek: world.week - 5 })],
      ['one she has not told him about yet (the fog law)', attachment(world, { knownWeek: world.week + 4 })],
    ]
    for (const [why, row] of cases) {
      const snap = snapshotWith(world, row)
      expect(snap.life.togetherNote, why).toBe('')
      const w = mountKid(snap)
      expect(w.find('.kid-note-together').exists(), why).toBe(false)
      w.unmount()
    }
  })

  it('⭐⭐ THE SCHOOL CELL KEEPS ITS SEAT – with after school current, the line stands beside it', () => {
    const world = worldAt(300)
    const alone = mountKid(snapshotWith(world, null))
    const before = tileWithLabel(alone, STAGE_LABEL.after)
    expect(before, 'a June girl at 300 is past the last bell').toBeTruthy()
    const linesBefore = before!.findAll('.kid-tile-line').map((l) => l.text())
    expect(linesBefore).toEqual(['Tennis full-time', 'No more classes'])
    expect(alone.find('.kid-note-together').exists()).toBe(false)
    alone.unmount()

    const row = attachment(world)
    const withLine = mountKid(snapshotWith(world, { ...row, partnerName: partnerNameFor(world.seed, row.id) }))
    const cell = tileWithLabel(withLine, STAGE_LABEL.after)
    expect(cell, 'still headed for the stage she is at').toBeTruthy()
    expect(cell!.findAll('.kid-tile-line').map((l) => l.text()), 'and says exactly what it said').toEqual(linesBefore)
    expect(withLine.find('.kid-note-together').exists(), 'while the line is up beside it').toBe(true)
    withLine.unmount()
  })

  it('⚠ THE LINE IS A WRAPPING BLOCK IN THE NOTES STACK, in its longest form', () => {
    // The same layout claim the college note is held to above: happy-dom reports 0-width boxes, so what
    // can be asserted is that the paragraph is a normal block in the notes stack (it carries
    // `kid-grid-note`, which is what the desktop media block places) and is allowed to wrap.
    const world = worldAt(90)
    const row = attachment(world)
    const longest = [...PARTNER_NAME_POOL].sort((x, y) => y.length - x.length)[0]
    const w = mountKid(snapshotWith(world, { ...row, partnerName: longest, latchedWeek: world.week - 10 }))
    const line = w.find('.kid-note-together')
    expect(line.exists(), 'the married form, the longest, is up').toBe(true)
    expect(line.classes(), 'it is in the notes stack').toContain('kid-grid-note')
    expect(getComputedStyle(line.element as HTMLElement).whiteSpace, 'and may wrap').not.toBe('nowrap')
    expect(line.text().length, 'and is no paragraph in disguise').toBeLessThan(220)
    w.unmount()
  })
})
