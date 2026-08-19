<script setup lang="ts">
// U0 #6 – PROGRESS RING. The export's ProgressRing: a track, an arc that starts at twelve o'clock
// and travels clockwise, and the reading in the middle - the figure at 15/800 with its sign a third
// smaller on the same baseline.
//
// TWO REAL CALLERS, WRITTEN INDEPENDENTLY, and that is what licenses this component: Home's
// CONDITION ring and the Season card's CHANCE ring. They had already been merged into one shared
// rule in `src/style.css` with a comment explaining that a percentage must look like a percentage
// everywhere; this is that sentence as a component, so the claim is enforced by construction rather
// than by two selector lists sitting next to each other.
//
// OUR CONTINUOUS HUE STAYS OURS. `color` is a plain string, so a caller passes whatever it means -
// the red-to-green ramp read continuously, so 61% and 62% are genuinely different colours. The
// colour is DATA, which is why it is a prop and not a variant.
//
// ⚠ AND THE RAMP HAS ONE OWNER NOW: `src/composables/readingColor.ts`. This comment used to say
// "Home passes hsl(pct*120, 72%, 48%); Season passes its own", which was true and was the problem -
// all five callers passed the SAME expression, written out four separate times, on two different
// input scales. They all call `readingColor` today. Nothing here changed: this component still takes
// a plain string and still has no opinion about the ramp.
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 0..1. Clamped here, so no caller can hand the arc a number that draws past the circle. */
    value: number
    size?: 46 | 56
    /** The stroke colour of the arc. Anything CSS accepts; the ramp is the caller's decision. */
    color?: string
    /** What the ring says out loud. A ring is a picture, so it must have one. */
    label: string
    /** Sitting ON a photograph: adds the drop shadow under the ring and the on-art text shadow. */
    onArt?: boolean
  }>(),
  { size: 46, color: 'var(--accent)', onArt: false },
)

/** The export's geometry, for both sizes: a 3px stroke inset by half of it plus a hair. */
const STROKE = 3
const geom = computed(() => {
  const box = props.size
  const r = box === 56 ? 24 : 19
  return { box, r, c: Math.round(2 * Math.PI * r * 10) / 10 }
})
const offset = computed(() => {
  const pct = Math.max(0, Math.min(1, props.value))
  return Math.round(geom.value.c * (1 - pct) * 10) / 10
})
</script>

<template>
  <div
    class="tb-ring"
    :class="[`tb-ring--${size}`, { 'tb-ring--on-art': onArt }]"
    role="img"
    :aria-label="label"
  >
    <svg
      :width="geom.box"
      :height="geom.box"
      :viewBox="`0 0 ${geom.box} ${geom.box}`"
      fill="none"
      aria-hidden="true"
    >
      <circle :cx="geom.box / 2" :cy="geom.box / 2" :r="geom.r" class="tb-ring-track" :stroke-width="STROKE" />
      <circle
        :cx="geom.box / 2"
        :cy="geom.box / 2"
        :r="geom.r"
        class="tb-ring-arc"
        :stroke="color"
        :stroke-width="STROKE"
        stroke-linecap="round"
        :stroke-dasharray="geom.c"
        :stroke-dashoffset="offset"
        :transform="`rotate(-90 ${geom.box / 2} ${geom.box / 2})`"
      />
    </svg>
    <span class="tb-ring-value"
      ><slot
        ><b>{{ Math.round(value * 100) }}</b><i>%</i></slot
      ></span
    >
  </div>
</template>

<style scoped>
.tb-ring {
  position: relative;
  flex: none;
}

.tb-ring--46 {
  width: 46px;
  height: 46px;
}

.tb-ring--56 {
  width: 56px;
  height: 56px;
}

.tb-ring svg {
  display: block;
}

.tb-ring-track {
  stroke: var(--ring-track);
  fill: none;
}

/* Both halves of the animation live here. The dash offset is the reading moving; the stroke is the
   ramp moving with it, which only Home's ring can currently do - on a card whose value never
   changes in place, a transition that never fires costs nothing and keeps the two rings one object. */
.tb-ring-arc {
  fill: none;
  transition:
    stroke-dashoffset var(--dur-slow) cubic-bezier(0.2, 0.8, 0.2, 1),
    stroke var(--dur-slow) linear;
}

/* The label sits a little high on purpose: the figure has no descenders, so centring its BOX reads
   as resting on the lower stroke of the circle.
   ⚠ THE NUDGE IS PROPORTIONAL, not a fixed 12px. It was a literal, tuned against the 46px ring -
   which put the figure visibly low inside the 56px one on screen C, the owner's «проценты кондишна
   надо выровнять по вертикали, как в других местах». A ring that comes in two sizes cannot carry a
   one-size optical correction; 26% of the box is the same LOOK at both. */
.tb-ring-value {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.5px;
  padding-top: 26%;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.tb-ring--56 .tb-ring-value :deep(b) {
  font-size: 17px;
}

.tb-ring--56 .tb-ring-value :deep(i) {
  font-size: 11px;
}

.tb-ring-value :deep(b) {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.tb-ring-value :deep(i) {
  font-size: 10px;
  font-weight: 700;
  font-style: normal;
}

.tb-ring--on-art svg {
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.55));
}

.tb-ring--on-art .tb-ring-value {
  text-shadow: var(--shadow-text-on-art);
}

@media (prefers-reduced-motion: reduce) {
  .tb-ring-arc {
    transition: none;
  }
}
</style>
