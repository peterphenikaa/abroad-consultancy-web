import React, { useMemo } from 'react';
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { ArrowRight } from "lucide-react";
import DownloadButton from "../../../components/ui/DownloadButton";

export function LessonHeader({ activeContentItem, onNextLesson, onReportIssue }) {
    if (!activeContentItem) return null;

    const isCompleted = activeContentItem.isCompleted;

    return (
        <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 bg-white border-b border-gray-200">
            <div>
                <h1 className="text-2xl font-bold font-serif text-gray-900">
                    {activeContentItem.title}
                </h1>
                <div className="flex items-center gap-3 mt-1 text-sm font-medium text-gray-500">
                    <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-bold uppercase bg-gray-100 text-gray-700 rounded-sm">
                        {activeContentItem.type}
                    </Badge>
                    <span>
                        {activeContentItem.duration
                            ? `${Math.floor(activeContentItem.duration / 60)}:${Math.floor(activeContentItem.duration % 60).toString().padStart(2, '0')}`
                            : '00:00'}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <DownloadButton contentId={activeContentItem.id} />
                <Button className="rounded-full px-6 bg-[#F59E0B] hover:bg-amber-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={onNextLesson}
                    disabled={!isCompleted}
                >
                    Next Lesson <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </header>
    );
}
