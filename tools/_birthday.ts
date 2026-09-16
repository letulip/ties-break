// THE NEUTRAL BIRTHDAY ANSWER – one body, every walk. Round 42 #1 (ruled A, 15.09) took the
// day-together off the under-sixteen card, and with it went the repo-wide walk idiom
// `chooseGift(world, 'day')` – legal at every age for a year, now a throw at 13-15. Twenty-six
// test and tool walks used it; this is the one home that replaces them, on `drainLifeBeats`'
// own arrangement (body in tools/, `tests/helpers/career.ts` re-exports – tests import tools,
// never the reverse).
//
// ⚠ BEHAVIOUR-IDENTICAL FROM SIXTEEN: the day is picked whenever it is on the card, so every walk
// that asserted a 'day' row at a tour age still gets one. Under sixteen it takes the card's first
// row – a young band's gift, which no later band re-offers, so no walk's own premise (unspent
// adult pools, the never-spent day) is touched.
import { chooseGift, pendingBirthday, toSnapshot } from '../src/engine/world'
import type { WorldState } from '../src/engine/world'

/** Answer the pending birthday neutrally: the day when the card carries it (16+), else the first
 *  row. No-op when nothing is pending – callers guard, but a walk that raced a week must not throw
 *  here of all places. */
export function answerBirthdayNeutral(world: WorldState): void {
  if (pendingBirthday(world) === null) return
  const prompt = toSnapshot(world).birthdayPrompt
  if (!prompt) return
  const day = prompt.options.find((o) => o.id === 'day')
  chooseGift(world, (day ?? prompt.options[0]).id)
}
