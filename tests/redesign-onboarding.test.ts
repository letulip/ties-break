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
import { engineModuleSource } from './worldSource'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { onboardingHeroUrl } from '../src/art/preload'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

const wizard = read('../src/components/OnboardingWizard.vue')
/** The TEMPLATE, and only the template: the script above it quotes the owner in Russian and spells
 *  the handoff's own rule with its em dash, and the player-facing copy guards must not read either
 *  of those as something a player will see. */
const template = wizard.slice(wizard.indexOf('<template>'), wizard.lastIndexOf('</template>'))
/** ⚠ THE TEMPLATE WITH ITS COMMENTS TAKEN OUT, and only the copy guards below read it.
 *  WHAT MOVED: the template used to carry no Russian at all, so the Cyrillic guard could read the
 *  whole of it. The footer now explains, where the markup is, WHY S grew a Back pill and why the
 *  tennis ball left every CTA – and both of those are the owner's own words, in Russian, exactly
 *  as the script block above has always quoted him.
 *  WHAT DID NOT MOVE: the protected fact. A player never reads an HTML comment – Vue's SFC compiler
 *  strips them from the production render – so "no Cyrillic and no em dash in what a player sees"
 *  is now measured on precisely what a player sees, and a stray Cyrillic string in real markup
 *  still fails. This is the guard getting narrower around its own subject, not looser. */
const copy = template.replace(/<!--[\s\S]*?-->/g, '')
/** The scoped block, for the rules that only this screen renders. */
const css = wizard.slice(wizard.indexOf('<style scoped>'))
/** ⚠ THE SAME BLOCK WITH ITS COMMENTS OUT, and only the "this rule does NOT exist" guards read it.
 *  Same move, same reason as `copy` above: this sheet explains itself, and an explanation names the
 *  things it is explaining. The `:root` guard below started failing the moment a comment recorded
 *  that four tokens had graduated TO `src/style.css`'s :root. An absence assertion has to be made
 *  against code, or it is really an assertion about prose. */
const cssCode = css.replace(/\/\*[\s\S]*?\*\//g, '')

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
    // ⚠ 9 SINCE v27: `birthDay` joined `birthMonth` (owner, 30.07 - the birthday week has to be the right
    // week, because the family congratulates her on it). This count is the guard WORKING, not a chore: it
    // is the line that made the wizard collect the new field instead of shipping a profile with a hole.
    expect(fields.length).toBe(9) // kidName kidLastName gender country background coachTier playStyle birthMonth birthDay
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
    expect(literal).toContain('birthDay: DEFAULT_PROFILE.birthDay')
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
    expect(cssCode).not.toMatch(/padding:\s*\d+px\s+22px/)
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

  it('NO TENNIS BALL on any onboarding button – the word is the whole button', () => {
    // Owner, 29.07: «уберите этот мячик на онбординге со всех кнопок, он там не нужен». The design
    // draws the glyph beside all three CTA words. Written as "no <svg> inside any PrimaryPill on
    // this screen" rather than as three deletions, so it covers a fourth CTA nobody has added yet.
    for (const pill of copy.match(/<PrimaryPill[\s\S]*?<\/PrimaryPill>/g) ?? []) {
      expect(pill, 'a glyph came back onto an onboarding CTA').not.toContain('<svg')
    }
    // The three of them, and nothing between the tags but the word.
    expect([...copy.matchAll(/<PrimaryPill[^>]*>\s*<span>([^<]+)<\/span>\s*<\/PrimaryPill>/g)]
      .map((m) => m[1])).toEqual(['Begin', 'Start career', 'Next'])
  })

  it('adds no :root block – tokens live in src/style.css and a scoped :root matches nothing', () => {
    expect(cssCode).not.toContain(':root')
  })
})

// ===========================================================================
// 2d. THE PLAY-STYLE POSES — the mapping most able to 404 in silence
// ===========================================================================
describe('R: every play style has a pose that ships, and a colour to paint it', () => {
  const styles = region('const PLAY_STYLES: {', 'const RADAR_OUTER')
  /** The `PlayStyle` union, read out of the protocol rather than listed here – so a fifth style
   *  added there fails every test below until R can offer it, paint it and draw it. */
  // ⚠ RE-AIMED by R2-09 – the EXTRACTION, not the assertion. `shared/protocol` is a BARREL since the
  // split, so reading protocol.ts alone would slice a file that holds only re-export lines and
  // `indexOf` would return -1 – the silent-swallow failure this codebase already has a scar from.
  // `engineModuleSource('../shared/protocol')` is the barrel PLUS every src/shared/protocol/*.ts
  // part, so the pin is location-independent and the remaining moves need no test edit.
  const protocol = engineModuleSource('../shared/protocol')
  const IDS = [...protocol
    .slice(protocol.indexOf('export type PlayStyle'), protocol.indexOf('\n', protocol.indexOf('export type PlayStyle')))
    .matchAll(/'([^']+)'/g)].map((m) => m[1])

  it('covers every PlayStyle the protocol declares, and nothing else', () => {
    expect(IDS).toHaveLength(4)
    expect([...styles.matchAll(/^ {4}id: '([^']+)',$/gm)].map((m) => m[1]).sort()).toEqual([...IDS].sort())
  })

  it('⚠ every id has its pose SVG on disk – the FILE is named after the id, so there is no mapping', () => {
    // WHAT MOVED. This used to pin a CORRECTION: docs/specs/ui-inventory.md §4 Q4 claimed the four
    // SVGs matched "the four `playStyle` ids exactly", two of them did not (`baseliner` was our
    // `aggressive`, `bigserve` our `serve-first`), and the screen carried a `pose:` field per style
    // to translate. The owner ruled the other way (29.07: «переименуй если нужно») and the two FILES
    // were renamed, because `PlayStyle` is persisted inside `PlayerProfile` and the union is the one
    // name that cannot move without a save migration.
    // WHAT DID NOT MOVE: the protected fact, which is the only one that ever mattered – every id the
    // protocol declares resolves to art that ships. It is now pinned against the ids DIRECTLY rather
    // than against a hand-written list of four filenames, so it is a stronger assertion than before
    // and the ui-inventory line it was correcting is true at last.
    for (const id of IDS) {
      expect(
        existsSync(new URL(`../public/icons/styles/${id}.svg`, import.meta.url)),
        `pose art missing: ${id}.svg`,
      ).toBe(true)
    }
    // ...and the screen derives the filename from the id instead of carrying the old table.
    expect(styles, 'the pose mapping came back').not.toContain('pose:')
    expect(wizard).toContain('icons/styles/${id}.svg')
  })

  it('⚠ every id has its colour on :root – and the WIZARD no longer declares them', () => {
    // WHAT MOVED: the four `--style-*` were declared on `.ob` in this component, because
    // docs/design/tokens.css is a reference nobody imports and the screen had to declare what it
    // used. They are in src/style.css's :root now, under the ids (owner, 29.07: «а если так, то
    // зачем они нам вообще?»), and tests/design-tokens.test.ts is the general gate that keeps any
    // token from going back to being a private copy.
    // WHAT DID NOT MOVE: that all four resolve, and at the design system's own values. Both are
    // still checked – here against the ids, there against docs/design/tokens.css.
    const sheet = read('../src/style.css')
    for (const id of IDS) {
      expect(sheet, `--style-${id} is not on :root`).toMatch(new RegExp(`^\\s*--style-${id}:`, 'm'))
    }
    expect(cssCode, 'the wizard is declaring style colours again').not.toMatch(/^\s*--style-/m)
    // The card asks for its colour by id, so a fifth style needs a token and nothing else.
    expect(template).toContain("'--tone': `var(--style-${s.id})`")
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

  it('⚠ keeps a way BACK out of the last step, and it is the SAME control the step before it uses', () => {
    // "Back keeps the choices already made" is the handoff's own interaction rule, and a summary
    // you cannot walk back out of is a summary you cannot correct. The mock draws no Back on S.
    // WHAT MOVED (owner, 29.07: «давай сделаем по аналогии с предыдущим шагом»): it used to be the
    // quiet underlined line, where N puts Skip. It is now `.ob-back`, the pill R carries, in R's
    // place. WHAT DID NOT MOVE: that there IS a way back, which is all the old assertion pinned.
    const foot = template.slice(template.indexOf('step === STEP_COUNT'))
    expect(foot).toContain('<button class="ob-back" type="button" @click="back">Back</button>')
    // Same shape as the step before it: a footer ROW, not the solo column N ends on.
    expect(foot.slice(0, foot.indexOf('>'))).not.toContain('ob-foot--solo')
  })

  it('⚠ Start career is LARGER than Next – the one button that begins a career, not a step', () => {
    // Owner, 29.07: "только кнопка старт будет чуть больше Next". Both are the CTA pill in the same
    // row, so the difference is a modifier on top of `.ob-cta`, and it has to be a real one: every
    // number on `--start` must exceed the base rule's, or "slightly larger" is a class that does
    // nothing. Read out of the sheet rather than asserted as literals, so re-tuning either rule
    // keeps the RELATION honest.
    expect(template).toContain('class="ob-cta ob-cta--start"')
    const pad = (rule: string) => {
      const block = css.slice(css.indexOf(`${rule} {`), css.indexOf('}', css.indexOf(`${rule} {`)))
      const m = block.match(/padding: (\d+(?:\.\d+)?)px (\d+(?:\.\d+)?)px/)
      const f = block.match(/font-size: (\d+(?:\.\d+)?)px/)
      if (!m) throw new Error(`no padding on ${rule}`)
      return { y: +m[1], x: +m[2], fs: f ? +f[1] : 14.5 }
    }
    const next = pad('.ob-cta.primary')
    const start = pad('.ob-cta--start.primary')
    expect(start.y).toBeGreaterThan(next.y)
    expect(start.x).toBeGreaterThan(next.x)
    expect(start.fs).toBeGreaterThan(next.fs)
  })

  // ⚠ RE-AIMED: THE STAND-IN IS GONE. This used to assert `const HERO_ART = SUMMARY_ART`, i.e. that
  // N and S drew the SAME file. The owner's square master for N has landed («картинка для первого
  // экрана создания персонажа у нас есть, надо поменять»), so that equality is exactly the thing
  // that had to change and asserting it would now pin the bug.
  //
  // NOTHING THIS TEST WAS PROTECTING HAS MOVED, and all three protected facts are still asserted
  // below, one for one:
  //   1. S still draws `jun-norm` – the owner SETTLED that one («первый раз входит в клуб») and it
  //      was never in question. Same literal, same file on disk.
  //   2. The hero is still ONE named constant with ONE call site in the template, which is what
  //      "swapping it is a one-line change" meant and the only reason this line was ever pinned.
  //   3. Both files really ship. The old test proved that for one path; there are two now, so it is
  //      proved for both - and the hero's URL is checked through the BUILDER rather than as a
  //      hand-written string, so it cannot drift into a 404 the way `-fs8` once did.
  it('draws the settled portrait on S and the owner\'s own master on N – two files, one line each', () => {
    expect(wizard).toContain("portraitUrl('jun', 'norm')")
    expect(
      existsSync(new URL('../public/images/fem-euro-brunnet/fem-euro-brunnet-jun-norm.webp', import.meta.url)),
    ).toBe(true)

    expect(wizard).toContain('const HERO_ART = onboardingHeroUrl()')
    expect(template.match(/HERO_ART/g)).toHaveLength(1)
    // The builder's own output, resolved against public/ - so the file the app requests is the file
    // the pipeline produced, and neither can be renamed without this failing.
    const hero = onboardingHeroUrl().replace(/^\/+/, '')
    expect(hero).toContain('welcome-1.webp')
    expect(existsSync(new URL(`../public/${hero}`, import.meta.url)), `missing hero art ${hero}`).toBe(true)
    // ...and the master itself never shipped: only the webp is committed under public/.
    expect(existsSync(new URL('../public/images/fem-euro-brunnet-jpeg', import.meta.url))).toBe(false)
  })
})

// ===========================================================================
// 2f. PLAYER-FACING COPY
// ===========================================================================
describe('the copy a player reads', () => {
  it('carries no Cyrillic and no em dash – the short dash is the house dash', () => {
    expect(copy).not.toMatch(/[Ѐ-ӿ]/)
    expect(copy).not.toContain('—')
    // The mockups themselves spell N's three paragraphs with em dashes; ours do not.
    expect(copy).toContain("You're the parent now – every choice")
  })

  it('⚠ writes its six headings in the CASE THEY RENDER IN, rather than shouting them in CSS', () => {
    // Owner, 29.07: «не капс локом, а просто каждое слово с большой буквы, как в остальных всех
    // экранах». WHAT MOVED: `text-transform: uppercase` came off `.ob-title` and `.ob-hero-title`.
    // WHAT THIS PROTECTS, which nothing protected before: the pair of them. Dropping the transform
    // without re-casing the strings ships six sentence-case headings; re-casing them and leaving the
    // transform on ships the caps he asked us to remove. Neither half can come back on its own.
    const heads = region('const STEP_HEADS', 'function poseUrl')
    expect([...heads.matchAll(/title: '([^']+)'/g)].map((m) => m[1])).toEqual([
      'Raise a Champion', 'Who Is Your Player?', 'Where Are You Starting?',
      'Family Setup', 'Choose Play Style', 'All Set!',
    ])
    expect(copy).toContain('Raise a Champion.<br /><span>Together.</span>')
    // ...and no heading rule shouts. `capitalize` is banned with it: it would raise the "a" in
    // "Raise a Champion" and leave the source lying about what the screen says.
    for (const rule of ['.ob-title', '.ob-hero-title']) {
      const block = css.slice(css.indexOf(`${rule} {`), css.indexOf('}', css.indexOf(`${rule} {`)))
      expect(block, `${rule} still transforms its case`).not.toContain('text-transform')
    }
    // The face was never the problem – both were Sora (--font-heading) already, and stay Sora.
    expect(css.match(/font-family: var\(--font-heading\)/g)?.length).toBeGreaterThanOrEqual(2)
  })

  it('says which of six steps you are on, out loud as well as in lime', () => {
    expect(template).toContain('aria-label')
    expect(template).toContain(":aria-current=\"n === step ? 'step' : undefined\"")
  })
})
