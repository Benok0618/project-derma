<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useHead } from '#imports'
import { useHr } from '~/composables/useHr'
import { useStore } from '~/composables/useStore'
import { useToast } from '~/composables/useToast'
import { formatDateLabel, isoDate } from '~/utils/datetime'
import type { HolidayType } from '~/types'

definePageMeta({ layout: 'hr', middleware: 'auth' })
useHead({ title: 'Holidays — Lumi Derma HR' })

const store = useStore()
const { success, error: errorToast } = useToast()
const { holidays } = useHr()

const HOLIDAY_TYPES: HolidayType[] = ['Regular Holiday', 'Special Non-Working Day', 'Company Day Off']

const formOpen = ref(false)
const editingId = ref<string | null>(null)
const deleteId = ref<string | null>(null)
const errors = ref<Record<string, string>>({})

const form = reactive<{ name: string; date: string; type: HolidayType }>({
  name: '',
  date: isoDate(),
  type: 'Regular Holiday',
})

const sorted = computed(() =>
  [...holidays.value].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)),
)

const deleteTarget = computed(() => holidays.value.find((holiday) => holiday.id === deleteId.value))

function openAdd() {
  editingId.value = null
  form.name = ''
  form.date = isoDate()
  form.type = 'Regular Holiday'
  errors.value = {}
  formOpen.value = true
}

function openEdit(holidayId: string) {
  const holiday = holidays.value.find((entry) => entry.id === holidayId)
  if (!holiday) return
  editingId.value = holidayId
  form.name = holiday.name
  form.date = holiday.date
  form.type = holiday.type
  errors.value = {}
  formOpen.value = true
}

function save() {
  const issues: Record<string, string> = {}
  if (!form.name.trim()) issues.name = 'Holiday name is required.'
  if (!form.date) issues.date = 'Date is required.'
  else if (
    holidays.value.some((holiday) => holiday.date === form.date && holiday.id !== editingId.value)
  ) {
    issues.date = 'Another holiday already uses that date.'
  }
  errors.value = issues
  if (Object.keys(issues).length) {
    errorToast('Fix the highlighted fields.')
    return
  }

  const payload = { name: form.name.trim(), date: form.date, type: form.type }
  if (editingId.value) {
    store.updateHoliday(editingId.value, payload)
    success('Holiday updated — attendance and DTR remarks recalculated.')
  } else {
    store.createHoliday(payload)
    success('Holiday added — excluded from absences and leave calculations.')
  }
  formOpen.value = false
}

function confirmDelete() {
  const holiday = deleteTarget.value
  if (!holiday) return
  store.deleteHoliday(holiday.id)
  success(`${holiday.name} removed.`)
  deleteId.value = null
}
</script>

<template>
  <div class="hr-page">
    <header class="page-head v-reveal is-visible">
      <div>
        <h1>Holidays</h1>
        <p class="lede">Holidays never count as absences and appear as remarks on DTRs.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="openAdd">
        <AppIcon name="plus" />
        Add holiday
      </button>
    </header>

    <section class="glass table-card v-reveal is-visible" aria-label="Holiday list">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Name</th>
              <th scope="col">Type</th>
              <th scope="col"><span class="visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="holiday in sorted" :key="holiday.id">
              <td>
                <span class="cell-strong">{{ formatDateLabel(holiday.date) }}</span>
              </td>
              <td>{{ holiday.name }}</td>
              <td>
                <span class="status-badge" :class="`is-${holiday.type === 'Regular Holiday' ? 'regular-holiday' : holiday.type === 'Special Non-Working Day' ? 'special-day' : 'day-off'}`">
                  {{ holiday.type }}
                </span>
              </td>
              <td class="row-actions">
                <button type="button" class="btn btn-ghost btn-sm" @click="openEdit(holiday.id)">
                  <AppIcon name="edit" />
                  Edit
                </button>
                <button type="button" class="btn btn-outline btn-sm" @click="deleteId = holiday.id">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!sorted.length" class="empty-state">
        <span class="icon"><AppIcon name="calendar" /></span>
        <p>No holidays yet — add the first one.</p>
      </div>
    </section>

    <AppModal
      v-model:open="formOpen"
      :title="editingId ? 'Edit holiday' : 'Add holiday'"
      subtitle="Regular holidays, special non-working days and company day offs."
    >
      <form class="field-grid" novalidate @submit.prevent="save">
        <div class="field" :class="{ 'has-error': errors.name }">
          <label for="hol-name">Holiday name</label>
          <input id="hol-name" v-model="form.name" type="text" placeholder="Founding Anniversary" />
          <p v-if="errors.name" class="field-error">{{ errors.name }}</p>
        </div>
        <div class="field" :class="{ 'has-error': errors.date }">
          <label for="hol-date">Date</label>
          <input id="hol-date" v-model="form.date" type="date" />
          <p v-if="errors.date" class="field-error">{{ errors.date }}</p>
        </div>
        <div class="field span-2">
          <label for="hol-type">Type</label>
          <select id="hol-type" v-model="form.type">
            <option v-for="type in HOLIDAY_TYPES" :key="type" :value="type">{{ type }}</option>
          </select>
          <p class="hint">All three types are skipped for absences and leave day counts.</p>
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn btn-ghost" @click="formOpen = false">Cancel</button>
        <button type="button" class="btn btn-primary" @click="save">
          <AppIcon name="check" />
          Save holiday
        </button>
      </template>
    </AppModal>

    <AppModal
      :open="Boolean(deleteId)"
      title="Delete holiday?"
      :subtitle="deleteTarget ? `${deleteTarget.name} — ${deleteTarget.date}` : ''"
      @update:open="deleteId = null"
    >
      <p>
        Days that matched this holiday become regular working days again — past absences and leave
        day counts will recalculate.
      </p>
      <template #footer>
        <button type="button" class="btn btn-ghost" @click="deleteId = null">Keep it</button>
        <button type="button" class="btn btn-danger" @click="confirmDelete">
          Delete holiday
        </button>
      </template>
    </AppModal>
  </div>
</template>
