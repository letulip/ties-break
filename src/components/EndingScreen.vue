<script setup lang="ts">
// THE EPILOGUE – THE LAST PAGE. The closing card of a finished career: the way to THE ALBUM (the real
// book, `screens/AlbumScreen.vue`), the figures, the record underneath and the offer at the end
// (career-contract-v1.md §9, the owner's own page). It used to be seven polaroids turned one at a time –
// see ROUND 46 #18 below for why that left.
//
// It is a TAKEOVER rather than a screen: the tab shell is over. The gate is the SNAPSHOT FIELD
// `ending`, never a stop reason, for exactly the reason App.vue gives for the knock prompt - a stop
// reason belongs to the last advance and is gone the next time anything refreshes, while an ending
// is permanent state that has to survive a reload.
//
// WHAT THIS FILE MAY NOT DO: choose. Every word on a page comes from the engine (`AlbumPage`), the
// selection rule included, because §6 promises the game never grades her and a UI that picked the
// adjectives would be the game grading her in a different font.
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { useGameStore } from '../stores/game'
import { useDialogFocus } from '../composables/dialogFocus'
import { portraitUrl } from '../art/preload'
import { weekLabel, seasonYear } from '../shared/dates'
import { formatCentsCompact } from '../shared/money'
import type { AlbumBook, DynastyHandover } from '../shared/protocol'

/* ⚠ SIX IMPORTS LEFT THIS FILE WITH THE COLLEGE BLOCK (round 24 #2b): `COLLEGE_TIER_NAME`,
   `NATIONAL_TEAM`, `KID_ID`, `formatShortName`, `WorldMatch` and `MatchReplay` were all the year
   card's, and they are `CollegeYearCard.vue`'s now. The epilogue watches no matches. */
import AlbumScreen from './screens/AlbumScreen.vue'
import Polaroid from './ui/Polaroid.vue'
import PrimaryPill from './ui/PrimaryPill.vue'
import Eyebrow from './ui/Eyebrow.vue'
import StoreError from './ui/StoreError.vue'
import { useStartYear } from '../composables/startYear'
// SUCCESSION S2e (06.10): the career's own year, for every date this file prints.
const startYear = useStartYear()

const game = useGameStore()
const emit = defineEmits<{
  (e: 'newCareer'): void
  /** ⭐⭐ v86 – CONTINUE THE LINE. Carries the block, because the shell has no world to build one
   *  from: the worker owns the career and this screen only ever sees a `Snapshot`. */
  (e: 'continueLine', block: DynastyHandover): void
}>()

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

// --- ⭐⭐⭐ ROUND 47 B1 – THE FIGURES ON THE LAST PAGE, REBUILT (06.10; items 1-7 and 12 of docs/rounds/round-47.md) ---
//
// THE OWNER, 06.10, off the last page of a twenty-season career (translated; a `.vue` file carries no
// Cyrillic): (1) take away the wrapper the whole content lies on, it frees some width; (2) «I asked for the
// millions to be shortened to 40.5M, 254.3M and so on»; (3) the spend figures are gross again; (4) the layout
// still moves and the numbers jump; (5) best rank, titles and seasons in one row, bigger, Sora, bolder; (6)
// what is the difference between «Still owned» and «Family's portfolio», one of them looks redundant; (7)
// every number: bold, larger, Sora; (12) «The whole record» to the very bottom, only the export under it.
//
// ⚠ NOT ONE LABEL MOVED (invariant 4). «Family's share», «Spent», «Her account», «Family's portfolio», «Best
// rank», «Titles» and «Seasons» are byte-identical; only the numbers around them changed form.
// ⚠⚠ AND THAT SENTENCE IS THE RECORD OF ROUND 47, NOT OF TODAY'S PAGE (07.10, round 48 #3): two of those labels
// have since moved BECAUSE HE MOVED THEM – «Family's share» left the page and «Spent» became «Tennis & trips».
// «Her account», «Family's portfolio», «Best rank», «Titles» and «Seasons» are still byte-identical.
//
// (1) THE WRAPPER WAS THE GLOBAL `section` RULE, not anything in this file: style.css paints every `section` as a
// panel (the panel colour, a 1px line, `--tb-card-pad` + 2px = 16px of padding), and this page's
// `section.ending-album` was one – so the content lay on a card 17px inside the takeover's own 16px gutter on each
// side (309px of column at 375). `section.bare` is the app's existing opt-out; the page is `bare` now and the
// column is 343px. The ground stays: it is the takeover's `--celebration-bg`, not the panel's.
// (2) EVERY MONEY FIGURE HERE GOES THROUGH `formatCentsCompact` (shared/money.ts – round 46 #19 wired it to
// the season popup only): "$40.6M" from one million up, `formatCents`' own form below it. His example spells
// the decimal with a comma and truncates (40,5); the shipped form is the app's dot and rounds.
// (3) «Spent» IS STILL `view.money.outlayCents` – the figure moved in the ENGINE (`careerMoney`'s fourth
// term, engine/world/reckoning.ts), because this page only ever printed what the fold handed it.
// (6) «Still owned» LEFT. It is the shelf at value; the portfolio is the wallet PLUS the shelf, so on his
// screen they differed by exactly the wallet ($268,755,069 against $269,490,541 – $735,472). Nested, so the
// row that said less is the one that went; the portfolio is the line ruling A of 18.09 asked for. The
// engine's `holdingsCents` stays on the wire (the season popup reads it).
// (4)(5)(7) ONE GRID, TWO SHAPES. The money rows are a label|figure grid whose row wrappers are
// `display: contents` (round 46 R5's idiom on the season popup): the figure column is as wide as the widest
// figure and the label column takes the rest, so no row re-flows against another and nothing depends on a
// column count that changes with the width. The three career facts are ONE row of three equal columns at
// every width. Every figure – the numbers inside the three notes too – is Sora (`--font-heading`), bold, larger.
// (12) «The whole record» is under the doors now; only the dev export is below it.
const view = computed(() => game.snapshot?.ending ?? null)

/** false = the last page, true = the record underneath (§9.3). */
const scrollOpen = ref(false)

/** ⭐ ROUND 46 #18 – THE ONE REEL PAGE THAT STAYED: the LAST of the engine's seven. It is the page that carries
 *  the ending's own title and its lines (`AlbumPage` slot 7 – «whichever of the nine it was»), so dropping the
 *  reel with it would have dropped how the career ended. Null on a view with no pages (a shape no live path
 *  produces): the card then renders its figures and doors without a photograph, where the pager used to
 *  leave a footer that never appeared.
 *
 *  ⭐ ROUND 46 · R6 (06.10) – IT IS THE WHOLE FIELD NOW: the engine sends this page alone as `EndingView.closing`
 *  (pages 1–6 left the wire on his word – translated, «take them off, yes»), so there is no list to take the
 *  last of, and the «no pages» case above can no longer be built: `closing` is null here only while `view` is. */
const closing = computed(() => view.value?.closing ?? null)

// --- ⭐⭐⭐ ROUND 46 #18 – THE ALBUM IS THE REAL ONE NOW, AND THE SEVEN-POLAROID REEL IS GONE ---------
//
// THE OWNER, 05.10 (translated; a `.vue` file carries no Cyrillic): «I pressed "that's enough" and again
// saw not our beautiful album but a set of childhood photos and, at the end, one adult one. Fix it: let
// me look through the whole album, and think about what the flow is there at all.»
//
// ⚠ WHAT WAS WRONG, AND IT WAS NOT A BUG IN THE REEL. This screen was written (career-contract-v1 §9)
// before the album book existed: seven pages, each the portrait of the life STAGE the engine had picked a
// moment from, so a career that lived mostly in its early years drew mostly children – and the screen's
// own eyebrow said «The album», so the player was told he was looking at the album while the book he has
// had since round 44 (`screens/AlbumScreen.vue`, composed by `assembleAlbum` over the milestone ledger)
// was nowhere on the way out. Two things called THE ALBUM on one career is the defect; the reel's
// selection was only its visible half.
//
// ⚠ WHAT IT IS NOW. The reel – its first six pages, its pager, its dots, its «n / 7» – left this screen; the
// engine's `EndingView.album` was still on the wire when this was written and only its LAST page was read here
// (R6, 06.10: pages 1–6 left the wire on his word – translated, «take them off, yes» – and that last page is
// `EndingView.closing` now). The card that remains
// is the reel's last page as it stood – the photograph, the ending's own title and lines, the figures and the
// two doors, under the eyebrow it already had – with ONE new control at the head of the figures: «View the album» lays the book itself over this takeover – every sheet, the same
// chapter rail and pager as mid-career – and its Back arrow returns to the card as it was left (scroll
// included). ⚠ NOTHING OF THE BOOK IS REBUILT HERE: the same component, the same worker query
// (`game.loadAlbum`) the Home door uses; this file only holds the book for as long as it is open.
//
// ⚠ THE BOOK IS FETCHED WHEN THE LAYER OPENS AND DROPPED WHEN IT CLOSES, for the reason App.vue gives at
// its own `albumBook`: a ref that outlived the layer could show one career's childhood to the next, and
// the TICKET is for the late answer – only the newest request may write, and only while the layer is open.
// ⚠ AND A REFUSED FETCH CANNOT TRAP THE PLAYER: `book` stays null, the book draws its own empty chrome, and its
// Back arrow is the same one that works with a book. There is deliberately NO Escape handler (this takeover
// has none, see `useDialogFocus` below): the arrow is the way back.
/** true while THE ALBUM (the real book) is laid over this takeover. */
const albumOpen = ref(false)
const book = ref<AlbumBook | null>(null)
let bookRequest = 0
/** Where the card was scrolled to when the book was opened – the book opens at ITS top (owner, 31.07: a
 *  screen opens at its top) and the card comes back exactly where it was left. */
let leftAt = 0

async function openAlbum(): Promise<void> {
  leftAt = card.value?.scrollTop ?? 0
  albumOpen.value = true
  void nextTick(() => {
    if (card.value) card.value.scrollTop = 0
  })
  const ticket = ++bookRequest
  const loaded = await game.loadAlbum()
  if (ticket === bookRequest && albumOpen.value) book.value = loaded
}

function closeAlbum(): void {
  bookRequest += 1
  albumOpen.value = false
  book.value = null
  void nextTick(() => {
    if (card.value) card.value.scrollTop = leftAt
  })
}

// --- ⭐⭐⭐ ROUND 46 #20 – THE SERVICE EXPORT, ON THE ONE SCREEN THAT COVERS THE WAY TO THE SAVE ---------
//
// THE OWNER, 05.10 (translated): he could not get the save out any more, it seemed because of the last
// screen, where he had a lot of questions to check; could there be a separate button for the save here, for
// service purposes, so he can upload it for analysis. This takeover covers the tab shell, so More's
// «Export to file» is unreachable from here, and «Raise another» DROPS the finished career.
//
// ⚠ IT IS THE SAME CALL AS MORE'S, NOT A COPY OF IT: `game.exportSave()` asks the worker's `exportSave` query,
// which runs `encodeExportFile` over the committed world – the one file format, the one set of bytes, and no
// second serialiser. It follows the `▶▶ 52 (dev)` precedent (a dev control that ships in every build, because the
// deployed build is the playtest device) and carries the same `(dev)` tag so nobody mistakes it for a
// player's feature. The label is a DRAFT (R46-S18) – invariant 4.
async function exportSave(): Promise<void> {
  await game.exportSave()
}

const resumes = computed(() => view.value?.handoff.resumesWeek ?? null)

// --- ⭐⭐⭐ THE DYNASTY (v86 – docs/specs/the-dynasty-2026-09.md §2) --------------------------------
//
// HIS RULING, 20.09, AND IT IS THE REASON THERE IS NO CONDITION ON THIS CONTROL: the door never
// closes. A player may have wanted a dynasty and simply not have had the luck of a child inside the
// career they played, and a door that only opened for the lucky would punish them for the dice. (His
// sentence is in docs/decisions.md under 20.09; no Cyrillic may appear in a `.vue` file at all,
// comments included – CLAUDE.md style.)
//
// ⚠ SO WHAT FORKS IS THE TEXT AND NEVER THE AVAILABILITY. `raisedOnTour` is the engine's own
// `wasThereAChild`, asked once, at the ending: true means the girl was born while her mother was
// still playing, false means the birth is written after the farewell. `EndingView.dynasty` is not
// nullable, so there is no ending this block is absent on and no branch here that can be reached
// with nothing to send.
//
// ⚠⚠ AND NEITHER TEXT NAMES HER OR AGES HER. No name exists – «the parent chooses the name» is his
// 20.09 ruling and the prologue's identity card is where it is chosen. No AGE is stated either, and
// that is a LIMIT rather than a choice: §2 licenses the lived text to say how old the girl is «from
// `bornWeek` arithmetic», and the block carries no `bornWeek` – it carries the mother's career and
// nothing about the child but whether there is one. Reported to the architect rather than worked
// around by inventing a number.
//
// ⚠ BOTH LABELS ARE DRAFTS awaiting his pass (invariant 4): they are new strings, written once, and
// listed verbatim in the wave's report. Nothing existing is reworded – `Raise another` beside them
// is his and is untouched.
// ⭐ ROUND 48 #6 (07.10): THE EPILOGUE LABEL IS RULED NOW – «A daughter came later» became «A child came
// later» by his own word, and the lived label is still a draft. See `DYNASTY_AFTER` below; the two doors
// stand in ONE ROW since the same round (`.ending-doors`).
const dynasty = computed(() => view.value?.dynasty ?? null)

/** DRAFT · the lived variant: a daughter who was born while her mother was still on tour. */
const DYNASTY_LIVED = 'Raise her daughter'
/** ⭐ RULED 07.10 (round 48 #6) · the epilogue variant: the birth came after the career did. It shipped as a draft
 *  reading «A daughter came later»; the owner's own ruling on it is that «child» is better (his words are in the
 *  round ledger and in docs/decisions.md under 07.10 – a `.vue` file carries no Cyrillic, comments included), so the
 *  spelling is his and this is no longer a draft. ⚠ ONLY THIS LABEL MOVED: the lived variant above still says
 *  «daughter», and nothing on this page names or ages her. */
// ⭐⭐ 08.10 SECOND RULING ON THIS LABEL, same morning («Династия берём, меняй обе стороны»): his
// «Ребёнок позже» stood one message with a stated dislike; the cross-language one-word option won.
const DYNASTY_AFTER = 'Dynasty'

const continueLabel = computed(() => (dynasty.value?.raisedOnTour ? DYNASTY_LIVED : DYNASTY_AFTER))

function continueLine(): void {
  const block = dynasty.value
  if (block) emit('continueLine', block)
}

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

// --- ⚠⚠ E-08 / T4.7 – THE TAKEOVER HOLDS THE KEYBOARD, AND UNTIL NOW IT ONLY SAID IT DID ---------
//
// THE DEFECT, STATED (docs/review-principles-2026-09-26/05-ui.md E-08, carried from U-06's second
// half). The root below has had `role="dialog" aria-modal="true"` since it shipped and no focus
// management at all – which `composables/dialogFocus.ts` calls worse than neither in its own opening
// paragraph, and it is right: `aria-modal` tells assistive technology to ignore everything outside
// this card while Tab is still free to walk into the tab bar behind it. A keyboard user could reach
// the shell a screen reader had just been told to ignore.
//
// ⚠ NO ESCAPE HANDLER, and that is the decision rather than an omission. This is a BLOCKING takeover
// like the knock: the career is over, the tab shell is gone, and the ways forward are the footer's
// own pills. A key that closed it would leave the player on a screen the shell does not draw.
//
// ⚠ `focusOn: 'card'` – ROUND 42 #8's ruling, on the same grounds. The first focusable in here is an
// album ARROW, and the epilogue arrives on the advance that ended the career, so a held Enter would
// turn the first page of her album before it had been read. Focus lands on the takeover itself, which
// `aria-label="Epilogue"` names, and Tab reaches every control from there.
//
// ⚠ `restore: false` – ROUND 42 #17(c), and for its measured reason: the press that advanced the week
// is what raised this, so «back where it came from» is back on Proceed, where a held Enter re-fires
// the thing that ended the career.
const card = useTemplateRef<HTMLElement>('card')
useDialogFocus(card, undefined, { focusOn: 'card', restore: false })

</script>

<template>
  <!-- ⚠ `tabindex="-1"` IS WHAT GIVES THE TRAP SOMEWHERE TO LAND (E-08 / T4.7) – the same four lines
       every other dialog in the app carries (R2-07). Not one word of the epilogue moved. -->
  <div
    v-if="view"
    ref="card"
    class="ending"
    role="dialog"
    aria-modal="true"
    aria-label="Epilogue"
    tabindex="-1"
  >
    <!-- THE RECORD (section 9.3): every milestone in order, paged by season. The floor under the
         album, for the player who wants the record rather than the story. -->
    <!-- ⭐⭐⭐ ROUND 46 #18 – THE REAL ALBUM, laid over this takeover. The `section` is what puts it in the
         same column as everything else here on a wide screen (`.ending > section`). Its Back arrow is the
         book's own control and returns to the last page; nothing is rebuilt.
         ⭐⭐ ROUND 48 #8 – AND IT IS `bare` TOO, on the owner's 07.10 ruling: the album itself sheds its backing and goes full-screen, THE LAST PAGE's own principle – his
         words are quoted in docs/rounds/round-48.md item 8 (a template comment may not carry them: no Cyrillic in templates, tests/template-copy-rules.test.ts).
         The same mechanism as the last page below: style.css paints EVERY `section` as a panel, so the book lay on a card whose 16px padding and 1px
         border took 17px off EACH side of the film – at 375 the film's window was 341px of a 375px screen and the first sheet began 33px in. `section.bare` removes the
         card; the film's own `.album-stage` already cancels the takeover's 16px gutter (the in-career host, `App.vue`, never had a section round the screen at all), so
         the book now spans the whole screen, like the in-career album – 375px, the first sheet at the gutter. -->
    <section v-if="albumOpen" class="ending-book bare">
      <AlbumScreen :book="book" @back="closeAlbum" />
    </section>

    <section v-else-if="scrollOpen" class="ending-scroll">
      <header class="ending-head">
        <Eyebrow as="h2">The whole record</Eyebrow>
        <button class="ending-link" type="button" @click="scrollOpen = false">Back to the album</button>
      </header>
      <div class="ending-scroll-body">
        <section v-for="s in view.scroll" :key="s.seasonIndex" class="scroll-season">
          <h3 class="scroll-year">{{ seasonYear(s.seasonIndex, startYear) }} <span>she was {{ s.ageYears }}</span></h3>
          <ul class="scroll-rows">
            <li v-for="r in s.rows" :key="`${r.week}-${r.label}`">
              <span class="scroll-week">{{ weekLabel(r.week, startYear) }}</span>
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

    <!-- THE LAST PAGE. ⚠ `ending-album` IS THE CLASS THE REEL'S SECTION WORE, KEPT ON PURPOSE: this section is
         still the card the fit tests measure, and a rename would be a diff with no behaviour in it.
         ⭐⭐⭐ ROUND 47 B1 #1 – AND IT IS `bare` NOW. The wrapper he asked to lose was never a rule of this file:
         style.css paints EVERY `section` as a panel (the panel colour, a 1px line, 16px of padding), so the
         content lay on a card 17px inside the takeover's own gutter on each side. `section.bare` is the app's
         existing opt-out (the Season screen's strips use it) – the ground behind the page is the takeover's own
         and stays. ⚠ THAT SENTENCE USED TO END «the record layer and the book layer above keep the panel: he asked about the last page» – the BOOK layer's half is
         overturned (round 48 #8, above: he asked about the album the next day); the record layer (`ending-scroll`) still keeps its panel – he did not ask about it. -->
    <section v-else class="ending-album bare">
      <header class="ending-head">
        <Eyebrow as="h2">The last page</Eyebrow>
      </header>

      <div v-if="closing" class="album-page">
        <!-- POINT 1 + POINT 2: the photograph, and the week in her own hand ON THE CARD. -->
        <Polaroid
          class="album-photo"
          :src="portraitUrl(closing.stage, closing.emotion)"
          :alt="`Aged ${closing.stage}`"
          tilt="var(--tilt-1)"
          :photo-height="228"
          :caption="closing.caption"
          tape
        />

        <!-- POINT 4: WHY this week is in the album. Always visible, empty page or not - the owner's
             visible selection rule, and what keeps section 6's promise. -->
        <p class="album-why">{{ closing.why }}</p>

        <!-- POINT 3: one hard fact off the milestone itself, never a computed summary. -->
        <p v-if="closing.fact" class="album-fact">{{ closing.fact }}</p>
        <p v-if="closing.week !== null" class="album-when">{{ weekLabel(closing.week, startYear) }}</p>
      </div>

      <!-- THE HAND-OFF (section 5.6): an OFFER, not a credits roll. -->
      <footer class="ending-foot">
        <!-- ⭐⭐⭐ ROUND 46 #18 – «VIEW THE ALBUM» IS FIRST ON THE LAST PAGE, because it is the thing this
             screen is for: the whole book, every sheet, before the figures and before the two doors.
             ⚠ THE LABEL IS A DRAFT (R46-S17) – invariant 4; an alternate is in the round ledger. -->
        <PrimaryPill class="ending-door-album" variant="cta" :disabled="game.busy" @click="openAlbum">
          View the album
        </PrimaryPill>

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
             may appear in a template. So «Won» becomes the family's share, the FIGURE is untouched
             (`prizeCents`, exactly as before), and the other four labels stay his.
             ⭐ RULING B, LATER THE SAME DAY – AND HE SPELLED IT HIMSELF, WITHOUT THE ARTICLE. The row
             shipped as «The family's share» and he wrote it back one word shorter. One character
             class of change, his own, at the one surface that carries it: the strings table's R46-3
             now records the ruled spelling and the date. The figure still has not moved.
             ⚠ HERE AND NOWHERE ELSE, which is invariant 4 read strictly. The only other labelled
             surface on this figure is `ForkDialog.vue`, whose label is «The tennis has paid» and was
             never the string he ruled on; the album's slot 6 says «$X won against $Y spent» in
             PROSE. Neither is «Won», so neither moves on either ruling. -->
        <!-- ⭐⭐⭐ ROUND 48 #3 – THE MONEY LIST IS THREE ROWS NOW, AND TWO OF THE OLD LABELS ARE GONE FROM IT.
             The owner, 07.10 (translated – no Cyrillic may appear in a template). His first ask was an ORDER
             – spent first, the family's share second, the portfolio third, her account last – and a doubt about
             the share (40.6M beside her 321.1M). The architect's probe on his own save settled the doubt: the share
             is the family's part of the prize money and nothing else, while her account is fed by her prize share,
             the whole gross of her sponsor cheques and her merch share – a part set beside a bank, correct by
             construction. And then, the same day, his second ruling REPLACED the order: the share row can simply go,
             «Spent» is renamed TENNIS & TRIPS (every tennis cost over all the years, the coaches included), and
             three numbers are left. (docs/rounds/round-48.md item 3; docs/decisions.md, 07.10.)
             ⚠ «Family's share» IS REMOVED, NOT HIDDEN – no `v-if`, no `display: none` – so its figure is nowhere in
             the DOM either. `view.money.prizeCents` stays on the wire (`ForkDialog.vue` prints it under its own
             label), and the paragraphs above are left as written: they are the record of the page as it was.
             ⚠ THE RENAME IS HIS WORD, SPELLED AS A LABEL. He typed capitals, and the `dt` rule below already sets
             `text-transform: uppercase` for every label in this block, so the source says «Tennis & trips» like its
             neighbours and the page SHOWS what he typed. ⚠ THE FIGURE UNDER IT IS UNTOUCHED – `outlayCents`, exactly
             as it was under the old label. Whether that sum is every tennis cost across the whole career is the
             architect's check against the banked seasons, and not a question for this file.
             ⚠ HER ACCOUNT IS STILL CONDITIONAL (R46-1, below): «three numbers» is the career that has one. -->
        <div class="ending-totals">
          <dl class="ending-money">
            <div><dt>Tennis & trips</dt><dd class="ending-fig">{{ formatCentsCompact(view.money.outlayCents) }}</dd></div>
            <!-- ⭐⭐⭐ RULING A, 18.09 – THE ONE LINE THE TWO FIGURES ABOVE IT CANNOT SAY. His ask is on
                 `careerMoney` in engine/world/reckoning.ts (no Cyrillic may appear in a template): the
                 reckoning stays TENNIS ONLY, and the family's whole portfolio – the wallet plus every
                 shelf row at what it is worth – gets a separate line of its own. A point-in-time read,
                 not a lifetime total, which is why it costs no schema.
                 ⚠ THE LABEL IS A DRAFT – docs/plans/life-wave-7-strings-2026-09.md, id R46-7. The
                 article is dropped to match the row he renamed that day (round 48 #3 has since removed
                 that row, so the spelling has nothing beside it to match), and both spellings are his
                 to move.
                 ⚠ IT RENDERS ALWAYS, unlike the draft row under it, because a family that owns
                 nothing and holds nothing still HAS a portfolio and the honest figure for it is the
                 wallet. A row that vanished on a poor career would answer his question for rich
                 careers only.
                 ⭐⭐⭐ ROUND 47 B1 #6 – AND THE ROW THAT STOOD BETWEEN THEM, «STILL OWNED», IS GONE. It was
                 the shelf at value; this is the wallet PLUS the shelf, so it is the more complete of the
                 two and the one ruling A asked for. On his screen they differed by exactly the wallet.
                 His ask: one of the two looks redundant. «The two figures above it» in the paragraph
                 before this one is the record of the page as it was.
                 ⭐⭐⭐ ROUND 48 #3 – THE ORDER IS HIS AGAIN, AND IT IS THE THIRD ONE: Tennis & trips is the one row
                 above this now (the old «Spent»; the share row left), and Her account stands UNDER it, last. -->
            <div>
              <dt>Family's portfolio</dt><dd class="ending-fig">{{ formatCentsCompact(view.money.portfolioCents) }}</dd>
            </div>
            <div v-if="view.money.herAccountCents > 0">
              <dt>Her account</dt><dd class="ending-fig">{{ formatCentsCompact(view.money.herAccountCents) }}</dd>
            </div>
          </dl>
          <!-- ⭐⭐⭐ ROUND 47 B1 #5 – THE THREE CAREER FACTS ARE ONE ROW, in the order he named them. -->
          <dl class="ending-facts">
            <div><dt>Best rank</dt><dd class="ending-fig">{{ view.bestRank === null ? '–' : `#${view.bestRank}` }}</dd></div>
            <div><dt>Titles</dt><dd class="ending-fig">{{ view.titles }}</dd></div>
            <div><dt>Seasons</dt><dd class="ending-fig">{{ view.seasonsPlayed }}</dd></div>
          </dl>
        </div>
        <!-- ⭐⭐⭐ ROUND 48 #4 – THE VOICE FLIPPED TO THE PARENT, AND THIS IS THE LINE THAT WAS SHOWN TO HIM. It read
             «She said one more year N times.» The owner, 07.10 (translated – no Cyrillic may appear in a template):
             it was not her who said it, it was us who proposed it, so reword it. «One more year» is the button the
             PARENT presses on the retirement card and `oneMoreYearCount` counts those presses, so the line credits
             the one who said it. The sentence is the draft R47-S4 of round 47's ledger – the one marked as his own
             reading – verbatim, and the pluralisation is as it was. ⚠ THE FINAL OFFER IS NOT HERE: «Nobody asked
             her this time. She said it herself» lives in engine/ending.ts and is truly hers. -->
        <p v-if="view.oneMoreYearCount > 0" class="ending-note">
          You said one more year <b class="ending-fig">{{ view.oneMoreYearCount }}</b> {{ view.oneMoreYearCount === 1 ? 'time' : 'times' }}.
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
            Her academy stands – <b class="ending-fig">{{ view.academy.stagesBuilt }}</b> of <b class="ending-fig">{{ view.academy.totalStages }}</b>
            stages built – and it earns <b class="ending-fig">{{ formatCentsCompact(view.academy.weeklyIncomeCents) }}</b> a week.
          </template>
          <template v-else>
            Her academy is begun – <b class="ending-fig">{{ view.academy.stagesBuilt }}</b> of <b class="ending-fig">{{ view.academy.totalStages }}</b>
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
        <!-- ⭐ ROUND 48 #5 – «for life» IS BOLD. The owner, 07.10 (translated): make «for life» bold, if the line
             exists. It does – this one – and it is those two words and nothing else: a plain `<b>`, because they are
             WORDS, and `ending-fig` is the figure style (Sora, larger, tabular) for numbers. The sentence is
             byte-identical around it; only the weight moved. -->
        <p v-if="view.lifetimeDeal" class="ending-note">
          The {{ view.lifetimeDeal.brand }} deal never ran out –
          <b class="ending-fig">{{ formatCentsCompact(view.lifetimeDeal.cashCents) }}</b> a year, <b>for life</b>.
        </p>

        <!-- ⚠⚠ E-09 / T4.8 (27.09) – THE REFUSAL HAD NOWHERE TO GO ON A BLOCKING TAKEOVER. This screen
             issues `resumeFromCollege` from the pill below and `newCareer` used to come from here too,
             and it rendered no error element of ANY kind – so a refused answer wrote `game.error` into
             Home's paragraph BEHIND the scrim while this card stayed up and nothing on it changed.
             Two paths reach it without an engine bug (the W2 commit for the five blocking cards names
             both): another tab's SAVE_CONFLICT, whose sentence already tells the player to reload, and
             B-02's, where the mutation is refused because `toSnapshot` threw.
             ⚠ NO COPY (invariant 4): `StoreError` owns no wording and renders whatever the store
             already wrote.
             ⚠ AND IT IS ABOVE THE PILLS, which is where ForkDialog and the five blocking cards put
             theirs – so the way forward stays LAST in the flow, where `measureDialog` reads the box
             off, and the epilogue's fit case measures the card with the line up. -->
        <StoreError />

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
        <!-- ⭐⭐⭐ ROUND 48 #6 – THE TWO DOORS ARE ONE ROW. The owner, 07.10 (translated – no Cyrillic may appear in
             a template): put «Raise another» and the succession door in one row. They were two stacked pills; a
             pair of ways off a blocking takeover is exactly what a row of equal halves is for.
             ⚠ A WRAPPER AND NOT A GRID ON THE FOOTER, for the instrument's sake: tests/component/fits.ts models a
             `display: flex` row (the tallest item decides, and what sits beside a control is not its tail) and knows
             nothing of a grid, so a grid on `.ending-foot` would have turned every verdict about this footer into a
             guess – the phone law's own measure of the page.
             ⚠ THE WRAPPER IS ALWAYS THERE, even with a single pill in it (the college ending's «Another year –», or
             a snapshot that carries no dynasty block): the equal halves are declared for the PAIR only
             (`.ending-doors > .tb-pill:not(:only-child)` below), so a lone pill keeps the width its label gives it,
             which is the page it was before. ⚠ ONE WORDING MOVED HERE AND HE ASKED FOR IT: the line door's epilogue
             label is «Dynasty» (the script block above carries both rulings). Everything else is a box. -->
        <div class="ending-doors">
          <PrimaryPill v-if="resumes !== null" variant="cta" @click="resumeCollege">
            Another year –
          </PrimaryPill>

          <!-- ⭐⭐⭐ ROUND 47 #12 – ONE TAP, AND IT GOES TO THE BEGINNING. The lead sentence and the
               three capital cards that used to stand here left with the career this file no longer
               creates; the script block above says why the route retired the question rather than an
               agent retiring the words, and the strings table's §8 carries the removal for his pass.
               `Raise another` is his label and is untouched.
               ⭐⭐ 08.10 – THE ACCENT LEFT THIS PILL: «наверное эту кнопку надо желтой сделать, а не
               соседнюю, которая про новый старт» – the yellow belongs to the door that CONTINUES her
               line, not to the unrelated fresh start, so this one is `ghost` now and the dynasty door
               below carries `cta`. The college branch above keeps its `cta`: it stands alone there and
               is the way forward. `ending-door-start` is a TEST HOOK, not a style. -->
          <PrimaryPill v-else class="ending-door-start" variant="ghost" :disabled="game.busy" @click="raiseAnother">
            Raise another
          </PrimaryPill>

          <!-- ⭐⭐⭐ v86 – THE SECOND AFFORDANCE, AND IT IS BESIDE «Raise another» RATHER THAN INSTEAD OF
               IT. Two different things: one starts an unrelated story, the other continues this one.
               The script block says why it renders on every ending and why neither label names or
               ages the girl; both labels are DRAFTS for his pass.
               ⚠ IT SITS INSIDE THE SAME `v-else` FOOTER BRANCH, so a college ending that can still be
               resumed shows its own way forward and not this – that footer's exhaustiveness is what
               keeps a blocking takeover from becoming a dead end, and this control must not be the
               thing that breaks it. -->
          <PrimaryPill
            v-if="resumes === null && dynasty"
            class="ending-line"
            variant="cta"
            :disabled="game.busy"
            @click="continueLine"
          >
            {{ continueLabel }}
          </PrimaryPill>
        </div>

        <!-- ⭐⭐⭐ ROUND 47 B1 #12 – «THE WHOLE RECORD» IS UNDER THE DOORS NOW, and only the service export is
             below it. It stood above the doors, between the notes and the pills; the owner asked for it at
             the very bottom (his words are on the script block, translated). The label is his and unmoved. -->
        <button class="ending-link" type="button" @click="scrollOpen = true">The whole record</button>

        <!-- ⭐⭐⭐ ROUND 46 #20 – THE SERVICE EXPORT (see the script block). Last, small, a link: it is a tool for
             the person testing the build, and it must be reachable BEFORE «Raise another» drops the career.
             ⚠ THE LABEL IS A DRAFT (R46-S18) – invariant 4. -->
        <button class="ending-link ending-dev" type="button" :disabled="game.busy" @click="exportSave">
          Export save (dev)
        </button>
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

/* ⭐ ROUND 46 #18 – THE PAGER'S RULES LEFT WITH THE PAGER: `.ending-count`, `.album-nav`, `.album-arrow` and
   `.album-dots` styled the reel's «n / 7», its Back / Next and its dots, none of which is drawn now. The
   page's own five rules below are unchanged – that page is the one that stayed. The real album brings
   its own sheet (`screens/AlbumScreen.vue`). */

/* The last page: one polaroid, centred, with the reason under it. */
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

.ending-foot {
  margin-top: 26px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
}

/* ⭐⭐⭐ ROUND 48 #6 – THE TWO DOORS ARE ONE ROW (the owner, 07.10, translated: «Raise another» and the succession
   door in one row). A flex row of two EQUAL halves. `flex-basis: 50%` is what makes the halves equal whatever the
   labels' lengths are (a basis of `auto` would hand the longer label the wider pill), and `flex-shrink: 1` with
   `min-width: 0` is what lets a label wrap INSIDE its pill when the half is narrower than the text – so neither door
   can push the other off the row, at 375 or at 320, and the row never turns into two. The two halves and the gap are
   12px over the row, so each pill shrinks by exactly 6px and they come out the same width.
   ⚠ NOT `flex-basis: 0`, which was the first spelling and was MEASURED in Chromium (07.10, 375x667): a zero basis
   still leaves each pill its own padding and border, and the ghost pill has a 1px border the CTA has not, so the
   halves came out 164.5 and 166.5px. Buttons are `box-sizing: border-box` in every browser, so a 50% basis counts
   the border too and the shrink is the same for both.
   The CTA's own `padding: 12px 26px` would leave a half of ~165px (a 375 phone) about 110px of label, so inside
   the pair the sides are 12px.
   ⚠ THE LONGHANDS AND NOT `flex: 1 1 0`, because happy-dom does not expand every shorthand, and a rule the mounted
   layer cannot read is a rule the next wave can delete (style.css says the same of the CTA's two margin longhands).
   ⚠ FOR THE PAIR ONLY: a lone pill – the college ending's «Another year –», or a snapshot with no dynasty block –
   is NOT stretched, it keeps the width its label gives it, as it did before the wrapper existed.
   ⚠ 460 IS THE CAP `.ending-totals` already uses, the widest thing left on this page. */
.ending-doors {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: center;
  gap: 12px;
  width: 100%;
  max-width: 460px;
}

.ending-doors > .tb-pill:not(:only-child) {
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: 50%;
  min-width: 0;
  padding-left: 12px;
  padding-right: 12px;
}

/* ⭐⭐⭐ ROUND 47 B1 #4/#5/#7 – ONE GRID, TWO SHAPES, AND EVERY FIGURE IS SORA, BOLD AND LARGER.
   The owner, 06.10 (translated): the layout still moves and the numbers jump; the three career facts in one
   row, bigger, Sora, bolder; every number bold, larger, Sora. The old list was `repeat(auto-fit, minmax(84px,
   1fr))` – a column COUNT that changed with the width, so a figure that was the third of a row at 375 became
   the second at 360 and the whole page re-flowed under his thumb.

   THE MONEY ROWS are a two-column grid, `minmax(0, 1fr) auto`: the figure column is as wide as the widest
   figure and the label column takes the rest, and every row wrapper is `display: contents` (round 46 R5's idiom
   on the season popup) so the label and the figure of ALL rows are items of the same grid and line up. A long
   label wraps in its own column; nothing can push the page sideways, and nothing depends on the width.
   THE FACTS are one row of three equal columns at every width. */
.ending-totals {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin: 0;
  width: 100%;
  max-width: 460px;
}

.ending-money,
.ending-facts {
  margin: 0;
}

.ending-money {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  column-gap: 12px;
  row-gap: 10px;
  align-items: baseline;
}

.ending-money > div {
  display: contents;
}

.ending-money dt {
  text-align: left;
}

.ending-money dd {
  font-size: 22px;
  line-height: 1.15;
  text-align: right;
}

.ending-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.ending-facts > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ending-facts dd {
  font-size: 30px;
  line-height: 1.1;
}

.ending-totals dt {
  font-size: 11px;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

.ending-totals dd {
  margin: 0;
}

/* The ONE figure style: Sora, bold, tabular. It is on every `dd` above and, inline, on the numbers inside the
   three notes below – `b` because it is a figure and nothing else, larger than the 14px prose around it. */
.ending-fig {
  font-family: var(--font-heading);
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

b.ending-fig {
  font-size: 1.15em;
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
