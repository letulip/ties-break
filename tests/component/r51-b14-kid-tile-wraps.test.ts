// =================================================================================================
// ⭐⭐ ROUND 51 B14 – №4 + №21: THE KID SCREEN'S TILES WRAP INSTEAD OF CUTTING (14.10)
// =================================================================================================
//
// The owner's two items, quoted here and not in the template (tests/round13-nav.test.ts bans Cyrillic inside one):
//
//   №4  «На экране девочки на плашке друзья на русском на обоих строчках стоят многоточия и это довольно
//        странно выглядит, мне кажется там вполне можно переносы строк оставить.»
//   №21 «Настроение Сосредоточена не влезает в плашку на личной странице, надо бы сделать перенос»
//
// WHAT CHANGED. `.kid-tile-line` (School, Friends, Coach – and Personality, which already had its own override) lost
// `nowrap` + `ellipsis` and took the Personality precedent whole; the Mood tile lost a `max-width: 62%` that served a face
// crop the owner removed on 29.07; `.kid-tile-lead` got `overflow-wrap: break-word`; and the Russian rows of `Focused` and
// `On the mend` carry a SOFT HYPHEN (U+00AD) so the break lands on a syllable. No English moved. TILE_LINE_MAX did not move.
//
// ⚠ HAPPY-DOM HAS NO LAYOUT ENGINE, so a mounted test here can hold the CASCADE, the SOURCE and the CATALOG, and nothing that
// needs a glyph's width. The widths below were MEASURED instead, in a real Chromium, and are recorded here as a measurement –
// the harness that produced them was a scratch replica (the shipped src/style.css + KidScreen's style block + the app's own
// Manrope files + the catalog's real Russian strings, the six tiles posed as DOM) and is not committed:
//
//   · the inner box of a tile: 89px at 375 (grid 343, column 109, minus 2 x 9 padding and 2 x 1 border), 70.7px at 320.
//   · THE MOOD WORD AT 17px/700, unbroken: Сосредоточена 132.2 · Травмирована 120.5 · Восстанавливается 164.4 – the three that
//     do not fit 89px. Every other word of the set fits at 375 (the widest, Спокойна, is 82.2), and «Тяжело на душе» wraps at its
//     spaces (its longest word is narrower than the box).
//   · WITH THE FLOOR ALONE (`break-word`, no soft hyphen): «Сосредот» / «очена» (a break inside a syllable), «Восстана» /
//     «вливаетс» / «я» (an orphan letter). WITH THE SOFT HYPHENS: «Сосредо-» / «точена» (2 lines) and «Восста-» / «навли-» /
//     «вается» (3 lines – two lines cannot hold 171px in 89px with a hyphen, so three is the floor for that word at this size).
//   · ⚠ THE FIRST SPLIT TRIED FOR THE LONG WORD, ONE HYPHEN AFTER «Восстанав», RENDERED «Восстана» / «в-» / «ливается» (the
//     piece plus its hyphen is 91px against 89, so the browser fell back to the floor and then hyphenated the leftover). It is
//     the reason the row carries TWO hyphens and not one.
//   · «Травмирована» (12 letters, 120.5px) is NOT given a hyphen: the floor alone renders «Травмиро» / «вана», cut at a syllable
//     and not clipped. It is the same class, measured and left alone – the string is his and nothing clipped.
//   · THE FRIENDS TILE IN RUSSIAN at 375: 17 of the 22 notes wrap to two lines or more; the longest, «Теперь остаётся ночевать»,
//     takes three beside a two-line lead, and the tile (and with it the row) is 124.1px against the 88px floor. At 320, 21 of 22
//     wrap and the row peaks at the same 124.1px. No element in any of those cases overflowed its tile.
//   · THE CONDITION RING stays anchored to its own bottom-right corner (9px from the bottom edge, 10px from the right, border
//     included): top 23 in an 88px row, top 60 in a 125px one – it follows the stretch and clips nothing.
//
// ⚠⚠ THE ARM LEDGER – every mutation was really applied, really run and really reverted, the md5 of KidScreen.vue and ru.json asserted back to pristine after each arm (a
// restore trap wrapped the whole run). The counts are MEASURED, over the three files whose nets this change could move: this one (9) · round42-kid-tile-and-account · round23-kid-page.
//
//   CONTROL, run first and green: 34/34. FINAL CONTROL after the last arm: 34/34, both files md5-identical.
//   ARM 1  `.kid-tile-line` put back to `nowrap` + `overflow: hidden` + `ellipsis`, no break-word (the CSS half of №4 reverted). **2 RED**: the Russian four-width sweep and the English
//          control. ⚠ round42 and round23-kid-page stayed GREEN, correctly: the line they hold is the Personality tile's (which has its own override) and the engine's budget – neither
//          can see the cascade of the other three tiles, which is why this file exists.
//   ARM 2  the `max-width: 62%` rule on the Mood word put back. **1 RED**: the cap arm (the source pin and the mounted cascade sit in one case).
//   ARM 3a the soft hyphen stripped from the `Focused` row. **1 RED**: the rows arm.
//   ARM 3b ONE of the two soft hyphens stripped from `On the mend`. **1 RED**: the same arm, which names the two indices.
//          ⚠ THE MOUNTED ARMS STAYED GREEN ON BOTH 3a AND 3b, BY CONSTRUCTION: the test reads ru.json at import, so the tile and its expectation are mutated together. They hold «the tile
//          prints the catalog row verbatim»; the rows arm is what holds the mark itself.
//   ARM 4  `.kid-tile-lead` loses its `overflow-wrap`. **1 RED**: the floor arm.
//   ARM 5  `.kid-tile` gets `max-height: 88px`, so the row can no longer stretch. **1 RED**: the stretch arm – the precondition «a wrapped line costs the row a few pixels and clips nothing» rests on.
//   ARM 6  `.kid-tile-line` loses ONLY its `overflow-wrap`, the wrap itself kept. **1 RED**: the Russian sweep – the floor is held apart from the `nowrap`.
//   NOT RUN: a mutation of TILE_LINE_MAX itself. engine/kidLife.ts is live in a shared checkout, and a mutation there would redden another session's run; the value pin was asserted, never mutated.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import '../../src/style.css'
import KidScreen from '../../src/components/screens/KidScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { TILE_LINE_MAX } from '../../src/engine/kidLife'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import type { Snapshot } from '../../src/shared/protocol'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import { codeOf, region } from '../helpers/source'
import { installMemoryStorage } from './setup'
import { SHELL } from './xxCarpet'
import { setViewport, PHONE, TABLET, DESKTOP, type Viewport } from './fits'

const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
const SHY = '­'
/** 900 is the top of the tablet band and has no entry in `fits.ts` – the same parity set round 42 swept. */
const WIDE: Viewport = { width: 900, height: 900 }
const SWEEP: Viewport[] = [PHONE, TABLET, WIDE, DESKTOP]

/** ⚠ NOT `componentFile()` / `engineModuleSource()`: they resolve against `import.meta.url`, which under happy-dom is an http scheme and throws. Vitest's cwd is the repo root,
 *  so this is the component project's way of reading a source file (r47-raise-another-route names the same discovery). `kidFile` is the `.vue` ALONE – the only honest source for
 *  the negative claim below. */
const repoFile = (rel: string): string => readFileSync(resolve(process.cwd(), rel), 'utf8')
const kidFile = repoFile('src/components/screens/KidScreen.vue')

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

const base = (): Snapshot => toSnapshot(createWorld('r51-b14-kid-tiles', { ...DEFAULT_PROFILE, birthMonth: 10 }))

function mountKid(snap: Snapshot): VueWrapper {
  useGameStore().snapshot = snap
  return mount(KidScreen, SHELL) as VueWrapper
}

/** One computed property off the real cascade (`css: true` in the component project). `getPropertyValue` rather than the camelCase
 *  accessor, because happy-dom only guarantees the accessor for the properties it knows by name. */
const prop = (el: Element, name: string): string => getComputedStyle(el).getPropertyValue(name)

/** School, Friends and Coach: the three tiles that carry the `kid-tile-line` PAIR. Personality has one line, Condition and Mood none. */
function pairTiles(w: VueWrapper) {
  const tiles = w.findAll('.kid-tile').filter((t) => t.findAll('.kid-tile-line').length === 2)
  expect(tiles, 'School, Friends and Coach – the three tiles that carry a pair of lines').toHaveLength(3)
  return tiles
}

function moodLead(w: VueWrapper) {
  return w.get('.kid-tile-mood .kid-tile-lead')
}

describe('⭐⭐ ROUND 51 №4 – the School, Friends and Coach lines WRAP, in Russian, at every width the app has', () => {
  it('⭐ the line cascade says wrap, not cut – at 375 / 768 / 900 / 1280, under Russian', async () => {
    for (const vp of SWEEP) {
      // ⚠ THE VIEWPORT BEFORE THE MOUNT – happy-dom caches a media query on the first computed-style read.
      setViewport(vp)
      await ru()
      const w = mountKid(base())
      for (const tile of pairTiles(w)) {
        for (const line of tile.findAll('.kid-tile-line')) {
          const at = `${vp.width}: «${line.text()}»`
          expect(prop(line.element, 'white-space'), `${at} may wrap`).toBe('normal')
          expect(prop(line.element, 'overflow-wrap'), `${at} breaks a word wider than the cell rather than clipping it`).toBe('break-word')
          expect(prop(line.element, 'text-overflow'), `${at} is never cut with an ellipsis`).toBe('clip')
          expect(prop(line.element, 'overflow'), `${at}: the tile's own clip is the only one`).toBe('visible')
        }
      }
      w.unmount()
    }
  })

  it('⭐ …and the control: the same cascade under English – the fix is not a Russian-only one', async () => {
    setViewport(PHONE)
    await en()
    const w = mountKid(base())
    for (const tile of pairTiles(w)) {
      for (const line of tile.findAll('.kid-tile-line')) {
        expect(prop(line.element, 'white-space')).toBe('normal')
        expect(prop(line.element, 'text-overflow')).toBe('clip')
      }
    }
    w.unmount()
  })

  it('⭐ THE ROW CAN STRETCH: the tile has a floor and no ceiling, at every width (that is what «costs a few pixels and clips nothing» rests on)', async () => {
    for (const vp of SWEEP) {
      setViewport(vp)
      await ru()
      const w = mountKid(base())
      for (const tile of w.findAll('.kid-tile')) {
        const at = `${vp.width}: the «${tile.find('.kid-tile-label').text()}» tile`
        expect(prop(tile.element, 'min-height'), `${at} keeps the export's floor`).toBe('88px')
        expect(['', 'auto'], `${at} has no fixed height`).toContain(prop(tile.element, 'height'))
        expect(['', 'none'], `${at} has no ceiling`).toContain(prop(tile.element, 'max-height'))
        // the one clip is the tile's own: it is what makes a grid item's automatic minimum width 0, so a long word cannot widen a column
        expect(prop(tile.element, 'overflow'), `${at} stays the one clip`).toBe('hidden')
      }
      w.unmount()
    }
  })

  it('⚠⚠ THE ENGINE\'S BUDGET DID NOT MOVE – only the display stopped cutting. And the numbers the stylesheet quotes are the catalog\'s', () => {
    // TILE_LINE_MAX is still what engine/kidLife.ts writes ENGLISH to. The tests that sweep it (kidLife, round23-kid-life,
    // round23-kid-page) keep asserting `<= TILE_LINE_MAX`; this is the value itself, so a wave that "relaxes it because the tile
    // wraps now" has to say so out loud.
    expect(TILE_LINE_MAX, 'the engine\'s English generation budget – the display wraps, the engine still writes short lines').toBe(16)

    // ⚠ A count written in PROSE survives a full gate (CLAUDE.md, wave 9), and the stylesheet's note on `.kid-tile-line` states two.
    // They are read here off the thing: the friend notes are the engine's own list, the Russian is the catalog's.
    const block = region(repoFile('src/engine/kidLife.ts'), 'const FRIEND_LINES', '\n]\n')
    const notes = [...block.matchAll(/text: '([^']*)'/g)].map((m) => m[1])
    expect(notes, 'the engine\'s friend notes').toHaveLength(22)
    const lengths = notes.map((n) => {
      expect(RU[n], `the catalog has a Russian row for «${n}»`).toBeTruthy()
      return RU[n].length
    })
    expect(lengths.filter((l) => l > TILE_LINE_MAX), 'Russian friend notes over the 16-character budget').toHaveLength(15)
    expect(Math.max(...lengths), 'the longest Russian friend note, in characters').toBe(24)
    expect(kidFile, 'the stylesheet note states the same two numbers').toContain('15 of the 22 Russian friend notes')
    expect(kidFile).toContain('the longest is 24 characters')
  })
})

describe('⭐⭐ ROUND 51 №21 – the Mood word wraps: the stale cap is gone, the floor is under it, the syllable is in the string', () => {
  it('⭐ THE 62% CAP IS GONE – from the stylesheet and from the cascade', async () => {
    // NEGATIVE claim, so the SFC alone (`componentFile`) with its comments stripped: the removal note quotes the old rule on purpose.
    const css = codeOf(kidFile)
    expect(css, 'no rule selects the Mood tile\'s word any more').not.toMatch(/\.kid-tile-mood\s+\.kid-tile-lead/)
    expect(css, 'and nothing caps a tile word at 62%').not.toMatch(/max-width:\s*62%/)
    for (const vp of SWEEP) {
      setViewport(vp)
      await ru()
      const w = mountKid(base())
      expect(['', 'none'], `${vp.width}: the word has the whole inner box`).toContain(prop(moodLead(w).element, 'max-width'))
      w.unmount()
    }
  })

  it('⭐ THE FLOOR: `.kid-tile-lead` breaks a word wider than the cell rather than letting the tile clip it – at 375 / 768 / 900 / 1280', async () => {
    for (const vp of SWEEP) {
      setViewport(vp)
      await ru()
      const w = mountKid(base())
      expect(prop(moodLead(w).element, 'overflow-wrap'), `${vp.width}`).toBe('break-word')
      // `.kid-tile-lead` never declared `white-space` (no `nowrap` to undo), so the cascade holds the initial value: the claim is «not nowrap»
      expect(['', 'normal'], `${vp.width}: a mood of two words wraps at the space`).toContain(prop(moodLead(w).element, 'white-space'))
      w.unmount()
    }
  })

  it('⭐⭐ THE TWO ROWS CARRY THEIR SOFT HYPHENS, AT THE SYLLABLES, AND THE WORDS ARE HIS UNCHANGED', () => {
    // ⚠ HIS STRINGS: the mark is the one sanctioned touch (his «надо бы сделать перенос»). The wording is pinned as unchanged
    // by stripping the mark and comparing to the word the catalog carried before.
    const focused = RU['Focused']
    expect([...focused].filter((c) => c === SHY), 'one hyphen in Focused').toHaveLength(1)
    expect(focused.indexOf(SHY), 'after the seventh letter: Сосредо|точена').toBe(7)
    expect(focused.replaceAll(SHY, ''), 'the word itself is unchanged').toBe('Сосредоточена')

    const mend = RU['On the mend']
    expect([...mend].filter((c) => c === SHY), 'two hyphens in On the mend').toHaveLength(2)
    expect([...mend].flatMap((c, i) => (c === SHY ? [i] : [])), 'after Восста and after навли: Восста|навли|вается').toEqual([6, 12])
    expect(mend.replaceAll(SHY, ''), 'the word itself is unchanged').toBe('Восстанавливается')

    // …and they are the ONLY two. Every other Russian value in the catalog is exactly what it was, the third word that does not fit
    // (Hurt) included: measured, it breaks at a syllable on the floor alone and clips nothing, so it is left as he wrote it.
    const withMark = Object.entries(RU)
      .filter(([, v]) => v.includes(SHY))
      .map(([k]) => k)
      .sort()
    expect(withMark, 'the catalog values that carry a soft hyphen').toEqual(['Focused', 'On the mend'])
  })

  it('⭐⭐ MOUNTED UNDER RUSSIAN, THE MOOD TILE PRINTS THE ROWS VERBATIM – a real injured career for On the mend, a posed emotion for Focused', async () => {
    await ru()
    const world = createWorld('r51-b14-rehab', { ...DEFAULT_PROFILE, birthMonth: 10 })
    world.injury = { kind: 'ankle soreness', severity: 'moderate', weeksRemaining: 3, totalWeeks: 5, sinceWeek: world.week - 2 }
    const rehab = toSnapshot(world)
    expect(rehab.diary.facts.emotion, 'injury outranks every channel – the engine hands rehab').toBe('rehab')
    expect(rehab.diary.facts.moodWord, 'and no engine word takes the tile on an injured week').toBeNull()
    const a = mountKid(rehab)
    expect(moodLead(a).element.textContent, 'the Russian row, soft hyphens and all').toBe(RU['On the mend'])
    a.unmount()

    // ⚠ POSED, AND SAYS SO: `serious` is the face of a lost final, a week no cheap real career reaches. This arm holds the SCREEN's
    // word for the engine's emotion, not the engine's decision (which diary/facts.ts and its own tests hold).
    const s = base()
    const serious = { ...s, diary: { ...s.diary, facts: { ...s.diary.facts, emotion: 'serious', moodWord: null } } } as Snapshot
    const b = mountKid(serious)
    expect(moodLead(b).element.textContent, 'the Russian row, soft hyphen and all').toBe(RU['Focused'])
    b.unmount()
  })

  it('⭐ …and under English nothing moved: the same two weeks print the English rows to the character', async () => {
    await en()
    const world = createWorld('r51-b14-rehab', { ...DEFAULT_PROFILE, birthMonth: 10 })
    world.injury = { kind: 'ankle soreness', severity: 'moderate', weeksRemaining: 3, totalWeeks: 5, sinceWeek: world.week - 2 }
    const a = mountKid(toSnapshot(world))
    expect(moodLead(a).element.textContent).toBe('On the mend')
    a.unmount()
    const s = base()
    const b = mountKid({ ...s, diary: { ...s.diary, facts: { ...s.diary.facts, emotion: 'serious', moodWord: null } } } as Snapshot)
    expect(moodLead(b).element.textContent).toBe('Focused')
    b.unmount()
  })
})
