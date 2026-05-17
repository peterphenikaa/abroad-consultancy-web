import React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { VideoPlayer } from "../../../components/ui/VideoPlayer";
import { Button } from "../../../components/ui/button";
import { TranscriptPlayer } from '../components/TranscriptPlayer';

export default function VideoLesson({
    contentItem,
    onVideoEnded,
    onNavigateNext,
    onMarkComplete,
    isMarkingComplete,
}) {

    if (!contentItem) return null;
    const rawUrl = contentItem.videoUrl || contentItem.url || contentItem.contentData || "";
    const isInvalidUrl = rawUrl.includes("example.com") || rawUrl === "";
    const finalVideoUrl = isInvalidUrl ? "https://www.w3schools.com/html/mov_bbb.mp4" : rawUrl;

    return (
        <div className="w-full max-w-7xl mx-auto my-8 lg:my-12 px-6 lg:px-8 flex flex-col lg:flex-row gap-8 h-full">
            <div className="flex-1 flex flex-col min-w-0">
                <div className="bg-white flex flex-col overflow-hidden h-full rounded-3xl border border-gray-200 shadow-sm">
                    <div className="aspect-video w-full bg-black relative flex-shrink-0">
                        <VideoPlayer
                            videoUrl={finalVideoUrl}
                            title={contentItem.title}
                            onEnded={onVideoEnded}
                            onNext={onNavigateNext}
                        />
                    </div>
                    <div className="p-8 text-neutral-900 flex-1 overflow-y-auto">
                        <h2 className="text-2xl font-serif font-bold mb-3">{contentItem.title}</h2>
                        <p className="text-neutral-600 text-sm leading-relaxed">
                            {contentItem.description || "This lesson covers the core essentials. Follow the transcript below to jump to specific topics."}
                        </p>
                    </div>
                </div>
            </div>
            <TranscriptPlayer contentItem={contentItem} />
        </div>
    );
}
