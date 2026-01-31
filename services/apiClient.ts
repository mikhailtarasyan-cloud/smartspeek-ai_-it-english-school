const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

let accessToken: string | null = null;

const getStoredToken = () => {
  if (accessToken) return accessToken;
  const stored = localStorage.getItem('smartspeek_token');
  if (stored) accessToken = stored;
  return accessToken;
};

const setStoredToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('smartspeek_token', token);
  } else {
    localStorage.removeItem('smartspeek_token');
  }
};

const request = async (path: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let body: any = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    const error: any = new Error('API request failed');
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return response.json();
};

export const apiClient = {
  setToken: setStoredToken,
  getToken: getStoredToken,
  register: (payload: { email: string; password: string; name: string; avatar?: string }) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCourses: () => request('/courses'),
  getCourseLessons: (courseId: string) => request(`/courses/${courseId}/lessons`),
  getLesson: (lessonId: string) => request(`/lessons/${lessonId}`),
  submitAttempt: (lessonId: string, payload: { score: number; answers: any[] }) =>
    request(`/lessons/${lessonId}/attempt`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getDashboard: () => request('/dashboard'),
  getProgress: () => request('/progress'),
  getTrueFalseTopics: () => request('/minigames/truefalse/topics'),
  startTrueFalseSession: (payload: { topic_id: string; n_questions?: number; resume?: boolean }) =>
    request('/minigames/truefalse/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getTrueFalseSession: (sessionId: string) => request(`/minigames/truefalse/sessions/${sessionId}`),
  answerTrueFalse: (sessionId: string, payload: { question_id: string; user_answer: boolean; response_time_ms?: number }) =>
    request(`/minigames/truefalse/sessions/${sessionId}/answer`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  nextTrueFalse: (sessionId: string) => request(`/minigames/truefalse/sessions/${sessionId}/next`),
  restartTrueFalse: (sessionId: string) => request(`/minigames/truefalse/sessions/${sessionId}/restart`, { method: 'POST' }),
  getLearningPlanCurrent: () => request('/learning-plan/current'),
  generateLearningPlan: (payload: {
    plan_length: 7 | 21;
    cefr_level: string;
    goals: string[];
    free_text_goal?: string;
    role?: string;
    interests: string[];
    weak_terms?: string[];
    weak_skills?: string[];
  }) =>
    request('/learning-plan/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getLearningPlanLesson: (planId: string, lessonIndex: number) =>
    request(`/learning-plan/${planId}/lessons/${lessonIndex}`),
  completeLearningPlanLesson: (planId: string, lessonIndex: number, payload?: { score?: number }) =>
    request(`/learning-plan/${planId}/lessons/${lessonIndex}/complete`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),
};
