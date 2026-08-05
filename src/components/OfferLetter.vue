<script setup lang="ts">
// THE LETTER - docs/specs/offers-and-the-inbox.md §3. One offer, on paper, with the two controls
// under it and how long is left to use them.
//
// ⚠ THE PAPER IS NOT A MODIFICATION, AND CHECKING THAT BEFORE WRITING ANY CSS IS THE POINT. The
// owner asked for «чистая и аккуратная бумага без скотча, это всё-таки письмо, а не записка» - and
// `PaperNote`'s `tape`, `torn` and `marginRule` are all opt-in props that default to false. A plain
// <PaperNote> is ALREADY a clean, untaped, un-torn sheet in the warm stock with the Caveat hand. So
// this caller asks for none of them. The only thing it does ask for is `size="letter"`, because a
// letter is a page rather than a corner scrap and wants a margin instead of the 12/14px scrap
// padding.
//
// ⚠⚠ AND THE TILT IS ZERO ON PURPOSE - DO NOT "FIX" IT BACK TO THE HOUSE ANGLE. Every other piece of
// paper in this game is laid down «всегда с небольшим наклоном и тенью», and that is right for an
// ARTEFACT: a memory, a receipt, a note dropped on a surface. A letter you are deciding on is a
// letter you are HOLDING, square to the reader. The tilt is exactly what makes paper read as FOUND,
// and this is the first paper object in the game that is ADDRESSED TO YOU. It is the one call site
// where the house angle would be wrong, which is why it is written out here rather than left to be
// inferred from a missing prop.
//
// ⚠ AND THE TERMS ARE ON THE PAPER, WHICH IS A RULE RATHER THAN A STYLE (spec §3). "We would love to
// support your daughter" is the voice; what the button commits to is the deal, and both belong on
// the sheet. A letter whose consequence is not on its face is a trap rather than a decision - so the
// terms block below is generated from `terms` itself and cannot drift away from what signing
// actually does.
//
// ⚠⚠ INCLUDING WHAT HAPPENS IF SHE FALLS SHORT, and that is the half that decides whether signing is
// a decision or a guess. The owner, 31.07: «надо при подписании прояснить, что будет, если девочка не
// выполнит условия, сейчас это непонятно совсем». Stating only the upside ("$2,000 of kit, and she
// plays eight events") leaves a player committing to an obligation whose failure mode is invisible,
// which is not choosing. The consequence is spec §4.1's, and it is mild: the contract lapses at the
// season boundary and is not renewed, nothing is clawed back, a junior kit deal is not a loan.
//
// It is written in the SHOP's voice rather than as a warning label under the paper, because that is
// what it is - an ordinary commercial term a shop would state plainly and without menace. And it is
// NOT in the confirm dialog: `ConfirmDialog` confirms the act, it does not counsel against it. Spec
// §4c is explicit that the game never editorialises; the rule being followed here is only that the
// paper never leaves a consequence unstated.
//
// The other end of that promise is `settled` below: once the season boundary has judged the deal, the
// letter reports what actually happened and against which number. An obligation that fails silently
// is the same invisibility one step later.
import { computed } from 'vue'
import type { EntryLetterTerms, KitOfferTerms, Offer, TourLetterTerms } from '../shared/protocol'
import { formatCents } from '../shared/money'
import { weekLabel, weekRange } from '../shared/dates'
import PaperNote from './ui/PaperNote.vue'

const props = defineProps<{ offer: Offer; week: number }>()
const emit = defineEmits<{ sign: [string]; refuse: [string] }>()

/** Vite's base path, so the letterhead resolves under a sub-path deploy the same way the art does. */
const base = import.meta.env.BASE_URL

// THE TOURNAMENT DESK'S LETTERS (W2-LADDER §6) share the paper and nothing else: no letterhead
// image (the desk has no brand), no actions (nothing to sign or refuse - the letter is a record),
// and the one consequence this wave has no number for is stated as the sentence the owner asked
// for. The kit computeds below stay kit-only; Vue's lazy computeds mean they never evaluate for a
// desk letter, and the v-if in the template keeps the two papers apart.
const isEntry = computed(() => props.offer.kind === 'entry')
const entryTerms = computed(() => props.offer.terms as EntryLetterTerms)

// THE TOUR'S OWN LETTERS (W3-ACT2, act2-pro-tour.md section 6). Three notices, one sheet, no
// buttons: a rule is not a decision.
//
// THE VOICE IS THE RULING. «Мы ни за что не наказываем» - the tour has obligations and states them,
// the GAME never leans on the player and never scolds. So the due notice reads as a fixture list
// with a price on it, the penalty notice reads as an invoice with a running balance, and the
// suspension notice states a date. Nothing here says "you should have gone".
const isTour = computed(() => props.offer.kind === 'tour')
const tourTerms = computed(() => props.offer.terms as TourLetterTerms)

const terms = computed(() => props.offer.terms as KitOfferTerms)

/** THE GOODBYE, in the brand's own voice, differing on WHY (see KitEndReason). Each reads as a
 *  person writing, not as a rule firing – the deal ended, and the letter says the true reason
 *  without scolding: the tour is what has terms, the game does not tell anybody off. */
const endBody = computed(() => {
  const t = terms.value
  const played = t.endedEventsPlayed ?? 0
  if (t.ended === 'events') {
    return `We kitted her out all season and enjoyed doing it. We asked for ${t.minEventsPerSeason} tournaments a year and she played ${played}, so this is where we shake hands – our end of it is done.`
  }
  if (t.ended === 'standing') {
    return `We kitted her out all season and enjoyed doing it. We back a girl who is somebody at home, and she has slid out of that band while she has been away, so this is where we shake hands.`
  }
  return `That is our term served, and she held up every part of it – ${played} tournaments in our kit this season. We are stopping here for now, with thanks.`
})
/** THE LETTERHEAD, BY TIER. `public/images/sponsors/<tier>.webp` - never a filename written out at a
 *  call site, which is why the national and global rungs needed no change when the ladder grew.
 *
 *  ⚠ THE TIER *IS* THE KEY AGAIN (05.08). Between W3-ACT2 and today this went through
 *  `sponsorArtKey`, which redirected the three professional rungs onto `global.webp` because only
 *  three marks existed; the owner has now drawn Baseline Athletic, Meridian Sport and Aurelia, they
 *  ship as `tour` / `premium` / `icon`, and the redirect is retired rather than left as an identity
 *  function - `sponsorArtKey`'s own note said that is what shipping the art would mean. All six
 *  rungs print their own mark, and `tests/art-placeholders.test.ts` asserts every rung on the ladder
 *  has a file, so a seventh rung added without art fails there instead of silently borrowing here. */
const markUrl = computed(() => `${base}images/sponsors/${terms.value.tier}.webp`)

/** ⚠ WHAT THEY COVER, IN THE BRAND'S OWN WORDS - the sentence the whole ladder exists to make
 *  readable. The rung is COVERAGE, not prestige (see `SponsorTier`), so the line that names the
 *  covered kit IS the difference between the three letters, and it is generated from `covers` rather
 *  than written three times: a rung whose coverage changed and whose letter did not would be the
 *  exact trap spec §3 forbids. */
const LINE_WORDS: Record<string, string> = {
  strings: 'strings',
  frame: 'racquets',
  shoes: 'shoes',
}
const coveredWords = computed(() => terms.value.covers.map((l) => LINE_WORDS[l] ?? l))
const coveredList = computed(() => {
  const words = coveredWords.value
  if (words.length === 0) return 'nothing'
  if (words.length === 1) return words[0]
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`
})
/** ...AND WHAT THEY DO NOT, which is the half a player can act on. A letter that lists what is
 *  covered and stays quiet about the rest reads as "everything" to anyone who is not counting, and
 *  the whole decision is what is still hers to buy. */
const uncoveredList = computed(() => {
  const missing = (['strings', 'frame', 'shoes'] as const)
    .filter((l) => !terms.value.covers.includes(l))
    .map((l) => LINE_WORDS[l])
  if (missing.length === 0) return ''
  if (missing.length === 1) return missing[0]
  return `${missing.slice(0, -1).join(', ')} and ${missing[missing.length - 1]}`
})
const travelPct = computed(() => Math.round((terms.value.travelShare ?? 0) * 100))
/** A brand writing to a family says "three seasons", not "3 seasons" - the letter is handwritten and
 *  a numeral in the middle of a sentence reads as a form. Falls back to the numeral past the terms
 *  this game can actually issue rather than carrying a dictionary. */
const SEASON_WORDS = ['', 'One season', 'Two seasons', 'Three seasons', 'Four seasons']
const seasonWord = computed(() => {
  const n = terms.value.seasons ?? 1
  return SEASON_WORDS[n] ?? `${n} seasons`
})

const live = computed(() => props.offer.state === 'open' && props.week <= props.offer.deadlineWeek)
/** How long is left, in whole weeks, counting the current one. The quiet half of the owner's ask:
 *  «давать человеку какое-то время на подумать». */
const weeksLeft = computed(() => Math.max(0, props.offer.deadlineWeek - props.week + 1))

/** What the paper says has already happened, for a letter that is no longer a decision. Kept in the
 *  inbox rather than deleted, because "what did I do about that?" is a real question and the answer
 *  is the record.
 *
 *  ⚠ A SIGNED DEAL REPORTS ITS OUTCOME, not merely that it was signed. The letter promises what
 *  falling short costs; this is the other end of that promise - the player can come back and see
 *  whether it happened, and against which number. `eventsPlayed` is written by the season-boundary
 *  review, so an unreviewed deal (still running) simply says it is running. */
const settled = computed(() => {
  const o = props.offer
  switch (o.state) {
    case 'signed': {
      const t = o.terms as KitOfferTerms
      // ⚠ A MULTI-SEASON DEAL IS REVIEWED EVERY YEAR AND ENDS ONCE, so "has it been reviewed" and
      // "is it over" stopped being the same question when the ladder shipped. `untilWeek` is the
      // only one of the two that says whether she is still in their kit this week.
      const running = props.week <= (o.untilWeek ?? -1)
      if (o.eventsPlayed === undefined) return running ? 'Signed – they are kitting her out.' : 'Signed.'
      const asked = t.minEventsPerSeason
      if (running) return `Signed – they are kitting her out. ${o.eventsPlayed} of ${asked} events last season.`
      return o.eventsPlayed >= asked
        ? `Signed. She played ${o.eventsPlayed} of the ${asked} events they asked for, and the deal ran its course.`
        : `Signed. She played ${o.eventsPlayed} of the ${asked} events they asked for, so it ended. Nothing was paid back.`
    }
    case 'refused':
      return 'Turned down.'
    case 'expired':
      return 'Expired – they needed an answer.'
    default:
      return props.week > props.offer.deadlineWeek ? 'Expired – they needed an answer.' : ''
  }
})
</script>

<template>
  <!-- THE TOURNAMENT DESK (W2-LADDER, §6's informational half): same paper, held square like every
       letter addressed to you, no letterhead and no buttons - a registration is a record, not a
       decision. The cancellation confirmation is the same sheet, shorter. -->
  <article v-if="isEntry" class="offer-letter">
    <PaperNote class="offer-paper" size="letter" :tilt="0">
      <template v-if="!entryTerms.cancelled">
        <p class="offer-body">
          Your entry for the {{ entryTerms.label }} is confirmed – she is in the draw for
          {{ weekRange(entryTerms.eventWeek) }}.
        </p>
        <ul class="offer-terms">
          <li>She is expected on court that week.</li>
          <li>
            Withdrawal is free until the end of {{ weekLabel(entryTerms.freeUntilWeek) }} – the
            entry fee comes back and the year's entry is returned.
          </li>
          <li>After that the tournament's rules apply – the tour records late withdrawals and absences.</li>
        </ul>
      </template>
      <template v-else>
        <p class="offer-body">
          Your withdrawal from the {{ entryTerms.label }} ({{ weekRange(entryTerms.eventWeek) }})
          is confirmed – in time, free of charge, and nothing is recorded against her. The entry
          fee is on its way back.
        </p>
      </template>
      <p class="offer-sign-off">– Tournament desk</p>
    </PaperNote>
    <div class="offer-foot">
      <p class="offer-window settled">Filed {{ weekLabel(offer.week) }}.</p>
    </div>
  </article>

  <!-- THE TOUR (W3-ACT2). Warning, charge, sentence - in that order in a career, and the first of
       them always arrives before any of the others can. -->
  <article v-else-if="isTour" class="offer-letter">
    <PaperNote class="offer-paper" size="letter" :tilt="0">
      <template v-if="tourTerms.notice === 'due'">
        <p class="offer-body">
          The {{ tourTerms.label }} ({{ weekRange(tourTerms.eventWeek ?? 0) }}) is a required event
          at her current ranking, and entries close at the end of
          {{ weekLabel(tourTerms.freeUntilWeek ?? 0) }}.
        </p>
        <ul class="offer-terms">
          <li>She is on the required list for this one – the top 50 play the majors, the 1000s and six 500s.</li>
          <li>Not entering costs {{ tourTerms.points }} penalty points and a zero in one counted slot.</li>
          <li>Entering and then withdrawing after the list closes costs more; not appearing costs most.</li>
        </ul>
      </template>
      <template v-else-if="tourTerms.notice === 'penalty'">
        <p class="offer-body">
          {{ tourTerms.points }} penalty
          {{ tourTerms.points === 1 ? 'point has' : 'points have' }} been recorded
          <template v-if="tourTerms.label">for the {{ tourTerms.label }}</template>
          <template v-else>against this season's required 500-level events</template>.
        </p>
        <ul class="offer-terms">
          <li>Her total is {{ tourTerms.runningPoints }} of {{ tourTerms.suspensionAt }} over the last 52 weeks.</li>
          <li>Points fall out of that window on their own as the year moves.</li>
          <li>At {{ tourTerms.suspensionAt }} the tour suspends entries for four weeks.</li>
        </ul>
      </template>
      <template v-else>
        <p class="offer-body">
          Entries are suspended through {{ weekLabel(tourTerms.untilWeek ?? 0) }} –
          {{ tourTerms.runningPoints }} penalty points inside 52 weeks.
        </p>
        <ul class="offer-terms">
          <li>She may train and travel; she may not enter a tournament until that week has passed.</li>
          <li>Nothing is owed and nothing is taken back.</li>
        </ul>
      </template>
      <p class="offer-sign-off">– Tour office</p>
    </PaperNote>
    <div class="offer-foot">
      <p class="offer-window settled">Filed {{ weekLabel(offer.week) }}.</p>
    </div>
  </article>

  <!-- THE BRAND'S GOODBYE (owner, 04.08). A notice, not a proposal: no Sign, no Refuse, no window –
       the whole point is that it ARRIVES, because the status line on last year's letter was already
       right and already unread. Same letterhead, so the player recognises who is writing. -->
  <article v-else-if="terms.ended" class="offer-letter">
    <PaperNote class="offer-paper" size="letter" :tilt="0">
      <img class="offer-mark" :src="markUrl" :alt="terms.brand" />
      <p class="offer-body">{{ endBody }}</p>
      <p class="offer-body">
        Her kit is hers – there is nothing to send back and nothing to pay. From next season her
        {{ coveredList }} are the family's again.
      </p>
      <p class="offer-sign-off">– {{ terms.brand }}</p>
    </PaperNote>
    <div class="offer-foot">
      <p class="offer-window settled">Filed {{ weekLabel(offer.week) }}.</p>
    </div>
  </article>

  <article v-else class="offer-letter">
    <!-- tilt is 0 and STAYS 0 – see the block comment at the top of this file. -->
    <PaperNote class="offer-paper" size="letter" :tilt="0">
      <img class="offer-mark" :src="markUrl" :alt="terms.brand" />
      <p class="offer-body">
        We have been watching your daughter play all season, and we would like to put her in our kit.
      </p>
      <!-- THE DEAL, IN THE WORDS THE BUTTON COMMITS TO. Generated from the terms themselves; the
           last line is the FAILURE MODE, and the script header above says why it has to be here. -->
      <ul class="offer-terms">
        <li>
          Her {{ coveredList }} – up to {{ formatCents(terms.kitAllowanceCents) }} of kit over the
          season, on us.<template v-if="uncoveredList"> Her {{ uncoveredList }} stay hers.</template>
        </li>
        <li>
          We keep {{ coveredWords.length === 1 ? 'them' : 'it all' }} fresh. She will not play a
          match on dead {{ coveredWords[0] }}.
        </li>
        <li v-if="travelPct > 0">And we will take {{ travelPct }}% of what a trip costs her.</li>
        <li>In return she enters at least {{ terms.minEventsPerSeason }} tournaments a season – we are paying to be seen.</li>
        <!-- ⚠ EXCLUSIVITY IS A TERM AND BELONGS ON THE PAPER. It is the counterweight to the
             coverage – one brand at a time is what stops a career collecting all three rungs – and
             a player who cannot read it here would be committing to it blind. In the brand's own
             voice, plainly, the way a commercial term is really written. -->
        <li>And while she is in our kit she is in nobody else's.</li>
        <li>
          {{ seasonWord }}, starting with the one ahead.
          <template v-if="terms.keepDomesticRank">
            We back a girl who is somebody at home, so she stays inside the national top
            {{ terms.keepDomesticRank }} while we are with her.
          </template>
          Hold up your end and we will write again after; fall short and we shake hands at the end of
          that season and part friends. Either way the kit is hers and there is nothing to pay back.
        </li>
      </ul>
      <p class="offer-sign-off">– {{ terms.brand }}</p>
    </PaperNote>

    <div class="offer-foot">
      <p v-if="live" class="offer-window">
        {{ weeksLeft }} {{ weeksLeft === 1 ? 'week' : 'weeks' }} to decide. The terms will not change.
      </p>
      <p v-else class="offer-window settled">{{ settled }}</p>
      <div v-if="live" class="offer-actions">
        <button class="offer-refuse" @click="emit('refuse', offer.id)">Refuse</button>
        <button class="offer-sign primary" @click="emit('sign', offer.id)">Sign</button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.offer-letter {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ⚠ THE PAPER'S OWN BOX IS REACHED THROUGH `:deep`, because PaperNote's root is a positioned WRAPPER
   (the tape hangs off it) and the sheet is the box inside. A rule that assumes the root IS the paper
   does not fail loudly - it paints outside the background. tests/paper-note.test.ts pins the split
   for every caller. Nothing here sets a padding: `size="letter"` owns it. */
.offer-paper :deep(.tb-paper) {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* The letterhead. Sized off the sheet rather than the file: the mark reads as printed stationery, so
   it sits at the top left of the page at a stationery's scale and never fills the column. */
.offer-mark {
  display: block;
  width: 150px;
  max-width: 60%;
  height: auto;
  margin-bottom: 2px;
}

.offer-body {
  margin: 0;
}

/* The terms. Same hand as the letter around them – a sponsor does not switch to a sans-serif to
   quote his own offer – but tightened, because this is the part the reader is deciding on. */
.offer-terms {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.offer-terms li {
  line-height: 1.25;
}

.offer-sign-off {
  margin: 6px 0 0;
  align-self: flex-end;
  font-size: 19px;
}

.offer-foot {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* The window, and it is deliberately quiet: the spec asks for the weeks left "quietly", under the
   letter rather than shouted on it. */
.offer-window {
  margin: 0;
  font-size: 12.5px;
  color: var(--muted);
  text-align: center;
}

.offer-window.settled {
  font-style: italic;
}

.offer-actions {
  display: flex;
  gap: 8px;
}

.offer-actions button {
  flex: 1;
}
</style>
