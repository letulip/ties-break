# Round 19 – the wrap week lies to a climbing girl, two items (13.08.2026)

Measured against `tennis-sim_naomi-3c2i_w621.tsave` – his own save, read locally, never committed,
never a fixture. Probe: `tools/plateau-probe.ts`.

Status: `[x]` shipped · `[~]` answered, nothing to build · `[>]` in flight · `[ ]` open.

## The two

- [>] **1. «Дешувка мне уже 2й сезон говорит "в машине", что она уже сколько-то не двигается никуда,
  хотя движение по таблице есть и мощное, сейчас на 106 месте, поднялась за сезон.»** – reproduced,
  and the cause is in the type's own documentation. Diagnosis in §1.
- [>] **2. «И по-моему за этим попапом скрылся или не показался попап с итогами сезона»** – he is
  right, and it is not a race: it is destroyed by construction. §2.

## §1 – the plateau rule reads a table she left three seasons ago

`plateauViewOf` builds its window from `seasonHistory[].endRank`. That field's own doc comment says
what it is: **«⚠ THE ITF ONE, always – the wrap writes `world.kidRank`, which is the international
alias. See `byTrack` below for the other two tables.»** So the natural end asks "has the table
moved?" of the ITF table – while Naomi is a professional whose WTA rank is what she and the player
are actually watching.

Her record, from the probe:

| season | `endRank` (ITF – what the rule reads) | `byTrack.wta` (the table she is on) |
| --- | --- | --- |
| 8 | #82 | #136 |
| 9 | #80 | #169 |
| 10 | #77 | #123 |
| 11 | #84 | **#106** |

The rule's own arithmetic on those numbers:

* window (seasons 9-11) = #80, #77, #84 · spread **7**, inside the band of 20 → **"flat"**;
* best before the window = **#6**, her ITF rank as a sixteen-year-old junior → nothing in the window
  beats it → **"no improvement"**;
* both halves true → `plateauReading = true` → the card is raised, two seasons running.

Asked of the table she is on, the same function returns **false**.

**And there is a second defect underneath the first, which is the one that would survive a naive
fix.** `bestBefore` is drawn from her whole career, so it includes her JUNIOR peak on the junior
ladder. No professional will ever beat their own junior ITF rank – so condition 2a is permanently
satisfied for every girl who turns pro, and the plateau becomes a rule about age rather than about
progress. Reading the right column is necessary but not sufficient: the comparison has to stay
inside ONE ladder.

**The fix, and its conservative direction.** The rule asks the question of the ladder she is
currently on, comparing only seasons that have a rank on that same ladder. Rows banked before v46
carry no per-track figure and are therefore not comparable – for those the rule must DECLINE to
fire. Refusing to ask is much cheaper than telling a climbing girl she is stuck: a missed plateau
costs one off-season question that never appeared, a false one is what he has now been shown twice.

## §2 – answering the retirement destroys the season wrap-up

`showSeasonSummary` requires `stopReasons.includes('season-end')`, and `stopReasons` is set **only
by the command that produced them**: `sim.worker.ts` passes them to `toSnapshot` on the `advance`
that stopped, and every other command builds its snapshot without them. `App.vue`'s own comment
already knows this – «`stopReasons` dies with the advance that produced [it]».

The retirement offer is raised ON the wrap week by construction (the gate's own comment says so), so
the collision is guaranteed, not occasional:

1. the advance stops with `season-end`, and the wrap-up would show;
2. `retirement` outranks it in the ordered list, so the question is asked first – correct;
3. the player answers → `answerRetirement` → a fresh snapshot **with no `stopReasons`**;
4. `season-end` is gone, and the wrap-up can never be satisfied again. The season's summary is lost.

The injury report survives the same ordering only because dismissing it issues NO command – it is a
client-side flag, so the gate is merely re-evaluated. Anything cleared by a real command destroys
the reasons behind it. The fork sits in the same list one rank above retirement and has the same
problem by the same argument.

⚠ So the fix is not "show the wrap-up first". The order is right – a question time is stopped on
outranks a summary. What is wrong is that a REASON THE ENGINE PRODUCED is stored somewhere a later
command silently erases.
