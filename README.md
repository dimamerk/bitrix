# Bitrix24 OAuth — Next.js + Better Auth

Приложение для авторизации через Bitrix24 с использованием OAuth 2.0.

## Стек

- **Next.js 15** (App Router)
- **Better Auth** — аутентификация
- **SQLite** — хранение сессий и пользователей

## Структура

```
app/
├── page.tsx                        # → редирект на /login
├── login/page.tsx                  # кнопка "Sign in with Bitrix24"
├── auth/bitrix24/page.tsx          # auto-login (ссылка из Bitrix24)
├── dashboard/page.tsx              # защищённая страница
└── api/auth/[...all]/route.ts      # API route для Better Auth
lib/
├── auth.ts                         # серверная конфигурация
└── auth-client.ts                  # клиентская конфигурация
```

## Настройка

### 1. Регистрация OAuth-приложения в Bitrix24

1. Откройте ваш портал Bitrix24
2. Перейдите в **Разработчикам → Другое → Локальное приложение**
3. Укажите **URL обработчика**: `http://localhost:3001/api/auth/callback/bitrix24`
4. Запишите **client_id** и **client_secret**

### 2. Переменные окружения

```bash
cp .env.local.example .env.local
```

Заполните `.env.local`:

```env
BITRIX24_DOMAIN=https://your-company.bitrix24.com
BITRIX24_CLIENT_ID=local.xxxxxxxx.xxxxxxxx
BITRIX24_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BETTER_AUTH_SECRET=your-random-secret-at-least-32-characters-long
BETTER_AUTH_URL=http://localhost:3000
```

### 3. Запуск

```bash
npm install
npx @better-auth/cli generate   # создание таблиц в SQLite
npx @better-auth/cli migrate
npm run dev
```

Откройте http://localhost:3001

## Маршруты

| Маршрут | Описание |
|---------|----------|
| `/login` | Страница входа с кнопкой авторизации |
| `/auth/bitrix24` | Auto-login — ссылка для вставки в Bitrix24 |
| `/dashboard` | Защищённая страница (требует авторизации) |

## Интеграция с Bitrix24

Чтобы пользователи авторизовывались автоматически при переходе из Bitrix24, добавьте ссылку на `/auth/bitrix24` в ваш портал. Пользователь, уже залогиненный в Bitrix24, будет автоматически авторизован без ввода учётных данных.
