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
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import { setViewport, PHONE, NARROW_PHONE, DESKTOP } from './fits'
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
  raiseLifeBeat,
} from '../../src/engine/world'
import { buildKidLife, GROWN_UP_AGE_YEARS, STAGE_LABEL, TILE_LINE_MAX } from '../../src/engine/kidLife'
import { ENDINGS } from '../../src/engine/ending'
import { COLLEGE_TIER_NAME } from '../../src/engine/collegeOffer'
import { rngFromSeed } from '../../src/engine/rng'
import { seasonYear } from '../../src/shared/dates'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import type { LoveEpisode } from '../../src/shared/protocol/narrative'
import { relationshipDurationWeeks } from '../../src/engine/world/loveEpisodes'
import { kidAgeNow, lifeLogOf } from '../../src/engine/world/lifeBeat'
import { togetherSpan, togetherSpanShort } from '../../src/engine/world/lifeBeat/weddingCopy'

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

  // ⚠ RE-AIMED 21.10 (R53 №2): this arm printed `After school` / `Tennis full-time` / `No more classes` past the last bell. The owner's ask: the «after school» cell is her relationships from the day
  // school is over, and says there is nobody when there is nobody – so the ENGINE still ladders her (`life.school`, `schoolLabel`) and the screen prints `life.relationships` in its place.
  it('⭐⭐ PAST THE LAST BELL THE HEADING MOVES WITH HER – to her relationships (R53 №2) – and the cell is not a status flag', () => {
    const snap = careerAt(300)
    expect(snap.life.schoolLabel, 'THE ENGINE\'S LADDER IS UNTOUCHED: it still heads her After school').toBe(STAGE_LABEL.after)
    expect(snap.life.school, '...and still says Tennis full-time').toEqual({ lead: 'Tennis full-time', note: 'No more classes' })
    const w = mountKid(snap)
    expect(tileWithLabel(w, STAGE_LABEL.school), 'nothing is headed School any more').toBeUndefined()
    expect(tileWithLabel(w, STAGE_LABEL.after), 'and the cell is headed for what it says now').toBeUndefined()
    const cell = tileWithLabel(w, 'Relationships')
    expect(cell, 'it is headed Relationships').toBeTruthy()
    const lines = cell!.findAll('.kid-tile-line').map((l) => l.text())
    expect(lines).toEqual([snap.life.relationships!.lead, snap.life.relationships!.note])
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
// ⭐⭐ ROUND 46 MORNING #3 – HER RELATIONSHIPS, IN THE SCHOOL CELL'S LAST RUNG.
//
// THE OWNER, 06.10 (it re-aims round 46 #9, whose sentence under the grid retired with this):
//   «смотри, я имел в виду, что у нас есть плашка про школу, и она не используется после школы/колледжа
//    примерно никак и просто место занимает. Мы можем в ней писать "Отношения" и заполнять если знаем, что
//    они есть и как давно, либо ставить "кажется одинока" или вроде того когда мы НЕ знаем. Потом меняет с
//    помолвкой, свадьбой и т.д. "Together for {span}" - очень хорошо.»
// (The quote lives here and not in the template: tests/round13-nav.test.ts bans Cyrillic in one.)
//
// WHAT THE ARMS CLAIM. Before the ladder's last rung the cell is the School cell, string for string, with or
// without somebody in her life. From it (out of school, not studying, 22) the engine hands the screen
// `life.relationships` and the cell prints it: nobody the PARENT knows of -> «it seems»; a standing attachment ->
// `Together for {span}`; an announced wedding -> `Engaged`; a latched one -> `Married`. Round 46 #9's paragraph
// and its field are gone in every state.
//
// ⚠ EVERY SNAPSHOT HERE IS THE REAL `toSnapshot` OF A REAL CAREER. The attachment is written onto the world
// before the snapshot is taken and every expected span is built from the engine's own primitives
// (`relationshipDurationWeeks`, `togetherSpanShort`) – the test types ONE span, to pin the fixture, and never a
// span the engine should have computed. The words around the span are the draft (docs/rounds/round-46.md,
// R46-S39–S45), so they ARE typed: that is the one claim about wording, and it moves with the owner's ruling.
//
// ⚠ MUTATION-VERIFIED (each alone, restored byte for byte) – see the round-46 ledger, morning item 3, for the run.
//   * `relationshipsTile` ignores `together` (always «it seems»)  -> the together, engaged and married arms.
//   * the cell stops printing `life.relationships`                -> every terminal arm; the School arm stays green.
//   * `togetherSpanShort` hands back the words form               -> the together and engaged/married arms (their typed
//                                                                     fixture) and the budget arm; nothing else.
// =================================================================================================

type CareerWorld = ReturnType<typeof createWorld>

/** THE FIRST WEEK SHE IS A WOMAN OF 23, off the engine's own clock (`kidAgeNow`, the trick tests/component/calendar-wedding-mark.test.ts
 *  uses) – a year past the ladder's last rung (22), so rounding in her age cannot decide an arm, and no typed week to go stale
 *  when the default profile moves. */
const GROWN_WEEK = (() => {
  const probe = createWorld('round23-page', { ...DEFAULT_PROFILE, birthMonth: 6 })
  while (kidAgeNow(probe) < GROWN_UP_AGE_YEARS + 1) probe.week += 13
  return probe.week
})()

/** ONE WORLD PER (seed, week), KEPT: ticking a grown woman's weeks inside happy-dom costs seconds, and every arm below only
 *  ever writes an attachment onto a world before it takes that world's snapshot, so the arms can share one. */
const worlds = new Map<string, CareerWorld>()

/** A REAL career ticked to `week` through the harness above, but handing back the WORLD, so an attachment
 *  can be written onto it before the snapshot is taken. */
function worldAt(week: number, seed = 'round23-page'): CareerWorld {
  const key = `${seed}:${week}`
  const kept = worlds.get(key)
  if (kept !== undefined) return kept
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
  worlds.set(key, world)
  return world
}

/** One attachment a year and a half old (78 weeks = 52 + 26), built by hand the way
 *  tests/life-moment-engine.test.ts builds its own. */
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

/** The two lines of the cell headed `label`; the cell existing is itself an assertion. */
function printed(w: ReturnType<typeof mountKid>, label: string): string[] {
  const cell = tileWithLabel(w, label)
  expect(cell, `a cell headed ${label}`).toBeTruthy()
  return cell!.findAll('.kid-tile-line').map((l) => l.text())
}

/** Round 46 #9's sentence under the grid is gone: no paragraph on the screen, no field on the wire. */
function expectNoSentence(w: ReturnType<typeof mountKid>, snap: Snapshot, why: string) {
  expect(w.find('.kid-note-together').exists(), `${why}: no paragraph under the grid`).toBe(false)
  expect('togetherNote' in snap.life, `${why}: and no field for it on the wire`).toBe(false)
}

describe('⭐⭐ ROUND 46 MORNING #3 – her relationships, in the School cell\'s last rung', () => {
  beforeEach(() => setActivePinia(createPinia()))

  // ⚠ RE-AIMED 21.10 (R53 №2): this arm held «before the last rung the cell is the School cell, with somebody in her life or not». The owner asked for two things the old law forbade: the cell
  // says there is NOBODY once school is over (any age – the 22 gate is gone from the cell, it stays the ladder's), and a partner the parent KNOWS OF is the cell in any stage, school included.
  // What stays: AT SCHOOL WITH NOBODY KNOWN the cell is the School cell, string for string.
  it('⭐⭐ AT SCHOOL WITH NOBODY KNOWN THE CELL IS THE SCHOOL CELL, STRING FOR STRING – and with a partner the parent knows of it is her relationship, in the same week', () => {
    const world = worldAt(120)
    const nobody = snapshotWith(world, null)
    expect(nobody.life.relationships, 'school, nobody: the engine has handed the cell nothing').toBeNull()
    const w = mountKid(nobody)
    expect(printed(w, STAGE_LABEL.school)).toEqual([nobody.life.school.lead, nobody.life.school.note])
    expect(tileWithLabel(w, 'Relationships'), 'and no cell is headed Relationships').toBeUndefined()
    w.unmount()
    const told = snapshotWith(world, attachment(world))
    expect(told.life.school.lead, 'THE FIXTURE: the ladder is still on her grade').toMatch(/ grade$/)
    const w2 = mountKid(told)
    expect(printed(w2, 'Relationships'), 'at school with a partner he knows of: the engine\'s own pair').toEqual([told.life.relationships!.lead, told.life.relationships!.note])
    expect(printed(w2, 'Relationships')[0]).toBe('Together for')
    expect(tileWithLabel(w2, STAGE_LABEL.school), 'the grade is not on the page: the cell is hers').toBeUndefined()
    w2.unmount()
  }, 120_000)

  it('⭐⭐ OUT OF SCHOOL AT ANY AGE THE CELL SAYS THERE IS NOBODY – «Tennis full-time» no longer stands in for it', () => {
    const world = worldAt(300)
    const snap = snapshotWith(world, null)
    expect(snap.life.school.lead, 'THE FIXTURE: the ladder is on its rung before the grown-up one').toBe('Tennis full-time')
    expect(snap.life.relationships).toEqual({ label: 'Relationships', lead: 'On her own', note: 'it seems' })
    const w = mountKid(snap)
    expect(printed(w, 'Relationships')).toEqual(['On her own', 'it seems'])
    expect(tileWithLabel(w, STAGE_LABEL.after)).toBeUndefined()
    w.unmount()
  }, 120_000)

  it('⭐⭐ A GROWN WOMAN WITH NOBODY THE PARENT KNOWS OF – the cell says so, and says it only as «it seems»', () => {
    const world = worldAt(GROWN_WEEK)
    const snap = snapshotWith(world, null)
    expect(snap.life.relationships, 'THE FIXTURE: the first season she is 23 is past the last rung').not.toBeNull()
    const w = mountKid(snap)
    expect(printed(w, 'Relationships')).toEqual(['On her own', 'it seems'])
    expect(tileWithLabel(w, STAGE_LABEL.after), 'and no cell is headed After school any more').toBeUndefined()
    expect(w.text(), 'the dead lines left with the heading').not.toContain('Her own life now')
    expectNoSentence(w, snap, 'nobody')
    w.unmount()
  }, 120_000)

  it('⭐⭐ A KNOWN ATTACHMENT READS «Together for» – his own shape – with the span the engine counted', () => {
    const world = worldAt(GROWN_WEEK)
    const snap = snapshotWith(world, attachment(world))
    const weeks = relationshipDurationWeeks(world)
    expect(weeks, 'THE FIXTURE: a year and a half, as the primitive counts it').toBe(78)
    const span = togetherSpanShort(weeks!)
    expect(span, 'and the compact words for it').toBe('1y 6m')
    const w = mountKid(snap)
    expect(printed(w, 'Relationships')).toEqual(['Together for', span])
    expect(printed(w, 'Relationships'), 'the engine\'s own pair, not one the screen wrote').toEqual([
      snap.life.relationships!.lead,
      snap.life.relationships!.note,
    ])
    expectNoSentence(w, snap, 'together')
    w.unmount()
  }, 120_000)

  it('⭐⭐ ENGAGED AND MARRIED CHANGE THE CELL – and the span still counts from the day they got together', () => {
    const world = worldAt(GROWN_WEEK)
    const row = attachment(world)
    const plain = snapshotWith(world, row)
    const span = togetherSpanShort(relationshipDurationWeeks(world)!)
    expect(span, 'THE FIXTURE: a year and a half – nothing below moves the day they got together').toBe('1y 6m')
    expect(plain.life.relationships!.lead, 'before either, the plain form').toBe('Together for')

    // ENGAGED: the parent has answered the announcement card, so the calendar's own question says a wedding is coming.
    // ⚠ ON A WORLD OF ITS OWN: the card is a row in her life log, and a caller cannot take a row back off that log
    // (it is read-only to one), so the arm that raises it does not borrow the world the other arms share.
    const bride = worldAt(GROWN_WEEK, 'round23-page-engaged')
    const brideRow = attachment(bride)
    bride.loveEpisodes = [brideRow]
    raiseLifeBeat(bride, 'engaged', brideRow.id)
    lifeLogOf(bride).at(-1)!.answer = 'bless'
    const engaged = toSnapshot(bride)
    expect(engaged.weddingWeek, 'THE FIXTURE: a wedding is announced').not.toBeNull()
    const w = mountKid(engaged)
    expect(printed(w, 'Relationships')).toEqual(['Engaged', `together ${span}`])
    expectNoSentence(w, engaged, 'engaged')
    w.unmount()

    // MARRIED: a wedding ten weeks ago moves nothing – it is still the year and a half.
    const married = snapshotWith(world, { ...row, latchedWeek: world.week - 10 })
    expect(togetherSpanShort(relationshipDurationWeeks(world)!), 'a wedding ten weeks ago moves nothing').toBe(span)
    const w2 = mountKid(married)
    expect(printed(w2, 'Relationships')).toEqual(['Married', `together ${span}`])
    expectNoSentence(w2, married, 'married')
    w2.unmount()
  }, 120_000)

  it('⭐ THE FOG LAW – never met, ended, or not told to him yet: all three read «it seems»', () => {
    const world = worldAt(GROWN_WEEK)
    const cases: Array<[string, LoveEpisode | null]> = [
      ['no attachment at all', null],
      ['one that has ended', attachment(world, { endedWeek: world.week - 5 })],
      ['one she has not told him about yet', attachment(world, { knownWeek: world.week + 4 })],
    ]
    for (const [why, row] of cases) {
      const snap = snapshotWith(world, row)
      expect(snap.life.relationships, why).toEqual({ label: 'Relationships', lead: 'On her own', note: 'it seems' })
      const w = mountKid(snap)
      expect(printed(w, 'Relationships'), why).toEqual(['On her own', 'it seems'])
      w.unmount()
    }
  }, 120_000)

  // ⚠ RE-AIMED 14.10 (r51 B14, №4): «NOWRAP» IN THIS TITLE AND IN THE MESSAGES BELOW IS HISTORY – the School, Friends and Coach lines WRAP now (`.kid-tile-line`, held
  // mounted in tests/component/r51-b14-kid-tile-wraps.test.ts). What this arm still holds is the ENGINE's side: the cell is the pair of plain tile lines (neither is the
  // Personality hook) and each stays inside TILE_LINE_MAX, the English generation budget, which did not move.
  it('⚠ THE CELL KEEPS ITS TWO NOWRAP LINES – every form fits the budget, and the words form would not', () => {
    const world = worldAt(GROWN_WEEK)
    const row = attachment(world)
    for (const [state, over] of [['together', {}], ['married', { latchedWeek: world.week - 10 }]] as const) {
      const w = mountKid(snapshotWith(world, { ...row, ...over }))
      const cell = tileWithLabel(w, 'Relationships')
      expect(cell, `${state}: the cell is up`).toBeTruthy()
      const lines = cell!.findAll('.kid-tile-line')
      expect(lines, `${state}: it is the School cell's own pair of lines`).toHaveLength(2)
      for (const l of lines) {
        expect(l.classes(), `${state}: neither line opts out of the nowrap rule`).not.toContain('kid-tile-personality')
        expect(l.text().length, `${state}: "${l.text()}"`).toBeLessThanOrEqual(TILE_LINE_MAX)
      }
      w.unmount()
    }
    // The reason the compact span exists: with the words form the second line is over budget at a year and a half.
    expect(`together ${togetherSpan(78)}`.length, 'the words form would be cut by the cell').toBeGreaterThan(TILE_LINE_MAX)
  }, 120_000)
})

// =================================================================================================
// ⭐⭐ ROUND 53 №2 (21.10) – HIS NAME ON THE CELL, and the cell on a phone.
// ⚠ DRAFT strings (`Engaged: {name}`, `Married: {name}`, `Dating: {name}`) – docs/localization/ru-display-words-2026-10.md, R53-REL-01..03. MUTATIONS (each alone, restored byte for byte):
//   * `name: partner.partnerName ?? null` in snapshot.ts -> `name: null`   -> the named arms. * the fog gate (`knownPartner`) removed from `together` -> the not-told arm.
// =================================================================================================
describe('⭐⭐ ROUND 53 №2 – the partner\'s name on her relationships cell', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => setViewport(DESKTOP))

  it('⭐ ENGAGED AND MARRIED PRINT HIS NAME ON THE LEAD (the span stays on the note); BEFORE THE ENGAGEMENT HAS GIVEN HIM ONE NO NAME IS PRINTED', () => {
    const world = worldAt(GROWN_WEEK)
    const span = togetherSpanShort(relationshipDurationWeeks(world)!)
    const unnamed = snapshotWith(world, attachment(world, { partnerName: null }))
    expect(unnamed.life.relationships!.lead, 'no name yet: the plain form').toBe('Together for')
    const named = snapshotWith(world, attachment(world, { partnerName: 'Anton' }))
    expect(named.life.relationships, 'a name on a standing attachment').toEqual({ label: 'Relationships', lead: 'Dating: Anton', note: `together ${span}` })
    const married = snapshotWith(world, attachment(world, { partnerName: 'Gabriel', latchedWeek: world.week - 10 }))
    const w = mountKid(married)
    expect(printed(w, 'Relationships')).toEqual(['Married: Gabriel', `together ${span}`])
    w.unmount()
    const bride = worldAt(GROWN_WEEK, 'round23-page-engaged')
    const row = attachment(bride, { partnerName: 'Anton' })
    bride.loveEpisodes = [row]
    raiseLifeBeat(bride, 'engaged', row.id)
    lifeLogOf(bride).at(-1)!.answer = 'bless'
    const engaged = toSnapshot(bride)
    const w2 = mountKid(engaged)
    expect(printed(w2, 'Relationships')).toEqual(['Engaged: Anton', `together ${span}`])
    w2.unmount()
  }, 120_000)

  it('⭐ THE FOG LAW – a name the parent has not been told reaches no line of the page and no key of the wire', () => {
    const world = worldAt(GROWN_WEEK)
    const snap = snapshotWith(world, attachment(world, { partnerName: 'Anton', knownWeek: world.week + 4 }))
    expect(snap.life.relationships).toEqual({ label: 'Relationships', lead: 'On her own', note: 'it seems' })
    expect(JSON.stringify(snap.life), 'no name anywhere in the life block').not.toContain('Anton')
    const ended = snapshotWith(world, attachment(world, { partnerName: 'Anton', endedWeek: world.week - 5 }))
    expect(JSON.stringify(ended.life), 'and none once it has ended').not.toContain('Anton')
    // …and the wire carries the name and nothing else of the episode
    const told = snapshotWith(world, attachment(world, { partnerName: 'Anton' }))
    expect(JSON.stringify(told.life), 'the name and the span, never the episode: no id, no week of anything, no wants').not.toMatch(/sinceWeek|knownWeek|latchedWeek|wants|partnerId|publicWeek/)
  }, 120_000)

  // THE CELL ON A PHONE. Tile lines WRAP (r51 B14) and the tile has no ceiling, so the claim that can hold is the cascade's, at both widths, for the WIDEST lead the pool can make, plus the
  // engine's English budget; `setViewport` runs BEFORE the mount (happy-dom caches a media query on the first computed-style read).
  it('⭐ AT 375x667 AND 320x568 the widest lead (a seven-letter name) wraps rather than clips, and sits inside the budget', () => {
    const world = worldAt(GROWN_WEEK)
    const snap = snapshotWith(world, attachment(world, { partnerName: 'Gabriel', latchedWeek: world.week - 10 }))
    for (const vp of [PHONE, NARROW_PHONE]) {
      setViewport(vp)
      useGameStore().snapshot = snap
      const w = mount(KidScreen, { attachTo: document.body, global: { stubs: { teleport: true } } })
      const cell = tileWithLabel(w, 'Relationships')!
      expect(cell, `${vp.width}: the cell is up`).toBeTruthy()
      const lines = cell.findAll('.kid-tile-line')
      expect(lines.map((l) => l.text())).toEqual(['Married: Gabriel', `together ${togetherSpanShort(78)}`])
      for (const l of lines) {
        expect(l.text().length, `${vp.width}: "${l.text()}"`).toBeLessThanOrEqual(TILE_LINE_MAX)
        expect(getComputedStyle(l.element).getPropertyValue('white-space'), `${vp.width}: "${l.text()}" may wrap`).toBe('normal')
        expect(getComputedStyle(l.element).getPropertyValue('text-overflow'), `${vp.width}: and is never cut`).toBe('clip')
      }
      w.unmount()
      document.body.innerHTML = ''
    }
    setViewport(DESKTOP)
  }, 120_000)
})
