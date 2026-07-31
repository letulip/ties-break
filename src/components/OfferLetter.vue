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
import type { KitOfferTerms, Offer } from '../shared/protocol'
import PaperNote from './ui/PaperNote.vue'

const props = defineProps<{ offer: Offer; week: number }>()
const emit = defineEmits<{ sign: [string]; refuse: [string] }>()

/** Vite's base path, so the letterhead resolves under a sub-path deploy the same way the art does. */
const base = import.meta.env.BASE_URL

const terms = computed(() => props.offer.terms as KitOfferTerms)
/** THE LETTERHEAD, BY TIER. `public/images/sponsors/<tier>.webp` - never a filename written out at a
 *  call site, so the day the national and global rungs exist they need no change here. */
const markUrl = computed(() => `${base}images/sponsors/${terms.value.tier}.webp`)

const live = computed(() => props.offer.state === 'open' && props.week <= props.offer.deadlineWeek)
/** How long is left, in whole weeks, counting the current one. The quiet half of the owner's ask:
 *  «давать человеку какое-то время на подумать». */
const weeksLeft = computed(() => Math.max(0, props.offer.deadlineWeek - props.week + 1))
const dollars = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`

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
      if (o.eventsPlayed === undefined) return `Signed – running until the end of the season.`
      const asked = t.minEventsPerSeason
      return o.eventsPlayed >= asked
        ? `Signed. She played ${o.eventsPlayed} of the ${asked} events they asked for, and the deal ran its season.`
        : `Signed. She played ${o.eventsPlayed} of the ${asked} events they asked for, so it was not renewed. Nothing was paid back.`
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
  <article class="offer-letter">
    <!-- tilt is 0 and STAYS 0 – see the block comment at the top of this file. -->
    <PaperNote class="offer-paper" size="letter" :tilt="0">
      <img class="offer-mark" :src="markUrl" :alt="terms.brand" />
      <p class="offer-body">
        We have been watching your daughter play all season, and we would like to put her in our kit.
      </p>
      <!-- THE DEAL, IN THE WORDS THE BUTTON COMMITS TO. Generated from the terms themselves; the
           last line is the FAILURE MODE, and the script header above says why it has to be here. -->
      <ul class="offer-terms">
        <li>Racquets, strings and shoes – up to {{ dollars(terms.kitAllowanceCents) }} of kit over the season, on us.</li>
        <li>We keep it fresh. She will not play a match on a dead string bed.</li>
        <li>In return she enters at least {{ terms.minEventsPerSeason }} tournaments this season – we are paying to be seen.</li>
        <li>
          One season. Play them and we will write again next year; fall short and we shake hands at
          the end of it and part friends. Either way the kit is hers and there is nothing to pay back.
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
