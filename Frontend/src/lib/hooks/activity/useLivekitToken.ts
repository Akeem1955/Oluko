import { useState, useCallback } from 'react';
import { livekitService } from '@/lib/services/livekitService';

interface UseLivekitTokenReturn {
  token: string | null;
  livekitUrl: string | null;
  hasResume: boolean;
  resumeCompletionPercent: number;
  resumeSummary: string;
  isLoading: boolean;
  error: string | null;
  fetchToken: (lessonId: string) => Promise<void>;
}

/**
 * Hook to fetch a LiveKit room token for a given lesson.
 * Call `fetchToken(lessonId)` before mounting the LiveKitRoom component.
 */
export function useLivekitToken(): UseLivekitTokenReturn {
  const [token, setToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
  const [hasResume, setHasResume] = useState(false);
  const [resumeCompletionPercent, setResumeCompletionPercent] = useState(0);
  const [resumeSummary, setResumeSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async (lessonId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await livekitService.getToken(lessonId);
      setToken(res.token);
      setLivekitUrl(res.livekitUrl);
      setHasResume(Boolean(res.hasResume));
      setResumeCompletionPercent(res.resumeCompletionPercent || 0);
      setResumeSummary(res.resumeSummary || '');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch LiveKit token.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    token,
    livekitUrl,
    hasResume,
    resumeCompletionPercent,
    resumeSummary,
    isLoading,
    error,
    fetchToken,
  };
}
