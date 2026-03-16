import { useNavigate, useSearchParams } from "react-router-dom";
import { PlayCircle, ChevronLeft, Lock } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { Lesson } from "@/lib/types";
import { useState } from "react";

import { useCourseLessons } from "@/lib/hooks/useClasses";
import { useCourseProgress } from "@/lib/hooks/useClasses";

export function LessonUnitsList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const isConcentrationMode = searchParams.get("mode") === "concentration";

  const storedCourseId = localStorage.getItem("currentCourseId");
  const courseId = storedCourseId || null;

  const { data: courseLessons, isLoading: loading } =
    useCourseLessons(courseId);
  const { data: progress } = useCourseProgress(courseId);

  if (!courseId && !loading) {
    navigate("/classes");
    return null;
  }

  // ── Build lesson list from backend response ───────────────────────

  type UnifiedUnit = {
    id: string;
    order: number;
    title: string;
  };

  let units: UnifiedUnit[] = [];

  if (courseLessons && courseLessons.length > 0) {
    units = courseLessons.map((lesson: Lesson, idx: number) => ({
      id: lesson.id,
      order: lesson.orderIndex ?? idx + 1,
      title: lesson.title,
    })).sort((a, b) => a.order - b.order);
  }

  const highestCompletedOrder = progress?.highestCompletedOrder ?? 0;

  const handleUnitClick = (unit: UnifiedUnit) => {
    if (isNavigating) return;

    const isLocked = unit.order > highestCompletedOrder + 1;
    if (isLocked) return;

    setIsNavigating(true);

    if (isConcentrationMode) {
      navigate(`/teach-me/concentration/${unit.id}`, {
        replace: true,
        state: { lessonId: unit.id, unit, mode: "concentration" },
      });
      return;
    }

    // Navigate directly to lesson session with the lessonId
    navigate(`/teach-me/session/${unit.id}`, {
      replace: true,
      state: { lessonId: unit.id, unit },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen uppercase text-blue-600 font-bold flex items-center justify-center bg-gray-50 dark:bg-[#1a1b26] dark:text-white">
        Loading units...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#1a1b26]">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800 shrink-0 bg-white/95 dark:bg-[#1a1b26]/95 backdrop-blur-sm sticky top-0 z-10">
        <button
          onClick={() => navigate("/classes")}
          className="p-2 -ml-2 cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mr-2"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-xl md:text-2xl tracking-tight text-gray-900 dark:text-white truncate">
          Course Curriculum
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 max-w-4xl mx-auto w-full">
        <div className="flex flex-col gap-3 pb-6">
          {units.length > 0 ? (
            units.map((unit) => {
              return (
                <button
                  key={unit.id}
                  disabled={isNavigating || unit.order > highestCompletedOrder + 1}
                  onClick={() => handleUnitClick(unit)}
                  className={cn(
                    "group w-full p-4 md:p-5 rounded-2xl border-2 flex items-center justify-between text-left transition-all duration-300",
                    isNavigating
                      ? "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-60 cursor-not-allowed"
                      : unit.order > highestCompletedOrder + 1
                        ? "bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 opacity-65 cursor-not-allowed"
                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary/50 hover:shadow-md",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-8 h-8 md:w-12 md:h-12 shrink-0 rounded-full flex items-center justify-center font-bold text-lg md:text-xl transition-transform group-hover:scale-110",
                        "bg-slate-100 dark:bg-slate-800 text-slate-500",
                      )}
                    >
                      {unit.order}
                    </div>
                    <div className="min-w-0">
                      <h3
                        className="font-bold md:text-xl mb-1 transition-colors text-slate-900 dark:text-white"
                      >
                        {unit.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-center min-w-[40px] shrink-0">
                    {unit.order > highestCompletedOrder + 1 ? (
                      <div className="p-2 text-slate-300">
                        <Lock className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="p-2 text-slate-300 group-hover:text-primary transition-colors">
                        <PlayCircle className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center text-gray-500 mt-10">
              No units found for this class.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LessonUnitsList;
