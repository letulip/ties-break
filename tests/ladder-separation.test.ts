import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  createWorld,
  tickWeek,
  enterEvent,
  entryStatus,
  skipTournament,
  closeTournament,
  toSnapshot,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS, TIER_LADDER, hasAcceptanceList } from '../src/engine/season/calendar'
import { entryBandTrack, tierOpensWhen, tierState, type TierStateInput } from '../src/composables/tierState'
import { activeLadderOfSnapshot, LADDER_POINTS_LABEL, rankChipTrack } from '../src/shared/protocol'
import type { TierId } from '../src/engine/season/types'

// =================================================================================================
// THE TWO TABLES STAY TWO TABLES — the guards for fix/ladder-separation (31.07)
// =================================================================================================
//
// docs/specs/two-ladders.md designed two currencies with no exchange rate between them, and this
// file exists because that design keeps being violated in the same shape: a surface asks for "her
// rank", gets handed the one number called `kidRank`, and prints an INTERNATIONAL place under a
// NATIONAL result. The owner has now reported it twice, a month apart, wearing different clothes:
//
//   30.07  «Rank #4 on the home tab and end of season popup seems strange since in stats I can
//           clearly see #128»                                   -> fix/ranking-truth
//   31.07  «по итогам матча national в таблице пишут # из international, надо проверить всё
//           разделение хорошо»                                  -> this branch
//
// ⚠ EVERY ASSERTION HERE IS AN IDENTITY, NEVER A PINNED NUMBER, and that is the lesson of the first
// occurrence rather than a style preference. `tests/condition.test.ts` B1c says it outright: the
// guards that existed all asserted `kidRank` equals some number, so they MOVED WITH THE BUG and were
// re-pinned to it. A number cannot notice that it has started answering a different question. So
// what is checked below is always "this figure equals the fold it claims to be", which holds for any
// seed, any week and any career, and fails the moment a second meaning appears.

/** Enter whatever the ENGINE says she may enter, strongest rung first, so a career actually climbs
 *  and BOTH ledgers fill. Lifted from condition.test.ts B1c, and for its stated reason: asking
 *  `entryStatus` rather than guessing a tier is the same discipline these bugs are about. */
function enterWhatSheCan(world: WorldState): void {
  const busy = new Set(world.season.filter((e) => world.entries.includes(e.id)).map((e) => e.week))
  const byRung = [...world.season].sort((a, b) => TIER_LADDER.indexOf(b.tier) - TIER_LADDER.indexOf(a.tier))
  for (const e of byRung) {
    if (e.week <= world.week || world.week > e.deadlineWeek) continue
    if (world.entries.includes(e.id) || busy.has(e.week)) continue
    if (entryStatus(world, e).level === 'blocked') continue
    enterEvent(world, e.id)
    return
  }
}

describe('S1 — the tournament overlay reads the table the tournament is played on', () => {
  it('every pending reveal names its own ladder and quotes ranks from it', () => {
    const world = createWorld('ladder-sep-1')
    world.fundsCents = 9_999_999_00 // affordability is not what this test is about
    const rng = rngFromSeed(world.seed)
    let domesticSeen = 0
    let itfSeen = 0
    // The DISCRIMINATOR: at least one domestic tournament whose printed rank differs from the ITF
    // alias the overlay used to read. Without it this test could pass on a career where the two
    // tables happen to agree, which is exactly the coincidence the first fix was re-pinned to.
    let divergedOnDomestic = false

    enterWhatSheCan(world)
    // ⚠ THE HORIZON IS RE-AIMED 140 -> 210 WEEKS (P3, 16.08, docs/specs/
    // acceptance-cuts-corrected-2026-08.md), AND NOT ONE ASSERTION BELOW IS TOUCHED. This sweep needs
    // a career that reaches BOTH halves of the ladder – it says so itself, two screens down: "the
    // sweep has to have actually reached both halves of the ladder, or it guards nothing". `j300`'s
    // acceptance cut went 0.40 -> 0.20 and `enterWhatSheCan` takes the HIGHEST rung it can, so this
    // seed's international debut moved later and 140 weeks stopped containing one – the case was
    // failing on its own precondition, not on the separation it measures. 210 weeks restores it.
    // ⚠ It is deliberately not "the first horizon that passed": both the `itfSeen` and `domesticSeen`
    // floors clear with room at 210, so a small further ladder move does not land on it again.
    for (let i = 0; i < 210; i++) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        const snap = toSnapshot(world)
        const pending = snap.pending!
        const track = TIERS[pending.tier].track

        // (a) the overlay is told which table it is on, and it is the event's own.
        expect(pending.ladder).toBe(track)

        // (b) her number IS that table's number - the same one Stats shows on that tab - and not the
        //     ITF alias, and not a number at all when she holds no counting result there.
        expect(pending.kidRank).toBe(snap.ladders[track].rank)

        // (c) the opponent's number is measured in the SAME units. Two ranks printed side by side
        //     invite a comparison, and a comparison across two tables with no exchange rate is a lie.
        //     She must appear in the standings of that table, or carry no rank at all.
        if (pending.opponent.rank !== null) {
          const row = snap.ladders[track].standings.find((r) => r.rank === pending.opponent.rank)
          // The standings window is top-10-plus-a-window, so absence proves nothing; presence must
          // agree. What is always true is that a printed rank is a real position in a real table.
          expect(pending.opponent.rank).toBeGreaterThan(0)
          if (row) expect(row.rank).toBe(pending.opponent.rank)
        }

        if (track === 'domestic') {
          domesticSeen++
          if (pending.kidRank !== snap.kidRank) divergedOnDomestic = true
        } else {
          itfSeen++
        }

        skipTournament(world)
        closeTournament(world)
      }
      world.fundsCents = 9_999_999_00
      enterWhatSheCan(world)
    }

    // The sweep has to have actually reached both halves of the ladder, or it guards nothing.
    expect(domesticSeen, 'no domestic tournament in the career').toBeGreaterThan(3)
    expect(itfSeen, 'no international tournament in the career').toBeGreaterThan(0)
    expect(divergedOnDomestic, 'the two tables never disagreed, so this proves nothing').toBe(true)
  })

  it('NULL IS NOT #1: her first tournament introduces her as unranked, not as the tie floor', () => {
    // The whole point-less field ties at zero and competition ranking hands every member of that tie
    // the same place, so the old `snapshot.kidRank` read a fourteen-year-old into her first Local
    // Open as "Rank #119". `rank: null` is the type carrying that distinction; the overlay reads it.
    const world = createWorld('ladder-sep-first')
    world.fundsCents = 9_999_999_00
    const rng = rngFromSeed(world.seed)
    const first = world.season.find((e) => e.tier === 'local' && e.week > world.week + 1)!
    enterEvent(world, first.id)
    while (world.week < first.week) tickWeek(world, rng)

    const snap = toSnapshot(world)
    expect(snap.pending!.ladder).toBe('domestic')
    expect(snap.pending!.kidRank).toBeNull()
    // ...while the number the overlay used to print is emphatically not null, which is the bug.
    expect(typeof snap.kidRank).toBe('number')
  })
})

describe('S2 — the season W-L decomposes, and it decomposes into the right buckets', () => {
  it('the per-ladder record always sums to the totals, every week of a career', () => {
    // The invariant behind showing both: `seasonRecord` is a DECOMPOSITION of `seasonWins` /
    // `seasonLosses`, not a second opinion about them. `matchesEverPlayed` still folds the totals
    // into the radar's confidence, so anything that increments one and not the other would move a
    // count the radar spec says may only ever go up.
    const world = createWorld('ladder-sep-2')
    world.fundsCents = 9_999_999_00
    const rng = rngFromSeed(world.seed)
    let sawDomesticWin = false
    let sawItfMatch = false

    // The per-week invariant is read off the WORLD, not off a snapshot: it is a property of the
    // counters themselves, and building a full snapshot every week to check two additions is the kind
    // of cost that pushes a shared 5s test timeout over on a loaded machine. One snapshot at the end
    // proves the surfacing.
    // ⚠ HORIZON RE-AIMED 140 -> 210 BY P3, for the same reason and with the same evidence as S1
    // above: `sawItfMatch` is this case's own precondition and the tighter j300 door moved her
    // international debut past week 140. No assertion is touched.
    enterWhatSheCan(world)
    for (let i = 0; i < 210; i++) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      world.fundsCents = 9_999_999_00
      enterWhatSheCan(world)

      const r = world.seasonRecord!
      // ⚠ ALL THREE BUCKETS (W2-LADDER re-aim): the decomposition has been three-way since v30,
      // and this fixture's career now genuinely reaches a W draw (the 12-rung calendar re-deal
      // moved which events its greedy policy meets), so a two-bucket sum stopped being the
      // invariant and started being an undercount. The claim is the same claim, over the whole
      // partition.
      expect(r.domestic.wins + r.itf.wins + r.wta.wins).toBe(world.seasonWins)
      expect(r.domestic.losses + r.itf.losses + r.wta.losses).toBe(world.seasonLosses)
      if (r.domestic.wins > 0) sawDomesticWin = true
      if (r.itf.wins + r.itf.losses > 0) sawItfMatch = true
    }
    const snap = toSnapshot(world)
    expect(snap.seasonRecord).toEqual(world.seasonRecord)
    expect(snap.seasonRecord.domestic.wins + snap.seasonRecord.itf.wins + snap.seasonRecord.wta.wins).toBe(snap.seasonWins)

    // ...and both buckets have to have been used, or the sum holds trivially.
    expect(sawDomesticWin, 'she never won a domestic match').toBe(true)
    expect(sawItfMatch, 'she never played an international match').toBe(true)
  })

  it('a domestic tournament moves only the domestic bucket', () => {
    const world = createWorld('ladder-sep-3')
    world.fundsCents = 9_999_999_00
    const rng = rngFromSeed(world.seed)
    const first = world.season.find((e) => e.tier === 'local' && e.week > world.week + 1)!
    enterEvent(world, first.id)
    while (world.week < first.week) tickWeek(world, rng)
    skipTournament(world)
    closeTournament(world)

    const r = toSnapshot(world).seasonRecord
    expect(r.itf).toEqual({ wins: 0, losses: 0 })
    expect(r.domestic.wins + r.domestic.losses).toBeGreaterThan(0)
    // A first-round exit is one loss and no wins; anything deeper is wins plus exactly one loss.
    expect(r.domestic.losses).toBeLessThanOrEqual(1)
  })
})

describe('S3 — the locked plaque says WHEN the rung opens, off the tier definition', () => {
  it('every rung states its own gate, and states it in the currency the engine reads', () => {
    // ⚠ THE EXPECTATION IS RE-DERIVED FROM `TIERS`, never written down here. A hand-kept list of
    // "J60 opens at…" in a test is the same defect as a hand-kept list in the UI, one file further
    // away from the thing it would drift from - and these numbers have already moved three times
    // (j30's floor 150 -> 250, j60's share 0.40 -> 0.50, j300's 0.25 -> 0.40).
    for (const id of TIER_LADDER) {
      const tier = TIERS[id]
      const said = tierOpensWhen(id, 100)

      // The age gate appears exactly when the definition has one.
      expect(said.includes(`age ${tier.minAgeYears}`)).toBe(tier.minAgeYears !== undefined)

      if (hasAcceptanceList(id)) {
        // An ACCEPTANCE-LIST rung quotes the list, and must never quote its `[0, MAX]` formality of a
        // band. This is the "0+" the tour guide was printing for the two hardest tiers in the game.
        //
        // ⚠ RE-AIMED BY W2-FIELD2: "has a list" is now two fields, not one - the ITF rungs keep a
        // SHARE (`enterPct`) and the W rungs carry the real tour's ABSOLUTE cut (`acceptsRank`), so
        // the question is asked through `hasAcceptanceList`. Reading `enterPct` here sent every W
        // rung down the points branch, whose band is `[0, MAX]`, and out through the "open from the
        // start" door - the exact "0+" this case exists to catch, wearing a different coat.
        //
        // The QUOTED NUMBER is whatever that rung's list says: the live `acceptanceRank` when the
        // caller has one (100 of a 199-cohort ITF table), the tier's own cut otherwise.
        expect(said).toMatch(/top \d+ internationally/)
        expect(said).not.toContain(LADDER_POINTS_LABEL.domestic)
      } else if (tier.enterPointBand[0] > 0) {
        // A POINTS rung names its floor AND its currency - there are THREE point tables and this
        // threshold is denominated in one of them.
        // ⚠ RE-AIMED 01.08 (chore/w1-quick-wins, round-15's find): this expected the DOMESTIC label
        // on every points rung, which was true until W15 - whose band is ITF junior points (the
        // on-ramp reads the table below, two-ladders.md §4b) - and the hardcoded label in
        // `tierOpensWhen` then agreed with the wrong expectation: "age 16 and 120 national pts".
        // The currency now comes from `entryBandTrack`, the same per-track rule the engine's
        // entryStatus arm uses, so the guard re-derives instead of naming a table.
        expect(said).toContain(`${tier.enterPointBand[0]} ${LADDER_POINTS_LABEL[entryBandTrack(id)]}`)
      } else {
        // Local: no age gate, no floor. A threshold of zero is not a threshold.
        expect(said).toBe('open from the start')
      }
      // ⚠ RE-AIMED 01.08, same find. This read "never the international currency, on any rung: no
      // gate in the game is denominated in it" - false since W15 exists. The protected fact, kept
      // exact: the international unit appears on PRECISELY the rungs whose points gate is
      // denominated there (today: w15 alone), and on no other - a wrong-table label anywhere else
      // still fails here.
      const itfDenominated = tier.enterPct === undefined && tier.enterPointBand[0] > 0 && entryBandTrack(id) === 'itf'
      expect(said.includes(LADDER_POINTS_LABEL.itf), id).toBe(itfDenominated)
    }
  })

  it('the acceptance cut in the copy follows the engine, so it can never quote a stale list', () => {
    // `acceptanceRank` is `enterPct × (cohort + 1)`, so the number moves with the population as well
    // as with the tuning. The copy takes it as an argument for exactly that reason.
    expect(tierOpensWhen('j60', 80)).toContain('top 80')
    expect(tierOpensWhen('j60', 140)).toContain('top 140')
    // ...and with no live field to read, it falls back to the SHARE, which is what the gate is
    // actually denominated in and is still exactly true.
    expect(tierOpensWhen('j60')).toContain(`top ${Math.round(TIERS.j60.enterPct! * 100)}%`)
  })

  it('EVERY locked plaque carries a condition, not merely a mood', () => {
    // The failure this closes: "Not on the list yet" is a STATE. The plaque one rung down has been
    // printing a condition with progress against it ("112 / 250 national pts") for a release, and the
    // owner's «напишем когда открываются» is him noticing that the top of the ladder stopped doing so.
    const base: TierStateInput = {
      ageYears: 12,
      points: 0,
      upcoming: [],
      horizonWeeks: 8,
      entryCap: { used: 0, limit: 14, remaining: 14 },
      proEntryCap: { used: 0, limit: Number.MAX_SAFE_INTEGER, remaining: Number.MAX_SAFE_INTEGER }, // the pro AER has its own arm; untouched here
    }
    const hasCondition = (s: string) => /\d/.test(s) // a number: an age, a points floor, or a cut

    for (const id of TIER_LADDER) {
      // (a) age-locked, where one exists
      const young = tierState(id, base)
      if (young.kind === 'age-locked') {
        expect(hasCondition(young.note), `${id} age-locked note`).toBe(true)
        // ...and the TOOLTIP carries the WHOLE gate, not just the clause binding today: an
        // age-locked J30 also wants 250 national points.
        expect(young.title).toContain(tierOpensWhen(id, undefined))
      }

      // (b) locked on the acceptance list - the state that used to say nothing at all
      const listLocked = tierState(id, { ...base, ageYears: 18, engineOpen: false, acceptsRank: 100, itfRank: 128 })
      if (listLocked.kind === 'locked' && TIERS[id].enterPct !== undefined) {
        expect(listLocked.note, `${id} list-locked note`).toContain('top 100')
        expect(hasCondition(listLocked.note)).toBe(true)
        expect(listLocked.title).toContain('#128')
      }
    }

    // (c) locked on points still says the floor AND where she stands against it
    const pointsLocked = tierState('national', { ...base, ageYears: 18, points: 112 })
    expect(pointsLocked.kind).toBe('locked')
    expect(pointsLocked.note).toBe(`112 / 150 ${LADDER_POINTS_LABEL.domestic}`)
  })
})

describe('S4 — no surface answers "her rank" with the international alias', () => {
  const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')
  /** The source with its PROSE removed – line comments, block comments and HTML comments.
   *
   *  ⚠ THE GUARD IS ABOUT THE READ, NOT THE WORD. Every file below carries a paragraph explaining
   *  which field it stopped reading and why, and those paragraphs necessarily name it. A guard that
   *  cannot tell a citation from a call would make writing down the reason for a fix into a test
   *  failure, which is a fast way to stop writing them down. */
  const codeOnly = (src: string) =>
    src
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')

  it('the four surfaces that print a bare rank read the ACTIVE ladder', () => {
    // ⚠ A SOURCE GUARD, on the pattern of tests/ladder.test.ts L10, and it is here because the bug is
    // one of REACH: `snapshot.kidRank` is the obvious field to grab and it is the right answer to a
    // different question. These four had grabbed it. Home, Stats and the Kid screen already ask
    // `ladders[activeLadder]`; `activeLadderOfSnapshot` is that question with one implementation.
    //
    // It bans the READ, not the field: `Snapshot.kidRank` is a deliberate, pinned alias of
    // `ladders.itf` and the season wrap-up prints it ON PURPOSE, labelled "International rank".
    for (const rel of [
      '../src/App.vue',
      '../src/components/WeekRecapCard.vue',
      '../src/components/TournamentFlow.vue',
      '../src/components/screens/SeasonScreen.vue',
    ]) {
      const src = codeOnly(read(rel))
      expect(src, `${rel} still reads snapshot.kidRank`).not.toMatch(/snapshot\?*\.\s*kidRank/)
      expect(src, `${rel} still reads snapshot.prevKidRank`).not.toMatch(/snapshot\?*\.\s*prevKidRank/)
    }
  })

  it('"she moved up the table" is about the table she is IN', () => {
    // `rankClimbed` licenses three diary lines that say she climbed, plus the loss softener behind
    // her face. It read the ITF pair on careers that are domestic for their first year or two, so the
    // claim was about a table she is not in and the movement was mostly OTHER players' international
    // results ageing out of their windows. R13-2 fought this once already (it added the
    // `runPointsThisWeek > 0` licence for exactly that reason); the earned-points guard cannot work
    // while the points are counted in one table and the climb read off the other.
    const world = createWorld('ladder-sep-climb')
    world.fundsCents = 9_999_999_00
    const rng = rngFromSeed(world.seed)
    let checked = 0

    enterWhatSheCan(world)
    for (let i = 0; i < 60; i++) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      world.fundsCents = 9_999_999_00
      enterWhatSheCan(world)

      const snap = toSnapshot(world)
      const active = snap.ladders[snap.activeLadder]
      // THE IDENTITY: a climb is a strictly better place IN HER OWN TABLE, week over week – never a
      // diff of the international pair while she is competing nationally.
      const expected =
        !(world.pendingTournament !== null && !world.pendingTournament.finished) &&
        active.prevRank !== null &&
        active.rank !== null &&
        active.rank < active.prevRank
      expect(snap.diary.facts.rankClimbed).toBe(expected)
      checked++
    }
    expect(checked).toBeGreaterThan(40)
  })

  it('activeLadderOfSnapshot answers with the table the engine says she is competing in', () => {
    const world = createWorld('ladder-sep-active')
    const snap = toSnapshot(world)
    const active = activeLadderOfSnapshot(snap)
    expect(active.track).toBe(snap.activeLadder)
    expect(active.rank).toBe(snap.ladders[snap.activeLadder].rank)
    expect(active.points).toBe(snap.ladders[snap.activeLadder].points)
    // A fresh career holds nothing anywhere: her table is the national one and she is not on it yet.
    expect(active.track).toBe('domestic')
    expect(active.rank).toBeNull()
    // null and null are not the same as null and zero - the helper must not invent a rank.
    expect(activeLadderOfSnapshot(null).rank).toBeNull()
  })
})

describe('S5 — the tour guide is derived from the catalogue it explains', () => {
  it('renders an opening condition for every rung, and never a points band for a list rung', () => {
    const src = readFileSync(new URL('../src/components/TierGuide.vue', import.meta.url), 'utf8')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
    // The column is the shared rule, not a second implementation of it.
    expect(src).toContain('tierOpensWhen')
    // ...and the entry band it used to render is gone from the CODE (the file's own note still names
    // it, which is the point of the note). For j60/j300 that band is `[0, MAX]` and this screen
    // printed it as "0+" - the two hardest tiers in the game, advertised as needing nothing.
    expect(src).not.toContain('enterPointBand')
  })

  it('no rung can be described as opening at zero', () => {
    const acceptance: Partial<Record<TierId, number>> = { j60: 100, j300: 80 }
    for (const id of TIER_LADDER) {
      expect(tierOpensWhen(id, acceptance[id])).not.toMatch(/\b0\+?\s*(national|international)?/)
    }
  })
})

describe('S6 — the Stats switch covers every table there is (round 15, item 2)', () => {
  const src = readFileSync(new URL('../src/components/screens/StatsScreen.vue', import.meta.url), 'utf8')

  it('⚠ the options are DERIVED from a total Record over LadderTrack – a fourth table fails to compile, not to render', () => {
    // The bug this guards against already shipped once: the switch was hardcoded
    // ['domestic', 'itf'], so ladders.wta and seasonRecord.wta - on the snapshot since v30/v33 -
    // were invisible on the one screen whose job is tables. Her 26-1 W15 season existed nowhere.
    // The fix derives the options from `LADDER_TIP: Record<LadderTrack, string>`, which the type
    // system forces to stay total: a fourth LadderTrack member will not compile until somebody
    // writes its tooltip, and the moment they do, the switch shows it.
    expect(src).toContain('const LADDER_TIP: Record<LadderTrack, string>')
    expect(src).toContain('(Object.keys(LADDER_TIP) as LadderTrack[])')
    // ...and the hardcoded pair is gone for good.
    expect(src).not.toContain("(['domestic', 'itf'] as LadderTrack[])")
    // All three tables have a tooltip TODAY - the runtime half of the compile-time claim above.
    for (const track of ['domestic:', 'itf:', 'wta:']) expect(src).toContain(track)
  })

  it('the professional tab has its three sentences, in the file\'s own voice', () => {
    // The tooltip, the no-exchange line and the empty-table note - the three sentences every tab
    // needs. Short dash only; the words "Professional" / "World Tour" belong to the shared tables.
    expect(src).toContain('W15 and up – the paid tour. Junior points never cross over.')
    expect(src).toContain('Professional points only. Junior and national results do not count here.')
    expect(src).toContain('She has not played a professional event yet.')
    const template = src.slice(src.indexOf('<template>'), src.lastIndexOf('</template>'))
    expect(template).not.toContain('—')
    expect(template).not.toMatch(/[Ѐ-ӿ]/)
  })

  it('the wta tiles read the same snapshot seams the other two tabs read', () => {
    // Not a render test - a seam test: the screen reads `ladders[shown]` and `seasonRecord[shown]`,
    // so the third option gets rank/points/standings/counting-results/W-L for free the moment it is
    // in the options list. What is pinned is that the seams are the SHARED ones, not per-track
    // forks that could drift.
    expect(src).toContain('game.snapshot?.ladders[shown.value]')
    expect(src).toContain('game.snapshot?.seasonRecord[shown.value]')
  })
})

describe('S7 — the Home chip names her WORKING track, and the professional arm is a one-way door (02.08)', () => {
  // THE ARCHITECT'S SELECTION RULE, pinned end to end: no counting result anywhere -> no chip at
  // all; a counting domestic result -> National; a counting J result -> International; ANY counting
  // W result -> Professional, PERMANENTLY - the window emptying later never hands the chip back to
  // the junior tables. `activeLadderOf` owns the track (surfaced as `snap.activeLadder`) and
  // `rankChipTrack` owns only the empty case, so both halves are asserted here.
  //
  // Rows are fabricated the way finalizeTournament writes them - a result row AND the
  // `bestFinishByTier` high-water mark together - because the mark is exactly what makes "ever"
  // survive the 52-week pruning of the rows (see `wtaEverCounted` in world.ts).
  it('none -> domestic -> itf -> wta, in that precedence', () => {
    const world = createWorld('chip-rule')

    // A brand-new career: her table is the national one and there is NOTHING to put on a chip.
    let snap = toSnapshot(world)
    expect(snap.activeLadder).toBe('domestic')
    expect(rankChipTrack(snap)).toBeNull()
    expect(rankChipTrack(null)).toBeNull()

    // First counting domestic result -> the National chip.
    world.results.push({ playerId: KID_ID, week: world.week, points: 25, tier: 'local' })
    world.bestFinishByTier.local = 0
    snap = toSnapshot(world)
    expect(snap.activeLadder).toBe('domestic')
    expect(rankChipTrack(snap)).toBe('domestic')

    // A counting J result outranks the domestic book she still holds.
    world.results.push({ playerId: KID_ID, week: world.week, points: 12, tier: 'j30' })
    world.bestFinishByTier.j30 = 2
    snap = toSnapshot(world)
    expect(snap.activeLadder).toBe('itf')
    expect(rankChipTrack(snap)).toBe('itf')

    // ⚠ A SCORELESS W APPEARANCE IS NOT A COUNTING RESULT (isCountingResult IS points > 0): a
    // first-round exit leaves the mark at the zero row of the points table and must NOT turn the
    // chip professional - the rule says a COUNTING W result does.
    world.bestFinishByTier.w15 = TIERS.w15.points.length - 1
    world.results.push({ playerId: KID_ID, week: world.week, points: 0, tier: 'w15' })
    snap = toSnapshot(world)
    expect(snap.activeLadder).toBe('itf')
    expect(rankChipTrack(snap)).toBe('itf')

    // Her first COUNTING W result -> Professional.
    world.results.push({ playerId: KID_ID, week: world.week, points: 1, tier: 'w15' })
    world.bestFinishByTier.w15 = TIERS.w15.points.length - 2
    snap = toSnapshot(world)
    expect(snap.activeLadder).toBe('wta')
    expect(rankChipTrack(snap)).toBe('wta')
  })

  it('⚠ wta FOREVER: the chip survives the 52-week window deleting every W row', () => {
    const world = createWorld('chip-forever')
    // One counting W result, banked the way finalize banks it...
    world.results.push({ playerId: KID_ID, week: world.week, points: 10, tier: 'w15' })
    world.bestFinishByTier.w15 = 0
    expect(toSnapshot(world).activeLadder).toBe('wta')

    // ...then the rows age out of the RESULTS_WINDOW (pruning deletes them; modelled directly so
    // the case is exact rather than 53 ticks of noise). The live window is empty - she is Unranked
    // in the professional table - and the chip STAYS professional off the never-pruned mark: the
    // rule is "to the end of the game", not "while the window holds".
    world.results = world.results.filter((r) => r.playerId !== KID_ID)
    const snap = toSnapshot(world)
    expect(snap.ladders.wta.rank).toBeNull()
    expect(snap.activeLadder).toBe('wta')
    expect(rankChipTrack(snap)).toBe('wta')
    // Never back to the junior tables, whatever they still hold.
    world.results.push({ playerId: KID_ID, week: world.week, points: 300, tier: 'j300' })
    world.results.push({ playerId: KID_ID, week: world.week, points: 60, tier: 'national' })
    expect(toSnapshot(world).activeLadder).toBe('wta')
    expect(rankChipTrack(toSnapshot(world))).toBe('wta')
  })
})
