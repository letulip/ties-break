// THE WEEK IS THE PLAN – seven days, five kinds of session, and the limit the engine already believed.
//
// THE OWNER, 09.08: «у нас есть расписание недели и на каждый день там идут разные тренировки – это и
// есть ручки... для выбора родителя надо сделать строчку с названием занятия а ниже набор из 7 галочек
// на каждый день недели – он кликает и решает когда что тренировать.»
//
// WHAT THIS FILE REPLACES. Until v47 the training week was ONE NUMBER. `plan.train` was read as a
// percentage of seven days by `composables/weekDays.ts`, laid out by two fixed priority lists, and
// none of it reached the engine – that file's own header said so: «the engine resolves whole WEEKS and
// knows nothing of days». The calendar was a drawing of a scalar. Now the ticks ARE the plan, and this
// module is the one place that knows what a week of them adds up to.
//
// ⚠ VOLUME AND EMPHASIS ARE NOT CONTROLS. They are what the ticked week adds up to: how many ticks
// there are is the volume, which rows they are in is the emphasis, which columns they are in is the
// arrangement. The player sets none of the three directly, and nothing here has a setter for them.
//
// ⚠ WHAT THE ENGINE READS FROM THE TICKS, exhaustively, and NEVER A TIME OF DAY: how many sessions
// there are, which kinds, and how many share a day. `weekGrid.ts`'s «Времени суток у движка нет и не
// будет» is untouched by this slice and stays true.
//
// =================================================================================================
// ⚠ RNG: NOTHING HERE DRAWS, ON ANY STREAM
// =================================================================================================
//
// Every function below is arithmetic over a matrix of strings. The plan is PLAYER INPUT, so this is
// not a convenience but the load-bearing property of the whole slice: CLAUDE.md invariant 2 says a
// no-action run and an action-laden run must tap identical MAIN sequences, and the week is the biggest
// piece of player input the tick has ever read. Everything this module feeds – `aimWeights`
// (development.ts), `knockPartWeights` (knock.ts), `doublingShare` (world/summer.ts) – is consumed as
// a POST-DRAW multiply or as a different TABLE for a draw that was already taken, which is the pattern
// `knockTauFactor`, `physioRiskFactor` and the vacation buff each shipped under.
//
// =================================================================================================
// DEPENDENCY DIRECTION – this module is a LEAF and imports nothing from the engine
// =================================================================================================
//
// It knows about days and kinds and nothing about skills, joints or condition. `development.ts` owns
// the kind -> SKILL table, `knock.ts` owns the kind -> JOINT table, and `world/summer.ts` owns what a
// doubled day is worth. All three import from here; none of them is imported back. That is deliberate:
// a cycle through `SKILL_KEYS` (a live draw order) is exactly the kind of import this codebase has
// been bitten by, and there is no reason for the calendar to know what a shoulder is.
import { WEEK_PLAN_PRESETS, SESSION_KINDS, type SessionKind, type WeekPlan } from '../shared/protocol'

/** Monday..Sunday. The same seven-day span `shared/dates.ts` builds every date range from. */
export const PLAN_DAYS = 7

/** ⚠ SETTLED, AND DELIBERATELY NOT WIDENED. The owner, asked whether the 4/5/6 band should move:
 *  «зачем? ну нас всё ок в этом плане я считаю». Four ticks is her minimum and six her maximum,
 *  whatever week it is – so the three presets stay exactly the three volumes the game has, and the
 *  matrix is a way of ARRANGING them rather than a way of buying more. */
export const PLAN_MIN_SESSIONS = 4
export const PLAN_MAX_SESSIONS = 6

/** ONE SESSION A DAY ON AN ORDINARY SCHOOL DAY, TWO ON A DAY WITH NO SCHOOL.
 *
 *  ⚠ THIS IS NOT A NEW RULE AND IT WAS NOT INVENTED HERE – four places in the shipped game already
 *  said it, and the owner asked only that it be SHOWN («Есть ограничение у нас по количеству
 *  тренировок в день в обычные дни и без школы, это тоже надо показать»):
 *    * `ECONOMY.summerBlock` – whose own note calls the nine-week holidays "two sessions a day";
 *    * `ECONOMY.school` – which says the same of every week past the last school year;
 *    * `engine/world/summer.ts` – `summerBlockWeek()` / `pastSchool()`, the predicate both halves read;
 *    * `composables/weekDays.ts`'s `trainingReadout()`, which has been PRINTING «N days on, two
 *      sessions a day» under the calendar for weeks against a plan that could not do it.
 *  The constants below are that belief, given a name the plan can be checked against. */
export const DAY_CAPACITY_SCHOOL = 1
export const DAY_CAPACITY_FREE = 2

/** Rest is claimed in THIS order: Sunday (the week's day off), then Wednesday, then Friday. Moved
 *  here from `composables/weekDays.ts` – which re-exports the two functions below under their
 *  historical names – because the v46 -> v47 migration has to lay a week out and the engine may not
 *  import a composable (CLAUDE.md invariant 1).
 *
 *  ⚠ ITS JOB CHANGED WITH THE MOVE AND THE OLD ONE IS GONE (spec §9e). It used to BE the model: the
 *  week's shape, derived from a scalar, for a screen that could not be edited. It is now the PRESET
 *  EXPANDER – the arrangement a preset lays down, and the arrangement a migrated career reads back
 *  as. The player overwrites it with one tap. */
const REST_PRIORITY: readonly number[] = [6, 2, 4, 1, 5, 3, 0]

/** ...and therefore the order a session lands in when one has to be MOVED (see `resolveWeek`): the
 *  exact reverse, so the day rest is claimed LAST is the day work is claimed FIRST. Derived rather
 *  than written out, so the two orders cannot drift apart. */
const WORK_PRIORITY: readonly number[] = [...REST_PRIORITY].reverse()

/** How many sessions `plan.train` buys, as a share of the seven days. Total and monotone: a higher
 *  train percentage can never buy fewer sessions.
 *
 *  ⚠ STILL EXACTLY WHAT IT WAS, and it is now a LEGACY reader rather than the model – it answers
 *  "what week was this scalar drawing", which is the question the migration asks. */
export function sessionsForPlan(trainPct: number): number {
  const raw = Math.round((trainPct / 100) * PLAN_DAYS)
  return Math.max(0, Math.min(PLAN_DAYS, raw))
}

/** Which day indexes are sessions, by REST_PRIORITY. Ascending, Monday first. */
export function sessionDays(sessions: number): number[] {
  const resting = new Set(
    REST_PRIORITY.slice(0, Math.max(0, PLAN_DAYS - Math.max(0, Math.min(PLAN_DAYS, sessions)))),
  )
  const out: number[] = []
  for (let d = 0; d < PLAN_DAYS; d++) if (!resting.has(d)) out.push(d)
  return out
}

/**
 * THE WEEK A PLAN MEANS – the single reader, and the reason `WeekPlan.week` may be absent.
 *
 * ⚠ ABSENCE IS NOT A HOLE, IT IS THE OLD WEEK. A save written before v47 (or any `{ train, rest }`
 * literal in a test or a bench) carries no matrix, and the honest reading of one is not "empty" – it
 * is the week the Calendar has been drawing for that scalar all along: `sessionsForPlan` days, laid
 * out by `sessionDays`, every one of them an ordinary mixed practice. That is byte-for-byte what the
 * v46 -> v47 migration writes into the save, so a migrated career and an unmigrated literal can never
 * disagree about what the same number means.
 *
 * ⚠ AND IT DOES NOT CLAMP TO 4..6. `sessionsForPlan(100)` is seven, and a plan poked to `train: 100`
 * has to keep developing and billing exactly as it does today (`trainFactor` clamps, and
 * `coachHoursForPlan` clamps, and BOTH are what the shipped behaviour is). The 4..6 band is enforced
 * on `setPlan` – on new PLAYER input – and never retroactively on a career that already exists.
 */
export function planWeek(plan: WeekPlan): SessionKind[][] {
  if (plan.week) return plan.week
  const days = new Set(sessionDays(sessionsForPlan(plan.train)))
  const out: SessionKind[][] = []
  for (let d = 0; d < PLAN_DAYS; d++) out.push(days.has(d) ? ['general'] : [])
  return out
}

/** How many sessions the week holds. THE VOLUME – and the only thing the bill reads. */
export function planSessions(week: readonly (readonly SessionKind[])[]): number {
  let n = 0
  for (const day of week) n += day.length
  return n
}

/** How many of each kind. THE EMPHASIS, counted once so three consumers cannot count it differently. */
export function sessionCounts(week: readonly (readonly SessionKind[])[]): Record<SessionKind, number> {
  const out = {} as Record<SessionKind, number>
  for (const k of SESSION_KINDS) out[k] = 0
  for (const day of week) for (const kind of day) out[kind] = (out[kind] ?? 0) + 1
  return out
}

/** The `train` percentage a session count projects to – the three presets read backwards, so 4/5/6
 *  land on exactly 60/75/85 and every legacy reader of `plan.train` is byte-identical.
 *
 *  Outside 4..6 it holds the ends rather than extrapolating: `setPlan` refuses those weeks anyway,
 *  and a projection that ran off the ladder would price a week the game cannot contain. */
export function planTrainPct(sessions: number): number {
  if (sessions <= PLAN_MIN_SESSIONS) return WEEK_PLAN_PRESETS.light.train
  if (sessions >= PLAN_MAX_SESSIONS) return WEEK_PLAN_PRESETS.grind.train
  return WEEK_PLAN_PRESETS.balanced.train
}

/** The plan a ticked week projects to. THE ONLY PLACE `train`/`rest` ARE DERIVED, so the projection
 *  cannot drift from the matrix it is a projection of. */
export function planFromWeek(week: readonly (readonly SessionKind[])[]): WeekPlan {
  const train = planTrainPct(planSessions(week))
  return { train, rest: 100 - train, week: week.map((day) => [...day]) }
}

/** How many sessions one day may hold this week. `schoolFree` is `summerBlockWeek`'s own verdict –
 *  asked of the world by the caller, never re-derived here (this module has no world). */
export function dayCapacity(schoolFree: boolean): number {
  return schoolFree ? DAY_CAPACITY_FREE : DAY_CAPACITY_SCHOOL
}

/** Days that hold two sessions. What `summerBlock.loadFactor` is now the price of. */
export function doubledDays(week: readonly (readonly SessionKind[])[]): number {
  let n = 0
  for (const day of week) if (day.length >= DAY_CAPACITY_FREE) n++
  return n
}

/**
 * HOW DOUBLED THIS WEEK IS, 0..1 – and since v47 this, rather than the calendar, is what the
 * school-free bonus follows.
 *
 * ⚠ THE OWNER RULED THE DIRECTION IN ADVANCE (10.08, «да»), so the bench measures the SIZE and not
 * whether to do it. The argument is double-counting: today `summerLoadFactor` grants +40% and -3
 * condition to every school-free week automatically, whether or not the week is doubled, and the
 * player has never been able to double anything. Once he can, the automatic grant would pay him for a
 * choice he did not make. So a fully doubled school-free week reproduces 1.4 and -3 EXACTLY, and an
 * undoubled one gets 1.0 and 0.
 *
 * THE DENOMINATOR IS WHAT THE WEEK COULD HAVE DOUBLED, not seven: six sessions fit into three doubled
 * days and there is no fourth to take, so a six-session week with three doubled days is FULLY doubled
 * and reads 1. Five sessions can double twice (two doubles and a single), four twice. `Math.floor`
 * rather than `ceil` for exactly that reason – the leftover odd session has no partner to pair with.
 */
export function doublingShare(week: readonly (readonly SessionKind[])[]): number {
  const sessions = planSessions(week)
  const most = Math.floor(sessions / DAY_CAPACITY_FREE)
  if (most <= 0) return 0
  return Math.min(1, doubledDays(week) / most)
}

/**
 * THE WEEK AS IT IS ACTUALLY LIVED, given what this week's days can hold.
 *
 * ⚠ WHY THIS EXISTS AT ALL: THE PLAN OUTLIVES THE WEEK IT WAS BUILT IN. A player who builds three
 * doubled days in July still has that plan in September, when school takes the second session back.
 * Three answers were possible and only one of them is honest:
 *   * DROP the overflow – the week silently loses sessions, and with them hours off the bill. A plan
 *     that quietly costs less than it says is the same defect class as a screen that promises a
 *     tournament the engine has already refused.
 *   * REFUSE the plan – then a summer week can never be planned before it arrives, and `setPlan`'s
 *     verdict would depend on WHICH WEEK he was looking at, which is not a property a saved plan can
 *     have.
 *   * MOVE it, which is this. Nothing is lost: the session count, the kinds, the bill, the rate and
 *     the knock chance are all untouched, and the only thing the school week takes away is the
 *     DOUBLING – which is exactly the thing school takes away in the fiction.
 * Four to six sessions always fit into seven days at capacity one, so the move can never fail.
 *
 * Deterministic, total, and ZERO draws: the overflow lands on the free days in `WORK_PRIORITY` order.
 */
export function resolveWeek(
  week: readonly (readonly SessionKind[])[],
  capacity: number,
): SessionKind[][] {
  const out: SessionKind[][] = []
  const overflow: SessionKind[] = []
  for (let d = 0; d < PLAN_DAYS; d++) {
    const day = week[d] ?? []
    out.push([...day.slice(0, capacity)])
    overflow.push(...day.slice(capacity))
  }
  for (const kind of overflow) {
    const free = WORK_PRIORITY.find((d) => out[d].length < capacity)
    // Nothing to move it to cannot happen inside 4..6 sessions; leaving it on the last day rather
    // than dropping it keeps the function total AND lossless for a plan that somehow got past setPlan.
    out[free ?? PLAN_DAYS - 1].push(kind)
  }
  return out
}

/**
 * IS THIS A WEEK THE PLAYER MAY SET? The engine's own re-validation of `setPlan` – a stale screen may
 * not corrupt a career, so the shape is checked here and not only in the UI.
 *
 * ⚠ IT CHECKS THE SHAPE, NEVER THIS WEEK'S CAPACITY, and that is the point of `resolveWeek` above: a
 * plan is a standing statement, so it is judged against the game's own maximum (two on a day, the
 * highest any week ever allows) and the week it is LIVED in decides how much of it doubles. A
 * validator that read the current week would refuse in September a plan it accepted in July.
 *
 * Returns the reason it is illegal, or null.
 */
export function planShapeError(week: unknown): string | null {
  if (!Array.isArray(week) || week.length !== PLAN_DAYS) {
    return `A week is ${PLAN_DAYS} days`
  }
  for (const day of week) {
    if (!Array.isArray(day)) return 'Every day is a list of sessions'
    if (day.length > DAY_CAPACITY_FREE) {
      return `No day holds more than ${DAY_CAPACITY_FREE} sessions`
    }
    for (const kind of day) {
      if (!SESSION_KINDS.includes(kind as SessionKind)) return `Unknown session kind: ${String(kind)}`
    }
  }
  const sessions = planSessions(week as SessionKind[][])
  if (sessions < PLAN_MIN_SESSIONS || sessions > PLAN_MAX_SESSIONS) {
    return `A week holds ${PLAN_MIN_SESSIONS} to ${PLAN_MAX_SESSIONS} sessions`
  }
  return null
}
