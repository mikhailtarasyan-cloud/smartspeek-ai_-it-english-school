
import { GoogleGenAI, Type } from "@google/genai";
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
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY не найден в переменных окружения. Убедитесь, что в .env.local указан ключ от Google Gemini.");
  }
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: getGeminiModel(),
    contents: `Ты — профессиональный методист английского языка. Оцени ответ студента.
    Тип задания: ${stepType}
    Вопрос: ${question}
    Ответ студента: ${answer}
    
    Оцени по рубрике (0-2 балла) по критериям: Accuracy, Range, Coherence. 
    Верни JSON с оценкой и коротким фидбеком на русском.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          feedback: { type: Type.STRING },
          cefr_hint: { type: Type.STRING }
        },
        propertyOrdering: ['score', 'feedback', 'cefr_hint']
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { score: 1, feedback: "Не удалось проанализировать ответ." };
  }
};

export const processOnboarding = async (onboardingData: OnboardingData) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY не найден в переменных окружения. Убедитесь, что в .env.local указан ключ от Google Gemini (не OpenAI). Получить можно здесь: https://makersuite.google.com/app/apikey");
  }
  // Проверка формата ключа Gemini (обычно начинается с AIza...)
  if (!apiKey.startsWith('AIza') && apiKey.length < 30) {
    console.warn("Ключ не похож на Gemini API ключ. Убедитесь, что используете ключ от Google Gemini, а не от OpenAI.");
  }
  const ai = new GoogleGenAI({ apiKey });
  
  // Пробуем разные модели, если первая не работает
  // Используем модели, которые реально доступны через API
  const modelsToTry = [
    getGeminiModel(), 
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-flash-latest',
    'gemini-2.5-pro',
    'gemini-pro-latest',
    'gemini-3-flash-preview'
  ];
  let lastError: any = null;
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`Пробуем модель: ${modelName}`);
      const response = await ai.models.generateContent({
        model: modelName,
    contents: `Ты — SmartSpeek AI Orchestrator. 
    На основе данных онбординга: ${JSON.stringify(onboardingData)}, 
    сгенерируй детальную стратегию обучения.
    
    ВАЖНО: ВСЕ ТЕКСТЫ В JSON ДОЛЖНЫ БЫТЬ НА РУССКОМ.
    
    1. persona: Создай "психопортрет" наставника. 
       - tone: professional_supportive, strict, business, friendly_tech.
       - description: Развернутое описание (минимум 20 слов), как наставник будет помогать, учитывая профессию ${onboardingData.role} и уровень ${onboardingData.english_level}. Описание должно быть вдохновляющим и детальным.
    
    2. learning_plan_summary: Опиши 4-недельный план в формате: 
       "1 неделя — [тема]; 2 неделя — [тема]; 3 неделя — [тема]; 4 неделя — [тема]".
    
    3. first_lesson: Детали самого первого шага.
    
    Верни строго JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          persona: {
            type: Type.OBJECT,
            properties: {
              tone: { type: Type.STRING },
              correction_level: { type: Type.STRING },
              speech_speed: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["tone", "correction_level", "speech_speed", "description"]
          },
          learning_plan_summary: { type: Type.STRING },
          learning_plan_id: { type: Type.STRING },
          first_lesson: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["topic", "description"]
          }
        },
        required: ["persona", "learning_plan_summary", "learning_plan_id", "first_lesson"]
      }
    }
      });

      const text = response.text || '';
      if (!text) {
        throw new Error("Пустой ответ от API");
      }
      const parsed = JSON.parse(text);
      if (!parsed.persona || !parsed.first_lesson) {
        throw new Error("Неполный ответ от API");
      }
      console.log(`Успешно использована модель: ${modelName}`);
      return parsed;
    } catch (e: any) {
      console.warn(`Модель ${modelName} не сработала:`, e?.error?.message || e?.message);
      lastError = e;
      // Пробуем следующую модель
      continue;
    }
  }
  
  // Если все модели не сработали
  const errorMsg = lastError?.error?.message || lastError?.message || 'Неизвестная ошибка';
  throw new Error(`Не удалось использовать ни одну модель. Последняя ошибка: ${errorMsg}. Попробуйте указать GEMINI_MODEL=models/gemini-pro в .env.local или проверьте, что ваш API ключ имеет доступ к Gemini API.`);
};

export const generateLearningPlan = async (goals: any, diagnosticResults: any) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY не найден в переменных окружения. Убедитесь, что в .env.local указан ключ от Google Gemini.");
  }
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: getGeminiModel(),
    contents: `Создай план обучения на 7 дней. Цели: ${JSON.stringify(goals)}. Результаты диагностики: ${JSON.stringify(diagnosticResults)}. 
    Для каждого дня укажи тему и тип активности (Listening, Speaking, Grammar). Верни план на русском языке.`,
  });
  return response.text;
};

export const getTutorInsights = async (prompt: string) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY не найден, возвращаю пустой массив");
    return [];
  }
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: getGeminiModel(),
    contents: `${prompt}. Дай 3 совета по обучению на русском языке. Включи один карьерный совет для IT и одну мотивационную фразу.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            message: { type: Type.STRING },
            priority: { type: Type.STRING }
          },
          propertyOrdering: ['topic', 'message', 'priority']
        }
      }
    }
  });
  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [];
  }
};
