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
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import { KID_ID } from '../../src/engine/world'
import { buildKnockPrompt } from '../../src/engine/knock'
import { SKILL_KEYS, STARTING_SKILL_BAND } from '../../src/engine/development'
import { LOCAL_OPEN_COPY } from '../../src/prologue/cards'
import { playLocalOpen } from '../../src/prologue/pool'
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
