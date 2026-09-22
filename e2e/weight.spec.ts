// JOURNEY: THE ONE SWITCH IN THE GAME IS TURNED ON IN SETTINGS, SURVIVES A RELOAD OUT OF INDEXEDDB,
// AND TURNED OFF AGAIN NO WEIGHT BEAT ARRIVES ACROSS A DRIVEN YEAR.
//
// SEAMS OWNED: #1 (the Web Worker boundary), #2 (persistence) and #5 (real input). ⭐ THE ONE NEW
// CASE WAVE 11 OWES for the weight (the owner's 29.08 rule: one e2e case per shipped mechanic), and
// the plan names it in as many words: «the switch flow – create with it ON, toggle OFF in settings,
// assert no weight beat can arrive (drive weeks with the dev fast-forward)»
// (docs/plans/life-wave-11-builder-2026-09.md §2 T7.2).
//
// WHAT ONLY THIS LAYER CAN SAY. Every half is pinned one layer down – the schema move and the
// setter in tests/wave11-weight-schema.test.ts, the two hazards in tests/wave11-loss.test.ts and
// tests/wave11-bereavement.test.ts, the row itself mounted in tests/component/wave11-weight-ui.test.ts.
// What none of them can say is that the ROUTE exists:
//
//   * that a press on the settings row really reaches the worker, mutates `world.weightEnabled` and
//     comes back as a snapshot the screen redraws from – a round trip no mounted test holds both
//     ends of, because the mounted one has no worker;
//   * that the answer SURVIVES A RELOAD, which is where a v87 key either round-trips through
//     IndexedDB or does not. That is the sharpest thing this file says and the reason it exists:
//     `weightEnabled` is a schema field, and a field that did not persist would look perfect in
//     every unit test in the repo.
//
// ⚠⚠ WHAT THIS SPEC CANNOT SEE, SAID OUT LOUD RATHER THAN QUIETLY DROPPED.
//
//   * NOT A BEREAVEMENT ARRIVING. The hazard is 0.08% a week (his 11.09 figure), so a driven year
//     meets one about four times in a hundred. A browser case that waited for one would be a flaky
//     test wearing a journey's clothes. The ARRIVAL is walked in the engine, thousands of careers at
//     a time, by tools/weight-bench.ts and tests/wave11-bereavement.test.ts.
//   * NOT A PREGNANCY LOSS EITHER, and for a stricter reason than rarity: the loss needs a live
//     pregnancy, which needs a latched marriage, which is `ECONOMY.wedding`'s own distance away.
//     e2e/expecting.spec.ts is the fixture that parks inside that arc and it is not this one.
//   * NOT `weightEnabled` READ OFF A DECODED SAVE. `tsconfig.e2e.json` lists exactly three non-e2e
//     files and says «what must never be listed is anything that reaches the engine» – wave 10's
//     dynasty spec paid for that rule with a TS6307 and wrote it down. What this file reads instead
//     is the SCREEN after a reload, which is the same fact seen from the side a player sees it from.
//
// ⚠ SO WHAT IS ASSERTED IS THE ABSENCE OVER A DRIVEN YEAR, which is a weak claim on its own and is
// why it is the LAST step rather than the first: the strong claims are the round trip and the
// reload, and the absence is what the plan asked for in as many words.
import { test, expect } from './careerAt'
import { dismissTourBriefing, goHome, openMore } from './journey'

/** ⚠ THE ROW'S OWN NAME, TRANSCRIBED – `WEIGHT_COPY.title` (src/composables/identityCopy.ts), which
 *  `tsconfig.e2e.json` forbids this project from importing (e2e/expecting.spec.ts writes the pause's
 *  refusal longhand for the same reason and says so).
 *
 *  ⚠ IT IS A **DRAFT** FOR THE OWNER'S PASS (invariant 4), so this file is the copy that rots if he
 *  re-words it – and it rots LOUDLY, by failing to find a switch, rather than quietly. The component
 *  test reads the constant; only one side is a transcription, which is the property wave 10's own
 *  notes name. */
const WEIGHT_ROW = 'The weight'

test.describe('the weight switch', () => {
  test('turns on in settings, survives a reload, and turned off no weight beat arrives', async ({
    page,
    careerAt,
  }) => {
    const crashes: string[] = []
    page.on('pageerror', (error) => crashes.push(error.message))

    // ⚠ `pro` RATHER THAN `fresh`: the settings row renders only with a career loaded (it is a fact
    // about a CAREER, not a device preference – the script side of MoreScreen argues it), and an
    // adult career is also the only kind either hazard could ever fire on.
    await careerAt('pro')
    await dismissTourBriefing(page)
    // ⚠ THE WEEK THE CAREER OPENS ON, read off Home before anything is pressed – step 4 asserts it
    // is GONE, which is how an absence is kept from being vacuous.
    const opening = ((await page.getByText(/^W\d+ /).first().textContent()) ?? '').trim()
    expect(opening.length, 'Home really printed a week').toBeGreaterThan(0)

    // =============================================================================================
    // 1. ⭐⭐ THE ROW IS THERE, IT IS A REAL SWITCH, AND IT OPENS OFF
    // =============================================================================================
    // ⚠ OFF is the RULED default for a career nobody asked (22.09, question 1) and is what every
    // fixture in the corpus carries – `openCareer` hands `createWorld` no sixth argument.
    await openMore(page)
    const weight = page.getByRole('switch', { name: WEIGHT_ROW })
    await expect(weight, 'the settings row exists and is named by its own label').toBeVisible()
    await expect(weight, 'a career nobody asked opens with it OFF').toHaveAttribute('aria-checked', 'false')

    // =============================================================================================
    // 2. ⭐⭐⭐ A PRESS REACHES THE WORKER AND COMES BACK AS A SNAPSHOT
    // =============================================================================================
    // ⚠ THE ASSERTION IS ON `aria-checked` AND NOT ON THE WORD BESIDE IT, deliberately: the state is
    // on the control, which is what makes the row answerable by a screen reader (defect D2's own
    // lesson), and the word is copy that may move.
    await weight.click()
    await expect(weight, 'the press round-tripped through the worker').toHaveAttribute('aria-checked', 'true')

    // =============================================================================================
    // 3. ⭐⭐⭐ ...AND IT SURVIVES A RELOAD, WHICH IS THE v87 KEY ROUND-TRIPPING THROUGH INDEXEDDB
    // =============================================================================================
    // ⚠⚠ THE SHARPEST LINE IN THE FILE. `weightEnabled` is a schema field; a field that reached the
    // world but never the SAVE would pass every unit test in the repo and lose a player's answer the
    // first time they closed the tab.
    await page.reload()
    // ⚠⚠ THE SPLASH COMES BACK ON A RELOAD AND HAS TO BE PRESSED, which is the app's own shape and
    // was measured here rather than predicted: the first run of this spec timed out waiting for the
    // gear, and the failure snapshot was a screen holding exactly one control – «Tap to start».
    // e2e/offline.spec.ts presses the same button after each of its four reloads and says so.
    await page.getByRole('button', { name: 'Tap to start' }).click()
    await dismissTourBriefing(page)
    await openMore(page)
    const after = page.getByRole('switch', { name: WEIGHT_ROW })
    await expect(after, 'the answer came back out of storage').toHaveAttribute('aria-checked', 'true')

    // =============================================================================================
    // 4. ⭐⭐ OFF AGAIN, AND A DRIVEN YEAR BRINGS NO WEIGHT BEAT
    // =============================================================================================
    await after.click()
    await expect(after, 'and it turns the other way too').toHaveAttribute('aria-checked', 'false')
    // ⚠ THE DEV FAST-FORWARD IS THE PLAN'S OWN INSTRUMENT and it ships in every build by the owner's
    // ruling («the deployed build is the playtest device»). Its own guards refuse to tick past an
    // unanswered life beat, which is the other half of what this step asserts: if a bereavement card
    // HAD been raised, the button would stop and the week would not move.
    // ⚠⚠ IT LIVES ON THE **SAVES** TAB AND THE SWITCH LIVES ON **PLAY**, which is a fact about the
    // screen measured here rather than assumed: the first run of this step timed out on a button
    // that was on the other tab. So the walk crosses and comes back, which is also the honest
    // journey – a player who changes the setting and then drives a year does exactly this.
    // ⚠⚠ THE FAST-FORWARD IS ON THE **SAVES** TAB AND THE SWITCH IS ON **PLAY**, which is a fact
    // about the screen measured here rather than assumed: the first run of this step timed out on a
    // button that was on the other tab.
    await page.getByRole('group', { name: 'Which settings' }).getByRole('button', { name: 'Saves' }).click()
    const devWeek = page.getByRole('button', { name: '▶▶ 52 (dev)' })
    await expect(devWeek, 'the dev fast-forward is on this screen in every build').toBeVisible()
    await devWeek.click()
    // ⚠ THE CARD IS THE THING THAT WOULD BE THERE: the beat BLOCKS, so an arrival is a dialog
    // standing over the screen rather than a row somewhere in a feed.
    await expect(
      page.getByRole('dialog', { name: /death in the family/i }),
      'no weight beat arrives with the switch off',
    ).toHaveCount(0)
    // ⚠⚠ AND THE ABSENCE IS NOT ALLOWED TO BE VACUOUS: the weeks have to have moved, or this step
    // is asserting that nothing happened while nothing happened. Home's own date line is where time
    // is visible, and it is read from the same screen before and after.
    await goHome(page)
    await expect(page.getByText(opening), 'the weeks really moved').toHaveCount(0)

    expect(crashes, 'no uncaught error anywhere in the journey').toEqual([])
  })
})
