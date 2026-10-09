// L2-8 – THE NET UNDER RU-08: THE MATCH VIEWER'S CHROME, THE REPLAY SHELL, THE PRACTICE FLOW AND THE SHARED BOX SCORE.
// docs/specs/i18n-2026-10.md §8, docs/localization/ru-match-viewer-commentary-2026-10.md.
//
// Six questions, asked of the REAL components mounted and of the REAL catalog (the L2-3 … L2-7 nets' shape):
//   1. PARITY. With no catalog the English renders as it shipped – the wiring changed no word (invariant 4). The viewer's own families
//      (match-viewer, match-viewer-parity, screen-I's pins) are the wide net; what is here are the anchors for the NEW seams – the eight
//      momentum words, the shout picker that holds an index, the rail, the retirement alert cut around its score, the practice card.
//   2. COMPLETENESS. Every CERTAIN string of the batch files is a WIRED key, and every site this wave says it wired really calls `t()`.
//   3. THE SEAMS. Tables of words are getters and the rows are computeds: a locale flip re-labels a MOUNTED viewer, picker, log and box score.
//   4. THE CONTEXT TAG AND THE TWO BARE KEYS. `practice|vs` is the one tag; `Winners` and `Watch again` stay bare on purpose (the owner's tables
//      disagree about ONE surface – his reading settles the value, a tag cannot split it).
//   5. THE RUSSIAN SMOKE. The REAL `src/i18n/ru.json` is installed and the locale flipped. ⚠ NO CYRILLIC LITERAL LIVES IN THIS FILE – every
//      expectation is READ from ru.json by key. As of this wave no RU-08 row is APPROVED, so the unapproved arm is the one that bites today.
//   6. THE `xx` SWEEP. No unbracketed chrome where a string is wired, and the tightest surfaces still hold a 375x667 phone with every word
//      longer. The numbers print.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import '../../src/style.css'

import MatchViewer from '../../src/components/MatchViewer.vue'
import MatchReplay from '../../src/components/MatchReplay.vue'
import PracticeFlow from '../../src/components/PracticeFlow.vue'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import { KID_ID } from '../../src/engine/world'
import type { AnnotatedMatch } from '../../src/viz/types'
import type { MatchOptions, MatchPlayer, Side } from '../../src/engine/match/types'
import type { WorldMatch } from '../../src/shared/protocol'
import { installCatalog, missCount, missedKeys, resetI18nForTests, resetMisses, setLocale, t } from '../../src/i18n'
import { installMemoryStorage } from './setup'
import { PHONE, availableWidth, demandedWidth, setViewport } from './fits'
import { DEFAULT_ALLOW, hardcodeLeaks, installPseudoLocale } from './pseudoloc'

/** His approved Russian, as the importer compiled it. Every Russian expectation below is read from here by key. */
const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
const CATALOG = JSON.parse(readFileSync('src/i18n/catalog.en.json', 'utf8')) as { keys: Record<string, { home: string[]; wrapped?: true }> }
const SRC = (path: string): string => readFileSync(path, 'utf8')

// --- the fixtures ----------------------------------------------------------------------------------------------

function player(overrides: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id: 'p', name: 'P', serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, ...overrides }
}
/** The same recipe MatchReplay.vue uses: a seeded match is a pure function of (a, b, opts). */
function fixture(seed = 'component-fixture') {
  const a = player({ id: 'a', name: 'Vera Novak', serve: 62 })
  const b = player({ id: 'b', name: 'Ines Duval', serve: 48 })
  const opts: MatchOptions = { surface: 'hard', tour: JUNIOR_TOUR, seed }
  const match = annotateMatch(simulateMatch(a, b, opts), a, b, opts)
  return { a, b, opts, match }
}
interface ViewerOpts {
  mode?: 'live' | 'replay'
  rankA?: number | null
  rankB?: number | null
  proceedLabel?: string | null
  match?: AnnotatedMatch
  a?: MatchPlayer
  b?: MatchPlayer
}
function mountViewer(o: ViewerOpts = {}): VueWrapper {
  const f = fixture()
  setViewport(PHONE)
  return mount(MatchViewer, {
    props: {
      match: o.match ?? f.match,
      playerA: o.a ?? f.a,
      playerB: o.b ?? f.b,
      surface: 'hard' as const,
      mode: o.mode ?? 'replay',
      ...(o.rankA !== undefined ? { rankA: o.rankA } : {}),
      ...(o.rankB !== undefined ? { rankB: o.rankB } : {}),
      ...(o.proceedLabel !== undefined ? { proceedLabel: o.proceedLabel } : {}),
    },
    attachTo: document.body,
  })
}
/** The same fixture with every point's win probability pinned – the way to put the caption in a chosen band without touching the engine. */
function withProb(p: number): AnnotatedMatch {
  const { match } = fixture()
  return { ...match, points: match.points.map((pt) => ({ ...pt, winProbA: p })) }
}
/** The same fixture with HER in it and a retirement on the record (`result.retired` is the only fact the viewer reads about it). */
function retiredFixture(side: Side) {
  const { a, b, match } = fixture()
  const her = { ...a, id: KID_ID, name: 'Olivia Grant' }
  const hurt: AnnotatedMatch = { ...match, result: { ...match.result, retired: { side, pointNumber: match.points.length } } }
  return { her, opp: b, match: hurt }
}
const A: MatchPlayer = { id: 'kid', name: 'Vera Novak', serve: 58, ret: 55, composure: 42, stamina: 61, groundstrokes: 56 }
const B: MatchPlayer = { id: 'opp', name: 'Ines Duval', serve: 60, ret: 57, composure: 55, stamina: 60, groundstrokes: 58 }
/** A stored record, exactly the shape the Season bracket and the Home feed hand to the replay. */
function record(over: Partial<WorldMatch> = {}): WorldMatch {
  return { eventId: 'local-open-1', round: 1, aId: A.id, bId: B.id, winnerId: A.id, seed: 'l28-replay', score: '6-4 6-3', surface: 'hard', oppName: B.name, a: A, b: B, ...over }
}
/** A friendly: she is side A under the kid's real id, the opponent has no rank. */
function friendly(): WorldMatch {
  return record({ eventId: 'practice', aId: KID_ID, bId: B.id, winnerId: KID_ID, seed: 'l28-friendly', a: { ...A, id: KID_ID } })
}

// --- the fake clock (match-viewer.test.ts' own driver: one frame() is one paint) ------------------------------

const FRAME_MS = 250
const SEATS_HOLD_MS = 2000
function driver() {
  const realRaf = globalThis.requestAnimationFrame
  const realCaf = globalThis.cancelAnimationFrame
  vi.useFakeTimers()
  let pending: FrameRequestCallback | null = null
  let pendingId = 0
  let nextId = 1
  let now = 0
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    pending = cb
    pendingId = nextId++
    return pendingId
  }
  globalThis.cancelAnimationFrame = (id: number): void => {
    if (id === pendingId) pending = null
  }
  return {
    async start(): Promise<void> {
      vi.advanceTimersByTime(SEATS_HOLD_MS)
      await nextTick()
    },
    async frame(): Promise<boolean> {
      const cb = pending
      if (!cb) return false
      pending = null
      now += FRAME_MS
      cb(now)
      await nextTick()
      return true
    },
    async frames(n: number): Promise<void> {
      for (let i = 0; i < n; i++) if (!(await this.frame())) return
    },
    restore(): void {
      vi.useRealTimers()
      globalThis.requestAnimationFrame = realRaf
      globalThis.cancelAnimationFrame = realCaf
    },
  }
}
let liveDriver: ReturnType<typeof driver> | null = null

/** A LIVE viewer walked into the middle of the match (and on until a serve speed is on the court, when it shows). */
async function midMatch(): Promise<VueWrapper> {
  const d = (liveDriver = driver())
  const w = mountViewer({ mode: 'live', rankA: 12, rankB: 34 })
  await d.start()
  await d.frames(20)
  for (let i = 0; i < 400 && !w.find('.mv-speed').exists(); i++) if (!(await d.frame())) break
  return w
}
async function skipToResult(w: VueWrapper): Promise<void> {
  const skip = w.findAll('button').find((b) => b.text() === 'Skip to the result' || b.classes().includes('mv-skip'))
  expect(skip, 'no skip control').toBeTruthy()
  await skip!.trigger('click')
  await nextTick()
}

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})
afterEach(() => {
  liveDriver?.restore()
  liveDriver = null
  vi.useRealTimers()
  document.body.innerHTML = ''
  document.documentElement.lang = 'en'
})

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

describe('L2-8 parity – the viewer, the replay shell and the practice flow as they shipped, with no catalog', () => {
  it('the live bar before the first ball: both plates with their full names, the shout row, the skip link, the Live badge, the panel words', () => {
    const w = mountViewer({ mode: 'live' })
    const buttons = w.findAll('button').map((b) => b.text())
    for (const word of ['Full', 'Key', '1×', '2×', '4×', 'Shout 📣', 'Skip to the result']) expect(buttons, word).toContain(word)
    const all = seen(w.element)
    for (const word of ['Every point', 'Key points only', 'Normal speed', 'Double speed', 'Quadruple speed', 'How much of the match to watch', 'Playback speed', 'What to shout']) {
      expect(all, word).toContain(word)
    }
    expect(w.findAll('.mv-shout-pick option').map((o) => o.text())).toEqual(['Still here.', 'Take your time.', 'I saw that.', 'Next one.', 'Drink something.', 'Enjoy it.'])
    expect(w.get('.mv-live').text()).toBe('Live')
    expect(w.findAll('.mv-stat-label').map((n) => n.text())).toEqual(['Momentum', '1st serve %', 'Break points'])
    expect(w.get('.mv-stat-note').text()).toBe('Not started')
    expect(w.get('svg.mv-mom').attributes('aria-label')).toBe('Momentum: Not started')
    w.unmount()
  })

  it('the live scoreboard in the middle of the match: the clock name, the serving suffix, the ranks, the serve-speed unit', async () => {
    const w = await midMatch()
    const clock = w.get('.mv-clock')
    expect(clock.attributes('aria-label')).toBe(`Elapsed match time ${clock.text()}`)
    const ends = w.findAll('.ends-labels span').map((n) => flat(n.text()))
    expect(ends.filter((e) => e.endsWith(' · serving')), 'exactly one end is serving').toHaveLength(1)
    expect(w.findAll('.mv-prank').map((n) => n.text())).toEqual(['#12', '#34'])
    expect(w.get('.mv-speed-unit').text()).toBe('km/h')
    const rails = w.findAll('.mv-beat-set').map((n) => n.text()).filter(Boolean) // the preview's rows belong to no set and carry an empty rail
    expect(rails.length, 'the match has begun – its beats sit under rails').toBeGreaterThan(0)
    expect(rails.every((r) => /^S\d$/.test(r)), `the rail words: ${rails.join()}`).toBe(true)
    w.unmount()
  })

  it.each([
    [0.95, 'Almost there'],
    [0.8, 'Well ahead'],
    [0.6, 'Slight edge'],
    [0.5, 'Even'],
    [0.35, 'Uphill'],
    [0.2, 'Well behind'],
    [0.05, 'Hanging on'],
  ])('the momentum caption at p = %s is «%s» (the seven bands, and its accessible name carries it)', async (p, word) => {
    const w = mountViewer({ match: withProb(p) })
    await skipToResult(w)
    expect(w.get('.mv-stat-note').text()).toBe(word)
    expect(w.get('svg.mv-mom').attributes('aria-label')).toBe(`Momentum: ${word}`)
    w.unmount()
  })

  it('a finished replay: the bar swaps to two buttons, and the counter says how many points were played', async () => {
    const w = mountViewer({ proceedLabel: 'To the result' })
    await skipToResult(w)
    expect(w.get('.mv-controls-done').findAll('button').map((b) => b.text())).toEqual(['Watch again ↻', 'To the result'])
    expect(w.get('.mv-score').text()).toMatch(/^\d+ points played$/)
    w.unmount()
    const bare = mountViewer()
    await skipToResult(bare)
    expect(bare.get('.mv-actions').findAll('button').map((b) => b.text())).toEqual(['Watch again ↻'])
    bare.unmount()
  })

  it('the shout: the picker holds a phrase, the button puts it in the log as a quoted row under its set rail', async () => {
    const d = (liveDriver = driver())
    const w = mountViewer({ mode: 'live' })
    await d.start()
    await w.get('.mv-shout-pick').setValue('I saw that.')
    await w.get('.mv-shout-go').trigger('click')
    const said = w.get('.mv-beat.said')
    expect(said.get('q').text()).toBe('I saw that.')
    expect(said.get('.mv-beat-set').text()).toBe('S1')
    w.unmount()
  })

  it('the retirement alert: her name, the score inside its own element, the reason, and the way back', async () => {
    const { her, opp, match } = retiredFixture(0)
    const w = mountViewer({ match, a: her, b: opp, proceedLabel: 'To the result' })
    await skipToResult(w)
    const card = w.get('.mv-hurt')
    expect(card.get('.mv-hurt-title').text()).toBe('Olivia Grant could not continue.')
    expect(flat(card.get('.dialog-message').text())).toMatch(/^She retired hurt at .+\. A long match on tired legs\.$/)
    expect(card.get('.dialog-message .num').text().length, 'the score keeps its own element').toBeGreaterThan(2)
    expect(card.get('button.primary').text()).toBe('Stay with her')
    w.unmount()
  })

  it('the replay shell: the default title, a caller\'s own title, the close control and the pair under the heading', () => {
    const w = mount(MatchReplay, { props: { match: record() }, attachTo: document.body })
    expect(w.text()).toContain('Match replay')
    expect(w.text()).toContain('Vera Novak vs Ines Duval')
    const close = w.get('button[aria-label="Close replay"]')
    expect(close.attributes('title')).toBe('Close')
    w.unmount()
    const titled = mount(MatchReplay, { props: { match: record(), title: 'College league' }, attachTo: document.body })
    expect(titled.text()).toContain('College league')
    expect(titled.text()).not.toContain('Match replay')
    titled.unmount()
  })

  it('the friendly: the card before the match, the box score after it, and the line under the table', async () => {
    setViewport(PHONE)
    const w = mount(PracticeFlow, { props: { match: friendly(), week: 12, kidRank: 9 }, attachTo: document.body, global: { stubs: { teleport: true } } })
    expect(w.text()).toContain('Practice match')
    expect(w.get('.scene-round').text()).toBe('Friendly at the club')
    expect(w.findAll('.scene-rank').map((n) => n.text())).toEqual(['#9', 'sparring partner'])
    expect(w.get('.scene-vs').text()).toBe('vs')
    expect(w.get('.pf-chips .pill').text()).toBe('No ranking points')
    expect(w.findAll('.tf-actions button').map((b) => b.text())).toEqual(['Skip to result', 'Watch it'])
    expect(w.findAll('button.link').map((b) => b.text())).toContain('To result')
    await w.findAll('.tf-actions button')[0]!.trigger('click')
    expect(['Win', 'Loss']).toContain(w.get('.tf-badge').text())
    expect(w.get('section.tf-card p.hint').text()).toMatch(/ vs .* · practice – no ranking points$/)
    expect(w.findAll('table tbody th').map((n) => n.text())).toEqual(['Aces', 'Double faults', 'Winners', 'Unforced errors', 'Max serve'])
    expect(w.findAll('table tbody tr:last-child td').map((n) => n.text())).toSatisfy((cells: string[]) => cells.length === 2 && cells.every((c) => /^\d+ km\/h$/.test(c)))
    expect(w.get('table thead .ph-rank').text()).toBe('#9')
    expect(w.findAll('section.tf-card p.hint').map((n) => n.text()).join('|')).toMatch(/Avg rally \d+\.\d shots · ~/)
    expect(w.findAll('.tf-actions button').map((b) => b.text())).toEqual(['Watch again', 'Done'])
    w.unmount()
  })
})

// --- 2. completeness -------------------------------------------------------------------------------------------

describe('L2-8 completeness – every string of the viewer files is a wired key, and the sites this wave names call t()', () => {
  const FILES = [
    'src/components/MatchControls.vue',
    'src/components/MatchViewer.vue',
    'src/components/MatchReplay.vue',
    'src/components/PracticeFlow.vue',
    'src/components/ui/BoxScoreTable.vue',
    'src/composables/matchReadout.ts',
    'src/composables/matchStatTable.ts',
  ]
  it('no CERTAIN string homed in these files is left unwrapped', () => {
    const open = Object.entries(CATALOG.keys)
      .filter(([, v]) => v.home.some((h) => FILES.includes(h)) && !v.wrapped)
      .map(([k]) => k)
    expect(open).toEqual([])
  })

  it('the rows RU-08 names have a wired key each, and the file that owns each really calls t() with it', () => {
    const SITES: [string, string[]][] = [
      ['src/components/MatchControls.vue', ['Every point', 'Full', 'Key points only', 'Key', 'Normal speed', '1×', 'Double speed', '2×', 'Quadruple speed', '4×', 'How much of the match to watch',
        'Playback speed', 'What to shout', 'Shout 📣', 'Skip to the result', 'Watch again ↻']],
      ['src/components/MatchViewer.vue', ['Live', 'Elapsed match time {0}', 'km/h', 'TB', '· serving', '#{rank}', 'Momentum', 'Momentum: {0}', '1st serve %', 'Break points',
        'Warming up. The first ball is on its way.', 'Still here.', 'Take your time.', 'I saw that.', 'Next one.', 'Drink something.', 'Enjoy it.', 'S{0}', '{0} could not continue.',
        'She retired hurt at', 'A long match on tired legs.', 'Stay with her', 'Watch again ↻']],
      ['src/composables/matchReadout.ts', ['Not started', 'Almost there', 'Well ahead', 'Slight edge', 'Even', 'Uphill', 'Well behind', 'Hanging on', '{0} points played']],
      ['src/composables/matchStatTable.ts', ['Aces', 'Double faults', 'Winners', 'Unforced errors', 'Max serve', '{0} km/h']],
      ['src/components/MatchReplay.vue', ['Match replay', '{0} vs {1}', 'Close replay', 'Close']],
      ['src/components/PracticeFlow.vue', ['Practice match', 'To result', 'Friendly at the club', '#{rank}', 'practice|vs', 'sparring partner', 'No ranking points', 'Skip to result', 'Watch it',
        'To the result', 'Win', 'Loss', '{0} vs {1} · practice – no ranking points', 'Avg rally {0} shots · ~{1}', 'Watch again', 'Done']],
      ['src/components/ui/BoxScoreTable.vue', ['#{rank}']],
    ]
    const unwired: string[] = []
    const absent: string[] = []
    for (const [file, keys] of SITES) {
      const source = SRC(file)
      for (const key of keys) {
        if (!CATALOG.keys[key]?.wrapped) unwired.push(`${file}: ${key}`)
        const literal = key.replaceAll("'", "\\'")
        if (!source.includes(`'${literal}'`) && !source.includes(`"${key}"`) && !source.includes(`\`${key}\``)) absent.push(`${file}: ${key}`)
      }
    }
    expect(unwired).toEqual([])
    expect(absent, 'a key the file names that it does not call').toEqual([])
  })

  // ⭐ L3-7 (10.10) RE-AIM, NOT RELAXED. The arm used to say «the commentary and the preview are L3, the viewer only renders their rows» and pinned that they do not reach the UI layer. L3-7 is that
  // wave: the two builders still call no `t()` and import nothing from the UI i18n layer – the engine-born prose rides as CopyRefs BESIDE the strings (`Beat.leadC` / `textC`, `PreviewLine.c`, made with `cp`
  // from `shared/i18n`, the module both halves may import) – and the viewer draws them with `eventText`. The English rows stay plain text beside the refs (`text: b.text`, `text: line.text`), which is what
  // the key cut, the budget and every older pin read. The proof that the rows follow the locale is `tests/component/i18n-l3-7-viz-display.test.ts`; the key law is `tests/i18n-l3-7-viz.test.ts`.
  it('the engine-born prose calls no t(): the commentary and the preview emit refs beside their strings, and the viewer draws them', () => {
    for (const file of ['src/viz/commentary.ts', 'src/viz/preview.ts']) {
      expect(/from '(?:\.\.\/)+i18n'/.test(SRC(file)), `${file} learned to call t()`).toBe(false)
      expect(SRC(file), `${file} emits refs`).toMatch(/import \{ cp, type CopyRef \} from '\.\.\/shared\/i18n'/)
    }
    const viewer = SRC('src/components/MatchViewer.vue')
    expect(viewer).toMatch(/text: b\.text/)
    expect(viewer).toMatch(/text: line\.text/)
    expect(viewer, 'the beat rows carry their refs').toMatch(/leadC: b\.leadC, text: b\.text, textC: b\.textC/)
    expect(viewer, 'the preview rows carry their refs').toMatch(/text: line\.text, textC: line\.c/)
    expect(viewer, 'the log draws through eventText').toMatch(/eventText\(\{ text: row\.text, c: row\.textC \}\)/)
  })
})

// --- 3. the seams ----------------------------------------------------------------------------------------------

describe('L2-8 seams – tables of words are getters, rows are computeds: a flip re-labels a MOUNTED surface without a remount', () => {
  it('the bar, the picker and the readout follow the locale, and the picker keeps its CHOICE across the flip (it holds an index, not a phrase)', async () => {
    const w = mountViewer({ mode: 'live' })
    await w.get('.mv-shout-pick').setValue('I saw that.')
    installCatalog('ru', {
      'Full': 'FULL*', 'Key': 'KEY*', 'Every point': 'EVERY*', 'Skip to the result': 'SKIP*', 'Shout 📣': 'SHOUT*', 'Live': 'LIVE*', 'Not started': 'NS*',
      'I saw that.': 'SAW*', 'Still here.': 'HERE*', 'Take your time.': 'TIME*', 'S{0}': 'R{0}*',
    })
    await setLocale('ru')
    await nextTick()
    const buttons = w.findAll('button').map((b) => b.text())
    for (const word of ['FULL*', 'KEY*', 'SHOUT*', 'SKIP*']) expect(buttons, word).toContain(word)
    expect(seen(w.element)).toContain('EVERY*')
    expect(w.get('.mv-live').text()).toBe('LIVE*')
    expect(w.get('.mv-stat-note').text()).toBe('NS*')
    const options = w.findAll('.mv-shout-pick option')
    expect(options.map((o) => o.text()).slice(0, 3)).toEqual(['HERE*', 'TIME*', 'SAW*'])
    expect((w.get('.mv-shout-pick').element as HTMLSelectElement).selectedIndex, 'the choice survived the flip').toBe(2)
    await w.get('.mv-shout-go').trigger('click')
    expect(w.get('.mv-beat.said q').text()).toBe('SAW*')
    expect(w.get('.mv-beat.said .mv-beat-set').text()).toBe('R1*')
    // and a row that is already in the log is re-labelled when the language changes back
    await setLocale('en')
    await nextTick()
    expect(w.get('.mv-beat.said q').text()).toBe('I saw that.')
    expect(w.get('.mv-beat.said .mv-beat-set').text()).toBe('S1')
    w.unmount()
  })

  it('the momentum caption, the retirement alert and its reason follow the locale on a mounted viewer', async () => {
    const { her, opp, match } = retiredFixture(0)
    const w = mountViewer({ match, a: her, b: opp, proceedLabel: 'To the result' })
    await skipToResult(w)
    installCatalog('ru', { 'A long match on tired legs.': 'REASON*', 'Stay with her': 'STAY*', '{0} could not continue.': 'STOP* {0}', 'She retired hurt at': 'HURT*' })
    await setLocale('ru')
    await nextTick()
    expect(flat(w.get('.mv-hurt .dialog-message').text())).toMatch(/^HURT\* .+\. REASON\*$/)
    expect(w.get('.mv-hurt-title').text()).toBe('STOP* Olivia Grant')
    expect(w.get('.mv-hurt button.primary').text()).toBe('STAY*')
    w.unmount()
  })

  it('the replay\'s default title and the practice box score are computeds: a flip re-labels them, and a caller\'s own title is left alone', async () => {
    const replay = mount(MatchReplay, { props: { match: record() }, attachTo: document.body })
    const titled = mount(MatchReplay, { props: { match: record(), title: 'College league' }, attachTo: document.body })
    setViewport(PHONE)
    const practice = mount(PracticeFlow, { props: { match: friendly(), week: 12, kidRank: 9 }, attachTo: document.body, global: { stubs: { teleport: true } } })
    await practice.findAll('.tf-actions button')[0]!.trigger('click')
    installCatalog('ru', { 'Match replay': 'REPLAY*', 'Close replay': 'CLOSE*', 'Aces': 'ACES*', 'Max serve': 'MAX*', '{0} km/h': '{0} KMH*', 'Winners': 'WIN*' })
    await setLocale('ru')
    await nextTick()
    expect(replay.text()).toContain('REPLAY*')
    expect(replay.find('button[aria-label="CLOSE*"]').exists()).toBe(true)
    expect(titled.text()).toContain('College league')
    expect(practice.findAll('table tbody th').map((n) => n.text())).toEqual(['ACES*', 'Double faults', 'WIN*', 'Unforced errors', 'MAX*'])
    expect(practice.findAll('table tbody tr:last-child td').every((n) => / KMH\*$/.test(n.text()))).toBe(true)
    for (const m of [replay, titled, practice]) m.unmount()
  })
})

// --- 4. the context tag and the two bare keys ------------------------------------------------------------------

describe('L2-8 context tag – practice|vs (measured against every batch table), and the two keys left BARE for the owner', () => {
  it('practice|vs is a wired key that renders the bare English, and the friendly asks for the TAGGED key, never the bare one', async () => {
    expect(CATALOG.keys['practice|vs']?.wrapped).toBe(true)
    expect(t('practice|vs')).toBe('vs')
    installCatalog('ru', { 'practice|vs': 'PVS*', vs: 'BARE*' })
    await setLocale('ru')
    setViewport(PHONE)
    const w = mount(PracticeFlow, { props: { match: friendly(), week: 12, kidRank: 9 }, attachTo: document.body, global: { stubs: { teleport: true } } })
    expect(w.get('.scene-vs').text()).toBe('PVS*')
    w.unmount()
  })

  it('`vs` stays BARE on the other cards (the prologue and the tournament pre-match say one thing in every table); only the friendly\'s own row says another', () => {
    const bare = CATALOG.keys['vs']
    expect(bare?.wrapped).toBe(true)
    for (const file of ['src/components/PrologueLocalOpen.vue', 'src/components/TournamentFlow.vue']) expect(SRC(file), file).toContain("t('vs')")
    expect(SRC('src/components/PracticeFlow.vue')).not.toContain("t('vs')")
  })

  it('`Winners` and `Watch again` are BARE and each has ONE key shared by both box scores: the tournament and the friendly cannot say two things (his reading settles the value)', () => {
    for (const bareKey of ['Winners', 'Watch again']) {
      const tagged = Object.keys(CATALOG.keys).filter((k) => k.endsWith(`|${bareKey}`))
      expect(tagged, `${bareKey} grew a tag – the two owner tables disagree about ONE surface, a tag would freeze both Russians`).toEqual([])
      expect(CATALOG.keys[bareKey]?.wrapped).toBe(true)
    }
    expect(SRC('src/components/PracticeFlow.vue')).toContain("t('Watch again')")
    expect(SRC('src/components/TournamentFlow.vue')).toContain("t('Watch again')")
    // the stat table is ONE module read by both flows – the label cannot split
    expect(SRC('src/composables/matchStatTable.ts')).toContain("t('Winners')")
    expect(SRC('src/components/PracticeFlow.vue')).toContain('matchStatRows')
    expect(SRC('src/components/TournamentFlow.vue')).toContain('matchStatRows')
  })
})

// --- 5. the Russian smoke --------------------------------------------------------------------------------------

describe('L2-8 Russian smoke – ru.json read by key, no Cyrillic typed here', () => {
  it('a stand-in catalog proves the call sites ask the catalog (latin markers, one per surface)', async () => {
    installCatalog('ru', {
      Momentum: 'MOM*', 'Break points': 'BP*', '1st serve %': 'FS*', 'Skip to the result': 'SKIP*', 'Elapsed match time {0}': 'ELAPSED* {0}', '#{rank}': 'N{rank}*',
      '· serving': 'SRV*', 'km/h': 'KMH*', 'Practice match': 'PRACTICE*', 'sparring partner': 'SPAR*', 'No ranking points': 'NORANK*', 'Friendly at the club': 'FRIENDLY*',
    })
    await setLocale('ru')
    const live = await midMatch()
    for (const word of ['MOM*', 'BP*', 'FS*', 'SKIP*', 'ELAPSED* ', 'N12*', 'N34*', 'SRV*', 'KMH*']) expect(seen(live.element), word).toContain(word)
    live.unmount()
    setViewport(PHONE)
    const flow = mount(PracticeFlow, { props: { match: friendly(), week: 12, kidRank: 9 }, attachTo: document.body, global: { stubs: { teleport: true } } })
    for (const word of ['PRACTICE*', 'SPAR*', 'NORANK*', 'FRIENDLY*', 'N9*']) expect(seen(flow.element), word).toContain(word)
    flow.unmount()
  })

  it('the REAL ru.json: every approved row on these surfaces renders his Russian; every unapproved one renders English and is counted', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    resetMisses()
    const live = await midMatch()
    liveDriver?.restore()
    liveDriver = null
    const { her, opp, match } = retiredFixture(0)
    const hurt = mountViewer({ match, a: her, b: opp, proceedLabel: 'To the result' })
    await skipToResult(hurt)
    const replay = mount(MatchReplay, { props: { match: record() }, attachTo: document.body })
    setViewport(PHONE)
    const flow = mount(PracticeFlow, { props: { match: friendly(), week: 12, kidRank: 9 }, attachTo: document.body, global: { stubs: { teleport: true } } })
    await flow.findAll('.tf-actions button')[0]!.trigger('click')
    const mounted = [live, hurt, replay, flow]
    const everything = mounted.map((m) => seen(m.element)).join('\n')
    const HERE = /MatchControls|MatchViewer|MatchReplay|PracticeFlow|BoxScoreTable|matchReadout|matchStatTable/
    const wiredHere = Object.keys(RU).filter((k) => CATALOG.keys[k]?.wrapped && CATALOG.keys[k]!.home.some((h) => HERE.test(h)))
    // the approved arm: today `wiredHere` is empty (no RU-08 row is APPROVED) and the loop wakes by itself the day one is
    for (const key of wiredHere) expect(everything, `${key} is approved and wired, so his Russian must render`).toContain(RU[key]!)
    // the unapproved arm: English on screen, and the miss counter says so (ruling 4 as a number)
    expect(everything).toContain('Momentum')
    expect(missCount(), 'unapproved rows must be counted as misses').toBeGreaterThan(25)
    for (const key of ['Live', 'Momentum', 'Break points', 'Skip to the result', 'Stay with her', 'Close replay', 'practice|vs', 'Winners', 'Watch again', 'Practice match']) {
      expect(missedKeys(), key).toContain(key)
    }
    console.log(`[L2-8 smoke] ru.json: ${Object.keys(RU).length} keys; approved AND wired on these screens: ${wiredHere.length}; distinct misses on four mounted surfaces: ${missedKeys().length}`)
    mounted.forEach((m) => m.unmount())
  })
})

// --- 6. the xx sweep -------------------------------------------------------------------------------------------

describe('L2-8 xx sweep – no unwrapped chrome in the viewer frames, and the phone still holds longer words', () => {
  /** What is NOT frame copy and is allow-listed by SHAPE: ranks, clocks, scores and bare numbers. ⚠ NO NAME-SHAPED PATTERNS (L2-5's rule): a name or a
   *  commentary line is allowed because the FIXTURE carries it – see `engineProse`. */
  const ENGINE_BORN: RegExp[] = [/^W\d+ ['’]\d{2} · [A-Z][a-z]{2} \d+ – [A-Z][a-z]{2} \d+, \d{4}$/, /^#\d+$/, /^\d+$/, /^\d+:\d\d(?::\d\d)?$/, /^[−-]?\d+[-–]\d+$/, /^[—–-]$/, /^…$/, /^(?:0|15|30|40|A)$/]
  const allow = [...DEFAULT_ALLOW, ...ENGINE_BORN]
  /** Names, their short forms and the tour's own words come from the fixture; the log's rows are the engine's raw prose (L3) and are COUNTED, not swept. */
  const names = ['Vera Novak', 'Ines Duval', 'Olivia Grant', 'V. Novak', 'I. Duval', 'O. Grant', 'hard']
  const known = (leak: string): boolean => names.includes(leak) || /^\d+ points played$/.test(leak)
  function chromeLeaks(w: VueWrapper): string[] {
    const leaks: string[] = []
    for (const part of [w.element.querySelector('.mv-panel'), w.element.querySelector('.mv-controls'), w.element.querySelector('.mv-actions'), w.element.querySelector('.mv-hurt')]) {
      if (part) leaks.push(...hardcodeLeaks(part, allow).filter((l) => !known(l)))
    }
    return leaks
  }

  it('the live viewer mid-match, the finished bars, the retirement alert, the replay shell and the friendly (card and box score): nothing the CHROME wrote is left unbracketed', async () => {
    await installPseudoLocale()
    const results: [string, string[]][] = []
    const live = await midMatch()
    results.push(['viewer/live-mid-match', chromeLeaks(live)])
    const logRows = live.findAll('.mv-log .mv-beat').length
    live.unmount()
    liveDriver?.restore()
    liveDriver = null
    const done = mountViewer({ proceedLabel: t('To the result') })
    await skipToResult(done)
    results.push(['viewer/finished-with-proceed', chromeLeaks(done)])
    done.unmount()
    const bare = mountViewer()
    await skipToResult(bare)
    results.push(['viewer/finished-replay', chromeLeaks(bare)])
    bare.unmount()
    const { her, opp, match } = retiredFixture(0)
    const hurt = mountViewer({ match, a: her, b: opp, proceedLabel: t('To the result') })
    await skipToResult(hurt)
    results.push(['viewer/retirement-alert', chromeLeaks(hurt)])
    hurt.unmount()
    const replay = mount(MatchReplay, { props: { match: record() }, attachTo: document.body })
    const shell = replay.element.cloneNode(true) as Element
    shell.querySelector('.mv-log')?.remove() // the log is the engine's raw prose (counted above), the rest is the shell and the viewer's chrome
    results.push(['replay/shell', hardcodeLeaks(shell, allow).filter((l) => !known(l))])
    replay.unmount()
    setViewport(PHONE)
    const flow = mount(PracticeFlow, { props: { match: friendly(), week: 12, kidRank: 9 }, attachTo: document.body, global: { stubs: { teleport: true } } })
    const pre = hardcodeLeaks(flow.element, allow).filter((l) => !known(l))
    await flow.findAll('.tf-actions button')[0]!.trigger('click')
    const post = hardcodeLeaks(flow.element, allow).filter((l) => !known(l))
    flow.unmount()
    console.log(`[L2-8 xx] leaks: ${JSON.stringify(results)} · friendly card ${JSON.stringify(pre)} · friendly box score ${JSON.stringify(post)} · the live log held ${logRows} engine-prose rows (raw English by design, L3)`)
    for (const [surface, leaks] of results) expect(leaks, `${surface}: copy the CHROME wrote that did not go through t()`).toEqual([])
    // the week line (RU-13D, a formatter) and the surface code (the fixture's own) are the only words a formatter or the engine writes on those two cards
    expect(pre, 'friendly card').toEqual([])
    expect(post, 'friendly box score').toEqual([])
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
  const pct = (r: number): string => `${(r * 100).toFixed(0)}%`

  it('the live scoreboard (court band, ends, rows, the three panels) and the friendly\'s pre-match card hold a 375x667 phone with every word longer (numbers printed)', async () => {
    const measure = async (): Promise<{ label: string; r: ReturnType<typeof widest> }[]> => {
      const live = await midMatch()
      const board = widest(live.get('.mv-panel').element)
      const bar = widest(live.get('.mv-controls').element)
      live.unmount()
      liveDriver?.restore()
      liveDriver = null
      setViewport(PHONE)
      const flow = mount(PracticeFlow, { props: { match: friendly(), week: 12, kidRank: 9 }, attachTo: document.body, global: { stubs: { teleport: true } } })
      const card = widest(flow.get('.scene').element)
      flow.unmount()
      return [
        { label: 'the live scoreboard', r: board },
        { label: 'the pinned control bar (plates, shout row, skip)', r: bar },
        { label: 'the friendly\'s pre-match card', r: card },
      ]
    }
    const english = await measure()
    resetI18nForTests(null)
    await installPseudoLocale()
    const xx = await measure()
    console.log(
      '[L2-8 xx] 375x667, share of the box\'s room, English -> xx: ' +
        english
          .map((e, i) => {
            const x = xx[i]!
            return `${e.label}: ${e.r.boxes} text boxes, ${e.r.chars} -> ${x.r.chars} chars; widest line ${pct(e.r.line.r)} («${e.r.line.at}») -> ${pct(x.r.line.r)} («${x.r.line.at}»); longest word ${pct(e.r.word.r)} («${e.r.word.at}») -> ${pct(x.r.word.r)} («${x.r.word.at}»)`
          })
          .join(' · '),
    )
    for (const x of xx) expect(x.r.word.r, `${x.label}: the word «${x.r.word.at}» overflows its box under xx`).toBeLessThanOrEqual(1)
    expect(xx.every((x, i) => x.r.chars > english[i]!.r.chars), 'xx made a surface no longer – the measurement did not see the words').toBe(true)
  })
})
