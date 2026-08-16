// ⭐ ROUND-21 #6 (the leftover) – THE SEPTEMBER LINE, ON THE TILE HE FOUND IT ON.
//
// THE OWNER, 14.08:
//   «Если день рождения в декабре, то вся школа уже закончилась и в сентябре вроде бы её быть не
//    должно, мы это обсуждали. Надо везде по коду проверить этот сдвиг»
//
// (The quote lives in a test rather than in the template it is about: tests/round13-nav.test.ts bans
// Cyrillic inside a Vue template, comments included.)
//
// ⚠ HE IS RIGHT ABOUT THE FACTS AND THE BEHAVIOUR IS CORRECT, WHICH IS THE WHOLE PROBLEM. Round-21 #6
// swept 35 sites and measured it: the ITF band is one birth YEAR - every girl in the 14s shares a
// year - but the school year turns over on 1 September, so the band splits and the halves leave
// school 52 weeks apart (`schoolEndWeek` returns career week 242 for January-August and 294 for
// September-December). In the September in between, a December girl is in her final school year
// while her own age group is already out. Both halves leave between 18.00 and 18.92 real years old,
// so nothing violates «школа уже после 18 вроде не должна быть»; what he is objecting to is the
// SPLIT, and it is real.
//
// ⚠ AND HE RULED THAT IT STAYS. Collapsing the halves onto one leaving week is a BALANCE change (52
// weeks of a Sept-Dec career move onto `ECONOMY.school.loadFactor`), which needs a bench and a spec
// under CLAUDE.md invariant 4. So NO CLOCK MOVES on this branch. What was missing is that nothing on
// screen accounted for it, and correct behaviour with no account of itself reads exactly like a bug.
//
// ⚠ MUTATION-VERIFIED:
//   * make `schoolCutOffNote` return the sentence for every birth month -> the June arm goes red.
//   * drop the `gradeOf(...) === null` clause                           -> the after-school arm goes red.
//   * delete the `v-if="life?.schoolWhy"` paragraph from KidScreen      -> the December arm goes red.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import KidScreen from '../../src/components/screens/KidScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot, closeTournament, skipTournament, decideKnock, pendingKnock } from '../../src/engine/world'
import { schoolEndWeek, schoolIsOver } from '../../src/engine/kidLife'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'

/** A REAL career with a REAL birth month, ticked to `week` through the real engine. Funds are held
 *  up so the arms differ by the CALENDAR and not by a bankruptcy ending the career before the
 *  September under test. */
function careerAt(week: number, birthMonth: number, seed = `school-${birthMonth}`): Snapshot {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth })
  const rng = rngFromSeed(world.seed)
  while (world.week < week) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return toSnapshot(world)
}

function mountKid(snapshot: Snapshot) {
  useGameStore().snapshot = snapshot
  return mount(KidScreen, { global: { stubs: { teleport: true } } })
}

// The exact September the owner is looking at: past the school year's turn (`SCHOOL_YEAR_TURNS_AT`
// = season week 34) and inside the 52-week gap between the two halves of one ITF band.
const HER_SEPTEMBER = 246

describe('⭐ ROUND-21 #6 – the School tile explains its own September', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⚠ THE FIXTURE IS THE SITUATION HE REPORTED, checked before anything is read off a screen', () => {
    // Stated as an assertion rather than as a comment, because the whole test is about this week
    // being the one where the split is visible. If the clock ever moves, this goes red FIRST and
    // names the reason, instead of the copy assertions below failing mysteriously.
    expect(schoolEndWeek(12), 'a December girl leaves at 294').toBe(294)
    expect(schoolEndWeek(6), 'a June girl in the same band left at 242').toBe(242)
    expect(schoolIsOver(HER_SEPTEMBER, 12), 'she is still at school in this September').toBe(false)
    expect(schoolIsOver(HER_SEPTEMBER, 6), 'and her own age group is already out').toBe(true)
  })

  it('⭐⭐ A DECEMBER-BORN GIRL IS TOLD WHY, in ordinary English, on the tile', () => {
    const snap = careerAt(HER_SEPTEMBER, 12)
    expect(snap.ending ?? null, 'the career is still running, so this is the live screen').toBeNull()
    const w = mountKid(snap)

    // The tile itself is unchanged and still says she is at school - the behaviour he reported.
    const tiles = w.findAll('.kid-tile')
    const school = tiles.find((t) => t.find('.kid-tile-label').text() === 'School')
    expect(school, 'the School tile is on the screen').toBeTruthy()
    expect(school!.findAll('.kid-tile-line')[0].text()).toMatch(/grade/i)

    // ...and the line under the grid accounts for it.
    const note = w.find('.kid-grid-note')
    expect(note.exists(), 'the September has an explanation on the screen it appears on').toBe(true)
    const text = note.text()
    // It names the tile it belongs to, the rule, the consequence and the comparison - and nothing
    // else. Read as four claims rather than as one string, so a rewrite that keeps the meaning
    // keeps the test.
    expect(text, 'it says which tile it is about').toMatch(/^School –/)
    expect(text, 'the rule: a 1 September cut-off').toMatch(/1 September cut-off/i)
    expect(text, 'the consequence: she finishes the summer after she turns 18').toMatch(/summer after she turns 18/i)
    expect(text, 'and the comparison he was making').toMatch(/a year later than girls born earlier/i)
    // Player copy: short dash only, no long dash anywhere, plain ASCII otherwise.
    expect(text).not.toContain('—')
    expect(text).toMatch(/^[\x20-\x7e–]+$/)
    w.unmount()
  })

  it('⚠ AND A JUNE-BORN GIRL IN THE SAME BAND IS TOLD NOTHING, because for her it would be false', () => {
    // The claim is "she finishes a year later than girls born earlier in the same tennis year". A
    // girl born before the cut-off is one of those girls, so the sentence would be a lie on her
    // screen - and by this week she has left school anyway.
    const snap = careerAt(HER_SEPTEMBER, 6, 'school-6-same-week')
    const w = mountKid(snap)
    expect(w.find('.kid-grid-note').exists()).toBe(false)
    w.unmount()
  })

  it('⚠ AND IT IS SILENT AT 14 FOR A JUNE GIRL AND SPEAKING AT 14 FOR A DECEMBER ONE', () => {
    // The split is not only a fact about her last September - it is true from her first day at
    // school, because she started a year behind them too. So the line follows the BIRTH MONTH and
    // not the week; this is the arm that tells the two apart while both are still schoolgirls.
    const dec = mountKid(careerAt(12, 12, 'school-12-young'))
    expect(dec.find('.kid-grid-note').exists(), 'a December girl at 14 is already a year behind them').toBe(true)
    dec.unmount()

    setActivePinia(createPinia())
    const jun = mountKid(careerAt(12, 6, 'school-6-young'))
    expect(jun.find('.kid-grid-note').exists()).toBe(false)
    jun.unmount()
  })

  it('...and it stops once school is behind her, when there is nothing left to explain', () => {
    // `schoolEndWeek(12)` is 294; one week past it the tile reads "School's done", which accounts
    // for itself.
    const snap = careerAt(schoolEndWeek(12) + 1, 12, 'school-12-done')
    expect(snap.ending ?? null, 'the career is still running').toBeNull()
    const w = mountKid(snap)
    const tiles = w.findAll('.kid-tile')
    const school = tiles.find((t) => t.find('.kid-tile-label').text() === 'School')
    expect(school!.findAll('.kid-tile-line')[0].text()).toMatch(/done/i)
    expect(w.find('.kid-grid-note').exists()).toBe(false)
    w.unmount()
  })
})
