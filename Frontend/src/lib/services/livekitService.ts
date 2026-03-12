import apiClient from './apiClient';
import { LiveKitTokenResponse } from '@/lib/types';

export const livekitService = {
  /**
   * Fetch a secure LiveKit room token for a given lesson.
   * Backend returns { token, roomName, livekitUrl }.
   */
  getToken: async (lessonId: string): Promise<LiveKitTokenResponse> => {
    const response = await apiClient.get<LiveKitTokenResponse>(
      `/api/v1/livekit/token`,
      { params: { lessonId } },
    );
    return response.data;
  },
};
