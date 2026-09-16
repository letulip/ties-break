<script setup lang="ts">
// ⭐⭐ v73 – THE LIFE BEAT, AND WHAT HE SAYS BACK. The private life's wave 2; the surface half of
// docs/plans/wave-2-the-reaction-surface-runbook-2026-09.md §5.
//
// ⚠⚠ THIS DIALOG OWNS NO SENTENCE. Every word on it – the heading, HER LINE, and every option
// label – is assembled ENGINE-side (engine/world/lifeBeat.ts, from the approved pools) and handed
// over on `snapshot.lifeBeatPrompt`. This file renders what it is given, verbatim, and adds nothing:
// no kicker, no lead-in, no week label, no count. That is not tidiness, it is CLAUDE.md invariant 4
// with the loophole closed – a component that carries its own copy is a second place her voice can
// be edited from, and the one place it may be edited from is the pools, where the owner approves it.
// `tests/component/life-beat-dialog.test.ts` asserts the rendered text is EXACTLY the prompt's own
// strings and nothing else, so a sentence added here fails rather than ships.
//
// ⭐⭐⭐ v74 T15 – AND IT NOW SERVES TWO ENTRANCES ON ONE CONTRACT. `snapshot.lifeBeatPrompt` is the
// blocking one (the week is stopped and this card is why); `snapshot.softBeat.prompt` is tier 1's,
// opened from a Home card the player chose to tap, on a week that never stopped at all. ⚠ THE ONLY
// DIFFERENCE IS WHICH FIELD THE `soft` PROP READS: same component, same prompt type, same
// engine-side re-validation, same law below – «no new dialog exists anywhere» is the ruling, and one
// prop is what keeps it true.
//
// ⚠ EVERY BUTTON IS AN ANSWER OR THE RECORDING OF ONE, AND THERE IS NO X – the birthday's own law,
// for a stronger reason. (Since round 42 #8 the card can also hold the Proceed that records the
// selected answer – still not a way out: it is disabled by nothing but flight, appears only under a
// made selection, and closing the card is still exactly «the answer landed».)
// BirthdayDialog argues it from the owner's «попап на ДР всегда»: if the card could be closed,
// closing it would silently become the "gave nothing" branch. Here the beat is HER SPEAKING, and a
// dialog the player can walk away from would answer her by walking away – so `@click.self` is
// deliberately not wired on the scrim, Escape is passed no handler, and the week stays stopped until
// he says something. The engine holds the other end of that contract: `advanceWeeks` refuses to tick
// while a BLOCKING `lifeLog` row is unanswered, and `answerFork` refuses too, so he hears her out
// first. ⚠ ON THE SOFT ENTRANCE THE LAW IS THE SAME AND THE CONSEQUENCE IS SMALLER: the week was
// never stopped, so nothing is held hostage – but a card opened to hear her out still has no way out
// that is not one of the three things the parent may say, and one of them is «tell her it can keep».
//
// ⚠ AND THERE IS NO NUMBER ON THIS SCREEN. Her words move `bond` twice – once here, once at the
// deed – and none of that may be shown: no meter grows a first pixel, no count, no bar, no price
// (an answer is never a purchase, so `answerLifeBeat` carries no `amountCents` and none of its words
// carry a figure). The strongest form of that guarantee is the one above: the component renders the
// prompt's strings and nothing else, so it has nothing to put a number in.
//
// ⭐⭐⭐ ROUND 40'S CONVENTIONS, COPIED AND NOT RE-INVENTED. These controls SELECT – they are what
// the parent says, not a way on – so they are drawn as what they are: `role="radiogroup"` named by
// her line, `role="radio"` with `aria-checked` on each answer, the accent ball beside the label, and
// arrow keys that walk the group. The whole argument for the shape, and for why the ball is two CSS
// declarations rather than an `<img>` or an inline `<circle>`, is in `PrologueCard.vue`'s own style
// block; the tokens below are that control's, on purpose, so the two cannot drift apart.
//
// ⭐⭐⭐ ROUND 42 #8 – AND SINCE THIS ROUND THEY REALLY DO ONLY SELECT. The owner, on the deployed
// wave-5 build: his double-tap answered a beat before he could read it, and he asked for the
// prologue's own round-41 #9 shape by name («Надо сделать как на прологе "выбор + proceed"», and on
// focus: «вот не надо нам там фокус»). So: the first tap marks a radio and records NOTHING; a
// Proceed appears under the group once something is selected, and IT is the one control that
// dispatches; and focus at open lands on the CARD (announced through `aria-labelledby`), never on an
// answer – a held Enter arriving with the dialog presses nothing. The `listen` detour keeps its own
// two-step shape (10.09's ruling below), so nothing about «Say nothing» got a third tap.
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import type { LifeBeatFollowUp } from '../shared/protocol'
import { useGameStore } from '../stores/game'
import { useDialogFocus } from '../composables/dialogFocus'
import { playSfx } from '../audio/sfx'

const game = useGameStore()

/** ⭐⭐⭐ v74 T15 – WHICH OF THE TWO PROMPTS THIS MOUNT RENDERS, and it is the ONLY thing the soft
 *  surface adds to this component (who-she-is §5b's «SOFT BLOCK CONCRETIZED» amendment: «Tapping it
 *  opens the SAME `LifeBeatDialog` on the same prompt contract – modal only because the player chose
 *  to listen. No new dialog exists anywhere»).
 *
 *  ⚠⚠ THE PROP CHOOSES THE SOURCE AND CHANGES NOTHING ELSE. `snapshot.softBeat.prompt` is a
 *  `LifeBeatPrompt` like `snapshot.lifeBeatPrompt`, so everything below – the radio group, the
 *  listening detour, the engine-side re-validation on the way back, the no-X law, the height cap –
 *  is one implementation serving both. A second component would have been a second place her voice
 *  could be edited from, which is the loophole the header closes.
 *
 *  ⚠ DEFAULT FALSE, so every existing mount (App.vue's blocking one, and every mounted test written
 *  against it) asks exactly the question it always asked. */
const props = withDefaults(defineProps<{ soft?: boolean }>(), { soft: false })
const prompt = computed(() =>
  (props.soft ? game.snapshot?.softBeat?.prompt : game.snapshot?.lifeBeatPrompt) ?? null,
)

// ⭐⭐ 10.09 – «SAY NOTHING» BECAME HONEST (the owner's editorial ruling): choosing to listen no
// longer records the answer on the first tap. While a reply is open, her second line (engine-
// assembled) replaces the answer column, and the ONE control left – the engine's own `done` label –
// is what records the option and closes the beat. So the reward of choosing is more of her, the
// answer still cannot be given by accident, and walking away is still not a way out: the week stays
// stopped until the second tap. ⚠ An answer the engine gave NO follow-up is an ordinary radio:
// select, then Proceed, like every other answer (⚠ ROUND 42 #8 re-aimed this – it used to record on
// the first tap, and «select never dispatches» now binds every option of every beat; the flat pool's
// silence staying silent is untouched, it just takes the same two taps as its siblings).
//
// ⭐⭐⭐ ROUND 42 #15 – AND SINCE THE SMALL-TALK EXCHANGE THIS IS NOT THE FORK'S DETOUR ANY MORE, IT
// IS THE CARD'S SHAPE. The owner, on the deployed build: «выбрал пункт, чтобы она сказала больше, а
// попап закрылся… Сейчас выглядит как "сказала А, но никогда не сказала Б"». So the prompt carries a
// LIST of follow-ups (`prompt.followUps`) and this component asks one question of the answer that
// was pressed – «did the engine write her a reply to this?» – instead of comparing the id against
// the single `listen` the fork used to be the only owner of. Nothing else about the two-step moved:
// select shows her, `done` records.
const replying = ref<LifeBeatFollowUp | null>(null)
watch(prompt, (p) => {
  if (p === null) {
    replying.value = null
    chosen.value = null
  }
})

/** ⚠ THE ENGINE'S BINDING AND NEVER THIS COMPONENT'S GUESS: which answer, if any, earns a second
 *  line of hers. `undefined` is «this answer is an ordinary radio», which is most answers of most
 *  beats. */
function followUpFor(optionId: string): LifeBeatFollowUp | undefined {
  return prompt.value?.followUps.find((f) => f.optionId === optionId)
}

// ⚠ AVAILABILITY IS DERIVED ON EVERY RENDER, NEVER LATCHED (round 40's third convention). Both
// halves are live state read fresh each frame: `sending` guards the double-tap while the worker
// round-trips – `answerLifeBeat` throws on a beat that is already answered, so without it a fast
// second press surfaces an error toast for a decision that actually succeeded – and `game.busy` is
// the store's own in-flight flag, so a command started anywhere else disables these too. A set of
// ids latched at mount would go stale the moment either moved.
const sending = ref(false)
const busy = computed(() => sending.value || game.busy)

/** ⭐ WHICH ANSWER THE PARENT SELECTED, and it is the radio's `aria-checked`. ⚠ NOT A
 *  RECOMMENDATION: it is null until a press, so nothing is marked on arrival and the card cannot
 *  point at an answer of its own.
 *
 *  ⭐⭐⭐ ROUND 42 #8 – A PRESS ON A RADIO IS A SELECTION AND NOTHING ELSE. The owner's double-tap
 *  answered a beat before he could read it («мой второй автоклик выбрал какой-то пункт»), so the
 *  first tap now only marks; nothing is recorded until the Proceed under the group is pressed –
 *  the prologue's own round-41 #9 pattern, on his explicit ask. The mark therefore STAYS through a
 *  refused send: it is what he selected, not a claim the world took it, and the card still asking
 *  with his selection standing is exactly the state a retry wants. */
const chosen = ref<string | null>(null)

/** ⭐⭐⭐ ROUND 42 #8 – THE FIRST TAP: select. Recording is `confirm()`'s alone. An answer that
 *  earns a reply keeps its own two-step shape (select opens her second line; the engine's `done`
 *  label is what records), so such an answer never meets the Proceed at all. */
function select(optionId: string): void {
  if (busy.value) return
  // The reply step: mark the choice, show her second line, record NOTHING yet. The second tap (the
  // engine's own `done` control) is the answer. Pure presentation – no command, no draw.
  const follow = followUpFor(optionId)
  if (follow !== undefined && replying.value === null) {
    chosen.value = optionId
    replying.value = follow
    playSfx('clickSoft')
    // ⚠ ROUND 42 #8 – focus goes to the CARD, not to the `done` control. `done` records the answer,
    // and a held Enter walking straight from the radio onto a focused `done` would record the
    // option on the key repeat – the exact hazard «вот не надо нам там фокус» names, one phase in.
    void nextTick(() => card.value?.focus({ preventScroll: true }))
    return
  }
  chosen.value = optionId
}

/** ⭐⭐⭐ ROUND 42 #8 – THE SECOND TAP: the Proceed under the group, and the ONE place a radio's
 *  selection becomes the recorded answer. Its label is the ENGINE's (`prompt.confirm`), because
 *  this dialog owns no sentence. */
async function confirm(): Promise<void> {
  const optionId = chosen.value
  if (optionId === null || busy.value) return
  sending.value = true
  try {
    await game.answerLifeBeat(optionId)
    // ⚠ `clickSoft`, AND NOTHING ON MOUNT. BirthdayDialog's reasoning holds unchanged: KnockDialog
    // opens on `ooh` because a knock is an alert, and this is not one. No sound the manifest lacks.
    playSfx('clickSoft')
  } finally {
    sending.value = false
  }
}

/** The second tap of the reply step – the one that actually answers. The id is the ENGINE'S binding
 *  (the follow-up's own `optionId`), never this component's guess. */
async function finishReply(): Promise<void> {
  const follow = replying.value
  if (follow === null || busy.value) return
  sending.value = true
  try {
    await game.answerLifeBeat(follow.optionId)
    playSfx('clickSoft')
  } finally {
    sending.value = false
  }
}

/** ⭐ THE RADIO GROUP'S OWN KEYS, `PrologueCard.vue`'s handler and its documented variation: the
 *  arrows move FOCUS and do not select, because selecting on focus would answer her with an arrow
 *  key and take the week with it. Space and Enter are the button's own. */
function onGroupKey(event: KeyboardEvent): void {
  const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight'
  const back = event.key === 'ArrowUp' || event.key === 'ArrowLeft'
  if (!forward && !back) return
  const group = event.currentTarget as HTMLElement
  const items = [...group.querySelectorAll<HTMLButtonElement>('button:not([disabled])')]
  const at = items.indexOf(document.activeElement as HTMLButtonElement)
  if (at < 0) return
  event.preventDefault()
  items[(at + (forward ? 1 : items.length - 1)) % items.length]?.focus()
}

// D1 – IT IS A MODAL, IT SAYS SO, AND IT HOLDS THE KEYBOARD. Escape is passed no handler, for the
// reason at the top of this file: there is no way out of this card that is not an answer.
// ⭐⭐ ROUND 42 #8 / #17(c) – focus OPENS on the card, never on an answer («вот не надо нам там
// фокус»), and on close it is NOT handed back to the week button: this dialog is raised over the
// Proceed press, and returning there re-fires a held Enter – one of #17's three measured
// double-advance mechanisms. Both arguments live on `DialogFocusOptions` in dialogFocus.ts.
const card = useTemplateRef<HTMLElement>('card')
useDialogFocus(card, undefined, { focusOn: 'card', restore: false })
</script>

<template>
  <div v-if="prompt" class="dialog-overlay">
    <!-- The role and `aria-modal` go on the CARD, not on the scrim: the backdrop is not part of the
         dialog, it is what the dialog is over. `tabindex="-1"` is the focus trap's landing place.
         NO handler on the scrim – a stray tap beside the card may not become an answer. -->
    <div
      ref="card"
      class="dialog-card season-summary life-beat-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="life-beat-heading"
      tabindex="-1"
    >
      <!-- ⚠ THE ENGINE'S WORDS, VERBATIM, AND THERE ARE NO OTHERS ON THIS CARD. No kicker and no
           week label: both would be sentences of this component's own, and her voice is the pools'.
           See the script header for the whole argument. -->
      <h2 id="life-beat-heading" class="season-summary-title">{{ prompt.heading }}</h2>

      <!-- HER LINE. Written against the four voice bibles engine-side and printed as it was
           written – this template may not touch it, shorten it or wrap it in anything. -->
      <p id="life-beat-said" class="life-beat-said">{{ prompt.said }}</p>

      <!-- ⭐ 10.09 – HER REPLY, only once he has chosen. The engine's words verbatim, exactly like
           the line above; rendered as further paragraphs of the same voice, because they ARE.
           ⭐⭐⭐ ROUND 42 #15 – AND THERE MAY BE TWO OF THEM, which is the spec's §8d.2 arriving on
           the screen: a `story` is two beats, the incident is shared by every route and the branch
           is the aftermath, so her reply is a LIST and every route renders the whole of it. A
           v-for and not two slots: the count is the engine's. -->
      <p
        v-for="(line, i) in replying?.said ?? []"
        :key="i"
        class="life-beat-said life-beat-continued"
      >
        {{ line }}
      </p>

      <!-- ⭐⭐⭐ WHAT HE MAY SAY BACK – a real radio group, named by her line, because these controls
           SELECT rather than advance (round 40 #1). The order is the engine's. Every control is the
           same class: nothing here marks one of them as the one to take, on a card whose whole
           subject is that the answer is his.

           ⚠ LAST IN THE CARD'S FLOW BEFORE THE WAY ON, AND THAT IS STRUCTURAL. `tests/component/
           fits.ts` reads the last control's box off the CARD's own bottom edge – before a selection
           this group is the card's last element, and once one is made the Proceed below it is, so
           the measured control is the real way out in both states. The card is a plain tenant of
           `.dialog-card`, which carries the height cap and the scroller that round-20 #3 put there –
           so a beat whose words run long scrolls instead of pushing the last answer off the phone. -->
      <div
        v-if="replying === null"
        class="life-beat-choices"
        role="radiogroup"
        aria-labelledby="life-beat-said"
        @keydown="onGroupKey"
      >
        <button
          v-for="option in prompt.options"
          :key="option.id"
          class="life-beat-choice"
          type="button"
          role="radio"
          :aria-checked="chosen === option.id"
          :disabled="busy"
          @click="select(option.id)"
        >
          <span class="life-beat-mark" aria-hidden="true"></span>
          <span class="life-beat-choice-label">{{ option.label }}</span>
        </button>
      </div>

      <!-- ⭐ THE REPLY PANEL'S ONE CONTROL – it ADVANCES (records the chosen option, closes the
           beat), so it wears the advance idiom, not a fourth radio. Label is the engine's. It
           replaces the radiogroup rather than following it, so in either phase the LAST control in
           the card's flow is the one `tests/component/fits.ts` measures – the 375x667 verdict stays
           honest in both. -->
      <button
        v-else
        class="life-beat-listen-done"
        type="button"
        :disabled="busy"
        @click="finishReply()"
      >
        {{ replying.done }}
      </button>

      <!-- ⭐⭐⭐ ROUND 42 #8 – THE PROCEED, the prologue's round-41 #9 shape on the owner's own ask.
           It APPEARS when an answer is selected (never before – a way on drawn under an unanswered
           question would be offering to leave a card that is still asking), it is the ONE control
           that records, and its label is the ENGINE's `prompt.confirm` because this dialog owns no
           sentence. ⚠ AFTER the radiogroup and never inside it: r40 #1's negative arm – what looks
           like a choice must BE one, and this advances. While it is rendered it is the card's last
           element, which is what `tests/component/fits.ts` measures the phone verdict off. The
           reply phase never renders it (`replying === null` here too): the reply's `done` is that
           phase's one recording control, and two recording controls on one screen would be two
           answers to one question. -->
      <button
        v-if="replying === null && chosen !== null"
        class="life-beat-proceed"
        type="button"
        :disabled="busy"
        @click="confirm()"
      >
        {{ prompt.confirm }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Shares `dialog-overlay` / `dialog-card` / `season-summary-title` with the other blocking popups,
   so the scrim, the box, the height cap and the heading cannot drift apart from them. What is local
   is her line and the column of answers.

   ⚠ EVERY COLOUR IS A DECLARED TOKEN WITH NO FALLBACK. That is round-17 #3's fix and it is kept
   here deliberately: `var(--card, #fff)` on BirthdayDialog's rows painted four white buttons in a
   dark app at a measured 1.09:1, on the one dialog the player could not dismiss. A fallback is only
   honest when the token is optional; for a colour that must be legible it is a second, unreviewed
   design nobody looks at. `tests/component/life-beat-dialog.test.ts` measures these through the
   real cascade rather than pinning a token name. */
.life-beat-said {
  margin: 0 0 14px;
  font-size: 15px;
  line-height: 1.45;
  color: var(--text);
}

.life-beat-choices {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ⭐ THE SELECTION IDIOM, NOT THE ADVANCE ONE (round 40 #1). `--card-top` on a `--line` hairline is
   what this app paints a thing you SET; `--accent-wash` on `--accent-soft` is what it paints a way
   on. These are answers, so they wear the first.

   ⚠ ONE RULE FOR ALL OF THEM, AND NO `:first-child` / `:nth-child` ANYWHERE. A positional selector
   here would be the card recommending an answer, which is the one thing it may never do. */
.life-beat-choice {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 11px 13px;
  text-align: left;
  border: var(--stroke-hair) solid var(--line);
  border-radius: var(--radius-frame);
  background: var(--card-top);
  color: var(--text);
  cursor: pointer;
}

/* All of them together, so the hover cannot become a mark either. */
.life-beat-choice:hover:not(:disabled) {
  border-color: var(--accent-soft);
}

/* ⚠ THE STATE IS THE MARK AND THE EDGE, NEVER A FILL. `--accent-fill` laid over `--card-top` puts
   the text on this row under AA – PrologueCard measured 4.29:1 – so the chosen answer and the
   unchosen ones are read against the SAME ground. */
.life-beat-choice[aria-checked='true'] {
  border-color: var(--accent);
}

.life-beat-choice:disabled {
  opacity: 0.55;
  cursor: default;
}

/* ⭐⭐⭐ THE MARK IS THE BALL – our own yellow dot off the logo, minimal, nothing extra on it. The
   ruling and the full reasoning are in `PrologueCard.vue`'s style block and in docs/rounds/round-40.md;
   what matters here is that this is the SAME two declarations flipping on the SAME attribute, so a
   radio in the prologue and a radio in a life beat are one control.

   ⚠ THE EMPTY BALL HAS TO BE VISIBLE – that is the control being findable at all, not an extra
   element. The ring is `--accent-soft` (3.36:1 on this row, clearing the 3:1 WCAG 2.1 asks of a
   control's own boundary) and the centre is left to the row; the taken state is the ball itself.
   `aria-hidden` because the state is on the button – a decorative circle that announced itself
   would say it twice. Both states share a border box, so nothing on the row moves on a press. */
.life-beat-mark {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  margin-top: 1px;
  border-radius: 50%;
  border: var(--stroke-hair) solid var(--accent-soft);
  background: transparent;
}

.life-beat-choice[aria-checked='true'] .life-beat-mark {
  border-color: var(--accent);
  background: var(--accent);
}

/* `min-width: 0` so a long answer wraps inside the box instead of pushing the control wider than
   the card. */
.life-beat-choice-label {
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--text);
}

/* Her continuation sits closer to her first line than the answers did – one voice, two breaths. */
.life-beat-continued {
  margin-top: -6px;
}

/* ⭐ THE ADVANCE IDIOM for the listening panel's one control – `--accent-wash` on `--accent-soft`
   is what this app paints a way ON (round 40 #1), and recording the answer and closing the beat is
   a way on. Same box metrics as the answers so the card does not jump between phases; every colour
   a declared token with no fallback, the round-17 #3 rule this file already keeps.
   ⭐ ROUND 42 #8 – `.life-beat-proceed` is the SAME rule on purpose: the Proceed under the answers
   and the detour's `done` are the same kind of control (the one that records), so they wear one
   idiom and cannot drift apart. */
.life-beat-listen-done,
.life-beat-proceed {
  width: 100%;
  padding: 11px 13px;
  text-align: center;
  border: var(--stroke-hair) solid var(--accent-soft);
  border-radius: var(--radius-frame);
  background: var(--accent-wash);
  color: var(--text);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
  cursor: pointer;
}

.life-beat-listen-done:disabled,
.life-beat-proceed:disabled {
  opacity: 0.55;
  cursor: default;
}

/* The Proceed keeps the answers' own vertical rhythm under the group. */
.life-beat-proceed {
  margin-top: 8px;
}
</style>
