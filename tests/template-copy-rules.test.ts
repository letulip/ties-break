// THE HOUSE RULES FOR EVERY <template>, ENFORCED ACROSS EVERY .vue FILE (02.08, wave/pro-prep).
//
// ⚠ WIDENED, NOT INVENTED. The rule is the owner's and it is old: player-facing copy uses the
// SHORT dash «–», never the long one, and there is no Cyrillic in a template - not in the strings
// and not in the comments, because a template comment is one careless `v-if` away from being
// rendered and because the whole rendered surface is English. What was missing is enforcement at
// the right scope: the pin lived in tests/round11.test.ts and read exactly ONE component
// (SeasonSummaryDialog.vue). Everything else was on trust, and trust lost - four templates were
// carrying quoted Russian rulings when this file was written (MatchViewer, PracticeFlow,
// TournamentFlow, KidScreen), two more slipped in during this month's waves and were caught only
// by a human reading a diff, and one was caught by the narrow guard purely because the offending
// edit happened to land in the one file it watched.
//
// THE CONVENTION THE FIX FOLLOWS, so the owner's words are never lost to satisfy a linter: his
// rulings stay quoted in full on the SCRIPT side (Cyrillic is welcome in `<script>` and `<style>`
// comments - that is where the design record lives), and the template carries an English
// paraphrase that says the same thing to the next reader.
//
// SCOPE, deliberately: the WHOLE template block of every .vue file under src/. Not just the
// rendered strings - a comment is the thing that has actually gone wrong six times.
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative } from 'node:path'

const SRC = fileURLToPath(new URL('../src', import.meta.url))

function vueFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) vueFiles(full, out)
    else if (entry.endsWith('.vue')) out.push(full)
  }
  return out
}

/** Every `<template>…</template>` block of one component, joined. Vue allows more than one
 *  (`<template #slot>` inside the root is nested, so a naive first-to-last slice is enough and is
 *  what the narrow pin used) - this takes the root block from the first `<template>` to the LAST
 *  closing tag, which is the whole rendered surface plus every nested slot template. */
function templateOf(src: string): string {
  const from = src.indexOf('<template>')
  if (from === -1) return ''
  const to = src.lastIndexOf('</template>')
  return to > from ? src.slice(from, to) : src.slice(from)
}

const files = vueFiles(SRC).map((path) => ({
  name: relative(SRC, path),
  template: templateOf(readFileSync(path, 'utf8')),
}))

describe('every Vue template obeys the copy rules', () => {
  it('the scan covers the real component tree (a guard that reads nothing passes everything)', () => {
    expect(files.length).toBeGreaterThan(30)
    expect(files.filter((f) => f.template.length > 0).length).toBeGreaterThan(30)
  })

  it('no Cyrillic anywhere in a template - strings OR comments', () => {
    const offenders = files
      .filter((f) => /[А-Яа-яЁё]/.test(f.template))
      .map((f) => `${f.name}: ${(f.template.match(/.*[А-Яа-яЁё].*/) ?? [''])[0].trim().slice(0, 90)}`)
    // The failure message names the file and the line, because "somewhere in 40 components" is
    // not an actionable guard. Fix by moving the owner's quote to the script side (see the header).
    expect(offenders).toEqual([])
  })

  it('no long dash in a template - the owner\'s copy rule, everywhere it renders', () => {
    const offenders = files
      .filter((f) => f.template.includes('—'))
      .map((f) => `${f.name}: ${(f.template.match(/.*—.*/) ?? [''])[0].trim().slice(0, 90)}`)
    expect(offenders).toEqual([])
  })
})
