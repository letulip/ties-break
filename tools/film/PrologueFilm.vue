<script setup lang="ts">
/* THE NINE YEARS BEFORE THE CAREER BEGINS – the stage.
 *
 * ⭐ WHAT IS REAL: everything inside the two frames. Each frame is its own document running the
 * shipped `ChildhoodPrologue`, and the film DRIVES IT BY CLICKING ITS OWN BUTTONS – the same
 * `.prologue-answer` a player taps. No card copy, no price, no coach line, no radar and no
 * tournament result is typed here; the only strings this file owns are the editorial captions and
 * the path labels, which the brief allows and which are drawn OUTSIDE the frames so they can never
 * be mistaken for game UI. The one exception is the line under each path label, which QUOTES the
 * shipped option label verbatim – the same string the button inside the frame prints. It is there
 * because on cards 8, 9 and 10 the walk steps forward the instant the option is taken, so the
 * choice itself is never on screen long enough to be read.
 *
 * ⚠ ONE GIRL, TOLD TWICE. Both frames pin `Math.random` for the length of their mount, so
 * `freshSeed()` lands on the same `prologue-i0000` in both. `__filmReport` carries both seeds back
 * out and the recorder refuses a take where they differ – a split screen of two different
 * childhoods would be the film's whole claim quietly withdrawn.
 *
 * ⚠ THE FRAMES ARE NEVER RE-CREATED. `display: none`, never `v-if`: an iframe that unmounts loses
 * nine years of walk and re-mounts at age five.
 *
 * ⚠ THE FRAME SIZE AND THE ROOT `zoom` MOVE TOGETHER, so the layout box inside stays exactly 414
 * CSS px at every scale. Measured, not assumed: at zoom 1 the card box is 414 and an h2 is 25px
 * tall; at zoom 1.15 they are 476 and 29 – the same layout, rasterised larger. `matchMedia('(min-
 * width: 768px)')` answers false at every scale the film uses, and the recorder refuses a take
 * where it does not.
 */
import { onMounted, ref } from 'vue'

const LOGO_LINE = '/logo-tb-line-light.svg'
const LOGO_LINE_2 = '/logo-tb-line-2-light.svg'

type Mode = 'split' | 'focus-b' | 'compare' | 'logo'

const mode = ref<Mode>('split')
const lit = ref(0)
const capA = ref('')
const capB = ref('')
const tagA = ref('')
const tagB = ref('')
const logoOn = ref(false)

const frameA = ref<HTMLIFrameElement | null>(null)
const frameB = ref<HTMLIFrameElement | null>(null)

const zoom = ref(1)

/** ⭐ THE CLOSING BEAT CROPS THE HANDOVER DOWN TO THE LINES THAT ACTUALLY DIFFER and stacks the two
 *  of them, which is the only way the difference is legible at 1080 square. Side by side the width
 *  caps the scale at 1.28x; stacked it caps at 2.5x, and the coach's sentence goes from 15px to
 *  nearly 40. Measured at run time, not guessed: the two cards are different heights (only one of
 *  them carries a played line) and each is centred separately inside the shared card box. */
const crop = ref<{ a: { top: number; height: number }; b: { top: number; height: number } } | null>(null)

const trace: string[] = []
;(window as any).__filmTrace = trace
const marks = ref<{ key: string; start: number; end: number }[]>([])
let t0 = 0
const now = () => (performance.now() - t0) / 1000
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

const phone = (which: 'a' | 'b'): any =>
  ((which === 'a' ? frameA.value : frameB.value)?.contentWindow as any)?.__phone

async function tap(which: 'a' | 'b', text: string, tries = 30): Promise<string> {
  for (let i = 0; i < tries; i++) {
    const p = phone(which)
    const hit = p ? p.tap(text) : ''
    if (hit) {
      await wait(60)
      trace.push(`tap ${which} "${text}" -> age ${phone(which)?.state?.().age} hand=${phone(which)?.state?.().handover}`)
      return hit
    }
    await wait(60)
  }
  throw new Error(`[${which}] nothing to tap for "${text}" – on screen: ${JSON.stringify(phone(which)?.labels?.() ?? [])}`)
}

async function until(which: 'a' | 'b', ok: (s: any) => boolean, what: string, ms = 8000): Promise<void> {
  const end = performance.now() + ms
  while (performance.now() < end) {
    const p = phone(which)
    if (p && ok(p.state())) return
    await wait(60)
  }
  throw new Error(`[${which}] timed out waiting for ${what} – state ${JSON.stringify(phone(which)?.state?.() ?? null)}`)
}

async function setZoom(z: number): Promise<void> {
  zoom.value = z
  phone('a')?.setZoom(z)
  phone('b')?.setZoom(z)
  await wait(40)
}

// =================================================================================================
// THE WALK – the owner's two paths, spelled as the labels the shipped table prints
// =================================================================================================
const A_PICKS: Record<number, string> = {
  8: 'Stay at the municipal court',
  9: 'Keep her in the group',
  10: 'Not this year',
  11: 'Ordinary school',
  12: 'Let her stop for a season',
}
const B_PICKS: Record<number, string> = {
  8: 'The club across town',
  9: 'Buy the hour, one to one',
  10: 'Enter her',
  11: 'The sports school',
  12: 'Give her the year she is asking for',
}
const ORIGIN = 'A city, and the bills are paid.'

/** Answer one year on one phone: the year's own decision, then – where the card carries one – this
 *  year's tournament question. */
async function year(which: 'a' | 'b', age: number, pick: string | null, enter: boolean): Promise<void> {
  const before = phone(which).state()
  if (before.age !== age) {
    throw new Error(`[${which}] asked to answer age ${age} while the walk is on ${before.age} (handover=${before.handover})`)
  }
  if (pick) await tap(which, pick)
  // ⚠ THE PICK MAY HAVE ALREADY TURNED THE PAGE, and a take was lost to exactly that. On the tenth
  // card the year's own decision IS the tournament question, so answering it satisfies
  // `cardAnswered` and the walk steps to eleven – where an unguarded ask tap then answered the
  // ELEVENTH card's weekend, and every later year landed one card early until path A arrived at the
  // handover a beat before the film asked for it. Only answer the ask if the walk is still here.
  const after = phone(which).state()
  if (after.age === age && after.ask) await tap(which, enter ? 'Put her name down' : 'Not this year')
}

/** Path B's weekends. `ChildhoodPrologue` queues the Local Open the moment an entered year is
 *  answered, so every one of them passes through the shipped viewer and its result card whether the
 *  film holds on it or not. This walks one through at speed, under a dissolve. */
async function skipWeekend(): Promise<void> {
  const p = phone('b')
  if (p.state().open) {
    await tap('b', 'Skip the rest of the weekend')
    await until('b', (s) => !s.open, 'the weekend to close')
  }
  if (p.state().result) await tap('b', 'Go on')
}

/** ⚠ THREE OF THE FILM'S CARDS ARE TALLER THAN THE PHONE. Measured at 414 logical px: the fifth is
 *  1150, the eleventh 1026 and the twelfth 1112 against an 896-tall frame, so the answers – which
 *  are the whole subject of those beats – start below the fold. A player scrolls; so does the film,
 *  slowly, and it is the only motion in a clip that is otherwise cuts and dissolves. */
function scroll(which: 'a' | 'b' | 'both', to: number, ms: number): void {
  if (which !== 'b') phone('a')?.scrollCard(to, ms)
  if (which !== 'a') phone('b')?.scrollCard(to, ms)
}

/** Measure the handover's coach-and-money block on both phones and work out the biggest scale that
 *  still fits two of them stacked in the frame. `.handover-read` is the coach; `.handover-spent` is
 *  the total and the per-week line, and the played line sits between them, so one span covers all
 *  three. */
function measureCrop(): number {
  // ⚠ ASYMMETRIC PADDING, AND EACH STRIP KEEPS ITS OWN HEIGHT. A first cut padded both ends by 18
  // logical px and gave both strips the taller one's height: the top then caught the descenders of
  // the radar note above, and the shorter card - path A, which has no played line - ran on far
  // enough to include its «Go on with her» button.
  const TOP = 8
  const BOTTOM = 12
  const box = (which: 'a' | 'b') => {
    const p = phone(which)
    const read = p.rect('.handover-read')
    const spent = p.rect('.handover-spent')
    if (!read || !spent) throw new Error(`[${which}] no handover block to crop`)
    return { top: read.top - TOP, height: spent.bottom - read.top + TOP + BOTTOM }
  }
  const a = box('a')
  const b = box('b')
  crop.value = { a, b }
  // 1040 of usable width; two strips, their labels and the gap inside 1000 of usable height.
  return Math.min(1040 / 414, 440 / Math.max(a.height, b.height))
}

// =================================================================================================
// THE TIMELINE
// =================================================================================================
type Beat = {
  key: string
  slot: number
  mode: Mode
  drive?: () => Promise<void>
  paint: () => void
  /** runs once the beat is lit, with its hold in seconds */
  live?: (hold: number) => void
}

const OUT = 170
const IN = 190

const BEATS: Beat[] = [
  {
    key: 'five',
    slot: 2.6,
    mode: 'split',
    paint: () => {
      capA.value = 'The career starts at fourteen.'
      capB.value = ''
      // ⭐ THE PATHS ARE NAMED FROM FRAME ONE AND NOTHING IS CHOSEN YET. The first cut opened on one
      // phone and cut to two at age eight, and the owner read the three solo cards as «strange
      // screen changing» - three layouts in four seconds, none of them on screen long enough. Ages
      // five to seven are the SAME card on both paths, which is the truthful reason to show them
      // twice: the childhoods do not part until the eighth.
      tagA.value = ''
      tagB.value = ''
    },
    live: (hold) => scroll('both', 260, hold * 1000 * 0.9),
  },
  {
    key: 'six',
    slot: 1.3,
    mode: 'split',
    drive: async () => {
      await tap('a', ORIGIN)
      await tap('b', ORIGIN)
    },
    paint: () => {
      capA.value = 'The career starts at fourteen.'
      capB.value = 'The consequences start at five.'
    },
  },
  {
    key: 'seven',
    slot: 1.3,
    mode: 'split',
    drive: async () => {
      await tap('a', 'Sign her up')
      await tap('b', 'Sign her up')
    },
    paint: () => {
      capA.value = 'The career starts at fourteen.'
      capB.value = 'The consequences start at five.'
    },
  },
  {
    key: 'eight',
    slot: 2.6,
    mode: 'split',
    drive: async () => {
      await tap('a', 'A year passes')
      await tap('b', 'A year passes')
    },
    paint: () => {
      tagA.value = 'Stay at the municipal court'
      tagB.value = 'The club across town'
      capA.value = 'One card. Two answers. Nine years of it.'
      capB.value = ''
    },
  },
  {
    key: 'nine',
    slot: 2.3,
    mode: 'split',
    drive: async () => {
      await year('a', 8, A_PICKS[8], false)
      await year('b', 8, B_PICKS[8], false)
    },
    paint: () => {
      tagA.value = A_PICKS[9]
      tagB.value = B_PICKS[9]
      capA.value = 'Eight children waiting for one court – or an hour with nobody else on it.'
      capB.value = ''
    },
  },
  {
    key: 'ten',
    slot: 1.8,
    mode: 'split',
    drive: async () => {
      await year('a', 9, A_PICKS[9], false)
      await year('b', 9, B_PICKS[9], false)
    },
    paint: () => {
      tagA.value = A_PICKS[10]
      tagB.value = B_PICKS[10]
      capA.value = 'One weekend, forty minutes down the motorway.'
      capB.value = ''
    },
  },
  {
    key: 'open',
    slot: 2.4,
    mode: 'focus-b',
    drive: async () => {
      await year('a', 10, A_PICKS[10], false)
      await year('b', 10, B_PICKS[10], false)
      await until('b', (s) => !!s.open, 'the Local Open to open')
      await setZoom(1.08)
      await tap('b', 'Begin')
      await tap('b', 'Watch match')
    },
    paint: () => {
      tagA.value = ''
      tagB.value = ''
      capA.value = 'She entered. The engine played the weekend.'
      capB.value = ''
    },
  },
  {
    key: 'result',
    slot: 1.0,
    mode: 'focus-b',
    drive: async () => {
      await tap('b', 'Skip the rest of the weekend')
      await until('b', (s) => !!s.result, 'the result card')
    },
    paint: () => {
      capA.value = ''
      capB.value = ''
    },
  },
  {
    key: 'eleven',
    slot: 2.7,
    mode: 'split',
    drive: async () => {
      await tap('b', 'Go on')
      await until('b', (s) => s.age === 11, 'path B to reach eleven')
      await until('a', (s) => s.age === 11, 'path A to reach eleven')
      await setZoom(1)
    },
    paint: () => {
      tagA.value = A_PICKS[11]
      tagB.value = B_PICKS[11]
      capA.value = 'Mornings on court and lessons after – or her afternoons stay hers.'
      capB.value = ''
    },
    live: (hold) => scroll('both', 150, hold * 1000 * 0.75),
  },
  {
    key: 'twelve',
    slot: 3.6,
    mode: 'split',
    drive: async () => {
      await year('a', 11, A_PICKS[11], false)
      await year('b', 11, B_PICKS[11], true)
      await skipWeekend()
      await until('a', (s) => s.age === 12, 'path A to reach twelve')
      await until('b', (s) => s.age === 12, 'path B to reach twelve')
    },
    paint: () => {
      tagA.value = A_PICKS[12]
      tagB.value = B_PICKS[12]
      capA.value = 'The game remembered every year.'
      capB.value = ''
    },
    live: (hold) => scroll('both', 240, hold * 1000 * 0.72),
  },
  {
    key: 'handover',
    slot: 3.9,
    mode: 'split',
    drive: async () => {
      await year('a', 12, A_PICKS[12], false)
      await year('b', 12, B_PICKS[12], true)
      await skipWeekend()
      await until('a', (s) => s.age === 13, 'path A to reach thirteen')
      await until('b', (s) => s.age === 13, 'path B to reach thirteen')
      await year('a', 13, null, false)
      await year('b', 13, null, true)
      await skipWeekend()
      await until('a', (s) => s.handover, 'path A handover', 30000)
      await until('b', (s) => s.handover, 'path B handover', 30000)
    },
    paint: () => {
      tagA.value = 'Let her stop for a season'
      tagB.value = 'Give her the year she is asking for'
      capA.value = 'Same girl.'
      capB.value = ''
    },
  },
  {
    // ⭐⭐ THE CLOSE-UP, AND IT EXISTS BECAUSE THE OWNER COULD NOT SEE THE DIFFERENCE. Two phone-sized
    // handovers side by side put the one sentence that differs at 15px in a 1080 frame. This crops
    // both cards to the coach block and the money lines, stacks them, and scales to whatever still
    // fits - about 2.5x. Nothing is added: it is the same two screens, closer.
    key: 'compare',
    slot: 3.4,
    mode: 'compare',
    drive: async () => {
      const z = measureCrop()
      await setZoom(z)
      await wait(120)
    },
    paint: () => {
      tagA.value = ''
      tagB.value = ''
      capA.value = 'Different starting lines.'
      capB.value = ''
    },
  },
  {
    key: 'logo',
    slot: 2.7,
    mode: 'logo',
    drive: async () => {
      await setZoom(1)
      logoOn.value = true
    },
    paint: () => {
      tagA.value = ''
      tagB.value = ''
      capA.value = ''
      capB.value = ''
    },
  },
]

/** The handover beat says three things in sequence, and they have to land under one hold. */
async function handoverCaptions(hold: number): Promise<void> {
  await wait(hold * 1000 * 0.45)
  capA.value = 'Same girl. Same hidden potential.'
  await wait(hold * 1000 * 0.55)
}

async function openingCaptions(hold: number): Promise<void> {
  await wait(hold * 1000 * 0.5)
  capB.value = 'The consequences start at five.'
  await wait(hold * 1000 * 0.5)
}

const total = BEATS.reduce((n, b) => n + b.slot, 0)
;(window as any).__filmTotal = total
;(window as any).__filmDone = false

async function play(): Promise<void> {
  t0 = performance.now()
  for (const beat of BEATS) {
    const start = now()
    lit.value = 0
    await wait(OUT)
    if (beat.drive) await beat.drive()
    mode.value = beat.mode
    beat.paint()
    phone('a')?.blur()
    phone('b')?.blur()
    await wait(30)
    lit.value = 1
    ;(window as any).__filmBeat = beat.key
    const hold = beat.slot - (OUT + IN) / 1000
    if (beat.live) beat.live(hold)
    if (beat.key === 'five') await openingCaptions(hold)
    else if (beat.key === 'handover') await handoverCaptions(hold)
    else await wait(hold * 1000)
    marks.value.push({ key: beat.key, start, end: now() })
  }
  const a = phone('a')
  const b = phone('b')
  ;(window as any).__filmMarks = marks.value
  ;(window as any).__filmReport = {
    seedA: a.seed(),
    seedB: b.seed(),
    sameSeed: a.seed() === b.seed(),
    probeA: a.probe(),
    probeB: b.probe(),
    runA: a.state().run,
    runB: b.state().run,
    coachA: a.text('.handover-read'),
    coachB: b.text('.handover-read'),
    moneyA: a.text('.handover-spent'),
    moneyB: b.text('.handover-spent'),
    playedA: a.text('.handover-played'),
    playedB: b.text('.handover-played'),
    snapA: a.snapshot(),
    snapB: b.snapshot(),
  }
  ;(window as any).__filmDone = true
}

function winStyle(which: 'a' | 'b'): Record<string, string> {
  const c = crop.value
  if (mode.value !== 'compare' || !c) return {}
  return { height: `${Math.round(c[which].height * zoom.value)}px` }
}

function frameStyle(which: 'a' | 'b'): Record<string, string> {
  const size = { width: `${414 * zoom.value}px`, height: `${896 * zoom.value}px` }
  const c = crop.value
  if (mode.value !== 'compare' || !c) return size
  return { ...size, marginTop: `${-Math.round(c[which].top * zoom.value)}px` }
}

onMounted(() => {
  ;(window as any).__filmPlay = () => {
    void play()
  }
  ;(window as any).__filmReady = () => !!phone('a')?.seed() && !!phone('b')?.seed()
})
</script>

<template>
  <div class="stage" :class="[mode, { lit: lit === 1 }]">
    <div class="band top">
      <div v-if="mode === 'split'" class="tags">
        <div class="col">
          <p class="who">Keep it smaller</p>
          <p class="chose a">{{ tagA }}</p>
        </div>
        <div class="col">
          <p class="who">Build around tennis</p>
          <p class="chose b">{{ tagB }}</p>
        </div>
      </div>
    </div>

    <div class="floor">
      <div class="slot" :class="{ hidden: mode === 'focus-b' || mode === 'logo' }">
        <p v-if="mode === 'compare'" class="strip">Keep it smaller</p>
        <div class="win" :style="winStyle('a')">
          <iframe
            ref="frameA"
            class="phone"
            :style="frameStyle('a')"
            src="/tools/film/prologue-phone.html?zoom=1"
          ></iframe>
        </div>
      </div>
      <div class="slot" :class="{ hidden: mode === 'logo' }">
        <p v-if="mode === 'compare'" class="strip b">Build around tennis</p>
        <div class="win" :style="winStyle('b')">
          <iframe
            ref="frameB"
            class="phone"
            :style="frameStyle('b')"
            src="/tools/film/prologue-phone.html?zoom=1"
          ></iframe>
        </div>
      </div>

      <div v-if="logoOn" class="logo">
        <img class="logo-line" :src="LOGO_LINE" width="138" height="30" alt="Ties Break" />
        <img class="logo-line two" :src="LOGO_LINE_2" width="139" height="30" alt="Ace Parent" />
        <p class="logo-copy">Her potential was always hers.<br />The childhood was yours.</p>
        <p class="logo-ask">What would you choose for her?</p>
      </div>
    </div>

    <div class="band bottom">
      <p v-if="capA" class="cap">{{ capA }}</p>
      <p v-if="capB" class="cap two">{{ capB }}</p>
    </div>
  </div>
</template>

<style scoped>
.stage {
  position: fixed;
  inset: 0;
  width: 1080px;
  height: 1080px;
  background: #0a0e13;
  display: grid;
  /* ⚠ EXPLICIT, BECAUSE THE IMPLICIT COLUMN IS CONTENT-SIZED. With both frames hidden the floor
     collapsed to zero and the logo card - `position: absolute; inset: 0` inside it - collapsed with
     it, so the closing copy wrapped one word per line. */
  grid-template-columns: 1080px;
  grid-template-rows: 96px 896px 88px;
  overflow: hidden;
  opacity: 0;
  transition: opacity 190ms ease;
}
.stage.focus-b {
  grid-template-rows: 0 988px 92px;
}
.stage.compare {
  grid-template-rows: 0 1000px 80px;
}
.stage.logo {
  grid-template-rows: 0 1080px 0;
}
.stage.lit {
  opacity: 1;
}

.band {
  width: 1080px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 40px;
  text-align: center;
  overflow: hidden;
}
.tags {
  display: flex;
  gap: 32px;
}
.col {
  width: 414px;
}
.who {
  margin: 0;
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #6d7a83;
}
.chose {
  /* ⚠ HELD OPEN. Ages five to seven have nothing chosen yet, and a band that changed height under
     the first three cards would be the jump this beat was rebuilt to remove. */
  min-height: 27px;
  margin: 6px 0 0;
  font-family: 'Sora', system-ui, sans-serif;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #b9c4cb;
}
.chose.b {
  color: #cfe152;
}

.cap {
  margin: 0;
  font-family: 'Sora', system-ui, sans-serif;
  font-size: 26px;
  font-weight: 500;
  line-height: 1.28;
  letter-spacing: -0.01em;
  color: #f2f6f8;
}
.cap.two {
  color: #cfe152;
}

.floor {
  /* ⚠ EXPLICIT WIDTH, MEASURED: as a grid item with both frames hidden this box came back 0 wide at
     x=540, and the logo card inside it - `position: absolute; inset: 0` - collapsed with it, which
     is what wrapped the closing copy one word to a line. */
  width: 1080px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
}
.stage.compare .floor {
  flex-direction: column;
  gap: 24px;
}
.slot {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.slot.hidden {
  display: none;
}
.strip {
  margin: 0 0 6px;
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #6d7a83;
}
.strip.b {
  color: #cfe152;
}
.win {
  border-radius: 22px;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
  overflow: hidden;
}
.phone {
  display: block;
  border: 0;
  background: #0a0e13;
}

.logo {
  padding-bottom: 80px;
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.logo-line {
  width: 400px;
  height: 87px;
}
.logo-line.two {
  margin-top: 6px;
}
.logo-copy {
  width: 100%;
  max-width: 760px;
  margin: 58px 0 0;
  font-family: 'Sora', system-ui, sans-serif;
  font-size: 30px;
  font-weight: 500;
  line-height: 1.42;
  text-align: center;
  color: #f2f6f8;
}
.logo-ask {
  width: 100%;
  margin: 32px 0 0;
  text-align: center;
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: 21px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #8e9ba4;
}
</style>
