from pathlib import Path
from uuid import uuid4
import json
from sqlalchemy.orm import Session

from .db import SessionLocal
from .models import User, UserProfile, Course, Lesson, Achievement, GlossaryTopic, GlossaryTerm


COURSE_SEED = [
    {
        "id": "course_core_ai",
        "title": "Core AI Acronyms",
        "description": "Ключевые аббревиатуры и базовые понятия AI/ML.",
        "domain": "ai",
        "level": "beginner",
        "color": "#2563EB",
        "icon": "fa-brain",
    },
    {
        "id": "course_devops",
        "title": "DevOps & Infrastructure",
        "description": "Коммуникация и терминология вокруг инфраструктуры.",
        "domain": "devops",
        "level": "intermediate",
        "color": "#8b5cf6",
        "icon": "fa-server",
    },
    {
        "id": "course_agile",
        "title": "Agile & Scrum",
        "description": "Глоссарий и рабочие сценарии Agile/Scrum.",
        "domain": "agile",
        "level": "intermediate",
        "color": "#14b8a6",
        "icon": "fa-people-group",
    },
    {
        "id": "course_product",
        "title": "Product & Business",
        "description": "Продуктовая коммуникация и метрики на английском.",
        "domain": "product",
        "level": "intermediate",
        "color": "#f59e0b",
        "icon": "fa-chart-line",
    },
    {
        "id": "course_llm",
        "title": "AI Products & LLMs",
        "description": "Язык LLM продуктов, промптов и UX в AI.",
        "domain": "ai-products",
        "level": "advanced",
        "color": "#ef4444",
        "icon": "fa-robot",
    },
    {
        "id": "course_system_design",
        "title": "System Design & Architecture",
        "description": "Архитектура сервисов, масштабирование и надежность.",
        "domain": "architecture",
        "level": "intermediate",
        "color": "#0ea5e9",
        "icon": "fa-diagram-project",
    },
]


ACHIEVEMENTS_SEED = [
    {
        "id": "ach_first_step",
        "code": "first_step",
        "title": "First Step",
        "description": "Первый attempt выполнен.",
        "tier": 1,
        "icon": "fa-flag",
        "type": "skill",
        "rule_json": {"attempts": 1},
    },
    {
        "id": "ach_three_sessions",
        "code": "three_sessions",
        "title": "3 Sessions",
        "description": "Три попытки выполнены.",
        "tier": 2,
        "icon": "fa-bolt",
        "type": "streak",
        "rule_json": {"attempts": 3},
    },
    {
        "id": "ach_course_finisher",
        "code": "course_finisher",
        "title": "Course Finisher",
        "description": "10/10 уроков в одном курсе.",
        "tier": 3,
        "icon": "fa-graduation-cap",
        "type": "course",
        "rule_json": {"course_lessons_completed": 10},
    },
    {
        "id": "ach_telegram_starter",
        "code": "telegram_starter",
        "title": "Telegram Starter",
        "description": "Первый ответ в Telegram.",
        "tier": 2,
        "icon": "fa-paper-plane",
        "type": "skill",
        "rule_json": {"telegram": True},
    },
    {
        "id": "ach_consistency",
        "code": "consistency",
        "title": "Consistency",
        "description": "7 попыток выполнены.",
        "tier": 3,
        "icon": "fa-calendar-check",
        "type": "streak",
        "rule_json": {"attempts": 7},
    },
    {
        "id": "ach_week_warrior",
        "code": "week_warrior",
        "title": "Week Warrior",
        "description": "7 дней подряд обучения.",
        "tier": 3,
        "icon": "fa-fire",
        "type": "streak",
        "rule_json": {"days_streak": 7},
    },
    {
        "id": "ach_perfect_score",
        "code": "perfect_score",
        "title": "Perfect Score",
        "description": "100% правильных ответов в уроке.",
        "tier": 2,
        "icon": "fa-star",
        "type": "skill",
        "rule_json": {"score": 100},
    },
    {
        "id": "ach_vocab_master",
        "code": "vocab_master",
        "title": "Vocabulary Master",
        "description": "100 слов выучено.",
        "tier": 2,
        "icon": "fa-book",
        "type": "skill",
        "rule_json": {"words_learned": 100},
    },
    {
        "id": "ach_grammar_guru",
        "code": "grammar_guru",
        "title": "Grammar Guru",
        "description": "50 грамматических правил освоено.",
        "tier": 2,
        "icon": "fa-spell-check",
        "type": "skill",
        "rule_json": {"grammar_rules": 50},
    },
    {
        "id": "ach_speaking_champion",
        "code": "speaking_champion",
        "title": "Speaking Champion",
        "description": "10 диалогов завершено.",
        "tier": 2,
        "icon": "fa-microphone",
        "type": "skill",
        "rule_json": {"dialogues_completed": 10},
    },
    {
        "id": "ach_listening_pro",
        "code": "listening_pro",
        "title": "Listening Pro",
        "description": "20 аудио-заданий выполнено.",
        "tier": 2,
        "icon": "fa-headphones",
        "type": "skill",
        "rule_json": {"listening_tasks": 20},
    },
    {
        "id": "ach_writing_expert",
        "code": "writing_expert",
        "title": "Writing Expert",
        "description": "15 письменных заданий выполнено.",
        "tier": 2,
        "icon": "fa-pen",
        "type": "skill",
        "rule_json": {"writing_tasks": 15},
    },
    {
        "id": "ach_month_master",
        "code": "month_master",
        "title": "Month Master",
        "description": "30 дней обучения.",
        "tier": 3,
        "icon": "fa-calendar-days",
        "type": "streak",
        "rule_json": {"days_streak": 30},
    },
    {
        "id": "ach_course_collector",
        "code": "course_collector",
        "title": "Course Collector",
        "description": "3 курса завершено.",
        "tier": 3,
        "icon": "fa-trophy",
        "type": "course",
        "rule_json": {"courses_completed": 3},
    },
    {
        "id": "ach_early_bird",
        "code": "early_bird",
        "title": "Early Bird",
        "description": "10 занятий до 9 утра.",
        "tier": 1,
        "icon": "fa-sun",
        "type": "streak",
        "rule_json": {"morning_sessions": 10},
    },
    {
        "id": "ach_night_owl",
        "code": "night_owl",
        "title": "Night Owl",
        "description": "10 занятий после 22:00.",
        "tier": 1,
        "icon": "fa-moon",
        "type": "streak",
        "rule_json": {"night_sessions": 10},
    },
    {
        "id": "ach_quick_learner",
        "code": "quick_learner",
        "title": "Quick Learner",
        "description": "5 уроков за один день.",
        "tier": 2,
        "icon": "fa-rocket",
        "type": "skill",
        "rule_json": {"lessons_per_day": 5},
    },
    {
        "id": "ach_telegram_pro",
        "code": "telegram_pro",
        "title": "Telegram Pro",
        "description": "50 ответов в Telegram.",
        "tier": 3,
        "icon": "fa-telegram",
        "type": "skill",
        "rule_json": {"telegram_responses": 50},
    },
    {
        "id": "ach_level_up",
        "code": "level_up",
        "title": "Level Up",
        "description": "Повышение уровня (A2→B1, B1→B2 и т.д.).",
        "tier": 3,
        "icon": "fa-arrow-up",
        "type": "skill",
        "rule_json": {"level_increase": True},
    },
    {
        "id": "ach_century_club",
        "code": "century_club",
        "title": "Century Club",
        "description": "100 уроков завершено.",
        "tier": 3,
        "icon": "fa-medal",
        "type": "skill",
        "rule_json": {"lessons_completed": 100},
    },
    {
        "id": "ach_weekend_warrior",
        "code": "weekend_warrior",
        "title": "Weekend Warrior",
        "description": "10 занятий в выходные.",
        "tier": 1,
        "icon": "fa-calendar-week",
        "type": "streak",
        "rule_json": {"weekend_sessions": 10},
    },
    {
        "id": "ach_accuracy_king",
        "code": "accuracy_king",
        "title": "Accuracy King",
        "description": "Средняя точность 90%+ за неделю.",
        "tier": 2,
        "icon": "fa-bullseye",
        "type": "skill",
        "rule_json": {"accuracy_week": 90},
    },
    {
        "id": "ach_all_stars",
        "code": "all_stars",
        "title": "All Stars",
        "description": "Все навыки на уровне B1+.",
        "tier": 3,
        "icon": "fa-stars",
        "type": "skill",
        "rule_json": {"all_skills_b1": True},
    },
    {
        "id": "ach_streak_30",
        "code": "streak_30",
        "title": "30 Days Streak",
        "description": "30 дней подряд обучения.",
        "tier": 3,
        "icon": "fa-calendar-days",
        "type": "streak",
        "rule_json": {"days_streak": 30},
    },
    {
        "id": "ach_sprints_50",
        "code": "sprints_50",
        "title": "Sprint Generator",
        "description": "50 сгенерированных спринтов.",
        "tier": 3,
        "icon": "fa-rocket",
        "type": "skill",
        "rule_json": {"sprints_generated": 50},
    },
]


# Вопросы для курса по аббревиатурам
ABBREVIATIONS_QUESTIONS = {
    "course_core_ai": [
        # Урок 1: Базовые AI-сокращения
        {
            "question": "Что означает аббревиатура AI и где она используется?",
            "options": ["Artificial Intelligence - используется в машинном обучении, робототехнике, обработке естественного языка", "Automated Interface - используется в веб-разработке", "Advanced Internet - используется в сетевых технологиях", "Algorithmic Input - используется в программировании"],
            "correctIndex": 0
        },
        {
            "question": "В чём разница между AI и ML?",
            "options": ["AI - общая концепция, ML - подмножество AI, метод обучения на данных", "ML - общая концепция, AI - подмножество ML", "Это одно и то же", "AI - для роботов, ML - для компьютеров"],
            "correctIndex": 0
        },
        {
            "question": "Что такое ML (Machine Learning) простыми словами?",
            "options": ["Метод, при котором алгоритм учится находить закономерности в данных без явного программирования", "Программирование машин вручную", "Использование готовых алгоритмов", "Автоматическое написание кода"],
            "correctIndex": 0
        },
        {
            "question": "Что означает DL (Deep Learning) и чем он отличается от ML?",
            "options": ["DL - подраздел ML, использующий многослойные нейронные сети для сложных паттернов", "DL - это то же самое, что ML", "ML - подраздел DL", "DL не связан с ML"],
            "correctIndex": 0
        },
        {
            "question": "Что такое LLM (Large Language Model)?",
            "options": ["Нейросеть, обученная на гигантских объемах текста для понимания и генерации человеческой речи", "Маленькая языковая модель", "Модель для работы с числами", "Модель для работы с изображениями"],
            "correctIndex": 0
        },
        {
            "question": "Для каких задач чаще всего используют LLM?",
            "options": ["Генерация текста, перевод, чат-боты, анализ документов", "Обработка изображений", "Работа с базами данных", "Создание веб-сайтов"],
            "correctIndex": 0
        },
        {
            "question": "Что означает NLP (Natural Language Processing)?",
            "options": ["Технологии взаимодействия компьютеров с человеческим языком", "Обработка изображений", "Работа с базами данных", "Создание интерфейсов"],
            "correctIndex": 0
        },
        {
            "question": "Приведи пример задачи для NLP.",
            "options": ["Распознавание именованных сущностей, машинный перевод, анализ тональности текста", "Распознавание лиц", "Обработка видео", "Создание графиков"],
            "correctIndex": 0
        },
        {
            "question": "Что такое CV (Computer Vision)?",
            "options": ["Технология, позволяющая машинам интерпретировать и понимать визуальную информацию", "Создание резюме", "Работа с видео", "Обработка звука"],
            "correctIndex": 0
        },
        {
            "question": "Какие технологии относятся к AI, а какие — к ML?",
            "options": ["AI включает ML, DL, NLP, CV. ML - это метод обучения на данных", "ML включает AI", "Это разные области", "AI и ML не связаны"],
            "correctIndex": 0
        },
        # Урок 2: DevOps и Infrastructure
        {
            "question": "Что означает термин DevOps?",
            "options": ["Культура и практики, объединяющие разработку и эксплуатацию для ускорения доставки ПО", "Только разработка", "Только эксплуатация", "Новый язык программирования"],
            "correctIndex": 0
        },
        {
            "question": "Что такое CI (Continuous Integration)?",
            "options": ["Практика автоматического слияния кода разработчиков в общий репозиторий с автоматическим тестированием", "Ручное тестирование", "Развертывание вручную", "Создание документации"],
            "correctIndex": 0
        },
        {
            "question": "Что такое CD (Continuous Delivery / Deployment)?",
            "options": ["Автоматическое развертывание кода в продакшн после успешных тестов", "Ручное развертывание", "Только тестирование", "Только разработка"],
            "correctIndex": 0
        },
        {
            "question": "Зачем командам нужен CI/CD?",
            "options": ["Для быстрой и безопасной доставки изменений, автоматизации процессов, снижения рисков", "Для замедления разработки", "Для ручной работы", "Для создания документации"],
            "correctIndex": 0
        },
        {
            "question": "Что означает AWS и для чего он используется?",
            "options": ["Amazon Web Services - облачная платформа для хостинга, вычислений, хранения данных", "Операционная система", "Язык программирования", "База данных"],
            "correctIndex": 0
        },
        {
            "question": "Назови пример сервиса, который предоставляет AWS.",
            "options": ["EC2 (виртуальные серверы), S3 (хранилище), Lambda (serverless функции)", "Windows", "Linux", "MySQL"],
            "correctIndex": 0
        },
        {
            "question": "Что означает IaC (Infrastructure as Code)?",
            "options": ["Управление инфраструктурой через код вместо ручной настройки", "Ручная настройка серверов", "Создание документации", "Написание тестов"],
            "correctIndex": 0
        },
        {
            "question": "Почему IaC важен для масштабирования проектов?",
            "options": ["Позволяет быстро воспроизводить инфраструктуру, версионировать изменения, автоматизировать развертывание", "Замедляет процессы", "Требует больше ручной работы", "Не влияет на масштабирование"],
            "correctIndex": 0
        },
        {
            "question": "Что такое Docker и какую проблему он решает?",
            "options": ["Платформа для контейнеризации приложений, решает проблему 'работает на моей машине'", "База данных", "Язык программирования", "Операционная система"],
            "correctIndex": 0
        },
        {
            "question": "Для чего используется Kubernetes (K8s)?",
            "options": ["Оркестрация контейнеров, автоматическое масштабирование, управление развертыванием", "Создание контейнеров", "Написание кода", "Тестирование"],
            "correctIndex": 0
        },
        # Урок 3: Agile, Scrum и митинги
        {
            "question": "Что означает подход Agile?",
            "options": ["Итеративный подход к разработке ПО с фокусом на гибкость и быструю обратную связь", "Водопадная модель", "Последовательная разработка", "Долгосрочное планирование"],
            "correctIndex": 0
        },
        {
            "question": "Что такое Scrum?",
            "options": ["Фреймворк Agile с короткими итерациями (спринтами) и ролями (PO, SM, команда)", "Язык программирования", "База данных", "Инструмент тестирования"],
            "correctIndex": 0
        },
        {
            "question": "Что называется Sprint?",
            "options": ["Короткий период времени (обычно 1-4 недели) для выполнения набора задач", "Долгий проект", "Тестирование", "Документация"],
            "correctIndex": 0
        },
        {
            "question": "Что происходит на Sprint Planning?",
            "options": ["Команда планирует задачи на спринт, выбирает элементы из бэклога", "Подведение итогов", "Тестирование", "Развертывание"],
            "correctIndex": 0
        },
        {
            "question": "Что такое Daily Stand-up?",
            "options": ["Короткая ежедневная встреча команды для синхронизации (что сделал, что буду делать, есть ли блокеры)", "Долгая встреча", "Встреча раз в неделю", "Встреча с клиентом"],
            "correctIndex": 0
        },
        {
            "question": "Для чего проводится Demo?",
            "options": ["Показать заинтересованным сторонам результаты спринта, получить обратную связь", "Планирование", "Тестирование", "Документация"],
            "correctIndex": 0
        },
        {
            "question": "Что такое Retrospective?",
            "options": ["Встреча в конце спринта для обсуждения что прошло хорошо, что улучшить", "Планирование", "Демо", "Тестирование"],
            "correctIndex": 0
        },
        {
            "question": "Кто такой Product Owner (PO)?",
            "options": ["Человек, отвечающий за продукт, приоритизирует задачи, управляет бэклогом", "Разработчик", "Тестировщик", "Дизайнер"],
            "correctIndex": 0
        },
        {
            "question": "Какова роль Scrum Master?",
            "options": ["Фасилитатор процесса, помогает команде следовать Scrum практикам, убирает препятствия", "Разработчик", "Менеджер проекта", "Тестировщик"],
            "correctIndex": 0
        },
        {
            "question": "Что означает MVP (Minimum Viable Product)?",
            "options": ["Минимальная версия продукта с базовым функционалом для проверки гипотезы", "Полная версия продукта", "Прототип", "Документация"],
            "correctIndex": 0
        },
        # Урок 4: Product, Startup и бизнес
        {
            "question": "Что означает слово Startup в IT?",
            "options": ["Молодая компания с инновационной идеей, ищущая бизнес-модель и масштабирование", "Большая корпорация", "Государственная организация", "Некоммерческая организация"],
            "correctIndex": 0
        },
        {
            "question": "Что такое MVP и зачем его делают?",
            "options": ["Минимальная версия продукта для быстрой проверки гипотезы с минимальными затратами", "Полная версия продукта", "Прототип для демонстрации", "Документация"],
            "correctIndex": 0
        },
        {
            "question": "Что означает UX?",
            "options": ["User Experience - опыт пользователя при взаимодействии с продуктом", "User Interface", "User Design", "User Testing"],
            "correctIndex": 0
        },
        {
            "question": "В чём разница между UX и UI?",
            "options": ["UX - весь опыт взаимодействия, UI - визуальный интерфейс (часть UX)", "Это одно и то же", "UI включает UX", "Не связаны"],
            "correctIndex": 0
        },
        {
            "question": "Что означает KPI?",
            "options": ["Key Performance Indicator - ключевые показатели эффективности для измерения успеха", "Key Product Indicator", "Key Process Indicator", "Key Project Indicator"],
            "correctIndex": 0
        },
        {
            "question": "Зачем командам нужны KPI?",
            "options": ["Для измерения прогресса, принятия решений на основе данных, отслеживания целей", "Для красоты", "Для отчетности", "Для планирования"],
            "correctIndex": 0
        },
        {
            "question": "Что показывает ROI (Return on Investment)?",
            "options": ["Окупаемость инвестиций - соотношение прибыли к затратам", "Доход", "Расходы", "Прибыль"],
            "correctIndex": 0
        },
        {
            "question": "Что означает B2B?",
            "options": ["Business to Business - бизнес для бизнеса, продажи компаниям", "Business to Consumer", "Business to Government", "Business to Employee"],
            "correctIndex": 0
        },
        {
            "question": "Что означает B2C?",
            "options": ["Business to Consumer - бизнес для потребителей, продажи конечным пользователям", "Business to Business", "Business to Government", "Business to Employee"],
            "correctIndex": 0
        },
        {
            "question": "Что такое Go-to-Market (GTM) стратегия?",
            "options": ["План вывода продукта на рынок, включая таргетинг, каналы продаж, позиционирование", "Стратегия разработки", "Стратегия тестирования", "Стратегия найма"],
            "correctIndex": 0
        },
        # Урок 5: AI-продукты и работа с моделями
        {
            "question": "Что означает API?",
            "options": ["Application Programming Interface - интерфейс для взаимодействия между приложениями", "Application Process Interface", "Application Product Interface", "Application Program Interface"],
            "correctIndex": 0
        },
        {
            "question": "Зачем AI-продуктам нужен API?",
            "options": ["Для интеграции AI-возможностей в другие приложения, масштабирования, монетизации", "Для хранения данных", "Для тестирования", "Для документации"],
            "correctIndex": 0
        },
        {
            "question": "Что такое Prompt?",
            "options": ["Текст-запрос к языковой модели для получения ответа", "Команда в коде", "Тест", "Документ"],
            "correctIndex": 0
        },
        {
            "question": "Что означает Prompt Engineering?",
            "options": ["Искусство формулирования промптов для получения лучших результатов от LLM", "Программирование", "Тестирование", "Дизайн"],
            "correctIndex": 0
        },
        {
            "question": "Что такое Fine-tuning модели?",
            "options": ["Дообучение предобученной модели на специфических данных для конкретной задачи", "Создание модели с нуля", "Тестирование модели", "Развертывание модели"],
            "correctIndex": 0
        },
        {
            "question": "Чем Fine-tuning отличается от работы с промптами?",
            "options": ["Fine-tuning изменяет веса модели, промпты - только входные данные", "Это одно и то же", "Fine-tuning проще", "Промпты сложнее"],
            "correctIndex": 0
        },
        {
            "question": "Что означает Inference в AI?",
            "options": ["Процесс получения предсказаний от обученной модели на новых данных", "Обучение модели", "Тестирование модели", "Развертывание модели"],
            "correctIndex": 0
        },
        {
            "question": "Что такое Latency и почему она важна?",
            "options": ["Время отклика системы, важно для пользовательского опыта и реального времени", "Точность модели", "Размер модели", "Стоимость модели"],
            "correctIndex": 0
        },
        {
            "question": "Что означает слово Token в LLM?",
            "options": ["Единица текста (слово или часть слова), на которую разбивается входной текст", "Ключ доступа", "Идентификатор", "Пароль"],
            "correctIndex": 0
        },
        {
            "question": "Что такое Context Window и зачем оно нужно?",
            "options": ["Максимальное количество токенов, которые модель может обработать за раз, важно для понимания контекста", "Окно браузера", "Окно приложения", "Окно базы данных"],
            "correctIndex": 0
        },
    ]
}

# Вопросы для курса по AI Products & LLMs
LLM_PRODUCTS_QUESTIONS = [
    {
        "question": "Что означает LLM и где она применяется?",
        "options": [
            "Large Language Model — генерация текста, чат-боты, суммаризация",
            "Low Latency Module — ускорение сетей",
            "Local Logic Machine — локальная база данных",
            "Language Learning Method — метод изучения языка"
        ],
        "correctIndex": 0
    },
    {
        "question": "Зачем нужен prompt в LLM?",
        "options": [
            "Чтобы задать задачу и формат ответа модели",
            "Чтобы увеличить скорость интернета",
            "Чтобы сохранить лог в базе",
            "Чтобы заменить API"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что такое Context Window?",
        "options": [
            "Максимальное число токенов, которое модель видит за раз",
            "Размер окна браузера",
            "Время ответа сервера",
            "Память GPU"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что делает температура (temperature) в LLM?",
        "options": [
            "Управляет разнообразием/креативностью ответа",
            "Увеличивает длину контекста",
            "Снижает цену вызова",
            "Уменьшает задержку сети"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что такое RAG?",
        "options": [
            "Комбинация LLM с внешним поиском знаний",
            "Метод сжатия изображений",
            "Протокол для API",
            "Инструмент мониторинга"
        ],
        "correctIndex": 0
    },
    {
        "question": "Зачем нужны embeddings?",
        "options": [
            "Для поиска похожих текстов и семантического поиска",
            "Для хранения секретов",
            "Для запуска контейнеров",
            "Для шифрования трафика"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что означает top_p?",
        "options": [
            "Порог вероятности для выборки токенов (nucleus sampling)",
            "Максимальная длина ответа",
            "Количество параллельных запросов",
            "Уровень доступа пользователя"
        ],
        "correctIndex": 0
    },
    {
        "question": "Как обычно оценивают качество LLM‑ответов?",
        "options": [
            "Через метрики + human review + тест‑наборы",
            "Только по скорости",
            "Только по длине",
            "Только по цене"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что такое hallucination у LLM?",
        "options": [
            "Правдоподобный, но неверный ответ модели",
            "Ошибки сети",
            "Сбой базы данных",
            "Поломка UI"
        ],
        "correctIndex": 0
    },
    {
        "question": "Зачем нужен Guard/фильтр вывода?",
        "options": [
            "Чтобы блокировать утечки, токсичность и небезопасный контент",
            "Чтобы ускорить рендер",
            "Чтобы хранить кэш",
            "Чтобы заменить логику"
        ],
        "correctIndex": 0
    }
]

# Вопросы для курса по DevOps & Infrastructure
DEVOPS_QUESTIONS = [
    {
        "question": "Что такое CI?",
        "options": [
            "Continuous Integration — частые интеграции кода с автоматическими тестами",
            "Central Interface — интерфейс админа",
            "Cloud Instance — облачная машина",
            "Code Injection — уязвимость"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что означает CD в DevOps?",
        "options": [
            "Continuous Delivery/Deployment — автоматическая доставка/релиз",
            "Central Database",
            "Console Driver",
            "Critical Downtime"
        ],
        "correctIndex": 0
    },
    {
        "question": "Для чего нужен Docker?",
        "options": [
            "Упаковка приложения и зависимостей в контейнер",
            "Хранение данных",
            "Мониторинг",
            "Логирование"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что такое Kubernetes?",
        "options": [
            "Оркестратор контейнеров",
            "Система контроля версий",
            "Язык программирования",
            "База данных"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что означает SLA?",
        "options": [
            "Service Level Agreement",
            "Server Load Average",
            "System Log Archive",
            "Secure Login Access"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что такое SLO?",
        "options": [
            "Service Level Objective",
            "System Load Output",
            "Secure Login Option",
            "Server Log Overview"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что такое Incident Postmortem?",
        "options": [
            "Разбор инцидента с причинами и улучшениями",
            "Резервная копия",
            "План релиза",
            "Обновление зависимостей"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что означает MTTR?",
        "options": [
            "Mean Time To Recovery",
            "Maximum Time To Release",
            "Mean Test To Report",
            "Monthly Time Tracking"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что такое IaC?",
        "options": [
            "Infrastructure as Code",
            "Interface as Code",
            "Internal Access Control",
            "Incident and Compliance"
        ],
        "correctIndex": 0
    },
    {
        "question": "Как называется подход \"работает у меня\"?",
        "options": [
            "Проблема окружений; решается контейнеризацией",
            "Blue-green deployment",
            "Canary release",
            "Zero-downtime"
        ],
        "correctIndex": 0
    }
]

# Вопросы для курса Agile & Scrum
AGILE_QUESTIONS = [
    {
        "question": "Что такое Sprint в Scrum?",
        "options": [
            "Фиксированный цикл разработки (обычно 1–2 недели)",
            "Встреча после релиза",
            "Список багов",
            "Тип тестирования"
        ],
        "correctIndex": 0
    },
    {
        "question": "Daily Standup — это:",
        "options": [
            "Короткий ежедневный синк команды",
            "Длинная презентация прогресса",
            "Ретроспектива",
            "Планирование релиза"
        ],
        "correctIndex": 0
    },
    {
        "question": "Product Backlog содержит:",
        "options": [
            "Список задач и требований к продукту",
            "Только баги",
            "Список сотрудников",
            "Кодовую базу"
        ],
        "correctIndex": 0
    },
    {
        "question": "Scrum Master отвечает за:",
        "options": [
            "Процесс Scrum и устранение блокеров",
            "Техническую архитектуру",
            "Финансы",
            "Дизайн"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что такое Definition of Done?",
        "options": [
            "Критерии завершённости задачи",
            "Список задач спринта",
            "Отчёт о релизе",
            "Документ требований"
        ],
        "correctIndex": 0
    },
    {
        "question": "Retrospective проводится чтобы:",
        "options": [
            "Улучшить процесс команды",
            "Сделать демо клиенту",
            "Написать тесты",
            "Провести onboarding"
        ],
        "correctIndex": 0
    },
    {
        "question": "User Story обычно содержит:",
        "options": [
            "Как <роль>, я хочу <цель>, чтобы <ценность>",
            "Только техническое описание",
            "Финансовые метрики",
            "Дорожную карту"
        ],
        "correctIndex": 0
    },
    {
        "question": "Story Points — это:",
        "options": [
            "Относительная оценка сложности",
            "Часы работы",
            "Количество багов",
            "Число участников"
        ],
        "correctIndex": 0
    },
    {
        "question": "Sprint Review — это:",
        "options": [
            "Демо результата спринта стейкхолдерам",
            "Внутреннее тестирование",
            "Технический аудит",
            "Планирование"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что такое Kanban‑WIP limit?",
        "options": [
            "Ограничение числа задач в работе",
            "Список багов",
            "План релиза",
            "Чеклист тестов"
        ],
        "correctIndex": 0
    }
]

# Вопросы для курса Product & Business
PRODUCT_QUESTIONS = [
    {
        "question": "Что такое North Star Metric?",
        "options": [
            "Ключевая метрика ценности продукта",
            "Количество багов",
            "Скорость разработки",
            "Размер команды"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что означает PMF?",
        "options": [
            "Product-Market Fit — соответствие продукта рынку",
            "Project Management Framework",
            "Performance Monitoring Function",
            "Product Metrics Forecast"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что такое LTV?",
        "options": [
            "Lifetime Value — суммарная ценность клиента",
            "Last Time Visit",
            "Lead Tracking Value",
            "Latency Time Value"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что такое CAC?",
        "options": [
            "Customer Acquisition Cost — стоимость привлечения клиента",
            "Critical Alert Count",
            "Content Approval Cycle",
            "Customer Activity Chart"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что такое Conversion Rate?",
        "options": [
            "Доля пользователей, совершивших целевое действие",
            "Скорость загрузки",
            "Число ошибок",
            "Время отклика"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что означает MVP?",
        "options": [
            "Minimum Viable Product — минимально жизнеспособный продукт",
            "Most Valuable Product",
            "Main Version Plan",
            "Market Value Projection"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что такое A/B тест?",
        "options": [
            "Эксперимент сравнения двух вариантов",
            "Тип безопасности",
            "Архитектурный паттерн",
            "Вид отчёта"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что такое KPI?",
        "options": [
            "Key Performance Indicator — ключевой показатель",
            "Known Product Issue",
            "Kernel Process Index",
            "Knowledge Product Insight"
        ],
        "correctIndex": 0
    },
    {
        "question": "Retention — это:",
        "options": [
            "Удержание пользователей во времени",
            "Привлечение трафика",
            "Скорость выдачи",
            "Количество релизов"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что такое Churn?",
        "options": [
            "Отток пользователей",
            "Рост пользователей",
            "Время отклика",
            "Нагрузка на сервер"
        ],
        "correctIndex": 0
    }
]

# Вопросы для курса System Design & Architecture
SYSTEM_DESIGN_QUESTIONS = [
    {
        "question": "Что означает scalability?",
        "options": [
            "Способность системы расти по нагрузке",
            "Скорость интернета",
            "Количество багов",
            "Тип базы данных"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что такое load balancer?",
        "options": [
            "Компонент, распределяющий трафик между серверами",
            "Инструмент логирования",
            "База данных",
            "Сервис очередей"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что такое latency?",
        "options": [
            "Задержка ответа системы",
            "Объем данных",
            "Количество серверов",
            "Стоимость запроса"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что такое cache?",
        "options": [
            "Быстрое хранилище для ускорения ответа",
            "Резервная копия",
            "Лог ошибок",
            "Система мониторинга"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что означает availability?",
        "options": [
            "Доля времени, когда сервис доступен",
            "Скорость доставки",
            "Размер команды",
            "Сложность кода"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что такое single point of failure?",
        "options": [
            "Компонент, падение которого ломает систему",
            "Нормальная часть архитектуры",
            "Временная метрика",
            "Блокировка в базе"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что такое database replication?",
        "options": [
            "Копирование данных на несколько узлов",
            "Удаление дубликатов",
            "Шифрование данных",
            "Сжатие данных"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что такое sharding?",
        "options": [
            "Разделение данных по нескольким базам",
            "Сжатие логов",
            "Проверка прав",
            "Сбор метрик"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что такое eventual consistency?",
        "options": [
            "Данные становятся согласованными со временем",
            "Мгновенная согласованность",
            "Тип авторизации",
            "Сетевой протокол"
        ],
        "correctIndex": 0
    },
    {
        "question": "Что такое throughput?",
        "options": [
            "Количество запросов, обработанных за время",
            "Скорость интерфейса",
            "Время простоя",
            "Размер базы"
        ],
        "correctIndex": 0
    }
]

COURSE_QUESTION_BANK = {
    "course_llm": LLM_PRODUCTS_QUESTIONS,
    "course_devops": DEVOPS_QUESTIONS,
    "course_agile": AGILE_QUESTIONS,
    "course_product": PRODUCT_QUESTIONS,
    "course_system_design": SYSTEM_DESIGN_QUESTIONS,
}

GLOSSARY_TOPICS = [
    {"id": "topic_ai_core", "slug": "ai-core", "title": "AI Core", "description": "Базовые AI/ML термины", "skill_tag": "ai"},
    {"id": "topic_llm", "slug": "llm", "title": "LLM & Prompting", "description": "LLM, промптинг и RAG", "skill_tag": "ai"},
    {"id": "topic_devops", "slug": "devops", "title": "DevOps & Infra", "description": "Инфраструктура и DevOps", "skill_tag": "devops"},
    {"id": "topic_product", "slug": "product", "title": "Product & Business", "description": "Метрики и продуктовые термины", "skill_tag": "product"},
    {"id": "topic_security", "slug": "security", "title": "Security", "description": "Безопасность и контроль доступа", "skill_tag": "security"},
]


def _pick_topic(term: str) -> str:
    term_lower = term.lower()
    if any(k in term_lower for k in ["llm", "rag", "prompt", "embedding", "transformer", "gpt", "bert"]):
        return "topic_llm"
    if any(k in term_lower for k in ["devops", "kubernetes", "docker", "ci", "cd", "kafka", "prometheus", "grafana"]):
        return "topic_devops"
    if any(k in term_lower for k in ["metric", "kpi", "ltv", "cac", "retention", "churn", "mvp"]):
        return "topic_product"
    if any(k in term_lower for k in ["security", "oauth", "jwt", "tls", "cors", "xss", "csrf", "iam"]):
        return "topic_security"
    return "topic_ai_core"


def _load_glossary_terms() -> list[dict]:
    root = Path(__file__).resolve().parents[2]
    glossary_path = root / "data" / "ai_it_terms.json"
    if glossary_path.exists():
        return json.loads(glossary_path.read_text(encoding="utf-8"))
    return []

def _build_questions(course_title: str, index: int) -> dict:
    correct = f"{course_title} Option A{index}"
    return {
        "question": f"{course_title}: Вопрос {index}. Что означает термин?",
        "options": [
            correct,
            f"{course_title} Option B{index}",
            f"{course_title} Option C{index}",
            f"{course_title} Option D{index}",
        ],
        "correctIndex": 0,
        "explanation": f"Правильный ответ: {correct}.",
    }


def _ensure_explanations(questions: list[dict]) -> list[dict]:
    for q in questions:
        if "explanation" not in q or not q["explanation"]:
            options = q.get("options") or []
            idx = q.get("correctIndex", 0)
            correct = options[idx] if options and idx < len(options) else ""
            q["explanation"] = f"Правильный ответ: {correct}." if correct else "Правильный ответ указан в вариантах."
    return questions


def _expand_bank(questions: list[dict], total: int) -> list[dict]:
    if not questions:
        return []
    expanded: list[dict] = []
    for i in range(total):
        q = dict(questions[i % len(questions)])
        expanded.append(q)
    return expanded


def seed():
    from .db import Base, engine
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        if not db.query(User).filter(User.id == "user_demo").first():
            db.add(
                User(
                    id="user_demo",
                    email="user_demo@smartspeek.local",
                    name="Demo User",
                    avatar="male",
                )
            )
            db.add(UserProfile(user_id="user_demo", fsm_state="", level="unknown", preferences_json={}))

        if db.query(Course).count() == 0:
            for course in COURSE_SEED:
                db.add(Course(**course))

        if db.query(Lesson).count() == 0:
            for course in COURSE_SEED:
                # Для курса по аббревиатурам используем готовые вопросы
                if course["id"] == "course_core_ai" and course["id"] in ABBREVIATIONS_QUESTIONS:
                    questions = _ensure_explanations(ABBREVIATIONS_QUESTIONS[course["id"]])
                    # Разбиваем на 5 уроков по 10 вопросов
                    for lesson_num in range(1, 6):
                        lesson_questions = questions[(lesson_num - 1) * 10:lesson_num * 10]
                        lesson_id = f"{course['id']}_lesson_{lesson_num}"
                        lesson_titles = [
                            "Базовые AI-сокращения",
                            "DevOps и Infrastructure",
                            "Agile, Scrum и митинги",
                            "Product, Startup и бизнес",
                            "AI-продукты и работа с моделями"
                        ]
                        content_json = {
                            "type": "mcq",
                            "items": lesson_questions
                        }
                        db.add(
                            Lesson(
                                id=lesson_id,
                                course_id=course["id"],
                                title=lesson_titles[lesson_num - 1],
                                order_index=lesson_num,
                                type="quiz",
                                content_json=content_json,
                            )
                        )
                elif course["id"] in COURSE_QUESTION_BANK:
                    bank = _ensure_explanations(COURSE_QUESTION_BANK[course["id"]])
                    questions = _expand_bank(bank, 50)
                    for i in range(1, 6):
                        lesson_id = f"{course['id']}_lesson_{i}"
                        lesson_questions = questions[(i - 1) * 10:i * 10]
                        content_json = {
                            "type": "mcq",
                            "items": lesson_questions
                        }
                        db.add(
                            Lesson(
                                id=lesson_id,
                                course_id=course["id"],
                                title=f"{course['title']} — MCQ {i}",
                                order_index=i,
                                type="quiz",
                                content_json=content_json,
                            )
                        )
                else:
                    # Для остальных курсов генерируем вопросы
                    for i in range(1, 6):
                        lesson_id = f"{course['id']}_lesson_{i}"
                        lesson_questions = [_build_questions(course["title"], (i - 1) * 10 + j + 1) for j in range(10)]
                        content_json = {
                            "type": "mcq",
                            "items": lesson_questions
                        }
                        db.add(
                            Lesson(
                                id=lesson_id,
                                course_id=course["id"],
                                title=f"{course['title']} — MCQ {i}",
                                order_index=i,
                                type="quiz",
                                content_json=content_json,
                            )
                        )

        if db.query(Achievement).count() == 0:
            for achievement in ACHIEVEMENTS_SEED:
                db.add(Achievement(**achievement))

        if db.query(GlossaryTopic).count() == 0:
            for topic in GLOSSARY_TOPICS:
                db.add(GlossaryTopic(**topic))

        if db.query(GlossaryTerm).count() == 0:
            terms = _load_glossary_terms()
            for item in terms:
                db.add(
                    GlossaryTerm(
                        id=str(uuid4()),
                        topic_id=_pick_topic(item.get("term", "")),
                        term=item.get("term", ""),
                        definition=item.get("definition", ""),
                        difficulty=None,
                        tags=None,
                    )
                )

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
