// epic/redesign-home, slice A – the Home restructure (the owner's redesign, 28.07.2026).
//
// Three kinds of test, deliberately in that order:
//
//  1. REAL UNIT TESTS on the pure things this slice added – the date-line formatter, the greeting
//     selector and the per-week finance fold. Each of them is a decision, so each of them is
//     pinned by behaviour, not by the string that happens to render it.
//  2. ART CONTRACTS – the coach portraits: every URL the app can build resolves to a file that
//     ships, and the twelve masters nothing can request are NOT preloaded.
//  3. FILE-READING STRUCTURE PINS – the house discipline (round10/11/12/13-view): facts about
//     templates, which are exactly the facts that rot silently. They pin the DECISIONS of this
//     slice (the caption appears once, the cards that are doors are doors, the venue slot never
//     renders an empty frame), not the styling.
import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { weekDateLine, weekLabel, weekRange, weekSpan } from '../src/shared/dates'
import { GREETINGS, conditionBandOf, greetingFor, type Greeting } from '../src/engine/diary'
import { createWorld, financeSeries, tickWeek, toSnapshot } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { COACH_BY_BACKGROUND, coachUrlFor, preloadCoachArt, resetPreloadCache, warmedCount } from '../src/art/preload'
import { FIELD_ART, fieldUrl, venueArtStem, venueCandidates } from '../src/art/venues'
import type { TierId } from '../src/engine/season/types'
import type { Surface } from '../src/engine/match/types'
import type { DiaryFacts, FamilyBackground, FinanceWeek } from '../src/shared/protocol'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')
const ROOT = fileURLToPath(new URL('../', import.meta.url))

const home = read('../src/components/screens/HomeScreen.vue')
const app = read('../src/App.vue')
const css = read('../src/style.css')

// ===========================================================================
// 1a. The date line: "W27 2033 · Jun 3 – Jun 9"
// ===========================================================================
describe('weekDateLine – the header date line, in one place', () => {
  it('is OUR week label plus the year in FULL plus the week days', () => {
    // Week 0 is the fixed epoch: Monday, Jan 6, 2031.
    expect(weekDateLine(0)).toBe('W1 2031 · Jan 6 – Jan 12')
    expect(weekLabel(0)).toBe("W1 '31") // the short form is unchanged and still says the same week
  })

  it('names the same week the short label does, in every season – the two cannot drift', () => {
    for (const week of [0, 1, 26, 51, 52, 103, 208, 260, 400]) {
      const long = weekDateLine(week)
      const short = weekLabel(week) // "W14 '31"
      const [, n, yy] = short.match(/^W(\d+) '(\d+)$/)!
      expect(long.startsWith(`W${n} `), `${long} vs ${short}`).toBe(true)
      // ...and the full year ends in the two digits the short form prints. This is the pin that
      // matters: `weekLabel` deliberately uses the SEASON year, not the calendar year the dates
      // come from, and season 5 is where the two diverge (weekYear(208) === weekYear(260)).
      const fullYear = long.match(/^W\d+ (\d{4}) /)![1]
      expect(fullYear.slice(-2), `${long} vs ${short}`).toBe(yy)
    }
  })

  it('the span names BOTH months every time – a header row that does not change shape mid-month', () => {
    expect(weekSpan(0)).toBe('Jan 6 – Jan 12') // same month, still both named
    expect(weekSpan(3)).toBe('Jan 27 – Feb 2') // crosses a month
    expect(weekSpan(51)).toBe('Dec 29 – Jan 4') // crosses a year
  })

  it('carries no year of its own – the line already spells it once', () => {
    // The stutter this exists to avoid: "W27 2033 · Jun 3–9, 2033".
    expect(weekSpan(0)).not.toContain('2031')
    expect(weekDateLine(0).match(/2031/g)).toHaveLength(1)
    // ...and weekRange, which is used where nothing else dates the week, still carries its year.
    expect(weekRange(0)).toContain('2031')
  })

  it('is total – the negative weeks entry deadlines reach do not throw', () => {
    expect(() => weekDateLine(-3)).not.toThrow()
    expect(weekDateLine(-3)).toMatch(/^W\d+ \d{4} · /)
  })

  it('the shape is spelled in shared/dates.ts and nowhere else', () => {
    // Home renders the computed, never a hand-rolled concatenation.
    expect(home).toContain('weekDateLine(week.value)')
    expect(home).not.toMatch(/`W\$\{/)
  })
})

// ===========================================================================
// 1b. The greeting
// ===========================================================================
/** A coherent-enough facts object for the greeting, which reads exactly two fields of it. */
function facts(over: Partial<DiaryFacts> = {}): DiaryFacts {
  return {
    week: 10,
    emotion: 'norm',
    resultFresh: false,
    won: false,
    lostFinal: false,
    titleThisWeek: false,
    resultTier: null,
    rankClimbed: false,
    runPointsThisWeek: 0,
    lossStreak: 0,
    condition: 80,
    conditionBand: conditionBandOf(80),
    injured: null,
    travelled: false,
    playedTournament: false,
    playedPractice: false,
    examsWeek: false,
    offSeasonWeek: false,
    vacationWeek: false,
    fundsPressure: 'ok',
    freshMilestone: null,
    ...over,
  }
}

describe("greetingFor – the owner's rule first, then variety", () => {
  it('a tournament that resolved this week makes it evening, whatever the seed', () => {
    for (const seed of ['a', 'b', 'seed-3', 'zzz']) {
      expect(greetingFor(facts({ playedTournament: true }), null, seed)).toBe('Good evening')
    }
  })

  it('week 0 – a career that has not played a week – is morning, whatever the seed', () => {
    for (const seed of ['a', 'b', 'seed-3', 'zzz']) {
      expect(greetingFor(facts({ week: 0 }), null, seed)).toBe('Good morning')
    }
  })

  it('the fact arms outrank the caption: a tournament week is evening even under an evening caption', () => {
    expect(
      greetingFor(facts({ playedTournament: true }), 'Warm evenings – dinner ran long.', 's'),
    ).toBe('Good evening')
  })

  it('every other week picks one of the four, and only those', () => {
    const seen = new Set<Greeting>()
    for (let week = 1; week < 200; week++) seen.add(greetingFor(facts({ week }), null, 'seed'))
    expect([...seen].every((g) => (GREETINGS as readonly string[]).includes(g))).toBe(true)
    // ...and it genuinely VARIES – a constant would pass the line above.
    expect(seen.size).toBeGreaterThan(1)
  })

  it('is stable for the whole week – no flicker across re-renders or a reload', () => {
    for (let week = 1; week < 30; week++) {
      const first = greetingFor(facts({ week }), null, 'seed')
      for (let again = 0; again < 5; again++) {
        expect(greetingFor(facts({ week }), null, 'seed')).toBe(first)
      }
    }
  })

  it('is seeded per career – two careers do not open on the same word every week', () => {
    const a: string[] = []
    const b: string[] = []
    for (let week = 1; week < 40; week++) {
      a.push(greetingFor(facts({ week }), null, 'career-a'))
      b.push(greetingFor(facts({ week }), null, 'career-b'))
    }
    expect(a).not.toEqual(b)
  })

  it('NEVER repeats a word the hero caption already used – the page says it once', () => {
    const captions: [string, Greeting][] = [
      ['Asleep before nine, two nights running.', 'Good night'],
      ['Slow mornings. Heavy bag.', 'Good morning'],
      ['Warm evenings – dinner ran long on the balcony.', 'Good evening'],
    ]
    for (const [caption, forbidden] of captions) {
      for (let week = 1; week < 300; week++) {
        expect(greetingFor(facts({ week }), caption, 'seed'), caption).not.toBe(forbidden)
      }
    }
  })

  it('is total – a caption using all four words falls back rather than picking nothing', () => {
    const g = greetingFor(facts(), 'morning afternoon evening night', 'seed')
    expect((GREETINGS as readonly string[]).includes(g)).toBe(true)
  })

  it('rides the snapshot, so the screen renders a string it did not choose', () => {
    const world = createWorld('greet-seed')
    const rng = rngFromSeed(world.seed)
    tickWeek(world, rng)
    tickWeek(world, rng)
    const snap = toSnapshot(world)
    expect((GREETINGS as readonly string[]).includes(snap.diary.greeting)).toBe(true)
    // ...and it is not a second copy of the caption.
    expect(snap.diary.greeting).not.toBe(snap.diary.photoLine)
    expect(home).toContain('game.snapshot?.diary.greeting')
  })
})

// ===========================================================================
// 1c. The 12-week budget series
// ===========================================================================
describe('financeSeries – the shape a fold cannot give back', () => {
  const ledger: FinanceWeek[] = [
    { week: 2, byCategory: { travel: -50_00, sponsor: 400_00 } },
    { week: 5, byCategory: { coaching: -300_00 } },
  ]

  it('is DENSE: a week the ledger never heard of still gets a point', () => {
    const series = financeSeries(ledger, 0, 6)
    expect(series.map((p) => p.week)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(series[0]).toEqual({ week: 0, incomeCents: 0, expenseCents: 0, balanceCents: -50_00 })
  })

  it('splits a week into money IN and money OUT, both as magnitudes', () => {
    const week2 = financeSeries(ledger, 0, 6).find((p) => p.week === 2)!
    expect(week2).toEqual({ week: 2, incomeCents: 400_00, expenseCents: 50_00, balanceCents: 300_00 })
    const week5 = financeSeries(ledger, 0, 6).find((p) => p.week === 5)!
    expect(week5).toEqual({ week: 5, incomeCents: 0, expenseCents: 300_00, balanceCents: 0 })
  })

  it('an empty span is an empty series, not a throw', () => {
    expect(financeSeries([], 3, 2)).toEqual([])
    expect(financeSeries([], 0, 0)).toEqual([{ week: 0, incomeCents: 0, expenseCents: 0, balanceCents: 0 }])
  })

  // A2: the running balance is the thing the sparkline plots, so it gets its own pins.
  it('the running balance ENDS on the funds it was anchored with, and walks back by each net', () => {
    const series = financeSeries(ledger, 0, 6, 10_000_00)
    expect(series[series.length - 1].balanceCents).toBe(10_000_00)
    // Nothing moved after week 5, so weeks 5 and 6 close on the same number...
    expect(series[5].balanceCents).toBe(10_000_00)
    // ...week 4 closes BEFORE week 5's -$300 was taken...
    expect(series[4].balanceCents).toBe(10_300_00)
    // ...and week 1 is before week 2's +$400/-$50 net of +$350.
    expect(series[1].balanceCents).toBe(9_950_00)
    expect(series[0].balanceCents).toBe(9_950_00)
  })

  it('a family under water charts under water – the balance is signed, never clamped', () => {
    const series = financeSeries(ledger, 0, 6, -1_200_00)
    expect(series.every((p) => p.balanceCents < 0)).toBe(true)
  })

  it('the snapshot carries exactly the same 12 weeks the wallet folds, and agrees with the fold', () => {
    const world = createWorld('finance-seed')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 20; i++) tickWeek(world, rng)
    const snap = toSnapshot(world)
    const series = snap.finance.weekly12
    expect(series).toHaveLength(12)
    expect(series[series.length - 1].week).toBe(snap.week)
    expect(series[0].week).toBe(snap.week - 11)
    // The card and the wallet read ONE ledger: summing the series must reproduce the fold.
    const inSum = series.reduce((s, p) => s + p.incomeCents, 0)
    const outSum = series.reduce((s, p) => s + p.expenseCents, 0)
    expect(inSum).toBe(snap.finance.window12w.incomeCents)
    expect(outSum).toBe(snap.finance.window12w.expenseCents)
    // A2: and the line's last point IS the total printed above it, by construction.
    expect(series[series.length - 1].balanceCents).toBe(snap.fundsCents)
  })

  it('a young career charts the weeks it has lived, never eleven empty bars before week 0', () => {
    const world = createWorld('young-seed')
    const rng = rngFromSeed(world.seed)
    tickWeek(world, rng)
    tickWeek(world, rng)
    const snap = toSnapshot(world)
    expect(snap.finance.weekly12.every((p) => p.week >= 0)).toBe(true)
    expect(snap.finance.weekly12).toHaveLength(snap.week + 1)
  })
})

// ===========================================================================
// 2. The coach art
// ===========================================================================
describe('the coach portraits', () => {
  const BACKGROUNDS: FamilyBackground[] = ['working', 'middle', 'wealthy']

  it("maps each family background to the owner's default coach", () => {
    expect(COACH_BY_BACKGROUND).toEqual({ working: 'budget-1', middle: 'middle-1', wealthy: 'elit-1' })
  })

  it('every URL the app can build resolves to a file that actually ships', () => {
    for (const background of BACKGROUNDS) {
      const url = coachUrlFor(background)
      const path = `${ROOT}public/${url.slice(import.meta.env.BASE_URL.length)}`
      expect(existsSync(path), `missing coach portrait ${path}`).toBe(true)
    }
  })

  it('the whole set is webp under public/images/coaches – no master was left behind in public/', () => {
    // The pipeline (scripts/optimize-art.mjs) encodes the masters and EVACUATES them to art-src/.
    // A raw jpg left here would be copied into dist/ verbatim for every player to download.
    const files = readdirSync(`${ROOT}public/images/coaches/`).filter((n) => !n.startsWith('.'))
    expect(files.filter((n) => !n.endsWith('.webp'))).toEqual([])
    expect(files.length).toBe(16)
    expect(existsSync(`${ROOT}public/images/coaches-jpeg`)).toBe(false)
  })

  it('warms exactly ONE file – the 13 the coach-choice slice will need are not preloaded', () => {
    // They ship (they are outside the service-worker precache, so they cost no player any bytes –
    // see the NOT_SHIPPED note in src/art/preload.ts) but nothing may FETCH art it cannot show.
    resetPreloadCache()
    preloadCoachArt('middle')
    expect(warmedCount()).toBe(1)
    preloadCoachArt('middle')
    expect(warmedCount()).toBe(1) // idempotent, like every other preload
  })

  it('the per-band portrait budget is untouched – the coach warms on its own trigger', () => {
    const preloader = read('../src/art/autoPreload.ts')
    expect(preloader).toContain('preloadCoachArt')
    expect(preloader).toContain('game.snapshot?.profile.background')
  })
})

// ===========================================================================
// 2b. The venue art
// ===========================================================================
describe('the venue paintings', () => {
  const TIERS: TierId[] = ['local', 'regional', 'national', 'j30', 'j60', 'j300']
  const SURFACES: Surface[] = ['hard', 'clay', 'grass']

  it('the stem list and the files on disk agree in BOTH directions', () => {
    // A stem with no file is a 404 on a card; a file with no stem is art nothing can ever show.
    const onDisk = readdirSync(`${ROOT}public/images/fields/`)
      .filter((n) => !n.startsWith('.'))
      .map((n) => n.replace(/\.webp$/, ''))
    expect([...onDisk].sort()).toEqual([...FIELD_ART].sort())
    expect(readdirSync(`${ROOT}public/images/fields/`).filter((n) => !n.endsWith('.webp'))).toEqual([])
    expect(existsSync(`${ROOT}public/images/fields-jpeg`)).toBe(false) // masters evacuated
  })

  it('every (tier, surface) the calendar can produce resolves to a file that ships', () => {
    for (const tier of TIERS) {
      for (const surface of SURFACES) {
        const stem = venueArtStem(tier, surface, `2031-w14-${tier}`, 'seed')
        const path = `${ROOT}public/${fieldUrl(stem).slice(import.meta.env.BASE_URL.length)}`
        expect(existsSync(path), `${tier}/${surface} -> missing ${path}`).toBe(true)
      }
    }
  })

  it('prefers the exact tier AND surface whenever the art exists', () => {
    expect(venueCandidates('local', 'clay')).toEqual(['local-clay-1'])
    expect(venueCandidates('regional', 'hard')).toEqual(['regional-hard-1', 'regional-hard-2', 'regional-hard-3'])
    expect(venueCandidates('national', 'grass')).toEqual(['national-grass-1'])
  })

  it('NEVER promises a surface the engine will not play on', () => {
    // The card names the surface right under the picture. This is the rule that outranks "nearest
    // tier": regional has no grass court, so a regional grass week borrows the LOCAL grass one
    // rather than being painted on regional clay.
    for (const tier of TIERS) {
      for (const surface of SURFACES) {
        for (const stem of venueCandidates(tier, surface)) {
          const other = SURFACES.filter((s) => s !== surface)
          for (const wrong of other) {
            expect(stem, `${tier}/${surface} may not show a ${wrong} court`).not.toContain(`-${wrong}-`)
          }
        }
      }
    }
    expect(venueCandidates('regional', 'grass')).toEqual(['local-grass-1'])
  })

  it('j60 and j300 borrow the j30 set until their own art exists', () => {
    for (const surface of SURFACES) {
      expect(venueCandidates('j60', surface)).toEqual(venueCandidates('j30', surface))
      expect(venueCandidates('j300', surface)).toEqual(venueCandidates('j30', surface))
    }
  })

  it('the establishing shots are surface-neutral by construction', () => {
    // `-venue-` frames have no playable court in frame, which is what licenses them as a fallback.
    const neutral = FIELD_ART.filter((s) => s.includes('-venue-'))
    expect(neutral).toEqual(['national-venue-1', 'national-venue-2', 'j30-venue-1'])
  })

  it('the second j30 wave widened the pools it was meant to widen, and nothing else', () => {
    // The owner de-branded and returned all four j30 frames (28.07). So j30 gains two more clay
    // courts, a second hard and its own establishing shot – and j30 grass, which nothing new
    // touched, must NOT have moved.
    expect(venueCandidates('j30', 'clay')).toEqual(['j30-clay-1', 'j30-clay-2', 'j30-clay-3'])
    expect(venueCandidates('j30', 'hard')).toEqual(['j30-hard-1', 'j30-hard-2'])
    expect(venueCandidates('j30', 'grass')).toEqual(['j30-grass-1'])
  })

  it("a tournament's photograph is the same one forever, and differs between tournaments", () => {
    const first = venueArtStem('regional', 'hard', '2031-w14-regional', 'seed-x')
    for (let i = 0; i < 10; i++) {
      expect(venueArtStem('regional', 'hard', '2031-w14-regional', 'seed-x')).toBe(first)
    }
    // ...and the pool is actually used: over many event ids, more than one painting shows.
    const seen = new Set<string>()
    for (let w = 1; w < 60; w++) seen.add(venueArtStem('regional', 'hard', `2031-w${w}-regional`, 'seed-x'))
    expect(seen.size).toBeGreaterThan(1)
  })

  it('draws on its own sub-stream – no MAIN-stream key, no capture can move', () => {
    expect(read('../src/art/venues.ts')).toContain('`${seed}:venue:${eventId}`')
  })
})

// ===========================================================================
// 3. The page itself
// ===========================================================================
describe('the diary page: the structure the redesign decided', () => {
  it('the hero caption appears EXACTLY ONCE on the page', () => {
    // The one rule the redesign is most careful about. The greeting is a time of day and the
    // caption is her week; a page that renders `photoLine` twice has said it twice.
    expect(home.match(/\{\{ photoLine \}\}/g) ?? []).toHaveLength(1)
  })

  it('the header, the greeting and her name are laid ON the photograph, as the export draws them', () => {
    // The hero is not a card: it is the top of the page, and everything sits on it.
    const hero = home.slice(home.indexOf('class="diary-hero"'), home.indexOf('class="diary-body"'))
    for (const part of ['diary-date', 'diary-greeting', 'diary-name', 'diary-age', 'diary-rank', 'diary-caption']) {
      expect(hero, `the hero must carry ${part}`).toContain(part)
    }
    // Two tools, the export's two: the bell and the gear. Inline SVG at the export's own 22px /
    // 1.7 stroke – no icon FILE, so nothing can 404 and nothing needs a mask.
    expect(home.match(/class="diary-tool"/g) ?? []).toHaveLength(2)
    expect(home).toContain('stroke-width="1.7"')
    expect(existsSync(new URL('../public/icons/bell.svg', import.meta.url))).toBe(false)
    // ...and the gear goes to the tab that already owns settings, rather than inventing a screen.
    expect(home).toContain(`emit('navigate', 'more')`)
  })

  it('her FIRST name is the headline – the export puts it at 42px, alone', () => {
    expect(home).toContain('game.snapshot?.profile.kidName')
    const rule = css.slice(css.indexOf('.diary-name {'), css.indexOf('}', css.indexOf('.diary-name {')))
    expect(rule).toContain('font-size: 42px')
    expect(rule).toContain('font-weight: 800')
  })

  it('the cards that are DOORS ask the shell to move; nothing else navigates', () => {
    expect(home).toContain(`emit('navigate', 'week')`) // next tournament -> This week
    expect(home).toContain(`emit('navigate', 'money')`) // family budget -> the wallet
    expect(app).toContain('@navigate="tab = $event"')
    // A screen may never write the shell's tab itself.
    expect(home).not.toContain('tab.value')
  })

  it('every card renders something when its data is missing – no card is ever an empty frame', () => {
    // Each of the four has a v-else. The venue art lives INSIDE the v-if: no entered event means no
    // picture at all, never an empty picture frame.
    expect(home).toContain('class="note-empty"')
    expect(home.match(/class="note-empty"/g)!.length).toBeGreaterThanOrEqual(3)
    expect(home).toContain('v-if="nearestEntered"')
    const card = home.slice(home.indexOf('Next tournament'), home.indexOf('Family budget'))
    expect(card.indexOf('v-if="nearestEntered"')).toBeLessThan(card.indexOf('venue-art'))
  })

  it('the venue painting is picked by the engine-seeded rule, never by the component', () => {
    expect(home).toContain('venueArtUrl(e.tier, e.surface, e.id, s.seed)')
    // The export's signature: art bleeding off the card corner under a diagonal dissolve.
    const rule = css.slice(css.indexOf('.venue-art {'), css.indexOf('}', css.indexOf('.venue-art {')))
    expect(rule).toContain('mask-image')
    expect(rule).toContain('border-radius: 56px 56px 14px 14px')
  })

  it('the budget card charts the engine series and never re-derives money of its own', () => {
    expect(home).toContain('game.snapshot?.finance.weekly12')
    expect(home).not.toContain('financialEvents')
    expect(home).toContain('class="budget-chart"')
  })

  it('the coach card is the export: his portrait down the left edge, his read beside it', () => {
    // ⚠ REVERSED by the owner (A2d, 28.07). Slice A had cut the coach's line and slice A2 had put
    // the coaching SPEND in its place; he asked for the pool back – "coach notes и слова тренера
    // (у нас уже это было реализовано)" – and for the numbers to go. So the pool is the SAME one
    // that predates the redesign, restored verbatim, and the card carries no figure at all.
    expect(home).toContain('coachUrlFor')
    expect(home).toContain('COACH_QUOTES')
    const template = home.slice(home.indexOf('<template>'))
    expect(template).toContain('Coach note')
    expect(template).toContain('{{ coachQuote }}')
    // No money, no week counts – the card is about a person. (Scoped to the coach card: the BUDGET
    // card legitimately says "Last 12 weeks" over its chart.)
    const card = template.slice(template.indexOf('coach-card'), template.indexOf('Recent memory'))
    expect(card).not.toContain('coachSpend')
    expect(card).not.toContain('Last 12 weeks')
    expect(card).not.toMatch(/\$/)
  })

  it('the coach pool is the pre-redesign one, unedited, and rotates on the 4-week block', () => {
    // Five lines per play style, and the rotation is deterministic and SLOW (a coach's read on her
    // settles for a month rather than flipping every week).
    expect(home).toContain('Math.floor(week.value / 4) % 5')
    const pool = home.slice(home.indexOf('const COACH_QUOTES'), home.indexOf('const coachQuote'))
    for (const style of ['aggressive:', 'counterpuncher:', "'serve-first':", "'all-court':"]) {
      expect(pool, `missing pool for ${style}`).toContain(style)
    }
    expect((pool.match(/^\s{4}'/gm) ?? []).length).toBe(20) // 4 styles x 5 lines
  })

  it('the Memory card keeps the painting from the band she was in THEN', () => {
    expect(home).toContain('diary.memory')
    expect(home).toContain('portraitArtUrl(memory.value.stage, memory.value.emotion)')
  })

  it('the screen derives no decision of its own – the engine owns them all', () => {
    expect(home).toContain('useKidEmotion') // not avatarEmotion(
    expect(home).toContain('diary.photoLine')
    expect(home).toContain('diary.conditionNote')
    expect(home).toContain('useTierStates')
  })
})

describe('the style foundation later slices reuse', () => {
  it('the warm neutrals and the diary layer are real tokens, not per-component colours', () => {
    for (const token of [
      '--card-top:',
      '--card-bottom:',
      '--card-edge:',
      '--ink:',
      '--ink-2:',
      '--ink-soft:',
      '--ink-dim:',
      '--money-in:',
      '--money-out:',
      '--amber:',
      '--orange:',
      '--polaroid-paper:',
      '--nav-bg:',
      '--tilt-1:',
      '--radius-card:',
      '--shadow-card:',
    ]) {
      expect(css, `missing token ${token}`).toContain(token)
    }
  })

  it('the notecard and the "pick it up" affordance are one shared rule', () => {
    expect(css).toContain('.note-card {')
    expect(css).toContain('button.note-card:hover:not(:disabled)')
    // The card is a GRADIENT with a translucent hairline – the export's idiom, and most of why its
    // cards read as objects rather than as filled rectangles.
    const rule = css.slice(css.indexOf('.note-card {'), css.indexOf('}', css.indexOf('.note-card {')))
    expect(rule).toContain('linear-gradient(180deg, var(--card-top) 0%, var(--card-bottom) 100%)')
    expect(rule).toContain('border: 1px solid var(--card-edge)')
    expect(css).toContain('prefers-reduced-motion')
  })

  it('the polaroid is real paper – the one light surface in the app – and it is tilted', () => {
    const rule = css.slice(css.indexOf('.memory-polaroid {'), css.indexOf('}', css.indexOf('.memory-polaroid {')))
    expect(rule).toContain('background: var(--polaroid-paper)')
    expect(rule).toContain('transform: rotate(var(--tilt-4))') // a FIXED angle, not a per-render roll
    // cream, i.e. genuinely light: the export's #f3f0e8.
    expect(css).toContain('--polaroid-paper: #f3f0e8')
  })

  it('the surface tokens ARE the design export, and the dead Home furniture went with them', () => {
    const root = css.slice(css.indexOf(':root {'), css.indexOf('\n}', css.indexOf(':root {')))
    // DECLARATIONS only – the comment above them deliberately quotes the old values.
    const declared = (name: string) => root.match(new RegExp(`\\n\\s*${name}: ([^;]+);`))?.[1]
    expect(declared('--bg')).toBe('#0a0e13')
    expect(declared('--panel')).toBe('#0f1720')
    expect(declared('--text')).toBe('#f2f6f8')
    expect(declared('--muted')).toBe('#8e9ba4')
    expect(declared('--accent')).toBe('#cfe152')
    expect(declared('--danger')).toBe('#ef4b3a')
    // The old Home's rules have no consumers left and must not linger as dead weight.
    for (const dead of ['.photo-card {', '.photo-line {', '.coach-quote {', '.player-card th {', '.rank-help-btn {']) {
      expect(css, `dead rule still in the sheet: ${dead}`).not.toContain(dead)
    }
  })

  it('the offline-first rule holds: no remote font came in with the export', () => {
    // The export pulls Manrope + Caveat from fonts.googleapis.com. SETTLED by the owner (28.07):
    // the pair stays ours – Sora on headings, Manrope on the rest, both self-hosted – and Caveat
    // is not taken at all. A LOADED remote font is what this forbids, not a mention of one: the
    // sheet's @font-face comment legitimately records where our own woff2 files came from.
    for (const src of [css, read('../index.html')]) {
      expect(src).not.toMatch(/@import[^;]*fonts\.(googleapis|gstatic)/)
      expect(src).not.toMatch(/<link[^>]*fonts\.(googleapis|gstatic)/)
      expect(src).not.toMatch(/src:\s*url\(['"]?https?:/)
    }
    expect(css).toContain("--font-heading: 'Sora'")
    expect(css).toContain("--font-body: 'Manrope'")
    // A2e: Caveat came in as the handwriting, SELF-HOSTED like the other two.
    expect(css).toContain("--font-hand: 'Caveat'")
    // Every self-hosted face has a file on disk, and there is no third family.
    const faces = [...css.matchAll(/url\('([^']+\.woff2)'\)/g)].map((m) => m[1])
    expect(faces.length).toBeGreaterThan(0)
    for (const f of faces) {
      expect(existsSync(`${ROOT}public${f.replace(/^\/?/, '/')}`), `missing font file ${f}`).toBe(true)
    }
    // ...and it is used where handwriting belongs, never on a control or a number.
    expect(css).toContain('font-family: var(--font-hand)')
  })
})

describe('player copy on every surface this slice touched', () => {
  it('short dash only, and no Cyrillic in anything rendered', () => {
    for (const [name, src] of [
      ['HomeScreen.vue', home],
      ['App.vue', app],
      ['OnboardingTour.vue', read('../src/components/OnboardingTour.vue')],
    ] as const) {
      const template = src.slice(src.indexOf('<template>'))
      expect(template, `${name} template`).not.toContain('—')
      expect(template, `${name} template`).not.toMatch(/[Ѐ-ӿ]/)
    }
    // The greeting pool is player copy too, and it is written in the engine.
    for (const g of GREETINGS) {
      expect(g).not.toMatch(/[—А-Яа-яЁё]/)
    }
  })
})
