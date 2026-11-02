import { computed } from 'vue'
import type { StaffAccount } from '~/types'
import { useStore } from '~/composables/useStore'

export function useAuth() {
  const store = useStore()

  const currentUser = computed<StaffAccount | null>(() => {
    const session = store.state.value.session
    if (!session) return null
    const account = store.staffById(session.staffId)
    if (!account || !account.active) return null
    return account
  })

  const isLoggedIn = computed(() => Boolean(currentUser.value))
  const isHrAdmin = computed(() => currentUser.value?.role === 'HR Admin')
  const role = computed(() => currentUser.value?.role ?? null)

  function homeFor(user?: StaffAccount | null): string {
    return (user ?? currentUser.value)?.role === 'HR Admin' ? '/hr' : '/staff'
  }

  function login(email: string, password: string): { ok: boolean; error?: string } {
    const value = email.trim().toLowerCase()
    const account = store.state.value.staff.find((member) => member.email.toLowerCase() === value)
    if (!account || account.password !== password) {
      return { ok: false, error: 'Those credentials do not match our records.' }
    }
    if (!account.active) {
      return { ok: false, error: 'This account has been deactivated. Ask HR to reactivate it.' }
    }
    store.state.value.session = { staffId: account.id, since: new Date().toISOString() }
    return { ok: true }
  }

  function logout(): void {
    store.state.value.session = null
  }

  return { currentUser, isLoggedIn, isHrAdmin, role, homeFor, login, logout }
}
