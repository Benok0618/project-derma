<script setup lang="ts">
import { computed } from 'vue'
import { useBooking } from '~/composables/useBooking'
import { longDate } from '~/utils/calendar'
import { formatDuration, formatPeso, formatTime } from '~/utils/format'

const { state, fullName, selectedServices, subtotal, downpayment, remaining, reset } = useBooking()

function bookAnother() {
  reset()
  navigateTo('/book')
}

const confirmedBooking = computed(() => {
  const store = useStore()
  return store.state.value.confirmedBooking
})
</script>

<template>
  <div class="success">
    <ConfettiBurst />

    <div class="success-badge">
      <svg viewBox="0 0 52 52" aria-hidden="true">
        <circle cx="26" cy="26" r="24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" />
        <path
          class="success-check"
          d="M15 27l8 8 15-17"
          fill="none"
          stroke="#fff"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>

    <h2>Your appointment is confirmed</h2>
    <p class="lede center" style="margin: 10px auto 0">
      Thank you, {{ fullName }}. We have set aside your slot
      <strong v-if="confirmedBooking">{{ formatTime(confirmedBooking.time) }}</strong>
      on <strong v-if="confirmedBooking">{{ longDate(confirmedBooking.date) }}</strong>.
    </p>

    <p class="center muted" style="margin-top: 6px; font-size: 0.95rem">
      Your reference: <strong v-if="confirmedBooking">{{ confirmedBooking.reference }}</strong>
    </p>

    <div class="success-summary">
      <section class="review-card">
        <div class="review-card-head"><h3>Patient details</h3></div>
        <dl class="review-rows">
          <div class="review-row"><dt>Name</dt><dd>{{ fullName }}</dd></div>
          <div class="review-row"><dt>Mobile</dt><dd>{{ state.patient.mobile }}</dd></div>
          <div class="review-row"><dt>Email</dt><dd>{{ state.patient.email }}</dd></div>
          <div v-if="state.guests.length" class="review-row">
            <dt>Guests</dt>
            <dd>{{ state.guests.map(g => `${g.firstName} ${g.lastName}`.trim()).filter(Boolean).join(', ') }}</dd>
          </div>
        </dl>
      </section>

      <section class="review-card">
        <div class="review-card-head"><h3>Services</h3></div>
        <dl class="review-rows">
          <div class="review-row" v-for="svc in selectedServices" :key="svc.id">
            <dt>{{ svc.name }}</dt>
            <dd>{{ formatDuration(svc.durationMinutes) }} · {{ formatPeso(svc.price) }}</dd>
          </div>
          <div class="review-row total"><dt>Total duration</dt><dd>{{ formatDuration(selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0)) }}</dd></div>
        </dl>
      </section>

      <section class="review-card">
        <div class="review-card-head"><h3>Payment summary</h3></div>
        <dl class="review-rows">
          <div class="review-row"><dt>Services subtotal</dt><dd>{{ formatPeso(subtotal) }}</dd></div>
          <div class="review-row"><dt>Downpayment paid</dt><dd>{{ formatPeso(downpayment) }}</dd></div>
          <div class="review-row"><dt>Remaining balance</dt><dd>{{ formatPeso(remaining) }}</dd></div>
        </dl>
      </section>
    </div>

    <div class="success-actions">
      <button type="button" class="btn btn-primary" @click="bookAnother">Book another appointment</button>
      <NuxtLink to="/" class="btn btn-ghost">Back to home</NuxtLink>
    </div>
  </div>
</template>