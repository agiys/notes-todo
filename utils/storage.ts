import type { Note } from '~/types/note'

export const SCHEMA_VERSION = 2
export const NOTES_KEY = 'notes-todo:notes'
export const DRAFT_PREFIX = 'notes-todo:draft:'

export interface NotesPayload {
  schemaVersion: number
  notes: Note[]
}

export interface DraftPayload {
  schemaVersion: number
  noteId: string
  note: Note
  savedAt: number
}

type Migration = (data: any) => any

const migrations: Record<number, Migration> = {
  1: (data) => ({
    ...data,
    schemaVersion: 2,
    notes: (data.notes ?? []).map((n: any) => ({
      ...n,
      createdAt: n.createdAt ?? n.updatedAt ?? Date.now(),
      updatedAt: n.updatedAt ?? Date.now()
    }))
  })
}

export function migrate(raw: any): any {
  if (!raw || typeof raw !== 'object') return null
  let data = raw
  let version = Number(data.schemaVersion ?? 1)
  if (version > SCHEMA_VERSION) return null
  while (version < SCHEMA_VERSION) {
    const step = migrations[version]
    if (!step) return null
    data = step(data)
    version = Number(data.schemaVersion)
  }
  return data
}

function readJson(key: string): unknown {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function isNote(value: any): value is Note {
  return (
    !!value &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    Array.isArray(value.todos)
  )
}

export function loadNotes(): Note[] {
  const data = migrate(readJson(NOTES_KEY))
  if (!data || !Array.isArray(data.notes)) return []
  return data.notes.filter(isNote)
}

export function saveNotes(notes: Note[]): void {
  const payload: NotesPayload = { schemaVersion: SCHEMA_VERSION, notes }
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(payload))
  } catch {
    return
  }
}

export function draftKey(noteId: string): string {
  return DRAFT_PREFIX + noteId
}

export function loadDraft(noteId: string): DraftPayload | null {
  const data = migrate(readJson(draftKey(noteId)))
  if (!data || !isNote(data.note)) return null
  return data as DraftPayload
}

export function saveDraft(noteId: string, note: Note): void {
  const payload: DraftPayload = {
    schemaVersion: SCHEMA_VERSION,
    noteId,
    note,
    savedAt: Date.now()
  }
  try {
    localStorage.setItem(draftKey(noteId), JSON.stringify(payload))
  } catch {
    return
  }
}

export function removeDraft(noteId: string): void {
  try {
    localStorage.removeItem(draftKey(noteId))
  } catch {
    return
  }
}
