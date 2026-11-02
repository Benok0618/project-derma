<script setup lang="ts">
import { computed } from 'vue'
import { bookingSteps } from '~/data/clinic'
import { useBooking } from '~/composables/useBooking'
import { longDate } from '~/utils/calendar'
import { formatDuration, formatPeso, formatTime } from '~/utils/format'

const emit = defineEmits<{ edit: [step: number] }>()

const { state, fullName, selectedServices, subtotal, totalDuration } = useBooking()

const guestNames = computed(() =>
  state.value.guests.map((guest) => `${guest.firstName} ${guest.lastName}`.trim()).filter(Boolean),
)
</script>

<template>
  <div>
    <h2 class="step-title">Review your booking</h2>
    <p class="step-sub">Check the details below. Use Edit to change anything before you pay.</p>

    <div class="review-grid">
      <section class="review-card">
        <div class="review-card-head">
          <h3>Patient details</h3>
          <button type="button" class="edit-link" @click="emit('edit', 0)">Edit</button>
        </div>
        <dl class="review-rows">
          <div class="review-row">
            <dt>Name</dt>
            <dd>{{ fullName }}</dd>
          </div>
          <div class="review-row">
            <dt>Mobile</dt>
            <dd>{{ state.patient.mobile }}</dd>
          </div>
          <div class="review-row">
            <dt>Email</dt>
            <dd>{{ state.patient.email }}</dd>
          </div>
          <div v-if="guestNames.length" class="review-row">
            <dt>{{ guestNames.length === 1 ? 'Guest' : 'Guests' }}</dt>
            <dd>{{ guestNames.join(', ') }}</dd>
          </div>
        </dl>
      </section>

      <section class="review-card">
        <div class="review-card-head">
          <h3>Services</h3>
          <button type="button" class="edit-link" @click="emit('edit', 1)">Edit</button>
        </div>
        <dl class="review-rows">
          <div v-for="service in selectedServices" :key="service.id" class="review-row">
            <dt>{{ service.name }} · {{ formatDuration(service.durationMinutes) }}</dt>
            <dd>{{ formatPeso(service.price) }}</dd>
          </div>
        </dl>
        <p class="field-hint" style="margin-top: 12px">
          Estimated chair time: {{ formatDuration(totalDuration) }}
        </p>
      </section>

      <section class="review-card">
        <div class="review-card-head">
          <h3>Schedule</h3>
          <button type="button" class="edit-link" @click="emit('edit', 2)">Edit</button>
        </div>
        <dl class="review-rows">
          <div class="review-row">
            <dt>Date</dt>
            <dd>{{ state.date ? longDate(state.date) : 'Not set' }}</dd>
          </div>
          <div class="review-row">
            <dt>Time</dt>
            <dd>{{ state.time ? formatTime(state.time) : 'Not set' }}</dd>
          </div>
        </dl>
      </section>

      <div class="review-total">
        <span>Total</span>
        <AnimatedNumber :value="subtotal" class="amount" prefix="₱" :decimals="2" />
      </div>
    </div>
  </div>
</template>
