
import React from 'react';
import { Achievement } from '../types';
interface AchievementBadgeProps {
  achievement: Achievement;
  allAchievements?: Achievement[];
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievement, allAchievements = [] }) => {
  const isLocked = achievement.status === 'locked';
  const tier = achievement.tier;
  const achievementsList = allAchievements.length ? allAchievements : [achievement];

  // Determine visibility level:
  // 1. Unlocked: Full color
  // 2. Next 5 Locked: Slightly visible with padlock
  // 3. Others: Blurred/hidden
  
  const unlockedCount = achievementsList.filter(a => a.status === 'unlocked').length;
  const currentIndex = achievementsList.findIndex(a => a.id === achievement.id);
  
  // Logic: Unlocked are always visible. Next 5 after the last unlocked are "reachable".
  const lastUnlockedIndex = achievementsList.reduce((acc, a, idx) => a.status === 'unlocked' ? idx : acc, -1);
  const isReachable = currentIndex > lastUnlockedIndex && currentIndex <= lastUnlockedIndex + 5;
  const isHidden = currentIndex > lastUnlockedIndex + 5;

  if (isHidden && isLocked) {
    return (
        <div className="relative flex flex-col items-center p-5 rounded-[2rem] border border-slate-100 bg-slate-50 opacity-20 blur-sm pointer-events-none">
            <div className="w-16 h-16 rounded-[1.5rem] bg-slate-200 mb-4"></div>
            <div className="w-full h-2 bg-slate-200 rounded"></div>
        </div>
    );
  }

  // Tier-specific colors
  const getTierStyles = () => {
    if (isLocked) return 'bg-white border-slate-100 opacity-60 grayscale';
    
    switch (tier) {
      case 7: return 'bg-indigo-900 border-indigo-400 text-indigo-100 shadow-[0_0_20px_rgba(129,140,248,0.3)] ring-2 ring-indigo-400/50 ring-offset-2';
      case 6: return 'bg-slate-900 border-slate-400 text-slate-100 shadow-xl ring-2 ring-slate-400/30';
      case 5: return 'bg-amber-500/10 border-amber-500/50 text-amber-700 shadow-lg';
      case 4: return 'bg-emerald-500/10 border-emerald-500/50 text-emerald-700';
      case 3: return 'bg-blue-500/10 border-blue-500/50 text-blue-700';
      default: return 'bg-white border-slate-100 text-slate-700 shadow-sm';
    }
  };

  const getIconStyles = () => {
    if (isLocked) return 'bg-slate-50 text-slate-300';
    
    switch (tier) {
      case 7: return 'bg-indigo-500 text-white animate-pulse';
      case 6: return 'bg-slate-700 text-white';
      case 5: return 'bg-amber-500 text-white';
      case 4: return 'bg-emerald-500 text-white';
      case 3: return 'bg-blue-500 text-white';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className={`relative group flex flex-col items-center p-5 rounded-[2rem] border transition-all duration-500 cursor-default ${getTierStyles()} ${!isLocked && 'hover:scale-105 hover:shadow-2xl'}`}>
      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-2xl mb-4 transition-transform group-hover:rotate-12 ${getIconStyles()}`}>
        <i className={`fa-solid ${achievement.icon}`}></i>
      </div>
      
      <div className="text-center">
        <h5 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isLocked ? 'text-slate-400' : ''}`}>
          {achievement.title}
        </h5>
        <p className={`text-[9px] font-bold leading-tight ${isLocked ? 'text-slate-300' : 'opacity-70'}`}>
          {achievement.description}
        </p>
      </div>

      {isLocked && (
        <div className="absolute top-2 right-4 text-[10px] text-slate-300">
           <i className="fa-solid fa-lock"></i>
        </div>
      )}

      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-0.5">
         {[...Array(tier)].map((_, i) => (
           <div key={i} className={`w-1 h-1 rounded-full ${isLocked ? 'bg-slate-200' : 'bg-current opacity-40'}`}></div>
         ))}
      </div>
      
      {!isLocked && achievement.date && (
        <span className="absolute -bottom-2 bg-blue-600 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg">
          {achievement.date}
        </span>
      )}
    </div>
  );
};

export default AchievementBadge;
