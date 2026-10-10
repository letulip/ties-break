// THE LETTER MATRIX – every arm and every branch of `OfferLetter.vue`, posed as plain data (L3-2, 10.10).
//
// ⚠ WHAT THIS IS FOR. `OfferLetter` assembles every sentence at render from a persisted `terms` object, and its prose used to be template
// literals; L3-2 wired it through `t()`. The proof the wave owes is «every rendered letter is the same English», and the four careers
// `principles-d07-inbox-identity` replays hold the letters those careers happened to write – a Grand-Slam notice, a lifetime paper, a
// buyer's counter, the seven staff seats, the nine-years campaign do not come out of four careers. So this file poses them: one `Case`
// per branch the template or a computed can take, built by loops where a branch is a value (a category, a seat, a term length).
//
// The English record (`tests/fixtures/l3-2-letters/matrix.json`) was captured on the PRE-WAVE tree, so it is the twin's old arm kept as a
// committed artifact: the new tree is compared with it forever, not with a worktree that has to be rebuilt.
//
// ⚠ POSED ON PURPOSE WITH FULL TERMS. The renderer reads some optional fields straight into a sentence (`tourTerms.points`,
// `staffTerms.weeksServed`); a posed letter that leaves one absent measures how the formatter prints `undefined`, not how a letter reads.
// The engine's writers always set the fields of the arm they raise, and so does every case here.
import { ECONOMY } from '../../src/engine/economy'
import { LADDER_LABEL } from '../../src/shared/protocol'
import type { Offer } from '../../src/shared/protocol'

export interface LetterCase {
  name: string
  offer: Offer
  /** the current week the paper is read in; defaults to inside the window (live) */
  week?: number
  /** the whole inbox (the apparel bond reads a running campaign off it) */
  offers?: Offer[]
  saleLabel?: string
}

export const LIVE_WEEK = 301
export const LATE_WEEK = 330

let seq = 0
function letter(kind: Offer['kind'], terms: object, over: Partial<Offer> = {}): Offer {
  seq += 1
  return { id: `${kind}-${seq}`, kind, week: 300, deadlineWeek: 305, state: 'open', terms, ...over } as unknown as Offer
}

const ENTRY = { tier: 'wta500', label: 'Lakeside Open', eventWeek: 310, freeUntilWeek: 306 }
const KIT = {
  tier: 'national', brand: 'Play Beyond', kitAllowanceCents: 500000, freshCap: 1, covers: ['strings', 'frame', 'shoes'],
  travelShare: 0.2, seasons: 3, keepDomesticRank: 10, minEventsPerSeason: 8,
}
const AD = { brand: 'Quiet Hour', cashCents: 2500000, termWeeks: 52, shootCount: 2 }
const STAFF = { seasonIndex: 4, weeksServed: 41 }
const ASK = { fromCents: 6000, toCents: 7500 }
const TOUR_SEASON = {
  notice: 'season', maxRank: 50, requirements: ['All 4 Grand Slams', 'All 8 World Tour 1000s', '6 of the 10 World Tour 500s'],
  label: 'World Tour 500', points: 3, countingSlots: 18, suspensionAt: 10, suspensionWeeks: 4, windowWeeks: 52,
}

export function letterMatrix(): LetterCase[] {
  seq = 0
  const out: LetterCase[] = []
  const add = (name: string, offer: Offer, extra: Partial<LetterCase> = {}): void => void out.push({ name, offer, ...extra })

  // --- the tournament desk -------------------------------------------------------------------------------------------------------
  add('entry/confirmed', letter('entry', { ...ENTRY }))
  add('entry/withdrew', letter('entry', { ...ENTRY, cancelled: true }))
  add('entry/released-injury', letter('entry', { ...ENTRY, cancelled: true, releasedBy: 'injury' }))
  add('entry/released-college', letter('entry', { ...ENTRY, cancelled: true, releasedBy: 'college' }))
  add('entry/released-other', letter('entry', { ...ENTRY, cancelled: true, releasedBy: 'weather' }))

  // --- the tour ------------------------------------------------------------------------------------------------------------------
  add('tour/due', letter('tour', { notice: 'due', tier: 'wta500', label: 'World Tour 500 Alpha', eventWeek: 310, freeUntilWeek: 306, points: 3 }))
  for (const points of [1, 3]) {
    add(`tour/penalty-${points}-label`, letter('tour', { notice: 'penalty', label: 'World Tour 500 Alpha', points, runningPoints: 4, suspensionAt: 10 }))
    add(`tour/penalty-${points}-nolabel`, letter('tour', { notice: 'penalty', points, runningPoints: 4, suspensionAt: 10 }))
  }
  add('tour/season', letter('tour', { ...TOUR_SEASON }))
  add('tour/season-one-and-unknown', letter('tour', { ...TOUR_SEASON, requirements: ['All 1 Grand Slam', 'Whatever a later rule says'] }))
  add('tour/suspension', letter('tour', { notice: 'suspension', untilWeek: 320, runningPoints: 11 }))

  // --- the academy ---------------------------------------------------------------------------------------------------------------
  add('academy/arrived-grant', letter('academy', { notice: 'arrived', sharePct: 30, sinceWeek: 300, seasonIndex: 5, grantCents: 150000 }, { state: 'info' }))
  add('academy/arrived-nogrant', letter('academy', { notice: 'arrived', sharePct: 30, sinceWeek: 300, seasonIndex: 5 }, { state: 'info' }))
  add('academy/reviewed-up-grant', letter('academy', { notice: 'reviewed', sharePct: 40, wasPct: 30, sinceWeek: 200, seasonIndex: 6, grantCents: 150000 }, { state: 'info' }))
  add('academy/reviewed-down', letter('academy', { notice: 'reviewed', sharePct: 20, wasPct: 30, sinceWeek: 200, seasonIndex: 6 }, { state: 'info' }))
  for (const reason of ['aged-out', 'stopped-playing', undefined]) {
    add(`academy/ended-${reason ?? 'other'}`, letter('academy', { notice: 'ended', sharePct: 30, sinceWeek: 200, seasonIndex: 8, reason }, { state: 'info' }))
  }

  // --- the staff -----------------------------------------------------------------------------------------------------------------
  const track = Object.keys(LADDER_LABEL)[2]
  const report = (seat: string, terms: object = {}): Offer => letter('staff', { seat, ...STAFF, ...terms }, { state: 'info' })
  add('staff/coach-full', report('coach', { wins: 24, losses: 11, bestFinish: 1, titles: 0, endRank: 31, rankTrack: track, chem: 1 }))
  add('staff/coach-1-title-negchem', report('coach', { wins: 24, losses: 11, bestFinish: 0, titles: 1, endRank: 31, rankTrack: track, chem: -1 }))
  add('staff/coach-titles-2', report('coach', { wins: 30, losses: 5, bestFinish: 0, titles: 2 }))
  add('staff/coach-deep-round', report('coach', { wins: 3, losses: 9, bestFinish: 5 }))
  add('staff/coach-no-finish', report('coach', { wins: 0, losses: 4 }))
  add('staff/coach-bare', report('coach'))
  for (const [layoffs, weeksSaved] of [[1, 1], [1, 3], [2, 1], [2, 5]] as const) add(`staff/masseur-${layoffs}-${weeksSaved}`, report('masseur', { layoffs, weeksSaved }))
  add('staff/masseur-none', report('masseur'))
  for (const focus of ['coolhead', 'recovery', 'listen', 'herself', 'publicLife']) add(`staff/psychologist-${focus}`, report('psychologist', { focus, composureBonus: focus === 'coolhead' ? 2 : 0 }))
  add('staff/psychologist-carried', report('psychologist', { focus: 'listen', focusCarriedFrom: 3 }))
  add('staff/psychologist-nofocus', report('psychologist'))
  add('staff/sparring', report('sparring'))
  for (const seat of ['coach', 'masseur', 'psychologist', 'sparring']) {
    add(`ask/${seat}-open`, letter('staff', { seat, ...STAFF, ask: ASK }))
    add(`ask/${seat}-signed`, letter('staff', { seat, ...STAFF, ask: ASK }, { state: 'signed' }))
    add(`ask/${seat}-refused`, letter('staff', { seat, ...STAFF, ask: ASK }, { state: 'refused' }))
    add(`ask/${seat}-expired`, letter('staff', { seat, ...STAFF, ask: ASK }, { state: 'expired' }))
  }

  // --- the national squad --------------------------------------------------------------------------------------------------------
  for (const won of [null, 0, 1, 2, 3]) {
    add(`callup/${won}`, letter('call-up', { label: 'Federation Cup Qualifier', tieWeek: 312, squadSize: 5, tiesInTheWeek: 3, nationsAtHerLevel: 16, leagueRoundsWon: won }, { state: 'info' }))
  }

  // --- the build -----------------------------------------------------------------------------------------------------------------
  for (const ordered of [299, 295, 248, 196, 222, 100]) add(`build/ordered-${ordered}`, letter('build', { itemId: 'yacht', label: 'The yacht', orderedWeek: ordered }, { state: 'info' }))

  // --- the buyer's letter --------------------------------------------------------------------------------------------------------
  const sale = { itemId: 'racquet-bag', priceCents: 123400 }
  add('sale/proposal', letter('sale', sale), { saleLabel: 'The bag' })
  add('sale/signed', letter('sale', sale, { state: 'signed' }), { saleLabel: 'The bag' })
  add('sale/refused', letter('sale', sale, { state: 'refused' }), { saleLabel: 'The bag' })
  add('sale/lapsed', letter('sale', sale), { saleLabel: 'The bag', week: LATE_WEEK })
  add('sale/notice', letter('sale', sale, { state: 'info' }), { saleLabel: 'The bag' })
  add('sale/proposal-nolabel', letter('sale', sale))

  // --- the advertising letter ----------------------------------------------------------------------------------------------------
  const cats = ECONOMY.advertising.categories as unknown as Record<string, { trade: string; houses: readonly string[] }>
  add('ad/legacy', letter('ad', { ...AD }))
  for (const category of ['watches', 'cars', 'drinks', 'clothing', 'airline', 'fragrance']) {
    add(`ad/${category}`, letter('ad', { ...AD, category, termYears: 2, termWeeks: 104, brand: cats[category]!.houses[0], trade: cats[category]!.trade }))
  }
  add('ad/capstone', letter('ad', { ...AD, category: 'capstone', termYears: 8, termWeeks: 416, trade: 'We make her kit' }))
  add('ad/lifetime', letter('ad', { ...AD, category: 'lifetime', lifetime: true, termYears: 1, termWeeks: 52, shootCount: 0, trade: 'We make watches' }))
  for (const years of [1, 2, 3, 4, 5, 6, 7, 8, 9]) add(`ad/term-${years}y`, letter('ad', { ...AD, category: 'cars', termYears: years, termWeeks: years * 52, trade: 'We make cars' }))
  add('ad/term-26w', letter('ad', { ...AD, termWeeks: 26, termYears: 1 }))
  for (const shootCount of [0, 1, 2, 3, 6, 7]) add(`ad/shoots-${shootCount}`, letter('ad', { ...AD, shootCount, category: 'drinks', termYears: 2, termWeeks: 104, trade: 'We make drinks' }))
  const signedAd = (terms: object, over: Partial<Offer> = {}): Offer => letter('ad', { ...AD, category: 'cars', termYears: 2, termWeeks: 104, trade: 'We make cars', ...terms }, { state: 'signed', decidedWeek: 301, fromWeek: 301, untilWeek: 404, ...over })
  add('ad/signed-running-shoots', signedAd({ shootWeeks: [310, 330] }), { week: 320 })
  add('ad/signed-running-oneshoot', signedAd({ shootWeeks: [310], shootCount: 1 }), { week: 320 })
  add('ad/signed-running-threeshoots', signedAd({ shootWeeks: [310, 330, 350], shootCount: 3 }), { week: 320 })
  add('ad/signed-running-noshoots', signedAd({}), { week: 320 })
  add('ad/signed-lifetime', signedAd({ lifetime: true, category: 'lifetime', shootCount: 0 }, { untilWeek: undefined }), { week: 320 })
  add('ad/signed-ended', signedAd({}), { week: 450 })
  add('ad/signed-cut-short', signedAd({}, { untilWeek: 330 }), { week: 450 })
  add('ad/refused', letter('ad', { ...AD }, { state: 'refused' }))
  add('ad/expired', letter('ad', { ...AD }, { state: 'expired' }))
  add('ad/lapsed', letter('ad', { ...AD }), { week: LATE_WEEK })

  // --- the kit letter ------------------------------------------------------------------------------------------------------------
  add('kit/new', letter('kit', { ...KIT }))
  add('kit/renewal', letter('kit', { ...KIT, renewal: true }))
  add('kit/apparel-bond', letter('kit', { ...KIT, apparelBond: true }))
  for (const covers of [['strings'], ['frame'], ['shoes'], ['strings', 'shoes'], ['frame', 'shoes']]) add(`kit/covers-${covers.join('+')}`, letter('kit', { ...KIT, covers }))
  add('kit/no-travel-no-domestic', letter('kit', { ...KIT, travelShare: 0, keepDomesticRank: undefined }))
  for (const seasons of [1, 2, 4, 5, 6]) add(`kit/seasons-${seasons}`, letter('kit', { ...KIT, seasons }))
  const rival: Offer = letter('ad', { ...AD, category: 'clothing', brand: 'Blanche & Noir', termYears: 2, termWeeks: 104, trade: 'We make her kit' }, { state: 'signed', decidedWeek: 280, fromWeek: 280, untilWeek: 400, week: 270 })
  add('kit/bond-cost', letter('kit', { ...KIT }), { offers: [rival] })
  add('kit/signed-running', letter('kit', { ...KIT }, { state: 'signed', decidedWeek: 301, fromWeek: 301, untilWeek: 460 }), { week: 320 })
  add('kit/signed-running-played', letter('kit', { ...KIT }, { state: 'signed', decidedWeek: 301, fromWeek: 301, untilWeek: 460, eventsPlayed: 5 }), { week: 320 })
  add('kit/signed-ended-met', letter('kit', { ...KIT }, { state: 'signed', decidedWeek: 301, fromWeek: 301, untilWeek: 350, eventsPlayed: 9 }), { week: 500 })
  add('kit/signed-ended-short', letter('kit', { ...KIT }, { state: 'signed', decidedWeek: 301, fromWeek: 301, untilWeek: 350, eventsPlayed: 3 }), { week: 500 })
  add('kit/signed-nowindow', letter('kit', { ...KIT }, { state: 'signed' }), { week: 500 })
  add('kit/refused', letter('kit', { ...KIT }, { state: 'refused' }))
  add('kit/expired', letter('kit', { ...KIT }, { state: 'expired' }))
  add('kit/lapsed', letter('kit', { ...KIT }), { week: LATE_WEEK })
  add('kit/last-week', letter('kit', { ...KIT }), { week: 305 }) // weeksLeft === 1: the singular form of the window line
  for (const ended of ['events', 'standing', 'stepped', 'term']) add(`kit/goodbye-${ended}`, letter('kit', { ...KIT, ended, endedEventsPlayed: 3 }, { state: 'info' }))
  return out
}
