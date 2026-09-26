// Lane E (26.09 review) – the accessibility sweep over every `src/**/*.vue` template.
//
// Run from the repository root (it needs `@vue/compiler-sfc` from node_modules and `git`):
//   node docs/review-principles-2026-09-26/probes/ui-a11y-sweep.mjs <out.json>
//
// Three reports, all from the SFC template AST (file-absolute line numbers):
//   1. BOTH – an element that carries an aria-label (static or bound) AND a title (static or bound),
//      including a component (IconButton's `label` becomes the button's aria-label and a `title`
//      attribute falls through to the same button).
//   2. NAMELESS – an interactive element (button, a, role=button, or anything with @click) whose
//      subtree renders no text node, no interpolation and no labelled child, and which carries no
//      aria-label / aria-labelledby / title / alt; IconButton without `label` and without slot text.
//   3. DIALOGS – every element with role=dialog|alertdialog, or a class naming a dialog/overlay/sheet,
//      plus the file-level facts: does the script call useDialogFocus, and which tests call
//      assertDismissReachable while naming the component.
// Nothing here edits a file.
import { parse } from '@vue/compiler-sfc'
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const out = process.argv[2]
const files = execSync("git ls-files 'src/*.vue'", { encoding: 'utf8' }).trim().split('\n')

const ELEMENT = 1, TEXT = 2, INTERP = 5, ATTR = 6, DIR = 7
function attrs(node) {
  const m = {}
  for (const p of node.props) {
    if (p.type === ATTR) m[p.name] = { bound: false, v: p.value ? p.value.content : '' }
    else if (p.type === DIR && p.name === 'bind' && p.arg && p.arg.content) m[p.arg.content] = { bound: true, v: p.exp ? p.exp.content : '' }
    else if (p.type === DIR && p.name === 'on' && p.arg) m['@' + p.arg.content] = { bound: true, v: p.exp ? p.exp.content : '' }
    else if (p.type === DIR && (p.name === 'text' || p.name === 'html')) m['v-' + p.name] = { bound: true, v: p.exp ? p.exp.content : '' }
  }
  return m
}
function rendersText(node) {
  // true when the subtree renders any visible text or a labelled/alt-carrying child
  for (const c of node.children || []) {
    if (c.type === TEXT && c.content.trim()) return true
    if (c.type === INTERP) return true
    if (c.type === ELEMENT) {
      const a = attrs(c)
      if (a['v-text'] || a['v-html']) return true
      if (a['aria-hidden'] && (a['aria-hidden'].v === 'true' || a['aria-hidden'].v === '')) continue
      if (c.tag === 'img' && a.alt && (a.alt.bound || a.alt.v.trim())) return true
      if (a['aria-label'] || a['aria-labelledby']) return true
      if (c.tag === 'slot') return true // cannot know – treat as text
      if (/^[A-Z]/.test(c.tag) && !['AppIcon', 'SurfaceMark'].includes(c.tag)) return true // a component may render text
      if (rendersText(c)) return true
    }
    if (c.type === 9 /* IF */ || c.type === 11 /* FOR */) {
      for (const b of c.branches || [c]) if (rendersText(b)) return true
    }
  }
  return false
}
const both = [], nameless = [], dialogs = []
const fileFacts = {}
for (const f of files) {
  const src = readFileSync(f, 'utf8')
  const { descriptor } = parse(src, { filename: f })
  if (!descriptor.template || !descriptor.template.ast) continue
  const script = (descriptor.scriptSetup?.content || '') + (descriptor.script?.content || '')
  fileFacts[f] = { useDialogFocus: /\buseDialogFocus\s*\(/.test(script) }
  const walk = (node) => {
    if (node.type === ELEMENT) {
      const a = attrs(node)
      const line = node.loc.start.line
      const hasAria = a['aria-label'] || (node.tag === 'IconButton' && a.label)
      const hasTitle = a.title
      if (hasAria && hasTitle) {
        both.push({ file: f, line, tag: node.tag,
          ariaLabel: (a['aria-label'] || a.label).bound ? ':' + (a['aria-label'] || a.label).v : (a['aria-label'] || a.label).v,
          title: a.title.bound ? ':' + a.title.v : a.title.v,
          sameExpr: ((a['aria-label'] || a.label).v.trim() === a.title.v.trim()) })
      }
      const interactive = node.tag === 'button' || node.tag === 'a' || (a.role && a.role.v === 'button') || a['@click'] || node.tag === 'IconButton'
      if (interactive) {
        const named = a['aria-label'] || a['aria-labelledby'] || a.title || (node.tag === 'IconButton' && a.label)
        if (!named && !rendersText(node) && !a['v-text'] && !a['v-html']) {
          nameless.push({ file: f, line, tag: node.tag, attrs: Object.keys(a).join(' ') })
        }
      }
      const cls = a.class ? a.class.v : ''
      const role = a.role ? a.role.v : ''
      if (/^(dialog|alertdialog)$/.test(role) || /(^|\s)(dialog-overlay|dialog-card|[a-z-]*-overlay|[a-z-]*sheet)(\s|$)/.test(cls)) {
        dialogs.push({ file: f, line, tag: node.tag, role, ariaModal: a['aria-modal'] ? a['aria-modal'].v : '',
          name: a['aria-label'] ? 'aria-label' : a['aria-labelledby'] ? 'aria-labelledby' : '', cls })
      }
    }
    for (const c of node.children || []) walk(c)
    if (node.branches) for (const b of node.branches) walk(b)
  }
  walk(descriptor.template.ast)
}
// which tests assert a reachable dismiss, per component basename
const dismissTests = execSync('git grep -l "assertDismissReachable" -- tests', { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
const byComponent = {}
for (const t of dismissTests) {
  const body = readFileSync(t, 'utf8')
  for (const f of Object.keys(fileFacts)) {
    const base = f.split('/').pop()
    if (body.includes(base)) (byComponent[f] ||= []).push(t)
  }
}
for (const d of dialogs) { d.useDialogFocus = fileFacts[d.file].useDialogFocus; d.dismissTests = (byComponent[d.file] || []).length }
writeFileSync(out, JSON.stringify({ files: files.length, both, nameless, dialogs, dismissTestFiles: dismissTests.length, byComponent }, null, 1))
console.log(`files ${files.length} · both ${both.length} · nameless ${nameless.length} · dialog elements ${dialogs.length} · dismiss-test files ${dismissTests.length}`)
