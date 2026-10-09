// L3-0 (09.10) – WHO READS A LEDGER ROW'S `text`, and what each reader does when the sentence becomes data.
//
// `WorldEvent.text` stays on every row (events.ts, `c`'s note: the owner's ruling 4 lets legacy English be RETAINED), so no reader below breaks in
// this wave. This file is the CHECKLIST for the wave that stops writing it: it names every non-comment read of `<row>.text` in `src/`, with the
// verdict, and it FAILS when a new one appears – a new reader is a decision (display: route it through `eventText`; behaviour: give it a semantic
// field), and a ratchet that only counts lines would let one in silently.
//
// ⚠ THE SCAN IS BY IDENTIFIER (`e|ev|evt|event|row` + `.text`), which finds a read through the usual names and cannot find a destructured one;
// the L3-0 sweep also grepped `{ text }` patterns by hand (none in src/). It is a ratchet, not a proof.
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { eventText } from '../src/i18n'
import { createWorld } from '../src/engine/world'
import { addEvent } from '../src/engine/world/ledger'

const ROOT = resolve(__dirname, '..')
function walk(dir: string, out: string[]): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(ts|vue)$/.test(name)) out.push(p)
  }
  return out
}

/** file -> verdict. `display` = prints the sentence; `behaviour` = compares or splits it; `not an event` = the regex's false positives. */
const READERS: Record<string, string> = {
  'src/composables/tabSeen.ts': 'BEHAVIOUR – the calendar tab\'s unseen dot compares a row to the literal \'New events on the calendar\' (bookkeeping.ts). SAFE while `text` is written; swap to a semantic marker before it stops.',
  'src/engine/diary/facts.ts': 'BEHAVIOUR – `tierFromLabel(e.text)` reads the tier off a `tournament` summary row. SAFE while `text` is written; the row carries no tier field, so one is owed before it stops.',
  'src/engine/world/phaseObligations.ts': 'BEHAVIOUR – the academy notice\'s this-week dedup tests `e.text.startsWith(opening)`. SAFE while `text` is written; needs a milestoneKey/lifeKind-style marker before it stops.',
  'src/engine/world/lifeMoment.ts': 'DISPLAY COPY – the life-moment card\'s line is the kept row\'s text copied into the snapshot; v93 carries the row\'s `c` beside it as `lineC` and LifeMomentOverlay renders it through `eventText`.',
  'src/engine/world/tournamentClose.ts': 'WRITER – `ev.text` is the kid-match row being WRITTEN (kidMatchEvent), not a stored row being read.',
  'src/engine/world/sponsors.ts': 'WRITER – `row.text` is the payout line handed to `bankSponsorCheque`, not a stored event.',
  'src/engine/migrations.ts': 'FROZEN HISTORY – the v7/v31/v37 steps read the text of rows that predate `c`; they run before the v93 step and are never edited.',
  'src/engine/migrations/reverseMatch.ts': 'THE MATCHER – reads `row.text` to recognise it.',
  'src/i18n/index.ts': 'THE HELPER – `eventText` itself.',
  'src/components/MatchViewer.vue': 'NOT AN EVENT – `row`/`line` here are commentary lines of a match being watched.',
}

describe('every read of a ledger row\'s sentence is on the list', () => {
  it('finds exactly the readers the L3-0 sweep named', () => {
    const found: string[] = []
    for (const file of walk(join(ROOT, 'src'), [])) {
      const lines = readFileSync(file, 'utf8').split('\n')
      const hit = lines.some((l) => {
        const t = l.trim()
        if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return false
        return /\b(?:e|ev|evt|event|row)\.text\b/.test(l)
      })
      if (hit) found.push(file.slice(ROOT.length + 1))
    }
    expect(found.sort(), 'a NEW reader of `<row>.text` – decide display (eventText) or behaviour (a semantic field), then add it to READERS with the verdict').toEqual(Object.keys(READERS).sort())
  })
})

describe('eventText – the one way a screen shows a ledger row', () => {
  it('shows `text` when the row carries no ref', () => {
    expect(eventText({ text: 'Physio / recovery session' })).toBe('Physio / recovery session')
  })
  it('renders `c` under English to the same bytes as the stored text (the formatter\'s identity path)', () => {
    const row = { text: "Entered World Tour 35 – W26 '35 (grass)", c: { k: 'Entered {0} – {1} ({2})', p: ['World Tour 35', "W26 '35", 'grass'] } }
    expect(eventText(row)).toBe(row.text)
  })
  it('renders the ref, not the stored text, when the two differ (c is the display source)', () => {
    expect(eventText({ text: 'old words', c: { k: 'new words {0}', p: ['here'] } })).toBe('new words here')
  })
})

describe('addEvent – the engine side of the pass-through (writers adopt it in L3-1..7, none does yet)', () => {
  it('stores a ref on the row it pushes, beside text, and the money fold is exactly what it was', () => {
    const world = createWorld('l30-passthrough')
    const before = world.careerTotals.spentCents
    const c = { k: 'Booked: {0} – {1}', p: ['Seaside family hotel', "W30 '35"] }
    addEvent(world, { week: world.week, type: 'expense', category: 'vacation', text: "Booked: Seaside family hotel – W30 '35", amountCents: -500_00, c })
    const row = world.events[world.events.length - 1]!
    expect(row.c).toEqual(c)
    expect(row.text).toBe("Booked: Seaside family hotel – W30 '35")
    expect(world.careerTotals.spentCents - before, 'the choke point still folds the cents').toBe(500_00)
  })
  it('a row written the old way carries no `c` key at all (nothing writes one yet)', () => {
    const world = createWorld('l30-passthrough-2')
    addEvent(world, { week: world.week, type: 'info', text: 'plain' })
    expect('c' in world.events[world.events.length - 1]!).toBe(false)
  })
})
