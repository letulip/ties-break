# Round 18 – the first round run through `/fix-round`, eleven items (13.08.2026)

Measured against `tennis-sim_olivia-o1p7_w413.tsave` – his own save, read locally, never committed,
never a fixture. Item 5 (the skill itself) is what this file is written by.

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent named
· `[ ]` open · `[?]` waiting on the owner · `[!]` REOPENED – was reported done, was not.

⚠ **Three of the first four items are re-reports.** Items 1-3 are one root cause: round-17 #14 was
read as the coach card on HOME, and he had been talking about the coach PICKER all along. So the
picker never got its fix, and Home got two it never needed. That is the exact failure the skill's
Step 5 exists to catch, and it is recorded here rather than quietly corrected.

## The headline, ahead of the round: L1 is approved

«L1 строим, плоский вариант, полосы: разброс остается … более мощный тренер может обладать большей
уверенностью. Подумай какие коридоры лучше сделать.» Measured verdicts are in
`docs/specs/the-wall-2026-08.md` §Measured; the corridor proposal is §L1-CORRIDORS below and the
build waits on one word from him about which ladder.

## The eleven

- [!] **1. «На главном экране верни выравнивание текста на плашке тренера как было раньше»** –
  `.coach-body` on `HomeScreen.vue` goes back to `margin-left: 54px`. 54 was the export's own
  geometry and was never the thing he was complaining about; it went 54 → 66 → 80 chasing a
  complaint that lived on another screen.
- [!] **2. «Я просил отодвинуть текст от картинок тренеров внутри раздела с выбором тренеров»** –
  the REAL round-17 #14, twice reported, never touched: the coach cards in `CoachMarketScreen.vue`.
  Same shape of fix (text column past the portrait), the surface he actually meant.
- [!] **3. «Если тренер выбран, при клике на плашку переходить в список тренеров»** – found:
  `CoachMarketScreen.vue:58` is `const tab = ref<string>('week')` – the screen ALWAYS opens on Her
  Week, so his click on the coach note lands on the training dials and never on the coaches. With a
  coach hired it must open on the coaches tab.
- [?] **4. «Флажок и неактивный раздел самокоучинга при выбранном тренере»** – needs his word first:
  is the tick a UI lock over today's engine (the parent still authors, the dials are frozen and
  labelled his), or does hiring hand AUTHORSHIP to the coach (`training-dials.md` §7, designed and
  never built)? Question in §Q1.
- [x] **5. The skill: «приём и обработка правок»** – `~/.claude/skills/fix-round/SKILL.md`, and this
  file is its first output. Encodes the two failures it exists to prevent: silent drops (questions
  inside a round never become work) and false "done" (a fix reported shipped that his screen never
  saw). Runs capture → classify → group by collision surface → brief with the evidence named up
  front → verify on his surface → gate once quiet → report per item in his numbering.
- [>] **6. «Ревью всех предыдущих раундов – что пропущено, надо актуализировать»** – task #88.
  Rounds 8-17; only 17 has a ledger, so the earlier ones get one reconstructed and a sample of their
  `[x]` marks re-checked against the current build, because nobody ever checked them independently.
- [~] **7. The brutal season** – Slams/1000/500 all losses, mandatory entry, big money, and the first
  `angry` he has caught. Read from the save in §7 below; no build, but it is the evidence for 8 and
  11.
- [?] **8. «Перед началом сезона больших призов присылать уведомление/попап – что она реально должна
  там участвовать, что есть такой регламент»** – the notice is easy; the REGULATION behind it does
  not exist in our world yet. Question in §Q2.
- [ ] **9. «Off season – rest, school, family в 21 год»** – the engine has `schoolEndsWeek` and
  `SeasonSummaryDialog.vue:52` reads it correctly, so this is either his save's stored value or
  another surface. Diagnosed from the save before anyone is briefed – see §9.
- [>] **10. Birthday asks and answers do not match** – «чего бы она себе никогда не купила» answered
  in the same register; a «день вместе» ask answered with a week. Plus the repeat question again:
  a new car every year should either not repeat or be played out.
- [~] **11. «Будем ли наказывать от федерации за срыв (гнев)? Есть ли такая практика?»** – answered
  from the real tour's code of conduct in §11, with a proposal that parks in the morale wave (#95)
  rather than shipping alone.

## §Q1 – the self-coaching tick (item 4)

Today the parent authors the plan ALWAYS and the coach is a separate multiplier
(`development.ts`: `trainFactor(plan) × coachFactor(tier, fit)`), which is why every box is live
with a coach hired. Two honest ways to give him the tick:

* **A – the lock.** Hiring freezes the dials and labels them his; the tick releases them and fires
  him (with the confirm that already exists). Engine untouched, one screen, ships this round.
* **B – authorship.** The coach actually chooses the plan each season (`training-dials.md` §7), the
  dials show his choice, and the tick takes the pen back. This is what makes «тренер продаёт знание»
  literally true – and it is a wave, not an item: engine, a season-boundary decision, and a spec.

## §Q2 – the mandatory-participation notice (item 8)

Real tours do bind their top players to the big events, and our world has no such rule – she can
skip a Slam today and nothing happens. So the popup as asked would announce a regulation that is
not enforced. Either we write the rule (a commitment count per season, with a consequence) and the
popup tells the truth, or the popup becomes a season-opening BRIEFING – "this is the year the big
draws start, here is what it costs and what it pays" – which is honest and cheap.

## §L1-CORRIDORS – the proposal (see the-wall spec §Measured for why)

His example ladder used one width for all four tiers (0.3 pp). His new idea – a stronger coach is
more CERTAIN – says the width should shrink as the price rises, and that reads true: a cheap coach
is a lottery you might win, an elite coach is what you pay for when you cannot afford a lottery.
The realised value is drawn once per COACH (not per match, not per hire): a per-match draw averages
out over ~450 matches and no one could ever feel it, while a per-coach draw makes «этот оказался
находкой» a fact about that man that survives firing and re-hiring him.

Proposal, one decimal everywhere so the card copy is readable, and deliberately a small edit of HIS
ladder rather than a new one:

| tier | his example | proposed | width | the story |
| --- | --- | --- | --- | --- |
| budget | 0.3-0.6 | **0.2-0.7** | 0.5 | the lottery – a lucky one equals a typical `high` |
| middle | 0.5-0.8 | **0.4-0.8** | 0.4 | mostly fine, occasionally a find |
| high | 0.7-1.0 | **0.7-1.0** | 0.3 | unchanged |
| elite | 0.9-1.2 | **0.9-1.1** | 0.2 | never disappoints – that is the product |

⚠ **The honest caveat, from the measurement:** tier-to-tier differences inside these bands were
INSIDE NOISE at 30 seeds – even 2.1 pp behaved like 0.45 pp on every ladder row. So this ladder buys
story and legibility, not four measurably different outcomes. If he wants the tiers to differ in
RESULT, the ladder has to stretch (budget ~0.4, elite ~1.6-2.0), which the dose-response says is
safe – nothing broke at 2.1, including the wall. That is a second question, not a blocker.
