<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

import { ref, computed } from 'vue'
import { useHead } from '#imports'
import { useStore } from '~/composables/useStore'
import { useToast } from '~/composables/useToast'
import { formatPeso } from '~/utils/format'
import type { Service, ServiceCategory } from '~/data/services'

useHead({ title: 'Services — Lumi Derma Admin' })

const store = useStore()
const { success, error } = useToast()

const search = ref('')
const categoryFilter = ref('All')
const statusFilter = ref('All')

const allCategories = computed(() => store.state.value.services.map(s => s.category).filter((v, i, a) => a.indexOf(v) === i))

const filteredServices = computed(() => {
  return store.services.value.filter(service => {
    const matchesSearch =
      !search.value ||
      [service.name, service.category, service.description].some(field =>
        field.toLowerCase().includes(search.value.toLowerCase()),
      )
    const matchesCategory = categoryFilter.value === 'All' || service.category === categoryFilter.value
    const matchesStatus = statusFilter.value === 'All' || (statusFilter.value === 'Active' ? service.active : !service.active)
    return matchesSearch && matchesCategory && matchesStatus
  })
})

const modalOpen = ref(false)
const editingService = ref<Service | null>(null)

const form = ref({
  name: '',
  category: 'Consultation' as ServiceCategory,
  description: '',
  durationMinutes: 30,
  price: 0,
  popular: false,
  active: true,
})

function openCreate() {
  editingService.value = null
  form.value = { name: '', category: allCategories.value[0] || 'Consultation', description: '', durationMinutes: 30, price: 0, popular: false, active: true }
  modalOpen.value = true
}

function openEdit(service: Service) {
  editingService.value = service
  form.value = { ...service }
  modalOpen.value = true
}

function saveService() {
  if (editingService.value) {
    store.updateService(editingService.value.id, { ...form.value })
    success('Service updated.')
  } else {
    store.createService({ ...form.value })
    success('Service created.')
  }
  modalOpen.value = false
}

function toggleActive(service: Service) {
  store.updateService(service.id, { active: !service.active })
  success(service.active ? 'Service deactivated.' : 'Service reactivated.')
}
</script>

<template>
  <div>
    <div class="table-toolbar">
      <div class="toolbar-left">
        <button type="button" class="btn btn-primary" @click="openCreate">
          <AppIcon name="plus" style="margin-right: 6px" />
          Create Service
        </button>
      </div>
      <div class="toolbar-filters">
        <input
          v-model="search"
          type="search"
          placeholder="Search name, category, description…"
          class="search-input"
          style="width: 280px"
        />
        <select v-model="categoryFilter" class="filter-select">
          <option value="All">All categories</option>
          <option v-for="c in allCategories" :key="c" :value="c">{{ c }}</option>
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
            <th>Category</th>
            <th>Duration</th>
            <th>Price</th>
            <th>Popular</th>
            <th>Status</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="service in filteredServices" :key="service.id" :class="{ 'row-muted': !service.active }">
            <td>{{ service.name }}</td>
            <td>{{ service.category }}</td>
            <td>{{ service.durationMinutes }} min</td>
            <td>{{ formatPeso(service.price) }}</td>
            <td>
              <span class="popular-badge" :class="{ 'is-popular': service.popular }">
                {{ service.popular ? 'Yes' : 'No' }}
              </span>
            </td>
            <td>
              <StatusBadge :status="service.active ? 'Active' : 'Inactive'" />
            </td>
            <td class="actions-col">
              <button type="button" class="icon-btn" @click="openEdit(service)" aria-label="Edit">
                <AppIcon name="chevron-right" />
              </button>
              <button
                type="button"
                class="icon-btn"
                :class="{ 'text-danger': service.active }"
                @click="toggleActive(service)"
                :aria-label="service.active ? 'Deactivate' : 'Activate'"
              >
                <AppIcon :name="service.active ? 'lock' : 'shield'" />
              </button>
            </td>
          </tr>
          <tr v-if="!filteredServices.length">
            <td colspan="7" class="center muted">No services match your filters.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppModal v-model:open="modalOpen" title="Create Service" subtitle="Add a new treatment to the menu." size="lg">
      <form @submit.prevent="saveService">
        <div class="field">
          <label for="name">Name *</label>
          <input id="name" v-model="form.name" required />
        </div>

        <div class="field">
          <label for="category">Category *</label>
          <select id="category" v-model="form.category" required>
            <option v-for="c in allCategories" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div class="field">
          <label for="description">Short description *</label>
          <textarea id="description" v-model="form.description" rows="3" required placeholder="What does this treatment do and who is it for?"></textarea>
        </div>

        <div class="field-grid-2">
          <div class="field">
            <label for="duration">Duration (minutes) *</label>
            <input id="duration" v-model="form.durationMinutes" type="number" min="15" max="480" step="15" required />
          </div>
          <div class="field">
            <label for="price">Price (PHP) *</label>
            <input id="price" v-model="form.price" type="number" min="0" step="50" required />
          </div>
        </div>

        <div class="field checkbox-field">
          <label>
            <input type="checkbox" v-model="form.popular" />
            <span>Mark as popular (shows in "Most common" section)</span>
          </label>
        </div>

        <div class="field checkbox-field">
          <label>
            <input type="checkbox" v-model="form.active" />
            <span>Active (visible to patients)</span>
          </label>
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn btn-ghost" @click="modalOpen = false">Cancel</button>
        <button type="button" class="btn btn-primary" @click="saveService">{{ editingService ? 'Save changes' : 'Create service' }}</button>
      </template>
    </AppModal>
  </div>
</template>