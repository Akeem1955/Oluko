import apiClient from './apiClient';

export const quizService = {
  /**
   * Generate a quiz from a PDF for Concentration Mode.
   * Sends the file + page range; backend builds a hidden Quiz Bank
   * and returns 200 OK with { message }.
   */
  generateQuiz: async (
    lessonId: string,
    file: File,
    startPage: number,
    endPage?: number,
  ): Promise<{ message: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('startPage', startPage.toString());
    if (endPage != null) {
      formData.append('endPage', endPage.toString());
    }

    const response = await apiClient.post<{ message: string }>(
      `/api/v1/lessons/${lessonId}/generate-quiz`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },
};
