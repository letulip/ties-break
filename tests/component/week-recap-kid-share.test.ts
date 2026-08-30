// ⭐⭐⭐ HER CUT ON THE WEEK RECAP – AND SINCE ROUND 29 PART TWO #1, THE COLUMN THAT ADDS UP TO IT.
//
// THE OWNER, 27.08: «на плашке Finances на week recap после турниров можно писать что-то вроде
// Income $sum / Spent $sum / Her cut 10% $sum / Balance $sum. Мне кажется так будет нагляднее.»
//
// ⚠⚠ AND HIS ARITHMETIC AS WRITTEN DOUBLE-COUNTED, WHICH IS WHY IT SHIPPED AS A MEMO – past tense
// now, and the paragraph is kept because it records what the memo was for. `finalizeTournament`
// credits the family `prize − herShare` (world.ts), so `Income` on that tile was ALREADY NET, and a
// fourth row subtracting the cut again printed a balance the till never had.
//
// ⚠⚠ ROUND 29 PART TWO #1 REMOVED THE PREMISE RATHER THAN THE ROW. He came back on 29.08: «У нас
// есть одна сумма призовых, допустим 55200, тогда и ее доля будет 27600 и у нас income должен
// показывать 27600, а на соседней строчке все остальные расходы.» The tile now prints the GROSS the
// ramp was applied to, her cut as a signed outgoing row, the rest of the income and the spending –
// and those four figures sum to the balance under them, in cents, exactly. So her cut IS inside the
// sum now, and it is honest there because the sum no longer starts from a netted figure.
//
// ⭐ THE STRONGEST ARM IN THIS FILE IS THEREFORE HIS OWN TEST, IN HIS OWN WORDS: read the numbers
// back OFF THE SCREEN and add them. It replaces the old strongest arm ("the memo did not join the
// sum"), whose invariant – the BALANCE cannot move – is kept intact one case down.
//
// ⚠ MOUNTED, NOT PINNED – CLAUDE.md's own rule, and the reason is specific to this card: the tile
// reads `snapshot.finance.weekly12` while its neighbours read `snapshot.events`, and the last time
// this card was wrong (05.08, the owner's «Income +$0 · Spent +$0» save) EVERY source pin on it was
// green. The engine half lives in tests/kid-share-memo.test.ts.
//
// ⚠ MUTATION-VERIFIED – each of these turns exactly the named arm red, and each was watched doing it:
//   * `other = income − kept` -> `other = income`         -> the "rows add up" arm, ALONE. This is
//     the double-count itself, rebuilt: the family's half of the cheque counted twice.
//   * `{ key: 'Before her cut', cents: split.base }` dropped -> the "rows add up" arm, ALONE (the
//     "50% of what" pin lives inside that same case, and it goes with it – the base is what both
//     are about, which is why they are one case and not two).
//   * `-split.cut` -> `split.cut`                         -> the "rows add up" arm, ALONE.
//   * the `of ${formatCents(base)}` clause put back       -> the "short sentence" arm AND the
//     forward-only arm, which is right: neither shape may carry a base inside the sentence again.
//   * `v-if="kidShareMemo"` -> `v-if="false"`             -> the "short sentence" arm and the
//     "no Cyrillic" arm. The under-eighteen arm and BOTH plaque arms stay green – measured.
//   * `balanceCents` -= `kidShareCents`                   -> the balance arm AND the "rows add up"
//     arm – it is the one mutation a reader could mistake for the feature working.
//   * the plaque moved back above `.money-tabs`           -> the "demoted" arm, ALONE – and
//     `round26-money-share.test.ts`'s three cases stay green through it, which is the proof that
//     the move did not touch the copy.
//   * the plaque deleted from MoneyScreen                 -> the "kept, not deleted" arm.
import { describe, it, expect, beforeEach, vi } from 'vitest'
// ⚠ A RUNNER-SIZED CEILING, the arithmetic `round26-money-share.test.ts` writes out in full: these
// cases mount real screens over a career walked ~600 weeks, and GitHub's 2-core runner is measured
// at 4-5x this machine on this suite. The walk itself is hoisted out of the cases (see `paid()`),
// so what is inside a case is a mount; 30s is far above that and can only fire on a genuine wedge.
vi.setConfig({ testTimeout: 30_000 })
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import WeekRecapCard from '../../src/components/WeekRecapCard.vue'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  KID_ID,
  closeTournament,
  createWorld,
  enterEvent,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { formatCents } from '../../src/shared/money'
import { TIERS, WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import type { SeasonEvent, TierId } from '../../src/engine/season/types'
import type { SeasonResult } from '../../src/engine/season/ranking'

/** `round26-world-speaks.test.ts`'s helper, unchanged. */
function enterEligible(world: WorldState, event: SeasonEvent): void {
  const min = TIERS[event.tier as TierId].enterPointBand[0]
  const marker: SeasonResult = { playerId: KID_ID, week: world.week, points: min, tier: event.tier }
  if (min > 0) world.results.push(marker)
  enterEvent(world, event.id)
  if (min > 0) world.results = world.results.filter((r) => r !== marker)
}

/** A real career walked until the week it is STANDING IN split a cheque with her – which is the only
 *  week this card ever draws (`week = snapshot.week`). Stopping ON that week is what makes the
 *  fixture the owner's screenshot rather than a hand-set flag.
 *
 *  ⚠ WALKED ONCE FOR THE FILE, and that is safe here in a way it would not be in
 *  `round26-money-share.test.ts`: every claim below is about what a COMPONENT does with a snapshot,
 *  so the arms are separated by the snapshot each one mounts, not by the world each one walks. The
 *  walk is ~600 weeks and repeating it four times is the file's whole cost. */
let cached: Snapshot | null = null
function paid(): Snapshot {
  if (cached) return cached
  const world = createWorld('recap-kid-share', { ...DEFAULT_PROFILE, birthMonth: 1, birthDay: 5 })
  const rng = rngFromSeed(world.seed)
  while (world.week < WEEKS_PER_YEAR * 14) {
    world.fundsCents = Math.max(world.fundsCents, 5_000_000_00)
    const next = world.season.find(
      (e) => e.week > world.week && e.week <= world.week + 4 && world.week <= e.deadlineWeek && !world.entries.includes(e.id),
    )
    if (next) {
      try {
        enterEligible(world, next)
      } catch {
        /* the door was shut that week */
      }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
    if (world.financeWeeks.find((w) => w.week === world.week)?.kidShare) break
  }
  const snap = toSnapshot(world)
  const row = snap.finance.weekly12.find((p) => p.week === snap.week)
  expect(row?.kidShareCents, 'the fixture really stopped on a week that paid her').toBeGreaterThan(0)
  expect(snap.ageYears, 'and she is past the threshold birthday on it').toBeGreaterThanOrEqual(18)
  cached = snap
  return snap
}

/** The same week with the memo taken off the wire and NOTHING else touched – the counter-example the
 *  balance arm needs. */
function withoutMemo(snap: Snapshot): Snapshot {
  return {
    ...snap,
    finance: {
      ...snap.finance,
      weekly12: snap.finance.weekly12.map((p) => ({
        week: p.week,
        incomeCents: p.incomeCents,
        expenseCents: p.expenseCents,
        balanceCents: p.balanceCents,
      })),
    },
  }
}

/** ⭐ ROUND 29 PART TWO #1 – THE SAME WEEK AS ONE OF HIS SAVE'S SIXTY: her cut and its rate on the
 *  wire, and NO base, because the field did not exist when they were banked. This is the forward-only
 *  half made testable – a week like this must keep the exact three rows it has always printed. */
function withoutBase(snap: Snapshot): Snapshot {
  return {
    ...snap,
    finance: {
      ...snap.finance,
      weekly12: snap.finance.weekly12.map(({ kidShareBaseCents: _drop, ...p }) => p),
    },
  }
}

function recap(snap: Snapshot) {
  useGameStore().snapshot = snap
  return mount(WeekRecapCard, { global: { stubs: { teleport: true } } })
}

const clean = (s: string) => s.replace(/\s+/g, ' ').trim()

/** ⚠⚠ THE NUMBERS AS A PLAYER HAS THEM: parsed back out of the RENDERED string, not read off the
 *  snapshot. «+$55,200» -> 55200. That is the whole point of his test – the figures that must add up
 *  are the ones on the screen, and a helper that reached for `incomeCents` would be asserting our
 *  internals against themselves. Returns whole DOLLARS, because whole dollars are what is printed. */
function dollarsOf(text: string): number {
  const m = clean(text).match(/([+-]?)\$([\d,]+)/)
  if (!m) throw new Error(`no money in ${JSON.stringify(text)}`)
  return (m[1] === '-' ? -1 : 1) * Number(m[2].replace(/,/g, ''))
}

describe('the week recap says what her cut was', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('ROUND 29 PART TWO #1 – the rendered rows ADD UP to the rendered balance', () => {
    // ⚠⚠⚠ HIS OWN TEST, IN HIS OWN WORDS: «у нас income должен показывать 27600, а на соседней
    // строчке все остальные расходы». Every figure here is taken OFF THE SCREEN and added; nothing
    // reaches into the snapshot to get it. A player with a calculator and no knowledge of our
    // internals is exactly the reader this arm impersonates.
    const tile = recap(paid()).find('.recap-finance')
    const keys = tile.findAll('.recap-rows .recap-row-key').map((n) => clean(n.text()))
    const vals = tile.findAll('.recap-rows .recap-row-val').map((n) => dollarsOf(n.text()))
    const balance = dollarsOf(tile.find('.recap-balance').text())

    // The shape first, so the sum below cannot pass on a card that lost the gross row entirely.
    expect(keys[0], 'the gross the percentage is a share OF leads the column').toBe('Before her cut')
    expect(keys[1], 'her cut names its own rate, beside the base it is a rate of').toMatch(/^Her cut \d+%$/)
    expect(keys.at(-1), 'and the spending closes it').toBe('Spent')
    expect(keys, 'the netted single Income row is gone from a week that split a cheque').not.toContain('Income')

    // ⭐ AND THE SUM. Signed rows, so this is a plain addition and not a "which ones do I subtract".
    const summed = vals.reduce((a, b) => a + b, 0)
    // ⚠ TOLERANCE IS ROUNDING AND NOTHING ELSE, and it is the house rule doing exactly what it is
    // for: the LOGIC is cents (`base − cut + other − spent === income − spent` identically) and the
    // DISPLAY is whole dollars. The bound is arithmetic rather than a fudge: four rows each round by
    // at most half a dollar (≤ $2.0) and the balance rounds once more (≤ $0.5), so two integers that
    // agree in cents can differ by at most $2 on screen. A real double-count is thousands wide.
    expect(Math.abs(summed - balance), `rows ${keys.join('/')} = ${vals.join(' ')} vs ${balance}`).toBeLessThanOrEqual(2)
    expect(Math.abs(balance), 'the fixture is a week with real money in it, not four zeroes').toBeGreaterThan(0)

    // ⚠⚠ THE PIN, RE-AIMED FROM THE MEMO TO THE ROWS AND STRENGTHENED, NEVER DELETED. Round 29 #10
    // put it there because «50%» had stood beside a base it could not be 50% of; the base is a ROW
    // now, so the pin reads two rendered figures instead of one rendered figure and a snapshot
    // field. The percentage ON SCREEN must be a percentage OF the figure ON SCREEN above it.
    const pct = Number(keys[1].match(/(\d+)%/)![1])
    const base = vals[0]
    const cut = -vals[1]
    // Tolerance: whole-dollar display on both sides, plus one cent per cheque on the way in (a title
    // week banks up to three) – tests/round29-kid-cut-base.test.ts writes that allowance out in full.
    expect(Math.abs(Math.round((base * pct) / 100) - cut), `${pct}% of ${base} is not ${cut}`).toBeLessThanOrEqual(2)
  })

  it('leaves the BALANCE untouched by her cut – the double-count this design still avoids', () => {
    // ⚠⚠ RE-AIMED BY PART TWO #1, NOT WEAKENED, AND THE DIFFERENCE IS THE ITEM. This arm used to
    // assert that the ROWS were identical with and without her cut on the wire; that is now false BY
    // DESIGN – the rows are exactly what changes, because the tile no longer nets. What it always
    // meant is the invariant that survives: the wallet moved by `income − spend` and her cut is not
    // allowed to move it, because `finalizeTournament` had already taken it out before the family
    // banked anything. So the BALANCE must be byte-identical across the two mounts, and the rows
    // must NOT be – asserting both is what stops this arm passing on a card that ignored the item.
    const snap = paid()
    const withIt = recap(snap)
    const rowsWith = withIt.findAll('.recap-finance .recap-rows .recap-row-val').map((n) => n.text())
    const balanceWith = withIt.find('.recap-balance').text()
    expect(withIt.find('.recap-memo').exists()).toBe(true)
    withIt.unmount()

    const withoutIt = recap(withoutMemo(snap))
    expect(withoutIt.find('.recap-memo').exists(), 'the counter-example really has no memo').toBe(false)
    expect(withoutIt.find('.recap-balance').text(), 'her cut may not move the balance').toBe(balanceWith)
    expect(
      withoutIt.findAll('.recap-finance .recap-rows .recap-row-val').map((n) => n.text()),
      'and the rows DO differ – the netted shape is what part two #1 replaced',
    ).not.toEqual(rowsWith)

    // ...and the balance is genuinely income minus spend, not a coincidence of two zeroes.
    const row = snap.finance.weekly12.find((p) => p.week === snap.week)!
    expect(row.incomeCents, 'the fixture is a week with real money in it').toBeGreaterThan(0)
    expect(balanceWith, 'the printed balance is income minus spend and nothing else').toBe(
      `${row.incomeCents - row.expenseCents < 0 ? '-' : '+'}$${Math.abs(
        Math.round((row.incomeCents - row.expenseCents) / 100),
      ).toLocaleString('en-US')}`,
    )
  })

  it('ROUND 29 PART TWO #2 – the SHORT sentence is back, and the long one is gone', () => {
    // «Her cut 50% of $55,200 – $27,600 – это усложнило и фразу и интерфейс – верни Her cut 50% –
    // $27,600 как было раньше пожалуйста.» His exact string, dash included, off the rendered card.
    const snap = paid()
    const row = snap.finance.weekly12.find((p) => p.week === snap.week)!
    const memo = clean(recap(snap).find('.recap-memo').text())
    expect(memo).toContain(`Her cut ${row.kidSharePct}% – ${formatCents(row.kidShareCents!)}`)
    // ⚠ AND THE LONG FORM IS REALLY GONE, not merely un-asserted. A `toContain` on the short shape
    // would pass on the long one too, since the long one starts with the same five characters.
    expect(memo, 'the base has moved to a row – it may not also be in the sentence').not.toMatch(/Her cut \d+% of \$/)
    // ⚠ The foot is gone WITH it on this shape: the rows say what the family kept, out loud.
    expect(memo).not.toContain('what the family kept')
    expect(memo, 'what a sentence can say and a row cannot – where the money went').toContain(
      'into her own account',
    )
  })

  it('and a week his save already banked keeps the exact rows it printed – forward-only', () => {
    // ⚠⚠ THE FORWARD-ONLY HALF, MOUNTED. `financeWeeks` is persisted and his career holds sixty
    // weeks of it, every one written before `baseCents` existed. Handed such a week the tile may not
    // invent a gross by dividing – it keeps Income / Spent / Balance, and the memo carries the SHORT
    // sentence plus the foot that says out loud what `Income` there still is.
    const snap = withoutBase(paid())
    const row = snap.finance.weekly12.find((p) => p.week === snap.week)!
    const tile = recap(snap).find('.recap-finance')
    expect(tile.findAll('.recap-rows .recap-row-key').map((n) => clean(n.text()))).toEqual(['Income', 'Spent'])
    const memo = clean(tile.find('.recap-memo').text())
    expect(memo).toContain(`Her cut ${row.kidSharePct}% – ${formatCents(row.kidShareCents!)}`)
    expect(memo, 'no base on the wire, so none on the screen – and none guessed at').not.toMatch(/of \$/)
    expect(memo, 'the foot earns its place here, where Income really is a netted figure').toContain(
      'The income above is what the family kept',
    )
  })

  it('says nothing on a week that split no cheque, and nothing at all before her eighteenth', () => {
    // The under-eighteen half is proved on the engine side (tests/kid-share-memo.test.ts walks four
    // junior seasons that really banked prize money and never wrote a row). What this arm adds is
    // the CARD: handed a week with no cut on it, it renders no memo rather than «Her cut 0% $0».
    expect(recap(withoutMemo(paid())).find('.recap-memo').exists()).toBe(false)
  })

  it('writes no Cyrillic and no long dash into the interface', () => {
    // tests/template-copy-rules.test.ts guards the template block statically; this guards the string
    // the player actually reads, which is assembled in the script and cannot be seen from there.
    const memo = clean(recap(paid()).find('.recap-memo').text())
    expect(memo).not.toMatch(/[А-Яа-яЁё]/)
    expect(memo).not.toContain('—')
    expect(memo, 'the short dash is the one the house uses').toContain('–')
  })
})

describe('the Budget plaque is demoted, not deleted', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('still exists and still says what it said', () => {
    // ROUND 26 #5b's copy, unchanged. `round26-money-share.test.ts` holds the balance sentence and
    // the direction clause on their own careers; this is the same claim standing next to the move,
    // so a demotion that quietly dropped a sentence cannot pass as a demotion.
    useGameStore().snapshot = paid()
    const text = clean(mount(MoneyScreen, { global: { stubs: { teleport: true } } }).text())
    expect(text).toContain('split before it reaches this account')
    expect(text).toContain('her part goes to her, the family banks the rest')
  })

  it('sits BELOW the section switcher now, which is what the owner asked for', () => {
    // «эту плашку можно оставить может быть, но переместить вниз, она не главная» (27.08). It used
    // to be section 1a-bis, between the header and the tabs; it is section 9 now, at the foot of the
    // screen. DOM ORDER is the honest way to assert that – a source pin on the template would pass
    // on a strip moved to a place nothing renders.
    useGameStore().snapshot = paid()
    const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } } })
    const plaque = wrapper.find('.money-share').element
    const tabs = wrapper.find('.money-tabs').element
    expect(plaque, 'the plaque is on the screen').toBeTruthy()
    expect(tabs, 'and so is the switcher it used to sit above').toBeTruthy()
    // DOCUMENT_POSITION_PRECEDING === 2: `tabs` comes BEFORE `plaque` in the document, which is the
    // new layout. In the old one this bit was clear and DOCUMENT_POSITION_FOLLOWING (4) was set.
    expect(
      plaque.compareDocumentPosition(tabs) & 2,
      'the switcher precedes the plaque – the strip has moved down the page',
    ).toBeTruthy()
    // ⚠ AND IT IS STILL OUTSIDE EVERY TAB GUARD, which was the half of its old placement that was
    // never about height: the ledger tab is where the prize rows it is about live.
    expect(wrapper.find('.money-share').exists()).toBe(true)
  })
})
