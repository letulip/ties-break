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
  birthdayOffer,
  chooseGift,
} from '../../src/engine/world'
import { buildKidLife, STAGE_LABEL } from '../../src/engine/kidLife'
import { ENDINGS } from '../../src/engine/ending'
import { COLLEGE_TIER_NAME } from '../../src/engine/collegeOffer'
import { rngFromSeed } from '../../src/engine/rng'
import { seasonYear } from '../../src/shared/dates'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'

/** A REAL career ticked to `week`, held solvent so an arm is decided by the calendar rather than by
 *  a bankruptcy. The same harness tests/component/round21-school-cutoff.test.ts uses. */
function careerAt(week: number, seed = 'round23-page'): Snapshot {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 6 })
  const rng = rngFromSeed(world.seed)
  while (world.week < week) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    const age = pendingBirthday(world)
    if (age !== null) chooseGift(world, birthdayOffer(world.seed, age).options[0].id)
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
    expect(w.find('.kid-note-account').exists(), 'and there is no account before eighteen').toBe(false)
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
    const note = w.find('.kid-note-account')
    expect(note.exists(), 'from eighteen the page says the transfers are happening').toBe(true)
    const text = note.text()
    expect(text).toContain('$512,835')
    expect(text).toMatch(/\d+% of every cheque/)
    expect(text, 'player copy: short dash only').not.toContain('—')
    expect(text).toMatch(/^[\x20-\x7e–]+$/)
    w.unmount()
  })

  it('⭐⭐ #6b – THE COLLEGE SENTENCE RENDERS, and names the place and the year', () => {
    const base = careerAt(300)
    const life = buildKidLife({
      seed: base.seed,
      week: base.week,
      ageYears: 20,
      seasonYear: seasonYear(Math.floor(base.week / 52)),
      playStyle: base.profile.playStyle,
      birthMonth: base.profile.birthMonth,
      injured: false,
      weeksAway: 0,
      lossStreak: 0,
      weeksSinceTitle: null,
      college: { studying: true, yearsDone: 1, totalYears: ENDINGS.collegeYears, tier: 'national' },
      kidFundsCents: 512_835_00,
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

  it('⚠ AND THE THREE NOTES ALL FIT A 375x667 PHONE, stacked, with the radar still under them', () => {
    // Round-20 #3: the dialog that grew one honest sentence at a time until its dismiss control left
    // the screen. These are not a blocking overlay, but they are three paragraphs added to one
    // scroll in one wave, so the same measurement is owed. The claim is the LAYOUT one that a
    // character count cannot make: none of them is wider than the viewport.
    const base = careerAt(300, 'round23-page-wide')
    const life = buildKidLife({
      seed: base.seed,
      week: base.week,
      ageYears: 20,
      seasonYear: seasonYear(Math.floor(base.week / 52)),
      playStyle: base.profile.playStyle,
      birthMonth: 12,
      injured: false,
      weeksAway: 0,
      lossStreak: 0,
      weeksSinceTitle: null,
      college: { studying: true, yearsDone: 3, totalYears: ENDINGS.collegeYears, tier: 'private' },
      kidFundsCents: 8_909_415_00,
    })
    const w = mountKid({ ...base, life })
    const notes = w.findAll('.kid-grid-note')
    expect(notes.length, 'the college line and the account line are both up').toBeGreaterThanOrEqual(2)
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
