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

/* ⚠ SIX IMPORTS LEFT THIS FILE WITH THE COLLEGE BLOCK (round 24 #2b): `COLLEGE_TIER_NAME`,
   `NATIONAL_TEAM`, `KID_ID`, `formatShortName`, `WorldMatch` and `MatchReplay` were all the year
   card's, and they are `CollegeYearCard.vue`'s now. The epilogue watches no matches. */
import Polaroid from './ui/Polaroid.vue'
import PrimaryPill from './ui/PrimaryPill.vue'
import Eyebrow from './ui/Eyebrow.vue'

const game = useGameStore()
const emit = defineEmits<{ (e: 'newCareer'): void }>()

// --- THE HAND-OFF (career-contract-v1.md §5.6) --------------------------------------------------
//
// ⭐⭐⭐ ROUND 47 #12 – IT SENDS THE PLAYER TO THE BEGINNING NOW, AND IT USED TO MAKE A
// THIRTEEN-YEAR-OLD ON THE SPOT. The owner, 18.09, off his finished career (his words are in
// `docs/plans/life-wave-7-strings-2026-09.md` §8 – a `.vue` file carries no Cyrillic at all,
// comments included, CLAUDE.md style): «Raise another» starts her at 13 straight away, and it should
// simply send you to the start like everything else does.
//
// ⚠ WHAT IT ACTUALLY DID, MEASURED RATHER THAN READ OFF THE COMMENT THAT USED TO STAND HERE. The old
// `raiseAnother(background)` called `game.newCareer(...)` FIRST and emitted afterwards. Creating the
// career published a snapshot with no `ending`, so App.vue's `showEnding` went false and this whole
// takeover was unmounted BEFORE the emit ran – the shell was already drawing HomeScreen on a week-0,
// thirteen-year-old career, and the parent's `@new-career` handler never heard a thing. The route
// was not «the wizard», which is what App.vue's own comment claimed: it was straight into the game.
// `tests/component/r47-raise-another-route.test.ts` pins both halves of that.
//
// ⚠ SO NOTHING IS CREATED HERE ANY MORE. This screen emits and stops; the shell drops the finished
// career and routes to the CHILDHOOD, which is the same beginning a first-ever launch gets and is
// where `newCareer` is called from now (the ninth card). One tap, and the nine years are hers again.
//
// ⚠ AND §5.6'S «ONE QUESTION» IS ANSWERED BY THE BEGINNING INSTEAD, WHICH IS WHY THE CAPITAL FORK
// LEFT THIS FILE. The three band cards and their lead sentence existed because there was no
// beginning to send a player to – the epilogue had to ask the family's size itself. The prologue's
// first card has asked exactly that question (its three origins) since it shipped, and it asks her
// name, her birthday and her country beside it, so the lead's promise of «one question» could not
// survive the route either way. ⚠ The removal is recorded as a removal, with his sentence as the
// authority, in the strings table's §8 – invariant 4 is why it is written down rather than assumed.
//
// ⚠ NOTHING CARRIES OVER, unchanged and now by construction: this file no longer builds a profile at
// all, so there is nothing here that could carry the mother's balance, her country or her name into
// the next story. That was §5.6's own open question and its answer has not moved.

/** The one tap. The shell owns what happens next – see App.vue's `raiseAnother`. */
function raiseAnother(): void {
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
        <!-- ⭐⭐⭐ ROUND 46 #9 – THE SAME FIVE LABELS, TWO OF THE FIGURES REPAIRED, AND TWO NEW ROWS
             THAT ONLY APPEAR WHEN THERE IS SOMETHING TO SAY. The owner read «$13M won against $83M
             spent» off a career that ended holding a fund, houses and an academy (his words are on
             `careerMoney` in engine/world/ledger.ts – no Cyrillic may appear in a template).
             `money.outlayCents` is what left the family FOR GOOD; the money that turned into
             something it still owns is `heldCents`, and it never belonged in a figure called
             «Spent». ⚠ THE WORDS ARE UNTOUCHED (invariant 4): «Won», «Spent», «Seasons», «Best
             rank» and «Titles» are his, and nothing here rewrites one.
             ⚠ THE TWO NEW ROWS ARE DRAFTS – docs/plans/life-wave-7-strings-2026-09.md, ids R46-1 and
             R46-2 – and they render only when the figure is non-zero, so every career that neither
             owned anything nor banked a cheque of her own sees exactly the page it saw before.

             ⭐⭐⭐ RULING, 18.09 – AND ONE OF THE FIVE HAS NOW MOVED, BECAUSE HE MOVED IT. R46-3 was
             put to him as a draft – «Won» names a figure that is only the family's HALF of the prize
             cheques, and on a measured career that was $17,164,973 printed beside the $28,749,334
             sitting in HER account, which is why he could not place it. He took the draft; his words
             are in docs/decisions.md under 18.09.2026 and in the strings table, because no Cyrillic
             may appear in a template. So «Won» becomes «The family's share», the FIGURE is untouched
             (`prizeCents`, exactly as before), and the other four labels stay his.
             ⚠ HERE AND NOWHERE ELSE, which is invariant 4 read strictly. The only other labelled
             surface on this figure is `ForkDialog.vue`, whose label is «The tennis has paid» and was
             never the string he ruled on; the album's slot 6 says «$X won against $Y spent» in
             PROSE. Neither is «Won», so neither moves on this ruling. -->
        <dl class="ending-totals">
          <div><dt>The family's share</dt><dd>{{ formatCents(view.money.prizeCents) }}</dd></div>
          <div><dt>Spent</dt><dd>{{ formatCents(view.money.outlayCents) }}</dd></div>
          <div v-if="view.money.herAccountCents > 0">
            <dt>Her account</dt><dd>{{ formatCents(view.money.herAccountCents) }}</dd>
          </div>
          <div v-if="view.money.holdingsCents > 0">
            <dt>Still owned</dt><dd>{{ formatCents(view.money.holdingsCents) }}</dd>
          </div>
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

        <!-- ⭐ ROUND 39 #3 – THE LIFETIME DEAL'S LINE, the academy note's own division of labour one
             paragraph up: the engine hands the signed paper's frozen facts (`EndingView.lifetimeDeal`,
             null when none was signed), the template writes the fixed sentence, and it renders only
             when there is a deal to name. This is the epilogue half of the lifetime letter's ruling
             (his words are on `ECONOMY.advertising.lifetime` – no Cyrillic may appear in a template):
             an ended world no longer ticks, so what survives the retirement is the fact, said out
             loud. DRAFT copy, like every new sentence in this wave. -->
        <p v-if="view.lifetimeDeal" class="ending-note">
          The {{ view.lifetimeDeal.brand }} deal never ran out –
          {{ formatCents(view.lifetimeDeal.cashCents) }} a year, for life.
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

        <!-- ⭐⭐⭐ ROUND 47 #12 – ONE TAP, AND IT GOES TO THE BEGINNING. The lead sentence and the
             three capital cards that used to stand here left with the career this file no longer
             creates; the script block above says why the route retired the question rather than an
             agent retiring the words, and the strings table's §8 carries the removal for his pass.
             `Raise another` is his label and is untouched. -->
        <PrimaryPill v-else variant="cta" :disabled="game.busy" @click="raiseAnother">
          Raise another
        </PrimaryPill>
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

.ending-note {
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

/* ⚠ AND THE COLLEGE YEAR BLOCK'S RULES WENT WITH ITS MARKUP (round 24 #2b) – `.college-year`,
   `.college-lead`, `.college-call`, `.college-facts`, `.college-rubbers`, `.college-rubber` and the
   three `.rubber-*` spans are `CollegeYearCard.vue`'s scoped sheet now.

   ⚠ AND `.ending-fork` / `.ending-fork-option` / `.ending-offer` LEFT WITH ROUND 47 #12's ROUTE.
   The hand-off's three capital cards were their only caller and the hand-off asks nothing now – the
   childhood does. The `min-width: 768px` note above still names `.ending-fork` at 360 as one of the
   widths that argued for the 480 column; that reading is kept as the RECORD of how the number was
   chosen, and the cap is unmoved because `.ending-totals` at 460 is the widest thing left. */

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
