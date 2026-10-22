// ⭐ R53 №2 (21.10) – HIS NAME, THE WORDS. A pure copy leaf (A-06): `partnerName.ts` and the hub read
// it, it imports nothing of theirs. Spec: docs/specs/partner-name-disclosure-2026-10.md §3.2–3.3.
//
// ⚠ ⚠ DRAFT – EVERY LINE BELOW IS THE BUILDER'S DRAFT FOR THE OWNER'S PASS (invariant 4: he words it).
// ⚠ ONE HOLE, `{0}`, AND IT IS ALWAYS THE NAME – handed in as `{ k: 'partner|<Name>' }`, the tile's own
// localized pool word (R53-REL-N01…), so the Russian side prints «Антон» and needs no declension: every
// line keeps the name in the nominative. The English is the key with the name filled in (`withName`).
// ⚠ THE PARTNER MAY BE «HE» HERE – the spec's own lines name him; the COACH is never the subject.
import { cp, type CopyParam, type CopyRef } from '../../../shared/i18n'
import type { Temperament } from '../../spirit'

type Named = (name: CopyParam) => CopyRef

/** The ref's English: the key with its one hole filled. Every ref in this file has exactly one. */
export function withName(ref: CopyRef, name: string): string {
  return ref.k.split('{0}').join(name)
}

/** The ref of the name itself – the pool word the tile already localizes. */
export function nameRef(name: string): CopyRef {
  return { k: `partner|${name}` }
}

/** Road 1 at close – appended to HER line on the «there is someone» card: she names him herself. */
export const MET_NAMES_HIM: Record<Temperament, Named> = {
  // ⚠ DRAFT
  sunny: (n) => cp`"His name is ${n}. You'll like him."`,
  // ⚠ DRAFT
  fiery: (n) => cp`"His name is ${n}. Be nice to him."`,
  // ⚠ DRAFT
  quiet: (n) => cp`"He's called ${n}."`,
  // ⚠ DRAFT
  deep: (n) => cp`"His name is ${n}. I'll tell you more when I know more myself."`,
}

/** Road 1 at steady – her answer to «Ask what his name is». */
export const ASK_NAMED: Record<Temperament, Named> = {
  // ⚠ DRAFT
  sunny: (n) => cp`"It's ${n}," she said, and laughed.`,
  // ⚠ DRAFT
  fiery: (n) => cp`"${n}. Happy now?"`,
  // ⚠ DRAFT
  quiet: (n) => cp`A pause, then: "${n}."`,
  // ⚠ DRAFT
  deep: (n) => cp`"${n}," she said, as if testing how it sounded out loud.`,
}

/** Road 1 at strained / cold – the same question, no name. */
export const ASK_LATER: Record<Temperament, CopyRef> = {
  // ⚠ DRAFT
  sunny: cp`"Later. I'll tell you later, promise."`,
  // ⚠ DRAFT
  fiery: cp`"Later. Not now."`,
  // ⚠ DRAFT
  quiet: cp`"Later."`,
  // ⚠ DRAFT
  deep: cp`"When it is something, I'll tell you. Later."`,
}

/** Road 2 – «Insist: we want to know», at any band but cold: the name, at a price she makes audible. */
export const INSIST_NAMED: Record<Temperament, Named> = {
  // ⚠ DRAFT
  sunny: (n) => cp`"Fine – ${n}. You didn't have to push."`,
  // ⚠ DRAFT
  fiery: (n) => cp`"${n}. There. Was that worth it?"`,
  // ⚠ DRAFT
  quiet: (n) => cp`"…${n}." She added nothing more.`,
  // ⚠ DRAFT
  deep: (n) => cp`"${n}. I would have told you. Just not like this."`,
}

/** Road 2 at cold – no name, and the same −2. */
export const INSIST_REFUSED: Record<Temperament, CopyRef> = {
  // ⚠ DRAFT
  sunny: cp`"No. Not like this."`,
  // ⚠ DRAFT
  fiery: cp`"No. You don't get to make me."`,
  // ⚠ DRAFT
  quiet: cp`She said nothing at all, and the conversation ended there.`,
  // ⚠ DRAFT
  deep: cp`"Pushing is exactly why I don't tell you things."`,
}

/** Road 3 – the week she names him on her own, in the PARENT's voice (the feed is his journal): at
 *  home over dinner, from college on the phone (the owner's «позвонила и назвала имя»). */
export const NAMED_LATER: Record<'home' | 'college', Named> = {
  // ⚠ DRAFT
  home: (n) => cp`His name is ${n} – she said it over dinner, as if we had always known.`,
  // ⚠ DRAFT
  college: (n) => cp`She called from college and told us his name: ${n}.`,
}

/** Road 4 – the press, after `publicWeek`, at the booth's own tiers. */
// ⚠ DRAFT
export const PRESS_NAMES_HIM: Named = (n) => cp`In the stands – ${n}, her boyfriend.`
