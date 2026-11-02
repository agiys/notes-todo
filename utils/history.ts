import type { Note, Patch } from '~/types/note'

export const HISTORY_LIMIT = 50

export function applyPatch(note: Note, patch: Patch): Note {
  switch (patch.type) {
    case 'title':
      return { ...note, title: patch.to }
    case 'todoText':
      return {
        ...note,
        todos: note.todos.map((t) => (t.id === patch.id ? { ...t, text: patch.to } : t))
      }
    case 'todoDone':
      return {
        ...note,
        todos: note.todos.map((t) => (t.id === patch.id ? { ...t, done: patch.to } : t))
      }
    case 'todoAdd': {
      const todos = [...note.todos]
      todos.splice(Math.min(patch.index, todos.length), 0, { ...patch.todo })
      return { ...note, todos }
    }
    case 'todoRemove':
      return { ...note, todos: note.todos.filter((t) => t.id !== patch.todo.id) }
  }
}

export function invertPatch(patch: Patch): Patch {
  switch (patch.type) {
    case 'title':
    case 'todoText':
      return { ...patch, from: patch.to, to: patch.from }
    case 'todoDone':
      return { ...patch, from: patch.to, to: patch.from }
    case 'todoAdd':
      return { type: 'todoRemove', todo: patch.todo, index: patch.index }
    case 'todoRemove':
      return { type: 'todoAdd', todo: patch.todo, index: patch.index }
  }
}

export class History {
  private patches: Patch[] = []
  private cursor = 0

  constructor(private readonly limit: number = HISTORY_LIMIT) {}

  get size(): number {
    return this.patches.length
  }

  get canUndo(): boolean {
    return this.cursor > 0
  }

  get canRedo(): boolean {
    return this.cursor < this.patches.length
  }

  push(patch: Patch): void {
    this.patches.splice(this.cursor)
    this.patches.push(patch)
    if (this.patches.length > this.limit) {
      this.patches.shift()
    }
    this.cursor = this.patches.length
  }

  undo(note: Note): Note | null {
    if (!this.canUndo) return null
    this.cursor--
    return applyPatch(note, invertPatch(this.patches[this.cursor]))
  }

  redo(note: Note): Note | null {
    if (!this.canRedo) return null
    const next = applyPatch(note, this.patches[this.cursor])
    this.cursor++
    return next
  }

  clear(): void {
    this.patches = []
    this.cursor = 0
  }
}
