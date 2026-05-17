import React from "react";
import { CheckCircle2, PlayCircle, FileText } from "lucide-react";

export const ContentTypeIcon = ({ type, isCompleted, isActive }) => {
  if (isCompleted) {
    return <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />;
  }
  if (isActive) {
    return (
      <PlayCircle
        className="w-4 h-4 shrink-0 animate-pulse"
        style={{ color: "var(--accent-amber)" }}
      />
    );
  }
  if (type === "VIDEO") {
    return <PlayCircle className="w-4 h-4 shrink-0 text-neutral-400" />;
  }
  return <FileText className="w-4 h-4 shrink-0 text-neutral-400" />;
};
