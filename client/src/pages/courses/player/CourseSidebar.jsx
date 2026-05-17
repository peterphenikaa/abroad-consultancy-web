import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  PlayCircle,
  FileText,
  HelpCircle,
  Lock,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  PieChart,
  PenTool,
  Mic,
  Headphones
} from "lucide-react";
import { cn } from "../../../components/ui/utils";
import { SidebarSkeleton } from "./SidebarSkeleton";

export function CourseSidebar({
  course,
  activeContentItemId,
  onContentSelect,
  isLoading,
}) {
  const navigate = useNavigate();
  const [collapsedLessons, setCollapsedLessons] = useState({});

  const toggleLesson = (lessonId) => {
    setCollapsedLessons((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId],
    }));
  };

  if (isLoading) {
    return (
      <aside className="w-80 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
        <SidebarSkeleton />
      </aside>
    );
  }

  if (!course) return null;

  const allItems = course.modules.flatMap((m) =>
    m.lessons.flatMap((l) => l.contentItems)
  );
  const lockedStateMap = {};
  // let isPreviousCompleted = true;

  allItems.forEach((item, index) => {
    // unlock tất cả để t
    lockedStateMap[item.id] = false; // !isPreviousCompleted;
    // isPreviousCompleted = item.isCompleted;
  });

  const completedCount = allItems.filter((ci) => ci.isCompleted).length;
  const progressPercent = Math.round((completedCount / (allItems.length || 1)) * 100);

  const getIconForType = (type) => {
    switch (type) {
      case "VIDEO": return <PlayCircle className="w-3 h-3" />;
      case "QUIZ": return <HelpCircle className="w-3 h-3" />;
      case "INFOGRAPHIC": return <PieChart className="w-3 h-3" />;
      case "PRACTICE_WRITING": return <PenTool className="w-3 h-3" />;
      case "PRACTICE_SPEAKING": return <Mic className="w-3 h-3" />;
      case "DICTATION": return <Headphones className="w-3 h-3" />;
      case "READING":
      default: return <FileText className="w-3 h-3" />;
    }
  };

  return (
    <aside className="w-80 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 overflow-hidden">
      <div
        className="p-5 border-b border-gray-100 flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => navigate("/courses")}
      >
        <ChevronLeft className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Back to Courses</span>
      </div>

      <div className="p-5 border-b border-gray-100 shrink-0">
        <h2 className="text-xl font-extrabold font-serif text-gray-900 mb-4 line-clamp-2">
          {course.title || "TOEFL Preparation"}
        </h2>

        <div>
          <div className="flex justify-between text-xs font-semibold text-gray-400 mb-2">
            <span>Course Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-800 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-6 custom-scrollbar">
        {course.modules.length === 0 ? (
          <div className="px-5 text-sm text-gray-500">No modules found.</div>
        ) : course.modules.map((module, moduleIndex) => {
          const displayModuleTitle = module.title?.replace(/^(MODULE\s*\d+:\s*)+/ig, '') || module.title;

          return (
            <div key={module.id} className="space-y-6">
              <h3 className="px-5 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">
                MODULE {moduleIndex + 1}: {displayModuleTitle}
              </h3>

              {module.lessons.map((lesson, lessonIndex) => {
                const isCollapsed = collapsedLessons[lesson.id];
                return (
                  <div key={lesson.id} className="space-y-1">
                    <div
                      className="px-5 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-50 border-l-4 border-[var(--accent-amber)] ml-2"
                      onClick={() => toggleLesson(lesson.id)}
                    >
                      <h4 className="text-sm font-semibold text-gray-900 select-none">
                        {lesson.title || `Lesson ${lessonIndex + 1}`}
                      </h4>
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>

                    {!isCollapsed && (
                      <div className="space-y-1.5 px-3 py-1">
                        {lesson.contentItems.map(item => {
                          const isActive = item.id === activeContentItemId;
                          const isLocked = lockedStateMap[item.id];

                          return (
                            <button
                              key={item.id}
                              disabled={isLocked}
                              onClick={() => {
                                if (!isLocked) {
                                  onContentSelect(item, lesson, module);
                                }
                              }}
                              className={cn(
                                "w-full flex items-start gap-3 p-3 text-left rounded-2xl transition-all duration-200",
                                isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                                isActive ? "bg-white border border-gray-800 shadow-sm" : "border border-transparent hover:bg-gray-50",
                              )}
                            >
                              <div className="mt-0.5 shrink-0">
                                {isLocked ? (
                                  <Lock className="w-5 h-5 text-gray-300" />
                                ) : item.isCompleted ? (
                                  <div className="w-5 h-5 rounded-full border border-emerald-500 shrink-0 flex items-center justify-center bg-white">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-gray-800 shrink-0 flex items-center justify-center bg-white"></div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "text-sm font-semibold truncate mb-1",
                                  isActive ? "text-gray-900" : isLocked ? "text-gray-400" : "text-gray-700"
                                )}>
                                  {item.title}
                                </p>
                                <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                                  {getIconForType(item.type)}
                                  <span>
                                    {item.duration
                                      ? `${Math.floor(item.duration / 60)}:${Math.floor(item.duration % 60).toString().padStart(2, '0')}`
                                      : "00:00"}
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
