<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useHead } from '#imports'
import { useAuth } from '~/composables/useAuth'
import { useHr } from '~/composables/useHr'
import { useStore } from '~/composables/useStore'
import { useToast } from '~/composables/useToast'
import { formatDateLabel, formatStamp } from '~/utils/datetime'
import { employeeLabel, formatDecimalHours } from '~/utils/hr'

definePageMeta({ layout: 'hr', middleware: 'auth' })
useHead({ title: 'Leaves — Lumi Derma HR' })

const store = useStore()
const { currentUser } = useAuth()
const { success, error: errorToast } = useToast()
const {
  leaveRequests,
  leaveTypes,
  activeEmployees,
  memberById,
  balanceOf,
  balancesFor,
  approveRequest,
  rejectRequest,
  adjustBalance,
} = useHr()

const tab = ref<'requests' | 'balances' | 'types'>('requests')
const requestStatus = ref('All')
const requestSearch = ref('')
const rangeFrom = ref('')
const rangeTo = ref('')
const selectedId = ref<string | null>(null)
const rejecting = ref(false)
const rejectComment = ref('')

const adjustOpen = ref(false)
const adjustForm = reactive({ employeeId: '', typeId: '', delta: 1, reason: '' })

const typeModalOpen = ref(false)
const editingTypeId = ref<string | null>(null)
const typeForm = reactive({ name: '', yearlyCredits: 15, paid: true, active: true })

const typeById = (id: string) => leaveTypes.value.find((type) => type.id === id)

const filteredRequests = computed(() => {
  const term = requestSearch.value.trim().toLowerCase()
  return leaveRequests.value
    .filter((request) => {
      if (requestStatus.value !== 'All' && request.status !== requestStatus.value) return false
      if (rangeFrom.value && request.endDate < rangeFrom.value) return false
      if (rangeTo.value && request.startDate > rangeTo.value) return false
      if (!term) return true
      return employeeLabel(memberById(request.employeeId)).toLowerCase().includes(term)
    })
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
})

const selected = computed(() =>
  selectedId.value ? leaveRequests.value.find((request) => request.id === selectedId.value) : undefined,
)

const selectedBalance = computed(() => {
  if (!selected.value) return null
  const type = typeById(selected.value.typeId)
  if (!type) return null
  return balanceOf(selected.value.employeeId, type)
})

function selectRequest(requestId: string) {
  selectedId.value = requestId
  rejecting.value = false
  rejectComment.value = ''
}

function approveSelected() {
  if (!selected.value) return
  const result = approveRequest(selected.value)
  if (!result.ok) {
    errorToast(result.error || 'Could not approve.')
    return
  }
  success('Leave approved — balance deducted, dates marked On Leave.')
}

function confirmReject() {
  if (!selected.value) return
  const result = rejectRequest(selected.value, rejectComment.value)
  if (!result.ok) {
    errorToast(result.error || 'Could not reject.')
    return
  }
  success('Leave rejected — comment sent to the employee.')
  rejecting.value = false
  rejectComment.value = ''
}

const balanceCells = computed(() =>
  activeEmployees.value.map((employee) => ({
    employee,
    cells: leaveTypes.value
      .filter((type) => type.active)
      .map((type) => ({ type, balance: balanceOf(employee.id, type) })),
  })),
)

function openAdjust(employeeId: string, typeId: string) {
  adjustForm.employeeId = employeeId
  adjustForm.typeId = typeId
  adjustForm.delta = 1
  adjustForm.reason = ''
  adjustOpen.value = true
}

function saveAdjust() {
  const type = typeById(adjustForm.typeId)
  if (!type) return
  const result = adjustBalance(
    adjustForm.employeeId,
    type,
    Number(adjustForm.delta),
    adjustForm.reason,
  )
  if (!result.ok) {
    errorToast(result.error || 'Could not adjust the balance.')
    return
  }
  success(`Balance adjusted for ${employeeLabel(memberById(adjustForm.employeeId))} — logged.`)
  adjustOpen.value = false
}

function openTypeModal(typeId: string | null) {
  editingTypeId.value = typeId
  const type = typeId ? typeById(typeId) : undefined
  typeForm.name = type?.name ?? ''
  typeForm.yearlyCredits = type?.yearlyCredits ?? 15
  typeForm.paid = type?.paid ?? true
  typeForm.active = type?.active ?? true
  typeModalOpen.value = true
}

function saveType() {
  if (!typeForm.name.trim()) {
    errorToast('Leave type name is required.')
    return
  }
  const payload = {
    name: typeForm.name.trim(),
    yearlyCredits: Number(typeForm.yearlyCredits) || 0,
    paid: typeForm.paid,
    active: typeForm.active,
  }
  if (editingTypeId.value) {
    store.updateLeaveType(editingTypeId.value, payload)
    success('Leave type updated.')
  } else {
    store.createLeaveType(payload)
    success('Leave type added.')
  }
  typeModalOpen.value = false
}
</script>

<template>
  <div class="hr-page">
    <header class="page-head v-reveal is-visible">
      <div>
        <h1>Leaves</h1>
        <p class="lede">Requests, balances and leave types — all balances are sample credits.</p>
      </div>
      <div class="tabs" role="tablist" aria-label="Leave sections">
        <button
          v-for="entry in [
            { key: 'requests', label: 'Requests' },
            { key: 'balances', label: 'Balances' },
            { key: 'types', label: 'Leave Types' },
          ]"
          :key="entry.key"
          type="button"
          role="tab"
          class="tab"
          :class="{ 'is-active': tab === entry.key }"
          :aria-selected="tab === entry.key"
          @click="tab = entry.key as typeof tab"
        >
          {{ entry.label }}
        </button>
      </div>
    </header>

    <template v-if="tab === 'requests'">
      <div class="toolbar v-reveal is-visible">
        <div class="search-box">
          <AppIcon name="search" />
          <input
            v-model="requestSearch"
            type="search"
            class="search-input"
            placeholder="Search employee…"
            aria-label="Search leave requests"
          />
        </div>
        <select v-model="requestStatus" class="filter-select" aria-label="Filter by status">
          <option value="All">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <label class="range-label">
          From
          <input v-model="rangeFrom" type="date" class="date-input" aria-label="Range start" />
        </label>
        <label class="range-label">
          To
          <input v-model="rangeTo" type="date" class="date-input" aria-label="Range end" />
        </label>
      </div>

      <div class="leaves-split">
        <section class="glass table-card v-reveal is-visible" aria-label="Leave requests">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th scope="col">Employee</th>
                  <th scope="col">Type</th>
                  <th scope="col">Dates</th>
                  <th scope="col">Days</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="request in filteredRequests"
                  :key="request.id"
                  class="row-clickable"
                  :class="{ 'is-selected': selectedId === request.id }"
                  tabindex="0"
                  @click="selectRequest(request.id)"
                  @keydown.enter="selectRequest(request.id)"
                >
                  <td>
                    <span class="cell-strong">{{ employeeLabel(memberById(request.employeeId)) }}</span>
                    <span class="cell-sub">{{ formatStamp(request.createdAt) }}</span>
                  </td>
                  <td>{{ typeById(request.typeId)?.name || '—' }}</td>
                  <td>
                    {{ formatDateLabel(request.startDate) }} → {{ formatDateLabel(request.endDate) }}
                  </td>
                  <td>{{ request.workingDays }}</td>
                  <td><StatusBadge :status="request.status" /></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="!filteredRequests.length" class="empty-state">
            <span class="icon"><AppIcon name="leaf" /></span>
            <p>No leave requests match these filters.</p>
          </div>
        </section>

        <aside class="glass pane v-reveal is-visible" aria-label="Request details">
          <template v-if="selected">
            <div class="pane-head">
              <h2 class="section-title">Request details</h2>
              <StatusBadge :status="selected.status" />
            </div>

            <dl class="detail-list">
              <div>
                <dt>Employee</dt>
                <dd>{{ employeeLabel(memberById(selected.employeeId)) }}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{{ typeById(selected.typeId)?.name || '—' }}</dd>
              </div>
              <div>
                <dt>Dates</dt>
                <dd>{{ formatDateLabel(selected.startDate) }} → {{ formatDateLabel(selected.endDate) }}</dd>
              </div>
              <div>
                <dt>Working days</dt>
                <dd>{{ selected.workingDays }}{{ selected.halfDay ? ' (half day)' : '' }}</dd>
              </div>
              <div>
                <dt>Reason</dt>
                <dd>{{ selected.reason }}</dd>
              </div>
              <div v-if="selected.comment">
                <dt>HR comment</dt>
                <dd>{{ selected.comment }}</dd>
              </div>
              <div v-if="selectedBalance">
                <dt>Current balance</dt>
                <dd>
                  {{ selectedBalance.type.name }}:
                  {{ selectedBalance.unlimited ? 'no limit' : `${selectedBalance.remaining} remaining` }}
                </dd>
              </div>
            </dl>

            <div v-if="selected.status === 'Pending'" class="pane-actions">
              <template v-if="!rejecting">
                <button type="button" class="btn btn-primary" @click="approveSelected">
                  <AppIcon name="check" />
                  Approve
                </button>
                <button type="button" class="btn btn-outline" @click="rejecting = true">Reject</button>
              </template>
              <template v-else>
                <div class="field">
                  <label for="pane-reject">Rejection comment (required)</label>
                  <textarea
                    id="pane-reject"
                    v-model="rejectComment"
                    rows="3"
                    placeholder="Coverage is already short that week."
                  />
                </div>
                <div class="pane-actions">
                  <button type="button" class="btn btn-ghost" @click="rejecting = false">Cancel</button>
                  <button
                    type="button"
                    class="btn btn-danger"
                    :disabled="!rejectComment.trim()"
                    @click="confirmReject"
                  >
                    Confirm rejection
                  </button>
                </div>
              </template>
            </div>
          </template>

          <div v-else class="empty-state">
            <span class="icon"><AppIcon name="leaf" /></span>
            <p>Select a request to review it.</p>
          </div>
        </aside>
      </div>
    </template>

    <template v-else-if="tab === 'balances'">
      <section class="glass table-card v-reveal is-visible" aria-label="Leave balances">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">Employee</th>
                <th
                  v-for="type in leaveTypes.filter((entry) => entry.active)"
                  :key="type.id"
                  scope="col"
                >
                  {{ type.name }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in balanceCells" :key="row.employee.id">
                <td>
                  <span class="cell-strong">{{ employeeLabel(row.employee) }}</span>
                  <span class="cell-sub">{{ row.employee.jobTitle || row.employee.role }}</span>
                </td>
                <td v-for="cell in row.cells" :key="cell.type.id">
                  <div class="balance-cell">
                    <span>
                      <strong>{{ cell.balance.unlimited ? '∞' : cell.balance.remaining }}</strong>
                      left · {{ cell.balance.used }} used
                    </span>
                    <button
                      type="button"
                      class="link-btn"
                      :aria-label="`Adjust ${cell.type.name} for ${employeeLabel(row.employee)}`"
                      @click="openAdjust(row.employee.id, cell.type.id)"
                    >
                      Adjust
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="!balanceCells.length" class="empty-state">
          <span class="icon"><AppIcon name="users" /></span>
          <p>No active employees yet.</p>
        </div>
      </section>
    </template>

    <template v-else>
      <div class="page-subhead">
        <p class="muted">Yearly credits are editable sample values.</p>
        <button type="button" class="btn btn-primary" @click="openTypeModal(null)">
          <AppIcon name="plus" />
          Add leave type
        </button>
      </div>

      <section class="glass table-card v-reveal is-visible" aria-label="Leave types">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Yearly credits</th>
                <th scope="col">Pay</th>
                <th scope="col">Status</th>
                <th scope="col"><span class="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="type in leaveTypes" :key="type.id">
                <td><span class="cell-strong">{{ type.name }}</span></td>
                <td>{{ type.paid ? type.yearlyCredits : '—' }}</td>
                <td>
                  <StatusBadge :status="type.paid ? 'Paid' : 'Unpaid'" />
                </td>
                <td>
                  <StatusBadge :status="type.active ? 'Active' : 'Inactive'" />
                </td>
                <td class="row-actions">
                  <button type="button" class="btn btn-ghost btn-sm" @click="openTypeModal(type.id)">
                    <AppIcon name="edit" />
                    Edit
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <AppModal
      v-model:open="adjustOpen"
      title="Adjust leave balance"
      subtitle="A reason is required and the change is saved to the audit log."
    >
      <form class="field-grid" novalidate @submit.prevent="saveAdjust">
        <div class="field">
          <label for="adjust-delta">Credit change (+/−)</label>
          <input id="adjust-delta" v-model.number="adjustForm.delta" type="number" step="0.5" />
        </div>
        <div class="field" :class="{ 'has-error': adjustForm.reason.length > 0 && !adjustForm.reason.trim() }">
          <label for="adjust-reason">Reason (required)</label>
          <textarea
            id="adjust-reason"
            v-model="adjustForm.reason"
            rows="3"
            placeholder="e.g. carried over unused credits from the last cycle"
          />
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn btn-ghost" @click="adjustOpen = false">Cancel</button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="!adjustForm.reason.trim() || !adjustForm.delta"
          @click="saveAdjust"
        >
          Save adjustment
        </button>
      </template>
    </AppModal>

    <AppModal
      v-model:open="typeModalOpen"
      :title="editingTypeId ? 'Edit leave type' : 'Add leave type'"
    >
      <form class="field-grid" novalidate @submit.prevent="saveType">
        <div class="field">
          <label for="type-name">Name</label>
          <input id="type-name" v-model="typeForm.name" type="text" placeholder="Paternity Leave" />
        </div>
        <div class="field">
          <label for="type-credits">Yearly credits</label>
          <input id="type-credits" v-model.number="typeForm.yearlyCredits" type="number" min="0" step="1" />
        </div>
        <div class="field span-2">
          <label class="check-line">
            <input v-model="typeForm.paid" type="checkbox" />
            <span>Paid leave (credits count toward the balance)</span>
          </label>
          <label class="check-line">
            <input v-model="typeForm.active" type="checkbox" />
            <span>Active — employees can file this leave</span>
          </label>
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn btn-ghost" @click="typeModalOpen = false">Cancel</button>
        <button type="button" class="btn btn-primary" @click="saveType">
          <AppIcon name="check" />
          Save
        </button>
      </template>
    </AppModal>
  </div>
</template>
