<script setup lang="ts">
// Package K2 – tiny reusable confirm overlay. Callers own the "why" (message text)
// and the "what happens" (the @confirm handler); this component only owns the popup.
withDefaults(
  defineProps<{
    message: string
    confirmLabel?: string
    cancelLabel?: string
    /** Styles the confirm button as destructive (delete-career, delete-slot, ...). */
    danger?: boolean
  }>(),
  { confirmLabel: 'Confirm', cancelLabel: 'Cancel', danger: false },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('cancel')">
    <div class="dialog-card">
      <p class="dialog-message">{{ message }}</p>
      <div class="dialog-actions">
        <button @click="emit('cancel')">{{ cancelLabel }}</button>
        <button :class="danger ? 'danger' : 'primary'" @click="emit('confirm')">{{ confirmLabel }}</button>
      </div>
    </div>
  </div>
</template>
