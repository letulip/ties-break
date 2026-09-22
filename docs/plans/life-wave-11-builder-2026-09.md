---
type: plan
status: current
area: private-life
last-reviewed: 2026-09-22
---

# Wave 11 for the builder – the weight, step by step

The canonical spec is [the-weight-2026-09.md](../specs/the-weight-2026-09.md); read it and the
design doc it builds ([the-months-before-she-says-2026-09.md](../design/the-months-before-she-says-2026-09.md))
first. Branch: `life/wave-11`, cut from main after PR #153. One branch, pathspec commits, never
amend, gates from files with fresh mtime – CLAUDE.md binds all of it. His five rulings of 22.09
are in the spec and `docs/decisions.md`; nothing in this plan is conditional. Questions that
appear DURING the build go to the end of your report, never guessed at.

Every player-facing string is a DRAFT for his pass (invariant 4): write each once, list all of
them verbatim in the report. The two griefs speak in the four voices' table (design §4) and the
diary scraps obey the 80-character budget and the licence machinery.

## T1 – the switch and the schema, v87, all four parts in one range

1. `world/state.ts`: `weightEnabled: boolean` with the ruling quoted; `conceivedWeek` on the
   pregnancy record; `pregnancyLossWeeks: number[]` and `bereavementWeeks: number[]`, append-only.
2. `SAVE_SCHEMA_VERSION = 87`; append-only migration – `weightEnabled` back-fills **false** (his
   ruling: nobody asked a migrated save at creation), the lists back-fill `[]`, `conceivedWeek`
   back-fills onto any live pregnancy as its announcement week (the pre-window truth).
3. Golden fixture `tests/fixtures/saves/v87.json`; regenerate `e2e/fixtures` (wave 10's v86 move
   is the worked example, one commit range).
4. The creation ask: one question card in BOTH creation paths – the prologue's opening and the
   wizard – with the strings declared once (the `DYNASTY_COPY` precedent, same file). The wire:
   `newCareer` profile or its own argument, whichever spelling keeps `createWorld`'s literal
   honest; absent means the ask's default, never silently on.
5. Settings: one row, both directions, effective immediately; OFF stops NEW weight events and
   never deletes lived state – assert both halves in a test that toggles mid-career.

## T2 – the hidden window

1. The pregnancy hazard's week becomes `conceivedWeek`; the announcement beat fires
   `windowWeeks = ` a draw per OPENNESS on the shipped `ECONOMY.life.lag` shape, own purpose key
   per pregnancy. No draw when the switch is off? ⚠ NO – the window is NOT weight and exists for
   every pregnancy; only the LOSS is gated. Say this in the code where the two meet.
2. The one-number law: `dueWeek = conceivedWeek + TERM_TOTAL` (new constant ≈ the old
   announcement-relative 31 plus the old assumed-zero window – derive it so a zero-window draw
   reproduces today's dates EXACTLY, and pin that). `playsOnWeeks` keeps reading from the
   announcement – the window moves knowledge, never the calendar of play.
3. Nothing prices the parent's window weeks – and a test asserts the week notes/beats in the
   window carry no reproach licence.

## T3 – the voices and «рано» (content, no mechanics)

1. The announcement lines per the design table's first two columns, four DRAFTs.
2. The `'expecting'` card's third answer re-worded to the reasonable position («not now, look
   where you are» – a position, not a villain's line) – DRAFT, and flag the OLD string in the
   report so his pass sees the replacement beside it.
3. The album's pregnancy/return pages re-read once against §5's rule: no page may settle who was
   right. Report any line that does; touch nothing without listing it.

## T4 – the loss

1. `ECONOMY.weight.lossPerWeekByAge` – per-week rates integrating to the J-curve's 9.8 / 10.8 /
   16.7% per pregnancy at the research's bands (drafted; the bench confirms the integral).
2. The draw: one uniform per pregnant week on the pregnancy's own key, only while
   `weightEnabled`; zero draws otherwise – the switch-off arm must be byte-identical.
3. ⚠⚠ THE BOUNDARY PIN: the hazard function takes (age band, the dice) and NOTHING else – write
   it so the read-set is visible in the signature, and pin it with a test that sweeps plan,
   travel, spirit, bond and support across arms and asserts identical realised hazard on shared
   seeds. This is the design law; a refactor may not lose it quietly.
4. On a loss: clear the record (no birth, no comeback), push the week onto `pregnancyLossWeeks`,
   land `spiritShock.kind = 'loss'`, re-arm the pregnancy hazard behind the drafted 26-week
   cooldown through wave 9's eligibility machinery.
5. The words: four voices, both branches (open tells; private is silence – the `deep` girl may
   not tell him at all, and the diary's ABSENCE is the telling). The «рано»-adjacent case gets no
   mechanical link and no line that asserts one.

## T5 – the bereavement

1. `ECONOMY.weight.bereavement` – his 11.09 drafts: `perWeek: 0.0008` from the adult rung
   (`kidAgeExact ≥ 23`), `spacingWeeks: 156`, `capPerCareer: 2`; the draw on
   `seed:life:loss:<week>`, created here, zero draws while ineligible or switched off.
2. Temperament-FREE hazard – the same boundary-pin discipline as T4.3, swept across temperaments.
3. The beat: the funeral frame wires `fem-euro-brunnet-adult-funeral.webp` at last; the shock
   lands as `'bereavement'`; the deceased is UNNAMED in mechanics and copy (his ruling – the
   fridge-pool grandmother collision, 11.09); it may reach the parent in WORDS only.
4. The response: depth by intensity, expression by openness, through the shipped shock table –
   the two kinds land beside breakup and postpartum exactly as the table's comment reserved:
   `loss: { steady: -26, intense: -40 }`, `bereavement: { steady: -30, intense: -46 }` (drafted).
   ⚠ NO second recovery rate, NO taper, NO flag – the refusal is already written in the return
   rule's own comment; depth is the whole of «longer».
5. The psychologist needs NOTHING: he reads «is a shock live», not which kind. Assert it stays
   true (a test that his effect fires identically on a bereavement week).
6. Diary/feed: four voices over the weeks after, scraps inside the licence machinery; push the
   week onto `bereavementWeeks` – spacing and cap read THAT list, never a derived guess.

## T6 – the bench, `tools/weight-bench.ts`

The spec's §8, every row predicted beside measured. Walk with the wave-10 walker
(`answerRetirementOffers: true` – the corpus must reach natural endings or the 23→35 tail is a
fiction). Sections: the frequency census (row 1), the two zero-correlation arms (row 2), the term
arithmetic sweep (row 3), realised J-curve by band (row 4), window lengths by openness (row 5),
the switch-off byte-identity arm (row 6 – build both arms with the reader present, the null-result
law), response fairness on RESPONSE arms only (row 7). `npm run check:tools` covers the types.

## T7 – UI and the gates

1. Mounted: the creation ask inside 375×667 on BOTH paths; the settings row; the funeral beat
   dialog under the popup law (the healed `assertDismissReachable` knows both safe shapes now).
2. e2e: the switch flow – create with it ON, toggle OFF in settings, assert no weight beat can
   arrive (drive weeks with the dev fast-forward); fixtures regenerated with v87 in T1.
3. After every task `npm run test:quiet`; `npm run check` before any commit touching
   `shared/protocol`. Wave end (the architect runs the final gate, but leave it green): check,
   test:sim (predicted: corridors unmoved – both hazards are gated OFF in every shipped sim
   fixture), test:e2e, frozen capture UNMOVED (a moved capture is a defect, not a re-pin), install
   size (headroom 35 KiB at the wave's start; the funeral webp is already in every install).
4. Report: every DRAFT string verbatim, every §8 row filled, questions at the end.
