import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// SCREEN T - COACH MARKET. Facts about a template, which is exactly the kind of fact that silently
// rots (tests/round13-nav.test.ts states the house rule). Registration, the door and the copy rules
// are pinned next door in round13-nav; this file pins what the DESIGN specified - the three action
// states, the fit pills, the tier sections and the tokens they are drawn with - plus the one rule
// this screen must not break: it renders what the engine computed and derives no money of its own.
const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
const market = read('../src/components/screens/CoachMarketScreen.vue')
const css = read('../src/style.css')
const tokens = read('../docs/design/tokens.css')

describe('screen T renders what the design specified', () => {
  it('groups by TIER as a section, not a filter – the chips scroll to a group', () => {
    // Design §T.1: "тир - это раздел, а не фильтр"; the chip must not empty the list.
    expect(market).toContain('scrollToTier')
    expect(market).toContain('scrollIntoView')
    expect(market).toContain('tier-head')
    expect(market).toContain('tier-dot')
    expect(market).toContain('tier-range')
    // A section per rung, in the ladder's own order, and the parent's rung is not for sale.
    expect(market).toContain('HIREABLE_TIERS')
  })

  it('carries the three action states, and says the shortfall in MONEY', () => {
    // Design §T: доступен / текущий / не по бюджету. The last one shows "$20 over", never "expensive".
    expect(market).toContain('is-hire')
    expect(market).toContain('is-current')
    expect(market).toContain('is-over')
    expect(market).toContain('overBudgetCents')
    expect(market).toContain('formatDollars(r.overBudgetCents)')
    // ...and the over-budget row is dashed and dimmed rather than hidden.
    expect(css).toContain('.cm-row.blocked')
    expect(css).toMatch(/\.cm-row\.blocked\s*\{[^}]*border-style: dashed/)
  })

  it('leads each row with the FIT pill, in the design system\'s own colours', () => {
    // Design §T.3: the headline signal is fit, not a tag list.
    for (const cls of ['fit-great', 'fit-good', 'fit-off']) {
      expect(market).toContain(cls)
      expect(css).toContain(`.fit-pill.${cls}`)
    }
    // The tokens are the design system's export, by name and by value - not eyeballed hexes.
    for (const token of [
      '--tier-budget',
      '--tier-middle',
      '--tier-high',
      '--tier-elite',
      '--fit-great-bg',
      '--fit-good-bg',
      '--fit-off-border',
    ]) {
      expect(css, `${token} missing from style.css`).toContain(token)
      expect(tokens, `${token} missing from the design export`).toContain(token)
      // ...and the VALUE matches the export, which is the half that actually drifts.
      const val = (src: string) => src.match(new RegExp(`${token}:\\s*([^;]+);`))?.[1].trim()
      expect(val(css)).toBe(val(tokens))
    }
  })

  it('shows what a rung is worth, as a RANGE and never as a promise', () => {
    // The owner's ask, and the rule that goes with it: computed, a range, never a guarantee.
    expect(market).toContain('upliftPct')
    expect(market).toContain('formatUplift')
    expect(market).toMatch(/\+\$\{lo\.toFixed\(1\)\}-\$\{hi\.toFixed\(1\)\}% a season/)
    // No hand-written band anywhere the player can SEE - the numbers live in the engine or nowhere.
    // (The script's banner quotes the owner's own sketch; that is a comment, and the point of it is
    // to record that those figures were NOT copied into the code.)
    const template = market.slice(market.indexOf('<template>'))
    expect(template).not.toMatch(/0-2%|1-3%|2-4%/)
  })

  it('derives no money of its own – price, fit and affordability all arrive from the engine', () => {
    // The screen may format cents; it may not invent them. Anything that computes a bill here can
    // disagree with resolveBaseCosts, which is the one thing this split exists to prevent.
    expect(market).toContain('game.snapshot?.coachMarket')
    expect(market).not.toContain('coachWeeklyCents(')
    expect(market).not.toContain('coachRateBandCents')
    expect(market).not.toContain('wealthCorridor')
    // The one client-side computation is the style LENS, and it re-uses the engine's own rule.
    expect(market).toContain('styleFitBetween')
  })

  it('keeps the free rung reachable, always', () => {
    // A family that cannot pay has to be able to stop paying, so this is never behind affordability.
    expect(market).toContain('game.hireCoach(null)')
    expect(market).toContain('self-coach-row')
  })

  it('surfaces command failures the way every commanding screen does', () => {
    expect(market).toContain('<p v-if="game.error" class="error">')
  })
})

describe('screen T, round 3', () => {
  it('scopes every row class, so Home\'s coach card cannot leak geometry into it', () => {
    // ⚠ THE BUG THIS PINS WAS SHIPPED. The first cut named the row\'s text column `.coach-body`,
    // which ALREADY EXISTS as the Home coach card\'s text column carrying `margin-left: 54px` and
    // its own padding - so both rules matched every market row. A screen-scoped prefix makes the
    // collision impossible; this asserts the prefix is actually used rather than merely intended.
    const rowClasses = ['cm-row', 'cm-art', 'cm-body', 'cm-name', 'cm-meta', 'cm-price', 'cm-action']
    for (const cls of rowClasses) expect(market).toContain(cls)
    // The market template must not reference any of Home\'s coach-card classes.
    const template = market.slice(market.indexOf('<template>'))
    for (const owned of ['"coach-body"', '"coach-art"', '"coach-card"', '"coach-line"']) {
      expect(template, `${owned} belongs to Home's coach card`).not.toContain(owned)
    }
  })

  it('gives the portrait the full-bleed strip treatment, not a square avatar', () => {
    // The Home card\'s reasoning (A2c/d), applied here: sized by HEIGHT so the whole frame shows
    // with no vertical crop, and masked into the card so the card\'s own gradient shows through.
    expect(css).toMatch(/\.cm-art\s*\{[^}]*position: absolute/)
    expect(css).toMatch(/\.cm-art\s*\{[^}]*mask-image: linear-gradient/)
    expect(css).toMatch(/\.cm-art img\s*\{[^}]*height: 100%/)
    expect(css).toMatch(/\.cm-art img\s*\{[^}]*width: auto/)
    // ...and no fixed square is set on the image any more.
    expect(market).not.toContain('width="46"')
  })

  it('carries the training regulator, writing through with the planner\'s own command', () => {
    // The weekly bill is `rate x hours(plan)`, so the plan is half of every price on this screen.
    expect(market).toContain('game.setPlan(WEEK_PLAN_PRESETS[k])')
    expect(market).toContain('option-pill') // the planner's control, not a new idiom
    expect(market).toContain('coachHoursForPlan')
    // Prices come back from the ENGINE after the write - the screen must not reprice locally.
    expect(market).not.toContain('coachWeeklyCents(')
  })

  it('draws the back control bare, from the shared class', () => {
    expect(market).toContain('class="back-link"')
    expect(market).not.toContain('market-back')
    expect(css).toContain('.back-link {')
    // No plate: no background, no border, no padding.
    const rule = css.slice(css.indexOf('.back-link {'), css.indexOf('}', css.indexOf('.back-link {')))
    expect(rule).toMatch(/border: none/)
    expect(rule).toMatch(/background: none/)
    expect(rule).toMatch(/padding: 0/)
  })

  it('names a coach\'s game in the vocabulary the rest of the app uses', () => {
    // The first cut renamed the styles for this screen alone ("Defense", "Attacking"), so a
    // counterpuncher looking for a counterpuncher could not find one - the coach was there, the
    // WORD was not. One vocabulary: the same labels onboarding and the Kid screen use.
    expect(market).toContain("counterpuncher: 'Counterpuncher'")
    expect(market).not.toContain("'Defense'")
    expect(market).not.toContain('SPECIALISM_LABEL')
  })
})
