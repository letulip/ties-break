// L3-7 CLOSE-OUT (10.10) – THE SEVEN SAVE-FILE KINDS RIDE THE WIRE WITH THEIR SENTENCE. docs/decisions.md 10.10 item 33 («если что-то критичное и можно сразу исправить – лучше так, чтобы хвостов не висело»:
// the seven player-facing SaveFileError refusals typify NOW; the ~100 dev-path plain Errors stay documented), docs/specs/i18n-2026-10.md §8 row L3-7 (which had left them raw, named).
//
// WHAT THE CHANGE DID. `SaveFileError.code` was always the KIND (seven of them) and it crossed the worker boundary since E-05 – but a kind does not name a SENTENCE: `corrupted` is five sentences, `invalid-shape`
// is a frame with a closed set of clauses and 29 field names, `future-schema` and `oversized` have holes. So the sentence now rides beside the kind as the codebase's own carrier of «a sentence and its holes»:
// a `CopyRef` (`c`) – its key IS the English template, its params the holes (and, for a clause, another ref). The engine builds the refusal from `cp` (the English `message` is that ref rendered under the source
// locale, so the string and its translation share ONE source and cannot drift), the worker puts `c` on the reply beside `code`, the store keeps it beside `errorCode` (`errorC`, `saveOp.c`, `initErrorC`) and
// `errorText(code, message, c)` renders it through the catalog. ZERO sentences were reworded (invariant 4) and nothing is persisted (the schema is untouched).
//
// WHAT THIS FILE PROVES:
//   §1 BYTE-IDENTICAL: the tree under test refuses every variant of a corpus (the four guards at every limit, every top-level field of a real career broken eighteen ways, the file door byte by byte,
//      the database door) EXACTLY as the pre-wave tree did – same class, same code, same English, character for character (`tests/fixtures/sfe/old-arm.json`, captured on 8f8c9298 before a line moved);
//   §2 EVERY TYPED REFUSAL CARRIES ITS SENTENCE: a `c` that renders back to the message, whose key (and every nested key) is a wired catalog key, with JSON-safe params; the one raw refusal is named;
//   §3 NOTHING SHIPS UNCOVERED: the `cp` keys of the three files are exactly the keys the corpus reaches, and every `new SaveFileError(` outside the documented dev path takes a ref;
//   §4 THROUGH THE REAL WORKER: `importSave` answers every file variant with the kind in `code`, the English in `error` and the ref in `c` – the arm that turns red when a refusal goes back to a plain `Error`;
//   §5 `errorText`: a ref is rendered, a bare kind and a stale ref print the raw message, and a Russian probe catalog reaches every hole and every nested clause;
//   §6 THE OWNER'S ROWS: every key has a DRAFT row in the saves table (Russian left empty – his words).
// The mounted half (the store, `StoreError`, the Saves strip and the recovery screen drawing the translation) is tests/component/i18n-l3-7-errors-display.test.ts.
//
// Capture mode (`SFE_CAPTURE=<path>`) writes the outcome of every variant on WHATEVER tree it runs on; the stored fixture was captured on the pre-wave tree.
import 'fake-indexeddb/auto'
import { beforeAll, describe, expect, it } from 'vitest'
import ts from 'typescript'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { errorText } from '../src/composables/errorText'
import { decodeExportFile } from '../src/engine/saveCodec'
import { isCopyRef, renderCopyRef, SOURCE_LOCALE, type CopyRef } from '../src/shared/i18n'
import { listDocs, readRows } from '../tools/i18n-import'
import { normKey } from '../tools/copy-text'
import { resetI18nForTests } from '../src/i18n'
import { workerHarness } from './helpers/workerHarness'
import { buildVariants, normalise, runVariant, spineV35, craftFile, gz, type Outcome, type Variant } from './helpers/sfe-corpus'

const ROOT = resolve(__dirname, '..')
const SRC = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8')
const FIXTURE = resolve(__dirname, 'fixtures/sfe/old-arm.json')
const target = process.env.SFE_CAPTURE
const EN = { locale: SOURCE_LOCALE } as const
const enc = new TextEncoder()

/** the files that raise a SaveFileError; the worker's two sites build theirs through the guard's exported builder, but the file is scanned all the same */
const FILES = ['src/engine/saveGuard.ts', 'src/engine/saveCodec.ts', 'src/worker/sim.worker.ts'] as const

type Entry = [name: string, code: string | null, message: string]
interface Fixture {
  capturedOn: string
  variantCount: number
  /** every variant that was REFUSED; a variant absent from here was accepted */
  refused: Record<string, Entry>
}

/** the English as it is compared with the capture: the schema versions spelled relative to the build's, and – for a variant whose detail is a lower layer's own text (a V8 `TypeError`) – cut to the fixed part
 *  that precedes it */
function shown(v: Variant, message: string): string {
  const text = normalise(message)
  if (!v.volatile) return text
  const at = text.indexOf(' – ')
  return at >= 0 ? text.slice(0, at + 3) : '<raw>'
}
/** what is compared with the capture: class, code and the English */
function entryOf(v: Variant, o: Extract<Outcome, { kind: 'refused' }>): Entry {
  return [o.name, o.code, shown(v, o.message)]
}

const sourceFile = (rel: string): ts.SourceFile => ts.createSourceFile(rel, SRC(rel), ts.ScriptTarget.Latest, true)
/** the keys of every `cp` tag in a file, spelled exactly as the extractor spells them (`{0}` for the first hole …) */
function cpKeys(rel: string): string[] {
  const keys: string[] = []
  const go = (n: ts.Node): void => {
    if (ts.isTaggedTemplateExpression(n) && ts.isIdentifier(n.tag) && n.tag.text === 'cp') {
      const t = n.template
      keys.push(ts.isNoSubstitutionTemplateLiteral(t) ? t.text : t.head.text + t.templateSpans.map((x, i) => `{${i}}${x.literal.text}`).join(''))
    }
    ts.forEachChild(n, go)
  }
  go(sourceFile(rel))
  return keys
}

// ------------------------------------------------------------------------------------------------------------------------------------------------
describe.runIf(!!target)('CAPTURE – the outcome of every variant, on whatever tree this runs on', () => {
  it('writes the fixture', async () => {
    const variants = await buildVariants()
    const refused: Record<string, Entry> = {}
    for (const v of variants) {
      const o = await runVariant(v)
      if (o.kind === 'refused') refused[v.id] = entryOf(v, o)
    }
    const fixture: Fixture = { capturedOn: process.env.SFE_CAPTURED_ON ?? 'unspecified', variantCount: variants.length, refused }
    mkdirSync(dirname(target!), { recursive: true })
    writeFileSync(target!, JSON.stringify(fixture, null, 1) + '\n')
    expect(Object.keys(refused).length).toBeGreaterThan(100)
  }, 60_000)
})

describe.skipIf(!!target)('the save-file refusals', () => {
  // read in `beforeAll`, not here: a skipped suite's body still runs at collection, and the capture run is the one that WRITES this file
  let fixture!: Fixture
  let variants: Variant[] = []
  const outcomes = new Map<string, Outcome>()
  beforeAll(async () => {
    fixture = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Fixture
    variants = await buildVariants()
    for (const v of variants) outcomes.set(v.id, await runVariant(v))
  }, 60_000)

  describe('§1 byte-identical – the English, the code and the class of every refusal are the pre-wave tree\'s', () => {
    it('the corpus is the corpus the capture ran (no variant dropped, none added without a re-capture)', () => {
      expect(variants.length, 'the capture\'s variant count').toBe(fixture.variantCount)
      expect(Object.keys(fixture.refused).every((id) => outcomes.has(id)), 'a captured refusal names a variant the corpus lost').toBe(true)
      expect(fixture.capturedOn).toMatch(/pre-wave/)
    })

    it('every variant is refused exactly as it was – or accepted exactly as it was', () => {
      let refusedNow = 0
      for (const v of variants) {
        const o = outcomes.get(v.id)!
        if (o.kind === 'refused') {
          refusedNow++
          expect(entryOf(v, o), `${v.id}: refused differently`).toEqual(fixture.refused[v.id])
        } else {
          expect(fixture.refused[v.id], `${v.id}: it used to be refused, and is accepted now`).toBeUndefined()
        }
      }
      expect(refusedNow, 'a corpus that refuses nothing measures nothing').toBe(Object.keys(fixture.refused).length)
      expect(refusedNow).toBeGreaterThan(400)
    })
  })

  // the one refusal that stays raw, and why: `asCorrupted` wraps whatever a LOWER layer threw while reading a record out of the player's own database (a torn gzip, unparseable JSON, a migration block tripping
  // over data) – its message is the lower layer's own text, there is no fixed sentence to type, and the fallback to the older generation absorbs it before a player reads it (saveCodec.ts, D-02)
  const RAW = new Set(['db:not-gzip', 'db:ladder-throws'])

  const nestedKeys = (c: unknown, into: Set<string> = new Set()): Set<string> => {
    if (!isCopyRef(c)) return into
    into.add(c.k)
    for (const p of c.p ?? []) nestedKeys(p, into)
    return into
  }
  const CATALOG = (JSON.parse(SRC('src/i18n/catalog.en.json')) as { keys: Record<string, { wrapped?: boolean }> }).keys

  describe('§2 every typed refusal carries its sentence', () => {
    it('`c` renders back to the message, its keys are wired catalog keys, its params survive JSON', () => {
      let typed = 0
      for (const v of variants) {
        const o = outcomes.get(v.id)!
        if (o.kind !== 'refused' || o.name !== 'SaveFileError') continue
        if (RAW.has(v.id)) {
          expect(o.c, `${v.id}: a raw lower-layer message has no sentence to carry`).toBeUndefined()
          expect(o.code).toBe('corrupted')
          continue
        }
        typed++
        expect(isCopyRef(o.c), `${v.id}: refused without a ref`).toBe(true)
        const c = o.c as CopyRef
        expect(renderCopyRef(c, EN), `${v.id}: the ref does not render to the message`).toBe(o.message)
        expect(JSON.parse(JSON.stringify(c)), `${v.id}: not JSON-safe`).toEqual(c)
        for (const k of nestedKeys(c)) expect(CATALOG[k]?.wrapped, `${v.id}: «${k}» is not a wired catalog key (run npm run i18n:extract)`).toBe(true)
      }
      expect(typed).toBeGreaterThan(400)
    })

    it('every refusal of the corpus is a SaveFileError (the lone bare-class refusals of the gate would have no code at all)', () => {
      const bare = variants.filter((v) => {
        const o = outcomes.get(v.id)!
        return o.kind === 'refused' && o.name !== 'SaveFileError'
      })
      expect(bare.map((v) => v.id)).toEqual([])
    })
  })

  describe('§3 nothing ships uncovered', () => {
    const enclosing = (n: ts.Node): string => {
      for (let p: ts.Node | undefined = n.parent; p; p = p.parent) {
        if ((ts.isFunctionDeclaration(p) || ts.isMethodDeclaration(p)) && p.name) return p.name.getText()
        if (ts.isVariableDeclaration(p) && p.initializer && (ts.isArrowFunction(p.initializer) || ts.isFunctionExpression(p.initializer))) return p.name.getText()
      }
      return '<module>'
    }

    it('the keys the three files write are exactly the keys the corpus reaches (a new sentence needs a variant; a retired one leaves the net)', () => {
      const inSource = new Set(FILES.flatMap(cpKeys))
      const reached = new Set<string>()
      for (const v of variants) {
        const o = outcomes.get(v.id)!
        if (o.kind === 'refused') nestedKeys(o.c, reached)
      }
      expect([...inSource].filter((k) => !reached.has(k)).sort(), 'written in source and never reached by the corpus').toEqual([])
      expect([...reached].filter((k) => !inSource.has(k)).sort(), 'reached by the corpus and not written in these files').toEqual([])
      expect(inSource.size).toBeGreaterThan(25)
    })

    it('every `new SaveFileError(` takes a ref – a string literal or a template is how a sentence stops riding the wire – except the one documented dev path', () => {
      const seen: string[] = []
      for (const rel of FILES) {
        const go = (n: ts.Node): void => {
          if (ts.isNewExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'SaveFileError') {
            const arg = n.arguments?.[1]
            const where = `${rel} ${enclosing(n)}`
            const takesRef = !!arg && ((ts.isTaggedTemplateExpression(arg) && ts.isIdentifier(arg.tag) && arg.tag.text === 'cp') || ts.isIdentifier(arg) || ts.isCallExpression(arg))
            if (!takesRef) seen.push(where)
          }
          ts.forEachChild(n, go)
        }
        go(sourceFile(rel))
      }
      expect(seen, 'the raw-message sites: only asCorrupted (the lower layer\'s own text) may stay').toEqual(['src/engine/saveCodec.ts asCorrupted'])
    })
  })

  describe('§4 through the real worker – the kind in `code`, the English in `error`, the sentence in `c`', () => {
    interface Reply {
      id: number
      ok: boolean
      error?: string
      code?: string
      c?: unknown
      revision?: number
    }
    const { send, workerGlobal } = workerHarness<Reply>()
    beforeAll(async () => {
      await import('../src/worker/sim.worker')
      expect(workerGlobal.onmessage, 'the worker module registered its handler').not.toBeNull()
    })

    it('every file variant the codec refuses comes back typed, in the words it always used', async () => {
      let checked = 0
      for (const v of variants) {
        const o = outcomes.get(v.id)!
        if (!v.file || o.kind !== 'refused') continue
        const reply = await send({ type: 'importSave', bytes: (await v.file()).slice().buffer as ArrayBuffer })
        const want = fixture.refused[v.id]!
        expect(reply.ok, `${v.id}: must be refused`).toBe(false)
        expect(reply.code, `${v.id}: the kind must survive the boundary`).toBe(want[1])
        expect(shown(v, reply.error ?? ''), `${v.id}: the English on the wire`).toBe(want[2])
        expect(isCopyRef(reply.c), `${v.id}: the sentence must ride beside the kind`).toBe(true)
        expect(renderCopyRef(reply.c as CopyRef, EN), `${v.id}: the ref on the wire renders to the error beside it`).toBe(reply.error)
        expect(reply.revision, `${v.id}: a refused file has no revision`).toBeUndefined()
        checked++
      }
      expect(checked).toBeGreaterThan(10)
    }, 60_000)

    it('a file the codec accepts and the worker cannot read comes back as the same «contents cannot be read» sentence, typed (the worker\'s own two nets)', async () => {
      const unreadable = fixture.refused['file:gzip-of-not-json']!
      const bytes = await craftFile(35, await gz(enc.encode(spineV35({ results: [null] }))))
      expect(await decodeExportFile(bytes).then(() => 'accepted', () => 'refused'), 'the codec alone accepts it').toBe('accepted')
      const reply = await send({ type: 'importSave', bytes: bytes.slice().buffer as ArrayBuffer })
      expect(reply.ok).toBe(false)
      expect(reply.code).toBe(unreadable[1])
      expect(reply.error).toBe(unreadable[2])
      expect(isCopyRef(reply.c)).toBe(true)
      expect(renderCopyRef(reply.c as CopyRef, EN)).toBe(reply.error)
    }, 60_000)
  })

  describe('§5 `errorText` – a ref is rendered, anything else is the raw message', () => {
    it('English: the ref renders to the very message; a bare kind and an unknown code print the raw message', () => {
      resetI18nForTests(null)
      for (const v of variants) {
        const o = outcomes.get(v.id)!
        if (o.kind !== 'refused' || !o.c || o.name !== 'SaveFileError') continue
        expect(errorText(o.code ?? undefined, o.message, o.c as CopyRef), v.id).toBe(o.message)
      }
      expect(errorText('corrupted', 'Some message')).toBe('Some message')
      expect(errorText('future-schema', 'Some message', null)).toBe('Some message')
    })

    it('⚠ a ref that is not this message\'s (a stale one) is ignored: the translation of one sentence never stands over another', () => {
      resetI18nForTests(null)
      const other = (variants.map((v) => outcomes.get(v.id)!).find((o) => o.kind === 'refused' && isCopyRef(o.c)) as Extract<Outcome, { kind: 'refused' }>).c as CopyRef
      expect(errorText('corrupted', 'A different sentence entirely', other)).toBe('A different sentence entirely')
    })

    it('a probe catalog reaches the holes and the nested clauses (the translations are ASCII markers, invariant 4)', () => {
      const ctx = (lookup: Record<string, string>) => ({ locale: 'ru', lookup: (k: string) => lookup[k] })
      const spine = variants.map((v) => outcomes.get(v.id)!).find((o) => o.kind === 'refused' && isCopyRef(o.c) && (o.c as CopyRef).p?.some(isCopyRef) && (o.c as CopyRef).p?.length === 2) as Extract<Outcome, { kind: 'refused' }>
      const c = spine.c as CopyRef
      const clause = (c.p ?? []).find(isCopyRef) as CopyRef
      const field = (c.p ?? []).find((p) => typeof p === 'string') as string
      const ru = { [c.k]: 'FRAME[{0}|{1}]', [clause.k]: 'CLAUSE' }
      expect(renderCopyRef(c, ctx(ru))).toBe(`FRAME[${field}|CLAUSE]`)
      // a nested clause the catalog does not know falls back to its own English, inside the translated frame
      expect(renderCopyRef(c, ctx({ [c.k]: 'FRAME[{0}|{1}]' }))).toBe(`FRAME[${field}|${renderCopyRef(clause, EN)}]`)
    })
  })

  describe('§6 the owner\'s rows – every key has its DRAFT row in the saves table, the Russian column empty (his words)', () => {
    const keys = (): Set<string> => new Set(FILES.flatMap(cpKeys))

    it('each key written by the three files joins a row of ru-saves-settings-2026-10.md that has no Russian yet', () => {
      const rows = readRows(listDocs()).rows.filter((r) => r.doc === 'ru-saves-settings-2026-10.md' && r.english !== null)
      const byKey = new Map(rows.map((r) => [normKey(r.english!), r]))
      const missing: string[] = []
      const answered: string[] = []
      for (const k of keys()) {
        const row = byKey.get(normKey(k.replace(/\{\d+\}/g, '${x}')))
        if (!row) missing.push(k)
        else if (row.russian !== null) answered.push(k)
      }
      expect(missing, 'a sentence with no row for the owner to write').toEqual([])
      expect(answered, 'his Russian is not ours to write: these rows were filled in without him').toEqual([])
      expect(rows.length).toBeGreaterThan(30)
    })

    it('the count the table\'s lead states in prose («Seven kinds, N sentences») is the number of keys – a number written in prose is pinned against the thing it counts', () => {
      const lead = /\*\*Seven kinds, (\d+)\s+sentences\*\*/.exec(readFileSync(resolve(ROOT, 'docs/localization/ru-saves-settings-2026-10.md'), 'utf8'))
      expect(lead, 'the lead sentence was reworded: re-aim this pin with it').not.toBeNull()
      expect(Number(lead![1]), 'the table says one number and the source writes another').toBe(keys().size)
    })

    it('the split the spec row records («N catalog keys: A sentences and frames, and B clauses») is what the corpus sees – a number written in prose is pinned against the thing it counts', () => {
      const m = /\*\*(\d+) catalog keys: (\d+) sentences and frames, and (\d+) clauses\*\*/.exec(SRC('docs/specs/i18n-2026-10.md'))
      expect(m, 'the spec row L3-7b was reworded: re-aim this pin with it').not.toBeNull()
      const roots = new Set<string>()
      const clauses = new Set<string>()
      for (const v of variants) {
        const o = outcomes.get(v.id)!
        if (o.kind !== 'refused' || !isCopyRef(o.c)) continue
        roots.add(o.c.k)
        for (const p of o.c.p ?? []) nestedKeys(p, clauses)
      }
      expect([roots.size + clauses.size, roots.size, clauses.size], 'the spec says one split and the corpus reaches another').toEqual([Number(m![1]), Number(m![2]), Number(m![3])])
    })

    it('the seven kinds are the seven the type declares, and each is reached by the corpus (a kind without a variant is a kind this net never saw)', () => {
      const declared = [...SRC('src/engine/saveGuard.ts').matchAll(/^\s*\| '([a-z-]+)'\s*\/\//gm)].map((m) => m[1]!).sort()
      expect(declared).toHaveLength(7)
      const reached = new Set<string>()
      for (const v of variants) {
        const o = outcomes.get(v.id)!
        if (o.kind === 'refused' && o.code) reached.add(o.code)
      }
      expect([...reached].sort()).toEqual(declared)
    })
  })
})
