<script setup lang="ts">
// =================================================================================================
// ⭐⭐ ROUND 24 #4 – GRADUATION IS THE LAST COLLEGE SCREEN, AND IT HANDS BACK TO HOME
// =================================================================================================
//
// The owner, 20.08: «После выпуска экран graduated, потом домашний экран». Before this, the fourth
// year simply ENDED: `finishCollege` takes the latch off for good, the epilogue vanishes mid-click
// and the tab shell reappears with no beat between them. Four years closed with less ceremony than
// an ordinary training week.
//
// ⚠ IT COVERS BOTH DOORS OUT, because the engine has exactly two and they run through the same code
// (`leaveCollegeState` + one kept milestone row): the four years spent, and «Back on tour now» taken
// at a boundary. A card for one of them would have left the other as the silent exit it is today.
// The heading is the only thing that differs, and it differs on a COUNT rather than on a flag.
//
// ⚠ IT READS THE SNAPSHOT, NEVER A STOP REASON – the argument App.vue makes for the knock, the
// ending, the injury report and the season recap. `world.college` survives the freeze with
// `doneWeek` set, so this beat is reconstructible after a reload; a stop reason dies with the command
// that produced it, and `resumeFromCollege` is a command like any other.
//
// ⚠ AND IT INVENTS NOTHING AND GRADES NOTHING (career-contract §6, ruling 4). Every figure below was
// MEASURED BY THE ENGINE at the two ends of a year and persisted in `CollegeYear` – there is no
// verdict here about whether the years were worth it, because the game does not grade her. The
// engine's own sentence about the four years («X years of student tennis…», `collegeEpilogueLine`)
// is a kept milestone and is in the news feed on the very screen this hands back to.
//
// ⭐⭐ T14 – AND FOUR YEARS NOW HAVE A PICTURE OF THEMSELVES (owner, 11.09: «graduated – …надо
// встроить на окончание колледжа где-то, может быть в попапе…»). The painting shipped with the art
// set and nothing had ever asked for it.
//
// ⚠⚠ ON THE GRADUATE'S ARM ONLY, and it is the same split this card's heading already makes on a
// COUNT. `engine/kidLife.ts`: «a tile that knew only "she went" and "she graduated" would print the
// graduate's line for a girl who left after one year» – a photograph of a girl holding up her
// results is that line in a louder voice, so the leaver's card carries no picture at all. The test
// is `finishedTheCourse`, shared with the home portrait's one week (shared/avatarEmotion.ts), so
// the two surfaces cannot disagree about who graduated.
//
// ⚠ NOT A WORD CHANGES. Every sentence on this card is byte-identical to the one that shipped
// (CLAUDE.md invariant 4); the image is decorative and carries an empty `alt`, which is what
// `.injury-stop-art` – the one other painting on a `.dialog-card` – does for the same reason.
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { formatCents } from '../shared/money'
import { weekLabel } from '../shared/dates'
import { ENDINGS } from '../engine/ending'
import { finishedTheCourse } from '../shared/avatarEmotion'
import { GRADUATED_ART_STEM, graduatedUrl } from '../art/preload'
import { facePoint } from '../art/faceRects'
import { useDialogFocus } from '../composables/dialogFocus'
import PrimaryPill from './ui/PrimaryPill.vue'

const game = useGameStore()
const emit = defineEmits<{ (e: 'continue'): void }>()

const card = ref<HTMLElement | null>(null)
useDialogFocus(card)

const college = computed(() => game.snapshot?.college ?? null)
const years = computed(() => college.value?.years ?? [])

/** THE FOUR YEARS, OR FEWER. `ENDINGS.collegeYears` rather than a template's idea of four – the same
 *  discipline `CollegeProgressView.totalYears` keeps one door along.
 *
 *  ⚠ T14: the comparison moved into `finishedTheCourse` and did not change – `>=` against the same
 *  two numbers. It is shared rather than repeated because the portrait's one week asks the identical
 *  question, and a picture and a heading that disagreed about a degree would be worse than either. */
const graduated = computed(() => finishedTheCourse(years.value.length, ENDINGS.collegeYears))

/** The painting, and where her face is in it – framed off the ONE face table, exactly as the injury
 *  popup frames the picture of the week she went down. */
const artUrl = graduatedUrl()
const artStyle = (() => {
  const p = facePoint(GRADUATED_ART_STEM)
  return { objectPosition: `${p.x}% ${p.y}%` }
})()

const title = computed(() =>
  graduated.value ? 'She has graduated.' : 'She has left the scholarship.',
)

/** What the years did to the family's balance, summed off the rows the engine banked. Arithmetic
 *  over measurements, never a second measurement. */
const bankedCents = computed(() => years.value.reduce((sum, y) => sum + y.fundsDeltaCents, 0))

/** How many of the years her country wrote to her in. `callUp` is null on a year nobody did. */
const callUps = computed(() => years.value.filter((y) => y.callUp !== null).length)

const callLine = computed(() => {
  const n = callUps.value
  if (n === 0) return 'Her country never called.'
  return `Her country called in ${n} of them, and paid her nothing, which is what it pays everybody.`
})

/** #A -> #B, or a dash at either end where she was on no list at all. `null` IS NOT #1 – the same
 *  contract `LadderView.rank` keeps. */
function rankMark(rank: number | null): string {
  return rank === null ? '–' : `#${rank}`
}
</script>

<template>
  <!-- No handler on the scrim: this is a once-per-career beat and a stray tap outside must not spend
       it. The same rule TourBriefingDialog states for the same reason. -->
  <div v-if="college" class="dialog-overlay">
    <div
      ref="card"
      class="dialog-card season-summary college-done"
      role="dialog"
      aria-modal="true"
      aria-labelledby="college-done-kicker college-done-title"
      tabindex="-1"
    >
      <!-- The graduate's picture, and hers alone – see the header. A leaver's card opens on the
           kicker, exactly as every card here did before T14. -->
      <img v-if="graduated" class="college-done-art" :src="artUrl" :style="artStyle" alt="" />
      <p id="college-done-kicker" class="season-summary-kicker">College · {{ weekLabel(college.doneWeek ?? 0) }}</p>
      <h2 id="college-done-title" class="season-summary-title">{{ title }}</h2>

      <!-- THE YEARS, AS THE ENGINE BANKED THEM. One row each, and the two ends of each year are the
           only numbers on it – nothing here is recomputed from today's world, because by now
           `pruneResults` has deleted the results these ranks were built from. -->
      <ul class="college-done-years">
        <li v-for="y in years" :key="y.index">
          <span class="college-done-year">Year {{ y.index }}</span>
          <span class="college-done-rank">{{ rankMark(y.startRank) }} to {{ rankMark(y.endRank) }}</span>
          <span class="college-done-money">{{ formatCents(y.fundsDeltaCents) }}</span>
        </li>
      </ul>

      <dl class="college-done-totals">
        <div>
          <dt>Years</dt>
          <dd>{{ years.length }}</dd>
        </div>
        <div>
          <dt>Banked</dt>
          <dd>{{ formatCents(bankedCents) }}</dd>
        </div>
      </dl>

      <p class="college-done-call">{{ callLine }}</p>
      <p class="college-done-next">Qualifying is the way forward again. Her week is on the home screen.</p>

      <div class="college-done-actions">
        <PrimaryPill @click="emit('continue')">Continue</PrimaryPill>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Shares `dialog-overlay` / `dialog-card` / `season-summary*` with the other blocking popups, so the
   scrim, the card and the two heading lines cannot drift apart from them – and so the round-20 #3
   height bound (`max-height` / `overflow-y` on `.dialog-card`, src/style.css) applies here by
   construction rather than by remembering. `tests/component/round24-college-shell.test.ts` measures
   the Continue against a 375x667 phone and mutates the bound to prove the measurement can fail.

   ⚠ EVERY COLOUR IS A DECLARED APP TOKEN WITH NO FALLBACK – the round-17 #3 lesson: `var(--card,
   #fff)` shipped four unreadable buttons because `--card` is declared nowhere and the fallback won. */
/* ⭐ T14 – the graduation painting, full-bleed across the top of the card.
   THE MECHANICS ARE `.injury-stop-art`'s (src/style.css): `width: calc(100% + 32px)` with a -16px
   side margin cancels the card's own padding exactly, `cover` plus the face-table `object-position`
   keeps her head in the strip, and the top corners take the card's radius.
   ⚠ ONE DELIBERATE DIFFERENCE FROM THAT PRECEDENT: the corner token is `--radius-dialog` (12px),
   which is what `.dialog-card` itself declares – the injury strip rounds to `--radius-panel` (10px)
   and is 2px out of step with the box it sits in. Copied mechanics, not a copied mismatch.
   ⚠ THE HEIGHT IS DECLARED IN PIXELS AND THAT IS LOAD-BEARING, not a style choice: the round-20
   fit model measures a box by its declared height, and an `<img>` with neither height nor ratio
   measures as ZERO – i.e. a picture the phone measurement cannot see. 132 rather than the injury
   popup's 168 because this card carries four year rows, the totals and two paragraphs under it;
   at 375x667 the graduate's card then measures 523.75px against 635px of room, with Continue at
   y=540..578 (tests/component/wave3-graduated-portrait.test.ts §C, where the same measurement is
   mutated until it fails). */
.college-done-art {
  display: block;
  width: calc(100% + 32px);
  height: 132px;
  margin: -16px -16px 12px;
  object-fit: cover;
  border-radius: var(--radius-dialog) var(--radius-dialog) 0 0;
}

.college-done-years {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.college-done-years li {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
  color: var(--ink-soft);
}

.college-done-year {
  flex: 0 0 auto;
  font-weight: 700;
  color: var(--ink);
}

.college-done-rank {
  flex: 1 1 auto;
  font-variant-numeric: tabular-nums;
}

.college-done-money {
  flex: 0 0 auto;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}

.college-done-totals {
  display: flex;
  gap: 18px;
  margin: 14px 0 0;
}

.college-done-totals div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.college-done-totals dt {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

.college-done-totals dd {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.college-done-call,
.college-done-next {
  margin: 12px 0 0;
  font-size: 13.5px;
  line-height: 1.45;
  color: var(--ink-soft);
}

.college-done-actions {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
