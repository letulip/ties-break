// =================================================================================================
// WAVE 8, T10 – THE `'family'` ENDING THROUGH THE **EXISTING** SCREENS, AND ZERO NEW LAYOUT
// =================================================================================================
//
// `docs/plans/life-wave-8-builder-2026-09.md` §2 T10: «The `'family'` ending through the EXISTING
// ending screen and album – the four total records carry it; zero new layout.» And §2 T5's own
// claim, which this file is the acceptance test of: «The ending screen and the album then work
// UNCHANGED – wave 7½ (album) made the ending machinery total over the union, which is exactly the
// seam paying off.»
//
// ⚠⚠ T5 PROVED IT AT THE ENGINE AND THIS PROVES IT AT THE SCREEN, which are two different claims.
// `tests/wave8-return-decision.test.ts` §D reads ONE world twice – as `'family'` and as `'stopped'` –
// and shows `buildEndingView` and `assembleAlbum` composing the same page. That says the DATA needs
// no branch. What it cannot say is whether a COMPONENT has one: `EndingScreen.vue` and
// `AlbumScreen.vue` receive that data and could still be reading `ending.type` themselves. So this
// file mounts both, on the same two readings of the same world, and compares the RENDERED DOM.
//
// ⭐ THE TASK'S OWN INSTRUCTION IS WHAT THIS FILE IS FOR: «If you find yourself adding a branch in
// the ending screen, the album or any selector, STOP AND BRING IT.» No branch was needed and no
// component was touched by T10 – this is the measurement that says so rather than the assurance.
// The only `ending.type` branch anywhere in the UI is `=== 'college'` (App.vue, HomeScreen,
// SeasonScreen, blockingOverlay), which is «is this latch a FREEZE or an END» – a question `'family'`
// answers the same way the other seven do.
//
// ⚠ NO STRING MOVES and none is transcribed: the two titles are read through `ENDING_TITLE`, so a
// re-wording at his pass moves the assertion with the copy rather than breaking it.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – measured, not predicted
// =================================================================================================
//
//   ARM 6  a branch put into `EndingScreen.vue` that the `'family'` ending takes and `'stopped'`
//          does not – one `<p v-if="view.ending.type === 'family'">` inside `.album-page`
//          → 1 RED, and it is §A.2's page-for-page comparison: «page for page: expected [ … ] to
//          deeply equal [ … ]». So the instrument really can see a branch, which is the only thing
//          that makes a GREEN §A.2 worth anything. ⚠ §A.3 stayed green, correctly – it is about the
//          two titles being two, not about the layout.
//   ARM 7  the ending's four total records read for a type the machinery has never seen
//          → NOT RUN AS A MUTATION, because it cannot be: the records are TOTAL BY TYPE and
//          `vue-tsc` refuses before a test can. That refusal is the design (§0 of the brief: «a new
//          `CareerEndingType` member goes red in FOUR total records … and that is the design
//          working»), and what a test can add is §A.1 and §A.4 – the copy really is on the screen,
//          and the blurb really is on none.
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import '../../src/style.css'
import EndingScreen from '../../src/components/EndingScreen.vue'
import AlbumScreen from '../../src/components/screens/AlbumScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  assembleAlbum,
  createWorld,
  decisionWeekOf,
  kidAgeExact,
  kidAgeYears,
  resolveReturnDecision,
  returnChanceFor,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { ENDING_BLURB, ENDING_TITLE } from '../../src/engine/ending'
import { rngFromSeed } from '../../src/engine/rng'
import type { LoveEpisode, Snapshot } from '../../src/shared/protocol'

/** ⚠⚠ THE BRIEF'S OWN LITERALS, TRANSCRIBED – wave 3's ARM 2 law, inherited through T2..T6. */
const BRIEF = { playsOnWeeks: 8, termWeeks: 31 } as const

function weekAtAge(world: WorldState, years: number): number {
  for (let w = 0; w < 40 * 52; w++) {
    if (kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) >= years) return w
  }
  throw new Error(`no week reaches age ${years}`)
}

function married(sinceWeek: number, latchedWeek: number): LoveEpisode {
  return {
    id: `p:${sinceWeek}`, sinceWeek, endedWeek: null, knownWeek: sinceWeek + 2, wants: 'open',
    partnerId: `p:${sinceWeek}`, publicWeek: null, publicWrong: false, airedMetWeek: null,
    airedEndedWeek: null, latchedWeek, partnerName: 'Anton',
  }
}

/** T5's `wedded` + `expecting`, verbatim in shape: a married career of 28 carrying the record
 *  `rollPregnancy` writes, parked where the decision falls. */
function carrying(seed: string): WorldState {
  const world = createWorld(seed)
  const announcedWeek = weekAtAge(world, 28)
  world.season = []
  world.week = announcedWeek
  world.condition = 100
  world.fundsCents = 5_000_00
  world.spirit = 70
  world.bond = 70
  world.fork = { askedWeek: 0, answer: 'continue', offer: null }
  world.loveEpisodes = [married(announcedWeek - 104, announcedWeek - 52)]
  world.pregnancy = {
    episodeId: world.loveEpisodes[0].id,
    // ⚠ v87 – the pre-window shape (conception AT the announcement), which is what the migration
    // back-fills and what a test about the ENDING must not accidentally be measuring a window in.
    conceivedWeek: announcedWeek,
    announcedWeek,
    pausesWeek: announcedWeek + BRIEF.playsOnWeeks,
    dueWeek: announcedWeek + BRIEF.playsOnWeeks + BRIEF.termWeeks,
    support: 'cold',
    rankAtPause: null,
  }
  world.week = decisionWeekOf(world.pregnancy)
  return world
}

/** T5's `coinSaysTry`, verbatim in purpose: what the ENGINE's own coin will say, computed without
 *  spending it. Used only to SELECT a fixture, never to assert one – nothing is stubbed and no
 *  chance is bent. */
function coinSaysTry(world: WorldState): boolean {
  const week = decisionWeekOf(world.pregnancy!)
  const chance = returnChanceFor(
    world.pregnancy!.support,
    world.spirit!,
    world.bond!,
    kidAgeYears(week, world.profile.birthMonth, world.profile.birthDay),
  )
  return rngFromSeed(`${world.seed}:life:return:${week}`)() < chance
}

/** A career whose coin says she does NOT go back, latched through the engine's own step. */
function stopped(): WorldState {
  for (let i = 0; i < 500; i++) {
    const world = carrying(`t10-family-${i}`)
    if (coinSaysTry(world)) continue
    resolveReturnDecision(world)
    expect(world.ending?.type, 'the engine really latched the ninth ending').toBe('family')
    return world
  }
  throw new Error('no seed whose coin stops the career')
}

let family: WorldState
beforeAll(() => {
  family = stopped()
})

beforeEach(() => {
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})

function open(snapshot: Snapshot) {
  const game = useGameStore()
  game.$patch({ ready: true, phase: 'ready' })
  game.snapshot = snapshot
  return mount(EndingScreen, { global: { stubs: { teleport: true } } })
}

/** Every page of the album, in order, as the screen draws them – the epilogue shows ONE at a time
 *  and turns, so a comparison of the first page alone would miss seven eighths of the claim. */
async function pages(w: ReturnType<typeof open>): Promise<string[]> {
  const out: string[] = []
  for (let i = 0; i < 7; i++) {
    out.push(w.find('.album-page').html())
    if (i < 6) await w.findAll('.album-arrow')[1].trigger('click')
  }
  return out
}

// =================================================================================================
// A. THE EPILOGUE
// =================================================================================================
describe('T10 §A – the ninth ending draws on the screen the other eight draw on', () => {
  it('⭐⭐ the epilogue is on screen and its LAST page is carrying the ending\'s own title', async () => {
    const snap = toSnapshot(family)
    expect(snap.ending, 'the view assembled – nothing below is vacuous').not.toBeNull()
    const w = open(snap)
    expect(w.findAll('.album-page'), 'one page at a time, like every other ending').toHaveLength(1)
    expect(w.text(), 'and the title is NOT on page one – it belongs to the last').not.toContain(ENDING_TITLE.family)
    for (let i = 0; i < 6; i++) await w.findAll('.album-arrow')[1].trigger('click')
    expect(w.text(), 'slot 7 is the ending itself, whichever of the nine it was').toContain(ENDING_TITLE.family)
    expect(w.find('.ending-foot').exists(), 'and the hand-off is under it').toBe(true)
    w.unmount()
  })

  it('⚠⚠ THE BLURB IS ON NO SCREEN, AND THAT IS THE SHIPPED STATE RATHER THAN A T10 GAP', () => {
    // ⚠ A FINDING, PINNED WHERE IT WAS FOUND. `ENDING_BLURB` is rendered by NOTHING in `src/` – its
    // own note in `engine/ending.ts` records the owner's 18.08 ruling that it is writing waiting for
    // an ending screen that has not been built out («может быть мы просто не добрались еще до
    // концовок»), restored by him after an agent deleted it for having no consumer. So the wave's
    // ninth blurb is in the same drawer as the other eight: authored, ruled, and unrendered.
    // ⚠ T8's TABLE SAYS OTHERWISE about P22 («the epilogue's headline paragraph»), and the row is
    // corrected in this task's own amendment rather than here – a test states the tree, the table
    // states the tree, and this case is what keeps them honest with each other.
    const w = open(toSnapshot(family))
    expect(ENDING_BLURB.family, 'the blurb exists and is not empty').toBeTruthy()
    expect(w.text(), 'and no surface prints it – the eight before it are the same').not.toContain(
      ENDING_BLURB.family,
    )
    w.unmount()
  })

  it('⭐⭐⭐ PAGE FOR PAGE IDENTICAL to the same world read as `stopped` – the seam, measured', async () => {
    // T5's own instrument, moved up a layer: one world, two readings, and the ONLY difference the
    // rendered pages are allowed to have is the title string. If `EndingScreen.vue` carried a branch
    // for this ending – or for any of the others – it would show up here as a page that differs by
    // more than eight words. ARM 6 is what says the comparison can see one.
    const swap = (html: string) =>
      html.split(ENDING_TITLE.family).join('<the title>').split(ENDING_TITLE.stopped).join('<the title>')

    const view = open(toSnapshot(family))
    const fam = await pages(view)
    view.unmount()

    setActivePinia(createPinia())
    const control = open(toSnapshot({ ...family, ending: { ...family.ending!, type: 'stopped' } }))
    const stop = await pages(control)
    expect(fam.map(swap), 'page for page').toEqual(stop.map(swap))
    control.unmount()
  })

  it('⚠ ...and the comparison is not vacuous – the two readings really ARE two endings', async () => {
    // The control arm for the control arm: if the swap above had normalised away everything, or if
    // both mounts had drawn the same ending, §A.2 would be comparing a thing with itself. The two
    // titles are different strings and both are really printed, on the page that carries them.
    expect(ENDING_TITLE.family).not.toBe(ENDING_TITLE.stopped)
    const last = async (w: ReturnType<typeof open>) => {
      for (let i = 0; i < 6; i++) await w.findAll('.album-arrow')[1].trigger('click')
      return w.text()
    }
    const fam = open(toSnapshot(family))
    const famText = await last(fam)
    expect(famText).toContain(ENDING_TITLE.family)
    expect(famText).not.toContain(ENDING_TITLE.stopped)
    fam.unmount()

    setActivePinia(createPinia())
    const stop = open(toSnapshot({ ...family, ending: { ...family.ending!, type: 'stopped' } }))
    const stopText = await last(stop)
    expect(stopText).toContain(ENDING_TITLE.stopped)
    expect(stopText).not.toContain(ENDING_TITLE.family)
    stop.unmount()
  })
})

// =================================================================================================
// B. THE ALBUM BOOK
// =================================================================================================
describe('T10 §B – the album book assembles and draws for an ending it had never seen', () => {
  it('⭐⭐ the book renders, and it renders the same sheets `stopped` renders', () => {
    // `ALBUM_CLOSING_FAMILY.family` is `decision` – the same family `stopped` takes – so the closing
    // page is the same page, which is §6.2 of the strings table («a mapping, and it adds no string»)
    // arriving on a screen. The claim here is the SCREEN's: `AlbumScreen.vue` takes the book as a
    // prop and has no opinion about which ending produced it.
    const book = assembleAlbum(family)
    expect(book.sheets.length, 'the book assembled – nothing below is vacuous').toBeGreaterThan(0)
    const w = mount(AlbumScreen, { props: { book }, global: { stubs: { teleport: true } } })
    expect(w.find('.album').exists(), 'the album is on screen').toBe(true)
    expect(w.find('.album-head-title').exists(), 'with a chapter under its head').toBe(true)
    const familyHtml = w.html()
    w.unmount()

    const control = assembleAlbum({ ...family, ending: { ...family.ending!, type: 'stopped' } })
    const c = mount(AlbumScreen, { props: { book: control }, global: { stubs: { teleport: true } } })
    const stoppedHtml = c.html()
    c.unmount()
    expect(book.sheets.length, 'the same number of sheets').toBe(control.sheets.length)
    const swap = (html: string) =>
      html.split(ENDING_TITLE.family).join('<the title>').split(ENDING_TITLE.stopped).join('<the title>')
    expect(swap(familyHtml), 'and the same first sheet on the screen').toBe(swap(stoppedHtml))
  })
})
