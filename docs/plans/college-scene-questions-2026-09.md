---
type: plan
status: current
area: college-scene
last-reviewed: 2026-09-24
---

# The college scene – what is yours to answer

Seven questions, in the order they change the product. Every one of them is a place where the wave
could not proceed on a measurement alone, so nothing below is a musing: each is a choice with its
options priced. The wave is built and gated either way – answering these moves what ships next, not
what shipped.

The wave's own documents: the spec [the-college-scene-2026-09.md](../specs/the-college-scene-2026-09.md)
(corrected in four places, each correction dated and attributed), the rulings
[college-scene-rulings-2026-09.md](college-scene-rulings-2026-09.md), the strings
[college-scene-strings-2026-09.md](college-scene-strings-2026-09.md).

## 1. The floor now reads her BIOGRAPHY, not her ending – is that what you meant?

**What you ruled**, 23.09: «концовка-колледж даёт полку не ниже "середины" - ок».

**What we found when we went to build it.** There is no such thing as a college ending. All three
places that latch `type: 'college'` carry a return week, graduation removes the latch for good, and
the dynasty door only opens where there is no return week – so the state your ruling named cannot
occur, and a clause on it would have been dead code that the wave's own measurement would have
reported as a success.

**What shipped instead**: the floor reads **the degree** – she finished the course. It lifts only
`working`, never lowers anything.

**The consequence, which is the question.** A girl who took the college fork, graduated, went back on
tour for eight years and retired thin now hands over `middle`. The degree does not stop being a
degree when the tour is over – but it does mean the shelf is a fact about her life rather than about
how her story ended, which is the opposite of what the spec's own sentence promised.

| option | what it means |
| --- | --- |
| **A – as shipped** (recommended) | the degree is the shelf, whatever came after it. One predicate, already built and pinned. |
| B – narrower | «graduated **and** never played a professional season after». Needs a new predicate and a new test; it also means two graduates with the same degree hand over different shelves because of what the tour did to them. |
| C – wider | the fork answer alone, so a girl who enrolled and left after one year gets it too. Refused in the build, because one year is not «a degree and a profession» – but it is yours to overrule. |

## 2. May a college champion the professional press never saw be mentioned in the booth at all?

Today she may not, and that is a ruling already in the code: the booth speaks of a line only where
the mother held a pro title or a WTA ranking inside the news bar, under a note that reads «a
college-fork mother licenses nothing, and that is the point rather than a side effect».

The wave's spec asked for the new line to be «licensed off `collegeTitles > 0`», which read literally
would overturn that. It was not overturned: the student-cabinet line is a **third register inside the
existing licence**, so it is heard when her mother won the College League *and* was known to the
tour. A woman who won it three times and never cracked the tour still buys her daughter nothing.

The question is whether that is right. A student championship is a real thing she won, and «her
mother came through the college game» is a true sentence about a woman nobody in the booth watched.

| option | what it means |
| --- | --- |
| **A – as shipped** (recommended) | the licence is unchanged; the new line is texture for a mother who was already worth mentioning. |
| B – widen it | `collegeTitles > 0` joins the licence, and a college champion's daughter gets a booth line on a big stage. One clause, one test, and it retires the dynasty spec's own sentence – which is why it needs your word rather than ours. |

## 3. The album's exit line – bare round, or the whole sentence?

The graduate's album page now carries one line per college year that held a championship:

- «Year 1, the College League: Won it»
- «Year 2, the College League: Quarterfinal»

The exit shape is the bare round name, exactly as the year card prints it. Read cold beside «Won it»,
a bare «Quarterfinal» can be heard as «she reached the quarterfinal» rather than «she went out
there». The engine's other sentence for this fact spells it «she went out in the Quarterfinal».

| option | what it means |
| --- | --- |
| **A – as shipped** | the card's short register, the two surfaces identical. |
| B – the longer form | unambiguous, and the album page reads less like a results table. One word of edit; neither grades her. |

Both drafts are in the strings table awaiting your pass anyway, so this is only about which one you
read first.

## 4. ⚠ The championship rows do not fit a phone, and they have not since August

This is the wave's most valuable finding and it is **not** a regression this wave caused – the block
shipped 22.08 and the overflow shipped with it. Nobody had measured it, because the shared
measurement helper charges a control like **Watch** nothing at all when it declares neither
`nowrap` nor a `min-width` (that helper is a separate card).

Charged honestly, in a real browser over the card's own markup, CSS and font: the worst row needs
**296.1px of the 291.0px** it has.

| row | straight sets | after a retirement (`ret.` costs the score span 22.3px) |
| --- | --- | --- |
| Quarterfinal | 11 of 211 surnames overflow | **129 of 211** |
| Semifinal | 0 of 211 | 25 of 211 |
| Final | 0 of 211 | 0 of 211 |

At 320x568 it is not a tail at all: 236.0px of room, over by 60.1px, every surname overflowing both
the Quarterfinal and the Semifinal row.

**Nobody is stranded.** The row cannot wrap, so the Watch control and the score never move; the
opponent's name gives way through the ellipsis your own stylesheet calls «the safety net at 375px,
not the plan». So this is legibility, not round-20's blocking dialog – her opponent's surname is cut
on about one draw in twenty, and on most rounds that ended in a retirement.

⚠ It is NOT fixed, deliberately: every repair is a wording or layout change to a card that shipped in
August, and that is yours. The candidates, priced, none chosen:

| candidate | cost | what it spends |
| --- | --- | --- |
| shorten or drop the **Watch** label (an icon, or nothing) | small | the clearest control on the card |
| drop the stage word on the longest round («QF») | small | the draw sheet's own language |
| abbreviate or move `ret.` | small | a real notation, and it is the biggest single saving |
| let the row wrap to two lines | medium | the card grows; the phone law needs re-measuring |
| shrink the Watch pill's tracking | small | 5px of the 41 it costs |
| leave it – the ellipsis is the design | none | a cut surname on the long-name tail |

## 5. Your video session is holding this branch's gate open

Seven untracked files from another live session sit in the shared checkout
(`tools/_devlog_after.ts`, `_devlog_clash_save.ts`, `_devlog_final.ts`, `_devlog_probe.ts`,
`devlog-clash-seed.ts`, `devlog-emit-save.ts`, `tools/devlog/capture.spec.ts`). Two steps of
`npm run check` read the **directory** rather than git, so both fail on them and neither failure is
this wave's: `tools:registry:check` (the registry cannot match a tree it does not own) and
`check:tools` (7 typecheck errors, all inside those files). `check` is a chain, so it stops at the
first of them and never reaches the typecheck, the units, the components or the build.

Nothing of this wave was touched to work around it and no foreign file was committed or deleted. The
wave was gated step by step instead, each exit code read from its own log, and the two blocked steps
are named in the report with this receipt.

| option | what it means |
| --- | --- |
| **A** (recommended) | that session commits its tools on its own branch, or removes them; the two steps then pass unchanged. |
| B | I commit them here under a «foreign tools» note – but then this branch's PR carries another session's unfinished work, and the registry documents files that may never land. |

⚠ ONE CONSEQUENCE TO KNOW ABOUT EITHER WAY: `tools/README.md` says «do not hand-edit» and carries its
own file counts, so it was left exactly as it stands – which means **this wave's two new tools
(`tools/college-scene-bench.ts`, `tools/_reveals.ts`) are not in the registry yet**. One
`npm run tools:registry` picks them up the moment the seven foreign files are gone, and until then no
regeneration is honest: the generator reads the DIRECTORY, so it would write another session's
unfinished filenames into a tracked document on this branch.

## 6. Confirm the spun-off card

`fits.ts` charging 0px for a single-word control is a **shared measurement helper** whose blast
radius is the whole component suite – a correct charge would move every row assertion in the app by
an unknown amount, so it needs a census before it changes. It is on your task list as its own card
rather than folded in here. Say if you would rather it rode this branch, as the bench rot did on your
23.09 ruling.

## 7. She wins the College League in more than a third of her years – is that the right student field?

Measured, not guessed (`tools/college-scene-bench.ts`, 24 careers walked through the fork and out the
other side, 77 years that held a championship):

| | measured | we had predicted |
| --- | --- | --- |
| college YEARS she wins | **36.4%** (28 of 77) | coarse 15–35% |
| college CAREERS with at least one title | **66.7%** (16 of 24) | coarse 40–70% |
| the spread | 8 careers with none, 9 with one, 3 with two, 3 with three, 1 with four | – |

So two thirds of college careers hold a student title, and she wins better than one year in three.
That is **1.4 points above the top of the band we predicted**, which is inside the honest error of a
coarse guess – it is flagged rather than smoothed because invariant 5 says so, not because it is a
defect.

⚠ It is a balance fact and it is yours. The mechanism is the standing ruling working as designed: the
field is `standard 56` and **does not scale with her programme tier**, so the only thing that moves
this number is her own development – and by year two her development has moved it. Nothing is wrong;
the question is whether a student championship she wins a third of the time is the story you want,
given that it is the one tournament of the year and the thing the national selectors read.

| option | what it means |
| --- | --- |
| **A – leave it** (recommended) | she is a scholarship athlete among scholarship athletes and she is good. The call-up ladder already reads the result, so a high title rate feeds the one stake the year has. |
| B – raise the field | a stronger student field makes the title rarer. ⚠ It also makes the call-up rarer, because the selectors read this result – one number, two effects, and it needs a bench arm before it ships. |
| C – widen the draw | 16 instead of 8 means four matches and a rarer title. Refused when the fixture was built, on your own «перелистывание 1 года за клик» – four watchable matches inside one week of a freeze designed as the shortcut. |

## A second finding worth your eye, and it needs no answer

The floor you ruled in Q1 is **nearly inert**, and the measurement says why. The parting's §12
premise was «a college-fork career ends with a small account, so the graduate's home reads
`working`». Walked: the graduates' own accounts map to **17 wealthy, 1 middle, 1 working**. She goes
back on tour and she earns. So the clause lifted exactly **one career of nineteen (5.3%)** – it is
right, it is worth having for that one, and it is not the structural repair §12 thought it was.

⚠ The honest caveat: the walk uses the bench's competent `player` policy. A player who plays worse
meets the floor more often than 5.3%, and nothing measures how much more.
