// =================================================================================================
// ⚠⚠ THE READ-NEUTRALITY LINT – her `'ended'` line may not take a side the HEADING is deciding
// =================================================================================================
//
// `docs/plans/life-wave-4-rulings-2026-09.md` §J (architect's read of T6's matrix, 12.09).
//
// THE SHAPE THAT MAKES THIS NECESSARY. `ENDED_HER_LINE` is keyed
// `Record<Temperament, Record<EndsRegister, PresenceCell>>` – voice, register, presence, and NO READ
// AXIS. The card's HEADING does carry the read (ruling I: space vs company, drawn on
// `seed:life:ends:<endedWeek>:react`). So the two surfaces vary INDEPENDENTLY, and a line of hers
// that takes a position on whether she wants somebody there contradicts the heading on roughly half
// the careers that reach it.
//
// ⚠ THE DISTINCTION T6's SIXTEEN LINES GET RIGHT, and the one a later editor has to preserve: fiery's
// «No, I don't want to go through it» and deep's «I'd rather not say more» are about RECOUNTING. The
// read is about PRESENCE. «Don't make me explain it, but don't leave me alone» is one coherent
// person, so those lines sit honestly under EITHER heading. What breaks is a line about solitude or
// company – «I'd rather be on my own», «just stay a while».
//
// ⚠⚠ AND THE POOL'S OWN NOTE IS PART OF THE HAZARD. It argues REGISTER-neutrality at length, which
// teaches a reader that the axes were thought about – so the missing one is easy to walk straight
// past. A comment could not fix that; a lint can.
//
// ⚠ WHY THE WHOLE LINE AND NOT JUST THE QUOTATION: a want can be stated as an observed speech act in
// the narration («She asked to be left alone») just as easily as inside her quotation marks, and
// that is not interiority the fallible-parent law would catch – it is a thing the parent heard.
//
// ⚠ THE OWNER'S ВЫЧИТКА IS THE MOST LIKELY PLACE A LEANING LINE GETS WRITTEN, which is why this
// lands before he reads rather than after. Adding a phrase tightens the ratchet; removing one is his
// call, exactly as with `BANNED_TAILS`.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const SOURCE = 'src/engine/world/lifeBeat.ts'

/** Phrases that take a position on PRESENCE – whether she wants somebody with her. The heading owns
 *  that question; her line must not answer it. ⚠ Not a style list: every entry here would make the
 *  card argue with itself under one of the two reads. */
const PRESENCE_CLAIMS = [
  'on my own',
  'by myself',
  'alone',
  'leave me',
  'stay with me',
  'stay a while',
  'sit with me',
  'some space',
  'some room',
  'come over',
  'keep me company',
] as const

/** The pool's own span, so the sweep cannot drift onto a neighbouring pool that IS keyed by the read
 *  (the heading's, which is supposed to say these things). Ends at the first line that closes the
 *  record at column 0 – the file's own formatting, and a change to it fails this loudly rather than
 *  silently narrowing the sweep. */
function poolSpan(src: string, name: string): string {
  const lines = src.split('\n')
  const start = lines.findIndex((l) => l.startsWith(`const ${name}`))
  expect(start, `${name} must exist in ${SOURCE} – if it was renamed, re-aim this lint`).toBeGreaterThan(-1)
  const end = lines.findIndex((l, i) => i > start && l === '}')
  expect(end, `${name} must close at column 0`).toBeGreaterThan(start)
  return lines.slice(start, end + 1).join('\n')
}

/** ⚠ THE CELL VALUES ONLY, matched through their `roof:` / `away:` keys – which is `PresenceCell`'s
 *  own two members, so the extraction is the type spelled as a regex.
 *
 *  ⚠⚠ A BARE STRING-LITERAL SWEEP IS WRONG HERE AND THE COUNT ASSERTION CAUGHT IT: the record's own
 *  `'told-now'` / `'told-late'` keys are quoted too, so a bare sweep returned 24 where the pool has
 *  16 cells. Loosening the count to 24 would have been the easy repair and the wrong one – it would
 *  have left eight non-sentences in the swept set for ever, and a ban phrase can never appear in a
 *  key, so the extra eight could only ever dilute the evidence. */
function stringsIn(span: string): string[] {
  return [...span.matchAll(/\b(?:roof|away): '((?:[^'\\]|\\.)*)'/g)].map((m) => m[1].replace(/\\'/g, "'"))
}

function leansIn(texts: readonly string[]): string[] {
  const found: string[] = []
  for (const text of texts) {
    const low = text.toLowerCase()
    for (const claim of PRESENCE_CLAIMS) if (low.includes(claim)) found.push(`${claim} :: ${text}`)
  }
  return found
}

describe('ruling J – her ending line stays read-neutral', () => {
  it('⭐⭐⭐ no line in ENDED_HER_LINE takes the side the heading is deciding', () => {
    const texts = stringsIn(poolSpan(readFileSync(SOURCE, 'utf8'), 'ENDED_HER_LINE'))
    // ⚠ A NEGATIVE ASSERTION MUST FIRST PROVE ITS TARGET EXISTS (the wave-3 family). Sixteen cells:
    // 4 voices x 2 registers x 2 presences. A regex that matched nothing would pass this test while
    // sweeping an empty list.
    expect(texts.length, 'the sweep found the pool').toBe(16)
    expect(leansIn(texts)).toEqual([])
  })

  it('⚠ THE ARM, IN-TEST, so this net proves it can fail on every green build', () => {
    // ⚠⚠ RUN ON EVERY BUILD RATHER THAN RECORDED AS A ONE-OFF MUTATION – T5's ARMS 7/8 model. A lint
    // whose ban list stops matching (a renamed pool, a changed quote style, a regex that silently
    // captures nothing) goes quiet in exactly the way the case above cannot notice.
    const poisoned = ['She said it at the door. "It is over. I\'d rather be on my own."']
    expect(leansIn(poisoned), 'a leaning line IS caught').toHaveLength(1)
    const clean = ['She said it at the door. "It is over. I\'d rather not say more."']
    expect(leansIn(clean), 'a recounting line is NOT caught – the distinction ruling J turns on').toEqual([])
  })
})
