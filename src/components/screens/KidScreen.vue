<script setup lang="ts">
// SCREEN C - KID PROFILE. Her page: who she is, how she is, what she has been through, and - new
// in this wave - what anyone can actually tell about her game.
//
// THE GEOMETRY IS THE OWNER'S EXPORT, docs/design/README.md §"C. Kid Profile", measured off
// docs/design/prototype/screens.dc.html: hero 392 -> a 3x2 attribute grid (min-height 88, radius
// 14, 8px gutters) -> the moments timeline -> the tab bar. This screen adds two blocks the export
// does not have, both for the owner's Q5 reason ("fidelity to the composition, real content may
// scroll"): the SKILLS RADAR, which is the whole point of the wave for this screen, and the
// counting-results table, which is real content that predates the design and explains her rank.
//
// ⚠ THREE OF THE EXPORT'S SIX TILES HAVE NO ENGINE BEHIND THEM, and inventing one would have been
// the worst thing this screen could do. The mockup's grid reads Personality / Confidence / Mood /
// School / Friends / Coach. We have no personality model, no school and no friendships - they are
// fiction in a picture, not a spec for a simulation that does not run them. What we DO have is six
// real facts, and they are laid into the same six cells:
//
//   export            ours                  where it comes from
//   Personality  ->   Rank                  kidRank + the best-6 total (the headline of her career)
//   Confidence   ->   Condition             snapshot.condition, the same ring Home draws
//   Mood         ->   Mood                  diary.facts.emotion, as a word and as her own face
//   School       ->   Born                  profile.birthMonth + country (round-3 QA item 16)
//   Friends      ->   Family                profile.background, and the academy when one backs her
//   Coach        ->   Coach                 coachMarket's current row - and the door to screen T
//
// Every fact the old table showed survives: her play style moved onto the paper scrap on the hero
// (the export puts "Right-Handed" there, and a play style is the same KIND of fact - an inherent,
// unchanging way she plays), and her country is both the flag beside her name and a named line in
// the Born tile, because a flag emoji on its own is a riddle.
//
// WHAT THIS SCREEN IS NOT ALLOWED TO DO: derive a fact of its own. The emotion is the engine's
// (via the shared composable), the rank is the engine's, the coach row is the engine's. The one
// exception is the radar's data, and it is a STUB that is labelled as one in six places - see
// `stubRadarAxes` below.
import { computed } from 'vue'
import { useGameStore } from '../../stores/game'
import CountingResultsTable from '../CountingResultsTable.vue'
import SkillsRadar, { type RadarAxis, type RadarAxisKey } from '../SkillsRadar.vue'
import { useKidEmotion } from '../../composables/kidEmotion'
import { weekLabel } from '../../shared/dates'
import { rankLabel } from '../../shared/format'
import type { FamilyBackground, PlayStyle } from '../../shared/protocol'
import type { AvatarEmotion } from '../../shared/avatarEmotion'
import { COACH_TIER_LABEL } from '../../engine/coach'
// U0 - the shared components (docs/specs/ui-components.md). StatRow is the ninth, and it is not
// used here: it belongs to the Money screen, which is where it earned its shape.
import ScreenShell from '../ui/ScreenShell.vue'
import Card from '../ui/Card.vue'
import Eyebrow from '../ui/Eyebrow.vue'
import PaperNote from '../ui/PaperNote.vue'
import ProgressRing from '../ui/ProgressRing.vue'

const game = useGameStore()
// THE DOOR TO THE COACH MARKET (screen T). It lives on the Coach TILE rather than on Home for two
// reasons: the tile already names who coaches her, so "tap it to change that" needs no new concept;
// and Home's coach card is designed as the coach's MESSAGE FEED, whose guard test deliberately pins
// that region money-free - a price-bearing market door would fight both the design and the test.
// The shell owns `tab`; this screen only asks (the same rule HomeScreen follows). 'home' and 'more'
// join the list with the export's own header controls: the back arrow and the settings gear.
const emit = defineEmits<{ navigate: ['market' | 'home' | 'more'] }>()
// Raster art ships as webp only (<=512 px, quality 82-75), converted by the build itself
// (vite.config.ts -> scripts/optimize-art.mjs). The masters live outside the repo, in the
// gitignored art-src/, and are never served. R9-15/16: the BIG portrait reflects her CURRENT
// state and age stage via the shared composable - art exists for every stage x emotion. `cropUrl`
// is the 256px face crop of the SAME decision, which is what the Mood tile shows.
const { emotion, portraitUrl, cropUrl } = useKidEmotion()

const BACKGROUND_LABEL: Record<FamilyBackground, string> = {
  wealthy: 'Wealthy',
  middle: 'Middle class',
  working: 'Working class',
}
const PLAY_STYLE_LABEL: Record<PlayStyle, string> = {
  aggressive: 'Aggressive baseliner',
  counterpuncher: 'Counterpuncher',
  'serve-first': 'Big serve',
  'all-court': 'All-court',
}
// How her face reads as a WORD. The export's Mood tile is a word plus a picture, and both halves
// here answer to the same engine decision (diary.facts.emotion) - so the word can never contradict
// the portrait above it, which is the whole reason R9-13/15 put the decision engine-side.
const MOOD_LABEL: Record<AvatarEmotion, string> = {
  norm: 'Steady',
  happy: 'Happy',
  sad: 'Low',
  serious: 'Focused',
  tired: 'Tired',
  injury: 'Hurt',
  angry: 'Angry',
}
// Round-6: birth month row (relative-age-effect groundwork, round-3 QA item 16).
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', FR: 'France', ES: 'Spain', IT: 'Italy', DE: 'Germany',
  RU: 'Russia', RS: 'Serbia', CH: 'Switzerland', CZ: 'Czechia', PL: 'Poland', UA: 'Ukraine',
  KZ: 'Kazakhstan', BY: 'Belarus', AU: 'Australia', JP: 'Japan', CN: 'China', KR: 'South Korea',
  IN: 'India', BR: 'Brazil', AR: 'Argentina', CA: 'Canada', NL: 'Netherlands', SE: 'Sweden',
}

function flagEmoji(code: string): string {
  if (!code) return ''
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

const kidName = computed(() => game.snapshot?.profile.kidName ?? '')
const kidFullName = computed(() => {
  const p = game.snapshot?.profile
  return p ? `${p.kidName} ${p.kidLastName}`.trim() : ''
})
const ageYears = computed(() => game.snapshot?.ageYears ?? 0)
const countryFlag = computed(() => flagEmoji(game.snapshot?.profile.country ?? ''))
const countryName = computed(() => {
  const code = game.snapshot?.profile.country ?? ''
  return code ? COUNTRY_NAMES[code] ?? code : ''
})
const birthMonthLabel = computed(() => (game.snapshot ? MONTHS[game.snapshot.profile.birthMonth - 1] ?? '' : ''))
const backgroundLabel = computed(() => (game.snapshot ? BACKGROUND_LABEL[game.snapshot.profile.background] : ''))
const playStyleLabel = computed(() => (game.snapshot ? PLAY_STYLE_LABEL[game.snapshot.profile.playStyle] : ''))
const moodLabel = computed(() => MOOD_LABEL[emotion.value] ?? 'Steady')

// --- THE RANK TILE -------------------------------------------------------------------------
// `rankLabel` is the shared rule: a kid with no counting result reads "Unranked" rather than the
// misleading "#1" that a field of ties at zero points would otherwise hand her.
const countingResults = computed(() => game.snapshot?.countingResults ?? [])
const rankText = computed(() => rankLabel(game.snapshot?.kidRank ?? 0, countingResults.value.length > 0))
const pointsTotal = computed(() => countingResults.value.reduce((sum, c) => sum + c.points, 0))
const pointsText = computed(() =>
  countingResults.value.length ? `${pointsTotal.value.toLocaleString('en-US')} pts` : 'No points yet',
)

// --- THE CONDITION TILE --------------------------------------------------------------------
// The export's Confidence ring, wearing the app's own continuous hue: `hsl(pct*120, 72%, 48%)`, so
// a percentage means the same colour here as it does on Home. The ramp is DATA and therefore a
// prop - see src/components/ui/ProgressRing.vue.
const condition = computed(() => Math.round(game.snapshot?.condition ?? 0))
const conditionColor = computed(() => {
  const pct = Math.max(0, Math.min(100, condition.value))
  return `hsl(${Math.round((pct / 100) * 120)}, 72%, 48%)`
})

// --- THE FAMILY TILE -----------------------------------------------------------------------
// The academy line only exists when somebody is actually backing her (schema v21); a family with
// no scholarship gets one line, not an empty second one saying "none".
const academyLine = computed(() => {
  const a = game.snapshot?.academy
  return a ? `Academy covers ${Math.round(a.coverShare * 100)}% of travel` : ''
})

// --- THE COACH TILE ------------------------------------------------------------------------
// Who she trains with TODAY, which is `world.coachId` and not the rung chosen at onboarding - the
// two part company the first time the market is used.
const coachRow = computed(() => game.snapshot?.coachMarket.find((c) => c.current) ?? null)
const coachName = computed(() => coachRow.value?.name ?? 'You')
const coachTierLabel = computed(() =>
  coachRow.value ? `${COACH_TIER_LABEL[coachRow.value.tier]} tier` : COACH_TIER_LABEL['self'],
)

// --- IMPORTANT MOMENTS ---------------------------------------------------------------------
// The export's timeline: a lime rule with dated nodes on it. Ours reads the milestone EVENTS the
// engine already fires (`type: 'milestone'`, `keep: true`) and always ends on Today.
//
// SEASON WRAP-UPS ARE EXCLUDED on purpose. `season-<n>` fires every single year, so within three
// careers it would be the only thing on the timeline; the year-by-year figures are the Stats
// screen's season table, and this strip is for the FIRSTS.
//
// ⚠ THE DURABLE MILESTONE LEDGER IS NOT ON THE SNAPSHOT. `world.milestones` (a typed
// `Milestone[]`, schema v18) never prunes, but the Snapshot carries only the trailing 60 events
// plus the single milestone behind the Memory card - so a first title from four seasons ago can
// age out of this strip while still being remembered by the engine. Surfacing the ledger is a
// small engine ask and it is written up in the wave report rather than reached for here.
type MomentIcon = 'start' | 'title' | 'mark' | 'today'
interface Moment {
  key: string
  label: string
  when: string
  icon: MomentIcon
  now?: boolean
}
/** Short labels for the milestone keys the engine actually fires. A sentence with an emoji in it
 *  (which is what the event's own `text` is) cannot live in a 10px nowrap node. */
function momentLabel(key: string): string | null {
  if (key === 'first-title') return 'First title'
  if (key === 'first-national') return 'First National win'
  if (key.startsWith('academy-in-')) return 'Academy backing'
  if (key.startsWith('season-')) return null // see the note above
  return 'Milestone'
}
const moments = computed<Moment[]>(() => {
  const snap = game.snapshot
  if (!snap) return []
  const fired: Moment[] = []
  for (const e of snap.events) {
    if (e.type !== 'milestone' || !e.milestoneKey) continue
    const label = momentLabel(e.milestoneKey)
    if (!label) continue
    fired.push({
      key: e.milestoneKey,
      label,
      when: weekLabel(e.week),
      icon: e.milestoneKey === 'first-title' ? 'title' : 'mark',
    })
  }
  // Four columns, as the export draws: her first week, the two most recent firsts, and today.
  const recent = fired.slice(-2)
  return [
    { key: 'career-start', label: 'Career start', when: weekLabel(0), icon: 'start' as const },
    ...recent,
    { key: 'today', label: 'Today', when: weekLabel(snap.week), icon: 'today' as const, now: true },
  ]
})

// --- THE SKILLS RADAR: A STUB OF THE FINAL SHAPE ---------------------------------------------
//
// ############################################################################################
// ##  STUB. THIS IS NOT THE MODEL. It fabricates `RadarAxis[]` so screen C can be built and   ##
// ##  reviewed while the ENGINE half is written in parallel on branch `feat/skills-radar`.    ##
// ##  The contract it returns is docs/specs/skills-radar.md §2, unchanged, so when the engine ##
// ##  puts `radar: RadarAxis[]` on the Snapshot this whole block is deleted and the template  ##
// ##  reads `game.snapshot.radar` instead. Nothing else on this screen moves.                 ##
// ##                                                                                          ##
// ##  IT TOUCHES NO ENGINE RNG. The wobble below is a local string hash, not `rngFromSeed`,   ##
// ##  precisely so it cannot be mistaken for the purpose-scoped sub-stream the spec specifies ##
// ##  (`seed:read:<axis>`) and cannot perturb the frozen MAIN capture.                        ##
// ############################################################################################
//
// It is driven off facts the snapshot really carries, so the two states the DESIGN has to survive
// are both reachable by playing the game rather than by editing a constant:
//
//   WEEK 1, AGE 14, NO COACH, NO MATCHES   confidence ~0  -> maximum fog, a huge haze, no notes.
//   AGE 17, ELITE COACH, LONG HISTORY      confidence ~1  -> a tight contour, a narrow haze that
//                                                            still never closes, most notes present.
//
// ⚠ TWO INPUTS THE SPEC WANTS THAT THE SNAPSHOT DOES NOT CARRY, and the stub approximates them:
//   * WEEKS WITH THIS COACH. There is no `coachSince` on the Snapshot, so career weeks stand in.
//     The engine owns this one and will compute it properly; nothing here needs to change.
//   * WAS IT LONG / WAS IT TIGHT, per match. `WorldMatch` has the scoreline and both skill
//     snapshots, but the Snapshot carries no match history to fold - so the stub derives a
//     plausible share of long and tight matches from the match COUNT. That is exactly the read the
//     engine will do properly over the ledger (spec §1, evidence source 3).
const TIER_CONFIDENCE: Record<string, number> = { self: 0, budget: 0.35, middle: 0.55, high: 0.75, elite: 1 }
const RADAR_KEYS: readonly RadarAxisKey[] = ['serve', 'ret', 'composure', 'stamina']
/** A stable 0..1 per (career, axis). Not an RNG - a hash, so her coach's misreading of her backhand
 *  is the same misreading on every render, which is also how misreading a person actually works. */
function hash01(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 10000) / 10000
}
const lerp = (a: number, b: number, t: number): number => a + (b - a) * Math.max(0, Math.min(1, t))
/** The coach's sentence per axis, once he has enough to say it. The engine will own this copy; the
 *  stub keeps one line per axis so the layout is exercised with real words rather than lorem. */
const STUB_NOTES: Record<RadarAxisKey, [string, string]> = {
  serve: ['Her serve is her weapon.', 'The serve is a work in progress.'],
  ret: ['She reads a serve early.', 'Returning is where the work is.'],
  composure: ['She does not flinch on a big point.', 'Tight sets still get to her.'],
  stamina: ['A third set does not frighten her.', 'She fades late in long matches.'],
}
function stubRadarAxes(): RadarAxis[] {
  const snap = game.snapshot
  if (!snap) return []
  const seed = snap.seed
  const weeksTogether = snap.week
  const tier = snap.coachMarket.find((c) => c.current)?.tier ?? 'self'
  const played =
    snap.seasonWins +
    snap.seasonLosses +
    snap.seasonHistory.reduce((sum, s) => sum + s.wins + s.losses, 0)

  return RADAR_KEYS.map((key) => {
    // Evidence, per axis: serve and return sharpen with matches generally; composure needs TIGHT
    // matches and stamina needs LONG ones, so both lag behind - the asymmetry the spec is about.
    const evidence =
      key === 'composure'
        ? Math.min(1, Math.floor(played * 0.35) / 8)
        : key === 'stamina'
          ? Math.min(1, Math.floor(played * 0.25) / 6)
          : Math.min(1, played / 30)
    const confidence = Math.max(
      0,
      Math.min(1, 0.25 * (TIER_CONFIDENCE[tier] ?? 0) + 0.25 * Math.min(1, weeksTogether / 40) + 0.5 * evidence),
    )

    // Where she is, as far as anyone can tell: a stable per-career shape that grows with her age.
    const shownValue = Math.max(
      5,
      Math.min(92, 34 + hash01(`${seed}:${key}`) * 22 + Math.max(0, snap.ageYears - 14) * 5),
    )
    // The fog around it, and the haze BEYOND it. The haze's half-width has a FLOOR (spec §3): you
    // learn the range, never the number, however long you wait. The band is placed clear of the
    // fog's outer edge rather than on top of it, because a ceiling is by definition above where she
    // is - and because two shapes that always sit inside one another read as one glow.
    const band = lerp(26, 4, confidence)
    const ceilingHalf = lerp(24, 8, confidence)
    const ceilingMid = Math.min(100, shownValue + band + ceilingHalf * 0.55 + lerp(10, 5, confidence))

    const noteAt = key === 'composure' || key === 'stamina' ? 0.55 : 0.45
    const strong = hash01(`${seed}:${key}:read`) > 0.45
    return {
      key,
      shownValue,
      band,
      ceilingLo: Math.max(0, ceilingMid - ceilingHalf),
      ceilingHi: Math.min(100, ceilingMid + ceilingHalf),
      note: confidence >= noteAt ? STUB_NOTES[key][strong ? 0 : 1] : null,
    }
  })
}
const radarAxes = computed<RadarAxis[]>(() => stubRadarAxes())
</script>

<template>
  <template v-if="game.snapshot">
    <ScreenShell>
      <!-- ============================ 1. THE HERO ============================
           392px of her, the export's two-ended scrim over it, and the chrome laid ON the painting
           rather than above it. Full-bleed: the margins cancel `--app-pad-x` / `--app-pad-top` by
           the exact token they cancel, which is the rule Home's hero established. -->
      <div class="kid-hero">
        <img
          class="kid-hero-img"
          :src="portraitUrl"
          :alt="kidName"
          width="512"
          height="512"
          decoding="async"
        />
        <div class="kid-hero-scrim"></div>

        <header class="kid-head">
          <button class="back-link kid-back" aria-label="Back to Home" @click="emit('navigate', 'home')">
            &larr;
          </button>
          <div class="kid-id">
            <p class="kid-name-row">
              <span class="kid-name">{{ kidFullName }}</span>
              <span class="kid-flag" aria-hidden="true">{{ countryFlag }}</span>
            </p>
            <p class="kid-age">{{ ageYears }} years old</p>
          </div>
          <button class="kid-tool" aria-label="Settings" title="Settings" @click="emit('navigate', 'more')">
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3.2"></circle>
              <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"></path>
            </svg>
          </button>
        </header>

        <!-- The export's paper scrap. It carries "Right-Handed"; ours carries the one inherent
             fact our engine actually models about how she plays. PaperNote's FIRST real caller. -->
        <PaperNote class="kid-style-note" tilt="-4deg">{{ playStyleLabel }}</PaperNote>
      </div>

      <!-- ======================== 2. THE ATTRIBUTE GRID ======================== -->
      <div class="kid-grid">
        <Card class="kid-tile" pad="11px 9px">
          <p class="kid-tile-label">Rank</p>
          <p class="kid-tile-lead">{{ rankText }}</p>
          <p class="kid-tile-sub">{{ pointsText }}</p>
        </Card>

        <Card class="kid-tile kid-tile-ring" pad="11px 9px">
          <p class="kid-tile-label">Condition</p>
          <ProgressRing
            class="kid-ring"
            :value="condition / 100"
            :size="56"
            :color="conditionColor"
            :label="`Condition: ${condition} percent`"
          >
            <b>{{ condition }}</b><i>%</i>
          </ProgressRing>
        </Card>

        <Card class="kid-tile kid-tile-mood" pad="11px 9px">
          <p class="kid-tile-label">Mood</p>
          <p class="kid-tile-lead">{{ moodLabel }}</p>
          <img class="kid-mood-face" :src="cropUrl" alt="" width="36" height="36" decoding="async" />
        </Card>

        <Card class="kid-tile" pad="11px 9px">
          <p class="kid-tile-label">Born</p>
          <p class="kid-tile-line">{{ birthMonthLabel }}</p>
          <p class="kid-tile-line kid-tile-line-soft">{{ countryName }}</p>
        </Card>

        <Card class="kid-tile" pad="11px 9px">
          <p class="kid-tile-label">Family</p>
          <p class="kid-tile-line">{{ backgroundLabel }}</p>
          <p v-if="academyLine" class="kid-tile-line kid-tile-line-soft">{{ academyLine }}</p>
        </Card>

        <!-- THE DOOR to screen T. `as="button"` because the ELEMENT is what says "this is a door" -
             it carries the lift, the keyboard reach and the focus ring. -->
        <Card
          as="button"
          class="kid-tile kid-tile-door"
          pad="11px 9px"
          aria-label="Coach - open the Coach Market"
          @click="emit('navigate', 'market')"
        >
          <p class="kid-tile-label">Coach</p>
          <p class="kid-tile-line">{{ coachName }}</p>
          <p class="kid-tile-line kid-tile-line-soft">{{ coachTierLabel }}</p>
        </Card>
      </div>

      <!-- ========================== 3. THE SKILLS RADAR ==========================
           decisions.md #11, finally built. No numbers anywhere on it, ever. -->
      <Card class="kid-panel">
        <Eyebrow as="h2">Skills</Eyebrow>
        <p class="kid-panel-note">
          What her coach can tell so far. The solid shape is where she is; the haze around it is how
          far she might go. Both sharpen as he learns her.
        </p>
        <SkillsRadar
          :axes="radarAxes"
          title="Her skills: serve, return, composure and stamina. The solid contour is where she
                 is today, the haze around it is how far she could go."
        />
      </Card>

      <!-- ========================= 4. IMPORTANT MOMENTS ==========================
           The export's node strip. Its "See all" is deliberately NOT here: the gallery it would
           open is the Moments feature (round-3 QA item 8, Phase 6) and does not exist, and a
           control that goes nowhere is worse than no control. -->
      <Card class="kid-panel">
        <h3 class="kid-panel-title">Important moments</h3>
        <div class="kid-timeline">
          <!-- The rule runs from the FIRST node's centre to the LAST one's, which in a
               `repeat(n, 1fr)` grid is 100/(2n)% in from each edge. The export hard-codes 12% for
               its four nodes; ours has between two and four, and a hard-coded inset would leave the
               line hanging past the end icons on a young career. -->
          <span
            class="kid-timeline-rule"
            :style="{ left: `${50 / moments.length}%`, right: `${50 / moments.length}%` }"
            aria-hidden="true"
          ></span>
          <ol class="kid-timeline-nodes" :style="{ gridTemplateColumns: `repeat(${moments.length}, 1fr)` }">
            <li v-for="m in moments" :key="m.key" class="kid-moment">
              <span class="kid-moment-icon">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 26 26"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <template v-if="m.icon === 'title'">
                    <path d="M9 5h8v4.2a4 4 0 0 1-8 0z"></path>
                    <path d="M13 13.4V16"></path>
                    <path d="M9.6 20.2h6.8"></path>
                    <path d="M9 6.2H6.8v1.1A2.7 2.7 0 0 0 9 10M17 6.2h2.2v1.1A2.7 2.7 0 0 1 17 10"></path>
                  </template>
                  <template v-else-if="m.icon === 'today'">
                    <path d="M13 5.2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"></path>
                  </template>
                  <template v-else-if="m.icon === 'start'">
                    <circle cx="13" cy="13" r="9.5"></circle>
                    <path d="M8.8 13.2l3 3 5.4-5.6"></path>
                  </template>
                  <template v-else>
                    <circle cx="13" cy="13" r="9.5"></circle>
                    <circle cx="13" cy="13" r="3.4" fill="currentColor"></circle>
                  </template>
                </svg>
              </span>
              <span class="kid-moment-label" :class="{ now: m.now }">{{ m.label }}</span>
              <span class="kid-moment-when">{{ m.when }}</span>
            </li>
          </ol>
        </div>
      </Card>

      <!-- ========================== 5. COUNTING RESULTS ==========================
           Round-5 item 1b: the kid's best-6 over the 52-week window. Its point total equals the
           standings points, so the ranking stops looking like a bug. It is not in the export - it
           predates it - and it stays because it is the proof behind the Rank tile above. Markup
           lives in the shared CountingResultsTable.vue (also used by Home's best-6 popover). -->
      <Card class="kid-panel">
        <Eyebrow as="h2">Counting results (best 6)</Eyebrow>
        <p class="kid-panel-note">
          Her rank counts her six best results from the last 52 weeks. This total is her ranking
          points.
        </p>
        <CountingResultsTable :results="countingResults" />
      </Card>
    </ScreenShell>
  </template>
</template>

<style scoped>
/* =================================================================================================
   SCREEN C's OWN STYLES.
   They live in this SFC and not in `src/style.css` for the reason U0 wrote into HomeScreen: six
   screens are being built on top of that slice in parallel, and the sheet is the one file all six
   would touch. What all screens share lives in the sheet or in `src/components/ui/`; what ONE
   screen composes lives here.
   WHAT THIS BLOCK DOES NOT CONTAIN, because a component owns it: the card surface (Card), the lime
   kicker (Eyebrow), the ring (ProgressRing), the paper scrap (PaperNote), the vertical stack
   (ScreenShell), and `.back-link`, which is the app's ONE back control and stays in the sheet.
   ================================================================================================= */

/* --- 1. THE HERO ------------------------------------------------------------------------------ */

.kid-hero {
  position: relative;
  /* Full-bleed: cancel the shell's gutter EXACTLY, on all three sides it touches. */
  margin: calc(-1 * var(--app-pad-top)) calc(-1 * var(--app-pad-x)) 0;
  height: 392px;
  max-height: 62vh;
  overflow: hidden;
}

.kid-hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 22%;
  display: block;
}

/* The export's five-stop scrim: dark at the top so the chrome reads, clear through her face, and
   closing on the page colour so the photograph has no bottom edge at all. */
.kid-hero-scrim {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgba(6, 10, 14, 0.82) 0%,
    rgba(6, 10, 14, 0.2) 18%,
    rgba(6, 10, 14, 0) 34%,
    rgba(11, 17, 23, 0.55) 84%,
    var(--panel) 100%
  );
}

.kid-head {
  position: absolute;
  left: 18px;
  right: 18px;
  top: 22px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

/* `.back-link` is the app's one back control (src/style.css) and it is MUTED by default, which is
   right on a panel and invisible on a photograph. On art it takes the on-art ink, like every other
   word laid on a painting in this app. */
.kid-back {
  margin-top: 2px;
  color: #ffffff;
  font-size: 22px;
  text-shadow: var(--shadow-text-on-art);
}

.kid-back:hover:not(:disabled),
.kid-back:focus-visible {
  color: var(--accent);
}

.kid-id {
  flex: 1;
  min-width: 0;
  text-align: center;
}

.kid-name-row {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
}

.kid-name {
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #ffffff;
  text-shadow: var(--shadow-text-on-art);
}

.kid-flag {
  font-size: 17px;
  line-height: 1;
  filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.4));
}

.kid-age {
  margin: 5px 0 0;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.82);
  text-shadow: var(--shadow-text-on-art);
}

.kid-tool {
  flex: none;
  width: 21px;
  height: 21px;
  margin-top: 4px;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  display: block;
}

.kid-tool:hover:not(:disabled) {
  background: transparent;
  color: var(--accent);
}

.kid-tool svg {
  display: block;
}

/* The scrap sits where the export puts it, and it is a scrap: 88px wide, one short line, tilted. */
.kid-style-note {
  position: absolute;
  right: 16px;
  bottom: 56px;
  width: 104px;
  padding: 13px 12px 15px;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

/* --- 2. THE ATTRIBUTE GRID -------------------------------------------------------------------- */

.kid-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.kid-tile {
  position: relative;
  min-height: 88px;
  border-radius: var(--radius-frame);
  text-align: left;
  overflow: hidden;
}

.kid-tile-label {
  margin: 0;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--ink-soft);
}

.kid-tile-lead {
  margin: 12px 0 0;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.kid-tile-sub {
  margin: 3px 0 0;
  font-size: 11px;
  font-weight: 500;
  color: var(--ink-dim);
  font-variant-numeric: tabular-nums;
}

/* The export's two 11.5px lines, 4px apart, on the tiles that name two facts. `nowrap` is the
   export's own rule and it is load-bearing: a wrapped second line pushes the tile out of the row. */
.kid-tile-line {
  margin: 9px 0 0;
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kid-tile-line + .kid-tile-line {
  margin-top: 4px;
}

.kid-tile-line-soft {
  font-weight: 500;
  color: var(--ink-soft);
}

/* A tile that is a door. The lift is small on purpose - this is a cell in a grid, not a card. */
.kid-tile-door {
  cursor: pointer;
  transition:
    transform var(--dur-slow) cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color var(--dur-slow) linear;
}

.kid-tile-door:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: var(--accent-soft);
}

.kid-tile-ring .kid-ring {
  position: absolute;
  right: 9px;
  bottom: 8px;
}

.kid-tile-mood .kid-mood-face {
  position: absolute;
  right: 9px;
  bottom: 10px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--card-edge);
}

.kid-tile-mood .kid-tile-lead {
  max-width: 62%;
}

/* --- 3-5. THE PANELS -------------------------------------------------------------------------- */

.kid-panel {
  margin-top: 10px;
}

.kid-panel-title {
  margin: 0 0 12px;
  font-family: var(--font-heading);
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink);
}

.kid-panel-note {
  margin: 8px 0 12px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--ink-soft);
  text-wrap: pretty;
}

/* --- 4. THE MOMENTS TIMELINE ------------------------------------------------------------------ */

.kid-timeline {
  position: relative;
  margin-top: 4px;
}

/* The rule runs BEHIND the nodes and stops at the outer two, so the first and last icons cut it
   rather than sit on a line that runs off the card. `left`/`right` come from the template - they
   depend on how many nodes there are. */
.kid-timeline-rule {
  position: absolute;
  top: 13px;
  height: 2px;
  background: var(--accent);
}

.kid-timeline-nodes {
  position: relative;
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}

.kid-moment {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  text-align: center;
  min-width: 0;
}

/* The icon's own background is the CARD's, which is what punches the rule behind it. */
.kid-moment-icon {
  display: flex;
  border-radius: 50%;
  background: var(--card-bottom);
  color: var(--accent);
}

.kid-moment-icon svg {
  display: block;
}

.kid-moment-label {
  font-size: 10px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.015em;
  color: var(--ink-2);
  text-wrap: balance;
}

.kid-moment-label.now {
  font-weight: 700;
  color: var(--ink);
}

.kid-moment-when {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--ink-dim);
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .kid-tile-door,
  .kid-tile-door:hover:not(:disabled) {
    transition: none;
    transform: none;
  }
}
</style>
