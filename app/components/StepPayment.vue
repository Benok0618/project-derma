<script setup lang="ts">
import { computed } from 'vue'
import { paymentMethods } from '~/data/clinic'
import { useBooking } from '~/composables/useBooking'
import { formatPeso } from '~/utils/format'

const { processing, selectedServices, subtotal, downpayment, remaining, state, setPaymentMethod, submitPayment } =
  useBooking()

const methodIcons: Record<string, string> = {
  gcash: 'wallet',
  maya: 'phone',
  card: 'card',
}

const downpaymentPct = computed(() =>
  subtotal.value ? Math.round((downpayment.value / subtotal.value) * 100) : 0,
)
</script>

<template>
  <div>
    <h2 class="step-title">Downpayment</h2>
    <p class="step-sub">To confirm your booking, please pay the downpayment.</p>

    <div class="demo-note" role="note">
      <AppIcon name="info" />
      <span>
        This is a demo prototype. No real payment is processed and no card or wallet details are
        collected. A real payment provider can be connected here later.
      </span>
    </div>

    <div class="payment-layout">
      <div>
        <p class="eyebrow">Payment method</p>
        <div class="payment-methods" role="radiogroup" aria-label="Payment method" style="margin-top: 12px">
          <button
            v-for="method in paymentMethods"
            :key="method.id"
            type="button"
            class="pay-option"
            role="radio"
            :aria-checked="state.paymentMethod === method.id"
            :class="{ 'is-active': state.paymentMethod === method.id }"
            @click="setPaymentMethod(method.id)"
          >
            <span class="pay-icon"><AppIcon :name="methodIcons[method.id] ?? 'card'" /></span>
            <span>
              <strong>{{ method.label }}</strong>
              <small>{{ method.hint }}</small>
            </span>
            <span class="pay-radio" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div class="summary-card">
        <h3 style="font-size: 1.15rem">Payment summary</h3>
        <div class="summary-rows">
          <div class="summary-row">
            <span>{{ selectedServices.length }} {{ selectedServices.length === 1 ? 'service' : 'services' }} subtotal</span>
            <span>{{ formatPeso(subtotal) }}</span>
          </div>
          <div class="summary-row due">
            <span>Downpayment due now ({{ downpaymentPct }}%)</span>
            <AnimatedNumber :value="downpayment" prefix="₱" :decimals="2" />
          </div>
          <div class="summary-row">
            <span>Remaining balance at the clinic</span>
            <span>{{ formatPeso(remaining) }}</span>
          </div>
          <div class="summary-row is-strong">
            <span>Total</span>
            <span>{{ formatPeso(subtotal) }}</span>
          </div>
        </div>

        <button
          type="button"
          class="btn btn-primary btn-block"
          :disabled="processing"
          @click="submitPayment"
        >
          <span v-if="processing" class="spinner" aria-hidden="true" />
          {{ processing ? 'Processing…' : `Pay ${formatPeso(downpayment)}` }}
        </button>
        <p class="field-hint" style="text-align: center; margin-top: 12px">
          Minimum downpayment is ₱500.00 and never more than the total.
        </p>
      </div>
    </div>
  </div>
</template>
