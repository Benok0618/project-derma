<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useHead } from '#imports'
import { useHr } from '~/composables/useHr'
import { useStore } from '~/composables/useStore'
import { useToast } from '~/composables/useToast'
import { formatHhmm, hhmmToMinutes } from '~/utils/hr'

definePageMeta({ layout: 'hr', middleware: 'auth' })
useHead({ title: 'Settings — Lumi Derma HR' })

const store = useStore()
const { success, error: errorToast } = useToast()
const { settings } = useHr()

const DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
]

const locating = ref(false)
const locationNote = ref('')

const form = reactive({
  shiftStart: settings.value.shiftStart,
  shiftEnd: settings.value.shiftEnd,
  graceMinutes: settings.value.graceMinutes,
  requiredHours: settings.value.requiredHours,
  workingDays: [...settings.value.workingDays],
  requireSelfie: settings.value.requireSelfie,
  requireLocation: settings.value.requireLocation,
  latitude: settings.value.latitude,
  longitude: settings.value.longitude,
  radiusMeters: settings.value.radiusMeters,
})

const errors = ref<Record<string, string>>({})

const shiftLength = computed(() => {
  const minutes = hhmmToMinutes(form.shiftEnd) - hhmmToMinutes(form.shiftStart)
  if (minutes <= 0) return null
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return `${hours}h ${String(rest).padStart(2, '0')}m`
})

function toggleDay(day: number) {
  form.workingDays = form.workingDays.includes(day)
    ? form.workingDays.filter((value) => value !== day)
    : [...form.workingDays, day].sort()
}

function useMyLocation() {
  locationNote.value = ''
  if (!navigator.geolocation) {
    locationNote.value = 'Geolocation is not available in this browser.'
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      form.latitude = Number(position.coords.latitude.toFixed(6))
      form.longitude = Number(position.coords.longitude.toFixed(6))
      locating.value = false
      locationNote.value = `Pinned your current spot (±${Math.round(position.coords.accuracy)} m).`
    },
    () => {
      locating.value = false
      locationNote.value = 'Location permission was denied — enter the coordinates manually.'
    },
    { enableHighAccuracy: true, timeout: 10000 },
  )
}

function save() {
  const issues: Record<string, string> = {}
  if (!form.shiftStart || !form.shiftEnd) issues.shift = 'Shift start and end are required.'
  else if (hhmmToMinutes(form.shiftEnd) <= hhmmToMinutes(form.shiftStart))
    issues.shift = 'Shift end must be after shift start.'
  if (form.graceMinutes < 0) issues.grace = 'Grace cannot be negative.'
  if (form.requiredHours <= 0) issues.hours = 'Required hours must be positive.'
  if (!form.workingDays.length) issues.days = 'Pick at least one working day.'
  if (form.latitude < -90 || form.latitude > 90) issues.lat = 'Latitude must be between −90 and 90.'
  if (form.longitude < -180 || form.longitude > 180)
    issues.lng = 'Longitude must be between −180 and 180.'
  if (form.radiusMeters <= 0) issues.radius = 'Radius must be greater than zero.'
  errors.value = issues
  if (Object.keys(issues).length) {
    errorToast('Fix the highlighted fields.')
    return
  }

  store.saveSettings({
    shiftStart: form.shiftStart,
    shiftEnd: form.shiftEnd,
    graceMinutes: Number(form.graceMinutes),
    requiredHours: Number(form.requiredHours),
    workingDays: [...form.workingDays],
    requireSelfie: form.requireSelfie,
    requireLocation: form.requireLocation,
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    radiusMeters: Number(form.radiusMeters),
  })
  success('Settings saved — statuses, leave day counts and clock checks now use them.')
}
</script>

<template>
  <div class="hr-page settings-page">
    <header class="page-head v-reveal is-visible">
      <div>
        <h1>Settings</h1>
        <p class="lede">Shift rules drive lateness, absences, leave day counts and DTR remarks.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="save">
        <AppIcon name="check" />
        Save settings
      </button>
    </header>

    <div class="settings-grid">
      <section class="glass panel v-reveal is-visible" aria-labelledby="set-shift">
        <h2 id="set-shift" class="section-title">Shift &amp; hours</h2>
        <div class="field-grid-2">
          <div class="field" :class="{ 'has-error': errors.shift }">
            <label for="set-start">Shift start</label>
            <input id="set-start" v-model="form.shiftStart" type="time" />
          </div>
          <div class="field" :class="{ 'has-error': errors.shift }">
            <label for="set-end">Shift end</label>
            <input id="set-end" v-model="form.shiftEnd" type="time" />
          </div>
          <p v-if="errors.shift" class="field-error span-2">{{ errors.shift }}</p>

          <div class="field" :class="{ 'has-error': errors.grace }">
            <label for="set-grace">Grace period (minutes)</label>
            <input id="set-grace" v-model.number="form.graceMinutes" type="number" min="0" max="60" />
            <p class="hint">Arrivals within the grace period count as On Time.</p>
            <p v-if="errors.grace" class="field-error">{{ errors.grace }}</p>
          </div>
          <div class="field" :class="{ 'has-error': errors.hours }">
            <label for="set-hours">Required hours per day</label>
            <input id="set-hours" v-model.number="form.requiredHours" type="number" min="1" max="12" step="0.5" />
            <p class="hint">Shown as the official hours on printed DTRs.</p>
            <p v-if="errors.hours" class="field-error">{{ errors.hours }}</p>
          </div>
        </div>

        <div class="shift-summary" aria-live="polite">
          Current shift: <strong>{{ formatHhmm(form.shiftStart) }} – {{ formatHhmm(form.shiftEnd) }}</strong>
          <template v-if="shiftLength"> · {{ shiftLength }} long · late after {{ formatHhmm(form.shiftStart) }} + {{ form.graceMinutes }} min</template>
        </div>
      </section>

      <section class="glass panel v-reveal is-visible" aria-labelledby="set-days">
        <h2 id="set-days" class="section-title">Working days</h2>
        <p class="hint">Non-working days and holidays never count as absences.</p>
        <div class="day-grid" role="group" aria-label="Working days">
          <label
            v-for="day in DAYS"
            :key="day.value"
            class="day-chip"
            :class="{ 'is-active': form.workingDays.includes(day.value) }"
          >
            <input
              type="checkbox"
              class="visually-hidden"
              :checked="form.workingDays.includes(day.value)"
              @change="toggleDay(day.value)"
            />
            {{ day.label }}
          </label>
        </div>
        <p v-if="errors.days" class="field-error">{{ errors.days }}</p>
        <p class="muted">
          Currently {{ form.workingDays.length }} day{{ form.workingDays.length === 1 ? '' : 's' }} a week —
          {{ form.workingDays.map((value) => DAYS[value]?.label).join(', ') || 'none' }}
        </p>
      </section>

      <section class="glass panel v-reveal is-visible" aria-labelledby="set-verify">
        <h2 id="set-verify" class="section-title">Clock verification</h2>
        <p class="hint">
          Employees can always clock in — if a selfie or location is missing, the record is flagged
          instead.
        </p>
        <label class="check-line">
          <input v-model="form.requireSelfie" type="checkbox" />
          <span>Require a selfie at clock in</span>
        </label>
        <label class="check-line">
          <input v-model="form.requireLocation" type="checkbox" />
          <span>Check location against the clinic</span>
        </label>
      </section>

      <section class="glass panel v-reveal is-visible" aria-labelledby="set-geo">
        <h2 id="set-geo" class="section-title">Clinic location</h2>
        <div class="field-grid-2">
          <div class="field" :class="{ 'has-error': errors.lat }">
            <label for="set-lat">Latitude</label>
            <input id="set-lat" v-model.number="form.latitude" type="number" step="0.000001" />
            <p v-if="errors.lat" class="field-error">{{ errors.lat }}</p>
          </div>
          <div class="field" :class="{ 'has-error': errors.lng }">
            <label for="set-lng">Longitude</label>
            <input id="set-lng" v-model.number="form.longitude" type="number" step="0.000001" />
            <p v-if="errors.lng" class="field-error">{{ errors.lng }}</p>
          </div>
          <div class="field span-2" :class="{ 'has-error': errors.radius }">
            <label for="set-radius">Allowed radius (meters)</label>
            <input id="set-radius" v-model.number="form.radiusMeters" type="number" min="10" step="10" />
            <p v-if="errors.radius" class="field-error">{{ errors.radius }}</p>
          </div>
        </div>

        <div class="geo-actions">
          <button type="button" class="btn btn-soft" :disabled="locating" @click="useMyLocation">
            <AppIcon name="pin" />
            {{ locating ? 'Locating…' : 'Use my current location' }}
          </button>
          <p v-if="locationNote" class="muted" aria-live="polite">{{ locationNote }}</p>
        </div>
        <p class="muted">
          Clock-ins further than {{ form.radiusMeters }} m from the clinic are flagged “Location not
          verified”.
        </p>
      </section>
    </div>
  </div>
</template>
