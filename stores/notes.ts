import { defineStore } from 'pinia'
import type { Note } from '~/types/note'
import { createId } from '~/utils/id'
import { debounce } from '~/utils/debounce'
import { loadNotes, saveNotes } from '~/utils/storage'

const SAVE_DELAY = 400

type Writer = ReturnType<typeof debounce<(notes: Note[]) => void>>

const writers = new WeakMap<object, Writer>()

function getWriter(owner: object): Writer {
  let writer = writers.get(owner)
  if (!writer) {
    writer = debounce((notes: Note[]) => saveNotes(notes), SAVE_DELAY)
    writers.set(owner, writer)
  }
  return writer
}

export function createEmptyNote(): Note {
  const now = Date.now()
  return { id: createId(), title: '', todos: [], createdAt: now, updatedAt: now }
}

export const useNotesStore = defineStore('notes', {
  state: () => ({
    notes: [] as Note[],
    loaded: false
  }),

  getters: {
    sorted: (state): Note[] => [...state.notes].sort((a, b) => b.updatedAt - a.updatedAt),
    byId: (state) => (id: string) => state.notes.find((n) => n.id === id)
  },

  actions: {
    load() {
      this.notes = loadNotes()
      this.loaded = true
    },

    syncFromStorage() {
      getWriter(this).cancel()
      this.load()
    },

    upsert(note: Note) {
      this.refresh()
      const copy: Note = JSON.parse(JSON.stringify(note))
      copy.updatedAt = Date.now()
      const index = this.notes.findIndex((n) => n.id === copy.id)
      if (index === -1) this.notes.push(copy)
      else this.notes.splice(index, 1, copy)
      this.saveLater()
    },

    remove(id: string) {
      this.refresh()
      this.notes = this.notes.filter((n) => n.id !== id)
      this.saveLater()
    },

    refresh() {
      if (!getWriter(this).isPending()) this.notes = loadNotes()
    },

    saveLater() {
      getWriter(this)(JSON.parse(JSON.stringify(this.notes)))
    },

    flush() {
      getWriter(this).flush()
    }
  }
})
