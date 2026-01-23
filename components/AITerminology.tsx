
import React from 'react';
import { AI_TERMINOLOGY } from '../constants';

const AITerminology: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center text-xl">
          <i className="fa-solid fa-book-atlas"></i>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 leading-none">Терминология ИИ</h2>
          <p className="text-xs text-slate-500 mt-1">Ключевые понятия современной лингвистики и ИИ</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AI_TERMINOLOGY.map((item, index) => (
          <div 
            key={index} 
            className="group p-4 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <i className={`fa-solid ${item.icon} text-sm`}></i>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800 mb-1">{item.term}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{item.definition}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
        <p className="text-xs text-slate-400">Хотите узнать больше? Спросите вашего нейро-репетитора!</p>
        <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider">
          Справочник полностью <i className="fa-solid fa-chevron-right ml-1"></i>
        </button>
      </div>
    </div>
  );
};

export default AITerminology;
