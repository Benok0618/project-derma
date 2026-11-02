<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useHead } from '#imports'
import { useAuth } from '~/composables/useAuth'
import { useHr } from '~/composables/useHr'
import { useStore } from '~/composables/useStore'
import { useToast } from '~/composables/useToast'
import { greeting, formatClock, formatHours, formatLongDateLabel, isoDate } from '~/utils/datetime'
import { distanceMeters, formatHhmm, hoursOf, isWorkingDate, lateMinutesOf } from '~/utils/hr'

definePageMeta({ layout: 'staff', middleware: 'auth' })
useHead({ title: 'Clock In — Lumi Derma Staff' })

const store = useStore()
const { currentUser } = useAuth()
const { success, error: errorToast } = useToast()
const { settings, holidays, recordOf, statusOf, holidayOn } = useHr()

const today = isoDate()
const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | undefined

const me = computed(() => currentUser.value)
const clockDisplay = computed(() =>
  now.value.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }),
)

onMounted(() => {
  timer = setInterval(() => (now.value = new Date()), 1000)
  if (settings.value.requireLocation) void locate()
})
onBeforeUnmount(() => clearInterval(timer))

const record = computed(() => (me.value ? recordOf(me.value.id, today) : null))
const status = computed(() => (me.value ? statusOf(me.value.id, today) : 'Absent'))
const lateMins = computed(() => lateMinutesOf(record.value, settings.value))
const holiday = computed(() => holidayOn(today))
const dayOff = computed(() => !isWorkingDate(today, settings.value, holidays.value))
const isClockedIn = computed(() => Boolean(record.value?.timeIn))
const isClockedOut = computed(() => Boolean(record.value?.timeOut))
const hoursToday = computed(() => hoursOf(record.value))

const selfie = ref<string | null>(null)
const cameraFailed = ref(false)
const locating = ref(false)
const locationState = ref<'idle' | 'verified' | 'outside' | 'denied' | 'unavailable'>('idle')

function locate(): Promise<void> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      locationState.value = 'unavailable'
      resolve()
      return
    }
    locating.value = true
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const distance = distanceMeters(
          position.coords.latitude,
          position.coords.longitude,
          settings.value.latitude,
          settings.value.longitude,
        )
        locationState.value = distance <= settings.value.radiusMeters ? 'verified' : 'outside'
        locating.value = false
        resolve()
      },
      () => {
        locationState.value = 'denied'
        locating.value = false
        resolve()
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    )
  })
}

const selfieSource = computed(() => selfie.value ?? record.value?.selfie ?? null)

const selfieFlag = computed(() => {
  if (!settings.value.requireSelfie) return null
  if (selfieSource.value) return { kind: 'ok', label: 'Selfie captured', src: selfieSource.value }
  return { kind: 'warn', label: 'No selfie' }
})

const locationFlag = computed(() => {
  if (!settings.value.requireLocation) return null
  if (locationState.value === 'idle' && record.value?.locationVerified === true)
    return { kind: 'ok', label: 'Location verified' }
  if (locating.value || locationState.value === 'idle')
    return { kind: 'pending', label: 'Checking location…' }
  if (locationState.value === 'verified') return { kind: 'ok', label: 'Location verified' }
  if (locationState.value === 'outside')
    return { kind: 'warn', label: 'Outside the clinic radius — location not verified' }
  return { kind: 'warn', label: 'Location not verified' }
})

const actionLabel = computed(() => {
  if (isClockedOut.value) return 'Shift completed'
  return isClockedIn.value ? 'Time Out' : 'Time In'
})

const disabled = computed(() => isClockedOut.value || !me.value)

async function toggleClock() {
  if (!me.value || disabled.value) return
  if (settings.value.requireSelfie && !selfieSource.value && !cameraFailed.value) {
    errorToast('Selfies are required by HR — take a selfie first.')
    return
  }
  if (settings.value.requireLocation && locationState.value === 'idle') await locate()

  const meta = {
    selfie: selfieSource.value,
    locationVerified: settings.value.requireLocation
      ? locationState.value === 'verified'
      : null,
  }

  if (!isClockedIn.value) {
    store.clockIn(me.value.id, today, meta)
    success(`Clocked in at ${formatClock(record.value?.timeIn ?? new Date().toISOString())}.`)
    return
  }
  store.clockOut(me.value.id, today, meta)
  success(`Clocked out at ${formatClock(record.value?.timeOut ?? new Date().toISOString())}.`)
}
</script>

<template>
  <div class="staff-page clock-page">
    <section class="clock-wrap glass v-reveal is-visible" aria-label="Clock in and out">
      <div class="clock-header">
        <div>
          <p class="clock-greet">{{ greeting(now) }}, {{ me?.firstName || 'there' }}</p>
          <p class="clock-date">{{ formatLongDateLabel(today) }}</p>
        </div>
        <span class="status-badge" :class="`is-${status.toLowerCase().replace(/ /g, '-')}`">
          {{ status }}
        </span>
      </div>

      <p class="clock-time" aria-label="Current time">{{ clockDisplay }}</p>

      <div v-if="dayOff" class="clock-note is-day-off">
        <AppIcon name="info" />
        {{ holiday ? holiday.name : 'Company day off' }} — clock in only if HR asked you to work.
      </div>

      <div class="clock-status" :class="`status-${isClockedOut ? 'done' : isClockedIn ? 'in' : 'not-in'}`">
        <template v-if="isClockedOut">
          <p class="clock-status-main">
            Clocked out at <strong>{{ formatClock(record?.timeOut) }}</strong>
          </p>
          <p class="clock-status-sub">
            Total today: {{ formatHours(hoursToday) }} · In at {{ formatClock(record?.timeIn) }}
          </p>
        </template>
        <template v-else-if="isClockedIn">
          <p class="clock-status-main">
            Clocked in at <strong>{{ formatClock(record?.timeIn) }}</strong>
          </p>
          <p class="clock-status-sub">
            <template v-if="lateMins > 0">{{ lateMins }} minutes late vs the {{ formatHhmm(settings.shiftStart) }} shift</template>
            <template v-else>On time for the {{ formatHhmm(settings.shiftStart) }} shift</template>
          </p>
        </template>
        <template v-else>
          <p class="clock-status-main">You haven't clocked in yet</p>
          <p class="clock-status-sub">Shift starts {{ formatHhmm(settings.shiftStart) }} · grace {{ settings.graceMinutes }} min</p>
        </template>
      </div>

      <div v-if="selfieFlag || locationFlag" class="clock-flags" aria-label="Verification status">
        <div v-if="selfieFlag" class="clock-flag" :class="`is-${selfieFlag.kind}`">
          <img v-if="selfieFlag.src" class="flag-thumb" :src="selfieFlag.src" alt="" />
          <span>{{ selfieFlag.label }}</span>
        </div>
        <div v-if="locationFlag" class="clock-flag" :class="`is-${locationFlag.kind}`">
          <AppIcon :name="locationFlag.kind === 'ok' ? 'pin' : 'info'" />
          <span>{{ locationFlag.label }}</span>
        </div>
        <button
          v-if="settings.requireLocation && locationState !== 'idle' && locationState !== 'verified'"
          type="button"
          class="btn btn-ghost btn-sm"
          @click="locate"
        >
          Re-check location
        </button>
      </div>

      <button
        type="button"
        class="clock-btn"
        :disabled="disabled"
        :aria-label="actionLabel"
        @click="toggleClock"
      >
        <span class="clock-btn-ring" aria-hidden="true" />
        <AppIcon name="clock" />
        <span>{{ actionLabel }}</span>
      </button>
      <p v-if="!isClockedIn" class="clock-note">One record per day — clock out when your shift ends.</p>

      <div v-if="settings.requireSelfie && !isClockedOut" class="clock-selfie">
        <SelfieCapture
          v-model="selfie"
          label="Selfie verification (required by HR)"
          @failed="cameraFailed = true"
        />
      </div>
    </section>

    <section class="glass quick-card v-reveal is-visible" aria-label="Today at a glance">
      <h2 class="section-title">Today at a glance</h2>
      <dl class="quick-list">
        <div>
          <dt>Status</dt>
          <dd><StatusBadge :status="status" /></dd>
        </div>
        <div>
          <dt>Time in</dt>
          <dd>{{ formatClock(record?.timeIn) }}</dd>
        </div>
        <div>
          <dt>Time out</dt>
          <dd>{{ formatClock(record?.timeOut) }}</dd>
        </div>
        <div>
          <dt>Hours worked</dt>
          <dd>{{ formatHours(hoursToday) }}</dd>
        </div>
        <div>
          <dt>Late minutes</dt>
          <dd>{{ lateMins }}</dd>
        </div>
        <div>
          <dt>Shift</dt>
          <dd>{{ settings.shiftStart }} – {{ settings.shiftEnd }}</dd>
        </div>
      </dl>
      <NuxtLink to="/staff/records" class="btn btn-soft btn-sm">
        View my records
        <AppIcon name="arrow-right" />
      </NuxtLink>
    </section>
  </div>
</template>
