---
type: round
status: current
area: rounds
canonical: false
last-reviewed: 2026-09-04
---

# Round 36 – the interfaces on tablet and desktop (04.09.2026)

The spec is [`docs/specs/responsive-2026-09.md`](../specs/responsive-2026-09.md), approved by the
owner on 03.09 – «скорректируй план пожалуйста и запускай в работу весь план пошагово». It carries
his breakpoint ladder, his acceptance criterion and the five phases. This ledger tracks them.

Status: `[x]` shipped · `[~]` answered, nothing to build · `[>]` in flight · `[ ]` open ·
`[?]` waiting on him · `[!]` REOPENED

| phase | what it is | status |
| --- | --- | --- |
| 1 | the parity harness + the container follows his ladder | `[x]` **shipped, this document** |
| 2 | tablet, 768–900 | `[x]` **shipped, this document** |
| 3 | desktop, 1024–1200 – the rail, the new shell | `[ ]` |
| 4 | the screens the design does not cover | `[ ]` |
| 5 | `responsive-decisions-2026-09.md`, the contentious calls | `[>]` opened by phase 2, twelve rows – it is written AS the work happens, so it closes with phase 4 |

---

## `[x]` PHASE 1 – the harness and the container

**Nothing about the app's appearance changed at any width it already supported, and that is measured
below rather than asserted.** Six files: `e2e/parity.spec.ts` (new) and this ledger (new); the
breakpoint ladder in `src/style.css`; `docs/specs/e2e-coverage.md` (two journey rows and a `parity`
entry on all ten screen rows, so the new spec is inside the coverage map's own rot alarm);
`tests/component/round14-group-c.test.ts` (the R14-9 pin, re-aimed – see below); and a row in
`docs/rounds/README.md`.

⚠ **A seventh file was corrected, and it was already broken when this phase started.**
`docs/specs/responsive-2026-09.md` – this round's own approved spec, committed by the session before
– carried `status: approved` and `canonical: true`, and `npm run check` was RED on `round/36` before
a line of phase 1 existed, with four errors: `approved` is not one of the audit's statuses
(`current` / `draft` / `reference` / `audit` / `historical` / `superseded`), a canonical document
must be `current`, must carry a `## Current truth` section, and **area `ui` already has a canonical
document** – `docs/context/ui-and-design.md`. Fixed to `status: current` / `canonical: false`, which
is what 97 of the 99 documents in `docs/specs/` say. **Frontmatter only; not one word of his spec
was touched.**

⚠ **And shipping this ledger obliged one more edit, by design.** `scripts/doc-facts.mjs` sources the
live wave from the newest file in `docs/rounds/`, so `docs/now-next-later.md`'s machine-checked
«⚙ THE LIVE WAVE IS ROUND 35» line went stale the moment `round-36.md` existed. Updated to 36 with a
paragraph naming this wave – which is the router working as intended rather than a chore.

---

### ⭐⭐⭐ THE FINDING THAT CHANGES WHAT EVERY LATER PHASE IS WORKING WITH

**`--app-max-width: 880px` is the FRAME. The column is 520.**

The spec's own "what the app does today" table records `--app-max-width` at 880px and concludes «the
app is a phone column that never grows», which is right about the conclusion and wrong about the
number. `--app-max-width` caps `#app` – the padded frame. What a player actually reads is
`main.app-content` INSIDE it, and that has been capped at a flat `520px` since the app shell was
written. Measured in Chromium on `origin/main`:

| viewport | `#app` | `.app-content` – what he actually sees |
| --- | --- | --- |
| 375 | 375 | **343** |
| 576 | 576 | **520** |
| 768 | 768 | **520** |
| 1280 | 880 | **520** |

So on his 1280px screen the app today is a **520px column with 380px of empty page down each side**,
not the 880 the token suggested. Three consequences, and they are the reason this is at the top:

1. ⚠ **Widening only `#app` would have changed NOTHING on screen** – and the parity harness would
   have stayed green while doing it. That is the quietest way a responsive pass can be vacuous: a
   ladder that ships, measures clean, and moves nothing.
2. **There is more room to fill than anyone budgeted for.** Phase 3's rail and card set are being
   laid into a column that has to grow 520 → 1168, not 880 → 1168.
3. **Five rules carried that literal `520px`, not one** – counted, not quoted: `.app-content`,
   `.tab-bar`, `.next-week-bar`, `.recovered-banner`/`.stop-toast` and `.update-banner`. Three are on
   the token now; the two notice strips are deliberately left at 520 – see the decisions below.

---

### THE LADDER, AS SHIPPED

His ruling, unchanged: `< 768` mobile · `768–900` fluid · `901–1023` fixed at 900 and centred ·
`>= 1024` fluid to 1200, then capped.

Three tokens in `src/style.css` – `--app-shell-max` (the frame), `--app-col-max` (the column),
`--app-bar-max` (the two fixed bars) – and three media blocks, at 768, 901 and 1024. **Every rule
starts at 768, so below it not one computed value moved.**

| viewport | `#app` | column | tab bar / CTA |
| --- | --- | --- | --- |
| 375 / 520 / 576 | 375 / 520 / 576 | 343 / 488 / 520 | unchanged |
| 768 → 900 | grows with the window | 736 → 868 | tracks the column exactly |
| 901 → 1023 | **900, centred** | **868** | 868 – ⭐ the plateau holds, the offset grows 16.5 → 77.5 |
| 1024 → 1200 | grows | 992 → 1168 | tracks |
| 1280 / 1440 | **1200, centred** | **1168** | 1168 |

#### ⚠⚠ THE LADDER WAS BUILT THE WRONG WAY ROUND FIRST, AND A TEST CAUGHT IT

Worth recording in full, because the wrong answer was the more *principled*-looking one.

`--app-max-width` has two consumers besides `#app`, both full-screen takeovers outside the frame:
the onboarding wizard (R14-9) and the tour briefing. `tests/component/round14-group-c.test.ts` pins
them to that token with the sentence *"a hard-coded 880 here would be a second cap that drifts the
first time the app frame moves"* – so the first build laddered `--app-max-width` itself, reasoning
that this was that time and that splitting the token was the drift the pin forbids. It even looked
confirmed: that pin stayed green with no edit.

**`tests/component/tour-briefing.test.ts` went red instead**, with the whole argument in one line:

    ⭐ on a phone it is FULL WIDTH, and on desktop no wider than the content container
    AssertionError: capped at the content container, not at the room: expected 1200 to be 880

That is round-20 #3's own mutation-verified measurement, and it was right. Laddering the shared
token made the tour briefing – a **dialog** – 1200px wide on a desktop, and the onboarding wizard
with it. Phase 1's contract is «nothing moves yet»; how wide an onboarding column should be on a
1440px monitor is a design decision, and it belongs to phase 3's shell and phase 5's review
document, not to a container change that was supposed to be invisible.

**So the ladder moved onto its own token, `--app-shell-max`, and the two takeovers keep the 880 they
have today at every width.** ⚠ And re-reading R14-9's pin, the reversal does not violate it: what it
forbids is a **hard-coded 880 in a component** – the two takeovers still share ONE NAMED TOKEN and
still spell no number of their own. It was never a claim that the frame and the takeovers must be
the same number forever. `round14-group-c.test.ts` was edited to say which half of it moved and
which did not; `tour-briefing.test.ts` needed no edit at all, which is the signal that the second
formulation is the right one.

---

### `[x]` THE PARITY HARNESS – `e2e/parity.spec.ts`

His own suggestion – «возможно здесь как раз нас могу выручить playwright?» – and it is the stronger
instrument: `tests/component/` runs in happy-dom, which has no layout engine, so a mounted test can
only prove a node EXISTS. A real browser proves it is in the accessibility tree, has a box, and is
reachable.

**WHAT IT COVERS: all ten screens, at 375 / 768 / 900 / 1280, one test per screen.**

`HomeScreen` · `SeasonScreen` · `CalendarScreen` · `StatsScreen` · `TrophiesScreen` · `MoneyScreen` ·
`MoreScreen` · `KidScreen` · `CoachMarketScreen` · `ThisWeekScreen`

**HOW THE LIST IS DERIVED, because a hand-written one is one forgotten screen away from proving
nothing:** it is `readdirSync('src/components/screens/')`, the same closed set `coverage-map.spec.ts`
already holds against this repo. Every file in it must have a station – a door a player uses and an
anchor that proves the walk arrived – or the test `every screen in src/components/screens/ has a
station in this file` goes red **naming the file**. A screen added by phase 2, 3 or 4 cannot join the
app without joining this walk.

**THE FINGERPRINT**, per screen per width: every interactive element and every heading by ROLE and
ACCESSIBLE NAME (Playwright's own aria snapshot, which is already visibility-filtered –
`display:none`, `visibility:hidden` and `aria-hidden` are absent from the a11y tree), plus every icon
and painting by the FILE IT LOADS. The second half exists because our icons are deliberately
invisible to the first: `ui/AppIcon.vue` draws a masked `<span aria-hidden="true">`, so «все иконки
наши» would otherwise be unmeasured.

#### ⚠ WHAT IT CANNOT PROVE, stated in the file itself

It proves **presence, visibility and reachability**. It does not prove the layout is good. It cannot
see a control that is on screen but ugly, mis-aligned, overlapping or too small for a thumb – that
judgement is his, and he has said so: «я утром буду всё уже сам глазами смотреть». Three narrower
holes, each real: it is **blind to order** (the fingerprint is a multiset, so a wide layout may
reshuffle freely – deliberate, since rearranging is the wave's job); it is **blind to a decorative
glyph that carries no file**; and it **sees one state per screen**, so a control that only exists in
a branch nobody walks is one it cannot answer for.

#### THE FOUR-WIDTH RESULT – green, and every screen the same size at every width

`npm run test:e2e -- -g "1 to 1"` → **11 passed, `E2E_EXIT=0`** (read from the log file, not from a
pipe and not from a background notification – the notification for the run before it said *exit code
0* while the log said `E2E_EXIT=1`, which is CLAUDE.md's gotcha (c) happening).

Fingerprint size per screen at 375, and **identical at 768, 900 and 1280**:

    Calendar 19 · Stats 20 · ThisWeek 25 · Kid 31 · More 32 · Money 35
    Season 46 · Home 52 · Trophies 59 · CoachMarket 60

`FINGERPRINT_FLOOR` is set at 15 off those numbers – under the smallest with room to spare. It is the
tripwire for a walk that collapsed: **four empty sets are equal**, so a station that silently failed
to arrive would pass forever. Two more mechanisms guard the same hole: every station asserts arrival
against a role-and-name anchor before it measures, and the viewport height is fixed at 900 for all
four widths so "more rows fit" can never masquerade as a difference.

#### ⚠ ONE RED RUN ON THE WAY, AND IT MADE THE HARNESS STRONGER

The first run failed on `CoachMarketScreen.vue`: fifteen coach portraits "appeared" at 768 that were
"missing" at 375. Every one was a false alarm. The portraits are `loading="lazy"`, the market is a
long list, and a narrow column is a TALLER page – so at 375 the ones far below the fold had never
been fetched, measured 0x0, and dropped out. Nothing about the app differed; the measurement did.

The fix is the stronger claim rather than an exemption for lazy images: the walker now rides the page
to the bottom in viewport-sized steps, comes back, and waits for every image to finish before
measuring. «Всё, что есть на мобиле» is about what the SCREEN holds, not about what happens to be
inside the first 900px of it.

#### ⭐⭐ THE DELIBERATE BREAK – the harness has been seen to fail

A harness whose failure has never been seen is not a harness. Home's Settings gear was hidden at
desktop only and the suite re-run:

```css
@media (min-width: 1024px) { .diary-tool { display: none } }   /* inside HomeScreen.vue, scoped */
```

→ `BREAK_EXIT=1`, and it names them:

```
HomeScreen.vue: these are on the phone at 375px and NOT at 1280px.
«всё, что есть на мобиле, должно быть 1 к 1 на других форматах»
  + "button \"Go to the news feed\""
  + "button \"Open the inbox\""
  + "button \"Settings\""
  + "img \"A letter waiting on an answer\""
  + "svg <unclassed> ×3"
```

Reverted immediately; `HomeScreen.vue` verified byte-identical afterwards.

⚠ **AND THE FIRST ATTEMPT AT THE BREAK WAS INERT, which is its own lesson.** The same rule appended
to `src/style.css` globally left the suite GREEN – `HomeScreen.vue`'s own scoped `.diary-tool` rule
carries a `[data-v-…]` attribute and outranks it, so the gear never hid. A mutation that does not
mutate looks exactly like a harness that does not bite. The rule was moved inside the scoped block –
where a real phase-2 change would live – before the verdict was believed.

---

### `[x]` NOTHING MOVED AT A WIDTH THE APP ALREADY SUPPORTED – measured, not asserted

The control is `origin/main`'s `src/style.css` swapped into this tree and built (CLAUDE.md: the
control is your change reverted, in your own tree). Both builds were driven through the same walk of
all ten screens, and **every element in the document** was censused – tag, class, document-order
index, and its box to 2dp.

| viewport | screens | element boxes | boxes that moved between `origin/main` and this branch |
| --- | --- | --- | --- |
| **375** | 10 | 2321 | **0** |
| **520** | 10 | 2319 | **0** |
| **576** | 10 | 2319 | **0** |
| 768 | 10 | 2319 | 2169 |
| 1280 | 10 | 2319 | 2175 |

⚠ **The two wide rows are the point of the table, not a footnote.** A null result is a claim and needs
the same provenance as a positive one; without a demonstrated detector, "0 boxes moved" is equally
consistent with an instrument that is blind. The same census, on the same screens, in the same run,
moves ~2,170 boxes at each width where the ladder bites. So the three zeros are a measurement.

The computed caps, `origin/main` → this branch, confirm the mechanism and the finding at the top:

```
 375   main  #app 880px->375px  .app-content 520px->343px   head  identical
 576   main  #app 880px->576px  .app-content 520px->520px   head  identical
 768   main  #app 880px->768px  .app-content 520px->520px
       head  #app 100% ->768px  .app-content 100% ->736px
1280   main  #app 880px->880px  .app-content 520px->520px
       head  #app 1200px->1200px .app-content 100%->1168px
```

⚠ A curiosity worth recording, because it is NOT a defect and the next person will meet it: at 375
Home carries two more elements than at 768 – `button.diary-kid-hint` and `span.note-dot`. It appears
**identically in both arms**, so it is not this change. It is state, not width: visiting `KidScreen`
and `ThisWeekScreen` earlier in that walk dismisses the hint and marks the recap seen. The parity
harness is immune to it because each station gets **its own test and its own career**, and that
isolation is now load-bearing rather than incidental.

---

### Decisions taken in phase 1 that later phases inherit

1. **The frame's ladder is `--app-shell-max`; the two takeovers stay on `--app-max-width` at 880.**
   Argued above. ⭐ **A row for `responsive-decisions-2026-09.md` in phase 5**: should the onboarding
   wizard and the tour briefing follow the frame out to 1200 on a desktop? Phase 1's answer is «not
   in this phase, and not by accident» – it is his call, and the token is the single place it gets
   made.
2. **The tab bar and the floating CTA follow the column.** `src/style.css` already said the bar
   «hugs the content column»; a 520px bar under a 1168px column would be the container change
   half-applied. They track it exactly at every width – measured, not assumed.
3. **The two top notices stay at 520.** `.recovered-banner` / `.stop-toast` and `.update-banner` are
   notice strips, not the shell; a 1168px-wide toast is a redesign nobody asked for. They are
   centred in the column and read as deliberate. Revisit in phase 3 if he says otherwise.
4. **`e2e/parity.spec.ts` is the viewport-aware sibling the spec's phase-1 bullet asks for.**
   `tests/component/fits.ts` models boxes in happy-dom because it has no layout engine; this measures
   them in a browser. Both stay – they answer different questions.

### Open at the end of phase 1

- `[?]` do the onboarding wizard and the tour briefing follow the frame to 1200 on a desktop, or
  stay at 880? Phase 1 left them at 880 deliberately – decision 1 above, and a phase-5 row
- `[ ]` phases 2–5, unstarted

---

## Gates

Run one at a time on a quiet machine – never concurrently, per CLAUDE.md's contention gotcha – and
**every exit code read out of the log file**, never from a pipe and never from a background task's
completion notice. Both lies showed up in this round: the notification for the first harness run said
*exit code 0* over a log that said `E2E_EXIT=1`, and the wrapper for the final chain said *exit code
0* over `CHECK_EXIT=1`.

| gate | result |
| --- | --- |
| `npm run test:e2e` | **`E2E_EXIT=0`** – the whole browser suite, parity included |
| `npm run test:component` | **`COMPONENT_EXIT=0`** – 1304 tests |
| `npm run test:quiet` | **`QUIET_EXIT=0`** |
| `npm run check` | **`CHECK_EXIT=0`** – red before this phase on the spec's frontmatter, above |

⚠ **`npm run test:sim` was NOT run** – the standing regime (owner's ruling, 22.08) puts it in front of
a PR assembly, and this phase touches no engine code. It belongs to whoever assembles the round's PR.

---

## `[x]` PHASE 2 – THE TABLET BAND, 768–900

His design for it, in his own words: «планшеты – это по сути широкий телефон, hero image на home
будет НЕ квадратной, но все оверлеи с текстом остаются как у нас.»

**Seven files of app, five of tests, two of documents.** `src/style.css` (the `--hero-aspect` rung
and the coach market's tablet grid); `HomeScreen.vue` and `NextTournamentPanel.vue` (the two heroes,
onto one token); `SeasonScreen.vue` (the week, two cards to a row); `WeekRecapCard.vue` (a picture
that had stopped growing at 390px); `CalendarScreen.vue` and `ThisWeekScreen.vue` (the two floating
CTA boxes phase 1's own decision missed). Tests: `fits.ts` gains `TABLET`, and the tablet arms went
into the four files that already own each mechanism – `round34-week-stack`, `round18-coach`,
`round30-next-tournament-layout`, `vacation-crop`. Documents: `docs/specs/responsive-decisions-2026-09.md`
(new, twelve rows) and this ledger.

⭐ **No new component, no new icon, no new string.** The diff is nine CSS rules and one token; every
mechanism it moves was already in the tree, and `git diff` on the templates is empty except for
nothing at all – not one `.vue` template line changed in this phase.

---

### WHAT MOVED, PER SCREEN, MEASURED

Boxes are `x,y,w,h` in Chromium at a 900px-tall viewport, off the same walk of all ten screens the
mobile-identity census below uses. `before` is phase 1 as shipped (`db331979`).

| | 375 | 768 before → after | 900 before → after |
| --- | --- | --- | --- |
| the column (`.app-content`) | 343 | 736 (phase 1) | 868 (phase 1) |
| **Home** hero | 375×375 | 768×**540** → 768×**400** | 900×540 → 900×**468.75** |
| **Season** week card | 343 | **736** → **362** | 868 → **428** |
| **Season** tournament card | 343 | **736** → **362** | 868 → **428** |
| **Coach market** row | 343 | **736** → **364** | 868 → **430** |
| **This week** recap painting | 343×251 | **390×286** → **736×286** | 390×286 → **868×286** |
| Calendar / This-week CTA box | 375 | **520** → **736** | 520 → **868** |

…and the pages got shorter, which is the whole of «больше видно одновременно»:

| page height | 768 before → after | 900 before → after |
| --- | --- | --- |
| Home | 1553 → **1413** | 1553 → **1482** |
| Season | 3746 → **2784** | 4122 → **2936** |
| Coach market | 3001 → **2388** | 3001 → **2191** |

#### Season – the two numbers he asked for by name

«1 неделя = 1 ряд, максимум 2 карточки видно, свайп для 3+», frame `AD-season-tablet-768.png`.

* **Two cards fill the row exactly.** At 768 each card is `calc(50% - 6px)` = 362px, and
  362 + 12 + 362 = **736**, the whole column. At 900: 428 + 12 + 428 = **868**. Both cards are on
  screen and nothing hangs past them.
* **Three or more shrink so the third shows.** `calc(44% - 6px)` = 317.8px at 768, so two cards and
  the gutter come to 647.7 and **88px of the third is showing** – the phone's own affordance (its
  card is 88% and the next card's edge is what tells a thumb to swipe), spent on the same 12%. At
  900 the sliver is 104px. ⚠ **The swipe itself is round 34's and was not touched**:
  `.week-stack.swipeable` carries `overflow-x: auto` and `scroll-snap-type` outside any media query,
  and round 34's own phone arm still asserts them.
* **A one-card week is half a row too** – the frame's own answer, and the most contentious call in
  the phase. **D2** in the decisions document, with the cost measured and a one-line reversal named.

#### Coach market – «4 карточки»

Two to a row, so the first tier's four cards are in the first screenful, which is what AJ draws.
The card is 364px against the phone's 343 – **nineteen pixels** – which is why the portrait strip
stays at 62px: his «если влезает» is a condition and it is not met (**D3** and **D4**).

#### The two heroes, joined by a token

`--hero-aspect` is `1 / 1` below 768 and `768 / 400` above it, and BOTH `.diary-hero` and `.nt-hero`
read it – because «Tournament (AF): the image takes the same proportion as the home hero» is a join,
not a coincidence. Round 30 #6 had already said «по примеру главной» and the two shapes agreed only
by both spelling `1 / 1`; they cannot drift now.
⭐ **Every text overlay stayed where it was, for free**: they are all `position: absolute` against the
hero's own box, so a shorter hero moves none of them relative to the picture.

---

### ⚠⚠ THREE THINGS THIS PHASE FOUND THAT WERE ALREADY BROKEN

**1. The week recap's painting stopped growing at 390px.** `.recap-art` measures 343×251 at 375 and
then **390×286 at 520, 576, 768, 900 AND 1280** – a block with an `aspect-ratio` and a violated
`max-height` has its WIDTH transferred back down the ratio. So at 768 a 390px photograph sat under
the 736px paper note that rides on it. The cap's own comment («capped at D's number so a tablet does
not turn the story into a poster») describes a 736×286 BAND, which is what `width: 100%` now gives.
⚠ **Fixed at ≥768 only.** 520 and 576 carry the identical collapse and phase 2 may not move anything
below 768 – it is left, deliberately, and it is **D11**.

**2. Two of the three floating CTA boxes were still 520px.** Phase 1's decision 2 said «the tab bar
and the floating CTA follow the column» and put `.next-week-bar` on `--app-bar-max`; `.cal-go`
(Calendar) and `.week-proceed` (This week) are the same six declarations in two SFCs and kept a
literal 520. Both are on the token now. **Nothing on screen moves** – the button inside each is
centred, so the box was wrong without being visible – which is exactly why it survived phase 1.

**3. `happy-dom` reads media queries, at 1024, and two shipped pins had never noticed.**
`round30-next-tournament-layout.test.ts` asserted `.nt-hero` is `1 / 1` **at happy-dom's default
1024px** – a width the app had no rule for, so the answer happened to be a phone's. It is width-explicit
now (`PHONE` for the square, `TABLET` for the tablet shape) and that is a fix to the test, not a
loosening of it. ⭐ The same is true of round-18 #2's two coach-strip measurements: mutating `.cm-art`
to 78px inside the tablet block reddens BOTH of them, so they have been guarding this band all along.

**4. …and a fourth thing was caught by a pin, on this phase's own comment.** `round13-nav.test.ts`
reads `ThisWeekScreen.vue` and `CalendarScreen.vue` as TEXT and refuses the shell bar's class name in
either of them – the pin that keeps the week-advance act in the App shell. Both new comments named
that class while explaining that these two boxes are copies of it, and the unit suite went red on a
sentence. **The comments were reworded; the pin was not touched.** It is right to be that blunt – it
cannot tell a comment from markup, and the thing it protects is a career that cannot be advanced
twice – so the note now says which pin it is walking around and why.

Three happy-dom facts were measured on the way and are written down beside `TABLET` in
`tests/component/fits.ts` and in the rules themselves, because each cost a wrong answer first:

* a media query is evaluated on an element's **first computed-style read and then cached** – so
  `setViewport` must come BEFORE the mount, or the measurement reads the previous screen;
* `calc((100% - 12px) / 2)` is **dropped entirely** (the property comes back as `''`), which is why
  the Season widths are spelled `calc(50% - 6px)`. A form the mounted gate cannot read is a rule
  with no test;
* at **equal specificity a rule inside `@media` loses to one outside it** – the reverse of what a
  browser does. The Season rules therefore win on specificity (`.event-cards …`) rather than on
  source order, which is correct in both engines.

---

### `[x]` NOTHING BELOW 768 MOVED – re-run, and still zero

The instrument phase 1 built and did not commit, rebuilt: every element in the document at all ten
screens, censused as tag + class + document-order index + box to 2dp, at six widths, one fresh career
per width. Arm A is phase 1's shipped head (`db331979`), arm B is this phase.

| viewport | element boxes | boxes that moved, phase 1 → phase 2 |
| --- | --- | --- |
| **375** | 2321 | **0** |
| **520** | 2321 | **0** |
| **576** | 2321 | **0** |
| 768 | 2321 | 709 |
| 900 | 2321 | 707 |
| 1280 | 2321 | 502 |

**6,963 boxes across the three mobile widths, and not one of them moved.** The three wide rows are
what makes the three zeros a measurement rather than a blind instrument – the same census, the same
screens, the same run.

⚠ 1280 moves 502 rather than 709 because Home's hero does not change there: at 1280 the frame is
1200 wide and `max-height: 60vh` already clamped the square to 540 – the same 540 the ratio yields.
The desktop band is phase 3's.

### ⚠ THE ANTI-VACUITY CHECK, AND THE HONEST ANSWER IS NOT THE ONE THAT WAS ASKED FOR

Phase 1 reported **2,169** boxes moving at 768 between `origin/main` and its own head. This phase's
instrument reproduces that: a third arm, C, built by putting `origin/main`'s `src/` into this tree,
scores **2,170** (the one-box difference is 2,321 boxes here against phase 1's 2,319 – its walk
carried two state-dependent elements on Home that a fresh career per width avoids). So the
instruments agree and the comparison is real.

**But the cumulative count barely moves: `origin/main` → phase 2 is 2,178 against phase 1's 2,170 –
eight boxes.** That is not phase 2 doing nothing; it is the metric **saturating**. Phase 1's ladder
already moved 93.5% of every box on the app, and a box that has already moved cannot move again in a
count. Only **8 boxes at 768** (7 at 900) are ones phase 1 left where `origin/main` had them.

So the count is answered with a second measurement it cannot fake – **total displacement**, the sum
of |Δx| + |Δy| + |Δw| + |Δh| over every box:

| at 768 | boxes | pixels moved |
| --- | --- | --- |
| `origin/main` → phase 1 (the container ladder) | 2,170 | **497,232** |
| phase 1 → phase 2 (this phase) | 709 | **448,651** |

**Phase 2 moves 90% as much geometry as the whole container ladder did, on a third as many boxes.**
At 900 it is 523,154px against 783,123. That is the number this phase should be read by; the
cumulative count is the wrong instrument for anything after phase 1 and saying so is part of the
measurement.

---

### `[x]` PARITY – green at 375 / 768 / 900 / 1280, on every screen

`e2e/parity.spec.ts` was run against every change as it was made, not once at the end. Nothing
appeared and nothing went: the census above records **2,321 element boxes at every one of the six
widths in both arms**, which is the same claim from the other side – phase 2 changed where things
are, never whether they are.

### THE DECISIONS DOCUMENT – `docs/specs/responsive-decisions-2026-09.md`, twelve rows

Phase 5's document, opened here and written as the work happened. Four of the twelve are marked
`[?]` – the ones where his eyes could reasonably change the answer:

| | |
| --- | --- |
| **D1** `[?]` | Season SWIPES; the design's §6 explicitly rejected swipe rows in favour of a grid. **His instruction beat his design.** |
| **D2** `[?]` | A one-card week is half a row – AD's own answer. ⚠ The frame has three week rows; a season has forty-eight, and in the `pro` career every one offers a single choice, so **the right half of the calendar is empty down the page**. The cost is measured and the reversal is one line. |
| **D3** | «4 карточки» read as four on screen (two per row), not four per row. |
| **D4** | The coach portrait stays 62px – his «если влезает» is not met at 362px, and two shipped rules (round-18 #2's mask geometry, `coach-match-edge.md` §4's anti-shopping rule) stand behind it. |
| **D5** | Our market shows sixteen coaches where AJ shows eight – **his acceptance criterion forbids the frame**. |
| **D6** | The hero's tablet shape is the DESIGN's 400px, expressed as a ratio. The one place this phase took the design's number over ours, because ours was the square he asked us to stop drawing. |
| **D7** | «Her own account» is ours with the photograph; AL draws it without one. Not one declaration touched. |
| **D8** `[?]` | Home's news feed stays ONE column; AB and the handoff both give it two. |
| **D9** | Home's season strip keeps its «…»; the design opens all 17 rungs. ⚠ **His two instructions collide** – the strip renders the same seven boxes at 375 and 768, so opening it at 768 alone would put controls on the tablet that are not on the phone and fail the parity harness by name. |
| **D10** | The recap painting grows to the column – a defect fix on a screen his phase-2 list does not name. |
| **D11** | …and the same collapse at 520/576 is deliberately left, because nothing below 768 may move. |
| **D12** `[?]` | Her Kit keeps its 2×2 rung grid; AP stands it four in a row. Same question as D8: **does «widen the column» include re-flowing a grid the extra width has made loose?** One answer settles both. |

### Gates – phase 2

Run one at a time, and **every exit code read out of the log file**, never from a pipe and never from
a background task's completion notice. Both lies fired again in this phase: the wrapper reported
*exit code 0* over a chain whose logs said `CHECK_EXIT=2` and then `QUIET_EXIT=1`, and there were two
real failures inside it.

| gate | result |
| --- | --- |
| `npm run check` | **`CHECK_EXIT=0`** – the whole pre-push gate, 1314 component tests and the build |
| `npm run test:quiet` | **`QUIET_EXIT=0`** – green in 332s |
| `npm run test:component` | **`COMPONENT_EXIT=0`** – 1314 tests (1304 before this phase; ten new arms) |
| `npm run test:e2e` | **`E2E_EXIT=0`** – 46 tests, the eleven parity walks among them |

⚠ **One run of `npm run check` exited 1 with an EMPTY LOG** – no output at all, not one assertion,
not one `vue-tsc` line. Re-run unchanged in the same tree it exited 0 and printed all of it. That is
CLAUDE.md's contention gotcha wearing its quietest face: a failure with no failing thing in it is the
machine, and the way to tell is to run it again rather than to go looking for a cause.

⚠ **`npm run test:sim` was NOT run** – the standing regime (owner's ruling, 22.08) puts it in front of
a PR assembly, and this phase touches no engine code. It belongs to whoever assembles the round's PR.

### The ten new test arms, and every one is mutation-verified

| file | arms | what a mutation reddened |
| --- | --- | --- |
| `round34-week-stack.test.ts` | 4 | the tablet width back to 88% → the two-card arm alone; the `:has()` width raised → the three-or-more arm alone; the week-card width dropped → the non-tournament arm alone; the whole media block moved out of reach → all three, with the phone arm still green |
| `round18-coach.test.ts` | 3 | one grid column → the two-up arm alone; the row's margin restored → the gutter arm alone; the portrait widened to 78px → the new arm AND round-18 #2's own two strip tests |
| `round30-next-tournament-layout.test.ts` | 1 (+2 re-aimed) | a literal `1 / 1` back on `.nt-hero` → the tablet arm; one on `.diary-hero` → the join |
| `vacation-crop.test.ts` | 2 | `width: 100%` removed → the tablet arm; moved out of the media query → the phone arm |

⚠ **And one mutation of mine went green when it should not have, recorded because it nearly passed as
evidence**: `width: 88%` inserted ABOVE the tablet width in the same rule changes nothing, because
the later declaration wins. A mutation has to be a replacement, not an addition.

### Open at the end of phase 2

- `[?]` **D1, D2, D8, D12** – his morning, and D2 is the one to look at first
- `[?]` the onboarding wizard and the tour briefing at 880 vs 1200 (phase 1's decision 1)
- `[ ]` `.recap-art`'s 390px collapse at 520 and 576 (D11) – a phase-4 or an owner call
- `[ ]` phases 3, 4 and 5
