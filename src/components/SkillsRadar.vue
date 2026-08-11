<script lang="ts">
// THE SKILLS RADAR – "talent is discovered", drawn.
//
// decisions.md, round-3 Q&A item 11 (owner): «Radar chart (Phase 4): axes without numbers; contour
// sharpens as coach confidence grows (fog-of-war stats) - radar that respects "talent is
// discovered"». The Kid screen has carried a `Skills & development – Phase 4` placeholder ever
// since, and design C is where it finally lands.
//
// WHAT IT DRAWS, and why it is three shapes and not one (docs/specs/skills-radar.md §1):
//
//   THE START CONTOUR   where she BEGAN - her week-one build, read by the same eye and through the
//                       same fog. Faint, and always inside the solid line on a girl who has improved.
//   THE INNER CONTOUR   where she IS, as far as anyone can tell. A solid line, with a FOG around it
//                       whose width is how wrong that estimate might be. It converges on the truth.
//   THE OUTER HAZE      how far she COULD go: the band between `ceilingLo` and `ceilingHi`. It
//                       narrows as evidence accumulates but never below a floor width, so a patient
//                       player learns the RANGE and never the number. You finish the career still
//                       not certain how good she could have been - which is the honest thing, and
//                       the thesis of the whole game rendered as a picture.
//
// ⚠ THE FIRST OF THOSE ARRIVED ON 11.08 AND IT IS WHY THE PICTURE STOPPED BEING A VERDICT. With only
// the last two, a live career reads as already over: the owner's own girl at seventeen had between
// 1.3 and 7.3 points of headroom left on her five wings, so the chart drew five slivers and said
// nothing at all about the twelve points her RETURN had gained getting there. She is 255th in the
// world and paying her way. Owner: «на розе как раз показывать "старт" - т.е. с чего начала, может
// быть так будет приятнее и нагляднее». It needs no storage and no migration - `startValue` is
// derived at snapshot time from the seed, like every other number on this object.
//
// NO NUMBERS. Not on the axes, not in a tooltip, not in the aria-label. That is the owner's ruling
// and it is the reason this element exists at all - a radar with digits on it is a stat block, and
// a stat block says "here is what she is" to a parent whose entire predicament is not knowing. What
// stands in for the numbers is the COACH'S SENTENCE per axis (`note`), in the same voice as the
// coach note on Home: one voice, two surfaces.
//
// THIS COMPONENT IS PRESENTATION ONLY. It derives nothing, it knows no skills, it never sees the
// true values: it is handed `RadarAxis[]` and lays it out.
//
// ⚠ THE LOCAL TYPE BLOCK IS GONE, exactly as the note that stood here promised it would be: "when
// the engine puts `radar: RadarAxis[]` on the Snapshot, the type moves to protocol.ts and this block
// is deleted". The engine slice landed, `RadarAxis` lives in `src/shared/protocol.ts` keyed on the
// engine's own `SkillKey`, and KidScreen has been feeding this the real snapshot rows ever since -
// so the copy here had become a SECOND definition of the axis union that nothing kept in step. v25's
// fifth attribute is what made that latent: the engine grew an axis the component's own union could
// not name, and the two would have disagreed silently in a `.find()` that returned undefined.
//
// ⚠ FIVE AXES SINCE v25, NOT FOUR (owner, 30.07; docs/specs/skills-radar.md §5). Nothing about the
// fog model moved - the geometry below is derived from `SKILL_KEYS.length`, so the polygon follows
// the engine rather than being told separately how many corners to have.
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { RADAR_AXIS_LABEL } from '../engine/radar'
import { SKILL_CEILING_MAX, SKILL_KEYS, type SkillKey } from '../engine/development'
import type { RadarAxis } from '../shared/protocol'

const props = defineProps<{
  axes: readonly RadarAxis[]
  /** Named for screen readers, because a picture with no name is a picture nobody can read. */
  title: string
}>()

/** The words on the axes, READ OUT OF THE ENGINE (`RADAR_AXIS_LABEL`) rather than copied. Its own
 *  comment gives the reason - a second copy in a screen is a second chance for two surfaces to call
 *  the same thing different things, and `ret` must never reach a player as an engine field name. */
const AXIS_LABEL: Record<SkillKey, string> = RADAR_AXIS_LABEL

// The box. Wider than it is tall because the horizontal labels need room the vertical ones do not,
// and a viewBox is free.
//
// ⚠ 300 WIDE, WAS 240, AND IT IS MEASURED IN THE BROWSER RATHER THAN GUESSED. Five spokes put two
// labels on each flank instead of one, at shallower angles than the old four did, and the longest word
// on the picture ("Groundstrokes", 96px at this font) is end-anchored on the left flank at
// x = CX + 1.16R*cos(198deg). At the old 240/CX=120 it ran off the left edge. The svg is
// `width: 100%; max-width: 300px` with `overflow: visible`, so a wider viewBox costs a fraction of
// scale and nothing else - which is cheaper than shortening a word a player reads in order to keep a
// number in a file. radar.test.ts §12 pins the two structural halves of this (the box is centred on
// CX; the overflow stays visible) and says why the third is a browser measurement.
const CX = 150
const CY = 92
const R = 62

/** Draw order is fixed by the contract, not by the order a caller happens to pass - and it is the
 *  ENGINE's order (`SKILL_KEYS`), which is the order every other surface lists her attributes in.
 *  Serve is up, and the rest follow clockwise, on every render of every career. */
const ORDER: readonly SkillKey[] = SKILL_KEYS
const ordered = computed<RadarAxis[]>(() =>
  ORDER.map((k) => props.axes.find((a) => a.key === k)).filter((a): a is RadarAxis => !!a),
)

/** Degrees between spokes - 90 at four axes, 72 at five. Derived, so the polygon can never end up
 *  drawing a different number of corners from the number of rows it was handed. */
const STEP_DEG = 360 / ORDER.length

/** ⚠ WHERE THE OUTER RING IS, AND IT IS NOT 100. The picture used to plot 0..100, and nothing this
 *  game can produce goes past `SKILL_CEILING_MAX` - the top of the starting band plus the top of
 *  `ECONOMY.development.potentialBand`, which is 86 today. So the outer SEVENTH of every rose was
 *  unreachable in every career for every seed, and the best girl the engine can roll still looked
 *  like she had a long way to climb. Owner, 11.08: «если мы до 100 вообще не можем дорасти, то явно
 *  имеет смысл цену деления пересмотреть на графике, чтобы максимумы упирались в максимумы».
 *
 *  ⚠ IT IS IMPORTED, NEVER WRITTEN DOWN HERE. The constant is DERIVED in the engine from the two
 *  numbers it is the sum of, precisely so that widening `potentialBand` - a live question - moves
 *  this picture on the same commit. A literal 86 in this file would go out of date silently.
 *
 *  ZERO STAYS AT THE CENTRE. Only the top moved: a skill of 30 must not read as nothing. */
const AXIS_MAX = SKILL_CEILING_MAX

/** The contract's own range, which is 0..100 whatever the ring is drawn at - so a value the engine
 *  clamps at 100 (a very wide haze early on) draws OUTSIDE the ring rather than being flattened onto
 *  it. Explicitly allowed: «Блюр при этом может и за границы оверлапом выходить, не вижу проблем». */
const clamp = (v: number): number => Math.max(0, Math.min(100, v))

function pointAt(index: number, value: number): [number, number] {
  const angle = (-90 + index * STEP_DEG) * (Math.PI / 180)
  const r = (clamp(value) / AXIS_MAX) * R
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)]
}

function polygon(values: number[]): string {
  return (
    values
      .map((v, i) => {
        const [x, y] = pointAt(i, v)
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
      })
      .join(' ') + ' Z'
  )
}

/** An irregular annulus: the outer shape with the inner one punched out of it (fill-rule evenodd,
 *  so a point inside BOTH subpaths falls out of the fill). This is how both bands are drawn - the
 *  ceiling haze and the fog around the contour are the same object at two radii. */
function ring(outer: number[], inner: number[]): string {
  return `${polygon(outer)} ${polygon(inner)}`
}

const corePath = computed(() => polygon(ordered.value.map((a) => a.shownValue)))
/** WHERE SHE BEGAN. Same eye, same fog, so on a girl who has only improved this sits INSIDE the solid
 *  contour on every axis - the engine's `readAs` carries one misreading for both, which is what makes
 *  the gap between the two shapes a real distance rather than two independent guesses. */
const startPath = computed(() => polygon(ordered.value.map((a) => a.startValue)))
const fogPath = computed(() =>
  ring(
    ordered.value.map((a) => a.shownValue + a.band),
    ordered.value.map((a) => a.shownValue - a.band),
  ),
)
const ceilingPath = computed(() =>
  ring(
    ordered.value.map((a) => a.ceilingHi),
    ordered.value.map((a) => a.ceilingLo),
  ),
)
// ⚠⚠ THE HAZE'S DASHED OUTER EDGE IS GONE (owner, 11.08), AND THE ARGUMENT FOR IT IS KEPT HERE
// BECAUSE IT WAS A GOOD ONE AND IT LOST. What stood here said: draw `ceilingHi` as a hairline as well
// as a blur, because in an early career the fog around the contour and the haze beyond it genuinely
// overlap and would otherwise read as one undifferentiated glow - and a line is a range boundary, not
// a number, so spec §3's guard (the FLOOR WIDTH of the band) was untouched by it.
//
// WHAT THAT MISSED is what a drawn line SAYS, as opposed to what it encodes. Owner: «контур
// "безнадежности" текущий надо убрать… мы знаем в игре её потолок, потому что он запрограммирован
// нами, но в жизни потолок можно только по прогрессу в играх увидеть. Заблюренная зона это ок.» A
// soft region reads as "somewhere out there"; a crisp polygon reads as a decision that has already
// been taken about her, which is exactly the thing this game is built not to say. The blur stays and
// the edge goes. `ceilingPath` above is untouched - the range is still drawn, it just has no border.
//
// ⚠ THE LEGEND (R15-15) OUTLIVED IT AND IS BUILT TO THE SAME THREE RULES. Owner, 09.08: «а что
// значит пунктирная линия на нашей розе скиллов?» The drawing was right and this file's comments
// explained it perfectly - to a reader of the source. Nothing on the screen did. The `.radar-legend`
// block in the template is the fix:
//
//  1. ONE KEY PER SHAPE, AND THERE ARE NOW THREE. "Where she started", "Where she is", "How far she
//     could go" - the headings of this file's own header, verbatim, so the legend and the drawing can
//     never drift into calling one thing two names.
//  2. THE SWATCH IS THE REAL PAINT. Each key wears the SAME class as the thing it explains
//     (`radar-start` / `radar-core` / `radar-ceiling`), and the two contour keys carry the same
//     `sharpness` binding. A restyled contour restyles its own key; a legend that lies about the
//     picture is not constructible. Hand-picked swatch colours would drift on the next restyle. The
//     haze's key is a filled rect rather than a line for the same reason it no longer has an edge: it
//     is a region, and drawing its key as a stroke would put the line back in miniature.
//  3. THE DESIGN'S SECOND PRINCIPLE, IN WORDS. Every shape here is one accent at a different
//     strength, never a second hue, "because they are the same uncertainty at two distances" - so the
//     caption under the keys says exactly that ("the fainter it is, the less anyone can tell").
//
// It carries no numbers, which keeps it inside decisions.md #11 along with everything else here.

/** HOW SHARPLY THE CONTOUR IS DRAWN. decisions.md #11 is not "a shape plus a fog", it is «contour
 *  sharpens as coach confidence grows» - so the LINE has to soften too, or the picture says
 *  "we know exactly where she is, give or take a lot", which is a contradiction rather than a
 *  reading. Derived from the fog the contract already carries, so it needs no extra field: a wide
 *  band draws a line you can see through, a narrow one draws a line you can trust. */
const sharpness = computed(() => {
  const axes = ordered.value
  if (!axes.length) return 1
  const mean = axes.reduce((sum, a) => sum + Math.max(0, a.band), 0) / axes.length
  return Math.max(0.5, Math.min(1, 1 - mean / 60))
})

/** The spokes and the two guide rings. Decoration, and deliberately faint: they are there so the
 *  shape reads as a measurement rather than as a blob, not so anything can be counted off them. */
const spokes = computed(() => ORDER.map((_, i) => pointAt(i, AXIS_MAX)))
const guideOuter = polygon(ORDER.map(() => AXIS_MAX))
const guideInner = polygon(ORDER.map(() => AXIS_MAX / 2))

/** Where a word sits: outside the outer ring, on its own axis. */
const labels = computed(() =>
  ordered.value.map((a, i) => {
    const [x, y] = pointAt(i, AXIS_MAX)
    const dx = x - CX
    const dy = y - CY
    return {
      key: a.key,
      text: AXIS_LABEL[a.key],
      x: CX + dx * 1.16,
      y: CY + dy * 1.16 + (dy > 1 ? 12 : dy < -1 ? -6 : 4),
      anchor: dx > 1 ? 'start' : dx < -1 ? 'end' : 'middle',
    }
  }),
)

/** The coach's sentences, in axis order, skipping the axes he has nothing to say about. `note` is
 *  null on purpose and often - silence is the honest state early, and it is what the fog is for. */
const notes = computed(() =>
  ordered.value
    .filter((a) => !!a.note)
    .map((a) => ({ key: a.key, label: AXIS_LABEL[a.key], note: a.note as string })),
)
</script>

<template>
  <div class="radar">
    <!-- The picture carries no numbers, so its accessible name carries none either. -->
    <svg class="radar-svg" viewBox="0 0 300 194" role="img" :aria-label="title">
      <defs>
        <filter id="radar-fog" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="3.4" />
        </filter>
        <filter id="radar-haze" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      <g class="radar-grid" aria-hidden="true">
        <path :d="guideOuter" />
        <path :d="guideInner" />
        <line v-for="([x, y], i) in spokes" :key="i" :x1="CX" :y1="CY" :x2="x" :y2="y" />
      </g>

      <!-- HOW FAR SHE COULD GO: the outer haze, blurred, and with NO edge on it - a region, never a
           boundary. It is allowed to spill past the outer ring; see AXIS_MAX. -->
      <path class="radar-ceiling" :d="ceilingPath" fill-rule="evenodd" filter="url(#radar-haze)" />

      <!-- HOW WRONG WE MIGHT BE about where she is: the fog hugging the contour. -->
      <path class="radar-fog" :d="fogPath" fill-rule="evenodd" filter="url(#radar-fog)" />

      <!-- WHERE SHE BEGAN. Drawn UNDER the solid contour, because on a career that has gone forward
           it lies inside it, and the story of the picture is read from the inside out. -->
      <path
        class="radar-start"
        :d="startPath"
        :style="{ strokeOpacity: 0.55 * sharpness, strokeWidth: `${(1.2 + 0.7 * sharpness).toFixed(2)}px` }"
      />

      <!-- WHERE SHE IS, as far as anyone can tell. The only hard line in the picture - and how hard
           it is drawn is itself the reading: see `sharpness`. -->
      <path
        class="radar-core"
        :d="corePath"
        :style="{ strokeOpacity: sharpness, strokeWidth: `${(1.2 + 0.7 * sharpness).toFixed(2)}px` }"
      />

      <text
        v-for="l in labels"
        :key="l.key"
        class="radar-axis-label"
        :x="l.x"
        :y="l.y"
        :text-anchor="l.anchor"
      >
        {{ l.text }}
      </text>
    </svg>

    <!-- THE LEGEND (R15-15). Three keys because the picture is three shapes; the swatches are the
         REAL paint, wearing the same classes as the shapes they stand for. The owner's question and
         the whole argument are in the script block above - see the note where `ceilingEdge` was. -->
    <ul class="radar-legend">
      <li>
        <svg class="radar-key" viewBox="0 0 24 6" aria-hidden="true">
          <path
            class="radar-start"
            d="M1 3 H23"
            :style="{ strokeOpacity: 0.55 * sharpness, strokeWidth: `${(1.2 + 0.7 * sharpness).toFixed(2)}px` }"
          />
        </svg>
        <span>Where she started</span>
      </li>
      <li>
        <svg class="radar-key" viewBox="0 0 24 6" aria-hidden="true">
          <path
            class="radar-core"
            d="M1 3 H23"
            :style="{ strokeOpacity: sharpness, strokeWidth: `${(1.2 + 0.7 * sharpness).toFixed(2)}px` }"
          />
        </svg>
        <span>Where she is</span>
      </li>
      <li>
        <svg class="radar-key" viewBox="0 0 24 6" aria-hidden="true">
          <rect class="radar-ceiling" x="1" y="0.5" width="22" height="5" rx="1.5" />
        </svg>
        <span>How far she could go</span>
      </li>
    </ul>
    <p class="radar-legend-note">The fainter it is, the less anyone can tell.</p>

    <!-- WHAT STANDS IN FOR THE NUMBERS. One sentence per axis the coach has read; nothing for the
         rest. R15-7: no pronoun names the coach on this screen either - women are on every roster by
         construction, and the quiet line used to call one of them "he". -->
    <ul v-if="notes.length" class="radar-notes">
      <li v-for="n in notes" :key="n.key">
        <span class="radar-note-axis">{{ n.label }}</span>
        <span class="radar-note-text">{{ n.note }}</span>
      </li>
    </ul>
    <p v-else class="radar-quiet">Too early to say – still learning what she has.</p>
  </div>
</template>

<style scoped>
.radar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.radar-svg {
  display: block;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  overflow: visible;
}

.radar-grid path {
  fill: none;
  stroke: var(--line);
  stroke-width: 1;
}

.radar-grid line {
  stroke: var(--line);
  stroke-width: 1;
}

/* EVERY SHAPE HERE IS THE ONE ACCENT at a different strength, per the design's second principle - a
   second hue would say "these are two different KINDS of thing", and they are not: they are the same
   uncertainty at two distances, and (since 11.08) the same girl at two moments. */
.radar-ceiling {
  fill: rgba(var(--accent-rgb), 0.15);
}

/* WHERE SHE BEGAN: the same accent again, dashed and unfilled. Dashed because it is a line about the
   PAST and must never be mistaken for the one statement on this picture meant to be read as a fact;
   unfilled because it sits inside the contour's own translucent fill and a second wash there would
   just darken the middle of the rose. (The dash pattern is the one the deleted ceiling edge wore -
   the ink is reused, the claim is not: a boundary drawn around what she WAS is a fact, and a boundary
   drawn around what she COULD BE was a verdict.) */
.radar-start {
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.4;
  stroke-dasharray: 3 4;
  stroke-linejoin: round;
}

.radar-fog {
  fill: rgba(var(--accent-rgb), 0.26);
}

.radar-core {
  fill: rgba(var(--accent-rgb), 0.12);
  stroke: var(--accent);
  stroke-width: 1.8;
  stroke-linejoin: round;
}

.radar-axis-label {
  fill: var(--ink-soft);
  font-family: var(--font-body);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

/* THE LEGEND. One row, centred under the picture, in the same small-caps hand the axis labels of the
   note list use - it is chrome for the drawing, so it must not out-shout the coach's sentences below
   it. `flex-wrap` because two labels plus their keys are ~230px and the narrowest frame is 390 minus
   the screen's own padding. */
.radar-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 16px;
}

.radar-legend li {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

/* The swatch box. `overflow: visible` for the same reason the picture has it - a 1.9px stroke on a
   6-unit-tall viewBox rounds outward.

   ⚠ THE KEYS BORROW `.radar-start`, `.radar-core` AND `.radar-ceiling`, so they inherit their FILL
   too - and the core's is a translucent accent. On a two-point path the fill area is zero, so it
   draws nothing; that is stated rather than relied on silently, because the day a key becomes a
   polygon it will suddenly have a filled interior nobody asked for. The haze's key is the opposite
   case and is deliberately a `<rect>`: `.radar-ceiling` is a FILL with no stroke at all, so a line
   wearing it would draw literally nothing. */
.radar-key {
  display: block;
  width: 24px;
  height: 6px;
  flex: none;
  overflow: visible;
}

.radar-legend-note {
  /* Pulled up out of the column's 10px gap so the caption reads as part of the legend rather than
     floating equidistant between the keys above it and the coach's sentences below. */
  margin: -4px 0 0;
  text-align: center;
  font-family: var(--font-hand);
  font-size: 13px;
  line-height: 1.2;
  color: var(--ink-soft);
}

.radar-notes {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.radar-notes li {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

/* ⚠ 100px, WAS 68, AND IT IS MEASURED. The width is fixed so the five sentences align down a common
   left edge - that is the whole reason it is not `auto`. 68px fitted the longest label the engine
   could produce until v25 ("Composure", 69px, already one pixel over); "Groundstrokes" measures 96px
   at this size/weight/tracking and was rendering straight over the sentence beside it - caught in the
   browser, not by the suite, which is why radar.test.ts §12 now budgets this number against
   RADAR_AXIS_LABEL. 100 rather than exactly 96 so the next word does not have to be shorter than the
   longest one we happen to ship. The sentence column keeps 220px on a 390px frame, which the 16px
   hand font already wraps at. */
.radar-note-axis {
  flex: none;
  width: 100px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

.radar-note-text {
  flex: 1;
  min-width: 0;
  font-family: var(--font-hand);
  font-size: 16px;
  line-height: 1.25;
  color: var(--ink-2);
  text-wrap: pretty;
}

.radar-quiet {
  margin: 0;
  font-family: var(--font-hand);
  font-size: 16px;
  line-height: 1.25;
  color: var(--ink-soft);
}
</style>
