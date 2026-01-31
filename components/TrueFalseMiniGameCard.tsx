import React, { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { GameAnswerResult, GameSession, GlossaryTopic } from '../types';

interface TrueFalseMiniGameCardProps {
  embedded?: boolean;
  defaultTopicId?: string;
}

const TrueFalseMiniGameCard: React.FC<TrueFalseMiniGameCardProps> = ({ embedded = false, defaultTopicId }) => {
  const [topics, setTopics] = useState<GlossaryTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(defaultTopicId || null);
  const [session, setSession] = useState<GameSession | null>(null);
  const [answerResult, setAnswerResult] = useState<GameAnswerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (embedded && defaultTopicId) return;
    apiClient.getTrueFalseTopics()
      .then((data) => {
        setTopics(data);
        if (!selectedTopic && data.length) setSelectedTopic(data[0].id);
      })
      .catch(() => setError('Не удалось загрузить темы'));
  }, [embedded, defaultTopicId, selectedTopic]);

  const streakMultiplier = useMemo(() => {
    if (!session) return 1.0;
    const streak = session.streak_current;
    if (streak >= 10) return 2.0;
    if (streak >= 6) return 1.5;
    if (streak >= 3) return 1.2;
    return 1.0;
  }, [session]);

  const startSession = async (resume = true) => {
    if (!selectedTopic) return;
    setLoading(true);
    setError(null);
    setAnswerResult(null);
    try {
      const data = await apiClient.startTrueFalseSession({
        topic_id: selectedTopic,
        n_questions: 20,
        resume,
      });
      setSession(data);
    } catch (e) {
      setError('Не удалось начать игру');
    } finally {
      setLoading(false);
    }
  };

  const answer = async (value: boolean) => {
    if (!session?.current_question) return;
    setLoading(true);
    try {
      const result = await apiClient.answerTrueFalse(session.id, {
        question_id: session.current_question.id,
        user_answer: value,
      });
      setAnswerResult(result);
      const updated = await apiClient.getTrueFalseSession(session.id);
      setSession(updated);
    } catch (e) {
      setError('Ошибка при ответе');
    } finally {
      setLoading(false);
    }
  };

  const next = async () => {
    if (!session) return;
    setLoading(true);
    setAnswerResult(null);
    try {
      const data = await apiClient.nextTrueFalse(session.id);
      setSession(data);
    } catch (e) {
      setError('Не удалось загрузить следующий вопрос');
    } finally {
      setLoading(false);
    }
  };

  const restart = async () => {
    if (!session) return;
    setLoading(true);
    setAnswerResult(null);
    try {
      const data = await apiClient.restartTrueFalse(session.id);
      setSession(data);
    } catch (e) {
      setError('Не удалось перезапустить');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-3xl p-8 border border-slate-100 shadow-sm ${embedded ? '' : 'max-w-5xl mx-auto'}`}>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">True/False Glossary</p>
          <h3 className="text-2xl font-black text-slate-900">Мини‑игра по терминологии</h3>
        </div>
        {!embedded && (
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
            Score: {session?.score_total ?? 0}
          </div>
        )}
      </div>

      {!embedded && (
        <div className="flex flex-wrap gap-3 mb-6">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setSelectedTopic(topic.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black border ${
                selectedTopic === topic.id ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-50 border-slate-100 text-slate-600'
              }`}
            >
              {topic.title}
            </button>
          ))}
        </div>
      )}

      {!session ? (
        <button
          onClick={() => startSession(true)}
          className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 transition"
        >
          Start
        </button>
      ) : session.status === 'finished' ? (
        <div className="space-y-4">
          <p className="text-sm font-black text-slate-700">Сессия завершена!</p>
          <div className="text-xs text-slate-500">
            Score: {session.score_total} • Accuracy: {session.correct_count}/{session.n_questions} • Max streak: {session.streak_max}
          </div>
          <button
            onClick={restart}
            className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 transition"
          >
            Restart
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-400">
            <span>Q {session.current_index + 1}/{session.n_questions}</span>
            <span>Score: {session.score_total}</span>
            <span>Streak: {session.streak_current} (x{streakMultiplier})</span>
          </div>

          {session.current_question && (
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl">
                  <i className={`fa-solid ${session.current_question.icon_key || 'fa-book'}`}></i>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Term</p>
                  <h4 className="text-xl font-black text-slate-900">{session.current_question.term}</h4>
                  <p className="text-sm text-slate-700 mt-3 font-semibold leading-relaxed">
                    {session.current_question.shown_definition}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => answer(true)}
              disabled={loading || !!answerResult}
              className="px-6 py-3 rounded-2xl bg-emerald-500 text-white font-black text-sm hover:bg-emerald-600 transition disabled:opacity-60"
            >
              Правда
            </button>
            <button
              onClick={() => answer(false)}
              disabled={loading || !!answerResult}
              className="px-6 py-3 rounded-2xl bg-rose-500 text-white font-black text-sm hover:bg-rose-600 transition disabled:opacity-60"
            >
              Не правда
            </button>
          </div>

          {answerResult && (
            <div className={`rounded-2xl p-4 border ${answerResult.is_correct ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              <p className={`text-sm font-black ${answerResult.is_correct ? 'text-emerald-700' : 'text-amber-700'}`}>
                {answerResult.is_correct ? `+${answerResult.score_delta} (x${answerResult.multiplier})` : 'Streak reset'}
              </p>
              <p className="text-xs text-slate-600 mt-2">{answerResult.explanation}</p>
              <button
                onClick={next}
                className="mt-3 text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {error ? <p className="text-xs text-rose-500 mt-4">{error}</p> : null}
    </div>
  );
};

export default TrueFalseMiniGameCard;
