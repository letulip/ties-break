// ⭐⭐ ROUND 29 PART TWO #13 – THE COACH'S CUT ON THE WEEKLY SCREEN.
//
// THE OWNER, 29.08: «вот и можно как раз добавить cut тренера на weekly экране для прозрачности.»
//
// ⚠ THIS IS THE FOLLOW-UP, NOT THE ITEM. Part-one #13 asked for the RULE – «эта информация стоит
// того, чтобы добавить её на странице тренеров» – and shipped it as one sentence on the Coaches tab
// (tests/component/round29-coach-share.test.ts). This is the second half he asked for and nobody
// briefed: the FIGURE, on the week he actually reads.
//
// ⚠⚠ A MEMO AND NOT A ROW, WHICH IS THE OPPOSITE OF HER CUT AND FOR THE OPPOSITE REASON, and it is
// the trap in this item. Her cut is a ROW in the Finances column because those cents never entered
// the family ledger at all, so the column only adds up when the gross, the cut and the remainder are
// all in it. The coach's share IS a family expense – `finalizeTournament` writes it through
// `addEvent` as a real `coaching` row the same tick – so it is ALREADY inside `Spent`, and a fourth
// row would make the column charge one cheque twice. §2 is the arm that says so.
//
// ⚠⚠ AND THE PERCENTAGE IS READ FROM `staffResultShareBps`, NEVER TYPED – part-one #13's binding
// rule, and the reason it is binding: a line that describes a rule must be pinned to the rule, or a
// retune of `ECONOMY.staffShare` moves the cheque and leaves the sentence behind. §3 proves it by
// moving the constant and watching the screen follow.
//
// ⚠ MOUNTED, NOT PINNED – CLAUDE.md's own rule, and specific to this card: the tile reads
// `snapshot.finance.weekly12` while its neighbours read `snapshot.events`, and the last time this
// card was wrong (05.08, the owner's «Income +$0 · Spent +$0» save) EVERY source pin on it was green.
//
// ⚠ MUTATION-VERIFIED, six, each applied alone against this file and reverted. THE RED COUNTS BELOW
// ARE MEASURED AND NOT PREDICTED, and the second one is why: the double-count mutation this whole
// file exists to catch PASSED the first draft, and the log had confidently said it would not.
//   1. `accrueCoachCut` never called from `finalizeTournament` -> 5 red (§1's two, §2's «no row»
//      arm on its trailing existence check, §3's two). ⚠ My prediction said §2 would stay green;
//      it does not, because that arm ends by asserting the memo IS there. Measured, not assumed.
//   2. the memo added to `financeRows` as a fourth signed row – THE DOUBLE-COUNT REBUILT:
//      * inserted into the GROSS-SPLIT branch -> the both-shapes arm reddens ALONE... and the first
//        draft of this file, which had no such arm, went GREEN THROUGH IT. `financeRows` has two
//        early returns and only one of them was ever mounted. The arm exists because of this run.
//      * inserted into the netted `[Income, Spent]` branch -> §2's other two arms redden together.
//   3. `coachCutPct` hard-coded to 12 in the memo string -> §3's two arms, and only those.
//   4. the `v-if="coachCutMemo"` guard removed -> §4's two arms, and only those.
//   5. `staffResultShareBps('coach', …)` -> `('masseur', …)` at the accrue site -> §3's two arms
//      (the screen quotes 3% while the coach was charged 10%).
import { describe, it, expect, beforeEach, vi } from 'vitest'

// The fixture is a handful of ticks, but the runner is shared with heavier suites.
vi.setConfig({ testTimeout: 60_000 })
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import WeekRecapCard from '../../src/components/WeekRecapCard.vue'
import { useGameStore } from '../../src/stores/game'
import {
  KID_ID,
  closeTournament,
  createWorld,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { openingCoachId } from '../../src/engine/world/coachMarket'
import { ECONOMY, staffResultShareBps } from '../../src/engine/economy'
import { rngFromSeed } from '../../src/engine/rng'
import { TIERS, WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import type { SeasonEvent, TierId } from '../../src/engine/season/types'

/** `round29-coach-share.test.ts`'s own seed trick: a private injury sub-stream that cannot fire
 *  before `through`, so a random layoff cannot turn the driven play week into a walkover and quietly
 *  make every assertion below vacuous. */
function injuryProofSeed(prefix: string, through: number): string {
  const cap = ECONOMY.availability.injuryChanceCap
  for (let i = 0; i < 400; i++) {
    const seed = `${prefix}-${i}`
    let ok = true
    for (let w = 1; w <= through && ok; w++) if (rngFromSeed(`${seed}:injury:${w}`)() < cap) ok = false
    if (ok) return seed
  }
  throw new Error('no injury-proof seed found')
}

/** ⭐ A REAL DRIVEN FINISH, `round29-coach-share.test.ts`'s driver – `finishes[KID_ID]` is exactly
 *  what `finalizeTournament` reads, so this asks the shipped function the real question. The
 *  tournament is then RESOLVED, which is the point: the memo has to arrive through the same tick
 *  that debited the wallet, not from a hand-set ledger row. */
function weekOf(
  prefix: string,
  finish: number,
  coached = true,
  /** ⚠⚠ THE CARD HAD TWO SHAPES AND THIS PICKED WHICH ONE WAS UNDER TEST, WHICH A MUTATION FOUND
   *  RATHER THAN A DESIGN. `financeRows` used to return `[Income, Spent]` on a week that split no
   *  cheque with her and `[Before her cut, Her cut N%, Other income, Spent]` on a week that did –
   *  two early returns – and the first draft of §2 only ever mounted the first, so a coach row
   *  inserted into the SECOND passed every arm in this file.
   *  ⚠ ROUND 30 #1 COLLAPSED THE TWO SHAPES BACK INTO ONE at the owner's instruction («вернуть все
   *  цифры и надписи как было до этого: Income / Spent / Balance… Всё остальное лишнее»), so the
   *  column is the pair on every week. THE FLAG STAYS, AND SO DOES THE ARM IT DRIVES: what it now
   *  selects is a week carrying her cut AND the coach's at once – still the case the mutation
   *  escaped through, still the ordinary week for a player, and the arm that would catch either memo
   *  being folded into the column.
   *  ⚠ `fromAge18` also makes the fixture the realistic one: a title with a coach on the payroll is
   *  something that happens to a nineteen-year-old, not to the fourteen-year-old `createWorld`
   *  hands back. */
  fromAge18 = false,
  tier: TierId = 'w15',
): { world: WorldState; snap: Snapshot } {
  const world = createWorld(injuryProofSeed(prefix, 6), DEFAULT_PROFILE)
  world.bestFinishByTier.w15 = 0 // the professional ladder is open – the track is `wta`
  world.coachId = coached ? openingCoachId(world.seed, { ...world.profile, coachTier: 'middle' }) : null
  world.physioActive = false
  world.season = []
  if (fromAge18) world.week = WEEKS_PER_YEAR * 5
  const event: SeasonEvent = {
    id: `r29p2-13-${prefix}`,
    week: world.week + 5,
    tier,
    surface: 'hard',
    travelCostCents: 500_00,
    deadlineWeek: world.week + 3,
  }
  world.season.push(event)
  world.entries.push(event.id)
  const rng = rngFromSeed(world.seed)
  while (world.week < event.week) tickWeek(world, rng)
  expect(world.pendingTournament, 'the reveal spawned').not.toBeNull()
  world.pendingTournament!.result.finishes[KID_ID] = finish
  skipTournament(world)
  closeTournament(world)
  return { world, snap: toSnapshot(world) }
}

function recap(snap: Snapshot) {
  useGameStore().snapshot = snap
  return mount(WeekRecapCard, { global: { stubs: { teleport: true } } })
}

const clean = (s: string) => s.replace(/\s+/g, ' ').trim()

/** The numbers as a player has them: parsed back out of the RENDERED string, never read off the
 *  snapshot. `week-recap-kid-share.test.ts`'s helper, unchanged. */
function dollarsOf(text: string): number {
  const m = clean(text).match(/([+-]?)\$([\d,]+)/)
  if (!m) throw new Error(`no money in ${JSON.stringify(text)}`)
  return (m[1] === '-' ? -1 : 1) * Number(m[2].replace(/,/g, ''))
}

// =================================================================================================
// 1 – IT IS ON THE WEEKLY SCREEN, AND IT SAYS THE FIGURE THE COACH WAS ACTUALLY PAID
// =================================================================================================
describe('round 29 part two #13 §1 – the cut is on the week he reads', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐ a real title week prints the coach`s cut, and it is the cents that left the wallet', () => {
    const { world, snap } = weekOf('title', 0)
    // ⚠ THE ARM CONTAINS THE THING IT IS MEASURING: the tick really charged a coaching share, read
    // off the expense row rather than recomputed, so a fixture where nobody was paid fails HERE.
    const row = world.events.find(
      (e) => e.week === snap.week && e.text.startsWith("Coach's share of the prize money"),
    )
    expect(row, 'the driven title really paid the coach').toBeTruthy()
    const charged = -(row!.amountCents ?? 0)
    expect(charged).toBeGreaterThan(0)

    const wrapper = recap(snap)
    const memo = wrapper.find('.recap-memo-coach')
    expect(memo.exists(), 'the weekly screen says it').toBe(true)
    expect(dollarsOf(memo.text()) * 100, 'and the figure is the one the till charged').toBe(
      Math.round(charged / 100) * 100,
    )
    wrapper.unmount()
  })

  it('⭐ it names where the money already is, so nobody adds it a second time', () => {
    const { snap } = weekOf('title-copy', 0)
    const line = clean(recap(snap).get('.recap-memo-coach').text())
    expect(line, 'it is the coach`s cut').toContain("Coach's cut")
    expect(line, 'and it says the spending above already contains it').toContain('inside Spent above')
    // House copy law: short dash, no Cyrillic, nothing outside printable ASCII plus the dash.
    expect(line).not.toContain('—')
    expect(line).toMatch(/^[\x20-\x7e–]+$/)
  })
})

// =================================================================================================
// 2 – AND IT IS A MEMO: the column still adds up, and no row was added to it
// =================================================================================================
describe('round 29 part two #13 §2 – a memo, never a row', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐ the rendered rows still ADD UP to the rendered balance on a week that paid the coach', () => {
    // Round 29 part two #1's arm, re-asked on a coach-paying week: the figures a player can see are
    // added, and nothing reaches into the snapshot to get them. A memo that had joined the column
    // would double-charge the family for one cheque and this is where that shows.
    const { snap } = weekOf('sum', 0)
    const tile = recap(snap).find('.recap-finance')
    const vals = tile.findAll('.recap-rows .recap-row-val').map((n) => dollarsOf(n.text()))
    const balance = dollarsOf(tile.find('.recap-balance').text())
    const summed = vals.reduce((a, b) => a + b, 0)
    // ⚠ TOLERANCE IS THE DISPLAY ROUNDING AND NOTHING ELSE – one dollar per rendered row, the house
    // rule of «round the display, not the logic» doing exactly what it is supposed to do.
    expect(Math.abs(summed - balance)).toBeLessThanOrEqual(vals.length)
  })

  it('⭐⭐ ...and no row in that column is about the coach at all', () => {
    const { snap } = weekOf('no-row', 0)
    const tile = recap(snap).find('.recap-finance')
    const keys = tile.findAll('.recap-rows .recap-row-key').map((n) => clean(n.text()))
    expect(keys.length, 'the column really has rows to look at').toBeGreaterThan(0)
    for (const key of keys) expect(key, 'the coach is not a row in the sum').not.toContain('Coach')
    // ...and the memo really is outside the rows, under the balance where the owner put her cut.
    expect(tile.find('.recap-memo-coach').exists()).toBe(true)
  })

  it('⭐⭐ ...ON A WEEK CARRYING BOTH CUTS, which is the arm a mutation had to teach this file', () => {
    // ⚠⚠ THE FIRST DRAFT OF §2 MOUNTED ONE SHAPE AND WAS THEREFORE HALF DEAD. `financeRows` HAD two
    // early returns – the netted `[Income, Spent]` pair on a week that split no cheque with her, and
    // a four-row gross column on a week that did – and the double-count mutation inserted into the
    // SECOND one passed every assertion in this file. The measurement is in the file header.
    //
    // ⚠ RE-AIMED BY ROUND 30 #1, NOT DELETED. The owner sent the four-row column back – «вернуть все
    // цифры и надписи как было до этого: Income / Spent / Balance… Всё остальное лишнее,
    // дублирующее и сбивает с толку» – so there is one shape now and the arm's subject changes from
    // «the other shape» to «the week that carries BOTH cuts». That is still the ordinary case for a
    // player (an eighteen-year-old winning a title with a coach on the payroll) and still the arm
    // that reddens if either memo is ever folded into the column.
    const { world, snap } = weekOf('both-shapes', 0, true, true)
    const point = snap.finance.weekly12.find((p) => p.week === snap.week)
    expect(point?.kidShareCents, 'the fixture really is on the gross-split shape').toBeGreaterThan(0)
    expect(point?.coachCutCents, 'and the coach really was paid on the same week').toBeGreaterThan(0)
    expect(
      world.events.some((e) => e.text.startsWith("Coach's share of the prize money")),
      'from a real coaching row, not a hand-set memo',
    ).toBe(true)

    const tile = recap(snap).find('.recap-finance')
    const keys = tile.findAll('.recap-rows .recap-row-key').map((n) => clean(n.text()))
    // ⚠ RE-AIMED BY ROUND 30 #1 – this line read `.toBe('Before her cut')` while the gross column
    // existed. It asserts the same thing it always did: that the fixture really put the shape under
    // test on screen, so the loop below cannot pass by looking at nothing.
    expect(keys, 'his restored column really is the shape on screen').toEqual(['Income', 'Spent'])
    expect(tile.find('.recap-memo').exists(), 'and her cut is on this week too, as a memo').toBe(true)
    for (const key of keys) expect(key, 'and the coach is not a row in THIS column either').not.toContain('Coach')

    const vals = tile.findAll('.recap-rows .recap-row-val').map((n) => dollarsOf(n.text()))
    const balance = dollarsOf(tile.find('.recap-balance').text())
    expect(Math.abs(vals.reduce((a, b) => a + b, 0) - balance)).toBeLessThanOrEqual(vals.length)
    expect(tile.find('.recap-memo-coach').exists(), 'the memo is still under the balance').toBe(true)
  })
})

// =================================================================================================
// 3 – THE PERCENTAGE IS THE ENGINE'S, AND IT MOVES WITH IT
// =================================================================================================
describe('round 29 part two #13 §3 – the sentence is pinned to the rule', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐ the rate on screen is `staffResultShareBps`, on a title and on a runner-up', () => {
    for (const [finish, idx] of [[0, 0], [1, 1]] as const) {
      const { snap } = weekOf(`rate-${finish}`, finish)
      const line = clean(recap(snap).get('.recap-memo-coach').text())
      const pct = Number(line.match(/([\d.]+)%/)![1])
      expect(pct, `finish ${finish} quotes the engine's own rate`).toBe(staffResultShareBps('coach', idx) / 100)
      // ⚠ AND THE FIGURE IS THAT RATE OF THE GROSS CHEQUE, which is the join between the sentence
      // and the cheque – `finalizeTournament` takes the share off the tournament's own prize table.
      const prize = TIERS.w15.prizeCents![idx]
      expect(dollarsOf(line), 'and the money agrees with the rate it quotes').toBe(
        Math.round(Math.round((prize * pct) / 100) / 100),
      )
    }
  })

  it('⭐ move `ECONOMY.staffShare` and the screen follows – the absurd-value check', () => {
    // CLAUDE.md's cheapest provenance check, as an arm: a template that had typed «10%» would sit
    // still here while the cheque moved. ⚠ The world is DRIVEN under the moved constant, so this
    // measures the ledger and the card together rather than the card alone.
    const saved = ECONOMY.staffShare.coach.titleBps
    Object.assign(ECONOMY.staffShare.coach, { titleBps: 3300 })
    try {
      const { snap } = weekOf('moved-rate', 0)
      const line = clean(recap(snap).get('.recap-memo-coach').text())
      expect(line).toContain("Coach's cut 33%")
    } finally {
      Object.assign(ECONOMY.staffShare.coach, { titleBps: saved })
    }
  })
})

// =================================================================================================
// 4 – AND IT IS SILENT ON EVERY WEEK THE RULE DID NOT PAY
// =================================================================================================
describe('round 29 part two #13 §4 – silent where the rule pays nothing', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐ a semi-final pays no share, so there is no memo – his own «nothing below a final»', () => {
    const { world, snap } = weekOf('semi', 2)
    expect(
      world.events.some((e) => e.text.startsWith("Coach's share of the prize money")),
      'the engine really wrote no coaching share',
    ).toBe(false)
    expect(recap(snap).find('.recap-memo-coach').exists(), 'and the card says nothing').toBe(false)
  })

  it('⭐ a self-coached family owes nothing, and the card is silent for them too', () => {
    const { world, snap } = weekOf('self-coached', 0, false)
    expect(world.coachId, 'the seat really is empty').toBeNull()
    expect(recap(snap).find('.recap-memo-coach').exists()).toBe(false)
  })
})
