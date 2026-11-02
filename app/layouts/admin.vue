<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { navigateTo } from '#imports'
import { useAuth } from '~/composables/useAuth'
import { useToast } from '~/composables/useToast'
import { useStore } from '~/composables/useStore'

const { currentUser, logout, homeFor } = useAuth()
const { success } = useToast()
const store = useStore()

const route = useRoute()
const sidebarOpen = ref(false)
const resetModalOpen = ref(false)

function checkWidth() {
  if (window.innerWidth >= 1024) sidebarOpen.value = false
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('resize', checkWidth)
    checkWidth()
  }
})

function handleLogout() {
  logout()
  navigateTo('/')
}

function openResetModal() {
  resetModalOpen.value = true
}

function resetAndClose() {
  store.resetAll()
  success('Demo data has been reset.')
  resetModalOpen.value = false
}

const navItems = [
  { path: '/admin', label: 'Overview', icon: 'sparkle' },
  { path: '/admin/accounts', label: 'Accounts', icon: 'users' },
  { path: '/admin/services', label: 'Services', icon: 'face' },
  { path: '/admin/promos', label: 'Promos & Discounts', icon: 'tag' },
  { path: '/admin/doctors', label: 'Doctors', icon: 'user' },
  { path: '/admin/inquiries', label: 'Inquiries', icon: 'mail' },
  { path: '/admin/time-records', label: 'Time Records', icon: 'calendar' },
  { path: '/admin/dtr-print', label: 'Print DTR', icon: 'printer' },
]
</script>

<template>
  <div class="admin-shell">
    <AppToasts />

    <aside class="admin-sidebar" :class="{ 'is-open': sidebarOpen }" aria-label="Admin navigation">
      <div class="sidebar-head">
        <NuxtLink to="/admin" class="brand">
          <BrandMark />
          <span class="brand-name">Lumi <em>Derma</em></span>
        </NuxtLink>
      </div>

      <nav class="admin-nav" aria-label="Admin sections">
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ 'is-active': route.path.startsWith(item.path) }"
        >
          <AppIcon :name="item.icon" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="sidebar-foot">
        <div class="user-chip">
          <div class="user-info">
            <span class="user-name">{{ currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin' }}</span>
            <span class="user-role">{{ currentUser?.role }}</span>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" @click="handleLogout">Logout</button>
        </div>

        <button
          type="button"
          class="btn btn-outline btn-sm reset-btn"
          @click="openResetModal"
          style="width: 100%"
        >
          <AppIcon name="info" />
          Reset demo data
        </button>

        <AppModal v-model:open="resetModalOpen" title="Reset demo data?" subtitle="This restores all seeded services, staff, and records. Cannot be undone.">
          <p class="muted" style="margin-bottom: 16px">Are you sure you want to reset everything?</p>
          <template #footer>
            <button type="button" class="btn btn-ghost" @click="resetModalOpen = false">Cancel</button>
            <button type="button" class="btn btn-danger" @click="resetAndClose">Reset</button>
          </template>
        </AppModal>
      </div>
    </aside>

    <div class="admin-main" @click="sidebarOpen = false">
      <header class="admin-topbar">
        <button type="button" class="sidebar-toggle" aria-label="Toggle sidebar" @click="sidebarOpen = !sidebarOpen">
          <AppIcon name="chevron-left" />
        </button>
        <div class="topbar-title">
          <h1><slot name="title" /></h1>
        </div>
        <div class="topbar-actions">
          <button type="button" class="btn btn-ghost btn-sm" @click="handleLogout">
            <AppIcon name="lock" style="margin-right: 6px" />
            Logout
          </button>
        </div>
      </header>

      <main class="admin-content">
        <slot />
      </main>
    </div>
  </div>
</template>