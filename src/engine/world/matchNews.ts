// MATCH NEWS: turning a resolved tournament into the lines the feed shows, and the streak the
// Home card reads off them.
//
// ⚠ DEPENDENCY DIRECTION. Small derivations over a finished TournamentResult and the events ledger.
// `WorldState` is a TYPE-ONLY import; nothing here draws on any RNG stream.
import { formatShortName } from '../../shared/format'
import { ANGER_STREAK_MAX, ANGER_STREAK_MIN, resultShowsOnHerFace } from '../../shared/avatarEmotion'
import { pickInt, rngFromSeed } from '../rng'
import { TIERS, TIER_LADDER } from '../season/calendar'
import type { MatchPlayer } from '../match/types'
import type { MatchRecord, SeasonEvent, TierId, TournamentResult } from '../season/types'
import type { LossStreak, WorldMatch } from '../../shared/protocol'
import { KID_ID } from './constants'
import { stageLabel } from './labels'
import type { WorldState } from '../world'

/** "2-6 6-4 1-6" -> "6-2 4-6 6-1" */
export function flipScore(score: string): string {
  return score
    .split(' ')
    .map((set) => set.split('-').reverse().join('-'))
    .join(' ')
}

export function fallbackPlayer(id: string): MatchPlayer {
  return { id, name: id, serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50 }
}

export function kidMatchesOf(result: TournamentResult): MatchRecord[] {
  return result.matches.filter((m) => m.aId === KID_ID || m.bId === KID_ID)
}

export function kidMatchEvent(
  world: WorldState,
  event: SeasonEvent,
  m: MatchRecord,
  players: Record<string, MatchPlayer>,
): { text: string; match: WorldMatch } {
  const tier = TIERS[event.tier]
  const oppId = m.aId === KID_ID ? m.bId : m.aId
  const oppName = (players[oppId] ?? fallbackPlayer(oppId)).name
  const kidWon = m.winnerId === KID_ID
  const stage = stageLabel(m.round, tier.drawSize)
  // MatchRecord scores are from bracket side A's perspective; news reads from the kid's.
  const kidScore = m.score && m.bId === KID_ID ? flipScore(m.score) : m.score
  // Short names for EVERYONE: cohort names are "First Last"; the kid's full name is
  // kidName + last name (kidMatchPlayer only carries the first name).
  const kidShort = formatShortName(`${world.profile.kidName} ${world.profile.kidLastName}`)
  const a = { ...(players[m.aId] ?? fallbackPlayer(m.aId)) }
  const b = { ...(players[m.bId] ?? fallbackPlayer(m.bId)) }
  // ⚠ THE MARKER GOES IN THE VERB, AND THE SCORE STAYS THE TRAILING TOKEN. A result sheet writes
  // "6-4 2-1 ret." and the obvious edit is to append those three letters – but this sentence has a
  // READER: SeasonScreen's `plaqueLines` splits the bracket plaque into a title and a score by
  // testing `e.text.endsWith(score)`, and tests/round12-view.test.ts pins that dependency in as many
  // words ("if that sentence is ever reworded so the score stops being the trailing token, the
  // plaque silently degrades to one line"). Appending to the tail would have degraded every
  // retirement row in the bracket, silently, in a file this wave must not touch. Putting the fact in
  // the verb says the same thing and leaves the contract alone.
  //
  // ⚠ TWO VERBS, BECAUSE A RETIREMENT HAS TWO SIDES AND THEY ARE NOT SYMMETRICAL. Hers is
  // "retired against"; her opponent's is "beat a retiring", and `beat` is the honest word there
  // rather than a hedge – the winner of a retirement gets a full, undiscounted win (2026 ITF WTT
  // Regs, Women's §XII.C.1.b, and §VI.B's System of Merit says it from the other side: retirement
  // wins count, walkovers do not). It is the WALKOVER the rules discount, and the game models none.
  const verb = m.retiredId
    ? m.retiredId === KID_ID
      ? 'retired against'
      : 'beat a retiring'
    : kidWon
      ? 'beat'
      : 'lost to'
  return {
    text: `${stage}: ${kidShort} ${verb} ${formatShortName(oppName)} ${kidScore ?? ''}`.trim(),
    match: { ...m, eventId: event.id, surface: event.surface, oppName, a, b },
  }
}

/** WHICH RUNGS' CANONICAL CHAMPIONS MAKE THE NEWS – W100 and up, and the cut is a feed budget
 *  rather than a taste (`EVENTS_CAP` is 400 non-`keep` rows and `pruneEvents` sacrifices ordinary
 *  rows first). All ten W rungs would be ~98 lines a season against a feed that already takes ~364;
 *  W100-and-up is ~37, i.e. under one row a week. Expressed as a position in `TIER_LADDER` – the
 *  project's single source of truth for "is tier A above tier B" – so a re-ordered or re-named rung
 *  cannot silently fall out of the rule. */
const NEWSWORTHY_FROM: TierId = 'w100'

/** ⭐ MOVED HERE FROM `world.ts` BY ROUND 23 #3b, WITH THE RULE UNCHANGED, because it acquired a
 *  SECOND reader. The champion line («X won the World Tour 500») and the retirement line below are
 *  the same register speaking about the same rungs, and two copies of "which rungs does the world
 *  report on" is exactly the drift a shared constant exists to prevent. `announceTourChampion` now
 *  asks this function; its behaviour is byte-identical to the two checks it replaced. */
export function tierMakesWorldNews(tier: TierId): boolean {
  if (TIERS[tier].track !== 'wta') return false
  return TIER_LADDER.indexOf(tier) >= TIER_LADDER.indexOf(NEWSWORTHY_FROM)
}

const SET_ORDINAL: readonly string[] = ['', 'first', 'second', 'third', 'fourth', 'fifth']

/** WHICH SET SHE WALKED OFF IN, read off the scoreline and nothing else.
 *
 *  The token count IS the set number – `simulateMatch` writes the partial set she stopped inside as
 *  the last token, so "6-4 2-1" is the second set. The one case that count gets wrong is the CHANGE
 *  OF ENDS: match/engine.ts pops a trailing 0-0 ("real result sheets print 6-4 ret., not 6-4 0-0
 *  ret."), so a retirement between sets comes back as a COMPLETE last set and "in the first set"
 *  would be a small lie about a set she finished. Hence the second half of the answer: a last set
 *  that is won on the ordinary rules (6-x with two clear, or 7-5, or the 7-6 tiebreak) means she
 *  went off AFTER it, not in it. */
function retirementSet(score: string | undefined): { index: number; completed: boolean } | null {
  const sets = (score ?? '').split(' ').filter((s) => s.length > 0)
  if (sets.length === 0 || sets.length >= SET_ORDINAL.length) return null
  const games = sets[sets.length - 1].split('-').map(Number)
  if (games.length !== 2 || games.some((g) => !Number.isFinite(g))) return null
  const hi = Math.max(games[0], games[1])
  const lo = Math.min(games[0], games[1])
  return { index: sets.length, completed: hi >= 6 && (hi - lo >= 2 || hi === 7) }
}

/** ROUND 23 #3b – THE GIRL ACROSS THE NET IS NAMED WHEN SHE CANNOT FINISH (owner, 20.08: «сходы
 *  можно записать как травмы в логе матча, недели или новостях… мир по ощущениям станет чуть живее»).
 *
 *  ⚠ THIS SURFACES SOMETHING THAT ALREADY HAPPENS AND BUILDS NOTHING. `MatchRecord.retiredId` has
 *  been persisted since the retirement slice; every fact in the sentence is read off the record and
 *  off the event. NO RNG draw, no schema field, no state on any rival – `season/rival.ts`'s "Rivals
 *  get NO injuries, NO physio, NO vacations and NO plan slider" is still true to the letter, and the
 *  girl who stopped on Tuesday is in Monday's draw at full strength exactly as before. The owner
 *  ruled the mechanic out in the same breath he asked for the line («травмы соперницам пока не
 *  строим»).
 *
 *  ⚠ AND THE SENTENCE IS HELD TO WHAT THE MODEL ACTUALLY KNOWS. She retired from a match; she does
 *  NOT have a diagnosis, a scan or a return date, because none of those exist for a rival. So the
 *  line says "retired hurt" and names the set – both true off the record – and never promises a
 *  layoff. "Out for six weeks" would be fiction the game cannot honour next Monday, when she is
 *  entered again.
 *
 *  TWO REGISTERS, ONE ROW. At a rung the world already reports on, the sentence belongs to the
 *  TOURNAMENT and names it, in the same breath as «🏆 … won the World Tour 500» – that is his
 *  «в такой же манере». Below that cut the world is not watching, so the sentence belongs to HER
 *  week and names the girl it happened against. It is never both: one retirement is one row, and
 *  printing the tour line and the week line for the same girl in the same feed would read as a state
 *  dump rather than as news.
 *
 *  ⚠ ONLY HER OPPONENTS CAN EVER APPEAR HERE, and that is a property of the engine rather than a
 *  choice made here – his «хотя бы тех, с кем она играла» is in fact the whole set. AI-AI rows
 *  resolve through `fastMatchProbability`, one Bernoulli against a closed form with no points
 *  played, so no canonical bracket can produce a retirement to report. HER OWN retirement is not
 *  reported either: `finalizeTournament` already ends her summary line with "– she retired hurt"
 *  and `retirementInjury` files the clinic's verdict, so a third row would only repeat them.
 *
 *  Returns null when there is nothing to say. */
export function rivalRetirementNews(
  world: WorldState,
  event: SeasonEvent,
  m: MatchRecord,
  players: Record<string, MatchPlayer>,
): string | null {
  if (m.retiredId === undefined || m.retiredId === KID_ID) return null
  if (m.aId !== KID_ID && m.bId !== KID_ID) return null
  const name = formatShortName((players[m.retiredId] ?? fallbackPlayer(m.retiredId)).name)
  const where = tierMakesWorldNews(event.tier)
    ? `at the ${TIERS[event.tier].label}`
    : `against ${formatShortName(`${world.profile.kidName} ${world.profile.kidLastName}`)}`
  const set = retirementSet(m.score)
  const when =
    set === null ? '' : ` – she went off ${set.completed ? 'after' : 'in'} the ${SET_ORDINAL[set.index]} set`
  return `🩹 ${name} retired hurt ${where}${when}.`
}

export function computeLossStreak(world: WorldState): LossStreak | null {
  let losses = 0
  let startWeek = 0
  for (let i = world.events.length - 1; i >= 0; i--) {
    const e = world.events[i]
    if (!resultShowsOnHerFace(e)) continue
    if (e.match!.winnerId === KID_ID) break
    losses++
    startWeek = e.week
  }
  if (losses === 0) return null
  return {
    losses,
    startWeek,
    angerAt: pickInt(rngFromSeed(`${world.seed}:angry:${startWeek}`), ANGER_STREAK_MIN, ANGER_STREAK_MAX),
  }
}
