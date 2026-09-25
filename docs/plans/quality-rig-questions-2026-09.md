---
type: plan
status: current
area: quality-rig
last-reviewed: 2026-09-25
---

# The quality rig wave – what is yours to answer

Four questions. Three are wording or accessibility and one is a fork about product code; every one
of them is a choice with its options priced, and the wave is gated either way. The wave's own
documents: the convention [engine-ui-parity-2026-09.md](../specs/engine-ui-parity-2026-09.md)
(canonical, and §5 carries the two live instances with what closed them), and the plan
[quality-rig-builder-2026-09.md](quality-rig-builder-2026-09.md).

## 1. The outgrown chip's tooltip – keep the fragment, or let the engine speak alone?

The defect: the chip's tooltip was a screen-authored line, `Outgrown – her best {short} result stays
on the books`, asserted **unconditionally** – so on a rung with no best finish it told the player
about a result that does not exist. It also discarded the engine's own sentence, and that turned out
to cost more than the parity: on the eight outgrown chips measured, `refusal.detail` carries the
**actionable** half, e.g. «World Tour 50 – she is past this level, and it is still hers to enter: next
one Jul 11–17, 2033.»

Shipped on the adjacent `reached` arm's own shape, with no new words:

| | rung with NO best finish | rung WITH one |
| --- | --- | --- |
| before | `Outgrown – her best Local result stays on the books` | `Outgrown – her best Local result stays on the books` |
| now | `Local Open pays national points – she is on the world tour now, at #110. The bigger draws are hers.` | `Outgrown – her best Local result stays on the books · Local Open pays national points – she is on the world tour now, at #110. The bigger draws are hers.` |

The parity is true either way now. The question is only the second column, which is long.

| option | what it means |
| --- | --- |
| **A – as shipped** (recommended) | your fragment leads, the engine's sentence follows after the `·`. Nothing you approved is deleted, and the actionable half is back. |
| B – engine alone on both branches | one line, no new words, and the tooltip gets much shorter – but it **deletes copy you approved**, which is why it was not done. |

## 2. ⚠ A screen reader hears neither sentence on an outgrown chip – and that is not new

Measured while fixing #1, before and after: the chip is `role="img"` with an `aria-label`, and an
`aria-label` **suppresses** `title`. So a screen reader hears `Local: outgrown – Outgrown` and never
the engine's sentence. The untrue claim never reached it either, which is why the repair above left
nothing stale behind – but the actionable half does not reach it now.

The `locked` arm already solves this by folding `chip.title` into the spoken name. Doing the same here
means deciding what a screen reader hears, because the finish letter currently in the name would have
to give way or be kept beside a long sentence.

| option | what it means |
| --- | --- |
| **A – fold the title in** (recommended) | the spoken name carries the engine's sentence, exactly as `locked` does. One line. ⚠ Decide whether the finish letter stays in front of it. |
| B – leave it | a sighted player gets the sentence on hover, a screen-reader player does not. Consistent with nothing else on the strip. |

## 3. The feed filter's copy – it stays today, and there is a sharper third option

The builder's decision, taken **against a measurement** and written into the spec: the two screen-side
filters in `composables/tierState.ts` stay. The honest part is that the justification on record until
yesterday was **wrong about the code** – «the safe direction when no oracle arrives» describes a case
that cannot happen, because `feedContext` answers the no-oracle case before either filter is reached.
They only ever second-guess an oracle that is present.

Measured over **181 live snapshots** (six built careers plus 175 sampled weeks of a seventh walked
13→27): deleting both produces **0 differences** in the rungs, the working set or the rendered rows.
The cost of deleting them is two nets – one case re-aimed, and `dead-rungs.test.ts`' «with the UI's
filters WITHHELD» knob becoming a no-op, which is the good argument for keeping them: it would not go
red, it would stop being able to.

⭐ But the spec's own analysis splits the two halves, and the split is the answer:

| half | what it is | what it risks |
| --- | --- | --- |
| the **age** filter | **not a copy at all** – it CALLS the engine's `tierAgeBlock`, so it cannot drift | nothing; merely redundant |
| the **table** filter | a genuine second implementation with a constant of its own (`FEED_TABLE_SLACK = 1`) | ⚠ it can **silently defeat `PLAY_DOWN.domesticFromProTable`**, a documented A/B knob whose `false` re-opens the club draws in the engine while the screen would go on hiding them |

| option | what it means |
| --- | --- |
| **C – remove the TABLE half, keep the AGE half** (recommended) | the real copy goes with its real risk; the age half stays because calling the engine is already form A and it keeps the knob's `age: false` arm falsifiable. A copy that can mask a documented A/B is not defence-in-depth, it is a trap for whoever next runs that A/B. |
| A – both stay (as shipped) | zero risk today, and the instrument stays whole. The trap stays too. |
| B – both go | tidiest, and it costs the knob its whole meaning for a gain the measurement puts at zero. |

## 4. A paused match lets the screen sleep

Round-16 #20 shipped: the screen stays awake while a match runs, wired once inside `MatchViewer.vue`
(the single component that draws a match anywhere) and riding `playing` from the one playback clock.

⚠ `mode === 'live'` was the candidate that looks right and is about the Live badge – riding it would
have kept the screen awake on the Season sandbox and **slept through every re-watch in the game.**

The lock follows `playing`, so it is released the moment a match is **paused**, not only when it ends.
A player who pauses to read the commentary log will have the phone sleep on its normal idle timer.

| option | what it means |
| --- | --- |
| **A – as shipped** (recommended) | a pause is «I have looked away», and the platform's own idle timer is the right authority then. |
| B – hold it until the match ends | expressible in the same clock's vocabulary (`finished`), so it invents no second idea of «live» – but it keeps the screen lit while the player is doing something else. |

## Not a question – the line in CLAUDE.md

The convention's gotcha line is the architect's to add after merge, and the budget for it is yours.
Noted here so it is not lost: the wave did not edit `CLAUDE.md`.
