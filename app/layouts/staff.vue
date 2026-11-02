<script setup lang="ts">
import { navigateTo, useRoute } from '#imports'
import { useAuth } from '~/composables/useAuth'
import { greeting } from '~/utils/datetime'

const { currentUser, logout } = useAuth()
const route = useRoute()

const navItems = [
  { path: '/staff', label: 'Clock In', icon: 'clock' },
  { path: '/staff/records', label: 'My Records', icon: 'calendar' },
  { path: '/staff/leaves', label: 'My Leaves', icon: 'leaf' },
  { path: '/staff/dtr', label: 'My DTR', icon: 'printer' },
]

async function handleLogout() {
  logout()
  await navigateTo('/login')
}
</script>

<template>
  <div class="staff-shell">
    <AppToasts />

    <header class="staff-topbar">
      <div class="topbar-brand">
        <NuxtLink to="/staff" class="brand" aria-label="Employee portal home">
          <BrandMark />
          <span class="brand-name">Lumi <em>Derma</em></span>
        </NuxtLink>
      </div>
      <div class="topbar-user">
        <div class="user-greeting">
          <span>{{ greeting(new Date()) }}, {{ currentUser?.firstName || 'Staff' }}</span>
          <span class="user-role">{{ currentUser?.jobTitle || currentUser?.role }}</span>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" @click="handleLogout">Logout</button>
      </div>
    </header>

    <nav class="staff-nav" aria-label="Employee portal sections">
      <NuxtLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="staff-nav-link"
        :class="{
          'is-active': item.path === '/staff' ? route.path === '/staff' : route.path.startsWith(item.path),
        }"
      >
        <AppIcon :name="item.icon" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <main class="staff-main">
      <slot />
    </main>
  </div>
</template>
