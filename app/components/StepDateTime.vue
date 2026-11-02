<script setup lang="ts">
import { useBooking } from '~/composables/useBooking'

const { state, setDate, setTime } = useBooking()
</script>

<template>
  <div>
    <h2 class="step-title">Pick a date and time</h2>
    <p class="step-sub">
      We are open Monday to Saturday, 9:00 AM to 5:00 PM, with a lunch break at noon. Sundays and
      a few training days each month are closed.
    </p>

    <BookingCalendar
      :date="state.date"
      :time="state.time"
      @select-date="setDate"
      @select-time="setTime"
    />

    <p v-if="state.date && !state.time" class="field-hint" style="margin-top: 16px">
      Almost there — choose a time slot to continue.
    </p>
  </div>
</template>