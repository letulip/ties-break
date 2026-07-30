<script lang="ts">
// THE SKILLS RADAR – "talent is discovered", drawn.
//
// decisions.md, round-3 Q&A item 11 (owner): «Radar chart (Phase 4): axes without numbers; contour
// sharpens as coach confidence grows (fog-of-war stats) - radar that respects "talent is
// discovered"». The Kid screen has carried a `Skills & development – Phase 4` placeholder ever
// since, and design C is where it finally lands.
//
// WHAT IT DRAWS, and why it is two shapes and not one (docs/specs/skills-radar.md §1):
//
//   THE INNER CONTOUR   where she IS, as far as anyone can tell. A solid line, with a FOG around it
//                       whose width is how wrong that estimate might be. It converges on the truth.
//   THE OUTER HAZE      how far she COULD go: the band between `ceilingLo` and `ceilingHi`. It
//                       narrows as evidence accumulates but never below a floor width, so a patient
//                       player learns the RANGE and never the number. You finish the career still
//                       not certain how good she could have been - which is the honest thing, and
//                       the thesis of the whole game rendered as a picture.
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
import { SKILL_KEYS, type SkillKey } from '../engine/development'
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
// ⚠ 300 WIDE, WAS 240, AND IT IS MEASURED RATHER THAN GUESSED. Five spokes put two labels on each
// flank instead of one, at shallower angles than the old four did, and the longest word on the
// picture ("Groundstrokes", ~74px at this font) is end-anchored on the left flank at x = CX - 1.16R.
// At the old 240/CX=120 that ran off the left edge of the viewBox. The svg is
// `width: 100%; max-width: 300px`, so a wider viewBox costs a fraction of scale and nothing else -
// which is cheaper than shortening a word a player reads in order to keep a number in a file.
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

const clamp = (v: number): number => Math.max(0, Math.min(100, v))

function pointAt(index: number, value: number): [number, number] {
  const angle = (-90 + index * STEP_DEG) * (Math.PI / 180)
  const r = (clamp(value) / 100) * R
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
/** The haze's OUTER EDGE, drawn as a hairline as well as a blur. Without it, an early career - when
 *  the fog around the contour and the haze beyond it genuinely overlap - reads as one undifferen-
 *  tiated glow, and the whole "two shapes, two questions" idea is lost at the exact moment it
 *  matters most. It is a range boundary and not a number, so it is inside the ruling: spec §3's
 *  guard against reverse-engineering is the FLOOR WIDTH of the band, not the invisibility of its
 *  edge - "you learn the range, never the number". */
const ceilingEdge = computed(() => polygon(ordered.value.map((a) => a.ceilingHi)))

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
const spokes = computed(() => ORDER.map((_, i) => pointAt(i, 100)))
const guideOuter = polygon(ORDER.map(() => 100))
const guideInner = polygon(ORDER.map(() => 50))

/** Where a word sits: outside the outer ring, on its own axis. */
const labels = computed(() =>
  ordered.value.map((a, i) => {
    const [x, y] = pointAt(i, 100)
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

      <!-- HOW FAR SHE COULD GO: the outer haze, blurred, with a hairline on its far edge so the
           range is legible even while it overlaps the fog below it. -->
      <path class="radar-ceiling" :d="ceilingPath" fill-rule="evenodd" filter="url(#radar-haze)" />
      <path class="radar-ceiling-edge" :d="ceilingEdge" />

      <!-- HOW WRONG WE MIGHT BE about where she is: the fog hugging the contour. -->
      <path class="radar-fog" :d="fogPath" fill-rule="evenodd" filter="url(#radar-fog)" />

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

    <!-- WHAT STANDS IN FOR THE NUMBERS. One sentence per axis he has read; nothing for the rest. -->
    <ul v-if="notes.length" class="radar-notes">
      <li v-for="n in notes" :key="n.key">
        <span class="radar-note-axis">{{ n.label }}</span>
        <span class="radar-note-text">{{ n.note }}</span>
      </li>
    </ul>
    <p v-else class="radar-quiet">Too early to say. He is still learning what she has.</p>
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

/* BOTH BANDS ARE THE ONE ACCENT at two strengths, per the design's second principle - a second hue
   here would say "these are two different KINDS of thing", and they are not: they are the same
   uncertainty at two distances. */
.radar-ceiling {
  fill: rgba(var(--accent-rgb), 0.15);
}

/* Dashed, and at a third of the contour's weight: an edge you can find but never mistake for the
   solid line, which is the one statement on this picture that is meant to be read as a fact. */
.radar-ceiling-edge {
  fill: none;
  stroke: rgba(var(--accent-rgb), 0.28);
  stroke-width: 1;
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

.radar-note-axis {
  flex: none;
  width: 68px;
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
