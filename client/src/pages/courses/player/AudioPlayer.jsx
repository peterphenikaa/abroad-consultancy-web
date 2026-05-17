import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack } from 'lucide-react';
import { TranscriptPlayer } from '../components/TranscriptPlayer';

const AudioPlayer = ({ contentItem, onAudioEnded, onNavigateNext }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState('0:00');
    const [duration, setDuration] = useState('0:00');
    const [currentSecs, setCurrentSecs] = useState(0);
    const [durationSecs, setDurationSecs] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(100);

    const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

    const url = contentItem?.contentUrl || contentItem?.url || "";

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
            setCurrentSecs(current);
            setProgress((current / total) * 100);
            setCurrentTime(formatTime(current));
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDurationSecs(audioRef.current.duration);
            setDuration(formatTime(audioRef.current.duration));
        }
    };

    const handleSeek = (e) => {
        if (audioRef.current) {
            const seekTime = (e.target.value / 100) * audioRef.current.duration;
            audioRef.current.currentTime = seekTime;
            setCurrentSecs(seekTime);
            setProgress(e.target.value);
        }
    };

    const handleSpeedChange = (rate) => {
        if (audioRef.current) {
            audioRef.current.playbackRate = rate;
            setPlaybackRate(rate);
        }
    };

    const handleMute = () => {
        if (audioRef.current) {
            const newMutedState = !isMuted;
            audioRef.current.muted = newMutedState;
            setIsMuted(newMutedState);
            if (newMutedState) {
                audioRef.current.volume = 0;
                setVolume(0);
            } else {
                audioRef.current.volume = 1;
                setVolume(100);
            }
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseInt(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume / 100;
            if (newVolume === 0) {
                setIsMuted(true);
                audioRef.current.muted = true;
            } else if (isMuted) {
                setIsMuted(false);
                audioRef.current.muted = false;
            }
        }
    };

    const handleSkip = (seconds) => {
        if (audioRef.current) {
            let newTime = audioRef.current.currentTime + seconds;
            if (newTime < 0) newTime = 0;
            if (newTime > audioRef.current.duration) newTime = audioRef.current.duration;
            audioRef.current.currentTime = newTime;
            setCurrentSecs(newTime);
            setProgress((newTime / audioRef.current.duration) * 100);
            setCurrentTime(formatTime(newTime));
        }
    };

    const handleAudioEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentSecs(0);
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
        }
        if (onAudioEnded) {
            onAudioEnded();
        }
    };

    if (!contentItem) return null;

    const timeLeftSecs = Math.max(0, durationSecs - currentSecs);
    const minutesLeft = Math.ceil(timeLeftSecs / 60);
    const radius = 64;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - ((progress || 0) / 100) * circumference;

    return (
        <div className="w-full max-w-7xl mx-auto my-8 lg:my-12 px-6 lg:px-8 flex flex-col lg:flex-row gap-8 h-full">
            <div className="flex-1 flex flex-col min-w-0">
                <div className="bg-white flex flex-col overflow-hidden h-full rounded-3xl border border-gray-200 shadow-sm">

                    {/* Top accent stripe */}
                    <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 opacity-60 flex-shrink-0" />

                    {/* Player area */}
                    <div className="w-full bg-gray-50 relative flex-shrink-0 p-12 border-b border-gray-100 flex flex-col justify-center items-center min-h-[300px]">

                        {/* Circular progress */}
                        <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                                <circle
                                    cx="80"
                                    cy="80"
                                    r={radius}
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    fill="transparent"
                                    className="text-gray-200"
                                />
                                <circle
                                    cx="80"
                                    cy="80"
                                    r={radius}
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    className="text-amber-400 transition-all duration-300 ease-in-out"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
                                <span className="text-4xl font-bold text-gray-900 leading-none">{minutesLeft}</span>
                                <span className="text-[13px] font-medium text-gray-400 mt-2">minutes left</span>
                            </div>
                        </div>

                        <div className="w-full max-w-2xl flex flex-col items-center">
                            {/* Play button */}
                            <button
                                onClick={handlePlayPause}
                                className="w-20 h-20 flex items-center justify-center bg-gray-900 hover:bg-black text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl mb-8"
                            >
                                {isPlaying ? (
                                    <Pause className="w-8 h-8 fill-current" />
                                ) : (
                                    <Play className="w-8 h-8 fill-current ml-1" />
                                )}
                            </button>

                            {/* Progress bar */}
                            <div className="w-full mb-8">
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
                                <div className="flex justify-between mt-2 text-sm text-gray-400 font-medium">
                                    <span>{currentTime}</span>
                                    <span>{duration}</span>
                                </div>
                            </div>

                            {/* Skip + Volume controls */}
                            <div className="flex items-center gap-6 mb-8">
                                <button
                                    onClick={() => handleSkip(-20)}
                                    className="w-12 h-12 flex items-center justify-center bg-white border border-gray-200 shadow-sm rounded-full text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-all duration-200"
                                    title="Skip Backward 20s"
                                >
                                    <SkipBack className="w-5 h-5" />
                                </button>

                                <div className="flex items-center bg-white border border-gray-200 shadow-sm rounded-full px-4 h-12 gap-3">
                                    <button onClick={handleMute} className="text-gray-500 hover:text-gray-900 transition-colors">
                                        {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                    </button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={volume}
                                        onChange={handleVolumeChange}
                                        className="w-24 h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none"
                                        style={{
                                            background: `linear-gradient(to right, #111827 ${volume}%, #e5e7eb ${volume}%)`
                                        }}
                                    />
                                </div>

                                <button
                                    onClick={() => handleSkip(20)}
                                    className="w-12 h-12 flex items-center justify-center bg-white border border-gray-200 shadow-sm rounded-full text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-all duration-200"
                                    title="Skip Forward 20s"
                                >
                                    <SkipForward className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Speed controls */}
                            <div className="flex items-center justify-center gap-4">
                                <span className="text-sm font-semibold text-gray-500">Tốc độ:</span>
                                <div className="flex items-center gap-2">
                                    {speedOptions.map((rate) => (
                                        <button
                                            key={rate}
                                            onClick={() => handleSpeedChange(rate)}
                                            className={`px-4 py-2 text-sm font-bold rounded-full transition-all duration-150 border shadow-sm ${
                                                playbackRate === rate
                                                    ? 'bg-gray-900 text-white border-gray-900'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900'
                                            }`}
                                        >
                                            {rate}x
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info section */}
                    <div className="p-8 text-gray-900 flex-1 overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                                    Podcast
                                </span>
                                <h2 className="text-2xl font-serif font-bold mb-3">{contentItem.title}</h2>
                                <p className="text-gray-500 text-sm leading-relaxed max-w-3xl">
                                    {contentItem.description || "Listen to the podcast. Follow the transcript on the side to read along with the audio."}
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <TranscriptPlayer contentItem={contentItem} />

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

export default AudioPlayer;