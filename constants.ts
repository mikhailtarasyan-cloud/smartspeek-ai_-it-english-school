
import { Course, UpcomingLesson, SkillNode, Achievement, AITerm, DiagnosticStep, LearningPlan } from './types';

export const COLORS = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  textDark: '#111827',
  textMuted: '#374151',
  border: '#E5E7EB',
  bgLight: '#F9FAFB',
  success: '#22C55E'
};

export const ONBOARDING_QUESTIONS = [
  {
    id: 'gender',
    type: 'single_select',
    title: 'Выберите аватар',
    question: 'Как вы хотите выглядеть в системе?',
    options: [
      { value: "male", label: "Парень (Tech Enthusiast)" },
      { value: "female", label: "Девушка (AI Specialist)" }
    ]
  },
  {
    id: 'role',
    type: 'single_select',
    title: 'Профиль / Роль',
    question: 'Какую основную роль вы занимаете?',
    options: [
      { value: "software_developer", label: "Software Developer" },
      { value: "data_scientist", label: "Data Scientist" },
      { value: "ml_engineer", label: "ML Engineer" },
      { value: "prompt_engineer", label: "Prompt Engineer" },
      { value: "devops", label: "DevOps" },
      { value: "product_manager", label: "Product Manager" },
      { value: "ui_ux_designer", label: "UI/UX Designer" },
      { value: "qa_engineer", label: "QA Engineer" }
    ]
  },
  {
    id: 'english_level',
    type: 'single_select',
    title: 'Уровень английского',
    question: 'Ваш текущий уровень английского?',
    options: [
      { value: "A1", label: "A1 (Beginner)" },
      { value: "A2", label: "A2 (Elementary)" },
      { value: "B1", label: "B1 (Intermediate)" },
      { value: "B2", label: "B2 (Upper Intermediate)" },
      { value: "C1", label: "C1 (Advanced)" }
    ]
  },
  {
    id: 'goals',
    type: 'multi_select',
    max: 2,
    title: 'Цели обучения',
    question: 'Ваши основные цели обучения (выберите до 2-х):',
    options: [
      { value: "career_growth", label: "Карьерный рост" },
      { value: "job_interview", label: "Собеседование" },
      { value: "international_team", label: "Международная команда" },
      { value: "freelance_clients", label: "Фриланс / Клиенты" },
      { value: "relocation", label: "Релокация" },
      { value: "startup", label: "Стартап" }
    ]
  },
  {
    id: 'work_tasks',
    type: 'multi_select',
    title: 'Рабочие задачи',
    question: 'С какими задачами вы сталкиваетесь чаще всего?',
    options: [
      { value: "documentation", label: "Документация" },
      { value: "chat_communication", label: "Переписка в чатах" },
      { value: "meetings", label: "Митинги / Созвоны" },
      { value: "presentations", label: "Презентации" },
      { value: "technical_discussions", label: "Технические дискуссии" },
      { value: "code_review", label: "Code Review" }
    ]
  },
  {
    id: 'tech_vocab_level',
    type: 'single_select',
    title: 'Уровень IT-терминологии',
    question: 'Как вы оцениваете свой уровень IT-терминологии на английском?',
    options: [
      { value: "beginner", label: "Начинающий" },
      { value: "intermediate", label: "Средний" },
      { value: "advanced", label: "Продвинутый" }
    ]
  },
  {
    id: 'speaking_issue',
    type: 'single_select',
    title: 'Основная проблема в Speaking',
    question: 'Что вас больше всего беспокоит в разговорном английском?',
    options: [
      { value: "pronunciation", label: "Произношение" },
      { value: "fluency", label: "Беглость речи" },
      { value: "vocabulary", label: "Нехватка слов" },
      { value: "confidence", label: "Уверенность" }
    ]
  },
  {
    id: 'grammar_attitude',
    type: 'single_select',
    title: 'Отношение к грамматике',
    question: 'Как вы относитесь к изучению грамматики?',
    options: [
      { value: "love", label: "Люблю, хочу углубляться" },
      { value: "neutral", label: "Нейтрально, нужно для работы" },
      { value: "dislike", label: "Не люблю, но понимаю важность" }
    ]
  },
  {
    id: 'learning_format',
    type: 'multi_select',
    title: 'Формат обучения',
    question: 'Какие форматы обучения вам подходят?',
    options: [
      { value: "mcq", label: "Тесты и викторины" },
      { value: "dialogue", label: "Диалоги с AI" },
      { value: "writing", label: "Письменные задания" },
      { value: "listening", label: "Аудирование" }
    ]
  },
  {
    id: 'time_commitment',
    type: 'single_select',
    title: 'Время на обучение',
    question: 'Сколько времени вы можете уделять обучению в день?',
    options: [
      { value: "5", label: "5 минут" },
      { value: "10", label: "10 минут" },
      { value: "20", label: "20 минут" },
      { value: "30+", label: "30+ минут" }
    ]
  },
  {
    id: 'success_criteria',
    type: 'single_select',
    title: 'Критерий успеха',
    question: 'Что для вас будет означать успех в обучении?',
    options: [
      { value: "job_interview", label: "Успешное собеседование" },
      { value: "team_communication", label: "Свободное общение в команде" },
      { value: "presentation", label: "Уверенные презентации" },
      { value: "level_up", label: "Повышение уровня (B1→B2)" }
    ]
  }
];

export const DIAGNOSTIC_STEPS: DiagnosticStep[] = [
  {
    id: 'grammar_1',
    type: 'grammar',
    title: 'Грамматика: Времена',
    question: 'I ___ (work) on this feature since yesterday morning.',
    options: ['am working', 'worked', 'have been working', 'work']
  }
];

export const SAMPLE_PLAN: LearningPlan = {
  id: 'lp_full_7_days',
  goal_id: 'g1',
  duration_days: 7,
  rationale: 'Этот план подготовлен нейро-оркестратором для максимально быстрого погружения в англоязычную IT-среду.',
  schedule: [
    {
      day: 1,
      title: 'IT-Daily: Скрам и статусы',
      steps: [
        { id: 'd1s1', title: 'Vocab: Phrases for Daily Standup', type: 'speaking', status: 'current' },
        { id: 'd1s2', title: 'Grammar: Present Perfect for task results', type: 'grammar', status: 'pending' },
        { id: 'd1s3', title: 'Practice: simulated status update', type: 'dialogue', status: 'pending' }
      ]
    },
    {
      day: 2,
      title: 'Incident Management & Severity',
      steps: [
        { id: 'd2s1', title: 'Reading: Post-mortem reports', type: 'reading', status: 'pending' },
        { id: 'd2s2', title: 'Vocab: System outages terminology', type: 'speaking', status: 'pending' },
        { id: 'd2s3', title: 'Writing: Critical incident announcement', type: 'writing', status: 'pending' }
      ]
    },
    {
      day: 3,
      title: 'Effective Code Review',
      steps: [
        { id: 'd3s1', title: 'Listening: Engineering feedback calls', type: 'listening', status: 'pending' },
        { id: 'd3s2', title: 'Grammar: Indirect questions for PRs', type: 'grammar', status: 'pending' },
        { id: 'd3s3', title: 'Quiz: Technical terms in GitHub/GitLab', type: 'quiz', status: 'pending' }
      ]
    },
    {
      day: 4,
      title: 'Architecture & Scalability',
      steps: [
        { id: 'd4s1', title: 'Vocab: Microservices and Monoliths', type: 'reading', status: 'pending' },
        { id: 'd4s2', title: 'Dialogue: Explaining your backend stack', type: 'dialogue', status: 'pending' },
        { id: 'd4s3', title: 'Speaking: Pros and cons of Cloud providers', type: 'speaking', status: 'pending' }
      ]
    },
    {
      day: 5,
      title: 'Hiring & Career Pitch',
      steps: [
        { id: 'd5s1', title: 'Vocab: Behavioral interview questions', type: 'speaking', status: 'pending' },
        { id: 'd5s2', title: 'AI Roleplay: Tell me about your failure', type: 'dialogue', status: 'pending' },
        { id: 'd5s3', title: 'Pronunciation: Clarity in tech speech', type: 'speaking', status: 'pending' }
      ]
    },
    {
      day: 6,
      title: 'DevOps & Pipeline automation',
      steps: [
        { id: 'd6s1', title: 'Vocab: CI/CD stages and tools', type: 'reading', status: 'pending' },
        { id: 'd6s2', title: 'Grammar: Passive voice in reports', type: 'grammar', status: 'pending' },
        { id: 'd6s3', title: 'Writing: Deploy notes and changelog', type: 'writing', status: 'pending' }
      ]
    },
    {
      day: 7,
      title: 'Path Mastery: Final Demo',
      steps: [
        { id: 'd7s1', title: 'Diagnostic: Final Sprint Quiz', type: 'diagnostic', status: 'pending' },
        { id: 'd7s2', title: 'AI Dialogue: Presenting your MVP', type: 'dialogue', status: 'pending' },
        { id: 'd7s3', title: 'Achievement: Path Unlocked!', type: 'quiz', status: 'pending' }
      ]
    }
  ]
};

export const COURSES_DATA: Course[] = [
  { 
    id: '1', 
    name: 'Аббревиатуры AI и IT', 
    description: 'Полный справочник современной терминологии.',
    progress: 10, 
    totalLessons: 5, 
    completedLessons: 0, 
    color: '#2563EB',
    icon: 'fa-brain',
    lessons: [
      {
        id: 'ab_1',
        title: '🧩 БЛОК 1. Базовые AI-аббревиатуры',
        description: 'LLM, NLP, ML, DL и другие основы.',
        type: 'quiz',
        status: 'available',
        questions: [
          { id: 'q1', text: 'Что означает аббревиатура LLM?', options: ['Large Language Model', 'Low Level Machine', 'Live Language Monitor', 'Local Logic Module'], correctAnswer: 'Large Language Model', explanation: 'LLM (Large Language Model) — это нейросеть, обученная на гигантских объемах текста для понимания и генерации человеческой речи.' },
          { id: 'q2', text: 'Что означает AI?', options: ['Artificial Intelligence', 'Automated Interface', 'Advanced Internet', 'Algorithmic Input'], correctAnswer: 'Artificial Intelligence', explanation: 'Искусственный интеллект — область науки, занимающаяся созданием систем, способных выполнять задачи, требующие человеческого интеллекта.' },
          { id: 'q3', text: 'Что означает ML?', options: ['Machine Learning', 'Manual Logic', 'Model Language', 'Machine Layer'], correctAnswer: 'Machine Learning', explanation: 'Машинное обучение — это метод обучения ИИ, при котором алгоритм учится находить закономерности в данных без явного программирования.' },
          { id: 'q4', text: 'Что означает DL?', options: ['Deep Learning', 'Data Logic', 'Digital Layer', 'Distributed Learning'], correctAnswer: 'Deep Learning', explanation: 'Глубокое обучение — подраздел ML, использующий многослойные нейронные сети.' },
          { id: 'q5', text: 'Что означает NLP?', options: ['Natural Language Processing', 'Neural Learning Process', 'Network Logic Protocol', 'Natural Logic Program'], correctAnswer: 'Natural Language Processing', explanation: 'NLP (Natural Language Processing) — технологии взаимодействия компьютеров с человеческим языком.' },
          { id: 'q6', text: 'Что означает CV в AI?', options: ['Computer Vision', 'Code Version', 'Control Variable', 'Core Value'], correctAnswer: 'Computer Vision', explanation: 'Компьютерное зрение позволяет машинам интерпретировать и понимать визуальную информацию из изображений и видео.' },
          { id: 'q7', text: 'Что означает AGI?', options: ['Artificial General Intelligence', 'Advanced Graphic Interface', 'Automated Global Internet', 'Algorithmic General Input'], correctAnswer: 'Artificial General Intelligence', explanation: 'Сильный ИИ — теоретический уровень интеллекта, способный решить любую задачу так же хорошо, как человек.' },
          { id: 'q8', text: 'Что означает ASR?', options: ['Automatic Speech Recognition', 'Audio Signal Routing', 'Advanced Speech Reasoning', 'Automated Sound Response'], correctAnswer: 'Automatic Speech Recognition', explanation: 'Автоматическое распознавание речи (перевод звука в текст).' },
          { id: 'q9', text: 'Что означает TTS?', options: ['Text-to-Speech', 'Token Transfer System', 'Text Translation Service', 'Technical Text Scan'], correctAnswer: 'Text-to-Speech', explanation: 'Технология преобразования текста в синтезированную речь.' },
          { id: 'q10', text: 'Что означает RL?', options: ['Reinforcement Learning', 'Real Logic', 'Runtime Language', 'Recursive Layer'], correctAnswer: 'Reinforcement Learning', explanation: 'Обучение с подкреплением — обучение через систему наград и штрафов.' },
        ]
      }
    ]
  },
  { 
    id: '2', 
    name: 'DevOps Communication', 
    description: 'Эффективное общение в SRE и Platform командах.',
    progress: 0, 
    totalLessons: 4, 
    completedLessons: 0, 
    color: '#8b5cf6',
    icon: 'fa-server',
    lessons: [
      {
        id: 'dev_1',
        title: '📞 Handling Incident Calls',
        description: 'Паттерны коммуникации во время крупных сбоев.',
        type: 'quiz',
        status: 'available',
        questions: [
          { id: 'dq1', text: 'Как профессионально сказать "сервис упал"?', options: ['Service is dead', 'Service is down', 'Service is sleeping', 'Service is quiet'], correctAnswer: 'Service is down', explanation: '"Service is down" — стандартный индустриальный термин для обозначения отказа или недоступности системы.' },
          { id: 'dq2', text: 'Что такое "post-mortem" в IT?', options: ['Празднование релиза', 'Отчет о расследовании инцидента', 'Новый сервер', 'Ошибка в коде'], correctAnswer: 'An incident investigation report', explanation: 'Post-mortem — это документ, анализирующий причины сбоя и предлагающий меры по его предотвращению в будущем.' }
        ]
      },
      {
        id: 'dev_2',
        title: '📊 Explaining Scalability',
        description: 'Презентация архитектурных решений стейкхолдерам.',
        type: 'quiz',
        status: 'available',
        questions: [
           { id: 'dq3', text: 'Что такое "Horizontal Scaling"?', options: ['Увеличение CPU на одной машине', 'Добавление новых серверов в пул', 'Поворот сервера', 'Очистка базы данных'], correctAnswer: 'Adding more machines to the pool', explanation: 'Горизонтальное масштабирование означает добавление новых узлов в систему, а не увеличение мощности одного узла.' }
        ]
      }
    ]
  },
];

export const LESSONS: UpcomingLesson[] = [
  { id: '1', title: 'Daily Standup Practice', course: 'English for IT', time: '10:00', duration: '15 мин' },
];

export const SKILL_DATA: SkillNode = {
  name: "SmartSpeek Profile",
  value: 100,
  children: [
    { name: "Grammar", value: 65 },
    { name: "Speaking", value: 45 },
    { name: "Vocabulary", value: 80 },
    { name: "Listening", value: 55 },
    { name: "Writing", value: 50 }
  ]
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', tier: 1, title: 'AI Newcomer', description: 'Диагностика пройдена, профиль создан.', icon: 'fa-id-badge', status: 'unlocked', date: '01.01.2026', type: 'skill' },
  { id: 'a2', tier: 1, title: 'First Prompt', description: 'Первый диалог с нейро-репетитором.', icon: 'fa-terminal', status: 'locked', type: 'skill' },
  { id: 'a3', tier: 1, title: 'Learning Path Initialized', description: 'Персональный план принят.', icon: 'fa-map-signs', status: 'locked', type: 'skill' },
  { id: 'a4', tier: 1, title: 'Consistency Start', description: '3 дня активности подряд.', icon: 'fa-bolt', status: 'locked', type: 'streak' },
  { id: 'a5', tier: 2, title: 'Daily Operator', description: '7 дней подряд без пропусков.', icon: 'fa-calendar-check', status: 'locked', type: 'streak' },
  { id: 'a6', tier: 2, title: 'Focus Mode Activated', description: 'Урок пройден без отвлечений.', icon: 'fa-eye', status: 'locked', type: 'course' },
  { id: 'a7', tier: 2, title: 'Vocabulary Stack Builder I', description: '100 слов в активном словаре.', icon: 'fa-layer-group', status: 'locked', type: 'skill' },
  { id: 'a8', tier: 2, title: 'Grammar Debugger I', description: '50 исправленных ошибок.', icon: 'fa-bug-slash', status: 'locked', type: 'skill' },
  { id: 'a9', tier: 3, title: 'Context Master I', description: '80% точность слов в контексте.', icon: 'fa-puzzle-piece', status: 'locked', type: 'skill' },
  { id: 'a10', tier: 3, title: 'AI Listener I', description: '30 мин аудирования без субтитров.', icon: 'fa-headphones-simple', status: 'locked', type: 'skill' },
  { id: 'a11', tier: 3, title: 'Thinking in English I', description: '5 заданий без внутреннего перевода.', icon: 'fa-brain', status: 'locked', type: 'skill' },
  { id: 'a12', tier: 3, title: 'Explain It Simply', description: 'IT-тема простым английским.', icon: 'fa-comment-medical', status: 'locked', type: 'skill' },
  { id: 'a13', tier: 4, title: 'Conversation Engineer I', description: '10 диалогов без подсказок.', icon: 'fa-comments', status: 'locked', type: 'skill' },
  { id: 'a14', tier: 4, title: 'Confidence Speaker I', description: 'Монолог 5 минут без остановок.', icon: 'fa-microphone-lines', status: 'locked', type: 'skill' },
  { id: 'a15', tier: 4, title: 'Accent Breaker I', description: 'Произношение улучшено на +20%.', icon: 'fa-waveform-lines', status: 'locked', type: 'skill' },
  { id: 'a16', tier: 5, title: 'Tech English Pro', description: 'Свободная работа с IT лексикой.', icon: 'fa-laptop-code', status: 'locked', type: 'skill' },
  { id: 'a17', tier: 5, title: 'Prompt Architect', description: 'Сложные prompts на английском.', icon: 'fa-gears', status: 'locked', type: 'skill' },
  { id: 'a18', tier: 5, title: 'Interview Ready', description: 'Успешное AI-интервью.', icon: 'fa-handshake', status: 'locked', type: 'skill' },
  { id: 'a19', tier: 6, title: '30-Day Discipline', description: '30 дней активности подряд.', icon: 'fa-calendar-days', status: 'locked', type: 'streak' },
  { id: 'a20', tier: 6, title: 'Learning Machine', description: '50+ часов обучения.', icon: 'fa-battery-full', status: 'locked', type: 'streak' },
  { id: 'a21', tier: 7, title: 'AI Fluency Level 1', description: 'Переход на уровень выше.', icon: 'fa-stairs', status: 'locked', type: 'skill' },
  { id: 'a22', tier: 7, title: 'Future Proof', description: 'Все цели выполнены.', icon: 'fa-shield-halved', status: 'locked', type: 'skill' },
  { id: 'a23', tier: 7, title: 'AI English Operator', description: 'Полная автономность.', icon: 'fa-user-check', status: 'locked', type: 'skill' },
];

export const AI_TERMINOLOGY: AITerm[] = [
  { term: "RAG", definition: "Retrieval-Augmented Generation — поиск данных в ваших документах для точных ответов ИИ.", icon: "fa-database" },
  { term: "CEFR", definition: "Общеевропейская шкала языковой компетенции (A1-C2).", icon: "fa-chart-simple" },
];
