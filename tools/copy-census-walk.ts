// THE COPY WALKER – the census's reader of the tracked tree, extracted so the i18n extractor can use it (L1b).
//
// ⚠ IMPORTING THIS MODULE RUNS THE SCAN. It is the census's own top level, moved here whole: it lists the
// tracked files, parses every one with the real parsers and fills the arrays exported at the bottom.
// `tools/copy-census.ts` prints the report over them; `tools/i18n-extract.ts` turns them into the catalog.
// One walker, two readers: a second scanner would disagree with the census about what a string is.
//
// ⚠ THE CLASSIFICATION BELOW IS THE CENSUS'S AND IT DID NOT MOVE. The extraction added three things beside it,
// none of which touches CERTAIN or LIKELY: `Item.holes` (the source text of each hole), `callKeys` (the
// `t('…')` / `cp\`…\`` call sites, keys by construction) and `callStats.dynamic` (the calls whose key cannot
// be read). The census's output is byte-identical before and after, which is how that was checked.
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
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { parse as parseSfc } from 'vue/compiler-sfc'
import { ECONOMY } from '../src/engine/economy'
import { HOLE, bareOf, hasHole, holeify, letterCount, normKey, wordsOf } from './copy-text'

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
  /** The source text of each `${…}` / `{{ … }}` in `text`, in order – the semantic hint the i18n catalog keeps (L1b). */
  holes?: readonly string[]
}
interface Ctx {
  top: string | null
  prop: string | null
  textAnc: boolean
  suffixConst: boolean
  call: string | null
  inThrow: boolean
}

const HUB = 'src/engine/world/lifeBeat.ts'
const MIN_LIKELY = 15
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
/** Where the code ASKS for copy: `t('…')` and `` cp`…` `` (L1b). A call site is a key by construction, whatever its length or shape. */
interface CallKey {
  area: Area
  file: string
  line: number
  key: string
  holes: readonly string[]
  via: 't' | 'cp'
}
const callKeys: CallKey[] = []
/** `t(variable)` and `t(`…${x}…`)`: keys the extractor cannot read – counted, never hidden. */
const callStats = { dynamic: 0 }
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
function literal(file: string, scope: Scope, line: number, text: string, ctx: Ctx, tpl: boolean, forced?: string, holes?: readonly string[]): void {
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
      certain.push({ file, line, text, area: areaOf(file, scope, tpl, reason, ctx.top), reason, dev: false, holes })
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
  const emit = (text: string, n: ts.Node, ctx: Ctx, holes?: readonly string[]): void => literal(file, scope, lineOf(n), text, ctx, false, undefined, holes)
  const holesOfTemplate = (n: ts.TemplateExpression): string[] => n.templateSpans.map((s) => s.expression.getText(sf))
  const engineish = scope === 'engine' || scope === 'shared'

  const visit = (node: ts.Node, ctx: Ctx): void => {
    if (ts.isTypeNode(node) || ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return
    if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) return
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      emit(node.text, node, ctx)
      return
    }
    if (ts.isTemplateExpression(node)) {
      emit(templateText(node), node, ctx, holesOfTemplate(node))
      for (const sp of node.templateSpans) visit(sp.expression, ctx)
      return
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const ops = flattenPlus(node)
      if (ops.some(isStringish)) {
        let text = ''
        const holes: string[] = []
        for (const o of ops) {
          if (ts.isStringLiteral(o) || ts.isNoSubstitutionTemplateLiteral(o)) text += o.text
          else if (ts.isTemplateExpression(o)) {
            text += templateText(o)
            holes.push(...holesOfTemplate(o))
            for (const sp of o.templateSpans) visit(sp.expression, ctx)
          } else {
            text += '${…}'
            holes.push(o.getText(sf))
            visit(o, ctx)
          }
        }
        emit(text, node, ctx, holes)
        return
      }
    }
    if (ts.isPropertyAssignment(node)) {
      const name = propName(node.name)
      visit(node.initializer, { ...ctx, prop: name, textAnc: ctx.textAnc || name === 'text' })
      return
    }
    if (ts.isTaggedTemplateExpression(node) && ts.isIdentifier(node.tag) && node.tag.text === 'cp') {
      // The engine's call shape: the key is exactly what `cp` builds ({0}, {1}… by position). No `return` –
      // the census still reads the template as the literal it always did.
      const tpl = node.template
      if (ts.isNoSubstitutionTemplateLiteral(tpl)) callKeys.push({ area: areaOf(file, scope, false, 'i18n-call', ctx.top), file, line: lineOf(node), key: tpl.text, holes: [], via: 'cp' })
      else callKeys.push({ area: areaOf(file, scope, false, 'i18n-call', ctx.top), file, line: lineOf(node), key: tpl.head.text + tpl.templateSpans.map((s, i) => `{${i}}${s.literal.text}`).join(''), holes: holesOfTemplate(tpl), via: 'cp' })
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 't') {
      const first = node.arguments[0]
      if (first && (ts.isStringLiteral(first) || ts.isNoSubstitutionTemplateLiteral(first))) callKeys.push({ area: areaOf(file, scope, false, 'i18n-call', ctx.top), file, line: lineOf(node), key: first.text, holes: [], via: 't' })
      else if (first && !ts.isNumericLiteral(first)) callStats.dynamic++
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

function pushVue(file: string, line: number, text: string, reason: string, holes?: readonly string[]): void {
  seen.add(normKey(text))
  certain.push({ file, line, text, area: areaOf(file, 'vue', true, reason, null), reason, dev: false, holes })
}

// `t('…')` inside a template expression. The census reads expressions with a regex (EXPR_LIT above), so the
// call detection is the same kind of reader: a literal first argument is a key, anything else is counted.
const EXPR_T = /(?<![\w$.])t\(\s*(?:'((?:\\.|[^'\\\n])*)'|"((?:\\.|[^"\\\n])*)"|`((?:\\.|[^`\\])*)`)/g
const EXPR_T_ANY = /(?<![\w$.])t\(\s*(?!\d)/g
function recordExprCalls(file: string, line: number, expr: string): void {
  let literalCalls = 0
  for (const m of expr.matchAll(EXPR_T)) {
    const key = (m[1] ?? m[2] ?? m[3] ?? '').replace(/\\(['"`\\])/g, '$1')
    if (key.includes('${')) continue // a template with a hole is a dynamic key, counted below
    callKeys.push({ area: areaOf(file, 'vue', true, 'i18n-call', null), file, line, key, holes: [], via: 't' })
    literalCalls++
  }
  callStats.dynamic += [...expr.matchAll(EXPR_T_ANY)].length - literalCalls
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
      recordExprCalls(file, line, p.exp.content)
    }
  }
  let run: string[] = []
  let runHoles: string[] = []
  let runLine = 0
  const flush = (): void => {
    const text = run.join('').replace(/\s+/g, ' ').trim()
    const holes = runHoles
    run = []
    runHoles = []
    if (letterCount(bareOf(text)) >= 2) pushVue(file, runLine, text, 'vue-text', holes)
  }
  for (const c of node.children ?? []) {
    if (c.type === 2) {
      if (run.length === 0) runLine = c.loc?.start.line ?? 0
      run.push(typeof c.content === 'string' ? c.content : '')
    } else if (c.type === 5) {
      if (run.length === 0) runLine = c.loc?.start.line ?? 0
      run.push('${…}')
      const inner = typeof c.content === 'object' ? (c.content.content ?? '') : ''
      runHoles.push(inner.replace(/\s+/g, ' ').trim())
      for (const lit of exprLiterals(inner)) literal(file, 'vue', c.loc?.start.line ?? 0, lit, NO_CTX, true)
      recordExprCalls(file, c.loc?.start.line ?? 0, inner)
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

// ── what the readers get ────────────────────────────────────────────────────────────────────────────
export {
  AREAS,
  HOLE,
  bareOf,
  callKeys,
  callStats,
  certain,
  econ,
  excluded,
  excludedWords,
  filesBySeg,
  hasHole,
  holeify,
  letterCount,
  likely,
  normKey,
  otherAttr,
  outsideFiles,
  outsideStr,
  outsideWords,
  scanned,
  scannedVue,
  scanTs,
  scanVue,
  seen,
  srcOutside,
  tracked,
  vueErrors,
  wordsOf,
}
export type { Area, CallKey, Item }
