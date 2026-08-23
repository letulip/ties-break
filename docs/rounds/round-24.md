---
type: round-ledger
status: current
area: rounds/24
canonical: false
last-reviewed: 2026-08-23
---

# Round 24 – the college flow (20–22.08.2026)

Status: `[x]` shipped · `[~]` answered, nothing to build · `[?]` waiting on the owner · `[>]` deferred to a named place.

Written 23.08, two days after the fact – the round ran without a ledger and this file closes that
hole (his own find: «в беклоге пусто-пусто» had a sibling – the chronicle had stopped too). Sources:
`docs/plans/college-the-flow.md` (the waves), the plans reviewed 22.08, the commit bodies on
`wave/round24` (merged as PR #100).

## Batch 1 – four questions (21.08)

- [x] **1. «Слова для тренеров о потолке девочки ты предложил, но в интерфейсе не поменял»** – the
  plaque took FOUR attempts, the shipped wording is the owner's own draft; bands re-cut 0.82/0.88/0.92
  on the measurement (she never sits below 68% realised, so the shipped bands had dead copy). The
  Home coach card gained the room note. `coachMarket.ts`, `coachRoomBand`.
- [x] **2. «Рекламные контракты будем добавлять какие-то?»** – planned (`the-face-and-the-court.md`),
  then BUILT as steps 1–2 in round 25 (Quiet Hour). See `round-25.md` #6.
- [x] **3. «Когда будем добавлять отношения…?»** – the layer planned in `the-private-life.md`; his
  ruling «решения всё равно будут за девочкой, а в зависимости от выборов родителя будет мораль
  развиваться» became the layer's spine (§4a). Build begins with its own wave.
- [x] **4. Картинки студенческих турниров из национальной ветки** – `occasionArtUrl` in
  `src/art/venues.ts`, occasions mapped to existing rings, no art created.

## Batch 2 – seven college observations (21.08, save `alice-cfbv_w474.tsave`)

- [x] **1. Письмо про академию – в почту и хранить** – the three notices are letters (arrival
  back-filled from data, review/end on their own week only), the toast keeps saying WHEN. C1 + the
  tick wiring; the harness that drove the settler by hand was caught and re-armed (9/12 red on the
  mutation after).
- [x] **2а. Выбор колледжа под кнопкой, дешёвый нельзя без причины** – places moved above the
  answers; every shut rung states its reason from ONE engine function (`collegeOffer.ts`,
  `tierShutFor`); the refusal line no longer fades with the dead row.
- [x] **2б+3. Фотоальбом как будто карьера закончилась / весь флоу на домашний экран** – college
  moved OFF the epilogue onto the Home shell (`showCollege`, `CollegeYearCard`); real endings keep
  the album, pinned.
- [x] **2в. «3 клика +1 год и ни одного соревнования»** – exposed by the shell (0.71 watchable
  matches/yr measured), then closed by the College League + earned call-up: floor 1 / ceiling 2 by
  arithmetic, ladder 0.15/0.40/0.65/0.85 by rounds won, 2.63–2.72 watchable/yr at n=399.
- [x] **2г+7. Устаревшая заявка + пустой календарь** – ⭐ the round's deepest defect: an entry
  outliving the fork opened an unanswerable reveal; `tickWeek` skips housekeeping while one is open,
  so the world ticked 204 weeks EMPTY, and the all-zero table crowned her world #1. Three rules
  (release at the freeze, refuse to tick past a reveal, gate the entry scan) + the v55 load-time
  repair; his save heals on its own – rank #542→#141 over one season. `tools/college-freeze-probe.ts`.
- [x] **4. unranked на w500 сразу** – a table where nobody has scored ranks nobody
  (`assignCompetitionRanks`), the Stats standings print a dash.
- [x] **5. В колледж ровно в день рождения** – redesigned per his model: ASK when school ends
  (week 242/294 by birth month), the place RESERVED, DEPART the first September after her 19th; the
  52-week gap is her last junior season, fully playable; the release fires at departure. Schema v58.
- [>] **6. «Где-то её мнение увидеть»** – PAUSED by his ruling until the private-life layer's steps
  1–2 exist («да, пока на паузе»). First beat named: the ask–depart gap.

## Also in this round, unasked but forced

- [x] Four college birthdays HAPPEN (supersedes the 19.08 diary-line decision – see decisions.md
  22.08); the year pauses, the gift dialog rides the live shell; schema v57.
- [x] `guardNotEnded` stops lying at college – «She is at college – the career is not over…»; the
  E2 audit of all 20 command sites; two cancels opened; the rest await rulings
  (`docs/backlog/college-the-remainder.md`).
- [x] Schema v54→v58 in one round, each the full 4-part move.
