import React, { useState, useEffect, useRef } from 'react';
import { FileEdit, CheckCircle2, Clock, AlertTriangle, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from "../../../components/ui/button";

const PracticeWritingPlayer = ({ title, contentItem, onMarkComplete, isMarkingComplete }) => {
    const [text, setText] = useState('');
    const [charCount, setCharCount] = useState(0);
    const [isStrict, setIsStrict] = useState(false);
    const textareaRef = useRef(null);

    const metadata = contentItem?.metadata || {};
    const prompt = metadata.prompt || "The chart below shows the percentage of households in different income brackets that own a smartphone in three countries. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.";
    const imageUrl = metadata.imageUrl || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000";
    const minChars = metadata.minWords || 150;
    const maxTime = metadata.maxTime || 20;
    const style = metadata.style || "formal, academic style";

    const displayTitle = title || "Task 1: Academic Writing";

    useEffect(() => {
        setCharCount(text.length);
    }, [text]);

    const progress = Math.min((charCount / minChars) * 100, 100);

    const getCharCountState = () => {
        if (charCount === 0) return { text: 'text-gray-400', bar: '#e5e7eb', label: `${minChars} chars required` };
        if (charCount < minChars) return { text: 'text-orange-500', bar: '#f97316', label: `${minChars - charCount} more chars needed` };
        return { text: 'text-green-600', bar: '#16a34a', label: 'Minimum reached ✓' };
    };

    const state = getCharCountState();

    return (
        <div className="w-full max-w-6xl mx-auto my-8 lg:my-12 flex flex-col lg:flex-row gap-0 bg-white overflow-hidden min-h-[600px] rounded-3xl border border-gray-200 shadow-sm">

            {/* LEFT PANE — Task Description */}
            <div className="w-full lg:w-[42%] bg-gray-50 flex flex-col border-r border-gray-100 overflow-y-auto">

                {/* Header */}
                <div className="px-8 pt-8 pb-6 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-3 py-1 rounded-full">
                            <BookOpen className="w-3 h-3" />
                            Writing Task
                        </span>
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-gray-900 leading-tight">
                        {displayTitle}
                    </h2>
                </div>

                {/* Prompt */}
                <div className="px-8 py-6 flex flex-col gap-5">
                    <div className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-400 rounded-full" />
                        <p className="pl-5 text-gray-600 text-[15px] leading-relaxed">
                            {prompt}
                        </p>
                    </div>

                    {imageUrl && (
                        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                            <img
                                src={imageUrl}
                                alt="Writing Task Prompt"
                                className="w-full h-auto object-cover max-h-[220px]"
                            />
                        </div>
                    )}

                    <div className="mt-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-semibold text-gray-700">Requirements</span>
                        </div>
                        <ul className="divide-y divide-gray-50">
                            <li className="flex items-center justify-between px-5 py-3">
                                <span className="text-sm text-gray-500">Minimum characters</span>
                                <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-0.5 rounded-full">{minChars} chars</span>
                            </li>
                            <li className="flex items-center justify-between px-5 py-3">
                                <span className="text-sm text-gray-500">Time limit</span>
                                <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-0.5 rounded-full">{maxTime} min</span>
                            </li>
                            <li className="flex items-center justify-between px-5 py-3">
                                <span className="text-sm text-gray-500">Writing style</span>
                                <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-0.5 rounded-full capitalize">{style}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* RIGHT PANE — Writing Area */}
            <div className="w-full lg:w-[58%] flex flex-col bg-white">

                {/* Toolbar */}
                <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100 flex-shrink-0">
                    <div className="flex flex-col gap-1.5 flex-1 mr-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className={`text-sm font-semibold ${state.text} transition-colors duration-300`}>
                                    {charCount} / {minChars} chars
                                </span>
                            </div>
                            <span className="text-xs text-gray-400">{state.label}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progress}%`, background: state.bar }}
                            />
                        </div>
                    </div>

                    {/* Exam Mode Toggle */}
                    <label className="flex items-center gap-2.5 cursor-pointer shrink-0">
                        <div
                            onClick={() => setIsStrict(!isStrict)}
                            className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer ${isStrict ? 'bg-gray-900' : 'bg-gray-200'}`}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${isStrict ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <span className="text-xs font-medium text-gray-600 select-none whitespace-nowrap">
                            Exam mode
                        </span>
                    </label>
                </div>

                {/* Textarea */}
                <div
                    className="flex-grow px-8 py-6 cursor-text"
                    onClick={() => textareaRef.current?.focus()}
                >
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Start typing your response here..."
                        className="w-full h-full min-h-[320px] resize-none outline-none bg-transparent text-gray-800 text-[15px] leading-[1.85] placeholder:text-gray-300"
                        spellCheck={!isStrict}
                    />
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <FileEdit className="w-3.5 h-3.5" />
                        <span>Your text is saved automatically</span>
                    </div>
                    <Button
                        onClick={onMarkComplete}
                        disabled={isMarkingComplete || contentItem?.isCompleted}
                        className={`
                            font-bold text-sm px-6 py-2.5 rounded-2xl transition-all duration-200 flex items-center gap-2 shadow-sm
                            ${contentItem?.isCompleted
                                ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 cursor-default'
                                : 'bg-gray-900 hover:bg-gray-800 text-white hover:shadow-md hover:-translate-y-px active:translate-y-0'
                            }
                        `}
                    >
                        {isMarkingComplete ? (
                            <Clock className="h-4 w-4 animate-spin" />
                        ) : contentItem?.isCompleted ? (
                            <CheckCircle2 className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                        {contentItem?.isCompleted ? 'Submitted' : 'Submit for Feedback'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PracticeWritingPlayer;