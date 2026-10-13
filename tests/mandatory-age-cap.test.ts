// R51 ITEM 20 – THE TOUR'S AGE CAP MEETS THE TOUR'S OBLIGATIONS, and until now no test had ever put the
// two in one world.
//
// The owner's observation (14.10): a girl entered the top 50 at seventeen, so the regime now obliges her to
// play every Slam and every 1000 and to commit to six of the ten 500s – while the same tour's age rule
// caps a seventeen-year-old at sixteen professional entries a year, and her birthday is still a third of
// the season away. Full compliance is 4 Slams + 8 x 1000 + 6 x 500 = 18 entries against a sixteen-slot
// allowance, so the obligation was unmeetable BEFORE she spent a single slot anywhere else – and the
// engine still wrote a due letter for the weeks the door had shut, charged 2 points and a counted zero for
// skipping them, and let ten such points suspend her for four weeks.
//
// The fix is the docstring's own principle («an obligation she could not have met is not an obligation»,
// world/mandatory.ts) applied to the one rule it had left out: `mandatoryBinds` and the 500 quota now read
// the SAME decision the entry door refuses with (`tierCapClosure`, world/entryCaps.ts). The reading is
// «shut at the EVENT'S OWN WEEK, on the ledger as it stands» – ability at the moment, not blame.
//
// ⚠ WHAT EACH SECTION OWNS
//   §1  the fixture is what it claims to be (a capped-out seventeen-year-old inside the gate)
//   §2  the core: a shut week silences the letter, the points, the zero row and the suspension
//   §3  the control that keeps the rule alive: an open week still binds, to the boundary slot
//   §4  the timing nuance: the EVENT's week decides, so the birthday moves the obligation back in
//   §5  the 500 quota: shut weeks leave the offered count, played weeks never do
//   §6  the structural case: sixteen slots spent on obligations, the seventeenth and eighteenth unbind
//   §7  the hazard the first draft would have had: her OWN last slot must not unbind the event she holds
//   §8  an eighteen-year-old (no allowance) is untouched, and the regime follows the door cell by cell
//
// ⚠ THE OLD BEHAVIOUR IS A NAMED MUTATION, NOT A REMEMBERED ONE (ledger at the foot of this header):
// take the clause out of `mandatoryBinds` and §2, §4 and §6 go red with the pre-fix letters, points and
// zero rows quoted in the failure. A test that cannot fail on the broken version is not it.
//
// MUTATION LEDGER – each row is ONE edit, one run and a tree-identical restore (sha256 of the three source
// files equal before and after the whole pass), measured 14.10 on this file's 27 cases:
//   M1  the clause removed from `mandatoryBinds`                          17 red (§2 x7, §3 boundary, §4 x4, §6 x4, §8 grid)
//   M2  the held-slot guard dropped (her own last slot shuts her event)    4 red (§5 played, §6 entered, §7 x2)
//   M3  quota: the cap filter removed                                      1 red (§5 allowance spent)
//   M4  quota: the played exclusion dropped (a naked closure)              1 red (§5 played)
//   M5  the clause reads `world.week` and not the event's week             4 red (§4 x2, §5 x2)
//   M6  the decision off by one (`remaining < 0`)                          17 red here + 2 in tests/age-caps.test.ts
//   M7  the decision drops the sub-cap arm                                 5 red in principles-e04 (age 14 is outside this file by design)
//   M8  the door maps the pro kind onto the sub-cap arm                    3 red in age-caps + principles-e04
// WHAT M1 QUOTES IS THE PRE-FIX COST of a girl whose door was already shut: one due letter for the Slam, a
// 2-point skip and one counted zero for not entering it; FIVE such weeks add up to 10 points (the
// suspension); and in the owner's sixteen-slot year, 12 letters where 10 belong, two skips and two zeros.

import { describe, it, expect } from 'vitest'
import { KID_ID, createWorld, kidAgeAt, seasonStartWeek, type WorldState } from '../src/engine/world'
import {
  dueMandatoriesAt,
  mandatoryBinds,
  penaltyPointsAt,
  quotaShortfallAt,
  settleMandatoryDeadlines,
  settleMandatoryMisses,
} from '../src/engine/world/mandatory'
import { annualProEntryLimit, isCappedProTier, proEntryCapUsage, tierCapClosure } from '../src/engine/world/entryCaps'
import { availabilityStatus, tierCapRefusal } from '../src/engine/world/medical'
import { cancelEntry } from '../src/engine/world/entries'
import { ECONOMY } from '../src/engine/economy'
import { isTierAgeOpen } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

/** A SEPTEMBER BIRTHDAY, so her seventeenth age-year runs from one September to the next and the season
 *  block it ends in is still a third unplayed when she turns eighteen – the owner's picture of the bug. */
const PROFILE = { ...DEFAULT_PROFILE, birthMonth: 9, birthDay: 15 }
const LIMIT_17 = annualProEntryLimit(17)

interface Year {
  world: WorldState
  /** The first week she is seventeen. */
  from: number
  /** The week she turns eighteen – the allowance ends the week before, and there is none after. */
  birthday: number
}

/** The clock is FOUND, never typed (the e04 idiom): the first week at which she is `age`. */
function firstWeekAt(world: WorldState, age: number): number {
  for (let w = 0; w < 800; w++) if (kidAgeAt(world, w) === age) return w
  throw new Error(`no week at ${age} in the first 800`)
}

/** A top-50 seventeen-year-old, built the cheapest honest way (`tests/tour-briefing.test.ts`' device): a
 *  counting W row and a rank inside the gate, both plain persisted state. The season is EMPTY so every
 *  event in a case is one that case injected – a count that read a generated calendar would be measuring
 *  the calendar. */
function seventeen(seed = 'agecap-oblige'): Year {
  const world = createWorld(seed, PROFILE)
  world.season = []
  world.seasonHistory = []
  world.results.push({ playerId: KID_ID, week: 0, points: 250, tier: 'wta250' })
  world.kidRankWta = 30
  const from = firstWeekAt(world, 17)
  const birthday = firstWeekAt(world, 18)
  world.week = from
  return { world, from, birthday }
}

/** The same girl in her eighteenth year, standing on her birthday. */
function eighteen(seed = 'agecap-oblige'): Year {
  const y = seventeen(seed)
  y.world.week = y.birthday
  return y
}

function inject(world: WorldState, week: number, tier: TierId): SeasonEvent {
  const event: SeasonEvent = {
    id: `${tier}-w${week}`,
    week,
    tier,
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: week - 2,
  }
  world.season.push(event)
  world.season.sort((a, b) => a.week - b.week)
  return event
}

const range = (n: number, start: number, step = 1): number[] => Array.from({ length: n }, (_, i) => start + i * step)

/** `weeks` professional entries on small events, written the way the door writes them: the WEEK on the pro
 *  ledger. The cap reads the ledger and nothing else, so no event has to exist for a slot to be spent. */
function spendSlots(world: WorldState, weeks: readonly number[]): void {
  world.proEntryWeeks.push(...weeks)
}

/** What the player reads and what the regime writes – each as a plain list so a failure quotes it. */
const dueLetters = (world: WorldState): string[] =>
  world.offers
    .filter((o) => o.kind === 'tour' && (o.terms as unknown as { notice?: string }).notice === 'due')
    .map((o) => o.id)
const zeroRows = (world: WorldState) => world.results.filter((r) => r.mandatoryMiss === true)
const charges = (world: WorldState): Array<[string, number]> =>
  (world.penalties ?? []).map((p) => [p.reason, p.points] as [string, number])

/** The obligations' weekly rhythm, in the order the tick keeps it: the letter at the deadline, the
 *  player's entry the same week (the deadline is inclusive), then the skip settled on the event's week.
 *  `enter` is the player; the driver writes what `enterEvent` writes (the id, and the week on the ledger). */
function runWeeks(world: WorldState, from: number, to: number, enter?: (e: SeasonEvent) => boolean): void {
  for (let w = from; w <= to; w++) {
    world.week = w
    settleMandatoryDeadlines(world)
    if (enter) {
      for (const e of world.season) {
        if (e.deadlineWeek !== w || world.entries.includes(e.id)) continue
        if (enter(e)) {
          world.entries.push(e.id)
          world.proEntryWeeks.push(e.week)
        }
      }
    }
    settleMandatoryMisses(world)
  }
}

describe('§1 the fixture is a capped-out seventeen-year-old inside the gate', () => {
  it('her clock, her allowance and the rungs the regime reads', () => {
    const { world, from, birthday } = seventeen()
    expect(kidAgeAt(world, from)).toBe(17)
    expect(kidAgeAt(world, birthday - 1)).toBe(17)
    expect(kidAgeAt(world, birthday)).toBe(18)
    expect(LIMIT_17, 'the rulebook row the owner counted against').toBe(16)
    expect(proEntryCapUsage(world, from).limit, 'no merit increase hides in the fixture').toBe(LIMIT_17)
    for (const tier of [...ECONOMY.mandatory.perEventTiers, ECONOMY.mandatory.quotaTier]) {
      expect(isTierAgeOpen(tier, 17), `${tier} is open to a seventeen-year-old`).toBe(true)
      expect(isCappedProTier(tier), `${tier} spends the pro allowance – else the clause could never speak`).toBe(true)
    }
  })

  it('...and the owner\'s arithmetic: full compliance is eighteen entries against sixteen', () => {
    const m = ECONOMY.mandatory
    // Slams and the 1000s are per-event; the 500s are a quota of `m.quota`. The calendar's own counts.
    const total = 4 + 8 + m.quota
    expect(total, 'four Slams + eight 1000s + the 500 quota').toBe(18)
    expect(total).toBeGreaterThan(LIMIT_17)
  })
})

describe('§2 a week the cap has shut obliges her to nothing', () => {
  /** Sixteen W15s spent early in the year, then the autumn Slam. */
  function spentThenSlam(spent: number) {
    const y = seventeen()
    const slam = inject(y.world, y.from + 30, 'slam')
    spendSlots(y.world, range(spent, y.from + 2))
    return { ...y, slam }
  }

  it('the door is shut AND the Slam does not bind – the same fact read twice', () => {
    const { world, slam } = spentThenSlam(LIMIT_17)
    expect(proEntryCapUsage(world, slam.week).remaining).toBe(0)
    expect(availabilityStatus(world, slam).reason, 'the entry door refuses the Slam').toBe('capped')
    expect(mandatoryBinds(world, slam)).toBe(false)
  })

  /** The whole year played out week by week, the allowance spent and the Slam still ahead. Each
   *  consequence below is its OWN test, so a regression quotes every one of them instead of stopping at
   *  the first – the pre-fix cost is read off the red run, not remembered. */
  function shutYear() {
    const y = spentThenSlam(LIMIT_17)
    runWeeks(y.world, y.from, y.birthday - 1)
    return y
  }

  it('no due letter – the desk does not write about a week she cannot enter', () => {
    const { world, slam } = spentThenSlam(LIMIT_17)
    expect(dueMandatoriesAt(world, slam.deadlineWeek)).toEqual([])
    runWeeks(world, slam.deadlineWeek - 1, slam.deadlineWeek + 1)
    expect(dueLetters(world)).toEqual([])
  })

  it('no tour penalty for skipping it', () => {
    expect(charges(shutYear().world)).toEqual([])
  })

  it('no counted zero in the 18-best window', () => {
    expect(zeroRows(shutYear().world)).toEqual([])
  })

  it('no suspension points', () => {
    const { world, birthday } = shutYear()
    expect(penaltyPointsAt(world, birthday - 1)).toBe(0)
    expect(world.suspendedUntilWeek).toBeNull()
  })

  /** Two Slams and three 1000s in the back half of the year, after the allowance is gone. */
  function fiveShut() {
    const y = seventeen()
    const tiers: TierId[] = ['slam', 'wta1000', 'wta1000', 'slam', 'wta1000']
    tiers.forEach((tier, i) => inject(y.world, y.from + 24 + i * 5, tier))
    spendSlots(y.world, range(LIMIT_17, y.from + 2))
    expect(y.from + 24 + 4 * 5, 'the fixture stays inside her seventeenth year').toBeLessThan(y.birthday)
    runWeeks(y.world, y.from, y.birthday - 1)
    return y
  }

  it('FIVE shut obligations charge nothing – two points each is what they used to cost', () => {
    expect(charges(fiveShut().world)).toEqual([])
  })

  it('...and cannot suspend her – ten points inside 52 weeks is what they used to add up to', () => {
    const { world, birthday } = fiveShut()
    expect(penaltyPointsAt(world, birthday - 1)).toBe(0)
    expect(world.suspendedUntilWeek).toBeNull()
  })
})

describe('§3 the rule is still alive for a week she has a slot for (the control arm)', () => {
  function withSlots(spent: number) {
    const y = seventeen()
    const slam = inject(y.world, y.from + 30, 'slam')
    spendSlots(y.world, range(spent, y.from + 2))
    return { ...y, slam }
  }

  it('ten slots spent, six left: the Slam binds, the letter comes, the skip costs 2 points and a zero', () => {
    const { world, from, birthday, slam } = withSlots(10)
    expect(availabilityStatus(world, slam).reason, 'the door is NOT shut').not.toBe('capped')
    expect(mandatoryBinds(world, slam)).toBe(true)
    runWeeks(world, from, birthday - 1)
    expect(dueLetters(world)).toEqual([`tour-due-${slam.id}`])
    expect(charges(world)).toEqual([['skip', ECONOMY.mandatory.skipPoints]])
    expect(zeroRows(world)).toHaveLength(1)
  })

  it('the boundary: one slot left binds, none left does not', () => {
    expect(mandatoryBinds(withSlots(LIMIT_17 - 1).world, withSlots(LIMIT_17 - 1).slam)).toBe(true)
    const shut = withSlots(LIMIT_17)
    expect(mandatoryBinds(shut.world, shut.slam)).toBe(false)
  })
})

describe('§4 THE EVENT\'S WEEK decides – the birthday brings the obligation back', () => {
  function straddle() {
    const y = seventeen()
    // Sixteen slots in her seventeenth year; one Slam four weeks before the birthday and one 1000 after it.
    spendSlots(y.world, range(LIMIT_17, y.from + 2))
    const before = inject(y.world, y.birthday - 4, 'slam')
    const after = inject(y.world, y.birthday + 4, 'wta1000')
    return { ...y, before, after }
  }

  it('same ledger, same girl: the week before the birthday is shut, the week after is not', () => {
    const { world, before, after } = straddle()
    expect(kidAgeAt(world, before.week)).toBe(17)
    expect(kidAgeAt(world, after.week)).toBe(18)
    expect(mandatoryBinds(world, before), 'her seventeenth allowance is spent').toBe(false)
    expect(mandatoryBinds(world, after), 'an eighteen-year-old has none to spend').toBe(true)
  })

  it('the answer does not depend on the week the question is asked in', () => {
    const { world, from, birthday, before, after } = straddle()
    for (const asked of [from, birthday - 1, birthday, birthday + 6]) {
      world.week = asked
      expect(mandatoryBinds(world, before), `asked in week ${asked}`).toBe(false)
      expect(mandatoryBinds(world, after), `asked in week ${asked}`).toBe(true)
    }
  })

  it('...so the post-birthday obligation is announced and enforced as before', () => {
    const { world, from, before, after } = straddle()
    runWeeks(world, from, after.week + 1)
    expect(dueLetters()).toEqual([`tour-due-${after.id}`])
    expect(charges(world)).toEqual([['skip', ECONOMY.mandatory.skipPoints]])
    expect(before.id).not.toBe(after.id)

    function dueLetters() {
      return world.offers
        .filter((o) => o.kind === 'tour' && (o.terms as unknown as { notice?: string }).notice === 'due')
        .map((o) => o.id)
    }
  })

  it('small events spent EARLIER still shut the Slam – ability at the moment, not blame', () => {
    // Fourteen of the sixteen slots on the first fourteen clean weeks of the year, two more mid-year.
    const { world, from, slam } = (() => {
      const y = seventeen()
      const s = inject(y.world, y.from + 30, 'slam')
      spendSlots(y.world, [...range(14, y.from + 1), y.from + 20, y.from + 21])
      return { ...y, slam: s }
    })()
    expect(proEntryCapUsage(world, slam.week).used).toBe(LIMIT_17)
    expect(mandatoryBinds(world, slam)).toBe(false)
    expect(from).toBeLessThan(slam.week)
  })
})

describe('§5 the 500 quota offers only the weeks the cap left open', () => {
  /** Ten 500s in the season block her birthday falls in: six before it (seventeen), four after (eighteen). */
  function quotaYear(spentWeeks: readonly number[]) {
    const y = seventeen()
    const blk = seasonStartWeek(y.birthday)
    const pre = range(6, blk + 2, 6)
    const post = [2, 6, 10, 14].map((d) => y.birthday + d)
    expect(Math.max(...pre), 'the six sit in her seventeenth year').toBeLessThan(y.birthday)
    expect(Math.max(...post), 'the four sit in the same season block').toBeLessThan(blk + 52)
    ;[...pre, ...post].forEach((w) => inject(y.world, w, 'wta500'))
    spendSlots(y.world, spentWeeks)
    return { ...y, blk, pre, post }
  }

  it('control: three slots spent, every 500 on offer – six are owed and none played', () => {
    const { world, from, blk } = quotaYear(range(3, quotaYear([]).from + 1))
    expect(quotaShortfallAt(world, blk + 51)).toBe(Math.min(ECONOMY.mandatory.quota, 10))
    expect(from).toBeGreaterThan(0)
  })

  it('the allowance spent: the six seventeen-year-old 500s leave the offer, the four after the birthday stay', () => {
    const seed = quotaYear([])
    const { world, blk } = quotaYear(range(LIMIT_17, seed.from + 1))
    expect(proEntryCapUsage(world, blk + 2).remaining).toBe(0)
    // owed = min(6, 4 on offer) = 4, none played
    expect(quotaShortfallAt(world, blk + 51)).toBe(4)
  })

  it('a 500 she PLAYED always counts as offered – shutting it would shrink what she owes below what she did', () => {
    const seed = quotaYear([])
    const pre = seed.pre
    // Sixteen slots, two of them on pre-birthday 500 weeks she actually played.
    const spent = [pre[0], pre[1], ...range(LIMIT_17 - 2, seed.from + 1)]
    const { world, blk } = quotaYear(spent)
    expect(proEntryCapUsage(world, blk + 2).remaining).toBe(0)
    // offered = 2 played + 4 after the birthday = 6; owed 6; played 2
    expect(quotaShortfallAt(world, blk + 51)).toBe(ECONOMY.mandatory.quota - 2)
  })
})

describe('§6 the structural case – sixteen slots spent on obligations, the 17th and 18th unbind', () => {
  // Calendar order: three Slams, seven 1000s and six 500s fill the allowance; the 1000 and the Slam that
  // follow them find the door shut. Four Slams + eight 1000s + six 500s is the owner's eighteen.
  const FIRST_SIXTEEN: TierId[] = [
    'slam', 'wta500', 'wta1000', 'wta500', 'wta1000', 'wta500', 'wta1000', 'slam',
    'wta500', 'wta1000', 'wta500', 'wta1000', 'slam', 'wta500', 'wta1000', 'wta1000',
  ]
  const LAST_TWO: TierId[] = ['wta1000', 'slam']

  function greedyYear() {
    const y = seventeen()
    const tiers = [...FIRST_SIXTEEN, ...LAST_TWO]
    const events = tiers.map((tier, i) => inject(y.world, y.from + 2 + 2 * i, tier))
    expect(tiers.filter((t) => t === 'slam')).toHaveLength(4)
    expect(tiers.filter((t) => t === 'wta1000')).toHaveLength(8)
    expect(tiers.filter((t) => t === 'wta500')).toHaveLength(ECONOMY.mandatory.quota)
    expect(events[17].week, 'the whole calendar sits in her seventeenth year').toBeLessThan(y.birthday)
    // The GREEDY player complies with everything the door lets her: enters whenever the door is open.
    runWeeks(y.world, y.from, y.birthday - 1, (e) => tierCapRefusal(y.world, e.tier, e.week) === null)
    return { ...y, events }
  }

  it('she fills the allowance exactly; the door is shut for the last two, and so is the obligation', () => {
    const { world, events } = greedyYear()
    expect(world.proEntryWeeks).toHaveLength(LIMIT_17)
    const [seventeenth, eighteenth] = [events[16], events[17]]
    expect(availabilityStatus(world, seventeenth).reason).toBe('capped')
    expect(availabilityStatus(world, eighteenth).reason).toBe('capped')
    expect(mandatoryBinds(world, seventeenth)).toBe(false)
    expect(mandatoryBinds(world, eighteenth)).toBe(false)
  })

  it('the letters name exactly the obligations she could still enter', () => {
    const { world, events } = greedyYear()
    const perEvent = new Set<string>(ECONOMY.mandatory.perEventTiers)
    const expected = events.slice(0, 16).filter((e) => perEvent.has(e.tier)).map((e) => `tour-due-${e.id}`)
    expect(expected).toHaveLength(10)
    expect(dueLetters(world).sort()).toEqual(expected.sort())
  })

  it('nothing is charged for the two she could not enter', () => {
    expect(charges(greedyYear().world)).toEqual([])
  })

  it('...no counted zero, and no suspension', () => {
    const { world } = greedyYear()
    expect(zeroRows(world)).toEqual([])
    expect(world.suspendedUntilWeek).toBeNull()
  })

  it('the ones she DID enter still bind (their slot is the proof), the 500s are a quota not a per-event duty', () => {
    const { world, events } = greedyYear()
    for (const e of events.slice(0, 16)) {
      expect(mandatoryBinds(world, e), `${e.tier} at ${e.week}`).toBe(ECONOMY.mandatory.perEventTiers.includes(e.tier))
    }
  })
})

describe('§7 her OWN last slot does not shut the event she holds', () => {
  /** Sixteen slots, the sixteenth being the Slam itself: the allowance is spent BY the entry. */
  function heldLast() {
    const y = seventeen()
    const slam = inject(y.world, y.from + 30, 'slam')
    spendSlots(y.world, range(LIMIT_17 - 1, y.from + 2))
    y.world.entries.push(slam.id)
    y.world.proEntryWeeks.push(slam.week)
    return { ...y, slam }
  }

  it('entered on the last slot: the allowance reads spent, and the Slam still binds', () => {
    const { world, slam } = heldLast()
    expect(proEntryCapUsage(world, slam.week).remaining).toBe(0)
    expect(tierCapClosure(world, slam.tier, slam.week), 'the raw decision IS shut').not.toBeNull()
    expect(mandatoryBinds(world, slam), 'but she holds the slot, so the door was open to her').toBe(true)
  })

  it('a LATE WITHDRAWAL from it still costs the 3 points – the forfeited slot stays on the ledger', () => {
    const { world, slam } = heldLast()
    world.week = slam.deadlineWeek + 1
    cancelEntry(world, slam.id)
    expect(world.entries).not.toContain(slam.id)
    expect(world.proEntryWeeks, 'a forfeiting exit keeps the slot').toContain(slam.week)
    expect(charges(world)).toEqual([['late-withdrawal', ECONOMY.mandatory.lateWithdrawalPoints]])
    expect(mandatoryBinds(world, slam), 'asked AFTER the exit, the same answer').toBe(true)
  })
})

describe('§8 an eighteen-year-old is untouched, and the regime follows the door', () => {
  function eighteenYear(stuffed: boolean) {
    const y = eighteen()
    const weeks = [3, 6, 9, 12].map((d) => y.birthday + d)
    const tiers: TierId[] = ['slam', 'wta1000', 'slam', 'wta1000']
    tiers.forEach((tier, i) => inject(y.world, weeks[i], tier))
    if (stuffed) spendSlots(y.world, range(40, y.birthday + 1))
    runWeeks(y.world, y.birthday, y.birthday + 14)
    return y
  }
  const outcome = (w: WorldState) =>
    JSON.stringify({
      due: dueLetters(w),
      charges: charges(w),
      zeros: zeroRows(w).length,
      suspended: w.suspendedUntilWeek,
      offers: w.offers.map((o) => o.id),
    })

  it('forty entries on the ledger change nothing for her: byte-identical to an empty ledger', () => {
    const stuffed = eighteenYear(true).world
    const empty = eighteenYear(false).world
    expect(outcome(stuffed)).toBe(outcome(empty))
    // ...and the regime is alive in both: four letters, four 2-point skips, four zeros, 8 < 10 so no suspension.
    expect(dueLetters(stuffed)).toHaveLength(4)
    expect(charges(stuffed)).toEqual(Array.from({ length: 4 }, () => ['skip', ECONOMY.mandatory.skipPoints]))
    expect(zeroRows(stuffed)).toHaveLength(4)
    expect(stuffed.suspendedUntilWeek).toBeNull()
  })

  it('cell by cell: for every age, ledger size and rung, the Slam/1000 binds exactly when the door is open', () => {
    let shut = 0
    let open = 0
    for (const age of [17, 18] as const) {
      const y = age === 17 ? seventeen('agecap-grid') : eighteen('agecap-grid')
      const base = age === 17 ? y.from : y.birthday
      const events = (['slam', 'wta1000', 'wta500'] as const).map((tier, i) => inject(y.world, base + 20 + i * 4, tier))
      for (const used of [0, LIMIT_17 - 1, LIMIT_17, LIMIT_17 + 1]) {
        y.world.proEntryWeeks = range(used, base + 1)
        for (const e of events) {
          const door = tierCapRefusal(y.world, e.tier, e.week)
          const closed = tierCapClosure(y.world, e.tier, e.week) !== null
          expect(closed, `${age} / ${used} / ${e.tier}: one decision`).toBe(door?.reason === 'capped')
          if (closed) shut++
          else open++
          if (ECONOMY.mandatory.perEventTiers.includes(e.tier)) {
            expect(mandatoryBinds(y.world, e), `${age} / ${used} / ${e.tier}`).toBe(door === null)
          }
        }
      }
    }
    expect(shut, 'the grid reaches shut cells').toBeGreaterThan(0)
    expect(open, 'and open ones').toBeGreaterThan(0)
  })
})
