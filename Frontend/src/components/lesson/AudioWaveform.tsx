import React from "react";

interface AudioWaveformProps {
  isActive: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ isActive }) => {
  const bars = Array.from({ length: 32 }, (_, i) => i);

  return (
    <div className="relative bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
      <div className="flex items-center justify-center h-16 gap-[3px]">
        {bars.map((i) => {
          const height = isActive
            ? Math.random() * 60 + 20
            : 15 + Math.sin(i * 0.5) * 5;
          return (
            <div
              key={i}
              className={`w-1.5 rounded-full transition-all ${
                isActive
                  ? "bg-linear-to-t from-cyan-500 to-blue-400"
                  : "bg-white/30"
              }`}
              style={{
                height: `${height}%`,
                transitionDuration: isActive ? "100ms" : "300ms",
                animationDelay: `${i * 50}ms`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
