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
// показывать 27600, а на соседней строчке все остальные расходы.» The tile printed the GROSS the
// ramp was applied to, her cut as a signed outgoing row, the rest of the income and the spending.
//
// ⚠⚠ AND ROUND 30 #1 SENT THAT BACK, BECAUSE FIVE ROWS IS MORE THAN HE ASKED FOR, NOT FEWER. He
// played it: «вернуть все цифры и надписи как было до этого: Income / Spent / Balance, ниже her cut
// без жирного шрифта, ниже coach's cut если есть результат. Всё остальное лишнее, дублирующее и
// сбивает с толку. Other income странно звучит, можно переименовать… например Family income и тогда
// эту строчку тоже оставить здесь.» Her cut had been on screen TWICE – a row AND the memo below it –
// which is the duplication he names. The column is Income / Spent again on every week; her cut and
// the coach's are memos under the balance; `Other income` survives beside them as `Family income`,
// the one line of the five he asked to keep, under the name he chose himself.
//
// ⭐ THE STRONGEST ARM IN THIS FILE IS STILL HIS OWN TEST, IN HIS OWN WORDS: read the numbers back
// OFF THE SCREEN and add them. Three shapes have passed under it now and it has not changed what it
// asks – only how many rows it has to add.
//
// ⚠ MOUNTED, NOT PINNED – CLAUDE.md's own rule, and the reason is specific to this card: the tile
// reads `snapshot.finance.weekly12` while its neighbours read `snapshot.events`, and the last time
// this card was wrong (05.08, the owner's «Income +$0 · Spent +$0» save) EVERY source pin on it was
// green. The engine half lives in tests/kid-share-memo.test.ts. The one exception is the FONT
// WEIGHT arm, which cannot be mounted: scoped SFC styles are not injected by test-utils, so it is a
// marker-helper pin on the rule that declares it (`round14-group-c.test.ts`'s own precedent).
//
// ⚠ MUTATION-VERIFIED – each of these turns exactly the named arms red, and each was watched doing
// it. ⚠ THE FIRST FOUR ARE ROUND 30 #1's AND THEY REPLACE PART TWO #1's, which measured a column
// that no longer exists:
//   * the five-row `financeRows` restored                 -> FOUR arms, which is the regression
//     itself: "the column is Income / Spent again", "Family income is outside the sum", "the rows do
//     not move either", and round29p2-coach-cut-weekly's "on a week carrying both cuts".
//   * `>Family income<` -> `>Other income<`               -> the "one row he asked to keep" arm,
//     ALONE. The name is the whole of that half of the item.
//   * `familyIncomeCents` -> `incomeCents`                -> the same arm, on the FIGURE rather than
//     the name: the slice becoming a duplicate of Income is the shape it must never take.
//   * `font-weight: 500` -> `700` on `.recap-memo-line`   -> the "NOT bold any more" arm, ALONE.
//   * `v-if="kidShareMemo"` -> `v-if="false"`             -> the "short sentence" arm, the
//     forward-only arm and the "adds up" arm (whose #10 pin reads the rate off that memo). The
//     under-eighteen arm and BOTH plaque arms stay green – measured.
//   * `balanceCents` -= `kidShareCents`                   -> the balance arm AND the "adds up" arm –
//     it is the one mutation a reader could mistake for the feature working.
//   * the `of ${formatCents(base)}` clause put back       -> the "short sentence" arm AND the
//     forward-only arm, which is right: neither shape may carry a base inside the sentence again.
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
import { kidPrizeShareBps, managerCommissionBps } from '../../src/engine/economy'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { after, before } from '../helpers/source'
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
 *  balance arm needs.
 *
 *  ⚠ ROUND 31 #2: `prizeIncomeCents` IS KEPT, and that is what makes this helper still say what its
 *  name says. It is not part of her cut – it is the ledger's own `prize` category reaching the
 *  snapshot – so dropping it here would change the COLUMN as well as the memo and the balance arm
 *  below would then be comparing two different cards. The kid-share fields, and only those, go. */
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
        ...(p.prizeIncomeCents !== undefined ? { prizeIncomeCents: p.prizeIncomeCents } : {}),
      })),
    },
  }
}

/** ⭐⭐ ROUND 31 #2 – THE SAME WEEK AS ONE HIS SAVE BANKED BEFORE ROUND 30 #21: her cut and the BLEND
 *  on the wire, and no parts, because the field did not exist when they were banked. A week like this
 *  must print NO memo line at all – the blend is the number #21 measured as belonging to no rule in
 *  this game, and a missing line is honest where a wrong percentage is not. */
function withoutParts(snap: Snapshot): Snapshot {
  return {
    ...snap,
    finance: {
      ...snap.finance,
      weekly12: snap.finance.weekly12.map(({ kidShareParts: _drop, ...p }) => p),
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

/** ⭐⭐⭐ ROUND 30 #21 – THE SAME WEEK, PAID BY BOTH RULES. `paid()` above stops on the FIRST week the
 *  tennis paid her, which is a prize-only week by construction – and that is exactly why the round 29
 *  #10 arm below could never redden on the blend, however far the blend drifted from every rule in
 *  the game. This is the case the fixture never contained.
 *
 *  ⚠ SYNTHESISED FROM THE REAL WEEK, `withoutMemo`/`withoutBase`'s own device, and legitimate for the
 *  same reason: every claim in this file is about what a COMPONENT does with a snapshot. The ENGINE
 *  half – that a walked title week really records both parts under their own rules – is measured on a
 *  real 32-season career in tests/round29-kid-cut-base.test.ts §3, which is where the fixture that
 *  produces his «56%» already lived.
 *
 *  ⚠ THE RATES ARE THE ENGINE'S OWN, never literals: her ramp at her real age, and what the manager
 *  leaves of a brand cheque. The split of the cents is arbitrary (40/60) because nothing about the
 *  claim depends on it – what matters is that the two rules differ and that the blend is neither. */
function mixed(snap: Snapshot): Snapshot {
  const rampBps = kidPrizeShareBps(snap.ageYears)
  const sponsorBps = 10_000 - managerCommissionBps()
  return {
    ...snap,
    finance: {
      ...snap.finance,
      weekly12: snap.finance.weekly12.map((p) => {
        if (p.week !== snap.week || !p.kidShareCents) return p
        const prizeCents = Math.round(p.kidShareCents * 0.4)
        const sponsorCents = p.kidShareCents - prizeCents
        // The blend the old card would have printed: her whole cut over the gross both rules split.
        const baseCents = Math.round((prizeCents * 10_000) / rampBps) + Math.round((sponsorCents * 10_000) / sponsorBps)
        return {
          ...p,
          kidShareBaseCents: baseCents,
          kidSharePct: Math.round(p.kidShareCents * 100 / baseCents),
          kidShareParts: [
            { source: 'prize' as const, pct: Math.round(rampBps / 100), cents: prizeCents },
            { source: 'sponsor' as const, pct: Math.round(sponsorBps / 100), cents: sponsorCents },
          ],
        }
      }),
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

  it('ROUND 31 #2 – the column is Income / Family income / Spent, and it adds up to the Balance', () => {
    // ⚠⚠ RE-AIMED FROM PART TWO #1's FIVE ROWS TO HIS THREE FIGURES, NOT DELETED. He played the
    // five-row column and sent it back: «вернуть все цифры и надписи как было до этого: Income /
    // Spent / Balance, ниже her cut без жирного шрифта, ниже coach's cut если есть результат. Всё
    // остальное лишнее, дублирующее и сбивает с толку.» Part two #1 had answered «one prize figure
    // so the rows add up» with FIVE rows – her cut printed twice, once as a row and once as the
    // memo below – and that duplication is what he names.
    //
    // ⚠ WHAT THE ARM STILL PROVES IS THE SAME THING IT ALWAYS PROVED, and it is still his own test:
    // a player with a calculator adds the figures ON SCREEN and gets the balance under them. Every
    // number here is parsed back out of the rendered card; nothing reaches into the snapshot for it.
    const tile = recap(paid()).find('.recap-finance')
    const keys = tile.findAll('.recap-rows .recap-row-key').map((n) => clean(n.text()))
    const vals = tile.findAll('.recap-rows .recap-row-val').map((n) => dollarsOf(n.text()))
    const balance = dollarsOf(tile.find('.recap-balance').text())

    // ⚠⚠ RE-AIMED A THIRD TIME BY ROUND 31 #2, AND HIS SPECIFICATION IS NOW LITERALLY THIS LIST. He
    // wrote it out himself: «Income - то, что пришло с турнира / Other income - Другие семейные
    // доходы / Spent - То, что потрачено на дорогу + другие траты недели / Balance - что в итоге
    // пришло на счет», and settled the name in the same breath – «Other income – другие семейные
    // доходы (можно и Family income)» – so the label he typed in round 30 #1 stays to the character
    // and only its POSITION moved. `Balance` is the fourth line, under the hairline, where it has
    // always been.
    //
    // ⭐⭐ THE `toEqual` IS THE GUARD AGAINST A FIFTH PASS OVER THIS CARD. It fails when anyone ADDS a
    // row, not only when someone changes one, and this card has now been reshaped four times because
    // each round could only see the row it was about.
    expect(keys, 'his figures, in his order').toEqual(['Income', 'Family income', 'Spent'])
    // ⚠⚠ AND THE FIVE-ROW SHAPE IS REALLY GONE, not merely un-asserted – this is the regression.
    // A `toEqual` above would already catch it; naming them makes the failure say which one is back.
    // ⚠ `Other income` STAYS ON THIS LIST although the row is now real: the row is `Family income`,
    // the name he called strange has not come back, and confusing the two is a rename.
    for (const gone of ['Before her cut', 'Other income']) {
      expect(keys, `${gone} was one of the rows he called superfluous`).not.toContain(gone)
    }
    expect(
      keys.filter((k) => k.startsWith('Her cut')),
      'her cut is a memo under the balance and NOT also a row – the duplication he named',
    ).toEqual([])

    // ⭐ AND THE SUM. Signed rows, so this is a plain addition and not a "which ones do I subtract".
    const summed = vals.reduce((a, b) => a + b, 0)
    // ⚠ TOLERANCE IS ROUNDING AND NOTHING ELSE, and it is the house rule doing exactly what it is
    // for: the LOGIC is cents (`income − spent === balance` identically) and the DISPLAY is whole
    // dollars. THREE rows each round by at most half a dollar and the balance rounds once more, so
    // integers that agree in cents can differ by at most $2 on screen. A double-count is thousands.
    expect(Math.abs(summed - balance), `rows ${keys.join('/')} = ${vals.join(' ')} vs ${balance}`).toBeLessThanOrEqual(2)
    // ⚠⚠ AND BOTH INCOME ROWS CARRY REAL MONEY ON THIS FIXTURE, which is what stops the sum above
    // passing on a card that silently put the whole week in one of them. A tournament week where
    // `Family income` came out $0 would satisfy the addition while proving nothing about the split,
    // and that is precisely the state the old derived line used to be stuck in.
    expect(vals[0], 'the tournament really paid this week').toBeGreaterThan(0)
    expect(vals[1], 'and the family really banked something else besides').toBeGreaterThan(0)
    expect(Math.abs(balance), 'the fixture is a week with real money in it, not two zeroes').toBeGreaterThan(0)

    // ⚠⚠ THE ROUND 29 #10 PIN, RE-AIMED A SECOND TIME AND NEVER DELETED – it is the reason «50%»
    // cannot silently drift away from the money beside it again. #10 put it on the memo, part two #1
    // moved it onto two rendered rows, and round 30 #1 has taken the base back OFF the card. So it
    // reads the rate off the SCREEN and the base off the WIRE – the one thing it must never do is
    // invent the base by dividing the cut by the rate, which is the arithmetic
    // `accrueKidShare`'s own header forbids in as many words.
    const snap = paid()
    const row = snap.finance.weekly12.find((p) => p.week === snap.week)!
    const memo = clean(tile.find('.recap-memo').text())
    const pct = Number(memo.match(/Her cut (\d+)%/)![1])
    expect(row.kidShareBaseCents, 'the fixture carries a real recorded gross').toBeGreaterThan(0)
    // Tolerance is one cent per cheque banked that week – each rounds once on its own way in and a
    // sum of rounded halves is not the rounded half of a sum. tests/round29-kid-cut-base.test.ts
    // writes that allowance out in full; a title week banks at most three.
    expect(
      Math.abs(Math.round((row.kidShareBaseCents! * pct) / 100) - row.kidShareCents!),
      `${pct}% of ${row.kidShareBaseCents} is not ${row.kidShareCents}`,
    ).toBeLessThanOrEqual(3)
    // ⭐ AND THE RATE IS THE ENGINE'S RAMP, NOT A NUMBER THIS CARD TYPED. `kidPrizeShareBps` reads
    // `ECONOMY.kidShare` and nothing else, so a retune moves the cheque and this sentence together.
    // ⚠ The stored rate is the week's EFFECTIVE one since round 29 P3 (a sponsor result bonus
    // splits at `10_000 − managerCommissionBps()` rather than at her ramp), so this equality is a
    // claim about THIS fixture as well as about the card: `paid()` stops on the first week the
    // tennis paid her, which is a prize-only week. If a future fixture change makes it a mixed week
    // this arm goes red and says so, which is the correct outcome – not a reason to loosen it.
    expect(pct, 'the percentage on screen is the ramp the engine paid her by').toBe(
      kidPrizeShareBps(snap.ageYears) / 100,
    )
  })

  it('ROUND 31 #2 – ...and it adds up when the week ends BELOW zero, which is his own caveat', () => {
    // «Balance - что в итоге пришло на счет (ну или ушло, в зависимости от исхода)». A signed balance
    // is today's behaviour and stays, so the addition has to hold with the sum on the wrong side of
    // zero too – the one arithmetic case a fixture of winning weeks can never reach.
    //
    // ⚠ SYNTHESISED FROM THE REAL WEEK, `mixed`/`withoutBase`'s own device: the claim is about what a
    // COMPONENT does with a snapshot, and a week that spent more than it banked is a snapshot.
    const base = paid()
    const snap: Snapshot = {
      ...base,
      finance: {
        ...base.finance,
        weekly12: base.finance.weekly12.map((p) =>
          p.week === base.week ? { ...p, expenseCents: p.incomeCents + 1_234_500 } : p,
        ),
      },
    }
    const tile = recap(snap).find('.recap-finance')
    const vals = tile.findAll('.recap-rows .recap-row-val').map((n) => dollarsOf(n.text()))
    const balance = dollarsOf(tile.find('.recap-balance').text())
    expect(balance, 'the fixture really ended the week down').toBeLessThan(0)
    expect(vals.reduce((a, b) => a + b, 0) - balance, 'the column still adds to the balance').toBeLessThanOrEqual(2)
    expect(tile.find('.recap-balance').classes(), 'and it is painted as a loss').toContain('negative')
  })

  it('ROUND 31 #2 – «Income» is the tournament`s cheque and «Family income» is the rest of the week', () => {
    // ⚠⚠ RE-AIMED, AND THE DEFECT IT NOW GUARDS IS THE ONE HE REPORTED. Round 30 #1 kept this row as
    // an aside under the balance, derived out of her cut's base (`income − (base − cut)`) – so it
    // existed only on weeks that split a cheque, and the `Income` row above it silently contained
    // sponsor and brand money while being labelled «то, что пришло с турнира». Both halves are fixed
    // by the same field: `Income` is the ledger's own `prize` category and this row is the remainder.
    //
    // ⚠ THE NAME DID NOT MOVE A CHARACTER. «Other income странно звучит, можно переименовать…
    // например Family income и тогда эту строчку тоже оставить здесь» was round 30 #1's, he
    // confirmed it again here, and invariant 4 cuts both ways.
    const snap = paid()
    const row = snap.finance.weekly12.find((p) => p.week === snap.week)!
    const tile = recap(snap).find('.recap-finance')
    const cells = tile.findAll('.recap-rows .recap-row')
    const named = (key: string) => cells.find((c) => clean(c.find('.recap-row-key').text()) === key)!

    expect(row.prizeIncomeCents, 'the fixture is a real tournament week').toBeGreaterThan(0)
    expect(row.prizeIncomeCents, 'and the tournament is not the whole of its income').toBeLessThan(row.incomeCents)
    // ⚠⚠ AND THE ROW IS TIED TO THE ENGINE'S OWN PRIZE ROWS, NOT MERELY TO THE FIELD THAT FEEDS IT.
    // Every other assertion here reads the screen against `prizeIncomeCents`, so all of them would
    // stay green if that field were computed off the wrong category – which is exactly how a row
    // ends up labelled «то, что пришло с турнира» while containing something else, the defect this
    // item is about. This is the independent binding: what the engine BOOKED as prize this week.
    const bookedPrize = snap.financialEvents
      .filter((e) => e.week === snap.week && e.category === 'prize')
      .reduce((a, e) => a + (e.amountCents ?? 0), 0)
    expect(bookedPrize, 'the fixture really booked prize rows this week').toBeGreaterThan(0)
    expect(row.prizeIncomeCents, 'the Income row is the tournament`s own cheques').toBe(bookedPrize)

    expect(named('Income'), 'the tournament row is on the card').toBeTruthy()
    expect(dollarsOf(named('Income').text()), 'and it is the tournament cheque alone').toBe(
      Math.round(row.prizeIncomeCents! / 100),
    )
    expect(named('Family income'), 'the line he kept is on the card, in the name he chose').toBeTruthy()
    expect(dollarsOf(named('Family income').text()), 'and it is everything else the week banked').toBe(
      Math.round((row.incomeCents - row.prizeIncomeCents!) / 100),
    )
    expect(clean(tile.text()), 'and the name he called strange never came back').not.toContain('Other income')

    // ⚠⚠ AND IT IS INSIDE THE COLUMN NOW, WHICH IS THE CHANGE. It was an aside precisely because it
    // was a SLICE of the Income row; it is an ADDEND beside it now, so the aside must be gone – the
    // same cents in two places is the double-count the aside itself existed to prevent.
    expect(tile.find('.recap-row-aside').exists(), 'the aside went where the row came from').toBe(false)
  })

  it('ROUND 30 #1 – her cut is NOT bold any more, which is what he asked about it', () => {
    // «ниже her cut без жирного шрифта». ⚠ Scoped SFC styles are not injected by test-utils, so the
    // weight is pinned in the source that declares it – `round14-group-c.test.ts`'s own precedent
    // for exactly this claim, and the marker helpers throw rather than widening if the rule moves.
    // ⚠ THE `.vue` ALONE AND NOT A WIDENED CORPUS: half this claim is negative, and a widened
    // source would trip on a `font-weight: 700` living in some composable it was never about
    // (tests/pin-hygiene.test.ts is the mechanical form of that rule). ⚠ Read off the working
    // directory rather than through `componentFile`, whose `import.meta.url` is not a file: URL
    // under the component project's transform – `round14-group-c.test.ts`'s `repoFile` precedent.
    const recapFile = readFileSync(resolve(process.cwd(), 'src/components/WeekRecapCard.vue'), 'utf8')
    const rule = before(after(recapFile, '.recap-memo-line {'), '}')
    expect(rule, 'the memo sits in the card`s prose voice, not one step louder than the Balance').toContain(
      'font-weight: 500',
    )
    expect(rule, 'and the bold it shipped with is gone').not.toContain('font-weight: 700')
  })

  it('leaves the BALANCE untouched by her cut – the double-count this design still avoids', () => {
    // ⚠⚠ RE-AIMED TWICE NOW, AND THE THIRD SHAPE IS THE FIRST ONE. Part two #1 turned this arm's
    // «the rows are identical with and without her cut» into «the rows DIFFER», because the tile had
    // stopped netting. Round 30 #1 nets again at his instruction, so the ROWS ARE IDENTICAL once
    // more and the assertion turns back with it – kept, never deleted, because the invariant under
    // all three shapes never moved: the wallet moved by `income − spend`, and her cut may not touch
    // it, because `finalizeTournament` took it out before the family banked anything.
    //
    // ⚠ WHAT MUST STILL DIFFER IS THE MEMO ITSELF, and asserting that is what stops this arm passing
    // on a card that renders her cut nowhere at all.
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
      'and the ROWS do not move either – the column is the same three on every week',
    ).toEqual(rowsWith)
    // ⚠ ROUND 31 #2 STRENGTHENED THIS, IT DID NOT LOOSEN IT. «Family income» used to be the one
    // thing that DID go when the cut left the wire, because it was derived from her cut's base – a
    // dependency that had nothing to do with the family's own money and everything to do with where
    // the figure was being fetched from. It is `income − prize` now, so it survives the cut leaving,
    // exactly as Income and Spent always did, and the whole column is invariant under her share.
    expect(
      withoutIt.findAll('.recap-finance .recap-rows .recap-row-key').map((n) => clean(n.text())),
      'her cut moves no row, and removes none',
    ).toEqual(['Income', 'Family income', 'Spent'])

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
    // invent a gross by dividing – it keeps Income / Spent / Balance and the SHORT sentence.
    //
    // ⚠ ROUND 30 #1 MADE THE COLUMN THE SAME ON BOTH WIRES, so the rows are no longer what separates
    // a legacy week from a fresh one. ⚠ ROUND 31 #2 MADE THAT TRUE OF `Family income` TOO, and it is
    // a repair rather than a loss: the row used to need the recorded gross to be a slice of anything,
    // which is why a legacy week had none. It is `income − prize` now, and `prize` is the ledger
    // category every save has always carried, so this week gets its real split rather than a gap.
    const snap = withoutBase(paid())
    const row = snap.finance.weekly12.find((p) => p.week === snap.week)!
    const tile = recap(snap).find('.recap-finance')
    expect(tile.findAll('.recap-rows .recap-row-key').map((n) => clean(n.text()))).toEqual([
      'Income',
      'Family income',
      'Spent',
    ])
    expect(tile.find('.recap-row-aside').exists(), 'and the aside it used to be drawn as is gone').toBe(false)
    const prize = row.kidShareParts!.find((p) => p.source === 'prize')!
    const memo = clean(tile.find('.recap-memo').text())
    expect(memo).toContain(`Her cut ${prize.pct}% – ${formatCents(prize.cents)}`)
    expect(memo, 'no base on the wire, so none on the screen – and none guessed at').not.toMatch(/of \$/)
    // ⚠ THE FOOT IS UNTOUCHED BY ROUND 30 #1 AND STILL FIRES EXACTLY WHERE IT DID. He listed the
    // lines he wants and did not name this one; invariant 4 binds a DELETION as hard as a rename, so
    // a sentence nobody asked to remove stays and is flagged in docs/rounds/round-30.md instead.
    expect(memo, 'the legacy shape keeps the sentence it has always carried').toContain(
      'The income above is what the family kept',
    )
  })

  it('ROUND 31 #2 – on a MIXED week there is ONE line, it is the PRIZE rule, and the blend is nowhere', () => {
    // ⚠⚠ RE-AIMED BY ROUND 31 #2 AND THE HALF THAT MATTERS IS UNCHANGED. Round 30 #21 was right that
    // the blend belongs on no label – «Почему-то мне пишут "Her cut 61% – $69,750 into her own
    // account", и до этого было про 56%… При том, что на экране бюджета написано "She keeps 50% of
    // every prize cheque now"» – and wrong about the remedy: it printed one line PER RULE, so his
    // week grew a «Her sponsor cut 85%» he had never asked for. His answer, 31.08: «Я изначально
    // просил просто отразить, что ребенку идет его % с призовых и всё», and, restating the card,
    // «и вот здесь her cut от Income».
    //
    // ⚠ SO THE SECOND LINE GOES AND THE BLEND STAYS BANISHED. Both are asserted below: the mixed
    // week that used to print two sentences prints one, and the number that belongs to no rule is
    // still not on the card.
    const snap = mixed(paid())
    const row = snap.finance.weekly12.find((p) => p.week === snap.week)!
    const lines = recap(snap)
      .findAll('.recap-finance .recap-memo:not(.recap-memo-coach) .recap-memo-line')
      .map((n) => clean(n.text()))

    expect(lines, 'two rules paid this week and exactly one of them is weekly news').toHaveLength(1)
    expect(lines[0], 'the sponsor line he is complaining about is gone').not.toContain('sponsor')
    // ⚠ AND NOT BY RENAMING IT EITHER: it is the prize rule's own money, not the week's total.
    expect(lines[0], 'his string, unchanged – no source word on it').not.toMatch(/Her (prize|sponsor) cut/)

    // ⭐⭐ THE PIN THAT SURVIVES ALL OF THIS: the percentage on screen is a rate this engine STATES,
    // asked of `kidPrizeShareBps` rather than typed, so a retune moves the cheque and the sentence
    // together. ⚠ Round 29 #10's pin could not catch a blend because its fixture was prize-only;
    // this one is deliberately mixed, so the rate and the blend are different numbers here.
    const RULES = { prize: kidPrizeShareBps(snap.ageYears) / 100, sponsor: (10_000 - managerCommissionBps()) / 100 }
    const printed = Number(lines[0].match(/(\d+)%/)![1])
    expect(printed, 'the percentage on screen is her prize ramp').toBe(RULES.prize)

    // ⚠⚠ ...AND THE BLEND IS NOWHERE, which is #21's defect kept as an assertion. The fixture's blend
    // sits strictly between the two rules, so it can only reach the screen by being printed as one.
    expect(row.kidSharePct, 'the fixture really is a blend – above the prize rule').toBeGreaterThan(RULES.prize)
    expect(row.kidSharePct, 'and below the sponsor rule').toBeLessThan(RULES.sponsor)
    expect(printed, 'the average of two rules is not a rule and may not be labelled as one').not.toBe(row.kidSharePct)

    // ⚠ AND THE CENTS ARE THE PRIZE PART'S OWN, PICKED AND NEVER RECOMPUTED. The week's total is
    // strictly larger here, so a line that quoted `kidShareCents` against the prize rate – the exact
    // shape of a blend wearing a rule's label – would redden on this assertion.
    const prize = row.kidShareParts!.find((p) => p.source === 'prize')!
    expect(dollarsOf(lines[0]), 'the prize rule`s own money').toBe(Math.round(prize.cents / 100))
    expect(prize.cents, 'and the fixture really does pay her from two sources').toBeLessThan(row.kidShareCents!)
    expect(lines[0], 'the destination clause he asked to keep').toContain('into her own account')
  })

  it('ROUND 31 #2 – a week only a brand paid her says nothing at all', () => {
    // The other half of «что за Her sponsor cut 85% мне каждую неделю пишут»: on a week with no prize
    // money there is no prize rule to state, so the card is silent rather than reaching for the one
    // rule he did not ask about. ⚠ The fixture is the mixed week with its prize part removed, so
    // `kidShareCents` is still large and positive – a card that fell back to the total would print a
    // sentence here, which is what this arm exists to catch.
    const base = mixed(paid())
    const snap: Snapshot = {
      ...base,
      finance: {
        ...base.finance,
        weekly12: base.finance.weekly12.map((p) =>
          p.kidShareParts ? { ...p, kidShareParts: p.kidShareParts.filter((k) => k.source !== 'prize') } : p,
        ),
      },
    }
    const row = snap.finance.weekly12.find((p) => p.week === snap.week)!
    expect(row.kidShareCents, 'she really was paid this week, just not by a tournament').toBeGreaterThan(0)
    expect(
      recap(snap).findAll('.recap-finance .recap-memo:not(.recap-memo-coach) .recap-memo-line'),
      'no prize, no sentence',
    ).toHaveLength(0)
  })

  it('ROUND 31 #2 – a week banked before the parts existed says nothing rather than a blend', () => {
    // ⚠⚠ THE FORWARD-ONLY RULE, AND THE REASON THE FALLBACK HAD TO GO RATHER THAN SHRINK. A week with
    // only `kidSharePct` on the wire carries the blend and nothing else, and on a mixed week that
    // number is exactly the «61%» he reported. Printing it under the shorter label would restore
    // round 30 #21's defect with the warning removed, so the card prints nothing at all.
    const snap = withoutParts(mixed(paid()))
    const row = snap.finance.weekly12.find((p) => p.week === snap.week)!
    expect(row.kidSharePct, 'the legacy wire still carries the blend').toBeGreaterThan(0)
    expect(row.kidShareParts, 'and carries no parts, which is what makes it legacy').toBeUndefined()
    expect(
      recap(snap).findAll('.recap-finance .recap-memo:not(.recap-memo-coach) .recap-memo-line'),
      'a missing line is honest; a wrong percentage is not',
    ).toHaveLength(0)
  })

  it('ROUND 30 #21 – a single-rule week keeps his sentence to the character', () => {
    // ⚠⚠ INVARIANT 4, AS AN ASSERTION. Item 21 licensed the mixed week and nothing else, so the line
    // he approved must survive untouched wherever one rule governs – which is every week in the game
    // before the manager's commission shipped, and most weeks after it. `paid()` is prize-only, and
    // the fix must render it through the SAME branch and come out byte-identical.
    const snap = paid()
    const row = snap.finance.weekly12.find((p) => p.week === snap.week)!
    const lines = recap(snap)
      .findAll('.recap-finance .recap-memo:not(.recap-memo-coach) .recap-memo-line')
      .map((n) => clean(n.text()))
    expect(lines, 'one rule, one sentence').toHaveLength(1)
    expect(lines[0]).toBe(`Her cut ${row.kidSharePct}% – ${formatCents(row.kidShareCents!)} into her own account.`)
    // ...and the source word the mixed shape adds stays OFF this line: it is his string, unchanged.
    expect(lines[0], 'no source word on a week that has only one').not.toMatch(/Her (prize|sponsor) cut/)
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
