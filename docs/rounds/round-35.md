---
type: round
status: current
area: rounds
canonical: false
last-reviewed: 2026-09-03
---

# Round 35 – the prologue, played end to end for the first time since it merged (03.09.2026)

Status: `[x]` shipped · `[~]` answered, nothing to build · `[>]` in flight · `[ ]` open ·
`[?]` waiting on him · `[!]` REOPENED

⚠ This round is against `main` – the prologue landed there with PR #120 while round 34 was being
built. `round/34` does not touch the prologue and merges independently of this.

---

- [ ] **1. «у нас на прологе турнир как-то сразу в матчи идет, давай сделаем наш нормальный
  полноценный флоу пожалуйста, чтобы был первый экран с артом турнира, потом матчи и переходы между
  ними как обычно. И с результатами в конце или с кубком, как у нас. А потом уже продолжаем наши
  прологовые карточки»** – **build, and the diagnosis is already confirmed.**
  `src/components/PrologueLocalOpen.vue` imports `MatchViewer` directly and calls `simulateMatch`
  itself; it never reaches `TournamentFlow.vue`. ⭐ The prologue built a second, smaller tournament
  flow instead of using the game's own – which is this repo's named recurring disease, two surfaces
  answering one question.

- [ ] **2. «мне кажется в прологе можно без подложек с рамкой делать флоу, а просто квадратный арт
  во всю ширину (как на home) и ниже весь текст с выбором, как раз и места вертикально немного
  появится»** – **build**, layout only. ⭐ He names the model himself: the Home screen's square art.

- [ ] **3. «кажется, что в режиме ключевых моментов у нас время матча идет как обычно, а не по
  ключевым моментам»** – **measure first**, then build or answer.

- [ ] **4. «мне кажется какие-то экраны у нас повторяются, я увидел "she asks more", "juniour tour
  opens at fourteen" дважды… Похоже, что это как-то связано с последующими турнирами, но если так -
  то это максимально невнятно и странно»** – **build. HIS HYPOTHESIS IS CORRECT AND THE CAUSE IS
  FOUND.** `ChildhoodPrologue.vue`'s `answer()` runs a card as TWO beats on one painting: `card`
  (its own choice), then `ask` (that year's tournament question) – the code's own words, «the second
  beat, on the same painting». Nothing is duplicated in the data; the same card is rendered twice.
  ⚠ So the fix is a design one, not a bug fix: either the ask earns its own identity on screen, or
  the two beats become one.

- [ ] **5. «Первый экран с заходом на турнир был отличным, надо остальные в такой же манере
  сделать»** – **build**. ⭐ Praise plus a target: the tournament-entry screen is the standard the
  other prologue screens should meet. Read it before changing anything else.

- [ ] **6. «Тай брейки в режиме ключевых моментов по-моему идут полноценно, видно каждое очко, но
  может это и нормально»** – **measure**, then answer. ⚠ He is unsure himself, so the answer may be
  «it is deliberate, here is why» rather than a change.

- [ ] **7. «На последнем кадре пролога после турнира случилось странное: мне показали сначала арт с
  кубком, потом еще какой-то экран (я не успел прочесть что там), который сразу сменился на She is
  fourteen (в чем я не уверен, честно говоря, потому что ДР у нее в июне) и This is the girl you
  raised»** – **reproduce first.** Three things in one report: a screen that flashed past unread, an
  age line he doubts, and the handover. ⚠ The age doubt is checkable against the one-clock ruling –
  round 34 item 3 fixed exactly this class of defect on the main game's birthday, and the prologue
  has its own clock.

---

## Where this came from

He played the merged prologue end to end and reported in one message. Item 5 is the only one that is
praise, and it is the standard the rest are measured against.
