// ⭐ U-09 (review of 05.09, docs/review-principles-2026-09-05/03-ui.md) – TWO DESIGN-PACK DIMENSIONS
// STOP BEING SPELLED IN SIX FILES.
//
// `--read-max: 640px` was written out four times (the wizard's column, the prologue card, Money's
// share note and its shop grid) and `--card-min: 343px` twice (`.tier-block`, `.shop-family`), and
// every one of those six says IN PROSE that it is the same number as the others – which is exactly
// the state `--app-pad-x` was in before it drifted, and the criterion `--takeover-col-max` was added
// on ("IT IS A TOKEN BECAUSE THE NUMBER WAS ALREADY SPELLED TWICE").
//
// ⚠ A ZERO-PIXEL CHANGE, AND THAT IS WHAT THE FIRST CASE MEASURES. happy-dom resolves `var()` in
// `max-width` and inside `minmax()` (probed before this was written), so the computed value at every
// consumer is the string it was.
//
// ⚠ FIVE OF THE SIX CONSUMERS ALREADY HAD MOUNTED ASSERTIONS AND THEY ARE NOT DUPLICATED HERE:
// `.ob-shell`'s three parts and `.shelf-cats` at round36-phase4.test.ts:250/494, `.shop-family` at
// :542, `.tier-block` at round18-coach.test.ts:514. All four assert the RESOLVED value, so they are
// this change's real net and they were run against it. What this file adds is the token itself –
// the one place that now says what the number IS – plus the two consumers nothing was watching.
//
// ⚠ THE THIRD TOKEN THE REVIEW PROPOSED WAS NOT BUILT, and the reason is in the commit message and
// in the last case here: `104px` is not one dimension.
//
// ⚠ MUTATION-VERIFIED. Watched failing before it was believed: changing `--read-max` to `620px`
// reddens the token case and the prologue case; dropping the `var()` from `.prologue-card` back to a
// literal reddens the source case. The log is in the wave's scratch as `u09-red.log`.
import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import { setViewport, PHONE, TABLET, DESKTOP } from './fits'
import ChildhoodPrologue from '../../src/components/ChildhoodPrologue.vue'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { careerSnapshot } from '../helpers/career'

const repoFile = (rel: string): string => readFileSync(resolve(process.cwd(), rel), 'utf8')

const backing = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
    setItem: (k: string, v: string) => void backing.set(k, String(v)),
    removeItem: (k: string) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i: number) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  },
})

/** The value a token resolves to, read through the real cascade.
 *
 *  ⚠ OFF `document.documentElement`, WHICH IS THE ELEMENT `:root` MATCHES. happy-dom's CSSOM does
 *  not inherit custom properties down to an arbitrary descendant – a probe `<div>` reads `""` for
 *  every token in the sheet, including `--app-col-max`, which is how this was found. The `var()`
 *  SUBSTITUTIONS below do resolve on descendants (that is the browser-shaped half and it is what the
 *  consumers rely on); only reading the raw property back is root-only here. */
function tokenValue(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

describe('⭐ U-09 – the pack dimensions have one home', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    backing.clear()
    setViewport(PHONE)
  })

  it('the two tokens are declared, and this is the one place that says what they are', () => {
    expect(document.head.querySelector('style'), 'no stylesheet – this is vacuous').toBeTruthy()
    expect(tokenValue('--read-max'), 'the reading measure').toBe('640px')
    expect(tokenValue('--card-min'), "the phone's own card, the floor every desktop grid counts from").toBe('343px')
  })

  it('⚠ the prologue card reads the token past 768, and is unchanged on a phone', () => {
    // ⚠ VIEWPORT BEFORE MOUNT – a media query is evaluated on an element's first computed-style read
    // and then cached (tests/component/fits.ts records the measurement).
    setViewport(TABLET)
    const wide = mount(ChildhoodPrologue, { attachTo: document.body })
    const card = document.querySelector('.prologue-card')
    expect(card, 'the prologue drew no card').toBeTruthy()
    expect(getComputedStyle(card!).maxWidth, 'the reading column moved').toBe('640px')
    wide.unmount()

    document.body.innerHTML = ''
    setViewport(PHONE)
    const phone = mount(ChildhoodPrologue, { attachTo: document.body })
    expect(
      getComputedStyle(document.querySelector('.prologue-card')!).maxWidth,
      'the cap reached a phone, which the rule it lives in must never do',
    ).not.toBe('640px')
    phone.unmount()
  })

  it("⚠ Money's share note reads it too, past 1024", () => {
    setViewport(DESKTOP)
    const store = useGameStore()
    const snapshot = careerSnapshot(6, 'u09-money-share')
    // ⚠ THE FIXTURE RAISES THE NOTE RATHER THAN WALKING TO IT. `kidShareNote` needs her ramp to have
    // started (`kidPrizeShareBps(ageYears)`) AND an account line from the engine – eighteen years of
    // ticking, which tests/component/round26-money-share.test.ts already pays for and holds to every
    // word of its copy. What is measured HERE is the box's max-width, so the two facts are set on the
    // snapshot and nothing about the note's own logic is claimed.
    snapshot.ageYears = 19
    snapshot.life = { ...snapshot.life, ownAccount: 'Her own account holds $1,200.' }
    store.snapshot = snapshot
    const wrapper = mount(MoneyScreen, { attachTo: document.body })
    const share = document.querySelector('.money-share')
    expect(share, 'the share note is not on screen, so this measures nothing').toBeTruthy()
    expect(getComputedStyle(share!).maxWidth).toBe('640px')
    wrapper.unmount()
  })

  it('⚠ and the six declarations read the token rather than the number', () => {
    const sites: [string, string][] = [
      ['src/components/OnboardingWizard.vue', 'max-width: var(--read-max)'],
      ['src/components/PrologueCard.vue', 'max-width: var(--read-max)'],
      ['src/components/screens/MoneyScreen.vue', 'max-width: var(--read-max)'],
      ['src/components/screens/MoneyScreen.vue', 'minmax(var(--card-min), 1fr)'],
      ['src/style.css', 'minmax(var(--card-min), 1fr)'],
    ]
    for (const [rel, needle] of sites) {
      expect(repoFile(rel), `${rel} does not read ${needle}`).toContain(needle)
    }
    // Money carries TWO of the reading-measure rules, so a fix that converted one and left the other
    // would pass the loop above.
    const money = repoFile('src/components/screens/MoneyScreen.vue')
    expect(money.match(/max-width: var\(--read-max\)/g) ?? [], 'Money has two reading columns').toHaveLength(2)
  })

  it('⚠ 104px is NOT one dimension, and is deliberately left alone', () => {
    // The review proposed a third token, `--photo-w: 104px`, over `MoneyScreen`'s share photo and
    // `HomeScreen`'s memory polaroid. Two more objects in the app carry the same number for
    // unrelated reasons – the Kid screen's paper scrap (`.kid-style-note`, whose own comment calls
    // 104 "the export's own measurement" for a scrap of paper) and the match viewer's two name caps
    // – and none of the four says it is the others. A token would assert a relationship the code
    // does not have, and the day the pack moves the photograph it would move a paper scrap too.
    // This case exists so the row is CLOSED with its evidence rather than left looking undone.
    const objects = [
      ['src/components/screens/MoneyScreen.vue', 'money-share-photo'],
      ['src/components/screens/HomeScreen.vue', 'memory-polaroid'],
      ['src/components/screens/KidScreen.vue', 'kid-style-note'],
    ]
    for (const [rel, cls] of objects) {
      const src = repoFile(rel)
      expect(src, `${rel} no longer draws .${cls}`).toContain(`.${cls}`)
      expect(src, `.${cls} stopped being 104px – re-read U-09 before tokenising`).toContain('104px')
    }
  })
})
