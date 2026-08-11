// THE RADAR SUITE'S FIXTURES – the six helpers its three files build careers and views with.
//
// ⚠ WHY THIS EXISTS. tests/radar.test.ts was one 1,108-line file, and it walked into birpc's
// unraisable 60s RPC window on CI: `Tests 61 passed (61)` followed by
// `Timeout calling "onTaskUpdate"`, exit 1, at 62.63s on 10.08 and again on 11.08 – twice through
// the stall retry, which is a fix for a file NEAR the wall and not for one over it. Sharding could
// not help either: scripts/units.mjs already gave that file a process of its own, so the FILE was
// the unit and the file had to be cut. It is now three, and they share these fixtures:
//
//   radar.test.ts           §1 §2 §3 §9 §12  the contour the screen is given, and its honesty
//   radar-read.test.ts      §4 §5 §7 §8      where the reading comes from, how it settles, what it says
//   radar-training.test.ts  §6 §10 §11 §13   the coach's eye, and the Training card it gates
//
// ⚠ IT IS A SPLIT AND NOT A DIET. Every seed, every week count, every assertion and every comment
// crossed over unchanged, and the same 61 tests run under the same names. scripts/units.mjs's own
// header states the rule: cutting seeds until a file fits buys speed with coverage, and that trade
// is made deliberately and measured, never as a side effect of making a wall.
//
// ⚠ AND THE SECTION NUMBERS ARE THE ORIGINAL SUITE'S, deliberately not renumbered. They are quoted
// from OUTSIDE the tests – src/components/SkillsRadar.vue cites "radar.test.ts §12" twice – so a
// tidy renumber would silently point those citations at nothing.
//
// `read` resolves relative to THIS file, which is why the helpers can live here at all: it is in
// tests/ like the files that call it, so every '../src/...' path they pass still means what it did.

import { readFileSync } from 'node:fs'
import { buildTrainingRead, type RadarWorldView } from '../src/engine/radar'
import { SKILL_KEYS, type KidSkills, type SkillKey } from '../src/engine/development'
import {
  availabilityStatus,
  closeTournament,
  createWorld,
  enterEvent,
  KID_ID,
  skipTournament,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS, type CoachTier, type WorldMatch } from '../src/shared/protocol'
import type { MatchPlayer } from '../src/engine/match/types'

export const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

// --- fixtures ----------------------------------------------------------------------------------

export function player(id: string, over: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id, name: id, serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, ...over }
}

/** A history of `n` identical matches – the only way to hold everything about a career still except
 *  what the scorelines say happened. */
export function synthView(over: Partial<RadarWorldView> & { n?: number; score?: string; opp?: Partial<MatchPlayer> } = {}): RadarWorldView {
  const n = over.n ?? 20
  const score = over.score ?? '6-4 6-3'
  const matches: WorldMatch[] = Array.from({ length: n }, (_, i) => ({
    round: 0,
    aId: KID_ID,
    bId: `ai-${i}`,
    winnerId: KID_ID,
    score,
    eventId: `e${i}`,
    surface: 'hard' as const,
    oppName: `Opp ${i}`,
    a: player(KID_ID),
    b: player(`ai-${i}`, over.opp),
  }))
  // ⚠ `skills` IS READ OFF `over` FIRST, not merely spread over afterwards, so that `startSkills`
  // can default to whatever build the case actually asked for. A girl who has not developed at all
  // is the neutral fixture: `startSkills` feeds only the Weekly Story's training line, and every
  // case that cares about movement sets it explicitly. Defaulting it to a FIXED fifty would have
  // silently handed a +14 career to every lopsided-skills case in the note sweep below.
  const skills: KidSkills = over.skills ?? { serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50 }
  const potential: KidSkills = over.potential ?? { serve: 66, ret: 66, composure: 66, stamina: 66, groundstrokes: 66 }
  return {
    seed: 'radar-test',
    week: 52,
    kidId: KID_ID,
    skills,
    startSkills: { ...skills },
    potential,
    coachTier: 'middle',
    coachSinceWeek: 0,
    matchesPlayed: n,
    matches,
    ...over,
  }
}

/** A career driven the way the bench drives one: enter everything, resolve everything. */
export function runCareer(seed: string, tier: CoachTier, weeks: number, onWeek?: (w: WorldState) => void): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy', coachTier: tier })
  const rng = rngFromSeed(world.seed)
  world.plan = { ...WEEK_PLAN_PRESETS.balanced }
  for (let w = 0; w < weeks; w++) {
    for (const e of world.season.filter((e) => e.week > world.week && e.week <= world.week + 4)) {
      if (world.entries.includes(e.id)) continue
      try {
        if (availabilityStatus(world, e).level === 'blocked') continue
        enterEvent(world, e.id)
      } catch {
        /* a lock the player would see on the card */
      }
    }
    tickWeek(world, rng)
    while (world.pendingTournament) {
      if (!world.pendingTournament.finished) skipTournament(world)
      closeTournament(world)
    }
    onWeek?.(world)
  }
  return world
}

/** A girl who has moved `gained` points on one axis, seen by a coach of a given rung. `n` matches
 *  of the given kind is what buys the confidence, exactly as a live career would. */
export function movedView(over: { gained: number; key?: SkillKey; n?: number; tier?: CoachTier; week?: number } ): RadarWorldView {
  const key = over.key ?? 'serve'
  const base = synthView({ n: over.n ?? 40, score: '6-4 3-6 6-4', coachTier: over.tier ?? 'middle', week: over.week ?? 104 })
  return {
    ...base,
    skills: { ...base.skills, [key]: base.skills[key] + over.gained },
    startSkills: { ...base.skills },
  }
}

/** Every read a broad sweep of careers and rungs can produce – the counterpart of `allNotes`.
 *
 *  ⚠ THE WEEK AXIS HAS TO BE WIDE, and it is worth saying why. A line is keyed on
 *  (wing, notch, WEEK) and spoken on only TRAINING_SAY_CHANCE of weeks, so a sweep over four weeks
 *  reaches nine sentences out of a pool of thirty-six and a digit pin over it would be proving
 *  almost nothing. The tier/`n` axis is deliberately NOT crossed with everything instead: those two
 *  only move confidence, and once a wing is over the floor they change no word. */
export function allTrainingReads(): { key: SkillKey | null; label: string | null; text: string }[] {
  const out: { key: SkillKey | null; label: string | null; text: string }[] = []
  const weeks = Array.from({ length: 60 }, (_, i) => 4 + i * 4)
  // read her well / barely / not at all – the three regimes, not the whole ladder.
  const eyes: [number, CoachTier][] = [[60, 'elite'], [24, 'middle'], [0, 'self']]
  for (const [n, tier] of eyes) {
    for (const gained of [0, 1, 3, 6, 10, 16, 24]) {
      for (const key of SKILL_KEYS) {
        for (const week of weeks) {
          const r = buildTrainingRead(movedView({ gained, key, n, tier, week }))
          if (r) out.push(r)
        }
      }
    }
  }
  return out
}
