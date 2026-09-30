// ⭐⭐ THE COPY CENSUS – HOW BIG IS THE PLAYER-FACING COPY CORPUS, IN NUMBERS. Alpha-readiness §C,
// ordered 30.09. It is the denominator for the RU / ES localization decision (RU first, the owner
// authors; ES only through a trusted human translator; both AFTER a key-extraction wave), and it
// also runs §A3's round-44 check: the LIVE small-talk pool counted against the documents.
//
//   npx vite-node tools/copy-census.ts [--misses] [--dump <path-substring>]
//     --misses  lists EVERY registered string the scan did not find; --dump prints what one file contributed
//
// ⚠ DETERMINISTIC AND DRAW-FREE. No engine draws, no network, no clock, no Math.random. It reads the
// TRACKED tree (`git ls-files`, the same H-03 rule the tools registry follows – an untracked scratch
// file in someone's checkout cannot move a number), sorts every list, and picks its 20 LIKELY
// samples by sha1 order rather than by chance. Two runs on one tree print byte-identical text; the
// last lines carry the sha1 of the body so that can be checked across runs and across commits.
//
// ⚠ IT READS THE SOURCE WITH THE REAL PARSERS, NOT WITH REGEXES OVER TEXT. TypeScript's own AST for
// every string / template / `+` concatenation (so a sentence split across lines is ONE string and
// a comment is never a string), `vue/compiler-sfc` for templates (so a text node is a text node),
// and a LIVE import of `ECONOMY` and of the small-talk catalogue (so those counts are exact strings,
// not a guess at what a literal will evaluate to).
//
// ── THE CLASSIFICATION (this IS the methodology – change it here and nowhere else) ────────────────
//
//  CERTAIN – player-facing by where it lives:
//   (a) `.vue` template TEXT and the attributes `title`, `aria-label`, `placeholder`, `alt`.
//       Adjacent text and `{{ }}` runs merge into ONE string with each mustache shown as `${…}`
//       (a translator gets the sentence, not its crumbs); a run counts when it holds >= 2 letters or
//       digits once the mustaches are gone. A bound `:title="'…'"` counts its string literals.
//   (b) known copy homes in src/engine and src/shared:
//       · the life-beat copy leaves `world/lifeBeat/*Copy.ts`, plus the two generated corpora
//         `world/smallTalkCorpus.ts` and `world/albumCorpus.ts`;
//       · the hub's pools – every top-level SCREAMING_CASE table in `world/lifeBeat.ts`;
//       · `ECONOMY`'s `label` / `blurb` / `name` string fields, from a live walk of the object;
//       · exported top-level consts whose name ends REFUSAL / LABEL / NOTE / LINE / WORDS / COPY
//         (plural accepted: LINES, NOTES, LABELS, REFUSALS).
//   (c) ledger sentences: every string, template and concatenation inside a `text:` property in
//       src/engine (the shape `addEvent(world, { text: … })` feeds the feed with).
//   In a CERTAIN home a literal still has to be text: identifier-shaped (kebab / camel / snake /
//   SCREAMING), path, hex, seed-key, css-class-list and < 2-letter strings are ids, not copy.
//
//  LIKELY – any OTHER string literal in the scripts of src/engine, src/components, src/composables
//   and in `.vue` template expressions, when the text (mustaches removed) is >= 15 characters,
//   contains a space, contains no `/`, and is not a seed key / css class list / identifier shape.
//   SAMPLED, NOT RESOLVED: the report prints 20 hash-picked examples so the purity of the bucket can
//   be judged by eye. A LIKELY string inside `throw` / `new Error` / `console.*` is tagged, because
//   that is where the dev-facing noise lives.
//
//  EXCLUDED – counted by reason and never read: identifier shapes, paths, seed keys, hex / css,
//   strings with < 2 letters, short text-shaped literals (the recall risk, split so it can be
//   judged), and – by file – tests/, e2e/, docs/, tools/, scripts/ and the parts of src/ outside the
//   scope above (art, audio, stores, worker, db).
//
//  WORDS = whitespace-split tokens of the text after every `${…}` is stripped. That is the brief's
//   definition, applied literally, so a bare `–` between two spaces is a token; it is a few percent.
//
// AREAS are assigned by the HOME PATH first (album, small talk, life-beat, letters/inbox, diary),
// then by context (`text:` = ledger sentences), then by the file kind – so a `.vue` under
// `components/album/` is album, and `world/lifeBeat.ts` is life-beat even where it holds a `text:`.
//
// ⚠ WHAT THE CENSUS CANNOT SEE, stated so nobody quotes it as a ceiling: a literal under 15 chars
// outside a CERTAIN home (a bare «Open» in a ternary) is EXCLUDED – the report counts those as the
// recall risk; a message composed at runtime from parts; JSON / markdown assets; `public/`; and the
// image text of the album art. The strings-table cross-check at the end is the recall measurement:
// how many of the strings the wave tables REGISTER as player-facing this extractor actually found.

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { parse as parseSfc } from 'vue/compiler-sfc'
import { ECONOMY } from '../src/engine/economy'
import { SMALL_TALK_FRAMES, SMALL_TALK_SITUATIONS } from '../src/engine/world/lifeBeat'

// ── vocabulary ───────────────────────────────────────────────────────────────────────────────────
type Scope = 'engine' | 'shared' | 'component' | 'composable' | 'vue' | 'outside'
type Area =
  | 'screens'
  | 'lifebeat'
  | 'smalltalk'
  | 'economy'
  | 'letters'
  | 'ledger'
  | 'album'
  | 'diary'
  | 'engine'
  | 'scripts'
type Shape = 'nowords' | 'hex' | 'path' | 'seed' | 'ident' | 'css' | 'oneword' | 'text'

interface Item {
  file: string
  line: number
  text: string
  area: Area
  reason: string
  dev: boolean
}
interface Ctx {
  top: string | null
  prop: string | null
  textAnc: boolean
  suffixConst: boolean
  call: string | null
  inThrow: boolean
}

const HOLE = '¤'
const HUB = 'src/engine/world/lifeBeat.ts'
const MIN_LIKELY = 15
const SAMPLE = 20
const ECON_KEYS = new Set(['label', 'blurb', 'name'])
const VUE_ATTRS = new Set(['title', 'aria-label', 'placeholder', 'alt'])
const SUFFIX = /(?:REFUSAL|LABEL|NOTE|LINE|WORDS|COPY)S?$/
const SKIP_ATTR = /^(?:class|style|d|points|viewBox|transform|data-|xmlns|fill|stroke|filter|clip-path|mask)/
const NO_CTX: Ctx = { top: null, prop: null, textAnc: false, suffixConst: false, call: null, inThrow: false }
const STOP = new Set(
  'the a an and or of to in on at for is are was were you your he she it we they i my me her his this that not no with from by as be been has have had will can do did'.split(' '),
)

const AREAS: readonly (readonly [Area, string])[] = [
  ['screens', 'screens (.vue)'],
  ['lifebeat', 'life-beat copy'],
  ['smalltalk', 'small talk'],
  ['economy', 'ECONOMY labels/blurbs/names'],
  ['letters', 'letters / inbox'],
  ['ledger', 'ledger sentences (text:)'],
  ['album', 'album'],
  ['diary', 'diary'],
  ['engine', 'other engine (+ shared)'],
  ['scripts', 'component / composable scripts'],
]

// ── text helpers ─────────────────────────────────────────────────────────────────────────────────
/** Every `${…}` (brace-depth aware, so `${f({a: 1})}` is one hole) becomes one HOLE character. */
function holeify(text: string): string {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '$' && text[i + 1] === '{') {
      let depth = 1
      let j = i + 2
      while (j < text.length && depth > 0) {
        if (text[j] === '{') depth++
        else if (text[j] === '}') depth--
        j++
      }
      out += HOLE
      i = j - 1
    } else out += text[i]
  }
  return out
}
const bareOf = (text: string): string => holeify(text).split(HOLE).join(' ').trim()
const letterCount = (s: string): number => (s.match(/[\p{L}\p{N}]/gu) ?? []).length
const wordsOf = (text: string): number => bareOf(text).split(/\s+/).filter(Boolean).length
const hasHole = (text: string): boolean => holeify(text).includes(HOLE)
/** A comparison key that survives the doc's `{name}` / `{{ x }}` spellings and the source's `${…}`. */
function normKey(s: string): string {
  const unified = s
    .replace(/\{\{[^}]*\}\}/g, '${x}')
    .replace(/(^|[^$])\{[A-Za-z_][\w.]*\}/g, '$1${x}')
    .replace(/\*[A-Za-z]{1,12}\*/g, '${x}') // the wave-7 tables write a hole as *N* / *finish*
  return holeify(unified).replace(/`¤`/g, HOLE).replace(/\s+/g, ' ').trim()
}

const CSS_HINT =
  /\b\d+(?:\.\d+)?(?:px|rem|em|vh|vw|ms|deg)\b|var\(--|calc\(|url\(|gradient\(|cubic-bezier|rgba?\(|hsla?\(|translate[XYZ]?\(|scale\(|rotate\(/i

function cssClassList(probe: string): boolean {
  const tokens = probe.replace(new RegExp(HOLE, 'g'), 'x').split(/\s+/)
  if (!tokens.every((t) => /^[a-z][a-z0-9_-]*$/.test(t))) return false
  if (tokens.some((t) => STOP.has(t))) return false
  return tokens.some((t) => t.includes('-') || t.includes('_'))
}

function shapeOf(text: string): Shape {
  const probe = holeify(text).trim()
  const bare = probe.split(HOLE).join(' ').trim()
  if (letterCount(bare) < 2) return 'nowords'
  if (/^#[0-9a-fA-F]{3,8}$/.test(probe) || /^(?:rgb|hsl)a?\(/i.test(probe)) return 'hex'
  if (
    probe.includes('/') ||
    /^https?:/i.test(probe) ||
    /^[\w.\-¤]+\.(?:png|jpe?g|webp|svg|gif|json|ts|vue|md|css|js|mp3|ogg|wav|woff2?|html)$/i.test(probe)
  )
    return 'path'
  if (!/\s/.test(probe)) {
    if (/^[\w¤.\-]+(?::[\w¤.\-]+)+$/.test(probe)) return 'seed'
    const id = probe.replace(new RegExp(HOLE, 'g'), 'x')
    if (/^[a-z][a-z0-9]*(?:[-_.][a-z0-9]+)*$/.test(id)) return 'ident'
    if (/^[a-z]+(?:[A-Z][a-z0-9]*)+$/.test(id)) return 'ident'
    if (/^[A-Z][A-Z0-9]*(?:[_-][A-Z0-9]+)*$/.test(id)) return 'ident'
    return 'oneword'
  }
  if (CSS_HINT.test(probe) || cssClassList(probe)) return 'css'
  return 'text'
}

// ── the aggregates ───────────────────────────────────────────────────────────────────────────────
const certain: Item[] = []
const likely: Item[] = []
const excluded: Record<string, number> = {}
const seen = new Set<string>()
const otherAttr: Record<string, number> = {}
let vueErrors = 0
const outsideFiles: Record<string, number> = {}
const outsideStr: Record<string, number> = {}
const outsideWords: Record<string, number> = {}
const excludedWords: Record<string, number> = {}
const bump = (k: string, words = 0): void => {
  excluded[k] = (excluded[k] ?? 0) + 1
  if (words > 0) excludedWords[k] = (excludedWords[k] ?? 0) + words
}

function areaOf(file: string, scope: Scope, tpl: boolean, reason: string | null, top: string | null): Area {
  const base = file.slice(file.lastIndexOf('/') + 1)
  if (/\/album\//i.test(file) || /^album/i.test(base)) return 'album'
  if (/smallTalk/i.test(base) || (top !== null && /^SMALL_TALK/.test(top))) return 'smalltalk'
  if (file.startsWith('src/engine/world/lifeBeat/') || file === HUB) return 'lifebeat'
  if (/letter|inbox|mail/i.test(base)) return 'letters'
  if (file.startsWith('src/engine/diary')) return 'diary'
  if (reason === 'ledger-text') return 'ledger'
  if (scope === 'vue') return tpl ? 'screens' : 'scripts'
  if (scope === 'component' || scope === 'composable') return 'scripts'
  return 'engine'
}

const dirOf = (file: string): string => {
  const sub = file.split('/')[1] ?? '(root)'
  return sub.includes('.') ? '(root)' : sub
}
const isCopyLeaf = (file: string): boolean =>
  /^src\/engine\/world\/lifeBeat\/[A-Za-z]+Copy\.ts$/.test(file) ||
  file === 'src/engine/world/smallTalkCorpus.ts' ||
  file === 'src/engine/world/albumCorpus.ts'

// ── ECONOMY: the live walk, before any source is read, so its source literals dedupe ─────────────
const econ: { key: string; text: string }[] = []
function walkEconomy(v: unknown, seenObjs: Set<object>): void {
  if (Array.isArray(v)) {
    for (const x of v) walkEconomy(x, seenObjs)
    return
  }
  if (v !== null && typeof v === 'object') {
    if (seenObjs.has(v)) return
    seenObjs.add(v)
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      if (ECON_KEYS.has(k) && typeof x === 'string') econ.push({ key: k, text: x })
      else walkEconomy(x, seenObjs)
    }
  }
}
walkEconomy(ECONOMY, new Set())
const economySet = new Set(econ.map((e) => e.text))
for (const e of econ) {
  seen.add(normKey(e.text))
  if (letterCount(e.text) >= 2)
    certain.push({ file: 'src/engine/economy.ts', line: 0, text: e.text, area: 'economy', reason: `economy-${e.key}`, dev: false })
}

// ── the one classifier every literal passes through ──────────────────────────────────────────────
function literal(file: string, scope: Scope, line: number, text: string, ctx: Ctx, tpl: boolean, forced?: string): void {
  seen.add(normKey(text))
  const shape = shapeOf(text)
  const bare = bareOf(text)
  if (scope === 'outside') {
    // The rest of src/: read only to MEASURE what the brief's scope leaves out. Never added to a total.
    if (shape === 'text' && bare.length >= MIN_LIKELY) {
      const dir = dirOf(file)
      outsideStr[dir] = (outsideStr[dir] ?? 0) + 1
      outsideWords[dir] = (outsideWords[dir] ?? 0) + wordsOf(text)
    }
    return
  }
  if (ctx.prop !== null && ECON_KEYS.has(ctx.prop) && economySet.has(text)) {
    bump('economy source literal (counted once, by the live walk)')
    return
  }
  let reason: string | null = forced ?? null
  if (reason === null && (scope === 'engine' || scope === 'shared')) {
    if (isCopyLeaf(file)) reason = 'copy-leaf'
    else if (file === HUB && ctx.top !== null && /^[A-Z][A-Z0-9_]+$/.test(ctx.top)) reason = 'hub-pool'
    else if (ctx.textAnc) reason = 'ledger-text'
    else if (ctx.suffixConst) reason = 'suffix-const'
  }
  if (reason !== null) {
    if (shape === 'text' || shape === 'oneword') {
      certain.push({ file, line, text, area: areaOf(file, scope, tpl, reason, ctx.top), reason, dev: false })
    } else bump(shape)
    return
  }
  if (shape === 'text' && bare.length >= MIN_LIKELY) {
    const dev = ctx.inThrow || /^(?:new )?\w*Error$|^console\./.test(ctx.call ?? '')
    likely.push({ file, line, text, area: areaOf(file, scope, tpl, null, ctx.top), reason: 'likely', dev })
  } else if (shape === 'text') bump('short phrase (< 15, has a space) – recall risk', wordsOf(text))
  else if (shape === 'oneword' && /^[A-Z]/.test(bare)) bump('single capitalised word – recall risk', wordsOf(text))
  else bump(shape)
}

// ── TypeScript sources ───────────────────────────────────────────────────────────────────────────
const isStringish = (n: ts.Node): boolean => ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateExpression(n)
const templateText = (n: ts.TemplateExpression): string => n.head.text + n.templateSpans.map((s) => '${…}' + s.literal.text).join('')
function flattenPlus(n: ts.Expression): ts.Expression[] {
  if (ts.isParenthesizedExpression(n) && ts.isBinaryExpression(n.expression) && n.expression.operatorToken.kind === ts.SyntaxKind.PlusToken)
    return flattenPlus(n.expression)
  if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.PlusToken)
    return [...flattenPlus(n.left), ...flattenPlus(n.right)]
  return [n]
}
function propName(n: ts.PropertyName): string | null {
  return ts.isIdentifier(n) || ts.isStringLiteral(n) || ts.isNumericLiteral(n) ? n.text : null
}
function calleeText(e: ts.Expression): string {
  if (ts.isIdentifier(e)) return e.text
  if (ts.isPropertyAccessExpression(e)) return `${calleeText(e.expression)}.${e.name.text}`
  return ''
}

function scanTs(file: string, source: string, scope: Scope, lineBase: number): void {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const lineOf = (n: ts.Node): number => sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1 + lineBase
  const emit = (text: string, n: ts.Node, ctx: Ctx): void => literal(file, scope, lineOf(n), text, ctx, false)
  const engineish = scope === 'engine' || scope === 'shared'

  const visit = (node: ts.Node, ctx: Ctx): void => {
    if (ts.isTypeNode(node) || ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return
    if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) return
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      emit(node.text, node, ctx)
      return
    }
    if (ts.isTemplateExpression(node)) {
      emit(templateText(node), node, ctx)
      for (const sp of node.templateSpans) visit(sp.expression, ctx)
      return
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const ops = flattenPlus(node)
      if (ops.some(isStringish)) {
        let text = ''
        for (const o of ops) {
          if (ts.isStringLiteral(o) || ts.isNoSubstitutionTemplateLiteral(o)) text += o.text
          else if (ts.isTemplateExpression(o)) {
            text += templateText(o)
            for (const sp of o.templateSpans) visit(sp.expression, ctx)
          } else {
            text += '${…}'
            visit(o, ctx)
          }
        }
        emit(text, node, ctx)
        return
      }
    }
    if (ts.isPropertyAssignment(node)) {
      const name = propName(node.name)
      visit(node.initializer, { ...ctx, prop: name, textAnc: ctx.textAnc || name === 'text' })
      return
    }
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      const callee = (ts.isNewExpression(node) ? 'new ' : '') + calleeText(node.expression)
      visit(node.expression, ctx)
      for (const a of node.arguments ?? []) visit(a, { ...ctx, call: callee })
      return
    }
    if (ts.isThrowStatement(node)) {
      if (node.expression) visit(node.expression, { ...ctx, inThrow: true })
      return
    }
    ts.forEachChild(node, (c) => visit(c, ctx))
  }

  for (const st of sf.statements) {
    if (ts.isVariableStatement(st)) {
      const exported = st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false
      for (const d of st.declarationList.declarations) {
        const name = ts.isIdentifier(d.name) ? d.name.text : null
        const ctx: Ctx = { ...NO_CTX, top: name, suffixConst: engineish && exported && name !== null && SUFFIX.test(name) }
        if (d.initializer) visit(d.initializer, ctx)
      }
    } else if (ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st)) {
      visit(st, { ...NO_CTX, top: st.name?.text ?? null })
    } else visit(st, NO_CTX)
  }
}

// ── Vue single-file components ───────────────────────────────────────────────────────────────────
interface VProp {
  type: number
  name: string
  value?: { content: string }
  arg?: { content?: string }
  exp?: { content?: string }
  loc?: { start: { line: number } }
}
interface VNode {
  type: number
  content?: string | { content?: string }
  children?: VNode[]
  props?: VProp[]
  loc?: { start: { line: number } }
}
const EXPR_LIT = /'((?:\\.|[^'\\\n])*)'|"((?:\\.|[^"\\\n])*)"|`((?:\\.|[^`\\])*)`/g
function exprLiterals(expr: string): string[] {
  const out: string[] = []
  for (const m of expr.matchAll(EXPR_LIT)) out.push((m[1] ?? m[2] ?? m[3] ?? '').replace(/\\(['"`\\])/g, '$1'))
  return out
}

function pushVue(file: string, line: number, text: string, reason: string): void {
  seen.add(normKey(text))
  certain.push({ file, line, text, area: areaOf(file, 'vue', true, reason, null), reason, dev: false })
}

function walkTemplate(file: string, node: VNode): void {
  for (const p of node.props ?? []) {
    const line = p.loc?.start.line ?? node.loc?.start.line ?? 0
    if (p.type === 6) {
      const v = (p.value?.content ?? '').replace(/\s+/g, ' ').trim()
      if (VUE_ATTRS.has(p.name)) {
        if (letterCount(v) >= 2) pushVue(file, line, v, 'vue-attr')
      } else if (!SKIP_ATTR.test(p.name) && shapeOf(v) === 'text') otherAttr[p.name] = (otherAttr[p.name] ?? 0) + 1
    } else if (p.type === 7 && p.exp?.content) {
      const bound = p.name === 'bind' ? p.arg?.content : undefined
      const isCopyAttr = bound !== undefined && VUE_ATTRS.has(bound)
      for (const lit of exprLiterals(p.exp.content)) literal(file, 'vue', line, lit, NO_CTX, true, isCopyAttr ? 'vue-attr-bound' : undefined)
    }
  }
  let run: string[] = []
  let runLine = 0
  const flush = (): void => {
    const text = run.join('').replace(/\s+/g, ' ').trim()
    run = []
    if (letterCount(bareOf(text)) >= 2) pushVue(file, runLine, text, 'vue-text')
  }
  for (const c of node.children ?? []) {
    if (c.type === 2) {
      if (run.length === 0) runLine = c.loc?.start.line ?? 0
      run.push(typeof c.content === 'string' ? c.content : '')
    } else if (c.type === 5) {
      if (run.length === 0) runLine = c.loc?.start.line ?? 0
      run.push('${…}')
      const inner = typeof c.content === 'object' ? (c.content.content ?? '') : ''
      for (const lit of exprLiterals(inner)) literal(file, 'vue', c.loc?.start.line ?? 0, lit, NO_CTX, true)
    } else {
      flush()
      if (c.type === 1) walkTemplate(file, c)
    }
  }
  flush()
}

function scanVue(file: string, source: string): void {
  const { descriptor, errors } = parseSfc(source, { filename: file })
  if (errors.length > 0) vueErrors++
  const tpl = descriptor.template as unknown as { ast?: VNode } | null
  if (tpl?.ast) walkTemplate(file, tpl.ast)
  for (const block of [descriptor.script, descriptor.scriptSetup]) {
    if (block) scanTs(file, block.content, 'vue', block.loc.start.line - 1)
  }
}

// ── which files ──────────────────────────────────────────────────────────────────────────────────
function scopeOf(file: string): Scope | null {
  if (/\.(?:test|spec)\.ts$/.test(file) || file.endsWith('.d.ts')) return null
  if (file.endsWith('.vue')) return 'vue'
  if (!file.endsWith('.ts')) return null
  if (file.startsWith('src/engine/')) return 'engine'
  if (file.startsWith('src/shared/')) return 'shared'
  if (file.startsWith('src/components/')) return 'component'
  if (file.startsWith('src/composables/')) return 'composable'
  return 'outside'
}

const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
  .split('\n')
  .filter(Boolean)
  .sort()
const filesBySeg: Record<string, number> = {}
const srcOutside: Record<string, number> = {}
let scanned = 0
let scannedVue = 0
for (const file of tracked) {
  const seg = file.includes('/') ? file.slice(0, file.indexOf('/')) : '(root)'
  if (seg !== 'src') {
    filesBySeg[seg] = (filesBySeg[seg] ?? 0) + 1
    continue
  }
  const scope = scopeOf(file)
  if (scope === null) {
    const key = /\.(?:test|spec)\.ts$/.test(file) ? 'test-only' : /\.d\.ts$/.test(file) ? 'declarations' : 'non-ts assets'
    srcOutside[key] = (srcOutside[key] ?? 0) + 1
    continue
  }
  const source = readFileSync(file, 'utf8')
  if (scope === 'outside') {
    outsideFiles[dirOf(file)] = (outsideFiles[dirOf(file)] ?? 0) + 1
    scanTs(file, source, scope, 0)
    continue
  }
  scanned++
  if (scope === 'vue') {
    scannedVue++
    scanVue(file, source)
  } else scanTs(file, source, scope, 0)
}

// ── tallies ──────────────────────────────────────────────────────────────────────────────────────
interface Tally {
  n: number
  words: number
  interp: number
  unique: number
}
function tally(items: readonly Item[]): Tally {
  const u = new Set<string>()
  let words = 0
  let interp = 0
  for (const it of items) {
    words += wordsOf(it.text)
    if (hasHole(it.text)) interp++
    u.add(it.text)
  }
  return { n: items.length, words, interp, unique: u.size }
}
const num = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
const lp = (v: string | number, w: number): string => String(v).padStart(w)
const rp = (v: string, w: number): string => v.padEnd(w)
const pct = (a: number, b: number): string => (b === 0 ? '0.0%' : `${((a / b) * 100).toFixed(1)}%`)
const clip = (s: string, n: number): string => {
  const one = s.replace(/\s+/g, ' ')
  return one.length > n ? `${one.slice(0, n - 1)}…` : one
}

const out: string[] = []
const P = (s = ''): void => {
  out.push(s)
}

const both = [...certain, ...likely]
const tC = tally(certain)
const tL = tally(likely)
const tAll = tally(both)

P('copy-census – the player-facing copy corpus of the tracked tree (deterministic, no draws, no clock)')
P(`  scanned ${num(scanned)} source files (${num(scannedVue)} .vue) plus the live ECONOMY and small-talk objects`)
P()
P('1. HEADLINE')
P(`   ${rp('', 28)}${lp('strings', 10)}${lp('unique', 10)}${lp('words', 11)}`)
P(`   ${rp('CERTAIN player-facing', 28)}${lp(num(tC.n), 10)}${lp(num(tC.unique), 10)}${lp(num(tC.words), 11)}`)
P(`   ${rp('LIKELY (sampled, below)', 28)}${lp(num(tL.n), 10)}${lp(num(tL.unique), 10)}${lp(num(tL.words), 11)}`)
P(`   ${rp('GRAND TOTAL', 28)}${lp(num(tAll.n), 10)}${lp(num(tAll.unique), 10)}${lp(num(tAll.words), 11)}`)
P('   words = whitespace tokens after every ${…} is stripped; unique = distinct texts (what a translator bills once)')
const outStrings = Object.values(outsideStr).reduce((a, b) => a + b, 0)
const outWords = Object.values(outsideWords).reduce((a, b) => a + b, 0)
const outLead = Object.keys(outsideStr)
  .sort((a, b) => (outsideWords[b] ?? 0) - (outsideWords[a] ?? 0) || (a < b ? -1 : 1))
  .slice(0, 2)
  .map((d) => `src/${d} ${num(outsideStr[d] ?? 0)} strings / ${num(outsideWords[d] ?? 0)} words`)
  .join(', ')
P(`   NOT in these totals (outside the brief's scope, measured under EXCLUDED): ${num(outStrings)} strings / ${num(outWords)} words – ${outLead}`)
P()
P('2. PER AREA (by home path first, then context)')
P(`   ${rp('area', 32)}${lp('CERT str', 10)}${lp('CERT words', 12)}${lp('LIKELY str', 12)}${lp('LIKELY words', 14)}${lp('CERT w/ ${…}', 14)}`)
for (const [area, label] of AREAS) {
  const c = tally(certain.filter((i) => i.area === area))
  const l = tally(likely.filter((i) => i.area === area))
  P(`   ${rp(label, 32)}${lp(num(c.n), 10)}${lp(num(c.words), 12)}${lp(num(l.n), 12)}${lp(num(l.words), 14)}${lp(num(c.interp), 14)}`)
}
P(`   ${rp('TOTAL', 32)}${lp(num(tC.n), 10)}${lp(num(tC.words), 12)}${lp(num(tL.n), 12)}${lp(num(tL.words), 14)}${lp(num(tC.interp), 14)}`)
P()
const reasons = [...new Set(certain.map((i) => i.reason))].sort()
P('   CERTAIN by rule:')
for (const r of reasons) {
  const t = tally(certain.filter((i) => i.reason === r))
  P(`     ${rp(r, 22)}${lp(num(t.n), 9)} strings${lp(num(t.words), 11)} words`)
}
const econKeys = ['label', 'blurb', 'name'].map((k) => `${k} ${econ.filter((e) => e.key === k).length}`).join(', ')
P(`   ECONOMY walk found ${econ.length} label/blurb/name strings (${econKeys}); ${num(excluded['economy source literal (counted once, by the live walk)'] ?? 0)} source literals deduped against it`)
const byFile = new Map<string, { n: number; words: number }>()
for (const it of certain) {
  const cur = byFile.get(it.file) ?? { n: 0, words: 0 }
  cur.n++
  cur.words += wordsOf(it.text)
  byFile.set(it.file, cur)
}
const top = [...byFile.entries()].sort((a, b) => b[1].words - a[1].words || (a[0] < b[0] ? -1 : 1)).slice(0, 12)
P('   largest CERTAIN homes by words:')
for (const [f, t] of top) P(`     ${lp(num(t.words), 8)} words ${lp(num(t.n), 7)} strings  ${f}`)
P()
P('3. INTERPOLATION LOAD (CERTAIN strings carrying at least one ${…} – the plural / case work RU will need)')
P(`   ${num(tC.interp)} of ${num(tC.n)} CERTAIN strings (${pct(tC.interp, tC.n)}) carry >= 1 \${…}`)
P(`   ${rp('', 22)}${lp('with ${…}', 10)}${lp('of', 9)}${lp('share', 8)}`)
for (const r of reasons) {
  const t = tally(certain.filter((i) => i.reason === r))
  P(`   ${rp(r, 22)}${lp(num(t.interp), 10)}${lp(num(t.n), 9)}${lp(pct(t.interp, t.n), 8)}`)
}
const OTHER_PH = /\{[A-Za-z_][\w.]*\}|%[sd]|\{\{/
const otherPh = certain.filter((i) => OTHER_PH.test(bareOf(i.text)))
P(`   caveat: ${num(otherPh.length)} more CERTAIN strings carry a different placeholder syntax ({name}, %s, {{ }}) that the \${…} count cannot see`)
P()

// 4. the round-44 check ---------------------------------------------------------------------------
let situations = 0
let openers = 0
let replies = 0
let stanceLabels = 0
const labelSets = new Map<string, Set<string>>()
let sharedBeats = 0
let underFour = 0
const ids = new Set<string>()
for (const s of SMALL_TALK_SITUATIONS) {
  situations++
  ids.add(s.id)
  const voices = Object.values(s.voices).filter((v): v is NonNullable<typeof v> => v !== undefined)
  if (voices.length < 4) underFour++
  for (const v of voices) {
    if (v.opener) openers++
    if (v.shared) sharedBeats++
    for (const [stance, b] of Object.entries(v.branches)) {
      if (b.label) stanceLabels++
      if (b.said) replies++
      const k = `${s.id}|${stance}`
      let set = labelSets.get(k)
      if (!set) {
        set = new Set<string>()
        labelSets.set(k, set)
      }
      set.add(b.label)
    }
  }
}
const frames = Object.entries(SMALL_TALK_FRAMES).map(([k, v]) => `${k} ${v.length}`)
const corpusHead = readFileSync('src/engine/world/smallTalkCorpus.ts', 'utf8').slice(0, 1500)
const hm = corpusHead.match(/(\d+) situations × (\d+) voices: (\d+) openers, (\d+) stance labels, (\d+) replies, (\d+) shared/)
const hdr = { s: Number(hm?.[1] ?? NaN), o: Number(hm?.[3] ?? NaN), l: Number(hm?.[4] ?? NaN), r: Number(hm?.[5] ?? NaN) }
let distinctLabels = 0
for (const set of labelSets.values()) distinctLabels += set.size
const DOC = { s: 43, o: 172, r: 516 }
const CLAIM = { s: 51, o: 51 * 4, r: 51 * 4 * 3 }
const verdict = (live: number, claim: number): string => (live === claim ? 'MATCH' : live < claim ? `SHORT by ${claim - live}` : `OVER by ${live - claim}`)
P('4. ROUND-44 CHECK (alpha-readiness §A3) – the LIVE small-talk pool, counted from SMALL_TALK_SITUATIONS')
P(`   ${rp('figure', 12)}${lp('documented', 12)}${lp('wave claim', 12)}${lp('corpus header', 15)}${lp('LIVE', 8)}   vs claim / vs documented`)
const row = (name: string, d: number | null, c: number, h: number, live: number): void =>
  P(
    `   ${rp(name, 12)}${lp(d ?? 'n/a', 12)}${lp(c, 12)}${lp(Number.isNaN(h) ? 'n/a' : h, 15)}${lp(live, 8)}   ${verdict(live, c)}${d === null ? '' : ` / ${live - d >= 0 ? '+' : ''}${live - d}`}`,
  )
row('situations', DOC.s, CLAIM.s, hdr.s, situations)
row('openers', DOC.o, CLAIM.o, hdr.o, openers)
row('replies', DOC.r, CLAIM.r, hdr.r, replies)
row('labels', null, 51 * 3, hdr.l, distinctLabels)
P(`   wave claim = §A3's 51 situations x 4 voices x 3 stances (the corpus header's own structure); documented = the 43/172/516 document`)
P(`   labels = distinct stance labels per situation x stance (the header's «153»); ${num(stanceLabels)} label strings across the four voice columns`)
P(`   also live: ${sharedBeats} shared second beats, ${ids.size} distinct situation ids (${situations - ids.size} duplicate), ${underFour} situations with fewer than 4 voices`)
P(`   also live: ${frames.join(', ')} scene frames (SMALL_TALK_FRAMES, one pool that wraps every situation)`)
const allMatch = situations === CLAIM.s && openers === CLAIM.o && replies === CLAIM.r && underFour === 0 && ids.size === situations && (Number.isNaN(hdr.l) || distinctLabels === hdr.l)
P(
  allMatch
    ? `   ROUND-44 VERDICT: MATCH – live ${situations} / ${openers} / ${replies} equals the wave claim; the 43 / 172 / 516 document is stale by +${situations - DOC.s} / +${openers - DOC.o} / +${replies - DOC.r}.`
    : `   ROUND-44 VERDICT: FINDING – live ${situations} / ${openers} / ${replies} against the claim ${CLAIM.s} / ${CLAIM.o} / ${CLAIM.r} (${underFour} situations under four voices, ${situations - ids.size} duplicate ids).`,
)
P()

// EXCLUDED ----------------------------------------------------------------------------------------
P('EXCLUDED (counted, not read)')
const order = [
  'ident',
  'seed',
  'path',
  'hex',
  'css',
  'nowords',
  'short phrase (< 15, has a space) – recall risk',
  'single capitalised word – recall risk',
  'oneword',
  'economy source literal (counted once, by the live walk)',
]
for (const k of order) {
  const label = k === 'ident' ? 'identifier / id / key shapes' : k === 'nowords' ? 'fewer than 2 letters or digits' : k === 'oneword' ? 'other single tokens' : k
  const w = excludedWords[k]
  P(`   ${rp(label, 58)}${lp(num(excluded[k] ?? 0), 9)}${w === undefined ? '' : `${lp(num(w), 9)} words`}`)
}
const attrTop = Object.entries(otherAttr)
  .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
  .slice(0, 8)
const attrTotal = Object.values(otherAttr).reduce((a, b) => a + b, 0)
P(`   ${rp('.vue static attributes outside the four, text-shaped – recall risk', 58)}${lp(num(attrTotal), 9)}   top: ${attrTop.map(([k, n]) => `${k} ${n}`).join(', ') || 'none'}`)
const fileBits = Object.entries(filesBySeg)
  .sort((a, b) => (a[0] < b[0] ? -1 : 1))
  .map(([k, n]) => `${k} ${num(n)}`)
  .join(', ')
const srcBits = Object.entries(srcOutside)
  .sort((a, b) => (a[0] < b[0] ? -1 : 1))
  .map(([k, n]) => `${k} ${n}`)
  .join(', ')
P(`   files not read: ${fileBits}`)
P(`   src files that are not source (not read): ${srcBits || 'none'}`)
const outDirs = Object.keys(outsideFiles).sort()
P(`   src OUTSIDE the brief's scope (read only to measure it; text-shaped >= 15-char literals, NOT in any total above):`)
for (const d of outDirs) P(`     ${rp(d, 12)}${lp(outsideFiles[d] ?? 0, 4)} files${lp(num(outsideStr[d] ?? 0), 8)} strings${lp(num(outsideWords[d] ?? 0), 9)} words`)
P(`   .vue files that raised a parse error: ${vueErrors}`)
const devN = likely.filter((i) => i.dev).length
P(`   LIKELY purity hint: ${num(devN)} of ${num(likely.length)} LIKELY strings (${pct(devN, likely.length)}) sit inside throw / new Error / console.*`)
P()

// STRINGS-TABLE CROSS-CHECK -----------------------------------------------------------------------
const tableFiles = tracked.filter((f) => /^docs\/plans\/.*strings.*\.md$/.test(f))
const registered = new Map<string, string>()
let tables = 0
let rows = 0
let struck = 0
let superseded = 0
for (const f of tableFiles) {
  const lines = readFileSync(f, 'utf8').split('\n')
  for (let i = 0; i + 1 < lines.length; i++) {
    const head = lines[i] ?? ''
    const sep = lines[i + 1] ?? ''
    if (!head.startsWith('|') || !/^\|?\s*:?-{2,}/.test(sep)) continue
    const cells = (l: string): string[] => l.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim())
    const col = cells(head).findIndex((h) => /^(?:text|the string, verbatim|the string|string|the draft|draft)$/i.test(h.replace(/`/g, '').trim()))
    if (col < 0) continue
    tables++
    for (let j = i + 2; j < lines.length && (lines[j] ?? '').startsWith('|'); j++) {
      if (/SUPERSEDED/.test(lines[j] ?? '')) {
        superseded++ // the row's own status cell says a later wave replaced this wording
        continue
      }
      let cell = cells(lines[j] ?? '')[col] ?? ''
      if (cell.length > 2 && cell.startsWith('`') && cell.endsWith('`')) cell = cell.slice(1, -1)
      cell = cell.replace(/\\\|/g, '|').replace(/\s+/g, ' ').trim()
      if (cell.startsWith('~~')) {
        // a row the table itself marks superseded: `~~old~~` is dead, `~~old~~ → **new**` carries its successor
        const next = cell.match(/^~~.*?~~\s*→\s*(.+)$/)
        if (!next) {
          struck++
          continue
        }
        cell = (next[1] ?? '').replace(/^\*\*|\*\*$/g, '').trim()
      }
      if (letterCount(cell) < 2) continue
      rows++
      const key = normKey(cell)
      if (!registered.has(key)) registered.set(key, `${f.slice('docs/plans/'.length)}`)
    }
    i = i + 1
  }
}
const certainKeys = new Set(certain.map((i) => normKey(i.text)))
const likelyKeys = new Set(likely.map((i) => normKey(i.text)))
let inCertain = 0
let inLikely = 0
let inOther = 0
const missing: string[] = []
const missDocs: Record<string, number> = {}
for (const [key, doc] of registered) {
  if (certainKeys.has(key)) inCertain++
  else if (likelyKeys.has(key)) inLikely++
  else if (seen.has(key)) inOther++
  else {
    missing.push(`${doc}: ${clip(key.split(HOLE).join('${…}'), 70)}`)
    missDocs[doc] = (missDocs[doc] ?? 0) + 1
  }
}
P(`STRINGS-TABLE CROSS-CHECK (recall) – ${tableFiles.length} docs/plans/*strings*.md files, ${tables} tables, ${num(rows)} rows, ${num(registered.size)} distinct registered strings`)
P(`   found in CERTAIN ${num(inCertain)} (${pct(inCertain, registered.size)}) · only in LIKELY ${num(inLikely)} · seen but classified EXCLUDED ${num(inOther)} · not found in any scanned literal ${num(missing.length)} (${pct(missing.length, registered.size)})`)
const missBits = Object.entries(missDocs)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([d, n]) => `${d.replace(/-strings-2026-09\.md$/, '')} ${n}`)
  .join(', ')
P(`   misses by doc: ${missBits || 'none'} · skipped as superseded: ${superseded} rows flagged SUPERSEDED, ${struck} struck-through`)
for (const m of missing.slice(0, process.argv.includes('--misses') ? missing.length : 6)) P(`     miss  ${m}`)
P()

// LIKELY sample -----------------------------------------------------------------------------------
const sample = likely
  .map((i) => ({ i, h: createHash('sha1').update(`census-sample:${i.file}:${i.line}:${i.text}`).digest('hex') }))
  .sort((a, b) => (a.h < b.h ? -1 : 1))
  .slice(0, SAMPLE)
P(`LIKELY SAMPLE – ${SAMPLE} of ${num(likely.length)}, picked by sha1 order (deterministic, not chance)`)
sample.forEach(({ i }, k) => P(`   ${lp(k + 1, 2)}. ${i.file}:${i.line}${i.dev ? ' [dev-ctx]' : ''}  «${clip(i.text, 100)}»`))
P()

// --dump ------------------------------------------------------------------------------------------
const dumpAt = process.argv.indexOf('--dump')
if (dumpAt >= 0) {
  const needle = process.argv[dumpAt + 1] ?? ''
  const needles = needle.split(',').filter(Boolean)
  P(`DUMP of everything CERTAIN or LIKELY whose file contains «${needle}»`)
  for (const it of [...certain, ...likely]) {
    if (needles.some((n) => it.file.includes(n))) P(`   ${rp(it.reason, 15)}${rp(it.area, 10)}${it.file}:${it.line}  «${clip(it.text, 110)}»`)
  }
  P()
}

// DETERMINISM -------------------------------------------------------------------------------------
const body = out.join('\n')
P('5. DETERMINISM')
P('   sorted inputs (git ls-files), sha1-ordered sample, no clock, no draws, no absolute paths – the same tree prints the same bytes')
P(`   body sha1 ${createHash('sha1').update(body).digest('hex').slice(0, 12)} (over every line above this one)`)
P('CENSUS_DONE')
console.log(out.join('\n'))
