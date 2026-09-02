// ROUND 23, THE COACH CARD AS THE OWNER SEES IT – #1 (her level, said in plain words) and #5 (a
// description per coach, distinct inside its tier).
//
// ⚠ THIS FILE MOUNTS THE SCREEN AND READS THE STRINGS OFF IT. The mechanical half – the ladder, the
// no-flicker walk over a real career, the roster completeness and the within-tier duplicate check –
// is tests/round23-coach-copy.test.ts. Both are wanted and they answer different questions: a grep
// proving a string exists in source is not evidence that the SCREEN changed, and a rendered string
// alone cannot say the band is monotone over nine seasons.
//
// The owner's words are in the engine beside the code they describe (no Cyrillic in a template –
// tests/round13-nav.test.ts checks comments too):
//   #1  «...что-то вроде "она близка к своему потолку" или "ещё есть куда расти" или "у неё большой
//       потенциал" ... что даст игроку понять более явно»
//   #5  «Разный текст для каждой из карточек тренеров с микро описанием каждого из них в своём тире»
//
// ⚠ MUTATION-VERIFIED. The full ten-mutation ledger is in tests/round23-coach-copy.test.ts, run
// against both files together; the ones that land HERE, and only here, are the ones that say the
// SCREEN changed rather than the engine:
//
//   * the template's `<strong class="cm-room-band">` deleted, i.e. the shipped sentence with no band
//     in front of it -> "two headrooms render two DIFFERENT bands", the ladder walk and "prints
//     exactly what the engine wrote"; NOTHING in the unit file.
//   * `roomTail` sliced with a hand-counted `+ 3` instead of the engine's own `ROOM_NOTE_SEP` ->
//     "prints exactly what the engine wrote" ALONE.
//   * the `<span class="cm-blurb">` deleted from the row -> all three of #5 here; nothing in the
//     unit file, which is the whole reason a grep over the SFC is not evidence for this item.
//
// And the two that redden here AND there, so the pair is checked from both sides: `high-2`'s blurb
// set to `high-1`'s (the "one man with two names" defect) reddens the within-tier duplicate test in
// both, and `coachRoomBandIndex` collapsed to `return 0` reddens both band tests here.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
// ⚠ THE APP'S OWN SHEET, for the same reason round21-coach.test.ts pulls it in: `.cm-room-note` and
// the row geometry live in src/style.css, and the new `.cm-blurb` rule lives in the SFC's own scoped
// block. Without this the mount is blind to both.
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
// ⭐ ROUND 34 #2b – the birth build the band now measures FROM; see `snapshotAt`.
import { startingSkills } from '../../src/engine/world/player'
import { coachBlurb } from '../../src/engine/world/coachMarket'
import { SKILL_KEYS } from '../../src/engine/development'
import { DEFAULT_PROFILE, type CoachTier, type Snapshot } from '../../src/shared/protocol'

const TIERS: CoachTier[] = ['budget', 'middle', 'high', 'elite']

/** Screen T, on the Coaches tab, with a real snapshot behind it. Lifted from round21-coach.test.ts –
 *  a hired career lands there by itself (round-18 #3), and the press makes that explicit. */
async function mountCoaches(snapshot: Snapshot) {
  const store = useGameStore()
  store.snapshot = snapshot
  const wrapper = mount(CoachMarketScreen, { global: { stubs: { teleport: true } } })
  const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
  await pill!.trigger('click')
  await nextTick()
  return wrapper
}

/** A career pinned to one realisation share. The ONLY hand-set fields are her level and her ceiling,
 *  which is the pair the band is a function of; price, fit, the market and the note itself are the
 *  engine's, through `toSnapshot`.
 *
 *  ⚠ RE-CUT BY ROUND 34 #2b. The share used to be `mean(skills) / mean(potential)`, so a flat 60
 *  ceiling with `60 * realised` under it said it exactly. The band now reads how much of the room she
 *  was BORN with she has taken (`realisedShare`, world/coachMarket.ts), so both ends are placed
 *  against her birth build - 20 points of headroom per attribute, `realised` of it taken. ⚠ Not a
 *  flat 60: `STARTING_SKILL_BAND.stamina` reaches 60, and a girl born at her ceiling would divide by
 *  zero. */
function snapshotAt(realised: number): Snapshot {
  const world = createWorld(`r23-card-${realised}`, { ...DEFAULT_PROFILE, coachTier: 'middle' })
  const born = startingSkills(world.seed, world.profile)
  for (const k of SKILL_KEYS) {
    world.potential[k] = born[k] + 20
    world.skills[k] = born[k] + 20 * realised
  }
  return toSnapshot(world)
}

// =================================================================================================
// #1 – THE BAND IS ON SCREEN, IN WORDS, AND STILL WITHOUT THE NUMBER
// =================================================================================================
describe('#1 the coach market says where she stands, in plain words', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('two different headrooms render two DIFFERENT bands', async () => {
    // The item, on screen. A girl with most of her game ahead of her and a girl who has filled her
    // ceiling must not read the same sentence – that was the complaint, and the uplift figures they
    // sit above are four tenths of a point apart at the top end (see `coachRoomNote`'s header).
    // ⚠ ONE AT A TIME, AND THE STRINGS ARE TAKEN WHILE MOUNTED. There is one Pinia store per test, so
    // the second `store.snapshot = …` re-renders the FIRST wrapper too – two live wrappers would both
    // read the late career and this test would compare a string with itself. (It did, on the first
    // run: both sides answered "At her ceiling".)
    const read = async (realised: number) => {
      const wrapper = await mountCoaches(snapshotAt(realised))
      const out = {
        band: wrapper.find('.cm-room-band').text(),
        line: wrapper.find('.cm-room-note').text(),
      }
      wrapper.unmount()
      return out
    }
    // ⚠ THE TWO POINTS MOVED WITH THE EDGES (round 34 #2b, 0.40 / 0.75 / 0.90 on true realisation).
    // 0.4 is now the bottom of the SECOND band, so the low arm reads 0.2 to stay the girl with most
    // of her game ahead of her. What is asserted about them did not change.
    const young = await read(0.2)
    const late = await read(0.97)

    expect(young.band).not.toBe(late.band)
    // ...and each is a plain reading rather than a grade, in the vocabulary he handed over.
    expect(young.band).toMatch(/potential/i)
    expect(late.band).toMatch(/ceiling/i)
    // The argument under the label moved with it – a bolded label over a frozen sentence would be
    // decoration, not the fix.
    expect(young.line).not.toBe(late.line)
  })

  it('walks the whole ladder as the room in her closes, and never doubles back', async () => {
    const bands: string[] = []
    // ⚠ SIX POINTS UP THE NEW LADDER (round 34 #2b): two inside band 0, two inside band 1, one in
    // each of the top two. The claim is unchanged - four readings, in order, no repeats - and the
    // doubled-up points are what makes "in order" mean something rather than four lucky samples.
    for (const realised of [0.1, 0.3, 0.5, 0.7, 0.8, 0.95]) {
      const wrapper = await mountCoaches(snapshotAt(realised))
      const band = wrapper.find('.cm-room-band').text()
      if (bands[bands.length - 1] !== band) bands.push(band)
      wrapper.unmount()
    }
    expect(bands.length, `four readings, in order: ${bands.join(' | ')}`).toBe(4)
    expect(new Set(bands).size).toBe(4)
  })

  it('leaks no figure into the line, at any headroom', async () => {
    // ⚠ THE RULING THAT STANDS. `KidScreen` keeps her ceiling behind a fog of war, so this screen
    // may name the band and may never quote it. Asserted on the RENDERED paragraph – label, dash and
    // sentence together – so a percentage cannot arrive in whichever half is not being looked at.
    // ⚠ SWEPT ACROSS THE NEW EDGES (round 34 #2b), a point either side of each of 0.40 / 0.75 / 0.90.
    for (const realised of [0.1, 0.39, 0.41, 0.74, 0.76, 0.89, 0.91, 1.0]) {
      const wrapper = await mountCoaches(snapshotAt(realised))
      const line = wrapper.find('.cm-room-note').text()
      expect(line, `realised ${realised}`).not.toMatch(/\d/)
      expect(line).not.toContain('%')
      expect(line.length, 'and it is really there').toBeGreaterThan(20)
      wrapper.unmount()
    }
  })

  it('prints exactly what the engine wrote – the label is split off, never rewritten', async () => {
    // The screen owns the EMPHASIS and the engine owns the WORDS. `band + tail === note`, so a
    // screen quietly editing copy it does not own shows up here as a mismatch.
    const snapshot = snapshotAt(0.85)
    const wrapper = await mountCoaches(snapshot)
    const rendered = wrapper.find('.cm-room-note').text().replace(/\s+/g, ' ').trim()
    expect(rendered).toBe(snapshot.coachRoomNote.replace(/\s+/g, ' ').trim())
    expect(snapshot.coachRoomNote.startsWith(wrapper.find('.cm-room-band').text())).toBe(true)
    wrapper.unmount()
  })
})

// =================================================================================================
// #5 – EVERY CARD SAYS WHO ITS COACH IS, AND NO TWO ON A RUNG SAY THE SAME
// =================================================================================================
describe('#5 a description per coach, distinct inside its tier', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('every card in the market carries one', async () => {
    const snapshot = snapshotAt(0.6)
    const wrapper = await mountCoaches(snapshot)
    const rows = wrapper.findAll('.cm-row')
    expect(rows.length, 'the market really rendered').toBe(snapshot.coachMarket.length)
    for (const row of rows) {
      const blurb = row.find('.cm-blurb')
      expect(blurb.exists(), row.find('.cm-name').text()).toBe(true)
      expect(blurb.text().length).toBeGreaterThan(10)
    }
    wrapper.unmount()
  })

  it('THE ASK: inside every tier section, no two descriptions are the same', async () => {
    // ⚠ MECHANICAL, NOT EYEBALLED. Read out of the rendered tier BLOCK – the section the chips scroll
    // to – so this is the list the owner is actually looking at when he says two coaches read as one
    // man with two names.
    const wrapper = await mountCoaches(snapshotAt(0.6))
    for (const tier of TIERS) {
      const block = wrapper.find(`#coach-tier-${tier}`)
      expect(block.exists(), `${tier} section`).toBe(true)
      const lines = block.findAll('.cm-blurb').map((b) => b.text())
      expect(lines.length, `${tier} has more than one coach`).toBeGreaterThan(1)
      expect(new Set(lines).size, `${tier}: ${lines.join(' | ')}`).toBe(lines.length)
    }
    wrapper.unmount()
  })

  it('and each card carries HIS line, keyed on the portrait behind it', async () => {
    // The rendered set per tier is exactly the engine's set for that tier's ids – so the screen is
    // not merely printing sixteen different strings, it is printing the right one on each face.
    const snapshot = snapshotAt(0.6)
    const wrapper = await mountCoaches(snapshot)
    for (const tier of TIERS) {
      const rendered = wrapper.find(`#coach-tier-${tier}`).findAll('.cm-blurb').map((b) => b.text())
      const expected = snapshot.coachMarket.filter((r) => r.tier === tier).map((r) => coachBlurb(r.id))
      expect(new Set(rendered)).toEqual(new Set(expected))
    }
    wrapper.unmount()
  })
})
