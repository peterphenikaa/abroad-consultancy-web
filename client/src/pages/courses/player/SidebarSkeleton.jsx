import React from "react";

export const SidebarSkeleton = () => (
  <div className="p-4 space-y-4 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div key={i} className="space-y-2">
        <div className="h-4 bg-neutral-200 rounded-md w-3/4" />
        <div className="ml-4 space-y-2">
          <div className="h-3 bg-neutral-100 rounded w-2/3" />
          <div className="h-3 bg-neutral-100 rounded w-1/2" />
        </div>
      </div>
    ))}
  </div>
);
