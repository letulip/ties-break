import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  createWorld,
  tickWeek,
  enterEvent,
  skipEvent,
  skipTournament,
  closeTournament,
  revealTournamentRound,
  accrueCondition,
  matchDrain,
  tournamentRunStrain,
  restRecoveryBonus,
  conditionMatchFactor,
  kidMatchPlayer,
  toSnapshot,
  financeWindow,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed, type Rng } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { TIERS } from '../src/engine/season/calendar'
import { INCOME_CATS } from '../tools/econ-bench'

// ---------------------------------------------------------------------------
// Round-9 pt3 — engine pack: savings interest (R9-1), per-match tournament
// strain (R9-7), recovery re-tune (R9-10), physio condition bonus (R9-14),
// match-strength coupling ON (R9-19), skip-at-event-week (R9-9) and the loud
// injury stop's UI wiring (R9-21a).
//
// RNG discipline: NOTHING in this pack draws from the MAIN weekly stream —
// interest is deterministic, strain/recovery/physio-bonus are pure arithmetic,
// and the coupling only scales the kid's MatchPlayer on the EVENT-scoped
// `seed:kidtour` stream. The B1/C1 freezes (seed bench-working-0, count 45239,
// hash 9f783705) stay green untouched; the skip test below re-proves the hash.
// ---------------------------------------------------------------------------

// FNV-1a over the stringified draw stream (same fingerprint as B1/C1).
function fnv1a(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}
function hashOf(draws: number[]): string {
  return fnv1a(draws.map((d) => d.toString()).join(','))
}
const REF = { count: 45239, hash: '9f783705' } // the frozen B1/C1 capture

/** Enter the earliest still-open local event and tick until its week spawns the reveal.
 *  BOUNDED: a random injury before the event week would auto-withdraw the entry (or turn the
 *  play week into a walkover) and the reveal would never spawn – the deterministic seeds below
 *  are chosen so that never happens; the guard fails loudly instead of spinning. */
function tickToPending(seed: string, mutate?: (w: WorldState) => void): {
  world: WorldState
  rng: Rng
  eventId: string
  travelCostCents: number
} {
  const world = createWorld(seed)
  if (mutate) mutate(world)
  const target = world.season.find((e) => e.tier === 'local' && e.deadlineWeek >= world.week)!
  enterEvent(world, target.id)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 12 && !world.pendingTournament; i++) tickWeek(world, rng)
  if (!world.pendingTournament) throw new Error(`seed ${seed}: reveal never spawned (injury got in the way?) – pick another seed`)
  return { world, rng, eventId: target.id, travelCostCents: target.travelCostCents }
}

// ---------------------------------------------------------------------------
// R9-1 — savings interest.
// ---------------------------------------------------------------------------
describe('R9-1 — savings interest', () => {
  it('a positive balance earns round(funds × apyWeekly) as an income event, category interest', () => {
    const w = createWorld('r9-interest') // middle: $25,000 start
    const carriedIn = w.fundsCents
    const expected = Math.round(carriedIn * ECONOMY.savings.apyWeekly)
    expect(expected).toBeGreaterThanOrEqual(1)
    tickWeek(w, rngFromSeed(w.seed))
    const ev = w.events.find((e) => e.week === 1 && e.category === 'interest')
    expect(ev).toBeDefined()
    expect(ev!.type).toBe('income')
    expect(ev!.text).toBe('Savings interest')
    expect(ev!.amountCents).toBe(expected)
  })

  it('interest is computed on the CARRIED-IN balance, before the week\'s other flows', () => {
    // Week 2's interest must key off funds at the END of week 1 (post all week-1 flows),
    // not off any intra-week-2 value.
    const w = createWorld('r9-interest-carry')
    const rng = rngFromSeed(w.seed)
    tickWeek(w, rng)
    const endOfW1 = w.fundsCents
    tickWeek(w, rng)
    const ev = w.events.find((e) => e.week === 2 && e.category === 'interest')
    expect(ev!.amountCents).toBe(Math.round(endOfW1 * ECONOMY.savings.apyWeekly))
  })

  it('a negative or zero balance earns nothing', () => {
    for (const funds of [-100_00, 0]) {
      const w = createWorld(`r9-interest-neg-${funds}`)
      w.fundsCents = funds
      tickWeek(w, rngFromSeed(w.seed))
      expect(w.events.some((e) => e.category === 'interest')).toBe(false)
    }
  })

  it('sub-cent interest is not emitted (round() < 1)', () => {
    const w = createWorld('r9-interest-tiny')
    w.fundsCents = 500 // 500¢ × 0.0006 = 0.3 → round 0 → nothing
    tickWeek(w, rngFromSeed(w.seed))
    expect(w.events.some((e) => e.category === 'interest')).toBe(false)
  })

  it('folds into the finance ledger as an income-side category (Money breakdown + bench)', () => {
    const w = createWorld('r9-interest-fold')
    const rng = rngFromSeed(w.seed)
    tickWeek(w, rng)
    tickWeek(w, rng)
    const win = financeWindow(w.financeWeeks, 0)
    expect(win.byCategory.interest ?? 0).toBeGreaterThan(0)
    // income side, never expense
    const snapWin = toSnapshot(w).finance.window12w
    expect(snapWin.incomeCents).toBeGreaterThanOrEqual(snapWin.byCategory.interest ?? 0)
    // the bench's exhaustive income list carries the new category
    expect(INCOME_CATS).toContain('interest')
  })

  it('draws zero RNG: the interest step never touches the main stream', () => {
    // Identical draw streams whether the balance is huge (interest fires) or negative
    // (it never does) — the funds-variant arm of B1, re-proven against the new step.
    const record = (funds: number): string => {
      const w = createWorld('r9-interest-rng')
      w.fundsCents = funds
      const base = rngFromSeed(w.seed)
      const draws: number[] = []
      const rng = () => {
        const v = base()
        draws.push(v)
        return v
      }
      for (let i = 0; i < 20; i++) tickWeek(w, rng)
      return hashOf(draws)
    }
    expect(record(9_999_999_00)).toBe(record(-1_00))
  })
})

// ---------------------------------------------------------------------------
// R9-10 / R9-14 — recovery (owner redesign: time-based, integer) + physio bonus.
// Recovery = 2 always, + the train/rest slider bonus on MATCH-FREE weeks only
// (rest >= 40 → +2, >= 25 → +1, below → 0; threshold, never interpolated),
// + 2 while physioActive, + 1 on blackout weeks. The slider no longer drains.
// ---------------------------------------------------------------------------
describe('R9-10/R9-14 — time-based recovery + physio bonus', () => {
  it('match-free weeks: grind 85/15 → +2, balanced 75/25 → +3, light 60/40 → +4', () => {
    const cases: Array<{ plan: { train: number; rest: number }; gain: number }> = [
      { plan: { train: 85, rest: 15 }, gain: 2 }, // base 2 + slider 0
      { plan: { train: 75, rest: 25 }, gain: 3 }, // base 2 + slider 1
      { plan: { train: 60, rest: 40 }, gain: 4 }, // base 2 + slider 2
    ]
    for (const { plan, gain } of cases) {
      const w = createWorld(`r9-rec-${plan.rest}`)
      w.physioActive = false
      w.condition = 50
      w.plan = plan
      accrueCondition(w, false)
      expect(w.condition).toBe(50 + gain)
    }
  })

  it('a match week earns NO slider bonus – just the base (fatigue lands at finalize)', () => {
    const w = createWorld('r9-rec-match')
    w.physioActive = false
    w.condition = 50
    w.plan = { train: 60, rest: 40 } // would be +2 slider on a free week
    accrueCondition(w, true)
    expect(w.condition).toBe(52) // base 2 only
  })

  it('R9-14: physioActive adds conditionBonusPerWeek = 2 (the billed retainer finally shows)', () => {
    const w = createWorld('r9-physio-bonus')
    w.condition = 50
    w.plan = { train: 75, rest: 25 }
    w.physioActive = true
    accrueCondition(w, false)
    expect(w.condition).toBe(55) // 2 base + 1 slider + 2 physio
    expect(ECONOMY.physio.conditionBonusPerWeek).toBe(2)
  })

  it('a blackout week adds +1; everything clamps at 100', () => {
    const w = createWorld('r9-rec-blackout')
    w.physioActive = false
    w.plan = { train: 75, rest: 25 }
    w.week = 49 // off-season → blackout
    w.condition = 50
    accrueCondition(w, false)
    expect(w.condition).toBe(54) // 2 base + 1 slider + 1 blackout
    w.condition = 99
    accrueCondition(w, false)
    expect(w.condition).toBe(100) // clamped
  })
})

// ---------------------------------------------------------------------------
// R9-7 — match-based fatigue (owner redesign, integer per match), applied when
// the run COMMITS (finalize). matchDrain = 1 (straight sets, no TB) | 2 (a
// 3-setter OR a TB in a 2-setter) | 3 (more than 2 TB sets), + the tier's
// per-match surcharge (local 0 / regional 1 / national 2 / itf 3).
// ---------------------------------------------------------------------------
describe('R9-7 — match-based fatigue', () => {
  it('matchDrain grades the scoreline: 1 easy, 2 hard, 3 a three-tiebreak epic', () => {
    expect(matchDrain('local', '6-4 6-2')).toBe(1) // straight sets, no TB
    expect(matchDrain('local', '7-6 6-4')).toBe(2) // TB in a 2-setter
    expect(matchDrain('local', '6-4 3-6 6-2')).toBe(2) // 3 sets
    expect(matchDrain('local', '7-6 6-7 7-6')).toBe(3) // 3 TB sets → +1 extra
    expect(matchDrain('local', '7-6 6-7 6-3')).toBe(2) // 2 TBs is still just a hard match
  })

  it('the tier surcharge is PER MATCH: hardest national match = 5', () => {
    expect(matchDrain('regional', '6-4 6-2')).toBe(2) // 1 + 1
    expect(matchDrain('national', '6-4 6-2')).toBe(3) // 1 + 2
    expect(matchDrain('national', '7-6 6-7 7-6')).toBe(5) // 3 + 2 – the owner's own check
    expect(matchDrain('itf', '6-4 6-2')).toBe(4) // 1 + 3 (extrapolated tier)
    // a record without a score (defensive) counts as straight sets
    expect(matchDrain('national', undefined)).toBe(3)
  })

  it('tournamentRunStrain sums the run: a 5-match National of epics maxes at 25', () => {
    expect(tournamentRunStrain('national', new Array(5).fill({ score: '7-6 6-7 7-6' }))).toBe(25)
    expect(tournamentRunStrain('local', [{ score: '6-4 6-2' }, { score: '7-6 4-6 6-3' }])).toBe(3) // 1 + 2
    expect(tournamentRunStrain('itf', [])).toBe(0) // no matches, no drain
  })

  it('no fatigue lands at tick time; the full run drain lands at finalizeTournament', () => {
    const { world } = tickToPending('r9-strain-2')
    const afterTick = world.condition
    const p = world.pendingTournament!
    const kidMatches = p.result.matches.filter((m) => m.aId === KID_ID || m.bId === KID_ID)
    expect(kidMatches.length).toBeGreaterThan(0)
    const strain = tournamentRunStrain('local', kidMatches)
    expect(strain).toBeGreaterThan(0)
    skipTournament(world) // reveal-all → finalize commits the run
    const c = ECONOMY.condition
    const expected = Math.max(c.min, Math.min(c.max, afterTick - strain))
    expect(world.condition).toBe(expected)
    closeTournament(world)
  })
})

// ---------------------------------------------------------------------------
// R9-19 — match-strength coupling ON (owner curve: knee 70, floor 0.55).
// ---------------------------------------------------------------------------
describe('R9-19 — match-strength coupling', () => {
  it('conditionMatchFactor: no penalty at/above the knee, linear to 0.55 at 0', () => {
    expect(ECONOMY.condition.matchStrengthKnee).toBe(70)
    expect(ECONOMY.condition.matchStrengthFloor).toBe(0.55)
    expect(conditionMatchFactor(100)).toBe(1)
    expect(conditionMatchFactor(85)).toBe(1)
    expect(conditionMatchFactor(70)).toBe(1) // fresh enough – the knee itself is penalty-free
    expect(conditionMatchFactor(35)).toBeCloseTo(0.775, 10) // halfway down the ramp
    expect(conditionMatchFactor(0)).toBeCloseTo(0.55, 10)
  })

  it('the shadow tournament scales the kid\'s MatchPlayer by the factor (stored snapshot included)', () => {
    // Grind + no physio so she arrives at the event week genuinely worn.
    const { world } = tickToPending('r9-couple', (w) => {
      w.physioActive = false
      w.plan = { train: 100, rest: 0 }
      w.condition = 40
    })
    expect(world.condition).toBeLessThan(100)
    const factor = conditionMatchFactor(world.condition)
    expect(factor).toBeLessThan(1)
    const raw = kidMatchPlayer(world)
    const stored = world.pendingTournament!.players[KID_ID]
    expect(stored.serve).toBeCloseTo(raw.serve * factor, 10)
    expect(stored.ret).toBeCloseTo(raw.ret * factor, 10)
    expect(stored.composure).toBeCloseTo(raw.composure * factor, 10)
    expect(stored.stamina).toBeCloseTo(raw.stamina * factor, 10)
    skipTournament(world)
    closeTournament(world)
  })

  it('at condition 100 the kid plays unscaled (factor exactly 1)', () => {
    // Default profile (hired coach → physio on) + balanced plan keeps her at 100.
    const { world } = tickToPending('r9-couple-fresh')
    expect(world.condition).toBe(100)
    const raw = kidMatchPlayer(world)
    const stored = world.pendingTournament!.players[KID_ID]
    expect(stored.serve).toBe(raw.serve)
    expect(stored.stamina).toBe(raw.stamina)
    skipTournament(world)
    closeTournament(world)
  })
})

// ---------------------------------------------------------------------------
// R9-9 — skip/back at the tournament week.
// ---------------------------------------------------------------------------
describe('R9-9 — skipEvent at the tournament week', () => {
  it('travel refunded, entry fee forfeited, no run committed, week closes as non-playing', () => {
    // Light plan (60/40 → slider bonus +2) + a worn kid, so the retroactive match-free bonus
    // is visible below the clamp.
    const { world, rng, eventId, travelCostCents } = tickToPending('r9-skip', (w) => {
      w.physioActive = false
      w.plan = { train: 60, rest: 40 }
      w.condition = 30
    })
    const weekOfEvent = world.week
    const fundsAfterTick = world.fundsCents
    const conditionAfterTick = world.condition

    skipEvent(world, eventId)

    expect(world.pendingTournament).toBeNull()
    expect(world.entries).not.toContain(eventId)
    // travel comes back in full; the entry fee does NOT.
    expect(world.fundsCents).toBe(fundsAfterTick + travelCostCents)
    const refund = world.events.find(
      (e) => e.week === weekOfEvent && e.type === 'income' && e.text === `Travel refunded: ${TIERS.local.label}`,
    )
    expect(refund).toBeDefined()
    expect(refund!.amountCents).toBe(travelCostCents)
    expect(refund!.category).toBe('travel')
    expect(world.events.some((e) => e.week === weekOfEvent && e.text.startsWith('Entry refunded'))).toBe(false)
    // the info beat, short dash.
    expect(
      world.events.some(
        (e) => e.week === weekOfEvent && e.type === 'info' && e.text === `Skipped ${TIERS.local.label} – entry fee forfeited.`,
      ),
    ).toBe(true)
    // nothing resolved: no matches, no points, no W-L, no match drain. The week ended
    // match-free after all, so she earns the slider recovery bonus tickWeek withheld.
    expect(world.events.some((e) => e.type === 'match')).toBe(false)
    expect(world.results.filter((r) => r.playerId === KID_ID)).toHaveLength(0)
    expect(world.seasonWins + world.seasonLosses).toBe(0)
    expect(world.condition).toBe(Math.min(100, conditionAfterTick + restRecoveryBonus(world.plan.rest)))
    // time moves again — the week is closed.
    tickWeek(world, rng)
    expect(world.week).toBe(weekOfEvent + 1)
  })

  it('guards: unknown event / already under way', () => {
    const { world, eventId } = tickToPending('r9-skip-guard')
    expect(() => skipEvent(world, 'nope')).toThrow('No tournament to skip this week')
    revealTournamentRound(world) // first match shown — no backing out any more
    expect(() => skipEvent(world, eventId)).toThrow('already under way')
    skipTournament(world)
    closeTournament(world)
    expect(() => skipEvent(world, eventId)).toThrow('No tournament to skip this week')
  })

  it('skipping never perturbs the main stream: the frozen B1/C1 capture reproduces', () => {
    const world = createWorld('bench-working-0')
    const target = world.season.find((e) => e.tier === 'local' && e.deadlineWeek >= world.week)!
    enterEvent(world, target.id)
    const base = rngFromSeed(world.seed)
    const draws: number[] = []
    const rng = () => {
      const v = base()
      draws.push(v)
      return v
    }
    for (let i = 0; i < 52; i++) {
      tickWeek(world, rng)
      if (world.pendingTournament) skipEvent(world, world.pendingTournament.eventId)
    }
    expect(draws.length).toBe(REF.count)
    expect(hashOf(draws)).toBe(REF.hash)
  })
})

// ---------------------------------------------------------------------------
// R9-9 / R9-21a — UI wiring (source-level guards, the B7/C-suite pattern).
// ---------------------------------------------------------------------------
describe('R9-9/R9-21a — UI wiring', () => {
  it('TournamentFlow splash carries Back + a confirmed skip that calls the skipEvent command', () => {
    const src = readFileSync(new URL('../src/components/TournamentFlow.vue', import.meta.url), 'utf8')
    expect(src).toContain('← Back')
    expect(src).toContain('skipEvent')
    expect(src).toContain('ConfirmDialog')
  })

  it('App.vue can hide the flow (Back) and offers a Resume affordance while the week is paused', () => {
    const src = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
    expect(src).toContain('tournamentHidden')
    expect(src).toContain('Resume')
  })

  it('the injury stop is a blocking popup with kind/weeks/withdrawals and an alert sfx — not a toast', () => {
    const dialog = readFileSync(new URL('../src/components/InjuryStopDialog.vue', import.meta.url), 'utf8')
    expect(dialog).toContain('playSfx')
    expect(dialog).toContain('injury')
    expect(dialog).toContain('Entry refunded')
    const app = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
    expect(app).toContain('InjuryStopDialog')
    expect(app).not.toContain('she picked up an injury – see the news')
  })
})

// ---------------------------------------------------------------------------
// Round-9 pt4 — UI pack wiring (source-level guards, the B7/C-suite pattern)
// + the R9-17 engine-to-feed verification.
// ---------------------------------------------------------------------------
describe('R9-17 — the recovery line reaches the News feed', () => {
  it('a forced injury + recovery emits the 💪-mapped event into the snapshot feed', () => {
    const w = createWorld('r9-recovery-feed')
    w.injury = { kind: 'knee strain', severity: 'moderate', weeksRemaining: 1, totalWeeks: 3, sinceWeek: w.week }
    tickWeek(w, rngFromSeed(w.seed))
    const rec = toSnapshot(w).events.find((e) => e.type === 'recovery')
    expect(rec).toBeDefined()
    expect(rec!.text).toBe('Back on court – cleared to play.')
    // HomeScreen's feed keeps non-financial types (recovery included) and maps 💪 to it.
    const home = readFileSync(new URL('../src/components/screens/HomeScreen.vue', import.meta.url), 'utf8')
    expect(home).toContain("recovery: '💪'")
    expect(home).toContain("e.type !== 'expense' && e.type !== 'income'")
  })
})

describe('pt4 — UI wiring', () => {
  const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8')

  it('R9-4: Sora reaches the kid name, tournament names and the Season heading', () => {
    const css = read('../src/style.css')
    for (const sel of ['.kid-name', '.player-name', '.event-tier']) {
      const block = css.slice(css.indexOf(`${sel} {`))
      expect(block.slice(0, block.indexOf('}'))).toContain('var(--font-heading)')
    }
    expect(css).toContain('.season-topbar h2')
  })

  it('R9-8: the Home plan line is unbordered plain text with the tournament name', () => {
    const home = read('../src/components/screens/HomeScreen.vue')
    expect(home).toContain('this-week-plan')
    expect(home).not.toContain('<span class="pill">Training')
  })

  it('R9-13/15: all three portrait surfaces run through the shared emotion composable', () => {
    for (const p of ['../src/App.vue', '../src/components/screens/HomeScreen.vue', '../src/components/screens/KidScreen.vue']) {
      expect(read(p)).toContain('useKidEmotion')
    }
  })

  it('R9-18: the recap dismissal survives remounts (module scope) and the rule is documented', () => {
    const home = read('../src/components/screens/HomeScreen.vue')
    expect(home).toContain('dismissedRecapKey')
    expect(home).toMatch(/<script lang="ts">/) // the plain (module-scope) block exists
    expect(home).toContain('THE RULE')
  })

  it('R9-21b: the Home tab carries an unread-news dot and a soft cue on arrival', () => {
    const app = read('../src/App.vue')
    expect(app).toContain('homeHasNews')
    expect(app).toContain("playSfx('clickSoft')")
    expect(app).toContain('lastSeenNewsId')
  })

  it('R9-23: reaction cues fire at the scoring instant; the *-end event starts are silent', () => {
    const viewer = read('../src/components/MatchViewer.vue')
    expect(viewer).toMatch(/if \(ev\.kind !== 'point-end'\) return/)
    expect(viewer).toContain('match > set > game')
  })

  it('R9-24: long cues rate-match the clip (cap 2, preservesPitch) and the seats hold scales', () => {
    const sfx = read('../src/audio/sfx.ts')
    expect(sfx).toContain('preservesPitch')
    expect(sfx).toContain('MAX_RATE = 2')
    const viewer = read('../src/components/MatchViewer.vue')
    expect(viewer).toContain('playLong')
    expect(viewer).toContain('SEATS_PREROLL_MS / Math.min(speed.value, 2)')
  })
})
