<script setup lang="ts">
// Round 5 item 9 (light version) – a dismissible "Week recap" shown above News right after
// a non-tournament week resolves. Pure presentation over the latest snapshot events: no
// engine changes, no new persisted state. 7 day-dots is a deterministic cosmetic spread of
// the week's train/rest plan, not a simulated day-by-day log.
import { computed } from 'vue'
import { useGameStore } from '../stores/game'

defineEmits<{ dismiss: [] }>()

const game = useGameStore()

const week = computed(() => game.snapshot?.week ?? 0)
const plan = computed(() => game.snapshot?.plan ?? { train: 75, rest: 25 })

// Mon–Sun letters shown under the day dots (round-7 item 5b).
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// Evenly spread `trainDays` "train" dots across 7 slots (largest-remainder-free integer
// spread – deterministic, no RNG): slot i is a training day iff the running share crosses
// an integer boundary at i.
const dayDots = computed<('train' | 'rest')[]>(() => {
  const trainDays = Math.round((plan.value.train / 100) * 7)
  const dots: ('train' | 'rest')[] = []
  for (let i = 0; i < 7; i++) {
    const before = Math.floor((i * trainDays) / 7)
    const after = Math.floor(((i + 1) * trainDays) / 7)
    dots.push(after > before ? 'train' : 'rest')
  }
  return dots
})

const weekEvents = computed(() => (game.snapshot?.events ?? []).filter((e) => e.week === week.value))
const incomeCents = computed(() =>
  weekEvents.value.filter((e) => e.type === 'income').reduce((s, e) => s + (e.amountCents ?? 0), 0),
)
const expenseCents = computed(() =>
  weekEvents.value.filter((e) => e.type === 'expense').reduce((s, e) => s + (e.amountCents ?? 0), 0),
)
// The base-cost expense event's own text doubles as this week's flavor line (world.ts
// picks one of TRAIN_EVENTS/REST_EVENTS for it already).
const flavorText = computed(() => weekEvents.value.find((e) => e.type === 'expense')?.text ?? '')

function formatSigned(cents: number): string {
  const dollars = Math.round(cents / 100)
  const sign = dollars < 0 ? '-' : '+'
  return `${sign}$${Math.abs(dollars).toLocaleString('en-US')}`
}
</script>

<template>
  <section class="recap-card">
    <div class="recap-head">
      <h2 style="margin: 0">Week recap · W{{ week }}</h2>
      <button class="link" @click="$emit('dismiss')">Dismiss</button>
    </div>
    <div class="recap-days">
      <div v-for="(d, i) in dayDots" :key="i" class="recap-day">
        <span class="recap-dot" :class="d" :title="d === 'train' ? 'Training' : 'Rest'"></span>
        <span class="recap-day-letter">{{ DAY_LETTERS[i] }}</span>
      </div>
    </div>
    <p class="recap-legend"><span class="recap-key train">■</span> training · <span class="recap-key rest">■</span> rest</p>
    <p v-if="flavorText" class="recap-flavor">{{ flavorText }}</p>
    <div class="recap-figures">
      <span class="num positive">Income {{ formatSigned(incomeCents) }}</span>
      <span class="num negative">Spend {{ formatSigned(expenseCents) }}</span>
    </div>
  </section>
</template>
