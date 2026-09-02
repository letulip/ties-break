// ⭐⭐⭐ THE TOURNAMENTS ARE IN THE WALK – phase 11, mounted, on a 375x667 phone.
//
// HIS RULING: «мы договаривались, что турниры в прологе тоже будут, сейчас этого нет, надо с 10 лет
// по 1 хотя бы добавить в год, как в колледже.» And, earlier, on the age-10 card: «И как раз после
// этого экрана хотелось бы реально увидеть турнир, если игрок выбрал "участвовать", а не просто
// пролистать. В конце турнира либо победный арт, либо serious если в финал выбралась, либо грустный,
// если до финала не дошла.»
//
// WHAT THIS FILE PROVES, and every one of them is the acceptance in the owner's own terms:
//   1. Entering at ten puts a REAL draw on the screen, in the shipped `MatchViewer`, against a child
//      the prologue invented – and it is the whole walk that does it, not a hand-built mount.
//   2. She plays at least one a year at 10, 11, 12 and 13 when the player entered, and NONE when he
//      did not. The counts are printed.
//   3. The result reaches the picture: won -> the winning face, a final -> `serious`, out before it
//      -> `sad`.
//   4. The way out of a weekend is reachable on a 375x667 phone (round-20 #3), and it is above the
//      court rather than below it.
//
// ⚠⚠ MUTATION-VERIFIED. Watched failing before it was believed:
//   * `localOpensIn` returning 0 for a year whose own focus is not matchplay (i.e. phase 3's
//     reading, restored) -> the per-year counts go red naming ages 11, 12 and 13.
//   * the `outcome` prop dropped from `PrologueCard`'s `artUrl` -> the picture test goes red, and
//     the card draws the owner's pinned `norm` over a won draw sheet.
//   * `.plo-head` moved BELOW the `<MatchViewer>` in the template -> the fit test goes red, because
//     the way out is then 420px of court below the top of the screen.
//   * `outcomeOf`'s `final` arm deleted (so a lost final reads as `lost`) -> the three-faces test
//     goes red.
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import { assertDismissReachable, boxOf, setViewport, PHONE } from './fits'
import ChildhoodPrologue from '../../src/components/ChildhoodPrologue.vue'
import PrologueLocalOpen from '../../src/components/PrologueLocalOpen.vue'
import PrologueCardView from '../../src/components/PrologueCard.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot, KID_ID } from '../../src/engine/world'
import {
  CARD_AGES,
  LOCAL_OPEN_COPY,
  PROLOGUE_CARDS,
  TOURNAMENT_ANSWER,
  TWELFTH_WANTS_MORE,
  localOpenCard,
  type PrologueCard,
  type PrologueOption,
} from '../../src/prologue/cards'
import {
  EMPTY_RUN,
  cardFor,
  chosenYears,
  enteredAges,
  moodAt,
  withEntry,
  withOrigin,
  withPick,
  yearsLivedBy,
  type PrologueRun,
} from '../../src/prologue/run'
import { OPENING_IDENTITY } from '../../src/prologue/identity'
import { prologueArtStem } from '../../src/art/prologue'
import {
  LOCAL_POOL,
  herMatches,
  localOpensAt,
  outcomeOf,
  playLocalOpen,
  prologueEntrant,
  prologueSchedule,
} from '../../src/prologue/pool'
import { SKILL_KEYS } from '../../src/engine/development'
import type { MatchPlayer } from '../../src/engine/match/types'
import {
  DEFAULT_PROFILE,
  type FamilyBackground,
  type PlayerProfile,
  type PrologueHandover,
} from '../../src/shared/protocol'

/** The road that enters her and then buys her everything – the busiest childhood the table holds. */
const CARRIED: Record<number, string> = {
  8: 'club', 9: 'one-to-one', 10: 'enter', 11: 'sports-school', 12: 'give-her-the-year',
}
/** The same road with the tenth answered the other way. ⚠ SINCE THE OWNER'S CORRECTION THIS IS NOT
 *  «she never becomes a competitor» – the question comes back at 11, 12 and 13, and the walk below
 *  answers those with «Not this year» too. Saying no every year is what produces no tennis. */
const STAYED_HOME: Record<number, string> = { ...CARRIED, 10: 'stay-home' }

function stubStore() {
  const game = useGameStore()
  game.newCareer = vi.fn(async (_seed: string, profile: PlayerProfile = DEFAULT_PROFILE, prologue?: PrologueHandover) => {
    game.snapshot = toSnapshot(createWorld('p11', profile, 'c', prologue))
  })
  game.deleteCareer = vi.fn(async () => {
    game.snapshot = null
  })
  return game
}

async function click(el: ReturnType<typeof mount>, selector: string, label?: string): Promise<void> {
  const button = label
    ? el.findAll(selector).find((b) => b.text().startsWith(label))
    : el.findAll(selector)[0]
  expect(button, `no «${label ?? selector}»: ${el.text().slice(0, 140)}`).toBeTruthy()
  await button!.trigger('click')
  await Promise.resolve()
  await el.vm.$nextTick()
}

/** ⭐ ONE WHOLE CHILDHOOD, WALKED THROUGH THE REAL COMPONENT, counting the weekends it put on the
 *  screen. The player here SKIPS every match – that is the arm the ten-minute budget rests on – but
 *  the weekend is real either way: the bracket is resolved before the screen opens. */
async function walkCounting(
  road: Record<number, string>,
  enter: boolean,
  onWeekend?: (wrapper: ReturnType<typeof mount>) => void,
): Promise<{ wrapper: ReturnType<typeof mount>; perYear: Record<number, number>; asks: string[] }> {
  const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
  const perYear: Record<number, number> = {}
  const asks: string[] = []
  for (const age of CARD_AGES) {
    const card = PROLOGUE_CARDS.find((c) => c.age === age)!
    if (card.origins) await click(wrapper, '.prologue-answer', card.origins[1].label)
    else if (age === 12) {
      const labels = wrapper.findAll('.prologue-answer-label').map((b) => b.text())
      await click(wrapper, '.prologue-answer', labels[1])
    } else if (card.options) {
      await click(wrapper, '.prologue-answer', card.options.find((o) => o.id === road[age])!.label)
    } else {
      await click(wrapper, '.prologue-answer', card.continueLabel)
    }
    // ⭐ THIS YEAR'S TOURNAMENT QUESTION, IF THE CARD ASKED ONE – the second beat on the same card.
    const lede = wrapper.find('.prologue-lede')
    const enterLabel = wrapper
      .findAll('.prologue-answer-label')
      .find((b) => b.text() === 'Put her name down')
    if (enterLabel) {
      asks.push(`${age}: ${lede.exists() ? lede.text() : ''}`)
      await click(wrapper, '.prologue-answer', enter ? 'Put her name down' : 'Not this year')
    }
    // ...and then whatever tennis the year held.
    for (let guard = 0; guard < 10; guard++) {
      if (wrapper.find('.plo-skip').exists()) {
        perYear[age] = (perYear[age] ?? 0) + 1
        onWeekend?.(wrapper)
        await click(wrapper, '.plo-skip')
        continue
      }
      if (wrapper.text().includes(LOCAL_OPEN_COPY.kicker)) {
        await click(wrapper, '.prologue-answer', LOCAL_OPEN_COPY.result.won.continueLabel)
        continue
      }
      break
    }
  }
  return { wrapper, perYear, asks }
}

describe('⭐⭐⭐ entering her at ten puts a real draw on the screen', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  it('⭐⭐ the age-10 card is followed by the tournament, with the shipped viewer on it', async () => {
    stubStore()
    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    for (const age of [5, 6, 7, 8, 9]) {
      const card = PROLOGUE_CARDS.find((c) => c.age === age)!
      if (card.origins) await click(wrapper, '.prologue-answer', card.origins[1].label)
      else if (card.options) await click(wrapper, '.prologue-answer', card.options.find((o) => o.id === CARRIED[age])!.label)
      else await click(wrapper, '.prologue-answer', card.continueLabel)
    }
    // The tenth card is up and there is no tournament yet – «турнир ещё не состоялся».
    expect(wrapper.find('.plo').exists(), 'the weekend arrived before the card that sells it').toBe(false)
    expect(wrapper.find('.prologue-title').text()).toBe(PROLOGUE_CARDS.find((c) => c.age === 10)!.title)

    await click(wrapper, '.prologue-answer', 'Enter her')

    // ...and now it is a real match, in the real viewer, against a child the prologue invented.
    expect(wrapper.find('.plo').exists(), 'entering her did not produce a weekend').toBe(true)
    expect(wrapper.find('canvas').exists(), 'no court – this is not the real viewer').toBe(true)
    expect(wrapper.text()).toContain('Not started')
    expect(wrapper.findAll('.mv-skip').length, 'the viewer`s own per-match escape').toBe(1)
    wrapper.unmount()
  })

  it('⚠ ...and saying no every year produces none, on the tenth or on any card after it', async () => {
    stubStore()
    const { wrapper, perYear } = await walkCounting(STAYED_HOME, false)
    expect(perYear).toEqual({})
    wrapper.unmount()
  })

  // ⭐⭐⭐ THE OWNER'S OWN CORRECTION, MOUNTED: «Сказали "не в этом году" – значит не в этом году,
  // дальше тоже можно спрашивать.» A refusal at ten closes ten and nothing else.
  it('⭐⭐ saying «Not this year» at ten does not stop the question coming back', async () => {
    stubStore()
    const { wrapper, perYear, asks } = await walkCounting(STAYED_HOME, true)
    console.log(`\n  THE ASKING, YEAR BY YEAR (after a refusal at ten)\n  ${asks.join('\n  ')}\n`)
    // She played nothing at ten and something in every year after it.
    expect(perYear[10] ?? 0).toBe(0)
    for (const age of [11, 12, 13]) expect(perYear[age] ?? 0, `age ${age}`).toBe(1)
    // ...and the question was asked in each of those three years, in three different sentences.
    expect(asks).toHaveLength(3)
    expect(new Set(asks.map((a) => a.split(': ')[1])).size).toBe(3)
    wrapper.unmount()
  })
})

describe('⭐⭐⭐ at least one a year from ten – his rhythm, on the real walk', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  it('⭐⭐ 10, 11, 12 and 13 each hold a weekend when the player said yes, and none when he said no', async () => {
    stubStore()
    const entered = await walkCounting(CARRIED, true)
    entered.wrapper.unmount()
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    stubStore()
    const home = await walkCounting(STAYED_HOME, false)
    home.wrapper.unmount()

    const row = (per: Record<number, number>) => [10, 11, 12, 13].map((a) => per[a] ?? 0)
    console.log(
      `\n  WEEKENDS THE MOUNTED WALK PUT ON THE SCREEN (ages 10, 11, 12, 13)\n` +
        `  yes every year: ${row(entered.perYear).join(', ')}  (${Object.values(entered.perYear).reduce((a, b) => a + b, 0)} in all)\n` +
        `  no every year:  ${row(home.perYear).join(', ')}\n` +
        `  the asking:\n    ${entered.asks.join('\n    ')}\n`,
    )

    for (const age of [10, 11, 12, 13]) {
      expect(entered.perYear[age] ?? 0, `age ${age} held no tournament`).toBeGreaterThanOrEqual(1)
    }
    expect(Object.keys(entered.perYear).map(Number).filter((a) => a < 10)).toEqual([])
    expect(home.perYear).toEqual({})
  })

  it('⚠ and the screen and the schedule agree – the walk plays exactly what `prologueSchedule` says', async () => {
    stubStore()
    const { wrapper, perYear } = await walkCounting(CARRIED, true)
    wrapper.unmount()
    // The same road, computed off the table alone. A screen that played its own idea of the rhythm
    // would differ here and nowhere else.
    let run = withOrigin(EMPTY_RUN, 'middle')
    for (const card of PROLOGUE_CARDS) if (card.options) run = withPick(run, card.age, CARRIED[card.age])
    for (const age of [11, 12, 13]) run = withEntry(run, age, TOURNAMENT_ANSWER.enter)
    const scheduled = prologueSchedule(chosenYears(run), enteredAges(run))
    for (const age of [10, 11, 12, 13]) {
      expect(perYear[age] ?? 0, `age ${age}`).toBe(scheduled.filter((o) => o.age === age).length)
    }
    expect(scheduled.length).toBeGreaterThan(0)
  })
})

describe('⭐⭐ the result reaches the picture – the owner`s three faces', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  // ⭐ MOUNTED, because the claim is about what the card DRAWS and a source pin proves nothing about
  // that. The three scenes are built exactly as the container builds them.
  it('⭐⭐ won -> the winning face, a final -> serious, out before it -> sad', async () => {
    const want: Record<string, string> = { won: 'happy', final: 'serious', lost: 'sad' }
    for (const outcome of ['won', 'final', 'lost'] as const) {
      const wrapper = mount(PrologueCardView, {
        attachTo: document.body,
        props: {
          card: localOpenCard(10, outcome),
          warmth: 'cool' as const,
          mood: moodAt(10, EMPTY_RUN),
          outcome,
          identity: { ...OPENING_IDENTITY },
        },
      })
      const src = wrapper.find('.prologue-hero-img').attributes('src') ?? ''
      expect(src, `${outcome} -> ${src}`).toContain(want[outcome])
      // ...and the scene says what happened, in the table's own words.
      expect(wrapper.text()).toContain(LOCAL_OPEN_COPY.result[outcome].title)
      // ⚠ THE ANTI-VACUITY HALF: the derivation alone would have drawn the owner's pinned frame, so
      // the assertion above is really about the `outcome` argument and not about `moodAt`.
      expect(prologueArtStem(10, moodAt(10, EMPTY_RUN))).toBe('jun-norm')
      wrapper.unmount()
      document.body.innerHTML = ''
    }
  })

  it('⭐ and the run remembers it – the handover can say she played, and how it went', async () => {
    stubStore()
    const { wrapper } = await walkCounting(CARRIED, true)
    // The handover is up, and its line is there because the weekends are in the run.
    expect(wrapper.find('.handover-card').exists()).toBe(true)
    const played = wrapper.find('.handover-played')
    expect(played.exists(), 'the handover says nothing about the tournaments she played').toBe(true)
    expect(played.text().length).toBeGreaterThan(10)
    wrapper.unmount()

    // ...and the mutation arm: a childhood that entered none says nothing at all.
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    stubStore()
    const home = await walkCounting(STAYED_HOME, false)
    expect(home.wrapper.find('.handover-card').exists()).toBe(true)
    expect(home.wrapper.find('.handover-played').exists(), 'a line about weekends she never played').toBe(false)
    home.wrapper.unmount()
  })
})

describe('⚠⚠ round-20 #3 – the way out of a weekend is on a 375x667 phone', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  /** The top of `el` inside its scroll container, by stacking everything above it – the same model
   *  `measureDialog` uses, and the reason this is not `getBoundingClientRect` is that happy-dom
   *  lays nothing out. */
  function topWithin(container: Element, el: Element): number {
    const cs = getComputedStyle(container)
    let y = parseFloat(cs.paddingTop || '0') || 0
    for (const child of Array.from(container.children)) {
      if (child === el || child.contains(el)) return y
      const box = boxOf(child, container.clientWidth || PHONE.width)
      y += box.h + box.marginTop + box.marginBottom
    }
    return y
  }

  it('⭐⭐ the weekend`s own escape is above the court, not below it', () => {
    const kid = prologueEntrant('fit', KID_ID, 'Vera Novak', 10)
    const open = playLocalOpen('fit', kid, 10)
    const wrapper = mount(PrologueLocalOpen, { attachTo: document.body, props: { open, kid } })
    const shell = document.querySelector('.plo')!
    const skip = document.querySelector('.plo-skip')!
    expect(shell && skip).toBeTruthy()

    const top = topWithin(shell, document.querySelector('.plo-head')!)
    const head = boxOf(document.querySelector('.plo-head')!, PHONE.width - 24)
    const bottom = top + head.h
    console.log(`\n  THE WEEKEND'S ESCAPE AT 375x667: y ${top.toFixed(0)}..${bottom.toFixed(0)}\n`)
    expect(
      bottom,
      `the way out of the weekend sits at y=${bottom.toFixed(0)} on a ${PHONE.height}px screen`,
    ).toBeLessThanOrEqual(PHONE.height)
    // ⚠ AND IT IS THE FIRST THING IN THE COLUMN, which is what makes the number above independent of
    // how tall the court is. MUTATION: move `.plo-head` after the viewer -> this goes red.
    expect(shell.children[0].classList.contains('plo-head')).toBe(true)
    // ...and the shell scrolls, so nothing below the court is unreachable either.
    expect(getComputedStyle(shell).overflowY).toBe('auto')

    // ⚠⚠ AND IT DOES NOT SIT UNDER THE MUTE ICON. `MuteButton` is declared ONCE, in
    // `ChildhoodPrologue.vue`, and is `position: fixed` at the top right with z-index 61 – above
    // this takeover. On a card it lands over the painting and costs nothing; here the header IS the
    // top of the screen. MUTATION: drop the header's right padding -> this goes red, and on a 375px
    // phone the escape is under a 40px circle.
    const MUTE_BOX = 40
    const pad = parseFloat(getComputedStyle(document.querySelector('.plo-head')!).paddingRight || '0')
    expect(pad, 'the weekend`s escape shares the top-right corner with the mute icon').toBeGreaterThanOrEqual(MUTE_BOX)
    wrapper.unmount()
  })

  // ⭐⭐ THE ASK BEAT IS A CARD AND IS MEASURED LIKE ONE. It is a scene the player meets in three of
  // the nine years and the round-20 #3 rule binds it exactly as it binds the nine – a card whose two
  // answers fall off a 375x667 phone stops a career before it starts.
  it('⭐⭐ every year`s tournament question fits, with its two answers inside the screen', () => {
    for (const [name, row] of [
      ['11', PROLOGUE_CARDS.find((c) => c.age === 11)!],
      ['12 tired', PROLOGUE_CARDS.find((c) => c.age === 12)!],
      ['12 wants more', TWELFTH_WANTS_MORE],
      ['13', PROLOGUE_CARDS.find((c) => c.age === 13)!],
    ] as const) {
      setViewport(PHONE)
      const wrapper = mount(PrologueCardView, {
        attachTo: document.body,
        props: {
          card: row,
          warmth: 'cool' as const,
          mood: moodAt(row.age, EMPTY_RUN),
          ask: row.tournament,
          identity: { ...OPENING_IDENTITY },
        },
      })
      const card = document.querySelector('.prologue-card')!
      const answers = document.querySelector('.prologue-answers')!
      // Two answers, and they are the ask's – not the card's own.
      expect(answers.querySelectorAll('button')).toHaveLength(2)
      expect(wrapper.text()).toContain(row.tournament!.lede)
      expect(wrapper.text()).toContain(row.tournament!.enterLabel)
      // ⚠ AND THE TWO READ LINES ARE NOT ON THIS BEAT, which is what keeps it shorter than the card.
      expect(document.querySelector('.prologue-read')).toBeNull()
      assertDismissReachable(card, answers, PHONE, `the ask at ${name}`)
      wrapper.unmount()
      document.body.innerHTML = ''
    }
  })

  it('⚠ the viewer`s own per-match escape is on the screen too, and it is the shipped one', () => {
    const kid = prologueEntrant('fit2', KID_ID, 'Vera Novak', 10)
    const open = playLocalOpen('fit2', kid, 10)
    const wrapper = mount(PrologueLocalOpen, { attachTo: document.body, props: { open, kid } })
    const skip = wrapper.findAll('button').find((b) => b.text() === 'Skip to the result')
    expect(skip, 'the viewer`s own «Skip to the result» is gone').toBeTruthy()
    wrapper.unmount()
  })

  it('⭐ every one of her matches is shown, in order, and the last one ends the weekend', async () => {
    // ⚠ A SEED WHOSE DRAW SHE ACTUALLY WINS A MATCH IN, so this walks more than one round.
    let picked: { seed: string; wins: number } | null = null
    for (let i = 0; i < 60 && !picked; i++) {
      const kid = prologueEntrant(`walkseed-${i}`, KID_ID, 'Vera Novak', 10)
      const open = playLocalOpen(`walkseed-${i}`, kid, 10)
      if (open.wins >= 1) picked = { seed: `walkseed-${i}`, wins: open.wins }
    }
    expect(picked, 'no seed in 60 gave her a win – the search is broken').toBeTruthy()

    const kid = prologueEntrant(picked!.seed, KID_ID, 'Vera Novak', 10)
    const open = playLocalOpen(picked!.seed, kid, 10)
    const mine = herMatches(open, KID_ID)
    expect(mine.length).toBeGreaterThan(1)

    const wrapper = mount(PrologueLocalOpen, { attachTo: document.body, props: { open, kid } })
    for (let i = 0; i < mine.length; i++) {
      // Her opponent for THIS round is named on the screen, which is how we know it is that match.
      const oppId = mine[i].aId === KID_ID ? mine[i].bId : mine[i].aId
      const opponent = open.field.find((p) => p.id === oppId)!
      expect(wrapper.text(), `round ${i}`).toContain(opponent.name)
      expect(wrapper.emitted('done'), `the weekend ended at round ${i}`).toBeUndefined()
      await click(wrapper, '.mv-skip')
      // The viewer holds the press (`proceedLabel`), so the way on is a control and not an eject.
      await click(wrapper, 'button', LOCAL_OPEN_COPY.proceed)
    }
    expect(wrapper.emitted('done')?.length, 'the last match did not end the weekend').toBe(1)
    wrapper.unmount()
  })
})

describe('⚠ the weekend is the bracket`s, not the watcher`s', () => {
  it('⭐ skipping it and sitting through it produce the same result – it was decided before the screen', () => {
    for (let i = 0; i < 20; i++) {
      const kid = prologueEntrant(`same-${i}`, KID_ID, 'Vera Novak', 10)
      const a = playLocalOpen(`same-${i}`, kid, 10)
      const b = playLocalOpen(`same-${i}`, kid, 10)
      expect(outcomeOf(b)).toBe(outcomeOf(a))
      expect(b.finish).toBe(a.finish)
      expect(JSON.stringify(b.result.matches)).toBe(JSON.stringify(a.result.matches))
    }
  })

  it('⚠ and a year with no weekend in it asks for none – the screen never invents one', () => {
    let run = withOrigin(EMPTY_RUN, 'middle')
    for (const card of PROLOGUE_CARDS) if (card.options) run = withPick(run, card.age, STAYED_HOME[card.age])
    for (const age of [11, 12, 13]) run = withEntry(run, age, TOURNAMENT_ANSWER.decline)
    const years = chosenYears(run)
    const entered = enteredAges(run)
    expect(entered).toEqual([])
    for (const age of CARD_AGES) expect(localOpensAt(years, age, entered), `age ${age}`).toBe(0)
  })
})

// =================================================================================================
// ⭐⭐ PHASE 12 – THE WIRE FROM THE CARDS TO THE COURT, MOUNTED
// =================================================================================================
//
// THE DEFECT, in the owner's own words: at a Local Open she was drawn as «a ninth child out of
// STARTING_SKILL_BAND, with no connection to the childhood», so «a player who paid for the club,
// one-to-one hours and the sports school watches her play exactly like a neglected girl».
//
// ⚠⚠ IT IS MOUNTED BECAUSE THE DEFECT WAS IN THE WIRING, NOT IN THE ARITHMETIC. `prologueEntrant`
// takes the years now and `tests/prologue-pool.test.ts` pins what it does with them – but the thing
// the owner met was a SCREEN that never handed them over. So this walks the real component, catches
// the girl it puts on the court, and compares her against the two candidates: the childhood's girl
// and the bare band draw. Mutation-verified: dropping `yearsLivedBy(...)` from `kidAt`'s call turns
// the second assertion of the first case red, naming the age.

describe('⭐⭐ the girl the walk puts on the court is the childhood the player bought', () => {
  /** ⚠ THE PROLOGUE'S SEED IS `Math.random`'s, BY DESIGN (it is UI-side – see `freshSeed`), so the
   *  only way to know which girl to expect is to hold the die still. The expression below is the
   *  component's own, so a change to `freshSeed` reddens this rather than being absorbed by it. */
  const ROLL = 0.4242424242
  const SEED = `prologue-${(ROLL.toString(36).slice(2) + '0000').slice(0, 8)}`

  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  /** ⭐ THE TWO ROADS, CHOSEN BY PRICE RATHER THAN BY A TABLE OF IDS – the dearest answer on every
   *  card against the cheapest one, which is «the parent who paid» against «the parent who did not»
   *  without this file needing to know which face of the twelfth the run reached.
   *
   *  ⚠ THE TENTH IS THE SAME ON BOTH, and that is what makes the comparison about the CHILDHOOD.
   *  Entering her is what buys the weekend, so a road that declined at ten would differ from the
   *  other in how many tournaments it played – which is phase 11's connection, not phase 12's. */
  function chooseOn(row: PrologueCard, age: number, rich: boolean): PrologueOption {
    const options = row.options!
    if (age === LOCAL_POOL.fromAge) return options.find((o) => o.focus === 'matchplay')!
    const byCost = [...options].sort((a, b) => (a.costCents ?? 0) - (b.costCents ?? 0))
    return rich ? byCost[byCost.length - 1] : byCost[0]
  }

  /** The walk, answering every card and every ask, and keeping a run in step with the component's
   *  own so the expected girl can be computed from the same years. */
  async function walkWatching(rich: boolean): Promise<{ age: number; kid: MatchPlayer; run: PrologueRun }[]> {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(ROLL)
    try {
      stubStore()
      const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
      let run = EMPTY_RUN
      const seen: { age: number; kid: MatchPlayer; run: PrologueRun }[] = []
      for (const age of CARD_AGES) {
        const card = PROLOGUE_CARDS.find((c) => c.age === age)!
        if (card.origins) {
          const origin = card.origins[1]
          await click(wrapper, '.prologue-answer', origin.label)
          run = withOrigin(run, origin.id as FamilyBackground)
        } else if (cardFor(age, run).options) {
          const option = chooseOn(cardFor(age, run), age, rich)
          await click(wrapper, '.prologue-answer', option.label)
          run = withPick(run, age, option.id)
        } else {
          await click(wrapper, '.prologue-answer', card.continueLabel)
        }
        if (wrapper.findAll('.prologue-answer-label').some((b) => b.text() === 'Put her name down')) {
          await click(wrapper, '.prologue-answer', 'Put her name down')
          run = withEntry(run, age, TOURNAMENT_ANSWER.enter)
        }
        for (let guard = 0; guard < 10; guard++) {
          if (wrapper.find('.plo-skip').exists()) {
            seen.push({ age, kid: wrapper.findComponent(PrologueLocalOpen).props('kid') as MatchPlayer, run })
            await click(wrapper, '.plo-skip')
            continue
          }
          if (wrapper.text().includes(LOCAL_OPEN_COPY.kicker)) {
            await click(wrapper, '.prologue-answer', LOCAL_OPEN_COPY.result.won.continueLabel)
            continue
          }
          break
        }
      }
      wrapper.unmount()
      return seen
    } finally {
      spy.mockRestore()
    }
  }

  it('⭐⭐ every weekend is played by `childhoodArrival` over the years lived – not by the band draw', async () => {
    for (const rich of [true, false]) {
      const seen = await walkWatching(rich)
      // Entering her every year buys a weekend at 10, 11, 12 and 13 – the rhythm phase 11 settled.
      expect(seen.map((s) => s.age), rich ? 'the dear road' : 'the cheap road').toEqual([10, 11, 12, 13])
      for (const { age, kid, run } of seen) {
        const born = prologueEntrant(SEED, KID_ID, kid.name, age)
        const raised = prologueEntrant(SEED, KID_ID, kid.name, age, yearsLivedBy(run, age))
        // ⭐ SHE IS THE RAISED GIRL...
        for (const k of SKILL_KEYS) expect(kid[k], `${k} at ${age}`).toBe(raised[k])
        // ...AND NOT THE BORN ONE, which is the assertion that reddens if the wire is cut.
        expect(SKILL_KEYS.some((k) => kid[k] !== born[k]), `age ${age} is still the band draw`).toBe(true)
      }
    }
  })

  it('⭐⭐ and the two roads put DIFFERENT girls on the same court, from the same die', async () => {
    // The owner's sentence, made mechanical: one seed, one born build, two childhoods, two players.
    // ⚠ AND THE GAP GROWS – small at ten, visible at thirteen. Both halves are asserted, because a
    // fix that moved her by a constant would satisfy the first and miss the point of the phase.
    const meanOf = (p: MatchPlayer) => SKILL_KEYS.reduce((s, k) => s + p[k], 0) / SKILL_KEYS.length
    const rich = await walkWatching(true)
    const poor = await walkWatching(false)
    const gaps = rich.map((r, i) => meanOf(r.kid) - meanOf(poor[i].kid))
    // eslint-disable-next-line no-console
    console.log(`\n  THE SAME GIRL, TWO CHILDHOODS – her mean attribute, dear road minus cheap road\n  ${
      rich.map((r, i) => `age ${r.age}: ${meanOf(r.kid).toFixed(2)} vs ${meanOf(poor[i].kid).toFixed(2)}  (+${gaps[i].toFixed(2)})`).join('\n  ')
    }\n`)
    for (const g of gaps) expect(g).toBeGreaterThan(0)
    expect(gaps[gaps.length - 1]).toBeGreaterThan(gaps[0])
  })
})
