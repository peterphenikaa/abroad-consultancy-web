import React from 'react';

export function ContentSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="aspect-video bg-neutral-200 rounded-2xl" />
            <div className="space-y-3">
                <div className="h-5 bg-neutral-200 rounded w-2/3" />
                <div className="h-4 bg-neutral-100 rounded w-1/3" />
            </div>
            <div className="space-y-2">
                <div className="h-3 bg-neutral-100 rounded w-full" />
                <div className="h-3 bg-neutral-100 rounded w-4/5" />
                <div className="h-3 bg-neutral-100 rounded w-3/5" />
            </div>
        </div>
    );
}
