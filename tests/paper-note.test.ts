// =================================================================================================
// THE PAPER NOTE – the tape, and the wrapper the tape cost
// =================================================================================================
//
// The owner, 30.07, looking at the "Next goal" scrap on the week's story: «на этой бумажке есть
// нижняя часть "скотча", а верхней нет, можем сделать по типу как на family budget сделано, что она
// прям приклеена была зрительно?»
//
// He was reporting a real bug and had already named its fix. `clip-path` clips EVERY DESCENDANT of
// the box it is set on, so on a `torn` note the polygon cut away the half of the tape that hangs
// ABOVE the sheet - which is the half that makes tape read as tape. MoneyScreen's trip photo is a
// `Polaroid` with `tape` and no clip-path at all, and that one looks stuck down, which is exactly
// the comparison he drew.
//
// ⚠ PAPERNOTE'S OWN COMMENT ALREADY DESCRIBED THIS FAILURE FOR THE BOX-SHADOW ("clip-path clips a
// box-shadow away with everything else outside the polygon") and fixed it with `drop-shadow`. The
// tape had the identical problem one element over and was missed while that fix was being written.
// So this file pins the STRUCTURE rather than the appearance: no value of `top` can escape a clip,
// and the only durable fix is that the tape is not inside the clipped box at all.
//
// THE SECOND HALF IS THE PRICE OF THE FIRST. Moving the tape out means the component's ROOT is now a
// wrapper, and a caller's class lands on the wrapper rather than on the sheet. Five call sites style
// this component, and a rule that assumes the root IS the paper does not fail loudly - it paints the
// padding outside the background, or silently loses a font-size to `.tb-paper`'s own. So the
// per-caller split is pinned mechanically, for every caller, present and future.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const SRC = fileURLToPath(new URL('../src/', import.meta.url))
const read = (p: string) => readFileSync(p, 'utf8')
const rel = (p: string) => p.slice(SRC.length)

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir).sort()) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (entry.endsWith('.vue')) out.push(p)
  }
  return out
}
const VUE = walk(SRC)

/** Comments are not code – the same `codeOf` discipline tests/calendar-screen.test.ts keeps. This
 *  file is about which element an attribute is ON, and the component documents its own history at
 *  length, including quoting the markup it used to have. */
const codeOf = (src: string) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const PAPER = join(SRC, 'components/ui/PaperNote.vue')
const paper = read(PAPER)
const paperTemplate = codeOf(paper.slice(paper.indexOf('<template>'), paper.lastIndexOf('</template>')))
const paperCss = codeOf(paper.slice(paper.indexOf('<style'), paper.lastIndexOf('</style>')))

// =================================================================================================
// THE TAPE IS OUTSIDE THE CLIP
// =================================================================================================
describe('a torn, taped note keeps its whole strip of tape', () => {
  it('the tape is a SIBLING of the sheet, not a child of it', () => {
    const wrap = paperTemplate.indexOf('class="tb-paper-wrap"')
    const sheet = paperTemplate.indexOf('class="tb-paper"')
    const slot = paperTemplate.indexOf('<slot />')
    const tape = paperTemplate.indexOf('tb-paper-tape')
    expect(wrap, 'the wrapper is gone – the tape has nothing to hang off').toBeGreaterThan(-1)
    expect(sheet, 'the sheet is gone').toBeGreaterThan(wrap)
    // the slotted content is INSIDE the sheet: it is written on the paper, and it inherits the
    // paper's ink and hand from it (screen D's "Next goal" label reads `--paper-ink-soft` from a
    // component away only because the slot sits in this box).
    expect(slot, 'the slot left the sheet').toBeGreaterThan(sheet)
    // ...and the tape comes after the element that closes the sheet, which is the whole fix.
    const sheetClose = paperTemplate.indexOf('</div>', slot)
    expect(sheetClose).toBeGreaterThan(slot)
    expect(tape, 'the tape is back inside the clipped box').toBeGreaterThan(sheetClose)
  })

  it('nothing but the two torn cuts is ever clipped', () => {
    // A `clip-path` anywhere else in this component is the bug coming back by another door – on the
    // wrapper it would clip the tape again, on the tape it would clip the tape itself.
    const clipped = [...paperCss.matchAll(/([^{}]+)\{([^}]*)\}/g)].filter((m) => m[2].includes('clip-path'))
    expect(clipped.length, 'the torn cuts have gone missing').toBe(2)
    for (const [, selector] of clipped) {
      expect(selector.trim(), `clip-path on ${selector.trim()}`).toMatch(/^\.tb-paper--torn(-right)?$/)
    }
  })

  it('the TILT is on the wrapper, so the tape turns with the paper it holds down', () => {
    // A strip of tape that stays level while the sheet under it rotates is worse than no tape.
    const wrapTag = paperTemplate.slice(paperTemplate.indexOf('<div'), paperTemplate.indexOf('>', paperTemplate.indexOf('class="tb-paper-wrap"')))
    expect(wrapTag).toContain('tb-paper-wrap')
    expect(wrapTag).toContain('rotate(')
    // and the sheet no longer carries one, or the note would rotate twice
    const sheetTag = paperTemplate.slice(paperTemplate.indexOf('class="tb-paper"'))
    expect(sheetTag.slice(0, sheetTag.indexOf('>'))).not.toContain('rotate(')
  })

  it('the wrapper paints NOTHING – it is a box for the tape to hang off and no more', () => {
    // If the wrapper ever grows a background or a padding, it stops being a fix and becomes a second
    // sheet of paper: the caller's inset would apply to it and the real paper would shrink inside it.
    const rule = paperCss.match(/\.tb-paper-wrap\s*\{([^}]*)\}/)
    expect(rule, '.tb-paper-wrap has no rule at all').not.toBeNull()
    const decls = rule![1]
    expect(decls).toContain('position: relative')
    for (const property of ['background', 'padding', 'box-shadow', 'border', 'font-']) {
      expect(decls, `the wrapper grew a ${property}`).not.toContain(property)
    }
  })

  it('...and the torn sheet still keeps the shadow it got back, by filter', () => {
    // The fix next door, unchanged: `clip-path` erases a box-shadow, so a cut sheet draws its shadow
    // off the SILHOUETTE instead. The tape keeps the cheap box-shadow – it is a rectangle.
    expect(paperCss).toContain('filter: drop-shadow(var(--shadow-paper))')
    expect(paperCss).toMatch(/\.tb-paper-tape\s*\{[^}]*box-shadow: var\(--shadow-tape\)/)
  })
})

// =================================================================================================
// EVERY CALL SITE – the wrapper is the fallthrough root now, and five files style this component
// =================================================================================================
describe('a caller styles the wrapper, and reaches the paper through :deep', () => {
  /** Static classes put on a `<PaperNote>` tag, per file. Dynamic `:class` variants are not read:
   *  every one of them modifies slotted content rather than the sheet's own box. */
  function callers(text: string): string[] {
    const out: string[] = []
    for (const tag of text.matchAll(/<PaperNote\b[\s\S]*?>/g)) {
      const cls = tag[0].match(/\sclass="([^"]*)"/)
      if (cls) out.push(...cls[1].split(/\s+/).filter(Boolean))
    }
    return out
  }

  /** Declarations of the rule whose selector is EXACTLY `.cls` – the rule that lands on the wrapper.
   *  A descendant rule (`.cls .thing`) is somebody else's business and is left alone. */
  function ownRule(css: string, cls: string): string | null {
    for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      if (m[1].split(',').some((s) => s.trim() === `.${cls}`)) return m[2]
    }
    return null
  }

  /** The properties `.tb-paper` sets on ITSELF. Any of these on the wrapper is either thrown away
   *  (the sheet re-declares it) or applied to the wrong box (an inset outside the background). */
  const SHEET_ONLY = [
    'padding',
    'background',
    'font-family',
    'font-size',
    'line-height',
    'color:',
    'display: flex',
    'display: grid',
  ]

  const SITES = VUE.filter((p) => p !== PAPER && callers(read(p)).length > 0)

  it('the four call sites are still four – a fifth has to read this file', () => {
    // Vacuous-truth insurance, and a doorbell: PaperNote is shared and the wrapper changed what a
    // class on it means, so a new caller should arrive having read why. (The calendar's fridge note
    // is the fifth and lands later in this same wave – it will edit this list, having read it.)
    expect(SITES.map(rel)).toEqual([
      'components/SeasonSummaryDialog.vue',
      'components/WeekRecapCard.vue',
      'components/screens/KidScreen.vue',
      'components/screens/MoneyScreen.vue',
    ])
  })

  it('no caller sets a paper property on the wrapper', () => {
    const wrong: string[] = []
    for (const path of SITES) {
      const text = read(path)
      const css = codeOf(text.slice(text.indexOf('<style'), text.lastIndexOf('</style>')))
      for (const cls of callers(text)) {
        const decls = ownRule(css, cls)
        if (!decls) continue
        for (const property of SHEET_ONLY) {
          if (decls.includes(property)) {
            wrong.push(`${rel(path)}  .${cls} { ${property} }  – belongs on ${cls} :deep(.tb-paper)`)
          }
        }
      }
    }
    expect(wrong.join('\n')).toBe('')
  })

  it('...and the ones that needed the paper really did reach it', () => {
    // The mirror of the test above: the four call sites that HAD a padding or a type of their own
    // still have it, one element in. Without this, "no caller sets padding on the wrapper" could be
    // satisfied by deleting the padding and quietly changing four screens.
    for (const [file, cls] of [
      ['components/WeekRecapCard.vue', 'recap-note'],
      ['components/WeekRecapCard.vue', 'recap-goal'],
      ['components/screens/MoneyScreen.vue', 'money-receipt'],
      ['components/screens/KidScreen.vue', 'kid-style-note'],
      ['components/SeasonSummaryDialog.vue', 'season-note'],
    ]) {
      const css = read(join(SRC, file))
      expect(css, `${file}: .${cls} lost its paper rule`).toContain(`.${cls} :deep(.tb-paper) {`)
    }
  })
})
