import React, { useState } from "react";

export function TranscriptPlayer({ contentItem }) {
    const [activeTranscriptIndex, setActiveTranscriptIndex] = useState(0);

    const transcript = contentItem?.transcript || [
        { time: "0:00", text: "Welcome to the TOEFL iBT Mastery course." },
        { time: "0:05", text: "In this session, we will explore the exam structure." },
        { time: "0:12", text: "The test consists of four main sections: Reading, Listening, Speaking, and Writing." }
    ];

    if (!contentItem) return null;

    return (
        <div className="w-full lg:w-80 xl:w-96 flex flex-col flex-shrink-0 pt-8">
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-6">Interactive Transcript</h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {transcript.map((item, index) => {
                    const isActive = index === activeTranscriptIndex;
                    return (
                        <div
                            key={index}
                            onClick={() => setActiveTranscriptIndex(index)}
                            className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 ${
                                isActive
                                ? "border border-neutral-800 bg-white shadow-sm"
                                : "hover:bg-neutral-50 border border-transparent"
                                }`}
                        >
                            <div className="text-xs font-medium text-neutral-400 mb-2">{item.time}</div>
                            <div className={`text-sm leading-relaxed ${isActive ? "text-neutral-900 font-medium" : "text-neutral-400"
                                }`}>
                                {item.text}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
