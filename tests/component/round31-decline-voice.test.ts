// ⭐⭐⭐ ROUND 31 #9 – SHE IS 93% OF HER PEAK AND THE GAME HAS NEVER SAID SO.
//
// `physicalShare = physicalMean(skills) / peakPhysical` has existed since v62 and the ONLY thing the
// game did with it was read it as a boolean: `final: physicalShare <= 0.55` decides whether this
// winter's retirement question is the last one. Between 100% and 55% lie forty-five points of the
// story this game is about, and none of it reached a screen – which is why the owner spent a season
// believing the software was broken (round 31 #7). His ask, 31.08: «да, заведи находку про пик и
// спад, и тренер вполне может что-то такое говорить. Да и она сама в конце сезона … могла бы что-то
// тоже сказать на эту тему.»
//
// THREE SURFACES, NINE SENTENCES, ALL NINE HIS: «мне нравятся все вариации диалогов … давай все
// использовать, сможем сделать разумно?»
//
// ⚠ MOUNTED, NOT SOURCE-PINNED. Every claim below is about what a screen SAYS at a given share, and
// a source pin cannot tell a rendered sentence from a dead branch (CLAUDE.md's own gotcha).
//
// ⚠⚠ WHAT THIS FILE IS REALLY FOR IS THE TRAP, AND IT IS ROUND 31 #4's TRAP WEARING DIFFERENT
// CLOTHES. A line drawn afresh on every read changes every time he opens the screen, and he will
// report it as a defect exactly as he reported the re-rolling first-round opponent – 19 of 27
// tournaments. So the determinism cases are not formalities: each of them reads the SAME subject
// through TWO DIFFERENT WEEKS of a ticked world and demands one sentence. Put the week in a
// sub-stream key and they go red; that is the mutation they were built against.
//
// ⚠ AND THE OTHER HALF: nothing here may fire at her peak. `physicalShare` is exactly 1 until she is
// past her OWN `declineStart` (round 31 #10 made that pair per-career), so the gate is the share and
// never `ECONOMY.development.ageCurve.declineStart` – which is the shipped 29 for everybody and is
// precisely the bug that round fixed.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RetirementDialog from '../../src/components/RetirementDialog.vue'
import SeasonSummaryDialog from '../../src/components/SeasonSummaryDialog.vue'
// ⚠ THE REAL STYLESHEET, or the fit measurements at the foot of this file read an empty cascade and
// pass vacuously – `measureDialog` refuses a document with no `<style>` in it for that reason.
import '../../src/style.css'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import { physicalShareOf } from '../../src/engine/world/endings'
import { physicalMean } from '../../src/engine/development'
import { rngFromSeed } from '../../src/engine/rng'
import {
  ALL_DECLINE_LINES,
  COACH_DECLINE_LINES,
  COACH_WEEK_CHOICE,
  DECLINE_RUNGS,
  HER_DECLINE_LINES,
  coachDeclineLine,
  coachDeclinePool,
  declineRung,
  pastHerPeak,
} from '../../src/composables/declineVoice'
import { mountSeason } from '../helpers/mountSeason'
import { assertDismissReachable, setViewport, PHONE } from './fits'
import type { RetirementOffer, SeasonSummary, Snapshot } from '../../src/shared/protocol'

/** Rendered text with the template's own wrapping collapsed – what a reader sees. */
const said = (text: string): string => text.replace(/\s+/g, ' ').trim()

const PEAK_RUNG = DECLINE_RUNGS[0].line
const MIDDLE_RUNG = DECLINE_RUNGS[1].line
const GONE_RUNG = DECLINE_RUNGS[2].line

/** A real snapshot, so everything besides the share is the engine's own.
 *
 *  ⚠ MEMOISED, AND FOR A MEASURED REASON. The walk is fixture FURNITURE – no case below is a claim
 *  about ticking – and the first draft re-walked sixty weeks for each of twenty seasons, which ran
 *  in 4.5s alone and TIMED OUT at 5s inside the full component pool. A snapshot is a plain object
 *  every caller spreads before touching, so one walk per (weeks, seed) is the same fixture at a
 *  twentieth of the cost. */
const WALKS = new Map<string, Snapshot>()
function walked(weeks: number, seed: string): Snapshot {
  const key = `${weeks}:${seed}`
  const held = WALKS.get(key)
  if (held) return held
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  const snap = toSnapshot(world)
  WALKS.set(key, snap)
  return snap
}

// =================================================================================================
// 0. THE NUMBER REACHES THE SCREEN AT ALL
// =================================================================================================
//
// ⚠ THE WIRE IS TESTED SEPARATELY FROM THE READING, DELIBERATELY. Walking a career to 31 costs ~900
// ticks in every case below; what those cases are about is what a SCREEN does with a share, so they
// are handed one. That is only honest if the engine really puts the share on the snapshot, which is
// what these two cases are for – and between them they cover the whole chain.
describe('round 31 #9 – the share is on the wire', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('a career short of its peak reads EXACTLY 1, and that is what makes the share a gate', () => {
    const snap = walked(60, 'r31f-wire-peak')
    expect(snap.physicalShare).toBe(1)
    expect(pastHerPeak(snap.physicalShare), 'a girl of seventeen read as past her peak').toBe(false)
  })

  it('a body past its peak reads its own share, and the snapshot carries the engine\'s number', () => {
    // The peak is a running maximum and the decline moves `skills` beneath it. Rather than tick 900
    // weeks, the maximum is raised to what a 93% body would have had – the same arithmetic, at the
    // one place the engine reads it.
    const world = createWorld('r31f-wire-decline')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 60; i++) tickWeek(world, rng)
    world.peakPhysical = physicalMean(world.skills) / 0.931

    expect(physicalShareOf(world)).toBeCloseTo(0.931, 6)
    expect(toSnapshot(world).physicalShare, 'the builder does not carry the engine\'s number').toBe(
      physicalShareOf(world),
    )
  })
})

// =================================================================================================
// 1. (a) THE RETIREMENT CARD – THREE RUNGS OF ONE DECLINE, AND THE SHARE PICKS
// =================================================================================================
const AGE: RetirementOffer = { askedWeek: 1453, seasonIndex: 27, reason: 'age', final: false }
const PLATEAU: RetirementOffer = { askedWeek: 700, seasonIndex: 12, reason: 'plateau', final: false }
const FINAL: RetirementOffer = { askedWeek: 1453, seasonIndex: 27, reason: 'age', final: true }

function showOffer(offer: RetirementOffer, over: Record<string, unknown> = {}): void {
  useGameStore().$patch({
    snapshot: {
      ageYears: 31,
      week: 1453,
      kidRank: 88,
      fundsCents: 1234_00,
      oneMoreYearCount: 0,
      careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 },
      seed: 'r31f-retire',
      physicalShare: 1,
      retirementOffer: offer,
      ...over,
    } as unknown as Snapshot,
  })
}

/** The rung the card is rendering, or null when it draws none. */
function rungOnCard(offer: RetirementOffer, over: Record<string, unknown> = {}): string | null {
  showOffer(offer, over)
  const w = mount(RetirementDialog)
  const rung = w.find('.retire-rung')
  const text = rung.exists() ? said(rung.text()) : null
  w.unmount()
  return text
}

describe('round 31 #9 (a) – the retirement card says which year it is', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('each band renders its OWN sentence and neither of the other two', () => {
    // ⚠ THE PAIRING IS THE POINT. "The right rung appears" alone is satisfied by a card that prints
    // all three; "no other rung appears" alone is satisfied by a card that prints nothing. Both, at
    // three shares including the two the owner's own save actually reads, or the claim is not made.
    const cases: [number, string][] = [
      [1.0 - 1e-9, PEAK_RUNG],
      [0.98, PEAK_RUNG],
      [0.952, PEAK_RUNG], // his career at 31.0
      [0.95, PEAK_RUNG], // the boundary belongs to the band above it
      [0.931, MIDDLE_RUNG], // his career at 31.7 – the rung §11 says he is on
      [0.88, MIDDLE_RUNG],
      [0.85, MIDDLE_RUNG],
      [0.849, GONE_RUNG],
      [0.6, GONE_RUNG],
    ]
    for (const [share, expected] of cases) {
      const shown = rungOnCard(AGE, { physicalShare: share })
      expect(shown, `share ${share} drew the wrong rung`).toBe(expected)
      for (const other of [PEAK_RUNG, MIDDLE_RUNG, GONE_RUNG]) {
        if (other === expected) continue
        expect(shown, `share ${share} also drew "${other.slice(0, 30)}…"`).not.toContain(other)
      }
    }
  })

  it('⚠ nothing fires at her peak – the card is exactly what round 30 shipped', () => {
    showOffer(AGE, { physicalShare: 1, ageYears: 30 })
    const w = mount(RetirementDialog)
    expect(w.find('.retire-rung').exists(), 'a decline sentence on a body at its peak').toBe(false)
    // ...and his round-30 lede is beneath none of it, to the byte. Invariant 4: it was ADDED TO,
    // never replaced.
    expect(said(w.get('.retire-lede').text())).toBe(
      'Twenty-nine is when the question starts being asked, not a countdown to anything. There is no wrong answer, and she can say no for as many winters as her body gives her.',
    )
    for (const line of ALL_DECLINE_LINES) expect(w.text()).not.toContain(line)
    w.unmount()
  })

  it('⚠ ...and a snapshot with no share at all is silent rather than inventing a decline', () => {
    // Every hand-built snapshot in the older suites is one of these. Silence is the safe failure:
    // the defect this item fixes is a MISSING readout, and one invented from `undefined` is worse.
    expect(rungOnCard(AGE, { physicalShare: undefined })).toBeNull()
  })

  it('the rung sits UNDER his lede and never inside it', () => {
    // The two are separate paragraphs on purpose – `tests/component/last-word.test.ts` pins the lede
    // literally, and a rung appended into that element would move a sentence he approved.
    showOffer(AGE, { physicalShare: 0.931 })
    const w = mount(RetirementDialog)
    expect(w.get('.retire-lede').text()).not.toContain(MIDDLE_RUNG)
    expect(said(w.get('.retire-rung').text())).toBe(MIDDLE_RUNG)
    w.unmount()
  })

  it('the other two readings draw no rung – the plateau is results, the last word is hers', () => {
    // §7.2: «a body-driven last word and a results-driven mid-career question are different things».
    // And a rung under her own final sentence would be the game talking over her.
    expect(
      rungOnCard(PLATEAU, {
        physicalShare: 0.7,
        ageYears: 26,
        activeLadder: 'wta',
        ladders: { domestic: { rank: 5, points: 300 }, itf: { rank: 84, points: 0 }, wta: { rank: 106, points: 420 } },
      }),
    ).toBeNull()
    expect(rungOnCard(FINAL, { physicalShare: 0.55, oneMoreYearCount: 4 })).toBeNull()
  })

  it('⚠ THE TRAP – the same card read twice, and on two careers, is the same sentence', () => {
    // The rung is picked by the BAND and not by a draw, so it cannot move between opens and cannot
    // differ between two careers standing at the same share. Anything that made this a pool would
    // fail here first.
    const first = rungOnCard(AGE, { physicalShare: 0.931 })
    const again = rungOnCard(AGE, { physicalShare: 0.931 })
    const elsewhere = rungOnCard(AGE, { physicalShare: 0.931, seed: 'a-different-career', week: 999 })
    expect(again).toBe(first)
    expect(elsewhere).toBe(first)
    expect(first).toBe(MIDDLE_RUNG)
  })
})

// =================================================================================================
// 2. (b) THE COACH, IN SEASON
// =================================================================================================
//
// ⚠ THE FIXTURE IS A REAL WALKED CAREER WITH THE SHARE OVERRIDDEN. `physicalShare` is a derived
// display field, so overriding it asks the screen the question these cases are about; the ENGINE's
// half of the same claim is section 0 above.
function feedAtShare(share: number, seed = 'r31f-coach'): Snapshot {
  const snap = walked(30, seed)
  expect(snap.upcoming.length, 'the fixture has no cards to read').toBeGreaterThan(1)
  return { ...snap, physicalShare: share }
}

/** Every plaque on screen, keyed by the card's own tier + dates so two mounts can be compared. */
function plaquesByCard(snap: Snapshot): Map<string, string> {
  const w = mountSeason(snap)
  const out = new Map<string, string>()
  for (const card of w.findAll('.event-card')) {
    const tier = card.find('.event-tier')
    const dates = card.find('.event-dates')
    const line = card.find('.event-coach-line')
    if (!tier.exists() || !dates.exists() || !line.exists()) continue
    out.set(`${said(tier.text())}|${said(dates.text())}`, said(line.text()))
  }
  w.unmount()
  return out
}

describe('round 31 #9 (b) – the coach starts advising which weeks to take', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('past her peak EVERY plaque carries an age line, and it is one of the approved four', () => {
    const plaques = [...plaquesByCard(feedAtShare(0.9)).values()]
    expect(plaques.length, 'no cards on screen').toBeGreaterThan(0)
    const approved = [...COACH_DECLINE_LINES, ...Object.values(COACH_WEEK_CHOICE)]
    for (const line of plaques) {
      const hits = approved.filter((a) => line.includes(a))
      expect(hits.length, `plaque carried ${hits.length} age lines: "${line}"`).toBe(1)
    }
  })

  it('⚠ nothing fires at her peak – the same feed at share 1 carries none of them', () => {
    // The SAME career, so this is a difference the share made and not a difference between fixtures.
    const atPeak = [...plaquesByCard(feedAtShare(1)).values()]
    const past = [...plaquesByCard(feedAtShare(0.9)).values()]
    expect(atPeak.length).toBe(past.length)
    for (const line of atPeak) {
      for (const approved of ALL_DECLINE_LINES) {
        expect(line, `"${approved.slice(0, 30)}…" on a card at her peak`).not.toContain(approved)
      }
    }
    expect(atPeak).not.toEqual(past)
  })

  it('⚠ THE TRAP – the same feed read twice is the same set of sentences', () => {
    // The literal form of the ask: open the screen, close it, open it again. It cannot change.
    const snap = feedAtShare(0.9)
    expect(plaquesByCard(snap)).toEqual(plaquesByCard(snap))
  })

  it('the coach\'s line is GATED by the share and does not band on it', () => {
    // Unlike the retirement card, which has three rungs, the coach has one register: past her peak
    // he says one of the four, and how far past does not change which. Two shares, one answer per
    // card – so a future wave that bands this has to do it deliberately rather than by accident.
    const near = plaquesByCard(feedAtShare(0.99))
    const far = plaquesByCard(feedAtShare(0.6))
    expect(near.size).toBeGreaterThan(0)
    expect(far, 'the coach re-voiced himself as she got older').toEqual(near)
  })

  it('the age line is placed with the FIELD and never after the draw', () => {
    // His placement for round 31 #4 was «имя и ранг соперницы … внизу возле этого круга»: the draw
    // stays at the foot of the plaque. The age line is advice about WHICH week to take, which is a
    // decision made before there is an opponent at all.
    for (const line of plaquesByCard(feedAtShare(0.9)).values()) {
      const approved = [...COACH_DECLINE_LINES, ...Object.values(COACH_WEEK_CHOICE)]
      const age = approved.find((a) => line.includes(a))!
      const drawAt = Math.max(line.indexOf('First round:'), line.indexOf('The draw'))
      if (drawAt >= 0) expect(line.indexOf(age), `age line after the draw: "${line}"`).toBeLessThan(drawAt)
    }
  })

  it('⚠⚠ THE TRAP – the same event, read three weeks later, says the same thing', () => {
    // ⚠ THE WORLD IS TICKED BETWEEN THE MOUNTS. Standings, fatigue and her own results all move; two
    // mounts of one snapshot would be comparing a thing with itself, which is the null-arm mistake
    // CLAUDE.md records. Put the week into `seed:coachage:<eventId>` and every overlapping card
    // below changes its sentence.
    const world = createWorld('r31f-coach-hold')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 30; i++) tickWeek(world, rng)
    const before = plaquesByCard({ ...toSnapshot(world), physicalShare: 0.9 })

    for (let i = 0; i < 3; i++) tickWeek(world, rng)
    const later = plaquesByCard({ ...toSnapshot(world), physicalShare: 0.9 })

    let overlap = 0
    for (const [card, line] of before) {
      const then = later.get(card)
      if (then === undefined) continue
      overlap++
      expect(then, `${card} changed its plaque in three weeks`).toBe(line)
    }
    expect(overlap, 'no card survived the three weeks – the comparison proved nothing').toBeGreaterThan(1)
  })

  it('⚠ the paired line is READ off the field and never rolled', () => {
    // «At this age you choose your weeks» has two halves and which one speaks is the field's answer,
    // not a coin. So a favourite field can never be told to skip the week and a strong one can never
    // be told to take it – at ANY event id, which is the only thing a draw could vary.
    expect(coachDeclinePool('favourite')).not.toContain(COACH_WEEK_CHOICE.strong)
    expect(coachDeclinePool('strong')).not.toContain(COACH_WEEK_CHOICE.favourite)
    // ...and an even field, which the engine has no opinion about, is offered neither half.
    expect(coachDeclinePool('even')).toEqual(COACH_DECLINE_LINES)

    let paired = 0
    for (let i = 0; i < 400; i++) {
      const onFavourite = coachDeclineLine(0.9, 'r31f-pair', `probe-${i}`, 'favourite')
      const onStrong = coachDeclineLine(0.9, 'r31f-pair', `probe-${i}`, 'strong')
      const onEven = coachDeclineLine(0.9, 'r31f-pair', `probe-${i}`, 'even')
      expect(onFavourite).not.toBe(COACH_WEEK_CHOICE.strong)
      expect(onStrong).not.toBe(COACH_WEEK_CHOICE.favourite)
      expect(COACH_DECLINE_LINES, `an even field was given advice: ${onEven}`).toContain(onEven)
      if (onFavourite === COACH_WEEK_CHOICE.favourite || onStrong === COACH_WEEK_CHOICE.strong) paired++
    }
    // ...and the pair is genuinely reachable, or the three assertions above are vacuous.
    expect(paired, 'the conditional line can never appear').toBeGreaterThan(0)
  })

  it('all four of the coach\'s wordings are reachable – the pool is spent, not decorative', () => {
    // The owner asked for all of them: «давай все использовать». A pool nothing ever lands on is a
    // pool that did not need to exist.
    //
    // ⚠ SWEPT OVER EVENT IDS AND FIELD STRENGTHS RATHER THAN OVER CAREERS, and that is a limit worth
    // naming: a walked fixture is a seventeen-year-old playing weak domestic fields, so «this is not
    // one of them» needs a STRONG draw and one may not turn up in six short walks. The screen's own
    // reachability is the case below; this is the pool's.
    const seen = new Set<string>()
    for (const strength of ['favourite', 'even', 'strong'] as const) {
      for (let i = 0; i < 200; i++) {
        const line = coachDeclineLine(0.9, 'r31f-reach', `event-${i}`, strength)
        if (line) seen.add(line)
      }
    }
    const approved = [...COACH_DECLINE_LINES, ...Object.values(COACH_WEEK_CHOICE)]
    expect([...seen].sort(), 'a wording the parent can never be shown').toEqual([...approved].sort())
  })

  it('...and a real feed does not say one thing on every card', () => {
    // The variety claim through the SCREEN. One wording repeated down a season's feed is exactly the
    // wallpaper `DRAW_CLAUSES` warns about in SeasonScreen.vue, and it is what the owner noticed
    // about the field lines in the first place («is there any variety at all»).
    const seen = new Set<string>()
    const approved = [...COACH_DECLINE_LINES, ...Object.values(COACH_WEEK_CHOICE)]
    for (const seed of ['r31f-a', 'r31f-b', 'r31f-c', 'r31f-d']) {
      for (const line of plaquesByCard(feedAtShare(0.9, seed)).values()) {
        for (const a of approved) if (line.includes(a)) seen.add(a)
      }
    }
    expect(seen.size, 'every card in every feed said the same thing').toBeGreaterThan(1)
  })
})

// =================================================================================================
// 3. (c) HER OWN LINE, AT THE END OF A SEASON
// =================================================================================================
function wrapSnapshot(share: number, seed = 'r31f-wrap', year = 2062): Snapshot {
  const summary: SeasonSummary = {
    seasonYear: year,
    endRank: 88,
    startRank: 74,
    points: 640,
    wins: 24,
    losses: 14,
    bestResultText: 'Semifinalist',
    fundsDeltaCents: 41_200_00,
    spentCents: 180_000_00,
    earnedCents: 221_200_00,
    weeksInjured: 2,
    academyCoveredCents: 0,
    rankTrack: 'wta',
    rankInTrack: 88,
  }
  return { ...walked(60, seed), physicalShare: share, lastSeasonSummary: summary }
}

function wrapCard(snap: Snapshot): { text: string; hers: string | null; unmount: () => void } {
  useGameStore().snapshot = snap
  const w = mount(SeasonSummaryDialog, { global: { stubs: { teleport: true } } })
  const line = w.find('.season-her-line')
  return { text: w.text(), hers: line.exists() ? said(line.text()) : null, unmount: () => w.unmount() }
}

describe('round 31 #9 (c) – she says something of her own at the wrap', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('past her peak the wrap carries exactly one of her three', () => {
    for (const share of [0.99, 0.931, 0.6]) {
      const card = wrapCard(wrapSnapshot(share))
      expect(card.hers, `share ${share} drew nothing`).not.toBeNull()
      expect(HER_DECLINE_LINES, `share ${share} drew a sentence nobody approved`).toContain(card.hers)
      const hits = HER_DECLINE_LINES.filter((l) => card.text.includes(l))
      expect(hits.length, `share ${share} put ${hits.length} of her lines on one card`).toBe(1)
      card.unmount()
    }
  })

  it('⚠ nothing fires at her peak, and the parent\'s own scrap is untouched either way', () => {
    const peak = wrapCard(wrapSnapshot(1))
    expect(peak.hers, 'she spoke about a decline that has not started').toBeNull()
    for (const line of ALL_DECLINE_LINES) expect(peak.text).not.toContain(line)
    // The closing scrap is the PARENT's note and belongs to neither state.
    expect(peak.text).toContain('Off-season now:')
    peak.unmount()

    const past = wrapCard(wrapSnapshot(0.9))
    expect(past.text).toContain('Off-season now:')
    past.unmount()
  })

  it('⚠ ...and a snapshot with no share is silent', () => {
    const card = wrapCard({ ...wrapSnapshot(0.9), physicalShare: undefined as unknown as number })
    expect(card.hers).toBeNull()
    card.unmount()
  })

  it('⚠⚠ THE TRAP – the same season read at two different weeks is the same sentence', () => {
    // The wrap card OUTLIVES the advance that follows it: `lastSeasonSummary` persists while the
    // week moves on. A week in `seed:decline:<seasonYear>` would change her sentence under the
    // parent while he was still reading it, and this is the case that catches it.
    const base = wrapSnapshot(0.931)
    const first = wrapCard(base)
    const before = first.hers
    first.unmount()

    const later = wrapCard({ ...base, week: base.week + 7 })
    expect(later.hers, 'her line moved when the week did').toBe(before)
    later.unmount()

    const again = wrapCard(base)
    expect(again.hers, 'her line moved between two opens of the same card').toBe(before)
    again.unmount()
  })

  it('...and it IS a draw – two different seasons do not all say one thing', () => {
    // The other half of determinism: a key that ignored the season would pin every winter of her
    // career to one sentence, which is the same wallpaper defect from the other direction.
    const seen = new Set<string>()
    for (let year = 2055; year < 2075; year++) {
      const card = wrapCard(wrapSnapshot(0.9, 'r31f-wrap', year))
      if (card.hers) seen.add(card.hers)
      card.unmount()
    }
    expect(seen.size, 'every season drew the same line').toBeGreaterThan(1)
    expect([...seen].sort(), 'a line of hers the parent can never be shown').toEqual([...HER_DECLINE_LINES].sort())
  })
})

// =================================================================================================
// 4. THE HOUSE LAW AND INVARIANT 4
// =================================================================================================
//
// ⚠⚠ THESE NINE STRINGS ARE THE OWNER'S, APPROVED VERBATIM ON 31.08, AND THE BYTES ARE THE
// ASSERTION. `tests/template-copy-rules.test.ts` scans `<template>` blocks and cannot see any of
// them – they are written in a `.ts` module and interpolated, which is the same hole
// `last-word.test.ts` was opened to cover. If a future wave genuinely re-words one of these, this
// arm is supposed to go red and be re-aimed deliberately, with his sign-off, rather than quietly.
describe('round 31 #9 – the nine sentences are his', () => {
  const CYRILLIC = /[Ѐ-ӿ]/
  const LONG_DASH = /[—―]/

  it('no Cyrillic and no long dash in any of the nine', () => {
    // ⚠ NINE LINES, TEN STRINGS. His nine are three rungs, two pooled coach lines, ONE conditional
    // line, and her three – and the conditional one has two endings, which is what makes it
    // conditional. The count is pinned so a tenth idea cannot be smuggled in as an eleventh string.
    expect(ALL_DECLINE_LINES).toHaveLength(10)
    expect(DECLINE_RUNGS.length + COACH_DECLINE_LINES.length + 1 + HER_DECLINE_LINES.length).toBe(9)
    for (const line of ALL_DECLINE_LINES) {
      expect(CYRILLIC.test(line), `Cyrillic in a rendered line – ${line}`).toBe(false)
      expect(LONG_DASH.test(line), `a long dash in a rendered line – ${line}`).toBe(false)
    }
  })

  it('the nine are what he approved, to the byte', () => {
    expect(DECLINE_RUNGS.map((r) => r.line)).toEqual([
      'She is not slower than last year by much – a step, maybe two, over a long match. It is the third set where the year shows.',
      'Nothing has fallen off a cliff. It is just that the season costs her more than it used to, and pays the same.',
      'Her best tennis was three years ago. She knows the number as well as you do, and she has not brought it up once.',
    ])
    expect(COACH_DECLINE_LINES).toEqual([
      'Her legs are a year older than this draw thinks.',
      'She will want the first set. The third one is not hers the way it was.',
    ])
    expect(COACH_WEEK_CHOICE).toEqual({
      favourite: 'At this age you choose your weeks. This is one to choose.',
      strong: 'At this age you choose your weeks. This is not one of them.',
    })
    expect(HER_DECLINE_LINES).toEqual([
      '«I can still play. I just cannot play three of them back to back any more.»',
      '«Ask me again next winter. You will get the same answer, and one year it will not be true.»',
      '«I am not finished. I am just not twenty-six.»',
    ])
  })

  it('the bands are total – every share from 0 to 1 gets exactly one answer', () => {
    for (let s = 0; s < 1; s += 0.001) {
      const line = declineRung(s)
      expect(line, `share ${s} fell through the bands`).not.toBeNull()
      expect(DECLINE_RUNGS.map((r) => r.line)).toContain(line)
    }
    expect(declineRung(1), 'at the peak there is nothing to say').toBeNull()
    expect(declineRung(undefined)).toBeNull()
    expect(declineRung(Number.NaN), 'NaN read as a decline').toBeNull()
  })
})

// =================================================================================================
// 5. AND IT ALL STILL FITS A PHONE
// =================================================================================================
//
// CLAUDE.md's standing gotcha: «any dialog you add or lengthen gets a mounted assertion that its
// dismiss control's box is inside a 375x667 viewport». Two dialogs grew by one sentence here.
describe('round 31 #9 – the two dialogs that grew still fit', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the retirement card, with the longest rung on it', () => {
    setViewport(PHONE)
    // The third rung is the longest of the three, so this is the card at its tallest.
    showOffer(AGE, { physicalShare: 0.6 })
    const w = mount(RetirementDialog, { attachTo: document.body })
    expect(said(w.get('.retire-rung').text())).toBe(GONE_RUNG)
    assertDismissReachable(w.get('.retire-card').element, w.get('.retire-answers').element, PHONE, 'RetirementDialog (rung)')
    w.unmount()
  })

  it('the season wrap, with her line on it', () => {
    setViewport(PHONE)
    useGameStore().snapshot = wrapSnapshot(0.9)
    const w = mount(SeasonSummaryDialog, { global: { stubs: { teleport: true } }, attachTo: document.body })
    expect(w.find('.season-her-line').exists()).toBe(true)
    assertDismissReachable(w.get('.season-summary').element, w.get('.dialog-actions').element, PHONE, 'SeasonSummaryDialog (her line)')
    w.unmount()
  })
})
