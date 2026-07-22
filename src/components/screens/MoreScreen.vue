<script setup lang="ts">
// Package I – More tab: Saves (moved from old App.vue), a danger-zone "New career"
// reset (inline confirm, client-side only – existing save slots are untouched),
// and an About block.
import { ref } from 'vue'
import { useGameStore } from '../../stores/game'

const game = useGameStore()
const fileInput = ref<HTMLInputElement | null>(null)
const confirmingNewCareer = ref(false)

function onImportPicked(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) game.importSave(file)
  if (fileInput.value) fileInput.value.value = ''
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

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
</script>

<template>
  <section>
    <h2>Saves</h2>
    <div class="controls">
      <button :disabled="game.busy || !game.snapshot" @click="game.saveManual()">Save (manual slot)</button>
      <button :disabled="game.busy || !game.snapshot" @click="game.exportSave()">Export to file</button>
      <button :disabled="game.busy" @click="fileInput?.click()">Import from file</button>
      <input ref="fileInput" type="file" accept=".tsave" hidden @change="onImportPicked" />
      <span class="pill" :class="{ ok: game.persisted }">
        storage: {{ game.persisted === null ? 'unknown' : game.persisted ? 'persistent' : 'best-effort' }}
      </span>
    </div>
    <p v-if="game.persisted === false" class="hint">
      Your browser may clear saves under storage pressure – export a backup file now and then.
    </p>
    <table v-if="game.slots.length" style="margin-top: 12px">
      <thead>
        <tr>
          <th>Slot</th>
          <th>Saved</th>
          <th>Week</th>
          <th>Seed</th>
          <th>Size</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in game.slots" :key="s.slot">
          <td>{{ s.slot }}</td>
          <td>{{ fmtDate(s.savedAt) }}</td>
          <td class="num">{{ s.week }}</td>
          <td>{{ s.seed }}</td>
          <td class="num">{{ (s.bytes / 1024).toFixed(1) }} KB</td>
          <td>
            <button :disabled="game.busy" @click="game.load(s.slot)">Load</button>
            <button :disabled="game.busy" @click="game.deleteSlot(s.slot)">✕</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>

  <section>
    <h2>Danger zone</h2>
    <button v-if="!confirmingNewCareer" class="danger" @click="askNewCareer">New career</button>
    <template v-else>
      <p class="hint">Current progress stays in its save slots.</p>
      <div class="controls">
        <button class="primary" @click="confirmNewCareer">Confirm</button>
        <button @click="cancelNewCareer">Cancel</button>
      </div>
    </template>
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
      </tbody>
    </table>
  </section>
</template>
