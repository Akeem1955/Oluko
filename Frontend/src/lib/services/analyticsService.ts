import apiClient from './apiClient';
import { StudyAnalyticsOverview } from '@/lib/types';

export const analyticsService = {
  getOverview: async (): Promise<StudyAnalyticsOverview> => {
    const response = await apiClient.get<StudyAnalyticsOverview>('/api/v1/analytics/overview');
    return response.data;
  },
};
