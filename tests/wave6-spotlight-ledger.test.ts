// =================================================================================================
// WAVE 6, T2 – THE EXPOSURE LEDGER: THE STANDING GATE, THE FIVE KINDS, AND THE 52-WEEK HORIZON
// =================================================================================================
//
// `docs/plans/life-wave-6-builder-2026-09.md` §2 T2; the model is `docs/specs/who-she-is-2026-09.md`
// §3c («the weeks that put her in the light – a title or a final on a big stage, a shoot week, a
// heavily public loss») and §3c-bis (the wrong story), with the booth's mention ruled into the same
// family on 10.09 (`docs/plans/the-way-she-sounds-2026-09.md` C4). Three of the architect's rulings
// are built into the code this file pins and each is named where it lands: **F** (the tier bar is a
// `TierId` compared through `TIER_LADDER`, never a number), **G** (`'publicLoss'` is honest only
// inside a 52-week horizon, because its only record prunes) and **K** (the public loss is read off
// the POINTS, and a skipped mandatory is not one).
//
// ⚠⚠ RE-AIMED UNDER THE OWNER'S **D1 (14.09)**: THE GATE STOPPED READING FAME. `sheIsNewsAt(world,
// week)` is gone; the one predicate is now `newsStandingOf(world)` – three bands off her
// PROFESSIONAL standing (`'known'` at WTA ≤ newsRankKnown, `'noticed'` at ≤ newsRankNoticed,
// `'quiet'` past both), with the «unranked is not rank one» belt (live `kidPoints(world, 'wta')`
// beside the cached rank). His words are quoted at `ECONOMY.spotlight.newsRankKnown`; the struck
// fame bar's history lives in the questions doc §1 and the 14.09 decision-log entry. What that
// re-cut this file: §B became the STANDING suite (the fame-decay case died with the week
// parameter – the read is PRESENT-TENSE by design, `newsStandingOf`'s own ⚠⚠), the crafted worlds
// stand on `standHerAt` (tests/helpers/newsStanding.ts) instead of fame-past-30 trophies, and the
// ARM table below re-words the two rows that named the dead symbol to today's spelling – the
// COUNTS stay the original build's measurement, run against the fame-gate tree.
//
// ⚠⚠ TWO OF THE FIVE KINDS HAD NO WRITER WHEN THIS FILE WAS WRITTEN, AND §C CRAFTS THEM RATHER THAN
// WAITING FOR ONE. ⭐ BOTH WRITERS HAVE SINCE LANDED (14.09) – `'wrongStory'` reads `publicWeek` +
// `publicWrong`, which T6's leak sets, and `'aired'` reads `airedMetWeek` / `airedEndedWeek`, which
// T7's booth stamps – so the sentence that used to stand here («on this tree every row in the game
// holds `null` / `false`») is no longer true and is corrected rather than annotated. The CRAFTING
// stays: a kind whose test can never reach it is a kind that ships unproven – this wave has already seen the «unable to fail» family nine times across two
// waves, and T1 caught a tenth inside its own arm 9 – so both are crafted from the v77 fields
// directly, fired, and then mutated back to silence (§D).
//
// ⚠⚠ EVERY ARM IS RECORDED AND EVERY COUNT IS MEASURED, the wave-2/3/4/5 duty kept – a net nobody
// watched fail proves nothing. Control GREEN first; every arm applied by a scripted string edit and
// UNDONE by the inverse edit, never `git checkout`, with the md5 of BOTH touched files checked back
// to pristine after each one. **No arm came in at 0 RED, so there is no null arm to declare.** Counts
// are CASES in this file (vitest counts cases, not assertions – see arm 1), 11 arms, run one at a
// time against a green control:
//
//     ARM 1  5 · ARM 2  9 · ARM 3  2 · ARM 4  1 · ARM 5  3 · ARM 6  1
//     ARM 7  1 · ARM 8  2 · ARM 9  2 · ARM 10 5 · ARM 11 1
//
//   ARM 1  the news gate deleted from `exposureEventsOf`         5 RED  §D's five below-the-bar
//          (today `if (newsStandingOf(world) === 'quiet') return         cases, one per kind.
//          out` – re-worded under D1, 14.09)
//                                                                       ⚠⚠ IT REDDENED **ONCE**
//                                                                       BEFORE §D WAS SPLIT, and
//                                                                       that is the measurement
//                                                                       that split it: five
//                                                                       fixtures in one case end
//                                                                       at the first failing
//                                                                       assertion, so four of the
//                                                                       five kinds were never
//                                                                       re-checked under the very
//                                                                       mutation that breaks all
//                                                                       five
//   ARM 2  `stageTierMin` pointed at a rung that does not exist   9 RED  §A's two bar cases, §C's
//          (`'wta500'` -> `'wta600'`)                                    two stage cases, §C's two
//                                                                       publicLoss cases, §C's
//                                                                       two-facts case and BOTH §F
//                                                                       cases. ⭐ Higher than the
//                                                                       six predicted, and the
//                                                                       extra reds are ruling F's
//                                                                       own sentence made visible:
//                                                                       the −1 guard turns OFF
//                                                                       `'stage'` AND
//                                                                       `'publicLoss'` together,
//                                                                       because both ask the same
//                                                                       ladder question
//   ARM 3  ⚠⚠ THE BRIEF'S OWN LITERAL SPELLING OF `'shoot'`       2 RED  §C's shoot case and §C's
//          (`completedShootWeeks(world, week).includes(week)`)           two-facts case. It is the
//                                                                       kind that CANNOT FIRE, and
//                                                                       this is the arm that proves
//                                                                       the correction is one
//   ARM 4  the `mandatoryMiss` guard deleted                      1 RED  §D's skipped-mandatory
//                                                                       case – ruling K part 2
//   ARM 5  the points comparison flipped (`<=` -> `>=`)           3 RED  §D's deep-run case and
//                                                                       both §F cases
//   ARM 6  `'wrongStory'` drops the `publicWeek === week` half    1 RED  §D's «needs BOTH» case
//          (it reads `ep.publicWrong` alone)
//   ARM 7  `'aired'` drops the ENDED stamp                        1 RED  §C's aired case
//   ARM 8  a WRITE planted at the head of `exposureEventsOf`      2 RED  §E's byte-for-byte case and
//          (`world.nextEventId += 1`)                                    §E's source census.
//                                                                       ⚠ `nextEventId` on T1's own
//                                                                       lesson: monotone, never
//                                                                       clamped, never re-derived –
//                                                                       a quantity the system is
//                                                                       not actively pulling back
//   ARM 9  a DRAW planted in the news gate (today                 2 RED  §E's key-counter case and
//          `newsStandingOf` – re-worded under D1, 14.09;                 §E's source census – the
//          `rngFromSeed(`${world.seed}:spotlight:${week}`)`)
//                                                                       same defect measured in
//                                                                       KEYS and in SOURCE, which
//                                                                       is the shape wave-4 §0.1
//                                                                       asks for
//   ARM 10 `'stage'` re-pointed at the PRUNED ledger              5 RED  §F's BOTH cases (the
//          (`world.results` rows paying the tier's title points)         asymmetry «fixed» into a
//                                                                       bug) and §C's three stage
//                                                                       cases – ruling G's own arm
//   ARM 11 the week comparison widened (`row.week !== week` ->    1 RED  §D's last-week case
//          `row.week > week`, «a loss inside the window»)
//
// ⚠⚠ AND THE HARNESS ITSELF FAILED FIRST, RECORDED RATHER THAN TIDIED AWAY, because it is the same
// family the arms are for. Its first version spelled a deletion as `replace(line, '')` and reverted
// it as `replace('', line)` – which inserts at offset 0, since every string contains the empty string
// at its start – and spelled arm 3's mutation with text that ALSO APPEARS IN A COMMENT, so the
// inverse edit repaired the comment and left the code mutated. Both wrote a file that no longer
// matched its md5, and the harness printed `False` and carried on for seven more arms. Rebuilt: every
// mutation's new text is unique, deletions go through a sentinel line, and a failed md5 is a hard
// stop. An inverse edit whose anchor is not unique is not an inverse edit.
import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// ⚠ A PASSTHROUGH RECORDER, NOT A STUB – wave 3's, 4's and 5's §B apparatus, verbatim and for its
// reason. Every call is delegated to the real `rngFromSeed`, so nothing this file measures is a
// fiction; the mock exists only so §E can COUNT the keys the ledger reaches for. Hoisted, because
// `vi.mock`'s factory is lifted above the imports.
const rngKeys = vi.hoisted(() => [] as string[])
vi.mock('../src/engine/rng', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/engine/rng')>()
  return {
    ...actual,
    rngFromSeed: (seed: string) => {
      rngKeys.push(seed)
      return actual.rngFromSeed(seed)
    },
  }
})

import { completedShootWeeks, createWorld, exposureEventsOf, kidPoints, newsStandingOf } from '../src/engine/world'
import { housekeep } from '../src/engine/world/bookkeeping'
import { standHerAt } from './helpers/newsStanding'
import { KID_ID, RESULTS_WINDOW } from '../src/engine/world/constants'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { AdOfferTerms, LoveEpisode, Offer } from '../src/shared/protocol'
import type { TierId } from '../src/engine/season/types'
import type { WorldState } from '../src/engine/world'

/** The week every case asks about. Late enough that a 52-week prune has something to prune and that
 *  a crafted trophy can be 60 weeks old without landing before week 0. */
const WEEK = 300

/** Source with every comment removed – `tests/spirit.test.ts`'s own helper, and §E's census cannot
 *  work without it: this file's subject is a module whose COMMENTS name `rng`, `Math.random` and
 *  `new Date` in order to forswear them. */
function codeOnly(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

/** A world nobody is watching: no professional points, a rank past every bar – where every career
 *  starts, and `'quiet'` under D1's belt whatever rank a case fabricates onto it. */
function unknown(seed = 'spotlight-unknown'): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = WEEK
  return world
}

/** ...and the same career the world IS watching – stood in the `'known'` band by `standHerAt`.
 *
 *  ⚠ RE-CUT UNDER D1 (14.09): this fixture used to be `known()` – a Slam title and a lost final
 *  three weeks back, fame 36.27 against the struck bar of 30. The gate stopped reading fame, so the
 *  standing is now posed the one shared way: a `wta250` results row (BELOW `stageTierMin`, so the
 *  fixture can never read back as a `'publicLoss'` of its own making – the same craft the old
 *  three-week offset bought against `'stage'`) and a mid-band rank. A known girl with an empty
 *  week, exactly as before – only the currency of «known» moved, from fame to standing. */
function known(seed = 'spotlight-known'): WorldState {
  const world = unknown(seed)
  standHerAt(world, 'known', WEEK)
  return world
}

/** A trophy of either kind at `tier`, stamped at `week` – the cabinet's own shape
 *  (`finalizeTournament`: `kidFinish === 0` onto `titles`, `=== 1` onto `finals`). */
function trophy(world: WorldState, tier: TierId, kind: 'titles' | 'finals', week: number): void {
  const shelf = (world.trophiesByTier[tier] ??= { titles: [], finals: [] })
  shelf[kind].push(week)
}

/** One result row for HER – the shape `world.ts` pushes at finalize, plus the one `world/mandatory.ts`
 *  writes for a skipped obligation. */
function result(world: WorldState, over: Partial<{ playerId: string; week: number; points: number; tier: TierId; mandatoryMiss: true }>): void {
  world.results.push({ playerId: KID_ID, week: WEEK, points: 1, tier: 'wta500', ...over })
}

/** A SIGNED ad paper carrying exactly these shoot weeks – `tests/round29p5-business.test.ts`'s own
 *  `plantShoots`, because the fold over the record is the subject here and the letter machinery is
 *  driven end to end in the file that owns it. */
function plantShoots(world: WorldState, weeks: number[]): void {
  const offer: Offer = {
    id: `ad-spotlight-${world.offers.length}`,
    kind: 'ad',
    week: Math.min(...weeks, world.week) - 1,
    deadlineWeek: world.week,
    state: 'signed',
    fromWeek: Math.min(...weeks, world.week) - 1,
    untilWeek: Math.max(...weeks) + 52,
    terms: {
      brand: 'Quiet Hour',
      cashCents: 20_000_00,
      termWeeks: 52,
      shootCount: weeks.length,
      shootWeeks: [...weeks],
    } as AdOfferTerms,
  }
  world.offers.push(offer)
}

/** A kid result row with NO tier – the shape `SeasonResult` allows for AI rows and pre-r5 saves.
 *  Its own helper rather than an option on `result()` above, because that one always states a tier
 *  and the ABSENCE is what this fixture is for. */
function tierlessResult(world: WorldState): void {
  world.results.push({ playerId: KID_ID, week: WEEK, points: 1 })
}

/** A v77 episode row, every one of the ten fields stated out loud – T1's own rule («a field that is
 *  back-filled is a field that is required»), and here it is load-bearing twice over: the four
 *  publicity fields are exactly what §C has to set by hand – written here rather than played into
 *  existence, which stays the right shape now that T6 and T7 have given them engine writers too. */
function episode(over: Partial<LoveEpisode> = {}): LoveEpisode {
  return {
    id: 'p:120',
    sinceWeek: 120,
    endedWeek: null,
    knownWeek: null,
    wants: 'open',
    partnerId: 'p:120',
    publicWeek: null,
    publicWrong: false,
    airedMetWeek: null,
    airedEndedWeek: null,
    ...over,
  }
}

/** The kinds this week produced, in order. */
function kinds(world: WorldState, week = WEEK): string[] {
  return exposureEventsOf(world, week).map((e) => e.kind)
}

// =================================================================================================
// A. THE CONSTANTS – the bar, and the LADDER that decides what a big stage is (ruling F)
// =================================================================================================
describe('wave 6 T2 A – ECONOMY.spotlight, and the tier bar that is a name rather than a number', () => {
  it('⭐⭐ resolves the stage bar to a real rung of TIER_LADDER – ruling F\'s own pin', () => {
    // ⚠⚠ THIS IS THE CASE RULING F ASKED FOR BY NAME, and the defect it stands against is recorded in
    // this repo in its own words (`src/art/venues.ts:150`): a hand-written tier array whose
    // `indexOf(t)` «was −1 for every one of them, the lower-tier walk never» ran – silent, because
    // `indexOf` does not throw. A renamed or removed rung now goes RED here with a sentence instead
    // of turning the spotlight off.
    expect(TIER_LADDER.indexOf(ECONOMY.spotlight.stageTierMin)).toBeGreaterThan(-1)
    // ...and it is a NAME. There is no numeric tier scale in this codebase – `TierId` is a string
    // union of sixteen names and `wta125` would break any map built from the digits – so the brief's
    // `stageTierMin 500` could not have been compared against anything.
    expect(typeof ECONOMY.spotlight.stageTierMin).toBe('string')
  })

  it('puts the professional headline rungs at or above the bar and the smaller ones below', () => {
    const bar = TIER_LADDER.indexOf(ECONOMY.spotlight.stageTierMin)
    // ⚠ ASSERTED AS A RELATION AND NOT AS A LIST OF THREE NAMES, so a rung added between wta500 and
    // slam tomorrow joins the spotlight without a test edit – which is the whole reason ruling F
    // made this an index comparison. What is pinned is the MEANING of «a big stage»: the four
    // rungs the tour sells as headline events count, everything she climbs through does not.
    for (const tier of ['wta500', 'wta1000', 'slam'] as TierId[]) {
      expect(TIER_LADDER.indexOf(tier), `${tier} is a big stage`).toBeGreaterThanOrEqual(bar)
    }
    for (const tier of ['w15', 'w100', 'wta125', 'wta250'] as TierId[]) {
      expect(TIER_LADDER.indexOf(tier), `${tier} is not`).toBeLessThan(bar)
    }
  })

  it('⭐⭐ carries the two rank bands, and they are THE OWNER\'S OWN numbers – D1 (14.09)', () => {
    // ⚠ RE-AIMED UNDER D1 (14.09): this case used to pin `newsFameMin` at 30 – unruled, «a point on
    // the SCALE», measured at 6.9% of career weeks. D1 struck the fame bar entirely and put two RANK
    // bands in its place, and unlike the number they replace THESE ARE RULED – top-100 «вполне
    // уверенно», top-200 «иногда», his sentence verbatim at the constant, «прямая аналогия –
    // спонсорская лестница». So this pin asserts the VALUES, which nothing else in this block may
    // do: a drift here is somebody re-tuning the owner's own words.
    expect(ECONOMY.spotlight.newsRankKnown).toBe(100)
    expect(ECONOMY.spotlight.newsRankNoticed).toBe(200)
    // ...the bands NEST – known inside noticed – or `newsStandingOf`'s two comparisons stop being
    // three bands at all...
    expect(ECONOMY.spotlight.newsRankKnown).toBeLessThan(ECONOMY.spotlight.newsRankNoticed)
    // ...and the fame bar is GONE, not merely unread: a constant left standing is a constant some
    // later wave re-reads as an oversight (the economy block's own «a constant with no reader» law).
    expect('newsFameMin' in ECONOMY.spotlight, 'D1 removed newsFameMin from the block').toBe(false)
  })
})

// =================================================================================================
// B. THE STANDING – `newsStandingOf`, the one gate every public surface in this wave shares
// =================================================================================================
//
// ⚠⚠ THE WHOLE SECTION RE-AIMED UNDER D1 (14.09) – the fame bar became two RANK bands, and two of
// the old cases died WITH their subject rather than being weakened: «says yes exactly AT the bar»
// (a fame arithmetic that no longer exists – its boundary duty passes to the rank pins below) and
// «is a question about a WEEK, and the answer fades» (the read is PRESENT-TENSE by design now –
// `newsStandingOf` takes no week, because the cached rank is already «as of the last closed fold»
// and a week parameter would promise a rank history nobody keeps; the predicate's own ⚠⚠ carries
// the argument). Recorded here so the deletions are choices with a ruling behind them, not drift.
describe('wave 6 T2 B – where the world stands on her', () => {
  it('says quiet for a career the world has not noticed, and a fabricated rank alone cannot change it', () => {
    // ⚠⚠ THE BELT CASE – «unranked is not rank one», the same guard every rank reader in
    // `world/ladder.ts` carries one at a time. A fresh career's cached rank is `tableSize` – a
    // POSITIVE number – so a gate that read the rank alone would call the bottom of the table
    // «ranked»; and a fixture (or a stale cache) that says rank 1 with zero live professional
    // points must still read quiet. Both halves of D1's predicate, held apart.
    const world = unknown()
    expect(kidPoints(world, 'wta'), 'the fixture really holds no professional points').toBe(0)
    expect(newsStandingOf(world)).toBe('quiet')
    world.kidRankWta = 1
    expect(newsStandingOf(world), '⚠ D1 (14.09): rank one with no points is nobody – points first').toBe('quiet')
    world.kidRankWta = 50
    expect(newsStandingOf(world), 'and mid-band is no better without the points').toBe('quiet')
  })

  it('⭐⭐ the boundaries sit exactly ON the owner\'s bars – 100 known, 101 noticed, 200 noticed, 201 quiet', () => {
    // ⚠ RE-AIMED UNDER D1 (14.09): this duty belonged to «says yes exactly AT the bar» – fame
    // 14 + 8 + 8 = exactly 30. The boundary is worth an exact case in the new currency too, and
    // BOTH comparisons are `<=`, so each bar itself is still inside its band. Computed from
    // `ECONOMY` rather than written out, so the constants pin in §A is the ONE place the owner's
    // numbers are asserted as numbers.
    const s = ECONOMY.spotlight
    const bars: [number, string, string][] = [
      [s.newsRankKnown, 'known', 'the top-100 bar itself lives known'],
      [s.newsRankKnown + 1, 'noticed', 'one place past it the light only visits'],
      [s.newsRankNoticed, 'noticed', 'the top-200 bar itself is still noticed'],
      [s.newsRankNoticed + 1, 'quiet', 'one place past both bars is nobody'],
    ]
    for (const [rank, want, why] of bars) {
      const world = unknown(`spotlight-bar-${rank}`)
      standHerAt(world, 'noticed', WEEK) // the row – live points; the rank under test is set below
      world.kidRankWta = rank
      expect(newsStandingOf(world), `rank ${rank}: ${why}`).toBe(want)
    }
  })

  it('⭐ is the ONLY gate: a known week with nothing in it is empty, and an empty week is no standing question', () => {
    // A known girl whose week held nothing produces NO events – the ledger is about what happened,
    // not about her standing. The pair with §D is the licence read both ways: standing without a
    // fact is silent here, and a fact without standing is silent there.
    expect(kinds(known())).toEqual([])
  })
})

// =================================================================================================
// C. THE FIVE KINDS – one crafted world each, the two publicity kinds posed from the v77 fields
// =================================================================================================
describe('wave 6 T2 C – what put her in the light', () => {
  it('\'stage\' – a TITLE at a big stage this week', () => {
    const world = known()
    trophy(world, 'wta1000', 'titles', WEEK)
    expect(kinds(world)).toEqual(['stage'])
  })

  it('\'stage\' – and a lost FINAL at a big stage, which is still a final on a big stage', () => {
    // ⚠ `finals` MEANS SHE LOST IT (the cabinet's own contract – the two arrays are disjoint, so a
    // title is never counted twice). §3c's sentence is «a title or a final on a big stage», so the
    // kind is `titles ∪ finals` – ruling G part 1.
    const world = known()
    trophy(world, 'slam', 'finals', WEEK)
    expect(kinds(world)).toEqual(['stage'])
  })

  it('⭐ \'stage\' – and the NOTICED band sees it too: both non-quiet bands see every kind – D1 (14.09)', () => {
    // ⚠ ADDED WITH D1 (14.09), because the ruling created a band the old gate did not have and «what
    // each band buys» is decided at the callers: a noticed girl's occasions ARE occasions – her
    // discounts live at the leak (`noticedLeakScale`) and at habituation (growth is `'known'`-only),
    // never here. A gate that dimmed the KINDS for the middle band would be a third place the band
    // map lived, free to drift from the one at `newsStandingOf`.
    const world = unknown('spotlight-noticed')
    standHerAt(world, 'noticed', WEEK)
    trophy(world, 'wta1000', 'titles', WEEK)
    expect(newsStandingOf(world), 'the fixture sits in the middle band').toBe('noticed')
    expect(kinds(world)).toEqual(['stage'])
  })

  it('\'shoot\' – a shoot week she actually lived', () => {
    // ⚠⚠ THE CASE THAT PROVES THE BRIEF'S OWN SPELLING IS DEAD (arm 3). `completedShootWeeks(world,
    // w)` answers «lived STRICTLY BEFORE w», so `…(world, week).includes(week)` is false for every
    // world at every week and the kind could never fire. The ledger asks with `week + 1`; §D pins
    // the phase from the other side.
    const world = known()
    plantShoots(world, [WEEK])
    expect(kinds(world)).toEqual(['shoot'])
  })

  it('\'publicLoss\' – an early exit at a big stage, read off the POINTS (ruling K)', () => {
    const world = known()
    result(world, { points: TIERS.wta500.points[Math.log2(TIERS.wta500.drawSize) - 1] })
    expect(kinds(world)).toEqual(['publicLoss'])

    // ⚠ THE THRESHOLD IS THE ROUND, re-measured here rather than quoted: each tier's array is
    // strictly decreasing with `log2(drawSize) + 1` entries, so the finish index and the payout are
    // in bijection and «lost in the first or second round» IS `points <= points[log2(draw) − 1]`.
    expect(TIERS.wta500.points[4]).toBe(60)
    expect(TIERS.wta1000.points[5]).toBe(65)
    expect(TIERS.slam.points[6]).toBe(70)
    // ...and the first-round row exists at all only because the big stages pay for it – 1 / 10 / 10
    // at the last rung, above `world.ts`'s own `if (points > 0)` push.
    for (const tier of ['wta500', 'wta1000', 'slam'] as const) {
      expect(TIERS[tier].points[TIERS[tier].points.length - 1], `${tier} pays an R1 loser`).toBeGreaterThan(0)
    }
  })

  it('\'publicLoss\' – at every big stage, on each stage\'s own threshold', () => {
    for (const tier of ['wta500', 'wta1000', 'slam'] as TierId[]) {
      const world = known(`spotlight-loss-${tier}`)
      const def = TIERS[tier]
      result(world, { tier, points: def.points[Math.log2(def.drawSize) - 1] })
      expect(kinds(world), tier).toEqual(['publicLoss'])
    }
  })

  it('⭐⭐ \'aired\' – the booth touched her private life this week, from the MET stamp and from the ENDED one', () => {
    // ⚠⚠ CRAFTED FROM THE v77 FIELDS BECAUSE T7 IS THE ONLY WRITER AND T7 HAS NOT LANDED. On this
    // tree `airedMetWeek` is null on every row in the game, so this world cannot arise from play –
    // and a kind proven only by its absence is a kind that ships unproven.
    const met = known('spotlight-aired-met')
    met.loveEpisodes = [episode({ publicWeek: WEEK - 10, airedMetWeek: WEEK })]
    expect(kinds(met)).toEqual(['aired'])

    const ended = known('spotlight-aired-ended')
    ended.loveEpisodes = [episode({ endedWeek: WEEK - 2, publicWeek: WEEK - 10, airedEndedWeek: WEEK })]
    expect(kinds(ended)).toEqual(['aired'])
  })

  it('⭐⭐ \'wrongStory\' – a leak that landed WRONG, on the week it landed', () => {
    // Same construction and the same reason: T6 writes `publicWeek` / `publicWrong`, T6 is not here.
    const world = known('spotlight-wrong')
    world.loveEpisodes = [episode({ publicWeek: WEEK, publicWrong: true })]
    expect(kinds(world)).toEqual(['wrongStory'])
  })

  it('⭐ a week that held two facts is two events, in the kinds\' declared order', () => {
    // T3 sums the week's events, so a week that held two is not a week that held one. The ORDER is
    // the declaration order (stage · shoot · publicLoss · aired · wrongStory), which is what lets
    // every case in this file deep-equal the list instead of sorting it.
    const world = known('spotlight-two')
    trophy(world, 'slam', 'titles', WEEK)
    plantShoots(world, [WEEK])
    world.loveEpisodes = [episode({ publicWeek: WEEK, publicWrong: true })]
    expect(kinds(world)).toEqual(['stage', 'shoot', 'wrongStory'])
  })
})

// =================================================================================================
// D. THE LICENCE, BOTH WAYS – every kind is silent below the bar, and silent off its own week
// =================================================================================================
describe('wave 6 T2 D – an unknown girl has no spotlight, whatever she wins', () => {
  // ⚠⚠ THE SAME FIVE FACTS AS §C, ON A WORLD WITH NO STANDING – the brief's own sentence made
  // mechanical («an unknown girl has no spotlight, whatever she wins» – the gate is
  // `newsStandingOf` since D1, 14.09, and `'quiet'` closes every kind). Each fixture is built
  // exactly as its §C twin, so what differs between the two describes is the standing and nothing
  // else. ⚠ These five are all quiet by the BELT's route: even the fixture that pushes a scoring
  // row pushes ONE point, which `RANKABLE_MIN` folds to zero (§VIII.A.2.b – one point is not on
  // the list at all), so `kidPoints` reads 0 and the rank is never consulted. The BAND's route –
  // real points against a rank past both bars – is §B's 201 boundary arm; between them the two
  // halves of D1's predicate are each held where they decide.
  //
  // ⚠ ONE CASE PER KIND AND NOT ONE CASE WITH FIVE ASSERTIONS, AND THAT IS A MEASURED CHOICE. Written
  // as a single case it reddened ONCE under arm 1 (the gate deleted) – vitest counts CASES, and the
  // first failing assertion ends the case, so four of the five kinds were never re-checked under the
  // very mutation that breaks all five. Split, the arm reddens five times and each kind's gate is
  // held independently. The law is the wave's load-bearing one; it gets five nets.
  it('⭐⭐ \'stage\' is silent for a career the world has not noticed', () => {
    const world = unknown('d-stage')
    trophy(world, 'slam', 'titles', WEEK)
    expect(kinds(world), 'a Slam title nobody was watching her win').toEqual([])
  })

  it('⭐⭐ \'shoot\' is silent for a career the world has not noticed', () => {
    const world = unknown('d-shoot')
    plantShoots(world, [WEEK])
    expect(kinds(world)).toEqual([])
  })

  it('⭐⭐ \'publicLoss\' is silent for a career the world has not noticed', () => {
    const world = unknown('d-loss')
    result(world, { points: 1 })
    expect(kinds(world)).toEqual([])
  })

  it('⭐⭐ \'aired\' is silent for a career the world has not noticed', () => {
    const world = unknown('d-aired')
    world.loveEpisodes = [episode({ publicWeek: WEEK - 10, airedMetWeek: WEEK })]
    expect(kinds(world)).toEqual([])
  })

  it('⭐⭐ \'wrongStory\' is silent for a career the world has not noticed', () => {
    const world = unknown('d-wrong')
    world.loveEpisodes = [episode({ publicWeek: WEEK, publicWrong: true })]
    expect(kinds(world)).toEqual([])
  })

  it('\'stage\' is silent below the tier bar and off its own week', () => {
    const small = known('d-small')
    trophy(small, 'wta250', 'titles', WEEK)
    expect(kinds(small), 'a W250 title is not a big stage').toEqual([])

    const elsewhere = known('d-elsewhere')
    trophy(elsewhere, 'slam', 'titles', WEEK - 1)
    expect(kinds(elsewhere), 'last week is not this week').toEqual([])
  })

  it('⭐⭐ \'shoot\' asks about THIS week – the phase, pinned from both sides', () => {
    const before = known('d-shoot-before')
    plantShoots(before, [WEEK - 1])
    expect(kinds(before), 'the cameras were here last week').toEqual([])

    const after = known('d-shoot-after')
    plantShoots(after, [WEEK + 1])
    expect(kinds(after), 'and a booked shoot is a promise, not a photograph').toEqual([])

    // ⚠⚠ AND THE HELPER'S OWN CONTRACT, ASSERTED, because it is what makes the `week + 1` argument
    // in `spotlight.ts` correct rather than an off-by-one: `completedShootWeeks(world, w)` never
    // contains `w`. A reader who «fixes» the +1 will find this case waiting with the reason.
    const onIt = known('d-shoot-on')
    plantShoots(onIt, [WEEK])
    expect(completedShootWeeks(onIt, WEEK)).toEqual([])
    expect(completedShootWeeks(onIt, WEEK + 1)).toEqual([WEEK])
  })

  it('⭐⭐ \'publicLoss\' is not a skipped mandatory – ruling K part 2', () => {
    // The flag marks the scoreless row the tour writes when she does not turn up: it takes a SLOT,
    // not points, and she was never at the tournament. A girl who did not play did not lose in front
    // of anyone, and charging her for it would be a success tax on an ABSENCE – which §0.4 forbids
    // twice over.
    const world = known('d-mandatory')
    result(world, { points: 0, mandatoryMiss: true })
    expect(kinds(world)).toEqual([])
  })

  it('\'publicLoss\' is silent for a deep run, for a small stage, for a tier-less row and for somebody else', () => {
    const deep = known('d-deep')
    result(deep, { points: TIERS.wta500.points[3] })
    expect(kinds(deep), 'a quarter-final is not a heavily public loss').toEqual([])

    const small = known('d-loss-small')
    result(small, { tier: 'wta250', points: 1 })
    expect(kinds(small)).toEqual([])

    const tierless = known('d-loss-tierless')
    tierlessResult(tierless)
    expect(kinds(tierless), 'an unknown stage is not a big one').toEqual([])

    const rival = known('d-loss-rival')
    result(rival, { playerId: 'ai-7', points: 1 })
    expect(kinds(rival), 'the spotlight is hers, not the draw\'s').toEqual([])
  })

  it('\'publicLoss\' asks about THIS week and not about the window (arm 11)', () => {
    const world = known('d-loss-lastweek')
    result(world, { week: WEEK - 1, points: 1 })
    expect(kinds(world)).toEqual([])
  })

  it('\'aired\' is silent when the booth spoke in another week', () => {
    const world = known('d-aired-elsewhere')
    world.loveEpisodes = [episode({ publicWeek: WEEK - 20, airedMetWeek: WEEK - 5 })]
    expect(kinds(world)).toEqual([])
  })

  it('⭐ \'wrongStory\' needs BOTH a story and a wrong one', () => {
    // ⚠ `publicWrong` IS MEANINGLESS WHILE `publicWeek` IS NULL – the field's own contract in
    // `protocol/narrative.ts`. A story that was never told cannot have been told wrong, and this is
    // the case that holds the `&&` (arm 6).
    const neverTold = known('d-wrong-never')
    neverTold.loveEpisodes = [episode({ publicWeek: null, publicWrong: true })]
    expect(kinds(neverTold)).toEqual([])

    const toldRight = known('d-wrong-right')
    toldRight.loveEpisodes = [episode({ publicWeek: WEEK, publicWrong: false })]
    expect(kinds(toldRight), 'a true story this week is the leak\'s own row, not this kind').toEqual([])

    const toldElsewhere = known('d-wrong-elsewhere')
    toldElsewhere.loveEpisodes = [episode({ publicWeek: WEEK - 30, publicWrong: true })]
    expect(kinds(toldElsewhere), 'the sting lands on the week it landed').toEqual([])
  })
})

// =================================================================================================
// E. PURITY – zero draws, zero writes, and a census of the file itself
// =================================================================================================
describe('wave 6 T2 E – a derivation and nothing else', () => {
  it('⭐⭐ requests NOT ONE rng key while a week is read, and the recorder is proven live', () => {
    // ⚠ THE POSITIVE CONTROL IS THE FIXTURE'S OWN CONSTRUCTION, which is the cheapest honest one
    // available: `createWorld` walks the childhood and the cohort and asks for thousands of keys
    // through the very function this file mocks. If the recorder were dead, this number would be 0
    // and the assertion below would pass for the wrong reason.
    rngKeys.length = 0
    const world = known('e-keys')
    expect(rngKeys.length, 'the recorder sees the engine\'s own keys').toBeGreaterThan(0)

    trophy(world, 'slam', 'titles', WEEK)
    plantShoots(world, [WEEK])
    result(world, { points: 1 })
    world.loveEpisodes = [episode({ publicWeek: WEEK, publicWrong: true, airedMetWeek: WEEK })]
    rngKeys.length = 0
    for (let week = WEEK - 5; week <= WEEK + 5; week++) {
      // ⚠ D1 (14.09): the gate lost its week parameter – `newsStandingOf` is present-tense, and it
      // now walks the LADDER fold (`kidPoints`), which is exactly why it stays inside this loop:
      // the fold and its memoisation must be draw-free too, and this is the case that measures it.
      newsStandingOf(world)
      exposureEventsOf(world, week)
    }
    expect(rngKeys, 'the ledger draws on no stream at all').toEqual([])
  })

  it('⭐⭐ leaves the world byte-for-byte identical, `rngMain` included', () => {
    const world = known('e-writes')
    trophy(world, 'slam', 'titles', WEEK)
    plantShoots(world, [WEEK])
    result(world, { points: 1 })
    world.loveEpisodes = [episode({ publicWeek: WEEK, publicWrong: true, airedEndedWeek: WEEK })]
    const before = JSON.stringify(world)
    for (let week = WEEK - 5; week <= WEEK + 5; week++) {
      // ⚠ D1 (14.09): `newsStandingOf` replaces the weekly fame read – same purity duty, now owed
      // by the rank fold it walks (the memo cache lives OFF the world, and this is the pin).
      newsStandingOf(world)
      exposureEventsOf(world, week)
    }
    expect(JSON.stringify(world)).toBe(before)
  })

  it('answers the same question with the same answer, however often it is asked', () => {
    // The other half of «pure»: no memo, no cursor, no first-call special case. Two reads of one
    // week agree, and they agree on a FRESH array each time (nothing shared for a caller to mutate).
    const world = known('e-repeat')
    trophy(world, 'slam', 'titles', WEEK)
    const first = exposureEventsOf(world, WEEK)
    const second = exposureEventsOf(world, WEEK)
    expect(second).toEqual(first)
    expect(second).not.toBe(first)
  })

  it('⭐ carries no draw, no clock and no assignment in its own source', () => {
    // ⚠ THE FILE ALONE, READ BY PATH, AND THAT IS DELIBERATE. This is a NEGATIVE claim about ONE
    // module, so the honest source is that module – `engineModuleSource('world')` would widen it to
    // every leaf in the package, where `rng` is legitimate, and a widened negative is an over-strict
    // pin that trips on a symbol it was never talking about (the pin-hygiene law, stated for `.vue`
    // files and true here). Comments are stripped: this module's own header names all three in order
    // to forswear them.
    const src = codeOnly(readFileSync(fileURLToPath(new URL('../src/engine/world/spotlight.ts', import.meta.url)), 'utf8'))
    expect(src).not.toMatch(/\brng\b|rngFromSeed|resumeMain|Math\.random/i)
    expect(src).not.toMatch(/new Date|Date\.now/)
    // ...and nothing is ever assigned INTO the world, or pushed onto a list hanging off it – the two
    // shapes a pure derivation cannot have. (`out.push` is this module's own local array and is not
    // what either pattern matches.)
    expect(src).not.toMatch(/world\.[A-Za-z.[\]']+\s*(=[^=]|\+=|-=|\?\?=)/)
    expect(src).not.toMatch(/world[A-Za-z0-9_.[\]']*\.(push|splice|sort|pop|shift|unshift)\(/)
  })
})

// =================================================================================================
// F. THE HORIZON – ruling G: four kinds are permanent, `'publicLoss'` prunes at 52 weeks
// =================================================================================================
describe('wave 6 T2 F – the asymmetry, written down and pinned', () => {
  it('⭐⭐⭐ answers for a 60-week-old TITLE and not for a 60-week-old LOSS, because one record is pruned', () => {
    // ⚠⚠ THIS IS RULING G's OWN PIN AND THE REASON IT EXISTS: an asymmetry nobody wrote down is an
    // asymmetry the next wave discovers as a bug. `'stage'` reads `trophiesByTier`, which is
    // append-only and never pruned; `'publicLoss'` reads `world.results`, which prunes at
    // RESULTS_WINDOW weeks – and an early exit is stamped NOWHERE ELSE (`bestFinishByTier` is a
    // high-water mark carrying no week at all). So the same two facts, stamped in the same old week,
    // stop being equally readable the moment the ledger is housekept.
    const old = WEEK - 60
    expect(old, 'the fact is older than the window').toBeLessThan(WEEK - RESULTS_WINDOW)

    const world = unknown('f-horizon')
    // ⚠ D1 (14.09): the gate is her standing NOW, not her fame THEN – `newsStandingOf` has no week
    // axis, so «she was news that week» became «the world is looking at her while it is asked».
    // The standing row is DELIBERATELY recent (`standHerAt` at WEEK): stood at `old` it would fall
    // out of the rolling fold at world.week and the case would measure the gate, not the horizon.
    standHerAt(world, 'known', WEEK)
    trophy(world, 'slam', 'titles', old)
    trophy(world, 'slam', 'finals', old)
    result(world, { week: old, points: 1 })
    expect(newsStandingOf(world), '⚠ D1 (14.09): the gate reads her standing, present-tense').toBe('known')
    // BEFORE the prune both facts answer: two stage events (the title and the lost final) and the loss
    expect(kinds(world, old)).toEqual(['stage', 'stage', 'publicLoss'])

    // ...and then the engine's OWN pruner runs – not a hand-deletion, so what this case measures is
    // the housekeeping the game does every week and not a fixture of the test's own making.
    housekeep(world)
    // ⚠ D1 (14.09) RE-AIM, NOT A WEAKENING: the filter narrows to the OLD week because the fixture
    // now carries a SECOND kid row – `standHerAt`'s recent one, which the prune rightly keeps (it
    // is 0 weeks old). What the case asserts is unchanged: the loss's own record is gone.
    expect(world.results.filter((r) => r.playerId === KID_ID && r.week === old), 'the row is gone, and the prune took it').toEqual([])
    expect(newsStandingOf(world), 'and the prune did not close the gate – the standing row survived it').toBe('known')
    expect(kinds(world, old), 'the cabinet still remembers; the results ledger does not').toEqual(['stage', 'stage'])
  })

  it('keeps the loss readable INSIDE the window, which is where the weekly tick asks', () => {
    // The tick asks about the week that has just CLOSED – `world.week − 1`, the architect's ruling P,
    // corrected from `world.week` by v77's T3b – which is ONE week inside a 52-week window, so it
    // never meets the edge either. ⚠ T9's benches must stay inside the window too, or they will
    // report the prune as if it were a fact about her life.
    const world = unknown('f-inside')
    standHerAt(world, 'known', WEEK) // ⚠ D1 (14.09): the gate is her standing, posed the shared way
    trophy(world, 'slam', 'titles', WEEK - 4)
    trophy(world, 'slam', 'finals', WEEK - 4)
    result(world, { week: WEEK - 4, points: 1 })
    housekeep(world)
    expect(kinds(world, WEEK - 4)).toEqual(['stage', 'stage', 'publicLoss'])
  })
})
