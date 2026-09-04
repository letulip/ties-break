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
import {
  DEFAULT_PROFILE,
  type CoachTier,
  type FamilyBackground,
  type PlayerProfile,
  type PlayStyle,
} from '../shared/protocol'

/* ⚠ SIX IMPORTS LEFT THIS FILE WITH THE COLLEGE BLOCK (round 24 #2b): `COLLEGE_TIER_NAME`,
   `NATIONAL_TEAM`, `KID_ID`, `formatShortName`, `WorldMatch` and `MatchReplay` were all the year
   card's, and they are `CollegeYearCard.vue`'s now. The epilogue watches no matches. */
import { daysInBirthMonth } from '../shared/dates'
import Polaroid from './ui/Polaroid.vue'
import PrimaryPill from './ui/PrimaryPill.vue'
import Eyebrow from './ui/Eyebrow.vue'

const game = useGameStore()
const emit = defineEmits<{ (e: 'newCareer'): void }>()

// --- THE HAND-OFF (career-contract-v1.md §5.6) --------------------------------------------------
//
// The owner's ruling, quoted verbatim in `docs/specs/career-contract-v1.md` §5.6 and not here – a
// `.vue` file carries no Cyrillic at all, comments included (CLAUDE.md style). In English: at the end
// offer a choice that auto-generates a new random daughter, asking only for the band of starting
// capital and nothing else.
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

// --- ⭐⭐⭐ ROUND 24 #2b/#3: THE COLLEGE YEARS LEFT THIS FILE ------------------------------------
//
// The owner, 20.08 (a script comment may carry his words; a rendered template may not – and the
// literal tag name may not appear here either: tests/template-copy-rules.test.ts finds the block by
// the FIRST occurrence of it in the file, so writing it in a comment moves the guard's own window):
// «После выбора колледжа показывают фотоальбом как будто карьера закончилась» and «Весь флоу
// колледжа перенести на домашний экран».
//
// P5's year block – the heading, the lead, the year's facts, the call-up note, the watchable rubbers
// and the two answers – is `components/CollegeYearCard.vue` now, drawn by `HomeScreen` on a college
// week. It moved verbatim; nothing about it was rewritten, and there is no second copy of it here.
//
// WHAT STAYS is `resumeCollege` and the `resumes !== null` pill below it, because that is the branch
// an ending typed 'college' WITHOUT a progress view still lands on (App.vue's `showCollege` requires
// one) and a blocking takeover may not have a state with no way out of it.

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

        <!-- ⭐ ROUND 29 PART TWO #10 – THE ACADEMY LINE, the-shop §10.4 settled by the owner (his
             ruling is quoted on `AcademyEpilogue` in shared/protocol/career.ts – a template may
             carry no Cyrillic). The SMALLEST honest line inside today's shape: the album itself is
             reserved by him (the photo-album concept is his backlog item), so this is one
             `ending-note` beside the one-more-year note, on the same division of labour – the
             engine hands facts, the template writes the fixed sentence, and it renders only when
             there is an academy to name. Two arms because the truth has two shapes: a built academy
             that EARNS (what it became – the round-29 income wave), and stages standing that do not
             earn yet (only the land, a field). -->
        <p v-if="view.academy" class="ending-note">
          <template v-if="view.academy.weeklyIncomeCents > 0">
            Her academy stands – {{ view.academy.stagesBuilt }} of {{ view.academy.totalStages }}
            stages built – and it earns {{ formatCents(view.academy.weeklyIncomeCents) }} a week.
          </template>
          <template v-else>
            Her academy is begun – {{ view.academy.stagesBuilt }} of {{ view.academy.totalStages }}
            stages built.
          </template>
        </p>

        <button class="ending-link" type="button" @click="scrollOpen = true">The whole record</button>

        <!-- ⭐⭐⭐ ROUND 24 #2b/#3 – THE COLLEGE YEAR BLOCK HAS LEFT THIS SCREEN, and its absence is
             the whole of the owner's item – the album read to him as if the career had ended. (His
             words are in the script block above; no Cyrillic may appear in a template –
             tests/template-copy-rules.test.ts.) It was never a bug in this file: college is an
             ENDING that can be resumed, so the epilogue was correctly what rendered – but the player
             was being shown the end of the story in the middle of it.
             It now lives in `components/CollegeYearCard.vue` and is drawn by `HomeScreen` on a
             college week, with the two answers as the screen's bottom control. App.vue's
             `showCollege` is the one predicate that routes it, and it is stated there.
             ⚠ THE MARKUP MOVED VERBATIM – same computeds, same copy, same class names – because the
             words were never the fault. Nothing here is a rewrite of it, and nothing here is a
             SECOND copy of it: that is the failure this file has already paid for once, when the
             college bill landed and only one of four copies of "the family stops paying" was fixed.

             ⚠ AND THIS BRANCH IS WHAT KEEPS THE FOOTER EXHAUSTIVE. `showCollege` requires a progress
             view; an ending that says 'college' WITHOUT one therefore arrives here, and a footer
             whose branches are not exhaustive is a dead end on a blocking takeover (the round-20
             failure with a different cause). If a resume week ever arrives without a progress view,
             the way back is still one tap. -->
        <PrimaryPill v-if="resumes !== null" variant="cta" @click="resumeCollege">
          Another year –
        </PrimaryPill>

        <template v-else>
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

/* ⭐⭐⭐ ROUND 36 PHASE 4 – THE EPILOGUE GETS A COLUMN, AND IT NEVER HAD ONE.
   `.ending` is a `position: fixed` takeover, so like the wizard (R14-9) it hangs OUTSIDE the frame
   every tabbed screen inherits – and unlike the wizard nothing inside it was ever capped. Measured
   on the shipped build at 1280x900, before this rule existed:

     .ending-head   1214px wide – the eyebrow at x=33 and «1 / 7» at x=1220
     .album-nav     1214px wide – **Back at x=33 and Next at x=1208**, 1175px apart,
                    around a photograph 285px wide sitting in the middle of them

   An album is a page you TURN: the two arrows frame the picture, which is what they do on a phone
   at 309px apart. Sent to opposite ends of a monitor they stop being a pager and become two
   unrelated buttons – and this is the last screen of a career, so it is the one place the game
   should not look like a phone app stretched sideways.

   ⚠ THE CAP IS ON THE SECTIONS AND NOT ON `.ending`, for `.ob-shell`'s own reason: this element
   paints the celebration ground over the whole app, and capping the painted box would letterbox the
   epilogue in the page colour instead of centring its column on it.

   480 IS THE NUMBER THE CONTENT ALREADY ASKED FOR, not a taste: `.ending-totals` below caps itself
   at 460, `.ending-fork` at 360, `.album-photo` at `min(280px, 78vw)` and the three prose blocks at
   34–36ch. Nothing on this screen wants to be wider than 460, so the column is that plus the room
   the arrows sit in. ⚠ Below 768 there is no rule at all, so the phone is untouched. */
@media (min-width: 768px) {
  .ending > section {
    width: 100%;
    max-width: 480px;
    margin-inline: auto;
  }
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

/* ⚠ AND THE COLLEGE YEAR BLOCK'S RULES WENT WITH ITS MARKUP (round 24 #2b) – `.college-year`,
   `.college-lead`, `.college-call`, `.college-facts`, `.college-rubbers`, `.college-rubber` and the
   three `.rubber-*` spans are `CollegeYearCard.vue`'s scoped sheet now. `.ending-fork` above STAYS:
   the hand-off's three capital cards are the same object and are the only caller left. */

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
