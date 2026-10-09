// L2-9 – THE NET UNDER RU-09 (THE BIRTHDAY DIALOG'S SHELL) AND RU-10 (THE LIFE-BEAT DIALOG'S CHROME).
// docs/specs/i18n-2026-10.md §8, docs/localization/ru-diary-birthday-2026-10.md, ru-life-beats-small-talk-2026-10.md, ru-life-beats-actions-2026-10.md.
//
// Six questions, asked of the REAL components mounted and of the REAL catalog (the L2-3 … L2-8 nets' shape):
//   1. PARITY. With no catalog the English renders as it shipped – the wiring changed no word (invariant 4).
//   2. COMPLETENESS. Every CERTAIN string homed in these components is a wired key, the sites this wave names call `t()`, and – for the
//      life beat, where the labels arrive from the SNAPSHOT and are read through a DYNAMIC key – every string the engine can hand to
//      such a site IS a catalog key (the arm that keeps `callStats.dynamic` honest).
//   3. THE SEAMS. A locale flip re-labels a MOUNTED dialog; what the engine wrote (the heading, the ask, the gift rows, her lines) is
//      left exactly as the snapshot carries it.
//   4. THE CONTEXT TAGS. Measured against every table with the importer's own row reader; the verdicts are asserted here.
//   5. THE RUSSIAN SMOKE. The REAL `src/i18n/ru.json` is installed and the locale flipped. ⚠ NO CYRILLIC LITERAL LIVES IN THIS FILE – every
//      expectation is READ from ru.json by key.
//   6. THE `xx` SWEEP, ON THE TWO TIGHTEST SURFACES. Both are BLOCKING overlays with no way out that is not an answer, so the 375x667
//      law (CLAUDE.md, round-20 #3) is the whole point: the dismiss control stays inside the phone with every word longer, and the
//      assertion is watched going red on the too-tall version.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import '../../src/style.css'

import BirthdayDialog from '../../src/components/BirthdayDialog.vue'
import LifeBeatDialog from '../../src/components/LifeBeatDialog.vue'
import { useGameStore } from '../../src/stores/game'
import {
  LIFE_BEAT_OPTIONS,
  SMALL_TALK_FRAMES,
  SMALL_TALK_SITUATIONS,
  SMALL_TALK_STANCES,
  SMALL_TALK_STANCE_ID,
  TEMPERAMENTS,
  buildLifeBeatPrompt,
  createWorld,
  decideKnock,
  lifeBeatFollowUps,
  lifeBeatHeading,
  pendingBirthday,
  pendingKnock,
  raiseLifeBeat,
  tickWeek,
  toSnapshot,
  type SmallTalkSituation,
  type SmallTalkVoiceEntry,
  type Temperament,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type LifeBeatPrompt, type Snapshot } from '../../src/shared/protocol'
import { listDocs, readRows } from '../../tools/i18n-import'
import { isPseudo } from '../../tools/i18n-pseudoloc'
import { installCatalog, missCount, missedKeys, resetI18nForTests, resetMisses, setLocale, t } from '../../src/i18n'
import { installMemoryStorage } from './setup'
import { NARROW_PHONE, PHONE, assertDismissReachable, setViewport, type Viewport } from './fits'
import { DEFAULT_ALLOW, expandRendered, hardcodeLeaks, installPseudoLocale } from './pseudoloc'

/** His approved Russian, as the importer compiled it. Every Russian expectation below is read from here by key. */
const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
const CATALOG = JSON.parse(readFileSync('src/i18n/catalog.en.json', 'utf8')) as { keys: Record<string, { home: string[]; wrapped?: true }> }
const SRC = (path: string): string => readFileSync(path, 'utf8')

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})
afterEach(() => {
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
const flat = (s: string | null): string => (s ?? '').replace(/\s+/g, ' ').trim()
const pct = (r: number): string => `${(r * 100).toFixed(0)}%`

// ===================================================================================================================
// RU-09 – THE BIRTHDAY DIALOG'S SHELL (L2-9a)
// ===================================================================================================================

/** A real career ticked to a real birthday (birthday-dialog.test.ts' own recipe): the words asserted are the engine's own. */
function birthdaySnapshot(seed = 'bday-ui'): Snapshot {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 6, birthDay: 15, coachTier: 'self' })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 60 && pendingBirthday(world) === null; i++) {
    if (pendingKnock(world)) decideKnock(world, 'rest')
    tickWeek(world, rng)
  }
  if (pendingBirthday(world) === null) throw new Error('the fixture never reached a birthday')
  return toSnapshot(world)
}
function mountBirthday(snap: Snapshot, vp: Viewport = PHONE): VueWrapper {
  // ⚠ THE VIEWPORT FIRST – happy-dom caches a media query on an element's first computed-style read (fits.ts).
  setViewport(vp)
  useGameStore().snapshot = snap
  return mount(BirthdayDialog, { attachTo: document.body, global: { stubs: { teleport: true } } })
}
/** The text the engine put on the card: the heading, the ask, and the four rows (label and note). */
function engineWords(snap: Snapshot): string[] {
  const p = snap.birthdayPrompt!
  return [p.heading, p.ask, ...p.options.flatMap((o) => [o.label, o.note])]
}
async function selectFirst(w: VueWrapper): Promise<void> {
  await w.get('button.birthday-choice').trigger('click')
  await nextTick()
}

describe('L2-9a parity – the birthday dialog as it shipped, with no catalog', () => {
  it('the kicker names the week, the heading, the ask and the four rows are the snapshot\'s own strings, and the Proceed waits for a selection', async () => {
    const snap = birthdaySnapshot()
    const p = snap.birthdayPrompt!
    const w = mountBirthday(snap)
    expect(flat(w.get('.season-summary-kicker').text())).toMatch(/^Her birthday – W\d+ '\d\d$/)
    expect(w.get('.season-summary-title').text()).toBe(p.heading)
    expect(w.get('.birthday-ask').text()).toBe(p.ask)
    expect(w.findAll('.birthday-choice-label').map((n) => n.text())).toEqual(p.options.map((o) => o.label))
    expect(w.findAll('.birthday-choice-note').map((n) => n.text())).toEqual(p.options.map((o) => o.note))
    expect(w.find('.birthday-proceed').exists(), 'nothing is answered yet').toBe(false)
    await selectFirst(w)
    expect(w.get('.birthday-proceed').text()).toBe('Proceed')
    w.unmount()
  })

  it('the template prints NOTHING else: every line on the card is the kicker, the Proceed or a string of the snapshot', async () => {
    const snap = birthdaySnapshot()
    const w = mountBirthday(snap)
    await selectFirst(w)
    const kicker = flat(w.get('.season-summary-kicker').text())
    const known = new Set([kicker, 'Proceed', ...engineWords(snap).map((s) => flat(s))])
    const lines: string[] = []
    const walker = document.createTreeWalker(w.element, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const text = flat(n.textContent)
      if (text) lines.push(text)
    }
    expect(lines.filter((l) => !known.has(l)), 'a sentence of the component\'s own, beyond the two L2-9 wired').toEqual([])
    w.unmount()
  })
})

describe('L2-9a completeness – the two phrases of the template are wired keys; the engine\'s words are left raw on purpose', () => {
  const FILE = 'src/components/BirthdayDialog.vue'
  it('no CERTAIN string homed in BirthdayDialog is left unwrapped, and the file asks for both keys', () => {
    const open = Object.entries(CATALOG.keys).filter(([, v]) => v.home.includes(FILE) && !v.wrapped).map(([k]) => k)
    expect(open).toEqual([])
    for (const key of ['Her birthday – {0}', 'Proceed']) {
      expect(CATALOG.keys[key]?.wrapped, key).toBe(true)
      expect(CATALOG.keys[key]?.home, key).toContain(FILE)
    }
    const source = SRC(FILE)
    expect(source).toContain("t('Her birthday – {0}', [weekLabel(prompt.week, startYear)])")
    expect(source).toContain("{{ t('Proceed') }}")
  })

  // ⭐ L3-4 (10.10) RE-AIMED: this pin said the heading, the ask and the four rows were bare `{{ prompt.heading }}` etc. – «engine-born, L3». L3-4 is that wave: the engine writes a
  // CopyRef BESIDE each (`headingC`, `askC`, `labelC`, `noteC`) and the dialog draws them through `say()` (= `eventText`). They are still not read through a KEY of the template's own:
  // the keys are the engine's (the RU-09 headings and the RU-09A gift corpus), which is why no `t()` is allowed in the engine modules below.
  it('the heading, the ask and the four rows are drawn from the refs the engine wrote beside them – not read through a key of the template\'s own – engine-born (L3-4)', () => {
    const source = SRC('src/components/BirthdayDialog.vue')
    for (const drawn of ['say(prompt.heading, prompt.headingC)', 'say(prompt.ask, prompt.askC)', 'say(option.label, option.labelC)', 'say(option.note, option.noteC)']) expect(source, drawn).toContain(drawn)
    for (const bare of ['{{ prompt.heading }}', '{{ prompt.ask }}', '{{ option.label }}', '{{ option.note }}']) expect(source, `${bare} is back`).not.toContain(bare)
    // ...and the engine modules that write them still cannot call t() (invariant 1)
    for (const file of ['src/engine/world/birthday.ts', 'src/engine/world/birthdayGift.ts']) {
      expect(/from '(?:\.\.\/)+i18n'/.test(SRC(file)), `${file} learned to call t()`).toBe(false)
    }
  })
})

describe('L2-9a seams – a flip re-labels a MOUNTED dialog, and leaves the engine\'s words and the player\'s choice alone', () => {
  it('the kicker and the Proceed follow the locale; the selection, the heading, the ask and the rows do not move', async () => {
    const snap = birthdaySnapshot()
    const w = mountBirthday(snap)
    await selectFirst(w)
    const before = engineWords(snap).map((s) => flat(s))
    installCatalog('ru', { 'Her birthday – {0}': 'BDAY* {0}', Proceed: 'GO*' })
    await setLocale('ru')
    await nextTick()
    expect(flat(w.get('.season-summary-kicker').text())).toMatch(/^BDAY\* W\d+ '\d\d$/)
    expect(w.get('.birthday-proceed').text()).toBe('GO*')
    expect(w.get('button.birthday-choice').attributes('aria-checked'), 'the choice survived the flip').toBe('true')
    const after = [w.get('.season-summary-title').text(), w.get('.birthday-ask').text(), ...w.findAll('.birthday-choice-label').map((n) => n.text())].map(flat)
    expect(after.every((line) => before.includes(line))).toBe(true)
    await setLocale('en')
    await nextTick()
    expect(w.get('.birthday-proceed').text()).toBe('Proceed')
    w.unmount()
  })
})

describe('L2-9a context tags – none, each measured against every batch table with the importer\'s row reader', () => {
  it('`Proceed` has three rows in three tables and ONE Russian (the prologue handover, the knock, the life beat), so it stays bare; the kicker has no row at all', () => {
    expect(Object.keys(CATALOG.keys).filter((k) => k.endsWith('|Proceed')), 'Proceed grew a tag').toEqual([])
    expect(CATALOG.keys['Proceed']?.home).toEqual(
      expect.arrayContaining(['src/components/BirthdayDialog.vue', 'src/components/KnockDialog.vue', 'src/engine/world/lifeBeat.ts', 'src/prologue/handover.ts']),
    )
    expect(Object.keys(CATALOG.keys).filter((k) => k.endsWith('|Her birthday – {0}'))).toEqual([])
  })
})

describe('L2-9a Russian smoke – ru.json read by key, no Cyrillic typed here', () => {
  it('the REAL ru.json: every approved row on this card renders his Russian; the unapproved ones render English and are counted', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    resetMisses()
    const snap = birthdaySnapshot()
    const w = mountBirthday(snap)
    await selectFirst(w)
    const everything = seen(w.element)
    const wiredHere = Object.keys(RU).filter((k) => CATALOG.keys[k]?.wrapped && CATALOG.keys[k]!.home.includes('src/components/BirthdayDialog.vue'))
    // the approved arm: today `wiredHere` is empty (no RU-09 row is APPROVED) and the loop wakes by itself the day one is
    for (const key of wiredHere) expect(everything, `${key} is approved and wired, so his Russian must render`).toContain(RU[key]!)
    // the unapproved arm: English on screen, and the miss counter says so (ruling 4 as a number)
    expect(everything).toContain('Proceed')
    for (const key of ['Her birthday – {0}', 'Proceed']) expect(missedKeys(), key).toContain(key)
    expect(missCount()).toBeGreaterThanOrEqual(2)
    console.log(`[L2-9a smoke] ru.json: ${Object.keys(RU).length} keys; approved AND wired on the birthday card: ${wiredHere.length}; distinct misses: ${missedKeys().length}`)
    w.unmount()
  })
})

describe('L2-9a xx sweep – the birthday dialog: nothing the shell wrote is unbracketed, and the Proceed stays inside a 375x667 phone with every word longer', () => {
  /** The strings the SNAPSHOT carries are the engine's – the sweep charges the shell and allows what the engine wrote (it is counted, L3). */
  async function leaksOf(snap: Snapshot): Promise<{ leaks: string[]; engine: number }> {
    await installPseudoLocale()
    const w = mountBirthday(snap)
    await selectFirst(w)
    const engine = new Set(engineWords(snap).map((s) => flat(s)))
    const leaks = hardcodeLeaks(w.element, DEFAULT_ALLOW).filter((l) => !engine.has(l))
    w.unmount()
    return { leaks, engine: engine.size }
  }

  it('zero leaks beyond the engine\'s own words: the kicker and the Proceed are bracketed', async () => {
    const snap = birthdaySnapshot()
    const { leaks, engine } = await leaksOf(snap)
    console.log(`[L2-9a xx] birthday dialog leaks beyond the ${engine} engine-written strings: ${JSON.stringify(leaks)}`)
    expect(leaks).toEqual([])
  })

  /** The longest card of a handful of real careers (the gift rows are drawn per seed), so the instrument measures a tight one. */
  const SEEDS = ['bday-ui', 'bday-a', 'bday-b', 'bday-c', 'bday-d', 'bday-e']
  function worstSnapshot(): { snap: Snapshot; chars: number } {
    const scored = SEEDS.map((seed) => {
      const snap = birthdaySnapshot(seed)
      return { snap, chars: engineWords(snap).reduce((n, s) => n + s.length, 0) }
    })
    return scored.sort((a, b) => b.chars - a.chars)[0]!
  }

  for (const vp of [PHONE, NARROW_PHONE]) {
    it(`${vp.width}x${vp.height}: every line padded +30% (the shell through the xx catalog, the engine's words through expandRendered), a present selected – the Proceed is reachable; strip the cap and the SAME assertion goes red`, async () => {
      const { snap, chars } = worstSnapshot()
      // the English baseline, on the same card and the same phone – the numbers below are English -> xx
      const en = mountBirthday(snap, vp)
      await selectFirst(en)
      const enCard = document.querySelector('.birthday-dialog') as HTMLElement
      const enFit = assertDismissReachable(enCard, enCard.querySelector('.birthday-proceed')!, vp, `BirthdayDialog (English, ${vp.width}x${vp.height})`)
      en.unmount()
      await installPseudoLocale()
      const w = mountBirthday(snap, vp)
      await selectFirst(w)
      const card = document.querySelector('.birthday-dialog') as HTMLElement
      const proceed = card.querySelector('.birthday-proceed') as HTMLElement
      expect(proceed, 'the selected state is up – nothing below is vacuous').toBeTruthy()
      expect(card.lastElementChild, 'the Proceed is the card\'s last element while rendered').toBe(proceed)
      const english = (card.textContent ?? '').length
      const padded = expandRendered(card)
      const xxChars = (card.textContent ?? '').length
      expect(padded, 'expandRendered reached the engine\'s words').toBeGreaterThan(4)
      expect(xxChars, 'xx made the card longer – the measurement saw the words').toBeGreaterThan(english)
      const fit = assertDismissReachable(card, proceed, vp, `BirthdayDialog (xx, ${vp.width}x${vp.height})`)
      console.log(
        `[L2-9a xx] birthday dialog ${vp.width}x${vp.height}: the worst of ${SEEDS.length} careers (${chars} engine chars); card text ${english} -> ${xxChars} chars; ` +
          `content wants ${enFit.contentFloor.toFixed(0)} -> ${fit.contentFloor.toFixed(0)}px of a ${fit.available.height.toFixed(0)}px room (cap ${Number.isFinite(fit.cap) ? fit.cap.toFixed(0) : 'none'}, ` +
          `${fit.contentFloor > fit.available.height ? 'scrolls inside the cap' : 'fits whole'}); the Proceed at ${enFit.dismissTop.toFixed(0)}..${enFit.dismissBottom.toFixed(0)} -> ${fit.dismissTop.toFixed(0)}..${fit.dismissBottom.toFixed(0)} of ${vp.height}`,
      )
      expect(fit.dismissBottom).toBeLessThanOrEqual(vp.height)
      // THE MUTATION: the shared cap is what holds – strip it and the same assertion must go red, then put it back and it is green again
      card.style.maxHeight = 'none'
      card.style.overflowY = 'visible'
      expect(() => assertDismissReachable(card, proceed, vp, 'BirthdayDialog (xx, unbounded)')).toThrow(/declares no height bound|taller than the screen|outside the viewport/)
      card.style.maxHeight = ''
      card.style.overflowY = ''
      assertDismissReachable(card, proceed, vp, 'BirthdayDialog (xx, cap restored)')
      w.unmount()
    })
  }
})

// ===================================================================================================================
// RU-10 – THE LIFE-BEAT DIALOG'S CHROME (L2-9b)
// ===================================================================================================================
//
// ⚠ THE DIALOG OWNS NO SENTENCE (its own header, CLAUDE.md invariant 4): every word on it arrives on `snapshot.lifeBeatPrompt`. What L2-9b
// wires is the three seats where the engine hands over a CONTROL LABEL – an answer, the Proceed, the reply's one button – and the
// component reads each as a DYNAMIC key, `t(option.label)`. The extractor cannot read such a call (it prints their number), so the
// completeness arm below walks every string the engine can hand those seats and demands a catalog key for each.

const BOND = 'close' as const

interface Col {
  s: SmallTalkSituation
  voice: Temperament
  c: SmallTalkVoiceEntry
}
const COLUMNS: Col[] = SMALL_TALK_SITUATIONS.flatMap((s) =>
  TEMPERAMENTS.flatMap((voice) => {
    const c = s.voices[voice]
    return c === undefined ? [] : [{ s, voice, c }]
  }),
)
/** The longest presence frame the pool can put in front of her opener – a REAL sentence, so the xx padding has words to pad. */
const LONGEST_FRAME = [...SMALL_TALK_FRAMES.roof, ...SMALL_TALK_FRAMES.away].map((f) => f.line).sort((a, b) => b.length - a.length)[0]!

/** A married career carrying a raised beat, and the card the ENGINE assembles for it (life-beat-dialog.test.ts' own recipe). */
function raised(kind: 'expecting' | 'return-plan'): LifeBeatPrompt {
  const world = createWorld(`l29-${kind}`, DEFAULT_PROFILE)
  world.season = []
  world.week = 1000
  world.bond = 90
  world.loveEpisodes = [
    { id: 'p:900', sinceWeek: 900, endedWeek: null, knownWeek: 902, wants: 'open', partnerId: 'p:900', publicWeek: null, publicWrong: false, airedMetWeek: null, airedEndedWeek: null, latchedWeek: 940, partnerName: 'Anton' },
  ]
  raiseLifeBeat(world, kind, kind === 'expecting' ? 'p:900' : 'return-plan')
  const prompt = buildLifeBeatPrompt(world)
  if (prompt?.kind !== kind) throw new Error(`the engine did not raise a ${kind} beat`)
  return prompt
}
const EXPECTING = raised('expecting')
const RETURN_PLAN = raised('return-plan')

/** The card the engine assembles for one small-talk column, on the prompt contract – the heading, the follow-ups and the confirm are the engine's. */
function cardFor(col: Col): LifeBeatPrompt {
  return {
    week: 1,
    kind: 'small-talk',
    heading: lifeBeatHeading('small-talk', 'bright', BOND),
    said: `${LONGEST_FRAME} ${col.c.opener}`,
    options: SMALL_TALK_STANCES.map((stance) => ({ id: SMALL_TALK_STANCE_ID[stance], label: col.c.branches[stance].label })),
    followUps: lifeBeatFollowUps('small-talk', `${col.s.subject}:${col.s.id}`, col.voice, BOND),
    confirm: EXPECTING.confirm,
  }
}
const printedLength = (p: LifeBeatPrompt): number => p.said.length + p.options.reduce((n, o) => n + o.label.length, 0)
const worstAsking = [...COLUMNS].sort((a, b) => printedLength(cardFor(b)) - printedLength(cardFor(a)))[0]!
const worstReplying = COLUMNS.flatMap((col) =>
  cardFor(col).followUps.map((f) => ({ col, optionId: f.optionId, size: cardFor(col).said.length + f.said.join(' ').length })),
).sort((a, b) => b.size - a.size)[0]!

function mountBeat(prompt: LifeBeatPrompt, vp: Viewport = PHONE): VueWrapper {
  // ⚠ THE VIEWPORT FIRST (happy-dom caches a media query on the first computed-style read)
  setViewport(vp)
  useGameStore().snapshot = { ...toSnapshot(createWorld('l29-life-beat', DEFAULT_PROFILE)), lifeBeatPrompt: prompt }
  return mount(LifeBeatDialog, { attachTo: document.body })
}
const radios = (w: VueWrapper): string[] => w.findAll('.life-beat-choice-label').map((n) => n.text())

/** Every string the engine can hand the three seats – the answers' labels, the Proceed and the reply's button. */
function reachable(): { labels: string[]; options: number; stances: number; buttons: string[] } {
  const options = new Set<string>()
  for (const list of Object.values(LIFE_BEAT_OPTIONS)) for (const o of list) options.add(o.label)
  const stances = new Set<string>()
  for (const col of COLUMNS) for (const st of SMALL_TALK_STANCES) stances.add(col.c.branches[st].label)
  const buttons = new Set<string>([EXPECTING.confirm, RETURN_PLAN.confirm])
  for (const col of COLUMNS) for (const f of cardFor(col).followUps) buttons.add(f.done)
  return { labels: [...new Set([...options, ...stances])], options: options.size, stances: stances.size, buttons: [...buttons] }
}
/** The strings with no catalog key – what a dynamic seat would silently render in English forever. */
const withoutKey = (strings: readonly string[]): string[] => strings.filter((x) => CATALOG.keys[x] === undefined)

describe('L2-9b parity – the life-beat dialog prints EXACTLY the engine\'s strings, with no catalog', () => {
  it('a real small-talk card: the heading, her line, the three answers in the engine\'s order, the Proceed after a selection and the reply button', async () => {
    const prompt = cardFor(worstAsking)
    const w = mountBeat(prompt)
    expect(w.get('.season-summary-title').text()).toBe(prompt.heading)
    expect(w.get('.life-beat-said').text()).toBe(prompt.said)
    expect(radios(w)).toEqual(prompt.options.map((o) => o.label))
    expect(w.find('.life-beat-proceed').exists(), 'nothing is answered yet').toBe(false)
    await w.findAll('button.life-beat-choice')[1]!.trigger('click') // a stance that earns a reply
    await nextTick()
    expect(w.find('.life-beat-choices').exists(), 'the reply replaces the answers').toBe(false)
    expect(w.get('.life-beat-listen-done').text()).toBe(prompt.followUps.find((f) => f.optionId === prompt.options[1]!.id)!.done)
    expect(w.findAll('.life-beat-continued').map((n) => n.text())).toEqual(prompt.followUps.find((f) => f.optionId === prompt.options[1]!.id)!.said.map(flat))
    w.unmount()
  })

  it('a real announcement: the labels are `lifeBeatOptionsFor`\'s, the Proceed is `prompt.confirm`', async () => {
    const w = mountBeat(EXPECTING)
    expect(radios(w)).toEqual(EXPECTING.options.map((o) => o.label))
    await w.get('button.life-beat-choice').trigger('click')
    await nextTick()
    expect(w.get('.life-beat-proceed').text()).toBe(EXPECTING.confirm)
    w.unmount()
  })
})

describe('L2-9b completeness – the three dynamic seats are wired, and every string the engine can hand them IS a catalog key', () => {
  const FILE = 'src/components/LifeBeatDialog.vue'
  // ⭐ L3-5 (10.10) RE-AIMED: this pin said the heading, her line and her replies were bare `{{ prompt.heading }}` etc. – «engine prose, L3». L3-5 is that wave: the engine writes a CopyRef beside each of
  // them and the dialog draws `eventText({ text, c })`, so the pin now asserts the refs are what is drawn (and that the bare spellings are gone). The three dynamic `t()` seats are untouched.
  it('the file asks the catalog at the three seats and at no other: the heading, her line and her replies are drawn through their refs', () => {
    const source = SRC(FILE)
    for (const seat of ['{{ t(option.label) }}', '{{ t(prompt.confirm) }}', '{{ t(replying.done) }}']) expect(source, seat).toContain(seat)
    for (const drawn of ['eventText({ text: prompt.heading, c: prompt.headingC })', 'eventText({ text: prompt.said, c: prompt.saidC })', 'eventText({ text: line, c: replying?.saidC?.[i] })']) expect(source, drawn).toContain(drawn)
    for (const bare of ['{{ prompt.heading }}', '{{ prompt.said }}', '{{ line }}']) expect(source, `${bare} is back`).not.toContain(bare)
    expect(Object.entries(CATALOG.keys).filter(([, v]) => v.home.includes(FILE)).map(([k]) => k), 'the dialog still owns no CERTAIN string').toEqual([])
    expect(source.match(/\{\{\s*t\(/g)?.length, 'exactly the three dynamic seats').toBe(3)
  })

  it('every LIFE_BEAT_OPTIONS label, every small-talk stance label, the Proceed and the reply button is a catalog key (the arm that keeps `callStats.dynamic` honest)', () => {
    const r = reachable()
    console.log(`[L2-9b dynamic] ${r.options} LIFE_BEAT_OPTIONS labels + ${r.stances} small-talk stance labels = ${r.labels.length} distinct answers; buttons: ${JSON.stringify(r.buttons)}`)
    expect(r.options, 'the walk is not vacuous: 13 kinds, 34 distinct labels').toBe(34)
    expect(r.stances, 'and 145 distinct stance labels across 51 situations x 4 voices').toBeGreaterThan(100)
    expect(withoutKey(r.labels), 'an answer the dialog would render in English forever').toEqual([])
    expect(withoutKey(r.buttons)).toEqual([])
    expect([...r.buttons].sort(), 'a THIRD button word would be a decision').toEqual(['Let her finish', 'Proceed'])
  })

  it('the arm can fail: a label no table and no pool has is reported', () => {
    expect(withoutKey(['Give her room, and say we are here', 'A label nobody wrote'])).toEqual(['A label nobody wrote'])
  })

  it('the shared `GIVE_HER_ROOM` is ONE key behind three kinds, and RU-10G\'s three rows give it one Russian', () => {
    const rooms = (['ended', 'divorced'] as const).map((k) => LIFE_BEAT_OPTIONS[k].find((o) => o.id === 'space')!.label)
    expect(new Set(rooms)).toEqual(new Set(['Give her room, and say we are here']))
    expect(CATALOG.keys['Give her room, and say we are here']?.home).toEqual(['src/engine/world/lifeBeat.ts'])
  })

  it('his RU-10G rows JOIN: every one of the 34 labels has a row in the choice-label table (the importer compiles an approved row onto the existing key)', () => {
    const { rows } = readRows(listDocs())
    const inActions = new Set(rows.filter((r) => r.doc === 'ru-life-beats-actions-2026-10.md' && r.english !== null).map((r) => r.english!.trim()))
    const r = reachable()
    const labelsOfOptions = new Set<string>()
    for (const list of Object.values(LIFE_BEAT_OPTIONS)) for (const o of list) labelsOfOptions.add(o.label)
    expect([...labelsOfOptions].filter((l) => !inActions.has(l)), 'a label with no RU-10G row').toEqual([])
    console.log(`[L2-9b rows] RU-10G rows: ${inActions.size} distinct English cells, all ${labelsOfOptions.size} option labels joined; stance labels reachable: ${r.stances}`)
  })
})

describe('L2-9b seams – a flip re-labels a MOUNTED life-beat dialog; the engine\'s prose and the player\'s choice stay as they are', () => {
  it('the answers, the Proceed and the reply button follow the locale; her line, the heading and the reply paragraphs do not move', async () => {
    const col = worstAsking
    const prompt = cardFor(col)
    const [one, two, three] = prompt.options.map((o) => o.label) as [string, string, string]
    const w = mountBeat(prompt)
    installCatalog('ru', { [one]: 'ONE*', [two]: 'TWO*', Proceed: 'GO*', 'Let her finish': 'FIN*' })
    await setLocale('ru')
    await nextTick()
    expect(radios(w)).toEqual(['ONE*', 'TWO*', three])
    expect(w.get('.season-summary-title').text()).toBe(prompt.heading)
    expect(w.get('.life-beat-said').text()).toBe(prompt.said)
    await w.findAll('button.life-beat-choice')[0]!.trigger('click') // the invite stance: its reply ends on the listen button
    await nextTick()
    expect(w.get('.life-beat-listen-done').text()).toBe('FIN*')
    expect(w.findAll('.life-beat-continued').map((n) => n.text())).toEqual(prompt.followUps[0]!.said.map(flat))
    await setLocale('en')
    await nextTick()
    expect(w.get('.life-beat-listen-done').text()).toBe('Let her finish')
    w.unmount()
  })

  it('the Proceed under a selection on a kind with no reply follows the locale, and the selection survives the flip', async () => {
    const w = mountBeat(EXPECTING)
    await w.findAll('button.life-beat-choice')[1]!.trigger('click')
    await nextTick()
    installCatalog('ru', { Proceed: 'GO*', [EXPECTING.options[1]!.label]: 'PICK*' })
    await setLocale('ru')
    await nextTick()
    expect(w.get('.life-beat-proceed').text()).toBe('GO*')
    expect(radios(w)[1]).toBe('PICK*')
    expect(w.findAll('button.life-beat-choice')[1]!.attributes('aria-checked')).toBe('true')
    w.unmount()
  })

  it('a label no catalog covers renders as the engine wrote it and is COUNTED under another locale (ruling 4 as a number); under English nothing counts', async () => {
    const w = mountBeat(cardFor(COLUMNS[0]!))
    expect(missCount()).toBe(0)
    installCatalog('ru', {})
    await setLocale('ru')
    resetMisses()
    await nextTick()
    w.unmount()
    const again = mountBeat(cardFor(COLUMNS[0]!))
    expect(radios(again)).toEqual(cardFor(COLUMNS[0]!).options.map((o) => o.label))
    for (const o of cardFor(COLUMNS[0]!).options) expect(missedKeys(), o.label).toContain(o.label)
    again.unmount()
  })
})

describe('L2-9b context tags – none, each measured against every batch table with the importer\'s row reader', () => {
  it('the labels the tables word TWICE are one surface with two drafts (RU-10 §4.3 against RU-10G; the situation volumes against each other) – left BARE, his reading settles the value', () => {
    const { rows } = readRows(listDocs())
    const russians = (english: string): string[] => [...new Set(rows.filter((r) => r.english?.trim() === english && r.russian !== null).map((r) => r.russian!))]
    const disagreeing = ['Ask her to say more', 'Tell her what we think', 'Tell her it can keep', 'Let her finish', 'Ask what made it good', 'Say she needn\'t solve it tonight', 'Ask how bad it looks']
    // measured 08.10: each has TWO Russians across the tables; if the owner settles one this list shrinks and the line below names which
    console.log(`[L2-9b tags] two-Russian labels across the tables: ${disagreeing.filter((e) => russians(e).length > 1).length} of ${disagreeing.length} checked`)
    for (const english of disagreeing) {
      expect(CATALOG.keys[english], `${english} is a catalog key`).toBeDefined()
      expect(Object.keys(CATALOG.keys).filter((k) => k.endsWith(`|${english}`)), `${english} grew a tag – a tag would freeze both Russians into the product`).toEqual([])
    }
    expect(russians('Proceed'), 'Proceed: three rows, one Russian').toHaveLength(1)
  })
})

describe('L2-9b Russian smoke – ru.json read by key, no Cyrillic typed here', () => {
  it('the REAL ru.json: an approved answer renders his Russian, an unapproved one renders English and is counted (small-talk card, reply, and an announcement)', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    resetMisses()
    const prompt = cardFor(worstAsking)
    const w = mountBeat(prompt)
    const asking = seen(w.element)
    await w.findAll('button.life-beat-choice')[0]!.trigger('click')
    await nextTick()
    const replying = seen(w.element)
    w.unmount()
    const x = mountBeat(EXPECTING)
    await x.get('button.life-beat-choice').trigger('click')
    await nextTick()
    const announcing = seen(x.element)
    x.unmount()
    const everything = [asking, replying, announcing].join('\n')
    const shown = [...prompt.options.map((o) => o.label), ...EXPECTING.options.map((o) => o.label), EXPECTING.confirm, prompt.followUps[0]!.done]
    let approved = 0
    for (const label of shown) {
      if (RU[label] !== undefined) {
        approved++
        expect(everything, `${label} is approved, so his Russian must render`).toContain(RU[label]!)
      } else expect(missedKeys(), `${label} has no row yet – English, and counted`).toContain(label)
    }
    console.log(`[L2-9b smoke] ru.json: ${Object.keys(RU).length} keys; approved among the ${shown.length} labels on three mounted surfaces: ${approved}; distinct misses: ${missedKeys().length}`)
    expect(missCount()).toBeGreaterThan(5)
  })

  it('a stand-in catalog proves each seat asks the catalog (latin markers, one per seat)', async () => {
    const prompt = cardFor(worstAsking)
    installCatalog('ru', { [prompt.options[2]!.label]: 'SEAT-ANSWER*', Proceed: 'SEAT-PROCEED*', 'Let her finish': 'SEAT-DONE*' })
    await setLocale('ru')
    const w = mountBeat(prompt)
    expect(seen(w.element)).toContain('SEAT-ANSWER*')
    await w.findAll('button.life-beat-choice')[0]!.trigger('click')
    await nextTick()
    expect(seen(w.element)).toContain('SEAT-DONE*')
    w.unmount()
    const x = mountBeat(EXPECTING)
    await x.get('button.life-beat-choice').trigger('click')
    await nextTick()
    expect(seen(x.element)).toContain('SEAT-PROCEED*')
    x.unmount()
  })
})

describe('L2-9b xx sweep – the life-beat dialog: the three seats are bracketed, and the BLOCKING card keeps its way on inside a 375x667 phone with every word longer', () => {
  it('zero leaks beyond the engine\'s own prose: the answers, the Proceed and the reply button come out bracketed (the proof the dynamic seats reach the catalog)', async () => {
    await installPseudoLocale()
    const prompt = cardFor(worstAsking)
    const w = mountBeat(prompt)
    const engine = new Set([prompt.heading, prompt.said, ...prompt.followUps.flatMap((f) => [...f.said])].map(flat))
    const asking = hardcodeLeaks(w.element, DEFAULT_ALLOW).filter((l) => !engine.has(l))
    const answers = radios(w)
    await w.findAll('button.life-beat-choice')[0]!.trigger('click')
    await nextTick()
    const replying = hardcodeLeaks(w.element, DEFAULT_ALLOW).filter((l) => !engine.has(l))
    expect(answers.length).toBe(3)
    expect(answers.every((r) => isPseudo(r)), `every answer is bracketed: ${JSON.stringify(answers)}`).toBe(true)
    expect(isPseudo(w.get('.life-beat-listen-done').text()), 'and so is the reply button').toBe(true)
    w.unmount()
    const x = mountBeat(EXPECTING)
    const eng2 = new Set([EXPECTING.heading, EXPECTING.said].map(flat))
    await x.get('button.life-beat-choice').trigger('click')
    await nextTick()
    const announcing = hardcodeLeaks(x.element, DEFAULT_ALLOW).filter((l) => !eng2.has(l))
    x.unmount()
    console.log(`[L2-9b xx] life-beat dialog leaks beyond the engine\'s prose: asking ${JSON.stringify(asking)} · reply ${JSON.stringify(replying)} · announcement ${JSON.stringify(announcing)}`)
    expect(asking).toEqual([])
    expect(replying).toEqual([])
    expect(announcing).toEqual([])
  })

  type Phase = 'asking' | 'replying' | 'selected'
  /** Open the card in a phase and return its dismiss control – the LAST control in the flow, which is what `fits.ts` measures. */
  async function open(prompt: LifeBeatPrompt, vp: Viewport, phase: Phase, pick: number): Promise<{ w: VueWrapper; card: HTMLElement; dismiss: HTMLElement }> {
    const w = mountBeat(prompt, vp)
    const card = document.querySelector('.life-beat-dialog') as HTMLElement
    if (phase !== 'asking') {
      card.querySelectorAll<HTMLButtonElement>('button.life-beat-choice')[pick]!.click()
      await nextTick()
    }
    const all = card.querySelectorAll('button.life-beat-choice')
    const dismiss = (phase === 'asking' ? all[all.length - 1] : card.querySelector(phase === 'replying' ? '.life-beat-listen-done' : '.life-beat-proceed')) as HTMLElement
    expect(dismiss, `the ${phase} state is up – nothing below is vacuous`).toBeTruthy()
    if (phase !== 'asking') expect(card.lastElementChild, 'the way on is the card\'s last element').toBe(dismiss)
    return { w, card, dismiss }
  }

  const replyPick = worstReplying.col.s === worstAsking.s ? 0 : cardFor(worstReplying.col).options.findIndex((o) => o.id === worstReplying.optionId)
  const SURFACES: { label: string; prompt: LifeBeatPrompt; phase: Phase; pick: number }[] = [
    { label: `small talk, her line and three answers (worst of ${COLUMNS.length} columns)`, prompt: cardFor(worstAsking), phase: 'asking', pick: 0 },
    { label: 'small talk, her reply and the one button (the longest route)', prompt: cardFor(worstReplying.col), phase: 'replying', pick: Math.max(0, replyPick) },
    { label: 'the announcement, an answer selected and the Proceed under it', prompt: EXPECTING, phase: 'selected', pick: 0 },
  ]

  for (const vp of [PHONE, NARROW_PHONE]) {
    it(`${vp.width}x${vp.height}: the way on is reachable on all three surfaces with every word padded +30% (English -> xx, numbers printed)`, async () => {
      const lines: string[] = []
      for (const surface of SURFACES) {
        const en = await open(surface.prompt, vp, surface.phase, surface.pick)
        const enFit = assertDismissReachable(en.card, en.dismiss, vp, `LifeBeatDialog (English, ${surface.phase}, ${vp.width}x${vp.height})`)
        const english = (en.card.textContent ?? '').length
        en.w.unmount()
        await installPseudoLocale()
        const xx = await open(surface.prompt, vp, surface.phase, surface.pick)
        const padded = expandRendered(xx.card)
        const xxChars = (xx.card.textContent ?? '').length
        // ⭐ L3-5 (10.10) RE-AIMED: a REAL prompt carries refs now, so its heading and her line come out of the xx catalog already padded (nothing is left for `expandRendered` to reach), while a hand-built prompt
        // with no refs is still padded by it. Either way the measurement SAW the engine's prose: the two words are on the card in the pseudo form.
        const pseudoProse = ['#life-beat-heading', '#life-beat-said'].filter((sel) => isPseudo((xx.card.querySelector(sel)?.textContent ?? '').trim())).length
        expect(padded + pseudoProse, 'the engine\'s prose reached the measurement – padded by expandRendered, or already through the xx catalog').toBeGreaterThanOrEqual(2)
        expect(xxChars, 'xx made the card longer – the measurement saw the words').toBeGreaterThan(english)
        const fit = assertDismissReachable(xx.card, xx.dismiss, vp, `LifeBeatDialog (xx, ${surface.phase}, ${vp.width}x${vp.height})`)
        expect(fit.dismissBottom).toBeLessThanOrEqual(vp.height)
        lines.push(
          `${surface.label}: text ${english} -> ${xxChars} chars; content wants ${enFit.contentFloor.toFixed(0)} -> ${fit.contentFloor.toFixed(0)}px of ${fit.available.height.toFixed(0)} ` +
            `(${fit.contentFloor > fit.available.height ? 'scrolls inside the cap' : 'fits whole'}); way on at ${enFit.dismissTop.toFixed(0)}..${enFit.dismissBottom.toFixed(0)} -> ${fit.dismissTop.toFixed(0)}..${fit.dismissBottom.toFixed(0)} of ${vp.height} (${pct(fit.dismissBottom / vp.height)})`,
        )
        xx.w.unmount()
        resetI18nForTests(null)
      }
      console.log(`[L2-9b xx] life-beat dialog ${vp.width}x${vp.height}: ${lines.join(' · ')}`)
    })
  }

  it('MUTATION: a card taller than the phone, under xx, is reachable with the shared cap and goes RED without it – the assertion bites on this dialog', async () => {
    await installPseudoLocale()
    const base = cardFor(worstReplying.col)
    const tall: LifeBeatPrompt = { ...base, said: Array.from({ length: 8 }, () => base.said).join(' '), options: base.options.map((o) => ({ ...o, label: `${o.label} ${base.said}` })) }
    // every small-talk answer earns a reply, so the card is measured asking: its last answer is the last control in the flow
    const { w, card, dismiss } = await open(tall, PHONE, 'asking', 0)
    expandRendered(card)
    const fit = assertDismissReachable(card, dismiss, PHONE, 'LifeBeatDialog (xx, too tall, capped)')
    expect(fit.contentFloor, 'the mutation is real: the content alone is taller than the room').toBeGreaterThan(fit.available.height)
    card.style.maxHeight = 'none'
    card.style.overflowY = 'visible'
    expect(() => assertDismissReachable(card, dismiss, PHONE, 'LifeBeatDialog (xx, too tall, unbounded)')).toThrow(/declares no height bound|taller than the screen|outside the viewport/)
    card.style.maxHeight = ''
    card.style.overflowY = ''
    assertDismissReachable(card, dismiss, PHONE, 'LifeBeatDialog (xx, too tall, cap restored)')
    console.log(`[L2-9b xx] mutation: the too-tall card wants ${fit.contentFloor.toFixed(0)}px of a ${fit.available.height.toFixed(0)}px room, reachable with the cap (${fit.dismissTop.toFixed(0)}..${fit.dismissBottom.toFixed(0)}), red without it`)
    w.unmount()
  })
})

// `t` is the catalog's own entry; the file reads it for the key-by-key arms above.
void t
