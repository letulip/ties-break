// Round 12, wave A — CORRECTNESS (docs/rounds/round-12.md).
//
// The owner played three careers on the week-numbering + age-caps build and came back with 17
// items plus two bugs he found on his own screenshots. This file pins the seven correctness ones.
// R12-6 (the same-tier min gap) lives in its own commit and its own describe block at the bottom.
//
// Player copy rule throughout: the short dash "–", never "—", and no Cyrillic in anything a player
// reads.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  advanceWeeks,
  arrivalStatus,
  bookPractice,
  bookVacation,
  closeTournament,
  createWorld,
  enterEvent,
  injuryTau,
  KID_ID,
  layoffBlock,
  layoffCovering,
  layoffCoversWeek,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { avatarEmotion } from '../src/shared/avatarEmotion'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { buildSeason, isOffSeasonWeek, TIERS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { STOP_PRECEDENCE, type LossStreak } from '../src/shared/protocol'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

/** Put a controlled event on the calendar (deadline = week - 2, the engine convention). */
function injectEvent(world: WorldState, p: { week: number; tier: TierId; id?: string }): SeasonEvent {
  const e: SeasonEvent = {
    id: p.id ?? `r12-${p.week}-${p.tier}`,
    week: p.week,
    tier: p.tier,
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: p.week - 2,
  }
  world.season.push(e)
  world.season.sort((a, b) => a.week - b.week)
  return e
}

function giveKidPoints(world: WorldState, points: number): void {
  world.results.push({ playerId: KID_ID, week: world.week, points, tier: 'national' })
}

/** THE OWNER'S DEAD-CLICK STATE (R12-15), built through the public API:
 *  world.week 10, an entry on W11 whose list closed at W9 (so the fee is committed – "no refunds"),
 *  and a layoff running from W10 that swallows W11. This is the exact shape `rollInjury`'s F45-2
 *  sweep leaves behind on purpose: a post-deadline entry inside the layoff is NOT withdrawn,
 *  because there is nothing to refund. */
function deadClickWorld(seed = 'r12-15'): { world: WorldState; event: SeasonEvent } {
  const world = createWorld(seed)
  world.season = []
  world.entries = []
  world.condition = 100
  world.fundsCents = 1_000_000_00
  world.week = 8 // W11's list is still open here...
  const event = injectEvent(world, { week: 11, tier: 'local', id: 'r12-closed' })
  enterEvent(world, event.id)
  world.week = 10 // ...and by now it has shut (deadline W9).
  world.injury = { kind: 'ankle sprain', severity: 'moderate', weeksRemaining: 3, totalWeeks: 3, sinceWeek: 10 }
  return { world, event }
}

// ---------------------------------------------------------------------------------------------
describe('R12-15 — the dead Play button after an injury (the round\'s worst item)', () => {
  it('THE STATE: a post-deadline entry inside the layoff stays booked, fee committed', () => {
    const { world, event } = deadClickWorld()
    // Both halves of the state, so a future change that removes either one fails HERE rather than
    // quietly making the rest of this block vacuous.
    expect(world.entries).toContain(event.id)
    expect(world.week).toBeGreaterThan(event.deadlineWeek) // the list has closed – no refunds
    expect(layoffCovering(world, event.week)).not.toBeNull() // ...and she will still be out
  })

  it('the ARRIVAL GATE names it: injured, with a reason', () => {
    const { world, event } = deadClickWorld()
    const arrival = arrivalStatus(world, event)
    expect(arrival.verdict).toBe('injured')
    expect(arrival.detail).toBe('Injured – back in 3 weeks.')
  })

  it('THE FIX, half 1 – the advance HALTS on the walkover instead of sailing through it', () => {
    const { world } = deadClickWorld()
    const stops = advanceWeeks(world, rngFromSeed(world.seed), 5)
    expect(world.week).toBe(11)
    // The week resolved as a walkover...
    expect(world.events.some((e) => e.week === 11 && e.text.startsWith('Walkover'))).toBe(true)
    // ...and, unlike before, it SAID SO. This is the whole item: the entry fee was forfeited and
    // the old advance reported nothing at all, because the injury was not fresh that week
    // (`sinceWeek` 10, not 11), no tournament was pending, and a walkover was not a stop reason.
    expect(stops).toContain('walkover')
    expect(stops).not.toContain('injury') // the onset was LAST week – this is the point
    // The snapshot carries it, so App.vue's toast has something to show.
    expect(toSnapshot(world, stops).stopReasons).toContain('walkover')
  })

  it('THE FIX, half 2 – the button stops promising a tournament that will not happen', () => {
    const { world, event } = deadClickWorld()
    world.week = 10
    const snap = toSnapshot(world)
    // `arrival` describes the week the sticky bar's button plays, which is always week + 1.
    expect(snap.arrival).not.toBeNull()
    expect(snap.arrival!.week).toBe(snap.week + 1)
    expect(snap.arrival!.eventId).toBe(event.id)
    expect(snap.arrival!.verdict).toBe('injured')
    expect(snap.arrival!.detail).toBe('Injured – back in 3 weeks.')
  })

  it('the walkover marker fires ONCE, not on every week of the layoff', () => {
    const { world } = deadClickWorld()
    const rng = rngFromSeed(world.seed)
    expect(advanceWeeks(world, rng, 5)).toContain('walkover') // W11
    // W12 is still inside the layoff but carries no entry – nothing to forfeit, nothing to say.
    expect(advanceWeeks(world, rng, 1)).not.toContain('walkover')
    expect(world.week).toBe(12)
  })

  it('REACHABLE IN REAL PLAY, not just in a fixture', () => {
    // The state the owner hit, found by playing seed "r12-repro-12" the way a player does: enter
    // the nearest enterable event, press the button, resolve any tournament. The injury lands in
    // W4 and her W5 entry (deadline W3) is already committed.
    const world = createWorld('r12-repro-12')
    const rng = rngFromSeed(world.seed)
    let hit: { week: number; eventWeek: number } | null = null
    for (let i = 0; i < 60 && hit === null; i++) {
      if (world.injury === null && !world.pendingTournament && world.entries.length === 0) {
        for (const e of world.season) {
          if (e.week <= world.week || e.week > world.week + 4) continue
          try {
            enterEvent(world, e.id)
            break
          } catch {
            /* the gate refused – not on the table */
          }
        }
      }
      advanceWeeks(world, rng, 1)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      const entered = world.season.find((e) => world.entries.includes(e.id))
      if (
        world.injury !== null &&
        entered &&
        world.week > entered.deadlineWeek &&
        layoffCovering(world, entered.week) !== null
      ) {
        hit = { week: world.week, eventWeek: entered.week }
      }
    }
    expect(hit, 'the owner\'s dead-click state is no longer reachable – re-derive the fixture').not.toBeNull()
    // ...and on that very week the snapshot tells the truth about the button.
    expect(toSnapshot(world).arrival!.verdict).toBe('injured')
  })

  it('the walkover stop has toast copy – the R10-16 rule (no copy, no popup) works the other way too', () => {
    const app = read('../src/App.vue')
    const map = app.slice(app.indexOf('const STOP_REASON_TEXT'), app.indexOf('const stopReasons'))
    expect(map).toContain('walkover:')
    // Player copy: short dash, no Cyrillic.
    const copy = map.match(/walkover: '([^']*)'/)![1]
    expect(copy).not.toContain('—')
    expect(copy).not.toMatch(/[Ѐ-ӿ]/)
    // and it is in the precedence list, or the filter would silently drop it (R11-1's bug class)
    expect(STOP_PRECEDENCE).toContain('walkover')
  })
})

// ---------------------------------------------------------------------------------------------
describe('R12-3 — the play week re-reads the SAME rules everything else reads', () => {
  it('INJURED: the arrival gate asks layoffCovering, not a private copy of it', () => {
    const { world, event } = deadClickWorld('r12-3-injured')
    expect(arrivalStatus(world, event).verdict).toBe('injured')
    // ...and it is genuinely the SHARED window: clear the layoff and the verdict flips, with no
    // other state touched.
    world.injury = null
    expect(arrivalStatus(world, event).verdict).toBe('play')
  })

  it('INJURED: the week actually resolves as a walkover – no shadow run is staged', () => {
    const { world } = deadClickWorld('r12-3-play')
    advanceWeeks(world, rngFromSeed(world.seed), 1)
    expect(world.week).toBe(11)
    expect(world.pendingTournament).toBeNull() // she never took the court
    expect(world.events.some((e) => e.week === 11 && e.text.startsWith('Walkover'))).toBe(true)
  })

  it('the RETURN week is hers – a 1-week layoff does not swallow the week after it (R10-17)', () => {
    // The other half of the owner's report ("a 1-week layoff; the next week ... she could play
    // injured"). She is NOT injured that week: rollInjury clears the injury at the top of the
    // return week, and `layoffCovering` has always excluded it. The gate agrees, and now says so
    // through the same predicate the entry gate uses.
    const world = createWorld('r12-3-return')
    world.season = []
    world.entries = []
    world.condition = 100
    world.fundsCents = 1_000_000_00
    world.week = 8
    const event = injectEvent(world, { week: 11, tier: 'local' })
    enterEvent(world, event.id)
    world.week = 10
    world.injury = { kind: 'calf niggle', severity: 'minor', weeksRemaining: 1, totalWeeks: 1, sinceWeek: 10 }
    expect(layoffCovering(world, 11)).toBeNull() // W11 is past the window
    expect(arrivalStatus(world, event).verdict).toBe('play')
    advanceWeeks(world, rngFromSeed(world.seed), 1)
    expect(world.week).toBe(11)
    expect(world.injury).toBeNull() // cleared at the top of the return week
    expect(world.pendingTournament).not.toBeNull() // and she played
  })

  it('OUTGROWN: a committed entry still plays (R10-3) – but the verdict SAYS it is outgrown', () => {
    const world = createWorld('r12-3-outgrown')
    world.season = []
    world.entries = []
    world.condition = 100
    world.fundsCents = 1_000_000_00
    world.week = 8
    const event = injectEvent(world, { week: 11, tier: 'regional' })
    giveKidPoints(world, 100) // inside regional's [65, 230] band, so the entry is legal...
    enterEvent(world, event.id)
    world.week = 10
    giveKidPoints(world, 300) // ...and now she is past its ceiling. The list has closed.
    const arrival = arrivalStatus(world, event)
    expect(arrival.outgrown).toBe(true)
    // NOT a block, and this is the load-bearing half: turning "outgrown" into a lock on a
    // COMMITTED entry is exactly the R10-3 dead end. She plays.
    expect(arrival.verdict).toBe('play')
    // ...and the snapshot carries the fact to the button, which was the missing surface.
    const snap = toSnapshot(world)
    expect(snap.arrival!.outgrown).toBe(true)
    expect(snap.arrival!.verdict).toBe('play')
    advanceWeeks(world, rngFromSeed(world.seed), 1)
    expect(world.pendingTournament).not.toBeNull()
  })

  it('an outgrown entry that is ALSO inside the layoff reads injured first', () => {
    // Precedence mirrors availabilityStatus: the body outranks the band, and `outgrown` rides
    // along rather than competing with it.
    const { world, event } = deadClickWorld('r12-3-both')
    giveKidPoints(world, 5_000)
    const arrival = arrivalStatus(world, event)
    expect(arrival.verdict).toBe('injured')
    expect(arrival.outgrown).toBe(true)
  })

  it('the sticky-bar composable reads the ENGINE verdict, not just `entered`', () => {
    // Source guard on the SHAPE of the fix (R10-5's "one rule, many surfaces"): the label used to
    // be derived from `upcoming.find(e => e.entered && ...)` with no gate at all, and a comment
    // saying the injury layoff was "deliberately NOT a branch here".
    const src = read('../src/composables/weekAhead.ts')
    expect(src).toContain('snap.arrival')
    expect(src).not.toMatch(/upcoming\.find\([^)]*entered/)
    expect(src).toContain("arrival.verdict === 'injured'")
    expect(src).toContain('arrival.outgrown')
    // player copy: short dash, no Cyrillic, in every label this file can produce
    for (const label of src.match(/label: [`']([^`']*)[`']/g) ?? []) {
      expect(label).not.toContain('—')
      expect(label).not.toMatch(/[Ѐ-ӿ]/)
    }
  })
})

// ---------------------------------------------------------------------------------------------
describe('R12-16 — anger is a moment, not a mask', () => {
  const base = { week: 10, condition: 80, injured: false }
  const lastResult = { week: 10, won: false, lostFinal: false, tier: 'national' as const }
  const streak = (losses: number, angerAt: number): LossStreak => ({ losses, startWeek: 3, angerAt })

  it('the CROSSING loss is angry', () => {
    for (const at of [4, 5, 6]) {
      expect(avatarEmotion({ ...base, lastResult, lossStreak: streak(at, at) })).toBe('angry')
    }
  })

  it('every LATER loss in the same streak is sad again – the owner\'s actual complaint', () => {
    for (const losses of [5, 6, 7, 12, 40]) {
      expect(avatarEmotion({ ...base, lastResult, lossStreak: streak(losses, 4) })).toBe('sad')
    }
  })

  it('a NEW streak draws its own threshold, and can turn her angry again', () => {
    // The threshold is keyed on the streak's START WEEK (engine computeLossStreak), so a run that
    // begins somewhere else is a different draw – which is what makes anger reachable more than
    // once a career while staying STABLE inside any one run.
    const first = streak(4, 4)
    const second: LossStreak = { losses: 4, startWeek: 40, angerAt: 4 }
    expect(avatarEmotion({ ...base, lastResult, lossStreak: first })).toBe('angry')
    expect(avatarEmotion({ ...base, lastResult, lossStreak: second })).toBe('angry')
    // and the pin that mattered before still holds: the same streak object always decides the same
    // face, however many times it is asked.
    const twice = new Set([
      avatarEmotion({ ...base, lastResult, lossStreak: first }),
      avatarEmotion({ ...base, lastResult, lossStreak: first }),
    ])
    expect(twice.size).toBe(1)
  })

  it('the comparison in the source is `===`, not `>=`', () => {
    const src = read('../src/shared/avatarEmotion.ts')
    const code = src
      .split('\n')
      .filter((l) => !l.trim().startsWith('*') && !l.trim().startsWith('//') && !l.trim().startsWith('/*'))
      .join('\n')
    expect(code).toContain('lossStreak.losses === lossStreak.angerAt')
    expect(code).not.toContain('lossStreak.losses >= lossStreak.angerAt')
  })

  it('the softeners still outrank anger, and a win still ends it', () => {
    const crossing = streak(4, 4)
    expect(
      avatarEmotion({ ...base, lastResult: { week: 10, won: false, lostFinal: true }, lossStreak: crossing }),
    ).toBe('serious')
    expect(
      avatarEmotion({ ...base, lastResult: { ...lastResult, tier: 'local' }, lossStreak: crossing }),
    ).toBe('serious')
    expect(avatarEmotion({ ...base, lastResult: { ...lastResult, won: true }, lossStreak: crossing })).toBe('happy')
  })
})

// ---------------------------------------------------------------------------------------------
describe('R12-S1 — the season-start rank is captured, not replayed from a pruned ledger', () => {
  it('a NEW season banks the rank she carried into it, at its first week', () => {
    const world = createWorld('r12-s1-capture')
    const rng = rngFromSeed(world.seed)
    // week 0 -> 51: still season 0, so the capture must not move.
    const atStart = world.seasonStartRank
    expect(atStart).toBe(world.kidRank) // createWorld banks her opening rank (dead last)
    for (let i = 0; i < WEEKS_PER_YEAR - 1; i++) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
    }
    expect(world.week).toBe(51)
    expect(world.seasonStartRank).toBe(atStart) // untouched all season
    const carriedIn = world.kidRank
    tickWeek(world, rng) // -> week 52, the first week of season 1
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
    expect(world.week).toBe(WEEKS_PER_YEAR)
    expect(world.seasonStartRank).toBe(carriedIn)
  })

  it('THE BUG: the old replay reported #1, because the ledger behind it had been pruned', () => {
    // Reproduces the mechanism rather than trusting the prose. At the wrap week the results that
    // produced her start-of-season rank are 49+ weeks old and `pruneResults` has dropped them, so
    // "rank everyone as of yearStart" ran over an almost empty table – and competition ranking
    // gives every member of a tie the SAME rank, so the whole field came out #1.
    const world = createWorld('r12-s1-bug')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 101; i++) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
    }
    expect(world.week).toBe(101) // the season-1 wrap week
    const yearStart = WEEKS_PER_YEAR
    // Everything the old formula needed is gone: no counting result survives from before yearStart.
    const survivors = world.results.filter((r) => r.week < yearStart && r.points > 0)
    expect(survivors).toHaveLength(0)
  })

  it('a season-2 start rank is never better than her season-1 final rank purely from the reset', () => {
    // The owner's screenshots: "#89 ↓88 from #1" in BOTH careers' SECOND season. Play through to
    // that second season's wrap-up (week 153 = season 2's week 49) and check what it reports.
    const world = createWorld('r12-s1-e2e')
    const rng = rngFromSeed(world.seed)
    let season1FinalRank: number | null = null
    let season2CarriedIn: number | null = null
    for (let i = 0; i < 3 * WEEKS_PER_YEAR; i++) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      // her rank as season 1 wrapped, and the value banked as season 2 opened
      if (world.week === 2 * WEEKS_PER_YEAR - 1) season1FinalRank = world.kidRank
      if (world.week === 2 * WEEKS_PER_YEAR) season2CarriedIn = world.seasonStartRank
      if (world.week === 2 * WEEKS_PER_YEAR + 49) break // season 2's wrap-up has just fired
    }
    expect(world.week).toBe(2 * WEEKS_PER_YEAR + 49)
    const summary = world.lastSeasonSummary!
    expect(summary.startRank).not.toBeNull()
    // THE ASSERTION THE ITEM ASKS FOR: #1 is reachable only if she genuinely earned it. The window
    // reset can no longer hand it to a kid sitting three digits down the table.
    expect(summary.startRank).toBeGreaterThan(1)
    // ...and it is a rank she really held – the one she carried into season 2, which is a rank the
    // 52-week reset cannot IMPROVE, because it is read before the reset can touch anything.
    expect(summary.startRank).toBe(season2CarriedIn)
    expect(season2CarriedIn).toBe(season1FinalRank)
  })

  it('the wrap-up no longer replays the ranking at the season start', () => {
    const src = read('../src/engine/world.ts')
    const fn = src.slice(src.indexOf('function maybeFireSeasonWrapUp'), src.indexOf('// --- finish / stage labels'))
    // Comments are stripped first: the note above the fix QUOTES the old call, on purpose, so the
    // next reader can see what was replaced – and prose must never satisfy or trip a code guard.
    const code = fn
      .split('\n')
      .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*') && !l.trim().startsWith('/*'))
      .join('\n')
    expect(code).toContain('world.seasonStartRank')
    expect(code).not.toContain('computeRanking(world.results, yearStart')
  })

  it('a pre-v17 save loads with a null start rank, which every reader already handles', () => {
    const dialog = read('../src/components/SeasonSummaryDialog.vue')
    expect(dialog).toContain('summary.startRank !== null') // no "from #null" is renderable
    const migrations = read('../src/engine/migrations.ts')
    expect(migrations).toContain('save.seasonStartRank = null')
  })
})

// ---------------------------------------------------------------------------------------------
describe('R12-S2 — "Best result: best Champion"', () => {
  it('the value is the finish alone', () => {
    const world = createWorld('r12-s2')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 49; i++) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
    }
    const text = world.lastSeasonSummary!.bestResultText
    expect(text).not.toMatch(/^best /)
    // It is either a finish label or the no-tournaments sentence – never a finish with an adjective.
    expect(
      ['Champion', 'Runner-up', 'Semifinalist', 'Quarterfinalist', 'no tournaments played'].includes(text) ||
        /^Round of \d+$/.test(text),
    ).toBe(true)
  })

  it('EVERY consumer checked: nothing relied on the "best " prefix', () => {
    // The popup row (whose label already says "Best result") renders the value raw...
    // ⚠ RE-AIMED by U2 (29.07): the wrap-up popup's `<table>` became screen D's card grid – the
    // owner's ruling that the season summary is the Weekly Story at season scale
    // (docs/specs/ui-inventory.md §2, "они тождественны примерно"). The row is the same row with the
    // same label and the same value; only its element changed, `<th>Best result</th>` -> a
    // `<span class="season-key">`. The PROTECTED FACT is untouched and is what both lines below
    // still assert: this consumer prints the banked string RAW, under a label that already carries
    // the word "best", so nothing here depends on the value arriving with a "best " prefix.
    const dialog = read('../src/components/SeasonSummaryDialog.vue')
    expect(dialog).toContain('>Best result</span>')
    expect(dialog).toContain('{{ summary.bestResultText }}')
    // ...the Stats season table never used the string at all – it renders the stored INDEX through
    // finishLabel itself, so it is untouched by this change...
    const history = read('../src/components/SeasonHistoryTable.vue')
    expect(history).not.toContain('bestResultText')
    // ...and the news/milestone sentence embeds it as one clause among several, so it reads without
    // the adjective. Guard that the only two writers are the summary field and that milestone.
    const src = read('../src/engine/world.ts')
    expect(src.match(/bestText/g)!.length).toBe(3) // the const, the milestone, the summary field
  })

  it('a summary banked BEFORE this change keeps its stored wording – a recap is a record', () => {
    // The golden fixtures carry "best Champion" / "best Runner-up" and must not be rewritten: the
    // string is banked state, not a derivation, and migrating it would edit history.
    expect(read('./fixtures/saves/v16.json')).toContain('"bestResultText": "best Runner-up"')
  })
})

// ---------------------------------------------------------------------------------------------
describe('R12-4/11 — injured ON a family vacation', () => {
  function vacationWorld(seed: string): WorldState {
    const world = createWorld(seed)
    world.fundsCents = 1_000_000_00
    world.week = 10
    bookVacation(world, 11, 'staycation') // free package, so funds cannot confound the comparison
    world.week = 11
    return world
  }

  it('a vacation week multiplies tau DOWN, by exactly the knob', () => {
    const onHoliday = vacationWorld('r12-4-on')
    const working = vacationWorld('r12-4-off')
    working.vacations = [] // same world, minus the booking
    expect(injuryTau(onHoliday)).toBeCloseTo(
      injuryTau(working) * ECONOMY.availability.injuryVacationFactor,
      12,
    )
  })

  it('RARE BUT NONZERO – the owner\'s explicit instruction ("holidays do sprain ankles")', () => {
    expect(ECONOMY.availability.injuryVacationFactor).toBeGreaterThan(0)
    expect(ECONOMY.availability.injuryVacationFactor).toBeLessThan(1)
    expect(injuryTau(vacationWorld('r12-4-nonzero'))).toBeGreaterThan(0)
  })

  it('a bigger cut than any protection money can buy, and on the right side of the load axis', () => {
    // The justification for the VALUE, as an assertion: a vacation must beat the physio retainer
    // and the elite package's carry-over buff, because it removes the load entirely rather than
    // treating it – and it must never invert the axis by making a holiday safer than nothing at
    // all is possible (the factor stays a multiplier on the same fatigue-driven tau).
    const f = ECONOMY.availability.injuryVacationFactor
    expect(f).toBeLessThan(ECONOMY.physio.riskReduction)
    for (const pkg of ECONOMY.vacation.packages) expect(f).toBeLessThanOrEqual(pkg.buffFactor)
  })

  it('INVARIANCE: it is a post-draw multiply – zero draws, on any stream', () => {
    // The same discipline `physio.riskReduction` and the recovery buff follow. A career that books
    // a vacation every bookable week must leave the MAIN weekly sequence byte-identical.
    const record = (book: boolean): number[] => {
      const world = createWorld('r12-4-invariance')
      world.fundsCents = 100_000_000_00
      const base = rngFromSeed(world.seed)
      const draws: number[] = []
      const rng = () => {
        const v = base()
        draws.push(v)
        return v
      }
      for (let i = 0; i < 40; i++) {
        if (book) {
          try {
            bookVacation(world, world.week + 1, 'staycation')
          } catch {
            /* not plannable that week */
          }
        }
        tickWeek(world, rng)
        if (world.pendingTournament) {
          skipTournament(world)
          closeTournament(world)
        }
      }
      return draws
    }
    expect(record(true)).toEqual(record(false))
  })

  it('the source reads the booking, and multiplies AFTER the roll', () => {
    const src = read('../src/engine/world.ts')
    const fn = src.slice(src.indexOf('export function injuryTau'), src.indexOf('// Body-region weights'))
    expect(fn).toContain('vacationForWeek(world, world.week)')
    expect(fn).toContain('a.injuryVacationFactor')
    // injuryTau computes a THRESHOLD and never draws – that is what makes every knob in it safe.
    expect(fn).not.toContain('rngFromSeed')
  })
})

// ---------------------------------------------------------------------------------------------
describe('R12-5b — practice offered during a layoff', () => {
  it('the layoff window is ONE piece of arithmetic, shared by world- and snapshot-shaped callers', () => {
    // R10-17 made this comparison singular for the engine; R12-5b needed it on the UI side of the
    // wire, and a fourth spelling of it is exactly what the item is about.
    const world = createWorld('r12-5b-shared')
    world.week = 10
    world.injury = { kind: 'knee strain', severity: 'moderate', weeksRemaining: 5, totalWeeks: 5, sinceWeek: 10 }
    for (let w = 8; w <= 20; w++) {
      const viaWorld = layoffCovering(world, w) !== null
      const viaSnapshot = layoffBlock({ currentWeek: 10, injury: { weeksRemaining: 5 }, week: w }) !== null
      expect(viaSnapshot, `week ${w}`).toBe(viaWorld)
      expect(layoffCoversWeek(10, 5, w), `week ${w}`).toBe(viaWorld)
    }
  })

  it('the window is [now, now + weeksRemaining) – the RETURN week is hers', () => {
    const at = (week: number) => layoffBlock({ currentWeek: 10, injury: { weeksRemaining: 5 }, week })
    expect(at(10)).not.toBeNull()
    expect(at(14)).not.toBeNull() // the last covered week
    expect(at(15)).toBeNull() // back on court
  })

  it('a healthy kid is never blocked', () => {
    expect(layoffBlock({ currentWeek: 10, injury: null, week: 12 })).toBeNull()
    expect(layoffBlock({ currentWeek: 10, injury: { weeksRemaining: 0 }, week: 10 })).toBeNull()
  })

  it('the disabled reason is the SAME sentence the booking would have thrown', () => {
    const world = createWorld('r12-5b-sentence')
    world.week = 10
    world.injury = { kind: 'knee strain', severity: 'moderate', weeksRemaining: 5, totalWeeks: 5, sinceWeek: 10 }
    world.fundsCents = 1_000_000_00
    const block = layoffBlock({ currentWeek: 10, injury: { weeksRemaining: 5 }, week: 12 })!
    let thrown = ''
    try {
      // The click the sheet's live "Book the match" button would have made.
      bookPractice(world, 12, false)
    } catch (err) {
      thrown = (err as Error).message
    }
    expect(block.detail).toBe(thrown)
    // ...and it has the shape `medicalBlock` has, so the sheet can render either the same way.
    expect(block.level).toBe('blocked')
    expect(block.reason).toBe('injured')
    // player copy
    expect(block.detail).not.toContain('—')
    expect(block.detail).not.toMatch(/[Ѐ-ӿ]/)
  })

  it('the engine still REFUSES the booking – the sheet is a second line of defence, not the gate', () => {
    const world = createWorld('r12-5b-engine')
    world.week = 10
    world.injury = { kind: 'knee strain', severity: 'moderate', weeksRemaining: 5, totalWeeks: 5, sinceWeek: 10 }
    world.fundsCents = 1_000_000_00
    expect(() => bookPractice(world, 12, false)).toThrow(/Injured/)
  })
})

// ---------------------------------------------------------------------------------------------
// R12-6 lands in its OWN commit: it moves the calendar, and the calendar is what the frozen
// MAIN-stream capture's derived `kidRank` is read off. See the commit message for the re-pin.
describe('R12-6 — same-tier events never on adjacent weeks (national and above)', () => {
  const GAPPED: TierId[] = ['national', 'j300']
  const DENSE: TierId[] = ['local', 'regional', 'j30', 'j60']

  /** Every week a tier occupies in one generated season block, ascending. */
  function weeksOf(events: SeasonEvent[], tier: TierId): number[] {
    return events.filter((e) => e.tier === tier).map((e) => e.week).sort((a, b) => a - b)
  }

  it('THE BUG: two Nationals could land on consecutive weeks – now they never do', () => {
    // Swept wide, because the owner saw it twice in ONE season: a handful of seeds would not have
    // caught it, and a handful would not prove it gone either.
    let checked = 0
    for (let block = 0; block < 40; block++) {
      const events = buildSeason(`r12-6-sweep:s${block}`, block * 52, 52)
      for (const tier of GAPPED) {
        const weeks = weeksOf(events, tier)
        expect(weeks.length, `${tier} block ${block}`).toBeGreaterThan(0)
        for (let i = 1; i < weeks.length; i++) {
          expect(weeks[i] - weeks[i - 1], `${tier} block ${block}: W${weeks[i - 1]} and W${weeks[i]}`)
            .toBeGreaterThanOrEqual(TIERS[tier].minGapWeeks!)
        }
        checked++
      }
    }
    expect(checked).toBe(80)
  })

  it('THE R9-20 EXTRAS are what needed it – the count is untouched, only the placement', () => {
    // The fix must not cost her the two extra Nationals R9-20 added: 52/13 = 4 base + 2 bonus.
    for (let block = 0; block < 20; block++) {
      const events = buildSeason(`r12-6-count:s${block}`, block * 52, 52)
      expect(weeksOf(events, 'national')).toHaveLength(6)
      expect(weeksOf(events, 'j300')).toHaveLength(4)
    }
  })

  it('THE DENSE ENTRY RUNGS ARE UNTOUCHED – they are dense by design', () => {
    // j30 every 2 weeks is 26 events over 49 placeable weeks; a gap of 2 could not fit and should
    // not be wanted. The knob is deliberately absent on all four, and adjacency still happens there.
    for (const tier of DENSE) expect(TIERS[tier].minGapWeeks).toBeUndefined()
    let sawAdjacent = false
    for (let block = 0; block < 10 && !sawAdjacent; block++) {
      const weeks = weeksOf(buildSeason(`r12-6-dense:s${block}`, block * 52, 52), 'j30')
      for (let i = 1; i < weeks.length; i++) if (weeks[i] - weeks[i - 1] === 1) sawAdjacent = true
    }
    expect(sawAdjacent, 'the dense tiers lost their density – the gap leaked past its knob').toBe(true)
  })

  it('the off-season stays event-free, and the gap did not eat into it', () => {
    for (let block = 0; block < 20; block++) {
      for (const e of buildSeason(`r12-6-off:s${block}`, block * 52, 52)) {
        expect(isOffSeasonWeek(e.week), `${e.tier} W${e.week}`).toBe(false)
      }
    }
  })

  it('still deterministic, and still one event per tier per week', () => {
    const a = buildSeason('r12-6-det', 0, 52)
    const b = buildSeason('r12-6-det', 0, 52)
    expect(a).toEqual(b)
    const byTierWeek = new Set(a.map((e) => `${e.tier}@${e.week}`))
    expect(byTierWeek.size).toBe(a.length)
  })
})
