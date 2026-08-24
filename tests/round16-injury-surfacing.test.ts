// ROUND 16 #13/#17/#18/#19 – THE INJURY IS SURFACED, AND THE STOP REASON WAS NEVER ABLE TO DO IT.
//
// The owner took three injuries in one Olivia season and was told about NONE of them – he found out
// from `injury` plaques on Season cards afterwards, and the worst case (#18) was an in-match
// retirement that showed as a scoreline and nothing else. #19 states the rule the fix must satisfy:
//
//   ⚠ the popup is owed whether she was hurt in a live match, in a skipped one, or in a week the
//     player never watched. It is a consequence of STATE, not of a screen having been open.
//
// THE MECHANISM, MEASURED (docs/specs/round16-injuries.md). `InjuryStopDialog` was gated on the
// `'injury'` STOP REASON, and only `advanceWeeks` ever produces one – from
// `world.injury.sinceWeek === world.week`, asked immediately after `tickWeek`. That catches the two
// doors that open INSIDE the tick (the weekly roll and the practice friendly) and cannot catch the
// third: a tournament retirement opens its layoff in `finalizeTournament`, which runs from the
// reveal's own command long after the advance returned with `'tournament'`. **61% of this game's
// injuries come in by that third door** (400 measured season-years), and it raised no popup, in any
// career, ever.
//
// So the tests below are in two halves: the engine half proves the stop reason cannot carry the
// fact, and the UI half proves the snapshot can and does.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  advanceWeeks,
  closeTournament,
  createWorld,
  enterEvent,
  skipTournament,
  tickWeek,
  toSnapshot,
  KID_ID,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { TIER_LADDER } from '../src/engine/season/calendar'
import type { StopReason } from '../src/shared/protocol'

const app = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')

/** The heaviest schedule the gates allow – the same policy tests/match-retirement.test.ts drives, so
 *  a retirement really does turn up inside a few seeds rather than being hand-built. */
function enterTheStrongestSheWillGet(world: ReturnType<typeof createWorld>): void {
  world.fundsCents = Math.max(world.fundsCents, 1_000_000_00)
  if (world.condition < ECONOMY.condition.matchStrengthKnee) return
  for (const tier of [...TIER_LADDER].reverse()) {
    const e = world.season.find(
      (x) =>
        x.tier === tier &&
        x.deadlineWeek >= world.week &&
        x.deadlineWeek - world.week <= 2 &&
        !world.entries.includes(x.id) &&
        !world.season.some((y) => y.week === x.week && world.entries.includes(y.id)),
    )
    if (!e) continue
    try {
      enterEvent(world, e.id)
      break
    } catch {
      /* the policy tries the next rung down */
    }
  }
}

describe('#18 – the retirement door opens an injury the ADVANCE has already stopped reporting', () => {
  it('an advance onto a retirement week returns "tournament" and NOT "injury" – the layoff does not exist yet', () => {
    let seen = 0
    for (let s = 0; s < 16 && seen < 3; s++) {
      const world = createWorld(`r16-ret-stop-${s}`)
      const rng = rngFromSeed(world.seed)
      for (let i = 0; i < 52 * 4 && seen < 3; i++) {
        if (world.injury === null) enterTheStrongestSheWillGet(world)
        // ⚠ THE ADVANCE, not a bare tick: it is the function that produces stop reasons, and the
        // whole claim is about what it can and cannot see.
        const stops: StopReason[] = advanceWeeks(world, rng, 1)
        const p = world.pendingTournament
        if (!p) continue
        const hit = p.result.matches.some((m) => m.retiredId === KID_ID)
        const injuredBefore = world.injury
        skipTournament(world)
        closeTournament(world)
        if (!hit) continue
        // The retirement was already decided when the advance returned – the match is in the result –
        // and the layoff still did not exist, so there was nothing for `'injury'` to be collected
        // from. This is the whole defect in one assertion.
        if (injuredBefore === null) {
          expect(stops, 'the advance reports the reveal, and cannot report a layoff not yet opened').not.toContain(
            'injury',
          )
          expect(stops).toContain('tournament')
        }
        seen++

        // ...and by the time the reveal CLOSES the layoff is open, dated this week, and on the
        // snapshot. That is the state the popup's gate reads, and it survives the command that made
        // it – which a stop reason does not.
        expect(world.injury, 'a retirement is an injury onset').not.toBeNull()
        expect(world.injury!.sinceWeek).toBe(world.week)
        const snap = toSnapshot(world)
        expect(snap.injury, 'the snapshot carries the layoff').not.toBeNull()
        expect(snap.injury!.sinceWeek, 'and the week it opened – the gate is `sinceWeek === week`').toBe(snap.week)
      }
    }
    expect(seen, 'the sweep must actually reach a retirement, or it asserts nothing').toBeGreaterThan(0)
  })
})

describe('the snapshot carries the layoff week, so the UI never has to be TOLD an injury is fresh', () => {
  it('toSnapshot surfaces sinceWeek, and it equals the snapshot week on the onset week only', () => {
    const world = createWorld('r16-since-week')
    world.injury = { kind: 'ankle strain', severity: 'moderate', weeksRemaining: 4, totalWeeks: 4, sinceWeek: world.week }
    const fresh = toSnapshot(world)
    expect(fresh.injury!.sinceWeek).toBe(fresh.week)

    // A week into the layoff the SAME predicate says "not now" – which is what stops the popup
    // re-firing every week she sits out, and is exactly the test `advanceWeeks` has always run.
    const rng = rngFromSeed(world.seed)
    tickWeek(world, rng)
    const later = toSnapshot(world)
    expect(later.injury).not.toBeNull()
    expect(later.injury!.sinceWeek).toBeLessThan(later.week)
  })
})

describe('#19 – the popup is gated on STATE, not on a screen having been open', () => {
  // ⚠ A SOURCE PIN, DELIBERATELY, and the claim is structural rather than behavioural: it is about
  // WHICH INPUT the gate reads. Mounting App.vue would need the worker, IndexedDB and a real career;
  // the behaviour it would prove is proved above at engine level (the state is there) and below at
  // component level (the dialog renders it). What no other test can see is that the gate was rewired,
  // which is the entire fix.
  //
  // ⚠ THE SLICE ENDS AT THE NEXT GATE'S COMMENT, NOT AT ITS `const` (round-19 #2). It used to end at
  // `const showSeasonSummary`, which swallowed the whole comment block belonging to THAT gate – and
  // when round-19 moved the season recap off the stop reason for exactly the reason this file moved
  // the injury report, the new block's prose said "stopReasons" and the negative assertion below went
  // red on a paragraph about a different popup. A range that reaches into the next thing is the
  // hazard CLAUDE.md records; the injury gate ends where its neighbour's explanation begins.
  const gate = app.slice(
    app.indexOf('const showInjuryStop'),
    app.indexOf('// The end-of-season summary popup'),
  )

  it('the slice is the injury gate and nothing else – an empty or runaway range proves nothing', () => {
    expect(gate.length).toBeGreaterThan(200)
    expect(gate).not.toContain('showSeasonSummary')
  })

  it('the gate reads the injury off the snapshot and compares it with the snapshot week', () => {
    expect(gate).toContain('game.snapshot?.injury')
    expect(gate).toContain('sinceWeek === game.snapshot.week')
  })

  it('...and it no longer asks the stop reasons, which die with the advance that produced them', () => {
    expect(gate, "a stop reason cannot report an injury opened after the advance returned").not.toContain(
      'stopReasons',
    )
  })

  it('the report is acknowledged by IDENTITY, so an action on the onset week cannot re-raise it', () => {
    // The other half of moving off the stop reason: a per-snapshot dismiss flag only worked because
    // the GATE was per advance too. A state gate outlives the advance, so the flag has to name which
    // injury was reported – `sinceWeek:kind` – and it is persisted per career like the news,
    // This-week and trophy watermarks.
    // ⚠ RE-AIMED BY R2-08, AND THE THREE CLAIMS ARE THE SAME THREE. The report's mark was
    // hand-rolled in the shell (a composed key, a `ref(getItem(...))`, a career watcher, an inline
    // `!==`); it is one `useWatermark` call now. Identity, per-career scoping and "unknown means
    // unreported" all still have to be true – they are stated as ARGUMENTS, so the pin reads those.
    expect(app).toContain('injuryIdentity')
    // the prefix, not the composed key: `careerKey` appends the career inside the helper, and the
    // per-career behaviour is proved on a live store in tests/component/career-watermarks.test.ts.
    expect(app).toContain("const INJURY_SEEN_PREFIX = 'tb:injuryReported'")
    // ⚠ AN UNKNOWN INJURY IS AN UNREPORTED ONE. This was the whole of #19 and it is the one thing
    // here that is NOT symmetric with the trophy cabinet: the report takes the SENTINEL form of
    // `absent`, so a missing key reads as "she has not been told". Dropping the sentinel would flip
    // it to claim-nothing and silence the very report the item exists to deliver.
    const block = app.slice(app.indexOf('const INJURY_SEEN_PREFIX'), app.indexOf('function dismissInjuryStop'))
    expect(block.length, 'the injury block moved – re-aim, do not widen').toBeGreaterThan(0)
    expect(block, 'a missing key must mean UNREPORTED, never claim-nothing').toContain('{ value: null }')
    // ...and the gate still asks that question rather than a stop reason (the `it` above) – it is
    // `unseen`, which IS `now !== null && now !== seen`, the comparison this line used to quote.
    expect(app).toContain('injuryUnreported.value')
  })

  it('and the ENGINE stop reason is untouched – it still halts a multi-week advance', () => {
    // The stop reason is not the popup's gate any more; it is still what stops time so the week can
    // be read. Deleting it would let a four-week skip run straight past an injury, which is a
    // different feature and not this one's to remove.
    const world = readFileSync(new URL('../src/engine/world.ts', import.meta.url), 'utf8')
    expect(world).toContain("stops.add('injury')")
  })
})
