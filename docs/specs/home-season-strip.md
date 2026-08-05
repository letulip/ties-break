# The Home season strip – what it shows, and what it folds away

**Status:** shipped 05.08 (`feat/home-and-mail`). Supersedes the layout note in
`docs/specs/act2-pro-tour.md` §13.8 ("the strip is her whole climb at a glance").

## The rule, in one sentence

> **The strip shows the rungs the engine holds open, plus the one rung above the highest of them.
> Every other rung is folded behind an ellipsis chip, placed where the ladder actually skips, and any
> ellipsis expands the whole sixteen-rung ladder in place.**

Nothing is deleted: an outgrown rung keeps its finish and is one tap away.

## Why it exists

The owner asked for it twice.

> «На домашнем экране давай из раздела season убирать j серию, когда переросла. Вообще для экономии
> места в этом блоке предлагаю показать текущее доступное окно турниров как раз плюс один верхний
> недоступный уровень, а нижние недоступные можно за иконкой многоточия скрывать, они не нужны же.
> И места кучу сэкономим.» (04.08)

> «На Home screen в разделе Season я просил спрятать вообще всё неактуальное кроме смежных турниров
> за точечки, эта штука очень много места на экране занимает.» (05.08, beside a screenshot with the
> three junior rungs circled)

The first ask shipped. The second one is the same ask again, because **the first implementation did
nothing on the screen he was looking at.**

## The bug the second ask was reporting

The shipped rule computed a **span** – `[firstOpenIndex, lastOpenIndex + 1]` – and rendered every
index inside it. The comment above it said the window "is contiguous in ladder order by
construction", and treated a non-contiguous verdict as a case that would merely "widen the span
instead of dropping a rung out of the middle of the row".

**The window is not contiguous once she ages out of the Junior Tour, and that is the engine working
as designed.** `tierOutgrown` (`src/engine/world/ladder.ts`) closes a rung when the rung *three
above* it opens, and it carries an age clause – *"a door she cannot open yet cannot close the one
behind her"*. The three rungs above Local, Regional and National are J30, J60 and J300, which shut on
age for ever at nineteen. So for an adult professional the engine holds the domestic rungs open
*beside* the W rungs, with a hole between them – and the span-fill printed the hole.

Measured in the browser on a real save (seed `ownerlike`, week 318, age 20, professional, WTA #369),
at the owner's own 576-wide viewport:

| | rung chips | strip height | Season card |
|---|---|---|---|
| span rule (shipped) | 10 (+2 ellipsis) | 111 px, 4 rows | 167 px |
| set rule (this spec) | 5 (+3 ellipsis) | **52 px, 2 rows** | **109 px** |

The ten chips were `Regional · W`, `National · 🔒 124 / 150 national pts`, `J30 · 🔒 Under-19`,
`J60 · 🔒 Under-19`, `J300 · 🔒 Under-19`, `W15 · 🔒 0 / 120 international pts`, `W35 · W`,
`W50 · F`, `W75 · F`, `W100 · 🔒 Opens in the top 350` – i.e. the owner's screenshot, including the
three rungs he circled. Five of those ten were rungs the engine had *not* opened; they were on screen
only because they sat between two that it had.

## What is on screen, precisely

1. **Every open rung.** Read from `Snapshot.tierOpen` through `feedContext` – the one reader of the
   engine's per-rung verdict, already shared by the Season feed and the Calendar look-ahead. **The
   strip asks; it never re-derives.** Re-deriving "which rungs are open" in the UI has been the bug
   twice (`composables/tierState.ts`'s `engineOpen` header records both).
2. **One rung above the highest open one** – «плюс один верхний недоступный уровень». This is the
   aspiration, and it is the rung whose *unlock condition* is the goal text ("Opens in the top 250").
   That sentence is what makes the ladder legible, so it stays. The rungs above *that* are years away
   and cost a line each.
3. **An ellipsis per hidden run**, carrying its own count and range: `Show 5 more levels`,
   `5 levels hidden (National to W15) – tap to show the whole ladder`. One control per elision, where
   the elision is – a paginator's shape – rather than one at each end. A run of one says "level", not
   "levels": the singular is a real case (`{local}`), and `aria-label` is exactly the surface where
   that reads as a defect.

An ellipsis is never rendered for zero hidden rungs: an affordance for nothing is a control that lies
about having something behind it.

## Edge cases, and what they do

| state | behaviour | why |
|---|---|---|
| `tierOpen` absent (old fixture, no snapshot yet) | the whole ladder | the safe direction – an old save renders exactly as before |
| nothing open at all | the whole ladder | not a state the engine produces; a row of one ellipsis and no rungs would be worse than sixteen chips |
| `slam` open (top of the ladder) | aspiration clamps to the last rung, no ellipsis above | there is nothing above it |
| expanded | all sixteen, with a `−` chip to collapse | nothing is deleted – outgrown rungs keep their finishes |

## What overrules what

This rule **overrules** the two ⚠ notes above `SEASON_STRIP_TIERS` ("twelve chips … this row is her
whole climb at a glance … hiding outgrown rungs here would erase the finishes she earned on them").
The objection was right and it is *answered* rather than ignored: nothing is erased, the outgrown
rungs are one tap behind the ellipsis with their finishes intact. What the owner reported is that on
a phone the row wrapped to four lines and half of them answered a question he had stopped asking –
which is exactly what the sliding window was introduced to fix one storey down, in the event feed.

## Guard

`tests/component/home-strip-and-mail.test.ts` – **mounted**, not a source pin, and deliberately so:
the rule that failed here was a claim written in a comment, and a source pin would have agreed with
the comment. The net renders the row against the owner's own verdict and asserts which chips come
out. Mutation-verified: reverting `stripVisible` to a span turns the first test red.
