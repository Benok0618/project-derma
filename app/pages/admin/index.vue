<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

import { computed, ref } from 'vue'
import { useHead } from '#imports'
import { useStore } from '~/composables/useStore'
import type { TimeRecord } from '~/types'
import { formatClock, attendanceStatus, isLate, relativeFrom, isoDate, addDays, formatDateLabel, formatLongDateLabel } from '~/utils/datetime'
import { formatPeso } from '~/utils/format'
import { buildMonth, slotsForDate, weekdayLabels, isDateAvailable, monthLabel, bookedTimesFor, fullyBookedDates } from '~/utils/calendar'

useHead({ title: 'Overview — Lumi Derma Admin' })

const store = useStore()
const today = isoDate()

const clockedInToday = computed(() => store.state.value.timeRecords.filter(r => r.date === today && r.timeIn != null).length)
const lateToday = computed(() => store.state.value.timeRecords.filter(r => r.date === today && isLate(r as TimeRecord | null)).length)
const newInquiries = computed(() => store.state.value.inquiries.filter(i => i.status === 'New').length)
const activeServicesCount = computed(() => store.state.value.services.filter(s => s.active).length)

const todayAttendance = computed(() => {
  return store.activeStaff.value.map(member => {
    const record: TimeRecord | undefined = store.recordFor(member.id, today)
    const timeIn: string | null = record?.timeIn ?? null
    const timeOut: string | null = record?.timeOut ?? null
    return {
      member,
      record,
      status: attendanceStatus(record ?? null),
      timeIn: formatClock(timeIn),
      timeOut: formatClock(timeOut),
    }
  })
})

const latestInquiries = computed(() => store.state.value.inquiries.slice(0, 5))

// Sales computation
const now = new Date()
const currentMonth = now.getMonth()
const currentYear = now.getFullYear()
const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

function getMonthlySales(month: number, year: number) {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  const startIso = start.toISOString().split('T')[0]!
  const endIso = end.toISOString().split('T')[0]!
  
  return store.state.value.bookings
    .filter(b => b.date >= startIso && b.date <= endIso)
    .reduce((sum, b) => sum + b.subtotal, 0)
}

function getYearlySales(year: number) {
  const startIso = `${year}-01-01`
  const endIso = `${year}-12-31`
  return store.state.value.bookings
    .filter(b => b.date >= startIso && b.date <= endIso)
    .reduce((sum, b) => sum + b.subtotal, 0)
}

const thisMonthSales = computed(() => getMonthlySales(currentMonth, currentYear))
const lastMonthSales = computed(() => getMonthlySales(lastMonth, lastMonthYear))
const thisYearSales = computed(() => getYearlySales(currentYear))
const lastYearSales = computed(() => getYearlySales(currentYear - 1))

const monthGrowth = computed(() => {
  if (lastMonthSales.value === 0) return thisMonthSales.value > 0 ? 100 : 0
  return ((thisMonthSales.value - lastMonthSales.value) / lastMonthSales.value) * 100
})

const yearGrowth = computed(() => {
  if (lastYearSales.value === 0) return thisYearSales.value > 0 ? 100 : 0
  return ((thisYearSales.value - lastYearSales.value) / lastYearSales.value) * 100
})

// Calendar
const viewYear = ref(currentYear)
const viewMonth = ref(currentMonth)
const selectedDate = ref<string | null>(null)

const bookedSlots = computed(() => store.bookedSlots.value)
const fullDates = computed(() => fullyBookedDates(bookedSlots.value))

const selectedDateSlots = computed(() => {
  if (!selectedDate.value) return []
  return slotsForDate(selectedDate.value, bookedTimesFor(bookedSlots.value, selectedDate.value))
})

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value--
  } else {
    viewMonth.value--
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value++
  } else {
    viewMonth.value++
  }
}

function goToCurrentMonth() {
  viewYear.value = currentYear
  viewMonth.value = currentMonth
}

const calendarDays = computed(() => buildMonth(viewYear.value, viewMonth.value, new Date(), fullDates.value))

function selectDate(iso: string) {
  if (isDateAvailable(new Date(iso), new Date(), fullDates.value)) {
    selectedDate.value = iso
  }
}

function isSelected(iso: string) {
  return selectedDate.value === iso
}

function isToday(iso: string) {
  return iso === today
}

const pendingInquiries = computed(() => store.state.value.inquiries.filter(i => i.status === 'New').length)

// Recent bookings for reports
const recentBookings = computed(() => store.state.value.bookings.slice(0, 10))
const totalBookingsThisMonth = computed(() => 
  store.state.value.bookings.filter(b => {
    const bookingDate = new Date(b.date)
    return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear
  }).length
)
</script>

<template>
  <div>
    <!-- Stats Grid -->
    <div class="stat-grid">
      <StatCard
        label="Clocked in today"
        :value="clockedInToday"
        icon="users"
        tone="aqua"
        :hint="`of ${store.activeStaff.value.length} active staff`"
      />
      <StatCard
        label="Late today"
        :value="lateToday"
        icon="clock"
        tone="peach"
      />
      <StatCard
        label="New inquiries"
        :value="newInquiries"
        icon="mail"
        tone="lavender"
      />
      <StatCard
        label="Active services"
        :value="activeServicesCount"
        icon="face"
        tone="mint"
      />
      
      <StatCard
        label="This Month Sales"
        :value="formatPeso(thisMonthSales)"
        icon="currency"
        tone="aqua"
        :hint="`${monthGrowth >= 0 ? '▲' : '▼'} ${Math.abs(monthGrowth).toFixed(1)}% vs last month`"
        :hint-class="monthGrowth >= 0 ? 'positive' : 'negative'"
      />
      <StatCard
        label="This Year Sales"
        :value="formatPeso(thisYearSales)"
        icon="currency"
        tone="mint"
        :hint="`${yearGrowth >= 0 ? '▲' : '▼'} ${Math.abs(yearGrowth).toFixed(1)}% vs last year`"
        :hint-class="yearGrowth >= 0 ? 'positive' : 'negative'"
      />
      <StatCard
        label="Bookings this month"
        :value="totalBookingsThisMonth"
        icon="calendar"
        tone="blush"
      />
      <StatCard
        label="Pending inquiries"
        :value="pendingInquiries"
        icon="mail"
        tone="lavender"
      />
    </div>

    <!-- Main Content Grid -->
    <div class="dashboard-grid">
      
      <!-- Sales Comparison -->
      <div class="admin-section sales-comparison">
        <div class="section-head">
          <div>
            <p class="eyebrow">Revenue</p>
            <h2>Sales Comparison</h2>
          </div>
        </div>

        <div class="sales-cards">
          <div class="sales-card">
            <div class="sales-card-header">
              <span class="sales-period">This Month</span>
              <span class="sales-period-label">{{ monthLabel(currentYear, currentMonth) }}</span>
            </div>
            <div class="sales-amount">{{ formatPeso(thisMonthSales) }}</div>
            <div class="sales-growth" :class="monthGrowth >= 0 ? 'positive' : 'negative'">
              <AppIcon :name="monthGrowth >= 0 ? 'chevron-up' : 'chevron-down'" />
              {{ Math.abs(monthGrowth).toFixed(1) }}% vs {{ monthLabel(lastMonthYear, lastMonth) }}
            </div>
          </div>

          <div class="sales-card">
            <div class="sales-card-header">
              <span class="sales-period">Last Month</span>
              <span class="sales-period-label">{{ monthLabel(lastMonthYear, lastMonth) }}</span>
            </div>
            <div class="sales-amount">{{ formatPeso(lastMonthSales) }}</div>
            <div class="sales-growth muted">Previous period</div>
          </div>

          <div class="sales-card yearly">
            <div class="sales-card-header">
              <span class="sales-period">This Year</span>
              <span class="sales-period-label">{{ currentYear }}</span>
            </div>
            <div class="sales-amount">{{ formatPeso(thisYearSales) }}</div>
            <div class="sales-growth" :class="yearGrowth >= 0 ? 'positive' : 'negative'">
              <AppIcon :name="yearGrowth >= 0 ? 'chevron-up' : 'chevron-down'" />
              {{ Math.abs(yearGrowth).toFixed(1) }}% vs {{ currentYear - 1 }}
            </div>
          </div>

          <div class="sales-card yearly">
            <div class="sales-card-header">
              <span class="sales-period">Last Year</span>
              <span class="sales-period-label">{{ currentYear - 1 }}</span>
            </div>
            <div class="sales-amount">{{ formatPeso(lastYearSales) }}</div>
            <div class="sales-growth muted">Previous period</div>
          </div>
        </div>
      </div>

      <!-- Calendar & Available Slots -->
      <div class="admin-section calendar-section">
        <div class="section-head">
          <div>
            <p class="eyebrow">Schedule</p>
            <h2>Available Dates & Times</h2>
          </div>
          <div class="calendar-nav">
            <button type="button" class="btn btn-ghost btn-sm" @click="prevMonth">
              <AppIcon name="chevron-left" />
            </button>
            <span class="calendar-title">{{ monthLabel(viewYear, viewMonth) }}</span>
            <button type="button" class="btn btn-ghost btn-sm" @click="nextMonth">
              <AppIcon name="chevron-right" />
            </button>
            <button type="button" class="btn btn-ghost btn-sm" @click="goToCurrentMonth">
              This Month
            </button>
          </div>
        </div>

        <div class="calendar-layout">
          <div class="calendar">
            <div class="calendar-weekdays">
              <span v-for="day in weekdayLabels()" :key="day">{{ day }}</span>
            </div>
            <div class="calendar-grid">
              <div
                v-for="day in calendarDays"
                :key="day.iso"
                class="cal-day"
                :class="{
                  'is-outside': !day.inMonth,
                  'is-disabled': !day.available,
                  'is-selected': isSelected(day.iso),
                  'is-today': isToday(day.iso),
                }"
                @click="selectDate(day.iso)"
                :aria-label="day.inMonth ? `${day.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} - ${day.available ? 'Available' : 'Unavailable'}` : ''"
                :tabindex="day.inMonth && day.available ? 0 : -1"
                @keydown.enter="selectDate(day.iso)"
                @keydown.space.prevent="selectDate(day.iso)"
              >
                {{ day.day }}
              </div>
            </div>
            <div class="calendar-legend">
              <span><span class="legend-swatch" style="background: var(--grad-primary)"></span>Selected</span>
              <span><span class="legend-swatch" style="background: var(--aqua); opacity: 0.3"></span>Today</span>
              <span><span class="legend-swatch" style="background: var(--line)"></span>Unavailable</span>
            </div>
          </div>

          <div class="time-panel">
            <h3 v-if="selectedDate">
              <AppIcon name="clock" style="margin-right: 8px" />
              {{ formatLongDateLabel(selectedDate) }}
            </h3>
            <p v-else class="muted time-placeholder">
              <AppIcon name="info" style="margin-right: 8px" />
              Click a date to view available time slots
            </p>
            
            <div v-if="selectedDate" class="time-slots">
              <button
                v-for="slot in selectedDateSlots"
                :key="slot.time"
                type="button"
                class="time-slot"
                :class="{ 'is-selected': false, 'is-taken': slot.taken }"
                :disabled="slot.taken"
                :aria-label="slot.label + (slot.taken ? ' - Taken' : ' - Available')"
              >
                <span v-if="slot.taken" class="taken-badge">Taken</span>
                {{ slot.label }}
              </button>
            </div>
            
            <div v-if="selectedDate && selectedDateSlots.length === 0" class="time-placeholder">
              <AppIcon name="info" />
              No time slots available for this date
            </div>
          </div>
        </div>
      </div>

      <!-- Today's Attendance -->
      <div class="admin-section">
        <div class="section-head">
          <div>
            <p class="eyebrow">Attendance</p>
            <h2>Today's attendance</h2>
          </div>
          <NuxtLink to="/admin/time-records" class="btn btn-ghost btn-sm">View all</NuxtLink>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Role</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in todayAttendance" :key="item.member.id">
                <td>{{ item.member.firstName }} {{ item.member.lastName }}</td>
                <td><StatusBadge :status="item.member.role" /></td>
                <td>{{ item.timeIn }}</td>
                <td>{{ item.timeOut }}</td>
                <td><StatusBadge :status="item.status" /></td>
              </tr>
              <tr v-if="!todayAttendance.length">
                <td colspan="5" class="center muted">No active staff</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Latest Inquiries -->
      <div class="admin-section">
        <div class="section-head">
          <div>
            <p class="eyebrow">Inbox</p>
            <h2>Latest inquiries</h2>
          </div>
          <NuxtLink to="/admin/inquiries" class="btn btn-ghost btn-sm">View all</NuxtLink>
        </div>

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
              <tr v-for="inq in latestInquiries" :key="inq.id">
                <td>{{ inq.fullName }} <span class="muted" style="font-size: 0.85rem">{{ inq.email }}</span></td>
                <td>{{ inq.subject }}</td>
                <td><StatusBadge :status="inq.status" /></td>
                <td>{{ relativeFrom(inq.createdAt) }}</td>
              </tr>
              <tr v-if="!latestInquiries.length">
                <td colspan="4" class="center muted">No inquiries yet</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Reports Summary -->
      <div class="admin-section reports-section">
        <div class="section-head">
          <div>
            <p class="eyebrow">Reports</p>
            <h2>Recent Activity Summary</h2>
          </div>
        </div>

        <div class="reports-grid">
          <div class="report-card">
            <div class="report-icon aqua">
              <AppIcon name="currency" />
            </div>
            <div class="report-content">
              <h3>{{ totalBookingsThisMonth }}</h3>
              <p>Bookings this month</p>
            </div>
          </div>

          <div class="report-card">
            <div class="report-icon mint">
              <AppIcon name="users" />
            </div>
            <div class="report-content">
              <h3>{{ store.activeStaff.value.length }}</h3>
              <p>Active staff members</p>
            </div>
          </div>

          <div class="report-card">
            <div class="report-icon lavender">
              <AppIcon name="face" />
            </div>
            <div class="report-content">
              <h3>{{ store.activeServices.value.length }}</h3>
              <p>Active services</p>
            </div>
          </div>

          <div class="report-card">
            <div class="report-icon peach">
              <AppIcon name="user" />
            </div>
            <div class="report-content">
              <h3>{{ store.activeDoctors.value.length }}</h3>
              <p>Active doctors</p>
            </div>
          </div>

          <div class="report-card">
            <div class="report-icon blush">
              <AppIcon name="tag" />
            </div>
            <div class="report-content">
              <h3>{{ store.activePromos.value.length }}</h3>
              <p>Active promos</p>
            </div>
          </div>

          <div class="report-card">
            <div class="report-icon aqua">
              <AppIcon name="mail" />
            </div>
            <div class="report-content">
              <h3>{{ newInquiries }}</h3>
              <p>New inquiries</p>
            </div>
          </div>
        </div>

        <div class="recent-bookings">
          <h3>Recent Bookings</h3>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Patient</th>
                  <th>Services</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="booking in recentBookings" :key="booking.id">
                  <td><code>{{ booking.reference }}</code></td>
                  <td>{{ booking.patient.firstName }} {{ booking.patient.lastName }}</td>
                  <td>{{ booking.serviceNames.join(', ') }}</td>
                  <td>{{ formatDateLabel(booking.date) }}</td>
                  <td>{{ booking.time }}</td>
                  <td>{{ formatPeso(booking.subtotal) }}</td>
                </tr>
                <tr v-if="!recentBookings.length">
                  <td colspan="6" class="center muted">No bookings yet</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .sales-comparison {
    grid-column: 1 / -1;
  }
  
  .calendar-section {
    grid-column: 1 / -1;
  }
  
  .reports-section {
    grid-column: 1 / -1;
  }
}

.sales-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

@media (min-width: 768px) {
  .sales-cards {
    grid-template-columns: repeat(4, 1fr);
  }
}

.sales-card {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background: var(--glass);
  border: 1px solid rgba(255, 255, 255, 0.6);
  transition: transform 0.3s var(--ease), box-shadow 0.3s;
}

.sales-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.sales-card.yearly {
  border-left: 4px solid var(--aqua);
}

.sales-card-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-bottom: var(--space-3);
}

.sales-period {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--teal);
}

.sales-period-label {
  font-size: 0.8rem;
  color: var(--teal-soft);
  font-weight: 500;
}

.sales-amount {
  font-family: var(--font-display);
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--teal);
  margin-bottom: var(--space-2);
}

.sales-growth {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 0.85rem;
  font-weight: 600;
}

.sales-growth.positive {
  color: var(--aqua-deep);
}

.sales-growth.negative {
  color: var(--blush-deep);
}

.sales-growth.muted {
  color: var(--teal-faint);
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.calendar-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 600;
  min-width: 180px;
  text-align: center;
}

.calendar-layout {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: var(--space-6);
  align-items: start;
}

@media (max-width: 900px) {
  .calendar-layout {
    grid-template-columns: 1fr;
  }
}

.calendar {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: var(--shadow-sm);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.cal-day {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  background: transparent;
  font-weight: 600;
  color: var(--teal);
  display: grid;
  place-items: center;
  transition: all 0.2s var(--ease);
  cursor: pointer;
}

.cal-day.is-outside {
  visibility: hidden;
}

.cal-day:not(.is-disabled):hover {
  background: rgba(var(--rgb-mint), 0.28);
  transform: translateY(-2px);
}

.cal-day.is-disabled {
  color: var(--teal-faint);
  cursor: not-allowed;
  opacity: 0.5;
}

.cal-day.is-disabled::after {
  content: '';
  position: absolute;
  left: 22%;
  right: 22%;
  height: 1.5px;
  background: currentColor;
  transform: rotate(-24deg);
}

.cal-day.is-selected {
  background: var(--grad-primary);
  color: #fff;
  border-color: transparent;
  box-shadow: var(--shadow-glow);
  animation: pop 0.4s var(--ease);
}

.cal-day.is-today:not(.is-selected) {
  border-color: var(--aqua);
}

.time-panel {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: var(--shadow-sm);
  min-height: 200px;
}

.time-panel h3 {
  margin-bottom: var(--space-4);
  font-size: 1.1rem;
}

.time-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-6) var(--space-4);
  text-align: center;
  color: var(--teal-soft);
}

.time-placeholder .icon {
  width: 24px;
  height: 24px;
  color: var(--teal-faint);
}

.time-slots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: var(--space-2);
}

.time-slot {
  padding: 0.7rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line-strong);
  background: rgba(255, 255, 255, 0.85);
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.22s var(--ease);
  position: relative;
}

.time-slot.is-taken {
  cursor: not-allowed;
  color: var(--teal-faint);
  text-decoration: line-through;
  opacity: 0.55;
  background: rgba(255, 255, 255, 0.6);
}

.taken-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 0.6rem;
  background: var(--blush-deep);
  color: #fff;
  padding: 1px 5px;
  border-radius: var(--radius-pill);
  font-weight: 700;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

@media (min-width: 768px) {
  .reports-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

.report-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--glass);
  border: 1px solid rgba(255, 255, 255, 0.6);
  transition: transform 0.3s var(--ease), box-shadow 0.3s;
}

.report-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.report-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius);
  display: grid;
  place-items: center;
  color: #fff;
}

.report-icon.aqua { background: linear-gradient(140deg, var(--aqua), var(--mint-deep)); }
.report-icon.mint { background: linear-gradient(140deg, var(--mint-deep), var(--aqua)); }
.report-icon.lavender { background: linear-gradient(140deg, var(--lavender-deep), var(--mint)); }
.report-icon.peach { background: linear-gradient(140deg, var(--peach), var(--blush)); }
.report-icon.blush { background: linear-gradient(140deg, var(--blush-deep), var(--peach)); }

.report-icon .icon {
  width: 24px;
  height: 24px;
}

.report-content h3 {
  font-family: var(--font-display);
  font-size: 1.5rem;
  margin: 0;
  color: var(--teal);
}

.report-content p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--teal-soft);
}

.recent-bookings h3 {
  margin-bottom: var(--space-4);
  font-size: 1.1rem;
}

.recent-bookings .data-table td code {
  background: var(--line);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85rem;
}

@media print {
  .stat-grid, .calendar-section, .admin-section:not(.reports-section) {
    display: none;
  }
  
  .reports-section {
    page-break-inside: avoid;
  }
}
</style>