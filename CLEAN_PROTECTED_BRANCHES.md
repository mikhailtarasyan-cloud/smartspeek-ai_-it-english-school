# 🛡️ Очистка защищенных веток (main и dev)

## Текущая ситуация
- ✅ Remote подключен: `https://github.com/mikhailtarasyan-cloud/smartspeek-ai_-it-english-school.git`
- ✅ Ветки: `main`, `dev`, `dev-codex`
- ⚠️ Ветки `main` и `dev` защищены (нельзя делать force push)
- ❌ На GitHub загружены файлы `api/.venv/` и `api/smartspeek.db`

## Решение: Через Pull Request

Поскольку ветки защищены, нужно создать новую ветку, очистить файлы и сделать Pull Request.

### Вариант 1: Через новую ветку и PR (рекомендуется)

```bash
# 1. Переключиться на main и обновить
git checkout main
git pull origin main

# 2. Создать новую ветку для очистки
git checkout -b cleanup/remove-venv-and-db

# 3. Удалить ненужные файлы из индекса
git rm -r --cached api/.venv/ 2>/dev/null || echo "Файлы уже удалены или не отслеживаются"
git rm --cached api/smartspeek.db 2>/dev/null || echo "Файл уже удален или не отслеживается"

# 4. Убедиться, что .gitignore правильный
git add .gitignore

# 5. Создать коммит
git commit -m "chore: remove .venv and database files from repository

- Remove Python virtual environment (api/.venv/)
- Remove SQLite database (api/smartspeek.db)
- These files should not be in version control
- Add proper .gitignore rules"

# 6. Загрузить ветку на GitHub
git push origin cleanup/remove-venv-and-db

# 7. Создать Pull Request на GitHub:
# - Перейти на https://github.com/mikhailtarasyan-cloud/smartspeek-ai_-it-english-school
# - Нажать "Compare & pull request"
# - Выбрать base: main, compare: cleanup/remove-venv-and-db
# - Создать PR и смержить
```

### Вариант 2: Временно снять защиту (быстрее)

Если у вас есть права администратора:

1. **На GitHub:**
   - Settings → Branches
   - Временно отключить защиту для `main` и `dev`

2. **Локально:**
```bash
# Переключиться на main
git checkout main
git pull origin main

# Удалить файлы из истории
git filter-branch --force --index-filter \
  "git rm -rf --cached --ignore-unmatch api/.venv api/smartspeek.db" \
  --prune-empty --tag-name-filter cat -- --all

# Очистить кэш
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Принудительно обновить
git push origin --force main

# То же самое для dev
git checkout dev
git pull origin dev
git filter-branch --force --index-filter \
  "git rm -rf --cached --ignore-unmatch api/.venv api/smartspeek.db" \
  --prune-empty --tag-name-filter cat -- --all
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force dev
```

3. **Вернуть защиту веток на GitHub**

### Вариант 3: Использовать BFG Repo-Cleaner (самый эффективный)

```bash
# 1. Установить BFG (если нет)
# brew install bfg  # на macOS

# 2. Клонировать репозиторий как mirror
cd /tmp
git clone --mirror https://github.com/mikhailtarasyan-cloud/smartspeek-ai_-it-english-school.git

# 3. Удалить файлы
bfg --delete-folders .venv smartspeek-ai_-it-english-school.git
bfg --delete-files smartspeek.db smartspeek-ai_-it-english-school.git

# 4. Очистить
cd smartspeek-ai_-it-english-school.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Принудительно обновить (после снятия защиты)
git push --force
```

## Проверка результата

После очистки проверьте на GitHub:

```bash
# Проверить количество файлов (должно быть ~60-100, не тысячи)
git ls-tree -r origin/main --name-only | wc -l

# Проверить, что .venv и .db удалены
git ls-tree -r origin/main --name-only | grep -E "\.venv|\.db" || echo "✅ Все чисто!"
```

## Рекомендация

**Используйте Вариант 1** (через Pull Request) - это безопаснее и правильнее для защищенных веток.

Если нужно быстро - используйте Вариант 2 (временно снять защиту).

## После очистки

1. ✅ Убедитесь, что `.gitignore` содержит:
   ```
   .venv/
   venv/
   *.db
   *.sqlite
   __pycache__/
   ```

2. ✅ Добавьте в README инструкцию:
   ```bash
   # Создать виртуальное окружение
   cd api
   python3.12 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.sqlite.txt
   ```

3. ✅ Проверьте размер репозитория (должен быть < 5 MB)
