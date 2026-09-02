// ⭐⭐⭐ PHASE 7 – THE PICTURE ON EVERY CARD, AND THE FACE IT WEARS.
//
// THE OWNER, 02.09: «надо сделать пролог красивым … по типу нашего home screen где большой арт на всю
// ширину экрана … Это первое прикосновение к игре, оно должно быть "вау! интересно!"» – and, on the
// first card, «для этого у нас есть картинка где она первый раз на корт приходит вообще».
//
// WHAT THIS FILE CLAIMS, and it is the half `tests/component/prologue-walk.test.ts` cannot make:
// that the picture is DERIVED rather than typed, that the derivation reads the same facts the two
// read lines read, and that every frame it can ask for exists on disk.
//
// ⚠⚠ MUTATION-VERIFIED. Every claim below was watched failing before it was believed:
//   * `moodAt` returning `'norm'` always -> the fork test and the mapping test go red.
//   * `moodAt`'s fork arm reading `'wants-more' -> 'tired'` (the two swapped) -> the fork test goes
//     red naming the road.
//   * `moodAt` reading warmth on the twelfth (i.e. the fork ignored) -> the fork test goes red.
//   * `WELCOME_AGE` set to 6 -> the first-card test goes red at both ends.
//   * `prologueArtStem` interpolating the STAGE instead of `portraitAssetStem` -> nothing goes red
//     TODAY, which is why `shared/avatarEmotion.ts` keeps the seam and why the file-existence sweep
//     below goes through the same builder the component does rather than spelling names itself.
//   * a `mood` column added to a card row -> the "no face is typed" test goes red.
import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { PROLOGUE_CARDS, TWELFTH_WANTS_MORE, type PrologueCard } from '../src/prologue/cards'
import { EMPTY_RUN, cardFor, moodAt, readTwelfth, warmthAt, withOrigin, withPick, type PrologueRun } from '../src/prologue/run'
import { WELCOME_AGE, prologueArtStem, prologueArtUrl } from '../src/art/prologue'
import { PORTRAIT_EMOTIONS, portraitStage } from '../src/shared/avatarEmotion'

/** The two roads through the table, named by what the player did – the same pair the mounted walk
 *  uses, so the two files cannot be talking about different childhoods. */
const LIGHT_ROAD: Record<number, string> = { 8: 'municipal', 9: 'group', 10: 'stay-home', 11: 'ordinary-school', 12: 'let-her-stop' }
const CARRIED_ROAD: Record<number, string> = { 8: 'club', 9: 'one-to-one', 10: 'enter', 11: 'sports-school', 12: 'give-her-the-year' }

function walk(road: Record<number, string>): { card: PrologueCard; run: PrologueRun }[] {
  const seen: { card: PrologueCard; run: PrologueRun }[] = []
  let run = EMPTY_RUN
  for (const row of PROLOGUE_CARDS) {
    const card = cardFor(row.age, run)
    seen.push({ card, run })
    if (card.origins) run = withOrigin(run, 'middle')
    else if (card.options) run = withPick(run, card.age, road[card.age])
  }
  return seen
}

describe('⭐⭐ the face the year wears is DERIVED, off the facts the card already reads', () => {
  // ⚠⚠ THE CLAIM THAT MATTERS: there is no `mood` column anywhere in the table. A face typed beside
  // the copy is a second statement about the year, kept in step with the first by hand – and the
  // first is `her`/`coach`, whose arm the run already chooses. One mechanism, three consumers.
  it('⚠⚠ NOT ONE CARD CARRIES A FACE OF ITS OWN – the table has no mood column', () => {
    const faces = new Set<string>(PORTRAIT_EMOTIONS)
    for (const card of [...PROLOGUE_CARDS, TWELFTH_WANTS_MORE]) {
      for (const [key, value] of Object.entries(card)) {
        expect(/mood|face|emotion|portrait|art|image|picture/i.test(key), `card ${card.age} declares \`${key}\``).toBe(false)
        expect(typeof value === 'string' && faces.has(value), `card ${card.age}.${key} is a face`).toBe(false)
      }
    }
  })

  // ⭐ THE OWNER'S THREE: «she asks to go back (happy), she is tired of it (tired), she wants more
  // (serious)». All three are reachable on a road a player can actually take, and the fourth face
  // (`norm`) is what the early cards get because nothing has happened yet.
  it('⭐ all three of the owner`s faces are reachable, and the early years are the ordinary one', () => {
    const light = walk(LIGHT_ROAD).map(({ card, run }) => moodAt(card.age, run))
    const carried = walk(CARRIED_ROAD).map(({ card, run }) => moodAt(card.age, run))
    expect(new Set([...light, ...carried])).toEqual(new Set(['norm', 'happy', 'tired', 'serious']))
    // ⚠ AND THE FIRST FOUR CARDS ARE THE SAME ON BOTH ROADS, BY CONSTRUCTION. No decision has been
    // taken before 5, 6, 7 and 8, so a picture that differed there would be reporting a year the
    // player has not lived – the exact rule the two arms of `PrologueRead` are written under, and
    // `prologue-cards.test.ts` asserts for the sentences.
    expect(light.slice(0, 4)).toEqual(carried.slice(0, 4))
    expect(light.slice(0, 4)).toEqual(['norm', 'norm', 'norm', 'norm'])
  })

  // ⭐⭐ THE TWELFTH AND THE THIRTEENTH FOLLOW THE FORK, because the YEAR does (`sameAsLastYear`).
  it('⭐⭐ the twelfth`s two faces are the fork`s two faces, and the thirteenth keeps the one it got', () => {
    for (const [name, road, want] of [
      ['the light road', LIGHT_ROAD, 'tired'],
      ['the carried road', CARRIED_ROAD, 'serious'],
    ] as const) {
      const seen = walk(road)
      const twelfth = seen.find((s) => s.card.age === 12)!
      const thirteenth = seen.find((s) => s.card.age === 13)!
      expect(readTwelfth(twelfth.run).reading, name).toBe(want === 'tired' ? 'tired' : 'wants-more')
      expect(moodAt(12, twelfth.run), `${name} at twelve`).toBe(want)
      expect(moodAt(13, thirteenth.run), `${name} at thirteen`).toBe(want)
    }
  })

  it('the middle years follow the warmth the two read lines follow – one mechanism, not two', () => {
    for (const road of [LIGHT_ROAD, CARRIED_ROAD]) {
      for (const { card, run } of walk(road)) {
        if (card.age >= 12) continue
        expect(moodAt(card.age, run), `age ${card.age}`).toBe(warmthAt(card.age, run) === 'warm' ? 'happy' : 'norm')
      }
    }
  })

  it('it is a pure function of the run – the same childhood always draws the same face', () => {
    for (const { card, run } of walk(CARRIED_ROAD)) {
      expect(moodAt(card.age, run)).toBe(moodAt(card.age, run))
    }
  })
})

describe('⭐⭐ every frame the walk can ask for is a file that ships', () => {
  // ⭐ THE OWNER'S OWN INSTRUCTION FOR THE FIRST CARD, pinned against the table rather than against
  // the number 5: «для этого у нас есть картинка где она первый раз на корт приходит вообще».
  it('⭐ the welcome painting is the FIRST card`s and no other`s', () => {
    expect(WELCOME_AGE).toBe(PROLOGUE_CARDS[0].age)
    expect(prologueArtStem(WELCOME_AGE, 'norm')).toBe('welcome-1')
    for (const card of PROLOGUE_CARDS.slice(1)) {
      expect(prologueArtStem(card.age, 'norm'), `age ${card.age}`).not.toBe('welcome-1')
    }
  })

  // ⚠ THE BAND BOUNDARY WAS SET FOR THIS, months before the prologue existed – owner, 25.07:
  // «young starts at 11 – the childhood prologue is coming, so the boundary is deliberately set
  // where the prologue will need it». So the nine cards use exactly two bands and no third.
  it('⚠ the nine years use `jun` below eleven and `young` from eleven, and nothing else', () => {
    const bands = PROLOGUE_CARDS.filter((c) => c.age !== WELCOME_AGE).map((c) => portraitStage(c.age))
    expect(new Set(bands)).toEqual(new Set(['jun', 'young']))
    expect(PROLOGUE_CARDS.filter((c) => c.age < 11 && c.age !== WELCOME_AGE).every((c) => portraitStage(c.age) === 'jun')).toBe(true)
    expect(PROLOGUE_CARDS.filter((c) => c.age >= 11).every((c) => portraitStage(c.age) === 'young')).toBe(true)
  })

  // ⚠⚠ AND THE FILES EXIST – the one claim no mounted test can make, because happy-dom never
  // fetches an `<img src>`. Swept through the SAME builder the component calls, over every age the
  // table has and every face `moodAt` can return, so a URL this could not resolve is a 404 the
  // player would meet on the first screen of the game.
  it('⚠⚠ every (age, face) the walk can produce names a painting on disk', () => {
    const reachable = new Set<string>()
    for (const road of [LIGHT_ROAD, CARRIED_ROAD]) {
      for (const { card, run } of walk(road)) reachable.add(`${card.age}:${moodAt(card.age, run)}`)
    }
    expect(reachable.size).toBeGreaterThan(8)
    for (const key of reachable) {
      const [age, mood] = key.split(':')
      const url = prologueArtUrl(Number(age), mood as (typeof PORTRAIT_EMOTIONS)[number])
      // The builder returns an app URL (BASE_URL-prefixed); the file lives under `public/`.
      const path = `public/${url.replace(/^\/+/, '')}`
      expect(existsSync(path), `age ${age} face ${mood} -> ${path}`).toBe(true)
    }
  })

  // ⚠ AND SO DOES EVERY FACE THE TABLE COULD EVER GROW INTO, not just the four in reach today. The
  // mapping in `moodAt` is the owner's and may change; the art set is total over both bands, and
  // this is what says so before a new arm ships a 404.
  it('⚠ both bands are complete, so a new arm of the mapping cannot 404', () => {
    for (const card of PROLOGUE_CARDS) {
      if (card.age === WELCOME_AGE) continue
      for (const mood of PORTRAIT_EMOTIONS) {
        const path = `public/${prologueArtUrl(card.age, mood).replace(/^\/+/, '')}`
        expect(existsSync(path), `age ${card.age} face ${mood} -> ${path}`).toBe(true)
      }
    }
  })
})
