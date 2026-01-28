
import React, { useState, useEffect } from 'react';
import { DIAGNOSTIC_STEPS, ONBOARDING_QUESTIONS } from '../constants';
import { evaluateDiagnosticResponse } from '../services/gemini';
import { apiClient } from '../services/apiClient';
import { LearningPlan, OnboardingData, Course, Lesson, Question, SkillNode } from '../types';
import CourseCard from './CourseCard';
import AchievementBadge from './AchievementBadge';
import SkillTree from './SkillTree';

// --- Welcome & Intro ---

export const WelcomeView: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700 bg-white">
    <div className="mb-14 space-y-4">
        <h2 className="text-blue-600 font-black tracking-[0.3em] text-sm uppercase">SmartSpeek-AI</h2>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight">
          Ваш персональный план<br/>
          <span className="text-blue-600">в AI IT сфере</span>
        </h1>
        <p className="text-slate-400 font-bold text-lg">Профессиональный английский для инженеров нового поколения</p>
    </div>
    
    <div className="relative mb-12 group">
      <div className="absolute inset-0 bg-blue-400 blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
      <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-blue-400 rounded-[2.5rem] flex items-center justify-center text-white text-6xl relative z-10 shadow-2xl shadow-blue-600/40 rotate-3 transition-transform hover:rotate-0 hover:scale-105 duration-500">
        <i className="fa-solid fa-rocket"></i>
      </div>
    </div>

    <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 mb-12 max-w-lg animate-in slide-in-from-bottom-4 delay-300">
       <p className="text-slate-800 font-bold text-xl mb-3">Готовы к росту?</p>
       <p className="text-slate-500 text-lg leading-relaxed font-medium">
         Наш ИИ создаст адаптивную программу обучения, ориентированную на ваши карьерные цели и текущую роль в IT.
       </p>
    </div>

    <button 
      onClick={onStart}
      className="group px-20 py-8 bg-blue-600 text-white rounded-[2.5rem] font-black text-2xl hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-blue-600/40 flex items-center gap-4"
    >
      Начать сейчас <i className="fa-solid fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
    </button>
  </div>
);

// --- Auth / Registration / Login ---

export const AuthView: React.FC<{ 
  onAuth: (user: { name: string; email: string; password: string; avatar: 'male' | 'female' }) => void;
  onLogin: (user: { email: string; password: string }) => void;
}> = ({ onAuth, onLogin }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [avatar, setAvatar] = useState<'male' | 'female'>('male');

  const handleSubmit = () => {
    if (isLogin) {
      onLogin({ email, password });
    } else {
      onAuth({ name, email, password, avatar });
    }
  };

  const isFormValid = isLogin 
    ? email.trim() && password.length >= 6
    : name.trim() && email.trim() && password.length >= 6 && acceptedTerms;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-in zoom-in duration-500 bg-slate-50">
      <div className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100 w-full max-w-lg">
        <div className="space-y-10">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">
              {isLogin ? 'Вход в аккаунт' : 'Создание аккаунта'}
            </h2>
            <p className="text-slate-500 font-bold text-sm">
              {isLogin ? 'Войдите, чтобы продолжить обучение' : 'Начните свой путь к IT-английскому'}
            </p>
          </div>

          {/* Avatar Selection Area - только для регистрации */}
          {!isLogin && (
            <div className="flex gap-10 justify-center items-end pb-4">
               <div className="flex flex-col items-center gap-4">
                 <button 
                  onClick={() => setAvatar('male')}
                  className={`w-28 h-28 rounded-full border-4 transition-all flex items-center justify-center ${avatar === 'male' ? 'border-blue-600 bg-blue-50 shadow-xl scale-110' : 'border-slate-200 bg-slate-50 opacity-60 hover:opacity-100'}`}
                 >
                    <i className={`fa-solid fa-user text-4xl ${avatar === 'male' ? 'text-blue-600' : 'text-slate-400'}`}></i>
                 </button>
                 <span className={`text-[10px] font-black tracking-[0.2em] transition-colors ${avatar === 'male' ? 'text-blue-600' : 'text-slate-400'}`}>МУЖЧИНА</span>
               </div>
               
               <div className="flex flex-col items-center gap-4">
                 <button 
                  onClick={() => setAvatar('female')}
                  className={`w-28 h-28 rounded-full border-4 transition-all flex items-center justify-center ${avatar === 'female' ? 'border-blue-600 bg-blue-50 shadow-xl scale-110' : 'border-slate-200 bg-slate-50 opacity-60 hover:opacity-100'}`}
                 >
                    <i className={`fa-solid fa-user text-4xl ${avatar === 'female' ? 'text-blue-600' : 'text-slate-400'}`}></i>
                 </button>
                 <span className={`text-[10px] font-black tracking-[0.2em] transition-colors ${avatar === 'female' ? 'text-blue-600' : 'text-slate-400'}`}>ЖЕНЩИНА</span>
               </div>
            </div>
          )}

          {/* Name field - только для регистрации */}
          {!isLogin && (
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">КАК К ВАМ ОБРАЩАТЬСЯ?</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-lg font-bold focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-300 shadow-inner"
                placeholder="Ваше имя"
              />
            </div>
          )}
          
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">EMAIL</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-lg font-bold focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-300 shadow-inner"
              placeholder="your@email.com"
            />
          </div>
          
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">ПАРОЛЬ</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-lg font-bold focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-300 shadow-inner"
              placeholder={isLogin ? "Ваш пароль" : "Минимум 6 символов"}
            />
          </div>

          {/* Social login - только для регистрации */}
          {!isLogin && (
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center block">ВХОД ЧЕРЕЗ СОЦСЕТИ</label>
              <div className="grid grid-cols-2 gap-4">
                 <button className="flex items-center justify-center gap-3 py-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95">
                    <i className="fa-brands fa-google text-red-500 text-lg"></i> Google
                 </button>
                 <button className="flex items-center justify-center gap-3 py-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95">
                    <i className="fa-solid fa-phone text-blue-500 text-lg"></i> Телефон
                 </button>
              </div>
            </div>
          )}

          {/* Terms checkbox - только для регистрации */}
          {!isLogin && (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex gap-4">
              <div className="relative shrink-0 pt-0.5">
                <input 
                  type="checkbox" 
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-6 h-6 rounded-lg border-2 border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer appearance-none checked:bg-blue-600 checked:border-blue-600 transition-all"
                />
                {acceptedTerms && <i className="fa-solid fa-check absolute inset-0 flex items-center justify-center text-white text-[10px] pointer-events-none"></i>}
              </div>
              <label htmlFor="terms" className="text-[11px] text-slate-500 leading-relaxed cursor-pointer font-medium">
                Я принимаю <span className="text-blue-600 font-bold">Условия использования</span> и <span className="text-blue-600 font-bold">Политику конфиденциальности</span> SmartSpeek AI.
              </label>
            </div>
          )}

          <button 
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 disabled:opacity-50 disabled:scale-100 transition-all shadow-xl shadow-blue-600/30 active:scale-95"
          >
            {isLogin ? 'Войти' : 'Создать аккаунт'}
          </button>

          {/* Toggle between login and register */}
          <div className="text-center pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setName('');
                setEmail('');
                setPassword('');
                setAcceptedTerms(false);
              }}
              className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
            >
              {isLogin ? (
                <>Нет аккаунта? <span className="text-blue-600">Зарегистрироваться</span></>
              ) : (
                <>Уже есть аккаунт? <span className="text-blue-600">Войти</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Onboarding Survey ---

export const OnboardingSurveyView: React.FC<{ onComplete: (data: OnboardingData) => void }> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<OnboardingData>>({});

  const question = ONBOARDING_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_QUESTIONS.length) * 100;

  const handleSelect = (value: string) => {
    if (question.type === 'single_select') {
      const newAnswers = { ...answers, [question.id]: value };
      setAnswers(newAnswers);
      if (currentStep < ONBOARDING_QUESTIONS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        onComplete(newAnswers as OnboardingData);
      }
    } else {
      const currentValues = (answers[question.id as keyof OnboardingData] as string[]) || [];
      let newValues: string[];
      if (currentValues.includes(value)) {
        newValues = currentValues.filter(v => v !== value);
      } else {
        if (question.max && currentValues.length >= (question.max as number)) return;
        newValues = [...currentValues, value];
      }
      setAnswers({ ...answers, [question.id]: newValues });
    }
  };

  const handleNextMulti = () => {
    if (currentStep < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(answers as OnboardingData);
    }
  };

  const currentSelection = (answers[question.id as keyof OnboardingData] as string[]) || [];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 overflow-hidden">
      <div className="w-full max-w-3xl animate-in slide-in-from-right-12 duration-500">
        <div className="mb-14 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
             <div className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
               Шаг {currentStep + 1} / {ONBOARDING_QUESTIONS.length}
             </div>
             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">~ 2 минуты осталось</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 tracking-tight leading-tight">
            {question.question}
          </h2>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.options.map((opt) => {
            const isSelected = question.type === 'multi_select' 
              ? currentSelection.includes(opt.value)
              : answers[question.id as keyof OnboardingData] === opt.value;
            
            return (
              <button 
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`group p-6 md:p-8 rounded-[2.5rem] border-2 text-left transition-all active:scale-[0.98] flex items-center justify-between shadow-sm hover:shadow-xl ${
                  isSelected 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-white bg-white hover:border-blue-200 text-slate-700'
                }`}
              >
                <span className="font-bold text-lg md:text-xl leading-snug">{opt.label}</span>
                <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                  isSelected ? 'bg-blue-600 border-blue-600 rotate-0' : 'border-slate-100 rotate-45 group-hover:rotate-0'
                }`}>
                  {isSelected && <i className="fa-solid fa-check text-white text-xs"></i>}
                </div>
              </button>
            );
          })}
        </div>

        {question.type === 'multi_select' && (
          <div className="mt-14 flex justify-center">
             <button 
              onClick={handleNextMulti}
              disabled={currentSelection.length === 0}
              className="px-20 py-6 bg-blue-600 text-white rounded-[2rem] font-black text-2xl hover:bg-blue-700 shadow-2xl shadow-blue-600/30 transition-all disabled:opacity-50 disabled:scale-100 scale-100 hover:scale-105 active:scale-95"
             >
               Далее <i className="fa-solid fa-arrow-right ml-3"></i>
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Loading State ---

export const GeneratingPlanView: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
    <div className="w-32 h-32 relative mb-12">
        <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-4xl text-blue-600">
            <i className="fa-solid fa-brain animate-pulse"></i>
        </div>
    </div>
    <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Создаю ваш нейро-план...</h2>
    <p className="text-xl text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
      SmartSpeek AI анализирует ваши ответы и подбирает идеальные темы для вашего карьерного роста.
    </p>
  </div>
);

// --- Plan Ready ---

export const PlanReadyView: React.FC<{ result: any; onStart: () => void }> = ({ result, onStart }) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl border border-slate-100 p-12 md:p-16 animate-in zoom-in-95 duration-700">
            <div className="flex flex-col md:flex-row gap-12 items-center">
                <div className="shrink-0 relative">
                    <div className="absolute -inset-4 bg-emerald-400 blur-2xl opacity-20 animate-pulse"></div>
                    <div className="w-48 h-48 bg-emerald-500 rounded-[3rem] flex items-center justify-center text-white text-7xl shadow-2xl shadow-emerald-500/30 relative z-10">
                        <i className="fa-solid fa-check-double"></i>
                    </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Ваш план готов!</h2>
                    <p className="text-xl text-slate-600 mb-10 leading-relaxed font-medium">
                        Я подготовил индивидуальную программу обучения на основе вашего профиля.
                    </p>
                    <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100 mb-10">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">Обзор программы</p>
                        <p className="text-slate-800 font-bold leading-relaxed text-lg">{result?.learning_plan_summary || "Ваш персональный план на 4 недели обучения IT-английскому."}</p>
                    </div>
                    <button 
                        onClick={onStart}
                        className="w-full sm:w-auto px-16 py-7 bg-blue-600 text-white rounded-[2.5rem] font-black text-2xl hover:bg-blue-700 shadow-2xl shadow-blue-600/40 transition-all active:scale-95"
                    >
                        В личный кабинет <i className="fa-solid fa-chevron-right ml-3"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
);

// --- Courses View ---

export const CoursesView: React.FC<{ courses: Course[] }> = ({ courses }) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [quizResults, setQuizResults] = useState<{ correct: number; total: number; report: any[] } | null>(null);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);

  const startLesson = async (lesson: Lesson) => {
    if (lesson.status === 'locked') return;
    try {
      const data = await apiClient.getLesson(lesson.id);
      setSelectedLesson(data);
    } catch (error) {
      console.error('Lesson load error:', error);
    }
  };

  const finishQuiz = async (results: { correct: number; total: number; report: any[] }) => {
    if (selectedLesson) {
      try {
        await apiClient.submitAttempt(selectedLesson.id, { score: results.correct, answers: results.report });
      } catch (error) {
        console.error('Attempt submit error:', error);
      }
    }
    setQuizResults(results);
    setSelectedLesson(null);
  };

  if (quizResults) {
    return <QuizReportView results={quizResults} onBack={() => { setQuizResults(null); setSelectedCourse(null); }} />;
  }

  if (selectedLesson) {
    return <QuizPlayerView lesson={selectedLesson} onFinish={finishQuiz} onBack={() => setSelectedLesson(null)} />;
  }

  if (selectedCourse) {
    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 pb-24">
        <div className="flex sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md py-4 -mx-4 px-4 sm:relative sm:bg-transparent sm:p-0 sm:m-0">
          <button 
              onClick={() => setSelectedCourse(null)} 
              className="flex items-center gap-4 bg-white px-6 py-4 sm:px-8 sm:py-5 rounded-2xl border border-slate-100 shadow-lg sm:shadow-sm text-slate-900 font-black uppercase text-xs tracking-widest hover:text-blue-600 hover:border-blue-100 transition-all active:scale-95"
          >
            <i className="fa-solid fa-arrow-left-long"></i> Назад к списку
          </button>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl text-white shadow-xl" style={{ backgroundColor: selectedCourse.color }}>
            <i className={`fa-solid ${selectedCourse.icon}`}></i>
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{selectedCourse.name}</h2>
            <p className="text-slate-500 font-bold mt-1 text-sm md:text-base">{selectedCourse.description}</p>
          </div>
        </div>
        
        <div className="space-y-6">
          {selectedCourse.lessons?.map((lesson, idx) => (
            <div 
              key={lesson.id} 
              onClick={() => startLesson(lesson)}
              className={`p-6 md:p-8 rounded-[2.5rem] border-2 transition-all flex justify-between items-center group cursor-pointer ${
                lesson.status === 'locked' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-xl'
              }`}
            >
              <div className="flex items-center gap-5 md:gap-8">
                <span className="text-2xl md:text-3xl font-black text-slate-100 group-hover:text-blue-100 transition-colors">0{idx + 1}</span>
                <div>
                  <h4 className="text-lg md:text-xl font-black text-slate-900 mb-1 leading-tight">{lesson.title}</h4>
                  <p className="text-xs md:text-sm font-medium text-slate-500 line-clamp-2">{lesson.description}</p>
                </div>
              </div>
              <div className="shrink-0 ml-4">
                {lesson.status === 'locked' ? (
                  <i className="fa-solid fa-lock text-slate-300"></i>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <i className="fa-solid fa-play ml-1"></i>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleSelectCourse = async (course: Course) => {
    setIsLoadingLessons(true);
    try {
      const lessons = await apiClient.getCourseLessons(course.id);
      setSelectedCourse({ ...course, lessons });
    } catch (error) {
      console.error('Course lessons load error:', error);
    } finally {
      setIsLoadingLessons(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 pb-24">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map(course => (
          <div key={course.id} onClick={() => handleSelectCourse(course)} className="cursor-pointer">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:shadow-2xl hover:-translate-y-1 hover:border-blue-100 group h-full flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: course.color }}>
                  <i className={`fa-solid ${course.icon}`}></i>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900 leading-none">{course.progress}%</span>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Прогресс</p>
                </div>
              </div>
              <h4 className="text-xl font-black text-slate-900 mb-2 leading-tight">{course.name}</h4>
              <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed flex-grow line-clamp-2">{course.description}</p>
              
              <div className="space-y-4">
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${course.progress}%`, backgroundColor: course.color }}
                  ></div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {course.completedLessons} из {course.totalLessons} уроков
                  </p>
                  <span className="text-blue-600 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">Войти <i className="fa-solid fa-chevron-right ml-1"></i></span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {isLoadingLessons && (
        <div className="text-center text-sm text-slate-400 font-bold">Загружаю уроки...</div>
      )}
    </div>
  );
};

// --- Quiz Player View ---

const QuizPlayerView: React.FC<{ lesson: Lesson; onFinish: (res: any) => void; onBack: () => void }> = ({ lesson, onFinish, onBack }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);

  const questions = lesson.questions || [];
  const q = questions[currentIdx];

  const handleSelect = (opt: string) => {
    if (showFeedback) return;
    setSelectedOption(opt);
    setShowFeedback(true);
    
    const isCorrect = opt === q.correctAnswer;
    setUserAnswers(prev => [...prev, { q: q.text, user: opt, correct: q.correctAnswer, isCorrect, explanation: q.explanation }]);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      const correctCount = userAnswers.filter(a => a.isCorrect).length;
      onFinish({ correct: correctCount, total: questions.length, report: userAnswers });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in zoom-in-95 pb-24">
      <div className="flex justify-between items-center px-2 sticky top-0 z-20 py-2 bg-slate-50/80 backdrop-blur-sm sm:relative sm:bg-transparent sm:p-0">
        <button 
            onClick={onBack} 
            className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-xl sm:shadow-sm text-slate-900 hover:text-blue-600 transition-all font-black uppercase text-xs tracking-widest active:scale-95"
        >
          <i className="fa-solid fa-xmark text-lg"></i> Выйти
        </button>
        <div className="flex gap-2">
          {questions.map((_, i) => (
            <div key={i} className={`w-6 md:w-8 h-1 rounded-full transition-all ${i === currentIdx ? 'bg-blue-600' : i < currentIdx ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
          ))}
        </div>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 shadow-2xl space-y-8 md:space-y-10">
        <div className="space-y-4 md:space-y-6">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Вопрос {currentIdx + 1} из {questions.length}</p>
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">{q.text}</h3>
        </div>

        <div className="grid grid-cols-1 gap-3 md:gap-4">
          {q.options.map(opt => {
            const isCorrect = opt === q.correctAnswer;
            const isSelected = opt === selectedOption;
            
            let btnClass = "bg-slate-50 border-slate-100 hover:border-blue-200 text-slate-700";
            if (showFeedback) {
              if (isCorrect) btnClass = "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-lg shadow-emerald-500/10";
              else if (isSelected) btnClass = "bg-red-50 border-red-400 text-red-700 shadow-lg shadow-red-500/10";
              else btnClass = "bg-slate-50 border-slate-50 text-slate-300 opacity-60";
            }

            return (
              <button 
                key={opt}
                disabled={showFeedback}
                onClick={() => handleSelect(opt)}
                className={`w-full p-5 md:p-6 text-left rounded-2xl border-2 font-bold text-base md:text-lg transition-all flex items-center justify-between ${btnClass}`}
              >
                <span>{opt}</span>
                {showFeedback && isCorrect && <i className="fa-solid fa-circle-check text-xl"></i>}
                {showFeedback && isSelected && !isCorrect && <i className="fa-solid fa-circle-xmark text-xl"></i>}
              </button>
            );
          })}
        </div>

        {showFeedback && (
          <div className="bg-blue-50/50 p-6 md:p-8 rounded-[2rem] border border-blue-100 animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 mb-4">
              <i className="fa-solid fa-lightbulb text-blue-500"></i>
              <h5 className="font-black text-blue-600 uppercase text-[10px] tracking-widest">Объяснение</h5>
            </div>
            <p className="text-sm md:text-base text-slate-700 font-bold leading-relaxed">{q.explanation}</p>
            <button 
              onClick={handleNext}
              className="mt-6 md:mt-8 w-full py-5 md:py-6 bg-blue-600 text-white rounded-2xl font-black text-lg md:text-xl hover:bg-blue-700 shadow-xl shadow-blue-600/30 transition-all active:scale-95"
            >
              {currentIdx === questions.length - 1 ? 'Посмотреть результаты' : 'Следующий вопрос'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Quiz Report View ---

const QuizReportView: React.FC<{ results: any; onBack: () => void }> = ({ results, onBack }) => {
  useEffect(() => {
    // Simulate unlocking an achievement if results are good
    if (results.correct / results.total >= 0.8) {
        // Dispatch a custom event to notify Orchestrator
        window.dispatchEvent(new CustomEvent('achievement-unlocked', { 
            detail: { id: 'a6', title: 'Focus Mode Activated' } 
        }));
    }
  }, [results]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 animate-in zoom-in-95 duration-700 pb-24">
        <div className="text-center space-y-4 md:space-y-6">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-emerald-500 text-white rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center text-4xl md:text-5xl mx-auto shadow-2xl shadow-emerald-500/40 rotate-12">
                <i className="fa-solid fa-flag-checkered"></i>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Урок завершен!</h2>
            <div className="inline-flex items-center gap-4 bg-white px-6 md:px-8 py-3 md:py-4 rounded-3xl border border-slate-100 shadow-xl">
                <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Результат</p>
                    <p className="text-2xl md:text-3xl font-black text-slate-900">{results.correct} из {results.total}</p>
                </div>
                <div className="w-[1px] h-10 bg-slate-100"></div>
                <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Успех</p>
                    <p className="text-2xl md:text-3xl font-black text-emerald-600">{Math.round((results.correct / results.total) * 100)}%</p>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8 md:space-y-10">
            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Отчет по вопросам</h3>
            <div className="space-y-4 md:space-y-6">
                {results.report.map((item: any, i: number) => (
                    <div key={i} className={`p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border flex gap-4 md:gap-8 items-start transition-all ${item.isCorrect ? 'bg-emerald-50/30 border-emerald-100' : 'bg-red-50/30 border-red-100'}`}>
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-lg shrink-0 ${item.isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                            <i className={`fa-solid ${item.isCorrect ? 'fa-check' : 'fa-xmark'}`}></i>
                        </div>
                        <div className="space-y-3 md:space-y-4">
                            <h4 className="text-lg md:text-xl font-bold text-slate-800 leading-tight">{item.q}</h4>
                            <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm font-bold">
                                <span className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl ${item.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>Ваш ответ: {item.user}</span>
                                {!item.isCorrect && <span className="px-3 md:px-4 py-1.5 md:py-2 bg-slate-100 text-slate-600 rounded-xl">Правильно: {item.correct}</span>}
                            </div>
                            <p className="text-xs md:text-sm text-slate-500 italic">"{item.explanation}"</p>
                        </div>
                    </div>
                ))}
            </div>
            <button 
                onClick={onBack}
                className="w-full py-5 md:py-7 bg-blue-600 text-white rounded-[2rem] font-black text-xl md:text-2xl hover:bg-blue-700 shadow-2xl shadow-blue-600/30 transition-all active:scale-95"
            >
                Завершить и выйти
            </button>
        </div>
    </div>
  );
};

// --- Analytics View ---

const defaultSkillData: SkillNode = {
  name: "SmartSpeek Profile",
  value: 100,
  children: [
    { name: "Grammar", value: 65 },
    { name: "Speaking", value: 45 },
    { name: "Vocabulary", value: 80 },
    { name: "Listening", value: 55 },
    { name: "Writing", value: 50 },
  ],
};

export const AnalyticsView: React.FC<{ skillData: SkillNode | null; userName?: string }> = ({ skillData, userName = '' }) => {
  const [motivationalAdvice, setMotivationalAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  
  useEffect(() => {
    if (!skillData || !skillData.children) return;
    
    const generateAdvice = async () => {
      setLoadingAdvice(true);
      try {
        const { getTutorInsights } = await import('../services/gemini');
        const skillsSummary = skillData.children.map(s => `${s.name}: ${s.value}%`).join(', ');
        const highestSkill = skillData.children.reduce((max, s) => s.value > max.value ? s : max, skillData.children[0]);
        const lowestSkill = skillData.children.reduce((min, s) => s.value < min.value ? s : min, skillData.children[0]);
        
        const prompt = `Пользователь ${userName || 'ученик'} имеет следующие результаты по навыкам: ${skillsSummary}. Самый сильный навык: ${highestSkill.name} (${highestSkill.value}%), самый слабый: ${lowestSkill.name} (${lowestSkill.value}%). Дай мотивационный совет на русском языке (2-3 предложения), который будет вдохновлять и давать конкретные рекомендации.`;
        
        const insights = await getTutorInsights(prompt);
        if (insights && insights.length > 0) {
          setMotivationalAdvice(insights[0].message || '');
        } else {
          setMotivationalAdvice(`Твой уровень заметно подрос! Твоя уверенность в ${highestSkill.name} — это отличная база для следующего шага. Сфокусируйся на ${lowestSkill.name} для более сбалансированного прогресса.`);
        }
      } catch (error) {
        console.error('Ошибка генерации совета:', error);
        const highestSkill = skillData.children.reduce((max, s) => s.value > max.value ? s : max, skillData.children[0]);
        setMotivationalAdvice(`Твой уровень заметно подрос! Твоя уверенность в ${highestSkill.name} — это отличная база для следующего шага. Продолжай в том же духе!`);
      } finally {
        setLoadingAdvice(false);
      }
    };
    
    generateAdvice();
  }, [skillData, userName]);
  
  const currentSkills = skillData?.children || defaultSkillData.children;
  
  return (
  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 pb-24">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-7 space-y-10">
        <SkillTree data={skillData || defaultSkillData} />
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Прогресс по навыкам</h3>
            <div className="space-y-6">
                {currentSkills.map(skill => {
                  const colorMap: { [key: string]: string } = {
                    'Speaking': 'bg-blue-500',
                    'Grammar': 'bg-emerald-500',
                    'Vocabulary': 'bg-orange-500',
                    'Listening': 'bg-indigo-500',
                    'Writing': 'bg-purple-500'
                  };
                  return (
                    <div key={skill.name}>
                        <div className="flex justify-between mb-2">
                            <span className="font-bold text-slate-700">{skill.name}</span>
                            <span className="font-black text-slate-900">{skill.value}%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${colorMap[skill.name] || 'bg-blue-500'} rounded-full transition-all duration-1000`} style={{ width: `${skill.value}%` }}></div>
                        </div>
                    </div>
                  );
                })}
            </div>
        </div>
      </div>
      <div className="lg:col-span-5 space-y-10">
        <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-2xl border border-slate-800">
            <h3 className="text-2xl font-black mb-8 tracking-tight">Статистика недели</h3>
            <div className="space-y-8">
                {[
                    { label: 'Время обучения', val: '4.5 ч', icon: 'fa-clock' },
                    { label: 'Выучено слов', val: '+45', icon: 'fa-plus' },
                    { label: 'Точность ответов', val: '88%', icon: 'fa-bullseye' },
                ].map((stat, i) => (
                    <div key={i} className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-2xl text-blue-400">
                            <i className={`fa-solid ${stat.icon}`}></i>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-2xl font-black">{stat.val}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        
        {/* AI Mentor Motivational Block */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 rounded-[1.5rem] flex items-center justify-center mb-8 backdrop-blur-md border border-white/30 shadow-xl">
                    <i className="fa-solid fa-wand-magic-sparkles text-2xl"></i>
                </div>
                <h3 className="text-xs font-black mb-4 tracking-[0.2em] uppercase text-indigo-200">Совет наставника</h3>
                {loadingAdvice ? (
                  <p className="text-white font-bold leading-relaxed text-lg mb-8">Генерирую персональный совет...</p>
                ) : (
                  <p className="text-white font-bold leading-relaxed text-lg mb-8">
                    "{motivationalAdvice || 'Продолжай в том же духе, ты двигаешься к своим целям!'}"
                  </p>
                )}
                <div className="flex items-center gap-3">
                    <div className="h-[2px] flex-1 bg-white/20 rounded-full"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-200">SmartSpeek AI</span>
                </div>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-[0.08] pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000">
                <i className="fa-solid fa-gem text-[15rem]"></i>
            </div>
        </div>
      </div>
    </div>
  </div>
  );
};

// --- Telegram View ---

export const TelegramView: React.FC = () => (
  <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in slide-in-from-bottom-6 pb-24">
    <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl flex flex-col md:flex-row items-center gap-12">
        <div className="w-32 h-32 bg-blue-100 text-blue-600 rounded-[2.5rem] flex items-center justify-center text-6xl shrink-0">
            <i className="fa-brands fa-telegram"></i>
        </div>
        <div className="flex-1 text-center md:text-left">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Telegram Sync</h2>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed font-medium">
                Получайте уведомления об уроках и практикуйте Speaking прямо в Telegram боте.
            </p>
            <button className="px-10 py-5 bg-[#0088cc] text-white rounded-2xl font-black text-lg hover:bg-[#0077b5] transition-all shadow-xl shadow-blue-500/20 active:scale-95">
                Подключить бота <i className="fa-solid fa-external-link ml-2 text-sm"></i>
            </button>
        </div>
    </div>
  </div>
);

// --- Settings View ---

export const SettingsView: React.FC<{ onSave: (payload: { name: string; level: string }) => void; onCancel: () => void; userName?: string; userLevel?: string }> = ({ onSave, onCancel, userName = '', userLevel = 'B1' }) => {
  const [name, setName] = useState(userName);
  const [level, setLevel] = useState(userLevel);
  
  return (
  <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-6 pb-24">
    <div className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="space-y-8 md:space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Имя пользователя</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" 
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Уровень (CEFR)</label>
                    <select 
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 outline-none focus:border-blue-500 transition-all"
                    >
                        <option value="A1">A1 (Beginner)</option>
                        <option value="A2">A2 (Elementary)</option>
                        <option value="B1">B1 (Intermediate)</option>
                        <option value="B2">B2 (Upper Intermediate)</option>
                        <option value="C1">C1 (Advanced)</option>
                    </select>
                </div>
            </div>
            <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                <button 
                    onClick={() => onSave({ name, level })}
                    className="flex-1 px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-600/20"
                >
                    Сохранить изменения
                </button>
                <button 
                    onClick={onCancel}
                    className="px-10 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all active:scale-95"
                >
                    Отмена
                </button>
            </div>
        </div>
    </div>
  </div>
);
};

// --- Diagnostic View ---

export const DiagnosticView: React.FC = () => (
    <div className="max-w-3xl mx-auto py-12 space-y-10 pb-24">
        <h2 className="text-3xl font-black text-slate-900">Диагностика уровня</h2>
        <div className="space-y-6">
            {DIAGNOSTIC_STEPS.map((step, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">Задание {i+1}: {step.type}</p>
                    <p className="text-lg font-bold text-slate-800 mb-6">{step.question}</p>
                    {step.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {step.options.map(opt => (
                                <button key={opt} className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-left font-bold text-slate-700 hover:border-blue-400 hover:bg-blue-50 transition-all">
                                    {opt}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
);

// --- Learning Plan View ---

export const LearningPlanView: React.FC<{ plan: LearningPlan; onAccept: () => void; onNavigateAchievements: () => void }> = ({ plan, onAccept, onNavigateAchievements }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePersonal = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 3000);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 pb-24">
      {/* Dynamic Generation Header */}
      <div className="bg-slate-900 rounded-[3.5rem] p-8 md:p-14 text-white border border-slate-800 shadow-2xl relative overflow-hidden group">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
             <span className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400">Adaptive Core</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Генерация персональных уроков</h2>
          <p className="text-slate-400 text-xl mb-12 max-w-2xl leading-relaxed font-medium">
            Нейро-оркестратор готов создать уникальные задания на основе ваших последних ошибок и текущих интересов в IT/AI.
          </p>
          <div className="flex flex-wrap gap-5">
            <button 
                onClick={handleGeneratePersonal}
                disabled={isGenerating}
                className="group px-12 py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 active:scale-95 flex items-center gap-4"
            >
                {isGenerating ? (
                <>
                    <i className="fa-solid fa-circle-notch animate-spin"></i> Синхронизация...
                </>
                ) : (
                <>
                    <i className="fa-solid fa-bolt text-amber-400"></i> Сгенерировать урок
                </>
                )}
            </button>
            <button 
                onClick={onNavigateAchievements}
                className="px-12 py-6 bg-white/5 backdrop-blur-xl text-white border border-white/10 rounded-[2rem] font-black text-xl hover:bg-white/10 transition-all active:scale-95 flex items-center gap-4 group"
            >
                <i className="fa-solid fa-trophy text-amber-500 group-hover:scale-125 transition-transform"></i> Достижения
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
           <i className="fa-solid fa-brain text-[20rem]"></i>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4">
          <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-4">Ваш учебный план (7 дней)</h2>
              <p className="text-slate-500 text-xl font-bold leading-relaxed">Интенсивный путь к IT-свободе от оркестратора SmartSpeek.</p>
          </div>
          <button 
              onClick={onAccept}
              className="w-full md:w-auto px-12 py-6 bg-white border-2 border-slate-100 text-slate-900 rounded-[2rem] font-black text-xl hover:bg-slate-50 hover:border-blue-200 shadow-sm transition-all active:scale-95"
          >
              Принять изменения
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plan.schedule.map(day => (
              <div key={day.day} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group h-full flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-2xl font-black shadow-inner">
                          {day.day}
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] group-hover:text-blue-500 transition-colors">День</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-8 leading-tight flex-grow">{day.title}</h3>
                  <div className="space-y-4">
                      {day.steps.map(step => (
                          <div key={step.id} className="flex items-center gap-5 p-4 bg-slate-50 rounded-2xl border border-transparent group-hover:border-blue-100/50 transition-all">
                              <div className={`w-3 h-3 rounded-full shadow-sm ${step.status === 'current' ? 'bg-blue-500 animate-pulse ring-4 ring-blue-500/20' : 'bg-slate-300'}`}></div>
                              <span className="text-sm font-black text-slate-700 tracking-tight">{step.title}</span>
                          </div>
                      ))}
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};

// --- Daily Session View ---

export const DailySessionView: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [step] = useState(1);
    const [answer, setAnswer] = useState('');
    const [feedback, setFeedback] = useState<any>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);

    const handleEvaluate = async () => {
        setIsEvaluating(true);
        const result = await evaluateDiagnosticResponse('speaking', 'Опишите ваш последний рабочий день на английском.', answer);
        setFeedback(result);
        setIsEvaluating(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-in zoom-in-95 pb-24">
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 shadow-2xl space-y-10 relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10 sticky top-0 bg-white/95 backdrop-blur-sm -mx-4 px-4 py-2 sm:relative sm:bg-transparent sm:m-0 sm:p-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 text-white rounded-3xl flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-blue-600/20 shrink-0">
                            <i className="fa-solid fa-microphone"></i>
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight truncate">Daily Practice</h3>
                            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-0.5">Шаг {step} из 3</p>
                        </div>
                    </div>
                    <button onClick={onComplete} className="text-slate-900 hover:text-blue-600 transition-colors p-3 bg-slate-50 rounded-2xl border border-slate-100 active:scale-90 shadow-sm ml-2">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                <div className="space-y-8 relative z-10">
                    <div className="bg-slate-50 p-6 md:p-10 rounded-[2.5rem] border border-slate-100">
                        <p className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed italic">"Опишите ваш последний рабочий день на английском. Используйте не менее 3-х предложений."</p>
                    </div>

                    <textarea 
                        className="w-full h-48 bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 md:p-8 text-lg md:text-xl font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300 shadow-inner"
                        placeholder="Начните писать или говорить..."
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                    ></textarea>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                            onClick={handleEvaluate}
                            disabled={!answer.trim() || isEvaluating}
                            className="flex-1 py-5 md:py-6 bg-blue-600 text-white rounded-2xl font-black text-lg md:text-xl hover:bg-blue-700 shadow-xl shadow-blue-600/30 transition-all disabled:opacity-50 active:scale-95"
                        >
                            {isEvaluating ? <i className="fa-solid fa-circle-notch animate-spin"></i> : 'Проверить ответ'}
                        </button>
                        <button className="flex-1 py-5 md:py-6 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-black text-lg md:text-xl hover:bg-slate-50 transition-all active:scale-95">
                            <i className="fa-solid fa-microphone mr-2"></i> Говорить
                        </button>
                    </div>

                    {feedback && (
                        <div className="bg-emerald-50 p-8 md:p-10 rounded-[2.5rem] border border-emerald-100 animate-in slide-in-from-top-6">
                            <div className="flex items-center gap-3 mb-6">
                                <i className="fa-solid fa-circle-check text-emerald-500 text-2xl"></i>
                                <h4 className="text-xl font-black text-emerald-800">Фидбек от ИИ</h4>
                            </div>
                            <p className="text-emerald-700 font-bold leading-relaxed mb-6">{feedback.feedback}</p>
                            <div className="flex gap-6">
                                <div>
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Оценка</p>
                                    <p className="text-2xl md:text-3xl font-black text-emerald-900">{feedback.score}/2</p>
                                </div>
                                {feedback.cefr_hint && (
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Уровень</p>
                                        <p className="text-2xl md:text-3xl font-black text-emerald-900">{feedback.cefr_hint}</p>
                                    </div>
                                )}
                            </div>
                            <button onClick={onComplete} className="mt-8 md:mt-10 w-full py-5 bg-emerald-500 text-white rounded-xl font-black text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95">
                                Завершить занятие
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
