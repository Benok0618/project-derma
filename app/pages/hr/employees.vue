<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useHead } from '#imports'
import { useAuth } from '~/composables/useAuth'
import { useHr } from '~/composables/useHr'
import { useStore } from '~/composables/useStore'
import { useToast } from '~/composables/useToast'
import { formatDateLabel, isoDate } from '~/utils/datetime'
import { employeeLabel, validPhilippineMobile } from '~/utils/hr'

definePageMeta({ layout: 'hr', middleware: 'auth' })
useHead({ title: 'Employees — Lumi Derma HR' })

const store = useStore()
const { currentUser } = useAuth()
const { success, error: errorToast } = useToast()
const { balancesFor, summaryFor } = useHr()

const search = ref('')
const roleFilter = ref('All')
const statusFilter = ref('All')
const formOpen = ref(false)
const detailId = ref<string | null>(null)
const editingId = ref<string | null>(null)
const showPassword = ref(false)
const errors = ref<Record<string, string>>({})

type FormState = {
  firstName: string
  lastName: string
  email: string
  mobile: string
  jobTitle: string
  role: 'HR Admin' | 'Employee'
  dateHired: string
  password: string
  active: boolean
}

function blankForm(): FormState {
  return {
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    jobTitle: '',
    role: 'Employee',
    dateHired: isoDate(),
    password: '',
    active: true,
  }
}

const form = ref<FormState>(blankForm())

const accessRole = (member: { role: string }) => (member.role === 'HR Admin' ? 'HR Admin' : 'Employee')

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return store.state.value.staff.filter((member) => {
    const matchesSearch =
      !term ||
      [member.firstName, member.lastName, member.email, member.mobile, member.jobTitle ?? ''].some(
        (field) => field.toLowerCase().includes(term),
      )
    const matchesRole = roleFilter.value === 'All' || accessRole(member) === roleFilter.value
    const matchesStatus =
      statusFilter.value === 'All' ||
      (statusFilter.value === 'Active' ? member.active : !member.active)
    return matchesSearch && matchesRole && matchesStatus
  })
})

const detailMember = computed(() =>
  detailId.value ? store.staffById(detailId.value) : undefined,
)

const now = new Date()

function openAdd() {
  editingId.value = null
  form.value = blankForm()
  errors.value = {}
  showPassword.value = false
  formOpen.value = true
}

function openEdit(memberId: string) {
  const member = store.staffById(memberId)
  if (!member) return
  editingId.value = memberId
  form.value = {
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    mobile: member.mobile,
    jobTitle: member.jobTitle || '',
    role: member.role === 'HR Admin' ? 'HR Admin' : 'Employee',
    dateHired: member.dateHired || '',
    password: member.password,
    active: member.active,
  }
  errors.value = {}
  showPassword.value = false
  formOpen.value = true
}

function generatePassword() {
  const stems = ['glow', 'mint', 'lumi', 'derma', 'calm']
  const stem = stems[Math.floor(Math.random() * stems.length)] ?? 'lumi'
  form.value.password = `${stem}${Math.floor(1000 + Math.random() * 9000)}!`
  showPassword.value = true
}

function validate(): boolean {
  const issues: Record<string, string> = {}
  const value = form.value
  if (!value.firstName.trim()) issues.firstName = 'First name is required.'
  if (!value.lastName.trim()) issues.lastName = 'Last name is required.'
  const email = value.email.trim().toLowerCase()
  if (!email) issues.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) issues.email = 'Enter a valid email address.'
  else if (
    store.state.value.staff.some(
      (member) =>
        member.email.toLowerCase() === email && member.id !== editingId.value,
    )
  ) {
    issues.email = 'That email is already used by another account.'
  }
  if (!value.mobile.trim()) issues.mobile = 'Mobile number is required.'
  else if (!validPhilippineMobile(value.mobile)) issues.mobile = 'Use a valid PH mobile, e.g. 0917 123 4567.'
  if (!value.jobTitle.trim()) issues.jobTitle = 'Job title is required.'
  if (!value.role) issues.role = 'Role is required.'
  if (!value.dateHired) issues.dateHired = 'Date hired is required.'
  if (!editingId.value) {
    if (!value.password) issues.password = 'Set a temporary password.'
    else if (value.password.length < 6) issues.password = 'At least 6 characters.'
  } else if (value.password && value.password.length < 6) {
    issues.password = 'At least 6 characters.'
  }
  errors.value = issues
  return Object.keys(issues).length === 0
}

function save() {
  if (!validate()) {
    errorToast('Fix the highlighted fields.')
    return
  }
  const value = form.value
  if (editingId.value) {
    store.updateStaff(editingId.value, {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim().toLowerCase(),
      mobile: value.mobile.trim(),
      jobTitle: value.jobTitle.trim(),
      role: value.role,
      dateHired: value.dateHired,
      password: value.password,
      active: value.active,
    })
    success(`${value.firstName} ${value.lastName} updated.`)
  } else {
    store.createStaff({
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim().toLowerCase(),
      mobile: value.mobile.trim(),
      jobTitle: value.jobTitle.trim(),
      role: value.role,
      dateHired: value.dateHired,
      password: value.password,
      active: value.active,
    })
    success(`${value.firstName} ${value.lastName} added to the team.`)
  }
  formOpen.value = false
}

function toggleActive(memberId: string) {
  const member = store.staffById(memberId)
  if (!member) return
  if (member.id === currentUser.value?.id) {
    errorToast('You cannot deactivate your own account.')
    return
  }
  store.updateStaff(memberId, { active: !member.active })
  success(
    member.active
      ? `${employeeLabel(member)} deactivated — they can no longer sign in.`
      : `${employeeLabel(member)} reactivated.`,
  )
}
</script>

<template>
  <div class="hr-page">
    <header class="page-head v-reveal is-visible">
      <div>
        <h1>Employees</h1>
        <p class="lede">Manage accounts, roles and temporary passwords.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="openAdd">
        <AppIcon name="plus" />
        Add employee
      </button>
    </header>

    <div class="toolbar v-reveal is-visible">
      <div class="search-box">
        <AppIcon name="search" />
        <input
          v-model="search"
          type="search"
          class="search-input"
          placeholder="Search name, email, mobile…"
          aria-label="Search employees"
        />
      </div>
      <select v-model="roleFilter" class="filter-select" aria-label="Filter by role">
        <option value="All">All roles</option>
        <option value="HR Admin">HR Admin</option>
        <option value="Employee">Employee</option>
      </select>
      <select v-model="statusFilter" class="filter-select" aria-label="Filter by status">
        <option value="All">All statuses</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>
      <span class="muted">{{ filtered.length }} of {{ store.state.value.staff.length }}</span>
    </div>

    <section class="glass table-card v-reveal is-visible" aria-label="Employee accounts">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">Employee</th>
              <th scope="col">Mobile</th>
              <th scope="col">Job title</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col"><span class="visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in filtered" :key="member.id">
              <td>
                <span class="cell-strong">{{ employeeLabel(member) }}</span>
                <span class="cell-sub">{{ member.email }}</span>
              </td>
              <td>{{ member.mobile }}</td>
              <td>{{ member.jobTitle || member.role }}</td>
              <td>
                <span class="status-badge" :class="accessRole(member) === 'HR Admin' ? 'is-hr-admin' : 'is-employee'">
                  {{ accessRole(member) }}
                </span>
              </td>
              <td>
                <StatusBadge :status="member.active ? 'Active' : 'Inactive'" />
              </td>
              <td class="row-actions">
                <button type="button" class="btn btn-ghost btn-sm" @click="detailId = member.id">
                  Details
                </button>
                <button type="button" class="btn btn-ghost btn-sm" @click="openEdit(member.id)">
                  <AppIcon name="edit" />
                  Edit
                </button>
                <button
                  type="button"
                  class="btn btn-outline btn-sm"
                  :disabled="member.id === currentUser?.id"
                  :title="member.id === currentUser?.id ? 'You cannot deactivate your own account' : undefined"
                  @click="toggleActive(member.id)"
                >
                  {{ member.active ? 'Deactivate' : 'Reactivate' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!filtered.length" class="empty-state">
        <span class="icon"><AppIcon name="users" /></span>
        <p>No employees match these filters.</p>
      </div>
    </section>

    <AppModal
      v-model:open="formOpen"
      :title="editingId ? 'Edit employee' : 'Add employee'"
      subtitle="All fields are required."
      size="lg"
    >
      <form class="field-grid-2" novalidate @submit.prevent="save">
        <div class="field" :class="{ 'has-error': errors.firstName }">
          <label for="emp-first">First name</label>
          <input id="emp-first" v-model="form.firstName" type="text" autocomplete="off" />
          <p v-if="errors.firstName" class="field-error">{{ errors.firstName }}</p>
        </div>
        <div class="field" :class="{ 'has-error': errors.lastName }">
          <label for="emp-last">Last name</label>
          <input id="emp-last" v-model="form.lastName" type="text" autocomplete="off" />
          <p v-if="errors.lastName" class="field-error">{{ errors.lastName }}</p>
        </div>

        <div class="field" :class="{ 'has-error': errors.email }">
          <label for="emp-email">Email</label>
          <input id="emp-email" v-model="form.email" type="email" autocomplete="off" />
          <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
        </div>
        <div class="field" :class="{ 'has-error': errors.mobile }">
          <label for="emp-mobile">Mobile number</label>
          <input id="emp-mobile" v-model="form.mobile" type="tel" placeholder="0917 123 4567" />
          <p v-if="errors.mobile" class="field-error">{{ errors.mobile }}</p>
        </div>

        <div class="field" :class="{ 'has-error': errors.jobTitle }">
          <label for="emp-job">Job title</label>
          <input id="emp-job" v-model="form.jobTitle" type="text" list="job-titles" placeholder="Facialist" />
          <datalist id="job-titles">
            <option value="Facialist" />
            <option value="Front Desk" />
            <option value="Receptionist" />
            <option value="Aesthetician" />
            <option value="HR Manager" />
            <option value="Clinic Nurse" />
          </datalist>
          <p v-if="errors.jobTitle" class="field-error">{{ errors.jobTitle }}</p>
        </div>
        <div class="field" :class="{ 'has-error': errors.role }">
          <label for="emp-role">Role</label>
          <select id="emp-role" v-model="form.role">
            <option value="Employee">Employee</option>
            <option value="HR Admin">HR Admin</option>
          </select>
          <p v-if="errors.role" class="field-error">{{ errors.role }}</p>
        </div>

        <div class="field" :class="{ 'has-error': errors.dateHired }">
          <label for="emp-hired">Date hired</label>
          <input id="emp-hired" v-model="form.dateHired" type="date" />
          <p v-if="errors.dateHired" class="field-error">{{ errors.dateHired }}</p>
        </div>
        <div class="field" :class="{ 'has-error': errors.password }">
          <label for="emp-password">{{ editingId ? 'Password (leave as-is to keep)' : 'Temporary password' }}</label>
          <div class="password-field">
            <input
              id="emp-password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
            />
            <button
              type="button"
              class="icon-btn"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              <AppIcon :name="showPassword ? 'eye-off' : 'eye'" />
            </button>
          </div>
          <button type="button" class="link-btn" @click="generatePassword">
            <AppIcon name="sparkle" />
            Generate password
          </button>
          <p v-if="errors.password" class="field-error">{{ errors.password }}</p>
        </div>

        <div class="field span-2">
          <label class="check-line">
            <input v-model="form.active" type="checkbox" />
            <span>Active — can sign in to the portal</span>
          </label>
        </div>
      </form>

      <template #footer>
        <button type="button" class="btn btn-ghost" @click="formOpen = false">Cancel</button>
        <button type="button" class="btn btn-primary" @click="save">
          <AppIcon name="check" />
          {{ editingId ? 'Save changes' : 'Add employee' }}
        </button>
      </template>
    </AppModal>

    <AppModal
      :open="Boolean(detailId)"
      variant="drawer"
      title="Employee details"
      :subtitle="detailMember ? employeeLabel(detailMember) : ''"
      @update:open="detailId = null"
    >
      <template v-if="detailMember">
        <dl class="detail-list">
          <div><dt>Email</dt><dd>{{ detailMember.email }}</dd></div>
          <div><dt>Mobile</dt><dd>{{ detailMember.mobile }}</dd></div>
          <div><dt>Job title</dt><dd>{{ detailMember.jobTitle || detailMember.role }}</dd></div>
          <div><dt>Role</dt><dd>{{ accessRole(detailMember) }}</dd></div>
          <div><dt>Date hired</dt><dd>{{ detailMember.dateHired ? formatDateLabel(detailMember.dateHired) : '—' }}</dd></div>
          <div><dt>Status</dt><dd><StatusBadge :status="detailMember.active ? 'Active' : 'Inactive'" /></dd></div>
        </dl>

        <h3 class="section-title" style="margin-top: 22px">Leave balances</h3>
        <div class="ring-grid ring-grid-compact">
          <LeaveRing
            v-for="balance in balancesFor(detailMember.id)"
            :key="balance.type.id"
            :used="balance.used"
            :credits="balance.credits"
            :remaining="balance.remaining"
            :label="balance.type.name"
            :unlimited="balance.unlimited"
          />
        </div>

        <h3 class="section-title" style="margin-top: 22px">
          {{ new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }} so far
        </h3>
        <dl class="detail-list detail-stats">
          <div><dt>Days present</dt><dd>{{ summaryFor(detailMember.id, now.getFullYear(), now.getMonth()).daysPresent }}</dd></div>
          <div><dt>Late arrivals</dt><dd>{{ summaryFor(detailMember.id, now.getFullYear(), now.getMonth()).lateCount }}</dd></div>
          <div><dt>Absences</dt><dd>{{ summaryFor(detailMember.id, now.getFullYear(), now.getMonth()).absences }}</dd></div>
          <div><dt>Hours worked</dt><dd>{{ summaryFor(detailMember.id, now.getFullYear(), now.getMonth()).totalHours.toFixed(2) }}</dd></div>
        </dl>
      </template>
    </AppModal>
  </div>
</template>
