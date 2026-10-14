// ⭐⭐⭐ ROUND 51 №8 (14.10) – «ASKING HER COACH WHY», MOUNTED. The unit half is tests/r51-coach-real-hunch.test.ts.
//
// The owner: «вот жаль, что не привязан, потому что после такого очень хочется и мне понять "а он ок или не ок"».
// So the middle answer to her «is my coach actually good» now (1) adds ONE line of hers – her hunch about what
// her coach will say, leaning the way the pair really leans – and (2) opens the reading of the pair on the
// coach's card even below the bar that otherwise shows «?». This file holds what the PLAYER sees of both:
//   A. the dialog – the hunch is the last paragraph of the `view` reply, in the active language, and `more`
//      carries none
//   B. the coach card – the ring shows «?» before the answer and the number after it, for the coach she has and
//      for nobody else
//   C. the phone – the longest route (the Russian cold hunch) keeps the way on reachable at 375x667 and 320x568
//
// ⚠⚠ THE ENGINE'S OWN CARD, NOT A FIXTURE'S: the prompt is the one `toSnapshot` assembles from a real world
// (`snapshot.softBeat.prompt`) and the ring is the one the real snapshot's `coachMarket` row feeds, so a screen
// that restated the engine's verdict would still be caught by the engine's own number.
// ⚠ `setViewport` RUNS BEFORE THE MOUNT – happy-dom caches a media query on the first computed-style read.
//
// ⚠⚠ MUTATION ARMS – the reds measured for this file are listed in the unit file's header table.
// ⚠ ROUND 52 F1 (14.10): the hunch is read off HOW SHE FEELS (`coachFeel` -> `feelHunch`), so the poses below carry a stint as well as a level (see `BAND_CHEM`). The copy,
// language and phone cases are unchanged; only the pose that picks WHICH band the engine's card carries moved.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import '../../src/style.css'
import LifeBeatDialog from '../../src/components/LifeBeatDialog.vue'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  SMALL_TALK_SITUATIONS,
  SMALL_TALK_STANCE_ID,
  TEMPERAMENTS,
  answerLifeBeat,
  createWorld,
  raiseLifeBeat,
  toSnapshot,
  type Temperament,
  type WorldState,
} from '../../src/engine/world'
import { COACH_REAL_HUNCH, COACH_REAL_SITUATION_ID } from '../../src/engine/world/lifeBeat/smallTalkCopy'
import type { ChemistryHunch } from '../../src/engine/chemistry'
import { DEFAULT_PROFILE, type CoachMarketRow, type LifeBeatPrompt, type Snapshot } from '../../src/shared/protocol'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import { installMemoryStorage } from './setup'
import { NARROW_PHONE, PHONE, assertDismissReachable, setViewport, type Viewport } from './fits'

const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
const CYRILLIC = /[А-Яа-яЁё]/

const COACH_REAL = SMALL_TALK_SITUATIONS.find((s) => s.id === COACH_REAL_SITUATION_ID)!
const DETAIL = `${COACH_REAL.subject}:${COACH_REAL.id}`
const VIEW = SMALL_TALK_STANCE_ID.respond
const MORE = SMALL_TALK_STANCE_ID.invite
const flat = (s: string | null): string => (s ?? '').replace(/\s+/g, ' ').trim()

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})
afterEach(() => {
  document.body.innerHTML = ''
  document.documentElement.lang = 'en'
})

/** A career with a coach, a pair posed at `chem`, and her coach-real card raised and waiting – the REAL commands. */
function asking(voice: Temperament, chem: number, seed = `r51-8-mounted-${voice}`, week = 30): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'middle' })
  world.week = week
  world.temperament = voice
  world.coachPairs[world.coachId!] = { chem, phase: 0, standing: 0 }
  raiseLifeBeat(world, 'small-talk', DETAIL)
  return world
}
function promptOf(world: WorldState): LifeBeatPrompt {
  const invite = toSnapshot(world).softBeat
  if (invite === null) throw new Error('the engine raised no soft card for the coach-real row')
  return invite.prompt
}
function mountBeat(prompt: LifeBeatPrompt, vp: Viewport = PHONE): VueWrapper {
  setViewport(vp) // BEFORE the mount
  useGameStore().snapshot = { ...toSnapshot(createWorld('r51-8-shell', DEFAULT_PROFILE)), lifeBeatPrompt: prompt }
  return mount(LifeBeatDialog, { attachTo: document.body })
}
/** press an answer and read the paragraphs of her reply */
async function pressAnswer(w: VueWrapper, prompt: LifeBeatPrompt, optionId: string): Promise<string[]> {
  const at = prompt.options.findIndex((o) => o.id === optionId)
  expect(at, `the card offers ${optionId}`).toBeGreaterThanOrEqual(0)
  await w.findAll('button.life-beat-choice')[at]!.trigger('click')
  await nextTick()
  return w.findAll('.life-beat-continued').map((n) => flat(n.text()))
}
// ⚠ ROUND 52 F1 (14.10): the band is her FEEL's now, so each pose carries a STINT as well as a level – [band, level, weeks together]. The founding coach has been
// here since week 0, so the pose's week IS the stint: a clear level at 80 weeks is `good` / `off` (warm / cold), anything under six weeks is `too-early` (even).
const BAND_CHEM: [ChemistryHunch, number, number][] = [['warm', 12, 80], ['even', 0.4, 3], ['cold', -12, 80]]

// =================================================================================================
// A. THE DIALOG
// =================================================================================================
describe('round 51 №8 A – her reply to «a good coach explains» ends with her hunch', () => {
  it('⭐ English: the `view` reply is her old line and ONE more – the hunch for the pair\'s band – and `more` carries none', async () => {
    for (const voice of TEMPERAMENTS) {
      for (const [band, chem, weeks] of BAND_CHEM) {
        const prompt = promptOf(asking(voice, chem, undefined, weeks))
        const w = mountBeat(prompt)
        const viewPlain = prompt.followUps.find((f) => f.optionId === VIEW)!
        const paragraphs = await pressAnswer(w, prompt, VIEW)
        expect(paragraphs, `${voice}/${band}: exactly the engine's paragraphs, the hunch last`).toEqual(viewPlain.said.map(flat))
        expect(paragraphs.at(-1)).toBe(flat(COACH_REAL_HUNCH[voice][band]))
        expect(paragraphs.length, 'her old reply plus one line').toBe(2)
        w.unmount()
        document.body.innerHTML = ''

        const w2 = mountBeat(prompt)
        const more = await pressAnswer(w2, prompt, MORE)
        expect(more.join(' '), `${voice}/${band}: the invite reply carries no hunch`).not.toContain(COACH_REAL_HUNCH[voice][band])
        w2.unmount()
        document.body.innerHTML = ''
      }
    }
  })

  it('⭐ Russian: after choosing `view` the dialog shows the Russian hunch, from the catalog, with no English left in it', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    for (const voice of TEMPERAMENTS) {
      for (const [band, chem, weeks] of BAND_CHEM) {
        const line = COACH_REAL_HUNCH[voice][band]
        expect(RU[line], `${voice}/${band}: the table has a Russian row for this line`).toBeTruthy()
        expect(RU[line]).toMatch(CYRILLIC)
        const prompt = promptOf(asking(voice, chem, undefined, weeks))
        const w = mountBeat(prompt)
        const paragraphs = await pressAnswer(w, prompt, VIEW)
        expect(paragraphs.at(-1), `${voice}/${band}`).toBe(flat(RU[line]))
        expect(paragraphs.at(-1)).toMatch(CYRILLIC)
        expect(paragraphs.at(-1), 'and not the English fallback').not.toBe(flat(line))
        w.unmount()
        document.body.innerHTML = ''
      }
    }
  })
})

// =================================================================================================
// B. THE COACH CARD
// =================================================================================================
async function mountCoaches(snapshot: Snapshot) {
  const store = useGameStore()
  store.snapshot = snapshot
  const wrapper = mount(CoachMarketScreen, { attachTo: document.body })
  const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
  await pill!.trigger('click')
  await nextTick()
  return wrapper
}
const cellOf = (w: VueWrapper, row: CoachMarketRow) => w.findAll('.cm-cell').find((c) => c.get('.cm-name').text() === row.name)!
const ringOf = (w: VueWrapper, row: CoachMarketRow): string => cellOf(w, row).get('.cm-chem .tb-ring-value').text()

describe('round 51 №8 B – the ring on the coach\'s card', () => {
  it('⭐ «?» before the answer, the number after it – for the coach she has, and for nobody else', async () => {
    const world = asking('quiet', 0.9)
    const stranger = toSnapshot(world).coachMarket.find((r) => !r.current && r.lockedPoints === null)!
    // 0.9 is under the lowest bar a pair can draw (1): unreadable on every seed, so the only thing that can show it is the opening.
    world.coachPairs[stranger.id] = { chem: 0.9, phase: 0, standing: 0 }

    const before = toSnapshot(world)
    const current = before.coachMarket.find((r) => r.current)!
    const w1 = await mountCoaches(before)
    expect(ringOf(w1, current), 'asked, not answered: the old «?»').toBe('?')
    expect(ringOf(w1, stranger)).toBe('?')
    w1.unmount()
    document.body.innerHTML = ''

    answerLifeBeat(world, VIEW)
    const after = toSnapshot(world)
    const w2 = await mountCoaches(after)
    expect(ringOf(w2, current), 'the figure the engine put on the row').toBe(`${Math.round(after.coachMarket.find((r) => r.current)!.chemistry!)}%`)
    expect(ringOf(w2, current), 'a number, not the question mark').not.toBe('?')
    expect(ringOf(w2, stranger), 'the stranger\'s pair is not hers to read').toBe('?')
    expect(cellOf(w2, current).get('.cm-chem-open').attributes('aria-label')).not.toBe('Chemistry with her: not known yet')
    w2.unmount()
  })

  it('a different answer opens nothing on the card', async () => {
    const world = asking('quiet', 0.9)
    answerLifeBeat(world, MORE)
    const snap = toSnapshot(world)
    const w = await mountCoaches(snap)
    expect(ringOf(w, snap.coachMarket.find((r) => r.current)!)).toBe('?')
    w.unmount()
  })
})

// =================================================================================================
// C. THE PHONE – the reply got a line longer, so the way on is measured, not assumed
// =================================================================================================
describe('round 51 №8 C – the reply with the hunch still has a reachable way on at phone size', () => {
  for (const vp of [PHONE, NARROW_PHONE]) {
    for (const locale of ['en', 'ru'] as const) {
      it(`${locale} ${vp.width}x${vp.height}: the longest hunch route keeps the button on the screen`, async () => {
        if (locale === 'ru') {
          installCatalog('ru', RU)
          await setLocale('ru')
        }
        // the longest hunch of the whole table, in the language being measured
        const longest = TEMPERAMENTS.flatMap((v) => (['warm', 'even', 'cold'] as const).map((b) => ({ v, b, len: (locale === 'ru' ? RU[COACH_REAL_HUNCH[v][b]] : COACH_REAL_HUNCH[v][b]).length }))).sort((a, b) => b.len - a.len)[0]!
        const prompt = promptOf(asking(longest.v, longest.b === 'warm' ? 12 : longest.b === 'cold' ? -12 : 0.4, undefined, longest.b === 'even' ? 3 : 80))
        const w = mountBeat(prompt, vp)
        const paragraphs = await pressAnswer(w, prompt, VIEW)
        expect(paragraphs.length, 'the reply is up with its hunch – nothing below is vacuous').toBe(2)
        const card = document.querySelector('.life-beat-dialog') as HTMLElement
        const dismiss = card.querySelector('.life-beat-listen-done') as HTMLElement
        expect(dismiss).toBeTruthy()
        assertDismissReachable(card, dismiss, vp, `LifeBeatDialog (${locale}, coach-real hunch, ${vp.width}x${vp.height})`)

        // MUTATION, in the test: a hunch many times its length on an unbounded card – the assertion must bite.
        const tall = card.querySelectorAll('.life-beat-continued')
        const last = tall[tall.length - 1] as HTMLElement
        last.textContent = Array.from({ length: 60 }, () => last.textContent).join(' ')
        card.style.maxHeight = 'none'
        card.style.overflowY = 'visible'
        expect(() => assertDismissReachable(card, dismiss, vp, 'LifeBeatDialog (too tall, unbounded)')).toThrow(/declares no height bound|taller than the screen|outside the viewport/)
        w.unmount()
      })
    }
  }
})
