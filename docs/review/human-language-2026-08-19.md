---
type: review
status: audit
area: narrative
canonical: false
last-reviewed: 2026-08-19
baseline: 13d8f95
---

# Human-language review – 19 August 2026

## Verdict

Ties Break already has a distinctive voice when it is specific: a trophy on a back seat, a bag by
the door, tea made while nobody says the difficult thing. The copy sounds artificial when it stops
observing and starts summarising. The largest defect was structural rather than editorial: the diary
knew whether school had ended, but not her age, college status, or whether the parent still shared
her ordinary household. That made a 24-year-old eligible for homework, bedroom, breakfast and “we
said no” lines written for a teenager.

This branch fixes that boundary and rewrites the most exposed phrase systems. It does not run prose
through an “AI detector”; those tools cannot tell good character writing from a statistical style.
The test used here is simpler: could this parent honestly have seen or heard this detail, at this age,
and is the sentence doing more than reporting a database field?

## Scope and method

- Broad search covered the 176 TypeScript/Vue files containing substantial string literals.
- The deep editorial pass covered roughly 460 authored rows in `diary/pool.ts`, `weekNotes.ts`,
  `travelNotes.ts`, `world/birthday.ts`, `fridgeNote.ts`, and `kidLife.ts`.
- Separate voices were checked, not flattened: parent diary, coach assessment (`radar.ts`), match
  broadcast (`viz/commentary.ts`), transactional event feed, and blocking UI.
- Existing fact licences, deterministic selection, short-copy budgets, mounted UI tests and the
  main-RNG boundary were treated as product requirements.

## Findings

### HLV-01 – High: the parent remained physically present in adult life

`DiaryFacts` carried `schoolOver` but no age or narrative relationship to the household. “At home”
only meant “not at a tournament”; it did not prove that she was in the family home. Consequently,
late-career pools could observe homework at the kitchen table, a bedroom after a loss, a garage-door
serve, parental permission, and a washing machine in the shared house.

Implemented: snapshot-time `DiaryLifeStage` derives `school`, `after-school`, `college`, or
`independent`. At 22+ the parent learns through calls, messages, family chat, visits and photographs.
It is not persisted and changes no mechanics or save schema.

### HLV-02 – High: birthdays were grammatically correct and emotionally flat

The dialog repeated “She is N today” every year. Gift outcomes read like transaction receipts:
“She asked for X, and got it.” The catalogue used “She has been asking…” as the opening of most
clues, which made otherwise good objects sound generated from one template.

Implemented:

- deterministic age-banded headings on a dedicated presentation sub-stream;
- warmer wanted, unexpected, day-together and repeat outcomes;
- varied clue syntax across the catalogue while preserving the one-answer reading game;
- a less transactional event-feed line;
- separate school-age and independent birthday notes;
- birthday travel notes, including an injury-aware form.

The last item fixes a real omission: the code comment said a birthday in an airport belonged to the
journey pool, but the journey facts did not carry the birthday, so the birthday disappeared.

### HLV-03 – High: the Calendar’s fridge stayed in the childhood home forever

The 50-note pool is charming for a school-age child. At 24, “Please tidy your room” and “your lunch
is on the middle shelf” become involuntary comedy. The calendar now receives the same life stage as
the diary. College/independent home weeks use a separate pool of calls, parcels, Sunday dinner,
spare keys and messages; adult trip weeks use wishes sent to her rather than instructions left beside
her packed bag.

### HLV-04 – Medium: injuries mixed tenderness with authority

The strongest injury lines notice behaviour rather than explaining feelings. The weakest kept the
parent in command (“doctor's orders, and ours”, “twice we said no”) or attached homework to every
age. Those lines now stop before the independent stage. Adult variants use the physio’s decision,
clinic calls, photographs and the daughter’s own account of rehab. The blocking injury dialog remains
plain and clinical on purpose: at that moment the player needs kind, duration, cause and cancelled
events more than literary colour.

### HLV-05 – Medium: school ending and college return sounded like status dumps

“School's done / Tennis full-time” was compact but generic. It is now “School finished / No more
bells”, with the milestone feed reduced to “Last bell. From Monday the mornings are hers.” The
college epilogue still states years, money, national calls, age and ranking, but connects them as a
return to life rather than five database sentences.

College birthdays remain a deliberate gap: college advances a year at a time and cannot pause on a
blocking gift dialog. The birthdays reach the feed, but there is no annual birthday vignette. That is
the best next narrative addition; see the proposals document.

### HLV-06 – Medium: repetitive sentence machinery created the “AI” impression

The recurring symptoms were:

- identical openings across a catalogue;
- perfectly balanced two-clause summaries;
- explicit emotional conclusions instead of an observed detail;
- a moral or assessment at the end of a small moment;
- chronological compression (“this happened, then this, therefore she felt this”);
- adult domestic knowledge the narrator had no honest route to possess.

The rewrites favour one concrete object, a small piece of friction, varied rhythm, and subtext. Mild
humour comes from behaviour (“the calendar argued with dinner”), not from a writer performing jokes.

## What should remain plain

- Worker errors, costs, dates, eligibility and destructive choices should stay direct.
- Coach lines should assess tennis; making them sound like the parent would erase a useful voice.
- Match commentary should remain broadcast language, not warm family narration.
- Migration text and historical event strings must not be rewritten only for style; old saves and
  event history need stability.
- Silence is part of the diary. More variation does not mean every surface should speak every week.

## 22+ life: recommendation

Age 22 should be a narrative-distance boundary now, not proof of a universal housing fact. People
leave home at different ages and under different economics. The current implementation assumes her
ordinary life is independent enough that a parent no longer narrates it from inside the room; this
solves the voice problem without inventing rent, an address or a move the simulation never modelled.

Only add a persisted residence mechanic when residence creates decisions: rent versus travel,
living near a training base, a college room, returning home after injury, or time deliberately spent
with family. At that point it needs an explicit state and a move event. Until then, a derived voice
stage is the honest KISS solution.

## Changed evidence

- Narrative boundary: `src/shared/protocol.ts`, `src/engine/diary/facts.ts`,
  `src/engine/world/snapshot.ts`
- Weekly/photo/injury copy: `src/engine/diary/pool.ts`, `weekNotes.ts`, `travelNotes.ts`
- Birthdays: `src/engine/world/birthday.ts`, `src/components/BirthdayDialog.vue`
- Adult calendar notes: `src/composables/fridgeNote.ts`, `CalendarScreen.vue`
- School/college: `src/engine/kidLife.ts`, `world/milestones.ts`, `world/college.ts`
- Guardrails: diary, week-note, travel-home, birthday, school, college, calendar and mounted dialog
  tests.

The current authoring rules are in [the human-voice guide](../design/human-voice-guide.md). Remaining
work is prioritised in [the proposals](../plans/human-language-proposals-2026-08-19.md).
