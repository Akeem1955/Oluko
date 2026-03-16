import { useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { LessonRoom } from "@/components/lesson/LessonRoom";
import { useCourseLessons, useCourseProgress } from "@/lib/hooks/useClasses";

/**
 * LessonSession — Now uses LiveKit for real-time voice interaction
 * with the Python AI Voice Agent instead of legacy WebSockets.
 *
 * The LiveKit room handles:
 * - Voice streaming (user mic → AI, AI voice → user speakers)
 * - Data channel for whiteboard visuals (images, canvas code)
 * - Connection state management
 */
export function LessonSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { state } = useLocation();
  const navigate = useNavigate();
  const unit = state?.unit;

  // sessionId doubles as lessonId for the LiveKit token fetch
  const lessonId = sessionId || unit?.id;

  const courseId = localStorage.getItem("currentCourseId");
  const { data: courseLessons = [] } = useCourseLessons(courseId || null);
  const { data: progress, isLoading: progressLoading } = useCourseProgress(courseId || null);

  useEffect(() => {
    if (!lessonId || !courseId || courseLessons.length === 0) return;

    if (progressLoading || !progress) return;
    const highestCompleted = progress.highestCompletedOrder;

    const orderedLessons = [...courseLessons].sort(
      (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
    );

    const lessonIndex = orderedLessons.findIndex((lesson) => lesson.id === lessonId);
    if (lessonIndex < 0) return;

    const selectedLesson = orderedLessons[lessonIndex];
    if (!selectedLesson) return;

    const lessonOrder = selectedLesson.orderIndex ?? lessonIndex + 1;
    if (lessonOrder > highestCompleted + 1) {
      navigate("/teach-me/class/units", { replace: true });
    }
  }, [lessonId, courseId, courseLessons, progress, progressLoading, navigate]);

  if (!lessonId) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4 max-w-md p-8">
          <h2 className="text-xl font-bold text-white">No Lesson Selected</h2>
          <p className="text-slate-400">
            Please select a lesson from your class to start.
          </p>
          <a
            href="/classes"
            className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Go to Classes
          </a>
        </div>
      </div>
    );
  }

  return (
    <LessonRoom
      lessonId={lessonId}
      lessonTitle={unit?.title}
    />
  );
}
