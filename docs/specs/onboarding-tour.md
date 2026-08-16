# The first-run tour of the interface

*16.08 – the owner's report, the defect behind it, and what the marks now cover.*

## The report, verbatim

> у нас раньше был онбординг по функциям и интерфейсу для новых игроков, я это хорошо помню, а
> теперь его нет (человек не увидел ничего такого), а интерфейс не самый простой. Надо вернуть и
> покрыть PlayWright – как раз для него задача, мне кажется.

## What was actually wrong

**Not that the tour had been deleted.** `OnboardingTour.vue` was in the build, wired in `App.vue`,
and `e2e/smoke.spec.ts` had been clicking its **Skip tour** button since S0 – it passes. On a browser
profile that has never seen the app, walks the wizard and answers the marks in one sitting, the tour
is there. Reproduced at 375x667 in real Chromium before anything was changed: five marks, all on
screen, all reachable.

**The gate was a one-shot, and it was spent whether or not the player ever answered.**

* `stores/game.ts` set `firstEverCareer` inside `newCareer` when the careers list had been empty.
  It is ordinary Pinia state – **not persisted anywhere**.
* `App.vue` consumed it in a `watch` on `game.snapshot`: `$patch({ firstEverCareer: false })` ran
  **before** the `localStorage` check, so the signal was gone after the first snapshot transition of
  the session no matter what happened next.
* The only durable record was `tb:onboardingTourSeen`, and that key is written by `dismissTour`
  alone – i.e. only when the player presses **Skip tour** or **Got it**.

So the state *"was offered the tour, never answered it"* was unrecoverable. On the next boot the
flag was false (it does not survive a reload) and the key was absent, and both halves of the gate
said no. There was no way to ask for the tour anywhere in the app.

**Reproduction** (`e2e/onboarding-tour.spec.ts`, third test – it fails on the 16.08 code):

1. seed a week-0 career, boot – the tour is on screen;
2. read `localStorage`: **no `tb:onboardingTourSeen`**, nothing has been written;
3. reload – the career auto-loads onto Home and **the tour is gone for good**.

A phone backgrounding a tab, a player closing the app to come back later, or the worker restarting
and adopting the last committed week are all enough. Nothing exotic is required.

## The gate now

`tourWanted` in `App.vue`:

```
tourReopened || (!tourSeen && snapshot.week === 0)
```

* **`tourSeen` mirrors the durable key**, so the answer is a function of state that survives a
  reload, not an event that can be missed. The order in which the career arrives – a fresh wizard, an
  autosave adopted at boot, a worker restart – cannot change it. That is what makes it robust rather
  than lucky: the old gate was correct on exactly one of the orderings the app really produces.
* **`week === 0` is a sentence, not a tuned number**: she has not played a single week yet. A player
  who has advanced a week has already found the button the tour ends on, so from there the marks stop
  being onboarding and start being an interruption.
* **They really do interrupt.** `.coach-tour` is `pointer-events: none`, but the CARD is not.
  Measured, not assumed: without the week bound, `e2e/tournament-entry.spec.ts` went red with
  Playwright naming `.coach-tooltip` as the element intercepting a click on **Enter** over a mature
  career.
* **`tourReopened`** is More's *Show the tour* – it outranks both the key and the week bound. A bound
  that can pass a player by needs a door they can open themselves, or it is just a narrower version
  of the same bug.

The tour is also in `Popup` now (`composables/blockingOverlay.ts`), so it inherits round-21 #9's rule:
it waits for a blocking question and for a tournament reveal like every other report.

**Open decision for the owner:** `week === 0` keeps the marks off every career already under way,
including his own. If he would rather every existing device be offered the tour once on its next
boot, drop the `snapshot.week === 0` clause – one line – and seed `TOUR_ANSWERED` in the e2e specs
that are not about onboarding.

## What the marks cover, screen by screen

Eleven steps, up from five. Every anchor is either the bottom bar or something on `HomeScreen` –
the tour does not navigate, it measures `document.querySelector` against the screen that is up.

| # | anchor | what it explains |
|---|---|---|
| 1 | `home-header` | **what the game is** – you raise the player, you do not play the matches – and that Home is her diary |
| 2 | `kid-avatar` | her full profile: skills, body, school, coach |
| 3 | `home-news` | the bell (the week just gone) and the envelope beside it (offers and letters, with its dot) |
| 4 | `family-budget` | the money is yours: entry fees, travel, coaching, kit |
| 5 | `next-tournament` | the This-week screen: the training plan and the last week's recap |
| 6 | `tab-play` | Season – where tournaments are entered, what they cost, the standings |
| 7 | `tab-calendar` | her year: entries, exams, holidays, rest weeks |
| 8 | `tab-stats` | ranking and skills over time |
| 9 | `tab-trophies` | the titles she has won |
| 10 | `home-settings` | the gear – sound, animations, saves, careers, **and this tour again** |
| 11 | `next-week` | the week button, and the loop: plan, enter, play, repeat |

## The card cannot leave the phone

`docs/review/05-ux-ui-pwa.md` filed *"[MEDIUM] Coach-mark tour can point off-screen"*: the old
`tooltipStyle` clamped the horizontal axis only, so a card hung off an anchor low on the page took
**Skip** and **Next** with it. Lengthening the tour made that a live risk rather than a latent one.

`composables/coachTour.ts` owns the geometry now: preferred side, then the other side, then a clamp
into the viewport – the clamp last, so it is a guarantee and not a preference. The anchor is brought
into view with `scrollIntoView({ block: 'center' })` before it is measured, and the marks re-measure
on scroll as well as on resize.

`tests/component/onboarding-tour.test.ts` is the guard CLAUDE.md's round-20 #3 gotcha asks for, at
375x667 and 320x568, and it is mutation-verified: dropping either clamp turns it red by name.

## Where it is tested

| claim | layer |
|---|---|
| the marks' copy, the walk, both exits, the card's box on a phone | `tests/component/onboarding-tour.test.ts` |
| the tour is offered, walked and dismissed by a new player | `e2e/onboarding-tour.spec.ts` |
| it does not come back on the next boot | `e2e/onboarding-tour.spec.ts` |
| **an unanswered tour still does** – the regression | `e2e/onboarding-tour.spec.ts` |
| More can ask for it again | `e2e/onboarding-tour.spec.ts` |
| every anchor resolves in a template that renders it | `tests/round13-nav.test.ts` |
| the tour waits behind blocking questions and reveals | `tests/blocking-overlay.test.ts` |
