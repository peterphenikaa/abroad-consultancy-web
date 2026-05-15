import React from 'react';
import { Button } from "../../../components/ui/button";
import { cn } from "../../../components/ui/utils";

export default function StandardQuizLayout({
    questions,
    currentQuestionIndex,
    currentQuestion,
    answers,
    handleOptionSelect,
    handlePrevQuestion,
    handleNextQuestion,
    handleSubmit,
    isSubmitting,
    progressPercent,
    formatTime,
    timeLeft
}) {
    if (!currentQuestion) return null;

    return (
        <div className="w-full max-w-4xl relative mx-auto">
            <div className="animate-in fade-in duration-300">
                {/* Quiz Progress Header */}
                <div className="flex justify-between items-center text-xs font-bold text-gray-400 mb-2 tracking-wider">
                    <span>QUESTION {currentQuestionIndex + 1} OF {questions.length}</span>
                    <span>Time Remaining: {formatTime(timeLeft)}</span>
                </div>

                <div className="h-2 w-full bg-gray-200 rounded-full mb-12 overflow-hidden">
                    <div
                        className="h-full bg-gray-800 transition-all duration-300 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                <h2 className="text-3xl font-extrabold font-serif text-gray-900 mb-8 leading-tight">
                    {currentQuestion.text}
                </h2>

                <div className="space-y-4 mb-16">
                    {currentQuestion.options.map((opt, idx) => {
                        const alphabet = ['A', 'B', 'C', 'D'][idx] || '-';
                        const isSelected = answers[currentQuestion.id] === opt.id;

                        return (
                            <button
                                key={opt.id}
                                onClick={() => handleOptionSelect(currentQuestion.id, opt.id)}
                                className={cn(
                                    "w-full flex items-center gap-6 p-6 rounded-2xl border-2 transition-all duration-200 text-left group",
                                    isSelected
                                        ? "border-gray-800 bg-gray-50"
                                        : "border-gray-100 bg-white hover:border-gray-300"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold transition-colors",
                                    isSelected ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                                )}>
                                    {alphabet}
                                </div>
                                <span className={cn(
                                    "text-lg font-semibold",
                                    isSelected ? "text-gray-900" : "text-gray-600"
                                )}>
                                    {opt.text}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex justify-between items-center mt-10 border-t border-gray-200 pt-8">
                    {currentQuestionIndex > 0 ? (
                        <button
                            onClick={handlePrevQuestion}
                            className="text-gray-400 font-bold hover:text-gray-800 transition-colors"
                        >
                            Previous
                        </button>
                    ) : <div />}

                    <Button
                        onClick={handleNextQuestion}
                        disabled={!answers[currentQuestion.id]}
                        className="bg-[#F59E0B] hover:bg-amber-600 text-white rounded-full py-6 px-10 text-lg shadow-md disabled:opacity-50"
                    >
                        {currentQuestionIndex === questions.length - 1 ? (isSubmitting ? "Submitting..." : "Submit Quiz") : "Next Question"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
