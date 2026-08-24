// ⭐⭐ ROUND-20 #2 – THE INJURY REPORT'S "CANCELLED" ROW, AGAINST A REAL INJURY.
//
// Owner, 13.08: he was laid up across two weeks that each carried a tournament and the popup said
// nothing had been cancelled. Two separate faults were behind that, both reproduced below on REAL
// careers through the REAL engine rather than on hand-built snapshots – which is the whole point,
// because both faults are about the engine and the surface disagreeing.
//
//   (1) THE COUNT WAS BLIND. The row finds the layoff's withdrawals by their opening words, because
//       a `WorldEvent` carries no release reason. It matched `'Withdrew from '` – the one sentence
//       `releaseEntry` wrote until 05.08, when `releasedBy` split it so the desk's own action would
//       stop being reported as a receipt for a choice the player never made. The injury arm writes
//       `'Taken out of ...'`; the popup was never repointed, so from that day it could see only
//       withdrawals the PLAYER made. Measured here: a 9-week layoff releases two entries and refunds
//       both fees, and the pre-fix row rendered "Nothing".
//
//   (2) "NOTHING CANCELLED" IS NOT "NOTHING LOST", and the old fallback said the opposite of the
//       truth. `releaseEntry` refuses past the deadline, and lists close two weeks out – so a layoff
//       that lands on or near the event week cancels NOTHING and she stays on the list: fee
//       committed, no appearance, the week resolves as a walkover. The row answered that with
//       "Nothing – every entry stands". That is the shape he was in, twice running.
//
// ⚠ WHY THE FIXTURES ARE DRIVEN AND NOT WRITTEN. A hand-built `events: [{ text: 'Taken out of ...' }]`
// would assert this file's own spelling against the component's, and both could be wrong together –
// which is exactly the failure being fixed. `onsetInjury` is the engine's real onset path (the same
// one `rollInjury` calls); everything the row reads is written by it.
//
// ⭐⭐ R2-02 (23.08) – AND THE COUPLING IS GONE, NOT MERELY CHECKED. The paragraph above describes
// the arrangement this file was written to police: the engine wrote a sentence, the popup took the
// sentence apart, and a shared constant made a rename break the build instead of the report. It did
// not stop the popup PARSING PROSE, and the raw `startsWith('Entry refunded')` two lines below it in
// the component never even had a constant. `Snapshot.injuryReport` now carries the facts – the
// circumstance, the cancelled rows (id, label, week), the stranded rows and the refund in cents –
// and `InjuryStopDialog` is a formatter with no `startsWith` in it at all. The engine's feed lines
// are untouched: they are the player's record, and removing the UI's DEPENDENCE on them is a
// different thing from removing them.
//
// ⚠ MUTATION-VERIFIED, each block naming what was broken to watch it fail:
//   * `buildInjuryReport`'s `cancelled` emptied      -> "lists what the layoff cancelled" red.
//   * ...its `refundCents` forced to 0                -> the same test red on the money line.
//   * ...its `stranded` emptied                       -> "says what it forfeited" red.
//   * ...its `kind` forced to 'off-court'             -> "each circumstance" red on both retired arms.
//   * the fallback restored to "every entry stands"   -> "says what it forfeited" red.
//   ⚠ AND THE ONE THAT USED TO BE IMPOSSIBLE, WHICH IS NOW THE HEADLINE TEST: re-wording the
//     engine's own feed lines. Under the old component this could not be written at all – the
//     sentence WAS the data source, so a test that changed the wording and still demanded the right
//     answer was asking the reader to work without an input. It is the first block below.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// The dialog plays a cue on mount; audio has no business in a copy test (same shim as
// injury-surfacing.test.ts).
vi.mock('../../src/audio/sfx', () => ({
  playSfx: () => {},
  primeSfx: () => {},
  initSfx: () => {},
  installGlobalSfx: () => {},
  isMuted: () => false,
  setMuted: () => {},
}))

import InjuryStopDialog from '../../src/components/InjuryStopDialog.vue'
import { useGameStore } from '../../src/stores/game'
import {
  createWorld,
  tickWeek,
  enterEvent,
  entryStatus,
  bookPractice,
  skipTournament,
  closeTournament,
  kidMatchPlayer,
  toSnapshot,
  KID_ID,
  RELEASE_LINE_PREFIX,
} from '../../src/engine/world'
import { TIERS } from '../../src/engine/season/calendar'
import { onsetInjury } from '../../src/engine/world/injury'
import { resolvePractice } from '../../src/engine/world/planner'
import { stageLabel } from '../../src/engine/world/labels'
import { runTournament } from '../../src/engine/season/tournament'
import { rivalMatchPlayer } from '../../src/engine/season/rival'
import { BODY_REGIONS } from '../../src/engine/body'
import { rngFromSeed } from '../../src/engine/rng'
import { formatCents } from '../../src/shared/money'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import type { MatchPlayer } from '../../src/engine/match/types'
import type { TierId } from '../../src/engine/season/types'
import type { WorldState } from '../../src/engine/world'
import { assertDismissReachable, NARROW_PHONE, PHONE, setViewport } from './fits'
// ⚠ THE REAL CASCADE, or the 375x667 measurement below is vacuous – `measureDialog` refuses without
// it. The height bound it reads lives on the shared `.dialog-card` rule, not on this component.
import '../../src/style.css'

/** A real career, eight weeks in, with money so nothing below is really about bankruptcy. */
function base(seed: string) {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'middle' })
  world.fundsCents = 500_000_00
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 8; i++) tickWeek(world, rng)
  return world
}

/** ⚠ THE LAYOFF LENGTH IS SEARCHED FOR, NOT ASSERTED INTO EXISTENCE. `onsetInjury` draws severity
 *  and weeks-out off the stream it is handed, so a sub-stream seed is picked whose draw yields the
 *  length this test needs – the generator, the order and the arity are all untouched, and the injury
 *  that lands is one the engine could really have rolled. */
function seedForLayoff(world: WorldState, min: number): string {
  for (let i = 0; i < 400; i++) {
    const probe = JSON.parse(JSON.stringify(world)) as WorldState
    onsetInjury(probe, rngFromSeed(`layoff-probe:${i}`), 'week', BODY_REGIONS)
    if ((probe.injury?.totalWeeks ?? 0) >= min) return `layoff-probe:${i}`
  }
  throw new Error(`no draw produced a layoff of ${min}+ weeks`)
}

function enterable(world: WorldState, from: number, to: number) {
  return world.season
    .filter(
      (e) =>
        e.week > from &&
        e.week <= to &&
        e.deadlineWeek >= world.week &&
        entryStatus(world, e).level !== 'blocked',
    )
    .sort((a, b) => a.week - b.week)
}

/** A career entered for two tournaments on CONSECUTIVE weeks, ticked to the first of them – so both
 *  lists have closed and neither week has resolved. The seed is searched for rather than asserted:
 *  which rungs a calendar puts side by side is the calendar's business, and pinning a seed to it
 *  would make this test break on a calendar change that has nothing to do with injuries. */
function consecutivePair() {
  for (let s = 0; s < 30; s++) {
    const state = base(`closed-lists-${s}`)
    const options = enterable(state, state.week + 2, state.week + 20)
    const first = options.find((a) => options.some((b) => b.week === a.week + 1))
    if (!first) continue
    const second = options.find((b) => b.week === first.week + 1)!
    enterEvent(state, first.id)
    enterEvent(state, second.id)
    const rng = rngFromSeed(state.seed)
    let ok = true
    while (state.week < first.week) {
      state.fundsCents = Math.max(state.fundsCents, 200_000_00)
      tickWeek(state, rng)
      if (state.week === first.week) break // arrived: the arrival beat itself is the state we want
      // Anything that resolves an entry early, or hurts her on the way, changes the shape under
      // test rather than reproducing it - try another seed.
      if (state.pendingTournament || state.entries.length !== 2 || state.injury) {
        ok = false
        break
      }
    }
    if (ok && state.week === first.week && state.entries.length === 2 && !state.injury) {
      return { state, pair: { first, second } }
    }
  }
  throw new Error('no seed produced two entered tournaments on consecutive weeks')
}

function mountReport(snapshot: Snapshot) {
  useGameStore().snapshot = snapshot
  return mount(InjuryStopDialog)
}

/** The Cancelled cell: the row is found by its heading, so the assertions below are about the
 *  answer rather than about where it happens to sit in the table. */
function cancelledCell(w: ReturnType<typeof mount>): string {
  const row = w.findAll('tr').find((tr) => tr.find('th').text() === 'Cancelled')
  expect(row, 'the report still has a Cancelled row').toBeTruthy()
  return row!.find('td').text()
}

describe('⭐⭐ round-20 #2 (1) – the layoff DID cancel entries, and the row could not see them', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('lists what the layoff cancelled, and the fees that came back with it', () => {
    const world = base('cancelled-open')
    const wk = world.week
    // Two events far enough out that their lists are still open when the injury lands.
    const open = enterable(world, wk + 2, wk + 6).slice(0, 2)
    expect(open.length, 'two enterable events with open lists').toBe(2)
    for (const e of open) enterEvent(world, e.id)

    // A layoff long enough to swallow both of them.
    onsetInjury(world, rngFromSeed(seedForLayoff(world, 8)), 'week', BODY_REGIONS)

    // THE ENGINE'S SIDE, asserted before the screen's, so a green run cannot mean "nothing happened".
    const rows = world.events.filter((e) => e.week === wk && e.type === 'entry')
    const released = rows.filter((e) => e.text.startsWith(RELEASE_LINE_PREFIX.injury))
    expect(released.length, 'the engine released both entries').toBe(2)
    expect(world.entries.length, 'and she holds neither any more').toBe(0)
    const refunds = world.events.filter((e) => e.week === wk && e.text.startsWith('Entry refunded'))
    expect(refunds.length, 'both fees came back').toBe(2)

    // ...AND THE SCREEN'S. This is the assertion the shipped popup failed.
    const w = mountReport(toSnapshot(world))
    const cell = cancelledCell(w)
    expect(cell, 'the report no longer claims nothing happened').not.toContain('Nothing')
    for (const e of open) expect(cell, `${e.tier} is named`).toContain(TIERS[e.tier].label)
    expect(cell.match(/Withdrawn:/g)?.length, 'one line per cancelled entry').toBe(2)
    expect(cell, 'and the money is on the row').toMatch(/Fees refunded: \+/)
    // The reason clause belongs to the news feed, not to a cell already headed "Cancelled".
    expect(cell).not.toContain('she is not fit for that week')
    w.unmount()
  })

  it('⚠ the row and the feed still say the same thing – the two halves have not drifted apart', () => {
    // NOT the same claim as before R2-02. The screen no longer READS this sentence; it renders the
    // same pair of facts (`label – weekLabel(week)`) from the typed report, so this asserts that the
    // player's news and the player's popup agree about the tournament – a copy property, checked
    // against the engine's real output rather than against a literal this file also wrote.
    const world = base('prefix-agree')
    const wk = world.week
    const open = enterable(world, wk + 2, wk + 6).slice(0, 1)
    expect(open.length).toBe(1)
    enterEvent(world, open[0].id)
    onsetInjury(world, rngFromSeed(seedForLayoff(world, 8)), 'week', BODY_REGIONS)

    // ⚠ FOUND WITHOUT THE PREFIX, or this assertion would be reading its own answer back: the entry
    // rows this week are the `Entered ...` one `enterEvent` wrote and the release the injury wrote.
    const line = world.events.find(
      (e) => e.week === wk && e.type === 'entry' && !e.text.startsWith('Entered '),
    )
    expect(line, 'the engine wrote a release row').toBeTruthy()
    expect(line!.text.startsWith(RELEASE_LINE_PREFIX.injury), line!.text).toBe(true)
    // ...and the row carries the FACT as well as the sentence, which is the fix.
    expect(line!.entryRef, 'the release row names its entry in structure').toEqual({
      id: open[0].id,
      label: TIERS[open[0].tier].label,
      week: open[0].week,
      releasedBy: 'injury',
    })

    const w = mountReport(toSnapshot(world))
    const named = line!.text.slice(RELEASE_LINE_PREFIX.injury.length).replace(/,.*$/, '')
    expect(cancelledCell(w)).toContain(named)
    w.unmount()
  })

  it('⭐⭐ THE MUTATION THAT DEFINES SUCCESS – re-word every feed line, and the report is unmoved', () => {
    // ⚠ THIS TEST WAS NOT WRITABLE BEFORE R2-02. The sentence WAS the data source, so changing the
    // wording and still demanding the right answer asked the reader to work with no input – the old
    // component would have rendered "Nothing" and no money, correctly, given what it had. That is
    // the whole defect, stated as a test: a copy edit must not be able to break a domain fact.
    const world = base('cancelled-open')
    const wk = world.week
    const open = enterable(world, wk + 2, wk + 6).slice(0, 2)
    expect(open.length).toBe(2)
    for (const e of open) enterEvent(world, e.id)
    onsetInjury(world, rngFromSeed(seedForLayoff(world, 8)), 'week', BODY_REGIONS)
    const fees = open.reduce((s, e) => s + TIERS[e.tier].entryFeeCents, 0)

    // THE COPY EDITOR'S PASS. Every sentence in the feed rewritten, structure untouched – which is
    // exactly what 05.08 did to one of them and what nobody noticed for a week.
    for (const e of world.events) e.text = `A different sentence entirely (${e.id}).`
    // Both of the OLD reader's predicates are now provably blind on this input...
    expect(world.events.filter((e) => e.text.startsWith(RELEASE_LINE_PREFIX.injury)).length).toBe(0)
    expect(world.events.filter((e) => e.text.startsWith('Entry refunded')).length).toBe(0)

    // ...and the screen is right anyway.
    const w = mountReport(toSnapshot(world))
    const cell = cancelledCell(w)
    expect(cell, 'still not claiming nothing happened').not.toContain('Nothing')
    for (const e of open) expect(cell, `${e.tier} is still named`).toContain(TIERS[e.tier].label)
    expect(cell.match(/Withdrawn:/g)?.length, 'still one line per cancelled entry').toBe(2)
    expect(cell, 'and the money is still exact').toContain(formatCents(fees))
    expect(cell, 'and none of the re-worded prose leaked onto the card').not.toContain('A different sentence')
    w.unmount()
  })

  it('⭐ ...and the same holds when the ENGINE ITSELF is re-worded, before it writes a thing', () => {
    // The other direction: not a post-hoc edit of the rows, but a genuine change to the copy the
    // engine emits – the exact shape of the 05.08 regression, replayed. `RELEASE_LINE_PREFIX` is a
    // live object both sides used to read; only the feed reads it now.
    const world = base('cancelled-open')
    const wk = world.week
    const open = enterable(world, wk + 2, wk + 6).slice(0, 2)
    for (const e of open) enterEvent(world, e.id)
    const shipped = RELEASE_LINE_PREFIX.injury
    try {
      RELEASE_LINE_PREFIX.injury = 'Scratched from '
      onsetInjury(world, rngFromSeed(seedForLayoff(world, 8)), 'week', BODY_REGIONS)
      expect(
        world.events.filter((e) => e.week === wk && e.type === 'entry' && e.text.startsWith('Scratched from ')).length,
        'the engine really did write the new sentence',
      ).toBe(2)
      const w = mountReport(toSnapshot(world))
      const cell = cancelledCell(w)
      for (const e of open) expect(cell, `${e.tier} is named under the new copy too`).toContain(TIERS[e.tier].label)
      expect(cell.match(/Withdrawn:/g)?.length).toBe(2)
      w.unmount()
    } finally {
      RELEASE_LINE_PREFIX.injury = shipped
    }
  })
})

describe('⭐⭐ round-20 #2 (2) – nothing was cancelled, and something was still lost', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('says what it FORFEITED when the lists had already closed – his own shape', () => {
    // ⚠ TWO TOURNAMENTS ON CONSECUTIVE WEEKS, which is his report word for word, and it is also the
    // ONLY arrangement in which both lists can be shut with neither week played: lists close two
    // weeks out, so `deadline(N+1) = N - 1` and the one week that is past both deadlines and not yet
    // finished is week N itself. That is why he saw it twice running rather than once.
    const world = consecutivePair()
    const { first, second } = world.pair
    const wk = world.state.week
    expect(wk, 'the first list has shut').toBeGreaterThan(first.deadlineWeek)
    expect(wk, 'and so has the second').toBeGreaterThan(second.deadlineWeek)
    expect(second.week, 'consecutive weeks, as he described').toBe(first.week + 1)

    onsetInjury(world.state, rngFromSeed(seedForLayoff(world.state, 3)), 'week', BODY_REGIONS)
    expect(
      world.state.events.filter((e) => e.week === wk && e.text.startsWith(RELEASE_LINE_PREFIX.injury))
        .length,
      'the engine cancelled nothing – there was nothing it was allowed to cancel',
    ).toBe(0)
    expect(world.state.entries.length, 'and she is still on both lists').toBe(2)

    const w = mountReport(toSnapshot(world.state))
    const cell = cancelledCell(w)
    expect(cell, 'it still answers the question honestly').toContain('Nothing')
    expect(cell, '...but never with the sentence that was backwards').not.toContain('every entry stands')
    expect(cell, 'the lists are named as the reason').toContain('closed')
    expect(cell, 'and what it actually costs her is on the row').toContain('Forfeited:')
    // ⭐ R2-02 – BOTH OF THEM NOW, INCLUDING THE ONE ON THE INJURY'S OWN WEEK. This assertion used to
    // name only the second, with a note that `upcoming` starts at week+1 so the tournament she was
    // entered in THIS week "is not a fact the snapshot carries". It carries it now: `stranded` is
    // recomputed from `world.entries` against the engine's own `layoffCovering`, which has neither
    // the week+1 floor nor the UPCOMING_WEEKS ceiling that hid the tail of a long layoff.
    expect(cell).toContain(TIERS[second.tier].label)
    expect(cell.match(/Forfeited:/g)?.length, 'both weeks she cannot appear in').toBe(2)
    w.unmount()
  })

  it('a layoff that reaches nothing she holds says exactly that, and nothing more', () => {
    // The genuinely empty case, and the control that keeps the two above from being vacuous: no
    // entries at all, so there is nothing to cancel and nothing to forfeit.
    const world = base('no-entries')
    expect(world.entries.length).toBe(0)
    onsetInjury(world, rngFromSeed(seedForLayoff(world, 3)), 'week', BODY_REGIONS)

    const w = mountReport(toSnapshot(world))
    const cell = cancelledCell(w)
    expect(cell).toContain('Nothing')
    expect(cell).not.toContain('Withdrawn:')
    expect(cell).not.toContain('Forfeited:')
    w.unmount()
  })
})

// =================================================================================================
// ⭐ R2-02 – THE THREE CIRCUMSTANCES, EACH DRIVEN THROUGH ITS OWN DOOR
// =================================================================================================
//
// The engine distinguishes two doors (`InjuryCause = 'week' | 'retirement'`) and one flag on the
// match row (`friendly`), and the report's `kind` is exactly those three – nothing is invented. Each
// one below comes off a real world that really went through that door, and the assertion is on the
// SENTENCE the player reads, so the formatter is what is being measured.

/** The `How` cell, found by its heading like `cancelledCell` above. */
function howCell(w: ReturnType<typeof mount>): string {
  const row = w.findAll('tr').find((tr) => tr.find('th').text() === 'How')
  expect(row, 'the report still has a How row').toBeTruthy()
  return row!.find('td').text()
}

/** SHE STOPPED ON COURT, IN A TOURNAMENT – real draws played until one ends that way, then revealed
 *  through the world's own path so `finalizeTournament` opens the layoff exactly as a tap would. */
function driveKidRetirement(world: WorldState, tier: TierId) {
  const event = world.season.find((e) => e.tier === tier)!
  const kid = kidMatchPlayer(world)
  const field = world.cohort.slice(0, TIERS[tier].drawSize).map((p) => rivalMatchPlayer(p, event.surface))
  const players: Record<string, MatchPlayer> = { [KID_ID]: kid }
  for (const p of field) players[p.id] = p
  for (let s = 0; s < 900; s++) {
    const result = runTournament(event, field, kid, `ui-kidret-${tier}-${s}`, rngFromSeed(`ui-kidret-rng-${s}`))
    const m = result.matches.find((r) => r.retiredId === KID_ID)
    if (!m) continue
    world.pendingTournament = { eventId: event.id, result, revealedRounds: 0, finished: false, players }
    skipTournament(world)
    closeTournament(world)
    return { event, m }
  }
  throw new Error(`no kid retirement found at ${tier} in 900 seeded draws`)
}

/** ...AND SHE CAN STOP IN A HIT-OUT AT THE HOME CLUB TOO (10.08, «травма и травма, нет разницы»).
 *  `resolvePractice` is the engine's own friendly path; only WHICH draw lands is searched for, on
 *  the same argument `seedForLayoff` makes about its probe stream. */
function driveFriendlyRetirement(): WorldState {
  const seed = base('friendly-ret')
  bookPractice(seed, seed.week + 1, false)
  const rng = rngFromSeed(seed.seed)
  tickWeek(seed, rng)
  for (let i = 0; i < 600; i++) {
    const probe = JSON.parse(JSON.stringify(seed)) as WorldState
    // Put the booking back on TODAY and hand the practice generator a different draw.
    probe.practices = [{ week: probe.week, paidCents: 0, withCoach: false }]
    probe.injury = null
    probe.seed = `friendly-probe-${i}`
    resolvePractice(probe)
    const row = probe.events.find((e) => e.week === probe.week && e.friendly && e.match?.retiredId === KID_ID)
    if (row && probe.injury) return probe
  }
  throw new Error('no practice-match retirement in 600 seeded friendlies')
}

describe('⭐ R2-02 – the dialog renders each circumstance the engine can produce', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the WEEKLY ROLL says off court, and refuses to name a week shape the engine never recorded', () => {
    const world = base('how-week')
    onsetInjury(world, rngFromSeed(seedForLayoff(world, 3)), 'week', BODY_REGIONS)
    const snap = toSnapshot(world)
    expect(snap.injuryReport!.kind).toBe('off-court')

    const w = mountReport(snap)
    expect(howCell(w)).toContain('Off court')
    // The honesty rule: the roll can land on a training week, a travel week, an arrival week or a
    // family holiday, and the engine records which NOWHERE.
    expect(howCell(w)).not.toContain('training')
    expect(w.find('.season-summary-title').text(), 'and the title is the quiet one').toBe("She's hurt.")
    w.unmount()
  })

  it('the RETIREMENT says on court, names the girl across the net and the round she had reached', () => {
    const world = base('how-retire')
    const { event, m } = driveKidRetirement(world, 'local')
    const snap = toSnapshot(world)
    expect(snap.injuryReport!.kind).toBe('retired-match')

    const w = mountReport(snap)
    const how = howCell(w)
    expect(how).toContain('On court')
    expect(how, 'the opponent, off the record').toContain(snap.injuryReport!.oppName!)
    expect(how, 'the round, said the way a draw sheet says it').toContain(
      stageLabel(m.round, TIERS[event.tier].drawSize),
    )
    expect(how, 'and the round she reached is hers – the rulebook clause').toContain('is hers')
    expect(w.find('.season-summary-title').text(), 'a different week deserves a different title').toBe('She had to stop.')
    w.unmount()
  })

  it('the PRACTICE MATCH says so – a friendly has no bracket, so no round is claimed for it', () => {
    const world = driveFriendlyRetirement()
    const snap = toSnapshot(world)
    expect(snap.injuryReport!.kind).toBe('retired-friendly')
    expect(snap.injuryReport!.stage, 'a hit-out at the home club has no draw').toBeUndefined()

    const w = mountReport(snap)
    const how = howCell(w)
    expect(how).toContain('practice match')
    expect(how, 'and it is still on court').toContain('On court')
    expect(how, 'no draw, no round').not.toContain('Round of')
    w.unmount()
  })
})

// =================================================================================================
// ⭐ ROUND-20 #3 – THE HOUSE LAW FOR EVERY DIALOG: the way out is on the screen
// =================================================================================================

describe('⭐ the injury report fits a 375x667 phone', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** The longest shape this card can take: a retirement (the longest `How` sentence there is),
   *  two cancelled entries with their refund line, on a real world. */
  function mountLongest(vp = PHONE) {
    setViewport(vp)
    const world = base('cancelled-open')
    const wk = world.week
    const open = enterable(world, wk + 2, wk + 6).slice(0, 2)
    for (const e of open) enterEvent(world, e.id)
    onsetInjury(world, rngFromSeed(seedForLayoff(world, 8)), 'week', BODY_REGIONS)
    const snap = toSnapshot(world)
    // The one fact this world cannot also carry – it went down between matches – spliced onto the
    // real projection so the measurement is against the longest copy the card can hold.
    snap.injuryReport = {
      ...snap.injuryReport!,
      kind: 'retired-match',
      oppName: 'Aleksandra Vukovic-Delacroix',
      stage: 'Quarterfinal',
      eventLabel: TIERS[open[0].tier].label,
    }
    useGameStore().snapshot = snap
    const w = mount(InjuryStopDialog, { attachTo: document.body })
    const card = document.querySelector('.dialog-overlay .dialog-card')!
    const dismiss = document.querySelector('.dialog-overlay .dialog-actions')!
    expect(card, 'the report is up – nothing below is vacuous').toBeTruthy()
    expect(dismiss.querySelectorAll('button').length, 'the actions ARE the way out').toBeGreaterThan(0)
    return { w, card, dismiss }
  }

  it('⭐ the Continue button is inside the screen at 375x667', () => {
    const { w, card, dismiss } = mountLongest()
    assertDismissReachable(card, dismiss, PHONE, 'InjuryStopDialog (retirement + two cancelled)')
    w.unmount()
  })

  it('...and on the narrowest screen the app supports', () => {
    const { w, card, dismiss } = mountLongest(NARROW_PHONE)
    assertDismissReachable(card, dismiss, NARROW_PHONE, 'InjuryStopDialog (retirement + two cancelled)')
    w.unmount()
  })

  it('⚠⚠ MUTATION PROOF – strip the height cap and the SAME assertion goes red', () => {
    // Without this the two above prove only that the shared cascade exists. This card's content DOES
    // overflow a phone (art + five table rows + two notes), so removing the bound is exactly the
    // shape `TourBriefingDialog` shipped in and the owner's career stopped in.
    const { w, card, dismiss } = mountLongest()
    ;(card as HTMLElement).style.maxHeight = 'none'
    ;(card as HTMLElement).style.overflowY = 'visible'
    expect(() => assertDismissReachable(card, dismiss, PHONE, 'InjuryStopDialog (cap removed)')).toThrow(
      /declares no height bound|taller than the screen|outside the viewport/,
    )
    w.unmount()
  })
})
