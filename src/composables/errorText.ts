// ⭐ L3-7 (10.10) – A STORE ERROR READ THROUGH ITS CODE. docs/specs/i18n-2026-10.md §8 row L3-7; the ask is RU-13A's / RU-15's («typed error codes … an English exception in the middle of a Russian row is not a
// completed translation»).
//
// ⚠ WHAT THIS IS. The store keeps the English sentence on `error` (and on `saveOp.message`) exactly as it always did – that is the diagnostic, the older readers' string and the fallback – and, since L3-7, the
// STABLE CODE of the sentence beside it (`errorCode`, `saveOp.code`). A row that prints a store error asks `errorText(code, message)`:
//   · a code this build knows is the `t()` of that sentence – and EVERY KEY BELOW IS THE CURRENT ENGLISH SENTENCE, BYTE FOR BYTE (CLAUDE.md invariant 4: no wording is authored here; the owner's rows join on
//     these keys). `tests/i18n-l3-7-errors.test.ts` holds each one equal to the engine's / the store's own spelling, so a reworded sentence cannot leave its translation behind;
//   · ⭐ A SENTENCE WITH HOLES RIDES AS A REF, NOT AS A CODE (the L3-7 close-out, 10.10, docs/decisions.md item 33). The seven save-file KINDS are codes but not sentences – `corrupted` is five, `invalid-shape` a frame
//     over a closed set of clauses and field names, `future-schema` and `oversized` carry numbers – so the worker puts the sentence beside the kind as a `CopyRef` (`ErrorReply.c`), the store keeps it beside
//     `errorCode` (`errorC`, `saveOp.c`, `initErrorC`) and it is rendered here, through the catalog, holes and nested clauses included. The ref is used ONLY when it renders (in English) to the very `message` being
//     shown: a stale ref – a fixture that wrote `error` by assignment, a refusal that replaced the one the ref came with – is ignored, and the translation of one sentence can never stand over another;
//   · an unknown code, no code, or a code whose sentence is not fixed and carries no ref (`INVALID_COMMAND` – the engine's payload refusals are a hundred sentences, named below; a save-file kind with no `c`: the one
//     raw lower-layer message of saveCodec.ts `asCorrupted`, or a reply from a build before the ref) is the raw `message`, untouched.
//
// ⚠ NOT EVERY SENTENCE A PLAYER CAN SEE FROM THE STORE IS HERE, AND THE REST IS A NAMED LEFTOVER: the engine's other refusals are plain `Error`s with no code (about a hundred sentences in the commands'
// guards – `Nobody has asked her`, the college freeze, the career-ended refusal …); they print raw until each earns a code the same way. This file is the mechanism and the first ten entries.
import { renderCopy, t } from '../i18n'
import { renderCopyRef, SOURCE_LOCALE, type CopyRef } from '../shared/i18n'

/** the sentence of a code under the current locale – or, for a refused save file, of its ref – or `message` when this build has nothing for it */
export function errorText(code: string | undefined, message: string, c?: CopyRef | null): string {
  // a refused save file's sentence, holes and nested clauses included – but only when it IS the message being shown (see the header)
  if (c && renderCopyRef(c, { locale: SOURCE_LOCALE }) === message) return renderCopy(c)
  switch (code) {
    // the store's own: the worker's two concurrency kinds, which the store turns into a sentence of its own, and its three recovery lines
    case 'SAVE_CONFLICT':
      return t('Another tab has newer progress for this career – reload before continuing here.')
    case 'STALE_REVISION':
      return t('That action was based on an outdated screen – it was refreshed. Try again.')
    case 'store-restarted':
      return t('The simulation restarted. Try again.')
    case 'store-restarted-from-save':
      return t('Simulation restarted from the last saved week.')
    case 'store-crashed':
      return t('The simulation crashed. Try again, or reopen the app to continue.')
    // the engine's coded refusals (`RefusalCode`): the four sentences of a letter that cannot be answered, and a last offer that is not a question
    case 'offer-not-in-inbox':
      return t('That letter is not in the inbox.')
    case 'offer-already-signed':
      return t('That deal is already signed.')
    case 'offer-gone':
      return t('That offer has already gone.')
    case 'offer-next-season-signed':
      return t('She is already signed for next season.')
    case 'last-offer-not-a-question':
      return t('She has already said this one – there is nothing here left to answer')
    default:
      return message
  }
}
