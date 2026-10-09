// THE EIGHT ROUTES OF RU-14's ACCEPTANCE MATRIX, AS FAR AS A MACHINE CAN WALK THEM (L4-3).
//
// docs/localization/ru-lqa-handoff-2026-10.md carries the matrix the owner will read by hand once a Russian build exists. This file
// drives each row of it under `tb-locale=ru` against the real production build (with the LQA hook compiled in) and, after every
// screen, reads the miss counter: how many keys rendered in English, which. The product is `lqa-ru-report.md/.json`
// (tools/lqa-ru.ts); the verdict per route is `driven` (every planned screen was visited), `partial` (it stopped, and the report
// says where and why) or `gap` (nothing automatable – and why). See kit.ts for why the walk addresses nothing by its English name.
//
// WHAT NO MACHINE CAN DO, said once and repeated in each route's verdict: read whether Russian FITS and SOUNDS right (that is his
// reading), VoiceOver / TalkBack, a real phone. The routes below measure what is rendered and where English is still leaking.
import { clearBlockingCards, expect, test, bootCareer, hookReady, nameOf, ruCareer, tabButton, DOOR, RU, TOUR_ANSWERED, type Recorder, type TabId } from './kit'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'
import type { FixtureName } from '../../tools/e2e-fixtures-read'

// -------------------------------------------------------------------------------------------------
// shared walks
// -------------------------------------------------------------------------------------------------

const homeTab = (page: Page) => tabButton(page, 'home')

async function goHome(page: Page): Promise<void> {
  await homeTab(page).click()
  await expect(homeTab(page)).toHaveAttribute('aria-current', 'page')
}

/** Put the page back on Home after a failed step: close what is open, then the tab bar. */
function recoverTo(page: Page): () => Promise<void> {
  return async () => {
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    await goHome(page)
  }
}

async function tabVisit(rec: Recorder, id: TabId, label: string): Promise<void> {
  await rec.step(label, async () => {
    await tabButton(rec.page, id).click()
    await expect(tabButton(rec.page, id)).toHaveAttribute('aria-current', 'page')
    await rec.visit(label)
  })
}

/** Home → a tabless screen through its door. The arrival anchor is a settle aid that follows the catalog; if it is not found the screen is
 *  STILL READ (the counter is the product) and the route says the anchor was missing. */
async function doorVisit(rec: Recorder, label: string, open: () => Promise<void>, anchor: () => ReturnType<Page['locator']>): Promise<void> {
  await rec.step(label, async () => {
    await goHome(rec.page)
    await open()
    const arrived = await anchor().first().waitFor({ state: 'visible', timeout: 6_000 }).then(() => true, () => false)
    if (!arrived) rec.note(`«${label}»: the arrival anchor (a heading that follows the catalog) was not found – the screen was read anyway`)
    await rec.visit(label, { anchorFound: arrived })
  })
}

/** Home as a fresh mount: the boot render belongs to the boot visit, so go through Trophies, clear, and come back. */
async function freshHome(rec: Recorder): Promise<void> {
  const { page } = rec
  await rec.step('Home', async () => {
    await tabButton(page, 'trophies').click()
    await expect(tabButton(page, 'trophies')).toHaveAttribute('aria-current', 'page')
    await rec.clear()
    await goHome(page)
    await rec.visit('Home')
  })
}

/**
 * THE SHELL WALK: Home, the five tabs, the five doors, More's tabs. Used by the school/junior route, the adult tour, and the two phone
 * widths (route 7) – the same screens, so a phone number is comparable with a desktop number.
 */
async function shellWalk(rec: Recorder, opts: { more?: boolean } = {}): Promise<void> {
  const { page } = rec
  rec.recover = recoverTo(page)
  await freshHome(rec)
  await tabVisit(rec, 'play', 'Season')
  await tabVisit(rec, 'calendar', 'Calendar')
  await tabVisit(rec, 'stats', 'Stats')
  await tabVisit(rec, 'trophies', 'Trophies')
  await doorVisit(rec, 'Family budget (Money)', () => page.locator(DOOR.budget).click(), () => page.getByRole('heading', { name: nameOf('Family Budget') }))
  await doorVisit(rec, 'Her profile (Kid)', () => page.locator(DOOR.kid).first().click(), () => page.getByRole('heading', { name: nameOf('Important moments'), level: 3 }))
  await doorVisit(rec, 'This week (next tournament)', () => page.locator(DOOR.tournament).click(), () => page.getByRole('heading', { name: nameOf('This week'), level: 2 }))
  await doorVisit(
    rec,
    'Coach Market',
    () => page.getByRole('button', { name: nameOf('Coach note – open the Coach Market') }).click(),
    () => page.getByRole('heading', { name: nameOf('Coach Market'), level: 2 }),
  )
  await doorVisit(rec, 'Album (recent memory)', () => page.getByRole('button', { name: nameOf('Recent memory', 'prefix') }).click(), () => page.getByRole('button', { name: nameOf('Next sheet') }))
  await doorVisit(rec, 'More (settings)', () => page.locator(DOOR.settings).click(), () => page.getByRole('group', { name: nameOf('Which settings') }))
  if (opts.more !== false) await moreTabs(rec)
  await rec.step('back to Home', () => goHome(page))
}

/** Every tab of More, in the order the group lists them – by position, because the tab names are what is under test. */
async function moreTabs(rec: Recorder): Promise<void> {
  const { page } = rec
  const group = page.getByRole('group', { name: nameOf('Which settings') })
  const count = await group.getByRole('button').count().catch(() => 0)
  rec.note(`More lists ${count} tab(s); the first is the one the screen opens on (read by the door visit above)`)
  for (let i = 1; i < count; i++) {
    await rec.step(`More › tab ${i + 1}`, async () => {
      await group.getByRole('button').nth(i).click()
      await rec.visit(`More › tab ${i + 1}`)
    })
  }
}

// -------------------------------------------------------------------------------------------------
// route 1 – new career, ages 5 to 13
// -------------------------------------------------------------------------------------------------

/** What changes when the prologue moves on: the card's heading, the way-on/skip state. Selections inside a card do not count. */
async function prologueSignature(page: Page): Promise<string> {
  return page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]')
    const heading = dialog?.querySelector('[role="heading"], h1, h2, h3')?.textContent ?? ''
    const answers = dialog?.querySelectorAll('.prologue-answers button').length ?? 0
    return `${heading}|${answers}|${document.querySelector('.plo-skip') ? 'takeover' : ''}|${dialog?.querySelector('svg.radar-svg') ? 'handover' : ''}`
  })
}

async function walkPrologue(rec: Recorder): Promise<{ cards: number; weekends: number; handover: boolean }> {
  const { page } = rec
  let cards = 0
  let weekends = 0
  let handover = false
  const dialog = page.getByRole('dialog')
  // Who she is: the age-5 card asks for a name. Input, not copy – a Latin placeholder no screen contains until typed.
  const first = dialog.locator('#prologue-first')
  if (await first.count()) await first.fill('Zenobia')
  for (let guard = 0; guard < 90 && !handover; guard++) {
    const before = await prologueSignature(page)
    if (before.includes('handover')) {
      handover = true
      break
    }
    if (before.includes('takeover')) {
      weekends += 1
      await rec.visit(`prologue › weekend takeover ${weekends}`)
      await page.locator('.plo-skip').click()
    } else if (await dialog.locator('.prologue-proceed').count()) {
      await dialog.locator('.prologue-proceed').click()
    } else {
      const groups = dialog.getByRole('radiogroup')
      const groupCount = await groups.count()
      let answered = false
      for (let g = 0; g < groupCount; g++) {
        const group = groups.nth(g)
        if ((await group.locator('[role="radio"][aria-checked="true"]').count()) > 0) continue
        const radios = group.getByRole('radio')
        // The first group is the year's own decision (take the second road); a later one is the tournament question (say yes).
        await radios.nth(g === 0 && (await radios.count()) > 1 ? 1 : 0).click()
        answered = true
        break
      }
      if (!answered) {
        const way = dialog.locator('.prologue-answers button')
        if ((await way.count()) === 0) {
          // No answers column: either the handover (its own component, two plain buttons) or a screen still waiting on the worker's answer.
          await expect.poll(async () => (await dialog.getByRole('button').count()) + (await dialog.locator('svg.radar-svg').count()), { timeout: 12_000, message: 'a prologue screen with no control to press' }).toBeGreaterThan(0)
          handover = true
          break
        }
        await way.nth(0).click()
      }
    }
    // A pure selection leaves the signature as it was; only a new card, a takeover or the handover is a new screen.
    const after = await expect.poll(() => prologueSignature(page), { timeout: 12_000 }).not.toBe(before).then(() => prologueSignature(page), () => before)
    if (after !== before && after.split('|')[0] !== before.split('|')[0] && !after.includes('takeover') && !after.includes('handover')) {
      cards += 1
      await rec.visit(`prologue › card ${cards + 1}`)
    }
  }
  return { cards, weekends, handover }
}

test('route 1 – a new career, 5 to 13: splash, the childhood, the handover, the first Home', async ({ page, lqa }) => {
  const rec = lqa(1, 'a', 'New career, 5 to 13 (prologue)')
  await page.goto('/')
  await hookReady(page)
  await rec.visit('splash')
  rec.recover = async () => undefined
  await page.getByRole('button', { name: nameOf('Tap to start') }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await rec.visit('prologue › card 1 (who she is)')
  let walked: { cards: number; weekends: number; handover: boolean } | null = null
  await rec.step('the nine cards', async () => {
    walked = await walkPrologue(rec)
    rec.note(`walked ${walked.cards} screens of the prologue, ${walked.weekends} weekend takeover(s), handover reached: ${walked.handover}`)
    if (!walked.handover) throw new Error('the prologue never reached its handover')
  })
  await rec.step('the handover', async () => {
    await rec.visit('prologue › handover')
    // The first control goes on with her (prologue.spec.ts: the other drops the career).
    await page.getByRole('dialog').getByRole('button').first().click()
    await expect(tabButton(page, 'home')).toBeVisible()
    await rec.visit('first Home (week 1)')
  })
  if (rec.verdict === 'driven') rec.why = 'splash, the prologue cards and takeovers, the handover and the first Home'
  rec.note('the prologue is the default path; the six-step wizard (the way out of card 1) is route 1 part b')
})

test('route 1b – the wizard (the way out of the first card)', async ({ page, lqa }) => {
  const rec = lqa(1, 'b', 'New career – the six-step wizard')
  await page.goto('/')
  await hookReady(page)
  await page.getByRole('button', { name: nameOf('Tap to start') }).click()
  const card = page.getByRole('dialog')
  await expect(card.getByRole('heading')).toBeVisible()
  await rec.clear()
  rec.recover = async () => undefined
  await rec.step('the way out of card 1', async () => {
    await card.getByRole('button').last().click()
    await expect(page.locator('.ob-cta').first()).toBeVisible()
    await rec.visit('wizard › step 1')
  })
  for (let step = 2; step <= 6; step++) {
    const ok = await rec.step(`wizard › step ${step}`, async () => {
      const cta = page.locator('.ob-cta').first()
      // Step 3 is the one that needs a country before Next enables (e2e/smoke.spec.ts).
      if (!(await cta.isEnabled())) await page.getByRole('button', { name: nameOf('United States', 'contains') }).first().click()
      await cta.click()
      // The rail is a list named «Step N of 6»: the FIRST number is the step, whatever language the words around it are in.
      await expect(page.getByRole('list', { name: new RegExp(`^\\D*${step}\\D`) })).toBeVisible()
      await rec.visit(`wizard › step ${step}`)
    })
    if (!ok) break
  }
  await rec.step('start the career', async () => {
    // On the last step the primary control starts the career instead of advancing a step.
    const start = page.locator('.ob-cta--start')
    if (await start.count()) await start.click()
    await expect(tabButton(page, 'home')).toBeVisible()
    await rec.visit('first Home (week 1, after the wizard)')
    const tooltip = page.locator('.coach-tooltip')
    if (await tooltip.count()) {
      await rec.visit('coach marks › first mark')
      for (let i = 0; i < 12 && (await tooltip.count()); i++) {
        await tooltip.locator('.primary').click()
        if (await tooltip.count()) await rec.visit(`coach marks › mark ${i + 2}`)
      }
    }
  })
  if (rec.verdict === 'driven') rec.why = 'the wizard, step by step, to the first Home and its coach marks'
})

// -------------------------------------------------------------------------------------------------
// route 2 – school and junior tour
// -------------------------------------------------------------------------------------------------

test('route 2 – school and junior: Home, calendar, an entry, the shell', async ({ page, careerAt, lqa }) => {
  const rec = lqa(2, 'a', 'School and junior tour (junior, week 120)')
  await bootCareer(careerAt, 'junior')
  await hookReady(page)
  await rec.step('boot', async () => {
    await clearBlockingCards(rec)
  })
  await shellWalk(rec)
  // An entry: the Enter control on the Season planner, then the confirm that follows it. Dismissed, never confirmed.
  await rec.step('Season › an entry', async () => {
    await tabButton(page, 'play').click()
    const enter = page.getByRole('button', { name: nameOf('Enter the {event}, {weekRange}', 'prefix') }).first()
    if (!(await enter.count())) {
      rec.note('no Enter control on this career\'s Season planner (junior, week 120) – the entry confirm was not reached')
      return
    }
    if (!(await enter.isEnabled())) {
      rec.note('the first Enter control on the Season planner is disabled (entries closed or already entered) – the confirm was not reached')
      return
    }
    await enter.click({ timeout: 5_000 })
    await rec.visit('Season › entry confirm')
    await page.keyboard.press('Escape')
  })
  if (rec.verdict === 'driven') rec.why = 'Home, the five tabs, the doors, More, an entry confirm – school exams and a tournament trip are not on this career\'s week'
  rec.note('exams and the tournament trip need specific weeks; the junior fixture sits at week 120 and is not on one')
})

test('route 2b – the first-run coach marks', async ({ page, careerAt, lqa }) => {
  const rec = lqa(2, 'b', 'School and junior tour – coach marks (fresh, week 0)')
  // The tour is offered to a device that has never answered it, at week 0: no TOUR_ANSWERED here, on purpose.
  await careerAt('fresh', { splash: nameOf('Tap to start'), localStorage: { 'tb-locale': 'ru' } })
  await hookReady(page)
  await rec.clear()
  rec.recover = async () => undefined
  await rec.step('coach marks', async () => {
    const tooltip = page.locator('.coach-tooltip')
    await expect(tooltip).toBeVisible()
    for (let i = 0; i < 14 && (await tooltip.count()); i++) {
      await rec.visit(`coach marks › mark ${i + 1}`)
      await tooltip.locator('.primary').click()
    }
    await expect(tooltip).toHaveCount(0)
    await rec.visit('Home after the tour')
  })
  if (rec.verdict === 'driven') rec.why = 'every coach mark, then Home'
})

// -------------------------------------------------------------------------------------------------
// route 3 – move out and college
// -------------------------------------------------------------------------------------------------

test('route 3 – the college fork: her card, then the fork', async ({ page, careerAt, lqa }) => {
  const rec = lqa(3, 'a', 'Move-out and college – the fork (unheard, week 242)')
  await bootCareer(careerAt, 'unheard')
  await hookReady(page)
  rec.recover = async () => undefined
  const dialog = page.getByRole('dialog')
  await rec.step('her card', async () => {
    await expect(dialog).toBeVisible()
    await rec.visit('her card (boot: the card, Home beneath it, the splash)')
    await dialog.getByRole('radio').first().click()
    await dialog.getByRole('button').last().click()
  })
  await rec.step('the fork', async () => {
    await expect(page.locator('.fork-answer').first()).toBeVisible()
    await rec.visit('the fork (three answers)')
  })
  await rec.step('the fork – the college answer', async () => {
    await page.locator('.fork-answer').nth(1).click()
    await expect(page.locator('.fork-answer')).toHaveCount(0)
    await rec.visit('after the college answer')
  })
  rec.partial('the college year card is a gap: no committed career holds a college year (fixtures are found, not forged), and reaching one means advancing the weeks to the next September through the UI')
  rec.note('a college fixture (or a journey that advances to the departure week) would close this; the mounted layer carries the college cards (tests/component/i18n-l2-10-endings-college-fork.test.ts)')
})

// -------------------------------------------------------------------------------------------------
// route 4 – adult tour
// -------------------------------------------------------------------------------------------------

for (const [part, name, title] of [
  ['a', 'pro', 'Adult tour (pro, week 412)'],
  ['b', 'expecting', 'Adult tour – a pregnancy and the money (expecting, week 892)'],
  ['c', 'engaged', 'Adult tour – the wedding season (engaged, week 681)'],
] as [string, FixtureName, string][]) {
  test(`route 4${part} – ${title}`, async ({ page, careerAt, lqa }) => {
    const rec = lqa(4, part, title)
    await bootCareer(careerAt, name)
    await hookReady(page)
    rec.recover = recoverTo(page)
    // Whatever the boot put in front of Home (a briefing, a life beat) is itself a screen to read.
    await rec.step('boot', async () => {
      await clearBlockingCards(rec)
    })
    await shellWalk(rec)
    await rec.step('Home › the news / inbox', async () => {
      await goHome(page)
      await page.locator('[data-tour="home-news"]').first().click()
      await rec.visit('Home › news / inbox')
      await page.keyboard.press('Escape')
    })
    if (rec.verdict === 'driven') rec.why = 'the shell, the doors, More and the inbox on a real adult career'
  })
}

// -------------------------------------------------------------------------------------------------
// route 5 – the ending
// -------------------------------------------------------------------------------------------------

test('route 5 – the ending: the epilogue, the album, the record, raising another', async ({ page, careerAt, lqa }) => {
  const rec = lqa(5, 'a', 'The ending (ending, stopped at week 242)')
  await bootCareer(careerAt, 'ending')
  await hookReady(page)
  rec.recover = async () => undefined
  await rec.step('the epilogue', async () => {
    await expect(page.getByRole('button', { name: nameOf('View the album', 'contains') })).toBeVisible()
    await rec.visit('epilogue (stopped) – boot, the figures, the record and the offer')
  })
  await rec.step('the album', async () => {
    await page.getByRole('button', { name: nameOf('View the album', 'contains') }).click()
    await expect(page.getByRole('button', { name: nameOf('Next sheet', 'contains') })).toBeVisible()
    await rec.visit('epilogue › the album')
    await page.getByRole('button', { name: nameOf('Back to Home', 'contains') }).click()
    await expect(page.getByRole('button', { name: nameOf('Next sheet', 'contains') })).toHaveCount(0)
  })
  await rec.step('raise another', async () => {
    await rec.clear()
    await page.getByRole('button', { name: nameOf('Raise another', 'contains') }).click()
    await expect(page.getByRole('dialog').or(page.locator('.ob-cta')).first()).toBeVisible()
    await rec.visit('after «Raise another» (the next career begins)')
  })
  rec.partial('one of nine ending types: the committed careers hold the stopped ending; the other eight need their own journeys (bankruptcy is one advance from the broke fixture)')
})

// -------------------------------------------------------------------------------------------------
// route 6 – an old save
// -------------------------------------------------------------------------------------------------

const GOLDEN_DIR = fileURLToPath(new URL('../../tests/fixtures/saves/', import.meta.url))

/** A `.tsave` the product would read, built from a golden JSON of schema `version`: MAGIC | u32 BE | sha256(gzip) | gzip(JSON) (src/engine/saveCodec.ts). */
function oldSave(version: number): Buffer {
  const json = readFileSync(`${GOLDEN_DIR}v${version}.json`)
  const payload = gzipSync(json)
  const header = Buffer.alloc(44)
  header.write('TSIMSAVE', 0, 'ascii')
  header.writeUInt32BE(version, 8)
  createHash('sha256').update(payload).digest().copy(header, 12)
  return Buffer.concat([header, payload])
}

test('route 6 – an old .tsave: the oldest golden the harness can import, and the newest pre-v93', async ({ page, careerAt, lqa }) => {
  const rec = lqa(6, 'a', 'Old .tsave (golden-derived, imported through More › Saves)')
  await bootCareer(careerAt, 'fresh')
  await hookReady(page)
  await rec.step('boot', async () => {
    await clearBlockingCards(rec)
  })
  await rec.clear()
  rec.recover = recoverTo(page)
  const imported: number[] = []
  const refused: string[] = []
  for (const version of [0, 1, 9, 30, 60, 92]) {
    const ok = await rec.step(`import v${version}`, async () => {
      await goHome(page)
      await page.locator(DOOR.settings).click()
      const group = page.getByRole('group', { name: nameOf('Which settings') })
      await expect(group).toBeVisible()
      await group.getByRole('button', { name: nameOf('Saves') }).click()
      const chooser = page.waitForEvent('filechooser')
      await page.getByRole('button', { name: nameOf('Import from file') }).click()
      await (await chooser).setFiles({ name: `golden-v${version}.tsave`, mimeType: 'application/octet-stream', buffer: oldSave(version) })
      await rec.visit(`v${version} › the import confirm`)
      await page.getByRole('button', { name: new RegExp(`(?:${nameOf('Import').source})|(?:${nameOf('Overwrite').source})`) }).click()
      await goHome(page)
      await rec.visit(`v${version} › Home after the import`)
      imported.push(version)
    })
    if (!ok) refused.push(`v${version}`)
  }
  await rec.step('the legacy career\'s history', async () => {
    await page.locator('[data-tour="home-news"]').first().click()
    await rec.visit('legacy › news / inbox')
    await page.keyboard.press('Escape')
    await tabVisit(rec, 'stats', 'legacy › Stats')
    await doorVisit(rec, 'legacy › Album', () => page.getByRole('button', { name: nameOf('Recent memory', 'prefix') }).click(), () => page.getByRole('button', { name: nameOf('Next sheet') }))
  })
  rec.note(`imported through the real door: ${imported.map((v) => `v${v}`).join(', ') || 'none'}; refused or not reached: ${refused.join(', ') || 'none'}`)
  if (imported.length === 0) rec.gap('no golden could be imported through More › Saves')
  else if (rec.verdict === 'driven') rec.why = `old goldens imported through the product's own door (${imported.map((v) => `v${v}`).join(', ')}); the e2e fixtures are all v93 now, so these are the only pre-v93 careers the harness can build`
})

// -------------------------------------------------------------------------------------------------
// route 7 – the phone and accessibility, at 375 and 320
// -------------------------------------------------------------------------------------------------

for (const [width, height] of [
  [375, 667],
  [320, 568],
] as const) {
  test(`route 7 – the phone at ${width}px: the shell on the adult career`, async ({ page, careerAt, lqa }) => {
    const rec = lqa(7, String(width), `Phone / a11y – ${width}x${height} (pro)`)
    await page.setViewportSize({ width, height })
    await bootCareer(careerAt, 'pro')
    await hookReady(page)
    rec.recover = recoverTo(page)
    await rec.step('boot', async () => {
      // The dismiss law, measured at this width: a blocking card's last control must be on the screen.
      if ((await page.getByRole('dialog').count()) > 0) {
        const box = await page.getByRole('dialog').first().getByRole('button').last().boundingBox()
        rec.note(`a blocking card at boot: its last control ${box ? `ends at y=${Math.round(box.y + box.height)} of ${height}` : 'has no box'}`)
      }
      await clearBlockingCards(rec)
    })
    await shellWalk(rec)
    if (rec.verdict === 'driven') rec.why = `the shell of the adult career at ${width}x${height}, each screen's horizontal overflow measured (facts.overflowPx)`
    rec.note('automatable here: the width passes and the overflow measure; VoiceOver / TalkBack, reduced motion and a real phone are his manual half')
  })
}

// -------------------------------------------------------------------------------------------------
// the old-English-island check shared with route 6 and 4: nothing more to drive here
// -------------------------------------------------------------------------------------------------

test('the instrument itself: the hook is in the build, the locale is ru, the html lang follows', async ({ page, careerAt }) => {
  await careerAt('fresh', ruCareer())
  await hookReady(page)
  expect(await page.evaluate(() => document.documentElement.lang), 'html lang under tb-locale=ru').toBe('ru')
  expect(Object.keys(RU).length, 'the catalog the matcher reads is the one the build ships').toBeGreaterThan(0)
  expect(TOUR_ANSWERED).toBeTruthy()
})
