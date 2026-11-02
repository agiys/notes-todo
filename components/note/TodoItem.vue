<template>
  <li class="todo" :class="{ 'todo--done': todo.done }">
    <input
      class="todo__check"
      type="checkbox"
      :checked="todo.done"
      aria-label="Выполнено"
      @change="emit('toggle')"
    />
    <input
      ref="textInput"
      class="todo__text"
      type="text"
      maxlength="500"
      autocomplete="off"
      :value="todo.text"
      placeholder="Текст пункта"
      aria-label="Текст пункта"
      @input="emit('update:text', ($event.target as HTMLInputElement).value)"
      @keydown.enter.prevent="emit('enter')"
      @blur="emit('blur')"
    />
    <button class="todo__remove" type="button" aria-label="Удалить пункт" @click="emit('remove')">
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path d="M3 3l10 10M13 3L3 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    </button>
  </li>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Todo } from '~/types/note'

defineProps<{ todo: Todo }>()
const emit = defineEmits<{
  toggle: []
  remove: []
  'update:text': [value: string]
  enter: []
  blur: []
}>()

const textInput = ref<HTMLInputElement | null>(null)

defineExpose({ focus: () => textInput.value?.focus() })
</script>


<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.todo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius;
  transition: border-color 0.2s, background-color 0.2s;

  &:focus-within {
    border-color: $color-primary;
  }

  &__check {
    flex: none;
    width: 20px;
    height: 20px;
    margin: 0;
    cursor: pointer;
    accent-color: $color-primary;
  }

  &__text {
    flex: 1;
    min-width: 0;
    padding: 6px 4px;
    border: 0;
    border-bottom: 1px solid transparent;
    background: transparent;
    transition: color 0.25s, border-color 0.2s;

    &:focus {
      outline: none;
      border-bottom-color: $color-primary;
    }
  }

  &--done &__text {
    color: $color-muted;
    text-decoration: line-through;
  }

  &__remove {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: $color-muted;
    cursor: pointer;

    &:hover {
      background: rgba($color-danger, 0.1);
      color: $color-danger;
    }
  }
}
</style>
