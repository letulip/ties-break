// =================================================================================================
// ⭐⭐ ROUND 52 F2 – THE «COACH» TILE SHOWS HER FEEL FOR THE COACH (14.10)
// =================================================================================================
//
// The owner, 14.10, quoted here and not in the template (tests/round13-nav.test.ts bans Cyrillic inside one):
//
//   «я хочу сделать систему, что ребенок может намекать, что ей ок, норм или вообще не ок с этим тренером, чтобы у игрока была какая-то обратная связь от ребенка для принятия решения»
//   the channel he picked: «Плашка "Тренер"» – «видна в любой момент… игрок может проверить сам»
//   and how sure she may sound: «не "всё плохо" а "я пока не очень поняла" или "вроде нормально, но" или что-то в таком духе, т.е. она еще не уверена, а просто сомневается»
//
// WHAT IS BUILT. `Snapshot.coachFeel` (F1/F1b: six ids, never a number, key ABSENT with nobody employed) gets its one reader: the Kid screen's Coach tile gains a THIRD line, and the
// tile's `aria-label` – which REPLACES a button's content for a screen reader, so a visible line alone would be silent – gains the same phrase. The words are the UI's, one `t()` key per
// step; the old label `Coach – open the Coach Market` is byte-identical and is still what a tile with no feel says.
//
// ⚠ HAPPY-DOM HAS NO LAYOUT ENGINE (r51 B14's note), so a mounted test here holds the CASCADE, the SOURCE and the CATALOG, and nothing that needs a glyph's width. The widths were
// MEASURED instead, in a real Chromium with the app's own Manrope files (the scratch harness is not committed; Manrope 11.5px, `overflow-wrap: break-word`, the inner box 89px at 375 and
// 70.7px at 320, both from B14). Lines at 375 / at 320, the hedged steps at weight 500 and the two sure ones at 600:
//   RU  Ещё знакомятся 1 / 2 · «Пока не поняла» 2 / 2 · «Вроде получается» 2 / 2 · «Вроде нормально, но…» 3 / 3 · Ладят 1 / 1 · Не ладят 1 / 1
//   EN  Still getting acquainted 2 / 2 · "Can't tell yet" 1 / 2 · "Seems to be working" 2 / 2 · "Seems fine, but…" 2 / 2 · Clicking well 1 / 1 · Not clicking 1 / 1
//   · NO WORD IS WIDER THAN THE BOX in the set shipped. The widest are `получается»` 69.8px against 70.7 at 320 (⚠ a 0.9px margin: at weight 600 the closing guillemet orphans onto a
//     line of its own, which is why the hedged steps stay SOFT) and `нормально,` 64px.
//   · THE FIRST RUSSIAN DRAFT FOR `too-early`, `Ещё присматриваются`, FAILED THE MEASUREMENT: `присматриваются` is 99.7px (101.4 at 600) against 89, so the floor of `break-word` would
//     cut it as `присматривают` / `ся` – the orphan-letter class B14 found for `Восстанавливается`. `знакомятся` is 64px. The test "no word of a line is longer than 11 characters" below is
//     the proxy for that measurement a layout-less environment CAN hold: 11 characters is the measured edge (`получается»`), the draft was 15. A proxy, not the measurement.
//   · `«Вроде нормально, но…»` takes three lines at both widths and the row stretches (it is his phrase verbatim); the tile's row has no ceiling, which the stretch arm below holds.
//   · ⚠ THE TILE IS A `<button>`, AND A BUTTON DOES NOT INHERIT `font-family` (the global `button` rule sets a size and no family, and Card.vue sets none), so the Coach tile – the name, the tier AND the new line –
//     renders in the PLATFORM's button font (Arial in Playwright's Chromium), not in Manrope like its five siblings. PRE-EXISTING, not touched here, and worth the architect's eye. It does not weaken the
//     measurement: Manrope is the WIDER face (the same component DOM in Arial ran about 7% narrower), so what fits in Manrope fits in the button font.
//   · RE-MEASURED ON THE REAL COMPONENT DOM (the mounted KidScreen's HTML plus the shipped CSS, loaded in Chromium with Manrope forced onto the tile, the grid pinned to B14's 343px / 288px): all 24 variants – six
//     steps x two languages x 375 and 320 – have every line inside its tile, no word wider than the box (inner box 89px / 70.7px, the same numbers B14 recorded) and no scroll. The tile row's worst case is the
//     Russian `seems-off` at three lines: 141.3px at 375 and 155.6px at 320 (B14's recorded worst case for the Friends tile was 124.1px); every English state is 98.1 to 126.9px.
//
// ⚠⚠ THE ARM LEDGER – every mutation was really applied, really run against THIS file and really reverted; the md5 of KidScreen.vue (and of ru.json for the one arm that touches it) was asserted back to
// pristine after each arm by the harness (a restore handler around the whole run). CONTROL, run first and green: 13/13. The counts are MEASURED, over this file alone.
//   ARM M1  the template hunk's feel line removed (the `<p v-if="coachFeelLine" …>`). **7 RED**: the cascade sweep, both label arms, both language arms, the follows-the-engine arm and the weight arm. The
//           absent-key arms and the proxy stay green by construction – they hold the missing line and the strings, not the line.
//   ARM M2  the aria-label put back to the old plain key. **2 RED**: the English and the Russian label arms – and ONLY those: the visible line is a separate hunk of the template.
//   ARM M3  `good` and `off` swapped in the switch. **4 RED**: both per-step arms and both label arms – a step mapped to another step's phrase cannot hide.
//   ARM M4  the soft class inverted (sure steps soft, hedged steps firm). **1 RED**: the weight arm.
//   ARM M5  ru.json: the `too-early` row set back to the 15-letter draft word. **1 RED**: the 11-character proxy – the only arm that holds the measurement's consequence for the strings.
//   ARM M6  a `nowrap` + `overflow: hidden` + `ellipsis` rule on `.kid-tile-feel`. **1 RED**: the cascade sweep.
//   ARM M7  the guard `v-if="coachFeelLine"` replaced by `v-if="true"`. **2 RED**: the self-coached arm and the missing-key arm.
//   NOT RUN: the stretch arm against a mutation (`.kid-tile` given a `max-height`) – r51 B14's ARM 5 holds that property for every `.kid-tile`, and this file's copy of the check reads the same properties.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import '../../src/style.css'
import KidScreen from '../../src/components/screens/KidScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { COACH_FEEL_STEPS } from '../../src/engine/chemistry'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import type { CoachFeel, Snapshot } from '../../src/shared/protocol'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import { installMemoryStorage } from './setup'
import { SHELL } from './xxCarpet'
import { setViewport, PHONE, NARROW_PHONE, TABLET, DESKTOP, type Viewport } from './fits'

const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
/** ⚠ NOT `componentFile()`: it resolves against `import.meta.url`, which under happy-dom is an http scheme and throws (r51-b14 names the same discovery). */
const repoFile = (rel: string): string => readFileSync(resolve(process.cwd(), rel), 'utf8')

/** The UI's own phrase for each step – the ENGLISH KEY the tile prints. Typed here on purpose: this is the table the screen is held against, and the Russian is read from ru.json by it. */
const LINES: ReadonlyArray<readonly [CoachFeel, string]> = [
  ['too-early', 'Still getting acquainted'],
  ['unsure', '"Can\'t tell yet"'],
  ['seems-good', '"Seems to be working"'],
  ['seems-off', '"Seems fine, but…"'],
  ['good', 'Clicking well'],
  ['off', 'Not clicking'],
]
/** The two steps she is SURE of: the engine only says them when the gauge on the coach's card already shows a figure of the same sign. */
const SURE: ReadonlySet<CoachFeel> = new Set<CoachFeel>(['good', 'off'])
const ARIA_FEEL = 'Coach – {feel} – open the Coach Market'
const ARIA_PLAIN = 'Coach – open the Coach Market'

beforeEach(() => {
  installMemoryStorage()
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})
afterEach(() => {
  setViewport(DESKTOP)
  document.body.innerHTML = ''
  resetI18nForTests(null)
  document.documentElement.lang = 'en'
})

async function ru(): Promise<void> {
  resetI18nForTests(null)
  installCatalog('ru', RU)
  await setLocale('ru')
}
async function en(): Promise<void> {
  resetI18nForTests(null)
  await setLocale('en')
}

let COACHED: Snapshot | undefined
let SELF: Snapshot | undefined
/** A career with the default MIDDLE coach employed from day one – the engine has a step to report. */
const coached = (): Snapshot => (COACHED ??= toSnapshot(createWorld('r52-f2-coached', { ...DEFAULT_PROFILE, birthMonth: 10 })))
/** A self-coached career: nobody is employed, so the snapshot carries NO `coachFeel` key at all. */
const selfCoached = (): Snapshot => (SELF ??= toSnapshot(createWorld('r52-f2-self', { ...DEFAULT_PROFILE, birthMonth: 10, coachTier: 'self' })))
/** POSED, AND SAYS SO: the engine's own tests (F1/F1b, B14) hold how a step is CHOSEN; this file holds how a step is SHOWN. */
const posed = (step: CoachFeel): Snapshot => ({ ...coached(), coachFeel: step })

function mountKid(snap: Snapshot): VueWrapper {
  useGameStore().snapshot = snap
  return mount(KidScreen, SHELL) as VueWrapper
}
const door = (w: VueWrapper) => w.get('.kid-tile-door')
const feelLine = (w: VueWrapper) => door(w).find('.kid-tile-feel')
const prop = (el: Element, name: string): string => getComputedStyle(el).getPropertyValue(name)

describe('⭐⭐ ROUND 52 F2 – the table the screen is held against is the engine\'s own six steps', () => {
  it('⭐ …six steps, six different phrases, the same six ids the engine exports, and a Russian row for each', () => {
    expect(LINES.map(([step]) => step), 'the engine\'s six steps (a seventh would be a compile error in the screen, and a red here)').toEqual([...COACH_FEEL_STEPS])
    expect(new Set(LINES.map(([, key]) => key)).size, 'six different English phrases').toBe(6)
    for (const [step, key] of LINES) {
      expect(RU[key], `${step}: the catalog has a Russian row for «${key}»`).toBeTruthy()
      expect(RU[key], `${step}: and it is not the English`).not.toBe(key)
    }
    expect(new Set(LINES.map(([, key]) => RU[key])).size, 'six different Russian phrases').toBe(6)
    expect(RU[ARIA_FEEL], 'the new label has a Russian row').toBeTruthy()
    expect(RU[ARIA_FEEL], 'and its hole is named `{feel}`').toContain('{feel}')
  })
})

describe('⭐⭐ ROUND 52 F2 – each step prints its OWN line, third under the name and the tier, in both languages', () => {
  it('⭐ English: all six steps, the first two lines untouched', async () => {
    await en()
    for (const [step, key] of LINES) {
      const w = mountKid(posed(step))
      const lines = door(w).findAll('.kid-tile-line')
      const coach = coached().coachMarket.find((c) => c.current)
      expect(coach, 'the default career employs a coach').toBeTruthy()
      expect(lines, `${step}: name, tier, feel`).toHaveLength(3)
      expect(lines[0].text(), `${step}: the name line is the coach's name, as before`).toBe(coach!.name)
      expect(lines[1].classes(), `${step}: the tier line is still soft`).toContain('kid-tile-line-soft')
      expect(lines[2].text(), step).toBe(key)
      expect(lines[2].classes(), step).toContain('kid-tile-feel')
      expect(feelLine(w).text(), `${step}: the one feel line is the third`).toBe(key)
      w.unmount()
    }
  })

  it('⭐ Russian: the same six steps, each the catalog\'s row by key', async () => {
    await ru()
    for (const [step, key] of LINES) {
      const w = mountKid(posed(step))
      expect(door(w).findAll('.kid-tile-line'), `${step}: name, tier, feel`).toHaveLength(3)
      expect(feelLine(w).text(), step).toBe(RU[key])
      w.unmount()
    }
  })

  it('⭐⭐ THE SCREEN FOLLOWS THE ENGINE: an unposed career prints the line of whatever step its own snapshot carries', async () => {
    await en()
    const snap = coached()
    expect(snap.coachFeel, 'a hired coach: the engine says a step').toBeDefined()
    const w = mountKid(snap)
    expect(feelLine(w).text()).toBe(LINES.find(([step]) => step === snap.coachFeel)![1])
    w.unmount()
  })
})

describe('⭐⭐ ROUND 52 F2 – WITHOUT A FEEL THERE IS NO LINE, and the label is the old string to the byte', () => {
  it('⭐ a SELF-COACHED career carries no key, and the tile is the two lines it always was', async () => {
    const snap = selfCoached()
    expect('coachFeel' in snap, 'the engine\'s contract: ABSENT, not null').toBe(false)
    for (const lang of ['en', 'ru'] as const) {
      await (lang === 'en' ? en() : ru())
      const w = mountKid(snap)
      expect(door(w).findAll('.kid-tile-line'), `${lang}: name and tier only`).toHaveLength(2)
      expect(w.find('.kid-tile-feel').exists(), lang).toBe(false)
      expect(door(w).attributes('aria-label'), lang).toBe(lang === 'en' ? ARIA_PLAIN : RU[ARIA_PLAIN])
      w.unmount()
    }
  })

  it('⭐ …and a coach with the key missing (posed) shows nothing either – the screen never invents a feel', async () => {
    await en()
    const { coachFeel: _drop, ...rest } = coached()
    const w = mountKid(rest as Snapshot)
    expect(w.find('.kid-tile-feel').exists()).toBe(false)
    expect(door(w).findAll('.kid-tile-line')).toHaveLength(2)
    expect(door(w).attributes('aria-label')).toBe(ARIA_PLAIN)
    w.unmount()
  })

  it('⚠ THE OLD KEYS ARE UNTOUCHED – the owner\'s rule: a string nobody asked to change is not changed', () => {
    const catalog = repoFile('src/i18n/catalog.en.json')
    for (const key of [ARIA_PLAIN, 'Coach', 'You', '{0} tier']) expect(catalog, `«${key}» is still a catalog key`).toContain(JSON.stringify(key))
    expect(RU[ARIA_PLAIN], 'the old label\'s Russian row has no hole').not.toContain('{')
  })
})

describe('⭐⭐ ROUND 52 F2 – THE aria-label CARRIES THE FEEL (a button\'s label replaces its content for a screen reader)', () => {
  it('⭐ English: the new key with the step\'s phrase in the hole, for all six', async () => {
    await en()
    for (const [step, key] of LINES) {
      const w = mountKid(posed(step))
      const label = door(w).attributes('aria-label')
      expect(label, step).toBe(ARIA_FEEL.replace('{feel}', key))
      expect(label, `${step}: whatever the line says, the label says`).toContain(feelLine(w).text())
      w.unmount()
    }
  })

  it('⭐ Russian: the row with the RUSSIAN phrase in the hole – the hole carries a translated phrase, not the English id', async () => {
    await ru()
    for (const [step, key] of LINES) {
      const w = mountKid(posed(step))
      const label = door(w).attributes('aria-label')
      expect(label, step).toBe(RU[ARIA_FEEL].replace('{feel}', RU[key]))
      expect(label, `${step}: the label carries the visible line`).toContain(feelLine(w).text())
      expect(label, `${step}: and no English phrase leaks into it`).not.toContain(key)
      w.unmount()
    }
  })
})

describe('⭐⭐ ROUND 52 F2 – the weight is the doubt: hedged steps wear the soft class, the two she is sure of wear the name line\'s weight', () => {
  it('⭐ the class and the cascaded weight, per step', async () => {
    await en()
    for (const [step] of LINES) {
      const w = mountKid(posed(step))
      const line = feelLine(w)
      const sure = SURE.has(step)
      expect(line.classes().includes('kid-tile-line-soft'), `${step}: soft unless she is sure`).toBe(!sure)
      expect(prop(line.element, 'font-weight'), `${step}: ${sure ? 'the name line\'s weight' : 'the tier line\'s weight'}`).toBe(sure ? '600' : '500')
      w.unmount()
    }
  })
})

describe('⭐⭐ ROUND 52 F2 – A PHONE: the new line wraps inside the tile at 375 and 320 (and the widths above the phone), in both languages', () => {
  const SWEEP: Viewport[] = [PHONE, NARROW_PHONE, TABLET, DESKTOP]

  it('⭐ the cascade of the feel line says wrap, not cut – the six steps x four widths x two languages', async () => {
    for (const vp of SWEEP) {
      // ⚠ THE VIEWPORT BEFORE THE MOUNT – happy-dom caches a media query on the first computed-style read (setViewport's note).
      setViewport(vp)
      for (const lang of ['en', 'ru'] as const) {
        await (lang === 'en' ? en() : ru())
        for (const [step] of LINES) {
          const w = mountKid(posed(step))
          const at = `${vp.width} ${lang} ${step}`
          const line = feelLine(w)
          expect(door(w).element.contains(line.element), `${at}: the line is INSIDE the tile`).toBe(true)
          expect(prop(line.element, 'white-space'), `${at}: may wrap`).toBe('normal')
          expect(prop(line.element, 'overflow-wrap'), `${at}: breaks a word wider than the cell rather than clipping it`).toBe('break-word')
          expect(prop(line.element, 'text-overflow'), `${at}: never an ellipsis`).toBe('clip')
          expect(prop(line.element, 'overflow'), `${at}: the tile's own clip is the only one`).toBe('visible')
          expect(line.attributes('style'), `${at}: no inline width or height on the line`).toBeUndefined()
          w.unmount()
        }
      }
    }
  })

  it('⭐ THE TILE CAN STRETCH to hold a third line: a floor and no ceiling, at every width (what «costs a few pixels, clips nothing» rests on)', async () => {
    for (const vp of SWEEP) {
      setViewport(vp)
      await ru()
      const w = mountKid(posed('seems-off'))
      const tile = door(w)
      const at = `${vp.width}: the Coach tile`
      expect(prop(tile.element, 'min-height'), `${at} keeps the export's floor`).toBe('88px')
      expect(['', 'auto'], `${at} has no fixed height`).toContain(prop(tile.element, 'height'))
      expect(['', 'none'], `${at} has no ceiling`).toContain(prop(tile.element, 'max-height'))
      expect(prop(tile.element, 'overflow'), `${at} stays the one clip`).toBe('hidden')
      w.unmount()
    }
  })

  it('⭐ PROXY FOR THE MEASURED WIDTHS: no word of any shipped line is longer than 11 characters, in either language', () => {
    // 11 characters is the MEASURED edge – `получается»` is 69.8px against the 70.7px box at 320; the Russian draft `присматриваются` was 15 characters, 99.7px, and broke mid-word.
    // happy-dom cannot measure a glyph, so this holds the measurement's CONSEQUENCE for the strings; the numbers themselves are the header's.
    const words = (s: string): string[] => s.split(/\s+/).filter(Boolean)
    for (const [step, key] of LINES) {
      for (const [lang, text] of [['en', key], ['ru', RU[key]]] as const) {
        for (const word of words(text)) expect(word.length, `${lang} ${step}: «${word}»`).toBeLessThanOrEqual(11)
      }
    }
  })
})
