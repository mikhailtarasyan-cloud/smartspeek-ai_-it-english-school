
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar, { ViewType } from './components/Sidebar';
import CourseCard from './components/CourseCard';
import AchievementBadge from './components/AchievementBadge';
import OrchestratorPanel from './components/OrchestratorPanel';
import { 
  CoursesView, 
  AnalyticsView, 
  TelegramView, 
  SettingsView, 
  DiagnosticView, 
  LearningPlanView, 
  DailySessionView, 
  WelcomeView, 
  AuthView, 
  OnboardingSurveyView,
  GeneratingPlanView,
  PlanReadyView
} from './components/Views';
import { SAMPLE_PLAN } from './constants';
import { getTutorInsights, processOnboarding } from './services/gemini';
import { apiClient } from './services/apiClient';
import { AIInsight, Achievement, Course, LearningPlan, LearningPlanCurrent, OnboardingData, SkillNode } from './types';

type AppPhase = 'welcome' | 'auth' | 'onboarding' | 'generating' | 'plan-ready' | 'main';

const App: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>('welcome');
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [user, setUser] = useState<{ name: string; email?: string; avatar: 'male' | 'female' } | null>(null);
  const [onboardingResult, setOnboardingResult] = useState<any>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [isOrchestratorOpen, setIsOrchestratorOpen] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [courses, setCourses] = useState<Course[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [skillTree, setSkillTree] = useState<SkillNode | null>(null);
  const [dashboardStats, setDashboardStats] = useState({ active_courses: 0, words_learned: 0, level: 'B1' });
  const [learningPlan, setLearningPlan] = useState<LearningPlan>(SAMPLE_PLAN);
  const [currentPlanMeta, setCurrentPlanMeta] = useState<LearningPlanCurrent | null>(null);
  const [onboardingInput, setOnboardingInput] = useState<OnboardingData | null>(null);
  const [isPlanGenerating, setIsPlanGenerating] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [autoPlanTriggered, setAutoPlanTriggered] = useState(false);
  const [autoPlanSummary, setAutoPlanSummary] = useState<string | null>(null);
  const [manualPlanSummary, setManualPlanSummary] = useState<string | null>(null);

  // Persistence: Hydrate state from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('smartspeek_user');
    const savedResult = localStorage.getItem('smartspeek_onboarding');
    const savedPhase = localStorage.getItem('smartspeek_phase');
    const savedUserId = localStorage.getItem('smartspeek_user_id');
    const savedOnboardingInput = localStorage.getItem('smartspeek_onboarding_input');
    const savedPlan = localStorage.getItem('smartspeek_learning_plan');
    const savedAutoSummary = localStorage.getItem('smartspeek_auto_plan_summary');
    const savedManualSummary = localStorage.getItem('smartspeek_manual_plan_summary');
    
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedResult) setOnboardingResult(JSON.parse(savedResult));
    if (savedOnboardingInput) setOnboardingInput(JSON.parse(savedOnboardingInput));
    if (savedPlan) setLearningPlan(JSON.parse(savedPlan));
    if (savedAutoSummary) setAutoPlanSummary(savedAutoSummary);
    if (savedManualSummary) setManualPlanSummary(savedManualSummary);
    if (!savedUserId) localStorage.setItem('smartspeek_user_id', 'user_demo');
    
    if (savedPhase && savedPhase !== 'diagnostic' && savedPhase !== 'results') {
        setPhase(savedPhase as AppPhase);
    } else if (savedPhase) {
        setPhase('main');
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('smartspeek_user', JSON.stringify(user));
    if (onboardingResult) localStorage.setItem('smartspeek_onboarding', JSON.stringify(onboardingResult));
    if (onboardingInput) localStorage.setItem('smartspeek_onboarding_input', JSON.stringify(onboardingInput));
    if (learningPlan) localStorage.setItem('smartspeek_learning_plan', JSON.stringify(learningPlan));
    if (autoPlanSummary) localStorage.setItem('smartspeek_auto_plan_summary', autoPlanSummary);
    if (manualPlanSummary) localStorage.setItem('smartspeek_manual_plan_summary', manualPlanSummary);
    localStorage.setItem('smartspeek_phase', phase);
  }, [user, onboardingResult, onboardingInput, learningPlan, autoPlanSummary, manualPlanSummary, phase]);

  const buildPlanFromGoals = (data: OnboardingData): LearningPlan => {
    const goalLabels: Record<string, string> = {
      career_growth: 'Карьерный рост',
      job_interview: 'Собеседование',
      international_team: 'Международная команда',
      freelance_clients: 'Фриланс/Клиенты',
      relocation: 'Релокация',
      startup: 'Стартап',
    };

    const taskLabels: Record<string, string> = {
      documentation: 'Документация',
      chat_communication: 'Переписка в чатах',
      meetings: 'Митинги',
      presentations: 'Презентации',
      technical_discussions: 'Технические дискуссии',
      code_review: 'Code Review',
    };

    const goals = (data.goals || []).map((g) => goalLabels[g] || g);
    const tasks = (data.work_tasks || []).map((t) => taskLabels[t] || t);
    const themes = [...goals, ...tasks, data.role].filter(Boolean);

    const getTheme = (index: number) =>
      themes[index % themes.length] || 'IT-коммуникация';

    const schedule = Array.from({ length: 7 }, (_, i) => {
      const day = i + 1;
      const theme = getTheme(i);
      return {
        day,
        title: `${theme} — день ${day}`,
        steps: [
          { id: `d${day}s1`, title: `Vocab: ключевые термины — ${theme}`, type: 'reading', status: day === 1 ? 'current' : 'pending' },
          { id: `d${day}s2`, title: `Grammar: структура для ${theme}`, type: 'grammar', status: 'pending' },
          { id: `d${day}s3`, title: `Practice: короткая практика по теме "${theme}"`, type: 'speaking', status: 'pending' },
        ],
      };
    });

    return {
      id: `lp_${Date.now()}`,
      goal_id: goals[0] || 'custom',
      duration_days: 7,
      rationale: 'План построен на ваших целях из онбординга.',
      schedule,
    };
  };

  const goalLabelMap: Record<string, string> = {
    career_growth: 'Карьерный рост',
    job_interview: 'Собеседование',
    international_team: 'Международная команда',
    freelance_clients: 'Фриланс / Клиенты',
    relocation: 'Релокация',
    startup: 'Стартап',
    daily_standup: 'Стендапы',
    incident_updates: 'Инциденты',
    emails: 'Письма',
    meetings: 'Митинги',
    interview: 'Собеседование',
    presentations: 'Презентации',
  };

  const buildPlanSummary = (payload: {
    plan_length: 7 | 21;
    goals: string[];
    free_text_goal?: string;
    role?: string;
  }) => {
    const goals = payload.goals.map((g) => goalLabelMap[g] || g).filter(Boolean);
    const goalText = goals.length ? goals.join(', ') : 'Без указанных целей';
    const freeText = payload.free_text_goal ? ` / ${payload.free_text_goal}` : '';
    const role = payload.role ? ` / Роль: ${payload.role}` : '';
    return `Длина: ${payload.plan_length} уроков • Цели: ${goalText}${freeText}${role}`;
  };

  const normalizePlan = (result: any, data: OnboardingData | null): LearningPlan | null => {
    if (result && Array.isArray(result.schedule)) {
      return {
        id: result.id || `lp_${Date.now()}`,
        goal_id: result.goal_id || (data?.goals?.[0] || 'custom'),
        duration_days: result.duration_days || 7,
        rationale: result.rationale || 'План построен на ваших целях из онбординга.',
        schedule: result.schedule,
      };
    }
    return data ? buildPlanFromGoals(data) : null;
  };

  const fetchInsights = useCallback(async () => {
    if (!navigator.onLine) return; 
    setLoadingInsights(true);
    try {
      const data = await getTutorInsights(`Career advice for ${user?.name || 'an IT expert'}. Role: ${onboardingResult?.role || 'Engineer'}. Goal: Career growth. Advice on Russian.`);
      setInsights(data);
    } catch (error) {
      console.error("AI Insight error:", error);
    } finally {
      setLoadingInsights(false);
    }
  }, [user, onboardingResult]);

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await apiClient.getDashboard();
      setCourses(data.courses || []);
      setAchievements(data.achievements || []);
      setSkillTree(data.skill_tree || null);
      setDashboardStats({
        active_courses: data.active_courses || 0,
        words_learned: data.words_learned || 0,
        level: data.level || 'B1',
      });
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    }
  }, []);

  useEffect(() => {
    if (phase === 'main') {
      fetchInsights();
      fetchDashboard();
      loadCurrentPlan();
    }
  }, [phase, fetchInsights, fetchDashboard]);

  useEffect(() => {
    if (phase !== 'main') return;
    if (autoPlanTriggered) return;
    if (!onboardingInput) return;
    if (currentPlanMeta) return;

    setAutoPlanTriggered(true);
    const freeText = onboardingInput.goal_focus || onboardingInput.success_criteria || undefined;
    handleGeneratePlan({
      plan_length: 7,
      goals: onboardingInput.goals || [],
      free_text_goal: freeText,
      role: onboardingInput.role,
      interests: onboardingInput.work_tasks || [],
    }, 'auto');
  }, [phase, onboardingInput, currentPlanMeta, autoPlanTriggered]);

  useEffect(() => {
    if (phase !== 'main') return;
    if (autoPlanTriggered) return;
    if (!onboardingInput) return;
    if (currentPlanMeta) return;

    setAutoPlanTriggered(true);
    const freeText = onboardingInput.goal_focus || onboardingInput.success_criteria || undefined;
    handleGeneratePlan({
      plan_length: 7,
      goals: onboardingInput.goals || [],
      free_text_goal: freeText,
      role: onboardingInput.role,
      interests: onboardingInput.work_tasks || [],
    });
  }, [phase, onboardingInput, currentPlanMeta, autoPlanTriggered]);

  const handleStartOnboarding = () => setPhase('auth');
  
  const handleAuth = async (userData: { name: string; email: string; password: string; avatar: 'male' | 'female' }) => {
    try {
      const result = await apiClient.register({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        avatar: userData.avatar,
      });
      // result: { access_token, token_type, user }
      apiClient.setToken(result.access_token);
      setUser({ name: result.user.name, email: result.user.email, avatar: userData.avatar });
      // Возвращаем стандартный поток: после регистрации -> онбординг
      setPhase('onboarding');
    } catch (error: any) {
      console.error('Registration failed', error);
      const status = error?.status;
      const detail = error?.body?.detail;
      if (status === 409 || detail === 'USER_ALREADY_EXISTS') {
        alert('Пользователь с таким email уже существует. Попробуйте войти.');
      } else if (status === 500) {
        alert('Сервер недоступен. Попробуйте позже.');
      } else {
        alert('Не удалось зарегистрироваться. Проверьте email и пароль.');
      }
    }
  };

  const handleLogin = async (userData: { email: string; password: string }) => {
    try {
      const result = await apiClient.login({
        email: userData.email,
        password: userData.password,
      });
      // result: { access_token, token_type, user }
      apiClient.setToken(result.access_token);
      setUser({ 
        name: result.user.name, 
        email: result.user.email, 
        avatar: (result.user.avatar as 'male' | 'female') || 'male' 
      });
      // Если онбординг уже есть в localStorage - сразу в main, иначе на онбординг
      const savedResult = localStorage.getItem('smartspeek_onboarding');
      setPhase(savedResult ? 'main' : 'onboarding');
    } catch (error: any) {
      console.error('Login failed', error);
      const status = error?.status;
      const detail = error?.body?.detail;
      if (status === 401 || detail === 'INVALID_CREDENTIALS') {
        alert('Неверный логин или пароль.');
      } else if (status === 500) {
        alert('Сервер недоступен / ошибка сервера.');
      } else {
        alert('Не удалось войти. Проверьте email и пароль.');
      }
    }
  };

  const handleOnboardingComplete = async (data: OnboardingData) => {
    if (!navigator.onLine) {
        alert("Для персональной настройки обучения требуется подключение к интернету.");
        return;
    }
    setPhase('generating');
    try {
      setOnboardingInput(data);
      const result = await processOnboarding(data);
      setOnboardingResult(result);
      const normalized = normalizePlan(result, data);
      if (normalized) setLearningPlan(normalized);
      setPhase('plan-ready');
    } catch (error) {
      console.error("Onboarding failed", error);
      setPhase('onboarding'); 
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
      alert(`Не удалось сгенерировать план: ${errorMessage}. Проверьте сеть и API ключ.`);
    }
  };

  const handleStartFirstLesson = () => setPhase('main');
  const handleStartDaily = () => setCurrentView('daily-session');

  const planFromCurrent = (current: LearningPlanCurrent): LearningPlan => {
    const schedule = current.lessons.map((lesson) => {
      const activities = lesson.lesson_payload?.activities || [];
      const steps = activities.length
        ? activities.map((activity: any, idx: number) => ({
            id: `lp_${lesson.lesson_index}_act_${idx + 1}`,
            title: activity.prompt || activity.type || `Активность ${idx + 1}`,
            type: (activity.type as any) || 'quiz',
            status: lesson.status === 'done' ? 'completed' : lesson.status === 'open' ? 'current' : 'pending',
            content: activity.prompt || '',
            explanation: activity.explanation_simple || '',
          }))
        : [
            {
              id: `lp_${lesson.lesson_index}_step`,
              title: lesson.status === 'done' ? 'Урок завершен' : 'Открыть урок',
              type: 'quiz',
              status: lesson.status === 'done' ? 'completed' : lesson.status === 'open' ? 'current' : 'pending',
            },
          ];

      return {
        day: lesson.lesson_index,
        title: lesson.title,
        steps,
      };
    });

    return {
      id: current.plan_id,
      goal_id: current.cefr_level,
      duration_days: current.plan_length,
      rationale: 'План построен на ваших целях и уровне.',
      schedule,
    };
  };

  const loadCurrentPlan = async () => {
    try {
      const current = await apiClient.getLearningPlanCurrent();
      setCurrentPlanMeta(current);
      setLearningPlan(planFromCurrent(current));
      return current;
    } catch (error: any) {
      if (error?.status === 404) {
        setCurrentPlanMeta(null);
        return null;
      } else {
        console.error('Failed to load current plan', error);
        return null;
      }
    }
  };

  useEffect(() => {
    if (currentView === 'learning-plan') {
      loadCurrentPlan();
    }
  }, [currentView]);

  const handleGeneratePlan = async (
    payload: {
    plan_length: 7 | 21;
    goals: string[];
    free_text_goal?: string;
    role?: string;
    interests: string[];
    weak_terms?: string[];
    weak_skills?: string[];
    },
    source: 'auto' | 'manual' = 'manual'
  ) => {
    if (!onboardingInput) {
      // Не блокируем: генерация доступна и без онбординга
      setOnboardingInput(null);
    }
    setIsPlanGenerating(true);
    setPlanError(null);
    try {
      const cefr =
        onboardingResult?.english_level ||
        dashboardStats.level ||
        'B1';
      await apiClient.generateLearningPlan({
        plan_length: payload.plan_length,
        cefr_level: cefr,
        goals: payload.goals || [],
        free_text_goal: payload.free_text_goal,
        role: payload.role,
        interests: payload.interests || [],
        weak_terms: payload.weak_terms || [],
        weak_skills: payload.weak_skills || [],
      });
      await loadCurrentPlan();
      if (source === 'auto') {
        setAutoPlanSummary(buildPlanSummary(payload));
      } else {
        setManualPlanSummary(buildPlanSummary(payload));
      }
    } catch (error) {
      console.error('Plan generation failed', error);
      setPlanError('Не удалось сгенерировать план. Проверьте сеть и ключ LLM.');
    } finally {
      setIsPlanGenerating(false);
    }
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Learning Space';
      case 'courses': return 'Курсы';
      case 'learning-plan': return 'Учебный план';
      case 'analytics': return 'Аналитика';
      case 'achievements': return 'Достижения';
      case 'telegram': return 'Telegram';
      case 'settings': return 'Настройки';
      case 'daily-session': return 'Практика';
      default: return 'SmartSpeek AI';
    }
  };


  const firstPlanDay = learningPlan?.schedule?.[0];
  const firstPlanTitle = firstPlanDay?.title || onboardingResult?.first_lesson?.topic || 'Персональный тренинг';
  const firstPlanDescription = firstPlanDay?.steps?.length
    ? firstPlanDay.steps.map((step) => step.title).slice(0, 3).join(' • ')
    : (onboardingResult?.first_lesson?.description || 'Практика актуальных рабочих сценариев.');
  const abbreviations = [
    { term: 'RAG', description: 'Комбинация LLM с внешним поиском знаний.' },
    { term: 'LLM', description: 'Большая языковая модель для генерации текста.' },
    { term: 'NLP', description: 'Обработка естественного языка.' },
    { term: 'MLOps', description: 'Практики внедрения и поддержки ML‑систем.' },
    { term: 'CEFR', description: 'Европейская шкала уровня языка (A1–C2).' },
    { term: 'CI/CD', description: 'Автоматизация сборки, тестов и релизов.' },
    { term: 'API', description: 'Интерфейс взаимодействия между сервисами.' },
    { term: 'SDK', description: 'Набор инструментов для разработки.' },
  ];
  const abbrIndex = new Date().getDate() % abbreviations.length;
  const abbrOfDay = abbreviations[abbrIndex];

  const renderDashboard = () => (
    <div className="grid grid-cols-12 gap-8 animate-in fade-in duration-500 pb-24">
      <div className="col-span-12 lg:col-span-8 space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Курсов активно', val: String(dashboardStats.active_courses), icon: 'fa-book', color: 'text-blue-600', bg: 'bg-blue-50', action: () => setCurrentView('courses') },
              { label: 'Выучено слов', val: String(dashboardStats.words_learned), icon: 'fa-spell-check', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Уровень', val: onboardingResult?.english_level || dashboardStats.level || 'B1', icon: 'fa-bolt', color: 'text-orange-500', bg: 'bg-orange-50' },
          ].map((stat, i) => (
            <div 
              key={i} 
              onClick={stat.action}
              className={`bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-2xl transition-all cursor-pointer ${stat.action ? 'hover:border-blue-300' : ''}`}
            >
              <div className={`${stat.bg} ${stat.color} w-16 h-16 rounded-3xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}>
                <i className={`fa-solid ${stat.icon}`}></i>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-slate-900">{stat.val}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] border border-blue-100 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 group overflow-hidden relative">
          <div className="relative z-10 flex-1">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
               <i className="fa-solid fa-wand-magic-sparkles text-[8px]"></i>
               Ваш Нейро-Оркестратор
            </p>
            <h4 className="text-2xl font-black text-slate-900 leading-relaxed">
               Манера: {onboardingResult?.persona?.tone === 'professional_supportive' ? 'Поддерживающая' : 'Деловая'}
            </h4>
            <div className="mt-4 p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50">
               <p className="text-slate-700 text-base font-bold leading-relaxed italic">
                    "{onboardingResult?.persona?.description || 'Я — ваш персональный наставник. Моя цель — подготовить вас к работе в лучших AI и IT компаниях мира через свободный английский.'}"
               </p>
            </div>
          </div>
          <div className="shrink-0 z-10">
             <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl shadow-blue-600/30">
                <i className="fa-solid fa-gem"></i>
             </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white shadow-[0_32px_64px_-16px_rgba(30,41,59,0.5)] relative overflow-hidden group">
          <div className="relative z-10 max-w-lg">
            <div className="flex items-center gap-3 mb-6">
               <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
               <span className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-400">Next Sprint Ready</span>
            </div>
            <h3 className="text-4xl font-black mb-6 tracking-tight leading-tight">Урок: {firstPlanTitle}</h3>
            <p className="opacity-70 text-xl mb-12 leading-relaxed font-medium">{firstPlanDescription}</p>
            <button onClick={handleStartDaily} className="w-full sm:w-auto px-12 py-6 bg-blue-600 text-white rounded-[2rem] font-black text-2xl hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/40 flex items-center justify-center gap-4 active:scale-95 group">
              Начать занятие <i className="fa-solid fa-play group-hover:translate-x-1 transition-transform"></i>
            </button>
          </div>
          <div className="absolute top-0 right-0 p-16 opacity-[0.05] pointer-events-none">
            <i className="fa-solid fa-code text-[15rem] rotate-12 group-hover:rotate-0 transition-transform duration-1000"></i>
          </div>
        </div>

        <section>
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ваши программы</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {courses.map(course => (
              <div key={course.id} onClick={() => setCurrentView('courses')} className="cursor-pointer">
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Достижения</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {achievements.slice(0, 4).map(ach => <AchievementBadge key={ach.id} achievement={ach} allAchievements={achievements} />)}
          </div>
        </section>

      </div>

      <div className="col-span-12 lg:col-span-4 space-y-10">
        <div className="bg-white p-10 rounded-[3rem] border border-orange-100 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-3xl flex items-center justify-center text-3xl streak-fire">
                        <i className="fa-solid fa-fire"></i>
                    </div>
                    <span className="font-black text-2xl text-slate-900 tracking-tight">5 дней подряд!</span>
                </div>
            </div>
            <p className="text-sm text-slate-500 font-bold leading-relaxed relative z-10 opacity-80">Вы держите отличный темп. Так держать, {user?.name}!</p>
            <div className="absolute -right-8 -bottom-8 opacity-[0.02] text-orange-600 group-hover:scale-110 transition-transform duration-1000">
              <i className="fa-solid fa-fire text-[12rem]"></i>
            </div>
        </div>

        <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group border border-slate-800">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-blue-500 rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-blue-500/30">
              <i className="fa-solid fa-wand-magic-sparkles text-lg"></i>
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-400">Совет наставника</h3>
          </div>
          <div className="space-y-6">
            {!isOnline ? (
              <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 text-center">
                  <i className="fa-solid fa-wifi-slash text-slate-500 mb-2"></i>
                  <p className="text-xs text-slate-400">Оффлайн: Аналитика недоступна</p>
              </div>
            ) : (
              <>
                {insights
                  .map((insight) => (typeof insight === 'string' ? insight : (insight?.message || insight?.topic || '')))
                  .filter((text) => text)
                  .slice(0, 2)
                  .map((insightText, idx) => (
                    <div key={idx} className="bg-slate-800/50 border border-slate-700/50 p-8 rounded-[2rem] hover:bg-slate-800/80 transition-all cursor-default group">
                      <p className="text-sm text-slate-300 leading-relaxed font-bold">{insightText}</p>
                    </div>
                  ))}
                <div className="bg-slate-800/50 border border-slate-700/50 p-8 rounded-[2rem]">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 opacity-70">Аббревиатура дня</p>
                  <p className="text-sm text-slate-300 leading-relaxed font-bold">
                    {abbrOfDay.term} — {abbrOfDay.description}
                  </p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 p-8 rounded-[2rem]">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 opacity-70">Мотивация</p>
                  <p className="text-sm text-slate-300 leading-relaxed font-bold">
                    Ты уже в процессе — это главное. Маленький шаг сегодня закрепит прогресс завтра.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderViewContent = () => {
    switch (currentView) {
      case 'dashboard': return renderDashboard();
      case 'courses': return <CoursesView courses={courses} />;
      case 'analytics': return <AnalyticsView skillData={skillTree} userName={user?.name || ''} achievements={achievements} />;
      case 'achievements': return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500 pb-24">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Зал славы</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
            {achievements.map(ach => <AchievementBadge key={ach.id} achievement={ach} allAchievements={achievements} />)}
          </div>
        </div>
      );
      case 'learning-plan': return (
        <LearningPlanView
          plan={learningPlan}
          onAccept={() => setCurrentView('dashboard')}
          onNavigateAchievements={() => setCurrentView('achievements')}
          onGenerate={(payload) => handleGeneratePlan(payload, 'manual')}
          isGenerating={isPlanGenerating}
          errorMessage={planError}
          hasExistingPlan={Boolean(currentPlanMeta)}
          progress={currentPlanMeta?.progress || null}
          autoPlanSummary={autoPlanSummary}
          manualPlanSummary={manualPlanSummary}
        />
      );
      case 'daily-session': return (
        <DailySessionView
          onComplete={() => setCurrentView('dashboard')}
          lessonTitle={firstPlanTitle}
          lessonSteps={firstPlanDay?.steps?.map((step) => step.title) || []}
        />
      );
      case 'telegram': return <TelegramView />;
      case 'settings': return <SettingsView 
        onSave={(payload) => {
          setUser(prev => prev ? { ...prev, name: payload.name } : prev);
          setDashboardStats(prev => ({ ...prev, level: payload.level }));
          setCurrentView('dashboard');
        }} 
        onCancel={() => setCurrentView('dashboard')}
        userName={user?.name || ''}
        userLevel={dashboardStats.level || 'B1'}
      />;
      default: return null;
    }
  };

  const handleNavigate = (view: ViewType) => {
    setCurrentView(view);
    setIsSidebarMobileOpen(false);
  };

  const renderAppContent = () => {
    switch (phase) {
      case 'welcome': return <WelcomeView onStart={handleStartOnboarding} />;
      case 'auth': return <AuthView onAuth={handleAuth} onLogin={handleLogin} />;
      case 'onboarding': return <OnboardingSurveyView onComplete={handleOnboardingComplete} />;
      case 'generating': return <GeneratingPlanView />;
      case 'plan-ready': return <PlanReadyView result={onboardingResult} onStart={handleStartFirstLesson} />;
      case 'main':
        return (
          <div className="flex min-h-screen w-full relative bg-slate-50 overflow-x-hidden">
            <div className="hidden lg:flex">
                <Sidebar currentView={currentView} onNavigate={handleNavigate} />
            </div>
            {isSidebarMobileOpen && (
                <div className="fixed inset-0 z-[100] lg:hidden animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSidebarMobileOpen(false)}></div>
                    <div className="absolute left-0 h-full w-72 animate-in slide-in-from-left duration-300">
                        <Sidebar currentView={currentView} onNavigate={handleNavigate} isMobile />
                    </div>
                </div>
            )}
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isOrchestratorOpen ? 'lg:pr-80' : ''}`}>
              <main className="flex-1 p-5 md:p-12 w-full max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 animate-in slide-in-from-top-6 duration-700">
                  <div className="flex items-center gap-5 w-full md:w-auto">
                    <button 
                      onClick={() => setIsSidebarMobileOpen(true)}
                      className="lg:hidden w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-700 shadow-sm active:scale-95 transition-all shrink-0"
                    >
                      <i className="fa-solid fa-bars text-lg"></i>
                    </button>
                    <div className="space-y-1 min-w-0">
                      <h1 className="text-3xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight truncate">
                        {getPageTitle()}
                      </h1>
                      <p className="text-slate-500 font-bold text-xs md:text-lg truncate">SmartSpeek AI: Привет, {user?.name}.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div 
                      className="flex-1 md:flex-none flex items-center gap-4 bg-white p-2 pr-6 md:p-3 md:pr-8 rounded-[2rem] border border-slate-100 shadow-sm hover:border-blue-300 hover:shadow-2xl transition-all cursor-pointer group min-w-0" 
                      onClick={() => setCurrentView('settings')}
                    >
                      <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl md:rounded-3xl bg-blue-50 border-2 md:border-4 border-white group-hover:scale-105 transition-transform shrink-0 shadow-inner flex items-center justify-center">
                        <i className={`fa-solid fa-user text-blue-600 text-lg md:text-2xl`}></i>
                      </div>
                      <div className="min-w-0 overflow-hidden">
                        <p className="text-sm md:text-base font-black text-slate-900 leading-none truncate">{user?.name}</p>
                        <p className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1 md:mt-2 bg-blue-50 px-2 py-0.5 rounded-lg inline-block">{onboardingResult?.english_level || 'B1'} IT</p>
                      </div>
                    </div>
                  </div>
                </header>
                <div className="w-full">
                    {renderViewContent()}
                </div>
              </main>
            </div>
            <OrchestratorPanel isOpen={isOrchestratorOpen} onClose={() => setIsOrchestratorOpen(false)} currentView={currentView} />
            {!isOrchestratorOpen && (
              <button 
                onClick={() => setIsOrchestratorOpen(true)}
                className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 text-white rounded-[2.5rem] shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center justify-center text-3xl sm:text-4xl hover:scale-110 active:scale-95 transition-all z-[90] animate-bounce overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent"></div>
                <i className="fa-solid fa-gem relative z-10 drop-shadow-lg"></i>
              </button>
            )}
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-inter selection:bg-blue-100 selection:text-blue-700">
      {!isOnline && (
          <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-[10px] font-black py-1 text-center z-[999] animate-in slide-in-from-top duration-300 uppercase tracking-widest">
            <i className="fa-solid fa-wifi-slash mr-2"></i> Оффлайн режим
          </div>
      )}
      {renderAppContent()}
    </div>
  );
};

export default App;
