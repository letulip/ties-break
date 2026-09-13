// ROUND 39 #15a/#15b – THE INJURY MOMENT SAYS SHE WILL BE ALRIGHT, AND THE REST OPTION GOT ITS HUG.
//
// THE OWNER, item 15a: «В прологе во время травмы нужно как-то аккуратно объяснить игроку, что всё
// нормально и ребёнок выживет и вернётся в строй.» The one injury the prologue can show is the
// in-match retirement popup (`.mv-hurt`) during a Local Open – a child goes down, the popup said she
// «could not continue», and then nothing said she recovers, because a prologue weekend stores no
// injury and no layoff report ever follows. The reassurance is `LOCAL_OPEN_COPY.hurtNote` now, in
// the copy table like every prologue sentence, handed to the viewer as an optional note.
//
// Item 15b: «И вообще чуть больше тепла в этих экранах надо сделать … Например на варианте rest
// добавить hug и ещё как-то над самим текстом подумать.» The one control named `rest` in the game is
// the knock dialog's (`decide('rest')`, «Rest it»), whose copy is the engine's (`buildKnockPrompt`),
// so the hug lands in `restCost` – and the push branch deliberately stays cold, because it is a
// warning.
//
// ⚠ MOUNTED, NOT SOURCE-PINNED (CLAUDE.md's own gotcha): every claim here is about RENDERED copy on
// the surface the player actually meets. MUTATION-VERIFIED, three arms, each restored:
//   * the `hurtNote` paragraph removed from MatchViewer's popup -> the popup test goes red and the
//     no-note CONTROL stays green (which is what says the control is a control);
//   * the `:hurt-note` binding removed from PrologueLocalOpen -> the wiring test goes red;
//   * `restCost` reverted to the pre-39 sentence -> the hug test goes red on the rest button.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

// Both dialogs play a cue on mount; audio has no business in a copy test (the injury-surfacing
// file's own rule).
vi.mock('../../src/audio/sfx', () => ({
  playSfx: () => {},
  primeSfx: () => {},
  initSfx: () => {},
  installGlobalSfx: () => {},
  isMuted: () => false,
  setMuted: () => {},
}))

import MatchViewer from '../../src/components/MatchViewer.vue'
import PrologueLocalOpen from '../../src/components/PrologueLocalOpen.vue'
import KnockDialog from '../../src/components/KnockDialog.vue'
import ChildhoodPrologue from '../../src/components/ChildhoodPrologue.vue'
import { finishCard } from './prologueLanding'
import InjuryStopDialog from '../../src/components/InjuryStopDialog.vue'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import { KID_ID, type WorldState } from '../../src/engine/world'
import { buildInjuryReport } from '../../src/engine/world/snapshot'
import { buildKnockPrompt } from '../../src/engine/knock'
import { SKILL_KEYS, STARTING_SKILL_BAND } from '../../src/engine/development'
import { LOCAL_OPEN_COPY, PROLOGUE_CARDS, localOpenCard } from '../../src/prologue/cards'
import { playLocalOpen, sheRetiredIn } from '../../src/prologue/pool'
import { useGameStore } from '../../src/stores/game'
import type { AnnotatedMatch } from '../../src/viz/types'
import type { MatchOptions, MatchPlayer, Side } from '../../src/engine/match/types'
import type { Snapshot } from '../../src/shared/protocol'

const SKIP_LABEL = 'Skip to the result'

function player(overrides: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id: 'p', name: 'P', serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, ...overrides }
}

/** The same fixture shape tests/component/match-viewer.test.ts uses for its popup block: a real
 *  seeded match with HER in it and a retirement written on the record – `result.retired` is the only
 *  fact the viewer reads about it, and the engine writes exactly this shape (match/types.ts). */
function herRetirement(side: Side = 0) {
  const a = player({ id: 'a', name: 'Vera Novak', serve: 62 })
  const b = player({ id: 'b', name: 'Ines Duval', serve: 48 })
  const opts: MatchOptions = { surface: 'hard', tour: JUNIOR_TOUR, seed: 'r39-15a' }
  const match = annotateMatch(simulateMatch(a, b, opts), a, b, opts)
  const her = { ...a, id: KID_ID }
  const hurt: AnnotatedMatch = {
    ...match,
    result: { ...match.result, retired: { side, pointNumber: match.points.length } },
  }
  return { her, opp: b, match: hurt }
}

function mountHurt(hurtNote: string | null) {
  const { her, opp, match } = herRetirement()
  return mount(MatchViewer, {
    props: {
      match,
      playerA: her,
      playerB: opp,
      surface: 'hard' as const,
      mode: 'replay' as const,
      proceedLabel: 'Go on',
      // ⚠ null exercises the DEFAULT ARM the career surfaces ride on – see the control below.
      ...(hurtNote === null ? {} : { hurtNote }),
    },
  })
}

async function press(w: VueWrapper, label: string): Promise<void> {
  const btn = w.findAll('button').find((b) => b.text() === label)
  expect(btn, `no control labelled "${label}"`).toBeTruthy()
  await btn!.trigger('click')
  await nextTick()
}

describe('#15a – the prologue injury moment says she recovers and comes back', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the copy exists, and it actually reassures – she is alright, and she plays again', () => {
    const t = LOCAL_OPEN_COPY.hurtNote
    expect(t.length).toBeGreaterThan(20)
    // The two halves of his sentence: «всё нормально» and «вернётся в строй».
    expect(t).toContain('alright')
    expect(t).toContain('play again')
    // ...and it keeps the table's own three rules, which `everySentence()` in
    // tests/prologue-cards.test.ts does not reach for this table: no digits, no Cyrillic, the short
    // dash only. A copy field outside the sweep must not be a copy field outside the rules.
    expect(t).not.toMatch(/\d/)
    expect(t).not.toMatch(/[А-Яа-яЁё]/)
    expect(t).not.toContain('—')
  })

  it('⚠ with the note passed, the retirement popup carries the reassurance under its reason', async () => {
    const w = mountHurt(LOCAL_OPEN_COPY.hurtNote)
    await press(w, SKIP_LABEL)
    const dialog = w.find('.mv-hurt')
    expect(dialog.exists(), 'no popup for an injury inside the match').toBe(true)
    // The moment still says what it always said...
    expect(dialog.text()).toContain('could not continue')
    // ...and now the parent's line is on it.
    expect(dialog.text()).toContain(LOCAL_OPEN_COPY.hurtNote)
    w.unmount()
  })

  it('⚠ CONTROL – without the note, the popup is byte-for-byte the career one: no reassurance', async () => {
    // In the career the same moment opens a real layoff and `InjuryStopDialog` still owes its
    // report – «she is alright» there would be a lie contradicted one screen later. Every existing
    // caller passes nothing, so the default arm must draw nothing.
    const w = mountHurt(null)
    await press(w, SKIP_LABEL)
    const dialog = w.find('.mv-hurt')
    expect(dialog.exists()).toBe(true)
    expect(dialog.text()).not.toContain(LOCAL_OPEN_COPY.hurtNote)
    expect(w.find('.mv-hurt-note').exists()).toBe(false)
    w.unmount()
  })

  it('⚠ the WIRING – the prologue weekend hands the viewer exactly the table sentence', async () => {
    // The prologue's own girl, mid-band like tests/component/prologue-local-open.test.ts builds her.
    const skills = {} as Record<string, number>
    for (const k of SKILL_KEYS) {
      const [lo, hi] = STARTING_SKILL_BAND[k]
      skills[k] = Math.round((lo + hi) / 2)
    }
    const kid = { id: KID_ID, name: 'Vera Novak', age: 10, ...skills } as MatchPlayer
    const open = playLocalOpen('r39-15a-wiring', kid, 10)
    const w = mount(PrologueLocalOpen, { props: { open, kid, seed: 'r39-15a-wiring' } })
    await press(w, LOCAL_OPEN_COPY.begin)
    await press(w, LOCAL_OPEN_COPY.watchMatch)
    const viewer = w.findComponent(MatchViewer)
    expect(viewer.exists(), 'the weekend never reached its match').toBe(true)
    // The binding, not the rendering: a retirement is ~2.7% of matches, so the popup itself is
    // exercised on the synthetic fixture above and the prologue's contribution – passing the table's
    // sentence – is asserted where it is deterministic.
    expect(viewer.props('hurtNote')).toBe(LOCAL_OPEN_COPY.hurtNote)
    w.unmount()
  })
})

describe('#15b – the rest option carries the hug, and the cost is still legible', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function mountKnock(repeat = false) {
    const game = useGameStore()
    const prompt = buildKnockPrompt(
      { part: 'ankle', sinceWeek: 8, repeat, choice: null, untilWeek: 8 },
      'r39-15b',
      80,
    )
    game.$patch({ snapshot: { week: 8, knockPrompt: prompt } as unknown as Snapshot })
    return { w: mount(KnockDialog), prompt }
  }

  it('⚠ the REST button says hug; the PUSH button stays a cold warning', () => {
    const { w, prompt } = mountKnock()
    // The engine string first, so a failure names the source file...
    expect(prompt.restCost, 'buildKnockPrompt.restCost lost the hug').toContain('hug')
    // ...then the rendered surface, which is the claim the item is about.
    const [rest, push] = w.findAll('.knock-choice')
    expect(rest.text()).toContain('Rest it')
    expect(rest.text()).toContain('hug')
    expect(push.text()).toContain('Train through it')
    expect(push.text()).not.toContain('hug')
    w.unmount()
  })

  it('the warmth did not blur the price – the cost clause survives verbatim, on every knock', () => {
    for (const repeat of [false, true]) {
      const { w } = mountKnock(repeat)
      const [rest] = w.findAll('.knock-choice')
      // The legibility rule this dialog exists for (engine/knock.ts §5): the player must see what
      // he traded, in the currency he traded it in.
      expect(rest.text()).toContain('That week of work is gone.')
      expect(rest.text()).toContain('hug')
      w.unmount()
    }
  })
})

// =================================================================================================
// ROUND 39 #15a, WAVE D2 – THE BEAT THE PARENT CAN HOLD, AND THE CAREER'S APPROVED WARM LINE
// =================================================================================================
//
// THE OWNER, 08.09, on wave D's shipped line: «да, вот в этом и дело может быть, мне жена сказала
// "мой ребенок травмировался, а я даже ничего не поняла, ни обнять, ни понять что дальше". Надо
// как-то это обыграть, если травма вообще случилась. Тёплые варианты ок - делаем.»
//
// Her report names the two halves the popup's one line cannot carry: nothing to DO («ни обнять»)
// and no WHAT COMES NEXT («ни понять что дальше»). The build is ONE scene in the weekend's own
// result slot: when the resolved bracket says she retired (`sheRetiredIn`, pool.ts), the card after
// the weekend is `LOCAL_OPEN_COPY.hurt` – the hug as the card's only way on, the drive home and the
// quiet week as its lines – instead of one of the three faces. Same synthesis (`localOpenCard`),
// same component, zero new dialogs, ZERO draws on any stream: the flag is read off records
// `playMatch` already wrote. And «Тёплые варианты ок - делаем» lands wave D's drafted sentence on
// the career's own InjuryStopDialog, verbatim, nothing else on that card moved.
//
// ⚠ THE MOUNTED ARMS PIN `Math.random` FOR ONE CALL. `ChildhoodPrologue.freshSeed` is the walk's
// own idiom (UI-side randomness, outside the engine), so a mounted walk is a different weekend
// every run – which is exactly how a three-faces press was a latent flake (see the re-aims in
// round35-prologue / prologue-tournaments / prologue-two-paths). Pinning the one value that seeds
// the walk makes the ENGINE-ROLLED retirement reproducible: under `HURT_WALK` the real bracket at
// ten really contains `retiredId === KID_ID`, rolled by the real point engine – nothing is injected
// and no module is mocked. If a pool or engine draw-order change ever moves these brackets, the
// premise assertions below go red by name; re-search with the recipe in their comment.
//
// MUTATION-VERIFIED, each arm restored:
//   * `closeOpen`'s `hurt: sheRetiredIn(...)` forced to `false` -> the beat arm goes red (no hug
//     scene) while the CONTROL arm stays green, which is what says the control is a control;
//   * `sheRetiredIn` loosened to `m.retiredId !== undefined` -> the opponent-direction arm goes red
//     (her opponent's retirement would put the hug scene on HER weekend);
//   * the InjuryStopDialog line reverted to the pre-D2 sentence -> the career arm goes red.

/** The prologue's own girl, mid-band – the same construction the #15a wiring test uses. */
function midBandKid(): MatchPlayer {
  const skills = {} as Record<string, number>
  for (const k of SKILL_KEYS) {
    const [lo, hi] = STARTING_SKILL_BAND[k]
    skills[k] = Math.round((lo + hi) / 2)
  }
  return { id: KID_ID, name: 'Vera Novak', age: 10, ...skills } as MatchPlayer
}

/** Press the `.prologue-answer` whose label starts with `label` – origins, options and the way on
 *  all render in that one control column (PrologueCard.vue `choices`). */
async function pressAnswer(w: VueWrapper, label: string): Promise<void> {
  const btn = w.findAll('.prologue-answer').find((b) => b.text().startsWith(label))
  expect(btn, `no answer «${label}»: ${w.text().slice(0, 140)}`).toBeTruthy()
  // ⚠⚠ RE-AIMED BY ROUND 41 #9, NOT LOOSENED, AND THE THIRD ROUND TO AIM IT. Round 40 #3 held a
  // finished card 200 ms before advancing and this stepped that clock; round 41 #9 retired the hold
  // – a radio no longer advances anything, and the card stays until Proceed is pressed. So this
  // presses the answer and then the Proceed it produced (`finishCard`). ⚠ THE PINNED SEEDS AND THE
  // BRACKETS THEY RESOLVE ARE UNTOUCHED, which is the claim this file actually rests on: an extra
  // press draws no dice – `playLocalOpen` is called from `advanceYear`, which now runs on Proceed
  // instead of on a timer, with the same seed, the same age and the same index.
  await finishCard(w, () => btn!.trigger('click'))
  await Promise.resolve()
  await nextTick()
}

/** ⭐ THE REAL WALK TO THE TENTH WEEKEND, under a pinned seed – origin `middle`, the carried road,
 *  «Enter her» at ten, then the weekend left from its own header control. The seed value is the ONE
 *  `Math.random` call `freshSeed` makes at mount; everything after it is the shipped deterministic
 *  machinery (`rngFromSeed` sub-streams), so the whole walk is a function of `v`.
 *
 *  ⚠ RE-SEARCH RECIPE, should a draw-order change ever move the brackets: for candidate `v`, the
 *  walk's seed is `prologue-${(v.toString(36).slice(2) + '0000').slice(0, 8)}`; build her with
 *  `prologueEntrant(seed, KID_ID, default name, age, yearsLivedBy(run, age))` on this road and ask
 *  `sheRetiredIn(playLocalOpen(seed, kid, age, 0), KID_ID)` for ages 10..13. */
async function walkToTenthWeekend(v: number): Promise<VueWrapper> {
  const spy = vi.spyOn(Math, 'random').mockReturnValue(v)
  const w = mount(ChildhoodPrologue, { attachTo: document.body })
  spy.mockRestore()
  await pressAnswer(w, 'A city, and the bills are paid.')
  for (const age of [6, 7]) await pressAnswer(w, PROLOGUE_CARDS.find((c) => c.age === age)!.continueLabel)
  await pressAnswer(w, 'The club across town')
  await pressAnswer(w, 'Buy the hour, one to one')
  await pressAnswer(w, 'Enter her')
  // The weekend is a takeover now; leave it from its own header control – the beat may not depend
  // on the popup having been watched (the bracket is the authority, round 16 #19's rule).
  expect(w.find('.plo').exists(), 'entering her did not produce a weekend').toBe(true)
  const skip = w.find('.plo-skip')
  await skip.trigger('click')
  await Promise.resolve()
  await nextTick()
  return w
}

/** Pinned by the recipe above: under this value the REAL bracket at ten carries her retirement. */
const HURT_WALK = 0.15352697095435686
/** ...and under this one, no weekend of the whole carried road carries any retirement at all. */
const CLEAN_WALK = 0.004149377593360996

describe('#15a D2 – after she goes off hurt, the weekend ends on a beat the parent can hold', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐ the engine itself retires her in a real prologue bracket, and `sheRetiredIn` reads it', () => {
    const open = playLocalOpen('r39-d2-1', midBandKid(), 10)
    // The premise first, so a drift in the draws names itself: the field the ENGINE wrote.
    expect(
      open.result.matches.some((m) => m.retiredId === KID_ID),
      'seed r39-d2-1 no longer holds her retirement – re-search (see the header)',
    ).toBe(true)
    expect(sheRetiredIn(open, KID_ID)).toBe(true)
    // ...and she left that match a loser, so the weekend's own outcome machinery is untouched.
    expect(open.finish).toBeGreaterThan(0)
  })

  it('⚠ the DIRECTION – an opponent`s retirement is not hers, and raises no beat', () => {
    const open = playLocalOpen('r39-d2-2', midBandKid(), 10)
    expect(
      open.result.matches.some((m) => m.retiredId !== undefined && m.retiredId !== KID_ID),
      'seed r39-d2-2 no longer holds an opponent retirement – re-search (see the header)',
    ).toBe(true)
    expect(sheRetiredIn(open, KID_ID)).toBe(false)
  })

  it('⭐ the scene is a card row like the three faces – hug as the way on, both read arms one voice', () => {
    const row = localOpenCard(10, 'lost', true)
    expect(row.title).toBe(LOCAL_OPEN_COPY.hurt.title)
    expect(row.continueLabel).toBe(LOCAL_OPEN_COPY.hurt.continueLabel)
    expect(row.options, 'the beat asks nothing – it is a quiet card').toBeUndefined()
    // The rule cards 5..8 are written under: a scene may not claim to have read a childhood.
    expect(row.her.cool).toBe(row.her.warm)
    expect(row.coach.cool).toBe(row.coach.warm)
    // ...and the flag off is byte-identical to the shipped three faces.
    expect(localOpenCard(10, 'lost')).toEqual(localOpenCard(10, 'lost', false))
    expect(localOpenCard(10, 'lost').title).toBe(LOCAL_OPEN_COPY.result.lost.title)
  })

  it('⭐⭐ the REAL WALK: she retires at the Local Open, and the beat follows – hug, then the walk goes on', async () => {
    const w = await walkToTenthWeekend(HURT_WALK)
    expect(w.findComponent(PrologueLocalOpen).exists(), 'the weekend is still up').toBe(false)
    // The beat: the moment the parent was never given. Her report's two halves, on one card –
    // something to DO...
    expect(w.text()).toContain(LOCAL_OPEN_COPY.hurt.title)
    const hug = w.findAll('.prologue-answer').find((b) => b.text().startsWith(LOCAL_OPEN_COPY.hurt.continueLabel))
    expect(hug, 'no hug on the card').toBeTruthy()
    // ...and WHAT COMES NEXT: she recovers, the drive home, the quiet week.
    expect(w.text()).toContain(LOCAL_OPEN_COPY.hurt.lede)
    expect(w.text()).toContain(LOCAL_OPEN_COPY.hurt.her)
    expect(w.text()).toContain(LOCAL_OPEN_COPY.hurt.coach)
    // It REPLACES the three faces – one card, not a questline...
    for (const face of ['won', 'final', 'lost'] as const) {
      expect(w.text()).not.toContain(LOCAL_OPEN_COPY.result[face].title)
    }
    // ...and the hug is the only control, and pressing it is what moves the childhood on.
    expect(w.findAll('.prologue-answer')).toHaveLength(1)
    await hug!.trigger('click')
    await Promise.resolve()
    await nextTick()
    expect(w.find('.prologue-title').text()).toBe(PROLOGUE_CARDS.find((c) => c.age === 11)!.title)
    w.unmount()
  })

  it('⚠ CONTROL – a weekend she walks off ends on the three faces, and no hug anywhere', async () => {
    const w = await walkToTenthWeekend(CLEAN_WALK)
    const faces = (['won', 'final', 'lost'] as const).filter((f) =>
      w.text().includes(LOCAL_OPEN_COPY.result[f].title),
    )
    expect(faces, 'no result scene after the clean weekend').toHaveLength(1)
    expect(w.text()).not.toContain(LOCAL_OPEN_COPY.hurt.title)
    expect(w.text()).not.toContain(LOCAL_OPEN_COPY.hurt.continueLabel)
    expect(w.text()).not.toContain(LOCAL_OPEN_COPY.hurt.her)
    w.unmount()
  })
})

describe('#15a D2 – the career`s own injury popup opens warm, as approved', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐ the closing line is wave D`s drafted sentence, verbatim – and only that line moved', () => {
    // The same fixture shape tests/component/injury-surfacing.test.ts mounts the dialog off.
    const game = useGameStore()
    const injury = { kind: 'ankle strain', severity: 'moderate' as const, weeksRemaining: 5, totalWeeks: 5, sinceWeek: 40 }
    const world = { week: 40, injury: { ...injury }, events: [], entries: [], season: [] } as unknown as WorldState
    game.$patch({
      snapshot: {
        week: 40,
        ageYears: 16,
        careerId: 'c1',
        injury: { ...injury },
        injuryReport: buildInjuryReport(world),
        events: [],
      } as unknown as Snapshot,
    })
    const w = mount(InjuryStopDialog)
    // The approved sentence, whole – «Тёплые варианты ок - делаем» is about THIS literal line, so
    // the pin is his word and moves only with it (invariant 4).
    expect(w.text()).toContain('She comes back from this. Rest and rehab now – the news feed tracks her recovery.')
    // ...and it did not arrive as a rewrite: the clinical half survives inside it verbatim, and the
    // card around it is the one that shipped.
    expect(w.text()).toContain('Rest and rehab now – the news feed tracks her recovery.')
    expect(w.find('#injury-stop-title').text()).toBe("She's hurt.")
    expect(w.text()).toContain('Only the weeks she is out are cancelled')
    w.unmount()
  })
})
