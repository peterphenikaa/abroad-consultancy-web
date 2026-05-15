import React from "react";
import { Target, Circle } from "lucide-react";
import { motion } from "framer-motion";

export function MilestoneList({ milestones }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl p-6 shadow-[var(--shadow-md)] border border-[var(--border)]"
    >
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-[var(--accent-amber)]" />
        Milestones
      </h3>
      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const isCompleted = milestone.completed || milestone.status === 'completed';
          const isInProgress = milestone.status === 'in-progress' || (!isCompleted && index === 0); // fallback logic
          const Icon = Circle;

          return (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3"
            >
              <div className={`mt-1 ${isInProgress ? 'text-[var(--accent-amber)]' : (isCompleted ? 'text-green-500' : 'text-[var(--muted-foreground)]')}`}>
                {isInProgress ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                ) : isCompleted ? (
                  <Icon className="w-5 h-5 fill-current opacity-80" />
                ) : (
                  <Icon className="w-5 h-5 opacity-80" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-[var(--foreground)] text-sm">{milestone.title}</div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  Target: {milestone.targetDate || new Date(milestone.target).toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
