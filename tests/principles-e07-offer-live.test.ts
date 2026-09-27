// ⭐⭐ T4.2 · E-07 + C-P10 – «CAN THIS LETTER STILL BE ANSWERED» IS ONE FUNCTION, ASKED FOUR TIMES.
//
// The finding (docs/review-principles-2026-09-26/05-ui.md, E-07, plus 03-engine-leaves.md's C-P10
// hand-off): the question was spelled FIVE times. The engine owns it – `isOfferLive`
// (`engine/offers.ts`), whose own note says «The one definition, read by the engine, the snapshot's
// dot and the screen, so none of them can answer it differently» – and four sites re-spelled it
// beside that sentence:
//
//   `InboxSheet.vue`     `live()`, which drives the open-letter list, the «Needs an answer» pill
//                        and the row's «N weeks to decide» tail – three readers of one copy
//   `OfferLetter.vue`    `live`, which gates the Sign / Refuse controls on both letter kinds
//   `inboxMail.ts`       `letterDeletable`'s open arm – the NEGATION, spelled out
//   `engine/offers.ts`   `offerAnswerError`'s own two inline lines (C-P10), in the same file as the
//                        primitive, returning one message from two branches
//
// Both components already imported from `engine/offers`, so form A was available and not taken
// (docs/specs/engine-ui-parity-2026-09.md §1). Home's dot asked the engine; the sheet's list asked a
// copy. A deadline rule that ever gains a clause – a grace week, a window that closes early – would
// have moved the dot and left the buttons behind.
//
// ⚠⚠ WHAT THIS FILE CAN AND CANNOT WITNESS. The five spellings AGREED, so no table of answers could
// separate them – that is the same shape E-06 had, and it is why the falsifiable claim here is
// structural on this side and behavioural under arm A. What the rows below own is the BOUNDARY –
// `week <= deadlineWeek`, the last week she may answer – because that is the clause a re-spelling
// gets wrong, and because it is the one input on which a `<` copy diverges from the engine.
//
// ⚠⚠ MUTATION ARMS – both quoted in the wave's report:
//   arm A (the shared SOURCE): break `isOfferLive`'s deadline clause and EVERY surface reddens
//     together – this file, the engine's own `offers.test.ts`, and the mounted pair in
//     tests/component/principles-w4-offer-live.test.ts. Measured on the UNFIXED tree first, where
//     the same break leaves the four copies untouched: that difference IS the fix.
//   arm B (the SHARING): restore ONE surface's own body and only the parity file reddens, while that
//     surface's own suites stay green.
//   arm C (the TEMPLATE, spec §2's third arm): spell the liveness inline in `OfferLetter`'s own
//     `v-if` and the MOUNT reddens alone.
import { describe, it, expect } from 'vitest'
import { adUntilWeek, hasLiveOffer, isOfferLive, offerAnswerError } from '../src/engine/offers'
import { letterDeletable } from '../src/composables/inboxMail'
import { engineModuleFunction, componentFile } from './worldSource'
import { codeOf, region } from './helpers/source'
import type { AdOfferTerms, Offer } from '../src/shared/protocol'

/** One letter, at the grain the question reads: a state and a deadline. `kind: 'kit'` with no terms
 *  is never handed to a renderer here – these rows ask the four predicates directly. */
const letter = (state: Offer['state'], deadlineWeek: number): Offer =>
  ({ id: 'off-1', kind: 'kit', week: deadlineWeek - 2, deadlineWeek, state, terms: {} } as unknown as Offer)

const WEEK = 50

describe('E-07 §1: the four sites route at the engine, not at a copy of it', () => {
  // ⚠⚠ EVERY NEGATIVE CLAIM BELOW READS `codeOf(...)`, AND THAT IS NOT TIDINESS. All four sites now
  // carry a dated note SAYING what they used to spell, which is the convention this repo runs on – and
  // a substring pin has no parser, so the first run of these cases went red on the comments describing
  // the fix (2 failed: «expected … not to contain 'state === \'open\' &&'»). It is exactly the trap
  // `HomeScreen.vue` records at its own chip – «do not quote a lock's copy here, not even as an
  // example» – arriving from the other direction. Stripping the prose is what lets the history stay at
  // the site AND the ban stay honest.
  it('⚠⚠ `offerAnswerError` asks `isOfferLive` rather than spelling it twice (C-P10)', () => {
    // The engine's own second spelling, and the one the review put in lane C: two branches,
    // `state !== 'open'` then a deadline comparison, returning the SAME sentence. One call replaces
    // both, and the message is byte-identical – asserted below as well as here.
    const src = codeOf(engineModuleFunction('offers', 'offerAnswerError'))
    expect(src, 'the refusal reads the primitive').toContain('isOfferLive(offer, week)')
    expect(src, 'and no longer compares the deadline itself').not.toContain('week > offer.deadlineWeek')
  })

  it('⚠ `letterDeletable`\'s open arm is the primitive NEGATED, spelled once', () => {
    // ⚠ `componentFile` and not `componentLogic`: the claim below is NEGATIVE and is about this file
    // alone (tests/pin-hygiene.test.ts enforces the distinction mechanically).
    const mail = componentFile('composables/inboxMail.ts')
    const body = codeOf(region(mail, 'export function letterDeletable', '\n}'))
    expect(body, 'the open arm is the engine\'s answer, inverted').toContain('!isOfferLive(offer, week)')
    // The `signed` arm keeps reading `untilWeek` – a different question, and deliberately untouched.
    expect(body, 'and nothing here compares an offer deadline').not.toContain('offer.deadlineWeek')
  })

  it('⚠ `InboxSheet` and `OfferLetter` spell no liveness of their own', () => {
    // Both already imported from `engine/offers`, which is what made this form A rather than a
    // witness. NEGATIVE claims about two `.vue` files, so `componentFile` for each – and `codeOf`
    // rather than `scriptCodeOf`, because a `.vue` writes its history in `<!-- -->` too.
    const sheet = codeOf(componentFile('components/InboxSheet.vue'))
    const paper = codeOf(componentFile('components/OfferLetter.vue'))
    expect(sheet, 'the sheet calls the primitive').toContain('isOfferLive(')
    expect(paper, 'the letter calls the primitive').toContain('isOfferLive(')
    // The shape of the copy that was here: an `open` test conjoined with a deadline comparison. It is
    // pinned narrowly on purpose – `deadlineWeek` alone is legitimate on both files (the sheet's «N
    // weeks to decide» tail and the letter's `weeksLeft` both count towards it), and a blanket ban
    // would be the over-strict pin this repo keeps re-learning about.
    expect(sheet, 'and re-spells no liveness').not.toContain("state === 'open' &&")
    expect(paper, 'and neither does the letter').not.toContain("state === 'open' &&")
  })
})

describe('E-07 §2: the boundary week – the clause a re-spelling drifts on', () => {
  // Every row here passed before the fix too, because the five spellings agreed. They are the
  // «no rendered string moves and no answer moves» half of the finding, measured; the sharing
  // itself is proven by arm A, whose output the report quotes at both commits.
  it('⭐ the deadline week is INCLUSIVE, at all four sites at once', () => {
    const live = letter('open', WEEK)
    expect(isOfferLive(live, WEEK), 'the engine: her last week is a week she may answer').toBe(true)
    expect(hasLiveOffer([live], WEEK), 'the inbox dot stays lit on the last week').toBe(true)
    expect(offerAnswerError([live], 'off-1', WEEK), 'the answer is allowed').toBeNull()
    expect(letterDeletable(live, WEEK), 'and the bin stays off a letter that is still a decision').toBe(false)
  })

  it('⭐ ...and one week past it, everything shuts together', () => {
    const late = letter('open', WEEK - 1)
    expect(isOfferLive(late, WEEK)).toBe(false)
    expect(hasLiveOffer([late], WEEK)).toBe(false)
    expect(offerAnswerError([late], 'off-1', WEEK)).toBe('That offer has already gone.')
    expect(letterDeletable(late, WEEK), 'a lapsed letter is a record, and records may be cleared').toBe(true)
  })

  it('⚠ the refused sentence is ONE sentence for both ways of being gone', () => {
    // C-P10's whole claim: `state !== 'open'` and `week > deadlineWeek` returned the same string from
    // two branches, so folding them changes nothing a player reads. Quoted from the source rather
    // than retyped as a new sentence – it is the engine's, and invariant 4 makes it the owner's.
    const src = engineModuleFunction('offers', 'offerAnswerError')
    const gone = src.match(/return '(That offer has already gone\.)'/)
    expect(gone, 'the sentence is still in the file').not.toBeNull()
    const sentence = gone![1]
    expect(offerAnswerError([letter('expired', WEEK + 2)], 'off-1', WEEK), 'expired').toBe(sentence)
    expect(offerAnswerError([letter('refused', WEEK + 2)], 'off-1', WEEK), 'refused').toBe(sentence)
    expect(offerAnswerError([letter('open', WEEK - 1)], 'off-1', WEEK), 'past its deadline').toBe(sentence)
    // ...and exactly ONE occurrence of it now, where there were two.
    expect([...src.matchAll(/That offer has already gone\./g)], 'one branch, one sentence').toHaveLength(1)
  })

  it('⚠ the `signed` arm still answers first, and with its own sentence', () => {
    // The fold is placed AFTER it deliberately (C-P10: «one message for both arms, and `signed` is
    // still answered first»). A signed deal is not live by `isOfferLive` either, so a fold written
    // one line higher would have replaced this sentence with the wrong one.
    expect(offerAnswerError([letter('signed', WEEK + 2)], 'off-1', WEEK)).toBe('That deal is already signed.')
    expect(offerAnswerError([letter('signed', WEEK - 5)], 'off-1', WEEK), 'even long past its deadline').toBe(
      'That deal is already signed.',
    )
  })

  it('⚠ and a letter that is not in the inbox is still its own refusal', () => {
    expect(offerAnswerError([letter('open', WEEK)], 'off-nope', WEEK)).toBe('That letter is not in the inbox.')
  })
})

// =================================================================================================
// E-P05 RIDES HERE – the lane's P3 row for the OTHER letter family, in the two files this task opened.
// =================================================================================================
//
// The row: «the ad confirm's until-week is spelled with `Math.max(1, …)`, the engine's without»
// (`InboxSheet.vue` vs `engine/offers.ts`), proposal «one exported `adUntilWeek(terms, week)`».
//
// ⚠ THE PREMISE IS HALF WRONG ON THIS TREE AND THE ROW STILL STANDS. `signOffer`'s ad arm clamps too –
// `Math.max(1, (offer.terms as AdOfferTerms).termWeeks)` – so the two spellings AGREED byte for byte and
// nothing was diverging. What made it worth closing anyway is `dealUntilWeek`'s own sentence, quoted at
// the kit confirm: «a screen that computed the term itself is a screen that can promise a season the
// till does not honour». The confirm quotes an end date BEFORE the signature, so it is the one surface
// where a second derivation is a promise.
describe('E-P05: the ad confirm quotes the week the signature will write', () => {
  it('⚠⚠ `signOffer`\'s ad arm asks `adUntilWeek` rather than deriving the end week', () => {
    const src = codeOf(engineModuleFunction('offers', 'signOffer'))
    expect(src, 'the engine writes the shared answer').toContain('adUntilWeek(offer.terms as AdOfferTerms, week)')
    expect(src, 'and no longer clamps a term of its own').not.toContain('Math.max(1, (offer.terms as AdOfferTerms).termWeeks)')
  })

  it('⚠ ...and so does the confirm, which quotes it to the player first', () => {
    const sheet = codeOf(componentFile('components/InboxSheet.vue'))
    expect(sheet, 'the sheet calls the engine\'s function').toContain('adUntilWeek(t, week.value)')
    expect(sheet, 'and spells no term arithmetic of its own').not.toContain('Math.max(1, t.termWeeks)')
  })

  it('⭐ the window is INCLUSIVE of the signing week, and a zero-week paper still covers it', () => {
    // Both halves of the rule, asserted where one function owns them: the clamp is part of the answer
    // rather than a guard, and the `- 1` is what makes the end week the last covered one.
    const terms = (termWeeks: number) => ({ termWeeks }) as unknown as AdOfferTerms
    expect(adUntilWeek(terms(1), 40), 'a one-week campaign ends the week it starts').toBe(40)
    expect(adUntilWeek(terms(4), 40), 'four weeks: 40, 41, 42, 43').toBe(43)
    expect(adUntilWeek(terms(0), 40), 'a zero-week paper still covers its own week').toBe(40)
    expect(adUntilWeek(terms(-3), 40), 'and so does a malformed one').toBe(40)
  })
})
