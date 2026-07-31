<script setup lang="ts">
// THE INBOX - docs/specs/offers-and-the-inbox.md §2. What is behind the second tool on Home, beside
// the bell: the letters somebody has written to this family, newest first.
//
// The same overlay family as RankHelpDialog and TierGuide - `.dialog-overlay` + the panel shell that
// `.guide-card` already is - because this is a popup over the diary page rather than a screen, and
// the owner asked for exactly that: «попапчик получить с письмом-предложением».
//
// ⚠ SIGNING GOES THROUGH `ConfirmDialog`, AND IT IS THE ONE IRREVERSIBLE THING IN HERE. Every
// destructive action in More is behind that gate; a contract the parent cannot take back deserves
// the same one. Refusing is terminal too, and is deliberately NOT gated: a refusal costs nothing that
// was ever his, and a confirm on both buttons would read as the game asking him to be sure about
// having an opinion. What is on the confirm is the deal itself, so the last thing he reads before
// committing is the same sentence the letter made.
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'
import type { KitOfferTerms, Offer } from '../shared/protocol'
import OfferLetter from './OfferLetter.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import IconButton from './ui/IconButton.vue'
import { playSfx } from '../audio/sfx'

defineEmits<{ close: [] }>()

const game = useGameStore()
const week = computed(() => game.snapshot?.week ?? 0)
/** Newest first: the letter that needs answering is the one that just arrived. */
const letters = computed(() => [...(game.snapshot?.offers ?? [])].reverse())
const open = computed(() => letters.value.filter((o) => o.state === 'open' && week.value <= o.deadlineWeek))

const pendingSign = ref<Offer | null>(null)
/** WHAT SIGNING COVERS, in the same words the paper used. `frame` is a racquet to a reader and a
 *  frame to the equipment model; the letter already made that translation and the confirm must not
 *  make a different one. */
const LINE_WORDS: Record<string, string> = { strings: 'strings', frame: 'racquets', shoes: 'shoes' }
const confirmMessage = computed(() => {
  if (!pendingSign.value) return ''
  const t = pendingSign.value.terms as KitOfferTerms
  const value = `$${Math.round(t.kitAllowanceCents / 100).toLocaleString('en-US')}`
  const words = t.covers.map((l) => LINE_WORDS[l] ?? l)
  const covered = words.length === 1 ? words[0] : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`
  const seasons = (t.seasons ?? 1) === 1 ? 'a season' : `${t.seasons} seasons`
  // The deal, restated, and the one thing the letter cannot say for itself: that this cannot be
  // undone. No editorialising beyond that – the game does not tell him whether it is a good idea,
  // and in particular it does not mention that signing turns other brands away. That is a term, it
  // is on the paper, and a confirm that argued the case would be counselling rather than confirming.
  return `Sign with ${t.brand}? They cover her ${covered} for ${seasons} – up to ${value} – and she must enter at least ${t.minEventsPerSeason} tournaments a season. This cannot be undone.`
})

function askSign(id: string): void {
  playSfx('clickSoft')
  pendingSign.value = letters.value.find((o) => o.id === id) ?? null
}

async function doSign(): Promise<void> {
  const offer = pendingSign.value
  pendingSign.value = null
  if (offer) await game.signOffer(offer.id)
}

async function doRefuse(id: string): Promise<void> {
  playSfx('clickSoft')
  await game.refuseOffer(id)
}
</script>

<template>
  <!-- ⚠ THE CONFIRM IS A SIBLING OF THIS OVERLAY, NOT A CHILD OF IT, and that is structural rather
       than tidy. This overlay dismisses on `@click.self`, so a confirm nested inside it would sit in
       a box whose backdrop is listening for clicks - and every click that misses the confirm's own
       card would then be one `.self` check away from tearing down the sheet underneath the decision
       it is asking about. Two roots keep the two layers independent, which is how MoreScreen mounts
       its own confirm. -->
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="guide-card">
      <IconButton class="replay-close" icon="close" label="Close" title="Close" @click="$emit('close')" />
      <p class="guide-title">Inbox</p>
      <p v-if="letters.length === 0" class="hint">
        Nothing yet. Sponsors write to players they have been watching for a season.
      </p>
      <p v-else-if="open.length === 0" class="hint">Nothing waiting on an answer.</p>
      <OfferLetter
        v-for="o in letters"
        :key="o.id"
        class="inbox-letter"
        :offer="o"
        :week="week"
        @sign="askSign"
        @refuse="doRefuse"
      />
    </div>
  </div>

  <ConfirmDialog
    v-if="pendingSign"
    :message="confirmMessage"
    confirm-label="Sign"
    @confirm="doSign"
    @cancel="pendingSign = null"
  />
</template>

<style scoped>
/* Letters are separated by air rather than by a rule: they are separate sheets of paper, and a
   divider between two pieces of paper is a line that belongs to neither. The top margin applies to
   every letter, including the first, so the stack clears the title (or the empty-state hint) above
   it without the card needing a rule of its own. */
.inbox-letter {
  margin-top: 18px;
}
</style>
