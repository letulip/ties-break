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
- [x] **6. «Ревью всех предыдущих раундов – что пропущено, надо актуализировать»** – task #88.
  **`docs/rounds/AUDIT-2026-08.md`**, and it is the file to read, not this line. 192 items over
  rounds 8-17: **14 still open, 9 silently dropped, 3 shipped-then-undone**, and of 26 `[x]` marks
  sampled against the current build **two came back false** – round-10's Stats tiles and round-17
  #14, which is items 1-3 above. **Round 16 had no ledger at all** and is reconstructed as
  `round-16.md` (marked as rebuilt after the fact, with its sources named); **round 15's had thirteen
  boxes open on work that shipped on 09-10.08**. The index table stopped at round 15 and now carries
  rounds 16-18. ⚠ The misses cluster: every one of the nine dropped items is either a question you
  were asked and never answered, or something ruled and then not built – none was lost in the code.
- [~] **7. The brutal season** – Slams/1000/500 all losses, mandatory entry, big money, and the first
  `angry` he has caught. Read from the save in §7 below; no build, but it is the evidence for 8 and
  11.
- [>] **8. «Перед началом сезона больших призов присылать уведомление/попап – что она реально должна
  там участвовать, что есть такой регламент»** – ⚠ §Q2 WITHDRAWN, I was wrong about it before I read
  the code: the regulation EXISTS and is his own (W3-ACT2 §6). `mandatoryBindsRank` binds by rank, a
  skipped mandatory writes a `mandatoryMiss` row that takes one of her sixteen counting slots with a
  zero, and `raiseMandatoryDueLetter` invoices per event. The gap is that `mandatoryBindsRank` is
  read only by engine internals – nothing announces the moment the regime starts binding, so the
  first the player hears of it is a deadline letter. Briefing in flight.
- [x] **9. «Off season – rest, school, family в 21 год»** – the engine was right all along
  (`schoolEndWeek` = 242, W35 '35, age 18; his save is 171 weeks past it). `DiaryFacts` carried
  `examsWeek` but NOT `schoolOver`, so a phrase could not gate on school even if its author wanted
  to – exams simply stop, which silenced revision notes and nothing else. Fact now reaches the
  licences (derived, no schema move). **Sweeping the catalogues by what the words SAY found three
  more he had not reported**, in two pools – «Training, school, repeat.», «An ordinary week – school,
  practice, pasta.», «Drills, school, dinner, bed.» – each keeps its schoolgirl version and gains a
  twin. The pin is the sweep, mutation-verified on his exact sentence.
- [x] **10. Birthday asks and answers do not match** – «чего бы она себе никогда не купила» answered
  in the same register; a «день вместе» ask answered with a week. Plus the repeat question again:
  a new car every year should either not repeat or be played out. All three shipped, and the audit
  found **six** bad pairs rather than his three – the whole ask catalogue was swept against the whole
  gift catalogue rather than patching the ones he quoted. Verdicts and the before/after table in
  `docs/specs/birthday-and-gifts.md` §8; `tests/birthday-ask.test.ts` is the net, seven mutations
  verified. Zero change to the draw count: the copy is chosen after the shuffle, never inside it.
- [~] **11. «Будем ли наказывать от федерации за срыв (гнев)? Есть ли такая практика?»** – answered
  from the real tour's code of conduct in §11, with a proposal that parks in the morale wave (#95)
  rather than shipping alone.

## §7 – the season, measured (his save, W50 '38)

Thirty results, and the shape of them says exactly what he felt:

| tier | entries | scored | points |
| --- | --- | --- | --- |
| slam | 4 | 4 | **520** (130 each) |
| wta1000 | 7 | 6 | 445 |
| w50 | 4 | 4 | 183 |
| **wta500** | **9** | **9** | **68** |
| wta250 | 3 | 3 | 56 |

**The 500s are the rung that hurts, and it is not her.** Eight of her nine wta500 entries paid
**1 point**. A Slam first round pays **130**. So the same early exit is worth 130× more at a major
than at a 500 – she travels, plays, loses, and the table does not move at all. That is his «все
время проигрыш» with a number on it, and it is a real finding rather than a feeling: the 500s are
compulsory, expensive in weeks, and pay nothing for the result she can actually get there.

Two more facts from the save. **She skipped one mandatory** (a wta1000 at W32 '38) and it wrote a
zero into a counting slot – the rule from §8 firing on his own career, silently, exactly as
designed and with nothing on screen to say so. And the anger has already RESET: `lossStreak` is
null now, so the crossing he watched is not recoverable from this file. If he wants the meltdown
itself examined, the save to send is one taken in the week it happened.

## §11 – does the federation punish a meltdown? (item 11)

**Yes, and the real shape is worth copying exactly.** On the actual tour, conduct is a SEPARATE
LEDGER from results: a code violation (racket abuse, audible obscenity, unsportsmanlike conduct)
runs warning → point penalty → game penalty → default, and carries a fine deducted from prize
money. Repeated or aggravated conduct escalates to a major-offence hearing, where suspension
becomes possible. What it never does is touch ranking points – a player can be fined in the morning
and bank the title in the afternoon. So his own observation («при этом и продвижение по таблице
есть, и денег дают») is not a contradiction to design around; it is the actual arrangement.

**My recommendation is that we do NOT fine her, and the reason is his own standing rule.** «Мы ни
за что не наказываем» has always meant the game does not punish the PLAYER for his choices – and
the anger is not his choice. It is the girl's reaction to a season he may have run well; on his
save he ran it very well. A fine there would charge him money for the engine's emotional model,
which is the wrong side of that rule.

What fits instead, and is cheap: the violation gets REPORTED and costs nothing – a line in the
match commentary as it happens and one in the season feed after, in the umpire's register, not the
parent's. All the texture of the tour, zero balance risk. The real consequence belongs where he
already put it: morale and the psychologist (#95). Anger that costs form, and a person who can help
with it, is a mechanic; a fine is a tax.

## §Q1 – the self-coaching tick (item 4)

Today the parent authors the plan ALWAYS and the coach is a separate multiplier
(`development.ts`: `trainFactor(plan) × coachFactor(tier, fit)`), which is why every box is live
with a coach hired. Two honest ways to give him the tick:

* **A – the lock.** Hiring freezes the dials and labels them his; the tick releases them and fires
  him (with the confirm that already exists). Engine untouched, one screen, ships this round.
* **B – authorship.** The coach actually chooses the plan each season (`training-dials.md` §7), the
  dials show his choice, and the tick takes the pen back. This is what makes «тренер продаёт знание»
  literally true – and it is a wave, not an item: engine, a season-boundary decision, and a spec.

## §Q2 – WITHDRAWN (item 8)

⚠ This section originally asked him whether to invent a participation rule, on my assumption that
our world had none. It has one, it is his, and it has been enforced since W3-ACT2: the regime binds
by rank and a skipped mandatory takes a counting SLOT with a zero rather than levying a fine – which
`ranking.ts` argues is the crueller and truer rule, since it costs nothing until she runs out of
better results, i.e. exactly when a professional feels it. Nothing to decide; the item is a build.

The lesson for the ledger, since this is the skill's first run: I classified an item as an `ask`
from memory instead of from the code, and the question I nearly sent him would have been about
building something he had already specified and shipped.

## §L1-CORRIDORS – the proposal (see the-wall spec §Measured for why)

His example ladder used one width for all four tiers (0.3 pp). His new idea – a stronger coach is
more CERTAIN – says the width should shrink as the price rises, and that reads true: a cheap coach
is a lottery you might win, an elite coach is what you pay for when you cannot afford a lottery.
The realised value is drawn once per COACH (not per match, not per hire): a per-match draw averages
out over ~450 matches and no one could ever feel it, while a per-coach draw makes «этот оказался
находкой» a fact about that man that survives firing and re-hiring him.

**⚠ REVISED 13.08 after his question, and the question is what produced the rule.** He asked
whether a `budget` coach can come out ahead of a `middle` one – «есть тихие никому не известные
гении?» – and said to re-cut the windows if the answer should be no. The answer is yes, that is the
phenomenon worth having, but unbounded it dissolves the ladder. So the windows are cut to a stated
rule instead of to taste:

> **Each tier's ceiling is the next tier's midpoint. No tier can reach two rungs up.**

A lucky cheap coach is exactly a typical coach of the tier above – a real find, and the most a find
is allowed to be. Nothing bought at the bottom ever reaches the middle of `high`.

| tier | his example | proposed | width | midpoint | ceiling lands on |
| --- | --- | --- | --- | --- | --- |
| budget | 0.3-0.6 | **0.2-0.7** | 0.5 | 0.45 | `middle`'s midpoint |
| middle | 0.5-0.8 | **0.5-0.9** | 0.4 | 0.70 | just past `high`'s midpoint |
| high | 0.7-1.0 | **0.7-1.0** | 0.3 | 0.85 | `elite`'s midpoint |
| elite | 0.9-1.2 | **0.9-1.1** | 0.2 | 1.00 | – |

What the rule costs, in odds (uniform draw, one per coach): a `budget` coach beats the `middle` one
you could have hired instead **10%** of the time; `middle` beats `high` **17%**; `high` beats
`elite` **8%**. One cheap coach in ten is a find – rare enough to be a story, common enough to be a
hope, and it never touches the tier two rungs up.

**Where the number is drawn, and where it is shown.** Once per COACH, derived from his id
(`rngFromSeed(seed:coachedge:<coachId>)`) – so the same man is the same man across firing and
re-hiring, and nothing is persisted. On the card, before hiring, the TIER'S CORRIDOR: that is
genuinely all a market can tell you about a price. His own number is not printed there, because a
number on an unhired card turns the market into a shop window with the prices on the back – hire,
read, fire, repeat. It appears on his plaque **after a full season with her**: you learn what he is
worth by employing him, which is what scouting is, and it arrives far too late to shop with.

⚠ **The honest caveat, from the measurement:** tier-to-tier differences inside these bands were
INSIDE NOISE at 30 seeds – even 2.1 pp behaved like 0.45 pp on every ladder row. So this ladder buys
story and legibility, not four measurably different outcomes. If he wants the tiers to differ in
RESULT, the ladder has to stretch (budget ~0.4, elite ~1.6-2.0), which the dose-response says is
safe – nothing broke at 2.1, including the wall. That is a second question, not a blocker.
