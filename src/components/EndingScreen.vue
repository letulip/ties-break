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
import { STARTING_FUNDS_CENTS } from '../engine/world'
import { SURNAMES, FIRST_NAMES } from '../engine/season/cohort'
import { DEFAULT_PROFILE, type CoachTier, type FamilyBackground, type PlayerProfile, type PlayStyle } from '../shared/protocol'
import { daysInBirthMonth } from '../shared/dates'
import Polaroid from './ui/Polaroid.vue'
import PrimaryPill from './ui/PrimaryPill.vue'
import Eyebrow from './ui/Eyebrow.vue'

const game = useGameStore()
const emit = defineEmits<{ (e: 'newCareer'): void }>()

// --- THE HAND-OFF (career-contract-v1.md §5.6) --------------------------------------------------
//
// «Можно сделать в конце какой-то выбор с авто-созданием нового рандомного персонажа, спросим только
// вилку начального капитала и все.»
//
// ⚠ ONE QUESTION, AND IT IS THE ONE ONBOARDING ALREADY ASKS. Not the six-step wizard: the whole
// point of the seam is that a player who has just watched a career end is ONE TAP from the next one.
// So the three capital cards live here, the daughter is generated, and `newCareer` is called
// directly - the wizard is for a player who wants to name her.
//
// ⚠ AND NOTHING CARRIES OVER. A FRESH fork, never the mother's final balance (§5.6's own open
// question, the architect's recommendation taken): carrying her money is exactly the meta-currency
// §5.6 rules out, and a family that ended rich would open the next story with its central tension
// already resolved. The generated daughter is otherwise random, so the mother's career buys
// narrative and not advantage - the same line the equipment and coach ladders already hold.
const BACKGROUNDS: { id: FamilyBackground; label: string; blurb: string }[] = [
  { id: 'wealthy', label: 'Wealthy', blurb: 'Top academies are within reach.' },
  { id: 'middle', label: 'Middle class', blurb: 'Smart choices, steady progress.' },
  { id: 'working', label: 'Working class', blurb: 'Big dreams, hard mode.' },
]

/** ⚠ THE COACH RUNG IS DERIVED, NOT ASKED, because §5.6 says exactly ONE question. These are the
 *  three combinations `tools/econ-bench.ts` treats as each background's mainstream preset - the
 *  rung a family of that size would actually walk into an academy and buy. The Coach Market is open
 *  from week one, so it is a starting point rather than a decision taken away. */
const COACH_BY_BACKGROUND: Record<FamilyBackground, CoachTier> = {
  working: 'budget',
  middle: 'middle',
  wealthy: 'high',
}

/** Every style the match engine models, so the next daughter is a real roll of the dice rather than
 *  a copy of her mother. */
const PLAY_STYLES: readonly PlayStyle[] = ['aggressive', 'counterpuncher', 'serve-first', 'all-court']

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

function nextDaughter(background: FamilyBackground): PlayerProfile {
  const birthMonth = 1 + Math.floor(Math.random() * 12)
  return {
    ...DEFAULT_PROFILE,
    kidName: pick(FIRST_NAMES),
    kidLastName: pick(SURNAMES),
    // The only thing that crosses the seam, and it is not a mechanic: the family lives where it
    // lived. Country is display and flavour - it prices nothing, unlocks nothing and is not on any
    // curve - so this is the fiction being consistent rather than progress carrying over.
    country: game.snapshot?.profile?.country ?? DEFAULT_PROFILE.country,
    background,
    coachTier: COACH_BY_BACKGROUND[background],
    playStyle: pick(PLAY_STYLES),
    birthMonth,
    birthDay: 1 + Math.floor(Math.random() * daysInBirthMonth(birthMonth)),
  }
}

/** false until the player taps the offer – the one question is asked on the last page, not before. */
const asking = ref(false)

async function raiseAnother(background: FamilyBackground): Promise<void> {
  await game.newCareer('', nextDaughter(background))
  emit('newCareer')
}

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

// --- ⭐⭐ P5: THE COLLEGE YEARS, ONE AT A TIME ---------------------------------------------------
//
// College used to be one button reading «Four years later –» and 208 weeks spent behind it. Reality
// says the return is normal and often EARLY – Diana Shnaider left NC State after about a season and
// is inside the WTA top 15 – so the four-year block was the wrong SHAPE as well as an empty one.
// This block is the question at each year boundary, and the year just lived is what it is asked
// against. See docs/specs/college-as-a-second-act-2026-08.md.
//
// ⚠ IT MAY NOT RECOMMEND (ruling 4, 30.07 – the same rule the fork at nineteen keeps). The two
// answers are drawn as two options of ONE weight, not a CTA and a link, because the styling is an
// opinion in a different font. The card states the year's numbers and stops: no verdict on whether
// another one is a good idea, and no adjective anywhere near her rubbers.
//
// ⚠ AND EVERY NUMBER ON IT COMES FROM THE ENGINE. `CollegeYear` is measured at the two ends of the
// year and persisted, because nothing else in the save can reconstruct it – `pruneResults` deletes a
// result 52 weeks after it happened and `financeWeeks` keeps a 60-week window.
const college = computed(() => view.value?.college ?? null)
const lastYear = computed(() => college.value?.last ?? null)

/** «Year 1 of 4» – off the engine's own count, never a template's idea of four. */
const collegeHeading = computed(() => {
  const c = college.value
  if (!c) return ''
  return `Year ${Math.min(c.yearsDone + 1, c.totalYears)} of ${c.totalYears}`
})

/** The one-line answer to "what was that year". Empty before the first one is spent. */
const collegeLead = computed(() => {
  const c = college.value
  if (!c) return ''
  if (c.yearsDone === 0) {
    return 'A scholarship, a closed league that pays no ranking points, and the family stops paying. She can leave at the end of any year.'
  }
  if (c.final) return 'One year of the scholarship left. After it she is out either way.'
  return `${c.yearsDone} ${c.yearsDone === 1 ? 'year' : 'years'} spent, ${c.totalYears - c.yearsDone} left on the scholarship.`
})

/** #A -> #B across the year, or a dash at either end where she is on no list at all. `null` is not
 *  #1 – the same contract `LadderView.rank` keeps, and the reason this is not a number. */
function rankMark(rank: number | null): string {
  return rank === null ? '–' : `#${rank}`
}

const collegeRankSpan = computed(() => {
  const y = lastYear.value
  return y === null ? '' : `${rankMark(y.startRank)} to ${rankMark(y.endRank)}`
})

/** THE ONE WEEK OF THE YEAR THAT WAS NOT HERS. Her country picks the squad and there is no declining
 *  it; it pays no prize money and no ranking points, because the sport awards neither. */
const collegeCallNote = computed(() => {
  const y = lastYear.value
  if (y === null) return ''
  if (y.callUp === null) return 'Nobody wrote to her this year.'
  const c = y.callUp
  const court =
    c.rubbersPlayed === 0
      ? 'named in the squad, never on court'
      : `${c.rubbersWon} of ${c.rubbersPlayed} rubbers won`
  return `Her country called – ${court}, and the nation finished ${c.nationFinish}th. No prize money and no ranking points; there are none to award.`
})

/** She may only leave a year she has actually spent. The engine refuses it too – this is the screen
 *  agreeing with the rule rather than being the rule (CLAUDE.md invariant 1). */
const canLeaveCollege = computed(() => (college.value?.yearsDone ?? 0) > 0)

async function leaveCollege(): Promise<void> {
  await game.endCollegeEarly()
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

        <!-- ⭐⭐ P5 – COLLEGE IS THE ONLY ENDING THAT RESUMES, AND IT RESUMES ONE YEAR AT A TIME.
             The year just lived, then the two answers. Two options of one weight and no CTA: the
             card is not allowed an opinion about which of them is right (ruling 4, 30.07). -->
        <section v-if="college" class="college-year">
          <Eyebrow as="h3">{{ collegeHeading }}</Eyebrow>
          <p class="college-lead">{{ collegeLead }}</p>

          <dl v-if="lastYear" class="college-facts">
            <div>
              <dt>Banked</dt>
              <dd>{{ formatCents(lastYear.fundsDeltaCents) }}</dd>
            </div>
            <div>
              <dt>Rank</dt>
              <dd>{{ collegeRankSpan }}</dd>
            </div>
          </dl>
          <p v-if="lastYear" class="college-call">{{ collegeCallNote }}</p>

          <div class="ending-fork">
            <button
              class="ending-fork-option"
              type="button"
              :disabled="game.busy"
              @click="resumeCollege"
            >
              <strong>{{ college.yearsDone === 0 ? 'Play the first year' : 'Another year' }}</strong>
              <span>Student tennis, no ranking points, and the family still pays nothing.</span>
            </button>
            <button
              v-if="canLeaveCollege"
              class="ending-fork-option"
              type="button"
              :disabled="game.busy"
              @click="leaveCollege"
            >
              <strong>Back on tour now</strong>
              <span>She leaves the scholarship and starts again from qualifying.</span>
            </button>
          </div>
        </section>

        <template v-else-if="resumes === null">
          <p class="ending-offer">
            Nothing carries over. A new daughter, and one question: what the family starts with.
          </p>
          <PrimaryPill v-if="!asking" variant="cta" @click="asking = true">Raise another</PrimaryPill>
          <div v-else class="ending-fork">
            <button
              v-for="b in BACKGROUNDS"
              :key="b.id"
              class="ending-fork-option"
              type="button"
              :disabled="game.busy"
              @click="raiseAnother(b.id)"
            >
              <strong>{{ b.label }}</strong>
              <em>{{ formatCents(STARTING_FUNDS_CENTS[b.id]) }}</em>
              <span>{{ b.blurb }}</span>
            </button>
          </div>
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

/* THE ONE QUESTION. Three cards, one weight, no recommendation – the same discipline the fork at
   nineteen keeps, and for the same reason: the game does not have an opinion about how much money a
   family should have. */
.ending-fork {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 360px;
}

.ending-fork-option {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2px 10px;
  text-align: left;
  padding: 11px 14px;
  border: var(--stroke-hair) solid var(--ink-dim);
  border-radius: var(--radius-control);
  background: transparent;
  font: inherit;
  color: var(--ink);
  cursor: pointer;
}

.ending-fork-option:disabled {
  opacity: 0.5;
  cursor: default;
}

.ending-fork-option strong {
  font-size: 15px;
  font-weight: 600;
}

.ending-fork-option em {
  font-style: normal;
  font-variant-numeric: tabular-nums;
  color: var(--ink-2);
}

.ending-fork-option span {
  grid-column: 1 / -1;
  font-size: 13px;
  line-height: 1.4;
  color: var(--ink-soft);
}

/* ⭐ P5 – THE COLLEGE YEAR BLOCK. It lives INSIDE the ending's own scroller (`.ending` is
   `position: fixed; inset: 0; overflow-y: auto`), which is what makes both answers reachable however
   long the copy gets – the property `tests/component/college-second-act.test.ts` asserts and proves
   by mutation. The round-20 rule is about a CENTRED card with no height bound; this is the other
   shape, and it is measured as that shape rather than waved through. */
.college-year {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 360px;
}

.college-lead,
.college-call {
  margin: 0;
  max-width: 34ch;
  font-size: 14px;
  line-height: 1.45;
  color: var(--ink-soft);
  text-align: center;
}

/* The year's two numbers, in the totals' own idiom so the page has one voice. */
.college-facts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin: 0;
  width: 100%;
}

.college-facts div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.college-facts dt {
  font-size: 11px;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

.college-facts dd {
  margin: 0;
  font-size: 16px;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
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
