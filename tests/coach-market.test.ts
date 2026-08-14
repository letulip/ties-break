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
    // ⚠ RE-AIMED 01.08 (chore/w1-quick-wins): formatDollars died with the shared money module — the
    // fact protected is unchanged (the shortfall is shown in MONEY, off overBudgetCents); only the
    // formatter's name moved, to src/shared/money's formatCents.
    expect(market).toContain('formatCents(r.overBudgetCents)')
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

  // ⚠ THE ONE SANCTIONED EXCEPTION TO THE RULE ABOVE, pinned here rather than somewhere else so the
  // rule and its exception are read together. The Kid screen's copy of `counterpuncher` carries a
  // SOFT HYPHEN (U+00AD) - an invisible character that lets a 120px word wrap inside a 104px paper
  // scrap, at "Counter-" / "puncher" instead of mid-syllable (owner, 29.07: «может стоит перенос на
  // вторую строчку сделать?»). It is invisible, so the vocabulary has NOT drifted - and that is what
  // this asserts: strip the character and the two screens spell the same word. Without the pin the
  // next reader deletes a character they cannot see and the scrap silently clips again.
  it('the Kid screen\'s scrap wraps the long one WITHOUT leaving the vocabulary', () => {
    const kid = read('../src/components/screens/KidScreen.vue')
    const match = kid.match(/counterpuncher: '([^']+)'/)
    expect(match, 'the Kid screen still names her style').not.toBeNull()
    expect(match![1]).toContain('­')
    expect(match![1].replace(/­/g, '')).toBe('Counterpuncher')
    // ...and the CSS floor under it, for any label a soft hyphen was never added to
    expect(kid).toContain('overflow-wrap: break-word')
  })
})

describe('screen T, round 4', () => {
  it('⚠ the tournament-travel row is LOCKED, and it names the reason rather than a date', () => {
    // ⚠ RE-AIMED, AND THE FEATURE BEHIND IT WAS CANCELLED RATHER THAN CHANGED (owner, 30.07): «давай-ка мы
    // вообще эту механику пока до нормальных чеков и 18+ вообще не будем делать. Никто никуда не ездит.»
    //
    // It used to pin a live switch calling `setCoachOnEventWeeks` and a season price pair beside it. Two
    // measurement passes killed what the switch was for: the boolean cost +$21k at elite for +0.6 skill
    // points, a run-fatigue discount moved 2 condition points out of ~36, and a match-strength edge came
    // out NEGATIVE on rank at 30 seeds. Junior tennis has no prize money, so there is nothing for a fare to
    // be weighed against - the decision only exists on the adult tour.
    //
    // SO THE GUARDED FACT MOVED FROM "it is a working switch" TO "it is a locked row that names the reason".
    // Deleting the row would have lost the place the control belongs; a bare `disabled` would have earned
    // the "why can't I press this" the app has a standing rule against. The engine field is untouched - no
    // schema change, and every existing save keeps whatever it had.
    //
    // ⚠⚠ ROUND-20 #1 CORRECTED THIS TEST'S OWN CLAIM, AND THAT IS THE FINDING WORTH KEEPING. Its name was
    // "it says WHEN rather than just refusing", and it stayed green for two weeks while the WHEN was never
    // coming: the row read "It arrives with the professional years" and the owner reached them
    // («Coach travels не активно на про карьере»). Nothing can deliver that arrival - the `disabled` is a
    // literal and `game.setCoachOnEventWeeks` has no caller in src/ at all - so a row that names a date is
    // the defect and a row that names the REASON is the fix.
    //
    // ⚠ AND THE "IT PROMISES NOTHING" GUARD DELIBERATELY DOES NOT LIVE HERE, which is a second small
    // lesson from the same fix. Written as `expect(market).not.toMatch(/It arrives with/)` it went red
    // immediately - on the COMMENT in the template that quotes the old sentence in order to explain why
    // it went. A negative read off whole file TEXT cannot tell copy from a note about copy, and weakening
    // the regex to dodge one's own comment is how a guard turns into a coin flip. The claim belongs where
    // the words are rendered rather than merely present: tests/component/coach-travel-row.test.ts mounts
    // this screen on a real 14-year-old and a real 18-year-old career and holds BOTH sub-lines to the
    // same promise-free sentence. What stays here is structure, which is what a source pin is good for.
    expect(market).toContain('is-locked')
    expect(market).toContain('role="switch"')
    expect(market).toContain('disabled')
    // it explains itself, and in the app's own register
    expect(market).toMatch(/no prize money/)
    // and the dead switch is really dead: no handler, no live checked state
    expect(market).not.toContain('setCoachOnEventWeeks(')
    expect(market).not.toContain('billing.onEventWeeks')
    // the control itself still exists as a control - it is disabled, not deleted
    expect(css).toContain('.cm-switch')
    expect(css).toMatch(/prefers-reduced-motion[\s\S]{0,200}\.cm-switch/)
    // ⚠ AND THE PRICE PAIR WENT WITH IT, deliberately: "$X without him · $Y with" has nothing to compare
    // once there is no "with". Its three CSS rules were swept too (style.css, `.cm-travel-cost`).
    expect(market).not.toContain('seasonOffCents')
    // ⚠ THE LINE SURVIVES, THE COMPARISON DOES NOT. Deleting the season pair first took the weekly figure
    // with it, which was too much - "he costs $X a week" is true whatever she books, and is what the
    // regulator above is spending. What had to go is the `chosen` marker, which needs two sides.
    expect(market).toContain('a week at her current plan')
    expect(css).not.toMatch(/\.cm-travel-cost strong\.chosen/)
  })

  it('still reads its weekly cost from the ENGINE and derives nothing itself', () => {
    // The half of the old pricing test that survives the cancellation, and the more important half: the
    // screen formats cents, it never computes them.
    expect(market).toContain('game.snapshot?.coachBilling')
    expect(market).toContain('billing.weeklyCents')
    expect(market).not.toContain('seasonOffCents +')
    expect(market).not.toContain('* billing.eventWeeks')
  })

  it('signs the Home coach note in the export\'s own hand, and keeps that card money-free', () => {
    const home = read('../src/components/screens/HomeScreen.vue')
    expect(home).toContain('coach-sign')
    expect(home).toContain('formatShortName(currentCoach.value.name)')
    // Design §Home.3: «подпись "M. Ricci" - Caveat 17px rgba(207,225,82,.72)». Values to the digit,
    // with the alpha written against the token so the brand lime stays repairable in one place.
    // ⚠ RE-AIMED by U0: `.coach-sign` moved out of src/style.css into HomeScreen's own scoped
    // block, with the rest of the rules only that page renders. Values unchanged to the digit, and
    // the alpha is still written against `--accent-rgb` so the brand lime stays repairable in one
    // place – which is the fact this line is actually protecting.
    const homeCss = home.slice(home.indexOf('<style scoped>'))
    const rule = homeCss.slice(homeCss.indexOf('.coach-sign {'), homeCss.indexOf('}', homeCss.indexOf('.coach-sign {')))
    expect(rule).toContain('var(--font-hand)')
    expect(rule).toContain('font-size: 17px')
    expect(rule).toContain('rgba(var(--accent-rgb), 0.72)')
    // The card is a door and a card, not a form: no price, and the signature is a NAME.
    const region = home.slice(home.indexOf('coach-card'), home.indexOf('Recent memory'))
    expect(region).not.toContain('$')
    // ...and it only signs when there is somebody to sign it.
    expect(home).toContain('v-if="coachSignature"')
  })

  it('shows HER coach on the Home note, so the face and the signature are one person', () => {
    const home = read('../src/components/screens/HomeScreen.vue')
    expect(home).toContain('coachPortraitUrl(currentCoach.value.id)')
    expect(home).toContain('coachUrlFor') // the self-coached fallback survives
  })
})
