import { NOTES_KEY } from '~/utils/storage'

export default defineNuxtPlugin(() => {
  const store = useNotesStore()
  store.load()

  window.addEventListener('storage', (event) => {
    if (event.key === NOTES_KEY || event.key === null) store.syncFromStorage()
  })

  const flush = () => store.flush()
  window.addEventListener('pagehide', flush)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
})
