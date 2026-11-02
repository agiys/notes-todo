import { defineStore } from 'pinia'
import type { Note, Todo } from '~/types/note'
import { History } from '~/utils/history'
import { createId } from '~/utils/id'
import { debounce } from '~/utils/debounce'
import { removeDraft, saveDraft } from '~/utils/storage'

export const TYPING_PAUSE = 800
export const DRAFT_DELAY = 500

interface Pending {
  kind: 'title' | 'todoText'
  id?: string
  from: string
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

let history = new History()
let typingTimer: ReturnType<typeof setTimeout> | null = null
let draftWriter: ReturnType<typeof debounce<(id: string, note: Note) => void>> | null = null

function getDraftWriter() {
  if (!draftWriter) draftWriter = debounce((id: string, note: Note) => saveDraft(id, note), DRAFT_DELAY)
  return draftWriter
}

export const useEditorStore = defineStore('editor', {
  state: () => ({
    noteId: null as string | null,
    original: null as Note | null,
    draft: null as Note | null,
    pending: null as Pending | null,
    version: 0
  }),

  getters: {
    active: (state) => state.draft !== null,
    canUndo(state): boolean {
      return state.version >= 0 && (history.canUndo || state.pending !== null)
    },
    canRedo(state): boolean {
      return state.version >= 0 && history.canRedo
    },
    isTyping: (state) => state.pending !== null,
    dirty(state): boolean {
      if (!state.draft || !state.original) return false
      return JSON.stringify(state.draft) !== JSON.stringify(state.original)
    },
    titleError: (state): string => (state.draft && !state.draft.title.trim() ? 'Введите название' : '')
  },

  actions: {
    start(original: Note, restored?: Note) {
      this.finish()
      history = new History()
      this.noteId = original.id
      this.original = clone(original)
      this.draft = clone(restored ?? original)
      this.pending = null
      this.version++
    },

    finish() {
      this.stopTimer()
      getDraftWriter().cancel()
      history.clear()
      this.noteId = null
      this.original = null
      this.draft = null
      this.pending = null
      this.version++
    },

    stopTimer() {
      if (typingTimer) clearTimeout(typingTimer)
      typingTimer = null
    },

    touch() {
      this.version++
      this.persistDraft()
    },

    persistDraft() {
      if (!this.noteId || !this.draft) return
      if (this.dirty) getDraftWriter()(this.noteId, clone(this.draft))
      else {
        getDraftWriter().cancel()
        removeDraft(this.noteId)
      }
    },

    flushDraft() {
      getDraftWriter().flush()
    },

    discardDraft() {
      const id = this.noteId
      getDraftWriter().cancel()
      if (id) removeDraft(id)
    },

    startTyping(kind: Pending['kind'], value: string, id?: string) {
      if (!this.draft) return
      if (this.pending && (this.pending.kind !== kind || this.pending.id !== id)) this.commit()
      if (!this.pending) this.pending = { kind, id, from: value }
      this.stopTimer()
      typingTimer = setTimeout(() => this.commit(), TYPING_PAUSE)
    },

    setTitle(value: string) {
      if (!this.draft) return
      this.startTyping('title', this.draft.title)
      this.draft.title = value
      this.touch()
    },

    setTodoText(id: string, value: string) {
      const todo = this.draft?.todos.find((t) => t.id === id)
      if (!todo) return
      this.startTyping('todoText', todo.text, id)
      todo.text = value
      this.touch()
    },

    commit() {
      this.stopTimer()
      const pending = this.pending
      if (!pending || !this.draft) return
      this.pending = null
      if (pending.kind === 'title') {
        if (pending.from !== this.draft.title) {
          history.push({ type: 'title', from: pending.from, to: this.draft.title })
        }
        return this.touch()
      }
      const todo = this.draft.todos.find((t) => t.id === pending.id)
      if (todo && pending.from !== todo.text) {
        history.push({ type: 'todoText', id: todo.id, from: pending.from, to: todo.text })
      }
      this.touch()
    },

    toggleTodo(id: string) {
      this.commit()
      const todo = this.draft?.todos.find((t) => t.id === id)
      if (!todo) return
      history.push({ type: 'todoDone', id, from: todo.done, to: !todo.done })
      todo.done = !todo.done
      this.touch()
    },

    addTodo(text = ''): string {
      this.commit()
      const todo: Todo = { id: createId(), text, done: false }
      if (!this.draft) return todo.id
      const index = this.draft.todos.length
      history.push({ type: 'todoAdd', todo: clone(todo), index })
      this.draft.todos.push(todo)
      this.touch()
      return todo.id
    },

    removeTodo(id: string) {
      this.commit()
      if (!this.draft) return
      const index = this.draft.todos.findIndex((t) => t.id === id)
      if (index === -1) return
      const [todo] = this.draft.todos.splice(index, 1)
      history.push({ type: 'todoRemove', todo: clone(todo), index })
      this.touch()
    },

    undo() {
      this.commit()
      if (!this.draft) return
      const next = history.undo(clone(this.draft))
      if (next) this.draft = next
      this.touch()
    },

    redo() {
      this.commit()
      if (!this.draft) return
      const next = history.redo(clone(this.draft))
      if (next) this.draft = next
      this.touch()
    },

    getNoteToSave(): Note | null {
      this.commit()
      if (!this.draft || !this.draft.title.trim()) return null
      return {
        ...clone(this.draft),
        title: this.draft.title.trim(),
        todos: this.draft.todos
          .filter((t) => t.text.trim())
          .map((t) => ({ ...clone(t), text: t.text.trim() }))
      }
    }
  }
})
