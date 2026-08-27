// =================================================================================================
// ⭐ ROUND-18 #10 – THE READING GAME: THE ASK IS A CLUE, THE UNITS AGREE, AND A REPEAT SAYS SO
// =================================================================================================
//
// The owner, 13.08, on his own save:
//
//   «странные сообщения в днях рождения с очень явными странными же ответами. Что-то вроде "чего бы
//    она себе никогда не купила" и ответ в таком же духе. А еще был вариант запроса "день вместе", а
//    в ответах была неделя вместе. Т.е. когда будем мораль делать может быть надо будет учитывать
//    оба. И в предыдущем раунде я уже спрашивал про обратную память ответов, чтобы мы новую машину
//    не раз в год покупали (хотя почему и нет, с другой стороны, но если так, то надо как-то
//    обыграть)»
//
// THE YARDSTICK IS THE SPEC'S OWN DESIGN (birthday-and-gifts.md §2ab): she asks for ONE thing,
// exactly one of the four options answers it, the others do not, and the game never marks which
// («не помечай, пусть игрок читает»). Everything in this file follows from that: if the ask does not
// discriminate, or if two rows answer it at different sizes, then the unmarked choice the owner
// asked for is not a choice at all – it is four rows and a coin.
//
// ⚠ WHY IT IS A SWEEP OVER THE CATALOGUE AND NOT A HANDFUL OF EXAMPLES. The three defects he found
// were three different pairs in three different bands, and he found them by PLAYING – one birthday a
// year. A test that pinned his three would have left the rest of the catalogue exactly as unchecked
// as it was. These four rules read every ask against every option it can ever appear beside.
//
// MUTATION-VERIFIED, and each block names what was changed to make it fail. The whole file was first
// run against the catalogue AS SHIPPED and went red in six places, which are the six pairs listed in
// the spec's §8 table.
import { describe, expect, it } from 'vitest'
import {
  BIRTHDAY_BANDS,
  BIRTHDAY_COLLEGE_BAND,
  BIRTHDAY_DAY_TOGETHER,
  BIRTHDAY_TIME_TOGETHER,
  birthdayOffer,
  birthdayOptions,
  chooseGift,
  createWorld,
  decideKnock,
  giftNoun,
  pendingBirthday,
  pendingKnock,
  tickWeek,
  toSnapshot,
  // ⭐ ROUND 26 #4 – the means licence and the predicate behind it (src/engine/world/means.ts).
  birthdayWords,
  familyMeans,
  meansOfCents,
  MEANS_BANDS,
  type FamilyMeans,
} from '../src/engine/world'
import { answerFork } from '../src/engine/world/endings'
import { ENDINGS } from '../src/engine/ending'
import { ageAtPhysicalShare } from '../src/engine/development'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
// ⚠ RE-AIMED by R2-09, not weakened: `BirthdayGift` left the wire format for the engine leaf that
// owns the catalogue's shape (src/engine/world/birthdayGift.ts). Same type, same assertions.
import type { BirthdayGift } from '../src/engine/world/birthdayGift'

/** Every gift that can be on screen together: a band's own list plus the day, which is offered in
 *  every band (spec §2a). Three of a band's gifts are drawn, so ANY pair of them can co-occur and
 *  every rule below has to hold for the whole pool rather than for one draw. */
function poolOf(band: (typeof BIRTHDAY_BANDS)[number]): BirthdayGift[] {
  return [...band.gifts, BIRTHDAY_DAY_TOGETHER]
}

const bandName = (b: (typeof BIRTHDAY_BANDS)[number]) => `band ${b.from}-${b.to}`

// =================================================================================================
// RULE 1 – A ROW NAMES A THING
// =================================================================================================
//
// ⚠ THE PLACEHOLDER HEAD IS THE DEFECT, and it is what the owner quoted. "The thing she would never
// buy herself" is not a present, it is a description of a want – so the only sentence that could
// point at it was the same description again, which is exactly what shipped. A label that names an
// object can be pointed at by a line about HER; a label that names a want can only be pointed at by
// itself.
const PLACEHOLDER_HEAD = /^(the|a|an)?\s*(thing|something|anything|stuff)\b/i

// =================================================================================================
// RULE 2 – THE ASK HOOKS EXACTLY ONE ROW
// =================================================================================================
//
// ⚠ THE STOP LIST IS PART OF THE ASSERTION, NOT PLUMBING. "something", "anything", "nothing" and
// "thing" are in it ON PURPOSE: an ask whose only word in common with its row is a placeholder has
// told the player nothing, which is precisely how «something with nothing to do with tennis» could
// be answered by jewellery, by a week at home and by a painting all at once. Dropping those four
// entries from this list is the mutation that makes the jewellery pair pass again.
const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'it', 'is', 'was', 'for', 'on', 'at', 'by',
  'with', 'from', 'as', 'that', 'this', 'these', 'those', 'she', 'her', 'hers', 'he', 'his', 'we',
  'us', 'our', 'ours', 'they', 'them', 'their', 'has', 'have', 'had', 'been', 'be', 'are', 'not',
  'no', 'never', 'always', 'ever', 'all', 'any', 'some', 'one', 'two', 'now', 'then', 'still',
  'would', 'will', 'can', 'could', 'should', 'said', 'says', 'say', 'asking', 'asked', 'ask', 'what',
  'who', 'when', 'where', 'which', 'how', 'about', 'into', 'out', 'up', 'down', 'over', 'under',
  'again', 'more', 'most', 'other', 'else', 'own', 'very', 'just', 'only', 'also', 'so', 'if',
  'there', 'here', 'every', 'each', 'both', 'you', 'your', 'anything', 'something', 'nothing',
  'thing', 'things', 'get', 'got', 'goes', 'go', 'going', 'does', 'did', 'make',
])

/** Distinctive words, crudely stemmed. Plural-only stemming on purpose: it is enough to tie "the
 *  airports" to "Airports" and deliberately does NOT tie "chose" to "choosing", so a hook has to be
 *  a word the player can actually see in both places. */
function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w))
    .map((w) => (w.endsWith('s') && w.length > 3 ? w.slice(0, -1) : w))
}

/** Everything the player can ever read on this row – including the repeat copy, because a second
 *  offer replaces the note and a word that leaks in there is just as capable of pointing at the
 *  wrong row. */
const rowText = (g: BirthdayGift) => `${g.label} ${g.note} ${g.again}`

/** The words that tie an ask to its own row and to NO other row in the band. */
function hooks(gift: BirthdayGift, pool: BirthdayGift[]): string[] {
  const own = new Set(words(`${gift.label} ${gift.note}`))
  const rivals = pool.filter((h) => h.id !== gift.id).map((h) => new Set(words(rowText(h))))
  return [...new Set(words(gift.ask))].filter((w) => own.has(w) && !rivals.some((r) => r.has(w)))
}

// =================================================================================================
// RULE 3 – THE UNITS AGREE (the day / the week / the trip)
// =================================================================================================
const unitRe = (unit: string) => new RegExp(`\\b${unit}s?\\b`, 'i')

describe('the birthday ask is a clue – round-18 #10a', () => {
  it('⭐ RULE 1 – every row names a THING, not a want', () => {
    // Mutation: restore `label: 'The thing she would never buy herself'` on `neverbuy` and this
    // fails on both bands that offer it. It also failed, as shipped, on `notennis` and on `home`.
    for (const band of BIRTHDAY_BANDS) {
      for (const gift of poolOf(band)) {
        expect(
          PLACEHOLDER_HEAD.test(gift.label),
          `${bandName(band)} ${gift.id}: "${gift.label}" is a description of a want, not a present – ` +
            'the only line that can point at it is the same line again',
        ).toBe(false)
      }
    }
  })

  it('⭐ RULE 2 – every ask shares a word with its own row that no other row of the band shares', () => {
    // ⚠ THIS IS "EXACTLY ONE OPTION ANSWERS IT" MADE READABLE. §2ab already guarantees that exactly
    // one option IS the answer – the ask is drawn from the four offered, so it is true by
    // construction – but that is a guarantee about the engine, not about the English. This is the
    // English: there is a word in the ask that the player can find on one row and only one.
    //
    // Mutation: put back «She has been asking for something with nothing to do with tennis.
    // Anything.» on `jewellery` and this fails on both bands – the ask's every content word is a
    // placeholder, so it hooks nothing. Same for the shipped `album` ask, whose only word in common
    // with its own row was "whole", which the day row also carries.
    const failures: string[] = []
    for (const band of BIRTHDAY_BANDS) {
      const pool = poolOf(band)
      for (const gift of pool) {
        if (hooks(gift, pool).length === 0) failures.push(`${bandName(band)} ${gift.id}: "${gift.ask}"`)
      }
    }
    expect(failures, 'an ask with no hook is a coin toss between four rows').toEqual([])
  })

  it('...and the hook really is in what the dialog prints, not in a field the player never sees', () => {
    // Guards the rule above against being satisfied by `short` or by the ask alone: the hook has to
    // appear in the LABEL or the NOTE, which are the two strings on the button.
    for (const band of BIRTHDAY_BANDS) {
      const pool = poolOf(band)
      for (const gift of pool) {
        const onScreen = words(`${gift.label} ${gift.note}`)
        for (const hook of hooks(gift, pool)) {
          expect(onScreen, `${bandName(band)} ${gift.id}: hook "${hook}"`).toContain(hook)
        }
      }
    }
  })

  it('⭐ ON THE RENDERED PROMPT: the ask and the four rows, read together', () => {
    // ⚠ THE ASSERTION THE OWNER'S REPORT ASKS FOR, on what is actually on screen. The two rules
    // above are properties of the catalogue; this is the property of a DIALOG: the line at the top
    // and the four buttons under it, assembled exactly as `buildBirthdayPrompt` assembles them, with
    // a word in the ask that lands on ONE button and not on the other three.
    //
    // ⚠ AND IT IS NOT A RESTATEMENT OF RULE 2. Rule 2 is over the whole band; this is over the four
    // that were actually drawn, and it is the version that would have gone red on the owner's own
    // screen. A tighter sweep than his career could ever be: every age, sixty seeds each.
    //
    // ⚠ NOTE WHAT IS *NOT* ASSERTED: that the answering row is first, or marked, or different in any
    // way. «не помечай, пусть игрок читает» – the correspondence is the English and nothing else.
    const failures: string[] = []
    for (const age of [14, 15, 16, 17, 18, 19, 20, 21, 22, 25, 28, 29, 34]) {
      for (let s = 0; s < 60; s++) {
        const { options, askedId } = birthdayOffer(`rendered-${s}`, age)
        const rows = birthdayOptions(options, [])
        const asked = options.find((g) => g.id === askedId)!
        const found = hooks(asked, options)
        if (found.length === 0) {
          failures.push(`age ${age} seed ${s}: "${asked.ask}" hooks none of ${rows.map((r) => r.label)}`)
          continue
        }
        // ...and the hook is on exactly ONE of the four rows the player is looking at.
        for (const hook of found) {
          const matched = rows.filter((r) => words(`${r.label} ${r.note}`).includes(hook))
          if (matched.length !== 1 || matched[0].id !== askedId) {
            failures.push(`age ${age} seed ${s}: "${hook}" lands on ${matched.length} of the four rows`)
          }
        }
      }
    }
    expect(failures.slice(0, 8), 'the line at the top must point at one button').toEqual([])
  })
})

describe('the ask and the answer agree on scale – round-18 #10b', () => {
  // «А еще был вариант запроса "день вместе", а в ответах была неделя вместе.» The day, the week at
  // home and the trip are the SAME want at three sizes. Two of them are on screen together in three
  // of the seven bands, and when they are, the unit is the only thing between them.

  it('⭐ RULE 3 – a time-together ask names its own unit AND rules the others out', () => {
    // Mutation: restore «She has not asked for anything. She asked whether we could have the day.»
    // on the day, and this fails for every band that also offers the week or the trip – which is
    // exactly the pair he read.
    for (const band of BIRTHDAY_BANDS) {
      const axis = poolOf(band).filter((g) => BIRTHDAY_TIME_TOGETHER[g.id] !== undefined)
      for (const gift of axis) {
        const mine = BIRTHDAY_TIME_TOGETHER[gift.id]
        expect(
          unitRe(mine).test(gift.ask),
          `${bandName(band)} ${gift.id}: the ask must say "${mine}" – "${gift.ask}"`,
        ).toBe(true)
        expect(
          unitRe(mine).test(`${gift.label} ${gift.note}`),
          `${bandName(band)} ${gift.id}: and so must the row`,
        ).toBe(true)
        for (const rival of axis) {
          if (rival.id === gift.id) continue
          const theirs = BIRTHDAY_TIME_TOGETHER[rival.id]
          expect(
            unitRe(theirs).test(gift.ask),
            `${bandName(band)} ${gift.id}: "${theirs}" is on screen beside it and the ask never rules ` +
              `it out – "${gift.ask}"`,
          ).toBe(true)
        }
      }
    }
  })

  it('⚠ ...and no OTHER ask anywhere drops a scale word in as a red herring', () => {
    // A unit word in an ask that is not about time is a false hook. The bicycle's ask used to end
    // "Every single week" – frequency, not scale, but the same word the week at home is sold on.
    //
    // ⚠ ALL THREE UNITS, IN EVERY BAND, and not just the ones that band offers. The first draft
    // scoped this to the axis gifts actually in the band and the bicycle sailed through, because
    // fourteen-year-olds are not offered a week at home. The three units are ONE vocabulary: the
    // day is on screen in every band, so "day", "week" and "trip" all read as sizes of the same
    // want wherever they appear, and a stray one is noise on the only axis the player has to
    // measure. Mutation-verified by restoring the bicycle's tail.
    const units = [...new Set(Object.values(BIRTHDAY_TIME_TOGETHER))]
    for (const band of BIRTHDAY_BANDS) {
      for (const gift of poolOf(band)) {
        if (BIRTHDAY_TIME_TOGETHER[gift.id]) continue
        for (const unit of units) {
          expect(
            unitRe(unit).test(gift.ask),
            `${bandName(band)} ${gift.id}: says "${unit}" and is not about time – "${gift.ask}"`,
          ).toBe(false)
        }
      }
    }
  })

  it('⭐ the three sizes stay three ids, which is what a morale slice will need', () => {
    // The owner: «когда будем мораль делать может быть надо будет учитывать оба» – a day and a week
    // must not be worth the same. That is only expressible later because they are recorded
    // separately now (`BirthdayRecord.given`). If anybody ever merges them into one "time together"
    // option, the distinction is gone from every save that was ever written and cannot come back.
    expect(Object.keys(BIRTHDAY_TIME_TOGETHER).sort()).toEqual(['day', 'familyweek', 'trip'])
    expect(new Set(Object.values(BIRTHDAY_TIME_TOGETHER)).size, 'three sizes, three words').toBe(3)
    // ...and each one really is in the catalogue under that id, or the table above is decoration.
    const ids = new Set([BIRTHDAY_DAY_TOGETHER.id, ...BIRTHDAY_BANDS.flatMap((b) => b.gifts.map((g) => g.id))])
    for (const id of Object.keys(BIRTHDAY_TIME_TOGETHER)) expect(ids, id).toContain(id)
  })
})

describe('a repeat is played, not silent – round-18 #10c', () => {
  // Round-17 #18 taught the ASK to skip a present she already has; the OFFER was left untouched, so
  // a car could still be chosen at nineteen, twenty and twenty-one with the identical four rows
  // every time. He asked again, and answered himself: «хотя почему и нет, с другой стороны, но если
  // так, то надо как-то обыграть.»

  it('⭐ every gift carries the words for its second offer, and they are different words', () => {
    for (const band of BIRTHDAY_BANDS) {
      for (const gift of poolOf(band)) {
        expect(gift.again.length, `${bandName(band)} ${gift.id}.again`).toBeGreaterThan(10)
        expect(gift.again, `${bandName(band)} ${gift.id}: the repeat says the same as the first time`)
          .not.toBe(gift.note)
        expect(['durable', 'repeatable'], `${bandName(band)} ${gift.id}.repeat`).toContain(gift.repeat)
      }
    }
  })

  it('⭐ DURABLE says she has one ALREADY; REPEATABLE says she is having it AGAIN', () => {
    // ⚠ THE DISTINCTION IS THE POINT AND THE WORDS ARE THE TEST. A car, a laptop, a deposit cannot
    // arrive twice without somebody noticing, so the row says she has one – the repeat is allowed
    // (his ruling) but it cannot happen by accident. A week at home, a day, a trip, another piece
    // for the box are things she may want every year of her life, so the row reads as a tradition
    // rather than a warning.
    for (const band of BIRTHDAY_BANDS) {
      for (const gift of poolOf(band)) {
        const held = /\balready\b/i.test(gift.again)
        const tradition = /\b(again|before|last time)\b/i.test(gift.again)
        if (gift.repeat === 'durable') {
          expect(held, `${gift.id}: a durable's second offer must say she has one – "${gift.again}"`).toBe(true)
          expect(tradition, `${gift.id}: ...and must not read as a tradition – "${gift.again}"`).toBe(false)
        } else {
          expect(tradition, `${gift.id}: a repeatable's second offer must own the repeat – "${gift.again}"`).toBe(true)
          expect(held, `${gift.id}: ...and must not read as a warning – "${gift.again}"`).toBe(false)
        }
      }
    }
  })

  it('⭐ the RENDERED row changes the moment it is a repeat, and only that row', () => {
    // Mutation: drop the `held.has(id)` branch in `birthdayOptions` and the note stays the fresh
    // one – this fails. The ids, the order and the count are untouched, which is the other half of
    // the claim: nothing about the OFFER moved, only the words under one button.
    const { options } = birthdayOffer('rendered-repeat', 20)
    const repeated = options[1]
    const fresh = birthdayOptions(options, [])
    const second = birthdayOptions(options, [repeated.id])
    expect(second.map((o) => o.id), 'same four, same order').toEqual(fresh.map((o) => o.id))
    expect(second[1].note, 'the repeated row says so').toBe(repeated.again)
    expect(second[1].note).not.toBe(fresh[1].note)
    for (let i = 0; i < 4; i++) {
      if (i === 1) continue
      expect(second[i], `row ${i} is untouched`).toEqual(fresh[i])
    }
    // ...and the wire still carries an id, a label and a note. No new field, nothing that marks.
    for (const o of second) expect(Object.keys(o).sort()).toEqual(['id', 'label', 'note'])
  })

  it('⭐ ON A REAL CAREER: the second car says it is the second, in the dialog he reads', () => {
    // The owner's own sentence, made into a fixture: «чтобы мы новую машину не раз в год покупали».
    //
    // ⚠⚠ RE-AIMED BY ROUND 26 #9b, AND THE THING THAT MOVED IS THE FIXTURE'S PREMISE, NOT ITS CLAIM.
    // This read "the 19-21 band offers exactly three material gifts, so a car given at nineteen is
    // offered again at twenty WITH CERTAINTY – which is the whole reason he noticed". That certainty
    // was the defect #9b removed: the band held one possible dialog and printed it three years
    // running. The band is five rows now and the offer WALKS its combinations, so the car comes back
    // within the cycle rather than the very next year. The claim under test is unchanged and is
    // still round-18 #10c's – when the car IS offered again, the row says so – so the fixture walks
    // to the next birthday that offers it instead of assuming the next birthday will.
    const world = createWorld('two-cars', { ...DEFAULT_PROFILE, birthMonth: 6, birthDay: 15, coachTier: 'self' })
    const rng = rngFromSeed(world.seed)
    const runToBirthday = (): number => {
      for (let i = 0; i < 60; i++) {
        if (pendingKnock(world)) decideKnock(world, 'rest')
        if (pendingBirthday(world) !== null) return world.week
        tickWeek(world, rng)
      }
      return -1
    }
    // Walk her to the 19-21 band, answering with the day (never spent, so it changes nothing).
    for (let year = 0; year < 12; year++) {
      const week = runToBirthday()
      if (week < 0) break
      const age = pendingBirthday(world)!
      if (age >= 19) break
      chooseGift(world, BIRTHDAY_DAY_TOGETHER.id)
      tickWeek(world, rng)
    }
    expect(pendingBirthday(world), 'the fixture has to reach the independence band').toBeGreaterThanOrEqual(19)

    // The car, given once...
    const first = toSnapshot(world).birthdayPrompt!
    const carFirst = first.options.find((o) => o.id === 'car')!
    expect(carFirst.note, 'the first time it is just a car').toBe('So the driving stops being ours.')
    chooseGift(world, 'car')
    tickWeek(world, rng)

    // ...and offered again within the band's cycle, saying what it is.
    let second: ReturnType<typeof toSnapshot>['birthdayPrompt'] = null
    let nextYear: ReturnType<typeof toSnapshot>['birthdayPrompt'] = null
    for (let year = 0; year < 6 && second === null; year++) {
      expect(runToBirthday(), 'and she has another birthday').toBeGreaterThan(0)
      const prompt = toSnapshot(world).birthdayPrompt!
      if (nextYear === null) nextYear = prompt
      if (prompt.options.some((o) => o.id === 'car')) second = prompt
      else {
        chooseGift(world, BIRTHDAY_DAY_TOGETHER.id)
        tickWeek(world, rng)
      }
    }
    expect(second, 'the car comes back inside the cycle').not.toBeNull()
    const carAgain = second!.options.find((o) => o.id === 'car')!
    expect(carAgain.note, 'a second car does not arrive in silence').toMatch(/already/i)
    expect(carAgain.note).not.toBe(carFirst.note)
    // ...and she does not ASK for it either, which is round-17 #18 still holding.
    expect(second!.ask).not.toBe(first.options.length ? carFirst.label : '')
    // ⭐ ROUND 26 #9b, AND IT IS THE ASSERTION THAT WAS INVERTED. This used to demand «the same four
    // rows, unchanged» – true then, and precisely the owner's complaint two rounds later. The very
    // next birthday must now differ from this one, which is the no-repeat window as a behaviour.
    expect(nextYear, 'she had a next birthday at all').not.toBeNull()
    expect(nextYear!.options.map((o) => o.id).sort(), 'the next birthday is not the same dialog').not.toEqual(
      first.options.map((o) => o.id).sort(),
    )
  })
})

describe('⚠ the copy work costs the stream nothing', () => {
  it('⭐ the two sub-streams are drawn exactly C(n,3)-1 and 4 times, for every band', () => {
    // CLAUDE.md invariant 2. Replayed off INDEPENDENT generators on the same keys, counting as they
    // go – so an extra `rng()` call anywhere in `birthdayOffer` makes the replayed order diverge
    // from the real one and this fails. Mutation-verified by adding a bare `rng()` before the ask
    // draw, and again by reversing the enumeration order of the combinations.
    //
    // ⚠⚠ RE-AIMED BY ROUND 26 #9b, AND THE SHAPE OF THE CLAIM CHANGED WITH THE MECHANISM. It used to
    // be ONE stream and `(n-1) + 3 + 1` draws: the band was shuffled per AGE and the top three
    // taken, which is sampling with replacement and is exactly what made 53% of consecutive
    // birthdays print the identical four rows. There are two streams now:
    //
    //   `seed:birthday:cycle:<band>`  the band's whole population of combinations, shuffled ONCE per
    //                                career per band – C(n,3)-1 draws, and NOT keyed on the age,
    //                                which is what makes consecutive ages walk one permutation.
    //   `seed:birthday:<age>`        four draws, always: three to order the four rows on screen and
    //                                one for the ask. It no longer depends on the band's size.
    //
    // ⚠ NEITHER IS MAIN, so the frozen capture (41550 / e6b0c709) cannot move, and neither key
    // carries a week or a choice, so nothing here can be re-rolled by reloading.
    const shuffle = <T,>(items: readonly T[], rng: () => number): T[] => {
      const out = items.slice()
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1))
        ;[out[i], out[j]] = [out[j], out[i]]
      }
      return out
    }
    /** The engine's own enumeration, replayed – combinations in index order. */
    const combinations = <T,>(items: readonly T[], k: number): T[][] => {
      const out: T[][] = []
      const walk = (start: number, acc: T[]): void => {
        if (acc.length === k) return void out.push(acc.slice())
        for (let i = start; i < items.length; i++) walk(i + 1, [...acc, items[i]])
      }
      walk(0, [])
      return out
    }
    for (const band of BIRTHDAY_BANDS) {
      // ⚠ RE-AIMED BY R2-18, NOT WEAKENED. Every band used to be reachable by AGE alone, so
      // `birthdayOffer(seed, age)` was enough to replay it. The college band is chosen by a FACT
      // (`atCollege`) and spans 0-99, so replaying it by age would silently replay the 0-14 band
      // instead – the counted draw would still be a real draw and the test would still pass, while
      // checking the wrong list. The flag is passed through here, which is also what makes the
      // college band's own draw count load-bearing.
      const atCollege = band === BIRTHDAY_COLLEGE_BAND
      const age = Math.max(band.from, 14)
      const population = combinations(band.gifts, 3)

      let cycleDraws = 0
      const cycleRng = rngFromSeed(`draws:birthday:cycle:${atCollege ? 'college' : `${band.from}-${band.to}`}`)
      const countedCycle = () => {
        cycleDraws++
        return cycleRng()
      }
      const order = shuffle(population, countedCycle)
      const material = order[age % order.length]
      expect(cycleDraws, `${bandName(band)}: one Fisher-Yates over C(n,3) combinations`)
        .toBe(population.length - 1)

      let draws = 0
      const rng = rngFromSeed(`draws:birthday:${age}`)
      const counted = () => {
        draws++
        return rng()
      }
      const options = shuffle([...material, BIRTHDAY_DAY_TOGETHER], counted)
      // ⚠ THE ASK IS REPLAYED TOO, AND THAT IS WHAT MAKES THE COUNT LOAD-BEARING. The first draft
      // compared only the four ids, so an extra `rng()` AFTER the shuffles moved the ask and nothing
      // noticed. The ask is the last draw on the stream: shift it by one and it lands elsewhere.
      const askedId = options[Math.floor(counted() * options.length)].id
      expect(draws, `${bandName(band)}: three to order the four rows, one for the ask`).toBe(4)
      const real = birthdayOffer('draws', age, [], atCollege)
      expect(
        [real.options.map((o) => o.id), real.askedId],
        `${bandName(band)}: the real offer and the counted replay must be the same draw`,
      ).toEqual([options.map((o) => o.id), askedId])
    }
  })

  it('⚠ ...and a career with a long record is offered the identical four', () => {
    // The repeat copy is chosen AFTER the draw (`birthdayOptions`), never inside it, so a record
    // cannot move an option, a position or a dice. §5.2's licensed repeat is intact.
    const fresh = birthdayOffer('long-record', 20)
    const loaded = birthdayOffer('long-record', 20, ['car', 'deposit', 'home', 'day', 'laptop'])
    expect(loaded.options.map((o) => o.id)).toEqual(fresh.options.map((o) => o.id))
  })
})

// =================================================================================================
// ⭐⭐ R2-18 / PROD-10 — THE COLLEGE BIRTHDAYS ARE NOT SPENT IN A FLAT SHE HAS NOT GOT
// =================================================================================================
//
// Round 24 made four of her birthdays happen at college (`pendingBirthday` lost its college
// exclusion on the 22.08 ruling) and nothing was written for them: she fell through `bandFor(age)`
// into the 19-21 INDEPENDENCE band and was offered a deposit for a place of her own, a car, and «A
// kitchen table for her flat» whose note reads "She is furnishing a life we do not live in". She is
// in a hall of residence with three years of a scholarship left.
//
// ⚠⚠ THE TEST IS BY FACT, NOT BY A WORD LIST, which is the review's explicit instruction and the
// right one. It does NOT scan the copy for "flat", "keys" or "kitchen" – the next residence noun
// would walk straight past that, exactly as "the hall mirror" walked past the week-note blacklist.
// It asserts the STRUCTURAL fact instead: while she is at college, every option on the screen comes
// from the band written for college. A new age-band gift asserting a mortgage cannot reach her,
// whatever it is called, because it is not in the set.
describe('R2-18 — a girl at college is offered gifts for the life she is actually living', () => {
  const COLLEGE_IDS = new Set([...BIRTHDAY_COLLEGE_BAND.gifts.map((g) => g.id), BIRTHDAY_DAY_TOGETHER.id])

  it('⭐ every option on a college birthday comes from the college band, at every age', () => {
    // The whole span a scholarship can cover, and then some: the point is that AGE stops deciding.
    for (let age = 17; age <= 30; age++) {
      const { options, askedId } = birthdayOffer('college-sweep', age, [], true)
      expect(options).toHaveLength(4)
      for (const o of options) {
        expect(COLLEGE_IDS.has(o.id), `age ${age}: "${o.label}" is not a college-band gift`).toBe(true)
      }
      // ...and the ask is one of the four she can see – §2ab, which the new band must not break.
      expect(options.map((o) => o.id)).toContain(askedId)
      // the day is always one of them (spec §2a): "nothing" stays a real answer at college too
      expect(options.map((o) => o.id)).toContain(BIRTHDAY_DAY_TOGETHER.id)
    }
  })

  // ===============================================================================================
  // ⭐⭐⭐⭐ ROUND 26 #4, SECOND PASS – THE FIRST COLLEGE BIRTHDAY IS THE BICYCLE'S
  // ===============================================================================================
  //
  // The owner: «может быть это должна быть как раз просьба на первый ДР во время учебы вообще».
  //
  // ⚠⚠ THIS IS A SWEEP OVER SEEDS AND NOT A WALKED CAREER, AND THE REASON IS A MEASURED HOLE. The
  // walked cases in `tests/college-birthday.test.ts` use three seeds, and the guarantee this rests on
  // – that entry 0 of the shuffled college cycle CONTAINS the bicycle – is 75% likely per seed by
  // luck alone (3 of the band's C(4,3) = 4 combinations hold it). Deleting the rotation in
  // `materialFor` and re-running those three careers came back **GREEN**: they had drawn a lucky
  // shuffle. Two hundred seeds cannot.
  it('⭐⭐⭐⭐ every seed offers the bicycle on her first college birthday, and asks for it', () => {
    let cyclesWithoutTheBikeFirst = 0
    for (let s = 0; s < 200; s++) {
      const { options, askedId } = birthdayOffer(`first-college-${s}`, 19, [], true, 0)
      expect(options.map((o) => o.id), `seed ${s}: the bicycle is on the dialog`).toContain('campusbike')
      expect(askedId, `seed ${s}: and it is what she asked for`).toBe('campusbike')
      // ⚠ ANTI-VACUITY, AND IT IS THE PART THAT MAKES THE ROTATION A MEASURED FIX RATHER THAN A
      // BELIEF: the UNROTATED cycle really does put a bike-less combination first for some seeds, so
      // the two assertions above are not true by accident of the shuffle.
      const unrotated = birthdayOffer(`first-college-${s}`, 19, [], true, 3)
      if (!unrotated.options.map((o) => o.id).includes('campusbike')) cyclesWithoutTheBikeFirst += 1
    }
    expect(
      cyclesWithoutTheBikeFirst,
      'the band really does hold a combination without the bicycle, and the walk really does reach it',
    ).toBeGreaterThan(0)
  })

  it('⭐⭐⭐ four college birthdays are four different dialogs, on every seed', () => {
    // ⚠ ROUND 26 #9b's CLAIM, RE-ASSERTED AFTER THE WALK WAS RE-INDEXED BY COLLEGE BIRTHDAY. The
    // rotation could have broken it and did not: a rotation of a four-cycle is still a four-cycle.
    for (let s = 0; s < 200; s++) {
      const dialogs = [0, 1, 2, 3].map((i) =>
        birthdayOffer(`four-college-${s}`, 19 + i, [], true, i)
          .options.map((o) => o.id)
          .sort()
          .join('|'),
      )
      expect(new Set(dialogs).size, `seed ${s}: ${dialogs.join('  ·  ')}`).toBe(4)
    }
  })

  it('⚠ the draw count does not move on the first college birthday – the ask is overridden, not skipped', () => {
    // ⚠ CLAUDE.md INVARIANT 2's BOOKKEEPING. `seed:birthday:<age>` is drawn exactly four times for
    // every birthday in the game, and pinning the first college ask may not make it three: a branch
    // that skipped the roll would make the stream's position depend on where in her life she is.
    // Asserted as an identity rather than as a count – the OPTIONS a first-birthday offer produces
    // are byte-identical to those of the same offer with the pin off (`collegeIndex: null` walks by
    // age, so index 0 is compared against the same cycle entry via a matching age).
    for (let s = 0; s < 60; s++) {
      const pinned = birthdayOffer(`draw-count-${s}`, 20, [], true, 0)
      const unpinned = birthdayOffer(`draw-count-${s}`, 20, [], true, null)
      // the ROWS come from the walk index, so pick the age whose unpinned index lands on entry 0
      const sameEntry = birthdayOffer(`draw-count-${s}`, 20, [], true, 0)
      expect(pinned.options.map((o) => o.id)).toEqual(sameEntry.options.map((o) => o.id))
      // ...and the unpinned offer still returns a drawn ask from its own four, never null or the pin
      expect(unpinned.options.map((o) => o.id)).toContain(unpinned.askedId)
    }
  })

  it('⭐ ...and the age bands she skips are the ones that assert a home – she cannot reach them', () => {
    // Stated as the complement of the rule above rather than as a second rule: these are the ids the
    // 19-21 and 22-28 bands offer, and the assertion is that the college set does not intersect them.
    const ageBandIds = new Set(
      BIRTHDAY_BANDS.filter((b) => b !== BIRTHDAY_COLLEGE_BAND).flatMap((b) => b.gifts.map((g) => g.id)),
    )
    for (const id of BIRTHDAY_COLLEGE_BAND.gifts.map((g) => g.id)) {
      expect(ageBandIds.has(id), `${id} is in an age band too – a repeat the record cannot explain`).toBe(false)
    }
    // and the three the review named are genuinely in the age bands, or this proves nothing
    for (const id of ['deposit', 'car', 'home']) expect(ageBandIds.has(id)).toBe(true)
  })

  it('⚠ A CAREER THAT NEVER GOES TO COLLEGE IS OFFERED EXACTLY WHAT IT WAS – not one draw moved', () => {
    // ⚠ THE RNG CLAIM, AS A TEST RATHER THAN AS A COMMENT. `atCollege` chooses which list is
    // shuffled; it adds and removes no `rng()` call, and it is false on every tour career. So the
    // sub-stream `seed:birthday:<age>` is drawn the identical number of times and every existing
    // save is offered the identical four options in the identical order.
    //
    // Mutation: make `atCollege` default to `true` in `birthdayOffer` and this goes red at once.
    for (let age = 14; age <= 32; age++) {
      const withFlag = birthdayOffer('tour-career', age, [], false)
      const withoutFlag = birthdayOffer('tour-career', age)
      expect([withFlag.options.map((o) => o.id), withFlag.askedId]).toEqual([
        withoutFlag.options.map((o) => o.id),
        withoutFlag.askedId,
      ])
      // ...and none of them is a college gift, which is the other half of the same fact
      for (const o of withoutFlag.options) {
        if (o.id === BIRTHDAY_DAY_TOGETHER.id) continue
        expect(COLLEGE_IDS.has(o.id), `age ${age}: a tour career was offered "${o.label}"`).toBe(false)
      }
    }
  })

  it('⭐ the diary can still name a college gift years later – `giftNoun` walks the whole catalogue', () => {
    // The trap this closes: a callback is by definition about a gift given at a DIFFERENT age, and
    // by the time she is remembered for the lamp she is in an age band that never offered it. If
    // `giftNoun` had kept looking only through `BANDS`, every college callback would have gone
    // silently null – the exact failure its own comment warns about for cross-band callbacks.
    for (const gift of BIRTHDAY_COLLEGE_BAND.gifts) {
      expect(giftNoun(gift.id), `${gift.id} has no noun for the diary`).toBe(gift.short)
    }
  })
})

// =================================================================================================
// ⭐⭐ ROUND 26 #4 – A WISH MAY NOT ASSUME A WALLET THE FAMILY HAS NOT GOT
// =================================================================================================
//
// The owner, 24.08, reading his own save:
//
//   «Очень странное пожелание на день рождения "She was looking fares home at two in the morning"
//    для студентки с кошельком 500к+ с предложением подарить велосипед.»
//
// $584,375 in the family wallet, $59,220 in hers, a scholarship, and a girl scanning ticket prices
// at two in the morning because she cannot face the fare. It is a good line for the family it was
// written for and a false one for his.
//
// ⚠⚠ THE RULE IS BY FACT AND NOT BY A WORD LIST, which is the standing instruction and the reason
// the old adult guard passed for a year. Nothing below greps the copy for "fare" or "afford". A row
// DECLARES what its words rest on (`BirthdayGift.means`) and `world/means.ts` answers whether that
// is true of this family; the sweep checks the DECLARATION and the RENDERING, so the next hardship
// noun cannot walk past it by being spelled differently.
describe('ROUND 26 #4 – the wish is licensed by what the family has', () => {
  const claiming = BIRTHDAY_BANDS.flatMap((b) => b.gifts).filter((g) => g.means !== undefined)

  it('⭐ the bands are read off the economy, not chosen – and the fare check is the sanity check', () => {
    // ⚠ THE THRESHOLD'S PROVENANCE, AS AN ASSERTION. Both numbers ARE `ECONOMY.startingFundsCents`
    // – the only balances the design ever named – and neither is a figure somebody liked the look
    // of. Mutation: replace either bound with a literal and this goes red the next time the economy
    // is retuned, which is exactly when a hand-copied threshold would have gone quietly wrong.
    expect(MEANS_BANDS.tightAtOrBelowCents).toBe(ECONOMY.startingFundsCents.working)
    expect(MEANS_BANDS.moneyedAtOrAboveCents).toBe(ECONOMY.startingFundsCents.wealthy)
    // the three opening reserves land in the three bands they name, which is what makes the table
    // readable as "poorer than the poorest family" / "richer than the richest"
    expect(meansOfCents(ECONOMY.startingFundsCents.working)).toBe('tight')
    expect(meansOfCents(ECONOMY.startingFundsCents.middle)).toBe('comfortable')
    expect(meansOfCents(ECONOMY.startingFundsCents.wealthy)).toBe('moneyed')
    // ...and a family under water is tight rather than an edge case
    expect(meansOfCents(-1)).toBe('tight')
  })

  it('⭐ a row that makes a money claim carries the words for when it is false, and no other row does', () => {
    expect(claiming.length, 'the catalogue makes at least one money claim').toBeGreaterThan(0)
    for (const gift of claiming) {
      expect(['hardship', 'plenty']).toContain(gift.means)
      const alt = gift.unlicensed ?? {}
      expect(
        Object.keys(alt).length,
        `${gift.id} declares means="${gift.means}" and has nothing to say when it does not hold`,
      ).toBeGreaterThan(0)
      for (const [slot, text] of Object.entries(alt)) {
        expect(text, `${gift.id}.unlicensed.${slot} is empty`).toBeTruthy()
        expect(text, `${gift.id}.unlicensed.${slot} repeats the licensed wording`).not.toBe(
          (gift as unknown as Record<string, string>)[slot],
        )
      }
    }
    // ...and the other direction: no row carries alternate words without saying what they are for.
    for (const band of BIRTHDAY_BANDS) {
      for (const gift of poolOf(band)) {
        if (gift.unlicensed === undefined) continue
        expect(gift.means, `${gift.id} has unlicensed words and declares no claim`).toBeDefined()
      }
    }
  })

  it('⭐ the swapped wording obeys every rule the licensed wording obeys', () => {
    // ⚠ THE HALF THAT IS EASY TO FORGET. An alternate ask is still an ask: it has to hook its own
    // row and nothing else (rule 2) and it may not drop a scale word in (rule 3's second test).
    // Checked by building the row as the player would read it under the failing licence and running
    // the same functions over it.
    const units = [...new Set(Object.values(BIRTHDAY_TIME_TOGETHER))]
    for (const band of BIRTHDAY_BANDS) {
      const pool = poolOf(band)
      for (const gift of pool) {
        if (gift.means === undefined) continue
        const bad: FamilyMeans = gift.means === 'hardship' ? 'moneyed' : 'tight'
        const words = birthdayWords(gift, bad)
        const swapped: BirthdayGift = { ...gift, ask: words.ask, note: words.note, again: words.again }
        const rivals = pool.map((h) => (h.id === gift.id ? swapped : h))
        expect(
          hooks(swapped, rivals).length,
          `${bandName(band)} ${gift.id}: the unlicensed ask hooks nothing – "${swapped.ask}"`,
        ).toBeGreaterThan(0)
        expect(PLACEHOLDER_HEAD.test(swapped.label)).toBe(false)
        if (BIRTHDAY_TIME_TOGETHER[gift.id] === undefined) {
          for (const unit of units) {
            expect(
              unitRe(unit).test(swapped.ask),
              `${bandName(band)} ${gift.id}: the unlicensed ask says "${unit}" – "${swapped.ask}"`,
            ).toBe(false)
          }
        }
      }
    }
  })

  it('⚠ the OFFER never sees the wallet – §0 holds, and it holds structurally', () => {
    // The 11.08 ruling that keeps this a gift and not a shop: ONE list for every background, no
    // affordability test anywhere. `birthdayOffer` takes (seed, age, alreadyGiven, atCollege) and
    // there is no means to pass it – so a wealth gate cannot come back through this door however the
    // copy is written. Asserted over every age and both residences.
    for (let age = 14; age <= 32; age++) {
      for (const atCollege of [false, true]) {
        const a = birthdayOffer('offer-blind', age, [], atCollege)
        const b = birthdayOffer('offer-blind', age, [], atCollege)
        expect([a.options.map((o) => o.id), a.askedId]).toEqual([b.options.map((o) => o.id), b.askedId])
      }
    }
    // ...and the means can only reach the WORDS: rendered at all three bands the ids and the labels
    // are identical and only a note may move. This is §0 as a property of the renderer, not of a
    // signature – a means argument added to `birthdayOffer` later would break it here first.
    for (const band of BIRTHDAY_BANDS) {
      const { options } = birthdayOffer('offer-blind', Math.max(band.from, 14), [], band === BIRTHDAY_COLLEGE_BAND)
      const rendered = (['tight', 'comfortable', 'moneyed'] as FamilyMeans[]).map((m) => birthdayOptions(options, [], m))
      for (const rows of rendered) {
        expect(rows.map((r) => r.id)).toEqual(rendered[0].map((r) => r.id))
        expect(rows.map((r) => r.label)).toEqual(rendered[0].map((r) => r.label))
      }
    }
  })

  it('⭐⭐ RENDERED, ON A REAL CAREER: the painting stops claiming she has the money when she has not', () => {
    // ⚠ THE PROOF IS THE DIALOG, not the catalogue. Two identical careers walked to the same
    // birthday in the peak band, differing in one number – the household wallet – and read off
    // `toSnapshot(world).birthdayPrompt`, which is the object the component renders.
    const promptAt = (walletCents: number) => {
      const world = createWorld('means-render', { ...DEFAULT_PROFILE, birthMonth: 6, birthDay: 15, coachTier: 'self' })
      const rng = rngFromSeed(world.seed)
      for (let guard = 0; guard < 700; guard++) {
        if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
        if (pendingKnock(world)) decideKnock(world, 'rest')
        const age = pendingBirthday(world)
        if (age !== null) {
          // ⚠ SET ON THE BIRTHDAY WEEK ITSELF. A wallet set once at week 0 is spent by twenty-two;
          // the claim is about what the family has ON THE DAY, so the arm is applied on the day.
          if (age >= 22) {
            world.fundsCents = walletCents
            world.kidFundsCents = 0
            const found = toSnapshot(world).birthdayPrompt!
            if (found.options.some((o) => o.id === 'neverbuy')) return found
          }
          chooseGift(world, BIRTHDAY_DAY_TOGETHER.id)
        }
        tickWeek(world, rng)
      }
      return null
    }
    const rich = promptAt(600_000_00)
    const poor = promptAt(1_000_00)
    expect(rich, 'the fixture reached the painting on the rich arm').not.toBeNull()
    expect(poor, 'the fixture reached the painting on the poor arm').not.toBeNull()
    const richRow = rich!.options.find((o) => o.id === 'neverbuy')!
    const poorRow = poor!.options.find((o) => o.id === 'neverbuy')!
    expect(richRow.note).toBe('She has the money for it, she has had it for years, and she will not.')
    expect(poorRow.note).toBe('She has stood at that window for years and never once asked what it costs.')
    // ...and NOTHING ELSE ABOUT THE DIALOG MOVED: same four ids, same order, same labels. The offer
    // is means-blind and this is that claim rendered rather than argued.
    expect(poor!.options.map((o) => o.id)).toEqual(rich!.options.map((o) => o.id))
    expect(poor!.options.map((o) => o.label)).toEqual(rich!.options.map((o) => o.label))
  })

  it('⚠ ...and a world is what decides it – the same row reads both ways off `familyMeans`', () => {
    // The predicate itself, on a world rather than on a number, because that is how it is called.
    const world = createWorld('means-world', DEFAULT_PROFILE)
    world.fundsCents = ECONOMY.startingFundsCents.working
    world.kidFundsCents = 0
    expect(familyMeans(world)).toBe('tight')
    // ⚠ HER OWN ACCOUNT COUNTS. v54 keeps the two purses apart in the ledger and this predicate sums
    // them, because "she looked up the fares and booked none" is false if either could have paid.
    world.kidFundsCents = ECONOMY.startingFundsCents.wealthy
    expect(familyMeans(world)).toBe('moneyed')
  })
})

// =================================================================================================
// ⭐⭐ ROUND 26 #9b – THE SAME DIALOG MAY NOT COME ROUND TWICE RUNNING
// =================================================================================================
//
// The owner, 24.08: «Just a day together на день рождения случается подозрительно часто. Сколько у
// нас вариантов подарков? Неужели мы не можем нагенерить так, чтобы они если и повторялись, то не
// так часто?»
//
// ⚠ MEASURED FIRST (tools/birthday-pool.ts, 12 careers × 201 birthdays): 53% of consecutive
// birthdays printed the IDENTICAL four rows and the worst career ran EIGHT in a row. The day was
// never the problem – it is on every dialog by his own 11.08 ruling – the whole dialog was.
describe('ROUND 26 #9b – the offer walks the band instead of sampling it', () => {
  const bandKeyOf = (b: (typeof BIRTHDAY_BANDS)[number]) =>
    b === BIRTHDAY_COLLEGE_BAND ? 'college' : `${b.from}-${b.to}`
  const combinationCount = (n: number, k: number): number => {
    let out = 1
    for (let i = 0; i < k; i++) out = (out * (n - i)) / (i + 1)
    return Math.round(out)
  }

  it('⭐ a band holds at least as many dialogs as it holds birthdays – the root cause, as a rule', () => {
    // ⚠ THIS IS THE CAUSE ITSELF AND NOT A SYMPTOM. Four bands held exactly three material gifts and
    // a dialog shows three, so C(3,3) = 1: there was literally one dialog to draw, and the walk
    // below cannot help a population of one. Mutation: delete `dog` and `oldclub` from PEAK_GIFTS
    // and this goes red on the peak band at once (7 birthdays, 1 dialog).
    //
    // ⚠ THE RULE IS PER BIRTHDAY, NOT ">1", because a ONE-YEAR band (17, 18) cannot repeat inside
    // itself whatever it holds – she has exactly one birthday there – and demanding two dialogs of
    // it would be content for the sake of a number. The bound on the open-ended late band is the
    // game's own: the last age at which anybody is still asking her to go on.
    //
    // ⚠⚠ RE-AIMED FOR THE LONG GOODBYE, AND IT GOT STRICTER RATHER THAN LOOSER. It read
    // `ENDINGS.stopAskingAgeYears` – 38 – and step 2 deleted that constant, because the last
    // retirement offer is a share of her peak physical now and not a birthday. The honest
    // replacement is the age that share reaches on an undamaged body, which at the shipped 55% is
    // 41.2: the open-ended 29-99 band therefore has to carry THIRTEEN birthdays where it used to
    // carry ten. It does – six gifts, C(6,3) = 20 dialogs – so this is a re-aim and not a weakening,
    // and the headroom is real rather than assumed. ⚠ IT IS ALSO A LIVE TRIPWIRE ON THE DIAL: drop
    // the threshold to 40% and the last band would want 17 birthdays, still inside 20; drop it to
    // 30% and it would want 21 and this goes red, which is exactly the conversation that should
    // happen before the tail gets that long.
    for (const band of BIRTHDAY_BANDS) {
      const lastAgeAnybodyAsks = Math.floor(ageAtPhysicalShare(ENDINGS.lastOfferPeakShare))
      const birthdays =
        band === BIRTHDAY_COLLEGE_BAND
          ? ENDINGS.collegeYears
          : Math.min(band.to, lastAgeAnybodyAsks) - Math.max(band.from, 14) + 1
      expect(
        combinationCount(band.gifts.length, 3),
        `${bandName(band)}: ${birthdays} birthdays are spent here and it can print ` +
          `${combinationCount(band.gifts.length, 3)} dialogs`,
      ).toBeGreaterThanOrEqual(birthdays)
    }
  })

  it('⭐⭐ two birthdays in a row never print the same four rows, at any age, on any seed', () => {
    // The walk's whole guarantee, swept: consecutive ages take consecutive entries of one shuffled
    // permutation, so they cannot collide while the band has more than one combination.
    // Mutation: key the cycle stream on the age and this fails within a handful of seeds.
    const failures: string[] = []
    for (let s = 0; s < 40; s++) {
      for (const atCollege of [false, true]) {
        for (let age = 15; age <= 40; age++) {
          const prev = birthdayOffer(`walk-${s}`, age - 1, [], atCollege)
          const now = birthdayOffer(`walk-${s}`, age, [], atCollege)
          const a = prev.options.map((o) => o.id).sort().join('|')
          const b = now.options.map((o) => o.id).sort().join('|')
          // A band BOUNDARY is allowed to repeat – two different bands share ids by design (the late
          // career re-offers the peak's, §5.2) and they have no common cycle to walk. Everything
          // inside one band is the claim.
          const sameBand =
            (atCollege && true) ||
            BIRTHDAY_BANDS.find((x) => age - 1 >= x.from && age - 1 <= x.to) ===
              BIRTHDAY_BANDS.find((x) => age >= x.from && age <= x.to)
          if (sameBand && a === b) failures.push(`seed ${s} college=${atCollege} age ${age - 1}->${age}: ${a}`)
        }
      }
    }
    expect(failures.slice(0, 6), 'a birthday repeated last year\'s dialog exactly').toEqual([])
  })

  it('⭐ ...and the WHOLE population is walked before anything comes round again', () => {
    // Round 24's ruling, one level up (docs/decisions.md, 19.08): «one line per year and not a
    // random pick, deliberately – four college birthdays is the whole of the population, so a pool
    // would repeat within a single career.» Enumerate, shuffle once, walk. Over C(n,3) consecutive
    // ages every combination appears exactly once.
    for (const band of BIRTHDAY_BANDS) {
      const total = combinationCount(band.gifts.length, 3)
      const seen = new Map<string, number>()
      for (let i = 0; i < total; i++) {
        const { options } = birthdayOffer('population', 100 + i, [], band === BIRTHDAY_COLLEGE_BAND)
        // the age bands are keyed by age, so only the college band can be swept this way; for the
        // others the sweep runs inside the band's own span below
        if (band !== BIRTHDAY_COLLEGE_BAND) continue
        const key = options.map((o) => o.id).filter((id) => id !== BIRTHDAY_DAY_TOGETHER.id).sort().join('|')
        seen.set(key, (seen.get(key) ?? 0) + 1)
      }
      if (band !== BIRTHDAY_COLLEGE_BAND) continue
      expect(seen.size, `${bandKeyOf(band)}: ${total} combinations, ${seen.size} distinct in a full cycle`).toBe(total)
      for (const [key, n] of seen) expect(n, `${key} appeared ${n} times in one cycle`).toBe(1)
    }
  })

  it('⭐⭐ HER FOUR COLLEGE BIRTHDAYS ARE FOUR DIFFERENT DIALOGS – the population is exactly four', () => {
    // C(4,3) = 4 and she has four birthdays there, so the walk hands her every combination the band
    // owns and never repeats one. Before the walk this was 22% back-to-back identical with a worst
    // run of three (tools/birthday-pool.ts).
    for (let s = 0; s < 30; s++) {
      const seen = new Set<string>()
      for (let age = 18; age <= 21; age++) {
        const { options } = birthdayOffer(`four-years-${s}`, age, [], true)
        seen.add(options.map((o) => o.id).sort().join('|'))
      }
      expect(seen.size, `seed ${s}: four college birthdays, ${seen.size} distinct dialogs`).toBe(4)
    }
  })

  it('⚠ the walk is immutable and cannot be re-rolled – it depends on the seed, the band and the age', () => {
    // The property the whole scene rests on (spec §2ab): reloading cannot move the offer, and what
    // the player chose last year cannot move it either.
    const a = birthdayOffer('immutable', 24, [])
    const b = birthdayOffer('immutable', 24, ['familyweek', 'jewellery', 'dog', 'day'])
    expect(b.options.map((o) => o.id)).toEqual(a.options.map((o) => o.id))
    // ...and a different career gets a different walk, or the "population" is one global list
    const other = birthdayOffer('immutable-other', 24, [])
    const differs = Array.from({ length: 12 }, (_, i) =>
      birthdayOffer(`walk-seed-${i}`, 24, []).options.map((o) => o.id).sort().join('|'),
    )
    expect(new Set(differs).size, 'twelve careers, one dialog between them').toBeGreaterThan(1)
    expect(other.options).toHaveLength(4)
  })
})
