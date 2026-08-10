<script setup lang="ts">
// HER WEEK – the training dials (docs/specs/training-dials.md §9), and the screen the owner has been
// waiting for since he said the week schedule IS the dials.
//
// «у нас есть расписание недели и на каждый день там идут разные тренировки – это и есть ручки... для
// выбора родителя надо сделать строчку с названием занятия а ниже набор из 7 галочек на каждый день
// недели – он кликает и решает когда что тренировать... может вообще всю неделю из одного и того же
// собрать – его право.»
//
// ONE BLOCK PER KIND. A line with its name and its hours, seven checkboxes under it, five blocks down
// the tab. REST IS THE ABSENCE OF A TICK – it is not a sixth block, which removes the whole class of
// "what happens if you tick rest and serve on the same day".
//
// ⚠ VOLUME AND EMPHASIS ARE NOT CONTROLS, AND THERE IS NO INTENSITY. How many ticks there are is the
// volume, which rows they are in is the emphasis, which columns they are in is the arrangement; he
// sets none of the three directly and this file has a setter for none of them. The 4..6 band is the
// engine's (`PLAN_MIN_SESSIONS`/`PLAN_MAX_SESSIONS`) and is settled – owner, asked whether it should
// widen: «зачем? ну нас всё ок в этом плане я считаю».
//
// WHAT THIS FILE DOES NOT DECIDE, and the reason it can be read in one sitting: what a week is worth,
// what it costs, whether a day may hold two sessions, and whether a plan is legal at all. Every one
// of those arrives on the snapshot or is re-checked by `setPlan` engine-side (CLAUDE.md invariant 1),
// so a stale screen cannot corrupt a career and this component cannot invent a rule.
import { computed, ref, watch } from 'vue'
import { useGameStore } from '../stores/game'
import {
  PLAN_DAYS,
  PLAN_MAX_SESSIONS,
  PLAN_MIN_SESSIONS,
  planFromWeek,
  planSessions,
  planWeek,
  resolveWeek,
} from '../engine/plan'
import { coachHoursForPlan } from '../engine/coach'
import { DAY_LONG, DAY_SHORT, useCalendarWeek } from '../composables/weekDays'
import { SESSION_KINDS, WEEK_PLAN_PRESETS, type SessionKind } from '../shared/protocol'
import { formatCents } from '../shared/money'

const game = useGameStore()

/** ⚠ THE BLOCK NAMES ARE THE SPEC'S TABLE (§2), AND THE ORDER IS `SESSION_KINDS`' – which that array's
 *  own note calls display order and append-only. What each one works on is the engine's business
 *  (`development.ts` owns the kind -> SKILL table); the subtitle here is that table in the parent's
 *  language, so the tab explains its own consequence without a second source of truth for it. */
const KIND_LABEL: Record<SessionKind, string> = {
  general: 'General practice',
  serve: 'Serve & return',
  rally: 'Rally',
  fitness: 'Fitness',
  matchplay: 'Match play',
}
// ⚠ AND THERE IS NO SUBTITLE UNDER THE NAME. §2's "what it works on" column was drawn as a second
// line per block in the first build and measured at +85px down a tab whose whole argument is that it
// is one screen and a nudge (§9c). The names carry it – `Serve & return`, `Rally`, `Fitness`,
// `Match play` say what they work on – and §9b's own layout is a title line and seven boxes.

const PLAN_ORDER = ['light', 'balanced', 'grind'] as const
const PRESET_LABEL: Record<(typeof PLAN_ORDER)[number], string> = {
  light: 'Light',
  balanced: 'Balanced',
  grind: 'Grind',
}

// --- the week he is editing ---------------------------------------------------------------------
// ⚠ A LOCAL DRAFT THAT IS RE-SYNCED FROM THE SNAPSHOT, NOT A SECOND SOURCE OF TRUTH. Every tick fires
// `setPlan` immediately, and the engine's answer overwrites this - so the draft exists only to keep
// the seven columns from flickering through a round trip, and a refusal restores what the world says.
const savedWeek = computed<SessionKind[][]>(() =>
  game.snapshot ? planWeek(game.snapshot.plan).map((day) => [...day]) : [],
)
const draft = ref<SessionKind[][]>(savedWeek.value)
watch(savedWeek, (week) => (draft.value = week), { deep: true })

/** HOW MANY SESSIONS ONE DAY OF THE COMING WEEK MAY HOLD – the ENGINE's verdict, carried as data on
 *  the snapshot because no screen can re-derive it: `summerBlockWeek` refuses a doubled day on an
 *  injury, a booked family week, a tournament and a rested knock as well as on the calendar. */
const capacity = computed(() => game.snapshot?.planDayCapacity ?? 1)

const sessions = computed(() => planSessions(draft.value))
/** WHAT THE WEEK BUYS OF HIM, and it is the ENGINE's conversion rather than this file asserting that
 *  a session is an hour. §4 says every session is one billed hour and `coachHoursForPlan` is where
 *  that is spelled – so the total is READ from it, while each block's line counts its own ticks. If
 *  the two ever stopped agreeing the screen would say so out loud, which is the point of not
 *  duplicating the identity here. */
const hours = computed(() => Math.round(coachHoursForPlan(planFromWeek(draft.value))))
const perKind = computed<Record<SessionKind, number>>(() => {
  const out = {} as Record<SessionKind, number>
  for (const kind of SESSION_KINDS) out[kind] = 0
  for (const day of draft.value) for (const kind of day) out[kind] = (out[kind] ?? 0) + 1
  return out
})

/** THE WEEK AS IT WILL ACTUALLY BE LIVED. A plan is a standing statement and outlives the week it was
 *  built in, so three doubled days built in July are laid back out across September's seven single
 *  days. The engine's own `resolveWeek`, never a second spelling of it. */
const lived = computed(() => resolveWeek(draft.value, capacity.value))
const daysOff = computed(() => lived.value.filter((day) => day.length === 0).length)

const isOn = (kind: SessionKind, day: number) => draft.value[day]?.includes(kind) ?? false

// --- what the week ahead is ---------------------------------------------------------------------
// ⚠ THE TICKS STAY LIVE ON A WEEK SHE IS AWAY, AND §9b SAYS THEY SHOULD BE INERT. The deviation is
// deliberate and it is the smaller lie: a plan is a STANDING statement, `setPlan` accepts one on any
// week, and the exam fortnight in particular KEEPS her sessions (`isExamWeek` gates tournaments and
// bookings and has never touched training, which the calendar's own read-out says out loud). Freezing
// the grid for the weeks she is away would stop him planning the week AFTER, which is a refusal the
// engine does not make - the defect class this codebase names in the other direction. So the plan is
// always editable and a strip says which week it starts in.
const calWeek = useCalendarWeek()
const editable = computed(() => game.snapshot !== null)
/** WHAT THE COMING WEEK IS, when it is not an ordinary training week – and the sentence is the
 *  CALENDAR'S OWN (`CalendarWeek.readout`), never a second wording, so the two surfaces cannot
 *  describe one week differently.
 *
 *  ⚠ AND IT DOES NOT SAY THE PLAN IS SUSPENDED. Caught in the browser on the `pro` fixture: an
 *  earlier draft added "This plan starts when she is back" to every week whose days were not court
 *  days, which put it on the OFF-SEASON – the one block whose own read-out says the opposite («the
 *  coach is still billed and her skills still move, because this is the block where next year gets
 *  built»), and on the exam fortnight, whose read-out says her sessions stand. The screen does not
 *  know which weeks the engine trains through, so it says what the week IS and claims nothing more. */
const weekAheadNote = computed(() => {
  const title = calWeek.value?.title
  return title && title !== 'Training week' && title !== 'Summer block' ? calWeek.value!.readout : null
})

/** MAY HE PRESS IT? Three limits, all of them the engine's, shown as a disabled box beside a filled
 *  dot rather than delivered as a refusal after the press (§4: "so the limit is visible before he
 *  bumps into it"). Ticking a day that is full, or a fifth session past six, or removing the fourth,
 *  are the only three things this tab cannot do. */
function locked(kind: SessionKind, day: number): boolean {
  if (game.busy || !editable.value) return true
  if (isOn(kind, day)) return sessions.value <= PLAN_MIN_SESSIONS
  return (draft.value[day]?.length ?? 0) >= capacity.value || sessions.value >= PLAN_MAX_SESSIONS
}

async function toggle(kind: SessionKind, day: number): Promise<void> {
  if (locked(kind, day)) return
  const next = draft.value.map((d) => [...d])
  const at = next[day].indexOf(kind)
  if (at >= 0) next[day].splice(at, 1)
  else next[day].push(kind)
  draft.value = next
  // ⚠ THE ENGINE DERIVES `train`/`rest` FROM THE MATRIX AND IGNORES THE PAIR WE SEND, so this is
  // `planFromWeek` rather than a hand-built literal: one projection, computed in one place, and the
  // command carries an object that is already true instead of one the worker has to correct.
  await game.setPlan(planFromWeek(next))
  // ⚠ AND IF THE ENGINE REFUSED, THE SCREEN GOES BACK TO WHAT THE WORLD SAYS. The three limits above
  // mean a refusal should be unreachable - which is exactly the belief a stale screen is made of. A
  // refused command leaves `snapshot` untouched, so nothing else would ever put the boxes back.
  if (game.error) draft.value = savedWeek.value
}

async function applyPreset(key: (typeof PLAN_ORDER)[number]): Promise<void> {
  await game.setPlan(WEEK_PLAN_PRESETS[key])
}

/** ⚠ A PRESET IS SELECTED WHEN THE WEEK IS ITS WEEK, not when the train percentage matches. Five
 *  sessions arranged by hand project to the same 75/25 as Balanced does (`planTrainPct`), so reading
 *  `plan.train` back would light a pill up under a week the pill would not produce. */
const activePreset = computed(() =>
  PLAN_ORDER.find((key) => {
    const preset = planWeek(WEEK_PLAN_PRESETS[key])
    return preset.every((day, d) => {
      const mine = draft.value[d] ?? []
      return day.length === mine.length && day.every((kind, i) => kind === mine[i])
    })
  }) ?? null,
)

/** THE READ-OUT. The legend, in the parent's language – what she does, what it costs in HER time, and
 *  what it costs in money. The price is the ENGINE's (`coachBilling`, recomputed on every `setPlan`),
 *  never local arithmetic, which is the same rule the market's own price note keeps. */
const readout = computed(() => {
  const money = game.snapshot?.coachBilling.weeklyCents
  const off = daysOff.value === 1 ? '1 day off' : `${daysOff.value} days off`
  const doubled = lived.value.filter((day) => day.length > 1).length
  const shape = doubled > 0 ? `, ${doubled} of them two sessions a day` : ''
  const bill = money === undefined ? '' : ` ${formatCents(money)} this week.`
  return `${sessions.value} sessions, ${hours.value} hours${shape} – ${off}.${bill}`
})

/** ⚠ THE LIMIT IN WORDS AS WELL AS IN DOTS, AND IT IS THE HALF THE OWNER ASKED FOR BY NAME («Есть
 *  ограничение у нас по количеству тренировок в день в обычные дни и без школы, это тоже надо
 *  показать»). Caught in the browser at 375: on an ordinary school week five of the seven columns are
 *  full, so four of the five blocks render almost entirely disabled – which reads as a broken screen
 *  until something says one session a day is the rule. The dots carry it for a player who looks; this
 *  carries it for one who does not. */
const capacityNote = computed(() =>
  capacity.value > 1
    ? 'No school this week – a day can take two sessions, if you want them.'
    : 'One session a day while school is on – the dots are the room each day has left.',
)

/** WHY A BOX IS DISABLED, once, under the grid – so a full week does not read as a broken screen. */
const limitNote = computed(() => {
  if (sessions.value >= PLAN_MAX_SESSIONS) {
    return `${PLAN_MAX_SESSIONS} sessions is her maximum – untick one to move it.`
  }
  if (sessions.value <= PLAN_MIN_SESSIONS) {
    return `${PLAN_MIN_SESSIONS} sessions is her minimum – tick another before you take one away.`
  }
  return ''
})

const days = [...Array(PLAN_DAYS).keys()]
const dots = computed(() => [...Array(capacity.value).keys()])
function filledDots(day: number): number {
  return draft.value[day]?.length ?? 0
}
/** What a day head says out loud: its name, and what it is holding out of what it may hold. */
function dayHeadLabel(day: number): string {
  return `${DAY_LONG[day]} – ${filledDots(day)} of ${capacity.value} sessions`
}
function boxLabel(kind: SessionKind, day: number): string {
  return `${KIND_LABEL[kind]} on ${DAY_LONG[day]}`
}
</script>

<template>
  <div v-if="game.snapshot" class="hw">
    <!-- 1. THE PRESETS. A fast path, and nothing more: the blocks below do everything they do. Short
         labels on purpose - the market tab's own `Light 4/wk · Balanced 5/wk · Grind 6/wk` computes
         past the 343px available at 375 (spec §9c), and the counts live in the read-out instead. -->
    <div class="option-row hw-presets">
      <button
        v-for="key in PLAN_ORDER"
        :key="key"
        class="option-pill"
        :class="{ selected: activePreset === key }"
        :disabled="game.busy"
        @click="applyPreset(key)"
      >
        {{ PRESET_LABEL[key] }}
      </button>
    </div>

    <!-- 2. THE DAY HEADS, and the per-day limit shown as dots that fill. One dot on a school day,
         two on a day with no school, drawn before he bumps into the limit rather than arriving as a
         refusal. The owner asked for it by name and his words are in the script above this template:
         THIS IS A TEMPLATE, and the app's rule (pinned in tests/round13-nav.test.ts) is that no
         Cyrillic appears inside one, comments included. I put the quote here first and the guard
         caught it, which is the guard working - the same note CoachMarketScreen.vue carries. -->
    <div class="hw-heads" role="group" aria-label="The week, day by day">
      <div v-for="d in days" :key="d" class="hw-head" role="img" :aria-label="dayHeadLabel(d)">
        <span class="hw-head-name" aria-hidden="true">{{ DAY_SHORT[d] }}</span>
        <span class="hw-dots" aria-hidden="true">
          <i v-for="slot in dots" :key="slot" class="hw-dot" :class="{ full: slot < filledDots(d) }"></i>
        </span>
      </div>
    </div>
    <p class="hint hw-capacity">{{ capacityNote }}</p>

    <!-- 3. FIVE BLOCKS. A line with the name and what that row is spending in HER hours, then seven
         boxes under it. Nothing in a column has to be legible – the kind is named on the line above,
         where it competes with nothing – which is what dissolved the previous draft's need for five
         distinguishable wordless marks (§9c, §9d: no new art). -->
    <!-- ⚠ A `div`, NOT A `section`. The app's bare `section` rule is a padded panel, and at 375 its
         17px of side padding took the seven columns from 45.6px to 40.7px – under the 44px tap target,
         measured in a browser. The block is a title line and a row of boxes; it is not a card. -->
    <div v-for="kind in SESSION_KINDS" :key="kind" class="hw-block">
      <p class="hw-block-head">
        <span class="hw-block-name">{{ KIND_LABEL[kind] }}</span>
        <span class="hw-block-hours">{{ perKind[kind] }} h</span>
      </p>
      <div class="hw-row">
        <label v-for="d in days" :key="d" class="hw-cell" :class="{ locked: locked(kind, d) }">
          <input
            type="checkbox"
            class="hw-box"
            :checked="isOn(kind, d)"
            :disabled="locked(kind, d)"
            :aria-label="boxLabel(kind, d)"
            @change="toggle(kind, d)"
          />
        </label>
      </div>
    </div>

    <p v-if="limitNote" class="hint hw-limit">{{ limitNote }}</p>

    <!-- 4. THE READ-OUT. It IS the legend: rather than a row of glyphs and their names, the week says
         what it is in the parent's language – the register every other surface in this app uses for a
         week – and it absorbs what would otherwise be a separate price line. -->
    <p class="hw-readout">{{ readout }}</p>
    <!-- ...and what the coming week IS, when it is not an ordinary training week. The sentence is
         the calendar's, so the two screens cannot describe one week differently - and it claims
         nothing about whether the plan runs in it, which the screen does not know. -->
    <p v-if="weekAheadNote" class="hint hw-not-now">Next week – {{ weekAheadNote }}</p>
  </div>
</template>

<style scoped>
/* ⚠ THE 4px GAP IS A MEASUREMENT, NOT A TASTE (spec §9c, checked in a browser at 375 and 390 before
   this shipped). Content width at 375 is 375 - 2x16 = 343px, so seven columns at a 4px gap are
   (343 - 24) / 7 = 45.6px - above the 44px tap target. At 6px they fall to 43.4 and the row stops
   being pressable. The gap may not exceed 4px, and everything else on this tab bends around it. */
.hw-heads,
.hw-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.hw-presets {
  margin-bottom: 10px;
}
.hw-heads {
  margin-bottom: 4px;
}
.hw-capacity {
  margin: 0 0 10px;
}
.hw-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.hw-head-name {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: var(--label-track);
  color: var(--muted);
}
.hw-dots {
  display: flex;
  gap: 3px;
  height: 6px;
  align-items: center;
}
/* The capacity, as CSS rather than as art (§9d). An empty ring is a slot this day still has. */
.hw-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  border: 1px solid var(--accent-soft);
}
.hw-dot.full {
  background: var(--accent);
  border-color: var(--accent);
}

.hw-block {
  margin-bottom: 10px;
}
.hw-block-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 700;
}
.hw-block-name {
  letter-spacing: 0.01em;
}
/* WHAT THAT ROW IS SPENDING, right-aligned on its own title line - asked for by name: «чтобы он видел
   какие тренировки сколько "стоят" по времени». Every session is one billed hour of him. */
.hw-block-hours {
  font-variant-numeric: tabular-nums;
  color: var(--accent);
  font-size: 12px;
}
/* The cell is the whole column, so the tap target is the full 45.6 x 44 rather than the 22px glyph
   inside it - which is what §9c means by "the 4px constraint disappears". Both numbers are above the
   44px target and both were measured in a browser rather than computed from the sheet. */
.hw-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border-radius: 10px;
  background: var(--accent-wash);
  cursor: pointer;
}
.hw-cell.locked {
  opacity: 0.4;
  cursor: default;
}
.hw-box {
  appearance: none;
  -webkit-appearance: none;
  width: 22px;
  height: 22px;
  margin: 0;
  /* One hairline, like every other edge in this app (`--stroke-hair`, pinned by
     tests/ui-control-system.test.ts - which caught this file bringing its own 2px ring). */
  border: var(--stroke-hair) solid var(--accent-soft);
  border-radius: 6px;
  background: transparent;
  cursor: inherit;
}
.hw-box:checked {
  background: var(--accent);
  border-color: var(--accent);
}
/* The tick itself, drawn rather than fetched - two rules, no asset (§9d). 1.7px because it is ICON
   ARTWORK on the design's own 24x24 / 1.5-1.9 grid, not an edge: the hairline rule is about what goes
   AROUND an object, and `.surface-ring` is the precedent the guard's own note names. */
.hw-box:checked::after {
  content: '';
  display: block;
  width: 6px;
  height: 11px;
  margin: 1px auto 0;
  border: solid var(--on-lime);
  border-width: 0 1.7px 1.7px 0;
  transform: rotate(45deg);
}
/* ⚠ AND NO FOCUS RING OF ITS OWN. The app declares exactly one, in src/style.css, and three files
   once brought their own - which is the defect that test exists for. */

.hw-limit {
  margin: 2px 0 6px;
}
.hw-readout {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.45;
}
.hw-not-now {
  margin: 4px 0 0;
}
</style>
