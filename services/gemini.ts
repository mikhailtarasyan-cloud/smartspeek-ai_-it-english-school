
import { Type } from "@google/genai";
import { OnboardingData } from "../types";

// Модель Gemini: можно выбрать через GEMINI_MODEL в .env.local
// Доступные модели (проверено через API):
// - gemini-2.5-flash (рекомендуется: быстрая и мощная)
// - gemini-2.5-pro (более мощная)
// - gemini-2.0-flash (стабильная)
// - gemini-3-flash-preview (экспериментальная)
// - gemini-flash-latest (всегда последняя версия flash)
// - gemini-pro-latest (всегда последняя версия pro)
const getGeminiModel = () => {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
};

export const evaluateDiagnosticResponse = async (stepType: string, question: string, answer: string) => {
  const response = await fetch('/api/ai/evaluate-diagnostic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step_type: stepType, question, answer }),
  });
  if (!response.ok) {
    throw new Error('Ошибка оценки диагностики');
  }
  return response.json();
};

export const processOnboarding = async (onboardingData: OnboardingData) => {
  const response = await fetch('/api/ai/process-onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ onboarding: onboardingData }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Не удалось сгенерировать план: ${JSON.stringify(err)}`);
  }
  return response.json();
};

export const generateLearningPlan = async (goals: any, diagnosticResults: any) => {
  // TODO: при необходимости добавить отдельный backend-эндпоинт для плана
  console.warn('generateLearningPlan пока не использует backend-прокси');
  return '';
};

export const getTutorInsights = async (prompt: string) => {
  const response = await fetch('/api/ai/tutor-insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) {
    console.warn('Ошибка получения AI советов');
    return [];
  }
  const data = await response.json();
  // backend сейчас возвращает { raw }, можно адаптировать позже
  return data.raw || [];
};
