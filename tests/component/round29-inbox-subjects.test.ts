// ROUND 29 #16 – EVERY SUBJECT LINE IN THE INBOX, PINNED, AND THE ONE THAT WAS FALSE.
//
// The owner, 28.08: «письмо с Заголовком Entries Suspended – я точно это заводил уже в одном из
// предыдущих раундов, мне кажется этот заголовок сбивает с толку, я его перевожу как "Заявки
// приостановлены", в то время как письмо вообще о другом… Может его как-то и озаглавить про топ-50
// правила».
//
// ⚠⚠ IT IS NOT A REOPEN AND IT IS NOT A WORDING. He DID file this letter before – round 23 #2 – but
// what he named then was «особенно последняя строчка», the closing line of the SUSPENSION letter,
// and that fix landed and still holds (tests/component/round23-tour-suspension.test.ts, untouched).
// The heading was never mentioned. What he is looking at now is a DIFFERENT letter wearing that
// heading: `TourLetterTerms.notice` has FOUR values (`due` · `penalty` · `suspension` · `season`) and
// `InboxSheet.subjectOf` branched on TWO of them and then fell through, so the SEASON BRIEFING – the
// top-50 mandatory regime, four Slams, eight 1000s, six of ten 500s – was posted under a title
// announcing a suspension that had not happened. The title was FALSE, not confusing.
//
// ⚠ AND NOTHING PINNED ANY OF IT. Before this file `git grep subjectOf -- tests` returned one comment
// and zero assertions, across THIRTEEN subject lines and six letter kinds. A fall-through is exactly
// the defect that class of gap cannot see, so every line is pinned here – not only the four that
// caused the report – and `subjectOf` now narrows `notice` to `never` after its last arm, so a fifth
// notice fails to compile rather than inheriting whichever title happens to be last.
//
// ⚠ MOUNTED, BECAUSE A SUBJECT IS A RENDERED THING. `subjectOf` is a private function inside a
// `<script setup>`; it is unreachable from a unit test and its output is interpolated into the row
// with `weekLabel` and `formatCents` beside it. What the owner reads is `.inbox-subject`, so that is
// what this file reads.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import InboxSheet from '../../src/components/InboxSheet.vue'
import { useGameStore } from '../../src/stores/game'
import {
  chargeMandatoryPenalty,
  createWorld,
  KID_ID,
  type WorldState,
} from '../../src/engine/world'
import { settleTourSeasonNotice } from '../../src/engine/world/mandatory'
import { raiseMandatoryDueLetter } from '../../src/engine/offers'
import { ECONOMY } from '../../src/engine/economy'
import { TIERS } from '../../src/engine/season/calendar'
import type { Offer, Snapshot, TourLetterTerms } from '../../src/shared/protocol'
import { careerSnapshot } from '../helpers/career'

// The inbox annotates letters with two per-device facts (read / binned) and both live in
// localStorage; this runner has none. Same shim, and the same argument, as the other mail suites.
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

// --- the four tour notices, every one of them written BY THE ENGINE ------------------------------
//
// ⚠ NOT HAND-BUILT TERMS, for the two that carry numbers the subject or the sheet quotes. A literal
// `{ notice: 'season', maxRank: 50 }` would pass this file for ever while `ECONOMY.mandatory.maxRank`
// moved underneath it, which is the drift the letter's own «numbers, never assembled prose» rule
// exists to stop. `settleTourSeasonNotice` and `chargeMandatoryPenalty` are the shipped producers.

/** A world the regime binds, built the way tests/tour-briefing.test.ts builds one: `mandatoryBindsRank`
 *  wants a counting W result and a rank inside the gate, and both are plain persisted state. */
function boundWorld(seed: string, rank = 34): WorldState {
  const world = createWorld(seed)
  world.results.push({ playerId: KID_ID, week: world.week, points: 250, tier: 'wta250' })
  world.kidRankWta = rank
  return world
}

/** THE SEASON BRIEFING – the letter in his screenshot, and the one that wore the wrong title. */
function seasonLetter(): Offer {
  const world = boundWorld('r29-16-season')
  settleTourSeasonNotice(world)
  const letter = world.offers.find((o) => o.kind === 'tour')
  expect(letter, 'the engine wrote a season notice – every claim below is about a real one').toBeTruthy()
  return letter!
}

/** THE SUSPENSION – the real one, charged four points at a time until the tour hands one down. The
 *  same construction round-23 #2 used, so the two files are looking at one letter. */
function suspensionLetter(): Offer {
  const world = createWorld('r29-16-suspension')
  let week = 260
  while (world.suspendedUntilWeek === null && week < 268) {
    chargeMandatoryPenalty(world, week, ECONOMY.mandatory.noShowPoints, 'no-show')
    week += 1
  }
  const letter = world.offers.find((o) => o.id === `tour-suspension-${week - 1}`)
  expect(letter, 'the engine handed down a suspension').toBeTruthy()
  return letter!
}

/** THE CHARGE – the first penalty of that same run, before the tenth point lands. */
function penaltyLetter(): Offer {
  const world = createWorld('r29-16-penalty')
  chargeMandatoryPenalty(world, 260, ECONOMY.mandatory.skipPoints, 'skip', { id: 'e1', tier: 'wta1000' })
  const letter = world.offers.find((o) => o.kind === 'tour' && (o.terms as TourLetterTerms).notice === 'penalty')
  expect(letter, 'the engine recorded a penalty').toBeTruthy()
  return letter!
}

/** THE WARNING – the obligation announced before it can bite. */
function dueLetter(): Offer {
  const offers: Offer[] = []
  return raiseMandatoryDueLetter(
    offers,
    258,
    { id: 'e-due', tier: 'wta1000', week: 262, deadlineWeek: 261 },
    TIERS.wta1000.label,
    ECONOMY.mandatory.skipPoints,
  )
}

// --- the rest of the post, one letter per remaining branch ---------------------------------------
//
// These carry no engine-owned number in their subject, so a literal IS the fixture rather than a
// stale copy of one: the branch is selected by `kind` and by a flag on the terms, and that is
// exactly what is being pinned.
const letter = (o: Partial<Offer> & Pick<Offer, 'id' | 'kind' | 'terms'>): Offer =>
  ({ week: 300, deadlineWeek: 305, state: 'info', ...o }) as Offer

const ENTRY_IN = letter({
  id: 'entry-1', kind: 'entry',
  terms: { tier: 'w75', label: 'Coastal Open', eventWeek: 306, freeUntilWeek: 304 },
})
const ENTRY_OUT_PARENT = letter({
  id: 'entry-2', kind: 'entry',
  terms: { tier: 'w75', label: 'Coastal Open', eventWeek: 306, freeUntilWeek: 304, cancelled: true },
})
const ENTRY_OUT_DESK = letter({
  id: 'entry-3', kind: 'entry',
  terms: { tier: 'w50', label: 'Harbour Classic', eventWeek: 306, freeUntilWeek: 304, cancelled: true, releasedBy: 'injury' },
})
const ACADEMY_IN = letter({ id: 'ac-1', kind: 'academy', terms: { notice: 'arrived', sharePct: 33, sinceWeek: 260, seasonIndex: 5 } })
const ACADEMY_REVIEW = letter({ id: 'ac-2', kind: 'academy', terms: { notice: 'reviewed', sharePct: 41, wasPct: 33, sinceWeek: 260, seasonIndex: 6 } })
const ACADEMY_END = letter({ id: 'ac-3', kind: 'academy', terms: { notice: 'ended', sharePct: 0, reason: 'aged-out', sinceWeek: 260, seasonIndex: 7 } })
const CALL_UP = letter({
  id: 'cu-1', kind: 'call-up',
  terms: { label: 'Continental Cup', tieWeek: 310, squadSize: 4, tiesInTheWeek: 2, nationsAtHerLevel: 16, leagueRoundsWon: null },
})
const AD = letter({
  id: 'ad-1', kind: 'ad', state: 'open',
  terms: { brand: ECONOMY.advertising.categories.watches.houses[0], cashCents: ECONOMY.advertising.categories.watches.feeCentsByBand[1]!, termWeeks: 52, shootCount: 2 },
})
const KIT_NEW = letter({
  id: 'kit-1', kind: 'kit', state: 'open',
  terms: { tier: 'tour', brand: 'Baseline Athletic', kitAllowanceCents: 500000, freshCap: 0.3, minEventsPerSeason: 14, covers: ['strings'], travelShare: 0.25, seasons: 2 },
})
const KIT_RENEWAL = letter({
  id: 'kit-2', kind: 'kit', state: 'open',
  terms: { tier: 'tour', brand: 'Baseline Athletic', kitAllowanceCents: 500000, freshCap: 0.3, minEventsPerSeason: 14, covers: ['strings'], travelShare: 0.25, seasons: 2, renewal: true },
})
const KIT_ENDED = letter({
  id: 'kit-3', kind: 'kit',
  terms: { tier: 'tour', brand: 'Baseline Athletic', kitAllowanceCents: 500000, freshCap: 0.3, minEventsPerSeason: 14, covers: ['strings'], travelShare: 0.25, seasons: 2, ended: 'term' },
})

/** Every subject line the sheet renders, in one array, off a career's real snapshot. */
function subjects(offers: Offer[]): string[] {
  const base: Snapshot = careerSnapshot(8, 'r29-16-inbox')
  const store = useGameStore()
  store.snapshot = { ...base, offers: [...base.offers, ...offers], week: 320 }
  const wrapper = mount(InboxSheet, { global: { stubs: { teleport: true } } })
  const out = wrapper.findAll('.inbox-subject').map((n) => n.text().replace(/\s+/g, ' ').trim())
  wrapper.unmount()
  return out
}

describe('Round 29 #16 – the tour desk raises four notices, and each says which it is', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
  })

  it('⚠⚠ THE SEASON BRIEFING NO LONGER CALLS ITSELF A SUSPENSION – it names the regime it is about', () => {
    const season = seasonLetter()
    const terms = season.terms as TourLetterTerms
    const line = subjects([season]).find((s) => s.startsWith('Required season'))

    // The defect, stated as the thing that must not be true. His screenshot is this letter.
    expect(subjects([season]), 'the season briefing must not wear the suspension letter\'s title')
      .not.toContain('Entries suspended')

    // ...and what stands there instead restates the sheet's own first sentence, «Her ranking is
    // inside the top N, so the season ahead is a required one.»
    expect(line, 'the season notice has a subject of its own').toBeTruthy()
    expect(line).toBe(`Required season – the top ${terms.maxRank}`)
    // ⚠ AND THE NUMBER IS THE RULE'S, not a literal: `settleTourSeasonNotice` writes
    // `ECONOMY.mandatory.maxRank` onto the paper and the subject quotes what the paper says.
    expect(terms.maxRank).toBe(ECONOMY.mandatory.maxRank)
    expect(line).toContain(String(ECONOMY.mandatory.maxRank))
  })

  it('the SUSPENSION keeps the title that was always true of it – the fall-through case', () => {
    // ⚠ THE ARM THAT USED TO BE THE FALL-THROUGH. It is an explicit branch now, and this is the pin
    // that says the fix did not move the letter the title actually belonged to.
    expect(subjects([suspensionLetter()])).toContain('Entries suspended')
  })

  it('the WARNING names the event it is about', () => {
    expect(subjects([dueLetter()])).toContain(`Required event – ${TIERS.wta1000.label}`)
  })

  it('the CHARGE says a charge has been recorded', () => {
    expect(subjects([penaltyLetter()])).toContain('Penalty points recorded')
  })

  it('⚠ all four are DIFFERENT lines – which is the whole of the complaint', () => {
    const all = subjects([dueLetter(), penaltyLetter(), seasonLetter(), suspensionLetter()])
    const tour = all.filter(
      (s) => s.startsWith('Required ') || s === 'Penalty points recorded' || s === 'Entries suspended',
    )
    expect(tour).toHaveLength(4)
    expect(new Set(tour).size, 'four notices, four subjects – no two share a title').toBe(4)
  })
})

describe('Round 29 #16 – and every OTHER subject line in the inbox is pinned too', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
  })

  // ⭐ THE POINT OF THIS BLOCK IS THE COVERAGE AND NOT ANY ONE LINE. A branch nobody asserts on is a
  // branch that can silently start returning somebody else's sentence, which is exactly what
  // happened to the season briefing. Thirteen lines, thirteen assertions.
  const CASES: Array<[string, Offer, string]> = [
    ['an entry confirmed', ENTRY_IN, 'Entry confirmed – Coastal Open'],
    ['the parent\'s own withdrawal', ENTRY_OUT_PARENT, 'Withdrawal confirmed – Coastal Open'],
    ['the desk taking her off', ENTRY_OUT_DESK, 'Withdrawn by the desk – Harbour Classic'],
    ['a scholarship arriving', ACADEMY_IN, 'A scholarship – 33% of her travel'],
    ['a scholarship reviewed', ACADEMY_REVIEW, 'Scholarship review – 41% of her travel'],
    ['a scholarship ending', ACADEMY_END, 'The scholarship has ended'],
    ['a kit deal offered', KIT_NEW, 'A kit deal for your daughter'],
    ['a kit deal renewed', KIT_RENEWAL, 'Another year in our kit'],
    ['a kit deal ending', KIT_ENDED, 'The kit deal has ended'],
  ]

  for (const [what, offer, expected] of CASES) {
    it(`${what} – "${expected}"`, () => {
      expect(subjects([offer])).toContain(expected)
    })
  }

  it('the squad call-up carries the week, because the week is its whole content', () => {
    const line = subjects([CALL_UP]).find((s) => s.startsWith('Named in the squad'))
    expect(line).toBeTruthy()
    // The week label is `weekLabel`'s and is not spelled out here – what is pinned is that the
    // competition and a week are both on the line, which is the branch's own promise.
    expect(line).toContain('Named in the squad – Continental Cup,')
    expect(line).toMatch(/W\d+ '\d\d/)
  })

  it('the advertising house carries the fee, and the fee is the engine\'s', () => {
    const line = subjects([AD]).find((s) => s.startsWith('Her face in a campaign'))
    expect(line).toBeTruthy()
    // ⚠ FORMATTED FROM CENTS, so this is the number the letter is worth and not a re-typing of it.
    // ⚠⚠ RE-AIMED BY ROUND 34 #7/#11/#12/#13 (03.09): the owner ruled the foot of the endorsement
    // ladder broken («129 место в мире, тот же контракт на 12к в год на 3 года. Не верю») and lifted
    // the ≤200 band tenfold, so the watches cell there is $200,000 and it now sits at index 1 behind
    // the new ≤400 band. What this arm guards – that the subject line carries the LETTER's own cents
    // rather than a re-typed figure – is unchanged.
    expect(line).toContain('$200,000')
    expect(ECONOMY.advertising.categories.watches.feeCentsByBand[1]).toBe(200_000_00)
  })

  it('⚠ THE WHOLE POST AT ONCE – thirteen letters, thirteen distinct subjects, none of them borrowed', () => {
    const all = subjects([
      ENTRY_IN, ENTRY_OUT_PARENT, ENTRY_OUT_DESK,
      dueLetter(), penaltyLetter(), seasonLetter(), suspensionLetter(),
      ACADEMY_IN, ACADEMY_REVIEW, ACADEMY_END,
      CALL_UP, AD, KIT_NEW,
    ])
    // The career's own snapshot may carry letters of its own, so this is a floor and not an equality.
    expect(all.length).toBeGreaterThanOrEqual(13)
    // ...and NOTHING in the pile shares a subject with anything else in it. A fall-through shows up
    // here as a duplicate, which is the mechanical form of "the next one cannot be silent".
    const seen = new Map<string, number>()
    for (const s of all) seen.set(s, (seen.get(s) ?? 0) + 1)
    const duplicated = [...seen.entries()].filter(([, k]) => k > 1).map(([s]) => s)
    expect(duplicated, 'two letters wearing one title is the round-29 #16 defect').toEqual([])
  })
})
