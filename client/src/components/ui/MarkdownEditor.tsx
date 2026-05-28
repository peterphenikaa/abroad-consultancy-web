import React from 'react';
// @ts-ignore
import '@mdxeditor/editor/style.css';
import {
    MDXEditor,
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    thematicBreakPlugin,
    markdownShortcutPlugin,
    toolbarPlugin,
    BlockTypeSelect,
    BoldItalicUnderlineToggles,
    UndoRedo,
    CreateLink,
    linkPlugin,
    linkDialogPlugin,
    tablePlugin,
    InsertTable
} from '@mdxeditor/editor';

interface MarkdownEditorProps {
    markdown: string;
    onChange: (markdown: string) => void;
}

export function MarkdownEditor({ markdown, onChange }: MarkdownEditorProps) {
    return (
        <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white">
            <MDXEditor
                markdown={markdown || ''}
                onChange={onChange}
                contentEditableClassName="prose prose-neutral max-w-none p-4 min-h-[300px] focus:outline-none"
                plugins={[
                    headingsPlugin(),
                    listsPlugin(),
                    quotePlugin(),
                    thematicBreakPlugin(),
                    markdownShortcutPlugin(),
                    linkPlugin(),
                    linkDialogPlugin(),
                    tablePlugin(),
                    toolbarPlugin({
                        toolbarContents: () => (
                            <div className="flex items-center gap-1 p-1 bg-neutral-50 border-b border-neutral-200 w-full overflow-x-auto">
                                <UndoRedo />
                                <div className="w-px h-4 bg-neutral-300 mx-1" />
                                <BoldItalicUnderlineToggles />
                                <div className="w-px h-4 bg-neutral-300 mx-1" />
                                <BlockTypeSelect />
                                <div className="w-px h-4 bg-neutral-300 mx-1" />
                                <CreateLink />
                                <InsertTable />
                            </div>
                        )
                    })
                ]}
            />
        </div>
    );
}
