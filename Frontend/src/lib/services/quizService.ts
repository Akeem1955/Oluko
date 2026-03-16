import apiClient from './apiClient';

export const quizService = {
  /**
   * Generate a quiz from a PDF for Concentration Mode.
   * Sends the file + page range; backend builds a hidden Quiz Bank
   * and returns 200 OK with { message }.
   */
  generateQuiz: async (
    file: File,
    startPage: number,
    endPage?: number,
  ): Promise<{ message: string; lessonId: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('startPage', startPage.toString());
    if (endPage != null) {
      formData.append('endPage', endPage.toString());
    }

    const response = await apiClient.post<{ message: string; lessonId: string }>(
      '/api/v1/lessons/generate-quiz-session',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },
};
