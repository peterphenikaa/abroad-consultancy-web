import React, { useState, useEffect } from 'react';
import { Mic, RefreshCw, Square, Play, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from "../../../components/ui/button";
import { cn } from "../../../components/ui/utils";

const PracticeSpeakingPlayer = ({ title, contentItem, onMarkComplete, isMarkingComplete }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [hasRecorded, setHasRecorded] = useState(false);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => {
                setTick(t => t + 1);
            }, 150);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const metadata = contentItem?.metadata || {};
    const prompt = metadata.prompt || "Describe a place you have visited that has a significant cultural impact on you.";
    const assessmentTitle = metadata.assessmentTitle || "Speaking Assessment";

    const handleToggleRecord = () => {
        if (isRecording) {
            setIsRecording(false);
            setHasRecorded(true);
        } else {
            setIsRecording(true);
            setHasRecorded(false);
        }
    };

    const handleRerecord = () => {
        setIsRecording(false);
        setHasRecorded(false);
    };

    const getRecordingState = () => {
        if (isRecording) return { label: 'Recording...', sublabel: 'Click to stop', color: 'text-red-500' };
        if (hasRecorded) return { label: 'Recording saved', sublabel: 'Click to play back', color: 'text-green-600' };
        return { label: 'Ready to record', sublabel: 'Click mic to start', color: 'text-gray-400' };
    };

    const recState = getRecordingState();

    return (
        <div className="w-full max-w-4xl mx-auto my-8 lg:my-12 bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col items-center py-16 px-6 min-h-[600px] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 opacity-60" />
            <div className="text-center mb-10 max-w-2xl">
                <span className="inline-block bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                    Speaking Practice
                </span>
                <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4 tracking-tight">
                    {assessmentTitle}
                </h2>
                <p className="text-gray-500 text-[16px] leading-relaxed">
                    {prompt}
                </p>
            </div>

            <div className="flex items-center justify-center gap-1.5 mb-12 h-14 w-full max-w-md">
                {[...Array(32)].map((_, i) => {
                    const height = isRecording
                        ? Math.max(4, Math.abs(Math.sin(tick * 0.4 + i * 0.5) * 28 + Math.cos(tick * 0.3 + i) * 12) + 6)
                        : hasRecorded ? 12 : 4;

                    return (
                        <div
                            key={i}
                            className={`rounded-full transition-all duration-100 ${
                                isRecording
                                    ? 'bg-gray-900'
                                    : hasRecorded
                                        ? 'bg-amber-400'
                                        : 'bg-gray-200'
                            }`}
                            style={{
                                width: '3px',
                                height: `${height}px`,
                            }}
                        />
                    );
                })}
            </div>

            {/* Status text */}
            <div className="text-center mb-8">
                <p className={`text-sm font-semibold ${recState.color} transition-colors duration-300`}>
                    {recState.label}
                </p>
                <p className="text-xs text-gray-400 mt-1">{recState.sublabel}</p>
            </div>

            {/* Mic Button */}
            <div className="mb-12 relative flex items-center justify-center">
                {/* Outer pulse ring when recording */}
                {isRecording && (
                    <>
                        <div className="absolute w-36 h-36 rounded-full bg-red-100 animate-ping opacity-40" />
                        <div className="absolute w-28 h-28 rounded-full bg-red-50 animate-pulse" />
                    </>
                )}
                <button
                    onClick={handleToggleRecord}
                    className={cn(
                        "relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg",
                        isRecording
                            ? 'bg-gray-900 hover:bg-black text-white scale-105 shadow-gray-300'
                            : hasRecorded
                                ? 'bg-amber-400 hover:bg-amber-500 text-white shadow-amber-200'
                                : 'bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-300 hover:text-gray-400 shadow-md'
                    )}
                >
                    {isRecording ? (
                        <Square className="w-7 h-7 fill-current" />
                    ) : hasRecorded ? (
                        <Play className="w-9 h-9 fill-current ml-1" />
                    ) : (
                        <Mic className="w-9 h-9" strokeWidth={2} />
                    )}
                </button>
            </div>

            {/* Action Buttons */}
            <div
                className="flex items-center justify-center gap-3 transition-all duration-300"
                style={{ opacity: hasRecorded ? 1 : 0.35, pointerEvents: hasRecorded ? 'auto' : 'none' }}
            >
                <Button
                    variant="outline"
                    onClick={handleRerecord}
                    disabled={!hasRecorded}
                    className="rounded-2xl px-6 py-5 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm"
                >
                    <RefreshCw className="w-4 h-4 mr-2 text-gray-500" strokeWidth={2.5} />
                    Re-record
                </Button>

                <Button
                    onClick={onMarkComplete}
                    disabled={isMarkingComplete || contentItem?.isCompleted || !hasRecorded}
                    className={cn(
                        "rounded-2xl px-8 py-5 font-bold text-sm border-0 transition-all duration-200",
                        contentItem?.isCompleted
                            ? 'bg-green-50 text-green-700 border border-green-200 cursor-default'
                            : 'bg-gray-900 hover:bg-black text-white shadow-md hover:shadow-lg hover:-translate-y-px'
                    )}
                >
                    {isMarkingComplete ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : contentItem?.isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                    ) : null}
                    {contentItem?.isCompleted ? 'Completed' : 'Submit Review'}
                </Button>
            </div>

            {/* Bottom notice */}
            <div className="absolute bottom-6 flex items-center gap-2 text-xs text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse block" />
                Live preview — interactions may not be saved
            </div>
        </div>
    );
};

export default PracticeSpeakingPlayer;