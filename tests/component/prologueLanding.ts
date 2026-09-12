// ⚠⚠ ROUND 41 #9 – WHAT THIS FILE IS NOW, AND WHY IT STILL HAS ROUND 40'S NAME.
//
// It was built for round 40 #3, the 200 ms LANDING HOLD: the container held a finished card before
// it advanced, so every walk in tests/component had to let that hold elapse, and this stepped a fake
// clock rather than sleeping. Round 41 #9 RETIRED the hold at the owner's own ruling – «8+9 as cut,
// верно» – because a radio no longer advances anything at all: the taken answer now stays on screen
// until the player presses Proceed, which is a better answer to «let the ball be seen» than a timer
// was. There is no timer left to step, so the clock work is gone with it.
//
// ⭐ WHAT REPLACES IT IS THE OTHER HALF OF THE SAME PROBLEM. Six suites walk the real container by
// pressing labels, and on the eight cards that are answered by SELECTING, a press no longer moves
// the walk: the card stays and grows a Proceed. So every one of those walks needs one more press per
// card, and this is that press, in one place – `finishCard` presses whatever the answer produced.
//
// ⚠ THE NAME IS KEPT ON PURPOSE. Six suites import this path, `docs/rounds/round-41.md` names it in
// the round's own map, and the file's SUBJECT never changed: it is «press something on a prologue
// card and let the walk settle». What changed is what settling means.
//
// ⚠⚠ AND THE SECOND ARGUMENT IS REQUIRED RATHER THAN OPTIONAL, WHICH IS THE ONE DESIGN DECISION IN
// THIS FILE. A `finishCard(click)` that took the wrapper optionally would compile in a suite that
// forgot it, and that suite would silently walk one card and then assert against a card that never
// advanced – a green-to-red conversion nobody could read. Taking the wrapper FIRST makes a suite
// that has not been re-aimed a type error instead.
import { nextTick } from 'vue'

/** The Proceed control's own hook – the one thing this helper needs to know about the markup.
 *  Spelled once here so a class rename is one edit rather than six. */
export const PROCEED_SELECTOR = '.prologue-proceed'

/** The half of `@vue/test-utils`'s wrapper this file uses. Structural rather than imported, so a
 *  caller may hand over a `VueWrapper` of any component without this file knowing which. */
interface Pressable {
  find(selector: string): { exists(): boolean; trigger(event: string): Promise<unknown> }
}

/** ⚠ TWO MICROTASK TURNS AND A RENDER. `answer()` and `proceed()` are both async and the last card's
 *  advance awaits `newCareer` through the store, so one `nextTick` is not always enough to reach the
 *  screen the press produced. Callers add their own flush on top; this is the floor. */
async function settle(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
}

/**
 * Press something on a prologue card, and then finish the card if that press finished it.
 *
 * ⚠ HARMLESS ON A PRESS THAT DOES NOT. The way on off a quiet card, a weekend's skip, the way on off
 * a result scene and the year's own answer on a card whose tournament question is still open all
 * advance – or fail to – exactly as they did: there is no Proceed on the screen afterwards, so the
 * second half of this function does nothing and the caller does not have to know which kind of
 * control it just pressed.
 */
export async function finishCard(
  wrapper: Pressable,
  click: () => Promise<unknown>,
  /** ⭐ ROUND 41 #9 – A LOOK AT THE CARD IN ITS ANSWERED STATE, BEFORE Proceed TAKES IT AWAY. This is
   *  the one moment a walk can see what the column looks like with the way on in it, and the
   *  no-repeat guard in round35-prologue.test.ts is what needs it: a card that GROWS a Proceed row
   *  is a growth that guard is supposed to be able to see. Absent for every other caller, which then
   *  walks exactly as before. */
  onAnswered?: () => void,
): Promise<void> {
  await click()
  await settle()
  const proceed = wrapper.find(PROCEED_SELECTOR)
  if (!proceed.exists()) return
  onAnswered?.()
  await proceed.trigger('click')
  await settle()
}
