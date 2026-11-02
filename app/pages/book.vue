<script setup lang="ts">
import { computed, watch } from 'vue'
import { bookingSteps } from '~/data/clinic'
import { useBooking } from '~/composables/useBooking'
import { formatPeso } from '~/utils/format'
import StepDetails from '~/components/StepDetails.vue'
import StepServices from '~/components/StepServices.vue'
import StepDateTime from '~/components/StepDateTime.vue'
import StepReview from '~/components/StepReview.vue'
import StepPayment from '~/components/StepPayment.vue'

useHead({ title: 'Book an appointment — Lumi Derma Studio' })

const { state, confirmed, canProceed, next, back, goTo, selectedServices, subtotal } = useBooking()

const stepComponents = [StepDetails, StepServices, StepDateTime, StepReview, StepPayment]

const currentComponent = computed(() => stepComponents[state.value.step] ?? StepDetails)
const currentLabel = computed(() => bookingSteps[state.value.step]?.label ?? '')

watch(
  () => state.value.step,
  () => {
    if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
  },
)
</script>

<template>
  <div class="booking-wrap">
    <div class="container container-narrow">
      <div class="page-head" style="padding-bottom: 24px">
        <p class="eyebrow">Book appointment</p>
        <h1>Let’s get you booked</h1>
      </div>

      <div class="booking-panel reveal" v-reveal>
        <SuccessScreen v-if="confirmed" />

        <template v-else>
          <StepperNav :current="state.step" @navigate="goTo" />

          <p class="sr-only" aria-live="polite">Step {{ state.step + 1 }}: {{ currentLabel }}</p>

          <div class="step-body">
            <Transition name="step-fade" mode="out-in">
              <component :is="currentComponent" :key="state.step" />
            </Transition>
          </div>

          <div class="step-actions">
            <button v-if="state.step > 0" type="button" class="btn btn-ghost" @click="back">
              <AppIcon name="chevron-left" /> Back
            </button>
            <span v-else />
            <p v-if="state.step === 1 && selectedServices.length" class="step-actions-summary">
              {{ selectedServices.length }}
              {{ selectedServices.length === 1 ? 'service' : 'services' }},
              {{ formatPeso(subtotal) }}
            </p>
            <button
              v-if="state.step < 4"
              type="button"
              class="btn btn-primary"
              :disabled="!canProceed(state.step)"
              @click="next"
            >
              Next <AppIcon name="arrow-right" />
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
