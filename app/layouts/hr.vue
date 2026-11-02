<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { navigateTo, useRoute } from '#imports'
import { useAuth } from '~/composables/useAuth'
import { useStore } from '~/composables/useStore'
import { useToast } from '~/composables/useToast'

const route = useRoute()
const { currentUser, logout } = useAuth()
const store = useStore()
const { success } = useToast()

const sidebarOpen = ref(false)
const resetOpen = ref(false)

const titles: Record<string, string> = {
  '/hr': 'Overview',
  '/hr/employees': 'Employees',
  '/hr/attendance': 'Attendance',
  '/hr/leaves': 'Leaves',
  '/hr/dtr-print': 'DTR Printing',
  '/hr/holidays': 'Holidays',
  '/hr/reports': 'Reports',
  '/hr/settings': 'Settings',
}

const navItems = [
  { path: '/hr', label: 'Overview', icon: 'sparkle' },
  { path: '/hr/employees', label: 'Employees', icon: 'users' },
  { path: '/hr/attendance', label: 'Attendance', icon: 'clock' },
  { path: '/hr/leaves', label: 'Leaves', icon: 'leaf' },
  { path: '/hr/dtr-print', label: 'DTR Printing', icon: 'printer' },
  { path: '/hr/holidays', label: 'Holidays', icon: 'calendar' },
  { path: '/hr/reports', label: 'Reports', icon: 'chart' },
  { path: '/hr/settings', label: 'Settings', icon: 'shield' },
]

const title = computed(() => titles[route.path] ?? 'HR Console')

function closeSidebar() {
  sidebarOpen.value = false
}

function handleResize() {
  if (window.innerWidth >= 1024) sidebarOpen.value = false
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => window.removeEventListener('resize', handleResize))

async function handleLogout() {
  logout()
  await navigateTo('/login')
}

function resetDemo() {
  store.resetAll()
  success('Demo data has been reset to the seeded sample.')
  resetOpen.value = false
}
</script>

<template>
  <div class="admin-shell hr-shell">
    <AppToasts />

    <aside class="admin-sidebar" :class="{ 'is-open': sidebarOpen }" aria-label="HR navigation">
      <div class="sidebar-head">
        <NuxtLink to="/hr" class="brand">
          <BrandMark />
          <span class="brand-name">Lumi <em>Derma</em></span>
        </NuxtLink>
        <p class="sidebar-kicker">HR Console</p>
      </div>

      <nav class="admin-nav" aria-label="HR sections">
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ 'is-active': item.path === '/hr' ? route.path === '/hr' : route.path.startsWith(item.path) }"
          @click="closeSidebar"
        >
          <AppIcon :name="item.icon" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="sidebar-foot">
        <div class="user-chip">
          <div class="user-info">
            <span class="user-name">
              {{ currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'HR Admin' }}
            </span>
            <span class="user-role">{{ currentUser?.jobTitle || currentUser?.role }}</span>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" @click="handleLogout">Logout</button>
        </div>

        <button type="button" class="btn btn-outline btn-sm reset-btn" style="width: 100%" @click="resetOpen = true">
          <AppIcon name="info" />
          Reset demo data
        </button>

        <AppModal
          v-model:open="resetOpen"
          title="Reset demo data?"
          subtitle="Employees, records, leaves, holidays, settings and the audit log return to the seeded samples. Cannot be undone."
        >
          <p class="muted" style="margin-bottom: 16px">
            Everything you changed in this demo will be replaced with fresh sample data.
          </p>
          <template #footer>
            <button type="button" class="btn btn-ghost" @click="resetOpen = false">Cancel</button>
            <button type="button" class="btn btn-danger" @click="resetDemo">Reset everything</button>
          </template>
        </AppModal>
      </div>
    </aside>

    <div class="admin-main" @click="closeSidebar">
      <header class="admin-topbar">
        <button
          type="button"
          class="sidebar-toggle"
          aria-label="Toggle navigation"
          @click.stop="sidebarOpen = !sidebarOpen"
        >
          <AppIcon name="chevron-left" />
        </button>
        <div class="topbar-title">
          <h1>{{ title }}</h1>
        </div>
        <div class="topbar-actions">
          <span class="topbar-user">
            {{ currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '' }}
            <em>{{ currentUser?.role }}</em>
          </span>
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
