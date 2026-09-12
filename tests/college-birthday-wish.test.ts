// =================================================================================================
// ⭐⭐⭐⭐ ROUND 26 #4, SECOND PASS – THE WISH BESIDE THE BICYCLE IS ABOUT THE BICYCLE.
//
// ⚠ THE OTHER HALF OF ONE DESCRIBE, NOT A SECOND SUITE. tests/college-birthday.test.ts holds the
// four walked describes and ROUND 26 #4's FIRST pass – the means arms, the gift band and his own
// save walked to the real fork; this file holds the four cases of the SECOND pass, under the SAME
// describe name and off the same `collegeBirthdays`. Both read that walk out of
// tests/collegeBirthdayFixtures.ts, where the fixture, the presses and the four wordings live, and
// that module's header carries the measurement that forced the cut (12.09, wave 3, PR #135 – the
// fifth red `unit-heavy`: 26.05 s solo, 58.4 s at the house 2.24x, against a 60 s window).
//
// Nothing was trimmed on the way across: same seeds, same sixty lived weeks, same fork, same four
// college years, same wallets to the cent, same test names.
// =================================================================================================

import { describe, expect, it, vi } from 'vitest'
// ⭐ ROUND 26 #4 – the college band, read by the predicate case at the foot of this file.
import { BIRTHDAY_COLLEGE_BAND } from '../src/engine/world'
import { BIKE_ASK, OLD_BIKE_ASK, collegeBirthdays } from './collegeBirthdayFixtures'

// ⚠⚠ THE UNIT PROJECT'S CEILING IS 20s AND THIS FILE WALKS CAREERS, WHICH IS THE ARITHMETIC ROUND 26
// #16 IS ABOUT – the note is `tests/college-birthday.test.ts`'s and it travels with the cases it was
// written for. Every case below renders two or three whole college careers, and `vi.setConfig` is
// per FILE, so this line is a copy rather than an import on purpose: set in the fixtures module it
// would have covered neither file.
vi.setConfig({ testTimeout: 120_000 })

describe('ROUND 26 #4 – a college wish may not assume a wallet she has not got', () => {
  // The owner, correcting the first pass:
  //
  //   «надо переписать значит саму фразу для велосипеда для соответствия ее пожеланиям и достаток
  //    здесь вообще не при чем. У меня нет проблем с велосипедом, может быть это должна быть как раз
  //    просьба на первый ДР во время учебы вообще.»
  //
  // ⚠⚠ WHAT THE FIRST PASS GOT WRONG, AND IT WAS NOT THE MEANS LICENCE. He read a dialog whose ask
  // was `flighthome`'s fares line with the bicycle sitting in the options, and read the two as a
  // PAIR – a girl who cannot afford a train ticket, offered a bike. The licence fixed the half that
  // was visible (a hardship sentence printed over a $584,375 wallet, which the FIRST pass's cases in
  // tests/college-birthday.test.ts still hold) and left the half he was pointing at: **the bicycle
  // had no wish of its own.** Its ask
  // hooked on "minutes" and never said the word.
  //
  // ⚠ SO THE FIX IS COPY AND PLACEMENT, AND THE MEANS PREDICATE IS NOT INVOLVED. «достаток здесь
  // вообще не при чем»: this row carries no `means` and must not grow one. The last case in this
  // block is that stated mechanically over the whole catalogue.
  it('⭐⭐⭐⭐ her FIRST college birthday asks for the bicycle, in the bicycle\'s own words', () => {
    for (const seed of ['means-college-a', 'means-college-b', 'means-college-c']) {
      const prompts = collegeBirthdays(seed, 584_375_00, 59_220_00)
      expect(prompts.length, `${seed}: four college birthdays`).toBe(4)
      const first = prompts[0]
      expect(first.ids, `${seed}: and the bicycle is one of the four she can be given`).toContain('campusbike')
      expect(first.ask, `${seed}: the wish is the bicycle's`).toBe(BIKE_ASK)
      // ⚠ AND IT IS ABOUT THE BICYCLE, WHICH IS THE WHOLE INSTRUCTION. The old line never said the
      // word; a rewrite that stayed about walking would pass an equality check on a new literal and
      // still be the sentence he objected to.
      expect(first.ask.toLowerCase(), `${seed}: it names the thing`).toContain('bicycle')
      expect(first.ask, `${seed}: and it is not the line it replaces`).not.toBe(OLD_BIKE_ASK)
    }
  })

  it('⭐⭐⭐ the wallet does not touch it – the same first wish at $1,200 and at $643,595', () => {
    // ⚠⚠ «достаток здесь вообще не при чем», as a measurement. The two arms differ by a factor of
    // five hundred and the sentence is identical, which is what "this row makes no money claim"
    // means when a means licence exists one row along and really does move `flighthome`'s words.
    for (const seed of ['means-college-a', 'means-college-b']) {
      const rich = collegeBirthdays(seed, 584_375_00, 59_220_00)[0]
      const poor = collegeBirthdays(seed, 1_200_00, 0)[0]
      expect(poor.ask, `${seed}: the bicycle wish is means-blind`).toBe(rich.ask)
      expect(poor.ask).toBe(BIKE_ASK)
    }
  })

  it('⚠ and the four college birthdays are still four DIFFERENT dialogs', () => {
    // ⚠ ROUND 26 #9b's CLAIM, RE-MEASURED AFTER THE WALK WAS RE-INDEXED. Pinning the bicycle to the
    // first birthday meant rotating the college cycle so entry 0 carries it and walking by COLLEGE
    // BIRTHDAY instead of by her age – a rotation of a four-cycle is still a four-cycle, and this is
    // that argument checked rather than asserted.
    for (const seed of ['means-college-a', 'means-college-b', 'means-college-c']) {
      const prompts = collegeBirthdays(seed, 584_375_00, 59_220_00)
      const dialogs = prompts.map((p) => [...p.ids].sort().join('|'))
      expect(new Set(dialogs).size, `${seed}: ${dialogs.join('  ·  ')}`).toBe(4)
      // ...and no two CONSECUTIVE ones are the same, which is the figure the round reports as 0%.
      for (let i = 1; i < dialogs.length; i++) {
        expect(dialogs[i], `${seed}: birthday ${i + 1} repeats birthday ${i}`).not.toBe(dialogs[i - 1])
      }
    }
  })

  it('⚠⚠ the means predicate still carries the rows that DO claim hardship, and not this one', () => {
    // ⚠ «достаток здесь вообще не при чем» is about ONE row. The licence stays where it was earned:
    // `flighthome` and `books` really do make a money claim in their default words and really do
    // carry an alternative for a family the claim is false of. A pass that deleted the machinery
    // would have thrown that away with it.
    const byId = new Map(BIRTHDAY_COLLEGE_BAND.gifts.map((g) => [g.id, g]))
    expect(byId.get('flighthome')?.means, 'the fares line is still licensed').toBe('hardship')
    expect(byId.get('books')?.means, 'and so is the reading list').toBe('hardship')
    expect(byId.get('flighthome')?.unlicensed?.ask, 'with the sentence for when it does not hold').toBeTruthy()
    expect(byId.get('books')?.unlicensed?.ask).toBeTruthy()
    // ...and the bicycle makes no claim about money at all, in any of its four strings.
    const bike = byId.get('campusbike')!
    expect(bike.means, 'the bicycle asks nothing about the wallet').toBeUndefined()
    expect(bike.unlicensed, 'so it needs no second wording').toBeUndefined()
  })
})
