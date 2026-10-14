// =================================================================================================
// ⭐⭐ ROUND 52 H1 – THE «COACH» TILE WEARS THE APP'S FONT, LIKE THE OTHER TILES (14.10)
// =================================================================================================
//
// The owner, 14.10, quoted here and not in the template (tests/round13-nav.test.ts bans Cyrillic inside one): «да, шрифт на плашке тоже поправь».
//
// THE DEFECT (builder F2, while measuring the feel line): the Coach tile is `<Card as="button">`, and a <button> does not inherit `font-family` – the browser's own sheet gives it the platform's
// button face, the global `button` rule in style.css sets a size and no family, Card.vue sets none. So the tile's label, name, tier and feel line rendered in that face (Arial in Playwright's
// Chromium) while the sibling tiles, which are divs, wear Manrope. THE FIX is one declaration on the tile's own class: `.kid-tile-door { font-family: inherit }`.
//
// ⚠ HAPPY-DOM HAS NO USER-AGENT SHEET FOR A BUTTON – its default CSS for BUTTON is `display: inline-block;` and nothing else. A bare comparison of two computed families could therefore NEVER
// go red: the unfixed tile would "inherit" a family by accident and agree with its siblings, and the test would be green over the very defect it is named for. So this file installs the ONE
// user-agent behaviour the defect depends on – a button has a family of its own – as a stand-in sheet at the FRONT of the head, where it loses every tie to author CSS exactly as the
// browser's own sheet does (`button` is the lowest specificity there is, and it is first in source order). Whatever author rule reaches the tile – this fix, a token, a global `button` reset –
// beats it; with none, the tile reports the stand-in's face. The CONTROL arm holds that the stand-in is in force at all (a green over a stand-in that applied to nothing is the null result
// CLAUDE.md warns about), and it is the arm that goes red if someone "simplifies" the stand-in away.
//
// WHAT IS COMPARED: the tile's element AND every piece of text the player reads in it (the label and the lines). A button's text inherits from the BUTTON, so the lines are where a wrong face
// is actually seen, and the tile's element alone would pass a fix that left the lines behind. Against every sibling tile, the Friends tile named so a failure says which one – in both languages.
//
// NOT RE-MEASURED, ON PURPOSE: F2 measured the tile's fit (every line inside its tile, no word wider than the box, 24 variants) in real Chromium with Manrope FORCED onto the tile – which is
// exactly the state this fix produces – and Manrope is the WIDER face (the button font ran about 7% narrower), so his numbers are the worst case and stand. This file holds the cascade, not a glyph.
//
// ⚠ A SECOND HAPPY-DOM GAP, found by this file's first run: it reports the KEYWORD `inherit` as the computed value instead of resolving it (the fixed tile and every line inside it read `inherit` while the
// siblings read the real family), so `family()` below resolves the keyword the way CSS defines it – to the parent's computed value.
//
// ⚠⚠ THE ARM LEDGER – every mutation really applied, really run against THIS file alone, and really reverted: the md5 of KidScreen.vue and of this file were asserted back to the pristine pair after the
// arms, and a run on the restored tree closed the sequence. CONTROL, first and green: 3/3 (the English arm, the Russian arm, the stand-in arm). The counts are MEASURED.
//   ARM M1  `font-family: inherit` deleted from `.kid-tile-door`, the stand-in present. **2 RED**: the English and the Russian arm (the control stays green). THIS is the fix's test.
//   ARM M2  the stand-in's `document.head.prepend(uaSheet)` commented out, the rule present. **1 RED**: the control, and only it – the language arms cannot tell, because the rule is there.
//   ARM M3  BOTH removed. **1 RED**: still only the control – the two language arms are GREEN over the unfixed tile. That is the null result the stand-in exists to prevent, measured: without it the
//           comparison cannot tell a fixed tile from a broken one, and the control is what refuses to let that pass quietly.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import '../../src/style.css'
import KidScreen from '../../src/components/screens/KidScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import type { Snapshot } from '../../src/shared/protocol'
import { installCatalog, resetI18nForTests, setLocale, t } from '../../src/i18n'
import { installMemoryStorage } from './setup'
import { SHELL } from './xxCarpet'

const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>

/** The face the stand-in gives EVERY button – named so a failure message says who won. */
const UA_FACE = 'Arial'

let uaSheet: HTMLStyleElement | undefined
/** THE USER-AGENT STAND-IN: first in the head, so it loses every tie to the app's own CSS, which the vite CSS plugin has already injected by the time a test runs. */
function installUaButtonFace(): void {
  uaSheet = document.createElement('style')
  uaSheet.textContent = `button { font-family: ${UA_FACE}, sans-serif; }`
  document.head.prepend(uaSheet)
}

beforeEach(() => {
  installMemoryStorage()
  setActivePinia(createPinia())
  document.body.innerHTML = ''
  installUaButtonFace()
})
afterEach(() => {
  uaSheet?.remove()
  uaSheet = undefined
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
/** A career with the default MIDDLE coach employed from day one – the Coach tile has all three of its lines (name, tier, feel). */
const coached = (): Snapshot => (COACHED ??= toSnapshot(createWorld('r52-h1-coached', { ...DEFAULT_PROFILE, birthMonth: 10 })))

function mountKid(): VueWrapper {
  useGameStore().snapshot = coached()
  return mount(KidScreen, SHELL) as VueWrapper
}

const computedFamily = (el: Element): string => getComputedStyle(el).getPropertyValue('font-family')
/**
 * ⚠ HAPPY-DOM REPORTS THE KEYWORD `inherit` AS THE COMPUTED VALUE (measured on this file's first run: the fixed tile and every line inside it read `inherit`, the siblings read the real family).
 * Every browser resolves the keyword, so it is resolved here the way CSS defines it – to the parent's computed value – and the test compares what the player SEES, not happy-dom's spelling.
 */
function family(el: Element): string {
  const value = computedFamily(el)
  return value === 'inherit' && el.parentElement ? family(el.parentElement) : value
}
/** The tile's own element plus every piece of text the player reads in it. */
const facesOf = (tile: Element): string[] => [tile, ...Array.from(tile.querySelectorAll('.kid-tile-label, .kid-tile-line'))].map(family)

/** The Coach tile, every other tile, and the Friends tile among them (found by its label, in whichever language is on). */
function tiles(w: VueWrapper): { door: Element; siblings: Element[]; friends: Element | undefined } {
  const door = w.get('.kid-tile-door').element
  const siblings = w.findAll('.kid-tile').map((x) => x.element).filter((el) => el !== door)
  const friends = siblings.find((el) => el.querySelector('.kid-tile-label')?.textContent?.trim() === t('Friends'))
  return { door, siblings, friends }
}

describe('⭐⭐ ROUND 52 H1 – the Coach tile wears the same face as its sibling tiles', () => {
  for (const lang of ['en', 'ru'] as const) {
    it(`⭐ ${lang}: the tile and every line in it compute to the family the Friends tile (and each other tile) inherits`, async () => {
      await (lang === 'en' ? en() : ru())
      const w = mountKid()
      const { door, siblings, friends } = tiles(w)
      expect(friends, `${lang}: the Friends tile is on the screen, found by its label`).toBeTruthy()
      expect(siblings.length, `${lang}: there are other tiles to compare against`).toBeGreaterThan(1)

      const want = facesOf(friends!)
      expect(new Set(want).size, `${lang}: a sibling tile is ONE face throughout (${want.join(' | ')})`).toBe(1)
      expect(want[0], `${lang}: and it is a real family – an empty string is something two things could share by accident`).not.toBe('')
      expect(want[0], `${lang}: and it is not the platform's button face`).not.toContain(UA_FACE)
      for (const sibling of siblings) expect(new Set(facesOf(sibling)), `${lang}: every tile that is not a door wears that face`).toEqual(new Set(want))

      expect(new Set(facesOf(door)), `${lang}: THE COACH TILE – element, label, name, tier and feel line – wears the face of its siblings (it reports ${facesOf(door).join(' | ')})`).toEqual(new Set(want))
      w.unmount()
    })
  }

  it('⚠ CONTROL: the stand-in bites – a bare <button> put in the same grid reports the platform face, which is NOT the siblings\'', async () => {
    await en()
    const w = mountKid()
    const { door, friends } = tiles(w)
    const bare = document.createElement('button')
    door.parentElement!.appendChild(bare)
    expect(family(bare), 'a button with no author family rule gets the stand-in\'s face – so a tile that reports anything else was reached by an author rule').toContain(UA_FACE)
    expect(family(bare), 'and that face differs from what a sibling tile inherits, so the comparison above CAN go red').not.toBe(family(friends!))
    w.unmount()
  })
})
