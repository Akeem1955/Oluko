import { create } from 'zustand';
import { courseService } from '@/lib/services/courseService';
import { useToastStore } from './toastStore';
import { CourseStatus } from '@/lib/types';

const POLL_INTERVAL_MS = 2500;

interface GeneratingCourse {
  courseId: string;
  topic: string;
  status: CourseStatus;
}

interface CourseGenerationState {
  generatingCourses: GeneratingCourse[];
  startPolling: (courseId: string, topic: string) => void;
  removeGenerating: (courseId: string) => void;
  isGenerating: (courseId: string) => boolean;
}

const pollingIntervals = new Map<string, ReturnType<typeof setInterval>>();

export const useCourseGenerationStore = create<CourseGenerationState>((set, get) => ({
  generatingCourses: [],

  startPolling: (courseId: string, topic: string) => {
    // Add to list
    set((state) => ({
      generatingCourses: [
        ...state.generatingCourses.filter((c) => c.courseId !== courseId),
        { courseId, topic, status: 'PENDING' as CourseStatus },
      ],
    }));

    // Don't start duplicate polling
    if (pollingIntervals.has(courseId)) return;

    const poll = async () => {
      try {
        const res = await courseService.getStatus(courseId);

        set((state) => ({
          generatingCourses: state.generatingCourses.map((c) =>
            c.courseId === courseId ? { ...c, status: res.status } : c
          ),
        }));

        if (res.status === 'READY') {
          const interval = pollingIntervals.get(courseId);
          if (interval) clearInterval(interval);
          pollingIntervals.delete(courseId);

          useToastStore.getState().addToast(
            `"${res.title || topic}" is ready!`,
            'success'
          );

          // Remove from generating list after a brief delay so the UI can react
          setTimeout(() => {
            set((state) => ({
              generatingCourses: state.generatingCourses.filter(
                (c) => c.courseId !== courseId
              ),
            }));
          }, 500);
        } else if (res.status === 'FAILED') {
          const interval = pollingIntervals.get(courseId);
          if (interval) clearInterval(interval);
          pollingIntervals.delete(courseId);

          useToastStore.getState().addToast(
            `Course generation for "${topic}" failed.`,
            'error'
          );

          set((state) => ({
            generatingCourses: state.generatingCourses.filter(
              (c) => c.courseId !== courseId
            ),
          }));
        }
      } catch {
        // Silent retry — network blip shouldn't kill polling
      }
    };

    // Poll immediately, then every 2.5s
    poll();
    pollingIntervals.set(courseId, setInterval(poll, POLL_INTERVAL_MS));
  },

  removeGenerating: (courseId: string) => {
    const interval = pollingIntervals.get(courseId);
    if (interval) clearInterval(interval);
    pollingIntervals.delete(courseId);
    set((state) => ({
      generatingCourses: state.generatingCourses.filter(
        (c) => c.courseId !== courseId
      ),
    }));
  },

  isGenerating: (courseId: string) => {
    return get().generatingCourses.some((c) => c.courseId === courseId);
  },
}));
