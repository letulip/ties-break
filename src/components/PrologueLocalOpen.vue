<script setup lang="ts">
// ⭐⭐ THE LOCAL OPEN, PLAYED – phase 11 of docs/specs/childhood-prologue-build-2026-09.md.
//
// THE OWNER, on the age-10 card: «И как раз после этого экрана хотелось бы реально увидеть турнир,
// если игрок выбрал "участвовать", а не просто пролистать.» So the weekend is a screen the player
// sits through, not a line of text on the next card - and it is HER matches, in the order she played
// them, in the app's own match viewer.
//
// ⚠⚠ THIS COMPONENT ADDS NO MECHANISM AND NO SENTENCE. Phase 3 built the field and proved the
// shipped viewer plays a pool child (tests/component/prologue-local-open.test.ts: «The viewer needs
// nothing new»), and every word on this screen comes from `LOCAL_OPEN_COPY` in src/prologue/cards.ts
// through a binding, exactly as `PrologueCard.vue` holds none - the owner has read no prologue copy
// and §8's rule is that it ships only with his word. The one string this file resolves for itself is
// the ROUND, and it resolves it through the engine's own `stageLabel`, so a Quarterfinal is called
// what the draw sheet in the rest of the game calls it.
//
// ⚠ THE MATCH IS RE-SIMULATED, NOT RE-DECIDED. `playMatch` writes the engine seed onto every record
// she played (`MatchRecord.seed`), so `simulateMatch` under that seed reproduces the exact match the
// bracket already resolved - the same recipe SeasonScreen's hit-out and every other viewer surface
// use. The bracket is the authority; this screen only shows what it decided.
//
// ⭐⭐ THE MATCH IS THE POINT, AND THE WAY OUT IS A SAFETY CONTROL RATHER THAN THE DEFAULT.
// THE OWNER, on the ten-minute figure a brief had turned into a constraint: «Десять минут это ваша
// цифра, и турниры не должны её съесть – это была примерная цифра … и это одна из основных частей
// игры вообще-то.» So nothing here is designed around a clock: the viewer opens LIVE and plays, at
// the app's own defaults, and its own speed pills are how a player who wants it faster gets it.
//
// What the screen still owes is a way OUT, and that is round-20 #3 rather than a budget: this is a
// takeover with up to three matches on it, and a takeover a player cannot leave is the shape that
// stopped the owner's career on `TourBriefingDialog` («сейчас его даже не закрыть»). There are two,
// and only one of them is new:
//   1. THE VIEWER'S OWN. `MatchControls.vue` ships «Skip to the result» on every match in the game
//      and it is pinned by the phase-3 test; it ends this match and hands over the account of it.
//   2. THE WEEKEND'S. The header control below leaves the whole draw at once - one press instead of
//      three. ⚠ DRAFT copy like everything else here, and the one control in this slice the owner
//      could delete without changing anything else.
// `tests/component/prologue-walk.test.ts` measures what each costs and prints it.
//
// =================================================================================================
// ⭐⭐⭐ ROUND 35 #1 – THE WEEKEND IS A FLOW NOW, AND IT IS THE GAME'S OWN BEATS
// =================================================================================================
//
// THE OWNER, playing the merged prologue end to end: «у нас на прологе турнир как-то сразу в матчи
// идет, давай сделаем наш нормальный полноценный флоу пожалуйста, чтобы был первый экран с артом
// турнира, потом матчи и переходы между ними как обычно. И с результатами в конце или с кубком, как
// у нас. А потом уже продолжаем наши прологовые карточки.»
//
// HE IS RIGHT AND THE DIAGNOSIS IS EXACT: this component opened straight into `MatchViewer`. So the
// beats are here now, in the main flow's own order and with the main flow's own words:
//
//     the tournament's own screen -- (the round, then the match) x her matches -- the result
//
// ⚠⚠ AND `TournamentFlow.vue` COULD NOT BE MOUNTED TO DO IT. This is the honest report rather than a
// preference, and the blockers are facts rather than wiring:
//
//   1. IT IS DRIVEN BY THE STORE. `useGameStore()` – nine reads of `snapshot`, twelve of `busy`, and
//      four engine round-trips (`tournamentReveal`, `tournamentSkip`, `tournamentClose`,
//      `skipEvent`). THE PROLOGUE HAS NO CAREER: `newCareer` is called on the far side of the ninth
//      card, so `snapshot` is null for the whole walk and all four commands would refuse - there is
//      no `world.pendingTournament` for them to advance.
//   2. IT IS DRIVEN BY `PendingView`, WHICH THE ENGINE COMPOSES. Four of its fields cannot be filled
//      honestly here, and they are not wiring:
//        * `tier` is real (`local`) - and that is the problem, because the splash prints
//          `TIERS[tier].points[0]` as «N pts», `prizeCentsFor(tier, 0)` as the winner's cheque and
//          `eventCrowd`'s band as a gate. pool.ts's fourth guard is «NO POINTS ARE EVER COMPUTED»,
//          and the whole prologue is built on the weekends being thrown away at the handover. The
//          main splash over this fixture would put a points figure on a weekend that pays nothing.
//        * `ladder` / `kidRank` / `opponent.rank`: there is no ranking in this pool and there is not
//          going to be one. A null `ladder` is allowed - and REQUIRES a non-null `ladderNote`, which
//          is a SENTENCE the owner has never seen (invariant 4).
//        * `temperatureC`, `crowd`, `coachTravelled`: engine-drawn per event. A screen-side value is
//          a second model of a fact the engine owns.
//        * `profile.playStyle`, which `coachLine` reads: §4 says the style is EARNED and derived by
//          `createWorld`. The prologue deliberately does not have one yet.
//   3. ITS FINALE IS THE WRONG GIRL. `useKidEmotion()` reads the same store and hangs
//      `finaleUrl(stage, emotion)` - the fourteen-year-old finale paintings. She is ten here, and
//      this set has its own art, picked by the owner (`src/art/prologue.ts`).
//      ⚠⚠ ROUND 42 #36 CORRECTS THE SECOND HALF OF THIS LINE AND LEAVES THE FIRST STANDING. What is
//      unavailable here is `useKidEmotion()` - it reads the STORE, and there is no career. The ART
//      is not the blocker and never was: `finaleUrl` IS `portraitUrl` (art/preload.ts says so in as
//      many words), so it is BAND-SCOPED, and `portraitStage` answers `jun` below 11 and `young` at
//      11-16 - i.e. it is total over every age a prologue weekend can be played at, with the files
//      swept against disk by tests/portrait-bands.test.ts. Hand the band in and the career's own
//      pre-match card draws the right girl, which is what the pre-match beat below now does. The
//      RESULT scene keeps the owner's own three faces and this blocker: that one is a fourth
//      painting he picked himself, not a band of the portrait set.
//   4. ITS «Continue» ARMS `armTrophyFlight` ONTO THE TAB BAR, which `App.vue` renders and which does
//      not exist during the prologue; and there is no cabinet entry for it to fly to, because a
//      prologue weekend puts nothing in `trophiesByTier`.
//
// ⭐ THE SMALLEST SEAM THAT WOULD LET ONE FLOW SERVE BOTH, recorded so the next wave does not have to
// re-derive it. (1) is one line: `const game = useGameStore()` becomes `inject(HOST, null) ??
// useGameStore()` against a narrow structural interface the store already satisfies, and all 26 call
// sites are untouched. (2) is the real work and it has a precedent: the Local Open is the THIRD
// rungless fixture, and the two before it (round 26 #6's College League, round 27 #6's Nations Cup
// tie) were absorbed into this one flow by WIDENING `PendingView` – `tier: null`, `drawSize: null`,
// `ladder: null` + `ladderNote`. A weekend that awards nothing at all needs the same treatment for
// the points, the cheque and the crowd. That is a wave, not a bundle item, and it is the thing that
// would retire this file rather than another screen dressed to look like it.
//
// ⚠ WHAT THIS FILE THEREFORE IS: the same beats over the facts the prologue HAS, drawn with the same
// helpers the main flow draws them with – `venueArtUrl` (its photograph, not a second one),
// `stageLabel` (its namer), `MatchViewer` (its viewer) and `LOCAL_OPEN_COPY`'s two borrowed labels.
// The RESULT beat is deliberately not here: it is `localOpenCard`, on the owner's own three faces,
// and it is where «а потом уже продолжаем наши прологовые карточки» starts.
//
// =================================================================================================
// ⭐⭐⭐ ROUND 42 #36 – THE PRE-MATCH BEAT IS THE CAREER'S OWN COMPONENT, NOT A SECOND DRAWING OF IT
// =================================================================================================
//
// THE OWNER saw the symptom first – «в прологе во время турнира… экран "кто против кого" – в обычном
// флоу там большая фото серьёзной девочки, а в прологе пустота» – and then corrected his own framing
// in the same hour, and the correction IS the item: «я просто просил сделать флоу турнира таким же
// до цента, т.е. переиспользовать текущий по максимуму, если он отличается где-то, значит наш DRY
// дырявый в этом месте. Мне не нужно, чтобы вы что-то новое изобретали, у нас уже есть этот экран.
// Нужно переиспользовать и сделать консистентно.» (His words are quoted here and in
// tests/component/prologue-round42.test.ts rather than in the template – `tests/round13-nav.test.ts`
// bans Cyrillic inside one, comments included.)
//
// SO THE EMPTY SCREEN WAS NOT THE BUG; THE SECOND IMPLEMENTATION BEHIND IT WAS. This beat used to be
// a hand-written vs line and a button. It is `<MatchScene :stage emotion="serious" :label fill>` now
// – the same call `TournamentFlow` and `PracticeFlow` make, on the component whose own header says it
// exists to be «the one place the treatment is written down». A portrait hung on this screen by any
// other means would have been a THIRD drawing of the same card, agreeing today and drifting again
// next round, which is the thing he asked us not to do.
//
// ⚠ WHAT THE PROLOGUE CANNOT SUPPLY IS ABSENT BY DATA THROUGH THAT SAME COMPONENT, never by a second
// one that does not draw it. The plate carries the two names and nothing else: there is no ranking in
// this pool and there is not going to be one (pool.ts), so the career's rank line is simply not
// written – the same shape `.scene-rank` takes on a friendly's sparring partner.
//
// ⚠ AND THE ROUND MOVED FROM THE HEADER ONTO THE PAINTING ON THIS BEAT ONLY – the SAME string, from
// the same `stageLabel`, in the place the career puts it. `TournamentFlow`'s pre-match screen names
// the TOURNAMENT in the header and the ROUND on the pill; leaving `.plo-stage` up would have printed
// the round twice inside 60px of each other. No word changed; one already-drawn word changed seat on
// one beat. The splash and the match keep the header exactly as they had it.
import { computed, ref } from 'vue'
import MatchScene from './MatchScene.vue'
import MatchViewer from './MatchViewer.vue'
import PrimaryPill from './ui/PrimaryPill.vue'
import SurfaceMark from './ui/SurfaceMark.vue'
import { simulateMatch } from '../engine/match/engine'
import { annotateMatch } from '../engine/match/rally'
import { JUNIOR_TOUR } from '../engine/season/tournament'
import { stageLabel } from '../engine/world/labels'
import { venueArtUrl } from '../art/venues'
import { portraitStage, type PortraitStage } from '../shared/avatarEmotion'
import { LOCAL_OPEN_COPY, localDrawLine } from '../prologue/cards'
import { herMatches, LOCAL_POOL, type LocalOpen } from '../prologue/pool'
import type { MatchOptions, MatchPlayer } from '../engine/match/types'

const props = defineProps<{
  /** the weekend, as `playLocalOpen` resolved it – the bracket is already decided */
  open: LocalOpen
  /** her, with `KID_ID`, which is what makes the viewer point at the right girl (`matchReadout`) */
  kid: MatchPlayer
  /** ⭐ ROUND 35 #1 – THE PROLOGUE'S OWN SEED, and it is here for ONE reason: `venueArtUrl` draws
   *  the venue off a purpose-scoped sub-stream keyed by it, so a childhood meets the same club every
   *  year and two childhoods do not. It is the seed `ChildhoodPrologue` already holds; nothing on
   *  this screen rolls anything of its own. */
  seed: string
}>()

const emit = defineEmits<{
  /** the weekend is over, either because she ran out of matches or because the player left */
  (e: 'done'): void
}>()

/** The copy table, bound rather than quoted. */
const copy = LOCAL_OPEN_COPY

/** Her matches, in the order she played them – one to three of them in a draw of eight. */
const played = computed(() => herMatches(props.open, props.kid.id))

/** Which of them is on screen. */
const at = ref(0)

const record = computed(() => played.value[at.value] ?? null)

/** ⚠ SIDES ARE THE RECORD'S, NOT THIS SCREEN'S. `aId`/`bId` are how the bracket drew them and the
 *  viewer colours the accent off whichever side carries `KID_ID`; swapping them here would put her
 *  name on the wrong seat in a match she is in. */
const sides = computed<{ a: MatchPlayer; b: MatchPlayer } | null>(() => {
  const rec = record.value
  if (!rec) return null
  const oppId = rec.aId === props.kid.id ? rec.bId : rec.aId
  const opponent = props.open.field.find((p) => p.id === oppId)
  if (!opponent) return null
  return rec.aId === props.kid.id ? { a: props.kid, b: opponent } : { a: opponent, b: props.kid }
})

const options = computed<MatchOptions>(() => ({
  surface: props.open.event.surface,
  tour: JUNIOR_TOUR,
  seed: record.value?.seed ?? '',
}))

const annotated = computed(() => {
  const two = sides.value
  if (!two) return null
  const opts = options.value
  return annotateMatch(simulateMatch(two.a, two.b, opts), two.a, two.b, opts)
})

/** The round, in the draw sheet's own words – the engine's namer, so there is no second idea here of
 *  what a Semifinal is called. */
const stage = computed(() => stageLabel(record.value?.round ?? 0, LOCAL_POOL.size))

/** ⚠ THE FINAL'S OWN CUE, on the one match that is one. `MatchViewer.finalMatch` swaps the applause
 *  clip; a weekend whose last match is a first-round exit is not a final and does not get it. */
const isFinal = computed(() => (record.value?.round ?? 0) === props.open.rounds - 1)

// =================================================================================================
// ⭐⭐⭐ ROUND 35 #1 – THE BEATS
// =================================================================================================

/** WHICH BEAT IS ON SCREEN. `splash` is the tournament's own screen and is shown ONCE, at the top of
 *  the weekend; `round` is the transition and is shown before EVERY match, including the first –
 *  which is the main flow's own shape (its splash hands over to a pre-match card, not to a court).
 *  `match` is the viewer. */
const beat = ref<'splash' | 'round' | 'match'>('splash')

/** ⭐ THE WEEKEND'S PHOTOGRAPH, AND IT IS THE GAME'S OWN. `venueArtUrl` is what Home's
 *  next-tournament card and `TournamentFlow`'s splash both hang, off the event's own id and the
 *  career's seed – so a Local Open in the prologue is drawn on a local club exactly as a Local Open
 *  in the career is, and there is no second picture table for a prologue weekend.
 *
 *  ⚠ THE EVENT IS NOT ON THE CALENDAR AND THAT IS HANDLED RATHER THAN IGNORED: `venueOrdinal`
 *  answers 0 for an id it cannot find there and says so in its own note, so the rotation falls back
 *  to the seed's offset. Deterministic, and stable for the whole childhood. */
const venueUrl = computed(() =>
  venueArtUrl(props.open.event.tier, props.open.event.surface, props.open.event.id, props.seed),
)

/** How big the draw actually was, read off the bracket rather than off `LOCAL_POOL.size`. */
const drawLine = computed(() => localDrawLine(2 ** props.open.rounds))

/** ⭐⭐⭐ ROUND 42 #36 – HER BAND, WHICH IS THE ONE THING `MatchScene` NEEDS AND THE PROLOGUE HAS.
 *
 *  The career reads this off `useKidEmotion()`, which reads the store; there is no career here, so
 *  the prologue answers the same question from the girl it was handed. `portraitStage` is the app's
 *  ONE resolver for it (`jun` below 11, `young` at 11-16 – the boundary was set at 11 in July
 *  precisely because «the childhood prologue is coming»), so this is not a second idea of what a band
 *  is, it is the same function with a different source for the age.
 *
 *  ⚠ THE FALLBACK IS NAMED AND CANNOT BE TAKEN. `MatchPlayer.age` is optional only because frozen
 *  pre-branch snapshots were saved without it (match/types.ts says so); a prologue entrant is built
 *  by `prologueEntrant` here and now, from the age, and always carries it. `LOCAL_POOL.fromAge` is
 *  the floor of the one band this weekend exists in – ten, the owner's «real tournaments FROM 10» –
 *  so even the unreachable arm lands on `jun`, which is a painting that exists. Measured, not
 *  assumed: tests/component/prologue-round42.test.ts hangs the URL off the real entrant at every age
 *  the pool can play, and tests/portrait-bands.test.ts sweeps every band x emotion against disk. */
const herStage = computed<PortraitStage>(() => portraitStage(props.kid.age ?? LOCAL_POOL.fromAge))

/** The girl on the other side of the net, this round. */
const opponent = computed(() => {
  const two = sides.value
  if (!two) return null
  return two.a.id === props.kid.id ? two.b : two.a
})

/** The tournament's own screen is over – on to the first round's transition. */
function begin(): void {
  beat.value = 'round'
}

/** The transition is over – the match. */
function watch(): void {
  beat.value = 'match'
}

/** One match is over. The next one's transition, or the weekend is. */
function next(): void {
  if (at.value < played.value.length - 1) {
    at.value += 1
    beat.value = 'round'
    return
  }
  emit('done')
}
</script>

<template>
  <div class="plo">
    <!-- ⚠⚠ THE HEADER IS FIRST AND IS NOT INSIDE THE VIEWER, which is the round-20 #3 rule applied
         to a screen rather than to a dialog. The way out has to be reachable on a 375x667 phone
         without scrolling past a 420px-tall court, so it sits above it and stays there. -->
    <header class="plo-head">
      <!-- ⭐⭐⭐ ROUND 42 #36 – THE ROUND YIELDS THE HEADER TO THE PAINTING'S PILL ON THE PRE-MATCH
           BEAT, AND ONLY THERE. The career's pre-match screen names the tournament in its header and
           the round on `MatchScene`'s own pill; this header names the tournament in the kicker, so
           keeping the round here as well would have printed one word twice within 60px on a phone.
           It is the SAME string from the SAME `stageLabel` - it changes seat, not wording (house
           invariant 4). The splash and the match beat are untouched: on the match the career puts the
           round in its header too (`headlineBadge`), which is what this line is doing there. -->
      <div class="plo-titles">
        <p class="plo-kicker">{{ copy.kicker }}</p>
        <p v-if="beat !== 'round'" class="plo-stage">{{ stage }}</p>
      </div>
      <button class="link plo-skip" type="button" @click="emit('done')">{{ copy.skipRest }}</button>
    </header>

    <!-- ⭐⭐⭐ ROUND 35 #1, BEAT ONE - THE TOURNAMENT'S OWN SCREEN, and the owner's own layout rule
         from item 2 applied to it: the square painting across the full width, and everything else
         beneath it. That is also item 5's answer - the screen he called excellent is the age-10
         card, and what makes it work is a photograph you meet before you meet a decision, one line
         of plain fact under it, and the choice last. This is that shape.

         ⚠ NOTHING IS WRITTEN OVER THE PAINTING, which is the difference from the main flow's own
         splash and is deliberate: `tests/component/contrast.ts` composites colours through the real
         cascade and cannot see a photograph, so a title moved onto the art leaves the AA gate
         measuring a background that is not behind it. PrologueCard.vue carries the full argument. -->
    <section v-if="beat === 'splash'" class="plo-splash">
      <div class="plo-hero">
        <img class="plo-hero-img" :src="venueUrl" alt="" />
        <div class="plo-hero-fade"></div>
      </div>
      <!-- The two facts the prologue's weekend actually has, in the flow's own words: the surface
           and the size of the draw. No points, no cheque and no crowd - see the blockers in the
           script header for why those are absent rather than dashed.
           ⭐ ROUND 42 #36 – AND THE SURFACE IS THE APP'S ONE MARK NOW, not a bare word. The owner's
           own ruling on this object (30.07, quoted in ui/SurfaceMark.vue): «Surface type similar icon
           across every screen - it means this icon is not a component». The career's brief draws its
           surface through this component twice - the header's sub line at `size="sm"` and the facts
           tile - and this line was the last place in the weekend flow still printing the name with no
           ring beside it. THE WORD IS UNCHANGED: `SurfaceMark` prints `{{ surface }}` itself, and
           `.plo-facts`'s `capitalize` still reaches it. -->
      <p class="plo-facts"><SurfaceMark :surface="open.event.surface" size="sm" /> &middot; {{ drawLine }}</p>
      <div class="plo-vs">
        <span class="plo-vs-side">{{ kid.name }}</span>
        <span class="plo-vs-mid">vs</span>
        <span class="plo-vs-side plo-vs-opp">{{ opponent?.name }}</span>
      </div>
      <PrimaryPill variant="cta" class="plo-go" @click="begin()">{{ copy.begin }}</PrimaryPill>
    </section>

    <!-- ⭐⭐ BEAT TWO - THE TRANSITION, BEFORE EVERY MATCH. The owner asked for the matches to have
         the usual transitions between them; his words are in this file's script header and in
         tests/component/round35-prologue.test.ts, because Cyrillic may not appear in a template even
         in a comment (house law, and tests/round13-nav.test.ts is what enforces it). The round she
         is about to play, who is on the other side of the net, and one control - the main flow's
         pre-match card is the same three things.

         ⭐⭐⭐ ROUND 42 #36 - AND IT IS THAT CARD NOW, NOT A SECOND DRAWING OF IT. `MatchScene` is F
         "Match Day", the portrait treatment, and its own header says it exists to be «the one place
         the treatment is written down»; this screen was the one caller in the app that walked a
         player up to a match without calling it. Same props as the career's pre-match beat, in the
         same order: her band, `serious` (the owner's own word for a girl who is «not delighted and
         not finished», which is exactly a match she has not played yet), the round on the pill, and
         `fill` so the painting takes the column instead of sitting in its own square.

         ⚠ THE PLATE CARRIES TWO NAMES AND NOTHING ELSE, and that is ABSENT BY DATA rather than a
         second component: `.scene-rank` is simply not written on either side, because there is no
         ranking in this pool and there is not going to be one (pool.ts's own header, and the same
         reason `.plo-vs` on the splash prints none). The career writes a rank there; a friendly
         writes «sparring partner»; this weekend has nothing true to put on that line.

         ⚠ ONE CONTROL AND NOT THE CAREER'S TWO. Its row is `.tf-actions` - the shared one - and the
         affirmative is this prologue's own `PrimaryPill variant="cta"`, which is the way on from the
         first card of the childhood to the last. The career's second button, "Skip", resolves the
         match engine-side and shows its box score; here the match must be SIMULATED to exist at all,
         and the per-match escape the viewer already ships («Skip to the result») is what answers it.
         A second control would need a word the owner has never written. -->
    <MatchScene
      v-else-if="beat === 'round'"
      class="plo-round"
      :stage="herStage"
      emotion="serious"
      :label="stage"
      fill
    >
      <div class="scene-grid">
        <div class="scene-side">
          <div class="scene-name">{{ kid.name }}</div>
        </div>
        <div class="scene-vs">vs</div>
        <div class="scene-side mirrored">
          <div class="scene-name">{{ opponent?.name }}</div>
        </div>
      </div>
      <div class="tf-actions">
        <PrimaryPill variant="cta" class="plo-go" @click="watch()">{{ copy.watchMatch }}</PrimaryPill>
      </div>
    </MatchScene>

    <!-- The shipped viewer, with one new thing asked of it since round 39 #15a: the parent's own
         line for the moment she cannot continue (`hurt-note`), because a prologue weekend stores no
         injury and nothing after this screen would otherwise say she is alright. The sentence is
         the copy table's, like every other word here. `mode="live"` is the truth: the match is
         simulated at the moment this screen opens and is written to no save. -->
    <MatchViewer
      v-else-if="annotated && sides"
      :key="at"
      :match="annotated"
      :player-a="sides.a"
      :player-b="sides.b"
      :surface="open.event.surface"
      :final-match="isFinal"
      mode="live"
      :proceed-label="copy.proceed"
      :hurt-note="copy.hurtNote"
      @finish="next()"
    />
  </div>
</template>

<style scoped>
/* A TAKEOVER, LIKE EVERY OTHER MATCH SCREEN IN THE APP. The owner took the outer frame off all three
   of them on 30.07 («давай внешний контур уберем, он не нужен» – quoted in style.css), so there is
   no card around a court here either.

   ⚠ EVERY COLOUR IS A DECLARED TOKEN WITH NO FALLBACK – round-17 #3's rule, and PrologueCard.vue's
   style block carries the account of what a fallback shipped. */
.plo {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  overflow-y: auto;
  background: var(--bg);
}

/* ⭐⭐⭐ ROUND 36 PHASE 4 – THE WEEKEND GETS THE PROLOGUE'S COLUMN, AND IT IS THE ONE PROLOGUE
   SURFACE THAT HAD NONE. The nine cards and the handover are both `max-width: 420px`; this takeover
   is `inset: 0` with 12px of padding and nothing else, so it simply became the window. `.plo-hero`
   is `width: calc(100% + 24px); aspect-ratio: 1 / 1`, and MEASURED in Chromium on the build before
   this rule: 341 x 341 on a 375px phone, **734 x 734 at 768** and **1246 x 1246 at 1280** – a
   painting taller than the screen it is on, with the two facts, the VS line and «Begin» pushed off
   the bottom of a surface whose whole design is one picture and one decision. The court on the third
   beat had the same problem from the other side: the takeover measured 1,256px at 1280 and `.mv`
   inherits its width, so the court was taking an 1.85x enlargement of a 680px bitmap.

   ⚠ 420 IS NOT A NEW NUMBER, IT IS `.prologue-card`'s AND `.handover-card`'s. The prologue is one
   surface to the player – nine cards, however many weekends, and a handover – and it now holds one
   column from the first card to the last match instead of two of them and a window.

   ⚠ THE MATCH IS THE EXCEPTION, deliberately, and the selector is one class heavier so it wins in
   both engines. `MatchViewer` is the app's match screen wherever it is mounted, and shrinking it to
   420 on a tablet would make the prologue's court NARROWER than the 744px it has there today –
   fixing a desktop defect by walking backwards on a tablet. It takes the takeover column the
   tournament flow takes, and the court's own cap (`CSS_W`, in MatchViewer.vue) is what decides how
   big the tennis actually gets. Measured after, at 1280x900:

     .plo-head    420px          .plo-splash  420px    .plo-hero  410 x 410
     .mv          880px          .mv-court    680 x 420, centred

   ⚠ THE PAINTING LANDS AT 410 AND NOT AT THE CARDS' 420, and the ten pixels are worth naming rather
   than chasing: `.plo-splash` is a bare `<section>`, so it carries the app's own 16px section inset,
   and the full-bleed trick above cancels `.plo`'s 12px rather than its parent's 16. That is a
   pre-existing mismatch – on a 375px phone the same arithmetic makes the painting 341px wide where
   its own comment says it «spans the phone» – and it is left alone here because correcting it would
   move a box below 768, which this round may not do. It is recorded in `docs/rounds/round-36.md`
   beside the other two findings phase 4 could not fix for the same reason. */
@media (min-width: 768px) {
  .plo > * {
    width: 100%;
    max-width: 420px;
    margin-inline: auto;
  }

  .plo > .mv {
    max-width: var(--takeover-col-max);
  }
}

/* ⚠⚠ THE RIGHT-HAND PADDING IS THE MUTE ICON'S SEAT AND IS NOT DECORATION. `MuteButton` is
   `position: fixed` at `top: --app-pad-top; right: --app-pad-x`, 40x40, z-index 61 – i.e. above this
   takeover (60) and in the same place on every prologue surface, which is the whole point of it
   being declared once in `ChildhoodPrologue.vue`. On a card that lands over the painting and costs
   nothing; here the header IS the top of the screen, so without this the escape below would sit
   under the icon on a 375px phone. 40 + a 12px gap. */
.plo-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-right: 52px;
  flex: 0 0 auto;
}

.plo-titles {
  min-width: 0;
}

.plo-kicker {
  margin: 0;
  font-size: var(--label-size);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

.plo-stage {
  margin: 2px 0 0;
  font-family: var(--font-heading);
  font-size: 18px;
  color: var(--ink);
}

/* The way out of the weekend. A LINK rather than a plate, for the same reason the viewer's own
   «Skip to the result» is one: it is not an answer, it is the door. */
.plo-skip {
  flex: 0 0 auto;
  color: var(--ink-soft);
}

/* ══ ROUND 35 #1 – THE TOURNAMENT'S OWN SCREEN AND THE TRANSITION BEFORE EACH MATCH ══
   ⚠ EVERY COLOUR IS A DECLARED TOKEN WITH NO FALLBACK, exactly as the block above says: round-17 #3
   shipped `var(--ink, #1c1c1e)` and put near-white text on white at a measured 1.09:1. */
.plo-splash {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 12px;
}

/* ⭐⭐⭐ ROUND 42 #36 – THE PRE-MATCH BEAT IS `MatchScene` ITSELF, so `.plo-round` is on the card
   rather than on a wrapper around one, and what this rule owns is only WHERE THE CARD SITS – the
   same division `.tf-scene` keeps in TournamentFlow and `.pf-scene` in PracticeFlow.

   ⚠⚠ AND IT DECLARES NO HEIGHT ARITHMETIC, WHICH A MUTATION RUN IS WHAT TAUGHT. The first draft of
   this rule carried `flex: 1 1 0; min-height: 0` – and removing those two lines reddened NOTHING,
   because `.scene--fill` in MatchScene already declares exactly them on this same element. They were
   a second copy of the component's own geometry, written in the file whose whole item is that there
   should not be one. The `fill` PROP is what asks for it, the component is what owns it, and the
   mounted arm is re-aimed at the prop: `.plo` is `position: fixed; inset: 0; display: flex; column`,
   so the painting absorbs exactly the height the header leaves and the screen FITS BY CONSTRUCTION
   rather than by counting sentences – the round-20 #3 property this takeover has always rested on.

   FULL-BLEED ON `.plo`'s OWN 12px, which is `.plo-hero`'s idiom two rules down and not a new one –
   the prologue has no backing plates and no frames (round 35 #2, the owner: «мне кажется в прологе
   можно без подложек с рамкой делать флоу»), so `Card`'s hairline and corners come off exactly as
   `.tf-scene` takes them off in the career. Doubled class beats `Card`'s own scoped `.tb-card` at
   (0,3,0) vs (0,2,0) – the same tie `.tf-scene.tf-scene` documents.

   ⚠ AND THE DOUBLED CLASS IS WHY THE 768 COLUMN HAS TO BE RESTATED. `.plo > *` caps every beat at
   the cards' 420px column and centres it with `margin-inline: auto` at (0,1,0); the doubled class
   here is (0,2,0) and its `margin: 0 -12px` therefore BEATS that centring on a tablet whatever the
   source order. The cap still lands - nothing here touches `max-width` - so the query below only has
   to give the centring back, and the painting stays on the prologue's own column past 768 exactly as
   `.plo-splash` does (round 36 phase 4, measured there). */
.plo-round.plo-round {
  width: calc(100% + 24px);
  margin: 0 -12px;
  border: none;
  border-radius: 0;
}

/* ⚠ `margin: 0 auto` AND NOT `margin-inline: auto`, which is the form `.plo > *` uses one rule up.
   Two reasons and both are about not being clever: the physical shorthand plainly overrides the
   `margin: 0 -12px` above it at the same specificity, with no logical-vs-physical cascade question
   to reason about – and happy-dom does not expand `margin-inline` into its longhands, so a mounted
   test measuring «is it centred» would have had to ask the shorthand instead of the property (round
   36 phase 4's `isCentred` carries that finding). Same declaration `.tf-top` and `.tf-body` use. */
@media (min-width: 768px) {
  .plo-round.plo-round {
    width: 100%;
    margin: 0 auto;
  }
}

/* ⭐⭐⭐ SQUARE, AND FULL WIDTH – the owner's rule for the whole prologue («я просил арты делать в
   квадратном формате по аналогии с home экраном», and item 2's «просто квадратный арт во всю
   ширину»). One declaration and no per-screen override, the same `aspect-ratio: 1 / 1` that
   `.diary-hero` on Home, `.nt-hero` on the tournament card and `.prologue-hero` on the nine cards
   all declare, in the same words and for the same reason.
   `calc(100% + 24px)` is `.plo`'s own 12px padding cancelled on both sides, so the painting spans
   the phone while the text under it keeps its gutters. */
.plo-hero {
  position: relative;
  width: calc(100% + 24px);
  aspect-ratio: 1 / 1;
  margin: 0 -12px;
  overflow: hidden;
}

.plo-hero-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Home's `.diary-hero-fade`, ending in this takeover's own colour so the photograph has no bottom
   edge and the line under it reads as the page. */
.plo-hero-fade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(9, 14, 19, 0) 52%, rgba(11, 17, 23, 0.55) 82%, var(--bg) 100%);
}

.plo-facts {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-soft);
  text-transform: capitalize;
}

/* The two of them either side of the net. ⚠ NO RANK ON EITHER SIDE, and that is a fact rather than a
   trim: there is no ranking in this pool and there is not going to be one (pool.ts's header). The
   main flow prints two, because two ranks are the comparison a junior draw is read by. */
.plo-vs {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.plo-vs-side {
  flex: 1 1 0;
  min-width: 0;
  font-family: var(--font-heading);
  font-size: 17px;
  line-height: 1.25;
  color: var(--ink);
}

.plo-vs-opp {
  text-align: right;
}

.plo-vs-mid {
  flex: 0 0 auto;
  font-size: var(--label-size);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

/* ⚠ THE CONTROL IS LAST IN THE COLUMN, which is the same rule the nine cards are measured under:
   the fit assertion reads the way on off the bottom of what is above it. */
.plo-go {
  align-self: stretch;
}
</style>
