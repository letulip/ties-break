import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, extname } from 'node:path'

// ---------------------------------------------------------------------------
// THE CONTROL SYSTEM (owner, 30.07). Three sentences from one playtest, and they are one problem:
//
//   «Buttons consistency fix, now lots of buttons different, some square, some round, some with
//    arrows, some don't»
//   «Surface type similar icon across every screen – it means this icon is not a component»
//   «Maybe we should stick to thin borders instead and use them everywhere?»
//
// Every one of those is a fact about SOURCE - a radius, a repeated glyph, a border width - and every
// one of them got into the app because six screens were built in parallel with nothing to check
// them against. Tests are what a parallel wave has instead of one pair of eyes, which is why these
// are file-reading tests in the same discipline as tests/round10.test.ts.
//
// WHAT THIS FILE DOES NOT DO: it does not ban a screen from having its own control. It bans the two
// things that actually caused the drift - a SECOND value for a decided question, and a SECOND copy
// of markup that already has a component.
// ---------------------------------------------------------------------------

const root = fileURLToPath(new URL('../', import.meta.url))
const SHEET = join(root, 'src/style.css')
const sheet = readFileSync(SHEET, 'utf8')

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (['.vue', '.css'].includes(extname(entry))) out.push(full)
  }
  return out
}
const SOURCES = walk(join(root, 'src'))
const VUE = SOURCES.filter((f) => f.endsWith('.vue'))

/** Strip `/* *​/` comments, so a border width QUOTED in a note is not read as a declaration. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}
/** Every `<style>` block of an SFC, or the whole file for a `.css`. */
function cssOf(path: string, text: string): string {
  if (path.endsWith('.css')) return text
  return [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
}
function rel(path: string): string {
  return path.slice(root.length)
}

describe('THE STROKE WEIGHT: one hairline, everywhere (owner 30.07)', () => {
  it('--stroke-hair is declared, and it is 1px', () => {
    expect(sheet).toMatch(/--stroke-hair:\s*1px/)
  })

  // ⚠ AN OUTLINE IS NOT A RAIL, and the distinction is the whole reason this test is two tests.
  // "Thin borders everywhere" is about what goes AROUND an object - the thing the owner was looking
  // at on the onboarding inputs. That is the `border` shorthand, `border-width`, and `outline`.
  // 2px is where "thin" stops being true, so 2 and up is banned. A 1.5px ICON stroke
  // (`.surface-ring`, the design's 24x24 / 1.5-1.9 grid) is artwork rather than an edge and is not
  // what he was looking at; single-side rails are the next test.
  it('nothing in the app is OUTLINED with more than a hairline', () => {
    const offenders: string[] = []
    for (const path of SOURCES) {
      const css = stripComments(cssOf(path, readFileSync(path, 'utf8')))
      for (const m of css.matchAll(/(?:^|[;{\s])(border|outline)(-width)?\s*:\s*([^;}]+)/g)) {
        const px = [...m[3].matchAll(/(\d+(?:\.\d+)?)px/g)].map((p) => Number(p[1]))
        if (px.some((v) => v >= 2)) offenders.push(`${rel(path)}: ${m[1]}${m[2] ?? ''}: ${m[3].trim()}`)
      }
    }
    // ⚠ ONE ENTRY, AND IT IS NOT A TASTE EXCEPTION. `.tf-poster.silver` draws a GRADIENT border, which
    // CSS has no border-color for: it is a transparent border plus a `padding-box`/`border-box`
    // background pair showing through it. The 2px is the MECHANISM - at 1px the metal is invisible -
    // not a weight somebody picked, and the width is load-bearing for the effect. TournamentFlow.vue
    // also belongs to another slice this round. Listed so the rule still holds everywhere else, and
    // so re-checking it later is a one-line diff.
    const KNOWN = ['src/components/TournamentFlow.vue: border: 2px solid transparent']
    expect(offenders.filter((o) => !KNOWN.includes(o)).join('\n')).toBe('')
  })

  // THE RAIL is the app's other edge device and it is deliberately NOT a hairline: a coloured bar
  // down one side of a row, marking it rather than enclosing it. It is left alone by the rule above
  // on purpose - but it is pinned here, because an idiom nobody has written down is exactly how the
  // app ended up with two answers for a button radius.
  //   * always the LEFT edge - a rail is where the eye starts a row, and four rails would be four
  //     idioms;
  //   * exactly two weights, and the second one MEANS something: R10-15 thickened a result row from
  //     3px to 4px so a win and a loss are separable without relying on hue alone. That is an
  //     accessibility decision and it is why "one weight everywhere" does not reach here.
  it('the accent rail is one idiom: left edge, 3px, or 4px when it carries a result', () => {
    const seen: string[] = []
    for (const path of SOURCES) {
      const css = stripComments(cssOf(path, readFileSync(path, 'utf8')))
      for (const m of css.matchAll(/border-(top|right|bottom|left)\s*:\s*([^;}]+)/g)) {
        const px = Number(/(\d+(?:\.\d+)?)px/.exec(m[2])?.[1] ?? 0)
        if (px < 2) continue // a hairline on one side is a divider, not a rail
        seen.push(`${rel(path)}: border-${m[1]} ${px}px`)
        expect(m[1], `${rel(path)}: a rail is always the left edge`).toBe('left')
        expect([3, 4], `${rel(path)}: rail weight`).toContain(px)
      }
    }
    // anti-vacuity: the rails are really there, and there are not suddenly a dozen of them
    expect(seen.length).toBeGreaterThan(2)
    expect(seen.length).toBeLessThan(8)
  })

  it('the app declares exactly ONE focus ring, and src/style.css owns it', () => {
    // Three files used to bring their own, all 2px. A screen may still say "this element is
    // focusable" (`outline-style`, `outline-color`) - what it may not do is re-declare the WIDTH.
    const offenders: string[] = []
    for (const path of SOURCES) {
      if (path === SHEET) continue
      const css = stripComments(cssOf(path, readFileSync(path, 'utf8')))
      for (const m of css.matchAll(/outline(-width)?\s*:\s*([^;}]+)/g)) {
        if (/\d+(\.\d+)?px/.test(m[2])) offenders.push(`${rel(path)}: ${m[0].trim()}`)
      }
    }
    expect(offenders.join('\n')).toBe('')
    expect(sheet).toMatch(/:focus-visible\s*\{[^}]*outline:\s*var\(--stroke-hair\)\s+solid\s+var\(--accent\)/)
  })

  // The onboarding half of his "border overlap": an `outline` is painted OUTSIDE the border box, so
  // a scrollport whose content box hugs its children slices every focus ring in it. `.ob-pane` was
  // that scrollport, and the ring came off 4px at each gutter.
  it('the onboarding scrollport has room for a focus ring', () => {
    const wizard = readFileSync(join(root, 'src/components/OnboardingWizard.vue'), 'utf8')
    const pane = /\.ob-pane\s*\{([^}]*)\}/.exec(stripComments(cssOf('x.vue', wizard)))?.[1] ?? ''
    expect(pane).toContain('overflow-y: auto')
    // 3px of inset (a 1px ring at a 2px offset), cancelled by 3px of negative margin so the
    // children - and therefore the design's 22px gutter - do not move.
    expect(pane).toMatch(/padding:\s*3px/)
    expect(pane).toMatch(/margin:\s*-3px -3px 0/)
  })
})

describe('THE BUTTON SHAPE: a button is a pill (owner 30.07)', () => {
  it('the element reset rounds every button to the capsule', () => {
    const reset = /(?:^|\n)button\s*\{([^}]*)\}/.exec(stripComments(sheet))?.[1] ?? ''
    expect(reset).toContain('border-radius: var(--radius-pill)')
    expect(reset).toContain('border: var(--stroke-hair) solid var(--line)')
  })

  // What the owner saw: the same affirmative verb was an 8px box in twelve dialogs and a 999px
  // capsule in the four places that reached for the export's CTA. `.primary` may not re-square
  // itself, and neither may the CTA variant it shares a component with.
  it('the affirmative button never re-squares itself', () => {
    const primary = /button\.primary\s*\{([^}]*)\}/.exec(stripComments(sheet))?.[1] ?? ''
    expect(primary).not.toContain('border-radius')
    const pill = readFileSync(join(root, 'src/components/ui/PrimaryPill.vue'), 'utf8')
    for (const m of stripComments(cssOf('x.vue', pill)).matchAll(/border-radius:\s*([^;}]+)/g)) {
      expect(m[1].trim(), 'PrimaryPill radius').toBe('var(--radius-pill)')
    }
  })

  // round10.test.ts owns the "999px is never a literal" half of this. Restated here because the two
  // rules only work together: the ladder is meaningless if a screen can type the number.
  it('--radius-control has no button tenant left', () => {
    const css = stripComments(sheet)
    for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      if (!m[2].includes('--radius-control')) continue
      expect(m[1].trim(), 'rule using --radius-control').not.toMatch(/\bbutton\b|\.primary\b/)
    }
  })
})

describe('THE ICON IS A COMPONENT (owner 30.07)', () => {
  // `back`, `close` and `dollar` are the OWNER'S OWN drawings (30.07: «svg иконки закинул в
  // public/icons: dollar sign for a tournament enter page, back and close icons»), normalised into the
  // repo's convention. `trophy` and `spectators` are the two tournament-tile glyphs he supplied
  // nothing for, lifted from TournamentFlow's inline SVG.
  const ASSETS = ['back', 'close', 'dollar', 'trophy', 'spectators']

  it('the artwork he asked for exists as real SVG under public/', () => {
    for (const name of ASSETS) {
      const path = join(root, 'public/icons', `${name}.svg`)
      expect(existsSync(path), `public/icons/${name}.svg`).toBe(true)
      const svg = readFileSync(path, 'utf8')
      // ONE GRID. The shipped tab icons are an 800 grid and the play-style poses are 100; 100 is the
      // convention here, because it is the one a human can read a coordinate off and because a
      // rescale is then one transform rather than a rewritten path.
      expect(svg, name).toContain('viewBox="0 0 100 100"')
      // ONE COLOUR CONTRACT: taken from the caller, so a single file is lime on one surface and muted
      // on the next. Under a CSS mask there is no CSS context and it resolves to opaque black, which
      // is exactly what a mask wants - so the same file serves both idioms.
      expect(svg, name).toContain('currentColor')
    }
  })

  // ⚠ The three the owner drew arrived as raw svgrepo downloads: an XML prolog, a DOCTYPE, a
  // generator comment, `id="Layer_1"`, and `fill="#000000"` - which on this app's navy is an
  // invisible icon. Normalising them is not a one-off chore, it is the gate every future asset has to
  // pass, so it is a test rather than a note in a commit message.
  it('no shipped icon carries a hard-coded black or a download wrapper', () => {
    const offenders: string[] = []
    for (const name of ASSETS) {
      const svg = readFileSync(join(root, 'public/icons', `${name}.svg`), 'utf8')
      // strip comments first: these files EXPLAIN what was removed, and the words are not the thing
      const code = svg.replace(/<!--[\s\S]*?-->/g, '')
      if (/fill="#0{3,6}"/i.test(code)) offenders.push(`${name}.svg: hard-coded black fill`)
      if (code.includes('<?xml')) offenders.push(`${name}.svg: XML prolog`)
      if (code.includes('<!DOCTYPE')) offenders.push(`${name}.svg: DOCTYPE`)
      if (/svgrepo/i.test(code)) offenders.push(`${name}.svg: generator comment`)
      if (code.includes('id="Layer_1"')) offenders.push(`${name}.svg: editor layer id`)
    }
    expect(offenders.join('\n')).toBe('')
  })

  // Vite copies everything under public/ into dist VERBATIM (the trap scripts/optimize-art.mjs
  // documents), so a stray Finder file ships to users.
  it('no .DS_Store is sitting in public/', () => {
    const strays: string[] = []
    const sweep = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry)
        if (statSync(full).isDirectory()) sweep(full)
        else if (entry === '.DS_Store') strays.push(rel(full))
      }
    }
    sweep(join(root, 'public'))
    expect(strays.join('\n')).toBe('')
  })

  it('AppIcon is the one door to those files, and it takes no colour', () => {
    const icon = readFileSync(join(root, 'src/components/ui/AppIcon.vue'), 'utf8')
    // BASE_URL, not a leading slash: the PWA ships under a sub-path.
    expect(icon).toContain('${import.meta.env.BASE_URL}icons/${name}.svg')
    expect(icon).toContain('background-color: currentColor')
    expect(icon).not.toMatch(/props?\.(colour|color)|color\?:/)
  })

  // The three characters that used to stand in for artwork. `←` was typed in three screen headers
  // and `✕` in five overlays; both are now assets. The ban is on the CHARACTER inside a control -
  // an arrow between two chips is punctuation and stays.
  it('no back arrow or close cross is typed as a character in a control', () => {
    const offenders: string[] = []
    for (const path of VUE) {
      const text = readFileSync(path, 'utf8')
      const template = /<template>([\s\S]*)<\/template>/.exec(text)?.[1] ?? ''
      for (const m of template.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g)) {
        if (/&larr;|←/.test(m[1])) offenders.push(`${rel(path)}: back arrow as a character`)
        if (/✕|✖|&times;/.test(m[1])) offenders.push(`${rel(path)}: close cross as a character`)
      }
    }
    // ⚠ TournamentFlow's "← Back" is a LABELLED button in a flow's action row, not a screen
    // header's bare arrow, and MatchViewer's close belongs to another slice this round. Both are
    // listed rather than silently allowed, so adopting them closes this list to empty.
    const KNOWN = ['src/components/TournamentFlow.vue: back arrow as a character']
    expect(offenders.filter((o) => !KNOWN.includes(o)).join('\n')).toBe('')
  })

  it('the 32px round icon button is a component, and it is a CIRCLE', () => {
    const btn = readFileSync(join(root, 'src/components/ui/IconButton.vue'), 'utf8')
    const plate = /\.tb-iconbtn--plate\s*\{([^}]*)\}/.exec(btn)?.[1] ?? ''
    expect(plate).toContain('width: 32px')
    // A circle is 50%, never --radius-pill: on anything that is not square 999px is a capsule.
    expect(plate).toContain('border-radius: 50%')
    // ...and nowhere in its STYLES does it reach for the capsule (the prose above the props explains
    // the distinction, so the check is against the CSS, not the whole file).
    expect(stripComments(cssOf('x.vue', btn))).not.toContain('--radius-pill')
    // and the sheet no longer draws it, only places it
    const close = /\.replay-close\s*\{([^}]*)\}/.exec(stripComments(sheet))?.[1] ?? ''
    expect(close).toContain('position: absolute')
    expect(close).not.toContain('border-radius')
  })

  it('the surface mark has one home, and the emoji table is gone from the screens', () => {
    const offenders: string[] = []
    for (const path of VUE) {
      if (path.endsWith('SurfaceMark.vue')) continue
      const text = readFileSync(path, 'utf8')
      // A DECLARATION, not a mention: the files that removed their copy quote the deleted line in
      // the ⚠ note that says why it went, and a note is the opposite of a violation.
      if (/^\s*const SURFACE_EMOJI/m.test(text)) offenders.push(`${rel(path)}: its own SURFACE_EMOJI table`)
      const template = /<template>([\s\S]*)<\/template>/.exec(text)?.[1] ?? ''
      if (template.includes('class="surface-ring"')) offenders.push(`${rel(path)}: hand-written ring`)
    }
    // ⚠ TournamentFlow.vue belongs to another slice this round, so its ring and its copy of the emoji
    // table are the last two and are LISTED rather than silently allowed - adopting SurfaceMark there
    // empties this array and the test then holds the whole app. SurfaceMark deliberately leaves the
    // `.surface-*` rules in src/style.css until that happens, so this file's markup keeps rendering.
    const KNOWN = [
      'src/components/TournamentFlow.vue: its own SURFACE_EMOJI table',
      'src/components/TournamentFlow.vue: hand-written ring',
    ]
    expect(offenders.filter((o) => !KNOWN.includes(o)).join('\n')).toBe('')
    expect(sheet).toContain('.surface-mark--sm')
  })
})

describe('THE TOP POPUP CANNOT BE PAINTED OVER (owner 30.07)', () => {
  // «Injury top popup with dismiss button breaks layout». Home's hero bleeds up with
  // `margin-top: -24px` measured from the top of <main>, and <main> starts AFTER this strip - so at
  // 16px of bottom margin the photograph began 8px above the strip's bottom edge and, both being
  // static, painted over its whole bottom border. Two facts, because either alone is fragile.
  it('the strip clears Home\'s bleed and owns a layer', () => {
    const css = stripComments(sheet)
    const strip = /\.recovered-banner,\s*\n\.stop-toast\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''
    expect(strip).toContain('position: relative')
    expect(strip).toMatch(/z-index:\s*2/)
    // The margin must be the SAME TOKEN the hero's bleed cancels, not a literal that happens to
    // equal it today - that equality is the whole fix, and a literal would let the two drift apart.
    expect(strip).toMatch(/margin:\s*0 auto var\(--app-pad-top\)/)
    const home = readFileSync(join(root, 'src/components/screens/HomeScreen.vue'), 'utf8')
    const hero = /\.diary-hero\s*\{([^}]*)\}/.exec(stripComments(cssOf('x.vue', home)))?.[1] ?? ''
    expect(hero).toContain('calc(-1 * var(--app-pad-top))')
    // still behind anything genuinely modal
    expect(css).toMatch(/\.dialog-overlay\s*\{[^}]*z-index:\s*60/)
  })
})
