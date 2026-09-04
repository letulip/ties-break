import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'

// ⭐⭐⭐ THE RULE THIS FILE EXISTS FOR, and it was learned from a shipped regression rather than
// from a style guide. Round 35 added `.week-stack.swipeable` – a horizontal, snap-scrolling strip
// of cards – and shipped it without the three declarations such a box needs. The owner felt all
// three within a day of the merge (04.09):
//
//   «скролл заедает либо в одну, либо в другую сторону, а некоторые клики по какому-то объекту или
//    пункту меню почему-то сначала не срабатывают, а потом становятся выделением текста»
//
//   · the scroll STICKING is the browser guessing the gesture's axis with no `touch-action`, while
//     `scroll-snap-type: x mandatory` commits it hard to the horizontal one;
//   · the page being DRAGGED at the strip's end is the scroll chaining, with no `overscroll-behavior`;
//   · the click that becomes a SELECTION is a press-and-hold resolving as a text-selection gesture
//     instead of a tap, with no `user-select: none`.
//
// ⚠ THE ASYMMETRY IS THE PROOF THAT THIS IS A RULE AND NOT A PREFERENCE. `SeasonHistoryTable` has
// carried `overscroll-behavior-x: contain` since it shipped. Three other horizontal scrollers did
// not, and the newest of them was the one a player noticed. A convention that lives in one file is
// not a convention.
const ROOT = resolve(__dirname, '..')
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8')

/** Every source file that can declare CSS: the stylesheet and every SFC. Derived, never listed –
 *  a hand-written list is one new component away from proving nothing. */
function sheets(): { rel: string; css: string }[] {
  const out: { rel: string; css: string }[] = [{ rel: 'src/style.css', css: read('src/style.css') }]
  const walk = (dir: string) => {
    for (const e of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`
      if (e.isDirectory()) walk(rel)
      else if (e.name.endsWith('.vue')) out.push({ rel, css: read(rel) })
    }
  }
  walk('src/components')
  return out
}

/** ⚠⚠ COMMENTS ARE STRIPPED FIRST, AND THAT IS NOT TIDINESS – IT IS THE DIFFERENCE BETWEEN A TEST
 *  AND A TAUTOLOGY. The first draft of this file matched raw source, and the rules it guards are
 *  documented in comments that QUOTE the very declarations being looked for. Deleting
 *  `touch-action: pan-x` from `.week-stack.swipeable` left this file GREEN, because the prose above
 *  the declaration still said the words. ⭐ The mutation was run before the verdict was believed,
 *  which is the only reason it was caught: a guard that reads its own documentation guards nothing. */
function withoutComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

/** The rule block a declaration sits in, as source text – enough to ask what else it declares. */
function blocksWith(css: string, needle: RegExp): string[] {
  const out: string[] = []
  for (const m of withoutComments(css).matchAll(/\{[^{}]*\}/g)) if (needle.test(m[0])) out.push(m[0])
  return out
}

describe('a horizontal scroller carries the three declarations a finger needs', () => {
  it('every `overflow-x: auto|scroll` box contains its own scroll chain', () => {
    const offenders: string[] = []
    for (const { rel, css } of sheets()) {
      for (const block of blocksWith(css, /overflow-x:\s*(auto|scroll)/)) {
        if (!/overscroll-behavior(-x)?:\s*contain/.test(block)) offenders.push(rel)
      }
    }
    // ⚠ NAMED, not counted: a count passes by deleting a scroller.
    expect(offenders, 'horizontal scrollers whose end drags the page behind them').toEqual([])
  })

  it('a snap-scrolling strip declares which axis it takes', () => {
    const offenders: string[] = []
    for (const { rel, css } of sheets()) {
      for (const block of blocksWith(css, /scroll-snap-type:\s*x/)) {
        if (!/touch-action:\s*pan-x/.test(block)) offenders.push(rel)
      }
    }
    expect(offenders, 'x-snapping strips that leave the gesture axis to a guess').toEqual([])
  })

  it('...and the strips a finger drags do not start a text selection instead', () => {
    const offenders: string[] = []
    for (const { rel, css } of sheets()) {
      for (const block of blocksWith(css, /scroll-snap-type:\s*x/)) {
        // \b so that `-webkit-user-select: none` alone cannot satisfy the check – a vendor
        // prefix without the standard property is not the declaration this guards.
        if (!/(^|[\s;{])user-select:\s*none/.test(block)) offenders.push(rel)
      }
    }
    expect(offenders, 'draggable strips where a press-and-hold selects text').toEqual([])
  })

  it('⚠ the sweep is real – it finds the scrollers it is meant to check', () => {
    // Vacuous-truth insurance: three empty offender lists prove nothing if the walk found no CSS.
    let scrollers = 0
    let snappers = 0
    for (const { css } of sheets()) {
      scrollers += blocksWith(css, /overflow-x:\s*(auto|scroll)/).length
      snappers += blocksWith(css, /scroll-snap-type:\s*x/).length
    }
    expect(scrollers, 'horizontal scrollers found').toBeGreaterThanOrEqual(4)
    expect(snappers, 'x-snapping strips found').toBeGreaterThanOrEqual(1)
  })
})

describe('press-and-hold on a control is a tap, not a selection', () => {
  it('the app declares the policy once, and narrowly', () => {
    // ⚠ FOUND BY POSITION IN THE STRIPPED SHEET, NOT BY COUNTING LINES BACK FROM A BLOCK. The first
    // draft read "the fourteen lines above" and broke the moment comments were stripped – an offset
    // into text is not a way to name a rule.
    const css = withoutComments(read('src/style.css'))
    const rule = /(?<selectors>(?:[^{}]+))\{(?<body>[^{}]*[\s;{]user-select:\s*none[^{}]*)\}/g
    const hits = [...css.matchAll(rule)].filter((m) => /touch-action:\s*manipulation/.test(m.groups!.body))
    expect(hits.length, 'the shared press-and-hold rule, declared exactly once').toBe(1)
    // ⭐ IT MUST NAME `button`, because that is the control every screen is built from.
    expect(hits[0].groups!.selectors, 'the policy covers plain buttons').toMatch(/(^|\s)button\s*,/)
  })


  it('⚠⚠ ...and PROSE STAYS SELECTABLE – the blanket version of this rule is the wrong one', () => {
    // ⚠ REWRITTEN AFTER `pins:check` REFUSED THE FIRST DRAFT, AND THE RATCHET WAS RIGHT. It read
    // `css.slice(0, css.indexOf(block))` to look at the selectors above a rule – a raw `indexOf`,
    // which returns -1 when its needle rots and silently WIDENS the slice to most of the file
    // instead of failing. ⭐ CLAUDE.md has forbidden that shape since 176 of them were migrated on
    // 24.08, two of which had been lying for months. The rule caught its author.
    //
    // The selectors now come out of the SAME match that finds the block, so there is no offset
    // arithmetic to rot: a `user-select: none` whose selector list is `body`, `html` or `*` would
    // take the whole app with it, and a player who wants to copy a figure out of his own game
    // should be able to.
    const css = withoutComments(read('src/style.css'))
    const rules = /(?<selectors>[^{}]+)\{(?<body>[^{}]*)\}/g
    let checked = 0
    for (const m of css.matchAll(rules)) {
      if (!/(^|[\s;{])user-select:\s*none/.test(m.groups!.body)) continue
      checked += 1
      expect(m.groups!.selectors.trim(), 'a blanket selector claims the whole document')
        .not.toMatch(/(^|,)\s*(body|html|\*)\s*(,|$)/)
    }
    // ⚠ ...and the sweep looked at something: an empty loop asserts nothing.
    expect(checked, 'rules that disable selection').toBeGreaterThan(0)
  })
})
