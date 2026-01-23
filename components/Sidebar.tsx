
import React from 'react';

export type ViewType = 'dashboard' | 'courses' | 'achievements' | 'analytics' | 'telegram' | 'settings' | 'learning-plan' | 'daily-session';

interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isMobile = false }) => {
  const navItems: { icon: string; label: string; id: ViewType }[] = [
    { icon: 'fa-house', label: 'Learning Space', id: 'dashboard' },
    { icon: 'fa-calendar-days', label: 'Учебный план', id: 'learning-plan' },
    { icon: 'fa-book-open', label: 'Курсы', id: 'courses' },
    { icon: 'fa-trophy', label: 'Достижения', id: 'achievements' },
    { icon: 'fa-chart-pie', label: 'Аналитика', id: 'analytics' },
    { icon: 'fa-paper-plane', label: 'Telegram Бот', id: 'telegram' },
    { icon: 'fa-gear', label: 'Настройки', id: 'settings' },
  ];

  const sidebarClasses = isMobile 
    ? "h-full w-full bg-slate-900 text-slate-300 flex flex-col shadow-2xl border-r border-slate-800"
    : "group sticky top-0 h-screen w-20 hover:w-64 bg-slate-900 text-slate-300 flex flex-col z-50 shadow-2xl transition-all duration-300 ease-in-out border-r border-slate-800 shrink-0";

  return (
    <aside className={sidebarClasses}>
      {/* Logo Section */}
      <div className="p-5 flex items-center gap-4 overflow-hidden shrink-0">
        <div className="min-w-[40px] w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20 shrink-0">
          SS
        </div>
        <span className={`text-xl font-bold text-white tracking-tight transition-opacity duration-300 whitespace-nowrap ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          SmartSpeek AI
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-4 px-3 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                  currentView === item.id
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                    : 'hover:bg-slate-800 hover:text-white border border-transparent'
                }`}
              >
                <i className={`fa-solid ${item.icon} text-lg min-w-[20px] text-center`}></i>
                <span className={`font-bold text-sm transition-opacity duration-300 whitespace-nowrap ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Sync Section */}
      <div className="p-4 mt-auto shrink-0">
        <div className="bg-slate-800/40 rounded-2xl p-3 border border-slate-700/50 overflow-hidden">
          <div className="flex items-center gap-3">
            <i className="fa-brands fa-telegram text-blue-400 text-xl min-w-[20px] text-center"></i>
            <div className={`transition-opacity duration-300 whitespace-nowrap ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Синхронизация</p>
            </div>
          </div>
          <div className={`mt-3 transition-opacity duration-300 whitespace-nowrap ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
             <button 
              onClick={() => onNavigate('telegram')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
            >
              Настроить
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
