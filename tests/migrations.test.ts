import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { migrateSave } from '../src/engine/migrations'
import { marketIndex, nameSuggestionsFor, SAVE_SCHEMA_VERSION, shopItem, unitPriceCents } from '../src/engine/world'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { mainStateConsistent } from '../src/engine/rng'
import { planSessions, planWeek } from '../src/engine/plan'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS } from '../src/shared/protocol'

describe('save migrations', () => {
  it('upgrades a v0 save to the current schema', () => {
    const v0 = { seed: 'old-timer', week: 42, log: ['W42: something'] }
    const migrated = migrateSave(v0)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.fundsCents).toBe(20_000_00)
    expect(migrated.week).toBe(42)
    expect(migrated.profile).toEqual(DEFAULT_PROFILE)
  })

  it('upgrades a v1 save: gains the default player profile', () => {
    const v1 = { schemaVersion: 1, seed: 'bublik-junior', week: 52, fundsCents: -285_600, log: [] }
    const migrated = migrateSave(v1)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.fundsCents).toBe(-285_600)
    expect(migrated.profile).toEqual(DEFAULT_PROFILE)
  })

  it('upgrades a v2 save: profile gains the default play style', () => {
    const v2 = {
      schemaVersion: 2,
      seed: 's',
      week: 3,
      fundsCents: 100,
      profile: { kidName: 'Iga', gender: 'girl', country: 'PL', background: 'working', coachSetup: 'parent' },
      log: [],
    }
    const migrated = migrateSave(v2)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.profile.playStyle).toBe('all-court')
    expect(migrated.profile.kidName).toBe('Iga')
  })

  it('upgrades a v3 save: gains the default week plan', () => {
    const v3 = {
      schemaVersion: 3,
      seed: 's',
      week: 9,
      fundsCents: 42,
      profile: { ...DEFAULT_PROFILE },
      log: [],
    }
    const migrated = migrateSave(v3)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    // ⚠ RE-AIMED FOR v47, NOT WEAKENED: the two fields this test was written about are asserted
    // EXACTLY as before, and the third is the one v47 added. A v3 save gains the default split at the
    // v3 -> v4 step and then, at v46 -> v47, the WEEK that split has always been drawing – five
    // ordinary practice sessions laid out by `sessionDays`. `toEqual` against the preset would now
    // assert the absence of a field that every migrated save carries, which is the opposite claim.
    expect(migrated.plan.train).toBe(WEEK_PLAN_PRESETS.balanced.train)
    expect(migrated.plan.rest).toBe(WEEK_PLAN_PRESETS.balanced.rest)
    expect(migrated.plan.week).toEqual(
      planWeek({ train: WEEK_PLAN_PRESETS.balanced.train, rest: WEEK_PLAN_PRESETS.balanced.rest }),
    )
    expect(planSessions(migrated.plan.week!)).toBe(5)
  })

  it('upgrades a v4 save: careerId backfilled as legacy-<seed>', () => {
    const v4 = {
      schemaVersion: 4,
      seed: 'coco-2004',
      week: 12,
      fundsCents: 999,
      profile: { ...DEFAULT_PROFILE },
      plan: { ...WEEK_PLAN_PRESETS.balanced },
      log: [],
    }
    const migrated = migrateSave(v4)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.careerId).toBe('legacy-coco-2004')
    expect(migrated.week).toBe(12)
  })

  it('upgrades a v5 save to v6: old log becomes info events, world systems generated', () => {
    const v5 = {
      schemaVersion: 5,
      careerId: 'c-migrate-abc',
      seed: 'migrate-me',
      week: 30,
      fundsCents: 5_000_00,
      profile: { ...DEFAULT_PROFILE, kidName: 'Coco' },
      plan: { ...WEEK_PLAN_PRESETS.balanced },
      log: ['W1: technique drills', 'W2: recovery week'],
    }
    const migrated = migrateSave(v5)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    // cohort + rolling season regenerated deterministically from the seed
    expect(migrated.cohort.length).toBe(199)
    expect(migrated.season.length).toBeGreaterThan(0)
    const maxWeek = Math.max(...migrated.season.map((e) => e.week))
    expect(maxWeek - migrated.week).toBeGreaterThanOrEqual(26)
    // old log lines become info events, in order; the log field is gone
    const infoTexts = migrated.events.filter((e) => e.type === 'info').map((e) => e.text)
    expect(infoTexts).toEqual(['W1: technique drills', 'W2: recovery week'])
    expect('log' in migrated).toBe(false)
    expect(migrated.results).toEqual([])
    expect(migrated.entries).toEqual([])
    expect(typeof migrated.kidRank).toBe('number')
    expect(migrated.nextEventId).toBe(migrated.events.length)
    // profile survives
    expect(migrated.profile.kidName).toBe('Coco')
  })

  it('regenerates the same cohort/season for a given seed across migrations', () => {
    const make = () => migrateSave({
      schemaVersion: 5,
      careerId: 'c-1',
      seed: 'stable-seed',
      week: 10,
      fundsCents: 1_000_00,
      profile: { ...DEFAULT_PROFILE },
      plan: { ...WEEK_PLAN_PRESETS.balanced },
      log: [],
    })
    expect(make().cohort).toEqual(make().cohort)
    expect(make().season).toEqual(make().season)
  })

  it('upgrades a v6 save to v7: kidLastName (deterministic from seed) + prevKidRank default', () => {
    const makeV6 = () => {
      const profile: Record<string, unknown> = { ...DEFAULT_PROFILE, kidName: 'Mirra' }
      delete profile.kidLastName // v6 profiles had no family name
      return {
        schemaVersion: 6,
        careerId: 'c-v6',
        seed: 'family-name',
        week: 8,
        fundsCents: 3_000_00,
        profile,
        plan: { ...WEEK_PLAN_PRESETS.balanced },
        cohort: [],
        results: [],
        season: [],
        entries: [],
        events: [],
        nextEventId: 0,
        kidRank: 200,
      }
    }
    const migrated = migrateSave(makeV6())
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(typeof migrated.profile.kidLastName).toBe('string')
    expect(migrated.profile.kidLastName.length).toBeGreaterThan(0)
    expect(migrated.prevKidRank).toBeNull()
    // deterministic: the same seed backfills the same surname across independent migrations
    expect(migrateSave(makeV6()).profile.kidLastName).toBe(migrated.profile.kidLastName)
  })

  it('upgrades a v7 save to v8: pendingTournament defaults to null', () => {
    const v7 = {
      schemaVersion: 7,
      careerId: 'c-v7',
      seed: 'no-reveal-yet',
      week: 20,
      fundsCents: 2_000_00,
      profile: { ...DEFAULT_PROFILE, kidName: 'Naomi', kidLastName: 'Kato' },
      plan: { ...WEEK_PLAN_PRESETS.balanced },
      cohort: [],
      results: [],
      season: [],
      entries: [],
      events: [],
      nextEventId: 0,
      kidRank: 150,
      prevKidRank: 152,
    }
    const migrated = migrateSave(v7)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.pendingTournament).toBeNull()
  })

  it('upgrades a v8 save to v9: birth month backfilled deterministically from the seed', () => {
    const makeV8 = () => {
      // v8 profiles never had birthMonth – strip the DEFAULT_PROFILE static value so this
      // exercises the actual rngFromSeed(seed + ':bm') backfill, not a pass-through default.
      const profile: Record<string, unknown> = { ...DEFAULT_PROFILE, kidName: 'Petra', kidLastName: 'Novak' }
      delete profile.birthMonth
      return {
        schemaVersion: 8,
        careerId: 'c-v8',
        seed: 'birth-month-seed',
        week: 15,
        fundsCents: 4_000_00,
        profile,
        plan: { ...WEEK_PLAN_PRESETS.balanced },
        cohort: [],
        results: [],
        season: [],
        entries: [],
        events: [],
        nextEventId: 0,
        kidRank: 180,
        prevKidRank: 182,
        pendingTournament: null,
      }
    }
    const migrated = migrateSave(makeV8())
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(typeof migrated.profile.birthMonth).toBe('number')
    expect(migrated.profile.birthMonth).toBeGreaterThanOrEqual(1)
    expect(migrated.profile.birthMonth).toBeLessThanOrEqual(12)
    // deterministic: the same seed backfills the same birth month across independent migrations
    expect(migrateSave(makeV8()).profile.birthMonth).toBe(migrated.profile.birthMonth)
  })

  it('backfills DIFFERENT birth months for different seeds (not a constant fallback)', () => {
    const makeV8 = (seed: string) => {
      const profile: Record<string, unknown> = { ...DEFAULT_PROFILE }
      delete profile.birthMonth
      return {
        schemaVersion: 8,
        careerId: `c-${seed}`,
        seed,
        week: 1,
        fundsCents: 0,
        profile,
        plan: { ...WEEK_PLAN_PRESETS.balanced },
        cohort: [],
        results: [],
        season: [],
        entries: [],
        events: [],
        nextEventId: 0,
        kidRank: 200,
        prevKidRank: null,
        pendingTournament: null,
      }
    }
    const months = new Set(
      ['seed-a', 'seed-b', 'seed-c', 'seed-d', 'seed-e', 'seed-f'].map((s) => migrateSave(makeV8(s)).profile.birthMonth),
    )
    expect(months.size).toBeGreaterThan(1)
  })

  it('upgrades a v9 save to v10: bestFinishByTier backfilled from tournament events, rest defaulted', () => {
    const v9 = {
      schemaVersion: 9,
      careerId: 'c-v9',
      seed: 'tier-progress',
      week: 40,
      fundsCents: 6_000_00,
      profile: { ...DEFAULT_PROFILE, kidName: 'Ines', kidLastName: 'Duarte', birthMonth: 7 },
      plan: { ...WEEK_PLAN_PRESETS.balanced },
      cohort: [],
      results: [],
      season: [],
      entries: [],
      events: [
        { id: 0, week: 0, type: 'info', text: 'started', keep: true },
        { id: 1, week: 10, type: 'tournament', text: 'Local Open (clay, W10): Ines – Runner-up (+18 pts)', finishIdx: 1 },
        { id: 2, week: 22, type: 'tournament', text: 'Local Open (hard, W22): Ines – Champion (+30 pts)', finishIdx: 0 },
        { id: 3, week: 30, type: 'tournament', text: 'Regional Championship (grass, W30): Ines – Semifinalist (+28 pts)', finishIdx: 2 },
      ],
      nextEventId: 4,
      kidRank: 60,
      prevKidRank: 65,
      pendingTournament: null,
    }
    const migrated = migrateSave(v9)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    // best (smallest) finish per tier, recovered from the tournament summaries' tier-label prefix
    expect(migrated.bestFinishByTier).toEqual({ local: 0, regional: 2 })
    expect(migrated.lastSeasonSummary).toBeNull()
    expect(migrated.seasonWins).toBe(0)
    expect(migrated.seasonLosses).toBe(0)
  })

  it('upgrades a v10 save to v11: financeWeeks rebuilt from retained finance events', () => {
    const v10 = {
      schemaVersion: 10,
      careerId: 'c-v10',
      seed: 'finance-ledger',
      week: 40,
      fundsCents: 5_000_00,
      profile: { ...DEFAULT_PROFILE, kidName: 'Lea', kidLastName: 'Meyer', birthMonth: 5 },
      plan: { ...WEEK_PLAN_PRESETS.balanced },
      cohort: [],
      results: [],
      season: [],
      entries: [],
      events: [
        { id: 0, week: 0, type: 'info', text: 'started', keep: true }, // non-financial: ignored
        { id: 1, week: 38, type: 'income', category: 'income', text: "Parents' contribution", amountCents: 30_000 },
        { id: 2, week: 38, type: 'expense', category: 'coaching', text: 'Coaching', amountCents: -45_000 },
        { id: 3, week: 39, type: 'expense', category: 'travel', text: 'Travel', amountCents: -9_000 },
        { id: 4, week: 39, type: 'expense', category: 'gear', text: 'Covered', amountCents: 0 }, // $0: skipped
        { id: 5, week: 2, type: 'expense', category: 'coaching', text: 'old', amountCents: -40_000 }, // within week-59 window at week 40, so retained
      ],
      nextEventId: 6,
      kidRank: 70,
      prevKidRank: 72,
      pendingTournament: null,
      bestFinishByTier: {},
      lastSeasonSummary: null,
      seasonWins: 0,
      seasonLosses: 0,
    }
    const migrated = migrateSave(v10)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(Array.isArray(migrated.financeWeeks)).toBe(true)
    // week-ascending, one entry per week that had >=1 nonzero financial event
    expect(migrated.financeWeeks.map((w) => w.week)).toEqual([2, 38, 39])
    // per-category signed sums are rebuilt from the events
    const w38 = migrated.financeWeeks.find((w) => w.week === 38)!
    expect(w38.byCategory).toEqual({ income: 30_000, coaching: -45_000 })
    // the $0 covered gear line-item never created a category entry
    const w39 = migrated.financeWeeks.find((w) => w.week === 39)!
    expect(w39.byCategory).toEqual({ travel: -9_000 })
  })

  it('upgrades a v11 save to v12: condition/injury/injuryHistory/physio backfilled to healthy defaults', () => {
    const v11 = {
      schemaVersion: 11,
      careerId: 'c-v11',
      seed: 'availability',
      week: 40,
      fundsCents: 7_000_00,
      profile: { ...DEFAULT_PROFILE, kidName: 'Nadia', kidLastName: 'Petrova', birthMonth: 4, coachSetup: 'hired' as const },
      plan: { ...WEEK_PLAN_PRESETS.balanced },
      cohort: [],
      results: [{ playerId: 'kid', week: 38, points: 30, tier: 'local' as const }],
      season: [],
      entries: [],
      events: [],
      nextEventId: 0,
      kidRank: 55,
      prevKidRank: 58,
      pendingTournament: null,
      bestFinishByTier: { local: 1 },
      lastSeasonSummary: null,
      seasonWins: 2,
      seasonLosses: 1,
      financeWeeks: [],
    }
    const migrated = migrateSave(structuredClone(v11))
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    // four new fields at their healthy defaults
    expect(migrated.condition).toBe(100)
    expect(migrated.injury).toBeNull()
    expect(migrated.injuryHistory).toEqual([])
    expect(migrated.physioActive).toBe(true) // coachSetup 'hired'
    // everything else identical to the raw v11 save
    expect(migrated.seed).toBe(v11.seed)
    expect(migrated.week).toBe(v11.week)
    expect(migrated.fundsCents).toBe(v11.fundsCents)
    expect(migrated.results).toEqual(v11.results)
    expect(migrated.kidRank).toBe(v11.kidRank)
    // re-running migrateSave on the v12 output changes nothing (idempotent)
    expect(migrateSave(structuredClone(migrated))).toEqual(migrated)
  })

  // ⚠ RE-AIMED BY THE COACH LADDER (v22), and the protected fact is unchanged: a parent-coached
  // career migrates with physio OFF. What moved is where the v12 block LOOKS. It used to ask
  // `profile.coachSetup === 'hired'` and nothing else; v22 renames that field to `coachTier`, so
  // the block now asks the legacy field FIRST and falls back to the new one. The precedence
  // matters here specifically: this fixture is a v11 shape built by spreading today's
  // DEFAULT_PROFILE, so it carries BOTH `coachSetup: 'parent'` and (from the spread)
  // `coachTier: 'middle'` – a hybrid no real save has. The legacy field wins, which is the correct
  // reading for a genuine pre-v22 save and is what keeps this assertion true.
  it('v11 -> v12 physioActive follows the coach setup (parent coach -> false)', () => {
    const v11 = {
      schemaVersion: 11,
      careerId: 'c-v11b',
      seed: 'parent-coach',
      week: 12,
      fundsCents: 3_000_00,
      profile: { ...DEFAULT_PROFILE, coachSetup: 'parent' as const, birthMonth: 8 },
      plan: { ...WEEK_PLAN_PRESETS.balanced },
      cohort: [],
      results: [],
      season: [],
      entries: [],
      events: [],
      nextEventId: 0,
      kidRank: 120,
      prevKidRank: null,
      pendingTournament: null,
      bestFinishByTier: {},
      lastSeasonSummary: null,
      seasonWins: 0,
      seasonLosses: 0,
      financeWeeks: [],
    }
    const migrated = migrateSave(v11)
    expect(migrated.physioActive).toBe(false)
    expect(migrated.condition).toBe(100)
  })

  it('passes a current save through unchanged', () => {
    const current = {
      schemaVersion: SAVE_SCHEMA_VERSION,
      careerId: 'c-s-abc',
      seed: 's',
      week: 1,
      fundsCents: 5,
      profile: { ...DEFAULT_PROFILE, kidName: 'Alexandra', kidLastName: 'Rossi', country: 'RS', birthMonth: 3 },
      plan: { train: 85, rest: 15 },
      cohort: [],
      results: [],
      season: [],
      entries: [],
      events: [],
      nextEventId: 0,
      kidRank: 200,
      prevKidRank: null,
      pendingTournament: null,
      bestFinishByTier: { local: 1 },
      lastSeasonSummary: null,
      seasonWins: 0,
      seasonLosses: 0,
      financeWeeks: [],
    }
    expect(migrateSave(current)).toEqual(current)
  })

  // v33 -> v34: THE ON-RAMP BACK-FILL, and it is EXACT rather than best-effort.
  //
  // A save's `results` are pruned to 52 weeks, so "has she ever been on the ITF table" is not a
  // question the results ledger can answer a year later - which is the whole reason the field has to
  // exist at all. `bestFinishByTier` can: it is a HIGH-WATER MARK that is never pruned, so a tier
  // appears in it if she has ever finished an event there, however long ago. That is the difference
  // between a girl keeping the access she earned and a girl being asked to earn it twice.
  it('v33 -> v34 latches the on-ramp from the never-pruned high-water marks', () => {
    const base = {
      schemaVersion: 33,
      seed: 's',
      week: 400,
      profile: { kidLastName: 'X', background: 'middle', coachTier: 'self', birthMonth: 1, birthDay: 1 },
      results: [], // a year on from anything she played - the ledger has forgotten it
    }
    // She finished J60s once upon a time. The evidence survives, so the door does.
    const played = migrateSave({ ...base, bestFinishByTier: { local: 0, j60: 5 } })
    expect(played.onRampCleared).toEqual({ itf: true, wta: false })

    // She never left the domestic table. Nothing latches, and that is correct - the on-ramp is a
    // rung, not a formality, and a migration must not hand her a table she never reached.
    const homeOnly = migrateSave({ ...base, bestFinishByTier: { local: 0, national: 2 } })
    expect(homeOnly.onRampCleared).toEqual({ itf: false, wta: false })

    // The adult table latches on its own marks, independently of the junior one.
    const pro = migrateSave({ ...base, bestFinishByTier: { j300: 1, w15: 3 } })
    expect(pro.onRampCleared).toEqual({ itf: true, wta: true })
  })

  // Append-only means idempotent: a second pass must not overwrite what the first decided, and a
  // save that already carries the field is left exactly as it is.
  it('v33 -> v34 leaves an existing onRampCleared alone', () => {
    const migrated = migrateSave({
      schemaVersion: 33,
      seed: 's',
      week: 10,
      profile: { kidLastName: 'X', background: 'middle', coachTier: 'self', birthMonth: 1, birthDay: 1 },
      results: [],
      bestFinishByTier: {},
      onRampCleared: { itf: true, wta: true },
    })
    expect(migrated.onRampCleared).toEqual({ itf: true, wta: true })
  })

  // v34 -> v35: THE PERSISTED MAIN POSITION (P3). The migration performs the ONE final probe
  // replay — byte-identical to what every load used to do — and stamps the resulting `{s, n}`
  // into the save, after which the replay never runs again for that career.
  //
  // ⚠ THE PIN BELOW IS THE TRIPWIRE, and it is the whole reason this test reads a REAL fixture
  // rather than a hand-shaped payload. The migration replays under CURRENT `tickWeek`; if a future
  // change silently adds, removes or reorders a MAIN-stream draw, the replayed position for this
  // fixture MOVES — and this frozen expectation is what makes that loud instead of silent. A red
  // here after an engine change means: the weekly draw budget moved, and every v34-or-older career
  // will now be stamped with a position computed under the NEW budget (the recovery-fallback
  // best-effort answer, exactly the status quo every pre-v35 load lived with). Decide consciously,
  // then re-pin.
  it('v34 -> v35 stamps the persisted MAIN position (frozen pin = the replay tripwire)', () => {
    const raw = JSON.parse(readFileSync(fileURLToPath(new URL('./fixtures/saves/v34.json', import.meta.url)), 'utf8'))
    const migrated = migrateSave(raw)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    // seed golden-v27, week 60: the replay's own output, frozen the day v35 shipped. The count
    // reads straight off the tick's budget — 60 × (3 base + 4×199 drift) + 2 sponsor hits = 47942.
    expect(migrated.rngMain).toEqual({ s: 1815598547, n: 47942 })
    expect(mainStateConsistent(migrated.seed, migrated.rngMain)).toBe(true)
  })

  it('v34 -> v35 is idempotent: a stamped position is never recomputed', () => {
    const raw = JSON.parse(readFileSync(fileURLToPath(new URL('./fixtures/saves/v34.json', import.meta.url)), 'utf8'))
    const once = migrateSave(raw)
    const again = migrateSave(JSON.parse(JSON.stringify(once)))
    expect(again.rngMain).toEqual(once.rngMain)
    expect(again).toEqual(once)
  })

  // Corruption is CAUGHT AT LOAD, not at migration: `migrateSave` deliberately does not police a
  // v35 payload (append-only blocks upgrade versions; they do not audit the current one). The
  // redundancy check the worker runs is what trips — pinned here so the recovery trigger's
  // sensitivity is a tested fact rather than a comment.
  it('a hand-corrupted v35 position fails the redundancy check (the worker recovery trigger)', () => {
    const raw = JSON.parse(readFileSync(fileURLToPath(new URL('./fixtures/saves/v34.json', import.meta.url)), 'utf8'))
    const migrated = migrateSave(raw)
    expect(mainStateConsistent(migrated.seed, { s: (migrated.rngMain.s + 1) | 0, n: migrated.rngMain.n })).toBe(false)
    expect(mainStateConsistent(migrated.seed, { s: migrated.rngMain.s, n: migrated.rngMain.n + 1 })).toBe(false)
  })

  // ⭐⭐ THE SCHEMA COLLISION'S OWN PIN – 28.08, AND IT IS THE REASON THE RENUMBER WAS URGENT RATHER
  // THAN TIDY. Two schema moves were built the same day off the same base and BOTH numbered
  // themselves v64: round 27 #6's `college.callUpReveal`, which reached `main` as PR #112, and the
  // champion tally's `world.fieldSeasonTitles`, which was cut from round 28's ledger branch while
  // that branch still read 63 and so could not see `main` at all. Each did the full three-part move
  // correctly against the only chain it could see. The result was two different v64 schemas, and a
  // save written by one could not be read by the other – silently, because the version numbers
  // agreed. The tally was renumbered to 65 and its migration moved BEHIND the reveal in the
  // append-only chain.
  //
  // ⚠ WHAT THIS CASE EXISTS TO CATCH is the renumber's one real failure mode: a step left on its OLD
  // guard (`v === 63`) after the version above it moved, so the chain stops at 64 and a v63 save
  // either throws or arrives a key short. Both back-fills are observable in ONE fixture – `v63.json`
  // carries a non-null `college` with no `callUpReveal`, and no `fieldSeasonTitles` – so this walks
  // the whole ladder in a single call and asserts BOTH effects rather than the version number at the
  // end. Mutate either guard and it goes red; mutate the peel boundary in
  // `careerHashAtSchema` in `tests/coachTravelEdgeFixtures.ts` and the frozen careers go red beside it.
  it('⭐⭐ v63 -> v64 -> v65: a v63 save walks BOTH of the day\'s schema moves and arrives correct', () => {
    const raw = JSON.parse(readFileSync(fileURLToPath(new URL('./fixtures/saves/v63.json', import.meta.url)), 'utf8'))
    expect(raw.schemaVersion, 'the fixture is a genuine v63 save').toBe(63)
    expect(raw.college, "v63.json holds a college state, so v64's back-fill is observable here").not.toBeNull()
    expect('callUpReveal' in raw.college, "...and it predates v64's field").toBe(false)
    expect('fieldSeasonTitles' in raw, "...and it predates v65's key").toBe(false)

    const migrated = migrateSave(raw)

    // The chain runs to the END and not to 64 – which is the whole of what the renumber had to keep.
    expect(migrated.schemaVersion, 'the chain reaches the current schema').toBe(SAVE_SCHEMA_VERSION)
    // ⚠ RE-AIMED AT v66 (29.08, round 29 part four P7 – the 'business' category), NOT WEAKENED.
    // The claim this line was cut for survives intact one clause down: the chain must run PAST the
    // colliding 64, and a chain that stopped there would now miss twice. The pin follows the
    // ladder's head exactly as the golden-saves guard forces a fixture to.
    // ⚠ RE-AIMED AGAIN AT v67 (30.08, round 30 item 25 – the units and name back-fills moved off the
    // shipped v66 step), for the same reason and with the same claim: the chain must run past the
    // colliding 64, and it now has two more rungs to cross before it arrives.
    // ⚠ AND AT v68 (31.08, round 31 #10/#13 – the per-career age curve), for the third time and with
    // the claim unchanged: one more rung between the collision and the head.
    // ⚠ AND AT v69 (01.09, round 32 #4 – the brand's slow stock pinned at the week it arrived), for
    // the fourth time and with the claim unchanged again: the chain must run PAST the colliding 64,
    // and it now has three more rungs to cross before it arrives.
    // ⚠ AND AT v70 (03.09, round 35 #14 – the published draw becomes a fact), for the FIFTH time and
    // with the claim unchanged once more: the chain must run PAST the colliding 64, and it now has
    // four more rungs to cross before it arrives. The pin follows the ladder's head; it is the head
    // that moved, not the claim.
    expect(SAVE_SCHEMA_VERSION, 'and the current schema is 70 – past the colliding 64, through 65').toBe(70)

    // v64's step ran: the reveal back-fills NULL, which is the TRUE value and not a placeholder – no
    // save written before it can be holding a question in front of the player.
    expect(migrated.college, 'the college state survives the walk').not.toBeNull()
    expect(migrated.college!.callUpReveal, 'v64 ran: the reveal back-fills null').toBeNull()
    expect('callUpReveal' in migrated.college!, 'and the KEY is present, not merely absent-and-undefined').toBe(true)

    // ...and v65's step ran on top of it, on the same payload rather than instead of it.
    expect(migrated.fieldSeasonTitles, 'v65 ran: the champion tally back-fills empty').toEqual({})

    // ⚠ AND NEITHER STEP TOUCHED THE OTHER'S NEIGHBOUR. `fieldSeasonPoints` is v65's twin one field
    // over and was already on this save; a back-fill that reached for the wrong key would show here.
    expect(migrated.fieldSeasonPoints, "v65's twin is untouched").toEqual(raw.fieldSeasonPoints)
  })

  it('...and the whole 63 -> 65 walk is idempotent: re-migrating changes nothing', () => {
    const raw = JSON.parse(readFileSync(fileURLToPath(new URL('./fixtures/saves/v63.json', import.meta.url)), 'utf8'))
    const once = migrateSave(raw)
    const again = migrateSave(JSON.parse(JSON.stringify(once)))
    expect(again).toEqual(once)
  })

  // ⭐ THE OTHER HALF OF THE APPEND-ONLY CLAIM, and the one a version collision breaks first: a save
  // that has ALREADY answered v64's question must not have it answered again. The fixture on disk
  // carries `callUpReveal: null`, which is indistinguishable from a fresh back-fill – so the arm is
  // built with a REAL reveal on it. If v65's step had kept the old `v === 63` guard, or if the two
  // steps had been placed beside each other rather than in order, this open reveal would be wiped
  // and a career would resume in front of a tie it had already been asked about.
  it('⭐ a v64 save runs only the SECOND step: an open reveal survives the walk to v65', () => {
    const raw = JSON.parse(readFileSync(fileURLToPath(new URL('./fixtures/saves/v64.json', import.meta.url)), 'utf8'))
    expect(raw.schemaVersion, 'the fixture is a genuine v64 save').toBe(64)
    expect('fieldSeasonTitles' in raw, "...and it predates v65's key").toBe(false)
    raw.college.callUpReveal = { week: 240, revealed: 1 }

    const migrated = migrateSave(raw)

    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.college!.callUpReveal, "v64's step did NOT re-run over an answered save").toEqual({
      week: 240,
      revealed: 1,
    })
    expect(migrated.fieldSeasonTitles, "v65's step DID run").toEqual({})
  })

  // ⭐ ROUND 29 PART THREE P1 – v66's SECOND HALF: «моторка $2.4М – давай переделаем на парусную
  // яхту пожалуйста». The rename rides the SAME unshipped v66 step as the 'business' widening
  // (main is at 65, so amending it is not editing a shipped migration – the reasoning is on the
  // step itself). The owning save is built IN MEMORY on the committed v65 fixture, the same way
  // the v64 arm above builds its open reveal: the fixture on disk stays byte-identical and the
  // rename is still observable.
  //
  // ⚠⚠ THE PARENTHETICAL ABOVE IS KEPT AS THE RECORD OF A PREMISE THAT EXPIRED, and its conclusion
  // held: main is at 66 now, and the rename is INSIDE what shipped (eaf61759, merged by PR #114),
  // so it stays on the v66 step and this test still measures a v65 -> v66 effect. Its two NEIGHBOURS
  // in that step did not ship and moved to v67 – see the walk below and round 30 item 25.
  it('⭐ v65 -> v66 renames an owned boat-motor to boat-sail and touches nothing else on the row', () => {
    const raw = JSON.parse(readFileSync(fileURLToPath(new URL('./fixtures/saves/v65.json', import.meta.url)), 'utf8'))
    expect(raw.schemaVersion, 'the fixture is a genuine v65 save').toBe(65)
    // A commissioned motor boat mid-wait: the delivery clock is the field a sloppy rename loses.
    raw.assets = [
      { id: 'boat-motor', boughtWeek: 300, paidCents: 2_400_000_00, valueCents: 2_400_000_00, basisCents: 2_400_000_00, basisWeek: 378, readyWeek: 378 },
      { id: 'deposit', boughtWeek: 200, paidCents: 50_000_00, valueCents: 51_000_00 },
    ]

    const migrated = migrateSave(raw)

    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    const boat = migrated.assets!.find((a) => a.id === 'boat-sail')!
    expect(boat, 'the row survived under the new id').toBeDefined()
    expect(migrated.assets!.some((a) => a.id === 'boat-motor'), 'and the old id is gone').toBe(false)
    // Every other field rides untouched – the family paid for this boat and is still waiting for it.
    expect(boat.paidCents).toBe(2_400_000_00)
    expect(boat.valueCents).toBe(2_400_000_00)
    expect(boat.boughtWeek).toBe(300)
    expect(boat.basisWeek).toBe(378)
    expect(boat.readyWeek, 'the delivery clock is not reset').toBe(378)
    // ...and the neighbour is not renamed by an over-wide match.
    expect(migrated.assets!.find((a) => a.id === 'deposit'), 'the deposit is untouched').toBeDefined()
    // Idempotent: a second pass finds no boat-motor and changes nothing.
    const again = migrateSave(JSON.parse(JSON.stringify(migrated)))
    expect(again.assets).toEqual(migrated.assets)
  })

  // ⭐⭐⭐ ROUND 30 #14 – legacy rows become UNITS, and the conversion has to preserve the family's
  // history rather than reset it.
  //
  // ⚠⚠ RE-AIMED FROM «v65 -> v66» TO «v65 -> ... -> v67» (30.08, round 30 item 25), NOT WEAKENED
  // AND NOT NARROWED BY ONE ASSERTION. The step this measures moved off v66 when PR #114 shipped
  // v66 to main; a v65 save still reaches it, because the walk now runs 65 -> 66 -> 67 in the one
  // `migrateSave` call and this arm asserts the ARRIVAL rather than the rung. What it can no longer
  // see on its own is the case the move exists for – a save that ENTERS at 66 – so that arm is a
  // new test below («⭐⭐⭐ THE DEFECT ITSELF»), and this one keeps the arithmetic.
  //
  // THE OWNER: «Стоимость активов будет рассчитываться исходя из стоимости долей. Зашёл, когда доля
  // стоила 4к…» – so what the row must carry forward is the price they came in at, and the only
  // honest way to recover it from a v65 row is to divide the basis by the price of ITS OWN week.
  //
  // ⚠ MUTATION-VERIFIED, three, each applied alone to `migrations.ts` and reverted:
  //   * `unitPriceCents(seed, basisWeek, item)` -> `(seed, 0, item)` (converted at week zero)
  //     -> the «worth the same cents» arm RED, and the average-price arm with it.
  //   * `basisCents ?? paidCents` -> `paidCents` (the top-up forgotten) -> the topped-up row's two
  //     arms RED and the never-topped-up row's green, which is exactly the split that says the
  //     fallback is live in both directions.
  //   * `if (… a.units !== undefined) continue` deleted -> ⚠⚠ NOTHING, ON THE WHOLE MIGRATION AND
  //     GOLDEN CORPUS, and that is a finding rather than a hole: the clause could not be false, so
  //     it was a DEAD GUARD and it is gone from the engine. A second `migrateSave` enters at v67 and
  //     never reaches the block, and no v66 save can carry a `units` key because the field does not
  //     exist at v66 either – main's shipped v66 step writes no field beyond the yacht's id, which
  //     was RE-CHECKED against `origin/main` when the step moved rather than carried over on faith.
  //     The idempotence arm below still stands – it is carried by `if (v === 66)`.
  //   * `if (!item || item.unitBaseCents === undefined) continue` -> `if (!item) continue`
  //     -> the car's «untouched» line RED and the yacht-rename arm with it (a commissioned boat
  //     would gain units and be re-priced off a market it has nothing to do with).
  it('⭐⭐ a v65 save walks to v67 and its owned fund converts to UNITS at the price of its own basis week', () => {
    const raw = JSON.parse(readFileSync(fileURLToPath(new URL('./fixtures/saves/v65.json', import.meta.url)), 'utf8'))
    expect(raw.schemaVersion, 'the fixture is a genuine v65 save').toBe(65)
    const seed = raw.seed as string
    const week = raw.week as number
    const FUND = shopItem('index-fund')!
    const DEPOSIT = shopItem('deposit')!
    // Two shapes, and both are shapes a real v65 save can hold: one holding that was TOPPED UP (so
    // it carries the rebased pair) and one that never was (so it carries neither).
    raw.assets = [
      { id: 'index-fund', boughtWeek: 100, paidCents: 80_000_00, valueCents: 123_456_00, basisCents: 110_000_00, basisWeek: 260 },
      { id: 'deposit', boughtWeek: 200, paidCents: 50_000_00, valueCents: 51_000_00 },
      // ⚠ AND ONE THAT MUST NOT BE TOUCHED AT ALL: a car is not held in units, so a step that
      // converted every row would give it a `units` key and price it off a market it has nothing to
      // do with. The absence below is the assertion.
      { id: 'car-good', boughtWeek: 150, paidCents: 110_000_00, valueCents: 91_091_00 },
    ]

    const migrated = migrateSave(JSON.parse(JSON.stringify(raw)))

    const fund = migrated.assets!.find((a) => a.id === 'index-fund')!
    const dep = migrated.assets!.find((a) => a.id === 'deposit')!
    const car = migrated.assets!.find((a) => a.id === 'car-good')!

    // ⭐ THE CONVERSION ITSELF: the REBASED basis over the price of the week it was struck.
    expect(fund.units!).toBeCloseTo(110_000_00 / unitPriceCents(seed, 260, FUND), 8)
    // ...and the one that was never topped up falls back to what it paid, at the week it bought.
    expect(dep.units!).toBeCloseTo(50_000_00 / unitPriceCents(seed, 200, DEPOSIT), 8)
    // ⚠ THE FIELDS THE REBASE OWNED ARE GONE FROM BOTH – there is no rebase for them to feed.
    expect((fund as { basisCents?: number }).basisCents).toBeUndefined()
    expect(fund.basisWeek).toBeUndefined()
    // ⚠ AND THE CAR IS UNTOUCHED, key for key.
    expect(car.units).toBeUndefined()
    expect(car.valueCents).toBe(91_091_00)

    // ⭐⭐ HONEST, NOT MERELY TOTAL: the holding is worth the same cents this week that the OLD model
    // would have shown, so the career's history survives the conversion. That is the whole claim of
    // the step, and it is stated here as the round 29 arithmetic written out longhand rather than as
    // a number copied off a run.
    const oldWorth = Math.round(
      110_000_00 *
        Math.pow(1 + FUND.annualRateBps / 10_000, (week - 260) / WEEKS_PER_YEAR) *
        (marketIndex(seed, week, FUND.volBps!) / marketIndex(seed, 260, FUND.volBps!)),
    )
    expect(Math.round(fund.units! * unitPriceCents(seed, week, FUND))).toBe(oldWorth)
    // ⭐⭐ AND THE AVERAGE PRICE THE SCREEN WILL NOW PRINT IS THE COST BASIS OVER THE UNITS, which on
    // the row that was NEVER topped up is exactly the price it paid on its own week – the sharpest
    // form of «the entry price survived the conversion», and it is only sayable on that row.
    expect(dep.paidCents / dep.units!).toBeCloseTo(unitPriceCents(seed, 200, DEPOSIT), 6)
    // ⚠⚠ ON THE TOPPED-UP ROW IT IS DELIBERATELY **BELOW** EVERY PRICE THE CAREER SAW, and that is
    // right rather than a rounding artefact: a v65 rebase folded accrued GAIN into `basisCents`
    // (110k of holding on 80k of cash), so the units recovered from it are the units the family
    // really holds while `paidCents` is the cash they really spent. Cost basis over units is what a
    // broker's «average price» means, and a family in profit is under today's price by construction.
    // The equivalence is the assertion: they are below it exactly when they are up.
    const avg = fund.paidCents / fund.units!
    const worthNow = Math.round(fund.units! * unitPriceCents(seed, week, FUND))
    expect(avg < unitPriceCents(seed, week, FUND)).toBe(worthNow > fund.paidCents)
    expect(worthNow, 'and this fixture really is a family in profit').toBeGreaterThan(fund.paidCents)

    // Idempotent: a second pass leaves the units exactly where they are.
    const again = migrateSave(JSON.parse(JSON.stringify(migrated)))
    expect(again.assets).toEqual(migrated.assets)
  })

  it('⚠ a v65 save with a malformed row still migrates – the null check both asset loops carry', () => {
    // `Array.isArray` says nothing about what is IN the array. Neither of the asset loops – v66's
    // rename or v67's units and names – may throw on a null row, or one corrupted entry takes the
    // whole career down, and this is the arm that makes those `typeof a === 'object'` clauses live
    // rather than habit. ⚠ RE-AIMED, NOT WEAKENED (30.08): the two loops are now on different rungs,
    // so a v65 save crosses BOTH of them here and the arm covers strictly more than it did.
    const raw = JSON.parse(readFileSync(fileURLToPath(new URL('./fixtures/saves/v65.json', import.meta.url)), 'utf8'))
    raw.assets = [null, { id: 'deposit', boughtWeek: 10, paidCents: 20_000_00, valueCents: 20_500_00 }]
    const migrated = migrateSave(raw)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.assets!.find((a) => a?.id === 'deposit')!.units).toBeGreaterThan(0)
  })

  // ⭐⭐⭐ THE DEFECT ITSELF, REPRODUCED – ROUND 30 ITEM 25. A SAVE THAT ENTERS AT v66.
  //
  // ⚠⚠ THIS IS THE ONE ARM NO TEST IN THIS FILE COULD MAKE BEFORE, and its absence is the whole
  // reason the defect shipped as far as it did. Every arm above starts at v65 or lower, so every
  // one of them crossed the units and name back-fills no matter WHICH rung they sat on – a step
  // wrongly numbered v66 and a step correctly numbered v67 are indistinguishable from below. The
  // save that can tell them apart is one that arrives ALREADY at 66, and until PR #114 shipped v66
  // to main no such save could exist. Now they all do: main declares 66, so every career in play is
  // one of these.
  //
  // THE SHAPE IS THE OWNER'S OWN, READ OFF HIS SAVE AND RETYPED HERE – never copied, never a
  // fixture (`tools/e2e-fixtures.ts`: «THE OWNER'S OWN SAVE IS NEVER A FIXTURE»). What it carries,
  // and what each field is here to catch:
  //   * `schemaVersion: 66` – the gate. This is the field that made `migrateSave` do nothing.
  //   * an `index-fund` and a `deposit` with `basisCents`/`basisWeek` and NO `units` – v65 keys
  //     that shipped WITHOUT a version move, so a v66 save carries them, so `assetWorthCents`'s
  //     `units × price` reads `undefined` on a career that had done nothing wrong.
  //   * a `merch-brand` with no `name`.
  //
  // ⚠ MUTATION-VERIFIED, AND THE NUMBERS ARE THE POINT (30.08). The v67 body was grafted back onto
  // `if (v === 65)` and the v67 step left empty – the defect exactly as it stood – and both files
  // re-run:
  //
  //   1 FAILED  – this test, at the first units assertion: «expected undefined to be close to
  //               59.869…». `undefined` is what `assetWorthCents` would have multiplied by a price.
  //   102 PASSED – EVERY OTHER ARM, this file's v65-entry tests and the whole golden-save corpus
  //               included.
  //
  // ⚠⚠ THAT 102 IS THE FINDING, not the 1. A suite this size stayed green over a migration that
  // silently skipped itself on every save in play, because nothing in it entered at 66. One test
  // that starts where the player starts is worth more here than any number of tests that start
  // below the rung being measured.
  it('⭐⭐⭐ a v66 save – basisCents, no units, an unnamed brand – migrates to v67 and comes out correct', () => {
    const raw = JSON.parse(readFileSync(fileURLToPath(new URL('./fixtures/saves/v66.json', import.meta.url)), 'utf8'))
    expect(raw.schemaVersion, 'the fixture is a genuine v66 save – main ships this version').toBe(66)
    const seed = raw.seed as string
    const week = raw.week as number
    const FUND = shopItem('index-fund')!
    const DEPOSIT = shopItem('deposit')!
    raw.profile.kidName = 'Alice'
    raw.profile.kidLastName = 'Fisher'
    raw.assets = [
      { id: 'index-fund', boughtWeek: 676, paidCents: 554_807_63, valueCents: 767_797_61, basisCents: 767_797_61, basisWeek: 884 },
      { id: 'deposit', boughtWeek: 700, paidCents: 500_000_00, valueCents: 609_695_81, basisCents: 609_695_81, basisWeek: 884 },
      { id: 'merch-brand', boughtWeek: 782, paidCents: 250_000_00, valueCents: 250_000_00 },
    ]

    const migrated = migrateSave(JSON.parse(JSON.stringify(raw)))

    // ⚠ THE HEAD, NOT THE LITERAL 67, AND THE RE-AIM IS THE POINT OF THE CASE. What this line claims
    // is that a v66 save walks the WHOLE ladder – the defect it was cut for was a step that never ran
    // – so it must follow the head rather than be repinned every time a rung is added (v68 added one).
    // The v67-specific claims are the `units` / `name` assertions below, and they are untouched.
    expect(migrated.schemaVersion, 'the step RAN – this is the assertion the defect fails').toBe(SAVE_SCHEMA_VERSION)
    expect(SAVE_SCHEMA_VERSION, 'and the ladder head is past the shipped v66').toBeGreaterThan(66)

    const fund = migrated.assets!.find((a) => a.id === 'index-fund')!
    const dep = migrated.assets!.find((a) => a.id === 'deposit')!
    const brand = migrated.assets!.find((a) => a.id === 'merch-brand')!

    // ⭐ UNITS APPEAR, AND AT THE ROW'S OWN `basisWeek` – not at today's price. Both rows were
    // rebased in the same week, so a step that priced at `week` instead would move both together
    // and still look plausible; the arithmetic below is what refuses it.
    expect(fund.units!).toBeCloseTo(767_797_61 / unitPriceCents(seed, 884, FUND), 8)
    expect(dep.units!).toBeCloseTo(609_695_81 / unitPriceCents(seed, 884, DEPOSIT), 8)
    expect(fund.units!, 'a real holding, not a zero').toBeGreaterThan(0)
    // ⚠ AND THE OLD KEYS ARE GONE – this is the last version that can read them.
    expect((fund as { basisCents?: number }).basisCents).toBeUndefined()
    expect(fund.basisWeek).toBeUndefined()
    expect((dep as { basisCents?: number }).basisCents).toBeUndefined()

    // ⭐⭐ THE ENTRY PRICE AND THE GAIN ARE PRESERVED RATHER THAN RESET, which is the claim the whole
    // step is FOR, written out as the old model's own arithmetic rather than as a number off a run.
    for (const [row, item, basis, bWeek] of [
      [fund, FUND, 767_797_61, 884],
      [dep, DEPOSIT, 609_695_81, 884],
    ] as const) {
      const oldWorth = Math.round(
        basis *
          Math.pow(1 + item.annualRateBps / 10_000, (week - bWeek) / WEEKS_PER_YEAR) *
          (item.volBps === undefined
            ? 1
            : marketIndex(seed, week, item.volBps) / marketIndex(seed, bWeek, item.volBps)),
      )
      expect(Math.round(row.units! * unitPriceCents(seed, week, item))).toBe(oldWorth)
    }

    // ⭐ THE BRAND GAINS A NAME THE GAME ITSELF WOULD HAVE SUGGESTED – its own first option, and
    // never a string the migration invented. Asserted as an IDENTITY with the shop's list rather
    // than as the literal 'AF', so a change to the suggestion rules moves both together or fails.
    expect(brand.name, 'the brand is named').toBeTruthy()
    expect(brand.name).toBe(nameSuggestionsFor('Alice', 'Fisher', 'business', null)[0])
    expect(brand.name, "...and that really is her initials, so the assertion above is not vacuous").toBe('AF')

    // ⚠ IDEMPOTENT: a second pass enters at 67 and changes nothing, units and name included.
    const again = migrateSave(JSON.parse(JSON.stringify(migrated)))
    expect(again.assets).toEqual(migrated.assets)
  })

  // ⭐⭐ THE WALK, END TO END: 63 -> 64 -> 65 -> 66 -> 67 IN ONE CALL, with an effect asserted at
  // EVERY rung so a step left on a stale guard cannot hide behind its neighbours. The v63 fixture is
  // the only one old enough to cross all four, and the asset rows are built in memory on it – the
  // fixture on disk stays byte-identical, the same way the v64 and v65 arms above build theirs.
  //
  // ⚠ AND THE ORDER IS PART OF THE CLAIM, not just the arrival: the `boat-motor` row must be renamed
  // by v66 BEFORE v67 looks at it, which is the coupling the two steps used to get for free by
  // sharing one block. Reversing the two blocks in migrations.ts leaves this green (a boat is in no
  // nameable family and has no `unitBaseCents`, so neither step can touch it either way) – which is
  // worth knowing rather than worth hiding: the dependency is REAL in the source and INERT in the
  // data, and the assertion below states the arrival it guarantees.
  it('⭐⭐ the whole 63 -> 64 -> 65 -> 66 -> 67 walk runs in one call, and is idempotent', () => {
    const raw = JSON.parse(readFileSync(fileURLToPath(new URL('./fixtures/saves/v63.json', import.meta.url)), 'utf8'))
    expect(raw.schemaVersion, 'the fixture is a genuine v63 save').toBe(63)
    raw.profile.kidName = 'Alice'
    raw.profile.kidLastName = 'Fisher'
    raw.assets = [
      { id: 'boat-motor', boughtWeek: 300, paidCents: 2_400_000_00, valueCents: 2_400_000_00, readyWeek: 378 },
      { id: 'index-fund', boughtWeek: 100, paidCents: 80_000_00, valueCents: 123_456_00, basisCents: 110_000_00, basisWeek: 260 },
      { id: 'merch-brand', boughtWeek: 320, paidCents: 250_000_00, valueCents: 250_000_00 },
      { id: 'academy-land', boughtWeek: 330, paidCents: 400_000_00, valueCents: 400_000_00 },
      { id: 'academy-courts', boughtWeek: 340, paidCents: 600_000_00, valueCents: 600_000_00 },
    ]

    const migrated = migrateSave(JSON.parse(JSON.stringify(raw)))

    // ⚠ THE HEAD, NOT A LITERAL – see the note on the v66 case above. The per-rung claims below are
    // what this case is actually about, and every one of them is unchanged.
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    // v64 ran – the reveal back-fills null, and the KEY is present rather than absent-and-undefined.
    expect('callUpReveal' in migrated.college!).toBe(true)
    // v65 ran – the champion tally back-fills empty.
    expect(migrated.fieldSeasonTitles).toEqual({})
    // v66 ran – the boat is a yacht and its delivery clock survived the crossing.
    expect(migrated.assets!.some((a) => a.id === 'boat-motor')).toBe(false)
    const boat = migrated.assets!.find((a) => a.id === 'boat-sail')!
    expect(boat.readyWeek, 'v66 renamed the row rather than rebuilding it').toBe(378)
    expect(boat.units, 'and v67 left the boat alone – it is not held in units').toBeUndefined()
    // v67 ran – units on the fund, a name on the brand.
    expect(migrated.assets!.find((a) => a.id === 'index-fund')!.units).toBeGreaterThan(0)
    expect(migrated.assets!.find((a) => a.id === 'merch-brand')!.name).toBe('AF')
    // ⚠ ...and the ACADEMY takes the brand's name, because his own first academy option is the brand
    // they already built – so v67's two families ran in the right order, not merely both.
    expect(migrated.assets!.find((a) => a.id === 'academy-land')!.name).toBe('AF')
    // ⚠ FIRST ROW OF THE FAMILY ONLY: a two-stage academy comes out of this with ONE name.
    expect(migrated.assets!.find((a) => a.id === 'academy-courts')!.name).toBeUndefined()

    // Idempotent across the whole ladder, not merely at its head.
    const again = migrateSave(JSON.parse(JSON.stringify(migrated)))
    expect(again).toEqual(migrated)
  })

  it('rejects saves from a future schema', () => {
    expect(() => migrateSave({ schemaVersion: 999, seed: 's', week: 1 })).toThrow(/newer/)
  })

  it('rejects corrupted saves', () => {
    expect(() => migrateSave({ schemaVersion: SAVE_SCHEMA_VERSION })).toThrow(/corrupted/i)
  })
})
