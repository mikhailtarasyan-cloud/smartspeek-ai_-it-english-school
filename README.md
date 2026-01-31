# SmartSpeek AI — IT English School

**Персональная AI‑платформа для английского в IT/AI‑среде.**

SmartSpeek AI помогает IT‑специалистам прокачивать английский под рабочие сценарии: стендапы, митинги, инциденты, письма, интервью. Планы обучения и подсказки генерируются через LLM **только на backend** (ключи не уходят на фронт).

---

## Ключевые возможности

- **Персонализация по онбордингу**: роль, уровень, цели, задачи, формат.
- **Учебный план 7 / 21 урок** с интерактивными активностями.
- **Дашборд и аналитика**: прогресс, навыки, достижения.
- **AI Insights**: советы наставника + мотивация.
- **Оркестратор агентов** с Guard‑проверками входа/выхода.
- **JWT‑аутентификация** и защищённые эндпоинты.
- **Backend‑proxy для LLM** (без ключей на фронте).

---

## Технологический стек

### Frontend
- React + TypeScript
- Vite
- Tailwind (CDN)
- D3.js (Skill Tree)

### Backend
- FastAPI
- SQLAlchemy + Alembic
- JWT (python-jose)
- Passlib/bcrypt

### AI
- Gemini API через backend‑proxy (`/api/ai/*`)

---

## Архитектура (кратко)

```
Frontend (React) → /api/* → FastAPI
                                  ├─ Auth (JWT)
                                  ├─ Courses/Progress/Dashboard
                                  ├─ Learning Plan (generate/current/lesson)
                                  ├─ Orchestrator + Guard v2
                                  └─ AI Proxy (Gemini)
```

---

## Быстрый запуск (dev)

### 1) Backend
```bash
cd api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# .env (в папке api)
DATABASE_URL=sqlite:///./smartspeek.db
LLM_API_KEY=YOUR_GEMINI_KEY
JWT_SECRET=change-me
ALLOWED_ORIGINS=http://localhost:3000

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Frontend
```bash
cd ..
npm install
npm run dev
```

Проверки:
- Backend: `http://localhost:8000/api/health`
- Frontend: `http://localhost:3000`

---

## Переменные окружения

### Backend (`api/.env`)
- `DATABASE_URL` — строка подключения
- `LLM_API_KEY` — ключ Gemini (обязательно для генерации)
- `JWT_SECRET` — секрет для токенов
- `JWT_ALGORITHM` — по умолчанию HS256
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `ALLOWED_ORIGINS` — CORS allowlist, через запятую

### Frontend (`.env` или `.env.local`)
- `VITE_API_BASE_URL` — базовый URL API (опционально)
- `GEMINI_MODEL` — модель для LLM (опционально, используется backend)

---

## Основные API

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Courses / Progress
- `GET /api/courses`
- `GET /api/courses/{id}/lessons`
- `GET /api/lessons/{id}`
- `POST /api/lessons/{id}/attempt`
- `GET /api/dashboard`
- `GET /api/progress`

### Learning Plan
- `POST /api/learning-plan/generate`
- `GET /api/learning-plan/current`
- `GET /api/learning-plan/{plan_id}/lessons/{lesson_index}`
- `POST /api/learning-plan/{plan_id}/lessons/{lesson_index}/complete`

### AI Proxy
- `POST /api/ai/process-onboarding`
- `POST /api/ai/tutor-insights`
- `POST /api/ai/evaluate-diagnostic`

---

## Безопасность

- Guard v2 (input/output) — детерминированные проверки
- CORS allowlist
- Security headers
- Rate limiting (auth/orchestrator/ai)
- LLM ключи только на backend

---

## Учебный план (UX)

На экране **«Учебный план»**:
- выбор длительности **7 / 21 урок**
- цели (multi‑select) + поле “своими словами”
- роль и интересы
- кнопки: **Generate / Regenerate / Continue**
- отображается прогресс (0/7 или 0/21)

---

## База данных

Создаётся через SQLAlchemy. Для PostgreSQL — используйте Alembic.
Для SQLite таблицы создаются автоматически.

Основные таблицы:
- `users`, `user_profile`
- `courses`, `lessons`, `lesson_attempts`
- `achievements`, `user_achievements`
- `learning_plans`, `learning_plan_lessons`

---

## Тесты

```bash
cd api
pytest tests/security/
```

---

## Docker

```bash
docker compose up --build
```

---

## Что уже сделано

- JWT‑аутентификация
- AI‑proxy через backend
- Guard v2 (input/output)
- Learning Plan API (generate/current/lesson/complete)
- UI генерации плана (7/21)
- Новые награды + отображение всех наград

---

## Что осталось до MVP

См. `TODO.md` (актуальный список).

---

## Контакты

Если нужно — добавлю блок «Контакты/Support».