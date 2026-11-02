# Notes Todo

SPA для заметок со списком задач на Nuxt 3, Pinia и SCSS.

## Запуск

```bash
docker-compose up
```

Приложение откроется на http://localhost:3000.

Локально:

```bash
npm install
npm run dev
npm test
```

## Устройство

- `utils/history.ts` — история изменений на патчах, лимит 50 записей
- `stores/editor.ts` — состояние редактирования, undo/redo, черновик
- `stores/notes.ts` — список заметок и запись в localStorage с debounce
- `utils/storage.ts` — версия схемы и миграции
