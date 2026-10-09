// THE `xx` CARPET, AREA 3 – every BLOCKING card, the dismiss law at 375x667 AND 320x568 (wave L4-2, spec §6). The retirement question (ordinary
// and last winter), the first-run language prompt, the tour briefing, the knock (first and repeat), the injury stop, the birthday, the life
// beats, the fork, the season wrap-up, the graduation card, the wedding moment, the shoot collision, the rank help, the sale card, and the two
// cards More raises (a confirmation, the feedback form). Each is mounted as the net of its own wave mounts it; the harness judges the card's
// decision block with `assertDismissReachable` – the dialogs' own instrument – in English and under `xx`, at both phones.
//
// ⚠ A BLOCKING OVERLAY HAS NO WAY OUT BUT ITS OWN BUTTONS (CLAUDE.md, the popup law, round-20 #3): a decision block that leaves the screen
// stops the career. So a dismiss verdict that is not `ok` is a finding of the first order, and the ledger carries it by viewport.
import { vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import '../../src/style.css'

vi.mock('../../src/audio/sfx', () => ({
  playSfx: () => {},
  primeSfx: () => {},
  initSfx: () => {},
  installGlobalSfx: () => {},
  isMuted: () => false,
  setMuted: () => {},
}))
vi.mock('../../src/worker/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/worker/client')>()
  return { ...actual, request: vi.fn(async () => ({ ok: false })) }
})

import RetirementDialog from '../../src/components/RetirementDialog.vue'
import LocalePrompt from '../../src/components/LocalePrompt.vue'
import TourBriefingDialog from '../../src/components/TourBriefingDialog.vue'
import KnockDialog from '../../src/components/KnockDialog.vue'
import InjuryStopDialog from '../../src/components/InjuryStopDialog.vue'
import BirthdayDialog from '../../src/components/BirthdayDialog.vue'
import LifeBeatDialog from '../../src/components/LifeBeatDialog.vue'
import ForkDialog from '../../src/components/ForkDialog.vue'
import SeasonSummaryDialog from '../../src/components/SeasonSummaryDialog.vue'
import CollegeDoneDialog from '../../src/components/CollegeDoneDialog.vue'
import LifeMomentOverlay from '../../src/components/LifeMomentOverlay.vue'
import ShootClashDialog from '../../src/components/ShootClashDialog.vue'
import RankHelpDialog from '../../src/components/RankHelpDialog.vue'
import SaleDialog from '../../src/components/SaleDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { buildKnockPrompt } from '../../src/engine/knock'
import { ENDINGS } from '../../src/engine/ending'
import { LIFE_MOMENT_CONFIRM } from '../../src/engine/world/lifeMomentCopy'
import { resetLifeMomentForTests } from '../../src/composables/lifeMoment'
import { KID_ID } from '../../src/engine/world/constants'
import { buildLifeBeatPrompt, createWorld, measureCollegeOffer, raiseLifeBeat, tickWeek, toSnapshot, type WorldState } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS, type CollegeYear, type Knock, type LifeBeatPrompt, type RetirementOffer, type SeasonHistoryEntry, type SeasonSummary, type SeasonTrackRow, type Snapshot } from '../../src/shared/protocol'
import type { LadderTrack } from '../../src/engine/season/types'
import { careerSnapshot } from '../helpers/career'
import { moneyOf } from '../helpers/careerMoney'
import { clashWorld } from '../helpers/scenarios/clash'
import { married } from '../helpers/scenarios/love'
import { SHELL, carpet, renderedComponents, posed, type Extra, type Surface } from './xxCarpet'
import { birthday, coached, injured, mountMore } from './xxPoses'

const blocking = (id: string, swept: string, comp: Parameters<typeof posed>[3], snap: () => Snapshot, props: Record<string, unknown> | (() => Record<string, unknown>) = {}, after?: (w: VueWrapper) => Promise<void>, extra: Extra = {}): Surface =>
  posed(id, 'blocking', swept, comp, snap, props, after, extra)

// --- the retirement card: the ordinary question and the tallest one (the L1b/L2-10 poses) -----------------------------------------------------
const EMPTY_ROW: SeasonTrackRow = { points: 0, wins: 0, losses: 0 }
const season = (seasonIndex: number, wtaRank: number): SeasonHistoryEntry => ({
  seasonIndex, endRank: wtaRank, points: 0, wins: 0, losses: 0, fundsDeltaCents: 0, endFundsCents: 0,
  byTrack: { domestic: { ...EMPTY_ROW }, itf: { ...EMPTY_ROW }, wta: { ...EMPTY_ROW, endRank: wtaRank } } as Record<LadderTrack, SeasonTrackRow>,
})
const WINTER: RetirementOffer = { askedWeek: 1453, seasonIndex: 27, reason: 'age', final: false }
const retireSnap = (over: Record<string, unknown>): Snapshot =>
  ({
    ageYears: 41, week: 1453, kidRank: 88, fundsCents: 1234_00, oneMoreYearCount: 0, physicalShare: 0.6,
    careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 },
    careerMoney: moneyOf({ earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 }),
    seed: 'l42-retire', coachMarket: [{ id: 'c1', name: 'Marco Ricci', current: true }], retirementOffer: WINTER, ...over,
  }) as unknown as Snapshot

// --- the tour briefing (the L1b pose) ------------------------------------------------------------------------------------------------------
function briefing(): Snapshot {
  const world = createWorld('l42-brief')
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 4; i++) tickWeek(world, rng)
  world.results.push({ playerId: KID_ID, week: world.week, points: 250, tier: 'wta250' })
  world.kidRankWta = 34
  return toSnapshot(world)
}

// --- the knock: the engine's own prompt, first and repeat (L2-5's pose) --------------------------------------------------------------------
const KNOCK: Knock = { part: 'hip', sinceWeek: 8, repeat: false, choice: null, untilWeek: 8 }
const knockSnap = (repeat: boolean): Snapshot =>
  ({ week: 8, knockPrompt: buildKnockPrompt({ ...KNOCK, repeat }, 'l42-knock', 60, WEEK_PLAN_PRESETS.grind) }) as unknown as Snapshot

// --- the season wrap-up (a11y-sweep's fixture) ---------------------------------------------------------------------------------------------
const SUMMARY: SeasonSummary = {
  seasonYear: 2031, endRank: 412, startRank: 690, points: 240, wins: 44, losses: 19, bestResultText: 'Champion', fundsDeltaCents: 723_00,
  spentCents: 20_779_00, earnedCents: 21_502_00, weeksInjured: 0, academyCoveredCents: 0, rankTrack: 'wta', rankInTrack: 993,
}

// --- the fork: a REAL career at the fork (round24-fork-places' recipe) ---------------------------------------------------------------------
function atTheFork(seed: string, country: string): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, country })
  world.bestFinishByTier.j300 = 3
  world.fork = { askedWeek: world.week, answer: null, offer: measureCollegeOffer(world) }
  return world
}

// --- the graduation card (L2-10b's pose) -----------------------------------------------------------------------------------------------------
const CALL_UP = { rubbersPlayed: 2, rubbersWon: 1, nationFinish: 2 } as unknown as CollegeYear['callUp']
const years = (n: number, callUps: number): CollegeYear[] =>
  Array.from({ length: n }, (_, i) => ({
    index: i + 1, fromWeek: 281, untilWeek: 333, startSkill: 58.6, endSkill: 58.9, startRank: i === 0 ? null : 30 - i, endRank: 28 - i,
    fundsDeltaCents: i % 2 === 0 ? -3_000_00 : 1_200_00, callUp: i < callUps ? CALL_UP : null, league: { week: 293, roundsWon: 2, rounds: 3 },
  })) as CollegeYear[]

// --- the life beats: a married career carrying a raised beat, the card the ENGINE assembles (L2-9b's pose) ---------------------------------
function raised(kind: 'expecting' | 'return-plan'): LifeBeatPrompt {
  const world = createWorld(`l42-${kind}`, DEFAULT_PROFILE)
  world.season = []
  world.week = 1000
  world.bond = 90
  world.loveEpisodes = [married(900, 940)]
  raiseLifeBeat(world, kind, kind === 'expecting' ? 'p:900' : 'return-plan')
  const prompt = buildLifeBeatPrompt(world)
  if (prompt?.kind !== kind) throw new Error(`the engine did not raise a ${kind} beat`)
  return prompt
}
const beatSnap = (prompt: LifeBeatPrompt): Snapshot => ({ ...toSnapshot(createWorld('l42-life-beat', DEFAULT_PROFILE)), lifeBeatPrompt: prompt })

const SURFACES: readonly Surface[] = [
  blocking('RetirementDialog: ordinary', 'L2-10', RetirementDialog, () => retireSnap({ ageYears: 30, physicalShare: 1, coachMarket: [{ current: true, name: 'Ana Petrova' }] }), {}, undefined, {
    card: () => document.querySelector('.retire-card')!, dismiss: () => document.querySelector('.retire-answers')!,
  }),
  blocking(
    'RetirementDialog: last winter',
    'L1b',
    RetirementDialog,
    () => retireSnap({ seasonHistory: [season(24, 20), season(25, 68), season(26, 125)], lastWinterIn: 2 }),
    {},
    undefined,
    { card: () => document.querySelector('.retire-card')!, dismiss: () => document.querySelector('.retire-answers')! },
  ),
  blocking('LocalePrompt', 'L1b', LocalePrompt, coached, {}, undefined, {
    card: () => document.querySelector('.locale-prompt .dialog-card')!, dismiss: () => document.querySelector('.dialog-actions')!,
  }),
  blocking('TourBriefingDialog', 'L1b', TourBriefingDialog, briefing, {}, undefined, { dismiss: () => document.querySelector('.tour-briefing-actions')! }),
  blocking('KnockDialog: first', 'L2-5', KnockDialog, () => knockSnap(false)),
  blocking('KnockDialog: repeat', 'L2-5', KnockDialog, () => knockSnap(true)),
  blocking('InjuryStopDialog', 'L2-5', InjuryStopDialog, injured),
  blocking('BirthdayDialog: a present chosen', 'L2-9', BirthdayDialog, birthday, {}, async (w) => {
    await w.get('button.birthday-choice').trigger('click')
    await flushPromises()
  }),
  blocking('LifeBeatDialog: expecting', 'L2-9', LifeBeatDialog, () => beatSnap(raised('expecting')), {}, undefined, { engine: () => [raised('expecting')] }),
  blocking('LifeBeatDialog: return plan', 'L2-9', LifeBeatDialog, () => beatSnap(raised('return-plan')), {}, undefined, { engine: () => [raised('return-plan')] }),
  blocking('ForkDialog: US', 'L2-10', ForkDialog, () => toSnapshot(atTheFork('l42-fork', 'US'))),
  blocking('SeasonSummaryDialog', '', SeasonSummaryDialog, () => ({ ...careerSnapshot(4, 'l42-wrap'), lastSeasonSummary: SUMMARY })),
  blocking('CollegeDoneDialog', 'L2-10', CollegeDoneDialog, () => ({ week: 590, college: { years: years(ENDINGS.collegeYears, 2), doneWeek: 590 } }) as unknown as Snapshot),
  {
    id: 'LifeMomentOverlay',
    kind: 'blocking',
    swept: 'L2-10',
    mount: () => {
      resetLifeMomentForTests()
      useGameStore().snapshot = { ageYears: 24, lifeMoment: { kind: 'wedding', week: 1200, face: 'bride', line: 'engine line for the day', confirm: LIFE_MOMENT_CONFIRM } } as unknown as Snapshot
      const w = mount(LifeMomentOverlay, SHELL)
      return { unmount: () => w.unmount(), rendered: () => renderedComponents(w), words: [LIFE_MOMENT_CONFIRM, 'engine line for the day'] }
    },
  },
  blocking('ShootClashDialog', '', ShootClashDialog, () => toSnapshot(clashWorld('l42-clash')), {}, undefined, {
    card: () => document.querySelector('.shoot-clash-dialog')!, dismiss: () => document.querySelector('.shoot-clash-dialog .knock-choices')!,
  }),
  // not 'blocking': a help card the player opens, closed by an ABSOLUTE × the fits model cannot place (it reports «out of its parent's flow») – listed as a limit, not judged
  posed('RankHelpDialog', 'card', '', RankHelpDialog, () => careerSnapshot(8, 'l42-rank-help')),
  blocking(
    'SaleDialog',
    '',
    SaleDialog,
    coached,
    () => ({ props: { heading: 'The family aeroplane', lines: ['It is on the shelf at the price it cost.', 'Selling now returns part of the price.'], listable: true } }),
    undefined,
    { engine: () => ['The family aeroplane', 'It is on the shelf at the price it cost.', 'Selling now returns part of the price.'] },
  ),
  { id: 'ConfirmDialog (More: delete career)', kind: 'blocking', swept: 'L2-11', mount: () => mountMore(1, async (w) => {
    const row = w.findAll('.career-row').find((r) => r.text().includes('Ines'))!
    await row.findAll('button')[1]!.trigger('click')
    await flushPromises()
  }) },
  { id: 'FeedbackDialog (More: saves)', kind: 'blocking', swept: 'L2-11', mount: () => mountMore(1, async (w) => {
    await w.get('button.primary').trigger('click')
    await flushPromises()
  }) },
]

carpet('overlays', SURFACES)
