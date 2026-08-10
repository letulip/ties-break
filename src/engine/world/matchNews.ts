// MATCH NEWS: turning a resolved tournament into the lines the feed shows, and the streak the
// Home card reads off them.
//
// ⚠ DEPENDENCY DIRECTION. Small derivations over a finished TournamentResult and the events ledger.
// `WorldState` is a TYPE-ONLY import; nothing here draws on any RNG stream.
import { formatShortName } from '../../shared/format'
import { ANGER_STREAK_MAX, ANGER_STREAK_MIN, resultShowsOnHerFace } from '../../shared/avatarEmotion'
import { pickInt, rngFromSeed } from '../rng'
import { TIERS } from '../season/calendar'
import type { MatchPlayer } from '../match/types'
import type { MatchRecord, SeasonEvent, TournamentResult } from '../season/types'
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
