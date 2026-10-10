// L3-0 (09.10) – THE SENTENCE AS DATA: the frozen legacy-template table, the reverse matcher and the v92 -> v93 step.
// docs/specs/i18n-2026-10.md §5. What stands pinned here, and why each pin is a different kind of failure:
//
//   A. THE TABLE IS FROZEN. Two content hashes: the table (the closed set of sentences old code could store) and the matcher (the rule that reads it).
//      Editing either re-interprets every save the migration has not yet met, so the pin makes that a decision somebody has to make on purpose, here.
//   B. THE TABLE IS WELL FORMED – unique keys, holes numbered from 0 with no gaps, classes that name a real hole, every template renders through the
//      SAME formatter the UI runs, no backslash a formatter would read as an escape.
//   C. THE MATCHER – exact sentences, captured holes, the class seam (a name and a score with one space between them), the preference rule, and
//      the three sentences the owner's real save holds that no template recognises (retired wording stays unmatched: it is COUNTED, not forced).
//   D. THE v93 STEP – `text` untouched, `c` attached beside it, idempotent, round-trips through the save codec, draws nothing.
//   E. THE GOLDEN – the v92 corpus (403 rows) converts completely and every converted row renders back to its stored bytes in English.
//
// ⚠ NOTHING HERE ASSERTS THAT THE ENGINE'S *CURRENT* WORDING IS COVERED. The table is a snapshot of v92; a later wave rewording a writer is a
// legitimate act and must not turn this file red. Coverage of real careers is MEASURED (the report of the wave, the golden corpus below), not gated.
import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { migrateSave } from '../src/engine/migrations'
import { SAVE_SCHEMA_VERSION, type WorldState } from '../src/engine/world'
import { allTemplateKeys, attachCopyRefs, fittingTemplates, reverseMatchText } from '../src/engine/migrations/reverseMatch'
import { HOLE_CLASS_PATTERNS, LEGACY_JOINED_V92, LEGACY_TEMPLATES_V92 } from '../src/engine/migrations/legacyTemplates.v92'
import { renderCopyRef, SOURCE_LOCALE, type CopyRef } from '../src/shared/i18n'
import { decodeExportFile, encodeExportFile } from '../src/engine/saveCodec'
import { codeOf, region } from './helpers/source'
import { load } from './goldenSavesCorpus'

const ROOT = resolve(__dirname, '..')
const read = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8')
const sha = (s: string): string => createHash('sha256').update(s).digest('hex')
const english = (ref: CopyRef): string => renderCopyRef(ref, { locale: SOURCE_LOCALE })

interface Row { id: number; week: number; type: string; text: string; c?: CopyRef }

describe('A · the table and the matcher are frozen', () => {
  it('legacyTemplates.v92.ts is byte-identical to the file the v93 commit created', () => {
    expect(
      sha(read('src/engine/migrations/legacyTemplates.v92.ts')),
      'the frozen v92 table changed – it is named for the LAST pre-CopyRef version and is never edited; if this is deliberate, say why in the commit and re-pin',
    ).toBe('ad6308a5adcfc34d5091a4d8962df33082f6609b314a561f984b6e8f72698a0b')
  })
  it('reverseMatch.ts is byte-identical to the file the v93 commit created', () => {
    expect(
      sha(read('src/engine/migrations/reverseMatch.ts')),
      'the matcher is part of the v93 step: changing it changes what an unmigrated save becomes – re-pin only on purpose',
    ).toBe('398e595cfed75a51fc40783929b45ba665f740837a5eb8305a2949f8ee85ed52')
  })
})

describe('B · the table is well formed', () => {
  const direct = LEGACY_TEMPLATES_V92.map((e) => (typeof e === 'string' ? e : e[0]))
  // the closed set the matcher actually holds: the direct entries plus every selection of the joined family, expanded at load
  const keys = allTemplateKeys()
  it('has no duplicate direct key, and the closed set it expands to is the 679 sentences the sweep found', () => {
    expect(new Set(direct).size).toBe(direct.length)
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys.length, 'the closed set of v92 event sentences – 392 stored directly + 287 selections of the winter kit-letter row').toBe(679)
  })
  it('numbers its holes from 0 with no gap and no repeat', () => {
    for (const k of keys) {
      const holes = [...k.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1]))
      expect(holes, k).toEqual(holes.map((_, i) => i))
    }
  })
  it('only names classes that exist, on holes that exist (the family\'s parts included)', () => {
    for (const e of [...LEGACY_TEMPLATES_V92, ...LEGACY_JOINED_V92.flatMap((f) => f.parts.flat())]) {
      if (typeof e === 'string') continue
      const holes = [...e[0].matchAll(/\{(\d+)\}/g)].length
      for (const [index, cls] of Object.entries(e[1])) {
        expect(Number(index), e[0]).toBeLessThan(holes)
        expect(Object.keys(HOLE_CLASS_PATTERNS), e[0]).toContain(cls)
      }
    }
  })
  it('renders every template through the UI formatter exactly as a plain fill would (a literal brace or backslash would not survive it)', () => {
    for (const k of keys) {
      const holes = [...k.matchAll(/\{(\d+)\}/g)].length
      const p = Array.from({ length: holes }, (_, i) => `<${i}>`)
      const filled = k.replace(/\{(\d+)\}/g, (_m, i: string) => p[Number(i)] as string)
      expect(english({ k, ...(holes > 0 ? { p } : {}) }), k).toBe(filled)
    }
  })
})

describe('C · the matcher', () => {
  it('recognises a whole sentence and attaches no params', () => {
    expect(reverseMatchText('Physio / recovery session')).toEqual({ ref: { k: 'Physio / recovery session' }, candidates: 1 })
  })
  it('captures the holes as the strings that stood in them', () => {
    const hit = reverseMatchText("Entered World Tour 35 – W26 '35 (grass)")
    expect(hit?.ref).toEqual({ k: 'Entered {0} – {1} ({2})', p: ['World Tour 35', "W26 '35", 'grass'] })
  })
  it('splits a name from the score after it at the seam the class pins, not at the first space', () => {
    const hit = reverseMatchText('Round of 32: A. Martin beat S. Verhoeven 6-3 6-4')
    expect(hit?.ref).toEqual({ k: '{0}: {1} beat {2} {3}', p: ['Round of 32', 'A. Martin', 'S. Verhoeven', '6-3 6-4'] })
  })
  it('prefers the template whose anchors say more when two fit', () => {
    const text = 'Quarterfinal: A. Martin beat a retiring C. Caldwell 4-6 6-4 5-2'
    expect(fittingTemplates(text)).toEqual(expect.arrayContaining(['{0}: {1} beat {2} {3}', '{0}: {1} beat a retiring {2} {3}']))
    const hit = reverseMatchText(text)
    expect(hit?.ref.k).toBe('{0}: {1} beat a retiring {2} {3}')
    expect(hit?.candidates).toBeGreaterThan(1)
  })
  it('never lets a generic shape swallow a tier-prefixed one it was not written for (the class keeps the hole a tier label)', () => {
    expect(reverseMatchText("Alice's share of the prize money – $29 into her own account")?.ref.k).toBe("{0}'s share of the prize money – {1} into her own account")
    expect(reverseMatchText("Coach's cut of the prize money – 10%"), 'a reworded row is COUNTED, not forced into {0} prize money – {1}').toBeNull()
  })
  it('leaves a sentence nobody wrote unmatched, and the owner\'s three retired wordings with it', () => {
    for (const text of [
      '',
      'Nobody wrote this sentence',
      // the real save's remainder (r47-career.tsave, measured 09.10) – all three are wordings the code has since replaced
      'One more year, she said. Same as last time.',
      'A masseur is on the payroll now – table work at home, every week.',
    ]) expect(reverseMatchText(text), text).toBeNull()
  })
  it('keeps a match only if it renders back to the stored bytes', () => {
    for (const text of ['Physio / recovery session', 'Round of 32: A. Martin lost to S. Verhoeven 6-3 6-4', "Entered World Tour 35 – W26 '35 (grass)"]) {
      const hit = reverseMatchText(text)
      expect(hit && english(hit.ref)).toBe(text)
    }
  })
})

describe('D · attachCopyRefs – the v93 step\'s whole job', () => {
  const rows = (): Row[] => [
    { id: 1, week: 1, type: 'expense', text: 'Physio / recovery session' },
    { id: 2, week: 1, type: 'info', text: 'Nobody wrote this sentence' },
    { id: 3, week: 2, type: 'expense', text: 'Physio / recovery session', c: { k: 'already here' } },
    { id: 4, week: 3, type: 'expense', text: 'Physio / recovery session' },
  ]
  it('counts what it looked at, what it converted and what it could not read', () => {
    const r = rows()
    const stats = attachCopyRefs(r)
    expect(stats).toMatchObject({ total: 3, matched: 2, ambiguous: 0, unmatched: ['Nobody wrote this sentence'], unmatchedRows: 1 })
  })
  it('attaches `c` BESIDE `text` and touches nothing else, nothing at all on a row that has one', () => {
    const r = rows()
    attachCopyRefs(r)
    expect(r[0]).toEqual({ id: 1, week: 1, type: 'expense', text: 'Physio / recovery session', c: { k: 'Physio / recovery session' } })
    expect(r[1]).toEqual({ id: 2, week: 1, type: 'info', text: 'Nobody wrote this sentence' })
    expect(r[2]?.c).toEqual({ k: 'already here' })
  })
  it('is idempotent: a second pass changes nothing (the converted rows are skipped)', () => {
    const r = rows()
    attachCopyRefs(r)
    const once = JSON.stringify(r)
    const second = attachCopyRefs(r)
    expect(JSON.stringify(r)).toBe(once)
    expect(second).toMatchObject({ total: 1, matched: 0 })
  })
  it('survives a world with no event list and rows that are not rows', () => {
    expect(attachCopyRefs(undefined).total).toBe(0)
    expect(attachCopyRefs([null, 3, 'x', { text: 4 }]).total).toBe(0)
  })
})

describe('E · the v92 -> v93 golden', () => {
  const v92 = load('v92.json') as WorldState
  const v93 = load('v93.json') as WorldState
  it('is the head, and the fixture is the real migration\'s own output on v92.json (the recipe every fixture since v25 uses)', () => {
    expect(SAVE_SCHEMA_VERSION).toBe(93)
    expect(v93.schemaVersion).toBe(93)
    expect(migrateSave(structuredClone(v92))).toEqual(v93)
  })
  it('converts EVERY row of the 403-row v92 corpus, and each converted row renders back to its stored text in English', () => {
    const migrated = migrateSave(structuredClone(v92)) as WorldState
    expect(migrated.events.length).toBe(v92.events.length)
    expect(v92.events.length).toBe(403)
    migrated.events.forEach((e, i) => {
      expect(e.text, `row ${i}: text is never touched`).toBe(v92.events[i]?.text)
      expect(e.c, `row ${i} "${e.text}"`).toBeDefined()
      expect(english(e.c as CopyRef), `row ${i}`).toBe(e.text)
    })
  })
  it('changes nothing but the version and the rows\' `c` – the key set, the order and every other value are the v92 save\'s', () => {
    const migrated = migrateSave(structuredClone(v92)) as unknown as Record<string, unknown> & { events: Row[] }
    const strip = (w: unknown): unknown => {
      const copy = structuredClone(w) as Record<string, unknown> & { events: Row[] }
      delete copy.schemaVersion
      for (const e of copy.events) delete e.c
      return copy
    }
    expect(JSON.stringify(strip(migrated))).toBe(JSON.stringify(strip(v92)))
  })
  it('migrating twice is migrating once', () => {
    const once = migrateSave(structuredClone(v92))
    expect(migrateSave(structuredClone(once))).toEqual(once)
    expect(migrateSave(structuredClone(v93))).toEqual(v93)
  })
  it('draws nothing: rngMain is the input\'s, and neither the matcher nor the step imports a dice or a clock', () => {
    const migrated = migrateSave(structuredClone(v92))
    expect(migrated.rngMain).toEqual(v92.rngMain)
    for (const file of ['src/engine/migrations/reverseMatch.ts', 'src/engine/migrations/legacyTemplates.v92.ts']) {
      const code = codeOf(read(file))
      expect(code, file).not.toMatch(/\brngFromSeed|\bresumeMain|\bpickInt|Math\.random|new Date\(|Date\.now|performance\.now|from '[^']*\/rng'/)
    }
    const migrations = codeOf(read('src/engine/migrations.ts'))
    const step = region(migrations, 'if (v === 92) {', 'if (v !== SAVE_SCHEMA_VERSION)')
    expect(step.length, 'the v92 step was found').toBeGreaterThan(10)
    expect(step).toContain('attachCopyRefs(save.events)')
    expect(step).not.toMatch(/rng|draw|Math\.random|Date/)
  })
  it('round-trips through the save codec byte for byte (encode -> decode of a migrated world)', async () => {
    const migrated = migrateSave(structuredClone(v92))
    const back = await decodeExportFile(await encodeExportFile(migrated))
    expect(JSON.stringify(back)).toBe(JSON.stringify(migrated))
  })
})
