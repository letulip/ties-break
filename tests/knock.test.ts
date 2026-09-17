// =================================================================================================
// W4 — THE KNOCK (engine/knock.ts + world.ts rollKnock/decideKnock/expireKnock)
// =================================================================================================
//
// The owner, 30.07, asking a SECOND time: «хочу вернуться к явно пропущенному пункту 3 из последнего
// раунда: Чтобы тренировочные недели не просто скипались нужно всё-таки видимо пришло время сделать
// какое-то пошаговый события Что происходит на этих неделях когда нет матчей а только тренировки».
//
// W2 gave the ordinary week a VOICE. This is the half W2 deferred — «any choice with a cost». She
// comes off court sore, and the parent rests it or sends her back out.
//
// SIX THINGS ARE PINNED HERE, and the first two are the ones that block a merge:
//
//   1. ⚠ ZERO MAIN-STREAM DRAWS. The knock draws INSIDE the weekly tick, which is exactly the shape
//      that can perturb the weekly sequence — so it is proved PAIRWISE here (v35 regime: an
//      answering career against the unanswered baseline, byte-identical MAIN taps; the one
//      documented capture lives in tests/condition.test.ts B1), and the sub-stream keys are held
//      to a closed allowlist so a fourth stream cannot be added without reading this.
//   2. THE ADVANCE IS BLOCKED, NOT MERELY HALTED. This is the feature: the complaint was that weeks
//      «просто скипались», and a stop that can be dismissed and re-pressed is a notification.
//   3. BOTH BRANCHES COST, AND NEITHER IS FREE PROGRESS. The anti-farming argument in
//      engine/knock.ts, turned into assertions: resting gives up development at EVERY plan setting,
//      pushing multiplies the injury threshold, and the rest branch's condition credit is worth less
//      than what a Light plan hands out for nothing.
//   4. THE ARRIVAL IS DRIVEN BY THE PLAYER'S OWN PLAN. Grind gets knocks, Light almost never does.
//   5. THE ACCUMULATING THREAD. Pushing puts that part of her body on the record; the next knock
//      lands there and bites harder; and a knock that breaks down breaks down on that part.
//   6. THE VOICE. Short dash, no Cyrillic, third person, and the coach's read carries NO NUMBER.
import { describe, expect, it } from 'vitest'
import { worldSource } from './worldSource'
import { readFileSync } from 'node:fs'
import {
  advanceWeeks,
  createWorld,
  decideKnock,
  expireKnock,
  injuryTau,
  rollInjury,
  KNOCK_HISTORY_MAX,
  ordinaryTrainingWeek,
  pendingKnock,
  pendingBirthday,
  birthdayOfferFor,
  chooseGift,
  rollKnock,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import {
  buildKnockPrompt,
  drawKnock,
  knockCause,
  knockChance,
  knockLive,
  knockRestWeek,
  knockTauFactor,
  knockUntilWeek,
  offCooldown,
  pushedParts,
  KNOCK_BASE_CHANCE,
  KNOCK_CHANCE_CAP,
  KNOCK_COOLDOWN_WEEKS,
  KNOCK_PUSH_TAU,
  KNOCK_PUSH_WEEKS,
  KNOCK_REPEAT_TAU,
  KNOCK_REST_CONDITION,
  KNOCK_REST_GROWTH,
} from '../src/engine/knock'
import { rngFromSeed } from '../src/engine/rng'
import { migrateSave } from '../src/engine/migrations'
import { ECONOMY } from '../src/engine/economy'
import { restRecoveryBonus, SAVE_SCHEMA_VERSION } from '../src/engine/world'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS, type Knock, type PlayerProfile, type WeekPlan } from '../src/shared/protocol'
import { region, scriptCodeOf } from './helpers/source'
import { fnv1a } from './helpers/hash'

const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8')

/** ⭐ ROUND 43 #10 – the plan `buildKnockPrompt` is asked for now. Balanced is the pivot
 *  (`KNOCK_TRAIN_PIVOT` quotes its `train` as a number), so its load term is exactly zero and every
 *  assertion in this file that predates the cause reads the same prompt it always did. */
const BALANCED = WEEK_PLAN_PRESETS.balanced
/** ...and the three the voice sweep runs over, because `cause` is the one field on this prompt that
 *  branches on the plan: grind and light are the two signs of the load term, balanced is the zero. */
const VOICE_PLANS: readonly WeekPlan[] = [WEEK_PLAN_PRESETS.grind, BALANCED, WEEK_PLAN_PRESETS.light]

/** Comments stripped, so the module's own header may DOCUMENT the rules the pins below enforce.
 *
 *  ⚠ `scriptCodeOf`, NOT the house `codeOf` – and this file is the reason the two exist separately.
 *  It reads mostly `.ts` sources and deliberately does NOT want `<!-- -->` taken out everywhere:
 *  the one `.vue` call site (the KnockDialog markup, below) applies that strip ITSELF, where the
 *  choice is visible. Widening it here would silently shrink what the sim.worker pin below can see
 *  (`.not.toMatch(/world\.knock\s*=/)`), and a negative source pin that stops seeing its target goes
 *  GREEN. See tests/helpers/source.ts. */
function codeOf(path: string): string {
  return scriptCodeOf(read(path))
}

/** Walk a career, answering every knock the way a player does. Returns what happened, week by week.
 *
 *  ⚠ SELF-COACHED, ADDED BY THE LOAD SLICE. `DEFAULT_PROFILE.coachTier` is 'middle', so this used to
 *  build a HIRED career - and a hired coach now answers the routine knocks himself, leaving the parent
 *  only the escalated ones. Every test that reaches for this helper is about the PARENT answering (its
 *  name says so, and `answered` is its return value), so the fixture is the rung where he still does:
 *  the arrival RATE this measures is a property of `plan.train`, unchanged by who replies. The hired
 *  path has its own coverage in the routing block below rather than sharing this one. */
function playAnswering(
  seed: string,
  weeks: number,
  choice: 'rest' | 'push',
  plan: WeekPlan = WEEK_PLAN_PRESETS.balanced,
): { world: WorldState; answered: number } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.plan = { ...plan }
  const rng = rngFromSeed(world.seed)
  let answered = 0
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (pendingKnock(world)) {
      decideKnock(world, choice)
      answered++
    }
  }
  return { world, answered }
}

// =================================================================================================
// 1. ⚠ THE RNG DISCIPLINE (blocks merge)
// =================================================================================================

/** FNV-1a over the draw list – the same hash tests/condition.test.ts's capture uses, now shared from
 *  tests/helpers/hash.ts. This file took the RAW 32-bit word and formatted it here; the five other
 *  copies returned the hex directly. Same hash either way (the intra-loop `>>> 0` the local copy had
 *  is a no-op: `h ^= c` re-coerces to int32 immediately after), so nothing pinned below moves. */
function hashOf(draws: number[]): string {
  return fnv1a(draws.map(String).join(',')).toString(16).padStart(8, '0')
}

/** ⚠ THE CONSTANT RETIRED AT v35 (P3, rng-persistence): the cross-suite capture `{41550,
 *  e6b0c709}` left this file because no loaded career depends on the historical draw count any
 *  more — the position is persisted per career, and the one documented capture lives at
 *  tests/condition.test.ts B1. What this suite proves is unchanged and PAIRWISE now: the
 *  BASELINE arm is the same career with every knock left UNANSWERED (the no-action run — a knock
 *  the parent ignores is exactly the feature idling), and each action arm must tap the identical
 *  MAIN sequence. Same harness as B1: seed `bench-working-0`, 52 ticks, every MAIN draw recorded. */
function baselineRun(profile: PlayerProfile): { draws: number[] } {
  const world = createWorld('bench-working-0', profile)
  const base = rngFromSeed(world.seed)
  const draws: number[] = []
  const rng = () => {
    const v = base()
    draws.push(v)
    return v
  }
  for (let i = 0; i < 52; i++) tickWeek(world, rng)
  return { draws }
}

describe('W4 — ⚠ the knock adds NO main-stream draws (blocks merge)', () => {
  it('a career that answers a knock every time taps the unanswered baseline byte-for-byte', () => {
    // THE CLAIM THIS PROVES, and it is the one claim that could sink the slice: `rollKnock` runs
    // INSIDE `tickWeek` (step 3c), which is exactly where a careless draw moves the weekly
    // sequence. It reads `seed:knock:<week>`, its own per-week sub-stream — the identical pattern
    // `rollInjury` has used for `seed:injury:<week>` since slice C — so the MAIN stream still
    // carries base costs + cohort drift and nothing else, whatever the parent decides.
    // ⚠ RE-AIMED BY THE LOAD SLICE, AND ONLY THE FIXTURE MOVED. `DEFAULT_PROFILE.coachTier` is 'middle',
    // so `createWorld(seed)` with no profile is a HIRED career - and a hired coach now answers the routine
    // knocks himself (engine/coachLoad.ts). The parent was therefore asked 0 times and the "must have
    // exercised the feature" line fired, on a test whose subject is what happens WHEN THE PARENT DECIDES.
    // The hash and the count both still matched, which is the fact this test exists for. Self-coached is
    // where the parent path lives now, so that is the fixture; the hired path gets its own capture below,
    // and it is the stronger of the two because the coach runs INSIDE the tick.
    const baseline = baselineRun({ ...DEFAULT_PROFILE, coachTier: 'self' })
    for (const choice of ['rest', 'push'] as const) {
      const world = createWorld('bench-working-0', { ...DEFAULT_PROFILE, coachTier: 'self' })
      const base = rngFromSeed(world.seed)
      const draws: number[] = []
      const rng = () => {
        const v = base()
        draws.push(v)
        return v
      }
      let answered = 0
      for (let i = 0; i < 52; i++) {
        tickWeek(world, rng)
        if (pendingKnock(world)) {
          decideKnock(world, choice)
          answered++
        }
      }
      expect(draws.length, `count (${choice})`).toBe(baseline.draws.length)
      expect(hashOf(draws), `hash (${choice})`).toBe(hashOf(baseline.draws))
      // ...and the run has to have actually exercised the feature, or it proves nothing.
      expect(answered, 'the season must contain knocks for this to mean anything').toBeGreaterThan(0)
    }
  })

  it('⚠ AND SO DOES A CAREER WHERE THE COACH ANSWERS THEM, INSIDE THE TICK', () => {
    // THE LOAD SLICE'S OWN MERGE-BLOCKING CLAIM, and it is a stronger one than the test above. The parent
    // answers BETWEEN ticks, where a draw could not reach the weekly sequence even carelessly. The COACH
    // answers inside `rollKnock`, i.e. inside `tickWeek` step 3c - and to answer he reads her, which
    // means `coachLoadViewOf` -> `axisEvidence` -> `shownSkill`, and `shownSkill` TAKES A DRAW
    // (`seed:read:stamina`). A per-career sub-stream, so it is safe - but "it is safe" is the kind of
    // claim that has to be a test, because the whole capture is one careless `rng()` away from moving for
    // every save in existence.
    //
    // Every hired rung, because each one reads her differently and therefore decides differently: if
    // any of them perturbed the main stream, that rung would diverge from the baseline alone. The
    // baseline is the SELF-COACHED unanswered run — the strongest possible contrast, because on it
    // the in-tick coach path never executes at all: four rungs of coach reads against no coach
    // whatsoever, and the MAIN sequence must not be able to tell.
    const baseline = baselineRun({ ...DEFAULT_PROFILE, coachTier: 'self' })
    for (const tier of ['budget', 'middle', 'high', 'elite'] as const) {
      const world = createWorld('bench-working-0', { ...DEFAULT_PROFILE, coachTier: tier })
      const base = rngFromSeed(world.seed)
      const draws: number[] = []
      const rng = () => {
        const v = base()
        draws.push(v)
        return v
      }
      let escalated = 0
      for (let i = 0; i < 52; i++) {
        tickWeek(world, rng)
        // the escalated ones still come to the parent - answer them so time keeps moving
        if (pendingKnock(world)) {
          decideKnock(world, 'rest')
          escalated++
        }
      }
      expect(draws.length, `count (${tier})`).toBe(baseline.draws.length)
      expect(hashOf(draws), `hash (${tier})`).toBe(hashOf(baseline.draws))
      // and the coach really did handle some himself, or this proves nothing about his path
      const handled = world.knockHistory.length + (world.knock ? 1 : 0) - escalated
      expect(handled, `${tier} must have answered at least one alone`).toBeGreaterThan(0)
    }
  })

  it('the injury sub-stream is untouched too – the tau multiply is POST-draw', () => {
    // `knockTauFactor` moves the THRESHOLD, never the draw, which is the same invariance shape
    // `physio.riskReduction` and the vacation recovery buff use. So a world with a pushed knock and a
    // world without one pull the SAME number out of `seed:injury:<week>` on the same week; only the
    // comparison against it differs.
    const knock: Knock = { part: 'shoulder', sinceWeek: 10, repeat: false, choice: 'push', untilWeek: 13 }
    const a = createWorld('tau-a')
    const b = createWorld('tau-a')
    a.week = b.week = 11
    a.condition = b.condition = 60
    b.knock = knock
    expect(knockTauFactor(null, 11)).toBe(1)
    expect(knockTauFactor(knock, 11)).toBe(KNOCK_PUSH_TAU)
    // The threshold moved...
    expect(injuryTau(b)).toBeGreaterThan(injuryTau(a))
    // ...and the private per-week generator did not: it is a pure function of (seed, week).
    const drawA = rngFromSeed(`${a.seed}:injury:${a.week}`)()
    const drawB = rngFromSeed(`${b.seed}:injury:${b.week}`)()
    expect(drawB).toBe(drawA)
  })

  it('⚠ a CLOSED allowlist of sub-streams, and no Math.random anywhere', () => {
    // Same shape as tests/preview.test.ts's and tests/radar-read.test.ts's allowlists, and closed for the
    // same reason: a fourth stream must be added by somebody who has read this file.
    const code = codeOf('../src/engine/knock.ts')
    expect(code).not.toContain('Math.random')
    // PURE: it may not reach into the world (world.ts imports it, not the other way round).
    expect(code).not.toContain("from './world'")
    const keys = [...code.matchAll(/rngFromSeed\(`([^`]+)`\)/g)].map((m) => m[1])
    expect(keys.length, 'an empty file must not pass this').toBeGreaterThanOrEqual(2)
    for (const k of keys) expect(k, `unexpected sub-stream ${k}`).toMatch(/^\$\{[\w.]+\}:(knock|knockread):/)
  })

  it('DETERMINISTIC and stable: the same career says the same thing on the same week, for ever', () => {
    const view = {
      seed: 'stable-1',
      week: 30,
      condition: 55,
      plan: WEEK_PLAN_PRESETS.grind,
      history: [],
    }
    const first = drawKnock(view)
    for (let i = 0; i < 30; i++) expect(drawKnock(view)).toEqual(first)
    // ...and the dialog's wording is keyed on the knock's OWN week, not the current one, so it cannot
    // reword itself under a player who left it up while he thought about it.
    const k: Knock = { part: 'knee', sinceWeek: 12, repeat: false, choice: null, untilWeek: 12 }
    const p12 = buildKnockPrompt(k, 'stable-1', 70, BALANCED)
    expect(buildKnockPrompt(k, 'stable-1', 70, BALANCED)).toEqual(p12)
    // A different career asks differently.
    const bySeed = new Set(Array.from({ length: 40 }, (_, i) => buildKnockPrompt(k, `career-${i}`, 70, BALANCED).line))
    expect(bySeed.size, 'a pool of one wearing a draw\'s clothes').toBeGreaterThan(1)
  })
})

// =================================================================================================
// 2. THE ADVANCE IS BLOCKED — the mechanical heart of the slice
// =================================================================================================

describe('W4 — an unanswered knock BLOCKS time, it does not merely halt it', () => {
  /** A world parked on an undecided knock. */
  function stuck(seed = 'blocked-1'): WorldState {
    const w = createWorld(seed)
    w.week = 20
    w.knock = { part: 'ankle', sinceWeek: 20, repeat: false, choice: null, untilWeek: 20 }
    return w
  }

  it('advanceWeeks ticks ZERO weeks and reports only "knock"', () => {
    const w = stuck()
    const rng = rngFromSeed(w.seed)
    expect(advanceWeeks(w, rng, 4)).toEqual(['knock'])
    expect(w.week, 'not one week may pass').toBe(20)
    // ...and pressing again changes nothing. THIS is the difference from every other stop: the owner
    // pressed +4 and four weeks of his daughter's life went by without a question. Re-pressing here
    // re-asks the question instead of skipping it.
    expect(advanceWeeks(w, rng, 4)).toEqual(['knock'])
    expect(w.week).toBe(20)
  })

  it('...and answering it is the ONLY thing that unblocks it', () => {
    const w = stuck()
    const rng = rngFromSeed(w.seed)
    decideKnock(w, 'rest')
    expect(pendingKnock(w)).toBe(false)
    advanceWeeks(w, rng, 1)
    expect(w.week).toBe(21)
  })

  it('a second answer is refused – a decision is made once', () => {
    const w = stuck()
    decideKnock(w, 'push')
    expect(() => decideKnock(w, 'rest')).toThrow(/already been answered/)
    expect(() => decideKnock(createWorld('nothing'), 'rest')).toThrow(/Nothing to decide/)
  })

  it('the reason is surfaced by a real career, not just by a fixture', () => {
    const world = createWorld('stops-real')
    world.plan = { ...WEEK_PLAN_PRESETS.grind }
    const rng = rngFromSeed(world.seed)
    let sawKnockStop = false
    for (let i = 0; i < 60 && !sawKnockStop; i++) {
      const stops = advanceWeeks(world, rng, 4)
      if (stops.includes('knock')) sawKnockStop = true
      if (pendingKnock(world)) decideKnock(world, 'rest')
      else if (world.pendingTournament) break
      // ⚠ v48: THE BIRTHDAY BLOCKS TOO, and this loop met it first. Her birthday landed before the
      // first knock did, so without an answer here the advance returned ['birthday'] for every one of
      // the sixty iterations and the knock this test is about was never reached – "a grinding career
      // must be asked inside its first season" failed on a career that was never asked anything else.
      // A gift moves nothing the knock model reads; it only lets time move.
      const turning = pendingBirthday(world)
      // ⚠ ROUND 42 #26 – THE ENGINE'S OWN SEAM, NOT A REBUILT OFFER. `birthdayOffer(world.seed, age)` is a
      // SECOND derivation of the four rows and it diverges the moment a given durable leaves the card, so
      // `chooseGift` refuses the answer – the R2-18 failure `tests/round23-kid-life.test.ts` wrote down.
      if (turning !== null) chooseGift(world, birthdayOfferFor(world, turning).options[0].id)
    }
    expect(sawKnockStop, 'a grinding career must be asked inside its first season').toBe(true)
  })

  it('the DIALOG is up on exactly the weeks the sim is waiting – gated on the snapshot, not the stop', () => {
    // The bug this forecloses: every other popup reads `stopReasons`, which only an `advance` sets. If
    // this one did too, then setting the plan (or a reload) would produce a snapshot with no stop
    // reasons, the dialog would vanish and the career would be frozen with nothing explaining why.
    const w = createWorld('snap-gate')
    w.week = 15
    w.knock = { part: 'wrist', sinceWeek: 15, repeat: false, choice: null, untilWeek: 15 }
    const asking = toSnapshot(w)
    expect(asking.knockPrompt).not.toBeNull()
    expect(asking.knock).not.toBeNull()
    // No stop reasons at all – exactly the snapshot a `setPlan` produces – and the prompt survives.
    expect(asking.stopReasons).toBeUndefined()
    decideKnock(w, 'push')
    const answered = toSnapshot(w)
    expect(answered.knockPrompt, 'nothing left to ask').toBeNull()
    expect(answered.knock!.choice, 'but the week still knows what it is under').toBe('push')
    // ⚠ RE-AIMED 12.08 (round-17 A), NOT WEAKENED, AND IT FOLLOWED THE CODE RATHER THAN THE STRING.
    // The gate used to be written out in App.vue; the five blocking overlays are now one ordered
    // list in `composables/blockingOverlay.ts` (the birthday had to move ahead of the fork, and five
    // computeds negating each other could not express that without a cycle). The CLAIM is unchanged
    // and is what both halves below assert: the knock is gated on the SNAPSHOT FIELD, not on a stop
    // reason. Asserting it in the file where the rule now lives is also the stronger of the two -
    // the old pin would have gone green on `blockingOverlay` reading `stopReasons`.
    expect(read('../src/App.vue'), 'App.vue reads the shared list').toContain(
      "const showKnock = computed(() => overlay.value === 'knock')",
    )
    const order = read('../src/composables/blockingOverlay.ts')
    expect(order, 'and the list reads the snapshot field').toContain("if (snapshot.knockPrompt) return 'knock'")
    expect(order, 'never a stop reason').not.toContain('stopReasons')
  })
})

// =================================================================================================
// 3. ⚠ BOTH BRANCHES COST — the anti-farming argument, as assertions
// =================================================================================================

describe('W4 — ⚠ neither branch is free progress (the anti-farming pins)', () => {
  it('RESTING gives up development at EVERY plan setting, including Light', () => {
    // ⚠ THE HOLE THIS CLOSES. The obvious way to write a rest week is `plan.train = 40`, and it is
    // wrong: `trainFactor` clamps `(train - 60) / 25` to [0, 1], so a career already on Light would
    // have rested for FREE. The cost is therefore a multiplier on the week's growth
    // (KNOCK_REST_GROWTH), outside the clamp — and this test is the reason it is written that way.
    for (const plan of [WEEK_PLAN_PRESETS.light, WEEK_PLAN_PRESETS.balanced, WEEK_PLAN_PRESETS.grind]) {
      const rested = createWorld('rest-cost')
      const trained = createWorld('rest-cost')
      for (const w of [rested, trained]) {
        w.week = 9
        w.plan = { ...plan }
      }
      rested.knock = { part: 'knee', sinceWeek: 9, repeat: false, choice: 'rest', untilWeek: 10 }
      const rng = rngFromSeed(rested.seed)
      tickWeek(rested, rng)
      tickWeek(trained, rngFromSeed(trained.seed))
      expect(knockRestWeek(rested.knock, rested.week), `rest week (${plan.train})`).toBe(true)
      const gained = (w: WorldState) => w.skills.serve + w.skills.ret + w.skills.groundstrokes
      expect(gained(rested), `a rested week must earn less at train=${plan.train}`).toBeLessThan(gained(trained))
    }
    expect(KNOCK_REST_GROWTH).toBeGreaterThan(0) // ...but not nothing: she still does rehab and hits.
    expect(KNOCK_REST_GROWTH).toBeLessThan(1)
  })

  it("PUSHING buys a loaded injury roll, and the game's own cap still caps it", () => {
    const base = createWorld('push-cost')
    base.week = 20
    base.condition = 45
    const pushed = createWorld('push-cost')
    pushed.week = 20
    pushed.condition = 45
    pushed.knock = { part: 'hip', sinceWeek: 19, repeat: false, choice: 'push', untilWeek: 22 }
    expect(injuryTau(pushed)).toBeGreaterThan(injuryTau(base))
    // A repeat is a WORSE bet than a first offence – the thread's teeth.
    const repeat = { ...pushed, knock: { ...pushed.knock!, repeat: true } } as WorldState
    expect(KNOCK_REPEAT_TAU).toBeGreaterThan(KNOCK_PUSH_TAU)
    expect(injuryTau(repeat)).toBeGreaterThanOrEqual(injuryTau(pushed))
    // ...and no single decision can make her a coin flip: `injuryChanceCap` is the promise.
    for (const condition of [0, 10, 30, 60, 100]) {
      const w = { ...repeat, condition } as WorldState
      expect(injuryTau(w)).toBeLessThanOrEqual(ECONOMY.availability.injuryChanceCap)
    }
  })

  it("⚠ resting is worth LESS than what a Light plan hands out for nothing", () => {
    // The farming argument, as one number. If the rest branch's condition credit beat the rest-slider
    // bonus, a knock would become something a player WANTS: grind, collect a knock, rest it, pocket
    // the difference. It does not, so the cheapest route to that condition is still to set the plan to
    // Light and never see a knock at all — which costs development, out in the open, every week.
    const lightFree = ECONOMY.condition.recoveryBase + restRecoveryBonus(WEEK_PLAN_PRESETS.light.rest)
    expect(KNOCK_REST_CONDITION).toBeLessThanOrEqual(lightFree)
  })

  it('a knock is never something he can CAUSE – no action creates one', () => {
    // The other half of "he cannot farm it": the only writer is `rollKnock`, inside the tick, and the
    // only player-facing verb is the answer. If a command could mint a knock the whole argument fails.
    // world.ts AND every world/*.ts part: `retireKnock` moved to world/knockHistory.ts with the P4
    // decomposition, and the invariant is "only these two writers exist", not "in this one file".
    const world = worldSource()
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
    const writers = [...world.matchAll(/world\.knock = [^\n]+/g)].map((m) => m[0])
    // `rollKnock` assigns the drawn knock; `retireKnock` clears it. Nothing else may write the field.
    expect(writers.sort()).toEqual(['world.knock = knock', 'world.knock = null'])
    expect(codeOf('../src/worker/sim.worker.ts')).not.toMatch(/world\.knock\s*=/)
  })

  it('ONE AT A TIME, and rate-limited by a cooldown', () => {
    const w = createWorld('cooldown-1')
    w.week = 30
    w.plan = { ...WEEK_PLAN_PRESETS.grind }
    w.condition = 30 // the most knock-prone state the model has
    w.knock = { part: 'foot', sinceWeek: 30, repeat: false, choice: null, untilWeek: 30 }
    rollKnock(w)
    expect(w.knock!.part, 'nothing arrives while one is open').toBe('foot')
    expect(w.knock!.sinceWeek, 'and the open one is not overwritten').toBe(30)
    // Retire it, and the cooldown holds the next one off. `untilWeek` is 31 after `rest`, so the knock
    // is live THROUGH 31 and retires at the top of week 32 - which is why the sweep starts there.
    decideKnock(w, 'rest')
    w.week = 32
    expireKnock(w)
    expect(w.knock).toBeNull()
    expect(w.knockHistory).toHaveLength(1)
    const retiredAt = w.knockHistory[0].untilWeek
    for (let week = retiredAt; week < retiredAt + KNOCK_COOLDOWN_WEEKS; week++) {
      w.week = week
      expect(offCooldown({ seed: w.seed, week, condition: 30, plan: w.plan, history: w.knockHistory })).toBe(false)
      rollKnock(w)
      expect(w.knock, `week ${week} is inside the cooldown`).toBeNull()
    }
    expect(
      offCooldown({
        seed: w.seed,
        week: retiredAt + KNOCK_COOLDOWN_WEEKS,
        condition: 30,
        plan: w.plan,
        history: w.knockHistory,
      }),
    ).toBe(true)
  })

  it('the history is bounded – a long career cannot grow the save', () => {
    const { world } = playAnswering('bounded-1', 260, 'rest', WEEK_PLAN_PRESETS.grind)
    expect(world.knockHistory.length).toBeLessThanOrEqual(KNOCK_HISTORY_MAX)
  })
})

// =================================================================================================
// 4. THE ARRIVAL IS THE PLAYER'S OWN PLAN, COMING BACK AT HIM
// =================================================================================================

describe('W4 — the plan decides how often he is asked', () => {
  it('Grind is knock-prone, Light is nearly clean, and the fatigue term agrees', () => {
    const fresh = 92
    const worn = 45
    expect(knockChance(fresh, WEEK_PLAN_PRESETS.light)).toBeLessThan(0.05)
    expect(knockChance(fresh, WEEK_PLAN_PRESETS.balanced)).toBeGreaterThan(0.1)
    expect(knockChance(worn, WEEK_PLAN_PRESETS.grind)).toBeGreaterThan(0.2)
    // Monotone in both terms, which is what makes it readable as a rule rather than a table.
    expect(knockChance(worn, WEEK_PLAN_PRESETS.grind)).toBeGreaterThan(knockChance(fresh, WEEK_PLAN_PRESETS.grind))
    expect(knockChance(worn, WEEK_PLAN_PRESETS.grind)).toBeGreaterThan(knockChance(worn, WEEK_PLAN_PRESETS.light))
    // Bounded at both ends: nobody is immune and nobody is asked every week.
    expect(knockChance(0, { train: 100, rest: 0 })).toBeLessThanOrEqual(KNOCK_CHANCE_CAP)
    expect(knockChance(100, { train: 0, rest: 100 })).toBeGreaterThan(0)
    expect(KNOCK_BASE_CHANCE).toBeLessThan(KNOCK_CHANCE_CAP)
  })

  it('MEASURED on real careers: a Grind season asks several times, a Light one barely at all', () => {
    const count = (plan: WeekPlan) => {
      let total = 0
      for (let s = 0; s < 4; s++) total += playAnswering(`rate-${s}`, 52, 'rest', plan).answered
      return total / 4
    }
    const grind = count(WEEK_PLAN_PRESETS.grind)
    const light = count(WEEK_PLAN_PRESETS.light)
    expect(grind, 'a grinding season must contain decisions').toBeGreaterThanOrEqual(2)
    expect(light, 'a careful season should rarely be asked').toBeLessThan(grind)
    // ...and never so often that it becomes a treadmill rather than an event.
    expect(grind).toBeLessThan(12)
  })

  it('ONLY an ordinary training week – never a tournament, a blackout, a holiday or a layoff', () => {
    const w = createWorld('ordinary-1')
    w.week = 20
    expect(ordinaryTrainingWeek(w)).toBe(true)
    // Each exclusion in turn. Every one of these weeks already HAS a story, and a knock on top would
    // be noise on the one hand and (for the blackouts) a contradiction on the other.
    const cases: [string, (x: WorldState) => void][] = [
      ['injured', (x) => (x.injury = { kind: 'ankle strain', severity: 'moderate', weeksRemaining: 3, totalWeeks: 6, sinceWeek: 19 })],
      ['vacation', (x) => x.vacations.push({ week: 20, packageId: 'camp', paidCents: 0 })],
      ['practice', (x) => x.practices.push({ week: 20, paidCents: 0, withCoach: false })],
    ]
    for (const [name, mutate] of cases) {
      const x = createWorld('ordinary-1')
      x.week = 20
      mutate(x)
      expect(ordinaryTrainingWeek(x), name).toBe(false)
      rollKnock(x)
      expect(x.knock, `no knock on a ${name} week`).toBeNull()
    }
    // ...and the off-season / exam blackout, read off the calendar rather than injected.
    const off = createWorld('ordinary-1')
    off.week = 50 // the season's off-season block
    expect(ordinaryTrainingWeek(off)).toBe(false)
  })

  it('the week it ARRIVES in is still an ordinary training week, as far as the note is concerned', () => {
    // An undecided knock is not doing anything to the week yet – it is stopping the NEXT one. So the
    // arriving week's own note is still about the training that caused it, and `knockChoice` on the
    // facts is null. (The `rest`/`push` notes belong to the weeks the decision governs.)
    //
    // ⚠ RE-AIMED BY W6, AND ONLY TIGHTENED – THE ASSERTION USED TO CONTRADICT THE SENTENCE ABOVE IT.
    // The parenthesis was already the rule; the last two lines pinned the opposite, asserting `'rest'`
    // on week 14 the moment he answered. That is the arrival week: `growWeek` (3b) banked it at the full
    // rate before `rollKnock` (3c) even drew the knock, so nothing was charged and she spent it on court.
    // Reading `'rest'` there is what drew her at home and captioned it «A week off the elbow» about a
    // week of drills. The guarded fact is unchanged and now holds through the decision as well: week 14
    // is silent whatever he chooses, and week 15 is where the choice speaks.
    const w = createWorld('facts-1')
    w.week = 14
    w.knock = { part: 'elbow', sinceWeek: 14, repeat: false, choice: null, untilWeek: 14 }
    expect(toSnapshot(w).diary.facts.knockChoice).toBeNull()
    decideKnock(w, 'rest')
    expect(toSnapshot(w).diary.facts.knockChoice, 'the arrival week stays silent AFTER the answer').toBeNull()
    expect(toSnapshot(w).diary.facts.knockPart).toBeNull()
    // ...and the week the decision actually governs is where it speaks
    w.week = 15
    expect(toSnapshot(w).diary.facts.knockChoice).toBe('rest')
    expect(toSnapshot(w).diary.facts.knockPart).toBe('elbow')
  })

  it('the WEEKS it covers are exactly the ones the choice bought', () => {
    const k: Knock = { part: 'knee', sinceWeek: 40, repeat: false, choice: null, untilWeek: 40 }
    expect(knockUntilWeek(k, 'rest')).toBe(41)
    expect(knockUntilWeek(k, 'push')).toBe(40 + KNOCK_PUSH_WEEKS)
    const pushed: Knock = { ...k, choice: 'push', untilWeek: knockUntilWeek(k, 'push') }
    for (let week = 41; week <= 40 + KNOCK_PUSH_WEEKS; week++) {
      expect(knockLive(pushed, week), `live in ${week}`).toBe(true)
      expect(knockTauFactor(pushed, week)).toBe(KNOCK_PUSH_TAU)
    }
    expect(knockLive(pushed, 41 + KNOCK_PUSH_WEEKS)).toBe(false)
    expect(knockTauFactor(pushed, 41 + KNOCK_PUSH_WEEKS)).toBe(1)
    // A RESTED knock never loads anything, on any week.
    const rested: Knock = { ...k, choice: 'rest', untilWeek: 41 }
    expect(knockTauFactor(rested, 41)).toBe(1)
    expect(knockRestWeek(rested, 41)).toBe(true)
  })

  it('...and it retires itself, so a career cannot accumulate live knocks', () => {
    const { world } = playAnswering('retire-1', 120, 'push', WEEK_PLAN_PRESETS.grind)
    // Whatever happened over 120 weeks, at most one is live and it is never stale.
    if (world.knock) expect(world.week).toBeLessThanOrEqual(world.knock.untilWeek)
    expect(world.knockHistory.every((r) => r.untilWeek >= r.sinceWeek)).toBe(true)
  })
})

// =================================================================================================
// 5. THE ACCUMULATING THREAD
// =================================================================================================

describe('W4 — the thread: a part he ignored is a part that comes back', () => {
  it('only a PUSHED knock goes on the record', () => {
    expect(
      pushedParts([
        { part: 'ankle', sinceWeek: 3, untilWeek: 4, choice: 'rest' },
        { part: 'shoulder', sinceWeek: 12, untilWeek: 15, choice: 'push' },
      ]),
    ).toEqual(['shoulder'])
    // Newest first, de-duplicated: the shortlist a repeat is drawn from.
    expect(
      pushedParts([
        { part: 'wrist', sinceWeek: 3, untilWeek: 6, choice: 'push' },
        { part: 'knee', sinceWeek: 20, untilWeek: 23, choice: 'push' },
        { part: 'wrist', sinceWeek: 40, untilWeek: 43, choice: 'push' },
      ]),
    ).toEqual(['wrist', 'knee'])
  })

  it('an UNDECIDED knock retires as "rest" – the record may not invent a decision', () => {
    // Reachable exactly once: an injury landing on the very week the knock arrived, before he could
    // answer. He never sent her back out, so `pushedParts` must not put that part on the thread for
    // ever on the strength of a decision nobody made.
    const w = createWorld('undecided-1')
    w.week = 25
    w.condition = 0
    w.physioActive = false
    w.knock = { part: 'shoulder', sinceWeek: 25, repeat: false, choice: null, untilWeek: 25 }
    // Force the onset: tau is 1-capped at injuryChanceCap, so drive the roll by hand via a seed walk.
    let hit = false
    for (let s = 0; s < 400 && !hit; s++) {
      const x = createWorld(`undecided-${s}`)
      x.week = 25
      x.condition = 0
      x.physioActive = false
      x.knock = { part: 'shoulder', sinceWeek: 25, repeat: false, choice: null, untilWeek: 25 }
      rollInjury(x)
      if (x.injury) {
        hit = true
        expect(x.knock, 'the injury supersedes the knock').toBeNull()
        expect(x.knockHistory).toHaveLength(1)
        expect(x.knockHistory[0].choice, 'never "push" – he was not asked').toBe('rest')
        expect(pushedParts(x.knockHistory), 'and it is NOT on the thread').toEqual([])
      }
    }
    expect(hit, 'the fixture must reach an onset').toBe(true)
  })

  it('a knock that BREAKS DOWN breaks down on the part he was pushing, and the record says so', () => {
    // The payoff. `drawBodyRegion` still spends its one draw exactly where it did (a POST-draw
    // override, so the `seed:injury:<week>` sequence is byte-identical); what changes is the answer.
    let found = false
    for (let s = 0; s < 400 && !found; s++) {
      const w = createWorld(`broke-${s}`)
      w.week = 25
      w.condition = 0
      w.physioActive = false
      w.knock = { part: 'lower back', sinceWeek: 24, repeat: false, choice: 'push', untilWeek: 27 }
      rollInjury(w)
      if (w.injury) {
        found = true
        expect(w.injury.kind, 'the injury is on the part he ignored').toContain('lower back')
        expect(w.knockHistory[0].brokeDown, 'the record carries the bill').toBe(true)
        expect(w.knockHistory[0].choice).toBe('push')
        expect(w.events.some((e) => e.text.includes('The knock we trained through'))).toBe(true)
      }
    }
    expect(found).toBe(true)
  })

  it('a repeat is a statement about the RECORD, and it bites harder', () => {
    const history = [{ part: 'shoulder' as const, sinceWeek: 5, untilWeek: 8, choice: 'push' as const }]
    // Over a spread of weeks the repeat part turns up often, and whenever the part IS on the record
    // the knock reads as a repeat – including the times the part draw found it by itself.
    let repeats = 0
    let onShoulder = 0
    for (let week = 20; week < 120; week++) {
      const k = drawKnock({ seed: 'repeat-1', week, condition: 40, plan: WEEK_PLAN_PRESETS.grind, history })
      if (!k) continue
      if (k.part === 'shoulder') onShoulder++
      if (k.repeat) repeats++
      // The invariant: repeat ⇔ the part is on the pushed record. Never a free-floating flag.
      expect(k.repeat).toBe(pushedParts(history).includes(k.part))
    }
    expect(onShoulder, 'the ignored part must come back').toBeGreaterThan(0)
    expect(repeats).toBe(onShoulder)
  })
})

// =================================================================================================
// 5b. WHY – THE CAUSE (round 43 #10)
// =================================================================================================
//
// The owner, 16.09: «мой первый вопрос – ПОЧЕМУ? мне кажется, в этом окошке можно игроку подсветить,
// что может быть причиной… или хотя бы предложить, на что посмотреть.»
//
// ⚠⚠ THE TRAP THIS SECTION EXISTS TO HOLD SHUT is that «which term is biggest» is the obvious
// implementation and it LIES. `knockChance` is base .100 + fatigue + load, and at the operating point
// his own career sits on – condition 60, train 85 – the terms are .100 / .088 / .060: the BASE is the
// largest, so «biggest term» answers «nothing you did» about a week in which the family put .148 on
// top of an irreducible .100 floor. §5b-2 asserts exactly that case.
//
// ⚠⚠ AND THE OTHER HALF IS THE OWNER'S OWN LAW – «мы ни за что не наказываем». The card has to be
// able to say that nothing the family did caused this, or it teaches that there is always something
// to fix. §5b-3 is that branch, and §5b-5 is the sweep that says it is never said to a family whose
// choices DID add something.
//
// ⚠ MUTATION-VERIFIED – the ARMS table at the foot of this section.
describe('round 43 #10 — the knock window answers why, and can answer "no single choice"', () => {
  const GRIND = WEEK_PLAN_PRESETS.grind // train 85, the load term at +.060
  const LIGHT = WEEK_PLAN_PRESETS.light // train 60, the load term at -.090
  /** ⚠ THE FOURTH ARGUMENT, ADDED 17.09 WITH HIS COPY REVIEW. The repeat line names the body part
   *  now, because `buildKnockPrompt` is holding the whole `Knock` and he ruled that the vague form
   *  is for surfaces without one. Every other branch ignores it, which §5b-8 asserts. */
  const PART = 'shoulder'

  /** The two choice terms, spelled the way `knockChance` spells them – so a retune of either slope
   *  moves this file and the engine together instead of leaving a stale expectation behind. */
  const fatigueOf = (condition: number) => (100 - condition) * 0.0022
  const loadOf = (plan: WeekPlan) => (plan.train - 75) * 0.006

  it('§5b-1 – the four rows of the ledger, and they are four different sentences', () => {
    // The table round 43 #10 ruled, read back off the engine. Each row names the branch it is.
    const grinding = knockCause(60, GRIND, false, PART)
    const hardWeekFreshLegs = knockCause(95, GRIND, false, PART)
    const careful = knockCause(90, LIGHT, false, PART)
    const again = knockCause(60, GRIND, true, PART)

    expect(grinding, 'condition 60 at train 85 – fatigue .088 beats load .060').toContain('already tired')
    expect(hardWeekFreshLegs, 'condition 95 at train 85 – load .060 beats fatigue .011').toContain('We set a hard week')
    expect(careful, 'condition 90 at train 70-ish – the choices added nothing').toContain('No single choice explains')
    expect(again, 'the record is the cause when there is one').toContain('back out with a knock to her')

    // ⚠ FOUR DISTINCT SENTENCES. A branch that fell through to a neighbour's line would still pass
    // every `toContain` above if the two happened to share a word, and «the same answer for two
    // different weeks» is the failure a player notices before a test does.
    expect(new Set([grinding, hardWeekFreshLegs, careful, again]).size).toBe(4)
  })

  it('§5b-2 – ⚠⚠ the BASE is the biggest term at his own grinding point, and the card still blames the week', () => {
    // The arithmetic that makes «which term is biggest» the wrong question, asserted rather than
    // asserted about: if this stops being true the design note in knock.ts stops being true with it.
    const base = KNOCK_BASE_CHANCE
    const fatigue = fatigueOf(60)
    const load = loadOf(GRIND)
    expect(base, 'the floor is the largest single term here').toBeGreaterThan(fatigue)
    expect(base).toBeGreaterThan(load)
    // ...and yet the family's own choices are the majority of the week's risk.
    expect(fatigue + load).toBeGreaterThan(base)
    // So the card must NOT say «nothing we did» on this week. This is the assertion the obvious
    // implementation fails.
    expect(knockCause(60, GRIND, false, PART)).not.toContain('No single choice explains')
  })

  it('§5b-3 – ⚠⚠ it can say that nothing the family did caused it, which is the rule it cannot ship without', () => {
    // «мы ни за что не наказываем»: a card that always names a fault manufactures guilt where there
    // is none. The careful week is the branch that refuses to.
    const careful = knockCause(90, LIGHT, false, PART)
    expect(fatigueOf(90) + loadOf(LIGHT), 'the choices really did add nothing').toBeLessThanOrEqual(0)
    expect(careful).toContain('No single choice explains')
    // ⚠ AND IT IS A SENTENCE, NOT AN ABSENCE. `cause` is a `string`, never null or empty: a card that
    // went quiet on the careful week would read as a shrug on exactly the week the player deserves
    // the answer most. The ledger's own words: «the careful row is not a missing answer».
    expect(careful.length, 'the careful week gets a real answer').toBeGreaterThan(20)
  })

  it('§5b-4 – the load term is SIGNED: a light week is a credit against her fatigue', () => {
    // `KNOCK_TRAIN_SLOPE`'s own docblock – «MINUS it below» Balanced – and it is what makes the
    // careful branch reachable at all. ONE body, two plans, two different answers: at condition 60
    // her fatigue is .088, so a grinding week's +.060 leaves the family holding .148 and a light
    // week's -.090 leaves them holding nothing at all.
    expect(knockCause(60, GRIND, false, PART), 'a worn body on a hard week').toContain('already tired')
    expect(knockCause(60, LIGHT, false, PART), 'the same body, a light week: the care was working').toContain('No single choice explains')
    // ⚠ AND THE FATIGUE/LOAD COMPARISON IS A REAL ONE, not a rank the condition alone decides: the
    // SAME grinding plan on a fresher body hands the answer to the week instead of to her legs,
    // because .044 of fatigue at condition 80 is under the plan's own .060.
    expect(knockCause(80, GRIND, false, PART), 'fresher legs, the same hard week').toContain('We set a hard week')
    // ⚠ AND THE CREDIT IS NOT UNLIMITED, which is where this implementation parts company with the
    // shorthand «say nothing when the load term is negative». A tired kid on a light week is still
    // tired: fatigue .099 against a -.060 credit is a NET .039 the family put there.
    expect(fatigueOf(55) + loadOf({ train: 65, rest: 35 })).toBeGreaterThan(0)
    expect(knockCause(55, { train: 65, rest: 35 }, false, PART), 'a light week does not absolve a worn body').toContain('already tired')
  })

  it('§5b-5 – across every reachable week: "nothing we did" is said if and only if nothing was added', () => {
    // The sweep, over the three plans `planTrainPct` can produce and the whole condition range. Two
    // directions, and they are different failures: saying «nothing we did» to a family that ground
    // her down is a lie that lets a mistake run, and NOT saying it to a careful one is the guilt the
    // owner's law forbids.
    let careful = 0
    let blamed = 0
    for (const plan of [GRIND, BALANCED, LIGHT]) {
      for (let condition = 0; condition <= 100; condition++) {
        const added = fatigueOf(condition) + loadOf(plan)
        const cause = knockCause(condition, plan, false, PART)
        if (added <= 0) {
          expect(cause, `condition ${condition}, train ${plan.train}: added ${added.toFixed(4)}`).toContain('No single choice explains')
          careful++
        } else {
          expect(cause, `condition ${condition}, train ${plan.train}: added ${added.toFixed(4)}`).not.toContain('No single choice explains')
          blamed++
        }
      }
    }
    // Not vacuous in either direction – both arms of the biconditional were actually exercised.
    expect(careful, 'careful weeks exist').toBeGreaterThan(20)
    expect(blamed, 'and so do weeks the family added to').toBeGreaterThan(20)
  })

  it('§5b-6 – the record comes first, and a family that pushed this part before is never told "nothing we did"', () => {
    // `repeat` cannot be ranked against the two terms – it adds nothing to `knockChance` at all – so
    // it is a branch rather than a comparison. It wins because it is the only cause about the
    // decision being taken on THIS card: KNOCK_REPEAT_TAU is x3.0 against KNOCK_PUSH_TAU's x2.2.
    expect(KNOCK_REPEAT_TAU).toBeGreaterThan(KNOCK_PUSH_TAU)
    for (const plan of [GRIND, BALANCED, LIGHT]) {
      for (const condition of [0, 40, 80, 100]) {
        const cause = knockCause(condition, plan, true, PART)
        expect(cause, `repeat at condition ${condition}, train ${plan.train}`).toContain('back out with a knock to her')
        // ⚠ THE HALF THAT MATTERS: the careful sentence must never reach a career that pushed this
        // exact part before. They did do something – it was just not this week.
        expect(cause).not.toContain('No single choice explains')
      }
    }
  })

  it('§5b-7 – the prompt carries it, and the two rng draws did not move', () => {
    const knock: Knock = { part: 'knee', sinceWeek: 12, repeat: false, choice: null, untilWeek: 12 }
    const grinding = buildKnockPrompt(knock, 'why-1', 60, GRIND)
    const careful = buildKnockPrompt(knock, 'why-1', 90, LIGHT)
    expect(grinding.cause).toBe(knockCause(60, GRIND, false, 'knee'))
    expect(careful.cause).toBe(knockCause(90, LIGHT, false, 'knee'))
    // ⚠ THE WORDING OF EVERYTHING ELSE IS UNTOUCHED BY THE PLAN. `line` and `read` are drawn off
    // `seed:knockread:<sinceWeek>` in a fixed order, and the cause is DERIVED rather than drawn - so
    // two prompts that differ only in the plan differ only in the cause. This is the assertion that
    // fails if a draw is ever added for it.
    expect(careful.line).toBe(grinding.line)
    expect(careful.restCost).toBe(grinding.restCost)
    expect(careful.pushCost).toBe(grinding.pushCost)
    expect(careful.cause).not.toBe(grinding.cause)
  })

  it('§5b-8 – ⚠ the repeat line NAMES the part, and the other three never mention one', () => {
    // His 17.09 review: the vague form («this same place») is for a surface with no body part to
    // hand, and the stronger one is for a surface with it. This one has it – the whole `Knock` is a
    // parameter of `buildKnockPrompt` – so «do not use vague place language when the real one is to
    // hand» applies, and this is the case that says the variable really reaches the sentence.
    for (const part of ['shoulder', 'lower back', 'wrist']) {
      expect(knockCause(60, GRIND, true, part), `the repeat line names the ${part}`).toContain(part)
      // ⚠ AND IT IS THE PART THAT MOVES, NOT A FIXED WORD THAT HAPPENS TO CONTAIN IT: a hard-coded
      // «shoulder» would pass the line above for one of the three and fail for the other two.
      expect(knockCause(60, GRIND, true, part)).not.toContain('this same place')
    }
    // ⚠ THE OTHER THREE BRANCHES ARE PART-BLIND, which is what makes the argument honest rather than
    // decorative: an implementation that appended the part to every sentence would pass §5b-1 and
    // tell a family «we set a hard week – her foot» on a week nothing was pushed.
    for (const part of ['shoulder', 'lower back', 'wrist']) {
      expect(knockCause(60, GRIND, false, part), 'the tired branch').not.toContain(part)
      expect(knockCause(95, GRIND, false, part), 'the hard-week branch').not.toContain(part)
      expect(knockCause(90, LIGHT, false, part), 'the careful branch').not.toContain(part)
    }
  })

  it('§5b-9 – ⚠⚠ the careful branch reports NO IDENTIFIED CAUSE, and never promises innocence', () => {
    // His 17.09 fault on this one branch, and he called it a correctness point rather than a style
    // one: the old «Nothing we did – the care we have been taking was working» «tries too hard to
    // absolve the player». The branch's own arithmetic does not support that claim – `fatigue +
    // load <= 0` says the two terms NETTED to nothing, and at condition 60 on a light week her
    // fatigue term is a real .088 that a -.090 credit merely covered.
    const careful = knockCause(60, LIGHT, false, PART)
    expect(fatigueOf(60), 'her fatigue term is not zero on this very week').toBeGreaterThan(0)
    expect(fatigueOf(60) + loadOf(LIGHT), 'and yet the pair nets out').toBeLessThanOrEqual(0)
    // What it may say: no ONE choice explains it.
    expect(careful).toContain('No single choice explains')
    // What it may not say: that nothing they did contributed at all.
    expect(careful, 'no promise of innocence').not.toMatch(/nothing (we|you) did/i)
  })
})

// ===========================================================================
// THE ARMS for §5b. Each applied to src/engine/knock.ts, this file run, then reverted.
//
//   1. `knockCause` ranked the three terms of `knockChance` and returned the careful line when the
//      BASE was largest -> §5b-2 (the grinding point is told nothing was its fault) and §5b-5.
//   2. the careful branch deleted (fall through to the fatigue/load comparison)
//      -> §5b-1 (three sentences, not four), §5b-3 (no «No single choice»), §5b-4, §5b-5, §5b-9.
//   3. `fatigue + load <= 0` -> `load < 0` (the ledger's shorthand taken literally)
//      -> §5b-4's last pair: condition 55 on a light week is told «No single choice» while its own
//         arithmetic says the family added .039. ⭐ THIS IS THE ARM THE SECTION WAS WRITTEN FOR - the
//         two readings agree on every example in the ledger and part company here.
//   4. `if (repeat)` moved BELOW the careful branch
//      -> §5b-6: a careful week on a previously-pushed part is told «No single choice».
//   7. (17.09) the repeat line reverted to a part-free «this same place»
//      -> §5b-8: the variable never reaches the sentence.
//   8. (17.09) the part appended to every branch's sentence
//      -> §5b-8's second half: three branches that have no business naming a part name one.
//   9. (17.09) the careful line reverted to «Nothing we did – the care we have been taking was
//      working» -> §5b-9 (the promise of innocence) and §5b-1/3/4/5 on the marker.
//   5. `fatigue >= load` -> `fatigue > load`
//      -> nothing red. ⚠ RECORDED RATHER THAN HIDDEN: a dead heat is reachable only where
//         (100-c) x .0022 == (train-75) x .006 exactly, which over the integer condition range and
//         the three plans `planTrainPct` produces never lands on equality. The `>=` is a documented
//         choice about a case the engine cannot currently reach, not a guarded one.
//   6. `cause` dropped from the returned prompt object -> the build fails (the field is required on
//      `KnockPrompt`), which is the compiler doing this arm's job before a test can.
// ===========================================================================

// =================================================================================================
// 6. THE VOICE, AND THE SCHEMA
// =================================================================================================

describe('W4 — the copy is the parent and the coach, and it carries no numbers', () => {
  /** Every sentence the dialog can show, across the axes the copy actually branches on. */
  function everyPrompt(): string[] {
    const out: string[] = []
    for (const part of ['shoulder', 'lower back', 'ankle']) {
      for (const repeat of [false, true]) {
        for (const condition of [20, 45, 75, 95]) {
          for (let sinceWeek = 1; sinceWeek < 40; sinceWeek++) {
            for (const plan of VOICE_PLANS) {
              const p = buildKnockPrompt(
                { part, sinceWeek, repeat, choice: null, untilWeek: sinceWeek },
                'voice-1',
                condition,
                plan,
              )
              // ⭐ ROUND 43 #10 – `cause` JOINS THE SWEEP, and the plan axis joins with it. The voice
              // rules below (no digits, no em dash, no Cyrillic, never «you», under 110 characters)
              // are what keep the four new sentences in the same register as the rest of the card,
              // and `cause` is the only field on this prompt that branches on the PLAN – so a sweep
              // that held the plan fixed would grade one of its four voices and miss three.
              out.push(p.line, p.read, p.restCost, p.pushCost, p.cause)
            }
          }
        }
      }
    }
    return out
  }

  it('short dash only, no Cyrillic, and it never addresses the player as "you"', () => {
    for (const t of everyPrompt()) {
      expect(t, t).not.toContain('—')
      // HOUSE STYLE: the dash a sentence breaks on is the short one, and it is the en dash the rest
      // of the diary pool uses ("An ordinary week – school, practice, pasta.") rather than a hyphen.
      expect(t.includes(' - '), `hyphen where the pool uses an en dash: ${t}`).toBe(false)
      expect(t, t).not.toMatch(/[Ѐ-ӿ]/)
      expect(t, t).not.toMatch(/\bYou\b|\byour\b|\bYour\b/)
      expect(t.length, `too long for the card: ${t}`).toBeLessThanOrEqual(110)
    }
  })

  it("⚠ the coach's read is FOGGED – not one digit anywhere in the dialog", () => {
    // buildTrainingRead's own rule, and the reason the dialog is a decision rather than arithmetic: a
    // popup that printed "+9.9%/wk for 3 weeks" would be solved once and then clicked through for
    // ever. He is a man with an opinion. The cost sentences name the CURRENCY, never the amount.
    for (const t of everyPrompt()) expect(t, `a number leaked: ${t}`).not.toMatch(/\d/)
  })

  it('both branches always say what they cost, and the two are never the same sentence', () => {
    for (const repeat of [false, true]) {
      const p = buildKnockPrompt(
        { part: 'wrist', sinceWeek: 7, repeat, choice: null, untilWeek: 7 },
        'costs-1',
        70,
        BALANCED,
      )
      expect(p.restCost.length).toBeGreaterThan(20)
      expect(p.pushCost.length).toBeGreaterThan(20)
      expect(p.restCost).not.toBe(p.pushCost)
    }
    // A repeat is warned differently – that is the thread showing up in the copy.
    const first = buildKnockPrompt({ part: 'wrist', sinceWeek: 7, repeat: false, choice: null, untilWeek: 7 }, 'c', 70, BALANCED)
    const again = buildKnockPrompt({ part: 'wrist', sinceWeek: 7, repeat: true, choice: null, untilWeek: 7 }, 'c', 70, BALANCED)
    expect(again.pushCost).not.toBe(first.pushCost)
    expect(again.pushCost).toContain('wrist')
  })

  it('the dialog has NO exit that is not an answer', () => {
    const dialog = read('../src/components/KnockDialog.vue')
    // Comments stripped, so the component's own header may DOCUMENT the rule this enforces.
    const markup = codeOf('../src/components/KnockDialog.vue').replace(/<!--[\s\S]*?-->/g, '')
    // No dismiss, no Continue, and deliberately no overlay-click escape: the sim is stopped on this
    // question, so a way out that is not an answer would strand the career.
    expect(markup).not.toContain('click.self')
    expect(markup).not.toMatch(/>\s*Continue\s*</)
    // ⚠ RE-AIMED BY ROUND 42 #8 («выбор + proceed», the owner's ruling): the two branches SELECT
    // now and the Proceed under them is the one control that records – so the pins name the new
    // pair. The claim of this case is unchanged: every control is an answer or the recording of
    // one, and there is still no dismiss. The BEHAVIOUR (first tap records nothing, only the
    // Proceed decides, mutation-proven) is the mounted net's:
    // tests/component/round42-select-confirm.test.ts.
    expect(dialog).toContain("select('rest')")
    expect(dialog).toContain("select('push')")
    expect(dialog).toContain('confirm()')
    expect(dialog).toContain('game.decideKnock(choice)')
    // ...and the copy is the ENGINE's, so it can be tested. The template owns the verbs, the
    // Proceed word (the prologue's own shipped confirm vocabulary) and nothing else.
    expect(dialog).toContain('prompt.restCost')
    expect(dialog).toContain('prompt.pushCost')
    // The MARKUP carries no Cyrillic and no em dash - the house rule. A `//` line above it is not
    // copy, which is why this reads the comment-stripped source (the same allowance
    // tests/coachTiers.test.ts makes for OnboardingWizard's own header).
    expect(markup).not.toMatch(/[Ѐ-ӿ]/)
    expect(markup).not.toContain('—')
  })
})

describe('W4 — the schema (v26)', () => {
  it('a v25 save migrates to a clean body and a clean record', () => {
    // ⚠ THE GAP THE SURVEY FLAGGED: v25 shipped with no dedicated migration test, covered only by the
    // golden corpus. Not repeated here.
    const v25 = {
      schemaVersion: 25,
      seed: 'mig-26',
      week: 40,
      profile: { kidName: 'V', kidLastName: 'M', gender: 'girl', country: 'US', background: 'middle', coachTier: 'middle', playStyle: 'all-court', birthMonth: 6 },
      fundsCents: 1000,
    }
    const out = migrateSave(structuredClone(v25))
    expect(out.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(out.knock, 'nothing hurts – the system did not exist, so nothing happened under it').toBeNull()
    expect(out.knockHistory, 'and no decisions are invented on his behalf').toEqual([])
    // IDEMPOTENT, and it must not reset a knock a v26 save is actually carrying.
    const carrying = { ...structuredClone(out), knock: { part: 'knee', sinceWeek: 39, repeat: false, choice: 'push', untilWeek: 42 } }
    expect(migrateSave(structuredClone(carrying)).knock).toEqual(carrying.knock)
    expect(migrateSave(structuredClone(out))).toEqual(out)
  })

  it('a fresh career starts clean, and the field is on the world rather than derived', () => {
    const w = createWorld('fresh-26')
    expect(w.knock).toBeNull()
    expect(w.knockHistory).toEqual([])
    expect(w.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    // The one reason this cost a schema bump: `choice` is the player's decision, and a decision that
    // evaporates on reload is not one. Everything else the knock produces is derived per snapshot.
    expect(codeOf('../src/engine/migrations.ts')).toContain('save.knockHistory ??= []')
  })
  // ⚠ THE FEED MAY NOT DEMAND A DECISION THE PLAYER WILL NOT BE OFFERED (owner, 31.07: «а где сам
  // decision? кто его должен принимать?»). He saw "It needs a decision." on a career whose middle-rung
  // coach had already taken the call two lines later - the shape of having been asked and ignored.
  //
  // The rule is about WHO ASKS, not about wording: the dialog is the demand, and on the path where no
  // dialog opens there is nothing to demand. So the arrival line reports the fact and stops, on every
  // path, and this pins that it cannot grow a demand back - in any phrasing, not just the old one.
  it('the knock ARRIVAL line reports, it never asks - the dialog is what asks', () => {
    // world.ts AND every world/*.ts part: rollKnock moved to world/knock.ts with the P4 split
    const src = worldSource()
    const block = region(src, 'const knock = drawKnock(view)', 'coachManagesLoad(tierOf(')
    const lines = [...block.matchAll(/`([^`]*\$\{knock\.part\}[^`]*)`/g)].map((m) => m[1])
    expect(lines.length, 'the two arrival lines should still be here').toBe(2)
    for (const line of lines) {
      expect(line, `"${line}" asks the player for something`).not.toMatch(/decision|decide|choose|what do you/i)
    }
  })

})
