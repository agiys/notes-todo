import { describe, expect, it } from 'vitest'
import { History, HISTORY_LIMIT, applyPatch, invertPatch } from '~/utils/history'
import type { Note } from '~/types/note'

const makeNote = (): Note => ({
  id: 'n1',
  title: 'Список',
  todos: [
    { id: 't1', text: 'Молоко', done: false },
    { id: 't2', text: 'Хлеб', done: true }
  ],
  createdAt: 1,
  updatedAt: 1
})

describe('applyPatch / invertPatch', () => {
  it('меняет заголовок и откатывает его', () => {
    const patch = { type: 'title', from: 'Список', to: 'Покупки' } as const
    const changed = applyPatch(makeNote(), patch)
    expect(changed.title).toBe('Покупки')
    expect(applyPatch(changed, invertPatch(patch)).title).toBe('Список')
  })

  it('меняет текст и отметку пункта', () => {
    let note = applyPatch(makeNote(), { type: 'todoText', id: 't1', from: 'Молоко', to: 'Кефир' })
    note = applyPatch(note, { type: 'todoDone', id: 't1', from: false, to: true })
    expect(note.todos[0]).toEqual({ id: 't1', text: 'Кефир', done: true })
  })

  it('добавление и удаление пункта взаимно обратимы', () => {
    const todo = { id: 't3', text: 'Сыр', done: false }
    const add = { type: 'todoAdd', todo, index: 1 } as const
    const added = applyPatch(makeNote(), add)
    expect(added.todos.map((t) => t.id)).toEqual(['t1', 't3', 't2'])
    const removed = applyPatch(added, invertPatch(add))
    expect(removed.todos.map((t) => t.id)).toEqual(['t1', 't2'])
    expect(applyPatch(removed, invertPatch(invertPatch(add))).todos[1].id).toBe('t3')
  })

  it('не мутирует исходную заметку', () => {
    const note = makeNote()
    applyPatch(note, { type: 'todoDone', id: 't1', from: false, to: true })
    expect(note.todos[0].done).toBe(false)
  })
})

describe('History', () => {
  it('undo и redo проходят по записям', () => {
    const history = new History()
    let note = makeNote()
    const patch = { type: 'title', from: 'Список', to: 'Дела' } as const
    note = applyPatch(note, patch)
    history.push(patch)

    expect(history.canUndo).toBe(true)
    note = history.undo(note)!
    expect(note.title).toBe('Список')
    expect(history.canRedo).toBe(true)
    note = history.redo(note)!
    expect(note.title).toBe('Дела')
    expect(history.canRedo).toBe(false)
  })

  it('возвращает null, когда откатывать нечего', () => {
    const history = new History()
    expect(history.undo(makeNote())).toBeNull()
    expect(history.redo(makeNote())).toBeNull()
  })

  it('новая запись после undo очищает redo-ветку', () => {
    const history = new History()
    let note = makeNote()
    const first = { type: 'todoDone', id: 't1', from: false, to: true } as const
    note = applyPatch(note, first)
    history.push(first)
    note = history.undo(note)!
    expect(history.canRedo).toBe(true)

    const second = { type: 'title', from: 'Список', to: 'Другое' } as const
    note = applyPatch(note, second)
    history.push(second)
    expect(history.canRedo).toBe(false)
    expect(history.size).toBe(1)
  })

  it('хранит не больше 50 записей и отбрасывает самые старые', () => {
    const history = new History()
    let note = makeNote()
    for (let i = 0; i < HISTORY_LIMIT + 10; i++) {
      const patch = { type: 'title', from: `v${i}`, to: `v${i + 1}` } as const
      note = applyPatch(note, patch)
      history.push(patch)
    }
    expect(history.size).toBe(HISTORY_LIMIT)

    let steps = 0
    while (history.canUndo) {
      note = history.undo(note)!
      steps++
    }
    expect(steps).toBe(HISTORY_LIMIT)
    expect(note.title).toBe('v10')
  })

  it('clear сбрасывает историю', () => {
    const history = new History()
    history.push({ type: 'title', from: 'a', to: 'b' })
    history.clear()
    expect(history.canUndo).toBe(false)
    expect(history.canRedo).toBe(false)
  })
})
