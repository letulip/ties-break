// =================================================================================================
// ⭐⭐⭐ ROUND 26 #10 (AGAIN) – WHAT THE COLLEGE SCREEN ACTUALLY SHOWS HIM, MOUNTED
// =================================================================================================
//
// HIS CORRECTION, after reading the first report: «у меня в ленте предпоследняя новость были из мира
// "до колледжа" на протяжении всей учебы, а последняя жёлтым про её учебный год. Вот я бы хотел,
// чтобы "мир жил" и пока она в колледже, пусть и сжато».
//
// ⚠⚠ THE ASSERTIONS HERE ARE ABOUT RECENCY AND NOT ABOUT ROW COUNT, and that distinction is the
// whole second pass. The first pass counted rows – fifteen on the card, never zero at forty rest
// states – and shipped on that number, and he came back with a screen that still read as a dead
// world. Rows were never the shortage: measured over 48 walked rest states
// (`tools/college-news-probe.ts`) the card holds 21.1 of them. What it did not hold was anything
// dated the week he was standing on: the card reaches 90 weeks back, its median row is 9.2 weeks
// old, and only 7.8 of the 17 weeks a press spends have a row on the card at all (45%).
//
// ⚠ SO EVERY `expect` BELOW IS OF THE FORM "…and it is about THIS week". A version of this file
// that asserted `rows.length > 0` would pass on the build he complained about.
//
// ⚠ MUTATION-VERIFIED – each turns exactly the named case red, watched doing it:
//   * `announceCampusInterlude` early-returns              -> both mounted cases.
//   * the digest written on `pressFrom` instead of `world.week` -> the recency case only.
//   * `#diary-news` given `v-if="!collegeWeek"`            -> the surface case.
//
// ⚠ A RUNNER-SIZED CEILING, ARITHMETIC AS ROUND 26 #16 ASKS. The heavy shape is the walk: ~114 ticks
// to the college departure plus up to four years of 52 weeks, mounted on the whole Home page twelve
// times over. MEASURED alone on a quiet machine: 2.1 s of test time, 3.7 s wall for the file. The
// component project runs its files in parallel and the documented slow-machine signature is a case
// crossing vitest's 5 s default with ZERO assertion failures – 4-5x on CI's two cores would put the
// slower case at ~9 s. 30 s is ~8x the measured wall cost, so it can only fire on a genuine wedge.
// ⚠ If a case here ever takes tens of seconds ALONE that is a real regression, and this ceiling must
// not be raised to hide it.
import { describe, it, expect, beforeEach, vi } from 'vitest'
vi.setConfig({ testTimeout: 30_000 })
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
// ⚠ THE REAL STYLESHEET, on the precedent of every other mounted case on this page.
import '../../src/style.css'
import { useGameStore } from '../../src/stores/game'
import { ENDINGS } from '../../src/engine/ending'
import { setViewport, PHONE } from './fits'
import {
  answerFork,
  chooseGift,
  closeTournament,
  callUpRevealOpen,
  collegeLeagueRevealOpen,
  createWorld,
  measureCollegeOffer,
  pendingBirthday,
  resumeFromCollege,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { resumeMain, type Rng } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage AND `HomeScreen` READS IT. The same shim `round26-college-card`,
// `college-second-act` and `home-strip-and-mail` carry, for the reason quoted there in full: the
// correct production fallback ("claim nothing" on a throw) would make this screen untestable by
// accident. The runner gets an object; the code is not weakened to suit it.
const backing = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
    setItem: (k: string, v: string) => void backing.set(k, String(v)),
    removeItem: (k: string) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i: number) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  },
})

function finishAnyReveal(world: WorldState): void {
  for (let i = 0; i < 40 && world.pendingTournament && !world.pendingTournament.finished; i++) skipTournament(world)
  if (world.pendingTournament) closeTournament(world)
}

/** A career that was really played to the fork and really answered «college» – the walk
 *  `round24-college-shell.test.ts`, `college-freeze.test.ts` and the card's own file all share,
 *  including its one thumb on the scale: four years is 208 weeks of base costs, and a family that
 *  goes bankrupt inside them measures the budget instead of the screen. */
function atCollege(seed: string): { world: WorldState; rng: Rng } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < 60; i++) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    tickWeek(world, rng)
    finishAnyReveal(world)
  }
  world.fundsCents = 500_000_00
  world.fork = { askedWeek: world.week, answer: null, offer: measureCollegeOffer(world) }
  answerFork(world, 'college')
  for (let i = 0; i < 54 && world.ending === null; i++) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    tickWeek(world, rng)
    finishAnyReveal(world)
  }
  expect(world.ending?.type, 'the departure really latched the college ending').toBe('college')
  return { world, rng }
}

/** One press of the college bar, plus every answer the screen would give before the next press:
 *  the championship reveal (round 26 #6) and the cake (round 24). ⚠ A walk that answers one and not
 *  the other stalls on the first league week and then measures ONE rest state over and over – which
 *  is exactly what the probe did on the collected tree until it was caught. */
function press(world: WorldState, rng: Rng): void {
  world.fundsCents = Math.max(world.fundsCents, 200_000_00)
  resumeFromCollege(world, rng)
  // ⭐⭐⭐ ROUND 27 #6 RE-AIM – AND THE NATIONS CUP TIE, WHICH PAUSES THE YEAR THE SAME WAY.
  // ⚠ IT USED TO CLAIM: «the championship reveal (round 26 #6) and the cake» are everything a press
  // has to answer before the next one. ⚠ WHY IT MOVED: the call-up stopped being a toast, so a walk
  // that answers only the championship stalls on the first call-up week and measures ONE rest state
  // over and over – the exact failure this helper's own note above was written about, arriving from
  // the second fixture.
  if (collegeLeagueRevealOpen(world) || callUpRevealOpen(world)) {
    skipTournament(world)
    closeTournament(world)
  }
  if (pendingBirthday(world) !== null) chooseGift(world, 'day')
}

async function openHome(world: WorldState) {
  setViewport(PHONE)
  const game = useGameStore()
  game.$patch({ snapshot: toSnapshot(world) as Snapshot })
  return mount(HomeScreen, {
    props: { recapFresh: false },
    attachTo: document.body,
    global: { stubs: { teleport: true } },
  })
}

/** The News card's rows, IN THE ORDER THEY ARE DRAWN, each tagged with the week group it sits under.
 *  Read out of the DOM rather than off the snapshot, because the ordering – week groups descending,
 *  milestones pinned inside a group – is the screen's and not the engine's, and «предпоследняя» is a
 *  claim about that order. */
function newsRows(wrapper: Awaited<ReturnType<typeof openHome>>): Array<{ label: string; text: string; milestone: boolean }> {
  const out: Array<{ label: string; text: string; milestone: boolean }> = []
  for (const group of wrapper.findAll('#diary-news .news-week')) {
    const label = group.find('.news-week-label').text()
    for (const tr of group.findAll('tbody tr')) {
      out.push({ label, text: tr.text(), milestone: tr.classes().includes('milestone') })
    }
  }
  return out
}

describe('⭐⭐⭐ #10 (again) – the college news card is about the week he is standing on', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('opens every rest state of the degree with a row about the tour, dated today', async () => {
    const { world, rng } = atCollege('r26-alive-home')
    const visited: number[] = []
    for (let i = 0; i < 3 * ENDINGS.collegeYears && world.ending?.type === 'college'; i++) {
      press(world, rng)
      const wrapper = await openHome(world)
      const rows = newsRows(wrapper)
      expect(rows.length, `W${world.week}: the card is drawn at all`).toBeGreaterThan(0)

      // ⭐⭐ THE TOP GROUP IS TODAY. This is the half his sentence is about: whatever else the card
      // holds, the first thing on it belongs to the week the press just handed back.
      const top = rows[0].label
      const todayRows = rows.filter((r) => r.label === top)
      expect(todayRows.some((r) => r.text.includes('🌍')), `W${world.week}: the tour spoke today`).toBe(true)

      // ⭐⭐ ...AND «ПРЕДПОСЛЕДНЯЯ» IS TOO. The yellow row is the milestone about her academic year;
      // the row under it used to be whatever the window happened to reach. It is now the world's,
      // and it is dated today – the same week group as the yellow one above it.
      const firstNotMilestone = rows.find((r) => !r.milestone)
      expect(firstNotMilestone, `W${world.week}: there is a row under the milestones`).toBeTruthy()
      expect(firstNotMilestone!.label, 'the second row is in TODAY’s group, not months back').toBe(top)

      wrapper.unmount()
      visited.push(world.week)
    }
    expect(visited.length, 'the walk visited the whole degree').toBeGreaterThanOrEqual(8)
    expect(visited[visited.length - 1] - visited[0], 'over four years, not one week twelve times').toBeGreaterThan(150)
  })

  it('draws the news card on a college week at all – the surface half of the three candidates', async () => {
    // ⚠ THE CANDIDATE THIS REFUTES, kept as a test because it was a live hypothesis and because a
    // later wave could make it true by accident: «the college screens may not draw the news list the
    // way the tour Home does». They do – `#diary-news` carries no `collegeWeek` condition – and the
    // college card is drawn ABOVE it, which is why the row that matters has to be dated today rather
    // than merely present somewhere down the page.
    const { world, rng } = atCollege('r26-alive-surface')
    press(world, rng)
    const wrapper = await openHome(world)
    expect(wrapper.find('.college-card').exists(), 'the college card is on the page').toBe(true)
    expect(wrapper.find('#diary-news').exists(), 'and so is the news card').toBe(true)
    const rows = newsRows(wrapper)
    expect(rows.length, 'with real rows in it').toBeGreaterThan(3)
    // The world's row is inside the viewport's page, not merely inside the DOM – the card is long
    // and this is the one row the second pass exists to put in front of him.
    const world10 = wrapper.findAll('#diary-news tbody tr').filter((tr) => tr.text().includes('🌍'))
    expect(world10.length, 'exactly one campus digest row on the card, never a pile').toBe(1)
    wrapper.unmount()
  })
})
