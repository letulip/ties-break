// ui/u5 – the onboarding rebuild, screens N–S (docs/design/README.md §"N–S. Онбординг").
//
// The wizard is the ONE screen a player cannot skip past on a fresh install, and it is the only
// writer of `PlayerProfile` – every later screen reads what it wrote. So the pins here are of two
// kinds, in the house order (round10/11/12/13-view, redesign-home):
//
//  1. WHAT IT COLLECTS. Derived from the protocol rather than from a list copied into this file:
//     if a field joins `PlayerProfile` and the wizard does not ask for it, this fails. That is the
//     regression this slice was most able to cause and least able to notice.
//  2. FILE-READING STRUCTURE PINS on the decisions of the redesign – the 22px gutter, six steps,
//     the shared components, the pose mapping, the copy rules. Facts about a template, which are
//     exactly the facts that rot silently.
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

const wizard = read('../src/components/OnboardingWizard.vue')
/** The TEMPLATE, and only the template: the script above it quotes the owner in Russian and spells
 *  the handoff's own rule with its em dash, and the player-facing copy guards must not read either
 *  of those as something a player will see. */
const template = wizard.slice(wizard.indexOf('<template>'), wizard.lastIndexOf('</template>'))
/** The scoped block, for the rules that only this screen renders. */
const css = wizard.slice(wizard.indexOf('<style scoped>'))

/** A named region of the source, by its two boundary markers. Throws rather than returning '' when
 *  a marker is gone, so a moved constant can never pass a `toContain` by vacuous truth. */
function region(from: string, to: string): string {
  const a = wizard.indexOf(from)
  const b = wizard.indexOf(to)
  if (a < 0) throw new Error(`marker not found: ${from}`)
  if (b < 0) throw new Error(`marker not found: ${to}`)
  return wizard.slice(a, b)
}

// ===========================================================================
// 1. WHAT ONBOARDING COLLECTS — the contract with the rest of the game
// ===========================================================================
describe('the wizard still writes a whole PlayerProfile', () => {
  const literal = region('const profile = reactive<PlayerProfile>({', 'const countryChosen')

  it('asks for every field the profile has – the list comes from the protocol, not from here', () => {
    // `DEFAULT_PROFILE` is the profile's own shape, so a field added to the interface arrives here
    // automatically and this test starts failing until the wizard collects it.
    const fields = Object.keys(DEFAULT_PROFILE)
    expect(fields.length).toBe(8) // kidName kidLastName gender country background coachTier playStyle birthMonth
    for (const field of fields) {
      expect(literal, `onboarding no longer initialises ${field}`).toContain(`${field}:`)
    }
  })

  it('starts on the SAME defaults it always did – the redesign moved pixels, not values', () => {
    // Girls only (the boys' tour is post-v1 content), no country until one is chosen, the
    // middle-class family, the STANDARD coach rung rather than the dearest, all-court, and the
    // birth month the protocol picks.
    expect(literal).toContain("gender: 'girl'")
    expect(literal).toContain("country: ''")
    expect(literal).toContain("background: 'middle'")
    expect(literal).toContain('coachTier: DEFAULT_PROFILE.coachTier')
    expect(literal).toContain("playStyle: 'all-court'")
    expect(literal).toContain('birthMonth: DEFAULT_PROFILE.birthMonth')
    expect(DEFAULT_PROFILE.coachTier).toBe('middle')
    expect(DEFAULT_PROFILE.birthMonth).toBe(6)
  })

  it('gates the two steps that can be left empty, and only those two', () => {
    const gate = region('const nextDisabled', 'const head =')
    expect(gate).toContain('step.value === 2 && !nameValid.value')
    expect(gate).toContain('step.value === 3 && !countryChosen.value')
  })

  it('Skip hands the engine the DEFAULT profile, not a half-filled one', () => {
    expect(region('function skipToDefaults', 'function start')).toContain('newCareer(\'\', DEFAULT_PROFILE)')
  })

  it('trims the names and falls back rather than starting a career called ""', () => {
    const start = region('function start()', '</script>')
    expect(start).toContain('profile.kidName.trim() || DEFAULT_PROFILE.kidName')
    expect(start).toContain('profile.kidLastName.trim() || randomSurname()')
  })

  it('offers the two coach rungs it always did – `self` and the STANDARD private coach', () => {
    const options = region('const COACH_OPTIONS', 'const PLAY_STYLES')
    expect([...options.matchAll(/id: '([^']+)'/g)].map((m) => m[1])).toEqual(['self', 'middle'])
    // ...and never the dearest rung, which is the wall docs/specs/coach-tiers.md exists to close.
    expect(options).not.toContain("'elite'")
  })

  it('offers the three family backgrounds, in the design\'s order', () => {
    const backgrounds = region('const BACKGROUNDS', 'const MONTHS')
    expect([...backgrounds.matchAll(/id: '([^']+)'/g)].map((m) => m[1])).toEqual([
      'wealthy', 'middle', 'working',
    ])
  })
})

// ===========================================================================
// 2a. SIX STEPS — the handoff designs six screens, N through S
// ===========================================================================
describe('the wizard is six steps, and the rail counts them', () => {
  it('STEP_COUNT is 6 – Q merged the background and coaching screens onto one', () => {
    expect(wizard).toContain('const STEP_COUNT = 6')
  })

  it('every step from 1 to 6 has a pane, and the summary is the last one', () => {
    for (const n of [1, 2, 3, 4, 5]) {
      expect(template, `no pane for step ${n}`).toMatch(new RegExp(`step === ${n}[^>]*class="ob-pane`))
    }
    // Step 6 is the `v-else`, so it cannot be reached by a number that does not exist.
    expect(template).toContain('<section v-else class="ob-pane bare ob-summary">')
    expect(template).toContain('step === STEP_COUNT')
  })

  it('the rail is one <li> per step, driven by STEP_COUNT rather than six hand-written circles', () => {
    expect(template).toContain('v-for="n in STEP_COUNT"')
    expect(template).toContain('`Step ${step} of ${STEP_COUNT}`')
  })
})

// ===========================================================================
// 2b. THE 22px GUTTER — the handoff's one documented exception
// ===========================================================================
describe('onboarding is the screen that passes ScreenShell a gutter', () => {
  it('passes 22, the handoff\'s number for N–S', () => {
    // docs/design/HANDOFF-RULES.md: "gutter контента 14px (онбординг N–S — 22px)". ScreenShell's
    // `gutter` prop is opt-in for exactly this caller; every other screen inherits the app frame.
    expect(template).toContain(':gutter="22"')
  })

  it('and does NOT re-pad itself on top of the shell', () => {
    // A second horizontal inset here would be the 22 twice. The shell owns the side gutter on this
    // screen; the panes own only their vertical rhythm.
    expect(css).not.toMatch(/padding:\s*\d+px\s+22px/)
  })
})

// ===========================================================================
// 2c. THE SHARED COMPONENTS — six screens must not each re-invent the card
// ===========================================================================
describe('the wizard is built from the shared components, not from hand-rolled copies', () => {
  it('imports the shell, the card, the eyebrow and the pill', () => {
    for (const c of ['ScreenShell', 'Card', 'Eyebrow', 'PrimaryPill']) {
      expect(wizard, `${c} not imported`).toContain(`import ${c} from './ui/${c}.vue'`)
    }
  })

  it('EVERY choice is a card-BUTTON – a door carries the keyboard, a div does not', () => {
    // The four choosers on P, Q and R. Each one is `<Card as="button">` with `aria-pressed`, so it
    // is tabbable, activates on Enter/Space, and says out loud whether it is the chosen one.
    for (const cls of ['ob-tile', 'ob-row', 'ob-cell', 'ob-style']) {
      const i = template.indexOf(`class="${cls}"`)
      expect(i, `${cls} not found`).toBeGreaterThan(0)
      const card = template.slice(template.lastIndexOf('<Card', i), i + 400)
      expect(card, `${cls} is not a button`).toContain('as="button"')
      expect(card, `${cls} does not report its state`).toContain(':aria-pressed=')
    }
    // ...and nothing on this screen is a clickable div.
    expect(template).not.toMatch(/<div[^>]*@click/)
    expect(template).not.toMatch(/<span[^>]*@click/)
  })

  it('the big affirmatives are the export\'s CTA pill, and Next is gated by the step\'s validity', () => {
    expect(template.match(/<PrimaryPill variant="cta"/g)).toHaveLength(3) // Begin · Start career · Next
    expect(template).toContain(':disabled="nextDisabled"')
    expect(template).toContain(':disabled="game.busy"')
  })

  it('adds no :root block – tokens live in src/style.css and a scoped :root matches nothing', () => {
    expect(css).not.toContain(':root')
  })
})

// ===========================================================================
// 2d. THE PLAY-STYLE POSES — the mapping most able to 404 in silence
// ===========================================================================
describe('R: every play style has a pose that ships, and a colour to paint it', () => {
  const styles = region('const PLAY_STYLES: {', 'const RADAR_OUTER')

  it('covers every PlayStyle the protocol declares, and nothing else', () => {
    // The union is read out of the protocol, so a fifth style added there fails here until R
    // offers it – rather than quietly shipping a screen that cannot choose it.
    const protocol = read('../src/shared/protocol.ts')
    const union = protocol.slice(protocol.indexOf('export type PlayStyle'), protocol.indexOf('\n', protocol.indexOf('export type PlayStyle')))
    const declared = [...union.matchAll(/'([^']+)'/g)].map((m) => m[1])
    expect(declared).toHaveLength(4)
    expect([...styles.matchAll(/^ {4}id: '([^']+)',$/gm)].map((m) => m[1]).sort()).toEqual([...declared].sort())
  })

  it('⚠ the pose FILES are not named after the ids, and the mapping is spelled out for it', () => {
    // docs/specs/ui-inventory.md §4 Q4 says the four SVGs match "the four `playStyle` ids exactly".
    // Two of them do not: `baseliner` is our `aggressive`, `bigserve` is our `serve-first`. This
    // test pins the CORRECTION – each style names its own file, and each file exists.
    const poses = [...styles.matchAll(/pose: '([^']+)'/g)].map((m) => m[1])
    expect(poses).toEqual(['baseliner', 'counterpuncher', 'bigserve', 'all-court'])
    for (const pose of poses) {
      expect(
        existsSync(new URL(`../public/icons/styles/${pose}.svg`, import.meta.url)),
        `pose art missing: ${pose}.svg`,
      ).toBe(true)
    }
  })

  it('the four style colours are declared, because docs/design/tokens.css is never imported', () => {
    // They are the design system's own values (--style-*), and they resolve only because the screen
    // declares them on its own root. If they ever graduate to src/style.css, this moves with them.
    for (const [token, value] of [
      ['--style-baseliner', '#ef4b3a'],
      ['--style-counterpuncher', '#cfe152'],
      ['--style-bigserve', '#5b9bd5'],
      ['--style-allcourt', '#9b7fd4'],
    ]) {
      expect(css, `${token} not declared`).toContain(`${token}: ${value}`)
    }
    const design = read('../docs/design/tokens.css')
    for (const value of ['#ef4b3a', '#cfe152', '#5b9bd5', '#9b7fd4']) {
      expect(design, `${value} is not the design system's`).toContain(value)
    }
  })

  it('the silhouettes are MASKED rather than dropped in as images – black art on a black page', () => {
    expect(css).toContain('mask: var(--pose)')
    expect(css).toContain('background: var(--tone)')
  })
})

// ===========================================================================
// 2e. S — the summary reads back every choice, so nothing is decided unseen
// ===========================================================================
describe('S: the summary shows what the six steps collected', () => {
  const summary = template.slice(template.indexOf('ob-summary'), template.indexOf('#footer'))

  it('names all six readings, in the design\'s order', () => {
    expect([...summary.matchAll(/<dt>([^<]+)<\/dt>/g)].map((m) => m[1])).toEqual([
      'Name', 'Country', 'Birth month', 'Background', 'Coaching', 'Play style',
    ])
  })

  it('reads them off the profile rather than off a copy made at step 1', () => {
    for (const bound of ['profile.kidName', 'countryLabel', 'birthMonthLabel', 'backgroundLabel', 'coachingLabel', 'playStyleLabel']) {
      expect(summary, `${bound} not shown`).toContain(bound)
    }
  })

  it('keeps a way BACK out of the last step, which the mock does not draw', () => {
    // "Back keeps the choices already made" is the handoff's own interaction rule, and a summary
    // you cannot walk back out of is a summary you cannot correct.
    const foot = template.slice(template.indexOf('step === STEP_COUNT'))
    expect(foot).toContain('@click="back"')
  })

  it('shows the portrait the owner settled on – jun-norm, "первый раз входит в клуб"', () => {
    expect(wizard).toContain("portraitUrl('jun', 'norm')")
    expect(
      existsSync(new URL('../public/images/fem-euro-brunnet/fem-euro-brunnet-jun-norm.webp', import.meta.url)),
    ).toBe(true)
    // The hero on N is the same file only until the owner's new square master lands, and swapping
    // it is one line. This pins that it IS one line – a single named constant, not six call sites.
    expect(wizard).toContain('const HERO_ART = SUMMARY_ART')
    expect(template.match(/HERO_ART/g)).toHaveLength(1)
  })
})

// ===========================================================================
// 2f. PLAYER-FACING COPY
// ===========================================================================
describe('the copy a player reads', () => {
  it('carries no Cyrillic and no em dash – the short dash is the house dash', () => {
    expect(template).not.toMatch(/[Ѐ-ӿ]/)
    expect(template).not.toContain('—')
    // The mockups themselves spell N's three paragraphs with em dashes; ours do not.
    expect(template).toContain("You're the parent now – every choice")
  })

  it('says which of six steps you are on, out loud as well as in lime', () => {
    expect(template).toContain('aria-label')
    expect(template).toContain(":aria-current=\"n === step ? 'step' : undefined\"")
  })
})
