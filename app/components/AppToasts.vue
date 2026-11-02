<script setup lang="ts">
import { useToast } from '~/composables/useToast'

const { toasts, dismiss } = useToast()

const icons: Record<string, string> = {
  success: 'check',
  error: 'x',
  info: 'info',
}
</script>

<template>
  <div class="toast-stack" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="`toast-${toast.type}`"
        role="status"
      >
        <span class="toast-icon"><AppIcon :name="icons[toast.type] ?? 'info'" /></span>
        <p class="toast-message">{{ toast.message }}</p>
        <button
          type="button"
          class="toast-close"
          aria-label="Dismiss notification"
          @click="dismiss(toast.id)"
        >
          <AppIcon name="x" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
