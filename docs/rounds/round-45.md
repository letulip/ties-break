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

- [?] **1. «2 матча Шлема снимают 8% кондиции, а 2 матча 250 - 10%. У нас всё ещё перерасход
  кондиции присутствует. 3 игры на 1000 снимают 15%. 24% за 5 игр 500 и 26% за 6 игр 1000. Давай
  проверим что там вообще, мы хотели немного подкорректировать начальные матчи по-моему.»**
  – Reading: per-match condition drain looks tier-blind (≈4–5%/match everywhere: Slam 4.0, 250 5.0,
  1000 5.0→4.3, 500 4.8), and he remembers an earlier intent to soften EARLY matches. This is
  tuning – invariant 5: measure first, change second, predicted-vs-measured in a spec note.
  Class: **measure → build**. Bundle **B1** (condition/match drain + probe).
  Evidence: a deterministic probe table (tier × round → drain) from real engine draws, the prior
  intent found in docs (or stated absent), and – if changed – the same table after, with the pin
  updated and the frozen-capture verdict stated.
  **B1 outcome (02.10) – `[?]`: measured, NO code change, options for the owner.**
  `tools/condition-drain-probe.ts` (real matches, 140k fixed-seed runs) reproduces all five of his
  figures as NET of the travelling masseur (3 per night between rounds, 19.09): each sits between the
  all-straight-sets floor and the all-hard ceiling – Slam 2 → 8 and 250 2 → 10 ARE the floors – and
  every gross floor (11 · 13 · 18 · 34 · 39) is above his number, so none can be a gross figure. The
  drain is tier-blind BY DESIGN: the scoreline part averages 2.6 at every tier and round, and every
  top rung plateaus at 7 per straight-sets match from round 3 (250/500: surcharge 4 + ladder 1;
  1000/Slam: 5 + 0). Only the openers differ: the Slam's first two (5, 6) are 1 cheaper than a 250's
  (6, 7) – his own 14.08 ramp `[-2,-1,0]` meeting the 01.08 W ladder. Intent in the docs: the 14.08
  ramp is shipped as he wrote it; the 19.09 «уменьшить усталость на глубоких турнирах» shipped as
  masseur relief 2 → 3 and its concave-tail half is HELD for his ruling (the-season-equation §10f; it
  does not touch openers); a ruling to soften the 250/500 openers is ABSENT. Options A–D with
  predicted tables are in the B1 report – his pick, one sentence.

- [ ] **2. «Сверху интерфейса периодически появляется горизонтальная полоса в 1 пиксель на всю
  ширину экрана»** – Reading: an intermittent 1px full-width line at the very top of the UI –
  a border/edge of some top-chrome element (notice bar, update toast, safe-area filler) that shows
  while its body is hidden. Class: **build** (bug hunt). Bundle **B7** (App.vue top chrome).
  Evidence: the exact element named with the mechanism of «периодически», the CSS/markup fix, and
  a mounted assertion that the collapsed state renders 0px tall (goes red on revert).

- [?] **3. «Письма с прогрессом от специалистов приходят, а повышение они так и не просят, только
  массажист растёт сам по себе тихо ежегодно»** – Reading: specialists (physio, psychologist,
  masseur…) send progress letters but no raise requests; the masseur's fee indexes silently
  yearly – inconsistent. Wanted: raise-request letters with accept/decline, masseur included
  (no more silent growth). Class: **build** (+ asks on cadence/size if no pattern exists to
  mirror). Bundle **B2** (specialist economy + letters).
  Evidence: a seeded career where a specialist's raise letter arrives, both doors exercised in a
  test (accept → fee moves, decline → consequence per existing law), masseur's silent index shown
  replaced by the same letter flow. New copy → DRAFT rows.

  **B2 outcome (02.10) – `[?]`: the masseur's letter is built, the other seats' are NOT.** The
  anniversary tick that used to raise his rate silently now writes ONE open letter (`kind: 'staff'`
  with `terms.ask`, the sponsor letters' four-week window, Decline / Accept through the existing
  `declineOffer` / `acceptOffer`); the fee is derived from the signed papers
  (`staffAsksWithheld`), so Decline and a lapse leave it where it was, nothing is punished, and a
  save with no such papers keeps every raise it already pays – no schema move. Proof:
  `tests/round45-staff-ask.test.ts` A+B (both doors, lapse, a real `tickWeek`, the old feed row
  dead) and `tests/component/round45-staff-ask-letter.test.ts`. **Open, his ruling or the
  architect's:** the psychologist and the hitting partner do not ask yet (their cards quote flat
  per-rung prices, so a raise needs the card and the snapshot to carry the scaled price first), and
  the coach keeps his own 2026-09 ask (a notice, rate applied) – see the B2 report.

- [x] **4. «Для психолога мне кажется нужно сделать чтобы если игрок забыл выбрать направление, то
  оставалось предыдущее. А в письме следующего года писать "мы не выбрали новое, поэтому работали
  по предыдущему" вроде того»** – Reading: unanswered yearly psychologist direction ⇒ carry the
  previous one; next year's letter says so (his sketch is the draft wording). Class: **build**.
  Bundle **B2** (same files as 3).
  Evidence: a test career with the choice ignored – direction persists, the next letter carries
  the carry-over line (rendered, with real data), DRAFT row for the line.

  **B2 outcome (02.10) – `[x]`.** Measured first: nothing ever cleared `psychologistFocus` and the
  seat's work never read the season stamp, so a forgotten off-season already left the previous
  direction working and never blocked a week – what was missing was the SAYING (a stale stamp made
  the year-end letter go quiet about the direction). The letter now carries
  `focusCarriedFrom` (the season the carried pick was last chosen for) and prints the carry-over
  line with that year (DRAFT R45-S9); an answered year – including re-choosing the same direction –
  prints no such line. Proof: `tests/round45-staff-ask.test.ts` «round 45 #4» (a real `tickWeek`
  walk, both arms) and the mounted pair in `tests/component/round45-staff-ask-letter.test.ts`.

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
| R45-S1 | item 3 – inbox subject line of a raise request (`InboxSheet.vue`, staff arm) | `A raise request – {year}` | «повышение они так и не просят» | draft |
| R45-S2 | item 3 – the masseur's raise letter, body (`OfferLetter.vue`) | `I have now worked a full year with her, so I am asking for a raise: my rate would go from {from} to {to} a session.` | «повышение они так и не просят, только массажист растёт сам по себе тихо ежегодно» | draft |
| R45-S3 | item 3 – raise letter foot, while open (the buyer's letter's own sentence, reused word for word) | `{n} weeks to decide. The terms will not change.` | – | draft |
| R45-S4 | item 3 – the two doors | `Decline` / `Accept` | – (the ledger's reading: accept/decline) | draft |
| R45-S5 | item 3 – foot once signed | `Accepted – the rate is {to} a session.` | – | draft |
| R45-S6 | item 3 – foot once refused | `Declined – the rate stays at {from} a session.` | – | draft |
| R45-S7 | item 3 – foot once lapsed unanswered | `Lapsed – the rate stays at {from} a session.` | – | draft |
| R45-S8 | item 3 – the confirm before Accept (`InboxSheet.vue` `confirmMessage`) | `Accept the raise? The rate goes from {from} to {to} a session. This cannot be undone.` | – | draft |
| R45-S9 | item 4 – the psychologist's year-end letter, carry-over line (`OfferLetter.vue`) | `We did not choose a new direction this year, so we kept working on the previous one – the one chosen for {year}.` | «мы не выбрали новое, поэтому работали по предыдущему» | draft |
| (agents append rows here for item 5) | | | | |
