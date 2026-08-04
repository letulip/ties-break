<script setup lang="ts">
// THE EPILOGUE – THE ALBUM. Seven polaroids, turned one at a time, then the record underneath and
// an offer at the end (career-contract-v1.md §9, the owner's own page).
//
// It is a TAKEOVER rather than a screen: the tab shell is over. The gate is the SNAPSHOT FIELD
// `ending`, never a stop reason, for exactly the reason App.vue gives for the knock prompt - a stop
// reason belongs to the last advance and is gone the next time anything refreshes, while an ending
// is permanent state that has to survive a reload.
//
// WHAT THIS FILE MAY NOT DO: choose. Every word on a page comes from the engine (`AlbumPage`), the
// selection rule included, because §6 promises the game never grades her and a UI that picked the
// adjectives would be the game grading her in a different font.
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { portraitUrl } from '../art/preload'
import { weekLabel, seasonYear } from '../shared/dates'
import { formatCents } from '../shared/money'
import Polaroid from './ui/Polaroid.vue'
import PrimaryPill from './ui/PrimaryPill.vue'
import Eyebrow from './ui/Eyebrow.vue'

const game = useGameStore()
const emit = defineEmits<{ (e: 'newCareer'): void }>()

const view = computed(() => game.snapshot?.ending ?? null)
const pages = computed(() => view.value?.album ?? [])

const page = ref(0)
/** false = the album, true = the record underneath (§9.3). */
const scrollOpen = ref(false)

const current = computed(() => pages.value[page.value] ?? null)
const isLast = computed(() => page.value === pages.value.length - 1)

function next(): void {
  if (!isLast.value) page.value += 1
}
function prev(): void {
  if (page.value > 0) page.value -= 1
}

const resumes = computed(() => view.value?.handoff.resumesWeek ?? null)

async function resumeCollege(): Promise<void> {
  await game.resumeFromCollege()
}
</script>

<template>
  <div v-if="view" class="ending" role="dialog" aria-modal="true" aria-label="Epilogue">
    <!-- THE RECORD (section 9.3): every milestone in order, paged by season. The floor under the
         album, for the player who wants the record rather than the story. -->
    <section v-if="scrollOpen" class="ending-scroll">
      <header class="ending-head">
        <Eyebrow as="h2">The whole record</Eyebrow>
        <button class="ending-link" type="button" @click="scrollOpen = false">Back to the album</button>
      </header>
      <div class="ending-scroll-body">
        <section v-for="s in view.scroll" :key="s.seasonIndex" class="scroll-season">
          <h3 class="scroll-year">{{ seasonYear(s.seasonIndex) }} <span>she was {{ s.ageYears }}</span></h3>
          <ul class="scroll-rows">
            <li v-for="r in s.rows" :key="`${r.week}-${r.label}`">
              <span class="scroll-week">{{ weekLabel(r.week) }}</span>
              <span class="scroll-label">{{ r.label }}</span>
              <span v-if="r.detail" class="scroll-detail">{{ r.detail }}</span>
            </li>
          </ul>
        </section>
        <p v-if="view.scroll.length === 0" class="scroll-empty">
          Nothing was ever written down. That happens.
        </p>
      </div>
    </section>

    <!-- THE ALBUM -->
    <section v-else class="ending-album">
      <header class="ending-head">
        <Eyebrow as="h2">{{ isLast ? 'The last page' : 'The album' }}</Eyebrow>
        <p class="ending-count">{{ page + 1 }} / {{ pages.length }}</p>
      </header>

      <div v-if="current" class="album-page">
        <!-- POINT 1 + POINT 2: the photograph, and the week in her own hand ON THE CARD. -->
        <Polaroid
          class="album-photo"
          :src="portraitUrl(current.stage, current.emotion)"
          :alt="`Aged ${current.stage}`"
          :tilt="page % 2 === 0 ? 'var(--tilt-1)' : 'var(--tilt-2)'"
          :photo-height="228"
          :caption="current.caption"
          tape
        />

        <!-- POINT 4: WHY this week is in the album. Always visible, empty page or not - the owner's
             visible selection rule, and what keeps section 6's promise. -->
        <p class="album-why">{{ current.why }}</p>

        <!-- POINT 3: one hard fact off the milestone itself, never a computed summary. -->
        <p v-if="current.fact" class="album-fact">{{ current.fact }}</p>
        <p v-if="current.week !== null" class="album-when">{{ weekLabel(current.week) }}</p>
      </div>

      <nav class="album-nav">
        <button class="album-arrow" type="button" :disabled="page === 0" @click="prev">Back</button>
        <span class="album-dots" aria-hidden="true">
          <i v-for="(p, i) in pages" :key="p.slot" :class="{ on: i === page, off: p.empty }"></i>
        </span>
        <button class="album-arrow" type="button" :disabled="isLast" @click="next">Next</button>
      </nav>

      <!-- THE HAND-OFF (section 5.6): an OFFER, not a credits roll. Only on the last page. -->
      <footer v-if="isLast" class="ending-foot">
        <dl class="ending-totals">
          <div><dt>Won</dt><dd>{{ formatCents(view.totals.prizeCents) }}</dd></div>
          <div><dt>Spent</dt><dd>{{ formatCents(view.totals.spentCents) }}</dd></div>
          <div><dt>Seasons</dt><dd>{{ view.seasonsPlayed }}</dd></div>
          <div><dt>Best rank</dt><dd>{{ view.bestRank === null ? '–' : `#${view.bestRank}` }}</dd></div>
          <div><dt>Titles</dt><dd>{{ view.titles }}</dd></div>
        </dl>
        <p v-if="view.oneMoreYearCount > 0" class="ending-note">
          She said one more year {{ view.oneMoreYearCount }}
          {{ view.oneMoreYearCount === 1 ? 'time' : 'times' }}.
        </p>

        <button class="ending-link" type="button" @click="scrollOpen = true">The whole record</button>

        <!-- COLLEGE is the only ending that resumes: one tap spends four years. -->
        <PrimaryPill v-if="resumes !== null" variant="cta" @click="resumeCollege">
          Four years later –
        </PrimaryPill>
        <template v-else>
          <p class="ending-offer">
            Nothing carries over. A new daughter, and one question: what the family starts with.
          </p>
          <PrimaryPill variant="cta" @click="emit('newCareer')">Raise another</PrimaryPill>
        </template>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.ending {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: var(--celebration-bg);
  padding: calc(var(--app-pad-top) + env(safe-area-inset-top)) var(--app-pad-x)
    calc(var(--app-pad-bottom) + env(safe-area-inset-bottom));
}

.ending-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.ending-count {
  margin: 0;
  font-size: 13px;
  color: var(--ink-dim);
  font-variant-numeric: tabular-nums;
}

/* A page you TURN, not a feed you flick: one polaroid, centred, with the reason under it. */
.album-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
}

.album-photo {
  width: min(280px, 78vw);
}

/* The visible selection rule. It is the loudest line on the page after the photograph, because it
   is the thing the owner asked to be able to see. */
.album-why {
  margin: 4px 0 0;
  max-width: 34ch;
  font-family: var(--font-heading);
  font-size: 17px;
  line-height: 1.35;
  color: var(--ink);
}

.album-fact {
  margin: 0;
  max-width: 36ch;
  font-size: 14px;
  line-height: 1.45;
  color: var(--ink-soft);
}

.album-when {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

.album-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 22px 0 8px;
}

.album-arrow {
  background: none;
  border: 0;
  padding: 8px 4px;
  font: inherit;
  font-size: 14px;
  color: var(--ink-2);
  cursor: pointer;
}

.album-arrow:disabled {
  color: var(--ink-dim);
  opacity: 0.4;
  cursor: default;
}

.album-dots {
  display: flex;
  gap: 7px;
}

.album-dots i {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-pill);
  background: var(--ring-track);
}

/* An EMPTY page is dotted rather than filled - the album says at a glance that a page has no week
   behind it, which is the same honesty the page itself carries in words. */
.album-dots i.off {
  box-shadow: inset 0 0 0 1px var(--ink-dim);
  background: transparent;
}

.album-dots i.on {
  background: var(--ink);
}

.ending-foot {
  margin-top: 26px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
}

.ending-totals {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(84px, 1fr));
  gap: 12px 10px;
  margin: 0;
  width: 100%;
  max-width: 460px;
}

.ending-totals div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ending-totals dt {
  font-size: 11px;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

.ending-totals dd {
  margin: 0;
  font-size: 16px;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.ending-note,
.ending-offer {
  margin: 0;
  max-width: 34ch;
  font-size: 14px;
  line-height: 1.45;
  color: var(--ink-soft);
}

.ending-link {
  background: none;
  border: 0;
  padding: 6px 2px;
  font: inherit;
  font-size: 14px;
  color: var(--ink-2);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

/* --- the record underneath --- */
.ending-scroll-body {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.scroll-year {
  margin: 0 0 8px;
  font-family: var(--font-heading);
  font-size: 15px;
  color: var(--ink);
}

.scroll-year span {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--ink-dim);
}

.scroll-rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.scroll-rows li {
  display: flex;
  gap: 10px;
  align-items: baseline;
  font-size: 13px;
  color: var(--ink-2);
}

.scroll-week {
  min-width: 58px;
  color: var(--ink-dim);
  font-variant-numeric: tabular-nums;
}

.scroll-detail {
  color: var(--ink-soft);
}

.scroll-empty {
  margin: 0;
  font-size: 14px;
  color: var(--ink-soft);
}
</style>
