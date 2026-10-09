// L3-7 (10.10) – TYPED STORE-ERROR CODES. docs/specs/i18n-2026-10.md §8 row L3-7; the ask is RU-13A's / RU-15's.
//
// WHAT THE WAVE DID: the four sentences of a letter that cannot be answered (`offerAnswerError`), the sentence of a last offer that is not a question (`LAST_OFFER_NOT_A_QUESTION`) and the five sentences the
// store writes itself now carry a STABLE CODE beside the English: `CodedRefusalError` (shared/protocol/messages.ts) crosses the worker boundary as `{ ok: false, error, code }`, the store keeps `errorCode`
// (and `saveOp.code`) beside `error`, and `composables/errorText.ts` maps each code to the `t()` of its sentence. The English `message` stays on the error as the fallback for any code a build does not know.
// No refusal behaviour moved: the same sentences, thrown from the same places, refused for the same reasons – the door tests of L3-0 are the net for that (and they ran).
//
// WHAT THIS FILE PROVES:
//   §1 every code's `t()` key is the engine's / the store's own sentence, byte for byte (the owner's rows join on it);
//   §2 every sentence `offerAnswerError` and `offerAnswerErrorFor` can return has a code (a fifth sentence cannot ship without one);
//   §3 the real writers throw coded refusals whose message is the sentence they always threw;
//   §4 through the REAL worker: the reply carries the code and the sentence;
//   §5 an unknown code, no code, and a code whose sentence is not fixed fall back to the raw message.
// The mounted half (the store, `StoreError`, the Saves strip and the recovery row drawing the translation) is tests/component/i18n-l3-7-errors-display.test.ts.
import 'fake-indexeddb/auto'
import { beforeAll, describe, expect, it } from 'vitest'
import ts from 'typescript'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { errorText } from '../src/composables/errorText'
import { OFFER_REFUSAL_CODES, offerRefusal } from '../src/engine/offers'
import { LAST_OFFER_NOT_A_QUESTION, answerRetirement, createWorld, acceptOffer } from '../src/engine/world'
import { encodeExportFile } from '../src/engine/saveCodec'
import { CodedRefusalError, DEFAULT_PROFILE, type WorkerErrorCode } from '../src/shared/protocol'
import { workerHarness } from './helpers/workerHarness'
import { resetI18nForTests } from '../src/i18n'

const ROOT = resolve(__dirname, '..')
const SRC = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8')

describe('§1 each code\'s t() key is the sentence the engine / the store writes, byte for byte', () => {
  it('the four offer sentences and the last-offer sentence', () => {
    resetI18nForTests(null)
    for (const [sentence, code] of Object.entries(OFFER_REFUSAL_CODES)) expect(errorText(code, 'raw'), code).toBe(sentence)
    expect(errorText('last-offer-not-a-question', 'raw')).toBe(LAST_OFFER_NOT_A_QUESTION)
    expect(Object.keys(OFFER_REFUSAL_CODES)).toHaveLength(4)
  })

  it('the store\'s own five sentences are the literals it writes (read off the store\'s source, so a reworded sentence leaves the key behind and fails here)', () => {
    resetI18nForTests(null)
    const store = SRC('src/stores/game.ts')
    for (const [code, field] of [
      ['SAVE_CONFLICT', 'error'],
      ['STALE_REVISION', 'error'],
      ['store-restarted', 'error'],
      ['store-restarted-from-save', 'error'],
      ['store-crashed', 'error'],
    ] as const) {
      const sentence = errorText(code, 'raw')
      expect(sentence, code).not.toBe('raw')
      expect(store, `${code}: the store writes «${sentence}»`).toContain(`this.${field} = '${sentence}'`)
      // and the code is written beside it
      const at = store.indexOf(`this.${field} = '${sentence}'`)
      expect(store.slice(at, at + 400), `${code}: written beside its sentence`).toContain(`this.errorCode = '${code}'`)
    }
  })
})

describe('§2 every sentence a letter can be refused with has a code', () => {
  const sentencesOf = (rel: string, fn: string): string[] => {
    const sf = ts.createSourceFile(rel, SRC(rel), ts.ScriptTarget.Latest, true)
    const out: string[] = []
    const go = (n: ts.Node): void => {
      if (ts.isFunctionDeclaration(n) && n.name?.text === fn && n.body) {
        const walk = (m: ts.Node): void => {
          if (ts.isReturnStatement(m) && m.expression && ts.isStringLiteral(m.expression)) out.push(m.expression.text)
          ts.forEachChild(m, walk)
        }
        walk(n.body)
      }
      ts.forEachChild(n, go)
    }
    go(sf)
    return out
  }
  it('`offerAnswerError` returns exactly the four coded sentences, and `offerAnswerErrorFor` three of them', () => {
    expect(sentencesOf('src/engine/offers.ts', 'offerAnswerError').sort()).toEqual(Object.keys(OFFER_REFUSAL_CODES).sort())
    const worldLevel = sentencesOf('src/engine/world/sponsors.ts', 'offerAnswerErrorFor')
    expect(worldLevel).toHaveLength(3)
    for (const s of worldLevel) expect(OFFER_REFUSAL_CODES[s], `«${s}» has no code`).toBeDefined()
  })

  it('every throw of one of them goes through `offerRefusal` – no plain `new Error(offerAnswerErrorFor(…))` is left', () => {
    expect(SRC('src/engine/world/sponsors.ts')).not.toMatch(/new Error\(offerAnswerErrorFor/)
    expect((SRC('src/engine/world/sponsors.ts').match(/throw offerRefusal\(offerAnswerErrorFor\(world, offerId\)\)/g) ?? []).length).toBe(4)
  })
})

describe('§3 the real writers throw coded refusals – the sentence they always threw, now with its code', () => {
  it('a last offer is not a question: the sentence is the exported constant and the code is last-offer-not-a-question; nothing was written', () => {
    const world = createWorld('l37-errors', { ...DEFAULT_PROFILE })
    world.retirementOffer = { askedWeek: 0, seasonIndex: 0, reason: 'age', final: true }
    let caught: unknown
    try {
      answerRetirement(world, false)
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(CodedRefusalError)
    expect((caught as CodedRefusalError).code).toBe('last-offer-not-a-question')
    expect((caught as Error).message).toBe(LAST_OFFER_NOT_A_QUESTION)
    expect(world.retirementOffer, 'the offer is still standing – the refusal half-ran nothing').not.toBeNull()
  })

  it('a letter that is not on the paper: acceptOffer throws offer-not-in-inbox with the sentence', () => {
    const world = createWorld('l37-errors-2', { ...DEFAULT_PROFILE })
    let caught: unknown
    try {
      acceptOffer(world, 'no-such-letter')
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(CodedRefusalError)
    expect((caught as CodedRefusalError).code).toBe('offer-not-in-inbox')
    expect((caught as Error).message).toBe('That letter is not in the inbox.')
  })

  it('`offerRefusal` gives a plain Error for a sentence with no code (none today) and a coded one for each of the four', () => {
    expect(offerRefusal('Something else entirely')).not.toBeInstanceOf(CodedRefusalError)
    for (const [sentence, code] of Object.entries(OFFER_REFUSAL_CODES)) {
      const e = offerRefusal(sentence)
      expect(e).toBeInstanceOf(CodedRefusalError)
      expect((e as CodedRefusalError).code).toBe(code)
      expect(e.message).toBe(sentence)
    }
  })
})

describe('§4 through the real worker the reply carries the code beside the sentence', () => {
  interface Reply {
    id: number
    ok: boolean
    type?: string
    error?: string
    code?: WorkerErrorCode
    revision?: number
  }
  let lastRevision = 0
  const { send, workerGlobal } = workerHarness<Reply>((r) => {
    if (r.ok && typeof r.revision === 'number') lastRevision = r.revision
  })
  beforeAll(async () => {
    await import('../src/worker/sim.worker')
    expect(workerGlobal.onmessage, 'the worker module registered its handler').not.toBeNull()
  })

  it('answerRetirement with retire:false on a final offer, and signOffer on a letter that is not there', async () => {
    const world = createWorld('l37-errors-worker', { ...DEFAULT_PROFILE })
    world.retirementOffer = { askedWeek: 0, seasonIndex: 0, reason: 'age', final: true }
    const imported = await send({ type: 'importSave', bytes: (await encodeExportFile(world)).slice().buffer as ArrayBuffer })
    expect(imported.ok, 'the career imported').toBe(true)
    const last = await send({ type: 'answerRetirement', retire: false, baseRevision: lastRevision })
    expect(last.ok).toBe(false)
    expect(last.code).toBe('last-offer-not-a-question')
    expect(last.error).toBe(LAST_OFFER_NOT_A_QUESTION)
    expect(last.revision, 'no revision rides a coded refusal').toBeUndefined()
    const gone = await send({ type: 'signOffer', offerId: 'no-such-letter', baseRevision: lastRevision })
    expect(gone.ok).toBe(false)
    expect(gone.code).toBe('offer-not-in-inbox')
    expect(gone.error).toBe('That letter is not in the inbox.')
  })
})

describe('§5 the fallback – an unknown code, no code, and a code with variable detail print the raw message', () => {
  it('raw it stays', () => {
    resetI18nForTests(null)
    expect(errorText(undefined, 'Some sentence')).toBe('Some sentence')
    expect(errorText('', 'Some sentence')).toBe('Some sentence')
    expect(errorText('not-a-code-this-build-knows', 'Some sentence')).toBe('Some sentence')
    for (const code of ['INVALID_COMMAND', 'corrupted', 'future-schema', 'invalid-shape', 'not-a-save', 'truncated', 'oversized', 'oversized-expanded'] as const) {
      expect(errorText(code, `detail for ${code}`), code).toBe(`detail for ${code}`)
    }
  })
})
