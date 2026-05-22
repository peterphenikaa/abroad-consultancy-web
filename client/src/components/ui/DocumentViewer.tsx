import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DocumentViewerProps {
    content: string;
}

export function DocumentViewer({ content }: DocumentViewerProps) {
    if (!content) return null;
    return (
        <div className="prose prose-neutral max-w-none">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ node, ...props }) => <h1 className="mt-0 mb-4 pb-3 border-b border-neutral-200" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="mt-6 mb-3" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="mt-4 mb-2" {...props} />,
                    p: ({ node, ...props }) => <p className="text-sm text-neutral-700 leading-relaxed mb-4" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4" {...props} />,
                    li: ({ node, ...props }) => <li className="text-sm text-neutral-700 mb-1" {...props} />,
                    table: ({ node, ...props }) => <table className="w-full border-collapse border border-neutral-200 mb-4" {...props} />,
                    thead: ({ node, ...props }) => <thead className="bg-neutral-50" {...props} />,
                    th: ({ node, ...props }) => <th className="border border-neutral-200 px-3 py-2 text-left text-sm font-semibold text-neutral-700" {...props} />,
                    td: ({ node, ...props }) => <td className="border border-neutral-200 px-3 py-2 text-sm text-neutral-700" {...props} />,
                    a: ({ node, ...props }) => <a className="text-blue-600 hover:underline" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold text-neutral-900" {...props} />
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
