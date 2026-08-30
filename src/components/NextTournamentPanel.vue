<script setup lang="ts">
// ⭐⭐ ROUND 29 #8 – THE NEXT TOURNAMENT, BEFORE IT STARTS.
//
// The owner: «При клике на Next Tournament на главном экране давай сделаем может быть какой-то
// информационный экран? Например со списком соперников, прогнозами и комментариями тренера ещё
// какой-то информацией о турнире, картинкой с ним. Это будет очень круто, сейчас там вообще пустота.
// Можно частично переиспользовать экран начала турнира с этой целью, мне кажется.»
//
// HIS IMPLEMENTATION HINT IS TAKEN. This is the tournament-start splash (`TournamentFlow.vue`,
// `phase === 'splash'`) shown one entry earlier: the same hero photograph, the same four facts in
// the same order (surface / prize money / winner's points / spectators), the same two-sided first
// round with the draw size on it, and the same read-plus-ring block underneath. What is NOT reused
// is the CSS - `TournamentFlow.vue`'s block is `<style scoped>`, so its `tf-*` classes exist only
// inside that component and cannot be borrowed without hoisting a 600-line style block into the
// global sheet. The SHAPE is the reuse; the styles below re-state it for this surface.
//
// =================================================================================================
// ⚠⚠ EVERY FIGURE HERE IS ALREADY ON THE SNAPSHOT, AND WHAT IS NOT, IS NOT INVENTED.
//
// He asked for FOUR things. Three of them exist and are drawn:
//
//   «прогнозами»          `preview.firstMatchChance` – the engine's own odds for round one, the same
//                         number the Season card's ring shows, through the same `readingColor` ramp
//                         and the same accessible sentence (`firstMatchLabel`). Not re-derived.
//   «комментариями        the court's verdict for her build (`surfaceVerdict` – the engine's
//    тренера»             `surfaceStyleHint`, consumed and never re-worded), the field's own reading
//                         (`preview.fieldStrength`), and the hired coach's note about this trip when
//                         he has one (`UpcomingEvent.coachCaution`, engine-authored).
//   «картинкой с ним»     `venueUrl` – one tournament, one photograph, wherever it appears.
//
// ...and ONE of them DOES NOT EXIST YET, so this screen says so instead of filling the space:
//
//   «списком соперников»  THE DRAW IS NOT MADE UNTIL THE WEEK RUNS. `EventPreview` carries exactly
//                         one opponent - the first-round one - because that is the only match a
//                         preview can speak for without playing the bracket (preview.ts says so in
//                         its own words). The rest of the field is drawn inside `runTournament`, on
//                         the tick. So the first round is named, in full, with her real rank and
//                         the opponent's, and the line under it states plainly that the rest of the
//                         draw is made on the week. A list of eight invented names would be worse
//                         than an honest sentence.
//
// =================================================================================================
// ⭐⭐ ROUND 30 #6 – THE SAME PANEL, RESEATED. His words, and every clause of them is a placement:
//
// «Переделать экран при нажатии на плашку Next tournament на Home – убрать рамку, сделать картинку
// турнира квадратной (по примеру главной), часть описания на картинке, часть просто ниже аккуратно,
// можно как на главной в отдельных плашках, чтобы стало красиво и наглядно. The read можно как раз
// на картинке турнира делать, раунды отдельной плашкой ниже на всю ширину с отступами по краям,
// погоду и поездку тоже на картинку, 4 иконки под картинкой просто в ряд без плашки, план
// тренировок внизу остаётся как есть»
//
// ⚠⚠ NOT ONE FIGURE, SENTENCE OR LABEL CHANGED, AND THAT IS THE POINT (CLAUDE.md invariant 4). He
// asked for a re-lay, not a rewrite: the four facts keep their four words and their order, `The
// read` keeps its label and both of its engine-authored lines, `Entry fee` / `Travel budget` /
// `Conditions` keep theirs, and the first-round block is untouched below its own heading. What moved
// is where each block SITS, which is why the round-29 mounted test above still holds every one of
// them - the classes travelled with the blocks on purpose.
//
// THE FOUR MOVES, in his order:
//   * NO FRAME. Two of them, actually. The hosting `<section>` on ThisWeekScreen becomes `.bare` -
//     the Season screen's own idiom, "the cards themselves are the only objects on the page" - and
//     the hero stops being a `<Card>`, so its hairline goes with it. What is left is a photograph
//     and, under it, exactly one plate.
//   * SQUARE, «по примеру главной». Home's hero is `aspect-ratio: 1 / 1` because the paintings are
//     square; the venue frames are not, so `cover` crops as it always has. ⚠ The square is a FLOOR,
//     not a clamp: the box is a flex column whose content can push it taller (a three-line read plus
//     a coach's caution on a narrow phone), because a clipped read would be worse than a tall card.
//   * ON THE PICTURE: the description's first half (the name, the court, the dates), `The read` with
//     its ring, and the weather and the trip. Legibility is bought with scrims, the same two Home
//     lays over its own hero, not by dimming the photograph.
//   * UNDER IT: the four icons in a row with nothing behind them (they already had nothing - what
//     changed is that the panel frame around them is gone), then the rounds as the one plate on the
//     screen, full width inside the app's own gutter.
//
// ⚠ THE TRAINING PLAN IS NOT THIS COMPONENT'S and was not touched: it is ThisWeekScreen's own
// second section, and «план тренировок внизу остаётся как есть» is honoured by leaving that section
// exactly as it was, frame included.
//
// ⚠ AND THE COACH'S VOICE STAYS SEASONSCREEN'S. `coachSays` there picks one of four wordings per
// verdict off the event's own sub-stream, and it is bounded by source-region pins in three test
// files. Duplicating that table here would give two surfaces two different sentences for one
// engine verdict - the failure this repo has already paid for four times. This panel prints the
// VERDICT plainly and lets the feed keep the voice.
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { firstMatchLabel, firstMatchTitle, useEventCard } from '../composables/eventCard'
import { readingColor } from '../composables/readingColor'
import { flagEmoji } from '../composables/countries'
import { TIERS } from '../engine/season/calendar'
import { prizeCentsFor } from '../engine/world'
import { formatShortName, rankLabel } from '../shared/format'
import { formatCents } from '../shared/money'
import { weekRange } from '../shared/dates'
import type { FieldStrength } from '../engine/season/preview'
import type { UpcomingEvent } from '../shared/protocol'
import AppIcon from './ui/AppIcon.vue'
import Card from './ui/Card.vue'
import ProgressRing from './ui/ProgressRing.vue'
import SurfaceMark from './ui/SurfaceMark.vue'
import WeatherPlate from './ui/WeatherPlate.vue'

const props = defineProps<{ event: UpcomingEvent }>()

const game = useGameStore()
const { venueUrl, surfaceVerdict } = useEventCard()

const spec = computed(() => TIERS[props.event.tier])
const dates = computed(() => weekRange(props.event.week))
/** The winner's cheque, through `prizeCentsFor` - types.ts names it the payout table's ONLY reader
 *  and this screen must not become a second one. Zero on the junior tour, where the dash is true. */
const winnerPrizeCents = computed(() => prizeCentsFor(props.event.tier, 0))
const winnerPoints = computed(() => spec.value.points[0] ?? 0)
const crowdFigure = computed(() => props.event.preview.crowd.toLocaleString('en-US'))

// ⚠ BOTH RANKS OFF THE TABLE THIS TOURNAMENT IS PLAYED ON – the splash's own rule, and it is the
// reason that rule exists: a bare "#118" beside a bare "#4" is a comparison, and a comparison across
// two tables with no exchange rate is a lie (docs/specs/two-ladders.md).
const herRank = computed(() => game.snapshot?.ladders[spec.value.track].rank ?? null)
const herRankText = computed(() => rankLabel(herRank.value ?? 0, herRank.value !== null))
const herName = computed(() => {
  const p = game.snapshot?.profile
  return p ? formatShortName(`${p.kidName} ${p.kidLastName}`) : ''
})
const herFlag = computed(() => flagEmoji(game.snapshot?.profile.country ?? ''))
const oppRankText = computed(() =>
  props.event.preview.opponentRank === null ? 'Unranked' : `#${props.event.preview.opponentRank}`,
)

/** THE FIELD'S OWN READING, one plain sentence per verdict. Descriptive on purpose - see the note at
 *  the top about why the coach's four-wordings-per-verdict voice is not copied here. */
const FIELD_READ: Record<FieldStrength, string> = {
  strong: 'Most of this field is ranked above her.',
  even: 'A field of about her own level.',
  favourite: 'She is among the strongest entered.',
}
const fieldRead = computed(() => FIELD_READ[props.event.preview.fieldStrength])
/** The court's verdict for her build, with the surface name sliced off – the panel names the court
 *  once, in the facts row, so the sentence must not name it a second time (R11-15's slice, the same
 *  one the Season card and the splash both make). */
const courtRead = computed(() => {
  const hint = surfaceVerdict(props.event.surface)
  const dash = hint?.indexOf('– ') ?? -1
  return hint && dash >= 0 ? `The court ${hint.slice(dash + 2)}.` : hint
})
</script>

<template>
  <div class="next-tourn">
    <!-- THE PHOTOGRAPH. Same picker every other surface uses, so this tournament wears the same
         court here that it wears on Home, on the Season feed and on its own start screen.
         ⭐ ROUND 30 #6 – SQUARE AND FRAMELESS, and it carries three of the blocks that used to sit
         under it. It is a plain element rather than a `<Card>` now: a card's hairline is the frame
         he asked to lose, and a photograph that IS the block does not need one. His words are in
         the script block above, where this file's rule allows them. -->
    <div class="nt-hero">
      <img class="nt-hero-art" :src="venueUrl(event)" alt="" />
      <span class="nt-hero-scrim" aria-hidden="true"></span>
      <span class="nt-hero-scrim-top" aria-hidden="true"></span>

      <!-- THE MONEY AND THE WEATHER, ON THE PICTURE. Same three readings, same three labels, same
           engine figures - the event's own quotes, restated and never re-derived. They ride the top
           of the frame because the caption owns the bottom of it. -->
      <div class="nt-money">
        <div class="nt-money-row">
          <span class="hint">Entry fee</span>
          <span class="num negative">{{ formatCents(Math.abs(event.entryFeeCents)) }}</span>
        </div>
        <div class="nt-money-row">
          <span class="hint">Travel budget</span>
          <span class="num negative">{{ formatCents(Math.abs(event.travelCostCents)) }}</span>
        </div>
        <div class="nt-money-row">
          <span class="hint">Conditions</span>
          <WeatherPlate :temperature-c="event.preview.temperatureC" :size="13" on-art />
        </div>
      </div>

      <div class="nt-hero-foot">
        <div class="nt-hero-caption">
          <h3 class="nt-hero-title">{{ event.label }}</h3>
          <p class="nt-hero-meta">{{ event.surface }} &middot; {{ dates }}</p>
        </div>

        <!-- THE READ + THE FORECAST, ON THE PICTURE. Same block, same ring, same ramp, same two
             engine-authored sentences - it simply lost the card it used to sit in. -->
        <div class="nt-read">
          <div class="nt-read-said">
            <p class="nt-read-label">The read</p>
            <p class="nt-read-line">{{ fieldRead }}</p>
            <p v-if="courtRead" class="nt-read-line">{{ courtRead }}</p>
            <p v-if="event.coachCaution" class="coach-note">{{ event.coachCaution }}</p>
          </div>
          <ProgressRing
            class="nt-ring"
            :value="event.preview.firstMatchChance"
            :color="readingColor({ fraction: event.preview.firstMatchChance })"
            :label="firstMatchLabel(event.preview)"
            :title="firstMatchTitle(event.preview)"
          >
            <b>{{ Math.round(event.preview.firstMatchChance * 100) }}</b><i>%</i>
          </ProgressRing>
        </div>
      </div>
    </div>

    <!-- THE FACTS, the splash's own four in the splash's own order. ⭐ ROUND 30 #6 – his fourth
         clause, "four icons under the picture, simply in a row, with no plate": they sit directly
         under the photograph now, and the panel frame that used to be behind them is gone. The row
         itself never had a plate. -->
    <div class="nt-facts">
      <div class="nt-fact">
        <span class="nt-fact-tile" aria-hidden="true">
          <SurfaceMark :surface="event.surface" :show-name="false" />
        </span>
        <span class="nt-fact-label">Surface</span>
        <span class="nt-fact-value surface">{{ event.surface }}</span>
      </div>
      <div class="nt-fact">
        <span class="nt-fact-tile" aria-hidden="true"><AppIcon name="dollar" :size="19" /></span>
        <span class="nt-fact-label">Prize money</span>
        <span v-if="winnerPrizeCents > 0" class="nt-fact-value" title="The winner's cheque at this tier">
          {{ formatCents(winnerPrizeCents) }}
        </span>
        <span v-else class="nt-fact-value" title="The junior tour pays no prize money at any level">–</span>
      </div>
      <div class="nt-fact">
        <span class="nt-fact-tile" aria-hidden="true"><AppIcon name="trophy" :size="19" /></span>
        <span class="nt-fact-label">Winner</span>
        <span class="nt-fact-value">{{ winnerPoints }} pts</span>
      </div>
      <div class="nt-fact">
        <span class="nt-fact-tile" aria-hidden="true"><AppIcon name="spectators" :size="19" /></span>
        <span class="nt-fact-label">Spectators</span>
        <span
          class="nt-fact-value"
          :title="`About ${crowdFigure} people around the courts – atmosphere, not a factor in play`"
          >{{ crowdFigure }}</span
        >
      </div>
    </div>

    <!-- THE FIRST ROUND. Two mirrored panels either side of a VS, exactly as the start screen draws
         them, and the draw size beside the round - "how far the top is" said once.
         ⭐ ROUND 30 #6 – his "rounds as their own plate below, full width with padding at the
         edges": this is now the ONE plate on the panel, full width inside the app's own 16px
         gutter, which is where the side padding comes from once the hosting section is bare. -->
    <Card class="nt-first">
      <div class="nt-round-row">
        <p class="nt-round">First round</p>
        <p class="nt-draw">{{ spec.drawSize }}-player draw</p>
      </div>
      <div class="nt-first-grid">
        <div class="nt-first-side">
          <div class="nt-first-flag">{{ herFlag }}</div>
          <div class="nt-first-name">{{ herName }}</div>
          <div class="nt-first-rank">{{ herRankText }}</div>
        </div>
        <div class="nt-first-vs">VS</div>
        <div class="nt-first-side mirrored">
          <!-- ⚠ NO FLAG ON THIS SIDE, AND IT IS ABSENT RATHER THAN BLANK. `EventPreview` carries the
               opponent's NAME and RANK and no nation; the flag would have to be invented, and an
               empty flag slot opposite a filled one reads as a bug. Her own stays, because it is a
               fact about her and the panel is hers. -->
          <div class="nt-first-name">{{ event.preview.opponentName }}</div>
          <div class="nt-first-rank">{{ oppRankText }}</div>
        </div>
      </div>
      <!-- ⚠ THE HONEST GAP, and it is the answer to his ask for a list of opponents. One opponent
           exists before the week; the rest of the bracket is built by `runTournament` on the tick.
           His own words are on the script side, where this file's header rule allows them. -->
      <p class="hint nt-first-note">
        Only the first round is drawn before the week starts – the rest of the bracket is made when
        she gets there.
      </p>
    </Card>

  </div>
</template>

<style scoped>
.next-tourn {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
}

/* ⭐⭐ ROUND 30 #6 – THE HERO: SQUARE, FRAMELESS, AND IT CARRIES THREE BLOCKS.
   «сделать картинку турнира квадратной (по примеру главной)» – Home's `.diary-hero` is
   `aspect-ratio: 1 / 1`, so this is the same declaration on the same kind of object.

   ⚠ THE SQUARE IS A FLOOR, NOT A CLAMP, and that is deliberate. This is a flex column with the
   caption at its foot; `aspect-ratio` yields to content when the content is taller, so a three-line
   read plus a coach's caution on a 320px phone pushes the box down instead of clipping the sentence
   off the bottom of the picture. A tall card is a design compromise; a truncated engine-authored
   read is a defect - and this panel's whole argument is that it never invents and never hides.

   No `border` and no gradient: it is not a `<Card>` any more, which is half of «убрать рамку». The
   corners stay on the app's own radius so it still reads as one of this app's objects. */
.nt-hero {
  position: relative;
  aspect-ratio: 1 / 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 14px 14px;
  border-radius: var(--radius-card);
  overflow: hidden;
  background: var(--card-bottom);
}

.nt-hero-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* TWO SCRIMS, and they do the two different jobs Home's hero splits them into: the bottom one takes
   the caption and the read out of the photograph, the top one does the same for the three readings
   in the corner. Neither dims the middle of the picture, which is where the court is. */
.nt-hero-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgb(0 0 0 / 0%) 30%, rgb(0 0 0 / 52%) 62%, rgb(0 0 0 / 82%) 100%);
}

.nt-hero-scrim-top {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgb(0 0 0 / 62%) 0%, rgb(0 0 0 / 22%) 24%, rgb(0 0 0 / 0%) 42%);
}

/* The two blocks laid ON the photograph sit above both scrims. */
.nt-money,
.nt-hero-foot {
  position: relative;
}

.nt-hero-foot {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nt-hero-title {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 1px 3px rgb(0 0 0 / 55%);
}

.nt-hero-meta {
  margin: 2px 0 0;
  font-size: 12px;
  color: rgb(255 255 255 / 82%);
  text-transform: capitalize;
  text-shadow: 0 1px 3px rgb(0 0 0 / 55%);
}

/* THE FACTS ROW – four equal cells, wrapping to two-and-two on a narrow phone rather than
   scrolling sideways. ⭐ ROUND 30 #6: «просто в ряд без плашки», and it sits directly under the
   photograph now – the small top margin is the only thing between them. */
.nt-facts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 2px;
}

@media (max-width: 359px) {
  .nt-facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.nt-fact {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  text-align: center;
}

.nt-fact-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--surface-2, rgb(255 255 255 / 5%));
  color: var(--ink-2);
}

.nt-fact-label {
  font-size: 10.5px;
  color: var(--ink-dim);
}

.nt-fact-value {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text);
}

.nt-fact-value.surface {
  text-transform: capitalize;
}

/* THE FIRST ROUND */
.nt-round-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.nt-round {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

.nt-draw {
  margin: 0;
  font-size: 11.5px;
  color: var(--ink-dim);
}

.nt-first-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.nt-first-side {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.nt-first-side.mirrored {
  text-align: right;
}

.nt-first-flag {
  font-size: 17px;
  line-height: 1.1;
}

.nt-first-name {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text);
  overflow-wrap: anywhere;
}

.nt-first-rank {
  font-size: 11.5px;
  color: var(--ink-2);
}

.nt-first-vs {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--ink-dim);
}

.nt-first-note {
  margin: 10px 0 0;
}

/* THE READ + RING – the brief card's own two-column split, now laid on the photograph.
   ⚠ EVERY COLOUR IN THIS BLOCK IS LIGHTENED BECAUSE THE GROUND CHANGED, not because the design did:
   `--ink-2` and `--ink-dim` are read against a panel, and on a sunlit court they disappear. Same
   four steps of ink, one ground brighter, with the export's own scrim shadow under each. */
.nt-read {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.nt-read-said {
  min-width: 0;
}

.nt-read-label {
  margin: 0 0 4px;
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(255 255 255 / 72%);
  text-shadow: 0 1px 3px rgb(0 0 0 / 60%);
}

.nt-read-line {
  margin: 0;
  font-size: 12.5px;
  color: rgb(255 255 255 / 92%);
  text-shadow: 0 1px 3px rgb(0 0 0 / 60%);
}

.nt-hero .coach-note {
  color: rgb(255 255 255 / 82%);
  text-shadow: 0 1px 3px rgb(0 0 0 / 60%);
}

.nt-ring {
  flex: none;
}

/* THE MONEY AND THE WEATHER, in the top corner of the photograph. A narrow right-aligned stack
   rather than three full-width rows: at the foot of a square frame the caption and the read already
   own the width, and three label/figure pairs across 343px would collide with the title. */
.nt-money {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
}

.nt-money-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  font-size: 11.5px;
  text-shadow: 0 1px 3px rgb(0 0 0 / 70%);
}

.nt-money-row .hint {
  margin: 0;
  color: rgb(255 255 255 / 74%);
}

.nt-money-row .num.negative {
  color: rgb(255 209 199 / 96%);
}
</style>
