---
type: round
status: current
area: rounds
last-reviewed: 2026-10-02
---

# Round 45 – плейтест владельца, 10 пунктов (02.10.2026)

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent
named · `[ ]` open · `[?]` waiting on the owner's answer · `[!]` REOPENED (was reported done, was
not). Branch `round/45`. Bundles are collision surfaces; agents run **sequentially** (the 29.09
law), each owns only its own lines.

⚠ Invariant 4: every NEW player-facing string an item needs goes in the DRAFT table at the bottom,
never straight into the owner's voice. His sketches (item 4) are the draft, still his to bless.

- [ ] **1. «2 матча Шлема снимают 8% кондиции, а 2 матча 250 - 10%. У нас всё ещё перерасход
  кондиции присутствует. 3 игры на 1000 снимают 15%. 24% за 5 игр 500 и 26% за 6 игр 1000. Давай
  проверим что там вообще, мы хотели немного подкорректировать начальные матчи по-моему.»**
  – Reading: per-match condition drain looks tier-blind (≈4–5%/match everywhere: Slam 4.0, 250 5.0,
  1000 5.0→4.3, 500 4.8), and he remembers an earlier intent to soften EARLY matches. This is
  tuning – invariant 5: measure first, change second, predicted-vs-measured in a spec note.
  Class: **measure → build**. Bundle **B1** (condition/match drain + probe).
  Evidence: a deterministic probe table (tier × round → drain) from real engine draws, the prior
  intent found in docs (or stated absent), and – if changed – the same table after, with the pin
  updated and the frozen-capture verdict stated.

- [ ] **2. «Сверху интерфейса периодически появляется горизонтальная полоса в 1 пиксель на всю
  ширину экрана»** – Reading: an intermittent 1px full-width line at the very top of the UI –
  a border/edge of some top-chrome element (notice bar, update toast, safe-area filler) that shows
  while its body is hidden. Class: **build** (bug hunt). Bundle **B7** (App.vue top chrome).
  Evidence: the exact element named with the mechanism of «периодически», the CSS/markup fix, and
  a mounted assertion that the collapsed state renders 0px tall (goes red on revert).

- [ ] **3. «Письма с прогрессом от специалистов приходят, а повышение они так и не просят, только
  массажист растёт сам по себе тихо ежегодно»** – Reading: specialists (physio, psychologist,
  masseur…) send progress letters but no raise requests; the masseur's fee indexes silently
  yearly – inconsistent. Wanted: raise-request letters with accept/decline, masseur included
  (no more silent growth). Class: **build** (+ asks on cadence/size if no pattern exists to
  mirror). Bundle **B2** (specialist economy + letters).
  Evidence: a seeded career where a specialist's raise letter arrives, both doors exercised in a
  test (accept → fee moves, decline → consequence per existing law), masseur's silent index shown
  replaced by the same letter flow. New copy → DRAFT rows.

- [ ] **4. «Для психолога мне кажется нужно сделать чтобы если игрок забыл выбрать направление, то
  оставалось предыдущее. А в письме следующего года писать "мы не выбрали новое, поэтому работали
  по предыдущему" вроде того»** – Reading: unanswered yearly psychologist direction ⇒ carry the
  previous one; next year's letter says so (his sketch is the draft wording). Class: **build**.
  Bundle **B2** (same files as 3).
  Evidence: a test career with the choice ignored – direction persists, the next letter carries
  the carry-over line (rendered, with real data), DRAFT row for the line.

- [ ] **5. «В альбоме вполне можно сделать чуть ли не отельную страницу, если она на #1 в мире
  выходит, даже если в моменте, а не по итогам года, это значимый момент»** – Reading: the album
  gets a dedicated page the first time she touches world #1, mid-season counts – not only the
  year-end review. Class: **build**. Bundle **B5** (album engine/composition).
  Evidence: a career that reaches #1 mid-season produces the page (read from the composed album
  state), a career that never reaches #1 produces none; deterministic; page copy → DRAFT rows.

- [ ] **6. «Расположение фото в альбоме конфликтуют с надписями в самом альбоме и с некоторыми
  записками, которые перекрывают надписи на фото, надо подумать как лучше сделать»** – Reading:
  album layout collisions – photos vs album captions, notes overlapping photo labels. He asks for
  a thought-through layout, not a nudge. Class: **build**. Bundle **B6** (album UI).
  Evidence: a mounted test measuring bounding boxes of photo labels vs notes/captions on the
  offending page shapes – zero intersection, red on revert; before/after reasoning in the report.

- [ ] **7. «Кроп фото в альбоме берёт среднюю часть фото, на некоторых обрезается голова»** –
  Reading: album photo crop anchors to center; portraits lose heads – anchor should favour the
  top. Class: **build**. Bundle **B6** (same files as 6).
  Evidence: the measured object-position/crop rule before and after, asserted in the mounted
  album test (red on revert).

- [ ] **8. «Постараться сделать, чтобы одинаковых фоточек не было на одной странице»** – Reading:
  de-duplicate photo picks within one album page (deterministically – sub-stream law, MAIN
  untouched). Class: **build**. Bundle **B5** (same files as 5).
  Evidence: a sweep over many seeded careers asserting no page holds duplicate photo ids, and the
  frozen-capture verdict stated (should be unmoved – sub-streams only).

- [ ] **9. «Deposit towards her own place случился после того, как она пару лет назад принесла
  свой spare key. И мне кажется этот депозит вполне можно где-то на более ранних периодах делать,
  а не когда у неё на счёту уже 150+ млн»** – Reading: narrative inversion – the own-place deposit
  fired years AFTER the spare-key beat, and only at absurd wealth. Wanted: the deposit eligible
  earlier (age/wealth corridor down) and ordered before (or suppressed after) the key beat.
  Class: **build** (corridor tuning – measured). Bundle **B3** (kidLife/life-beat gating).
  Evidence: a before/after distribution over seeded careers (ages + bank at deposit; % of careers
  where deposit precedes key), corridors stated in the report.

- [ ] **10. «Бренд жёстко приносит 13800 и ни центом больше, независимо ни от чего, даже при
  стоимости 35 млн»** – Reading: the brand asset pays a flat weekly income regardless of its
  worth – at 35M worth it still pays 13,800. Wanted: income that scales with the asset's value,
  measured (invariant 5). Class: **measure → build**. Bundle **B4** (economy/ownables income).
  Evidence: the current formula quoted from source with the flat constant named, the new curve
  with a predicted-vs-measured table over worth tiers (incl. 35M), bench arm run.

## Bundles → dispatch (sequential, sonnet, budgets are STOP conditions)

| # | bundle | items | surface owned | budget |
| --- | --- | --- | --- | --- |
| B1 | condition drain | 1 | `src/engine/condition.ts`, match drain site, `tools/` probe | ~45 moves |
| B2 | specialist letters | 3, 4 | `src/engine/economy/psychologist.ts`, specialist fee/letter sites, entries | ~45 moves |
| B3 | life-beat deposit | 9 | kidLife/life-beat gating for deposit + own-key | ~35 moves |
| B4 | brand income | 10 | economy/ownables income site + bench | ~35 moves |
| B5 | album engine | 5, 8 | `src/engine/world/albumBook.ts` + corpus | ~40 moves |
| B6 | album UI | 6, 7 | `src/components/album/`, `AlbumScreen.vue` | ~40 moves |
| B7 | top 1px bar | 2 | `src/App.vue` top chrome | ~30 moves |

Gates: none inside agents. One `check` + `test:component` + `test:sim` + `test:e2e` pass in the
architect's session after the last agent, verdicts from files.

## R45 – DRAFT strings (owner's table, nothing ships as final wording)

| id | surface | EN draft | его слова/замечание | status |
| --- | --- | --- | --- | --- |
| (agents append rows here for items 3, 4, 5) | | | | |
