// =================================================================================================
// ⭐⭐⭐ ROUND 38 #7b / #6d – THE TWO WINDOWS ONTO HER OWN DECLINE
// =================================================================================================
//
// #7b WAS A REAL DEFECT AND IT WAS FOUND ON THE OWNER'S OWN WEEK-1115 SAVE. `realisedShare` is
// `gained / (room x reachable)` with `gained = Sum(skills - born)`; past `declineStart` the skills
// FALL, so `gained` falls with them and an ageing career walks BACKWARDS down a ladder whose own
// note calls it monotone. His Alice Martin - 35.3, 80.4% of the body she had at her peak, #141 on a
// table she once finished #20 on - was being told:
//
//     «Huge potential - most of her game is still ahead of her, and this is where a coach buys the
//      most.»
//
// #6d IS THE OTHER HALF OF THE SAME ASK (owner, 07.09): «нужно чётко понимать, что карьера уже не та
// и явно это подсвечивать, как раз срез года закончить/продолжать... там нужно больше её голоса (или
// голоса тренера, если он есть, или совместного), чтобы можно было отслеживать её состояние и
// перформанс», and on the coach plate: «вполне можно вернуть на home и как раз расширить на старение
// тоже, чтобы было видно, что оно пошло».
//
// ⚠⚠ WHAT MAY NOT COME BACK WITH IT, AND IT IS THE REASON HALF THIS FILE IS A NEGATIVE. Round 34 #2a
// took the CEILING read off Home on his own words - «Тренер на главном экране … написал 14 летней
// девочке Close to her ceiling … звучит как приговор» - and `round24-coach-card.test.ts` pins that
// removal. A girl who is still growing sees no such line on Home. Only a career past its peak does.
//
// ⚠ EVERY COPY ASSERTION HERE IS READ AS RENDERED, off a mounted component with the real data
// interpolated, and never grepped out of the source. A source pin would pass on a template that
// renders nothing.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
// ⚠ THE REAL STYLESHEET, or the fit measurement at the bottom reads an empty cascade and passes
// vacuously - `measureDialog` refuses a document with no `<style>` in it for exactly that reason.
import '../../src/style.css'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import RetirementDialog from '../../src/components/RetirementDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { COACH_BODY_END_SHARE, coachDeclineNote, coachRoomNote, lastWinterIn } from '../../src/engine/world/coachMarket'
import { ageAtPhysicalShare, physicalMean } from '../../src/engine/development'
import { ENDINGS } from '../../src/engine/ending'
import { kidAgeExact } from '../../src/engine/world/age'
import { assertDismissReachable, setViewport, PHONE } from './fits'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import type { RetirementOffer, SeasonHistoryEntry, SeasonTrackRow, Snapshot } from '../../src/shared/protocol'
// ⚠ `LadderTrack` LIVES IN THE ENGINE'S SEASON TYPES, not on the protocol barrel – `protocol/
// competition.ts` imports it from exactly here, which is why a `Record<LadderTrack, …>` in this file
// has to as well.
import type { LadderTrack } from '../../src/engine/season/types'
import type { WorldState } from '../../src/engine/world'

// ⚠ THIS RUNNER HAS NO localStorage AND `HomeScreen` READS IT. The same shim `round24-coach-card`,
// `home-strip-and-mail` and `round20-ui` carry, and for the reason quoted there in full: happy-dom is
// configured here without web storage, every reader in `src/` wraps it in try/catch and answers
// "claim nothing" when it throws, so the correct production fallback would make this screen
// untestable by accident. The runner gets an object; the code is not weakened to suit it.
const backing = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
    setItem: (k: string, v: string) => void backing.set(k, String(v)),
    removeItem: (k: string) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i: number) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  },
})

const CYRILLIC = /[А-Яа-яЁё]/
const LONG_DASH = /—/

const EMPTY_ROW: SeasonTrackRow = { points: 0, wins: 0, losses: 0 }

/** One banked season, with a professional place in it or without one. Only `byTrack.wta.endRank` is
 *  load-bearing; the rest is the shape the wrap-up writes. */
function season(seasonIndex: number, wtaRank: number | null): SeasonHistoryEntry {
  const byTrack = {
    domestic: { ...EMPTY_ROW },
    itf: { ...EMPTY_ROW },
    wta: wtaRank === null ? { ...EMPTY_ROW } : { ...EMPTY_ROW, endRank: wtaRank },
  } as Record<LadderTrack, SeasonTrackRow>
  return {
    seasonIndex,
    endRank: wtaRank ?? 0,
    points: 0,
    wins: 0,
    losses: 0,
    fundsDeltaCents: 0,
    endFundsCents: 0,
    byTrack,
  }
}

/** ⭐⭐ A CAREER PAST ITS PEAK, WITH THE THREE THINGS THIS ITEM READS UNDER MY OWN HAND: how old she
 *  is, how much of her body is left, and where the table has put her.
 *
 *  ⚠ THE RANKS ARE THE POINT. Every number this feature prints is a SUBTRACTION over these rows, so
 *  a career whose ranks the test chooses is what makes a wrong subtraction fail rather than merely
 *  look different. `share` is set by moving her stored peak, not her skills, because `physicalShare`
 *  is `physicalMean(skills) / peakPhysical` and the skills are also what `realisedShare` reads - the
 *  measure this item is fixing. Moving the peak moves exactly one of the two.
 *
 *  ⚠ `week` PUTS HER PAST HER OWN `declineStart` AND NOTHING ELSE DOES. A fresh world carries no
 *  stored `ageCurve`, so `ageCurveOf` returns the shipped pair - which is the arm a fourteen-year-old
 *  is measured against below, unchanged. */
/** ⚠⚠ `seasonWeek` JOINED THIS FIXTURE ON ROUND 39 #2b's SECOND REOPEN (08.09): Home's decline plate
 *  rotates on which third of the season the week falls in, so an arm that wants one particular
 *  sentence has to name its phase. `(years - 14) * 52` is a whole number of seasons, so the default
 *  is season-week 0 – the EARLY third. `coachDeclineNote`, the LONG sentence, does not rotate. */
const MID_SEASON_WEEK = 20
function pastPeakWorld(opts: {
  seasons: SeasonHistoryEntry[]
  share?: number
  ageYears?: number
  seasonWeek?: number
}): WorldState {
  const world = createWorld('r38-decline', { ...DEFAULT_PROFILE, coachTier: 'middle' })
  const years = opts.ageYears ?? 35
  world.week = Math.round((years - 14) * 52) + (opts.seasonWeek ?? 0)
  world.peakPhysical = physicalMean(world.skills) / (opts.share ?? 0.8)
  world.seasonHistory = opts.seasons
  return world
}

/** Home, mounted, with a real snapshot behind it. Reads what the coach plate actually renders.
 *
 *  ⚠ RE-AIMED BY ROUND 39 #2a/#2b: Home's selector is `.coach-room-short` now (wave A's
 *  `.coach-decline-short`, renamed when the 08.09 reopen made the plate carry EITHER read – the
 *  seasons clause past her peak, the band short while she grows). The LONG sentence renders on the
 *  current coach's card in the market list (`.cm-decline`, pinned in r39-decline-surfaces.test.ts)
 *  and the round-38 `.coach-decline` paragraph must NOT come back, which is what `longGone` is
 *  for. `plate` is whatever the one plate says – arms below assert which read it is. */
function homePlate(world: WorldState): { plate: string; quote: string; card: string; longGone: boolean } {
  const store = useGameStore()
  store.snapshot = toSnapshot(world)
  const wrapper = mount(HomeScreen, { props: { recapFresh: false }, global: { stubs: { teleport: true } } })
  const out = {
    plate: wrapper.find('.coach-room-short').exists() ? wrapper.get('.coach-room-short').text() : '',
    quote: wrapper.find('.coach-line').exists() ? wrapper.get('.coach-line').text() : '',
    card: wrapper.find('.coach-card').exists() ? wrapper.get('.coach-card').text() : '',
    longGone: !wrapper.find('.coach-decline').exists(),
  }
  wrapper.unmount()
  return out
}

/** THE FOUR HEADROOM LABELS, which are the strings round 34 #2a sent off this screen. */
const CEILING_LABELS = ['Huge potential', 'Still room to grow', 'Close to her ceiling', 'At her ceiling']

describe('round 38 #7b – the coach stops calling a 35-year-old a prospect', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐ THE DEFECT: past her peak the read is no longer a headroom band at all', () => {
    // The shape of his own save: a professional career that peaked at #20 and finished last season
    // #125, a year after #68.
    const world = pastPeakWorld({ seasons: [season(16, 20), season(19, 68), season(20, 125)] })
    const note = coachRoomNote(world)
    for (const label of CEILING_LABELS) {
      expect(note, `the ageing read is still a headroom band: "${note}"`).not.toContain(label)
    }
    expect(note).toBe(coachDeclineNote(world))
  })

  it('⚠ ...and the same function is UNTOUCHED on a career that is still growing', () => {
    // Non-vacuity for the arm above: the fix may not be "the sentence is gone". A fourteen-year-old
    // still gets a headroom band, which is what round 23 asked for and round 34 re-cut.
    const world = createWorld('r38-young', { ...DEFAULT_PROFILE, coachTier: 'middle' })
    const note = coachRoomNote(world)
    expect(coachDeclineNote(world), 'a child is being read as past her peak').toBe('')
    expect(CEILING_LABELS.some((l) => note.startsWith(l)), `not a headroom band: "${note}"`).toBe(true)
  })
})

describe('round 38 #6d – the coach plate on Home, and only past her peak', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐ A GROWING FOURTEEN-YEAR-OLD SEES NO VERDICT – the decline gate holds (⚠ re-aimed, round 39 #2b reopen)', () => {
    // ⚠⚠ THIS IS THE ARM THAT GOES RED IF THE AGE GATE IS REMOVED, and it is not vacuous: a fresh
    // world DOES carry `peakPhysical` (`createWorld` writes `physicalMean(arrival)`), so every
    // ingredient the decline read needs is present on this snapshot. The only thing keeping the line
    // off a child's screen is `age < bounds.declineStart` in `declineRead`. Deleting that line
    // makes `seasonsOfBodyLeft` walk a `declineFactor` of 0 to its own cap and this screen print
    // «Past her peak – about 40 seasons left» to a girl of fourteen.
    //
    // ⚠⚠ RE-AIMED 08.09: «sees NOTHING» became «sees no VERDICT». The owner asked the growing band
    // back onto Home in 3-5 words («вот это тоже всё-таки можно показывать буквально в 3-5 слов на
    // home»), so her plate now says a band SHORT – digitless, the engine's own row, pinned as
    // rendered in round24-coach-card/r39-decline-surfaces – and what this arm keeps holding is the
    // round-34 core: «Past her peak» unreachable at fourteen, and no digit about her on the card's
    // read.
    const world = createWorld('r38-home-young', { ...DEFAULT_PROFILE, coachTier: 'middle' })
    world.seasonHistory = [season(0, 411), season(1, 198)]
    expect(world.peakPhysical, 'the fixture proves nothing without a peak on it').toBeGreaterThan(0)
    expect(kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)).toBeLessThan(15)

    const { plate, quote, card } = homePlate(world)
    expect(plate, 'the growing read the owner asked back is not rendered').not.toBe('')
    expect(plate, `a verdict on a fourteen-year-old: "${plate}"`).not.toContain('Past her peak')
    expect(plate, `a figure about a child: "${plate}"`).not.toMatch(/\d/)
    expect(card, '«Past her peak» is on Home\'s coach card at fourteen').not.toContain('Past her peak')
    // ⚠ NON-VACUITY: the card really did render, so an empty wrapper cannot be what passed above.
    expect(quote, 'the round-7 coach quote has gone missing').not.toBe('')
  })

  it('⭐⭐ ...AND A CAREER PAST ITS PEAK DOES – the short plate, as rendered (⚠ re-aimed, round 39 #2a/#2b)', () => {
    // ⚠ RE-AIMED 08.09: this arm used to assert the WHOLE sentence on Home. The owner sent the long
    // form to the coach card in the market list («много текста») and kept a short plate here; the
    // rendered-on-the-card assertion lives in r39-decline-surfaces.test.ts now.
    // ⚠ RE-AIMED AGAIN BY THE #2b REOPEN (08.09): of wave A's three short arms the owner kept ONE –
    // «может быть разве что – about 4 seasons left еще можно оставить» – so the plate says the
    // seasons clause and the rank subtraction lives in the card's long sentence alone (its arm one
    // test down).
    // ⚠⚠ AND RE-AIMED A THIRD TIME BY THE 08.09 RE-REOPEN, WHICH ONLY ADDS A WEEK TO THE FIXTURE:
    // the plate rotates on the season's third («чередовать … уберет статичность»), so the clause he
    // kept is measured at MID season, where it is the engine's answer. Every other assertion in this
    // arm is unchanged and still holds in every phase.
    const world = pastPeakWorld({ seasons: [season(16, 20), season(19, 68), season(20, 125)], seasonWeek: MID_SEASON_WEEK })
    const { plate, quote, card, longGone } = homePlate(world)

    expect(plate).toMatch(/^Past her peak – about \d+ seasons? left$/)
    // ...the rank clause may not be on Home any more, on the very fixture that fell 57 places...
    expect(plate).not.toContain('places')
    expect(card, 'the rank clause is still on Home').not.toContain('places')
    // ...and the long form's tell may not be on Home either: the body clause moved with it.
    expect(longGone, 'the round-38 long paragraph is rendered beside the plate').toBe(true)
    expect(card, 'the body clause is still on Home').not.toContain('more seasons in it')
    // The coach's own voice is untouched beside it - round 7 #5d copy, never part of any complaint.
    expect(card, 'the decline read pushed his quote off the card').toContain(quote)
    expect(CYRILLIC.test(plate), `Cyrillic in the read: ${plate}`).toBe(false)
    expect(LONG_DASH.test(plate), `a long dash in the read: ${plate}`).toBe(false)
  })

  it('⚠ the rank move really is a subtraction – a second career, different ranks (⚠ re-aimed twice)', () => {
    // One data point is satisfied by a constant. Two are not.
    // ⚠ RE-AIMED 08.09 (#2b reopen): the year clause left Home's plate for the coach card's long
    // sentence, so the subtraction is pinned where the words now are – `coachDeclineNote`, whose
    // rendered home (the market list's current-coach card) is pinned in r39-decline-surfaces.
    // ⚠⚠ THE RE-REOPEN BROUGHT IT BACK TO HOME in his shorter phrasing for the EARLY third, so the
    // subtraction is now pinned on BOTH surfaces off one fixture – rendered on Home at week 0 and in
    // the engine's long sentence – and the seasons form is pinned where it is the answer.
    const world = pastPeakWorld({ seasons: [season(17, 40), season(18, 40), season(19, 90)] })
    expect(coachDeclineNote(world)).toContain('down 50 places on the year')
    expect(homePlate(world).plate, 'the subtraction is not on the rendered plate').toBe("She's down 50 places")
    const mid = pastPeakWorld({ seasons: [season(17, 40), season(18, 40), season(19, 90)], seasonWeek: MID_SEASON_WEEK })
    expect(homePlate(mid).plate).toMatch(/^Past her peak – about \d+ seasons? left$/)
  })

  it('⚠ ...and it is HER BODY that decides the second half, walked and not guessed', () => {
    // ⭐ CROSS-CHECKED AGAINST A DIFFERENT SHIPPED FUNCTION. `ageAtPhysicalShare` walks the same curve
    // the other way - from `declineStart` DOWN to a share - so the distance between her share and
    // the sentence's stop on that walk is an independent derivation of the seasons it prints.
    // ⚠ Deliberately NOT a pinned integer: the approved wave that moves
    // `plateauStart`/`declineStart` moves both walks together, and a literal here would rot silently.
    //
    // ⚠⚠ RE-AIMED TWICE BY ROUND 39. #13a: the stop is `COACH_BODY_END_SHARE` (0.70 - the pinned
    // 70%⇔38 equivalence, the model's own end of a professional body), no longer
    // `ENDINGS.lastOfferPeakShare` - walked to 0.55 the sentence promised a barely-declined
    // 29-year-old «about 13 more seasons», the owner's own report. The swept shares sit ABOVE the
    // new stop so every row still has a real walk. #2a: the sentence is read off the engine
    // (`coachDeclineNote`) - Home carries only the short plate now, and the long sentence's rendered
    // home (the market list's current-coach card) is pinned in r39-decline-surfaces.test.ts.
    //
    // ⚠⚠ THE FIXTURE'S AGE IS SET FROM THE SHARE AND THAT IS THE WHOLE OF THE CROSS-CHECK'S VALIDITY.
    // `declineFactor` steepens every year, so how long a body has left is a function of BOTH numbers:
    // a 35-year-old at 70% has longer than a 38-year-old at 70%, because she is losing it more slowly.
    // The first draft of this arm held the age at 35 and varied only the share, and it went red at
    // 0.7 by 1.4 seasons - the engine reading her real age against a reference that had walked to a
    // different one. Putting her where the curve says a body at that share is makes the two walks
    // comparable, which is what an independent derivation has to be.
    for (const share of [0.95, 0.9, 0.8]) {
      const world = pastPeakWorld({ seasons: [season(19, 68), season(20, 125)], share, ageYears: ageAtPhysicalShare(share) })
      const said = coachDeclineNote(world)
      const found = said.match(/her body has about (\d+) more seasons? in it/)
      expect(found, `no body clause at share ${share}: "${said}"`).not.toBeNull()
      const expected = ageAtPhysicalShare(COACH_BODY_END_SHARE) - ageAtPhysicalShare(share)
      expect(Math.abs(Number(found![1]) - expected), `share ${share}: said ${found![1]}, walk says ${expected.toFixed(2)}`).toBeLessThanOrEqual(1)
    }
  })

  it('⚠ ...and it is SINGULAR from the professional end to the last offer – the borrowed-time tail reads 1', () => {
    // ⚠ RE-AIMED, round 39 #13a: the walk stops at `COACH_BODY_END_SHARE`, so everywhere between it
    // and `ENDINGS.lastOfferPeakShare` (the 38-to-41 tail the QUESTION owns) the honest floor is
    // «about 1 more season» - she is playing on a body the model calls done. Both edges pinned.
    //
    // ⚠⚠ RE-AIMED AGAIN, ROUND 40 #14b, AND NOTHING IS DROPPED - THE CLAIM SPLITS IN TWO. The floor
    // is exactly what that item found wrong with this stretch: it is the SAME «about 1 more season»
    // for three and a half years, so it cannot tell a woman two winters from the last question from
    // one who is on it. Inside the warning window (`lastWinterIn` non-null, the last two off-seasons)
    // the shared clause IS the count now; everywhere else in the tail it is still the floor, and both
    // halves are pinned here rather than one of them being deleted. The old fixture's share sat a
    // whisker above the band - i.e. squarely in the window - so it moves down the tail and the
    // window's own edge gets its own assertion underneath.
    const tail = pastPeakWorld({ seasons: [season(19, 68), season(20, 125)], share: 0.65, ageYears: ageAtPhysicalShare(0.65) })
    expect(lastWinterIn(tail), 'the tail fixture drifted into round 40s warning window').toBeNull()
    expect(coachDeclineNote(tail)).toContain('about 1 more season in it')
    const atEnd = pastPeakWorld({ seasons: [season(19, 68), season(20, 125)], share: COACH_BODY_END_SHARE - 0.005, ageYears: ageAtPhysicalShare(COACH_BODY_END_SHARE - 0.005) })
    expect(coachDeclineNote(atEnd)).toContain('about 1 more season in it')

    // ...and the edge this arm used to read - a body a whisker above the band - is the warning's now.
    const nearFinal = pastPeakWorld({ seasons: [season(19, 68), season(20, 125)], share: ENDINGS.lastOfferPeakShare + 0.005, ageYears: 41 })
    expect(lastWinterIn(nearFinal), 'a body at the band is not inside the warning window').not.toBeNull()
    expect(coachDeclineNote(nearFinal)).toContain('her last winter is')
    expect(coachDeclineNote(nearFinal), 'two body clauses in one sentence').not.toContain('more season in it')
  })

  it('⚠ a year she IMPROVED falls through to her best season – no invented fall', () => {
    // She may still climb past her peak: the table is not her body. The sentence must not say she
    // fell in a year she rose. (⚠ re-aimed to the engine string, round 39 #2a - the rendered card
    // is pinned in r39-decline-surfaces.test.ts.)
    const world = pastPeakWorld({ seasons: [season(16, 20), season(19, 125), season(20, 68)] })
    const said = coachDeclineNote(world)
    expect(said).toContain('48 places below her best season')
    expect(said).not.toContain('on the year')
  })

  it('⚠ ...and a gap in the history is not called a year', () => {
    // s16 -> s20 is four seasons, not one. «She fell N places in a year» across that gap is a false
    // sentence with a true number in it, so the year-on-year arm refuses and the best-year arm speaks.
    const world = pastPeakWorld({ seasons: [season(16, 20), season(20, 125)] })
    const said = coachDeclineNote(world)
    expect(said).toContain('105 places below her best season')
    expect(said).not.toContain('on the year')
  })

  it('⚠ ...and a career sitting on its own best says the one thing the market can back', () => {
    // No fall to report at all. `ageFactor` is 0 past `declineStart`, so no rung of the ladder adds a
    // point to her - which is the coach card's own question answered, not a consolation.
    const world = pastPeakWorld({ seasons: [season(20, 30)] })
    const said = coachDeclineNote(world)
    expect(said).toContain('no coach buys that back')
    expect(said).not.toMatch(/places/)
  })
})

// =================================================================================================
// #6d – HER OWN VOICE AT THE SEASON CUT
// =================================================================================================

const AGE_OFFER: RetirementOffer = { askedWeek: 1453, seasonIndex: 21, reason: 'age', final: false }

/** The retirement card with a snapshot this test controls, mounted to the document so the fit
 *  measurement at the bottom reads the real cascade. */
function retireCard(over: Record<string, unknown> = {}): {
  wrapper: ReturnType<typeof mount>
  her: string
  coach: string
  card: Element
  dismiss: Element
} {
  const game = useGameStore()
  game.$patch({
    snapshot: {
      ageYears: 35,
      week: 1108,
      kidRank: 141,
      fundsCents: 1234_00,
      oneMoreYearCount: 0,
      physicalShare: 0.8,
      careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 },
      retirementOffer: AGE_OFFER,
      seasonHistory: [],
      coachMarket: [],
      ...over,
    } as unknown as Snapshot,
  })
  const wrapper = mount(RetirementDialog, { attachTo: document.body })
  const answers = wrapper.findAll('.retire-answer')
  return {
    wrapper,
    her: wrapper.find('.retire-season').exists() ? wrapper.get('.retire-season').text() : '',
    coach: wrapper.find('.retire-season-coach').exists() ? wrapper.get('.retire-season-coach').text() : '',
    card: wrapper.get('.retire-card').element,
    dismiss: answers[answers.length - 1].element,
  }
}

describe('round 38 #6d – she says the year out loud at the season cut', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐ HER LINE CARRIES THE TWO RANKS, as rendered', () => {
    const { wrapper, her } = retireCard({ seasonHistory: [season(16, 20), season(19, 68), season(20, 125)] })
    expect(her).toBe('«#68 last winter, #125 this one. I can read a table as well as you can.»')
    // ⚠ AND HIS ROUND-30 LEDE AND ROUND-31 RUNG ARE BOTH STILL THERE. This is an ADDED passage; the
    // two paragraphs above it are owner-approved copy and invariant 4 protects them from this item.
    expect(wrapper.get('.retire-lede').text()).toContain('Twenty-nine is when the question starts being asked')
    expect(wrapper.find('.retire-rung').exists(), 'round 31 #9\'s rung has gone missing').toBe(true)
    wrapper.unmount()
  })

  it('⚠ the two ranks are read, not printed – a different career says different numbers', () => {
    const { wrapper, her } = retireCard({ seasonHistory: [season(11, 210), season(12, 402)] })
    expect(her).toBe('«#210 last winter, #402 this one. I can read a table as well as you can.»')
    wrapper.unmount()
  })

  it('⚠ ...and a year she did not fall in reads her best season instead', () => {
    const { wrapper, her } = retireCard({ seasonHistory: [season(16, 20), season(19, 125), season(20, 68)] })
    expect(her).toBe('«#68 this winter. My best year finished #20, and I know the difference.»')
    wrapper.unmount()
  })

  it('⚠ ...and a career at its own best, or with no professional season, says nothing at all', () => {
    // A card that always speaks stops being information. Both silences are deliberate.
    for (const [name, history] of [
      ['her own best', [season(19, 90), season(20, 30)]],
      ['no professional season', [season(19, null), season(20, null)]],
      ['no history at all', []],
    ] as const) {
      const { wrapper, her, coach } = retireCard({ seasonHistory: history })
      expect(her, `${name}: a passage was invented`).toBe('')
      expect(coach, `${name}: his half spoke without hers`).toBe('')
      wrapper.unmount()
    }
  })

  it('⭐ the coach speaks BESIDE her when she has one, by name, and is silent when she does not', () => {
    const history = [season(19, 68), season(20, 125)]
    const withCoach = retireCard({
      seasonHistory: history,
      coachMarket: [{ id: 'c1', name: 'Marco Ricci', current: true }],
    })
    expect(withCoach.coach).toContain('M. Ricci')
    expect(withCoach.coach).toContain('The work holds what she has left')
    expect(withCoach.her, 'his half replaced hers').toContain('#125')
    withCoach.wrapper.unmount()

    const selfCoached = retireCard({ seasonHistory: history, coachMarket: [{ id: 'c1', name: 'Marco Ricci', current: false }] })
    expect(selfCoached.coach, 'a coach spoke on a self-coached career').toBe('')
    expect(selfCoached.her, 'her own line went with him').not.toBe('')
    selfCoached.wrapper.unmount()
  })

  it('⚠⚠ ...and he is silent while she is STILL AT HER PEAK, because his line would be false there', () => {
    // «It stopped adding to it» is `ageFactor === 0` said in words, and that is not true of a woman
    // whose own `declineStart` she has not reached. The winter question opens at 29 and the decline
    // age is a per-career draw (round 31 #10), so a girl who drew 31 is asked twice before it is.
    // ⚠ HER OWN LINE IS NOT GATED and must not be: it is about the TABLE, and the ranks are the ranks
    // whatever her body is doing.
    const atPeak = retireCard({
      physicalShare: 1,
      seasonHistory: [season(19, 68), season(20, 125)],
      coachMarket: [{ id: 'c1', name: 'Marco Ricci', current: true }],
    })
    expect(atPeak.coach, 'a false claim about her growth on a career that is still growing').toBe('')
    expect(atPeak.her, 'her own reading of the table went with his').toContain('#125')
    atPeak.wrapper.unmount()
  })

  it('⚠ no Cyrillic and no long dash on the card, on the reading this item lengthened', () => {
    const { wrapper } = retireCard({
      seasonHistory: [season(19, 68), season(20, 125)],
      coachMarket: [{ id: 'c1', name: 'Marco Ricci', current: true }],
    })
    const text = wrapper.text()
    expect(CYRILLIC.test(text), `Cyrillic on the card: ${text}`).toBe(false)
    expect(LONG_DASH.test(text), `a long dash on the card: ${text}`).toBe(false)
    // ⭐ NOT A VACUOUS PASS – the kicker's «Off-season – she is 35» is a real short dash.
    expect(text).toContain('–')
    wrapper.unmount()
  })

  it('⭐⭐ THE CARD IS LONGER NOW, AND THE WAY OUT OF IT IS STILL ON A 375x667 PHONE', () => {
    // CLAUDE.md's standing rule: any dialog you add to or lengthen gets this assertion. Both added
    // paragraphs are on the card here - the longest this reading can be.
    setViewport(PHONE)
    const { wrapper, card, dismiss } = retireCard({
      seasonHistory: [season(19, 68), season(20, 125)],
      coachMarket: [{ id: 'c1', name: 'Marco Ricci', current: true }],
    })
    assertDismissReachable(card, dismiss, PHONE, 'RetirementDialog (age offer, her season word)')
    wrapper.unmount()
  })

  it('⚠⚠ MUTATION PROOF – strip the height bound and the SAME assertion goes red', () => {
    // Without this the arm above is unfalsifiable: the cap lives on the shared `.dialog-card` rule, so
    // a green run would only prove the cascade exists. This is the shape `TourBriefingDialog` shipped
    // in, and the shape round-20 #3 stopped a career on.
    setViewport(PHONE)
    const { wrapper, card, dismiss } = retireCard({
      seasonHistory: [season(19, 68), season(20, 125)],
      coachMarket: [{ id: 'c1', name: 'Marco Ricci', current: true }],
    })
    ;(card as HTMLElement).style.maxHeight = 'none'
    ;(card as HTMLElement).style.overflowY = 'visible'
    expect(() => assertDismissReachable(card, dismiss, PHONE, 'RetirementDialog (uncapped)')).toThrow()
    wrapper.unmount()
  })
})
