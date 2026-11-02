<template>
  <article class="card">
    <h2 class="card__title">{{ note.title }}</h2>

    <ul v-if="shownTodos.length" class="card__list">
      <li v-for="todo in shownTodos" :key="todo.id" class="card__item" :class="{ 'card__item--done': todo.done }">
        <span class="card__mark" aria-hidden="true">{{ todo.done ? '✓' : '' }}</span>
        <span class="card__text">{{ todo.text }}</span>
      </li>
    </ul>
    <p v-else class="card__empty">Нет пунктов</p>
    <p v-if="hiddenCount" class="card__rest">и ещё {{ hiddenCount }}</p>

    <div class="card__actions">
      <BaseButton size="sm" :to="`/notes/${note.id}`">Изменить</BaseButton>
      <BaseButton size="sm" variant="ghost" @click="emit('remove', note)">Удалить</BaseButton>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Note } from '~/types/note'

const MAX_PREVIEW = 4

const props = defineProps<{ note: Note }>()
const emit = defineEmits<{ remove: [note: Note] }>()

const shownTodos = computed(() => props.note.todos.slice(0, MAX_PREVIEW))
const hiddenCount = computed(() => Math.max(0, props.note.todos.length - MAX_PREVIEW))
</script>


<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.card {
  display: flex;
  flex-direction: column;
  padding: 18px;
  background: $color-surface;
  border-radius: $radius;
  box-shadow: $shadow;

  &__title {
    font-size: 18px;
    overflow-wrap: anywhere;
  }

  &__list {
    margin: 12px 0 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 3px 0;

    &--done .card__text {
      color: $color-muted;
      text-decoration: line-through;
    }
  }

  &__mark {
    flex: none;
    width: 16px;
    height: 16px;
    margin-top: 4px;
    border: 1.5px solid $color-border;
    border-radius: 4px;
    font-size: 11px;
    line-height: 13px;
    text-align: center;
    color: $color-success;
  }

  &__text {
    overflow-wrap: anywhere;
  }

  &__empty,
  &__rest {
    margin-top: 12px;
    color: $color-muted;
    font-size: 14px;
  }

  &__rest {
    margin-top: 4px;
  }

  &__actions {
    display: flex;
    gap: 8px;
    margin-top: auto;
    padding-top: 16px;
  }
}
</style>
