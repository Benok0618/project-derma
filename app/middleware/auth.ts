import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware((to) => {
  const path = to.path
  const needsAuth = path.startsWith('/hr') || path.startsWith('/staff') || path.startsWith('/admin')
  if (!needsAuth) return

  const { currentUser, isHrAdmin, homeFor } = useAuth()

  if (!currentUser.value) {
    return navigateTo('/login')
  }

  if (path.startsWith('/hr') && !isHrAdmin.value) {
    return navigateTo('/staff')
  }

  if (path.startsWith('/admin') && !isHrAdmin.value) {
    return navigateTo(homeFor(currentUser.value))
  }
})
