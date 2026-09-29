// THE POINTER CHECK – T7.1 of the principles fix, W7. «A pointer no gate reads is prose.»
//
// WHAT IT GUARDS. W7 moves the long comment chronicles out of source files into
// `docs/notes/<area>/<file>.md` and leaves ONE pointer at the site, shaped
//     → docs/notes/<area>/<file>.md#<anchor>
// A pointer is worth leaving only while it still leads somewhere. Reword a heading, move a file or
// delete a note and the comment in the code is stranded on a dead link, silently: the source pins assert
// what a string IS, so they move with it and stay green. This is the one reader of every pointer.
// `npm run check` runs it straight after `context:audit` and it goes red on the first pointer that does
// not resolve.
//
// SCOPE. Every `.ts` and `.vue` file under `src/`. A line is a candidate wherever it carries the literal
// `docs/notes/` – in a comment, a string or a template alike. The scan does not try to tell those apart:
// the strict reading is also the simple one, and no line of `src` has a business naming that folder
// without pointing into it.
//
// THE POINTER GRAMMAR. From each occurrence of `docs/notes/` the text must parse as
//     docs/notes/<path>.md#<anchor>
//   <path>    `/`-separated segments of [A-Za-z0-9._-], none of them `.` or `..`, the last ending `.md`
//   <anchor>  letters, digits and hyphens (Unicode letters and digits count), and not run straight on
//             into another letter, digit, `_` or `#`
// An occurrence that does not parse is itself an ERROR – `malformed pointer` – never prose. A bare
// `docs/notes/`, a path with no `#anchor`, an empty anchor, a `..` climb and an anchor with an underscore
// in it are all refused, because a mention the gate skipped is exactly the hole it exists to close.
// Sentence punctuation right after the anchor (`.`, `,`, `)`, a quote) is fine: no slug contains it.
//
// RESOLUTION. `<path>` must be a file under the root's `docs/notes/`, and `<anchor>` must EQUAL the slug of
// one of its headings, so an anchor is lowercase by construction. The reasons in the failure listing are
// `malformed pointer`, `file not found` and `anchor not found`.
//
// THE SLUG RULE – T7.2..T7.6 write their anchors against exactly this. A heading's anchor is its text
//   1. LOWERCASED;
//   2. with everything but letters, digits, spaces and hyphens STRIPPED – punctuation, backticks, dashes
//      of every length, emoji, underscores (letters and digits are Unicode: Cyrillic stays);
//   3. with every space turned into a hyphen;
//   4. with runs of hyphens COLLAPSED into one.
//     `## The 30% rule – why (and when) it bites`   ->  #the-30-rule-why-and-when-it-bites
//     `## Round 29: «So far»`                       ->  #round-29-so-far
// Nothing is trimmed: a heading that OPENS with a stripped symbol (`## ⚠ Flat`) keeps the hyphen its space
// became (`#-flat`), so open a heading with a letter. Only ATX headings (`#` to `######`) count, and only
// outside YAML front matter and fenced code – a `# comment` in a shell snippet is not a heading. Repeated
// headings are NOT numbered the way GitHub numbers them: keep headings unique within a notes file, since
// a pointer at a repeated slug could not say which one it means.
//
// USAGE. `node scripts/notes-pointers.mjs [--root <dir>]`, the root holding `src/` and `docs/notes/` and
// defaulting to the repo this script sits in – NOT the working directory. Exit 0 with one line,
// `notes-pointers: N pointers, all resolve` (N may be 0), or exit 1 with one line per failure,
// `file:line -> pointer (reason)`. Exit 2 is a misuse of the gate itself (an unknown flag, a root with no
// `src/`), kept apart from 1 so that a wrong root can never read as «0 pointers, all resolve».
// `--root` is for tests/notes-pointers.test.ts, which runs the gate over the fixture trees in
// tests/fixtures/notes-pointers/ so that its behaviour is tested without depending on what `src` holds.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const MARK = 'docs/notes/'
/** A well-formed pointer, matched from the start of the mark (sticky) – THE POINTER GRAMMAR above. */
const POINTER = /docs\/notes\/((?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+\.md)#([\p{L}\p{N}-]+)(?![\p{L}\p{N}_#-])/uy
const MALFORMED = 'malformed pointer: expected docs/notes/<path>.md#<anchor>'
const USAGE = 'usage: node scripts/notes-pointers.mjs [--root <dir>]'

/** THE SLUG RULE, in code. The header above is the contract; this is its only body. */
function slugify(heading) {
  return heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N} \-]/gu, '')
    .replace(/ /g, '-')
    .replace(/-{2,}/g, '-')
}

/** Every anchor a notes file offers: ATX headings, outside front matter and fenced code. */
function headingSlugs(markdown) {
  const slugs = new Set()
  const lines = markdown.split(/\r?\n/)
  let at = 0
  if (lines[0] === '---') {
    const end = lines.indexOf('---', 1)
    at = end === -1 ? lines.length : end + 1
  }
  let fence = ''
  for (; at < lines.length; at++) {
    const line = lines[at]
    if (fence) {
      const close = /^ {0,3}(`{3,}|~{3,})[ \t]*$/.exec(line)
      if (close && close[1][0] === fence[0] && close[1].length >= fence.length) fence = ''
      continue
    }
    const open = /^ {0,3}(`{3,}|~{3,})/.exec(line)
    if (open) {
      fence = open[1]
      continue
    }
    const heading = /^ {0,3}#{1,6}[ \t]+(.*?)[ \t]*$/.exec(line)
    if (!heading) continue
    const slug = slugify(heading[1].replace(/[ \t]+#+$/, ''))
    if (slug) slugs.add(slug)
  }
  return slugs
}

function* sourceFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* sourceFiles(path)
    else if (entry.isFile() && /\.(ts|vue)$/.test(entry.name)) yield path
  }
}

const climbs = (path) => path.split('/').some((segment) => segment === '.' || segment === '..')

/** null when the pointer resolves, otherwise why it does not. `cache` maps a notes file to its slugs. */
function unresolved(root, path, anchor, cache) {
  const file = join(root, 'docs', 'notes', ...path.split('/'))
  if (!cache.has(file)) {
    cache.set(file, existsSync(file) && statSync(file).isFile() ? headingSlugs(readFileSync(file, 'utf8')) : null)
  }
  const slugs = cache.get(file)
  if (!slugs) return 'file not found'
  return slugs.has(anchor) ? null : 'anchor not found'
}

function misuse(message) {
  console.error(`notes-pointers: ${message}\n${USAGE}`)
  return 2
}

function main(argv) {
  let root = fileURLToPath(new URL('..', import.meta.url))
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root' && i + 1 < argv.length) root = resolve(argv[++i])
    else return misuse(`unknown argument ${JSON.stringify(argv[i])}`)
  }
  const srcDir = join(root, 'src')
  if (!existsSync(srcDir) || !statSync(srcDir).isDirectory()) return misuse(`no src/ directory under ${root}`)

  const cache = new Map()
  const failures = []
  let count = 0
  for (const file of sourceFiles(srcDir)) {
    const rel = relative(root, file).split(sep).join('/')
    for (const [index, line] of readFileSync(file, 'utf8').split('\n').entries()) {
      let from = line.indexOf(MARK)
      while (from !== -1) {
        count++
        POINTER.lastIndex = from
        const match = POINTER.exec(line)
        let shown
        let reason
        let next
        if (match && !climbs(match[1])) {
          shown = match[0]
          reason = unresolved(root, match[1], match[2], cache)
          next = from + match[0].length
        } else {
          // What the author wrote, up to the next space, minus the sentence punctuation that closes it.
          shown = (match ? match[0] : /^\S*/.exec(line.slice(from))[0]).replace(/[.,;:!?)\]}'"`]+$/, '')
          reason = MALFORMED
          next = from + MARK.length
        }
        if (reason) failures.push(`  ${rel}:${index + 1} -> ${shown} (${reason})`)
        from = line.indexOf(MARK, next)
      }
    }
  }

  if (failures.length) {
    console.error(`notes-pointers: ${failures.length} of ${count} pointers do not resolve:`)
    for (const failure of failures) console.error(failure)
    return 1
  }
  console.log(`notes-pointers: ${count} pointers, all resolve`)
  return 0
}

process.exitCode = main(process.argv.slice(2))
