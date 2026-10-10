// L3-7 (10.10) – THE TWIN'S DRIVER, one implementation for the net and for the pre-wave capture. It plays the benches and the viz builders and records what a PLAYER READS, as strings and digests,
// so the SAME file runs unchanged on the pre-wave tree (where no ref exists) and on this one – the stored old-arm digests (`tests/fixtures/l3-7/old-arm.json`) are the proof that no English moved.
//
// WHAT IT DRIVES: (1) the commentary grid – 36 played matches (three surfaces, awkward name pairs, retirements) x the occasion ladder x the coach, private-life and lineage packets; (2) the preview grid –
// every rung x round x surface x temperature x rank pair; (3) the knock prompt grid (`buildKnockPrompt` over part x repeat x condition x plan); (4) five bench careers to 300 weeks, every event row read
// the moment it was written (an ordinary row is pruned later), and the commentary of every stored match they played; (5) a college career driven through the four years and back.
//
// Nothing here may import a symbol the wave adds: it is the old arm's driver as much as the new one's.
import { createHash } from 'node:crypto'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { replayMatch } from '../../src/composables/annotatedMatch'
import { TIERS, TIER_LADDER } from '../../src/engine/season/calendar'
import { stageLabel } from '../../src/engine/world/labels'
import { buildKnockPrompt } from '../../src/engine/knock'
import { buildCommentary, type Beat, type CommentaryCoach, type CommentaryEvent, type CommentaryLineage, type CommentaryPrivateLife } from '../../src/viz/commentary'
import { buildPreview, occasionOf, type PreviewInput } from '../../src/viz/preview'
import { airBoothMention, boothPrivateLifeAt, createWorld, tickWeek, toSnapshot, type WorldState } from '../../src/engine/world'
import { ECONOMY } from '../../src/engine/economy'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import { standHerAt } from './newsStanding'
import { loveEpisode, married } from './scenarios/love'
import { endCollegeEarly } from '../../src/engine/world/tick'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../../tools/econ-bench'
import { atCollege, pressCollegeYear, finishAnyReveal } from './scenarios/college'
import { drainLifeBeats } from './career'
import type { AnnotatedMatch } from '../../src/shared/matchViz'
import type { MatchOptions, MatchPlayer, Side, Surface } from '../../src/engine/match/types'
import type { TierId } from '../../src/engine/season/types'
import type { WeekPlan } from '../../src/shared/protocol'

export const sha = (s: string): string => createHash('sha1').update(s).digest('hex').slice(0, 12)

// ---------------------------------------------------------------------------------------------------------------------------------------------
// (1) the commentary grid
// ---------------------------------------------------------------------------------------------------------------------------------------------
const SURFACES: Surface[] = ['hard', 'clay', 'grass']
/** awkward name pairs on purpose: two girls who share a first name (both go formal), a single-word name, an opponent called «Top seed» (not a person's name), a hyphenated surname */
const PAIRS: Array<[string, string]> = [
  ['Bianca Tran', 'Dana Delgado'],
  ['Dana Tran', 'Dana Delgado'],
  ['Nadia', 'Ines Duval-Okafor'],
  ['Mei Lindqvist', 'Top seed'],
]
const SKILL = (n: number): Omit<MatchPlayer, 'id' | 'name'> => ({ serve: 50 + (n % 17), ret: 48 + (n % 13), composure: 40 + (n % 21), stamina: 52 + (n % 11), groundstrokes: 51 + (n % 15) })

export interface VizMatch {
  label: string
  match: AnnotatedMatch
  nameA: string
  nameB: string
}

/** 84 played matches, then the first four RETIREMENTS the seed search finds (the retirement beat is a branch of its own) */
export function vizMatches(): VizMatch[] {
  const out: VizMatch[] = []
  const play = (label: string, seed: string, surface: Surface, pair: [string, string], k: number): VizMatch | null => {
    const A: MatchPlayer = { id: 'kid', name: pair[0], ...SKILL(k) }
    const B: MatchPlayer = { id: 'opp', name: pair[1], ...SKILL(k + 7) }
    const opts: MatchOptions = { surface, tour: 'wta', seed }
    const result = simulateMatch(A, B, opts)
    return { label, match: annotateMatch(result, A, B, opts), nameA: pair[0], nameB: pair[1] }
  }
  for (let i = 0; i < 84; i++) out.push(play(`m${i}`, `l37-${i}`, SURFACES[i % 3]!, PAIRS[i % 4]!, i)!)
  let found = 0
  for (let k = 0; k < 400 && found < 4; k++) {
    const m = play(`r${found}`, `l37-ret-${k}`, SURFACES[k % 3]!, PAIRS[k % 4]!, k + 40)!
    if (m.match.result.retired) {
      out.push(m)
      found++
    }
  }
  return out
}

export function vizEvents(): Array<{ label: string; event: CommentaryEvent | null }> {
  const out: Array<{ label: string; event: CommentaryEvent | null }> = [{ label: 'friendly', event: null }]
  for (const tier of TIER_LADDER) {
    const size = TIERS[tier].drawSize
    // every round of every draw: the stake clause names a different place at each of the last four, and a big draw's openers name a round of 128 / 64
    for (let round = 0; round <= Math.log2(size) - 1; round++) out.push({ label: `${tier}#${round}`, event: { tier, roundLabel: stageLabel(round, size) } })
  }
  return out
}

export const COACHES: Array<CommentaryCoach | null> = [null, { side: 0 }, { side: 1 }]
export const LIVES: Array<CommentaryPrivateLife | null> = [
  null,
  ...(['met', 'ended', 'divorced'] as const).flatMap((kind) => [false, true].flatMap((wrong) => ([0, 1] as Side[]).map((side) => ({ side, kind, wrong })))),
]
export const LINEAGES: Array<CommentaryLineage | null> = [
  null,
  ...([0, 1] as Side[]).flatMap((side) => [
    { side, proTitles: 6, collegeTitles: 2, slams: 1 },
    { side, proTitles: 0, collegeTitles: 1, slams: 0 },
    { side, proTitles: 0, collegeTitles: 0, slams: 0 },
  ]),
]

/** what a beat shows a player, and what decides its place in the log – never a ref */
export const beatKey = (b: Beat): string => [b.pointIndex, b.kind, b.lead ?? '-', b.text, b.score, b.set, b.keyMoment].join('|')
export const digestBeats = (beats: readonly Beat[]): string => beats.map(beatKey).join('\n')

/** Visit every build of the grid: the occasion ladder with no packet, then the packets crossed on three occasions for ten matches, then ONE full cross. */
export function eachCommentary(visit: (label: string, beats: Beat[]) => void): void {
  const matches = vizMatches()
  const events = vizEvents()
  const lastOf = (tier: TierId): number => Math.log2(TIERS[tier].drawSize) - 1
  const keep = (label: string): boolean => label === 'friendly' || label === `wta250#${lastOf('wta250')}` || label === `slam#${lastOf('slam')}`
  for (const m of matches) {
    for (const e of events) visit(`${m.label}/${e.label}`, buildCommentary(m.match, m.nameA, m.nameB, e.event))
  }
  for (const m of matches.slice(0, 12)) {
    for (const e of events.filter((x) => keep(x.label))) {
      for (const coach of COACHES) for (const life of LIVES) visit(`${m.label}/${e.label}/c${coach?.side ?? '-'}/l${life ? `${life.kind}${life.wrong ? 'W' : ''}${life.side}` : '-'}`, buildCommentary(m.match, m.nameA, m.nameB, e.event, coach, life, null))
      for (const lineage of LINEAGES) visit(`${m.label}/${e.label}/g${lineage ? `${lineage.proTitles}.${lineage.collegeTitles}.${lineage.side}` : '-'}`, buildCommentary(m.match, m.nameA, m.nameB, e.event, null, null, lineage))
    }
  }
  const full = matches[5]!
  const slam = events.find((e) => e.label === `slam#${lastOf('slam')}`) ?? events[events.length - 1]!
  for (const coach of COACHES) for (const life of LIVES) for (const lineage of LINEAGES) visit(`${full.label}/cross/${coach?.side ?? '-'}/${life ? `${life.kind}${life.wrong ? 'W' : ''}${life.side}` : '-'}/${lineage ? `${lineage.proTitles}.${lineage.collegeTitles}.${lineage.side}` : '-'}`, buildCommentary(full.match, full.nameA, full.nameB, slam.event, coach, life, lineage))
}

/** digest per MATCH over all its builds – small enough to commit, specific enough to name the match that moved */
export function commentaryDigests(): { digests: Record<string, string>; builds: number; beats: number } {
  const bucket = new Map<string, string[]>()
  let builds = 0
  let beats = 0
  eachCommentary((label, list) => {
    const m = label.split('/')[0]!
    const key = label.includes('/cross/') ? `${m}+cross` : label.split('/').length > 2 ? `${m}+packets` : m
    const rows = bucket.get(key) ?? []
    rows.push(`${label}::${digestBeats(list)}`)
    bucket.set(key, rows)
    builds++
    beats += list.length
  })
  const digests: Record<string, string> = {}
  for (const [k, rows] of [...bucket.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) digests[k] = sha(rows.join('\n##\n'))
  return { digests, builds, beats }
}

/** ⭐ THE FAMOUS CAREER PRESET – the booth's packets as the ENGINE issues them. A girl the ladder knows (`standHerAt` 'known'), a public love episode posed in each of its three states (there is somebody, it is over,
 *  the marriage is over) and each right or wrong, aired through the real writer (`airBoothMention`, on a big stage) and read back through the real reader (`boothPrivateLifeAt`) – the two functions the weekly tick and
 *  the snapshot call. Six packets, every one of them the engine's decision; the viewer adds only the side. The poses are wave6-booth-channel's and wave12-parting's own. */
export function famousPackets(): Array<{ label: string; packet: { kind: 'met' | 'ended' | 'divorced'; wrong: boolean } | null }> {
  const out: Array<{ label: string; packet: { kind: 'met' | 'ended' | 'divorced'; wrong: boolean } | null }> = []
  const stage = (label: string, week: number, row: ReturnType<typeof loveEpisode>): void => {
    const world = createWorld(`l37-famous-${label}`, { ...DEFAULT_PROFILE })
    world.week = week
    standHerAt(world, 'known', week - 1)
    world.loveEpisodes = [row]
    airBoothMention(world, ECONOMY.spotlight.stageTierMin)
    out.push({ label, packet: boothPrivateLifeAt(world, week) })
  }
  for (const wrong of [false, true]) {
    stage(`met/${wrong}`, 500, loveEpisode(480, 482, { publicWeek: 498, publicWrong: wrong }))
    stage(`ended/${wrong}`, 900, loveEpisode(600, 602, { endedWeek: 899, publicWeek: 750, airedMetWeek: 752, publicWrong: wrong }))
    stage(`divorced/${wrong}`, 900, married(600, 700, { endedWeek: 899, publicWeek: 750, airedMetWeek: 752, publicWrong: wrong }))
  }
  return out
}

/** the commentary of ten matches on the big occasions under each engine-issued packet, on both sides of the net */
export function famousDigest(): { packets: Array<{ label: string; packet: { kind: string; wrong: boolean } | null }>; digest: string; builds: number; beats: number; booth: number } {
  const packets = famousPackets()
  const events = vizEvents().filter((e) => e.label === 'friendly' || e.label === `wta250#${Math.log2(TIERS.wta250.drawSize) - 1}` || e.label === `slam#${Math.log2(TIERS.slam.drawSize) - 1}`)
  const rows: string[] = []
  let builds = 0
  let beats = 0
  let booth = 0
  for (const m of vizMatches().slice(0, 10)) {
    for (const e of events) {
      for (const { label, packet } of packets) {
        if (!packet) continue
        for (const side of [0, 1] as Side[]) {
          const built = buildCommentary(m.match, m.nameA, m.nameB, e.event, null, { side, ...packet }, null)
          builds++
          beats += built.length
          booth += built.filter((b) => b.kind === 'booth').length
          rows.push(`${m.label}/${e.label}/${label}/${side}::${digestBeats(built)}`)
        }
      }
    }
  }
  return { packets, digest: sha(rows.join('\n##\n')), builds, beats, booth }
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// (2) the preview grid
// ---------------------------------------------------------------------------------------------------------------------------------------------
const TEMPS: Array<number | null> = [null, 8, 16, 21, 26, 31]
const RANKS: Array<[number | null, number | null]> = [[null, null], [120, 61], [5, 9], [40, 40], [30, 31], [null, 17], [88, null]]

export function previewInputs(): Array<{ label: string; input: PreviewInput }> {
  const her: MatchPlayer = { id: 'kid', name: 'Olivia Grant', serve: 54, ret: 52, composure: 48, stamina: 58, groundstrokes: 53, age: 15.4 }
  const opp: MatchPlayer = { id: 'opp', name: 'Dana Delgado', serve: 60, ret: 57, composure: 55, stamina: 60, groundstrokes: 58, age: 17.8 }
  const unaged: MatchPlayer = { ...opp, age: undefined }
  const out: Array<{ label: string; input: PreviewInput }> = []
  const events: Array<{ label: string; event: PreviewInput['event'] }> = [{ label: 'friendly', event: null }]
  for (const tier of TIER_LADDER) {
    const size = TIERS[tier].drawSize
    for (let round = 0; round <= Math.log2(size) - 1; round++) events.push({ label: `${tier}#${round}`, event: { tier, roundLabel: stageLabel(round, size) } })
  }
  for (const e of events) {
    for (const surface of SURFACES) {
      for (const temperatureC of TEMPS) {
        for (const [heroRank, oppRank] of RANKS) {
          out.push({ label: `${e.label}/${surface}/${temperatureC}/${heroRank}-${oppRank}`, input: { a: her, b: opp, heroSide: 0, surface, tour: 'wta', heroRank, oppRank, event: e.event, temperatureC } })
        }
      }
    }
  }
  // the hero on the other side of the net, no ages, a bare-name opponent
  const bare: MatchPlayer = { id: 'opp', name: 'Top seed', serve: 60, ret: 57, composure: 55, stamina: 60, groundstrokes: 58 }
  // an opponent whose age the save never froze, with and without a rank (the opponent line has four shapes)
  for (const oppRank of [null, 23]) out.push({ label: `unaged/${oppRank}`, input: { a: her, b: unaged, heroSide: 0, surface: 'hard', tour: 'wta', heroRank: 70, oppRank, event: { tier: 'wta500', roundLabel: 'Quarterfinal' }, temperatureC: 22 } })
  out.push({ label: 'flip', input: { a: opp, b: her, heroSide: 1, surface: 'clay', tour: 'wta', heroRank: 12, oppRank: 11, event: { tier: 'wta500', roundLabel: 'Semifinal' }, temperatureC: 19 } })
  out.push({ label: 'bare', input: { a: { ...her, age: undefined }, b: bare, heroSide: 0, surface: 'grass', tour: 'wta', heroRank: null, oppRank: null, event: null, temperatureC: null } })
  return out
}

export function previewDigests(): { digests: Record<string, string>; builds: number; lines: number } {
  const bucket = new Map<string, string[]>()
  let lines = 0
  const all = previewInputs()
  for (const { label, input } of all) {
    const built = buildPreview(input)
    lines += built.length
    const tier = label.split('#')[0]!.split('/')[0]!
    const rows = bucket.get(tier) ?? []
    rows.push(`${label}::${built.map((l) => `${l.key}|${l.text}`).join('\n')}`)
    bucket.set(tier, rows)
  }
  const digests: Record<string, string> = {}
  for (const [k, rows] of [...bucket.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) digests[k] = sha(rows.join('\n##\n'))
  return { digests, builds: all.length, lines }
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// (3) the knock prompt grid
// ---------------------------------------------------------------------------------------------------------------------------------------------
export const KNOCK_PARTS = ['ankle', 'shoulder', 'lower back', 'foot', 'wrist']
export function knockPrompts(): Array<{ label: string; prompt: ReturnType<typeof buildKnockPrompt> }> {
  const out: Array<{ label: string; prompt: ReturnType<typeof buildKnockPrompt> }> = []
  const plans = [30, 50, 70, 85, 100]
  for (const part of KNOCK_PARTS) {
    for (const repeat of [false, true]) {
      for (const condition of [20, 45, 55, 62, 75, 95]) {
        for (const train of plans) {
          for (const sinceWeek of [3, 11, 40, 77]) {
            const knock = { part, repeat, sinceWeek, choice: null, untilWeek: sinceWeek } as unknown as Parameters<typeof buildKnockPrompt>[0]
            const plan = { train, rest: 50 } as unknown as WeekPlan
            out.push({ label: `${part}/${repeat}/${condition}/${train}/${sinceWeek}`, prompt: buildKnockPrompt(knock, 'l37-seed', condition, plan) })
          }
        }
      }
    }
  }
  return out
}
export const knockDigest = (): { digest: string; prompts: number } => {
  const all = knockPrompts()
  return { digest: sha(all.map((p) => `${p.label}::${p.prompt.part}|${p.prompt.repeat}|${p.prompt.line}|${p.prompt.read}|${p.prompt.cause}|${p.prompt.restCost}|${p.prompt.pushCost}`).join('\n')), prompts: all.length }
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// (4)+(5) the played careers
// ---------------------------------------------------------------------------------------------------------------------------------------------
export interface RowRead { id: number; week: number; type: string; text: string; amountCents?: number; keep?: boolean; hasMatch: boolean; c?: unknown }
export interface Played {
  label: string
  /** every event row, read the moment it was written */
  rows: RowRead[]
  /** the stored matches those rows carried, in order */
  matches: Array<{ rec: NonNullable<WorldState['events'][number]['match']> }>
  weeks: number
  world: WorldState
  /** the MAIN stream's next three draws */
  next3: number[]
}

function readNew(world: WorldState, state: { last: number }, rows: RowRead[], matches: Played['matches']): void {
  for (const e of world.events) {
    if (e.id <= state.last) continue
    const r = e as unknown as RowRead & { match?: NonNullable<WorldState['events'][number]['match']>; c?: unknown }
    rows.push({ id: e.id, week: e.week, type: e.type, text: e.text, amountCents: e.amountCents, keep: e.keep, hasMatch: !!e.match, ...(r.c ? { c: r.c } : {}) })
    if (e.match) matches.push({ rec: e.match })
  }
  const top = world.events.reduce((m, e) => Math.max(m, e.id), state.last)
  state.last = top
}

export function playBench(presetIdx: number, policyIdx: number, weeks: number, onWeek?: (w: number, world: WorldState) => void): Played {
  const policy = POLICIES[policyIdx]!
  const { world, rng } = openCareer(PRESETS[presetIdx]!, 0, policy)
  const rows: RowRead[] = []
  const matches: Played['matches'] = []
  const state = { last: -1 }
  readNew(world, state, rows, matches)
  for (let w = 0; w < weeks; w++) {
    stepCareerWeek(world, rng, policy)
    readNew(world, state, rows, matches)
    onWeek?.(w, world)
  }
  return { label: `${presetIdx}/${policyIdx}`, rows, matches, weeks, world, next3: [rng(), rng(), rng()] }
}

/** a career played to the fork, answered «college», driven through the years (the last year early on the odd seed) and then back on tour for a season */
export function playCollege(seed: string, early: boolean): Played {
  const { world, rng } = atCollege(seed)
  const rows: RowRead[] = []
  const matches: Played['matches'] = []
  const state = { last: -1 }
  readNew(world, state, rows, matches)
  let weeks = 0
  let returned = false
  // one press is not one year – `resumeFromCollege` stops on her birthday, the championship and the call-up – so the walk presses until the latch clears (the degree is done, or she came back early)
  for (let press = 0; press < 80 && world.ending?.type === 'college'; press++) {
    pressCollegeYear(world, rng)
    readNew(world, state, rows, matches)
    const c = world.college
    if (early && !returned && c && c.doneWeek === null && (c.pendingYearStart ?? null) === null && c.years.length >= 2 && world.ending?.type === 'college') {
      endCollegeEarly(world)
      returned = true
      readNew(world, state, rows, matches)
    }
  }
  weeks = world.week
  for (let i = 0; i < 70; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
    drainLifeBeats(world)
    readNew(world, state, rows, matches)
  }
  weeks = world.week
  return { label: `college/${seed}/${early ? 'early' : 'full'}`, rows, matches, weeks, world, next3: [rng(), rng(), rng()] }
}

/** the commentary and preview a player would have WATCHED for every stored match of a played career (the occasion read off the record, exactly as the viewer's callers do) */
export function watchedDigest(p: Played): { digest: string; matches: number; beats: number } {
  const lines: string[] = []
  let beats = 0
  for (const { rec } of p.matches) {
    const m = replayMatch(rec)
    const event = occasionOf(rec.eventId, rec.round)
    const built = buildCommentary(m, rec.a.name, rec.b.name, event)
    beats += built.length
    lines.push(digestBeats(built))
  }
  return { digest: sha(lines.join('\n##\n')), matches: p.matches.length, beats }
}

/** the rows as a player read them – text and its place, never a ref */
export const rowKey = (r: RowRead): string => [r.id, r.week, r.type, r.text, r.amountCents ?? '', r.keep ? 'K' : '', r.hasMatch ? 'M' : ''].join('|')
export const rowsDigest = (rows: readonly RowRead[]): string => sha(rows.map(rowKey).join('\n'))

/** the world minus every ref, as JSON – the proof that the engine's STATE did not move */
export function worldMinusRefs(world: WorldState): string {
  return JSON.stringify(world, (k, v) => (k === 'c' || /[a-z]C$/.test(k) ? undefined : v))
}

/** the snapshot's English, as the player reads it, minus every `*C` ref field */
export function snapshotMinusRefs(world: WorldState): string {
  return JSON.stringify(toSnapshot(world), (k, v) => (k === 'c' || /[a-z]C$/.test(k) ? undefined : v))
}

// Per-top-level-key digests of the same minus-refs serialisation. Added 10.10 after a morning red
// that showed only the aggregate hash: an unreproducible mismatch (a gate run against a mid-edit
// shared checkout) cost an hour of hunting that a field NAME would have ended in a minute. The
// stripper and the top-level filter must stay byte-equivalent to the aggregate functions above –
// a key the aggregate drops may not appear here, or the two nets disagree about what moved.
function fieldDigests(obj: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of Object.keys(obj)) {
    if (key === 'c' || /[a-z]C$/.test(key)) continue
    const v = obj[key]
    if (v === undefined) continue
    out[key] = sha(JSON.stringify(v, (k, vv) => (k === 'c' || /[a-z]C$/.test(k) ? undefined : vv)))
  }
  return out
}
export function worldFieldDigests(world: WorldState): Record<string, string> {
  return fieldDigests(world as unknown as Record<string, unknown>)
}
export function snapshotFieldDigests(world: WorldState): Record<string, string> {
  return fieldDigests(toSnapshot(world) as unknown as Record<string, unknown>)
}
