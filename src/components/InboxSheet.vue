<script setup lang="ts">
// THE INBOX - docs/specs/offers-and-the-inbox.md §2. What is behind the second tool on Home, beside
// the bell: the letters somebody has written to this family, newest first.
//
// The same overlay family as RankHelpDialog and TierGuide - `.dialog-overlay` + the panel shell that
// `.guide-card` already is - because this is a popup over the diary page rather than a screen, and
// the owner asked for exactly that: «попапчик получить с письмом-предложением».
//
// ⚠ AND SINCE R14-2 IT IS A MAIL CLIENT RATHER THAN A STACK OF OPEN PAPER. The owner's words: a
// list, unread in bold, click to open, a bin per row once read, yes/no on delete. Every letter used
// to render in full, one under another, so a career with forty of them handed the player forty
// sheets of paper and no way to see what was in the pile - the one that needed an answer was
// somewhere in the middle of it, and the one he had already dealt with never went away.
//
// So there are two views in one sheet now: the LIST, and one letter OPEN. The letter itself is
// unchanged - `OfferLetter` renders it exactly as it always did, sign and refuse included - because
// the paper was never the problem.
//
// ⚠ "UNREAD" AND "DELETED" ARE THIS DEVICE'S FACTS, NOT THE WORLD'S, and both live in
// `composables/inboxMail.ts` with the argument written out there. In short: the protocol states the
// engine cannot know what the player has looked at, so unread is a client-side concept; and DELETE
// MEANS DISMISS FROM THE LIST, never destroy - a letter that lapsed still explains what happened,
// and a signed one is the only surface stating the contract she is under.
//
// ⚠ SIGNING GOES THROUGH `ConfirmDialog`, AND IT IS THE ONE IRREVERSIBLE THING IN HERE. Every
// destructive action in More is behind that gate; a contract the parent cannot take back deserves
// the same one. Refusing is terminal too, and is deliberately NOT gated: a refusal costs nothing that
// was ever his, and a confirm on both buttons would read as the game asking him to be sure about
// having an opinion. What is on the confirm is the deal itself, so the last thing he reads before
// committing is the same sentence the letter made.
//
// Removing a letter from the list gets its own confirm because the owner asked for one, and because
// a control that empties a row on a single press is one mis-tap from a pile the player cannot get
// back - even though nothing behind it is destroyed.
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { formatCents } from '../shared/money'
import type { AcademyLetterTerms, EntryLetterTerms, KitOfferTerms, Offer, TourLetterTerms } from '../shared/protocol'
import { SPONSOR_TIERS, dealUntilWeek } from '../engine/offers'
import { weekLabel } from '../shared/dates'
import { letterDeletable, useInboxMail } from '../composables/inboxMail'
import OfferLetter from './OfferLetter.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import IconButton from './ui/IconButton.vue'
// Round-16 #1: the inbox is a screen that covers the tabs, not a popup over the diary page.
import TakeoverShell from './ui/TakeoverShell.vue'
import { playSfx } from '../audio/sfx'

defineEmits<{ close: [] }>()

const game = useGameStore()
const mail = useInboxMail()
const week = computed(() => game.snapshot?.week ?? 0)
/** Newest first: the letter that needs answering is the one that just arrived.
 *
 *  ⚠ AND WITHIN ONE WEEK, THE BIGGEST NAME AT THE TOP OF THE PILE (06.08, fix/sponsor-catchup). A
 *  career that reaches the sponsor window late is handed the whole queue in ONE post - see
 *  `raiseKitOffers` - so several kit letters can share an arrival week, and a plain reverse would
 *  order them by which happened to be pushed last, i.e. weakest rung first. That is the same trap the
 *  ladder's strongest-first order exists to close: a parent who opens the inbox and signs the letter
 *  on top must never be signing the worst one on the table. `SPONSOR_TIERS` is weakest-first (it is
 *  the ladder itself), so a higher index is a bigger brand. Everything that is not a kit letter, and
 *  every letter from a different week, keeps exactly the order it had. */
const RUNG_RANK = new Map<string, number>(SPONSOR_TIERS.map((t, i) => [t, i]))
const rungOf = (o: Offer): number =>
  o.kind === 'kit' ? (RUNG_RANK.get((o.terms as KitOfferTerms).tier) ?? -1) : -1
const letters = computed(() =>
  [...(game.snapshot?.offers ?? [])]
    .map((o, i) => ({ o, i }))
    .sort((a, b) => b.o.week - a.o.week || rungOf(b.o) - rungOf(a.o) || b.i - a.i)
    .map((x) => x.o),
)
const live = (o: Offer): boolean => o.state === 'open' && week.value <= o.deadlineWeek
const open = computed(() => letters.value.filter(live))

// --- the list ------------------------------------------------------------------------------
/** WHO WROTE. The letterhead in one line: a brand signs with its own name, and the two desks that
 *  have no brand say which desk they are - the same distinction `OfferLetter` draws when it decides
 *  whether to print a mark at all. */
function senderOf(o: Offer): string {
  if (o.kind === 'entry') return 'Tournament desk'
  if (o.kind === 'tour') return 'Tour office'
  // ⭐ ROUND 24 #1 – and the academy signs like the two desks do, with what it IS rather than with a
  // name. It has no brand and it never gets one: `engine/academy.ts` models the scholarship as a
  // continuous level and a need factor, not as a named institution on a ladder, so inventing a
  // letterhead here would be inventing a fact the engine does not hold. (It is also the one place
  // this letter does not fit the kit shape – no `tier`, no mark, no `SPONSOR_TIERS` rung.)
  if (o.kind === 'academy') return 'The academy'
  return (o.terms as KitOfferTerms).brand
}

/** WHAT IT IS ABOUT, in the words the paper itself uses. Every arm here has a matching arm in
 *  `OfferLetter`'s template, and that is the rule: a subject line that promised something the sheet
 *  does not say would be worse than no subject line, because it is what the player decides to open
 *  on. Nothing is invented - each one restates its own letter's first sentence. */
function subjectOf(o: Offer): string {
  if (o.kind === 'entry') {
    const t = o.terms as EntryLetterTerms
    if (!t.cancelled) return `Entry confirmed – ${t.label}`
    // The desk acting and the parent acting are two different letters (fix/outgrown-entry): a
    // release the parent never asked for must not be titled as his own withdrawal.
    return (t.releasedBy ?? 'parent') !== 'parent' ? `Withdrawn by the desk – ${t.label}` : `Withdrawal confirmed – ${t.label}`
  }
  if (o.kind === 'tour') {
    const t = o.terms as TourLetterTerms
    if (t.notice === 'due') return `Required event – ${t.label ?? 'the tour'}`
    if (t.notice === 'penalty') return 'Penalty points recorded'
    return 'Entries suspended'
  }
  // ⭐ ROUND 24 #1 – the scholarship's three subjects. Each one restates its own sheet's first
  // sentence, which is this function's rule; the share is on the line because the share is the whole
  // content of two of the three, and it is the number the owner went looking for and could not find.
  if (o.kind === 'academy') {
    const t = o.terms as AcademyLetterTerms
    if (t.notice === 'arrived') return `A scholarship – ${t.sharePct}% of her travel`
    if (t.notice === 'ended') return 'The scholarship has ended'
    return `Scholarship review – ${t.sharePct}% of her travel`
  }
  const t = o.terms as KitOfferTerms
  if (t.ended) return 'The kit deal has ended'
  return t.renewal ? 'Another year in our kit' : 'A kit deal for your daughter'
}

/** The quiet second line: when it arrived, and whether it is still waiting on him. The weeks-left
 *  count is the same one the paper prints under itself. */
function metaOf(o: Offer): string {
  const filed = weekLabel(o.week)
  if (!live(o)) return filed
  const weeksLeft = Math.max(0, o.deadlineWeek - week.value + 1)
  return `${filed} · ${weeksLeft} ${weeksLeft === 1 ? 'week' : 'weeks'} to decide`
}

interface Row {
  offer: Offer
  from: string
  subject: string
  meta: string
  unread: boolean
  /** the bin shows once the letter has been READ and is no longer live – see `letterDeletable` */
  removable: boolean
  /** still waiting on an answer: the row wears the accent, the way the inbox dot does */
  waiting: boolean
}
const rows = computed<Row[]>(() =>
  letters.value
    .filter((o) => !mail.isBinned(o.id))
    .map((o) => ({
      offer: o,
      from: senderOf(o),
      subject: subjectOf(o),
      meta: metaOf(o),
      unread: !mail.isRead(o.id),
      removable: mail.isRead(o.id) && letterDeletable(o, week.value),
      waiting: live(o),
    })),
)

/** Which letter is being read, or null for the list. The sheet is its own little two-screen stack:
 *  there is no route to push and nothing to remember once it closes. */
const openId = ref<string | null>(null)
const openLetter = computed(() => rows.value.find((r) => r.offer.id === openId.value)?.offer ?? null)

function openRow(id: string): void {
  playSfx('clickSoft')
  // OPENING IS THE READING, exactly as tapping the bell is the looking (composables/inboxCue.ts).
  // Nothing else in the app can mark a letter read, because nothing else shows it.
  mail.markRead(id)
  openId.value = id
}
function backToList(): void {
  playSfx('clickSoft')
  openId.value = null
}

// --- taking a letter off the list ------------------------------------------------------------
const pendingBin = ref<Offer | null>(null)
const binMessage = computed(() =>
  pendingBin.value
    ? `Take this letter from ${senderOf(pendingBin.value)} off your list? Nothing that happened is undone – it stays in her history, it just stops showing here.`
    : '',
)
function askBin(o: Offer): void {
  playSfx('clickSoft')
  pendingBin.value = o
}
function doBin(): void {
  const o = pendingBin.value
  pendingBin.value = null
  if (!o) return
  mail.bin(o.id)
  if (openId.value === o.id) openId.value = null
}

// --- signing ---------------------------------------------------------------------------------
const pendingSign = ref<Offer | null>(null)
/** WHAT SIGNING COVERS, in the same words the paper used. `frame` is a racquet to a reader and a
 *  frame to the equipment model; the letter already made that translation and the confirm must not
 *  make a different one. */
const LINE_WORDS: Record<string, string> = { strings: 'strings', frame: 'racquets', shoes: 'shoes' }
const confirmMessage = computed(() => {
  if (!pendingSign.value) return ''
  const t = pendingSign.value.terms as KitOfferTerms
  const value = formatCents(t.kitAllowanceCents)
  const words = t.covers.map((l) => LINE_WORDS[l] ?? l)
  const covered = words.length === 1 ? words[0] : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`
  const seasons = (t.seasons ?? 1) === 1 ? 'a season' : `${t.seasons} seasons`
  // ⚠ ...AND THE WEEK IT RUNS TO (09.08, the owner: «Непонятно на какое количество лет спонсор
  // контракт заключает, нигде не видно этой информации»). "Three seasons" is a length; the last
  // thing a parent reads before an irreversible signature should also say WHEN, and `dealUntilWeek`
  // is the engine function `signOffer` is about to write onto the offer - so the confirm quotes the
  // week the contract will actually carry rather than a number this sheet worked out.
  const until = weekLabel(dealUntilWeek(pendingSign.value))
  // The deal, restated, and the one thing the letter cannot say for itself: that this cannot be
  // undone. No editorialising beyond that – the game does not tell him whether it is a good idea,
  // and in particular it does not mention that signing turns other brands away. That is a term, it
  // is on the paper, and a confirm that argued the case would be counselling rather than confirming.
  return `Sign with ${t.brand}? They cover her ${covered} for ${seasons} – up to ${value}, to ${until} – and she must enter at least ${t.minEventsPerSeason} tournaments a season. This cannot be undone.`
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
  <!-- ⚠ FULL SCREEN SINCE ROUND-16 #1 (the owner). It was a `.dialog-overlay` + `.guide-card` - a
       popup over the diary page - and a mail client is not a popup: on a 375px phone the card's own
       inset plus the overlay's left the list about 280px to hold a sender, a subject, a date and a
       bin, and a career with a season of letters in it scrolled inside a box inside a page.
       `TakeoverShell` is the app's one answer to "a screen that covers the tabs" and four surfaces
       already render through it, so this is a re-home rather than a new layout: same list, same
       letter, same controls.
       ⚠ AND THE BACKDROP TAP IS GONE WITH THE BACKDROP. There is no longer anything behind this to
       tap, so the close control in the header is the way out - which is what every other takeover in
       the app already does. `@click.self` had been the second exit; the note below about the confirm
       being a SIBLING is unchanged and is the reason it still is one.
       ⚠ `:screen` IS THE SHELL'S SCROLL RESET, and this surface is exactly the case the prop exists
       for: the list and an open letter are two screens in one scroller, so without it a letter opened
       from the bottom of a long list arrived already scrolled past its own first line. -->
  <TakeoverShell title="Inbox" :screen="openLetter?.id ?? 'list'">
    <template #exit>
      <IconButton icon="close" label="Close" title="Close" @click="$emit('close')" />
    </template>

    <!-- ⚠ ONE WRAPPER, because `.tf-body` is a flex column with a 16px gap and this surface is a
         single object (a list, or one letter) rather than a stack of cards. Without it every
         paragraph and the list itself became a gap-separated band. -->
    <div class="inbox-body">
      <!-- ══ ONE LETTER, OPEN ══ -->
      <!-- The paper is untouched: this is the same `OfferLetter` the sheet used to stack, with the
           same two controls under it. All that is new is that it is the only one on screen. -->
      <template v-if="openLetter">
        <!-- The app has ONE back control and this is it (IconButton, bare) – see its own header for
             why the hand-written arrow character was retired everywhere. -->
        <IconButton class="inbox-back" icon="back" label="Back to all letters" variant="bare" @click="backToList" />
        <OfferLetter class="inbox-letter" :offer="openLetter" :week="week" @sign="askSign" @refuse="doRefuse" />
      </template>

      <!-- ══ THE LIST ══ -->
      <template v-else>
        <p v-if="letters.length === 0" class="hint">
          Nothing yet. Sponsors write to players they have been watching for a season.
        </p>
        <p v-else-if="rows.length === 0" class="hint">
          Your inbox is clear. Everything you took off the list is still in her history.
        </p>
        <p v-else-if="open.length === 0" class="hint">Nothing waiting on an answer.</p>

        <ul v-if="rows.length" class="inbox-list">
          <li v-for="row in rows" :key="row.offer.id" class="inbox-row" :class="{ unread: row.unread }">
            <!-- THE ROW IS A BUTTON AND THE BIN IS A SECOND ONE, side by side rather than nested:
                 a button inside a button is not a thing, and a row that swallowed the bin's click
                 would open the letter it was asked to remove. -->
            <button class="inbox-open" type="button" @click="openRow(row.offer.id)">
              <span class="inbox-line">
                <span class="inbox-from">{{ row.from }}</span>
                <span v-if="row.waiting" class="pill ok inbox-waiting">Needs an answer</span>
              </span>
              <span class="inbox-subject">{{ row.subject }}</span>
              <span class="hint inbox-meta">{{ row.meta }}</span>
            </button>
            <!-- THE BIN GLYPH, AND THE GAP IS CLOSED (10.08). This shipped as the WORD `Delete`
                 while `public/icons/` had no bin - a flagged art gap, never a design choice - and
                 the note here said the swap would be one element the day the master landed. The
                 owner drew it, so this is that one element.
                 ⚠ THE NAME DID NOT CHANGE WITH THE PICTURE. A glyph is `aria-hidden` inside
                 IconButton, so the label IS the control's whole accessible name, and it still names
                 the letter rather than the verb - two rows both called "Delete" would be the D11
                 defect one screen over. It no longer needs to contain a visible word because there
                 is no longer a visible word to contain (WCAG 2.5.3 binds a name to visible TEXT). -->
            <IconButton
              v-if="row.removable"
              class="inbox-bin"
              icon="bin"
              variant="bare"
              :icon-size="16"
              :label="`Delete the letter: ${row.from} – ${row.subject}`"
              @click="askBin(row.offer)"
            />
          </li>
        </ul>
      </template>
    </div>
  </TakeoverShell>

  <!-- ⚠ `Sign it` AND NOT `Sign`, AND THE EXTRA WORD IS THE WHOLE FIX (D13, docs/specs/e2e-coverage.md
       §12 – the highest-priority item in that register). `OfferLetter` draws a `Sign` button and this
       confirm drew a second one, both on screen at once, so the app's ONE irreversible press was a
       strict-mode collision: `getByRole('button', { name: 'Sign' })` resolved to two elements, and
       `ConfirmDialog` is also one of D1's roleless overlays, so it could not be scoped by dialog
       either. The register's own words: "a confirm-label that extends rather than repeats the verb
       costs nothing", which is what the other three callers already do (`Delete`, `Withdraw`, `Push
       through`). The visible word is still the first word of the name, so WCAG 2.5.3 holds. -->
  <ConfirmDialog
    v-if="pendingSign"
    :message="confirmMessage"
    confirm-label="Sign it"
    @confirm="doSign"
    @cancel="pendingSign = null"
  />

  <ConfirmDialog
    v-if="pendingBin"
    :message="binMessage"
    confirm-label="Delete"
    cancel-label="Keep it"
    danger
    @confirm="doBin"
    @cancel="pendingBin = null"
  />
</template>

<style scoped>
/* THE ONE CHILD OF `.tf-body` (round-16 #1). The shell's body is a flex column with a 16px gap, which
   is right for a stack of cards and wrong for a mail client - so this surface hands it a single block
   and keeps its own vertical rhythm inside, exactly as it did inside `.guide-card`. */
.inbox-body {
  min-width: 0;
}

/* Letters are separated by air rather than by a rule: they are separate sheets of paper, and a
   divider between two pieces of paper is a line that belongs to neither. The top margin applies to
   every letter, including the first, so the stack clears the title (or the empty-state hint) above
   it without the card needing a rule of its own. */
.inbox-letter {
  margin-top: 18px;
}

/* Back out of one letter, into the list. `.guide-card` is a plain block, so this is pulled left by
   a negative margin that cancels the 32px control's own box rather than by an alignment property
   the parent has no flow to honour. */
.inbox-back {
  margin: 8px 0 0 -6px;
}

/* THE LIST. Rows separated by a hairline, which is right here and wrong for the letters above: a
   mail list is one object with rows in it, not a stack of separate objects. */
.inbox-list {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.inbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  border-top: 1px solid var(--line);
}

.inbox-row:last-child {
  border-bottom: 1px solid var(--line);
}

.inbox-open {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 0;
  border: none;
  background: none;
  color: var(--text);
  text-align: left;
  cursor: pointer;
}

.inbox-line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.inbox-from {
  font-size: 13px;
  color: var(--muted);
}

.inbox-subject {
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inbox-meta {
  margin: 0;
  font-size: 12px;
}

/* UNREAD IS BOLD, and it is bold on the two lines that say what the letter IS – the sender and the
   subject. The date line stays quiet in both states: a bold timestamp is noise, and the owner asked
   for the unread letter to stand out, not for the row to shout. */
.inbox-row.unread .inbox-from,
.inbox-row.unread .inbox-subject {
  font-weight: 700;
  color: var(--text);
}

.inbox-waiting {
  flex: none;
}

/* The bin, as a word until there is a glyph for it (see the template). Quiet by default so a list of
   read letters is not a column of shouting controls, and it takes the app's own danger ink on hover
   rather than a colour of its own. */
.inbox-bin {
  flex: none;
  padding: 4px 8px;
  border: 1px solid transparent;
  background: none;
  color: var(--muted);
  font-size: 12px;
  cursor: pointer;
}

.inbox-bin:hover {
  border-color: var(--danger);
  color: var(--danger);
}
</style>
