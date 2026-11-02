export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  devtools: { enabled: false },
  css: ['~/assets/css/app.css'],
  routeRules: {
    '/admin/**': { ssr: false },
    '/hr/**': { ssr: false },
    '/staff/**': { ssr: false },
    '/login': { ssr: false },
    '/book': { ssr: false },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Lumi Derma Studio',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Lumi Derma Studio — a calm, modern dermatology clinic. Book consultations, facials, laser and glow treatments online in minutes.',
        },
        { name: 'theme-color', content: '#182723' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
        },
      ],
      noscript: [{ innerHTML: '<style>.reveal{opacity:1;transform:none}</style>' }],
    },
  },
  typescript: {
    strict: true,
  },
})
