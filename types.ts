
export interface UserPreferences {
  timeBudget: number; // minutes per day
  scheduleStyle: 'intensive' | 'relaxed' | 'balanced';
  speakingMode: 'text' | 'voice';
  difficulty: 'auto' | 'challenging' | 'easy';
}

export interface OnboardingData {
  role: string;
  english_level: string;
  goals: string[];
  work_tasks: string[];
  tech_vocab_level: string;
  speaking_issue: string;
  grammar_attitude: string;
  learning_format: string[];
  time_commitment: string;
  success_criteria: string;
  gender: 'male' | 'female';
}

export interface TutorPersona {
  tone: string;
  correction_level: string;
  speech_speed: string;
  description: string;
}

export interface LearningGoal extends OnboardingData {
  description: string;
  time_horizon: string;
  weekly_time: number;
  level_at_creation: string;
  source: "clear" | "vague" | "none";
  commitment_score?: number;
}

export interface LearningStep {
  id: string;
  title: string;
  type: 'speaking' | 'listening' | 'grammar' | 'reading' | 'writing' | 'diagnostic' | 'dialogue' | 'quiz';
  status: 'pending' | 'completed' | 'current';
  content?: string;
  correction?: string;
  explanation?: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'text' | 'quiz';
  questions?: Question[];
  status: 'locked' | 'available' | 'completed';
}

export interface Course {
  id: string;
  name: string;
  description: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  color: string;
  icon: string;
  lessons?: Lesson[];
}

export interface DayPlan {
  day: number;
  title: string;
  steps: LearningStep[];
}

export interface LearningPlan {
  id: string;
  goal_id: string;
  duration_days: number;
  schedule: DayPlan[];
  rationale: string;
}

export interface SessionAttempt {
  stepId: string;
  user_input: string;
  score: number;
  feedback: string;
  timestamp: string;
}

export interface CourseProgress {
  id: string;
  name: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  color: string;
}

export interface UpcomingLesson {
  id: string;
  title: string;
  course: string;
  time: string;
  duration: string;
}

export interface SkillNode {
  name: string;
  value: number;
  children?: SkillNode[];
}

export interface AIInsight {
  topic: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'locked' | 'unlocked';
  date?: string;
  type: 'course' | 'streak' | 'skill';
  tier: number; // 1 to 7
  trigger?: string;
}

export interface AITerm {
  term: string;
  definition: string;
  icon: string;
}

export interface OrchestratorTask {
  id: string;
  label: string;
  status: 'active' | 'completed' | 'pending';
  progress?: number;
}

export interface DiagnosticStep {
  id: string;
  type: string;
  title: string;
  question: string;
  options?: string[];
}
