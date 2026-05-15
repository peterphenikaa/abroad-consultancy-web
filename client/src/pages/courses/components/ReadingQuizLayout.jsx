import React from 'react';
import { Button } from "../../../components/ui/button";
import { Check, Flag, Clock } from "lucide-react";
import { cn } from "../../../components/ui/utils";

export default function ReadingQuizLayout({
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
    timeLeft,
    metadata
}) {
    if (!currentQuestion) return null;

    const { passageTitle, passageContent } = metadata || {};

    return (
        <div className="w-full h-full flex flex-col md:flex-row gap-6 mx-auto absolute inset-0 pb-10">
            {/* Left Panel: Reading Passage */}
            <div className="flex-1 bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100 overflow-y-auto h-full">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{passageTitle || "Reading Passage"}</h2>
                <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed space-y-4">
                    {passageContent ? (
                        passageContent.split('\n').map((paragraph, idx) => (
                            <p key={idx}>{paragraph}</p>
                        ))
                    ) : (
                        <p>No passage content provided.</p>
                    )}
                </div>
            </div>

            {/* Right Panel: Quiz Area */}
            <div className="flex-1 flex flex-col h-full">

                {/* Header / Timer */}
                <div className="bg-indigo-600 text-white rounded-t-3xl p-5 flex items-center justify-between shrink-0">
                    <h3 className="font-semibold text-lg">{metadata?.assessmentTitle || "Quiz"}</h3>
                    <div className="flex items-center gap-2 bg-indigo-700/50 px-4 py-1.5 rounded-full font-medium tracking-wider">
                        <Clock className="w-4 h-4" />
                        {formatTime(timeLeft)}
                    </div>
                </div>

                {/* Question Area */}
                <div className="bg-white p-8 border-x border-gray-100 flex-1 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <span className="font-semibold text-gray-800">
                            Question {currentQuestionIndex + 1} of {questions.length}
                        </span>
                        <button className="text-gray-500 hover:text-gray-800 flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                            <Flag className="w-4 h-4" /> Flag
                        </button>
                    </div>

                    <p className="text-lg text-gray-800 mb-8 font-medium">
                        {currentQuestion.text}
                    </p>

                    <div className="space-y-4">
                        {currentQuestion.options?.map((option) => {
                            const isSelected = answers[currentQuestion.id] === option.id;
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
                                    className={cn(
                                        "w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-4",
                                        isSelected
                                            ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                                    )}
                                >
                                    <div className={cn(
                                        "w-5 h-5 rounded-full flex items-center justify-center shrink-0 border",
                                        isSelected ? "border-indigo-600" : "border-gray-400"
                                    )}>
                                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                                    </div>
                                    <span className={cn("flex-1 text-[15px]", isSelected ? "text-indigo-900 font-medium" : "")}>
                                        {option.text}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="bg-white p-6 rounded-b-3xl border-t border-gray-100 shrink-0">
                    <div className="flex flex-wrap gap-2 mb-6">
                        {questions.map((_, idx) => {
                            const isAnswered = !!answers[questions[idx].id];
                            const isCurrent = idx === currentQuestionIndex;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => isAnswered || isCurrent ? {} : null} // Allow jumping if needed later, ignoring here
                                    className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-colors text-sm",
                                        isCurrent ? "bg-indigo-600 text-white" :
                                            isAnswered ? "bg-indigo-100 text-indigo-800" : "bg-gray-100 text-gray-500"
                                    )}
                                >
                                    {idx + 1}
                                </button>
                            )
                        })}
                    </div>

                    <div className="flex gap-4">
                        {currentQuestionIndex < questions.length - 1 ? (
                            <Button
                                onClick={handleNextQuestion}
                                disabled={!answers[currentQuestion.id]}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 text-base shadow-sm"
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={!answers[currentQuestion.id] || isSubmitting}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 gap-2 text-base shadow-sm"
                            >
                                <Check className="w-4 h-4" /> {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
