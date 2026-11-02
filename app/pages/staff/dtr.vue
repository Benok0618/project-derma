<script setup lang="ts">
import { computed, ref } from 'vue'
import { useHead } from '#imports'
import { useAuth } from '~/composables/useAuth'
import { useHr, shiftMonth } from '~/composables/useHr'
import { monthLabel } from '~/utils/hr'

definePageMeta({ layout: 'staff', middleware: 'auth' })
useHead({ title: 'My DTR — Lumi Derma Staff' })

const { currentUser } = useAuth()
const { settings } = useHr()

const now = new Date()
const view = ref({ year: now.getFullYear(), month: now.getMonth() })

const title = computed(() => monthLabel(view.value.year, view.value.month))

function shift(delta: number) {
  view.value = shiftMonth(view.value.year, view.value.month, delta)
}

function print() {
  window.print()
}
</script>

<template>
  <div class="staff-page">
    <header class="page-head no-print v-reveal is-visible">
      <div>
        <h1>My DTR</h1>
        <p class="lede">Preview and print your Daily Time Record for any month.</p>
      </div>
      <div class="month-picker">
        <button type="button" class="icon-btn" aria-label="Previous month" @click="shift(-1)">
          <AppIcon name="chevron-left" />
        </button>
        <span class="month-label" aria-live="polite">{{ title }}</span>
        <button type="button" class="icon-btn" aria-label="Next month" @click="shift(1)">
          <AppIcon name="chevron-right" />
        </button>
      </div>
    </header>

    <div class="print-actions no-print">
      <p class="muted">
        A4 portrait · one page · official hours {{ settings.requiredHours }}.00/day — the browser's
        “Save as PDF” works too.
      </p>
      <div class="print-actions-row">
        <button type="button" class="btn btn-primary" @click="print">
          <AppIcon name="printer" />
          Print my DTR
        </button>
        <NuxtLink to="/staff" class="btn btn-ghost">Back to clock</NuxtLink>
      </div>
    </div>

    <div class="print-root dtr-preview">
      <DtrSheet
        v-if="currentUser"
        :employee="currentUser"
        :year="view.year"
        :month="view.month"
      />
    </div>
  </div>
</template>
