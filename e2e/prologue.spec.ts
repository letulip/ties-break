// ⭐⭐ THE CHILDHOOD PROLOGUE, IN A REAL BROWSER – phase 4 of
// docs/specs/childhood-prologue-build-2026-09.md §5 and §6.
//
// WHAT IT CLAIMS, and it is the half no other layer can make: that the DEFAULT path into a career
// works end to end. `tests/component/prologue-two-paths.test.ts` walks the same nine cards with the
// worker stubbed away, so the one thing it can never say is that a real `postMessage` round trip
// happened – and the whole of phase 4's wiring lives on the far side of that boundary. Here the nine
// years cross it, `createWorld` spends them, and the rose the handover draws is one a real Web
// Worker built and shipped back.
//
// ⚠ THIS IS NOW THE FIRST THING EVERY NEW PLAYER MEETS. `smoke.spec.ts` owns the other branch – it
// takes the way out on the first card and walks the six-step wizard exactly as it always has.
//
// ⚠⚠ NOT ONE SENTENCE OF THE PROLOGUE APPEARS IN THIS FILE, AND NOT ONE MODULE OF IT IS IMPORTED.
// Two rules meet here and they point the same way:
//
//   1. §8 – every word of the nine cards and of the handover is a DRAFT the owner has not read. A
//      spec that addressed a control by its label would hold a second copy of a string he is
//      expected to rewrite, and would go red on a table edit that broke nothing.
//   2. tsconfig.e2e.json – this project lists only DEPENDENCY-FREE files, and its own note says the
//      day one of them grows an import «is the signal to stop, not to add another line below». The
//      card table reaches `shared/protocol` and the run reaches `engine/economy`, so importing them
//      would drag the engine into a second type-check and into every Playwright worker.
//
// So the walk is STRUCTURAL. What it addresses is the shape of the screen rather than its words, and
// every step names what it is relying on:
//
//   * a card is a `role="dialog"` with one heading and a column of buttons;
//   * an answer is a button, and the second one is the road that buys her the most (the table's
//     options run cheap-first, which is what makes «the second» a road and not a coin flip);
//   * the way out sits LAST, after the answers – a structural fact, because round-20 #3's
//     measurement reads it off the card's bottom edge;
//   * and the handover is the one screen in the flow that carries a PICTURE, which is what tells
//     the walk it has arrived.
//
// The button COUNT is asserted on every card, so a control appearing or vanishing reddens here
// instead of quietly changing which one this walk clicks.
//
// ⚠ NO `waitForTimeout`. Every step is an action or a web-first assertion.
import { test, expect, type Page } from '@playwright/test'

/** "This device has been onboarded" - App.vue's one durable record, written by the tour's dismiss
 *  and, since phase 5, by the prologue reaching its end. Spelled out here rather than imported from
 *  `careerAt.ts`: this spec boots the real app from nothing and takes none of the fixture
 *  machinery, and one key name is a cheaper duplicate than that whole dependency. */
const TOUR_SEEN_KEY = 'tb:onboardingTourSeen'

/** A name no screen in this app contains until this spec types it – so finding it downstream can
 *  only mean it travelled. It is deliberately NOT one of the wizard's own draw pool. */
const TYPED_NAME = 'Zenobia'

/** ⚠ THE NINE CARDS, AS A SHAPE. Four of them carry no decision (ages 5, 6, 7 and 13 – the count is
 *  the owner's, §3) and five do, and card 5 also carries the family's origin and the way out. So the
 *  control count per card is the sequence below, and it is asserted rather than assumed: it is the
 *  only thing standing between «clicked the second answer» and «clicked whatever was second».
 *
 *  ⚠⚠ AND THE COUNT IS TAKEN INSIDE `.prologue-answers`, NOT OVER THE WHOLE DIALOG – re-aimed
 *  02.09 and NARROWED, not loosened. The owner's correction of that day put her name, her birthday
 *  and her country on the age-5 card («часть нашего текущего онбординга … должны остаться», «страну
 *  тоже добавь, да»), and the country picker is a grid of nine tiles plus a way to open the rest.
 *  Over the dialog, card 1 counts fourteen controls and «the second button» is the second COUNTRY,
 *  not the second family origin – so this walk would have gone on clicking something real and
 *  meaning something else. The answers column is the structural fact this file was always relying on
 *  («the way out sits LAST, after the answers»); it is now named instead of assumed. */
const CONTROLS_PER_CARD = [4, 1, 1, 2, 2, 2, 2, 2, 1]

/** Walk the nine cards, taking the second answer wherever there is one. */
async function walkTheChildhood(page: Page): Promise<void> {
  for (const [index, expected] of CONTROLS_PER_CARD.entries()) {
    const card = page.getByRole('dialog')
    const heading = await card.getByRole('heading').textContent()
    const buttons = card.locator('.prologue-answers').getByRole('button')
    await expect(buttons, `card ${index + 1} does not have the controls it should`).toHaveCount(expected)

    // The second control on a card that has one; the only control on a quiet year. On card 1 that is
    // the second family origin, which is the middle-class house – the background every other layer
    // measures this prologue against.
    await buttons.nth(expected > 1 ? 1 : 0).click()

    // ⚠ AND THE CARD REALLY CHANGED. Without this a click that landed on nothing would be invisible
    // until the walk ran out of cards, and the failure would name the wrong step.
    if (index < CONTROLS_PER_CARD.length - 1) {
      await expect(page.getByRole('dialog').getByRole('heading')).not.toHaveText(heading ?? '')
    }
  }
}

test('the nine cards run, the handover draws her, and going on starts the career', async ({ page }) => {
  const crashes: string[] = []
  page.on('pageerror', (error) => crashes.push(error.message))

  await page.goto('/')
  await page.getByRole('button', { name: 'Tap to start' }).click()

  // --- the prologue is the DEFAULT (§6) ---------------------------------------------------------
  // No save in this profile, so the app opens on the childhood rather than on the wizard. The
  // wizard's own heading is the assertion that says which branch this is, and it is the one string
  // this file may name: it is the owner's SHIPPED copy, not the prologue's draft.
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Raise a Champion. Together.' }),
    'the wizard is the OTHER branch and must not be what a new player lands on',
  ).toHaveCount(0)

  // --- ⭐⭐ WHO SHE IS (owner, 02.09) -----------------------------------------------------------
  //
  // «каждая прологовая карьера сейчас Вера Мартин … часть нашего текущего онбординга с датой
  // рождения и именем должны остаться», and the same day «страну тоже добавь, да». The age-5 card
  // asks; this types an answer into it, and the assertion that it ARRIVED is at the bottom of this
  // test, on the far side of a real worker.
  //
  // ⚠ ADDRESSED BY THE FIELD'S id AND NOT BY ITS LABEL, which is this file's standing rule read the
  // other way round: the label is the WIZARD's shipped copy and the owner may still move it, so
  // naming it here would be a second copy of a string he owns. `TYPED_NAME` is not the prologue's
  // copy either – it is input, invented by this spec, and no screen contains it until it is typed.
  const identityCard = page.getByRole('dialog')
  await expect(identityCard.locator('#prologue-first'), 'the five asks who she is').toBeVisible()
  await identityCard.locator('#prologue-first').fill(TYPED_NAME)

  await walkTheChildhood(page)

  // --- the handover (§5) ------------------------------------------------------------------------
  const handover = page.getByRole('dialog')
  await expect(handover).toBeVisible()

  // 1. THE FORMED ROSE, drawn by the shipped radar off a snapshot a real worker built.
  //    ⚠ IT IS NAMED, NOT COUNTED, SINCE PHASE 7 – and the reason is that the old note here («it is
  //    what tells this walk it has arrived: no card in the flow carries a picture») stopped being
  //    true the day every card grew a painting. The rose is a `role="img"` with an accessible name;
  //    a card's hero is an `alt=""` decoration and carries no role at all, so this still addresses
  //    exactly one thing – but it now says WHICH, instead of relying on there being only one image
  //    in the whole flow.
  await expect(handover.locator('svg.radar-svg')).toBeVisible()

  // 2. THE COACH'S READ. ⚠ THE BAND IS THE CAREER'S, so the spec cannot know which of his sentences
  //    it will be. What it can say is the thing §5 actually asks for: he speaks, and NO NUMBER
  //    reaches his mouth. Asserted over the WHOLE card, which is stronger than isolating his
  //    paragraph – the only digits allowed on this screen are the money, §2.4's total, once.
  const screen = ((await handover.textContent()) ?? '').replace(/\s+/g, ' ').trim()
  expect(screen.length, 'the handover is empty').toBeGreaterThan(80)
  // ⚠ TWO FIGURES SINCE THE BALANCE PASS, AND THEY ARE ONE NUMBER SAID TWICE. §2.4's «the total,
  // once» gained a second saying of the same total – what those nine years came to PER WEEK – so the
  // player meets the first weekly coaching bill already knowing the scale. A THIRD figure (a
  // balance, a running total) still reddens this, and the derivation is proved in
  // tests/component/prologue-handover.test.ts rather than here: this walk cannot know the seed's
  // childhood, only that the screen says its money exactly twice and says nothing else numeric.
  expect((screen.match(/\$/g) ?? []).length, `the money is not said exactly twice: ${screen}`).toBe(2)
  const figures = screen.match(/[\d,]*\d/g) ?? []
  expect(figures.length, `a number on this screen is not the money: ${figures.join(' | ')}`).toBe(2)
  // ...and the second IS the first divided by the nine years, to the dollar – so the pair cannot
  // drift into being two unrelated numbers on the one screen §2.4 allows a figure on at all.
  const total = Number(figures[0].replace(/,/g, ''))
  const weekly = Number(figures[1].replace(/,/g, ''))
  expect(weekly, `${total} a childhood is not ${weekly} a week`).toBe(Math.round(Math.round((total * 100) / (9 * 52)) / 100))

  // 3. THE HONEST CHOICE – two controls, and the game says NOTHING about rerolling, odds or a floor
  //    (his ruling, §2.3). The words below are a denylist and not a transcription: none of them may
  //    appear whatever the owner rewrites the screen to say.
  const answers = handover.getByRole('button')
  await expect(answers).toHaveCount(2)
  for (const word of ['reroll', 're-roll', 'odds', 'chance', 'random', 'seed', 'restart', 'retry', 'potential']) {
    expect(screen.toLowerCase().includes(word), `"${word}" is on the handover`).toBe(false)
  }

  // --- and the career is hers -------------------------------------------------------------------
  // The FIRST control is the one that goes on with her. ⚠ AND IF THAT EVER STOPS BEING TRUE THIS
  // TEST FAILS RATHER THAN LYING: the other control drops the career and returns to the first card,
  // so week 1 would never render below.
  await answers.first().click()

  // Week 1, painted off a Snapshot the worker built from a world the prologue's nine years were
  // spent on. This is the assertion the whole file exists for: the round trip happened.
  await expect(page.getByRole('heading', { name: /^W1 \d{4} · /, level: 1 })).toBeVisible()
  // ⭐⭐ AND THE CAREER IS THE GIRL THE PLAYER NAMED. The store builds an empty seed out of her own
  // name (`${kidName.toLowerCase()}-xxxx`, game.ts `newCareer`), so the seed the WORKER echoed back
  // in this line is the one piece of evidence that a name typed on the first card survived the
  // whole flow: nine cards, a `postMessage`, `createWorld`, a Snapshot and the render. Before
  // 02.09 every prologue career opened on the default and this line read `alice-…` whatever was
  // typed – because nothing was asked.
  await expect(page.getByText(new RegExp(`career started \\(seed "${TYPED_NAME.toLowerCase()}-`))).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()

  // --- ⭐⭐ §6 C: ...AND NO TOUR (phase 5) -------------------------------------------------------
  //
  // His ruling is B and C together: B for the player who SKIPS the prologue, C for the player who
  // plays it, and after C «В уже не будет». C is not something built beside the tour - it is the
  // nine cards doing their job. A player who has just been walked through the interface does not
  // then need eleven coach marks explaining the same screen.
  //
  // ⚠ ASSERTED AFTER THE SHELL IS UP, NEVER BEFORE. `toHaveCount(0)` is true of a page that has not
  // rendered yet, so this is a green that means nothing if it runs before the nav exists. The three
  // assertions above are what make the absence below a fact: the shell is on screen, the marks
  // render in the same tick as the shell, and they are not there.
  await expect(
    page.getByRole('button', { name: 'Skip tour' }),
    'a player who walked the childhood is shown the tour as well',
  ).toHaveCount(0)
  await expect(page.locator('.coach-tooltip')).toHaveCount(0)

  // ⚠ AND FOR GOOD, which is a claim about what was WRITTEN DOWN rather than about this render.
  // `tourWanted` offers the marks to any device that has never answered them for as long as the
  // career sits at week 0, so a prologue that merely happened to be quiet here would meet them on
  // the next boot. The key is the one the dismiss writes: "this device has been onboarded" is a
  // single durable fact, and finishing the childhood is one of the ways of acquiring it.
  expect(await page.evaluate((k) => localStorage.getItem(k), TOUR_SEEN_KEY)).toBe('1')

  await page.reload()
  await page.getByRole('button', { name: 'Tap to start' }).click()
  await expect(page.getByRole('heading', { name: /^W1 \d{4} · /, level: 1 })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Skip tour' }),
    'the tour came back on the next boot of a career that started in the prologue',
  ).toHaveCount(0)

  expect(crashes, 'the app threw while the prologue ran').toEqual([])
})

// =================================================================================================
// ⭐⭐⭐ PHASE 7 – HOW TALL THE FIRST SCREEN OF THE GAME ACTUALLY IS
// =================================================================================================
//
// THE OWNER, 02.09: «Это первое прикосновение к игре, оно должно быть "вау! интересно!"» – and what
// the p6 identity slice left him was a form: her name, her family name, her birthday and a
// twenty-four-country picker stacked above the three origin buttons.
//
// ⚠⚠ WHY THIS MEASUREMENT LIVES HERE AND NOT ONLY IN `tests/component/prologue-walk.test.ts`.
// That file's instrument (`tests/component/fits.ts`) is a CSS-cascade model, because happy-dom does
// no layout – and on this one card it over-counts by more than double, in two named ways: a
// `<select>` is modelled by STACKING ITS OPTIONS (962px against a real 47px for the month/day pair)
// and a `grid` is modelled as one column (523px against a real 190px for the nine-tile picker). Its
// own header calls itself a floor that «UNDER-COUNTS AND NEVER OVER-COUNTS», and on those two
// controls that is false. The model's number is still worth a ceiling – it is what runs on every
// commit, and an over-count can only produce a false RED – but the number the owner is being asked
// to judge should be the one a browser produces. This is that number.
//
// MEASURED, NOT GUESSED (the rule e2e/responsive.spec.ts states for its own ceiling). At 375x667 in
// this Chromium: 1115px before phase 7, 997px after – and the 997 included a 193px painting the
// 1115 did not have, so the non-picture content fell from 1115 to 804.
//
// ⚠⚠ PHASE 8 PUT SOME OF IT BACK, DELIBERATELY, AND THE OWNER IS THE ONE WHO ASKED. The painting is
// SQUARE now – «я просил арты делать в квадратном формате по аналогии с home экраном» – which at
// this width is 343px instead of 193px, because a 16:9 window over a 512x512 master was throwing 44%
// of every painting away and cutting the age-5 scene through the parent's head. Set against that,
// the country slot and `Browse all countries` moved onto one line at his ask, and the three origins
// gained the question they were missing. The non-picture content is what to watch, and it did not
// grow: see the numbers asserted below, both of which are printed in the failure message.
//
// ⚠ 375x667 AND NOT THE SUITE'S 576x1280, for the reason responsive.spec.ts drops to 375 too: the
// round-20 #3 rule is written against the shortest screen the app supports, and a card measured on a
// 1280px-tall viewport is not measured at all.
test('⭐ the first card of the game is a picture and a scene, not a form', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Tap to start' }).click()

  const card = page.locator('.prologue-card')
  await expect(card).toBeVisible()

  // 1. THE PAINTING IS THERE AND IT SPANS THE CARD. Full-bleed is the whole ask – «большой арт на
  //    всю ширину экрана» – and it is the one thing a layout engine can confirm and a model cannot.
  const hero = card.locator('.prologue-hero')
  await expect(hero).toBeVisible()
  const spans = await hero.evaluate((el) => {
    const card = el.closest('.prologue-card') as HTMLElement
    return {
      heroWidth: Math.round(el.getBoundingClientRect().width),
      // ⚠ THE PADDING BOX, NOT THE BORDER BOX – `clientWidth` – and the difference is the point of
      // the note in style.css beside `.injury-stop-art`: «its art still spans exactly the padding
      // box (scrollWidth === clientWidth, so `overflow-x` computing to `auto` alongside `overflow-y`
      // clips nothing)». On this card `overflow-y: auto` is engaged, so a DESKTOP Chromium lays out
      // a 15px classic scrollbar inside the border box; a phone's overlay scrollbar takes no width
      // and the painting reaches glass to glass. Comparing against the border box would be asserting
      // the test runner's scrollbar, which is the one thing on this screen no player has.
      cardWidth: card.clientWidth,
      heroHeight: Math.round(el.getBoundingClientRect().height),
    }
  })
  expect(spans.heroWidth, 'the painting does not span the card`s padding box').toBe(spans.cardWidth)
  expect(spans.heroHeight, 'the painting is a strip, not a hero').toBeGreaterThan(150)
  // ⭐⭐ AND IT IS SQUARE, WHICH IS THE WHOLE OF «отец без головы» AND OF «в квадратном формате».
  //    The masters are 512x512, so a square window shows the entire painting and crops nothing – the
  //    same declaration `.diary-hero` carries on Home for the same reason. Only a real layout engine
  //    can confirm an `aspect-ratio` resolved against a `calc()` width, which is why it is asserted
  //    here as a measured pair rather than as a CSS string.
  expect(spans.heroHeight, 'the painting is not square, so it is cropping the master').toBe(spans.heroWidth)

  // 2. ⭐ THE TWO NAMES SHARE A ROW – asserted HERE and nowhere else, because the mounted
  //    instrument cannot see it: `fits.ts` has no grid and stacks a grid's cells in one column, so a
  //    row and a column measure identically there. In a browser the row is worth 69px of the 118 this
  //    card lost. Same top edge is the whole claim.
  const names = await card.locator('#prologue-first, #prologue-last').evaluateAll((els) =>
    els.map((e) => Math.round(e.getBoundingClientRect().top)),
  )
  expect(names.length, 'both name fields are on the card').toBe(2)
  expect(names[0], 'the two names are stacked, not side by side').toBe(names[1])

  // 3. ⭐ THE CHOSEN COUNTRY AND `Browse all countries` SHARE A LINE – his ask, and the second thing
  //    on this card only a browser can see: the mounted model reads a flex row as its tallest child,
  //    which is close, but the row's real claim is that the two controls have the same top edge.
  const country = await card.locator('.prologue-country .prologue-tile, .prologue-browse').evaluateAll((els) =>
    els.map((e) => Math.round(e.getBoundingClientRect().top)),
  )
  expect(country.length, 'the country slot and the way into the list are both on the card').toBe(2)
  expect(country[0], 'the country and the way in are stacked, not side by side').toBe(country[1])

  // 4. AND THE CARD IS NOT A FORM ANY MORE.
  //
  // ⚠ TWO NUMBERS, AND THE FIRST ONE IS THE ONE THAT MATTERS. The total moved because the painting
  //    got bigger at the owner's ask; what round-20 #4 is actually about is prose growing one honest
  //    sentence at a time, so the content ceiling is asserted with the hero taken back out of it.
  //
  //    MEASURED IN THIS CHROMIUM AT 375x667, content / painting / total:
  //      phase 6   1115 /   0 / 1115   the form
  //      phase 7    804 / 193 /  997
  //      phase 8    875 / 341 / 1216
  //    The painting is 341 rather than 343 because `overflow-y: auto` is engaged on this desktop
  //    Chromium and its classic scrollbar takes 2px of the padding box; on a phone it is the full
  //    343. 960 leaves ~85px of content headroom, which is four lines of his own copy at this width.
  //    MUTATION-VERIFIED: both ceilings were watched failing, which is where these numbers are from.
  const height = await card.evaluate((el) => el.scrollHeight)
  const withoutArt = height - spans.heroHeight
  expect(
    withoutArt,
    `the age-5 card is ${withoutArt}px of CONTENT (plus a ${spans.heroHeight}px painting, ${height}px in all)`,
  ).toBeLessThanOrEqual(960)
  expect(height, `the age-5 card is ${height}px on a 375x667 phone`).toBeLessThanOrEqual(1320)

  // 5. ⚠ THE ROUND-20 #3 RULE, IN A REAL LAYOUT. The card is taller than the screen and always will
  //    be; what must hold is that the player can reach the answers, which means the card scrolls and
  //    the last control lands inside the viewport once it has.
  const answers = card.locator('.prologue-answers')
  await answers.scrollIntoViewIfNeeded()
  const last = answers.getByRole('button').last()
  await expect(last).toBeInViewport()
})
