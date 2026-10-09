// THE `xx` CARPET, AREA 2 – the cards and panels that sit inside the screens, mounted on their own: the recap, the identity rail and the
// dashboard, the season guide and the tournament cards, the radar, the planner, the household strip, the staff tab, the history table,
// the college year card, the span report and the inbox (its open letter and the sign question the letter raises).
// Registry only – the sweep, the ledger and the report are `xxCarpet.ts`'s. Every pose is the one the L2 net for that card uses.
import { vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import '../../src/style.css'

vi.mock('../../src/audio/sfx', () => ({
  playSfx: () => {},
  primeSfx: () => {},
  initSfx: () => {},
  installGlobalSfx: () => {},
  isMuted: () => false,
  setMuted: () => {},
}))

import WeekRecapCard from '../../src/components/WeekRecapCard.vue'
import RailIdentity from '../../src/components/RailIdentity.vue'
import RailDashboard from '../../src/components/RailDashboard.vue'
import TierGuide from '../../src/components/TierGuide.vue'
import NextTournamentPanel from '../../src/components/NextTournamentPanel.vue'
import TournamentFlow from '../../src/components/TournamentFlow.vue'
import BracketTabs from '../../src/components/BracketTabs.vue'
import SkillsRadar from '../../src/components/SkillsRadar.vue'
import PlanWeekSheet from '../../src/components/PlanWeekSheet.vue'
import HouseholdStrip from '../../src/components/HouseholdStrip.vue'
import SupportStaffTab from '../../src/components/SupportStaffTab.vue'
import SeasonHistoryTable from '../../src/components/SeasonHistoryTable.vue'
import CollegeYearCard from '../../src/components/CollegeYearCard.vue'
import WeekSpanReport from '../../src/components/WeekSpanReport.vue'
import { ENDINGS } from '../../src/engine/ending'
import { KID_ID } from '../../src/engine/world/constants'
import type { SpanWeek } from '../../src/engine/world/multiWeek'
import type { CollegeProgressView, CollegeYear, FullBracketMatch, Offer, Snapshot, WorldEvent, WorldMatch } from '../../src/shared/protocol'
import { mountInbox, withPost } from './inbox'
import { SHELL, carpet, renderedComponents, posed, type Extra, type Surface } from './xxCarpet'
import { atFlow, coached, fresh, golden, selfCoached } from './xxPoses'

Element.prototype.scrollIntoView = function () {}

const card = (id: string, swept: string, comp: Parameters<typeof posed>[3], snap: () => Snapshot, props: Record<string, unknown> | (() => Record<string, unknown>) = {}, after?: (w: VueWrapper) => Promise<void>, extra: Extra = {}): Surface =>
  posed(id, 'card', swept, comp, snap, props, after, extra)

// --- the bracket: an eight-player draw to the final (L2-4's pose) -------------------------------------------------------------------------
function eightDraw(): FullBracketMatch[] {
  const m = (round: number, i: number, label: string): FullBracketMatch => ({
    round, roundLabel: label, aId: `a${round}${i}`, bId: `b${round}${i}`, aName: `Aa ${round}${i}`, bName: `Bb ${round}${i}`, winnerId: `a${round}${i}`, score: '6-3 6-4',
  })
  const final: FullBracketMatch = { round: 2, roundLabel: 'Final', aId: 'a10', bId: 'a11', aName: 'Aa 10', bName: 'Aa 11', winnerId: 'a10', score: '7-5 6-4' }
  return [0, 1, 2, 3].map((i) => m(0, i, 'Quarterfinal')).concat([0, 1].map((i) => m(1, i, 'Semifinal')), [final])
}

// --- the staff tab: every helper unlocked, none or all hired (L2-6's pose) ---------------------------------------------------------------
const staff = (hired: boolean): Snapshot =>
  ({ ...coached(), masseurUnlocked: true, psychologistUnlocked: true, sparringUnlocked: true, masseurHired: hired, psychologistHired: hired, sparringHired: hired }) as unknown as Snapshot

// --- the span report: a quiet fortnight's four weeks (r2-13's digest) ----------------------------------------------------------------------
const row = (id: number, week: number, text: string, amountCents?: number): WorldEvent =>
  (amountCents === undefined ? { id, week, type: 'info', text } : { id, week, type: 'expense', text, amountCents }) as WorldEvent
const DIGEST: SpanWeek[] = [
  { week: 13, rows: [row(1, 13, 'Coaching – standard private coach', -32000), row(2, 13, 'Court hire', -9000)] },
  { week: 14, rows: [row(3, 14, 'A local shop offered her a kit deal.'), row(4, 14, 'Stringing', -2500)] },
  { week: 15, rows: [row(5, 15, 'She went to bed talking about her serve.')] },
  { week: 16, rows: [row(6, 16, 'Savings interest', 1800), row(7, 16, 'Coaching – standard private coach', -32000)] },
]

// --- the college year card: two banked states (L2-10's CARD_STATES, the richest two) -------------------------------------------------------
function collegeYear(over: Partial<CollegeYear> = {}): CollegeYear {
  return {
    index: 1, fromWeek: 281, untilWeek: 333, startSkill: 58.6, endSkill: 58.9, startRank: null, endRank: null, fundsDeltaCents: -3_806_075, callUp: null,
    league: { week: 293, roundsWon: 2, rounds: 3 }, ...over,
  } as CollegeYear
}
function collegeView(over: Partial<CollegeProgressView> = {}): CollegeProgressView {
  return {
    yearsDone: 1, totalYears: ENDINGS.collegeYears, last: collegeYear(), final: false, billPerYearCents: 8_673_00, tier: 'state', rubbers: [],
    league: { week: 293, roundsWon: 2, rounds: 3 }, leagueMatches: [], yearInProgress: false, leagueIsNextStop: false, callUpIsNextStop: false, ...over,
  } as CollegeProgressView
}
const fixture = (eventId: string, opp: string, winnerId: string, score: string, retiredId?: string): WorldMatch =>
  ({ eventId, round: 0, oppName: opp, winnerId, score, retiredId, surface: 'hard' }) as unknown as WorldMatch
const CALL_UP = { rubbersPlayed: 2, rubbersWon: 1, nationFinish: 2 } as unknown as CollegeYear['callUp']
const collegeSnap = (view: CollegeProgressView): Snapshot => ({ week: 281, seed: 'l42-college', ending: { college: view }, college: { untilWeek: 333 } }) as unknown as Snapshot
const BUSY = collegeView({
  yearsDone: 3, final: true, last: collegeYear({ index: 3, startRank: 12, endRank: null, callUp: CALL_UP }), league: { week: 293, roundsWon: 0, rounds: 3 },
  rubbers: [fixture('r1', 'Ana Petrova', KID_ID, '6-3 6-4'), fixture('r2', 'Ina Boll', 'opp', '3-6', 'kid')], leagueMatches: [fixture('l1', 'Eva Roth', 'opp', '2-6 1-6')],
})

// --- the inbox: one open four-year campaign letter (L2-6b's `openCampaign`) -------------------------------------------------------------------
const CAMPAIGN = {
  id: 'l42-ad', kind: 'ad', week: 40, deadlineWeek: 43, state: 'open',
  terms: { kind: 'ad', category: 'clothing', brand: 'Orla', trade: 'We make her kit', cashCents: 100_000_00, termYears: 4, termWeeks: 4 * 52, shootCount: 1 },
} as unknown as Offer

function inbox(id: string, kind: 'card' | 'blocking'): Surface {
  return {
    id,
    kind,
    swept: 'L2-6',
    mount: async () => {
      const sheet = await mountInbox(withPost(coached(), [CAMPAIGN], 40), SHELL, [CAMPAIGN])
      await sheet.get('.inbox-open').trigger('click')
      if (kind === 'blocking') await sheet.get('.offer-sign').trigger('click')
      await flushPromises()
      return {
        unmount: () => sheet.unmount(), rendered: () => renderedComponents(sheet),
        engine: [CAMPAIGN],
        card: () => document.querySelector('.dialog-overlay .dialog-card')!,
        dismiss: (c) => c.querySelector('.dialog-actions') ?? c,
      }
    },
  }
}

const SURFACES: readonly Surface[] = [
  card('WeekRecapCard', 'L2-3', WeekRecapCard, coached),
  card('RailIdentity', 'L2-3', RailIdentity, coached),
  card('RailDashboard', '', RailDashboard, coached),
  card('TierGuide', 'L2-4', TierGuide, coached),
  card('NextTournamentPanel', 'L2-4', NextTournamentPanel, coached, () => ({ props: { event: coached().upcoming[0] } })),
  card('TournamentFlow', 'L2-4', TournamentFlow, atFlow),
  card('BracketTabs', 'L2-4', BracketTabs, coached, () => ({ props: { matches: eightDraw(), drawSize: 8, activeRound: 2 } }), undefined, { engine: () => [eightDraw()] }),
  card('SkillsRadar', 'L2-5', SkillsRadar, selfCoached, () => ({ props: { axes: selfCoached().radar, title: 'chart' } }), undefined, { words: () => ['chart'] }),
  card('PlanWeekSheet: practice', 'L2-5', PlanWeekSheet, fresh, { props: { week: 20, initialTab: 'practice' } }),
  card('PlanWeekSheet: vacation', 'L2-5', PlanWeekSheet, fresh, { props: { week: 20, initialTab: 'vacation' } }),
  card('HouseholdStrip', 'L2-6', HouseholdStrip, coached),
  card('SupportStaffTab: none hired', 'L2-6', SupportStaffTab, () => staff(false)),
  card('SupportStaffTab: all hired', 'L2-6', SupportStaffTab, () => staff(true)),
  card('SeasonHistoryTable: itf', 'L2-7', SeasonHistoryTable, golden, { props: { track: 'itf' } }),
  card('SeasonHistoryTable: wta', 'L2-7', SeasonHistoryTable, golden, { props: { track: 'wta' } }),
  card('CollegeYearCard: year two', 'L2-10', CollegeYearCard, () => collegeSnap(collegeView())),
  card('CollegeYearCard: last year, rubbers', 'L2-10', CollegeYearCard, () => collegeSnap(BUSY)),
  card('WeekSpanReport', '', WeekSpanReport, coached, { props: { from: 12, to: 16, digest: DIGEST } }, undefined, { engine: () => [DIGEST] }),
  inbox('InboxSheet: open letter', 'card'),
  inbox('InboxSheet: sign question', 'blocking'),
]

carpet('cards', SURFACES)
