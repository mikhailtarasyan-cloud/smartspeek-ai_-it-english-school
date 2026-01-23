
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar, { ViewType } from './components/Sidebar';
import CourseCard from './components/CourseCard';
import AchievementBadge from './components/AchievementBadge';
import AITerminology from './components/AITerminology';
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
import { AIInsight, Achievement, Course, OnboardingData, SkillNode } from './types';

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

  // Persistence: Hydrate state from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('smartspeek_user');
    const savedResult = localStorage.getItem('smartspeek_onboarding');
    const savedPhase = localStorage.getItem('smartspeek_phase');
    const savedUserId = localStorage.getItem('smartspeek_user_id');
    
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedResult) setOnboardingResult(JSON.parse(savedResult));
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
    localStorage.setItem('smartspeek_phase', phase);
  }, [user, onboardingResult, phase]);

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
    }
  }, [phase, fetchInsights, fetchDashboard]);

  const handleStartOnboarding = () => setPhase('auth');
  
  const handleAuth = async (userData: { name: string; email: string; password: string; avatar: 'male' | 'female' }) => {
    try {
      const result = await apiClient.register({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        avatar: userData.avatar,
      });
      localStorage.setItem('smartspeek_user_id', result.user_id);
      setUser({ name: result.name, email: result.email, avatar: userData.avatar });
      setPhase('onboarding');
    } catch (error) {
      console.error('Registration failed', error);
      alert('Не удалось зарегистрироваться. Проверьте email и пароль.');
    }
  };

  const handleOnboardingComplete = async (data: OnboardingData) => {
    if (!navigator.onLine) {
        alert("Для персональной настройки обучения требуется подключение к интернету.");
        return;
    }
    setPhase('generating');
    try {
      const result = await processOnboarding(data);
      setOnboardingResult(result);
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
            <h3 className="text-4xl font-black mb-6 tracking-tight leading-tight">Урок: {onboardingResult?.first_lesson?.topic || 'Персональный тренинг'}</h3>
            <p className="opacity-70 text-xl mb-12 leading-relaxed font-medium">{onboardingResult?.first_lesson?.description || 'Практика актуальных рабочих сценариев.'}</p>
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

        <AITerminology />
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
              <i className="fa-solid fa-bolt-lightning text-lg"></i>
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-400">BuddyAgent Insights</h3>
          </div>
          <div className="space-y-6">
            {!isOnline ? (
              <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 text-center">
                  <i className="fa-solid fa-wifi-slash text-slate-500 mb-2"></i>
                  <p className="text-xs text-slate-400">Оффлайн: Аналитика недоступна</p>
              </div>
            ) : insights.map((insight, idx) => (
              <div key={idx} className="bg-slate-800/50 border border-slate-700/50 p-8 rounded-[2rem] hover:bg-slate-800/80 transition-all cursor-default group">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 opacity-70 group-hover:opacity-100 transition-opacity">{insight.topic}</p>
                <p className="text-sm text-slate-300 leading-relaxed font-bold">{insight.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderViewContent = () => {
    switch (currentView) {
      case 'dashboard': return renderDashboard();
      case 'courses': return <CoursesView courses={courses} />;
      case 'analytics': return <AnalyticsView skillData={skillTree} userName={user?.name || ''} />;
      case 'achievements': return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500 pb-24">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Зал славы</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
            {achievements.map(ach => <AchievementBadge key={ach.id} achievement={ach} allAchievements={achievements} />)}
          </div>
        </div>
      );
      case 'learning-plan': return <LearningPlanView plan={SAMPLE_PLAN} onAccept={() => setCurrentView('dashboard')} onNavigateAchievements={() => setCurrentView('achievements')} />;
      case 'daily-session': return <DailySessionView onComplete={() => setCurrentView('dashboard')} />;
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
      case 'auth': return <AuthView onAuth={handleAuth} />;
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
