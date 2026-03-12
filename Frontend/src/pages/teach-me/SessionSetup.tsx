import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LoadingScreen } from "@/components/lesson/LoadingScreen";
import { useToastStore } from "@/lib/store/toastStore";

/**
 * SessionSetup — Lightweight transition page.
 *
 * In the new LiveKit architecture this page simply validates that a
 * lessonId is available (either passed directly in `state.lessonId` or
 * derived from `state.unit.id`) and then redirects to the LiveKit
 * lesson room. The LessonRoom component handles token fetching.
 */
export function SessionSetup() {
  const hasStarted = useRef(false);
  const { state } = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    // Resolve the lessonId from multiple possible sources
    const lessonId: string | undefined =
      state?.lessonId ?? state?.unit?.id ?? state?.unit?.lessonId;

    if (!lessonId) {
      addToast("No lesson selected. Please choose a lesson first.", "error");
      navigate("/teach-me/class/units", { replace: true });
      return;
    }

    // Small delay so the loading screen is visible briefly
    const timeout = setTimeout(() => {
      navigate(`/teach-me/session/${lessonId}`, {
        replace: true,
        state: { unit: state?.unit, fromSetup: true },
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [state, navigate, addToast]);

  return <LoadingScreen progress={30} message="Preparing your lesson..." />;
}
