// THE KNOCK – the ordinary week gets something that HAPPENS and something he DECIDES.
//
// The owner, 30.07, asking the second time: «хочу вернуться к явно пропущенному пункту 3 из
// последнего раунда: Чтобы тренировочные недели не просто скипались нужно всё-таки видимо пришло
// время сделать какое-то пошаговый события Что происходит на этих неделях когда нет матчей а только
// тренировки».
//
// WHAT THE FIRST SLICE DID AND WHAT IT LEFT. W2 gave the training week a VOICE – a handwritten note
// on the Weekly Story, roughly one week in three, mostly about what the training plan is costing her
// (engine/diary.ts, WEEK_NOTES). Good, and it stays. But its own report named what it skipped, and
// the first line was "any choice with a cost". The owner then used the word события – events – so the
// missing half is not more prose. It is a week that CONTAINS something.
//
// =================================================================================================
// THE ONE EVENT KIND, AND WHY IT IS THIS ONE
// =================================================================================================
//
// She comes off court on a Friday with something sore. Not an injury – a KNOCK. The parent decides:
// rest it, or send her back out.
//
// Chosen over the alternatives (a friend's birthday against a training block; an invitation to hit
// with somebody better; a school trip clashing with the calendar) for three reasons, all of them
// about wiring rather than fiction:
//
//  1. IT PAYS INTO SYSTEMS THAT ALREADY EXIST. Resting costs a share of the week's development
//     (`growWeek`'s new `loadFactor`); pushing multiplies the injury threshold (`injuryTau`, whose
//     post-draw-multiply pattern three other knobs already use). Nothing new is invented to hold the
//     consequence – the two currencies the game already runs on are skill and availability.
//  2. BOTH BRANCHES COST. See the farming note below; it is the constraint that killed the other
//     candidates. An invitation to hit with a better player is a branch the player always accepts,
//     and a "yes please" branch is not a decision.
//  3. IT CLOSES THE LOOP ON THE FIRST SLICE. `plan.train` is the one number in the week that is HIS
//     choice, and W2's notes are mostly about it. The knock's arrival probability is driven by that
//     same number: grind her and the knocks come. The prose said what Grind costs; this charges it.
//
// =================================================================================================
// ⚠ WHAT STOPS IT BEING FARMED – the question that has to be answered before the numbers
// =================================================================================================
//
// A choice that can be optimised into free progress gets ground, and then the week stops being a
// week. Four properties, and they hold together:
//
//  (a) NEITHER BRANCH IS A GAIN. Resting gives up `1 - KNOCK_REST_GROWTH` of a week's development at
//      EVERY plan setting (it is a multiplier on the week's growth, deliberately NOT a lower
//      `plan.train` – `trainFactor` clamps below 60, so a Light-plan career would have rested for
//      free). Pushing keeps the week whole and buys a loaded injury roll for KNOCK_PUSH_WEEKS weeks.
//      There is no third button and no branch that ends better than the week would have ended
//      without the knock at all.
//  (b) HE CANNOT CAUSE ONE. The arrival is a draw the player never touches, and its probability
//      rises with grinding and with fatigue – i.e. with exactly the behaviour that "farming" would
//      require. The rest branch's small condition credit (KNOCK_REST_CONDITION) is worth less than
//      the rest-slider bonus a Light week hands out for nothing, so the cheapest way to get that
//      condition is still to set the plan to Light and never see a knock.
//  (c) THE PAYOFF FOR PUSHING IS NEGATIVE-EXPECTATION, NOT FREE-UNTIL-CAUGHT. At condition 60 the
//      injury threshold is ~4.5%/wk; KNOCK_PUSH_TAU takes it to ~10% for three weeks, and an injury
//      costs 1-22 weeks out plus scans plus whatever entries the layoff swallows. A player who
//      always pushes is buying weeks of development with weeks of availability at a bad rate.
//  (d) IT IS RATE-LIMITED. KNOCK_COOLDOWN_WEEKS after one retires, no new knock can arrive – so a
//      grinding career gets a decision often enough to matter and never often enough to be a
//      treadmill.
//
// The decision is therefore always "which currency do I pay in", never "do I want this". That is the
// line between an event and an economy.
//
// =================================================================================================
// ⚠ RNG DISCIPLINE – the draw lives inside the tick, so this is the paragraph that matters
// =================================================================================================
//
// Everything here draws from `seed:knock:<week>`, a purpose-scoped per-week sub-stream created fresh
// and thrown away – the identical pattern `rollInjury` uses for `seed:injury:<week>`, which is the
// proof that a draw INSIDE the weekly tick is safe as long as it is not the tick's own generator.
// ZERO draws on the MAIN weekly stream, so the frozen capture (41550 draws / hash e6b0c709) cannot
// move: the main stream still carries base costs + cohort drift and nothing else. The tau multiply
// is POST-DRAW on the threshold (see `knockTauFactor`), the same invariance-safe shape as
// `physio.riskReduction` and the vacation's recovery buff, so the private `seed:injury:<week>`
// sequence is untouched too.
//
// The module is PURE: it never imports world.ts (world.ts imports it), and everything it needs
// arrives as a narrow `KnockWorldView`. Same dependency shape diary.ts, kidLife.ts and radar.ts have.
//
// Player copy: English, short dash "-" only, and the register is engine/diary.ts's – the parent
// observing, plain, present tense, no adjective she could not have seen. The coach's read is FOGGED
// on purpose (buildTrainingRead's idiom): he is a man with an opinion, not a probability readout.

import { rngFromSeed } from './rng'
import { planWeek, planSessions, sessionCounts } from './plan'
import { SESSION_KINDS, type SessionKind } from '../shared/protocol'
import type { Knock, KnockChoice, KnockPrompt, KnockRecord, WeekPlan } from '../shared/protocol'

// =================================================================================================
// 1. THE KNOBS
// =================================================================================================

/** An ordinary training week at Balanced, on a body with nothing wrong with it. */
export const KNOCK_BASE_CHANCE = 0.1
/** ...plus this per point of FATIGUE (100 - condition). A worn body picks things up. */
export const KNOCK_FATIGUE_SLOPE = 0.0022
/** ...plus this per point of `plan.train` ABOVE Balanced, and MINUS it below.
 *
 *  This is the whole point of the term and the reason it is signed: Light (60) lands the chance near
 *  2% and Grind (85) near a quarter, so the decision the player makes every week in the planner is
 *  what decides how often the game asks him a harder one. */
export const KNOCK_TRAIN_SLOPE = 0.006
/** The plan setting the train term is measured FROM - `WEEK_PLAN_PRESETS.balanced.train`, quoted here
 *  as a number so this module stays free of an import it needs nothing else from. */
export const KNOCK_TRAIN_PIVOT = 75
/** Floor and ceiling on the arrival chance. The floor keeps a pampered career from being immune
 *  (bodies are bodies); the ceiling keeps a grinding one from being asked every single week. */
export const KNOCK_CHANCE_FLOOR = 0.005
export const KNOCK_CHANCE_CAP = 0.34

/** Weeks after a knock retires before another one can arrive. */
export const KNOCK_COOLDOWN_WEEKS = 4

/** How long a knock she was sent back out on keeps loading the injury roll. */
export const KNOCK_PUSH_WEEKS = 3
/** ...and by how much. Post-draw multiply on the threshold, so `injuryChanceCap` still caps it. */
export const KNOCK_PUSH_TAU = 2.2
/** ...and by how much on a part he has ALREADY sent her back out on once. The thread's payoff: the
 *  second time the same shoulder complains, ignoring it is a different bet. */
export const KNOCK_REPEAT_TAU = 3.0

/** The share of a week's development a RESTED week still earns.
 *
 *  ⚠ A MULTIPLIER, NOT A LOWER `plan.train`. `trainFactor` clamps `(train - 60) / 25` to [0, 1], so
 *  writing the rest week as train:40 would develop it at exactly the Light rate - and a career
 *  already on Light would then rest for FREE. This is the hole that shape had, and it is why the
 *  cost is expressed on the growth itself. */
export const KNOCK_REST_GROWTH = 0.35
/** ...and what a rested week gives back. Deliberately SMALL - see the farming note (b): it has to be
 *  worth less than the rest-slider bonus a Light week hands out for nothing, or a knock becomes
 *  something to want. The value of resting is that the injury roll never gets loaded, not this. */
export const KNOCK_REST_CONDITION = 3

// =================================================================================================
// 2. WHERE IT HURTS
// =================================================================================================
//
// ⚠ ITS OWN LIST, and not `world.ts`'s BODY_REGIONS - which is a real duplication question, so here
// is the answer. That table is the epidemiology of tennis INJURIES and includes an abdominal tear;
// this is the list of things a fifteen-year-old mentions in a car on a Friday, which is the
// load-bearing joints and nothing else. A knock is a complaint, not a diagnosis. Keeping them
// separate is also what lets the injury table be re-tuned from research without silently rewording
// a dialog.

/** Where a training knock lands, weighted. Roughly the load-bearing half of the injury table,
 *  renormalised - the joints a week of drilling actually complains about. */
export const KNOCK_PARTS: readonly { part: string; weight: number }[] = [
  { part: 'shoulder', weight: 0.18 },
  { part: 'knee', weight: 0.17 },
  { part: 'ankle', weight: 0.15 },
  { part: 'wrist', weight: 0.13 },
  { part: 'lower back', weight: 0.13 },
  { part: 'elbow', weight: 0.11 },
  { part: 'hip', weight: 0.07 },
  { part: 'foot', weight: 0.06 },
]

// =================================================================================================
// ⚠ A KNOCK LANDS WHERE SHE WORKED (v47, docs/specs/training-dials.md §5) – AND IT COSTS NO NEW DRAW
// =================================================================================================
//
// This is the fourth of the four things that make a monomaniac week self-limiting without a rule
// against it, and it is the one that turns the other three into a STORY. Six weeks of serving develops
// a shoulder; `pushedParts`' accumulating thread then makes that shoulder her career's rather than a
// series of unrelated Fridays.
//
// ⚠ THE DRAW DOES NOT MOVE, AND THAT IS THE WHOLE MECHANISM. `drawKnock` takes arrival, repeat and
// part unconditionally and in a fixed order BEFORE it compares anything; weighting the table changes
// what `partRoll` MAPS TO, never what `partRoll` IS. The same single uniform, a different table. Zero
// draws added, on any stream, so the frozen MAIN capture cannot see this at all.

/** What each kind of session LOADS – the joints, not the skills, which is why this table lives here
 *  and not beside `SESSION_AIM`. Same argument the note above `KNOCK_PARTS` already makes for keeping
 *  this list separate from `BODY_REGIONS`: a knock is a complaint, not a diagnosis, and the anatomy of
 *  what a drill does to a fifteen-year-old is knock.ts's own subject.
 *
 *  ⚠ `general` LOADS NOTHING, AND THAT IS NOT AN OMISSION. An ordinary mixed week is what the shipped
 *  table already describes – it is where those eight weights came from – so a week of general practice
 *  must draw through `KNOCK_PARTS` untouched. It is also what makes a v46 career's knocks land exactly
 *  where they landed before. */
const KIND_LOADS: Record<SessionKind, readonly string[]> = {
  general: [],
  serve: ['shoulder', 'elbow', 'wrist', 'lower back'],
  rally: ['wrist', 'elbow', 'shoulder', 'lower back'],
  fitness: ['knee', 'ankle', 'foot', 'hip'],
  matchplay: ['knee', 'ankle', 'hip', 'lower back'],
}

/** How far a week that is ENTIRELY one kind tilts its joints. 2.0 – a fully aimed week roughly doubles
 *  the odds on the parts it loads, before renormalisation pulls the rest down to pay for it.
 *
 *  ⚠ IT IS A TILT AND NOT A RISK. `knockChance` – how OFTEN a knock arrives – is untouched by any of
 *  this and still reads only fatigue and the session count, so aiming a week cannot make her pick more
 *  things up. It decides WHERE, given that one arrived, which is the difference between a consequence
 *  and a penalty («мы ни за что не наказываем»). */
export const KNOCK_AIM_TILT = 2.0

/** WHAT THIS WEEK LOADED, as a share of the week per part - the fold both tilted tables read.
 *
 *  Empty when the week holds no sessions, and empty when every session was `general` (which loads
 *  nothing by design - see `KIND_LOADS`). An empty map is the signal to return the shipped table
 *  untouched, which is what makes an ordinary week byte-identical.
 *
 *  ⚠ EXPORTED FOR THE INJURY SIDE (docs/specs/match-retirement.md §5), and only the FOLD is shared,
 *  not the table. `KNOCK_PARTS` is what a fifteen-year-old mentions in a car on a Friday;
 *  `BODY_REGIONS` is the epidemiology of tennis injuries, twelve entries including an abdominal
 *  tear. Sharing this map lets a retirement land where she worked without either module inheriting
 *  the other's anatomy - the note above `KNOCK_PARTS` argues at length for keeping those apart and
 *  that argument is unchanged. Pure; zero draws. */
export function loadedPartShares(week: readonly (readonly SessionKind[])[]): ReadonlyMap<string, number> {
  const out = new Map<string, number>()
  const sessions = planSessions(week)
  if (sessions === 0) return out
  const counts = sessionCounts(week)
  for (const kind of SESSION_KINDS) {
    const n = counts[kind]
    if (n === 0) continue
    for (const part of KIND_LOADS[kind]) out.set(part, (out.get(part) ?? 0) + n / sessions)
  }
  return out
}

/** The part table this week draws through. Returns the SHIPPED array itself when nothing tilts it, so
 *  an ordinary week walks byte-identical cumulative sums.
 *
 *  ⚠ THE IDENTITY RETURN IS LOAD-BEARING, NOT AN OPTIMISATION. `KNOCK_PARTS`' eight weights sum to 1.0
 *  in decimal and not necessarily in binary, so a renormalising pass over an all-ones tilt would divide
 *  every weight by something like 0.9999999999999999 and could flip a boundary uniform into the
 *  neighbouring part. That is a shipped career's knock moving for no reason anyone could see. */
export function knockPartWeights(week: readonly (readonly SessionKind[])[]): readonly { part: string; weight: number }[] {
  const loaded = loadedPartShares(week)
  if (loaded.size === 0) return KNOCK_PARTS
  let total = 0
  const tilted = KNOCK_PARTS.map((p) => {
    const share = loaded.get(p.part) ?? 0
    const weight = p.weight * (1 + (KNOCK_AIM_TILT - 1) * share)
    total += weight
    return { part: p.part, weight }
  })
  // Renormalise: the tilt REDISTRIBUTES where a knock lands, it never changes how often one arrives.
  return tilted.map((p) => ({ part: p.part, weight: p.weight / total }))
}

/** One pull, walked cumulatively - the same shape `drawBodyRegion` uses. */
function drawPart(u: number, table: readonly { part: string; weight: number }[]): string {
  let cum = 0
  for (const p of table) {
    cum += p.weight
    if (u < cum) return p.part
  }
  return table[table.length - 1].part
}

/** How often a new knock lands on a part he has already sent her back out on, when there is one.
 *
 *  THE ACCUMULATING THREAD, and it is one number. A knock he rested is closed; a knock he pushed
 *  through is a part of her body that is now on the record, and it is the one that speaks up again.
 *  Not certainty - she is a whole person and things go wrong everywhere - but often enough that a
 *  career that keeps pushing develops a WEAK SHOULDER rather than a series of unrelated Fridays. */
export const KNOCK_REPEAT_CHANCE = 0.55

// =================================================================================================
// 3. THE ARRIVAL
// =================================================================================================

/** The narrow slice of the world a knock is allowed to read. */
export interface KnockWorldView {
  seed: string
  week: number
  condition: number
  plan: WeekPlan
  /** every knock that has already retired, oldest first */
  history: readonly KnockRecord[]
}

/** The chance a knock arrives this week. Pure, and the ONLY place the three terms meet. */
export function knockChance(condition: number, plan: WeekPlan): number {
  const fatigue = 100 - condition
  const raw =
    KNOCK_BASE_CHANCE + fatigue * KNOCK_FATIGUE_SLOPE + (plan.train - KNOCK_TRAIN_PIVOT) * KNOCK_TRAIN_SLOPE
  return Math.min(KNOCK_CHANCE_CAP, Math.max(KNOCK_CHANCE_FLOOR, raw))
}

/** The parts he has sent her back out on, newest first - the shortlist a repeat is drawn from. */
export function pushedParts(history: readonly KnockRecord[]): string[] {
  const seen: string[] = []
  for (let i = history.length - 1; i >= 0; i--) {
    const r = history[i]
    if (r.choice === 'push' && !seen.includes(r.part)) seen.push(r.part)
  }
  return seen
}

/** Has enough time passed since the last knock retired? */
export function offCooldown(view: KnockWorldView): boolean {
  const last = view.history[view.history.length - 1]
  if (!last) return true
  return view.week - last.untilWeek >= KNOCK_COOLDOWN_WEEKS
}

/**
 * Roll for a knock on an ordinary training week, or null.
 *
 * THREE DRAWS, ALWAYS IN THIS ORDER, off `seed:knock:<week>` - the arrival coin, the repeat coin and
 * the part. Taking them unconditionally in a fixed order is what keeps the sequence stable when the
 * knobs are re-tuned: a career's week 30 draws the same three numbers whatever the chance function
 * says about them. ZERO draws on the MAIN weekly stream.
 *
 * The caller decides WHICH weeks are ordinary training weeks (see world.ts `rollKnock`); this
 * function is only the dice and the anatomy.
 */
export function drawKnock(view: KnockWorldView): Knock | null {
  const rng = rngFromSeed(`${view.seed}:knock:${view.week}`)
  const arrival = rng()
  const repeatRoll = rng()
  const partRoll = rng()
  if (arrival >= knockChance(view.condition, view.plan)) return null

  const pushed = pushedParts(view.history)
  const repeatPart = pushed.length > 0 && repeatRoll < KNOCK_REPEAT_CHANCE ? pushed[0] : null
  // ⚠ THE SAME `partRoll`, A DIFFERENT TABLE (v47, §5). One uniform in, one part out, exactly as
  // before – see `knockPartWeights`. Zero draws added.
  const part = repeatPart ?? drawPart(partRoll, knockPartWeights(planWeek(view.plan)))
  return {
    part,
    sinceWeek: view.week,
    // A repeat is a statement about the RECORD, not about which coin came up: any knock on a part he
    // has pushed through before reads as one, including the ~45% of them the part draw found by
    // itself. `pushed` is the ledger, so this cannot disagree with the history the dialog quotes.
    repeat: pushed.includes(part),
    choice: null,
    untilWeek: view.week,
  }
}

// =================================================================================================
// 4. WHAT THE DECISION DOES
// =================================================================================================

/** The week a knock stops mattering, given the choice made about it. Rest is ONE week off; pushing
 *  through carries the loaded roll for KNOCK_PUSH_WEEKS. One field, one rule, both branches. */
export function knockUntilWeek(knock: Knock, choice: KnockChoice): number {
  return knock.sinceWeek + (choice === 'rest' ? 1 : KNOCK_PUSH_WEEKS)
}

/** Is this knock still live in `week`? */
export function knockLive(knock: Knock | null, week: number): boolean {
  return knock !== null && week <= knock.untilWeek
}

/** ⚠ POST-DRAW MULTIPLY on the injury threshold - the invariance pattern `physio.riskReduction` and
 *  the vacation recovery buff already use, which is why this can sit inside `injuryTau` without
 *  moving a single draw on any stream. 1 when nothing is being pushed through. */
export function knockTauFactor(knock: Knock | null, week: number): number {
  if (!knockLive(knock, week) || knock!.choice !== 'push') return 1
  return knock!.repeat ? KNOCK_REPEAT_TAU : KNOCK_PUSH_TAU
}

/** Is `week` the one week she spends resting a knock? The week that pays KNOCK_REST_GROWTH. */
export function knockRestWeek(knock: Knock | null, week: number): boolean {
  return knockLive(knock, week) && knock!.choice === 'rest'
}

/**
 * Is `week` one of the weeks THE DECISION GOVERNS - i.e. `sinceWeek + 1 .. untilWeek`, answered, and
 * excluding the knock's own arrival week?
 *
 * ⚠ THE ARRIVAL WEEK IS NOT ONE OF THEM, and the tick's own order is the proof rather than the
 * intention: `growWeek` (step 3b) runs BEFORE `rollKnock` (step 3c), so the week the knock arrives on is
 * banked at the full rate with `world.knock` still null. She trained six days and came off court sore on
 * the Friday. The cost - and the loaded roll - start the week after.
 *
 * IT EXISTS BECAUSE `knockLive` IS TRUE ON THE ARRIVAL WEEK TOO (`week <= untilWeek` and
 * `untilWeek >= sinceWeek`), which is harmless for the two engine knobs by accident of that ordering and
 * NOT harmless for anything that DESCRIBES the week. W6 found it with a picture: the moment he answered
 * "rest", the still-current week-N story started drawing her at home and captioning it «A week off the
 * ankle» - about a week she spent on court. The scrap had been doing it since W4. One predicate, so the
 * frame and the words cannot disagree about which week the decision is about.
 */
export function knockGoverns(knock: Knock | null, week: number): boolean {
  return knockLive(knock, week) && knock!.choice !== null && week > knock!.sinceWeek
}

// =================================================================================================
// 5. WHAT THE PLAYER READS
// =================================================================================================
//
// THE DIALOG IS THE WHOLE FEATURE, so its copy is engine state and not template text - the same rule
// KidScreen keeps ("that screen is not allowed to derive a fact of its own"). Three parts, and each
// one answers a different question:
//
//   the LINE     - what happened. The parent's own sentence, in the diary's register.
//   the READ     - what the coach makes of it. FOGGED, deliberately: `buildTrainingRead`'s idiom is
//                  that this person gives opinions, not percentages, and a dialog that printed "+9.9%
//                  injury risk for 3 weeks" would turn a decision into arithmetic. The fog varies
//                  with the two facts the coach can actually see - how worn she is, and whether this
//                  is the same part as last time.
//   the two COSTS - one plain sentence each, and this is the "legible" requirement: the player must
//                  be able to see what he traded. They name the currency (a week's work / the odds),
//                  never a number.

/** The parent's sentence. Selected by part, not by luck: the shoulder line is about a shoulder. */
function knockLineFor(part: string, repeat: boolean, pick: number): string {
  if (repeat) {
    const pool = [
      `It is the ${part} again. She mentioned it in the car, then said it was nothing.`,
      `The same ${part}. She rolled it out on the kitchen floor and did not look up.`,
      `Her ${part} is talking to her again. She knows we noticed.`,
    ]
    return pool[pick % pool.length]
  }
  const pool = [
    `She came off court on Friday holding her ${part}.`,
    `Her ${part} was sore all week. She only said so on Sunday.`,
    `Ice on her ${part} after Thursday. She says it is fine.`,
    `She has been favouring the ${part} since midweek.`,
  ]
  return pool[pick % pool.length]
}

/** The coach's read. The coach can see two things - how worn she is, and the record - so those are
 *  the two axes, and every line is a plain opinion with no number in it.
 *
 *  ⚠ NO PRONOUN FOR THE COACH, ANYWHERE (R15-7, owner 09.08: «у Тернеров в списке везде "He", хотя
 *  там есть и женщины, можем просто убрать это и через дефис оба предложения написать, тогда не надо
 *  будет угадывать»). `buildCoachRoster` draws a first name from COACH_FIRST_M *or* COACH_FIRST_F by
 *  `slot.gender`, so a woman is on every roster by construction and every one of these lines used to
 *  call her "he". His own fix is the one taken: drop the pronoun, and join the two sentences with a
 *  dash so nothing has to guess. The VOICE is the thing that must survive it - these are somebody
 *  speaking, and a line rewritten into the passive to dodge a pronoun would trade one wrong note for
 *  a worse one. */
function knockReadFor(condition: number, repeat: boolean, pick: number): string {
  if (repeat) {
    const pool = [
      'The coach was blunter this time – has seen this one before, and does not like it.',
      'The coach remembers the last time – would sit her down, and said so twice.',
      'The coach asked how long it has been doing this – and did not like the answer.',
    ]
    return pool[pick % pool.length]
  }
  if (condition < 50) {
    const pool = [
      'The coach thinks she is running on empty and the body is saying so.',
      'The coach has seen her tired for weeks – would take the week.',
      'The coach says a body this flat picks things up – and would rather not find out.',
    ]
    return pool[pick % pool.length]
  }
  const pool = [
    'The coach is not worried – and is not telling us to ignore it either.',
    'The coach shrugged – would let her train and keep an eye on it.',
    'The coach says it is probably nothing – probably, and that word is not ours.',
    'The coach says these come and go at her age – and left the decision with us.',
  ]
  return pool[pick % pool.length]
}

/** Everything the dialog shows, assembled at SNAPSHOT time.
 *
 *  ⚠ ON ITS OWN SUB-STREAM, `seed:knockread:<sinceWeek>` - keyed on the knock's own week rather than
 *  on the current one, so the wording is fixed for as long as the knock is open. A key with the
 *  CURRENT week in it would reword the dialog underneath a player who left it up while he thought
 *  about it. Nothing here runs in the tick; zero MAIN draws. */
export function buildKnockPrompt(knock: Knock, seed: string, condition: number): KnockPrompt {
  const rng = rngFromSeed(`${seed}:knockread:${knock.sinceWeek}`)
  const linePick = Math.floor(rng() * 97)
  const readPick = Math.floor(rng() * 97)
  return {
    part: knock.part,
    repeat: knock.repeat,
    line: knockLineFor(knock.part, knock.repeat, linePick),
    read: knockReadFor(condition, knock.repeat, readPick),
    // THE TWO COSTS, and they are the deliverable. One sentence each, naming the currency and not
    // the number - "a week of work" is a thing a parent understands, "loadFactor 0.35" is not.
    restCost: 'She trains next to nothing for a week. That week of work is gone.',
    pushCost: knock.repeat
      ? 'She trains as planned. If this one goes, it goes properly – and it will be the same ' +
        `${knock.part}.`
      : 'She trains as planned, and for the next three weeks the odds are against us.',
  }
}
