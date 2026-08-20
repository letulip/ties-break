// ROUND 23 #3b – «сходы можно записать как травмы в логе матча, недели или новостях… мир по
// ощущениям станет чуть живее» (owner, 20.08, after reading #3's analysis).
//
// WHAT THIS FILE IS ABOUT, and what it is emphatically NOT about. Item #3 established that a rival
// CAN stop mid-match (3.44% of matches carry a retirement, either side) and that she is NEVER HURT
// by it – there is no rival body, no layoff, no missed draw, and `season/rival.ts`'s "Rivals get NO
// injuries, NO physio, NO vacations and NO plan slider" is still true to the letter. He then ruled
// the mechanic out in as many words («травмы соперницам пока не строим») and asked for the other
// thing: that what ALREADY happens be SAID OUT LOUD. So every fact in the sentence under test is
// read off `MatchRecord.retiredId`, which has been persisted since the retirement slice.
//
// ⚠ THE WORDING IS THE ITEM, so the copy contract is asserted as hard as the plumbing: the line may
// say she retired hurt and which set she went off in – both true off the record – and may NOT
// promise a layoff, a diagnosis or a return date, because the model has none of those for a rival
// and she is entered again next Monday.
//
// ZERO NEW RNG. `rivalRetirementNews` takes no `Rng`, and the third block proves the main stream's
// position is untouched across the reveal that emits it.

import { describe, expect, it } from 'vitest'
import {
  createWorld,
  tickWeek,
  enterEvent,
  skipTournament,
  closeTournament,
  kidMatchPlayer,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { rivalRetirementNews, tierMakesWorldNews } from '../src/engine/world/matchNews'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS, isTierAgeOpen } from '../src/engine/season/calendar'
import { runTournament } from '../src/engine/season/tournament'
import { rivalMatchPlayer } from '../src/engine/season/rival'
import { engineModuleFunction } from './worldSource'
import type { MatchPlayer } from '../src/engine/match/types'
import type { MatchRecord, SeasonEvent, TierId, TournamentResult } from '../src/engine/season/types'

/** The marker the row leads with – 🩹, spelled as an escape so an editor cannot eat it. */
const MARK = '\u{1FA79}'

/** A real draw at `tier`, played by the real kid against a real slice of the real cohort, searched
 *  over tournament seeds until the girl ACROSS THE NET is the one who could not finish. Nothing is
 *  hand-built: `runTournament` is the function the world itself calls. */
function findRivalRetirement(
  world: WorldState,
  tier: TierId,
): { event: SeasonEvent; result: TournamentResult; players: Record<string, MatchPlayer>; m: MatchRecord } {
  const event = world.season.find((e) => e.tier === tier)!
  const kid = kidMatchPlayer(world)
  const field = world.cohort.slice(0, TIERS[tier].drawSize).map((p) => rivalMatchPlayer(p, event.surface))
  const players: Record<string, MatchPlayer> = { [KID_ID]: kid }
  for (const p of field) players[p.id] = p
  for (let s = 0; s < 900; s++) {
    const result = runTournament(event, field, kid, `retnews-${tier}-${s}`, rngFromSeed(`retnews-rng-${s}`))
    const m = result.matches.find(
      (r) => r.retiredId !== undefined && r.retiredId !== KID_ID && (r.aId === KID_ID || r.bId === KID_ID),
    )
    if (m) return { event, result, players, m }
  }
  throw new Error(`no rival retirement found at ${tier} in 900 seeded draws`)
}

/** The same search, the other way round: SHE is the one who stopped. */
function findKidRetirement(world: WorldState, tier: TierId) {
  const event = world.season.find((e) => e.tier === tier)!
  const kid = kidMatchPlayer(world)
  const field = world.cohort.slice(0, TIERS[tier].drawSize).map((p) => rivalMatchPlayer(p, event.surface))
  const players: Record<string, MatchPlayer> = { [KID_ID]: kid }
  for (const p of field) players[p.id] = p
  for (let s = 0; s < 900; s++) {
    const result = runTournament(event, field, kid, `kidret-${tier}-${s}`, rngFromSeed(`kidret-rng-${s}`))
    const m = result.matches.find((r) => r.retiredId === KID_ID)
    if (m) return { event, result, players, m }
  }
  throw new Error(`no kid retirement found at ${tier} in 900 seeded draws`)
}

/** Drive a computed run through the world's OWN reveal path – the same call the "Skip tournament"
 *  button makes. Scaffolding is confined to how she got into the draw; everything from `pending`
 *  onwards is production code. */
function revealThrough(world: WorldState, r: ReturnType<typeof findRivalRetirement>): void {
  world.pendingTournament = {
    eventId: r.event.id,
    result: r.result,
    revealedRounds: 0,
    finished: false,
    players: r.players,
  }
  skipTournament(world)
  closeTournament(world)
}

// =================================================================================================
// 1. THE SENTENCE – rendered off real records, in both registers
// =================================================================================================

describe('round 23 #3b – the line a rival retirement writes', () => {
  it('names her, the set she went off in, and – at a rung the world reports on – the tournament', () => {
    const world = createWorld('retnews-copy')
    const local = findRivalRetirement(world, 'local')
    const tour = findRivalRetirement(world, 'wta500')

    const herWeek = rivalRetirementNews(world, local.event, local.m, local.players)!
    const worldNews = rivalRetirementNews(world, tour.event, tour.m, tour.players)!

    // eslint-disable-next-line no-console
    console.log(
      '\nTHE TWO REGISTERS, rendered off real draws (score is the record\'s own):\n\n' +
        `  [${TIERS.local.label}, her week]      ${local.m.score}\n    ${herWeek}\n\n` +
        `  [${TIERS.wta500.label}, world news]  ${tour.m.score}\n    ${worldNews}\n`,
    )

    // Her week names the girl she beat it out of, and does NOT name the tournament: below the cut
    // the world is not watching, and a Local Open is not tour news.
    expect(herWeek.startsWith(MARK)).toBe(true)
    expect(herWeek).toContain('retired hurt')
    expect(herWeek).toContain(`against ${world.profile.kidName.charAt(0)}. ${world.profile.kidLastName}`)
    expect(herWeek).not.toContain(TIERS.local.label)

    // World news speaks in the champion line's own register and names the tournament instead.
    expect(worldNews).toContain(`at the ${TIERS.wta500.label}`)
    expect(worldNews).not.toContain('against')
    expect(tierMakesWorldNews('wta500')).toBe(true)
    expect(tierMakesWorldNews('local')).toBe(false)

    // The girl is named, short-form, exactly as every other bracket surface names her.
    const name = tour.players[tour.m.retiredId!].name
    expect(worldNews).toContain(`${name.charAt(0)}. ${name.split(' ').slice(1).join(' ')}`)
  })

  it('is HONEST: it never promises a layoff, a diagnosis or a return date', () => {
    // The whole risk in this item. She retired from a match; nothing in the model says she is
    // injured for any length of time, and next Monday she is in the draw at full strength.
    const world = createWorld('retnews-honest')
    const lines: string[] = []
    // The tier's own name is the one place a digit is allowed ("World Tour 100"), so it is taken
    // out before the no-figure sweep – the claim is about what the SENTENCE adds, not about the
    // rung's label, which the champion line already prints.
    const stripped: string[] = []
    for (const tier of ['local', 'w15', 'w100', 'wta250', 'wta500', 'wta1000', 'slam'] as TierId[]) {
      const r = findRivalRetirement(world, tier)
      const line = rivalRetirementNews(world, r.event, r.m, r.players)!
      lines.push(line)
      stripped.push(line.replace(TIERS[tier].label, ''))
    }
    // eslint-disable-next-line no-console
    console.log('\nSEVEN RUNGS, seven real retirements:\n' + lines.map((l) => `  ${l}`).join('\n') + '\n')

    for (const line of stripped) {
      // No promise of time away – "out ~4 weeks", "will miss", "back in week 31".
      expect(line).not.toMatch(/\b(out for|out ~|will miss|misses|weeks? out|back in|return|sidelined|ruled out)\b/i)
      // No diagnosis: the rival has no `kind`, no scan and no clinic.
      expect(line).not.toMatch(/\b(hamstring|shoulder|ankle|wrist|knee|back|clinic|scan|diagnos)\w*\b/i)
      // No figure at all: a number in this sentence can only be a duration we do not model.
      expect(line).not.toMatch(/\d/)
      // House style: short dash only, and no Cyrillic in anything the player reads.
      expect(line).not.toContain('—')
      expect(line).not.toMatch(/[Ѐ-ӿ]/)
    }
  })

  it('reads the set off the scoreline, and says "after" when she went off at the change of ends', () => {
    // The one case the token count alone gets wrong: match/engine.ts pops a trailing 0-0 ("real
    // result sheets print 6-4 ret., not 6-4 0-0 ret."), so a retirement BETWEEN sets comes back
    // with a COMPLETE last set. Calling that "in the first set" would be a small lie about a set
    // she finished. Driven through the public function on synthetic scorelines, because the
    // change-of-ends case is rare enough that seed-searching for it is not a test, it is a wait.
    const world = createWorld('retnews-sets')
    const r = findRivalRetirement(world, 'local')
    const say = (score: string) =>
      rivalRetirementNews(world, r.event, { ...r.m, score }, r.players)!.split('–')[1].trim()

    expect(say('2-1')).toBe('she went off in the first set.')
    expect(say('6-4 2-1')).toBe('she went off in the second set.')
    expect(say('6-4 3-6 4-2')).toBe('she went off in the third set.')
    expect(say('6-4 6-6')).toBe('she went off in the second set.') // 6-6 is a tiebreak in progress
    expect(say('6-4')).toBe('she went off after the first set.') // 6-4 is WON – the change of ends
    expect(say('6-4 3-6')).toBe('she went off after the second set.')
    expect(say('7-6')).toBe('she went off after the first set.')
    expect(say('7-5')).toBe('she went off after the first set.')
    expect(say('6-5')).toBe('she went off in the first set.') // not won yet
  })

  it('says nothing when there is nothing to say', () => {
    const world = createWorld('retnews-null')
    const r = findRivalRetirement(world, 'local')
    // No retirement on the record.
    expect(rivalRetirementNews(world, r.event, { ...r.m, retiredId: undefined }, r.players)).toBeNull()
    // HER retirement: `finalizeTournament` already ends her summary with "– she retired hurt" and
    // `retirementInjury` files the clinic's verdict, so a third row would only repeat them.
    expect(rivalRetirementNews(world, r.event, { ...r.m, retiredId: KID_ID }, r.players)).toBeNull()
    // A match she was not in. Unreachable today (AI-AI rows carry no `retiredId` at all), asserted
    // so that it stays unreachable if that ever changes.
    expect(
      rivalRetirementNews(world, r.event, { ...r.m, aId: 'ai-1', bId: 'ai-2' }, r.players),
    ).toBeNull()
  })

  it('draws nothing: the writer takes no Rng and touches no stream', () => {
    const src = engineModuleFunction('world/matchNews', 'rivalRetirementNews')
    expect(src).not.toMatch(/\brng\b|Math\.random|rngFromSeed|pickInt|pickOne/)
  })
})

// =================================================================================================
// 2. IT REACHES THE FEED – her week, on a career actually played
// =================================================================================================

describe('round 23 #3b – a rival retirement in HER match reaches her week feed', () => {
  it('lands in world.events, in her week, directly under the match row', () => {
    // A REAL career: created, entered, ticked, revealed. The seeds are pre-found so the test is
    // cheap; the loop is what makes it robust – any one of them showing the row is the claim.
    let hit: { seed: string; week: number; world: WorldState } | null = null
    for (const seed of ['ret-news-33', 'ret-news-31', 'ret-news-16']) {
      const world = createWorld(seed)
      const rng = rngFromSeed(world.seed)
      for (let i = 0; i < 40 && !hit; i++) {
        world.fundsCents = Math.max(world.fundsCents, 500_000_00) // money never decides the entry here
        const age = 14 + Math.floor(world.week / 52)
        const e = world.season.find(
          (x) =>
            x.deadlineWeek >= world.week &&
            TIERS[x.tier].track !== 'wta' &&
            isTierAgeOpen(x.tier, age) &&
            !world.entries.includes(x.id) &&
            !world.season.some((y) => y.week === x.week && world.entries.includes(y.id)),
        )
        if (e) {
          try {
            enterEvent(world, e.id)
          } catch {
            /* a gate said no – the next week tries again */
          }
        }
        tickWeek(world, rng)
        const week = world.week
        if (world.pendingTournament) {
          skipTournament(world)
          closeTournament(world)
          if (world.events.some((x) => x.week === week && x.text.startsWith(MARK))) hit = { seed, week, world }
        }
      }
      if (hit) break
    }
    expect(hit, 'a rival retirement must be reachable in a real career').toBeTruthy()

    const { world, week } = hit!
    const rows = world.events.filter((e) => e.week === week && e.text.startsWith(MARK))
    const row = rows[0]
    const idx = world.events.indexOf(row)
    const above = world.events[idx - 1]

    // eslint-disable-next-line no-console
    console.log(
      `\nHER WEEK, career "${hit!.seed}" week ${week} – straight out of world.events:\n\n` +
        `  ${above.text}\n  ${row.text}\n`,
    )

    // It is in her week, under the match it is about, and the match row is the retirement's own.
    expect(row.week).toBe(week)
    expect(above.type).toBe('match')
    expect(above.text).toContain('beat a retiring')
    expect(row.text).toContain('retired hurt')
    // ⚠ TYPE 'info', NOT 'injury' – world/knock.ts's ruling, for its reason: 'injury' is a channel
    // about HER body and the Memory card's first-injury milestone reads it. Nothing happened to her.
    expect(row.type).toBe('info')
    // ONE row per retirement. The two registers are alternatives, never both.
    expect(rows.length).toBe(
      world.events.filter((e) => e.week === week && e.type === 'match' && e.text.includes('beat a retiring')).length,
    )
    // And the girl who stopped is in her opponent's seat, not in the kid's.
    expect(row.text).not.toContain(`${MARK} ${world.profile.kidName.charAt(0)}.`)
  })
})

// =================================================================================================
// 3. ...AND WORLD NEWS – at the rungs world news already covers, and only those
// =================================================================================================

describe('round 23 #3b – a retirement at a covered tier reaches world news', () => {
  it('writes the tour-news line at the World Tour 500, in the champion line\'s own register', () => {
    const world = createWorld('retnews-worldnews')
    const r = findRivalRetirement(world, 'wta500')
    const mainBefore = { ...world.rngMain }
    revealThrough(world, r)
    const rows = world.events.filter((e) => e.text.startsWith(MARK))

    // eslint-disable-next-line no-console
    console.log(
      `\nWORLD NEWS, ${TIERS.wta500.label} – straight out of world.events:\n\n` +
        world.events
          .filter((e) => e.text.startsWith(MARK) || e.text.includes('beat a retiring'))
          .map((e) => `  ${e.text}`)
          .join('\n') +
        '\n',
    )

    expect(rows.length).toBe(1)
    expect(rows[0].type).toBe('info')
    expect(rows[0].text).toContain(`retired hurt at the ${TIERS.wta500.label}`)
    // ⚠ ZERO NEW DRAWS. The reveal that emitted it moved the MAIN stream not at all – reading
    // `retiredId` is reading, and input-independence is permanent law.
    expect(world.rngMain).toEqual(mainBefore)
  })

  it('stays SILENT about the tournament below the cut – the feed budget is not reopened', () => {
    // The gate is the champion line's own (`tierMakesWorldNews`, moved out of world.ts so there is
    // exactly one answer to "which rungs does the world report on"). Below it the retirement is
    // still reported – to HER week – but it does not claim to be tour news.
    const world = createWorld('retnews-below')
    for (const tier of ['local', 'j300', 'w15', 'w75'] as TierId[]) {
      expect(tierMakesWorldNews(tier)).toBe(false)
      const r = findRivalRetirement(world, tier)
      const line = rivalRetirementNews(world, r.event, r.m, r.players)!
      expect(line, `${tier} must not read as tour news`).not.toContain(`at the ${TIERS[tier].label}`)
      expect(line).toContain('retired hurt against')
    }
    for (const tier of ['w100', 'wta125', 'wta250', 'wta500', 'wta1000', 'slam'] as TierId[]) {
      expect(tierMakesWorldNews(tier), `${tier} is already covered by the champion line`).toBe(true)
    }
  })

  it('HER OWN retirement writes no such row – the summary already says it', () => {
    const world = createWorld('retnews-hers')
    const r = findKidRetirement(world, 'wta500')
    revealThrough(world, r as unknown as ReturnType<typeof findRivalRetirement>)
    expect(world.events.some((e) => e.text.startsWith(MARK))).toBe(false)
    const summary = world.events.find((e) => e.type === 'tournament')!
    // eslint-disable-next-line no-console
    console.log(`\nWHEN SHE IS THE ONE WHO STOPS, the only line is the one that was already there:\n\n  ${summary.text}\n`)
    expect(summary.text).toContain('she retired hurt')
  })
})
