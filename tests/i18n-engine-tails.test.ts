// 11.10 (THE BLANKET, RU-21) – THE ENGINE TAILS RENDER UNDER THE COMPILED RUSSIAN, ON THE PARAMS THE ENGINE REALLY PASSES.
// docs/localization/ru-engine-tails-2026-10.md and the `⚙ 11.10 agent-authored (бланкет)` section at the foot of each area table.
//
// WHY THIS FILE EXISTS. `npm run i18n:check` proves a Russian value PARSES and reads the holes its key reads; it cannot see the class this wave is most exposed to: a plural written over a hole that is
// NOT a number in the engine (`SET_ORDINAL`'s `first`, `ordinal()`'s `3rd`, a spelled count word). The renderer does not throw into the player – it falls back to the WHOLE English sentence and counts
// a miss – so the row compiles, the gate is green, and a Russian log quietly shows English. So every producer below is called the way the engine calls it and its refs are rendered under the REAL
// ru.json: nothing may be `invalid`, nothing may be `missing`, and every sentence must come out in Russian. The owner edits these rows live; a hand edit that turns a number hole into a word hole
// (or the reverse) goes red here, not in his playtest.
//
// ⚠ NO CYRILLIC IS TYPED HERE (the booth wave's rule, tests/i18n-l3-7-viz.test.ts §6): every expectation is read from ru.json by key, or asks `\p{Script=Cyrillic}`; the mutation arm uses ASCII stand-ins.
//
//   §1 the two disputed ending paragraphs have NO row (the owner's 10.10 ruling: the English is under question, the Russian waits) – the pin moves the day the English is settled
//   §2 every producer, rendered: no fallback, no unresolved hole, Russian
//   §3 a counted noun really inflects (the same plural category, the same word; two categories, two words)
//   §4 the dollar sign survives (`$` before a hole is a literal) and the mutation arm bites
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { cp, renderCopyRef, type CopyRef, type MissReason } from '../src/shared/i18n'
import { buildKnockPrompt } from '../src/engine/knock'
import { collegeLeagueRef } from '../src/engine/collegeLeague'
import { callUpRef } from '../src/engine/nationalTeam'
import { ENDING_BLURB, endingRowRef, lastWordRef } from '../src/engine/ending'
import { injuryRowRef } from '../src/engine/world/injury'
import { buildTourBriefing, createWorld, KID_ID } from '../src/engine/world'
import { installCatalog, resetI18nForTests, setLocale } from '../src/i18n'
import { playedLine } from '../src/prologue/handover'
import type { PlayedOpen } from '../src/prologue/run'
import { seasonWrapRef } from '../src/engine/world/milestones'
import { tournamentSummaryRef } from '../src/engine/world/tournamentClose'
import { engagedWithTogetherRef } from '../src/engine/world/lifeBeat/weddingCopy'
import type { WeekPlan } from '../src/shared/protocol'

const ROOT = resolve(__dirname, '..')
const RU = JSON.parse(readFileSync(resolve(ROOT, 'src/i18n/ru.json'), 'utf8')) as Record<string, string>
const CYR = /\p{Script=Cyrillic}/u

interface Rig {
  ctx: { locale: string; lookup: (k: string) => string | undefined; onMiss: (k: string, why: MissReason) => void }
  missing: Set<string>
  invalid: Set<string>
}
/** A Russian render context over a catalogue (the real one unless a mutation arm hands another), collecting what fell back and why. */
function rig(catalog: Readonly<Record<string, string>> = RU): Rig {
  const missing = new Set<string>()
  const invalid = new Set<string>()
  return { ctx: { locale: 'ru', lookup: (k) => catalog[k], onMiss: (k, why) => (why === 'missing' ? missing : invalid).add(k) }, missing, invalid }
}
/** Render a ref and hold the three things a Russian row must satisfy. */
function russian(r: Rig, ref: CopyRef, label: string): string {
  const out = renderCopyRef(ref, r.ctx)
  expect(CYR.test(out), `${label}: no Russian came out – «${out}»`).toBe(true)
  expect(/undefined|NaN|\[object|\{\d+\}/.test(out), `${label}: an unresolved hole in «${out}»`).toBe(false)
  return out
}
const clean = (r: Rig, what: string, allowed: readonly string[] = []): void => {
  expect([...r.invalid], `${what}: a Russian row that would not render (the whole English sentence shows instead)`).toEqual([])
  expect([...r.missing].filter((k) => !allowed.includes(k)), `${what}: a key the producer asks for and ru.json does not carry`).toEqual([])
}

describe('§1 the two paragraphs whose English is under question stay without a row', () => {
  it('ENDING_BLURB.college and ENDING_BLURB.natural are not in ru.json – the other seven are', () => {
    expect(RU[ENDING_BLURB.college], 'college: the owner held the Russian until the English is settled (10.10)').toBeUndefined()
    expect(RU[ENDING_BLURB.natural], 'natural: the same').toBeUndefined()
    for (const [type, english] of Object.entries(ENDING_BLURB)) {
      if (type === 'college' || type === 'natural') continue
      expect(CYR.test(RU[english] ?? ''), `${type}: the epilogue paragraph has its Russian`).toBe(true)
    }
  })
})

describe('§2 every producer, rendered under the real ru.json', () => {
  it('the injury row: six paths x niggle / descriptor x every week count – no fallback, Russian', () => {
    const r = rig()
    for (const retirement of [false, true]) {
      for (const [severe, pushing] of [[true, false], [false, true], [false, false]] as const) {
        for (const niggle of [true, false]) {
          for (const weeks of [1, 2, 3, 5, 11, 12, 21, 22, 25, 52]) {
            russian(r, injuryRowRef(retirement, severe, pushing, 'lower back', 'stress reaction', niggle, weeks), `injury ${retirement}/${severe}/${pushing}/${niggle}/${weeks}`)
          }
        }
      }
    }
    clean(r, 'injury')
  })

  it('the season wrap-up: all twelve shapes x the counts that change the Russian ending', () => {
    const r = rig()
    for (const [rank, startRank, track] of [[null, null, 'domestic'], [12, 12, 'domestic'], [12, 40, 'itf'], [40, 12, 'itf'], [8, null, 'wta']] as const) {
      for (const [best, played] of [['Runner-up', true], [null, true], [null, false]] as const) {
        for (const n of [0, 1, 2, 5, 11, 21]) {
          russian(r, seasonWrapRef({ year: 2031, rankTrack: track, rank, startRank, best, played, points: n, wins: n, losses: n, funds: '+$1,200' }), `wrap ${rank}/${startRank}/${best}/${played}/${n}`)
        }
      }
    }
    clean(r, 'wrap-up')
  })

  it('the tournament summary: the plain result and the three ranking clauses, each with and without the injury clause', () => {
    const r = rig()
    for (const notRanked of [false, true]) {
      for (const delta of [-3, 0, 4, 22]) {
        for (const retired of [false, true]) {
          for (const points of [1, 2, 5, 22]) {
            russian(r, tournamentSummaryRef({ tier: 'World Tour 500', surface: 'hard', week: "W14 '31", kid: 'M. Larsen', finish: 'Semifinalist', points, delta, bestN: 18, notRanked, retired }), `summary ${notRanked}/${delta}/${retired}/${points}`)
          }
        }
      }
    }
    clean(r, 'tournament summary')
  })

  it('the nine ending rows over every detail the producers write, her last word, and the final offer', () => {
    const r = rig()
    const rows: [string, string][] = [
      ['stopped', 'she stopped when school ended'], ['stopped', 'she stopped when school ended, and nobody had to call it a failure'],
      ['college', '4 years of student tennis – no ranking points, and the family pays its share of each year'],
      ['bankruptcy', '12 weeks below zero'], ['bankruptcy', '12 weeks below zero – there was no next entry fee'],
      ['injury', '30 weeks already lost, and then this one'],
      ['natural', '31, and nobody had to ask her'], ['natural', '1 more year after the first time she was asked'], ['natural', '3 more years after the first time she was asked'], ['natural', 'the first time she was asked, she said yes'],
      ['plateau', '3 seasons, no step higher'], ['plateau', '3 seasons and the table would not move'],
      ['peak', 'she was #1 the week she said it'], ['peak', 'a title in her last season'], ['peak', 'a title at the top of the sport, and she went the same season'],
      ['fall', '#13 to #59 in one season'], ['family', '51 weeks without a new entry'],
    ]
    for (const [type, detail] of rows) russian(r, endingRowRef({ type, detail } as Parameters<typeof endingRowRef>[0]), `ending ${type}: ${detail}`)
    for (const n of [0, 1, 2, 5, 11, 21]) {
      russian(r, lastWordRef(n), `last word ${n}`)
      russian(r, cp`She is ${17 + n}. ${lastWordRef(n)}`, `final offer ${n}`)
    }
    clean(r, 'endings')
  })

  it('the university feed: the league (eight shapes), the Nations Cup (three), and the kid-match rows', () => {
    const r = rig()
    for (const [roundsWon, rounds] of [[3, 3], [2, 3], [1, 3], [0, 3], [1, 4], [2, 4]] as const) russian(r, collegeLeagueRef({ roundsWon, rounds }), `league ${roundsWon}/${rounds}`)
    for (const [rubbersPlayed, rubbersWon] of [[0, 0], [1, 0], [1, 1], [2, 1], [5, 3]] as const) {
      const out = russian(r, callUpRef({ rubbersPlayed, rubbersWon, nationFinish: 3 }), `call-up ${rubbersPlayed}/${rubbersWon}`)
      // the place is the English ordinal string (`3rd`), never an ordinal suffix glued to it
      expect(/\d(?:st|nd|rd|th)-\p{L}/u.test(out), `an ordinal suffix glued to the English ordinal: «${out}»`).toBe(false)
    }
    clean(r, 'university feed')
  })

  it('the together span, week by week over ten years – every one of the nine sentences', () => {
    const r = rig()
    const said: CopyRef = { k: 'x' }
    for (let w = 0; w <= 520; w += 1) russian(r, engagedWithTogetherRef(said, w), `together ${w}`)
    // `{0} {1}` is the join (an identity row) and `x` the placeholder sentence of this test
    clean(r, 'together span', ['x'])
  })

  it('the knock dialog: the five sentences over the grid of repeat x condition x plan x forty seeds', () => {
    const r = rig()
    for (let k = 0; k < 40; k++) {
      for (const repeat of [false, true]) {
        for (const condition of [20, 62]) {
          for (const train of [30, 85]) {
            const p = buildKnockPrompt({ part: 'lower back', repeat, sinceWeek: 9, choice: null, untilWeek: 9 } as unknown as Parameters<typeof buildKnockPrompt>[0], `tails-${k}`, condition, { train, rest: 50 } as unknown as WeekPlan)
            for (const [field, c] of [['line', p.lineC], ['read', p.readC], ['cause', p.causeC], ['restCost', p.restCostC], ['pushCost', p.pushCostC]] as const) russian(r, c!, `knock ${k} ${field}`)
          }
        }
      }
    }
    clean(r, 'knock dialog')
  })

  it('the tour briefing, built by the engine for a girl the regime binds: the lead, both requirement lines, the five price lines and the closing line', () => {
    const r = rig()
    // the cheapest honest world the regime binds (tests/tour-briefing.test.ts): a counting W result and a rank inside the gate
    for (const rank of [1, 34, 50]) {
      const world = createWorld(`tails-briefing-${rank}`)
      world.results.push({ playerId: KID_ID, week: world.week, points: 250, tier: 'wta250' })
      world.kidRankWta = rank
      const b = buildTourBriefing(world)!
      expect(b, 'the fixture binds – an empty briefing would make every line below vacuous').toBeTruthy()
      const refs = [b.leadC!, b.closingC!, ...b.requirements.flatMap((q) => [q.askC!, q.detailC!]), ...b.costsC!]
      expect(refs.length, 'lead + closing + two lines x requirements + five price lines').toBe(2 + 2 * b.requirements.length + 5)
      refs.forEach((ref, i) => russian(r, ref, `briefing ${rank}/${i}`))
    }
    clean(r, 'tour briefing')
  })

  it('the handover\'s played-line, one to eight local tournaments, in the Russian frame', async () => {
    try {
      installCatalog('ru', RU)
      await setLocale('ru')
      for (let n = 1; n <= 8; n++) {
        const opens: PlayedOpen[] = Array.from({ length: n }, (_, index) => ({ age: 10, index, finish: 1, rounds: 3, wins: 1, outcome: 'lost' as const }))
        const line = playedLine(opens)
        expect(CYR.test(line), `${n}: «${line}»`).toBe(true)
        expect(/local tournament/.test(line), `${n}: the English count phrase survived – «${line}»`).toBe(false)
      }
    } finally {
      resetI18nForTests(null)
    }
  })

  it('the opponent\'s retirement row: six shapes over the five set ordinals the code hands in', () => {
    const r = rig()
    const kid = 'M. Larsen'
    for (const set of ['first', 'second', 'third', 'fourth', 'fifth']) {
      russian(r, cp`🩹 ${'A. Berg'} retired hurt at the ${'World Tour 500'} – she went off after the ${set} set.`, `news tour/after ${set}`)
      russian(r, cp`🩹 ${'A. Berg'} retired hurt at the ${'World Tour 500'} – she went off in the ${set} set.`, `news tour/in ${set}`)
      russian(r, cp`🩹 ${'A. Berg'} retired hurt against ${kid} – she went off after the ${set} set.`, `news week/after ${set}`)
      russian(r, cp`🩹 ${'A. Berg'} retired hurt against ${kid} – she went off in the ${set} set.`, `news week/in ${set}`)
    }
    russian(r, cp`🩹 ${'A. Berg'} retired hurt at the ${'World Tour 500'}.`, 'news tour/none')
    russian(r, cp`🩹 ${'A. Berg'} retired hurt against ${kid}.`, 'news week/none')
    clean(r, 'retirement row')
  })
})

describe('§3 a counted noun really inflects', () => {
  /** the word that follows the week count in the rendered injury row (the only number in it) */
  const nounAfter = (s: string, n: number): string => new RegExp(`\\b${n} (\\p{L}+)`, 'u').exec(s)?.[1] ?? ''
  it('weeks out: one word per plural category of Russian, and at least two different words across the categories', () => {
    const r = rig()
    const rules = new Intl.PluralRules('ru')
    const byCategory = new Map<string, Set<string>>()
    for (const weeks of [1, 2, 3, 4, 5, 6, 10, 11, 12, 14, 20, 21, 22, 24, 25, 31, 101, 111]) {
      const noun = nounAfter(russian(r, injuryRowRef(false, false, false, 'ankle', 'strain', false, weeks), `weeks ${weeks}`), weeks)
      const cat = rules.select(weeks)
      byCategory.set(cat, (byCategory.get(cat) ?? new Set()).add(noun))
    }
    for (const [cat, nouns] of byCategory) expect([...nouns], `plural category ${cat} must give one word`).toHaveLength(1)
    expect(new Set([...byCategory.values()].map((s) => [...s][0])).size, 'the noun changes between categories').toBeGreaterThan(1)
  })
  it('points of a season wrap-up: the same law', () => {
    const r = rig()
    const rules = new Intl.PluralRules('ru')
    const byCategory = new Map<string, Set<string>>()
    for (const points of [1, 2, 4, 5, 11, 21, 22, 25, 101]) {
      const out = russian(r, seasonWrapRef({ year: 2031, rankTrack: 'itf', rank: 12, startRank: 12, best: 'Winner', played: true, points, wins: 3, losses: 2, funds: '+$0' }), `points ${points}`)
      const noun = new RegExp(`${points} (\\p{L}+) `, 'u').exec(out)?.[1] ?? ''
      const cat = rules.select(points)
      byCategory.set(cat, (byCategory.get(cat) ?? new Set()).add(noun))
    }
    for (const [cat, nouns] of byCategory) expect([...nouns], `plural category ${cat} must give one word`).toHaveLength(1)
    expect(new Set([...byCategory.values()].map((s) => [...s][0])).size).toBeGreaterThan(1)
  })
})

describe('§4 the dollar sign survives, and the mutation arm bites', () => {
  it('"$" before a hole is a literal in the key and in the Russian: the amount prints with its sign', () => {
    const r = rig()
    for (const sentence of [cp`The family is $${'1,200'} better off than the week she went in.`, cp`The family is $${'1,200'} further under than the week she went in.`]) {
      const out = russian(r, sentence, 'money')
      expect(out.includes('$1,200'), `the dollar sign was lost: «${out}»`).toBe(true)
    }
    clean(r, 'money sentences')
  })

  it('MUTATION: a plural written over a word hole falls back to English and the harness names the key', () => {
    const key = cp`🩹 ${'A. Berg'} retired hurt at the ${'World Tour 500'} – she went off in the ${'second'} set.`.k
    const mutated: Record<string, string> = { ...RU, [key]: '{2, plural, one {a} few {b} many {c} other {d}} {0} {1}' }
    const r = rig(mutated)
    const out = renderCopyRef(cp`🩹 ${'A. Berg'} retired hurt at the ${'World Tour 500'} – she went off in the ${'second'} set.`, r.ctx)
    expect([...r.invalid]).toEqual([key])
    expect(CYR.test(out), 'the player saw English, and that is exactly what the harness has to notice').toBe(false)
  })

  it('MUTATION: an unresolved hole in a value is caught by the render check', () => {
    const key = cp`Medical`.k
    // an escape, not a typed letter: the value carries Russian (so the first check passes) and a hole nobody fills (so the second must fail)
    const r = rig({ ...RU, [key]: '\u044f {7}' })
    expect(() => russian(r, cp`Medical`, 'mutant')).toThrow(/unresolved hole/)
  })
})
