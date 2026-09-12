// =================================================================================================
// ⭐⭐⭐ ROUND 39 #1 – EVERY HOME FLAVOUR LINE HAS AN AGE / LIFE-STAGE GATE, AND THE GATE IS SWEPT
// =================================================================================================
//
// The owner, 08.09, on «A spare key on her own ring. We are still getting used to that.» printing at
// 35: «В 35 лет звучит уже довольно странно. Давай проведём общее ревью этих фразочек на home с
// целью максимально убрать вот такие вот несоответствия». Home's flavour lines are DIARY_POOL's two
// surfaces – `photoLine` under her name and `conditionNote` under the bar – and this file is the
// review, made permanent:
//
//   1. EVERY pool entry must have a row in HOME_LINE_GATES declaring where it may print – the four
//      life stages, plus an age bound where a stage is too wide (`independent` spans 22..retirement,
//      which is exactly how a moving-out line reached a 35-year-old). A line with no row fails, so
//      copy added later cannot skip the decision.
//   2. The sweep then LICENSES every entry against facts for every stage x age x scenario and fails
//      on any line selectable outside its declared window – the "child-only line leaks to 35" test,
//      run for the whole pool in both directions.
//   3. Every entry must also be selectable SOMEWHERE inside its window, so a declaration cannot rot
//      into vacuous truth, and the owner's named line is pinned concretely at 22 (in) and 35 (out).
//
// ⚠ THE MAP DOUBLES AS A VERBATIM PIN ON EVERY FLAVOUR STRING (CLAUDE.md invariant 4): a wording
// change nobody asked for breaks the key match loudly instead of shipping silently.
//
// ⚠ STAGE/FACT COUPLINGS ARE HONOURED, not invented around: `examsWeek` cannot be true past school
// (`isExamWeek` reads `schoolOver`), so the exams scenario only exists at school – the same coupling
// tests/diary.test.ts documents discovering the hard way.
import { describe, it, expect } from 'vitest'
import { DIARY_POOL, type DiaryPhrase } from '../src/engine/diary/pool'
import { SETTLED_ADULT_AGE } from '../src/engine/diary/words'
import type { DiaryFacts, DiaryLifeStage } from '../src/shared/protocol'

// --- the stage x age grid --------------------------------------------------------------------
// Two points inside `independent`'s first flat years and two in the settled ones, because that
// boundary (SETTLED_ADULT_AGE) is the round's own finding: a stage predicate alone cannot tell 24
// from 35.
const STAGE_POINTS: { stage: DiaryLifeStage; age: number }[] = [
  { stage: 'school', age: 13 },
  { stage: 'school', age: 16 },
  { stage: 'after-school', age: 19 },
  { stage: 'after-school', age: 21 },
  { stage: 'college', age: 20 },
  { stage: 'independent', age: 22 },
  { stage: 'independent', age: 24 },
  { stage: 'independent', age: 29 },
  { stage: 'independent', age: 35 },
]

function baseFacts(stage: DiaryLifeStage, age: number): DiaryFacts {
  return {
    week: 10,
    ageYears: age,
    lifeStage: stage,
    emotion: 'norm',
    resultFresh: false,
    won: false,
    lostFinal: false,
    titleThisWeek: false,
    resultTier: 'j30',
    rankClimbed: false,
    runPointsThisWeek: 0,
    lossStreak: 0,
    condition: 70,
    conditionBand: 'ok',
    // ⚠ v72: a career's opening state, unread by this suite – 70/70 for everyone in v1 (ruling V4),
    // which reads `steady` on the bond band and `level` on the register.
    temperament: 'sunny',
    moodWord: null,
    moodRegister: 'level',
    bondBand: 'steady',
    // ⭐ v74 T6 – the parent knows of nobody, which is what every fixture in this file was
    // written about (see `DiaryFacts.partnerKnown`).
    partnerKnown: false,
    injured: null,
    travelled: false,
    playedTournament: false,
    playedPractice: false,
    examsWeek: false,
    schoolOver: stage !== 'school',
    offSeasonWeek: false,
    vacationWeek: false,
    vacationPackageId: null,
    trainPct: 75,
    fundsPressure: 'ok',
    freshMilestone: null,
    travelHomeScene: null,
    travelHomeMood: null,
    knockChoice: null,
    knockPart: null,
    birthdayAge: null,
    birthdayGift: null,
    birthdayWanted: false,
    birthdayRepeatAge: null,
  }
}

/** Week shapes rich enough that every line in the pool is licensable somewhere. Scenario x stage
 *  combinations the engine cannot produce (exams past school) are skipped where they are built. */
function* scenarios(stage: DiaryLifeStage, age: number): Generator<DiaryFacts> {
  const b = () => baseFacts(stage, age)
  yield b() // quiet, norm
  yield { ...b(), condition: 90, conditionBand: 'fresh' }
  yield { ...b(), condition: 30, conditionBand: 'drained' }
  const trip = { travelled: true, playedTournament: true } as const
  yield { ...b(), ...trip, resultFresh: true, won: true, emotion: 'happy', runPointsThisWeek: 30 }
  yield { ...b(), ...trip, resultFresh: true, won: true, titleThisWeek: true, emotion: 'happy', runPointsThisWeek: 30 }
  yield { ...b(), ...trip, resultFresh: true, lostFinal: true, emotion: 'serious' }
  yield { ...b(), ...trip, resultFresh: true, emotion: 'serious', rankClimbed: true, runPointsThisWeek: 30 }
  yield { ...b(), ...trip, resultFresh: true, emotion: 'serious' }
  yield { ...b(), ...trip, resultFresh: true, emotion: 'sad' }
  yield { ...b(), ...trip, resultFresh: true, emotion: 'angry' }
  yield { ...b(), injured: { kind: 'ankle soreness', weeksRemaining: 3, totalWeeks: 3 }, emotion: 'rehab' }
  yield { ...b(), injured: { kind: 'ankle soreness', weeksRemaining: 2, totalWeeks: 3 }, emotion: 'rehab' }
  yield { ...b(), emotion: 'tired', condition: 35, conditionBand: 'worn' }
  yield { ...b(), emotion: 'serious', condition: 55, conditionBand: 'worn' }
  if (stage === 'school') yield { ...b(), examsWeek: true }
  for (const pkg of [null, 'staycation', 'grandma', 'camping', 'seaside', 'resort', 'elite', 'yacht-week']) {
    yield { ...b(), vacationWeek: true, vacationPackageId: pkg }
  }
  yield { ...b(), playedPractice: true }
  yield { ...b(), fundsPressure: 'tight' }
  yield { ...b(), offSeasonWeek: true }
  yield { ...b(), travelled: true }
  yield { ...b(), birthdayAge: Math.floor(age) }
}

/** One stable key per entry: the rendered text (templates rendered on fixed sample facts). The four
 *  deliberate silences share one key and one row – same claims, same licence, same decision. */
function keyOf(p: DiaryPhrase): string {
  const sample: DiaryFacts = {
    ...baseFacts('school', 15),
    injured: { kind: 'ankle soreness', weeksRemaining: 3, totalWeeks: 3 },
    birthdayAge: 15,
  }
  const t = typeof p.text === 'function' ? p.text(sample) : p.text
  return `${p.surface} :: ${t === null ? '<silence>' : t}`
}

// --- the declarations ------------------------------------------------------------------------
// ⚠ `any` = all four stages, no age bound – an explicit decision, not a default: an entry that is
// missing here fails the coverage arm below. `below`/`from` bound `ageYears` inside the declared
// stages (used only where a stage is wider than the line's moment – round 39 #1's whole finding).
type Gate = { stages: 'any' | DiaryLifeStage[]; below?: number; from?: number }
const S: DiaryLifeStage[] = ['school']
const A: DiaryLifeStage[] = ['after-school']
const HOME: DiaryLifeStage[] = ['school', 'after-school']
const AWAY: DiaryLifeStage[] = ['college', 'independent']
const I: DiaryLifeStage[] = ['independent']

const HOME_LINE_GATES: Record<string, Gate> = {
  // --- photo: birthday ---
  'photo :: Fifteen today. Somehow already.': { stages: HOME },
  'photo :: Fifteen. The candles made it official.': { stages: HOME },
  'photo :: Fifteen today. We found a gap in her calendar.': { stages: AWAY },
  'photo :: Fifteen. Cake when she could make it.': { stages: AWAY },
  // --- photo: fresh win ---
  "photo :: Can't stop smiling.": { stages: 'any' },
  'photo :: She hummed in the car the whole way home.': { stages: HOME },
  'photo :: She replayed the last point for us at dinner – twice.': { stages: HOME },
  'photo :: The trophy went straight onto the kitchen table.': { stages: HOME },
  'photo :: She fell asleep holding the draw sheet.': { stages: HOME },
  'photo :: A voice note after the last point. Mostly laughing.': { stages: AWAY },
  'photo :: The trophy appeared in a photo before she did.': { stages: AWAY },
  // --- photo: runner-up ---
  'photo :: Second place. The medal stayed in her bag.': { stages: 'any' },
  'photo :: A final. She knows what that is worth.': { stages: 'any' },
  'photo :: Runner-up. She pushed the final all the way.': { stages: 'any' },
  'photo :: Lost the final, and walked off with her head up.': { stages: 'any' },
  'photo :: A finalist. We let that word sit at dinner.': { stages: HOME },
  // --- photo: the good loss ---
  'photo :: Not a win – but she moved up the table.': { stages: 'any' },
  'photo :: She lost late, and climbed anyway.': { stages: 'any' },
  'photo :: Beaten on Saturday. Higher on Monday.': { stages: 'any' },
  // --- photo: softened / sad / angry losses ---
  'photo :: An early bus home. She was fine by evening.': { stages: HOME },
  'photo :: An early exit. She was fine on the evening call.': { stages: AWAY },
  "photo :: She didn't say much on the way home.": { stages: HOME },
  'photo :: She went straight to her room after dinner.': { stages: HOME },
  'photo :: Quiet in the car. Quiet at the table.': { stages: HOME },
  'photo :: Her bag is still packed by the door.': { stages: HOME },
  'photo :: One short message: home safe. Nothing about the match.': { stages: AWAY },
  'photo :: She called from the car park and talked about the weather.': { stages: AWAY },
  'photo :: The bag hit the hallway floor harder than it needed to.': { stages: HOME },
  'photo :: She slammed the car door. We let it go.': { stages: HOME },
  'photo :: The call lasted nineteen seconds. We let it be enough.': { stages: AWAY },
  // --- photo: injury, layoff, tiredness, focus ---
  'photo :: The ice pack lives on the kitchen counter now.': { stages: HOME },
  'photo :: The first photo was of the ice pack, not the injury.': { stages: AWAY },
  'photo :: She watches practice from the bench this week.': { stages: 'any' },
  'photo :: She counts the weeks to her return out loud.': { stages: 'any' },
  'photo :: Asleep before nine, two nights running.': { stages: HOME },
  'photo :: Slow mornings. Heavy bag.': { stages: 'any' },
  'photo :: The racquet stayed by the door all weekend.': { stages: HOME },
  'photo :: Her replies arrived the next morning.': { stages: AWAY },
  'photo :: Quieter than usual this week.': { stages: 'any' },
  'photo :: Focused, and a little far away at dinner.': { stages: HOME },
  'photo :: She called, then changed the subject before we could ask.': { stages: AWAY },
  // --- photo: the week itself ---
  'photo :: Textbooks where the grips usually are.': { stages: S },
  'photo :: A week away. The racquet stayed home.': { stages: 'any' },
  'photo :: Her own bed all week. Half the street in the kitchen.': { stages: 'any' },
  'photo :: Two trains and a bus. She slept on both trains.': { stages: 'any' },
  'photo :: The racquet did not come. The tent did.': { stages: 'any' },
  'photo :: Sea, sleep, sun – in that order, every day.': { stages: 'any' },
  'photo :: A week of swimming pools and physio beds.': { stages: 'any' },
  'photo :: A clinic full of people who do this for a living.': { stages: 'any' },
  'photo :: Seven days of water in every direction, and no telephone worth answering.': { stages: 'any' },
  'photo :: A hit-out at the club, nothing on the line.': { stages: 'any' },
  'photo :: We talk about money after she goes to bed.': { stages: HOME },
  'photo :: We talk about money after the call ends.': { stages: AWAY },
  // --- photo: ordinary weeks ---
  'photo :: She seems calm.': { stages: 'any' },
  'photo :: An ordinary week – school, practice, pasta.': { stages: S },
  'photo :: An ordinary week – practice, pasta, an early night.': { stages: A },
  'photo :: An ordinary week – practice, errands, an early night.': { stages: I },
  'photo :: Nothing to report. That is its own kind of good.': { stages: 'any' },
  'photo :: Homework at the kitchen table, racquet by the door.': { stages: S },
  'photo :: She missed the bus and ran for it, laughing.': { stages: S },
  'photo :: Pasta again. Nobody complained.': { stages: HOME },
  'photo :: Rain most of the week – practice moved indoors.': { stages: 'any' },
  'photo :: Her phone buzzed all evening. The homework got done anyway.': { stages: S },
  'photo :: A school project took the evenings – glue on everything.': { stages: S },
  'photo :: Groceries together on Saturday. She pushed the cart.': { stages: HOME },
  'photo :: A new month on the kitchen calendar. The same routine.': { stages: HOME },
  'photo :: Warm evenings – dinner ran long on the balcony.': { stages: HOME },
  'photo :: A voice note from the supermarket: no milk, plenty of string.': { stages: I },
  'photo :: She called while cooking. Something burned; the story survived.': { stages: I },
  'photo :: Her washing machine lost a fight with red clay.': { stages: I },
  // ⚠⚠ THE OWNER'S OWN LINE, and the round's whole point: a moving-out sentence, licensed to the
  // first flat years only. `below` is exclusive – at SETTLED_ADULT_AGE it may no longer print.
  'photo :: A spare key on her own ring. We are still getting used to that.': { stages: I, below: SETTLED_ADULT_AGE },
  // ...and its settled-years counterweight (round 39 #1's one new quiet line).
  'photo :: The Sunday call ran long. Nobody minded.': { stages: I, from: SETTLED_ADULT_AGE },
  'photo :: She came by for twenty minutes and stayed for dinner.': { stages: I },
  'photo :: The family chat got one photo: racquet, coffee, rain.': { stages: I },
  'photo :: She forgot to call. Then called twice on Sunday.': { stages: I },
  'photo :: Her calendar said rest. She said errands counted.': { stages: I },
  'photo :: <silence>': { stages: 'any' },
  // --- condition surface ---
  'condition :: Still tired from the J30 trip.': { stages: 'any' },
  'condition :: Match week – the travel and the tennis both took their cut.': { stages: 'any' },
  'condition :: On the road this week.': { stages: 'any' },
  'condition :: Out with the ankle soreness – 3 weeks to go.': { stages: 'any' },
  'condition :: Rehab sets the pace this week.': { stages: 'any' },
  'condition :: Exams took the week.': { stages: S },
  'condition :: School week – the court waited.': { stages: S },
  'condition :: A family week away – she came back lighter.': { stages: 'any' },
  'condition :: A week at home – nothing special, and it worked.': { stages: 'any' },
  "condition :: A week at her grandmother's – slow food, slow days, and it shows.": { stages: 'any' },
  'condition :: A week outdoors – tired legs, clear head.': { stages: 'any' },
  'condition :: A week by the sea, and she slept through most of it.': { stages: 'any' },
  'condition :: Rest with a programme – she came back moving properly.': { stages: 'any' },
  'condition :: The full programme, and it worked – she came back new.': { stages: 'any' },
  'condition :: A week where nothing could reach her, and her legs noticed first.': { stages: 'any' },
  'condition :: Off-season – rest, school, family.': { stages: S },
  'condition :: Off-season – rest, family, and the block where next year gets built.': { stages: A },
  'condition :: Off-season – rest, errands, and the block where next year gets built.': { stages: I },
  'condition :: A practice match, and the usual training.': { stages: 'any' },
  'condition :: A quiet training week.': { stages: 'any' },
  'condition :: Training, school, repeat.': { stages: S },
  'condition :: Training, sleep, repeat.': { stages: A },
  'condition :: Training, laundry, sleep, repeat.': { stages: I },
  'condition :: Fresh – the rest is paying off.': { stages: 'any' },
  'condition :: She is running on empty – a rest week would not hurt.': { stages: 'any' },
}

const allows = (g: Gate, stage: DiaryLifeStage, age: number): boolean =>
  (g.stages === 'any' || g.stages.includes(stage)) &&
  (g.below === undefined || age < g.below) &&
  (g.from === undefined || age >= g.from)

describe('round 39 #1 – every home flavour line declares its ages, and the licence obeys', () => {
  it('⭐ COVERAGE: every pool entry has a gate row, and every row still matches a line', () => {
    const keys = new Set(DIARY_POOL.map(keyOf))
    for (const key of keys) {
      expect(HOME_LINE_GATES[key], `no age/life-stage gate declared for: ${key}`).toBeDefined()
    }
    for (const declared of Object.keys(HOME_LINE_GATES)) {
      expect(keys.has(declared), `gate row matches no pool line (renamed or removed?): ${declared}`).toBe(true)
    }
    // the silences are the only shared key: 105 entries, 102 decisions
    expect(DIARY_POOL.length - keys.size, 'only the four silences may share a row').toBe(3)
  })

  it('⭐⭐ THE SWEEP: no line is selectable outside its declared stages and ages', () => {
    let checked = 0
    for (const { stage, age } of STAGE_POINTS) {
      for (const f of scenarios(stage, age)) {
        for (const p of DIARY_POOL) {
          if (!p.license(f)) continue
          checked++
          const gate = HOME_LINE_GATES[keyOf(p)]
          if (gate === undefined) continue // the coverage arm reports these with a better message
          expect(
            allows(gate, stage, age),
            `"${keyOf(p)}" is selectable at ${stage}/${age} but is gated to ${JSON.stringify(gate)}`,
          ).toBe(true)
        }
      }
    }
    // measured at 1412 licensed picks on the day this shipped; the floor is set where a sweep that
    // lost a whole surface or half the grid would trip it, not at the live number.
    expect(checked, 'the sweep must actually exercise the pool').toBeGreaterThan(1_000)
  })

  it('⚠ NON-VACUITY: every line is selectable somewhere inside its own window', () => {
    for (const p of DIARY_POOL) {
      const gate = HOME_LINE_GATES[keyOf(p)]
      if (gate === undefined) continue
      const alive = STAGE_POINTS.some(
        ({ stage, age }) => allows(gate, stage, age) && [...scenarios(stage, age)].some((f) => p.license(f)),
      )
      expect(alive, `"${keyOf(p)}" is licensed nowhere inside its declared window – dead copy or a wrong gate`).toBe(true)
    }
  })

  it('⭐⭐ THE NAMED LINE: the spare key prints in her first flat years and never at 35', () => {
    const spareKey = 'A spare key on her own ring. We are still getting used to that.'
    const licensedAt = (age: number) =>
      [...scenarios('independent', age)].some((f) =>
        DIARY_POOL.some((p) => p.license(f) && typeof p.text === 'string' && p.text === spareKey),
      )
    expect(licensedAt(22), 'the line vanished from the fresh years too – then nothing was gated, only deleted').toBe(true)
    expect(licensedAt(29), 'the moving-out line is still reachable at 29').toBe(false)
    expect(licensedAt(35), 'the owner reported exactly this at 35').toBe(false)
  })

  it('⚠ THE POOL DID NOT THIN: college and a 35-year-old still have a voice for the core weeks', () => {
    // The other half of the deliverable: lines absurd for an adult were gated away, so the adult
    // stages must still have at least one licensed PHOTO line for every core week shape – silence
    // where a family line used to leak would be a regression wearing a fix's name.
    const cores = (stage: DiaryLifeStage, age: number): DiaryFacts[] => {
      const b = () => baseFacts(stage, age)
      const trip = { travelled: true, playedTournament: true } as const
      return [
        { ...b(), ...trip, resultFresh: true, won: true, emotion: 'happy', runPointsThisWeek: 30 },
        { ...b(), ...trip, resultFresh: true, emotion: 'sad' },
        { ...b(), ...trip, resultFresh: true, emotion: 'angry' },
        { ...b(), emotion: 'tired', condition: 35, conditionBand: 'worn' },
        b(),
        { ...b(), birthdayAge: Math.floor(age) },
      ]
    }
    for (const [stage, age] of [['college', 20], ['independent', 35]] as const) {
      for (const f of cores(stage, age)) {
        const lines = DIARY_POOL.filter((p) => p.surface === 'photo' && p.text !== null && p.license(f))
        expect(lines.length, `no photo line at ${stage}/${age} for ${JSON.stringify(f)}`).toBeGreaterThan(0)
      }
    }
  })
})
