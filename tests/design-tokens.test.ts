// ui/v1 – THE TOKEN GATE.
//
// WHY THIS FILE EXISTS. `docs/design/tokens.css` looks like a stylesheet and is not one: nothing in
// the app imports it, no build step reads it, and `index.html` does not link it. It is a REFERENCE
// – the owner's design export, transcribed. So a token declared there and not hand-copied into
// `src/style.css` simply DOES NOT EXIST when the app runs, and `var(--that-token)` resolves to
// nothing at all.
//
// That failure is silent in the worst possible way. CSS has no error for an unresolved custom
// property: the declaration is thrown away as invalid-at-computed-value-time and the property falls
// back to its inherited or initial value. A missing colour is not a red screen, it is `currentColor`
// or transparent. A missing gradient is no background. The screen still renders, the suite still
// passes, and nobody finds out until somebody looks at the right pixel in the right state.
//
// Two waves of this project hit it independently and each worked around it in place – onboarding R
// declared the four play-style colours on `.ob`, PaperNote declared `--paper-ink-soft` on
// `.tb-paper`, TournamentFlow gave up on the tokens and wrote the gradients out at the point of use.
// Three components hand-syncing one design file is two sources of truth and a manual sync with no
// gate on it. This is the gate. Owner, 29.07, of the four colours: «а если так, то зачем они нам
// вообще?» – the answer had to be a mechanism, not four more copied hex values.
//
// WHAT IT PINS, in two rules:
//   A. RESOLVABILITY. Every `var(--x)` the app references must actually resolve – declared in
//      `src/style.css`, or set by its own file, or carrying a fallback. This is the 404.
//   B. ONE VOCABULARY. A token the design system NAMES is declared in `src/style.css` and nowhere
//      else. A component may invent its own private property; it may not keep a private copy of a
//      shared one. This is the drift.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const SRC = fileURLToPath(new URL('../src/', import.meta.url))
const SHEET = join(SRC, 'style.css')
const DESIGN = fileURLToPath(new URL('../docs/design/tokens.css', import.meta.url))

const read = (p: string) => readFileSync(p, 'utf8')
/** Path as it reads in a failure message: `components/ui/Card.vue`, not 400 characters of prefix. */
const rel = (p: string) => p.slice(SRC.length)

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir).sort()) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(vue|css|ts)$/.test(entry)) out.push(p)
  }
  return out
}

const FILES = walk(SRC)

// ---------------------------------------------------------------------------------------------
// Reading a stylesheet without a CSS parser, carefully enough that the answers are trustworthy.
// ---------------------------------------------------------------------------------------------

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

/** COMMENTS ARE NOT CODE, and this file is the proof that it matters: the sheets and components
 *  here explain themselves at length, and half those explanations quote a token name or write out
 *  a `var(--x)` as an example. Read raw, this scanner reported three "missing tokens" that were
 *  three sentences describing the scanner. Block comments, HTML comments, and `//` lines – the
 *  last only when the `//` OPENS the line, so a `https://` inside a string is never mistaken for a
 *  comment and no real reference is stripped away. A trailing `// note` after code survives; that
 *  direction fails loud rather than silent, which is the right way round for a gate. */
const stripAllComments = (text: string) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '')

/** The CSS in a file: the whole thing for `.css`, every `<style>` block for an SFC. Comments out –
 *  this sheet quotes token names inside its own prose ("the design system declares `--warning:
 *  #f5b942`"), and a quoted example is not a declaration. */
function cssOf(path: string, text: string): string {
  if (path.endsWith('.css')) return stripComments(text)
  return stripComments([...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n'))
}

/** Custom properties DECLARED in a chunk of CSS.
 *  The lookbehind is the whole trick: `.tb-pill--ghost:hover` contains the characters `--ghost:`
 *  and is a selector, not a declaration. Requiring that nothing word-ish precedes the `--` tells
 *  the two apart, because a real declaration is preceded by `{`, `;` or a newline. */
function declaredIn(css: string): Map<string, string> {
  const out = new Map<string, string>()
  for (const m of css.matchAll(/(?<![-\w])(--[a-z0-9-]+)\s*:\s*([^;}]+)/gi)) {
    out.set(m[1], m[2].trim().replace(/\s+/g, ' '))
  }
  return out
}

/** Custom properties a file SETS ON AN ELEMENT from script – Vue's `:style="{ '--tone': ... }"`.
 *  These are declarations too; they just are not written in CSS. Card.vue's `--tb-card-pad` and
 *  onboarding's `--tone` / `--pose` are the whole of this category today, and they are legitimate:
 *  a value that differs per element cannot live in a stylesheet. */
function boundIn(text: string): Set<string> {
  return new Set([...text.matchAll(/['"](--[a-z0-9-]+)['"]\s*:/gi)].map((m) => m[1]))
}

/** Every `var(--x)` a file REFERENCES.
 *  `dynamic` is the interpolated form – `var(--style-${s.id})` in onboarding R, where the name is
 *  finished at runtime. The name cannot be known here, so what is checked is the PREFIX: some token
 *  by that stem has to exist. The exact completions are pinned where the ids live
 *  (tests/redesign-onboarding.test.ts reads the `PlayStyle` union out of the protocol). */
function referencedIn(text: string): { name: string; fallback: boolean; dynamic: boolean }[] {
  return [...stripAllComments(text).matchAll(/var\(\s*(--[a-z0-9-]*)(\$\{)?\s*([,)])?/gi)].map((m) => ({
    name: m[1],
    dynamic: Boolean(m[2]),
    fallback: m[3] === ',',
  }))
}

const sheetTokens = declaredIn(cssOf(SHEET, read(SHEET)))
const designTokens = declaredIn(stripComments(read(DESIGN)))

// ===============================================================================================
// RULE A — every var(--x) in the app RESOLVES
// ===============================================================================================
describe('every custom property the app references actually exists at runtime', () => {
  it('is declared in src/style.css, or set by its own file, or carries a fallback', () => {
    const broken: string[] = []
    for (const path of FILES) {
      const text = read(path)
      const local = new Set([...declaredIn(cssOf(path, text)).keys(), ...boundIn(text)])
      for (const ref of referencedIn(text)) {
        if (ref.fallback) continue
        if (ref.dynamic) {
          // `var(--style-${id})`: something on :root must start with this stem, or the whole
          // family is missing and every card on that screen paints with nothing.
          const family = [...sheetTokens.keys()].filter((t) => t.startsWith(ref.name))
          if (!family.length) broken.push(`${rel(path)}  var(${ref.name}\${...})  – no token starts with that stem`)
          continue
        }
        if (!sheetTokens.has(ref.name) && !local.has(ref.name)) {
          broken.push(`${rel(path)}  var(${ref.name})  – declared nowhere the app can see it`)
        }
      }
    }
    // Printed in full rather than counted: the point of this gate is that the FIRST time it fires,
    // whoever sees it can read the list and know exactly which screens are painting with nothing.
    expect(broken.join('\n')).toBe('')
  })

  it('...and the scan is real – it can see the tokens, the files and the references', () => {
    // Vacuous-truth insurance. If a regex above ever stops matching, the loop passes by finding
    // nothing at all, which is the one way a guard like this fails open.
    expect(FILES.length).toBeGreaterThan(20)
    expect(sheetTokens.size).toBeGreaterThan(60)
    expect(designTokens.size).toBeGreaterThan(100)
    const refs = FILES.flatMap((p) => referencedIn(read(p)))
    expect(refs.length).toBeGreaterThan(500)
    expect(refs.some((r) => r.dynamic)).toBe(true) // onboarding R's var(--style-${id})
    expect(refs.some((r) => r.fallback)).toBe(true) // Card.vue's var(--tb-card-pad, 14px)
  })
})

// ===============================================================================================
// RULE B — a shared token has ONE home
// ===============================================================================================
describe('no component keeps its own copy of a design-system token', () => {
  it('a token the design system names is declared in src/style.css and nowhere else', () => {
    const copies: string[] = []
    for (const path of FILES) {
      if (path === SHEET) continue
      for (const [token, value] of declaredIn(cssOf(path, read(path)))) {
        if (designTokens.has(token)) copies.push(`${rel(path)}  ${token}: ${value}  – belongs on :root in src/style.css`)
      }
    }
    expect(copies.join('\n')).toBe('')
  })

  it('a component MAY still declare a property that is its own business', () => {
    // The rule above must not become "components may not use custom properties". Card's padding
    // hook and PrimaryPill's variants are mechanisms, not shared vocabulary, and they are fine.
    const card = read(join(SRC, 'components/ui/Card.vue'))
    expect(card).toContain('--tb-card-pad')
    expect(designTokens.has('--tb-card-pad')).toBe(false)
  })
})

// ===============================================================================================
// THE TOKENS THIS WAVE PROMOTED — pinned by value, so a copy cannot drift back
// ===============================================================================================
describe('the tokens that used to live in components are on :root, at the design\'s values', () => {
  it('⚠ the four play-style colours – renamed to the playStyle ids, values unchanged', () => {
    // WHAT MOVED: they were declared on `.ob` in OnboardingWizard.vue, under the DESIGN's names.
    // WHAT DID NOT: the four values, which are still the design system's, checked against it below.
    // The rename is the point – `PlayStyle` is persisted inside `PlayerProfile`, so the union is
    // the one name we cannot change, and everything else lines up behind it. Screen R now derives
    // both the pose SVG and the colour from the id, so there is no mapping left to rot.
    for (const [ours, theirs] of [
      ['--style-aggressive', '--style-baseliner'],
      ['--style-counterpuncher', '--style-counterpuncher'],
      ['--style-serve-first', '--style-bigserve'],
      ['--style-all-court', '--style-allcourt'],
    ]) {
      expect(sheetTokens.get(ours), `${ours} is not on :root`).toBeDefined()
      expect(sheetTokens.get(ours), `${ours} drifted off the design's ${theirs}`).toBe(designTokens.get(theirs))
    }
  })

  it('⚠ the paper layer\'s second ink, lifted out of PaperNote.vue', () => {
    expect(sheetTokens.get('--paper-ink-soft')).toBe(designTokens.get('--paper-ink-soft'))
    expect(read(join(SRC, 'components/ui/PaperNote.vue'))).not.toMatch(/^\s*--paper-ink-soft\s*:/m)
  })

  it('⚠ the thirteen calendar event colours, lifted for screen H\'s time x day grid', () => {
    // WHAT MOVED: nothing, and that is the point - they had never been lifted at all. All thirteen
    // lived in `docs/design/tokens.json` / `tokens.css`, which the app never imports, so the first
    // component to write `var(--event-training)` would have painted a block with no colour and no
    // error. They are on :root now, at the design's own values, checked against the export below.
    const EVENT = [
      '--event-training', '--event-training-alt', '--event-gym', '--event-school',
      '--event-school-long', '--event-drills', '--event-match', '--event-match-long',
      '--event-study', '--event-travel', '--event-rest', '--event-tournament',
      '--event-tournament-border',
    ]
    for (const token of EVENT) {
      expect(sheetTokens.get(token), `${token} is not on :root`).toBeDefined()
      expect(sheetTokens.get(token), `${token} drifted off the design export`).toBe(designTokens.get(token))
    }
    // ...and the design really does name thirteen of them, so a token dropped from the list above
    // cannot quietly shrink what this test covers.
    expect([...designTokens.keys()].filter((t) => t.startsWith('--event-')).length).toBe(EVENT.length)
  })

  it('⚠ L and M\'s celebration ground, lifted out of TournamentFlow.vue\'s point of use', () => {
    for (const token of ['--celebration-bg', '--celebration-bg-cool']) {
      expect(sheetTokens.get(token)).toBe(designTokens.get(token))
    }
    // ...and the screen REFERENCES them rather than spelling the gradients out again.
    const flow = read(join(SRC, 'components/TournamentFlow.vue'))
    expect(flow).toContain('background: var(--celebration-bg);')
    expect(flow).not.toContain('radial-gradient(120% 68% at 50% 0%')
  })
})
