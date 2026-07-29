import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

// Screens J and K (docs/design/README.md §J/K) – the championship draw, and the Final as its own
// moment rather than a list of one. Source-shaped pins in the house style: they protect the
// DECISIONS, and in particular the two that a later pass would most easily undo.
const bracket = readFileSync(new URL('../src/components/BracketTabs.vue', import.meta.url), 'utf8')
const sheet = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')
const template = bracket.slice(bracket.indexOf('<template>'), bracket.indexOf('</template>'))

describe('screen J – the draw', () => {
  it('the round switcher is still U0\'s SegmentedRow (do not undo the port)', () => {
    expect(bracket).toContain("import SegmentedRow from './ui/SegmentedRow.vue'")
    expect(template).toContain('<SegmentedRow')
    expect(template).toContain('group-label="Draw rounds"')
    // Values, never indices – the adapter between a round number and the component's contract.
    expect(bracket).toContain('selectedSeg')
  })

  it('the scoreline is per-set COLUMNS, not one string on the right', () => {
    // That is the whole read of a draw sheet: you scan a column, not a sentence.
    expect(bracket).toContain('function splitScore')
    expect(bracket).toContain('const SET_COLS = 3')
    expect(template).toContain('bt-set')
    expect(template).not.toContain('bt-score')
  })

  it('a match with no scoreline shows BLANK columns, never dashes', () => {
    // AI-vs-AI matches are decided, never simulated ("kid-vs-anyone matches only" – protocol.ts),
    // so they have no games to show. A dash would claim "this set was not played", which is a
    // different and false statement; the empty column claims nothing.
    expect(bracket).toMatch(/const pad = score \? '–' : ''/)
  })

  it("the kid's match is found by her frame, and her name is not recoloured", () => {
    // Colour in a cell means RESULT (accent = won). Accenting her name too would make her lost
    // matches read as two winners – the reason the original chose weight over colour for her.
    expect(bracket).toContain('.bt-cell.is-kid')
    expect(bracket).toMatch(/\.bt-row\.kid \{\s*\n\s*font-weight: 700;/)
  })
})

describe('screen K – the Final', () => {
  it('is its own treatment, not a list of one', () => {
    expect(bracket).toContain('const isFinal = computed')
    expect(template).toContain('bt-final-cup')
    expect(template).toContain('bt-cell--final')
    expect(template).toContain('The Final')
  })

  it('the semifinal line is DERIVED from the round already in `matches`', () => {
    // No new field has to reach the snapshot for this line to exist: the semifinals are in the
    // same `matches` array, and each finalist's beaten opponent is a lookup, not data.
    expect(bracket).toContain('semifinalVictims')
    expect(bracket).toMatch(/m\.round === selected\.value - 1/)
    expect(template).toContain('Semifinals:')
  })

  it('THE FINAL stays a MUTED label (U0\'s ruling on the app\'s uppercase labels)', () => {
    // The export writes it in gold at a wider tracking; recolouring the app's muted labels is the
    // owner's call, not an extraction's – and the trophy above it carries the gold anyway.
    const rule = bracket.slice(bracket.indexOf('.bt-final-label {'))
    const body = rule.slice(0, rule.indexOf('}'))
    expect(body).toContain('color: var(--muted)')
    expect(body).toContain('font-size: var(--label-size)')
    expect(body).toContain('letter-spacing: var(--label-track)')
  })
})

describe('screens J/K – where the styles live', () => {
  it("the draw's rules left the shared sheet for the component's scoped block", () => {
    for (const dead of ['.bt-cell {', '.bt-row {', '.bt-scroll {', '.bt-players {']) {
      expect(sheet, `${dead} should be gone from the sheet`).not.toContain(dead)
    }
    expect(bracket).toContain('<style scoped>')
    expect(bracket).toContain('.bt-cell {')
    // `.tab-row`/`.tab-pill` are the OTHER kind – SegmentedRow's plate, six screens deep – and
    // they stay in the sheet. The draw reaches its pills through :deep, not by re-declaring them.
    expect(sheet).toContain('.tab-pill {')
    expect(bracket).toContain(':deep(.tab-pill)')
  })

  it('the draw declares no colour of its own', () => {
    const styles = bracket.slice(bracket.indexOf('<style scoped>')).replace(/\/\*[\s\S]*?\*\//g, '')
    expect(styles).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(styles).not.toMatch(/rgba?\(\s*\d/)
  })
})
