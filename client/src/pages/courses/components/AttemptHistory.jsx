import React from 'react';
import { Calendar, Clock, AlertCircle, RotateCcw, Target, Trophy, Timer } from 'lucide-react';
import { cn } from '../../../components/ui/utils';

export default function AttemptHistory({
    attemptsHistory = [],
    maxAttempts = 3,
    showBestScore = false,
    showRetryButton = false,
    onRetry
}) {
    if (!attemptsHistory || attemptsHistory.length === 0) return null;

    const attemptsUsed = attemptsHistory.length;
    const hasAttemptsLeft = attemptsUsed < maxAttempts;
    const bestScore = Math.max(...attemptsHistory.map(a => a.score || 0));

    return (
        <div className="text-left mt-10 border-t pt-8">
            {showBestScore && (() => {
                const latestAttempt = attemptsHistory[0] || {};
                let timeStr = "N/A";
                if (latestAttempt.timeTaken != null) {
                    const m = Math.floor(latestAttempt.timeTaken / 60);
                    const s = latestAttempt.timeTaken % 60;
                    timeStr = `${m}m ${s}s`;
                } else if (latestAttempt.startedAt && latestAttempt.completedAt) {
                    const diffSecs = Math.max(0, Math.floor((new Date(latestAttempt.completedAt) - new Date(latestAttempt.startedAt)) / 1000));
                    const m = Math.floor(diffSecs / 60);
                    const s = diffSecs % 60;
                    timeStr = `${m}m ${s}s`;
                }

                return (
                    <div className="mb-6 flex flex-col sm:flex-row bg-white border border-gray-200 rounded-xl shadow-sm divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
                        <div className="flex-1 p-3 text-center flex flex-col items-center justify-center">
                            <div className="flex items-center space-x-1.5 text-gray-500 mb-1">
                                <Target size={14} />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Current Score</p>
                            </div>
                            <p className="text-2xl font-black text-gray-900">{latestAttempt.score || 0}%</p>
                        </div>
                        <div className="flex-1 p-3 text-center flex flex-col items-center justify-center relative">
                            <div className="flex items-center space-x-1.5 text-emerald-600 mb-1">
                                <Trophy size={14} />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Kept Score</p>
                            </div>
                            <p className="text-2xl font-black text-emerald-600">{bestScore}%</p>
                            <div className="absolute top-0 right-0 h-full w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent hidden sm:block pointer-events-none"></div>
                        </div>
                        <div className="flex-1 p-3 text-center flex flex-col items-center justify-center">
                            <div className="flex items-center space-x-1.5 text-gray-500 mb-1">
                                <Timer size={14} />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Time Taken</p>
                            </div>
                            <p className="text-2xl font-black text-gray-900">{timeStr}</p>
                        </div>
                    </div>
                );
            })()}

            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Attempt History</h3>
                <span className="text-sm font-medium text-gray-500">{attemptsUsed} / {maxAttempts} attempts</span>
            </div>

            {!hasAttemptsLeft && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-red-700">Maximum attempts reached</p>
                        <p className="text-sm text-red-600 mt-1">
                            You've used all {maxAttempts} attempts. Please review the material and contact support if needed.
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {attemptsHistory.map((attempt, index) => {
                    const isLatest = index === 0;
                    const attemptNum = attemptsHistory.length - index;
                    const isPassed = attempt.status === 'PASSED';

                    const dateStr = attempt.completedAt ? new Date(attempt.completedAt).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
                    }) : 'N/A';

                    let timeStr = "N/A";
                    if (attempt.timeTaken != null) {
                        const m = Math.floor(attempt.timeTaken / 60);
                        const s = attempt.timeTaken % 60;
                        timeStr = `${m}m ${s}s`;
                    } else if (attempt.startedAt && attempt.completedAt) {
                        const diffSecs = Math.max(0, Math.floor((new Date(attempt.completedAt) - new Date(attempt.startedAt)) / 1000));
                        const m = Math.floor(diffSecs / 60);
                        const s = diffSecs % 60;
                        timeStr = `${m}m ${s}s`;
                    }

                    return (
                        <div
                            key={attempt.id || index}
                            className={cn(
                                "p-6 rounded-2xl flex justify-between items-center bg-white transition-all",
                                isLatest
                                    ? "border-2 border-gray-900 ring-4 ring-gray-900/5 shadow-sm"
                                    : "border border-gray-200"
                            )}
                        >
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <p className="font-bold text-gray-700 text-lg">Attempt #{attemptNum}</p>
                                    {isLatest && (
                                        <span className="px-2.5 py-0.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-700 bg-white shadow-sm">
                                            Latest
                                        </span>
                                    )}
                                    <span className={cn(
                                        "px-2.5 py-0.5 rounded-full text-xs font-bold",
                                        isPassed
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-red-100 text-red-700"
                                    )}>
                                        {attempt.status === 'PASSED' ? 'Passed' : 'Failed'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-5 text-sm font-medium text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        {dateStr.replace(',', '')}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        {timeStr}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={cn(
                                    "font-black text-4xl mb-1",
                                    isPassed ? "text-emerald-600" : "text-[#B91C1C]"
                                )}>
                                    {attempt.score}%
                                </p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    SCORE
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Try Again Button Box */}
            {showRetryButton && hasAttemptsLeft && (
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={onRetry}
                        className="flex items-center gap-2 px-8 py-3 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-all font-bold text-gray-900"
                    >
                        <RotateCcw className="w-5 h-5" />
                        Try Again ({maxAttempts - attemptsUsed} attempts left)
                    </button>
                </div>
            )}
        </div>
    );
}