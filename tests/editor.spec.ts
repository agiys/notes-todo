import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { TYPING_PAUSE, useEditorStore } from '~/stores/editor'
import type { Note } from '~/types/note'

const makeNote = (): Note => ({
  id: 'n1',
  title: 'Заметка',
  todos: [{ id: 't1', text: 'Первый', done: false }],
  createdAt: 1,
  updatedAt: 1
})

describe('editor store', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('ввод в одно поле складывается в одну запись', () => {
    const editor = useEditorStore()
    editor.start(makeNote())
    'Новое'.split('').forEach((_, i) => editor.setTitle('Новое'.slice(0, i + 1)))
    expect(editor.canUndo).toBe(true)

    editor.undo()
    expect(editor.draft!.title).toBe('Заметка')
    expect(editor.canUndo).toBe(false)
    editor.redo()
    expect(editor.draft!.title).toBe('Новое')
  })

  it('пауза в наборе фиксирует запись', () => {
    const editor = useEditorStore()
    editor.start(makeNote())
    editor.setTitle('А')
    vi.advanceTimersByTime(TYPING_PAUSE + 10)
    expect(editor.isTyping).toBe(false)
    editor.setTitle('АБ')
    vi.advanceTimersByTime(TYPING_PAUSE + 10)

    editor.undo()
    expect(editor.draft!.title).toBe('А')
    editor.undo()
    expect(editor.draft!.title).toBe('Заметка')
  })

  it('чекбокс, добавление и удаление — отдельные записи', () => {
    const editor = useEditorStore()
    editor.start(makeNote())
    editor.toggleTodo('t1')
    const id = editor.addTodo('Второй')
    editor.removeTodo(id)

    editor.undo()
    expect(editor.draft!.todos.map((t) => t.id)).toEqual(['t1', id])
    editor.undo()
    expect(editor.draft!.todos.map((t) => t.id)).toEqual(['t1'])
    expect(editor.draft!.todos[0].done).toBe(true)
    editor.undo()
    expect(editor.draft!.todos[0].done).toBe(false)
  })

  it('новое изменение после undo сбрасывает redo', () => {
    const editor = useEditorStore()
    editor.start(makeNote())
    editor.toggleTodo('t1')
    editor.undo()
    expect(editor.canRedo).toBe(true)
    editor.addTodo('Ещё')
    expect(editor.canRedo).toBe(false)
  })

  it('dirty отражает отличие от сохранённой версии', () => {
    const editor = useEditorStore()
    editor.start(makeNote())
    expect(editor.dirty).toBe(false)
    editor.toggleTodo('t1')
    expect(editor.dirty).toBe(true)
    editor.undo()
    expect(editor.dirty).toBe(false)
  })

  it('finish сбрасывает историю', () => {
    const editor = useEditorStore()
    editor.start(makeNote())
    editor.toggleTodo('t1')
    editor.finish()
    expect(editor.canUndo).toBe(false)
    expect(editor.draft).toBeNull()
  })

  it('черновик пишется в localStorage с задержкой и удаляется при возврате к оригиналу', () => {
    const editor = useEditorStore()
    editor.start(makeNote())
    editor.toggleTodo('t1')
    expect(localStorage.getItem('notes-todo:draft:n1')).toBeNull()
    vi.advanceTimersByTime(600)
    const stored = JSON.parse(localStorage.getItem('notes-todo:draft:n1')!)
    expect(stored.schemaVersion).toBeGreaterThan(0)
    expect(stored.note.todos[0].done).toBe(true)

    editor.undo()
    expect(localStorage.getItem('notes-todo:draft:n1')).toBeNull()
  })

  it('getNoteToSave убирает пустые пункты и не пускает пустое название', () => {
    const editor = useEditorStore()
    editor.start(makeNote())
    editor.addTodo('   ')
    editor.addTodo(' Третий ')
    const saved = editor.getNoteToSave()!
    expect(saved.todos.map((t) => t.text)).toEqual(['Первый', 'Третий'])

    editor.setTitle('  ')
    expect(editor.titleError).not.toBe('')
    expect(editor.getNoteToSave()).toBeNull()
  })
})
