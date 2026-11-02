<template>
  <NuxtLink v-if="props.to" :to="props.to" class="btn" :class="[`btn--${variant}`, `btn--${size}`]">
    <slot />
  </NuxtLink>
  <button v-else class="btn" :class="[`btn--${variant}`, `btn--${size}`]" :type="type" :disabled="disabled">
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'md' | 'sm'
  to?: string
  type?: 'button' | 'submit'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'secondary',
  size: 'md',
  type: 'button'
})
</script>


<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 18px;
  border: 1px solid transparent;
  border-radius: $radius;
  background: transparent;
  font-weight: 600;
  line-height: 1.2;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, opacity 0.15s, transform 0.12s ease;

  &:active:not(:disabled) {
    transform: scale(0.96);
  }

  &--sm {
    padding: 6px 12px;
    font-size: 14px;
  }

  &--primary {
    background: $color-primary;
    color: #fff;

    &:hover:not(:disabled) {
      background: $color-primary-dark;
    }
  }

  &--secondary {
    background: $color-surface;
    border-color: $color-border;
    color: $color-text;

    &:hover:not(:disabled) {
      background: #eef0f4;
    }
  }

  &--danger {
    background: $color-danger;
    color: #fff;

    &:hover:not(:disabled) {
      background: $color-danger-dark;
    }
  }

  &--ghost {
    color: $color-danger;

    &:hover:not(:disabled) {
      background: rgba($color-danger, 0.08);
    }
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}
</style>
