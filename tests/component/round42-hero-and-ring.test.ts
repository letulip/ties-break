// =================================================================================================
// ⭐⭐⭐ ROUND 42 #2 + #29 – THE PAINTING GOES BACK TO HER TENNIS, AND HER MOOD MOVES TO A RING
// =================================================================================================
//
// The owner, 14.09, after playing the deployed wave-5 build: «не надо менять картинку на главной по
// любому поводу … Делаем разноцветную светящуюся обводку вокруг аватарки, для каждого настроения
// свой цвет, а картинки вернутся к изначальной логике только про победы и поражения» – and, his
// second pass the same day, «это ок» on keeping the injury `rehab` painting on the hero. His
// sentences are quoted here rather than in a template: tests/round13-nav.test.ts bans Cyrillic
// inside one.
//
// ⚠⚠ ROUND 42 #2 IS THE RECEIPT AND IT IS §1 BELOW, NOT A SEPARATE FIX. He met a girl holding a
// winner's cup on her fourteenth birthday having won nothing, and asked whether the guessed gift had
// reached the picture. It had: gift -> bond -> spirit -> a bright Mood band -> `MOOD_FACE.bright`
// is `happy` -> and `fem-euro-brunnet-young-happy.webp` is a painting of a girl with a trophy. §1
// rebuilds that exact week out of the real engine and asserts the neutral portrait instead.
//
// ⚠ WHAT THIS ROUND DELIBERATELY DOES **NOT** TOUCH, and §4 is the pin that says so. `emotion` on the
// snapshot still carries whichever channel spoke, because `DiaryFacts.moodWord` is licensed on it
// and on nothing else: narrowing THAT would have nulled the Mood word on every week of every career
// and handed both tiles back to their fallback maps for ever – a wording change nobody asked for
// (CLAUDE.md invariant 4), and «always the same» on a her-facing surface, which is the defect class
// the owner named in this very round (#6). So the HERO gets a second, narrower answer
// (`heroEmotion`) off the same one decision, and the tiles are untouched.
//
// ⚠⚠ THE ARM LEDGER – every mutation below was really applied, really run, and really reverted by
// hand (never `git checkout`), with the file's md5 asserted back to pristine before the next arm.
// The counts are MEASURED, and where the prediction was wrong the MEASUREMENT is what is written.
//
//   CONTROL, run first and green: this file 19 · wave1-mood-word 7 · wave3-graduated-portrait 10
//   = 36/36. Every arm below was run against that same set of three files.
//
//   ARM 1  `heroFaceOf` returns `read.emotion` unconditionally – i.e. the hero is the face again,
//          which is exactly the code that shipped the round-42 #2 defect.
//          **4 RED, where 9 were predicted.** §1's birthday case, §1's Kid-screen case, §2's
//          drained-body case and §3's sweep. The prediction over-counted because several cases
//          assert the PAIR (`emotion` unchanged, `heroEmotion` narrowed) on weeks where the two
//          legitimately agree – a win, a steady mood – and those stay green under this arm, which
//          is correct rather than weak: the arm only moves the weeks the round is about.
//          ⭐⭐ AND `wave1-mood-word` STAYED GREEN THROUGH IT, which is the split's whole point
//          measured: the Mood tiles' words do not depend on the hero's picture in either direction.
//
//   ARM 2  `heroFaceOf`'s injury arm deleted (`channel === 'injury'` falls through to `'norm'`) –
//          the plausible over-correction of «results only», and the one his «это ок» forbids.
//          **2 RED, as predicted**: §2's rehab case and §3's sweep.
//
//   ARM 3  `moodRing` drops its `steady` guard (`return band`), so the neutral rung draws a ring.
//          **2 RED, where 3 were predicted**: §5's four-rungs case and §5's unringed-week case.
//          §6's contrast sweep stayed green – it walks `SPIRIT_BANDS` and skips `steady` by name,
//          so it cannot see a ring appearing there. Recorded rather than fixed: the two cases that
//          DO go red are the ones that make the claim, and widening the sweep to cover it would be
//          a third assertion of the same fact.
//
//   ARM 4  the `@media (prefers-reduced-motion: reduce)` block on `.diary-avatar-btn.has-mood-ring`
//          deleted. **1 RED, as predicted**: §7's stand-down case. §7's control case stayed green,
//          which is what proves the harness is not answering `none` to everything.
//
//   ARM 5  `--mood-ring-halo` moved back to the chrome halo's own `rgba(6, 10, 14, 0.55)`.
//          **2 RED, where 1 was predicted**: §6's contrast sweep (naming the band and the ratio it
//          fell to – gold reaches only 2.50:1 against a white court behind a 55% halo) and §7's
//          stand-down case, which reads the halo's own value back off the computed shadow.
//
// The measured counts are transcribed in the round-42 ledger and in the handoff.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import RailIdentity from '../../src/components/RailIdentity.vue'
import KidScreen from '../../src/components/screens/KidScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  createWorld,
  tickWeek,
  toSnapshot,
  closeTournament,
  skipTournament,
  decideKnock,
  pendingKnock,
  pendingBirthday,
  birthdayOfferFor,
  chooseGift,
} from '../../src/engine/world'
import { SPIRIT_BANDS, spiritBandOf, type SpiritBand } from '../../src/engine/spirit'
import { MOOD_FACE, heroFaceOf } from '../../src/shared/avatarEmotion'
import { ECONOMY } from '../../src/engine/economy'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import type { WorldState } from '../../src/engine/world'
import { PHONE, TABLET, DESKTOP, setViewport, type Viewport } from './fits'
import { contrastRatio, parseColor } from './contrast'

/** ⭐ HER FOURTEENTH BIRTHDAY, WALKED TO RATHER THAN POSED – the week round 42 #2 is about. Every
 *  tournament is skipped, so the career reaches it with ZERO recorded matches, which is the half of
 *  his report the save confirmed («zero result rows before that week»). The gift is CHOSEN, because
 *  the guessed gift is the mechanism he asked about: it lifts bond, bond lifts spirit, and spirit is
 *  what used to reach the painting. */
function birthdayWorld(seed = 'r42-birthday'): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 6 })
  const rng = rngFromSeed(world.seed)
  while (world.week < 80) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    const age = pendingBirthday(world)
    if (age !== null) {
      // ⚠ ROUND 42 #26 – THE ENGINE'S OWN SEAM, NOT A REBUILT OFFER. `birthdayOffer(world.seed, age)` is a
      // SECOND derivation of the four rows and it diverges the moment a given durable leaves the card, so
      // `chooseGift` refuses the answer – the R2-18 failure `tests/round23-kid-life.test.ts` wrote down.
      chooseGift(world, birthdayOfferFor(world, age).options[0].id)
      if (toSnapshot(world).diary.facts.birthdayAge !== null) return world
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  throw new Error('no birthday week inside 80 weeks – the fixture cannot describe round 42 #2')
}

/** An ORDINARY week of a real career, every tournament skipped – the harness
 *  tests/component/wave1-mood-word.test.ts opens with, for the same reason: nothing is on her face
 *  but her body and her life. */
function careerAt(week: number, seed = 'r42-ring'): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 6 })
  const rng = rngFromSeed(world.seed)
  while (world.week < week) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    const age = pendingBirthday(world)
    if (age !== null) chooseGift(world, birthdayOfferFor(world, age).options[0].id)
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

/** ⚠ THE SNAPSHOT IS THE ENGINE'S OWN – the two numbers are posed on the world and `toSnapshot`
 *  answers, so the face, the word, the band and the hero's picture are all `assembleDiaryFacts`'s
 *  and none of them is this file's arithmetic. */
function posed(world: WorldState, spirit: number, condition = 90, injured = false): Snapshot {
  world.spirit = spirit
  world.condition = condition
  world.injury = injured
    ? { kind: 'ankle soreness', severity: 'moderate', weeksRemaining: 3, totalWeeks: 5, sinceWeek: world.week - 2 }
    : null
  return toSnapshot(world)
}

const SPIRIT_AT: Record<SpiritBand, number> = {
  glowing: ECONOMY.spirit.mood.glowingFrom + 2,
  bright: ECONOMY.spirit.mood.brightFrom + 1,
  steady: ECONOMY.spirit.baseline,
  dimmed: ECONOMY.spirit.mood.dimmedBelow - 1,
  heavy: ECONOMY.spirit.mood.heavyBelow - 5,
}

function home(snap: Snapshot, attach = false) {
  useGameStore().snapshot = snap
  return mount(HomeScreen, {
    props: { recapFresh: false },
    global: { stubs: { teleport: true } },
    ...(attach ? { attachTo: document.body } : {}),
  })
}

function rail(snap: Snapshot, attach = false) {
  useGameStore().snapshot = snap
  return mount(RailIdentity, {
    global: { stubs: { teleport: true } },
    ...(attach ? { attachTo: document.body } : {}),
  })
}

function kid(snap: Snapshot) {
  useGameStore().snapshot = snap
  return mount(KidScreen, { global: { stubs: { teleport: true } } })
}

/** The painting the HERO is actually rendering, as the filename's own face word. */
function heroFace(src: string | undefined): string {
  const m = /fem-euro-brunnet-[a-zA-Z]+-([a-zA-Z]+)\.webp$/.exec(src ?? '')
  expect(m, `the hero is not rendering a band portrait at all: ${src}`).toBeTruthy()
  return m![1]
}

interface DeviceWindow {
  happyDOM: { settings: { device: { prefersReducedMotion: string } } }
}

/** ⚠ SET IT BEFORE ANYTHING IS MOUNTED OR READ – a media query is evaluated on an element's first
 *  computed-style read and then cached (tests/component/round36-reduced-motion.test.ts's header
 *  records the measurement). */
function setReducedMotion(on: boolean): void {
  const w = window as unknown as DeviceWindow
  if (!w.happyDOM?.settings?.device) {
    throw new Error('happy-dom exposes no device settings – this measurement cannot be trusted')
  }
  w.happyDOM.settings.device.prefersReducedMotion = on ? 'reduce' : 'no-preference'
}

describe('⭐⭐ round 42 #2 / #29(a) – the hero is about her tennis again', () => {
  beforeEach(() => setActivePinia(createPinia()))

  // ===============================================================================================
  // §1 – HIS OWN WEEK, REBUILT
  // ===============================================================================================
  it('⭐⭐ #2: a bright birthday week with ZERO results renders the NEUTRAL portrait', () => {
    const world = birthdayWorld()
    const snap = posed(world, SPIRIT_AT.glowing)

    // The arm has to BE his week, and each half is asserted rather than assumed.
    expect(snap.diary.facts.birthdayAge, 'this is a birthday week').not.toBeNull()
    expect(snap.events.filter((e) => !!e.match).length, 'she has won and lost nothing at all').toBe(0)
    expect(snap.diary.facts.resultFresh, 'no result is on her face').toBe(false)
    expect(snap.diary.facts.moodWord, 'the mood channel is the one that spoke').toBe('Glowing')

    // ⚠ THE OLD FACE IS STILL THE FACE, and that is the point of the split: `emotion` is `happy`
    // exactly as it was, so the Mood tiles say what they said. What moved is the PICTURE.
    expect(snap.diary.facts.emotion, 'the face decision is untouched by this round').toBe('happy')
    expect(snap.diary.facts.heroEmotion, 'the hero, on a week she won nothing').toBe('norm')

    const w = home(snap)
    expect(heroFace(w.find('.diary-hero-img').attributes('src'))).toBe('norm')
    w.unmount()
  })

  it('⭐ ...and the RING is what carries the joy on that same week', () => {
    const snap = posed(birthdayWorld(), SPIRIT_AT.glowing)
    const w = home(snap)
    const cls = w.find('.diary-avatar-btn').attributes('class') ?? ''
    expect(cls, 'the ring is up').toContain('has-mood-ring')
    expect(cls, 'and it is the glowing rung').toContain('mood-glowing')
    w.unmount()
  })

  it('⚠ the Kid screen\'s big portrait is the SAME picture – the two never disagree', () => {
    const snap = posed(birthdayWorld(), SPIRIT_AT.glowing)
    const onHome = home(snap)
    const onKid = kid(snap)
    expect(heroFace(onKid.find('.kid-hero-img').attributes('src')), 'the Kid screen\'s 512px portrait').toBe('norm')
    expect(heroFace(onHome.find('.diary-hero-img').attributes('src')), 'Home\'s hero').toBe('norm')
    onHome.unmount()
    onKid.unmount()
  })

  // ===============================================================================================
  // §2 – WHAT MAY STILL REACH THE PAINTING, AND WHAT MAY NOT
  // ===============================================================================================
  it('⭐ A WIN still takes the hero, whatever her mood is doing', () => {
    // The result layer is untouched by this round (R8-6a: «won -> happy; nothing here can override
    // it»). Posed at the facts level because reaching a real title inside happy-dom is the engine
    // suite's job, not this one's – what is under test here is the PICTURE the facts produce.
    const base = posed(careerAt(30), SPIRIT_AT.heavy)
    const won: Snapshot = {
      ...base,
      diary: {
        ...base.diary,
        facts: { ...base.diary.facts, resultFresh: true, won: true, emotion: 'happy', heroEmotion: 'happy' },
      },
    }
    const w = home(won)
    expect(heroFace(w.find('.diary-hero-img').attributes('src'))).toBe('happy')
    w.unmount()
  })

  it('⭐ REHAB STAYS ON THE HERO – an injury is a fact of the body, not a mood («это ок»)', () => {
    const snap = posed(careerAt(30), SPIRIT_AT.glowing, 90, true)
    expect(snap.diary.facts.emotion, 'injury outranks every channel, as it always did').toBe('rehab')
    expect(snap.diary.facts.heroEmotion, 'and the hero keeps it, by his own ruling').toBe('rehab')
    const w = home(snap)
    expect(heroFace(w.find('.diary-hero-img').attributes('src'))).toBe('rehab')
    w.unmount()
  })

  it('⚠ a DRAINED BODY no longer reaches the painting – and the Mood tile still says Tired', () => {
    // The body channel is the quieter half of the same complaint: a condition of 39 putting a tired
    // face on a girl who won her first title last month is «меняем картинку по любому поводу» one
    // rung down. The word is NOT what moved – the tile keeps printing its own.
    const snap = posed(careerAt(30), SPIRIT_AT.steady, 20)
    expect(snap.diary.facts.emotion, 'the face is still the body\'s').toBe('tired')
    expect(snap.diary.facts.heroEmotion, 'the painting is not').toBe('norm')
    const w = home(snap)
    expect(heroFace(w.find('.diary-hero-img').attributes('src'))).toBe('norm')
    w.unmount()
    const onKid = kid(snap)
    const mood = onKid.findAll('.kid-tile').find((t) => t.find('.kid-tile-label').text() === 'Mood')
    expect(mood!.find('.kid-tile-lead').text(), 'the Mood tile\'s own word is untouched').toBe('Tired')
    onKid.unmount()
  })

  // ===============================================================================================
  // §3 – THE RULE ITSELF, SWEPT
  // ===============================================================================================
  it('⚠⚠ THE PAINTING IS ONE OF EXACTLY THREE THINGS, across the whole ladder × body', () => {
    // The claim in one sweep: over every mood rung and three bodies, on weeks with no fresh result,
    // the hero is `rehab` when she is hurt and `norm` otherwise – never a mood face, never a fatigue
    // face. `MOOD_FACE` is imported so the negative names the very faces that used to win.
    const world = careerAt(30)
    const moodFaces = new Set(Object.values(MOOD_FACE))
    let sweeps = 0
    for (const band of SPIRIT_BANDS) {
      for (const condition of [90, 50, 20]) {
        for (const injured of [false, true]) {
          const snap = posed(world, SPIRIT_AT[band], condition, injured)
          expect(spiritBandOf(SPIRIT_AT[band]), 'the probe really is on that rung').toBe(band)
          expect(snap.diary.facts.resultFresh, 'the sweep is over idle weeks').toBe(false)
          expect(snap.diary.facts.heroEmotion, `${band} / ${condition} / injured=${injured}`).toBe(
            injured ? 'rehab' : 'norm',
          )
          if (!injured) {
            expect(
              moodFaces.has(snap.diary.facts.heroEmotion) && snap.diary.facts.heroEmotion !== 'norm',
              'a mood face reached the painting',
            ).toBe(false)
          }
          sweeps++
        }
      }
    }
    expect(sweeps, 'the sweep swept nothing').toBe(30)
  })

  it('⚠ and it is ONE decision, not two walks – `heroFaceOf` over the engine\'s own read', () => {
    // The guarantee the diary system is built on: the picture and the word are two answers to one
    // reading. This asserts the identity on a real snapshot rather than trusting the call site.
    const world = careerAt(30)
    for (const band of SPIRIT_BANDS) {
      for (const injured of [false, true]) {
        const f = posed(world, SPIRIT_AT[band], 45, injured).diary.facts
        const channel = injured
          ? ('injury' as const)
          : f.emotion === f.heroEmotion && f.resultFresh
            ? ('result' as const)
            : f.moodWord !== null
              ? ('mood' as const)
              : ('body' as const)
        expect(heroFaceOf({ emotion: f.emotion, channel }), `${band} / injured=${injured}`).toBe(f.heroEmotion)
      }
    }
  })

  // ===============================================================================================
  // §4 – WHAT DID **NOT** MOVE (invariant 4, as a measurement)
  // ===============================================================================================
  it('⚠⚠ NOT ONE WORD ON ANY TILE CHANGED – the five Mood words still arrive exactly as before', () => {
    const world = careerAt(30)
    let carried = 0
    for (const band of SPIRIT_BANDS) {
      const f = posed(world, SPIRIT_AT[band], 90).diary.facts
      if (band === 'steady') {
        expect(f.moodWord, 'the neutral rung never carried a word').toBeNull()
        continue
      }
      // The mood channel wins a fresh body at every non-neutral rung – that is v72's shipped
      // behaviour, and this round did not touch it.
      expect(f.moodWord, `${band} lost its word to this round`).not.toBeNull()
      expect(f.emotion, `${band}'s FACE moved, which the Mood tiles' 36px crop reads`).toBe(MOOD_FACE[band])
      carried++
    }
    expect(carried, 'the mood channel never spoke – this pin proves nothing').toBe(4)
  })

  it('⚠ the avatar button gained NO new sentence – its name is still the shipped one', () => {
    const snap = posed(careerAt(30), SPIRIT_AT.glowing)
    const w = home(snap)
    const btn = w.find('.diary-avatar-btn')
    expect(btn.attributes('aria-label'), 'the door\'s own name').toBe('Open her profile')
    expect(btn.attributes('title'), 'the ring must not have invented a tooltip').toBeUndefined()
    expect(btn.text().trim(), 'and it says nothing at all').toBe('')
    w.unmount()
  })
})

describe('⭐⭐ round 42 #29(b) – the mood ring', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    setReducedMotion(false)
    setViewport(DESKTOP)
  })

  // ===============================================================================================
  // §5 – ONE COLOUR PER RUNG, AND NONE AT THE NEUTRAL ONE
  // ===============================================================================================
  it('⭐ the four rungs each light their own class, and `steady` lights none', () => {
    const world = careerAt(30)
    const seen = new Map<SpiritBand, string>()
    for (const band of SPIRIT_BANDS) {
      const w = home(posed(world, SPIRIT_AT[band], 90))
      const cls = w.find('.diary-avatar-btn').attributes('class') ?? ''
      if (band === 'steady') {
        expect(cls, 'the neutral rung draws the shipped chrome and nothing else').not.toContain('has-mood-ring')
      } else {
        expect(cls, `${band} lost its ring`).toContain('has-mood-ring')
        expect(cls, `${band} lost its own class`).toContain(`mood-${band}`)
        seen.set(band, `mood-${band}`)
      }
      w.unmount()
    }
    expect(seen.size, 'four rungs carry a colour').toBe(4)
    expect(new Set(seen.values()).size, 'and no two of them share a class').toBe(4)
  })

  it('⭐ the RAIL\'s avatar wears the same ring on the same week – one composable, two renders', () => {
    const snap = posed(careerAt(30), SPIRIT_AT.dimmed)
    const onHome = home(snap)
    const onRail = rail(snap)
    const homeCls = onHome.find('.diary-avatar-btn').attributes('class') ?? ''
    const railCls = onRail.find('.diary-avatar-btn').attributes('class') ?? ''
    expect(railCls).toContain('has-mood-ring')
    expect(railCls).toContain('mood-dimmed')
    expect(homeCls).toContain('mood-dimmed')
    onHome.unmount()
    onRail.unmount()
  })

  it('⚠ FOUR DISTINCT COLOURS, resolved through the real cascade – no two rungs paint alike', () => {
    const world = careerAt(30)
    const colours = new Map<string, SpiritBand>()
    for (const band of SPIRIT_BANDS) {
      if (band === 'steady') continue
      const w = home(posed(world, SPIRIT_AT[band], 90), true)
      const ring = w.find('.diary-avatar-btn .diary-avatar').element
      const colour = getComputedStyle(ring).borderTopColor
      expect(colour, `${band}'s ring resolved to nothing – the token is missing`).toBeTruthy()
      expect(colour, `${band}'s ring is still the brand lime`).not.toBe('#cfe152')
      expect(colours.has(colour), `${band} paints the same colour as ${colours.get(colour)}`).toBe(false)
      colours.set(colour, band)
      w.unmount()
    }
    expect(colours.size).toBe(4)
  })

  it('⚠ AND AN UNRINGED WEEK IS THE SHIPPED AVATAR, value for value', () => {
    // The cheapest guarantee in the round: a neutral week cannot regress, because nothing about it
    // is new. Measured rather than asserted in prose.
    const w = home(posed(careerAt(30), SPIRIT_AT.steady, 90), true)
    const ring = w.find('.diary-avatar-btn .diary-avatar').element
    const style = getComputedStyle(ring)
    // ⚠ READ OFF `:root` RATHER THAN TYPED OUT – a hex in this file would be a second copy of the
    // brand lime, which is the drift `--accent-rgb`'s own note in src/style.css records.
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    expect(accent, 'the brand token did not resolve').toBeTruthy()
    expect(style.borderTopColor, 'the lime hairline').toBe(accent)
    expect(style.boxShadow, 'the shipped halo and drop shadow').toContain('rgba(6, 10, 14, 0.55)')
    expect(style.animation, 'and nothing moves').not.toContain('mood-ring-breathe')
    w.unmount()
  })

  // ===============================================================================================
  // §6 – CONTRAST, THROUGH THE REAL CASCADE, AGAINST BOTH GROUNDS THE AVATAR SITS ON
  // ===============================================================================================
  it('⚠⚠ every rung holds against BOTH grounds – the dark rail and the brightest painting', () => {
    // ⚠ WHAT THE RING'S NEIGHBOUR ACTUALLY IS. Home's avatar sits ON a photograph – thirty-five of
    // them, several sunlit – and the rail's sits on `--panel`. The colour is not measured against
    // either of those: `--mood-ring-halo` is painted between, so what the eye compares the ring to
    // is THAT halo composited over whatever is behind it. The two extremes bound every real case,
    // so both are measured: the halo over pure white (the brightest a painting can be) and over
    // `--bg` (the darkest ground in the app).
    //
    // ⚠ 3:1 IS THE BAR AND IT IS WCAG 2.1's OWN FOR A NON-TEXT INDICATOR (1.4.11). The shipped lime
    // ring is measured beside them as the control – it is what the app already considers legible.
    const halo = parseColor(getComputedStyle(document.documentElement).getPropertyValue('--mood-ring-halo').trim())
    expect(halo[3], 'the halo token did not resolve – this measurement would be nonsense').toBeGreaterThan(0.5)
    const over = (bg: [number, number, number]): [number, number, number] => [
      halo[0] * halo[3] + bg[0] * (1 - halo[3]),
      halo[1] * halo[3] + bg[1] * (1 - halo[3]),
      halo[2] * halo[3] + bg[2] * (1 - halo[3]),
    ]
    const overWhite = over([255, 255, 255])
    const overDark = over(parseColor('#0a0e13').slice(0, 3) as [number, number, number])

    const world = careerAt(30)
    const measured: string[] = []
    for (const band of SPIRIT_BANDS) {
      if (band === 'steady') continue
      const w = home(posed(world, SPIRIT_AT[band], 90), true)
      const colour = parseColor(getComputedStyle(w.find('.diary-avatar').element).borderTopColor)
      const rgb = colour.slice(0, 3) as [number, number, number]
      const bright = contrastRatio(rgb, overWhite)
      const dark = contrastRatio(rgb, overDark)
      measured.push(`${band} ${bright.toFixed(2)} / ${dark.toFixed(2)}`)
      expect(bright, `${band} on the brightest painting: ${bright.toFixed(2)}:1`).toBeGreaterThanOrEqual(3)
      expect(dark, `${band} on the darkest panel: ${dark.toFixed(2)}:1`).toBeGreaterThanOrEqual(3)
      w.unmount()
    }
    expect(measured.length, `measured nothing: ${measured.join(' · ')}`).toBe(4)
  })

  // ===============================================================================================
  // §7 – REDUCED MOTION: IT STANDS DOWN, AND IT STAYS FINDABLE
  // ===============================================================================================
  it('with no preference the ring breathes – «светящуюся», as he asked', () => {
    setReducedMotion(false)
    const w = home(posed(careerAt(30), SPIRIT_AT.glowing), true)
    const style = getComputedStyle(w.find('.diary-avatar').element)
    expect(style.animation, 'the glow lost its pulse for everybody').toContain('mood-ring-breathe')
    w.unmount()
  })

  it('⚠⚠ ...and under `prefers-reduced-motion: reduce` it stops moving WITHOUT going out', () => {
    setReducedMotion(true)
    const w = home(posed(careerAt(30), SPIRIT_AT.glowing), true)
    const style = getComputedStyle(w.find('.diary-avatar').element)
    expect(style.animation, 'the one animation this round adds is still running').not.toContain(
      'mood-ring-breathe',
    )
    expect(style.animation, 'switched off rather than left to a shorthand nobody set').toContain('none')
    // Less motion is not less information – the band's colour, its halo and a static bloom stay.
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    expect(style.borderTopColor, 'the ring fell back to the neutral chrome').not.toBe(accent)
    expect(style.boxShadow, 'the glow went with the animation').toContain('rgba(245, 185, 66')
    expect(style.boxShadow, 'and so did the halo that makes it legible').toContain('rgba(6, 10, 14, 0.9)')
    w.unmount()
  })

  it('⚠ THE CONTROL – the harness is not answering `none` to every animation it is asked about', () => {
    // Without this the case above passes on a happy-dom that cannot compute an animation at all, or
    // on a stylesheet that failed to load. `.splash-hint` carries the app's OTHER infinite pulse and
    // is untouched by this round, so it is the honest control at the un-reduced setting.
    setReducedMotion(false)
    const loud = document.createElement('span')
    loud.className = 'splash-hint'
    document.body.appendChild(loud)
    expect(getComputedStyle(loud).animation, 'the cascade is not being read at all').toContain('splash-pulse')
    loud.remove()
  })

  // ===============================================================================================
  // §8 – THE RING AT EVERY WIDTH THE HOUSE MEASURES
  // ===============================================================================================
  it('⚠ 375 / 768 / 900 / 1280 – the ring is on the avatar at every width, and adds no box', () => {
    // The ring is a border colour and a box-shadow: it costs no layout at any width, which is what
    // makes «every host of the avatar» cheap to promise. What a mounted test CAN say at each width
    // is that the element is still there, still ringed, and still 30px (46px on the rail's own
    // override, which is a desktop rule and is measured in its own file).
    const snap = posed(careerAt(30), SPIRIT_AT.bright)
    const widths: [string, Viewport][] = [
      ['375', PHONE],
      ['768', TABLET],
      ['900', { width: 900, height: 1024 }],
      ['1280', DESKTOP],
    ]
    for (const [label, vp] of widths) {
      setViewport(vp)
      const w = home(snap, true)
      const btn = w.find('.diary-avatar-btn')
      expect(btn.exists(), `the avatar is missing at ${label}`).toBe(true)
      expect(btn.attributes('class'), `the ring is missing at ${label}`).toContain('mood-bright')
      const style = getComputedStyle(w.find('.diary-avatar').element)
      expect(style.width, `the ring changed the avatar's box at ${label}`).toBe('30px')
      w.unmount()
    }
  })
})
