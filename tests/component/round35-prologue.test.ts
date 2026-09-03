// ⭐⭐⭐ ROUND 35, BUNDLE A – the prologue, played end to end for the first time since it merged.
//
// Items 1, 2, 4 and 7 are measured here, mounted, on a 375x667 phone. Every one of them is the
// owner's own report, and his words are quoted HERE rather than in a `<template>` –
// `tests/round13-nav.test.ts` bans Cyrillic inside one, comments included:
//
//   1  «у нас на прологе турнир как-то сразу в матчи идет, давай сделаем наш нормальный полноценный
//      флоу пожалуйста, чтобы был первый экран с артом турнира, потом матчи и переходы между ними
//      как обычно. И с результатами в конце или с кубком, как у нас. А потом уже продолжаем наши
//      прологовые карточки»
//   2  «мне кажется в прологе можно без подложек с рамкой делать флоу, а просто квадратный арт во
//      всю ширину (как на home) и ниже весь текст с выбором, как раз и места вертикально немного
//      появится»
//   4  «мне кажется какие-то экраны у нас повторяются, я увидел "she asks more", "juniour tour opens
//      at fourteen" дважды… Похоже, что это как-то связано с последующими турнирами, но если так -
//      то это максимально невнятно и странно»
//   7  «На последнем кадре пролога после турнира случилось странное: мне показали сначала арт с
//      кубком, потом еще какой-то экран (я не успел прочесть что там), который сразу сменился на She
//      is fourteen (в чем я не уверен, честно говоря, потому что ДР у нее в июне) и This is the girl
//      you raised»
//
// ⚠⚠ MUTATION-VERIFIED. Watched failing before it was believed – each mutation is named at the arm
// it reddens, and the four that matter most are:
//   * `beat` put back on `ChildhoodPrologue` (the card, then the ask, on one painting) -> the
//     no-repeat walk goes red naming the twelfth and the thirteenth by their titles.
//   * `.prologue-overlay`'s `padding: 0` removed -> the room measurement goes red at 635px.
//   * `creating` dropped from `begin()` -> the trophy-to-handover reproduction goes red, naming the
//     thirteenth card as the screen that appears between them.
//   * `handoverKicker` replaced by the literal «She is fourteen» -> the age arm goes red on a June
//     birthday, which is the owner's own default profile.
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import { assertDismissReachable, boxOf, measureDialog, setViewport, PHONE } from './fits'
import ChildhoodPrologue from '../../src/components/ChildhoodPrologue.vue'
import PrologueCardView from '../../src/components/PrologueCard.vue'
import PrologueLocalOpen from '../../src/components/PrologueLocalOpen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot, KID_ID } from '../../src/engine/world'
import { ageInWords, kidAgeYears } from '../../src/engine/world/age'
import { daysInBirthMonth } from '../../src/shared/dates'
import {
  CARD_AGES,
  LOCAL_OPEN_COPY,
  PROLOGUE_CARDS,
  TWELFTH_WANTS_MORE,
  localDrawLine,
  type PrologueCard,
} from '../../src/prologue/cards'
import { handoverKicker, handoverRoseTitle } from '../../src/prologue/handover'
import { OPENING_IDENTITY } from '../../src/prologue/identity'
import { LOCAL_POOL, playLocalOpen, prologueEntrant } from '../../src/prologue/pool'
import {
  EMPTY_RUN,
  cardFor,
  moodAt,
  readTwelfth,
  warmthAt,
  withOrigin,
  withPick,
  type PrologueRun,
} from '../../src/prologue/run'
import { venueArtUrl } from '../../src/art/venues'
import { DEFAULT_PROFILE, type PlayerProfile, type PrologueHandover } from '../../src/shared/protocol'

const CARRIED_ROAD: Record<number, string> = {
  8: 'club', 9: 'one-to-one', 10: 'enter', 11: 'sports-school', 12: 'give-her-the-year',
}

function stubStore() {
  const game = useGameStore()
  game.newCareer = vi.fn(async (_seed: string, profile: PlayerProfile = DEFAULT_PROFILE, prologue?: PrologueHandover) => {
    game.snapshot = toSnapshot(createWorld('r35', profile, 'c', prologue))
  })
  game.deleteCareer = vi.fn(async () => {
    game.snapshot = null
  })
  return game
}

async function press(wrapper: ReturnType<typeof mount>, label: string): Promise<void> {
  const button = wrapper.findAll('button').find((b) => b.text().startsWith(label))
  expect(button, `no «${label}»: ${wrapper.text().slice(0, 160)}`).toBeTruthy()
  await button!.trigger('click')
  await Promise.resolve()
  await wrapper.vm.$nextTick()
}

function mountCard(card: PrologueCard, run: PrologueRun, ask = false) {
  setViewport(PHONE)
  const wrapper = mount(PrologueCardView, {
    attachTo: document.body,
    props: {
      card,
      warmth: warmthAt(card.age, run),
      mood: moodAt(card.age, run),
      reason: card.age === 12 ? readTwelfth(run).reason : undefined,
      ask: ask ? card.tournament : undefined,
      identity: { ...OPENING_IDENTITY },
    },
  })
  const el = document.querySelector('.prologue-card')!
  const answers = document.querySelector('.prologue-answers')!
  return { wrapper, el, answers }
}

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

/** ⭐ ONE WHOLE CHILDHOOD, THROUGH THE REAL COMPONENT, calling back with every scene it draws. The
 *  callback is what the two reproductions below differ by; the walking is the same walking. */
async function walkChildhood(
  wrapper: ReturnType<typeof mount>,
  opts: { enter: boolean; rich?: boolean; onScene?: (kind: 'card' | 'result', last: boolean) => void },
): Promise<void> {
  let run = EMPTY_RUN
  for (const age of CARD_AGES) {
    const row = PROLOGUE_CARDS.find((c) => c.age === age)!
    const card = cardFor(age, run)
    opts.onScene?.('card', false)
    if (card.origins) {
      await press(wrapper, card.origins[1].label)
      run = withOrigin(run, 'middle')
    } else if (card.options) {
      const option = opts.rich === false
        ? [...card.options].sort((a, b) => (a.costCents ?? 0) - (b.costCents ?? 0))[0]
        : (card.options.find((o) => o.id === CARRIED_ROAD[age]) ?? card.options[1])
      await press(wrapper, option.label)
      run = withPick(run, age, option.id)
    } else if (!row.tournament) {
      // ⚠ A CARD THAT CARRIES A TOURNAMENT QUESTION SYNTHESISES NO «Go on» (round 35 #4): the ask's
      // own pair is the way on there.
      await press(wrapper, card.continueLabel)
    }
    // ⭐ AND THE YEAR'S TOURNAMENT QUESTION, ON THE SAME SCREEN.
    // ⚠ SCOPED TO THE CARDS THAT CARRY ONE, and it has to be: the age-10 card's own «Not this year»
    // is an OPTION with the same words as the ask's decline, and a label scan would answer the tenth
    // twice and the eleventh's question during the tenth's turn.
    if (row.tournament) {
      // ⚠⚠ THE SCENE IS RECORDED AGAIN HERE, BETWEEN THE YEAR'S ANSWER AND THE ASK'S, AND THAT IS
      // WHAT MAKES THE NO-REPEAT ARM ABLE TO FAIL. Under the two-beat version this is where the
      // second drawing of the card appeared - same painting, same title, a different body.
      opts.onScene?.('card', false)
      await press(wrapper, opts.enter ? 'Put her name down' : 'Not this year')
    }
    // ...and then whatever tennis the year held.
    for (let guard = 0; guard < 12; guard++) {
      if (wrapper.find('.plo-skip').exists()) {
        await press(wrapper, LOCAL_OPEN_COPY.skipRest)
        continue
      }
      const result = [LOCAL_OPEN_COPY.result.won, LOCAL_OPEN_COPY.result.final, LOCAL_OPEN_COPY.result.lost]
        .find((r) => wrapper.text().includes(r.title))
      if (result) {
        opts.onScene?.('result', age === CARD_AGES[CARD_AGES.length - 1])
        await press(wrapper, LOCAL_OPEN_COPY.proceed)
        continue
      }
      break
    }
  }
}

// =================================================================================================
// ITEM 2 – the frameless flow, and the vertical room it actually freed
// =================================================================================================

describe('⭐⭐⭐ item 2 – a square painting across the full width, and the text under it', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  // ⭐⭐ THE ROOM ITSELF, WHICH IS THE HALF HE ASKED FOR («как раз и места вертикально немного
  // появится»). `.dialog-overlay` insets every dialog in the app by 16px, and `measureDialog` takes
  // that off the viewport before anything else – so the prologue's cards were being drawn into a
  // 343x635 hole in a 375x667 phone. `.prologue-overlay` drops the inset and the scrim (there is
  // nothing behind the prologue to dim), and the whole screen is the room.
  // MUTATION-VERIFIED: removing `padding: 0` from `.prologue-overlay` reddens every line here.
  it('⭐⭐ the screen IS the room – 375x667, not 343x635', () => {
    const { wrapper, el, answers } = mountCard(PROLOGUE_CARDS[0], EMPTY_RUN)
    const fit = measureDialog(el, answers, PHONE)
    expect(fit.available.height, 'the overlay is still insetting the prologue').toBe(PHONE.height)
    expect(fit.available.width).toBe(PHONE.width)
    expect(fit.cardWidth, 'the card no longer spans the phone').toBe(PHONE.width)
    wrapper.unmount()
  })

  // ⭐⭐⭐ AND THE PLATE IS GONE. Four declarations of `.dialog-card` say «this is a box sitting on a
  // page»: the panel tone, the hairline, the corners and the top padding. All four come off; the
  // ground is `--bg`, which is what the app paints its own screens.
  // MUTATION-VERIFIED: dropping any one of the four overrides reddens its own line here.
  it('⭐⭐ no backing plate and no frame – the card is painted the page', () => {
    const { wrapper, el } = mountCard(PROLOGUE_CARDS[0], EMPTY_RUN)
    const cs = getComputedStyle(el)
    expect(cs.borderTopWidth, 'the frame is still on the prologue').toBe('0px')
    expect(cs.borderTopLeftRadius, 'the card still has corners').toBe('0px')
    expect(cs.paddingTop, 'the painting is not the top of the screen').toBe('0px')
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
    expect(bg, 'the ground token is not declared – this comparison would be vacuous').not.toBe('')
    expect(cs.backgroundColor, 'the card is still a panel on a page').toBe(bg)
    // ...and the scrim over a page there is nothing behind.
    expect(getComputedStyle(el.parentElement!).paddingTop, 'the prologue is still inset').toBe('0px')
    wrapper.unmount()
  })

  // ⭐ THE PAINTING SPANS THE PHONE AND IS STILL SQUARE, which is the owner's own rule for this whole
  // set («квадратный арт во всю ширину (как на home)») and the one `.diary-hero`, `.nt-hero` and
  // `.prologue-hero` all already declare in the same words.
  // MUTATION-VERIFIED: `aspect-ratio: 16 / 9` on `.prologue-hero` reddens this at every age.
  it('⭐ every painting is square and spans the width of the phone', () => {
    for (const { card, run } of walk(CARRIED_ROAD)) {
      const { wrapper } = mountCard(card, run)
      const cs = getComputedStyle(document.querySelector('.prologue-hero')!)
      expect(cs.aspectRatio, `age ${card.age} is not square`).toBe('1 / 1')
      // The card's remaining 16px side padding, cancelled both ways – so the picture is 375 wide on
      // a 375 phone while the text under it keeps its gutters.
      expect(cs.width, `age ${card.age}'s painting does not span the phone`).toBe('calc(100% + 32px)')
      expect(cs.marginTop, `age ${card.age} still pulls the painting over a top padding`).toBe('0px')
      wrapper.unmount()
    }
  })

  // ⚠⚠ AND THE ROUND-20 #3 GUARANTEE SURVIVED THE CHANGE, WHICH IS THE ONE WAY THIS COULD HAVE
  // STOPPED A CAREER. The height cap and the scroller live on `.dialog-card` and are INHERITED, not
  // restated: the prologue is the first thing a new player ever sees, and a blocking screen whose
  // way out is below the fold is what stopped the owner on `TourBriefingDialog`.
  it('⚠⚠ every scene still hands the player its answers, on a 375x667 phone', () => {
    for (const { card, run } of walk(CARRIED_ROAD)) {
      for (const withAsk of card.tournament ? [false, true] : [false]) {
        const { wrapper, el, answers } = mountCard(card, run, withAsk)
        const fit = assertDismissReachable(el, answers, PHONE, `age ${card.age}${withAsk ? ' + its ask' : ''}`)
        expect(fit.scrollable, `age ${card.age} does not scroll`).toBe(true)
        wrapper.unmount()
      }
    }
  })

  // ⭐⭐ THE NUMBER HE ASKED FOR, MEASURED AND PRINTED. Two things moved and they are different
  // things: the ROOM grew by the overlay's 32px, and the text COLUMN grew by the same 32 (311px of
  // content width to 343), which is what pulls a wrapped paragraph's line count down. The painting
  // grew with the column – a square hero is as tall as the screen is wide – so the honest reading is
  // per scene, and it is what this prints.
  //
  //   MEASURED, 375x667, on `fits.ts` (the model that runs on every commit), before -> after:
  //
  //     room                    635px  ->  667px      +32 on every scene
  //     text column             311px  ->  343px      +32
  //     scroll past the fold, per scene (content floor minus room):
  //       age  5   1423px -> 1382px    -41
  //       age  6      23px ->    0px    -23   fits with no scroll at all now
  //       age  7       0px ->    0px      –   already fitted
  //       age  8     118px ->  118px      0
  //       age  9     164px ->  123px    -41
  //       age 10     143px ->   77px    -66   the screen he called excellent
  //       age 11     123px ->  106px    -17
  //       age 12     214px ->  214px      0
  //       age 13      23px ->    0px    -23   fits with no scroll at all now
  //
  //   THREE OF THE NINE SCENES NOW FIT A PHONE WITH NOTHING BELOW THE FOLD, and none got worse. The
  //   «before» column is this same measurement run on the commit before the change; it is recorded
  //   rather than asserted, and the assertion that holds it is the ceiling two arms down.
  it('⭐⭐ ...and it PRINTS what each scene costs, so the trade is visible rather than claimed', () => {
    const rows: string[] = []
    for (const { card, run } of walk(CARRIED_ROAD)) {
      const { wrapper, el, answers } = mountCard(card, run)
      const fit = measureDialog(el, answers, PHONE)
      const scroll = Math.max(0, fit.contentFloor - fit.available.height)
      rows.push(
        `  age ${String(card.age).padStart(2)}  floor ${fit.contentFloor.toFixed(0).padStart(5)}px` +
          `  room ${fit.available.height.toFixed(0)}px  scroll ${scroll.toFixed(0).padStart(4)}px`,
      )
      wrapper.unmount()
    }
    // eslint-disable-next-line no-console
    console.log(`\n  ROUND 35 #2 – THE PROLOGUE AT 375x667\n${rows.join('\n')}\n`)
    expect(rows).toHaveLength(CARD_AGES.length)
  })

  // ⚠ THE CEILING, RE-AIMED DOWNWARD RATHER THAN LEFT WHERE IT WAS. `prologue-walk.test.ts` caps the
  // age-5 card at 2200 on this model; the frameless column brought it to 2049, and leaving the old
  // number in place would let 150px of new copy arrive without anything objecting. This is the
  // tighter one, on the card the owner met as a form.
  // MUTATION-VERIFIED: putting `.dialog-card`'s 16px padding back on `.prologue-card` reddens it.
  it('⚠ the age-5 card came down, and the new number is the ceiling now', () => {
    const { wrapper, el, answers } = mountCard(PROLOGUE_CARDS[0], EMPTY_RUN)
    const fit = measureDialog(el, answers, PHONE)
    expect(fit.contentFloor, 'the first screen of the game has grown again').toBeLessThanOrEqual(2100)
    wrapper.unmount()
  })
})

// =================================================================================================
// ITEM 4 – one year, one screen
// =================================================================================================

describe('⭐⭐⭐ item 4 – no scene is drawn twice in one childhood', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  /** WHAT A SCREEN IS, for the purpose of «I have seen this one before»: the three things a player
   *  reads first. The painting is in it deliberately – the two-beat version kept the picture and the
   *  title and changed one paragraph, which is exactly why he read it as a repeat. */
  function scene(wrapper: ReturnType<typeof mount>): { head: string; full: string } | null {
    const title = wrapper.find('.prologue-title')
    if (!title.exists()) return null
    const kicker = wrapper.find('.prologue-kicker')
    const art = document.querySelector('.prologue-hero img')
    // THE HEAD is what a player recognises a screen by: the year, the heading and the painting.
    const head = `${kicker.exists() ? kicker.text() : ''} | ${title.text()} | ${art?.getAttribute('src') ?? ''}`
    // THE BODY is what is under it: the scene's own paragraph, the ask's line if there is one, and
    // the answers on offer. ⚠ LABELS ONLY - a taken answer is marked with a class and not with a
    // word, so pressing one does not count as a new screen.
    const lede = wrapper.find('.prologue-lede')
    const askLine = wrapper.find('.prologue-ask')
    const labels = [...document.querySelectorAll('.prologue-answer-label')].map((b) => b.textContent!.trim())
    return {
      head,
      full: `${head} || ${lede.exists() ? lede.text() : ''} || ${askLine.exists() ? askLine.text() : ''} || ${labels.join('/')}`,
    }
  }

  function signature(wrapper: ReturnType<typeof mount>): string {
    return scene(wrapper)?.head ?? ''
  }

  // ⭐⭐⭐ THE ACCEPTANCE, IN HIS OWN TERMS. Walk a whole childhood through the real component and
  // record every scene it draws; no signature may appear twice. The two he named are the two the old
  // code repeated: the twelfth's «She has asked you for more than she is getting.» and the
  // thirteenth's «The junior tour opens at fourteen.»
  //
  // ⚠⚠ MUTATION-VERIFIED AND THIS IS THE CONTROL: restoring the two-beat `answer()` (write the pick,
  // set `beat = 'ask'`, return) makes this red with exactly those two titles listed twice, which is
  // the reproduction of what he saw.
  it('⭐⭐⭐ walking the whole childhood draws no scene twice', async () => {
    stubStore()
    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    // ⚠ WHAT «DRAWN TWICE» MEANS, MEASURED RATHER THAN ASSERTED BY TASTE: one HEAD - the year, the
    // heading and the painting, which is what a player recognises a screen by - may have exactly ONE
    // body under it in a whole childhood. Two bodies under one head IS the defect he reported: the
    // picture and the title stayed, one paragraph and the buttons changed, and he read it as the
    // same screen coming back.
    //
    // ⚠ CARD SCENES ONLY, AND THAT IS NOT A LOOPHOLE. A year can hold two weekends
    // (`LOCAL_POOL.maxPerYear`), and the three result scenes are DELIBERATELY repeatable - cards.ts
    // says so in as many words («one of these three is read up to four times», which is why they are
    // the shortest scenes in the prologue). They also share a head, so they would be indistinguishable
    // from the defect; the thing he reported was a YEAR's own scene drawn twice.
    const bodies = new Map<string, Set<string>>()
    await walkChildhood(wrapper, {
      enter: true,
      onScene: (kind) => {
        if (kind !== 'card') return
        const s = scene(wrapper)
        if (!s) return
        if (!bodies.has(s.head)) bodies.set(s.head, new Set())
        bodies.get(s.head)!.add(s.full)
      },
    })
    const redrawn = [...bodies.entries()].filter(([, seen]) => seen.size > 1).map(([head]) => head)
    expect(redrawn, 'a year`s own scene was drawn twice with a different body under it').toEqual([])
    // ⚠ AND THE WALK IS REAL, so the empty list above means something: nine cards at least, and the
    // twelfth and thirteenth – the two he named – were among them.
    expect(bodies.size).toBeGreaterThanOrEqual(CARD_AGES.length)
    expect([...bodies.keys()].some((h) => h.includes(TWELFTH_WANTS_MORE.title))).toBe(true)
    expect([...bodies.keys()].some((h) => h.includes(PROLOGUE_CARDS.find((c) => c.age === 13)!.title))).toBe(true)
    wrapper.unmount()
  })

  // ⭐⭐ AND THE SAME CLAIM FROM THE OTHER SIDE, per card: answering the year's own question does not
  // produce a new screen – the tournament question was on it all along.
  it('⭐⭐ answering the year does not redraw the scene for the ask', async () => {
    stubStore()
    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    let run = EMPTY_RUN
    let asked = 0
    // ⚠ THE CHEAPEST ROAD AND «Not this year» EVERY TIME, so this childhood buys no weekends at all
    // and every screen it draws is a card. The claim is about one card's two questions; a weekend
    // between two cards would only make the walk harder to read.
    for (const age of CARD_AGES) {
      const row = PROLOGUE_CARDS.find((c) => c.age === age)!
      const card = cardFor(age, run)
      const before = signature(wrapper)
      if (card.origins) {
        await press(wrapper, card.origins[1].label)
        run = withOrigin(run, 'middle')
      } else if (card.options) {
        const option = [...card.options].sort((a, b) => (a.costCents ?? 0) - (b.costCents ?? 0))[0]
        await press(wrapper, option.label)
        run = withPick(run, age, option.id)
      } else if (!row.tournament) {
        await press(wrapper, card.continueLabel)
      }
      // ⚠ `row.tournament` AND NOT A LABEL SCAN: the age-10 card's own «Not this year» is an
      // OPTION that happens to share the ask's words.
      if (row.tournament) {
        asked += 1
        expect(signature(wrapper), `age ${age} redrew its scene for the ask`).toBe(before)
        // ⚠⚠ AND THE CARD'S OWN ANSWERS ARE STILL ON IT, which is the half a heading check cannot
        // see. Under the two-beat version they were REPLACED by the ask's pair - the picture and the
        // title stayed and everything under them changed, which is what he read as a repeat.
        const labels = [...document.querySelectorAll('.prologue-answer-label')].map((b) => b.textContent!.trim())
        for (const option of card.options ?? []) {
          expect(labels, `age ${age} replaced its own answers with the ask's`).toContain(option.label)
        }
        expect(labels).toContain(row.tournament.declineLabel)
        expect(document.querySelector('.prologue-lede')!.textContent!.trim(), `age ${age} replaced its scene`).toBe(card.lede)
        await press(wrapper, 'Not this year')
      }
      expect(wrapper.find('.plo').exists(), `age ${age} bought a weekend on the cheapest road`).toBe(false)
    }
    // ⚠ NON-VACUOUS: the childhood really did meet the question, on the ages the table asks it.
    expect(asked, 'no card asked a tournament question – the arm is empty').toBe(3)
    wrapper.unmount()
  })

  // ⚠⚠ AND THE ASK WAS NOT SILENTLY DROPPED, WHICH IS THE OTHER HALF. It carries a real decision –
  // «Put her name down» against «Not this year» – and the owner has ruled that it comes back each
  // year with somebody else asking. All four askings are on their card, with their own line, beside
  // the card's own answers.
  // MUTATION-VERIFIED: deleting the `<p class="prologue-ask">` reddens the line arm; deleting the
  // ask's two buttons reddens the count.
  it('⚠⚠ all four askings are still asked, on the card, with their own line', () => {
    const rows: PrologueCard[] = [
      PROLOGUE_CARDS.find((c) => c.age === 11)!,
      PROLOGUE_CARDS.find((c) => c.age === 12)!,
      TWELFTH_WANTS_MORE,
      PROLOGUE_CARDS.find((c) => c.age === 13)!,
    ]
    for (const row of rows) {
      const { wrapper, answers } = mountCard(row, EMPTY_RUN, true)
      const ask = row.tournament!
      // its own line, and it is the ASK's rather than the card's lede
      const line = document.querySelector('.prologue-ask')
      expect(line, `age ${row.age} asks with no question on the screen`).toBeTruthy()
      expect(line!.textContent!.trim()).toBe(ask.lede)
      // the card's own scene is still there, unreplaced – the half the two-beat version took away
      expect(document.querySelector('.prologue-lede')!.textContent!.trim()).toBe(row.lede)
      expect(document.querySelector('.prologue-read'), 'the year`s reading went with the beat').toBeTruthy()
      // and both questions' answers are in one column
      const labels = [...answers.querySelectorAll('.prologue-answer-label')].map((b) => b.textContent!.trim())
      expect(labels).toContain(ask.enterLabel)
      expect(labels).toContain(ask.declineLabel)
      for (const option of row.options ?? []) expect(labels).toContain(option.label)
      // ⚠ AND THE THIRTEENTH SYNTHESISES NO «Go on» BESIDE THEM: it has no decision of its own, so
      // the ask's pair IS the way on, and a third control would be a third answer to a two-answer
      // question.
      if (!row.options) expect(labels).toEqual([ask.enterLabel, ask.declineLabel])
      wrapper.unmount()
      document.body.innerHTML = ''
    }
  })

  // ⭐ THE ESCALATION IS INTACT – somebody different asking each year, which is the owner's own
  // design and the reason the ask is a card row rather than one constant.
  it('⭐ the four askings are four different sentences', () => {
    const asks = [
      PROLOGUE_CARDS.find((c) => c.age === 11)!.tournament!.lede,
      PROLOGUE_CARDS.find((c) => c.age === 12)!.tournament!.lede,
      TWELFTH_WANTS_MORE.tournament!.lede,
      PROLOGUE_CARDS.find((c) => c.age === 13)!.tournament!.lede,
    ]
    expect(new Set(asks).size, 'the same question is being asked in the same words').toBe(4)
  })
})

// =================================================================================================
// ITEM 1 – the weekend runs through the game's own flow
// =================================================================================================

describe('⭐⭐⭐ item 1 – the tournament`s own screen, the matches, and the transitions between them', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  /** A seed whose draw she actually wins a match in, so the walk crosses a transition BETWEEN two
   *  matches rather than only the one in front of the first. */
  function seedWithAWin(): string {
    for (let i = 0; i < 60; i++) {
      const kid = prologueEntrant(`r35-${i}`, KID_ID, 'Vera Novak', 10)
      if (playLocalOpen(`r35-${i}`, kid, 10).wins >= 1) return `r35-${i}`
    }
    throw new Error('no seed in 60 gave her a win – the search is broken, and every arm below is vacuous')
  }

  // ⭐⭐⭐ THE ACCEPTANCE, IN HIS OWN ORDER: the tournament's art screen, then the matches with the
  // usual transitions between them.
  // MUTATION-VERIFIED: `beat` initialised to `'match'` reddens the splash arm; `next()` jumping
  // straight back to `'match'` reddens the transition arm.
  it('⭐⭐⭐ art screen -> transition -> match -> transition -> match -> the weekend ends', async () => {
    const seed = seedWithAWin()
    const kid = prologueEntrant(seed, KID_ID, 'Vera Novak', 10)
    const open = playLocalOpen(seed, kid, 10)
    expect(open.wins, 'the seed search returned a first-round exit').toBeGreaterThanOrEqual(1)
    const wrapper = mount(PrologueLocalOpen, { attachTo: document.body, props: { open, kid, seed } })

    // 1. THE TOURNAMENT'S OWN SCREEN, and it is a painting rather than a court.
    expect(wrapper.find('.plo-splash').exists(), 'the weekend went straight to a match').toBe(true)
    expect(wrapper.find('canvas').exists(), 'a court is on the first screen').toBe(false)
    expect(document.querySelector('.plo-hero-img')!.getAttribute('src')).toBe(
      venueArtUrl(open.event.tier, open.event.surface, open.event.id, seed),
    )
    expect(wrapper.text(), 'the draw`s own size is not on its own screen').toContain(localDrawLine(2 ** open.rounds))
    await press(wrapper, LOCAL_OPEN_COPY.begin)

    // 2. ...then a transition in front of EVERY match, and the match in the shipped viewer.
    let matches = 0
    for (let guard = 0; guard < 8 && !wrapper.emitted('done'); guard++) {
      expect(wrapper.find('.plo-round').exists(), `round ${matches} has no transition in front of it`).toBe(true)
      expect(wrapper.find('canvas').exists(), `round ${matches}: a court on the transition`).toBe(false)
      // the girl on the other side of the net is named on it, which is how we know it is that round
      const record = open.result.matches.filter((m) => m.aId === kid.id || m.bId === kid.id).sort((a, b) => a.round - b.round)[matches]
      const oppId = record.aId === kid.id ? record.bId : record.aId
      expect(wrapper.text()).toContain(open.field.find((p) => p.id === oppId)!.name)
      await press(wrapper, LOCAL_OPEN_COPY.watchMatch)
      expect(wrapper.find('canvas').exists(), `round ${matches} is not the real viewer`).toBe(true)
      matches += 1
      await press(wrapper, 'Skip to the result')
      await press(wrapper, LOCAL_OPEN_COPY.proceed)
    }
    // 3. ...and the weekend ends where it always did, on the result scene the prologue's own cards
    //    draw – «И с результатами в конце … А потом уже продолжаем наши прологовые карточки».
    expect(matches, 'she played fewer matches than the bracket gave her').toBe(open.wins + 1)
    expect(wrapper.emitted('done')?.length, 'the last match did not end the weekend').toBe(1)
    wrapper.unmount()
  })

  // ⭐⭐⭐ AND THE WHOLE CHAIN THROUGH THE CONTAINER, which is the beat the arm above cannot reach:
  // «И с результатами в конце … А потом уже продолжаем наши прологовые карточки». One year of the
  // real walk – the card that sells the weekend, the tournament's own screen, the transition, the
  // match, the RESULT scene on the owner's own three faces, and then the next card.
  // MUTATION-VERIFIED: `closeOpen()` emitting straight past the result reddens the result step.
  it('⭐⭐⭐ card -> art screen -> transition -> match -> result -> the prologue`s cards continue', async () => {
    stubStore()
    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    let run = EMPTY_RUN
    // walk to the tenth, which is the card that sells the first weekend
    for (const age of [5, 6, 7, 8, 9]) {
      const card = cardFor(age, run)
      if (card.origins) {
        await press(wrapper, card.origins[1].label)
        run = withOrigin(run, 'middle')
      } else if (card.options) {
        const option = card.options.find((o) => o.id === CARRIED_ROAD[age])!
        await press(wrapper, option.label)
        run = withPick(run, age, option.id)
      } else {
        await press(wrapper, card.continueLabel)
      }
    }
    const tenth = PROLOGUE_CARDS.find((c) => c.age === 10)!
    expect(wrapper.find('.prologue-title').text()).toBe(tenth.title)
    expect(wrapper.find('.plo').exists(), 'the weekend arrived before the card that sells it').toBe(false)

    // 1. «Enter her» opens the TOURNAMENT'S OWN SCREEN, not a court.
    await press(wrapper, 'Enter her')
    expect(wrapper.find('.plo-splash').exists(), 'entering her did not open the tournament`s own screen').toBe(true)
    expect(wrapper.find('canvas').exists()).toBe(false)
    expect(document.querySelector('.plo-hero-img'), 'the tournament`s screen has no painting').toBeTruthy()

    // 2. ...then the transition, then the match, for every match she played.
    for (let guard = 0; guard < 8 && wrapper.find('.plo').exists(); guard++) {
      await press(wrapper, guard === 0 ? LOCAL_OPEN_COPY.begin : LOCAL_OPEN_COPY.watchMatch)
      if (guard === 0) {
        expect(wrapper.find('.plo-round').exists(), 'no transition in front of the first match').toBe(true)
        await press(wrapper, LOCAL_OPEN_COPY.watchMatch)
      }
      expect(wrapper.find('canvas').exists(), 'the transition did not lead to the viewer').toBe(true)
      await press(wrapper, 'Skip to the result')
      await press(wrapper, LOCAL_OPEN_COPY.proceed)
    }

    // 3. THE RESULT, on one of the owner's own three faces – and it is a prologue card, which is
    //    where «а потом уже продолжаем наши прологовые карточки» starts.
    const result = [LOCAL_OPEN_COPY.result.won, LOCAL_OPEN_COPY.result.final, LOCAL_OPEN_COPY.result.lost]
      .find((r) => wrapper.text().includes(r.title))
    expect(result, `no result scene after the weekend: ${wrapper.text().slice(0, 140)}`).toBeTruthy()
    expect(wrapper.find('.prologue-card').exists(), 'the result is not drawn as a prologue card').toBe(true)

    // 4. ...and the cards continue: the eleventh is next.
    await press(wrapper, LOCAL_OPEN_COPY.proceed)
    expect(wrapper.find('.prologue-title').text(), 'the walk did not go on to the next card').toBe(
      PROLOGUE_CARDS.find((c) => c.age === 11)!.title,
    )
    wrapper.unmount()
  })

  // ⚠ AND THE WAY OUT IS ON EVERY BEAT, which is round-20 #3 on a takeover: the weekend is up to
  // three matches on a blocking screen, and a player who cannot leave it is the shape that stopped
  // the owner's career once already.
  it('⚠ the weekend`s escape is above the fold on the splash and on the transition too', async () => {
    const seed = seedWithAWin()
    const kid = prologueEntrant(seed, KID_ID, 'Vera Novak', 10)
    const open = playLocalOpen(seed, kid, 10)
    const wrapper = mount(PrologueLocalOpen, { attachTo: document.body, props: { open, kid, seed } })
    const shell = document.querySelector('.plo')!

    for (const beat of ['splash', 'round'] as const) {
      if (beat === 'round') await press(wrapper, LOCAL_OPEN_COPY.begin)
      expect(wrapper.find(`.plo-${beat}`).exists(), `the ${beat} beat is not up`).toBe(true)
      expect(shell.children[0].classList.contains('plo-head'), 'the way out is below the fold').toBe(true)
      const head = boxOf(document.querySelector('.plo-head')!, PHONE.width - 24)
      const body = boxOf(document.querySelector(`.plo-${beat}`)!, PHONE.width - 24)
      expect(head.h, `the ${beat} beat's header has no box`).toBeGreaterThan(0)
      expect(document.querySelector('.plo-go'), `the ${beat} beat has no way on`).toBeTruthy()
      expect(head.h + body.h, `the ${beat} beat is taller than a ${PHONE.height}px phone`).toBeLessThanOrEqual(PHONE.height)
    }
    expect(getComputedStyle(shell).overflowY, 'the weekend does not scroll').toBe('auto')
    wrapper.unmount()
  })

  // ⭐ THE SPLASH IS BUILT TO ITEM 5'S STANDARD – the square painting first, plain facts under it,
  // the choice last. The same three properties the age-10 card has, asserted the same way.
  it('⭐ the tournament`s own screen is the age-10 card`s shape: square art, facts, then the way on', () => {
    const kid = prologueEntrant('r35-shape', KID_ID, 'Vera Novak', 10)
    const open = playLocalOpen('r35-shape', kid, 10)
    const wrapper = mount(PrologueLocalOpen, { attachTo: document.body, props: { open, kid, seed: 'r35-shape' } })
    const splash = document.querySelector('.plo-splash')!
    expect(getComputedStyle(document.querySelector('.plo-hero')!).aspectRatio, 'the venue is not square').toBe('1 / 1')
    // ⚠ NOTHING IS WRITTEN OVER THE PAINTING: `tests/component/contrast.ts` cannot see a photograph,
    // so a caption on the art is a caption the AA gate goes blind to.
    expect(document.querySelector('.plo-hero')!.textContent!.trim(), 'there is copy on the painting').toBe('')
    // the picture first, the way on last
    expect(splash.children[0].classList.contains('plo-hero')).toBe(true)
    expect(splash.children[splash.children.length - 1].classList.contains('plo-go')).toBe(true)
    wrapper.unmount()
  })

  // ⚠⚠ AND NO POINTS, NO CHEQUE AND NO RANKING REACHED THE SCREEN, which is why `TournamentFlow`
  // could not simply be mounted here. pool.ts's fourth guard is «NO POINTS ARE EVER COMPUTED» and
  // the prologue's weekends are thrown away at the handover; the main splash prints
  // `TIERS[tier].points[0]` as «N pts», the winner's cheque and both players' ranks.
  // MUTATION-VERIFIED: printing `TIERS[LOCAL_POOL.tier].points[0]` on the splash reddens this.
  it('⚠⚠ the weekend`s own screen quotes no points, no prize and no rank', () => {
    const kid = prologueEntrant('r35-clean', KID_ID, 'Vera Novak', 10)
    const open = playLocalOpen('r35-clean', kid, 10)
    const wrapper = mount(PrologueLocalOpen, { attachTo: document.body, props: { open, kid, seed: 'r35-clean' } })
    const text = wrapper.text()
    for (const forbidden of [/\bpts\b/, /\bpoints\b/i, /\$/, /\bUnranked\b/, /#\d/, /\branking\b/i]) {
      expect(forbidden.test(text), `the weekend's own screen says ${forbidden}: ${text}`).toBe(false)
    }
    // ...and the one number it DOES carry is the draw's own size, read off the bracket that played.
    expect(text).toContain(String(2 ** open.rounds))
    expect(2 ** open.rounds, 'the draw stopped being the local rung`s own').toBe(LOCAL_POOL.size)
    wrapper.unmount()
  })
})

// =================================================================================================
// ITEM 7 – the last frame, and the age
// =================================================================================================

describe('⭐⭐⭐ item 7 – what stands between the trophy and the handover, and how old she is on it', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  // ⭐⭐⭐ THE REPRODUCTION, AND IT IS THE FIRST TWO THIRDS OF HIS REPORT. He saw three things – the
  // trophy art, «еще какой-то экран (я не успел прочесть что там)», and the handover – and the middle
  // one was the THIRTEENTH CARD, re-drawn for the length of the `newCareer` round-trip because
  // nothing else claimed the screen while it ran.
  //
  // ⚠⚠ MUTATION-VERIFIED, AND THIS IS THE CONTROL: dropping `creating` from `begin()` makes this red
  // and names the screen – «The junior tour opens at fourteen.» – the card he had already read once,
  // which is also half of what he filed as item 4.
  it('⭐⭐⭐ nothing readable stands between the last result and the handover', async () => {
    // ⚠⚠ THE CAREER CREATION IS HELD OPEN, AND THAT IS THE WHOLE REPRODUCTION. `newCareer` is a
    // WORKER ROUND-TRIP; a stub that resolves on the next microtask cannot show what is on the
    // screen while it runs, and the first draft of this test passed against the defect for exactly
    // that reason. This one stops the promise where the worker would be and looks.
    const game = useGameStore()
    let release!: () => void
    const held = new Promise<void>((resolve) => { release = resolve })
    game.newCareer = vi.fn(async (_seed: string, profile: PlayerProfile = DEFAULT_PROFILE, prologue?: PrologueHandover) => {
      await held
      game.snapshot = toSnapshot(createWorld('r35', profile, 'c', prologue))
    })
    game.deleteCareer = vi.fn(async () => { game.snapshot = null })

    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    let lastResultWasFinal = false
    await walkChildhood(wrapper, {
      enter: true,
      onScene: (kind, last) => {
        if (kind === 'result' && last) lastResultWasFinal = true
      },
    })
    // ⚠ NON-VACUOUS: the childhood really did end on a weekend's result scene – the trophy art he
    // describes – rather than on a quiet card, so «what comes next» is the screen he is asking about.
    expect(lastResultWasFinal, 'the last year held no weekend – this walk does not reproduce his sequence').toBe(true)

    // THE GAP IS ON SCREEN. He read it as «еще какой-то экран», and it was the thirteenth card.
    await wrapper.vm.$nextTick()
    expect(game.newCareer, 'the walk never asked for a career – the gap is not being measured').toHaveBeenCalled()
    expect(document.querySelector('.handover-card'), 'the handover arrived before the career did').toBeNull()
    expect(
      document.querySelector('.prologue-card'),
      `a card stands between the trophy and the handover: ${document.querySelector('.prologue-title')?.textContent ?? ''}`,
    ).toBeNull()

    // ...and when the worker answers, the handover is what arrives.
    release()
    await Promise.resolve()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(document.querySelector('.handover-card'), 'the walk never reached the handover').toBeTruthy()
    expect(document.querySelector('.prologue-card'), 'a card is still under the handover').toBeNull()
    wrapper.unmount()
  })

  // ⭐⭐⭐ THE AGE, AND HIS DOUBT WAS RIGHT. `DEFAULT_PROFILE` is born on 15 JUNE – his own «ДР у нее
  // в июне» – and the career opens in the January of `weekYear(0)`, so `kidAgeYears(0, 6, 15)` is
  // THIRTEEN. The screen said «She is fourteen» because the string was written down.
  //
  // ⚠⚠ MUTATION-VERIFIED: putting the literal back on the binding makes this red on eleven of the
  // twelve birth months.
  it('⭐⭐⭐ the handover names the age the WORLD says – swept over all 365 birth dates', () => {
    // ⚠ THE SNAPSHOT'S FIELD IS THE CLOCK, PROVED ONCE ON A REAL WORLD – on HIS OWN default profile,
    // which is the girl he played. Everything after it is the clock's own arithmetic, so the sweep
    // costs no world-building.
    const his = toSnapshot(createWorld('r35-age', DEFAULT_PROFILE, 'c'))
    expect(his.profile.birthMonth, 'the default profile stopped being a June girl').toBe(6)
    expect(his.ageYears, 'Snapshot.ageYears is not kidAgeYears – the field is not the clock').toBe(
      kidAgeYears(his.week, his.profile.birthMonth, his.profile.birthDay),
    )
    expect(his.ageYears, 'his own girl is fourteen after all').toBe(13)

    const wrong: string[] = []
    let fourteen = 0
    let thirteen = 0
    for (let month = 1; month <= 12; month++) {
      for (let day = 1; day <= daysInBirthMonth(month); day++) {
        const age = kidAgeYears(his.week, month, day)
        if (age === 14) fourteen += 1
        else thirteen += 1
        // The caption is spelled from the clock and from nothing else, in the game's own words for
        // an age (`ageInWords`, which the birthday feed line and the birthday dialog already read).
        expect(handoverKicker(ageInWords(age))).toBe(`She is ${age === 14 ? 'fourteen' : 'thirteen'}`)
        expect(handoverRoseTitle(ageInWords(age))).toContain(age === 14 ? 'fourteen' : 'thirteen')
        // ⭐ AND THE OLD LITERAL, MEASURED. «She is fourteen» is the sentence the screen used to
        // print for every one of these girls, whatever the world said about her.
        if (age !== 14) wrong.push(`${month}/${day}`)
      }
    }
    // ⚠⚠ THE SIZE OF THE DEFECT, AND IT IS THE ARM'S OWN NON-VACUITY. Career week 0 opens on MONDAY
    // 6 JANUARY 2031, so only a girl born 1-6 January has had her fourteenth birthday by the time
    // the handover is drawn – six dates. «She is fourteen» was the wrong sentence for the other 359,
    // which is 98% of them and includes his own default profile.
    expect(fourteen, 'every date reads fourteen – the clock is not being read').toBe(6)
    expect(thirteen).toBe(359)
    expect(wrong).toContain('6/15')
    // eslint-disable-next-line no-console
    console.log(
      `\n  ROUND 35 #7 – HER AGE AT THE HANDOVER, ALL 365 BIRTH DATES:\n` +
        `    fourteen ${fourteen} (1-6 January only)   thirteen ${thirteen}\n` +
        `    the old caption said «fourteen» to all 365, so it was wrong for ${wrong.length}\n`,
    )
  })

  // ⚠ AND THE SCREEN BINDS THE COMPUTED ONE, not the table's literal. An age spelled off a clock in
  // a module is still a caption if the template ignores it.
  it('⚠ the rendered handover carries the computed age, through the real walk', async () => {
    const game = stubStore()
    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    await walkChildhood(wrapper, { enter: false, rich: false })
    const kicker = document.querySelector('.handover-kicker')
    expect(kicker, 'the walk never reached the handover').toBeTruthy()
    expect(kicker!.textContent!.trim()).toBe(handoverKicker(ageInWords(game.snapshot!.ageYears)))
    expect(document.querySelector('.radar-svg')!.getAttribute('aria-label')).toBe(
      handoverRoseTitle(ageInWords(game.snapshot!.ageYears)),
    )
    // ⚠ NON-VACUOUS, AND IT IS THE OWNER'S OWN CASE: the identity card opens on `DEFAULT_PROFILE`'s
    // 15 June, this walk never touches it, so the girl on this screen is the girl he played.
    expect(game.snapshot!.profile.birthMonth).toBe(6)
    expect(kicker!.textContent!.trim()).toBe('She is thirteen')
    wrapper.unmount()
  })
})
