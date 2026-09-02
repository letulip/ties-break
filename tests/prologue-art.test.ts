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
//   * `prologueArtStem` interpolating the STAGE instead of `portraitAssetStem` -> nothing goes red
//     TODAY, which is why `shared/avatarEmotion.ts` keeps the seam and why the file-existence sweep
//     below goes through the same builder the component does rather than spelling names itself.
//   * a `mood` column added to a card row -> the "no face is typed" test goes red.
import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { PROLOGUE_CARDS, TWELFTH_WANTS_MORE, type PrologueCard } from '../src/prologue/cards'
import { EMPTY_RUN, cardFor, moodAt, readTwelfth, warmthAt, withOrigin, withPick, type PrologueRun } from '../src/prologue/run'
import {
  PROLOGUE_FRAMES,
  WELCOME_AGES,
  WELCOME_POINT,
  prologueArtStem,
  prologueArtUrl,
  prologueFace,
  prologueFacePoint,
} from '../src/art/prologue'
import { PORTRAIT_EMOTIONS, portraitStage } from '../src/shared/avatarEmotion'
import { facePoint } from '../src/art/faceRects'

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
  // the number 5: «для этого у нас есть картинка где она первый раз на корт приходит вообще» – and,
  // 02.09, for the EIGHTH as well: «вполне можно снова использовать первый арт, там как раз про
  // теннисный клуб». Two scenes, seven portraits, and the list is derived from the frame table.
  it('⭐ the welcome painting opens the walk and comes back at the club, and nowhere else', () => {
    expect(WELCOME_AGES).toEqual([5, 8])
    expect(WELCOME_AGES[0]).toBe(PROLOGUE_CARDS[0].age)
    for (const age of WELCOME_AGES) expect(prologueArtStem(age, 'norm')).toBe('welcome-1')
    for (const card of PROLOGUE_CARDS.filter((c) => !WELCOME_AGES.includes(c.age))) {
      expect(prologueArtStem(card.age, 'norm'), `age ${card.age}`).not.toBe('welcome-1')
    }
  })

  // ⚠ THE BAND BOUNDARY WAS SET FOR THIS, months before the prologue existed – owner, 25.07:
  // «young starts at 11 – the childhood prologue is coming, so the boundary is deliberately set
  // where the prologue will need it». So the nine cards use exactly two bands and no third.
  it('⚠ the nine years use `jun` below eleven and `young` from eleven, and nothing else', () => {
    const bands = PROLOGUE_CARDS.filter((c) => !WELCOME_AGES.includes(c.age)).map((c) => portraitStage(c.age))
    expect(new Set(bands)).toEqual(new Set(['jun', 'young']))
    expect(
      PROLOGUE_CARDS.filter((c) => c.age < 11 && !WELCOME_AGES.includes(c.age)).every((c) => portraitStage(c.age) === 'jun'),
    ).toBe(true)
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
      if (WELCOME_AGES.includes(card.age)) continue
      for (const mood of PORTRAIT_EMOTIONS) {
        const path = `public/${prologueArtUrl(card.age, mood).replace(/^\/+/, '')}`
        expect(existsSync(path), `age ${card.age} face ${mood} -> ${path}`).toBe(true)
      }
    }
  })
})

// =================================================================================================
describe('⭐⭐⭐ the frames the owner picked, 02.09 – card by card, in his own order', () => {
  // ⚠ THE PICKS ARE ART DIRECTION AND THEY LIVE IN `art/prologue.ts`, NOT IN THE COPY TABLE. The
  // "no card carries a face" pin above is unchanged and still passes, which is the point: a `mood`
  // column beside the copy would be a second statement about the year kept in step by hand, while a
  // frame table beside the URL builder is the same kind of thing as «welcome-1 is the opening one».
  // MUTATION-VERIFIED: delete a row from `PROLOGUE_FRAMES` -> this goes red naming the age.
  it('⭐ every card he named draws the painting he named', () => {
    // ⚠ ASSERTED THROUGH THE STEM RATHER THAN OFF THE TABLE, so this proves the picks REACH the
    // screen. Reading `PROLOGUE_FRAMES` back to itself would pass with the ranking wired wrong.
    // `warmth`/`mood` is set to the value the derivation would otherwise have produced on a carried
    // road – `happy` – so a pick that failed to override would be visible here.
    expect(prologueArtStem(7, 'happy')).toBe('jun-serious')
    expect(prologueArtStem(8, 'happy')).toBe('welcome-1')
    expect(prologueArtStem(9, 'happy')).toBe('jun-serious')
    expect(prologueArtStem(10, 'happy')).toBe('jun-norm')
    expect(prologueArtStem(11, 'happy')).toBe('young-norm')
    expect(prologueArtStem(13, 'happy')).toBe('young-norm')
  })

  // ⚠ AND THE TWO HE DID NOT NAME ARE STILL DERIVED – «keep the current art» on the twelfth, whose
  // two faces ARE the fork. MUTATION: pin a frame at 12 -> red.
  it('⚠ the ages he left alone still read `moodAt`, the twelfth above all', () => {
    expect(PROLOGUE_FRAMES[6]).toBeUndefined()
    expect(PROLOGUE_FRAMES[12]).toBeUndefined()
    expect(prologueFace(12, 'tired')).toBe('tired')
    expect(prologueFace(12, 'serious')).toBe('serious')
    expect(prologueFace(6, 'norm')).toBe('norm')
    // ...and the twelfth's two faces still follow the fork all the way to the file on disk.
    for (const [road, want] of [
      [LIGHT_ROAD, 'young-tired'],
      [CARRIED_ROAD, 'young-serious'],
    ] as const) {
      const twelfth = walk(road).find((s) => s.card.age === 12)!
      expect(prologueArtStem(12, moodAt(12, twelfth.run))).toBe(want)
    }
  })

  // ⚠ NOTHING HE FLAGGED IS DRAWN ANY MORE. He met the delighted frame at nine («ничего ещё не
  // выиграно») and again at ten, before the Local Open has been played. On the carried road the
  // derivation reaches `happy` from the eighth year onwards, so this is a live road, not a
  // hypothetical. MUTATION: drop the 9 or the 10 row -> red naming the age.
  it('⭐⭐ she is not shown delighted before anything has been won', () => {
    for (const road of [LIGHT_ROAD, CARRIED_ROAD]) {
      for (const { card, run } of walk(road)) {
        if (card.age > 10) continue
        expect(prologueArtStem(card.age, moodAt(card.age, run)), `age ${card.age}`).not.toContain('happy')
      }
    }
    // ...and the derivation really would have: this is what the card was showing when he saw it.
    const nine = walk(CARRIED_ROAD).find((s) => s.card.age === 9)!
    expect(moodAt(9, nine.run), 'the arm the pick is overriding').toBe('happy')
  })

  // ⭐⭐ THE HOOK A RESULT WILL ARRIVE THROUGH, exercised so it is live rather than decorative. A
  // separate slice is wiring the Local Open; this proves the picture can answer it with one
  // argument at one call site and no change to any table.
  // MUTATION: rank the pinned frame above the outcome in `prologueFace` -> red.
  it('⭐ a result outranks both the pick and the derivation, and takes a scene back to a portrait', () => {
    expect(prologueArtStem(10, 'norm', 'won')).toBe('jun-happy')
    expect(prologueArtStem(10, 'norm', 'lost')).toBe('jun-sad')
    // the eighth is a SCENE; a result has to put her face back on the card, because two people
    // arriving at a court cannot report a draw sheet.
    expect(prologueArtStem(8, 'norm', 'won')).toBe('jun-happy')
    // and nothing passes one today, so every frame on the walk is the one he picked.
    expect(prologueArtStem(10, 'norm')).toBe('jun-norm')
    // ⚠ both faces the hook can reach ship, in both bands the walk uses.
    for (const age of [10, 11]) {
      for (const outcome of ['won', 'lost'] as const) {
        const path = `public/${prologueArtUrl(age, 'norm', outcome).replace(/^\/+/, '')}`
        expect(existsSync(path), `age ${age} ${outcome} -> ${path}`).toBe(true)
      }
    }
  })
})

// =================================================================================================
describe('⭐⭐⭐ «Заглавная картинка на экране обрезана (отец без головы)»', () => {
  // The painting is a 512x512 master with two people in it; the card's hero used to be 16:9, and
  // `facePoint` returns 50/50 for a stem it does not know, so `cover` kept the middle 288px of the
  // painting and threw the parent's head away above it.
  //
  // ⚠ THE SHIPPED FIX IS THE SQUARE HERO, and a square window over a square master crops nothing at
  // all – asserted on the rendered card in tests/component/prologue-walk.test.ts. THIS test is the
  // other half: that the recorded framing point survives a window that is NOT square, so the defect
  // cannot come back through a stylesheet edit alone. It is measured against the exact geometry
  // that produced it.
  const MASTER = 512
  /** Both heads, in painting pixels – the read recorded in `art/prologue.ts`. */
  const HEADS = { top: 20, bottom: 270, left: 185, right: 390 }

  it('⚠⚠ neither head is cut, even in the 16:9 window that cut one', () => {
    const point = prologueFacePoint(5, 'norm')
    expect(prologueFacePoint(8, 'norm'), 'both welcome cards frame it the same way').toEqual(point)

    // `object-fit: cover` into a 343x193 box: the master scales by 343/512 and 288px of its height
    // survive. `object-position: Q%` aligns Q% of the IMAGE with Q% of the BOX, so the visible band
    // opens at Q% of the overflow.
    const visibleH = MASTER * (193 / 343)
    const top = (point.y / 100) * (MASTER - visibleH)
    expect(top, 'the top of the parent`s head is above the window').toBeLessThanOrEqual(HEADS.top)
    expect(top + visibleH, 'her chin is below the window').toBeGreaterThanOrEqual(HEADS.bottom)

    // ...and the recorded point is the one the module exports, so the comment and the number agree.
    expect(point).toEqual({ x: WELCOME_POINT.x, y: WELCOME_POINT.y })
  })

  // ⚠ THE CENTRED FRAME REALLY DID CUT IT – without this the test above could pass against any
  // point at all and would be proving nothing about the defect.
  it('⚠ and 50/50 – what an unknown stem gets – is what took his head off', () => {
    const visibleH = MASTER * (193 / 343)
    const top = 0.5 * (MASTER - visibleH)
    expect(top, 'the centred window would have started above the parent`s head after all').toBeGreaterThan(HEADS.top)
  })

  // ⚠ AND IT IS NOT IN `art/faceRects.ts`. That table is keyed on `{stage}-{emotion}` portraits and
  // feeds `croppableStems()`, which drives the 256px AVATAR cutter – an entry there would ship a
  // crop of somebody's shoulder as a player avatar. MUTATION: add `welcome-1` to CROPS -> red.
  it('⚠ the scene`s framing is the prologue`s, not an entry in the avatar crop table', async () => {
    const { CROPS, croppableStems } = await import('../src/art/faceRects')
    expect(Object.keys(CROPS)).not.toContain('welcome-1')
    expect(croppableStems()).not.toContain('welcome-1')
    // a portrait still reads the ONE table, so this did not fork the framing for everything else
    expect(prologueFacePoint(9, 'norm')).toEqual(facePoint('jun-serious'))
  })
})
