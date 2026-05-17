import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { HelpCircle } from 'lucide-react';
import { cn } from '../../../components/ui/utils';
import AttemptHistory from '../components/AttemptHistory';

export default function QuizOverview({ contentItem, onStartQuiz, onMarkComplete, onNavigateNext }) {
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizInfo = async () => {
      try {
        setLoading(true);
        if (!contentItem?.id) return;
        const response = await axios.get(`/api/v1/contents/${contentItem.id}/quiz-overview`);
        setQuizData(response.data.data);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizInfo();
  }, [contentItem]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500 animate-pulse">Loading quiz details...</p>
      </div>
    );
  }

  const settings = quizData?.settings || {};
  const questionCount = settings.totalQuestions || 3;
  const timeLimit = settings.timeLimit || 15;
  const passingScore = settings.passingScore || 80;

  const attemptsHistory = quizData?.history || [];
  const hasPassed = attemptsHistory.some(h => h.status === 'PASSED');
  const attemptsUsed = attemptsHistory.length;
  const maxAttempts = settings.maxAttempts || 3;
  const maxAttemptsReached = attemptsUsed >= maxAttempts;
  const hasAttempted = attemptsUsed > 0;

  const bestAttempt = attemptsHistory.reduce((best, current) => {
    if (!best || current.score > best.score) return current;
    return best;
  }, null);

  const getBestTimeFormatted = () => {
    if (!bestAttempt) return "N/A";
    let seconds = 0;
    if (bestAttempt.timeTaken != null) {
      seconds = bestAttempt.timeTaken;
    } else if (bestAttempt.startedAt && bestAttempt.completedAt) {
      const start = new Date(bestAttempt.startedAt);
      const end = new Date(bestAttempt.completedAt);
      seconds = Math.floor((end - start) / 1000);
    } else {
      return "N/A";
    }
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <Card className="p-12 text-center rounded-3xl border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.04)] bg-white">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-3xl border border-gray-200 flex items-center justify-center shadow-sm">
            <HelpCircle className="w-8 h-8 text-[var(--accent-amber)]" strokeWidth={2.5} />
          </div>
        </div>

        <h2 className="text-3xl font-extrabold font-serif text-gray-900 mb-4">
          {hasAttempted ? "Quiz Results" : "Ready for a challenge?"}
        </h2>
        <p className="text-gray-500 max-w-lg mx-auto mb-8">
          This quiz covers the concepts from the previous lessons. You need at least {passingScore}% to pass this module.
        </p>

        {hasAttempted && bestAttempt ? (
          <div className="flex flex-col items-center justify-center gap-4 mb-10 bg-gray-50 py-6 px-10 rounded-3xl w-max mx-auto border border-gray-100 shadow-sm">
            <div className="flex items-center gap-8 text-center">
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-1">Highest Score</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className={cn("text-3xl font-extrabold", bestAttempt.status === 'PASSED' ? "text-green-600" : "text-red-500")}>
                    {bestAttempt.score}
                  </span>
                  <span className="text-sm font-medium text-gray-400">/ 100</span>
                </div>
              </div>
              <div className="w-px h-12 bg-gray-200"></div>
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-1">Time Taken</p>
                <p className="text-xl font-bold text-gray-900">{getBestTimeFormatted()}</p>
              </div>
              <div className="w-px h-12 bg-gray-200"></div>
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-1">Attempts</p>
                <p className="text-xl font-bold text-gray-900">{attemptsUsed} <span className="text-sm text-gray-400 font-medium">/ {maxAttempts}</span></p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="bg-gray-50 rounded-2xl p-4 min-w-[100px] text-center border border-gray-100">
              <p className="text-xl font-extrabold text-gray-900">{questionCount}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">QUESTIONS</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 min-w-[100px] text-center border border-gray-100">
              <p className="text-xl font-extrabold text-gray-900">{timeLimit}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">MINUTES</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 min-w-[100px] text-center border border-gray-100">
              <p className="text-xl font-extrabold text-gray-900">{passingScore}%</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">TO PASS</p>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center justify-center gap-4 mb-10">
          {!maxAttemptsReached && (
            <Button
              onClick={onStartQuiz}
              className={cn(
                "w-full max-w-md rounded-2xl py-7 text-lg font-bold text-white shadow-md hover:shadow-md transition-all",
                hasAttempted ? "bg-gray-900 hover:bg-gray-800" : "bg-gray-900 hover:bg-gray-800"
              )}
            >
              {hasAttempted ? "Retry Quiz" : "Start Quiz Now"}
            </Button>
          )}

          {hasPassed && !contentItem.isCompleted && (
            <Button
              onClick={onMarkComplete}
              className="w-full max-w-md rounded-2xl py-6 text-base font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-md transition-all"
            >
              Mark as Completed
            </Button>
          )}

          {contentItem.isCompleted && (
            <Button
              onClick={onNavigateNext}
              variant="outline"
              className="w-full max-w-md rounded-2xl py-6 text-base font-bold border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
            >
              Continue to Next Lesson
            </Button>
          )}

          {maxAttemptsReached && (
            <div className="bg-red-50 text-red-600 w-full max-w-md py-4 rounded-xl flex items-center justify-center font-bold border border-red-100">
              Maximum attempts reached ({maxAttempts}/{maxAttempts}).
            </div>
          )}
        </div>

        <AttemptHistory
          attemptsHistory={quizData?.history}
          maxAttempts={settings.maxAttempts || 3}
          showBestScore={true}
        />
      </Card>
    </div>
  );
}