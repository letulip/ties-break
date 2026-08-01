<script setup lang="ts">
// Package K2 – More tab: Careers (switch/delete), Saves (active career: autosave +
// named saves + "Save as…"), a danger zone ("New career" reset + dev-only week
// skip), and About. Destructive/generation-switching actions go through the shared
// ConfirmDialog popup; "New career" keeps its pre-existing inline confirm (only the
// copy changed) since it doesn't touch any stored data.
import { computed, onMounted, ref, watch } from 'vue'
import { useGameStore, type SaveOpKind } from '../../stores/game'
import { sanitizeName } from '../../db/saves'
import type { CareerMeta, SlotMeta } from '../../shared/protocol'
import { weekLabel } from '../../shared/dates'
import ConfirmDialog from '../ConfirmDialog.vue'
import IconButton from '../ui/IconButton.vue'
import { isMuted, setMuted } from '../../audio/sfx'
import { isMusicMuted, setMusicMuted } from '../../audio/music'
import { isHapticsOff, setHapticsOff, supportsHaptics } from '../../audio/haptics'
import { isWeekStoryAutoOpenOff, setWeekStoryAutoOpenOff } from '../../composables/weekRecap'
import {
  DAY_CROSS_PACES,
  DAY_CROSS_PACE_LABEL,
  dayCrossPace,
  isDayCrossOff,
  prefersReducedMotion,
  setDayCrossOff,
  setDayCrossPace,
  type DayCrossPaceId,
} from '../../composables/dayCross'

const game = useGameStore()
const fileInput = ref<HTMLInputElement | null>(null)
const confirmingNewCareer = ref(false)

// P6 (c) landed a DEV-only gate on the ▶▶ 52 fast-forward here, and the owner reversed it the
// same day - «у нас не прод и нет игроков. Если нужна для разработки - можно вернуть» - because
// the deployed build IS his playtest device. The build-time flag is gone with the ruling; the
// worker's refusal of a pending tournament/knock stays, and it is the half that ever protected a
// save (tests/dev-fast-forward.test.ts pins the bargain in both directions).

// game.tick()/setPlan() don't refresh `careers` (only newCareer/loadCareer/deleteCareer/
// importSave do – see game.ts), so the active career's week/lastPlayedAt can go stale
// while the player stays on Home ticking weeks. App.vue mounts this screen fresh each
// time the tab is opened (plain v-if chain, no keep-alive), so this catches it on entry.
onMounted(() => game.refreshCareers())
const saveName = ref('')
const seedCopied = ref(false)

// One generic confirm-popup slot, reused for every destructive/switching action below.
interface PendingConfirm {
  message: string
  danger?: boolean
  confirmLabel?: string
  onConfirm: () => void | Promise<void>
}
const pendingConfirm = ref<PendingConfirm | null>(null)

function runConfirm(): void {
  const action = pendingConfirm.value
  pendingConfirm.value = null
  action?.onConfirm()
}

// --- Save-operation feedback (W1-INTEGRITY-B, TB-19) ------------------------------------------
//
// EVERY save-management result is visible here now. The store has captured these errors since the
// beginning (`run()` writes `error`), but this screen never rendered them – so a failed import, a
// full-disk save, a delete that did not happen all LOOKED like success, on the one screen whose
// whole job is the player's data. The store's `saveOp` is the typed row (which op, pending/ok/
// error, message); this block owns how it reads.
//
// `retrySaveAction` is the last save operation as a closure, recorded at its trigger – so Retry
// re-runs THE SAME operation with the same arguments (including a re-import of the same File
// object, which stays readable after the picker closes). It is deliberately per-screen-visit
// state: More mounts fresh on every visit (plain v-if chain in App.vue), and a Retry button that
// outlived the list it acted on would be a trap.
const OP_LABEL: Record<SaveOpKind, string> = {
  save: 'Save',
  load: 'Load',
  delete: 'Delete save',
  'delete-career': 'Delete career',
  export: 'Export',
  import: 'Import',
}
const retrySaveAction = ref<(() => void) | null>(null)
/** run a save operation AND remember it as the Retry target */
function tracked(fn: () => void): void {
  retrySaveAction.value = fn
  fn()
}
// Success rows auto-dismiss (a permanent "Export – done" is noise by the second look); error rows
// stay until the next operation replaces them, because an error the player never saw is the exact
// bug this block exists to fix.
const okVisible = ref(false)
let okTimer: ReturnType<typeof setTimeout> | undefined
watch(
  () => game.saveOp,
  (op) => {
    clearTimeout(okTimer)
    okVisible.value = op?.status === 'ok'
    if (op?.status === 'ok') okTimer = setTimeout(() => (okVisible.value = false), 2500)
  },
)

function flagEmoji(code: string): string {
  if (!code) return ''
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// Coarse relative time for the autosave row – doesn't need second-level precision.
function relTime(ts: number): string {
  const diffMs = Date.now() - ts
  const minutes = Math.round(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

const activeCareerId = computed(() => game.snapshot?.careerId ?? '')

// --- Careers -------------------------------------------------------------------

function askLoadCareer(c: CareerMeta): void {
  if (c.careerId === activeCareerId.value) return
  pendingConfirm.value = {
    message: `Load ${c.kidName}'s career? Your currently active career stays saved.`,
    onConfirm: () => tracked(() => game.loadCareer(c.careerId)),
  }
}
function askDeleteCareer(c: CareerMeta): void {
  pendingConfirm.value = {
    message: `Delete ${c.kidName}'s career? This removes ALL of its saves – autosave and named – for good.`,
    danger: true,
    confirmLabel: 'Delete',
    onConfirm: () => tracked(() => game.deleteCareer(c.careerId)),
  }
}

/** TB-19: a named save's delete now goes through the same ConfirmDialog every other destructive
 *  action here uses. It was the ONE immediate deletion on the screen – a bare ✕ one tap from
 *  "Load", no confirm, no undo, on data the player named on purpose. Confirmation is reserved for
 *  the irreversible (TB-19's own trade-off note) and this is exactly that: there is no trash bin
 *  behind it. Ordinary reversible settings on this screen stay immediate. */
function askDeleteSlot(name: string, slot: string): void {
  pendingConfirm.value = {
    message: `Delete the save "${name}"? There is no undo.`,
    danger: true,
    confirmLabel: 'Delete',
    onConfirm: () => tracked(() => game.deleteSlot(slot)),
  }
}

// --- Saves (active career only) -------------------------------------------------

const autoSlots = computed(() =>
  game.slots.filter((s) => s.slot.startsWith('auto:')).sort((a, b) => b.savedAt - a.savedAt),
)
const currentAutosave = computed<SlotMeta | undefined>(() => autoSlots.value[0])
const previousAutosave = computed<SlotMeta | undefined>(() => autoSlots.value[1])

const namedSlotPrefix = computed(() => `manual:${activeCareerId.value}:`)
const namedSlots = computed(() =>
  game.slots
    .filter((s) => s.slot.startsWith('manual:'))
    .map((s) => ({ ...s, name: s.slot.slice(namedSlotPrefix.value.length) })),
)

function askRestorePrevious(): void {
  const prev = previousAutosave.value
  if (!prev) return
  pendingConfirm.value = {
    message: 'Restore the previous autosave? This replaces your current progress with the earlier generation.',
    // W1-INTEGRITY-A (TB-01): `restoreSlot`, not `load` — the worker commits the restored state as
    // the NEWEST autosave before answering, so closing the app right here keeps the restore
    // (the old `load` swapped memory only, and a relaunch silently rolled back to pre-restore).
    // The action refreshes slots/careers itself; the manual refreshSlots chaser is gone with it.
    onConfirm: () => game.restoreSlot(prev.slot),
  }
}

function trySaveAs(): void {
  const sanitized = sanitizeName(saveName.value)
  if (!sanitized) return
  const collides = namedSlots.value.some((s) => s.name === sanitized)
  if (collides) {
    pendingConfirm.value = {
      message: `A save named "${sanitized}" already exists. Overwrite it?`,
      danger: true,
      confirmLabel: 'Overwrite',
      onConfirm: () => doSaveAs(sanitized),
    }
  } else {
    doSaveAs(sanitized)
  }
}
async function doSaveAs(name: string): Promise<void> {
  retrySaveAction.value = () => doSaveAs(name)
  await game.saveNamed(name)
  saveName.value = ''
}

function onImportPicked(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  // The File object outlives the picker, so Retry can re-read the same file after a transient
  // failure (worker hiccup, storage pressure) without asking the player to find it again.
  if (file) tracked(() => game.importSave(file))
  if (fileInput.value) fileInput.value.value = ''
}

async function copySeed(): Promise<void> {
  if (!game.snapshot) return
  try {
    await navigator.clipboard.writeText(game.snapshot.seed)
    seedCopied.value = true
    setTimeout(() => (seedCopied.value = false), 1500)
  } catch {
    // Clipboard permission denied or unavailable – the seed is still visible to copy by hand.
  }
}

// --- Danger zone -----------------------------------------------------------------

function askNewCareer() {
  confirmingNewCareer.value = true
}
function cancelNewCareer() {
  confirmingNewCareer.value = false
}
function confirmNewCareer() {
  // Clears the active in-memory career only; nothing is deleted from save slots.
  // App.vue reacts to snapshot becoming null (with game.ready still true) and
  // swaps back to the onboarding wizard.
  game.$patch({ snapshot: null })
  confirmingNewCareer.value = false
}

// --- Sound (round 4 item 5) -------------------------------------------------------
// isMuted()/setMuted() are plain localStorage-backed state (src/audio/sfx.ts) – no
// audio node is ever created here, so this toggle works before any match has played.
const soundMuted = ref(isMuted())
function toggleSound(): void {
  setMuted(!soundMuted.value)
  soundMuted.value = !soundMuted.value
}

// --- Music (round-6 item 1) --------------------------------------------------------
// Same isMuted()/setMuted() shape as sfx, on its own 'tb-music-muted' key – see
// src/audio/music.ts. Also plain localStorage state, so this switch works before the
// splash screen's first start() call.
const musicMuted = ref(isMusicMuted())
function toggleMusic(): void {
  setMusicMuted(!musicMuted.value)
  musicMuted.value = !musicMuted.value
}

// --- Haptics (round-7 item 13) -----------------------------------------------------
// Same plain-localStorage shape ('tb-haptics-off'). `hapticsSupported` gates a small
// "not supported on this device" hint; the switch itself is always shown so the option
// is discoverable and consistent with Sound/Music. Default ON where supported.
const hapticsSupported = supportsHaptics()
const hapticsOff = ref(isHapticsOff())
function toggleHaptics(): void {
  setHapticsOff(!hapticsOff.value)
  hapticsOff.value = !hapticsOff.value
}

// --- W5: THE WEEK'S STORY (owner: «можем сделать отдельную ручку для их отключения в настройках») ---
//
// THE FOURTH SWITCH ON THIS SCREEN, and deliberately the same object as the other three: a plain
// localStorage flag ('tb-week-story-off'), read and written by pure functions, default ON, working
// before a career is even loaded. It belongs here because the owner has called this screen "our
// settings, essentially", and it belongs in this SHAPE because three switches that behave one way and
// a fourth that behaves another way is how a settings screen starts lying about what a switch does.
//
// ⚠ IT IS NOT A "SHOW THE STORY" SWITCH, and the copy under it has to say so, because the difference is
// the whole design. OFF stops the week's story OPENING ITSELF at the end of a tick; the story is still
// there, on the This-week tab, on every week, with its accent dot still telling him when it is fresh.
// A player who turns this off has lost a page that appeared, not a page that exists – see
// composables/weekRecap.ts, which owns the rule and the argument for keeping `recapExists` out of it.
const weekStoryOff = ref(isWeekStoryAutoOpenOff())
function toggleWeekStory(): void {
  setWeekStoryAutoOpenOff(!weekStoryOff.value)
  weekStoryOff.value = !weekStoryOff.value
}

// --- THE CALENDAR'S CROSSING-OUT SWEEP (the calendar slice) -----------------------------------------
//
// THE FIFTH SWITCH ON THIS SCREEN, and the fourth one in a row that is the same object: a plain
// localStorage flag behind pure functions, default ON, working before a career loads. Sound, music,
// haptics and the week's story all behave this way, and «пятый, который ведёт себя иначе» is how a
// settings screen starts lying about what a switch does.
//
// ⚠ IT HAS A SECOND CONTROL, AND THAT IS THE POINT OF IT. The owner asked for a ~2s and a ~5s variant
// so he can pick BY EYE rather than by reading a number in a diff, so the pace is a live setting and
// not a rebuild. It uses the app's existing `option-pill` row - the same object the training-plan
// presets are - and it only appears while the sweep is ON, because a pace for an animation that does
// not run is a control that does nothing.
const dayCrossOff = ref(isDayCrossOff())
function toggleDayCross(): void {
  setDayCrossOff(!dayCrossOff.value)
  dayCrossOff.value = !dayCrossOff.value
}
const crossPace = ref(dayCrossPace())
function pickCrossPace(id: DayCrossPaceId): void {
  setDayCrossPace(id)
  crossPace.value = id
}
/** The OS switch outranks both, and the screen says so instead of offering a control that is quietly
 *  overruled – the same honesty the "Not supported on this device" hint under Haptics is for. */
const reducedMotion = prefersReducedMotion()
</script>

<template>
  <section>
    <h2>Careers</h2>
    <p v-if="!game.careers.length" class="hint">No careers yet.</p>
    <div v-for="c in game.careers" :key="c.careerId" class="career-row">
      <div class="career-info">
        <div class="career-name">
          {{ c.kidName }} {{ flagEmoji(c.country) }}
          <span v-if="c.careerId === activeCareerId" class="pill ok">Active</span>
        </div>
        <div class="hint">
          {{ weekLabel(c.week) }} · age {{ 14 + Math.floor(c.week / 52) }} · last played {{ fmtDate(c.lastPlayedAt) }}
        </div>
      </div>
      <div class="controls">
        <button :disabled="game.busy || c.careerId === activeCareerId" @click="askLoadCareer(c)">Load</button>
        <button class="danger" :disabled="game.busy" @click="askDeleteCareer(c)">Delete</button>
      </div>
    </div>
  </section>

  <section v-if="game.snapshot">
    <h2>Saves</h2>
    <div class="save-row">
      <div>
        <div>Autosave</div>
        <div class="hint">{{ currentAutosave ? relTime(currentAutosave.savedAt) : 'none yet' }}</div>
      </div>
      <button v-if="previousAutosave" class="link" @click="askRestorePrevious">Restore previous</button>
    </div>

    <table v-if="namedSlots.length" style="margin-top: 12px">
      <thead>
        <tr>
          <th>Name</th>
          <th>Saved</th>
          <th>Week</th>
          <th>Size</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in namedSlots" :key="s.slot">
          <td>{{ s.name }}</td>
          <td>{{ fmtDate(s.savedAt) }}</td>
          <td class="num">{{ weekLabel(s.week) }}</td>
          <td class="num">{{ (s.bytes / 1024).toFixed(1) }} KB</td>
          <td>
            <!-- W1-INTEGRITY-A (TB-01): loading a named save makes it the ACTIVE state, so it
                 goes through restoreSlot - committed as the newest autosave before the button
                 unbusies, and therefore still the active state after a relaunch. Wrapped in B's
                 `tracked` so the TB-19 status row can offer Retry on exactly this operation. -->
            <button :disabled="game.busy" @click="tracked(() => game.restoreSlot(s.slot))">Load</button>
            <!-- TB-19: the delete beside it is routed through the shared ConfirmDialog - it was
                 the screen's one unconfirmed irreversible action. See askDeleteSlot. -->
            <IconButton
              variant="bare"
              icon="close"
              :icon-size="14"
              :label="`Delete save ${s.name}`"
              :disabled="game.busy"
              @click="askDeleteSlot(s.name, s.slot)"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <div class="controls" style="margin-top: 12px">
      <input v-model="saveName" type="text" placeholder="save name" :disabled="game.busy" @keyup.enter="trySaveAs" />
      <button :disabled="game.busy || !saveName.trim()" @click="trySaveAs">Save as…</button>
    </div>

    <div class="controls" style="margin-top: 12px">
      <button :disabled="game.busy" @click="tracked(() => game.exportSave())">Export to file</button>
      <button :disabled="game.busy" @click="fileInput?.click()">Import from file</button>
      <input ref="fileInput" type="file" accept=".tsave" hidden @change="onImportPicked" />
      <span class="pill" :class="{ ok: game.persisted }">
        storage: {{ game.persisted === null ? 'unknown' : game.persisted ? 'persistent' : 'best-effort' }}
      </span>
    </div>

    <!-- TB-19: every save operation's outcome, rendered. Pending while it runs, a brief "done"
         on success, and a failure stays on screen WITH a Retry – previously all of these ended in
         silence on this screen, success and failure alike. -->
    <p v-if="game.saveOp?.status === 'pending'" class="hint save-op-row">
      {{ OP_LABEL[game.saveOp.op] }}…
    </p>
    <p v-else-if="game.saveOp?.status === 'ok' && okVisible" class="hint save-op-row">
      {{ OP_LABEL[game.saveOp.op] }} – done
    </p>
    <p v-else-if="game.saveOp?.status === 'error'" class="error save-op-row">
      {{ OP_LABEL[game.saveOp.op] }} failed – {{ game.saveOp.message }}
      <button
        v-if="retrySaveAction"
        class="link"
        style="margin-left: 8px"
        :disabled="game.busy"
        @click="retrySaveAction()"
      >Retry</button>
    </p>

    <p v-if="game.persisted === false" class="hint">
      Your browser may clear saves under storage pressure – export a backup file now and then.
    </p>
    <p class="hint">
      Export files hold this career's readable data – name, progress, finances – so treat a backup
      like the personal file it is.
    </p>
  </section>

  <section>
    <h2>Danger zone</h2>
    <button v-if="!confirmingNewCareer" class="danger" @click="askNewCareer">New career</button>
    <template v-else>
      <p class="hint">Your current career stays saved – you can switch back anytime in Careers.</p>
      <div class="controls">
        <button class="primary" @click="confirmNewCareer">Confirm</button>
        <button @click="cancelNewCareer">Cancel</button>
      </div>
    </template>

    <!-- ⚠ THE FAST-FORWARD SHIPS IN EVERY BUILD - an owner ruling, not a regression. The deployed
         build IS the playtest device and the only player is the person who asked for the button;
         the full ruling (quoted) lives in the script comment above `game.tick(52)`'s section. The
         half that ever protected a save stays: the worker's `tick` handler refuses to advance
         through an open knock or an unrevealed tournament. When the game one day has players who
         are not the owner, the one-line `v-if="isDev"` returns - tests/dev-fast-forward.test.ts
         documents both halves of that bargain. -->
    <hr class="card-divider" />
    <button :disabled="game.busy || !game.snapshot" @click="game.tick(52)">▶▶ 52 (dev)</button>
    <!-- The screen's one NON-save operation. Save results render in the Saves strip above; this
         line catches everything else (the fast-forward refusing over an open knock/reveal), which
         previously failed silently here – More never rendered `game.error` at all. -->
    <p v-if="game.error && game.error !== game.saveOp?.message" class="error">{{ game.error }}</p>
  </section>

  <section>
    <h2>Sound</h2>
    <div class="career-row">
      <div>Sound effects</div>
      <button
        class="sound-switch"
        :class="{ on: !soundMuted }"
        role="switch"
        :aria-checked="!soundMuted"
        @click="toggleSound"
      >
        <span class="sound-switch-track"><span class="sound-switch-knob"></span></span>
        <span class="sound-switch-label">{{ soundMuted ? 'OFF' : 'ON' }}</span>
      </button>
    </div>
    <div class="career-row">
      <div>Music</div>
      <button
        class="sound-switch"
        :class="{ on: !musicMuted }"
        role="switch"
        :aria-checked="!musicMuted"
        @click="toggleMusic"
      >
        <span class="sound-switch-track"><span class="sound-switch-knob"></span></span>
        <span class="sound-switch-label">{{ musicMuted ? 'OFF' : 'ON' }}</span>
      </button>
    </div>
    <div class="career-row">
      <div>
        Haptics
        <span v-if="!hapticsSupported" class="hint" style="margin: 2px 0 0">Not supported on this device</span>
      </div>
      <button
        class="sound-switch"
        :class="{ on: !hapticsOff }"
        role="switch"
        :aria-checked="!hapticsOff"
        @click="toggleHaptics"
      >
        <span class="sound-switch-track"><span class="sound-switch-knob"></span></span>
        <span class="sound-switch-label">{{ hapticsOff ? 'OFF' : 'ON' }}</span>
      </button>
    </div>
  </section>

  <!-- W5: the week's story. Its own section rather than a fourth row under "Sound", because it is not
       a sound - and the hint is load-bearing copy: OFF stops the page appearing, not the page. -->
  <section>
    <h2>Week story</h2>
    <div class="career-row">
      <div>
        Open at the end of a week
        <!-- ⚠ `display: block`, and it is not a nicety: `.hint` is styled for a <p> and this is a
             <span>, so at 375 the sentence ran on from the label ("...end of a week Off: the story
             stays...") and read as one line of nonsense. Caught in the browser. Haptics' own hint has
             the same shape and gets away with it only because it is four words on a device that
             mostly hides it. -->
        <span class="hint" style="display: block; margin: 2px 0 0">
          Off: the story stays on the This week tab – tap over whenever you like
        </span>
      </div>
      <button
        class="sound-switch"
        :class="{ on: !weekStoryOff }"
        role="switch"
        :aria-checked="!weekStoryOff"
        @click="toggleWeekStory"
      >
        <span class="sound-switch-track"><span class="sound-switch-knob"></span></span>
        <span class="sound-switch-label">{{ weekStoryOff ? 'OFF' : 'ON' }}</span>
      </button>
    </div>
  </section>

  <!-- The calendar's crossing-out sweep. Its own section, beside the week story rather than under
       "Sound", because the two are the same kind of thing: beats around the end of a week. -->
  <section>
    <h2>Calendar animation</h2>
    <div class="career-row">
      <div>
        Cross out the days
        <span class="hint" style="display: block; margin: 2px 0 0">
          Off: the week plays straight through, as before
        </span>
        <span v-if="reducedMotion" class="hint" style="display: block; margin: 2px 0 0">
          Your device asks for reduced motion – the sweep stays off
        </span>
      </div>
      <button
        class="sound-switch"
        :class="{ on: !dayCrossOff }"
        role="switch"
        :aria-checked="!dayCrossOff"
        @click="toggleDayCross"
      >
        <span class="sound-switch-track"><span class="sound-switch-knob"></span></span>
        <span class="sound-switch-label">{{ dayCrossOff ? 'OFF' : 'ON' }}</span>
      </button>
    </div>
    <!-- Both paces ship so the owner can pick by eye. Hidden while the sweep is off: a pace for an
         animation that does not run is a control that does nothing. -->
    <div v-if="!dayCrossOff" class="career-row">
      <div>Pace</div>
      <div class="option-row">
        <button
          v-for="p in DAY_CROSS_PACES"
          :key="p"
          class="option-pill"
          :class="{ selected: crossPace === p }"
          @click="pickCrossPace(p)"
        >
          {{ DAY_CROSS_PACE_LABEL[p] }}
        </button>
      </div>
    </div>
  </section>

  <section>
    <h2>About</h2>
    <table>
      <tbody>
        <tr>
          <th>App</th>
          <td>Ties Break <span class="pill">Ace Parent</span></td>
        </tr>
        <tr>
          <th>Save schema</th>
          <td class="num">v{{ game.snapshot?.schemaVersion }}</td>
        </tr>
        <tr v-if="game.snapshot">
          <th>Seed</th>
          <td>
            <button class="seed-value" title="Copy seed" @click="copySeed">
              {{ game.snapshot.seed }} {{ seedCopied ? '✓' : '📋' }}
            </button>
          </td>
        </tr>
        <!-- P7: the app's first external links. PRIVACY.md at the repo root is the single source
             of truth (and the policy URL portals ask for); this row only surfaces it. The Issues
             link rides along per review 08:26 - the bug form there asks for the seed and schema
             shown two rows up. `color: inherit` because nothing in the app styles a bare <a> yet:
             browser-default blue on the dark theme would be the loudest thing on the screen. -->
        <tr>
          <th>Privacy</th>
          <td>
            Everything stays on this device – no accounts, no analytics.
            <span class="hint" style="display: block; margin: 2px 0 0">
              <a
                href="https://github.com/letulip/ties-break/blob/main/PRIVACY.md"
                target="_blank"
                rel="noopener"
                style="color: inherit"
              >Privacy note</a>
              ·
              <a
                href="https://github.com/letulip/ties-break/issues"
                target="_blank"
                rel="noopener"
                style="color: inherit"
              >GitHub Issues</a>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>

  <ConfirmDialog
    v-if="pendingConfirm"
    :message="pendingConfirm.message"
    :danger="pendingConfirm.danger"
    :confirm-label="pendingConfirm.confirmLabel"
    @confirm="runConfirm"
    @cancel="pendingConfirm = null"
  />
</template>
