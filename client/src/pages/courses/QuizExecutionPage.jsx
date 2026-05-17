import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CourseSidebar } from './player/CourseSidebar';
import { LessonHeader } from './player/LessonHeader';
import { Button } from "../../components/ui/button";
import { RotateCcw, Check, X } from "lucide-react";
import { cn } from "../../components/ui/utils";
import AttemptHistory from './components/AttemptHistory';
import StandardQuizLayout from './components/StandardQuizLayout';
import ReadingQuizLayout from './components/ReadingQuizLayout';

export default function QuizExecutionPage() {
    const { courseId, contentId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [quizData, setQuizData] = useState(null);
    const [questions, setQuestions] = useState([]);

    const [status, setStatus] = useState('loading');

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [attemptsHistory, setAttemptsHistory] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setStatus('loading');
            try {
                const courseRes = await axios.get(`/api/v1/courses/${courseId}`);
                setCourse(courseRes.data);

                const res = await axios.get(`/api/v1/contents/${contentId}`);
                const qData = res.data.data || res.data;
                const questionsList = qData.metadata?.questions || [];
                setQuizData(qData);
                setQuestions(questionsList);

                const limit = qData.metadata?.timeLimit || 15;
                setTimeLeft(limit * 60);

                let currentHistory = [];
                try {
                    const overviewRes = await axios.get(`/api/v1/contents/${contentId}/quiz-overview`);
                    currentHistory = overviewRes.data.data?.history || overviewRes.data?.history || [];
                    setAttemptsHistory(currentHistory);
                } catch (e) {
                    console.warn("Could not fetch quiz overview, defaulting to empty history", e);
                    setAttemptsHistory([]);
                }

                const maxAttempts = qData.metadata?.maxAttempts || 3;

                if (currentHistory.length >= maxAttempts) {
                    const lastAttempt = currentHistory[0] || {};
                    setSubmitResult({
                        status: lastAttempt.status || 'FAILED',
                        score: lastAttempt.score || 0,
                        answers: {}
                    });
                    setStatus('result');
                } else {
                    setStatus('playing');
                }
            } catch (err) {
                console.error("Error fetching quiz data:", err);
            }
        };
        fetchData();
    }, [courseId, contentId]);

    useEffect(() => {
        if (status !== 'playing' || timeLeft === null || isSubmitting) return;
        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }
        const timerId = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, status]);

    const handleOptionSelect = (questionId, optionId) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const limit = quizData?.metadata?.timeLimit || 15;
            const timeTaken = limit * 60 - (timeLeft || 0);

            try {
                const res = await axios.post(`/api/v1/contents/${contentId}/submit`, { answers, timeTaken });
                setSubmitResult(res.data.data || res.data);

                try {
                    const overviewRes = await axios.get(`/api/v1/contents/${contentId}/quiz-overview`);
                    const overviewHistory = overviewRes.data.data?.history || overviewRes.data?.history || [];
                    setAttemptsHistory(overviewHistory);
                } catch (e) { }
            } catch (apiErr) {
                console.warn("API Submit failed, using mock data for UI demo.", apiErr);
                let score = 0;
                questions.forEach(q => {
                    if (answers[q.id] === q.correctOptionId) score++;
                });
                const fakeScorePercent = Math.round((score / questions.length) * 100) || 0;
                const resultMock = {
                    id: Date.now().toString(),
                    status: fakeScorePercent >= (quizData?.metadata?.passingScore || 80) ? 'PASSED' : 'FAILED',
                    score: fakeScorePercent,
                    answers: answers,
                    startedAt: new Date(Date.now() - timeTaken * 1000).toISOString(),
                    completedAt: new Date().toISOString()
                };
                setSubmitResult(resultMock);
                setAttemptsHistory(prev => [resultMock, ...prev]);
            }
            setStatus('result');
        } catch (err) {
            console.error("Error submitting quiz:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRetry = () => {
        setSubmitResult(null);
        setAnswers({});
        setCurrentQuestionIndex(0);
        const limit = quizData?.metadata?.timeLimit || 15;
        setTimeLeft(limit * 60);
        setStatus('playing');
    };

    const formatTime = (seconds) => {
        if (seconds === null) return "00:00";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (status === 'loading') {
        return <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading quiz environment...</div>;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progressPercent = ((currentQuestionIndex + 1) / (questions.length || 1)) * 100;

    return (
        <div className="h-screen w-full bg-neutral-50 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/courses/${courseId}`)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <svg xmlns="http://www.000.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">{quizData?.title || 'Quiz Assessment'}</h1>
                        <p className="text-xs font-semibold text-gray-400">Course {course?.title ? `• ${course.title}` : ''}</p>
                    </div>
                </div>
                <div className="text-sm font-semibold text-gray-400">
                    Question {currentQuestionIndex + 1} of {questions.length || 0}
                </div>
            </div>

            <main className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 relative">
                <div className="flex-1 overflow-y-auto w-full flex justify-center py-10 px-6">
                    <div className="w-full max-w-6xl relative">
                        {status === 'playing' && currentQuestion && (
                            <div className="animate-in fade-in duration-300 relative min-h-[70vh]">

                                {quizData?.metadata?.quizLayout === 'split-screen' ? (
                                    <div className="absolute inset-0 top-0 h-[70vh]">
                                        <ReadingQuizLayout
                                            questions={questions}
                                            currentQuestionIndex={currentQuestionIndex}
                                            currentQuestion={currentQuestion}
                                            answers={answers}
                                            handleOptionSelect={handleOptionSelect}
                                            handlePrevQuestion={handlePrevQuestion}
                                            handleNextQuestion={handleNextQuestion}
                                            handleSubmit={handleSubmit}
                                            isSubmitting={isSubmitting}
                                            progressPercent={progressPercent}
                                            formatTime={formatTime}
                                            timeLeft={timeLeft}
                                            metadata={quizData?.metadata}
                                        />
                                    </div>
                                ) : (
                                    <StandardQuizLayout
                                        questions={questions}
                                        currentQuestionIndex={currentQuestionIndex}
                                        currentQuestion={currentQuestion}
                                        answers={answers}
                                        handleOptionSelect={handleOptionSelect}
                                        handlePrevQuestion={handlePrevQuestion}
                                        handleNextQuestion={handleNextQuestion}
                                        handleSubmit={handleSubmit}
                                        isSubmitting={isSubmitting}
                                        progressPercent={progressPercent}
                                        formatTime={formatTime}
                                        timeLeft={timeLeft}
                                    />
                                )}
                            </div>
                        )}

                        {status === 'result' && submitResult && (
                            <div className="animate-in slide-in-from-bottom-8 duration-500 max-w-3xl mx-auto bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden relative">
                                <div className={cn(
                                    "h-4 w-full",
                                    submitResult.status === 'PASSED' ? "bg-gradient-to-r from-emerald-400 to-green-500" : "bg-gradient-to-r from-red-400 to-red-600"
                                )} />

                                <div className="p-12 text-center">
                                    <div className="w-20 h-20 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-6">
                                        {submitResult.status === 'PASSED' ? (
                                            <Check className="w-10 h-10 text-emerald-500" />
                                        ) : (
                                            <RotateCcw className="w-8 h-8 text-red-500" />
                                        )}
                                    </div>
                                    <h1 className="text-4xl font-extrabold font-serif text-gray-900 mb-2">
                                        {submitResult.status === 'PASSED' ? "Congratulations!" : "Keep Practicing!"}
                                    </h1>
                                    <p className="text-gray-500 mb-10">
                                        You scored {submitResult.score}%. You need {quizData?.metadata?.passingScore || 80}% to pass this module.
                                    </p>

                                    <div className="bg-gray-50 rounded-3xl p-8 max-w-[200px] mx-auto mb-12 relative overflow-hidden">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">YOUR SCORE</p>
                                        <p className={cn(
                                            "text-5xl font-black",
                                            submitResult.status === 'PASSED' ? "text-emerald-600" : "text-red-600"
                                        )}>
                                            {submitResult.score}%
                                        </p>
                                    </div>

                                    <div className="text-left mt-8">
                                        <h3 className="font-bold text-gray-900 mb-4">Review Answers</h3>
                                        <div className="space-y-3">
                                            {questions.map((q) => {
                                                const userAnswer = submitResult.answers?.[q.id] || answers[q.id];
                                                const isCorrect = userAnswer === q.correctOptionId;
                                                const userAnswerText = q.options.find(o => o.id === userAnswer)?.text || '(Trống)';
                                                const correctText = q.options.find(o => o.id === q.correctOptionId)?.text || '';

                                                return (
                                                    <div key={q.id} className={cn(
                                                        "p-4 rounded-xl border flex gap-4",
                                                        isCorrect ? "bg-emerald-50/50 border-emerald-100" : "bg-red-50/50 border-red-100"
                                                    )}>
                                                        <div className="mt-1">
                                                            {isCorrect ? <Check className="w-5 h-5 text-emerald-500" /> : <X className="w-5 h-5 text-red-500" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 mb-2">{q.text}</p>
                                                            <div className="flex gap-4 text-xs font-semibold">
                                                                <span className={isCorrect ? "text-emerald-700" : "text-red-600"}>
                                                                    Your answer: <span className="font-bold">{userAnswerText}</span>
                                                                </span>
                                                                {!isCorrect && (
                                                                    <span className="text-emerald-600">
                                                                        Correct: <span className="font-bold">{correctText}</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {attemptsHistory.length > 0 && (() => {
                                        const maxAttempts = quizData?.metadata?.maxAttempts || 3;
                                        return (
                                            <AttemptHistory
                                                attemptsHistory={attemptsHistory}
                                                maxAttempts={maxAttempts}
                                                showBestScore={false}
                                                showRetryButton={submitResult.status !== 'PASSED'}
                                                onRetry={handleRetry}
                                            />
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}