// JOURNEY: A FINISHED CAREER TAKES THE DOOR, THE CHILDHOOD IS WALKED AGAIN UNDER HER MOTHER'S NAME,
// AND THE CAREER THAT COMES OUT REALLY CARRIES THE LINE.
//
// SEAMS OWNED: #1 (the Web Worker boundary) and #5 (real input), with the file door carrying the
// tail. ⭐ THE ONE NEW CASE WAVE 10 OWES for the dynasty (the owner's 29.08 rule: one e2e case per
// shipped mechanic), and the plan names it in as many words: «finish a fixture career, take the
// door, name the girl, assert the new career's week-0 world carries `dynasty` and the surname»
// (docs/plans/life-wave-10-builder-2026-09.md §2 T4.5).
//
// WHAT ONLY THIS LAYER CAN SAY. Every half is pinned one layer down – the block's arithmetic in
// tests/wave10-handover.test.ts, the two door labels and the locked card mounted through the real
// cascade in tests/component/wave10-dynasty-door.test.ts, the lean in tests/wave10-heredity.test.ts.
// What none of them can say is that the ROUTE exists:
//
//   * that the epilogue's second affordance really unmounts the takeover and lands the player on the
//     childhood, across `App.vue`'s `newGameRoute` and a dropped snapshot – a state machine no
//     mounted test holds both ends of;
//   * that the block survives that hand-off IN MEMORY and reaches `createWorld` nine cards later,
//     through a real worker and a real `new` command;
//   * that the career which comes out is stored and re-read with `world.dynasty` intact – the save
//     door, which is where a v86 field either round-trips or does not.
//
// ⚠⚠ WHAT THIS SPEC CANNOT SEE, SAID OUT LOUD RATHER THAN QUIETLY DROPPED. `world.dynasty` REACHES
// NO SCREEN – the record is engine-only by design (T5 and T6 read it where the world is), and it is
// deliberately not on the wire. The tempting move was to export the save and decode it here, and the
// repo refused it in as many words: `tsconfig.e2e.json` lists exactly three non-e2e files and says
// «what must never be listed is anything that reaches the engine». `vue-tsc -b` failed with TS6307
// naming `src/engine/saveCodec.ts` the moment it was tried, which is that boundary enforcing itself
// exactly as its own comment predicts.
//
// ⚠ SO THE RECORD'S PERSISTENCE IS PINNED WHERE IT CAN BE – tests/wave10-handover.test.ts §C and §D,
// on a real `createWorld` and a real `migrateSave` – and what THIS file proves is everything the
// record CAUSES that a player can see: the route, the locked name reaching the world, and the
// child's seed. ⚠⚠ THE SEED IS THE LOAD-BEARING ONE: `createWorld` prints it into the career's
// opening feed row, and `${mother}:dynasty:1` is a string that can ONLY come from a block that
// crossed the hand-off, survived nine cards in memory and reached the worker. A browser asserting it
// is asserting the whole route in one line.
//
// ⚠ THE WALK IS GENERIC AND NOT e2e/prologue.spec.ts's COUNTED TABLE, deliberately: that table
// asserts an exact control count per card, and a dynasty run has THREE FEWER on the five (the
// origins are not asked, §6.3). Copying the table with one row edited would be a second spelling of
// the walk that drifts the first time a card changes. This one presses what is there.
import { expect, test, TOUR_ANSWERED } from './careerAt'
import type { Page } from '@playwright/test'
import { loadManifest } from '../tools/e2e-fixtures-read'

const manifest = loadManifest()
const ENDING = manifest.fixtures.find((f) => f.name === 'ending')!

/** Input, invented by this spec – no screen contains it until it is typed. */
const TYPED_FIRST = 'Nadia'

/** The weekend takeover, when a year bought one. `prologue.spec.ts` has the same shape; this is the
 *  smallest form of it, because what this file is about is the route and not the tennis. */
async function clearWeekends(page: Page): Promise<void> {
  for (let guard = 0; guard < 8; guard += 1) {
    const skip = page.getByRole('button', { name: 'Skip the rest of the weekend' })
    if ((await skip.count()) === 0) return
    await skip.click()
    await page.waitForTimeout(50)
  }
}

test('the line continues: the door, the locked name, and a career that carries it', async ({
  page,
  careerAt,
}) => {
  const crashes: string[] = []
  page.on('pageerror', (error) => crashes.push(error.message))

  await careerAt('ending', { localStorage: TOUR_ANSWERED })

  // ===============================================================================================
  // 1. ⭐⭐ THE EPILOGUE IS UP, AND THE DOOR IS ON IT
  // ===============================================================================================
  const epilogue = page.getByRole('dialog', { name: 'Epilogue' })
  await expect(epilogue).toBeVisible()
  // The hand-off is an offer on the LAST page, so the album has to be turned to reach it.
  for (let i = 0; i < 6; i += 1) await epilogue.getByRole('button', { name: 'Next' }).click()

  const line = epilogue.locator('.ending-line')
  await expect(line, 'his 20.09 ruling: the door renders on EVERY ending').toHaveCount(1)
  // This career had no child, so the epilogue variant is the true one. ⚠ The label is a DRAFT and is
  // named here for the same reason prologue.spec.ts names the wizard's heading: it is the thing under
  // test, and a red here after his pass means the string moved and this line has to move with it.
  await expect(line).toHaveText('A daughter came later')
  await expect(epilogue.getByRole('button', { name: 'Raise another' }), 'beside it, never instead of it')
    .toHaveCount(1)

  await line.click()

  // ===============================================================================================
  // 2. ⭐⭐⭐ THE CHILDHOOD OPENS UNDER HER MOTHER'S NAME
  // ===============================================================================================
  const card = page.getByRole('dialog')
  await expect(card.locator('#prologue-last')).toBeVisible()
  await expect(
    card.locator('#prologue-last'),
    'she carries her mother\'s name, and the fixture is the mother',
  ).toHaveValue(ENDING.profile.kidLastName)
  await expect(card.locator('#prologue-last'), 'and the field cannot be typed over').toHaveAttribute('readonly', '')
  await expect(card.locator('.prologue-line-note'), 'the one sentence that explains the lock').toHaveCount(1)
  // §6.3 – the origins are not a question on a dynasty run: the band arrived on the block.
  await expect(card.locator('.prologue-picks button'), 'nothing to choose about where she is from').toHaveCount(0)

  // «имя выбирает родитель» – the first name is the one thing the parent types.
  await card.locator('#prologue-first').fill(TYPED_FIRST)

  // ===============================================================================================
  // 3. THE NINE YEARS, PRESSED
  // ===============================================================================================
  for (let step = 0; step < 20; step += 1) {
    const dialog = page.getByRole('dialog')
    if ((await dialog.locator('svg.radar-svg').count()) > 0) break
    const heading = await dialog.getByRole('heading').first().textContent()
    // ⚠⚠ ANSWER EVERY GROUP ON THE CARD, ONE AT A TIME, AND WAIT FOR THE ONE THAT IS DISCLOSED.
    // Two findings are baked into this loop, both paid for by a red run:
    //   1. A card can carry TWO `.prologue-picks` radiogroups – the year's own answers and, under
    //      them, that year's tournament question – so «the last radio on the card» answered the ASK
    //      and left the YEAR unpicked. The run then failed `isComplete` at the ninth card and
    //      `begin()` returned in silence, which is what this spec spent two runs finding out.
    //   2. The ask on the eleven and the twelve is DISCLOSED by the first answer (round 40 #2), so it
    //      is not in the DOM when the card arrives – clicking it in the same tick clicks nothing.
    // Answering «the first group with nothing checked», re-queried after every press, handles both
    // without restating e2e/prologue.spec.ts's counted table – which is the OTHER thing this walk must
    // not do, because a dynasty five has three fewer controls than that table's first row.
    for (let tries = 0; tries < 4; tries += 1) {
      if ((await dialog.locator('.prologue-proceed').count()) > 0) break
      const groups = dialog.locator('.prologue-picks')
      const total = await groups.count()
      let answered = false
      for (let g = 0; g < total; g += 1) {
        const group = groups.nth(g)
        if ((await group.locator('[aria-checked="true"]').count()) > 0) continue
        const options = group.locator('button')
        const count = await options.count()
        if (count === 0) continue
        await options.nth(count - 1).click()
        answered = true
        break
      }
      if (!answered) break
      await page.waitForTimeout(80)
    }
    // ⚠ PROCEED BY NAME, NEVER «the last control»: the way OUT of the prologue is the last control
    // in `.prologue-answers` (PrologueCard.vue says so in as many words), so a walk that pressed the
    // last button would skip to the wizard and quietly measure nothing.
    const proceed = dialog.locator('.prologue-proceed')
    if ((await proceed.count()) > 0) await proceed.click()
    else await dialog.locator('.prologue-answer').first().click()
    await clearWeekends(page)
    await expect
      .poll(
        async () => {
          const d = page.getByRole('dialog')
          if ((await d.locator('svg.radar-svg').count()) > 0) return true
          return (await d.getByRole('heading').first().textContent()) !== heading
        },
        { message: `the walk never left «${heading}» (step ${step + 1})` },
      )
      .toBe(true)
  }

  // ===============================================================================================
  // 4. ⭐⭐ THE CAREER EXISTS, AND IT IS HERS
  // ===============================================================================================
  const handover = page.getByRole('dialog')
  // The rose is what says this walk arrived: `prologue.spec.ts` addresses the handover by exactly
  // this locator, and a card's hero painting carries no role at all.
  await expect(handover.locator('svg.radar-svg'), 'the nine cards ran out without a handover').toBeVisible()
  await handover.getByRole('button', { name: 'Go on' }).click()

  // ⚠ THE SURNAME IS THE PROOF THAT THE LOCKED FIELD REACHED THE WORLD – nothing on the prologue
  // could have typed it, and the mother's save is the only place it exists. Home draws her short name
  // (`formatShortName`), so the family name is what this asserts rather than the whole of it.

  // ===============================================================================================
  // 5. ⭐⭐⭐ ...AND SHE WAS BORN ON HER LINE'S OWN SEED
  // ===============================================================================================
  //
  // `createWorld` writes one opening row naming the seed the career was created on, so this is the
  // whole route in one assertion: `${mother}:dynasty:1` exists nowhere in the UI, cannot be typed,
  // and is computed at the MOTHER's ending – so a browser reading it here has proved that the block
  // crossed the hand-off, survived nine cards in memory, and reached the worker's `new` command.
  // §6.4's «never a fresh random», as a fact rather than as a function's contract.
  await expect(
    page.getByText(`${ENDING.seed}:dynasty:1`).first(),
    'the childhood was born on a fresh random seed – the line did not cross',
  ).toBeVisible()

  // ⚠ HER PAGE AND NOT HOME. Home draws her FIRST NAME only at phone width – the short name lives on
  // the desktop rail – so the family name is asserted on the screen that carries the whole of it.
  await page.getByRole('button', { name: 'Open her profile' }).click()
  await expect(
    page.getByText(`${TYPED_FIRST} ${ENDING.profile.kidLastName}`).first(),
    'the girl the parent named is not carrying her mother\'s name',
  ).toBeVisible()

  expect(crashes, crashes.join('\n')).toEqual([])
})
