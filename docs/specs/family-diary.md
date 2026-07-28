# The Family Diary — the game's face (28.07.2026, design document)

The owner's brief, 28.07, the sentence that owns this document:

> «У них игрок управляет характеристиками спортсмена. У тебя игрок проживает несколько лет жизни
> своей семьи. Если интерфейс начнёт ощущаться как дневник семьи, а не как таблица статистики,
> игра станет узнаваемой буквально с первого скриншота.»

And the diagnosis that precedes it: our screens already look more grown-up than the Tennis Star
reference — but they read "dry", because the reference sells dopamine and we must sell **the
feeling "this is my daughter"**. So we stop imitating a sports game altogether and amplify what it
cannot have: a family photo album × a diary × Football Manager × Apple Journal.

**The one structural decision this document makes:** numbers stop being the content. The story is
the content; numbers are the instrument that explains it. Primary surfaces (Home, Season cards,
the feed) speak in words and pictures; the full numeric truth moves to where the stats-lover
already goes for it — Stats and the wallet. Nothing is deleted; it is re-homed. (The owner is
himself «любитель статистики» — R11-4 built the per-season history FOR him. Both audiences stay
served; they just stop sharing one screen.)

---

## 0. Why this is cheap for us specifically

Three assets nobody else in this genre has are already shipped:

1. **35 emotional paintings + 35 face crops** across five age bands and seven emotions, wired to a
   pure decision (`avatarEmotion`) that already knows result freshness, win immunity, streaks,
   injury and fatigue. The art IS the emotional state machine — it has just been used as an avatar.
2. **A deterministic world that knows WHY.** Every fact a diary phrase needs is already on the
   snapshot or trivially derivable: the loss streak and its threshold, condition and what drained
   it, travel this week and its cost, the layoff span, exams, the coach setup, funds pressure,
   yesterday's scoreline. A phrase generator does not need new simulation — it needs a copy system
   over facts that exist.
3. **The invariance discipline.** Phrase selection randomises off purpose-scoped sub-streams
   (`seed:diary:<week>`), so flavour text is replay-stable and free: no MAIN-stream draws, no pins
   move, ever.

The risk is also named up front: **a diary that contradicts the simulation kills the whole effect**
(“Can't stop smiling” after a loss is worse than any table). Therefore rule one of the copy system:
every phrase is selected BY facts, and asserts nothing the facts do not carry. Tests pin this the
same way `avatarEmotion`'s truth table is pinned.

## 1. The eleven points, triaged

Each: what it is → what already exists → verdict (**NOW** = no schema, this pass · **SOON** = small
engine/schema work · **LATER** = content-heavy or depends on another slice).

### D1. A story line on every number — **NOW**
`Condition 72%` gains one line of why: “Still tired from the J30 trip.” / “She slept badly before
the exams.” Facts: last week's drain sources (travel, match count, injury, exams) are all in the
event ledger and snapshot. Shape: a pure `conditionNote(facts)` beside the bar — same architecture
as `avatarEmotion`, engine supplies facts, UI renders words.

### D2. The living photo card — **NOW**
The big painting (already emotion-correct per week) moves to the TOP of Home with one phrase under
the name: “She seems calm.” / “She didn't say much on the way home.” The phrase pool keys off the
same `AvatarEmotion` + result freshness the painting already uses — the two cannot disagree by
construction. This is the single highest-value change per line of code in the whole brief.

### D3. Words instead of percentages — **NOW**
The 10-square bar already exists; the number beside it goes. Bands get names (the availability chip
already speaks: Fit / Worn out / Injured). Exact numbers remain in Stats untouched. One decision
folded in: the bar keeps its colour ramp — words name the state, colour shows the trend.

### D4. The sense of home and place — **SOON**
“Back from Prague.” needs tournaments to HAVE places — today they have labels, not cities. Small
content addition: the calendar generator names a city per event off a per-nation pool
(`seed:venue:<eventId>`, zero MAIN draws), and home weeks say Home. Until then a NOW-grade fallback
exists: “Back from the Regional.” / “A home week.” — honest with current facts.

### D5. The feed becomes people — **NOW (re-skin) / LATER (new voices)**
The news feed's existing events regroup under personas: 🏆 the tournament speaks results, 💰 the
card speaks money, 🏫 school speaks exams, the coach speaks weekly summaries (an honest read off
the week's results). That is a re-render of data we have. NEW voices — a friend, a birthday, “she
keeps looking at her phone” — are the Phase-4 world-news + Phase-6 life-events slices already in
the backlog; the diary gives them their format in advance.

### D6. Cards, not rows — **NOW**
The Season event card gains what we can already say honestly: surface pill (done in R11), travel
estimate (done), a field-strength line from real data (`entrantPctBand` × current standings gives a
true “this field is stronger than your last one”), voiced as the coach: “This field is much
stronger.” Stars for prestige = tier, trivially.

### D7. Weekly microstories — **SOON, the copy system's main client**
One line per week, no choices, no quests: “She asked to skip one practice.” / “You argued in the
car after the match.” Engine work is small — a `diaryEntry(facts, seed:diary:week)` selector; the
real work is a WRITTEN POOL (~150-300 lines, tone-guided by the lore doc, tagged by the facts that
license them: streak≥3, first title, condition<40, funds<2000, post-injury return, exam week…).
Copy is player-facing English, short dash, no Cyrillic. The pool is content the owner can also
feed — this is where his voice enters the product directly.

### D8. Fewer icons, quieter chrome — **NOW**
The bottom nav keeps its five words; decorative iconography in headers/panels thins out. Cheap,
pure CSS/copy pass. (His observation «чем меньше иконок — тем дороже выглядит продукт» goes into
the lore doc's type section as a standing rule.)

### D9 + D12. Home as a diary page — **SOON (after D2 proves the direction)**
The full restructure: painting → name/age/current arc line → coach's one-liner → next tournament →
this week → recent memories. D2 ships the top of this page immediately; the rest lands as one
deliberate layout slice once D2/D1/D3 are felt in hand — the owner should PLAY the warm top card
before we commit the whole page to it.

### D10. Memory — **SOON, needs the one schema addition of this direction**
“One year ago — her first local final”, with the painting from that band. The event ledger prunes
at 400 rows, so memories need a durable **milestone ledger**: first title per tier, first final,
first international, worst injury, the first racket, season ranks. Captured at the moment they
happen (the wrap-up and finalize paths already see them all), a dozen rows per career, one schema
bump. The Memory card then costs nothing: milestone + age-band painting + one line.

### D11. Warmth — **LATER, and it is art, not code**
Sunsets, benches, the bus, coffee, rain on the parking lot — inside cards, not as chrome. This is a
new asset class (“vignettes”) for the owner's Figma pipeline; the lore doc gains a prompt-fragment
section for it (grounded in the same palette/never-list). Code's only job: card slots that can
carry a vignette when one exists and look complete when none does.

## 2. The copy system (the one new engine piece, shared by D1/D2/D5/D6/D7/D10)

One module, `src/engine/diary.ts` or similar:

- **Input**: a facts object the engine already assembles (emotion, streak, condition + drains,
  travel, funds band, injury span, exams, results this week, milestones).
- **Selection**: filter the pool by license tags → pick via `seed:diary:<week>` (stable per week,
  no flicker, no MAIN draws) → at most ONE line per surface. Silence is allowed and meaningful: an
  ordinary week may say nothing.
- **The honesty pin**: a test sweeps the fact space and asserts no selectable line contradicts its
  facts (the `avatarEmotion` truth-table pattern, applied to words).
- **The tone source**: `docs/lore/setting.md` — quiet, domestic, never melodramatic, the parent
  observes and does not narrate feelings she cannot see.

## 3. Order of work

| pass | contents | cost |
|---|---|---|
| **Diary-1 (NOW)** | D2 living card + D1 condition note + D3 words-not-numbers + D8 chrome + D5 re-skin + D6 card lines, on the copy system's first ~60 lines | one UI branch + one small engine facts branch, no schema |
| **Diary-2 (SOON)** | D10 milestone ledger (schema bump) + Memory cards; D7 microstories with the full pool; D4 venues | engine + content |
| **Diary-3 (LATER)** | D9/D12 full Home restructure; D11 vignette art; D5 new voices with Phase-4/6 | design + art |

Diary-1 is deliberately sized to be FELT in one playtest: the owner opens Home and meets his
daughter instead of a dashboard, without a single schema or balance change.

## 4. How this couples to the Living Field

The two documents are one direction seen from two sides: the field makes the world mechanically
alive (rivals age, arrive, retire), the diary makes it emotionally legible (the girl who beat her
at 14 graduates, resurfaces at 17 — and the feed says so in a person's voice). Memory (D10) and the
field's archive (§2.3 there) share storage; named rivals (field §7.3) are the diary's future
correspondents. Neither blocks the other; Diary-1 can ship while Field S1 is still on the bench.

## 5. Open questions for the owner

1. **Language of the diary**: player copy is English by rule — confirm the diary voice stays
   English (the owner's examples mix RU/EN; the pool will be written in English with his tone).
2. **How silent is silent**: may an ordinary week show NO line at all (my recommendation — silence
   makes the loud weeks matter), or should every week say something?
3. **The phrase pool authorship**: I draft the first 60; does the owner want a pass over every
   batch before it ships, or a veto-after style?
4. **D3's reach**: words-not-numbers on Home and Season only, or also on the match screen (serve
   speeds, UE counts — the sports telemetry may deserve to stay numeric even in a diary)?
