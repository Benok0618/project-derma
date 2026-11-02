<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    name: string
    size?: number | string
  }>(),
  { size: undefined },
)

const icons: Record<string, string> = {
  check: '<path d="M4 12.5 9.5 18 20 6.5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
  'chevron-left': '<path d="m14.5 5-6 7 6 7"/>',
  'chevron-right': '<path d="m9.5 5 6 7-6 7"/>',
  'chevron-up': '<path d="m5.5 14 6-7 6 7"/>',
  'chevron-down': '<path d="m18.5 10-6 7-6-7"/>',
  calendar:
    '<rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  sparkle:
    '<path d="M12 3.5c1 4 2 5 6 6-4 1-5 2-6 6-1-4-2-5-6-6 4-1 5-2 6-6Z"/><path d="M18.5 3.5c.3 1.3.7 1.7 2 2-.13.3-.8.3-2 .5.3-1.3.7-1.7 2-2.5Z"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  'arrow-right': '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  shield: '<path d="M12 3.5 5 6v6c0 4 3 7 7 8.5 4-1.5 7-4.5 7-8.5V6l-7-2.5Z"/><path d="m9 12 2 2 4-4"/>',
  droplet: '<path d="M12 3.5s6 6.3 6 10.5a6 6 0 0 1-12 0C6 9.8 12 3.5 12 3.5Z"/>',
  leaf: '<path d="M20 4C10 4 4 9 4 16c0 0 0 4 4 4 7 0 12-6 12-16Z"/><path d="M4 20C7 14 11 11 16 9"/>',
  face: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8M9.5 9.7h.01M14.5 9.7h.01"/>',
  laser: '<path d="M8.5 3.5h7l-1.6 7h-3.8L8.5 3.5Z"/><path d="M12 10.5v10"/><path d="M9 13.5v6M15 13.5v6"/>',
  syringe:
    '<path d="M14 3.5 20.5 10M17 6.5 10 13.5M8 12l4 4M13.5 9.5 6 17l-2.5.5L4 15l7.5-7.5"/>',
  hair: '<path d="M5 20c0-7 2-12 7-12s7 5 7 12"/><path d="M9 20c0-5 1-8 3-8s3 3 3 8"/>',
  body: '<circle cx="12" cy="4.6" r="2.2"/><path d="M8 21 12 12l4 9M7 9h10"/>',
  users:
    '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5"/><path d="M16 5.5a3 3 0 0 1 0 5.6M17 14.8c2.2.5 3.5 2.3 3.5 5"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M4 20c0-4 3.5-6 8-6s8 2 8 6"/>',
  wallet: '<rect x="3.5" y="6" width="17" height="13" rx="3"/><path d="M3.5 10h17M15.5 14h2"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="M3 10h18M7 14.5h4"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="3"/><path d="M11 18h2"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="m4.5 7.5 7.5 5.5 7.5-5.5"/>',
  pin: '<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v5M12 16h.01"/>',
  lock: '<rect x="4.5" y="10" width="15" height="10" rx="2.5"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>',
  currency: '<circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 12h8"/>',
  tag: '<path d="M6 3h12l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7l4-4Z"/><circle cx="10" cy="10" r="2"/>',
  printer: '<rect x="6" y="4" width="12" height="14" rx="1"/><path d="M6 10h12M8 4V2M16 4V2M10 18h4"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7"/><path d="M3 20h18"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off':
    '<path d="M4 4l16 16"/><path d="M9.9 5.9A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.2 4"/><path d="M6.3 7.8A16.7 16.7 0 0 0 2.5 12S6 18.5 12 18.5a9.7 9.7 0 0 0 4-.9"/><path d="M9.9 12.1a3 3 0 0 0 4.2 4.2"/>',
  download: '<path d="M12 4v10m0 0 4-4m-4 4-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
  edit: '<path d="M4 20h4l10-10-4-4L4 16v4Z"/><path d="M14 6l4 4"/>',
  logout: '<path d="M14 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8"/><path d="M17 9l3 3-3 3M20 12H10"/>',
}
</script>

<template>
  <svg
    class="icon"
    :style="size ? { width: size, height: size } : undefined"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="icons[props.name] ?? ''"
  />
</template>