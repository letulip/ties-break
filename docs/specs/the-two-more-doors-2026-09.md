---
type: spec
status: draft
area: life
canonical: false
last-reviewed: 2026-09-17
---

# Two more doors out – leaving at the peak, and leaving after the fall

His 17.09, on finding that the model has exactly two doors and neither fits the cases he cares
about. **Nothing here is built.** It ends in questions for him, and every sentence a player would
read is a DRAFT.

## §1 The correction he asked for, first

He wrote: «правда с нашими текущими модификациями это [обвал] может стать незначительным или даже
недостижимым (поправь меня, если я не прав здесь)».

⭐ **He is not right, and the reason is worth keeping: a collapse is a RESULTS event, not a decline
event.** His own career is the worked example. The fall from #13 to #59 was three terms:

| term | size |
| --- | --- |
| ageing over the season | ~1.7 points, the ONLY term the seats touch |
| two mid-match retirements, both in 128-draws | the two events that pay most, exited at the rounds that pay least |
| the rolling 52-week points sum | 4,008 expiring against 1,584 replacing them |

The seats soften skill loss by a couple of points over years. They prevent no injury, no retirement
and no variance. **A collapse stays exactly as reachable as it was.**

⭐⭐ **And they make it BETTER material rather than worse.** A well-staffed player who collapses
anyway collapsed for a reason that is not neglect – which is precisely the story he wants this door
to tell, and it is one the game could not tell before, because until this wave a collapse and a
neglected career looked identical from outside.

## §2 Door 3 – she leaves at the peak

His calibration, and it is a RATE rather than a rule: **«менее 1–2% игрового тура»**, with four
named cases – Barty at 25 as the reigning world number one and Australian Open champion; Henin as
the ranked leader; Bartoli forty days after Wimbledon; Dementieva inside the top ten just after an
Olympic title.

⚠ **What they share is not an age.** It is that she is AT the top when she goes, and that the
decision is HERS. That second half is the part the current model cannot express at all: both
existing doors ask the PARENT a question. This one is her telling him.

**Shape to build:** a per-season draw at the off-season, purpose-scoped
(`rngFromSeed(\`${seed}:ending:peak:${season}\`)`, never MAIN), gated on her actually being at a peak
– a top ranking or a Slam inside the season – and firing at the rate he named. ⚠ Its FREQUENCY is
measured by bench and recorded predicted-against-measured, per invariant 5; «1–2%» is his target, not
a constant to paste.

## §3 Door 4 – she leaves after the fall

His: «обвал мы вполне можем с точки зрения эмоций использовать как триггер на уход, это тяжело точно
и мне кажется, что мы уже это знаем».

⚠⚠ **This is the door `plateauReading` explicitly refuses to be**, and its comment says so: «"No
improvement" alone would fire on a career that is FALLING APART – which is a different story and one
the natural end should not be telling.» The plateau was right to refuse it. **This spec is the story
it was deferring to.**

**Shape to build:** a draw gated on a REAL collapse – a season that loses most of its points and a
large rank fall – at a rate he sets. Not certainty: most players who fall keep playing, which is his
own «абсолютное большинство выступают до тех пор, пока позволяют здоровье, мотивация».

## §4 ⭐⭐⭐ WHAT THE TEMPERAMENTS SAY – his question, and it is the best part of this

He asked: «Что у нас ещё темпераменты могут сказать?» and gave three shapes himself – «хлопнула
дверью и ушла», «не выдержала и сдалась», «больше не хочу играть».

⭐ **They map one voice to one door, two voices each, and each one is a different exit rather than a
different sentence about the same exit:**

| voice | door | the shape of her leaving |
| --- | --- | --- |
| `fiery` | the fall | **she will not be seen losing.** Slams the door, at the moment it stops being bearable – his «хлопнула дверью» |
| `quiet` | the fall | **she does not announce it.** She is simply not entered next season – «не выдержала», without a scene |
| `deep` | the peak | **decided over a year and told when settled**, not while deciding. Barty's shape exactly – «больше не хочу играть» |
| `sunny` | the peak | **she leaves on a good day, FOR a life rather than AGAINST tennis.** The hardest of the four to write and the only one that is not a loss |

⚠⚠ **AND THE CONSEQUENCE THAT MAKES THIS COHERENT: if her temperament decides WHICH door she can
take, the ending is a fact about HER and not about the parent's management.** That is the same law
`lastWordLine` already obeys – «a line blaming a body, a load or a decision would be a promise the
engine does not keep». Two players in identical careers leave differently because they are different
people, which is this game's whole argument.

## §5 What is owed before any of this is built

- **His ruling on the rates**, both doors.
- **The `CareerEndingType` union widens** from six members to seven or eight. ⚠ It is persisted on
  `CareerEnding`, so the save question needs answering before the build: a union widened
  append-only is usually free (no old save holds the new value – `SmallTalkFact`'s fifth member is
  the precedent), but it is CHECKED and not assumed.
- **Every line a player reads is a DRAFT.** Four exits × four voices is a corpus of its own, and it
  is his the way the small-talk corpus is his.
- ⚠ **Scope.** Round 44 already carries a schema move, an 817-string catalogue, a development-model
  change and two UI surfaces. This is a fifth substantial piece. **The architect's recommendation is
  that it is its own wave**, built immediately after – not because it is less important, but because
  a PR nobody can read is how a wave stops being reviewable. His call.
