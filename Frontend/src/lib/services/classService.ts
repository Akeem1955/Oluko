
import apiClient from './apiClient';
import { Course, CourseProgressResponse, Lesson } from '@/lib/types';

export const classService = {
  // ── Course listing ────────────────────────────────────────────────

  getCourses: async (): Promise<Course[]> => {
    const response = await apiClient.get<Course[]>('/api/v1/courses');
    return response.data;
  },

  getRecentCourses: async (): Promise<Course[]> => {
    const response = await apiClient.get<Course[]>('/api/v1/courses/recent');
    return response.data;
  },

  getCourseById: async (id: string): Promise<Course | undefined> => {
    try {
      const response = await apiClient.get<Course>(`/api/v1/courses/${id}`);
      return response.data;
    } catch {
      return undefined;
    }
  },

  // ── Lessons for a course ──────────────────────────────────────────

  getCourseLessons: async (courseId: string): Promise<Lesson[]> => {
    const response = await apiClient.get<Lesson[]>(`/api/v1/courses/${courseId}/lessons`);
    return response.data;
  },

  getCourseProgress: async (courseId: string): Promise<CourseProgressResponse> => {
    const response = await apiClient.get<CourseProgressResponse>(
      `/api/v1/courses/${courseId}/progress`,
    );
    return response.data;
  },

  completeLesson: async (
    courseId: string,
    lessonId: string,
  ): Promise<CourseProgressResponse> => {
    const response = await apiClient.post<CourseProgressResponse>(
      `/api/v1/courses/${courseId}/lessons/${lessonId}/complete`,
    );
    return response.data;
  },
};
