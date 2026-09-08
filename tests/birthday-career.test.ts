// =================================================================================================
// ⭐⭐⭐ ROUND 39 #9 – THE CAREER-SCOPE RULE, AND #9c – ONE AGE, ONE BIRTHDAY
// =================================================================================================
//
// The owner, 08.09, REOPENING round 26 #9:
//
//   «Опять just one day. Я просил сделать много вариантов подарков для разных возрастных групп. Мне
//    кажется, что вполне допустимо чтобы что-то повторялось, но не больше 2-3 раз за всю карьеру и с
//    разницей не меньше 5 лет.»
//
// Measured on his Ines save: `day` asked-and-given at ages 22, 24, 25 and 27 – four times, gaps of
// 2, 1 and 2 years. Round 26 #9b controlled CONSECUTIVE dialogs and round 27 #7 consecutive
// day-asks; both are windows of one and neither can see a career count or a gap, which is why both
// stayed green while he met this. His sentence is the missing rule, with numbers, and this file
// pins it as built: `GIFT_CAREER_CAP` appearances per career at most, never twice inside
// `GIFT_REPEAT_GAP_WEEKS`, least-used preferred, and a PINNED relaxation order (gap first, then the
// cap, never a crash) for when a thin card leaves nothing legal to want.
//
// #9c IS THE OTHER FIND IN THE SAME LOG: two birthday rows one week apart – week 569 `day` and week
// 570 `dog`, BOTH age 24. Diagnosed at the bottom of this file, where the pin is.
import { describe, expect, it } from 'vitest'
import {
  birthdayTurning,
  chooseGift,
  createWorld,
  decideKnock,
  pendingBirthday,
  pendingKnock,
  tickWeek,
} from '../src/engine/world'
import { answerFork } from '../src/engine/world/endings'
import {
  BIRTHDAY_DAY_TOGETHER,
  GIFT_CAREER_CAP,
  GIFT_REPEAT_GAP_WEEKS,
  birthdayOffer,
  birthdayOfferFor,
} from '../src/engine/world/birthday'
import type { BirthdayGiven } from '../src/engine/world/birthday'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

const DAY = BIRTHDAY_DAY_TOGETHER.id

/** One record row, granted by default – the owner's own log shape (all 13 of his rows grant). */
const row = (week: number, asked: string, given: string | null = asked): BirthdayGiven => ({ week, asked, given })

/** The engine's own derivation, mirrored: `alreadyGiven` is the givens and `lastAsked` the last
 *  row's ask – exactly what `birthdayOfferFor` reads off `world.birthdays`. One helper so the
 *  constructed cases below cannot pass a record and a spent-set that disagree. */
function offerAt(seed: string, age: number, record: BirthdayGiven[], week: number) {
  const given = record.map((r) => r.given).filter((g): g is string => g !== null)
  const lastAsked = record.length ? record[record.length - 1].asked : null
  return birthdayOffer(seed, age, given, false, null, lastAsked, record, week)
}

/** The three material ids on this (seed, age)'s own card, in on-screen order. */
function materialOf(seed: string, age: number): string[] {
  return offerAt(seed, age, [], 900).options.map((o) => o.id).filter((id) => id !== DAY)
}

describe('ROUND 39 #9 – at most three per career, never twice inside five years', () => {
  it('the two constants ARE his sentence: 3 per career, 260 weeks apart', () => {
    // «не больше 2-3 раз за всю карьеру» built at the top of his range, «не меньше 5 лет» in the
    // engine's own unit. Anyone retuning either has to come here and re-argue his words.
    expect(GIFT_CAREER_CAP).toBe(3)
    expect(GIFT_REPEAT_GAP_WEEKS).toBe(5 * 52)
  })

  it('⭐ THE CAP: a gift with three appearances on the record is never the ask again', () => {
    for (let s = 0; s < 40; s++) {
      const seed = `cap-${s}`
      const m = materialOf(seed, 28)[0]
      const record = [row(0, m), row(300, m), row(600, m)]
      const { askedId, eased } = offerAt(seed, 28, record, 900)
      expect(askedId, `seed ${s}: a fourth ${m}`).not.toBe(m)
      expect(eased, 'nothing needed relaxing – the rest of the card is fresh').toBeNull()
    }
  })

  it('⭐ THE GAP, IN HIS OWN SHAPE: the day asked at 22 cannot be asked again at 24', () => {
    // His save: day at week 466 (age 22), then again at week 569/570 (age 24) – a 104-week gap
    // against his «не меньше 5 лет». With the record in evidence the ask must land elsewhere.
    for (let s = 0; s < 40; s++) {
      const { askedId, eased } = offerAt(`ines-gap-${s}`, 24, [row(466, DAY)], 570)
      expect(askedId, `seed ${s}: the day inside the five-year gap`).not.toBe(DAY)
      expect(eased).toBeNull()
    }
  })

  it('⭐ ...and 260 weeks later the day is askable again – a gap, not an exile', () => {
    // All three material rows appeared recently (blocked by the gap), the day's one appearance is
    // five years back: the strict pool is exactly the day, on every seed.
    for (let s = 0; s < 40; s++) {
      const seed = `day-return-${s}`
      const [m1, m2, m3] = materialOf(seed, 28)
      const record = [row(300, DAY), row(820, m1), row(850, m2), row(880, m3)]
      const { askedId, eased } = offerAt(seed, 28, record, 900)
      expect(askedId, `seed ${s}`).toBe(DAY)
      expect(eased).toBeNull()
    }
  })

  it('⭐ LEAST-USED WINS: the one fresh gift on the card is the ask, deterministically', () => {
    for (let s = 0; s < 40; s++) {
      const seed = `least-${s}`
      const [m1, m2, m3] = materialOf(seed, 28)
      // m1 twice, m2 once, the day once – every gap legal – and m3 never. Min-count is m3 alone.
      const record = [row(0, m1), row(300, m1), row(560, m2), row(600, DAY)]
      const { askedId, eased } = offerAt(seed, 28, record, 900)
      expect(askedId, `seed ${s}`).toBe(m3)
      expect(eased).toBeNull()
    }
  })

  it('⭐ A THIRD APPEARANCE ONLY WHEN NOTHING ELSE QUALIFIES: count two loses to count one', () => {
    for (let s = 0; s < 40; s++) {
      const seed = `third-${s}`
      const [m1, m2, m3] = materialOf(seed, 28)
      const record = [row(0, m1), row(300, m1), row(500, m2), row(550, m3), row(600, DAY)]
      const { askedId, eased } = offerAt(seed, 28, record, 900)
      expect(askedId, `seed ${s}: ${m1} went to its third appearance past fresher wants`).not.toBe(m1)
      expect(eased).toBeNull()
    }
  })

  it('⭐ GIVING THE DAY IS FREE: only a day-ASK counts toward the day\'s budget', () => {
    // The 11.08 ruling keeps the day on every card, and a parent who freely chooses it every year
    // is exercising a right, not writing the sentence she says. Three day-GIVES, zero day-asks:
    // the day is still the least-used candidate and the ask lands on it.
    for (let s = 0; s < 40; s++) {
      const seed = `day-free-${s}`
      const [m1, m2, m3] = materialOf(seed, 28)
      const record = [row(100, m1, DAY), row(400, m2, DAY), row(640, m3, DAY)]
      const { askedId, eased } = offerAt(seed, 28, record, 900)
      expect(askedId, `seed ${s}`).toBe(DAY)
      expect(eased).toBeNull()
    }
  })

  // ===============================================================================================
  // ⭐⭐⭐ THE PINNED RELAXATION ORDER – gap first, then the cap, never a crash
  // ===============================================================================================
  it('⭐⭐ AN EMPTY POOL RELAXES THE GAP FIRST – reported as eased: "gap"', () => {
    // Every candidate has appeared, all of it recently: the strict pool is empty by the GAP alone.
    // Relaxing the gap re-admits everything under the cap; the least-used tiering then prefers the
    // one want she does not own – the day.
    for (let s = 0; s < 40; s++) {
      const seed = `ease-gap-${s}`
      const [m1, m2, m3] = materialOf(seed, 28)
      const record = [row(820, DAY), row(850, m1), row(860, m2), row(870, m3)]
      const { askedId, eased } = offerAt(seed, 28, record, 900)
      expect(eased, `seed ${s}`).toBe('gap')
      expect(askedId).toBe(DAY)
    }
  })

  it('⭐⭐ ...AND THE CAP HOLDS THROUGH A GAP RELAXATION – the order is gap, THEN cap', () => {
    // Three material rows at the cap, the day one appearance and recent. Gap-relaxed, the day is
    // legal and the capped three still are not – so an eased ask that respects the cap proves the
    // ladder's order. If the cap relaxed first, a capped gift could win here. ⚠ The record ENDS on
    // a material ask, so the round-27 cooldown is not what keeps or removes the day.
    for (let s = 0; s < 40; s++) {
      const seed = `ease-order-${s}`
      const [m1, m2, m3] = materialOf(seed, 28)
      const record = [
        row(0, m1), row(270, m1), row(540, m1),
        row(10, m2), row(280, m2), row(550, m2),
        row(20, m3), row(290, m3), row(560, m3),
        row(860, DAY), row(880, m1),
      ]
      const { askedId, eased } = offerAt(seed, 28, record, 900)
      expect(eased, `seed ${s}`).toBe('gap')
      expect(askedId, 'the cap held while the gap eased').toBe(DAY)
    }
  })

  it('⭐⭐ THE CAP EASES LAST, AND NOTHING EVER CRASHES – eased: "cap", four rows, a real ask', () => {
    for (let s = 0; s < 40; s++) {
      const seed = `ease-cap-${s}`
      const [m1, m2, m3] = materialOf(seed, 28)
      const record = [
        row(0, m1), row(270, m1), row(540, m1),
        row(10, m2), row(280, m2), row(550, m2),
        row(20, m3), row(290, m3), row(560, m3),
        row(30, DAY), row(300, DAY), row(600, DAY),
        // ...and the last ask on record is a material, so the round-27 cooldown is not what decides.
        row(870, m1),
      ]
      const { options, askedId, eased } = offerAt(seed, 28, record, 900)
      expect(eased, `seed ${s}`).toBe('cap')
      expect(options).toHaveLength(4)
      expect(options.map((o) => o.id)).toContain(askedId)
    }
  })

  it('⭐ THE ROUND-27 COOLDOWN OUTRANKS EVERY RELAXATION: the day is never voiced twice running', () => {
    // Even with the whole record at the cap, a day asked LAST birthday stays unvoiced – the
    // cooldown is applied inside every rung of the ladder, so «И снова она просит...» cannot come
    // back through a relaxation.
    for (let s = 0; s < 40; s++) {
      const seed = `ease-cooldown-${s}`
      const [m1, m2, m3] = materialOf(seed, 28)
      const record = [
        row(0, m1), row(270, m1), row(540, m1),
        row(10, m2), row(280, m2), row(550, m2),
        row(20, m3), row(290, m3), row(560, m3),
        row(30, DAY), row(300, DAY), row(870, DAY),
      ]
      const { options, askedId, eased } = offerAt(seed, 28, record, 900)
      expect(eased, `seed ${s}`).toBe('cap')
      expect(askedId, 'the day, twice running, through the relaxations').not.toBe(DAY)
      expect(options.map((o) => o.id)).toContain(askedId)
    }
  })

  // ===============================================================================================
  // ⭐⭐⭐ THE EVIDENCE – walked careers, asserted the way the owner counted his save
  // ===============================================================================================
  it('⭐⭐⭐ WALKED CAREERS: no gift beyond three, no repeat inside 260 weeks, or the relaxation says so', () => {
    // A granting parent (asked === given every year), which is his own log: on the Ines save all 13
    // birthdays grant the ask, so the asked and given streams coincide and the rule's whole budget
    // is exercised. Two full careers, every birthday replayed through the engine's own seam, with
    // the `eased` flag captured at the moment of the ask – a violation is legal exactly where the
    // pinned relaxation fired, and nowhere else.
    for (const [seedIndex, birthMonth] of [
      ['walk-r39-a', 6],
      ['walk-r39-b', 3],
    ] as Array<[string, number]>) {
      const world = createWorld(seedIndex, { ...DEFAULT_PROFILE, birthMonth, birthDay: 15, coachTier: 'self' })
      const rng = rngFromSeed(world.seed)
      const asks: Array<{ week: number; id: string; eased: 'gap' | 'cap' | null }> = []
      // ⚠ 1000 weeks, NOT 700, and the number is anti-vacuity: repeats become arithmetically
      // possible only once the late band's fresh gifts run out (~age 32 – the peak's seven were
      // asked at 22-28 and the late band adds three of its own), so a shorter walk would assert
      // "no illegal repeat" over a career that never repeated anything.
      for (let i = 0; i < 1000; i++) {
        if (pendingKnock(world)) decideKnock(world, 'rest')
        const age = pendingBirthday(world)
        if (age !== null) {
          const { askedId, eased } = birthdayOfferFor(world, age)
          asks.push({ week: world.week, id: askedId, eased })
          chooseGift(world, askedId)
        }
        if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
        if (world.ending) break
        tickWeek(world, rng)
      }
      expect(asks.length, `${seedIndex}: the walk has to reach a real run of birthdays`).toBeGreaterThan(10)

      const byGift = new Map<string, Array<{ week: number; eased: 'gap' | 'cap' | null }>>()
      for (const a of asks) {
        const list = byGift.get(a.id) ?? []
        list.push({ week: a.week, eased: a.eased })
        byGift.set(a.id, list)
      }
      for (const [id, rows] of byGift) {
        for (let i = 0; i < rows.length; i++) {
          if (i >= GIFT_CAREER_CAP) {
            expect(rows[i].eased, `${seedIndex}: appearance ${i + 1} of ${id} without a reported relaxation`)
              .toBe('cap')
          }
          if (i > 0) {
            const gap = rows[i].week - rows[i - 1].week
            if (gap < GIFT_REPEAT_GAP_WEEKS) {
              expect(rows[i].eased, `${seedIndex}: ${id} repeated after ${gap} weeks with nothing reported`)
                .not.toBeNull()
            }
          }
        }
      }
      // ⭐ AND HIS HEADLINE NUMBER DIRECTLY: the day. Four asks with 1-2 year gaps is what he read;
      // a walked career now holds at most GIFT_CAREER_CAP day-asks (relaxations included – the day
      // is the one gift the cooldown keeps from monopolising even a starved card).
      const dayAsks = byGift.get(DAY) ?? []
      expect(dayAsks.length, `${seedIndex}: the day was asked ${dayAsks.length} times`)
        .toBeLessThanOrEqual(GIFT_CAREER_CAP)
      // ⚠ ANTI-VACUITY: the walk really does reach the age where wants repeat, or every gap
      // assertion above compared nothing with nothing.
      expect(
        [...byGift.values()].some((rows) => rows.length >= 2),
        `${seedIndex}: no gift was ever asked twice – the walk ended before repeats begin`,
      ).toBe(true)
    }
  })
})

// =================================================================================================
// ⭐⭐⭐ ROUND 39 #9c – TWO BIRTHDAY DIALOGS, ONE AGE, ADJACENT WEEKS
// =================================================================================================
//
// THE DIAGNOSIS, off his save (born 21 December, seed ines-xgv7). Round 34 #3 moved the marked
// birthday week from "the week CONTAINING her date" to "the first week whose Monday has reached it"
// – one week later for every date that is not a Monday. His career was standing exactly in that
// seam when the build updated: week 569 (Dec 16-22, 2041 – contains Sunday the 21st) was asked and
// answered under the OLD rule, and the round-34 build then found week 570 (Monday Dec 23) fresh,
// because `pendingBirthday`'s dedupe compared WEEKS: `b.week === world.week` cannot recognise last
// week's row as this birthday's. Every row on his save before the deploy sits on the old marked
// week (569 = old, for a 21 December date) and every row after sits on the new one (570, 622, 674,
// 727, 779, 831) – the two rules interleave at exactly one birthday, and that birthday is the
// doubled age 24.
//
// THE FIX: an AGE is answered once, not a week – she turns 24 exactly once, whatever any future
// rule does to the marked week. The week half of the guard survives for poked saves.
describe('ROUND 39 #9c – one age can only be asked once', () => {
  /** His profile's shape: born 21 December – the date that put weeks 569/570 either side of the
   *  round-34 boundary. */
  const inesWorld = () => {
    const world = createWorld('ines-9c', { ...DEFAULT_PROFILE, birthMonth: 12, birthDay: 21, coachTier: 'self' })
    world.week = 570
    return world
  }

  it('the boundary is real: under the current rule week 570 marks the birthday week 569 used to', () => {
    // Anti-rot for the reproduction below: if the marked week ever moves again, this names it.
    expect(birthdayTurning(569, 12, 21), 'the OLD marked week no longer fires').toBeNull()
    expect(birthdayTurning(570, 12, 21), 'the week after it is the marked one now').toBe(24)
  })

  it('⭐⭐⭐ THE REPRODUCTION: a row the old build wrote at week 569 blocks the week-570 dialog', () => {
    // Without the stale row the dialog fires – the anti-vacuity half.
    const clean = inesWorld()
    expect(pendingBirthday(clean), 'a clean career is asked at the marked week').toBe(24)

    // With his row exactly as the save holds it – `day`, week 569, age 24 – the age is spent and
    // week 570 must NOT ask again. Before the fix this returned 24 and `dog` was recorded.
    const straddled = inesWorld()
    straddled.birthdays.push({ week: 569, age: 24, asked: 'day', given: 'day' })
    expect(pendingBirthday(straddled), 'the second dialog of age 24').toBeNull()
    expect(() => chooseGift(straddled, 'day'), 'and nothing can be recorded for it').toThrow(/no birthday/i)
  })

  it('⭐ the whole straddle is covered: no week around the boundary re-asks a spent age', () => {
    const world = inesWorld()
    world.birthdays.push({ week: 569, age: 24, asked: 'day', given: 'day' })
    for (let w = 560; w <= 580; w++) {
      world.week = w
      expect(pendingBirthday(world), `week ${w} re-asked age 24`).toBeNull()
    }
  })

  it('⭐ ...and the NEXT age still fires – the dedupe is per age, not per career', () => {
    const world = inesWorld()
    world.birthdays.push({ week: 569, age: 24, asked: 'day', given: 'day' })
    world.week = 622 // the marked week of her 25th, verified against the save's own row
    expect(pendingBirthday(world)).toBe(25)
  })

  it('⚠ the week half of the guard survives for a poked save', () => {
    // A row carrying THIS week under a wrong age must still block re-asking this week – the old
    // guard's job, kept beside the new one.
    const world = inesWorld()
    world.birthdays.push({ week: 570, age: 99, asked: 'day', given: 'day' })
    expect(pendingBirthday(world)).toBeNull()
  })
})
