import { onBeforeUnmount, watch, type Ref } from 'vue'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

export function useFocusTrap(container: Ref<HTMLElement | null>, active: Ref<boolean>) {
  let lastFocused: HTMLElement | null = null

  const getFocusable = () =>
    container.value
      ? Array.from(container.value.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => el.offsetParent !== null || el === document.activeElement
        )
      : []

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab' || !container.value) return
    const list = getFocusable()
    if (!list.length) {
      event.preventDefault()
      container.value.focus()
      return
    }
    const first = list[0]
    const last = list[list.length - 1]
    const current = document.activeElement
    if (event.shiftKey && (current === first || !container.value.contains(current))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (current === last || !container.value.contains(current))) {
      event.preventDefault()
      first.focus()
    }
  }

  const activate = () => {
    lastFocused = document.activeElement as HTMLElement | null
    document.addEventListener('keydown', onKeydown, true)
    const target = container.value?.querySelector<HTMLElement>('[data-autofocus]') ?? getFocusable()[0] ?? container.value
    target?.focus()
  }

  const deactivate = () => {
    document.removeEventListener('keydown', onKeydown, true)
    lastFocused?.focus?.()
    lastFocused = null
  }

  watch(
    active,
    (value) => {
      if (value) setTimeout(activate, 0)
      else deactivate()
    },
    { immediate: true, flush: 'post' }
  )

  onBeforeUnmount(() => {
    if (active.value) deactivate()
  })
}
