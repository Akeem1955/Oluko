import { useState, useCallback } from 'react';
import { livekitService } from '@/lib/services/livekitService';

interface UseLivekitTokenReturn {
  token: string | null;
  livekitUrl: string | null;
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async (lessonId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await livekitService.getToken(lessonId);
      setToken(res.token);
      setLivekitUrl(res.livekitUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch LiveKit token.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { token, livekitUrl, isLoading, error, fetchToken };
}
