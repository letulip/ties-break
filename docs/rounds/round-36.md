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
| 2 | tablet, 768–900 | `[ ]` |
| 3 | desktop, 1024–1200 – the rail, the new shell | `[ ]` |
| 4 | the screens the design does not cover | `[ ]` |
| 5 | `responsive-decisions-2026-09.md`, the contentious calls | `[ ]` |

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
