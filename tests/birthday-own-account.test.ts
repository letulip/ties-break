// =================================================================================================
// ⭐ ROUND 46 #5 – HER OWN BANK ACCOUNT IS ASKED FOR AT SIXTEEN TO EIGHTEEN, AND NEVER AFTER
// =================================================================================================
//
// The owner, round 46: «На 29й день рождения она просила свой счёт в банке - это смешно. Давай
// наверное сделаем, что она будет где-то в адекватном возрасте и обстоятельствах его спрашивать?
// Может жёстко к 18 привязать, например. Или, если можно раньше, то в коридоре 16-18»
//
// THE CAUSE, which is what these tests are written against: `bankcard` is a row of the 18 band and of
// no other, so it can reach a card at any OTHER age only by being lent. Round 42 #26's refill lends:
// a given durable leaves the card and `materialFor` tops the shortfall up from the neighbour bands,
// nearest first. A parent who grants every ask retires the late bands' rows one by one and, from the
// middle twenties, the refill reaches back past the independence band into the 18 band for a row she
// was never given – and a row with no appearances yet is exactly what the career-scope ladder prefers
// to ask for. Round 45 #9 found the same hand taking the deposit; the account was the next row in reach.
//
// THE GATE, in one line each: the row is never lent; it is a card's own row at eighteen, where it is
// ALSO the ask (the hard anchor, whatever the balance); at sixteen and seventeen it is swapped on to
// the card and made the ask the first time money has reached her own account; and she is asked once –
// a row she was already asked about or given is not asked again.
//
// ⚠ NOTHING HERE IS A DRAW. The swap replaces one row BEFORE the shuffle, so `seed:birthday:<age>` is
// still drawn four times and every other row keeps its place; the one test below that proves it is
// the «same permutation» one. The frozen MAIN capture is pinned in tests/condition.test.ts.
//
// ⚠ AND THE WORDING IS UNTOUCHED: the row is the SAME OBJECT the 18 band holds (asserted by identity in
// (d)), so no string on it exists twice and none of them can have moved.
//
// MUTATION-VERIFIED, and each arm names what was changed: dropping the 18 anchor reddens (b); letting
// the refill lend the row again reddens (c) – and (c) is the arm that showed the original defect when
// it was first run against the code as shipped.
//
// ⭐⭐ ROUND 46 · R6 (06.10) extends this file at the foot: the 18 band lends NOTHING now, not only the account's
// row – the owner's «наверное да» over the watch that leaked through the same door. Arms (e) to (i).
import { describe, expect, it } from 'vitest'
import {
  BIRTHDAY_BANDS,
  BIRTHDAY_DAY_TOGETHER,
  birthdayOffer,
  birthdayOptions,
  createWorld,
} from '../src/engine/world'
import { birthdayOfferFor, type BirthdayGiven } from '../src/engine/world/birthday'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

const ACCOUNT = 'bankcard'
const SEEDS = Array.from({ length: 60 }, (_, i) => `own-account-${i}`)

type Gift = (typeof BIRTHDAY_BANDS)[number]['gifts'][number]

interface Step {
  age: number
  ids: string[]
  askedId: string
  /** the offer's own row OBJECTS, kept for the R6 arms (they count by identity, never by id) */
  rows: Gift[]
}

/** A career walked through the pure offer, one birthday at a time, the way `chooseGift` writes the
 *  record. `every-ask` is the parent who grants whatever she asks for – the one whose card the refill
 *  has to keep topping up, so the only walk that can show the defect. `the-day` never grants a thing. */
function walk(
  seed: string,
  fromAge: number,
  toAge: number,
  earningAt: (age: number) => boolean,
  grant: 'every-ask' | 'the-day' = 'every-ask',
): Step[] {
  const given: string[] = []
  const record: BirthdayGiven[] = []
  const steps: Step[] = []
  for (let age = fromAge; age <= toAge; age++) {
    const week = age * 52
    const lastAsked = record.length ? record[record.length - 1].asked : null
    const offer = birthdayOffer(seed, age, given.slice(), false, null, lastAsked, record.slice(), week, null, [], earningAt(age))
    steps.push({ age, ids: offer.options.map((g) => g.id), askedId: offer.askedId, rows: offer.options.slice() })
    const gave = grant === 'every-ask' ? offer.askedId : BIRTHDAY_DAY_TOGETHER.id
    given.push(gave)
    record.push({ week, asked: offer.askedId, given: gave })
  }
  return steps
}

const stepAt = (steps: Step[], age: number): Step => steps.find((s) => s.age === age)!
const eighteenBand = BIRTHDAY_BANDS.find((b) => b.from === 18 && b.to === 18)!
const accountRow = eighteenBand.gifts.find((g) => g.id === ACCOUNT)!

describe('round 46 #5 – her own bank account is a sixteen-to-eighteen ask', () => {
  it('the row is the 18 band\'s own and the catalogue still has it (the premise every arm below rests on)', () => {
    expect(accountRow, 'the 18 band holds the account row').toBeDefined()
    const holders = BIRTHDAY_BANDS.filter((b) => b.gifts.some((g) => g.id === ACCOUNT))
    expect(holders.map((b) => `${b.from}-${b.to}`), 'and no other band lists it').toEqual(['18-18'])
  })

  it('(a) money reaches her at sixteen: she asks at sixteen and not before, whatever the balance said earlier', () => {
    for (const seed of SEEDS) {
      // earning at EVERY age: it is the age floor and not the money that must keep fourteen and fifteen clear.
      const steps = walk(seed, 14, 18, () => true)
      for (const age of [14, 15]) {
        expect(stepAt(steps, age).ids, `${seed} at ${age}: the account is not on a card younger than sixteen`).not.toContain(ACCOUNT)
        expect(stepAt(steps, age).askedId, `${seed} at ${age}`).not.toBe(ACCOUNT)
      }
      const sixteen = stepAt(steps, 16)
      expect(sixteen.askedId, `${seed}: the ask at sixteen`).toBe(ACCOUNT)
      expect(sixteen.ids, `${seed}: it is one of the four rows on screen`).toContain(ACCOUNT)
      expect(new Set(sixteen.ids).size, `${seed}: four different rows`).toBe(4)
      expect(sixteen.ids, `${seed}: the day stays on the card`).toContain(BIRTHDAY_DAY_TOGETHER.id)
      // She was given it at sixteen (the parent grants every ask), so it is hers and it never comes back.
      for (const age of [17, 18]) {
        expect(stepAt(steps, age).ids, `${seed} at ${age}: already open, so off the card`).not.toContain(ACCOUNT)
        expect(stepAt(steps, age).askedId, `${seed} at ${age}`).not.toBe(ACCOUNT)
      }
    }
  })

  it('(a) and when the money only reaches her at seventeen, the ask waits for seventeen', () => {
    for (const seed of SEEDS) {
      const steps = walk(seed, 14, 18, (age) => age >= 17)
      expect(stepAt(steps, 16).ids, `${seed} at 16: no money yet, no account on the card`).not.toContain(ACCOUNT)
      expect(stepAt(steps, 16).askedId, `${seed} at 16`).not.toBe(ACCOUNT)
      expect(stepAt(steps, 17).askedId, `${seed} at 17`).toBe(ACCOUNT)
      expect(stepAt(steps, 17).ids, `${seed} at 17`).toContain(ACCOUNT)
      expect(stepAt(steps, 18).askedId, `${seed} at 18: asked once already`).not.toBe(ACCOUNT)
    }
  })

  it('(b) money never reaches her: the eighteenth asks for the account anyway (the hard anchor)', () => {
    for (const seed of SEEDS) {
      const steps = walk(seed, 14, 18, () => false)
      for (const age of [14, 15, 16, 17]) {
        expect(stepAt(steps, age).ids, `${seed} at ${age}: no money, not yet eighteen`).not.toContain(ACCOUNT)
        expect(stepAt(steps, age).askedId, `${seed} at ${age}`).not.toBe(ACCOUNT)
      }
      expect(stepAt(steps, 18).askedId, `${seed}: the eighteenth asks for it`).toBe(ACCOUNT)
      expect(stepAt(steps, 18).ids, `${seed}: and it is on the card`).toContain(ACCOUNT)
    }
  })

  it('(c) a career already past eighteen without the account never sees the ask, walked from nineteen to forty-five', () => {
    const offenders: string[] = []
    for (const seed of SEEDS) {
      for (const grant of ['every-ask', 'the-day'] as const) {
        for (const earning of [false, true]) {
          for (const s of walk(seed, 19, 45, () => earning, grant)) {
            if (s.ids.includes(ACCOUNT) || s.askedId === ACCOUNT) {
              offenders.push(`${seed} ${grant} earning=${earning} age ${s.age}${s.askedId === ACCOUNT ? ' ASKED' : ' on card'}`)
            }
          }
        }
      }
    }
    // The first line of a failure names the first offender; the length says how many careers it reached.
    expect(offenders.slice(0, 6), `${offenders.length} birthdays carried the account after eighteen`).toEqual([])
  })

  it('(c) and a career walked from fourteen asks for it at most ONCE, and never after eighteen', () => {
    for (const seed of SEEDS) {
      for (const earning of [false, true]) {
        const steps = walk(seed, 14, 40, () => earning)
        const asks = steps.filter((s) => s.askedId === ACCOUNT).map((s) => s.age)
        expect(asks, `${seed} earning=${earning}`).toHaveLength(1)
        expect(asks[0], `${seed}: inside the corridor`).toBeGreaterThanOrEqual(16)
        expect(asks[0], `${seed}: inside the corridor`).toBeLessThanOrEqual(18)
        expect(steps.filter((s) => s.age > 18 && s.ids.includes(ACCOUNT)), `${seed}: never on a card after eighteen`).toEqual([])
      }
    }
  })

  it('(d) the row is the 18 band\'s own object, and its «already open» line still reads where it is now asked from', () => {
    const sixteen = birthdayOffer('own-account-0', 16, [], false, null, null, [], 16 * 52, null, [], true)
    const shown = sixteen.options.find((g) => g.id === ACCOUNT)!
    // Identity, not equality: a copy could have drifted, the same object cannot – none of its strings is typed twice.
    expect(shown).toBe(accountRow)
    const fresh = birthdayOptions(sixteen.options, []).find((o) => o.id === ACCOUNT)!
    expect(fresh.label).toBe(accountRow.label)
    expect(fresh.note, 'not held yet: the row\'s own note').toBe(accountRow.note)
    const held = birthdayOptions(sixteen.options, [ACCOUNT]).find((o) => o.id === ACCOUNT)!
    expect(held.note, 'already open: the row\'s own again line').toBe(accountRow.again)
  })

  it('the swap adds no draw: with and without money the card is the same permutation, one row apart', () => {
    for (const seed of SEEDS) {
      for (const age of [16, 17]) {
        const without = birthdayOffer(seed, age, [], false, null, null, [], age * 52, null, [], false).options.map((g) => g.id)
        const withMoney = birthdayOffer(seed, age, [], false, null, null, [], age * 52, null, [], true).options.map((g) => g.id)
        const moved = withMoney.map((id, i) => (id === without[i] ? null : i)).filter((i): i is number => i !== null)
        expect(moved, `${seed} at ${age}: exactly one slot differs`).toHaveLength(1)
        expect(withMoney[moved[0]], `${seed} at ${age}: and it is the account`).toBe(ACCOUNT)
        expect(without[moved[0]], `${seed} at ${age}: which took the place of a material row, never the day`).not.toBe(BIRTHDAY_DAY_TOGETHER.id)
      }
    }
  })

  it('college outranks the anchor: a first college birthday at eighteen still asks for the bicycle', () => {
    for (const seed of SEEDS.slice(0, 20)) {
      const offer = birthdayOffer(seed, 18, [], true, 0, null, [], 18 * 52, null, [], true)
      expect(offer.options.map((g) => g.id), `${seed}`).not.toContain(ACCOUNT)
      expect(offer.askedId, `${seed}`).toBe('campusbike')
    }
  })

  it('the engine seam reads her own account: money in it at sixteen puts the ask on the card, none does not', () => {
    const world = createWorld('own-account-wired', DEFAULT_PROFILE)
    world.kidFundsCents = 0
    expect(birthdayOfferFor(world, 16).options.map((g) => g.id), 'no money at sixteen').not.toContain(ACCOUNT)
    world.kidFundsCents = 250_000
    expect(birthdayOfferFor(world, 16).askedId, 'money at sixteen').toBe(ACCOUNT)
    expect(birthdayOfferFor(world, 17).askedId, 'money at seventeen').toBe(ACCOUNT)
    expect(birthdayOfferFor(world, 15).options.map((g) => g.id), 'money at fifteen is not a reason').not.toContain(ACCOUNT)
    world.kidFundsCents = 0
    expect(birthdayOfferFor(world, 18).askedId, 'the anchor needs no balance').toBe(ACCOUNT)
    expect(birthdayOfferFor(world, 19).options.map((g) => g.id), 'and nineteen is past it').not.toContain(ACCOUNT)
  })
})

// =================================================================================================
// ⭐⭐ ROUND 46 · R6 (06.10) – THE 18 BAND LENDS NOTHING AT ALL: THE WATCH JOINS THE ACCOUNT
// =================================================================================================
//
// B8 closed ONE row's door (`lendable` dropped `bankcard`) and measured the next row through the same door:
// the 18 band's `watch`, «The eighteenth watch» – 59 of 60 careers met it on 145 cards from nineteen to
// forty-five, 55 of them as the ask. The owner, 06.10, asked whether the band should lend nothing: «наверное
// да». ⚠ THE WHOLE BAND, AND THE MEASUREMENT IS WHY: the same every-ask walk carried 429 cards with a row of
// the 18 band – the watch's 145 and 284 more that carried only `trip` – so the rule is the band's, not the row's.
//
// ⚠ EVERY ARM COUNTS BY OBJECT IDENTITY, NEVER BY ID. `watch` is an id in TWO bands (17 and 18), as two different
// objects: an id-count would read the 17 band's own «A watch» as a leak and could not say which of the two a late
// card was holding. The options of an offer ARE the band's objects (asserted by identity in (d) above), so
// `band.gifts.includes(row)` is exact.
//
// ⚠ NOTHING HERE IS A DRAW. The filter acts on the POOL before the shuffle; which rows a late card's refill takes
// does move (it skips the 18 band now, which is the intended change), the streams do not.
//
// MUTATION-VERIFIED – un-widening the filter back to the account's one row reddens (e), (f) and the last line of (h);
// over-widening it so that NO band lends reddens (h)'s control line, and B8's own (a), because with nobody lending the
// retired account row comes back on the card at eighteen. The ledger (docs/rounds/round-46.md, R6) names the run.

/** One card of the late sweep, with the offer's own row OBJECTS kept – see the identity note above. */
interface LateCard {
  seed: string
  grant: 'every-ask' | 'the-day'
  earning: boolean
  step: Step
}

describe('round 46 R6 – the 18 band lends nothing (the eighteenth watch joins the account)', () => {
  const seventeenBand = BIRTHDAY_BANDS.find((b) => b.from === 17 && b.to === 17)!
  const eighteenWatch = eighteenBand.gifts.find((g) => g.id === 'watch')!
  const heldFrom = (band: typeof eighteenBand, s: Step): Gift[] => s.rows.filter((g) => band.gifts.includes(g))
  const askedRow = (s: Step): Gift | undefined => s.rows.find((g) => g.id === s.askedId)
  const holderOf = (g: Gift) => BIRTHDAY_BANDS.find((b) => b.gifts.includes(g))

  // Every card of every walk from nineteen to forty-five – the sweep of (c): sixty seeds, both grants, both
  // balances – computed once and shared by the arms below.
  let memo: LateCard[] | undefined
  function lateCards(): LateCard[] {
    if (memo === undefined) {
      memo = []
      for (const seed of SEEDS) {
        for (const grant of ['every-ask', 'the-day'] as const) {
          for (const earning of [false, true]) {
            for (const step of walk(seed, 19, 45, () => earning, grant)) memo.push({ seed, grant, earning, step })
          }
        }
      }
    }
    return memo
  }

  it('the premise: `watch` is an id in two bands as two objects, and the 18 band is the one that stops lending', () => {
    const holders = BIRTHDAY_BANDS.filter((b) => b.gifts.some((g) => g.id === 'watch')).map((b) => `${b.from}-${b.to}`)
    expect(holders, 'the watch id sits in the 17 and the 18 band').toEqual(['17-17', '18-18'])
    expect(seventeenBand.gifts.find((g) => g.id === 'watch'), 'as two different objects').not.toBe(eighteenWatch)
    expect(eighteenBand.gifts.map((g) => g.id), 'the 18 band holds the account and the watch').toEqual(expect.arrayContaining([ACCOUNT, 'watch']))
  })

  it('(e) the grant-everything walk from nineteen to forty-five meets NO row of the 18 band, on any card', () => {
    const offenders: string[] = []
    for (const { seed, grant, earning, step } of lateCards()) {
      const held = heldFrom(eighteenBand, step)
      if (held.length) offenders.push(`${seed} ${grant} earning=${earning} age ${step.age}: ${held.map((g) => g.id).join('+')}`)
    }
    expect(offenders.slice(0, 6), `${offenders.length} cards carried a row of the 18 band after eighteen`).toEqual([])
  })

  it('(f) and the watch in particular: not one card and not one ask (B8 measured 145 cards and 55 asks on the every-ask walk)', () => {
    const cards = lateCards().filter(({ step }) => step.rows.includes(eighteenWatch))
    const asks = cards.filter(({ step }) => askedRow(step) === eighteenWatch)
    expect(cards.length, 'cards carrying the eighteenth watch after eighteen').toBe(0)
    expect(asks.length, 'asks for it after eighteen').toBe(0)
  })

  it('(g) the card at eighteen is untouched: every row of the band is on it, and the watch can still be the ask', () => {
    let askedWatch = 0
    for (const seed of SEEDS) {
      const bare = birthdayOffer(seed, 18, [], false, null, null, [], 18 * 52, null, [], false)
      for (const row of eighteenBand.gifts) expect(bare.options, `${seed}: ${row.id} is on the card at eighteen`).toContain(row)
      // The account was asked about at sixteen, so the anchor is spent and the ladder chooses among the band's other rows.
      const afterAccount = birthdayOffer(seed, 18, [ACCOUNT], false, null, ACCOUNT, [{ week: 16 * 52, asked: ACCOUNT, given: ACCOUNT }], 18 * 52, null, [], true)
      if (afterAccount.options.find((g) => g.id === afterAccount.askedId) === eighteenWatch) askedWatch++
    }
    expect(askedWatch, 'the eighteenth watch is still ASKED at eighteen on some careers').toBeGreaterThan(0)
  })

  it('(h) every OTHER band still lends: the 17 band is the named control, and the 18 band is the one that does not', () => {
    const lent = new Map<string, number>()
    for (const { step } of lateCards()) {
      for (const g of step.rows) {
        const holder = holderOf(g)
        if (holder && !(step.age >= holder.from && step.age <= holder.to)) {
          const key = `${holder.from}-${holder.to}`
          lent.set(key, (lent.get(key) ?? 0) + 1)
        }
      }
    }
    expect(lent.get('17-17') ?? 0, 'the 17 band still lends to late cards – the control row').toBeGreaterThan(0)
    expect(lent.get('22-28') ?? 0, 'and so does the 22-28 band, the late refill\'s usual first stop').toBeGreaterThan(0)
    expect(lent.get('18-18') ?? 0, 'the 18 band lends nothing').toBe(0)
  })

  it('(i) no late card comes up short or doubled: every one is as tall as an unrefilled card, in different rows', () => {
    const size = lateCards().find((c) => c.grant === 'the-day')!.step.ids.length
    const bad = lateCards().filter(({ step }) => step.ids.length !== size || new Set(step.ids).size !== step.ids.length)
    expect(bad.slice(0, 4).map((c) => `${c.seed} ${c.grant} age ${c.step.age}`), `${bad.length} late cards were short or doubled (an unrefilled card is ${size} rows)`).toEqual([])
  })
})
