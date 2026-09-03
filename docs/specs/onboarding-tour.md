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

---

# The tour stops when the screen changes – and a prologue player never meets it

*02.09 – phase 5 of `childhood-prologue-build-2026-09.md` §6, both halves.*

## His ruling

> про тур нам нужен В и С вместе, В будет когда пролог скипают, а С будет в прологе … после него В
> уже не будет.

Two paths into a career, and each gets its own answer:

```
new game -+- the prologue (default) -- 9 cards -- the handover -- the game, and NO tour   (C)
          +- skip ------------------- the existing wizard ------- the game, WITH the tour (B)
```

**C is not a feature.** It is phases 2–4 doing their job: the nine cards teach the interface as they
go, so a player who walks the childhood arrives already onboarded and must never be shown eleven
coach marks explaining the same screen. **B is the repaired tour**, and it now exists only for the
player who takes the way out on the first card – the wizard is the skip branch («это создание
персонажа будет как альтернативная ветка у нас при скипе пролога»).

## B – what was wrong, measured on `main` on 01.09

`.coach-tour` is `position: fixed`, full-screen, `z-index: 65`, `pointer-events: none` –
**deliberately**, so the page beneath can still scroll; the note beside the scroll listener says so.
The cost is that taps pass through too, and the shell swaps the screen underneath the marks.

Reproduced: with the tour up, tapping **Stats** and pressing **Next** four times walked all four of
*You are the parent*, *Her page*, *News and letters* and *The money is yours* – while the player
stood on Stats the whole time, **with no highlight cut into the overlay at all**. Every anchor those
four name lives on Home, so `document.querySelector` returned nothing and the spotlight hid itself.
The tour could never break *visibly*; it just became untrue.

## The repair, and the one that was refused

⭐ **If the screen changes, the tour ends.** `OnboardingTour.vue` takes the shell's `tab` as a
`screen` prop, records the screen it opened over, and ends the moment that moves: it emits `done` –
the same exit **Skip tour** takes, so the device flag is written – and renders nothing further. A
wrong tour becomes no tour, which is strictly better.

⚠ **The click-capturing overlay was NOT built**, and the `pointer-events: none` stays. An overlay
that ate the tap would make the tour compulsory, which is the overloaded version the owner refused
(«он не должен стать перегруженным и выбешивать») – and it would have been built inside the component
the prologue already replaces for most players.

⚠ **Not one step's words moved** (CLAUDE.md invariant 4). What changed is *when* the tour stops,
never what it says. The eleven marks are the strings that shipped in August.

**The comparison is against the screen it OPENED on, not against the previous value.** The shell
writes `tab` on paths that move nobody – the snapshot watcher sets `'home'` when a career arrives,
and `reopenTour` sets it again on its way in – so an exit that fired on a *write* rather than on a
*move* would make the tour unopenable from More.

## C – the prologue marks the device onboarded

`App.vue`'s `finishPrologue` calls `markTourSeen()` on the handover's «go on» and on nothing else:

* the **skip** on the first card emits `skip`, routes to the wizard and leaves the flag alone – that
  player gets the tour, which is exactly B;
* «raise another child» on the handover emits neither, so a childhood started over is not an
  onboarding.

It writes the **same device flag** the dismiss writes, deliberately. "Has this device been
onboarded" is one durable fact – see the gate above for why it is state and not an event – and
finishing the prologue is one of the ways of acquiring it. Anything career-scoped would contradict
the owner's «once, ever, per device» ruling and would re-offer the tour on the player's second
career.

## The way back is unchanged, and it is the reason the early exit is acceptable

More's **Show the tour** (16.08, `screenTab === 'play'`) outranks both the seen mark and the week
bound, and it re-arms after the new exit exactly as it does after **Skip tour**. It is existing copy
and none of it was touched: no new sentence reaches the screen in this phase.

## Where it is tested

| claim | layer |
|---|---|
| **the 01.09 reproduction, walked step for step** – tapping Stats ends it, and the four marks cannot be walked from another screen | `tests/component/onboarding-tour.test.ts` |
| it ends from any step and for any screen the shell can move to | `tests/component/onboarding-tour.test.ts` |
| ...and NOT on a write to `tab` that leaves the player where they were | `tests/component/onboarding-tour.test.ts` |
| the same reproduction through a **real tap on a real tab**, with Stats really opening below | `e2e/onboarding-tour.spec.ts` |
| More brings it back after the screen change took it away | `e2e/onboarding-tour.spec.ts` |
| **a prologue player never meets the tour** – absent with the shell up, the flag written, and still absent after a reload | `e2e/prologue.spec.ts` |
| the skip path still gets the tour, and it still works | `e2e/smoke.spec.ts`, `e2e/onboarding-tour.spec.ts` |

Mutation-verified, each watched failing: the `watch` on `props.screen` deleted (the reproduction
returns); `over` left unset (the marks keep drawing); the guard dropped and the watcher made
`immediate` (ten of twelve mounted tests red – a tour that ends on a *write* cannot be reopened);
`markTourSeen()` removed from `finishPrologue` (the prologue spec goes red naming the player);
`:screen` frozen to a constant in `App.vue` (both browser tests go red).
