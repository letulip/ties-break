// ROUND 23, THE TWO COACH-CARD COPY ITEMS – #1 (say her level in plain words) and #5 (a description
// per coach, distinct inside its tier).
//
// Both are the owner's, 19.08. His words are quoted verbatim in the ENGINE, beside the code they
// describe (no Cyrillic reaches a template – tests/round13-nav.test.ts); this file is the mechanical
// half, and the RENDERED half is tests/component/round23-coach-card.test.ts.
//
//   #1  «...что-то вроде "она близка к своему потолку" или "ещё есть куда расти" или "у неё большой
//       потенциал"...» – a BAND said in plain words. ⚠ NOT the figure: `KidScreen` keeps her ceiling
//       behind a fog of war and `coachRoomNote`'s own header has held that line since 08.08. So the
//       claims here are (a) the band is monotone in headroom, (b) it cannot flicker week to week on a
//       career that is merely progressing, and (c) no digit ever reaches the sentence.
//   #5  «Разный текст для каждой из карточек тренеров с микро описанием каждого из них в своём тире»
//       – so the claim is DISTINCTNESS WITHIN A TIER, checked against the real roster rather than
//       admired by eye, plus the properties that keep it from rotting: one line per roster slot,
//       keyed on identity and not on a draw, no pronoun, no digit, inside the column's width.
//
// ⚠ MUTATION-VERIFIED – ten mutations, each applied ALONE against the restored tree and both files
// re-run. `|u|` is this file, `|c|` tests/component/round23-coach-card.test.ts, `|t|` the four-band
// pin in coachTiers.test.ts. Nothing below passed against a broken build, and #1 and #5 never redden
// together, which is what says they are two items:
//
//   * `coachRoomBandIndex` collapsed to `return 0` – one band for every career -> |u| the label test,
//     the ladder test and the career walk, |t|, |c| both band tests. It leaves BOTH no-figure tests
//     green, which is the separation that keeps "the band moves" and "the band is not a number"
//     apart as claims.
//   * `coachRoomBandIndex` restored to the SHIPPED 0.6 / 0.8 / 0.92 – i.e. the dead first band, the
//     defect the measurement found -> |u| the label test and the career WALK, |t|, |c| the ladder
//     walk. ⚠ It leaves `is a LADDER` and `two headrooms render two DIFFERENT bands` GREEN – a dead
//     band is still monotone and still differs from the top one, which is exactly why the walk over
//     a real career had to assert `[0, 1, 2, 3]` rather than "it moved".
//   * `coachRoomBandIndex` with its 0.88 and 0.92 arms SWAPPED (non-monotone in headroom) -> |u| the
//     label test, the ladder test and the career walk, |t|, |c| the ladder walk.
//   * a digit put into one band label -> |u| the no-figure test and |t|, |c| the no-figure test, and
//     NOTHING else in either file.
//   * the template's `<strong class="cm-room-band">` deleted, i.e. the shipped sentence with no band
//     in front of it -> |c| three of the four #1 tests, |u| and |t| nothing. That asymmetry is the
//     point of having both files: this one cannot see the screen.
//   * `roomTail` sliced with a hand-counted `+ 3` instead of the engine's own `ROOM_NOTE_SEP` ->
//     |c| "prints exactly what the engine wrote" ALONE.
//   * `COACH_BLURB['high-2']` set to `high-1`'s string – two coaches of one rung reading as one man,
//     which IS the shipped defect -> |u| the within-tier test and the whole-market test, |c| the
//     rendered within-tier test, and nothing in #1 anywhere.
//   * one roster slot's entry deleted -> |u| the within-tier test and the completeness test, |c| the
//     "every card carries one" and "carries HIS line" tests.
//   * `coachBlurb` returning a line picked by TIER instead of by id -> |u| the within-tier test, the
//     whole-market test and the completeness test, |c| the rendered within-tier test. ⚠ It leaves
//     the two-seeds identity test green, correctly: a tier lookup is still stable across seeds, so
//     "not a draw" and "not the rung" are two different claims and two different tests.
//   * the `<span class="cm-blurb">` deleted from the row -> |c| all three of #5, |u| nothing.
import { describe, it, expect } from 'vitest'
import {
  coachBlurb,
  coachRoomBandIndex,
  coachRoomBandLabel,
  coachRoomBandOf,
  coachRoomNote,
  ROOM_NOTE_SEP,
} from '../src/engine/world/coachMarket'
import { buildCoachRoster } from '../src/engine/coach'
import { ECONOMY } from '../src/engine/economy'
import { SKILL_KEYS } from '../src/engine/development'
import { createWorld, tickWeek } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, type CoachTier } from '../src/shared/protocol'

// =================================================================================================
// #1 – THE BAND IS NAMED, IT IS A LADDER, AND IT NEVER QUOTES THE CEILING
// =================================================================================================

/** A world pinned to one realisation share, the same construction the room-note pin in
 *  coachTiers.test.ts uses: a flat ceiling and a flat level, so `realised` is exactly what is asked
 *  for and nothing else in the engine has to be persuaded of it. */
function worldAt(realised: number) {
  const world = createWorld('r23-room', DEFAULT_PROFILE)
  for (const k of SKILL_KEYS) {
    world.potential[k] = 60
    world.skills[k] = 60 * realised
  }
  return world
}

describe('#1 the room note leads with a named band', () => {
  it('opens with a label and separates it from the argument the way the screen expects', () => {
    // The label is the FIRST clause and `ROOM_NOTE_SEP` is what ends it. Screen T splits on that
    // separator to bold the label, so this is the contract between the two files and not decoration.
    for (let band = 0; band < 4; band++) {
      const note = coachRoomNote(worldAt([0.7, 0.85, 0.9, 0.97][band]))
      const at = note.indexOf(ROOM_NOTE_SEP)
      expect(at, `band ${band} carries a separator`).toBeGreaterThan(0)
      expect(note.slice(0, at)).toBe(coachRoomBandLabel(band))
      expect(note.slice(at + ROOM_NOTE_SEP.length).length, 'and an argument after it').toBeGreaterThan(20)
    }
  })

  it('is a LADDER: four labels, monotone in headroom, and no two alike', () => {
    // ⚠ THE ORDER IS THE CLAIM. Reading right to left the room she has left only ever grows, so a
    // player comparing two careers can compare two labels. Sampled densely rather than at four
    // hand-picked points, because a swapped arm inside a band is exactly what four points miss.
    const labels: string[] = []
    let last = -1
    for (let r = 0; r <= 1.0001; r += 0.005) {
      const band = coachRoomBandIndex(Math.min(r, 1))
      expect(band, `realised ${r.toFixed(3)} went backwards`).toBeGreaterThanOrEqual(last)
      last = band
      const label = coachRoomBandLabel(band)
      if (labels[labels.length - 1] !== label) labels.push(label)
    }
    expect(labels.length, 'four bands, each entered once').toBe(4)
    expect(new Set(labels).size).toBe(4)
    // ...and they are the vocabulary he asked for, in his own order: potential first, ceiling last.
    expect(labels[0]).toMatch(/potential/i)
    expect(labels[1]).toMatch(/grow/i)
    expect(labels[2]).toMatch(/ceiling/i)
    expect(labels[3]).toMatch(/ceiling/i)
    expect(labels[2]).not.toBe(labels[3])
  })

  it('never prints a figure, in the label or in the sentence', () => {
    // The fog-of-war rule, restated as a property. A percentage here would be the back door through
    // the whole radar design – see `coachRoomNote`'s header and KidScreen's.
    for (let r = 0; r <= 1.0001; r += 0.01) {
      const note = coachRoomNote(worldAt(Math.min(r, 1)))
      expect(note, `realised ${r.toFixed(2)}`).not.toMatch(/\d/)
      expect(note).not.toMatch(/%/)
    }
  })

  it('says nothing at all when there is no ceiling to be near', () => {
    const world = createWorld('r23-empty', DEFAULT_PROFILE)
    for (const k of SKILL_KEYS) {
      world.potential[k] = 0
      world.skills[k] = 0
    }
    expect(coachRoomNote(world)).toBe('')
    expect(coachRoomBandOf(world)).toBeNull()
  })

  it('does not flicker between adjacent weeks on a career that is merely progressing', () => {
    // ⚠ THE ONE CLAIM A SAMPLED FUNCTION CANNOT MAKE FOR ITSELF. A band that steps back and forth
    // across a threshold would put "Still room to grow" and "Close to her ceiling" on alternate
    // Tuesdays with nothing having happened, which is worse copy than the buried sentence it
    // replaces. Walked on a REAL career through the real engine – no hand-set skills anywhere.
    const world = createWorld('r23-walk', { ...DEFAULT_PROFILE, coachTier: 'middle' })
    const rng = rngFromSeed(world.seed)
    const seen: number[] = []
    let last = coachRoomBandOf(world)!
    let steps = 0
    for (let w = 0; w < 468; w++) {
      // 9 seasons: 14 -> 23, the whole growth arc and none of the 29+ decline
      tickWeek(world, rng)
      const band = coachRoomBandOf(world)!
      expect(band, `week ${world.week} went backwards, ${last} -> ${band}`).toBeGreaterThanOrEqual(last)
      if (band !== last) steps++
      last = band
      if (seen[seen.length - 1] !== band) seen.push(band)
    }
    // ⚠⚠ AND ALL FOUR ARE REACHED, WHICH IS THE HALF THAT WOULD HAVE CAUGHT THE SHIPPED DEFECT. The
    // 08.08 thresholds (0.6 / 0.8 / 0.92) were written before anybody measured `realised`, and she is
    // never below 68% at any age in any career - so the first band was a string no player could be
    // shown and the second expired inside the first season. Monotonicity alone passes happily on dead
    // copy; "every band is entered, in order, exactly once" does not. The measurement that re-cut
    // them is written out over `coachRoomBandIndex`.
    expect(seen, 'every band is reachable on a real career, in order').toEqual([0, 1, 2, 3])
    expect(steps, 'every change is a step it never takes back').toBe(seen.length - 1)
  })
})

// =================================================================================================
// #5 – A DESCRIPTION PER COACH, DISTINCT INSIDE ITS TIER
// =================================================================================================

/** The real roster, at an age in the middle of a career. Ids are portrait stems and age-independent,
 *  so any age gives the same sixteen people; the age only moves their prices. */
const ROSTER = buildCoachRoster('r23-roster', 16)
const TIERS: CoachTier[] = ['budget', 'middle', 'high', 'elite']

describe('#5 every coach says who he is, and no two on a rung say the same thing', () => {
  it('THE ASK: within every tier, one description each and not one repeat', () => {
    // This is the whole item, mechanically. Grouped off the real roster rather than off the blurb
    // table, so a coach with no entry fails here rather than being quietly skipped.
    for (const tier of TIERS) {
      const rung = ROSTER.filter((c) => c.tier === tier)
      expect(rung.length, `${tier} has coaches`).toBeGreaterThan(1)
      const lines = rung.map((c) => coachBlurb(c.id))
      for (const [i, line] of lines.entries()) {
        expect(line, `${rung[i].id} has a description`).not.toBe('')
      }
      expect(new Set(lines).size, `${tier}: ${lines.join(' | ')}`).toBe(lines.length)
    }
  })

  it('...and in fact no two in the whole market, which is the stronger property and free', () => {
    const all = ROSTER.map((c) => coachBlurb(c.id))
    expect(new Set(all).size).toBe(all.length)
  })

  it('one line per roster slot – a portrait added without one is a coach who says nothing', () => {
    for (const slot of ECONOMY.coach.roster) {
      expect(coachBlurb(slot.portrait), `${slot.portrait} (${slot.tier})`).not.toBe('')
    }
    // The gate the other way: an id no roster knows degrades to nothing rather than to `undefined`
    // printed on a card. A save holding a retired portrait is the case.
    expect(coachBlurb('no-such-coach')).toBe('')
  })

  it('is a fact about the PERSON, not a draw – two seeds, two names, one description', () => {
    // ⚠ «never rolled at render time». `buildCoachRoster` draws a coach's name and rate off
    // `seed:coaches` and takes his identity from ECONOMY.coach.roster, so the description has to
    // follow the identity or the same face says different things in two careers.
    const other = buildCoachRoster('r23-other-seed', 22)
    const names = new Set(other.map((c) => c.name))
    expect(names.size, 'the two rosters really are differently named').toBeGreaterThan(1)
    let differentName = 0
    for (const coach of other) {
      const same = ROSTER.find((c) => c.id === coach.id)!
      expect(coachBlurb(coach.id)).toBe(coachBlurb(same.id))
      if (coach.name !== same.name) differentName++
    }
    expect(differentName, 'and the names moved between the seeds').toBeGreaterThan(0)
  })

  it('no pronoun names the coach on any of them (R15-7, owner 09.08)', () => {
    // `ECONOMY.coach.roster` fixes a gender per slot, so "he" would be correct today and silently
    // wrong the day a portrait's gender is swapped – the drift R15-7 already paid for once. The
    // cheapest guarantee is to carry no personal pronoun at all, and this is what pins it.
    for (const slot of ECONOMY.coach.roster) {
      const line = coachBlurb(slot.portrait)
      expect(line, `${slot.portrait}`).not.toMatch(/\b(he|him|his|she|her|hers)\b/i)
    }
  })

  it('quotes no number, and fits the column – spec §4 and §4a', () => {
    // §4: a coach's own VALUE may never appear on an unhired card, so a CV line with arithmetic in
    // it would be that number wearing a story. §4a: 60 characters is the two-line ceiling a real
    // browser measured for this column at 320px, so no row grows a third line.
    for (const slot of ECONOMY.coach.roster) {
      const line = coachBlurb(slot.portrait)
      expect(line, `${slot.portrait} quotes a figure`).not.toMatch(/\d/)
      expect(line.length, `${slot.portrait} is ${line.length} chars: ${line}`).toBeLessThanOrEqual(60)
      // Player copy: short dash only, never the long one (CLAUDE.md style).
      expect(line, `${slot.portrait} uses an em-dash`).not.toContain('—')
      // ...and no Cyrillic reaches a string a player reads.
      expect(line, `${slot.portrait} carries Cyrillic`).not.toMatch(/[Ѐ-ӿ]/)
    }
  })
})
