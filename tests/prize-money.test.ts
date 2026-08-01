import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  KID_ID,
  createWorld,
  closeTournament,
  enterEvent,
  prizeCentsFor,
  recomputeKidRank,
  skipTournament,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { ECONOMY } from '../src/engine/economy'
import type { FamilyBackground } from '../src/shared/protocol'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { TierId } from '../src/engine/season/types'

// =================================================================================================
// A2 — PRIZE MONEY (task #17, docs/specs/adult-tour-and-endings.md §3).
//
// The slice's three load-bearing rules, each of which is a DESIGN decision that reads like a bug if
// you meet it without the argument, and each of which therefore gets a test rather than a comment:
//
//   1. the junior tour pays NOTHING, ever – juniors pay to play, which is the whole "invest without
//      knowing the return" thesis and the reason six of the nine rungs have no payout table at all;
//   2. a first-round loss is NOT zero on the adult tour – it is a token, an insult against the price
//      of the trip, and the player is meant to feel the exact week the arithmetic flips;
//   3. the cheque does NOT scale with the wealth corridor. Travel, coaching and medical all do. This
//      is the one number in the game that is identical for a working family and a wealthy one.
//
// Rule 3 is the one most likely to be broken by accident – every other money line in the engine is
// priced by background, so passing a world or a profile into a payout would look like consistency –
// so it is asserted three ways: on the function's signature, on the table, and on a real career.
// =================================================================================================

const WTA_TIERS = TIER_LADDER.filter((t) => TIERS[t].track === 'wta')
const JUNIOR_TIERS = TIER_LADDER.filter((t) => TIERS[t].track !== 'wta')

describe('A2/1 — the junior tour pays nothing, ever', () => {
  it('no domestic or junior rung has a payout, at any finish', () => {
    expect(JUNIOR_TIERS.length).toBe(6)
    for (const tier of JUNIOR_TIERS) {
      expect(TIERS[tier].prizeCents, tier).toBeUndefined()
      for (let finish = 0; finish < TIERS[tier].points.length; finish++) {
        expect(prizeCentsFor(tier, finish), `${tier} finish ${finish}`).toBe(0)
      }
    }
  })

  it('a J300 title – the biggest thing a junior can win – is worth exactly $0', () => {
    expect(prizeCentsFor('j300', 0)).toBe(0)
    expect(TIERS.j300.points[0]).toBe(300) // ...and 300 points, which is the trade the game is about
  })
})

describe('A2/2 — the adult tour pays, and a first-round loss is a token rather than nothing', () => {
  it('every W rung pays once per finish, strictly decreasing, and never 0', () => {
    expect(WTA_TIERS).toEqual(['w15', 'w35', 'w100'])
    for (const tier of WTA_TIERS) {
      const table = TIERS[tier].prizeCents!
      expect(table.length, `${tier} pays once per finish`).toBe(TIERS[tier].points.length)
      for (const cents of table) {
        expect(Number.isInteger(cents), `${tier} whole cents`).toBe(true)
        expect(cents, `${tier} never zero`).toBeGreaterThan(0)
      }
      for (let i = 1; i < table.length; i++) {
        expect(table[i], `${tier} finish ${i}`).toBeLessThan(table[i - 1])
      }
    }
  })

  // ⚠ THE OPPOSITE SHAPE TO `points`, AND DELIBERATELY SO. Wave B made the last element of every
  // `points` array 0, because the real ITF table pays no ranking points until you win a main-draw
  // match (Reg 31(a)) and a participation floor was the engine of the "just play J30s" degeneracy.
  // Prize money is not the ranking table: the tournament pays everybody who turns up, and the fact
  // that it pays them almost nothing is the design. If these two ever agree, one of them is wrong.
  it('the LAST element is 0 for points and non-zero for money, at every adult rung', () => {
    for (const tier of WTA_TIERS) {
      expect(TIERS[tier].points.at(-1), `${tier} points`).toBe(0)
      expect(TIERS[tier].prizeCents!.at(-1), `${tier} money`).toBeGreaterThan(0)
    }
  })

  // The cliff, stated as arithmetic rather than as prose. Trip = entry fee + travel, quoted at the
  // calendar's own band; the middle family's corridor is ~1.0, so these are read straight.
  it('a first-round exit is an insult against the trip, and W15 barely pays even for winning it', () => {
    const shares = WTA_TIERS.map((tier) => {
      const def = TIERS[tier]
      const cheapestTrip = def.entryFeeCents + def.travelCostCents[0]
      // an opening loss never covers the trip at ANY rung, even the cheapest possible version of it
      expect(def.prizeCents!.at(-1)!, `${tier} R1`).toBeLessThan(cheapestTrip)
      return def.prizeCents!.at(-1)! / cheapestTrip
    })
    // At the ENTRY rung it is a token and nothing else: ~10% of the cheapest trip she can make.
    expect(shares[0], 'w15 R1 share of the trip').toBeLessThan(0.15)
    // ...and it climbs with the ladder – w15 ~10%, w35 ~17%, w100 ~36%. That gradient IS the feature:
    // the same result is an insult at the bottom and a real contribution three rungs up, so the week
    // the arithmetic flips is something she climbs INTO rather than something the game hands her.
    for (let i = 1; i < shares.length; i++) expect(shares[i]).toBeGreaterThan(shares[i - 1])
    // ...and at the entry rung of the professional game, WINNING THE TOURNAMENT roughly covers going
    // to it. That is docs/research/02-tennis-economics.md, not a balance failure: it is why the
    // ladder has to be climbed rather than farmed.
    const w15 = TIERS.w15
    const w15Title = w15.prizeCents![0]
    expect(w15Title).toBeGreaterThan(w15.entryFeeCents + w15.travelCostCents[0])
    expect(w15Title).toBeLessThan(w15.entryFeeCents + w15.travelCostCents[1])
    // W35 is where a good week starts paying for a bad one, and W100 is where one result changes
    // the family's year - both clear their most expensive possible trip by a real margin.
    for (const tier of ['w35', 'w100'] as TierId[]) {
      const def = TIERS[tier]
      expect(def.prizeCents![0], `${tier} title`).toBeGreaterThan(1.5 * (def.entryFeeCents + def.travelCostCents[1]))
    }
  })
})

describe('A2/3 — the cheque does NOT scale with the wealth corridor', () => {
  // (a) THE SIGNATURE. A function that cannot see the family cannot price by one; this is the
  //     enforcement mechanism, and the two assertions below are its evidence.
  it('prizeCentsFor takes a tier and a finish and nothing else', () => {
    expect(prizeCentsFor.length).toBe(2)
    const src = readFileSync(new URL('../src/engine/world.ts', import.meta.url), 'utf8')
    const decl = src.match(/^export function prizeCentsFor\(.*$/m)?.[0] ?? ''
    expect(decl).toBe('export function prizeCentsFor(tier: TierId, finish: number): number {')
  })

  // (b) THE TABLE. The corridor is a real thing that really moves other numbers, so the test proves
  //     it moves the TRIP and not the CHEQUE, on the same event, in the same run.
  it('three backgrounds pay three different travel bills for the identical prize', () => {
    const backgrounds: FamilyBackground[] = ['working', 'middle', 'wealthy']
    const trips = new Set<number>()
    for (const background of backgrounds) {
      const world = createWorld('prize-corridor', { ...DEFAULT_PROFILE, background })
      const w15 = world.season.find((e) => e.tier === 'w15')!
      trips.add(w15.travelCostCents)
      // the payout is read off the catalogue, which no background can reach
      for (let finish = 0; finish < TIERS.w15.points.length; finish++) {
        expect(prizeCentsFor('w15', finish)).toBe(TIERS.w15.prizeCents![finish])
      }
    }
    // three families, three different bills for the same week...
    expect(trips.size).toBe(3)
    // ...and the corridor really is what did it (working is cheapest, wealthy dearest)
    expect(Math.min(...trips)).toBeLessThan(Math.max(...trips))
    expect(ECONOMY.travelBgFactor.working[1]).toBeLessThan(ECONOMY.travelBgFactor.wealthy[0])
  })

  // (c) A REAL CAREER. The strongest form: the same seed, the same event, the same run, three
  //     backgrounds - and the `prize` line in the ledger is identical to the cent.
  //
  // ⚠ NOTE ADDED BY THE EQUIPMENT SLICE (docs/specs/equipment-and-serve-speed.md §2), because the
  // shape of this test's claim changed under it even though the test still passes. Background now
  // reaches her PLAY: the gear cadences differ by family, so a working girl's strings are older on
  // average and her attributes are a fraction lower at the composition point. Her FINISH can
  // therefore differ across the three arms in principle.
  //
  // It does not here - measured, the equipment gap is 0.17 skill points across a career
  // (tools/kit-bench.ts §2), far too small to move a finish in this run - and the CHEQUE could not
  // differ even if it did, because `prizeCentsFor` is a catalogue lookup keyed on tier and finish,
  // which case (b) above asserts directly and which is the structural half of the claim. If a future
  // tuning of ECONOMY.equipment ever makes this line fail, the honest reading is "she finished
  // somewhere else", NOT "the corridor reached the cheque" - check her finish before touching
  // anything about prize money.
  it('the ledger line is identical to the cent across all three backgrounds', () => {
    const paid = new Set<number>()
    const spent = new Set<number>()
    for (const background of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
      const world = playOneAdultEvent('prize-real', background)
      const prize = world.events.filter((e) => e.category === 'prize').reduce((s, e) => s + (e.amountCents ?? 0), 0)
      const travel = world.events.filter((e) => e.category === 'travel').reduce((s, e) => s + (e.amountCents ?? 0), 0)
      expect(prize, `${background} was paid`).toBeGreaterThan(0)
      paid.add(prize)
      spent.add(travel)
    }
    expect(paid.size, 'one cheque for everybody').toBe(1)
    expect(spent.size, 'three different bills to get there').toBe(3)
  })
})

describe('A2/4 — the payout lands where the points do, and nowhere else', () => {
  it('an adult run books an income event under the `prize` category, with the finish named', () => {
    const world = playOneAdultEvent('prize-event', 'middle')
    const ev = world.events.find((e) => e.category === 'prize')!
    expect(ev).toBeTruthy()
    expect(ev.type).toBe('income')
    expect(ev.amountCents).toBeGreaterThan(0)
    expect(ev.text).toMatch(/^World Tour \d+ prize money – /)
    expect(ev.text).not.toContain('—') // player copy: short dash only
    // and it is in the per-week finance ledger, so the Money breakdown can show it
    const week = world.financeWeeks.find((w) => (w.byCategory.prize ?? 0) > 0)!
    expect(week.byCategory.prize).toBe(ev.amountCents)
  })

  it('a junior career never books one, over a whole season', () => {
    const world = createWorld('prize-none')
    const rng = rngFromSeed(world.seed)
    // She is a strong junior with a full domestic and international book - and still unpaid, because
    // there is nothing on the junior tour to be paid for.
    world.results.push({ playerId: KID_ID, week: 0, points: 1500, tier: 'national' })
    for (let i = 0; i < 4; i++) world.results.push({ playerId: KID_ID, week: 0, points: 300, tier: 'j300' })
    world.fundsCents = 500_000_00
    recomputeKidRank(world)
    for (let i = 0; i < 52; i++) {
      for (const e of world.season) {
        if (world.entries.includes(e.id) || e.deadlineWeek < world.week) continue
        if (TIERS[e.tier].track === 'wta') continue // she is 14; this is the junior half of her life
        if (world.season.some((x) => x.week === e.week && world.entries.includes(x.id))) continue
        try {
          enterEvent(world, e.id)
        } catch {
          /* a gate she has not cleared - not what this case is about */
        }
      }
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
    }
    expect(world.events.some((e) => e.type === 'tournament')).toBe(true) // she really did play
    expect(world.events.some((e) => e.category === 'prize')).toBe(false)
  })
})

// =================================================================================================
// R15-5 — THE FIRST CHEQUE IS A MILESTONE (owner, 01.08: «я believe it's a very memorable moment»).
// Captured at the same commit point as the money itself, so a walkover or a skipped event can no
// more create the memory than it can create the cheque. Zero draws: capture and fire are pure
// state, so the frozen MAIN capture cannot see any of this.
// =================================================================================================
describe('R15-5 — the first prize money is a milestone, once per career', () => {
  it('captures {type: prize, tier} and fires the feed line once, with the real figure on it', () => {
    const world = playOneAdultEvent('prize-milestone', 'middle')
    const cheques = world.events.filter((e) => e.category === 'prize')
    expect(cheques.length).toBeGreaterThan(0)

    // The durable ledger holds ONE prize row, at the cheque's own week, naming the rung that paid.
    const captured = world.milestones.filter((m) => m.type === 'prize')
    expect(captured).toHaveLength(1)
    expect(captured[0].tier).toBe('w15')
    expect(captured[0].week).toBe(cheques[0].week)

    // The feed line fires once, and it carries the actual amount – "$130 for a first-round exit"
    // and "$2,200 for the title" are different memories, so the figure is the cheque's own.
    const fired = world.events.filter((e) => e.milestoneKey === 'first-prize')
    expect(fired).toHaveLength(1)
    const amount = `$${Math.round((cheques[0].amountCents ?? 0) / 100).toLocaleString('en-US')}`
    expect(fired[0].text).toBe(`💰 First prize money – ${amount} at the World Tour 15!`)
    expect(fired[0].text).not.toContain('—')

    // ...and a SECOND cheque adds nothing to either ledger: first means first.
    const rng = rngFromSeed(`${world.seed}:continue`)
    for (let i = 0; i < 80 && world.events.filter((e) => e.category === 'prize').length < 2; i++) {
      for (const e of world.season) {
        if (world.entries.includes(e.id) || e.deadlineWeek < world.week) continue
        if (e.tier !== 'w15') continue
        if (world.season.some((x) => x.week === e.week && world.entries.includes(x.id))) continue
        try {
          enterEvent(world, e.id)
        } catch {
          /* a gate – keep ticking */
        }
      }
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
    }
    expect(world.events.filter((e) => e.category === 'prize').length).toBeGreaterThan(1)
    expect(world.milestones.filter((m) => m.type === 'prize')).toHaveLength(1)
    expect(world.events.filter((e) => e.milestoneKey === 'first-prize')).toHaveLength(1)
  })
})

/** Run one career forward to a completed W15 run and stop. The kid is aged into eligibility by
 *  ticking rather than by editing, so the age gate, the entry gate and the payout are all the real
 *  ones; the ITF book is what opens W15's on-ramp (120 junior points). */
function playOneAdultEvent(seed: string, background: FamilyBackground): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background })
  const rng = rngFromSeed(world.seed)
  world.fundsCents = 500_000_00
  // A junior book that clears W15's on-ramp, dated so it stays inside the 52-week ranking window as
  // she ages into the tier. Re-stamped each season below for the same reason.
  const book = () => {
    world.results = world.results.filter((r) => r.playerId !== KID_ID)
    for (let i = 0; i < 3; i++) {
      world.results.push({ playerId: KID_ID, week: world.week, points: 60, tier: 'j60' })
    }
    recomputeKidRank(world)
  }
  book()
  for (let i = 0; i < 160; i++) {
    if (world.week % 26 === 0) book()
    for (const e of world.season) {
      if (world.entries.includes(e.id) || e.deadlineWeek < world.week) continue
      if (e.tier !== 'w15') continue
      if (world.season.some((x) => x.week === e.week && world.entries.includes(x.id))) continue
      try {
        enterEvent(world, e.id)
      } catch {
        /* too young / not ranked yet - keep ticking */
      }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
      if (world.events.some((e) => e.category === 'prize')) return world
    }
  }
  throw new Error(`${seed}/${background}: never played a W15 in 160 weeks - the fixture needs re-centring`)
}
