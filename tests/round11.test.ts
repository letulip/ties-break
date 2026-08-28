import { describe, it, expect, vi } from 'vitest'
import { worldFunction, worldSource } from './worldSource'
import { readFileSync } from 'node:fs'

// Two of these replay whole careers (49 and 101 weeks, plus a 101-week bench career with a real
// entry policy). Deterministic but slow, and the suite runs eight files in parallel – same
// generous file-level timeout the econ/fatigue benches carry, same reason.
vi.setConfig({ testTimeout: 240_000 })

import {
  createWorld,
  tickWeek,
  advanceWeeks,
  enterEvent,
  toSnapshot,
  financeWindow,
  seasonStartWeek,
  skipTournament,
  closeTournament,
  STARTING_FUNDS_CENTS,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import { STOP_PRECEDENCE, type StopReason, type WorldEventCategory } from '../src/shared/protocol'
import { openCareer, stepCareerWeek, PRESETS } from '../tools/econ-bench'
import type { SeasonEvent, TierId } from '../src/engine/season/types'
import { after, region } from './helpers/source'

// ===========================================================================
// ROUND 11 — WAVE A (correctness).
//
//   R11-1   the injury popup is lost whenever another stop fires the same week
//   R11-12a the season wrap-up spend does not match the wallet
//
// Both were owner playtest findings, and both were the same KIND of bug: a place where the engine
// had to pick ONE answer to a question that has several ("why did the week stop?", "what did the
// season cost?") and the surface that asked was left with a different answer from the surface next
// to it.
// ===========================================================================

const WRAP_OFFSET = WEEKS_PER_YEAR - OFF_SEASON_WEEKS // 49 – the season's first off-season week
const APP = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')

/** The occurrence roll is a single pull off the PRIVATE `seed:injury:<week>` stream, compared
 *  against injuryTau. A roll at or above the chance CAP can never fire, whatever her state; a roll
 *  below the condition-0 tau fires as soon as she is run down. Both directions are needed to place
 *  an injury on an exact week – the same seed-search idiom tests/injuries.test.ts uses. */
const injuryRollAt = (seed: string, week: number): number => rngFromSeed(`${seed}:injury:${week}`)()
/** tau at condition 0, age 14, no play, no physio: clamp(.006 + 100*.0009) = .096, x0.9 age = .0864
 *  (the same figure tests/injuries.test.ts derives; x0.9 again here for margin). */
// ⚠ DERIVED FROM THE KNOBS SINCE W2-FATIGUE, NOT WRITTEN DOWN. It was the literal 0.0864 that the
// shipped trio (base .006 + slope .0009 x 100 fatigue, x0.9 for age 14) happened to produce, and the
// injury re-calibration (docs/specs/fatigue-reprice-2026-08.md §5) moved all three under it: the same
// composition is now 0.0162, and every fixture that hunts a firing seed against it went quiet at once.
// A constant that has to be recomputed by hand whenever the model is tuned is a trap, so it is
// computed here the way `injuryTau` computes it - the fixtures track the engine from now on.
const TAU_C0_AGE14 =
  Math.min(
    ECONOMY.availability.injuryBaseChance + 100 * ECONOMY.availability.injuryFatigueSlope,
    ECONOMY.availability.injuryChanceCap,
  ) * ECONOMY.availability.ageInjuryFactor[14]

function findSeed(prefix: string, fires: number[], quiet: number[]): string {
  for (let i = 0; i < 8000; i++) {
    const seed = `${prefix}-${i}`
    const ok =
      fires.every((w) => injuryRollAt(seed, w) < TAU_C0_AGE14 * 0.9) &&
      quiet.every((w) => injuryRollAt(seed, w) >= ECONOMY.availability.injuryChanceCap)
    if (ok) return seed
  }
  throw new Error('no seed matching the injury-roll requirements')
}

function injectEvent(world: WorldState, partial: { week: number; tier: TierId; deadlineWeek: number }): SeasonEvent {
  const e: SeasonEvent = {
    id: `r11-${partial.week}-${partial.tier}`,
    week: partial.week,
    tier: partial.tier,
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: partial.deadlineWeek,
  }
  world.season.push(e)
  world.season.sort((a, b) => a.week - b.week)
  return e
}

/** Tick to `week`, resolving any reveal so time keeps moving (the seasonWrapUp.test.ts harness). */
function tickTo(world: WorldState, rng: () => number, week: number): void {
  while (world.week < week) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
}

// ===========================================================================
// R11-1 — a medical stop may never be swallowed by another stop in the same week.
//
// THE BUG (owner 26.07, "the injury popup does not always appear – once it did, once it did not"):
// advanceWeeks carried ONE stopReason and broke on the first match, in the order
// pendingTournament -> 'season-end' -> 'injury' -> 'medical' -> 'funds'. An injury landing on the
// season's wrap-up week therefore came back as 'season-end' ALONE: InjuryStopDialog never mounted,
// and since R10-16 took 'injury' out of STOP_REASON_TEXT (it owns a dialog) the toast had no copy
// for it either – so the injury AND its auto-withdrawals happened with nothing shown at all.
// ===========================================================================
describe('R11-1 — every reason a week stopped the advance is reported', () => {
  it('an injury on the WRAP-UP week reports both "injury" and "season-end", injury first', () => {
    // The exact collision: week 49 both ends the season and is when she gets hurt.
    const seed = findSeed('r11-wrap-injury', [WRAP_OFFSET], [])
    const world = createWorld(seed)
    world.physioActive = false
    const rng = rngFromSeed(world.seed)
    // Walk to the week before the wrap, staying healthy: the onset under test is week 49's own.
    while (world.week < WRAP_OFFSET - 1) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      world.injury = null
      // ⚠ W4: the walk uses `tickWeek` (which never blocks), but a knock left undecided here would
      // block the `advanceWeeks` under test one line below and report 'knock' instead of the
      // collision this test is about. Cleared, not answered: the fixture wants a clean week 48.
      world.knock = null
    }
    expect(world.week).toBe(WRAP_OFFSET - 1)
    world.condition = 0 // run down, so the pre-picked roll clears tau

    const stops = advanceWeeks(world, rng, 1)

    expect(world.week).toBe(WRAP_OFFSET)
    // BEFORE THE FIX this array was the single value 'season-end' and the injury was invisible.
    expect(stops).toContain('injury')
    expect(stops).toContain('season-end')
    // ...and in the order the UI shows them: her injury first, the wrap-up waits one click.
    expect(stops.indexOf('injury')).toBeLessThan(stops.indexOf('season-end'))

    // Both popups are REACHABLE: each one's data is on the snapshot the advance produced.
    const snap = toSnapshot(world, stops)
    expect(snap.stopReasons).toEqual(stops)
    expect(snap.injury).not.toBeNull() // InjuryStopDialog's own v-if
    expect(snap.lastSeasonSummary).not.toBeNull() // SeasonSummaryDialog's own v-if
  })

  it('a medical withdrawal is not swallowed by a funds crossing on the same week', () => {
    // The other half of the same class of bug: 'medical' used to sit BELOW 'funds' in nothing but
    // source order, and a forfeited entry must never pass by unseen.
    const seed = findSeed('r11-medical', [], [1, 2, 3])
    const world = createWorld(seed)
    world.physioActive = false
    world.season = []
    const event = injectEvent(world, { week: 3, tier: 'local', deadlineWeek: 2 })
    world.fundsCents = 5_000_00
    enterEvent(world, event.id)
    const rng = rngFromSeed(world.seed)
    tickTo(world, rng, 2)
    // Arrive at the play week run down (the doctor withdraws her on arrival) AND deep in the red.
    world.condition = 0
    world.fundsCents = -50_000_00

    const stops = advanceWeeks(world, rng, 1)

    expect(world.week).toBe(3)
    expect(world.medicalWithdrawalWeek).toBe(3)
    expect(stops).toContain('medical')
    expect(stops).toContain('funds')
    expect(stops[0]).toBe('medical') // the toast speaks for the medical stop, not the money one
  })

  it('a plain single-step injury still stops the advance on its own (pinned against refactors)', () => {
    // (c) in the brief: this one worked before and must keep working – it is the case the owner
    // DID see, and the shape of the fix must not cost it.
    const seed = findSeed('r11-plain-injury', [1], [])
    const world = createWorld(seed)
    world.physioActive = false
    world.condition = 0

    const stops = advanceWeeks(world, rngFromSeed(world.seed), 4)

    expect(world.week).toBe(1)
    expect(stops).toEqual(['injury']) // exactly one reason – nothing else was true that week
    const snap = toSnapshot(world, stops)
    expect(snap.stopReasons).toEqual(['injury'])
    expect(snap.injury).not.toBeNull()
  })

  it('an advance that runs its course reports NOTHING (no popup can fire off an empty set)', () => {
    const seed = findSeed('r11-quiet', [], [1, 2])
    const world = createWorld(seed)
    world.season = [] // no events -> no tournament/deadline stop
    world.condition = 100
    const stops = advanceWeeks(world, rngFromSeed(world.seed), 2)
    expect(stops).toEqual([])
    expect(toSnapshot(world, stops).stopReasons).toBeUndefined()
  })

  it('STOP_PRECEDENCE covers every StopReason exactly once, medical pair first', () => {
    // MECHANICAL: a StopReason added later without a precedence slot would be silently dropped by
    // the `STOP_PRECEDENCE.filter(...)` return, which is exactly the class of bug R11-1 was.
    // R12-15 added 'walkover' – an entered event that came round inside her layoff, 0 pts and the
    // entry fee forfeited. It joins the medical pair at the front for the same reason they are
    // there: it costs her real money the moment it lands, so it may never be swallowed by a stop
    // that can wait a click.
    // ⚠ W4 ADDED 'knock' – and it is the strongest case this test has ever had for existing. A
    // knock does not merely halt the advance, it BLOCKS it (advanceWeeks returns early), so a
    // 'knock' with no precedence slot would be filtered out of the return value and the career would
    // stop dead with the UI told nothing at all. Exactly the class of bug R11-1 was, one degree worse.
    // ⚠ v48 ADDED 'birthday', and the argument above transfers word for word: the birthday BLOCKS
    // (advanceWeeks returns early on it), so a member with no precedence slot would be filtered out
    // of the return value and the career would stop dead with the UI told nothing at all.
    // ⚠ ROUND 23 #16 ADDED 'academy', and it is the FIRST member here that is good news. The argument
    // for a slot is the same one and arrives from a new direction: the academy's verdict fires at
    // `week % 52 === 0`, this advance hard-stops at `% 52 === 49`, and the shell steps by four - so
    // 49 + 4 = 53 made the verdict week the one week of the season a player can never land on. It
    // had passed in silence for a whole career (his, measured: still in the ledger 205 weeks later).
    // ⚠⚠ THE COLLEGE WAVE ADDED 'call-up', AND IT IS THE FIRST MEMBER NO `advanceWeeks` EVER SETS.
    // Every reason above is produced by the advance loop; this one is produced by
    // `resumeFromCollege`, which spends a whole college YEAR in one call with no player in it. Since
    // that wave her national-team rubbers are REAL matches played through `simulateMatch`, and the
    // owner asked for a competition he can watch – so a reason with no precedence slot would be
    // filtered out of the return value and a year of played tennis would report nothing at all. The
    // same bug class as R11-1, arriving through a second producer.
    // ⚠⚠ ROUND 24 ADDED 'college-league', AND IT IS THE FIRST MEMBER THAT IS NOT A ROLL AT ALL. The
    // student championship is on the calendar of EVERY college year (the owner: «как минимум 1 турнир
    // в год колледжа был»), so this reason fires in every one of the four – which makes a missing
    // precedence slot worse here than anywhere above it, not better: it would silence the one week
    // the round exists to make visible, every single year. It is also the first PAIR in this list
    // that co-occurs by construction – the call-up is read off the championship two weeks earlier –
    // and the ordering between them is asserted below.
    // ⭐ R2-13 ADDED 'offer', AND ITS CASE FOR A SLOT IS THE ONLY ONE HERE MADE OF A CLOCK. Every
    // member above either has already happened (the medical trio, the academy's verdict, the two
    // college reports) or waits for the player indefinitely (the knock, the birthday, the fork, the
    // retirement offer, a paused reveal) or comes round again (funds, deadline, season-end). An open
    // letter does none of the three: it EXPIRES when its window closes, so a member filtered out of
    // the return value for want of a slot would not merely go unreported – the deal behind it would
    // be gone by the time anything else mentioned it. Slotted immediately below 'academy'; the
    // argument for that exact line is written beside it in protocol/events.ts.
    // ⚠ THE HAND-WRITTEN LIST IS THE POINT OF THIS TEST and must stay hand-written: derived from
    // STOP_PRECEDENCE it could never catch a member that has no slot, which is the whole bug class.
    // ⚠ ROUND 29 #3 ADDED 'shoot-clash', and it is the only member of this list about a week that has
    // NOT HAPPENED YET – it is raised for `world.week + 1`, because two of its four answers stop
    // being possible once the week begins (`cancelEntry` refuses on the week itself, and a shoot
    // cannot be moved out of a week being lived). Slotted immediately below 'retirement': it BLOCKS
    // like the fork and the retirement offer, and it is below them because those two decide whether
    // there is a career at all while this decides one week of one.
    const all: StopReason[] = ['tournament', 'deadline', 'funds', 'season-end', 'injury', 'medical', 'walkover', 'knock', 'birthday', 'ending', 'fork', 'retirement', 'academy', 'offer', 'call-up', 'college-league', 'shoot-clash']
    expect([...STOP_PRECEDENCE].sort()).toEqual([...all].sort())
    expect(new Set(STOP_PRECEDENCE).size).toBe(STOP_PRECEDENCE.length)
    for (const medical of ['injury', 'medical', 'walkover'] as StopReason[]) {
      expect(STOP_PRECEDENCE.indexOf(medical)).toBeLessThan(STOP_PRECEDENCE.indexOf('season-end'))
      expect(STOP_PRECEDENCE.indexOf(medical)).toBeLessThan(STOP_PRECEDENCE.indexOf('funds'))
    }
  })

  it('the collection loop reads the whole week before breaking (no reason can pre-empt another)', () => {
    // Source guard on the SHAPE of the fix: the per-reason `break`s are what lost the injury, so
    // there must be exactly one break after the tick – the one that ends the advance.
    const fn = worldFunction('advanceWeeks')
    expect(fn).not.toBe('')
    const body = after(fn, 'tickWeek(world, rng)')
    const code = body
      .split('\n')
      .filter((line) => !line.trim().startsWith('//')) // prose may say "break" without doing it
      .join('\n')
    expect(code.match(/\bbreak\b/g) ?? []).toHaveLength(1)
    // ⚠⚠ RE-AIMED AT ROUND 29 #6, AND THE CLAIM IS UNTOUCHED. This read `if (stops.size > 0) break`
    // – the break's CONDITION – while what R11-1 is about is that there is exactly ONE break and it
    // comes after the whole week has been read (the line above, which is the guard proper). Round 29
    // #6 changed the condition and nothing else: the loop now breaks on a reason that HALTS rather
    // than on every reason it collected, because 'season-end' was cutting a six-week span in half to
    // deliver a recap that reads the snapshot anyway (`SPAN_REPORTS_ONLY` in world/multiWeek.ts
    // carries the whole argument). Pinned by SHAPE now – one break, and it consults the list rather
    // than the set's size – so a future per-reason `break` still fails here and a change of policy
    // in that one named place does not.
    expect(code).toMatch(/if \(\[\.\.\.stops\]\.some\(\(r\) => !SPAN_REPORTS_ONLY\.has\(r\)\)\) break/)
  })
})

// ===========================================================================
// R11-1, second gate — the `tab === 'home'` condition on the popups.
//
// The comment justified it with "advance only ever runs from Home's bar". That is FALSE on the
// current build, which is what these tests pin: SeasonScreen's booked-practice "Watch it live"
// calls game.advance(1) from the Season tab, so a stop rolled on that tick was skipped entirely.
// ===========================================================================
describe('R11-1 — the popups are not gated on the Home tab', () => {
  it('an advance really can be triggered from a screen other than Home (the claim was false)', () => {
    const season = readFileSync(new URL('../src/components/screens/SeasonScreen.vue', import.meta.url), 'utf8')
    expect(season).toContain('game.advance(')
  })

  it('neither dialog nor the toast asks which tab is showing', () => {
    const injury = region(APP, 'const showInjuryStop', 'const showSeasonSummary')
    const summary = region(APP, 'const showSeasonSummary', 'function dismissSeasonSummary')
    expect(injury).not.toContain('tab.value')
    expect(summary).not.toContain('tab.value')
    // ...and the toast's own render is no longer Home-only either.
    expect(APP).toContain('<div v-if="showStopToast" class="stop-toast">')
  })

  it('both dialogs read the SET, and the wrap-up defers to the injury (one overlay, defined order)', () => {
    const injury = region(APP, 'const showInjuryStop', 'const showSeasonSummary')
    const summary = region(APP, 'const showSeasonSummary', 'function dismissSeasonSummary')
    // ⚠ RE-AIMED, NOT RELAXED (11.08, round-16 #18/#19). R11-1's property is the ORDERING – one
    // overlay at a time, the injury first, and never a dead end – and every assertion that states it
    // is below, verbatim. What moved is the injury gate's INPUT, and it moved because reading the
    // stop reason was measured to be unable to answer the question at all for the biggest source of
    // injuries in the game.
    //
    // THE MEASUREMENT (docs/specs/round16-injuries.md §2, 400 season-years per policy): **61% of
    // injuries at high condition arrive through the RETIREMENT door**, and `retirementInjury` is
    // opened by `finalizeTournament` – which runs from `closeTournament`, the reveal's own command,
    // long after `advanceWeeks` returned. A stop reason exists only for the duration of the advance
    // that produced it, so that entire door reported nothing, in any career, ever. The owner took
    // three injuries in one season and was told about none of them.
    //
    // So the injury gate now asks the ENGINE's own predicate – `injury.sinceWeek === week`, the
    // identical test `advanceWeeks` runs – on the SNAPSHOT, where the answer survives the command
    // that produced it. That is the argument App.vue's knock gate has made since W4.
    //
    // ⚠ R11-1 ITSELF IS UNTOUCHED AND STILL PROVEN. The engine half of this file (the wrap-up-week
    // collision test above) asserts `advanceWeeks` returns BOTH 'injury' and 'season-end', injury
    // first, and it is green – the stop reason is still collected and still halts a multi-week
    // advance. It simply is not what raises the dialog any more.
    expect(injury).toContain('sinceWeek === game.snapshot.week')
    // ⭐ ROUND-19 #2 – ...AND SO DOES THE SEASON SUMMARY NOW. This assertion used to read
    // `summary` for `stopReasons.value.includes('season-end')`, justified here by "a wrap-up is
    // produced by an advance and by nothing else, so its reason cannot be missed the way an
    // injury's could". THE SECOND HALF OF THAT SENTENCE IS FALSE, and the owner found it: the
    // reason is not missed, it is DESTROYED. The retirement offer is raised on the wrap week by
    // construction and outranks the recap, so answering it – a real command – produced a fresh
    // snapshot with no stop reasons and the summary could never be satisfied again. The fork did
    // the same one rank up. The injury report survived the identical ordering only because
    // dismissing it issues no command at all.
    //
    // The gate is `snapshot.seasonWrapPrompt` (engine/world/milestones.ts `seasonWrapDue`) – the
    // same shape and the same argument as the injury line above, and the ORDER below is unchanged.
    // The behaviour is proven mounted in tests/component/round19-wrapup.test.ts; this stays a source
    // pin because what it guards is which INPUT the gate reads.
    //
    // ⚠ RE-AIMED BY R2-08, AND THE GUARDED CLAIM IS UNCHANGED: the gate's INPUT is
    // `snapshot.seasonWrapPrompt` and NOT a stop reason. The gate used to spell its own watermark
    // comparison inline (`seasonWrapPrompt.value !== null && String(...) !== seasonWrapSeen.value`);
    // that comparison is `useWatermark`'s `unseen` now, so the pin follows the input one link back –
    // it asserts the wrap-up's mark is BUILT over `seasonWrapPrompt`, and that neither the gate nor
    // the mark has gone back to reading the reason that dies with its own advance.
    expect(summary).toContain('seasonWrapUnseen.value')
    const wrapMark = region(APP, 'const SEASON_WRAP_PREFIX', "// R9-21a: the injury stop")
    expect(wrapMark.length, 'the wrap-up mark moved – re-aim, do not widen').toBeGreaterThan(0)
    expect(wrapMark, 'the mark is over the snapshot field, not over a stop reason').toContain(
      'game.snapshot?.seasonWrapPrompt',
    )
    expect(wrapMark).toContain('seasonWrapIdentity')
    expect(wrapMark).not.toContain('stopReasons')
    expect(summary).not.toContain("stopReasons.value.includes('season-end')")
    // The wrap-up waits behind the injury dialog – never both overlays at once, and never a dead
    // end: dismissing the injury re-evaluates this gate and the summary appears.
    expect(summary).toContain('!showInjuryStop.value')
    // ...and the injury dialog does NOT wait for anything, so the order can only be injury -> wrap.
    expect(injury).not.toContain('showSeasonSummary')
  })
})

// ===========================================================================
// R11-12a — the season wrap-up money must be the wallet's money.
//
// THE BUG (owner, 120k season 2: "spend 59740 … no wait, the final popup adds it up wrong: the
// wallet says 95507"). Three independent faults, all on the SUMMARY side:
//   1. it scraped `world.events`, which is capped at 400 and pruned by `housekeep` immediately
//      before the wrap-up runs, so the season's earliest financial events were already gone;
//   2. its window excluded the wrap-up week's own costs, which the wallet counts;
//   3. its single figure is a NET delta, while the wallet's headline is GROSS spend.
// ===========================================================================
describe('R11-12a — the wrap-up summary reconciles with the wallet', () => {
  it('at every wrap, spent/earned/net equal the Money screen "This season" window, cent for cent', () => {
    // The owner's own difficulty tier, two full seasons, with a real entry policy so entry fees,
    // travel, refunds, coaching, gear, physio and living costs are all in play.
    const wealthy = PRESETS.find((p) => p.background === 'wealthy')!
    const { world, rng } = openCareer(wealthy, 0)
    let wraps = 0
    let feedEverAtCap = false
    for (let i = 0; i < 2 * WEEKS_PER_YEAR; i++) {
      stepCareerWeek(world, rng)
      if (world.week % WEEKS_PER_YEAR !== WRAP_OFFSET) continue
      wraps++
      const summary = world.lastSeasonSummary!
      // EXACTLY what MoneyScreen renders: snapshot.finance.season (its "This season" toggle).
      const wallet = toSnapshot(world).finance.season
      expect(summary.spentCents).toBe(wallet.expenseCents)
      expect(summary.earnedCents).toBe(wallet.incomeCents)
      expect(summary.fundsDeltaCents).toBe(wallet.netCents)
      // ...and the three agree internally, so the popup's rows can never contradict each other.
      expect(summary.fundsDeltaCents).toBe(summary.earnedCents! - summary.spentCents!)

      // The fold is over MANY categories – this is not a one-bucket career.
      const buckets = Object.entries(wallet.byCategory).filter(([, amount]) => (amount ?? 0) !== 0)
      expect(buckets.length).toBeGreaterThan(3)

      // THE OLD FOLD, replayed here as the bug's own witness: scraping the (capped, already-pruned)
      // events feed over the window that stopped short of the wrap week. It must NOT reproduce the
      // wallet – if this ever starts agreeing, the career stopped exercising the pruning that the
      // owner's save had, and the test above would have gone quietly vacuous.
      const yearStart = seasonStartWeek(world.week)
      const legacy = world.events
        .filter((e) => e.week >= yearStart && e.week < world.week && e.amountCents !== undefined)
        .reduce((sum, e) => sum + (e.amountCents ?? 0), 0)
      expect(legacy).not.toBe(wallet.netCents)
      // ⚠ RE-PINNED by fix/rival-fatigue-rows: this used to assert `>= 400` (the EVENTS_CAP) AT
      // EVERY WRAP, and season 1 of this fixture now closes on 362 events (season 2 is 402, still
      // over the cap). MEASURED, same seed, pre-fix → post-fix: entries 25 → 21, tournaments
      // 24 → 19, kid matches 42 → 28, injuries 1 → 0. MECHANISM: cohort rivals now pay condition
      // for a draw they lost their opener in, so the field she meets is tireder, her brackets
      // resolve differently and this particular career takes a different (shorter) shape in year 1.
      // The claim this line exists for is "the feed really is pruned, so the legacy fold above is
      // reading a mutilated history" – so it is now asserted where it is TRUE (at least one wrap
      // hits the cap) plus a floor at every wrap that keeps the fixture a busy one. Weakening it to
      // a per-wrap `>= 350` would have kept it green while quietly dropping the witness.
      feedEverAtCap ||= world.events.length >= 400
      expect(world.events.length).toBeGreaterThan(300) // a real, event-dense season either way
    }
    expect(wraps).toBe(2)
    expect(feedEverAtCap).toBe(true) // ...and the cap is genuinely reached, so pruning IS exercised
  })

  it('the net equals the actual movement in fundsCents across the season window', () => {
    // THE MECHANICAL GUARD the brief asks for. Every rouble that leaves the wallet leaves it
    // through a financial event, so if a NEW expense category is added later and does not reach
    // the summary's fold, this equality breaks – no category list to keep in sync, and nothing to
    // remember. A tick-only career is used deliberately: with no entry commands, every charge
    // lands inside the tick of the week it belongs to, so `fundsCents` moves only in-window.
    const world = createWorld('r11-funds-delta')
    const rng = rngFromSeed(world.seed)
    const openingFunds = STARTING_FUNDS_CENTS[world.profile.background] // week 0 is never ticked
    expect(world.fundsCents).toBe(openingFunds)

    tickTo(world, rng, WRAP_OFFSET)
    const season0 = world.lastSeasonSummary!
    expect(season0.fundsDeltaCents).toBe(world.fundsCents - openingFunds)
    expect(season0.spentCents! - season0.earnedCents!).toBe(openingFunds - world.fundsCents)

    // Season 2, whose baseline is the balance carried out of the previous off-season.
    tickTo(world, rng, WEEKS_PER_YEAR - 1)
    const carriedIn = world.fundsCents
    tickTo(world, rng, WEEKS_PER_YEAR + WRAP_OFFSET)
    const season1 = world.lastSeasonSummary!
    expect(season1.seasonYear).toBe(season0.seasonYear + 1)
    expect(season1.fundsDeltaCents).toBe(world.fundsCents - carriedIn)
  })

  it('a spending category the engine has never heard of still lands in the season spend', () => {
    // The regression the brief names: a NEW expense category added later must not need anybody to
    // remember to fold it in. The fold walks the ledger's own keys, so an unknown bucket counts –
    // proven here by planting one that no source file mentions and diffing two identical runs.
    const ROGUE = 'school-fees' as WorldEventCategory
    const PLANTED = 123_456

    const build = (plant: boolean): WorldState => {
      const world = createWorld('r11-new-category')
      const rng = rngFromSeed(world.seed)
      tickTo(world, rng, WRAP_OFFSET - 1)
      if (plant) {
        const entry = world.financeWeeks.find((w) => w.week === WRAP_OFFSET - 1)!
        entry.byCategory[ROGUE] = -PLANTED
      }
      tickTo(world, rng, WRAP_OFFSET) // the wrap-up fires on this tick
      return world
    }

    const plain = build(false).lastSeasonSummary!
    const planted = build(true).lastSeasonSummary!
    expect(planted.spentCents! - plain.spentCents!).toBe(PLANTED)
    expect(plain.fundsDeltaCents - planted.fundsDeltaCents).toBe(PLANTED)
    // and it is not merely being lumped into income or dropped on the floor
    expect(planted.earnedCents).toBe(plain.earnedCents)
  })

  it('"this season" has ONE definition, shared by the wallet window and the wrap-up', () => {
    const world = worldSource()
    expect(seasonStartWeek(0)).toBe(0)
    expect(seasonStartWeek(WRAP_OFFSET)).toBe(0)
    expect(seasonStartWeek(WEEKS_PER_YEAR)).toBe(WEEKS_PER_YEAR)
    expect(seasonStartWeek(2 * WEEKS_PER_YEAR + 7)).toBe(2 * WEEKS_PER_YEAR)
    // Both surfaces call the helper – neither re-derives the block boundary for itself, which is
    // how they came to disagree in the first place.
    const snapshotFold = region(world, 'finance: {', 'financialEvents:')
    expect(snapshotFold).toContain('seasonStartWeek(world.week)')
    // the wrap-up function, wherever the P4 decomposition has moved it to
    const wrapUp = worldFunction('maybeFireSeasonWrapUp')
    expect(wrapUp).not.toBe('')
    expect(wrapUp).toContain('seasonStartWeek(world.week)')
    // the money figures come off the finance ledger, NOT the capped events feed
    expect(wrapUp).toContain('financeWindow(world.financeWeeks, yearStart)')
    expect(wrapUp).not.toMatch(/amountCents/)
  })

  it('the popup shows the wallet\'s own headline: spend, income and the net', () => {
    const dialog = readFileSync(new URL('../src/components/SeasonSummaryDialog.vue', import.meta.url), 'utf8')
    expect(dialog).toContain('Spent this season')
    expect(dialog).toContain('Earned this season')
    expect(dialog).toContain('Funds this season')
    // Both new rows are optional-safe: a summary banked before R11-12a has neither figure.
    expect(dialog).toContain('v-if="spentCents !== undefined"')
    expect(dialog).toContain('v-if="earnedCents !== undefined"')
    // Player-facing copy: no long dash, no Cyrillic in the rendered strings.
    const template = after(dialog, '<template>')
    expect(template).not.toMatch(/[—А-Яа-яЁё]/)
  })

  it('the season fold reconciles for every preset, not just the owner\'s', () => {
    // Same claim as the first test, across the difficulty tiers – the wallet and the popup must
    // agree whatever the family can afford (income-heavy careers included).
    for (const preset of PRESETS) {
      const { world, rng } = openCareer(preset, 1)
      for (let i = 0; i < WRAP_OFFSET; i++) stepCareerWeek(world, rng)
      const summary = world.lastSeasonSummary!
      const wallet = financeWindow(world.financeWeeks, seasonStartWeek(world.week))
      expect(summary.spentCents).toBe(wallet.expenseCents)
      expect(summary.earnedCents).toBe(wallet.incomeCents)
      expect(summary.fundsDeltaCents).toBe(wallet.netCents)
    }
  })
})
