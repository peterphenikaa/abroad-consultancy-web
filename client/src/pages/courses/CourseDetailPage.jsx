import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  CheckCircle2,
  FileText,
  PlayCircle,
  User,
  Clock,
  HelpCircle,
} from "lucide-react";

import { CourseSidebar } from "./player/CourseSidebar";
import { LessonHeader } from "./player/LessonHeader";
import QuizOverview from "./player/QuizOverview";
import VideoLesson from "./player/VideoLesson";
import DocumentLesson from "./player/DocumentLesson";
import AudioPlayer from "./player/AudioPlayer";
import InfographicPlayer from "./player/InfographicPlayer";
import PracticeWritingPlayer from "./player/PracticeWritingPlayer";
import PracticeSpeakingPlayer from "./player/PracticeSpeakingPlayer";
import DictationPlayer from "./player/DictationPlayer";
import { ContentSkeleton } from "./components/ContentSkeleton";
import { LessonNavigation, flattenContentItems } from "./player/LessonNavigation";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../components/ui/utils";

import { CourseAccessGate } from "../../hooks/useCourseAccessGuard.jsx";

export default function CourseDetailPage() {
  return (
    <CourseAccessGate>
      <CourseDetailPageInner />
    </CourseAccessGate>
  );
}

function CourseDetailPageInner() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeContentItem, setActiveContentItem] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeModule, setActiveModule] = useState(null);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`/api/v1/courses/${courseId}`);
        const data = res.data;
        if (!data.modules) data.modules = [];
        setCourse(data);
        initFirstItem(data);
      } catch (error) {
        console.error("Failed to load course details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  function initFirstItem(data) {
    if (!data || !data.modules) return;
    for (const mod of data.modules) {
      if (!mod.lessons) continue;
      for (const les of mod.lessons) {
        if (!les.contentItems) continue;
        for (const ci of les.contentItems) {
          if (!ci.isCompleted) {
            setActiveContentItem(ci);
            setActiveLesson(les);
            setActiveModule(mod);
            return;
          }
        }
      }
    }
    const firstMod = data.modules[0];
    const firstLes = firstMod?.lessons?.[0];
    const firstCi = firstLes?.contentItems?.[0];
    if (firstCi) {
      setActiveContentItem(firstCi);
      setActiveLesson(firstLes);
      setActiveModule(firstMod);
    }
  }

  const handleContentSelect = (contentItem, lesson, module) => {
    setActiveContentItem(contentItem);
    setActiveLesson(lesson);
    setActiveModule(module);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleMarkComplete = async () => {
    if (!activeContentItem || activeContentItem.isCompleted) return;
    setIsMarkingComplete(true);
    try {
      await axios.post(`/api/v1/lessons/${activeContentItem.id}/complete`);
      setCourse((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          modules: prev.modules.map((m) => ({
            ...m,
            lessons: (m.lessons || []).map((l) => ({
              ...l,
              contentItems: (l.contentItems || []).map((ci) =>
                ci.id === activeContentItem.id ? { ...ci, isCompleted: true } : ci
              ),
            })),
          })),
        };
      });
      setActiveContentItem((prev) => (prev ? { ...prev, isCompleted: true } : prev));

      queryClient.invalidateQueries({ queryKey: ["my-courses"] });
      queryClient.invalidateQueries({ queryKey: ["my-stats"] });
    } catch (error) {
      console.error("Failed to mark as completed:", error);
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const handleNavigateNext = (force = false) => {
    if (!course) return;
    if (!force && activeContentItem && !activeContentItem.isCompleted) {
      return;
    }
    const flat = flattenContentItems(course.modules);
    const idx = flat.findIndex((e) => e.contentItem.id === activeContentItem?.id);
    if (idx < flat.length - 1) {
      const next = flat[idx + 1];
      handleContentSelect(next.contentItem, next.lesson, next.module);
    }
  };

  const handleMediaEnded = () => {
    if (activeContentItem && !activeContentItem.isCompleted) {
      handleMarkComplete();
    }
  };

  const breadcrumb = useMemo(() => {
    if (!activeModule || !activeLesson) return "";
    return `${activeModule.title} › ${activeLesson.title}`;
  }, [activeModule, activeLesson]);

  return (
    <div className="h-screen w-full bg-neutral-50 flex overflow-hidden">
      <CourseSidebar
        course={course}
        activeContentItemId={activeContentItem?.id}
        onContentSelect={handleContentSelect}
        isLoading={isLoading}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-50 relative">
        {!isLoading && activeContentItem && (
          <LessonHeader
            activeContentItem={activeContentItem}
            onNextLesson={handleNavigateNext}
          />
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="w-full h-full">
            {isLoading ? (
              <ContentSkeleton />
            ) : !course ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <h3 className="text-neutral-800 mb-2">Course not found</h3>
                <p className="text-neutral-500 text-sm">The course does not exist.</p>
              </div>
            ) : activeContentItem ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
                {activeContentItem.type === "QUIZ" ? (
                  <QuizOverview
                    contentItem={activeContentItem}
                    lesson={activeLesson}
                    module={activeModule}
                    courseId={courseId}
                    onMarkComplete={handleMarkComplete}
                    onNavigateNext={handleNavigateNext}
                    onStartQuiz={() => navigate(`/courses/${courseId}/quiz/${activeContentItem.id}/take`)}
                  />
                ) : activeContentItem.type === "VIDEO" ? (
                  <VideoLesson
                    contentItem={activeContentItem}
                    onVideoEnded={handleMediaEnded}
                    onNavigateNext={() => handleNavigateNext(true)}
                    onMarkComplete={handleMarkComplete}
                    isMarkingComplete={isMarkingComplete}
                  />
                ) : activeContentItem.type === "AUDIO" ? (
                  <AudioPlayer
                    contentItem={activeContentItem}
                    onAudioEnded={handleMediaEnded}
                    onNavigateNext={() => handleNavigateNext(true)}
                  />
                ) : activeContentItem.type === "INFOGRAPHIC" ? (
                  <div className="flex flex-col w-full max-w-5xl mx-auto px-4 sm:px-8 pb-12">
                    <InfographicPlayer
                      title={activeContentItem.title}
                      description={activeContentItem.content}
                    />
                    <div className="flex justify-end gap-3 w-full">
                      <Button
                        variant={activeContentItem.isCompleted ? "outline" : "primary"}
                        onClick={handleMarkComplete}
                        disabled={isMarkingComplete || activeContentItem.isCompleted}
                        className={cn(
                          "transition-all duration-200 font-medium",
                          activeContentItem.isCompleted && "border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                        )}
                      >
                        {isMarkingComplete ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : activeContentItem.isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        ) : null}
                        {activeContentItem.isCompleted ? "Item Completed" : "Mark as Complete"}
                      </Button>
                    </div>
                  </div>
                ) : activeContentItem.type === "PRACTICE_WRITING" ? (
                  <PracticeWritingPlayer
                    contentItem={activeContentItem}
                    onMarkComplete={handleMarkComplete}
                    isMarkingComplete={isMarkingComplete}
                  />
                ) : activeContentItem.type === "PRACTICE_SPEAKING" ? (
                  <PracticeSpeakingPlayer
                    contentItem={activeContentItem}
                    onMarkComplete={handleMarkComplete}
                    isMarkingComplete={isMarkingComplete}
                  />
                ) : activeContentItem.type === "DICTATION" ? (
                  <DictationPlayer
                    title={activeContentItem.title}
                    contentItem={activeContentItem}
                    onMarkComplete={handleMarkComplete}
                    isMarkingComplete={isMarkingComplete}
                  />
                ) : (
                  <DocumentLesson
                    contentItem={activeContentItem}
                    course={course}
                    onMarkComplete={handleMarkComplete}
                    isMarkingComplete={isMarkingComplete}
                  />
                )}
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}