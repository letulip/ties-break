// L2-5 – THE NET UNDER RU-05: HER PROFILE, THE SKILLS RADAR, THE COACH MARKET, THE WEEK PLANNING SHEET, KNOCKS AND INJURY STOPS.
// docs/specs/i18n-2026-10.md §8, docs/localization/ru-profile-coaching-2026-10.md.
//
// Six questions, asked of the REAL screens mounted and of the REAL catalog (the L2-3 / L2-4 nets' shape):
//   1. PARITY. With no catalog the English renders as it shipped – the wiring changed no word (invariant 4). The existing profile / radar / coach
//      pin families (through `tTransparent` where they assert a spelling) and the whole mounted project are the wide net; what is here are the
//      anchors for the new seams – above all the seven injury circumstances against the OLD composition, recomputed.
//   2. COMPLETENESS. Every CERTAIN string of the batch files is a WIRED key (the leftover, if any, is named), and the sites this wave says it
//      wired really call `t()`.
//   3. THE SEAMS. The radar's axis words and the coach-tier words are getters over `t()` pinned word for word to the engine tables they mirror
//      (those stay in the engine – it cannot call `t()`); the option rows that used to be built once at setup follow the locale; the vacation
//      effect line keeps the space its template whitespace used to supply.
//   4. THE CONTEXT TAGS. Every tag this wave added is a wired key, renders the bare English, and the mounted sites that can be reached ask for the
//      TAGGED key.
//   5. THE RUSSIAN SMOKE. The REAL `src/i18n/ru.json` is installed and the locale flipped. ⚠ NO CYRILLIC LITERAL LIVES IN THIS FILE – every
//      expectation is READ from ru.json by key. As of this wave no RU-05 row is APPROVED, so the unapproved arm is the one that bites today.
//   6. THE `xx` SWEEP. No unbracketed text where a string is wired, and the two tightest surfaces (the radar card and the coach market card) still
//      hold a 375x667 phone with every word longer; the longest injury report still reaches Continue. The numbers print.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import '../../src/style.css'

// The injury and knock dialogs play a cue on mount; audio has no business in a copy test (the shim the injury tests use).
vi.mock('../../src/audio/sfx', () => ({
  playSfx: () => {},
  primeSfx: () => {},
  initSfx: () => {},
  installGlobalSfx: () => {},
  isMuted: () => false,
  setMuted: () => {},
}))

import KidScreen from '../../src/components/screens/KidScreen.vue'
import SkillsRadar from '../../src/components/SkillsRadar.vue'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import PlanWeekSheet from '../../src/components/PlanWeekSheet.vue'
import InjuryStopDialog from '../../src/components/InjuryStopDialog.vue'
import KnockDialog from '../../src/components/KnockDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { COACH_TIER_LABEL, HIREABLE_TIERS } from '../../src/engine/coach'
import { RADAR_AXIS_LABEL } from '../../src/engine/radar'
import { SKILL_KEYS } from '../../src/engine/development'
import { ECONOMY } from '../../src/engine/economy'
import { COUNTRY_NAMES } from '../../src/composables/countries'
import { coachBlurb, coachProfileNote } from '../../src/engine/world/coachMarket'
import { buildKnockPrompt } from '../../src/engine/knock'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { COACH_TIER_WORD } from '../../src/composables/coachWords'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS, type CoachTier, type Knock, type Snapshot } from '../../src/shared/protocol'
import { installCatalog, missCount, missedKeys, resetI18nForTests, resetMisses, setLocale, t } from '../../src/i18n'
import { careerSnapshot } from '../helpers/career'
import { sevenWeeksAndADailyMasseur } from '../helpers/r41InjuryForecast'
import { installMemoryStorage } from './setup'
import { PHONE, assertDismissReachable, availableWidth, demandedWidth, setViewport } from './fits'
import { DEFAULT_ALLOW, hardcodeLeaks, installPseudoLocale } from './pseudoloc'
import { listDocs, readRows } from '../../tools/i18n-import'

/** His approved Russian, as the importer compiled it. Every Russian expectation below is read from here by key. */
const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
const CATALOG = JSON.parse(readFileSync('src/i18n/catalog.en.json', 'utf8')) as { keys: Record<string, { home: string[]; wrapped?: true }> }
const SRC = (path: string): string => readFileSync(path, 'utf8')

const SHY = '­'
const WEEKS = 40
let base: Snapshot // self-coached: the profile says «You», the Coach Market lands on «Her week»
let coached: Snapshot // a middle-tier coach (the default career's): it lands on the coaches tab
let planSnap: Snapshot
let injured: Snapshot

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  setActivePinia(createPinia())
  document.body.innerHTML = ''
  base ??= careerSnapshot(WEEKS, 'l25-profile', { ...DEFAULT_PROFILE, coachTier: 'self' })
  coached ??= careerSnapshot(WEEKS, 'l25-coached', { ...DEFAULT_PROFILE, coachTier: 'middle' })
  planSnap ??= toSnapshot(createWorld('l25-plan', DEFAULT_PROFILE))
  injured ??= toSnapshot(sevenWeeksAndADailyMasseur('l25-injury'))
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
function mountKid(snapshot: Snapshot = base): VueWrapper {
  setViewport(PHONE)
  use(snapshot)
  return mount(KidScreen, { attachTo: document.body })
}
function mountMarket(snapshot: Snapshot = coached): VueWrapper {
  setViewport(PHONE)
  use(snapshot)
  return mount(CoachMarketScreen, { attachTo: document.body })
}
function mountPlanner(tab: 'practice' | 'vacation' = 'practice', snapshot: Snapshot = planSnap, week = 20): VueWrapper {
  setViewport(PHONE)
  use(snapshot)
  return mount(PlanWeekSheet, { props: { week, initialTab: tab }, attachTo: document.body })
}
/** A snapshot with a vacation already booked for week 20 (the sheet then opens on its «booked» face). */
function bookedSnapshot(paidCents: number): Snapshot {
  return { ...planSnap, vacations: [{ week: 20, packageId: 'staycation', paidCents }] } as unknown as Snapshot
}
type Report = { kind: string; oppName: string | null; stage: string | null; cancelled: unknown[]; stranded: unknown[]; refundCents: number }
function withReport(kind: string, oppName: string | null, stage: string | null): Snapshot {
  const report: Report = { kind, oppName, stage, cancelled: [], stranded: [], refundCents: 0 }
  return { ...injured, injuryReport: report } as unknown as Snapshot
}
function mountInjury(snapshot: Snapshot = injured): VueWrapper {
  setViewport(PHONE)
  use(snapshot)
  return mount(InjuryStopDialog, { attachTo: document.body })
}
const KNOCK: Knock = { part: 'hip', sinceWeek: 8, repeat: false, choice: null, untilWeek: 8 }
/** The knock snapshot a mounted dialog reads: the REAL `buildKnockPrompt`, so the engine's five sentences are exactly the ones a career would carry. */
function knockSnapshot(repeat: boolean): Snapshot {
  return { week: 8, knockPrompt: buildKnockPrompt({ ...KNOCK, repeat }, 'l25-knock', 60, WEEK_PLAN_PRESETS.grind) } as unknown as Snapshot
}
function mountKnock(repeat = false): VueWrapper {
  setViewport(PHONE)
  useGameStore().$patch({ snapshot: knockSnapshot(repeat) })
  return mount(KnockDialog, { attachTo: document.body })
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
const flat = (s: string): string => s.replace(/\s+/g, ' ').trim()

// --- 1. parity -------------------------------------------------------------------------------------------------

describe('L2-5 parity – the English the screens shipped, with no catalog', () => {
  it('the profile: hero, six tiles, radar frame, moments, account row and the counting card', () => {
    const w = mountKid()
    const text = seen(w.element)
    expect(w.get('.kid-age').text()).toMatch(/^\d+ years old · B-Day .+/)
    expect(w.findAll('.kid-tile-label').map((n) => n.text())).toEqual(['Personality', 'Condition', 'Mood', 'School', 'Friends', 'Coach'])
    expect(w.get('.kid-tile-door').attributes('aria-label')).toBe('Coach – open the Coach Market')
    expect(w.get('.kid-tool').attributes('aria-label')).toBe('Settings')
    expect(w.get('.kid-tool').attributes('title')).toBe('Settings')
    expect(w.get('.kid-back').attributes('aria-label')).toBe('Back to Home')
    expect(w.get('.kid-ring, [aria-label^="Condition:"]').attributes('aria-label')).toBe(`Condition: ${base.condition} percent`)
    // the self-coached tile: «You» over the engine's own word for the rung
    const doorLines = w.findAll('.kid-tile-door .kid-tile-line').map((n) => n.text())
    expect(doorLines).toEqual(['You', COACH_TIER_LABEL.self])
    // ...and a hired coach's: her name over «<tier> tier», and the other voice of the radar blurb
    const hired = mountKid(coached)
    expect(hired.findAll('.kid-tile-door .kid-tile-line').map((n) => n.text())).toEqual([coached.coachMarket.find((c) => c.current)!.name, `${COACH_TIER_LABEL.middle} tier`])
    expect(hired.get('.kid-panel-radar .kid-panel-note').text()).toMatch(/^What her coach can tell so far\. The dashed shape is where she started/)
    hired.unmount()
    expect(text).toContain('Skills')
    expect(w.get('.kid-panel-radar .kid-panel-note').text()).toMatch(/^What you can tell so far\. The dashed shape is where she started/)
    // the accessible name of the chart: ONE sentence, single-spaced (the template used to break it across three lines)
    expect(w.get('svg.radar-svg').attributes('aria-label')).toBe(
      'Her skills: serve, return, composure, stamina and groundstrokes. The dashed contour is where she started, the solid one is where she is today, and the haze around them is how far she could go.',
    )
    expect(w.findAll('.kid-moment-label').map((n) => n.text()).filter((s) => s === 'Career start' || s === 'Today')).toEqual(['Career start', 'Today'])
    expect(text).toContain('Important moments')
    expect(text).toMatch(/Counting results \(best (6|18)\)/)
    expect(w.get('.kid-rank-line').text()).toMatch(/(No points yet|\d[\d,]* pts)$/)
    const rank = w.findAll('.kid-panel-note').map((n) => flat(n.text())).find((s) => s.includes('rank counts'))
    expect(rank).toMatch(/^Her [a-z]+ rank counts her [a-z]+ best [a-z]+ results from the last 52 weeks\. Full tables are on the Stats tab\.$/)
    w.unmount()
  })

  it('the profile: the play-style note keeps its soft hyphen, the mood word is the engine-chosen face\'s word', () => {
    const w = mountKid({ ...base, profile: { ...base.profile, playStyle: 'counterpuncher' }, diary: { ...base.diary, facts: { ...base.diary.facts, moodWord: null } } } as Snapshot)
    expect(w.get('.kid-style-note').text()).toBe(`Counter${SHY}puncher`)
    expect(['Steady', 'Happy', 'Low', 'Focused', 'Tired', 'Hurt', 'On the mend', 'Angry']).toContain(w.get('.kid-tile-mood .kid-tile-lead').text())
    w.unmount()
    for (const [style, word] of [['aggressive', 'Aggressive baseliner'], ['serve-first', 'Big serve'], ['all-court', 'All-court']] as const) {
      const s = mountKid({ ...base, profile: { ...base.profile, playStyle: style } } as Snapshot)
      expect(s.get('.kid-style-note').text(), style).toBe(word)
      s.unmount()
    }
  })

  it('the radar: five axis words are the ENGINE\'s, in order; the legend, the quiet line and the fog note', () => {
    const w = mount(SkillsRadar, { props: { axes: base.radar, title: 'chart' }, attachTo: document.body })
    expect(w.findAll('.radar-axis-label').map((n) => n.text())).toEqual(SKILL_KEYS.map((k) => RADAR_AXIS_LABEL[k]))
    expect(w.findAll('.radar-legend li').map((n) => n.text())).toEqual(['Where she started', 'Where she is', 'How far she could go'])
    expect(w.get('.radar-legend-note').text()).toBe('The fainter it is, the less anyone can tell.')
    w.unmount()
    const quiet = mount(SkillsRadar, { props: { axes: base.radar.map((a) => ({ ...a, note: '' })), title: 'chart' } })
    expect(quiet.get('.radar-quiet').text()).toBe('Too early to say – still learning what she has.')
  })

  it('the coach market on the coaches tab: frame, budget block, plan row, travel, controls, tiers and a row', () => {
    const w = mountMarket()
    const text = seen(w.element)
    expect(w.get('.market-title').text()).toBe('Coach Market')
    expect(flat(w.get('.market-sub').text())).toMatch(/· .+ · \d+ coaches$/)
    expect(w.findAll('.cm-tabs [role="tab"], .cm-tabs button').map((n) => n.text())).toEqual(['Her week', 'Coaches', 'Support staff'])
    expect(w.get('.budget-label').text()).toBe('Team budget')
    expect(w.get('.budget-free').text()).toMatch(/\/week free$/)
    expect(w.get('.budget-legend').text()).toMatch(/committed\s+\$?[\d.,KM]+ weekly cap$/)
    expect(w.get('.cm-plan-note').text()).toMatch(/^Every price below is \d+(\.\d+)? sessions a week – more sessions, more money\.$/)
    expect(w.findAll('.cm-plan button, .cm-plan [role="radio"]').map((n) => n.text()).filter(Boolean)).toEqual(
      expect.arrayContaining([expect.stringMatching(/^Light \d+(\.\d+)?\/wk$/), expect.stringMatching(/^Balanced \d+(\.\d+)?\/wk$/), expect.stringMatching(/^Grind \d+(\.\d+)?\/wk$/)]),
    )
    expect(text).toContain('Coach travels to tournaments')
    expect(text).toMatch(/Coach travels to tournaments with her – (on|off)\. Press to /)
    expect(w.findAll('.drop-label').map((n) => n.text())).toEqual(['Style', 'Sort'])
    expect(w.get('#cm-sort-value').text()).toBe('Best fit')
    expect(w.findAll('.tier-name').map((n) => n.text())).toEqual(HIREABLE_TIERS.map((tier) => `${COACH_TIER_LABEL[tier]} tier`))
    expect(w.findAll('.tier-count').every((n) => /^\d+ coaches$/.test(n.text()))).toBe(true)
    expect(w.findAll('.tier-range').every((n) => /^\$[\d.,KM]+-\$[\d.,KM]+ \/wk$/.test(n.text()))).toBe(true)
    expect(w.findAll('.cm-uplift-season').every((n) => /^\+\d+\.\d-\d+\.\d% a season$/.test(n.text()))).toBe(true)
    expect(w.findAll('.cm-edge').every((n) => /^\+\d+\.\d-\d+\.\d% per match$/.test(n.text()))).toBe(true)
    expect(['Great fit', 'Good fit', 'Off-style']).toContain(w.get('.fit-pill').text())
    expect(text).toMatch(/Hire ›|Current/)
    const row = w.findAll('.cm-row').find((r) => !r.classes('current') && !r.classes('blocked'))
    expect(row, 'the fixture has a hireable row').toBeTruthy()
    expect(row!.attributes('aria-label')).toMatch(/^.+, (Budget|Middle|High|Elite) tier, (Great fit|Good fit|Off-style), \$[\d.,KM]+ a week(, chemistry -?\d+%)? – hire$/)
    expect(row!.get('.cm-price i').text()).toBe('/wk')
    w.unmount()
  })

  it('the coach market on «Her week»: the matrix, the preset row, the readout, the notes and the lock', () => {
    const w = mountMarket(base)
    expect(w.get('.hw-self-label').text()).toBe('I coach her myself')
    expect(w.findAll('.hw-block-name').map((n) => n.text())).toEqual(['General practice', 'Serve & return', 'Rally', 'Fitness', 'Match play'])
    expect(w.findAll('.hw-presets button, .hw-presets [role="radio"]').map((n) => n.text()).filter(Boolean)).toEqual(['Light', 'Balanced', 'Grind'].map((s) => expect.stringContaining(s)))
    expect(w.get('.hw-readout').text()).toMatch(/^\d+ sessions, \d+ hours(, \d+ of them two sessions a day)? – (1 day off|\d+ days off)\.( \$[\d.,KM]+ this week\.)?$/)
    expect(w.get('.hw-capacity').text()).toMatch(/^(No school this week – a day can take two sessions, if you want them\.|One session a day (while school is on|this week) – the dots are the room each day has left\.)$/)
    expect(w.get('.hw-heads').attributes('aria-label')).toBe('The week, day by day')
    expect(w.findAll('.hw-block-hours').every((n) => /^\d+ h$/.test(n.text()))).toBe(true)
    expect(w.find('.hw-box[aria-label]').attributes('aria-label')).toMatch(/^General practice on [A-Z][a-z]+$/)
    w.unmount()
    const hired = mountMarket(coached)
    // a hired coach locks the sheet: title and note come from the coach's name and the tick-box's own label
    return hired.findAll('button').find((b) => /Her week/.test(b.text()))!.trigger('click').then(() => {
      expect(hired.get('.hw-lock-title').text()).toMatch(/ sets her week\.$/)
      expect(hired.get('.hw-lock-note').text()).toBe('Tick "I coach her myself" to plan it again – it lets the coach go.')
      hired.unmount()
    })
  })

  it('the planning sheet: practice, vacation and the booked face, word for word', async () => {
    const practice = mountPlanner('practice')
    const p = seen(practice.element)
    for (const word of ['Court rental', 'Total', 'Cancel', 'Book the match', 'Practice', 'Vacation', 'Close planner']) expect(p, word).toContain(word)
    expect(p).toContain('A friendly at the club – watchable, no ranking points. One notch of fatigue, and she keeps her base recovery but loses the rest bonus for the week.')
    expect(flat(p)).toMatch(/\+ coach for the match \(.+ – the other half is on the opponent's family\)/)
    expect(flat(p)).toMatch(/ · condition \d+\/100/)
    practice.unmount()
    const vacation = mountPlanner('vacation')
    const effects = vacation.findAll('.pkg-effect').map((n) => n.text())
    expect(effects.length).toBe(ECONOMY.vacation.packages.length)
    // the space before the middle dot was the TEMPLATE's whitespace; it is now an explicit character – a buffed card must still read «/100 · injury risk»
    expect(effects.every((e) => /^\+\d+ condition → \d+\/100( · injury risk −\d+% for \d+ weeks)?$/.test(e))).toBe(true)
    expect(effects.some((e) => e.includes(' · injury risk −'))).toBe(true)
    expect(vacation.get('.plan-lead').text()).toBe('A week away – no tournaments that week, and she comes back fresher. Cancel any time before the week starts for a full refund.')
    expect(vacation.findAll('.pkg-actions button').every((b) => b.text() === 'Book')).toBe(true)
    vacation.unmount()
    for (const [paid, tail] of [[0, 'nothing is owed either way'], [30_000, 'the money comes back in full']] as const) {
      const booked = mountPlanner('practice', bookedSnapshot(paid))
      expect(flat(booked.get('.plan-lead').text())).toMatch(/^Staycation with friends – booked, (free|\$[\d.,KM]+)\. She plays no tournament while she is away\.$/)
      expect(flat(booked.get('.hint').text())).toBe(`Cancel any time before the week starts and ${tail}.`)
      expect(booked.findAll('.dialog-actions button').map((b) => b.text())).toEqual(['Keep it', 'Cancel the trip'])
      booked.unmount()
    }
    const broke = mountPlanner('practice', { ...planSnap, fundsCents: 0 } as Snapshot)
    expect(seen(broke.element)).toContain('Not enough funds')
    broke.unmount()
  })

  it('the injury stop: kicker, title, rows, both forecasts, and the closing notes', () => {
    const w = mountInjury()
    const text = seen(w.element)
    expect(w.get('.season-summary-kicker').text()).toMatch(/^Injury – /)
    expect(['She had to stop.', "She's hurt."]).toContain(w.get('.season-summary-title').text())
    expect(w.findAll('th').map((n) => n.text())).toEqual(['Injury', 'Severity', 'How', 'Out for', 'Cancelled'])
    expect(['Minor', 'Moderate', 'Major', 'Severe']).toContain(w.findAll('td')[1]!.text())
    expect(flat(w.findAll('td')[3]!.text())).toMatch(/^~\d+ wks? – back around .+ With the masseur – more like \d+ wks?, back around .+\.$/)
    expect(text).toContain('Only the weeks she is out are cancelled – anything from')
    expect(text).toContain('She comes back from this. Rest and rehab now – the news feed tracks her recovery.')
    expect(w.get('.dialog-actions button').text()).toBe('Continue')
    expect(w.findAll('td')[4]!.text()).toBe('Nothing – the layoff reaches no entry she holds')
    w.unmount()
  })

  it('the injury circumstance: all seven combinations equal the OLD composition, recomputed', () => {
    /** The pre-L2-5 formula, copied out of the component as it stood (git: InjuryStopDialog.vue before this wave). */
    const was = (kind: string, opp: string | null, stage: string | null): string => {
      if (kind === 'off-court') return 'Off court – it came on between matches.'
      const against = opp ? ` against ${opp}` : ''
      if (kind === 'retired-friendly') return `On court – she had to stop during a practice match${against}.`
      const where = stage ? ` in the ${stage}` : ''
      return `On court – she had to stop mid-match${against}${where}. The round she had reached is hers.`
    }
    const cases: [string, string | null, string | null][] = [
      ['off-court', null, null],
      ['retired-friendly', null, null],
      ['retired-friendly', 'Ana Ruiz', null],
      ['retired-match', null, null],
      ['retired-match', 'Ana Ruiz', null],
      ['retired-match', null, 'Quarterfinal'],
      ['retired-match', 'Ana Ruiz', 'Quarterfinal'],
    ]
    expect(new Set(cases.map(([k, o, s]) => was(k, o, s))).size, 'seven distinct sentences').toBe(7)
    for (const [kind, opp, stage] of cases) {
      const w = mountInjury(withReport(kind, opp, stage))
      expect(w.findAll('td')[2]!.text(), `${kind} / ${opp} / ${stage}`).toBe(was(kind, opp, stage))
      w.unmount()
    }
  })

  it('the knock: both kickers, the body part, the two choices and Proceed', async () => {
    const w = mountKnock(false)
    expect(w.get('.season-summary-kicker').text()).toMatch(/^A knock – /)
    expect(w.get('.season-summary-title').text()).toBe('Her hip.')
    expect(w.findAll('.knock-choice-verb').map((n) => n.text())).toEqual(['Rest it', 'Train through it'])
    await w.get('.knock-choice').trigger('click')
    expect(w.get('.knock-proceed').text()).toBe('Proceed')
    w.unmount()
    const again = mountKnock(true)
    expect(again.get('.season-summary-kicker').text()).toMatch(/^The same knock again – /)
    again.unmount()
  })
})

// --- 2. completeness -------------------------------------------------------------------------------------------

describe('L2-5 completeness – every string of the batch files is a wired key, and the sites this wave names call t()', () => {
  const FILES = [
    'src/components/screens/KidScreen.vue',
    'src/components/SkillsRadar.vue',
    'src/components/screens/CoachMarketScreen.vue',
    'src/components/PlanWeekSheet.vue',
    'src/components/InjuryStopDialog.vue',
    'src/components/KnockDialog.vue',
    'src/components/HerWeekTab.vue',
    'src/composables/coachingBudget.ts',
    'src/composables/coachWords.ts',
  ]
  it('no CERTAIN string homed in these files is left unwrapped', () => {
    const open = Object.entries(CATALOG.keys)
      .filter(([, v]) => v.home.some((h) => FILES.includes(h)) && !v.wrapped)
      .map(([k]) => k)
    expect(open).toEqual([])
  })

  it('the rows RU-05 names have a wired key each, and the file that owns each really calls t() with it', () => {
    const SITES: [string, string[]][] = [
      ['src/components/screens/KidScreen.vue', ['screen|Back to Home', 'Settings', '{0} years old · B-Day {1}', 'Personality', 'Condition', 'Condition: {0} percent', 'Mood', 'School', 'Friends',
        'Coach – open the Coach Market', 'Coach', 'School – {0}', 'College – {0}', 'Skills', 'Important moments', 'Her own account', 'Counting results (best {0})',
        'Her {0} rank counts her {1} best {2} results from the last 52 weeks. Full tables are on the Stats tab.', '{0} pts', 'No points yet', 'Aggressive baseliner', `Counter${SHY}puncher`,
        'Big serve', 'All-court', 'Steady', 'Happy', 'Low', 'Focused', 'Tired', 'Hurt', 'On the mend', 'Angry', 'You', '{0} tier', 'Career start', 'Today', 'First title', 'First {0} title',
        'First final', 'First {0} final', 'First prize money', 'First trip abroad',
        'Her skills: serve, return, composure, stamina and groundstrokes. The dashed contour is where she started, the solid one is where she is today, and the haze around them is how far she could go.',
        'What her coach can tell so far. The dashed shape is where she started, the solid shape is where she is, and the haze around them is how far she might go. All three sharpen as the coach learns her.',
        'What you can tell so far. The dashed shape is where she started, the solid shape is where she is, and the haze around them is how far she might go. All three sharpen as you learn her.']],
      ['src/components/SkillsRadar.vue', ['Serve', 'Return', 'Composure', 'Stamina', 'Groundstrokes', 'Where she started', 'Where she is', 'How far she could go',
        'The fainter it is, the less anyone can tell.', 'Too early to say – still learning what she has.']],
      ['src/composables/coachWords.ts', ['Self-coached', 'coach|Budget', 'Middle', 'High', 'Elite']],
      ['src/composables/coachingBudget.ts', ['Team budget', 'Coach', 'Masseur', 'Psychologist', 'Hitting partner']],
      ['src/components/screens/CoachMarketScreen.vue', ['Back', 'Coach Market', '{0} coaches', 'Her week', 'Coaches', 'market|Support staff', 'What this screen is about', '/week free', '{0} committed',
        '{0} weekly cap', '{0} /wk', 'Light', 'Balanced', 'Grind', '{0} {1}/wk', 'Every price below is {0} sessions a week – more sessions, more money.', 'Coach travels to tournaments',
        'You are coaching her yourself – there is nobody to send. Turn it on and it takes effect when you hire somebody.', 'Your sponsor pays {0}% of the second seat at the events that pay prize money – the rest is yours.',
        'The support does not pay for the second seat – hers is discounted, the coach travels at the full fare.', 'One additional fare per trip – a second seat beside hers.', '1 trip', '{0} trips',
        '{0} Her seats cost {1} over the {2} ahead; the second seat adds {3}.', '{0} {1} over the {2} she has booked this season.', '...and to junior events too', '1 more trip', '{0} more trips',
        '{0} {1} over the {2} on her card this season.', 'Send the coach', 'Not yet', 'a week at her current plan – {0} over {1} weeks.', 'Every coach here also takes', 'of every prize cheque she collects.',
        'Style', 'Sort', 'Best fit', 'Price', 'Showing fit against {0}, not the game she plays.', '{0} tier', '{0}-{1} /wk', '+{0}-{1}% a season', '+{0}-{1}% per match', '+{0}-{1}% travelling with her',
        'Great fit', 'Good fit', 'Off-style', '/wk', 'Current', '{0} pts short', 'Hire ›', 'Hire', 'Coach her yourself', 'her coach now', 'locked, {0} ranking points short', 'hire', ', chemistry {0}%',
        '{0}, {1} tier, {2}, {3} a week{4} – {5}', 'Chemistry with her: not known yet', 'Chemistry with her: {0}%', 'Your weekly coaching bill does not change.', 'Your weekly coaching bill rises by {0}.',
        'Your weekly coaching bill falls by {0}.', 'Hire {0} at {1} a week? {2}', 'your coach',
        'Let {0} go? She is self-coached from this week: the weekly bill becomes court time only, and the trained eye you were paying for goes too.',
        'You can always take her back onto the court yourself. The weekly bill becomes court time only.', 'You are coaching her yourself. The weekly bill is court time only.']],
      ['src/components/HerWeekTab.vue', ['General practice', 'Serve & return', 'Rally', 'Fitness', 'Match play', 'Light', 'Balanced', 'Grind', '1 day off', '{0} days off', ', {0} of them two sessions a day',
        '{0} this week.', '{0} sessions, {1} hours{2} – {3}.{4}', 'No school this week – a day can take two sessions, if you want them.', 'One session a day while school is on – the dots are the room each day has left.',
        'One session a day this week – the dots are the room each day has left.', 'I coach her myself', '{0} sets her week.', 'Your coach', 'Tick "{0}" to plan it again – it lets the coach go.',
        '{0} sessions is her maximum – untick one to move it.', '{0} sessions is her minimum – tick another before you take one away.', '{0} – {1} of {2} sessions', '{0} on {1}', 'The week, day by day', '{0} h', 'Next week – {0}']],
      ['src/components/PlanWeekSheet.vue', ['price|free', 'Plan {0}', 'Close planner', 'Close', '{0} · condition {1}/100', '{0} – booked, {1}. She plays no tournament while she is away.',
        'Cancel any time before the week starts and the money comes back in full.', 'Cancel any time before the week starts and nothing is owed either way.', 'Keep it', 'Cancel the trip', 'Practice', 'Vacation',
        'Off-season – family time, no matches. Try the Vacation tab.', 'A friendly at the club – watchable, no ranking points. One notch of fatigue, and she keeps her base recovery but loses the rest bonus for the week.',
        'Court rental', "+ coach for the match ({0} – the other half is on the opponent's family)", 'plan|Total', '{0} A friendly is still a match, so the week books nothing until she is back – leave it to rest.',
        '{0} A friendly is still a match, so it is out too at condition {1} – try the Vacation tab, or leave the week to training.', 'plan|Cancel', 'Injured', 'Not cleared to play', 'Book anyway', 'Book the match',
        'plan|Not enough funds', 'A week away – no tournaments that week, and she comes back fresher. Cancel any time before the week starts for a full refund.',
        '{0} A week away is still hers to book – the trip is rest, not tennis.', '+{0} condition → {1}/100', '· injury risk −{0}% for {1} weeks', 'Recommended', 'Out of reach', 'free – their own boat', 'Book']],
      ['src/components/InjuryStopDialog.vue', ['Minor', 'Moderate', 'Major', 'Severe', 'Off court – it came on between matches.', 'On court – she had to stop during a practice match against {0}.',
        'On court – she had to stop during a practice match.', 'On court – she had to stop mid-match against {0} in the {1}. The round she had reached is hers.',
        'On court – she had to stop mid-match against {0}. The round she had reached is hers.', 'On court – she had to stop mid-match in the {0}. The round she had reached is hers.',
        'On court – she had to stop mid-match. The round she had reached is hers.', 'Injury – {0}', 'She had to stop.', "She's hurt.", 'Injury', 'Severity', 'How', 'Out for',
        '~{0} wk – back around {1}', '~{0} wks – back around {1}', 'With the masseur – more like {0} wk, back around {1}.', 'With the masseur – more like {0} wks, back around {1}.', 'Cancelled',
        'Withdrawn: {0}', 'Fees refunded: +{0}', 'Nothing – those lists had closed.', 'Forfeited: {0}', 'Nothing – the layoff reaches no entry she holds',
        'Only the weeks she is out are cancelled – anything from {0} on is still booked.', 'She comes back from this. Rest and rehab now – the news feed tracks her recovery.', 'Continue']],
      ['src/components/KnockDialog.vue', ['The same knock again – {0}', 'A knock – {0}', 'Her {0}.', 'Rest it', 'Train through it', 'Proceed']],
      ['src/components/RailDashboard.vue', ['{0} committed', '{0} weekly cap', '{0} /wk']],
    ]
    const unwired: string[] = []
    const absent: string[] = []
    for (const [file, keys] of SITES) {
      const source = SRC(file)
      for (const key of keys) {
        if (!CATALOG.keys[key]?.wrapped) unwired.push(`${file}: ${key}`)
        // the file itself asks for the key (single, double or backtick quotes; escaped apostrophes as the source spells them)
        const literal = key.replaceAll("'", "\\'")
        if (!source.includes(`'${literal}'`) && !source.includes(`"${key}"`) && !source.includes(`\`${key}\``)) absent.push(`${file}: ${key}`)
      }
    }
    expect(unwired).toEqual([])
    expect(absent, 'a key the table names that its own file does not call').toEqual([])
  })
})

// --- 3. the seams ----------------------------------------------------------------------------------------------

describe('L2-5 seams – getters over t() that mirror an engine table are pinned to it, and setup-time rows follow the locale', () => {
  it('COACH_TIER_WORD is the engine\'s COACH_TIER_LABEL, word for word, for every tier (English)', () => {
    const tiers = Object.keys(COACH_TIER_LABEL) as CoachTier[]
    expect(tiers.length).toBe(5)
    for (const tier of tiers) expect(COACH_TIER_WORD[tier], tier).toBe(COACH_TIER_LABEL[tier])
  })

  it('the radar\'s getter table is the engine\'s RADAR_AXIS_LABEL, word for word, for every skill (English)', () => {
    const w = mount(SkillsRadar, { props: { axes: base.radar, title: 'x' } })
    const drawn = w.findAll('.radar-axis-label').map((n) => n.text())
    expect(drawn).toEqual(SKILL_KEYS.map((k) => RADAR_AXIS_LABEL[k]))
    expect(drawn.length).toBe(5)
  })

  it('the option rows are computeds: flipping the locale re-labels the plan row, the preset row and the tab names without a remount', async () => {
    installCatalog('ru', { Light: 'LIGHT*', 'Her week': 'WEEK*', '{0} {1}/wk': 'PLAN* {0} {1}', Coaches: 'COACHES*' })
    const w = mountMarket(coached) // the coaches tab: it is the one that draws the plan row
    expect(seen(w.element)).toContain('Her week')
    await setLocale('ru')
    await w.vm.$nextTick()
    const after = seen(w.element)
    expect(after).toContain('WEEK*')
    expect(after).toContain('LIGHT*')
    expect(after).toMatch(/PLAN\* /)
    w.unmount()
  })

  it('the count phrases are whole messages: the English singular and plural are separate literals, and the frame takes the number as a param', () => {
    installCatalog('ru', { '1 day off': 'ONE*', '{0} days off': 'MANY* {0}' })
    const src = SRC('src/components/HerWeekTab.vue')
    expect(src).toContain("t('1 day off')")
    expect(src).toContain("t('{0} days off', [daysOff.value])")
    const injury = SRC('src/components/InjuryStopDialog.vue')
    expect(injury).toContain("t('~{0} wk – back around {1}'")
    expect(injury).toContain("t('~{0} wks – back around {1}'")
  })
})

// --- 4. the context tags ---------------------------------------------------------------------------------------

describe('L2-5 context tags – added where one English needs two Russians (measured against every other batch table)', () => {
  const TAGS: [string, string][] = [
    ['screen|Back to Home', 'Back to Home'],
    ['plan|Cancel', 'Cancel'],
    ['plan|Total', 'Total'],
    ['plan|Not enough funds', 'Not enough funds'],
    ['coach|Budget', 'Budget'],
    ['market|Support staff', 'Support staff'],
  ]
  it.each(TAGS)('%s is a wired key that renders the bare English', (tagged, bare) => {
    expect(CATALOG.keys[tagged]?.wrapped, `${tagged} is not wired`).toBe(true)
    expect(t(tagged)).toBe(bare)
  })

  it('the mounted sites ask for the TAGGED key, not the bare one (a stand-in catalog that only knows the tags and decoys for the bare words)', async () => {
    installCatalog('ru', {
      'screen|Back to Home': 'BACK*', 'Back to Home': 'BARE*', 'plan|Cancel': 'CANCEL*', Cancel: 'BARE*', 'plan|Total': 'TOTAL*', Total: 'BARE*',
      'plan|Not enough funds': 'FUNDS*', 'Not enough funds': 'BARE*', 'coach|Budget': 'BUDGET*', Budget: 'BARE*', 'market|Support staff': 'STAFF*', 'Support staff': 'BARE*',
    })
    await setLocale('ru')
    const kid = mountKid()
    expect(kid.get('.kid-back').attributes('aria-label')).toBe('BACK*')
    kid.unmount()
    const planner = mountPlanner('practice', { ...planSnap, fundsCents: 0 } as Snapshot)
    const p = seen(planner.element)
    for (const marker of ['CANCEL*', 'TOTAL*', 'FUNDS*']) expect(p, marker).toContain(marker)
    expect(p, 'the planner never asks for a bare word that has a tag').not.toContain('BARE*')
    planner.unmount()
    const market = mountMarket(coached)
    const m = seen(market.element)
    expect(m).toContain('STAFF*')
    expect(m, 'the market never asks for the bare Support staff').not.toContain('BARE*')
    market.unmount()
    const budgetTier = mountMarket({ ...coached, coachMarket: coached.coachMarket.map((r) => ({ ...r })) } as Snapshot)
    expect(seen(budgetTier.element), 'the Budget tier header and chip read the tagged word').toContain('BUDGET*')
    budgetTier.unmount()
  })
})

// --- 5. the Russian smoke --------------------------------------------------------------------------------------

describe('L2-5 Russian smoke – ru.json read by key, no Cyrillic typed here', () => {
  it('a stand-in catalog proves the call sites ask the catalog (latin markers, one per surface)', async () => {
    installCatalog('ru', {
      Skills: 'SKILLS*', 'Where she started': 'STARTED*', 'Important moments': 'MOMENTS*', 'Coach Market': 'MARKET*', 'Team budget': 'TEAMBUDGET*', 'Court rental': 'RENTAL*', 'Book the match': 'BOOKM*',
      'Severity': 'SEVERITY*', 'Rest it': 'REST*', 'Serve & return': 'SERVEKIND*', 'Her own account': 'ACCOUNT*', Serve: 'SERVE*',
    })
    await setLocale('ru')
    const kid = seen(mountKid().element)
    for (const word of ['SKILLS*', 'STARTED*', 'MOMENTS*', 'SERVE*']) expect(kid, word).toContain(word)
    document.body.innerHTML = ''
    const market = seen(mountMarket(coached).element)
    for (const word of ['MARKET*', 'TEAMBUDGET*']) expect(market, word).toContain(word)
    document.body.innerHTML = ''
    expect(seen(mountMarket(base).element), 'Her week (the self-coached landing)').toContain('SERVEKIND*')
    document.body.innerHTML = ''
    const plan = seen(mountPlanner().element)
    for (const word of ['RENTAL*', 'BOOKM*']) expect(plan, word).toContain(word)
    document.body.innerHTML = ''
    expect(seen(mountInjury().element)).toContain('SEVERITY*')
    document.body.innerHTML = ''
    expect(seen(mountKnock().element)).toContain('REST*')
  })

  it('the REAL ru.json: every approved row on these surfaces renders his Russian; every unapproved one renders English and is counted', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    resetMisses()
    const mounted = [mountKid(), mountMarket(coached), mountMarket(base), mountPlanner('practice'), mountPlanner('vacation'), mountInjury(), mountKnock()]
    const everything = mounted.map((m) => seen(m.element)).join('\n')
    const HERE = /KidScreen|SkillsRadar|CoachMarketScreen|PlanWeekSheet|InjuryStopDialog|KnockDialog|HerWeekTab|coachingBudget|coachWords|RailDashboard/
    const wiredHere = Object.keys(RU).filter((k) => CATALOG.keys[k]?.wrapped && CATALOG.keys[k]!.home.some((h) => HERE.test(h)))
    // the approved arm: today `wiredHere` is empty (no RU-05 row is approved) and the loop wakes by itself the day one is
    for (const key of wiredHere) expect(everything, `${key} is approved and wired, so his Russian must render`).toContain(RU[key]!)
    // the unapproved arm: English on screen, and the miss counter says so (ruling 4 as a number)
    expect(everything).toContain('Coach Market')
    expect(missCount(), 'unapproved rows must be counted as misses').toBeGreaterThan(100)
    for (const key of ['Coach Market', 'Skills', 'Where she started', 'Court rental', 'Severity', 'Rest it', 'market|Support staff']) expect(missedKeys(), key).toContain(key)
    console.log(`[L2-5 smoke] ru.json: ${Object.keys(RU).length} keys; approved AND wired on these screens: ${wiredHere.length}; distinct misses on seven mounted surfaces: ${missedKeys().length}`)
    mounted.forEach((m) => m.unmount())
  })
})

// --- 6. the xx sweep -------------------------------------------------------------------------------------------

describe('L2-5 xx sweep – no unwrapped literal in the frames, and the phone still holds longer words', () => {
  /** What is NOT frame copy and is allow-listed BY NAME or by shape: names, dates and week labels, money, and the engine's own prose. */
  const ENGINE_BORN: RegExp[] = [
    // ⚠ NO NAME-SHAPED PATTERNS HERE (a «First Last» regex swallows «Coach Market» and a «Word» regex swallows «Skills» – the first mutation run of this
    // file proved it): a name is allowed because the SNAPSHOT carries it (see `ENGINE_PROSE`), never because it is capitalised.
    /^W\d+( \d{4}| ’\d{2})?$/, /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d+(?: – (?:[A-Za-z]+ )?\d+)?(?:, \d{4})?$/, /^\$[\d,.]+[KMB]?$/, /^[−-]?\$[\d,.]+/,
    /^(?:Local|Regional|National|Junior|Pro|W\d+|J\d+|WTA|ITF)\b/, /^\d+°?$/, /^#\d+$/, /^[\d,]+$/, /^\d+(?:-\d+)*$/, /^[—–-]$/, /^\?$/, /^%$/, /^\d+(?:\.\d+)?%$/,
    // the market's headline is the kid's NAME and the separator that follows it: a text node, not copy
    /^[A-Z][a-z]+ [A-Z][a-z]+ ·$/,
    // ⚠ THE NAMED LEFTOVERS OF THIS WAVE, each for its reason: the counting table's own headers and total (CountingResultsTable.vue – RU-07 / RU-13's landing,
    // the profile only mounts it) and the Household strip and the support-staff tab the market mounts (RU-06's).
    /^(?:Week|Tier|Pts|Total|Household, every week|in|out|left over|short|Hire|Let go|Locked)$/, /^No counted results yet – enter a tournament to earn ranking points\.$/,
  ]
  const ENGINE_PROSE = (snap: Snapshot): ((leak: string) => boolean) => {
    // everything the ENGINE wrote: the snapshot it handed over, plus what the screens read straight from engine functions and tables
    const corpus = [
      JSON.stringify(snap),
      `${snap.profile?.kidName} ${snap.profile?.kidLastName}`,
      // the flag's accessible name is the country in words – RU-13D's landing (composables/countries.ts), a named leftover of this wave
      JSON.stringify(COUNTRY_NAMES),
      JSON.stringify(ECONOMY.vacation),
      ...(snap.coachMarket ?? []).flatMap((r) => [coachBlurb(r.id) ?? '', coachProfileNote(r.tier, r.fit), coachProfileNote(r.tier, 'good'), coachProfileNote(r.tier, 'off')]),
    ].join('\n')
    return (leak) => {
      const prose = leak.replace(/^[\p{Extended_Pictographic}‍️\s]+/u, '').trim()
      return prose.length > 2 && corpus.includes(prose)
    }
  }
  const allow = [...DEFAULT_ALLOW, ...ENGINE_BORN]
  const screenLeaks = (root: Element, snap: Snapshot): string[] => hardcodeLeaks(root, allow).filter((l) => !ENGINE_PROSE(snap)(l))

  it('the profile, both faces of the market, the planner\'s three faces, the injury report and the knock: nothing the SCREEN wrote is left unbracketed', async () => {
    await installPseudoLocale()
    const results: [string, string[]][] = []
    const run = (label: string, w: VueWrapper, snap: Snapshot): void => {
      results.push([label, screenLeaks(w.element, snap)])
      w.unmount()
    }
    run('profile', mountKid(), base)
    run('market/coaches', mountMarket(coached), coached)
    run('market/week', mountMarket(base), base)
    run('plan/practice', mountPlanner('practice'), planSnap)
    run('plan/vacation', mountPlanner('vacation'), planSnap)
    run('plan/booked', mountPlanner('practice', bookedSnapshot(30_000)), planSnap)
    const reported = withReport('retired-match', 'Ana Ruiz', 'Quarterfinal')
    run('injury', mountInjury(reported), reported)
    run('knock', mountKnock(true), knockSnapshot(true))
    console.log(`[L2-5 xx] leaks: ${JSON.stringify(results)}`)
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

  it('the radar card and a coach market row hold a 375x667 phone with every word longer (numbers printed)', async () => {
    const measure = (): { label: string; r: ReturnType<typeof widest> }[] => {
      const kid = mountKid()
      const radar = kid.find('.kid-panel-radar')
      expect(radar.exists(), 'the radar card (.kid-panel-radar) is on the fixture\'s profile').toBe(true)
      const a = { label: 'the radar card', r: widest(radar.element) }
      kid.unmount()
      const market = mountMarket(coached)
      const row = market.find('.cm-row')
      expect(row.exists(), 'a coach row (.cm-row) is on the fixture\'s market').toBe(true)
      const b = { label: 'a coach market row', r: widest(row.element) }
      const meter = market.find('.budget-meter')
      expect(meter.exists(), 'the team budget block (.budget-meter) is on the fixture\'s market').toBe(true)
      const c = { label: 'the budget block', r: widest(meter.element) }
      market.unmount()
      return [a, b, c]
    }
    const english = measure()
    resetI18nForTests(null)
    await installPseudoLocale()
    const xx = measure()
    const pct = (r: number): string => `${(r * 100).toFixed(0)}%`
    console.log(
      '[L2-5 xx] 375x667, share of the box\'s room, English -> xx: ' +
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

  /** THE RADAR'S AXIS WORDS ARE SVG TEXT: they never wrap, an anchor places them (`end` grows leftwards, `start` rightwards), and the room they
   *  have is what the 300-unit viewBox leaves on that side. `widest()` cannot see them under xx (the pseudo-locale's padding gives a single word a
   *  place to break, so a CSS box would be charged nothing – and an SVG label would overflow all the same), so this measures each label as a
   *  `nowrap` probe at the label's own font size, in user units, against its own room. `textOf` swaps the words (English / what the page shows /
   *  his DRAFT Russian read out of the batch table at run time – a row he has not approved, measured, never typed here). */
  function axisFit(root: Element, textOf: (index: number, shown: string) => string): { index: number; text: string; need: number; room: number; share: number }[] {
    return Array.from(root.querySelectorAll('.radar-axis-label')).map((el, index) => {
      const x = Number(el.getAttribute('x'))
      const anchor = el.getAttribute('text-anchor')
      const room = anchor === 'end' ? x : anchor === 'start' ? 300 - x : 2 * Math.min(x, 300 - x)
      const text = textOf(index, (el.textContent ?? '').trim())
      const probe = document.createElement('span')
      probe.textContent = text
      probe.style.whiteSpace = 'nowrap'
      probe.style.fontSize = getComputedStyle(el).fontSize || '10.5px'
      document.body.appendChild(probe)
      const need = demandedWidth(probe, 300)
      probe.remove()
      return { index, text, need, room, share: need / room }
    })
  }

  it('the radar\'s five axis words keep inside the viewBox in English and under xx; his DRAFT Russian words are measured and printed', async () => {
    const draft = new Map(
      readRows(listDocs()).rows.filter((r) => r.doc.startsWith('ru-profile-coaching') && r.english !== null && r.russian !== null).map((r) => [r.english!, r.russian!] as const),
    )
    const mountRadar = (): VueWrapper => mount(SkillsRadar, { props: { axes: base.radar, title: 'chart' }, attachTo: document.body })
    const english = mountRadar()
    const en = axisFit(english.element, (_i, shown) => shown)
    const ru = axisFit(english.element, (i) => draft.get(RADAR_AXIS_LABEL[SKILL_KEYS[i]!]) ?? '')
    english.unmount()
    await installPseudoLocale()
    const pseudo = mountRadar()
    const xx = axisFit(pseudo.element, (_i, shown) => shown)
    pseudo.unmount()
    const pct = (r: number): string => `${(r * 100).toFixed(0)}%`
    const line = (label: string, rows: typeof en): string => `${label}: ` + rows.map((r) => `«${r.text}» ${pct(r.share)} (${r.need.toFixed(0)} of ${r.room.toFixed(0)} units)`).join(' · ')
    console.log(`[L2-5 xx] radar axis words, share of the room the viewBox leaves each side (SVG text never wraps) – ${line('English', en)} || ${line('xx', xx)} || ${line('his DRAFT Russian (unapproved)', ru)}`)
    expect(en.length).toBe(5)
    for (const r of en) expect(r.share, `English «${r.text}» overflows its side of the viewBox`).toBeLessThanOrEqual(1)
    expect(xx.every((r, i) => r.need > en[i]!.need), 'xx made the axis words no longer – the measurement did not see them').toBe(true)
    // ⚠ WHY xx IS PRINTED AND NOT BOUNDED HERE: the pseudo-locale pads a LONE WORD by repeating it («⟦Groundstrokes Groundstrokes⟧» – +120%, not the +30%
    // it gives a sentence), and even the English word doubled cannot fit the 82 units that side of the viewBox leaves, so a bound on it would redden by
    // construction and say nothing about Russian. The honest bound is the owner's own DRAFT words: the five of them must fit their sides TODAY, and the
    // day a longer draft (or a longer approved word) overflows, this reddens and sends the chart to phone LQA before it ships.
    expect(ru.every((r) => r.text !== ''), 'the batch table still carries a Russian draft for each of the five axes').toBe(true)
    for (const r of ru) expect(r.share, `his draft «${r.text}» overflows its side of the viewBox`).toBeLessThanOrEqual(1)
  })

  it('the longest injury report (retirement, opponent, stage, masseur forecast) still reaches Continue on a 375x667 phone under xx', async () => {
    await installPseudoLocale()
    const w = mountInjury(withReport('retired-match', 'Ana Ruiz', 'Quarterfinal'))
    const fit = assertDismissReachable(w.get('.dialog-card').element, w.get('.dialog-actions button').element, PHONE, 'InjuryStopDialog under xx')
    console.log(`[L2-5 xx] injury report under xx: card ${fit.cardWidth.toFixed(0)}x${fit.cardHeight.toFixed(0)}, ${fit.shape}, dismiss ${fit.dismissTop.toFixed(0)}..${fit.dismissBottom.toFixed(0)} of ${PHONE.height}`)
    w.unmount()
  })
})
