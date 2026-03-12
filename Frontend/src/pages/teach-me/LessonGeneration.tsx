import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { LoadingScreen } from "@/components/lesson/LoadingScreen";
import { useToastStore } from "@/lib/store/toastStore";
import { useCourseGeneration } from "@/lib/hooks/activity/useCourseGeneration";

/**
 * LessonGeneration — Implements the 202 Accepted Polling Flow.
 *
 * 1. User submits a topic/PDF/video → POST /api/v1/courses/generate
 * 2. Backend instantly returns { courseId, status: "PENDING" }
 * 3. This page polls GET /api/v1/courses/{courseId}/status every 2.5s
 * 4. When status is READY → navigate to classes with the new course
 */
export function LessonGeneration() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const hasInitialized = useRef(false);

  const {
    courseId,
    status: courseStatus,
    title: courseTitle,
    error,
    isReady,
    generate,
  } = useCourseGeneration();

  // Trigger generation on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (!state?.topic && !state?.file && !state?.videoFile) {
      navigate("/teach-me");
      return;
    }

    const formData = new FormData();

    if (state.topic) {
      formData.append("learningMode", "TOPIC");
      formData.append("topic", state.topic);
    } else if (state.videoFile) {
      formData.append("learningMode", "VIDEO");
      formData.append("file", state.videoFile);
    } else if (state.file) {
      formData.append("learningMode", "DOCUMENT");
      formData.append("file", state.file);
    }

    if (state.targetLanguage) {
      formData.append("targetLanguage", state.targetLanguage);
    } else {
      formData.append("targetLanguage", "English");
    }

    generate(formData);
  }, []);

  // Navigate when course is ready
  useEffect(() => {
    if (isReady && courseId) {
      queryClient.invalidateQueries({ queryKey: ["classes"] });

      localStorage.setItem("currentCourseId", courseId);

      setTimeout(() => {
        navigate("/classes", {
          state: {
            newCourseId: courseId,
            message: `"${courseTitle || "Your course"}" created successfully!`,
          },
          replace: true,
        });
      }, 300);
    }
  }, [isReady, courseId, courseTitle, navigate, queryClient]);

  // Handle errors
  useEffect(() => {
    if (error) {
      addToast(error, "error");
      setTimeout(() => navigate("/teach-me/topic"), 3000);
    }
  }, [error, addToast, navigate]);

  // Map polling status to progress percentage and message
  const getProgressInfo = () => {
    if (error) return { progress: 0, message: error };

    switch (courseStatus) {
      case "PENDING":
        return {
          progress: 15,
          message: `Digesting "${state?.topic || "your materials"}"...`,
        };
      case "GENERATING":
        return { progress: 55, message: "Structuring lesson modules..." };
      case "READY":
        return { progress: 100, message: "Curriculum ready!" };
      default:
        return {
          progress: 5,
          message: `Analyzing "${state?.topic || "your input"}"...`,
        };
    }
  };

  const { progress, message } = getProgressInfo();

  return <LoadingScreen progress={progress} message={message} />;
}
