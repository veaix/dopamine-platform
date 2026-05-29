# Интеграция с minecraft-launcher (без правок из этого репозитория автоматически)

Репозиторий `minecraft-launcher` **не изменяется** скриптами dopamine-platform. Скопируйте файлы вручную.

## 1. Установите SDK в лаунчере

```bash
cd path/to/minecraft-launcher
npm install file:../dopamine-platform/packages/account-sdk
```

Или опубликуйте `@dopamine/account-sdk` и подключите из npm.

## 2. Main process

1. Скопируйте `integration/launcher/electron/main/account-sync.js` → `electron/main/account-sync.js`
2. В `electron/main/index.js` после создания `app`:

```js
import { registerAccountIpc } from "./account-sync.js";

// после ipc setup, передайте функцию подсчёта запущенных серверов:
registerAccountIpc(ipcMain, app, () => {
  // верните число running local servers из вашего run-manager
  return 0;
});
```

3. Переменные окружения (или `.env` при dev):

```
DOPAMINE_API_URL=https://your-site.vercel.app
DEVICE_TOKEN_PEPPER=тот же pepper что на сайте
```

## 3. Preload

Добавьте методы из `integration/launcher/electron/preload/account-api-snippet.ts` в `electron/preload/index.ts` и `index.cjs`, затем в `src/services/desktop-api.ts` и `src/types/global.d.ts`.

## 4. UI

Скопируйте `account-panel.tsx` в `src/components/` и вставьте `<AccountPanel />` в настройки.

## 5. Блокировка создания сервера

Перед `createLocalServer` используйте `accountCanCreateServer` (см. `server-create-guard-snippet.ts`).

## 6. Проверка без лаунчера

```bash
cd dopamine-platform
npm run dev
# сайт http://localhost:3000 — зарегистрируйтесь, seed создаст creator
node scripts/test-link.mjs
```
