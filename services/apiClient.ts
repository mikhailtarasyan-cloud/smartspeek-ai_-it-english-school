const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

const getUserId = () => {
  return localStorage.getItem('smartspeek_user_id') || 'user_demo';
};

const request = async (path: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('X-User-Id', getUserId());

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
};

export const apiClient = {
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
};
