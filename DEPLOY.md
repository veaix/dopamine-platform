# Деплой dopamine-platform (Vercel + Turso)

Вы уже зарегистрировались на [Vercel](https://vercel.com/new) и [Turso](https://app.turso.tech/dopamine). Дальше — по шагам.

## 1. Turso — база данных

1. Откройте [Turso → dopamine](https://app.turso.tech/dopamine).
2. Создайте базу (если ещё нет), например `dopamine-prod`.
3. Вкладка **Connect** → скопируйте:
   - **Database URL** (`libsql://….turso.io`)
   - **Auth Token** (создайте token, если нет)

## 2. GitHub — репозиторий платформы

```bash
cd dopamine-platform
git init
git add .
git commit -m "feat: dopamine platform portal and API"
gh repo create dopamine-platform --public --source=. --push
```

(или импортируйте папку вручную на github.com)

## 3. Vercel — сайт

1. [vercel.com/new](https://vercel.com/new) → **Import** репозиторий `dopamine-platform`.
2. **Root Directory:** `web`
3. **Environment Variables** (Settings → Environment Variables):

| Name | Value |
|------|--------|
| `TURSO_DATABASE_URL` | `libsql://…` из Turso |
| `TURSO_AUTH_TOKEN` | token из Turso |
| `JWT_ACCESS_SECRET` | случайная строка 32+ символов |
| `JWT_REFRESH_SECRET` | другая случайная строка |
| `DEVICE_TOKEN_PEPPER` | ещё одна случайная строка |
| `CREATOR_EMAIL` | ваш email для админки |
| `CREATOR_PASSWORD` | надёжный пароль |
| `NEXT_PUBLIC_SITE_URL` | `https://ВАШ-ПРОЕКТ.vercel.app` |
| `NEXT_PUBLIC_API_URL` | то же самое |

4. **Deploy**.

5. После первого деплоя откройте в браузере (один раз, от имени creator после регистрации на сайте):

   Локально: `npm run db:seed -w web`  
   На Vercel: зарегистрируйтесь на сайте с `CREATOR_EMAIL` / `CREATOR_PASSWORD` **или** выполните seed локально с Turso URL в `.env.local`.

## 4. Лаунчер (копия)

В **Настройки → Обслуживание → Аккаунт dopamine** укажите:

```
https://ВАШ-ПРОЕКТ.vercel.app
```

Тот же `DEVICE_TOKEN_PEPPER` добавьте при сборке лаунчера (опционально):

```
set DEVICE_TOKEN_PEPPER=ваш-pepper
set DOPAMINE_API_URL=https://ВАШ-ПРОЕКТ.vercel.app
```

## 5. Проверка

1. Сайт `/stats` — статистика открывается.
2. `/admin` — вход под creator, сгенерировать ключ.
3. Лаунчер — код из `/dashboard` → привязка → активация ключа → создание сервера.

## CLI (альтернатива)

```bash
npx vercel link --cwd web
npx vercel env add TURSO_DATABASE_URL
npx vercel --prod --cwd web
```

Turso CLI:

```bash
npx @tursodatabase/cli auth login
npx @tursodatabase/cli db tokens create dopamine-prod
```
