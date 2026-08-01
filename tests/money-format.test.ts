import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { formatCents, formatCentsSigned } from '../src/shared/money'

// =================================================================================================
// P6 (a)+(b) — ONE MONEY FORMATTER, and a gate that keeps the copies from coming back.
//
// WHAT THIS REPLACED, so the numbers below read as history rather than paranoia: the exact same
// four-line body was re-implemented FIFTEEN times across thirteen components, under three names
// (formatDollars / formatSigned / formatFunds) plus two inline copies — and one of the fifteen,
// MoneyScreen's `formatDollars(dollars: number)`, took DOLLARS while its seven same-named siblings
// took CENTS. One code move between screens away from a ×100 display bug, in the game whose pillar
// is honest economics. The shared module carries the unit in both function names so that trap is
// unrepresentable: there is no `formatDollars` to reach for any more.
//
// Three describes: the exact strings (the contract), the DRY gate (the protection), and the
// MoneyScreen pins (P6 (b): the engine constant, not a hand copy).
// =================================================================================================

describe('formatCents / formatCentsSigned — the one money contract: cents in, whole dollars out', () => {
  it('rounds to whole dollars and groups en-US', () => {
    expect(formatCents(123456)).toBe('$1,235')
    expect(formatCents(-123456)).toBe('-$1,235')
    expect(formatCents(120_000_00)).toBe('$120,000') // a wealthy family's opening balance
    expect(formatCents(0)).toBe('$0')
  })

  it('⚠ the -0 edge: sub-dollar debt must never print "-$0"', () => {
    // Math.round(-49 / 100) is NEGATIVE ZERO, and `-0 < 0` is false — which is exactly the
    // behaviour every deleted local copy had, so it is pinned here as the contract rather than
    // rediscovered as a surprise. A player owed 49 cents reads "$0", not a minus sign on nothing.
    expect(formatCents(-49)).toBe('$0')
    expect(formatCents(49)).toBe('$0')
  })

  it('the signed variant leads every non-negative figure with a plus', () => {
    expect(formatCentsSigned(123456)).toBe('+$1,235')
    expect(formatCentsSigned(-123456)).toBe('-$1,235')
    expect(formatCentsSigned(0)).toBe('+$0')
    expect(formatCentsSigned(-49)).toBe('+$0') // the same -0 edge, signed: rounds to zero, zero is '+'
  })
})

// =================================================================================================
// THE DRY GATE — the project idiom (cf. tests/design-tokens.test.ts): the fact worth protecting is
// not that the helper exists but that no component quietly grows its own copy again. Scope is the
// UI layer: src/components, src/App.vue, src/composables, src/stores.
//
// DELIBERATELY OUT OF SCOPE — src/engine (world.ts feed text builds money strings inline; those
// sentences are persisted inside saves and pinned by their own suites, so renaming their formatting
// would be a schema-adjacent change this wave must not make) and src/shared (money.ts itself lives
// there).
//
// VERIFIED-SAFE toLocaleString SITES the second regex is written around, checked at adoption:
//   TournamentFlow.vue  crowdFigure   — spectators count, no /100
//   KidScreen.vue       points total  — ranking points, no /100
//   MoreScreen.vue      date          — Date#toLocaleString, no /100
// None of them divides by 100, so the money idiom `100).toLocaleString` catches exactly the money
// copies and nothing else. If a fourth legitimate site ever needs `/ 100` near toLocaleString, the
// honest move is to route it through shared/money, not to widen this list.
// =================================================================================================

const SRC = fileURLToPath(new URL('../src/', import.meta.url))

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir).sort()) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(vue|ts)$/.test(entry)) out.push(p)
  }
  return out
}

const SCANNED: string[] = [
  ...walk(join(SRC, 'components')),
  join(SRC, 'App.vue'),
  ...walk(join(SRC, 'composables')),
  ...walk(join(SRC, 'stores')),
]

describe('the DRY gate — no component-local money formatter can come back', () => {
  it('no file declares formatDollars / formatSigned / formatFunds', () => {
    const offenders = SCANNED.filter((p) => /function format(Dollars|Signed|Funds)/.test(readFileSync(p, 'utf8')))
    expect(
      offenders.map((p) => p.slice(SRC.length)).join('\n'),
      'a local money formatter is back — import from src/shared/money instead',
    ).toBe('')
  })

  it('no file carries the money idiom `100).toLocaleString`', () => {
    // The idiom catches the arrow-function and inline copies the name regex cannot see (the shapes
    // OfferLetter.vue and InboxSheet.vue used to carry).
    const offenders = SCANNED.filter((p) => readFileSync(p, 'utf8').includes('100).toLocaleString'))
    expect(
      offenders.map((p) => p.slice(SRC.length)).join('\n'),
      'an inline cents-to-dollars format is back — import from src/shared/money instead',
    ).toBe('')
  })

  it('...and the scan is real — it sees the files and the callers', () => {
    // Vacuous-truth insurance, same as the token gate: if walk() breaks, the two gates above pass
    // by scanning nothing, which is the one way a gate fails open.
    expect(SCANNED.length).toBeGreaterThan(30)
    const importers = SCANNED.filter((p) => /from '[^']*shared\/money'/.test(readFileSync(p, 'utf8')))
    expect(importers.length, 'the converted call sites import the shared module').toBeGreaterThan(10)
  })
})

// =================================================================================================
// P6 (b) — MoneyScreen reads the ENGINE's starting budget, not a hand copy.
//
// The copy it replaced ({ wealthy: 120_000, middle: 25_000, working: 8_000 }, in DOLLARS) sat under
// a "must match src/engine/world.ts STARTING_FUNDS_CENTS" comment — the exact shape of drift this
// suite exists to make impossible: retune the engine and the Money screen silently lies.
// =================================================================================================

describe('MoneyScreen reads STARTING_FUNDS_CENTS from the engine', () => {
  const screen = readFileSync(join(SRC, 'components/screens/MoneyScreen.vue'), 'utf8')

  it('imports the engine constant and renders it through formatCents', () => {
    expect(screen).toContain('STARTING_FUNDS_CENTS')
    expect(screen).toMatch(/import \{[^}]*STARTING_FUNDS_CENTS[^}]*\} from '\.\.\/\.\.\/engine\/world'/)
    expect(screen).toContain('formatCents(STARTING_FUNDS_CENTS[')
  })

  it('the hand copy is gone — no STARTING_BUDGET, no 120_000 literal, no dollars-in formatter', () => {
    expect(screen).not.toContain('STARTING_BUDGET')
    expect(screen).not.toContain('120_000')
    expect(screen).not.toContain('formatDollars')
  })
})
