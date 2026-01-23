# 📤 Инструкция по загрузке проекта на GitHub

## Шаг 1: Подготовка репозитория

### 1.1. Очистка staging area от ненужных файлов

Перед коммитом нужно убрать из staging area все ненужные файлы (`.venv`, `__pycache__`, базы данных и т.д.):

```bash
# Сбросить все файлы из staging area
git reset

# Добавить только нужные файлы
git add .gitignore
git add .env.example
git add README.md
git add GITHUB_SETUP.md
git add package.json
git add package-lock.json
git add tsconfig.json
git add vite.config.ts
git add index.html
git add index.tsx
git add App.tsx
git add components/
git add services/
git add types.ts
git add constants.ts
git add metadata.json
git add docker-compose.yml
git add Dockerfile
git add .dockerignore

# Backend файлы
git add api/main.py
git add api/alembic.ini
git add api/requirements.txt
git add api/requirements.sqlite.txt
git add api/Dockerfile
git add api/app/
git add api/alembic/

# Исключить ненужные файлы
git reset api/.venv/
git reset api/__pycache__/
git reset api/**/__pycache__/
git reset api/smartspeek.db
git reset api/**/*.pyc
```

### 1.2. Проверка статуса

```bash
git status
```

Убедитесь, что в списке нет:
- `api/.venv/`
- `api/__pycache__/`
- `api/smartspeek.db`
- `node_modules/`
- `.env` файлов

## Шаг 2: Создание первого коммита

```bash
git commit -m "Initial commit: SmartSpeek AI - IT English School MVP

- FastAPI backend with multi-agent orchestration
- React frontend with TypeScript
- PostgreSQL/SQLite database support
- Docker configuration
- Authentication system
- Course management and progress tracking
- Telegram bot integration (basic)
- AI-powered personalized learning plans"
```

## Шаг 3: Создание репозитория на GitHub

### 3.1. Через веб-интерфейс

1. Перейдите на [GitHub.com](https://github.com)
2. Нажмите **"+"** → **"New repository"**
3. Заполните:
   - **Repository name**: `smartspeek-ai-it-english-school` (или другое имя)
   - **Description**: `AI-powered English learning platform for IT professionals`
   - **Visibility**: Public или Private (на ваше усмотрение)
   - **НЕ** создавайте README, .gitignore или license (они уже есть)
4. Нажмите **"Create repository"**

### 3.2. Через GitHub CLI (если установлен)

```bash
gh repo create smartspeek-ai-it-english-school --public --description "AI-powered English learning platform for IT professionals"
```

## Шаг 4: Подключение локального репозитория к GitHub

```bash
# Добавить remote (замените YOUR_USERNAME на ваш GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/smartspeek-ai-it-english-school.git

# Или через SSH (если настроен)
git remote add origin git@github.com:YOUR_USERNAME/smartspeek-ai-it-english-school.git

# Проверить remote
git remote -v
```

## Шаг 5: Загрузка кода на GitHub

```bash
# Переименовать ветку в main (если нужно)
git branch -M main

# Загрузить код
git push -u origin main
```

## Шаг 6: Проверка

1. Откройте ваш репозиторий на GitHub
2. Убедитесь, что все файлы загружены
3. Проверьте, что `.env`, `.venv`, `__pycache__`, `*.db` **НЕ** видны в репозитории

## 🔒 Безопасность

### Проверка перед загрузкой

Убедитесь, что в репозитории **НЕТ**:
- ✅ `.env` файлов (они в `.gitignore`)
- ✅ API ключей в коде
- ✅ Паролей от базы данных
- ✅ `smartspeek.db` (локальная база данных)
- ✅ `.venv/` (виртуальное окружение)

### Если случайно загрузили секреты

1. **Немедленно** смените все API ключи и пароли
2. Удалите файлы из истории Git:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. Или используйте [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

## 📝 Дополнительные настройки

### Добавить описание репозитория

В настройках репозитория на GitHub добавьте:
- **Topics**: `ai`, `english-learning`, `fastapi`, `react`, `typescript`, `education`
- **Website**: (если есть)
- **Description**: обновите описание

### Настроить GitHub Actions (опционально)

Создайте `.github/workflows/ci.yml` для автоматических тестов и деплоя.

## 🚀 После загрузки

1. **Клонирование проекта**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/smartspeek-ai-it-english-school.git
   cd smartspeek-ai-it-english-school
   ```

2. **Настройка окружения**:
   ```bash
   # Frontend
   npm install
   cp .env.example .env.local
   # Отредактируйте .env.local и добавьте GEMINI_API_KEY
   
   # Backend
   cd api
   python3.12 -m venv .venv
   source .venv/bin/activate  # или .venv\Scripts\activate на Windows
   pip install -r requirements.sqlite.txt
   cp ../.env.example .env
   # Отредактируйте .env и добавьте DATABASE_URL
   ```

3. **Запуск**:
   ```bash
   # Или используйте Docker
   docker compose up --build
   ```

## ❓ Проблемы?

### Ошибка: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/smartspeek-ai-it-english-school.git
```

### Ошибка: "failed to push some refs"
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Файлы все еще видны в GitHub
```bash
# Убедитесь, что они в .gitignore
cat .gitignore

# Удалите из кэша Git
git rm -r --cached api/.venv/
git rm --cached api/smartspeek.db
git commit -m "Remove ignored files"
git push
```
