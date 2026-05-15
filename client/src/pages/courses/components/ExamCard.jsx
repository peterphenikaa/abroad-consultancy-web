import React from "react";
import { Card, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";

export function ExamCard({ exam }) {
  return (
    <Card className="border-neutral-100 shadow-sm hover:shadow-md transition-shadow gap-0">
      <CardContent className="p-5 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1.5">
          <h4 className="text-base font-semibold text-neutral-900">{exam.title}</h4>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <svg className="w-4 h-4 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{exam.date}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <svg className="w-4 h-4 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{exam.time} • {exam.location}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 uppercase tracking-wide text-[10px] font-semibold">
            {exam.status}
          </Badge>
          <span className="text-xs text-neutral-400">Register by {exam.registerBy}</span>
        </div>
      </CardContent>
    </Card>
  );
}
