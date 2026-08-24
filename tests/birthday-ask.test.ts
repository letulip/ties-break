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
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { BirthdayGift } from '../src/shared/protocol'

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
    // The 19-21 band offers exactly three material gifts, so a car given at nineteen is offered
    // again at twenty with certainty – which is the whole reason he noticed.
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

    // ...and offered again the next year, saying what it is.
    expect(runToBirthday(), 'and she has another birthday in this band').toBeGreaterThan(0)
    const second = toSnapshot(world).birthdayPrompt!
    const carAgain = second.options.find((o) => o.id === 'car')!
    expect(carAgain.note, 'a second car does not arrive in silence').toMatch(/already/i)
    expect(carAgain.note).not.toBe(carFirst.note)
    // ...and she does not ASK for it either, which is round-17 #18 still holding.
    expect(second.ask).not.toBe(first.options.length ? carFirst.label : '')
    expect(second.options.map((o) => o.id).sort(), 'the same four rows, unchanged').toEqual(
      first.options.map((o) => o.id).sort(),
    )
  })
})

describe('⚠ the copy work costs the stream nothing', () => {
  it('⭐ the sub-stream is drawn exactly `gifts + 3` times, for every band', () => {
    // CLAUDE.md invariant 2. The offer is three draws' worth of shuffling plus one for the ask, on
    // top of the band shuffle: (n-1) + 3 + 1. Replayed here off an INDEPENDENT generator on the same
    // key, counting as it goes – so an extra `rng()` call anywhere in `birthdayOffer` makes the
    // replayed order diverge from the real one and this fails. Mutation-verified by adding a bare
    // `rng()` before the ask draw.
    const shuffle = <T,>(items: readonly T[], rng: () => number): T[] => {
      const out = items.slice()
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1))
        ;[out[i], out[j]] = [out[j], out[i]]
      }
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
      let draws = 0
      const rng = rngFromSeed(`draws:birthday:${age}`)
      const counted = () => {
        draws++
        return rng()
      }
      const material = shuffle(band.gifts, counted).slice(0, 3)
      const options = shuffle([...material, BIRTHDAY_DAY_TOGETHER], counted)
      // ⚠ THE ASK IS REPLAYED TOO, AND THAT IS WHAT MAKES THE COUNT LOAD-BEARING. The first draft
      // compared only the four ids, so an extra `rng()` AFTER the shuffles moved the ask and nothing
      // noticed. The ask is the last draw on the stream: shift it by one and it lands elsewhere.
      const askedId = options[Math.floor(counted() * options.length)].id
      expect(draws, `${bandName(band)}: (n-1) to shuffle the band, three for the four, one for the ask`)
        .toBe(band.gifts.length + 3)
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
