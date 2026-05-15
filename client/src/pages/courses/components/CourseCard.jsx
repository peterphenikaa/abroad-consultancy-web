import React from "react";
import { Card, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Clock } from "lucide-react";

const themeColors = [
  "var(--chart-4)",
  "var(--chart-1)",
  "var(--chart-2)",
];

export function CourseCard({ course, isSelected, onSelect, onOpenCourse }) {
  const randomColorIdx = course.title ? course.title.length % themeColors.length : 0;
  const mainColor = themeColors[randomColorIdx];
  const bgColorStyle = { backgroundColor: mainColor };

  return (
    <Card
      onClick={onSelect}
      className={`border-neutral-200 rounded-2xl cursor-pointer transition-all duration-300 ease-out shadow-sm hover:shadow-md ${isSelected ? "-translate-y-1 shadow-lg" : "translate-y-0"}`}>
      <CardContent className="p-5 space-y-5">

        <div className="flex gap-4 justify-between items-start">
          <div className="flex-1 space-y-2">
            <Badge variant="secondary" className="font-normal border-0 text-xs px-2 py-0.5" style={{ backgroundColor: 'var(--neutral-100)', color: 'var(--neutral-800)' }}>
              {course.subject || "English Proficiency"}
            </Badge>

            <div>
              <h3 className="text-xl font-bold font-[var(--font-serif)] text-neutral-900 leading-tight">
                {course.title}
              </h3>
              <p className="text-sm text-neutral-500 mt-1">
                Next: {course.nextLessonTitle}
              </p>
            </div>
          </div>

          <div
            className="shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-sm"
            style={bgColorStyle}
          >
            {course.progressPercent || 0}%
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-sm text-neutral-500 font-medium">
            <span>{course.completedItems || 0} of {course.totalItems || 0} items</span>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>
                Due: {course.deadline ? new Date(course.deadline).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                }) : "Không giới hạn"}
              </span>
            </div>
          </div>
          <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden w-full">
            <div
              className="h-full rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${course.progressPercent || 0}%`, ...bgColorStyle }}
            />
          </div>
        </div>

        {isSelected && (
          <div className="pt-4 pb-0">
            <div className="border-t border-[var(--border)] pt-4">
              <Button
                variant="gradient"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCourse?.(course);
                }}
              >
                Continue Learning
              </Button>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}