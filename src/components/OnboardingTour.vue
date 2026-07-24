<script setup lang="ts">
// Round 5 item 10 (light) – a 4-step coach-mark tour shown once, after a career's FIRST
// snapshot ever. Plain absolutely-positioned tooltips (no library): each step points at a
// real element via a `data-tour="..."` attribute already present in App.vue's template, so
// positioning tracks the actual rendered layout instead of guessed coordinates.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const emit = defineEmits<{ done: [] }>()

interface Step {
  selector: string
  title: string
  text: string
  /** tooltip drawn above or below the highlighted element */
  placement: 'above' | 'below'
}

const STEPS: Step[] = [
  {
    selector: '[data-tour="home-header"]',
    title: 'Welcome',
    text: "This is Home – your kid's card, this week's plan, and the news feed all live here.",
    placement: 'below',
  },
  {
    selector: '[data-tour="tab-play"]',
    title: 'Season',
    text: 'The Season tab has the calendar, your entries, and the standings.',
    placement: 'above',
  },
  {
    selector: '[data-tour="tab-kid"]',
    title: 'Kid',
    text: "The Kid tab shows her full profile.",
    placement: 'above',
  },
  {
    selector: '[data-tour="next-week"]',
    title: 'Next week',
    text: 'Tap "Next week" to advance the career, one week at a time.',
    placement: 'above',
  },
]

const stepIndex = ref(0)
const step = computed(() => STEPS[stepIndex.value])
const isLast = computed(() => stepIndex.value === STEPS.length - 1)

const rect = ref<DOMRect | null>(null)

function measure(): void {
  const el = document.querySelector(step.value.selector)
  rect.value = el ? el.getBoundingClientRect() : null
}

function next(): void {
  if (isLast.value) {
    emit('done')
    return
  }
  stepIndex.value++
  measure()
}

function skip(): void {
  emit('done')
}

function onResize(): void {
  measure()
}

onMounted(() => {
  measure()
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => window.removeEventListener('resize', onResize))

const highlightStyle = computed(() => {
  const r = rect.value
  if (!r) return { display: 'none' }
  const pad = 6
  return {
    left: `${r.left - pad}px`,
    top: `${r.top - pad}px`,
    width: `${r.width + pad * 2}px`,
    height: `${r.height + pad * 2}px`,
  }
})

const tooltipStyle = computed(() => {
  const r = rect.value
  const vw = window.innerWidth
  if (!r) return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
  const left = Math.min(Math.max(r.left + r.width / 2, 150), vw - 150)
  if (step.value.placement === 'below') {
    return { left: `${left}px`, top: `${r.bottom + 14}px`, transform: 'translate(-50%, 0)' }
  }
  return { left: `${left}px`, top: `${r.top - 14}px`, transform: 'translate(-50%, -100%)' }
})
</script>

<template>
  <div class="coach-tour">
    <div class="coach-highlight" :style="highlightStyle"></div>
    <div class="coach-tooltip" :style="tooltipStyle">
      <p class="coach-tooltip-title">{{ step.title }}</p>
      <p class="coach-tooltip-text">{{ step.text }}</p>
      <div class="coach-tooltip-actions">
        <button class="link" @click="skip">Skip tour</button>
        <button class="primary" @click="next">{{ isLast ? 'Got it' : 'Next →' }}</button>
      </div>
      <div class="coach-dots">
        <span v-for="(_, i) in STEPS" :key="i" class="dot" :class="{ active: i === stepIndex }"></span>
      </div>
    </div>
  </div>
</template>
