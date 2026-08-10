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
    // not a weight somebody picked, and the width is load-bearing for the effect. Listed so the rule
    // still holds everywhere else, and so re-checking it later is a one-line diff.
    // ⚠ THE SECOND HALF OF THIS NOTE EXPIRED, 30.07. It also said "TournamentFlow.vue belongs to
    // another slice this round", which was a reason to leave the file alone rather than a reason for
    // the entry. That slice has happened - the screen's back control, its Begin, its four fact tiles
    // and the frame around its match viewer all changed - and the runner-up's gradient border was
    // re-read and kept, on the mechanism above and nothing else.
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

// ---------------------------------------------------------------------------
// THE ACTION ROW (owner, 30.07, second playtest). Two sentences, both about a control saying more
// than it means: «на экране перед матчем надо поменять местами кнопки skip/watch it так логичнее»
// and «У begin просто убрать стрелку». One is an ORDER and one is a GLYPH, and the app already had
// an answer for each - it just was not being kept on the two screens he was looking at.
// ---------------------------------------------------------------------------
describe('THE ACTION ROW: the affirmative is last, and it does not point (owner 30.07)', () => {
  const PRE_MATCH = [
    // [file, the skip, the affirmative] - the two cards that stand between the player and a match
    ['src/components/TournamentFlow.vue', 'Skip', 'Watch match'],
    ['src/components/PracticeFlow.vue', 'Skip to result', 'Watch it'],
  ] as const

  it('both pre-match cards put the thing you usually want under the thumb', () => {
    // The app's own order, everywhere else: `.dialog-actions` is Cancel-then-Confirm, both box scores
    // are "Watch again"-then-primary. These two rows were the outliers, with the primary first.
    for (const [path, skip, watch] of PRE_MATCH) {
      const text = readFileSync(join(root, path), 'utf8')
      const template = /<template>([\s\S]*)<\/template>/.exec(text)?.[1] ?? ''
      const row = template.slice(template.indexOf('class="tf-actions"'))
      const skipAt = row.indexOf(`>${skip}<`)
      const watchAt = row.indexOf(`>${watch}<`)
      expect(skipAt, `${path}: "${skip}" is in the row`).toBeGreaterThan(-1)
      expect(watchAt, `${path}: "${watch}" is in the row`).toBeGreaterThan(-1)
      expect(watchAt, `${path}: the affirmative comes last`).toBeGreaterThan(skipAt)
      // ...and it is still the primary. Swapping the order must not swap which one is the CTA.
      const primaryAt = row.indexOf('class="primary')
      expect(primaryAt, `${path}: the primary is the affirmative`).toBeGreaterThan(skipAt)
      expect(primaryAt, `${path}: the primary is the affirmative`).toBeLessThan(watchAt)
    }
  })

  it('⚠ NO BUTTON LABEL CARRIES AN ARROW – the third sentence of the same playtest, finally guarded', () => {
    // «some with arrows, some don't» is quoted at the top of this file, and this file guarded the radii,
    // the icons and the borders from that same note and NEVER GUARDED THE ARROWS. So the owner had to ask
    // twice: «на турнирах на кнопках про следующий матч остались стрелки - я просил из убрать со всех
    // кнопок». Six labels still had one - "Next", "To result" (twice), "Skip all rounds", "Play it and
    // watch", and the coach-mark tour's "Next". Asking twice for the same thing is what an ungarded rule
    // costs, so the rule goes here rather than in six diffs.
    //
    // ⚠ IT GUARDS BUTTON LABELS, NOT THE CHARACTER. `→` is legitimate PROSE elsewhere and banning the
    // glyph outright would be a worse rule than none: PlanWeekSheet writes "+8 condition → 85/100", where
    // the arrow means "becomes" and is the clearest thing on the row. What was asked for is that a control
    // does not decorate its own label.
    //
    // ⚠ AND IT DOES NOT TOUCH THE CHEVRON. `Hire ›` on the coach rows is a list-item affordance, not an
    // arrow on an action, and quietly folding it in would be me widening his instruction to a glyph he did
    // not name. Left alone, and named here so the question is his to settle rather than mine to assume.
    const ARROWS = ['→', '⟶', '➜', '⇒', '&rarr;', '-&gt;']
    const CONTROLS = ['button', 'PrimaryPill', 'IconButton']
    const offenders: string[] = []
    for (const file of VUE) {
      const src = readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '')
      for (const tag of CONTROLS) {
        // every <tag ...>label</tag>, label being whatever sits between them
        const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'g')
        for (const m of src.matchAll(re)) {
          const label = m[1]
          for (const a of ARROWS) {
            if (label.includes(a)) {
              offenders.push(`${file.split('/src/')[1]}: <${tag}> "${label.trim().slice(0, 46)}"`)
            }
          }
        }
      }
    }
    expect(offenders, `arrows on button labels:\n  ${offenders.join('\n  ')}`).toEqual([])
  })

  it('the tournament brief\'s CTA is one word', () => {
    // «У begin просто убрать стрелку». A lime CTA at the foot of a brief is already the way forward;
    // the arrow was the button repeating itself, and the design's own copy for it is bare.
    const flow = readFileSync(join(root, 'src/components/TournamentFlow.vue'), 'utf8')
    const template = /<template>([\s\S]*)<\/template>/.exec(flow)?.[1] ?? ''
    expect(template).toContain('>Begin</PrimaryPill>')
    expect(template, 'the arrow is back on Begin').not.toMatch(/Begin\s*(→|&rarr;)/)
  })
})

describe('THE ICON IS A COMPONENT (owner 30.07)', () => {
  // `back`, `close` and `dollar` are the OWNER'S OWN drawings (30.07: «svg иконки закинул в
  // public/icons: dollar sign for a tournament enter page, back and close icons»), normalised into the
  // repo's convention. `trophy` and `spectators` are the two tournament-tile glyphs he supplied
  // nothing for, lifted from TournamentFlow's inline SVG.
  const ASSETS = ['back', 'close', 'dollar', 'trophy', 'spectators', 'bin']

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

  // ⚠ THE TEST ABOVE AND THE PLUGIN BELOW GUARD DIFFERENT THINGS, and keeping both is the point.
  // The test protects the REPOSITORY: a file that does not belong is sitting in the working tree,
  // and somebody has been in the folder by hand. `vite.config.ts`'s `no-stowaways` protects the
  // PLAYER: whatever Finder wrote, it cannot reach dist/. Deleting the test because the plugin now
  // catches it would trade a smoke alarm for a fire blanket - the owner's own request was for the
  // build to stop shipping junk, not for the gate to stop noticing it.
  //
  // ⚠ AND THE PLUGIN SWEEPS THE OUTPUT, NOT THE SOURCE, which is the non-obvious half. Cleaning
  // public/ before the copy is a race the build cannot win: Finder writes `.DS_Store` when a folder
  // is VIEWED, so it can appear after `buildStart` and before Vite copies. Only the output placement
  // holds regardless of when the file arrived.
  it('the build strips stowaways from dist, and does it after the copy', () => {
    const config = readFileSync(join(root, 'vite.config.ts'), 'utf8')
    expect(config, 'the plugin must be declared').toContain("name: 'ties-break:no-stowaways'")
    expect(config, 'and wired into the plugin list').toContain('noStowaways(),')
    // closeBundle, not buildStart: see the note above. A move to buildStart re-opens the race.
    const plugin = config.slice(config.indexOf('function noStowaways'))
    expect(plugin.slice(0, plugin.indexOf('\n}')), 'must run after the copy').toContain('closeBundle')
  })

  // The list is from experience rather than from a catalogue of known-bad names: `.textClipping` is
  // here because dragging a Finder search result produces one, and one landed in public/icons/ on
  // 10.08 wearing the name of an icon it did not contain.
  it('the stowaway list catches what has actually turned up, and nothing a player needs', () => {
    const config = readFileSync(join(root, 'vite.config.ts'), 'utf8')
    const src = config.match(/const STOWAWAYS = (\/.*\/)\n/)?.[1]
    expect(src, 'STOWAWAYS must be a literal regex this test can read').toBeTruthy()
    const re = new RegExp(src!.slice(1, -1))
    for (const junk of ['.DS_Store', 'Thumbs.db', 'desktop.ini', '._icon.svg', 'bin.textClipping']) {
      expect(re.test(junk), junk).toBe(true)
    }
    // The other half of the claim, and the one a careless widening would break.
    for (const real of ['bin.svg', 'index.html', 'sw.js', 'pwa-512.png', 'manifest.webmanifest']) {
      expect(re.test(real), real).toBe(false)
    }
  })

  // ⚠ THE BUDGET'S CATEGORY GLYPHS ARE THE SAME MECHANISM WITH A DIFFERENT FAILURE MODE, and it had
  // no gate at all until 31.07. `CAT_ICON_FILE` maps a spending category to a file under
  // public/icons; the file becomes a CSS mask and the category's own `--cat-*` colour is painted
  // through it. A name that does not match a file masks to NOTHING - no error, no glyph, an empty
  // 20px hole beside a row that still has its label and its money. That is precisely the silent
  // failure this suite exists for, so the map is swept.
  it('every category glyph the Family Budget names is a file that is really there', () => {
    const money = readFileSync(join(root, 'src/components/screens/MoneyScreen.vue'), 'utf8')
    const map = /const CAT_ICON_FILE: Record<string, string> = \{([\s\S]*?)\}/.exec(money)?.[1] ?? ''
    const rows = [...map.matchAll(/(\w+):\s*'([^']+)'/g)].map((m) => [m[1], m[2]] as const)
    expect(rows.length, 'CAT_ICON_FILE could not be read').toBeGreaterThanOrEqual(6)
    for (const [key, file] of rows) {
      expect(existsSync(join(root, 'public/icons', `${file}.svg`)), `${key} -> ${file}.svg`).toBe(true)
    }
    // ...and every one of them is a category the screen actually draws a row for, or the picture is
    // filed under a name nothing will ever ask for.
    for (const [key] of rows) {
      expect(money.includes(`key: '${key}'`) || key === 'income', `${key} is not a row on this screen`).toBe(true)
    }
  })

  it('⚠ the fee glyph is filed under `entry`, and NOT under the category its filename names', () => {
    // THE TRAP IS THE FILENAME. `interest-discount-fee-svgrepo-com.svg` is the picture the owner
    // asked for on the fees budget - tournament ENTRY fees - and `interest` is a real and different
    // category in this codebase: R9-1's weekly savings interest, which is INCOME-side and which
    // MoneyScreen's own `EXPENSE_META` note says must never appear as a spending row. Routing the
    // file by its name would have created a spending row for an income category, in a table keyed by
    // category, with nothing to show it had happened.
    const money = readFileSync(join(root, 'src/components/screens/MoneyScreen.vue'), 'utf8')
    const map = /const CAT_ICON_FILE: Record<string, string> = \{([\s\S]*?)\}/.exec(money)?.[1] ?? ''
    expect(map).toContain("entry: 'interest-discount-fee-svgrepo-com'")
    expect(map, 'the filename routed itself into an income category').not.toMatch(/^\s*interest:/m)
    // the income category the name belongs to is still excluded from the spending rows entirely
    expect(money).toContain("Exclude<WorldEventCategory, 'income' | 'sponsor' | 'interest' | 'academy'>")
  })

  it('a glyph the owner replaced leaves no inline path behind it', () => {
    // `ICON_PATHS` is keyed by category, so a path nothing renders does not read as dead code - it
    // reads as a live alternative. One drawing per row, from one place.
    const money = readFileSync(join(root, 'src/components/screens/MoneyScreen.vue'), 'utf8')
    const paths = /const ICON_PATHS: Record<string, string\[\]> = \{([\s\S]*?)\n\}/.exec(money)?.[1] ?? ''
    const files = /const CAT_ICON_FILE: Record<string, string> = \{([\s\S]*?)\}/.exec(money)?.[1] ?? ''
    for (const [, key] of files.matchAll(/(\w+):\s*'[^']+'/g)) {
      expect(paths, `${key} has both a file and an inline path`).not.toMatch(new RegExp(`^\\s*${key}:`, 'm'))
    }
    // ...and `other` survives, because it is the fallback every unmapped row lands on
    expect(paths).toMatch(/^\s*other:/m)
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
    // ⚠ THE LIST IS EMPTY, AND THAT IS THE POINT OF HAVING HAD ONE (owner, 30.07: «на экране перед
    // турниром кнопки Back и Begin остались прежними и со стрелками. Для back я просил везде сделать
    // один компонент и его консистентно использовать, просто иконка с белым fill»). It held
    // TournamentFlow's "← Back" on the argument that a labelled button in a flow's hero is a different
    // object from a screen header's bare arrow. He disagreed, so the hero now carries the same
    // `IconButton variant="bare" icon="back"` the other three do and the allowlist closed to nothing.
    // The array stays declared, empty, because that is the shape a future exception has to argue for.
    const KNOWN: string[] = []
    expect(offenders.filter((o) => !KNOWN.includes(o)).join('\n')).toBe('')
  })

  // ⚠ ADDED 30.07, and it is the other half of the sentence above: «просто иконка с белым fill». The
  // ban above is on the CHARACTER; this is on the second SHAPE. A back control that is a word, or a
  // glass pill, or a plate, is the drift he was pointing at - four screens had one control between
  // them and the fourth looked nothing like the other three.
  it('every back control in the app is the one component, and it is a bare icon', () => {
    const offenders: string[] = []
    for (const path of VUE) {
      if (path.endsWith('IconButton.vue')) continue
      const text = readFileSync(path, 'utf8')
      const template = /<template>([\s\S]*)<\/template>/.exec(text)?.[1] ?? ''
      // Anything whose job is "go back" - by handler or by accessible name - has to be the component.
      for (const m of template.matchAll(/<(button|IconButton)\b[^>]*>/g)) {
        const tag = m[0]
        const goesBack = /@click="[^"]*\bback\b/.test(tag) || /label="Back/.test(tag) || /aria-label="Back/.test(tag)
        if (!goesBack) continue
        if (m[1] !== 'IconButton') offenders.push(`${rel(path)}: hand-written back control`)
        else if (!/variant="bare"/.test(tag) || !/icon="back"/.test(tag))
          offenders.push(`${rel(path)}: back control is not the bare back icon`)
      }
    }
    // ⚠ ONE NAME, AND IT IS NOT A BACK CONTROL IN THIS SENSE. OnboardingWizard's `.ob-back` is the
    // LEFT HALF OF A WIZARD FOOTER PAIR - `Back` beside `Next` - which the design draws as two pills
    // with words on them (docs/design/README.md §N–S: «футер `Back` / `Next`», and `Back` is specified
    // as a pill with 14px/700 type). It is a step control in a form, not the top-left "leave this
    // screen" affordance the owner's sentence is about, its exact markup is pinned by
    // tests/redesign-onboarding.test.ts, and turning it into a bare glyph would leave `Next` alone in
    // the footer with an unlabelled twin. Listed rather than silently skipped.
    const KNOWN = ['src/components/OnboardingWizard.vue: hand-written back control']
    expect(offenders.filter((o) => !KNOWN.includes(o)).join('\n')).toBe('')
    // anti-vacuity: the sweep really did find the four real ones
    expect(
      VUE.filter((p) => /<IconButton[^>]*icon="back"/.test(readFileSync(p, 'utf8'))).length,
    ).toBeGreaterThanOrEqual(4)
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
    // ⚠ EMPTY, 30.07: TournamentFlow's fact tile adopted `SurfaceMark`, and this test now holds the
    // whole app. It listed two offenders and only ONE of them was ever real - the hand-written ring in
    // screen E's "Surface" tile, which is gone. The `SURFACE_EMOJI` entry was already stale when it was
    // written: that table had left TournamentFlow before this file existed (the only mention there now
    // is a ⚠ note in PracticeFlow explaining the deletion, which is why the check is on a DECLARATION
    // rather than on the words). The array stays declared, empty, as the shape an exception must take.
    const KNOWN: string[] = []
    expect(offenders.filter((o) => !KNOWN.includes(o)).join('\n')).toBe('')
    expect(sheet).toContain('.surface-mark--sm')
    // anti-vacuity: the sweep is looking at files that really do draw marks, through the component
    expect(VUE.filter((p) => /<SurfaceMark\b/.test(readFileSync(p, 'utf8'))).length).toBeGreaterThanOrEqual(3)
  })

  // ⚠ ADDED 30.07 (owner: «иконка prize money не обновилась, проверить»). He was right and the reason
  // is worth a pin of its own: the ASSET had shipped - `public/icons/dollar.svg`, his own drawing, with
  // a note asking for this exact adoption - and the screen still drew its own dollar as an inline
  // <svg>, so nothing changed for him. An icon that exists twice is an icon that did not land. The
  // three tiles that have an asset must reach for it, and the paths they replaced must be DELETED
  // rather than left in the file to be re-adopted by the next hand.
  it('screen E\'s fact tiles draw their glyphs from the assets, not from inline paths', () => {
    const flow = readFileSync(join(root, 'src/components/TournamentFlow.vue'), 'utf8')
    const template = /<template>([\s\S]*)<\/template>/.exec(flow)?.[1] ?? ''
    const facts = template.slice(template.indexOf('class="tf-facts"'), template.indexOf('class="tf-first"'))
    expect(facts, 'the facts row was not found').toContain('tf-fact-tile')
    for (const name of ['dollar', 'trophy', 'spectators']) {
      expect(facts, `${name} tile`).toContain(`<AppIcon name="${name}"`)
    }
    // the surface tile is the fourth, and it is the component rather than a fourth copy of the ring
    expect(facts).toContain('<SurfaceMark :surface="pending.surface" :show-name="false" />')
    // and not one `d=` is left behind in the row
    expect(facts, 'a replaced path is still in the markup').not.toMatch(/<svg|<path|<circle/)
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
