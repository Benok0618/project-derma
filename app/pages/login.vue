<script setup lang="ts">
import { ref } from 'vue'
import { navigateTo, useHead, useRouter } from '#imports'
import { useAuth } from '~/composables/useAuth'
import { useToast } from '~/composables/useToast'
import { demoAccounts, demoPassword } from '~/data/seed'

useHead({ title: 'Sign in — Lumi Derma HR' })

const { login, homeFor, isLoggedIn } = useAuth()
const { success } = useToast()
const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const fieldErrors = ref<{ email?: string; password?: string }>({})
const shakeKey = ref(0)

function validate(): boolean {
  const issues: { email?: string; password?: string } = {}
  const value = email.value.trim()
  if (!value) issues.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) issues.email = 'Enter a valid email address.'
  if (!password.value) issues.password = 'Password is required.'
  else if (password.value.length < 6) issues.password = 'Password must be at least 6 characters.'
  fieldErrors.value = issues
  return Object.keys(issues).length === 0
}

async function handleSubmit() {
  error.value = ''
  if (!validate()) {
    shakeKey.value += 1
    return
  }
  loading.value = true
  const result = login(email.value, password.value)
  loading.value = false
  if (result.ok) {
    success('Signed in. Welcome back!')
    await router.push(homeFor())
    return
  }
  error.value = result.error || 'Login failed.'
  shakeKey.value += 1
}

function fillDemo(account: { email: string; password: string }) {
  email.value = account.email
  password.value = account.password
  fieldErrors.value = {}
  error.value = ''
}

if (isLoggedIn.value) {
  navigateTo(homeFor())
}
</script>

<template>
  <div class="login-wrap">
    <div class="login-card glass">
      <div class="login-head">
        <NuxtLink to="/" class="brand" aria-label="Lumi Derma Studio, home">
          <BrandMark />
          <span class="brand-name">Lumi <em>Derma</em></span>
        </NuxtLink>
        <h1>Staff sign in</h1>
        <p class="lede">HR Admins land on the HR portal, employees on their portal.</p>
      </div>

      <form class="login-form" novalidate @submit.prevent="handleSubmit">
        <div
          :key="shakeKey"
          class="login-alerts"
          :class="{ 'is-shaking': shakeKey > 0 && (error || Object.keys(fieldErrors).length) }"
        >
          <p v-if="error" class="field-error" role="alert">{{ error }}</p>
        </div>

        <div class="field" :class="{ 'has-error': fieldErrors.email }">
          <label for="login-email">Email</label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            placeholder="you@lumiderma.example"
            :disabled="loading"
            :aria-invalid="Boolean(fieldErrors.email)"
            :aria-describedby="fieldErrors.email ? 'login-email-error' : undefined"
            @input="fieldErrors.email = ''"
          />
          <p v-if="fieldErrors.email" id="login-email-error" class="field-error">
            {{ fieldErrors.email }}
          </p>
        </div>

        <div class="field" :class="{ 'has-error': fieldErrors.password }">
          <label for="login-password">Password</label>
          <div class="password-field">
            <input
              id="login-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              required
              placeholder="••••••••"
              :disabled="loading"
              :aria-invalid="Boolean(fieldErrors.password)"
              :aria-describedby="fieldErrors.password ? 'login-password-error' : undefined"
              @input="fieldErrors.password = ''"
            />
            <button
              type="button"
              class="icon-btn password-toggle"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            >
              <AppIcon :name="showPassword ? 'eye-off' : 'eye'" />
            </button>
          </div>
          <p v-if="fieldErrors.password" id="login-password-error" class="field-error">
            {{ fieldErrors.password }}
          </p>
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%" :disabled="loading">
          <span v-if="loading">Signing in…</span>
          <span v-else>Sign in</span>
        </button>
      </form>

      <div class="demo-creds">
        <p class="demo-title">Demo accounts</p>
        <div class="demo-list">
          <button
            v-for="account in demoAccounts"
            :key="account.email"
            type="button"
            class="demo-item"
            :aria-label="`Use ${account.role} demo account ${account.email}`"
            @click="fillDemo(account)"
          >
            <span class="demo-role">{{ account.role }}</span>
            <span class="demo-email">{{ account.email }}</span>
            <kbd class="demo-pass">{{ demoPassword }}</kbd>
          </button>
        </div>
        <p class="demo-note">
          <AppIcon name="info" />
          Authentication is simulated for this demo — no data leaves your browser.
        </p>
      </div>
    </div>
  </div>
</template>
