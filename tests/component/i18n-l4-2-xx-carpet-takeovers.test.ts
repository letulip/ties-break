// THE `xx` CARPET, AREA 4 – the full-screen takeovers and the shell around them (wave L4-2, spec §6): the last page (the epilogue, a scrolling
// takeover whose two doors are the dismiss), the match viewer and its replay shell and the friendly's flow, the fourteen prologue scenes with
// the Local Open and the handover, the onboarding wizard and tour, the splash, and the app shell (its tab bar and its storage-recovery screen).
// Registry only – the sweep, the ledger and the report are `xxCarpet.ts`'s; every pose is the one the L2 net for that surface uses.
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

import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import OnboardingWizard from '../../src/components/OnboardingWizard.vue'
import OnboardingTour from '../../src/components/OnboardingTour.vue'
import ChildhoodPrologue from '../../src/components/ChildhoodPrologue.vue'
import EndingScreen from '../../src/components/EndingScreen.vue'
import MatchViewer from '../../src/components/MatchViewer.vue'
import MatchReplay from '../../src/components/MatchReplay.vue'
import PracticeFlow from '../../src/components/PracticeFlow.vue'
import PrologueCardView from '../../src/components/PrologueCard.vue'
import PrologueHandoverView from '../../src/components/PrologueHandover.vue'
import PrologueLocalOpenView from '../../src/components/PrologueLocalOpen.vue'
import { useGameStore } from '../../src/stores/game'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import { createWorld, toSnapshot, KID_ID } from '../../src/engine/world'
import { ageInWords } from '../../src/engine/world/age'
import type { MatchOptions, MatchPlayer } from '../../src/engine/match/types'
import { CARD_AGES, PROLOGUE_CARDS, TWELFTH_WANTS_MORE, localOpenCard, type PrologueCard } from '../../src/prologue/cards'
import { WALK_COPY, coachBaseReadFor, coachReadFor, playedLine } from '../../src/prologue/handover'
import { OPENING_IDENTITY } from '../../src/prologue/identity'
import { playLocalOpen, prologueEntrant } from '../../src/prologue/pool'
import { EMPTY_RUN, cardFor, moodAt, readTwelfth, warmthAt } from '../../src/prologue/run'
import { DEFAULT_PROFILE, type AlbumPage, type CareerEndingType, type CareerMoney, type EndingView, type Snapshot, type WorldMatch } from '../../src/shared/protocol'
import { dynastyOf } from '../helpers/dynastyHandover'
import { moneyOf } from '../helpers/careerMoney'
import { SHELL, carpet, renderedComponents, type Extra, type Mounted, type Surface } from './xxCarpet'
import { coached } from './xxPoses'

Element.prototype.scrollIntoView = function () {}

/** A component that reads props and a store snapshot, mounted attached; the posing function returns the props. */
function takeover(id: string, kind: 'takeover' | 'blocking', swept: string, comp: Parameters<typeof mount>[0], snap: () => Snapshot, props: () => Record<string, unknown>, extra: Extra & { after?: (w: VueWrapper) => Promise<void> } = {}): Surface {
  return {
    id,
    kind,
    swept,
    mount: async (): Promise<Mounted> => {
      const s = snap()
      useGameStore().snapshot = s
      const p = props()
      const w = mount(comp, { ...SHELL, props: p }) as VueWrapper
      if (extra.after) await extra.after(w)
      return { unmount: () => w.unmount(), rendered: () => renderedComponents(w), engine: [...(extra.engine?.() ?? []), p], words: extra.words?.(s) ?? [], card: extra.card, dismiss: extra.dismiss }
    },
  }
}

// --- the last page (L2-10a's pose) -----------------------------------------------------------------------------------------------------------
const TOTALS = { earnedCents: 4_000_000_00, spentCents: 3_000_000_00, prizeCents: 1_500_000_00, weeksLostToInjury: 0 }
const MONEY = { prizeCents: 40_563_980_00, outlayCents: 254_383_557_00, herAccountCents: 321_120_108_00, portfolioCents: 269_490_541_00 }
const PAGE: AlbumPage = { slot: 7, why: 'why seven', caption: 'caption seven', fact: 'fact seven', week: 364, seasonIndex: 7, stage: 'teen', emotion: 'norm', empty: false }
function endingView(over: Partial<EndingView> = {}, money: Partial<CareerMoney> = MONEY): EndingView {
  return {
    ending: { type: 'natural' as CareerEndingType, week: 900, ageYears: 31, detail: 'she stopped', resumesWeek: null },
    closing: PAGE, scroll: [], handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: null, resumesAgeYears: null },
    totals: TOTALS, money: moneyOf(TOTALS, money), seasonsPlayed: 20, bestRank: 1, bestRankTrack: 'wta', titles: 127, oneMoreYearCount: 4,
    academy: { stagesBuilt: 3, totalStages: 5, weeklyIncomeCents: 40_600_000_00 }, lifetimeDeal: { brand: 'Acme', cashCents: 5_250_000_00 },
    college: null, dynasty: dynastyOf(), ...over,
  }
}
const endingSnap = (view: EndingView): Snapshot =>
  ({ ageYears: 31, week: 900, kidRank: 1, fundsCents: 1234_00, careerTotals: TOTALS, careerMoney: view.money, ending: view }) as unknown as Snapshot
const ending = (id: string, view: EndingView): Surface =>
  takeover(id, 'blocking', 'L2-10', EndingScreen, () => endingSnap(view), () => ({}), {
    card: () => document.querySelector('.ending-album')!, dismiss: () => document.querySelector('.ending-doors')!,
  })

// --- the match viewer, its replay shell and the friendly's flow (L2-8's poses) ---------------------------------------------------------------
const player = (over: Partial<MatchPlayer>): MatchPlayer => ({ id: 'p', name: 'P', serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, ...over })
function viewerFixture() {
  const a = player({ id: 'a', name: 'Vera Novak', serve: 62 })
  const b = player({ id: 'b', name: 'Ines Duval', serve: 48 })
  const opts: MatchOptions = { surface: 'hard', tour: JUNIOR_TOUR, seed: 'component-fixture' }
  return { a, b, match: annotateMatch(simulateMatch(a, b, opts), a, b, opts) }
}
const A: MatchPlayer = { id: 'kid', name: 'Vera Novak', serve: 58, ret: 55, composure: 42, stamina: 61, groundstrokes: 56 }
const B: MatchPlayer = { id: 'opp', name: 'Ines Duval', serve: 60, ret: 57, composure: 55, stamina: 60, groundstrokes: 58 }
const record = (over: Partial<WorldMatch> = {}): WorldMatch =>
  ({ eventId: 'local-open-1', round: 1, aId: A.id, bId: B.id, winnerId: A.id, seed: 'l42-replay', score: '6-4 6-3', surface: 'hard', oppName: B.name, a: A, b: B, ...over }) as WorldMatch
const friendly = (): WorldMatch => record({ eventId: 'practice', aId: KID_ID, bId: B.id, winnerId: KID_ID, seed: 'l42-friendly', a: { ...A, id: KID_ID } })

// --- the prologue (L2-2's poses): fourteen scenes, the Local Open, the handover -----------------------------------------------------------------
interface Scene { name: string; card: PrologueCard; extra: Record<string, unknown> }
const pickedOf = (card: PrologueCard): Record<string, unknown> => (card.options && card.tournament ? { picked: card.options[0]!.id } : {})
function scenes(): Scene[] {
  const out: Scene[] = PROLOGUE_CARDS.map((c) => ({
    name: `age ${c.age}`, card: cardFor(c.age, EMPTY_RUN), extra: { ...pickedOf(c), ...(c.age === 12 ? { reason: readTwelfth(EMPTY_RUN).reason } : {}) },
  }))
  out.push({ name: 'age 12, the other face', card: TWELFTH_WANTS_MORE, extra: { ...pickedOf(TWELFTH_WANTS_MORE), reason: readTwelfth(EMPTY_RUN).reason } })
  for (const outcome of ['won', 'final', 'lost'] as const) out.push({ name: `result: ${outcome}`, card: localOpenCard(10, outcome), extra: { ask: undefined, outcome } })
  out.push({ name: 'result: hurt', card: localOpenCard(10, 'lost', true), extra: { ask: undefined } })
  return out
}
function sceneSurface(sc: Scene): Surface {
  return {
    id: `PrologueCard: ${sc.name}`,
    kind: 'takeover',
    swept: 'L2-2',
    mount: () => {
      const card = sc.card
      const w = mount(PrologueCardView, {
        attachTo: document.body,
        props: {
          card, warmth: warmthAt(card.age, EMPTY_RUN), mood: moodAt(card.age, EMPTY_RUN), canGoBack: card.age !== CARD_AGES[0],
          skipLabel: card.age === CARD_AGES[0] ? WALK_COPY.skip : undefined, identity: card.identity ? { ...OPENING_IDENTITY } : undefined,
          weight: card.weight ? false : undefined, ask: card.tournament, ...sc.extra,
        },
      })
      return { unmount: () => w.unmount(), rendered: () => renderedComponents(w), engine: [card, sc.extra, OPENING_IDENTITY] }
    },
  }
}

// --- the shell (L2-1's recipe) -----------------------------------------------------------------------------------------------------------------
function shell(id: string, phase: 'ready' | 'recovery'): Surface {
  return {
    id,
    kind: 'takeover',
    swept: 'L2-1',
    mount: async () => {
      const game = useGameStore()
      vi.spyOn(game, 'init').mockResolvedValue(undefined)
      game.$patch({ ready: phase === 'ready', phase })
      game.snapshot = toSnapshot(createWorld('l42-shell', DEFAULT_PROFILE))
      game.recovered = false
      const w = mount(App, SHELL) as VueWrapper
      const splash = w.findComponent(SplashScreen)
      if (splash.exists()) splash.vm.$emit('done')
      await flushPromises()
      return { unmount: () => w.unmount(), rendered: () => renderedComponents(w) }
    },
  }
}

const SURFACES: readonly Surface[] = [
  ending('EndingScreen: natural', endingView()),
  ending('EndingScreen: college door', endingView({ ending: { type: 'college', week: 900, ageYears: 19, detail: 'x', resumesWeek: 910 }, handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: 910, resumesAgeYears: 19 } })),
  takeover('MatchViewer: replay', 'takeover', 'L2-8', MatchViewer, coached, () => {
    const f = viewerFixture()
    return { match: f.match, playerA: f.a, playerB: f.b, surface: 'hard', mode: 'replay' }
  }),
  takeover('MatchReplay', 'takeover', 'L2-8', MatchReplay, coached, () => ({ match: record() })),
  takeover('PracticeFlow', 'takeover', 'L2-8', PracticeFlow, coached, () => ({ match: friendly(), week: 12, kidRank: 9 })),
  // the container itself – the progress, the skip and the opening card (no career exists yet, so the store holds no snapshot), and the dynasty's opening (the mother speaks)
  takeover('ChildhoodPrologue: opening', 'takeover', 'L2-2', ChildhoodPrologue, () => null as unknown as Snapshot, () => ({ seed: 'l42-prologue' })),
  takeover('ChildhoodPrologue: dynasty opening', 'takeover', 'L2-2', ChildhoodPrologue, () => null as unknown as Snapshot, () => ({ seed: 'l42-prologue', dynasty: dynastyOf() })),
  ...scenes().map(sceneSurface),
  {
    id: 'PrologueLocalOpen',
    kind: 'takeover',
    swept: 'L2-2',
    mount: () => {
      const kid = prologueEntrant('l22', KID_ID, 'Vera Novak', 10)
      const open = playLocalOpen('l22', kid, 10)
      const w = mount(PrologueLocalOpenView, { attachTo: document.body, props: { open, kid, seed: 'l22' } })
      return { unmount: () => w.unmount(), rendered: () => renderedComponents(w), engine: [open, kid] }
    },
  },
  {
    id: 'PrologueHandover',
    kind: 'takeover',
    swept: 'L2-2',
    mount: () => {
      const snapshot = toSnapshot(createWorld('l42-handover', DEFAULT_PROFILE))
      const props = {
        axes: snapshot.radar, ageWord: ageInWords(14), base: coachBaseReadFor('ahead', 'l22'), read: coachReadFor('Huge potential', 'l22'), spentCents: 1234500,
        played: playedLine([{ outcome: 'final' }, { outcome: 'lost' }] as never),
      }
      const w = mount(PrologueHandoverView, { attachTo: document.body, props })
      return { unmount: () => w.unmount(), rendered: () => renderedComponents(w), engine: [props] }
    },
  },
  { id: 'OnboardingWizard: first step', kind: 'takeover', swept: 'L2-1', mount: () => {
    const w = mount(OnboardingWizard, { attachTo: document.body })
    return { unmount: () => w.unmount(), rendered: () => renderedComponents(w) }
  } },
  { id: 'OnboardingWizard: country step', kind: 'takeover', swept: 'L2-11', mount: async () => {
    const w = mount(OnboardingWizard, { attachTo: document.body })
    for (let guard = 0; guard < 6 && !w.find('.ob-country').exists(); guard++) await w.get('.ob-cta').trigger('click')
    return { unmount: () => w.unmount(), rendered: () => renderedComponents(w) }
  } },
  takeover('OnboardingTour: home', 'takeover', 'L2-1', OnboardingTour, coached, () => ({ screen: 'home' })),
  { id: 'SplashScreen', kind: 'takeover', swept: 'L2-1', mount: () => {
    const w = mount(SplashScreen, { attachTo: document.body })
    return { unmount: () => w.unmount(), rendered: () => renderedComponents(w) }
  } },
  shell('App: shell', 'ready'),
  shell('App: storage recovery', 'recovery'),
]

carpet('takeovers', SURFACES)
