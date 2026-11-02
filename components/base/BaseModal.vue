<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal" @keydown="onKeydown">
        <div class="modal__backdrop" @click="onBackdrop" />
        <div
          ref="dialog"
          class="modal__dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
        >
          <h2 :id="titleId" class="modal__title">{{ title }}</h2>
          <div class="modal__body">
            <slot />
          </div>
          <div class="modal__footer">
            <slot name="actions" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, toRef, watch } from 'vue'
import { useFocusTrap } from '~/composables/useFocusTrap'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    closable?: boolean
  }>(),
  { closable: true }
)

const emit = defineEmits<{ close: [] }>()

const dialog = ref<HTMLElement | null>(null)
const titleId = `modal-title-${Math.random().toString(36).slice(2, 8)}`

useFocusTrap(dialog, toRef(props, 'open'))

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closable) {
    event.stopPropagation()
    emit('close')
  }
}

const onBackdrop = () => {
  if (props.closable) emit('close')
}

watch(
  () => props.open,
  (value) => {
    document.body.classList.toggle('scroll-locked', value)
  }
)

onBeforeUnmount(() => document.body.classList.remove('scroll-locked'))
</script>


<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;

  &__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(20, 24, 40, 0.5);
  }

  &__dialog {
    position: relative;
    width: 100%;
    max-width: 440px;
    max-height: 100%;
    overflow-y: auto;
    padding: 24px;
    background: $color-surface;
    border-radius: 14px;
    box-shadow: 0 20px 50px rgba(20, 24, 40, 0.3);

    &:focus {
      outline: none;
    }
  }

  &__title {
    margin-bottom: 8px;
    font-size: 20px;
  }

  &__body {
    color: $color-muted;
  }

  &__footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 24px;
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;

  .modal__dialog {
    transition: transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1.2), opacity 0.2s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal__dialog {
    opacity: 0;
    transform: translateY(20px) scale(0.94);
  }
}

@media (max-width: 480px) {
  .modal__footer > :deep(*) {
    flex: 1 1 100%;
  }
}
</style>
