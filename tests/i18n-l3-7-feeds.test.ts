// L3-7 (10.10) – THE LAST SIXTEEN SINKS WRITE `c` BESIDE `text`, AND THE KNOCK PROMPT RIDES THE SNAPSHOT AS COPYREFS. docs/specs/i18n-2026-10.md §5, §8 rows L3-0 / L3-1 / L3-7.
//
// WHAT THE WAVE DID: the college engine feed (the call-up milestone, the league milestone, the Nations Cup and College League match rows, and the epilogue written twice from `tick.ts`), the medical feed
// (the rehab receipt, the recovery row, the injury row), the knock feed (the arrival, the coach's doubt, the coach's call, the family's decision) and the three week-play rows (the walkover, the withdrawal,
// the doctor's warning) now write the same sentence TWICE – `text` as before and `c`, a CopyRef whose key is the frozen v92 table's own (the re-key law: ZERO new class-(c) keys; nine FRAGMENTS that `joinCopy`
// assembles into the epilogue's 24 sentences). The knock dialog's five sentences are class (b): `KnockPrompt` gains `lineC` .. `pushCostC`, assembled at snapshot time and never stored.
//
// The L3-1 net (tests/i18n-l3-1-ledger-writers.test.ts) holds the key law, the static pair scan and the RATCHET, which closes at 141 of 141 here. THIS file is the dynamic half the scan cannot be:
//   §1 every combination of the four composed rows, through the functions the sinks call, rendered against the text and against the frozen table;
//   §2 the injury row through the real onset writer, over seeds, causes and a pushed knock;
//   §3 the knock arrival rows and the coach's doubt, read off the source (their text is a shorthand the scan cannot pair);
//   §4 played careers: every row that carries a ref renders to its text and names a key of the table (or a join of its fragments);
//   §5 the knock prompt: all 1,200 of the grid, every field's ref against its string.
// The twin against the pre-wave tree (every row of five careers x 300 weeks and two college careers, byte for byte) is tests/i18n-l3-7-twin.test.ts.
import { describe, expect, it } from 'vitest'
import ts from 'typescript'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { allTemplateKeys } from '../src/engine/migrations/reverseMatch'
import { renderCopyRef, SOURCE_LOCALE, type CopyRef } from '../src/shared/i18n'
import { callUpLine, callUpRef, NATIONAL_TEAM, type CallUp } from '../src/engine/nationalTeam'
import { collegeLeagueLine, collegeLeagueRef, COLLEGE_LEAGUE_ROUNDS } from '../src/engine/collegeLeague'
import { collegeEpilogueLine, collegeEpilogueRef } from '../src/engine/world/college'
import { injuryRowRef, onsetInjury } from '../src/engine/world/injury'
import { kidLadderRank } from '../src/engine/world/ladder'
import { createWorld } from '../src/engine/world'
import { buildKnockPrompt } from '../src/engine/knock'
import type { WeekPlan } from '../src/shared/protocol'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { knockPrompts, playBench, playCollege } from './helpers/l3-7-play'

const ROOT = resolve(__dirname, '..')
const EN = { locale: SOURCE_LOCALE }
const TABLE = new Set(allTemplateKeys())
const SRC = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8')
const en = (c: CopyRef): string => renderCopyRef(c, EN)

describe('§1 the four composed rows – every combination, through the functions the sinks call', () => {
  it('the call-up row: three sentences of the table, for every number of rubbers, wins and finishes, under the default label and a foreign one', () => {
    const keys = new Set<string>()
    let n = 0
    for (const label of [undefined, 'Elsewhere Cup']) {
      for (let played = 0; played <= 4; played++) {
        for (let won = 0; won <= played; won++) {
          for (let finish = 1; finish <= NATIONAL_TEAM.nationsAtHerLevel; finish++) {
            const call: CallUp = { rubbersPlayed: played, rubbersWon: won, nationFinish: finish }
            const ref = label === undefined ? callUpRef(call) : callUpRef(call, label)
            const text = label === undefined ? callUpLine(call) : callUpLine(call, label)
            expect(en(ref), JSON.stringify(call)).toBe(text)
            expect(TABLE.has(ref.k), `not a key of the frozen table: ${ref.k}`).toBe(true)
            keys.add(ref.k)
            n++
          }
        }
      }
    }
    expect(n).toBeGreaterThan(100)
    expect(keys.size, 'the three sentences').toBe(3)
  })

  it('the league row: the eight sentences of the table, for every exit and every count', () => {
    const keys = new Set<string>()
    for (const label of [undefined, 'Elsewhere League']) {
      for (let roundsWon = 0; roundsWon <= COLLEGE_LEAGUE_ROUNDS; roundsWon++) {
        const run = { roundsWon, rounds: COLLEGE_LEAGUE_ROUNDS }
        const ref = label === undefined ? collegeLeagueRef(run) : collegeLeagueRef(run, label)
        const text = label === undefined ? collegeLeagueLine(run) : collegeLeagueLine(run, label)
        expect(en(ref), `roundsWon ${roundsWon}`).toBe(text)
        expect(TABLE.has(ref.k), `not a key of the frozen table: ${ref.k}`).toBe(true)
        keys.add(ref.k)
      }
    }
    // a draw of eight has four distinct runs (out in round 1, 2, 3; champion); the one-match / one-win counts need a smaller draw, which the table also holds
    for (const rounds of [1, 2, 3, 4]) {
      for (let roundsWon = 0; roundsWon <= rounds; roundsWon++) {
        const run = { roundsWon, rounds }
        const ref = collegeLeagueRef(run)
        expect(en(ref), `rounds ${rounds} won ${roundsWon}`).toBe(collegeLeagueLine(run))
        expect(TABLE.has(ref.k), ref.k).toBe(true)
        keys.add(ref.k)
      }
    }
    // the table holds eight (went out / won it x match(es) x win(s)); FIVE are reachable – a run that went out has played one more match than it won, so «1 match, 1 win» cannot be a loss, and a champion has won
    // as many as it played, so «1 match, 2 wins» cannot be a title. The other three are the syntactic product the sweep that built the table could not prune.
    expect(keys.size, 'the five reachable table sentences').toBe(5)
  })

  it('the epilogue: all 24 sentences of the table (2 year forms x 3 calls x 2 money signs x 2 standings), joined from the nine fragments', () => {
    // a world with a professional ranking, found among the benched careers; the college state is hand-built (the writer reads `years` and the profile only)
    let ranked: ReturnType<typeof createWorld> | null = null
    for (const [preset, policy] of [[5, 0], [6, 1], [5, 1], [8, 0], [0, 1]] as const) {
      const w = playBench(preset, policy, 300).world
      if (kidLadderRank(w, 'wta') !== null) {
        ranked = w
        break
      }
    }
    expect(ranked, 'a benched career with a WTA rank').not.toBeNull()
    const bare = createWorld('l37-epilogue', { ...DEFAULT_PROFILE })
    expect(kidLadderRank(bare, 'wta')).toBeNull()
    const seen = new Set<string>()
    for (const world of [bare, ranked!]) {
      for (const years of [1, 2, 4]) {
        for (const calls of [0, 1, 3]) {
          for (const cents of [-420_000_00, 777_00, 12_345_678_00]) {
            const rows = Array.from({ length: years }, (_, i) => ({ fundsDeltaCents: i === 0 ? cents : 0, callUp: i < calls ? ({ rubbersPlayed: 1, rubbersWon: 1, nationFinish: 2, week: 1 } as unknown) : null }))
            world.college = { years: rows } as unknown as typeof world.college
            const ref = collegeEpilogueRef(world)
            expect(en(ref), `${years}y ${calls}c ${cents}`).toBe(collegeEpilogueLine(world))
            expect(TABLE.has(ref.k), `not a key of the frozen table: ${ref.k}`).toBe(true)
            seen.add(ref.k)
          }
        }
      }
    }
    // years 1 and the rest; calls 0, 1, N; a debt and a surplus; a ranking and none = 24 in the table – and TWENTY reachable: one year of student tennis cannot hold two call-ups (a year holds at most one),
    // so «1 year … called N times» (2 money signs x 2 standings = 4) is the syntactic product the sweep could not prune
    expect(seen.size, 'the twenty reachable table sentences').toBe(20)
  })

  it('the injury row: all 24 spellings (six shapes x niggle or a descriptor x «wk» or «wks») are keys of the table and read as the sentence they spell', () => {
    const keys = new Set<string>()
    for (const retirement of [false, true]) {
      for (const severe of [false, true]) {
        for (const pushing of [false, true]) {
          for (const niggle of [false, true]) {
            for (const weeksOut of [1, 2, 7]) {
              const ref = injuryRowRef(retirement, severe, pushing, 'wrist', niggle ? 'niggle' : 'tear', niggle, weeksOut)
              expect(TABLE.has(ref.k), `not a key of the frozen table: ${ref.k}`).toBe(true)
              const text = en(ref)
              expect(text).toContain(`wrist ${niggle ? 'niggle' : 'tear'} – out ~${weeksOut} ${weeksOut === 1 ? 'wk' : 'wks'}`)
              keys.add(ref.k)
            }
          }
        }
      }
    }
    // six shapes exist (a severe + pushing retirement is the severe sentence; a severe + pushing weekly onset is the severe one too), so the table's 24 minus the shapes the flags fold together
    expect(keys.size).toBeGreaterThanOrEqual(20)
    for (const k of keys) expect(TABLE.has(k)).toBe(true)
  })
})

describe('§2 the injury row through the real onset writer', () => {
  it('over seeds, both doors and a pushed knock: the new row\'s ref renders to its text, names a key of the table, and the severities and week counts that the draw produces are all covered', () => {
    const world = createWorld('l37-onset', { ...DEFAULT_PROFILE })
    const reached = new Set<string>()
    let rows = 0
    for (let k = 0; k < 700; k++) {
      for (const cause of ['week', 'retirement'] as const) {
        for (const push of [false, true]) {
          world.injury = null
          world.knock = push ? ({ part: 'wrist', repeat: false, sinceWeek: world.week, untilWeek: world.week + 3, choice: 'push' } as unknown as typeof world.knock) : null
          const before = world.events.length
          onsetInjury(world, rngFromSeed(`l37-inj-${k}-${cause}-${push}`), cause, [{ part: 'ankle', weight: 1 }, { part: 'shoulder', weight: 1 }])
          const row = world.events.slice(before).find((e) => e.type === 'injury' && /out ~/.test(e.text))
          expect(row, `no injury row at seed ${k}`).toBeTruthy()
          expect(row!.c, 'the injury row carries its ref').toBeTruthy()
          expect(en(row!.c!), row!.text).toBe(row!.text)
          expect(TABLE.has(row!.c!.k), row!.c!.k).toBe(true)
          reached.add(row!.c!.k)
          rows++
        }
      }
    }
    expect(rows).toBe(2800)
    // the writer reaches most of the 24 – the rest are the severe / niggle corners of a draw this size does not hit, and §1 holds them
    expect(reached.size).toBeGreaterThanOrEqual(8)
  })
})

describe('§3 the knock rows whose text is a shorthand the pair scan cannot read', () => {
  const sentencesOf = (e: ts.Node, into: string[]): void => {
    if (ts.isNoSubstitutionTemplateLiteral(e)) into.push(e.text)
    else if (ts.isTemplateExpression(e)) {
      let k = e.head.text
      e.templateSpans.forEach((s, i) => {
        k += `{${i}}${s.literal.text}`
      })
      into.push(k.replace(/\$\{[^}]*\}/g, '{h}'))
    }
    ts.forEachChild(e, (c) => sentencesOf(c, into))
  }
  it('the coach\'s doubt: the three `text` sentences and the three `cp` sentences of the arrival row say the same thing, hole for hole', () => {
    const sf = ts.createSourceFile('knock.ts', SRC('src/engine/world/knock.ts'), ts.ScriptTarget.Latest, true)
    let text: ts.Node | undefined
    let ref: ts.Node | undefined
    const go = (n: ts.Node): void => {
      if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) {
        if (n.name.text === 'text' && /not calling the/.test(n.initializer.getText())) text = n.initializer
        if (n.name.text === 'ref' && /not calling the/.test(n.initializer.getText())) ref = n.initializer
      }
      ts.forEachChild(n, go)
    }
    go(sf)
    expect(text && ref, 'the text and the ref of the doubt row are both there').toBeTruthy()
    const a: string[] = []
    const b: string[] = []
    // the text side's holes are `${k.part}`; the cp side's are `${k.part}` too – compare the cooked strings with every hole folded to `{h}`
    const fold = (e: ts.Node, into: string[]): void => {
      const tmp: string[] = []
      const visit = (n: ts.Node): void => {
        if (ts.isTemplateExpression(n)) {
          tmp.push(n.head.text + n.templateSpans.map((s) => `{h}${s.literal.text}`).join(''))
        } else if (ts.isTaggedTemplateExpression(n)) {
          const t = n.template
          tmp.push(ts.isNoSubstitutionTemplateLiteral(t) ? t.text : t.head.text + t.templateSpans.map((s) => `{h}${s.literal.text}`).join(''))
        } else ts.forEachChild(n, visit)
      }
      visit(e)
      into.push(...tmp)
    }
    fold(text!, a)
    fold(ref!, b)
    sentencesOf(text!, [])
    expect(a.length).toBe(3)
    expect(b).toEqual(a)
  })

  it('the arrival row and the two decision rows, through the source: each `text` has a `c` beside it in the same branch order (the pair scan reads the object-literal ones; the doubt row is read above)', () => {
    const src = SRC('src/engine/world/knock.ts')
    expect((src.match(/c: knock\.repeat \? cp`/g) ?? []).length).toBe(1)
    expect((src.match(/c: choice === 'rest' \? cp`/g) ?? []).length).toBe(1)
    expect((src.match(/c:\n\s+choice === 'rest'\n\s+\? cp`/g) ?? []).length).toBe(1)
  })
})

describe('§4 played careers – every row that carries a ref renders to its text and names a table key', () => {
  it('five bench careers x 300 weeks and two college careers: 0 mismatches, and every sink family the careers reach carries a ref', () => {
    const families: Record<string, RegExp> = {
      rehab: /^Rehab ahead of schedule/,
      back: /^Back on court/,
      injury: /^(Injury:|She had to stop:|She stopped, and this|Bad news from the clinic)/,
      knockArrive: /^(Her .* is sore again|She has picked up a sore)/,
      coachKnock: /^The coach (is|wants)/,
      decide: /^(Resting the|Training through the)/,
      walkover: /^Walkover/,
      withdrawn: /^Withdrawn from/,
      warning: /^Doctor's warning/,
      callUp: /her country called/,
      league: /^the College League:|she went out in the|she won it/,
      nations: /^the Nations Cup:/,
      epilogue: /years? of student tennis/,
    }
    const total: Record<string, { rows: number; withRef: number }> = {}
    const bad: string[] = []
    const played = [...([[5, 0], [8, 0], [0, 1], [6, 1], [5, 1]] as const).map(([p, q]) => playBench(p, q, 300)), playCollege('l37-college-a', false), playCollege('l37-college-b', true)]
    for (const p of played) {
      for (const r of p.rows) {
        for (const [name, re] of Object.entries(families)) {
          if (!re.test(r.text)) continue
          const t = (total[name] ??= { rows: 0, withRef: 0 })
          t.rows++
          const c = r.c as CopyRef | undefined
          if (!c) {
            bad.push(`${name}: no ref on «${r.text}»`)
            continue
          }
          t.withRef++
          if (en(c) !== r.text) bad.push(`${name}: «${r.text}» renders «${en(c)}»`)
          if (!TABLE.has(c.k)) bad.push(`${name}: ${c.k} is not a key of the table`)
        }
      }
    }
    expect(bad.slice(0, 8)).toEqual([])
    // every family but the masseur's rehab receipt (a hired masseur and a long layoff) is reached by these careers; §1 and the pair scan hold that one
    for (const name of Object.keys(families)) {
      if (name === 'rehab') continue
      expect(total[name]?.rows ?? 0, `${name} reached`).toBeGreaterThan(0)
      expect(total[name]!.withRef, name).toBe(total[name]!.rows)
    }
  })
})

describe('§5 the knock prompt – the five sentences ride the snapshot as refs beside the English', () => {
  it('all 1,200 prompts of the grid: every ref renders to the string beside it; the body part is a param; nothing is stored', () => {
    const all = knockPrompts()
    expect(all.length).toBe(1200)
    const keys = new Set<string>()
    for (const { label, prompt: p } of all) {
      for (const [field, c] of [['line', p.lineC], ['read', p.readC], ['cause', p.causeC], ['restCost', p.restCostC], ['pushCost', p.pushCostC]] as const) {
        expect(c, `${label} ${field} has no ref`).toBeTruthy()
        expect(en(c!), `${label} ${field}`).toBe(p[field])
        keys.add(c!.k)
        // the part is a param, never baked into the key
        expect(c!.k.includes(p.part) && p.part !== 'foot' && p.part !== 'back', c!.k).toBe(false)
      }
    }
    expect(JSON.parse(JSON.stringify(all[0]!.prompt))).toEqual(all[0]!.prompt)
    // the grid's four sub-streams reach 18 of the 24 sentences (the picks are `floor(rng() * 97) % pool.length` off the knock's own week); forty more seeds reach the rest:
    // 7 line sentences, 10 read sentences, 4 cause sentences, 1 rest cost, 2 push costs
    for (let k = 0; k < 40; k++) {
      for (const repeat of [false, true]) {
        for (const condition of [20, 62]) {
          for (const train of [30, 85]) {
            const p = buildKnockPrompt({ part: 'ankle', repeat, sinceWeek: 9, choice: null, untilWeek: 9 } as unknown as Parameters<typeof buildKnockPrompt>[0], `l37-more-${k}`, condition, { train, rest: 50 } as unknown as WeekPlan)
            for (const [field, c] of [['line', p.lineC], ['read', p.readC], ['cause', p.causeC], ['restCost', p.restCostC], ['pushCost', p.pushCostC]] as const) {
              expect(en(c!), `${k} ${field}`).toBe(p[field])
              keys.add(c!.k)
            }
          }
        }
      }
    }
    expect(keys.size, '7 + 10 + 4 + 1 + 2 sentences').toBe(24)
  })
})

describe('§6 the pick keys are immovable – every sub-stream the touched files draw on is the one it was', () => {
  it('the `rngFromSeed(…)` keys of the files this wave touched are the pre-wave tree\'s (21 of them, the digest taken on 4adc0d58 in a throwaway worktree with this very algorithm)', () => {
    const files = [
      'src/engine/knock.ts', 'src/engine/nationalTeam.ts', 'src/engine/collegeLeague.ts', 'src/engine/offers.ts', 'src/engine/world/knock.ts', 'src/engine/world/injury.ts', 'src/engine/world/college.ts',
      'src/engine/world/tick.ts', 'src/engine/world/phaseHerWeek.ts', 'src/engine/world/sponsors.ts', 'src/engine/world/endings.ts', 'src/viz/commentary.ts', 'src/viz/preview.ts',
    ]
    const lines: string[] = []
    for (const f of files) for (const m of SRC(f).matchAll(/rngFromSeed\([^)]*\)/g)) lines.push(`${f}: ${m[0]}`)
    lines.sort()
    expect(lines.length).toBe(21)
    expect(createHash('sha1').update(lines.join('\n') + '\n').digest('hex').slice(0, 12)).toBe('8512cb85f0da')
  })
})
