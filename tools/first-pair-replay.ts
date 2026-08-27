/**
 * first-pair-replay – "is the first-round exit a DRAW, or is it her?"
 *
 * WHY IT EXISTS. The owner loaded a save, restored her to full condition, played the next W50 and
 * the next W75, and lost the opener at both – several times over, reproducibly. His question, 27.08:
 * «я хочу понять у нас есть реально разброс в результатах или это всё фикция и 100 из 100 она
 * вылетает в обоих турнирах сразу на 1м матче».
 *
 * ⚠⚠ AND HIS LITERAL EXPERIMENT CANNOT ANSWER IT, BY CONSTRUCTION. Load / restore / play / reload is
 * a REPLAY, not a sample: CLAUDE.md §2's input-independence law makes every stream seeded, the MAIN
 * position is persisted per career (`rngMain`, v35) so a load resumes rather than re-rolls, and the
 * bracket runs on the event's own sub-stream `seed:kidtour:<event.id>`. Same save + same actions =
 * the same world, for ever. 100/100 identical is the LAW WORKING, and reporting it as a finding
 * would answer a question nobody asked. So this file runs three things:
 *
 *   [A] THE DETERMINISM CHECK – his experiment verbatim, N=10. Every replay must be byte-identical;
 *       if one is not, a stream is leaking and that is the only finding that matters.
 *   [B] THE DISTRIBUTION HE IS ACTUALLY ASKING ABOUT – N=100 draws of the same two events, varying
 *       what a player cannot control (who turns up, where she lands, how the points fall) and
 *       holding what she is constant. Full distribution of rounds reached, not just the R1 share.
 *   [C] THE LEVER HE PULLS – [B] run at her saved condition and at full, so "restore before playing"
 *       has a price in rounds rather than in belief.
 *
 * ⭐ HOW [B] VARIES THE DRAW WITHOUT VARYING HER, and this is the whole methodological point.
 * The obvious knob – `world.seed` – is the WRONG one: `fieldProsOf` derives the entire 1,600-strong
 * professional field from it, and her own injury/physio/growth sub-streams are keyed off it too, so
 * turning it re-deals the opposition AND re-rolls her week. Two things varied, one number reported.
 * Instead this tool perturbs ONE STRING: the event's `id`. That is the sub-stream key the bracket
 * actually reads (`seed:kidtour:<event.id>`), so it moves entry jitter, the unseeded shuffle, her
 * slot's neighbours and every point of every match – and it moves NOTHING else. The calendar is
 * already materialised in `world.season` (weeks 260-308 in this save), her skills, her cohort, her
 * standings, her ledger, her condition and her entry are all untouched. The nonce is a PREFIX
 * (`t07~5-w261-w50`) for two measured reasons: `diary/facts.ts` reads the tier as
 * `id.split('-').pop()`, which a suffix would break, and `byAllocationPriority`'s lexicographic
 * tie-break is only reachable between two events OF THE SAME TIER on the same week, which this
 * calendar never has.
 *
 * ⚠ AND THE INSTRUMENT CHECKS ITSELF: trial 0 leaves the id ALONE, so its result must equal the
 * shipped run in [A]. A tool whose null trial disagrees with the real path is measuring something
 * else, and the run says so instead of averaging it in.
 *
 * ⚠ NOTHING IS RE-IMPLEMENTED. Every event is played by the real `tickWeek` through the real
 * `enterEvent` – the same pipeline the career runs – not by a local mirror of `buildPendingTournament`.
 * `tools/draw-vs-band.ts` mirrors that function and has since drifted from it (the annual-entry-limit
 * gate, the `fieldSeasonPoints` argument and the coach-travel flag all landed after it was written);
 * driving the tick costs seconds and cannot drift at all.
 *
 * ⚠ CONDITION IS SET ON THE PLAYING WEEK, not at load, and that is deliberate: `accrueCondition`
 * gives a tournament week `matchWeekRecoveryBase` (0 shipped), so what is set on the week she plays
 * is what she plays at. The tool READS BACK the scaled build out of `pendingTournament.players`
 * and prints the realised factor rather than trusting the constant.
 *
 * ⚠ MEASUREMENT ONLY. Imports the engine read-only, changes no constant, writes no fixture.
 * ⚠ THE SAVE IS PERSONAL. Passed at run time, never copied into the repo, never committed, and
 * nothing derived from it beyond the aggregate statistics quoted in docs/. Same rule as
 * tools/draw-vs-band.ts and tools/winrate-read.ts.
 *
 * Run:
 *   npx vite-node tools/first-pair-replay.ts -- --save <path> [--trials 100] [--replays 10]
 *                                               [--pair first|second] [--conditions 66,100]
 */
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import {
  tickWeek,
  enterEvent,
  skipTournament,
  closeTournament,
  buildBirthdayPrompt,
  chooseGift,
  answerFork,
  answerRetirement,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { decodeExportFile } from '../src/engine/saveCodec'
import { decideKnock } from '../src/engine/world/knock'
import { advanceRefusal } from '../src/engine/world/multiWeek'
import { resumeMain } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { conditionMatchFactor } from '../src/engine/condition'
import { TIERS } from '../src/engine/season/calendar'
import { finishLabel } from '../src/engine/world/labels'
import { acceptanceRank, fieldProsOf, rankingFor } from '../src/engine/world/ladder'
import { coachMatchEdge } from '../src/engine/world/player'
import { fastMatchProbability } from '../src/engine/match/engine'
import { JUNIOR_TOUR } from '../src/engine/season/tournament'
import { KIT_GRADES } from '../src/engine/equipment'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

// --- args ----------------------------------------------------------------------------------------
const args = process.argv.slice(2)
const strArg = (name: string, fallback: string): string => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}
const numArg = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SAVE = strArg('save', '')
/** [B]/[C] sample size – one trial is one draw of the event. */
const TRIALS = numArg('trials', 100)
/** [A] sample size. Ten is plenty for a claim that is a law rather than a rate. */
const REPLAYS = numArg('replays', 10)
/** `first` = the first W50 and W75 after the winter break; `second` = the pair one rung further out. */
const PAIR = strArg('pair', 'first')
const CONDITIONS = strArg('conditions', '66,100').split(',').map(Number)
/** ⭐ WHICH OF THE PAIR TO PLAY, and it exists because the invariance receipt demanded it.
 *  `pair` (default) is his «связка» – both events in ONE walk, which is what he actually did. But
 *  a bundle is not a clean single-variable experiment for the SECOND event: how far she went at the
 *  W50 changes her match load and her points, so by week 262 she is very slightly a different
 *  player, and the receipt duly prints "her skills 3 · her ranks 5" instead of 1 and 1. `w75`
 *  plays that event ALONE from the same save, which restores 1/1/1/N and gives the second rung a
 *  distribution that is about the DRAW and nothing else. Both are reported; neither is the whole
 *  answer on its own. */
const ONLY = strArg('only', 'pair')
/** run the [C] lever bench (slow: one full N-draw sweep per arm). */
const LEVERS = args.includes('--levers')

if (!SAVE) {
  console.error('usage: vite-node tools/first-pair-replay.ts -- --save <path.tsave>')
  process.exit(2)
}

// --- helpers -------------------------------------------------------------------------------------
const mean = (xs: readonly number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN)
const pad = (s: string | number, n: number): string => String(s).padStart(n)
const hash = (s: string): string => createHash('sha256').update(s).digest('hex').slice(0, 12)
const section = (title: string): void => {
  console.log(`\n${'='.repeat(100)}\n${title}\n${'='.repeat(100)}`)
}

/** Her strength in the cohort's own currency – `power()`'s five-skill mean, so "stronger than her"
 *  is ONE comparison against field pros, cohort rivals and the storey bands alike. */
function kidCore(world: WorldState): number {
  const s = world.skills as unknown as Record<string, number>
  return (s.serve + s.ret + s.composure + s.stamina + s.groundstrokes) / 5
}

/** A player's place in the merged professional table this week – the table the bracket is seeded
 *  from and the only one carrying a row for her. `NaN` for anyone it cannot find. */
function rankOf(world: WorldState, id: string): number {
  const row = rankingFor(world, 'wta').find((r) => r.playerId === id)
  return row ? row.rank : NaN
}

/** What she reached, in matches won. `finishes[id] = rounds - round`, so 0 = champion. */
const wonCount = (finish: number, drawSize: number): number => Math.log2(drawSize) - finish

// --- one played event ----------------------------------------------------------------------------

interface Played {
  eventId: string
  tier: TierId
  week: number
  /** matches she won at this event; 0 = lost the opener */
  won: number
  finish: number
  /** the complete bracket, hashed – the determinism check's subject */
  bracketHash: string
  /** her R1 opponent, and what the engine thought of the pairing */
  oppId: string
  /** her R1 opponent's five-skill mean AS SCALED FOR THIS COURT – what she actually met */
  oppCore: number
  /** ⚠ HER OWN five-skill mean in the SAME scaled currency. Reported beside `oppCore` because the
   *  first draft printed the opponent's five-skill mean next to her SERVE, which made a level
   *  pairing look like a rout in her favour. One currency, both sides. */
  herCore: number
  /** the scaled build the bracket actually ran her at, read back out of the pending run */
  playedServe: number
  /** condition as it stood on the playing week, after accrual */
  conditionAtPlay: number
  entered: boolean
  refusal: string | null
  /** ⭐ THE INVARIANCE RECEIPT, and the reason this tool can claim it varied ONE thing. Hashed at
   *  the moment the bracket is built, inside the same walk that produced it: if the nonce were
   *  leaking into the world rather than into the event's sub-stream alone, these would move with
   *  it. The run prints how many distinct values each took across the whole sample – the answer
   *  has to be 1 for the first three and N for the bracket. A claim of "only the draw moved" that
   *  is argued rather than measured is the null-arm mistake wearing different clothes. */
  fieldHash: string
  skillHash: string
  standingsHash: string
  /** ⭐ HER R1 OPPONENT'S PLACE AND HERS, OUT OF ONE TABLE. Both come from `rankingFor(world,'wta')`
   *  – the same merged professional table `kidSeedIndexIn` seeds the bracket off, and the only one
   *  of the three folds that has a row for her. Read at play time so it is the table as it stood.
   *  This is what makes the reality comparison citable: `docs/research/the-upset-rate.md` is
   *  denominated in rank pairs, not in skill points. */
  oppRank: number
  herRank: number
  spentCents: number
  coachEdge: number
  /** ⭐ THE NUMBER ON HIS CARD, computed the card's own way. `previewEvent.firstMatchChance` is
   *  `fastMatchProbability(kid, opponent)` against the ONE player the shipped draw gave her – so it
   *  answers a different question from this tool's 100-draw average, and both can be right at once.
   *  Carrying it makes the difference legible: the card says "this opener", the distribution says
   *  "an opener", and the gap between them IS how hard a draw she got. */
  cardChance: number
}

/** Clear whatever the week is holding, exactly as `his-careers-dose` does: fixed answers in every
 *  arm, so no arm can differ through a policy choice. */
function clearRefusals(world: WorldState): string | null {
  for (let guard = 0; guard < 8; guard++) {
    const refusal = advanceRefusal(world)
    if (refusal === null) return null
    if (refusal === 'ending') return 'ending'
    if (refusal === 'tournament') {
      skipTournament(world)
      closeTournament(world)
    } else if (refusal === 'knock') {
      decideKnock(world, 'rest')
    } else if (refusal === 'birthday') {
      const prompt = buildBirthdayPrompt(world)
      if (prompt) chooseGift(world, prompt.options[0].id)
      else return 'birthday-stuck'
    } else if (refusal === 'fork') {
      answerFork(world, 'continue')
    } else if (refusal === 'retirement') {
      answerRetirement(world, false)
    } else return refusal
  }
  return 'guard'
}

/**
 * Walk a fresh world forward ONCE and play BOTH target events – his «связка», the bundle, not two
 * separate careers. That distinction is load-bearing and the first draft got it wrong: playing the
 * W75 in a world where she never entered the W50 gives her a different ledger, different standings,
 * a different fatigue history and a different MAIN position, and it measured a QF where the real
 * sequence measures an opener.
 *
 * `nonce` perturbs BOTH events' ids – and therefore their `seed:kidtour:<id>` sub-streams – and
 * nothing else; `''` leaves the shipped ids alone, which is what makes trial 0 a control rather
 * than a sample.
 *
 * `condition`, when given, is written on the week BEFORE each event, because `tickWeek` increments
 * `world.week` on its FIRST line and then plays that new week. ⚠ The first draft wrote it when
 * `world.week` already equalled the event week, which never happens before the bracket exists – so
 * arms B and C silently ran the same walk twice and printed two byte-identical distributions. The
 * realised value is read back off `world.condition` immediately after the playing tick, before
 * `finalizeTournament` takes the match drain, rather than assumed from the constant.
 *
 * `atLoad`, when given, is his own move instead: set once at load and left to the walk.
 */
function playPair(
  base: WorldState,
  targetIds: readonly string[],
  nonce: string,
  condition: number | null,
  atLoad: number | null,
  /** ⭐ THE LEVER. Applied to the CLONE before the walk, so every arm starts from the same save and
   *  differs by exactly what this function writes. Nothing else in the walk is arm-aware. */
  apply?: (w: WorldState) => void,
): Played[] {
  const world = JSON.parse(JSON.stringify(base)) as WorldState
  if (atLoad !== null) world.condition = atLoad
  if (apply) apply(world)
  const fundsAtStart = world.fundsCents
  const wanted = new Map<string, SeasonEvent>()
  for (const id of targetIds) {
    const ev = world.season.find((e) => e.id === id)
    if (!ev) throw new Error(`event ${id} not on this calendar`)
    ev.id = nonce ? `${nonce}~${id}` : id
    wanted.set(ev.id, ev)
  }
  const lastWeek = Math.max(...[...wanted.values()].map((e) => e.week))
  const rng = resumeMain(world.rngMain)
  const out: Played[] = []
  const entered = new Set<string>()
  let refusal: string | null = null

  for (let guard = 0; guard < 60 && world.week <= lastWeek; guard++) {
    const r = clearRefusals(world)
    if (r) {
      refusal = r
      break
    }
    // Enter as soon as the desk will take her – `enterEvent` re-validates the deadline, the funds,
    // the one-event-a-week rule and the ranking gate itself, so a refusal here is the ENGINE's
    // answer about this player at this rung and is reported rather than swallowed.
    for (const [id, ev] of wanted) {
      if (entered.has(id) || world.week > ev.deadlineWeek) continue
      try {
        enterEvent(world, id)
        entered.add(id)
      } catch (e) {
        refusal = `enter ${ev.tier}: ${(e as Error).message}`
      }
    }
    const nextWeek = world.week + 1
    const playingNext = [...wanted.values()].some((e) => e.week === nextWeek)
    if (playingNext && condition !== null) world.condition = condition
    tickWeek(world, rng)
    const pending = world.pendingTournament
    if (!pending) continue
    const ev = wanted.get(pending.eventId)
    if (ev) {
      const drawSize = TIERS[ev.tier].drawSize
      const finish = pending.result.finishes[KID_ID]
      const r1 = pending.result.matches.find((m) => m.round === 0 && (m.aId === KID_ID || m.bId === KID_ID))
      const oppId = r1 ? (r1.aId === KID_ID ? r1.bId : r1.aId) : ''
      const opp = oppId ? pending.players[oppId] : undefined
      const her = pending.players[KID_ID]
      out.push({
        eventId: pending.eventId,
        tier: ev.tier,
        week: ev.week,
        won: wonCount(finish, drawSize),
        finish,
        // The WHOLE bracket, not just her line: a leak anywhere in the event's stream shows here.
        bracketHash: hash(JSON.stringify(pending.result)),
        oppId,
        // `pending.players` holds MatchPlayers (surface- and condition-scaled), so this is what she
        // actually met on court, not the AI row's paper strength. ⚠ A MatchPlayer's five skills are
        // FLAT fields, not a nested `skills` object like WorldState's – reading it the world's way
        // returns undefined, and the tool crashed on exactly that once.
        oppCore: opp ? mean([opp.serve, opp.ret, opp.composure, opp.stamina, opp.groundstrokes]) : NaN,
        herCore: her ? mean([her.serve, her.ret, her.composure, her.stamina, her.groundstrokes]) : NaN,
        playedServe: her ? her.serve : NaN,
        // post-accrual, pre-match-drain: the number the bracket was actually built from.
        conditionAtPlay: world.condition,
        entered: true,
        refusal: null,
        // What the walk to this court actually cost the family, and the size of the edge the coach
        // is contributing to her serve at the moment she takes it – both read, never assumed.
        spentCents: fundsAtStart - world.fundsCents,
        coachEdge: coachMatchEdge(world),
        cardChance:
          opp && her
            ? fastMatchProbability(her, opp, { surface: ev.surface, tour: JUNIOR_TOUR, seed: '' })
            : NaN,
        // The whole 1,600-strong professional table, her five skills, and the three ranks the
        // acceptance lists read – as they stand on the week the bracket was dealt.
        oppRank: rankOf(world, oppId),
        herRank: rankOf(world, KID_ID),
        fieldHash: hash(JSON.stringify(fieldProsOf(world))),
        skillHash: hash(JSON.stringify(world.skills)),
        standingsHash: hash(JSON.stringify([world.kidRank, world.kidRankDomestic, world.kidRankWta])),
      })
    }
    skipTournament(world)
    closeTournament(world)
  }

  // Anything that never got played still has to appear, or a silent drop-out would flatter the run.
  for (const [id, ev] of wanted) {
    if (out.some((p) => p.eventId === id)) continue
    out.push({
      eventId: id, tier: ev.tier, week: ev.week, won: -1, finish: -1, bracketHash: 'none',
      oppId: '', oppCore: NaN, herCore: NaN, playedServe: NaN, conditionAtPlay: NaN,
      entered: entered.has(id),
      // ⚠ A REASON, NOT A SHRUG. The first draft wrote 'never-played' for every drop-out, which hid
      // the one explanation that matters: a deep run at the FIRST event drains her and the medical
      // arm of `entryStatus` pulls the entry to the second. Reporting that as an unexplained gap
      // would have understated exactly the cost the owner is asking about.
      refusal:
        refusal ??
        (world.injury
          ? `injured (${world.injury.severity}, since w${world.injury.sinceWeek})`
          : world.entries.includes(id)
            ? 'entered but never played'
            : 'entry released'),
      oppRank: NaN, herRank: NaN, spentCents: NaN, coachEdge: NaN, cardChance: NaN,
      fieldHash: '', skillHash: '', standingsHash: '',
    })
  }
  return out.sort((a, b) => a.week - b.week)
}


// --- [C] THE LEVER BENCH -------------------------------------------------------------------------
//
// ⭐⭐ THE OWNER'S REAL STAKE, 27.08: «реально собрать бенч из "одна точка старта, разные условия,
// один и тот же турнир" и понять реальную взаимосвязь». Behind it is a suspicion worth naming –
// that the game is ON RAILS, that nothing he decides changes what happens. This bench is the
// evidence either way, and a null result here would be the headline finding, not a footnote.
//
// ⚠ THE CONFOUND CHECK IS THE POINT OF THE DESIGN. Every arm walks the SAME 100 event-id nonces
// from the SAME save, so the draw is paired across arms: nonce t042 deals the same field to every
// arm. If a lever also moved WHO SHE MEETS, the opponent list would stop matching baseline's – so
// the bench hashes the sorted R1-opponent list per arm and prints whether it is identical. An
// effect measured across two different fields is not one effect, and the run says which it has.
//
// ⚠ AND SOME LEVERS REACH THE COURT WHILE OTHERS ONLY REACH HER CONDITION. `kidMatchPlayerFor`
// composes condition -> surface style -> kit -> coach edge, so kit, coach and condition are DIRECT.
// The masseur, the physio and the training plan act on `accrueCondition` instead, i.e. entirely
// THROUGH the condition she arrives at. So condition is deliberately left free-running here rather
// than pinned: pinning it would zero the only channel three of these levers have, and would
// manufacture a null result for them. The mean arrival condition is reported per arm so the
// mechanism is visible beside the effect.
interface Arm {
  id: string
  what: string
  apply?: (w: WorldState) => void
}

function armsFor(): Arm[] {
  const top = KIT_GRADES[KIT_GRADES.length - 1]
  const bottom = KIT_GRADES[0]
  const setKit = (w: WorldState, g: string): void => {
    const kit = w.kit as unknown as { grade: Record<string, string> }
    for (const line of Object.keys(kit.grade)) kit.grade[line] = g
  }
  // ⚠⚠ THE KIT LEVER IS WEAR, NOT GRADE, and the first draft measured the wrong half. `applyKit`
  // takes a `KitWear`, not a rung: `FRESH_KIT` is its neutral element and it "can only ever take
  // attributes down" (equipment.ts). The grade sets how LONG a line lasts; what reaches the court is
  // how worn it is TODAY. On this save `sinceWeek` is strings 84 / frame 160 / shoes 160 against
  // week 257 – so every line is long past its life and pinned at maximum wear, which is exactly why
  // re-grading it alone moved nothing at all and cost nothing. The decision a player actually makes
  // is BUYING NEW, so that is its own arm: top rung AND the clock reset to today.
  const freshKit = (w: WorldState): void => {
    setKit(w, top)
    const kit = w.kit as unknown as { sinceWeek: Record<string, number> }
    for (const line of Object.keys(kit.sinceWeek)) kit.sinceWeek[line] = w.week
  }
  const arms: Arm[] = [
    { id: 'baseline', what: 'the save exactly as it is' },
    { id: 'cond-100', what: 'arrive at full condition (his own move)', apply: (w) => { w.condition = ECONOMY.condition.max } },
    // ⚠ THE COACH LADDER IS ALL COUNTERPUNCHERS, AND THAT IS NOT A DETAIL. `coachFactor(tier, fit)`
    // takes the STYLE FIT as well as the rung, so comparing her counterpuncher against an all-court
    // elite would price the rung and the fit together and call the sum "tier". `ECONOMY.coach.roster`
    // carries one counterpuncher per tier – budget-1 / middle-2 (hers) / high-2 / elit-4 – so the
    // ladder below moves the rung and holds the fit. ⚠ And the elite portraits are `elit-N`, not
    // `elite-N`: the first draft wrote `elite-2`, `coachById` returned null, and the arm silently
    // measured a FIRED coach while claiming to measure the best one in the game. The `edge` column
    // is what caught it – it read 0.00, exactly like `coach-fired`.
    { id: 'coach-fired', what: 'no coach at all', apply: (w) => { w.coachId = null } },
    { id: 'coach-budget', what: 'drop to a budget coach (same style)', apply: (w) => { w.coachId = 'budget-1' } },
    { id: 'coach-high', what: 'a HIGH-tier coach (same style)', apply: (w) => { w.coachId = 'high-2' } },
    { id: 'coach-elite', what: 'an ELITE coach (same style)', apply: (w) => { w.coachId = 'elit-4' } },
    { id: 'coach-travels', what: 'send HER coach on the trip', apply: (w) => { w.coachOnEventWeeks = true } },
    { id: 'coach-elite-trav', what: 'elite coach AND he travels', apply: (w) => { w.coachId = 'elit-4'; w.coachOnEventWeeks = true } },
    { id: 'masseur', what: 'hire the masseur and take him along', apply: (w) => { w.masseurHired = true; w.masseurTravels = true } },
    { id: 'physio-off', what: 'drop the physio retainer she has', apply: (w) => { w.physioActive = false } },
    { id: 'plan-rest', what: 'train 25 / rest 75', apply: (w) => { w.plan = { ...w.plan, train: 25, rest: 75 } } },
    { id: 'plan-grind', what: 'train 100 / rest 0', apply: (w) => { w.plan = { ...w.plan, train: 100, rest: 0 } } },
    { id: 'kit-regrade', what: `re-grade to ${bottom}, same old kit`, apply: (w) => setKit(w, bottom) },
    { id: 'kit-fresh', what: `BUY NEW: ${top} kit, clock reset to today`, apply: freshKit },
    {
      id: 'EVERYTHING',
      what: 'full condition + elite coach travelling + masseur + top kit',
      apply: (w) => {
        w.condition = ECONOMY.condition.max
        w.coachId = 'elit-4'
        w.coachOnEventWeeks = true
        w.masseurHired = true
        w.masseurTravels = true
        freshKit(w)
      },
    },
  ]
  return arms
}

function leverBench(base: WorldState, target: SeasonEvent, trials: number): void {
  const drawSize = TIERS[target.tier].drawSize
  const rounds = Math.log2(drawSize)
  section(`[C] THE LEVER BENCH – one save, one tournament (${TIERS[target.tier].label}, week ${target.week}), ${trials} draws per arm`)
  console.log('  Same start, same 100 draws, one thing changed at a time. Ranked by what it buys in')
  console.log('  first-round win probability. "draw same?" is the confound check: it compares the sorted')
  console.log('  list of R1 opponents against baseline, so a lever that moved the FIELD is not credited')
  console.log('  with the result. "cost" is what the family actually spent over the walk to this court.')

  const rows: {
    arm: Arm
    r1: number
    meanRounds: number
    cond: number
    edge: number
    cost: number
    raw: number
    gained: number
    lost: number
    movedRounds: number
    drawSame: boolean
    receipt: string
  }[] = []
  let baselineOpp = ''
  // ⭐ THE PAIRED COMPARISON IS THE SENSITIVE INSTRUMENT, and the aggregate is not. Every arm plays
  // the SAME 100 draws, so draw t042 can be asked "did this lever change what happened HERE?" –
  // which resolves a lever worth a fraction of a percentage point, far below what a 100-sample rate
  // difference could ever show. A lever that flips nothing in 100 paired draws is genuinely inert;
  // one that flips 14 of them matters even if the two rates round to the same number.
  let baselineWon: boolean[] = []
  let baselineRounds: number[] = []
  for (const arm of armsFor()) {
    const samples: Played[] = []
    for (let i = 0; i < trials; i++) {
      const nonce = i === 0 ? '' : `t${String(i).padStart(3, '0')}`
      samples.push(playPair(base, [target.id], nonce, null, null, arm.apply).find((p) => p.tier === target.tier)!)
    }
    const ok = samples.filter((s) => s.won >= 0)
    const oppKey = hash(ok.map((s) => s.oppId).sort().join(','))
    const won = samples.map((s) => s.won >= 1)
    const roundsOf = samples.map((s) => s.won)
    if (arm.id === 'baseline') {
      baselineOpp = oppKey
      baselineWon = won
      baselineRounds = roundsOf
    }
    const gained = won.filter((v, i) => v && !baselineWon[i]).length
    const lost = won.filter((v, i) => !v && baselineWon[i]).length
    const movedRounds = roundsOf.filter((v, i) => v !== baselineRounds[i]).length
    rows.push({
      arm,
      r1: (100 * ok.filter((s) => s.won >= 1).length) / Math.max(1, ok.length),
      meanRounds: mean(ok.map((s) => s.won)),
      cond: mean(ok.map((s) => s.conditionAtPlay)),
      edge: ok.length ? ok[0].coachEdge : NaN,
      cost: mean(ok.map((s) => s.spentCents)) / 100,
      raw: 0,
      gained,
      lost,
      movedRounds,
      drawSame: oppKey === baselineOpp,
      receipt: `${new Set(ok.map((s) => s.fieldHash)).size}/${new Set(ok.map((s) => s.skillHash)).size}/${ok.length}`,
    })
  }
  const bl = rows[0]
  console.log(
    `\n  ${'arm'.padEnd(14)} ${'what changed'.padEnd(44)} ${'P(win R1)'.padStart(10)} ${'Δpp'.padStart(7)}` +
      ` ${'rounds'.padStart(7)} ${'Δ'.padStart(6)} ${'arrive'.padStart(7)} ${'edge'.padStart(6)} ${'cost $'.padStart(9)}  draw same?`,
  )
  console.log(`  ${'-'.repeat(130)}`)
  const sorted = [rows[0], ...rows.slice(1).sort((a, b) => b.r1 - a.r1)]
  for (const r of sorted) {
    const d = r.r1 - bl.r1
    const dr = r.meanRounds - bl.meanRounds
    console.log(
      `  ${r.arm.id.padEnd(14)} ${r.arm.what.slice(0, 44).padEnd(44)} ${pad(r.r1.toFixed(1), 9)}% ${pad(r.arm.id === 'baseline' ? '–' : (d >= 0 ? '+' : '') + d.toFixed(1), 7)}` +
        ` ${pad(r.meanRounds.toFixed(2), 7)} ${pad(r.arm.id === 'baseline' ? '–' : (dr >= 0 ? '+' : '') + dr.toFixed(2), 6)}` +
        ` ${pad(r.cond.toFixed(1), 7)} ${pad(r.edge.toFixed(2), 6)} ${pad((r.arm.id === 'baseline' ? 0 : r.cost - bl.cost).toFixed(0), 9)}  ${r.arm.id === 'baseline' ? '(ref)' : r.drawSame ? 'yes' : '⚠ NO – confounded'}` +
        `  ${r.arm.id === 'baseline' ? '' : `openers flipped +${r.gained}/-${r.lost}, result moved in ${r.movedRounds}/${trials}`}`,
    )
  }
  console.log(
    `\n  Δpp is in percentage points of "wins her opening match". rounds = mean matches won (max ${rounds}).` +
      `\n  edge = coachMatchEdge, the points added to her serve. arrive = mean condition on the playing week.`,
  )
}

// --- report --------------------------------------------------------------------------------------

function distribution(samples: readonly Played[], drawSize: number): void {
  const rounds = Math.log2(drawSize)
  const n = samples.filter((s) => s.won >= 0).length
  const failed = samples.filter((s) => s.won < 0)
  if (failed.length) {
    const why = new Map<string, number>()
    for (const f of failed) why.set(f.refusal ?? '?', (why.get(f.refusal ?? '?') ?? 0) + 1)
    console.log(
      `    ⚠ ${failed.length}/${samples.length} trials never reached this event: ` +
        [...why].map(([k, v]) => `${v}x ${k}`).join(' · '),
    )
  }
  console.log(`    rounds reached (n = ${n}):`)
  for (let w = 0; w <= rounds; w++) {
    const k = samples.filter((s) => s.won === w).length
    const label = w === rounds ? 'WON the title' : finishLabel(rounds - w)
    const bar = '#'.repeat(Math.round((60 * k) / Math.max(1, n)))
    console.log(`      ${pad(w, 2)} wins  ${label.padEnd(14)} ${pad(k, 4)}  ${pad(((100 * k) / Math.max(1, n)).toFixed(1), 5)}%  ${bar}`)
  }
  const wins = samples.filter((s) => s.won >= 0).map((s) => s.won)
  console.log(
    `    mean matches won ${mean(wins).toFixed(2)}` +
      `  ·  lost the opener ${((100 * samples.filter((s) => s.won === 0).length) / Math.max(1, n)).toFixed(1)}%` +
      `  ·  reached R2+ ${((100 * samples.filter((s) => s.won >= 1).length) / Math.max(1, n)).toFixed(1)}%`,
  )
  const ok = samples.filter((s) => s.won >= 0)
  const distinctOpp = new Set(ok.map((s) => s.oppId)).size
  const stronger = ok.filter((s) => s.oppCore > s.herCore).length
  console.log(
    `    R1 opponent: ${distinctOpp} distinct across ${n} draws  ·  five-skill mean ON COURT: hers ${mean(ok.map((s) => s.herCore)).toFixed(2)}` +
      ` vs theirs ${mean(ok.map((s) => s.oppCore)).toFixed(2)}  ·  stronger than her in ${((100 * stronger) / Math.max(1, n)).toFixed(1)}% of draws`,
  )
  const ranked = ok.filter((s) => Number.isFinite(s.oppRank))
  const sortedOpp = ranked.map((s) => s.oppRank).sort((a, b) => a - b)
  console.log(
    `    ⭐ IN RANK TERMS (one table – rankingFor(world,'wta')): she is #${ranked.length ? ranked[0].herRank : '?'}` +
      `  ·  R1 opponent median #${sortedOpp.length ? sortedOpp[Math.floor(sortedOpp.length / 2)] : '?'}` +
      ` (range #${sortedOpp[0] ?? '?'}–#${sortedOpp[sortedOpp.length - 1] ?? '?'})` +
      `  ·  ranked ABOVE her in ${((100 * ranked.filter((s) => s.oppRank < s.herRank).length) / Math.max(1, ranked.length)).toFixed(1)}% of draws`,
  )
  const cards = ok.map((s) => s.cardChance).sort((a, b) => a - b)
  console.log(
    `    the CARD's first-match chance across these draws: mean ${(100 * mean(cards)).toFixed(1)}%` +
      `  ·  median ${(100 * cards[Math.floor(cards.length / 2)]).toFixed(1)}%` +
      `  ·  range ${(100 * cards[0]).toFixed(1)}–${(100 * cards[cards.length - 1]).toFixed(1)}%`,
  )
  const won0 = ok.filter((s) => s.won === 0)
  const won1 = ok.filter((s) => s.won >= 1)
  console.log(
    `      when she LOST the opener the opponent averaged ${mean(won0.map((s) => s.oppCore)).toFixed(2)};` +
      ` when she won it, ${mean(won1.map((s) => s.oppCore)).toFixed(2)}`,
  )
  console.log(
    `    ⭐ invariance receipt – distinct values across the sample:  professional field ${new Set(ok.map((s) => s.fieldHash)).size}` +
      `  ·  her skills ${new Set(ok.map((s) => s.skillHash)).size}  ·  her three ranks ${new Set(ok.map((s) => s.standingsHash)).size}` +
      `  ·  BRACKET ${new Set(ok.map((s) => s.bracketHash)).size}   (want 1 / 1 / 1 / ${n})`,
  )
  const conds = [...new Set(ok.map((s) => s.conditionAtPlay))]
  console.log(
    `    she played at condition ${conds.map((c) => c.toFixed(1)).join('/')}` +
      `  ·  factor ${conds.map((c) => conditionMatchFactor(c).toFixed(4)).join('/')}` +
      `  ·  her scaled serve ${mean(ok.map((s) => s.playedServe)).toFixed(2)}`,
  )
}

async function main(): Promise<void> {
  const base = (await decodeExportFile(new Uint8Array(readFileSync(SAVE)))) as WorldState

  section('THE PLAYER, THE SAVE AND THE TWO EVENTS')
  const core = kidCore(base)
  const s = base.skills as unknown as Record<string, number>
  console.log(`  seed ${base.seed}  ·  week ${base.week}  ·  schema v${base.schemaVersion}  ·  condition ${base.condition}`)
  console.log(
    `  skills  serve ${s.serve.toFixed(1)} · ret ${s.ret.toFixed(1)} · composure ${s.composure.toFixed(1)}` +
      ` · stamina ${s.stamina.toFixed(1)} · groundstrokes ${s.groundstrokes.toFixed(1)}`,
  )
  console.log(`  power() – the FIVE-skill mean the field and the storey bands are denominated in: ${core.toFixed(2)}`)
  console.log(`  four-skill mean (the retired currency, still quoted about): ${((s.serve + s.ret + s.composure + s.stamina) / 4).toFixed(2)}`)
  console.log(`  ranks  itf #${base.kidRank}  ·  domestic #${base.kidRankDomestic}  ·  WTA #${base.kidRankWta}`)
  console.log(`  entries on the save: ${JSON.stringify(base.entries)}  ·  plan ${JSON.stringify(base.plan)}`)

  // ⚠ THE PAIR IS FOUND, NOT ASSUMED. "After the winter" = after the empty weeks the save sits in;
  // this calendar's first event of any kind is week 260, so the winter is 257-259.
  const future = base.season.filter((e) => e.week >= base.week).sort((a, b) => a.week - b.week)
  const nth = PAIR === 'second' ? 1 : 0
  const pick = (tier: TierId): SeasonEvent => future.filter((e) => e.tier === tier)[nth]
  const w50 = pick('w50')
  const w75 = pick('w75')
  console.log(`\n  calendar resumes at week ${future[0].week} – weeks ${base.week}-${future[0].week - 1} are the winter break`)
  console.log(`  every W50 ahead: ${future.filter((e) => e.tier === 'w50').slice(0, 6).map((e) => `w${e.week}`).join(' ')}`)
  console.log(`  every W75 ahead: ${future.filter((e) => e.tier === 'w75').slice(0, 6).map((e) => `w${e.week}`).join(' ')}`)
  console.log(`\n  ⭐ PICKED (${PAIR}): ${w50.id} @ week ${w50.week} ${w50.surface}  ·  ${w75.id} @ week ${w75.week} ${w75.surface}`)
  console.log(
    `     W50 accepts top ${acceptanceRank(base, 'w50') ?? '–'}  ·  W75 accepts top ${acceptanceRank(base, 'w75') ?? '–'}` +
      `  ·  she is WTA #${base.kidRankWta}  ·  merged field ${fieldProsOf(base).length} pros`,
  )
  const targets = [w50, w75]

  // === [A] ==========================================================================================
  const chosen = ONLY === 'pair' ? targets : targets.filter((t) => t.tier === ONLY)
  if (!chosen.length) throw new Error(`--only ${ONLY} matches neither of the two picked events`)
  const ids = chosen.map((t) => t.id)
  if (ONLY !== 'pair') console.log(`\n  ⭐ SOLO MODE: playing ${ONLY} alone, so nothing upstream of it varies.`)
  section(`[A] HIS EXPERIMENT VERBATIM – load, restore to full condition, play the pair, reload. N = ${REPLAYS}`)
  console.log('  Each replay decodes the SAME file again, sets condition to the max at LOAD (his own move,')
  console.log('  not per-event), enters both events and plays them through the real tick.')
  const replays: Played[][] = []
  for (let i = 0; i < REPLAYS; i++) replays.push(playPair(base, ids, '', null, ECONOMY.condition.max))
  const key = (ps: Played[]): string => ps.map((p) => `${p.eventId}:${p.finish}:${p.oppId}:${p.bracketHash}`).join('|')
  const distinct = new Set(replays.map(key))
  for (const p of replays[0]) {
    console.log(
      `\n  ${TIERS[p.tier].label} ${p.eventId} (week ${p.week}):  ${p.won} match(es) won` +
        `  ·  R1 vs ${p.oppId}  ·  bracket ${p.bracketHash}  ·  played at condition ${Number(p.conditionAtPlay).toFixed(1)}` +
        `\n    ⭐ THE CARD'S OWN NUMBER for this shipped draw: ${(100 * p.cardChance).toFixed(1)}% to win the opener`,
    )
    if (p.refusal) console.log(`    ⚠ ${p.refusal}`)
  }
  console.log(
    distinct.size === 1
      ? `\n  ✓ ${REPLAYS}/${REPLAYS} replays IDENTICAL (1 distinct pair of brackets) – as the seeded-stream law requires.`
      : `\n  ⚠⚠ ${distinct.size} DISTINCT outcomes across ${REPLAYS} replays – A STREAM IS LEAKING. Read this before anything else.`,
  )
  if (distinct.size !== 1) for (const d of distinct) console.log(`     ${d}`)
  const asSaved = playPair(base, ids, '', null, null)
  console.log(
    `  and WITHOUT the restore (condition left at ${base.condition}): ` +
      asSaved.map((p) => `${p.tier} ${p.won} win(s) @ cond ${Number(p.conditionAtPlay).toFixed(1)}`).join('  ·  '),
  )

  // === [B] and [C] ==================================================================================
  section(`[B]+[C] THE DISTRIBUTION – ${TRIALS} draws of the pair per condition, varying ONLY the draw`)
  console.log('  Held constant: her skills, her cohort, her standings, her ledger, the calendar, the')
  console.log('  1,600-strong professional field, her entry, the weeks between. Varied: the event-id')
  console.log('  nonce, i.e. the `seed:kidtour:<id>` sub-stream – who turns up, where in the draw she')
  console.log('  lands, and how every point of every match falls.')
  console.log('  ⚠ Trial 0 leaves both ids ALONE, so it must reproduce the shipped run; printed below.')
  for (const cond of CONDITIONS) {
    const trials: Played[][] = []
    for (let i = 0; i < TRIALS; i++) {
      trials.push(playPair(base, ids, i === 0 ? '' : `t${String(i).padStart(3, '0')}`, cond, null))
    }
    console.log(`\n  ${'-'.repeat(96)}\n  CONDITION ${cond}  ·  match factor ${conditionMatchFactor(cond).toFixed(4)}`)
    console.log(`  control trial 0: ${trials[0].map((p) => `${p.tier} ${p.won} win(s)`).join(' · ')}`)
    for (const t of chosen) {
      const samples = trials.map((tr) => tr.find((p) => p.tier === t.tier)!)
      console.log(
        `\n  ${TIERS[t.tier].label} (week ${t.week}, ${t.surface}, draw ${TIERS[t.tier].drawSize})`,
      )
      distribution(samples, TIERS[t.tier].drawSize)
    }
    // ⭐ HIS ACTUAL QUESTION IS THE JOINT ONE: «вылетает в обоих турнирах сразу на 1м матче».
    const bothOut = trials.filter((tr) => tr.every((p) => p.won === 0)).length
    const oneOut = trials.filter((tr) => tr.filter((p) => p.won === 0).length === 1).length
    const neither = trials.filter((tr) => tr.every((p) => p.won > 0)).length
    console.log(
      `\n    JOINT over the pair (n = ${trials.length}):  opener lost at BOTH ${bothOut} (${((100 * bothOut) / trials.length).toFixed(1)}%)` +
        `  ·  at exactly one ${oneOut} (${((100 * oneOut) / trials.length).toFixed(1)}%)` +
        `  ·  at neither ${neither} (${((100 * neither) / trials.length).toFixed(1)}%)`,
    )
  }

  if (LEVERS) for (const t of chosen) leverBench(base, t, TRIALS)

  section('CONDITION FACTOR, READ OFF THE SHIPPED FUNCTION')
  console.log(`  knee ${ECONOMY.condition.matchStrengthKnee}  ·  floor ${ECONOMY.condition.matchStrengthFloor}`)
  for (const c of [50, 60, 66, 70, 80, 90, 100]) console.log(`    ${pad(c, 4)} -> ${conditionMatchFactor(c).toFixed(6)}`)
  console.log(`  66 -> 100 is a ${((conditionMatchFactor(100) / conditionMatchFactor(66) - 1) * 100).toFixed(2)}% strength change.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
