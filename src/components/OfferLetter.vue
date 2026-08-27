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
import type {
  AcademyLetterTerms,
  AdOfferTerms,
  CallUpLetterTerms,
  EntryLetterTerms,
  KitOfferTerms,
  Offer,
  TourLetterTerms,
} from '../shared/protocol'
import { formatCents } from '../shared/money'
import { weekLabel, weekRange } from '../shared/dates'
import { dealUntilWeek } from '../engine/offers'
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

// ⚠ THREE ARMS, NOT TWO – ENTERED / WITHDREW / RELEASED (fix/outgrown-entry, 05.08), and the third
// one exists because of the letter the owner was actually shown. An engine-side pull-out reached
// the SECOND arm and came back to him as «Your withdrawal from the World Tour 50 ... is confirmed –
// in time, free of charge, and nothing is recorded against her»: a receipt for a decision he never
// took, reassuring him about the consequences of a choice he had not made. Three things were wrong
// in that one paragraph and only the smallest of them was the missing reason.
//
// So the arm is chosen by WHO ACTED, not by re-wording the one that was there. `releasedBy` absent
// means the parent - which is what it means on every letter written before the field existed, and
// on every voluntary withdrawal since - so this reads `true` only when the desk itself acted.
const entryReleased = computed(
  () => entryTerms.value.cancelled === true && (entryTerms.value.releasedBy ?? 'parent') !== 'parent',
)
const entryWithdrew = computed(() => entryTerms.value.cancelled === true && !entryReleased.value)

// THE TOUR'S OWN LETTERS (W3-ACT2, act2-pro-tour.md section 6). Three notices, one sheet, no
// buttons: a rule is not a decision.
//
// THE VOICE IS THE RULING. «Мы ни за что не наказываем» - the tour has obligations and states them,
// the GAME never leans on the player and never scolds. So the due notice reads as a fixture list
// with a price on it, the penalty notice reads as an invoice with a running balance, and the
// suspension notice states a date. Nothing here says "you should have gone".
//
// ⭐ ROUND-23 #2 – AND THE SUSPENSION'S LAST LINE WAS THE ONE PLACE THAT VOICE SLIPPED. The owner,
// 19.08: «Письмо Entries Suspended вызывает во мне странные чувства, особенно последняя строчка
// этого письма. Как будто её откуда-то сняли. Может быть можем как-то переформулировать?»
//
// The line was «Nothing is owed and nothing is taken back.» Two DENIALS of things nobody had
// proposed, and the second one is what did the damage: a sentence promising that nothing is being
// revoked can only be parsed by first supposing that something COULD be, so the paper planted a
// striking-off in the act of denying it. That is the «как будто её откуда-то сняли» he felt, and it
// is also why the line read as lifted off some other form – a denial with no antecedent is the
// grammar of boilerplate.
//
// ⚠ THE MECHANIC IS UNTOUCHED. He asked about the wording and nothing else, so both facts the old
// line carried are still on the paper, said as a PRESENCE instead of as an absence: her standing
// survives the sentence («her ranking, her points and her place on every entry list are exactly
// where she left them») and the sentence carries no bill («there is no fine on top»). Naming what
// the price IS – «the weeks are the whole price» – is the opposite of softening it.
//
// The rendered line is asserted in tests/component/round23-tour-suspension.test.ts, which builds a
// real suspension through `chargeMandatoryPenalty` and reads the paper rather than the source.
const isTour = computed(() => props.offer.kind === 'tour')
const tourTerms = computed(() => props.offer.terms as TourLetterTerms)

// ⭐⭐ THE ACADEMY (round 24 #1). The owner, 20.08: «сейчас как-то незаметно появляется один
// маленький попапчик сверху, который призывает изучить scholarship и кнопка dismiss. Я бы и рад
// изучить, да только далее не знаю где.» The toast is the round-23 stop and it stays; this is the
// «где». Three notices, one sheet, no buttons – a scholarship is not a decision the parent takes.
//
// ⚠ NO LETTERHEAD, AND THAT IS A FACT ABOUT THE ENGINE RATHER THAN A MISSING PICTURE. The two desks
// print no mark because they have no brand; the academy prints none because `engine/academy.ts`
// models it as a level and a need factor and never names an institution. There is no art to reach
// for and none may be made for it, so the sheet signs itself the way the desks' do.
//
// ⚠ AND THE VOICE IS THE FAMILY'S ONE PIECE OF GOOD NEWS. Two of the three notices are somebody
// deciding to pay for her, so the paper reads as a letter from people who want to back her. The
// ending is the same voice at the other end: it states what happened and what it costs from here,
// and – the round-23 #2 lesson – it says both as a PRESENCE («her kit is hers», «her travel is the
// family's again») rather than as a denial of things nobody proposed.
const isAcademy = computed(() => props.offer.kind === 'academy')
const academyTerms = computed(() => props.offer.terms as AcademyLetterTerms)
/** Rose or fell – the whole content of a review letter is the MOVE, so the sheet names its direction
 *  in the same word the feed line uses. */
const academyRose = computed(() => academyTerms.value.sharePct > (academyTerms.value.wasPct ?? 0))
/** WHY IT STOPPED, in the academy's own voice. Each reason is a different story and the letter tells
 *  the true one; none of them tells the player off, which is the same ruling the tour's letters keep
 *  («мы ни за что не наказываем» – the game states prices, it does not scold). */
const academyEndBody = computed(() => {
  const t = academyTerms.value
  if (t.reason === 'aged-out') {
    return 'Our programme is a junior one and she has grown out of the age we can fund, so this is where our part of it finishes. She was ours for a good stretch of it.'
  }
  if (t.reason === 'stopped-playing') {
    return 'What we fund is a player who is out competing, and this year there were too few tournaments behind her for us to carry it on.'
  }
  return 'We have read her year and we are not able to go on backing her through the next one. It is a decision about our list rather than about her.'
})

// ⭐⭐ THE ADVERTISING LETTER (round 24 item 2, the-face-and-the-court.md §6 steps 1-2). The other
// kind of sponsor entirely: a non-endemic house – a watchmaker – paying cash for her FACE, not kit
// for her tennis. A proposal like the kit letters (Sign / Refuse / a real deadline), NOT a notice,
// so it shares their foot; what it does not share is their paper's contents, because the deal is
// four facts: the fee, the term, the shoot weeks that are its price in time (step 2, §4a – the
// owner's ruling), and the bound on everything else.
//
// ⚠ NO LETTERHEAD, AND THAT IS THE ACADEMY'S OWN RULE APPLIED, NOT A MISSING PICTURE. The sponsor
// marks are keyed by KIT RUNG (`public/images/sponsors/<tier>.webp`) and an advertising house is on
// no rung of that ladder; there is no art for it and none may be made for it, so the sheet signs
// itself the way the desks' and the academy's do.
//
// ⚠ THE SHOOT WEEKS ARE ON THE PAPER for the same reason the kit letter states its failure mode: a
// letter must leave no consequence unstated. Step 2 (§4a, the owner's ruling) priced the cheque in
// TIME – `shootCount` working weeks a term, named by the signature – so the open letter states the
// count and the rule, and the signed letter names the weeks themselves (the engine's own
// `shootWeeks`, never a number this sheet worked out). The cost is stated in the house's words, not
// the engine's: a shoot week rests her the way a trip does, and no figure is quoted.
// ⭐⭐⭐ THE NATIONAL SQUAD'S INVITATION (round 27 #6). The owner: «мы знаем будет это происходить или
// нет, можно письмо об этом пользователю нормальное присылать с приглашением на турнир и проводить
// этот турнир по обычному флоу турнира. А этот попап не нужен для этого флоу вообще.»
//
// ⚠⚠ A NOTICE AND NOT A PROPOSAL, AND HERE THAT IS THE FICTION AS WELL AS THE PLUMBING. There are no
// buttons because there is nothing to answer: research §0.7 – the National Association nominates and
// the captain alone picks who plays – and §0.8 – availability is a Good Standing criterion her own
// federation judges unappealably. «She does not enter it, she is not asked, and she may not decline»
// is `resolveCallUp`'s own sentence, and a Sign/Refuse foot under it would be offering a choice the
// engine will not honour.
//
// ⚠ NO LETTERHEAD, THE ACADEMY'S RULE APPLIED. The marks are keyed by KIT RUNG and a federation is on
// no rung; there is no art for it and none may be made for it, so the sheet signs itself the way the
// two desks' and the academy's do – with what it IS. It cannot sign with her country's name either:
// `profile.country` is an ISO-2 code and the fixture's own file forbids naming nations («NAMES ARE
// FICTIONAL», engine/nationalTeam.ts).
//
// ⚠ AND THE SHEET STATES NO OUTCOME, WHICH IS THE HALF THE OLD TOAST GOT WRONG. The engine knows the
// team sheet a week early – `rollCallUp` draws it – and `CallUpLetterTerms` deliberately does not
// carry it. What the paper says is what a nomination says: she is in the squad, this is the week, and
// the captain names the side there.
const isCallUp = computed(() => props.offer.kind === 'call-up')
const callUpTerms = computed(() => props.offer.terms as CallUpLetterTerms)
/** How far she went at the championship they read, in the federation's own words – the causality
 *  round 24 built («вызов в сборную можно будет опереть на результаты студенческого»), said out loud
 *  on the paper rather than left as a number nobody can see. `null` is unreachable while
 *  `callChanceNoLeague` is 0 – no championship, no letter – and the sheet simply omits the clause
 *  rather than inventing a result for it. */
const callUpBecause = computed(() => {
  const n = callUpTerms.value.leagueRoundsWon
  if (n === null) return ''
  if (n <= 0) return 'We watched her at the college championship'
  if (n === 1) return 'She reached the last four of the college championship'
  if (n === 2) return 'She played the final of the college championship'
  return 'She won the college championship'
})
const isAd = computed(() => props.offer.kind === 'ad')
const adTerms = computed(() => props.offer.terms as AdOfferTerms)
/** "Twelve months", because a house writing to a family says it the way the kit letters say "three
 *  seasons" – words, not a numeral – falling back to the numeral past the terms the game issues. */
const adTermWord = computed(() => (adTerms.value.termWeeks === 52 ? 'Twelve months' : `${adTerms.value.termWeeks} weeks`))
/** The promise count, in a house's words ("Two") – same rule as the term above – falling back to
 *  the numeral past the counts the game issues (the catalogue says 2; the plan's bigger asks are
 *  recorded, not built). */
const adShootCountWord = computed(() => {
  const n = adTerms.value.shootCount
  return n === 1 ? 'One' : n === 2 ? 'Two' : n === 3 ? 'Three' : `${n}`
})
/** The named weeks once the signature has chosen them, in the game's own calendar words
 *  ("W14 '31 and W38 '31") – `weekLabel` is the unit every surface speaks. Empty until signed. */
const adShootWeekLine = computed(() => {
  const weeks = adTerms.value.shootWeeks ?? []
  const labels = weeks.map((w) => weekLabel(w))
  if (labels.length <= 1) return labels[0] ?? ''
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`
})
/** What the paper reports once it is a record. The signed arm quotes the engine's own `untilWeek`
 *  and `shootWeeks` – the facts `signOffer`/`acceptOffer` froze onto the deal – never a number this
 *  sheet worked out. */
const adSettled = computed(() => {
  const o = props.offer
  switch (o.state) {
    case 'signed': {
      const running = props.week <= (o.untilWeek ?? -1)
      const shoots = adShootWeekLine.value
      return running
        ? `Signed – the fee is banked, the campaign runs to ${weekLabel(o.untilWeek ?? o.week)}${shoots ? `, and her shoot weeks are ${shoots}` : ''}.`
        : 'Signed. The fee was banked, and the campaign has run its course.'
    }
    case 'refused':
      return 'Turned down.'
    case 'expired':
      return 'Expired – they needed an answer.'
    default:
      return props.week > props.offer.deadlineWeek ? 'Expired – they needed an answer.' : ''
  }
})

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
/** ⭐⭐ ROUND-21 #2, 17.08 – AND THIS ONE NUMBER NOW BUYS TWO SEATS. The same share comes off the
 *  COACH's fare at the tournaments that pay prize money (`coachTravelFareFor`), so the letter says it
 *  as ONE promise in one sentence rather than printing the same percentage twice. Every field of
 *  `KitOfferTerms` is printed on this letter by the standing rule at the top of engine/offers.ts: the
 *  letter's words and the letter's terms may not disagree, and a second line quoting an identical
 *  figure is the kind of thing a reader checks twice and then distrusts.
 *
 *  ⚠ NO PRONOUN NAMES THE COACH (R15-7, owner 09.08) – `buildCoachRoster` puts a woman on every
 *  roster by construction, so "his seat" would print under Sabine Kobayashi. */
const travelPct = computed(() => Math.round((terms.value.travelShare ?? 0) * 100))
/** A brand writing to a family says "three seasons", not "3 seasons" - the letter is handwritten and
 *  a numeral in the middle of a sentence reads as a form. Falls back to the numeral past the terms
 *  this game can actually issue rather than carrying a dictionary. */
const SEASON_WORDS = ['', 'One season', 'Two seasons', 'Three seasons', 'Four seasons']
const seasonWord = computed(() => {
  const n = terms.value.seasons ?? 1
  return SEASON_WORDS[n] ?? `${n} seasons`
})

/** ⚠ HOW LONG IT ACTUALLY RUNS, IN WEEKS AND NOT ONLY IN SEASONS (09.08, the owner: «Непонятно на
 *  какое количество лет спонсор контракт заключает, нигде не видно этой информации»).
 *
 *  `terms.seasons`, `Offer.fromWeek` and `Offer.untilWeek` are all persisted - a global deal in his
 *  own save reads `from w102 until w257` - and until this line NOTHING printed any of them. The
 *  paper said "Three seasons" and stopped, so the one question a parent asks about a contract («до
 *  какой недели?») had no answer on any surface in the game.
 *
 *  ⚠ AND THE UNSIGNED LETTER READS THE ENGINE'S OWN FUNCTION rather than adding 52 to something.
 *  `dealUntilWeek` is exactly what `signOffer` will write onto the offer, so the week quoted on the
 *  paper is the week the contract gets - a screen that computed the term itself is a screen that can
 *  promise a season the till does not honour, which is the same class of error the kit price had.
 *  The START is deliberately NOT quoted here: `dealStartsAt` needs the whole inbox (a deal already
 *  running pushes the new one behind it), and this component is handed one letter. A signed offer
 *  knows both, because the engine froze them onto it. */
const runsToWeek = computed(() => props.offer.untilWeek ?? dealUntilWeek(props.offer))
/** The signed contract as an interval, for the letter that is now a record rather than a decision. */
const signedRun = computed(() => {
  const o = props.offer
  if (o.state !== 'signed' || o.fromWeek === undefined || o.untilWeek === undefined) return ''
  return `In their kit ${weekLabel(o.fromWeek)} – ${weekLabel(o.untilWeek)} · ${seasonWord.value.toLowerCase()}`
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
       decision. The two exits are the same sheet, shorter.

       ⚠ THE THIRD ARM IS THE DESK ACTING, and it must never borrow the second arm's words. "Your
       withdrawal is confirmed" and "nothing is recorded against her" are written to settle a parent
       who CHOSE to pull out and is worried about the cost of it; addressed to one who chose nothing
       they read as a receipt for something he did not do. So the released arm names the actor in its
       first three words, gives the reason in the next sentence, and drops the reassurances that only
       answer a question a voluntary exit asks. -->
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
      <template v-else-if="entryWithdrew">
        <p class="offer-body">
          Your withdrawal from the {{ entryTerms.label }} ({{ weekRange(entryTerms.eventWeek) }})
          is confirmed – in time, free of charge, and nothing is recorded against her. The entry
          fee is on its way back.
        </p>
      </template>
      <template v-else-if="entryTerms.releasedBy === 'injury'">
        <p class="offer-body">
          We have taken her name off the entry list for the {{ entryTerms.label }}
          ({{ weekRange(entryTerms.eventWeek) }}). She is not fit to play that week, and our list
          closes before she is due back on court – so rather than leave her in a draw she cannot
          make, we have withdrawn her ourselves.
        </p>
        <ul class="offer-terms">
          <li>The entry fee is refunded in full, and the year's entry is returned.</li>
          <li>This is our decision, not hers – nothing is recorded against her.</li>
          <li>Her place goes to the next name on the list. We hope to see her back soon.</li>
        </ul>
      </template>
      <!-- ⭐ ROUND 24: the college freeze releases every entry that was still outstanding when it
           started, so the desk writes its own arm rather than falling through. It is written like the
           injury one – WE acted, the money is back – but with the two sentences that are only true
           here: nothing is recorded against her because there was nothing to record, and the place
           is held open rather than mourned. No price and no apology; see `REFUSED_PAST_DEADLINE`
           in engine/world/entries.ts for the ruling that this letter is the receipt for. -->
      <template v-else-if="entryTerms.releasedBy === 'college'">
        <p class="offer-body">
          We have taken her name off the entry list for the {{ entryTerms.label }}
          ({{ weekRange(entryTerms.eventWeek) }}). She has accepted a college place, so she is off the
          tour for the next few years – rather than hold a spot she cannot travel to, we have released
          her ourselves.
        </p>
        <ul class="offer-terms">
          <li>The entry fee is refunded in full, and the year's entry is returned.</li>
          <li>Nothing is recorded against her – this is not a withdrawal, and there is no charge.</li>
          <li>Her name comes back on the list the day she wants it there. Good luck at school.</li>
        </ul>
      </template>
      <!-- ⚠ THE FALLBACK IS DELIBERATELY GENERIC RATHER THAN THE NEAREST NICE PARAGRAPH, and that
           is the whole lesson of this fix. A future `EntryReleaseReason` that fell through to the
           voluntary arm would tell the player he withdrew her - which is the bug, arriving again by
           inheritance. So an unknown desk-side release says only what is true of EVERY desk-side
           release: we acted, the money is back. The engine's own copy switch (world/entries.ts) is
           exhaustive and will not compile against a new reason, so this is a second line rather
           than a licence to skip writing one. -->
      <template v-else>
        <p class="offer-body">
          We have taken her name off the entry list for the {{ entryTerms.label }}
          ({{ weekRange(entryTerms.eventWeek) }}). This is our decision, not hers, and the entry fee
          is refunded in full.
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
      <!-- THE SEASON NOTICE (round-18 #8) – the quiet reminder, one a season while her ranking
           binds her. Every figure comes off the terms the desk wrote it with, so the sheet cannot
           drift from ECONOMY.mandatory; the requirement list is the same one the briefing prints. -->
      <template v-else-if="tourTerms.notice === 'season'">
        <p class="offer-body">
          Her ranking is inside the top {{ tourTerms.maxRank }}, so the season ahead is a required
          one. These are the events the tour asks her for.
        </p>
        <ul class="offer-terms">
          <li v-for="requirement in tourTerms.requirements ?? []" :key="requirement">{{ requirement }}</li>
          <li>
            Not entering one costs {{ tourTerms.points }} penalty points and a zero in one of her
            {{ tourTerms.countingSlots }} counting results.
          </li>
          <li>
            {{ tourTerms.suspensionAt }} points inside {{ tourTerms.windowWeeks }} weeks suspends
            entries for {{ tourTerms.suspensionWeeks }} weeks. Nothing is owed for a week she could
            not play.
          </li>
        </ul>
      </template>
      <template v-else>
        <p class="offer-body">
          Entries are suspended through {{ weekLabel(tourTerms.untilWeek ?? 0) }} –
          {{ tourTerms.runningPoints }} penalty points inside 52 weeks.
        </p>
        <ul class="offer-terms">
          <li>She may train and travel; she may not enter a tournament until that week has passed.</li>
          <!-- ⭐ ROUND-23 #2 – THE CLOSING LINE, REWRITTEN. It read "Nothing is owed and nothing is
               taken back." and the owner said it made him feel she had been struck off something.
               The owner's words and the argument are on the script side, at `isTour`. -->
          <li>
            Her ranking, her points and her place on every entry list are exactly where she left
            them – the weeks are the whole price, and there is no fine on top.
          </li>
        </ul>
      </template>
      <p class="offer-sign-off">– Tour office</p>
    </PaperNote>
    <div class="offer-foot">
      <p class="offer-window settled">Filed {{ weekLabel(offer.week) }}.</p>
    </div>
  </article>

  <!-- ⭐⭐ THE ACADEMY (round 24 #1) – the destination the round-23 toast never had. Arrival, a share
       that moved, and the end of the run: three notices on one sheet, no mark, no buttons. Every
       number on it comes off `terms`, which is what the review had in its hand the week it wrote –
       see AcademyLetterTerms for why a persisted letter may not carry an assembled sentence. -->
  <article v-else-if="isAcademy" class="offer-letter">
    <PaperNote class="offer-paper" size="letter" :tilt="0">
      <template v-if="academyTerms.notice === 'arrived'">
        <p class="offer-body">
          We have been watching her play, and we would like to take her on. From here we pay
          {{ academyTerms.sharePct }}% of what it costs to get her to tournaments – the fares and the
          nights away, on every trip she makes.
        </p>
        <ul class="offer-terms">
          <li>{{ academyTerms.sharePct }}% comes off each travel bill as it is charged, so there is nothing to claim back.</li>
          <li v-if="academyTerms.grantCents">
            A kit grant of {{ formatCents(academyTerms.grantCents) }} comes with this – rackets, strings and shoes for the season.
          </li>
          <li>We look at it again at the end of each season, and the share moves with her year.</li>
        </ul>
      </template>

      <template v-else-if="academyTerms.notice === 'reviewed'">
        <p class="offer-body">
          We have read her season. From this year our share of her travel
          {{ academyRose ? 'goes up' : 'comes down' }} to {{ academyTerms.sharePct }}%, from
          {{ academyTerms.wasPct }}%.
        </p>
        <ul class="offer-terms">
          <li>We have backed her since {{ weekLabel(academyTerms.sinceWeek) }}, and this carries that on.</li>
          <li v-if="academyTerms.grantCents">
            This year's kit grant is {{ formatCents(academyTerms.grantCents) }}.
          </li>
          <li>The next look is at the end of the coming season.</li>
        </ul>
      </template>

      <template v-else>
        <p class="offer-body">{{ academyEndBody }}</p>
        <ul class="offer-terms">
          <li>We backed her from {{ weekLabel(academyTerms.sinceWeek) }} to {{ weekLabel(offer.week) }}.</li>
          <li>The kit she has is hers, and from here her travel is the family's again.</li>
          <li>If her tennis brings her back to us, our list is open every off-season.</li>
        </ul>
      </template>
      <p class="offer-sign-off">– The academy</p>
    </PaperNote>
    <div class="offer-foot">
      <p class="offer-window settled">Filed {{ weekLabel(offer.week) }}.</p>
    </div>
  </article>

  <!-- ⭐⭐⭐ THE NATIONAL SQUAD'S INVITATION (round 27 #6) – the letter that replaced a toast about a
       week the player had already missed. A NOTICE: no mark, no buttons, and a foot that only says
       when it was filed. Every number comes off `terms`, frozen the week it was written – see
       CallUpLetterTerms for why a persisted letter carries figures and never an assembled sentence,
       and for why the team sheet the engine already holds is deliberately not among them. -->
  <article v-else-if="isCallUp" class="offer-letter">
    <PaperNote class="offer-paper" size="letter" :tilt="0">
      <p class="offer-body">
        <template v-if="callUpBecause">{{ callUpBecause }}, and the selectors have read it.</template>
        She is named in the squad for {{ callUpTerms.label }} – she is expected on court for
        {{ weekRange(callUpTerms.tieWeek) }}.
      </p>
      <ul class="offer-terms">
        <!-- THE WEEK IS STATED AS A RANGE, exactly as the tournament desk's own entry letter states
             a week she is expected on court. A letter about a week that has not happened yet is only
             useful if it says WHEN, and «W15 '33» is the game's shorthand rather than a date. -->
        <li>
          {{ callUpTerms.squadSize }} players are named and the week holds {{ callUpTerms.tiesInTheWeek }} ties,
          so the captain picks the side for each of them – she may be named and never take the court.
        </li>
        <li>
          {{ callUpTerms.nationsAtHerLevel }} nations play at this level, and where the country finishes
          is the country's result rather than hers.
        </li>
        <li>
          There are no ranking points and no prize money here – the competition awards neither to
          anybody in it. Playing when we call is what representing asks of her.
        </li>
      </ul>
      <p class="offer-sign-off">– Her national federation</p>
    </PaperNote>
    <div class="offer-foot">
      <p class="offer-window settled">Filed {{ weekLabel(offer.week) }}.</p>
    </div>
  </article>

  <!-- ⭐⭐ THE ADVERTISING LETTER (round 24 item 2, steps 1-2) – the non-endemic house. A PROPOSAL, so
       it keeps the kit letters' foot (the window, Sign/Refuse, the settled line) and none of their
       paper: no letterhead (no rung, no mark – see the script), no kit. The terms are the whole
       deal, the shoot weeks are its whole price, and the last line bounds what is owed. -->
  <article v-else-if="isAd" class="offer-letter">
    <PaperNote class="offer-paper" size="letter" :tilt="0">
      <p class="offer-body">
        We make watches, and we have been following her results. We would like her face in our
        campaign – her photograph beside our name, and the fee below for the family.
      </p>
      <ul class="offer-terms">
        <li>
          A one-time fee of {{ formatCents(adTerms.cashCents) }}, paid the day this is signed.
          Money, not kit – we are not a tennis house.
        </li>
        <li>
          {{ adTermWord }} from signing, her face is with us – and in no other campaign while that
          runs.
        </li>

        <li>
          {{ adShootCountWord }} weeks of her season are shoot weeks – ours. In season, spread
          apart, and named the day this is signed, so the family can plan around them. A shoot is a
          working week: she will rest less in it, as she would on any trip.
        </li>
        <li>
          Beyond those weeks nothing is owed: no tournaments, no results, nothing to pay back –
          whatever the season brings.
        </li>
      </ul>
      <p class="offer-sign-off">– {{ adTerms.brand }}</p>
    </PaperNote>
    <div class="offer-foot">
      <p v-if="live" class="offer-window">
        {{ weeksLeft }} {{ weeksLeft === 1 ? 'week' : 'weeks' }} to decide. The terms will not change.
      </p>
      <p v-else class="offer-window settled">{{ adSettled }}</p>
      <div v-if="live" class="offer-actions">
        <button class="offer-refuse" @click="emit('refuse', offer.id)">Refuse</button>
        <button class="offer-sign primary" @click="emit('sign', offer.id)">Sign</button>
      </div>
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
      <!-- ⚠ ONE LINE IS THE WHOLE DIFFERENCE, AND IT HAS TO BE THERE. A renewal (10.08) carries the
           SAME terms as the contract that is ending – `raiseKitRenewal` copies them verbatim, because
           that is what renewing is – so without this arm the incumbent's letter would introduce
           itself to a family it has kitted out all season, in the voice of a stranger. Everything
           below is unchanged and stays true of a second year: the coverage, the freshness, the
           events she owes, the exclusivity and the term. -->
      <p v-if="terms.renewal" class="offer-body">
        She has been in our kit all season and we have enjoyed every week of it. We would like to keep
        her in it – the same deal, another year.
      </p>
      <p v-else class="offer-body">
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
        <!-- ⭐ ONE PROMISE, TWO SEATS (17.08). The same share comes off the coach's fare at the rungs
             that pay prize money, so it is a clause on this line rather than a second line repeating
             the figure. The coach is named without a pronoun - the roster carries women. -->
        <li v-if="travelPct > 0">
          And we will take {{ travelPct }}% of what a trip costs her – and the same off the coach's
          fare, at the tournaments that pay prize money.
        </li>
        <li>In return she enters at least {{ terms.minEventsPerSeason }} tournaments a season – we are paying to be seen.</li>
        <!-- ⚠ EXCLUSIVITY IS A TERM AND BELONGS ON THE PAPER. It is the counterweight to the
             coverage – one brand at a time is what stops a career collecting all three rungs – and
             a player who cannot read it here would be committing to it blind. In the brand's own
             voice, plainly, the way a commercial term is really written. -->
        <li>And while she is in our kit she is in nobody else's.</li>
        <li>
          <!-- HOW LONG IT RUNS, in seasons AND in weeks. "Three seasons" left the parent counting
               off a calendar he cannot see, and the end week was persisted on the offer all along -
               see `runsToWeek` in the script for why the letter may not compute it itself. -->
          {{ seasonWord }}, starting with the one ahead – she is in our kit to
          {{ weekLabel(runsToWeek) }}.
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
      <!-- THE CONTRACT AS AN INTERVAL, once it is a record rather than a decision. Both weeks are
           the engine's own (`fromWeek` / `untilWeek`), so the letter says exactly which weeks the
           brand is committed to and the parent stops having to count seasons. -->
      <p v-if="signedRun" class="offer-window settled">{{ signedRun }}</p>
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
