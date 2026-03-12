import React from "react";
import { ArrowRight, RotateCcw } from "lucide-react";

interface LessonControlsProps {
  onNext: () => void;
  onComeAgain: () => void;
  canProceed: boolean;
}

export const LessonControls: React.FC<LessonControlsProps> = ({
  onNext,
  onComeAgain,
  canProceed,
}) => {
  return (
    <div className="flex flex-col gap-3 mt-auto">
      {/* Next Step Button */}
      <button
        onClick={onNext}
        disabled={!canProceed}
        className={`w-full py-4 px-6 rounded-xl font-semibold text-base transition-all duration-300 flex items-center justify-center gap-2 ${
          canProceed
            ? "bg-linear-to-r from-primary to-blue-700 hover:from-primary-dark hover:to-blue-800 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5"
            : "bg-white/10 text-white/40 cursor-not-allowed"
        }`}
        title={
          canProceed
            ? "Proceed to next step"
            : "Wait for the tutor to finish speaking"
        }
      >
        {canProceed ? (
          <>
            Next Step
            <ArrowRight className="w-5 h-5" />
          </>
        ) : (
          "Please wait..."
        )}
      </button>

      {/* Come Again Button */}
      <button
        onClick={onComeAgain}
        className="w-full py-4 px-6 rounded-xl font-semibold text-base bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm"
      >
        <RotateCcw className="w-4 h-4" />
        Come Again
      </button>
    </div>
  );
};
