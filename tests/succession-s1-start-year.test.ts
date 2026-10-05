// SUCCESSION S1 (06.10) – THE CALENDAR'S START YEAR. docs/specs/succession-2026-10.md §2 «The calendar» and §5 «Saves and determinism»; schema v92.
//
// FOUR ARMS, and each can fail – the migration default and the argument threading were each broken on purpose before this file was trusted (the S1 line
// of the spec's §8 ledger records the mutations):
//   A · THE REGRESSION ARM – a default career is byte-identical to its v91 self MINUS the one new key. The digests below were taken from the PRISTINE tree
//       (7df39c35, before any S1 edit): nine careers – three seeds x {no birth month given, 31 December, 6 January} – walked 110 weeks with no player action.
//       ⚠ A MEASUREMENT AND NOT A CHANGE-GATE, like the frozen MAIN capture (tests/condition.test.ts): a later wave that legitimately changes the default
//       world re-pins this table; what it may never do is change it by accident. Normalisation: `startYear` removed, `schemaVersion` set back to 91.
//   B · THE 2048 ARM – a career born in 2048 prints, dates and ages itself off 2048, and the things that never carried a calendar year (the cohort, the
//       pre-history table) are the same world around a later date.
//   C · THE SCHEMA ARM – the migration's default, the fixtures, the creation guard and the declared `legacy` shape.
//   D · THE RATCHET – `startYear` is an OPTIONAL last argument on every year-dependent date/age call, which makes an OMISSION silent: this walks src/engine and
//       refuses a call that forgets it. (The UI's own call sites are the follow-up, fed by `Snapshot.startYear`; migrations are frozen history and default to 2031.)

import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createWorld, SAVE_SCHEMA_VERSION, kidAgeAt, kidAgeYears, kidBirthYear } from '../src/engine/world'
import { tickWeek } from '../src/engine/world/tick'
import { bookPractice } from '../src/engine/world/planner'
import { toSnapshot } from '../src/engine/world/snapshot'
import { resumeMain } from '../src/engine/rng'
import { migrateSave } from '../src/engine/migrations'
import { schoolEndWeek } from '../src/engine/kidLife'
import { MEMORY_LINES, selectMemory } from '../src/engine/diary'
import { DEFAULT_START_YEAR, seasonYear, weekLabel, weekOfDate, weekRange, weekYear } from '../src/shared/dates'
import type { WorldState } from '../src/engine/world/state'
import type { Milestone } from '../src/shared/protocol'
import { load } from './goldenSavesCorpus'

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// A · the regression arm
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

const WEEKS = 110
const BIRTHS: Record<string, [number, number] | null> = { default: null, dec31: [12, 31], jan6: [1, 6] }

/** Digests of the PRISTINE tree (7df39c35): `rng0`/`h0` at creation, `rngN`/`hN` after WEEKS no-action ticks. sha1, first 16 hex. */
const BASELINE: Record<string, { rng0: string; h0: string; rngN: string; hN: string }> = {
  's1-alpha|default': { rng0: '-1306492581:0', h0: '1662620015bc23c9', rngN: '-1625113431:87894', hN: 'b9b588084cc0523f' },
  's1-alpha|dec31': { rng0: '-1306492581:0', h0: 'e3c0dbdc02dfe2c4', rngN: '-1625113431:87894', hN: '2f18ea5763e500da' },
  's1-alpha|jan6': { rng0: '-1306492581:0', h0: 'baccabf4e3897d71', rngN: '-1625113431:87894', hN: '2f67b3d329194b3a' },
  's1-beta|default': { rng0: '2140152401:0', h0: '2376db693585cb49', rngN: '-73975459:87900', hN: 'f6fe7089ae8c78d8' },
  's1-beta|dec31': { rng0: '2140152401:0', h0: 'a2dd35eb5fdb72f9', rngN: '-73975459:87900', hN: 'db5227061df30a83' },
  's1-beta|jan6': { rng0: '2140152401:0', h0: '954e24dc6bc505f9', rngN: '-73975459:87900', hN: 'd7e814af3fb6b940' },
  's1-gamma|default': { rng0: '-2119545102:0', h0: '5f847e633dd4e992', rngN: '1792860147:87901', hN: '34ed1637259f0e79' },
  's1-gamma|dec31': { rng0: '-2119545102:0', h0: 'ab3e8951a687d2e4', rngN: '1792860147:87901', hN: '62f2940cc6d3b279' },
  's1-gamma|jan6': { rng0: '-2119545102:0', h0: 'ae71ca27f9886772', rngN: '1792860147:87901', hN: '1d21ec5aafa86725' },
}

function digest(world: unknown): string {
  const c = JSON.parse(JSON.stringify(world)) as Record<string, unknown>
  delete c.startYear
  c.schemaVersion = 91
  return createHash('sha1').update(JSON.stringify(c)).digest('hex').slice(0, 16)
}

describe('S1 · A – a default career is byte-identical to its v91 self minus the one new key', () => {
  for (const [key, want] of Object.entries(BASELINE)) {
    it(`${key}: rngMain and the serialised bytes match the digests taken before the change, at creation and after ${WEEKS} weeks`, () => {
      const [seed, tag] = key.split('|')
      const base = createWorld(seed)
      const born = BIRTHS[tag]
      const world = born === null ? base : createWorld(seed, { ...base.profile, birthMonth: born[0], birthDay: born[1] })
      expect(world.startYear, 'the default is the year every career has always opened in').toBe(2031)
      expect(world.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
      expect(`${world.rngMain.s}:${world.rngMain.n}`, 'creation draws nothing').toBe(want.rng0)
      expect(digest(world), 'the new world minus startYear and the version number is the v91 world').toBe(want.h0)
      const rng = resumeMain(world.rngMain)
      for (let i = 0; i < WEEKS; i++) tickWeek(world, rng)
      expect(`${world.rngMain.s}:${world.rngMain.n}`, 'the MAIN position after the walk – input-independence, measured').toBe(want.rngN)
      expect(digest(world), 'and every byte of the walked world').toBe(want.hN)
    })
  }
})

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// B · the 2048 arm
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

const START = 2048
const make = (seed: string, startYear: number = START): WorldState => createWorld(seed, undefined, undefined, undefined, undefined, undefined, startYear)

/** AN INDEPENDENT ORACLE: the first Monday of a year found by walking forward from 1 January, sharing no arithmetic with shared/dates.ts. */
function firstMondayOf(year: number): Date {
  const d = new Date(Date.UTC(year, 0, 1))
  while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() + 1)
  return d
}
function mondayOfWeek(week: number, startYear: number): Date {
  const season = Math.floor(week / 52)
  const d = firstMondayOf(startYear + season)
  d.setUTCDate(d.getUTCDate() + 7 * (week - season * 52))
  return d
}
/** Whole years old on the Monday that opens `week`, for a girl of the band (born `startYear - 14`) with this birth date. */
function oracleAge(week: number, month: number, day: number, startYear: number): number {
  const monday = mondayOfWeek(week, startYear)
  const m = monday.getUTCMonth() + 1
  const turned = m > month || (m === month && monday.getUTCDate() >= day)
  return monday.getUTCFullYear() - (startYear - 14) - (turned ? 0 : 1)
}

describe('S1 · B – a career born in 2048', () => {
  it('the dates module answers off the year it is given, and off 2031 when it is not', () => {
    expect(weekYear(0, START)).toBe(2048)
    expect(weekYear(52, START), 'season 1 opens in the next year').toBe(2049)
    expect(seasonYear(3, START)).toBe(2051)
    expect(weekLabel(0, START)).toBe("W1 '48")
    expect(weekLabel(52, START)).toBe("W1 '49")
    expect(weekRange(0, START), '1 Jan 2048 is a Wednesday, so week 0 is Monday 6 January').toBe('Jan 6–12, 2048')
    expect(weekRange(8, START), '2048 is a LEAP year: the 29th of February is absorbed, so week 8 opens a date EARLIER than 2031’s').toBe('Mar 2–8, 2048')
    expect(weekRange(52, START), '1 Jan 2049 is a Friday – the next season re-anchors on the first Monday').toBe('Jan 4–10, 2049')
    expect(weekOfDate(3, 2, 2048, START)).toBe(8)
    expect(weekOfDate(3, 3, 2031), 'and the default still answers as it always did').toBe(8)
    expect(weekRange(8), 'the same week in the default calendar').toBe('Mar 3–9, 2031')
    expect(weekLabel(0)).toBe("W1 '31")
    expect(DEFAULT_START_YEAR).toBe(2031)
  })

  it('her age clock agrees with an independent calendar for every week of five seasons, for birth dates on both sides of the leap-day shift', () => {
    expect(kidBirthYear(START), 'the band of a 2048 career was born in 2034').toBe(2034)
    expect(kidBirthYear(), 'and of a default one in 2017').toBe(2017)
    for (const [month, day] of [[3, 3], [6, 15], [12, 31], [1, 7], [2, 28]] as const) {
      for (let week = 0; week < 260; week++) {
        expect(kidAgeYears(week, month, day, START), `born ${day}/${month}, week ${week}`).toBe(oracleAge(week, month, day, START))
      }
    }
    // The argument really moves the answer – born 3 March, week 8: the Monday is the 3rd in 2031 (turned) and the 2nd in 2048 (not yet).
    expect(kidAgeYears(8, 3, 3)).toBe(14)
    expect(kidAgeYears(8, 3, 3, START)).toBe(13)
  })

  it('creation: the year is stored, nothing is drawn for it, and the cohort and the pre-history are the same world around a later date', () => {
    const w48 = make('s1-b-cohort')
    const w31 = make('s1-b-cohort', 2031)
    expect(w48.startYear).toBe(2048)
    expect(w31.startYear).toBe(2031)
    expect(w48.rngMain, 'the MAIN position at creation').toEqual(w31.rngMain)
    expect(w48.cohort, 'rivals carry an age and never a calendar year – nothing about 2031 is special to them').toEqual(w31.cohort)
    expect(w48.results, 'the pre-history table is built from the seed and negative WEEKS – no year anywhere in it').toEqual(w31.results)
  })

  it('a season runs: the engine writes 2048’s labels, her age follows the 2048 calendar, and the snapshot hands the year over', () => {
    const world = make('s1-b-season')
    const twin = make('s1-b-season', 2031)
    for (const w of [world, twin]) bookPractice(w, 2, false)
    const rng = resumeMain(world.rngMain)
    for (let i = 0; i < 60; i++) tickWeek(world, rng)
    const rngTwin = resumeMain(twin.rngMain)
    for (let i = 0; i < 60; i++) tickWeek(twin, rngTwin)

    expect(world.week).toBe(60)
    expect(world.startYear, 'the year survives a season of ticks').toBe(2048)
    expect(world.events.some((e) => e.text === "Practice match booked – W3 '48"), 'planner text off world.startYear').toBe(true)
    expect(twin.events.some((e) => e.text === "Practice match booked – W3 '31"), 'and the same booking in the default calendar').toBe(true)
    const labels = [...JSON.stringify(world).matchAll(/\bW\d{1,2} '(\d\d)/g)].map((m) => m[1])
    expect(labels.length, 'the scan is not vacuous').toBeGreaterThan(0)
    expect(labels.filter((y) => y !== '48' && y !== '49'), 'no persisted week label names another year').toEqual([])

    const { birthMonth, birthDay } = world.profile
    for (let week = 0; week <= 60; week++) {
      expect(kidAgeYears(week, birthMonth, birthDay, world.startYear), `week ${week}`).toBe(oracleAge(week, birthMonth, birthDay, START))
      expect(kidAgeAt(world, week), `the engine's own entry, week ${week}`).toBe(oracleAge(week, birthMonth, birthDay, START))
    }
    expect(toSnapshot(world).startYear).toBe(2048)
    expect(toSnapshot(twin).startYear).toBe(2031)
  })

  it('the diary’s memory lines name the career’s year, and the debut card is dated off it', () => {
    const milestone = { type: 'season-rank', week: 40, seasonIndex: 0, rank: 12 } as unknown as Milestone
    const lines = MEMORY_LINES.filter((l) => l.type === 'season-rank')
    expect(lines.length).toBeGreaterThan(0)
    for (const line of lines) {
      expect(line.text(milestone, START)).toContain('2048')
      expect(line.text(milestone), 'omitted, the default').toContain('2031')
    }
    expect(selectMemory([], 60, 'seed', () => 14, START)?.whenLabel).toBe("W1 '48")
    expect(selectMemory([], 60, 'seed', () => 14)?.whenLabel).toBe("W1 '31")
  })

  it('the engine marks her birthday in the week the career’s own calendar puts it: a 3 March girl turns a week LATER in 2048 than in 2031', () => {
    const markWeek = (startYear: number): number => {
      const base = make('s1-b-birthday', startYear)
      const world = createWorld('s1-b-birthday', { ...base.profile, birthMonth: 3, birthDay: 3 }, undefined, undefined, undefined, undefined, startYear)
      const rng = resumeMain(world.rngMain)
      for (let i = 0; i < 14; i++) tickWeek(world, rng)
      const marks = world.events.filter((e) => e.text === 'She is fourteen this week.').map((e) => e.week)
      expect(marks, `startYear ${startYear}: one birthday mark in the first fourteen weeks`).toHaveLength(1)
      return marks[0]
    }
    expect(markWeek(2048) - markWeek(2031), 'week 8 opens on the 3rd of March in 2031 and on the 2nd in 2048 (the leap day), so the Monday that reaches her date is a week later').toBe(1)
  })

  it('school’s end is the same week in every epoch – the cohort year and the epoch cancel – which is why the rivals’ band clock may stay on the default', () => {
    for (let month = 1; month <= 12; month++) expect(schoolEndWeek(month, START), `birth month ${month}`).toBe(schoolEndWeek(month))
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// C · the schema arm
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

describe('S1 · C – the schema move', () => {
  it('v92 is the head, and its migration states 2031 for every older career – the epoch was a constant until now', () => {
    expect(SAVE_SCHEMA_VERSION).toBe(92)
    for (const file of ['v0.json', 'v25.json', 'v60.json', 'v90.json', 'v91.json']) {
      const migrated = migrateSave(load(file))
      expect(migrated.startYear, file).toBe(2031)
      expect('legacy' in migrated, `${file}: a generation-1 career carries no legacy block`).toBe(false)
    }
  })

  it('the v92 golden fixture is the head shape: the year, no legacy block, and nothing for the migration to do', () => {
    const fixture = load('v92.json') as unknown as WorldState
    expect(fixture.schemaVersion).toBe(92)
    expect(fixture.startYear).toBe(2031)
    expect('legacy' in fixture).toBe(false)
    expect(migrateSave(load('v92.json'))).toEqual(fixture)
  })

  it('creation refuses a year that is not a whole calendar year', () => {
    expect(() => make('s1-c-guard', 2048.5)).toThrow(RangeError)
    expect(() => make('s1-c-guard', 1700)).toThrow(RangeError)
    expect(() => make('s1-c-guard', Number.NaN)).toThrow(RangeError)
    expect(make('s1-c-guard', 2100).startYear).toBe(2100)
  })

  it('the legacy block is declared with the spec’s shape, and S1 only declares it', () => {
    const legacy: NonNullable<WorldState['legacy']> = {
      motherName: 'Mother',
      motherPeakRank: null,
      motherSlamTitles: 0,
      surname: 'Name',
      endingKind: 'retired',
      savingsSliceCents: 0,
      heirloomAlbum: null,
    }
    expect(Object.keys(legacy).sort()).toEqual(['endingKind', 'heirloomAlbum', 'motherName', 'motherPeakRank', 'motherSlamTitles', 'savingsSliceCents', 'surname'])
    expect('legacy' in make('s1-c-legacy'), 'nothing in the engine writes it yet').toBe(false)
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// D · the ratchet
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

const YEAR_DEPENDENT = [
  'weekYear', 'seasonYear', 'weekMonth', 'weekStartDay', 'weekOfDate', 'weekLabel', 'monthLabel', 'weekSpan', 'weekDayNumbers', 'weekYearLabel',
  'weekDateLine', 'weekRange', 'kidAgeExact', 'kidAgeYears', 'kidBirthYear', 'birthdayTurning', 'birthdayWeek', 'schoolEndWeek', 'schoolIsOver',
  'forkDue', 'isSummerWeek', 'unitPriceHistory',
] as const

/** Every call of a year-dependent function whose ARGUMENT LIST does not mention `startYear`. Comments and the definitions themselves are skipped. */
function bareCalls(text: string): { line: number; code: string }[] {
  const call = new RegExp(`(?<![A-Za-z0-9_.])(${YEAR_DEPENDENT.join('|')})\\(`, 'g')
  const lines = text.split('\n')
  const out: { line: number; code: string }[] = []
  let m: RegExpExecArray | null
  while ((m = call.exec(text)) !== null) {
    const line = text.slice(0, m.index).split('\n').length
    const code = lines[line - 1]
    if (/^\s*(\/\/|\*|\/\*)/.test(code)) continue
    if (new RegExp(`function\\s+${m[1]}\\s*\\(`).test(code)) continue
    let depth = 1
    let i = m.index + m[0].length
    const argsFrom = i
    while (i < text.length && depth > 0) {
      if (text[i] === '(') depth++
      else if (text[i] === ')') depth--
      i++
    }
    if (!text.slice(argsFrom, i - 1).includes('startYear')) out.push({ line, code: code.trim().slice(0, 140) })
  }
  return out
}

function sourceFiles(dir: string): string[] {
  const found: string[] = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) found.push(...sourceFiles(path))
    else if (name.endsWith('.ts')) found.push(path)
  }
  return found
}

describe('S1 · D – no engine call forgets the career’s start year', () => {
  it('the scanner can fail: a bare call, a multi-line call and a threaded call are told apart, and comments and definitions are skipped', () => {
    expect(bareCalls('const a = weekLabel(3)\n')).toHaveLength(1)
    expect(bareCalls('const a = kidAgeYears(world.week, a, b)\n')).toHaveLength(1)
    expect(bareCalls('const a = weekLabel(3, world.startYear)\n')).toHaveLength(0)
    expect(bareCalls('const a = kidAgeYears(\n  world.week,\n  a,\n  b,\n  world.startYear,\n)\n')).toHaveLength(0)
    expect(bareCalls('// weekLabel(3) in a comment\n * weekYear(2) in a doc\nexport function weekLabel(week: number): string {\n')).toHaveLength(0)
  })

  it('src/engine: every year-dependent date or age call passes the career’s start year (migrations are frozen history and default to 2031)', () => {
    const root = resolve(__dirname, '../src/engine')
    const bare: string[] = []
    for (const file of sourceFiles(root)) {
      if (file.endsWith('/migrations.ts')) continue
      for (const hit of bareCalls(readFileSync(file, 'utf8'))) bare.push(`${file.slice(root.length + 1)}:${hit.line}  ${hit.code}`)
    }
    expect(bare, 'an engine call that omits startYear prints 2031 for a 2048 career without a sound').toEqual([])
  })
})
