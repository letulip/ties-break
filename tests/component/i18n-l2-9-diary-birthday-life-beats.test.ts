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
import { useGameStore } from '../../src/stores/game'
import { createWorld, decideKnock, pendingBirthday, pendingKnock, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import { installCatalog, missCount, missedKeys, resetI18nForTests, resetMisses, setLocale } from '../../src/i18n'
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

  it('the heading, the ask and the four rows are NOT read through a key: they are the RU-09 headings and the RU-09A gift corpus – engine-born, L3', () => {
    const source = SRC('src/components/BirthdayDialog.vue')
    for (const bare of ['{{ prompt.heading }}', '{{ prompt.ask }}', '{{ option.label }}', '{{ option.note }}']) expect(source, bare).toContain(bare)
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
          `${fit.scrollable ? 'scrolls' : 'does not scroll'}); the Proceed at ${enFit.dismissTop.toFixed(0)}..${enFit.dismissBottom.toFixed(0)} -> ${fit.dismissTop.toFixed(0)}..${fit.dismissBottom.toFixed(0)} of ${vp.height}`,
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
