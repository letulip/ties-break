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
//
// ⭐⭐ ROUND 44 – TWO OPTIONAL PROPS FOR §8a's CHEMISTRY GAUGE, AND NEITHER MOVES AN EXISTING CALLER.
// The owner ruled the chemistry marker on 16.09 («в положительном направлении заполнение было от
// светло-зелёного до ярко-зелёного в градиенте, а для отрицательного от оранжевого до красного») and
// the spec's §8 answer is that the marker IS this component at 36px, so the two things his ruling
// needs are added here rather than in a second ring:
//
//   `gradient`  paints the arc with a two-stop <linearGradient> instead of a flat `color`. The
//               gradient runs DOWN the box in user space, so a short arc – which lives at the top of
//               the circle – shows only the light end and a long one reaches the bright end. That is
//               both halves of his sentence in one construction: the fill is literally a gradient,
//               and the STRENGTH is where inside it the arc has got to.
//   `mirrored`  sweeps the arc anticlockwise from twelve o'clock instead of clockwise. This is the
//               accessibility half of §8a and not decoration: red/green is the commonest colour
//               vision confusion, so «the fill fraction says it too – a negative pairing fills from
//               the other end, so the ring's SHAPE differs even when its colour does not».
//
// ⚠ BOTH DEFAULT TO OFF and the five shipped callers pass neither, so the condition ring, the chance
// ring and the build ring take the paths they always took.
//
// ⚠⚠ TWO THINGS DID CHANGE FOR EVERY CALLER, said here rather than discovered in a diff:
//
//   1. THE ROOT IS A `<span>` AND NOT A `<div>`, which is a content-model fact and not a style one.
//      Round 44 puts this ring in the bottom-right corner of the coach market's row, and that row is
//      one `<button>` - whose content model is PHRASING content, which a `<div>` is not. Every child
//      of `.cm-row` is already a `<span>` for the same reason. Nothing renders differently: the
//      `display: block` in the style block restores what a `<div>` had, and the ring's two other
//      homes are a flex item and an absolutely positioned corner, both of which blockify a child
//      anyway.
//   2. AN ARC AT EXACTLY ZERO GETS A `butt` CAP so a zero-length dash cannot paint a dot - §8a's
//      neutral rule, argued at the arc itself.
//
// ⚠⚠⚠ AND THE REASON THAT FIRST NOTE LIVES HERE RATHER THAN OVER THE TAG IT DESCRIBES IS A BUG THIS
// COMPONENT SHIPPED FOR ABOUT AN HOUR, CAUGHT BY THE GATE. Written as an HTML comment at the top of
// the template, ABOVE the root element, it made this component render a FRAGMENT - and a fragment
// root turns off Vue's automatic attribute fallthrough. So `class="nt-ring field-ring"` on
// `NextTournamentPanel`'s field ring silently stopped reaching the ring's own element, and
// `tests/component/round29-next-tournament.test.ts` read the PARENT's classes (`nt-read`) instead.
// The rule this leaves behind is general: the markup block's FIRST node must be the root element,
// and a comment about the root goes on the script side, here.
//
// ⚠⚠ AND DO NOT WRITE THE OPENING MARKUP TAG'S LITERAL NAME ANYWHERE ABOVE IT - which is the SECOND
// gate failure this one note caused, and `SupportStaffTab.vue` carries the same warning for the same
// reason. `tests/template-copy-rules.test.ts` cuts the file at the FIRST occurrence of that literal,
// so a comment that merely MENTIONS the tag moves the region up and drags every legitimate
// script-side Cyrillic quote in this file into the check - here, the owner's «чуть меньше размером»
// on the `size` prop, which has been sitting there untouched since round 41 #28. Name the tag in
// words, as this paragraph does.
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 0..1. Clamped here, so no caller can hand the arc a number that draws past the circle. */
    value: number
    /** 36 is round 41 #28's – the build-progress ring on a shop tile's art corner, «чуть меньше
     *  размером, чем на главной» in the owner's own words, so it sits under Home's 46. */
    size?: 36 | 46 | 56
    /** The stroke colour of the arc. Anything CSS accepts; the ramp is the caller's decision. */
    color?: string
    /** `[from, to]` – paints the arc with a two-stop gradient down the box instead of `color`. */
    gradient?: [string, string] | null
    /** sweep anticlockwise from twelve o'clock instead of clockwise – the SIGN, as a shape. */
    mirrored?: boolean
    /** What the ring says out loud. A ring is a picture, so it must have one. */
    label: string
    /** Sitting ON a photograph: adds the drop shadow under the ring and the on-art text shadow. */
    onArt?: boolean
  }>(),
  { size: 46, color: 'var(--accent)', gradient: null, mirrored: false, onArt: false },
)

/** ⚠ ONE GRADIENT ID PER MOUNTED RING, because `url(#id)` resolves to the FIRST match in the
 *  document and the coach market draws sixteen of these at once. `useId` is Vue's own per-instance
 *  id and is stable across a re-render, so the arc cannot lose its paint when the value moves. */
const gradId = `tb-ring-grad-${useId()}`
/** What the arc is painted with: the gradient when there is one, the flat colour otherwise. */
const stroke = computed(() => (props.gradient ? `url(#${gradId})` : props.color))

/** The export's geometry, for both sizes: a 3px stroke inset by half of it plus a hair. */
const STROKE = 3
const geom = computed(() => {
  const box = props.size
  const r = box === 56 ? 24 : box === 46 ? 19 : 15
  return { box, r, c: Math.round(2 * Math.PI * r * 10) / 10 }
})
const offset = computed(() => {
  const pct = Math.max(0, Math.min(1, props.value))
  return Math.round(geom.value.c * (1 - pct) * 10) / 10
})

/** The arc's own transform. `rotate(-90)` puts the dash's start at twelve o'clock, as it always has;
 *  `mirrored` adds a horizontal flip about the box's centre line, which turns the same sweep
 *  anticlockwise without touching the dash arithmetic. The circle is centred, so the flip moves no
 *  pixel of the track. */
const arcTransform = computed(() => {
  const box = geom.value.box
  const spin = `rotate(-90 ${box / 2} ${box / 2})`
  return props.mirrored ? `translate(${box} 0) scale(-1 1) ${spin}` : spin
})
</script>

<template>
  <span
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
      <!-- `userSpaceOnUse` from the top of the box to the bottom: the ramp is a fact about WHERE ON
           THE RING a point is, so a short arc reads the light end and a long one reaches the bright
           end, whichever way it sweeps. In `objectBoundingBox` the stops would be relative to the
           stroke's own bounds and a small arc would show the whole ramp inside itself. -->
      <defs v-if="gradient">
        <linearGradient :id="gradId" gradientUnits="userSpaceOnUse" :x1="0" :y1="0" :x2="0" :y2="geom.box">
          <stop offset="0" :stop-color="gradient[0]" />
          <stop offset="1" :stop-color="gradient[1]" />
        </linearGradient>
      </defs>
      <circle :cx="geom.box / 2" :cy="geom.box / 2" :r="geom.r" class="tb-ring-track" :stroke-width="STROKE" />
      <!-- ⭐⭐ AT ZERO THERE IS NOTHING TO CAP, AND THAT IS §8a's NEUTRAL RULE MADE STRUCTURAL.
           `stroke-dasharray="c"` with `dashoffset="c"` leaves a dash of length zero - and a
           zero-length dash under a ROUND cap is exactly the trick that draws dotted lines, so the
           ring at rest was able to paint a dot at twelve o'clock. The owner's constraint on the
           chemistry gauge is that at rest it must read «nothing has happened yet» and never «the
           first step of the bad colour»; a butt cap at zero is that sentence in one attribute. The
           element stays rather than being `v-if`d away, so the arc's own transition survives a value
           crossing zero. -->
      <circle
        :cx="geom.box / 2"
        :cy="geom.box / 2"
        :r="geom.r"
        class="tb-ring-arc"
        :stroke="stroke"
        :stroke-width="STROKE"
        :stroke-linecap="value > 0 ? 'round' : 'butt'"
        :stroke-dasharray="geom.c"
        :stroke-dashoffset="offset"
        :transform="arcTransform"
      />
    </svg>
    <span class="tb-ring-value"
      ><slot
        ><b>{{ Math.round(value * 100) }}</b><i>%</i></slot
      ></span
    >
  </span>
</template>

<style scoped>
.tb-ring {
  display: block;
  position: relative;
  flex: none;
}

.tb-ring--36 {
  width: 36px;
  height: 36px;
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
   one-size optical correction; 26% of the box is the same LOOK at both.

   ⚠⚠⚠ ROUND 45 #3 – AND THE NUDGE ALONE WAS NEVER ENOUGH, BECAUSE IT SILENTLY DEPENDED ON THE HOST.
   The owner, on the deployed build: «проверить выравнивание шрифта внутри гауджа – я вижу знак
   вопроса и он стоит выше середины». He is right, and the question mark is not the cause - it is
   simply the glyph that is alone in an empty ring, where a 2px error is unmissable.

   WHAT WAS ACTUALLY WRONG. Where the figure lands inside this box is decided by three things: the
   26% nudge, the glyph's own baseline, and THE LINE BOX THE GLYPH SITS IN - and until this commit
   the third of those was inherited from whatever element happened to host the ring. Both of the
   inherited halves come from `body` (`font: 15px/1.45 var(--font-body)`) and neither of them crosses
   a `<button>`: the app's global `button` rule sets a colour, a border, a radius, a padding and a
   size, and no `line-height` and no `font-family`, so inside a button both fall back to the user
   agent's form-control defaults. Home, the Season card and the Calendar host their rings in ordinary
   elements and were always right; the coach market's marker is in the bottom-right corner of a row
   that IS one `<button>`, so its leading collapsed from 1.45 to `normal` and its type changed with
   it - and the smaller line box lifts the baseline by half the difference.

   MEASURED IN A REAL BROWSER against this sheet and these self-hosted faces, as the ink centre minus
   the ring's centre in px - negative means the glyph sits HIGH. Each arm was applied and removed in
   one clean-room page and the restored arm reproduced the shipped row exactly, so the toggle is real:

       host                         36px ?   36px figure   46px figure   56px figure
       an ordinary element           -0.04      +0.05         +0.06         -1.06
       a button, as shipped          -1.98      -1.88            –             –
       a button, leading declared    -0.48      -0.38            –             –
       a button, leading AND face    -0.04      +0.05            –             –

   So the defect is ~2px on a 36px ring, which is exactly what «выше середины» looks like; the leading
   is three quarters of it and the face is the rest. The fix is to stop borrowing: the ring declares
   the leading and the face the 26% nudge was fitted against, and is then the same picture in every
   host. ⚠ THE RINGS THAT ARE ALREADY RIGHT DO NOT MOVE - the two declarations are exactly what they
   were inheriting there, so the ordinary-element row above is byte-identical in all four arms.
   ⚠ 1.45 IS `body`'s OWN LEADING, restated rather than chosen; `--font-body` likewise.
   ⚠ AND THE 56px RING'S -1.06 IS NOT THIS ITEM'S and is deliberately left alone: it is the same
   small size-to-size drift the ⚠ above describes, it is on a ring nobody complained about, and
   moving it would be retuning a correction the owner has already approved on screen. */
.tb-ring-value {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.5px;
  padding-top: 26%;
  color: var(--ink);
  font-family: var(--font-body);
  line-height: 1.45;
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

/* The 36px ring scales the pair the same way 56 does – proportionally, so the figure keeps the
   same look at every size (the 26% nudge above is already proportional by its own ⚠ note). */
.tb-ring--36 .tb-ring-value :deep(b) {
  font-size: 12px;
}

.tb-ring--36 .tb-ring-value :deep(i) {
  font-size: 8.5px;
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
