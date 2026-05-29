# dopamine-platform

Портал аккаунта, API и SDK для лаунчера **dopamine**.  
Репозиторий `minecraft-launcher` **не изменяется** — интеграция через копирование файлов из `integration/`.

## Быстрый старт (локально, бесплатно)

```bash
cd dopamine-platform
npm install
cp web/.env.local.example web/.env.local
npm run db:seed -w web
npm run dev
```

Откройте http://localhost:3000

- **Создатель (админ):** `creator@dopamine.local` / `ChangeMeNow123!` (из `.env.local`)
- **Админка:** /admin — ключи, пользователи, режим «серверы только по ключу»
- **Статистика:** /stats

## Бесплатный деплой

| Часть | Сервис | Free tier |
|-------|--------|-----------|
| Сайт + API | [Vercel](https://vercel.com) | Next.js hobby |
| БД | [Turso](https://turso.tech) | SQLite edge |

### Vercel

1. New Project → корень `dopamine-platform/web` (или monorepo root с Root Directory `web`)
2. Environment variables (из `.env.example` + Turso):

```
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
DEVICE_TOKEN_PEPPER=...
CREATOR_EMAIL=...
CREATOR_PASSWORD=...
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
```

3. Deploy

### Turso

```bash
turso db create dopamine-platform
turso db tokens create dopamine-platform
```

Укажите URL и token в Vercel.

### GitHub Pages?

Только статика — **API и БД не работают на Pages**. Используйте Vercel + Turso.

## API (лаунчер)

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | — |
| POST | `/api/auth/login` | — |
| POST | `/api/devices/link` | — (код) |
| GET | `/api/me/entitlements` | device token / session |
| POST | `/api/heartbeat` | device token + HMAC sig |
| POST | `/api/keys/redeem` | device / session |
| GET | `/api/stats/public` | — |

Device token: заголовок `Authorization: Bearer dev_...` или `X-Device-Token`.

## Структура

```
dopamine-platform/
  web/                 Next.js сайт + API
  packages/account-sdk TypeScript SDK для лаунчера
  integration/         файлы для ручного merge в minecraft-launcher
  scripts/             тесты
```

## Лаунчер

См. [integration/README.md](./integration/README.md).
