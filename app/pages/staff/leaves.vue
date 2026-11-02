<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useHead } from '#imports'
import { useAuth } from '~/composables/useAuth'
import { useHr } from '~/composables/useHr'
import { useToast } from '~/composables/useToast'
import { formatDateLabel, formatStamp } from '~/utils/datetime'

definePageMeta({ layout: 'staff', middleware: 'auth' })
useHead({ title: 'My Leaves — Lumi Derma Staff' })

const { currentUser } = useAuth()
const { success, error: errorToast } = useToast()
const { leaveTypes, leaveRequests, balancesFor, workingDaysBetween, fileLeave, cancelRequest } = useHr()

const me = computed(() => currentUser.value)
const balances = computed(() => (me.value ? balancesFor(me.value.id) : []))

const activeTypes = computed(() => leaveTypes.value.filter((type) => type.active))

const myRequests = computed(() =>
  leaveRequests.value
    .filter((request) => request.employeeId === me.value?.id)
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
)

const typeById = (id: string) => leaveTypes.value.find((type) => type.id === id)

const form = reactive({
  typeId: '',
  startDate: '',
  endDate: '',
  halfDay: false,
  reason: '',
})

const submitting = ref(false)
const formError = ref('')

const previewDays = computed(() =>
  workingDaysBetween(form.startDate, form.endDate, form.halfDay),
)

const selectedBalance = computed(() => {
  const type = activeTypes.value.find((entry) => entry.id === form.typeId)
  if (!type || !me.value) return null
  return balances.value.find((balance) => balance.type.id === type.id) ?? null
})

async function submit() {
  if (!me.value) return
  formError.value = ''
  submitting.value = true
  const result = fileLeave({
    employeeId: me.value.id,
    typeId: form.typeId,
    startDate: form.startDate,
    endDate: form.endDate,
    halfDay: form.halfDay,
    reason: form.reason,
  })
  submitting.value = false
  if (!result.ok) {
    formError.value = result.error || 'Could not file the leave.'
    errorToast(formError.value)
    return
  }
  success('Leave request filed — waiting for HR approval.')
  form.typeId = ''
  form.startDate = ''
  form.endDate = ''
  form.halfDay = false
  form.reason = ''
}

function onCancel(requestId: string) {
  const request = leaveRequests.value.find((entry) => entry.id === requestId)
  if (!request) return
  cancelRequest(request)
  success('Leave request cancelled.')
}
</script>

<template>
  <div class="staff-page">
    <header class="page-head v-reveal is-visible">
      <div>
        <h1>My Leaves</h1>
        <p class="lede">Balances refresh the moment HR approves or rejects a request.</p>
      </div>
    </header>

    <section class="ring-grid v-reveal is-visible" aria-label="Leave balances">
      <LeaveRing
        v-for="balance in balances"
        :key="balance.type.id"
        :used="balance.used"
        :credits="balance.credits"
        :remaining="balance.remaining"
        :label="balance.type.name"
        :unlimited="balance.unlimited"
      />
    </section>

    <div class="leaves-layout">
      <section class="glass form-card v-reveal is-visible" aria-labelledby="file-leave-title">
        <h2 id="file-leave-title" class="section-title">File a leave</h2>

        <form class="field-grid-2" novalidate @submit.prevent="submit">
          <div class="field span-2">
            <label for="leave-type">Leave type</label>
            <select id="leave-type" v-model="form.typeId" required>
              <option value="" disabled>Choose a leave type</option>
              <option v-for="type in activeTypes" :key="type.id" :value="type.id">
                {{ type.name }}{{ type.paid ? '' : ' (unpaid)' }}
              </option>
            </select>
          </div>

          <div class="field">
            <label for="leave-start">Start date</label>
            <input id="leave-start" v-model="form.startDate" type="date" required />
          </div>

          <div class="field">
            <label for="leave-end">End date</label>
            <input id="leave-end" v-model="form.endDate" type="date" required />
          </div>

          <div class="field span-2 check-field">
            <label class="check-line">
              <input v-model="form.halfDay" type="checkbox" />
              <span>Half day only (deducts 0.5 day)</span>
            </label>
          </div>

          <div class="field span-2">
            <label for="leave-reason">Reason</label>
            <textarea
              id="leave-reason"
              v-model="form.reason"
              rows="3"
              required
              placeholder="Tell HR why you need this leave…"
            />
          </div>

          <div class="leave-preview span-2" aria-live="polite">
            <p>
              <strong>{{ previewDays }}</strong> working day{{ previewDays === 1 ? '' : 's' }} —
              Sundays and holidays excluded.
            </p>
            <p v-if="selectedBalance" class="leave-preview-balance">
              {{ selectedBalance.type.name }} balance:
              <strong>{{ selectedBalance.unlimited ? 'no limit' : `${selectedBalance.remaining} remaining` }}</strong>
            </p>
          </div>

          <p v-if="formError" class="field-error span-2" role="alert">{{ formError }}</p>

          <div class="span-2">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              <AppIcon name="leaf" />
              File request
            </button>
          </div>
        </form>
      </section>

      <section class="glass form-card v-reveal is-visible" aria-labelledby="my-requests-title">
        <h2 id="my-requests-title" class="section-title">My requests</h2>

        <ul class="request-list">
          <li v-for="request in myRequests" :key="request.id" class="request-item">
            <div class="request-top">
              <span class="cell-strong">{{ typeById(request.typeId)?.name || 'Leave' }}</span>
              <StatusBadge :status="request.status" />
            </div>
            <p class="request-dates">
              {{ formatDateLabel(request.startDate) }} → {{ formatDateLabel(request.endDate) }}
              · {{ request.workingDays }} day{{ request.workingDays === 1 ? '' : 's' }}
              <span v-if="request.halfDay"> · half day</span>
            </p>
            <p class="request-reason">{{ request.reason }}</p>
            <p v-if="request.comment" class="request-comment">HR: {{ request.comment }}</p>
            <div class="request-foot">
              <span class="muted">Filed {{ formatStamp(request.createdAt) }}</span>
              <button
                v-if="request.status === 'Pending'"
                type="button"
                class="btn btn-outline btn-sm"
                @click="onCancel(request.id)"
              >
                Cancel
              </button>
            </div>
          </li>
        </ul>

        <div v-if="!myRequests.length" class="empty-state">
          <span class="icon"><AppIcon name="leaf" /></span>
          <p>No leave requests yet — file your first one.</p>
        </div>
      </section>
    </div>
  </div>
</template>
