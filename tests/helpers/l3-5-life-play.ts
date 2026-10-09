// L3-5 (10.10) – THE LIFE-BEAT TWIN'S DRIVER, one implementation for the net and for the throwaway-worktree runs. It plays a bench career week by week, and every week it does what a
// player does at the dialog: it READS the blocking prompt (heading, her line, the answers, her replies, the Proceed word) and the soft invite, records the ENGLISH of each, and answers by
// ROTATING through the offered options (so every answer a card offers is eventually pressed, and a card's replies are all seen). Anything the wave adds beside the English – the refs – is
// recorded in a second list (`pairs`), never in the strings, so the SAME file runs unchanged on the pre-wave tree (where the refs do not exist) and its digest is the pick-stability proof.
//
// ⚠ LIFE EVENTS BOOSTED (`setLifeEventBoost`, the dev toggle: the hazards x8, the same draws, other outcomes) on the life-heavy arm, so a 300-week career meets the whole private life –
// the fork, the news, the ending, the engagement, the wedding, the pregnancy, the loss, the funeral – instead of a fraction of it. The toggle is module state and is put back.
import type { CopyRef } from '../../src/shared/i18n'
import { answerLifeBeat, chooseGift, toSnapshot, type WorldState } from '../../src/engine/world'
import { setLifeEventBoost } from '../../src/engine/world/lifeBoost'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../../tools/econ-bench'

export interface LifePair { f: string; text: string; c: CopyRef | undefined }
export interface LifePlay {
  world: WorldState
  /** the English the player was shown, per week – the pick-stability digest's input */
  strings: unknown[]
  /** every (field, text, ref) triple the wave added a ref to */
  pairs: LifePair[]
  /** beats answered, by kind */
  answered: Record<string, number>
  /** the feed rows each ANSWER wrote, read the moment it was written (an ordinary row is pruned sixty weeks on, so the world at the end of a career holds only the last of them) */
  answerRows: Array<{ kind: string; text: string; c: CopyRef | undefined }>
  /** the MAIN stream's next three draws after the last week (the bench's own `rng`, the one `stepCareerWeek` draws from) – the wave draws nothing, so they match the pre-wave tree's */
  next3: number[]
}

export function playLife(presetIdx: number, policyIdx: number, weeks: number, boost: boolean): LifePlay {
  setLifeEventBoost(boost)
  try {
    const policy = POLICIES[policyIdx]!
    const { world, rng } = openCareer(PRESETS[presetIdx]!, 0, policy)
    const strings: unknown[] = []
    const pairs: LifePair[] = []
    const answered: Record<string, number> = {}
    const answerRows: LifePlay['answerRows'] = []
    const answer = (kind: string, optionId: string): void => {
      const before = world.events.length
      answerLifeBeat(world, optionId)
      for (const e of world.events.slice(before)) answerRows.push({ kind, text: e.text, c: e.c })
      answered[kind] = (answered[kind] ?? 0) + 1
    }
    let n = 0
    const promptRec = (p: NonNullable<ReturnType<typeof toSnapshot>['lifeBeatPrompt']>): Record<string, unknown> => {
      pairs.push({ f: 'heading', text: p.heading, c: p.headingC }, { f: 'said', text: p.said, c: p.saidC })
      for (const f of p.followUps) f.said.forEach((s, i) => pairs.push({ f: 'followUp', text: s, c: f.saidC?.[i] }))
      return {
        w: world.week,
        kind: p.kind,
        heading: p.heading,
        said: p.said,
        options: p.options.map((o) => ({ id: o.id, label: o.label })),
        followUps: p.followUps.map((f) => ({ optionId: f.optionId, said: [...f.said], done: f.done })),
        confirm: p.confirm,
      }
    }
    for (let w = 0; w < weeks; w++) {
      const snap0 = toSnapshot(world)
      const bp = snap0.birthdayPrompt
      if (bp) chooseGift(world, bp.options[Math.floor(world.week / 52) % bp.options.length]!.id)
      for (let guard = 0; guard < 12; guard++) {
        // a career that has ended answers nothing (`guardNotEndedForGood`) – the week still ticks below
        if (world.ending) break
        const snap = toSnapshot(world)
        const p = snap.lifeBeatPrompt
        if (!p) break
        const rec = promptRec(p)
        const pick = p.options[(world.week + n++) % p.options.length]!
        rec.answer = pick.id
        strings.push(rec)
        answer(p.kind, pick.id)
      }
      const soft = world.ending ? null : toSnapshot(world).softBeat
      if (soft) {
        pairs.push({ f: 'card', text: soft.card, c: soft.cardC })
        const rec = promptRec(soft.prompt)
        rec.card = soft.card
        // the invitation is optional: it is taken on alternate weeks, so some are left to lapse, as a player leaves them
        if (world.week % 2 === 0) {
          const pick = soft.prompt.options[(world.week + n++) % soft.prompt.options.length]!
          rec.answer = pick.id
          answer(soft.prompt.kind, pick.id)
        }
        strings.push(rec)
      }
      stepCareerWeek(world, rng, policy)
    }
    const next3 = [rng(), rng(), rng()]
    return { world, strings, pairs, answered, answerRows, next3 }
  } finally {
    setLifeEventBoost(false)
  }
}
