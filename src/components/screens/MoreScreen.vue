<script setup lang="ts">
// Package K2 – More tab: Careers (switch/delete), Saves (active career: autosave +
// named saves + "Save as…"), a danger zone ("New career" reset + dev-only week
// skip), and About. Destructive/generation-switching actions go through the shared
// ConfirmDialog popup; "New career" keeps its pre-existing inline confirm (only the
// copy changed) since it doesn't touch any stored data.
import { computed, onMounted, ref } from 'vue'
import { useGameStore } from '../../stores/game'
import { sanitizeName } from '../../db/saves'
import type { CareerMeta, SlotMeta } from '../../shared/protocol'
import ConfirmDialog from '../ConfirmDialog.vue'
import { isMuted, setMuted } from '../../audio/sfx'

const game = useGameStore()
const fileInput = ref<HTMLInputElement | null>(null)
const confirmingNewCareer = ref(false)

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
    onConfirm: () => game.loadCareer(c.careerId),
  }
}
function askDeleteCareer(c: CareerMeta): void {
  pendingConfirm.value = {
    message: `Delete ${c.kidName}'s career? This removes ALL of its saves – autosave and named – for good.`,
    danger: true,
    confirmLabel: 'Delete',
    onConfirm: () => game.deleteCareer(c.careerId),
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
    onConfirm: async () => {
      await game.load(prev.slot)
      await game.refreshSlots()
    },
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
  await game.saveNamed(name)
  saveName.value = ''
}

function onImportPicked(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) game.importSave(file)
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
// isMuted()/setMuted() are plain localStorage-backed state (src/audio/sfx.ts) — no
// audio node is ever created here, so this toggle works before any match has played.
const soundMuted = ref(isMuted())
function toggleSound(): void {
  setMuted(!soundMuted.value)
  soundMuted.value = !soundMuted.value
}
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
        <div class="hint">W{{ c.week }} · age {{ 14 + Math.floor(c.week / 52) }} · last played {{ fmtDate(c.lastPlayedAt) }}</div>
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
          <td class="num">{{ s.week }}</td>
          <td class="num">{{ (s.bytes / 1024).toFixed(1) }} KB</td>
          <td>
            <button :disabled="game.busy" @click="game.load(s.slot)">Load</button>
            <button :disabled="game.busy" @click="game.deleteSlot(s.slot)">✕</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="controls" style="margin-top: 12px">
      <input v-model="saveName" type="text" placeholder="save name" :disabled="game.busy" @keyup.enter="trySaveAs" />
      <button :disabled="game.busy || !saveName.trim()" @click="trySaveAs">Save as…</button>
    </div>

    <div class="controls" style="margin-top: 12px">
      <button :disabled="game.busy" @click="game.exportSave()">Export to file</button>
      <button :disabled="game.busy" @click="fileInput?.click()">Import from file</button>
      <input ref="fileInput" type="file" accept=".tsave" hidden @change="onImportPicked" />
      <span class="pill" :class="{ ok: game.persisted }">
        storage: {{ game.persisted === null ? 'unknown' : game.persisted ? 'persistent' : 'best-effort' }}
      </span>
    </div>
    <p v-if="game.persisted === false" class="hint">
      Your browser may clear saves under storage pressure – export a backup file now and then.
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

    <hr class="card-divider" />
    <button :disabled="game.busy || !game.snapshot" @click="game.tick(52)">▶▶ 52 (dev)</button>
  </section>

  <section>
    <h2>Sound</h2>
    <div class="career-row">
      <div>Sound effects</div>
      <button @click="toggleSound">{{ soundMuted ? 'Off' : 'On' }}</button>
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
