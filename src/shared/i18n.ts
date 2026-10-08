// THE LOCALIZATION CORE – docs/specs/i18n-2026-10.md §3.2–§3.3, wave L1a.
//
// ⚠ WHAT THIS FILE IS. The one module BOTH halves of the app may import: the engine to EMIT copy as
// data (a `CopyRef`, never rendered prose), the UI to RENDER it under a locale. So it is a
// framework-free zone file – no Vue, no Pinia (`scripts/engine-purity.mjs` bans them in
// `src/shared`), and nothing else with a side effect either: no storage, no clock, no dice.
// `tests/i18n-purity.test.ts` pins the rest. The locale is a PARAMETER of every call
// here (`RenderContext.locale`), never something this module can look up – which is how invariant 2
// stays true by construction: the engine's dice cannot depend on a language it is never told. (Two memo
// caches – compiled messages, plural rules per locale tag – are keyed by their own inputs and carry no
// selected locale; there is no `let` at module level.)
//
// ⚠⚠ NUMBERS AND MONEY ARE NOT FORMATTED HERE, AND NEVER WILL BE (owner, 07.10, spec §9.6: «я бы
// доллары оставил и не заморачивался»). `$12,500.40` and `$40.6M` are ONE form across locales, and
// `shared/money.ts` is the only money formatting: a caller passes an already-formatted string. A
// number param prints as `String(n)` – no grouping, no separators, no `Intl.NumberFormat` (the spec's
// first draft listed it in §3.3; §9.6 ruled it out and the ruling is later). The ONE `Intl` call in
// this file is `Intl.PluralRules`, which picks a plural CATEGORY and formats nothing.
//
// ⚠ THE KEY IS THE ENGLISH LITERAL (§3.1) – so a miss degrades to the shipped game, never to a key
// id. `Stats` renders itself in English with no catalog at all; a context tag (`nav|Stats`) splits
// one English string into two translations and is stripped before English is shown.
//
// ⚠ THE MESSAGE SYNTAX IS A SUBSET OF ICU, AND ONE THING IS DIFFERENT ON PURPOSE. English sources
// are full of apostrophes (`can't`, `Rain washed out {0}'s practice`), so the apostrophe is NOT a
// quote character here – a backslash is: `\{`, `\}`, `\#` and `\\` produce the character, any other
// backslash is literal. What parses:
//   {name} / {0}                                  – interpolation
//   {n, plural, =0{…} one{…} few{…} many{…} other{…}}   – `#` inside a branch prints the number
//   {g, select, f{…} m{…} other{…}}              – a missing or unknown value takes `other`
// `other` is required in both. `offset:`, `selectordinal`, number/date types and CASE FORMS are
// non-goals of L1 (spec §3.3, intake 07.10) – an unsupported construct is a syntax error, not a
// silent pass-through.
//
// ⚠ A TRANSLATION THAT CANNOT BE RENDERED FALLS BACK TO ENGLISH AND IS COUNTED, it never throws into
// a render. `MessageError` is for the formatter's direct callers; `translate` catches it. The
// `onMiss` hook is how the UI layer turns ruling 4 («legacy English is not an acceptable visible
// fallback in Russian mode») into a number.

/** The language the source literals are written in. It needs no catalog: the key renders itself. */
export const SOURCE_LOCALE = 'en'

/** Copy the engine emits instead of prose (spec §3.2). `k` is the English source with `{0}`-style
 *  placeholders, `p` the positional params – which may themselves be CopyRefs (letters hold
 *  paragraphs), so rendering recurses. JSON-safe by construction: L3 stores these in saves. */
export interface CopyRef {
  k: string
  p?: unknown[]
}

/** Named params for UI calls (`{ week, total }`), positional for CopyRefs (`[name]`). */
export type MessageParams = Readonly<Record<string, unknown>> | readonly unknown[]

/** Why English was shown for a key: `missing` – no catalog entry; `invalid` – an entry that would
 *  not render (bad syntax, a plural argument that is not a number). */
export type MissReason = 'missing' | 'invalid'

export interface RenderContext {
  /** Which language to render – picks the plural rules, and decides whether `lookup` is asked at all. */
  locale: string
  /** The catalog: key → message for `locale`, `undefined` when there is none. Not asked for English. */
  lookup?: (key: string) => string | undefined
  /** Told once per key that fell back to English. Called from inside a render, so it must not write
   *  reactive state. */
  onMiss?: (key: string, why: MissReason) => void
}

/** A message that cannot be parsed or rendered. `translate` and `renderCopyRef` catch exactly this. */
export class MessageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MessageError'
  }
}

export function isCopyRef(v: unknown): v is CopyRef {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false
  const o = v as { k?: unknown; p?: unknown }
  return typeof o.k === 'string' && (o.p === undefined || Array.isArray(o.p))
}

/** The engine's call shape (spec §3.2): `` cp`Rain washed out ${name}'s practice` `` is
 *  `{ k: "Rain washed out {0}'s practice", p: [name] }`. One backtick prefix per call site, which is
 *  what makes the class-(b)/(c) migration mechanical. Draws nothing. */
export function cp(strings: TemplateStringsArray, ...values: unknown[]): CopyRef {
  let k = strings[0] ?? ''
  for (let i = 0; i < values.length; i++) k += `{${i}}${strings[i + 1] ?? ''}`
  return values.length > 0 ? { k, p: values } : { k }
}

/** `nav|Stats` → `{ ctx: 'nav', text: 'Stats' }`. A tag is a short lowercase word before the first
 *  `|`; anything else (`Win | Lose`, `Draw|Seed`) is plain text. */
const CONTEXT_TAG = /^([a-z][a-z0-9_-]{0,23})\|/
export function splitContext(key: string): { ctx: string | null; text: string } {
  const m = CONTEXT_TAG.exec(key)
  return m ? { ctx: m[1] ?? null, text: key.slice(m[0].length) } : { ctx: null, text: key }
}

const pluralRules = new Map<string, Intl.PluralRules>()
/** The plural category of `n` in `locale` – `Intl.PluralRules`, the only Intl in this module. Russian:
 *  1, 21, 101… `one`; 2–4, 22–24… `few`; 0, 5–20, 25–30… `many`; fractions `other`. */
export function pluralCategory(locale: string, n: number): Intl.LDMLPluralRule {
  let rules = pluralRules.get(locale)
  if (!rules) {
    rules = new Intl.PluralRules(locale)
    pluralRules.set(locale, rules)
  }
  return rules.select(n)
}

// ---------------------------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------------------------

interface Branch {
  sel: string
  body: Node[]
}
type Node =
  | string
  | { t: 'arg'; name: string }
  | { t: 'hash' }
  | { t: 'plural' | 'select'; name: string; branches: Branch[] }

const PLURAL_CATEGORIES = new Set(['zero', 'one', 'two', 'few', 'many', 'other'])
const WORD = /[A-Za-z0-9_]+/y
const ESCAPABLE = '{}\\#'

function parseMessage(src: string): Node[] {
  let i = 0
  const fail = (why: string): never => {
    throw new MessageError(`${why} (at ${i} in "${src}")`)
  }
  const skipSpace = (): void => {
    while (i < src.length && /\s/.test(src[i] ?? '')) i++
  }
  const word = (): string => {
    WORD.lastIndex = i
    const m = WORD.exec(src)
    if (!m) return fail('expected a name')
    i += m[0].length
    return m[0]
  }
  const selector = (): string => {
    if (src[i] !== '=') return word()
    i++
    const digits = word()
    return /^\d+$/.test(digits) ? `=${digits}` : fail('an exact-match selector is =N')
  }

  // `nested` = we are inside a branch body, which ends at its closing brace (left for the caller).
  const nodes = (inPlural: boolean, nested: boolean): Node[] => {
    const out: Node[] = []
    let text = ''
    const flush = (): void => {
      if (text !== '') out.push(text)
      text = ''
    }
    while (i < src.length) {
      const c = src[i] ?? ''
      if (c === '\\') {
        const next = src[i + 1]
        if (next !== undefined && ESCAPABLE.includes(next)) {
          text += next
          i += 2
        } else {
          text += c
          i++
        }
      } else if (c === '{') {
        flush()
        i++
        out.push(argument(inPlural))
      } else if (c === '}') {
        if (!nested) fail('unmatched }')
        break
      } else if (c === '#' && inPlural) {
        flush()
        out.push({ t: 'hash' })
        i++
      } else {
        text += c
        i++
      }
    }
    if (nested && src[i] !== '}') fail('unclosed {')
    flush()
    return out
  }

  const argument = (inPlural: boolean): Node => {
    skipSpace()
    const name = word()
    skipSpace()
    if (src[i] === '}') {
      i++
      return { t: 'arg', name }
    }
    if (src[i] !== ',') return fail('expected , or }')
    i++
    skipSpace()
    const type = word()
    if (type !== 'plural' && type !== 'select') return fail(`unsupported argument type "${type}"`)
    skipSpace()
    if (src[i] !== ',') return fail('expected ,')
    i++
    const branches: Branch[] = []
    for (;;) {
      skipSpace()
      if (i >= src.length) return fail('unclosed {')
      if (src[i] === '}') {
        i++
        break
      }
      const sel = selector()
      if (type === 'plural' && !sel.startsWith('=') && !PLURAL_CATEGORIES.has(sel)) {
        return fail(`"${sel}" is not a plural category`)
      }
      if (branches.some((b) => b.sel === sel)) return fail(`duplicate branch "${sel}"`)
      skipSpace()
      if (src[i] !== '{') return fail('expected {')
      i++
      branches.push({ sel, body: nodes(type === 'plural' ? true : inPlural, true) })
      i++ // the branch's closing brace
    }
    if (!branches.some((b) => b.sel === 'other')) return fail(`${type} needs an "other" branch`)
    return { t: type, name, branches }
  }

  return nodes(false, false)
}

const compiled = new Map<string, Node[]>()
function compile(template: string): Node[] {
  let nodes = compiled.get(template)
  if (!nodes) {
    nodes = parseMessage(template)
    if (compiled.size > 20000) compiled.clear()
    compiled.set(template, nodes)
  }
  return nodes
}

// ---------------------------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------------------------

/** Deeper than any real letter nests; a CopyRef that reaches it is a cycle or a bug. */
const MAX_DEPTH = 12

function param(params: MessageParams | undefined, name: string): unknown {
  if (params === undefined) return undefined
  if (Array.isArray(params)) return /^\d+$/.test(name) ? (params as readonly unknown[])[Number(name)] : undefined
  const record = params as Readonly<Record<string, unknown>>
  return Object.prototype.hasOwnProperty.call(record, name) ? record[name] : undefined
}

/** A param as text, or null when it has no text form (absent, null, an object) – the caller leaves
 *  the placeholder visible then, so a forgotten param shows itself instead of printing `undefined`. */
function scalar(value: unknown, ctx: RenderContext, depth: number): string | null {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') return String(value)
  if (isCopyRef(value)) return translateAt(value.k, value.p, ctx, depth + 1)
  return null
}

function pluralNumber(value: unknown, name: string): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN
  if (!Number.isFinite(n)) throw new MessageError(`plural argument "${name}" is not a number`)
  return n
}

function run(nodes: readonly Node[], params: MessageParams | undefined, ctx: RenderContext, depth: number, hash: number | null): string {
  let out = ''
  for (const node of nodes) {
    if (typeof node === 'string') {
      out += node
    } else if (node.t === 'hash') {
      out += hash === null ? '#' : String(hash)
    } else if (node.t === 'arg') {
      out += scalar(param(params, node.name), ctx, depth) ?? `{${node.name}}`
    } else if (node.t === 'select') {
      const key = scalar(param(params, node.name), ctx, depth) ?? ''
      const branch = node.branches.find((b) => b.sel === key) ?? node.branches.find((b) => b.sel === 'other')
      out += run(branch?.body ?? [], params, ctx, depth, hash)
    } else {
      const n = pluralNumber(param(params, node.name), node.name)
      const branch =
        node.branches.find((b) => b.sel === `=${n}`) ??
        node.branches.find((b) => b.sel === pluralCategory(ctx.locale, n)) ??
        node.branches.find((b) => b.sel === 'other')
      out += run(branch?.body ?? [], params, ctx, depth, n)
    }
  }
  return out
}

function formatAt(template: string, params: MessageParams | undefined, ctx: RenderContext, depth: number): string {
  if (depth > MAX_DEPTH) throw new MessageError('copy nests too deeply')
  // The common case – an English literal with nothing to fill – costs a few scans and no parse. `}` is
  // in the test so that a stray one is judged by the parser (an error) whether or not a `{` came first.
  if (template.indexOf('{') === -1 && template.indexOf('}') === -1 && template.indexOf('\\') === -1) return template
  return run(compile(template), params, ctx, depth, null)
}

function translateAt(key: string, params: MessageParams | undefined, ctx: RenderContext, depth: number): string {
  const english = splitContext(key).text
  if (ctx.locale !== SOURCE_LOCALE) {
    const hit = ctx.lookup?.(key)
    if (hit === undefined || hit === '') {
      ctx.onMiss?.(key, 'missing')
    } else {
      try {
        return formatAt(hit, params, ctx, depth)
      } catch (e) {
        if (!(e instanceof MessageError)) throw e
        ctx.onMiss?.(key, 'invalid')
      }
    }
  }
  try {
    return formatAt(english, params, ctx, depth)
  } catch (e) {
    // A source literal that does not format is a bug in the SOURCE, which `i18n:check` (L1b) is for;
    // the player gets the literal as written rather than a crash.
    if (e instanceof MessageError) return english
    throw e
  }
}

/** Fill one message. Throws `MessageError` on a bad template – use `translate` where a render must
 *  survive one. */
export function formatMessage(template: string, params: MessageParams | undefined, ctx: RenderContext): string {
  return formatAt(template, params, ctx, 0)
}

/** The UI's call shape: look `key` up for the context's locale, fall back to its English text, fill
 *  the params. English never touches the catalog and never counts as a miss. */
export function translate(key: string, params: MessageParams | undefined, ctx: RenderContext): string {
  return translateAt(key, params, ctx, 0)
}

/** Render a CopyRef the engine emitted, recursing into params that are CopyRefs. */
export function renderCopyRef(ref: CopyRef, ctx: RenderContext): string {
  return translateAt(ref.k, ref.p, ctx, 0)
}
