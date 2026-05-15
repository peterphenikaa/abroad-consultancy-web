import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../../components/ui/button";


export function flattenContentItems(modules) {
  const items = [];
  for (const module of modules) {
    for (const lesson of module.lessons) {
      for (const item of lesson.contentItems) {
        items.push({ contentItem: item, lesson, module });
      }
    }
  }
  return items;
}

export function LessonNavigation({
  course,
  activeContentItemId,
  onNavigate,
}) {
  if (!course) return null;

  const flatList = flattenContentItems(course.modules);
  const currentIndex = flatList.findIndex(
    (entry) => entry.contentItem.id === activeContentItemId
  );

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < flatList.length - 1;

  const prevEntry = hasPrev ? flatList[currentIndex - 1] : null;
  const nextEntry = hasNext ? flatList[currentIndex + 1] : null;

  return (
    <div className="flex items-center justify-between gap-4 pt-5 mt-5 border-t border-neutral-100">
      <div className="flex-1">
        {hasPrev ? (
          <button
            onClick={() =>
              onNavigate(
                prevEntry.contentItem,
                prevEntry.lesson,
                prevEntry.module
              )
            }
            className="group flex items-center gap-3 p-3 rounded-xl border border-neutral-200 bg-white hover:border-amber-300 hover:bg-amber-50/50 transition-all duration-200 w-full text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-100 group-hover:bg-amber-100 flex items-center justify-center transition-colors shrink-0">
              <ChevronLeft
                className="w-4 h-4 text-neutral-500 group-hover:text-amber-600 transition-colors"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-0.5">
                Previous
              </p>
              <p className="text-sm font-semibold text-neutral-700 group-hover:text-amber-700 truncate transition-colors leading-snug">
                {prevEntry.contentItem.title}
              </p>
              <p className="text-xs text-neutral-400 truncate">
                {prevEntry.lesson.title}
              </p>
            </div>
          </button>
        ) : (
          <div className="flex-1" />
        )}
      </div>

      <div className="shrink-0 flex flex-col items-center gap-1">
        <div className="flex gap-1">
          {flatList.slice(Math.max(0, currentIndex - 2), Math.min(flatList.length, currentIndex + 3)).map((entry, i) => {
            const absoluteIndex = Math.max(0, currentIndex - 2) + i;
            const isCurrentDot = absoluteIndex === currentIndex;
            return (
              <button
                key={entry.contentItem.id}
                onClick={() => onNavigate(entry.contentItem, entry.lesson, entry.module)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: isCurrentDot ? "20px" : "6px",
                  height: "6px",
                  background: isCurrentDot
                    ? "var(--accent-amber)"
                    : entry.contentItem.isCompleted
                    ? "#34d399"
                    : "#e5e7eb",
                }}
                title={entry.contentItem.title}
              />
            );
          })}
        </div>
        <span className="text-[10px] text-neutral-400 font-medium">
          {currentIndex + 1} / {flatList.length}
        </span>
      </div>

      <div className="flex-1 flex justify-end">
        {hasNext ? (
          <button
            onClick={() =>
              onNavigate(
                nextEntry.contentItem,
                nextEntry.lesson,
                nextEntry.module
              )
            }
            className="group flex items-center gap-3 p-3 rounded-xl border border-neutral-200 bg-white hover:border-amber-300 hover:bg-amber-50/50 transition-all duration-200 w-full text-right"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-0.5 text-right">
                Next
              </p>
              <p className="text-sm font-semibold text-neutral-700 group-hover:text-amber-700 truncate transition-colors leading-snug">
                {nextEntry.contentItem.title}
              </p>
              <p className="text-xs text-neutral-400 truncate">
                {nextEntry.lesson.title}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all"
              style={{ background: "var(--gradient-accent)" }}
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </div>
          </button>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
}
