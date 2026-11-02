import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createEmptyNote, useNotesStore } from '~/stores/notes'
import { NOTES_KEY, SCHEMA_VERSION, loadNotes, migrate } from '~/utils/storage'

describe('notes store', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('запись в localStorage откладывается и объединяется', () => {
    const store = useNotesStore()
    const spy = vi.spyOn(Storage.prototype, 'setItem')
    const a = { ...createEmptyNote(), title: 'A' }
    const b = { ...createEmptyNote(), title: 'B' }
    store.upsert(a)
    store.upsert(b)
    expect(localStorage.getItem(NOTES_KEY)).toBeNull()

    vi.advanceTimersByTime(500)
    expect(spy).toHaveBeenCalledTimes(1)
    const stored = JSON.parse(localStorage.getItem(NOTES_KEY)!)
    expect(stored.schemaVersion).toBe(SCHEMA_VERSION)
    expect(stored.notes).toHaveLength(2)
    spy.mockRestore()
  })

  it('upsert обновляет существующую заметку', () => {
    const store = useNotesStore()
    const note = { ...createEmptyNote(), title: 'Старое' }
    store.upsert(note)
    store.upsert({ ...note, title: 'Новое' })
    expect(store.notes).toHaveLength(1)
    expect(store.byId(note.id)!.title).toBe('Новое')
  })

  it('remove удаляет заметку', () => {
    const store = useNotesStore()
    const note = { ...createEmptyNote(), title: 'X' }
    store.upsert(note)
    store.remove(note.id)
    store.flush()
    expect(store.notes).toHaveLength(0)
    expect(loadNotes()).toHaveLength(0)
  })

  it('syncFromStorage подтягивает изменения из другой вкладки', () => {
    const store = useNotesStore()
    const note = { ...createEmptyNote(), title: 'X' }
    store.upsert(note)
    store.flush()

    localStorage.setItem(NOTES_KEY, JSON.stringify({ schemaVersion: SCHEMA_VERSION, notes: [] }))
    store.syncFromStorage()
    expect(store.byId(note.id)).toBeUndefined()
  })

  it('сортирует заметки по дате изменения', () => {
    const store = useNotesStore()
    store.notes = [
      { ...createEmptyNote(), id: 'a', updatedAt: 1 },
      { ...createEmptyNote(), id: 'b', updatedAt: 5 }
    ]
    expect(store.sorted.map((n) => n.id)).toEqual(['b', 'a'])
  })
})

describe('миграции', () => {
  it('поднимает данные первой версии до текущей', () => {
    const data = migrate({ schemaVersion: 1, notes: [{ id: '1', title: 'a', todos: [] }] })
    expect(data.schemaVersion).toBe(SCHEMA_VERSION)
    expect(typeof data.notes[0].createdAt).toBe('number')
  })

  it('отбрасывает данные из будущей версии и мусор', () => {
    expect(migrate({ schemaVersion: SCHEMA_VERSION + 1, notes: [] })).toBeNull()
    expect(migrate(null)).toBeNull()
  })

  it('loadNotes не падает на повреждённом JSON', () => {
    localStorage.setItem(NOTES_KEY, '{oops')
    expect(loadNotes()).toEqual([])
  })
})
