<script setup lang="ts">
// THE FORK – the most expensive click in the game (adult-tour-and-endings.md's own closing risk
// note), and the second act beginning.
//
// ⭐⭐⭐ ROUND 24 #5 – IT IS ASKED WHEN SCHOOL ENDS NOW, NOT ON HER NINETEENTH BIRTHDAY («пункт 5
// запускай как обсудили»). She is 18.0–18.9 on this card, her last junior season is still ahead,
// and the college answer RESERVES a place she takes up on the next academic year's September
// (`snapshot.collegeDepartsWeek`) – she keeps playing until then. 'Stop' and 'turn professional'
// are still immediate. The copy below may not assert the birthday-era facts («she is nineteen»,
// «the ladder is closed») because both are now false on the week the card draws.
//
// Three answers; ONE ends the career today and one books the end of the junior years. That is why
// it BLOCKS rather than toasts: the engine refuses to tick until it is answered, exactly the
// contract an undecided knock has, and there is deliberately no way out of this card that is not a
// choice.
//
// ⚠ IT MAY NOT RECOMMEND. Ruling 4, 30.07: «"stop" CAN be the right answer at 19... a real ending
// without shame». A game about honest economics whose fork quietly styles one button as the correct
// one lies exactly where it promised not to. So the three answers get the same weight, the card
// puts the numbers on the table and says nothing about what they mean, and there is no default.
//
// ⭐⭐ ROUND-21 #8 IS RETIRED BY A LATER RULING OF THE OWNER'S OWN, AND THAT IS RECORDED RATHER
// THAN DROPPED. After a full career he asked why the card had only two answers, and #8 built a
// sentence explaining which rung had taken the third. On 16.08 he removed the rule that could take
// it: college is an independent branch of the career, alternative to the tour, and no result closes
// it. **There is no shut door left to explain**, so the sentence is gone and the third answer is
// unconditional. docs/specs/college-is-its-own-branch-2026-08.md §4 states the retirement.
//
// ⚠ THE MEASUREMENT THAT #8 RESTED ON IS KEPT, because it is the evidence the complaint was real
// rather than a misread screen: `tools/econ-bench.ts`'s `player` policy over 9 presets x 3 seeds had
// **26 of 26 careers reach the fork with the college answer already spent**, and the flag carried
// that faithfully to this card every time - the engine was closing it, not the dialog. Under the
// `grinder` policy (which enters nothing on the paid rungs) it was open 13 of 13. That is why the
// third answer now needs no flag at all: the state it guarded against was the normal one.
//
// ⚠ AND ABSENT-OVER-DISABLED, the round-17 note's own choice, is now moot rather than overruled.
// There is no case in which this card draws two answers.
import { computed, ref, useTemplateRef } from 'vue'
import { useGameStore } from '../stores/game'
import { useDialogFocus } from '../composables/dialogFocus'
import { TIERS, TIER_SHORT, WEEKS_PER_YEAR } from '../engine/season/calendar'
import {
  COLLEGE_SHUT_DETAIL,
  COLLEGE_TIER_NAME,
  COLLEGE_TIER_ODDS,
  canAfford,
  coveredShareOf,
  fundingBandOf,
  quoteShutFor,
  type CollegeFundingBand,
  type CollegeShutReason,
} from '../engine/collegeOffer'
import { ENDINGS } from '../engine/ending'
import { COUNTRY_NAMES } from '../composables/countries'
import { portraitStage } from '../shared/avatarEmotion'
import { portraitUrl } from '../art/preload'
import { facePoint } from '../art/faceRects'
import { formatCents } from '../shared/money'
import { weekLabel } from '../shared/dates'
import { activeLadderOfSnapshot, type CollegeTier, type ForkAnswer } from '../shared/protocol'

const game = useGameStore()
const fork = computed(() => game.snapshot?.fork ?? null)
const snap = computed(() => game.snapshot ?? null)

// ⭐ ROUND-17 #6/#16 – A RANK PRINTED WITHOUT ITS TABLE IS NOT A FACT, and this card was the worst
// place in the game to make that mistake.
//
// It read `snap.kidRank`, which is an ALIAS of the INTERNATIONAL (junior) table - and this card is
// the one that opens with "The junior ladder is behind her." So the most expensive click in the game
// was being decided on a number from the table that had just closed, under a label that named no
// table at all. `activeLadderOfSnapshot` is the repo's own answer to "which rank is her rank" and it
// exists, in its own words, "BECAUSE `snapshot.kidRank` IS THE WRONG ANSWER TO AN OBVIOUS QUESTION";
// this card had simply never been converted.
//
// ⚠ AND `unranked` WAS UNREACHABLE, which is the second half of the same defect. `kidRank` is never
// null - `recomputeKidRank` falls back to `tableSize(...)`, the tie floor - so the ternary always
// took its first branch and a girl with no counting result printed her floor position as if it were
// a standing. `LadderView.rank` IS nullable and means it, so the honest branch is live again.
// `label` comes off the helper itself, so this card cannot invent a name for a table.
const ladder = computed(() => activeLadderOfSnapshot(snap.value))
const rankHead = computed(() => `Her ${ladder.value.label.toLowerCase()} rank`)
const rankValue = computed(() => (ladder.value.rank === null ? 'unranked' : `#${ladder.value.rank}`))

// ⚠ #8's RUNG LOOKUP WENT WITH #8's SENTENCE (16.08). It read `TIER_SHORT[ENDINGS.collegeClosedFromTier]`
// and existed so no rung name was ever typed into this file – a rule this component still keeps, and
// `tests/component/endings-ui.test.ts` still pins. The figure below is the only rung name left here
// and it comes off `TIERS` the same way.
//
// ⭐⭐ P4 – THE RESULT ARM, AND IT IS A FACT ON THE TABLE RATHER THAN A GATE.
//
// The owner's original intent for the fork was a fork FOR THE GIRLS WHOSE RESULTS ARE NOT VERY GOOD
// (14.08 – his own words are quoted in `docs/specs/college-gate-decoupled-2026-08.md`, which is the
// place for them; this file is English-only). The research found exactly one line that separates the
// populations: #200, the rank at which our own ladder says the main tour starts admitting her.
// Measured over 90 careers
// (research §5c): it excludes the strongest third almost perfectly (1 of 30), keeps the door for
// half of the weakest third, and is the only candidate in the whole sweep that beats a coin flip -
// 47 points of separation.
//
// ⚠ AND IT IS NOT A NEW CONSTANT. `TIERS[TOUR_RUNG].acceptsRank` is already 200 and already means
// this; a fitted number would have been a number this card invented about her chances.
//
// ⚠⚠ IT DOES NOT GATE ANYTHING, AND THAT IS THE 15.08 RULING, NOW DOUBLY TRUE. The owner cancelled
// the money arm outright - there is nothing for us to do here, in his words - and on 16.08 he removed
// the result arm as well, so the third answer is drawn unconditionally and this number gates nothing
// whatever. What it does is let the player see where she stands against the tour she would be turning
// professional into - which is the same job the four figures beside it already do.
//
// ⚠ SO IT MAY NOT BE A SENTENCE. Ruling 4 (30.07): the card «may not recommend». A line reading
// "the tour would not take her" is one comparison away from advice about which answer to pick, and
// this card is not allowed to have that opinion. It is a NUMBER IN THE SAME LIST as her funds and
// her rank, said in the card's own idiom, and the player does the comparing.
const TOUR_RUNG = 'wta250' as const
const tourAdmits = computed(() => TIERS[TOUR_RUNG].acceptsRank ?? null)
const tourHead = computed(() => `${TIER_SHORT[TOUR_RUNG]} admits down to`)

// ⭐⭐ WHAT THE THIRD ANSWER COSTS – v51, docs/specs/what-the-college-place-costs-2026-08.md.
//
// The button used to promise "four years on a college scholarship" and the engine then charged
// nothing, so the card was making a claim about money that the simulation did not honour. It says
// what is on the table now.
//
// ⭐⭐⭐ AND ON 17.08 IT STOPPED BEING ONE OFFER AND BECAME A CHOICE
// (docs/specs/the-college-choice-2026-08.md). The owner read the card and could not find where
// **$8,673 a year** came from under a sourced **$30,990** sticker – because $8,673 is the family's
// RESIDUAL after the award and no line on this card said so. It now shows the arithmetic as three
// places she could take: THE PRICE, WHAT THE AWARD COVERS, THE WEEKLY PAYMENT, AND WHETHER THE
// FAMILY CAN PAY IT. Nothing on this card compares any of it to the tour – his own instruction, and
// it is quoted verbatim in `docs/specs/the-college-choice-2026-08.md` rather than here, because a
// `.vue` file carries no Cyrillic at all, comments included (CLAUDE.md style).
//
// ⚠⚠ IT STILL MAY NOT RECOMMEND (ruling 4, 30.07), AND THE CHOICE IS WHERE THAT GOT HARDER:
//   * **no place is preselected.** A pressed row on arrival is a recommendation drawn in
//     preselection, so the rows arrive unpressed;
//   * **no answer is disabled, ever.** The college button is live from the first frame – the owner's
//     ruling of 16.08 is that nothing removes the college answer, and a control the player has to
//     unlock is not "nothing";
//   * **so the button says which place it will take.** Pressed with no row chosen it takes the
//     CHEAPEST place open to her, which is the least of the family's money and the only default that
//     cannot be read as advice – and the line under the button names it, because a button whose
//     effect is invisible is worse than one with a stated default.
//
// ⚠ `offer === null` IS A MIGRATED CAREER (v50 and earlier, fork already open) and it falls back to
// the pre-v51 line. Never "refused" – see the v51 migration.
const offer = computed(() => fork.value?.offer ?? null)

// ⚠ THE NAMES ARE PLACES, NOT VERDICTS, and since round 21 there is exactly one copy of them –
// `COLLEGE_TIER_NAME` in engine/collegeOffer.ts, imported here and by `EndingScreen.vue`. The three
// prices are sourced and the quality over them is measured (see `row.odds`), so nothing is smuggled
// into the noun.
const TIER_LABEL = COLLEGE_TIER_NAME
const BAND_LABEL: Record<CollegeFundingBand, string> = {
  full: 'A full ride',
  most: 'Most of the bill',
  half: 'About half the bill',
  part: 'Part of the bill',
  none: 'Nothing at all',
}
const pct = (share: number): string => `${Math.round(share * 100)}%`

/** ⭐⭐⭐ ROUND 26 #2 – WHERE THE GAME THINKS THE FAMILY IS FROM, IN WORDS, for the ONE sentence that
 *  rests on it (see `rows`). The code is the profile's; the name is `COUNTRY_NAMES`, which is the
 *  app's single copy of it and falls back to the bare code for anything onboarding cannot offer.
 *
 *  ⚠⚠ IT DECIDES NOTHING. Reading her country to NAME a refusal is not re-deriving it: the verdict
 *  is still `quoteShutFor`'s, off the engine's own persisted `quote.open`, and this value never
 *  reaches that call. The round-24 note below is about a second JUDGEMENT, and a noun is not one. */
const homeName = computed(() => {
  const code = snap.value?.profile?.country ?? ''
  return COUNTRY_NAMES[code] ?? code
})

// ⭐ THE PLAYER'S PICK. Null until she presses a row – see the ruling note above.
const picked = ref<CollegeTier | null>(null)
const quotes = computed(() => offer.value?.quotes ?? [])
/** ⚠ THE PLACE THE BUTTON WILL ACTUALLY TAKE – her pick, or the cheapest place open to her. The same
 *  fallback `answerFork` applies engine-side, so the card cannot promise a place the engine would not
 *  give (CLAUDE.md invariant 1: the engine re-validates, the screen does not decide).
 *  ⚠ IT READS `rows`, NOT `quotes`, so this card holds exactly ONE notion of "open" – see `rows`. */
const effective = computed<CollegeTier | null>(
  () => picked.value ?? rows.value.find((r) => r.open)?.tier ?? null,
)
const effectiveQuote = computed(() => quotes.value.find((q) => q.tier === effective.value) ?? null)

interface TierRow {
  tier: CollegeTier
  open: boolean
  name: string
  /** ⭐ MEASURED, and it replaced `squad` – see `COLLEGE_TIER_ODDS` */
  odds: string
  price: string
  award: string
  bill: string
  /** null = never measured (a migrated career). The card prints nothing rather than guessing. */
  affordable: boolean | null
  /** ⭐⭐ WHY THIS PLACE IS REFUSED, or null when it is hers. See `rows`. */
  shut: CollegeShutReason | null
  /** the engine's own sentence for `shut`, never this file's. null when the row is open. */
  refusal: string | null
}

// ⭐⭐⭐ ROUND 24 #2a – EVERY REFUSED PLACE STATES ITS REASON, AND THE REASON IS THE ENGINE'S.
//
// The owner, after a played career, could not tell why the cheapest place was unpickable (his own
// words are in `docs/plans/college-the-flow.md` §2a; this file is English-only, its own rule). The
// row was dead and the template typed its own explanation next to the boolean – a sentence BESIDE
// the verdict rather than one derived from it. That is the shape `EntryStatus.ineligibleDetail` exists
// to forbid one door along, in its own words: *"the fallback must not be a SECOND GUESS at which
// refusal this was"* – a guess that once printed "Exams this week" on a rung a twenty-year-old was
// age-locked out of.
//
// ⚠⚠ SO `open` IS DERIVED FROM THE REASON HERE TOO, AND NOT READ SEPARATELY. `quoteShutFor` takes
// the engine's own persisted `quote.open` – the identical boolean `answerFork` re-validates on – and
// names the rule behind it. A row therefore CANNOT be drawn refused without a reason, because the
// reason is what makes it refused; and the card cannot disagree with the engine about whether a rung
// is open, because there is one boolean and this file does not compute a second one.
//
// ⚠ RE-DERIVING FROM HER COUNTRY WOULD HAVE BEEN THE DEFECT. It is the same fact today, and it is a
// second judgement: two answers that happen to agree are still two answers.
const rows = computed<TierRow[]>(() =>
  quotes.value.map((q) => {
    const shut = quoteShutFor(q)
    return {
      tier: q.tier,
      open: shut === null,
      shut,
      // ⚠ THE ENGINE'S SENTENCE, LOOKED UP – never written here. `COLLEGE_SHUT_DETAIL` is a total
      // `Record` over the reason codes, so a new refusal cannot reach this card without its words.
      // ⚠⚠ ROUND 26 #2 – IT IS CALLED WITH THE FACT IT HAS TO NAME. The map holds functions now: the
      // engine still owns every word, and the one thing passed in is the name of the country the
      // profile carries. `she is not one` was the whole of the round-24 sentence's failure – it
      // asserted the rule's conclusion and never said what the game thinks her residence IS.
      refusal: shut === null ? null : COLLEGE_SHUT_DETAIL[shut](homeName.value),
      name: TIER_LABEL[q.tier],
      // ⭐⭐ THE ODDS REPLACED THE SQUAD (round 21 #2). `Squad 55` was ours, on a scale the card never
      // printed her own number on, so there was nothing to compare it to; this is a measured share of
      // careers out of this build. ⚠ THE WINDOW IS NAMED ONCE UNDER THE LIST, not three times on it.
      //
      // ⭐⭐⭐ ROUND 26 #3a – AND IT IS SAID IN WORDS NOW, BECAUSE `Top 100 for 74 in 100` WAS NOT A
      // SENTENCE. The owner asked what it meant. It read as a label ("Top 100") followed by two
      // numbers with no verb between them, so the quantity was unrecoverable: 74 what, out of which
      // hundred, measured when. It is a COUNT OF CAREERS – of a hundred girls who took this place,
      // how many touched the world top 100 in the four years after they left – and the line now says
      // that, with the same figure it always carried. The window stays under the list, once.
      odds: `${COLLEGE_TIER_ODDS[q.tier].top100In100} in 100 reach the world top 100`,
      price: `${formatCents(q.costPerYearCents)} a year`,
      // ⚠ THE BAND IS THE HEADLINE AND THE PERCENTAGE IS THE WORKING – the name is a summary of the
      // figure and not a replacement for it. A walk-on is named as one: nobody funded her, and she may
      // still enrol and pay, which is the owner's ruling of 16.08 read on a row instead of a button.
      award:
        q.athleticShare <= 0 && q.needShare <= 0
          ? 'Walk-on, no award'
          : `${BAND_LABEL[fundingBandOf(coveredShareOf(q))]} (${pct(coveredShareOf(q))})`,
      // ⚠ THE WEEK IS THE UNIT THE ENGINE CHARGES IN. `resolveCollegeBill` debits one fifty-second of
      // the year every week she is enrolled, out of the same balance the coach came out of, so a family
      // can run out mid-degree. A card quoting only a year would describe a different mechanic.
      // ⚠⚠ TWO FIGURES ON THE ROW AND THE THIRD ON THE BUTTON, AND A PHONE IS WHY. The first draft put
      // the week, the year AND the whole course on every row; at 320x568 each of those lines wrapped to
      // three and the mounted fit assertion went red – the round-20 defect, caught by the test that
      // exists for it rather than by the owner. The four-year figure is the one the decision is
      // actually about, so it moved to the button that commits her (see `effectiveLine`) instead of
      // being printed three times.
      // ⚠⚠ AND IT LOST ITS DEFINITE ARTICLE TO A PHONE (round 21 #2). At the dear place «The family
      // pays $1,259 a week – $65,470 a year» is 46 character-units against the 44 a 320px row holds, so
      // it wrapped to two lines, and three wrapped rows plus the measured-odds caption took the whole
      // answers block past what the screen can hold – the mounted 320x568 assertion went red at
      // y=-10. Two units bought the line back. ⚠ The WEEK stays, because the week is the unit the
      // engine charges in and a card quoting only a year would describe a different mechanic.
      bill:
        q.familyPerYearCents <= 0
          ? 'Family pays nothing'
          : `Family pays ${formatCents(Math.round(q.familyPerYearCents / WEEKS_PER_YEAR))} a week – ${formatCents(q.familyPerYearCents)} a year`,
      affordable: offer.value ? canAfford(offer.value, q) : null,
    }
  }),
)

function pick(row: TierRow): void {
  if (row.open) picked.value = row.tier
}

/** ⭐ ROUND 24 #5 – the week the reserved place is taken up, off the snapshot's own derivation
 *  (`nextAcademicYearStart(askedWeek)` while the fork is open). The fallback cannot be reached on a
 *  live card – the engine fills the field whenever a fork is open – but a hand-built fixture without
 *  it should read as the season fact rather than crash the lede. */
const departsLabel = computed(() => {
  const w = snap.value?.collegeDepartsWeek ?? null
  return w === null ? 'next September' : weekLabel(w)
})

/** ⚠ A FACT, NOT A REFUSAL. She may take a place the family cannot pay for – it goes into debt, not
 *  away (owner, 16.08) – so this line is beside the price and never on the button. */
const effectiveLine = computed(() => {
  const q = effectiveQuote.value
  if (!q) return null
  // ⚠ THE WHOLE COURSE, ON THE CONTROL THAT COMMITS HER TO IT. She is answering a question about four
  // years; a per-year number alone asks her to do the multiplication on the most expensive click in
  // the game. A free ride says so instead of printing $0.
  const course =
    q.familyPerYearCents <= 0
      ? 'Nothing to pay'
      : `${formatCents(q.familyPerYearCents * ENDINGS.collegeYears)} over ${ENDINGS.collegeYears} years`
  return `${TIER_LABEL[q.tier]}. ${course}, and no ranking points.`
})

const stage = computed(() => portraitStage(snap.value?.ageYears ?? 19))
const artUrl = computed(() => portraitUrl(stage.value, 'serious'))
const artStyle = computed(() => {
  const p = facePoint(`${stage.value}-serious`)
  return { objectPosition: `${p.x}% ${p.y}%` }
})

async function answer(a: ForkAnswer): Promise<void> {
  // ⚠ THE TIER RIDES ONLY ON THE COLLEGE ANSWER. «stop» and «turn professional» carry none, which is
  // the command's own shape in `protocol.ts`.
  await game.answerFork(a, a === 'college' ? (effective.value ?? undefined) : undefined)
}

// ⭐⭐ R2-07 – IT IS A MODAL, AND NOW IT SAYS SO AND HOLDS THE KEYBOARD (the argument and the honest
// limit are in composables/dialogFocus.ts; this is adoption of that shell, not a second copy of it).
//
// ⚠⚠ ESCAPE IS PASSED NO HANDLER, AND ON THIS CARD THAT IS THE LOAD-BEARING HALF. This is the most
// expensive click in the game: two of the three answers end the career and the third books the end
// of the junior years. There is no fourth thing Escape could mean. It cannot cancel – the engine
// refuses to tick until the fork is answered, so a dismissal would strand the career exactly as a
// Cancel on the knock would; and it cannot pick, because a key that resolves the fork picks one of
// three answers for the player, which is ruling 4 (30.07 – the card «may not recommend») broken by
// a keystroke instead of by a style. So Escape falls through to the browser, which does nothing
// with it, and the card keeps the focus. `ConfirmDialog` wires the opposite policy for the opposite
// reason: its Escape lands on Cancel, which commits nothing.
//
// ⚠ INITIAL FOCUS IS THE FIRST ENABLED CONTROL – the first college place that is open to her, or the
// first answer when the offer draws no rows. It is NOT a recommendation and the house has already
// settled that: KnockDialog's two answers are equal-weight and it focuses the first, and
// BirthdayDialog's four rows are unmarked by the owner's own ruling (quoted on that file's script
// side; this file carries no Cyrillic at all, comments included) and it focuses the first too.
// `aria-pressed` stays false on every row until the player presses one, which is where a
// preselection would actually show, and a focus ring commits nothing.
const card = useTemplateRef<HTMLElement>('card')
useDialogFocus(card)
</script>

<template>
  <div v-if="fork" class="dialog-overlay">
    <!-- ⭐⭐ R2-07 – role/aria-modal on the CARD and not on the scrim: the backdrop is not part of
         the dialog, it is what the dialog is over. `tabindex="-1"` is the trap's landing place for
         the frame in which `game.busy` has disabled every control. NO handler on the scrim: this
         card has no way out that is not an answer, and a stray tap beside it may not be one. -->
    <div
      ref="card"
      class="dialog-card fork-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fork-dialog-kicker fork-dialog-title"
      tabindex="-1"
    >
      <img class="fork-art" :src="artUrl" :style="artStyle" alt="" />
      <!-- BOTH LINES ARE THE NAME, in the order they are read: her age, then what has happened. -->
      <p id="fork-dialog-kicker" class="fork-kicker">She is {{ fork.ageYears }}</p>
      <h2 id="fork-dialog-title" class="fork-title">School is over.</h2>
      <!-- ⚠ ROUND 24 #5 – the lede carries the ONE new fact of the redesign: college is a
           reservation taken up at the academic year's start, and the season until then is played.
           It may not recommend (ruling 4), so it states the three roads' timing and stops. -->
      <p class="fork-lede">
        The junior rungs close on age at nineteen – the season ahead is the last of them. A college
        place is reserved today and taken up when the academic year starts ({{ departsLabel }});
        the other two roads begin now. Nobody has to keep going.
      </p>

      <dl class="fork-facts">
        <div>
          <dt>The family has</dt>
          <dd>{{ formatCents(snap?.fundsCents ?? 0) }}</dd>
        </div>
        <div>
          <dt>{{ rankHead }}</dt>
          <dd>{{ rankValue }}</dd>
        </div>
        <div>
          <dt>Spent so far</dt>
          <dd>{{ formatCents(snap?.careerTotals.spentCents ?? 0) }}</dd>
        </div>
        <div>
          <dt>The tennis has paid</dt>
          <dd>{{ formatCents(snap?.careerTotals.prizeCents ?? 0) }}</dd>
        </div>
        <!-- ⭐⭐ P4's result arm – a fifth figure, not a fifth opinion. It sits beside her rank on
             purpose: the two numbers next to each other are the whole of what this card is allowed
             to say about her chances, and the comparison is the player's to make. -->
        <div v-if="tourAdmits !== null">
          <dt>{{ tourHead }}</dt>
          <dd>#{{ tourAdmits }}</dd>
        </div>
      </dl>

      <!-- ⭐⭐⭐ ROUND 24 #2a – THE PLACES MOVED ABOVE THE ANSWERS, AND THAT IS THE OWNER'S FIRST
           FAULT FIXED. They shipped BELOW the college button, so the card asked him to choose before
           it let him read: the descriptions and the quotes for the three places sat under the very
           control that spends them. Reading order is now facts -> what the three places cost ->
           the three answers, so the most expensive click in the game is made after its prices.

           ⚠ AND IT MAKES RULING 4 EASIER, NOT HARDER (30.07 – the card «may not recommend»). The
           block used to hang off ONE of the three answers, which is nine rows of detail attached to
           the college button and nothing attached to the other two. Out here it belongs to the card
           rather than to an answer, and `.fork-answers` is three equal controls again with nothing
           between them.

           ⚠ NOTHING IS PRESSED ON ARRIVAL. `aria-pressed` is false on all three until the player
           chooses, because a preselected place is a recommendation.

           ⚠ THE ROWS ARE CONTROLS AND THE ANSWERS ARE ANSWERS, and the styling says which is which.
           A row is a hairline in the FACTS idiom with no border and no fill; nothing here can be
           mistaken for a fourth thing to end the career with. -->
      <section v-if="rows.length" class="fork-places-block">
        <!-- ⚠ A LABEL, NOT A LEAD-IN. It states the condition the block is about and says nothing
             about whether to take it – the conditional is what keeps it out of ruling 4's way. -->
        <h3 class="fork-places-head">If she goes to college, these are the three places</h3>
        <ul class="fork-places">
          <li v-for="row in rows" :key="row.tier">
            <button
              class="fork-place"
              type="button"
              :aria-pressed="picked === row.tier"
              :class="{ 'is-picked': picked === row.tier, 'is-shut': !row.open }"
              :disabled="game.busy || !row.open"
              @click="pick(row)"
            >
              <span class="fork-place-head">
                <strong>{{ row.name }}</strong>
                <em>{{ row.price }}</em>
              </span>
              <!-- ⭐⭐ MEASURED, WHERE `Squad {{ }}` WAS INVENTED (round 21 #2). The owner asked for
                   the place's quality as an odds he could compare something to, and he was right that
                   a squad number is not one.

                   ⚠⚠ THE COMMENT THAT WAS HERE SAID «THE THREE ARE NEARLY THE SAME» AND IT WAS TWO
                   TABLES OUT OF DATE (round 26 #3b). It described 38 / 40 / 34, the figures re-measured
                   away in the same round they were written; the shipped table is 85 / 93 / 74 and the
                   dear place is NINETEEN points behind the middle one. That is not a bug and not an
                   inversion – `the-college-answers-2026-08.md` §10i measured it and named the cause:
                   eleven of 53 careers at the dear place never finish, and among the ones the bill did
                   not end the row is 85 / 94 / 82. **The dear place's deficit is money, not tennis** –
                   which is what the bill line under this one is for. -->
              <span class="fork-place-line">{{ row.odds }} · {{ row.award }}</span>
              <span class="fork-place-line">{{ row.bill }}</span>
              <!-- ⚠ A FACT, NEVER A REFUSAL. She may take a place the family cannot pay for: it goes
                   into debt, not away (owner, 16.08). -->
              <span v-if="row.affordable === false" class="fork-place-line">Beyond what the family has</span>
              <!-- ⭐⭐⭐ AND THIS ONE IS THE REFUSAL, SO IT SAYS WHY (round 24 #2a). It is the
                   engine's own sentence off `COLLEGE_SHUT_DETAIL`, reached through the same value
                   that disabled the button one attribute up – see `rows`. A row can therefore never
                   be dead and silent: `row.open` IS `row.refusal === null`.

                   ⚠ IT IS NOT DIMMED WITH THE REST OF THE ROW. The greying is what made this
                   unreadable in the first place; on a refused row the reason is the one thing the
                   player still needs, so `.fork-place-refusal` sits outside `.is-shut`'s fade. -->
              <span v-if="row.refusal" class="fork-place-refusal">{{ row.refusal }}</span>
            </button>
          </li>
        </ul>
        <!-- ⚠ THE WINDOW, ONCE, UNDER THE LIST. A measured share means nothing without the span it
             was measured over, and printing it on all three rows would be the third copy of a
             sentence on a card that already scrolls.
             ⚠⚠ AND IT IS ONE SHORT LINE BECAUSE THE FIRST DRAFT WAS TWO AND THE MOUNTED 320x568
             ASSERTION WENT RED – the dismiss control sat at y=-25, which is round-20 #3 arriving on
             this card by exactly the route CLAUDE.md describes: one honest sentence at a time. -->
        <p class="fork-places-note">Four years after she leaves, over 53 careers.</p>
      </section>

      <div class="fork-answers">
        <button class="fork-answer" type="button" :disabled="game.busy" @click="answer('continue')">
          <strong>Turn professional</strong>
          <span>W15 and up. Real cheques, real bills, and the family keeps paying.</span>
        </button>
        <!-- ⭐⭐ THE THIRD ANSWER IS UNCONDITIONAL (owner, 16.08). Round-17 #6 had made it depend on
             `fork.collegeOpen`, on the reasoning that a girl who had scored at W75 or above had spent
             her college eligibility. That reasoning was an NCAA rule which no longer exists, and the
             ruling that replaced it is simpler: college is a separate branch of the career, not a
             consolation the tour can take away. So the card draws three answers, always, and
             `answerFork` no longer refuses this one.

             ⚠ AND IT SAYS "COLLEGE", NOT "THE SCHOLARSHIP" (round-17 B, 12.08). It used to read
             "Take the scholarship", which is the SAME WORD the academy's travel grant uses in the
             feed, on the Money screen and on the season card – and the academy is a thing she may
             be holding right now. The owner read the two as one and asked whether a W75+ result
             before nineteen would cost her the academy. It does not, and cannot: they are separate
             mechanisms that shared a noun. `docs/specs/round17-triage.md` §B has the evidence; this
             button's job is to make sure nobody has to go and read it. -->
        <button
          class="fork-answer"
          type="button"
          :disabled="game.busy"
          @click="answer('college')"
        >
          <!-- ⚠ "RESERVE", NOT "TAKE" (round 24 #5): the click books the place; she leaves when the
               academic year starts and plays until then. The lede above carries the week. -->
          <strong>Reserve the college place</strong>
          <!-- ⚠ THE OLD LINE SAID "the money goes the other way" AND IT WAS A CLAIM THE ENGINE DID
               NOT HONOUR. It was true of the balance – she stops travelling, the coach stops billing
               – and false about the scholarship, which paid $0 and covered a bill that did not
               exist. The line below states the same trade without asserting the direction, and the
               figures under it are what the direction actually is this career. -->
          <span v-if="effectiveLine">{{ effectiveLine }}</span>
          <span v-else>Four years of student tennis on a college scholarship, from the next academic year. No ranking points.</span>
        </button>
        <button class="fork-answer" type="button" :disabled="game.busy" @click="answer('stop')">
          <strong>Stop here</strong>
          <span>She had a childhood in the sport. That is a whole thing to have had.</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fork-card {
  max-width: 460px;
  text-align: left;
}

.fork-art {
  display: block;
  width: 100%;
  height: 148px;
  object-fit: cover;
  border-radius: var(--radius-panel);
  margin-bottom: 14px;
}

.fork-kicker {
  margin: 0 0 4px;
  font-size: 11px;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

.fork-title {
  margin: 0 0 8px;
  font-family: var(--font-heading);
  font-size: 20px;
  line-height: 1.25;
  color: var(--ink);
}

.fork-lede {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-soft);
}

.fork-facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 0 0 18px;
}

.fork-facts div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fork-facts dt {
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

.fork-facts dd {
  margin: 0;
  font-size: 15px;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

/* THREE ANSWERS, ONE WEIGHT. No primary, no accent, no ordering cue beyond the order they are
   written in - the card is not allowed to have an opinion. */
.fork-answers {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fork-answer {
  display: flex;
  flex-direction: column;
  gap: 3px;
  text-align: left;
  padding: 12px 14px;
  border: var(--stroke-hair) solid var(--ink-dim);
  border-radius: var(--radius-control);
  background: transparent;
  font: inherit;
  color: var(--ink);
  cursor: pointer;
}

.fork-answer:disabled {
  opacity: 0.5;
  cursor: default;
}

.fork-answer strong {
  font-size: 15px;
  font-weight: 600;
}

.fork-answer span {
  font-size: 13px;
  line-height: 1.4;
  color: var(--ink-soft);
}

/* ⭐⭐⭐ THE PLACES BLOCK (round 24 #2a) – it now sits ABOVE `.fork-answers` rather than inside it.
   Its own margin is what used to be the gap `.fork-answers` gave it. */
.fork-places-block {
  margin: 0 0 14px;
}

/* ⚠ A LABEL IN THE FACTS IDIOM, THE SAME ONE `.fork-facts dt` USES – so the block reads as a table
   of prices and not as a fourth answer. It may not look like `.fork-title`: a heading in the card's
   heading font over three pressable rows is emphasis, and ruling 4 gives this card no emphasis to
   spend. */
.fork-places-head {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

/* ⭐⭐⭐ THE THREE PLACES (17.08). Deliberately in the FACTS idiom and not the ANSWERS idiom: no
   border, no fill, nothing that could read as a fourth thing to end the career with. They are
   quieter than the buttons beside them, which is the only styling opinion ruling 4 permits – the
   card may not emphasise an answer, and it may not make an answer's detail look like an answer.

   ⚠⚠ AND NO ROW IS EMPHASISED OVER ANOTHER UNTIL THE PLAYER PRESSES IT. `.is-picked` is the only
   accent in this block and it is a consequence of a click, never a default. A card that arrived with
   one place highlighted would be recommending it before she had read the prices.

   ⚠ IT MUST NOT GROW A max-height OF ITS OWN. The card's bound is on the shared `.dialog-card`
   (`max-height: 100%; overflow-y: auto`, round-20 #3) and the whole point of putting it there was
   that one box owns the scroll. A cap here would nest a second scroller inside the first and hide
   the family's bill behind it – exactly the class of defect the round-20 gotcha is about, and this
   block is three times the height of the one it replaced. */
.fork-places {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin: 2px 0;
  padding: 0;
  list-style: none;
  /* ⚠ A HAIRLINE, NOT A FILL, AND THE TOKEN IS ONE THAT EXISTS. The v51 block's first draft reached
     for `var(--panel-sunk, transparent)` – undeclared, so it silently resolved to `transparent` and
     the block had no container at all. `--line` is the app's real hairline token. */
  border-top: var(--stroke-hair) solid var(--line);
  border-bottom: var(--stroke-hair) solid var(--line);
}

.fork-place {
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 100%;
  text-align: left;
  /* ⚠⚠ THE VERTICAL PADDING IS A MEASURED NUMBER, NOT A TASTE. At 8px this block put `.fork-answers`
     at 537px against 536px of room on a 320x568 screen and the mounted fit assertion went red – by
     one pixel, on the narrowest phone, which is exactly how round-20 #3 shipped. Anything added to a
     row from here has to be re-measured, not reasoned about. */
  padding: 6px 10px;
  border: none;
  /* ⚠ 3px BECAUSE THE APP HAS ONE ACCENT RAIL AND THIS IS IT (owner, 30.07). The first draft used
     2px and `tests/ui-control-system.test.ts` caught it – the rail is the left edge at 3px, or 4px
     when it carries a result, and a fourth weight would be a fourth idiom. */
  border-left: 3px solid transparent;
  border-radius: var(--radius-control);
  background: transparent;
  font: inherit;
  color: var(--ink);
  cursor: pointer;
}

.fork-place.is-picked {
  border-left-color: var(--ink);
}

.fork-place:disabled {
  cursor: default;
}

/* ⚠⚠ THE FADE IS ON THE ROW'S FIGURES, NOT ON THE WHOLE ROW (round 24 #2a). It used to be
   `.fork-place.is-shut { opacity: 0.55 }`, which greyed the refusal's own sentence along with the
   prices it explains – and the sentence is the one thing a player still needs off a row he cannot
   press. The row still reads as unavailable; the reason is not part of what is dimmed. */
.fork-place.is-shut .fork-place-head,
.fork-place.is-shut .fork-place-line {
  opacity: 0.55;
}

/* ⭐⭐ THE REFUSAL'S OWN LINE. Its own class rather than a fourth `.fork-place-line` for two
   reasons: a test can find it (a refused row that states nothing is the defect this fixes), and it
   is the only line on a shut row that is not faded. `--ink-soft` is one step brighter than the
   figures above it – the house's own reading order, and the same weight `.fork-answer span` carries.

   ⚠ NO BORDER, NO FILL, NO RAIL. The app has ONE accent rail (the left edge at 3px, `is-picked`)
   and a refusal is not an accent. */
.fork-place-refusal {
  font-size: 11px;
  line-height: 1.35;
  color: var(--ink-soft);
}

.fork-place-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
}

.fork-place-head strong {
  font-size: 13px;
  font-weight: 600;
}

.fork-place-head em {
  font-style: normal;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}

/* ⚠ THE WORKING, ONE STEP DOWN FROM THE HEADLINE. Ruling 4 is untouched: a smaller font on the
   arithmetic is a reading order, not an opinion about which answer to take. */
.fork-place-line {
  font-size: 11px;
  line-height: 1.35;
  color: var(--ink-dim);
  font-variant-numeric: tabular-nums;
}

/* ⚠ THE WINDOW THE ODDS WERE MEASURED OVER – one caption under the whole list, not a fourth line on
   every row. It is a note about the numbers and not a control, so it carries no border and no fill. */
.fork-places-note {
  margin: 0;
  font-size: 11px;
  line-height: 1.35;
  color: var(--ink-dim);
}
</style>
