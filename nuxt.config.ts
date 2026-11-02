export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  ssr: false,
  devtools: { enabled: false },
  css: ['~/assets/css/app.css'],
  app: {
    head: {
      // unchanged, but change the Jakarta part of the font URL to:
      // family=Plus+Jakarta+Sans:wght@400;500;600;700;800
    },
  },
  typescript: { strict: true },
})