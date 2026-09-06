// ⭐⭐⭐ THE ACCESSIBILITY PASS – axe over every screen, and the keyboard over the overlays that BLOCK.
//
// T-09 (docs/review-principles-2026-09-05/06-tests-tooling.md): «real-browser accessibility is
// presence-only: no axe pass, no keyboard/focus-trap pass over the overlays D1 lists as still
// roleless». The owner's ask, in his words: «добавь пожалуйста, у нас приложение растет, нам нужна
// вся возможная уверенность в функционале.»
//
// -------------------------------------------------------------------------------------------------
// WHAT IS HERE, AND WHY IT IS TWO CLAIMS AND NOT ONE
// -------------------------------------------------------------------------------------------------
//  1. THE SCAN. axe-core, WCAG 2 A and AA, over every screen at 375 and at 1280, and over the
//     overlays. It answers «is what is on screen USABLE», which `parity.spec.ts` explicitly cannot –
//     its fingerprint reads the accessibility tree, so a control with a 2.9:1 label is in it.
//  2. THE KEYBOARD, on the overlays only. axe cannot press a key: a focus trap, a returned focus and
//     an Escape policy are behaviours, and a rule engine looking at one DOM snapshot sees none of
//     them. This half needs NO dependency and runs today.
//
// ⚠⚠ AND (2) IS WHERE THIS PROJECT HAS ALREADY SHIPPED A CAREER-STOPPING DEFECT. Round 20 #3:
// `TourBriefingDialog` grew past a 375x667 viewport and took its own dismiss control off screen –
// a BLOCKING overlay, so the owner's career stopped there and could not be resumed. The lesson
// CLAUDE.md drew is about height; the other half of it is that a blocking card is the one place in
// this app where being unable to act is being unable to play. `advanceRefusal`
// (`src/engine/world/multiWeek.ts`) names the seven states that block, and every overlay below that
// raises one carries its reason in the map, so «which of the blocking ones is covered» is a
// readable fact rather than a count.
//
// -------------------------------------------------------------------------------------------------
// ⚠ WHAT THIS CANNOT PROVE, because a harness that overstates itself is worse than none
// -------------------------------------------------------------------------------------------------
//   * AXE IS NOT A PERSON. Deque's own figure is that automation finds roughly a third to a half of
//     WCAG issues. A green run here means «no MACHINE-DETECTABLE A/AA failure on the states walked».
//     It says nothing about whether a label makes sense, an order is logical, or a name is a lie.
//   * IT SEES THE STATES THE STATIONS WALK. Same limit `parity.spec.ts` writes out for itself: one
//     career, one route per screen. A branch nobody walks is unscanned.
//   * THE RULE SET IS THE NARROW ONE ON PURPOSE – see `RULE_TAGS` in e2e/axe.ts for the argument
//     against turning on `best-practice` and `wcag22aa` before this one is at zero debt.
//   * ⚠ AND THE SCAN HALF SKIPS UNTIL ONE COMMAND IS RUN: `npm i -D @axe-core/playwright`. The full
//     reason is in e2e/axe.ts's header – short version, adding it to package.json alone would break
//     `npm ci` and take the whole CI e2e job down with it.
//
// -------------------------------------------------------------------------------------------------
// ⚠⚠ AND THE BASELINE IS DEBT, NOT A DECISION
// -------------------------------------------------------------------------------------------------
// `e2e/a11y-baseline.json` carries the violations that were already there the day this landed, one
// entry per RULE per SURFACE, each with a written reason. There is no blanket disable and no
// rule turned off globally – a rule that fires on a surface with no entry fails BY NAME, with the
// offending elements. «A suite that starts red and gets an allowlist on day one teaches everyone to
// ignore it», so the entries are few, specific, and each says what closing it would take.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Locator, Page } from '@playwright/test'
import { test, expect } from './careerAt'
import type { FixtureName } from '../tools/e2e-fixtures-read'
import { STATIONS, SCREENS_ON_DISK, park, navTab } from './stations'
import { answerOpeningKnock, dismissTourBriefing } from './journey'
import { AXE_ABSENT_REASON, axeBuilder, loadBaseline, scan, unbaselinedFailures } from './axe'

// ⚠ THE SAME HEIGHT AS `parity.spec.ts` USES, and the two narrow widths of its four. 375 is the
// owner's phone and the narrowest the app supports; 1280 is past the 1200 cap, so the column is
// capped and centred and the desktop rail is drawn. The two middle widths are parity's question
// (does a control survive the band?), not this one (is what is drawn usable?), and scanning four
// widths would double a CI cost for a rule engine that would say the same thing twice.
const WIDTHS = [375, 1280] as const
const VIEWPORT_HEIGHT = 900

const baseline = loadBaseline()

/** `HomeScreen.vue@375` – the key the baseline is written against, and it carries the width because
 *  a contrast failure can be real at one width and absent at another (a hidden element has no
 *  contrast). A surface that fires at both widths therefore needs two entries, on purpose. */
function surfaceKey(name: string, width: number): string {
  return `${name}@${width}`
}

// =================================================================================================
// 1 – EVERY SCREEN, AT 375 AND AT 1280
// =================================================================================================

test.describe('axe – every screen the app has, at 375 and 1280', () => {
  test('every screen in src/components/screens/ is scanned', () => {
    // ⚠ MECHANISM 1 OF `parity.spec.ts`'s THREE, RESTATED HERE RATHER THAN BORROWED. The station map
    // is shared (e2e/stations.ts) and parity holds it against the filesystem too – but the lane's
    // own finding about this estate is that a guard which leans on another file's guard is one file
    // away from guarding nothing, and a reader runs one spec at a time. A screen added with no
    // station fails HERE, by filename, saying that the a11y pass never saw it.
    expect(
      Object.keys(STATIONS).sort(),
      'a screen exists that this pass never scans. Give it a station in e2e/stations.ts – the door ' +
        'a player uses, and an anchor that proves the walk arrived.',
    ).toEqual(SCREENS_ON_DISK)
  })

  for (const [screen, station] of Object.entries(STATIONS)) {
    test(`${screen} has no unbaselined WCAG 2 A/AA violation`, async ({ page, careerAt }) => {
      test.skip((await axeBuilder()) === null, AXE_ABSENT_REASON)

      await page.setViewportSize({ width: WIDTHS[0], height: VIEWPORT_HEIGHT })
      await careerAt(station.career ?? 'pro')
      // Doorways, not assertions – journey.ts argues both at length. Nothing is scanned until they
      // are through, because a career that woke up holding a knock would otherwise be scanned with
      // a modal over every screen and every screen would report the modal's debt.
      await answerOpeningKnock(page)
      await dismissTourBriefing(page)

      const problems: string[] = []
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: VIEWPORT_HEIGHT })
        await (station.park ?? park)(page)
        await station.visit(page)
        // ⚠ ARRIVAL BEFORE MEASUREMENT, ALWAYS – mechanism 2, and it matters more here than it does
        // for a fingerprint: axe on the WRONG screen returns a real-looking result. An empty
        // fingerprint at least looks empty.
        await expect(
          station.arrived(page),
          `${screen} at ${width}px – the walk did not arrive, so there is nothing to scan`,
        ).toBeVisible()

        const surface = surfaceKey(screen, width)
        const result = await scan(page, surface)
        problems.push(...unbaselinedFailures(result, baseline).map((p) => `  ${surface}: ${p}`))
      }

      expect(problems.join('\n'), `${screen} – WCAG 2 A/AA`).toBe('')
    })
  }
})

// =================================================================================================
// 2 – THE OVERLAYS, AND THE BLOCKING ONES FIRST
// =================================================================================================
//
// ⚠ THIS MAP IS HAND-WRITTEN AND SAYS SO, exactly like `parity.spec.ts`'s `ROOMS`. There is no
// directory of overlays to derive from – they are components raised by world states – so what keeps
// it honest is the same three things: a career that really reaches the state, an anchor asserted
// before anything is measured, and `the blocking overlays this pass cannot reach are NAMED` below,
// which turns the gap into a readable list instead of a silence.
//
// ⚠⚠ AND THE ESCAPE POLICY IS PER DIALOG, DELIBERATELY, so this map transcribes it rather than
// imposing one. The app argues it in each file: the knock takes no Escape because «every way out of
// this card is an answer» and a dismissable blocking decision is a notification; the confirm takes
// Escape because it maps to Cancel, which commits nothing; the briefing takes none because an
// Escape pressed at something else would silently spend the one showing of the tour's rules. A
// uniform expectation here would be this suite legislating product behaviour, and it would have
// shipped a dead key on the retirement card (`RetirementDialog.vue:154-156` says so).

interface Overlay {
  /** ⚠ WHICH CAREER RAISES IT, and it is per overlay because the fixtures differ – see `arrived`. */
  career: FixtureName
  /** Raise it, starting from a freshly seeded career sitting on Home. */
  raise: (page: Page) => Promise<void>
  /**
   * ⚠⚠ PROOF THAT THIS OVERLAY IS THE ONE ON SCREEN, and it is not decoration. The first draft of
   * this map used `getByRole('dialog').first()` as both the anchor AND the card, and it PASSED
   * while scanning the wrong dialog twice: `pro` does not boot holding a knock, it boots holding
   * the tour briefing, so «KnockDialog» was a green tick over the briefing's DOM. That is
   * `parity.spec.ts`'s mechanism 2 exactly – «a walk that landed on the wrong screen would
   * fingerprint that one and report perfect parity about a screen it never visited» – and it took
   * a probe of the four committed fixtures to find. Role and name, never a class.
   */
  arrived: (page: Page) => Locator
  /** The card itself – never the scrim, which is not part of the dialog. */
  card: (page: Page) => Locator
  /** The place the scan is scoped to. ⚠ The app behind an overlay is not `inert`
   *  (`dialogFocus.ts` says so), so a full-page scan would re-report the screen's debt as the
   *  dialog's. */
  region: string
  /** Which `advanceRefusal` reason this overlay is the face of, or `null` when it blocks nothing. */
  blocks: string | null
  /** Does Escape close it? Transcribed from the component's own argument, per the note above. */
  escapeCloses: boolean
  /** The control that answers it – how the card is closed when Escape is not a way out. */
  dismiss: (page: Page) => Locator
}

const OVERLAYS: Record<string, Overlay> = {
  // ⭐ THE KNOCK – the blocking overlay this app's whole «просто скипались» complaint produced, and
  // `advanceRefusal`'s third clause: «no tick at all until `decideKnock` runs». Raising it is simply
  // not answering it.
  //
  // ⚠ `junior` AND NOT `pro`, MEASURED RATHER THAN ASSUMED. journey.ts says «both `junior` and `pro`
  // boot with an open knock»; probed on 06.09 against the committed fixture set, `junior` boots the
  // knock («Her foot.») and `pro` boots the TOUR BRIEFING instead. journey.ts's own note explains
  // why that is allowed to drift – the generator «has never been asked to hold a knock», so which
  // career holds one is a property of where the seed search stopped – and week-advance.spec.ts is
  // the canary for it. This map names the career that actually holds the state it claims.
  KnockDialog: {
    career: 'junior',
    raise: async () => {
      // it is already up – `junior` boots holding it
    },
    // Its two answers, which are its contract: «there is no third button and no way out that is not
    // a choice». A heading would be the body part, which is the fixture's, not the dialog's.
    arrived: (page) => page.getByRole('button', { name: /^Rest it/ }),
    card: (page) => page.getByRole('dialog').first(),
    region: '[role="dialog"]',
    blocks: 'knock',
    escapeCloses: false,
    dismiss: (page) => page.getByRole('button', { name: /^Rest it/ }),
  },

  // ⭐⭐ THE TOUR BRIEFING – the card that shipped the career-stopping defect of round 20 #3, and the
  // reason CLAUDE.md's «a popup must be measured against a phone before it ships» exists. It fires
  // on the boot of any career already inside the top 50, which `pro` is (world #15).
  TourBriefingDialog: {
    career: 'pro',
    raise: async () => {
      // also already up – see `arrived`
    },
    arrived: (page) => page.getByRole('heading', { name: 'The commitment rules now apply.' }),
    card: (page) => page.getByRole('dialog').first(),
    region: '[role="dialog"]',
    blocks: null,
    escapeCloses: false,
    dismiss: (page) => page.getByRole('button', { name: 'Continue', exact: true }),
  },

  // ⭐ THE CONFIRM – the shape behind every irreversible press in the app (an entry, a withdrawal,
  // a delete, a signature). Raised the way a player raises it: an entry from the Season strip.
  ConfirmDialog: {
    career: 'pro',
    raise: async (page) => {
      await answerOpeningKnock(page)
      await dismissTourBriefing(page)
      await navTab(page, 'Season')
      await expect(page.getByRole('heading', { name: 'Season Planner' })).toBeVisible()
      await page.getByRole('button', { name: /^Enter the / }).first().click()
    },
    // `ENTER_CONFIRM_NAME`'s three verbs, and journey.ts argues why the set is closed: none of them
    // is a whole accessible name anywhere else on Season.
    arrived: (page) => page.getByRole('button', { name: /^(Enter|Enter anyway|Push through)$/ }),
    card: (page) => page.getByRole('dialog').first(),
    region: '[role="dialog"]',
    blocks: null,
    // `ConfirmDialog.vue:26-29`: Escape maps to Cancel, which commits nothing, «so there is one way
    // out and not two».
    escapeCloses: true,
    dismiss: (page) => page.getByRole('button', { name: 'Cancel', exact: true }),
  },
}

test.describe('axe – the overlays, including the ones that block', () => {
  for (const [name, overlay] of Object.entries(OVERLAYS)) {
    test(`${name} has no unbaselined WCAG 2 A/AA violation`, async ({ page, careerAt }) => {
      test.skip((await axeBuilder()) === null, AXE_ABSENT_REASON)

      await page.setViewportSize({ width: WIDTHS[0], height: VIEWPORT_HEIGHT })
      await careerAt(overlay.career)
      await overlay.raise(page)
      // ⚠ ARRIVAL BEFORE MEASUREMENT – and this one caught a real defect in this file, see `arrived`.
      await expect(overlay.arrived(page), `${name} – this overlay is not the one on screen`).toBeVisible()
      await expect(overlay.card(page), `${name} – the overlay was not raised`).toBeVisible()

      const surface = surfaceKey(name, WIDTHS[0])
      const result = await scan(page, surface, { include: overlay.region })
      expect(unbaselinedFailures(result, baseline).join('\n'), `${name} – WCAG 2 A/AA`).toBe('')
    })
  }
})

// =================================================================================================
// 3 – THE KEYBOARD, WHICH AXE CANNOT PRESS
// =================================================================================================

test.describe('the overlays hold the keyboard', () => {
  for (const [name, overlay] of Object.entries(OVERLAYS)) {
    test(`${name}: focus lands inside, Tab stays inside, and the way out is the documented one`, async ({
      page,
      careerAt,
    }) => {
      await page.setViewportSize({ width: WIDTHS[0], height: VIEWPORT_HEIGHT })
      await careerAt(overlay.career)
      await overlay.raise(page)
      await expect(overlay.arrived(page), `${name} – this overlay is not the one on screen`).toBeVisible()
      const card = overlay.card(page)
      await expect(card, `${name} – the overlay was not raised`).toBeVisible()

      // 1. FOCUS IS INSIDE. `dialogFocus.ts` moves it to the first control, or to the card itself.
      //    Asked as containment rather than "which element", because which one is the composable's
      //    business and a test that pinned it would break on a re-ordered card.
      await expect(
        card.locator(':focus'),
        `${name}: nothing inside the card has focus, so the keyboard is still on the page behind it`,
      ).toHaveCount(1)

      // 2. TAB STAYS INSIDE. Ten presses is past the control count of every card here, so a trap
      //    that leaks would have leaked; a fixed number rather than a loop over the controls because
      //    the leak this catches is precisely a miscount of them.
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab')
        await expect(
          card.locator(':focus'),
          `${name}: Tab press ${i + 1} left the card – the keyboard is behind a modal it cannot see`,
        ).toHaveCount(1)
      }
      // ...and backwards, which is the half a forward-only trap passes.
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('Shift+Tab')
        await expect(
          card.locator(':focus'),
          `${name}: Shift+Tab press ${i + 1} left the card`,
        ).toHaveCount(1)
      }

      // 3. ESCAPE DOES WHAT THIS CARD SAYS IT DOES – see the map's own note. Both arms are asserted:
      //    a card that must not close on Escape is checked for still being there, which is the arm
      //    that catches somebody "tidying up" the policy into a uniform one.
      await page.keyboard.press('Escape')
      if (overlay.escapeCloses) {
        await expect(card, `${name}: Escape is documented to close this card and it did not`).toHaveCount(0)
      } else {
        await expect(
          card,
          `${name}: Escape closed a card whose every way out is meant to be an answer. ` +
            'See the component\'s own note before changing this expectation – it is a product ruling.',
        ).toBeVisible()
        await overlay.dismiss(page).click()
        await expect(card, `${name}: the documented control did not close the card`).toHaveCount(0)
      }
    })
  }

  test('a confirm returns focus to the control that opened it', async ({ page, careerAt }) => {
    // ⚠ ONE OVERLAY AND NOT ALL THREE, BECAUSE ONLY ONE HAS AN OPENER. The knock and the briefing
    // are raised by the WORLD on boot – there is no control to go back to, and `dialogFocus.ts`'s
    // third promise is "puts focus back where it came from", which is vacuous when it came from
    // nowhere. The confirm is opened by a press, so the promise is testable, and a broken restore
    // strands the keyboard at the top of the document after every irreversible decision.
    await page.setViewportSize({ width: WIDTHS[0], height: VIEWPORT_HEIGHT })
    await careerAt('pro')
    await answerOpeningKnock(page)
    await dismissTourBriefing(page)
    await navTab(page, 'Season')
    await expect(page.getByRole('heading', { name: 'Season Planner' })).toBeVisible()

    const opener = page.getByRole('button', { name: /^Enter the / }).first()
    const openerName = await opener.textContent()
    await opener.click()
    const card = page.getByRole('dialog').first()
    await expect(card).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(card).toHaveCount(0)

    const focused = await page.evaluate(() => document.activeElement?.textContent ?? null)
    expect(
      focused,
      'focus did not come back to the control that opened the confirm, so a keyboard user is ' +
        'returned to the top of the document after every entry.',
    ).toBe(openerName)
  })
})

// =================================================================================================
// 4 – THE TWO GUARDS THAT STOP THIS FILE ROTTING
// =================================================================================================

test.describe('the pass cannot quietly stop asking', () => {
  test('the blocking overlays this pass cannot reach are NAMED, not silently missing', () => {
    // ⚠⚠ THE GAP AS A LIST RATHER THAN AS A SILENCE. `advanceRefusal` names seven states that
    // refuse the advance with ZERO ticks – each is a card the player must answer before the world
    // moves, and each is therefore a place a keyboard user can be stranded mid-career. This pass
    // reaches ONE of them from the committed fixtures. That is a real gap, so it is written down
    // and asserted, which means the day somebody reaches another one this test says so and the day
    // the engine adds an eighth reason it says that too.
    //
    // ⚠ THE LIST IS TRANSCRIBED, NOT IMPORTED. `src/engine/world/multiWeek.ts` reaches the engine,
    // and tsconfig.e2e.json's own header forbids that: «what must never be listed is anything that
    // reaches the engine – that would type-check ~200 modules a second time … and Playwright would
    // load every one of them in every worker». So the closed set is copied here the way journey.ts
    // copies `WEEK_ACTION_NAME`, and a wave that adds a reason updates this line, deliberately.
    const ADVANCE_REFUSALS = [
      'ending',
      'tournament',
      'knock',
      'birthday',
      'fork',
      'retirement',
      'shoot-clash',
    ]
    const covered = Object.values(OVERLAYS)
      .map((o) => o.blocks)
      .filter((r): r is string => r !== null)
    const uncovered = ADVANCE_REFUSALS.filter((r) => !covered.includes(r))
    expect(
      uncovered,
      'the blocking states no overlay above reaches. Each needs a career that holds it: the ' +
        'committed fixtures reach the knock on boot and nothing else, so the rest need a fixture ' +
        'or an engineered walk. This is the gap, stated – shrink it, do not edit it.',
    ).toEqual(['ending', 'tournament', 'birthday', 'fork', 'retirement', 'shoot-clash'])

    // ⚠ AND THE SOURCE OF THAT LIST HAS TO STILL BE SEVEN. A reason added to the engine with no row
    // here would otherwise pass silently: the expectation above would still hold, because a longer
    // ADVANCE_REFUSALS with the same six uncovered is arithmetically identical.
    expect(
      ADVANCE_REFUSALS.length,
      'src/engine/world/multiWeek.ts has a different number of advance refusals than this file ' +
        'transcribes. Re-read `ADVANCE_REFUSALS` there and update both this list and the gap above.',
    ).toBe(readFileSync(fileURLToPath(new URL('../src/engine/world/multiWeek.ts', import.meta.url)), 'utf8')
      .match(/export const ADVANCE_REFUSALS: readonly StopReason\[\] = \[([^\]]*)\]/)![1]!
      .split(',').length)
  })

  // ⚠⚠ THE OTHER HALF OF THE RATCHET – «no baseline entry is guarding nothing» – IS NOT A TEST HERE,
  // AND THAT IS A CORRECTION RATHER THAN A CHOICE. It was written as one, and it was RACY: it reads
  // the run's own findings log (`test-results/a11y-findings.jsonl`, appended by `scan()`), and
  // `playwright.config.ts` sets `fullyParallel: true`, so the tests in this file are split across
  // workers and a test that reads what the others wrote sees whatever has landed so far. Caught by
  // mutating `--ink-dim` to its fixed value: the check fired, and named TWO of the four entries it
  // should have named, because the other worker had not flushed yet. A guard that is right most of
  // the time is the worst kind here – it would have been believed.
  //
  // ⭐ SO IT LIVES IN `scripts/e2e.mjs`, AFTER THE WHOLE SUITE, where the log is complete by
  // construction and the run's own exit status is known. That file already owns this suite's
  // preconditions (the browser binary, the two ports, the axe dependency); a post-condition over the
  // artefacts one run produced is the same job pointing the other way. It runs only on a GREEN,
  // UNFILTERED run, because a `-g` subset legitimately scans a subset and would report every
  // unvisited surface's entry as stale.
})
