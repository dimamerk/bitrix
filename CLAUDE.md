# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Обзор

Next.js 15 (App Router) приложение для OAuth 2.0 авторизации через Bitrix24 с использованием Better Auth и SQLite.

## Команды

```bash
npm run dev          # запуск dev-сервера
npm run build        # production сборка
npx @better-auth/cli generate  # генерация/миграция таблиц SQLite
```

## Архитектура

**Аутентификация** построена на Better Auth с плагином `genericOAuth` для Bitrix24:
- `lib/auth.ts` — серверная конфигурация (провайдер, БД, маппинг полей пользователя)
- `lib/auth-client.ts` — клиентский экземпляр для использования в React-компонентах
- `app/api/auth/[...all]/route.ts` — catch-all API route, обрабатывает весь OAuth flow

**Два способа входа:**
- `/login` — страница с кнопкой "Sign in with Bitrix24" (ручной вход)
- `/auth/bitrix24` — auto-login страница (для ссылки из портала Bitrix24, авторизует без UI)

**Защита маршрутов:** `app/dashboard/page.tsx` — серверный компонент, проверяет сессию через `auth.api.getSession()` и редиректит на `/login` при отсутствии.

## Переменные окружения

Шаблон в `.env.local.example`. Обязательные: `BITRIX24_DOMAIN`, `BITRIX24_CLIENT_ID`, `BITRIX24_CLIENT_SECRET`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.
