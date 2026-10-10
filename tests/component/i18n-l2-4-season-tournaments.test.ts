// L2-4 – THE NET UNDER RU-04: THE SEASON PLANNER, THE TOUR GUIDE, THE SHARED TOURNAMENT CARDS AND THE TOURNAMENT FLOW.
// docs/specs/i18n-2026-10.md §8, docs/localization/ru-season-tournaments-2026-10.md.
//
// Six questions, asked of the REAL screens mounted and of the REAL catalog (the L2-3 net's shape):
//   1. PARITY. With no catalog the English renders as it shipped – the wiring changed no word (invariant 4). The existing season / tournament pin
//      families (all green, five of them through `tTransparent`) and the whole mounted project are the wide net; what is here is the anchors for the
//      new seams.
//   2. COMPLETENESS. Every CERTAIN string of the batch files is a WIRED key (the leftovers, if any, are named), and the sites this wave says it wired
//      really call `t()`.
//   3. THE SEAMS THAT WERE ENGLISH LOGIC. The court sentence is no longer cut out of the engine's hint at an English dash; the hedged-line filter
//      compares the catalog's own reading; the bracket's «is this the final» asks the draw, not the tab code.
//   4. THE CONTEXT TAGS. Every tag this wave added is a wired key, renders the bare English, and the mounted sites that can be reached ask for the
//      TAGGED key.
//   5. THE RUSSIAN SMOKE. The REAL `src/i18n/ru.json` is installed and the locale flipped. ⚠ NO CYRILLIC LITERAL LIVES IN THIS FILE – every
//      expectation is READ from ru.json by key. As of this wave no RU-04 row is APPROVED, so the unapproved arm is the one that bites today.
//   6. THE `xx` SWEEP. No unbracketed text where a string is wired, and the two tightest surfaces (the tournament card and the planner row on Season)
//      still hold a 375x667 phone with every word longer. The numbers print.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import '../../src/style.css'
import SeasonScreen from '../../src/components/screens/SeasonScreen.vue'
import TierGuide from '../../src/components/TierGuide.vue'
import NextTournamentPanel from '../../src/components/NextTournamentPanel.vue'
import TournamentFlow from '../../src/components/TournamentFlow.vue'
import BracketTabs from '../../src/components/BracketTabs.vue'
import { useGameStore } from '../../src/stores/game'
import { dominantSurface, SURFACE_BLOCKS, TIERS } from '../../src/engine/season/calendar'
import { surfaceStyleAffinity, surfaceStyleHint } from '../../src/engine/match/style'
import {
  createWorld,
  decideKnock,
  enterEvent,
  pendingKnock,
  setCoachOnEventWeeks,
  tickWeek,
  toSnapshot,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { courtSentence, surfaceHint } from '../../src/composables/eventCard'
import { DEFAULT_PROFILE, type FullBracketMatch, type PlayStyle, type Snapshot } from '../../src/shared/protocol'
import { formatShortName } from '../../src/shared/format'
import { installCatalog, missCount, missedKeys, resetI18nForTests, resetMisses, setLocale, t } from '../../src/i18n'
import { careerSnapshot } from '../helpers/career'
import { after } from '../helpers/source'
import { installMemoryStorage } from './setup'
import { PHONE, availableWidth, demandedWidth, setViewport } from './fits'
import { hardcodeLeaks, installPseudoLocale } from './pseudoloc'

/** His approved Russian, as the importer compiled it. Every Russian expectation below is read from here by key. */
const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
const CATALOG = JSON.parse(readFileSync('src/i18n/catalog.en.json', 'utf8')) as { keys: Record<string, { home: string[]; wrapped?: true }> }
const SRC = (path: string): string => readFileSync(path, 'utf8')

const SEED = 'l24-season'
const WEEKS = 40
let base: Snapshot
let atFlow: Snapshot

/** A REAL career ticked to a REAL tournament, entering whatever the engine allows (round21's recipe). */
function atTournament(seed: string): Snapshot {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'middle' })
  setCoachOnEventWeeks(world, true)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 80; i++) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    for (const e of world.season) {
      if (e.week > world.week && !world.entries.includes(e.id)) {
        try {
          enterEvent(world, e.id)
        } catch {
          /* eligibility and caps are the engine's business */
        }
      }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) return toSnapshot(world)
  }
  throw new Error('no tournament reached – the fixture is broken, not the assertion')
}

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  setActivePinia(createPinia())
  document.body.innerHTML = ''
  base ??= careerSnapshot(WEEKS, SEED)
  atFlow ??= atTournament('l24-flow')
})
afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
  document.documentElement.lang = 'en'
})

// --- the mounts ------------------------------------------------------------------------------------------------

function use(snapshot: Snapshot): void {
  useGameStore().snapshot = snapshot
}
function mountSeasonScreen(snapshot: Snapshot = base): VueWrapper {
  setViewport(PHONE)
  use(snapshot)
  return mount(SeasonScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
}
function mountGuide(snapshot: Snapshot = base): VueWrapper {
  setViewport(PHONE)
  use(snapshot)
  return mount(TierGuide, { attachTo: document.body })
}
function mountPreview(snapshot: Snapshot = base): VueWrapper {
  setViewport(PHONE)
  use(snapshot)
  const event = snapshot.upcoming[0]
  if (!event) throw new Error('the fixture has no upcoming event')
  return mount(NextTournamentPanel, { props: { event }, attachTo: document.body })
}
function mountFlow(snapshot: Snapshot = atFlow): VueWrapper {
  setViewport(PHONE)
  use(snapshot)
  return mount(TournamentFlow, { attachTo: document.body })
}
/** An eight-player draw all the way to the final, with the final's two players the semifinal winners (so the «Semifinals:» trail has victims). */
function eightDraw(): FullBracketMatch[] {
  const m = (round: number, i: number, label: string): FullBracketMatch => ({
    round, roundLabel: label, aId: `a${round}${i}`, bId: `b${round}${i}`, aName: `Aa ${round}${i}`, bName: `Bb ${round}${i}`, winnerId: `a${round}${i}`, score: '6-3 6-4',
  })
  const final: FullBracketMatch = { round: 2, roundLabel: 'Final', aId: 'a10', bId: 'a11', aName: 'Aa 10', bName: 'Aa 11', winnerId: 'a10', score: '7-5 6-4' }
  return [0, 1, 2, 3].map((i) => m(0, i, 'Quarterfinal')).concat([0, 1].map((i) => m(1, i, 'Semifinal')), [final])
}
function mountBracket(round = 2): VueWrapper {
  setViewport(PHONE)
  return mount(BracketTabs, { props: { matches: eightDraw(), drawSize: 8, activeRound: round }, attachTo: document.body })
}

/** Every player-visible string under `root`: text nodes and the four copy attributes, in one string – for «is this word on screen». */
function seen(root: Element): string {
  const parts: string[] = [root.textContent ?? '']
  for (const el of [root, ...Array.from(root.querySelectorAll('*'))]) {
    for (const a of ['title', 'aria-label', 'placeholder', 'alt']) {
      const v = el.getAttribute(a)
      if (v) parts.push(v)
    }
  }
  return parts.join('\n')
}

// --- 1. parity -------------------------------------------------------------------------------------------------

describe('L2-4 parity – the English the screens shipped, with no catalog', () => {
  it('Season: the planner header, the phase strip, the event card and the friendly read exactly as they did', () => {
    const w = mountSeasonScreen()
    const text = seen(w.element)
    expect(w.get('.season-title').text()).toBe('Season Planner')
    expect(text).toContain('Tour guide')
    // the phase strip: the old formula, recomputed – `Off` for the off-season, the capitalised dominant surface for the rest
    const was = SURFACE_BLOCKS.map((b) => (b.id === 'off-season' ? 'Off' : dominantSurface(b).replace(/^./, (c) => c.toUpperCase())))
    expect(w.findAll('.phase-name').map((n) => n.text())).toEqual(was)
    for (const word of ['Travel budget', 'This week\'s tournament', 'Calendar', 'Friendly match', 'Top seed', 'Play match', 'No points, no money – a hit-out', 'Seed']) {
      if (word === 'This week\'s tournament') continue // only on a tournament week
      expect(text, word).toContain(word)
    }
    expect(w.find('.friendly-seed input').attributes('placeholder')).toBe('optional')
    expect(text).toMatch(/Your read:|Coach says:/)
    expect(text).toMatch(/\+ Plan week/)
    w.unmount()
  })

  it('the tour guide: six headings, the fee cell that is a fact, and the closing paragraph', () => {
    const w = mountGuide()
    expect(w.findAll('th').map((th) => th.text())).toEqual(['Tier', 'Opens at', 'Draw', 'Entry fee', 'Travel', 'Points (W / F / SF / …)'])
    expect(w.get('.guide-title').text()).toBe('Tour guide')
    expect(w.findAll('td.num').some((td) => td.text() === 'none'), 'the slam charges no entry fee and says so').toBe(true)
    expect(w.get('.hint').text()).toMatch(/^The bands overlap on purpose – there is always more than one place to go\./)
    // the opens-at column is a sentence per rung, built from clauses
    expect(w.findAll('.guide-opens').every((td) => /^(age \d+(-\d+)?|the top \S+ internationally|\d+ \S+ pts|open from the start)/.test(td.text()))).toBe(true)
    w.unmount()
  })

  it('the next-tournament preview: money, read, facts and the first round', () => {
    const w = mountPreview()
    const text = seen(w.element)
    for (const word of ['Entry fee', 'Travel budget', 'Conditions', 'The read', 'Surface', 'Prize money', 'Winner', 'Spectators', 'First round']) expect(text, word).toContain(word)
    expect(w.get('.nt-draw').text()).toMatch(/^\d+-player draw$/)
    expect(w.get('.nt-fact-value.surface').text(), 'the raw lowercase surface the stylesheet capitalises').toBe(base.upcoming[0]!.surface)
    expect(text).toMatch(/Only the first round is drawn before the week starts|The draw has not been made yet\./)
    w.unmount()
  })

  it('the tournament flow splash: facts, brief, condition ring and the two ways out', () => {
    const w = mountFlow()
    const text = seen(w.element)
    for (const word of ['Surface', 'Prize money', 'Winner', 'Coach prediction', 'Her condition', 'Begin', 'Skip this event – withdraw']) expect(text, word).toContain(word)
    expect(text).toMatch(/\d+-player draw/)
    expect(text).toMatch(/Her condition going into this tournament: \d+ percent/)
    // the coach's brief: the court sentence, then the price of the title – exactly the old composition
    const pending = atFlow.pending!
    const court = courtSentence(atFlow.profile.playStyle, pending.surface)
    const WORDS = ['', 'One win', 'Two wins', 'Three wins', 'Four wins', 'Five wins', 'Six wins']
    const wins = Math.log2(pending.drawSize!)
    const price = `${WORDS[wins] ?? `${wins} wins`} for the title.`
    expect(w.get('.tf-brief-line').text()).toBe(court ? `${court} ${price}` : price)
    w.unmount()
  })

  it('the bracket: the compact tabs, the final\'s heading and aria sentence, and the semifinal trail', () => {
    const w = mountBracket()
    const html = w.html()
    for (const short of ['QF', 'SF']) expect(html, short).toContain(short)
    expect(w.get('.bt-final-label').text()).toBe('The Final')
    expect(w.get('.bt-cell--final').attributes('aria-label')).toBe('The final – Aa 10 vs Aa 11')
    expect(w.get('.bt-final-semis').text().replace(/\s+/g, ' ')).toBe('Semifinals: def. Bb 10 · def. Bb 11')
    w.unmount()
    const qf = mountBracket(0)
    expect(qf.findAll('.bt-cell.is-kid').length + qf.findAll('.bt-cell').length).toBeGreaterThan(0)
    expect(qf.find('.bt-final').exists(), 'the quarterfinals are not the final').toBe(false)
    qf.unmount()
  })
})

// --- 2. completeness -------------------------------------------------------------------------------------------

describe('L2-4 completeness – every string of the batch files is a wired key, and the sites this wave names call t()', () => {
  const FILES = [
    'src/components/screens/SeasonScreen.vue',
    'src/components/TierGuide.vue',
    'src/components/NextTournamentPanel.vue',
    'src/components/TournamentFlow.vue',
    'src/components/BracketTabs.vue',
    'src/composables/eventCard.ts',
    'src/composables/eventName.ts',
    'src/composables/tierState.ts',
  ]
  it('no CERTAIN string homed in these files is left unwrapped', () => {
    const open = Object.entries(CATALOG.keys)
      .filter(([, v]) => v.home.some((h) => FILES.includes(h)) && !v.wrapped)
      .map(([k]) => k)
    expect(open).toEqual([])
  })

  it('the rows RU-04 names have a wired key each, and the file that owns each really calls t() with it', () => {
    // ⚠ L2-11b (09.10) – PREMISE MOVE, COUNTED: the friendly's seed label asks for `friendly|Seed` now. The bare `Seed` is the About row's (RU-13B's is the only CLEAN row for the
    // word, and the importer joins a clean row to the bare key), while this field's row (RU04-F06) is described, not quoted. One literal in SeasonScreen.vue; the rendered word is unchanged.
    const SITES: [string, string[]][] = [
      ['src/components/screens/SeasonScreen.vue', ['Season Planner', 'Tour guide', 'Pro entries, birthday to birthday: {used} of {limit}', '{0} left to enter over {1} weeks', '+{n} lower', '{0} of them on the cards below',
        'She is worn out – maybe a family week?', 'She could use a week off – maybe a family week?', 'See the options', 'Not now', 'This week\'s tournament', 'My entries', 'Travel budget', 'academy covers {0}%',
        'closes {week}', 'Closed {week}', 'Entered', 'wild card', 'defending {0} pts', 'Outgrown – she is past this level', 'Your read:', 'Coach says:', 'Withdraw', 'Cancel entry',
        'Entries closed {0}', 'Enter', 'Not enough funds', 'Exhausted – race anyway? Rest would be wiser.', '+ Plan week', 'Exams this week', 'Off-season', 'Exams', 'Shooting week', 'Training week',
        // ⚠ 10.10 – the booking-cancel buttons took the `undo|` tag (chat-ok: «Отмена» closes a dialog, «Отменить» undoes a booking), so the key this file asks for moved with them.
        '+{0} condition', 'Skipping {0}.', 'instead of {0}', 'Practice match', 'Practice match + coach', 'Play it and watch', 'undo|Cancel', 'School owns this week.', 'Friendly match', 'Top seed', 'Play match', 'friendly|Seed', 'optional',
        'Close the friendly', 'Injured – rest up', 'Not cleared to play', 'Tour age rule – {used} of {limit}', 'Year limit – {used} of {limit}', 'Year limit reached', 'Family vacation – {package}', 'Not available this week',
        '{caution} Enter {event} ({week}, {surface}) anyway? {fee}', '{caution} Enter {event} ({week}, {surface})? {fee}', 'Enter {event} ({week}, {surface})? {fee}', 'Push through', 'Enter anyway',
        'Withdraw from {event} ({week})? Entry fee {fee} will be refunded.', 'No entry fee – the trip is still yours to pay for.', 'Entry fee {fee}.', 'Cancel the entry',
        'The draw has not been made yet.', 'This field is strong.', 'We have watched her beat most of these.', 'The draw has been kind, though.', 'She has drawn the one who can stop her, though.',
        'On paper this is hers to lose.']],
      ['src/components/TierGuide.vue', ['Close tier guide', 'Close', 'Tour guide', 'Tier', 'Opens at', 'Draw', 'Entry fee', 'Travel', 'Points (W / F / SF / …)', 'fee|none']],
      ['src/composables/tierState.ts', ['age {min}-{max}', 'age {age}', 'the top {cut} internationally', 'the top {pct}% internationally', '{points} {unit} in one season', 'open from the start', 'Reach {required} {unit}',
        '{current} / {required} {unit}', 'Opens at {age}', 'Opens in the top {cut}', 'Not on the list yet', 'Under-{n}', 'Open – on the calendar', 'Open – none in {weeks} weeks']],
      ['src/composables/eventCard.ts', ['Her chance to win the first match: {pct} percent, against {opponent}', 'First round vs {opponent}', 'A typical first round at this level',
        'Her chance to win a first match at this level: {pct} percent. The draw has not been made yet.', 'The court suits her game.', 'The court not her surface.', 'Hard', 'Clay', 'Grass']],
      ['src/composables/eventName.ts', ['Enter the {event}, {weekRange}']],
      ['src/components/NextTournamentPanel.vue', ['Entry fee', 'Travel budget', 'Conditions', 'The read', 'Most of this field is ranked above her.', 'A field of about her own level.', 'She is among the strongest entered.',
        'A typical figure for this level – it sharpens when the draw is made.', 'Surface', 'Prize money', 'Winner', 'Spectators', 'First round', '{0}-player draw', 'VS', '{0} pts',
        'About {0} people around the courts – atmosphere, not a factor in play', 'Only the first round is drawn before the week starts – the rest of the bracket is made when she gets there.']],
      ['src/components/BracketTabs.vue', ['Draw rounds', 'The Final', 'The final – {0} vs {1}', 'Her match – {0} vs {1}', 'Semifinals:', 'def. {0}']],
      ['src/components/TournamentFlow.vue', ['To result', 'Skip all rounds', 'Back', 'Surface', 'Prize money', 'splash|Winner', 'A student field awards no ranking points', 'Age {0}', 'VS', '{0} ranking', 'Coach prediction',
        'One win for the title.', 'Six wins for the title.', '{0} wins for the title.', 'At the tournament with her this week – one additional fare on this trip.', 'Her condition', 'Begin', 'Skip this event – withdraw',
        'Skip {0}? The entry fee is forfeited – the list closed with her on it. Travel is refunded and the week passes without playing.', 'Skip', 'Watch match', 'Win', 'Loss', '{0} vs {1}', 'Watch again',
        'result|Next', 'She\'s out – see how the draw finishes.', 'Next round', 'Continue', 'Champion', 'Runner-up', 'in the Final', '+{0} pts', 'Skip event', 'To the result', 'Final', 'Semifinal', 'Quarterfinal',
        'Round of 16', 'Round of 128', 'Avg rally {0} shots · ~{1}']],
    ]
    const unwired: string[] = []
    const absent: string[] = []
    for (const [file, keys] of SITES) {
      const source = SRC(file)
      for (const key of keys) {
        if (!CATALOG.keys[key]?.wrapped) unwired.push(`${file}: ${key}`)
        // the file itself asks for the key (escaped apostrophes as the source spells them; a tagged key as `tag|text`)
        const literal = key.replaceAll("'", "\\'")
        if (!source.includes(`'${literal}'`) && !source.includes(`"${key}"`) && !source.includes(`\`${key}\``)) absent.push(`${file}: ${key}`)
      }
    }
    expect(unwired).toEqual([])
    expect(absent, 'a key the table names that its own file does not call').toEqual([])
  })
})

// --- 3. the seams that were English logic ----------------------------------------------------------------------

describe('L2-4 seams – the court sentence, the hedged filter and the bracket\'s final do not depend on the language', () => {
  const STYLES: PlayStyle[] = ['aggressive', 'counterpuncher', 'serve-first', 'all-court']
  const SURFACES = ['hard', 'clay', 'grass'] as const

  it('the court sentence is the old slice of the engine hint, character for character, for every style and surface', () => {
    const seenAffinity = new Set<string>()
    for (const style of STYLES) {
      for (const surface of SURFACES) {
        const engine = surfaceStyleHint(style, surface)
        expect(surfaceHint(style, surface), `${style}/${surface}`).toBe(engine)
        const was = engine === null ? null : `The court ${after(engine, '– ').slice('– '.length)}.`
        expect(courtSentence(style, surface), `${style}/${surface}`).toBe(was)
        seenAffinity.add(surfaceStyleAffinity(style, surface))
      }
    }
    expect([...seenAffinity].sort(), 'the sweep reaches both verdicts and the silent one').toEqual(['against', 'neutral', 'suits'])
  })

  it('under xx the hint still carries the words it was made of (the surface word is read through the catalog, not sliced)', async () => {
    await installPseudoLocale()
    const style = STYLES.find((s) => SURFACES.some((x) => surfaceStyleAffinity(s, x) === 'suits'))!
    const surface = SURFACES.find((x) => surfaceStyleAffinity(style, x) === 'suits')!
    expect(surfaceHint(style, surface)).toMatch(/^⟦/)
    expect(courtSentence(style, surface)).toMatch(/^⟦The court suits her game\./)
  })

  it('the bracket asks the DRAW whether it is looking at the final: under xx the compact tab code is bracketed and the final still renders', async () => {
    await installPseudoLocale()
    const w = mountBracket(2)
    expect(w.find('.bt-final').exists(), 'the final was recognised by the draw, not by the tab word «F»').toBe(true)
    expect(w.html()).toMatch(/⟦QF/)
    expect(w.get('.bt-final-label').text()).toMatch(/^⟦The Final/)
    w.unmount()
    const qf = mountBracket(0)
    expect(qf.find('.bt-final').exists()).toBe(false)
    qf.unmount()
  })

  it('the hedged-line filter compares the catalog\'s own reading of the two lines, not an English literal pair in a Set', () => {
    const season = SRC('src/components/screens/SeasonScreen.vue')
    expect(season).toContain("line === t('On paper this is hers to lose.') || line === t('A field she should be beating.')")
    expect(season).not.toContain("new Set(['On paper this is hers to lose.'")
  })
})

// --- 4. the context tags ---------------------------------------------------------------------------------------

describe('L2-4 context tags – added where one English needs two Russians (measured against every other batch table)', () => {
  const TAGS: [string, string][] = [
    ['phase|Off', 'Off'],
    ['pager|Next', 'Next'],
    ['fee|none', 'none'],
    ['price|free', 'free'],
    ['stage|F', 'F'],
    ['stage|SF', 'SF'],
    ['stage|QF', 'QF'],
    ['stage|R16', 'R16'],
    ['stage|R32', 'R32'],
    ['stage|R64', 'R64'],
    ['stage|R128', 'R128'],
    ['path|W', 'W'],
    ['path|L', 'L'],
    ['poster|def.', 'def.'],
    ['poster|lost to', 'lost to'],
    ['splash|Winner', 'Winner'],
    ['result|Next', 'Next'],
  ]
  it.each(TAGS)('%s is a wired key that renders the bare English', (tagged, bare) => {
    expect(CATALOG.keys[tagged]?.wrapped, `${tagged} is not wired`).toBe(true)
    expect(t(tagged)).toBe(bare)
  })
  it('the tags that carry holes are wired too, and render the English they were cut from', () => {
    for (const key of ['supply|{code} {count}', 'gate|{points} {unit}', 'gate|{0} and {1}', 'stage|R{0}']) expect(CATALOG.keys[key]?.wrapped, key).toBe(true)
    expect(t('supply|{code} {count}', { code: 'W15', count: 3 })).toBe('W15 3')
    expect(t('gate|{0} and {1}', ['age 13', '65 national pts'])).toBe('age 13 and 65 national pts')
    expect(t('stage|R{0}', [256])).toBe('R256')
  })

  it('the mounted sites ask for the TAGGED key, not the bare one (a stand-in catalog that only knows the tags)', async () => {
    installCatalog('ru', { 'phase|Off': 'OFF*', 'fee|none': 'NONE*', 'stage|QF': 'QF*', 'splash|Winner': 'SPLASH*', 'stage|SF': 'SF*', Winner: 'BARE*', None: 'BARE*', Next: 'BARE*' })
    await setLocale('ru')
    const season = mountSeasonScreen()
    expect(season.findAll('.phase-name').map((n) => n.text())).toContain('OFF*')
    season.unmount()
    const guide = mountGuide()
    expect(guide.findAll('td.num').some((td) => td.text() === 'NONE*')).toBe(true)
    guide.unmount()
    const bracket = mountBracket(0)
    expect(bracket.html()).toContain('QF*')
    bracket.unmount()
    const flow = mountFlow()
    expect(seen(flow.element)).toContain('SPLASH*')
    expect(seen(flow.element), 'the splash never asks for the bare Winner').not.toContain('BARE*')
    flow.unmount()
    // the preview keeps the BARE `Winner` (its Russian is the nominative; the splash's is the dative)
    const preview = mountPreview()
    expect(seen(preview.element)).toContain('BARE*')
    preview.unmount()
  })

  it('the sites a unit cannot reach cheaply are pinned at the source: the pager, the post-match Next and the poster\'s two verbs', () => {
    expect(SRC('src/components/screens/SeasonScreen.vue')).toContain(":label=\"t('pager|Next')\"")
    const flow = SRC('src/components/TournamentFlow.vue')
    for (const call of ["t('result|Next')", "t('poster|def.')", "t('poster|lost to')", "t('path|W')", "t('path|L')", "t('splash|Winner')"]) expect(flow, call).toContain(call)
  })
})

// --- 5. the Russian smoke --------------------------------------------------------------------------------------

describe('L2-4 Russian smoke – ru.json read by key, no Cyrillic typed here', () => {
  it('a stand-in catalog proves the call sites ask the catalog (latin markers, one per surface)', async () => {
    installCatalog('ru', {
      'Season Planner': 'PLANNER*', 'Friendly match': 'FRIEND*', 'Travel budget': 'TRAVEL*', 'Tour guide': 'GUIDE*', 'Opens at': 'OPENS*', 'The read': 'READ*', 'Coach prediction': 'BRIEF*',
      'The Final': 'FINAL*', 'Semifinals:': 'SEMIS*', 'Draw rounds': 'ROUNDS*',
    })
    await setLocale('ru')
    const season = seen(mountSeasonScreen().element)
    for (const word of ['PLANNER*', 'FRIEND*', 'TRAVEL*', 'GUIDE*']) expect(season, word).toContain(word)
    document.body.innerHTML = ''
    expect(seen(mountGuide().element)).toContain('OPENS*')
    document.body.innerHTML = ''
    expect(seen(mountPreview().element)).toContain('READ*')
    document.body.innerHTML = ''
    expect(seen(mountFlow().element)).toContain('BRIEF*')
    document.body.innerHTML = ''
    const bracket = seen(mountBracket(2).element)
    for (const word of ['FINAL*', 'SEMIS*']) expect(bracket, word).toContain(word)
  })

  it('the REAL ru.json: every approved row on these surfaces renders his Russian; every unapproved one renders English and is counted', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    resetMisses()
    const mounted = [mountSeasonScreen(), mountGuide(), mountPreview(), mountFlow(), mountBracket(2)]
    const everything = mounted.map((m) => seen(m.element)).join('\n')
    const HERE = /SeasonScreen|TierGuide|NextTournamentPanel|TournamentFlow|BracketTabs|eventCard|eventName|tierState/
    const wiredHere = Object.keys(RU).filter((k) => CATALOG.keys[k]?.wrapped && CATALOG.keys[k]!.home.some((h) => HERE.test(h)))
    // the approved arm: today `wiredHere` is empty (no RU-04 row is approved) and the loop wakes by itself the day one is
    // ⚠ 10.10 – named pose gaps, never silent skips: the rally metadata line lives on the finished-match card, and these mounts stop at the planner and the live flow.
    const NOT_IN_POSE = new Set(['Avg rally {0} shots · ~{1}', 'Not enough funds', 'undo|Cancel', 'Watch again', 'Watch it', 'Withdraw'])
    for (const key of wiredHere) {
      if (NOT_IN_POSE.has(key)) continue
      // ⚠ 10.10 – a PARAMETERISED value renders with its holes filled, so every hole-free SEGMENT must render instead of the raw pattern.
      for (const seg of RU[key]!.split(/\{\d+\}/)) {
        const t = seg.trim()
        if (t !== '') expect(everything, `${key} is approved and wired, so his Russian must render (segment «${t}»)`).toContain(t)
      }
    }
    // the unapproved arm: English on screen, and the miss counter says so (ruling 4 as a number)
    expect(everything).toContain('Season Planner')
    expect(missCount(), 'unapproved rows must be counted as misses').toBeGreaterThan(40)
    for (const key of ['Season Planner', 'Tour guide', 'Travel budget', 'Coach prediction', 'The read', 'Opens at', 'The Final']) expect(missedKeys(), key).toContain(key)
    console.log(`[L2-4 smoke] ru.json: ${Object.keys(RU).length} keys; approved AND wired on these screens: ${wiredHere.length}; distinct misses on five mounted surfaces: ${missedKeys().length}`)
    mounted.forEach((m) => m.unmount())
  })
})

// --- 6. the xx sweep -------------------------------------------------------------------------------------------

describe('L2-4 xx sweep – no unwrapped literal in the frames, and the phone still holds longer words', () => {
  /** What is NOT frame copy and is allow-listed by SHAPE: week labels, dates, money and bare numbers.
   *  ⚠ NO NAME-SHAPED PATTERNS HERE (L2-5's rule, applied to this file at L2-6 step 0): a «First Last» regex swallowed `Season Planner`, a «Word» regex
   *  swallowed any one-word heading (`Travel`, `Winner`), and the tier-prefix regex swallowed every string that began with `Local`, `National` or `Pro` – a
   *  capitalised unwrapped HEADING passed this arm in all three shapes. A name is allowed because the SNAPSHOT (or an engine table the screens read directly) carries it – see `engineProse` –
   *  never because it is capitalised. */
  const ENGINE_BORN: RegExp[] = [
    /^W\d+( \d{4}| ’\d{2})?$/, /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d+(?: – (?:[A-Za-z]+ )?\d+)?(?:, \d{4})?$/, /^\$[\d,.]+[KMB]?$/, /^[−-]?\$[\d,.]+/,
    // ⚠ THE NAMED LEFTOVERS OF THIS WAVE, each for its reason: the week label after the season year (`weekOnly`, RU-13D's formatter), the planner's
    // phase ranges and the week-range rows (`W1-10`, `W42 · Oct 20–26, 2031` – `weekRange`, the same formatter, anchored on the `W<digits>` it starts
    // with, so it cannot swallow a heading) and the card's fee pill (`entryFeeLabel`, shared/money.ts – engine-importable, no RU-04 row; Calendar
    // shares it, so it is one decision for both screens).
    /^· W\d+$/, /^W\d+(?:-\d+)?(?: · .+)?$/, /^(?:entry \$[\d,.]+|no entry fee)$/,
    /^\d+°?$/, /^#\d+$/, /^[\d,]+$/, /^\d+(?:-\d+)*$/, /^[—–-]$/, /^\?$/, /^%$/, /^\d+(?:\.\d+)?%$/,
  ]

  /** A leak that IS the engine's prose: written in the snapshot the screen was handed, or read by the screen straight from an engine table, so it never
   *  passed through a template literal. A person's SHORT form (`A. Martin`, `formatShortName`) is derived from the full names the snapshot carries; the
   *  tier labels (`TIERS`, the guide's rungs) are the engine's own table. A decorative pictograph at EITHER end (the guide's lock) is not part of the prose. */
  const engineProse = (snap: Snapshot) => {
    const json = JSON.stringify(snap)
    const shorts = Array.from(json.matchAll(/"([A-Z][a-z]+ [A-Z][a-z]+)"/g), (m) => formatShortName(m[1]!))
    const corpus = [json, ...shorts, ...Object.values(TIERS).map((tier) => tier.label)].join('\n')
    return (leak: string): boolean => {
      const prose = leak.replace(/^[\p{Extended_Pictographic}‍️\s]+|[\p{Extended_Pictographic}‍️\s]+$/gu, '').trim()
      return prose.length > 2 && corpus.includes(prose)
    }
  }
  const screenLeaks = (root: Element, snap: Snapshot): string[] => hardcodeLeaks(root, ENGINE_BORN).filter((l) => !engineProse(snap)(l))

  it('Season, the guide, the preview and the flow splash: nothing the SCREEN wrote is left unbracketed', async () => {
    await installPseudoLocale()
    const results: [string, string[]][] = []
    const season = mountSeasonScreen()
    results.push(['season', screenLeaks(season.element, base)])
    season.unmount()
    const guide = mountGuide()
    results.push(['guide', screenLeaks(guide.element, base)])
    guide.unmount()
    const preview = mountPreview()
    results.push(['preview', screenLeaks(preview.element, base)])
    preview.unmount()
    const flow = mountFlow()
    results.push(['flow', screenLeaks(flow.element, atFlow)])
    flow.unmount()
    console.log(`[L2-4 xx] leaks: ${JSON.stringify(results)}`)
    for (const [surface, leaks] of results) expect(leaks, `${surface}: copy the SCREEN wrote that did not go through t()`).toEqual([])
  })

  /** TWO NUMBERS PER SURFACE, BOTH `fits.ts`' OWN INSTRUMENT, both as a share of the room the box has on a 375px phone (L2-3's `widest`):
   *   · `line` – every text box as it is drawn: a box that cannot wrap is charged its whole label, a wrapping one only its chrome;
   *   · `word` – the longest unbreakable word of every box STRETCHED BY 40%, on a probe at the box's own font size (the Russian failure mode). */
  function widest(root: Element): { boxes: number; chars: number; line: { r: number; at: string }; word: { r: number; at: string } } {
    let boxes = 0
    let chars = 0
    const line = { r: 0, at: '' }
    const word = { r: 0, at: '' }
    for (const el of Array.from(root.querySelectorAll('*'))) {
      const own = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.nodeValue ?? '').join(' ').replace(/\s+/g, ' ').trim()
      if (!/\p{L}/u.test(own)) continue
      boxes++
      chars += own.length
      const room = Math.max(1, availableWidth(el, PHONE))
      const lineRatio = demandedWidth(el, room) / room
      if (lineRatio > line.r) Object.assign(line, { r: lineRatio, at: own.slice(0, 28) })
      const longest = own.split(' ').reduce((a, b) => (b.length > a.length ? b : a), '')
      const probe = document.createElement('span')
      probe.textContent = longest + longest.slice(0, Math.ceil(longest.length * 0.4))
      probe.style.whiteSpace = 'nowrap'
      probe.style.fontSize = getComputedStyle(el).fontSize
      el.appendChild(probe)
      const wordRatio = demandedWidth(probe, room) / room
      probe.remove()
      if (wordRatio > word.r) Object.assign(word, { r: wordRatio, at: longest })
    }
    return { boxes, chars, line, word }
  }

  it('the tournament card and the planner row on Season hold a 375x667 phone with every word longer (numbers printed)', async () => {
    const surfaces: [string, string][] = [
      ['the tournament card', '.event-card'],
      ['the planner row', '.week-card'],
    ]
    const measure = (): { label: string; r: ReturnType<typeof widest> }[] => {
      const w = mountSeasonScreen()
      const out = surfaces.map(([label, sel]) => {
        const el = w.find(sel)
        expect(el.exists(), `${label} (${sel}) is on the fixture's Season screen`).toBe(true)
        return { label, r: widest(el.element) }
      })
      w.unmount()
      return out
    }
    const english = measure()
    resetI18nForTests(null)
    await installPseudoLocale()
    const xx = measure()
    const pct = (r: number): string => `${(r * 100).toFixed(0)}%`
    console.log(
      '[L2-4 xx] 375x667, share of the box\'s room, English -> xx: ' +
        english
          .map((e, i) => {
            const x = xx[i]!
            return `${e.label}: ${e.r.boxes} text boxes, ${e.r.chars} -> ${x.r.chars} chars; widest line ${pct(e.r.line.r)} («${e.r.line.at}») -> ${pct(x.r.line.r)} («${x.r.line.at}»); longest word ${pct(e.r.word.r)} («${e.r.word.at}») -> ${pct(x.r.word.r)} («${x.r.word.at}»)`
          })
          .join(' · '),
    )
    for (const x of xx) {
      expect(x.r.line.r, `${x.label}: «${x.r.line.at}» cannot wrap and overflows its box under xx`).toBeLessThanOrEqual(1)
      expect(x.r.word.r, `${x.label}: the word «${x.r.word.at}» overflows its box under xx`).toBeLessThanOrEqual(1)
    }
    expect(xx.every((x, i) => x.r.chars > english[i]!.r.chars), 'xx made a surface no longer – the measurement did not see the words').toBe(true)
  })
})

