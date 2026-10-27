// ONE PHONE OF THE FILM: the shipped `ChildhoodPrologue`, mounted whole, in its own document so its
// media queries see a phone and not the 1080-wide stage that frames it.
//
// ⚠ THE ONLY THING THIS RIG CHANGES IS THE ENTROPY. `ChildhoodPrologue.freshSeed()` is
// `prologue-${Math.random().toString(36).slice(2)}...`, so two mounts are two childhoods and the
// owner asked for ONE girl told twice. `Math.random` is pinned for the life of the document - the
// component's own function still computes the seed - and `__phone.seed()` reads it back off the live
// instance so the recorder can PROVE both halves are the same childhood instead of assuming it. The
// constant is 0.004 and the rule that chose it is below.
//
// ⚠ `zoom` IS ON THE ROOT AND THE IFRAME IS SIZED TO MATCH. The stage sets `--film-zoom`; the
// element is `414 * zoom` wide, so the layout box stays exactly 414 CSS px. Whether the phone media
// queries survive that is MEASURED, not assumed - `__phone.probe()` reports the layout width and
// `matchMedia('(min-width: 768px)')`, and the recorder refuses a take where the desktop arm is live.
import { createApp, nextTick } from 'vue'
import { createPinia } from 'pinia'
import '../../src/style.css'
import ChildhoodPrologue from '../../src/components/ChildhoodPrologue.vue'
// THE HANDOVER READ-OUT'S SOURCES, and every one of them is the shipped path the brief names.
// `createWorld(seed, profile, id, { years, spentCents })` -> `toSnapshot` IS the handover; the rig
// runs it a second time over the LIVE run and the LIVE profile, and then proves the answer is the
// same world by comparing the rebuilt radar against the one the phone is currently drawing.
import { createWorld } from '../../src/engine/world'
import { toSnapshot } from '../../src/engine/world/snapshot'
import { chosenYears, spentCents, enteredAges, yearsSoFar } from '../../src/prologue/run'
import { localOpensAt } from '../../src/prologue/pool'
import { PROLOGUE_CARDS, CARD_AGES } from '../../src/prologue/cards'
import { WEEKS_IN_SEASON } from '../../src/shared/dates'
import { SKILL_KEYS } from '../../src/engine/development'
import { RADAR_AXIS_LABEL } from '../../src/engine/radar'
import { formatCents } from '../../src/shared/money'

const zoom = Number(new URLSearchParams(location.search).get('zoom') || 1)
document.documentElement.style.zoom = String(zoom)

// ⚠⚠ AND IT STAYS PINNED FOR THE WHOLE FILM, WHICH A FIRST CUT GOT WRONG. Restoring `Math.random`
// after the mount fixed the PROLOGUE seed and left the CAREER seed random: `ChildhoodPrologue.begin()`
// calls `game.newCareer('')`, and an empty seed is filled in store-side as
// `${kidName}-${Math.random().toString(36)...}`. So the two halves walked one childhood and then
// handed it to two different girls - different `startingSkills`, different potential - under a
// caption saying «Same hidden potential». Caught on the handover frame: the two coach lines came
// back different where the same band and the same seed must produce the same sentence. Pinned for
// the session, both seeds are the app's own generators at one constant, and the recorder compares
// the two snapshots axis by axis rather than trusting this note.
//
// ⭐⭐ WHY 0.004, AND THE RULE IS PRINTED BY `prologue-sweep.ts` BEFORE IT IS APPLIED. The first cut
// ran at 0.5 and the two handovers came out reading the SAME two coach sentences, because both
// arrivals landed inside one band. That is not a filming problem - `childhoodArrival` adds
// `walk.level + walk.shape` and then CLAMPS into `STARTING_SKILL_BAND`, the same band a fresh
// fourteen-year-old is drawn from, so the spread between the cheapest childhood the table allows and
// the dearest is capped at CHILDHOOD.swingPoints.
//
// ⚠⚠ AND THE SEED CANNOT WIDEN IT. Swept over 999 constants: where no axis clamps the gap is
// EXACTLY 2.5400 points on every single one of them, because `arrival = born + level + shape` and
// the difference between the two paths cancels `born` entirely. Clamping is the only thing a seed
// can do to the gap, and it can only take points away (1.70 at the worst). A `behind -> ahead` split
// needs 4.4 and is arithmetically impossible at any seed, with any legal pair of childhoods.
//
// What the constant DOES decide is WHERE IN THE BAND her born skills sit, and three things on the
// handover are thresholds on that position: the coach's base sentence, his rung, and her play style.
// THE RULE: no clamped axis on either path (so the whole swing reaches the screen), the two arrivals
// on opposite sides of `HANDOVER_BASE_CUTS`, then the MOST of the handover differing - and 4 of the
// 5 comparable facts is the ceiling, reached by 69 of the 999. 0.004 is the lowest of them.
//
// ⚠ THE TIE-BREAK IS PRESENTATION, AND IT IS NOT A TOURNAMENT RESULT. 0.04 scores the same 4, and
// was the pin until the read-out sheet existed; at that constant `startingSkills` draws serve and
// ret EQUAL, so two of the five rows print the same number twice and the column reads as a
// rendering fault. 0.004 draws five distinct values. Tournament outcomes were not read before the
// pick and did not move with it - four entered weekends, four defeats, at both constants.
Math.random = () => 0.004
const app = createApp(ChildhoodPrologue)
app.use(createPinia())
const vm = app.mount('#app') as any

const setup = () => vm?.$?.setupState ?? {}

;(window as any).__phone = {
  zoom,
  /** The stage owns the frame size; the phone owns the layout box. Both move together or the
   *  layout box is no longer 414 CSS px and the card is being filmed at a width it was never
   *  designed against. */
  setZoom: (z: number) => {
    document.documentElement.style.zoom = String(z)
  },
  seed: () => setup().seed ?? null,
  /** The career the nine years were handed to – `createWorld` -> `toSnapshot`, read off the live
   *  store. The film's central claim is about this object and not about the walk that produced it. */
  snapshot: () => {
    const s = setup().game?.snapshot
    return s ? JSON.parse(JSON.stringify(s)) : null
  },
  /** ⭐⭐ THE HANDOVER IN NUMBERS – the owner's note: «we could print result parameters over each
   *  screen and highlight the difference, higher stats in our accent yellow, lower in white».
   *
   *  ⚠ THE ATTRIBUTES CANNOT COME OFF THE SNAPSHOT, and that is a design decision rather than a gap:
   *  `RadarAxis` carries `shownValue`, an ESTIMATE that is deliberately wrong while she is
   *  undiscovered, because «a surface cannot leak what it has never been given» (narrative.ts). The
   *  two paths do not even carry the same fog – B played four weekends, so her band is narrower –
   *  so colouring «higher» off the estimates could paint the wrong half yellow. The film therefore
   *  re-runs the SHIPPED handover, `createWorld(...)` over this phone's own live run and profile,
   *  and reads `world.skills`: the exact object `childhoodArrival` produced for the card on screen.
   *
   *  ⚠ AND IT PROVES IT IS THE SAME WORLD RATHER THAN ASSERTING IT. The rebuilt snapshot's radar,
   *  funds and base band are compared against the live ones; `ok` is false if any of them disagree
   *  and the recorder refuses the take. A read-out of a DIFFERENT girl under a caption about this
   *  one is exactly the failure the two seeds already cost a take to.
   *
   *  ⚠ POTENTIAL IS NOT HERE AND MUST NOT BE. The brief: «do not expose hidden potential as a
   *  number». `world.potential` is byte-identical between the paths anyway – that is the film's
   *  claim – but it is never returned, so it cannot reach the frame by accident. */
  facts: () => {
    const s = setup()
    const live = s.game?.snapshot
    const run = s.run
    if (!live || !run) return null
    const years = chosenYears(run)
    const spent = spentCents(run)
    const w: any = createWorld(live.seed, live.profile, 'film-readout', { years, spentCents: spent })
    const rebuilt: any = toSnapshot(w)
    const ok =
      JSON.stringify(rebuilt.radar) === JSON.stringify(live.radar) &&
      rebuilt.fundsCents === live.fundsCents &&
      rebuilt.handoverBaseBand === live.handoverBaseBand
    // The weekend count is the table's own: `localOpensAt` decides how many a year carries, and the
    // film never assumes one per entered age.
    let opens = 0
    for (const card of PROLOGUE_CARDS) opens += localOpensAt(yearsSoFar(run), card.age, enteredAges(run))
    // The same divisor `weeklySpentLine` uses, and the card behind this panel prints the figure it
    // makes – so a drift between the two would be visible inside one frame.
    const weekly = Math.round(spent / (CARD_AGES.length * WEEKS_IN_SEASON))
    return {
      ok,
      seed: live.seed,
      skills: SKILL_KEYS.map((k) => ({ key: k, label: RADAR_AXIS_LABEL[k], value: w.skills[k] })),
      opens,
      spentCents: spent,
      weeklyCents: weekly,
      fundsCents: live.fundsCents,
      money: { spent: formatCents(spent), weekly: formatCents(weekly), funds: formatCents(live.fundsCents) },
      coachTier: live.profile?.coachTier ?? null,
      playStyle: live.profile?.playStyle ?? null,
      baseBand: live.handoverBaseBand ?? null,
      roomBand: live.handoverBand ?? null,
    }
  },
  probe: () => ({
    layoutWidth: document.documentElement.clientWidth,
    layoutHeight: document.documentElement.clientHeight,
    elementWidth: window.innerWidth,
    desktopArm: window.matchMedia('(min-width: 768px)').matches,
    wideArm: window.matchMedia('(min-width: 1024px)').matches,
    dpr: window.devicePixelRatio,
  }),
  state: () => {
    const s = setup()
    return {
      at: s.at ?? null,
      age: s.card?.age ?? null,
      title: s.card?.title ?? null,
      ask: !!s.ask,
      picked: s.picked ?? null,
      entry: s.entry ?? null,
      open: s.openNow ? { age: s.openNow.age, beat: null } : null,
      result: s.resultNow ? { age: s.resultNow.age, outcome: s.resultNow.outcome } : null,
      creating: !!s.creating,
      handover: !!s.handoverOpen,
      run: s.run ? JSON.parse(JSON.stringify(s.run)) : null,
    }
  },
  /** Click a real control by the text it prints. Returns the label clicked, or ''. */
  tap: (text: string): string => {
    const want = text.trim().toLowerCase()
    const buttons = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
    for (const b of buttons) {
      const t = (b.innerText || '').trim().toLowerCase()
      if (!t) continue
      if (t === want || t.startsWith(want) || t.includes(want)) {
        if (b.disabled) continue
        b.click()
        return (b.innerText || '').trim()
      }
    }
    return ''
  },
  /** How tall the card actually is against the frame it is in – the film needs the ANSWERS on
   *  screen, and a card that scrolls has put them below the fold. In LOGICAL px (the rects come
   *  back in visual px, so both are divided by the zoom). */
  fit: () => {
    const card = document.querySelector('.dialog-card, .plo') as HTMLElement | null
    const z = Number(getComputedStyle(document.documentElement).zoom) || 1
    return {
      card: card ? Math.round(card.scrollHeight / z) : null,
      frame: Math.round(document.documentElement.clientHeight / z),
      over: card ? Math.round((card.scrollHeight - document.documentElement.clientHeight) / z) : null,
    }
  },
  /** ⭐ THE CARDS ARE TALLER THAN THE PHONE AND THE ANSWERS ARE THE POINT. Measured at 414 logical
   *  px: the fifth is 1150, the eleventh 1026 and the twelfth 1112 against a 896-tall frame, so on
   *  three of the film's beats the choices start below the fold. A player scrolls; so does the film,
   *  slowly, which is also the only motion in a clip that is otherwise cuts and dissolves. */
  scrollCard: (to: number, ms: number) => {
    const el = document.querySelector('.dialog-card') as HTMLElement | null
    if (!el) return
    const from = el.scrollTop
    const max = Math.max(0, el.scrollHeight - el.clientHeight)
    const target = Math.min(max, to)
    if (ms <= 0) {
      el.scrollTop = target
      return
    }
    const t0 = performance.now()
    const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2)
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / ms)
      el.scrollTop = from + (target - from) * ease(k)
      if (k < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  },
  /** ⚠ THE LAST BUTTON THE FILM TAPPED KEEPS THE FOCUS RING, and on the handover that ring lands on
   *  ONE of the two halves - an asymmetry the viewer reads as a difference between the paths. */
  blur: () => (document.activeElement as HTMLElement | null)?.blur(),
  /** A box on screen, in LOGICAL px – the rects come back in visual px, so both are divided by the
   *  zoom. The stage crops the handover down to the lines that actually differ, and it measures
   *  where they are rather than assuming: the two cards are different heights (only one of them
   *  carries a played line) and the shared card box centres each of them separately. */
  rect: (sel: string) => {
    const el = document.querySelector(sel) as HTMLElement | null
    if (!el) return null
    const z = Number(getComputedStyle(document.documentElement).zoom) || 1
    const r = el.getBoundingClientRect()
    return { top: r.top / z, bottom: r.bottom / z, height: r.height / z }
  },
  /** What a box on the screen actually says – read back so the report quotes the frame rather than
   *  the table it came from. */
  text: (sel: string) => (document.querySelector(sel) as HTMLElement | null)?.innerText.replace(/\s+/g, ' ').trim() ?? null,
  labels: (): string[] =>
    (Array.from(document.querySelectorAll('button')) as HTMLButtonElement[])
      .map((b) => (b.innerText || '').trim().replace(/\s+/g, ' '))
      .filter(Boolean),
  tick: () => nextTick(),
}
