// ⭐⭐ ROUND 30 #6 – THE NEXT-TOURNAMENT SCREEN, RE-LAID.
//
// The owner's words are in `NextTournamentPanel.vue`'s script header in full (Cyrillic may not
// appear in a template, and a test that mounts one is held to the same rule by
// `round29-next-tournament.test.ts`). Itemised, he asked for: no frame; a SQUARE tournament picture,
// Home being the example; part of the description, `The read`, the weather and the trip ON the
// picture; the rounds as their own plate below, full width with padding at the edges; the four icons
// directly under the picture, in a row, with no plate; and the training plan at the bottom unchanged.
//
// ⚠ THIS FILE ASSERTS PLACEMENT, AND ONLY PLACEMENT. What the panel SAYS is round 29 #8's, and
// `round29-next-tournament.test.ts` still holds every figure, label and sentence of it – it passed
// unchanged across this re-lay, which is the evidence that this was a redesign and not a rebuild.
// The two files are deliberately not merged: one would go red on a restyle, the other on a rewrite.
//
// ⚠ MOUNTED AGAINST A REAL SNAPSHOT, engine-built, never a hand-written shape – round20-ui's house
// rule, and the reason the fixture below walks a real career.
//
// ⭐⭐ ROUND 30 #18 – THE SAME SCREEN, AND THE ONE THING #6 LEFT OPEN. Its builder shipped the
// picture square but INSIDE the app's gutter and asked, because Home's hero is square AND
// full-bleed and he had not been told which. The owner then told him:
//
//     «в край, как hero картинка на главной, если можно. И плашки дальше как на главной на своих
//      подложках, кроме этих 4х характеристик турнира про призовые, зрителей и т.п.»
//
// Three claims, one describe block each way down this file: the picture breaks the gutter the way
// Home's does, the plate under it keeps its backing and its gutter, and the four facts still have
// no plate at all. ⚠ AND THE COPY DID NOT MOVE FOR ANY OF IT – `round29-next-tournament.test.ts`
// passes unedited across this change too, which is the same evidence #6 produced.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import { readFileSync } from 'node:fs'
import { region } from '../helpers/source'
import { DESKTOP, PHONE, TABLET, setViewport, type Viewport } from './fits'
import NextTournamentPanel from '../../src/components/NextTournamentPanel.vue'
import ThisWeekScreen from '../../src/components/screens/ThisWeekScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, enterEvent, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type Snapshot, type UpcomingEvent } from '../../src/shared/protocol'

function careerAndEvent(weeks = 12): { snap: Snapshot; event: UpcomingEvent } {
  const world = createWorld('r30-next-tournament', DEFAULT_PROFILE)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  const snap = toSnapshot(world)
  return { snap, event: snap.upcoming[0] }
}

function mountPanel(): ReturnType<typeof mount> {
  const { snap, event } = careerAndEvent()
  useGameStore().snapshot = snap
  // ⚠ ATTACHED, because half of what this file asks is answered by the real cascade
  // (`getComputedStyle` is live in the component project – vitest sets `css: true`), and a detached
  // tree gets none of it.
  return mount(NextTournamentPanel, { props: { event }, attachTo: document.body })
}

/** One component's own file, read the way this directory already reads templates
 *  (`round29-next-tournament.test.ts`'s copy-rule loop): `tests/worldSource.ts` builds its base from
 *  `import.meta.url` at MODULE scope, and under the component project that module's URL is not a
 *  file: one, so `componentFile()` throws here. The regions below are cut with `helpers/source`,
 *  which throws on an absent marker – never a raw slice.
 *  ⚠ THE PATH IS A PLAIN VARIABLE AND NOT AN INLINE TEMPLATE LITERAL. Vite rewrites
 *  `new URL(\`…${x}…\`, import.meta.url)` into its own asset resolver, which under this runner
 *  resolved to the string "undefined" and made the read fail on a path nobody wrote. */
function sfc(rel: string): string {
  return readFileSync(new URL(rel, import.meta.url), 'utf8')
}

/** A career with something ENTERED – the only state Home's "Next tournament" card opens onto. */
function enteredCareer(): Snapshot {
  const world = createWorld('r30-this-week', DEFAULT_PROFILE)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 12; i++) tickWeek(world, rng)
  const target = toSnapshot(world).upcoming.find((e) => e.eligible && !e.entered)
  expect(target, 'the fixture must have something she may enter').toBeTruthy()
  enterEvent(world, target!.id)
  return toSnapshot(world)
}

/** ⚠ ROUND 36 PHASE 2 – THE WIDTH IS GLOBAL, SO IT IS PUT BACK. `setViewport` moves the whole
 *  window, and every other test in this file reads the cascade at whatever it was left at. Captured
 *  once, restored after each test, so a width-explicit measurement cannot leak into a neighbour. */
const BOOT_VIEWPORT: Viewport = { width: window.innerWidth, height: window.innerHeight }

beforeEach(() => {
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})

afterEach(() => {
  setViewport(BOOT_VIEWPORT)
})

/** ⚠ ROUND 36 PHASE 2 – THE ORDER IS THE POINT: SET THE WIDTH, THEN MOUNT, THEN READ.
 *
 *  happy-dom evaluates a media query on an element's FIRST computed-style read and caches the
 *  answer; a `setViewport` afterwards does not move it, and a fresh element does re-evaluate
 *  (measured 04.09, and written down beside `TABLET` in fits.ts). A helper rather than three loose
 *  lines per test, because getting that order wrong reads the previous screen's answer and looks
 *  exactly like a rule that is not there. */
function ratioOfHero(vp: Viewport): string {
  setViewport(vp)
  const w = mountPanel()
  const ratio = getComputedStyle(w.find('.nt-hero').element).aspectRatio.replace(/\s+/g, '')
  w.unmount()
  return ratio
}

describe('round 30 #6 – the picture is square, and it is not a card', () => {
  it('⭐ SQUARE, «по примеру главной» – the same declaration Home\'s hero carries', () => {
    // ⚠ READ THROUGH THE REAL CASCADE, not off the source text. A source pin would go green on a
    // rule that never reaches the element (a scoped selector that stopped matching, a rule shadowed
    // by a later one); this is what the browser would compute.
    //
    // ⚠⚠ AND AT A STATED WIDTH SINCE ROUND 36 PHASE 2, WHICH IS A FIX TO THIS TEST AND NOT A
    // LOOSENING OF IT. #6's claim is about a PHONE, and until this round it was being measured at
    // happy-dom's default 1024 – a width the app had no rule for, so the answer happened to be the
    // same. It is not any more: `--hero-aspect` (src/style.css) ladders past 768, so the width the
    // measurement is taken at is now part of what is being claimed. Read at 375, said out loud.
    expect(ratioOfHero(PHONE), 'the tournament picture is square on a phone').toBe('1/1')
  })

  // ⭐⭐ ROUND 36 PHASE 2 – AND THE OTHER HALF OF «ПО ПРИМЕРУ ГЛАВНОЙ», WHICH IS NEW HERE.
  // The owner on frame AF: the tournament image takes the same proportion as the home hero. #6's
  // «по примеру главной» has been true since this panel shipped, but only because two files
  // independently spelled `1 / 1`. This holds the JOIN instead of the number: both heroes read
  // `--hero-aspect`, so they are the same shape at every width by construction rather than by two
  // people remembering.
  // MUTATION-VERIFIED: putting a literal `1 / 1` back on `.nt-hero` reddens the tablet arm; putting
  // one on `.diary-hero` reddens the equality.
  it('⭐ …and it follows Home onto the tablet, because they read ONE token', () => {
    // THE PANEL, through the cascade: whatever the ladder says at 768 is what this hero computes.
    setViewport(TABLET)
    const token = getComputedStyle(document.documentElement)
      .getPropertyValue('--hero-aspect')
      .replace(/\s+/g, '')
    expect(token, 'the ladder gives the tablet band its own hero shape').toBe('768/400')
    expect(ratioOfHero(TABLET), 'and the tournament picture IS that shape').toBe(token)
    // ⚠ HOME'S HALF IS A SOURCE CLAIM AND SAYS SO. `.diary-hero`'s rule is SCOPED to HomeScreen.vue,
    // so a bare div wearing the class matches nothing and mounting the screen for one declaration is
    // a whole career's worth of fixture. What has to be true is that Home spells the same token –
    // and `region` throws if the marker ever rots, which a raw `indexOf` would not (CLAUDE.md).
    const homeHero = region(sfc('../../src/components/screens/HomeScreen.vue'), '.diary-hero {', '}')
    expect(homeHero, 'Home reads the same token, so the two shapes cannot drift').toContain(
      'aspect-ratio: var(--hero-aspect)',
    )
  })

  // ⭐⭐⭐ ROUND 36 PHASE 3 – AND ONTO THE DESKTOP, WHERE «THE SAME PROPORTION» NEEDED A SECOND
  // TOKEN TO STAY TRUE. The owner, on frame AG: the tournament image takes the same proportion as
  // the home hero. At 768 that was one number and one ladder; at 1024 Home's photograph became a
  // COLUMN of a two-column page while this one is still a block in a full-width one, so the ratio
  // alone would have drawn a 511px picture there and a 980px one here – the same shape at twice the
  // size, which is not what anyone looking at the two screens would call the same proportion.
  // `--hero-max` caps both, so the join is now shape AND size.
  // MUTATION-VERIFIED: dropping `max-width: var(--hero-max)` from `.nt-hero` reddens the cap arm;
  // putting a literal ratio back on either hero reddens the token arm; removing the 1024 rung from
  // `--hero-aspect` reddens the shape arm.
  it('⭐⭐ …and onto the desktop, where the join is the SIZE as well as the shape', () => {
    setViewport(DESKTOP)
    const token = getComputedStyle(document.documentElement)
      .getPropertyValue('--hero-aspect')
      .replace(/\s+/g, '')
    expect(token, 'the ladder gives the desktop band its own hero shape').toBe('450/400')
    expect(ratioOfHero(DESKTOP), 'and the tournament picture IS that shape').toBe(token)

    setViewport(DESKTOP)
    const cap = getComputedStyle(document.documentElement).getPropertyValue('--hero-max').trim()
    expect(cap, 'and the desktop declares one width for both heroes').toBe('512px')
    const w = mountPanel()
    const hero = getComputedStyle(w.find('.nt-hero').element)
    expect(hero.maxWidth, 'the tournament picture reads that cap').toBe(cap)
    // ⚠ AND THE BLEED GOES WITH THE CAP. A capped picture that still cancels the gutter is a box
    // hanging 16px off the left of its own column – 8px from the rail at 1280.
    expect(hero.marginLeft, 'no full bleed once the picture is capped').toBe('0px')
    expect(hero.marginRight, 'and none on the right either').toBe('0px')
    w.unmount()

    // Home's half is a source claim for the reason the tablet arm above gives: `.diary-hero`'s rule
    // is scoped to HomeScreen.vue, and `region` throws if either marker ever rots.
    const homeDesktop = region(
      sfc('../../src/components/screens/HomeScreen.vue'),
      '@media (min-width: 1024px) {',
      '.diary-strip {',
    )
    expect(homeDesktop, 'Home caps its hero at the same token').toContain('max-width: var(--hero-max)')
  })

  it('⭐ NO FRAME – the hero stopped being a <Card>, so its hairline went with it', () => {
    const w = mountPanel()
    // `Card.vue` stamps `tb-card` on its root and that is where the border lives. The hero must not
    // carry it – and the rounds plate below MUST, which is the half that makes this a real claim
    // rather than "no cards anywhere".
    expect(w.find('.nt-hero').classes(), 'the picture wears no card').not.toContain('tb-card')
    expect(w.find('.nt-first').classes(), 'the rounds are still a plate').toContain('tb-card')
    w.unmount()
  })
})

describe('round 30 #6 – what is ON the picture, and what is under it', () => {
  it('⭐ the description, `The read` and its ring are all inside the picture', () => {
    const w = mountPanel()
    const hero = w.find('.nt-hero')
    expect(hero.find('.nt-hero-title').exists(), 'the tournament name is on the art').toBe(true)
    expect(hero.find('.nt-hero-meta').exists(), 'the court and the dates are on the art').toBe(true)
    expect(hero.find('.nt-read').exists(), '«The read можно как раз на картинке»').toBe(true)
    expect(hero.find('.nt-read-label').text()).toBe('The read')
    expect(hero.find('.nt-ring').exists(), 'the forecast ring came with it').toBe(true)
    w.unmount()
  })

  it('⭐ the weather and the trip are on the picture too, all three readings', () => {
    const w = mountPanel()
    const rows = w.findAll('.nt-hero .nt-money-row')
    expect(rows.length, 'entry fee, travel budget and the conditions').toBe(3)
    // ⚠ THE LABELS ARE UNCHANGED AND THAT IS ASSERTED HERE ON PURPOSE (invariant 4). He asked for
    // the block to MOVE; a re-lay that quietly re-words it on the way is the defect this round's
    // item 4 was about.
    expect(rows.map((r) => r.find('.hint').text())).toEqual(['Entry fee', 'Travel budget', 'Conditions'])
    // The weather plate wears its on-art face, which is the component's own answer to a photograph.
    expect(w.find('.nt-hero .tb-weather').classes()).toContain('on-art')
    // ...and nothing of the three is left below the picture.
    expect(w.findAll('.nt-money-row').length, 'the block moved rather than being copied').toBe(3)
    w.unmount()
  })

  it('⭐ the four icons sit DIRECTLY under the picture, in a row, on nothing', () => {
    const w = mountPanel()
    const kids = Array.from(w.find('.next-tourn').element.children)
    // The panel is three objects now, in his order: the picture, the icon row, the rounds plate.
    // ⚠ Named by the class each block OWNS rather than by `className[0]` – `Card.vue` puts its own
    // two classes in front of the caller's, so reading the first token would pin the ui kit's
    // internal order instead of this panel's layout.
    expect(kids.length, 'three objects, no fourth').toBe(3)
    expect(kids.map((el) => ['nt-hero', 'nt-facts', 'nt-first'].find((c) => el.classList.contains(c)))).toEqual([
      'nt-hero',
      'nt-facts',
      'nt-first',
    ])
    expect(w.findAll('.nt-fact').length).toBe(4)
    // «без плашки» – the row is not inside a card, and it is not one either.
    expect(w.find('.nt-facts').classes()).not.toContain('tb-card')
    expect(w.find('.nt-facts').element.closest('.tb-card'), 'nothing is behind the icons').toBeNull()
    w.unmount()
  })

  it('⭐ the rounds are the ONE plate, and they are full width', () => {
    const w = mountPanel()
    const plates = w.findAll('.tb-card')
    expect(plates.length, 'exactly one plate on the panel').toBe(1)
    expect(plates[0].classes()).toContain('nt-first')
    // Full width inside the app's gutter: the plate declares no width of its own, so it fills the
    // column. A width or a max-width here would be the "with padding at the edges" clause broken.
    const box = getComputedStyle(plates[0].element)
    expect(box.width, 'the rounds plate is not narrowed').toBe('')
    expect(box.maxWidth === '' || box.maxWidth === 'none').toBe(true)
    w.unmount()
  })
})

describe('round 30 #18 – the picture goes to the edge, and only the picture does', () => {
  it('⭐ FULL-BLEED: the shell gutter, cancelled by the token that sets it', () => {
    // ⚠⚠ AT A STATED WIDTH SINCE ROUND 36 PHASE 3, and this is a fix to the test rather than a
    // loosening of it – the same move phase 2 made twice in this file. This arm took no viewport of
    // its own, so it measured at whatever the file had last set (or at happy-dom's default 1024),
    // which was a width the app had no rule for. It has one now: past 1024 the picture is CAPPED
    // (see the desktop arm below) and a capped box that still bleeds 16px to the left hangs off the
    // side of its own column. «В край, как hero на главной» is a claim about a phone, and the width
    // it is measured at is part of it.
    setViewport(PHONE)
    const w = mountPanel()
    const hero = getComputedStyle(w.find('.nt-hero').element)
    // ⚠ THE TOKEN IS READ OFF `:root`, NEVER TYPED HERE AS A NUMBER. `--app-pad-x` is what `#app`
    // pads every tabbed screen by, and src/style.css says in its own comment why it had to become a
    // token: the shell's insets were spelled in the sheet and GUESSED as `-16px` over in
    // `.diary-hero`, and the guess left an 8px band of page colour above Home's photograph. A pin
    // that hard-codes 16px here is green on exactly that class of bug.
    const padX = getComputedStyle(document.documentElement).getPropertyValue('--app-pad-x').trim()
    expect(padX, 'the app still declares its gutter as a token').toBe('16px')
    expect(hero.marginLeft, 'the picture cancels the gutter on the left').toBe(`calc(-1 * ${padX})`)
    expect(hero.marginRight, 'the picture cancels the gutter on the right').toBe(`calc(-1 * ${padX})`)
    // ⚠ THE SIDES ONLY, and that is the one place this differs from Home. `.diary-hero` and
    // `.kid-hero` also eat `--app-pad-top`, because each is the first thing on its screen; this one
    // has a heading and the week's status line above it, and eating the top inset would pull the
    // photograph up into them.
    expect(hero.marginTop, 'the top inset stays – there is a heading above this hero').toBe('0px')
    w.unmount()
  })

  it("⭐ ...and it is HOME'S mechanism, not a second one that happens to look like it", () => {
    // «в край, как hero картинка на главной» – so the claim is not "it reaches the edge" but "it
    // reaches it the way Home does". Both rules are read and compared: if Home ever changes how it
    // breaks the gutter, this goes red and names the divergence, which is what comparing buys over
    // copying.
    const home = region(sfc('../../src/components/screens/HomeScreen.vue'), '.diary-hero {', '}')
    const here = region(sfc('../../src/components/NextTournamentPanel.vue'), '.nt-hero {', '}')
    expect(home, "Home's hero cancels the shell gutter by the token").toContain('calc(-1 * var(--app-pad-x))')
    expect(here, 'and this one cancels the same token, not a literal').toContain('calc(-1 * var(--app-pad-x))')
    // ⚠ NOT A VACUOUS PAIR OF READS: Home's rule also carries the clamp this one deliberately does
    // not (see the floor test below), so an empty or mis-cut region cannot pass this quietly.
    expect(home, "Home's own hero clamps its height").toContain('max-height')
  })

  it('⭐ the plate below sits on its own backing, as on Home – and keeps the gutter', () => {
    const w = mountPanel()
    const plate = w.find('.nt-first')
    expect(plate.classes(), 'the rounds are a card').toContain('tb-card')
    // ⚠ READ THROUGH THE REAL CASCADE. The class name proves the markup; the paint proves the
    // backing actually reaches the element, which is the half a class-name pin cannot answer.
    const paint = getComputedStyle(plate.element)
    expect(paint.backgroundImage, 'the plate is painted').toContain('linear-gradient')
    expect(paint.borderWidth, 'and it carries the hairline that cuts it out of the page').toBe('1px')
    // ...and it does NOT break the gutter. The photograph is the only object on this screen that does.
    expect(paint.marginLeft === '' || parseFloat(paint.marginLeft) === 0, 'the plate stays inset').toBe(true)
    w.unmount()
  })

  it('⚠ ...EXCEPT the four facts, which have no plate and must not grow one', () => {
    const w = mountPanel()
    const facts = w.find('.nt-facts')
    const paint = getComputedStyle(facts.element)
    // «кроме этих 4х характеристик турнира про призовые, зрителей и т.п.» – his exception, and it is
    // the clause a later reading of «плашки на своих подложках» would most easily tidy away.
    expect(paint.backgroundImage === '' || paint.backgroundImage === 'none', 'no fill behind the icons').toBe(true)
    expect(
      paint.backgroundColor === '' || paint.backgroundColor === 'initial' || paint.backgroundColor === 'transparent',
      'and no tone either',
    ).toBe(true)
    expect(paint.borderWidth === '' || paint.borderWidth === '0px', 'and no hairline').toBe(true)
    expect(facts.element.closest('.tb-card'), 'nothing is behind the icons').toBeNull()
    // One plate on the panel, still: the rounds. The facts row did not become a second one.
    expect(w.findAll('.tb-card').length, 'exactly one plate on the panel').toBe(1)
    w.unmount()
  })

  it('⚠ the square is still a FLOOR – no ceiling came across with the full bleed', () => {
    // #6's own decision, and the full width makes it matter more rather than less: on a 375px phone
    // the box is now 375px tall rather than 343, and a three-line read with a coach's caution must
    // push it TALLER still rather than lose a sentence off the bottom.
    // ⚠ HOME'S HERO CLAMPS AT `max-height: 60vh` because a painting may be cropped without loss.
    // Copying that rule across with the margin is the mutation this test exists to redden on.
    // ⚠ AT THE PHONE, STATED – see the note on #6's square above. The ceiling claim holds at every
    // width; the SHAPE claim is a phone's, and since round 36 phase 2 the width has to be named.
    setViewport(PHONE)
    const w = mountPanel()
    const hero = getComputedStyle(w.find('.nt-hero').element)
    expect(hero.maxHeight === '' || hero.maxHeight === 'none', 'no ceiling on the picture').toBe(true)
    expect(hero.height === '' || hero.height === 'auto', 'and no fixed height either').toBe(true)
    expect(hero.aspectRatio.replace(/\s+/g, ''), 'square, as a floor').toBe('1/1')
    w.unmount()
    // ⭐ AND THE FLOOR IS STILL A FLOOR ON A TABLET, which is what a wider hero puts at risk: a
    // shorter box has less room before the read pushes it down, and the whole of #6's ruling is that
    // it PUSHES rather than clips. No ceiling, no fixed height, at 768 either.
    setViewport(TABLET)
    const t = mountPanel()
    const wide = getComputedStyle(t.find('.nt-hero').element)
    expect(wide.maxHeight === '' || wide.maxHeight === 'none', 'no ceiling at 768 either').toBe(true)
    expect(wide.height === '' || wide.height === 'auto', 'and no fixed height at 768').toBe(true)
    t.unmount()
  })
})

describe('round 30 #6 – the screen around it', () => {
  // ⚠⚠ RE-AIMED BY ROUND 32 #2, NOT LOOSENED - the same move `round29-next-tournament.test.ts`'s
  // screen arm made, for the same reason. This arm's subject is «while the panel is there», so it
  // mounts the arrival where it IS there: Home's plate, which names itself (round 31 #1's `entry`).
  // Round 32 #2 took the panel off the results view and nothing about the frame rule moved with it.
  it('⭐ the hosting section loses its frame while the panel is there', () => {
    useGameStore().snapshot = enteredCareer()
    const w = mount(ThisWeekScreen, { props: { entry: 'tournament' }, attachTo: document.body })
    const section = w.find('.next-tourn').element.closest('section')!
    expect(section.classList.contains('bare'), '«убрать рамку»').toBe(true)
    // ⚠ AND THE FRAME IS REALLY OFF, read through the cascade rather than off the class name –
    // `section.bare` is src/style.css's rule and this is what the browser would paint.
    const paint = getComputedStyle(section)
    expect(paint.border === '' || paint.border.includes('none') || paint.borderWidth === '0px').toBe(true)
    w.unmount()
  })

  it('⚠ ...and a week with nothing entered keeps the frame it had – not asked is not permission', () => {
    const world = createWorld('r30-this-week-empty', DEFAULT_PROFILE)
    useGameStore().snapshot = toSnapshot(world)
    const w = mount(ThisWeekScreen, { attachTo: document.body })
    expect(w.find('.next-tourn').exists()).toBe(false)
    const sections = w.findAll('section')
    expect(sections[0].classes(), 'the training-week state is untouched').not.toContain('bare')
    w.unmount()
  })

  it('⭐ «план тренировок внизу остаётся как есть» – the plan section keeps its frame and its parts', () => {
    useGameStore().snapshot = enteredCareer()
    const w = mount(ThisWeekScreen, { attachTo: document.body })
    const sections = w.findAll('section')
    const plan = sections.find((s) => s.text().includes('Training plan'))!
    expect(plan, 'the plan section is still there').toBeTruthy()
    expect(plan.classes(), 'and it is still framed').not.toContain('bare')
    expect(plan.findAll('.option-pill').length, 'its presets are untouched').toBeGreaterThan(0)
    expect(plan.find('.this-week-plan').exists()).toBe(true)
    expect(plan.find('.spend-row').exists()).toBe(true)
    w.unmount()
  })
})
