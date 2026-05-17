import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, CheckCircle2, Loader2, Edit3, Check, Headphones } from 'lucide-react';
import { Button } from "../../../components/ui/button";
import { cn } from "../../../components/ui/utils";

const DictationPlayer = ({ title, contentItem, onMarkComplete, isMarkingComplete }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState('0:00');
    const [duration, setDuration] = useState('0:00');
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    const [dictationText, setDictationText] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const speedOptions = [0.5, 0.75, 1, 1.25];
    const url = contentItem?.contentUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

    const formatTime = (timeInSeconds) => {
        if (isNaN(timeInSeconds)) return '0:00';
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handlePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const total = audioRef.current.duration;
            setProgress((current / total) * 100);
            setCurrentTime(formatTime(current));
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(formatTime(audioRef.current.duration));
        }
    };

    const handleSeek = (e) => {
        if (audioRef.current) {
            const seekTime = (e.target.value / 100) * audioRef.current.duration;
            audioRef.current.currentTime = seekTime;
            setProgress(e.target.value);
        }
    };

    const handleSpeedChange = (rate) => {
        if (audioRef.current) {
            audioRef.current.playbackRate = rate;
            setPlaybackRate(rate);
        }
    };

    const handleAudioEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
        }
    };

    const handleSubmitDictation = () => {
        setIsSubmitted(true);
    };

    return (
        <div className="w-full max-w-4xl mx-auto my-8 lg:my-12 bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col gap-0 min-h-[560px] overflow-hidden">

            {/* Top accent stripe */}
            <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 opacity-60 flex-shrink-0" />

            <div className="flex flex-col gap-6 p-8 flex-1">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                            <Headphones className="w-3 h-3" />
                            Dictation Exercise
                        </span>
                        <h2 className="text-2xl font-serif font-bold text-gray-900">
                            {title || "Dictation Practice"}
                        </h2>
                    </div>
                </div>

                {/* Instruction banner */}
                <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600 leading-relaxed">
                        <span className="font-semibold text-gray-800">Hướng dẫn:</span> Nghe đoạn audio và gõ lại chính xác những gì bạn nghe được. Bạn có thể điều chỉnh tốc độ nghe cho phù hợp.
                    </p>
                </div>

                {/* Audio Player */}
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                    {/* Play + Progress row */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handlePlayPause}
                            className={cn(
                                "w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-200 shadow-sm",
                                isPlaying
                                    ? "bg-gray-900 hover:bg-black text-white"
                                    : "bg-white border border-gray-200 hover:border-gray-300 text-gray-700 hover:shadow-md"
                            )}
                        >
                            {isPlaying ? (
                                <Pause className="w-5 h-5 fill-current" />
                            ) : (
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                            )}
                        </button>

                        <div className="flex-grow flex flex-col justify-center gap-1.5">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={progress || 0}
                                onChange={handleSeek}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none"
                                style={{
                                    background: `linear-gradient(to right, #111827 ${progress}%, #e5e7eb ${progress}%)`
                                }}
                            />
                            <div className="flex justify-between text-xs text-gray-400 font-medium">
                                <span>{currentTime}</span>
                                <span>{duration}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                if (audioRef.current) {
                                    audioRef.current.muted = !isMuted;
                                    setIsMuted(!isMuted);
                                }
                            }}
                            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-full transition-colors"
                        >
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Speed Controls */}
                    <div className="flex items-center gap-3 border-t border-gray-200 pt-3">
                        <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Tốc độ:</span>
                        <div className="flex gap-1.5">
                            {speedOptions.map((rate) => (
                                <button
                                    key={rate}
                                    onClick={() => handleSpeedChange(rate)}
                                    className={cn(
                                        "px-3 py-1 text-xs font-bold rounded-full transition-all duration-150 border",
                                        playbackRate === rate
                                            ? 'bg-gray-900 text-white border-gray-900'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900'
                                    )}
                                >
                                    {rate}x
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Text Input Area */}
                <div className="bg-white border border-gray-200 rounded-2xl flex flex-col flex-grow overflow-hidden shadow-sm">
                    {/* Textarea header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Edit3 className="w-4 h-4 text-amber-500" />
                            Gõ đáp án của bạn
                        </div>
                        {isSubmitted && (
                            <div className="flex items-center gap-1.5 text-green-600 text-xs font-semibold bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                                <Check className="w-3.5 h-3.5" />
                                Đã nộp đáp án
                            </div>
                        )}
                    </div>
                    <div className="flex-grow p-5">
                        <textarea
                            value={dictationText}
                            onChange={(e) => setDictationText(e.target.value)}
                            disabled={isSubmitted}
                            placeholder="Nghe audio và gõ những gì bạn nghe được vào đây..."
                            className="w-full h-full min-h-[160px] resize-none outline-none text-gray-800 text-[15px] leading-relaxed placeholder:text-gray-300 disabled:opacity-60 bg-transparent"
                            spellCheck="false"
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 pt-1">
                    {!isSubmitted ? (
                        <Button
                            onClick={handleSubmitDictation}
                            disabled={dictationText.trim() === ''}
                            className="rounded-2xl font-bold text-sm px-5 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 shadow-none disabled:opacity-40"
                        >
                            Kiểm tra đáp án
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={() => setIsSubmitted(false)}
                            className="rounded-2xl font-semibold text-sm px-5 py-2.5 border-gray-200 text-gray-700 hover:bg-gray-50"
                        >
                            Làm lại
                        </Button>
                    )}

                    <Button
                        onClick={onMarkComplete}
                        disabled={isMarkingComplete || contentItem?.isCompleted}
                        className={cn(
                            "rounded-2xl font-bold text-sm px-6 py-2.5 transition-all duration-200 shadow-sm",
                            contentItem?.isCompleted
                                ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 cursor-default'
                                : 'bg-gray-900 hover:bg-black text-white hover:shadow-md hover:-translate-y-px active:translate-y-0'
                        )}
                    >
                        {isMarkingComplete ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : contentItem?.isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                        ) : null}
                        {contentItem?.isCompleted ? 'Completed' : 'Mark as Complete'}
                    </Button>
                </div>
            </div>

            <audio
                ref={audioRef}
                src={url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleAudioEnded}
            />
        </div>
    );
};

export default DictationPlayer;