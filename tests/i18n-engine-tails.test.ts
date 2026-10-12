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
//   §5 ⭐ RU-22 (11.10) the display boundary: the engine-born words these producers hand into holes are READ (the Russian reading is in the line, the hook off prints the English word)
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { cp, renderCopyRef, translate, type CopyRef, type MissReason, type RenderContext } from '../src/shared/i18n'
import { createWordReaders } from '../src/i18n/words'
import { engineVocabulary, rawWordsIn } from './helpers/ruVocabulary'
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
  ctx: RenderContext
  missing: Set<string>
  invalid: Set<string>
}
/** A Russian render context over a catalogue (the real one unless a mutation arm hands another), collecting what fell back and why.
 *  ⭐ RU-22 (11.10): IT CARRIES THE DISPLAY BOUNDARY'S WORD HOOK, as the app's context does (`src/i18n/index.ts`) – these producers hand the engine's English words into holes, and the screen reads them at the
 *  moment of showing; a rig without the hook would render a line the player never sees. `hook: false` is the control arm (§5). */
function rig(catalog: Readonly<Record<string, string>> = RU, hook = true): Rig {
  const missing = new Set<string>()
  const invalid = new Set<string>()
  const onMiss = (k: string, why: MissReason): void => void (why === 'missing' ? missing : invalid).add(k)
  const plain: RenderContext = { locale: 'ru', lookup: (k) => catalog[k], onMiss }
  const readers = createWordReaders((key, params) => translate(key, params, plain))
  return { ctx: { ...plain, words: hook ? readers.holes : undefined }, missing, invalid }
}
const VOCAB = engineVocabulary()
/** Render a ref and hold the three things a Russian row must satisfy. */
function russian(r: Rig, ref: CopyRef, label: string): string {
  const out = renderCopyRef(ref, r.ctx)
  expect(CYR.test(out), `${label}: no Russian came out – «${out}»`).toBe(true)
  expect(/undefined|NaN|\[object|\{\d+\}/.test(out), `${label}: an unresolved hole in «${out}»`).toBe(false)
  expect(rawWordsIn(out, VOCAB), `${label}: an ENGLISH WORD of the engine's vocabulary survives in «${out}» – the display boundary (src/i18n/words.ts) has no reader for the hole, or the hole is not in src/i18n/wordHoles.ts`).toEqual([])
  return out
}
const clean = (r: Rig, what: string, allowed: readonly string[] = []): void => {
  expect([...r.invalid], `${what}: a Russian row that would not render (the whole English sentence shows instead)`).toEqual([])
  expect([...r.missing].filter((k) => !allowed.includes(k)), `${what}: a key the producer asks for and ru.json does not carry`).toEqual([])
}

describe('§1 all nine epilogue paragraphs carry Russian – the two held ones were ruled 11.10', () => {
  it('⚠ RE-AIMED 11.10: the owner settled both Englishes («she agreed to one more»; «не возражаю, доделывай»), so every ENDING_BLURB has its row', () => {
    for (const [type, english] of Object.entries(ENDING_BLURB)) {
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
    // ⚠ RE-AIMED 12.10 r49 №2 ф2 – a dated note, no assertion moved: the summary's week hole («W14 '31») used to pass through untranslated (a week
    // label is no vocabulary word, so `russian()` never objected); the `week` hole class re-spells it through the format registry now, and the
    // Russian form is pinned in phase 2's home (tests/component/i18n-r49-2-dates-display.test.ts). This sweep's own three claims are unchanged.
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

// =====================================================================================================================================================================================================
// §5 ⭐ RU-22 (11.10) – THE DISPLAY BOUNDARY: the words these producers hand into their holes are READ, not printed
// =====================================================================================================================================================================================================
//
// §2 above renders every producer under the production context, and `russian()` now also refuses an ENGLISH WORD OF THE ENGINE'S VOCABULARY in the line (`tests/helpers/ruVocabulary.ts`): a stage, a finish, a body part,
// an ordinal, a label. This section is the positive half – the Russian reading of the word IS in the line, read from ru.json by key – and the control: with the hook switched off the very same line prints the English
// word, so the checks above can fail. The seams RU-21 listed as «code, not translation» close here: the body part and the descriptor, the ladder's name, the finish, the set ordinal, the nation's place, the age in
// words, the seat label, the competition label, the surface, the court row, the economy's labels.
describe('§5 the display boundary reads the engine-born words', () => {
  const read = (key: string): string => {
    const v = RU[key]
    expect(v, `ru.json carries «${key}»`).toBeDefined()
    return v as string
  }
  const withHook = (ref: CopyRef): string => renderCopyRef(ref, rig().ctx)
  const withoutHook = (ref: CopyRef): string => renderCopyRef(ref, rig(RU, false).ctx)

  it('the injury row: the part and the descriptor stand in Russian, in the order the Russian row prints them', () => {
    const ref = injuryRowRef(false, false, false, 'lower back', 'stress reaction', false, 3)
    const out = withHook(ref)
    expect(out).toContain(read('body|lower back'))
    expect(out).toContain(read('hurt|stress reaction'))
    expect(rawWordsIn(withoutHook(ref), VOCAB).sort(), 'control: the hook off prints both English words').toEqual(['lower back', 'stress reaction'])
  })

  it('the knock dialog: the part stands in Russian in all five sentences', () => {
    for (const part of ['ankle', 'lower back', 'shoulder']) {
      const p = buildKnockPrompt({ part, repeat: false, sinceWeek: 9, choice: null, untilWeek: 9 } as unknown as Parameters<typeof buildKnockPrompt>[0], 'ru22-knock', 20, { train: 30, rest: 50 } as unknown as WeekPlan)
      for (const c of [p.lineC, p.readC, p.causeC, p.restCostC, p.pushCostC]) {
        const out = withHook(c!)
        if (rawWordsIn(withoutHook(c!), VOCAB).includes(part)) expect(out, `«${part}» is read in «${out}»`).toContain(read(`body|${part}`))
      }
    }
  })

  it('the season wrap-up: the ladder is the compact word, the best finish is a Russian noun', () => {
    for (const [track, key] of [['domestic', 'tile|National'], ['itf', 'tile|International'], ['wta', 'tile|Professional']] as const) {
      const ref = seasonWrapRef({ year: 2031, rankTrack: track, rank: 12, startRank: 20, best: 'Semifinalist', played: true, points: 40, wins: 8, losses: 5, funds: '+$1,200' })
      const out = withHook(ref)
      expect(out).toContain(read(key))
      expect(out).toContain(read('finish|Semifinalist'))
      expect(rawWordsIn(withoutHook(ref), VOCAB).sort(), 'control').toEqual([track === 'domestic' ? 'National' : track === 'itf' ? 'International' : 'Professional', 'Semifinalist'].sort())
    }
  })

  it('the tournament summary: the finish, the surface and the stage read in Russian', () => {
    // ⚠ RE-AIMED 12.10 r49 №2 ф2 – a dated note, no assertion moved: the week hole's «W14 '31» renders as the registry form under the hook now
    // (`week` class, src/i18n/wordHoles.ts); the names and words this arm holds are untouched, and the Russian week form is pinned in phase 2's home.
    const ref = tournamentSummaryRef({ tier: 'World Tour 500', surface: 'clay', week: "W14 '31", kid: 'M. Larsen', finish: 'Quarterfinalist', points: 40, delta: 40, bestN: 18, notRanked: false, retired: false })
    const out = withHook(ref)
    expect(out).toContain(read('finish|Quarterfinalist'))
    expect(out).toContain(read('Clay').toLowerCase())
    expect(out).toContain('World Tour 500') // a tournament's name is data
    expect(rawWordsIn(withoutHook(ref), VOCAB).sort(), 'control').toEqual(['Quarterfinalist', 'clay'])
  })

  it('the retirement rows: the set is an adjective that agrees with `сет`', () => {
    for (const [set, key] of [['first', 'ord|first'], ['second', 'ord|second'], ['third', 'ord|third'], ['fourth', 'ord|fourth'], ['fifth', 'ord|fifth']] as const) {
      const ref = cp`🩹 ${'A. Berg'} retired hurt against ${'M. Larsen'} – she went off in the ${set} set.`
      expect(withHook(ref)).toContain(read(key))
      expect(rawWordsIn(withoutHook(ref), VOCAB)).toEqual([set])
    }
  })

  it('the university feed: the competition is named in Russian, and the nation\'s place is a number with the Russian ending', () => {
    const league = collegeLeagueRef({ roundsWon: 1, rounds: 3 })
    expect(withHook(league)).toContain(read('league|the College League'))
    expect(rawWordsIn(withoutHook(league), VOCAB), 'control').toContain('the College League')
    const cup = callUpRef({ rubbersPlayed: 5, rubbersWon: 3, nationFinish: 3 })
    const out = withHook(cup)
    expect(out).toContain(read('league|the Nations Cup'))
    expect(out).toContain(read('place|{0}').replace('{0}', '3'))
    expect(rawWordsIn(withoutHook(cup), VOCAB).sort()).toEqual(['3rd', 'the Nations Cup'].sort())
  })

  it('the birthday and the age line: the age is a Russian numeral (a capital where the line opens with it)', () => {
    const lower = cp`She is ${'seventeen'} this week.`
    expect(withHook(lower)).toContain(read('num|seventeen'))
    const capital = cp`${'Sixteen'} today. Her plans started before breakfast.`
    const out = withHook(capital)
    const word = read('num|sixteen')
    expect(out.startsWith(word.charAt(0).toUpperCase() + word.slice(1)), out).toBe(true)
    expect(rawWordsIn(withoutHook(lower), VOCAB)).toEqual(['seventeen'])
  })

  it('the stored ledger rows: the seat label, the court row, the shop and the vacation read in Russian', () => {
    const fare = cp`${'Hitting partner'} travel to ${'Regional Championship'} – one additional fare`
    expect(withHook(fare)).toContain(read('Hitting partner'))
    const court = cp`${'Academy courts'} – ${5} h, ${'the busy hours'}`
    const courtOut = withHook(court)
    expect(courtOut).toContain(read('court|Academy courts'))
    expect(courtOut).toContain(read('court|the busy hours'))
    const vacation = cp`Family vacation – ${'Staycation with friends'}: +${12} condition.`
    expect(withHook(vacation)).toContain(read('Staycation with friends'))
    const sold = cp`Sold: ${'The yacht'} – exactly what it cost`
    expect(withHook(sold)).toContain(read('The yacht'))
    for (const ref of [fare, court, vacation, sold]) expect(rawWordsIn(withoutHook(ref), VOCAB).length, 'control').toBeGreaterThan(0)
  })

  it('MUTATION: the Russian row of a word deleted, or the table cut – the same producers go red under the same check', () => {
    const without = { ...RU }
    delete without['body|lower back']
    const ref = injuryRowRef(false, false, false, 'lower back', 'stress reaction', false, 3)
    const out = renderCopyRef(ref, rig(without).ctx)
    expect(rawWordsIn(out, VOCAB)).toEqual(['lower back'])
    expect(() => russian(rig(without), ref, 'mutant')).toThrow(/ENGLISH WORD/)
  })
})
