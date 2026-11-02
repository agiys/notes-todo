<template>
  <section>
    <div class="head">
      <h1 class="head__title">Мои заметки</h1>
      <BaseButton variant="primary" to="/notes/new">Новая заметка</BaseButton>
    </div>

    <div v-if="store.sorted.length" class="grid">
      <NoteCard v-for="note in store.sorted" :key="note.id" :note="note" @remove="noteToDelete = $event" />
    </div>
    <EmptyState v-else title="Заметок пока нет" text="Создайте первую заметку со списком задач.">
      <BaseButton variant="primary" to="/notes/new">Создать заметку</BaseButton>
    </EmptyState>

    <ConfirmModal
      :open="!!noteToDelete"
      title="Удалить заметку?"
      :message="`Заметка «${noteToDelete?.title ?? ''}» будет удалена без возможности восстановления.`"
      confirm-text="Удалить"
      danger
      @confirm="confirmDelete"
      @cancel="noteToDelete = null"
    />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Note } from '~/types/note'
import { useNotesStore } from '~/stores/notes'

useHead({ title: 'Заметки' })

const store = useNotesStore()
const noteToDelete = ref<Note | null>(null)

const confirmDelete = () => {
  if (noteToDelete.value) {
    store.remove(noteToDelete.value.id)
    store.flush()
  }
  noteToDelete.value = null
}
</script>


<style scoped lang="scss">
@use '../assets/scss/variables' as *;

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;

  &__title {
    font-size: 26px;
  }
}

.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;

  @include up($bp-sm) {
    grid-template-columns: repeat(2, 1fr);
  }

  @include up($bp-md) {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
