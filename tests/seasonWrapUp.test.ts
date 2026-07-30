import { describe, it, expect } from 'vitest'
import {
  createWorld,
  tickWeek,
  enterEvent,
  revealTournamentRound,
  skipTournament,
  toSnapshot,
  flipScore,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { isOffSeasonWeek, TIERS } from '../src/engine/season/calendar'

function run(seed: string, weeks: number): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    // A tournament reveal pauses the world; resolve it immediately so time keeps moving.
    if (world.pendingTournament && !world.pendingTournament.finished) skipTournament(world)
  }
  return world
}

describe('off-season (Round 5 items 16/21)', () => {
  it('never schedules an event in an off-season week, across several years', () => {
    const world = run('off-season-calendar', 300)
    for (const e of world.season) expect(isOffSeasonWeek(e.week)).toBe(false)
  })

  it('fires the year-0 wrap-up milestone the moment the world ticks into week 49', () => {
    const world = createWorld('wrap-up-timing')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 48; i++) tickWeek(world, rng)
    expect(world.events.some((e) => e.milestoneKey === 'season-wrap-0')).toBe(false)
    tickWeek(world, rng) // week 49
    expect(world.week).toBe(49)
    const wrap = world.events.find((e) => e.milestoneKey === 'season-wrap-0')
    expect(wrap).toBeTruthy()
    expect(wrap!.keep).toBe(true)
    expect(wrap!.text).toContain('Season 2031 wrap-up')
    // ⚠ RE-AIMED (30.07, fix/ranking-truth). THE PROTECTED FACT IS UNCHANGED - the wrap-up milestone
    // fires on the tick into week 49, is kept, names the season and STATES WHERE SHE STANDS. What moved
    // is that "where she stands" is now said honestly in the case this fixture happens to be in.
    //
    // This career never enters an event, so she holds no international point, and her `kidRank` is the
    // dense rank of the entire 0-point tie group - a tie, not a ranking. Printing "#127" for that is
    // exactly what `rankLabel` exists to refuse, and it read "#127" here while the Stats International
    // tab read "Unranked" one tab away: the owner's own complaint (Home #4 vs Stats #128) in new clothes.
    // A career that HAS an international point still prints "International rank #N", asserted below.
    expect(wrap!.text).toMatch(/International rank #\d+|Unranked internationally/)
    expect(wrap!.text).toMatch(/\d+ pts this season/)
    expect(wrap!.text).toMatch(/\d+-\d+ \(W-L\)/)
    expect(wrap!.text).toMatch(/funds [+-]\$/)
    // the companion off-season flavor line lands the same week
    expect(world.events.some((e) => e.week === 49 && e.type === 'info' && e.text.includes('Off-season'))).toBe(true)
  })

  it('a girl who HOLDS an international point gets the number; one who does not gets "Unranked"', () => {
    // The other half of the re-aim above, so neither branch can rot. Both worlds tick the same way; the
    // only difference is whether an international result sits in the ledger. `j300` because the track,
    // not the value, is what decides which table a result pays into.
    const ranked = createWorld('wrap-ranked')
    ranked.results.push({ playerId: KID_ID, week: 1, points: 300, tier: 'j300' })
    const unranked = createWorld('wrap-ranked')
    // ...and a DOMESTIC result of the same size must NOT buy her an international ranking: two
    // currencies, no exchange rate (docs/specs/two-ladders.md).
    unranked.results.push({ playerId: KID_ID, week: 1, points: 300, tier: 'national' })
    for (const w of [ranked, unranked]) {
      const rng = rngFromSeed(w.seed)
      for (let i = 0; i < 49; i++) tickWeek(w, rng)
    }
    const textOf = (w: typeof ranked) => w.events.find((e) => e.milestoneKey === 'season-wrap-0')!.text
    expect(textOf(ranked)).toMatch(/International rank #\d+/)
    expect(textOf(ranked)).not.toContain('Unranked')
    expect(textOf(unranked)).toContain('Unranked internationally')
    expect(textOf(unranked)).not.toMatch(/International rank #\d+/)
  })

  it('never fires the same year wrap-up twice, even ticking through the whole off-season', () => {
    const world = run('wrap-up-once', 60)
    const wraps = world.events.filter((e) => e.milestoneKey === 'season-wrap-0')
    expect(wraps.length).toBe(1)
  })

  // W7 – THE CAREER'S SPENDING HISTORY, and the reason it has to be banked at the wrap-up rather
  // than computed when somebody asks. The owner: «было бы очень интересно где-то хранить всю историю
  // затрат за карьеру по годам в каком-то виде.»
  //
  // ⚠ THE FIGURE IS ONLY AVAILABLE FOR ONE MOMENT. It comes off `world.financeWeeks`, which
  // `pruneFinanceWeeks` trims to a 60-week trailing window every single week, so a season's
  // per-category rows are gone from the save about fourteen months of game-time after it ends. The
  // wrap-up is the last tick at which season N's whole ledger is still inside that window. This test
  // therefore does the thing that would catch a regression a unit test on the wrap-up alone could
  // not: it runs a career THREE seasons past the first wrap-up and checks season 0's cost is still
  // on the row, long after the ledger it was read from has been pruned away.
  it('banks what each season COST, and the figure survives the ledger being pruned', () => {
    const world = run('season-spend-history', 210)
    expect(world.seasonHistory.length, 'four seasons wrapped').toBeGreaterThanOrEqual(3)
    const first = world.seasonHistory.find((h) => h.seasonIndex === 0)!
    // A season of a real career always costs something - she has a coach, a racquet and a calendar.
    expect(first.spentCents, 'season 0 cost nothing?').toBeGreaterThan(0)
    expect(first.earnedCents).toBeGreaterThanOrEqual(0)
    // ...and the ledger those numbers came from is long gone, which is the whole point of banking.
    expect(
      world.financeWeeks.some((w) => w.week < 52),
      'season 0 still has finance rows – this test is no longer proving anything',
    ).toBe(false)
    // GROSS IS NOT NET, and keeping both is the reason the field exists: `fundsDeltaCents` can be a
    // shrug over a year that cost thousands.
    for (const h of world.seasonHistory) {
      expect(h.spentCents, `season ${h.seasonIndex}`).toBeGreaterThan(0)
      expect(h.earnedCents! - h.spentCents!).toBe(h.fundsDeltaCents)
    }
  })

  it('fires a second wrap-up (season-wrap-1) at week 101 (49 + 52)', () => {
    const world = run('wrap-up-year1', 102)
    expect(world.events.some((e) => e.milestoneKey === 'season-wrap-0')).toBe(true)
    expect(world.events.some((e) => e.milestoneKey === 'season-wrap-1')).toBe(true)
  })
})

describe('new-tournament calendar marker (Round 5 item 23)', () => {
  it('does not fire on a brand-new career (nothing "new" to a career that has never played)', () => {
    const world = createWorld('fresh-calendar')
    expect(world.events.some((e) => e.type === 'info' && e.text === 'New events on the calendar')).toBe(false)
  })

  it('fires once ongoing play generates a fresh calendar block', () => {
    const world = run('rolling-calendar', 60)
    expect(world.events.some((e) => e.type === 'info' && e.text === 'New events on the calendar')).toBe(true)
  })
})

describe('full bracket view (Round 5 item 5)', () => {
  function buildToPending(seed: string): WorldState {
    const world = createWorld(seed)
    const rng = rngFromSeed(seed)
    const event = world.season.find((e) => e.week >= 5 && e.deadlineWeek >= world.week)!
    // r-gate (season-life-01b): points-based eligibility. Grant the kid a throwaway result worth the
    // tier's minPoints ONLY for the enterEvent gate check, then drop it before any tick so nothing
    // downstream is perturbed (local's min is 0, needing no grant).
    const min = TIERS[event.tier].enterPointBand[0]
    const marker = { playerId: KID_ID, week: world.week, points: min, tier: event.tier }
    if (min > 0) world.results.push(marker)
    enterEvent(world, event.id)
    if (min > 0) world.results = world.results.filter((r) => r !== marker)
    while (world.week < event.week) tickWeek(world, rng)
    return world
  }

  it('is empty before any round is revealed', () => {
    const world = buildToPending('full-bracket-empty')
    const pending = toSnapshot(world).pending!
    expect(pending.fullBracket).toEqual([])
  })

  it('grows round by round and includes non-kid matches with resolved names', () => {
    // `grow-2` is a seed where the kid stays HEALTHY up to the event week (Season-Life slice C:
    // an injury would auto-withdraw/walk over the run – `grow-1` started doing exactly that) AND
    // WINS her opening match, so after one reveal she is still in the draw (not finished) and the
    // spoiler-safe cap applies – exactly the incremental growth this test pins. (Once she's
    // FINISHED the cap lifts and the whole draw is exposed; that spectate behaviour is covered
    // in tournamentReveal.test.ts.)
    // ⚠ RE-PICKED (`grow-5` -> `grow-2`) by the AI sub-stream refactor. Her OWN matches still run
    // on the untouched `seed:kidtour` stream, but her FIELD does not: selectEntrants seeds off the
    // AI standings, and the AI now play their brackets on `seed:aitour:<event.id>`, so a different
    // set of juniors holds the points and she draws a different opening opponent. Nothing about
    // the behaviour under test changed – only which seed happens to exhibit it.
    const world = buildToPending('grow-2')
    revealTournamentRound(world)
    const pending = toSnapshot(world).pending!
    expect(world.pendingTournament!.finished).toBe(false)
    expect(pending.fullBracket.length).toBeGreaterThan(0)
    // every match in the revealed round(s) is present, not just the kid's
    expect(pending.fullBracket.every((m) => m.round <= 0)).toBe(true)
    for (const m of pending.fullBracket) {
      expect(m.aName.length).toBeGreaterThan(0)
      expect(m.bName.length).toBeGreaterThan(0)
      expect([m.aId, m.bId]).toContain(m.winnerId)
    }
    // the kid's own round-0 match is among them
    expect(pending.fullBracket.some((m) => m.aId === KID_ID || m.bId === KID_ID)).toBe(true)
  })

  it('normalises score to the WINNER\'s perspective regardless of which side (a/b) won', () => {
    // Regression: a kid match where the kid sits on side B used to flip the score to her
    // perspective while leaving the display order as a-then-b, so a losing side A read as
    // if it had won. `score` must always match the RAW MatchRecord flipped iff B won –
    // i.e. describe the winner's games first, no matter which side actually won.
    let sawKidOnB = false
    for (let i = 0; i < 20 && !sawKidOnB; i++) {
      const world = buildToPending(`score-orientation-${i}`)
      skipTournament(world)
      const raw = world.pendingTournament!.result.matches
      const pending = toSnapshot(world).pending!
      for (const m of pending.fullBracket) {
        const record = raw.find((r) => r.round === m.round && r.aId === m.aId && r.bId === m.bId)!
        if (!record.score) continue
        const expected = record.winnerId === record.bId ? flipScore(record.score) : record.score
        expect(m.score).toBe(expected)
        if (record.bId === KID_ID) sawKidOnB = true
      }
    }
    // Sanity: the loop actually exercised a kid-on-side-B match at least once across seeds.
    expect(sawKidOnB).toBe(true)
  })

  it('never exceeds the highest revealed round, and covers everything once finished', () => {
    // ⚠ SEED-WALKED by the random-draw change (28.07). Once a run is FINISHED the full bracket
    // spans the whole draw, so "never exceeds the kid's highest round" is only a real statement
    // when her highest round IS the last one - i.e. when she reached the final. That used to hold
    // on this fixed seed and no longer does, because the draw is no longer rigged against her.
    let world!: WorldState
    for (let i = 0; i < 40; i++) {
      const w = buildToPending(`full-bracket-finish-${i}`)
      const finish = w.pendingTournament!.result.finishes[KID_ID]
      if (finish !== undefined && finish > 1) continue // out before the final
      world = w
      break
    }
    expect(world, 'no seed in 40 took her to the final').toBeTruthy()
    skipTournament(world)
    const pending = toSnapshot(world).pending!
    const kidRounds = new Set(
      world.pendingTournament!.result.matches
        .filter((m) => m.aId === KID_ID || m.bId === KID_ID)
        .map((m) => m.round),
    )
    const maxRound = Math.max(...kidRounds)
    expect(pending.fullBracket.every((m) => m.round <= maxRound)).toBe(true)
    // total matches shown = every match up to and including the kid's last round
    const expectedCount = world.pendingTournament!.result.matches.filter((m) => m.round <= maxRound).length
    expect(pending.fullBracket.length).toBe(expectedCount)
  })
})
