// =================================================================================================
// ⭐⭐ ROUND 42 #20 (RULED B) – THE CHIP EARNS ATTENTION, AND THE WEEK ASKS BEFORE LEAVING HER
// =================================================================================================
//
// The owner: «надо как-то к самой плашке внимание привлекать, она сейчас максимально незаметная» –
// ruled B on the sharpened ask (15.09): the soft chip gains a gentle contour pulse, the FIRST
// Proceed press while a soft beat is live asks one line and the second press leaves, and BLOCKING
// beats grey the Proceed with a reason. No hard block anywhere – «she can be missed» stays true.
//
// MOUNTED, because every claim is about what is on screen and what a press spends. The three
// surfaces are: HomeScreen (the chip and its pulse), the App shell (the bar's press and the ask
// line above it), and CalendarScreen (the same guard consulted BEFORE the sweep, its own note slot).
//
// ⚠⚠ MUTATION ARMS – each run against the real source on 15.09, watched red, restored. The counts
// are MEASURED, not predicted:
//   ARM 1  the pulse animation removed from `.soft-beat-card` (HomeScreen.vue) -> RED [1] on the
//          pulse case; the killswitch case stayed green, which is why they are two.
//   ARM 2  the reduce-block's `animation: none` removed -> RED [1] on the killswitch case alone.
//   ARM 3  `if (!softLeave.pass()) return` deleted from `playWeek` (App.vue) -> RED [1]: the shell
//          case dies on its first assertion (the first press advanced), which also covers the note
//          that would never have rendered.
//   ARM 4  `if (!softLeave.pass()) return` deleted from `runWeek` (CalendarScreen.vue) -> RED [1]:
//          the calendar case's first press emitted the advance.
//   ARM 5  the `lifeBeatPrompt` branch deadened in `useWeekAction` -> RED [2]: the grey-out case
//          (live button over an engine that refuses) and the calendar note case (no reason on
//          screen; the knock-outranks and soft-not-blocking controls stayed green, as they must).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'

// The shell imports the service-worker registration and the component project resolves no virtual
// module for it – the same mock r2-13-span-report installs, for the same reason.
vi.mock('../../src/pwa', async () => {
  const { ref } = await import('vue')
  return { needRefresh: ref(false), applyUpdate: () => {}, UPDATE_CHECK_MS: 3600_000 }
})

import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import CalendarScreen from '../../src/components/screens/CalendarScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { useWeekAction } from '../../src/composables/weekAction'
import { SOFT_LEAVE_LINE, resetSoftLeaveGuard, useSoftLeaveGuard } from '../../src/composables/softLeave'
import { setDayCrossOff } from '../../src/composables/dayCross'
import { buildSoftBeatInvite, createWorld, raiseLifeBeat, toSnapshot } from '../../src/engine/world'
import { bondBandOf } from '../../src/engine/spirit'
import { DEFAULT_PROFILE, type LifeBeatPrompt, type Snapshot } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage AND THE SHELL'S WATERMARKS ARE localStorage – the same shim
// r2-13-span-report and round19-wrapup install; supply the browser's object, do not weaken the app.
const backing = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
    setItem: (k: string, v: string) => void backing.set(k, String(v)),
    removeItem: (k: string) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i: number) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  },
})

interface DeviceWindow {
  happyDOM: { settings: { device: { prefersReducedMotion: string } } }
}
/** ⚠ SET BEFORE ANYTHING IS MOUNTED OR READ – a media query is cached on an element's first
 *  computed-style read (round36-reduced-motion.test.ts's own header). */
function setReducedMotion(on: boolean): void {
  const w = window as unknown as DeviceWindow
  if (!w.happyDOM?.settings?.device) throw new Error('happy-dom exposes no device settings')
  w.happyDOM.settings.device.prefersReducedMotion = on ? 'reduce' : 'no-preference'
}

/** The lowest `bond` that reads as `close` – asked of the ladder, never transcribed
 *  (wave3-soft-card.test.ts's own helper). */
function closeBond(): number {
  for (let b = 0; b <= 100; b += 0.5) if (bondBandOf(b) === 'close') return b
  throw new Error('no bond value reads as close')
}

/** A real career with ONE live soft row – the engine's own writer and reader, nothing invented. */
function softWorld(seed: string) {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.week = 200
  world.bond = closeBond()
  raiseLifeBeat(world, 'small-talk', 'question')
  if (buildSoftBeatInvite(world) === null) throw new Error('the fixture raised no live soft row')
  return world
}

function softSnapshot(seed: string): Snapshot {
  const snap = toSnapshot(softWorld(seed))
  expect(snap.softBeat, 'the chip really is live – nothing below is vacuous').not.toBeNull()
  return snap
}

beforeEach(() => {
  setActivePinia(createPinia())
  backing.clear()
  resetSoftLeaveGuard()
  document.body.innerHTML = ''
})
afterEach(() => {
  setDayCrossOff(false)
  setReducedMotion(false)
  document.body.innerHTML = ''
})

// =================================================================================================
// PART 1 – THE CHIP PULSES, AND STANDS DOWN UNDER REDUCED MOTION
// =================================================================================================
describe('ROUND 42 #20 – the soft chip earns attention', () => {
  function mountedChip(): { el: Element; unmount: () => void } {
    useGameStore().snapshot = softSnapshot('r42-chip')
    const w = mount(HomeScreen, {
      props: { recapFresh: false },
      attachTo: document.body,
      global: { stubs: { teleport: true } },
    })
    const el = document.querySelector('.soft-beat-card')
    expect(el, 'the chip is on the hub – nothing below is vacuous').toBeTruthy()
    return { el: el!, unmount: () => w.unmount() }
  }

  it('⭐⭐ the contour pulse runs (ARM 1), through the real cascade', () => {
    setReducedMotion(false)
    const { el, unmount } = mountedChip()
    // The scoped compiler suffixes the keyframe name; the claim is the pulse, not the hash.
    expect(getComputedStyle(el).animation, 'the chip does not pulse').toContain('soft-beat-pulse')
    unmount()
  })

  it('⭐⭐ ...and under `prefers-reduced-motion: reduce` it does not move – the killswitch stays (ARM 2)', () => {
    setReducedMotion(true)
    const { el, unmount } = mountedChip()
    const style = getComputedStyle(el)
    expect(style.animation, 'the pulse ignored the system').not.toContain('soft-beat-pulse')
    expect(style.animation, 'switched off explicitly, not left to a shorthand').toContain('none')
    unmount()
  })

  // ⭐⭐ ROUND 43 #7 – THE GLOW, AND IT IS THE HALF THE KILLSWITCH MUST **NOT** TAKE AWAY. His ask,
  // 16.09: the chip's frame should light at the edges like the avatar's mood ring, «чтобы тоже
  // подсветка была по краям небольшая, а не только сама рамка».
  //
  // ⚠ WHAT THIS CAN AND CANNOT SEE. happy-dom resolves the cascade but does not run animations, so a
  // KEYFRAME's box-shadow is not readable here – the pulse case above is asserted by the animation
  // NAME for exactly that reason. What IS readable is the reduce-block's static shadow, and that is
  // the case worth a net anyway: it is the one a well-meaning cleanup would delete along with the
  // motion, taking the attention the owner asked for away from the player who most needs the chip
  // easy to find. Motion is what the system asked to reduce; edge light is not motion.
  //
  // ⚠ MUTATION-CHECKED: removing the `box-shadow` from the reduce block fails this, and it survives
  // the ARM 2 case above untouched – which is why they are two tests and not one.
  it('⭐ ...and the reduced-motion chip keeps a STILL glow rather than going dark (ARM 3)', () => {
    setReducedMotion(true)
    const { el, unmount } = mountedChip()
    const shadow = getComputedStyle(el).boxShadow
    expect(shadow, 'the calm chip lost its edge light with the motion').toMatch(/rgba?\(/)
    expect(shadow, 'the glow is drawn in the accent, not in a grey').toMatch(/207|cfe152/i)
    unmount()
  })
})

// =================================================================================================
// PART 2 – THE LEAVE-ANYWAY GUARD, ON BOTH PROJECTIONS OF THE PRESS
// =================================================================================================
describe('ROUND 42 #20 (ruled B) – the first press asks, the second leaves', () => {
  async function openShell(snapshot: Snapshot) {
    const game = useGameStore()
    vi.spyOn(game, 'init').mockResolvedValue(undefined)
    game.$patch({ ready: true, phase: 'ready' })
    game.snapshot = snapshot
    const w = mount(App, { global: { stubs: { teleport: true } } })
    w.findComponent(SplashScreen).vm.$emit('done')
    await flushPromises()
    return { w, game }
  }

  it('⭐⭐⭐ ON HOME: press one shows the line and spends NOTHING; press two advances (ARM 3)', async () => {
    setDayCrossOff(true) // no calendar detour – the press meets the guard and then the store
    const { w, game } = await openShell(softSnapshot('r42-guard-home'))
    const pressed: number[] = []
    vi.spyOn(game, 'advance').mockImplementation(async (weeks: number) => {
      pressed.push(weeks)
    })

    const go = w.find('.next-week-btn')
    expect(go.exists(), 'the bar is on Home').toBe(true)
    expect(go.attributes('disabled'), 'a SOFT chip never disables the button – ruled B, not A').toBeUndefined()
    expect(w.find('.next-week-note').exists(), 'no ask before any press').toBe(false)

    await go.trigger('click')
    expect(pressed, 'the first press left the week alone').toEqual([])
    const note = w.find('.next-week-note')
    expect(note.exists(), 'and asked instead').toBe(true)
    expect(note.text(), 'with the DRAFT line, verbatim from its one declaration').toBe(SOFT_LEAVE_LINE)

    await go.trigger('click')
    expect(pressed, 'the second press leaves – she can be missed').toEqual([1])
    w.unmount()
  })

  it('⭐⭐ ON THE CALENDAR: the guard is consulted BEFORE the sweep, in its own note slot (ARM 4)', async () => {
    setDayCrossOff(true) // the guard question, not the animation, is this case's subject
    useGameStore().snapshot = softSnapshot('r42-guard-cal')
    const w = mount(CalendarScreen, { global: { stubs: { teleport: true } } })

    const go = w.find('.cal-go-btn')
    expect(go.exists()).toBe(true)
    await go.trigger('click')
    await nextTick()
    expect(w.emitted('advance'), 'the first press handed nothing to the shell').toBeUndefined()
    const note = w.find('.cal-go-note')
    expect(note.exists(), 'the ask took the note slot').toBe(true)
    expect(note.text()).toBe(SOFT_LEAVE_LINE)

    await go.trigger('click')
    await nextTick()
    expect(w.emitted('advance'), 'the second press went through').toHaveLength(1)
    w.unmount()
  })

  it('⚠ one ask per week, however the press arrives – the two surfaces share the guard', async () => {
    // The detour's whole hazard: Home consumes the ask, the calendar must not ask AGAIN for the
    // same week's press. Module state is the design (softLeave.ts header); this is its pin.
    useGameStore().snapshot = softSnapshot('r42-guard-shared')
    const guard = useSoftLeaveGuard()
    expect(guard.pass(), 'first take: consumed to ask').toBe(false)
    expect(guard.asking.value).toBe(true)
    expect(guard.pass(), 'second take: passes').toBe(true)
    expect(guard.pass(), 'and the sweep hand-back re-entry passes too – one logical press').toBe(true)

    // A new week re-arms the ask (the chip is a 3-week window; each week costs one honest tap).
    const next = { ...useGameStore().snapshot! }
    next.week = next.week + 1
    useGameStore().snapshot = next
    expect(guard.pass(), 'a fresh week asks afresh while the chip lives').toBe(false)
  })

  it('⚠ no chip, no ask – the guard is invisible on an ordinary week', async () => {
    setDayCrossOff(true)
    const quiet = { ...softSnapshot('r42-guard-quiet'), softBeat: null }
    const { w, game } = await openShell(quiet)
    const pressed: number[] = []
    vi.spyOn(game, 'advance').mockImplementation(async (weeks: number) => {
      pressed.push(weeks)
    })
    await w.find('.next-week-btn').trigger('click')
    expect(pressed, 'the ordinary week spends on the first press, as it always did').toEqual([1])
    expect(w.find('.next-week-note').exists()).toBe(false)
    w.unmount()
  })
})

// =================================================================================================
// PART 3 – THE BLOCKING BEAT GREYS THE BUTTON, WITH ITS REASON (the half that was never in question)
// =================================================================================================
describe('ROUND 42 #20 – a BLOCKING beat disables Proceed and says why (ARM 5)', () => {
  /** A blocking prompt in the wire's shape – the reason line is `useWeekAction`'s own, so the
   *  fixture only needs the field to stand. FIXTURE strings, not copy. */
  const BLOCKING: LifeBeatPrompt = {
    week: 640,
    kind: 'fork-opinion',
    heading: 'FIXTURE heading',
    said: 'FIXTURE line.',
    options: [{ id: 'back-her', label: 'FIXTURE answer' }],
    // ⚠ RE-AIMED BY ROUND 42 #15/#24: the field is a LIST now (`followUps`), and an empty one is
    // what `listenFollowUp: null` used to say – no answer on this card earns a second line of hers.
    followUps: [],
    confirm: 'FIXTURE proceed',
  }

  it('⭐⭐ the action is disabled, carries the reason, and offers no span', () => {
    const store = useGameStore()
    store.snapshot = { ...toSnapshot(createWorld('r42-blocking', DEFAULT_PROFILE)), lifeBeatPrompt: BLOCKING }
    const action = useWeekAction()
    expect(action.value.disabled, 'the button tells the truth the engine already enforces').toBe(true)
    expect(action.value.blockedNote, 'the reason, in the knock note\'s own register (DRAFT, round 42 #20)').toBe(
      'She has something to say – nothing moves until you hear her out.',
    )
    expect(action.value.multi, 'no four-week control in front of a stopped world').toBeNull()
  })

  it('⚠ the knock still outranks her – the engine\'s own refusal order, mirrored', () => {
    const store = useGameStore()
    const base = toSnapshot(createWorld('r42-blocking-order', DEFAULT_PROFILE))
    store.snapshot = {
      ...base,
      lifeBeatPrompt: BLOCKING,
      knockPrompt: {
        part: 'wrist',
        repeat: false,
        line: 'FIXTURE',
        read: 'FIXTURE',
        restCost: 'FIXTURE',
        pushCost: 'FIXTURE',
      },
    }
    const action = useWeekAction()
    expect(action.value.disabled).toBe(true)
    expect(action.value.blockedNote, 'her body first – multiWeek.ts\'s own order').toContain('wrist')
  })

  it('⭐ ...and the reason is ON SCREEN where a note slot exists – the calendar renders it', async () => {
    const store = useGameStore()
    store.snapshot = { ...toSnapshot(createWorld('r42-blocking-cal', DEFAULT_PROFILE)), lifeBeatPrompt: BLOCKING }
    const w = mount(CalendarScreen, { global: { stubs: { teleport: true } } })
    const note = w.find('.cal-go-note')
    expect(note.exists(), 'R10-16: a dead control with no reason is the bug').toBe(true)
    expect(note.text()).toBe('She has something to say – nothing moves until you hear her out.')
    expect(w.find('.cal-go-btn').attributes('disabled'), 'and the button really is disabled').toBeDefined()
    w.unmount()
  })

  it('⚠ a SOFT chip does NOT disable anything – ruled B, the missable stays missable', () => {
    const store = useGameStore()
    store.snapshot = softSnapshot('r42-soft-not-blocking')
    const action = useWeekAction()
    expect(action.value.disabled).toBe(false)
    expect(action.value.blockedNote).toBeNull()
  })
})
