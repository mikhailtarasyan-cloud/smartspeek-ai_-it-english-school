
import React from 'react';
import { CourseProgress } from '../types';

interface CourseCardProps {
  course: CourseProgress;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-emerald-200">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-xl" style={{ backgroundColor: `${course.color}20` }}>
          <i className="fa-solid fa-graduation-cap text-lg" style={{ color: course.color }}></i>
        </div>
        <span className="text-sm font-semibold text-slate-500">{course.progress}%</span>
      </div>
      <h4 className="font-bold text-slate-800 mb-1 leading-tight">{course.name}</h4>
      <p className="text-xs text-slate-500 mb-4">{course.completedLessons} of {course.totalLessons} lessons completed</p>
      
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500" 
          style={{ width: `${course.progress}%`, backgroundColor: course.color }}
        ></div>
      </div>
    </div>
  );
};

export default CourseCard;
