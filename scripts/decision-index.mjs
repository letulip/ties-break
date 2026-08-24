#!/usr/bin/env node

// THE CURRENT-DECISION INDEX – R2-12 / TOK-03. A ROUTE INTO THE ARCHIVE, NOT A SECOND ARCHIVE.
//
// ⚠ THE PROBLEM, IN ONE NUMBER. `docs/decisions.md` is the append-only owner record and it is now
// ~47,200 estimated tokens across 60 dated entries (counted 24.08 – the review's "95" was the H2
// count including the sub-headings inside entries). An agent that needs "what did he rule about
// college?" has two bad options: load 47k tokens, or grep and hope the first hit is the newest one.
// The review's words: "freeze it as the stable archive and add a compact area -> current decision
// ID/date/status index. Do not copy decision bodies into the index."
//
// ⚠ THE ARCHIVE IS NOT TOUCHED. Not one entry is edited, moved, merged or re-dated by this script.
// It writes ONE generated block between two HTML comments, above the first dated entry. Everything
// below that block is byte-identical to what the owner wrote.
//
// WHAT IS MACHINE-DERIVED AND WHAT IS NOT, because the difference is the whole trustworthiness of
// the thing:
//
//   date, title, anchor, ordering, "which is newest"   – read out of the entries' own H2 headings.
//                                                        Cannot drift: `--check` fails if it has.
//   area                                               – an ORDERED keyword table, below. This is
//                                                        the hand-maintained part, because no
//                                                        machine can read "«ДАВАЙ 50»: the WTA 500
//                                                        gets a head" and know it is about the
//                                                        ranking ladder.
//   the ruling itself                                  – NOT here, deliberately. The index says
//                                                        WHERE to read; the entry says WHAT.
//
// ⚠ AND IT IS A ROUTE, NOT A VERDICT. "Current" here means "the newest entry this table put in that
// area" – it is the place to start reading, not a summary of the ruling, and an entry can revise
// only part of an earlier one. Where an entry says in its own words that it supersedes another, the
// row carries that; the script does not infer supersession from anything else.

import { promises as fs } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const args = new Set(process.argv.slice(2))
const check = args.has('--check')

const FILE = 'docs/decisions.md'
const BEGIN = '<!-- BEGIN GENERATED: current-decision index – `npm run decisions` -->'
const END = '<!-- END GENERATED: current-decision index -->'
const ANCHOR_AFTER = /^Owner decisions, newest last\..*$/m

// --- THE AREA TABLE. ORDERED: THE FIRST RULE THAT MATCHES A HEADING WINS. -----------------------
//
// ⚠ ORDER IS THE PRECISION, not the patterns. "the masseur is priced like a professional" is about
// STAFF and mentions a price; "the college tariff" is about COLLEGE and mentions a tariff. Narrow
// subjects therefore sit above broad ones, and a rule is only ever added with the heading that
// motivated it in front of you. An unmatched heading lands in `general`, which is honest – a
// wrong area is worse than no area, because the reader stops looking.
const AREAS = [
  ['kid-life-and-school', /\bschool\b|\bexam|training doubles|kid life/i],
  ['college', /college|ncaa|academic year|call-up|championship/i],
  ['age-and-eligibility', /age grid|age clock|age-eligibility|eligibility|birthday|reads her date/i],
  ['injury-and-condition', /\binjur|condition|fatigue|recovery|masseur|layoff|strain|rehab/i],
  ['coach-and-staff', /\bcoach|\bstaff\b|academy|retainer/i],
  ['ranking-and-ladder', /ladder|ranking|acceptance cut|head of the list|second seat|wta \d|slam door|plateau|skill law|does skill decide/i],
  ['world-and-field', /professional|the field\b|turnover|\brival|cohort|live .*table/i],
  ['economy-and-money', /money|wallet|price|priced|cost|bill|tariff|prize|sponsor|funding|budget|entry fee|\btill\b|share of the prize|who pays/i],
  ['calendar-and-season', /calendar|season|empty week|anchor|tournament|the entry she|\bdraw\b/i],
  ['match-and-viewer', /\bmatch\b|\bviewer\b|commentary|shout|point engine|\bserve\b/i],
  ['narrative-and-endings', /ending|diary|\bnews\b|\bstory\b|retirement|\brose\b|portrait/i],
  ['saves-and-schema', /schema|\bsave\b|migration|\bv\d\d\b/i],
  ['simulation-and-balance', /\bsim\b|corridor|measured|bench|talent breakdown/i],
  // ⚠ ui BEFORE process, and it is not arbitrary: "UI detour", "the COPY RULE" and "the wrap-up"
  // all also carry a round number, and a round number is the weakest signal in the corpus.
  ['ui-and-copy', /screen|popup|dialog|copy|\bui\b|home hub|wrap-up|surfac|detour/i],
  ['process-and-git', /\bgit\b|process|checklist|ledger|backlog|review|\bround \d+\b|playtest|\bskill\b|codex|programme|directive/i],
  ['product-and-scope', /concept|stack|phase \d|q&a|design decisions|roadmap|onramp/i],
]

/** GitHub's heading slug, to `github-slugger`'s own rules: lowercase, trim, drop everything that is
 *  not a letter, number, space, hyphen or underscore, then ONE dash per remaining space.
 *
 *  ⚠ THE RUN OF SPACES IS NOT COLLAPSED, AND THAT IS THE WHOLE CORRECTNESS OF THE LINK. Dropping the
 *  ` – ` between date and title leaves two spaces behind, so the real anchor is `2026-08-16--empty`,
 *  with a double dash. A tidier `\s+ -> -` produces a link that looks right and resolves nowhere. */
function slug(heading) {
  return heading
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/ /g, '-')
}

/** The entry's date as a sortable ISO string. The archive writes dates three ways – `2026-08-16`,
 *  `16.08.2026`, and ranges (`2026-07-23/24`, `22–23.08.2026`) – so all three are read, and the
 *  LAST day of a range is the one that counts for "newest". */
function isoDate(heading) {
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:\/(\d{2}))?/.exec(heading)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[4] ?? iso[3]}`
  const dotted = /^(?:(\d{1,2})[–-])?(\d{1,2})\.(\d{2})\.(\d{4})/.exec(heading)
  if (dotted) return `${dotted[4]}-${dotted[3]}-${dotted[2].padStart(2, '0')}`
  return null
}

/** The heading with its date prefix and trailing branch tag removed – the part a reader scans.
 *
 *  ⚠ THE DATE IS STRIPPED BY ITS OWN SHAPE, not by "everything up to the first dash": `2026-08-16`
 *  contains two dashes, and the lazy version produced titles reading "08-16 – Empty weeks are…". */
function shortTitle(heading) {
  return heading
    .replace(/^(?:\d{4}-\d{2}-\d{2}(?:\/\d{2})?|(?:\d{1,2}[–-])?\d{1,2}\.\d{2}\.\d{4})\s*[–—-]\s*/, '')
    .replace(/\s*\([`'][^)]*\)\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function areaOf(heading) {
  for (const [area, pattern] of AREAS) if (pattern.test(heading)) return area
  return 'general'
}

function parseEntries(text) {
  const lines = text.split('\n')
  const entries = []
  for (let index = 0; index < lines.length; index++) {
    const match = /^## (.+)$/.exec(lines[index])
    if (!match) continue
    const heading = match[1].trim()
    const date = isoDate(heading)
    if (!date) continue // `## Current truth` and anything else that is not a dated entry
    const bodyEnd = lines.findIndex((line, i) => i > index && /^## /.test(line))
    const body = lines.slice(index + 1, bodyEnd < 0 ? lines.length : bodyEnd).join('\n')
    entries.push({
      heading,
      date,
      title: shortTitle(heading),
      anchor: slug(heading),
      area: areaOf(heading),
      // ⚠ CASE-SENSITIVE, AND NARROW ON PURPOSE. The archive shouts a real supersession
      // ("⚠ SUPERSEDES 19.08's DIARY-LINE RULING"); an entry that merely mentions in prose that two
      // review proposals were "superseded by" something else is not one, and a loose /supersede/i
      // marked exactly that entry on the first run.
      supersedes: /\bSUPERSEDES\b/.test(heading) || /\bSUPERSEDES\b/.test(body),
    })
  }
  return entries
}

function renderIndex(entries) {
  const byArea = new Map()
  for (const entry of entries) {
    const list = byArea.get(entry.area) ?? []
    list.push(entry)
    byArea.set(entry.area, list)
  }

  const rows = [...byArea.entries()]
    .map(([area, list]) => {
      const sorted = [...list].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
      return { area, current: sorted[sorted.length - 1], count: sorted.length }
    })
    .sort((a, b) => (a.area < b.area ? -1 : 1))

  const newest = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1))[0]
  const out = [
    BEGIN,
    '',
    '## Where the current answer lives',
    '',
    `**Generated** by \`npm run decisions\` from the headings below – ${entries.length} dated entries,` +
      ` newest ${newest.date}. Do not hand-edit this block; \`npm run decisions:check\` fails when it is stale.`,
    '',
    'This is a ROUTE, not a ruling. "Current" means the newest entry in that area – open it and read the',
    'entry itself, which is the record. An entry can revise part of an earlier one without replacing it,',
    'and the area column is a hand-maintained keyword map (see `scripts/decision-index.mjs`), not a claim',
    'the owner made. Nothing below the block has been edited: the archive is append-only and stays exact.',
    '',
    '| Area | Entries | Current entry | Date |',
    '| --- | ---: | --- | --- |',
    ...rows.map(
      (row) =>
        `| ${row.area} | ${row.count} | [${row.current.title}](#${row.current.anchor})` +
        `${row.current.supersedes ? ' ⚠ supersedes an earlier entry' : ''} | ${row.current.date} |`,
    ),
    '',
    END,
  ]
  return out.join('\n')
}

async function main() {
  const file = path.join(root, FILE)
  const text = await fs.readFile(file, 'utf8')
  const entries = parseEntries(text)
  if (!entries.length) {
    console.error(`decision index: no dated entries found in ${FILE} – has the heading format changed?`)
    process.exitCode = 1
    return
  }

  const block = renderIndex(entries)
  let next
  const beginAt = text.indexOf(BEGIN)
  if (beginAt >= 0) {
    const endAt = text.indexOf(END, beginAt)
    if (endAt < 0) {
      console.error(`decision index: ${FILE} has an opening marker with no ${END}`)
      process.exitCode = 1
      return
    }
    next = text.slice(0, beginAt) + block + text.slice(endAt + END.length)
  } else {
    const anchor = ANCHOR_AFTER.exec(text)
    if (!anchor) {
      console.error(`decision index: cannot find the insertion anchor in ${FILE}`)
      process.exitCode = 1
      return
    }
    const at = anchor.index + anchor[0].length
    next = `${text.slice(0, at)}\n\n${block}${text.slice(at)}`
  }

  if (check) {
    if (next !== text) {
      console.error(
        `decision index: ${FILE} is stale – run \`npm run decisions\`.\n` +
          '  (a dated entry was added, renamed or re-dated since the block was generated)',
      )
      process.exitCode = 1
      return
    }
    console.log(`decision index: ok – ${entries.length} entries, ${new Set(entries.map((e) => e.area)).size} areas`)
    return
  }

  await fs.writeFile(file, next)
  const unsorted = entries.filter((entry) => entry.area === 'general').length
  console.log(
    `decision index: written – ${entries.length} entries in ${new Set(entries.map((e) => e.area)).size} areas` +
      (unsorted ? `, ${unsorted} unmatched (area 'general')` : ''),
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error)
  process.exitCode = 1
})
