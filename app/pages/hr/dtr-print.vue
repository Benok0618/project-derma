<script setup lang="ts">
import { computed, ref } from 'vue'
import { useHead } from '#imports'
import { useHr, shiftMonth } from '~/composables/useHr'
import type { StaffAccount } from '~/types'
import { employeeLabel, monthLabel } from '~/utils/hr'

definePageMeta({ layout: 'hr', middleware: 'auth' })
useHead({ title: 'DTR Printing — Lumi Derma HR' })

const { activeEmployees } = useHr()

const now = new Date()
const view = ref({ year: now.getFullYear(), month: now.getMonth() })
const search = ref('')
const roleFilter = ref('All')
const selected = ref<string[]>([])
const targets = ref<StaffAccount[]>([])

const accessRole = (member: StaffAccount) => (member.role === 'HR Admin' ? 'HR Admin' : 'Employee')

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return activeEmployees.value.filter((member) => {
    const matchesSearch =
      !term ||
      [employeeLabel(member), member.email, member.jobTitle ?? ''].some((field) =>
        field.toLowerCase().includes(term),
      )
    const matchesRole = roleFilter.value === 'All' || accessRole(member) === roleFilter.value
    return matchesSearch && matchesRole
  })
})

const allChecked = computed(
  () => filtered.value.length > 0 && filtered.value.every((member) => selected.value.includes(member.id)),
)

const title = computed(() => monthLabel(view.value.year, view.value.month))

function shift(delta: number) {
  view.value = shiftMonth(view.value.year, view.value.month, delta)
}

function toggle(memberId: string) {
  selected.value = selected.value.includes(memberId)
    ? selected.value.filter((id) => id !== memberId)
    : [...selected.value, memberId]
}

function toggleAll() {
  selected.value = allChecked.value ? [] : filtered.value.map((member) => member.id)
}

function printPreview(list: StaffAccount[]) {
  if (!list.length) return
  targets.value = list
}

function printSheets() {
  window.print()
}
</script>

<template>
  <div class="hr-page">
    <template v-if="!targets.length">
      <header class="page-head v-reveal is-visible">
        <div>
          <h1>DTR Printing</h1>
          <p class="lede">A4 portrait · one page per employee · B&amp;W friendly official form.</p>
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

      <div class="toolbar v-reveal is-visible">
        <div class="search-box">
          <AppIcon name="search" />
          <input
            v-model="search"
            type="search"
            class="search-input"
            placeholder="Search employee…"
            aria-label="Search employees"
          />
        </div>
        <select v-model="roleFilter" class="filter-select" aria-label="Filter by role">
          <option value="All">All roles</option>
          <option value="HR Admin">HR Admin</option>
          <option value="Employee">Employee</option>
        </select>
        <span class="muted">{{ selected.length }} selected</span>
        <div class="toolbar-spacer" />
        <button
          type="button"
          class="btn btn-primary"
          :disabled="!selected.length"
          @click="printPreview(filtered.filter((member) => selected.includes(member.id)))"
        >
          <AppIcon name="printer" />
          Print Selected ({{ selected.length }})
        </button>
        <button
          type="button"
          class="btn btn-soft"
          :disabled="!filtered.length"
          @click="printPreview([...filtered])"
        >
          Print All ({{ filtered.length }})
        </button>
      </div>

      <section class="glass table-card v-reveal is-visible" aria-label="Select employees to print">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col" class="col-check">
                  <label class="check-line">
                    <input
                      type="checkbox"
                      :checked="allChecked"
                      :indeterminate="selected.length > 0 && !allChecked"
                      aria-label="Select all employees"
                      @change="toggleAll"
                    />
                  </label>
                </th>
                <th scope="col">Employee</th>
                <th scope="col">Job title</th>
                <th scope="col">Role</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="member in filtered"
                :key="member.id"
                class="row-clickable"
                :class="{ 'is-selected': selected.includes(member.id) }"
                tabindex="0"
                @click="toggle(member.id)"
                @keydown.enter="toggle(member.id)"
              >
                <td class="col-check" @click.stop>
                  <label class="check-line">
                    <input
                      type="checkbox"
                      :checked="selected.includes(member.id)"
                      :aria-label="`Select ${employeeLabel(member)}`"
                      @change="toggle(member.id)"
                    />
                  </label>
                </td>
                <td>
                  <span class="cell-strong">{{ employeeLabel(member) }}</span>
                  <span class="cell-sub">{{ member.email }}</span>
                </td>
                <td>{{ member.jobTitle || member.role }}</td>
                <td>{{ accessRole(member) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!filtered.length" class="empty-state">
          <span class="icon"><AppIcon name="printer" /></span>
          <p>No employees match these filters.</p>
        </div>
      </section>
    </template>

    <template v-else>
      <header class="page-head no-print v-reveal is-visible">
        <div>
          <h1>Print preview</h1>
          <p class="lede">{{ targets.length }} sheet{{ targets.length === 1 ? '' : 's' }} · {{ title }} · one employee per page.</p>
        </div>
        <div class="print-actions-row">
          <button type="button" class="btn btn-primary" @click="printSheets">
            <AppIcon name="printer" />
            Print
          </button>
          <button type="button" class="btn btn-ghost" @click="targets = []">
            <AppIcon name="chevron-left" />
            Back to selection
          </button>
        </div>
      </header>

      <div class="print-root dtr-preview">
        <DtrSheet
          v-for="member in targets"
          :key="member.id"
          :employee="member"
          :year="view.year"
          :month="view.month"
        />
      </div>
    </template>
  </div>
</template>
