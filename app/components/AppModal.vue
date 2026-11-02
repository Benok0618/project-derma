<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    subtitle?: string
    size?: 'md' | 'lg'
    variant?: 'modal' | 'drawer'
  }>(),
  { subtitle: '', size: 'md', variant: 'modal' },
)

const emit = defineEmits<{ 'update:open': [value: boolean]; close: [] }>()

const panel = ref<HTMLElement | null>(null)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

function close() {
  emit('update:open', false)
  emit('close')
}

watch(
  () => props.open,
  (open) => {
    if (!import.meta.client) return
    if (open) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', onKeydown)
      requestAnimationFrame(() => {
        panel.value?.querySelector<HTMLElement>('input, select, textarea, button')?.focus()
      })
    } else {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeydown)
    }
  },
)

onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="open" class="overlay" @click.self="close">
        <Transition :name="variant === 'drawer' ? 'drawer' : 'pop'" appear>
          <div
            v-if="open"
            ref="panel"
            class="modal"
            :class="[`modal-${size}`, variant === 'drawer' ? 'modal-drawer' : '']"
            role="dialog"
            aria-modal="true"
            :aria-label="title"
          >
            <header class="modal-head">
              <div>
                <h2 class="modal-title">{{ title }}</h2>
                <p v-if="subtitle" class="modal-sub">{{ subtitle }}</p>
              </div>
              <button type="button" class="modal-close" aria-label="Close dialog" @click="close">
                <AppIcon name="x" />
              </button>
            </header>
            <div class="modal-body">
              <slot />
            </div>
            <footer v-if="$slots.footer" class="modal-foot">
              <slot name="footer" />
            </footer>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>