import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/lib/services/analyticsService';

export const useStudyAnalytics = () => {
  return useQuery({
    queryKey: ['study-analytics', 'overview'],
    queryFn: analyticsService.getOverview,
    staleTime: 1000 * 60,
  });
};
