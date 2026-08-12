// ⭐ WHICH BLOCKING QUESTION IS ON SCREEN – one ordered list, in one place.
//
// The five overlays below all stop the world: `advanceWeeks` refuses to tick a single week until the
// one that is up has been answered, and none of them has a dismiss. So exactly one may be visible,
// and WHICH one is a rule about the story rather than about z-index.
//
// ⚠ WHY THIS IS A FUNCTION AND NOT FIVE COMPUTEDS. It was five computeds, each negating the others
// («show the birthday unless the fork, unless the retirement, unless the knock…»), and that shape has
// two faults that only show up when a new question is added to it:
//
//   1. IT CANNOT BE READ. The answer to "what does the player see the week she turns nineteen" was
//      spread over four `!show*.value` clauses in three comment blocks.
//   2. IT CAN CYCLE. `showRetirement` already read `!showFork`; making the fork wait for the birthday
//      (owner, 12.08) closed the loop birthday → retirement → fork → birthday, which is a Vue
//      computed cycle rather than a wrong dialog. Precedence written as a LIST cannot do that,
//      because a list has no back-edges.
//
// ⚠ AND IT IS THE HALF THAT CAN BE PROVEN. `tests/blocking-overlay.test.ts` walks a real career
// through every state this returns and asserts the queue always empties – see the note there on why
// "cannot deadlock" is a statement about the CLEARING PATHS, not about the order.
import type { Snapshot } from '../shared/protocol'

/** The blocking overlays, HIGHEST PRECEDENCE FIRST. `null` = the shell is free. */
export type BlockingOverlay = 'ending' | 'knock' | 'birthday' | 'fork' | 'retirement'

/**
 * ⚠ THE ORDER IS THE FEATURE. Each entry says which snapshot field raises it, and every one of these
 * fields is cleared by a command of its own that does not depend on any other entry – which is what
 * makes the walk terminate however many are pending at once.
 *
 *   1. `ending`     – not a dialog at all: it REPLACES the tab shell, so nothing can be laid over it.
 *   2. `knock`      – her BODY, and the week it governs starts now. Ahead of the birthday by
 *                     STOP_PRECEDENCE's own ordering: a sore shoulder is answered before a cake.
 *   3. `birthday`   – ⭐ 12.08, THE OWNER: «можем мы настроить тогда, чтобы информация о самом дне
 *                     рождения показывалась приоритетом первая "ей 19 сегодня", а про дальнейший
 *                     выбор карьеры уже после этого?»
 *
 *                     Her nineteenth birthday and the fork land in the SAME WEEK, and the fork used
 *                     to win – so the game asked him to decide her whole future before it told him
 *                     she had had a birthday. On two of the three answers («college», «stop») the
 *                     career ends on that click, `pendingBirthday` returns null behind an ending, and
 *                     she never got her nineteenth at all. It was not a queue in the wrong order; it
 *                     was a beat that could be deleted by the beat standing in front of it.
 *   4. `fork`       – the most expensive click in the game, and it can wait one tap.
 *   5. `retirement` – the same question at the other end of the career.
 */
export function blockingOverlay(snapshot: Snapshot | null): BlockingOverlay | null {
  if (!snapshot) return null
  if (snapshot.ending) return 'ending'
  if (snapshot.knockPrompt) return 'knock'
  if (snapshot.birthdayPrompt) return 'birthday'
  if (snapshot.fork) return 'fork'
  if (snapshot.retirementOffer) return 'retirement'
  return null
}
