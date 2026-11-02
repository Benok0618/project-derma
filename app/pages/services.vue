<script setup lang="ts">
import { computed, ref } from 'vue'
import { categories } from '~/data/services'
import { useStore } from '~/composables/useStore'
import { useBooking } from '~/composables/useBooking'

useHead({ title: 'Services — Lumi Derma Studio' })

const store = useStore()
const booking = useBooking()
const selectedServices = booking.selectedServices
const toggleService = booking.toggleService
const isSelected = booking.isSelected

const query = ref('')
const activeCategory = ref('All')
const chips = ['All', ...categories]

const filtered = computed(() => {
  const term = query.value.trim().toLowerCase()
  return store.activeServices.value.filter((service) => {
    const matchesCategory = activeCategory.value === 'All' || service.category === activeCategory.value
    const matchesTerm =
      !term ||
      [service.name, service.category, service.description].some((field) =>
        field.toLowerCase().includes(term),
      )
    return matchesCategory && matchesTerm
  })
})

function resetFilters() {
  query.value = ''
  activeCategory.value = 'All'
}

function bookSelectedServices() {
  if (selectedServices.value.length === 0) return
  navigateTo('/book')
}
</script>

<template>
  <div>
    <section class="page-head">
      <div class="container">
        <p class="eyebrow reveal" v-reveal>Treatment menu</p>
        <h1 class="reveal" v-reveal>Every treatment, one clear price</h1>
        <p class="lede center reveal" v-reveal>
          Search the full menu or filter by what your skin needs. Prices are in Philippine pesos and
          include your consultation time.
        </p>
      </div>
    </section>

    <section class="section-tight">
      <div class="container">
        <div class="filter-bar reveal" v-reveal>
          <div class="search-field">
            <AppIcon name="search" />
            <label class="sr-only" for="catalog-search">Search services</label>
            <input
              id="catalog-search"
              v-model="query"
              class="search-input"
              type="search"
              placeholder="Search treatments, categories, or concerns"
            />
          </div>
          <div class="chips" role="group" aria-label="Filter by category">
            <button
              v-for="chip in chips"
              :key="chip"
              type="button"
              class="chip"
              :class="{ 'is-active': activeCategory === chip }"
              :aria-pressed="activeCategory === chip"
              @click="activeCategory = chip"
            >
              {{ chip }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="section-tight" style="padding-top: 0">
      <div class="container">
        <p class="muted t-space-bottom" aria-live="polite">
          Showing {{ filtered.length }} of {{ store.activeServices.value.length }} services
        </p>

        <ClientOnly fallback="Loading services…">
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
            <p class="muted t-space-small">
              Try another keyword, or reset to see every treatment we offer.
            </p>
            <button type="button" class="btn btn-ghost btn-sm" style="margin-top: 16px" @click="resetFilters">
              Reset filters
            </button>
          </div>
        </ClientOnly>

        <SelectedServicesTray v-if="selectedServices.length" title="Your selection">
          <div class="tray-cta">
            <button type="button" class="btn btn-primary" @click="bookSelectedServices">
              Book {{ selectedServices.length }} selected
              {{ selectedServices.length === 1 ? 'service' : 'services' }}
            </button>
          </div>
        </SelectedServicesTray>
      </div>
    </section>
  </div>
</template>
