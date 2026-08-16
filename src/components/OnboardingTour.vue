<script setup lang="ts">
// Round 5 item 10 (light) – a coach-mark tour of the interface, shown to a player who has never
// answered it. Plain absolutely-positioned tooltips (no library): each step points at a real element
// via a `data-tour="..."` attribute already present in App.vue's or HomeScreen's template, so
// positioning tracks the actual rendered layout instead of guessed coordinates.
//
// ⚠ THE CARD'S POSITION IS NOT COMPUTED HERE ANY MORE – see composables/coachTour.ts. It used to
// clamp the horizontal axis only, which is docs/review/05-ux-ui-pwa.md's [MEDIUM] "Coach-mark tour
// can point off-screen": a card hung off an anchor below the fold took Skip and Next off the bottom
// of a 667px phone with it, and the tour has no other exit.
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { TOOLTIP_FALLBACK_HEIGHT, tooltipBox, type Placement } from '../composables/coachTour'

const emit = defineEmits<{ done: [] }>()

interface Step {
  selector: string
  title: string
  text: string
  /** tooltip drawn above or below the highlighted element */
  placement: Placement
}

// R13-12 re-anchored the marks to the new nav: Home is the diary (the plan moved to the
// This-week tab, which gets its own step), and the Kid step points at the header avatar –
// the Kid tab is gone from the bottom bar.
//
// epic/redesign-home re-aimed ONE of them. The This-week TAB left the bottom bar (the owner's new
// order is Season · Calendar · Home · Stats · More), and its screen is reached from Home's
// next-tournament card – so the mark that pointed at `tab-week` points at that card. It is the only
// anchor in the set that does not live in App.vue's own template, which is exactly why the card
// carries a `data-tour` attribute of its own rather than the step guessing a position.
//
// ⭐ 16.08, THE OWNER: the onboarding is meant to explain the FUNCTIONS and the INTERFACE, and his
// playtester met the app cold and could not say what any of it was for – "the interface is not the
// simplest" is his own summary. (The ruling is quoted verbatim in docs/specs/onboarding-tour.md; no
// Cyrillic may appear in a .vue file, comments included – tests/copy-rules.test.ts.) Five marks used
// to name three tabs and a button; the set below walks the whole shell – what the game IS, her page,
// the two markers on the header, the money, the week ahead, and each of the four tabs that are not
// Home – because the parts a player cannot name are the ones that were never introduced.
//
// ⚠ EVERY ANCHOR MUST BE REACHABLE FROM HOME. The tour does not navigate: it measures
// `document.querySelector` against the screen that is up, and App.vue only ever opens it on the Home
// tab. So a step may point at the bottom bar (always rendered) or at something in HomeScreen, and at
// nothing else. tests/round13-nav.test.ts enforces exactly that, per anchor.
const STEPS: Step[] = [
  {
    selector: '[data-tour="home-header"]',
    title: 'You are the parent',
    text: "You do not play the matches – you raise the player. This is Home: her diary for the week, her photo and how she is doing.",
    placement: 'below',
  },
  {
    selector: '[data-tour="kid-avatar"]',
    title: 'Her page',
    text: 'Tap her photo any time – her full profile lives behind it: skills, body, school and her coach.',
    placement: 'below',
  },
  {
    selector: '[data-tour="home-news"]',
    title: 'News and letters',
    text: 'The bell is the week just gone. The envelope beside it holds offers and letters – a dot means one is waiting on you.',
    placement: 'below',
  },
  {
    selector: '[data-tour="family-budget"]',
    title: 'The money is yours',
    text: 'Entry fees, travel, coaching and kit all come out of the family budget. Tap the card to see where it went.',
    placement: 'above',
  },
  {
    selector: '[data-tour="next-tournament"]',
    title: 'This week',
    text: 'Tap the tournament card to set the training plan for the week ahead and to read the last week recap.',
    placement: 'above',
  },
  {
    selector: '[data-tour="tab-play"]',
    title: 'Season – where you enter',
    text: 'The Season tab lists the tournaments open to her rank, what each one costs, and how the standings look.',
    placement: 'above',
  },
  {
    selector: '[data-tour="tab-calendar"]',
    title: 'Calendar',
    text: 'Her year, week by week: what she is entered for, school exams, holidays and the weeks she is resting.',
    placement: 'above',
  },
  {
    selector: '[data-tour="tab-stats"]',
    title: 'Stats',
    text: 'The long view – her ranking, her skills, and how both have moved since she started.',
    placement: 'above',
  },
  {
    selector: '[data-tour="tab-trophies"]',
    title: 'Trophies',
    text: 'Every title she wins is kept here, with the season it came from.',
    placement: 'above',
  },
  {
    selector: '[data-tour="home-settings"]',
    title: 'Settings',
    text: 'Sound, animations, saves and your careers live behind the gear – and so does this tour, if you want it again.',
    placement: 'below',
  },
  {
    selector: '[data-tour="next-week"]',
    title: 'Now play a week',
    // R10-7: the button no longer says a literal "Next week" – it names the week's plan – so the
    // coach-mark points at the button instead of quoting a label that changes.
    text: 'This plays one week and tells you what that week holds. Plan, enter, play, repeat – that is the whole game.',
    placement: 'above',
  },
]

const stepIndex = ref(0)
const step = computed(() => STEPS[stepIndex.value])
const isLast = computed(() => stepIndex.value === STEPS.length - 1)

const rect = ref<DOMRect | null>(null)
const tooltipEl = ref<HTMLElement | null>(null)
/** The card's real height once it has been laid out. See TOOLTIP_FALLBACK_HEIGHT for the first
 *  frame, and for every environment that has no layout engine at all. */
const tipHeight = ref(TOOLTIP_FALLBACK_HEIGHT)

const viewport = ref({ width: 0, height: 0 })

function readViewport(): void {
  viewport.value = { width: window.innerWidth, height: window.innerHeight }
}

function measure(): void {
  const el = document.querySelector(step.value.selector)
  readViewport()
  rect.value = el ? el.getBoundingClientRect() : null
  const h = tooltipEl.value?.getBoundingClientRect().height ?? 0
  // A zero is "not laid out yet", never "a card of no height" – adopting it would collapse the
  // clamp's whole reason for existing.
  if (h > 0) tipHeight.value = h
}

/** Bring the step's element into view BEFORE measuring it – the review's own fix for the anchors
 *  that live below a full-bleed square hero on a short phone. Instant, not smooth: the highlight
 *  carries a 0.2s CSS transition and a smooth scroll would leave the two chasing each other. */
function revealAndMeasure(): void {
  const el = document.querySelector(step.value.selector)
  if (el && typeof el.scrollIntoView === 'function') {
    el.scrollIntoView({ block: 'center', behavior: 'auto' })
  }
  measure()
  // The card's own height is only knowable after it has rendered this step's copy, and the copy is
  // what changes between steps – so measure again once Vue has patched it in.
  void nextTick(measure)
}

function next(): void {
  if (isLast.value) {
    emit('done')
    return
  }
  stepIndex.value++
  revealAndMeasure()
}

function skip(): void {
  emit('done')
}

function onViewportChanged(): void {
  measure()
}

onMounted(() => {
  revealAndMeasure()
  window.addEventListener('resize', onViewportChanged)
  // The page scrolls under the tour (`.coach-tour` is `pointer-events: none` everywhere but the
  // card), so a highlight that only re-measured on resize drifted off its element the moment the
  // player moved the screen.
  window.addEventListener('scroll', onViewportChanged, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onViewportChanged)
  window.removeEventListener('scroll', onViewportChanged)
})

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
  const box = tooltipBox(rect.value, step.value.placement, tipHeight.value, viewport.value)
  return { left: `${box.left}px`, top: `${box.top}px` }
})
</script>

<template>
  <div class="coach-tour">
    <div class="coach-highlight" :style="highlightStyle"></div>
    <div ref="tooltipEl" class="coach-tooltip" :style="tooltipStyle">
      <p class="coach-tooltip-title">{{ step.title }}</p>
      <p class="coach-tooltip-text">{{ step.text }}</p>
      <div class="coach-tooltip-actions">
        <button class="link" @click="skip">Skip tour</button>
        <button class="primary" @click="next">{{ isLast ? 'Got it' : 'Next' }}</button>
      </div>
      <div class="coach-dots">
        <span v-for="(_, i) in STEPS" :key="i" class="dot" :class="{ active: i === stepIndex }"></span>
      </div>
    </div>
  </div>
</template>
