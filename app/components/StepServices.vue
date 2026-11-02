<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBooking } from '~/composables/useBooking'
import { useStore } from '~/composables/useStore'

const { toggleService, isSelected } = useBooking()
const store = useStore()

const popularServices = computed(() => store.popularActiveServices.value)
const allServices = computed(() => store.activeServices.value)

const query = ref('')

const filtered = computed(() => {
  const term = query.value.trim().toLowerCase()
  if (!term) return allServices.value
  return allServices.value.filter((service) =>
    [service.name, service.category, service.description].some((field) =>
      field.toLowerCase().includes(term),
    ),
  )
})
</script>

<template>
  <div>
    <h2 class="step-title">Choose your services</h2>
    <p class="step-sub">Pick one or more treatments. You can change these with a quick edit before you pay.</p>

    <div class="step-group-title">
      <span class="service-icon" style="width: 40px; height: 40px"><AppIcon name="sparkle" /></span>
      <h3>Most common treatments</h3>
    </div>

    <div class="service-grid service-grid-lg">
      <ServiceCard
        v-for="service in popularServices"
        :key="service.id"
        :service="service"
        :selectable="true"
        :selected="isSelected(service.id)"
        @toggle="toggleService"
      />
    </div>

    <div class="step-group-title" style="margin-top: 28px">
      <span class="service-icon" style="width: 40px; height: 40px"><AppIcon name="face" /></span>
      <h3>All services</h3>
    </div>

    <div class="search-field" style="margin-bottom: 16px">
      <AppIcon name="search" />
      <label class="sr-only" for="service-search">Search services</label>
      <input
        id="service-search"
        v-model="query"
        class="search-input"
        type="search"
        placeholder="Search by name, category, or concern"
      />
    </div>

    <div v-if="filtered.length" class="service-grid">
      <ServiceCard
        v-for="service in filtered"
        :key="service.id"
        :service="service"
        :selectable="true"
        :selected="isSelected(service.id)"
        @toggle="toggleService"
      />
    </div>

    <div v-else class="empty-state">
      <AppIcon name="search" />
      <h3>Nothing matched your search</h3>
      <p class="muted" style="margin-top: 8px">Try another keyword.</p>
    </div>

    <SelectedServicesTray />
  </div>
</template>