
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
  try {
    const response = await fetch('/api/ai/process-onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onboarding: onboardingData }),
    });
    
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Не удалось сгенерировать план: ${err.detail || JSON.stringify(err)}`);
    }
    
    const data = await response.json();
    // Backend теперь возвращает { text, status } вместо { raw }
    if (data.text && data.status === 'success') {
      // Пытаемся распарсить JSON из текста, если это JSON
      try {
        return JSON.parse(data.text);
      } catch {
        // Если не JSON, возвращаем как есть (текст)
        return { plan: data.text, raw_text: data.text };
      }
    }
    throw new Error('Пустой ответ от сервера');
  } catch (error: any) {
    // Улучшенная обработка ошибок сети
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      throw new Error('Не удалось подключиться к серверу. Убедитесь, что backend запущен на http://localhost:8000');
    }
    throw error;
  }
};

export const generateLearningPlan = async (goals: any, diagnosticResults: any) => {
  // TODO: при необходимости добавить отдельный backend-эндпоинт для плана
  console.warn('generateLearningPlan пока не использует backend-прокси');
  return '';
};

export const getTutorInsights = async (prompt: string) => {
  try {
    const response = await fetch('/api/ai/tutor-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) {
      console.warn('Ошибка получения AI советов:', response.status);
      return [];
    }
    const data = await response.json();
    // Backend теперь возвращает { text, status } вместо { raw }
    if (data.text && data.status === 'success') {
      // Парсим текст ответа - ожидаем список советов
      // Gemini возвращает текст, который нужно разбить на массив
      const text = data.text.trim();
      if (text) {
        // Разбиваем по строкам или маркерам списка
      const lines = text
        .split(/\n+/)
        .map(line => line.trim())
        .filter(line => line.length > 0 && line !== '---');
        return lines.length > 0 ? lines : [text];
      }
    }
    return [];
  } catch (error: any) {
    console.warn('Ошибка получения AI советов:', error.message);
    return [];
  }
};
