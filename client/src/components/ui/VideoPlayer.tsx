import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipForward,
  SkipBack,
  Loader2,
  RefreshCcw,
  ArrowRight,
  PictureInPicture2
} from "lucide-react";
import { Button } from "./button";

function formatTime(seconds: number) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  onEnded?: () => void;
  onNext?: () => void;
}

export function VideoPlayer({ videoUrl, title, onEnded, onNext }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isEnded, setIsEnded] = useState(false);
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showRateMenu, setShowRateMenu] = useState(false);

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?rel=0&showinfo=0&autoplay=0`;
    }
    return null;
  };

  const youtubeEmbedUrl = getYouTubeEmbedUrl(videoUrl);

  if (youtubeEmbedUrl) {
    return (
      <div className="relative bg-black rounded-none overflow-hidden group w-full h-full aspect-video">
        <iframe
          src={youtubeEmbedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsEnded(false);
  }, [videoUrl]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    if (isPlaying && !isEnded) {
      hideTimeout.current = setTimeout(() => setShowControls(false), 2500);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isEnded) {
      setIsEnded(false);
      video.currentTime = 0;
      video.play();
      setIsPlaying(true);
      return;
    }
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) setCurrentTime(video.currentTime);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) setDuration(video.duration);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    if (!bar || !videoRef.current) return;
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = ratio * duration;
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(videoRef.current.currentTime + seconds, duration)
      );
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      videoRef.current.requestFullscreen?.();
    }
  };

  const handlePIP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error("Lỗi PIP: ", error);
    }
  };

  const togglePlaybackRate = () => {
    setShowRateMenu(!showRateMenu);
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="relative bg-black rounded-none overflow-hidden group w-full h-full aspect-video"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          setShowControls(true);
          setIsEnded(true);
          onEnded?.();
        }}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onClick={togglePlay}
      />

      {isEnded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 gap-6 backdrop-blur-sm animate-in fade-in duration-300">
          <p className="text-white/90 font-medium text-lg mb-2">Bạn đã hoàn thành video này</p>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-xl gap-2 h-11 px-6 transition-all hover:scale-105"
              onClick={() => {
                setIsEnded(false);
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  videoRef.current.play();
                  setIsPlaying(true);
                }
              }}
            >
              <RefreshCcw className="w-4 h-4" />
              Phát lại
            </Button>
            {onNext && (
              <Button
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl gap-2 h-11 px-6 shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                onClick={onNext}
              >
                Bài tiếp
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {isBuffering && !isEnded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Loader2
            className="w-10 h-10 animate-spin"
            style={{ color: "var(--accent-amber)" }}
          />
        </div>
      )}

      {!isPlaying && !isBuffering && !isEnded && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center group/play transition-all duration-300"
          aria-label="Play video"
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl backdrop-blur-md bg-black/40 border border-white/20 transition-colors transition-transform duration-200 group-hover/play:scale-110 group-hover/play:bg-black/60"
          >
            <Play className="w-10 h-10 text-white ml-2 fill-white" />
          </div>
        </button>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 px-4 py-3 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
        }}
      >
        <p className="text-white text-sm font-medium mb-3 truncate opacity-90 hidden sm:block">
          {title}
        </p>
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="w-full h-1 bg-white/30 rounded-none mb-3 cursor-pointer group/bar relative"
        >
          <div
            className="h-full transition-all"
            style={{
              width: `${progressPercent}%`,
              background: "#ff0000",
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#ff0000] shadow-lg opacity-0 group-hover/bar:opacity-100 transition-opacity"
            style={{ left: `calc(${progressPercent}% - 8px)` }}
          />
        </div>

        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="text-white/90 hover:text-white transition-transform hover:scale-110 cursor-pointer"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current" />
              )}
            </button>
            <button
              onClick={() => handleSkip(-10)}
              className="text-white/80 hover:text-white transition-colors cursor-pointer"
              aria-label="Skip back 10s"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleSkip(10)}
              className="text-white/80 hover:text-white transition-colors cursor-pointer"
              aria-label="Skip forward 10s"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            <button
              onClick={toggleMute}
              className="text-white/80 hover:text-white transition-colors pl-2 cursor-pointer"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <span className="text-white/70 text-xs font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="relative"
              onMouseLeave={() => setShowRateMenu(false)}
            >
              {showRateMenu && (
                <div className="absolute bottom-full pb-2 left-1/2 -translate-x-1/2 z-50">
                  <div className="bg-black/90 backdrop-blur-md rounded-xl overflow-hidden flex flex-col shadow-xl border border-white/10 py-1">
                    {[0.5, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                      <button
                        key={rate}
                        onClick={() => {
                          if (videoRef.current) videoRef.current.playbackRate = rate;
                          setPlaybackRate(rate);
                          setShowRateMenu(false);
                        }}
                        className={`px-4 py-2 text-sm text-center transition-colors hover:bg-white/20 whitespace-nowrap ${playbackRate === rate ? 'text-amber-500 font-bold bg-white/10' : 'text-white'}`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={togglePlaybackRate}
                className="text-white/80 hover:text-white transition-colors text-sm font-semibold p-1 w-10 text-center cursor-pointer"
                title="Tốc độ phát"
              >
                {playbackRate}x
              </button>
            </div>
            <button
              onClick={handlePIP}
              className="text-white/80 hover:text-white transition-colors p-1 cursor-pointer"
              title="Picture in picture"
            >
              <PictureInPicture2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleFullscreen}
              className="text-white/80 hover:text-white transition-colors p-1 cursor-pointer"
              aria-label="Fullscreen"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}