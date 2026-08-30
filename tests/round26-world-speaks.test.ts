// ⭐⭐⭐ ROUND 26 #10 AND #5b – THE TOUR HAS A VOICE, AND HER SHARE HAS A SENTENCE.
//
// TWO OWNER LINES, ONE FILE, because both are the same question asked of the feed: what does the
// game actually TELL him?
//
//   #10 «В новостях во время колледжа вообще пустота, как будто мир умер, мы вроде делали, чтобы он
//        жил, при том, что даже в highlights на результатах есть какие-то события»
//   #5b «...и неплохо бы об этом где-то игроку сообщать, кстати»
//
// ⚠ THE INVENTORY CAME FIRST AND IT SAYS THE FEED WAS NEVER EMPTY. `tools/college-news-probe.ts`
// over five careers × four college years: 3,616 rows written in 1,040 freeze weeks, 799 of them
// reaching the news list, the Home card holding ~15 rows at every one of forty rest states and never
// zero. What it also says is why it read as silence – 586 of those 799 were «🏆 a stranger won the
// World Tour 500», the same sentence twenty-nine times a season with nothing in it that could change.
//
// ⚠ WALKED CAREERS, NOT HAND-BUILT WORLDS. Every arm below ticks the real engine so the succession
// is the one `careerAt` really walks and the cheque is one `finalizeTournament` really wrote.
//
// ⚠ MUTATION-VERIFIED – each turns exactly the named arm red, and each was watched doing it:
//   * `isFieldFarewellWeek` returns false always        -> the farewell arm.
//   * `FIELD_NEWS.farewellsPerSeason = 99`              -> the budget arm (the cap is the claim, and
//     the budget numbers in it are LITERALS so raising the constant cannot raise the ceiling too).
//   * `championNote` returns ''                         -> the generations arm.
//   * the debut clause dropped from `championNote`      -> the generations arm, alone.
//   * `announceFieldIntake` early-returns               -> the intake arm.
//   * the farewell rows written with `keep: true`       -> the "costs her nothing" arm.
//   * the prize row back to «less her N% share» bare    -> the #5b arm.
import { describe, it, expect } from 'vitest'
import {
  KID_ID,
  campusDigestLine,
  chooseGift,
  closeTournament,
  callUpRevealOpen,
  collegeLeagueRevealOpen,
  createWorld,
  enterEvent,
  measureCollegeOffer,
  pendingBirthday,
  resumeFromCollege,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { answerFork } from '../src/engine/world/endings'
import { ENDINGS } from '../src/engine/ending'
import { FIELD_NEWS, isFieldFarewellWeek } from '../src/engine/world/fieldNews'
import { EVENTS_CAP, EVENTS_ORDINARY_FLOOR } from '../src/engine/world/constants'
import { kidPrizeShareBps, kidPrizeShareCents } from '../src/engine/economy'
import { kidAgeYears } from '../src/engine/world/age'
import { prizeCentsFor } from '../src/engine/world/labels'
import { rngFromSeed, type Rng } from '../src/engine/rng'
import { formatCents } from '../src/shared/money'
import { TIERS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type WorldEvent } from '../src/shared/protocol'
import type { SeasonEvent, TierId } from '../src/engine/season/types'
import type { SeasonResult } from '../src/engine/season/ranking'

/** A career walked to `week`, kept solvent, with every reveal resolved. Nothing is entered, so this
 *  is the QUIETEST possible world – which is the point for #10: whatever the feed says here, the
 *  world said it on its own. */
function quietCareer(week: number, seed = 'r26-voice'): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  const rng = rngFromSeed(world.seed)
  while (world.week < week) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

const textsOf = (world: WorldState, week: number): string[] => world.events.filter((e) => e.week === week).map((e) => e.text)

/** The last week of the season the walk is standing in. */
const seasonEndBefore = (week: number): number => week - (week % WEEKS_PER_YEAR) - 1

describe('round 26 #10 – the professional field says what it has always been doing', () => {
  it('says goodbye, by name and by number, on the last week of a season', () => {
    const world = quietCareer(WEEKS_PER_YEAR * 3 + 2)
    const week = seasonEndBefore(world.week)
    expect(isFieldFarewellWeek(week), 'the arm is standing on a farewell week').toBe(true)
    const rows = textsOf(world, week)

    const farewells = rows.filter((t) => t.startsWith('👋'))
    expect(farewells.length, 'the season named somebody who stopped').toBeGreaterThan(0)
    for (const t of farewells) {
      // A NAME, A PLACE ON THE TABLE AND AN AGE – all three, because a number alone is weather.
      expect(t, 'the farewell names a standing').toMatch(/\(#\d+\)/)
      expect(t, 'and an age and a length of career').toMatch(/retiring at \d+ after \d+ seasons?\./)
      // NO STRING MAY GENDER A PROFESSIONAL – the rule every world-news line in the game keeps.
      expect(t, 'no pronoun names a professional').not.toMatch(/\b(she|her|hers)\b/i)
    }

    const turnover = rows.find((t) => t.startsWith('The tour turns over'))
    expect(turnover, 'and the size of the turnover is stated once').toBeTruthy()
    // ~120 a season across 1,600 chairs is the documented fact this line exists to surface.
    const n = Number(/(\d+) professionals retire/.exec(turnover!)![1])
    expect(n, 'the whole field turns over, not a handful').toBeGreaterThan(50)
    expect(n, 'and not the whole field at once either').toBeLessThan(400)
  })

  it('names who took the chairs on the first week of the next season', () => {
    const world = quietCareer(WEEKS_PER_YEAR * 3 + 2)
    const boundary = world.week - (world.week % WEEKS_PER_YEAR)
    const intake = textsOf(world, boundary).find((t) => t.includes('joined the professional tour'))
    expect(intake, 'the new season opens by saying who is new').toBeTruthy()
    expect(intake!, 'with a name and a place').toMatch(/highest-placed of them is .+ at #\d+\./)
    expect(intake!, 'no pronoun names a professional').not.toMatch(/\b(she|her|hers)\b/i)
  })

  it('puts the generations into the champion lines the player reads every week', () => {
    // ⭐ THE ONE THAT COSTS NO ROWS, and the only one a college player can actually see: the freeze
    // hands him a screen eight times in 208 weeks and the news card holds ~11 weeks, so a
    // once-a-season row is outside the window by arithmetic. A clause is not.
    const world = quietCareer(WEEKS_PER_YEAR * 6)
    const champions = world.events.filter((e) => e.text.startsWith('🏆') && e.text.includes(' won the '))
    expect(champions.length, 'the feed is full of champion lines to begin with').toBeGreaterThan(20)
    for (const e of champions) expect(e.text, 'every champion now has an age').toMatch(/, at \d+/)
    const generational = champions.filter((e) => e.text.includes('season on tour'))
    expect(generational.length, 'and some of them are arriving or leaving').toBeGreaterThan(0)
    expect(champions.some((e) => e.text.includes('a first season on tour')), 'debutantes are named').toBe(true)
    // ⚠ THE REGEX `tests/events.test.ts` MATCHES ON IS UNTOUCHED.
    for (const e of champions) expect(/ won the /.test(e.text)).toBe(true)
  })

  it('costs the feed its stated budget and not one row of her own history', () => {
    // ⭐ THE ROW BUDGET, AS A TEST AND NOT A PROMISE – and the numbers below are LITERALS, on purpose.
    // `docs/plans/the-living-world-build.md` §5 sized this from the cap: «EVENTS_CAP 400, feed
    // already takes ~364 a season – +~5 lines fits, all-retirements (~120) does not». A test that
    // read `FIELD_NEWS.farewellsPerSeason` for its own ceiling would move with the constant and
    // could never fail, which is the one thing this assertion exists to do.
    const SEASON_BUDGET = 5
    expect(FIELD_NEWS.farewellsPerSeason, 'the plan sized the named farewells at ~4 a season').toBeLessThanOrEqual(3)
    const world = quietCareer(WEEKS_PER_YEAR * 4 + 2)
    const mine = world.events.filter(
      (e) => e.text.startsWith('👋') || e.text.startsWith('The tour turns over') || e.text.includes('joined the professional tour'),
    )
    expect(mine.length, 'the module wrote something at all').toBeGreaterThan(0)
    const bySeason = new Map<number, number>()
    for (const e of mine) {
      const s = Math.floor(e.week / WEEKS_PER_YEAR)
      bySeason.set(s, (bySeason.get(s) ?? 0) + 1)
    }
    for (const [season, n] of bySeason) {
      expect(n, `season ${season} is inside the ${SEASON_BUDGET}-row budget`).toBeLessThanOrEqual(SEASON_BUDGET)
    }
    // ⚠ AND NOT ONE OF THEM IS `keep`, so `pruneEvents` sacrifices the tour's news exactly as it
    // sacrifices a champion line: her milestones and her match rows can never be pushed out by it.
    for (const e of mine) expect(e.keep, `W${e.week}: the tour's news is ordinary, never kept`).toBeFalsy()
    expect(world.events.length, 'and the cap still holds').toBeLessThanOrEqual(EVENTS_CAP + EVENTS_ORDINARY_FLOOR)
  })

  it('writes no points, no money and no result row – news is news', () => {
    // ⚠ THE FREEZE'S OWN LAW, held on the module that speaks during it. Every row it writes is
    // amount-free, so `accrueFinance` never sees one and `careerTotals` cannot move.
    const world = quietCareer(WEEKS_PER_YEAR * 3 + 2)
    const mine = world.events.filter(
      (e) => e.text.startsWith('👋') || e.text.startsWith('The tour turns over') || e.text.includes('joined the professional tour'),
    )
    expect(mine.length, 'there are rows to check').toBeGreaterThan(0)
    for (const e of mine) {
      expect(e.amountCents, 'the tour paying nobody is the point').toBeUndefined()
      expect(e.type, 'a news row and nothing else').toBe('info')
      expect(e.match, 'nothing replayable, nothing playable').toBeUndefined()
    }
  })
})

// =================================================================================================

/** ...and one that actually PLAYS, so there is a cheque to read. `enterEligible` is
 *  `tests/finance.test.ts`'s helper, unchanged: grant the rung's own floor, enter, take it back. */
function enterEligible(world: WorldState, event: SeasonEvent): void {
  const min = TIERS[event.tier].enterPointBand[0]
  const marker: SeasonResult = { playerId: KID_ID, week: world.week, points: min, tier: event.tier }
  if (min > 0) world.results.push(marker)
  enterEvent(world, event.id)
  if (min > 0) world.results = world.results.filter((r) => r !== marker)
}

describe('round 26 #5b – the prize row says where the missing money went', () => {
  it('names the cents that left, on the ledger row the Money screen renders', () => {
    // A career walked past her eighteenth that enters everything it can, so a real cheque is
    // written by the real `finalizeTournament` at a real age on the ramp.
    const world = createWorld('r26-share', { ...DEFAULT_PROFILE, birthMonth: 1, birthDay: 5 })
    const rng = rngFromSeed(world.seed)
    // ⚠ THE ROWS ARE HARVESTED AS THEY ARE WRITTEN. `pruneEvents` caps the feed at 400 and a
    // twelve-season walk writes thousands, so reading them back at the end would silently drop every
    // cheque before the last few months – the trap `sponsors.ts` and `travelHome.ts` both carry a ⚠
    // about. The high-water id is the honest cursor.
    const split: WorldEvent[] = []
    const summaries: WorldEvent[] = []
    // ⚠⚠ THE LEDGER SNAPSHOT IS TAKEN WHEN A SPLIT ROW IS WRITTEN, NOT AT THE END OF THE WALK
    // (30.08, round 30 #27). `snapshot.financialEvents` is the last `SNAPSHOT_FINANCIAL_EVENTS`
    // rows BY COUNT, not by date - so whether a prize row is still inside it after twelve seasons
    // depends on how many expense rows happened to land after the last cheque. This wave re-priced
    // the injury curve, which changed the medical rows in her final months, and the assertion below
    // went red on a window that held no prize row at all: a guard about WHETHER THE ROW REACHES THE
    // SCREEN was silently keyed on WHICH MONTH THE WALK STOPPED IN.
    //
    // Snapshotting at the moment the row is written tests the actual claim - the row the Money
    // screen renders is the row the till wrote - and it cannot be starved by a later balance change.
    let ledgerSnap: ReturnType<typeof toSnapshot> | null = null
    let cursor = 0
    while (world.week < WEEKS_PER_YEAR * 12) {
      world.fundsCents = Math.max(world.fundsCents, 5_000_000_00)
      // Enter anything the door opens, a few weeks out, exactly as a parent commits.
      const next = world.season.find(
        (e) => e.week > world.week && e.week <= world.week + 4 && world.week <= e.deadlineWeek && !world.entries.includes(e.id),
      )
      if (next) {
        try {
          enterEligible(world, next)
        } catch {
          /* the door was shut – the walk simply does not play that week */
        }
      }
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      const splitCountBefore = split.length
      for (const e of world.events) {
        if (e.id <= cursor) continue
        if (e.category === 'prize' && e.text.includes('less her')) split.push(e)
        if (e.type === 'tournament' && e.finishIdx !== undefined) summaries.push(e)
      }
      if (split.length > splitCountBefore) ledgerSnap = toSnapshot(world)
      if (world.events.length) cursor = Math.max(cursor, ...world.events.map((e) => e.id))
    }
    expect(split.length, 'the walk won money after her eighteenth').toBeGreaterThan(0)

    for (const row of split) {
      // ⭐ THE ARITHMETIC, RE-DERIVED FROM OUTSIDE THE TILL. The `tournament` summary row for the
      // same week carries `finishIdx` and names its tier, so the GROSS is `prizeCentsFor` and her
      // share is the ramp at her real age – neither of them read off the row under test.
      const summary = summaries.find((e) => e.week === row.week)!
      const tier = (Object.keys(TIERS) as TierId[]).find((t) => summary.text.startsWith(`${TIERS[t].label} (`))!
      const gross = prizeCentsFor(tier, summary.finishIdx!)
      const age = kidAgeYears(row.week, world.profile.birthMonth, world.profile.birthDay)
      const hers = kidPrizeShareCents(gross, age)
      expect(row.amountCents, 'the family banked the rest, to the cent').toBe(gross - hers)
      expect(row.text, 'the rate is the one the till divided by').toContain(`less her ${kidPrizeShareBps(age) / 100}% share`)
      // ⚠ `formatCents` AND NOT A HAND-ROLLED FORMATTER – the same helper the row is written with,
      // so a change to how the game prints money moves the assertion with it instead of breaking it.
      expect(row.text, 'and the row names the money, not only the rate').toContain(`(${formatCents(hers)})`)
    }

    // ...and a split row really reaches the Money screen's ledger window, which is what renders it.
    expect(ledgerSnap, 'the walk took a snapshot on a week that wrote a split row').not.toBeNull()
    const snap = ledgerSnap!
    const onLedger = snap.financialEvents.filter((e) => e.category === 'prize')
    expect(onLedger.length, 'the ledger window holds prize rows at all').toBeGreaterThan(0)
    expect(
      onLedger.every((e) => /less her [\d.]+% share \(\$[\d,.]+\)$/.test(e.text)),
      'every prize row in the window names the share that left – she is past eighteen for all of them',
    ).toBe(true)
  })
})

// =================================================================================================
// ⭐⭐⭐ ROUND 26 #10, SECOND PASS – THE ROW THAT CANNOT BE STALE
// =================================================================================================
//
// HIS CORRECTION, after reading the first report: «у меня в ленте предпоследняя новость были из мира
// "до колледжа" на протяжении всей учебы, а последняя жёлтым про её учебный год. Вот я бы хотел,
// чтобы "мир жил" и пока она в колледже, ПУСТЬ И СЖАТО».
//
// ⚠⚠ THE FIRST PASS WAS NOT WRONG, IT WAS UNREACHABLE, and the number that says so is 45%: over 48
// walked rest states the news card covers 7.8 of the 17 weeks a press actually spends
// (`tools/college-news-probe.ts`). Five rows a season posted into that are a coin flip – measured
// 2.4 generational rows at a rest state and NONE AT ALL at 9 of 48. This row is written ON the rest
// week, so it is the top week group of the feed by construction. Measured after: 3.9 and 0 of 48.
//
// ⚠ MUTATION-VERIFIED – each turns exactly the named arm red, and each was watched doing it:
//   * `announceCampusInterlude` early-returns             -> the recency arm and the 48/48 arm.
//   * the call moved above the loop (`pressFrom` -> -1)   -> the "a refused press says nothing" arm.
//   * `campusDigestLine` returns the newcomers clause on both branches -> the first-pause arm.
//   * the row written with `keep: true`                   -> the "costs her nothing" arm.
//   * `chairIndexOf` -> `debutSeason >= enrolledSeason`   -> the newcomers-are-new arm.

/** ⭐ A CAREER WALKED TO THE FORK AND ENROLLED – the same shape `college-freeze.test.ts` and the
 *  card's own file use, including the one thumb on the scale they both carry: four years is 208
 *  weeks of base costs, and a family that goes bankrupt inside them measures the budget instead. */
function enrolled(seed: string): { world: WorldState; rng: Rng } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 60; i++) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  world.fundsCents = 500_000_00
  world.fork = { askedWeek: world.week, answer: null, offer: measureCollegeOffer(world) }
  answerFork(world, 'college')
  for (let i = 0; i < 54 && world.ending === null; i++) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  expect(world.ending?.type, 'the departure really latched the college ending').toBe('college')
  return { world, rng }
}

/** One press of «Another year» and everything the screen would answer before the next one – the
 *  championship reveal (round 26 #6) and the cake (round 24). A walk that answers one and not the
 *  other stalls on the first league week and measures the same rest state twelve times over. */
function press(world: WorldState, rng: Rng): void {
  world.fundsCents = Math.max(world.fundsCents, 200_000_00)
  resumeFromCollege(world, rng)
  // ⭐⭐⭐ ROUND 27 #6 RE-AIM – AND THE TIE, WHICH PAUSES THE YEAR THE SAME WAY SINCE THIS WAVE.
  // ⚠ IT USED TO CLAIM: «the championship reveal (round 26 #6) and the cake» are everything a press
  // has to answer. ⚠ WHY IT MOVED: the call-up stopped being a toast, so a walk that answered only
  // the championship stalls on the first call-up week – the very failure this helper's own comment
  // one line up warns about, arriving from the second fixture.
  if (collegeLeagueRevealOpen(world) || callUpRevealOpen(world)) {
    skipTournament(world)
    closeTournament(world)
  }
  if (pendingBirthday(world) !== null) chooseGift(world, 'day')
}

const DIGEST = '🌍'
const digestRows = (world: WorldState): WorldEvent[] => world.events.filter((e) => e.text.startsWith(DIGEST))

describe('round 26 #10 (again) – the world speaks on the week he is looking at', () => {
  it('puts a row about the tour on the CURRENT week at every rest state, all four years', () => {
    // ⭐⭐ THE ASSERTION IS RECENCY AND NOT A COUNT, because the count was never the complaint: the
    // card already held 21 rows and he still read it as a dead world. What it did not hold was
    // anything whose week was the week he was standing on.
    const { world, rng } = enrolled('r26-alive-a')
    const seen: number[] = []
    for (let i = 0; i < 3 * ENDINGS.collegeYears && world.ending?.type === 'college'; i++) {
      press(world, rng)
      const snap = toSnapshot(world)
      const onThisWeek = snap.events.filter((e) => e.week === snap.week && e.text.startsWith(DIGEST))
      expect(onThisWeek.length, `rest state at W${world.week}: the tour said something TODAY`).toBe(1)
      seen.push(world.week)
    }
    expect(seen.length, 'the walk really visited every rest state of the degree').toBeGreaterThanOrEqual(8)
    // ...and the freeze really ran its full span, so this is not eight presses at one week.
    expect(seen[seen.length - 1] - seen[0], 'the rest states are spread over the whole degree').toBeGreaterThan(
      WEEKS_PER_YEAR * 3,
    )
  })

  it('says something DIFFERENT as the degree goes on – the number is the world moving', () => {
    const { world, rng } = enrolled('r26-alive-b')
    const lines: string[] = []
    for (let i = 0; i < 3 * ENDINGS.collegeYears && world.ending?.type === 'college'; i++) {
      press(world, rng)
      const row = digestRows(world).find((e) => e.week === world.week)
      if (row) lines.push(row.text)
    }
    expect(lines.length, 'there are rows to compare').toBeGreaterThanOrEqual(8)
    // ⚠ NOT "all distinct" – two rest states inside one season CAN honestly report the same table
    // and the same newcomer count, and a test that forbade it would be pinning luck. What may not
    // happen is the row being the same sentence for the whole degree, which is the complaint.
    expect(new Set(lines).size, 'the sentence moves as the field turns over').toBeGreaterThan(2)
    // ⭐ AND THE NUMBER IN IT IS THE WORLD MOVING, not noise: four years is ~120 retirements a
    // season against 1,600 chairs, so the top hundred she comes back to is not the one she left.
    // ⚠ NOT ASSERTED MONOTONE – a newcomer who reaches the top 100 can drop out of it again, so
    // "never decreases" would be pinning luck. First against last is the claim that matters.
    const countIn = (t: string): number => Number(/(\d+) of today's top/.exec(t)?.[1] ?? 0)
    expect(lines[lines.length - 1], 'the last one counts the newcomers').toMatch(/\d+ of today's top \d+ have come up/)
    expect(countIn(lines[lines.length - 1]), 'four years of succession shows in the number').toBeGreaterThan(
      countIn(lines[0]),
    )
  })

  it('names nobody with a pronoun and pays nobody', () => {
    const { world, rng } = enrolled('r26-alive-c')
    for (let i = 0; i < 4 && world.ending?.type === 'college'; i++) press(world, rng)
    const rows = digestRows(world)
    expect(rows.length, 'there are rows to check').toBeGreaterThan(0)
    for (const e of rows) {
      expect(e.text, 'no pronoun names a professional').not.toMatch(/\b(she|her|hers)\b/i)
      expect(e.amountCents, 'the tour paying nobody is the point').toBeUndefined()
      expect(e.type, 'a news row and nothing else').toBe('info')
      expect(e.match, 'nothing replayable, nothing playable').toBeUndefined()
      expect(e.text, 'no ranking points anywhere near college').not.toMatch(/\bpts?\b|ranking point/)
      // ⚠ ORDINARY, NEVER KEPT – so `pruneEvents` sacrifices it exactly as it sacrifices a champion
      // line, and her milestones and match rows can never be pushed out by the tour's news.
      expect(e.keep, `W${e.week}: the tour's news is ordinary, never kept`).toBeFalsy()
    }
  })

  it('costs the four-year budget eleven rows and her history nothing', () => {
    // ⭐⭐ THE BUDGET ARM. `EVENTS_CAP` is 400 and the ordinary class is already at its floor through
    // the whole freeze, so every row here displaces an ordinary row and NEVER a kept one. The A/B
    // over four walked careers measured 401 -> 402 rows at graduation with 39 kept in BOTH arms;
    // this is that claim as a test, on one career, without needing the other tree.
    const { world, rng } = enrolled('r26-alive-d')
    const keptBefore = world.events.filter((e) => e.keep).length
    let presses = 0
    for (let i = 0; i < 3 * ENDINGS.collegeYears && world.ending?.type === 'college'; i++) {
      press(world, rng)
      presses++
    }
    const rows = digestRows(world)
    // One row per press that moved time, and a degree is a dozen presses at the very outside.
    expect(rows.length, 'never more than one row per rest state').toBeLessThanOrEqual(presses)
    expect(rows.length, 'a whole degree stays inside a dozen rows').toBeLessThanOrEqual(3 * ENDINGS.collegeYears)
    expect(world.events.length, 'the cap still holds').toBeLessThanOrEqual(EVENTS_CAP + EVENTS_ORDINARY_FLOOR)
    // ⚠ HER OWN HISTORY IS THE THING THAT MAY NOT MOVE, and `keep` is what it is made of.
    const keptAfter = world.events.filter((e) => e.keep).length
    expect(keptAfter, 'the kept class only ever grew by her own college milestones').toBeGreaterThanOrEqual(keptBefore)
    for (const e of rows) expect(world.events.includes(e), 'and the digest rows survived their own week').toBe(true)
  })

  it('says nothing at all in a career that never goes to college', () => {
    // ⭐⭐ THE BYTE-IDENTICAL ARM, from inside the tree. The command that writes this row is
    // `resumeFromCollege` and there is no other caller, so a career on tour cannot reach it – and
    // the proof that matters is the absence, over a span longer than a whole degree.
    const world = createWorld('r26-alive-tour', { ...DEFAULT_PROFILE })
    const rng = rngFromSeed(world.seed)
    while (world.week < WEEKS_PER_YEAR * 8) {
      world.fundsCents = Math.max(world.fundsCents, 500_000_00)
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
    }
    expect(world.college, 'she never enrolled').toBeNull()
    expect(digestRows(world).length, 'and the campus digest never wrote a byte into her feed').toBe(0)
  })

  it('states the table she left when nobody has come up yet – a zero is not a sentence', () => {
    // The pure line, both branches, with no world in the way.
    expect(campusDigestLine(0, { name: 'Rosa Delaney', ageYears: 26 })).toBe(
      "🌍 The tour has not waited: nobody new is in today's top 100 yet, and R. Delaney is #1 at 26.",
    )
    expect(campusDigestLine(34, { name: 'Rosa Delaney', ageYears: 26 })).toBe(
      "🌍 The tour has not waited: 34 of today's top 100 have come up since the scholarship began, and R. Delaney is #1 at 26.",
    )
    // A table with no professional at the top has no leader to name, and the line drops that half
    // rather than inventing one. With nothing to say on either half there is no row.
    expect(campusDigestLine(34, null)).toBe(
      "🌍 The tour has not waited: 34 of today's top 100 have come up since the scholarship began.",
    )
    expect(campusDigestLine(0, null), 'no facts, no row').toBeNull()
  })
})
