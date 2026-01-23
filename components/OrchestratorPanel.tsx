
import React, { useState, useRef, useEffect } from 'react';
import { OrchestratorTask } from '../types';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
}

type OrchestratorMode = 'chat' | 'pronunciation' | 'interview';

interface OrchestratorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
}

const OrchestratorPanel: React.FC<OrchestratorPanelProps> = ({ isOpen, onClose, currentView }) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<OrchestratorMode>('chat');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [interviewDuration, setInterviewDuration] = useState<number | null>(null);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Привет! Я твой персональный оркестратор SmartSpeek AI. Я слежу за твоим прогрессом и адаптирую план обучения. Чем могу помочь?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const tasks: OrchestratorTask[] = [
    { id: '1', label: 'Анализ уровня произношения', status: 'active', progress: 40 },
    { id: '2', label: 'Синхронизация SkillState', status: 'completed' },
    { id: '3', label: 'Подбор IT-контекста (RAG)', status: 'pending' },
  ];

  useEffect(() => {
    const handleAchievement = async (e: any) => {
        const { id, title } = e.detail;
        setIsTyping(true);
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Пользователь только что разблокировал достижение: "${title}" (ID: ${id}). 
            Ты — SmartSpeek AI Orchestrator. Твоя задача — не просто поздравить, а прокомментировать прогресс пользователя, объяснив, как этот конкретный навык поможет ему в карьере IT. Отвечай на русском.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
            });

            const aiText = response.text || `Потрясающе! Достижение "${title}" разблокировано. Это важный шаг к твоему профессиональному английскому.`;
            setMessages(prev => [...prev, { role: 'model', text: `🏆 НОВОЕ ДОСТИЖЕНИЕ: ${title}` }, { role: 'model', text: aiText }]);
        } catch (error) {
            console.error("AI Commentary Error:", error);
        } finally {
            setIsTyping(false);
        }
    };

    window.addEventListener('achievement-unlocked', handleAchievement);
    return () => window.removeEventListener('achievement-unlocked', handleAchievement);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input.trim();
    if (!textToSend && !customText) return;
    if (isTyping) return;

    if (!navigator.onLine) {
        setMessages(prev => [...prev, { role: 'model', text: 'Извини, я работаю только онлайн. Подключись к сети, чтобы я мог проанализировать твой запрос.' }]);
        return;
    }

    if (!customText) setInput('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let systemInstruction = "Ты — SmartSpeek AI Orchestrator. Твоя роль: помогать пользователю в обучении английскому (сегмент IT).";
      
      if (mode === 'interview') {
        systemInstruction += ` Сейчас ты проводишь техническое интервью. Длительность: ${interviewDuration} минут. Твоя задача: вести живой диалог на английском по теме пользователя, задавать профессиональные вопросы и СТРОГО КОНТРОЛИРОВАТЬ ПРОИЗНОШЕНИЕ. Оценивай ответы, исправляй ошибки в речи и давай советы по артикуляции. Основной язык диалога — английский, но краткий фидбек по ошибкам можно давать на русском.`;
      } else if (mode === 'pronunciation') {
        systemInstruction += " Сейчас ты оцениваешь произношение пользователя. Он пришлет текст или запись. Проанализируй ошибки и дай советы по артикуляции на русском.";
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          ...messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          })),
          { role: 'user', parts: [{ text: `${systemInstruction} Текущий экран: ${currentView}. Пользователь говорит: ${textToSend}. Отвечай кратко и профессионально.` }] }
        ],
      });

      const aiText = response.text || "Извини, я отвлекся на анализ данных. Повтори, пожалуйста?";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      console.error("Orchestrator Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Произошла ошибка связи с нейронной сетью. Попробуй позже." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      handleSend("Recorded audio response about system architecture.");
    } else {
      setIsRecording(true);
    }
  };

  const switchMode = (newMode: OrchestratorMode) => {
    setMode(newMode);
    setIsInterviewActive(false);
    setInterviewDuration(null);
    let welcomeMessage = "";
    if (newMode === 'chat') welcomeMessage = "Я готов обсудить твой прогресс!";
    if (newMode === 'pronunciation') welcomeMessage = "Давай поработаем над произношением. Запиши свою речь или напиши фразу, которую хочешь отработать.";
    if (newMode === 'interview') welcomeMessage = "Добро пожаловать в режим имитации интервью. Выбери длительность сессии, чтобы начать.";
    
    setMessages(prev => [...prev, { role: 'model', text: welcomeMessage }]);
  };

  const startInterview = (duration: number) => {
    setInterviewDuration(duration);
    setIsInterviewActive(true);
    const startMsg = `Запускаю интервью на ${duration} минут. Ready? Let's start. Can you tell me about your background in IT and what kind of projects you've been working on recently?`;
    setMessages(prev => [...prev, { role: 'model', text: startMsg }]);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-y-0 right-0 ${isFullScreen ? 'inset-x-0 w-full' : 'w-full sm:w-80'} bg-slate-950 border-l border-slate-800 shadow-2xl z-[100] flex flex-col animate-in slide-in-from-right duration-300 transition-all`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping absolute inset-0"></div>
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full relative shadow-lg shadow-blue-500/50"></div>
          </div>
          <div>
            <h3 className="text-white font-black tracking-widest text-[10px] uppercase">SmartSpeek AI</h3>
            <p className="text-[8px] text-blue-400 font-bold uppercase tracking-widest mt-0.5">{mode === 'chat' ? 'Orchestrator' : mode === 'interview' ? 'Interview Mode' : 'Speech Trainer'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsFullScreen(!isFullScreen)} 
            className="text-slate-500 hover:text-white transition-all w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-800"
            title={isFullScreen ? "Свернуть" : "На весь экран"}
          >
            <i className={`fa-solid ${isFullScreen ? 'fa-compress' : 'fa-expand'} text-sm`}></i>
          </button>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-all w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-800">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
      </div>

      {/* Mode Switches */}
      <div className="flex p-2 bg-slate-900 border-b border-slate-800 shrink-0">
        <button 
          onClick={() => switchMode('chat')}
          className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === 'chat' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <i className="fa-solid fa-comment mr-2"></i> Чат
        </button>
        <button 
          onClick={() => switchMode('pronunciation')}
          className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === 'pronunciation' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <i className="fa-solid fa-microphone mr-2"></i> Речь
        </button>
        <button 
          onClick={() => switchMode('interview')}
          className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === 'interview' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <i className="fa-solid fa-briefcase mr-2"></i> Интервью
        </button>
      </div>

      {/* Main Content Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar scroll-smooth bg-slate-950/50">
        {mode === 'interview' && !isInterviewActive && (
          <div className="animate-in zoom-in duration-500 space-y-6">
            <div className="text-center p-4 bg-slate-900/50 rounded-3xl border border-slate-800">
              <i className="fa-solid fa-stopwatch text-blue-500 text-3xl mb-4"></i>
              <h4 className="text-white font-black text-sm uppercase tracking-widest mb-2">Длительность сессии</h4>
              <p className="text-xs text-slate-500 mb-6">Выберите время для профессионального диалога и контроля произношения.</p>
              <div className="grid grid-cols-3 gap-3">
                {[5, 10, 25].map(time => (
                  <button 
                    key={time}
                    onClick={() => startInterview(time)}
                    className="py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white font-black text-xs hover:bg-blue-600 hover:border-blue-500 transition-all shadow-lg active:scale-95"
                  >
                    {time} мин
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.length < 3 && mode === 'chat' && (
          <div className="animate-in fade-in duration-500">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Status & Tasks</p>
            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-slate-400 font-bold">{task.label}</span>
                    {task.status === 'active' ? (
                      <i className="fa-solid fa-circle-notch animate-spin text-blue-400 text-[10px]"></i>
                    ) : (
                      <i className="fa-solid fa-check text-emerald-500 text-[10px]"></i>
                    )}
                  </div>
                  {task.status === 'active' && (
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${task.progress}%` }}></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`space-y-6 ${isFullScreen ? 'max-w-4xl mx-auto' : ''}`}>
          {(isInterviewActive || mode !== 'interview') && (
            <>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{mode === 'chat' ? 'Conversation' : 'Active Session'}</p>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed font-medium ${
                    msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-xl shadow-blue-600/10' 
                    : msg.text.startsWith('🏆') ? 'bg-amber-500/10 border border-amber-500 text-amber-400 font-black italic'
                    : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </>
          )}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-900 text-slate-400 p-4 rounded-2xl rounded-tl-none border border-slate-800 flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className={`p-4 border-t border-slate-800 bg-slate-950/80 backdrop-blur-md shrink-0 ${isFullScreen ? 'pb-12' : ''}`}>
        <div className={`relative ${isFullScreen ? 'max-w-4xl mx-auto' : ''}`}>
          <div className="flex items-center gap-3">
             {(mode === 'pronunciation' || (mode === 'interview' && isInterviewActive)) && (
               <button 
                onClick={toggleRecording}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg ${
                  isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
               >
                 <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
               </button>
             )}
             <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={mode === 'interview' && !isInterviewActive}
                  placeholder={mode === 'chat' ? "Спроси оркестратора..." : mode === 'interview' ? (isInterviewActive ? "Ответь на вопрос..." : "Выбери длительность выше") : "Напиши текст для тренировки..."}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-4 pl-5 pr-12 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-600 transition-all shadow-inner disabled:opacity-30 disabled:cursor-not-allowed"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping || (mode === 'interview' && !isInterviewActive)}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    !input.trim() || isTyping || (mode === 'interview' && !isInterviewActive) ? 'text-slate-700 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-600/20 active:scale-95'
                  }`}
                >
                  <i className="fa-solid fa-paper-plane text-xs"></i>
                </button>
             </div>
          </div>
        </div>
        {!isFullScreen && (
          <p className="text-[9px] text-slate-700 text-center mt-4 uppercase tracking-widest font-bold">
            SmartSpeek AI • Gemini 3 • IT English
          </p>
        )}
      </div>
    </div>
  );
};

export default OrchestratorPanel;
