export default defineNuxtConfig({
  ssr: false,
  modules: ['@pinia/nuxt'],
  components: [{ path: '~/components', pathPrefix: false }],
  css: ['~/assets/scss/main.scss'],
  typescript: { strict: true },
  app: {
    head: {
      title: 'Заметки',
      htmlAttrs: { lang: 'ru' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }]
    }
  },
  compatibilityDate: '2025-01-01'
})
