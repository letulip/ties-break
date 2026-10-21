<script setup lang="ts">
// THE WEATHER PLATE – the sun and the temperature, as ONE LINE (owner, 29.07).
//
// WHY THIS IS A COMPONENT AND NOT A SECOND SPAN. The Season card already draws this exact fact
// (`.event-weather` in SeasonScreen.vue: a 17px inline sun over `{{ temperatureC }}°`), and screen
// I now wants it too. Two surfaces showing the same fact must look like the same fact, so the
// glyph and the colour roles live here once instead of being copied and then drifting.
// SeasonScreen has NOT been ported onto this yet - it belongs to another screen's owner in this
// wave, and porting it is a two-line change whenever they take it.
//
// THE DATA IS REAL AND ALREADY SHIPS. `eventTemperature(seed, event)` (engine/season/preview.ts)
// draws on its own `seed:weather:<event.id>` sub-stream, so it can never perturb the simulation,
// and it is keyed on the EVENT - the same tournament renders the same day every time, on every
// screen that shows it. Bands are loosely seasonal by surface (grass 19-29, clay 16-28, hard
// 12-26). It is decoration today and `tests/preview.test.ts` guards that the engine never reads it.
//
// WHEN A REAL WEATHER MODEL ARRIVES, NOTHING HERE CHANGES - different data renders through the
// same plate. That is the owner's whole reason for building it on the existing field now.
//
// WIND. There is none in the engine, in any form (no wind, no rain, no humidity, no indoor flag –
// `docs/decisions.md` §14 files the lot as Phase 3/4 backlog). So no wind figure is drawn. The
// SHAPE is what leaves room for it: this is a horizontal row of readings, and wind joins it as a
// second item beside the temperature without the line changing shape.
// ⭐ ROUND 53 · STEP 10 (weather stage 1) – THE SECOND AND THIRD ITEM THIS PLATE WAS BUILT FOR.
// Wind and rain join the temperature as glyph + word, only when the day has them (`none` prints
// nothing, so a calm dry day looks exactly as it did). Both come from `EventWeather`
// (engine/season/preview.ts) as the engine drew them; the words are display readers over the enum.
// A fact on a plate and nothing more: no part of the match reads either.
import { computed } from 'vue'
import { t } from '../../i18n'
import type { RainState, WindLevel } from '../../engine/season/preview'

const props = withDefaults(
  defineProps<{
    /** degrees Celsius, from EventPreview.temperatureC – never re-derived at a call site */
    temperatureC: number
    /** figure size in px; the sun scales with it. 17 is the Season card's, 13 an overlay's. */
    size?: number
    /** on a photograph, where the export puts the scrim shadow under every reading. */
    onArt?: boolean
    /** from EventWeather; absent for a caller with none, and then the plate is the one it was */
    wind?: WindLevel
    rain?: RainState
  }>(),
  { size: 17, onArt: false, wind: 'none', rain: 'none' },
)

const windWord = computed(() => (props.wind === 'strong' ? t('Strong wind') : props.wind === 'fresh' ? t('Fresh wind') : ''))
const rainWord = computed(() => (props.rain === 'falling' ? t('Rain') : props.rain === 'possible' ? t('Rain possible') : ''))
</script>

<template>
  <span
    class="tb-weather"
    :class="{ 'on-art': onArt }"
    :style="{ fontSize: `${size}px`, '--tb-weather-glyph': `${size}px` }"
  >
    <!-- The Season card's own sun, verbatim: a 24-unit viewBox drawn in strokes so it takes
         whatever colour and size it is handed. `currentColor` on the <svg> is overridden below so
         the sun stays amber while the figure beside it stays ink - that contrast is what makes it
         read as a sun rather than as an icon. -->
    <svg
      class="tb-weather-sun"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4.2"></circle>
      <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6"></path>
    </svg>
    <span>{{ temperatureC }}&deg;</span>
    <span v-if="windWord" class="tb-weather-extra tb-weather-wind">
      <svg class="tb-weather-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
        <path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8"></path>
      </svg>
      {{ windWord }}
    </span>
    <span v-if="rainWord" class="tb-weather-extra tb-weather-rain">
      <svg class="tb-weather-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
        <path d="M7 14a4 4 0 0 1 .6-7.9A5 5 0 0 1 17 7a3.5 3.5 0 0 1 0 7H7zM8 17.5l-1 2.5M12 17.5l-1 2.5M16 17.5l-1 2.5"></path>
      </svg>
      {{ rainWord }}
    </span>
  </span>
</template>

<style scoped>
.tb-weather {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: none;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  /* The FIGURE is ink, the SUN is amber (owner, 28.07: the reading is a reading like every other
     reading on these screens; only the sun keeps the warm colour). `.event-weather` writes the
     figure as a bare #ffffff because the sheet has no pure-white token to reach for; --text is the
     app's primary ink and the nearest thing it does declare. Worth reconciling when Season ports. */
  color: var(--text);
}

.tb-weather.on-art {
  text-shadow: var(--shadow-text-on-art);
}

.tb-weather-extra {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  font-size: 0.92em;
}

.tb-weather-glyph {
  width: var(--tb-weather-glyph);
  height: var(--tb-weather-glyph);
  flex: none;
  opacity: 0.85;
}

.tb-weather-sun {
  width: var(--tb-weather-glyph);
  height: var(--tb-weather-glyph);
  flex: none;
  color: var(--amber);
}
</style>
