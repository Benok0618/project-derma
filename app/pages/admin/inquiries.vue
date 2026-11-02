<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

import { ref, computed, onMounted } from 'vue'
import { useHead } from '#imports'
import { useStore } from '~/composables/useStore'
import { useToast } from '~/composables/useToast'
import { relativeFrom, formatStamp } from '~/utils/datetime'

useHead({ title: 'Inquiries — Lumi Derma Admin' })

const store = useStore()
const { success } = useToast()

const search = ref('')
const statusFilter = ref('All')

const filteredInquiries = computed(() => {
  return store.state.value.inquiries.filter(inq => {
    const matchesSearch =
      !search.value ||
      [inq.fullName, inq.email, inq.subject, inq.message].some(field =>
        field.toLowerCase().includes(search.value.toLowerCase()),
      )
    const matchesStatus = statusFilter.value === 'All' || inq.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

const selectedInquiry = ref<typeof store.state.value.inquiries[0] | null>(null)
const replyText = ref('')
const quickReplies = [
  'Thank you for reaching out. We have received your inquiry and will get back to you shortly.',
  'We have checked availability and can offer you the requested time. Please confirm.',
  'Your appointment has been confirmed. You will receive a confirmation email shortly.',
  'We apologize for the inconvenience. Our team will look into this and contact you soon.',
]

function selectInquiry(inq: typeof store.state.value.inquiries[0]) {
  selectedInquiry.value = inq
  replyText.value = ''
}

function useQuickReply(text: string) {
  replyText.value = text
}

function sendReply() {
  if (!selectedInquiry.value || !replyText.value.trim()) return
  store.answerInquiry(selectedInquiry.value.id, replyText.value.trim(), store.currentUser.value?.firstName || 'Admin')
  success('Reply sent. Inquiry marked as Answered.')
  replyText.value = ''
  selectedInquiry.value = { ...selectedInquiry.value!, status: 'Answered', reply: { text: replyText.value.trim(), by: store.currentUser.value?.firstName || 'Admin', at: new Date().toISOString() } }
}

function closeDetail() {
  selectedInquiry.value = null
  replyText.value = ''
}
</script>

<template>
  <div>

    <div class="table-toolbar">
      <div class="toolbar-filters">
        <input
          v-model="search"
          type="search"
          placeholder="Search name, email, subject, message…"
          class="search-input"
          style="width: 300px"
        />
        <select v-model="statusFilter" class="filter-select">
          <option value="All">All statuses</option>
          <option value="New">New</option>
          <option value="Answered">Answered</option>
        </select>
      </div>
    </div>

    <div class="inquiries-layout">
      <div class="inquiries-list">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>From</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="inq in filteredInquiries"
                :key="inq.id"
                @click="selectInquiry(inq)"
                :class="{ 'is-selected': selectedInquiry?.id === inq.id }"
              >
                <td>
                  <div>{{ inq.fullName }}</div>
                  <div class="muted" style="font-size: 0.85rem">{{ inq.email }}</div>
                </td>
                <td>{{ inq.subject }}</td>
                <td><StatusBadge :status="inq.status" /></td>
                <td>{{ relativeFrom(inq.createdAt) }}</td>
              </tr>
              <tr v-if="!filteredInquiries.length">
                <td colspan="4" class="center muted">No inquiries match your filters.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="inquiry-detail" v-if="selectedInquiry">
        <div class="detail-head">
          <h3>{{ selectedInquiry.subject }}</h3>
          <button type="button" class="icon-btn" @click="closeDetail" aria-label="Close detail">
            <AppIcon name="x" />
          </button>
        </div>

        <dl class="detail-meta">
          <div><dt>From</dt><dd>{{ selectedInquiry.fullName }} <{{ selectedInquiry.email }}></dd></div>
          <div><dt>Mobile</dt><dd>{{ selectedInquiry.mobile }}</dd></div>
          <div><dt>Received</dt><dd>{{ formatStamp(selectedInquiry.createdAt) }}</dd></div>
          <div><dt>Status</dt><dd><StatusBadge :status="selectedInquiry.status" /></dd></div>
        </dl>

        <div class="detail-message">
          <h4>Message</h4>
          <p class="message-text">{{ selectedInquiry.message }}</p>
        </div>

        <div v-if="selectedInquiry.reply" class="detail-reply">
          <h4>Reply <span class="muted" style="font-weight: 400">by {{ selectedInquiry.reply.by }} · {{ relativeFrom(selectedInquiry.reply.at) }}</span></h4>
          <p class="reply-text">{{ selectedInquiry.reply.text }}</p>
        </div>

        <div v-else class="reply-form">
          <h4>Send a reply</h4>
          <p class="muted" style="margin-bottom: 12px; font-size: 0.9rem">
            <AppIcon name="info" style="width: 16px; height: 16px; display: inline-block; margin-right: 6px; vertical-align: middle" />
            No real email is sent in this demo. The reply is stored with the inquiry.
          </p>
          <div class="quick-replies">
            <button
              v-for="qr in quickReplies"
              :key="qr"
              type="button"
              class="quick-reply-btn"
              @click="useQuickReply(qr)"
            >
              {{ qr }}
            </button>
          </div>
          <textarea
            v-model="replyText"
            rows="4"
            class="reply-textarea"
            placeholder="Write your reply here…"
          />
          <div class="reply-actions">
            <button type="button" class="btn btn-ghost" @click="closeDetail">Cancel</button>
            <button type="button" class="btn btn-primary" :disabled="!replyText.trim()" @click="sendReply">
              <AppIcon name="arrow-right" style="margin-left: 6px" />
              Send Reply
            </button>
          </div>
        </div>
      </div>

      <div class="inquiry-empty" v-else>
        <AppIcon name="mail" style="width: 64px; height: 64px; color: var(--line-strong); margin-bottom: 16px" />
        <h3>Select an inquiry to view details</h3>
        <p class="muted">Click any row on the left to read the full message and send a reply.</p>
      </div>
    </div>
  </div>
</template>