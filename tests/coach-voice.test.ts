// R15-7 — NOBODY IN THIS GAME IS CALLED "HE" BY A GUESS.
//
// Owner, 09.08: «у Тернеров в списке везде "He" (он), хотя там есть и женщины, можем просто убрать
// это и через дефис оба предложения написать, тогда не надо будет угадывать».
//
// THE DEFECT IS STRUCTURAL, not a typo. `buildCoachRoster` (engine/coach.ts) draws a first name from
// `COACH_FIRST_M` *or* `COACH_FIRST_F` according to `slot.gender`, and the shipped portraits under
// public/images/coaches are of specific people of both sexes - so a woman is on EVERY roster of
// every career by construction. The copy around her was written male throughout: the knock dialog's
// read, the market's load notes, the travel-stance event, the escalation event, the radar's quiet
// line, the market screen's price note and the Kid screen's radar blurb. Nine surfaces, one wrong
// assumption. The doctor is the same shape with even less behind it - never named, never pictured,
// never gendered anywhere in the engine, and still called "he" on the clearance warning.
//
// THE FIX IS THE OWNER'S OWN: drop the pronoun, join the two sentences with a dash, and then nothing
// has to guess. This file is what stops it coming back. The lesson is the one
// tests/calendar-screen.test.ts already wrote down after a single second-person line survived in a
// pool of twelve: "the copy is data, and data with a rule needs a test or the rule is a habit".
//
// ⚠ WHY THIS IS A CORPUS SWEEP AND NOT A MOUNTED TEST, which is otherwise this project's rule. The
// claim is NEGATIVE and it is about a whole corpus - "no surface anywhere says he" - and no amount
// of mounting proves it. A mounted test can only visit the surfaces somebody thought of, which is
// exactly how nine of them were missed in the first place. The POSITIVE half (that the de-gendered
// plaque actually renders) is mounted, in tests/component/round15-surfaces.test.ts.
//
// ⚠ COMMENTS ARE EXEMPT AND DELIBERATELY SO. `<script>` and `/* */` are where this repo keeps its
// design record, including the owner's own words, and a rule that reached into them would force the
// history to be rewritten to satisfy a linter. Only what a PLAYER can read is swept: rendered
// template text and string literals in code.
//
// ⚠ THE PLAYER IS "you", THE GIRL IS "she", AND EVERY PROFESSIONAL IS UNNAMED. That is the rule this
// asserts, and it is the whole cast: there is nobody left in the game a masculine pronoun could
// honestly belong to. If a future feature introduces one - a named father, a male opponent's parent
// - this test is where that conversation has to happen, which is the point of it being strict.
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative } from 'node:path'

const SRC = fileURLToPath(new URL('../src', import.meta.url))

const MASCULINE = /\b(he|his|him|himself)\b/i

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) sourceFiles(full, out)
    else if (full.endsWith('.ts') || full.endsWith('.vue')) out.push(full)
  }
  return out
}

/** Code with its comments blanked. Regex rather than a parser, and the failure direction is the safe
 *  one: a `//` that happens to sit inside a string truncates that string, so the sweep sees LESS
 *  text, never more. It cannot invent an offender - only miss one. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')
}

/** The rendered surface of a component: its template block minus the template comments. */
function renderedTemplate(src: string): string {
  const from = src.indexOf('<template>')
  if (from === -1) return ''
  const to = src.lastIndexOf('</template>')
  return (to > from ? src.slice(from, to) : src.slice(from)).replace(/<!--[\s\S]*?-->/g, ' ')
}

/** Every string literal in a file's CODE - the engine's copy lives in these. The 8-character floor
 *  keeps class names, ids and single words out; a sentence a player reads is never that short. */
function literals(code: string): string[] {
  const out: string[] = []
  for (const m of code.matchAll(/'([^'\\\n]*(?:\\.[^'\\\n]*)*)'|"([^"\\\n]*(?:\\.[^"\\\n]*)*)"|`([^`\\]*(?:\\.[^`\\]*)*)`/g)) {
    const s = m[1] ?? m[2] ?? m[3] ?? ''
    if (s.length > 8) out.push(s)
  }
  return out
}

const files = sourceFiles(SRC).map((path) => {
  const src = readFileSync(path, 'utf8')
  const scriptEnd = src.indexOf('<template>')
  return {
    name: relative(SRC, path),
    template: renderedTemplate(src),
    code: stripComments(scriptEnd === -1 ? src : src.slice(0, scriptEnd)),
  }
})

describe('R15-7 - no surface guesses a professional\'s gender', () => {
  it('the sweep covers the real tree (a guard that reads nothing passes everything)', () => {
    // The other half of every corpus test in this repo. Without it, a broken path or a renamed
    // directory turns this file into a green light that inspects zero bytes.
    expect(files.length).toBeGreaterThan(60)
    expect(files.filter((f) => f.template.length > 0).length).toBeGreaterThan(30)
    expect(files.filter((f) => literals(f.code).length > 0).length).toBeGreaterThan(30)
    // ...and the scanner really does find pronouns when they are there, which is the assertion that
    // makes every `toEqual([])` below mean something.
    expect(MASCULINE.test('The coach says it is probably nothing. Probably is his word.')).toBe(true)
    expect(MASCULINE.test('The coach shrugged. He would let her train.')).toBe(true)
    // ...and does not fire on the girl, who is the one person here nobody is guessing about.
    expect(MASCULINE.test('She lost the final and nobody has found the right thing to say.')).toBe(false)
  })

  it('no rendered template text calls anybody "he"', () => {
    const offenders: string[] = []
    for (const f of files) {
      for (const line of f.template.split('\n')) {
        if (MASCULINE.test(line)) offenders.push(`${f.name}: ${line.trim().slice(0, 90)}`)
      }
    }
    // Named per line, because "somewhere in seventy components" is not an actionable guard. The fix
    // is the owner's: drop the pronoun and join the two halves with a dash.
    expect(offenders).toEqual([])
  })

  it('no string a player can read calls anybody "he" either', () => {
    // Where the knock dialog, the market notes, the ledger events and the diary pools live. The
    // engine owns most of this game's copy - it is state, not template text - so a sweep that
    // stopped at the components would have missed seven of the nine surfaces this item found.
    const offenders: string[] = []
    for (const f of files) {
      for (const s of literals(f.code)) {
        if (MASCULINE.test(s)) offenders.push(`${f.name}: ${s.slice(0, 90)}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('...and the roster really does put women on every list, which is why the rule exists', () => {
    // The structural fact behind the item, asserted rather than described: if the roster were male by
    // construction, this whole file would be pedantry. It is not - `slot.gender` is read on every
    // draw and the first-name pools are split by it.
    const coach = readFileSync(join(SRC, 'engine/coach.ts'), 'utf8')
    expect(coach).toContain('COACH_FIRST_F')
    expect(coach).toContain('COACH_FIRST_M')
    expect(coach).toMatch(/slot\.gender/)
  })
})
