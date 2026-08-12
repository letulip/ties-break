// ⭐ THE BLOCKING QUEUE – ORDER, AND THE PROOF THAT IT EMPTIES. Round-17 item A, 12.08.
//
// The owner: «можем мы настроить тогда, чтобы информация о самом дне рождения показывалась
// приоритетом первая "ей 19 сегодня", а про дальнейший выбор карьеры уже после этого?»
//
// Her nineteenth birthday and the career fork land in the same week. The fork spoke first, so the
// game asked him to decide her future before it told him she had had a birthday.
//
// ⚠ AND IT WAS WORSE THAN AN ORDER, which is the thing this file exists to keep fixed. Two of the
// fork's three answers END the career on the click; `pendingBirthday` returns null behind an ending;
// so on «college» and «stop» her nineteenth birthday was not postponed, it never happened. The
// birthday could be DELETED by the dialog standing in front of it. Reversing the order is what makes
// the beat reachable at all.
//
// ⚠ WHY "CANNOT DEADLOCK" IS A STATEMENT ABOUT THE CLEARING PATHS, NOT ABOUT THE ORDER. Both dialogs
// block the tick and neither has a close box – the birthday by an owner ruling (four buttons, one of
// which is "nothing"). So the danger is not that the wrong one is on top; it is that clearing the top
// one needs something only the bottom one can do. The last block below walks a real career through
// the whole queue with nothing but each overlay's OWN command and asserts it reaches empty, which is
// the only form of that claim a machine can check.
import { describe, it, expect } from 'vitest'
import { blockingOverlay } from '../src/composables/blockingOverlay'
import {
  answerFork,
  chooseGift,
  createWorld,
  decideKnock,
  pendingBirthday,
  pendingKnock,
  birthdayOffer,
  tickWeek,
  toSnapshot,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, type Snapshot } from '../src/shared/protocol'

/** Take whatever this birthday is actually offering. `chooseGift` re-derives the four options from
 *  the presents already in the house, so the list has to be derived the same way or the id is not
 *  one this birthday offered – "nothing" is a button too, and any of the four will do here. */
function answerBirthday(world: ReturnType<typeof createWorld>): void {
  const age = pendingBirthday(world)!
  const given = world.birthdays.map((b) => b.given).filter((g): g is string => g !== null)
  chooseGift(world, birthdayOffer(world.seed, age, given).options[0].id)
}

/** A career ticked to the week the fork opens, with every birthday before it answered.
 *
 *  ⚠ THE BIRTH DATE IS PART OF THE FIXTURE, AND `tools/fork-birthday-probe.ts` IS WHY. The fork and
 *  the birthday read two different clocks – `forkDue` takes `kidAgeYears(week, birthMonth)`, the
 *  MONTH only, while `pendingBirthday` takes `birthdayTurning(week, birthMonth, birthDay)` – so
 *  whether they collide depends on where in the month she was born. Measured over five dates:
 *
 *      born 10 Jan  fork w260, nineteenth w260   – same week
 *      born  5 Sep  fork w294, nineteenth w294   – same week
 *      born  1 Mar  fork w268, nineteenth w267   – birthday already first
 *      born 15 Jun  fork w281, nineteenth w283   – FORK TWO WEEKS EARLY
 *      born 20 Dec  fork w307, nineteenth w310   – FORK THREE WEEKS EARLY
 *
 *  The last two are round-17 #7's defect, not this one: `forkDue`'s own comment says it is "raised
 *  on the birthday and not at the season boundary" and for those dates it is not raised on the
 *  birthday at all. This file therefore pins the ORDER on a date where the two clocks agree, which
 *  is the owner's own case, and the block at the bottom records the dates where they do not so the
 *  gap cannot be mistaken for this fix having covered it.
 *
 *  ⚠ AND THE FORK CHECK IS AT THE TOP OF THE LOOP ON PURPOSE. Both are raised inside the same
 *  `tickWeek`, so answering the birthday before re-testing the fork would walk straight past the
 *  collision this file is about and leave every case below testing an empty queue. */
function atTheFork(birthMonth = 9, birthDay = 5) {
  const world = createWorld('fork-and-cake', { ...DEFAULT_PROFILE, birthMonth, birthDay, coachTier: 'self' })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 52 * 8 && world.fork === null; i++) {
    // Answer every OTHER blocking question on the way, so the only ones still standing at the fork
    // are the two this file is about.
    if (pendingKnock(world)) decideKnock(world, 'rest')
    if (pendingBirthday(world) !== null) answerBirthday(world)
    tickWeek(world, rng)
  }
  return { world, rng }
}

describe('the birthday speaks before the fork', () => {
  it('they really do collide – the fork opens on the week she turns nineteen', () => {
    const { world } = atTheFork()
    expect(world.fork, 'the career never reached the fork; the fixture is wrong, not the rule').not.toBeNull()
    // The collision is the premise of the whole item. If these ever stop landing together the
    // ordering below is still correct but this file is no longer testing what it claims to.
    expect(pendingBirthday(world), 'her nineteenth is pending in the same week the fork opens').toBe(19)
  })

  it('the birthday is what is on screen, and the fork is not', () => {
    const { world } = atTheFork()
    const snap = toSnapshot(world)
    expect(snap.birthdayPrompt).not.toBeNull()
    expect(snap.fork).not.toBeNull()
    // ⚠ MUTATION-VERIFIED: move the `fork` line above the `birthdayPrompt` line in
    // `blockingOverlay` and this flips to 'fork', which is exactly the bug reported on 12.08.
    expect(blockingOverlay(snap), 'she is told it is her birthday first').toBe('birthday')
  })

  it('answering the birthday genuinely raises the fork – the second beat is not lost', () => {
    const { world } = atTheFork()
    // "Nothing" is a button too; take the first option, whatever it is – the ordering must not
    // depend on WHICH present was chosen.
    answerBirthday(world)

    const after = toSnapshot(world)
    expect(after.birthdayPrompt, 'answering IS the exit').toBeNull()
    expect(blockingOverlay(after), 'and the fork is now the question on the table').toBe('fork')
    // The fork itself is untouched by the birthday – same week, same three answers.
    expect(after.fork).not.toBeNull()
  })

  it('the fork is still answerable afterwards – nothing about the birthday consumed it', () => {
    const { world } = atTheFork()
    answerBirthday(world)
    answerFork(world, 'continue')
    const after = toSnapshot(world)
    expect(after.fork, 'answered forks leave the wire').toBeNull()
    expect(blockingOverlay(after), 'and the shell is free').toBeNull()
  })
})

describe('the queue cannot deadlock', () => {
  it('every blocking overlay is cleared by a command of its OWN, so the walk terminates', () => {
    // The real check. Start at the collision, then repeatedly: ask what is on screen, run only that
    // overlay's own clearing command, and ask again. If any overlay needed a different one to move
    // first, this loop would spin on the same answer until the budget ran out.
    const { world } = atTheFork()
    const seen: (string | null)[] = []
    let guard = 0
    for (;;) {
      const which = blockingOverlay(toSnapshot(world))
      seen.push(which)
      if (which === null || which === 'ending') break
      expect(++guard, `the queue stopped clearing at "${which}" – it is waiting on something else`).toBeLessThan(10)
      if (which === 'knock') decideKnock(world, 'rest')
      else if (which === 'birthday') answerBirthday(world)
      else if (which === 'fork') answerFork(world, 'continue')
      else if (which === 'retirement') throw new Error('a retirement offer at nineteen is not a thing')
    }
    expect(seen[0]).toBe('birthday')
    expect(seen[seen.length - 1], 'the queue reaches empty').toBeNull()
  })

  it('the same walk from the OTHER two fork answers – both end the career, and that is an exit too', () => {
    // «college» and «stop» end the career on the click. The queue still terminates: `ending` replaces
    // the shell and `pendingBirthday` returns null behind it. This is the state that used to EAT the
    // birthday, and the point of the ordering is that by the time it is reachable the cake is done.
    for (const answer of ['college', 'stop'] as const) {
      const { world } = atTheFork()
      answerBirthday(world)
      // Her birthday is RECORDED before the career ends – the beat happened, whatever she chose next.
      expect(world.birthdays.some((b) => b.age === 19), `her nineteenth survives "${answer}"`).toBe(true)
      answerFork(world, answer)
      expect(blockingOverlay(toSnapshot(world))).toBe('ending')
    }
  })
})

describe('⚠ the two clocks – what this fix does NOT cover', () => {
  it('for some birth dates the fork is raised BEFORE her birthday, and no ordering can fix that', () => {
    // Round-17 #7's family, recorded here rather than fixed here: `forkDue` reads the birth MONTH
    // and `pendingBirthday` reads the birth DAY, so a girl born late in a month meets the fork
    // weeks before her nineteenth. Ordering two dialogs cannot help when only one of them exists.
    //
    // This is a FINDING, not a guard on desired behaviour: when #7 puts the two on one clock this
    // case flips, and the right response is to delete it and widen `atTheFork`'s default rather
    // than to weaken it. ⚠ Do not "fix" this by loosening the assertion.
    const { world } = atTheFork(6, 15)
    expect(world.fork, 'the fork is open').not.toBeNull()
    expect(
      pendingBirthday(world),
      'born 15 June she meets the fork two weeks before her nineteenth – see tools/fork-birthday-probe.ts',
    ).toBeNull()
    // ...and the queue is still coherent: the fork is simply the only question there is.
    expect(blockingOverlay(toSnapshot(world))).toBe('fork')
  })
})

/** A snapshot is a big object; these cases only need the five fields the rule reads. */
const only = (fields: Partial<Snapshot>) => ({ ...fields }) as Snapshot

describe('the order itself', () => {
  it('an ending outranks everything – there is no shell to lay a dialog over', () => {
    expect(
      blockingOverlay(only({ ending: {} as never, knockPrompt: {} as never, birthdayPrompt: {} as never, fork: {} as never })),
    ).toBe('ending')
  })

  it('the knock still outranks the birthday – her body before the cake', () => {
    // Unchanged by this wave, and asserted so the birthday's promotion cannot quietly take the
    // knock's place too. STOP_PRECEDENCE's own ordering.
    expect(blockingOverlay(only({ knockPrompt: {} as never, birthdayPrompt: {} as never, fork: {} as never }))).toBe('knock')
  })

  it('the fork outranks the retirement offer, as it always did', () => {
    expect(blockingOverlay(only({ fork: {} as never, retirementOffer: {} as never }))).toBe('fork')
  })

  it('nothing pending is nothing on screen', () => {
    expect(blockingOverlay(only({}))).toBeNull()
    expect(blockingOverlay(null)).toBeNull()
  })
})
