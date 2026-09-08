// ONE PHONE OF THE FILM: the shipped `ChildhoodPrologue`, mounted whole, in its own document so its
// media queries see a phone and not the 1080-wide stage that frames it.
//
// ⚠ THE ONLY THING THIS RIG CHANGES IS THE ENTROPY. `ChildhoodPrologue.freshSeed()` is
// `prologue-${Math.random().toString(36).slice(2)}...`, so two mounts are two childhoods and the
// owner asked for ONE girl told twice. `Math.random` is pinned at exactly 0.5 for the duration of
// the mount and restored immediately after - the component's own function still computes the seed,
// and the value it lands on (`prologue-i0000`) is the middle of its range rather than a value
// anybody went looking for. `__phone.seed()` reads it back off the live instance so the recorder
// can PROVE both halves are the same childhood instead of assuming it.
//
// ⚠ `zoom` IS ON THE ROOT AND THE IFRAME IS SIZED TO MATCH. The stage sets `--film-zoom`; the
// element is `414 * zoom` wide, so the layout box stays exactly 414 CSS px. Whether the phone media
// queries survive that is MEASURED, not assumed - `__phone.probe()` reports the layout width and
// `matchMedia('(min-width: 768px)')`, and the recorder refuses a take where the desktop arm is live.
import { createApp, nextTick } from 'vue'
import { createPinia } from 'pinia'
import '../../src/style.css'
import ChildhoodPrologue from '../../src/components/ChildhoodPrologue.vue'

const zoom = Number(new URLSearchParams(location.search).get('zoom') || 1)
document.documentElement.style.zoom = String(zoom)

// ⚠⚠ AND IT STAYS PINNED FOR THE WHOLE FILM, WHICH A FIRST CUT GOT WRONG. Restoring `Math.random`
// after the mount fixed the PROLOGUE seed and left the CAREER seed random: `ChildhoodPrologue.begin()`
// calls `game.newCareer('')`, and an empty seed is filled in store-side as
// `${kidName}-${Math.random().toString(36)...}`. So the two halves walked one childhood and then
// handed it to two different girls - different `startingSkills`, different potential - under a
// caption saying «Same hidden potential». Caught on the handover frame: the two coach lines came
// back different where the same band and the same seed must produce the same sentence. Pinned for
// the session, both seeds land on the middle of their range, and the recorder compares the two
// snapshots axis by axis rather than trusting this note.
//
// Nothing in `src/engine` may call `Math.random` (house law), so the only other callers are the
// wizard's name roll, the ending screen, the confetti and the sfx variant picker - none of them on
// this screen, and none of them load-bearing.
Math.random = () => 0.5
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
  labels: (): string[] =>
    (Array.from(document.querySelectorAll('button')) as HTMLButtonElement[])
      .map((b) => (b.innerText || '').trim().replace(/\s+/g, ' '))
      .filter(Boolean),
  tick: () => nextTick(),
}
