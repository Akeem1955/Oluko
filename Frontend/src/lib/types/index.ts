

export interface UserStats {
  currentStreak: number;
  totalMinutesSpent: number;
  lessonsCompleted: number;
  globalRank: number;
  weeklyGoalHours: number;
  lastActiveAt: string;
}

export interface User {
  email: string;
  fullName: string;
  profilePicture?: string;
  availableToken: number;
  createdAt: string;
  stats: UserStats;
}

export interface AuthResponse {
  token: string;
}

export interface ApiError {
  message: string;
  status: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  fullName: string;
  password: string;
}

export interface OtpRequest {
  otp: string;
  email: string;
}

// ─── Olùkọ́ Backend Domain Types ──────────────────────────────────────────

/** Matches backend LearningMode enum exactly */
export type LearningMode = 'TOPIC' | 'DOCUMENT' | 'VIDEO';

/** Matches backend CourseStatus enum exactly */
export type CourseStatus = 'PENDING' | 'GENERATING' | 'READY' | 'FAILED';

/** Course entity as returned by the backend */
export interface Course {
  id: string;
  title: string;
  learningMode: LearningMode;
  targetLanguage: string;
  status: CourseStatus;
  lessons: Lesson[];
  createdAt: string;
}

/** Lesson entity as returned by GET /courses/{courseId}/lessons */
export interface Lesson {
  id: string;
  orderIndex: number;
  title: string;
  objective?: string;
}

export interface CourseGenerateResponse {
  courseId: string;
  status: CourseStatus;
  message?: string;
}

export interface CourseStatusResponse {
  courseId: string;
  status: CourseStatus;
  title?: string;
}

export interface CourseProgressResponse {
  highestCompletedOrder: number;
  nextUnlockedOrder: number;
}

export interface StudyAnalyticsItem {
  id: string;
  type: 'QUIZ' | 'LESSON';
  lessonTitle: string;
  masteryScore: number;
  clarityScore: number;
  retentionScore: number;
  quizAccuracy?: number | null;
  strengths?: string;
  weakAreas?: string;
  recommendation?: string;
  createdAt: string;
}

export interface StudyAnalyticsOverview {
  totalSessions: number;
  quizSessions: number;
  lessonSessions: number;
  avgMasteryScore: number;
  avgQuizAccuracy: number;
  recentSessions: StudyAnalyticsItem[];
}

/** Matches backend LiveKit token response: { token, roomName, livekitUrl } */
export interface LiveKitTokenResponse {
  token: string;
  roomName: string;
  livekitUrl: string;
  hasResume?: boolean;
  resumeCompletionPercent?: number;
  resumeSummary?: string;
}

export type VisualMode = 'idle' | 'loading' | 'image' | 'canvas' | 'quiz' | 'error';

export interface WhiteboardPayload {
  type: 'TOOL_PROCESSING' | 'TOOL_CALL_RESULT' | 'TOOL_ERROR';
  action?: 'image' | 'canvas' | 'quiz' | 'end_session';
  url?: string;
  payload?: string;
  message?: string;
}

export interface QuizGenerateRequest {
  lessonId: string;
  file?: File;
  startPage?: number;
  endPage?: number;
}
