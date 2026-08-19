// =================================================================================================
// THE BIRTHDAY AND THE GIFT – docs/specs/birthday-and-gifts.md §4, THE SHIP RULE, asserted
// =================================================================================================
//
// The spec authored its own ship rule BEFORE anything was built. This file is that rule, one block
// per numbered clause, plus the two structural properties the owner's rulings turn on:
//
//   1. no skill, no condition, no mood moves            §4.1
//   2. RNG – a purpose-scoped sub-stream, never MAIN,   §4.2 / CLAUDE.md invariant 2
//      and never re-rollable by reloading
//   3. ⭐ THE LEDGER DOES NOT MOVE                       §4.3 – «про цену момент, давай не будем это
//      the same seed through EVERY option ends the             учитывать в нашем кошельке вообще»
//      season on identical fundsCents
//   4. the catalogue is background-blind                §4.4
//   5. the record survives a round-trip, and an old     §4.5 – absent is not "gave nothing"
//      career reads as ABSENT rather than as zero
//   +  the popup ALWAYS fires and closes no other way   §2a
//   +  she asks, exactly one option answers it,         §2ab / §5.4 – «не помечай, пусть игрок читает»
//      and NOTHING marks which
//   +  the gift never resets kit wear                   §2c – «я бы сказал нет»
import { describe, expect, it } from 'vitest'
import {
  BIRTHDAY_BANDS,
  BIRTHDAY_DAY_TOGETHER,
  SAVE_SCHEMA_VERSION,
  advanceWeeks,
  birthdayHeading,
  birthdayOffer,
  birthdayTurning,
  chooseGift,
  createWorld,
  decideKnock,
  giftNoun,
  pendingBirthday,
  pendingKnock,
  tickWeek,
  toSnapshot,
} from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { FamilyBackground, WeekPlan } from '../src/shared/protocol'

/** A career born 15 June, so her birthday lands mid-season and mid-month every year. */
function career(seed: string, over: Partial<typeof DEFAULT_PROFILE> = {}) {
  return createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 6, birthDay: 15, coachTier: 'self', ...over })
}

/** Tick until her birthday is on the table. Returns the week it stopped on.
 *
 *  ⚠ ANSWERS ANY KNOCK ON THE WAY, because a knock blocks too and a test about the birthday's block
 *  must not accidentally be measuring the knock's. Answering costs the birthday nothing – `rest` is a
 *  training decision and touches no field this file reads. */
function runToBirthday(world: ReturnType<typeof career>, rng: () => number, cap = 60): number {
  for (let i = 0; i < cap; i++) {
    if (pendingKnock(world)) decideKnock(world, 'rest')
    if (pendingBirthday(world) !== null) return world.week
    tickWeek(world, rng)
  }
  return -1
}

describe('the birthday popup', () => {
  // ===============================================================================================
  // §2a – IT ALWAYS FIRES, AND IT CLOSES NO OTHER WAY
  // ===============================================================================================
  it('⚠ fires on the birthday week and BLOCKS the advance until it is answered', () => {
    const world = career('bday-blocks')
    const rng = rngFromSeed(world.seed)
    const week = runToBirthday(world, rng)
    expect(week, 'the fixture has to reach a birthday').toBeGreaterThan(0)
    expect(birthdayTurning(week, 6, 15), 'and it really is her birthday week').not.toBeNull()

    // THE BLOCK. Not a halt the player can tap past: `advanceWeeks` refuses to tick AT ALL, which is
    // what makes «я бы оставил попап на ДР всегда» true rather than aspirational.
    const before = world.week
    expect(advanceWeeks(world, rng, 4)).toEqual(['birthday'])
    expect(world.week, 'not one week moved').toBe(before)

    // ...and answering is the only thing that unblocks it.
    const { options } = birthdayOffer(world.seed, pendingBirthday(world)!)
    chooseGift(world, options[0].id)
    expect(pendingBirthday(world)).toBeNull()
    expect(advanceWeeks(world, rng, 1).includes('birthday')).toBe(false)
    expect(world.week, 'time moves again').toBeGreaterThan(before)
  })

  it('⚠ FOUR options, in a column, and one of them is always the day together', () => {
    for (const age of [14, 15, 16, 17, 18, 19, 20, 21, 22, 25, 28, 29, 34]) {
      const { options } = birthdayOffer('four-options', age)
      expect(options.length, `age ${age}`).toBe(4)
      expect(new Set(options.map((o) => o.id)).size, `age ${age}: four DIFFERENT options`).toBe(4)
      expect(
        options.some((o) => o.id === BIRTHDAY_DAY_TOGETHER.id),
        `age ${age}: "just the day together" is always offered – it has to read as one of the good choices`,
      ).toBe(true)
    }
  })

  it('every band can actually fill four rows, so no age can ship a short dialog', () => {
    for (const band of BIRTHDAY_BANDS) {
      expect(band.gifts.length, `band ${band.from}-${band.to}`).toBeGreaterThanOrEqual(3)
      expect(band.gifts.some((g) => g.id === BIRTHDAY_DAY_TOGETHER.id), 'the day is not a catalogue entry').toBe(false)
      // Every gift is fully written – a blank note or ask would ship an empty row.
      for (const g of band.gifts) {
        expect(g.label.length, `${g.id}.label`).toBeGreaterThan(3)
        expect(g.note.length, `${g.id}.note`).toBeGreaterThan(10)
        expect(g.ask.length, `${g.id}.ask`).toBeGreaterThan(10)
        expect(giftNoun(g.id), `${g.id} has a noun the diary can print`).not.toBeNull()
      }
    }
  })

  // ===============================================================================================
  // §2ab / §5.4 – SHE ASKS, EXACTLY ONE ANSWERS IT, AND NOTHING MARKS WHICH
  // ===============================================================================================
  it('⭐ exactly one of the four answers the ask, and the day together is reachable as the ask', () => {
    const reachedDay: number[] = []
    for (const age of [14, 15, 16, 17, 18, 19, 22, 29]) {
      for (let s = 0; s < 60; s++) {
        const { options, askedId } = birthdayOffer(`ask-seed-${s}`, age)
        const answering = options.filter((o) => o.id === askedId)
        expect(answering.length, `seed ${s} age ${age}: exactly one option answers`).toBe(1)
        if (askedId === BIRTHDAY_DAY_TOGETHER.id) reachedDay.push(age)
      }
    }
    // «she does not want a thing, she wants you, and that is the best case the scene has»
    expect(reachedDay.length, 'the day together must be reachable as the ask').toBeGreaterThan(0)
  })

  it('⚠ NOTHING MARKS THE ANSWER – the ask is not on the wire and its position carries no signal', () => {
    // «не помечай, пусть игрок читает». Two independent claims, and the first is structural.
    const world = career('nothing-marked')
    const rng = rngFromSeed(world.seed)
    runToBirthday(world, rng)
    const prompt = toSnapshot(world).birthdayPrompt!
    expect(prompt).not.toBeNull()

    // 1. THE CLIENT IS NOT TOLD THE ANSWER. Not "the UI chooses not to show it" – it is not there.
    const wire = JSON.parse(JSON.stringify(prompt)) as Record<string, unknown>
    expect(Object.keys(wire).sort()).toEqual(['age', 'ask', 'heading', 'options', 'week'])
    for (const option of prompt.options) {
      expect(Object.keys(option).sort(), 'a row carries an id, a label and a note – nothing else').toEqual([
        'id',
        'label',
        'note',
      ])
    }

    // 2. AND THE POSITION IS UNIFORM, so "it is always the first one" can never be learned. 400
    //    draws over four slots: a fixed position would put 400 in one bucket and 0 in the others.
    const at = [0, 0, 0, 0]
    for (let s = 0; s < 400; s++) {
      const { options, askedId } = birthdayOffer(`pos-${s}`, 16)
      at[options.findIndex((o) => o.id === askedId)]++
    }
    for (let i = 0; i < 4; i++) expect(at[i], `slot ${i} of ${at.join('/')}`).toBeGreaterThan(400 / 4 / 3)
  })

  it('the heading is stable, varied, and grows out of the school-age voice', () => {
    expect(birthdayHeading('same', 24)).toBe(birthdayHeading('same', 24))
    expect(new Set(Array.from({ length: 40 }, (_, i) => birthdayHeading(`voice-${i}`, 24))).size)
      .toBeGreaterThan(1)
    expect(birthdayHeading('age-band', 14)).not.toBe(birthdayHeading('age-band', 24))
  })

  // ===============================================================================================
  // §4.2 – RNG: A SUB-STREAM, NEVER MAIN, AND NOT RE-ROLLABLE BY RELOADING
  // ===============================================================================================
  // ⚠ RE-AIMED, round-17 #18, AND THE MEASUREMENT IS WHY. This block used to assert that the ask
  // "does not depend on what he chose last year" in the widest possible sense – that a birthday
  // answered could not move ANY later ask. On the owner's own save that produced
  // `age 19: asked day, given car` followed by `age 20: asked car`: he had bought her a car twelve
  // months before and she asked him for a car, which is the one thing a parent would notice.
  //
  // WHAT THE OLD ASSERTION WAS PROTECTING is in §4.2's own wording – "must not depend on what the
  // player picked LAST year, OR THE CHOICE RE-ROLLS THE WORLD". The hazard is CLAUDE.md invariant 2,
  // input-independence, and it is untouched: same key, same sub-stream, same number of draws, same
  // four options, MAIN never reached. So the clause is re-aimed onto the property it was defending
  // (the STREAM and the OPTIONS are independent of last year) and off the one that was a bug (which
  // of the four she names). The narrowed half is now pinned positively in the block below.
  it('⚠ the ask cannot be re-rolled by reloading, and last year cannot move the stream or the options', () => {
    // Keyed on (seed, age) and nothing else: immutable state, so the same career asks for the same
    // thing however many times it is loaded.
    const a = birthdayOffer('stable', 16)
    const b = birthdayOffer('stable', 16)
    expect(b.askedId).toBe(a.askedId)
    expect(b.options.map((o) => o.id)).toEqual(a.options.map((o) => o.id))

    // ...and a career that has been given things is offered the IDENTICAL four in the identical
    // order. §5.2's licensed repeat is intact – the catalogue may still offer what she already has.
    const given = birthdayOffer('stable', 16, ['bike', 'phone', 'camera', 'laptop', 'car'])
    expect(given.options.map((o) => o.id), 'the offer is untouched by the record').toEqual(
      a.options.map((o) => o.id),
    )

    // ...and answering one birthday does not change the NEXT one's stream. Two worlds on one seed,
    // one of which was given a present at 14: the sub-stream is re-derived, not advanced.
    const untouched = birthdayOffer('stable', 17)
    const world = career('stable')
    const rng = rngFromSeed(world.seed)
    runToBirthday(world, rng)
    const first = birthdayOffer(world.seed, pendingBirthday(world)!)
    chooseGift(world, first.options[0].id)
    expect(birthdayOffer('stable', 17).askedId).toBe(untouched.askedId)
  })

  // ===============================================================================================
  // ⭐ ROUND-17 #18 – THE GIFT MEMORY HOLDS: she does not ask for something already in the house
  // ===============================================================================================
  it('⭐ never asks for a present she has already been given', () => {
    // REPRODUCED ON THE OWNER'S SAVE before it was written: `age 19: asked day, given car` then
    // `age 20: asked car`. The 19-21 band is exactly three material gifts (deposit / car / home) plus
    // the day, so all four are offered every year of that band and a repeat ask was a 1-in-4 every
    // birthday. Mutation-verified by dropping the `spent` filter in `birthdayOffer`: the sweep below
    // finds repeats again and this fails.
    for (const band of BIRTHDAY_BANDS) {
      // The first band opens at 0 so `bandFor` is total below the start age; the age a career can
      // actually reach in it is 14.
      const age = Math.max(band.from, 14)
      for (const gift of band.gifts) {
        for (let s = 0; s < 40; s++) {
          const { askedId } = birthdayOffer(`memory-${s}`, age, [gift.id])
          expect(askedId, `age ${age} still asked for ${gift.id} after it was given`).not.toBe(gift.id)
        }
      }
    }
  })

  it('⭐ ...and the day together is never spent – she may want one every year of her life', () => {
    // The exclusion is about POSSESSIONS. A day with her parents is not one, and excluding it would
    // make §2ab's best case unreachable for any career that ever chose it.
    let reachedDay = 0
    for (let s = 0; s < 200; s++) {
      const { askedId } = birthdayOffer(`day-again-${s}`, 20, [BIRTHDAY_DAY_TOGETHER.id, 'car', 'deposit', 'home'])
      if (askedId === BIRTHDAY_DAY_TOGETHER.id) reachedDay++
    }
    // Every material gift of the 19-21 band is spent here, so the day is the ONLY unspent option and
    // the pool is a single row: it must be the ask every time.
    expect(reachedDay, 'the day is still askable after it has been given').toBe(200)
  })

  it('⚠ a band with every gift spent still prints a scene rather than crashing', () => {
    // Total-function insurance for the fallback. `canAsk` cannot actually empty (the day is never
    // spent), but the branch exists so that a future catalogue change cannot turn an unanswerable
    // birthday into an exception on a dialog the player cannot dismiss.
    const all = [BIRTHDAY_DAY_TOGETHER.id, ...BIRTHDAY_BANDS.flatMap((b) => b.gifts.map((g) => g.id))]
    for (const band of BIRTHDAY_BANDS) {
      const { options, askedId } = birthdayOffer('all-spent', band.from, all)
      expect(options).toHaveLength(4)
      expect(options.map((o) => o.id), 'the ask is still one of the four').toContain(askedId)
    }
  })

  it('⚠ the record read is the one WITHOUT this birthday, so the prompt and the record agree', () => {
    // `chooseGift` re-derives `askedId` to write it down, and it must derive the same ask the dialog
    // printed. That holds only because the row for THIS birthday is pushed after the derivation.
    // Mutation-verified by moving `world.birthdays.push` above the `birthdayOffer` call: the recorded
    // `asked` diverges from the prompt's and this fails.
    const world = career('record-agrees')
    const rng = rngFromSeed(world.seed)
    for (let year = 0; year < 3; year++) {
      const week = runToBirthday(world, rng)
      expect(week, 'the fixture has to keep reaching birthdays').toBeGreaterThan(0)
      const prompt = toSnapshot(world).birthdayPrompt!
      const asked = prompt.options.find((o) => o.note !== undefined && prompt.ask.length > 0)
      expect(asked, 'the prompt is real').toBeDefined()
      const age = pendingBirthday(world)!
      chooseGift(world, prompt.options[0].id)
      const row = world.birthdays[world.birthdays.length - 1]
      expect(row.age).toBe(age)
      // The recorded ask is one of the four that were on screen, every year.
      expect(prompt.options.map((o) => o.id)).toContain(row.asked)
      tickWeek(world, rng)
    }
    // ...and across those three years she was never asked for something already given.
    const givenSoFar: string[] = []
    for (const r of world.birthdays) {
      expect(givenSoFar, `asked for ${r.asked} at ${r.age} after it was given`).not.toContain(r.asked)
      if (r.given !== null) givenSoFar.push(r.given)
    }
  })

  it('⚠ NO NEW MAIN DRAW – a birthday week costs the world exactly what it always cost', () => {
    // Input-independence is permanent law: a career that answers birthdays and one that does not
    // (a girl whose birthday has not come round yet) must tap identical MAIN sequences.
    const answered = career('main-a')
    const rngA = rngFromSeed(answered.seed)
    for (let i = 0; i < 40; i++) {
      if (pendingBirthday(answered) !== null) {
        const { options } = birthdayOffer(answered.seed, pendingBirthday(answered)!)
        chooseGift(answered, options[2].id)
      }
      tickWeek(answered, rngA)
    }
    const quiet = career('main-a', { birthMonth: 12, birthDay: 28 })
    const rngB = rngFromSeed(quiet.seed)
    for (let i = 0; i < 40; i++) tickWeek(quiet, rngB)
    expect(answered.rngMain.n, 'a present is not a dice roll').toBe(quiet.rngMain.n)
  })

  // ===============================================================================================
  // ⭐ §4.3 – THE LEDGER DOES NOT MOVE. The assertion that keeps §0's ruling true after somebody
  // later "just adds a small cost for realism".
  // ===============================================================================================
  it('⭐ THE SAME SEED THROUGH EVERY OPTION ENDS ON IDENTICAL fundsCents', () => {
    const runs = new Map<string, { funds: number; earned: number; spent: number; moneyLines: number }>()
    // Every option this birthday offers, plus a control that answers with the day together.
    const probe = career('ledger')
    const probeRng = rngFromSeed(probe.seed)
    runToBirthday(probe, probeRng)
    const ids = birthdayOffer(probe.seed, pendingBirthday(probe)!).options.map((o) => o.id)
    expect(ids.length).toBe(4)

    for (const id of ids) {
      const world = career('ledger')
      const rng = rngFromSeed(world.seed)
      runToBirthday(world, rng)
      chooseGift(world, id)
      // ...and then finish the season, so a cost that arrived LATER would show up too.
      for (let i = 0; i < 30; i++) tickWeek(world, rng)
      runs.set(id, {
        funds: world.fundsCents,
        earned: world.careerTotals.earnedCents,
        spent: world.careerTotals.spentCents,
        // ⚠ AND NOT ONE LINE IN MONEY. `addEvent` accrues only when `amountCents` is present and
        // non-zero, so this counts what the Money breakdown would actually show.
        moneyLines: world.events.filter((e) => e.amountCents !== undefined && e.amountCents !== 0).length,
      })
    }
    const [first, ...rest] = [...runs.values()]
    for (const r of rest) expect(r).toEqual(first)
    // ...and no gift event carries an amount at all.
    const world = career('ledger-amount')
    const rng = rngFromSeed(world.seed)
    const week = runToBirthday(world, rng)
    chooseGift(world, birthdayOffer(world.seed, pendingBirthday(world)!).options[0].id)
    for (const e of world.events.filter((x) => x.week === week)) {
      if (/birthday/i.test(e.text)) expect(e.amountCents, e.text).toBeUndefined()
    }
  })

  it('⚠ NO PRICE IS SHOWN, and there is no price to show', () => {
    // A displayed price that is never taken would be a lie on the screen (§0). Asserted on the DATA
    // rather than on the source text, so it survives the file moving: no gift carries a numeric
    // field, and no word the player reads names an amount.
    const money = /[$€£]|\bcents?\b|\bdollars?\b|\bcosts? \d|\b\d[\d,.]*\s?(k|m)?\b/i
    for (const band of [...BIRTHDAY_BANDS, { from: 0, to: 0, gifts: [BIRTHDAY_DAY_TOGETHER] }]) {
      for (const g of band.gifts) {
        for (const [field, text] of Object.entries(g)) {
          expect(typeof text, `${g.id}.${field} is a string – a gift has no numbers on it`).toBe('string')
          expect(money.test(text as string), `${g.id}.${field}: "${text}"`).toBe(false)
        }
      }
    }
  })

  // ===============================================================================================
  // §4.1 / §2c – NO SKILL, NO CONDITION, NO KIT WEAR
  // ===============================================================================================
  it('⭐ no skill, no condition and NO KIT WEAR moves – the gift never returns to equipment', () => {
    const shape = (id: string | null) => {
      const world = career('no-effect')
      const rng = rngFromSeed(world.seed)
      runToBirthday(world, rng)
      if (id !== null) chooseGift(world, id)
      else {
        // The control has to get past the block somehow; record the row by hand so the ONLY
        // difference between the arms is which id was chosen rather than whether one was.
        const age = pendingBirthday(world)!
        world.birthdays.push({ week: world.week, age, asked: 'x', given: null })
      }
      for (let i = 0; i < 20; i++) tickWeek(world, rng)
      return {
        // HER SKILLS, all five, whatever the set grows to.
        skills: JSON.stringify(world.skills),
        condition: world.condition,
        // §2c, the owner on whether a frame resets kit wear: «я бы сказал нет». Her KIT AND ITS WEAR
        // are untouched by this whole feature.
        //
        // ⚠ IT IS `world.kit`, NOT `world.kitState`, AND THE DIFFERENCE MATTERED. The first draft of
        // this line read a field that does not exist: `JSON.stringify(undefined)` is `undefined` on
        // both sides of the comparison, so the assertion passed while asserting nothing at all.
        // `vue-tsc` caught it, not the green run – which is the whole reason the gate types tests too.
        kit: JSON.stringify(world.kit),
        results: world.results.length,
      }
    }
    const control = shape(null)
    const probe = career('no-effect')
    const probeRng = rngFromSeed(probe.seed)
    runToBirthday(probe, probeRng)
    for (const id of birthdayOffer(probe.seed, pendingBirthday(probe)!).options.map((o) => o.id)) {
      expect(shape(id), `option ${id}`).toEqual(control)
    }
  })

  // ===============================================================================================
  // §4.4 – THE CATALOGUE IS BACKGROUND-BLIND
  // ===============================================================================================
  it('⚠ the four options are the same for working, middle and wealthy', () => {
    // If a background ever changes what is offered, the wealth gate §0 removed has come back through
    // a different door. `birthdayOffer` takes a seed and an age – there is no background to pass.
    const seen = new Set<string>()
    for (const background of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
      const world = career('bg-blind', { background })
      const rng = rngFromSeed(world.seed)
      runToBirthday(world, rng)
      const prompt = toSnapshot(world).birthdayPrompt!
      seen.add(JSON.stringify({ ask: prompt.ask, options: prompt.options, age: prompt.age }))
    }
    expect(seen.size, 'one catalogue for every family').toBe(1)
  })

  // ===============================================================================================
  // §2b / §4.5 – WHAT IS RECORDED, AND WHAT ABSENT MEANS
  // ===============================================================================================
  it('⭐ one row per birthday: the week, the age, what she asked for, what was chosen', () => {
    const world = career('records')
    const rng = rngFromSeed(world.seed)
    const week = runToBirthday(world, rng)
    const age = pendingBirthday(world)!
    const { options, askedId } = birthdayOffer(world.seed, age)
    // Deliberately give her something she did NOT ask for, which is the middle row of §2ab's table.
    const wrong = options.find((o) => o.id !== askedId)!
    chooseGift(world, wrong.id)
    expect(world.birthdays).toEqual([{ week, age, asked: askedId, given: wrong.id }])
    // ...and the three outcomes are distinguishable, which is the whole point of the `asked` field.
    const row = world.birthdays[0]
    expect(row.given === row.asked, 'she got something else').toBe(false)
    expect(row.given, 'and it was a real present, not nothing').not.toBeNull()
  })

  it('a second answer for the same birthday is refused, and so is an option it never offered', () => {
    const world = career('refusals')
    const rng = rngFromSeed(world.seed)
    runToBirthday(world, rng)
    const { options } = birthdayOffer(world.seed, pendingBirthday(world)!)
    expect(() => chooseGift(world, 'not-a-gift')).toThrow(/not one of this birthday/)
    chooseGift(world, options[1].id)
    expect(() => chooseGift(world, options[0].id)).toThrow(/no birthday to answer/i)
    expect(world.birthdays.length, 'one row, whatever a double tap does').toBe(1)
  })

  it('⭐ an old career reads as NO BIRTHDAYS RECORDED, not as "gave nothing every year"', () => {
    // §4.5, and the distinction v45 and v46 were both built around. A v47 save has lived birthdays –
    // the feed said so every year – and the migration must not turn any of them into a decision.
    const legacy = JSON.parse(JSON.stringify({
      schemaVersion: 47,
      careerId: 'legacy',
      seed: 'legacy',
      week: 200,
      profile: { ...DEFAULT_PROFILE },
      plan: { train: 75, rest: 25, week: [[], [], [], [], [], [], []] } as WeekPlan,
    }))
    const migrated = migrateSave(legacy)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.birthdays, 'absent, and absent is NOT a row saying he gave nothing').toEqual([])
    // Idempotent in v30's sense: a save that already carries rows keeps them.
    const kept = migrateSave({ ...legacy, birthdays: [{ week: 23, age: 14, asked: 'phone', given: 'phone' }] })
    expect(kept.birthdays.length).toBe(1)
  })

  it('the record survives a save round-trip', () => {
    const world = career('round-trip')
    const rng = rngFromSeed(world.seed)
    runToBirthday(world, rng)
    chooseGift(world, birthdayOffer(world.seed, pendingBirthday(world)!).options[0].id)
    const reloaded = migrateSave(JSON.parse(JSON.stringify(world)))
    expect(reloaded.birthdays).toEqual(world.birthdays)
  })

  // ===============================================================================================
  // §2b – THE DIARY READS IT, AND NOTHING ELSE DOES
  // ===============================================================================================
  it('⭐ the diary sees the present, and notices a repeat', () => {
    const world = career('diary-sees')
    const rng = rngFromSeed(world.seed)
    runToBirthday(world, rng)
    const age = pendingBirthday(world)!
    const { options, askedId } = birthdayOffer(world.seed, age)
    chooseGift(world, askedId)

    const facts = toSnapshot(world).diary.facts
    expect(facts.birthdayAge).toBe(age)
    expect(facts.birthdayGift, 'a NOUN, so the diary owns no catalogue').toBe(giftNoun(askedId))
    expect(facts.birthdayWanted, 'she got what she asked for').toBe(true)
    expect(facts.birthdayRepeatAge, 'and it is the first time').toBeNull()

    // ⭐ THE CALLBACK. The owner ruled the catalogue may repeat «and the diary is expected to notice».
    const given = options.find((o) => o.id === askedId)!.id
    world.birthdays.unshift({ week: world.week - 52, age: age - 1, asked: given, given })
    const again = toSnapshot(world).diary.facts
    expect(again.birthdayRepeatAge, 'she was given this exact thing before, at that age').toBe(age - 1)
  })

  it('...and on every other week the diary sees no present at all', () => {
    const world = career('diary-quiet')
    const rng = rngFromSeed(world.seed)
    tickWeek(world, rng)
    const facts = toSnapshot(world).diary.facts
    expect(facts.birthdayGift).toBeNull()
    expect(facts.birthdayWanted).toBe(false)
    expect(facts.birthdayRepeatAge).toBeNull()
    // ...and while the dialog is UP but unanswered, there is still no present – the note completes
    // on the answer rather than promising one.
    runToBirthday(world, rng)
    expect(toSnapshot(world).birthdayPrompt, 'the dialog is up').not.toBeNull()
    expect(toSnapshot(world).diary.facts.birthdayGift, 'and nothing has been given yet').toBeNull()
  })

  // ===============================================================================================
  // THE COLLEGE FREEZE – the one place the popup deliberately does not fire
  // ===============================================================================================
  it('⚠ no birthday is raised inside the college freeze, and none is recorded as "gave nothing"', () => {
    // `resumeFromCollege` spends a college YEAR in one call with nobody able to answer, so a
    // blocking birthday there would strand the jump – the identical reason `rollKnock` is skipped.
    // Those birthdays are ABSENT rather than refused: nobody was asked, so there is no act to record.
    // ⚠ GUARD RE-AIMED, NOT WEAKENED (P5, 16.08): the freeze is spent one year at a time now
    // (docs/specs/college-as-a-second-act-2026-08.md) so the jump is 52 weeks rather than 208, and a
    // blocking birthday inside ANY of them strands it exactly as before. The span is unchanged here
    // on purpose – the assertion is about a week inside the freeze, whatever the freeze is spent in.
    const world = career('college')
    const rng = rngFromSeed(world.seed)
    const week = runToBirthday(world, rng)
    expect(pendingBirthday(world)).not.toBeNull()
    world.college = { fromWeek: week, untilWeek: week + 208, doneWeek: null, years: [], pendingCallUp: null }
    expect(pendingBirthday(world), 'silent at college').toBeNull()
    expect(advanceWeeks(world, rng, 2).includes('birthday'), 'and it does not block the jump').toBe(false)
    expect(world.birthdays, 'and writes nothing').toEqual([])
  })
})
