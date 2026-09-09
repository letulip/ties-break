// JOURNEY: THE MOOD WORD IS ON HER PAGE, IN A REAL BROWSER, OFF A REAL WORKER.
//
// ⭐ THE ONE NEW CASE WAVE 1 OWES (the owner's 29.08 rule: one e2e case per shipped mechanic), and
// the runbook names it in as many words: «the Kid screen's Mood word exists, belongs to the five,
// and matches the face's register».
//
// WHAT ONLY THIS LAYER CAN SAY. `tests/component/wave1-mood-word.test.ts` mounts the same screen
// with the worker boundary MOCKED – it hands the component a snapshot object – so the thing it can
// never say is that a REAL engine, in a REAL worker, decided a mood and shipped it across
// `postMessage` to a REAL painting. The word and the picture are one decision by construction on our
// side of the boundary; this is the arm that says the decision survived the crossing.
//
// ⚠ IT ASSERTS A MEMBERSHIP, NOT A VALUE, and deliberately. Which word a seeded career happens to be
// wearing is a property of that fixture's spirit on that week – re-generate the fixtures and it
// moves. What must never move is the CLOSED SET: the tile says one of the five spirit words or one
// of the eight the tile has always had, and the face beside it is the one that word belongs to. A
// spec that pinned «Steady» would go red for the wrong reason on the next `npm run e2e:fixtures`.
//
// ⚠ MUTATION-VERIFIED: `moodWord: channel === 'mood' ? … : null` -> `'Radiant'` (a word off the
// approved list) turns the membership arm red here; dropping the `?? MOOD_LABEL[emotion.value]`
// fallback in KidScreen turns the tile blank and the same arm red.
import { test, expect } from './careerAt'
import { answerOpeningKnock, dismissTourBriefing } from './journey'

/** The five spirit words (voice-bibles §C, approved) and the eight the tile has always spoken. ⚠ The
 *  second list is the OWNER's shipped copy and this spec only reads it – `Angry` is the Kid screen's
 *  own spelling of the face WeekRecapCard calls `Frustrated`, and neither is touched by the layer. */
const SPIRIT_WORDS = ['Glowing', 'Bright', 'Steady', 'Dimmed', 'Heavy']
const FACE_WORDS = ['Steady', 'Happy', 'Low', 'Focused', 'Tired', 'Hurt', 'On the mend', 'Angry']

/** Which face each word belongs to – the register the painting has to agree with. `Steady` is the
 *  deliberate overlap the owner ruled («the neutral state is one state and gets one word»), so it
 *  sits with `norm` on both ladders and is the one word two rows can produce. */
const FACE_OF: Record<string, string> = {
  Glowing: 'happy',
  Bright: 'happy',
  Steady: 'norm',
  Dimmed: 'sad',
  Heavy: 'sad',
  Happy: 'happy',
  Low: 'sad',
  Focused: 'serious',
  Tired: 'tired',
  Hurt: 'injury',
  'On the mend': 'rehab',
  Angry: 'angry',
}

test.describe('the Mood word', () => {
  test('her page speaks one of the words, and the face beside it agrees', async ({
    page,
    careerAt,
  }) => {
    const crashes: string[] = []
    page.on('pageerror', (error) => crashes.push(error.message))

    await careerAt('junior')
    await answerOpeningKnock(page)
    await dismissTourBriefing(page)

    // Home -> her page, through the door a player actually uses.
    await page.getByRole('button', { name: 'Open her profile' }).click()

    const mood = page
      .locator('.kid-tile')
      .filter({ has: page.getByText('Mood', { exact: true }) })
    await expect(mood).toBeVisible()
    const word = (await mood.locator('.kid-tile-lead').innerText()).trim()

    // 1. IT EXISTS, and it belongs to a closed set: the five the ladder can hand, or the eight the
    //    tile has always had for its own face.
    expect(
      [...SPIRIT_WORDS, ...FACE_WORDS],
      `the Mood tile said "${word}", which is neither one of the five spirit words nor one of the tile's own`,
    ).toContain(word)

    // 2. IT MATCHES THE FACE'S REGISTER. The big painting above it is the SAME engine decision at
    //    forty times the size (`diary.facts.emotion`), and the filename carries the emotion – so the
    //    picture is what the word is checked against, which is the whole claim of the layer.
    //    The URL is `…/fem-euro-brunnet-{stage}-{emotion}.webp` (composables/kidEmotion.ts), so the
    //    emotion is legible off the page itself rather than off anything this spec was told.
    const src = await page.locator('.kid-hero-img').first().getAttribute('src')
    expect(src, 'her portrait has to be on the page for the register arm to mean anything').toBeTruthy()
    expect(
      src,
      `the tile said "${word}" (${FACE_OF[word]}) over a painting at ${src}`,
    ).toContain(`-${FACE_OF[word]}.webp`)

    expect(crashes, 'the page threw while showing her mood').toEqual([])
  })
})
