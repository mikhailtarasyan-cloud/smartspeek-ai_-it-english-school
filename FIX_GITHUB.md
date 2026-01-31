# 🔧 Инструкция по очистке GitHub репозитория

## Текущая ситуация
- ✅ Файлы `.venv/` и `smartspeek.db` существуют локально
- ❌ На GitHub они уже загружены (2534+ файла из .venv)
- ❌ Локально нет коммитов, но на GitHub есть

## Решение: Создать чистый коммит

### Шаг 1: Подключить remote (если еще не подключен)

```bash
# Замените YOUR_USERNAME и REPO_NAME на ваши данные
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Или если уже подключен, проверьте:
git remote -v
```

### Шаг 2: Скачать текущее состояние с GitHub

```bash
git fetch origin
git checkout -b main origin/main 2>/dev/null || git checkout main
```

### Шаг 3: Удалить ненужные файлы из истории

```bash
# Удалить .venv из всех коммитов
git filter-branch --force --index-filter \
  "git rm -rf --cached --ignore-unmatch api/.venv" \
  --prune-empty --tag-name-filter cat -- --all

# Удалить базу данных
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch api/smartspeek.db" \
  --prune-empty --tag-name-filter cat -- --all

# Очистить кэш
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Шаг 4: Принудительно обновить GitHub

```bash
git push origin --force --all
```

---

## Альтернатива: Создать новый чистый коммит (проще)

Если не хотите возиться с историей, можно просто создать новый коммит без ненужных файлов:

### Шаг 1: Подключить remote

```bash
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
```

### Шаг 2: Добавить только нужные файлы

```bash
# Убедитесь, что .gitignore правильный
git add .gitignore

# Добавить только исходный код (НЕ .venv, НЕ .db)
git add .dockerignore README.md GITHUB_SETUP.md GITHUB_CHECK.md TODO.md FIX_GITHUB.md
git add package.json package-lock.json tsconfig.json vite.config.ts
git add index.html index.tsx App.tsx
git add components/ services/ types.ts constants.ts metadata.json
git add docker-compose.yml Dockerfile

# Backend - только исходный код
git add api/main.py api/alembic.ini api/requirements.txt api/requirements.sqlite.txt api/Dockerfile
git add api/app/ api/alembic/

# НЕ добавляем:
# - api/.venv/
# - api/smartspeek.db
# - api/__pycache__/
```

### Шаг 3: Проверить перед коммитом

```bash
# Проверить, что .venv и .db НЕ в списке
git status | grep -E "\.venv|\.db" || echo "✅ Все чисто!"
```

### Шаг 4: Создать коммит

```bash
git commit -m "Clean repository: remove .venv and database files

- Remove Python virtual environment (api/.venv/)
- Remove SQLite database (api/smartspeek.db)
- Keep only source code and configuration files"
```

### Шаг 5: Загрузить на GitHub

```bash
# Если на GitHub уже есть коммиты с .venv, нужно принудительно обновить
git push origin --force main

# Или если это первый коммит
git push -u origin main
```

---

## ⚠️ ВАЖНО: После force push

Если использовали `--force`, всем, кто клонировал репозиторий, нужно будет:

```bash
git fetch origin
git reset --hard origin/main
```

Или просто переклонировать репозиторий.

---

## Проверка результата

После выполнения проверьте на GitHub:
1. ✅ Нет папки `api/.venv/`
2. ✅ Нет файла `api/smartspeek.db`
3. ✅ Размер репозитория < 5 MB
4. ✅ Количество файлов ~60-100 (не тысячи)