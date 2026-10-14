// r51 №7 (13.10) – THE HIRED COACH'S SENTENCE ABOUT A TRIP IS A REF (engine side). The owner: «Your coach would save her... нет перевода ни в попапе при заявке, ни на самой карточке в Сезоне».
//
// WHAT CHANGED AND WHAT MUST NOT HAVE. `coachEntryLine` and `coachLadderNote` returned finished English; they now have a ref beside them (`coachEntryLineRef`, `coachLadderNoteRef` – the `coachDeclineNoteRef` shape),
// the string is that ref's English, and the snapshot ships both (`coachCaution` / `coachCautionC`). Four questions, each with its own arm:
//   · WHICH KEY EACH OF THE EIGHT SENTENCES IS, and what its holes carry – a tournament's label raw, the table's lower-case word, the counted tail as a ref of its own;
//   · THE ENGLISH IS BYTE-IDENTICAL – against an oracle typed in the helper, independent of the engine, not against the engine's own output (a re-worded sentence is the owner's to do);
//   · THE WIRE – the string and the ref are present together or not at all, and the string IS the ref's English, on every card of the poses and of a played career;
//   · THE CATALOG – every key a played career emits has its Russian row, and the one hole that is a WORD (the table's name) has its hole-table row.
// No draw anywhere (the refs are pure), and none is added to MAIN: the position of the main stream is compared across a snapshot.
//
// ⚠ NO CYRILLIC IS TYPED HERE – the Russian side of this item is mounted in tests/component/i18n-r51-b4-coach-caution.test.ts and tests/component/i18n-r51-b4-coach-caution-poses.test.ts (one file until 14.10) and reads ru.json by key.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { bookClosedTo, closeTournament, coachLadderNote, createWorld, decideKnock, hasOutgrown, pendingKnock, skipTournament, tickWeek, tierOpenFor, toSnapshot } from '../src/engine/world'
import { coachEntryLine, coachEntryLineRef, coachLadderNoteRef } from '../src/engine/world/coachMarket'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { TIERS } from '../src/engine/season/calendar'
import { renderCopyRef, SOURCE_LOCALE, type CopyRef } from '../src/shared/i18n'
import { HOLE_TABLE } from '../src/i18n/wordHoles'
import { DEFAULT_PROFILE, type CoachTier } from '../src/shared/protocol'
import { aheadPose, bookPose, LEGACY, outgrownPose, paysPose, shutPose, withCoach, type Pose } from './helpers/coachCautionPoses'
import { EVENT_ID, tiredWithACoach } from './helpers/r41EntryWarning'

const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
const en = (c: CopyRef): string => renderCopyRef(c, { locale: SOURCE_LOCALE })
const HIRED: readonly CoachTier[] = ['budget', 'middle', 'high', 'elite']

/** The ref and its English, with the string twin checked against it on the way (the twin is what every older reader asks). */
function said(pose: Pose, tier: CoachTier): CopyRef {
  const ref = coachLadderNoteRef(pose.world, pose.event, tier)
  expect(ref, `a ${tier} coach has something to say in this pose`).not.toBeNull()
  expect(coachLadderNote(pose.world, pose.event, tier), 'the string is the ref in English').toBe(en(ref!))
  return ref!
}

describe('the three sentences about how tired she is – `coachEntryLineRef`', () => {
  const floor = ECONOMY.availability.minConditionToEnter.national

  it.each([
    ['empty – more than five points under the rung', floor - 6, LEGACY.empty],
    ['under the rung', floor - 1, LEGACY.skip],
    ['over the rung but inside his margin', floor, LEGACY.short],
  ])('%s: a key with no hole, and its English is the sentence the card always carried', (_label, condition, english) => {
    const ref = coachEntryLineRef('national', condition)
    expect(ref).toEqual({ k: english })
    expect(en(ref)).toBe(english)
    expect(coachEntryLine('national', condition), 'the string twin').toBe(english)
  })

  it('the band edge is exactly the one the string had (floor - 5 is NOT empty, floor - 5.01 is)', () => {
    expect(coachEntryLineRef('national', floor - 5)).toEqual({ k: LEGACY.skip })
    expect(coachEntryLineRef('national', floor - 5.01)).toEqual({ k: LEGACY.empty })
  })
})

describe('the five sentences about WHICH tournament – `coachLadderNoteRef`, one pose per branch', () => {
  it('THE BLOCK AHEAD, a few weeks on: the key has two holes – the rung ahead (raw) and the counted tail (a ref, `when|in {0} weeks`)', () => {
    const pose = aheadPose(3)
    expect(hasOutgrown(pose.world, 'w15'), 'precondition: the card is a rung she has passed').toBe(true)
    for (const tier of ['high', 'elite'] as const) {
      const ref = said(pose, tier)
      expect(ref.k, tier).toBe('Your coach would save her for the {0} {1}.')
      expect(ref.p, tier).toEqual([TIERS.w75.label, { k: 'when|in {0} weeks', p: [3] }])
      expect(en(ref), tier).toBe(LEGACY.save(TIERS.w75.label, 3))
    }
    // ...and the rungs whose horizon does not reach it say nothing, as before (budget 0, middle 2).
    expect(coachLadderNoteRef(pose.world, pose.event, 'budget')).toBeNull()
    expect(coachLadderNoteRef(pose.world, pose.event, 'middle')).toBeNull()
  })

  it('THE BLOCK AHEAD, next week: the counted tail is the other key, with no number in it', () => {
    const pose = aheadPose(1)
    const ref = said(pose, 'elite')
    expect(ref.p).toEqual([TIERS.w75.label, { k: 'when|next week' }])
    expect(en(ref)).toBe(LEGACY.save(TIERS.w75.label, 1))
  })

  it('THIS WEEK, a book with room: «she has outgrown this one», at every hired rung', () => {
    const pose = outgrownPose()
    expect(bookClosedTo(pose.world, 'w15'), 'precondition: the book has room, so the strong claim is not his to make').toBe(false)
    for (const tier of HIRED) {
      const ref = said(pose, tier)
      expect(ref, tier).toEqual({ k: 'Your coach says the {0} is the week – she has outgrown this one.', p: [TIERS.w75.label] })
      expect(en(ref), tier).toBe(LEGACY.outgrown(TIERS.w75.label))
    }
  })

  it('THIS WEEK, a SHUT book: «this one will not move anything» – only from a coach who keeps the book (middle and up); a budget coach gets the outgrown line', () => {
    const pose = shutPose()
    expect(bookClosedTo(pose.world, 'w15'), 'precondition: the window cannot take a W15 title').toBe(true)
    expect(tierOpenFor(pose.world, 'wta250'), 'precondition: the alternative is a rung she may play').toBe(true)
    for (const tier of ['middle', 'high', 'elite'] as const) {
      const ref = said(pose, tier)
      expect(ref, tier).toEqual({ k: 'Your coach says the {0} is the week – this one will not move anything.', p: [TIERS.wta250.label] })
      expect(en(ref), tier).toBe(LEGACY.shut(TIERS.wta250.label))
    }
    const budget = said(pose, 'budget')
    expect(budget.k).toBe('Your coach says the {0} is the week – she has outgrown this one.')
    expect(en(budget)).toBe(LEGACY.outgrown(TIERS.wta250.label))
  })

  it('THE BOOK, nothing better on the week: a key with no hole – and a budget coach, who keeps no book, says nothing', () => {
    const pose = bookPose()
    expect(bookClosedTo(pose.world, 'w15')).toBe(true)
    for (const tier of ['middle', 'high', 'elite'] as const) {
      const ref = said(pose, tier)
      expect(ref, tier).toEqual({ k: 'Your coach says even a title here would not move her ranking.' })
      expect(en(ref), tier).toBe(LEGACY.book)
    }
    expect(coachLadderNoteRef(pose.world, pose.event, 'budget')).toBeNull()
  })

  it('A CARD THAT PAYS INTO ANOTHER TABLE: the second hole is the lower-case word of the table she is NOT on, which the hole table reads as class `ladder`', () => {
    const pose = paysPose()
    expect(hasOutgrown(pose.world, 'local'), 'precondition: a rung she has passed').toBe(true)
    for (const tier of HIRED) {
      const ref = said(pose, tier)
      expect(ref, tier).toEqual({
        k: 'Your coach says the {0} is the week – this pays {1} points, not the table she is climbing.',
        p: [TIERS.j30.label, 'national'],
      })
      expect(en(ref), tier).toBe(LEGACY.pays(TIERS.j30.label, 'national'))
    }
    // The hole table is a claim about THIS call site: hole 1 is a ladder word, hole 0 (a tournament's name) is not one.
    const row = HOLE_TABLE.ladder.find((r) => r[0] === 'Your coach says the {0} is the week – this pays {1} points, not the table she is climbing.')
    expect(row, 'the sentence has its hole-table row').toBeDefined()
    expect(row!.slice(1)).toEqual([1])
  })

  it('nobody is paid to have a view on a self-coached career, and the refs are pure (the same call twice is the same ref)', () => {
    const pose = outgrownPose()
    expect(coachLadderNoteRef(pose.world, pose.event, 'self')).toBeNull()
    expect(coachLadderNoteRef(pose.world, pose.event, 'elite')).toEqual(coachLadderNoteRef(pose.world, pose.event, 'elite'))
  })
})

describe('the wire – `coachCaution` and `coachCautionC` ride the snapshot together', () => {
  const POSES: Array<[string, () => Pose]> = [
    ['ahead (a few weeks)', () => aheadPose(3)],
    ['ahead (next week)', () => aheadPose(1)],
    ['outgrown', outgrownPose],
    ['pays into another table', paysPose],
  ]

  it.each(POSES)('%s: the card he speaks on carries the ref, the string is its English, and no card carries one without the other', (_name, make) => {
    const pose = make()
    withCoach(pose.world, 'elite')
    const snap = toSnapshot(pose.world)
    const card = snap.upcoming.find((e) => e.id === pose.event.id)
    expect(card, 'the posed card is in the snapshot horizon').toBeDefined()
    expect(card!.coachCaution, 'and he speaks on it').toBeTruthy()
    expect(card!.coachCautionC, 'with the ref beside the string').toBeDefined()
    expect(card!.coachCaution).toBe(en(card!.coachCautionC!))
    for (const e of snap.upcoming) {
      expect(e.coachCaution === undefined, `${e.id}: string and ref are present together`).toBe(e.coachCautionC === undefined)
      if (e.coachCautionC) expect(e.coachCaution).toBe(en(e.coachCautionC))
    }
  })

  it('⚠ THE TWO ARITHMETIC SENTENCES NEVER REACH A LOCKED CARD: in the shut-book poses the W15 is `locked`, so the snapshot sends neither field (he speaks only about trips she can take – the load wave\'s rule)', () => {
    // CHARACTERISATION, not a wish: it is why the mounted suite poses these two sentences onto a real card instead of reaching them through the engine. If the gate ever opens such a card, this arm
    // reds and the poses above should grow two entries.
    for (const make of [shutPose, bookPose]) {
      const pose = make()
      withCoach(pose.world, 'elite')
      expect(coachLadderNoteRef(pose.world, pose.event, 'elite'), 'the function itself has the sentence').not.toBeNull()
      const card = toSnapshot(pose.world).upcoming.find((e) => e.id === pose.event.id)!
      expect(card.eligible).toBe(false)
      expect(card.coachCaution).toBeUndefined()
      expect(card.coachCautionC).toBeUndefined()
    }
  })

  it('the tired-body sentence rides the same pair: the National card of the entry-warning fixture carries the «empty» key', () => {
    const { world } = tiredWithACoach('r51-b4-tired')
    const card = toSnapshot(world).upcoming.find((u) => u.id === EVENT_ID)
    expect(card?.coachCaution).toBe(LEGACY.empty)
    expect(card?.coachCautionC).toEqual({ k: LEGACY.empty })
  })

  it('a hired coach with nothing to say sends neither field, and the snapshot survives the structured clone the worker boundary applies', () => {
    const quiet = withCoach(createWorld('r51-b4-quiet', DEFAULT_PROFILE), 'middle')
    for (const e of toSnapshot(quiet).upcoming) {
      expect(e.coachCaution, e.id).toBeUndefined()
      expect(e.coachCautionC, e.id).toBeUndefined()
    }
    const pose = outgrownPose()
    withCoach(pose.world, 'elite')
    const card = toSnapshot(pose.world).upcoming.find((e) => e.id === pose.event.id)!
    expect(JSON.parse(JSON.stringify(card.coachCautionC))).toEqual(card.coachCautionC)
    expect(structuredClone(card.coachCautionC)).toEqual(card.coachCautionC)
  })

  it('no draw: deriving the sentences moves the MAIN stream by nothing (invariant 2 – the refs are pure)', () => {
    const pose = aheadPose(3)
    withCoach(pose.world, 'elite')
    const before = JSON.stringify(pose.world.rngMain)
    toSnapshot(pose.world)
    coachLadderNoteRef(pose.world, pose.event, 'elite')
    coachEntryLineRef('national', 10)
    expect(JSON.stringify(pose.world.rngMain)).toBe(before)
  })
})

describe('the catalog – every key a played career emits has its Russian row', () => {
  const KEYS = [
    LEGACY.empty,
    LEGACY.skip,
    LEGACY.short,
    'Your coach says the {0} is the week – this pays {1} points, not the table she is climbing.',
    'Your coach says the {0} is the week – this one will not move anything.',
    'Your coach says the {0} is the week – she has outgrown this one.',
    LEGACY.book,
    'Your coach would save her for the {0} {1}.',
    'when|next week',
    'when|in {0} weeks',
  ]

  it('all ten keys are catalog rows (the importer compiled them from the DRAFT section of ru-profile-coaching-2026-10.md)', () => {
    for (const key of KEYS) expect(RU[key], `ru.json carries «${key}»`).toBeTruthy()
  })

  it('played careers at every hired rung, a squeezed condition eliciting his body lines (coach-load.test.ts\'s own loop), emit only keys from that set – and the set is not vacuous', () => {
    const seen = new Set<string>()
    const walk = (c: CopyRef): void => {
      seen.add(c.k)
      for (const p of c.p ?? []) if (typeof p === 'object' && p !== null) walk(p)
    }
    for (const tier of HIRED) {
      const world = createWorld(`r51-b4-played-${tier}`, { ...DEFAULT_PROFILE, coachTier: tier })
      const rng = rngFromSeed(world.seed)
      for (let i = 0; i < 60; i++) {
        tickWeek(world, rng)
        world.condition = Math.max(16, 60 - i)
        for (const e of toSnapshot(world).upcoming) if (e.coachCautionC) walk(e.coachCautionC)
        while (world.pendingTournament) {
          if (!world.pendingTournament.finished) skipTournament(world)
          closeTournament(world)
        }
        if (pendingKnock(world)) decideKnock(world, 'rest')
      }
    }
    expect(seen.size, 'the careers spoke at least once, or this arm asserts nothing').toBeGreaterThan(0)
    for (const key of seen) expect(KEYS, `a key a career emitted is not in the catalog set: ${key}`).toContain(key)
  })
})
