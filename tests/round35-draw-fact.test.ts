// ⭐⭐⭐ ROUND 35 #14 – THE DRAW IS A FACT, AND THIS FILE IS THE PROMISE IT MAKES.
//
// HIS COMPLAINT, 03.09: «на неделе перед турниром случилась жеребьевка, мне сказали "играем против
// №118 шанс 71%", пошел турнир - соперник в первом раунде №76».
//
// ⚠⚠ THE CONTROL IS THE POINT OF THIS FILE, exactly as it is of tests/round34-field-chance.test.ts.
// «The name holds still» is a claim about a measuring instrument until the SAME instrument, with one
// input removed, is watched moving. The input removed is the stored draw, and the control is the
// one tools/r31-draw-promise.ts already established: `previewEvent` called with a world whose `week`
// is the BRACKET's week re-derives the draw as a week-later world would, out of the public function
// and with nothing duplicated. On the shipped code that reading disagrees with the promise on most
// events – which is his bug, standing up and being counted – while the bracket she actually plays
// agrees with the promise on every one.
//
// ⚠ NON-W RUNGS ONLY IN THE CONTROL, deliberately, and it is `r31-draw-promise`'s own scope note:
// `upcomingEvents` hands a W card a merged professional universe and a week-exclusivity set that a
// re-derivation here would have to rebuild. The mechanism is identical on both tracks and the
// junior/domestic call is a one-liner, so the narrower control cannot be wrong about its own arms.
// The PROMISE arms below are not narrowed – they read every event she enters, W rungs included.
//
// ⚠ MUTATION-VERIFIED – each applied alone, and the verdicts DIFFER from one another, which is what
// says the arms are separate claims rather than one claim written five times:
//   * `runTournament` ignoring `pinnedFirstOpponent` (the pre-v70 bracket) reddens «the bracket plays
//     the girl the card named», and nothing else;
//   * `firstRoundDraw` ignoring its pin – the ONE function the card and the recorder share – reddens
//     that arm AND «not re-derived from a world that has moved», which is the pair;
//   * `withPinnedFirstRound` refusing to substitute (the swap-only first draft) reddens the bracket
//     arm and its own unit case, and nothing to do with the recorder;
//   * `pruneDrawnFirstRounds` cutting at `<=` instead of `<` reddens the prune arm's «the week she is
//     playing survives» case – the one that would delete the promise on the tick that keeps it;
//   * `recordDrawnFirstRounds` dropping its `world.entries` gate reddens «records the entered event…
//     and only that», which is the arm that pins a NARROWING and would otherwise rot silently.
//
// ⚠⚠ AND ONE MUTATION THAT NOTHING HERE CATCHES, RECORDED RATHER THAN HIDDEN. Making
// `recordDrawnFirstRounds` OVERWRITE every key instead of filling absent ones leaves every case
// green, and that is not a hole in the net – it is a property of the wiring. The recorder reads the
// DRAW and the draw reads the RECORD, so an overwrite writes the same value back. The write-once
// rule is therefore defence in depth rather than the load-bearing claim, and the arm that used to
// assert it was re-pointed at the claim that IS load-bearing (see its own note). If a future wave
// gives the card a second source, this becomes catchable and should be caught.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { migrateSave } from '../src/engine/migrations'
import {
  createWorld,
  tickWeek,
  enterEvent,
  entryStatus,
  travelCostFor,
  skipTournament,
  closeTournament,
  SAVE_SCHEMA_VERSION,
  type WorldState,
} from '../src/engine/world'
import { upcomingEvents } from '../src/engine/world/snapshot'
import { recordDrawnFirstRounds, pruneDrawnFirstRounds } from '../src/engine/world/draw'
import { KID_ID } from '../src/engine/world/constants'
import { kidMatchPlayerFor } from '../src/engine/world/player'
import { aiSelectionRanking } from '../src/engine/world/weekField'
import { coachTravelFareFor } from '../src/engine/world/sponsors'
import { withPinnedFirstRound } from '../src/engine/season/tournament'
import { DRAW_LEAD_WEEKS, previewEvent } from '../src/engine/season/preview'
import { TIERS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { MatchPlayer } from '../src/engine/match/types'
import type { SeasonEvent } from '../src/engine/season/types'

/** A parent who commits a few weeks out to whatever she may enter and can pay for – the same shape
 *  tools/econ-bench.ts' policy has, cut down to the two gates this file's subject depends on. */
function enterWhatSheCan(world: WorldState): void {
  if (world.ending) return
  for (const e of [...world.season].sort((a, b) => a.week - b.week)) {
    if (world.entries.includes(e.id)) continue
    if (world.week > e.deadlineWeek || e.deadlineWeek - world.week > 3) continue
    if (world.season.some((x) => x.week === e.week && world.entries.includes(x.id))) continue
    if (entryStatus(world, e).level === 'blocked') continue
    if (world.fundsCents - (TIERS[e.tier].entryFeeCents + travelCostFor(world, e)) < 0) continue
    try {
      enterEvent(world, e.id)
    } catch {
      /* the door closed between the gate and the command – not this file's subject */
    }
  }
}

/** Who she actually plays in round one of the stashed run – the bracket, never a model of it. */
function bracketOpponentId(world: WorldState): string | null {
  const p = world.pendingTournament
  if (!p) return null
  const m = p.result.matches.find((r) => r.round === 0 && (r.aId === KID_ID || r.bId === KID_ID))
  if (!m) return null
  return m.aId === KID_ID ? m.bId : m.aId
}

/** ⭐ THE CONTROL: the draw as a world one week later would re-derive it, out of the public
 *  `previewEvent` and with the pin deliberately not passed. `world.week` is the ONLY thing moved –
 *  `drawnField` keys its sub-stream on the event's ID, `selectEntrants` never reads a week, and
 *  `rivalConditions` / the ranking fold are the two things that legitimately answer differently at
 *  the bracket's week. That is the whole defect, reproduced. */
function redrawnAtBracketWeek(world: WorldState, e: SeasonEvent): string | null {
  const later = { seed: world.seed, week: e.week, cohort: world.cohort, results: world.results }
  const kid: MatchPlayer = kidMatchPlayerFor(world, e.surface, coachTravelFareFor(world, e) > 0)
  return previewEvent(later, e, aiSelectionRanking(world), kid).opponentId
}

interface Promise_ {
  eventId: string
  tier: string
  /** the event's own week – E-01 reads it to tell a season boundary from an ordinary week */
  week: number
  /** the id the card carried at week − 1 */
  promised: string
  /** the id the bracket actually played */
  played: string | null
  /** the id a week-later re-derivation of the draw would have produced (non-W rungs only) */
  redrawn: string | null
  /** did the promised girl survive in the world long enough to be playable? */
  stillInCohort: boolean
  /** every render of the card at week − 1, in order */
  renders: string[]
}

/** One career, walked with a real entry policy, reporting every published draw it made. */
function walk(seed: string, weeks: number): Promise_[] {
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  const rng = rngFromSeed(`${seed}:test`)
  const out: Promise_[] = []
  for (let w = 0; w < weeks; w++) {
    enterWhatSheCan(world)
    const due = world.season.find(
      (e) => world.entries.includes(e.id) && e.week - world.week === DRAW_LEAD_WEEKS,
    )
    let row: Promise_ | null = null
    if (due) {
      const card = upcomingEvents(world).find((u) => u.id === due.id)
      if (card?.preview.drawMade && card.preview.opponentId) {
        row = {
          eventId: due.id,
          tier: due.tier,
          week: due.week,
          promised: card.preview.opponentId,
          played: null,
          redrawn: TIERS[due.tier].track === 'wta' ? null : redrawnAtBracketWeek(world, due),
          stillInCohort: true,
          renders: [card.preview.opponentId],
        }
        // ...and a SECOND render of the same card, from the same world. A pure preview cannot move
        // here; the arm exists so a regression that makes it move is caught rather than argued.
        const again = upcomingEvents(world).find((u) => u.id === due.id)
        if (again?.preview.opponentId) row.renders.push(again.preview.opponentId)
      }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      if (row && world.pendingTournament.eventId === row.eventId) {
        row.played = bracketOpponentId(world)
        row.stillInCohort = world.cohort.some((p) => p.id === row!.promised)
      }
      // ⚠ THE THIRD RENDER, AND IT IS THE «every render between» ONE. The reveal flow can be pushed
      // aside (`tournamentHidden` in App.vue), so the Season screen is readable before the run is
      // finalised and again after – and a finalize appends her results and moves the selection
      // table. The subject is the card still on screen: the NEXT event a week out.
      const next = world.season.find((e) => e.week - world.week === DRAW_LEAD_WEEKS)
      const before = next ? upcomingEvents(world).find((u) => u.id === next.id) : undefined
      skipTournament(world)
      closeTournament(world)
      const after = next ? upcomingEvents(world).find((u) => u.id === next.id) : undefined
      if (before?.preview.opponentId && after?.preview.opponentId) {
        const pending = out.find((r) => r.eventId === next!.id)
        if (pending) pending.renders.push(before.preview.opponentId, after.preview.opponentId)
      }
    }
    if (row) out.push(row)
  }
  return out
}

const CAREERS = ['r35-fact-a', 'r35-fact-b']
const WEEKS = 70
const ALL = CAREERS.flatMap((s) => walk(s, WEEKS))

describe('round 35 #14 – the published draw is a fact', () => {
  it('the walk produces enough published draws to say anything at all', () => {
    // A guard on the INSTRUMENT, not on the engine: an entry policy that stopped entering would make
    // every arm below vacuously green.
    expect(ALL.filter((r) => r.played !== null).length).toBeGreaterThan(15)
  })

  it('⚠ THE CONTROL – a week later the same draw picks somebody else', () => {
    // HIS BUG. Not a hypothesis: the draw re-derived at the bracket's week names a different girl on
    // most events, which is exactly what he saw between «№118» and «№76».
    const comparable = ALL.filter((r) => r.redrawn !== null)
    expect(comparable.length, 'the control needs non-W published draws').toBeGreaterThan(10)
    const moved = comparable.filter((r) => r.redrawn !== r.promised)
    expect(moved.length, 'the re-derivation must move, or this file proves nothing').toBeGreaterThan(0)
    // ...and it is the COMMON case rather than a curiosity – measured at 59.9% over six careers
    // (tools/r35-draw-fact.ts). A third of the sample is a floor a lucky walk cannot slip under.
    expect(moved.length / comparable.length).toBeGreaterThan(0.3)
  })

  it('the bracket plays the girl the card named', () => {
    const played = ALL.filter((r) => r.played !== null)
    const broken = played.filter((r) => r.played !== r.promised)
    // ⚠⚠ RE-AIMED BY E-01 (05.09 engine review). This arm used to NAME AN EXCEPTION and tolerate it:
    // «the conveyor retires ~18 of 199 players in the rollover week, and a girl who has left the
    // world cannot be put on court». That sentence was the defect wearing the clothes of a rule –
    // the reader (`phaseHerWeek`) falls back to a live draw with no record that a promise was broken,
    // and the review reproduced it on 3 of 20 boundary-week events against 0 of 301 elsewhere. The
    // conveyor now keeps a promised girl for the boundary that would have retired her
    // (`renewCohort`'s `keep` set, wired at `phaseObligations`), so there is no exception left to
    // name and the arm asserts the promise outright. `stillInCohort` stays in the row because the
    // boundary arm below reads it as ITS instrument – the fix is exactly «she is still there».
    for (const r of broken) {
      expect(
        `${r.eventId} (${r.tier}) w${r.week}: promised ${r.promised}, played ${r.played}, still in cohort ${r.stillInCohort}`,
      ).toBe('')
    }
    expect(broken.length).toBe(0)
  })

  it('⚠ E-01 – and the promise survives the SEASON BOUNDARY, which is the week it used to break', () => {
    // ⭐ THE WEEK THE CONVEYOR RUNS. `tickWeek` records the draw at week 52k − 1 (its step 8) and
    // plays it at week 52k (its step 5) – but step 1, `seasonBoundaryAndObligations`, runs the
    // conveyor in between, so before the fix the girl the card named could have left the field
    // before her own match. Measured on the unfixed tree with these two seeds: `r35-fact-b` week 52,
    // event `1-w52-regional`, card said `ai-29` and the bracket played `ai-150`.
    //
    // ⚠ THE INSTRUMENT FIRST, as everywhere in this file: a walk that never puts an entered event on
    // a multiple of 52 makes every assertion below vacuously green, which is precisely why the
    // shipped v70 promise read as kept for two days.
    const onBoundary = ALL.filter((r) => r.played !== null && r.week % WEEKS_PER_YEAR === 0)
    expect(
      onBoundary.length,
      'the walk must enter an event ON a season boundary, or this arm proves nothing',
    ).toBeGreaterThan(0)
    for (const r of onBoundary) {
      expect(
        r.played,
        `${r.eventId} (${r.tier}) w${r.week}: the card named ${r.promised}`,
      ).toBe(r.promised)
      // ...and the mechanism, not only the outcome: she is kept in the field she was promised out of.
      expect(r.stillInCohort, `${r.promised} left the cohort on the boundary`).toBe(true)
    }
  })

  it('the name is the same at every render of the card', () => {
    for (const r of ALL) {
      expect(new Set(r.renders).size, `${r.eventId}: ${r.renders.join(' -> ')}`).toBe(1)
    }
  })

  it('the percentage cannot move because of the OPPONENT – the ring quotes one rated girl', () => {
    // ⭐ HE WAS TOLD TWO THINGS, «№118» AND «71%», and freezing only the first would be the same
    // defect wearing a different hat. `opponentRating` is the ring's opponent-side input, so a
    // published draw that holds still holds the input still by construction. What is deliberately
    // NOT frozen is HER side: `firstMatchChance` is documented as «her chance in a match she would
    // play in the state she is in» (season/preview.ts), and measured on six careers 328 of 328
    // moved percentages were hers moving and 0 were the opponent's.
    const world = createWorld('r35-ring', { ...DEFAULT_PROFILE })
    const rng = rngFromSeed('r35-ring:test')
    for (let w = 0; w < 40; w++) {
      enterWhatSheCan(world)
      const due = world.season.find((e) => e.week - world.week === DRAW_LEAD_WEEKS)
      if (due) {
        const a = upcomingEvents(world).find((u) => u.id === due.id)?.preview
        const b = upcomingEvents(world).find((u) => u.id === due.id)?.preview
        if (a?.drawMade && b?.drawMade) {
          expect(b.opponentRating).toBe(a.opponentRating)
          expect(b.firstMatchChance).toBe(a.firstMatchChance)
        }
      }
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
    }
  })
})

describe('round 35 #14 – the recorder', () => {
  function walkedWorld(weeks: number): { world: WorldState; rng: ReturnType<typeof rngFromSeed> } {
    const world = createWorld('r35-recorder', { ...DEFAULT_PROFILE })
    const rng = rngFromSeed('r35-recorder:test')
    for (let w = 0; w < weeks; w++) {
      // ⚠ SHE HAS TO ENTER, or every arm below is vacuously green: the recorder writes down the
      // draws of tournaments she is IN, and a career that enters nothing publishes nothing.
      enterWhatSheCan(world)
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
    }
    return { world, rng }
  }

  it('records the entered event whose draw is being shown, and only that', () => {
    const { world } = walkedWorld(24)
    const table = world.drawnFirstRounds ?? {}
    const shown = world.season.filter(
      (e) => e.week > world.week && e.week - world.week <= DRAW_LEAD_WEEKS,
    )
    expect(shown.length).toBeGreaterThan(0)
    const entered = shown.filter((e) => world.entries.includes(e.id))
    expect(entered.length, 'the walk must reach a week with an entered event one week out').toBe(1)
    for (const e of entered) {
      expect(Object.keys(table), `${e.id} at +${e.week - world.week}`).toContain(e.id)
    }
    // ⚠ AND THE NARROWING IS PINNED, not left to the comment. An event one week out that she did NOT
    // enter holds no draw containing her – the card is showing a hypothetical – and recording those
    // cost a 2.16x weekly tick for a name nobody can act on. See `recordDrawnFirstRounds`.
    for (const e of shown) {
      if (!world.entries.includes(e.id)) expect(table[e.id], e.id).toBeUndefined()
    }
    // ...and nothing further out. A card that has not named anybody has not made a promise.
    for (const e of world.season) {
      if (e.week - world.week > DRAW_LEAD_WEEKS) expect(table[e.id]).toBeUndefined()
    }
  })

  // ⚠⚠ RE-AIMED. The first cut of this arm asserted WRITE-ONCE by re-recording after moving the
  // world and expecting the table not to change – and it could not fail. Mutating the recorder to
  // overwrite every key instead of filling absent ones left it GREEN, because the recorder reads
  // the CARD and the card reads the RECORD: an overwrite writes the value back unchanged. That is a
  // real robustness property of the wiring and a useless assertion, so the arm was re-pointed at the
  // claim that is actually load-bearing and that a regression can break – A PUBLISHED DRAW IS NOT
  // RE-DERIVED FROM A MOVED WORLD – with the instrument proved first: with the fact removed, the
  // same card answers differently. Mutating `previewEvent` to ignore its pin now reddens it.
  it('a published draw is not re-derived from a world that has moved', () => {
    const { world } = walkedWorld(24)
    const before = { ...(world.drawnFirstRounds ?? {}) }
    expect(Object.keys(before).length).toBeGreaterThan(0)
    // Move the thing the draw is derived from: the results the selection table folds and the
    // condition map is read off. Emptied rather than trimmed – trimming twelve rows at week 12 moved
    // neither table far enough to change a draw, and an arm whose perturbation is too small is an
    // arm that proves nothing (it said so itself, which is why the instrument check is first).
    world.results = []
    // ⚠ THE INSTRUMENT FIRST. With the fact taken away, at least one CARD must answer differently –
    // otherwise the world did not move and every assertion below is vacuous.
    // ⚠⚠ AND «CARD» IS THE WORD THAT MATTERS. The first re-aim scanned the whole table, which also
    // holds the event she is PLAYING this week – and `upcomingEvents` filters to `week > world.week`,
    // so those ids read `undefined` and counted as movement for free. The instrument was measuring
    // its own blind spot: the arm was green under a mutation that removed the pin from the card.
    const onCard = Object.keys(before).filter((id) =>
      world.season.some((e) => e.id === id && e.week > world.week),
    )
    expect(onCard.length, 'the arm needs at least one event still on a card').toBeGreaterThan(0)
    const saved = world.drawnFirstRounds
    world.drawnFirstRounds = {}
    const live = new Map(upcomingEvents(world).map((u) => [u.id, u.preview.opponentId]))
    world.drawnFirstRounds = saved
    const moved = onCard.filter((id) => live.get(id) !== before[id])
    expect(moved.length, 'the world must move, or this arm proves nothing').toBeGreaterThan(0)
    // ...and with the fact in place the card keeps its promise, and a re-record keeps the table.
    for (const u of upcomingEvents(world)) {
      if (before[u.id] !== undefined) expect(u.preview.opponentId, u.id).toBe(before[u.id])
    }
    recordDrawnFirstRounds(world)
    expect(world.drawnFirstRounds).toEqual(before)
  })

  it('ZERO DRAWS – the recorder cannot move the MAIN stream', () => {
    const { world } = walkedWorld(24)
    world.drawnFirstRounds = {}
    const main = { ...world.rngMain }
    recordDrawnFirstRounds(world)
    expect(world.rngMain).toEqual(main)
    expect(Object.keys(world.drawnFirstRounds).length).toBeGreaterThan(0)
  })

  it('the prune keeps the week she is playing and drops what is behind her', () => {
    const { world } = walkedWorld(24)
    const thisWeek = world.season.find((e) => e.week === world.week)
    const past = world.season.find((e) => e.week === world.week - 1)
    const table = (world.drawnFirstRounds ??= {})
    if (thisWeek) table[thisWeek.id] = 'ai-0'
    if (past) table[past.id] = 'ai-1'
    table['no-such-event'] = 'ai-2'
    pruneDrawnFirstRounds(world)
    // ⚠ THE STRICT INEQUALITY IS THE ONE THAT MATTERS: her own competition reads this table for an
    // event AT `world.week`, so a prune that cut it would delete the promise on the tick that keeps it.
    if (thisWeek) expect(world.drawnFirstRounds![thisWeek.id]).toBe('ai-0')
    if (past) expect(world.drawnFirstRounds![past.id]).toBeUndefined()
    expect(world.drawnFirstRounds!['no-such-event']).toBeUndefined()
  })
})

describe('round 35 #14 – withPinnedFirstRound', () => {
  const p = (id: string): MatchPlayer => ({ id, name: id }) as unknown as MatchPlayer
  const kid = p(KID_ID)

  it('exchanges the promised girl into the slot across the net', () => {
    const alive = [kid, p('a'), p('b'), p('c')]
    const out = withPinnedFirstRound(alive, kid, p('c'))
    expect(out.map((x) => x.id)).toEqual([KID_ID, 'c', 'b', 'a'])
    expect(out.length).toBe(alive.length)
  })

  it('reads the pairing from HER slot, odd side included', () => {
    const alive = [p('a'), kid, p('b'), p('c')]
    const out = withPinnedFirstRound(alive, kid, p('c'))
    expect(out.map((x) => x.id)).toEqual(['c', KID_ID, 'b', 'a'])
  })

  it('puts her in when she is not in the rebuild at all', () => {
    const alive = [kid, p('a'), p('b'), p('c')]
    const out = withPinnedFirstRound(alive, kid, p('z'))
    expect(out.map((x) => x.id)).toEqual([KID_ID, 'z', 'b', 'c'])
    expect(out.length).toBe(alive.length)
  })

  it('is a no-op when the promise is already kept, and when she is not in the draw', () => {
    const alive = [kid, p('a'), p('b'), p('c')]
    expect(withPinnedFirstRound(alive, kid, p('a')).map((x) => x.id)).toEqual([KID_ID, 'a', 'b', 'c'])
    expect(withPinnedFirstRound(alive, kid, kid).map((x) => x.id)).toEqual([KID_ID, 'a', 'b', 'c'])
    const without = [p('a'), p('b')]
    expect(withPinnedFirstRound(without, kid, p('a')).map((x) => x.id)).toEqual(['a', 'b'])
  })
})

describe('round 35 #14 – the schema move', () => {
  const load = (v: number): unknown =>
    JSON.parse(readFileSync(resolve(process.cwd(), `tests/fixtures/saves/v${v}.json`), 'utf8'))

  it('a v69 save migrates to v70 with an EMPTY table, and that is the decision', () => {
    const migrated = migrateSave(load(69)) as WorldState
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    // ⚠ Empty rather than back-filled: the value is no longer derivable, so a guess would be a guess
    // dressed as a fact. See the v69 -> v70 step in migrations.ts.
    expect(migrated.drawnFirstRounds).toEqual({})
  })

  it('a v70 save keeps the rows it is carrying', () => {
    const migrated = migrateSave(load(70)) as WorldState
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.drawnFirstRounds).toEqual({ '3-w204-j30': 'ai-0' })
  })

  it('a career with no table at all still draws, and starts recording', () => {
    // Every save older than v70 reaches the engine through the migration, but a hand-made world and
    // an event whose week arrives before a card could exist both hit the absent-key path.
    const world = createWorld('r35-legacy', { ...DEFAULT_PROFILE })
    const rng = rngFromSeed('r35-legacy:test')
    // Walk until she has an ENTERED event one week out – the state a pre-v70 save is loaded into.
    for (let w = 0; w < 30; w++) {
      enterWhatSheCan(world)
      if (world.season.some((e) => e.week === world.week + 1 && world.entries.includes(e.id))) break
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
    }
    delete world.drawnFirstRounds
    // The card still names somebody with no fact behind it – that IS the pre-v70 world.
    expect(upcomingEvents(world).some((u) => u.preview.drawMade && u.preview.opponentId)).toBe(true)
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
    expect(Object.keys(world.drawnFirstRounds ?? {}).length).toBeGreaterThan(0)
  })
})
