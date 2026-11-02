<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: number | string
    icon: string
    tone?: 'mint' | 'aqua' | 'peach' | 'lavender' | 'blush'
    hint?: string
    hintClass?: string
  }>(),
  { tone: 'aqua', hint: '', hintClass: '' },
)
</script>

<template>
  <div class="stat-card" :class="`tone-${tone}`">
    <span class="stat-icon"><AppIcon :name="icon" /></span>
    <div class="stat-copy">
      <p class="stat-label">{{ label }}</p>
      <p class="stat-value"><AnimatedNumber :value="value" /></p>
      <p v-if="hint" class="stat-hint" :class="hintClass">{{ hint }}</p>
    </div>
  </div>
</template>
