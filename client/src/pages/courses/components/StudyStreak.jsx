import React from "react";
import { Award } from "lucide-react";
import { motion } from "framer-motion";

export function StudyStreak({ streak }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-gradient-to-br from-[var(--accent-amber)] to-[var(--accent-coral)] rounded-2xl p-6 shadow-[var(--shadow-lg)] text-white"
    >
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Award className="w-5 h-5" />
        Study Streak
      </h3>
      <div className="text-center">
        <div className="text-5xl font-bold mb-2">{streak.days}</div>
        <div className="text-sm opacity-90">Days in a row</div>
      </div>
      <div className="mt-4 pt-4 border-t border-white/20">
        <div className="text-sm opacity-90 mb-2">This week</div>
        <div className="flex justify-between gap-1">
          {streak.weekDays.map((day, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${day.active ? 'bg-white text-[var(--accent-amber)] shadow-sm' : 'bg-white/20'
                }`}
            >
              {day.label}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
