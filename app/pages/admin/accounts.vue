<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

import { ref, computed } from 'vue'
import { useHead } from '#imports'
import { useStore } from '~/composables/useStore'
import { useToast } from '~/composables/useToast'
import { uid } from '~/utils/id'

useHead({ title: 'Accounts — Lumi Derma Admin' })

const store = useStore()
const { success, error } = useToast()

const search = ref('')
const roleFilter = ref('All')
const statusFilter = ref('All')

const roles = ['HR Admin', 'Front Desk', 'Facialist', 'Employee'] as const

const filteredStaff = computed(() => {
  return store.activeStaff.value.filter(member => {
    const matchesSearch =
      !search.value ||
      [member.firstName, member.lastName, member.email, member.mobile].some(field =>
        field.toLowerCase().includes(search.value.toLowerCase()),
      )
    const matchesRole = roleFilter.value === 'All' || member.role === roleFilter.value
    const matchesStatus = statusFilter.value === 'All' || (statusFilter.value === 'Active' ? member.active : !member.active)
    return matchesSearch && matchesRole && matchesStatus
  })
})

const modalOpen = ref(false)
const editingMember = ref<ReturnType<typeof store.staffById> | null>(null)
const showPassword = ref(false)

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  role: 'Facialist' as typeof roles[number],
  password: '',
  active: true,
})

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
  let pwd = ''
  for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
  form.value.password = pwd
}

function openCreate() {
  editingMember.value = null
  form.value = { firstName: '', lastName: '', email: '', mobile: '', role: 'Facialist', password: '', active: true }
  generatePassword()
  modalOpen.value = true
}

function openEdit(member: ReturnType<typeof store.staffById>) {
  if (!member) return
  editingMember.value = member
  form.value = {
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    mobile: member.mobile,
    role: member.role,
    password: '',
    active: member.active,
  }
  modalOpen.value = true
}

async function saveMember() {
  const emailNorm = form.value.email.trim().toLowerCase()
  const exists = store.state.value.staff.some(m =>
    m.email.toLowerCase() === emailNorm && m.id !== editingMember.value?.id,
  )
  if (exists) {
    error('An account with this email already exists.')
    return
  }

  if (editingMember.value) {
    const patch: Partial<typeof form.value> = { ...form.value }
    if (!patch.password) delete patch.password
    store.updateStaff(editingMember.value.id, patch)
    success('Account updated.')
  } else {
    if (!form.value.password) {
      error('Please set a password or generate one.')
      return
    }
    store.createStaff({ ...form.value })
    success('Account created.')
  }
  modalOpen.value = false
}

function toggleActive(member: ReturnType<typeof store.staffById>) {
  if (!member) return
  if (member.id === store.currentUser.value?.id && member.active) {
    error('You cannot deactivate your own account.')
    return
  }
  store.updateStaff(member.id, { active: !member.active })
  success(member.active ? 'Account deactivated.' : 'Account reactivated.')
}
</script>

<template>
  <div>
    <div class="table-toolbar">
      <div class="toolbar-left">
        <button type="button" class="btn btn-primary" @click="openCreate">
          <AppIcon name="plus" style="margin-right: 6px" />
          Create Account
        </button>
      </div>
      <div class="toolbar-filters">
        <input
          v-model="search"
          type="search"
          placeholder="Search name, email, mobile…"
          class="search-input"
          style="width: 260px"
        />
        <select v-model="roleFilter" class="filter-select">
          <option value="All">All roles</option>
          <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
        </select>
        <select v-model="statusFilter" class="filter-select">
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Mobile</th>
            <th>Role</th>
            <th>Status</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in filteredStaff" :key="member.id" :class="{ 'row-muted': !member.active }">
            <td>{{ member.firstName }} {{ member.lastName }}</td>
            <td>{{ member.email }}</td>
            <td>{{ member.mobile }}</td>
            <td><StatusBadge :status="member.role" /></td>
            <td>
              <StatusBadge :status="member.active ? 'Active' : 'Inactive'" />
            </td>
            <td class="actions-col">
              <button type="button" class="icon-btn" @click="openEdit(member)" aria-label="Edit">
                <AppIcon name="chevron-right" />
              </button>
              <button
                type="button"
                class="icon-btn"
                :class="{ 'text-danger': member.active }"
                @click="toggleActive(member)"
                :aria-label="member.active ? 'Deactivate' : 'Activate'"
              >
                <AppIcon :name="member.active ? 'lock' : 'shield'" />
              </button>
            </td>
          </tr>
          <tr v-if="!filteredStaff.length">
            <td colspan="6" class="center muted">No accounts match your filters.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppModal v-model:open="modalOpen" title="Create Account" subtitle="Fill in the details below. A temporary password will be generated.">
      <form @submit.prevent="saveMember">
        <div class="field-grid-2">
          <div class="field">
            <label for="firstName">First name *</label>
            <input id="firstName" v-model="form.firstName" required />
          </div>
          <div class="field">
            <label for="lastName">Last name *</label>
            <input id="lastName" v-model="form.lastName" required />
          </div>
        </div>

        <div class="field">
          <label for="email">Email *</label>
          <input id="email" v-model="form.email" type="email" required />
        </div>

        <div class="field">
          <label for="mobile">Mobile number *</label>
          <input id="mobile" v-model="form.mobile" type="tel" placeholder="09XXXXXXXXX" required />
        </div>

        <div class="field">
          <label for="role">Role *</label>
          <select id="role" v-model="form.role" required>
            <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>

        <div class="field">
          <label for="password">Temporary password *</label>
          <div class="password-field">
            <input
              id="password"
              :type="showPassword ? 'text' : 'password'"
              v-model="form.password"
              :disabled="!!editingMember && !form.password"
            />
            <button
              type="button"
              class="icon-btn"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
            >
              <AppIcon :name="showPassword ? 'x' : 'info'" />
            </button>
          </div>
          <div class="field-hint" style="margin-top: 8px">
            <button type="button" class="btn btn-ghost btn-sm" @click="generatePassword">
              <AppIcon name="sparkle" style="margin-right: 6px" />
              Generate
            </button>
          </div>
        </div>

        <div class="field checkbox-field">
          <label>
            <input type="checkbox" v-model="form.active" />
            <span>Active</span>
          </label>
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn btn-ghost" @click="modalOpen = false">Cancel</button>
        <button type="button" class="btn btn-primary" @click="saveMember">{{ editingMember ? 'Save changes' : 'Create account' }}</button>
      </template>
    </AppModal>
  </div>
</template>