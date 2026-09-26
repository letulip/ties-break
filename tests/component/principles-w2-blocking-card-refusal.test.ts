// ⭐⭐ W2 – THE FIVE BLOCKING CARDS THAT COULD NOT SAY THEY HAD BEEN REFUSED.
//
// The owner, 26.09 (docs/decisions.md, «NO PLAYERS, SO THE SAVE DOORS ANSWER TO ONE RULE: THE PLAYER
// NEVER GETS STUCK»): «страховку сделать можно, по твоей рекомендации, лишь бы пользователь не
// застрял в этом флоу». His ruling moves the question off WORDING and onto EXITS – so nothing here
// writes a sentence, and `<StoreError />` (src/components/ui/StoreError.vue) renders whatever the
// store already wrote. U-02's own header says it in as many words: «THERE IS NO WORDING IN THIS FILE
// AND THERE MAY NEVER BE ONE».
//
// ⚠ WHAT WAS MEASURED, AND WHY THESE FIVE. `KnockDialog`, `ShootClashDialog`, `BirthdayDialog`,
// `LifeBeatDialog` and `RetirementDialog` held ZERO references to `game.error` and zero `StoreError`
// before this wave. All five are BLOCKING and all five say, each in its own header, that they have no
// dismiss BY DESIGN: `@click.self` is deliberately not wired and Escape is passed no handler, because
// every way out of them is an answer. So a refused answer changed nothing on screen – the world had
// not moved, the card was still up, and every control on it was an answer to the question that had
// just been refused. `ForkDialog` is the one card of this family that already had the line (its own
// note at :468), which is the shape all five copy.
//
// TWO WAYS IT IS REACHED, and neither needs a hypothesis:
//   * `SAVE_CONFLICT` from a second tab. No engine bug at all: the store's OWN sentence
//     (stores/game.ts, the SAVE_CONFLICT branch) names the way out and the player could not read it
//     from inside the card.
//   * B-02's path – `toSnapshot(candidate)` throws in `sim.worker.ts`'s `mutate` and the mutation is
//     refused, so the answer the card exists to take does not land.
//
// ⚠⚠ WHAT THIS DOES **NOT** DO, SAID HERE SO NOBODY READS MORE INTO A GREEN RUN. `<StoreError />` is
// a SURFACE, not a control. It makes an invisible dead end visible, and on the cross-tab path it
// tells the player to reload – but it adds NO control that leads anywhere. On these five cards every
// control is still an answer to the refused question. Whether that row earns a control of its own is
// the owner's call and carries copy, so it stays open as a DRAFT for his pass; no Reload button is
// added here and no sentence is drafted.
//
// =================================================================================================
// ⚠⚠⚠ THE POPUP LAW IS THE REAL WORK IN THIS FILE, NOT THE FIVE LINES
// =================================================================================================
//
// CLAUDE.md: round-20 #3 shipped `TourBriefingDialog` with one honest sentence too many on the shared
// `.dialog-card`, the dismiss control left a 375x667 screen, and because it is a BLOCKING overlay the
// owner's career stopped there and could not be resumed. This wave LENGTHENS five blocking overlays.
// These five have no dismiss control at all, so the control that must stay reachable is THE LAST
// ANSWER – and that is what every fit case below measures, with the refusal up, which is the tallest
// each card can ever be.
//
// ⚠ THE SENTENCE IS PRODUCED, NOT TYPED (CLAUDE.md invariant 4, and «read from source, not
// invented»). `longestRefusal()` drives the REAL worker through the REAL store: a career with an open
// knock is asked to skip 52 weeks – the `▶▶ 52 (dev)` span, which ships in every build – and
// `sim.worker.ts`'s `decisionOpen` guard refuses it. Whatever the store wrote into `error` is what
// the five cards are measured with. A literal typed here would be a second copy of the owner's copy
// and would keep passing on a build where the store had stopped writing one.
//
// ⚠ AND «THE LONGEST» IS A MEASURED CLAIM RATHER THAN MINE. Census over `src/` on 26.09, longest
// single-line refusal literal per file, in characters:
//
//     125  src/worker/sim.worker.ts   'A decision is open – resolve the tournament or knock (…)'  <- used
//     107  src/engine/world/psychologist.ts
//      91  src/engine/world.ts
//      82  src/engine/world/masseur.ts
//      79  src/stores/game.ts         the SAVE_CONFLICT line – the longest the store writes ITSELF
//
// The 125-character one is not merely the longest: it is the refusal these five cards are MOST
// exposed to, because the five of them ARE the open decisions that guard names (`openQuestions`,
// world/multiWeek.ts, lists knock / birthday / life / retirement / shoot-clash among its eight). The
// store half of that table is re-derived mechanically below (`storeOwnSentences`), so a future wave
// that writes a longer sentence into `error` reddens this file and tells the next hand to re-pick
// instead of leaving a stale number in prose.
//
// ⚠⚠ AND THE CONTENT-INDEPENDENT HALF IS THE ONE THAT ACTUALLY HOLDS. `.dialog-card` declares
// `max-height: 100%` and `overflow-y: auto` (src/style.css), so once the card is bounded and scrolls
// NO amount of future copy can push the last answer off the screen. Every fit case asserts that cap
// as well as today's box, which is what round-20 #4 asked for.
//
// ⚠ MUTATION ARMS – each applied, watched red, reverted. Outputs quoted in the wave's report:
//   A. THE SURFACE, five arms: `<StoreError />` deleted from each card in turn -> that card's
//      «renders the store's sentence» case red, naming it.
//   B. THE FIT, in TWO shipped cases (the repo's own idiom – round42-select-confirm.test.ts and
//      r2-07-dialog-shell.test.ts both carry the weak half). Nothing in `src/` is touched in either.
//      B1, the WEAK half: `max-height` stripped off the card in the test layer -> red on the cap
//      declaration, which proves the declaration is being read. Measured, all five:
//        «card 343x455/470/634/315/538, cap NONE … the card declares no height bound that fits».
//      B2, THE ROUND-20 DEFECT ITSELF, which is what the law asks for – the row this wave added is
//      lengthened (16 copies of the store's own sentence) with the cap off, and the LAST ANSWER
//      really leaves the screen. Measured, all five, against a 667px viewport:
//        KnockDialog      card 1190  last answer y=867..911
//        ShootClashDialog card 1205                y=861..919
//        BirthdayDialog   card 1370                y=957..1001
//        LifeBeatDialog   card 1050                y=797..841
//        RetirementDialog card 1273                y=888..953
//      ...and the same over-long row with the cap PUT BACK is green on all five, which is what says
//      the cap – not the length of today's copy – is what protects the player.
//   C. THE ANTI-VACUITY HALF, five arms: `v-if="game.error"` -> `v-if="true"` in StoreError.vue ->
//      all five «shows nothing when nothing was refused» cases red.
import 'fake-indexeddb/auto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
// ⚠ THE REAL STYLESHEET, or `.dialog-card`'s cap is not in the cascade and every measurement below is
// vacuous – the same reason tour-briefing.test.ts and r2-07-dialog-shell.test.ts import it.
import '../../src/style.css'
import { assertDismissReachable, measureDialog, setViewport, NARROW_PHONE, PHONE, type Viewport } from './fits'
import KnockDialog from '../../src/components/KnockDialog.vue'
import ShootClashDialog from '../../src/components/ShootClashDialog.vue'
import BirthdayDialog from '../../src/components/BirthdayDialog.vue'
import LifeBeatDialog from '../../src/components/LifeBeatDialog.vue'
import RetirementDialog from '../../src/components/RetirementDialog.vue'
import { workerHarness } from '../helpers/workerHarness'
import { adoptAutosave } from '../../src/db/saves'
import {
  createWorld,
  decideKnock,
  pendingBirthday,
  pendingKnock,
  shootMoveTarget,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { adOfferId } from '../../src/engine/offers'
import { ECONOMY } from '../../src/engine/economy'
import { resumeMain, rngFromSeed } from '../../src/engine/rng'
import { careerSnapshot } from '../helpers/career'
import {
  DEFAULT_PROFILE,
  type KnockPrompt,
  type LifeBeatPrompt,
  type Snapshot,
} from '../../src/shared/protocol'
import type { SeasonEvent } from '../../src/engine/season/types'

// ⚠ THIS RUNNER HAS NO localStorage AND SOME OF THESE COMPONENTS REACH IT THROUGH THE STORE. The same
// shim round36-error-surfaces.test.ts installs, for the reason quoted there: supply the browser's own
// object rather than weaken the app to suit the runner.
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

/** The fields this file reads off a reply – the harness's `Reply` stays local by its own rule. */
interface Reply {
  id: number
  ok: boolean
  code?: string
  error?: string
}

const harness = vi.hoisted(() => ({ send: null as null | ((m: unknown) => Promise<unknown>) }))
vi.mock('../../src/worker/client', () => ({
  WorkerRestartError: class extends Error {},
  request: async (msg: unknown) => structuredClone(await harness.send!(structuredClone(msg))),
}))
import { useGameStore } from '../../src/stores/game'

// ⚠ AT MODULE SCOPE, before the dynamic import of the worker in `beforeAll`: the worker module
// assigns `self.onmessage` while it evaluates.
const { send, workerGlobal } = workerHarness<Reply>()
harness.send = send as (m: unknown) => Promise<unknown>

// ⚠⚠ AUTO-UNMOUNT, AND IT IS LOAD-BEARING IN A FILE FULL OF FOCUS TRAPS – r2-07-dialog-shell.test.ts's
// own argument, quoted there in full: `useDialogFocus` registers a keydown listener on `document`, and
// a wrapper left mounted by a FAILED assertion keeps a live trap over every later case.
enableAutoUnmount(afterEach)

// =================================================================================================
// THE SENTENCE, PRODUCED BY THE SHIPPED CODE
// =================================================================================================

/** ⭐ THE LONGEST REFUSAL THESE FIVE CARDS CAN CARRY, driven end to end: a real career with a real
 *  open question, the real worker, the real store. `▶▶ 52 (dev)` is on More's Saves tab and ships in
 *  EVERY build (an owner ruling – the deployed build is the playtest device), so a blocking card and
 *  a refused skip really do stand on the glass together. */
async function longestRefusal(): Promise<string> {
  setActivePinia(createPinia())
  const game = useGameStore()
  const world = createWorld('w2-card-refusal', DEFAULT_PROFILE)
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < 400 && !pendingKnock(world); i++) tickWeek(world, rng)
  expect(pendingKnock(world), 'the fixture never reached an open question').toBe(true)
  await adoptAutosave(world)
  await game.loadCareer(world.careerId)
  expect(game.error, 'the fixture load was itself refused').toBe('')

  await game.tick(52)
  const sentence = game.error
  expect(sentence, 'the store writes a sentence when a skip is refused over an open card').not.toBe('')
  return sentence
}

/** Every sentence `stores/game.ts` writes into `error` ITSELF, read off its own source – so the
 *  «longest» claim above is re-derived on every run instead of standing as prose.
 *
 *  ⚠ `fileURLToPath` AND `join`, NOT `new URL(rel, base)`: happy-dom replaces the global `URL` with
 *  its own window class, which refuses the two-argument form here («Invalid URL», measured 26.09) –
 *  so a relative read spelled the ordinary way fails only in the component project. */
function storeOwnSentences(): string[] {
  const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'stores', 'game.ts'), 'utf8')
  const found = [...src.matchAll(/this\.error = '([^']+)'/g)].map((m) => m[1])
  expect(found.length, 'the store still writes sentences of its own').toBeGreaterThanOrEqual(4)
  return found
}

// =================================================================================================
// THE FIVE CARDS – real prompts, in the wire's own shapes, and the LAST ANSWER on each
// =================================================================================================

/** A knock prompt in the wire's shape. FIXTURE strings, not copy – round42-select-confirm.test.ts's
 *  own fixture and its own argument: the words the player reads come from `buildKnockPrompt`. */
const KNOCK: KnockPrompt = {
  part: 'hip',
  repeat: false,
  line: 'FIXTURE – she came off court rubbing it.',
  read: 'FIXTURE – the coach thinks a week off would settle it.',
  restCost: 'FIXTURE rest cost sentence.',
  pushCost: 'FIXTURE push cost sentence.',
  cause: 'FIXTURE – the week we set was a hard one.',
}

/** A life beat – life-beat-dialog.test.ts's fixture shape, `confirm` included. */
const BEAT: LifeBeatPrompt = {
  week: 640,
  kind: 'fork-opinion',
  heading: 'FIXTURE heading',
  said: 'FIXTURE line of hers.',
  options: [
    { id: 'back-her', label: 'FIXTURE answer one' },
    { id: 'press-other-way', label: 'FIXTURE answer two' },
  ],
  followUps: [],
  confirm: 'FIXTURE proceed',
}

const WATCH = {
  brand: ECONOMY.advertising.categories.watches.houses[0],
  cashCents: ECONOMY.advertising.categories.watches.feeCentsByBand[1]!,
  termWeeks: 52,
}
const CLASH = 216
const AT = CLASH - 1

/** The shoot/tournament collision, built the way round29-shoot-clash-ui.test.ts builds it – a signed
 *  campaign naming `CLASH` and an entry she holds for the same week, world standing the week before. */
function clashWorld(seed: string): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = AT
  world.fundsCents = 500_000_00
  const event: SeasonEvent = {
    id: `${seed}-event`,
    week: CLASH,
    tier: 'local',
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: AT - 2,
  }
  world.season = [event]
  world.entries = [event.id]
  world.offers.push({
    id: adOfferId(AT - 10),
    kind: 'ad',
    week: AT - 10,
    deadlineWeek: AT - 7,
    state: 'signed',
    decidedWeek: AT - 10,
    fromWeek: AT - 10,
    untilWeek: AT - 10 + WATCH.termWeeks - 1,
    terms: {
      brand: WATCH.brand,
      cashCents: WATCH.cashCents,
      termWeeks: WATCH.termWeeks,
      shootCount: 2,
      shootWeeks: [CLASH, CLASH + 21],
    },
  })
  // The move arm is conditional on there being a week left in the term (ShootClashDialog's own note),
  // so the four-answer card – the tallest of the five – is the one measured rather than a three.
  expect(shootMoveTarget(world, CLASH), 'the fixture must offer the move arm, or the card is a three').not.toBeNull()
  return world
}

/** A career standing at a birthday, birthday-dialog.test.ts's own fixture. */
function birthdaySnapshot(seed: string): Snapshot {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 6, birthDay: 15, coachTier: 'self' })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 60 && pendingBirthday(world) === null; i++) {
    if (pendingKnock(world)) decideKnock(world, 'rest')
    tickWeek(world, rng)
  }
  expect(pendingBirthday(world), 'the fixture never reached a birthday').not.toBeNull()
  return toSnapshot(world)
}

/** The retirement offer, r2-07-dialog-shell.test.ts's own fixture – the ORDINARY winter, which draws
 *  both answers, so the control measured is the second of two rather than a lone one. */
function retirementSnapshot(seed: string): Snapshot {
  const snap = careerSnapshot(8, seed)
  return { ...snap, ageYears: 30, retirementOffer: { askedWeek: snap.week, seasonIndex: 3, reason: 'age', final: false } }
}

interface Staged {
  w: VueWrapper
  card: Element
  /** the LAST answer control in the card's flow – the thing that must stay reachable */
  answer: Element
}

interface Surface {
  name: string
  /** the card, brought to the state a refusal can arrive in, with its last answer control */
  stage: () => Promise<Staged>
}

/** ⚠ THE ORDER IS ALWAYS setViewport -> set the error -> MOUNT. happy-dom evaluates a media query on
 *  an element's FIRST computed-style read and caches it (fits.ts's own note), and the error row is a
 *  fresh element either way – but the card is not, so a viewport set after the mount measures the
 *  previous screen. */
function open(error: string, vp: Viewport): void {
  setViewport(vp)
  useGameStore().error = error
}

const SURFACES: Surface[] = [
  {
    name: 'KnockDialog',
    stage: async () => {
      useGameStore().snapshot = { ...toSnapshot(createWorld('w2-knock-fit', DEFAULT_PROFILE)), knockPrompt: KNOCK }
      const w = mount(KnockDialog, { attachTo: document.body })
      const card = document.querySelector('.knock-dialog')!
      // The Proceed is the one control that records, and it appears only once a branch is selected –
      // which is the state a refusal can ever arrive in.
      document.querySelectorAll<HTMLButtonElement>('button.knock-choice')[1].click()
      await w.vm.$nextTick()
      const answer = card.querySelector('.knock-proceed')!
      expect(answer, 'KnockDialog: the Proceed is up – nothing below is vacuous').toBeTruthy()
      expect(card.lastElementChild, 'KnockDialog: the Proceed is still the last element').toBe(answer)
      return { w, card, answer }
    },
  },
  {
    name: 'ShootClashDialog',
    stage: async () => {
      useGameStore().snapshot = toSnapshot(clashWorld('w2-clash-fit'))
      const w = mount(ShootClashDialog, { attachTo: document.body })
      const card = document.querySelector('.shoot-clash-dialog')!
      const choices = card.querySelector('.knock-choices')!
      expect(choices.children.length, 'ShootClashDialog: all four answers are drawn').toBe(4)
      const answer = choices.lastElementChild!
      expect(answer.textContent, 'ShootClashDialog: the last answer is «Do both»').toContain('Do both')
      expect(card.lastElementChild, 'ShootClashDialog: the answers are still last').toBe(choices)
      return { w, card, answer }
    },
  },
  {
    name: 'BirthdayDialog',
    stage: async () => {
      useGameStore().snapshot = birthdaySnapshot('w2-bday-fit')
      const w = mount(BirthdayDialog, { attachTo: document.body })
      const card = document.querySelector('.birthday-dialog')!
      document.querySelectorAll<HTMLButtonElement>('button.birthday-choice')[3].click()
      await w.vm.$nextTick()
      const answer = card.querySelector('.birthday-proceed')!
      expect(answer, 'BirthdayDialog: the Proceed is up – nothing below is vacuous').toBeTruthy()
      expect(card.lastElementChild, 'BirthdayDialog: the Proceed is still the last element').toBe(answer)
      return { w, card, answer }
    },
  },
  {
    name: 'LifeBeatDialog',
    stage: async () => {
      useGameStore().snapshot = {
        ...toSnapshot(createWorld('w2-beat-fit', DEFAULT_PROFILE)),
        lifeBeatPrompt: BEAT,
      }
      const w = mount(LifeBeatDialog, { attachTo: document.body })
      const card = document.querySelector('.life-beat-dialog')!
      document.querySelectorAll<HTMLButtonElement>('button.life-beat-choice')[0].click()
      await w.vm.$nextTick()
      const answer = card.querySelector('.life-beat-proceed')!
      expect(answer, 'LifeBeatDialog: the Proceed is up – nothing below is vacuous').toBeTruthy()
      expect(card.lastElementChild, 'LifeBeatDialog: the Proceed is still the last element').toBe(answer)
      return { w, card, answer }
    },
  },
  {
    name: 'RetirementDialog',
    stage: async () => {
      useGameStore().snapshot = retirementSnapshot('w2-retire-fit')
      const w = mount(RetirementDialog, { attachTo: document.body })
      const card = document.querySelector('.retire-card')!
      const answers = card.querySelector('.retire-answers')!
      expect(answers.children.length, 'RetirementDialog: the ordinary winter draws both answers').toBe(2)
      const answer = answers.lastElementChild!
      expect(answer.textContent, 'RetirementDialog: the last answer is «One more year»').toContain('One more year')
      expect(card.lastElementChild, 'RetirementDialog: the answers are still last').toBe(answers)
      return { w, card, answer }
    },
  },
]

let SENTENCE = ''

beforeAll(async () => {
  await import('../../src/worker/sim.worker')
  expect(workerGlobal.onmessage, 'the real worker module installed its handler').not.toBeNull()
  SENTENCE = await longestRefusal()
})

beforeEach(() => {
  setActivePinia(createPinia())
  backing.clear()
  document.body.innerHTML = ''
  setViewport(PHONE)
})

describe('⭐⭐ W2 – the sentence the five blind cards are measured with', () => {
  it('⭐ it is the store\'s own, produced by the shipped code, and the LONGEST it can put on them', () => {
    expect(SENTENCE.length, 'a refusal the player could read in one glance is not the case to size for').toBeGreaterThan(
      80,
    )
    const own = storeOwnSentences()
    const longestOwn = own.reduce((a, b) => (b.length > a.length ? b : a))
    // If this ever reverses, the sentence above has stopped being the worst case and the next hand
    // re-picks it – which is the point of deriving the table rather than writing the number down.
    expect(
      SENTENCE.length,
      `the store now writes a longer sentence itself (${longestOwn.length} chars) than the refusal these ` +
        `cases size the cards with (${SENTENCE.length}) – re-pick the worst case`,
    ).toBeGreaterThan(longestOwn.length)
  })
})

for (const surface of SURFACES) {
  describe(`⭐⭐ W2 – ${surface.name} can say it was refused, and its last answer stays on the phone`, () => {
    it('renders the store\'s sentence, in the one element that owns it', async () => {
      open(SENTENCE, PHONE)
      const { card } = await surface.stage()
      const line = card.querySelector('.error')
      expect(line, `${surface.name} still has nowhere to say a refusal`).toBeTruthy()
      expect(line!.textContent).toBe(SENTENCE)
      // A polite live region, so a sentence that appears without moving focus is announced by
      // something – StoreError.vue's own `role="status"`.
      expect(line!.getAttribute('role')).toBe('status')
    })

    it('...and shows nothing when nothing was refused', async () => {
      // The anti-vacuity half: a card that drew an empty row on every ordinary week would pass the
      // case above and be a regression on five blocking overlays.
      open('', PHONE)
      const { card } = await surface.stage()
      expect(card.querySelector('.error'), `${surface.name} draws an empty notice`).toBeNull()
    })

    it('⚠⚠ the LAST ANSWER is inside 375x667 with the refusal up, and the card scrolls', async () => {
      open(SENTENCE, PHONE)
      const { card, answer } = await surface.stage()
      expect(card.querySelector('.error'), 'the line is on the card being measured').toBeTruthy()
      const fit = assertDismissReachable(card, answer, PHONE, `${surface.name} (refusal up)`)
      // The scrim leaves 667 - 2x16 = 635 and the card is bounded by it. This is the half that still
      // holds after the next honest sentence, and it is the actual round-20 #4 fix.
      expect(fit.available.height, 'the scrim still leaves 635px').toBe(635)
      expect(fit.cap, 'the card declares a bound that fits').toBeLessThanOrEqual(635)
      expect(fit.scrollable, 'and what is past the fold can be reached').toBe(true)
    })

    it('⚠ ...and on the narrowest screen the app supports', async () => {
      open(SENTENCE, NARROW_PHONE)
      const { card, answer } = await surface.stage()
      assertDismissReachable(card, answer, NARROW_PHONE, `${surface.name} (refusal up, narrow)`)
    })

    it('⚠⚠ MUTATION PROOF – strip the cap and the SAME assertion goes red', async () => {
      // «A fit test that cannot fail on the too-tall version is not this test» (CLAUDE.md). The cap is
      // the shared `.dialog-card`'s, so the arm strips it in the TEST layer – `src/` is untouched, the
      // same way round42-select-confirm.test.ts and r2-07-dialog-shell.test.ts take theirs. This is
      // the WEAK arm: it proves the declaration is being read, not that this card would really
      // overflow. The case below is the strong one.
      open(SENTENCE, PHONE)
      const { card, answer } = await surface.stage()
      assertDismissReachable(card, answer, PHONE, `${surface.name} (bounded)`)
      ;(card as HTMLElement).style.maxHeight = 'none'
      const after = measureDialog(card, answer, PHONE)
      expect(after.cap, 'the cap survived the mutation, so the check below would be vacuous').toBe(Infinity)
      expect(
        () => assertDismissReachable(card, answer, PHONE, `${surface.name} (cap removed)`),
        `${surface.name}: the cap could be removed and this file would not notice`,
      ).toThrow(/outside the viewport|taller than the screen|declares no height bound/)
      // ...and putting it back is green again, which is what says the CAP is what holds.
      ;(card as HTMLElement).style.maxHeight = ''
      assertDismissReachable(card, answer, PHONE, `${surface.name} (cap restored)`)
    })

    it('⚠⚠⚠ MUTATION PROOF – round-20 #3 ITSELF: grow the refusal row and the LAST ANSWER leaves the screen', async () => {
      // ⭐⭐ THE STRONG ARM, and the one the task of this wave actually names: «lengthen the card until
      // the control leaves the screen and watch the assertion redden». The row this wave added is the
      // thing lengthened – sixteen copies of the store's own sentence, which is the house idiom for a
      // content arm (fits.ts's ledger tripled a surname; round42-select-confirm.test.ts repeats its
      // beat 22 times). Nothing in `src/` is touched: the sentence is set on the store and the cap is
      // stripped in the test layer.
      //
      // ⚠ THE THIRD ASSERTION IS THE POINT OF THE OTHER TWO. Same over-long row, cap PUT BACK, green –
      // so what protects the player from the next honest sentence is the cap and not the length of
      // today's copy. That is exactly the property round-20 #4 asked for.
      open(SENTENCE, PHONE)
      const { w, card, answer } = await surface.stage()
      const bounded = measureDialog(card, answer, PHONE)

      useGameStore().error = new Array(16).fill(SENTENCE).join(' ')
      await w.vm.$nextTick()
      ;(card as HTMLElement).style.maxHeight = 'none'
      const grown = measureDialog(card, answer, PHONE)
      expect(grown.contentFloor, 'the arm did not actually make the card taller').toBeGreaterThan(
        bounded.contentFloor + 400,
      )
      expect(
        () => assertDismissReachable(card, answer, PHONE, `${surface.name} (row grown, cap removed)`),
        `${surface.name}: the last answer is at y=${grown.dismissTop.toFixed(0)}..${grown.dismissBottom.toFixed(0)} ` +
          'and this file called that reachable',
      ).toThrow(/outside the viewport/)

      ;(card as HTMLElement).style.maxHeight = ''
      const capped = assertDismissReachable(card, answer, PHONE, `${surface.name} (row grown, cap back)`)
      expect(capped.scrollable, 'the over-long row is reachable by scrolling').toBe(true)
      expect(capped.cardHeight, 'the cap, not the copy, is what bounds the card').toBeLessThanOrEqual(635)
    })
  })
}

// =================================================================================================
// ⭐ THE NUMBERS, IN ONE PLACE – the five boxes the owner's report quotes, with and without the line
// =================================================================================================
//
// One case rather than five, because the claim is comparative: the row is 8px of margin plus one
// 13px line, so a card whose last answer MOVED by more than a line's worth is a card whose paint
// order the row disturbed.
describe('⭐ W2 – what the refusal row costs each card, measured', () => {
  it('the last answer stays inside the phone with the line and without it, on all five', async () => {
    const rows: string[] = []
    for (const surface of SURFACES) {
      document.body.innerHTML = ''
      setActivePinia(createPinia())
      open('', PHONE)
      const quiet = await surface.stage()
      const before = measureDialog(quiet.card, quiet.answer, PHONE)
      quiet.w.unmount()

      document.body.innerHTML = ''
      setActivePinia(createPinia())
      open(SENTENCE, PHONE)
      const loud = await surface.stage()
      const after = measureDialog(loud.card, loud.answer, PHONE)
      loud.w.unmount()

      rows.push(
        `${surface.name}: quiet y=${before.dismissTop.toFixed(0)}..${before.dismissBottom.toFixed(0)} ` +
          `(content ${before.contentFloor.toFixed(0)}, card ${before.cardHeight.toFixed(0)}) | ` +
          `refusal y=${after.dismissTop.toFixed(0)}..${after.dismissBottom.toFixed(0)} ` +
          `(content ${after.contentFloor.toFixed(0)}, card ${after.cardHeight.toFixed(0)})`,
      )
      for (const [label, fit] of [['quiet', before], ['refusal', after]] as const) {
        expect(fit.dismissTop, `${surface.name} (${label}): the last answer starts above the screen\n${rows.join('\n')}`).toBeGreaterThanOrEqual(0)
        expect(fit.dismissBottom, `${surface.name} (${label}): the last answer ends below the screen\n${rows.join('\n')}`).toBeLessThanOrEqual(PHONE.height)
      }
      // The row really is on the loud card and really is absent from the quiet one, or the pair above
      // is two measurements of the same thing.
      expect(after.contentFloor, `${surface.name}: the refusal row added no height at all`).toBeGreaterThan(
        before.contentFloor,
      )
    }
    // Printed once, deliberately: these are the five numbers the wave's report quotes.
    console.info(`W2 phone fit, 375x667:\n  ${rows.join('\n  ')}`)
  })
})
