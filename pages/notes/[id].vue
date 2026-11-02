<template>
  <section v-if="loaded && notFound">
    <EmptyState title="Заметка не найдена" text="Возможно, она была удалена или ссылка неверна.">
      <BaseButton variant="primary" to="/">К списку заметок</BaseButton>
    </EmptyState>
  </section>

  <section v-else-if="loaded && editor.draft" class="edit">
    <div class="edit__head">
      <h1 class="edit__heading">{{ isNew ? 'Новая заметка' : 'Редактирование' }}</h1>
      <div class="edit__history">
        <BaseButton size="sm" :disabled="!editor.canUndo" title="Отменить (Ctrl+Z)" @click="editor.undo()">
          ↶ Отменить
        </BaseButton>
        <BaseButton size="sm" :disabled="!editor.canRedo" title="Повторить (Shift+Ctrl+Z)" @click="editor.redo()">
          ↷ Повторить
        </BaseButton>
      </div>
    </div>

    <form class="edit__form" novalidate @submit.prevent="save">
      <label class="field">
        <span class="field__label">Название</span>
        <input
          ref="titleInput"
          class="field__input"
          :class="{ 'field__input--error': showErrors && editor.titleError }"
          type="text"
          :value="editor.draft.title"
          placeholder="Название заметки"
          maxlength="200"
          @input="editor.setTitle(($event.target as HTMLInputElement).value)"
          @blur="editor.commit()"
        />
        <span v-if="showErrors && editor.titleError" class="field__error" role="alert">
          {{ editor.titleError }}
        </span>
      </label>

      <div class="todos">
        <h2 class="todos__title">Список задач</h2>
        <ul v-if="editor.draft.todos.length" class="todos__list">
          <TodoItem
            v-for="todo in editor.draft.todos"
            :key="todo.id"
            :ref="(el) => (todoRefs[todo.id] = el as any)"
            :todo="todo"
            @toggle="editor.toggleTodo(todo.id)"
            @remove="editor.removeTodo(todo.id)"
            @update:text="editor.setTodoText(todo.id, $event)"
            @enter="addTodo"
            @blur="editor.commit()"
          />
        </ul>
        <p v-else class="todos__empty">Пунктов пока нет.</p>
        <BaseButton class="todos__add" @click="addTodo">+ Добавить пункт</BaseButton>
        <p class="todos__hint">Пункты без текста не сохраняются.</p>
      </div>

      <div class="edit__actions">
        <BaseButton variant="primary" type="submit">Сохранить</BaseButton>
        <BaseButton @click="activeModal = 'cancel'">Отменить редактирование</BaseButton>
        <BaseButton v-if="!isNew" variant="ghost" class="edit__delete" @click="activeModal = 'delete'">
          Удалить
        </BaseButton>
      </div>
    </form>

    <ConfirmModal
      :open="activeModal === 'cancel'"
      title="Отменить редактирование?"
      message="Все несохранённые изменения будут потеряны."
      confirm-text="Отменить изменения"
      cancel-text="Продолжить"
      danger
      @confirm="cancelEditing"
      @cancel="activeModal = null"
    />
    <ConfirmModal
      :open="activeModal === 'delete'"
      title="Удалить заметку?"
      message="Заметка будет удалена без возможности восстановления."
      confirm-text="Удалить"
      danger
      @confirm="removeNote"
      @cancel="activeModal = null"
    />
    <BaseModal :open="activeModal === 'gone'" title="Заметка удалена" :closable="false">
      Эта заметка была удалена в другой вкладке. Редактирование невозможно.
      <template #actions>
        <BaseButton variant="primary" data-autofocus @click="leave">К списку заметок</BaseButton>
      </template>
    </BaseModal>
    <BaseModal :open="!!draftToRestore" title="Восстановить черновик?" @close="dropDraft">
      Найдены несохранённые изменения этой заметки. Восстановить их?
      <template #actions>
        <BaseButton @click="dropDraft">Отбросить</BaseButton>
        <BaseButton variant="primary" data-autofocus @click="restoreDraft">Восстановить</BaseButton>
      </template>
    </BaseModal>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Note } from '~/types/note'
import { createEmptyNote, useNotesStore } from '~/stores/notes'
import { useEditorStore } from '~/stores/editor'
import { createId } from '~/utils/id'
import { loadDraft, removeDraft } from '~/utils/storage'

const NEW_ID = 'new'

const route = useRoute()
const router = useRouter()
const notes = useNotesStore()
const editor = useEditorStore()

const noteId = computed(() => String(route.params.id))
const isNew = computed(() => noteId.value === NEW_ID)

const notFound = ref(false)
const loaded = ref(false)
const leaving = ref(false)
const showErrors = ref(false)
const draftToRestore = ref<Note | null>(null)
const activeModal = ref<'cancel' | 'delete' | 'gone' | null>(null)
const titleInput = ref<HTMLInputElement | null>(null)
const todoRefs = ref<Record<string, { focus: () => void } | null>>({})

useHead({ title: computed(() => (isNew.value ? 'Новая заметка' : 'Редактирование')) })

const hasOpenModal = computed(() => activeModal.value !== null || draftToRestore.value !== null)

function blankNote(): Note {
  return { ...createEmptyNote(), id: NEW_ID }
}

function init() {
  notFound.value = false
  const saved = isNew.value ? blankNote() : notes.byId(noteId.value)
  if (!saved) {
    notFound.value = true
    loaded.value = true
    return
  }
  editor.start(saved)
  const draft = loadDraft(noteId.value)
  if (draft && JSON.stringify(draft.note) !== JSON.stringify(saved)) {
    draftToRestore.value = draft.note
  }
  loaded.value = true
}

function restoreDraft() {
  if (draftToRestore.value && editor.original) editor.start(editor.original, draftToRestore.value)
  draftToRestore.value = null
}

function dropDraft() {
  removeDraft(noteId.value)
  draftToRestore.value = null
}

function leave() {
  leaving.value = true
  editor.discardDraft()
  router.push('/')
}

function save() {
  showErrors.value = true
  const prepared = editor.getNoteToSave()
  if (!prepared) {
    titleInput.value?.focus()
    return
  }
  notes.upsert(isNew.value ? { ...prepared, id: createId() } : prepared)
  notes.flush()
  leave()
}

function removeNote() {
  notes.remove(noteId.value)
  notes.flush()
  activeModal.value = null
  leave()
}

function cancelEditing() {
  activeModal.value = null
  leave()
}

async function addTodo() {
  const id = editor.addTodo()
  await nextTick()
  todoRefs.value[id]?.focus()
}

function onKeydown(event: KeyboardEvent) {
  if (!loaded.value || notFound.value || hasOpenModal.value) return
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return
  const key = event.key.toLowerCase()
  const redo = (key === 'z' && event.shiftKey) || key === 'y'
  const undo = key === 'z' && !event.shiftKey
  if (!undo && !redo) return

  const target = event.target as HTMLElement | null
  const inText = target?.matches('input[type="text"], textarea')
  if (inText && editor.isTyping) return

  event.preventDefault()
  if (undo) editor.undo()
  else editor.redo()
}

function onPageHide() {
  editor.commit()
  editor.flushDraft()
}

watch(
  () => notes.byId(noteId.value),
  (note, prev) => {
    if (isNew.value || leaving.value || !loaded.value || notFound.value) return
    if (prev && !note) activeModal.value = 'gone'
  }
)

watch(noteId, () => {
  leaving.value = false
  activeModal.value = null
  draftToRestore.value = null
  showErrors.value = false
  init()
})

onMounted(() => {
  init()
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('pagehide', onPageHide)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pagehide', onPageHide)
  if (!leaving.value) {
    editor.commit()
    editor.flushDraft()
  }
  editor.finish()
})
</script>


<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.edit {
  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 20px;
  }

  &__heading {
    font-size: 26px;
  }

  &__history {
    display: flex;
    gap: 8px;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 20px;
    background: $color-surface;
    border-radius: $radius;
    box-shadow: $shadow;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  &__delete {
    @include up($bp-sm) {
      margin-left: auto;
    }
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__label {
    font-weight: 600;
  }

  &__input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid $color-border;
    border-radius: $radius;
    background: #fff;
    font-size: 18px;

    &:focus {
      outline: none;
      border-color: $color-primary;
      box-shadow: 0 0 0 3px $color-focus;
    }

    &--error {
      border-color: $color-danger;
    }
  }

  &__error {
    color: $color-danger;
    font-size: 14px;
  }
}

.todos {
  &__title {
    margin-bottom: 10px;
    font-size: 18px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0 0 12px;
    padding: 0;
    list-style: none;
  }

  &__empty {
    margin-bottom: 12px;
    color: $color-muted;
  }

  &__hint {
    margin-top: 8px;
    color: $color-muted;
    font-size: 13px;
  }
}
</style>
