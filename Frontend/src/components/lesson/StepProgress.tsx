import React from "react";

interface StepProgressProps {
  current: number;
  total: number;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  current,
  total,
}) => {
  const percentage = Math.round(((current + 1) / total) * 100);

  return (
    <div className="bg-white/5 rounded-2xl p-5 backdrop-blur-sm border border-white/10">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-white font-semibold text-lg">
          Step {current + 1} / {total}
        </span>
        <span className="text-white/70 font-bold text-lg">{percentage}%</span>
      </div>

      {/* Step dots */}
      <div className="flex gap-2 justify-center mb-4">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              i < current
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                : i === current
                  ? "bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)] scale-125"
                  : "bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-linear-to-r from-cyan-400 to-blue-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
