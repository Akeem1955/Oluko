import { useState, useEffect, useRef, useCallback } from 'react';
import { courseService } from '@/lib/services/courseService';
import {
  CourseGenerateResponse,
  CourseStatusResponse,
  CourseStatus,
} from '@/lib/types';

const POLL_INTERVAL_MS = 2500;

interface UseCourseGenerationReturn {
  courseId: string | null;
  status: CourseStatus | null;
  title: string | null;
  error: string | null;
  isGenerating: boolean;
  isReady: boolean;
  generate: (formData: FormData) => Promise<void>;
}

/**
 * Hook implementing the 202 Accepted async polling flow.
 *
 * 1. Call `generate(formData)` to trigger course creation.
 * 2. The hook automatically polls GET /courses/{courseId}/status every 2.5s.
 * 3. When status becomes READY, polling stops and `isReady` becomes true.
 */
export function useCourseGeneration(): UseCourseGenerationReturn {
  const [courseId, setCourseId] = useState<string | null>(null);
  const [status, setStatus] = useState<CourseStatus | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // Start polling when courseId is set and status is not terminal
  useEffect(() => {
    if (!courseId || status === 'READY' || status === 'FAILED') return;

    const poll = async () => {
      try {
        const res: CourseStatusResponse = await courseService.getStatus(courseId);
        setStatus(res.status);
        if (res.title) setTitle(res.title);

        if (res.status === 'READY') {
          setIsGenerating(false);
          stopPolling();
        } else if (res.status === 'FAILED') {
          setError('Course generation failed.');
          setIsGenerating(false);
          stopPolling();
        }
      } catch (err: any) {
        setError(err.message || 'Failed to check course status.');
        setIsGenerating(false);
        stopPolling();
      }
    };

    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    // Also poll immediately
    poll();

    return () => stopPolling();
  }, [courseId, status, stopPolling]);

  const generate = useCallback(async (formData: FormData) => {
    setError(null);
    setIsGenerating(true);
    setStatus(null);
    setTitle(null);

    try {
      const res: CourseGenerateResponse = await courseService.generate(formData);
      setCourseId(res.courseId);
      setStatus(res.status); // will be 'PENDING' — triggers polling
    } catch (err: any) {
      setError(err.message || 'Failed to start course generation.');
      setIsGenerating(false);
    }
  }, []);

  return {
    courseId,
    status,
    title,
    error,
    isGenerating,
    isReady: status === 'READY',
    generate,
  };
}
