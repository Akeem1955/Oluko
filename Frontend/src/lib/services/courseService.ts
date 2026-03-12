import apiClient from './apiClient';
import {
  CourseGenerateResponse,
  CourseStatusResponse,
  Lesson,
} from '@/lib/types';

export const courseService = {
  /**
   * Trigger course generation.
   * Accepts topic text or a file upload via FormData.
   * Backend returns 202 Accepted with { courseId, status: "PENDING" }.
   */
  generate: async (formData: FormData): Promise<CourseGenerateResponse> => {
    const response = await apiClient.post<CourseGenerateResponse>(
      '/api/v1/courses/generate',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  /**
   * Poll course generation status.
   * Returns PENDING | GENERATING | READY | FAILED.
   */
  getStatus: async (courseId: string): Promise<CourseStatusResponse> => {
    const response = await apiClient.get<CourseStatusResponse>(
      `/api/v1/courses/${courseId}/status`,
    );
    return response.data;
  },

  /**
   * Fetch the generated syllabus / lesson list once status is READY.
   */
  getLessons: async (courseId: string): Promise<Lesson[]> => {
    const response = await apiClient.get<Lesson[]>(
      `/api/v1/courses/${courseId}/lessons`,
    );
    return response.data;
  },
};
