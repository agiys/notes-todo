export interface Todo {
  id: string
  text: string
  done: boolean
}

export interface Note {
  id: string
  title: string
  todos: Todo[]
  createdAt: number
  updatedAt: number
}

export type Patch =
  | { type: 'title'; from: string; to: string }
  | { type: 'todoText'; id: string; from: string; to: string }
  | { type: 'todoDone'; id: string; from: boolean; to: boolean }
  | { type: 'todoAdd'; todo: Todo; index: number }
  | { type: 'todoRemove'; todo: Todo; index: number }
